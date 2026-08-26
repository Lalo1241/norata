/* Abrir la caja: pide a Stripe una pagina de cobro y devuelve su direccion */

/* ================= Por que esto no puede vivir en la app =================
   Crear una pagina de cobro exige la llave secreta de Stripe, y cualquier
   llave que llegue al navegador es publica: quien abra las herramientas del
   navegador se la lleva y con ella puede leer los cobros de todo el mundo,
   emitir reembolsos y darse de alta suscripciones. Por eso esto corre en el
   servidor, igual que `bienvenida`.

   Pero OJO con la conclusion facil: que el cobro no pueda vivir en el
   navegador NO significa que el boton de pagar no pueda estar en la app. La
   app no cobra; llama aqui, recibe una direccion de stripe.com y abre esa
   pagina. Los datos de la tarjeta nunca pasan por Norata ni por GitHub Pages,
   ni siquiera de paso. La landing hace exactamente lo mismo, con la unica
   diferencia de que alli todavia no hay sesion iniciada.

   El impedimento real de cobrar dentro de la app no es GitHub Pages: es la
   regla de Google Play, que exige su propio cobro para lo que se venda dentro
   de una app publicada alli. Eso aplica el dia que exista esa app. Mientras
   Norata sea web, cobrar desde la web es lo normal y lo correcto.

   ---- Como se pone en marcha ----

     supabase secrets set STRIPE_SECRETA=sk_live_xxxxxxxx
     supabase secrets set STRIPE_PRECIO_MENSUAL=price_xxx
     supabase secrets set STRIPE_PRECIO_ANUAL=price_xxx
     supabase secrets set STRIPE_PRECIO_FUNDADOR=price_xxx
     supabase functions deploy pagar

   `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` las pone Supabase sola.

   Mientras no se despliegue, la app llama a una direccion que no existe y
   avisa de que el pago todavia no esta disponible. No se rompe nada. */

const STRIPE = "https://api.stripe.com/v1";

/* De donde se acepta la llamada. Con `*` cualquier pagina del mundo podria
   pedirle al navegador de un usuario que dispare esto. Aqui importa mas que
   en `bienvenida`: el final del camino es una pagina que pide una tarjeta, y
   una pagina ajena que pueda lanzarla es media estafa ya montada.

   La landing va en esta lista en cuanto tenga direccion definitiva. */
const PERMITIDOS = [
  "https://mi.norata.app",
  "https://norata.app",
  "https://www.norata.app",
  "http://localhost:8123",
];

/* A donde vuelve la persona despues de pagar o de arrepentirse. NO se aceptan
   desde el cuerpo de la peticion, y esa es una decision de seguridad, no de
   comodidad: un `success_url` que llegue de fuera convierte esta funcion en
   un trampolin para mandar gente a cualquier sitio con la marca de Stripe
   detras. Se eligen aqui, de una lista cerrada. */
const VUELTA_BIEN = "https://mi.norata.app/?pago=listo";
const VUELTA_MAL = "https://mi.norata.app/?pago=cancelado";

/* Los tres planes, y de que forma se cobra cada uno. Fundador es `payment`
   —un cobro y ya— y los otros dos `subscription`. Es la unica diferencia
   real entre ellos en todo este archivo. */
const PLANES: Record<string, { modo: string; precio: string }> = {
  mensual: { modo: "subscription", precio: "STRIPE_PRECIO_MENSUAL" },
  anual: { modo: "subscription", precio: "STRIPE_PRECIO_ANUAL" },
  fundador: { modo: "payment", precio: "STRIPE_PRECIO_FUNDADOR" },
};

function cabecerasCORS(origen: string | null) {
  const ok = origen && PERMITIDOS.includes(origen) ? origen : PERMITIDOS[0];
  return {
    "Access-Control-Allow-Origin": ok,
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function responder(cuerpo: unknown, estado: number, origen: string | null) {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { "Content-Type": "application/json", ...cabecerasCORS(origen) },
  });
}

/* Stripe no habla JSON en las peticiones: quiere formulario, y los objetos
   anidados se escriben con corchetes en el nombre del campo. Se hace a mano
   y no con su libreria porque este proyecto no tiene paso de compilacion y
   no va a empezar a tenerlo por un `POST`. */
