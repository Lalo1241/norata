/* La pantalla de informes. Fase 2 de la reforma de los paneles.
 *
 * Lo que decidió Eduardo el 27 de agosto de 2026, y que explica casi todo lo
 * que hay aquí:
 *
 *   1. UNA sola pantalla, pero NUNCA un informe único. Con datos de un año,
 *      un informe general sería ilegible. Así que son informes cortos por
 *      rama, con **tope duro de seis gráficas**, y «Todo» resume en vez de
 *      sumar: es una portada con accesos, no un vertedero.
 *   2. Se entra por la rama desde la que se tocó el botón. Nunca se cae en un
 *      índice a buscar lo que se venía a ver.
 *   3. El tamaño de la pantalla decide la forma, NUNCA el contenido. Aquí eso
 *      significa que nada se esconde en el teléfono: lo que no cabe se
 *      desplaza de lado dentro de su caja.
 *   4. El día es de todos —el panel de cada módulo ya es el informe del día—
 *      y de la semana en adelante es de pago. Quien no paga no se topa con un
 *      muro: ve la portada de su propia semana con sus números de verdad.
 *
 * Los números NO se calculan aquí: salen todos de `js/10f-informes.js`, que
 * es el mismo motor que alimenta las flechas del panel. Es a propósito — si
 * cada pantalla hiciera sus cuentas, acabarían discutiendo entre ellas
 * delante del usuario.
 */

let informeRamaActual = "todo";
let informePeriodoActual = "semana";
/* De dónde se entró, para que la flecha de atrás devuelva ahí. Sin esto,
   volver desde el informe de Talentos te dejaba en Resumen. */
let informeVengoDe = "summary";

const INFORME_RAMAS = [
  { id: "todo", nombre: "Todo", icono: "compass" },
  { id: "misiones", nombre: "Misiones", icono: "check" },
  { id: "habilidades", nombre: "Habilidades", icono: "chart" },
  { id: "talentos", nombre: "Talentos", icono: "star" },
  { id: "proyectos", nombre: "Proyectos", icono: "flag" }
];

function abrirInforme(rama) {
  informeRamaActual = INFORME_RAMAS.some(r => r.id === rama) ? rama : "todo";
  informeVengoDe = activeMainView || "summary";
  showView("informe");
  renderInforme();
}

function volverDeInforme() {
  showView(informeVengoDe || "summary");
}

function informeVerRama(rama) {
  informeRamaActual = rama;
  renderInforme();
  const c = document.getElementById("informe-cuerpo");
  if (c) c.scrollIntoView({ block: "start", behavior: "auto" });
}

/* El periodo se conserva al saltar de rama: si estabas mirando el mes, sigues
   en el mes. Cambiarlo por debajo obligaría a volver a elegirlo cinco veces
   para leer el mismo mes en las cinco ramas. */
function informeVerPeriodo(p) {
  if (!planIncluyeResumen(p)) { topeAlcanzado("resumen"); return; }
  informePeriodoActual = p;
  renderInforme();
}

/* ================= Piezas de dibujo =================

   Todo se dibuja con SVG a mano y leyendo las variables del CSS, igual que el
   árbol de talentos. Dos reglas de la casa que aquí mandan más que en ningún
   otro sitio, porque una gráfica es justo donde se rompen:

   - Una superficie llena se pinta con `pinta()`; una LÍNEA o un aro, con
     `trazo()`. Lo que decide no es si parece relleno, es cuánta superficie
     ocupa: una raya de 2 px con el pastel de noche no se ve de día.
   - Ningún color se escribe suelto: salen de `:root`, así que el modo claro
     los cambia sin que haya que redibujar nada.

   Y ninguna gráfica se dibuja vacía. Cuando no hay datos suficientes sale una
   frase que dice que eso se llena solo — un dibujo hueco parece una app rota
   y además no se puede leer. */

function gVacia(texto) {
  return `<p class="inf-vacia">${escapeHtml(texto)}</p>`;
}

/* Barras verticales. Para series cortas donde el eje horizontal significa
   algo: los días de la semana, las horas del día. */
function gBarras(datos, opciones) {
  const op = opciones || {};
  if (!datos.length || !datos.some(d => d.v > 0)) return gVacia(op.vacia || "Todavía no hay nada que dibujar aquí.");
  const max = Math.max(...datos.map(d => d.v));
  const color = op.color || "var(--mint)";
  return `
    <div class="inf-barras" style="--inf-alto:${op.alto || 110}px">
      ${datos.map(d => `
        <div class="ib-col" title="${escapeAttr(d.titulo || (d.k + ": " + d.v))}">
          <span class="ib-v">${d.v > 0 ? escapeHtml(String(d.etiqueta !== undefined ? d.etiqueta : d.v)) : ""}</span>
          <span class="ib-barra"><i style="height:${max ? Math.max(2, Math.round(d.v / max * 100)) : 0}%;background:${d.color || color}"></i></span>
          <span class="ib-k">${escapeHtml(d.k)}</span>
        </div>`).join("")}
    </div>`;
}

