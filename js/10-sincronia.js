/* Sincronía, copias de conflicto, utilidades y avisos */
/* ================= Sincronía entre dispositivos =================
   Tu progreso vive fuera de este dispositivo para que la computadora y el
   teléfono vean lo mismo. Cada guardado local marca "hay algo que subir" y
   una espera corta agrupa los cambios: así una tarde de uso son unos pocos
   envíos y no uno por cada toque.

   La credencial se guarda en una llave aparte de localStorage y NUNCA dentro
   de `state`. Es a propósito: `state` es exactamente lo que se sube, así que
   meter ahí la credencial sería publicarla.

   Sobre pisar datos: el almacén identifica cada versión con una MARCA
   opaca. Guardamos la que conocemos y la mandamos al escribir; si el remoto
   cambió desde otro dispositivo, la escritura se rechaza. Entonces preguntamos
   en vez de decidir por ti, y el lado que no elijas se guarda como copia
   local antes de tocar nada.

   ---- Por qué sigue habiendo una interfaz de almacén ----
   Hoy solo hay uno, Supabase, y la interfaz podría parecer de más. Se queda
   porque ya demostró para qué sirve: la mudanza desde GitHub no tocó ni una
   línea de lo de arriba —la espera, la marca, la pregunta ante un conflicto,
   las copias—, que es justo la parte que puede perder progreso si se rompe.
   La próxima mudanza tampoco tendría que tocarla.

   Un almacén debe ofrecer:
     nombre                cómo se llama, para los textos de la app
     etiqueta()            de dónde vienen los datos, para el estado
     listo()               si está configurado
     explicacion()         qué le pasa a tus datos ahí, para Ajustes
     configurar(valores)   inicia sesión y devuelve su configuración
     leer()                -> {vacio:true} | {marca, env}
     escribir(env, marca)  -> {ok:true, marca} | {ok:false, conflicto:true}

   `escribir` devuelve `conflicto` en vez de un código HTTP: quien lo llama no
   tiene por qué saber que 409 y 422 significan lo mismo. Los errores se
   lanzan ya traducidos a algo que el usuario pueda accionar. */

const SYNC_KEY = "mainquest-sync-v1";
const SYNC_DELAY = 4000;

const ALMACENES = {};

function almacen() {
  return ALMACENES[sync.tipo] || ALMACENES.supabase;
}

let sync = loadSync();
let syncTimer = null;
let syncBusy = false;
let syncError = null;

function loadSync() {
  const base = {
    enabled: false, tipo: "supabase", cfg: {},
    device: "", marca: null, rev: 0, dirty: false, lastAt: null
  };
  try {
    const raw = localStorage.getItem(SYNC_KEY);
    if (raw) Object.assign(base, JSON.parse(raw));
  } catch (e) { /* configuración corrupta: volver a los valores por defecto */ }
  if (!base.cfg || typeof base.cfg !== "object") base.cfg = {};

  /* Un dispositivo que se quedó sincronizando contra GitHub. Ese almacén ya no
     existe en la app, así que la configuración se jubila aquí: se suelta la
     credencial y se apaga la sincronía, y en el siguiente arranque aparece la
     pantalla de entrada.

     Lo que NO se toca son los datos de este dispositivo. Siguen enteros en
     localStorage y son los que se subirán al entrar con la cuenta, así que la
     mudanza no pierde nada aunque el teléfono llevara semanas sin abrirse.
     El repositorio de GitHub tampoco se borra: se queda tal cual, de archivo. */
  if (base.tipo === "github" || base.owner || base.cfg.token) {
    base.tipo = "supabase";
    base.cfg = {};
    base.enabled = false;
    base.entrada = null;
    base.marca = null;
    base.rev = 0;
    base.dirty = false;
  }
  ["owner", "repo", "token", "path", "branch", "sha"].forEach(k => delete base[k]);

  if (!base.device) base.device = guessDeviceName();
  return base;
}

function saveSync() {
  try { localStorage.setItem(SYNC_KEY, JSON.stringify(sync)); } catch (e) {}
}

function guessDeviceName() {
  const ua = navigator.userAgent || "";
  if (/iPhone|Android.*Mobile/i.test(ua)) return "Teléfono";
  if (/iPad|Tablet|Android/i.test(ua)) return "Tableta";
  if (/Macintosh/i.test(ua)) return "Mac";
  return "Computadora";
}

