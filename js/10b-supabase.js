/* Almacén: Supabase — cuentas por correo y una fila por persona */

/* ================= Almacén: Supabase =================
   Una fila por persona en la tabla `perfiles`: el sobre entero en la columna
   `estado`, y su número de revisión en `rev`. La marca de versión ES ese
   `rev`: al escribir se exige que siga siendo el que leímos, y si otro
   dispositivo ya escribió, la actualización no toca ninguna fila. Eso es el
   conflicto. Misma mecánica que el `sha` de GitHub, con otro nombre.

   Lo que impide ver datos ajenos NO es este archivo: es una regla dentro de
   la base de datos (RLS) que solo entrega la fila cuyo dueño coincide con
   quien pregunta. Aunque este código tuviera un fallo, o alguien lo cambiara
   en su propio navegador, la base no suelta nada. Comprobado: sin sesión,
   pedir la tabla entera devuelve una lista vacía.

   Por eso la clave de abajo puede vivir en un repositorio público: no es una
   contraseña, es el identificador del proyecto. La contraseña de verdad es
   la de cada persona, y no se guarda en ningún sitio: se cambia una vez por
   una sesión que caduca, y de ahí en adelante se renueva sola. */

const SB_URL = "https://wifffghnyrqfuwqlatci.supabase.co";
const SB_KEY = "sb_publishable_aFW_LWvcSENT2XOQ0PVXyA_UsFvraIU";

async function sbFetch(ruta, opts) {
  const o = Object.assign({ cache: "no-store" }, opts || {});
  o.headers = Object.assign({ "apikey": SB_KEY, "Content-Type": "application/json" }, o.headers || {});
  const res = await fetch(SB_URL + ruta, o);
  let body = null;
  try { body = await res.json(); } catch (e) { /* 204 sin cuerpo */ }
  return { ok: res.ok, status: res.status, body };
}

function sbMensaje(r) {
  const b = r.body || {};
  return b.error_description || b.msg || b.message || b.error || ("error " + r.status);
}

/* ---- Cuentas ---- */

function sbSesionDe(b) {
  return {
    access: b.access_token,
    refresh: b.refresh_token,
    // Un minuto de margen: pedir con el token justo en el filo falla a veces
    expira: Date.now() + ((Number(b.expires_in) || 3600) - 60) * 1000,
    uid: b.user && b.user.id
  };
}

/* Devuelve la sesión Y el perfil, porque la misma respuesta ya trae los dos y
   pedirlos por separado sería una llamada de más justo en el momento en que
   la pantalla está esperando. */
async function sbEntrar(correo, clave) {
  const r = await sbFetch("/auth/v1/token?grant_type=password", {
    method: "POST", body: JSON.stringify({ email: correo, password: clave })
  });
  if (!r.ok) {
    const m = sbMensaje(r);
    /* Supabase responde lo mismo si el correo no existe que si la contraseña
       está mal, y lo hace a propósito: distinguirlos permitiría averiguar qué
       correos están registrados. Así que el aviso tampoco lo distingue.

       Por eso mismo nombra las dos salidas posibles en vez de una. Quien se
       registró con Google no tiene contraseña que recordar —nunca puso una—,
       y aquí se pasaba la vida escribiendo la de su correo sin que nada
       funcionara: el aviso le mandaba a crear una cuenta que ya existía. */
    if (/invalid login credentials/i.test(m)) {
      throw new Error("Correo o contraseña incorrectos. Si entraste con Google la primera vez, usa ese botón; y si todavía no tienes cuenta, créala abajo.");
    }
    if (/email not confirmed/i.test(m)) {
      throw new Error("Falta confirmar tu correo. Abre el mensaje que te mandamos y pulsa el enlace; luego vuelve aquí.");
    }
    throw new Error(sbMensaje(r));
  }
  return {
    sesion: sbSesionDe(r.body),
    perfil: perfilDe((r.body.user || {}).user_metadata)
  };
}

/* Ese correo ya tiene cuenta. Se marca con `yaExiste` para que la pantalla
   pueda ofrecer el botón de entrar en vez de dejar el aviso a secas. */
function sbYaExiste() {
  const e = new Error("Ya hay una cuenta con ese correo. Entra con tu contraseña, o usa «¿Olvidaste tu contraseña?» si no la recuerdas.");
  e.yaExiste = true;
  return e;
}