async function stripe(ruta: string, campos: Record<string, string>, llave: string) {
  const cuerpo = new URLSearchParams(campos);
  const res = await fetch(STRIPE + ruta, {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + llave,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: cuerpo,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error((json && json.error && json.error.message) || "Stripe respondio " + res.status);
  }
  return json;
}

Deno.serve(async (req: Request) => {
  const origen = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cabecerasCORS(origen) });
  }
  if (req.method !== "POST") {
    return responder({ error: "Metodo no permitido" }, 405, origen);
  }

  const SB = Deno.env.get("SUPABASE_URL");
  const SERVICIO = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const LLAVE = Deno.env.get("STRIPE_SECRETA");
  if (!SB || !SERVICIO || !LLAVE) {
    return responder({ error: "Falta configurar el servidor" }, 500, origen);
  }

  /* Quien pide el cobro. La app manda su sesion; aqui se le pregunta a
     Supabase de quien es. No se acepta un `user_id` en el cuerpo por la razon
     de siempre: seria decirle al navegador "dime a nombre de quien apunto
     esto", y entonces cualquiera podria pagar la suscripcion de otro... o,
     lo que si importa, reclamar la de otro. */
  const auth = req.headers.get("authorization") || "";
  const quien = await fetch(SB + "/auth/v1/user", {
    headers: { "Authorization": auth, "apikey": SERVICIO },
  });
  if (!quien.ok) {
    return responder({ error: "Entra con tu cuenta antes de pagar." }, 401, origen);
  }
  const usuario = await quien.json();
  const uid = usuario.id as string;
  const correo = usuario.email as string;
  const saludo = ((usuario.user_metadata || {}).saludo || "") as string;

  let cuerpo: Record<string, unknown> = {};
  try {
    cuerpo = await req.json();
  } catch (_e) { /* cuerpo vacio: cae en el error de plan de abajo */ }

  /* ---- El portal: cancelar, cambiar de tarjeta, ver los recibos ----
     Lo sirve Stripe entero. Construirlo aqui seria reimplementar mal cinco
     pantallas que ellos ya tienen traducidas, y ademas cancelar tiene que
     poderse SIEMPRE, incluso el dia que Norata este caida. */
  if (cuerpo.que === "portal") {
    const fila = await fetch(
      SB + "/rest/v1/suscripciones?select=cliente&user_id=eq." + uid,
      { headers: { "Authorization": "Bearer " + SERVICIO, "apikey": SERVICIO } },
    );
    const filas = await fila.json();
    const cliente = Array.isArray(filas) && filas.length ? filas[0].cliente : null;
    if (!cliente) {
      return responder({ error: "Todavia no hay ningun pago en esta cuenta." }, 400, origen);
    }
    const sesion = await stripe("/billing_portal/sessions", {
      customer: cliente,
      return_url: "https://mi.norata.app/?pago=portal",
      locale: "es-419",
    }, LLAVE);
    return responder({ url: sesion.url }, 200, origen);
  }

  /* ---- Comprar ---- */
  const nombrePlan = String(cuerpo.plan || "");
  const def = PLANES[nombrePlan];
  if (!def) {
    return responder({ error: "Ese plan no existe." }, 400, origen);
  }
  const precio = Deno.env.get(def.precio);
  if (!precio) {
    return responder({ error: "Ese plan todavia no esta a la venta." }, 503, origen);
  }

  /* El cupo de fundador se mira ANTES de abrir la caja. No es infalible —dos
     personas pueden entrar en el mismo segundo con un lugar libre— y a
     proposito no se intenta que lo sea: cerrar la puerta con un candado
     perfecto exigiria reservar el lugar mientras la persona teclea su
     tarjeta, y quien abandone el pago se lleva un lugar al limbo. Pasarse por
     uno o dos no le hace dano a nadie; negarle el plan a alguien que ya pago
     si. Ver la nota del webhook. */
  if (nombrePlan === "fundador") {
    const r = await fetch(SB + "/rest/v1/rpc/lugares_fundador", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + SERVICIO,
        "apikey": SERVICIO,
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    const quedan = await r.json();
    if (typeof quedan === "number" && quedan <= 0) {
      return responder({ error: "Los lugares de fundador ya se agotaron.", agotado: true }, 409, origen);
    }
  }

  /* Si ya compro antes, se reusa su cliente de Stripe. Sin esto, la segunda
     compra de la misma persona crea un cliente nuevo, el indice unico de
     `cliente` en la tabla revienta y el webhook no sabe a quien apuntar. */
  const previa = await fetch(
    SB + "/rest/v1/suscripciones?select=cliente&user_id=eq." + uid,
    { headers: { "Authorization": "Bearer " + SERVICIO, "apikey": SERVICIO } },
  );
  const previas = await previa.json();
  const clienteYa = Array.isArray(previas) && previas.length ? previas[0].cliente : null;

  const campos: Record<string, string> = {
    "mode": def.modo,
    "line_items[0][price]": precio,
    "line_items[0][quantity]": "1",
    "success_url": VUELTA_BIEN,
    "cancel_url": VUELTA_MAL,
    "locale": "es-419",
    /* Lo que ata el pago a la persona. Stripe lo devuelve tal cual en el
       aviso, y es lo que lee el webhook. Sin esto habria que adivinar por el
       correo, y quien pague con el correo del trabajo se queda sin plan. */
    "client_reference_id": uid,
    "metadata[user_id]": uid,
    "metadata[plan]": nombrePlan,
    /* Que pueda meter un cupon. Cuesta un campo y ahorra tener que desplegar
       de nuevo el dia que quiera hacer una promocion. */
    "allow_promotion_codes": "true",
  };

  if (clienteYa) {
    campos["customer"] = clienteYa;
  } else {
    campos["customer_email"] = correo;
    /* Que Stripe guarde el cliente aunque sea pago unico. En `payment` no lo
       hace solo, y sin cliente no hay portal ni recibos, que es justo lo que
       el fundador —el que mas paga— va a querer ver. */
    if (def.modo === "payment") campos["customer_creation"] = "always";
  }

  /* Las etiquetas viajan por duplicado a proposito. El aviso de una
     suscripcion que se renueva sola dentro de un ano NO trae el
     `client_reference_id` de la compra original: trae la suscripcion. Si el
     `user_id` no esta pegado a ella, la renovacion llega sin dueno. Ya paso
     en otros proyectos y se descubre doce meses despues, que es el peor
     momento posible para descubrirlo. */
  if (def.modo === "subscription") {
    campos["subscription_data[metadata][user_id]"] = uid;
    campos["subscription_data[metadata][plan]"] = nombrePlan;
  } else {
    campos["payment_intent_data[metadata][user_id]"] = uid;
    campos["payment_intent_data[metadata][plan]"] = nombrePlan;
  }

  /* Solo para que el recibo no diga "cliente sin nombre". No se manda si
     esta vacio: un campo vacio en Stripe se ve peor que no mandarlo. */
  if (saludo) campos["metadata[saludo]"] = saludo;

  try {
    const sesion = await stripe("/checkout/sessions", campos, LLAVE);
    return responder({ url: sesion.url }, 200, origen);
  } catch (e) {
    return responder({ error: "No se pudo abrir el pago: " + (e as Error).message }, 502, origen);
  }
});