function syncReady() {
  return !!(sync && sync.enabled && almacen().listo());
}

/* Marca que hay algo que subir. Es una declaración de función (y lleva
   try/catch) para que `save()` pueda llamarla sin importar en qué momento
   del arranque ocurra. */
function syncTouch() {
  try {
    if (!syncReady()) return;
    sync.dirty = true;
    // Cuándo se tocó esto por última vez. Sin este dato, ante un conflicto
    // solo se puede fechar el lado remoto, y elegir "el más reciente" se
    // vuelve una adivinanza.
    sync.dirtyAt = new Date().toISOString();
    saveSync();
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => syncRun({ silent: true }), SYNC_DELAY);
  } catch (e) { /* la sincronía todavía no existe: se subirá al próximo guardado */ }
}


function envelope(rev) {
  return {
    app: "mainquest", version: 1, schema: SCHEMA, rev: rev,
    updatedAt: new Date().toISOString(), device: sync.device, state: state
  };
}

function syncCount(s) {
  if (!s) return "sin datos";
  return (s.skills || []).length + " habilidades, " + (s.missions || []).length +
    " misiones, " + (s.perks || []).length + " talentos y " + (s.projects || []).length + " proyectos";
}

/* Fecha y hora completas: en un conflicto lo que se compara es justo eso.
   "hace poco" no sirve para decidir. */
function syncFecha(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString("es-MX", {
      timeZone: userTZ(), day: "numeric", month: "short",
      hour: "2-digit", minute: "2-digit"
    });
  } catch (e) { return null; }
}

function hasLocalData() {
  return (state.skills || []).length + (state.perks || []).length +
    (state.projects || []).length + (state.missions || []).length > 0;
}

/* Antes de que un lado gane, el otro se guarda aquí. Ocupa espacio, sí, pero
   perder una semana de rachas por una sincronía mal resuelta ocupa más. */
function stashConflict(tag, data) {
  try {
    localStorage.setItem(COPIA_PREFIJO + tag + "-" + Date.now(), JSON.stringify(data));
  } catch (e) { /* sin sitio: mejor seguir que abortar la sincronía a medias */ }
  /* Antes no había tope y nadie las borraba nunca: cada conflicto dejaba un
     estado entero ocupando sitio para siempre, hasta llenar el almacén y
     tumbar el guardado de los datos vivos. Se conservan las últimas. */
  podarCopias();
}

/* Tira las que sobran del tope. Se llama al guardar una nueva y también al
   enseñar la lista: quien ya tenía cinco de antes no debería seguir viéndolas
   —ni ocupando sitio— hasta que se dé la próxima sincronía conflictiva. */
function podarCopias() {
  const copias = listarCopias();
  for (let i = MAX_COPIAS; i < copias.length; i++) {
    try { localStorage.removeItem(copias[i].key); } catch (e) {}
  }
}

/* ---- Ajustes: las copias de conflicto, a la vista ----
   Guardarlas y no enseñarlas era prometer un respaldo que no existía: el
   archivo estaba ahí, pero no había forma humana de sacarlo desde la app. */

function renderCopias() {
  const cont = document.getElementById("copias-lista");
  if (!cont) return;
  podarCopias();
  const copias = listarCopias().filter(c => c.datos);

  if (!copias.length) {
    cont.innerHTML = `<p class="settings-note" style="margin:0">No hay ninguna, y es buena señal: significa que tus dispositivos nunca han tenido que juntar cambios a la fuerza.</p>`;
    return;
  }

  cont.innerHTML = copias.map(c => {
    const cuando = c.ms ? syncFecha(new Date(c.ms).toISOString()) : null;
    const de = c.lado === "remoto" ? "la versión del otro dispositivo" : "la versión de este dispositivo";
    return `
      <div class="copia-item">
        <div class="copia-info">
          <b>${escapeHtml(cuando || "sin fecha")}</b>
          <span>Se apartó ${escapeHtml(de)} · ${escapeHtml(syncCount(c.datos))}</span>
        </div>
        <div class="copia-acts">
          <button class="btn btn-soft" onclick="restaurarCopia('${escapeHtml(c.key)}')">Restaurar</button>
          <button class="btn btn-danger-ghost" onclick="borrarCopia('${escapeHtml(c.key)}')">Borrar</button>
        </div>
      </div>`;
  }).join("");
}

