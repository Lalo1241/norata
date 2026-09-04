/* ================= Idioma y moneda =================

   Las dos preguntas que no son de gusto sino de comprensión: en qué idioma
   habla la app y con qué dinero cuenta. Van juntas en un archivo porque se
   contestan juntas —en la misma pantalla de la primera vez— y porque las dos
   se cambian después en el mismo sitio de Ajustes.

   ---- Por qué se preguntan ANTES de las tres preguntas ----

   El asistente de bienvenida son tres preguntas que arman un tablero, y se
   puede saltar: la pantalla vacía ofrece tres caminos y solo uno pasa por
   ahí. Si el idioma fuera una cuarta pregunta del asistente, quien elige
   «Empezar de cero» o «Ver un ejemplo» se quedaría en español sin que nadie
   le preguntara — y son justo los dos caminos de quien tiene prisa.

   Así que esto es una pantalla propia, antes de todo, y sale UNA vez: en un
   perfil recién nacido y sin nada dentro. Quien ya tiene datos no la ve nunca
   (ver `regionLista` en la normalización de `js/01-base.js`): ya eligió, por
   omisión, el día que empezó a usarla en español.

   ---- Por qué la moneda pregunta dos veces ----

   Cambiar de idioma no puede estropear nada: se vuelve a tocar el botón y ya.
   Cambiar de moneda reescribe importes que alguien escribió a mano, así que
   pide una confirmación con el tipo de cambio delante y guarda una copia
   antes. En la pantalla de la primera vez no pregunta nada, porque no hay
   nada que convertir. */

/* ---- Los botones de elegir ----
   Reusan `.ob-pace` y `.ob-pace-opt`, que son los del ritmo del asistente. No
   es pereza: son exactamente la misma cosa —una lista corta de opciones
   excluyentes con icono, nombre y una línea de explicación— y tener dos
   maquetaciones para lo mismo es lo que hace que dentro de un año una de las
   dos se quede sin arreglar.

   Cada opción lleva su propio color, y ninguno es la menta. Con todos en menta
   —que es como estaban— la pantalla se veía de un solo color y las opciones se
   distinguían solo por el texto; lo paró Eduardo mirándolo. El idioma va con
   dos letras y la moneda con el disco de su símbolo: el porqué de las dos
   cosas está en `discoMoneda()` (`js/00-idioma.js`). */

function opcionesIdiomaHTML(sel, accion) {
  return `<div class="ob-pace">${Object.values(IDIOMAS).map(i => `
    <button class="ob-pace-opt ${sel === i.codigo ? "on" : ""}" onclick="${accion}('${i.codigo}')">
      <span class="op-ic rg-disco">${discoIdioma(i.codigo, 26)}</span>
      <span class="op-tx"><b>${escapeHtml(i.nombre)}</b><span>${escapeHtml(muestraDeFecha(i.locale))}</span></span>
    </button>`).join("")}</div>`;
}

/* ---- La línea de debajo de cada opción: una muestra, no una etiqueta ----
   Empezó diciendo el nombre del idioma otra vez —«English / English»— y eso
   no es una explicación, es un eco. Lo que de verdad se está eligiendo, y lo
   que nadie sabe hasta que lo ve, es el FORMATO: si las fechas van a decir
   «3 de septiembre» o «September 3», y si un importe va a salir «$1,890» o
   «1.890 €». Así que la línea pequeña enseña justo eso.

   La fecha es la de hoy y no una inventada: se reconoce de un vistazo, que es
   lo que hace que se lea como una muestra y no como un dato más. */
function muestraDeFecha(locale) {
  try {
    return new Date().toLocaleDateString(locale, { day: "numeric", month: "long" });
  } catch (e) { return ""; }
}

/* En la muestra de la moneda va el importe SIN el código detrás, que es la
   única vez en toda la app en que se escribe así. La regla de `money()` —el
   código siempre, porque el signo $ lo usan media docena de países— existe
   para desambiguar, y aquí no hay nada que desambiguar: el nombre de la
   moneda está escrito justo encima. Con el código puesto salía «Euro / 1.890
   € EUR», que se lee como un error. */
function opcionesMonedaHTML(sel, accion) {
  return `<div class="ob-pace">${Object.values(MONEDAS).map(m => {
    const nombre = idiomaActual() === "en" ? m.enIngles : m.nombre;
    return `
    <button class="ob-pace-opt ${sel === m.codigo ? "on" : ""}" onclick="${accion}('${m.codigo}')">
      <span class="op-ic rg-disco">${discoMoneda(m.codigo, 26)}</span>
      <span class="op-tx"><b>${escapeHtml(nombre)}</b><span>${escapeHtml(
        formateadorMoneda(m.codigo).format(1890))}</span></span>
    </button>`;
  }).join("")}</div>`;
}

