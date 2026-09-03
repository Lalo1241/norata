/* El aviso de Stripe: la unica mano que escribe quien pago */

/* ================= Que es esto y por que es el eje =================
   Cuando alguien paga, cuando se le renueva, cuando cancela y cuando le falla
   la tarjeta, Stripe llama a esta direccion. Esta funcion es LO UNICO en todo
   el proyecto que escribe en la tabla `suscripciones`. Ni la app, ni la
   landing, ni el propio dueno de la fila pueden tocarla: no hay ninguna
   politica de escritura (ver `supabase/planes.sql`).

   Eso es lo que hace que nadie pueda regalarse un plan. La app le cree a la
   base; la base solo le cree a esta funcion; y esta funcion solo le cree a un
   mensaje firmado por Stripe.

   ---- Tres decisiones que conviene no deshacer ----

   1. **La firma se comprueba SIEMPRE y es lo primero.** Sin ella, esta
      direccion es publica y cualquiera puede mandarle un JSON diciendo
      "fulano pago el plan de por vida". La direccion de una funcion de
      Supabase no es un secreto: se ve en la pestana de red del navegador en
      cuanto alguien abre la landing.

   2. **No se cree lo que viene en el aviso: se vuelve a preguntar.** Stripe
      no garantiza el orden de entrega, y reintenta los avisos que fallan
      durante tres dias. Un "se cancelo" que llega tarde, despues del "se
      renovo", dejaria cancelada una suscripcion viva. Volver a pedirle a
      Stripe el estado actual de la suscripcion cuesta una llamada y hace que
      el orden deje de importar. Ya no hay avisos viejos: hay avisos.

   3. **Nunca se llama con `verify_jwt`.** Stripe no tiene sesion de Supabase
      y no puede mandar una. Al desplegar hay que decirlo explicitamente o
      todos los avisos rebotan con un 401 y el negocio deja de funcionar sin
      que nadie se entere.

   ---- Como se pone en marcha ----

     supabase secrets set STRIPE_SECRETA=sk_live_xxxxxxxx
     supabase secrets set STRIPE_FIRMA=whsec_xxxxxxxx
     supabase secrets set STRIPE_PRECIO_MENSUAL=price_xxx
     supabase secrets set STRIPE_PRECIO_ANUAL=price_xxx
     supabase secrets set STRIPE_PRECIO_FUNDADOR=price_xxx
     supabase functions deploy cobro --no-verify-jwt

   Y en Stripe: Developers -> Webhooks -> Add endpoint, apuntando a
   https://<proyecto>.supabase.co/functions/v1/cobro , con estos sucesos:

     checkout.session.completed
     customer.subscription.updated
     customer.subscription.deleted
     invoice.paid
     invoice.payment_failed
     charge.refunded

   El `whsec_` sale de ahi mismo, despues de crear el endpoint.

   ---- OJO CON EL SEXTO ----
   `charge.refunded` se anadio despues, el 3 de septiembre de 2026. Si el
   endpoint ya existia en Stripe hay que ir a editarlo y marcarlo a mano: el
   codigo de aqui abajo no corre nunca si Stripe no manda el aviso, y no hay
   ninguna senal de que falte. Se descubriria el dia que se devuelva un
   Fundador, que es justo cuando ya es tarde. */

const STRIPE = "https://api.stripe.com/v1";

/* Cinco minutos de margen entre la hora del aviso y la de ahora. Es lo que
   recomienda Stripe: suficiente para un reloj mal puesto, poco para que
   alguien reutilice un aviso que interceptara ayer. */
const MARGEN_SEGUNDOS = 300;

/* ---- La firma ----
   Stripe manda una cabecera `t=<hora>,v1=<firma>`. La firma es un HMAC-SHA256
   de "<hora>.<cuerpo tal cual llego>" con el secreto del endpoint.

   El cuerpo tiene que ser el TEXTO EXACTO que llego. Pasarlo por JSON.parse y
   volver a serializarlo cambia espacios y orden, y la firma deja de cuadrar
   para siempre: es el fallo clasico de esta funcion y no da ninguna pista,
   solo un rechazo constante. */
async function firmaValida(cuerpo: string, cabecera: string, secreto: string) {
  const partes: Record<string, string> = {};
  for (const trozo of cabecera.split(",")) {
    const i = trozo.indexOf("=");
    if (i > 0) partes[trozo.slice(0, i).trim()] = trozo.slice(i + 1).trim();
  }
  const t = Number(partes["t"]);
  const v1 = partes["v1"];
  if (!t || !v1) return false;

  if (Math.abs(Date.now() / 1000 - t) > MARGEN_SEGUNDOS) return false;

  const llave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secreto),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const bytes = await crypto.subtle.sign("HMAC", llave, new TextEncoder().encode(t + "." + cuerpo));
  const esperada = Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  /* Comparacion de tiempo constante. Con `===` el tiempo que tarda en fallar
     depende de cuantos caracteres coincidieron, y eso —despacio, con muchos
     intentos— deja adivinar la firma. Es paranoico para el volumen que va a
     tener esto, y aun asi cuesta cuatro lineas. */
  if (esperada.length !== v1.length) return false;
  let diferencia = 0;
  for (let i = 0; i < esperada.length; i++) diferencia |= esperada.charCodeAt(i) ^ v1.charCodeAt(i);
  return diferencia === 0;
}

