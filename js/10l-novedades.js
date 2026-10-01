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

/* ---- Los borradores, a la vista en el panel (0.7.155) ----
   Eduardo abrió Ajustes → Novedades en la versión correcta y lo encontró
   vacío: todas las entradas estaban en borrador y solo salían con
   `?novedades=borrador` en la dirección, que no recordaba. Lo pidió así: «evita
   que sea necesario para poder verlo siempre, total, solo estoy yo».

   Así que el PANEL enseña también los borradores, cada uno con su etiqueta.
   Lo que NO cambia es la ventana que sale sola al abrir: esa sigue siendo
   solo para lo publicado, o cada versión le saltaría con un texto sin aprobar.

   **Esto se apaga antes de la beta.** Vale mientras la única persona que usa
   la app es él; el día que entre alguien más, un borrador a la vista es un
   texto sin aprobar publicado. Se pone en `false` y el panel vuelve a pedir el
   parámetro (está apuntado en VERSIONES.md, «Apuntado y sin hacer»). */
const NOVEDADES_BORRADORES_A_LA_VISTA = true;

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
function cargarDocNovedades() {
  /* Una sola vez por carga. Viene de la copia de la app (está en `ASSETS`, y en
     el APK viaja en el paquete), así que abre sin red. */
  if (!novedadesPedidas) {
    novedadesPedidas = fetch(NOVEDADES_URL)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        d = d || {};
        const vs = new Set((d.camino || []).map((c) => c.version));
        (d.entradas || []).forEach((e) => { if (e.version && e.clase !== "hito" && String(e.version).split(".").length <= 3 && !versionMasNueva(e.version, VERSION)) vs.add(e.version); });
        novedadesVersiones = vs.size;
        return d;
      })
      .catch(() => ({}));
  }
  return novedadesPedidas;
}
function cargarNovedades() {
  return cargarDocNovedades().then((d) => (Array.isArray(d.entradas) ? d.entradas : []));
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
  const v = en && e.en && e.en[campo] ? e.en[campo] : e[campo];
  return novedadRellenar(v);
}
/* `{versiones}` en un texto se cambia por cuántas versiones van publicadas
   (cada 3º de `camino` más los de las entradas, sin contar hitos). Lo usa el
   borrador de la beta: escrito como «156 versiones después», el día de la beta
   ya serían más y nadie se acordaría de cambiarlo. */