/* ================= Ajustes · Mi perfil ================= */

function renderPanelIdioma() {
  const wrap = document.getElementById("idioma-opciones");
  if (!wrap) return;
  wrap.innerHTML = opcionesIdiomaHTML(idiomaActual(), "elegirIdiomaAjustes");
}

/* Cambiar el idioma repinta la app entera desde aquí y no recarga la página.
   Recargar con cambios sin sincronizar es justo el momento en el que se
   pierden, y además convierte un ajuste de un toque en una espera.

   Se repinta TODO y no solo Ajustes: el menú de la izquierda, el saludo del
   Resumen y los rótulos de las pestañas están escritos y ya no se vuelven a
   tocar solos. `showView` de la vista activa es lo que hace ese trabajo en el
   resto de la app (ver `REDIBUJA_AL_CRUZAR` en `js/11-arranque.js`). */
function elegirIdiomaAjustes(cod) {
  if (!ponerIdioma(cod)) return;
  aplicarModulos();
  renderAjustes();
  renderPanelIdioma();
  renderPanelMoneda();
  toast(tx("Listo, la app ya está en este idioma"), "ok");
}

function renderPanelMoneda() {
  const wrap = document.getElementById("moneda-opciones");
  if (!wrap) return;
  wrap.innerHTML = opcionesMonedaHTML(monedaActual(), "elegirMonedaAjustes");
  const zona = document.getElementById("moneda-cambio");
  if (zona) zona.innerHTML = "";
}

/* Cuántos importes hay guardados. Decide si hay que preguntar por el tipo de
   cambio o si el cambio de moneda es un trámite de un toque: sin ningún
   talento con precio, convertir es multiplicar cero cosas, y sacar un
   formulario de tipos de cambio para eso es hacerle perder el tiempo a
   alguien que además acaba de empezar.

   Cuenta CAMPOS y no talentos, y por eso no es `filter(...).length`: un
   talento comprado tiene dos importes —lo que costó y lo que llevas puesto—
   y `convertirImportes` toca los dos. Contando talentos, el aviso prometía
   reescribir 2 y el mensaje del final decía 3. Dos formas de contar lo mismo
   es como se pierde la confianza en un número. */
function cuantosImportes() {
  return (state.perks || []).reduce((n, p) =>
    n + (p.cost > 0 ? 1 : 0) + (p.investedTotal > 0 ? 1 : 0), 0);
}

function elegirMonedaAjustes(cod) {
  if (!MONEDAS[cod] || cod === monedaActual()) return;
  if (!cuantosImportes()) {
    state.settings.moneda = cod;
    save();
    renderPanelMoneda();
    showView(activeMainView || "summary");
    toast(tx("Listo, tu moneda ahora es") + " " + cod, "ok");
    return;
  }
  pedirCambioDeMoneda(cod);
}

/* ================= El cambio del día =================

   La tabla de `js/01-base.js` es la red de abajo; esto es la fuente. Se le
   pide a la función `cambio` de Supabase, que consulta un servicio de divisas
   y guarda lo último bueno (ver `supabase/functions/cambio/index.ts`).

   Tres cosas que hacen que esto no pueda estropear nada:

   1. **No se pide al arrancar.** Se pide al abrir el selector de moneda, que
      es el único instante en que el número importa. La app sigue abriendo de
      su propia copia sin tocar la red.
   2. **No se espera a que llegue.** La pantalla se pinta al momento con la
      tabla del código, y el número se sustituye si la respuesta llega. Una
      pantalla que tarda dos segundos en aparecer porque hay una petición
      detrás es peor que un número que se refina solo.
   3. **Nunca pisa lo que alguien escribió.** Si la respuesta llega tarde y
      para entonces ya tocaste el campo, se queda lo tuyo. Ver `tasaTocada`.

   Se guarda para toda la sesión: abrir y cerrar el selector tres veces no son
   tres viajes.

   Y lo que se guarda es la PROMESA, no el resultado. Guardando el resultado,
   dos aperturas seguidas —que es lo normal: se abre el selector, se cierra
   con Cancelar, se vuelve a abrir— disparan dos viajes, porque el segundo
   empieza antes de que el primero haya terminado de contestar. Se vio en la
   traza de la prueba: dos peticiones para una sola pantalla. Con la promesa,
   el segundo se cuelga del primero y solo sale un viaje. */
let _cambioServidor = null;   // null = nadie ha preguntado; una promesa a partir de ahí