/* Barras horizontales, para rankings: los nombres se leen de corrido y caben
   los largos, que en vertical se parten en cuatro renglones. */
function gBarrasH(datos, opciones) {
  const op = opciones || {};
  if (!datos.length) return gVacia(op.vacia || "Todavía no hay nada que dibujar aquí.");
  const max = Math.max(...datos.map(d => d.v), 1);
  return `
    <div class="inf-rank">
      ${datos.map(d => `
        <div class="ir-fila">
          <span class="ir-k">${escapeHtml(d.k)}</span>
          <span class="ir-barra"><i style="width:${Math.max(2, Math.round(d.v / max * 100))}%;background:${d.color || "var(--mint)"}"></i></span>
          <span class="ir-v">${escapeHtml(String(d.etiqueta !== undefined ? d.etiqueta : d.v))}</span>
        </div>`).join("")}
    </div>`;
}

/* Una barra apilada al 100%: reparte un todo en porciones. Es la forma
   correcta para «de dónde sale mi XP» y «dónde puse la energía», porque la
   pregunta es de proporción y no de cantidad. Lleva su leyenda debajo: sin
   ella, ocho colores sin nombre no dicen nada. */
function gApilada(partes, opciones) {
  const op = opciones || {};
  const total = partes.reduce((a, p) => a + p.v, 0);
  if (!total) return gVacia(op.vacia || "Todavía no hay nada que repartir.");
  const vivas = partes.filter(p => p.v > 0);
  return `
    <div class="inf-apilada">
      ${vivas.map(p => `<i style="width:${(p.v / total * 100).toFixed(2)}%;background:${p.color}" title="${escapeAttr(p.k + ": " + (op.fmt ? op.fmt(p.v) : p.v))}"></i>`).join("")}
    </div>
    <div class="inf-leyenda">
      ${vivas.map(p => `
        <span class="il-item">
          <i style="background:${p.color}"></i>
          <b>${escapeHtml(p.k)}</b>
          <span>${escapeHtml(op.fmt ? op.fmt(p.v) : String(p.v))} · ${Math.round(p.v / total * 100)}%</span>
        </span>`).join("")}
    </div>`;
}

/* Un aro con su cifra dentro. El arco va en `trazo()` y no en `pinta()`
   aunque parezca relleno: son cuatro píxeles de ancho, y con el tono pastel
   sobre papel se pierde. */
function gAro(pct, texto, pie, color) {
  const c = color || "var(--mint)";
  const p = Math.max(0, Math.min(100, pct || 0));
  return `
    <div class="inf-aro">
      <div class="ring-wrap" style="width:104px;height:104px">
        ${/* ring() cuenta el arco en fracción, no en porcentaje: con 86 en vez de
              0,86 la vuelta se da entera y el aro sale siempre lleno. */
          ring(104, 9, [{ pct: p / 100, color: c }], "var(--carril)")}
        <div class="ring-center">
          <div class="v" style="font-size:21px"><b>${escapeHtml(texto)}</b></div>
        </div>
      </div>
      <p class="inf-aro-pie">${escapeHtml(pie)}</p>
    </div>`;
}


/* ================= Piezas de los periodos largos (fase 3) =================

   Tres gráficas que en una semana no dicen nada y en un año lo dicen todo, así
   que solo salen cuando el periodo da para ellas. Es la otra mitad del tope de
   seis: no se trata de tener seis siempre, sino de que ninguna sobre. */

/* El mapa de calor. Una casilla por día, en columnas de semana —cada columna
   es un domingo-a-sábado, igual que el resto de la app— y las filas son los
   días de la semana.

   La primera columna casi nunca empieza en domingo, así que se rellena con
   huecos: sin ellos, todo el calendario queda corrido y un martes aparece en
   la fila del jueves. Es el fallo clásico de esta gráfica. */
function gMapaCalor(dias, cuentas, opciones) {
  const op = opciones || {};
  if (!dias.length) return gVacia(op.vacia || "Todavía no hay días que pintar.");
  const valores = dias.map(k => cuentas.get(k) || 0);
  const max = Math.max(...valores, 1);
  if (!valores.some(v => v > 0)) return gVacia(op.vacia || "En cuanto cumplas misiones, aquí se llena el calendario.");

  /* Cinco escalones y no una rampa continua: con un degradado, dos días de
     esfuerzo muy distinto acaban del mismo color y el mapa deja de contar
     nada. El cero usa el carril, que es el tono pensado justo para dejar ver
     por dónde va lo lleno. */
  const ESCALA = ["var(--carril)", velo("#5fe0b0", "44"), velo("#5fe0b0", "77"),
    velo("#5fe0b0", "bb"), pinta("#5fe0b0")];
  const nivel = (n) => n <= 0 ? 0 : Math.min(4, Math.ceil(n / max * 4));

  const huecos = weekdayOfKey(dias[0]);
  const celdas =
    Array.from({ length: huecos }, () => `<i class="mc-hueco"></i>`).join("") +
    dias.map((k, i) => {
      const n = valores[i];
      return `<i style="background:${ESCALA[nivel(n)]}" title="${escapeAttr(k + ": " + n + (n === 1 ? " marca" : " marcas"))}"></i>`;
    }).join("");

  return `
    <div class="inf-calor-caja">
      <div class="inf-calor">${celdas}</div>
    </div>
    <div class="inf-escala">
      <span>Menos</span>
      ${ESCALA.map(c => `<i style="background:${c}"></i>`).join("")}
      <span>Más</span>
    </div>`;
}