async function restaurarCopia(key) {
  let datos = null;
  try { datos = JSON.parse(localStorage.getItem(key)); } catch (e) {}
  if (!datos) { toast("Esa copia ya no se puede leer", "atencion"); return; }

  if (!await ask(
    `Se pondrá esta copia (${syncCount(datos)}) en lugar de lo que tienes ahora (${syncCount(state)}). ` +
    `Lo de ahora se guarda como otra copia antes de cambiar nada.`,
    "Restaurar")) return;

  /* Restaurar es exactamente el mismo movimiento peligroso que resolver un
     conflicto, así que se protege igual: el lado que sale se aparta primero. */
  stashConflict("previo", state);
  if (!guardarLocal(datos)) return;
  state = load();
  applyDecay();
  showView("summary");
  toast("Copia restaurada", "logro");
}

async function borrarCopia(key) {
  if (!await ask("Se borrará esta copia de seguridad. No se puede deshacer.", "Borrar", true)) return;
  try { localStorage.removeItem(key); } catch (e) {}
  renderCopias();
  toast("Copia borrada", "deshecho");
}

function adoptRemote(env) {
  guardarLocal(env.state);
  state = load();
  applyDecay();
  showView(activeMainView || "summary");
}

async function syncOnce(opts) {
  const almacenActual = almacen();
  const remote = await almacenActual.leer();

  // Todavía no hay nada allá: lo sembramos con lo que hay aquí
  if (remote.vacio) {
    const env = envelope((sync.rev || 0) + 1);
    const w = await almacenActual.escribir(env, null);
    if (w.conflicto) { const e = new Error("carrera"); e.retry = true; throw e; }
    sync.marca = w.marca; sync.rev = env.rev;
    sync.dirty = false; sync.lastAt = env.updatedAt; saveSync();
    if (!opts.silent) toast("Listo: tu progreso ya está en " + almacenActual.nombre, "logro");
    return;
  }

  const env = remote.env;

  /* El caso que justifica todo el versionado: el otro dispositivo ya se
     actualizó y este no. Se corta ANTES de leer nada y antes de escribir
     nada — si siguiéramos, o adoptaríamos datos que no entendemos, o los
     pisaríamos con los nuestros, que es peor. */
  const schemaRemoto = Number(env && (env.schema || (env.state && env.state.schemaVersion))) || 1;
  if (schemaRemoto > SCHEMA) {
    throw new Error("El otro dispositivo usa una versión más nueva de Norata. Actualiza esta (recarga la página) antes de sincronizar.");
  }

  const remoteRev = env && typeof env.rev === "number" ? env.rev : 0;
  const remoteNewer = remoteRev > sync.rev || remote.marca !== sync.marca;

  if (sync.dirty && remoteNewer && env && env.state) {
    /* Los dos lados avanzaron. Antes esto abría una pregunta y elegir tiraba
       un lado entero; ahora se juntan. La copia previa se guarda igual: la
       fusión no debería perder nada, pero "no debería" no es lo mismo que
       "no puede", y el coste de guardarla es un puñado de bytes. */
    stashConflict("previo", state);

    const suyoEsMasNuevo = Date.parse(env.updatedAt || 0) > Date.parse(sync.dirtyAt || 0);
    guardarLocal(fusionarEstados(state, env.state, suyoEsMasNuevo));
    state = load();
    applyDecay();
    showView(activeMainView || "summary");

    sync.marca = remote.marca; sync.rev = remoteRev;
    // Sigue habiendo algo que subir: la fusión, que ninguno de los dos tiene
    sync.dirty = true;
    saveSync();
    if (!opts.silent) toast("Al día con " + (env.device || "el otro dispositivo"), "hecho");
  } else if (remoteNewer && env && env.state) {
    adoptRemote(env);
    sync.marca = remote.marca; sync.rev = remoteRev;
    sync.dirty = false; sync.lastAt = env.updatedAt; saveSync();
    renderSync();
    if (!opts.silent) toast("Al día con " + (env.device || "el otro dispositivo"));
    return;
  } else {
    sync.marca = remote.marca;
  }

  if (!sync.dirty) {
    sync.lastAt = new Date().toISOString(); saveSync();
    if (!opts.silent) toast("Todo al día", "calma");
    return;
  }

  const out = envelope(Math.max(sync.rev || 0, remoteRev) + 1);
  const w = await almacenActual.escribir(out, sync.marca);
  if (w.conflicto) { const e = new Error("carrera"); e.retry = true; throw e; }
  sync.marca = w.marca; sync.rev = out.rev;
  sync.dirty = false; sync.lastAt = out.updatedAt; saveSync();
  if (!opts.silent) toast("Sincronizado");
}