async function stripeGet(ruta: string, llave: string) {
  const res = await fetch(STRIPE + ruta, { headers: { "Authorization": "Bearer " + llave } });
  const json = await res.json();
  if (!res.ok) throw new Error((json?.error?.message) || "Stripe respondio " + res.status);
  return json;
}

/* De que plan es un precio. Se resuelve por los identificadores guardados en
   los secretos y no por el importe: el dia que suba el precio, los cobros
   viejos siguen siendo del mismo plan. */
function planDePrecio(precioId: string): string | null {
  if (precioId && precioId === Deno.env.get("STRIPE_PRECIO_MENSUAL")) return "mensual";
  if (precioId && precioId === Deno.env.get("STRIPE_PRECIO_ANUAL")) return "anual";
  if (precioId && precioId === Deno.env.get("STRIPE_PRECIO_FUNDADOR")) return "fundador";
  return null;
}

/* Lo que dice Stripe, traducido a las cinco palabras de la tabla. Se traduce
   aqui y no en la app para que el dia que Stripe invente un estado nuevo haya
   UN sitio que cambiar y no cuatro pantallas. */
function estadoDe(s: string): string {
  if (s === "active") return "activa";
  if (s === "trialing") return "prueba";
  if (s === "past_due" || s === "unpaid") return "impago";
  if (s === "canceled" || s === "incomplete_expired") return "cancelada";
  return "ninguna";
}

async function guardar(SB: string, SERVICIO: string, uid: string, fila: Record<string, unknown>) {
  const res = await fetch(SB + "/rest/v1/suscripciones?on_conflict=user_id", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + SERVICIO,
      "apikey": SERVICIO,
      "Content-Type": "application/json",
      /* `merge-duplicates` convierte el insert en "insertar o actualizar".
         Sin esto, la segunda compra de la misma persona choca con la clave
         primaria y el aviso se queda sin aplicar. */
      "Prefer": "resolution=merge-duplicates",
    },
    body: JSON.stringify(Object.assign({ user_id: uid, actualizado: new Date().toISOString() }, fila)),
  });
  if (!res.ok) throw new Error("No se pudo guardar: " + (await res.text()));
}

/* A quien pertenece este cobro. Tres caminos, en orden de fiabilidad, y el
   ultimo existe porque las renovaciones automaticas de dentro de un ano solo
   traen el cliente. */
async function duenoDe(
  SB: string,
  SERVICIO: string,
  meta: Record<string, string> | undefined,
  referencia: string | undefined,
  cliente: string | undefined,
): Promise<string | null> {
  if (meta && meta.user_id) return meta.user_id;
  if (referencia) return referencia;
  if (cliente) {
    const r = await fetch(
      SB + "/rest/v1/suscripciones?select=user_id&cliente=eq." + encodeURIComponent(cliente),
      { headers: { "Authorization": "Bearer " + SERVICIO, "apikey": SERVICIO } },
    );
    const filas = await r.json();
    if (Array.isArray(filas) && filas.length) return filas[0].user_id;
  }
  return null;
}

/* Vuelve a preguntarle a Stripe como esta ESA suscripcion ahora mismo, y
   escribe eso. Ver la decision 2 de arriba: da igual que el aviso llegue
   tarde, repetido o desordenado. */
