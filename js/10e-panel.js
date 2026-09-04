/* El panel de administración: los números de Norata, dentro de Ajustes.
 *
 * AVISO, y es el mismo que lleva 10d-plan.js: NADA de este archivo es
 * seguridad. Que `esAdmin` valga false solo hace que el botón no se dibuje;
 * cualquiera puede poner esa variable a true desde la consola del navegador y
 * lo único que conseguirá es ver una pantalla vacía, porque el servidor no le
 * va a contestar. Quien decide es `metricas()` en administracion.sql.
 *
 * Por qué vive dentro de la app y no en una página aparte: para poder mirarlo
 * desde el teléfono sin escribir una dirección de memoria. El precio es que
 * este archivo viaja en la app de todo el mundo — los datos no, solo el
 * dibujo — y se paga a sabiendas.
 */

/* Empieza en false y solo el servidor lo sube. El orden importa: si arrancara
   en true, habría un instante con el botón puesto para cualquiera. */
let esAdmin = false;
let metricasCache = null;

/* Se pregunta una vez al arrancar, después de que la sesión esté lista. Si no
   hay sesión, ni se pregunta: la respuesta ya se sabe. */
async function revisarAdmin() {
  esAdmin = await sbSoyAdmin();

  /* Antes de nada, la puerta de atrás del modo de pruebas. El plan simulado
     vive en `sessionStorage`, así que aguanta una recarga a propósito —si no,
     no se podría navegar por la app mirando—. Pero el rótulo que lo anuncia
     cuelga de ser administrador, y si la respuesta del servidor llega diciendo
     que no lo eres, la simulación se quedaría puesta sin nada que la delate.
     Una app que miente sin avisar es peor que una que no se deja probar.

     Aquí y no en `planCargar`: allí `esAdmin` todavía no ha contestado, y
     preguntarlo antes de tiempo borraría la simulación siempre. */
  if (typeof planLeerSimulado === "function" && planLeerSimulado() &&
      (!esAdmin || !esCuentaDePruebas())) {
    planSimular("");
  }

  if (!esAdmin) return;

  /* La cuenta administradora tiene Fundador puesto (ver `PLAN_DE_CASA`), y
     esto es lo que lo enciende: `planCargar` ya corrió antes de que el
     servidor contestara quién es, así que decidió sin saberlo. */
  if (typeof planRefrescar === "function") planRefrescar();

  if (typeof renderAjustes === "function") renderAjustes();
  /* Y el rótulo de pruebas, que también cuelga de esto. Sin esta línea no
     aparecía nunca: cuando la sesión se abre, `esAdmin` todavía vale false, y
     `pintarAvisoPruebas` ya había pasado por ahí decidiendo que no. */
  if (typeof pintarAvisoPruebas === "function") pintarAvisoPruebas();
  /* Y el del ejemplo por lo mismo: en la cuenta de pruebas se dibuja callado,
     y esa decisión también cuelga de una respuesta que llega tarde. Sin esta
     línea, entrar al ejemplo antes de que el servidor conteste dejaba el
     rótulo hablando hasta la siguiente recarga. */
  if (typeof pintarAvisoEjemplo === "function") pintarAvisoEjemplo();
  /* Y la apariencia. Al arrancar, el nivel es 0 y el plan es el libre porque el
     servidor todavía no ha contestado; si la puerta se preguntara solo ahí,
     quien tiene puesto un ambiente que pide nivel o plan lo perdería en cada
     apertura. Aquí es donde se sabe la verdad. */
  if (typeof refrescarApariencia === "function") refrescarApariencia();
}

/* ---- Piezas de dibujo ----
   Todo se dibuja a mano con SVG y CSS. No hay librería de gráficas y no la va
   a haber: meter una obligaría a un empaquetador, y Norata no tiene ninguno
   a propósito. Cuatro barras y un número grande no necesitan trescientos
   kilobytes. */

/* ---- La nomenclatura de color, y es la regla de todo el panel ----

   La pidió Eduardo el 28 ago 2026 con una frase que la resume mejor que
   cualquier explicación: «que todo se vea verde no me dice nada». Y tenía
   razón por debajo de lo que parecía — no era fealdad, era que el color no
   estaba diciendo nada: las seis cifras de La gente, las tres de la gráfica,
   los cuatro escalones del embudo y todas las barras salían en menta, así que
   el verde solo significaba «esto es un número».

   La regla, y solo hay una: **el color aparece cuando hay un JUICIO, y la
   tinta normal cuando solo hay un dato.** Un número sin vara contra la que
   compararse no puede estar bien ni mal, y pintarlo de un color le pone una
   opinión encima que nadie ha calculado.

     tinta         un dato que solo cuenta: cuentas creadas, aperturas,
                   versiones, cuánto llevan con cuenta. La mayoría del panel.
     menta         llega a la vara
     luciérnaga    hay que mirarlo: va a medias, o es raro
     coral         se pierde gente, o algo se rompió

   Dos excepciones a propósito, porque ahí el color es IDENTIDAD y no juicio:
   la línea de la constelación (es la serie, y solo hay una) y los planes del
   cobro (menta los que se renuevan, lila el fundador, que es su color desde
   0.7.15). Los gajos de una dona son identidad también, y por eso ninguno
   puede ser coral: un reparto de aparatos no tiene un lado malo.

   Dónde NO se toca: la tendencia de la gráfica (▲▼) ya usaba `--var-sube` y
   `--var-baja`, que es esta misma idea escrita antes y en todos los mundos. */

/* De un porcentaje y su vara sale la clase, y de ningún otro sitio. El escalón
   de en medio existe porque «no llega» no es lo mismo que «se está cayendo»:
   con la vara en 20 y un 19, pintar coral asusta por un punto. */
function panelTono(pct, vara) {
  if (!vara || pct == null) return "";
  if (pct >= vara) return "bien";
  if (pct >= vara * 0.6) return "ojo";
  return "mal";
}

function panelCifra(valor, rotulo, pista, tono) {
  return `<div class="pn-kpi${tono ? " " + tono : ""}">
      <b>${escapeHtml(String(valor))}</b>
      <span>${escapeHtml(rotulo)}</span>
      ${pista ? `<i>${escapeHtml(pista)}</i>` : ""}
    </div>`;
}

/* De cuántos, cuántos — con el divisor a la vista. Un «3 siguen» no significa
   nada sin saber de cuántos: puede ser estupendo o ser un desastre.

   `vara` es el número a partir del cual esto va bien, y es UN solo dato para
   dos cosas: escribe el «señal buena: 20%» del pie y decide el color de la
   cifra. Iban por separado —el texto a mano en la llamada, el color en ningún
   sitio— y ahí es donde nacen las dos verdades: cambiar la vara habría dejado
   el rótulo diciendo una cosa y el color juzgando por otra.

   Sin `vara` la cifra sale en tinta, que es lo correcto: un porcentaje del que
   no sabemos qué esperar no puede estar bien ni mal. */