let novedadesVersiones = 0;
function novedadRellenar(v) {
  if (typeof v === "string") return v.indexOf("{versiones}") < 0 ? v : v.replace(/\{versiones\}/g, novedadesVersiones ? hitoNum(novedadesVersiones) : "");
  if (Array.isArray(v)) return v.map(novedadRellenar);
  return v;
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

/* ---- El gráfico de una novedad (0.7.151; rehecho en 0.7.153) ----
   Datos y no una imagen, para que salga con los colores de quien lo mira (su
   mundo, su modo) y en el idioma de la app. La web lo recibe dibujado como SVG
   desde `herramientas/novedades-framer.py`, porque Framer no ejecuta esto.

   Eduardo vio las primeras barras y las paró: largas, todas del mismo verde,
   sin iconos, y un «antes y ahora» contado como cuatro barras sueltas. De ahí
   salen cuatro formas, y `grafico` puede ser una o una lista de varias:

   | tipo       | para qué                          | cada dato                                 |
   | cifras     | dos a cuatro números que cuentan  | valor, texto, icono, tono                 |
   | comparar   | un antes y un ahora               | texto, antes, ahora, icono, tono          |
   | barras     | proporciones entre cosas          | valor, texto, icono, tono                 |
   | colores    | presentar paletas o colores       | nombre, colores: ["#…", …]                |

   `tono` es uno de los ocho colores de la app (1-8, `--paleta-N`): cada dato
   en el suyo para que se distingan, y con su cara de día y de noche. Sin
   tono, se reparten en orden. Los colores de `colores` son los de verdad de
   cada paleta —es lo que se presenta— y por eso van tal cual. */
function novedadTono(d, i) {
  const n = Number(d && d.tono);
  return n >= 1 && n <= 8 ? n : (i % 8) + 1;
}
function novedadIcono(d) {
  return d && d.icono && typeof icon === "function" ? `<span class="nov-g-ic">${icon(d.icono, 14)}</span>` : "";
}
function novedadBloqueHTML(g) {
  if (!g || !Array.isArray(g.datos) || !g.datos.length) return "";
  const titulo = novedadCampo(g, "titulo");
  const cab = titulo ? `<span class="nov-graf-tit">${escapeHtml(titulo)}</span>` : "";
  const texto = (d) => escapeHtml(novedadCampo(d, "texto") || novedadCampo(d, "nombre") || "");
  if (g.tipo === "comparar") {
    /* Puntitos y no barras: «de 1 a 5» se cuenta, no se mide. Los de antes van
       apagados y los que llegaron, encendidos en su tono; la diferencia, en
       una pastilla al final. Más de 12 se cambia a una barra partida. */
    return `<div class="nov-graf nov-comparar">${cab}${g.datos.map((d, i) => {
      const a = Number(d.antes) || 0, b = Number(d.ahora) || 0, max = Math.max(a, b);
      const dif = b - a;
      const pips = max <= 12
        ? Array.from({ length: max }, (_, k) => `<i class="${k < Math.min(a, b) ? "ya" : (k < b ? "nuevo" : "fue")}"></i>`).join("")
        : `<span class="nov-cmp-barra"><i class="ya" style="width:${Math.round(Math.min(a, b) / max * 100)}%"></i><i class="nuevo" style="width:${Math.round(Math.max(0, b - a) / max * 100)}%"></i></span>`;
      return `
      <div class="nov-cmp" style="--t: var(--paleta-${novedadTono(d, i)}); --t-linea: var(--paleta-${novedadTono(d, i)}-linea)">
        <span class="nov-cmp-et">${novedadIcono(d)}<span>${texto(d)}</span></span>
        <span class="nov-cmp-pips">${pips}</span>
        <span class="nov-cmp-num"><span class="antes">${escapeHtml(String(d.antes))}</span><span class="flecha" aria-hidden="true">→</span><b>${escapeHtml(String(d.ahora))}</b></span>
        ${dif ? `<span class="nov-cmp-dif">${dif > 0 ? "+" : "−"}${Math.abs(dif)}</span>` : ""}
      </div>`;
    }).join("")}</div>`;
  }
  if (g.tipo === "colores") {
    /* Cada paleta con sus muestras y su nombre debajo: decir «Ácido» sin
       enseñar el ácido no presenta nada. */
    return `<div class="nov-graf nov-colores">${cab}<div class="nov-col-fila">${g.datos.map((d) => `
      <span class="nov-col">
        <span class="nov-col-muestras">${(d.colores || []).slice(0, 5).map((c) => `<i style="background:${escapeAttr(c)}" title="${escapeAttr(c)}"></i>`).join("")}</span>
        <span class="nov-col-nom">${texto(d)}</span>
      </span>`).join("")}</div></div>`;
  }
  if (g.tipo === "barras") {
    const max = Math.max.apply(null, g.datos.map((d) => Number(d.valor) || 0)) || 1;
    return `<div class="nov-graf nov-barras">${cab}${g.datos.map((d, i) => `
      <div class="nov-barra" style="--t: var(--paleta-${novedadTono(d, i)}-linea)">
        <span class="nov-barra-et">${novedadIcono(d)}<span>${texto(d)}</span></span>
        <span class="nov-barra-carril"><i style="width:${Math.round((Number(d.valor) || 0) / max * 100)}%"></i></span>
        <b>${escapeHtml(String(d.valor))}</b>
      </div>`).join("")}</div>`;
  }
  return `<div class="nov-graf nov-cifras">${cab}<div class="nov-cifras-fila">${g.datos.slice(0, 4).map((d, i) => `
    <span class="nov-cifra" style="--t: var(--paleta-${novedadTono(d, i)})">${novedadIcono(d)}<b>${escapeHtml(String(d.valor))}</b><span>${texto(d)}</span></span>`).join("")}</div></div>`;
}
function novedadGraficoHTML(g) {
  return (Array.isArray(g) ? g : [g]).map(novedadBloqueHTML).join("");
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
  /* Dos cosas distintas desde la 0.7.155: la LISTA lleva los borradores
     siempre (ver `NOVEDADES_BORRADORES_A_LA_VISTA`), y las HERRAMIENTAS de
     prueba —la ventana y los dos anuncios de hito— siguen detrás del
     parámetro, que es donde tienen sentido. */
  const borrador = novedadesEnBorrador();
  const lista = novedadesVisibles(await cargarNovedades(), borrador || NOVEDADES_BORRADORES_A_LA_VISTA);
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

/* ================= Los hitos: la beta y la 1.0 (0.7.152; rehecho en 0.7.153) =================
   Eduardo: «un anuncio muy especial en diseño para cuando subamos de alpha a
   beta y el lanzamiento 1.0, con animaciones, y más cosas». Dos veces en la
   vida de la app, así que no es una ventana con más adornos: es una escena.

   Lo que Eduardo corrigió al ver la primera (0.7.153), y que manda:
   - **Va con el mundo puesto**: sus colores, sus botones, su material. Lo de
     noche se queda —es un dibujo, no interfaz—, pero teñido de su acento.
   - **El número grande va en la letra de la app (`--sans`)**, nunca en la del
     mundo: en Arcade y Averno la «a» y la «e» de «Beta» no se leían.
   - **El número desfila**: en la beta, por todas las versiones de la alpha; en
     la 1.0, desde la primera, por la beta y sus actualizaciones, hasta la 1.0.
     Tarda —en la 1.0, nueve segundos—, y es a propósito: es la celebración.
     La lista sale de `camino` (lo de antes de las novedades) y de las
     entradas (lo de después), así que no hay que mantenerla a mano.
   - **Cada hito tiene su insignia**: un sello hexagonal para la beta y una
     medalla con cinta para la 1.0.
   - **Abajo, un reporte**: lo que recorriste, en tarjetas que aparecen al
     bajar. Sin láminas: las láminas son del aniversario, y aquí el
     espectáculo ya lo dio la escena de arriba.

   Lo que pasa, en orden: noche y estrellas (0 s) → luciérnagas que vuelan al
   centro (0,3) → el isotipo se dibuja, ondas y sonido (1,6–2,7) → el número
   desfila (2,9) → al aterrizar, chispas, y entra el texto (`.llego`) → abajo,
   el reporte. Con «menos movimiento» sale todo ya en su sitio.

   Se apunta como visto POR PERSONA, en `settings.hitosVistos` (viaja con la
   cuenta): un hito no se celebra dos veces porque tengas dos dispositivos. */
const HITO_ETIQUETA = { beta: "Beta", "1.0": "1.0" };
/* Cuánto dura el desfile, en milisegundos. */
const HITO_DESFILE = { beta: 4800, "1.0": 9000 };

function hitoDeEntrada(e) {
  return e && (e.hito === "beta" || e.hito === "1.0") ? e.hito : (versionMasNueva(e && e.version || "0", "0.9.999") ? "1.0" : "beta");
}

function hitoQuieto() {
  try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (x) { return false; }
}

function hitoNum(n) {
  try { return Number(n).toLocaleString(typeof idiomaActual === "function" && idiomaActual() === "en" ? "en-US" : "es-MX"); }
  catch (x) { return String(n); }
}

/* Las versiones por las que desfila el número: cada 3º publicado, de la
   primera a la última antes del hito. Los 4º no: son retoques del mismo. */
function hitoCamino(doc, hito) {
  const tope = hito === "1.0" ? "0.9.9999" : "0.7.9999";
  const vistas = {};
  (doc.camino || []).forEach((c) => { vistas[c.version] = c.fecha || ""; });
  (doc.entradas || []).forEach((e) => {
    if (e.version && e.clase !== "hito" && String(e.version).split(".").length <= 3) vistas[e.version] = e.fecha || vistas[e.version] || "";
  });
  return Object.keys(vistas)
    .filter((v) => !versionMasNueva(v, tope))
    .sort((a, b) => (versionMasNueva(a, b) ? 1 : -1));
}

/* Lo que recorriste, de lo que la app ya guarda. Lo que salga en cero no se
   pinta: una tarjeta con un cero no cuenta nada. */
function hitoReporte(hito, doc) {
  const st = (typeof state !== "undefined" && state) || {};
  const s = st.settings || {};
  const hoy = typeof todayKey === "function" ? todayKey() : "";
  const ini = s.inicio || null;
  const dias = ini && typeof daysBetween === "function" ? daysBetween(ini, hoy) + 1 : 0;

  const activos = typeof activityDaySet === "function" ? [...activityDaySet()].sort() : [];
  let racha = 0, corrida = 0, previo = null;
  activos.forEach((k) => {
    corrida = previo && typeof addDaysKey === "function" && addDaysKey(previo, 1) === k ? corrida + 1 : 1;
    racha = Math.max(racha, corrida);
    previo = k;
  });

  let misiones = 0, primera = null;
  (st.missions || []).forEach((m) => {
    if (typeof missionDone === "function") Object.keys(m.log || {}).forEach((k) => { if (missionDone(m, k)) misiones++; });
    const k = m.createdAt || Object.keys(m.log || {}).sort()[0];
    if (k && (!primera || k < primera.k)) primera = { k, nombre: m.name };
  });

  let hab = null;
  (st.skills || []).forEach((h) => {
    const n = typeof levelInfo === "function" ? levelInfo(Math.max(0, h.xp || 0)).level : 0;
    if (!hab || n > hab.n) hab = { nombre: h.name, n };
  });
  const nodos = (st.perks || []).filter((p) => p.status === "completed").length;
  const nivel = typeof nivelExpedicion === "function" ? nivelExpedicion().nivel : 0;
  const rango = nivel && typeof rangoExpedicion === "function" && typeof nombreDeRango === "function"
    ? nombreDeRango(rangoExpedicion(nivel)) : "";

  /* La insignia: dónde estabas cuando cambió la etapa. Para la beta, todo el
     que la ve llegó en la alpha. Para la 1.0 se mira la fecha de la entrada de
     la beta; sin ella, se dice la alpha solo si llevas más de un año. */
  let etapa = "alpha";
  if (hito === "1.0") {
    const beta = (doc.entradas || []).find((x) => x.hito === "beta" && x.fecha);
    etapa = ini && beta ? (ini < beta.fecha ? "alpha" : "beta") : (dias > 365 ? "alpha" : "beta");
  }
  /* Los últimos días, uno por punto, por semanas: 26 semanas como mucho. */
  const set = new Set(activos);
  const semanas = Math.min(26, Math.max(4, Math.ceil(dias / 7)));
  const puntos = [];
  if (typeof addDaysKey === "function") {
    for (let i = semanas * 7 - 1; i >= 0; i--) {
      const k = addDaysKey(hoy, -i);
      puntos.push(ini && k < ini ? 0 : (set.has(k) ? 2 : 1));
    }
  }
  return { dias, ini, activos: activos.length, racha, misiones, primera, hab, nodos, nivel, rango, etapa, puntos, semanas };
}

function hitoInsigniaSVG(hito, etapa) {
  const letra = etapa === "beta" ? "β" : "α";
  if (hito === "1.0") {
    /* La medalla de la 1.0: redonda, con su cinta, el número dentro y la letra
       de la etapa en la que llegaste. */
    return `<svg class="hito-ins-svg medalla" viewBox="0 0 64 72" aria-hidden="true">
      <path class="cinta" d="M20 40 L12 70 L22 64 L28 72 L32 46 Z M44 40 L52 70 L42 64 L36 72 L32 46 Z"/>
      <circle class="aro" cx="32" cy="28" r="24"/><circle class="dentro" cx="32" cy="28" r="18"/>
      <text x="32" y="27" text-anchor="middle" class="num">1.0</text>
      <text x="32" y="40" text-anchor="middle" class="letra">${letra}</text>
    </svg>`;
  }
  /* El sello de la beta: un hexágono con la alfa en medio. */
  return `<svg class="hito-ins-svg sello" viewBox="0 0 64 64" aria-hidden="true">
    <path class="aro" d="M32 3l25 14.5v29L32 61 7 46.5v-29z"/>
    <path class="dentro" d="M32 11l18 10.5v21L32 53 14 42.5v-21z"/>
    <text x="32" y="41" text-anchor="middle" class="letra">${letra}</text>
  </svg>`;
}

function hitoReporteHTML(d, hito) {
  const tarjeta = (tono, ico, valor, texto, extra) => `
    <div class="hito-rep" style="--t: var(--paleta-${tono})">
      <span class="hito-rep-ic">${icon(ico, 18)}</span>
      <b>${valor}</b><span>${escapeHtml(texto)}</span>${extra || ""}
    </div>`;
  const cont = (n) => `<span data-contar="${n}">${hitoNum(n)}</span>`;
  const t = [];
  if (d.dias) t.push(tarjeta(1, "compass", cont(d.dias), tx(d.dias === 1 ? "día desde que empezaste" : "días desde que empezaste"),
    d.ini ? `<i>${escapeHtml(T`desde el ${novedadFecha(d.ini)}`)}</i>` : ""));
  if (d.activos) t.push(tarjeta(5, "check", cont(d.activos), tx(d.activos === 1 ? "día con algo hecho" : "días con algo hecho"),
    d.dias ? `<i>${escapeHtml(T`${Math.round(d.activos / d.dias * 100)}% de tus días`)}</i>` : ""));
  if (d.racha > 1) t.push(tarjeta(2, "flame", cont(d.racha), tx("días seguidos, tu mejor racha")));
  if (d.misiones) t.push(tarjeta(3, "target", cont(d.misiones), tx(d.misiones === 1 ? "misión cumplida" : "misiones cumplidas")));
  if (d.nodos) t.push(tarjeta(4, "star", cont(d.nodos), tx(d.nodos === 1 ? "nodo logrado" : "nodos logrados")));
  if (d.hab && d.hab.n) t.push(tarjeta(6, "bolt", T`Nivel ${d.hab.n}`, d.hab.nombre || ""));
  if (d.nivel) t.push(tarjeta(7, "crown", T`Nivel ${d.nivel}`, d.rango ? T`de expedición · ${d.rango}` : tx("de expedición")));
  const primera = d.primera ? `
    <div class="hito-rep hito-rep-ancha" style="--t: var(--paleta-1)">
      <span class="hito-rep-ic">${icon("flag", 18)}</span>
      <span class="hito-rep-cita">${escapeHtml(tx("Todo empezó con"))} <b>«${escapeHtml(d.primera.nombre || "")}»</b></span>
      <i>${escapeHtml(novedadFecha(d.primera.k))}</i>
    </div>` : "";
  const mapa = d.puntos.length ? `
    <div class="hito-rep hito-rep-ancha hito-mapa-caja" style="--t: var(--paleta-5)">
      <span class="hito-rep-tit">${escapeHtml(T`Tus últimas ${d.semanas} semanas, un punto por día`)}</span>
      <span class="hito-mapa" style="--semanas:${d.semanas}">${d.puntos.map((p) => `<i class="p${p}"></i>`).join("")}</span>
    </div>` : "";
  const insignia = d.etapa === "alpha" ? tx("Expedición alpha") : tx("Expedición beta");
  const porque = d.etapa === "alpha"
    ? tx(hito === "1.0" ? "Llegaste cuando Norata todavía era alpha." : "Llegaste antes de la beta, cuando todo esto apenas se estaba armando.")
    : tx("Llegaste en la beta, antes de que Norata estuviera en la tienda.");
  return `
    <section class="hito-reporte">
      <h3 class="hito-rep-titulo">${escapeHtml(tx(hito === "1.0" ? "Tu camino hasta la 1.0" : "Tu alpha, en números"))}</h3>
      <div class="hito-insignia hito-${hito === "1.0" ? "medalla" : "sello"}">
        ${hitoInsigniaSVG(hito, d.etapa)}
        <span><b>${escapeHtml(insignia)}</b><span>${escapeHtml(porque)}</span></span>
      </div>
      <div class="hito-reps">${t.join("")}${primera}${mapa}</div>
    </section>`;
}

/* Devuelve una promesa que se cumple al cerrarla, como `ventanaNovedades`. */
async function abrirHito(e, opciones) {
  const op = opciones || {};
  const hito = hitoDeEntrada(e);
  const quieto = hitoQuieto();
  const doc = await cargarDocNovedades();
  const camino = hitoCamino(doc, hito);
  /* En la prueba de la 1.0, mientras no exista ninguna beta, se inventan unas
     cuantas para que se vea el cruce de «Alpha» a «Beta». Solo en la prueba. */
  if (op.prueba && hito === "1.0" && !camino.some((v) => versionMasNueva(v, "0.7.9999"))) {
    camino.push("0.8");
    for (let i = 1; i <= 24; i++) camino.push("0.8." + i);
  }
  const rep = hitoReporteHTML(hitoReporte(hito, doc), hito);
  cerrarHito(true);

  let estrellas = "", bichos = "";
  for (let i = 0; i < 60; i++) estrellas += `<i style="left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 100).toFixed(1)}%;animation-delay:${(Math.random() * 3).toFixed(2)}s"></i>`;
  /* Las luciérnagas salen de un anillo alrededor del centro y vuelan al
     isotipo. Posiciones en variables y vuelo en animación: una transición
     sobre variables se congela en esta app (CLAUDE.md, «Trampas»). */
  for (let i = 0; i < 40; i++) {
    const ang = Math.random() * Math.PI * 2, r = 46 + Math.random() * 30;
    bichos += `<i style="--x:${(Math.cos(ang) * r).toFixed(1)}vmax;--y:${(Math.sin(ang) * r).toFixed(1)}vmax;animation-delay:${(0.3 + Math.random() * 0.7).toFixed(2)}s"></i>`;
  }
  const puntos = novedadCampo(e, "puntos") || [];
  /* La ruleta: una tira con cada versión y, arriba del todo, la etapa a la que
     se llega. Baja como un rodillo hasta dejar la etapa en la ventana. */
  const filas = [HITO_ETIQUETA[hito]].concat(camino.slice().reverse());
  const ruleta = `
    <span class="hito-ruleta" aria-hidden="true">
      <span class="hito-tira">${filas.map((x, i) => `<span class="hito-fila${i === 0 ? " meta" : ""}">${escapeHtml(x)}</span>`).join("")}</span>
    </span>
    <span class="hito-ruleta-lector" aria-live="polite">${escapeHtml(HITO_ETIQUETA[hito])}</span>`;

  const v = document.createElement("div");
  v.id = "hito";
  v.className = "hito-" + (hito === "1.0" ? "lanzamiento" : "beta") + (quieto ? " quieto llego" : "");
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
      <div class="hito-numero">
        <span class="hito-etapa">${escapeHtml(quieto ? HITO_ETIQUETA[hito] === "1.0" ? tx("Lanzamiento") : "Beta" : "Alpha")}</span>
        ${ruleta}
      </div>
      <div class="hito-texto">
        <h2 class="hito-tit">${escapeHtml(novedadCampo(e, "titulo") || "")}</h2>
        ${novedadCampo(e, "resumen") ? `<p class="hito-res">${escapeHtml(novedadCampo(e, "resumen"))}</p>` : ""}
        ${puntos.length ? `<ul class="hito-puntos">${puntos.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}</ul>` : ""}
        <div class="hito-botones">
          <button type="button" class="btn btn-primary hito-seguir">${escapeHtml(tx(hito === "1.0" ? "Seguir la expedición" : "Seguir adelante"))}</button>
          <button type="button" class="btn btn-linea hito-todas">${escapeHtml(tx("Ver todas las novedades"))}</button>
        </div>
        ${op.prueba ? `<p class="hito-prueba">${escapeHtml(tx("Prueba: así saldrá. No se apunta como visto."))}</p>` : ""}
        <span class="hito-baja" aria-hidden="true">${escapeHtml(tx("Abajo, lo que recorriste"))} ↓</span>
        ${rep}
      </div>
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
    /* La ruleta arranca en la primera versión, puesta antes de que se vea (el
       número entra a los 2,8 s): si no, la etapa asomaría antes de girar. Y
       después de `show`, que con la escena escondida las filas miden cero. */
    hitoPonerTira(v, quieto ? 0 : v.querySelectorAll(".hito-fila").length - 1);

    const llegar = () => {
      if (!v.isConnected) return;
      v.classList.add("llego");
      if (!quieto) hitoChispas(v.querySelector(".hito-chispas"), hito === "1.0" ? 120 : 60);
      hitoContar(v, quieto);
      hitoRevelar(v, quieto);
      const b = v.querySelector(".hito-seguir");
      if (b) setTimeout(() => b.focus({ preventScroll: true }), quieto ? 0 : 1600);
    };
    if (quieto) { llegar(); return; }
    /* El sonido, cuando el isotipo termina de dibujarse. `sonar` ya pasa por
       `puedeSonar`: con la app escondida o el audio dormido, no suena. */
    hitoRelojes.push(setTimeout(() => { if (typeof sonar === "function") sonar("hito"); }, 2300));
    hitoRelojes.push(setTimeout(() => hitoDesfile(v, camino, hito, llegar), 2900));
  });
}
let hitoRelojes = [];

