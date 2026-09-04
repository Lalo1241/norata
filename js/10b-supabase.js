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

/* Echar a los demás dispositivos.

   Es la otra mitad de cambiar una contraseña, y sin ella el cambio no sirve
   para lo que la gente cree que sirve. Quien la cambia porque sospecha que
   alguien entró en su cuenta espera que ese alguien quede fuera; si la sesión
   del intruso sigue viva, la contraseña nueva no le ha quitado nada, porque
   una sesión iniciada ya no la necesita — se renueva sola.

   `scope=others` y no `global`: global cerraría también la de aquí, y quien
   acaba de poner una contraseña nueva se encontraría de vuelta en la pantalla
   de entrada sin entender por qué.

   Se hace explícito en vez de confiar en que el servidor lo haga solo. Puede
   que ya lo haga; no lo damos por hecho, porque es de esas cosas que si un día
   cambian de comportamiento nadie se entera hasta que hace falta. Cuesta una
   petición. */
async function sbCerrarOtrasSesiones() {
  const t = await sbToken();
  const r = await sbFetch("/auth/v1/logout?scope=others", {
    method: "POST",
    headers: { "Authorization": "Bearer " + t }
  });
  return r.ok;
}

/* ¿Un permiso guardado sigue valiendo? Lo pregunta usándolo, que es la única
   forma de saberlo: el token de refresco no caduca por reloj, se lo carga otra
   cosa —cambiar la contraseña, «cerrar las otras sesiones», borrar la cuenta—
   y desde aquí no hay manera de enterarse sin preguntar.

   Existe por el atajo de cambiar de cuenta. Sin esta comprobación se entraba
   igual y la app se quedaba dentro de una cuenta que no podía sincronizar:
   todo pintado, nada subiendo, y el aviso escondido en Ajustes. Vale más una
   petición de más y una frase clara.

   Devuelve la sesión renovada —el servidor gasta el token viejo y da otro, así
   que hay que guardar este— o null si ya no vale. No lanza: quien llama tiene
   que poder distinguir «no vale» de «no hay red», y para eso mira `null`. */
