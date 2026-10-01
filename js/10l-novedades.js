/* ============================================================
   Las novedades (0.7.149)
   ============================================================

   Lo que cambió en Norata, contado para quien la USA. No es `VERSIONES.md`:
   ése es el libro de recetas —cada decisión y el fallo que la motivó—, está
   escrito para quien toca el código y no se publica (`_config.yml`). Esto es
   lo contrario: qué ganas tú, en dos o tres renglones, y sale en la app y, el
   día que exista, en la página de changelog del sitio.

   **De dónde sale:** `novedades/novedades.json`, una entrada por cada 3º tramo
   (`0.7.149`), con sus 4º dentro como «retoques». Lo lee esta app y lo podrá
   leer la web tal cual, que es por lo que es JSON y no un trozo de este
   archivo. Las reglas para escribirlas están en `novedades/LEEME.md`.

   **Nada sale sin que Eduardo lo apruebe** (0.7.149, es suya): cada entrada
   nace con `"estado": "borrador"` y la app solo enseña las `"publicado"`. Los
   borradores se revisan en la app misma con `?novedades=borrador` —la receta
   de «una prueba con enlace» de CLAUDE.md—, y `?novedades=` lo apaga.

   **Cuándo sale la ventana:** al abrir, con la app ya asentada, si hay alguna
   entrada publicada que este dispositivo no ha visto. Se apunta POR ENTRADA y
   no por número de versión, y no es un detalle: una entrada puede aprobarse
   días después de que su versión llegó, y comparando números esa aprobación
   no la vería nadie que ya estuviera en esa versión.

   La primera vez que un dispositivo abre esto no enseña nada: da por vistas
   las que ya había. A quien llega nuevo no le interesa la historia, y a quien
   ya usaba la app el día que esto entró tampoco le toca un resumen de meses.

   Si hubo versión nueva pero ninguna entrada que enseñar —un 4º, o un 3º
   aún en borrador—, sale un aviso chico con el número. Así «de repente estoy
   en otra versión» no vuelve a pasar en silencio, en la web ni en el APK. */

const NOVEDADES_URL = "novedades/novedades.json";
const NOVEDADES_VISTAS = "norata-novedades-vistas";
const NOVEDADES_BORRADOR = "norata-novedades-borrador";
/* La misma llave que usaba `js/13-nativo.js` para su aviso de estreno (0.7.148.9),
   que ahora vive aquí y vale para las dos: así nadie ve el aviso dos veces. */
const VERSION_VISTA = "norata-version-vista";

/* ---- La prueba con enlace ----
   Se lee al cargar y se guarda en `sessionStorage`: dura lo que la pestaña y
   no se queda pegado como si fuera un ajuste. */
(function leerParametroNovedades() {
  let v = null;
  try { v = new URLSearchParams(location.search).get("novedades"); } catch (e) {}
  if (v === null) return;
  try {
    if (v === "borrador") sessionStorage.setItem(NOVEDADES_BORRADOR, "1");
    else sessionStorage.removeItem(NOVEDADES_BORRADOR);
  } catch (e) {}
})();

function novedadesEnBorrador() {
  try { return sessionStorage.getItem(NOVEDADES_BORRADOR) === "1"; } catch (e) { return false; }
}

/* 0.7.149.1 contra 0.7.149: por tramos y como números — como texto, «0.7.99»
   saldría más nuevo que «0.7.149». */
function versionMasNueva(a, b) {
  const x = String(a).split(".").map(Number), y = String(b).split(".").map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] || 0) - (y[i] || 0);
    if (d) return d > 0;
  }
  return false;
}

let novedadesPedidas = null;
function cargarNovedades() {
  /* Una sola vez por carga. Viene de la copia de la app (está en `ASSETS`, y en
     el APK viaja en el paquete), así que abre sin red. */
  if (!novedadesPedidas) {
    novedadesPedidas = fetch(NOVEDADES_URL)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => (d && Array.isArray(d.entradas) ? d.entradas : []))
      .catch(() => []);
  }
  return novedadesPedidas;
}

/* Las que puede ver quien usa la app: publicadas, y no de una versión que
   este dispositivo todavía no tiene. Con la prueba encendida, también los
   borradores. De la más nueva a la más vieja. */