function panelDeCada(parte, total, rotulo, vara) {
  const p = total > 0 ? Math.round((parte / total) * 100) : 0;
  const texto = total > 0 ? p + "%" : "—";
  /* Sin datos no hay juicio: cero de cero no es un desastre, es que todavía
     no ha pasado nada. */
  const tono = total > 0 ? panelTono(p, vara) : "";
  return `<div class="pn-kpi${tono ? " " + tono : ""}">
      <b>${texto}</b>
      <span>${escapeHtml(rotulo)}</span>
      <i>${total > 0 ? parte + " de " + total : "todavía sin datos"}${vara ? " · señal buena: " + vara + "%" : ""}</i>
    </div>`;
}

/* Los últimos catorce días, dibujados como una constelación: un punto por día
   y un hilo que los une. Lo eligió Eduardo y encaja con la casa — el árbol de
   Talentos ya es eso mismo.
 *
 * Dos cosas que aquí importan más de lo que parece:
 *
 * 1. **Nada de `preserveAspectRatio="none"`.** La versión de barras estiraba
 *    el lienzo para ocupar el ancho, y eso deformaba también los números del
 *    eje: los días salían aplastados e ilegibles. Con el viewBox proporcional
 *    y `width:100%; height:auto`, el dibujo entero escala sin achatarse.
 * 2. **Los colores salen de variables del CSS, no de atributos.** La versión
 *    anterior escribía `fill="var(--menta)"` — una variable que en Norata no
 *    existe, porque aquí se llama `--mint`. Un `fill` que no resuelve no
 *    avisa: pinta negro. Por eso ahora el color va en clases y no a mano.
 */
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun",
                      "jul", "ago", "sep", "oct", "nov", "dic"];

