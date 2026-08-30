/* ================= Las apariencias =================
   Encender otra piel de Norata. Lo que hace este archivo y nada más: leer la
   elección, comprobar que se puede, aplicarla y guardarla.

   Dos palabras y no son intercambiables — están definidas en
   `apariencias/LEEME.md`, que es el documento que manda:

     ambiente   un RECOLOR. Reusa el material que ya hay y le cambia la luz.
                Son siete, viven en `css/ambientes.css` y viajan con la app
                porque pesan seis kilobytes entre todos.
     mundo      cambia el MATERIAL: otra superficie, otro marco, otra letra y
                otro peso al moverse. Pesa entre 28 y 180 KB, así que NO viaja
                con la app: se pide el día que se enciende.

   Son EXCLUYENTES, y por eso esto es un atributo y no una clase: un mundo
   declara sus propios colores, así que un ambiente por debajo no se vería.
   Con `data-apariencia` el modelo se hace cumplir solo, porque un atributo no
   puede llevar dos valores a la vez. El modo claro sigue siendo la clase
   `claro` y es un eje aparte: cada apariencia tiene sus dos caras. */

const APARIENCIA_LLAVE = "norata-apariencia";
const APARIENCIA_PRUEBA = "norata-apariencia-prueba";

/* Los siete ambientes. `abre` es el nivel de expedición que los desbloquea, y
   hoy ese nivel NO EXISTE —la app da niveles por habilidad y nadie suma el
   total—, así que la puerta está escrita pero todavía no la guarda nadie: ver
   `aparienciaDisponible`. Los tonos de cada uno están en `css/ambientes.css`
   y salen medidos de `apariencias/datos.py`. */
const AMBIENTES = [
  { id: "casa",     nombre: "Noche de expedición", grado: 0, abre: 0 },
  /* Gratis siempre y no por generosidad: para quien no distingue bien los
     colores, un monocromo no es un adorno — es la única manera de usar la
     app. Cobrarlo sería cobrar por entrar. */
  { id: "tinta",    nombre: "Tinta",    grado: 3, abre: 0 },
  { id: "musgo",    nombre: "Musgo",    grado: 1, abre: 3 },
  { id: "marea",    nombre: "Marea",    grado: 2, abre: 5,  pro: true },
  { id: "adobe",    nombre: "Adobe",    grado: 1, abre: 7 },
  { id: "escarcha", nombre: "Escarcha", grado: 2, abre: 12, pro: true },
  { id: "duna",     nombre: "Duna",     grado: 1, abre: 20 }
];

function ambientePorId(id) {
  return AMBIENTES.filter((a) => a.id === id)[0] || null;
}

/* ---- Qué apariencia está puesta ---- */

function apariencia() {
  const raiz = document.documentElement;
  return raiz.getAttribute("data-apariencia") || "casa";
}

/* Lo que se guardó, que no siempre es lo que se ve: una apariencia de prueba
   vive en `sessionStorage` y desaparece al cerrar la pestaña. */
function aparienciaGuardada() {
  try { return localStorage.getItem(APARIENCIA_LLAVE) || "casa"; } catch (e) { return "casa"; }
}

/* ---- Quién puede usar qué ----
   Devuelve `true`, o el motivo por el que todavía no. Dos puertas y en este
   orden: primero el NIVEL, que es lo que se gana, y después el PLAN, que es
   lo que se paga. El orden importa para lo que se le dice a la persona — a
   quien todavía no llega al nivel no se le ofrece pagar, se le dice cuánto
   le falta. Cobrar por saltarse la escalera es justo lo que rompería la
   escalera. */
function aparienciaDisponible(id) {
  const a = ambientePorId(id);
  if (!a) return "no existe";
  if (a.abre && typeof expedicion === "function") {
    /* El nivel que vale es el ALCANZADO —el más alto que hayas tenido— y no
       el de hoy: nadie pierde un ambiente por haber borrado historial. */
    if (expedicion().alcanzado < a.abre) return "nivel";
  }
  if (a.pro && typeof planPermite === "function" && !planPermite("apariencia")) return "pro";
  return true;
}

/* ---- Ponérsela ---- */