function novedadesVisibles(entradas, conBorradores) {
  return entradas
    .filter((e) => e && e.version && (e.estado === "publicado" || (conBorradores && e.estado === "borrador")))
    .filter((e) => conBorradores || !versionMasNueva(e.version, VERSION))
    .sort((a, b) => (versionMasNueva(a.version, b.version) ? -1 : 1));
}

/* En inglés, si la entrada trae su versión en inglés; si no, la española. Una
   entrada sin traducir se lee igual, que es mejor que no leerse. */
function novedadCampo(e, campo) {
  const en = typeof idiomaActual === "function" && idiomaActual() === "en";
  if (en && e.en && e.en[campo]) return e.en[campo];
  return e[campo];
}

function novedadFecha(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T12:00:00");
  if (isNaN(d)) return "";
  const lengua = typeof idiomaActual === "function" && idiomaActual() === "en" ? "en-US" : "es-MX";
  return d.toLocaleDateString(lengua, { day: "numeric", month: "short", year: "numeric" });
}

/* ---- La clase de una novedad (0.7.151) ----
   Eduardo: «para distinguir qué novedad es más grande que otras». No sale del
   número —un 3º puede ser un mundo entero o tres arreglos—, sale de qué le
   cambia a quien usa la app, y decide cuánto ruido hace:

   | clase       | qué es                                          | en la app                     |
   | expansion   | algo que no existía: un mundo, un módulo        | ventana, con imagen y gráfico |
   | mejora      | algo que ya tenías, ahora mejor                 | ventana                       |
   | arreglo     | algo que fallaba y ya no                        | sin ventana: el aviso chico   |

   Un arreglo no interrumpe: avisar con una ventana de que algo ya no falla es
   pedirle a alguien que se detenga por un problema que quizá ni vio. Sale en
   Ajustes → Novedades como todas. Sin `clase`, una entrada es una mejora. */
const NOVEDAD_CLASES = {
  /* El cuarto, que no es un tamaño sino un momento (0.7.152): la entrada en
     la beta (`0.8`) y el lanzamiento (`1.0`). En vez de la ventana abre la
     escena de `abrirHito`, y lleva además `"hito": "beta"` o `"1.0"`. */
  hito:      { nombre: "Hito",      ventana: true },
  expansion: { nombre: "Expansión", ventana: true },
  mejora:    { nombre: "Mejora",    ventana: true },
  arreglo:   { nombre: "Arreglo",   ventana: false }
};
function novedadClase(e) {
  return NOVEDAD_CLASES[e && e.clase] ? e.clase : "mejora";
}

/* ---- El gráfico de una novedad ----
   Datos y no una imagen, para que salga con los colores de quien lo mira (su
   mundo, su modo) y en el idioma de la app. Dos formas, las dos sin librería:
   `cifras` (dos a cuatro números grandes con su rótulo) y `barras` (de lado,
   proporcionales al mayor). La web lo recibe dibujado como SVG desde
   `herramientas/novedades-framer.py`, porque Framer no ejecuta esto. */
function novedadGraficoHTML(g) {
  if (!g || !Array.isArray(g.datos) || !g.datos.length) return "";
  const titulo = novedadCampo(g, "titulo");
  const cab = titulo ? `<span class="nov-graf-tit">${escapeHtml(titulo)}</span>` : "";
  if (g.tipo === "barras") {
    const max = Math.max.apply(null, g.datos.map((d) => Number(d.valor) || 0)) || 1;
    return `<div class="nov-graf nov-barras">${cab}${g.datos.map((d) => `
      <div class="nov-barra">
        <span class="nov-barra-et">${escapeHtml(novedadCampo(d, "texto") || "")}</span>
        <span class="nov-barra-carril"><i style="width:${Math.round((Number(d.valor) || 0) / max * 100)}%"></i></span>
        <b>${escapeHtml(String(d.valor))}</b>
      </div>`).join("")}</div>`;
  }
  return `<div class="nov-graf nov-cifras">${cab}<div class="nov-cifras-fila">${g.datos.slice(0, 4).map((d) => `
    <span class="nov-cifra"><b>${escapeHtml(String(d.valor))}</b><span>${escapeHtml(novedadCampo(d, "texto") || "")}</span></span>`).join("")}</div></div>`;
}