function panelConstelacion(dias) {
  if (!dias || !dias.length) {
    return `<p class="settings-note">Todavía no hay ni un día con actividad. Aparecerá en cuanto alguien abra la app con su cuenta.</p>`;
  }

  /* Con sitio a la izquierda para la escala —los números del eje no cabían en
     los 14 de margen que había— pero MÁS BAJO que antes. Subió a 190 al añadir
     la escala y quedó demasiado aire entre la línea y el suelo: con cifras
     pequeñas la gráfica es casi toda hueco. 132 la deja proporcionada sin
     apretar los números del eje. */
  const W = 340, H = 132;
  const izq = 30, der = 16, arr = 14, aba = 26;
  const util = W - izq - der;
  const alto = H - arr - aba;
  const suelo = arr + alto;

  const n = dias.length;
  const valores = dias.map(d => Number(d.personas) || 0);
  const altas = dias.map(d => Number(d.altas) || 0);
  const hayAltas = altas.some(v => v > 0);

  /* ---- Una sola escala para las dos series, y esto es el cambio de fondo ----
     Las cuentas nuevas se dibujaban como barras al fondo Y con su propia
     escala, estirada al 42% del alto. Eso hacía que un día de 2 altas se
     viera casi tan alto como un día de 9 personas, y que las dos cosas no se
     pudieran comparar aunque estuvieran en el mismo dibujo. Un segundo eje
     escondido es la forma más común de que una gráfica mienta sin que nadie
     escriba una cifra falsa.

     Ahora las dos series miden lo mismo —personas— y se leen contra los
     mismos números de la izquierda. La línea de altas va a ir casi siempre
     pegada al suelo, y eso ES el dato: las cuentas nuevas son una parte
     pequeña de quien abre la app. */
  const tope = Math.max(...valores, ...altas, 1);

  /* Con un solo día no hay recta que trazar: el punto va al centro, que es
     donde se lee como «esto es lo que hay» y no como el principio de algo. */
  const x = (i) => n === 1 ? izq + util / 2 : izq + (i * util) / (n - 1);
  const y = (v) => arr + (1 - (Number(v) || 0) / tope) * alto;

  const fecha = (s) => new Date(String(s) + "T00:00:00");

  /* ---- La escala, escrita ----
     Tres renglones con su número al lado: cero, la mitad y el máximo. Es lo
     que faltaba. Antes había tres rayas sin decir qué valían, así que un punto
     a media altura podía ser 3 personas o 300 y no había forma de saberlo sin
     pasar el ratón por encima — y el único número escrito estaba en una frase
     DEBAJO del dibujo, que es donde nadie busca la escala de una gráfica.

     Se redondea a entero y se quitan los repetidos: con un máximo de 1, la
     serie «0 · 0,5 · 1» sobra por la mitad y además inventa medias personas.

     El renglón del máximo va más marcado que los otros dos: es la referencia
     contra la que se lee todo lo demás, y en el mismo gris se perdía entre
     ellos. */
  const escalones = [...new Set([0, Math.round(tope / 2), tope])].sort((a, b) => a - b);
  const reja = escalones.map(v => {
    const yy = y(v);
    const cima = v === tope && tope > 0;
    return `<line x1="${izq}" y1="${yy.toFixed(1)}" x2="${W - der}" y2="${yy.toFixed(1)}" class="pn-reja${cima ? " cima" : ""}"/>
            <text x="${izq - 7}" y="${(yy + 3.2).toFixed(1)}" class="pn-eje-y${cima ? " cima" : ""}" text-anchor="end">${v}</text>`;
  }).join("");

  /* Las líneas de referencia caen en LUNES, no cada tres días sueltos: lo que
     se quiere leer aquí es «esta semana contra la anterior», y una marca que
     no coincide con el principio de la semana no ayuda a compararlas. La de
     hoy va aparte y con su propio trazo, porque el último punto casi siempre
     es un día a medias y conviene que se note. */
  const marcas = dias.map((d, i) => {
    const dw = fecha(d.dia).getDay();
    const hoy = i === n - 1;
    if (!hoy && dw !== 1) return "";
    return `<line x1="${x(i).toFixed(1)}" y1="${arr - 4}" x2="${x(i).toFixed(1)}" y2="${suelo}"
              class="pn-guia ${hoy ? "hoy" : ""}"/>`;
  }).join("");

  /* Las altas del día, en LÍNEA y no en barras. Lo pidió Eduardo el 28 de
     agosto con una palabra que lo describe mejor que cualquier explicación:
     mezclar barras y líneas en el mismo dibujo se le veía «sucio». Y tenía más
     razón de la que parecía: dos formas distintas se leen como dos cosas de
     distinta naturaleza, y aquí no lo son —las dos cuentan personas—, así que
     la diferencia de forma no significaba nada y solo estorbaba.

     Va debajo de la principal en el orden de dibujo: es el contexto —de dónde
     salió la gente— y no la cifra que se viene a mirar. Y en trazo discontinuo
     además de en otro color, porque de las dos maneras se distingue también
     para quien no separa bien el verde del azul. */
  const hiloAltas = !hayAltas ? "" :
    `<polyline points="${altas.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")}"
       class="pn-hilo-altas"/>`;

  /* Un punto solo en los días que tuvieron alguna: la línea ya dice el cero,
     y catorce puntos pegados al suelo lo único que hacen es ensuciar el
     suelo. Los que se dibujan llevan el título, que es lo que se lee al pasar
     por encima. */
  const puntosAltas = !hayAltas ? "" : altas.map((v, i) => {
    if (v <= 0) return "";
    return `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="2.4"
              class="pn-punto-alta"><title>${escapeHtml(String(dias[i].dia))}: ${v} ${v === 1 ? "cuenta nueva" : "cuentas nuevas"}</title></circle>`;
  }).join("");

  const pts = dias.map((d, i) => [x(i), y(d.personas)]);
  const hilo = pts.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");

  const estrellas = dias.map((d, i) => {
    const v = Number(d.personas) || 0;
    /* Un día sin nadie no se borra: se apaga. Un hueco en la línea se lee
       como «falta el dato», y un punto tenue como «ese día no vino nadie»,
       que es lo que de verdad pasó. */
    const clase = v === 0 ? "vacia" : (v === tope ? "cima" : "");
    const r = v === 0 ? 2.2 : (v === tope ? 4.6 : 3.4);
    return `<circle cx="${pts[i][0].toFixed(1)}" cy="${pts[i][1].toFixed(1)}" r="${r}" class="pn-estrella ${clase}"><title>${escapeHtml(String(d.dia))}: ${v} ${v === 1 ? "persona" : "personas"}</title></circle>`;
  }).join("");

  /* La fecha se escribe solo donde hay una marca, y con el mes puesto: un «26»
     suelto no dice de qué mes es, y a fin de mes la serie cruza dos. */
  const fechas = dias.map((d, i) => {
    const f = fecha(d.dia);
    const hoy = i === n - 1;
    if (!hoy && f.getDay() !== 1) return "";
    const txt = hoy ? "hoy" : (f.getDate() + " " + MESES_CORTOS[f.getMonth()]);
    /* Pegada al borde, la etiqueta se sale del lienzo. Se ancla al principio o
       al final según de qué lado esté, en vez de centrarse siempre. */
    const px = x(i);
    const ancla = px < izq + 22 ? "start" : (px > W - der - 22 ? "end" : "middle");
    return `<text x="${px.toFixed(1)}" y="${H - 12}" class="pn-eje" text-anchor="${ancla}">${escapeHtml(txt)}</text>`;
  }).join("");

  const pie = hayAltas
    ? `<div class="pn-pie-graf">
         <span><i class="pn-mu-linea"></i> personas que abrieron</span>
         <span><i class="pn-mu-linea altas"></i> cuentas nuevas</span>
       </div>`
    : "";

  /* ---- Las cifras que la línea no dice ----
     Una serie de catorce puntos enseña la FORMA —si sube o baja— y esconde
     todo lo demás: cuánto suma, cuánto es un día normal, y si esta semana fue
     mejor que la anterior. Eran justo las preguntas que había que contestar
     mirando fijamente el dibujo, y dos de ellas no se podían contestar.

     La comparación va contra los SIETE DÍAS ANTERIORES y no contra la semana
     natural: la ventana es de catorce, así que parte por la mitad y las dos
     mitades miden lo mismo. Comparar «esta semana» con «la pasada» un lunes
     sería comparar un día contra siete.

     Solo aparece con las dos mitades completas. Con menos de catorce días de
     historia el porcentaje sería ruido, y un número inventado en un panel que
     existe para decidir es peor que un hueco. */
  const suma = (a) => a.reduce((t, v) => t + v, 0);
  const total = suma(valores);
  const media = n ? Math.round((total / n) * 10) / 10 : 0;

  /* ---- Personas y aperturas son DOS cosas, y aquí se llamaban igual ----
     Es el punto 2 de los cinco de Eduardo: «distinguir usuarios únicos por
     cuenta, no solo aperturas». En los datos ya estaba bien —la tabla `pulsos`
     tiene la clave (user_id, dia), así que una fila por cuenta y día, y lo que
     cuenta la serie son cuentas—, pero esta caja sumaba esas cuentas de los
     catorce días y al resultado le ponía el rótulo «aperturas con cuenta».

     Eso no eran aperturas: era la suma de cuentas-por-día, que no es ninguna
     magnitud que interese a nadie —alguien que abrió los catorce días contaba
     catorce—. Y el número de aperturas de verdad venía en los datos, en su
     propia columna, sin que ninguna pantalla lo usara.

     Ahora son dos cifras distintas y el par dice algo que ninguna decía sola:
     cuántas veces se abre la app por cada persona que la abre. */
  const aperturas = suma(dias.map(d => Number(d.aperturas) || 0));
  const porPersona = total > 0 ? Math.round((aperturas / total) * 10) / 10 : 0;
  const iCima = valores.indexOf(tope);
  const diaCima = dias[iCima] ? fecha(dias[iCima].dia) : null;

  let tendencia = "";
  if (n >= 14) {
    const ult = suma(valores.slice(-7)), prev = suma(valores.slice(-14, -7));
    if (prev > 0 || ult > 0) {
      const dif = prev === 0 ? null : Math.round(((ult - prev) / prev) * 100);
      const sube = ult >= prev;
      tendencia = `<span class="pn-tend ${sube ? "sube" : "baja"}">
          ${sube ? "▲" : "▼"} ${dif === null ? "nuevo" : Math.abs(dif) + "%"}
        </span><span class="pn-tend-pie">${ult} contra ${prev} los 7 días de antes</span>`;
    }
  }

  const resumen = `<div class="pn-graf-cifras">
      <div class="pn-gc"><b>${media}</b><span>cuentas al día</span></div>
      <div class="pn-gc"><b>${tope}</b><span>el mejor día${
        diaCima ? " · " + diaCima.getDate() + " " + MESES_CORTOS[diaCima.getMonth()] : ""}</span></div>
      <div class="pn-gc"><b>${aperturas}</b><span>aperturas${
        porPersona ? " · " + porPersona + " por cuenta al día" : ""}</span></div>
      ${tendencia ? `<div class="pn-gc tend">${tendencia}</div>` : ""}
    </div>`;

  /* La gráfica arriba y las cifras debajo, que es como lo quiso Eduardo al
     verlo montado. Estuvieron encima un rato y el orden se lee peor de lo que
     parecía sobre el papel: la caja ya tiene su título y su párrafo, así que
     tres números más antes del dibujo eran un cuarto bloque de texto antes de
     llegar a lo que se viene a ver. Debajo funcionan como el pie de una foto —
     miras la forma, y ahí está lo que no se podía leer de ella. */
  return `<svg class="pn-cielo" viewBox="0 0 ${W} ${H}" role="img"
            aria-label="Dos líneas sobre la misma escala durante los últimos catorce días: personas que abrieron la app cada día, con una media de ${media} y un máximo de ${tope}${hayAltas ? ", y cuentas nuevas creadas cada día" : ""}.">
      ${reja}
      ${marcas}
      ${hiloAltas}
      ${puntosAltas}
      <polyline points="${hilo}" class="pn-hilo"/>
      ${estrellas}
      ${fechas}
    </svg>
    ${pie}
    ${resumen}`;
}