function ponerApariencia(cual, opciones) {
  const op = opciones || {};
  const a = ambientePorId(cual) ? cual : "casa";
  const raiz = document.documentElement;
  if (a !== "casa" && aparienciaDisponible(a) !== true && !op.forzar) return false;

  /* Un instante sin transiciones, y por el mismo motivo exacto que
     `ponerTema`: en esta app una transición sobre una propiedad cuyo valor
     sale de una variable se queda CONGELADA —Chrome no se entera del cambio y
     deja el color clavado en el primero que vio, para siempre—. Cambiar de
     apariencia cambia veinte variables de golpe, así que es el mismo caso que
     el modo claro pero más grande.
     Se apagan, se cambia, se fuerza el recálculo leyendo un estilo, y se
     devuelven en el siguiente turno con un temporizador. Con
     `requestAnimationFrame` no vale: en una pestaña en segundo plano el
     navegador no dibuja cuadros, así que ese aviso no llega nunca y la app se
     quedaría SIN transiciones para siempre. */
  raiz.classList.add("cambiando-modo");
  if (a === "casa") raiz.removeAttribute("data-apariencia");
  else raiz.setAttribute("data-apariencia", a);
  getComputedStyle(raiz).backgroundColor;   // obliga a recalcular ya, no luego
  setTimeout(() => raiz.classList.remove("cambiando-modo"), 0);

  if (!op.soloVista) {
    try { localStorage.setItem(APARIENCIA_LLAVE, a); } catch (e) {}
  }
  pintarColorDeBarra();
  return true;
}

/* La franja del navegador de arriba —y en Android la barra de estado de la app
   instalada— no la pinta el CSS. `ponerTema` la cambia a mano con dos colores
   escritos; aquí no se puede, porque cada apariencia tiene los suyos y serían
   catorce parejas que mantener a mano. Se LEE el fondo ya calculado, que
   siempre dice la verdad aunque mañana entre un mundo nuevo. */
function pintarColorDeBarra() {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;
  const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
  if (bg && bg.indexOf("(") === -1) meta.setAttribute("content", bg);
}

/* ---- La prueba con enlace ----
   Como los tonos del modo claro en 0.7.3.1: se sube apagada y se enciende con
   una dirección. En `sessionStorage` y no en `localStorage` a propósito, para
   que no se quede pegada como si fuera un ajuste; con la pestaña cerrada
   desaparece. El rótulo fijo es parte de la receta: sin él es fácil olvidar
   que la pestaña está en modo prueba y acabar juzgando la app de verdad por
   lo que se ve ahí. */
function aparienciaDePrueba() {
  let cual = null;
  try { cual = sessionStorage.getItem(APARIENCIA_PRUEBA); } catch (e) {}
  if (!cual) return null;
  if (!ambientePorId(cual)) return null;
  return cual;
}

function rotuloDePrueba(cual) {
  if (document.getElementById("aparienciaPrueba")) return;
  const n = ambientePorId(cual);
  const d = document.createElement("div");
  d.id = "aparienciaPrueba";
  d.textContent = "Apariencia de prueba: " + (n ? n.nombre : cual);
  document.body.appendChild(d);
}

/* ---- El arranque ----
   Lo llama `js/11-arranque.js`. El atributo ya lo puso el script de arriba de
   `index.html` antes de pintar; esto es lo que hace falta después: el rótulo,
   el color de la barra, y quitar una apariencia que se guardó cuando se podía
   y ahora ya no —alguien que dejó de pagar con Escarcha puesta—. */
function arrancarApariencia() {
  const prueba = aparienciaDePrueba();
  if (prueba) {
    ponerApariencia(prueba, { soloVista: true, forzar: true });
    rotuloDePrueba(prueba);
    pintarColorDeBarra();
    return;
  }
  const puesta = apariencia();
  /* Congelar, nunca quitar: si ya no se puede, se vuelve a la casa en vez de
     dejar la app pintada con algo que el servidor no reconoce. La elección
     guardada NO se borra — el día que vuelva a pagar, vuelve su apariencia. */
  if (puesta !== "casa" && aparienciaDisponible(puesta) !== true) {
    const raiz = document.documentElement;
    raiz.classList.add("cambiando-modo");
    raiz.removeAttribute("data-apariencia");
    getComputedStyle(raiz).backgroundColor;
    setTimeout(() => raiz.classList.remove("cambiando-modo"), 0);
  }
  pintarColorDeBarra();
}

