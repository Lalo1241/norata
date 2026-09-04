/* ================= El idioma =================

   Norata nació escrita en español dentro del código: no hay un archivo de
   textos, hay mil trescientas frases metidas en plantillas de HTML repartidas
   por veinte archivos. Cualquier motor de traducción que empiece por
   «inventemos una clave para cada frase» obliga a tocar esas mil trescientas
   ANTES de poder enseñar nada, y a vivir con que un despiste deje en pantalla
   `ajustes.perfil.titulo` en vez de un rótulo.

   Así que aquí la clave ES la frase en español. `tx("Guardar")` busca
   "Guardar" en el diccionario inglés y, si no está, devuelve "Guardar". Eso
   compra tres cosas que importan más que la elegancia:

   1. **Lo que falta por traducir se ve en español, nunca roto.** Se puede
      publicar a medias sin que nadie se tope con una clave.
   2. **Se migra archivo por archivo.** Hay cinco carpetas de trabajo tocando
      estos mismos archivos a la vez (ver CLAUDE.md); una tanda que reescribe
      veinte archivos de golpe es una tanda que choca con todas.
   3. **El diff se lee.** `tx("Guardar")` al lado de `"Guardar"` se revisa de un
      vistazo; `tx("btn.save")` hay que ir a buscarlo a otro archivo.

   El precio, y hay que saberlo: si alguien corrige una tilde en el español,
   la clave cambia y esa frase vuelve a salir en español hasta que se corrija
   también en el diccionario. Por eso existe el modo auditor —abajo—, que
   justamente lista las frases que se pidieron y no estaban.

   ---- Las tres formas de pedir un texto ----

   | Cuándo | Cómo |
   | --- | --- |
   | Una frase suelta | `tx("Guardar")` |
   | Una frase con datos dentro | `` T`Te quedan ${n} días` `` |
   | Texto que ya está escrito en index.html | nada: `traducirDOM()` lo barre |

   `T` es una plantilla etiquetada: construye la clave sustituyendo cada hueco
   por `{0}`, `{1}`… y vuelve a meter los valores en el orden que pida el
   idioma de destino. Eso es lo que permite que «Te quedan {0} días» pueda
   traducirse a «{0} days left» sin que el orden de las palabras ate nada.

   **`T` es para FRASES, no para bloques de HTML.** Etiquetar una plantilla de
   cuarenta líneas convertiría el bloque entero en una clave, y bastaría con
   mover un `<div>` para que la traducción se cayera. Dentro de un bloque de
   HTML, cada frase se pide por su cuenta.

   ---- Dónde vive la elección ----

   En DOS sitios a la vez, y no es duplicación por descuido:

   - `state.settings.idioma` es el dato: viaja con el respaldo y con la
     sincronía, igual que la moneda y la zona horaria.
   - `localStorage["norata-idioma"]` es el espejo, y existe porque hace falta
     saber el idioma ANTES de que `state` exista: el script de arriba de
     `index.html` pone el `lang` del documento antes de pintar, y la puerta
     (`login/index.html`) no carga los datos de nadie —ahí no hay `state`— y
     aun así tiene que hablar en el idioma correcto.

   Es el mismo trato que ya tienen el modo claro y la barra plegada. */

const IDIOMAS = {
  es: { codigo: "es", nombre: "Español", enIngles: "Spanish", locale: "es-MX", lang: "es" },
  en: { codigo: "en", nombre: "English", enIngles: "English", locale: "en-US", lang: "en" }
};
const IDIOMA_POR_DEFECTO = "es";
const LLAVE_IDIOMA = "norata-idioma";

/* El idioma de ESTE momento, leído del espejo. Se guarda en una variable y no
   se relee del disco en cada llamada porque `tx()` se llama decenas de miles de
   veces por dibujo: el lienzo de talentos solo ya son cientos.

   Y se lee del espejo y no de `state.settings` porque este archivo carga antes
   que `01-base.js`, o sea antes de que `state` exista. `sincronizarIdioma()`
   —abajo— es quien los vuelve a juntar en cuanto los datos están cargados. */