/* ---- La dona ----
   Para un reparto que suma un todo y tiene pocas partes: teléfono contra
   computadora, instalada contra navegador. Con más de cuatro trozos deja de
   leerse y hay que usar barras — un pastel de ocho gajos no lo lee nadie.

   Se dibuja con `stroke-dasharray` sobre un círculo y no con arcos calculados
   a mano: son cuatro números en vez de trigonometría, y no hay forma de que
   un redondeo deje una rendija blanca entre dos gajos. */
function panelDona(filas, claveNombre, claveValor, vacio) {
  const datos = (filas || []).filter(f => (Number(f[claveValor]) || 0) > 0);
  if (!datos.length) return `<p class="settings-note">${escapeHtml(vacio)}</p>`;

  const total = datos.reduce((s, f) => s + (Number(f[claveValor]) || 0), 0);
  const R = 42, GRUESO = 15, C = 2 * Math.PI * R;

  let acumulado = 0;
  const gajos = datos.map((f, i) => {
    const v = Number(f[claveValor]) || 0;
    const frac = v / total;
    const largo = frac * C;
    /* El desfase va en negativo porque el trazo avanza en sentido horario
       desde donde lo dejó el gajo anterior. */
    const off = -acumulado * C;
    acumulado += frac;
    return `<circle cx="60" cy="60" r="${R}" class="pn-gajo pn-gajo-${(i % 4) + 1}"
              stroke-width="${GRUESO}"
              stroke-dasharray="${largo.toFixed(2)} ${(C - largo).toFixed(2)}"
              stroke-dashoffset="${off.toFixed(2)}"><title>${escapeHtml(String(f[claveNombre]))}: ${v}</title></circle>`;
  }).join("");

  const leyenda = datos.map((f, i) => {
    const v = Number(f[claveValor]) || 0;
    return `<div class="pn-ley">
        <i class="pn-gajo-${(i % 4) + 1}"></i>
        <span>${escapeHtml(String(f[claveNombre]))}</span>
        <b>${Math.round((v / total) * 100)}%</b>
      </div>`;
  }).join("");

  return `<div class="pn-dona-caja">
      <svg class="pn-dona" viewBox="0 0 120 120" role="img"
           aria-label="Reparto: ${escapeHtml(datos.map(f => f[claveNombre] + " " + f[claveValor]).join(", "))}">
        <g transform="rotate(-90 60 60)">
          <circle cx="60" cy="60" r="${R}" class="pn-dona-riel" stroke-width="${GRUESO}"/>
          ${gajos}
        </g>
        <text x="60" y="58" class="pn-dona-num">${total}</text>
        <text x="60" y="70" class="pn-dona-pie">${total === 1 ? "persona" : "personas"}</text>
      </svg>
      <div class="pn-leyenda">${leyenda}</div>
    </div>`;
}

/* ---- El embudo ----
   Cada paso es un subconjunto del anterior, así que se lee de arriba abajo y
   el escalón que más cae es el que hay que arreglar. La caída se escribe al
   lado en vez de dejarla deducir: «de 40 a 12» obliga a hacer la cuenta
   mentalmente cada vez que se mira. */
function panelEmbudo(pasos) {
  const ps = (pasos || []).map(p => ({ paso: String(p.paso), n: Number(p.personas) || 0 }));
  if (!ps.length || ps[0].n === 0) {
    return `<p class="settings-note">Todavía no hay nadie registrado, así que no hay embudo que mirar.</p>`;
  }
  const tope = ps[0].n;

  /* Cuánta gente se cae en cada escalón, y cuál es el peor. El panel ya
     prometía «el escalón donde más gente se cae es el que hay que arreglar
     primero» y luego pintaba los cuatro iguales, así que había que contarlos a
     ojo. Ahora se marca UNO solo: si se marcan dos, vuelve a no haber ninguno.

     Se mide en PERSONAS y no en porcentaje, que es lo que dice la frase y
     además lo que se puede arreglar: un 80% de caída sobre tres personas son
     dos personas, y un 30% sobre doscientas son sesenta. */
  const perdidas = ps.map((p, i) => (i > 0 ? Math.max(ps[i - 1].n - p.n, 0) : 0));
  const maxPerdida = Math.max(...perdidas);
  const iPeor = maxPerdida > 0 ? perdidas.indexOf(maxPerdida) : -1;

  return `<div class="pn-embudo">` + ps.map((p, i) => {
    const ancho = Math.max((p.n / tope) * 100, p.n > 0 ? 4 : 0);
    const antes = i > 0 ? ps[i - 1].n : null;
    /* Solo se marca la caída cuando hay gente que perder. Escribir «−0%»
       debajo de un cero es ruido con aire de dato. */
    const cae = (antes && antes > 0) ? Math.round(((antes - p.n) / antes) * 100) : 0;
    /* Un escalón MÁS GRANDE que el de arriba no es una buena noticia: es la
       señal de que ese paso no se está calculando como un trozo del anterior.
       Pasaba de verdad —«Siguen esta semana» se contaba suelto y podía salir
       un 3 debajo de un 2—, y se arregló en el servidor el 3 de septiembre de
       2026: ahora los tres últimos pasos salen de la misma CTE.

       Esto se queda igualmente, y no por desconfianza: es un centinela. Si
       algún día alguien vuelve a separar un paso del anterior, la pantalla lo
       dice en vez de disimularlo — que es lo que hacía antes, cuando un
       escalón que crecía caía en el «no se pierde nadie», la lectura más
       halagadora posible de un dato roto. */
    const crece = antes != null && p.n > antes;
    const clase = crece ? "crece" : (i === iPeor ? "peor" : "");
    return `<div class="pn-paso ${clase}">
        <div class="pn-paso-tit">
          <span>${escapeHtml(p.paso)}</span>
          <b>${p.n}</b>
        </div>
        <div class="pn-paso-riel"><i style="width:${ancho.toFixed(1)}%"></i></div>
        ${crece
          ? `<div class="pn-caida ojo">sube en vez de bajar: este paso no se cuenta como un trozo del anterior</div>`
          : (i === iPeor
            ? `<div class="pn-caida">aquí se pierde más gente que en ningún otro paso: ${maxPerdida} ${maxPerdida === 1 ? "persona" : "personas"}, el ${cae}% del anterior</div>`
            : (i > 0 && cae > 0
              ? `<div class="pn-caida ok">se pierde el ${cae}% del paso anterior</div>`
              : (i > 0 ? `<div class="pn-caida ok">no se pierde nadie</div>` : "")))}
      </div>`;
  }).join("") + `</div>`;
}