/* `medios`: la imagen y el gráfico. Van en la ventana de una expansión y en
   Ajustes; no en la ventana de una mejora, que se lee de pie y en corto. La
   imagen, si no llega (sin red, o el APK sin ella), se quita sola y no deja un
   hueco roto. */
function novedadHTML(e, medios) {
  const puntos = novedadCampo(e, "puntos") || [];
  const retoques = Array.isArray(e.retoques) ? e.retoques : [];
  const clase = novedadClase(e);
  const img = medios && e.imagen && e.imagen.src ? `
      <figure class="nov-img"><img src="${escapeAttr(e.imagen.src)}" alt="${escapeAttr(novedadCampo(e.imagen, "alt") || "")}" loading="lazy" onerror="this.parentNode.remove()"></figure>` : "";
  return `
    <article class="nov-ent nov-${clase}">
      ${img}
      <div class="nov-cab">
        <span class="nov-clase c-${clase}">${escapeHtml(tx(NOVEDAD_CLASES[clase].nombre))}</span>
        <span class="nov-ver">V${escapeHtml(e.version)}</span>
        <span class="nov-fecha">${escapeHtml(novedadFecha(e.fecha))}</span>
        ${e.estado === "borrador" ? `<span class="nov-borrador">${escapeHtml(tx("Borrador"))}</span>` : ""}
      </div>
      <h4 class="nov-tit">${escapeHtml(novedadCampo(e, "titulo") || "")}</h4>
      ${novedadCampo(e, "resumen") ? `<p class="nov-res">${escapeHtml(novedadCampo(e, "resumen"))}</p>` : ""}
      ${puntos.length ? `<ul class="nov-puntos">${puntos.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}</ul>` : ""}
      ${medios ? novedadGraficoHTML(e.grafico) : ""}
      ${retoques.length ? `
        <details class="nov-ret">
          <summary>${escapeHtml(retoques.length === 1 ? tx("Y un retoque") : T`Y ${retoques.length} retoques`)}</summary>
          <ul>${retoques.map((r) => `<li><b>V${escapeHtml(r.version || "")}</b> ${escapeHtml(novedadCampo(r, "texto") || "")}</li>`).join("")}</ul>
        </details>` : ""}
    </article>`;
}

/* ---- La ventana ----
   La más nueva entera, y si hay más sin ver, cuántas: no se apilan tres
   resúmenes en una ventana que se lee de pie en el metro. El resto está a un
   toque, en Ajustes → Novedades. */
function ventanaNovedades(lista) {
  const e = lista[0];
  const mas = lista.length - 1;
  const cuerpo = `
    <div class="nov-ventana">
      ${novedadHTML(e, novedadClase(e) === "expansion")}
      ${mas > 0 ? `<p class="nov-mas">${escapeHtml(mas === 1 ? tx("Hay una novedad más que no habías visto.") : T`Hay ${mas} novedades más que no habías visto.`)}</p>` : ""}
      <button type="button" class="btn btn-linea btn-block nov-todas" onclick="modalDone(true); abrirNovedades()">${escapeHtml(tx("Ver todas las novedades"))}</button>
    </div>`;
  return askBase(cuerpo, true, tx("Entendido"), false, false, null,
    { soloOk: true, icono: "star", tono: "menta", clase: "novedades", titulo: tx("Novedades de Norata") });
}

/* Con la app asentada: la carga cerrada, ninguna ventana encima, fuera de la
   bienvenida y de la elección de idioma. Encima de la carga no se vería, y
   encima de otra ventana la pisaría. Con tope, para no preguntar para siempre. */
function cuandoNadaTape(hacer) {
  const tope = Date.now() + 3 * 60 * 1000;
  (function mirar() {
    const tapa = (typeof cargaVisible === "function" && cargaVisible()) ||
      document.querySelector("#modal.show, #tuto.show, #ncel.show, #region, #view-onboarding.active");
    if (!tapa) hacer();
    else if (Date.now() < tope) setTimeout(mirar, 700);
  })();
}

function leerVistas() {
  try {
    const v = JSON.parse(localStorage.getItem(NOVEDADES_VISTAS));
    return Array.isArray(v) ? v : null;
  } catch (e) { return null; }
}
function guardarVistas(v) {
  try { localStorage.setItem(NOVEDADES_VISTAS, JSON.stringify(v.slice(-60))); } catch (e) {}
}

