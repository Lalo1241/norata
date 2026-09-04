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
  /* Sin plan solo abre la portada. Se avisa igual que en cualquier otro tope
     de la app: se dice qué hay detrás, no se ignora el toque. */
  if (rama !== "todo" && !planIncluyeResumen("semana")) { topeAlcanzado("resumen"); return; }
  informeRamaActual = rama;
  /* Sin `scrollIntoView`. Lo tenía, y era lo que hacía bailar la pantalla al
     cambiar de filtro: los mandos están arriba del todo, así que arrastrar el
     cuerpo hasta el borde superior movía la página aunque ya estuvieras
     mirando ahí. Ahora el contenido se despliega hacia abajo y quien mira se
     queda donde estaba. */
  renderInforme();
}

/* El periodo se conserva al saltar de rama: si estabas mirando el mes, sigues
   en el mes. Cambiarlo por debajo obligaría a volver a elegirlo cinco veces
   para leer el mismo mes en las cinco ramas. */
function informeVerPeriodo(p) {
  /* Tocar el periodo que ya estás viendo no es toparse con nada: sin esto, en
     el plan Gratuito pulsar «Semana» —la que está puesta— abría el cuadro de
     Pro, que es la peor forma de contestar a alguien que no pidió nada. */
  if (p === informePeriodoActual) return;
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
  if (!datos.length || !datos.some(d => d.v > 0)) return gVacia(op.vacia || tx("Todavía no hay nada que dibujar aquí."));
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
  if (!datos.length) return gVacia(op.vacia || tx("Todavía no hay nada que dibujar aquí."));
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
  if (!total) return gVacia(op.vacia || tx("Todavía no hay nada que repartir."));
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

/* El color de un aro según lo lleno que esté. Tres tramos y no una rampa: un
   aro que cambia de tono poco a poco no dice nada en ningún punto.

   Los tramos van del mismo lado que las lecturas —bajo por debajo de 40, alto
   por encima de 85— para que el color y la frase de abajo nunca se
   contradigan.

   Y el de en medio es celeste y no luciérnaga a propósito: el amarillo no
   llega a 3 sobre 1 contra la tarjeta clara sin volverse el dorado apagado
   que Eduardo ya rechazó una vez (`#755c05`, 5,66 pero color de alerta
   interna). El celeste llega a 3,77 siendo celeste. */
function colorDeAvance(pct) {
  if (pct === null || pct === undefined) return "var(--aro-medio)";
  if (pct >= 85) return "var(--aro-alto)";
  if (pct < 40) return "var(--aro-bajo)";
  return "var(--aro-medio)";
}

/* Un aro con su cifra dentro. El arco NO usa `--mint` a secas: de día ese
   tono es el de escribir (`#007046`), pensado para texto, y un aro de nueve
   píxeles pintado con él sale verde bosque sobre lavanda. Los tres tonos de
   `--aro-*` están medidos para pasar de 3 sobre 1 contra la tarjeta clara
   siendo todavía el color que dicen ser. */
function gAro(pct, texto, pie, color) {
  const c = color || colorDeAvance(pct);
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

/* El calendario de tus días.

   Antes esto era una parrilla de columnas-semana que empezaba donde empezara
   el rango: 53 columnas para un año, 5 para un mes, y ninguna referencia. No
   se entendía qué era una casilla, ni si el patrón seguía un calendario o caía
   donde le tocaba —lo dijo Eduardo mirándolo, y tenía razón—.

   Ahora es un calendario de verdad, y por eso se entiende sin leer nada:

   - Un MES se dibuja como el mes se dibuja en cualquier sitio: siete columnas
     con las iniciales de los días arriba, el 1 en su día de la semana real y
     tantas filas como semanas tenga. Los meses de 30, de 31 y los febreros de
     29 salen solos, porque los días se cuentan con `Date.UTC(a, m, 0)`, que
     es el último día del mes anterior y ya sabe de años bisiestos.
   - Un AÑO son los doce meses en pequeño, cada uno con su nombre. Ni una
     cinta de 53 columnas que hay que desplazar de lado, ni un bloque enorme
     medio vacío: doce piezas que se reparten en cuatro columnas en pantalla
     ancha y en dos en el teléfono.

   Los días que todavía no han llegado se dibujan vacíos y sin borde: se ve
   que el mes sigue, pero no se cuentan como fallados. */

/* Las letras de la semana las da `letrasDeSemana()` (js/00-idioma.js),
   con el idioma puesto. Antes había tres copias de esta lista en tres
   archivos, las tres en español. */
const CAL_MES_CORTO = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/* Cinco escalones y no una rampa continua: con un degradado, dos días de
   esfuerzo muy distinto acaban del mismo color y el mapa deja de contar nada.
   El cero usa el carril, que es el tono pensado justo para dejar ver por dónde
   va lo lleno. */
function calEscala() {
  return ["var(--carril)", velo("#5fe0b0", "44"), velo("#5fe0b0", "77"),
    velo("#5fe0b0", "bb"), pinta("#5fe0b0")];
}

/* Cuántos días tiene un mes. Sale de la aritmética de fechas y no de una tabla
   escrita a mano: el día 0 del mes siguiente es el último del actual, así que
   febrero de un año bisiesto se cuenta solo. */
function diasDelMes(anio, mes) {
  return new Date(Date.UTC(anio, mes, 0)).getUTCDate();
}

function calRejilla(anio, mes, cuentas, max, mini) {
  const escala = calEscala();
  const nivel = (n) => n <= 0 ? 0 : Math.min(4, Math.ceil(n / max * 4));
  const total = diasDelMes(anio, mes);
  const primero = new Date(Date.UTC(anio, mes - 1, 1)).getUTCDay();
  const hoy = todayKey();
  const mm = String(mes).padStart(2, "0");

  let out = "";
  for (let i = 0; i < primero; i++) out += `<i class="mc-hueco"></i>`;
  for (let d = 1; d <= total; d++) {
    const k = anio + "-" + mm + "-" + String(d).padStart(2, "0");
    if (k > hoy) { out += `<i class="mc-futuro"></i>`; continue; }
    const n = cuentas.get(k) || 0;
    const titulo = T`${d} de ${nombreDeMes(mes)}: ` +
      (n ? (n === 1 ? T`${n} marca` : T`${n} marcas`) : tx("nada"));
    out += `<i style="background:${escala[nivel(n)]}" title="${escapeAttr(titulo)}"></i>`;
  }
  return `<div class="cal-rejilla${mini ? " mini" : ""}">${out}</div>`;
}

function calCabecera() {
  /* `aria-hidden` en las iniciales: para quien lee la pantalla en voz alta,
     siete letras sueltas no son información, y cada casilla ya dice su fecha
     completa en el título. */
  return `<div class="cal-dow" aria-hidden="true">${letrasDeSemana().map(d => `<span>${d}</span>`).join("")}</div>`;
}

function calLeyenda() {
  const escala = calEscala();
  return `
    <div class="inf-escala">
      <span>${tx("Cada casilla es un día")}</span>
      <span class="ie-sep">${tx("Menos")}</span>
      ${escala.map(c => `<i style="background:${c}"></i>`).join("")}
      <span>${tx("Más")}</span>
    </div>`;
}

function gCalendario(r, cuentas, opciones) {
  const op = opciones || {};
  const dias = diasDe(r);
  if (!dias.length) return gVacia(op.vacia || tx("Todavía no hay días que pintar."));
  const max = Math.max(...dias.map(k => cuentas.get(k) || 0), 1);
  if (!dias.some(k => (cuentas.get(k) || 0) > 0)) return gVacia(op.vacia || tx("En cuanto cumplas misiones, aquí se llena el calendario."));

  const anio = Number(r.desde.slice(0, 4));

  if (r.periodo === "ano") {
    return `
      <div class="cal-ano">
        ${CAL_MES_CORTO.map((nombre, i) => `
          <div class="cal-mini-mes">
            <b>${nombre}</b>
            ${calRejilla(anio, i + 1, cuentas, max, true)}
          </div>`).join("")}
      </div>` + calLeyenda();
  }

  const mes = Number(r.desde.slice(5, 7));
  return `
    <div class="cal-mes">
      ${calCabecera()}
      ${calRejilla(anio, mes, cuentas, max, false)}
    </div>` + calLeyenda();
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
  if (!vivas.length) return gVacia(op.vacia || tx("Todavía no hay suficiente historia para dibujar una curva."));

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

/* Los doce nombres los da `nombreDeMes(n)` (js/00-idioma.js), con el idioma
   puesto y con la mayúscula que pida cada uno —en inglés van con inicial y en
   español no, y eso `Intl` lo acierta y una lista escrita a mano no. */

/* «Del 23 al 29 de agosto», y no dos fechas completas: el año sobra cuando es
   el de ahora, y repetir el mes cuando es el mismo también. */
function tituloDeRango(r) {
  if (r.periodo === "ano") return "El año " + r.desde.slice(0, 4);
  const d1 = keyToDate(r.desde), d2 = keyToDate(r.hasta);
  if (r.periodo === "mes") return T`El mes de ${nombreDeMes(d1.getMonth() + 1).replace(/^./, c => c.toUpperCase())} de ${d1.getFullYear()}`;
  const mismoMes = d1.getMonth() === d2.getMonth();
  return mismoMes
    ? T`Del ${d1.getDate()} al ${d2.getDate()} de ${nombreDeMes(d2.getMonth() + 1)}`
    : T`Del ${d1.getDate()} de ${nombreDeMes(d1.getMonth() + 1)} al ${d2.getDate()} de ${nombreDeMes(d2.getMonth() + 1)}`;
}

function renderInforme() {
  const el = document.getElementById("informe-cuerpo");
  if (!el) return;

  const conPlan = planIncluyeResumen("semana");
  const periodo = planIncluyeResumen(informePeriodoActual) ? informePeriodoActual : "semana";
  const r = rangoDe(periodo, 0);
  const rAntes = rangoDe(periodo, 1);
  const D = datosDeAhora();

  const mandos = `
    <div class="inf-mandos">
      <div class="inf-periodos" role="tablist" aria-label="Periodo del informe">
        ${["semana", "mes", "ano"].map(p => `
          ${/* El que está puesto nunca sale apagado, aunque el plan no lo
                incluya: en el plan Gratuito la portada que se ve ES la de la
                semana, así que enseñar «Semana» seleccionada y gris a la vez
                se contradice consigo misma. Gris es lo que no está abierto Y
                no estás viendo. */""}
          <button role="tab" class="${p === periodo ? "on" : (planIncluyeResumen(p) ? "" : "bajo-llave")}"
            aria-selected="${p === periodo}" onclick="informeVerPeriodo('${p}')">${escapeHtml(PERIODOS[p].nombre)}</button>`).join("")}
      </div>
      <div class="inf-ramas" role="tablist" aria-label="Módulo del informe">
        ${/* Sin plan, las cuatro ramas no llevan a ninguna parte: el informe
              que se ve es la portada, y tocarlas no cambiaba nada en pantalla.
              Se apagan igual que los periodos cerrados —se ven, dicen por qué
              al tocarlas— en vez de fingir que funcionan. */
          INFORME_RAMAS.map(x => {
            const abierta = conPlan || x.id === "todo";
            return `
          <button role="tab" class="${x.id === informeRamaActual ? "on" : ""}${abierta ? "" : " bajo-llave"}"
            aria-selected="${x.id === informeRamaActual}" onclick="informeVerRama('${x.id}')">${escapeHtml(x.nombre)}</button>`;
          }).join("")}
      </div>
    </div>`;

  /* La antesala. Se enseña ANTES de calcular nada de la rama: quien no tiene
     plan ve su propia portada y ahí se acaba el informe. Y ve sus números de
     verdad, no un ejemplo — verlos una vez es lo que explica para qué sirve
     pagar, y son suyos. */
  if (!conPlan) {
    el.innerHTML = mandos + `<p class="inf-rango">${escapeHtml(tituloDeRango(r))}</p>` +
      portadaHTML(r, rAntes, D) + antesalaHTML();
    return;
  }

  let html = mandos + `<p class="inf-rango">${escapeHtml(tituloDeRango(r))}</p>`;
  if (informeRamaActual === "todo") html += portadaHTML(r, rAntes, D) + accesosHTML(r, D);
  else if (informeRamaActual === "misiones") html += infMisiones(r, rAntes, D);
  else if (informeRamaActual === "habilidades") html += infHabilidades(r, rAntes, D);
  else if (informeRamaActual === "talentos") html += infTalentos(r, rAntes, D);
  else html += infProyectos(r, rAntes, D);

  /* Las lecturas van SIEMPRE al final y nunca en medio: primero se ve, luego
     se lee lo que se ha visto. Puestas arriba, la gráfica de debajo se
     convierte en la prueba de una frase en vez de en el dato. */
  html += lecturasHTML(informeRamaActual, r, rAntes, D);

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

  /* La frase decía «Del 23 al 29 de agosto: cumpliste 33 misiones, ganaste
     1310 XP y cerraste 6 cosas», y justo debajo estaban esos tres números en
     grande. Era la misma información dos veces, y en la parte más visible de
     la pantalla. Ahora la frase dice lo único que las cifras no pueden decir
     solas —cómo se compara con el periodo anterior— y las cifras dicen cuánto.
     El rango de fechas tampoco se repite: ya está arriba, en su rótulo. */
  const v = variacion(mis.marcas, misA.marcas);
  const frase = !(mis.marcas || hab.ganada || cerradas)
    ? tx("Todavía sin movimiento. Esto se llena solo en cuanto empieces a marcar.")
    : v.dir === "nueva" ? tx("Es tu primer periodo con datos: a partir de aquí ya hay con qué comparar.")
    : v.dir === "igual" ? tx("Igual que el periodo anterior. Sostener también es un resultado.")
    : v.dir === "mejor" ? tx("Fue mejor que el periodo anterior.")
    : tx("Fue más flojo que el periodo anterior, y eso no borra lo de antes.");

  /* El repaso de diciembre. Un año no se resume con los mismos tres números
     que una semana: lo que se recuerda de un año es cuánto subiste, cuánto
     aguantaste seguido y cuánto costó todo. Va debajo y no en lugar de los
     tres de arriba, que siguen siendo la respuesta a «¿cómo voy?». */
  const repaso = r.periodo === "ano" ? `
      <div class="inf-tres inf-repaso">
        <div><b>${hab.niveles}</b><span>${tx("Niveles subidos")}</span></div>
        <div><b>${rachaMasLarga(r, D)}</b><span>${tx("Tu racha más larga")}</span></div>
        <div><b>${moneyHTML(tal.invertido)}</b><span>${tx("Invertido en ti")}</span></div>
      </div>` : "";

  return `
    <section class="panel inf-portada">
      <p class="inf-frase">${escapeHtml(frase)}</p>
      <div class="inf-tres">
        <div><b>${mis.marcas}</b><span>${tx("Misiones cumplidas")}</span></div>
        <div><b>${fmtXp(hab.ganada)}</b><span>${tx("XP ganada")}</span></div>
        <div><b>${cerradas}</b><span>${tx("Cosas cerradas")}</span></div>
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
    { k: tx("Práctica suelta"), v: f.practica, color: pinta("#f5d76e") }
  ], { fmt: (x) => fmtXp(x) + " XP", vacia: "Cuando ganes XP se verá aquí de dónde salió." });

  return bloque(tx("¿Dónde pusiste la energía?"),
    tx("Es la única pregunta que ningún módulo puede contestar solo."), energia) + `
    <div class="inf-accesos">
      ${INFORME_RAMAS.filter(x => x.id !== "todo").map(x => `
        <button class="inf-acceso" onclick="informeVerRama('${x.id}')">
          <b>${escapeHtml(x.nombre)}</b>
          <span>${tx("Ver el informe")}</span>
        </button>`).join("")}
    </div>`;
}

/* Lo que abre el informe completo, dicho de uno en uno. Antes era un párrafo
   con las cinco cosas metidas en la misma frase: se leía como relleno y no
   como una lista de lo que ganas. Cada renglón nombra una pregunta que el
   informe contesta y ninguna repite lo de arriba. */
const INFORME_ABRE = [
  "En qué día de la semana se te cae el ritmo",
  "De dónde sale tu XP: misiones, talentos, proyectos o práctica",
  "En qué se te va el dinero y qué se te vence",
  "Qué encargos llevan semanas quietos",
  "El mes y el año enteros, con el mapa de tus días"
];

function antesalaHTML() {
  return `
    <section class="panel inf-antesala">
      <h3>${icon("gem", 19)}El informe completo, con ${escapeHtml(NOMBRE_PRO)}</h3>
      <p class="settings-note" style="margin:0">
        Los números de arriba son tuyos y los ves siempre, igual que el panel
        de cada módulo. Lo que abre ${escapeHtml(NOMBRE_PRO)} es todo lo demás:
      </p>
      <ul class="inf-abre">
        ${INFORME_ABRE.map(x => `<li>${icon("check", 16)}<span>${escapeHtml(tx(x))}</span></li>`).join("")}
      </ul>
      <div class="inf-siluetas" aria-hidden="true">
        ${[62, 88, 40, 74, 55, 90].map(h => `<i style="height:${h}%"></i>`).join("")}
      </div>
      <div class="stack">
        <button class="btn btn-primary" onclick="abrirAjustes('plan')">${icon("gem", 17)}Ver ${escapeHtml(NOMBRE_PRO)}</button>
      </div>
    </section>`;
}

/* ================= Misiones ================= */

const DOW_LARGO = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function infMisiones(r, rAntes, D) {
  const m = metricasMisiones(r, D), p = metricasMisiones(rAntes, D);
  const datos = D || state;

  let html = bloque(tx("Tu constancia"), tx("De todo lo que tocaba hacer, ¿cuánto hiciste?"),
    `<div class="inf-doble">
      ${gAro(m.constancia || 0, m.constancia === null ? "—" : m.constancia + "%",
        m.constancia === null ? tx("Todavía no ha cerrado ningún día con misiones") : `${m.completas} de ${m.tocaban} días-misión cumplidos`)}
      <div class="inf-cifras">
        <div><b>${m.marcas}</b><span>${tx("Veces que marcaste")}</span>${flechaHTML(variacion(m.marcas, p.marcas), tx("Frente al periodo anterior"))}</div>
        <div><b>${m.constancia === null ? "—" : m.constancia + "%"}</b><span>${tx("Constancia")}</span>${flechaHTML(variacion(m.constancia, p.constancia), "Frente al periodo anterior")}</div>
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
    /* «de los 240 días de este periodo» era raro en el año en curso: el año
       tiene 365 y nadie lleva 240 de periodo. Se dice lo que es —los días que
       van— y en el mes se nombra el mes, que es lo que se está mirando. */
    const cuantos = r.periodo === "ano"
      ? `de los ${total} días que llevas de ${r.desde.slice(0, 4)}`
      : T`de los ${total} días que llevas de ${nombreDeMes(Number(r.desde.slice(5, 7)))}`;
    /* «Hiciste algo N días» no: reduce a «algo» lo que costó hacerse, y lo
       que se hizo importa tanto como que se hiciera. Estas casillas cuentan
       misiones cumplidas, así que se nombran. */
    html += bloque(tx("Tus días"),
      conAlgo ? `Cumpliste misiones ${conAlgo} ${cuantos}.` : "",
      gCalendario(r, cuentas, { vacia: tx("En cuanto cumplas misiones, aquí se llena el calendario.") }));
  }

  /* Por día de la semana. La pregunta no es cuánto hiciste, es DÓNDE se te
     cae la semana: con el día señalado, la respuesta es accionable. */
  const flojo = (() => {
    const conDatos = m.porDiaSemana.map((v, i) => ({ v, i })).filter(x => x.v > 0);
    if (conDatos.length < 3) return null;
    return conDatos.sort((a, b) => a.v - b.v)[0].i;
  })();

  html += bloque(tx("¿Qué día se te cae la semana?"),
    flojo === null ? tx("Hace falta más de una semana para que esto signifique algo.") : `Tu día más flojo es el ${DOW_LARGO[flojo].toLowerCase()}.`,
    gBarras(m.porDiaSemana.map((v, i) => ({
      k: DOW_LARGO[i].slice(0, 3), v,
      color: i === flojo ? pinta("#ff8a70") : pinta("#5fe0b0"),
      titulo: `${DOW_LARGO[i]}: ${v} marcas`
    })), { vacia: tx("En cuanto cumplas misiones, aquí se verá en qué días.") }));

  /* Qué misión sostiene el periodo. */
  const porMision = datos.missions.map(x => {
    let n = 0;
    diasDe(r).forEach(k => { n += missionCount(x, k); });
    return { k: x.name, v: n, color: pinta(x.color || "#5fe0b0") };
  }).filter(x => x.v > 0).sort((a, b) => b.v - a.v).slice(0, 5);

  html += bloque(tx("Qué sostiene tu periodo"), tx("Las cinco que más veces cumpliste."),
    gBarrasH(porMision, { vacia: tx("Aquí saldrán tus misiones más cumplidas.") }));

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

  html += bloque(tx("¿A qué hora cumples?"),
    m.conHora ? tx("Sirve para saber a qué hora ponerte lo que más te cuesta.") : "",
    m.conHora
      ? gBarras(franjas, { vacia: "" })
      : gVacia(tx("La hora se empezó a guardar hace poco, y no se puede reconstruir hacia atrás. Esto se llena solo con las misiones que cumplas de ahora en adelante.")));

  return html;
}

/* ================= Habilidades ================= */

function infHabilidades(r, rAntes, D) {
  const h = metricasHabilidades(r, D), p = metricasHabilidades(rAntes, D);
  const datos = D || state;
  const f = h.porFuente;

  let html = bloque(tx("¿De dónde sale tu XP?"),
    tx("Si casi todo viene de un solo sitio, ya sabes qué parte de la app estás usando de verdad."),
    gApilada([
      { k: "Misiones", v: f.misiones, color: pinta("#5fe0b0") },
      { k: "Talentos", v: f.talentos, color: pinta("#c7a6ff") },
      { k: "Proyectos", v: f.proyectos, color: pinta("#8ecdf5") },
      { k: tx("Práctica suelta"), v: f.practica, color: pinta("#f5d76e") }
    ], { fmt: (x) => fmtXp(x) + " XP", vacia: "Cuando ganes XP se verá aquí de dónde salió." }));

  /* Ganada contra perdida. Es el número que duele y el que cambia conductas,
     así que va entero y no escondido en un pie. */
  html += bloque(tx("¿Ganas o pierdes?"),
    h.perdida ? tx("Lo perdido es desgaste por dejar una habilidad sin practicar.") : "",
    `<div class="inf-balance">
      <div class="ib-lado"><b class="mint">+${fmtXp(h.ganada)}</b><span>${tx("Ganada")}</span></div>
      <div class="ib-lado"><b class="${h.perdida ? "coral" : ""}">−${fmtXp(h.perdida)}</b><span>${tx("Perdida")}</span></div>
      <div class="ib-lado"><b>${h.neta >= 0 ? "+" : "−"}${fmtXp(Math.abs(h.neta))}</b><span>${tx("Neta")}</span>${flechaHTML(variacion(h.neta, p.neta), "Frente al periodo anterior")}</div>
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
    html += bloque(tx("La curva de cada una"), tx("Las cinco que más se movieron, sumando desde el principio del periodo."),
      gLineas(series, { vacia: tx("Con un poco más de historia aquí se verá la forma de cada habilidad.") }));
  }

  const top = [...h.porHabilidad.entries()]
    .map(([id, xp]) => {
      const s = datos.skills.find(x => x.id === id);
      return s ? { k: s.name, v: Math.max(0, xp), etiqueta: fmtXp(xp), color: pinta(s.color || "#5fe0b0") } : null;
    })
    .filter(Boolean).sort((a, b) => b.v - a.v).slice(0, 5);

  html += bloque(tx("Dónde creciste"), tx("Las cinco habilidades que más se movieron."),
    gBarrasH(top, { vacia: tx("Aquí saldrán las habilidades que más suban.") }));

  /* Tiempo y niveles: lo que se puede contar de una vida, dicho en unidades
     de vida. «6 días completos» pesa más que «8.640 minutos». */
  const horas = Math.round(h.minutos / 60);
  html += bloque(tx("Lo que llevas puesto"), "",
    `<div class="inf-cifras tres">
      <div><b>${h.niveles}</b><span>${tx("Niveles subidos")}</span>${flechaHTML(variacion(h.niveles, p.niveles), tx("Frente al periodo anterior"))}</div>
      <div><b>${h.sesiones}</b><span>${tx("Registros")}</span>${flechaHTML(variacion(h.sesiones, p.sesiones), tx("Frente al periodo anterior"))}</div>
      <div><b>${horas ? horas + " h" : "—"}</b><span>${tx("Tiempo practicado")}</span></div>
    </div>` +
    (h.minutos ? "" : gVacia("El tiempo solo se cuenta cuando registras una práctica con minutos.")));

  return html;
}

/* ================= Talentos ================= */

function infTalentos(r, rAntes, D) {
  const t = metricasTalentos(r, D), p = metricasTalentos(rAntes, D);
  const datos = D || state;

  let html = bloque(tx("En qué se te va el dinero"), tx("Lo invertido en este periodo, por rama."),
    gBarrasH([...t.invertidoPorRama.entries()]
      .map(([k, v]) => ({ k, v, etiqueta: money(v), color: pinta("#c7a6ff") }))
      .sort((a, b) => b.v - a.v),
      { vacia: tx("En cuanto abras un talento con importe, aquí se ve en qué rama cayó.") }));

  html += bloque(tx("Cómo va lo que abriste"), "",
    `<div class="inf-cifras tres">
      <div><b>${moneyHTML(t.invertido)}</b><span>${tx("Invertido")}</span>${flechaHTML(variacion(t.invertido, p.invertido, { dinero: true }), "Frente al periodo anterior")}</div>
      <div><b>${t.completados}</b><span>${tx("Asegurados")}</span>${flechaHTML(variacion(t.completados, p.completados), tx("Frente al periodo anterior"))}</div>
      <div><b class="${t.vencidos ? "coral" : ""}">${t.vencidos}</b><span>${tx("Se les pasó el plazo")}</span></div>
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
    html += bloque(tx("En qué trimestre gastaste"), "",
      gBarras(porTri.map((v, i) => ({
        k: "T" + (i + 1), v, etiqueta: v ? money(v) : "",
        color: pinta("#c7a6ff"), titulo: "Trimestre " + (i + 1) + ": " + money(v)
      })), { vacia: tx("Aquí se reparte por trimestre lo que inviertas este año.") }));
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

    html += bloque(tx("¿Cierras lo que abres?"), "",
      medio === null
        ? gVacia(tx("Cuando completes un talento con fecha, aquí verás cuánto tardaste."))
        : `<div class="inf-cifras tres">
            <div><b>${cerrados.length}</b><span>${tx("Completados")}</span></div>
            <div><b>${medio}</b><span>${tx("Días de media")}</span></div>
            <div><b class="${conPlazo.length && aTiempo < conPlazo.length ? "coral" : "mint"}">${conPlazo.length ? aTiempo + " de " + conPlazo.length : "—"}</b><span>${tx("Dentro de plazo")}</span></div>
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

  html += bloque(tx("Lo que se te vence"), tx("Cuanto más llena la barra, menos tiempo queda."),
    gBarrasH(porVencer, { vacia: tx("No tienes ningún plan con fecha corriendo.") }));

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
    tx("Con ritmo"): pinta("#5fe0b0"), "Casi listo": pinta("#5fe0b0"),
    "Enfriándose": pinta("#f5d76e"), "Estancado": pinta("#ff8a70"),
    tx("En pausa"): "var(--carril)"
  };

  let html = bloque(tx("Cómo está lo que llevas"), tx("De un vistazo: qué sigue vivo y qué se está apagando."),
    gApilada(Object.keys(cuenta).map(k => ({ k, v: cuenta[k], color: COLOR_SALUD[k] || pinta("#8ecdf5") })),
      { vacia: tx("Cuando tengas encargos en marcha, aquí se ve su estado.") }));

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

  html += bloque(tx("Tu ritmo"), tx("Etapas cerradas a lo largo del periodo."),
    gBarras(ritmo, { vacia: tx("Aquí se verá el ritmo en cuanto cierres etapas.") }));

  /* Cuánto tarda un encargo de principio a fin. Con una semana la muestra es
     de uno o dos y la media es ruido; de un mes en adelante ya dice algo. */
  if (r.periodo !== "semana") {
    const cerrados = datos.projects.filter(x => x.status === "done" && enRango(x.completedAt || x.lastActivity, r));
    const dias = cerrados.map(x => Math.max(0, daysBetween(x.createdAt, x.completedAt || x.lastActivity)));
    html += bloque(tx("Cuánto tarda un encargo"), tx("De crearlo a cerrarlo."),
      dias.length
        ? `<div class="inf-cifras tres">
            <div><b>${Math.round(dias.reduce((a, b) => a + b, 0) / dias.length)}</b><span>${tx("Días de media")}</span></div>
            <div><b class="mint">${Math.min(...dias)}</b><span>${tx("El más rápido")}</span></div>
            <div><b>${Math.max(...dias)}</b><span>${tx("El más lento")}</span></div>
          </div>`
        : gVacia(tx("Cuando termines un encargo, aquí verás cuánto te llevó.")));
  }

  html += bloque(tx("Lo que cerraste y lo que soltaste"), "",
    `<div class="inf-cifras tres">
      <div><b>${pr.etapas}</b><span>${tx("Etapas cerradas")}</span>${flechaHTML(variacion(pr.etapas, pa.etapas), tx("Frente al periodo anterior"))}</div>
      <div><b class="mint">${pr.terminados}</b><span>${tx("Encargos terminados")}</span>${flechaHTML(variacion(pr.terminados, pa.terminados), tx("Frente al periodo anterior"))}</div>
      <div><b class="${pr.soltados ? "coral" : ""}">${pr.soltados}</b><span>${tx("Soltados")}</span></div>
    </div>`);

  return html;
}
