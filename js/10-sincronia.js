/* Sincronía, copias de conflicto, utilidades y avisos */
/* ================= Sincronía entre dispositivos =================
   Tu progreso vive en un archivo JSON dentro de un repositorio PRIVADO tuyo
   de GitHub. Cada guardado local marca "hay algo que subir" y una espera
   corta agrupa los cambios: así una tarde de uso son unos pocos commits y
   no uno por cada toque.

   El token se guarda en una llave aparte de localStorage y NUNCA dentro de
   `state`. Es a propósito: `state` es exactamente lo que se sube al
   repositorio, así que meter ahí el token sería publicarlo.

   Sobre pisar datos: GitHub identifica cada versión de un archivo con un
   `sha`. Guardamos el que conocemos y lo mandamos al escribir; si el remoto
   cambió desde otro aparato, GitHub rechaza la escritura. Entonces
   preguntamos en vez de decidir por ti, y el lado que no elijas se guarda
   como copia local antes de tocar nada. */

const SYNC_KEY = "mainquest-sync-v1";
const SYNC_DELAY = 4000;
const GH_API = "https://api.github.com";

let sync = loadSync();
let syncTimer = null;
let syncBusy = false;
let syncError = null;

function loadSync() {
  const base = {
    enabled: false, owner: "", repo: "", path: "estado.json", branch: "main",
    token: "", device: "", sha: null, rev: 0, dirty: false, lastAt: null
  };
  try {
    const raw = localStorage.getItem(SYNC_KEY);
    if (raw) Object.assign(base, JSON.parse(raw));
  } catch (e) { /* configuración corrupta: volver a los valores por defecto */ }
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
  return !!(sync && sync.enabled && sync.token && sync.owner && sync.repo);
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

/* btoa/atob trabajan en bytes, no en texto: sin pasar por TextEncoder, un
   acento o un emoji rompen la codificación. El troceado evita reventar la
   pila de argumentos cuando el estado crece. */
function toB64(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

function fromB64(b64) {
  const bin = atob(String(b64).replace(/\s/g, ""));
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function ghUrl(suffix) {
  return GH_API + "/repos/" + encodeURIComponent(sync.owner) + "/" +
    encodeURIComponent(sync.repo) + suffix;
}

function ghFilePath() {
  return "/contents/" + String(sync.path).split("/").filter(Boolean).map(encodeURIComponent).join("/");
}

async function gh(url, opts) {
  const o = Object.assign({ cache: "no-store" }, opts || {});
  o.headers = Object.assign({
    "Authorization": "Bearer " + sync.token,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
  }, o.headers || {});
  const res = await fetch(url, o);
  let body = null;
  try { body = await res.json(); } catch (e) {}
  return { ok: res.ok, status: res.status, body };
}

/* Los errores de la API se traducen a algo accionable: "401" no le dice a
   nadie qué hacer, "el token expiró" sí. */
function ghError(r) {
  if (r.status === 401) return new Error("El token no es válido o ya expiró. Genera uno nuevo y vuelve a conectar.");
  if (r.status === 403) return new Error("El token no tiene permiso de escritura sobre " + sync.owner + "/" + sync.repo + ".");
  if (r.status === 404) return new Error("No encontré " + sync.owner + "/" + sync.repo + ". Revisa el nombre y que el token incluya ese repositorio.");
  if (r.status === 409 || r.status === 422) return new Error("El repositorio cambió mientras guardaba. Intenta otra vez.");
  const msg = r.body && r.body.message ? r.body.message : "error " + r.status;
  return new Error("GitHub respondió: " + msg);
}

async function syncFetchRemote() {
  const r = await gh(ghUrl(ghFilePath()) + "?ref=" + encodeURIComponent(sync.branch));
  if (r.status === 404) return { missing: true };
  if (!r.ok) throw ghError(r);

  let text = r.body.content ? fromB64(r.body.content) : "";
  // Arriba de 1 MB la API de contenidos manda el cuerpo vacío y hay que ir al blob
  if (!text && r.body.sha) {
    const b = await gh(ghUrl("/git/blobs/" + r.body.sha));
    if (b.ok && b.body && b.body.content) text = fromB64(b.body.content);
  }
  let env = null;
  try { env = JSON.parse(text); } catch (e) {
    throw new Error("El archivo del repositorio no es un JSON válido; no voy a tocarlo.");
  }
  return { sha: r.body.sha, env: env };
}

async function syncWriteRemote(env, sha, message) {
  const body = {
    message: message,
    content: toB64(JSON.stringify(env, null, 2)),
    branch: sync.branch
  };
  if (sha) body.sha = sha;
  return await gh(ghUrl(ghFilePath()), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
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

/* Las cuatro cifras por separado, para poder ponerlas en columnas y que se
   vea de un vistazo en qué se diferencian las dos versiones. */
function syncCifras(s) {
  s = s || {};
  return [
    { t: "Habilidades", n: (s.skills || []).length },
    { t: "Misiones", n: (s.missions || []).length },
    { t: "Talentos", n: (s.perks || []).length },
    { t: "Proyectos", n: (s.projects || []).length }
  ];
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
  const copias = listarCopias().filter(c => c.datos);

  if (!copias.length) {
    cont.innerHTML = `<p class="settings-note" style="margin:0">No hay ninguna. Aquí aparecerán solas si alguna vez dos aparatos cambian lo mismo y eliges con cuál quedarte.</p>`;
    return;
  }

  cont.innerHTML = copias.map(c => {
    const cuando = c.ms ? syncFecha(new Date(c.ms).toISOString()) : null;
    const de = c.lado === "remoto" ? "la versión del otro aparato" : "la versión de este aparato";
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
    `Lo de ahora no se pierde: se guarda como otra copia antes de cambiar nada.`,
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

/* La pregunta más delicada de la app: elegir mal aquí borra progreso real.
   Por eso se presenta como una comparación y no como un párrafo: las dos
   versiones con su fecha y hora completas, sus cifras enfrentadas para ver
   en qué se diferencian, y una etiqueta que señala cuál se guardó después.
   La etiqueta dice "más reciente", no "la correcta": la más nueva suele ser
   la buena, pero el que sabe si estuvo capturando en el otro aparato es el
   usuario, no la app. */
async function askConflict(env) {
  const quien = env.device || "el otro dispositivo";
  const remotoISO = env.updatedAt || null;
  const localISO = sync.dirtyAt || null;
  const fRemoto = syncFecha(remotoISO) || "sin fecha";
  const fLocal = syncFecha(localISO) || "sin fecha";

  let masNuevo = null;
  if (remotoISO && localISO) masNuevo = Date.parse(localISO) > Date.parse(remotoISO) ? "local" : "remoto";

  const cifrasL = syncCifras(state);
  const cifrasR = syncCifras(env.state);

  const lado = (titulo, sub, fecha, cifras, otras, esNuevo) => `
    <div class="cf-side${esNuevo ? " nuevo" : ""}">
      <div class="cf-head">
        <span class="cf-tag">${escapeHtml(titulo)}</span>
        ${esNuevo ? '<span class="cf-badge">Más reciente</span>' : ""}
      </div>
      <div class="cf-dev">${escapeHtml(sub)}</div>
      <div class="cf-when">${escapeHtml(fecha)}</div>
      <div class="cf-nums">
        ${cifras.map((c, i) => {
          const dif = otras[i].n !== c.n;
          return `<div class="${dif ? "dif" : ""}"><b>${c.n}</b><span>${escapeHtml(c.t)}</span></div>`;
        }).join("")}
      </div>
    </div>`;

  const html = `
    <div class="cf-intro">Los dos aparatos cambiaron desde la última sincronía. Elige cuál se queda.</div>
    <div class="cf-grid">
      ${lado("Aquí", sync.device || "Este dispositivo", fLocal, cifrasL, cifrasR, masNuevo === "local")}
      ${lado("Allá", quien, fRemoto, cifrasR, cifrasL, masNuevo === "remoto")}
    </div>
    <div class="cf-foot">Del lado que no elijas se guarda una copia en este navegador, así que no se pierde nada.</div>`;

  return await askHtml(html, "Traer lo de " + quien, "Conservar lo de aquí");
}

async function syncOnce(opts) {
  const remote = await syncFetchRemote();

  // Repositorio todavía vacío: lo sembramos con lo que hay aquí
  if (remote.missing) {
    const env = envelope((sync.rev || 0) + 1);
    const w = await syncWriteRemote(env, null, "Primer guardado desde " + sync.device);
    if (!w.ok) throw ghError(w);
    sync.sha = w.body.content.sha; sync.rev = env.rev;
    sync.dirty = false; sync.lastAt = env.updatedAt; saveSync();
    if (!opts.silent) toast("Listo: tu progreso ya está en GitHub", "logro");
    return;
  }

  const env = remote.env;

  /* El caso que justifica todo el versionado: el otro aparato ya se
     actualizó y este no. Se corta ANTES de leer nada y antes de escribir
     nada — si siguiéramos, o adoptaríamos datos que no entendemos, o los
     pisaríamos con los nuestros, que es peor. */
  const schemaRemoto = Number(env && (env.schema || (env.state && env.state.schemaVersion))) || 1;
  if (schemaRemoto > SCHEMA) {
    throw new Error("El otro aparato usa una versión más nueva de Notara. Actualiza esta (recarga la página) antes de sincronizar; mientras tanto no toco nada.");
  }

  const remoteRev = env && typeof env.rev === "number" ? env.rev : 0;
  const remoteNewer = remoteRev > sync.rev || remote.sha !== sync.sha;

  if (sync.dirty && remoteNewer && env && env.state) {
    const traer = await askConflict(env);
    if (traer) {
      stashConflict("local", state);
      adoptRemote(env);
      sync.sha = remote.sha; sync.rev = remoteRev;
      sync.dirty = false; sync.lastAt = env.updatedAt; saveSync();
      renderSync();
      toast("Traído desde " + (env.device || "el otro dispositivo"));
      return;
    }
    // Te quedas con lo de aquí: guardamos lo remoto y adoptamos su sha
    // para poder escribir encima en el mismo intento.
    stashConflict("remoto", env.state);
    sync.sha = remote.sha; sync.rev = remoteRev;
  } else if (remoteNewer && env && env.state) {
    adoptRemote(env);
    sync.sha = remote.sha; sync.rev = remoteRev;
    sync.dirty = false; sync.lastAt = env.updatedAt; saveSync();
    renderSync();
    if (!opts.silent) toast("Al día con " + (env.device || "el otro dispositivo"));
    return;
  } else {
    sync.sha = remote.sha;
  }

  if (!sync.dirty) {
    sync.lastAt = new Date().toISOString(); saveSync();
    if (!opts.silent) toast("Todo al día", "calma");
    return;
  }

  const out = envelope(Math.max(sync.rev || 0, remoteRev) + 1);
  const w = await syncWriteRemote(out, sync.sha, "Progreso desde " + sync.device);
  if (w.status === 409 || w.status === 422) { const e = new Error("carrera"); e.retry = true; throw e; }
  if (!w.ok) throw ghError(w);
  sync.sha = w.body.content.sha; sync.rev = out.rev;
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
    // Un reintento cubre el caso de que otro aparato escriba justo entre
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

  let dot = "", titulo = "", detalle = "";
  if (!syncReady()) {
    dot = ""; titulo = "Solo en este dispositivo";
    detalle = "Tu progreso no sale de este navegador.";
  } else if (syncBusy) {
    dot = "busy"; titulo = "Sincronizando…"; detalle = sync.owner + "/" + sync.repo;
  } else if (syncError) {
    dot = "bad"; titulo = "No pude sincronizar"; detalle = syncError;
  } else {
    dot = "ok";
    titulo = sync.dirty ? "Cambios sin subir" : "Al día con GitHub";
    let cuando = "";
    if (sync.lastAt) {
      try {
        cuando = " · última vez " + new Date(sync.lastAt).toLocaleString("es-MX", {
          timeZone: userTZ(), day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
        });
      } catch (e) {}
    }
    detalle = sync.owner + "/" + sync.repo + cuando;
  }
  statusEl.innerHTML =
    '<span class="sync-dot ' + dot + '"></span>' +
    '<span class="sync-text"><b>' + escapeHtml(titulo) + '</b><span>' + escapeHtml(detalle) + '</span></span>';

  if (syncReady()) {
    panelEl.innerHTML =
      '<label class="field"><span>Nombre de este dispositivo</span>' +
      '<input type="text" id="sync-device" value="' + escapeAttr(sync.device) + '" onchange="syncRenameDevice(this.value)">' +
      '<div class="field-hint">Aparece cuando dos aparatos cambian lo mismo y hay que elegir.</div></label>' +
      '<div class="stack">' +
      '<button class="btn btn-soft btn-block" onclick="syncRun({})">Sincronizar ahora</button>' +
      '<button class="btn btn-danger-ghost btn-block" onclick="syncDisconnect()">Desconectar este dispositivo</button>' +
      '</div>';
    return;
  }

  panelEl.innerHTML =
    '<label class="field"><span>Tu usuario de GitHub</span>' +
    '<input type="text" id="sync-owner" autocomplete="off" spellcheck="false" value="' + escapeAttr(sync.owner) + '" placeholder="mi-usuario"></label>' +
    '<label class="field"><span>Repositorio privado de datos</span>' +
    '<input type="text" id="sync-repo" autocomplete="off" spellcheck="false" value="' + escapeAttr(sync.repo) + '" placeholder="notara-datos"></label>' +
    '<label class="field"><span>Token de acceso</span>' +
    '<input type="password" id="sync-token" autocomplete="off" spellcheck="false" placeholder="github_pat_…">' +
    '<div class="field-hint">Token de acceso personal con permiso de contenidos sobre ese repositorio y nada más. Se guarda solo en este navegador.</div></label>' +
    '<label class="field"><span>Nombre de este dispositivo</span>' +
    '<input type="text" id="sync-device" value="' + escapeAttr(sync.device) + '"></label>' +
    '<div class="stack"><button class="btn btn-primary btn-block" onclick="syncConnect()">Conectar</button></div>';
}

function syncRenameDevice(v) {
  sync.device = String(v || "").trim() || guessDeviceName();
  saveSync();
  renderSync();
}

async function syncConnect() {
  const owner = document.getElementById("sync-owner").value.trim();
  const repo = document.getElementById("sync-repo").value.trim();
  const token = document.getElementById("sync-token").value.trim();
  const device = document.getElementById("sync-device").value.trim();
  if (!owner || !repo || !token) { toast("Falta usuario, repositorio o token", "atencion"); return; }

  sync.owner = owner; sync.repo = repo; sync.token = token;
  sync.device = device || guessDeviceName();
  sync.enabled = true; sync.sha = null; sync.rev = 0;
  // Si este aparato ya tiene progreso, cuenta como cambios por subir; si está
  // vacío, no: así un dispositivo nuevo simplemente recibe lo que ya existe.
  sync.dirty = hasLocalData();
  sync.lastAt = null;
  saveSync();
  renderSync();
  await syncRun({});
}

async function syncDisconnect() {
  if (!await ask("Se borrará el token de este dispositivo y tu progreso dejará de subirse. Lo que ya está en GitHub se queda ahí, y los datos de este aparato tampoco se tocan.", "Desconectar")) return;
  sync.enabled = false; sync.token = ""; sync.sha = null; sync.dirty = false;
  saveSync();
  syncError = null;
  renderSync();
  toast("Dispositivo desconectado", "deshecho");
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
   ven distintos en cada aparato. */
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