function traerCambioDelServidor() {
  if (_cambioServidor === null) _cambioServidor = pedirCambioAlServidor();
  return _cambioServidor;
}

async function pedirCambioAlServidor() {
  try {
    /* Con tope, y corto: es un adorno que mejora un número que ya está
       puesto. Pasados cuatro segundos, lo que hay en pantalla es lo bueno. */
    const ctl = new AbortController();
    const corte = setTimeout(() => ctl.abort(), 4000);
    const res = await fetch(SB_URL + "/functions/v1/cambio", {
      headers: { "apikey": SB_KEY },
      signal: ctl.signal
    });
    clearTimeout(corte);
    const b = await res.json().catch(() => null);
    /* Se comprueba lo que llega antes de creérselo. Es lo mismo que hace la
       función en el servidor, y se repite aquí a propósito: este número
       multiplica los importes guardados de quien lo use, así que no hay
       ningún sitio de la cadena donde valga la pena confiar sin mirar. */
    if (!res.ok || !b || !b.tasas || b.tasas.MXN !== 1) return null;
    const malo = Object.keys(MONEDAS).some(c => {
      const v = b.tasas[c];
      return typeof v !== "number" || !isFinite(v) || v <= 0 || v > 1000;
    });
    if (malo) return null;
    return b;
  } catch (e) {
    /* Sin red, sin función desplegada o tardó demasiado: la tabla del código
       ya está en pantalla y dice de cuándo es. */
    return null;
  }
}

/* La fecha del cambio, escrita como la escribe una persona. Llega del
   servidor en «2026-09-03» —que es lo correcto para viajar— y esa forma no se
   le enseña a nadie: en una frase, un número con guiones se lee como un
   código y no como un día.

   Se parte a mano en vez de `new Date(iso)`: un ISO sin hora lo interpreta el
   navegador como medianoche UTC, y en México eso es el día anterior. El
   cambio del 3 salía como el 2. */
function fechaDelCambio(iso) {
  const p = String(iso || "").split("-");
  if (p.length !== 3) return String(iso || "");
  try {
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]))
      .toLocaleDateString(localeActual(), { day: "numeric", month: "long" });
  } catch (e) { return String(iso); }
}

/* Cuántas unidades de `a` vale una de `de`, con lo que dijo el servidor. Es
   `tipoDeCambio()` pero leyendo de otra tabla; se hacen las dos divisiones
   igual porque el rodeo por el peso es el mismo. */
function tipoDeCambioServidor(cambio, de, a) {
  const d = cambio.tasas[de], h = cambio.tasas[a];
  if (!d || !h) return 0;
  return d / h;
}

/* ---- La confirmación, y por qué va dentro del panel y no en una ventana ----
   Hace falta un campo de texto —el tipo de cambio se puede corregir— y el
   cuadro de confirmar de la casa (`ask`) devuelve sí o no, no un número.
   Podría hacerse con `askHTML`, pero entonces habría que leer el valor de un
   campo que vive dentro de una ventana que se cierra sola, y eso es
   exactamente donde se pierden los datos escritos.

   Abriéndose debajo de los botones se ve a la vez lo que se eligió y lo que
   va a pasar, que es lo que una ventana encima tapa. */
function pedirCambioDeMoneda(cod) {
  const de = monedaActual();
  const zona = document.getElementById("moneda-cambio");
  if (!zona) return;
  const tasa = tipoDeCambio(de, cod);
  const cuantos = cuantosImportes();

  /* Cuatro decimales y no dos: de peso a euro la tasa es 0,0459, y con dos se
     quedaría en 0,05 — un nueve por ciento de más en cada importe. */
  const tasaTxt = tasa < 1 ? tasa.toFixed(4) : tasa.toFixed(2);

  zona.innerHTML = `
    <div class="rg-cambio">
      <h4>${escapeHtml(T`Pasar de ${de} a ${cod}`)}</h4>
      <p class="settings-note">${escapeHtml(T`Voy a reescribir ${cuantos} ${
        cuantos === 1 ? tx("importe guardado") : tx("importes guardados")
      } con este tipo de cambio. Antes guardo una copia completa, y la puedes restaurar desde Mi almacenamiento.`)}</p>
      <label class="field">
        <span>${escapeHtml(T`Cuántos ${cod} vale un ${de}`)}</span>
        <input type="number" id="rg-tasa" step="0.0001" min="0.0001" value="${tasaTxt}"
               oninput="tasaTocada = true; previsualizarCambio('${de}','${cod}')">
        <div class="field-hint" id="rg-fuente">${escapeHtml(T`Es una referencia de ${tx(CAMBIO_FECHA)}. Si sabes el tuyo, escríbelo.`)}</div>
      </label>
      <div class="rg-muestra" id="rg-muestra"></div>
      <div class="stack" style="margin-top:14px">
        <button class="btn btn-aviso btn-block" onclick="aplicarCambioDeMoneda('${cod}')">${
          escapeHtml(T`Convertir mis importes a ${cod}`)}</button>
        <button class="btn btn-ghost btn-block" onclick="renderPanelMoneda()">${escapeHtml(tx("Cancelar"))}</button>
      </div>
    </div>`;
  tasaTocada = false;
  previsualizarCambio(de, cod);
  refinarConElServidor(de, cod);
}