/* Devuelve la sesión, o null si hay que confirmar el correo antes de entrar.

   El perfil viaja DENTRO del alta y no en una llamada posterior, y esa es la
   diferencia entre un correo que saluda por su nombre y uno que no: el mensaje
   de confirmación sale del servidor en el mismo instante en que se crea la
   cuenta. Cualquier cosa que se guarde después llega tarde para ese correo,
   que es justo el primero que va a leer. */
async function sbRegistrar(correo, clave, perfil) {
  if (String(clave).length < CLAVE_MIN) {
    throw new Error("La contraseña necesita al menos " + CLAVE_MIN + " caracteres.");
  }
  const r = await sbFetch("/auth/v1/signup?redirect_to=" + encodeURIComponent(sbVuelta()), {
    method: "POST",
    body: JSON.stringify({ email: correo, password: clave, data: perfil || {} })
  });
  if (!r.ok) {
    const m = sbMensaje(r);
    if (/password/i.test(m) && /least|short|weak|characters/i.test(m)) {
      throw new Error("La contraseña es muy corta. Usa al menos " + CLAVE_MIN + " caracteres.");
    }
    if (/already registered|already exists/i.test(m)) throw sbYaExiste();
    throw new Error(m);
  }

  const b = r.body || {};
  if (b.access_token) return sbSesionDe(b);

  /* Aquí estaba el fallo que hacía creer que se había creado una cuenta que
     ya existía. Con la confirmación por correo activada, Supabase responde
     que TODO fue bien aunque la dirección ya estuviera registrada: contesta
     con un usuario inventado, sin sesión, exactamente igual que un alta de
     verdad. Lo hace a propósito, para que nadie pueda averiguar quién tiene
     cuenta aquí probando correos.

     Lo que sí lo delata es `identities`: en un alta real trae la identidad
     recién creada, y en la respuesta inventada viene vacío. Se distingue
     aquí y no en la pantalla porque es un detalle de cómo contesta este
     servidor, no de cómo se enseña.

     El aviso que se le da al usuario sí dice la verdad —«ya existe»— porque
     esto no es una pantalla pública de registro: es su propia app, y decirle
     «te mandé un correo» cuando no hay ningún correo en camino lo deja
     esperando algo que nunca llega. */
  const u = b.user || b;
  if (Array.isArray(u.identities) && u.identities.length === 0) throw sbYaExiste();

  return null;
}

/* A dónde vuelve el usuario desde un correo. Sin la ruta ni la consulta: el
   enlace llega días después y arrastrar hasta ahí el estado de aquella sesión
   no tiene sentido. */
function sbVuelta() {
  return location.origin + location.pathname;
}

/* Pedir el correo de recuperación. Responde bien SIEMPRE, exista o no la
   cuenta, y eso es a propósito: si dijera "ese correo no está registrado",
   cualquiera podría averiguar quién tiene cuenta probando direcciones. */
async function sbRecuperar(correo) {
  const r = await sbFetch("/auth/v1/recover?redirect_to=" + encodeURIComponent(sbVuelta()), {
    method: "POST", body: JSON.stringify({ email: correo })
  });
  /* Un 429 sí se cuenta: no delata nada —salta por dirección IP, no por
     cuenta— y callarlo dejaría al usuario pulsando un botón que ya no hace
     nada, creyendo que el correo va en camino. */
  if (r.status === 429) throw new Error("Demasiados intentos seguidos. Espera unos minutos y vuelve a probar.");
  return true;
}

/* Volver a mandar el correo de confirmación, para quien lo borró sin querer o
   nunca le llegó. */
async function sbReenviarVerificacion(correo) {
  const r = await sbFetch("/auth/v1/resend?redirect_to=" + encodeURIComponent(sbVuelta()), {
    method: "POST", body: JSON.stringify({ type: "signup", email: correo })
  });
  if (r.status === 429) throw new Error("Demasiados intentos seguidos. Espera unos minutos y vuelve a probar.");
  if (!r.ok) throw new Error(sbMensaje(r));
  return true;
}

/* Estrenar contraseña. Se hace con la sesión que trae el enlace del correo,
   que es lo que prueba que quien la cambia tiene acceso a ese buzón. */