/* Líneas acumuladas. La pregunta es la forma de la curva —si una habilidad se
   despegó o se quedó plana—, no el número exacto de ningún día, así que no
   lleva ejes: llevan nombre y color, que es lo que hace falta para leerla.

   El trazo va por `trazo()` y no por `pinta()` aunque el color sea el de la
   habilidad: son dos píxeles de línea, y con el tono pastel sobre papel
   desaparecen. Es la regla de la casa y aquí es donde más se nota. */
function gLineas(series, opciones) {
  const op = opciones || {};
  const vivas = series.filter(s => s.valores.some(v => v > 0));
  if (!vivas.length) return gVacia(op.vacia || "Todavía no hay suficiente historia para dibujar una curva.");

  const W = 300, H = 110, P = 3;
  const n = vivas[0].valores.length;
  const max = Math.max(...vivas.map(s => Math.max(...s.valores)), 1);
  const x = (i) => (n <= 1 ? 0 : (i / (n - 1)) * (W - P * 2)) + P;
  const y = (v) => H - P - (v / max) * (H - P * 2);

  return `
    <svg class="inf-lineas" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img"
      aria-label="Curvas de XP acumulado por habilidad">
      ${vivas.map(s => `<polyline fill="none" stroke="${trazo(s.color)}" stroke-width="2"
        stroke-linejoin="round" stroke-linecap="round"
        points="${s.valores.map((v, i) => x(i).toFixed(1) + "," + y(v).toFixed(1)).join(" ")}"/>`).join("")}
    </svg>
    <div class="inf-leyenda">
      ${vivas.map(s => `<span class="il-item"><i style="background:${pinta(s.color)}"></i><b>${escapeHtml(s.nombre)}</b><span>${escapeHtml(fmtXp(s.valores[s.valores.length - 1]))} XP</span></span>`).join("")}
    </div>`;
}

/* Los días de un rango agrupados en tramos, para que una curva de 365 puntos
   no sea una pared de ruido. Un año se lee por semanas; un mes, por días. */
function tramosDe(r) {
  const dias = diasDe(r);
  if (r.periodo !== "ano") return dias.map(k => [k]);
  const out = [];
  for (let i = 0; i < dias.length; i += 7) out.push(dias.slice(i, i + 7));
  return out;
}

function bloque(titulo, pregunta, cuerpo) {
  return `
    <section class="panel inf-bloque">
      <h3>${escapeHtml(titulo)}</h3>
      ${pregunta ? `<p class="inf-pregunta">${escapeHtml(pregunta)}</p>` : ""}
      ${cuerpo}
    </section>`;
}

/* ================= El armazón ================= */

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio",
  "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/* «Del 23 al 29 de agosto», y no dos fechas completas: el año sobra cuando es
   el de ahora, y repetir el mes cuando es el mismo también. */
function tituloDeRango(r) {
  if (r.periodo === "ano") return "El año " + r.desde.slice(0, 4);
  const d1 = keyToDate(r.desde), d2 = keyToDate(r.hasta);
  if (r.periodo === "mes") return MESES[d1.getMonth()].replace(/^./, c => c.toUpperCase()) + " de " + d1.getFullYear();
  const mismoMes = d1.getMonth() === d2.getMonth();
  return "Del " + d1.getDate() + (mismoMes ? "" : " de " + MESES[d1.getMonth()]) +
    " al " + d2.getDate() + " de " + MESES[d2.getMonth()];
}