/* Barras horizontales para lo que es una lista con pesos: versiones, planes. */
/* `nombra` traduce la clave cruda a lo que se lee en pantalla, y `tono` da
   color a la barra. Los dos son opcionales: las listas que ya se entendían
   —los tramos de antigüedad, las versiones— siguen llamando igual que antes.

   Nacieron por «El cobro», donde las filas decían `mensual` y `anual` a
   secas. Un renglón que pone «anual» al lado de un número no dice si eso son
   personas, pesos o meses; y sin color, tres planes con precios muy distintos
   se leen como tres barras iguales. */
function panelListaBarras(filas, claveNombre, claveValor, vacio, nombra, tono) {
  if (!filas || !filas.length) return `<p class="settings-note">${escapeHtml(vacio)}</p>`;
  const tope = Math.max(...filas.map(f => Number(f[claveValor]) || 0), 1);
  return `<div class="pn-lista">` + filas.map(f => {
    const v = Number(f[claveValor]) || 0;
    const crudo = String(f[claveNombre] || "—") || "(sin dato)";
    const nombre = nombra ? nombra(crudo) : crudo;
    const t = tono ? tono(crudo) : "";
    return `<div class="pn-fila">
        <span class="pn-nom">${escapeHtml(nombre)}</span>
        <span class="pn-riel"><i class="${t}" style="width:${Math.round((v / tope) * 100)}%"></i></span>
        <span class="pn-val ${t}">${v}</span>
      </div>`;
  }).join("") + `</div>`;
}

/* ================= Lo que se rompe =================

   Dos cosas muy distintas caen en la misma tabla del servidor: los errores que
   la app caza sola —un volcado de JavaScript, siempre igual— y los reportes
   que escribe una persona. El servidor los junta por mensaje idéntico, que es
   lo correcto para los primeros: un fallo dentro de un bucle escribiría miles
   de filas iguales.

   Para los reportes esa regla no sirve, y lo dijo Eduardo: «no se pueden sumar
   en uno mismo si el contexto es distinto». Dos personas contando dos cosas
   distintas de la misma pantalla no son «2×» de nada — son dos historias, y
   sumarlas borra justo lo que las hace útiles.

   Así que se agrupan por el ÚNICO dato que de verdad tienen en común: el lugar
   donde dicen que pasó. Ese lugar lo escribe `reportarFallo` al principio del
   mensaje entre corchetes (`[Talentos] …`), así que se lee de ahí. Lo que no
   traiga corchetes —un reporte de antes de que existiera el formulario— cae en
   «Sin ubicar», que es honesto y no lo esconde. */

function lugarDelReporte(mensaje) {
  const m = String(mensaje || "").match(/^\s*\[([^\]]{1,40})\]\s*/);
  return m ? m[1].trim() : "Sin ubicar";
}

/* El mensaje sin la etiqueta del lugar: dentro del grupo ya se sabe dónde fue,
   y repetir «[Talentos]» en las seis filas es ruido. */
function reporteSinLugar(mensaje) {
  return String(mensaje || "").replace(/^\s*\[[^\]]{1,40}\]\s*/, "");
}

/* Qué grupos están abiertos. En memoria y no en `state`: es una preferencia de
   este rato mirando el panel, no un dato de nadie.

   `reportesAbiertos` y no `gruposAbiertos` a secas: ese nombre ya lo usa una
   FUNCIÓN de Talentos (`gruposAbiertos(rama)`, las cajas del ático), y los
   archivos de la app comparten un único ámbito global — todos son `<script>`
   sueltos, sin módulos. Declararlo repetido con `let` no da un aviso: parte el
   archivo entero con «Identifier has already been declared», y con él se cayó
   el panel completo. */
let reportesAbiertos = {};

function alternarGrupoReporte(clave) {
  reportesAbiertos[clave] = !reportesAbiertos[clave];
  renderPanelAdmin();
}

/* Los reportes de gente, agrupados por lugar y ordenados por cuántos hay. Cada
   grupo trae sus mensajes enteros dentro, que es lo que se despliega al tocar:
   la lista de lo que dijo cada quien, sin sumar ni resumir. */
function agruparReportes(tropiezos) {
  const mapa = new Map();
  (tropiezos || []).forEach(t => {
    if (t.donde !== "reporte") return;
    const lugar = lugarDelReporte(t.mensaje);
    if (!mapa.has(lugar)) mapa.set(lugar, { lugar, cuantos: 0, sinVer: 0, dia: "", filas: [] });
    const g = mapa.get(lugar);
    /* `cuantos` del servidor puede ser mayor que uno si dos personas
       escribieron LO MISMO letra por letra. Es raro y no se pierde: se suma. */
    g.cuantos += Number(t.cuantos) || 1;
    if (!t.visto) g.sinVer++;
    if (String(t.dia) > g.dia) g.dia = String(t.dia);
    g.filas.push(t);
  });
  return [...mapa.values()]
    .map(g => { g.filas.sort((a, b) => String(b.dia).localeCompare(String(a.dia))); return g; })
    .sort((a, b) => (b.sinVer - a.sinVer) || String(b.dia).localeCompare(String(a.dia)) || (b.cuantos - a.cuantos));
}