async function sbRevivir(refresh) {
  if (!refresh) return null;
  const r = await sbFetch("/auth/v1/token?grant_type=refresh_token", {
    method: "POST", body: JSON.stringify({ refresh_token: refresh })
  });
  return r.ok ? sbSesionDe(r.body) : null;
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
  /* Y la copia de la lista de cuentas de este aparato, que si no se queda con
     el token viejo. El de refresco se gasta al usarlo: una copia que no se
     actualiza aquí sirve una vez y deja de valer, y el atajo de cambiar de
     cuenta fallaría justo cuando ya se confía en él. */
  cuentaApuntar();
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

/* Un latido: «alguien abrió la app hoy». Es lo único que Norata cuenta de sí
   misma, y son cuatro cosas —el día, la versión, si fue teléfono o
   computadora, y si estaba instalada—, nunca nada de lo que el usuario
   escribe. El SQL y el porqué del diseño están en `supabase/medicion.sql`.

   Tres decisiones que conviene no deshacer:

   1. **Falla en el más absoluto silencio.** Ni un toast, ni un error en
      consola que asuste. Esto no es una función de la app: es una libreta
      para saber si la gente vuelve. Si el servidor no contesta, si falta
      correr el SQL (404) o si no hay red, lo correcto es no enterarse. El
      día que un fallo de la medición interrumpa a alguien que está usando
      la app, la medición habrá costado más de lo que vale.

   2. **Sin sesión no se apunta nada, y no se busca la forma.** Quien prueba
      Norata sin cuenta no tiene identidad aquí, y por lo tanto es invisible
      en las cuentas. Es un hueco a propósito: medirlo exigiría dejarle una
      marca al aparato, y eso ya es rastrear a alguien que no dio permiso.

   3. **El tipo de aparato sale del ancho de la ventana**, no del user agent.
      No hace falta husmear qué teléfono es nadie para responder la única
      pregunta que interesa —«¿usa la computadora y el teléfono?»—, y el
      ancho la responde. Cuesta precisión: dos teléfonos distintos cuentan
      como uno. Se acepta a cambio de no fichar aparatos. */
async function sbLatir() {
  try {
    if (!syncReady()) return;
    await sbDatos("/rpc/latir", {
      method: "POST",
      body: JSON.stringify({
        v: VERSION,
        ap: isDesktop() ? "escritorio" : "movil",
        inst: window.matchMedia("(display-mode: standalone)").matches ||
              window.navigator.standalone === true
      })
    });
  } catch (e) {
    /* A propósito. Ver el punto 1 de arriba. */
  }
}

/* ---- Administración ----
   Tres puertas al panel de números. La seguridad de las tres NO está aquí:
   está en `supabase/administracion.sql`, donde cada función comprueba quién
   llama antes de contestar. Esto de abajo es solo el timbre.

   Dicho de otra forma: alguien puede leer este archivo, copiar el nombre de
   `metricas` y llamarlo desde la consola de su navegador. El servidor le
   dirá que no. Esconder estas líneas no añadiría ni un gramo de seguridad,
   así que no se esconden. */

/* ¿Puedo ver el panel? Se pregunta al arrancar y decide si Ajustes dibuja la
   sección. Falla a `false` ante cualquier problema —sin red, sin sesión, sin
   SQL corrido— porque el error seguro es no enseñarlo. */
async function sbSoyAdmin() {
  try {
    if (!syncReady()) return false;
    const r = await sbDatos("/rpc/soy_admin", { method: "POST", body: "{}" });
    if (!r.ok) return false;
    return r.body === true || r.body === "true";
  } catch (e) {
    return false;
  }
}

/* Los números, todos de una vez. Aquí sí se deja ver el error: si el panel no
   puede cargar, quien lo abrió necesita saber por qué —a diferencia del
   latido, que es mejor que falle callado. */
async function sbMetricas() {
  const r = await sbDatos("/rpc/metricas", { method: "POST", body: "{}" });
  /* Un 404 aquí NO significa solo «falta el archivo». PostgREST devuelve 404
     tanto cuando la función no existe como cuando algo DENTRO de ella no
     existe —una tabla que aún no se ha creado—, y las dos cosas llegan con el
     mismo número. Culpar al archivo costó una tarde: administracion.sql estaba
     puesto y lo que faltaba era planes.sql, del que `metricas()` tiraba sin
     necesidad. Ese fallo ya está arreglado en el SQL; el mensaje se queda
     honesto por si aparece otra pieza que falte. */
  if (r.status === 404) throw new Error("El servidor no encontró algo que la consulta necesita. Suele ser que falta correr un SQL de la carpeta supabase/ — mira su LEEME. Detalle: " + sbMensaje(r));
  if (r.status === 403 || r.status === 401) throw new Error("Esta cuenta no tiene permiso para ver el panel.");
  if (!r.ok) throw sbError(r);
  return r.body;
}

async function sbTropiezosVistos() {
  const r = await sbDatos("/rpc/tropiezos_vistos", { method: "POST", body: "{}" });
  if (!r.ok) throw sbError(r);
  return true;
}

/* Archivar UNO, o desarchivarlo. Devuelve cómo quedó la fila, o `null` si esa
   fila ya no está — que es lo que pasa al archivar desde dos pestañas a la vez.
   Quien llama pinta con lo que devuelve esto y no con lo que suponía, así que
   una carrera entre dos pestañas acaba en las dos diciendo lo mismo. */
async function sbTropiezoVisto(id, visto) {
  const r = await sbDatos("/rpc/tropiezo_visto", {
    method: "POST",
    body: JSON.stringify({ p_id: id, p_visto: visto !== false })
  });
  if (!r.ok) throw sbError(r);
  return r.body;
}

/* Apuntar que algo se rompió.

   Va por `sbFetch` y no por `sbDatos` a propósito: `sbDatos` exige un token, y
   los errores que más importa cazar son los del arranque, cuando todavía no
   hay sesión ninguna. Un fallo que solo se pudiera reportar tras entrar sería
   invisible justo cuando más falta hace verlo.

   Y falla en silencio por la misma razón que el latido: si el aviso de un
   error provoca otro error, la app entra en un bucle de quejas encima de
   alguien que ya está teniendo un mal rato. */
/* Devuelve si llegó o no. Los avisos automáticos siguen sin mirarlo —les da
   igual, y por eso esta función sigue sin lanzar—, pero el botón de reportar
   un fallo SÍ tiene que saberlo: darle las gracias a alguien por un reporte
   que no salió del teléfono es mentirle en el único momento en que estaba
   haciéndonos un favor. */
async function sbTropiezo(donde, mensaje) {
  try {
    if (!mensaje) return false;
    const r = await sbFetch("/rest/v1/rpc/apuntar_tropiezo", {
      method: "POST",
      body: JSON.stringify({
        v: (typeof VERSION !== "undefined" ? VERSION : ""),
        ap: (typeof isDesktop === "function" && isDesktop()) ? "escritorio" : "movil",
        dnd: String(donde || ""),
        msg: String(mensaje).slice(0, 300)
      })
    });
    return !!(r && r.ok);
  } catch (e) {
    /* A propósito. */
    return false;
  }
}

/* La red de seguridad de index.html corre antes que este archivo, así que
   guarda lo que pilla en una lista y aquí se vacía. Sin esto, los errores más
   graves —los que matan el arranque— serían los únicos que nunca se apuntan. */
async function sbVaciarTropiezos() {
  const cola = window.__tropiezos;
  if (!cola || !cola.length) return;
  /* Se vacía la lista ANTES de mandarla: si el envío falla y volviéramos a
     dejarla puesta, cada arranque reintentaría una cola que solo crece. */
  const pendientes = cola.splice(0, cola.length).slice(0, 5);
  for (const t of pendientes) await sbTropiezo(t.donde, t.mensaje);
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