function renderInforme() {
  const el = document.getElementById("informe-cuerpo");
  if (!el) return;

  const periodo = planIncluyeResumen(informePeriodoActual) ? informePeriodoActual : "semana";
  const r = rangoDe(periodo, 0);
  const rAntes = rangoDe(periodo, 1);
  const D = datosDeAhora();

  const mandos = `
    <div class="inf-mandos">
      <div class="inf-periodos" role="tablist" aria-label="Periodo del informe">
        ${["semana", "mes", "ano"].map(p => `
          <button role="tab" class="${p === periodo ? "on" : ""}${planIncluyeResumen(p) ? "" : " bajo-llave"}"
            aria-selected="${p === periodo}" onclick="informeVerPeriodo('${p}')">${escapeHtml(PERIODOS[p].nombre)}</button>`).join("")}
      </div>
      <div class="inf-ramas" role="tablist" aria-label="Módulo del informe">
        ${INFORME_RAMAS.map(x => `
          <button role="tab" class="${x.id === informeRamaActual ? "on" : ""}"
            aria-selected="${x.id === informeRamaActual}" onclick="informeVerRama('${x.id}')">${escapeHtml(x.nombre)}</button>`).join("")}
      </div>
    </div>`;

  /* La antesala. Se enseña ANTES de calcular nada de la rama: quien no tiene
     plan ve su propia portada y ahí se acaba el informe. Y ve sus números de
     verdad, no un ejemplo — verlos una vez es lo que explica para qué sirve
     pagar, y son suyos. */
  if (!planIncluyeResumen("semana")) {
    el.innerHTML = mandos + portadaHTML(r, rAntes, D) + antesalaHTML();
    return;
  }

  let html = mandos + `<p class="inf-rango">${escapeHtml(tituloDeRango(r))}</p>`;
  if (informeRamaActual === "todo") html += portadaHTML(r, rAntes, D) + accesosHTML(r, D);
  else if (informeRamaActual === "misiones") html += infMisiones(r, rAntes, D);
  else if (informeRamaActual === "habilidades") html += infHabilidades(r, rAntes, D);
  else if (informeRamaActual === "talentos") html += infTalentos(r, rAntes, D);
  else html += infProyectos(r, rAntes, D);

  el.innerHTML = html;
}

/* ---- La portada: una frase y tres números ----
   Es lo que se recuerda y lo que se cuenta. Va primero en «Todo» y es
   también lo único que ve quien no paga. */
function portadaHTML(r, rAntes, D) {
  const mis = metricasMisiones(r, D), misA = metricasMisiones(rAntes, D);
  const hab = metricasHabilidades(r, D);
  const tal = metricasTalentos(r, D);
  const pro = metricasProyectos(r, D);
  const cerradas = pro.etapas + pro.terminados + tal.completados;

  const v = variacion(mis.marcas, misA.marcas);
  const cola = v.dir === "nueva" ? "Es tu primer periodo con datos."
    : v.dir === "igual" ? "Igual que el periodo anterior."
    : v.dir === "mejor" ? "Mejor que el periodo anterior." : "Menos que el periodo anterior.";

  const frase = mis.marcas || hab.ganada || cerradas
    ? `${tituloDeRango(r)}: cumpliste ${fraseCantidad2(mis.marcas, "misión", "misiones")}, ganaste ${fmtXp(hab.ganada)} XP y cerraste ${fraseCantidad2(cerradas, "cosa", "cosas")}. ${cola}`
    : `${tituloDeRango(r)}: todavía sin movimiento. Esto se llena solo en cuanto empieces a marcar.`;

  /* El repaso de diciembre. Un año no se resume con los mismos tres números
     que una semana: lo que se recuerda de un año es cuánto subiste, cuánto
     aguantaste seguido y cuánto costó todo. Va debajo y no en lugar de los
     tres de arriba, que siguen siendo la respuesta a «¿cómo voy?». */
  const repaso = r.periodo === "ano" ? `
      <div class="inf-tres inf-repaso">
        <div><b>${hab.niveles}</b><span>Niveles subidos</span></div>
        <div><b>${rachaMasLarga(r, D)}</b><span>Tu racha más larga</span></div>
        <div><b>${money(tal.invertido)}</b><span>Invertido en ti</span></div>
      </div>` : "";

  return `
    <section class="panel inf-portada">
      <p class="inf-frase">${escapeHtml(frase)}</p>
      <div class="inf-tres">
        <div><b>${mis.marcas}</b><span>Misiones cumplidas</span></div>
        <div><b>${fmtXp(hab.ganada)}</b><span>XP ganada</span></div>
        <div><b>${cerradas}</b><span>Cosas cerradas</span></div>
      </div>
      ${repaso}
    </section>`;
}

/* La racha más larga dentro del periodo, que no es la misma que la racha
   histórica de `streakInfo`: la del año pasado no cuenta en el repaso de
   éste. Se corta en los bordes a propósito — una racha que viene de diciembre
   se cuenta desde el 1 de enero, porque lo que se está contando es el año. */
function rachaMasLarga(r, D) {
  const datos = D || state;
  const dias = diasDe(r);
  let mejor = 0, run = 0;
  dias.forEach(k => {
    let hubo = false;
    datos.missions.forEach(x => { if (!hubo && missionCount(x, k) > 0) hubo = true; });
    run = hubo ? run + 1 : 0;
    if (run > mejor) mejor = run;
  });
  return mejor;
}

/* «1 misión» y no «1 misiones». La de `05-resumen.js` sirve para otra cosa
   —«su único proyecto»— y devuelve cadena vacía con cero, que aquí es
   justamente un dato que hay que decir. */
function fraseCantidad2(n, singular, plural) {
  return n + " " + (n === 1 ? singular : plural);
}