/* Si alguien ya escribió su propio cambio, lo del servidor no entra. Es la
   diferencia entre una ayuda y una interrupción: nada se siente peor que
   escribir un número y ver cómo se cambia solo medio segundo después. */
let tasaTocada = false;

async function refinarConElServidor(de, a) {
  const cambio = await traerCambioDelServidor();
  const campo = document.getElementById("rg-tasa");
  const pista = document.getElementById("rg-fuente");
  /* El panel pudo cerrarse, o pudo abrirse otro para otra moneda, mientras
     esto viajaba. Sin esta comprobación, la respuesta de un panel que ya no
     existe escribiría en el que sí. */
  if (!cambio || !campo || !pista || tasaTocada) return;
  const tasa = tipoDeCambioServidor(cambio, de, a);
  if (!(tasa > 0)) return;
  campo.value = tasa < 1 ? tasa.toFixed(4) : tasa.toFixed(2);
  /* Se dice de cuándo es y de dónde salió. Un número sin procedencia no se
     puede juzgar, y este es justo el que hay que poder juzgar: quien vea una
     fecha de hace tres semanas sabrá que le conviene escribir el suyo. */
  const dia = fechaDelCambio(cambio.fecha);
  pista.textContent = cambio.fresco
    ? T`Cambio del ${dia}, según ${cambio.fuente}. Puedes escribir el tuyo.`
    : T`Último cambio que pude conseguir, del ${dia}. Puedes escribir el tuyo.`;
  previsualizarCambio(de, a);
}

/* La muestra con un importe DE VERDAD, el del primer talento que tenga
   precio, y no con un número inventado: «$1,890 → $102 USD» no dice nada
   hasta que uno de los dos números es tuyo. Es lo que convierte una tasa
   abstracta en «ah, sí, eso costó». */
function previsualizarCambio(de, a) {
  const el = document.getElementById("rg-muestra");
  const campo = document.getElementById("rg-tasa");
  if (!el || !campo) return;
  const tasa = Number(campo.value);
  if (!(tasa > 0)) { el.innerHTML = `<span class="rg-mal">${escapeHtml(tx("Escribe un tipo de cambio mayor que cero."))}</span>`; return; }
  const ejemplo = (state.perks || []).find(p => p.cost > 0);
  const antes = ejemplo ? ejemplo.cost : 1890;
  const despues = Math.max(1, Math.round(antes * tasa));
  el.innerHTML = `<b>${escapeHtml(formateadorMoneda(de).format(antes) + " " + de)}</b>` +
    `<span class="rg-flecha" aria-hidden="true">→</span>` +
    `<b>${escapeHtml(formateadorMoneda(a).format(despues) + " " + a)}</b>`;
}

/* La copia va ANTES de tocar nada y con el estado tal cual está en memoria.
   Usa la máquina de copias de la sincronía (`stashConflict`), que ya sabe
   podar las viejas y ya se enseña en Ajustes con su botón de restaurar: una
   segunda máquina de copias para esto sería un segundo sitio donde mirar
   cuando algo salga mal. */
function aplicarCambioDeMoneda(cod) {
  const campo = document.getElementById("rg-tasa");
  const tasa = campo ? Number(campo.value) : 0;
  if (!(tasa > 0)) { toast(tx("Escribe un tipo de cambio mayor que cero."), "atencion"); return; }

  stashConflict("moneda", JSON.parse(JSON.stringify(state)));
  const tocados = convertirImportes(tasa);
  state.settings.moneda = cod;
  save();
  renderPanelMoneda();
  showView(activeMainView || "summary");
  toast(T`Listo: ${tocados} ${tocados === 1 ? tx("importe convertido") : tx("importes convertidos")} a ${cod}`, "ok");
}