async function syncRun(opts) {
  opts = opts || {};
  if (!syncReady() || syncBusy) return;
  if (navigator.onLine === false) {
    if (!opts.silent) toast("Sin conexión: se subirá cuando vuelva", "calma");
    return;
  }
  syncBusy = true; syncError = null; renderSync();
  try {
    // Un reintento cubre el caso de que otro dispositivo escriba justo entre
    // nuestra lectura y nuestra escritura.
    for (let intento = 0; intento < 2; intento++) {
      try { await syncOnce(opts); break; }
      catch (e) { if (e && e.retry && intento === 0) continue; throw e; }
    }
  } catch (e) {
    syncError = (e && e.message) || String(e);
    if (!opts.silent) toast(syncError);
  } finally {
    syncBusy = false;
    renderSync();
  }
}

/* ---- Ajustes: conectar, estado y desconexión ---- */

function renderSync() {
  const statusEl = document.getElementById("sync-status");
  const panelEl = document.getElementById("sync-panel");
  if (!statusEl || !panelEl) return;

  const alm = almacen();

  /* Los textos explicativos los pone el almacén y no están escritos en el
     HTML: cuando lo estaban, seguían hablando de repositorios y de tokens
     después de haberse mudado a una cuenta de correo. */
  const nota = document.getElementById("sync-nota");
  if (nota) nota.textContent = alm.explicacion();
  const notaDatos = document.getElementById("datos-nota");
  if (notaDatos) {
    notaDatos.textContent = "Tu progreso vive en este navegador" +
      (syncReady() ? " y en " + alm.nombre + "" : "") +
      ". También puedes guardarlo en un archivo: es tuyo y funciona sin conexión.";
  }

  let dot = "", titulo = "", detalle = "";
  if (!syncReady()) {
    dot = ""; titulo = "Solo en este dispositivo";
    detalle = "Tu progreso no sale de este navegador.";
  } else if (syncBusy) {
    dot = "busy"; titulo = "Sincronizando…"; detalle = alm.etiqueta();
  } else if (syncError) {
    dot = "bad"; titulo = "No pude sincronizar"; detalle = syncError;
  } else {
    dot = "ok";
    titulo = sync.dirty ? "Cambios sin subir" : "Al día con " + alm.nombre;
    let cuando = "";
    if (sync.lastAt) {
      try {
        cuando = " · última vez " + new Date(sync.lastAt).toLocaleString("es-MX", {
          timeZone: userTZ(), day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
        });
      } catch (e) {}
    }
    detalle = alm.etiqueta() + cuando;
  }
  statusEl.innerHTML =
    '<span class="sync-dot ' + dot + '"></span>' +
    '<span class="sync-text"><b>' + escapeHtml(titulo) + '</b><span>' + escapeHtml(detalle) + '</span></span>';

  if (syncReady()) {
    const pruebas = esCuentaDePruebas();
    const p = perfilActual();
    /* La ficha de arriba contesta de un vistazo la pregunta que trae aquí a
       casi todo el mundo: en qué cuenta estoy. Antes solo estaba el correo,
       perdido entre el estado de la sincronía; ahora hay una cara —el círculo
       con la inicial y su color— que se reconoce sin leer. */
    panelEl.innerHTML =
      '<div class="perfil-ficha">' + avatarHTML(48) +
      '<div class="perfil-quien"><b>' + escapeHtml(p.saludo || "Sin nombre") + '</b>' +
      '<span>' + escapeHtml((sync.cfg || {}).correo || "") + '</span></div></div>' +
      '<label class="field"><span>Tu nombre</span>' +
      '<input type="text" id="perfil-nombre" maxlength="' + NOMBRE_MAX + '" autocomplete="name"' +
      ' value="' + escapeAttr(p.nombre) + '" onchange="perfilGuardarAqui()"></label>' +
      '<label class="field"><span>¿Cómo te decimos? <i>opcional</i></span>' +
      '<input type="text" id="perfil-apodo" maxlength="' + APODO_MAX + '" autocomplete="nickname"' +
      ' value="' + escapeAttr(p.apodo) + '" onchange="perfilGuardarAqui()">' +
      '<div class="field-hint">Es lo que usaremos al saludarte, aquí y en los correos.</div></label>' +
      '<label class="field"><span>Nombre de este dispositivo</span>' +
      '<input type="text" id="sync-device" value="' + escapeAttr(sync.device) + '" onchange="syncRenameDevice(this.value)">' +
      '<div class="field-hint">Aparece cuando dos dispositivos cambian lo mismo y hay que elegir.</div></label>' +
      '<div class="field"><span class="lbl">¿Qué es esta cuenta?</span><div class="seg">' +
      '<button' + (pruebas ? "" : ' class="on"') + ' onclick="marcarCuentaDePruebas(false)">Mi cuenta real</button>' +
      '<button' + (pruebas ? ' class="on"' : "") + ' onclick="marcarCuentaDePruebas(true)">De pruebas</button>' +
      '</div><div class="field-hint">' + (pruebas
        ? "Verás un marco punteado amarillo mientras la uses, y borrar todo no pedirá confirmación extra."
        : "Borrar todo te pedirá escribir tu correo. Es a propósito: obliga a mirar en qué cuenta estás.") +
      '</div></div>' +
      '<div class="stack">' +
      '<button class="btn btn-soft btn-block" onclick="syncRun({})">Sincronizar ahora</button>' +
      '<button class="btn btn-danger-ghost btn-block" onclick="syncDisconnect()">Cerrar sesión en este dispositivo</button>' +
      '</div>';
    return;
  }

  /* Sin sesión, aquí no se pide nada: el correo y la contraseña se escriben
     en la pantalla de entrada, que es donde ya vive ese formulario. Tenerlo
     dos veces significaba mantener dos caminos para lo mismo, y el de Ajustes
     era el peor de los dos — sin logo, sin Google, sin "probar sin cuenta" y
     escondido detrás de un menú. */
  panelEl.innerHTML =
    '<div class="stack">' +
    '<button class="btn btn-primary btn-block" onclick="mostrarPortada()">Iniciar sesión o crear cuenta</button>' +
    '</div>' +
    '<p class="field-hint" style="margin-top:10px">Mientras tanto tu progreso se guarda solo en este dispositivo. Al entrar, lo que ya tienes aquí sube a tu cuenta.</p>';
}

