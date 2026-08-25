/* El perfil: con qué nombre nos dirigimos a quien usa la app */

/* ================= Nombre y apodo =================
   Hasta ahora la app sabía un correo y nada más, y por eso hablaba como un
   formulario. El nombre no es un dato de adorno: es toda la diferencia entre
   "Hola de nuevo" y "Hola de nuevo, Lalo", y esa diferencia es casi todo el
   tono de Norata.

   Se guardan tres cosas y no dos:

     nombre   cómo se llama, tal como lo escribió
     apodo    cómo prefiere que le llamemos (puede no haberlo)
     saludo   el que se usa de verdad — el apodo, o el primer nombre

   El tercero es el que parece sobrar y es el que importa. Los correos los
   arma Supabase con una plantilla que solo sabe pegar un valor donde va;
   pedirle que elija entre dos campos y recorte apellidos es pedirle algo que
   no hace, y el día que falle, el correo empieza con "Hola, ". Resolverlo
   aquí —una sola vez, al guardar— deja la plantilla con una variable única
   que siempre trae algo dentro.

   Nada de esto necesita tabla nueva. Supabase guarda datos libres junto a la
   cuenta, viajan pegados a la sesión y llegan solos a las plantillas de
   correo. Tampoco pasa por `perfiles`, que es la tabla del progreso: el
   nombre tiene que existir ANTES de que haya progreso, porque el primer
   correo que se manda es el de confirmar la cuenta. */

const NOMBRE_MAX = 60;
const APODO_MAX = 24;

/* Un nombre escrito por una persona llega con espacios de sobra, saltos de
   línea pegados y a veces caracteres invisibles. Se limpia aquí y no en cada
   sitio que lo pida. El tope no es por seguridad —eso lo hace el servidor—
   sino porque un nombre de doscientas letras rompe la maqueta del correo. */
function limpiarNombre(v, tope) {
  return String(v == null ? "" : v)
    /* Fuera los signos de menor y mayor. Nadie los tiene en su nombre, y este
       texto acaba dentro de una plantilla de correo que la escribe Supabase,
       no nosotros: no controlamos si la escapa. Quitarlos aquí cierra la
       pregunta entera y no le quita nada a ningún nombre real. */
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")   // saltos y caracteres de control
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, tope || NOMBRE_MAX);
}

/* El primer nombre, sin apellidos. Deliberadamente tonto: parte por el primer
   espacio y ya. Adivinar cuál de "María José García" es el nombre y cuál el
   apellido no tiene solución buena, y por eso existe el campo del apodo —
   quien no se sienta llamado por lo que salga de aquí, lo escribe él. */
function primerNombre(nombre) {
  const n = limpiarNombre(nombre);
  return n ? n.split(" ")[0] : "";
}

/* Cómo llamamos a esta persona. Una sola respuesta para toda la app y para
   todos los correos. */
function saludoDe(nombre, apodo) {
  return limpiarNombre(apodo, APODO_MAX) || primerNombre(nombre);
}

/* Arma el trío listo para guardar. Se llama tanto al registrarse como al
   editarlo en Ajustes, para que el `saludo` no pueda quedarse desfasado
   respecto de los otros dos. */
function armarPerfil(nombre, apodo) {
  const n = limpiarNombre(nombre, NOMBRE_MAX);
  const a = limpiarNombre(apodo, APODO_MAX);
  return { nombre: n, apodo: a, saludo: saludoDe(n, a) };
}

/* Lee lo que Supabase devuelve pegado a la cuenta.

   Las dos alternativas de `nombre` son para las cuentas que no nacieron en
   este formulario: quien entra con Google llega con `full_name` puesto por
   Google, y quien creó su cuenta antes de que existiera todo esto no trae
   nada. Los dos acaban con un perfil válido en vez de con un hueco. */
function perfilDe(meta) {
  const m = meta || {};
  const nombre = limpiarNombre(m.nombre || m.full_name || m.name, NOMBRE_MAX);
  const apodo = limpiarNombre(m.apodo, APODO_MAX);
  /* El `saludo` guardado manda sobre el calculado: si alguien puso un apodo y
     luego lo borró, se respeta esa decisión en vez de resucitar su nombre. */
  const guardado = limpiarNombre(m.saludo, APODO_MAX);
  /* `deducido` marca las cuentas que no traían el saludo puesto y ha habido
     que sacárselo de otro sitio: las de Google y las que existían antes de
     que se pidiera el nombre. Quien lo mire sabrá que conviene guardarlo,
     porque el servidor sigue sin tenerlo y los correos los escribe él. */
  return {
    nombre: nombre,
    apodo: apodo,
    saludo: guardado || saludoDe(nombre, apodo),
    deducido: !guardado
  };
}

/* El perfil de quien está dentro ahora mismo. Vacío si no hay sesión — y eso
   no es un error: se puede usar Norata entera sin cuenta. */
function perfilActual() {
  return ((sync.cfg || {}).perfil) || { nombre: "", apodo: "", saludo: "" };
}

function saludoActual() {
  return perfilActual().saludo || "";
}

/* Para los textos que quieren nombrar a alguien pero tienen que funcionar sin
   nombre. Devuelve ", Lalo" o cadena vacía, así quien lo usa lo pega detrás
   sin preguntar nada. */
function coma(nombre) {
  const n = limpiarNombre(nombre == null ? saludoActual() : nombre, APODO_MAX);
  return n ? ", " + n : "";
}

/* ================= El círculo con la inicial =================
   Lo que hay en vez de una foto. Resuelve lo único que un avatar tenía que
   resolver aquí —«¿en qué cuenta estoy?»— y no necesita almacenamiento,
   permisos, recorte, ni decidir qué hacer si alguien sube algo que no debía.

   El color sale de la cuenta y no del nombre: así no cambia al cambiarse el
   apodo, y dos personas que se llamen igual no acaban con el mismo círculo.
   Y sale del identificador y no de un sorteo, porque tiene que ser el mismo
   en el teléfono que en la computadora sin guardarlo en ningún sitio. */