async function sbCambiarClave(nueva) {
  const t = await sbToken();
  const r = await sbFetch("/auth/v1/user", {
    method: "PUT",
    headers: { "Authorization": "Bearer " + t },
    body: JSON.stringify({ password: nueva })
  });
  if (!r.ok) {
    const m = sbMensaje(r);
    if (/password/i.test(m) && /least|short|weak|characters/i.test(m)) {
      throw new Error("Esa contraseña no cumple el mínimo. Usa al menos " + CLAVE_MIN + " caracteres.");
    }
    if (/different from the old/i.test(m)) throw new Error("Esa es la contraseña que ya tenías. Elige otra distinta.");
    throw new Error(m);
  }
  return true;
}

/* Guardar el nombre y el apodo en la cuenta.

   Es la misma dirección con la que se cambia la contraseña, pero mandando
   `data` en vez de `password`. Supabase reemplaza el objeto entero por el que
   se le pase, así que hay que enviar los tres campos siempre: mandar solo el
   apodo borraría el nombre. Por eso quien llama pasa por `armarPerfil`, que
   devuelve el trío completo, y no un campo suelto. */
async function sbGuardarPerfil(perfil) {
  const t = await sbToken();
  const r = await sbFetch("/auth/v1/user", {
    method: "PUT",
    headers: { "Authorization": "Bearer " + t },
    body: JSON.stringify({ data: perfil })
  });
  if (!r.ok) throw new Error(sbMensaje(r));
  return perfilDe((r.body || {}).user_metadata);
}

/* El token de acceso caduca en una hora. Esto lo renueva solo con el de
   refresco, para que una sesión larga no se corte a media tarde. */
async function sbToken() {
  const s = (sync.cfg || {}).sesion;
  if (!s || !s.refresh) throw new Error("No hay sesión iniciada. Vuelve a conectar.");
  if (Date.now() < s.expira) return s.access;

  const r = await sbFetch("/auth/v1/token?grant_type=refresh_token", {
    method: "POST", body: JSON.stringify({ refresh_token: s.refresh })
  });
  if (!r.ok) throw new Error("Tu sesión caducó. Entra otra vez con tu correo y contraseña.");
  const nueva = sbSesionDe(r.body);
  if (!nueva.uid) nueva.uid = s.uid;   // el refresco no siempre repite el usuario
  sync.cfg.sesion = nueva;
  saveSync();
  return nueva.access;
}

/* ---- Borrar la cuenta, con 30 días para arrepentirse ----

   Pedirlo no borra: apunta una fecha. Una tarea que corre de madrugada dentro
   de la propia base de datos borra las que ya vencieron. El plazo existe
   porque el arrepentimiento llega tarde por definición — a los tres días, no
   a los tres segundos— y para entonces el botón de confirmar ya no sirve de
   nada.

   Las tres viven en la base de datos y no aquí por lo mismo que `sbBorrarCuenta`
   (ver abajo). Si el SQL todavía no se ha corrido, el servidor contesta 404 y
   se traduce a algo accionable en vez de a un número suelto. */

const FALTA_SQL = "Falta activar el borrado de cuentas en el servidor. Es un paso de una sola vez; hasta entonces no puedo tocar la cuenta desde aquí.";

async function sbPedirBorrado() {
  const r = await sbDatos("/rpc/pedir_borrado", { method: "POST", body: "{}" });
  if (r.status === 404) throw new Error(FALTA_SQL);
  if (!r.ok) throw sbError(r);
  return r.body;                       // la fecha en que se borrará
}

async function sbCancelarBorrado() {
  const r = await sbDatos("/rpc/cancelar_borrado", { method: "POST", body: "{}" });
  if (r.status === 404) throw new Error(FALTA_SQL);
  if (!r.ok) throw sbError(r);
  return true;
}

/* ¿Esta cuenta está esperando a borrarse? Se pregunta al entrar y solo al
   entrar. Ante cualquier duda contesta que no: si la columna todavía no
   existe —porque falta correr el SQL— o la red falla, lo correcto es dejar
   pasar a quien acaba de poner bien su contraseña, no cerrarle la puerta por
   una pregunta que ni siquiera se pudo hacer. */
async function sbBorradoPendiente() {
  try {
    const uid = sbUid();
    const r = await sbDatos("/perfiles?select=borrar_el&user_id=eq." + encodeURIComponent(uid));
    if (!r.ok || !Array.isArray(r.body) || !r.body.length) return null;
    return r.body[0].borrar_el || null;
  } catch (e) {
    return null;
  }
}