async function revisarNovedades() {
  /* El ejemplo es de mentira y vive en memoria: ahí no se anuncia nada. */
  if (typeof modoEjemplo !== "undefined" && modoEjemplo) return;
  const entradas = await cargarNovedades();
  const publicadas = novedadesVisibles(entradas, false);

  let vista = null;
  try { vista = localStorage.getItem(VERSION_VISTA); } catch (e) {}
  try { localStorage.setItem(VERSION_VISTA, VERSION); } catch (e) {}

  let vistas = leerVistas();
  if (vistas === null) {
    vistas = publicadas.map((e) => e.version);
    guardarVistas(vistas);
  }
  const pendientes = publicadas.filter((e) => vistas.indexOf(e.version) < 0);
  /* Los arreglos no abren ventana (ver `NOVEDAD_CLASES`): se dan por vistos y,
     si solo hay arreglos, se avisa con el aviso chico de abajo. */
  const conVentana = pendientes.filter((e) => NOVEDAD_CLASES[novedadClase(e)].ventana);
  if (pendientes.length && !conVentana.length) {
    guardarVistas(vistas.concat(pendientes.map((e) => e.version)));
  }

  /* Un hito pendiente manda sobre todo lo demás: es su escena y no la ventana.
     Lo que hubiera detrás queda para Ajustes → Novedades. */
  const yaCelebrados = (typeof state !== "undefined" && state && state.settings && state.settings.hitosVistos) || [];
  const hito = conVentana.find((e) => novedadClase(e) === "hito" && yaCelebrados.indexOf(hitoDeEntrada(e)) < 0);
  if (hito) {
    cuandoNadaTape(() => {
      /* El número que rueda es el que esta persona tenía ANTES de actualizar:
         «0.7.163 → Beta» cuenta su salto, no el de otro. */
      abrirHito(hito, { desde: vista || "" }).then(() => {
        guardarVistas((leerVistas() || []).concat(pendientes.map((e) => e.version)));
      });
    });
    return;
  }

  if (conVentana.length) {
    cuandoNadaTape(() => {
      ventanaNovedades(conVentana).then(() => {
        /* Se apuntan al CERRARLA, no al pedirla: si la app se cierra antes de
           que salga, la próxima vez vuelve a salir. */
        guardarVistas((leerVistas() || []).concat(pendientes.map((e) => e.version)));
      });
    });
    return;
  }
  if (vista && versionMasNueva(VERSION, vista)) {
    cuandoNadaTape(() => {
      if (typeof toast === "function") toast(T`Norata se actualizó a la versión ${VERSION}`, "hecho",
        { label: tx("Novedades"), onclick: "abrirNovedades()", ms: 7000 });
    });
  }
}

/* ---- Ajustes → Novedades ---- */
function abrirNovedades() {
  if (typeof abrirAjustes === "function") abrirAjustes("novedades");
}

async function renderPanelNovedades() {
  const caja = document.getElementById("panel-novedades");
  if (!caja) return;
  const borrador = novedadesEnBorrador();
  const lista = novedadesVisibles(await cargarNovedades(), borrador);
  const aviso = borrador ? `
    <div class="nov-prueba">
      <b>${escapeHtml(tx("Estás viendo los borradores"))}</b>
      <span>${escapeHtml(tx("Solo en esta pestaña. Lo que dice «Borrador» no lo ve nadie hasta que se apruebe."))}</span>
      ${lista.length ? `<button type="button" class="btn btn-soft btn-block" onclick="novedadesProbarVentana()">${escapeHtml(tx("Ver la ventana de la más reciente"))}</button>` : ""}
      <div class="nov-prueba-hitos">
        <button type="button" class="btn btn-linea" onclick="probarHito('beta')">${escapeHtml(tx("Probar el anuncio de la beta"))}</button>
        <button type="button" class="btn btn-linea" onclick="probarHito('1.0')">${escapeHtml(tx("Probar el anuncio de la 1.0"))}</button>
      </div>
    </div>` : "";
  caja.innerHTML = `
    <h3>${escapeHtml(tx("Novedades"))}</h3>
    <p class="settings-note">${escapeHtml(tx("Lo que ha ido cambiando en Norata, de lo más nuevo a lo más viejo."))}</p>
    ${aviso}
    ${lista.length
      ? `<div class="nov-lista">${lista.map((e) => novedadHTML(e, true)).join("")}</div>`
      : `<p class="nov-vacio">${escapeHtml(tx("Todavía no hay novedades publicadas."))}</p>`}`;
}