/* Los cuatro accesos de la portada. «Todo» resume y reparte; el detalle vive
   en su rama. */
function accesosHTML(r, D) {
  const hab = metricasHabilidades(r, D);
  const f = hab.porFuente;
  const energia = gApilada([
    { k: "Misiones", v: f.misiones, color: pinta("#5fe0b0") },
    { k: "Talentos", v: f.talentos, color: pinta("#c7a6ff") },
    { k: "Proyectos", v: f.proyectos, color: pinta("#8ecdf5") },
    { k: "Práctica suelta", v: f.practica, color: pinta("#f5d76e") }
  ], { fmt: (x) => fmtXp(x) + " XP", vacia: "Cuando ganes XP se verá aquí de dónde salió." });

  return bloque("¿Dónde pusiste la energía?",
    "Es la única pregunta que ningún módulo puede contestar solo.", energia) + `
    <div class="inf-accesos">
      ${INFORME_RAMAS.filter(x => x.id !== "todo").map(x => `
        <button class="inf-acceso" onclick="informeVerRama('${x.id}')">
          <b>${escapeHtml(x.nombre)}</b>
          <span>Ver el informe</span>
        </button>`).join("")}
    </div>`;
}

function antesalaHTML() {
  return `
    <section class="panel inf-antesala">
      <h3>Tu semana entera, con ${escapeHtml(NOMBRE_PRO)}</h3>
      <p class="settings-note">
        Arriba están tus números de verdad, los de este periodo. El informe
        completo abre el resto: en qué día te caes, de dónde sale tu XP, en
        qué se va el dinero y qué encargos llevan semanas quietos.
      </p>
      <div class="inf-siluetas" aria-hidden="true">
        ${[62, 88, 40, 74, 55, 90].map(h => `<i style="height:${h}%"></i>`).join("")}
      </div>
      <div class="stack">
        <button class="btn btn-primary" onclick="abrirAjustes('plan')">Ver ${escapeHtml(NOMBRE_PRO)}</button>
      </div>
    </section>`;
}

/* ================= Misiones ================= */

const DOW_LARGO = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function infMisiones(r, rAntes, D) {
  const m = metricasMisiones(r, D), p = metricasMisiones(rAntes, D);
  const datos = D || state;

  let html = bloque("Tu constancia", "De todo lo que tocaba hacer, ¿cuánto hiciste?",
    `<div class="inf-doble">
      ${gAro(m.constancia || 0, m.constancia === null ? "—" : m.constancia + "%",
        m.constancia === null ? "Todavía no ha cerrado ningún día con misiones" : `${m.completas} de ${m.tocaban} días-misión cumplidos`)}
      <div class="inf-cifras">
        <div><b>${m.marcas}</b><span>Veces que marcaste</span>${flechaHTML(variacion(m.marcas, p.marcas), "Frente al periodo anterior")}</div>
        <div><b>${m.constancia === null ? "—" : m.constancia + "%"}</b><span>Constancia</span>${flechaHTML(variacion(m.constancia, p.constancia), "Frente al periodo anterior")}</div>
      </div>
    </div>`);

  /* El mapa de calor. En una semana son siete casillas y no dice nada; en un
     mes o un año es la gráfica que contesta la única pregunta que nadie más
     contesta: cuántos días de tu vida hiciste algo. */
  if (r.periodo !== "semana") {
    const cuentas = new Map();
    diasDe(r).forEach(k => {
      let n = 0;
      datos.missions.forEach(x => { n += missionCount(x, k); });
      if (n) cuentas.set(k, n);
    });
    const conAlgo = cuentas.size;
    const total = diasDe(r).length;
    html += bloque("Tus días",
      conAlgo ? `Hiciste algo ${conAlgo} de los ${total} días de este periodo.` : "",
      gMapaCalor(diasDe(r), cuentas, { vacia: "En cuanto cumplas misiones, aquí se llena el calendario." }));
  }

  /* Por día de la semana. La pregunta no es cuánto hiciste, es DÓNDE se te
     cae la semana: con el día señalado, la respuesta es accionable. */
  const flojo = (() => {
    const conDatos = m.porDiaSemana.map((v, i) => ({ v, i })).filter(x => x.v > 0);
    if (conDatos.length < 3) return null;
    return conDatos.sort((a, b) => a.v - b.v)[0].i;
  })();

  html += bloque("¿Qué día se te cae la semana?",
    flojo === null ? "Hace falta más de una semana para que esto signifique algo." : `Tu día más flojo es el ${DOW_LARGO[flojo].toLowerCase()}.`,
    gBarras(m.porDiaSemana.map((v, i) => ({
      k: DOW_LARGO[i].slice(0, 3), v,
      color: i === flojo ? pinta("#ff8a70") : pinta("#5fe0b0"),
      titulo: `${DOW_LARGO[i]}: ${v} marcas`
    })), { vacia: "En cuanto cumplas misiones, aquí se verá en qué días." }));

  /* Qué misión sostiene el periodo. */
  const porMision = datos.missions.map(x => {
    let n = 0;
    diasDe(r).forEach(k => { n += missionCount(x, k); });
    return { k: x.name, v: n, color: pinta(x.color || "#5fe0b0") };
  }).filter(x => x.v > 0).sort((a, b) => b.v - a.v).slice(0, 5);

  html += bloque("Qué sostiene tu periodo", "Las cinco que más veces cumpliste.",
    gBarrasH(porMision, { vacia: "Aquí saldrán tus misiones más cumplidas." }));

  /* La hora. Solo se puede contestar con lo que se guardó desde el 27 de
     agosto de 2026: las marcas anteriores no llevan hora y no se inventan. */
  const franjas = [
    { k: "Madrugada", desde: 0, hasta: 5 },
    { k: "Mañana", desde: 6, hasta: 11 },
    { k: "Tarde", desde: 12, hasta: 17 },
    { k: "Noche", desde: 18, hasta: 23 }
  ].map(f => {
    let v = 0;
    for (let h = f.desde; h <= f.hasta; h++) v += m.porHora[h];
    return { k: f.k, v, color: pinta("#8ecdf5") };
  });

  html += bloque("¿A qué hora cumples?",
    m.conHora ? "Sirve para saber a qué hora ponerte lo que más te cuesta." : "",
    m.conHora
      ? gBarras(franjas, { vacia: "" })
      : gVacia("La hora se empezó a guardar hace poco, y no se puede reconstruir hacia atrás. Esto se llena solo con las misiones que cumplas de ahora en adelante."));

  return html;
}