/* Borrar la cuenta de verdad, no solo sus datos.

   Esto NO se puede pedir desde aquí con una llamada normal: quitar a alguien
   de la lista de usuarios es cosa de administrador, y la llave de
   administrador jamás puede estar en el navegador —quien la tuviera podría
   borrar la cuenta de cualquiera—. La salida es una función que vive DENTRO
   de la base de datos y solo sabe hacer una cosa: borrar a quien la llama.
   Ni recibe a quién borrar ni puede recibirlo, así que no hay nada que
   falsificar desde fuera.

   Esa función hay que crearla una vez en Supabase; el SQL y el cómo están en
   `supabase/LEEME.md`. Mientras no exista, el servidor contesta 404 y aquí se
   traduce a algo accionable en vez de a un número suelto. */
async function sbBorrarCuenta() {
  const r = await sbDatos("/rpc/borrar_mi_cuenta", { method: "POST", body: "{}" });
  if (r.status === 404) throw new Error(FALTA_SQL);
  if (!r.ok) throw sbError(r);
  return true;
}

/* De quién son los datos. Pasa por aquí y no por `sync.cfg.sesion.uid`
   suelto: sin sesión, aquello reventaba con un error de JavaScript en vez de
   decir qué hacer. No debería ocurrir —syncReady() lo filtra— pero un fallo
   que se cuele no tiene por qué salir en inglés y sin salida. */
function sbUid() {
  const s = (sync.cfg || {}).sesion;
  if (!s || !s.uid) throw new Error("No hay sesión iniciada. Entra con tu correo y contraseña.");
  return s.uid;
}

async function sbDatos(ruta, opts) {
  const t = await sbToken();
  const o = opts || {};
  o.headers = Object.assign({ "Authorization": "Bearer " + t }, o.headers || {});
  return await sbFetch("/rest/v1" + ruta, o);
}

function sbError(r) {
  if (r.status === 401 || r.status === 403) {
    return new Error("Tu sesión ya no vale. Entra otra vez con tu correo y contraseña.");
  }
  return new Error("Supabase respondió: " + sbMensaje(r));
}

/* ---- El almacén ---- */

ALMACENES.supabase = {
  nombre: "Supabase",

  explicacion() {
    return "Guarda tu progreso en tu cuenta para que la computadora y el teléfono vean lo mismo. " +
      "Solo tú puedes verlo, y tu contraseña no se queda guardada aquí.";
  },

  listo() {
    const s = (sync.cfg || {}).sesion;
    return !!(s && s.refresh && s.uid);
  },

  etiqueta() {
    return (sync.cfg || {}).correo || "tu cuenta";
  },

  async configurar(v) {
    const r = await sbEntrar(v.correo, v.clave);
    return { correo: v.correo, sesion: r.sesion, perfil: r.perfil };
  },

  async leer() {
    const uid = sbUid();
    const r = await sbDatos("/perfiles?select=estado,rev&user_id=eq." + encodeURIComponent(uid));
    if (!r.ok) throw sbError(r);
    if (!Array.isArray(r.body) || !r.body.length) return { vacio: true };
    return { marca: r.body[0].rev, env: r.body[0].estado };
  },

  async escribir(env, marca) {
    const uid = sbUid();
    const fila = { estado: env, rev: env.rev, updated_at: new Date().toISOString() };

    // Primera vez: no hay fila que actualizar, hay que crearla
    if (marca === null || marca === undefined) {
      const r = await sbDatos("/perfiles", {
        method: "POST",
        headers: { "Prefer": "return=representation" },
        body: JSON.stringify(Object.assign({ user_id: uid }, fila))
      });
      // Ya existía: otro dispositivo la sembró primero
      if (r.status === 409) return { ok: false, conflicto: true };
      if (!r.ok) throw sbError(r);
      return { ok: true, marca: r.body[0].rev };
    }

    /* `rev=eq.<marca>` es todo el mecanismo de seguridad: si otro dispositivo ya
       escribió, el rev de la fila cambió, la condición no encaja con ninguna
       y la respuesta viene vacía. Eso es el conflicto — sin bloqueos, sin
       transacciones y sin poder pisar nada por accidente. */
    const r = await sbDatos(
      "/perfiles?user_id=eq." + encodeURIComponent(uid) + "&rev=eq." + encodeURIComponent(marca), {
        method: "PATCH",
        headers: { "Prefer": "return=representation" },
        body: JSON.stringify(fila)
      });
    if (!r.ok) throw sbError(r);
    if (!Array.isArray(r.body) || !r.body.length) return { ok: false, conflicto: true };
    return { ok: true, marca: r.body[0].rev };
  }
};