/* Para revisar un borrador tal como se verá: no apunta nada como visto. */
async function novedadesProbarVentana() {
  /* La más reciente que de verdad abriría ventana: un arreglo no la abre. */
  const lista = novedadesVisibles(await cargarNovedades(), true)
    .filter((e) => NOVEDAD_CLASES[novedadClase(e)].ventana && novedadClase(e) !== "hito");
  if (lista.length) ventanaNovedades(lista.slice(0, 1));
}

/* ---- «Ya está lista la versión X», que se queda (0.7.149) ----
   Era un toast de doce segundos, y Eduardo lo dijo tal cual: no se entera de
   cuándo llega una versión. Un toast lo elige el momento en que llega, no el
   momento en que miras. Ahora es una tarjeta arriba que se queda hasta que la
   usas o la cierras. La usan la web en el teléfono (`avisarDeLaVersion`,
   js/11-arranque.js) y el APK (`avisarLista`, js/13-nativo.js); en la
   computadora sigue el botón de la barra lateral, que ya se quedaba. */
/* Cerrarla es «ahora no», no «nunca»: vuelve al volver a la app, pero no antes
   de cinco minutos, o perseguiría. */
let avisoCerrado = { version: null, en: 0 };
function avisoVersionLista(version, accion) {
  if (avisoCerrado.version === version && Date.now() - avisoCerrado.en < 5 * 60 * 1000) return;
  let caja = document.getElementById("aviso-version");
  if (!caja) {
    caja = document.createElement("div");
    caja.id = "aviso-version";
    caja.className = "aviso-version";
    caja.setAttribute("role", "status");
    document.body.appendChild(caja);
  }
  caja.innerHTML = `
    <span class="avv-ic">${icon("star", 20)}</span>
    <span class="avv-tx">
      <b>${escapeHtml(version ? T`Ya está lista la versión ${version}` : tx("Hay una versión nueva de Norata"))}</b>
      <span>${escapeHtml(tx("Actualiza y te cuento qué trae."))}</span>
    </span>
    <button type="button" class="btn btn-primary avv-si" onclick="cerrarAvisoVersion(); ${accion}">${escapeHtml(tx("Actualizar"))}</button>
    <button type="button" class="avv-no" onclick="cerrarAvisoVersion()" aria-label="${escapeAttr(tx("Cerrar"))}">${icon("close", 16)}</button>`;
  caja.dataset.version = version || "";
  caja.classList.add("show");
}
function cerrarAvisoVersion() {
  const caja = document.getElementById("aviso-version");
  if (!caja || !caja.classList.contains("show")) return;
  caja.classList.remove("show");
  avisoCerrado = { version: caja.dataset.version || null, en: Date.now() };
}

window.addEventListener("load", () => setTimeout(revisarNovedades, 600));

/* ================= Los hitos: la beta y la 1.0 (0.7.152) =================
   Eduardo: «un anuncio muy especial en diseño para cuando subamos de alpha a
   beta y el lanzamiento 1.0, con animaciones, y más cosas». Son dos veces en
   la vida de la app, así que no es una ventana con más adornos: es una escena,
   como el aniversario, y como él se queda de noche en los dos modos (no es
   interfaz, es un dibujo) y usa la menta de la MARCA y no el acento del mundo
   —es la marca la que cumple, no el mundo que lleves puesto—.

   Lo que pasa, en orden (los tiempos viven en el CSS, `#hito`):
     1. Se hace de noche y aparecen las estrellas.
     2. Las luciérnagas —el bicho de Norata— vuelan desde los bordes al centro.
     3. Donde se juntan se dibuja el isotipo, y suenan dos ondas y el `hito`.
     4. El número rueda: de la versión que tenías a «Beta» o a «1.0».
     5. El título y el texto de la novedad.
     6. Tu parte: días en Norata, misiones cumplidas, nivel, y una insignia
        que dice cuándo llegaste («Expedición alpha» o «Expedición beta»).
   Con «menos movimiento» todo sale ya en su sitio y sin vuelo.

   Se apunta como visto POR PERSONA, en `settings.hitosVistos` (viaja con la
   cuenta): un hito no se celebra dos veces porque tengas dos dispositivos. */