/* Guarda el nombre y el apodo desde Ajustes.

   Lee los DOS campos aunque solo se haya tocado uno: el guardado reemplaza el
   perfil entero en el servidor, así que mandar únicamente el que cambió
   borraría el otro. Es el mismo motivo por el que `armarPerfil` devuelve
   siempre el trío completo. */
async function perfilGuardarAqui() {
  const n = document.getElementById("perfil-nombre");
  const a = document.getElementById("perfil-apodo");
  if (!n || !a) return;
  const antes = perfilActual();
  const quiere = armarPerfil(n.value, a.value);
  if (quiere.nombre === antes.nombre && quiere.apodo === antes.apodo) return;
  try {
    await guardarPerfil(n.value, a.value);
    renderSync();
    /* Se avisa por el saludo y no por el nombre: es el que se va a ver, y
       enseñarlo aquí es la única forma de comprobar que el apodo hizo lo que
       se esperaba sin tener que cerrar sesión para verlo. */
    toast(quiere.saludo ? "Te llamaremos " + quiere.saludo : "Nombre guardado", "logro");
  } catch (e) {
    toast((e && e.message) || String(e));
    renderSync();   // devuelve los campos a lo que sí está guardado
  }
}

function syncRenameDevice(v) {
  sync.device = String(v || "").trim() || guessDeviceName();
  saveSync();
  renderSync();
}

async function syncDisconnect() {
  const alm = almacen();
  if (!await ask("Se borrará la credencial de este dispositivo y tu progreso dejará de subirse. Lo que ya subiste sigue en tu cuenta.", "Desconectar")) return;
  /* Se va la credencial entera, no solo una llave con nombre fijo: cada
     almacén guarda lo suyo y aquí no se sabe cómo se llama. */
  sync.enabled = false; sync.cfg = {}; sync.marca = null; sync.dirty = false;
  /* Cerrar sesión devuelve a la portada. Dejar la app abierta con los datos
     de quien acaba de salir sería justo lo contrario de lo que pidió. */
  sync.entrada = null;
  saveSync();
  syncError = null;
  renderSync();
  pintarAvisoPruebas();
  mostrarPortada();
  toast("Sesión cerrada", "deshecho");
}