async function aplicarSuscripcion(
  SB: string,
  SERVICIO: string,
  LLAVE: string,
  subId: string,
): Promise<string> {
  const sub = await stripeGet("/subscriptions/" + subId, LLAVE);
  const cliente = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  const uid = await duenoDe(SB, SERVICIO, sub.metadata, undefined, cliente);
  if (!uid) return "sin dueno";

  const renglon = sub.items?.data?.[0];
  const precio = renglon?.price?.id;
  const plan = planDePrecio(precio) || sub.metadata?.plan || "mensual";
  const estado = estadoDe(sub.status);

  /* `current_period_end` cambio de sitio en las versiones nuevas de la API de
     Stripe: dejo de estar en la suscripcion y paso a vivir en cada renglon
     (`items.data[].current_period_end`). Se prueban las dos rutas para que de
     igual con que version quede configurado el webhook — probado el 27 ago
     2026, con la version 2026-07-29.dahlia, donde YA NO esta en la raiz y
     `sub.current_period_end` viene vacio en silencio: sin este respaldo, todo
     el mundo paga y se queda con `vence_el` en null para siempre. */
  const finDePeriodo = sub.current_period_end ?? renglon?.current_period_end;

  /* ¿Se le va a volver a cobrar? Se pregunta por CUATRO caminos y basta con
     que uno diga que no, porque aqui equivocarse tiene un precio muy desigual:
     decir "se renueva" de alguien que ya cancelo le promete algo que no va a
     pasar y le estropea la frase de la pantalla; decir "no se renueva" de
     alguien activo no le quita nada, solo enseña una fecha de mas.

     Cuatro y no uno porque Stripe ha ido moviendo esto entre versiones de su
     API, igual que hizo con `current_period_end` —ver arriba—, y el campo que
     ya no se usa no da error: llega vacio. El 27 ago 2026 pasó exactamente
     eso: se cancelo una suscripcion desde el portal, el aviso llego, y
     `cancel_at_period_end` no bastó para enterarse.

       cancel_at_period_end   el de siempre
       cancel_at              la fecha en la que se va a cortar, si esta puesta
       canceled_at            cuando se pidio la cancelacion
       cancellation_details   el motivo, presente solo si hay cancelacion */
  const vaACancelarse = !!(
    sub.cancel_at_period_end ||
    sub.cancel_at ||
    sub.canceled_at ||
    sub.cancellation_details?.reason
  );

  /* Sin datos, solo los cuatro campos: es un registro de diagnostico, no un
     volcado del objeto. El dia que Stripe vuelva a mover uno, esta linea dice
     cual en diez segundos en vez de costar otra tarde. */
  console.log("cancelacion:", JSON.stringify({
    cancel_at_period_end: sub.cancel_at_period_end ?? null,
    cancel_at: sub.cancel_at ?? null,
    canceled_at: sub.canceled_at ?? null,
    motivo: sub.cancellation_details?.reason ?? null,
    status: sub.status,
  }));

  await guardar(SB, SERVICIO, uid, {
    plan: plan,
    estado: estado,
    /* Es la fecha hasta la que esta pagado, y se copia incluso cuando la
       suscripcion ya se cancelo: es lo que permite que a quien cancela el
       dia 2 le siga funcionando hasta el 30. Quitar esto para "simplificar"
       apaga el plan de alguien que ya pago ese mes. */
    vence_el: finDePeriodo
      ? new Date(finDePeriodo * 1000).toISOString()
      : null,
    renueva: !vaACancelarse && (sub.status === "active" || sub.status === "trialing"),
    cliente: cliente || null,
    suscripcion: sub.id,
  });
  return "ok " + plan + " " + estado;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("no", { status: 405 });

  const SB = Deno.env.get("SUPABASE_URL");
  const SERVICIO = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const LLAVE = Deno.env.get("STRIPE_SECRETA");
  const SECRETO = Deno.env.get("STRIPE_FIRMA");
  if (!SB || !SERVICIO || !LLAVE || !SECRETO) {
    return new Response("Falta configurar el servidor", { status: 500 });
  }

  const crudo = await req.text();
  const cabecera = req.headers.get("stripe-signature") || "";
  if (!await firmaValida(crudo, cabecera, SECRETO)) {
    /* Un 400 y ni una palabra mas. Explicar por que fallo la firma es
       explicarle a quien lo intenta como acertar la proxima vez. */
    return new Response("Firma invalida", { status: 400 });
  }

  const aviso = JSON.parse(crudo);
  const tipo = aviso.type as string;
  const dato = aviso.data?.object || {};

  try {
    let resultado = "ignorado";

    if (tipo === "checkout.session.completed") {
      if (dato.mode === "subscription" && dato.subscription) {
        resultado = await aplicarSuscripcion(SB, SERVICIO, LLAVE, dato.subscription);
      } else if (dato.mode === "payment" && dato.payment_status === "paid") {
        /* Fundador. No hay suscripcion que consultar: es un cobro y ya.
           `vence_el` se queda en NULL y `mi_plan()` lo entiende como "no
           vence nunca" —ver planes.sql—, en vez de poner una fecha lejana
           que algun dia llegaria. */
        const uid = await duenoDe(SB, SERVICIO, dato.metadata, dato.client_reference_id, dato.customer);
        if (uid) {
          await guardar(SB, SERVICIO, uid, {
            plan: "fundador",
            estado: "activa",
            vence_el: null,
            renueva: false,
            cliente: dato.customer || null,
            suscripcion: null,
          });
          resultado = "fundador";

          /* Si el cupo se paso por uno o dos, se le da igual y se apunta en
             el registro. Cobrarle a alguien y luego decirle que no hay lugar
             es peor problema que tener 201 fundadores. Ver la nota del cupo
             en `pagar/index.ts`. */
          const r = await fetch(SB + "/rest/v1/rpc/lugares_fundador", {
            method: "POST",
            headers: { "Authorization": "Bearer " + SERVICIO, "apikey": SERVICIO, "Content-Type": "application/json" },
            body: "{}",
          });
          const quedan = await r.json();
          if (typeof quedan === "number" && quedan <= 0) {
            console.log("CUPO DE FUNDADOR AGOTADO O PASADO. Quitarlo de la landing.");
          }
        }
      }
    } else if (tipo === "charge.refunded") {
      /* ---- Un reembolso, y por que hacia falta esto ----

         Hasta aqui la funcion atendia cinco sucesos y ninguno era de
         reembolso. Con una suscripcion no se notaba, porque lo que quita el
         plan es la CANCELACION y esa si avisa. Pero Fundador es un pago unico:
         entra por `checkout.session.completed` en modo `payment` y no hay
         nada despues que se lo quite. Devolverle los $890 a alguien le dejaba
         el plan Fundador puesto para siempre.

         Y hay un segundo agujero, mas escondido: `lugares_fundador()` cuenta
         las filas con `plan = 'fundador'` sin mirar el estado, asi que marcar
         la fila como cancelada le quitaba el plan pero NO devolvia el lugar al
         cupo. Por eso aqui se cambia el `plan` y no solo el `estado`: es lo
         unico que arregla las dos cosas de una vez. Y `mi_plan()` tampoco mira
         el estado —su regla es `plan = 'fundador'` o `vence_el` en el futuro—,
         asi que con `plan` en 'libre' y `vence_el` en NULL la cuenta vuelve al
         plan Gratuito de verdad.

         Se guarda `estado: 'cancelada'` igualmente, para que al mirar la tabla
         se distinga una cuenta que compro y se le devolvio de una que nunca
         compro nada. Y `cliente` NO se toca: es por donde se le encuentra si
         vuelve. */
      const total = Number(dato.amount) || 0;
      const devuelto = Number(dato.amount_refunded) || 0;

      if (dato.invoice) {
        /* Viene de una factura, o sea de una suscripcion. Aqui NO se toca el
           plan a proposito: quien manda en una suscripcion son sus propios
           sucesos, y un reembolso parcial hecho por buena voluntad no puede
           apagarle el plan a alguien que sigue pagando. El orden correcto para
           devolver una suscripcion es cancelarla primero y reembolsar despues;
           la cancelacion es la que avisa. */
        resultado = "reembolso de suscripcion: manda la cancelacion";
      } else if (devuelto < total) {
        resultado = "reembolso parcial: no se toca el plan";
      } else {
        /* Pago unico devuelto entero: Fundador. La metadata de la sesion no
           siempre llega hasta el cargo, asi que se le busca por su cliente de
           Stripe, que es el camino que `guardar` dejo escrito en la fila. */
        const cliente = typeof dato.customer === "string" ? dato.customer : dato.customer?.id;
        const uid = await duenoDe(SB, SERVICIO, dato.metadata, undefined, cliente);
        if (uid) {
          await guardar(SB, SERVICIO, uid, {
            plan: "libre",
            estado: "cancelada",
            vence_el: null,
            renueva: false,
            suscripcion: null,
          });
          resultado = "reembolso de pago unico: plan retirado y lugar devuelto";
        } else {
          resultado = "reembolso sin dueno identificable";
        }
      }
    } else if (tipo === "customer.subscription.updated" || tipo === "customer.subscription.deleted") {
      resultado = await aplicarSuscripcion(SB, SERVICIO, LLAVE, dato.id);
    } else if (tipo === "invoice.paid" || tipo === "invoice.payment_failed") {
      /* La renovacion mensual y el fallo de la tarjeta llegan por aqui. La
         factura de la PRIMERA compra tambien, y llega antes que el
         `checkout.session.completed`: por eso da igual cual gane, los dos
         acaban preguntandole a Stripe lo mismo y escribiendo lo mismo. */
      if (dato.subscription) {
        resultado = await aplicarSuscripcion(SB, SERVICIO, LLAVE, dato.subscription);
      }
    }

    /* Siempre 200, incluso cuando no se hizo nada. Un codigo de error hace
       que Stripe reintente durante tres dias y acabe desactivando el
       endpoint; un aviso que no nos interesa no es un fallo suyo. Lo que si
       importa se ve en el registro de la funcion. */
    console.log(tipo, "->", resultado);
    return new Response(JSON.stringify({ ok: true, resultado }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    /* Esto SI devuelve error, y a proposito: aqui el aviso era bueno y no se
       pudo aplicar —la base no contesto, Stripe no contesto—. Que reintente
       es exactamente lo que hace falta, porque el estado quedo a medias. */
    console.error("Fallo aplicando", tipo, (e as Error).message);
    return new Response("Reintenta: " + (e as Error).message, { status: 500 });
  }
});