let IDIOMA = (function () {
  try {
    const g = localStorage.getItem(LLAVE_IDIOMA);
    if (IDIOMAS[g]) return g;
  } catch (e) { /* almacenamiento bloqueado: español */ }
  return IDIOMA_POR_DEFECTO;
})();

function idiomaActual() { return IDIOMAS[IDIOMA] ? IDIOMA : IDIOMA_POR_DEFECTO; }

/* El locale para `Intl`, que NO es lo mismo que el idioma. Se usa para las
   fechas, los números y la moneda, y por eso está aquí y no en cada sitio que
   formatea algo: había `"es-MX"` escrito a mano en cinco archivos, y con eso
   la app en inglés seguía diciendo «lunes 3 de septiembre». */
function localeActual() {
  return (IDIOMAS[IDIOMA] || IDIOMAS[IDIOMA_POR_DEFECTO]).locale;
}

/* ---- El diccionario ----
   Un objeto plano por idioma, cargado como un `<script>` normal que declara
   una global. El español no tiene diccionario y no es un olvido: el español
   ES la clave, así que buscarlo sería buscar cada frase para encontrarse a sí
   misma. `tx()` sale antes de mirar nada cuando el idioma es el de origen, y
   eso hace que la app en español no pague absolutamente nada por todo esto. */
function diccionario() {
  if (IDIOMA === "en") return (typeof TEXTOS_EN !== "undefined" && TEXTOS_EN) || null;
  return null;
}

/* ---- El modo auditor ----
   `?i18n=audita` en la dirección y la app apunta cada frase que se pidió y no
   estaba traducida. Se vuelca con `faltantesI18n()` desde la consola.

   Existe porque la pregunta que no sabe contestar un motor donde la clave es
   la frase es «¿cuánto falta?»: no hay una lista de claves contra la que
   comparar. Recorriendo la app con esto encendido, la lista de lo que falta
   la escribe la propia app, y sale ordenada por lo que de verdad se usa —que
   no es lo mismo que lo que hay escrito en los archivos—.

   Va en `sessionStorage` y no en `localStorage`, como las demás pruebas: al
   cerrar la pestaña desaparece y no se queda pegado como si fuera un ajuste
   (ver CLAUDE.md, «Antes de tocar lo que se ve»). */
const _faltan = new Set();
let AUDITA_I18N = false;
try {
  const p = new URLSearchParams(location.search).get("i18n");
  if (p === "audita") sessionStorage.setItem("norata-i18n-audita", "1");
  if (p === "no") sessionStorage.removeItem("norata-i18n-audita");
  AUDITA_I18N = sessionStorage.getItem("norata-i18n-audita") === "1";
} catch (e) { /* sin sessionStorage no hay auditor, y no pasa nada */ }

/* Solo cuenta como frase lo que tiene DOS letras seguidas. El barrido del DOM
   pasa por todos los nodos de texto que hay, y ahí dentro también van cifras,
   flechas y el signo de más de los botones: apuntarlos como «pendientes de
   traducir» ensucia la única lista que dice cuánto falta. */
function tieneLetras(t) {
  return !!t && /[A-Za-zà-ÿ]{2}/.test(t);
}

/* El barrido del DOM NO apunta lo que no encuentra, y esa es la diferencia
   entre una lista de pendientes que sirve y una que no.

   El barrido mira TODOS los nodos de texto del documento, y ahí dentro hay
   tres cosas que no son frases de la app: los datos de quien la usa —una
   habilidad llamada «Dibujo», un proyecto llamado «Portafolio»—, los textos
   que el propio código ya compuso pasando por `T` —«3 de septiembre»— y los
   `title` que se arman al vuelo. Contándolos, `faltantesI18n()` devolvía 75
   pendientes de los que 60 no eran nada: la lista dejaba de decir cuánto falta,
   que es para lo único que existe.

   Lo que sí cuenta es una llamada explícita desde el código, que es donde de
   verdad hay una frase de la app esperando su traducción. */
let _barriendo = false;

function faltantesI18n() {
  const l = Array.from(_faltan).sort();
  console.log(l.length + " frases sin traducir:");
  console.log(JSON.stringify(l, null, 2));
  return l;
}