function panelReportesHTML(tropiezos) {
  const grupos = agruparReportes(tropiezos);
  if (!grupos.length) return "";
  const total = grupos.reduce((t, g) => t + g.cuantos, 0);
  const sinVer = grupos.reduce((t, g) => t + g.sinVer, 0);

  return `<div class="panel">
      <div class="pn-cab">
        <h3>Lo que la gente reporta</h3>
        <span class="pn-cuenta${sinVer ? " nuevo" : ""}">${total} ${total === 1 ? "reporte" : "reportes"}</span>
      </div>
      <p class="settings-note">Agrupados por dónde dicen que pasó, no por el texto: dos personas contando dos cosas distintas de la misma pantalla son dos historias, y sumarlas borraría lo que las hace útiles. Toca un grupo para leerlos.</p>
      <div class="pn-grupos">` + grupos.map(g => {
    const abierto = !!reportesAbiertos[g.lugar];
    return `<div class="pn-grupo ${abierto ? "abierto" : ""}">
        <button class="pn-grupo-cab" onclick="alternarGrupoReporte('${enJS(g.lugar)}')"
                aria-expanded="${abierto}">
          <span class="pn-grupo-ic">${icon("bicho", 15)}</span>
          <span class="pn-grupo-nom">${escapeHtml(g.lugar)}</span>
          ${g.sinVer ? `<span class="pn-globo">${g.sinVer}</span>` : ""}
          <span class="pn-grupo-n">${g.cuantos}</span>
          <span class="pn-grupo-flecha">${abierto ? "▾" : "▸"}</span>
        </button>
        ${abierto ? `<div class="pn-grupo-lista">` + g.filas.map(t => `
            <div class="pn-dicho ${t.visto ? "visto" : ""}">
              <p>${escapeHtml(reporteSinLugar(t.mensaje))}</p>
              <span>${escapeHtml(String(t.dia))} · v${escapeHtml(String(t.version) || "?")}${
                (Number(t.cuantos) || 1) > 1 ? " · lo dijeron " + t.cuantos + " veces" : ""}</span>
            </div>`).join("") + `</div>` : ""}
      </div>`;
  }).join("") + `</div>
    </div>`;
}

/* ---- El modo de pruebas ----
   Vive aquí y no en Mi perfil porque solo le sirve a quien revisa Norata, y
   porque uno de sus dos efectos es quitar la confirmación de borrar: eso no
   puede estar al alcance de alguien que entró a cambiarse el apodo.

   Dos cosas dentro, y la segunda cuelga de la primera:

     el interruptor   marca esta cuenta como de pruebas (rótulo arriba, y
                      borrar deja de pedir el correo)
     los planes       enseña la app como si tuvieras otro plan

   Los planes solo aparecen con el modo encendido, y no es por orden: el rótulo
   de arriba es lo único que avisa de que el plan que estás viendo no es el
   tuyo. Sin el modo no hay rótulo, y una app que miente sin nada que lo diga
   es peor que no poder probarla. */
function panelPruebasHTML() {
  const on = typeof esCuentaDePruebas === "function" && esCuentaDePruebas();
  const cual = typeof planLeerSimulado === "function" ? planLeerSimulado() : "";
  const lista = typeof PLANES_SIMULABLES !== "undefined" ? PLANES_SIMULABLES : [];

  return `<div class="panel">
      <h3>Modo de pruebas</h3>
      <p class="settings-note">Solo lo ves tú, y solo mientras esta cuenta sea administradora. No cambia nada en el servidor: lo que hay aquí decide qué se DIBUJA, no lo que la base de datos cree.</p>

      <div class="field">
        <span class="lbl">Esta cuenta</span>
        <div class="seg">
          <button${on ? "" : ' class="on"'} onclick="marcarCuentaDePruebas(false)">Normal</button>
          <button${on ? ' class="on"' : ""} onclick="marcarCuentaDePruebas(true)">De pruebas</button>
        </div>
        <div class="field-hint">${on
          ? "Verás un marco punteado amarillo mientras la uses, y borrar todo no pedirá confirmación extra."
          : "Borrar todo te pedirá escribir tu correo. Es a propósito: obliga a mirar en qué cuenta estás."}</div>
      </div>

      ${on ? `<div class="field" style="margin-bottom:0">
        <span class="lbl">Ver la app como si tuviera</span>
        <div class="pn-planes">` +
          lista.map(x => `<button class="${cual === x.id ? "on" : ""}"
            onclick="planSimular('${x.id}')">${escapeHtml(x.rotulo)}</button>`).join("") +
        `</div>
        <div class="field-hint">${cual
          ? "Estás viendo la app como <b>" + escapeHtml(planNombreSimulado()) + "</b>. Se cae sola al cerrar la pestaña, y no toca lo que pagaste."
          : "Los topes, las pantallas y los avisos de cada plan, sin tener que comprarlos. Vive en la pestaña: aguanta una recarga y muere al cerrarla."}</div>
      </div>` : ""}
    </div>`;
}

/* ---- El escaparate de las celebraciones ----
   Las fiestas de la app solo se ven cuando pasan de verdad, y algunas pasan una
   vez en la vida de una cuenta: llegar al rango Red pide veintiocho niveles.
   Revisar cómo se ven a base de esperarlas es imposible, así que aquí se
   disparan a mano.

   Lo pidió Eduardo, y de paso resuelve una trampa vieja: sin componer
   fotogramas no hay forma de MEDIR una animación —se queda en el valor de
   partida—, así que la única prueba real de una celebración es mirarla. */
const FIESTAS = [
  { id: "nivel", rotulo: "Nivel a secas",
    nota: "La que pasa: se va sola a los ocho segundos y se corta tocando fuera." },
  { id: "rango", rotulo: "Nivel con rango",
    nota: "Cuando el nivel además te cambia el nombre del camino." },
  { id: "premio", rotulo: "Nivel con premio",
    nota: "La ventana que NO se cierra tocando fuera ni sola. Lleva a lo que abriste." },
  { id: "racha", rotulo: "Hito de racha",
    nota: "La de los días seguidos, en amarillo." },
  { id: "chica", rotulo: "La chica",
    nota: "El destello de subir una habilidad o cumplir un talento." }
];

