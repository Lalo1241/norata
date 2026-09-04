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
    /* Viendo el ejemplo no hay nada que marcar como pendiente: lo que se está
       tocando no es del usuario. Sin esto, el previsualizador dejaba la
       bandera de «hay algo que subir» puesta y el temporizador armado, y al
       salir se subía una foto de datos inventados. */
    if (modoEjemplo) return;
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
    return new Date(iso).toLocaleString(localeActual(), {
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
    cont.innerHTML = `<p class="settings-note" style="margin:0">${tx("No hay ninguna, y es buena señal: significa que tus dispositivos nunca han tenido que juntar cambios a la fuerza.")}</p>`;
    return;
  }

  cont.innerHTML = copias.map(c => {
    const cuando = c.ms ? syncFecha(new Date(c.ms).toISOString()) : null;
    /* El nombre dice de dónde salió la copia. Con un solo ternario, la que
       guarda un cambio de moneda decía "se apartó la versión de este
       dispositivo" —cierto y no dice nada—: quien viene a restaurarla viene
       porque el tipo de cambio estaba mal, y tiene que reconocerla. */
    const DE_DONDE = {
      remoto: "la versión del otro dispositivo",
      local: "la versión de este dispositivo",
      moneda: "lo que había antes de cambiar de moneda"
    };
    const de = DE_DONDE[c.lado] || DE_DONDE.local;
    return `
      <div class="copia-item">
        <div class="copia-info">
          <b>${escapeHtml(cuando || "sin fecha")}</b>
          <span>Se apartó ${escapeHtml(de)} · ${escapeHtml(syncCount(c.datos))}</span>
        </div>
        <div class="copia-acts">
          <button class="btn btn-soft" onclick="restaurarCopia('${escapeHtml(c.key)}')">${tx("Restaurar")}</button>
          <button class="btn btn-danger-ghost" onclick="borrarCopia('${escapeHtml(c.key)}')">${tx("Borrar")}</button>
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
  /* El segundo candado del ejemplo, y el que de verdad hacía falta: por aquí
     pasan las SIETE puertas de la sincronía —el temporizador, «Sincronizar
     ahora», volver a la pestaña, recuperar la conexión, el arranque, la
     entrada y el tirón para actualizar—. Cerrar solo `syncTouch` dejaba
     fuera a las seis que no dependen de haber tocado nada: bastaba con
     entrar al ejemplo y cambiar de pestaña para que se subiera. */
  if (modoEjemplo) return;
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
    notaDatos.textContent = syncReady()
      ? T`Tu progreso vive en este navegador y en ${alm.nombre}. También puedes guardarlo en un archivo: es tuyo y funciona sin conexión.`
      : tx("Tu progreso vive en este navegador. También puedes guardarlo en un archivo: es tuyo y funciona sin conexión.");
  }

  let dot = "", titulo = "", detalle = "";
  if (!syncReady()) {
    dot = ""; titulo = tx("Solo en este dispositivo");
    detalle = tx("Tu progreso no sale de este navegador.");
  } else if (syncBusy) {
    dot = "busy"; titulo = tx("Sincronizando…"); detalle = alm.etiqueta();
  } else if (syncError) {
    dot = "bad"; titulo = tx("No pude sincronizar"); detalle = syncError;
  } else {
    dot = "ok";
    titulo = sync.dirty ? tx("Cambios sin subir") : T`Al día con ${alm.nombre}`;
    let cuando = "";
    if (sync.lastAt) {
      try {
        cuando = T` · última vez ${new Date(sync.lastAt).toLocaleString(localeActual(), {
          timeZone: userTZ(), day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
        })}`;
      } catch (e) {}
    }
    detalle = alm.etiqueta() + cuando;
  }
  statusEl.innerHTML =
    '<span class="sync-dot ' + dot + '"></span>' +
    '<span class="sync-text"><b>' + escapeHtml(titulo) + '</b><span>' + escapeHtml(detalle) + '</span></span>';

  if (syncReady()) {
    const p = perfilActual();
    /* La ficha de arriba contesta de un vistazo la pregunta que trae aquí a
       casi todo el mundo: en qué cuenta estoy. Antes solo estaba el correo,
       perdido entre el estado de la sincronía; ahora hay una cara —el círculo
       con la inicial y su color— que se reconoce sin leer. */
    panelEl.innerHTML =
      /* Y al otro extremo, la insignia del nivel: la misma pareja de círculos
         que la fila del menú de la cuenta —quién eres a la izquierda, por
         dónde vas a la derecha—. Con `typeof` porque esta ficha se dibuja
         también en la puerta, donde no hay datos que contar. */
      /* La ficha entera es la puerta de la colección, igual que la fila del
         menú del engrane: donde está la insignia, se toca la insignia. */
      '<button class="perfil-ficha" onclick="abrirColeccion(\'settings\')">' + avatarHTML(48) +
      '<div class="perfil-quien"><b>' + escapeHtml(p.saludo || tx("Sin nombre")) + '</b>' +
      '<span>' + escapeHtml((sync.cfg || {}).correo || "") + '</span></div>' +
      (typeof insigniaExpedicionHTML === "function" ? insigniaExpedicionHTML(30) : "") +
      '</button>' +
      '<label class="field"><span>' + tx("Tu nombre") + '</span>' +
      '<input type="text" id="perfil-nombre" maxlength="' + NOMBRE_MAX + '" autocomplete="name"' +
      ' value="' + escapeAttr(p.nombre) + '" onchange="perfilGuardarAqui()"></label>' +
      '<label class="field"><span>' + tx("¿Cómo te decimos? <i>opcional</i>") + '</span>' +
      '<input type="text" id="perfil-apodo" maxlength="' + APODO_MAX + '" autocomplete="nickname"' +
      ' value="' + escapeAttr(p.apodo) + '" onchange="perfilGuardarAqui()">' +
      '<div class="field-hint">' + T`Es lo que usaremos al saludarte, aquí y en los correos. Hasta ${APODO_MAX} letras.` + '</div></label>' +
      '<label class="field"><span>' + tx("Nombre de este dispositivo") + '</span>' +
      '<input type="text" id="sync-device" value="' + escapeAttr(sync.device) + '" onchange="syncRenameDevice(this.value)">' +
      '<div class="field-hint">' + tx("Aparece cuando dos dispositivos cambian lo mismo y hay que elegir.") + '</div></label>' +
      /* Aquí estaba «¿Qué es esta cuenta?». Se fue a «Norata por dentro», que
         solo existe para la cuenta que el servidor reconoce como
         administradora: nadie más que Eduardo tiene dos cuentas de Norata, así
         que a todo el mundo le preguntaba algo que no le pasa — y el «sí» de
         ese botón quita la confirmación de borrar. Ver `esCuentaDePruebas` en
         `js/10c-portada.js`. */
      '<div class="stack">' +
      '<button class="btn btn-soft btn-block" onclick="syncRun({})">' + tx("Sincronizar ahora") + '</button>' +
      '<button class="btn btn-aviso btn-block" onclick="syncDisconnect()">' + tx("Cerrar sesión en este dispositivo") + '</button>' +
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
    '<button class="btn btn-primary btn-block" onclick="irALaPuerta()">' + tx("Iniciar sesión o crear cuenta") + '</button>' +
    '</div>' +
    '<p class="field-hint" style="margin-top:10px">' + tx("Mientras tanto tu progreso se guarda solo en este dispositivo. Al entrar, lo que ya tienes aquí sube a tu cuenta.") + '</p>';
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
  /* A la puerta, que ya no está aquí dentro. Dejar la app abierta con los
     datos de quien acaba de salir sería justo lo contrario de lo que pidió. */
  irALaPuerta();
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

/* Se pide al DIBUJAR y no se guarda en una constante, y aquí eso importa más
   que en ningún otro sitio: una constante se congela en el idioma de arranque,
   y esta frase hay que TECLEARLA. Congelada, alguien con la app en inglés
   tendría que copiar tres palabras en español que no significan nada para él
   — y si no las copia bien, no puede borrar su cuenta. */
function fraseBorrar() { return tx("BORRAR MI CUENTA"); }

/* Lo que alguien escribe al irse. HOY NO SE MANDA A NINGUNA PARTE, y esta
   escrito aqui para que quede claro y no se de por hecho lo contrario: es el
   sitio unico donde enchufar el envio cuando exista el camino —el mismo que
   va a usar el boton de reportar fallos, que tampoco existe todavia—.

   No se guarda en este aparato a proposito: el motivo se escribe justo antes
   de borrar la cuenta, y lo que se guarde aqui se va con ella en la misma
   linea. Guardarlo seria fingir que se conserva.

   Va envuelto en `try` porque esta a un paso de un borrado: el dia que esto
   mande algo por red, un fallo suyo no puede impedir que alguien se vaya. */
function guardarMotivoDeBaja(texto) {
  try {
    const t = String(texto || "").trim();
    if (!t) return;
    console.log("[motivo de baja, aun sin enviar]", t);
  } catch (e) { /* irse nunca puede fallar por esto */ }
}

function renderZonaCuenta() {
  const el = document.getElementById("zona-cuenta");
  if (!el) return;
  if (!syncReady()) { el.innerHTML = ""; return; }
  el.innerHTML =
    '<h4 class="peligro-t">' + tx("Borrar la cuenta") + '</h4>' +
    '<p class="settings-note">' + tx("Se cierra tu sesión y este dispositivo queda vacío, pero la cuenta no se borra hasta <b>30 días después</b>. Si te arrepientes, entra otra vez con tu correo y la recuperas con todo tu progreso.") + '</p>' +
    '<button class="btn btn-danger-ghost btn-block" onclick="borrarCuenta()">' + tx("Borrar mi cuenta") + '</button>';
}

async function borrarCuenta() {
  if (!syncReady()) return;
  const correo = ((sync.cfg || {}).correo || tx("tu cuenta")).trim();
  /* Se coge ahora, no al final: para cuando toque despedirse, el perfil ya se
     habrá vaciado y no quedará de dónde sacarlo. */
  const saludo = (typeof saludoActual === "function" ? saludoActual() : "") || "";

  /* ---- Lo unico que se interpone: un cobro que sigue vivo ----

     El motivo es de dinero y no de codigo: borrar la cuenta se lleva su fila
     de `suscripciones` por el `on delete cascade`, pero NO cancela nada en
     Stripe. Quien se fuera con la renovacion encendida seguiria pagando una
     cuenta que ya no existe, y esa es la queja mas cara que puede haber.

     LA PREGUNTA CORRECTA ES `renueva`, NO `esPro()`. La primera version
     preguntaba si tenia plan y estaba mal, lo cazo Eduardo mirandolo: quien
     ya pidio la baja conserva el plan hasta su fecha —asi lo quisimos, y por
     eso `vence_el` no se mueve al cancelar— pero no tiene ningun cobro
     pendiente. Bloquearlo era retenerle la cuenta por algo que ya resolvio.
     Al Fundador le pasaba lo mismo y era mas absurdo todavia: paga una sola
     vez, no se renueva nunca, y aun asi no podia irse jamas.

     Asi que solo para aqui quien tenga la renovacion encendida, que es el
     unico caso en el que borrar le costaria dinero de verdad.

     Va lo PRIMERO de todo, antes incluso del "¿seguro?": si de todas formas
     no va a poder, hacerle recorrer dos pantallas y escribir una frase para
     acabar en un no es tomarle el pelo.

     Y es un aviso fijo: el clic fuera no lo cierra. Esta pantalla existe
     justamente para que se lea. */
  const leVanACobrar = typeof PLAN !== "undefined" && PLAN && PLAN.pro && PLAN.renueva;

  if (leVanACobrar) {
    await avisar(
      tx("Si borras la cuenta ahora, el cobro seguirá vivo por su cuenta y te seguiríamos cobrando algo que ya no usas. Borrar la cuenta aquí no cancela el cobro.\n\nCancela primero tu plan y vuelve: tu progreso te espera mientras tanto, y podrás borrar la cuenta aunque al plan le queden meses."),
      "lock", tx("Ir a cancelar mi plan"), tx("Tu plan se sigue cobrando"));
    /* Se le deja donde tiene que estar en vez de decirle el camino y que lo
       busque: es el mismo numero de toques y no hay forma de perderse. */
    mostrarAjuste("plan");
    return;
  }

  /* ---- El fundador pierde algo que no se puede volver a comprar ----

     No es un candado: puede irse, y la puerta se abre con un boton. Es un
     aviso, y va en luciernaga y no en coral porque no esta rompiendo nada
     —esta perdiendo algo—. El coral aqui mentiria sobre lo que pasa.

     Y es el unico caso en toda la app donde "puedes volver a contratarlo" es
     FALSO: los lugares son 200 y no se reponen. Decirselo antes es lo minimo;
     enterarse despues, cuando el cupo ya se agoto, no tiene arreglo ninguno.

     Va con el peso puesto en quedarse: el boton de seguir dice lo que hace y
     el otro dice "Mejor no", que es lo que casi siempre conviene. */
  const esFundador = typeof PLAN !== "undefined" && PLAN && PLAN.pro && PLAN.plan === "fundador";

  if (esFundador) {
    if (!await avisarOro(
      tx("Tu lugar de fundador es de por vida y no se puede recuperar: al borrar la cuenta se va con ella.\n\nLos lugares de fundador son limitados y no se reponen. Si algún día quisieras volver, el plan podría estar agotado y tendrías que entrar por una suscripción normal.\n\nSi solo quieres empezar de cero, «Vaciar la app» te deja la cuenta —y tu lugar— intactos."),
      "crown", tx("Aun así, borrar mi cuenta"), tx("Vas a perder tu lugar de fundador"), tx("Mejor no"))) return;
  }

  /* Y a quien SI puede irse pero todavia le queda plan pagado se le dice,
     porque es dinero suyo que no va a recuperar. Se le dice y se le deja
     seguir: es su decision, no la nuestra. Al fundador no, que ya tuvo su
     propia pantalla y repetirselo seria regañarle dos veces. */
  const pagadoQueSePierde = (!esFundador && typeof PLAN !== "undefined" && PLAN && PLAN.pro && PLAN.vence_el)
    ? "<br><br>" + T`Tu plan actual está pagado hasta el <b>${escapeHtml(fechaCorta(PLAN.vence_el))}</b>. Se perderá el tiempo que sobre después de borrarse tu cuenta de forma definitiva.`
    : "";

  if (!await askBase(
    /* En negrita solo lo que cambia de una persona a otra: su correo, el plazo
       y su fecha. El resto del parrafo es igual para todo el mundo, y
       resaltarlo tambien seria no resaltar nada.

       Va como HTML —de ahi el `true` de abajo— para poder hacerlo, y por eso
       el correo pasa por `escapeHtml`: lo escribio el usuario al registrarse
       y acaba dentro de esta plantilla. */
    T`Se cerrará tu sesión y este dispositivo perderá tu progreso. La cuenta <b>${escapeHtml(correo)}</b> se borrará dentro de <b>30 días naturales</b>; hasta entonces podrás recuperarla entrando nuevamente con tu correo.` + pagadoQueSePierde,
    true, tx("Continuar"), true, false, null,
    { icono: "puerta", titulo: tx("Estás a punto de borrar tu cuenta.") })) return;

  /* Una frase y no un "¿seguro?": el segundo se pulsa con el dedo ya en
     camino, sin leerlo. Escribir tres palabras obliga a parar. */
  const respuesta = await askText(
    T`Escribe ${fraseBorrar()} para confirmar que quieres borrarla.`,
    "", tx("Borrar la cuenta"), fraseBorrar(), 40,
    { titulo: tx("¿Nos cuentas por qué te vas?"), pista: tx("Lo que no funcionó, lo que echaste de menos, o algo que desees compartirnos para mejorar Norata.") });
  if (respuesta === null || respuesta.texto === null) return;
  const escrito = respuesta.texto;
  guardarMotivoDeBaja(respuesta.motivo);
  if (String(escrito).trim().toUpperCase() !== fraseBorrar().toUpperCase()) {
    toast(tx("No coincide. No borré nada."), "calma");
    return;
  }

  /* La misma ultima parada que tiene borrar los datos. Faltaba aqui, que es
     donde mas se necesita: vaciar la app se deshace volviendo a capturar;
     borrar la cuenta arranca un plazo de 30 dias. */
  if (!await ask(tx("Última confirmación: se borrará tu cuenta. ¿Seguro?"), tx("Sí, borrarla"), true, true)) return;

  cargaMostrar(tx("Programando el borrado…"));
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

  /* Y aquí termina en una despedida y no en el formulario de entrar. Ofrecerle
     iniciar sesión a quien acaba de pedir que le borren la cuenta es invitarle
     a deshacer lo que acaba de hacer, y la fecha del plazo —lo único que tiene
     que recordar— iba en un aviso de abajo que dura cuatro segundos.

     `rescateCuando` es lo que la pantalla lee para escribir la fecha, y se
     pone antes de pintar. El saludo también: dos líneas más arriba el perfil
     se acaba de vaciar. */
  rescateCuando = cuando;
  portadaSaludo = saludo;
  mostrarPortada("adios");
  cargaCerrar();
}

/* Una fecha para leer, no para calcular: el día y el mes con letra. La hora
   sobra —el plazo es de un mes— y en una fecha lejana solo añade ruido. */
function fechaLarga(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(localeActual(), {
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

/* Lo mismo, pero para un texto que va DENTRO de unas comillas simples de
   JavaScript que a su vez viven dentro de un atributo HTML — el caso de
   `onclick="abrirRama('AQUÍ')"`, que es como se llama a casi todo en la app.

   `escapeAttr` no sirve ahí, y por eso existe esta: convierte la comilla en
   `&#39;`, pero el navegador deshace esa entidad ANTES de leer el JavaScript,
   así que una rama llamada "Rock'n'roll" le llegaba al motor como
   `abrirRama('Rock'n'roll')` y reventaba con un error de sintaxis. El efecto
   era grande y silencioso: en esa tarjeta dejaban de funcionar TODOS los
   botones a la vez —pantalla completa, renombrar, editar, borrar, crear— sin
   que nada avisara. Se cazó probando un nombre con apóstrofo, no leyendo.

   El orden importa: primero se escapa para JavaScript (la barra invertida
   antes que nada, o se escaparía a sí misma) y solo después para HTML. Los
   saltos de línea se vuelven espacio porque una cadena de JavaScript no puede
   llevarlos partidos. */
function enJS(str) {
  return escapeHtml(
    String(str)
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/[\r\n\u2028\u2029]/g, " ")
  );
}

function formatDate(key) {
  if (!key) return "—";
  return keyToDate(key).toLocaleDateString(localeActual(), { day: "numeric", month: "short", year: "numeric" });
}

function stamp() { return new Date().toISOString(); }

/* Fecha con hora para los movimientos; los registros viejos solo tienen día. */
function formatWhen(e) {
  if (e.at) {
    const d = new Date(e.at);
    const tz = userTZ();
    try {
      return d.toLocaleDateString(localeActual(), { timeZone: tz, day: "numeric", month: "short", year: "numeric" }) +
        " · " + d.toLocaleTimeString(localeActual(), { timeZone: tz, hour: "2-digit", minute: "2-digit" });
    } catch (err) {
      return d.toLocaleDateString(localeActual(), { day: "numeric", month: "short", year: "numeric" });
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

  /* Si hay algo que pulsar, hay que dar tiempo real a verlo y decidir. Y hay
     avisos que piden más: el de «hay una versión nueva» puede llegar mientras
     estabas en otra ventana, así que pide `ms` y se queda doce segundos. */
  setTimeout(() => cerrarToast(id), accion ? Math.max(t.ms, accion.ms || 6000) : t.ms);
}

function cerrarToast(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove("show");
  setTimeout(() => el.remove(), 240);
}