/* ---- La traducción de una frase ----
   Tolera cualquier cosa: null, un número, un objeto. Devolver la entrada tal
   cual antes que romper una pantalla es la regla de toda la app (ver
   `monedaActual` y `exigenciaActual` en 01-base). */
function tx(txt) {
  if (IDIOMA === IDIOMA_POR_DEFECTO) return txt;
  if (typeof txt !== "string" || !txt) return txt;
  const d = diccionario();
  if (!d) return txt;
  const hit = d[txt];
  if (typeof hit === "string") return hit;
  /* Con espacios alrededor la frase no encuentra su clave, y eso pasa mucho:
     en el HTML las frases vienen sangradas. Se busca la versión recortada y se
     devuelven los espacios, que a veces son los que separan dos trozos. */
  const seco = txt.trim();
  if (seco !== txt && typeof d[seco] === "string") {
    return txt.slice(0, txt.indexOf(seco[0])) + d[seco] + txt.slice(txt.indexOf(seco[0]) + seco.length);
  }
  if (AUDITA_I18N && !_barriendo && tieneLetras(seco)) _faltan.add(seco);
  return txt;
}

/* ---- La traducción de una frase con datos dentro ----
   Se usa como plantilla etiquetada:  T`Te quedan ${n} días`

   La clave que se busca es «Te quedan {0} días», así que el diccionario puede
   reordenar los huecos —«{0} days left»— sin que aquí haya que saber nada del
   idioma de destino. Un hueco que el diccionario se deje fuera desaparece del
   texto, que es lo correcto: si la frase inglesa no necesita ese dato, no lo
   enseña.

   Los valores se meten TAL CUAL, sin escapar. Es lo mismo que hacía la
   plantilla sin etiquetar, así que quien escapaba antes sigue escapando ahora
   y quien no, tampoco — no cambia el trato que ya tenía cada sitio. */
function T(partes, ...valores) {
  const crudo = partes.reduce((s, p, i) => s + p + (i < valores.length ? valores[i] : ""), "");
  if (IDIOMA === IDIOMA_POR_DEFECTO) return crudo;
  const d = diccionario();
  if (!d) return crudo;
  const clave = partes.reduce((s, p, i) => s + p + (i < valores.length ? "{" + i + "}" : ""), "");
  const hit = d[clave] || d[clave.trim()];
  if (typeof hit !== "string") {
    if (AUDITA_I18N && !_barriendo && tieneLetras(clave.trim())) _faltan.add(clave.trim());
    return crudo;
  }
  return hit.replace(/\{(\d+)\}/g, (m, i) => {
    const v = valores[Number(i)];
    return v === undefined || v === null ? "" : v;
  });
}

/* ================= El barrido del HTML escrito a mano =================

   `index.html` y `login/index.html` traen unas setenta frases escritas
   directamente en el marcado: los títulos de las secciones de Ajustes, los
   rótulos de los campos, las notas de debajo. Envolverlas una por una pedía
   inventar un atributo y tocar setenta líneas de un archivo que todas las
   sesiones editan.

   En vez de eso se barren de una pasada al arrancar. Aquí sí se puede hacer
   sin miedo —y en el HTML que dibuja el JavaScript no— por una razón concreta:
   **cuando esto corre, en el documento no hay ni un dato de nadie.** Todo lo
   que se ve entonces lo escribió esta casa. Un barrido general sobre la app ya
   dibujada podría toparse con una habilidad que alguien llamó «Guardar» y
   traducírsela.

   El original se guarda en `data-es` la primera vez, y por eso volver al
   español no necesita recargar: se relee de ahí. Sin ese guardado, el primer
   cambio de idioma se comería el español para siempre.

   Se barren también tres atributos, que son los que llevan texto a la vista:
   `placeholder`, `title` y `aria-label`. */
const ATRIBUTOS_CON_TEXTO = ["placeholder", "title", "aria-label"];