function verLaFiesta(cual) {
  /* Primero se sale de Ajustes. Las celebraciones viven en el piso de las
     fiestas (120-130) y Ajustes en el de las ventanas (400): disparada desde
     aquí, la fiesta se dibujaba DEBAJO del panel y solo asomaba por los huecos
     —medido: a media pantalla el fondo era la tarjeta clara de Ajustes—.
     Subirle el piso arreglaría el escaparate y rompería la regla de las capas;
     volver a la app enseña además la fiesta donde de verdad va a salir. */
  if (typeof showView === "function") showView("summary");

  if (cual === "racha") { celebrateStreak(30); return; }
  if (cual === "chica") { celebrate("Nivel 7", "Guitarra sube de nivel", "#f5d76e", "music"); return; }

  /* Se toma un nivel de verdad de la escalera para que lo que se vea sea lo
     que va a ver la gente, no un ejemplo inventado: los nombres, los iconos y
     los premios salen del catálogo. */
  const escalera = typeof escaleraDeExpedicion === "function" ? escaleraDeExpedicion() : [];
  if (cual === "rango") {
    const r = escalera.find(x => x.tipo === "rango" && x.listo && x.nivel > 1) || { nivel: 4 };
    celebrarNivel(r.nivel, [r]);
    return;
  }
  if (cual === "premio") {
    const a = escalera.find(x => x.tipo === "ambiente" && x.listo);
    celebrarNivel(a ? a.nivel : 3, a ? [a] : [{ nivel: 3, tipo: "ambiente", nombre: "Un ambiente nuevo" }]);
    return;
  }
  celebrarNivel(Math.max(2, (typeof nivelExpedicion === "function" ? nivelExpedicion().nivel : 2)), []);
}

function panelFiestasHTML() {
  return `<div class="panel">
      <h3>Ver una celebración</h3>
      <p class="settings-note">Se disparan aquí porque algunas pasan una vez en la vida de una cuenta y no hay forma de revisarlas esperándolas. No tocan tus datos ni tu nivel: solo dibujan.</p>
      <div class="pn-fiestas">
        ${FIESTAS.map(f => `<button class="btn btn-linea btn-block" onclick="verLaFiesta('${f.id}')">
          <b>${escapeHtml(f.rotulo)}</b><span>${escapeHtml(f.nota)}</span>
        </button>`).join("")}
      </div>
    </div>`;
}

/* ---- La pantalla ---- */