/* La ruleta (0.7.153.2). Eduardo, al ver la primera versión con barra: lo que
   quería era el contador de la primera, el número que se movía de arriba
   abajo como una ruleta, pero pasando por todas las versiones y parando en
   la etapa. Así que es eso: una tira con todas las versiones que baja, lenta
   al arrancar y al frenar, y rápida en medio, con las vecinas asomando
   difuminadas arriba y abajo. Al cruzar la 0.8 la etiqueta pasa de «Alpha» a
   «Beta» con un destello. La posición sale de un reloj y no de una animación
   de CSS: lo que se ve en la ventana ES el número, y la etiqueta tiene que
   saber en cuál va. */
function hitoDesfile(v, camino, hito, alFinal) {
  const tira = v.querySelector(".hito-tira"), etapa = v.querySelector(".hito-etapa");
  const filas = tira ? tira.children.length : 0;
  const total = HITO_DESFILE[hito], t0 = Date.now(), n = camino.length;
  let enBeta = false;
  const poner = (fila) => hitoPonerTira(v, fila);
  poner(filas - 1);
  v.classList.add("desfila");
  const paso = () => {
    if (!v.isConnected) return;
    const q = Math.min(1, (Date.now() - t0) / total);
    const f = q < 0.5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2;
    const fila = (filas - 1) * (1 - f);
    poner(fila);
    /* Desenfoque solo cuando va rápido: un rodillo de verdad se emborrona. */
    v.classList.toggle("veloz", q > 0.18 && q < 0.82);
    /* La fila k de la tira es la versión n-k (la 0 es la etapa). */
    const i = Math.min(n - 1, Math.max(0, Math.round(n - fila)));
    if (!enBeta && camino[i] && versionMasNueva(camino[i], "0.7.9999")) {
      enBeta = true;
      etapa.textContent = "Beta";
      v.classList.remove("cruce"); void v.offsetWidth; v.classList.add("cruce");
    }
    if (q < 1) { hitoRelojes.push(setTimeout(paso, 16)); return; }
    v.classList.remove("desfila", "veloz");
    poner(0);
    etapa.textContent = hito === "1.0" ? tx("Lanzamiento") : "Beta";
    v.classList.add("aterriza");
    alFinal();
  };
  paso();
}