/* ---- Y el detalle que hace que esto no se rompa: DOS memorias ----

   Con una sola —guardar el español y volver a él— el barrido se rompe en
   cuanto el JavaScript escribe encima de un nodo que ya estaba en el HTML, y
   eso pasa de verdad: `#p-cost-lbl` nace diciendo «Costo (MXN)» y
   `js/08-formularios.js` lo reescribe con la moneda que toque. Al cambiar de
   idioma, el barrido habría restaurado el «Costo (MXN)» del arranque y
   borrado lo que el formulario había puesto.

   Por eso se guardan dos cosas: el original y lo que dejamos escrito. Si al
   volver a pasar el nodo no contiene ninguna de las dos, es que lo cambió
   alguien más —y entonces ESO es el original nuevo—. Con eso, el barrido
   convive con cualquier código que escriba en el documento sin tener que
   saber cuál es. */
function _traducirRanura(leer, escribir, dsOrig, dsPuesto, guardar) {
  const ahora = leer();
  const orig = dsOrig();
  const puesto = dsPuesto();
  /* Primera vez, o alguien de fuera lo cambió: lo que hay ahora es el
     original a partir de aquí. */
  const base = (orig === undefined || (ahora !== orig && ahora !== puesto)) ? ahora : orig;
  const nuevo = tx(base);
  guardar(base, nuevo);
  if (nuevo !== ahora) escribir(nuevo);
}

/* Mientras la app esté en español y nunca haya salido de ahí, el barrido no
   tiene nada que hacer: `tx()` devuelve la entrada tal cual, así que recorrer
   dos mil nodos para escribir lo mismo que ya había es trabajo puro. Y no es
   solo el tiempo —que es poco—: sin esto, la app en español amanece con
   doscientos `data-es` en el marcado que no le sirven a nadie.

   La bandera no se puede quitar: en cuanto se ha traducido una vez, volver al
   español necesita el barrido para RESTAURAR. Sin ella, «volver a Español»
   dejaba la pantalla en inglés. */
let _yaTraducido = false;

function traducirDOM(raiz) {
  const base = raiz || document.body;
  if (!base) return;
  if (IDIOMA === IDIOMA_POR_DEFECTO && !_yaTraducido) return;
  if (IDIOMA !== IDIOMA_POR_DEFECTO) _yaTraducido = true;
  _barriendo = true;
  try { _traducirTodo(base); } finally { _barriendo = false; }
}