/* ---- Borrar la cuenta entera ----
   Distinto de "borrar todos los datos": aquello vacía el progreso y deja la
   cuenta en pie; esto quita también el correo del servidor, y con él la
   forma de volver a entrar. Por eso la puerta es más estrecha: además de las
   confirmaciones hay que escribir una frase que no se teclea sin querer.

   Y no borra hoy: apunta una fecha a 30 días vista. Hasta entonces se puede
   recuperar entera volviendo a entrar con el mismo correo, porque en el
   servidor sigue estando todo. De este dispositivo sí se va en el momento —
   dejar el progreso a la vista de alguien que acaba de pedir borrarlo sería
   contestarle que no.

   Pasada la fecha se borra el usuario del servidor y el correo queda libre
   para registrarse otra vez. Eso no es un efecto secundario: es la razón de
   borrar de verdad en vez de limitarse a vaciar la fila. */

const FRASE_BORRAR = "BORRAR MI CUENTA";

function renderZonaCuenta() {
  const el = document.getElementById("zona-cuenta");
  if (!el) return;
  if (!syncReady()) { el.innerHTML = ""; return; }
  el.innerHTML =
    '<p class="settings-note" style="margin:16px 0 10px">Al pedirlo se cierra tu sesión y este dispositivo queda vacío, pero la cuenta no se borra hasta <b>30 días después</b>. Si te arrepientes, entra otra vez con tu correo y la recuperas con todo tu progreso.</p>' +
    '<button class="btn btn-danger-ghost btn-block" onclick="borrarCuenta()">Borrar mi cuenta</button>';
}

async function borrarCuenta() {
  if (!syncReady()) return;
  const correo = ((sync.cfg || {}).correo || "tu cuenta").trim();

  if (!await ask(
    "Se cerrará tu sesión y este dispositivo quedará vacío. La cuenta " + correo +
    " se borrará dentro de 30 días; hasta entonces puedes recuperarla entrando otra vez con tu correo.",
    "Continuar", true)) return;

  /* Una frase y no un "¿seguro?": el segundo se pulsa con el dedo ya en
     camino, sin leerlo. Escribir tres palabras obliga a parar. */
  const escrito = await askText(
    "Escribe " + FRASE_BORRAR + " para confirmar que quieres borrarla.",
    "", "Borrar la cuenta", FRASE_BORRAR, 40);
  if (escrito === null) return;
  if (String(escrito).trim().toUpperCase() !== FRASE_BORRAR) {
    toast("No coincide. No borré nada.", "calma");
    return;
  }

  cargaMostrar("Programando el borrado…");
  let cuando = null;
  try {
    cuando = await sbPedirBorrado();
  } catch (e) {
    cargaCerrar();
    toast((e && e.message) || String(e), "atencion");
    return;
  }

  /* Del servidor ya no queda nada, así que aquí tampoco puede quedar: ni el
     progreso, ni las copias de conflicto —que son fotos de esa misma cuenta—,
     ni la marca de cuenta de pruebas. Borrar a medias sería lo peor de las
     dos opciones: la cuenta ya no existe y sus datos siguen en el aparato. */
  listarCopias().forEach(c => { try { localStorage.removeItem(c.key); } catch (e) {} });
  sync.cuentasPrueba = (sync.cuentasPrueba || []).filter(c => c !== correo.toLowerCase());
  sync.enabled = false; sync.cfg = {}; sync.marca = null; sync.rev = 0;
  sync.dirty = false; sync.lastAt = null; sync.entrada = null; sync.dueño = null;
  saveSync();
  syncError = null;

  guardarLocal({
    skills: [], perks: [], projects: [], missions: [], cajas: [],
    settings: { timezone: userTZ() }, schemaVersion: SCHEMA
  });
  state = load();

  pintarAvisoPruebas();
  showView("summary");
  renderSync();
  renderCopias();
  renderZonaCuenta();
  mostrarPortada();
  cargaCerrar();
  const fecha = fechaLarga(cuando);
  toast(fecha ? "Tu cuenta se borrará el " + fecha : "Borrado programado", "deshecho");
}