function renderPanelAdmin() {
  const caja = document.getElementById("panel-admin");
  if (!caja) return;
  if (!esAdmin) { caja.innerHTML = ""; return; }

  const m = metricasCache;
  /* El modo de pruebas va PRIMERO y en los dos caminos. Es lo único de esta
     sección con lo que se interactúa —el resto se lee— y no depende de que las
     métricas hayan llegado: dejarlo debajo de una tabla que todavía se está
     pidiendo lo escondía justo cuando hace falta. */
  if (!m) {
    caja.innerHTML = panelPruebasHTML() + panelFiestasHTML() + `<div class="panel">
        <h3>Los números</h3>
        <p class="settings-note">Se piden al servidor cuando abres esta sección.</p>
        <button class="btn btn-linea btn-block" onclick="cargarMetricas()">Cargar los números</button>
      </div>`;
    return;
  }

  const r = m.resumen || {};
  const c = m.cobro || {};
  const tropiezos = m.tropiezos || [];
  const sinVer = tropiezos.filter(t => !t.visto).length;
  /* Los automáticos por un lado y lo que escribe una persona por otro: son
     dos cosas distintas y se leen distinto. Ver `panelReportesHTML`. */
  const autos = tropiezos.filter(t => t.donde !== "reporte");
  const autoSinVer = autos.some(t => !t.visto);

  /* Los avisos solo aparecen si hay algo que mirar. Una fila de ceros
     permanente enseña a no mirarla, y entonces el día que deja de ser cero
     tampoco se mira. */
  /* Los tres avisos salían del mismo oro, y no son lo mismo: dos son gente que
     todavía se puede recuperar —un correo sin confirmar se vuelve a mandar— y
     el tercero es alguien que ya se va. La nomenclatura de color lo separa sin
     una palabra más: oro lo que hay que mirar, coral lo que se pierde. */
  const avisos = [
    (r.sin_confirmar || 0) > 0
      ? { n: r.sin_confirmar, k: "ojo", t: "sin confirmar el correo", d: "se registraron y nunca pulsaron el enlace" }
      : null,
    (r.nunca_abrieron || 0) > 0
      ? { n: r.nunca_abrieron, k: "ojo", t: "nunca abrieron la app", d: "tienen cuenta y jamás entraron" }
      : null,
    (r.pidieron_borrado || 0) > 0
      ? { n: r.pidieron_borrado, k: "mal", t: "pidieron borrar su cuenta", d: "en el plazo de 30 días para arrepentirse" }
      : null
  ].filter(Boolean);

  caja.innerHTML = panelPruebasHTML() + panelFiestasHTML() + `
    ${avisos.length ? `<div class="panel">
      <h3>Para mirar</h3>
      <div class="pn-avisos">
        ${avisos.map(a => `<div class="pn-aviso ${a.k}">
            <b>${a.n}</b>
            <span>${escapeHtml(a.t)}</span>
            <i>${escapeHtml(a.d)}</i>
          </div>`).join("")}
      </div>
    </div>` : ""}

    <div class="panel">
      <h3>El embudo</h3>
      <p class="settings-note">Cada paso es un trozo del anterior. El escalón donde más gente se cae es el que hay que arreglar primero — y casi nunca es el que uno cree.</p>
      ${panelEmbudo(m.embudo)}
    </div>

    <div class="panel">
      <h3>La gente</h3>
      <div class="pn-kpis">
        ${panelCifra(r.cuentas || 0, "Cuentas creadas")}
        ${panelCifra(r.activos7 || 0, "Activos esta semana", "abrieron en 7 días")}
        ${panelDeCada(r.siguen30 || 0, r.maduros || 0, "Siguen tras 30 días", 20)}
        ${panelDeCada(r.volvieron || 0, r.abrieron || 0, "Volvieron otro día", 40)}
        ${panelCifra(r.dias_medios || 0, "Días de uso por persona", "cuántos días distintos abre cada quien")}
        ${panelCifra(r.aperturas7 || 0, "Aperturas esta semana", "veces que se abrió, en total")}
      </div>
    </div>

    <div class="panel">
      <h3>Los últimos 14 días</h3>
      <p class="settings-note">Dos líneas sobre la misma escala: la de arriba son las personas que abrieron la app, la punteada las cuentas nuevas de ese día. Que la segunda vaya casi siempre por abajo es el dato, no un problema de la gráfica. Las líneas verticales marcan cada lunes, para comparar una semana con otra.</p>
      ${panelConstelacion(m.dias)}
    </div>

    <div class="panel">
      <h3>Cómo la usan</h3>
      <div class="pn-donas">
        <div>
          <h4 class="pn-sub">Desde qué aparato</h4>
          ${panelDona(m.aparatos, "grupo", "personas", "Nadie ha abierto la app todavía.")}
          <p class="settings-note" style="margin-top:8px">Sale del ancho de la ventana, no de fichar el aparato: dos teléfonos distintos cuentan como uno.</p>
        </div>
        <div>
          <h4 class="pn-sub">Instalada o en el navegador</h4>
          ${panelDona(m.instalacion, "grupo", "personas", "Nadie ha abierto la app todavía.")}
          <p class="settings-note" style="margin-top:8px">Instalada se abre sola; en una pestaña se olvida. Señal buena: 30 de cada 100.</p>
        </div>
      </div>
      <h4 class="pn-sub" style="margin-top:18px">Cuánto llevan con cuenta</h4>
      ${panelListaBarras(m.antiguedad, "tramo", "personas", "Todavía no hay ninguna cuenta.")}
    </div>

    <div class="panel">
      <h3>El cobro</h3>
      ${c.desplegado === false
        ? `<p class="settings-note">El cobro todavía no está puesto en el servidor, así que aquí no hay nada que contar. Cuando corras <code>planes.sql</code> y despliegues Stripe, esta caja se llena sola — los pasos están en <code>supabase/LEEME.md</code>.</p>`
        : `<div class="pn-kpis">
             ${panelCifra(c.pagando || 0, "Pagando ahora")}
             ${panelCifra("$" + (c.mrr || 0), "Al mes", "sin contar fundador")}
             ${panelCifra(c.lugares_fundador == null ? "—" : c.lugares_fundador, "Lugares de fundador", "de 200")}
           </div>
           ${panelListaBarras(c.planes, "plan", "personas", "Todavía no hay ninguna suscripción.",
               /* «Plan mensual» y no «mensual». La palabra suelta obliga a
                  adivinar de qué se está hablando, y en la única caja de la
                  app donde se cuenta dinero eso no puede pasar. Fundador
                  lleva su nombre sin «Plan» delante porque no es una
                  suscripción: es un pago único, y llamarlo plan lo mete en el
                  mismo saco que los otros dos. */
               (k) => ({ mensual: "Plan mensual", anual: "Plan anual", fundador: "Fundador" })[k] || k,
               /* Cada uno con su color, el mismo que ya usa la app: menta los
                  que se renuevan y lila el fundador, que es el color de su
                  anillo y de su piedra desde 0.7.15. Así la barra se reconoce
                  antes de leer el rótulo. */
               (k) => k === "fundador" ? "t-lila" : "t-menta")}`}
    </div>

    <div class="panel">
      <h3>Con qué versión se quedó cada quien</h3>
      <p class="settings-note">Una fila por persona: <strong>la última versión que vio</strong>, no todas las que ha usado nunca. Si aquí aparece una que ya no existe, hay alguien pegado a una copia vieja — casi siempre porque no se subió el número de <code>CACHE</code> en <code>sw.js</code>.</p>
      ${panelListaBarras(m.versiones, "version", "personas", "Nadie ha abierto la app en los últimos treinta días.",
          null,
          /* Las barras oscuras y solo la de hoy destacada, que es lo que pidió
             Eduardo. Con todas en menta, la fila que importa —cuánta gente ya
             estrenó lo último— había que buscarla leyendo los números uno por
             uno, y son quince o veinte. `VERSION` es la constante que esta
             pestaña está ejecutando, así que la marca se mueve sola con cada
             publicación y no hay una segunda lista que actualizar. */
          (v) => (typeof VERSION !== "undefined" && v === VERSION) ? "t-bien" : "")}
    </div>

    ${panelReportesHTML(tropiezos)}

    <div class="panel">
      <div class="pn-cab">
        <h3>Lo que se rompe solo</h3>
        <span class="pn-cuenta${autos.length && autoSinVer ? " nuevo" : ""}">${autos.length} ${autos.length === 1 ? "error" : "errores"}</span>
      </div>
      <p class="settings-note">Los que caza la app por su cuenta. Cada fila es un error distinto de un día, con las veces que pasó: se agrupan a propósito, porque un fallo dentro de un bucle escribiría miles de filas iguales. Lo que escribe una persona va arriba, en su propia caja.</p>
      ${autos.length
        ? `<div class="pn-errores">` + autos.map(t => `
            <div class="pn-error ${t.visto ? "visto" : ""}">
              <div class="pn-error-tit">
                <b>${escapeHtml(String(t.mensaje))}</b>
                <span>${t.cuantos}×</span>
              </div>
              <div class="pn-error-pie">${escapeHtml(String(t.dia))} · v${escapeHtml(String(t.version) || "?")} · ${escapeHtml(String(t.donde) || "?")}</div>
            </div>`).join("") + `</div>`
        : `<p class="settings-note">Ni un error en los últimos treinta días.</p>`}
      ${sinVer ? `<button class="btn btn-soft btn-block" style="margin-top:12px" onclick="marcarTropiezosVistos()">Dar por vistos los ${sinVer} nuevos</button>` : ""}
    </div>

    <div class="panel">
      <!-- La clave de los colores va al FINAL y no arriba. Es una referencia:
           se consulta la primera vez y las dos que uno se olvida, y puesta
           encima de los números sería un bloque de texto antes de lo que se
           viene a ver — el mismo motivo por el que las cifras de la gráfica
           bajaron debajo del dibujo. -->
      <div class="pn-clave">
        <span><i class="bien"></i>llega a la vara</span>
        <span><i class="ojo"></i>hay que mirarlo</span>
        <span><i class="mal"></i>se pierde gente</span>
      </div>
      <p class="settings-note">Lo demás va en tinta normal a propósito: es un dato, no un juicio. Un número sin una vara contra la que compararse no puede estar bien ni mal.</p>
      <p class="settings-note" style="margin:0">Números tomados ${escapeHtml(String(m.al_momento || "").slice(0, 16).replace("T", " a las "))}.</p>
      <button class="btn btn-linea btn-block" style="margin-top:10px" onclick="cargarMetricas()">Volver a pedirlos</button>
    </div>`;
}

async function cargarMetricas() {
  const caja = document.getElementById("panel-admin");
  if (caja) caja.innerHTML = `<div class="panel"><p class="settings-note">Pidiendo los números…</p></div>`;
  try {
    metricasCache = await sbMetricas();
    renderPanelAdmin();
  } catch (e) {
    /* Aquí sí se enseña el error, al revés que en el latido: quien abrió el
       panel está esperando algo y merece saber por qué no llegó. */
    if (caja) {
      caja.innerHTML = `<div class="panel">
          <h3>No pude traer los números</h3>
          <p class="settings-note">${escapeHtml(e.message || String(e))}</p>
          <button class="btn btn-linea btn-block" onclick="cargarMetricas()">Intentar otra vez</button>
        </div>`;
    }
  }
}

async function marcarTropiezosVistos() {
  try {
    await sbTropiezosVistos();
    metricasCache = null;
    await cargarMetricas();
    toast("Errores dados por vistos", "hecho");
  } catch (e) {
    toast(e.message || String(e), "atencion");
  }
}
