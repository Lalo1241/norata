/* La funcion que manda el correo de bienvenida */

/* ================= Por que hace falta esto =================
   Los otros tres correos los manda Supabase solo: son parte de la cuenta
   —confirmar, recuperar, cambiar de correo— y basta con pegar la plantilla en
   su panel. La bienvenida no. No responde a ningun tramite de la cuenta, asi
   que no existe ninguna plantilla suya donde ponerla.

   Y no se puede mandar desde el navegador. Enviar correo pide la llave de
   Resend, y cualquier llave que llegue al navegador es publica: quien abra las
   herramientas del navegador se la lleva y manda correos como Norata. Por eso
   hay una funcion en el servidor, aunque el resto del proyecto no tenga
   ninguna: es el unico sitio donde esa llave puede estar.

   El reparto queda asi:

     la app     avisa "acabo de entrar" con la sesion de quien entro
     esta       comprueba quien es, decide si toca, y manda

   La app NO decide si se manda. Solo avisa. Quien decide es esta funcion, y lo
   hace mirando la marca que ella misma escribio la vez anterior, del lado del
   servidor donde nadie puede tocarla. Si lo decidiera el navegador, recargar
   la pagina veinte veces mandaria veinte correos.

   ---- Como se pone en marcha ----

     supabase secrets set RESEND_API_KEY=re_xxxxxxxx
     supabase functions deploy bienvenida

   `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` las pone Supabase sola: no hay
   que declararlas ni copiarlas a ningun sitio.

   Mientras no se despliegue, la app llama a una direccion que no existe, se
   traga el error y sigue. No se rompe nada; simplemente no llega el correo. */

const RESEND = "https://api.resend.com/emails";
const PLANTILLA = "https://mi.norata.app/correos/04-bienvenida.html";
const REMITENTE = "Norata <no-reply@norata.app>";

/* A donde va lo que conteste alguien. Sin esto, responder a un correo de
   bienvenida era escribirle a `no-reply@norata.app`, que no tiene bandeja: el
   mensaje se perdia y quien escribio se quedaba esperando.
   Y el remitente NO cambia a esta direccion: `no-reply@norata.app` esta
   verificado en Resend y `hopara.com.mx` no, asi que enviar desde ahi tiraria
   el correo o lo mandaria a spam. Enviar y recibir son dos cosas distintas, y
   `reply_to` es justo la que las junta. */
const CONTESTA_A = "norata@hopara.com.mx";
const ASUNTO = "Bienvenido a Norata";

/* De donde se acepta la llamada. Con `*` cualquier pagina del mundo podria
   pedirle al navegador de un usuario que dispare esto; no seria grave —hace
   falta su sesion— pero no hay ninguna razon para permitirlo. */
const PERMITIDOS = ["https://mi.norata.app", "http://localhost:8123"];

function cabecerasCORS(origen: string | null) {
  const ok = origen && PERMITIDOS.includes(origen) ? origen : PERMITIDOS[0];
  return {
    "Access-Control-Allow-Origin": ok,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function responder(cuerpo: unknown, estado: number, origen: string | null) {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { "Content-Type": "application/json", ...cabecerasCORS(origen) },
  });
}

/* El nombre lo escribio una persona y acaba dentro de HTML. La app ya le quita
   los signos de menor y mayor antes de guardarlo, pero eso es la app: esto
   corre en el servidor y no puede dar por hecho que quien llama sea ella. */