/* ================= Habilidades ================= */

function infHabilidades(r, rAntes, D) {
  const h = metricasHabilidades(r, D), p = metricasHabilidades(rAntes, D);
  const datos = D || state;
  const f = h.porFuente;

  let html = bloque("¿De dónde sale tu XP?",
    "Si casi todo viene de un solo sitio, ya sabes qué parte de la app estás usando de verdad.",
    gApilada([
      { k: "Misiones", v: f.misiones, color: pinta("#5fe0b0") },
      { k: "Talentos", v: f.talentos, color: pinta("#c7a6ff") },
      { k: "Proyectos", v: f.proyectos, color: pinta("#8ecdf5") },
      { k: "Práctica suelta", v: f.practica, color: pinta("#f5d76e") }
    ], { fmt: (x) => fmtXp(x) + " XP", vacia: "Cuando ganes XP se verá aquí de dónde salió." }));

  /* Ganada contra perdida. Es el número que duele y el que cambia conductas,
     así que va entero y no escondido en un pie. */
  html += bloque("¿Ganas o pierdes?",
    h.perdida ? "Lo perdido es desgaste por dejar una habilidad sin practicar." : "",
    `<div class="inf-balance">
      <div class="ib-lado"><b class="mint">+${fmtXp(h.ganada)}</b><span>Ganada</span></div>
      <div class="ib-lado"><b class="${h.perdida ? "coral" : ""}">−${fmtXp(h.perdida)}</b><span>Perdida</span></div>
      <div class="ib-lado"><b>${h.neta >= 0 ? "+" : "−"}${fmtXp(Math.abs(h.neta))}</b><span>Neta</span>${flechaHTML(variacion(h.neta, p.neta), "Frente al periodo anterior")}</div>
    </div>`);

  /* Cómo creció cada una a lo largo del periodo. En una semana serían siete
     puntos y una recta: la forma de la curva —si algo se despegó o se quedó
     plano— solo aparece con un mes o un año por delante. */
  if (r.periodo !== "semana") {
    const tramos = tramosDe(r);
    const cinco = [...h.porHabilidad.entries()]
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([id]) => datos.skills.find(x => x.id === id)).filter(Boolean);

    const series = cinco.map(sk => {
      let acumulado = 0;
      const valores = tramos.map(g => {
        const set = new Set(g);
        sk.log.forEach(e => { if (set.has(e.date) && e.xp > 0) acumulado += e.xp; });
        return acumulado;
      });
      return { nombre: sk.name, color: sk.color || "#5fe0b0", valores };
    });

    /* «La curva de cada una» y no «Cómo creciste»: dos bloques seguidos
       llamados «Cómo creciste» y «Dónde creciste» se leen como el mismo
       título repetido y nadie mira el segundo. */
    html += bloque("La curva de cada una", "Las cinco que más se movieron, sumando desde el principio del periodo.",
      gLineas(series, { vacia: "Con un poco más de historia aquí se verá la forma de cada habilidad." }));
  }

  const top = [...h.porHabilidad.entries()]
    .map(([id, xp]) => {
      const s = datos.skills.find(x => x.id === id);
      return s ? { k: s.name, v: Math.max(0, xp), etiqueta: fmtXp(xp), color: pinta(s.color || "#5fe0b0") } : null;
    })
    .filter(Boolean).sort((a, b) => b.v - a.v).slice(0, 5);

  html += bloque("Dónde creciste", "Las cinco habilidades que más se movieron.",
    gBarrasH(top, { vacia: "Aquí saldrán las habilidades que más suban." }));

  /* Tiempo y niveles: lo que se puede contar de una vida, dicho en unidades
     de vida. «6 días completos» pesa más que «8.640 minutos». */
  const horas = Math.round(h.minutos / 60);
  html += bloque("Lo que llevas puesto", "",
    `<div class="inf-cifras tres">
      <div><b>${h.niveles}</b><span>Niveles subidos</span>${flechaHTML(variacion(h.niveles, p.niveles), "Frente al periodo anterior")}</div>
      <div><b>${h.sesiones}</b><span>Registros</span>${flechaHTML(variacion(h.sesiones, p.sesiones), "Frente al periodo anterior")}</div>
      <div><b>${horas ? horas + " h" : "—"}</b><span>Tiempo practicado</span></div>
    </div>` +
    (h.minutos ? "" : gVacia("El tiempo solo se cuenta cuando registras una práctica con minutos.")));

  return html;
}