const HITO_ETIQUETA = { beta: "Beta", "1.0": "1.0" };

function hitoDeEntrada(e) {
  return e && (e.hito === "beta" || e.hito === "1.0") ? e.hito : (versionMasNueva(e && e.version || "0", "0.9.999") ? "1.0" : "beta");
}

/* Tu parte, de lo que la app ya guarda. Sin cuenta ni datos sale lo que haya:
   una tarjeta con ceros no se pinta. */
function hitoTuParte(hito, e) {
  const s = (typeof state !== "undefined" && state && state.settings) || {};
  const hoy = typeof todayKey === "function" ? todayKey() : "";
  const ini = s.inicio || null;
  const dias = ini && typeof daysBetween === "function" ? daysBetween(ini, hoy) + 1 : 0;
  let misiones = 0;
  if (typeof missionDone === "function") (state.missions || []).forEach((m) => {
    Object.keys(m.log || {}).forEach((k) => { if (missionDone(m, k)) misiones++; });
  });
  const nivel = typeof nivelExpedicion === "function" ? nivelExpedicion().nivel : 0;
  /* La insignia: dónde estabas cuando cambió la etapa. Para la beta, todo el
     que la ve llegó en la alpha. Para la 1.0 se mira la fecha de la beta en
     las novedades; sin ella, se dice la alpha solo si llevas más de un año. */
  let etapa = "alpha";
  if (hito === "1.0") {
    const beta = (novedadesCache || []).find((x) => x.hito === "beta" && x.fecha);
    etapa = ini && beta ? (ini < beta.fecha ? "alpha" : "beta") : (dias > 365 ? "alpha" : "beta");
  }
  return { dias, misiones, nivel, etapa };
}
let novedadesCache = null;
cargarNovedades().then((es) => { novedadesCache = es; });

function hitoNum(n) {
  try { return Number(n).toLocaleString(typeof idiomaActual === "function" && idiomaActual() === "en" ? "en-US" : "es-MX"); }
  catch (x) { return String(n); }
}

function hitoQuieto() {
  try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (x) { return false; }
}

