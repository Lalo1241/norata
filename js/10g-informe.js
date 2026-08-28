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

  return `
    <section class="panel inf-portada">
      <p class="inf-frase">${escapeHtml(frase)}</p>
      <div class="inf-tres">
        <div><b>${mis.marcas}</b><span>Misiones cumplidas</span></div>
        <div><b>${fmtXp(hab.ganada)}</b><span>XP ganada</span></div>
        <div><b>${cerradas}</b><span>Cosas cerradas</span></div>
      </div>
    </section>`;
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

  html += bloque("Lo que cerraste y lo que soltaste", "",
    `<div class="inf-cifras tres">
      <div><b>${pr.etapas}</b><span>Etapas cerradas</span>${flechaHTML(variacion(pr.etapas, pa.etapas), "Frente al periodo anterior")}</div>
      <div><b class="mint">${pr.terminados}</b><span>Encargos terminados</span>${flechaHTML(variacion(pr.terminados, pa.terminados), "Frente al periodo anterior")}</div>
      <div><b class="${pr.soltados ? "coral" : ""}">${pr.soltados}</b><span>Soltados</span></div>
    </div>`);

  return html;
}