/* Deja la fila `fila` de la tira en el centro de la ventana de la ruleta, que
   enseña tres: la de arriba y la de abajo asoman difuminadas. Fila 0 es la
   etapa; la última, la primera versión de todas. */
function hitoPonerTira(v, fila) {
  const tira = v.querySelector(".hito-tira");
  if (!tira || !tira.firstElementChild) return;
  const alto = tira.firstElementChild.getBoundingClientRect().height;
  tira.style.transform = `translateY(${((1 - fila) * alto).toFixed(1)}px)`;
}

function hitoContar(v, quieto) {
  v.querySelectorAll("[data-contar]").forEach((el) => {
    const hasta = Number(el.dataset.contar) || 0;
    if (quieto) { el.textContent = hitoNum(hasta); return; }
    el.textContent = "0";
    el.dataset.esperando = "1";
  });
}

/* El reporte aparece al bajar: cada tarjeta entra cuando se ve, y su número
   cuenta hacia arriba en ese momento, no antes, que nadie lo estaba mirando. */
function hitoRevelar(v, quieto) {
  const tarjetas = v.querySelectorAll(".hito-rep, .hito-insignia, .hito-rep-titulo");
  if (quieto || typeof IntersectionObserver !== "function") { tarjetas.forEach((t) => t.classList.add("visto")); hitoNumeros(v, true); return; }
  const io = new IntersectionObserver((vistas) => {
    vistas.forEach((x) => {
      if (!x.isIntersecting) return;
      x.target.classList.add("visto");
      io.unobserve(x.target);
      x.target.querySelectorAll("[data-esperando]").forEach((el) => hitoContarUno(el));
    });
  }, { root: v, threshold: 0.35 });
  tarjetas.forEach((t) => io.observe(t));
}
function hitoNumeros(v) {
  v.querySelectorAll("[data-contar]").forEach((el) => { el.textContent = hitoNum(Number(el.dataset.contar) || 0); });
}
function hitoContarUno(el) {
  delete el.dataset.esperando;
  const hasta = Number(el.dataset.contar) || 0, t0 = Date.now();
  const r = setInterval(() => {
    if (!el.isConnected) return clearInterval(r);
    const q = Math.min(1, (Date.now() - t0) / 1200), f = 1 - Math.pow(1 - q, 3);
    el.textContent = hitoNum(Math.round(hasta * f));
    if (q === 1) clearInterval(r);
  }, 30);
}

function hitoChispas(c, n) {
  if (!c) return;
  for (let i = 0; i < n; i++) {
    const s = document.createElement("i");
    const ang = Math.random() * Math.PI * 2, r = 120 + Math.random() * 300;
    s.style.cssText = `--dx:${(Math.cos(ang) * r).toFixed(0)}px;--dy:${(Math.sin(ang) * r).toFixed(0)}px;animation-delay:${(Math.random() * 0.4).toFixed(2)}s`;
    s.className = "c" + (i % 4);
    c.appendChild(s);
  }
}

function cerrarHito(enSeco) {
  hitoRelojes.forEach(clearTimeout);
  hitoRelojes = [];
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