/* ================= Talentos ================= */

function infTalentos(r, rAntes, D) {
  const t = metricasTalentos(r, D), p = metricasTalentos(rAntes, D);
  const datos = D || state;

  let html = bloque("En qué se te va el dinero", "Lo invertido en este periodo, por rama.",
    gBarrasH([...t.invertidoPorRama.entries()]
      .map(([k, v]) => ({ k, v, etiqueta: money(v), color: pinta("#c7a6ff") }))
      .sort((a, b) => b.v - a.v),
      { vacia: "En cuanto abras un talento con importe, aquí se ve en qué rama cayó." }));

  html += bloque("Cómo va lo que abriste", "",
    `<div class="inf-cifras tres">
      <div><b>${money(t.invertido)}</b><span>Invertido</span>${flechaHTML(variacion(t.invertido, p.invertido, { dinero: true }), "Frente al periodo anterior")}</div>
      <div><b>${t.completados}</b><span>Asegurados</span>${flechaHTML(variacion(t.completados, p.completados), "Frente al periodo anterior")}</div>
      <div><b class="${t.vencidos ? "coral" : ""}">${t.vencidos}</b><span>Se les pasó el plazo</span></div>
    </div>`);

  /* Por trimestre, y solo en el informe del año: en un mes hay un trimestre y
     medio, así que la gráfica sería una barra sola llamándose comparación. */
  if (r.periodo === "ano") {
    const porTri = [0, 0, 0, 0];
    datos.perks.forEach(x => {
      const d = diaDeInversion(x);
      if (!(x.cost > 0) || !enRango(d, r)) return;
      porTri[Math.floor((Number(d.slice(5, 7)) - 1) / 3)] += x.cost;
    });
    html += bloque("En qué trimestre gastaste", "",
      gBarras(porTri.map((v, i) => ({
        k: "T" + (i + 1), v, etiqueta: v ? money(v) : "",
        color: pinta("#c7a6ff"), titulo: "Trimestre " + (i + 1) + ": " + money(v)
      })), { vacia: "Aquí se reparte por trimestre lo que inviertas este año." }));
  }

  /* Cuánto tardas en cerrar lo que abres. Solo cuenta lo que se completó
     DENTRO del periodo: meter lo de hace tres años haría que la cifra no se
     moviera nunca y dejara de significar «cómo voy». */
  const cerrados = datos.perks.filter(x => x.completedAt && enRango(x.completedAt, r) && (x.startDate || x.createdAt));
  if (r.periodo !== "semana") {
    const dias = cerrados.map(x => Math.max(0, daysBetween(x.startDate || x.createdAt, x.completedAt)));
    const medio = dias.length ? Math.round(dias.reduce((a, b) => a + b, 0) / dias.length) : null;
    /* A tiempo: se cerró antes de su propia fecha de vencimiento. Los que no
       llevan plazo no entran ni a favor ni en contra — no tenían nada que
       cumplir. */
    const conPlazo = cerrados.filter(x => x.endDate);
    const aTiempo = conPlazo.filter(x => x.completedAt <= x.endDate).length;

    html += bloque("¿Cierras lo que abres?", "",
      medio === null
        ? gVacia("Cuando completes un talento con fecha, aquí verás cuánto tardaste.")
        : `<div class="inf-cifras tres">
            <div><b>${cerrados.length}</b><span>Completados</span></div>
            <div><b>${medio}</b><span>Días de media</span></div>
            <div><b class="${conPlazo.length && aTiempo < conPlazo.length ? "coral" : "mint"}">${conPlazo.length ? aTiempo + " de " + conPlazo.length : "—"}</b><span>Dentro de plazo</span></div>
          </div>`);
  }

  /* Lo que se vence. Es dato de acción, no de repaso, y por eso va con nombre
     y días — un número suelto no dice a cuál hay que ir. */
  const porVencer = datos.perks
    .filter(x => x.status === "active" && x.endDate)
    .sort((a, b) => String(a.endDate).localeCompare(String(b.endDate)))
    .slice(0, 5)
    .map(x => {
      const quedan = daysBetween(todayKey(), x.endDate);
      return {
        k: x.name,
        v: Math.max(0, 60 - Math.min(60, quedan)),
        etiqueta: quedan < 0 ? "vencido" : (quedan === 0 ? "hoy" : quedan + (quedan === 1 ? " día" : " días")),
        color: quedan <= 7 ? pinta("#ff8a70") : pinta("#5fe0b0")
      };
    });

  html += bloque("Lo que se te vence", "Cuanto más llena la barra, menos tiempo queda.",
    gBarrasH(porVencer, { vacia: "No tienes ningún plan con fecha corriendo." }));

  return html;
}