/* Devuelve una promesa que se cumple al cerrarla, como `ventanaNovedades`. */
function abrirHito(e, opciones) {
  const op = opciones || {};
  const hito = hitoDeEntrada(e);
  const quieto = hitoQuieto();
  const t = tuParteHTML(hitoTuParte(hito, e), hito);
  cerrarHito(true);

  let estrellas = "", bichos = "";
  for (let i = 0; i < 60; i++) estrellas += `<i style="left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 100).toFixed(1)}%;animation-delay:${(Math.random() * 3).toFixed(2)}s"></i>`;
  /* Las luciérnagas salen de un anillo alrededor del centro, cada una de su
     ángulo, y vuelan hacia el isotipo. Las posiciones van en variables y el
     vuelo en una animación: una transición sobre variables se congela aquí
     (CLAUDE.md, «Trampas»). */
  for (let i = 0; i < 36; i++) {
    const ang = Math.random() * Math.PI * 2, r = 46 + Math.random() * 30;
    bichos += `<i style="--x:${(Math.cos(ang) * r).toFixed(1)}vmax;--y:${(Math.sin(ang) * r).toFixed(1)}vmax;animation-delay:${(0.3 + Math.random() * 0.7).toFixed(2)}s"></i>`;
  }
  const puntos = novedadCampo(e, "puntos") || [];
  const v = document.createElement("div");
  v.id = "hito";
  v.className = "hito-" + (hito === "1.0" ? "lanzamiento" : "beta") + (quieto ? " quieto" : "");
  v.setAttribute("role", "dialog");
  v.setAttribute("aria-modal", "true");
  v.setAttribute("aria-label", novedadCampo(e, "titulo") || "");
  v.innerHTML = `
    <div class="hito-cielo"></div>
    <div class="hito-estrellas" aria-hidden="true">${estrellas}</div>
    <div class="hito-bichos" aria-hidden="true">${bichos}</div>
    <div class="hito-escena">
      <div class="hito-marca" aria-hidden="true">
        <span class="hito-onda"></span><span class="hito-onda dos"></span>
        <svg viewBox="0 0 250 250"><path class="hito-iso" d="${HITO_ISOTIPO}"/></svg>
      </div>
      <div class="hito-numero" aria-hidden="true">
        <span class="hito-antes">${escapeHtml(op.desde || (op.prueba && typeof VERSION !== "undefined" ? VERSION : ""))}</span>
        <span class="hito-ahora">${escapeHtml(HITO_ETIQUETA[hito])}</span>
      </div>
      <h2 class="hito-tit">${escapeHtml(novedadCampo(e, "titulo") || "")}</h2>
      ${novedadCampo(e, "resumen") ? `<p class="hito-res">${escapeHtml(novedadCampo(e, "resumen"))}</p>` : ""}
      ${puntos.length ? `<ul class="hito-puntos">${puntos.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}</ul>` : ""}
      ${t}
      <div class="hito-botones">
        <button type="button" class="btn btn-primary hito-seguir">${escapeHtml(tx(hito === "1.0" ? "Seguir la expedición" : "Seguir adelante"))}</button>
        <button type="button" class="btn btn-linea hito-todas">${escapeHtml(tx("Ver todas las novedades"))}</button>
      </div>
      ${op.prueba ? `<p class="hito-prueba">${escapeHtml(tx("Prueba: así saldrá. No se apunta como visto."))}</p>` : ""}
    </div>
    <div class="hito-chispas" aria-hidden="true"></div>`;
  document.body.appendChild(v);

  return new Promise((listo) => {
    const cerrar = (yNovedades) => {
      cerrarHito();
      if (!op.prueba) {
        try {
          state.settings.hitosVistos = [...new Set([...(state.settings.hitosVistos || []), hito])];
          if (typeof save === "function") save();
        } catch (x) {}
      }
      listo();
      if (yNovedades) abrirNovedades();
    };
    v.querySelector(".hito-seguir").addEventListener("click", () => cerrar(false));
    v.querySelector(".hito-todas").addEventListener("click", () => cerrar(true));
    void v.offsetWidth;
    v.classList.add("show");
    setTimeout(() => { const b = v.querySelector(".hito-seguir"); if (b) b.focus({ preventScroll: true }); }, quieto ? 0 : 5200);
    /* El sonido, cuando el isotipo termina de dibujarse. `sonar` ya pasa por
       `puedeSonar`: con la app escondida o el audio dormido, no suena. */
    hitoReloj = setTimeout(() => {
      if (typeof sonar === "function") sonar("hito");
      if (!quieto) hitoChispas(v.querySelector(".hito-chispas"), hito === "1.0" ? 90 : 50);
    }, quieto ? 0 : 2300);
    v.querySelectorAll("[data-contar]").forEach((el) => {
      const hasta = Number(el.dataset.contar) || 0;
      if (quieto) { el.textContent = hitoNum(hasta); return; }
      setTimeout(() => {
        const t0 = Date.now();
        const r = setInterval(() => {
          if (!el.isConnected) return clearInterval(r);
          const q = Math.min(1, (Date.now() - t0) / 1400), f = 1 - Math.pow(1 - q, 3);
          el.textContent = hitoNum(Math.round(hasta * f));
          if (q === 1) clearInterval(r);
        }, 30);
      }, 4300);
    });
  });
}
let hitoReloj = null;