/* Colores elegidos para que la letra oscura de encima se lea en todos: la
   paleta de la app más cuatro tonos que la separan sin salirse de ella.
   Ninguno es tan pálido como para desaparecer sobre la tarjeta clara del
   correo, ni tan oscuro como para tragarse la letra. */
const AVATAR_COLORES = [
  "#5fe0b0",  // menta
  "#f5d76e",  // amarillo luciérnaga
  "#ff8a70",  // coral
  "#8ecdf5",  // cielo
  "#c9a7f0",  // violeta
  "#a8e06a",  // lima
  "#f79ec0",  // rosa
  "#f0b978"   // ámbar
];

/* Suma de letras y resto: no hace falta nada mejor. Solo tiene que repartir
   ocho colores de forma estable, no resistirse a nadie. */
function avatarColor(semilla) {
  const s = String(semilla || "");
  let n = 0;
  for (let i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) % 100000;
  return AVATAR_COLORES[n % AVATAR_COLORES.length];
}

/* La letra. Del saludo si lo hay y, si no, del correo — que siempre existe, y
   así una cuenta vieja sin nombre no enseña un círculo mudo. */
function avatarInicial(saludo, correo) {
  const base = limpiarNombre(saludo, APODO_MAX) || String(correo || "");
  const l = base.charAt(0);
  return l ? l.toUpperCase() : "·";
}

/* `tam` es el diámetro en píxeles. Se pasa como número y no se saca de una
   clase porque el mismo círculo sale grande en Ajustes y pequeño en la
   portada, y dos clases para lo mismo se desincronizan a la primera.

   Los datos se pasan sueltos en vez de leerse de la sesión porque hay un
   sitio donde todavía no hay sesión: la pantalla de entrada, que enseña el
   círculo de quien entró la última vez en este dispositivo. */
function avatarPinta(semilla, saludo, correo, tam) {
  const d = tam || 44;
  return '<span class="avatar" aria-hidden="true" style="' +
    'width:' + d + 'px;height:' + d + 'px;font-size:' + Math.round(d * 0.42) + 'px;' +
    'background:' + avatarColor(semilla || correo) + '">' +
    escapeHtml(avatarInicial(saludo, correo)) + '</span>';
}

function avatarHTML(tam) {
  const cfg = sync.cfg || {};
  return avatarPinta((cfg.sesion || {}).uid, perfilActual().saludo, cfg.correo, tam);
}

/* ================= Quién entró la última vez =================
   Tres datos que sobreviven al cierre de sesión, para que la pantalla de
   entrada pueda saludar por su nombre en vez de tratar de desconocido a quien
   entra todos los días. No hay nada aquí que permita entrar: la contraseña no
   se guarda, y con el correo y un nombre de pila solo se ahorra teclear.

   El identificador va con ellos por un detalle pequeño y visible: el color
   del círculo se calcula a partir de él, y sin guardarlo habría que sacarlo
   del correo — el círculo saldría de un color antes de entrar y de otro
   después, un parpadeo justo en el momento en que la app quiere decir "te
   reconozco". */
function recordarUltimo() {
  const cfg = sync.cfg || {};
  const s = limpiarNombre(((cfg.perfil) || {}).saludo, APODO_MAX);
  if (!s || !cfg.correo) return;
  sync.ultimoSaludo = s;
  sync.ultimoCorreo = cfg.correo;
  sync.ultimoUid = (cfg.sesion || {}).uid || "";
  saveSync();
}

function olvidarUltimo() {
  delete sync.ultimoSaludo;
  delete sync.ultimoCorreo;
  delete sync.ultimoUid;
  saveSync();
}

/* ================= El correo de bienvenida =================
   Esto NO manda el correo: solo avisa de que alguien acaba de entrar. Quien
   decide si toca mandarlo es la función `bienvenida` del servidor, que mira
   una marca que ella misma escribió y que desde aquí no se puede tocar.

   Se hace así y no al revés porque la decisión no se puede confiar al
   navegador: recargar la página veinte veces mandaría veinte correos.

   Se llama al entrar y no al registrarse porque en ese momento la dirección
   todavía no está confirmada — es decir, todavía no se ha demostrado que sea
   suya. La primera entrada de verdad ocurre justo después de pulsar el enlace
   del correo de confirmación, que es exactamente cuando la bienvenida tiene
   sentido.

   Falla en silencio a propósito, y esa es la parte importante: mientras la
   función no esté desplegada, esta llamada devuelve un error que no le importa
   a nadie. Nadie se queda sin entrar porque un correo de cortesía no salga. */
async function avisarBienvenida() {
  try {
    if (!syncReady()) return;
    const t = await sbToken();
    await fetch(SB_URL + "/functions/v1/bienvenida", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + t,
        "apikey": SB_KEY,
        "Content-Type": "application/json"
      }
    });
  } catch (e) { /* sin función desplegada, o sin conexión: no pasa nada */ }
}

/* ================= Guardar el perfil =================
   Va a la cuenta y no a la tabla del progreso, así que no pasa por la
   sincronía y no tiene revisiones ni conflictos: es una llamada y ya está.
   Al volver se refresca lo que hay en memoria, para que el resto de la app no
   tenga que acordarse de hacerlo. */
async function guardarPerfil(nombre, apodo) {
  const p = armarPerfil(nombre, apodo);
  await sbGuardarPerfil(p);
  sync.cfg.perfil = p;
  sync.ultimoSaludo = p.saludo;
  saveSync();
  return p;
}