/* ================= La pantalla de la primera vez =================

   Un perfil recién nacido, antes de nada. No se puede cerrar sin contestar, y
   no hace falta: las dos preguntas nacen contestadas —español y pesos, que es
   lo que la app era hasta ahora— así que el botón de seguir siempre funciona.
   Quien no quiera decidir, no decide, y sigue.

   No es una ventana modal de las de `ask`: es una capa propia, como la
   portada, porque llega antes de que haya app detrás que valga la pena mirar.
   Va en `--piso-region`, justo debajo de la portada — quien todavía no entró
   no puede estar aquí, y quien está aquí sí puede recibir un aviso encima. */

function regionHaceFalta() {
  return !!state && !!state.settings && !state.settings.regionLista;
}

function mostrarPantallaRegion() {
  if (document.getElementById("region")) return;
  const caja = document.createElement("div");
  caja.id = "region";
  caja.className = "region-capa";
  document.body.appendChild(caja);
  pintarPantallaRegion();
}

function pintarPantallaRegion() {
  const caja = document.getElementById("region");
  if (!caja) return;
  /* El logo del menú, que ya está dibujado. Si por lo que sea no estuviera,
     el compás: esta pantalla no se puede quedar sin cabecera. */
  const marca = typeof logoNorata === "function" ? logoNorata() : "";
  caja.innerHTML = `
    <div class="region-card">
      ${/* Esta pantalla es lo PRIMERO que ve alguien que abre Norata, antes
            que el tablero y antes que el tutorial. Salía con un compás
            genérico y dos preguntas frías: sin decir dónde estabas, sin
            saludar y sin explicar por qué se te pregunta eso. Lo paró Eduardo
            en cuanto la vio en su sitio.

            Así que recibe: el logo presenta la app, una línea dice qué es y
            otra dice para qué son las dos preguntas. El saludo es distinto al
            del tutorial —«Te doy la bienvenida»— a propósito: el tutorial
            llega después y son dos momentos, no dos veces el mismo. */""}
      <div class="region-marca">${marca || `<span class="bubble">${icon("compass", 28)}</span>`}</div>
      <h2>${escapeHtml(tx("Qué gusto tenerte aquí"))}</h2>
      <p class="region-lema">${escapeHtml(tx("Norata trata tu vida como un videojuego: misiones que haces hoy, habilidades que suben con la práctica, talentos y proyectos."))}</p>
      <p class="settings-note region-porque">${escapeHtml(tx("Antes de empezar, dos cosas para que la app hable como tú. Las dos se cambian después en Ajustes, cuando quieras."))}</p>

      <div class="region-bloque">
        <h3>${escapeHtml(tx("¿En qué idioma?"))}</h3>
        ${opcionesIdiomaHTML(idiomaActual(), "regionIdioma")}
      </div>

      <div class="region-bloque">
        <h3>${escapeHtml(tx("¿Con qué moneda cuentas tu dinero?"))}</h3>
        <p class="settings-note">${escapeHtml(tx("Es con la que se escribe lo que te cuesta un talento y lo que llevas invertido."))}</p>
        ${opcionesMonedaHTML(monedaActual(), "regionMoneda")}
      </div>

      <button class="btn btn-primary btn-block" style="margin-top:20px" onclick="cerrarPantallaRegion()">${
        escapeHtml(tx("Continuar"))}</button>
    </div>`;
}

/* Aquí sí se reescribe la pantalla entera al elegir idioma, y no solo se
   traduce: los rótulos de las tres monedas cambian de nombre —«Peso
   mexicano» / «Mexican peso»— y esos salen de `MONEDAS`, no del diccionario. */
function regionIdioma(cod) {
  if (!ponerIdioma(cod)) return;
  pintarPantallaRegion();
}

/* Sin conversión y sin preguntar nada: en un perfil recién nacido no hay ni
   un importe guardado, así que elegir moneda aquí es elegir con cuál se van a
   escribir los que vengan. */
function regionMoneda(cod) {
  if (!MONEDAS[cod]) return;
  state.settings.moneda = cod;
  save();
  pintarPantallaRegion();
}

function cerrarPantallaRegion() {
  state.settings.regionLista = true;
  state.settings.idioma = idiomaActual();
  save();
  const caja = document.getElementById("region");
  if (caja) caja.remove();
  /* Se repinta lo que hay detrás: si se eligió inglés, la pantalla vacía y el
     menú se dibujaron en español antes de que existiera esta capa. */
  aplicarModulos();
  showView(activeMainView || "summary");
  /* Y ahora sí el tutorial, que es a quien le habíamos quitado el turno. Con
     retraso porque esta capa tarda en irse, igual que la portada. */
  setTimeout(() => { if (typeof quizaTutorialDeEntrada === "function") quizaTutorialDeEntrada(); }, 320);
}