function tuParteHTML(d, hito) {
  const cifras = [
    d.dias ? `<span class="hito-cifra"><b data-contar="${d.dias}">0</b><span>${escapeHtml(tx(d.dias === 1 ? "día en Norata" : "días en Norata"))}</span></span>` : "",
    d.misiones ? `<span class="hito-cifra"><b data-contar="${d.misiones}">0</b><span>${escapeHtml(tx(d.misiones === 1 ? "misión cumplida" : "misiones cumplidas"))}</span></span>` : "",
    d.nivel ? `<span class="hito-cifra"><b data-contar="${d.nivel}">0</b><span>${escapeHtml(tx("nivel de expedición"))}</span></span>` : ""
  ].join("");
  const insignia = d.etapa === "alpha" ? tx("Expedición alpha") : tx("Expedición beta");
  const porque = d.etapa === "alpha"
    ? tx(hito === "1.0" ? "Llegaste cuando Norata todavía era alpha." : "Llegaste antes de la beta, cuando todo esto apenas se estaba armando.")
    : tx("Llegaste en la beta, antes de que Norata estuviera en la tienda.");
  return `
    <div class="hito-tuyo">
      <span class="hito-tuyo-tit">${escapeHtml(tx("Tu parte en esto"))}</span>
      ${cifras ? `<div class="hito-cifras">${cifras}</div>` : ""}
      <div class="hito-insignia">
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 3l17 9.5v21L24 45 7 33.5v-21z"/><path d="M24 14l3.2 6.6 7.2.9-5.3 5 1.4 7.1L24 30.1l-6.5 3.5 1.4-7.1-5.3-5 7.2-.9z"/></svg>
        <span><b>${escapeHtml(insignia)}</b><span>${escapeHtml(porque)}</span></span>
      </div>
    </div>`;
}

function hitoChispas(c, n) {
  if (!c) return;
  for (let i = 0; i < n; i++) {
    const s = document.createElement("i");
    const ang = Math.random() * Math.PI * 2, r = 120 + Math.random() * 260;
    s.style.cssText = `--dx:${(Math.cos(ang) * r).toFixed(0)}px;--dy:${(Math.sin(ang) * r).toFixed(0)}px;animation-delay:${(Math.random() * 0.35).toFixed(2)}s`;
    s.className = "c" + (i % 4);
    c.appendChild(s);
  }
}

function cerrarHito(enSeco) {
  clearTimeout(hitoReloj);
  const v = document.getElementById("hito");
  if (!v) return;
  if (enSeco || hitoQuieto()) { v.remove(); return; }
  v.classList.add("fuera");
  setTimeout(() => v.remove(), 380);
}

/* Desde Ajustes → Novedades en modo revisión: la escena tal como saldrá, con
   el texto de su borrador si existe, y sin apuntar nada. */
async function probarHito(cual) {
  const es = await cargarNovedades();
  const e = es.find((x) => x.hito === cual) ||
    { version: cual === "1.0" ? "1.0" : "0.8", hito: cual, titulo: cual === "1.0" ? "Norata 1.0" : "Norata entra en beta" };
  abrirHito(e, { prueba: true });
}

/* El isotipo de la marca, el mismo trazo que `avisarRenacer` (js/10i-apariencia.js). */
const HITO_ISOTIPO = "M224.919,110.004h-5.319c-2.476,0-4.487-2.011-4.487-4.487V25.081c0-4.947-4.027-8.973-8.973-8.973h-87.162c-4.947,0-8.973,4.027-8.973,8.973v5.319c0,2.476-2.011,4.487-4.487,4.487H31.811c-8.658,0-15.703,7.046-15.703,15.703v80.436c0,4.947,4.027,8.973,8.973,8.973h5.319c2.476,0,4.487,2.011,4.487,4.487v80.432c0,4.947,4.027,8.973,8.973,8.973h87.166c4.947,0,8.973-4.027,8.973-8.973v-5.319c0-2.476,2.011-4.487,4.487-4.487h55.755c18.556,0,33.650-15.094,33.650-33.650v-62.485c0-4.947-4.027-8.973-8.973-8.973ZM55.91,128.783h-5.319c-2.476,0-4.487-2.011-4.487-4.487v-54.927c0-2.476,2.011-4.487,4.487-4.487h61.657c4.947,0,8.973-4.027,8.973-8.973v-5.319c0-2.476,2.011-4.487,4.487-4.487h54.923c2.476,0,4.487,2.011,4.487,4.487v61.657c0,4.947,4.027,8.973,8.973,8.973h5.319c2.476,0,4.487,2.011,4.487,4.487v45.949c0,7.422-6.038,13.460-13.460,13.460h-52.679c-4.947,0-8.973,4.027-8.973,8.973v5.319c0,2.476-2.011,4.487-4.487,4.487h-54.927c-2.476,0-4.487-2.011-4.487-4.487v-61.653c0-4.947-4.027-8.973-8.973-8.973Z";
