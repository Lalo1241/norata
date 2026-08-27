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
function panelConstelacion(dias) {
  if (!dias || !dias.length) {
    return `<p class="settings-note">Todavía no hay ni un día con actividad. Aparecerá en cuanto alguien abra la app con su cuenta.</p>`;
  }

  const W = 340, H = 132;
  const izq = 12, der = 12, arr = 16, aba = 28;
  const util = W - izq - der;
  const alto = H - arr - aba;

  const n = dias.length;
  const tope = Math.max(...dias.map(d => Number(d.personas) || 0), 1);

  /* Con un solo día no hay recta que trazar: el punto va al centro, que es
     donde se lee como «esto es lo que hay» y no como el principio de algo. */
  const x = (i) => n === 1 ? izq + util / 2 : izq + (i * util) / (n - 1);
  const y = (v) => arr + (1 - (Number(v) || 0) / tope) * alto;

  const reja = [0, 0.5, 1].map(f =>
    `<line x1="${izq}" y1="${(arr + f * alto).toFixed(1)}" x2="${W - der}" y2="${(arr + f * alto).toFixed(1)}" class="pn-reja"/>`
  ).join("");

  const pts = dias.map((d, i) => [x(i), y(d.personas)]);
  const hilo = pts.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");

  const estrellas = dias.map((d, i) => {
    const v = Number(d.personas) || 0;
    /* Un día sin nadie no se borra: se apaga. Un hueco en la línea se lee
       como «falta el dato», y un punto tenue como «ese día no vino nadie»,
       que es lo que de verdad pasó. */
    const clase = v === 0 ? "vacia" : (v === tope ? "cima" : "");
    const r = v === 0 ? 2.2 : (v === tope ? 4.6 : 3.4);
    return `<circle cx="${pts[i][0].toFixed(1)}" cy="${pts[i][1].toFixed(1)}" r="${r}" class="pn-estrella ${clase}"><title>${escapeHtml(String(d.dia))}: ${v}</title></circle>`;
  }).join("");

  /* El día se escribe solo cada tres, o en un teléfono los números se
     encaraman unos sobre otros y no se lee ninguno. */
  const fechas = dias.map((d, i) =>
    (i % 3 === 0 || i === n - 1)
      ? `<text x="${x(i).toFixed(1)}" y="${H - 9}" class="pn-eje">${escapeHtml(String(d.dia).slice(8, 10))}</text>`
      : ""
  ).join("");

  return `<svg class="pn-cielo" viewBox="0 0 ${W} ${H}" role="img"
            aria-label="Personas activas cada día durante los últimos catorce días">
      ${reja}
      <polyline points="${hilo}" class="pn-hilo"/>
      ${estrellas}
      ${fechas}
    </svg>
    <p class="settings-note" style="margin-top:6px">Máximo del periodo: ${tope} ${tope === 1 ? "persona" : "personas"} en un día.</p>`;
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
        <button class="btn btn-soft btn-block" onclick="cargarMetricas()">Cargar los números</button>
      </div>`;
    return;
  }

  const r = m.resumen || {};
  const c = m.cobro || {};
  const tropiezos = m.tropiezos || [];
  const sinVer = tropiezos.filter(t => !t.visto).length;

  caja.innerHTML = panelPruebasHTML() + `
    <div class="panel">
      <h3>La gente</h3>
      <div class="pn-kpis">
        ${panelCifra(r.cuentas || 0, "Cuentas creadas")}
        ${panelCifra(r.activos7 || 0, "Activos esta semana", "abrieron en 7 días")}
        ${panelDeCada(r.siguen30 || 0, r.maduros || 0, "Siguen tras 30 días", "señal buena: 20%")}
        ${panelDeCada(r.volvieron || 0, r.abrieron || 0, "Volvieron otro día", "señal buena: 40%")}
        ${panelDeCada(r.instalaron || 0, r.abrieron || 0, "La instalaron", "señal buena: 30%")}
        ${panelDeCada(r.dos_aparatos || 0, r.abrieron || 0, "Teléfono y compu", "señal buena: 25%")}
      </div>
    </div>

    <div class="panel">
      <h3>Los últimos 14 días</h3>
      <p class="settings-note">Cuántas personas distintas abrieron la app cada día. Aquí se ve si una tanda de invitaciones movió algo, y si el movimiento duró más de dos días.</p>
      ${panelConstelacion(m.dias)}
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
      <h3>Qué versión corre la gente</h3>
      <p class="settings-note">Si aquí aparece una versión que ya no existe, hay un aparato pegado a una copia vieja — casi siempre porque no se subió el número de <code>CACHE</code> en <code>sw.js</code>.</p>
      ${panelListaBarras(m.versiones, "version", "personas", "Nadie ha abierto la app en los últimos siete días.")}
    </div>

    <div class="panel">
      <h3>Lo que se rompe${sinVer ? ` <span class="pn-globo">${sinVer}</span>` : ""}</h3>
      <p class="settings-note">Cada fila es un error distinto de un día, con las veces que pasó. Se agrupan a propósito: un fallo dentro de un bucle escribiría miles de filas iguales.</p>
      ${tropiezos.length
        ? `<div class="pn-errores">` + tropiezos.map(t => `
            <div class="pn-error ${t.visto ? "visto" : ""}">
              <div class="pn-error-tit">
                <b>${escapeHtml(String(t.mensaje))}</b>
                <span>${t.cuantos}×</span>
              </div>
              <div class="pn-error-pie">${escapeHtml(String(t.dia))} · v${escapeHtml(String(t.version) || "?")} · ${escapeHtml(String(t.donde) || "?")}</div>
            </div>`).join("") + `</div>
           ${sinVer ? `<button class="btn btn-soft btn-block" style="margin-top:12px" onclick="marcarTropiezosVistos()">Dar por vistos los ${sinVer} nuevos</button>` : ""}`
        : `<p class="settings-note">Ni un error en los últimos treinta días.</p>`}
    </div>

    <div class="panel">
      <p class="settings-note" style="margin:0">Números tomados ${escapeHtml(String(m.al_momento || "").slice(0, 16).replace("T", " a las "))}.</p>
      <button class="btn btn-soft btn-block" style="margin-top:10px" onclick="cargarMetricas()">Volver a pedirlos</button>
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
          <button class="btn btn-soft btn-block" onclick="cargarMetricas()">Intentar otra vez</button>
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
