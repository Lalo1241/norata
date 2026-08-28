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
}

/* ---- Piezas de dibujo ----
   Todo se dibuja a mano con SVG y CSS. No hay librería de gráficas y no la va
   a haber: meter una obligaría a un empaquetador, y Norata no tiene ninguno
   a propósito. Cuatro barras y un número grande no necesitan trescientos
   kilobytes. */

function panelCifra(valor, rotulo, pista) {
  return `<div class="pn-kpi">
      <b>${escapeHtml(String(valor))}</b>
      <span>${escapeHtml(rotulo)}</span>
      ${pista ? `<i>${escapeHtml(pista)}</i>` : ""}
    </div>`;
}

/* De cuántos, cuántos — con el divisor a la vista. Un «3 siguen» no significa
   nada sin saber de cuántos: puede ser estupendo o ser un desastre. */
function panelDeCada(parte, total, rotulo, pista) {
  const p = total > 0 ? Math.round((parte / total) * 100) : 0;
  const texto = total > 0 ? p + "%" : "—";
  return `<div class="pn-kpi">
      <b>${texto}</b>
      <span>${escapeHtml(rotulo)}</span>
      <i>${total > 0 ? parte + " de " + total : "todavía sin datos"}${pista ? " · " + escapeHtml(pista) : ""}</i>
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

  const W = 340, H = 152;
  const izq = 14, der = 14, arr = 14, aba = 34;
  const util = W - izq - der;
  const alto = H - arr - aba;
  const suelo = arr + alto;

  const n = dias.length;
  const tope = Math.max(...dias.map(d => Number(d.personas) || 0), 1);
  const topeAltas = Math.max(...dias.map(d => Number(d.altas) || 0), 1);
  const hayAltas = dias.some(d => (Number(d.altas) || 0) > 0);

  /* Con un solo día no hay recta que trazar: el punto va al centro, que es
     donde se lee como «esto es lo que hay» y no como el principio de algo. */
  const x = (i) => n === 1 ? izq + util / 2 : izq + (i * util) / (n - 1);
  const y = (v) => arr + (1 - (Number(v) || 0) / tope) * alto;

  const fecha = (s) => new Date(String(s) + "T00:00:00");

  const reja = [0, 0.5, 1].map(f =>
    `<line x1="${izq}" y1="${(arr + f * alto).toFixed(1)}" x2="${W - der}" y2="${(arr + f * alto).toFixed(1)}" class="pn-reja"/>`
  ).join("");

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

  /* Las altas del día, al fondo y en su propia escala. Van detrás de la
     constelación porque son el contexto —de dónde salió la gente— y no la
     cifra que se viene a mirar. */
  const barrasAltas = !hayAltas ? "" : dias.map((d, i) => {
    const v = Number(d.altas) || 0;
    if (v <= 0) return "";
    const h = Math.max((v / topeAltas) * (alto * 0.42), 3);
    const an = Math.max(util / n * 0.42, 2.5);
    return `<rect x="${(x(i) - an / 2).toFixed(1)}" y="${(suelo - h).toFixed(1)}"
              width="${an.toFixed(1)}" height="${h.toFixed(1)}" rx="1.2"
              class="pn-alta"><title>${escapeHtml(String(d.dia))}: ${v} ${v === 1 ? "cuenta nueva" : "cuentas nuevas"}</title></rect>`;
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
         <span><i class="pn-mu-punto"></i> personas que abrieron</span>
         <span><i class="pn-mu-barra"></i> cuentas nuevas</span>
       </div>`
    : "";

  return `<svg class="pn-cielo" viewBox="0 0 ${W} ${H}" role="img"
            aria-label="Personas activas y cuentas nuevas cada día durante los últimos catorce días">
      ${reja}
      ${marcas}
      ${barrasAltas}
      <polyline points="${hilo}" class="pn-hilo"/>
      ${estrellas}
      ${fechas}
    </svg>
    ${pie}
    <p class="settings-note" style="margin-top:6px">Máximo del periodo: ${tope} ${tope === 1 ? "persona" : "personas"} en un día.</p>`;
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

  return `<div class="pn-embudo">` + ps.map((p, i) => {
    const ancho = Math.max((p.n / tope) * 100, p.n > 0 ? 4 : 0);
    const antes = i > 0 ? ps[i - 1].n : null;
    /* Solo se marca la caída cuando hay gente que perder. Escribir «−0%»
       debajo de un cero es ruido con aire de dato. */
    const cae = (antes && antes > 0) ? Math.round(((antes - p.n) / antes) * 100) : 0;
    return `<div class="pn-paso">
        <div class="pn-paso-tit">
          <span>${escapeHtml(p.paso)}</span>
          <b>${p.n}</b>
        </div>
        <div class="pn-paso-riel"><i style="width:${ancho.toFixed(1)}%"></i></div>
        ${(i > 0 && cae > 0)
          ? `<div class="pn-caida">se pierde el ${cae}% del paso anterior</div>`
          : (i > 0 ? `<div class="pn-caida ok">no se pierde nadie</div>` : "")}
      </div>`;
  }).join("") + `</div>`;
}