/* Una fecha para leer, no para calcular: el día y el mes con letra. La hora
   sobra —el plazo es de un mes— y en una fecha lejana solo añade ruido. */
function fechaLarga(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("es-MX", {
      timeZone: userTZ(), day: "numeric", month: "long", year: "numeric"
    });
  } catch (e) { return null; }
}

/* ================= Utilidades ================= */

function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, "&#39;");
}

function formatDate(key) {
  if (!key) return "—";
  return keyToDate(key).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

function stamp() { return new Date().toISOString(); }

/* Fecha con hora para los movimientos; los registros viejos solo tienen día. */
function formatWhen(e) {
  if (e.at) {
    const d = new Date(e.at);
    const tz = userTZ();
    try {
      return d.toLocaleDateString("es-MX", { timeZone: tz, day: "numeric", month: "short", year: "numeric" }) +
        " · " + d.toLocaleTimeString("es-MX", { timeZone: tz, hour: "2-digit", minute: "2-digit" });
    } catch (err) {
      return d.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
    }
  }
  return formatDate(e.date);
}

function planLabel(days) {
  if (days % 365 === 0) { const y = days / 365; return y === 1 ? "1 año" : y + " años"; }
  if (days % 30 === 0) { const m = days / 30; return m === 1 ? "1 mes" : m + " meses"; }
  return days + " días";
}

/* ================= Avisos =================
   Cinco tonos, porque no todo lo que la app dice significa lo mismo.
   Los iconos son de trazo, del mismo juego que el catálogo de habilidades:
   nada de caracteres de texto, que dependen de la fuente del sistema y se
   ven distintos en cada dispositivo. */
const TOAST_TIPOS = {
  // Ganaste algo: XP, nivel, racha, un talento cerrado
  logro: { ms: 2600, icon: '<path d="M12 3.5l1.9 4.4 4.6.4-3.5 3 1.1 4.5L12 13.4 7.9 15.8 9 11.3 5.5 8.3l4.6-.4z"/><path d="M18.5 16.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z"/>' },
  // Se guardó, se creó, se sincronizó
  hecho: { ms: 2200, icon: '<path d="M4.5 12.5l5 5L19.5 6.5"/>' },
  // Quitaste, cortaste, revertiste: ni error ni celebración
  deshecho: { ms: 3000, icon: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a5 5 0 010 10h-2"/>' },
  // No se pudo, falta algo, se alcanzó un límite
  atencion: { ms: 4500, icon: '<path d="M10.3 3.9L2.6 17.2A2 2 0 004.3 20.2h15.4a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/><path d="M12 9v4M12 16.4v.2"/>' },
  // Descanso, sin conexión, nada que hacer: nube y zzz
  calma: { ms: 3500, icon: '<path d="M4.5 19h8.2a3.1 3.1 0 100-6.2 4.4 4.4 0 00-8.3.9A2.7 2.7 0 004.5 19z"/><path d="M13.8 3.2h4.4l-4.4 4.6h4.4"/><path d="M19.4 9.6h2.9l-2.9 3h2.9"/>' }
};

let toastSeq = 0;

function toast(msg, tipo, accion) {
  const cont = document.getElementById("toast");
  if (!cont) return;
  const t = TOAST_TIPOS[tipo] || TOAST_TIPOS.hecho;

  /* Se apilan hasta tres en vez de pisarse. Antes, dos acciones seguidas
     hacían desaparecer el primer aviso sin que nadie lo leyera. */
  while (cont.children.length >= 3) cont.firstElementChild.remove();

  const id = "tst" + (++toastSeq);
  const el = document.createElement("div");
  el.className = "toast t-" + (TOAST_TIPOS[tipo] ? tipo : "hecho");
  el.id = id;
  el.innerHTML =
    `<span class="t-ic"><svg viewBox="0 0 24 24">${t.icon}</svg></span>` +
    `<span class="t-tx">${escapeHtml(msg)}</span>` +
    (accion ? `<button class="t-act" onclick="cerrarToast('${id}');${accion.onclick}">${escapeHtml(accion.label)}</button>` : "");
  cont.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));

  // Si hay algo que pulsar, hay que dar tiempo real a verlo y decidir
  setTimeout(() => cerrarToast(id), accion ? Math.max(t.ms, 6000) : t.ms);
}

function cerrarToast(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove("show");
  setTimeout(() => el.remove(), 240);
}