function _traducirTodo(base) {

  /* Los nodos de texto, uno por uno y no `textContent` del padre: un
     `<p>Elige <b>una</b> opción</p>` son tres nodos y tres frases; pisar el
     `textContent` del párrafo se llevaría por delante la negrita. */
  const it = document.createTreeWalker(base, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      /* Dentro de un <script> o un <style> no hay texto para nadie: hay
         código. Traducirlo rompería la página. */
      const p = n.parentNode;
      if (!p || p.nodeType !== 1) return NodeFilter.FILTER_REJECT;
      const tag = p.nodeName;
      if (tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA") return NodeFilter.FILTER_REJECT;
      return n.nodeValue && n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  const nodos = [];
  for (let n = it.nextNode(); n; n = it.nextNode()) nodos.push(n);

  nodos.forEach(n => {
    const p = n.parentElement;
    if (!p) return;
    /* Las dos memorias viven en el ELEMENTO y no en el nodo de texto, porque
       un nodo de texto no admite atributos. Cuando un elemento tiene varios
       hijos de texto se numeran; en la práctica casi siempre es uno. */
    const i = Array.prototype.indexOf.call(p.childNodes, n);
    const kO = "es" + (i ? i : ""), kP = "tr" + (i ? i : "");
    _traducirRanura(
      () => n.nodeValue,
      (v) => { n.nodeValue = v; },
      () => p.dataset[kO],
      () => p.dataset[kP],
      (orig, puesto) => { p.dataset[kO] = orig; p.dataset[kP] = puesto; }
    );
  });

  const conAtributo = base.querySelectorAll("[placeholder],[title],[aria-label]");
  const todos = base.matches && base.matches("[placeholder],[title],[aria-label]")
    ? [base].concat(Array.prototype.slice.call(conAtributo)) : Array.prototype.slice.call(conAtributo);
  todos.forEach(el => {
    ATRIBUTOS_CON_TEXTO.forEach(a => {
      if (!el.hasAttribute(a)) return;
      const camel = a.replace(/-(\w)/g, (m, c) => c.toUpperCase()).replace(/^\w/, c => c.toUpperCase());
      const kO = "es" + camel, kP = "tr" + camel;
      _traducirRanura(
        () => el.getAttribute(a),
        (v) => el.setAttribute(a, v),
        () => el.dataset[kO],
        () => el.dataset[kP],
        (orig, puesto) => { el.dataset[kO] = orig; el.dataset[kP] = puesto; }
      );
    });
  });
}

/* ================= Cambiar de idioma =================

   Escribe en los dos sitios —el dato y el espejo—, cambia el `lang` del
   documento y vuelve a dibujar. No recarga la página a propósito: recargar
   con datos sin sincronizar es justo el momento en que se pierden, y además
   un parpadeo de dos segundos convierte un ajuste en un trámite.

   El `lang` del documento no es decoración: es lo que hace que el lector de
   pantalla lea «day» en inglés y no «dai», y lo que decide con qué reglas
   corta las palabras el navegador. */
function ponerIdioma(cod, callback) {
  if (!IDIOMAS[cod] || cod === IDIOMA) return false;
  IDIOMA = cod;
  try { localStorage.setItem(LLAVE_IDIOMA, cod); } catch (e) { /* modo privado */ }
  if (typeof state !== "undefined" && state && state.settings) {
    state.settings.idioma = cod;
    if (typeof save === "function") save();
  }
  document.documentElement.setAttribute("lang", IDIOMAS[cod].lang);
  traducirDOM();
  /* Y se vuelve a DIBUJAR la pantalla que se esté viendo. El barrido solo
     sabe restaurar lo que escribió esta casa en `index.html`; lo que dibujó el
     JavaScript no puede recuperarlo, y con razón: cuando el JavaScript
     reescribe un nodo, el barrido toma ese texto como el original nuevo —es lo
     que le permite convivir con código que escribe encima— así que al volver
     al español restauraría el inglés.

     Se vio yendo de inglés a español con Ajustes abierto: los rótulos de las
     secciones se quedaban en inglés y el sol/luna de al lado en español, en la
     misma pantalla. Redibujar lo arregla entero, y va aquí y no en cada quien
     llama: una función que deja la pantalla a medias y confía en que el de
     fuera se acuerde de terminarla es una función que un día no se termina. */
  if (typeof showView === "function" && typeof activeMainView !== "undefined") {
    try { showView(activeMainView || "summary"); } catch (e) { /* aún sin app */ }
  }
  if (typeof callback === "function") callback();
  return true;
}

/* Junta el dato y el espejo cuando los datos ya están cargados. Se llama desde
   el arranque, y hace falta porque los dos pueden discrepar en dos casos
   reales: al entrar en un aparato nuevo con la cuenta ya sincronizada —donde
   el dato manda y el espejo no existe— y al importar un respaldo hecho en
   otro idioma.

   **Manda el dato**, no el espejo: el espejo es de este navegador y el dato es
   de esta persona. */
function sincronizarIdioma() {
  if (typeof state === "undefined" || !state || !state.settings) return;
  const guardado = state.settings.idioma;
  if (IDIOMAS[guardado] && guardado !== IDIOMA) {
    IDIOMA = guardado;
    try { localStorage.setItem(LLAVE_IDIOMA, guardado); } catch (e) {}
    document.documentElement.setAttribute("lang", IDIOMAS[guardado].lang);
  } else if (!IDIOMAS[guardado]) {
    state.settings.idioma = IDIOMA;
  }
  traducirDOM();
}

/* ================= Los meses y los días =================

   Estaban escritos a mano en cinco sitios —`MESES` en `10g-informe.js`,
   `MESES_CORTOS` en `10e-panel.js`, y tres copias distintas de las letras de
   la semana—, y en español. En inglés eso deja «SEPTIEMBRE 2026» encima del
   calendario y «D L M M J V S» debajo.

   No se traducen con el diccionario: los da `Intl`, que ya sabe los doce
   nombres y las siete letras de cualquier idioma. Meter doce entradas por
   idioma en el diccionario sería copiar a mano algo que el navegador ya trae,
   y además equivocarse: en inglés los meses van con mayúscula y en español no,
   y esa clase de detalle es justo lo que `Intl` acierta y una lista no.

   La fecha se construye en UTC y se lee en UTC a propósito. Con la hora local,
   `new Date(2026, 0, 1)` en una zona al este de Greenwich puede caer en el 31
   de diciembre y devolver «diciembre» para enero. Aquí no se está fechando
   nada: solo se está pidiendo un nombre. */
function nombreDeMes(n, largo) {
  try {
    return new Date(Date.UTC(2021, (n - 1) % 12, 1))
      .toLocaleDateString(localeActual(), { month: largo === false ? "short" : "long", timeZone: "UTC" });
  } catch (e) { return String(n); }
}

/* Las siete letras, empezando en domingo —que es como dibuja el calendario de
   la racha—. El 3 de enero de 2021 fue domingo.

   Se corta a la primera letra a mano y no se pide `weekday: "narrow"` porque
   en español eso devuelve «L M X J V S D»: la equis del miércoles, que es
   correcta pero no es la que Norata ha usado siempre. Cortando de «miércoles»
   sale la M de siempre, y en inglés sale la S T W T F S S que allá es la
   normal. */
function letrasDeSemana() {
  const out = [];
  for (let i = 0; i < 7; i++) {
    try {
      const d = new Date(Date.UTC(2021, 0, 3 + i))
        .toLocaleDateString(localeActual(), { weekday: "long", timeZone: "UTC" });
      out.push(d.charAt(0).toUpperCase());
    } catch (e) { out.push("?"); }
  }
  return out;
}

/* Las dos primeras letras, para cuando una sola no distingue —martes y
   miércoles en español, Tuesday y Thursday en inglés—. */
function nombreDeDia(i) {
  try {
    const d = new Date(Date.UTC(2021, 0, 3 + i))
      .toLocaleDateString(localeActual(), { weekday: "long", timeZone: "UTC" });
    return d.charAt(0).toUpperCase() + d.charAt(1);
  } catch (e) { return "?"; }
}

/* ================= Los discos =================

   Un círculo del tamaño de una moneda con su símbolo dentro. Los dos van en
   círculo —en la primera pantalla se ven una lista debajo de la otra y dos
   formas distintas las harían parecer cosas sin relación— pero **la moneda va
   MACIZA y el idioma va en ARO**, y esa diferencia dice algo verdadero: una
   moneda es una pieza, un idioma es una etiqueta.

   Y además resuelve un número. Medidos los ocho colores del usuario con tinta
   oscura encima, siete pasan el 4,5 que pide un texto en los dos modos y uno
   no: **el lila da 3,67 de día**. En aro no hay tinta oscura —las letras van
   en `tinta()`, que se hunde sola sobre papel— así que el problema desaparece
   en vez de esquivarse cambiando de color.

   ---- Por qué un disco y no una bandera ----

   Lo pidió Eduardo después de ver las banderas puestas, y tiene razón por dos
   motivos que la bandera no resolvía:

   1. **Una bandera es un país, y una moneda no lo es.** El euro no es de
      ningún país —por eso la bandera europea era ya un apaño— y el dólar lo
      usan una veintena. Es el mismo problema por el que el idioma nunca llevó
      bandera, y estaba igual de presente aquí.
   2. **A dieciocho píxeles una bandera es un borrón y un símbolo no.** El $ y
      el € se leen a cualquier tamaño, porque para eso los inventaron.

   ---- Por qué cada uno lleva su propio color ----

   Por dos cosas, y la primera es que **el peso y el dólar comparten símbolo**.
   Con el mismo disco verde, dos de las tres monedas serían idénticas salvo por
   el nombre escrito al lado — que es justo el problema que `money()` resuelve
   escribiendo siempre el código detrás del importe.

   Y la segunda: los dos idiomas estaban en menta y la pantalla se veía de un
   solo color. Lo paró Eduardo mirándola.

   Los cinco salen de los OCHO COLORES DEL USUARIO (`--paleta-1` … `--paleta-8`)
   y no de los acentos de la casa, y eso importa: los acentos tienen
   significado —la menta es lo que sale bien, el coral lo que destruye, la
   luciérnaga lo que avisa— y ni una moneda ni un idioma son ninguna de esas
   cosas. Los ocho del usuario son identidad sin significado, que es
   exactamente lo que hace falta. Tampoco se repite ninguno: en la primera
   pantalla se ven los cinco a la vez.

   Ninguno es la menta, y también a propósito: la opción elegida se marca con
   menta, y un disco menta dentro de una pastilla menta vuelve a dejar la
   pantalla de un solo color — que es de lo que veníamos. */
const MONEDA_COLOR = {
  MXN: "#8fd18a",   /* verde   — el peso, y el verde del billete */
  USD: "#f5d76e",   /* oro     — el otro $, y por eso no puede ser verde */
  EUR: "#6fc3e8"    /* celeste — el azul de la Unión, sin la bandera */
};
const MONEDA_SIMBOLO = { MXN: "$", USD: "$", EUR: "€" };

/* No hay nada de nacional en los dos del idioma, y no puede haberlo: por eso
   el idioma no lleva bandera. Son dos etiquetas, y su único trabajo es no
   parecerse entre ellas ni a ninguna moneda. */
const IDIOMA_COLOR = { es: "#b7a2ea", en: "#f0a5c0" };

/* El símbolo va en un `<text>` de SVG y no en un trazado dibujado a mano: el $
   y el € los tiene cualquier tipografía, así que dibujarlos sería copiar peor
   algo que ya está hecho — y además se queda con la letra de la app, que es lo
   que hace que el disco pertenezca a esta pantalla y no parezca pegado de otra
   parte.

   Los dos ayudantes de abajo son los tres papeles de la paleta puestos donde
   toca (ver `pinta`, `tinta` y `trazo` en `js/01-base.js`):

     macizo   `pinta()` para el relleno + `--sobre-vivo` para la tinta — sobre
              un relleno macizo la tinta va OSCURA en los DOS modos, porque los
              ocho tonos del usuario son claros de día y de noche
     aro      `trazo()` para la línea —que pide 3 y no 4,5, porque es un
              dibujo— y `tinta()` para las letras, que sí son texto */
function discoMacizo(simbolo, color, tam) {
  const s = tam || 26;
  if (!simbolo || !color) return "";
  return `<svg class="dsc" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" aria-hidden="true">
    <circle cx="${s / 2}" cy="${s / 2}" r="${s / 2}" fill="${pinta(color)}"/>
    <text x="${s / 2}" y="${s / 2}" fill="var(--sobre-vivo)" font-size="${(s * 0.62).toFixed(1)}"
      font-weight="700" text-anchor="middle" dominant-baseline="central"
      font-family="inherit">${simbolo}</text>
  </svg>`;
}

/* El aro va por dentro del borde (`r = s/2 - 1`) y no encima: centrado en el
   borde, la mitad de sus dos píxeles se sale del `viewBox` y se corta. */
function discoAro(texto, color, tam) {
  const s = tam || 26;
  if (!texto || !color) return "";
  return `<svg class="dsc" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" aria-hidden="true">
    <circle cx="${s / 2}" cy="${s / 2}" r="${s / 2 - 1}" fill="none"
      stroke="${trazo(color)}" stroke-width="2"/>
    <text x="${s / 2}" y="${s / 2}" fill="${tinta(color)}" font-size="${(s * 0.4).toFixed(1)}"
      font-weight="700" letter-spacing="0.3" text-anchor="middle" dominant-baseline="central"
      font-family="inherit">${texto}</text>
  </svg>`;
}

function discoMoneda(cod, tam) {
  return discoMacizo(MONEDA_SIMBOLO[cod], MONEDA_COLOR[cod], tam);
}

function discoIdioma(cod, tam) {
  return discoAro(String(cod).toUpperCase(), IDIOMA_COLOR[cod], tam);
}