/* Barras horizontales para lo que es una lista con pesos: versiones, planes. */
function panelListaBarras(filas, claveNombre, claveValor, vacio) {
  if (!filas || !filas.length) return `<p class="settings-note">${escapeHtml(vacio)}</p>`;
  const tope = Math.max(...filas.map(f => Number(f[claveValor]) || 0), 1);
  return `<div class="pn-lista">` + filas.map(f => {
    const v = Number(f[claveValor]) || 0;
    const nombre = String(f[claveNombre] || "—") || "(sin dato)";
    return `<div class="pn-fila">
        <span class="pn-nom">${escapeHtml(nombre)}</span>
        <span class="pn-riel"><i style="width:${Math.round((v / tope) * 100)}%"></i></span>
        <span class="pn-val">${v}</span>
      </div>`;
  }).join("") + `</div>`;
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
    caja.innerHTML = panelPruebasHTML() + `<div class="panel">
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

  /* Los avisos solo aparecen si hay algo que mirar. Una fila de ceros
     permanente enseña a no mirarla, y entonces el día que deja de ser cero
     tampoco se mira. */
  const avisos = [
    (r.sin_confirmar || 0) > 0
      ? { n: r.sin_confirmar, t: "sin confirmar el correo", d: "se registraron y nunca pulsaron el enlace" }
      : null,
    (r.nunca_abrieron || 0) > 0
      ? { n: r.nunca_abrieron, t: "nunca abrieron la app", d: "tienen cuenta y jamás entraron" }
      : null,
    (r.pidieron_borrado || 0) > 0
      ? { n: r.pidieron_borrado, t: "pidieron borrar su cuenta", d: "en el plazo de 30 días para arrepentirse" }
      : null
  ].filter(Boolean);

  caja.innerHTML = panelPruebasHTML() + `
    ${avisos.length ? `<div class="panel">
      <h3>Para mirar</h3>
      <div class="pn-avisos">
        ${avisos.map(a => `<div class="pn-aviso">
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
        ${panelDeCada(r.siguen30 || 0, r.maduros || 0, "Siguen tras 30 días", "señal buena: 20%")}
        ${panelDeCada(r.volvieron || 0, r.abrieron || 0, "Volvieron otro día", "señal buena: 40%")}
        ${panelCifra(r.dias_medios || 0, "Días de uso por persona", "cuántos días distintos abre cada quien")}
        ${panelCifra(r.aperturas7 || 0, "Aperturas esta semana", "veces que se abrió, en total")}
      </div>
    </div>

    <div class="panel">
      <h3>Los últimos 14 días</h3>
      <p class="settings-note">Los puntos son personas que abrieron la app; las barras del fondo, cuentas nuevas. Las líneas verticales marcan cada lunes, para comparar una semana con otra.</p>
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
           ${panelListaBarras(c.planes, "plan", "personas", "Todavía no hay ninguna suscripción.")}`}
    </div>

    <div class="panel">
      <h3>Con qué versión se quedó cada quien</h3>
      <p class="settings-note">Una fila por persona: <strong>la última versión que vio</strong>, no todas las que ha usado nunca. Si aquí aparece una que ya no existe, hay alguien pegado a una copia vieja — casi siempre porque no se subió el número de <code>CACHE</code> en <code>sw.js</code>.</p>
      ${panelListaBarras(m.versiones, "version", "personas", "Nadie ha abierto la app en los últimos treinta días.")}
    </div>

    <div class="panel">
      <h3>Lo que se rompe${sinVer ? ` <span class="pn-globo">${sinVer}</span>` : ""}</h3>
      <p class="settings-note">Cada fila es un error distinto de un día, con las veces que pasó. Se agrupan a propósito: un fallo dentro de un bucle escribiría miles de filas iguales. Los que llevan el bicho los escribió una persona: ésos van primero y valen más — traen contexto de lo que estaba intentando hacer, que es lo que un volcado de JavaScript nunca dice.</p>
      ${tropiezos.length
        ? `<div class="pn-errores">` + [...tropiezos].sort((a, b) => {
            /* Los reportes de gente arriba; dentro de cada grupo se respeta el
               orden que ya trae el servidor (por día y por veces). Sin esto se
               enterraban entre cien errores automáticos, que es exactamente lo
               que no le puede pasar a un mensaje que alguien se tomó la
               molestia de escribir. */
            const ra = a.donde === "reporte" ? 0 : 1, rb = b.donde === "reporte" ? 0 : 1;
            return ra - rb;
          }).map(t => `
            <div class="pn-error ${t.visto ? "visto" : ""}${t.donde === "reporte" ? " dicho" : ""}">
              <div class="pn-error-tit">
                <b>${t.donde === "reporte" ? icon("bicho", 14) + " " : ""}${escapeHtml(String(t.mensaje))}</b>
                <span>${t.cuantos}×</span>
              </div>
              <div class="pn-error-pie">${escapeHtml(String(t.dia))} · v${escapeHtml(String(t.version) || "?")} · ${
                t.donde === "reporte" ? "lo escribió alguien" : escapeHtml(String(t.donde) || "?")}</div>
            </div>`).join("") + `</div>
           ${sinVer ? `<button class="btn btn-soft btn-block" style="margin-top:12px" onclick="marcarTropiezosVistos()">Dar por vistos los ${sinVer} nuevos</button>` : ""}`
        : `<p class="settings-note">Ni un error en los últimos treinta días.</p>`}
    </div>

    <div class="panel">
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