/* ================= Proyectos ================= */

function infProyectos(r, rAntes, D) {
  const pr = metricasProyectos(r, D), pa = metricasProyectos(rAntes, D);
  const datos = D || state;
  const vivos = datos.projects.filter(x => x.status === "active" || x.status === "paused");

  /* La salud sale de `projectHealth`, que ya existía: repetir aquí esa
     clasificación sería tener dos verdades sobre lo mismo. */
  const cuenta = {};
  vivos.forEach(x => { const h = projectHealth(x); cuenta[h.label] = (cuenta[h.label] || 0) + 1; });
  const COLOR_SALUD = {
    "Con ritmo": pinta("#5fe0b0"), "Casi listo": pinta("#5fe0b0"),
    "Enfriándose": pinta("#f5d76e"), "Estancado": pinta("#ff8a70"),
    "En pausa": "var(--carril)"
  };

  let html = bloque("Cómo está lo que llevas", "De un vistazo: qué sigue vivo y qué se está apagando.",
    gApilada(Object.keys(cuenta).map(k => ({ k, v: cuenta[k], color: COLOR_SALUD[k] || pinta("#8ecdf5") })),
      { vacia: "Cuando tengas encargos en marcha, aquí se ve su estado." }));

  /* El ritmo, día a día dentro del periodo. Con más de dos semanas se agrupa
     por semanas: 365 barras no son una gráfica, son una pared. */
  const dias = diasDe(r);
  let ritmo;
  if (dias.length <= 14) {
    ritmo = dias.map(k => {
      let n = 0;
      datos.projects.forEach(x => (x.steps || []).forEach(s => { if (s.done && diaDeSello(s.at) === k) n++; }));
      return { k: String(Number(k.slice(8, 10))), v: n, color: pinta("#8ecdf5") };
    });
  } else {
    const grupos = [];
    for (let i = 0; i < dias.length; i += 7) grupos.push(dias.slice(i, i + 7));
    ritmo = grupos.map((g, i) => {
      let n = 0;
      const set = new Set(g);
      datos.projects.forEach(x => (x.steps || []).forEach(s => { if (s.done && set.has(diaDeSello(s.at))) n++; }));
      return { k: "S" + (i + 1), v: n, color: pinta("#8ecdf5") };
    });
  }

  html += bloque("Tu ritmo", "Etapas cerradas a lo largo del periodo.",
    gBarras(ritmo, { vacia: "Aquí se verá el ritmo en cuanto cierres etapas." }));

  /* Cuánto tarda un encargo de principio a fin. Con una semana la muestra es
     de uno o dos y la media es ruido; de un mes en adelante ya dice algo. */
  if (r.periodo !== "semana") {
    const cerrados = datos.projects.filter(x => x.status === "done" && enRango(x.completedAt || x.lastActivity, r));
    const dias = cerrados.map(x => Math.max(0, daysBetween(x.createdAt, x.completedAt || x.lastActivity)));
    html += bloque("Cuánto tarda un encargo", "De crearlo a cerrarlo.",
      dias.length
        ? `<div class="inf-cifras tres">
            <div><b>${Math.round(dias.reduce((a, b) => a + b, 0) / dias.length)}</b><span>Días de media</span></div>
            <div><b class="mint">${Math.min(...dias)}</b><span>El más rápido</span></div>
            <div><b>${Math.max(...dias)}</b><span>El más lento</span></div>
          </div>`
        : gVacia("Cuando termines un encargo, aquí verás cuánto te llevó."));
  }

  html += bloque("Lo que cerraste y lo que soltaste", "",
    `<div class="inf-cifras tres">
      <div><b>${pr.etapas}</b><span>Etapas cerradas</span>${flechaHTML(variacion(pr.etapas, pa.etapas), "Frente al periodo anterior")}</div>
      <div><b class="mint">${pr.terminados}</b><span>Encargos terminados</span>${flechaHTML(variacion(pr.terminados, pa.terminados), "Frente al periodo anterior")}</div>
      <div><b class="${pr.soltados ? "coral" : ""}">${pr.soltados}</b><span>Soltados</span></div>
    </div>`);

  return html;
}