function escapar(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

Deno.serve(async (req: Request) => {
  const origen = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cabecerasCORS(origen) });
  }
  if (req.method !== "POST") {
    return responder({ error: "solo POST" }, 405, origen);
  }

  const SB = Deno.env.get("SUPABASE_URL");
  const SERVICIO = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const LLAVE_RESEND = Deno.env.get("RESEND_API_KEY");
  if (!SB || !SERVICIO || !LLAVE_RESEND) {
    return responder({ error: "faltan variables de entorno" }, 500, origen);
  }

  /* ---- Quien esta llamando ----
     Se pregunta a Supabase con el token que trajo la peticion, en vez de creer
     lo que diga el cuerpo del mensaje. Es la diferencia entre "soy Lalo" y
     "toma mi sesion, comprueba tu". */
  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) {
    return responder({ error: "sin sesion" }, 401, origen);
  }

  const rUser = await fetch(SB + "/auth/v1/user", {
    headers: { Authorization: auth, apikey: SERVICIO },
  });
  if (!rUser.ok) {
    return responder({ error: "sesion no valida" }, 401, origen);
  }
  const usuario = await rUser.json();
  const meta = usuario.user_metadata || {};

  /* ---- ¿Toca mandarlo? ----
     Las dos condiciones son del lado del servidor a proposito. */

  // Sin confirmar el correo no hay a quien escribir: la direccion todavia no
  // se ha demostrado suya, y mandarle una bienvenida seria escribirle a quien
  // a lo mejor solo puso su direccion en el formulario de otro.
  if (!usuario.email_confirmed_at) {
    return responder({ enviado: false, motivo: "sin confirmar" }, 200, origen);
  }

  // Ya se le mando. Esta marca es la que impide que veinte recargas de la
  // pagina se conviertan en veinte correos.
  if (meta.bienvenida) {
    return responder({ enviado: false, motivo: "ya se mando" }, 200, origen);
  }

  /* ---- Armar el correo ----
     La plantilla se descarga del sitio en vez de vivir copiada aqui dentro.
     Asi hay UNA sola version: la de `correos/04-bienvenida.html`, que es la
     que se puede ver, comparar y volver atras. Copiada aqui, cambiarla
     obligaria a desplegar la funcion otra vez, y a la tercera vez las dos
     copias dirian cosas distintas. */
  const rPlantilla = await fetch(PLANTILLA, { cache: "no-store" });
  if (!rPlantilla.ok) {
    return responder({ error: "no pude leer la plantilla" }, 502, origen);
  }
  let html = await rPlantilla.text();

  /* Se sustituyen TODAS las apariciones, no la primera. Con `replace` a secas,
     el dia que la marca aparezca dos veces —en un comentario del HTML, por
     ejemplo— se cambiaria la equivocada y el correo saldria con la marca a la
     vista. Paso una vez. */
  const saludo = String(meta.saludo || "").trim();
  const texto = saludo ? "Hola, " + escapar(saludo) : "Hola";
  html = html.split("{{SALUDO}}").join(texto);

  const rEnvio = await fetch(RESEND, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + LLAVE_RESEND,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: REMITENTE,
      reply_to: CONTESTA_A,
      to: [usuario.email],
      subject: ASUNTO,
      html: html,
    }),
  });
  if (!rEnvio.ok) {
    const detalle = await rEnvio.text();
    return responder({ error: "Resend: " + detalle }, 502, origen);
  }

  /* ---- Dejar constancia ----
     Se manda el objeto entero y no solo la marca nueva: esta direccion
     reemplaza los datos de la cuenta por los que reciba, asi que enviar solo
     `bienvenida` borraria el nombre y el apodo.

     Va DESPUES de enviar. Al reves —marcar y luego mandar— un fallo de Resend
     dejaria la cuenta marcada sin haber recibido nada, y ese correo ya no se
     mandaria nunca. Asi, el peor caso es al contrario: si esto falla, la
     proxima vez que entre le llega un segundo correo. Molesta menos que
     quedarse sin el. */
  await fetch(SB + "/auth/v1/admin/users/" + usuario.id, {
    method: "PUT",
    headers: {
      Authorization: "Bearer " + SERVICIO,
      apikey: SERVICIO,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_metadata: { ...meta, bienvenida: new Date().toISOString() },
    }),
  });

  return responder({ enviado: true }, 200, origen);
});