/* ================= La pantalla de Apariencia =================
   Vive DENTRO de Ajustes y no en una pantalla nueva ni en una pestaña de la
   barra: una tienda con su propio botón abajo es un mostrador en la recámara.
   Y la app ya tenía el sitio natural — el interruptor de sol y luna vive en el
   índice de Ajustes, y elegir ambiente es la misma familia de decisión. El sol
   y la luna NO se mueven de ahí: están dos centímetros más arriba en la misma
   pantalla, y sacarlos de su sitio para hacerle hueco a esto sería cobrarle el
   cambio a quien no viene a comprar. */

/* Desde 0.7.41 la sección es de todos: el nivel de expedición existe, así que
   un ambiente que se desbloquea ya sabe cuándo se desbloqueó y la escalera
   significa algo. Antes iba detrás de `?apariencia=` justamente porque
   enseñar cinco premios que nadie podía ganarse los regalaba. */
const APARIENCIA_PUBLICA = true;

function aparienciaVisibleEnAjustes() {
  return APARIENCIA_PUBLICA || !!aparienciaDePrueba();
}

/* Por qué no se puede, dicho como lo diría una persona. Un candado sin motivo
   al lado es una lista de lo que te falta; con el motivo es una meta. */
function motivoApariencia(a) {
  const puede = aparienciaDisponible(a.id);
  if (puede === true) return null;
  if (puede === "nivel") return "Nivel " + a.abre;
  if (puede === "pro" && typeof NOMBRE_PRO === "string") return "Con " + NOMBRE_PRO;
  return "Con Pro";
}

function renderPanelApariencia() {
  const caja = document.getElementById("panel-apariencia");
  if (!caja) return;
  const puesta = apariencia();

  const muestras = AMBIENTES.map((a) => {
    const bloqueado = aparienciaDisponible(a.id) !== true;
    const motivo = motivoApariencia(a);
    /* El motivo se escribe AL LADO: es lo que convierte «no lo tienes» en «lo
       tendrás», y es la mitad del premio. Los que ya tienes no llevan pie —
       decirle a alguien el nivel de algo que ya se ganó es ruido. */
    const pie = motivo || "";
    return `
      <button type="button" class="amb-m mues-${a.id}${puesta === a.id ? " on" : ""}${bloqueado ? " cerrado" : ""}"
        onclick="elegirApariencia('${a.id}')"
        aria-pressed="${puesta === a.id}"
        title="${escapeHtml(a.nombre)}${pie ? " · " + escapeHtml(pie) : ""}">
        <span class="amb-mini" aria-hidden="true">
          <span class="amb-tarj"></span><span class="amb-pt"></span>
        </span>
        <span class="amb-n">${escapeHtml(a.nombre)}</span>
        ${pie ? `<span class="amb-p">${escapeHtml(pie)}</span>` : ""}
      </button>`;
  }).join("");

  caja.innerHTML = `
    <h3>Ambientes</h3>
    <p class="settings-note">El mismo Norata con otra luz. Se van desbloqueando conforme avanzas, y el modo de día y de noche sigue arriba: cada ambiente tiene sus dos caras.</p>
    <div class="amb-rej">${muestras}</div>`;
}

/* Un toque: se pone, se guarda y se vuelve a dibujar la rejilla para que la
   marca de «puesta» se mueva. Si no se puede, no se pone y se dice por qué en
   vez de no hacer nada — un botón que no contesta parece roto. */
function elegirApariencia(id) {
  const a = ambientePorId(id);
  if (!a) return;
  const motivo = motivoApariencia(a);
  if (motivo) {
    if (typeof toast === "function") toast(a.nombre + " viene con " + motivo.replace(/^Con /, ""), "atencion");
    return;
  }
  ponerApariencia(id);
  renderPanelApariencia();
}

/* Desde la tarjeta del Resumen: lleva a Ajustes con la sección ya abierta. Es
   el único camino corto que hay a lo que se acaba de desbloquear, y sin él la
   tarjeta anuncia un premio sin decir dónde se recoge. */
function abrirApariencia() {
  if (typeof showView === "function") showView("settings");
  if (typeof ajusteAbierto !== "undefined") ajusteAbierto = "aspecto";
  if (typeof renderAjustes === "function") renderAjustes();
}
