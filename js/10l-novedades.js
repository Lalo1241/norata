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
  const lista = novedadesVisibles(await cargarNovedades(), true).filter((e) => NOVEDAD_CLASES[novedadClase(e)].ventana);
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
