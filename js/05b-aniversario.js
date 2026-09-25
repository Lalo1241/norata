/* ================= El aniversario de expedición (0.7.133) =================
   El día que se cumple un año desde que empezaste, la app te recibe con tu año
   contado como el resumen anual de las apps de música: hasta diez láminas,
   cada una con su cielo, su icono y su gráfica animada, que avanzan solas cada
   7 s y también tocando. A los seis meses hay solo un guiño arriba. Lo pidió
   Eduardo y se diseñó en un borrador lámina por lámina antes de llegar aquí.

   Las reglas, y todas vienen de alguna corrección suya:

   - **Nada puede doler.** Nunca se cuentan los días que faltaste, las rachas
     rotas ni lo que bajó. Los días con actividad son estrellas en un cielo, no
     un calendario con huecos. Cada lámina tiene un mínimo y, por debajo, no
     sale: un «3 misiones» se leería como reproche.
   - **Una sola vez por aniversario**, con una semana de gracia si ese día no
     abriste. Después se vuelve a ver desde Mi expedición.
   - **Del segundo año en adelante nada repite el primer día**: la lámina 2
     enseña la misión con que ABRISTE ese año, no la primera de todas.
   - **El logotipo que dibujan las estrellas es un premio**: solo con el 40% de
     los días del año con actividad. Y la frase de esa lámina NO cambia con él
     —lo probé y Eduardo lo paró: le mataba el encanto y sonaba a anuncio—.
   - **La lámina es de la persona.** La app no habla de sí misma ahí.

   Dos cosas que la app no guardaba y que salen de aquí:

   - `settings.inicio`: el día en que empezaste. Se siembra en `load()` con lo
     más viejo que haya y se une al sincronizar quedándose con el MENOR.
   - `settings.nivelesAniv`: el nivel de expedición en cada aniversario. El
     nivel solo se sabe «ahora» (`nivelExpedicion`), así que para enseñar
     quién eras hace un año hace falta haberlo apuntado entonces. El primer año
     parte del nivel 1, que es donde empieza todo el mundo.

   Todo lo demás se cuenta de lo que ya había: las marcas de las misiones (con
   hora desde que llevan `@HHMM`), el historial de puntos de cada habilidad,
   los talentos terminados, las etapas de los proyectos y los días activos.

   Para mirarlo sin esperar un año: `?aniversario=1` (o `=2`, `=6m`) lo abre
   con tus datos de verdad, sin apuntar nada. */

const ANIV_DURA = 7000;          // ms por lámina
const ANIV_GRACIA = 7;           // días para verlo si no abriste ese día
const ANIV_POCO = 30;            // por debajo de tantas misiones, el año fue ligero
const ANIV_LOGO = 0.4;           // parte de los días del año para que salga el logotipo

/* ---------- Fechas ---------- */

/* La fecha que cae `anios` años (y `meses` meses) después de `key`. El 29 de
   febrero se cae al 28 en los años que no lo tienen. */
function anivFecha(key, anios, meses) {
  const [y, m, d] = key.split("-").map(Number);
  const total = (m - 1) + (meses || 0);
  const ny = y + (anios || 0) + Math.floor(total / 12), nm = ((total % 12) + 12) % 12;
  const ultimo = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  return ny + "-" + String(nm + 1).padStart(2, "0") + "-" + String(Math.min(d, ultimo)).padStart(2, "0");
}

/* El día en que empezaste: lo más viejo que haya en la cuenta. */
function anivInicioDeDatos(data) {
  const fechas = [];
  const toma = k => { if (typeof k === "string" && /^\d{4}-\d{2}-\d{2}$/.test(k)) fechas.push(k); };
  ["skills", "missions", "perks", "projects"].forEach(c => (data[c] || []).forEach(x => {
    toma(x.createdAt);
    (x.log && !Array.isArray(x.log) ? Object.keys(x.log) : []).forEach(toma);
    (Array.isArray(x.log) ? x.log : []).forEach(e => toma(e && e.date));
    (x.history || []).forEach(e => toma(e && e.date));
  }));
  toma(data.settings && data.settings.bienvenida);
  return fechas.length ? fechas.sort()[0] : null;
}

/* ¿Qué toca hoy? Un aniversario de N años, el guiño de los seis meses, o
   nada. Cuenta con la semana de gracia y con lo que ya se vio. */
function anivQueToca(hoy) {
  const s = state.settings || {};
  const ini = s.inicio;
  if (!ini) return null;
  const vistos = s.aniversarios || [];
  for (let a = 1; a <= 30; a++) {
    const dia = anivFecha(ini, a, 0);
    if (dia > hoy) break;
    if (daysBetween(dia, hoy) < ANIV_GRACIA && vistos.indexOf(a) < 0) return { tipo: "anio", a, tarde: daysBetween(dia, hoy) };
  }
  const seis = anivFecha(ini, 0, 6);
  if (seis <= hoy && daysBetween(seis, hoy) < ANIV_GRACIA && !s.guinoSeisMeses) return { tipo: "seis" };
  return null;
}

/* ---------- Los números de un año ----------
   Todo sale de lo que la app ya guardaba, filtrado a la ventana
   [inicio + (a-1) años, inicio + a años). */
function anivDatos(a) {
  const ini = state.settings.inicio;
  const desde = anivFecha(ini, a - 1, 0), hasta = anivFecha(ini, a, 0);
  const dentro = k => k >= desde && k < hasta;

  // Misiones terminadas, por mes, y las horas de sus marcas.
  let misiones = 0;
  const meses = Array(12).fill(0), horas = Array(12).fill(0);
  let conHora = 0, primeraDelAnio = null;
  (state.missions || []).forEach(m => {
    Object.keys(m.log || {}).forEach(k => {
      if (!dentro(k) || !missionDone(m, k)) return;
      misiones++;
      meses[+k.slice(5, 7) - 1]++;
      if (!primeraDelAnio || k < primeraDelAnio.k) primeraDelAnio = { k, nombre: m.name };
      (m.log[k] || []).forEach(marca => {
        const h = typeof horaDeMarca === "function" ? horaDeMarca(marca) : null;
        if (h) { horas[Math.floor(+h.slice(0, 2) / 2)]++; conHora++; }
      });
    });
  });

  // La primera misión de todas: la más vieja que se creó.
  let primera = null;
  (state.missions || []).forEach(m => {
    const k = m.createdAt || Object.keys(m.log || {}).sort()[0];
    if (k && (!primera || k < primera.k)) primera = { k, nombre: m.name };
  });

  // Días con algo hecho, y la racha más larga dentro del año.
  const dias = [...activityDaySet()].filter(dentro).sort();
  let racha = 0, corrida = 0, previo = null;
  dias.forEach(k => {
    corrida = previo && addDaysKey(previo, 1) === k ? corrida + 1 : 1;
    racha = Math.max(racha, corrida);
    previo = k;
  });

  // La habilidad que más creció: su nivel al empezar y al terminar el año.
  let hab = null;
  (state.skills || []).forEach(s => {
    let antes = 0, despues = 0;
    (s.log || []).forEach(e => {
      if (!e || !e.date) return;
      if (e.date < desde) antes += e.xp || 0;
      if (e.date < hasta) despues += e.xp || 0;
    });
    const n0 = levelInfo(Math.max(0, antes)).level, n1 = levelInfo(Math.max(0, despues)).level;
    if (!hab || n1 - n0 > hab.n1 - hab.n0) hab = { nombre: s.name, icono: s.icon, n0, n1 };
  });

  // Lo que construiste: talentos terminados y etapas de proyectos cerradas.
  const talentos = (state.perks || []).filter(p => p.status === "completed" && p.completedAt && dentro(p.completedAt)).length;
  let etapas = 0;
  (state.projects || []).forEach(pr => (pr.steps || []).forEach(st => {
    const k = st.done && st.at ? diaDeSello(st.at) : null;
    if (k && dentro(k)) etapas++;
  }));

  // El nivel de hace un año y el de ahora.
  const niveles = state.settings.nivelesAniv || {};
  const nAntes = a === 1 ? 1 : (niveles[a - 1] || 1);
  const nAhora = a <= anivAniosCumplidos() && niveles[a] ? niveles[a] : nivelExpedicion().nivel;

  return { a, desde, hasta, misiones, meses, horas, conHora, primeraDelAnio, primera,
    dias: dias.length, racha, hab, talentos, etapas, nAntes, nAhora: Math.max(nAntes, nAhora) };
}

function anivAniosCumplidos() {
  const ini = state.settings && state.settings.inicio;
  if (!ini) return 0;
  let a = 0;
  while (a < 30 && anivFecha(ini, a + 1, 0) <= todayKey()) a++;
  return a;
}

/* ---------- Cómo se escriben las cosas ---------- */
function anivNum(n) {
  return Number(n).toLocaleString(localeActual());
}
function anivMes(i, largo) {
  const f = new Intl.DateTimeFormat(localeActual(), { month: largo ? "long" : "short" });
  return f.format(new Date(Date.UTC(2026, i, 15))).replace(".", "");
}
function anivCuantos(a) {
  if (a === 1) return tx("Un año");
  const n = [null, null, tx("Dos"), tx("Tres"), tx("Cuatro"), tx("Cinco")][a];
  return n ? T`${n} años` : T`${a} años`;
}
function anivOrdinal(a) {
  return [null, tx("primer"), tx("segundo"), tx("tercer"), tx("cuarto"), tx("quinto")][a] || String(a);
}

/* Doce franjas de dos horas: cualquier hora tiene algo que decir, y algo que
   sea verdad para esa hora. Tres frases de la tarde las corrigió Eduardo: la
   de las 2 hablaba de sueño y la de las 4 sonaba a empezar tarde. */
const ANIV_FAM = {
  madrugada: { icono: "luna", acento: "#8ecdf5", fondo: ["#0f2440", "#050a14"] },
  amanecer: { icono: "amanecer", acento: "#f2a0c4", fondo: ["#3a1f3a", "#100812"] },
  manana: { icono: "sol", acento: "#ffb86b", fondo: ["#3d2a18", "#130c08"] },
  tarde: { icono: "sol", acento: "#ff8a70", fondo: ["#40201a", "#140908"] },
  atardecer: { icono: "atardecer", acento: "#ff9f5a", fondo: ["#44230f", "#150a05"] },
  noche: { icono: "luna", acento: "#c9a6f2", fondo: ["#2a1d4a", "#0d0a1c"] }
};
const ANIV_FRANJAS = [
  { fam: "noche", rotulo: "De medianoche a las 2", frase: "El día ya había terminado oficialmente. Tú todavía no." },
  { fam: "madrugada", rotulo: "De 2 a 4 de la madrugada", frase: "Mientras el mundo entero dormía, tú ya ibas avanzando en lo tuyo." },
  { fam: "amanecer", rotulo: "De 4 a 6 de la mañana", frase: "Antes que el sol, antes que la alarma, antes que nadie: tú." },
  { fam: "manana", rotulo: "De 6 a 8 de la mañana", frase: "El día apenas estiraba los brazos y tú ya le llevabas ventaja." },
  { fam: "manana", rotulo: "De 8 a 10 de la mañana", frase: "El café todavía estaba caliente y tú ya ibas por la segunda misión." },
  { fam: "manana", rotulo: "De 10 de la mañana a mediodía", frase: "Cuando la mañana agarra ritmo, tú ya ibas con todo." },
  { fam: "tarde", rotulo: "De mediodía a las 2", frase: "Entre la comida y tus actividades diarias, siempre encontraste un hueco para lo tuyo." },
  { fam: "tarde", rotulo: "De 2 a 4 de la tarde", frase: "En plena tarde, con mil cosas encima, tú seguías cumpliendo." },
  { fam: "tarde", rotulo: "De 4 a 6 de la tarde", frase: "Al cerrar tu jornada, todavía te hacías un tiempo para ti. Eso se llama saber organizarse." },
  { fam: "atardecer", rotulo: "De 6 a 8 de la tarde", frase: "Mientras el día de todos terminaba, el tuyo seguía sumando." },
  { fam: "noche", rotulo: "De 8 a 10 de la noche", frase: "Cuando el día ya se había ido, tú todavía le sacabas algo." },
  { fam: "noche", rotulo: "De 10 de la noche a medianoche", frase: "Antes de apagar la luz, siempre un último paso." }
];
/* Los tres dibujos que el set de la app no tenía. */
const ANIV_ICONOS = {
  amanecer: '<path d="M3 18h18M6.5 18a5.5 5.5 0 0111 0M12 5v4M9.5 7.5L12 5l2.5 2.5M4.6 11.6l1.5 1M19.4 11.6l-1.5 1"/>',
  atardecer: '<path d="M3 18h18M6.5 18a5.5 5.5 0 0111 0M12 9V5M9.5 6.5L12 9l2.5-2.5M4.6 11.6l1.5 1M19.4 11.6l-1.5 1"/>',
  tarta: '<path d="M4 20h16M5 20v-7h14v7M8 13V9M12 13V9M16 13V9"/><path d="M8 6.5c0-1 .8-1.5.8-2.5M12 6.5c0-1 .8-1.5.8-2.5M16 6.5c0-1 .8-1.5.8-2.5"/>'
};
function anivIcono(nombre, tam) {
  const d = ANIV_ICONOS[nombre] || ICONS[nombre] || ICONS.star;
  return '<svg viewBox="0 0 24 24" width="' + tam + '" height="' + tam + '" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
}

/* Una constelación de rango en su casilla. Dos capas: debajo, la figura
   ENTERA en tenue —la tengas o no, así ninguna sale de la nada—; encima, lo
   alcanzado, que se enciende en su sitio subiendo la opacidad. Sin escalar:
   un círculo de SVG escala desde la esquina del dibujo y la estrella llegaba
   viajando (lo cazó Eduardo). */
function anivFiguraSVG(fig, lit, cx, cy, esc, demora) {
  const X = q => (cx + (q[0] - 50) * esc).toFixed(1), Y = q => (cy + (q[1] - 50) * esc).toFixed(1);
  const anim = demora == null ? "" : ' style="animation-delay:' + demora.toFixed(2) + 's"';
  let base = "", luz = "";
  fig.l.forEach(([a, b]) => {
    const xy = ' x1="' + X(fig.p[a]) + '" y1="' + Y(fig.p[a]) + '" x2="' + X(fig.p[b]) + '" y2="' + Y(fig.p[b]) + '"';
    base += '<line' + xy + ' class="av-lin"/>';
    if (a < lit && b < lit) luz += '<line' + xy + ' class="av-lin on"' + anim + '/>';
  });
  fig.p.forEach((q, i) => {
    const c = ' cx="' + X(q) + '" cy="' + Y(q) + '"';
    base += '<circle' + c + ' r="1.9" class="av-est"/>';
    if (i < lit) luz += '<circle' + c + ' r="2.4" class="av-est on"' + anim + '/>';
  });
  return base + luz;
}

function anivInsignia(r, tam) {
  if (!r) return "";
  return r.trazo && typeof svgDeTrazo === "function" ? svgDeTrazo(r.trazo, tam) : anivIcono(r.icon, tam);
}

/* ---------- Las láminas ---------- */
function anivLaminas(d) {
  const a = d.a, poco = d.misiones < ANIV_POCO;
  const L = [];
  const e = s => escapeHtml(s);

  // 1. El comienzo
  L.push({ fondo: ["#1b2a52", "#0a0f1e"], acento: "#f5d76e",
    html: '<div class="av-ico av-late">' + anivIcono("compass", 52) + '</div>' +
      '<div class="av-rot">' + e(a === 1 ? tx("Un año de expedición") : T`${a} años de expedición`) + '</div>' +
      '<div class="av-mega" data-contar="' + daysBetween(state.settings.inicio, todayKey()) + '">0</div>' +
      '<p class="av-bajo">' + e(tx("días desde que empezaste")) + '</p>' +
      '<p class="av-suave">' + e(T`Fue el ${formatDate(state.settings.inicio)}. Esto es lo que pasó desde entonces.`) + '</p>' });

  // 2. La primera misión, o la que abrió el año
  const lamMision = a === 1 ? d.primera : d.primeraDelAnio;
  if (lamMision) L.push({ fondo: ["#153a3a", "#08131a"], acento: "#5fe0b0",
    html: '<div class="av-rot">' + e(a === 1 ? tx("Todo empezó aquí") : T`Así abriste tu ${anivOrdinal(a)} año`) + '</div>' +
      '<div class="av-mision"><svg class="av-aro" viewBox="0 0 30 30"><circle cx="15" cy="15" r="12" class="av-trazo" style="--l:76"/><path d="M9.5 15.5l3.8 3.6 7.5-8" class="av-trazo" style="--l:20;animation-delay:1.3s"/></svg><b>' + e(lamMision.nombre) + '</b></div>' +
      '<p class="av-suave">' + e(a === 1 ? tx("Tu primera misión. La que abrió el mapa entero.") : tx("La primera misión que cumpliste este año. Con ella empezó un capítulo nuevo.")) + '</p>' });

  // 3. Misiones terminadas, de enero a diciembre
  if (!poco) {
    const tope = Math.max(...d.meses), top = d.meses.indexOf(tope);
    L.push({ fondo: ["#3a2a10", "#140d06"], acento: "#f5d76e",
      html: '<div class="av-rot">' + e(tx("Misiones cumplidas")) + '</div><div class="av-mega av-medio" data-contar="' + d.misiones + '">0</div>' +
        '<div class="av-barras">' + d.meses.map((v, i) => '<div class="av-b' + (i === top ? " top" : "") + '">' + (i === top ? "<em>" + v + "</em>" : "") +
          '<i style="height:' + Math.max(4, Math.round(v / tope * 120)) + 'px;animation-delay:' + (0.3 + i * 0.06) + 's"></i><small>' + e(anivMes(i)) + '</small></div>').join("") + '</div>' +
        '<p class="av-suave">' + e(T`Tu mejor mes fue ${anivMes(top, true)}, con ${tope} misiones terminadas.`) + '</p>' });
  }

  // 4. La hora fuerte: solo si hay marcas con hora de sobra
  if (!poco && d.conHora >= ANIV_POCO) {
    const i = d.horas.indexOf(Math.max(...d.horas));
    const f = Object.assign({}, ANIV_FAM[ANIV_FRANJAS[i].fam], ANIV_FRANJAS[i]);
    const r = 62, c = 2 * Math.PI * r, largo = 1 / 12;
    let puntos = "";
    for (let h = 0; h < 24; h++) { const an = h / 24 * 6.283 - 1.571; puntos += '<circle cx="' + (88 + Math.cos(an) * 81).toFixed(1) + '" cy="' + (88 + Math.sin(an) * 81).toFixed(1) + '" r="' + (h % 6 ? 1 : 2.2) + '" class="av-punto"/>'; }
    L.push({ fondo: f.fondo, acento: f.acento,
      html: '<div class="av-rot">' + e(tx("Tu hora fuerte")) + '</div><div class="av-dibujo"><svg width="176" height="176" viewBox="0 0 176 176">' +
        '<circle cx="88" cy="88" r="' + r + '" class="av-carril"/>' + puntos +
        '<circle cx="88" cy="88" r="' + r + '" class="av-trazo av-anillo-tenue" transform="rotate(-90 88 88)" style="--l:' + c + ';--hueco:0"/>' +
        '<circle cx="88" cy="88" r="' + r + '" class="av-trazo av-anillo" transform="rotate(' + (i / 12 * 360 - 90) + ' 88 88)" style="--l:' + (c * largo) + ';--hueco:' + c + ';animation-delay:1.5s"/>' +
        '<g transform="translate(64 64)" class="av-acento">' + anivIcono(f.icono, 48) + '</g></svg></div>' +
        '<p class="av-titulo">' + e(tx(f.rotulo)) + '</p><p class="av-suave">' + e(tx(f.frase)) + '</p>' });
  }

  // 5. La mejor racha
  if (d.racha >= 5) L.push({ fondo: ["#4a1d14", "#170907"], acento: "#ff8a70",
    html: '<div class="av-ico av-late">' + anivIcono("flame", 52) + '</div><div class="av-rot">' + e(tx("Tu mejor racha")) + '</div>' +
      '<div class="av-mega av-medio" data-contar="' + d.racha + '">0</div><p class="av-bajo">' + e(tx("días seguidos")) + '</p>' +
      '<div class="av-puntos">' + Array.from({ length: Math.min(d.racha, 60) }, (_, i) => '<i style="animation-delay:' + (0.5 + i * 0.03).toFixed(2) + 's"></i>').join("") + '</div>' +
      '<p class="av-suave">' + e(d.racha >= 30 ? tx("Más de un mes sin soltar el hilo. Eso ya tiene nombre: constancia.") : tx("Días enteros encadenados, uno detrás de otro.")) + '</p>' });

  // 6. La habilidad que más creció, con su icono
  if (d.hab && d.hab.n1 - d.hab.n0 >= 2) {
    const r = 58, c = 2 * Math.PI * r, q = Math.min(1, d.hab.n1 / MAX_LEVEL);
    L.push({ fondo: ["#12344a", "#071119"], acento: "#8ecdf5",
      html: '<div class="av-rot">' + e(tx("La que más creció")) + '</div><div class="av-dibujo"><svg width="150" height="150" viewBox="0 0 150 150">' +
        '<circle cx="75" cy="75" r="' + r + '" class="av-carril av-fino"/>' +
        '<circle cx="75" cy="75" r="' + r + '" class="av-trazo av-anillo av-fino" transform="rotate(-90 75 75)" style="--l:' + (c * q) + ';--hueco:' + c + '"/>' +
        '<g transform="translate(51 51)" class="av-acento">' + anivIcono(d.hab.icono, 48) + '</g></svg></div>' +
        '<p class="av-hab">' + e(d.hab.nombre) + '</p><p class="av-nivel">' + e(tx("Nivel")) + ' <b data-contar="' + d.hab.n1 + '">' + d.hab.n0 + '</b></p>' +
        '<p class="av-suave">' + e(T`Del nivel ${d.hab.n0} al ${d.hab.n1}. Hoy «${d.hab.nombre}» ya es parte de quien eres.`) + '</p>' });
  }

  // 7. Días encendidos: el logotipo sale con el hueco que dejan, como premio
  if (d.dias >= 20) {
    const W = 310, H = 250, k = 0.86, ox = (W - 250 * k) / 2, oy = (H - 250 * k) / 2;
    const logo = document.querySelector("#carga svg path");
    const logoD = logo ? logo.getAttribute("d") : "";
    const conLogo = !!logoD && d.dias >= Math.ceil(365 * ANIV_LOGO);
    const figura = conLogo ? new Path2D(logoD) : null;
    const cv = document.createElement("canvas").getContext("2d");
    const n = Math.min(d.dias, 360), cand = [], paso = 11.5, m = 14;
    const [x0, x1, y0, y1] = conLogo ? [ox - m, ox + 250 * k + m, oy - m, oy + 250 * k + m] : [6, W - 6, 6, H - 6];
    for (let y = y0; y < y1; y += paso) for (let x = x0; x < x1; x += paso) {
      const jx = x + (Math.random() - 0.5) * paso * 0.55, jy = y + (Math.random() - 0.5) * paso * 0.55;
      // Un margen de medio paso alrededor de la figura, para que su borde quede limpio.
      const tapa = conLogo && [[0, 0], [3, 0], [-3, 0], [0, 3], [0, -3]].some(([dx, dy]) =>
        cv.isPointInPath(figura, (jx + dx - ox) / k, (jy + dy - oy) / k, "evenodd"));
      if (!tapa) cand.push([jx, jy]);
    }
    for (let i = cand.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cand[i], cand[j]] = [cand[j], cand[i]]; }
    const st = cand.slice(0, n).map(([x, y], i) => '<i class="' + (i % 17 === 0 ? "g" : "") + '" style="left:' + x.toFixed(1) + 'px;top:' + y.toFixed(1) + 'px;animation-delay:' + (0.3 + i * 0.003).toFixed(2) + 's"></i>').join("");
    const tTrazo = 0.4 + n * 0.003, tBrillo = tTrazo + 1.5;
    const trazo = !conLogo ? "" : '<svg class="av-logo" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">' +
      '<path d="' + logoD + '" transform="translate(' + ox + ' ' + oy + ') scale(' + k + ')" pathLength="1000" class="av-trazo" style="--l:1000;animation-delay:' + tTrazo.toFixed(2) + 's;animation-duration:1.6s"/>' +
      '<path d="' + logoD + '" transform="translate(' + ox + ' ' + oy + ') scale(' + k + ')" class="av-brillo" style="animation-delay:' + tBrillo.toFixed(2) + 's,' + (tBrillo + 0.8).toFixed(2) + 's"/></svg>';
    L.push({ fondo: ["#0e1b3d", "#05080f"], acento: "#f5d76e",
      html: '<div class="av-rot">' + e(tx("Días encendidos")) + '</div><div class="av-cielo">' + st + trazo + '</div>' +
        '<div class="av-mega av-medio" data-contar="' + d.dias + '">0</div>' +
        '<p class="av-suave">' + e(tx("Cada estrella es un día en que hiciste algo. Juntas dibujan algo que antes no estaba.")) + '</p>' });
  }

  // 8. Lo que construiste
  if (d.talentos + d.etapas >= 3) L.push({ fondo: ["#1d3a1f", "#081209"], acento: "#bcd977",
    html: '<div class="av-dibujo"><svg class="av-arbolito" width="130" height="110" viewBox="0 0 130 110">' +
      '<path d="M65 22v26M65 48L32 82M65 48l33 34" class="av-trazo" style="--l:140"/>' +
      [[65, 16, 0.4], [65, 50, 0.8], [30, 86, 1.2], [100, 86, 1.6]].map(([x, y, t]) => '<circle cx="' + x + '" cy="' + y + '" r="9" class="av-nodo" style="animation-delay:' + t + 's"/>').join("") + '</svg></div>' +
      '<div class="av-rot">' + e(tx("Lo que construiste")) + '</div>' +
      (d.talentos ? '<p class="av-titulo"><span data-contar="' + d.talentos + '">0</span> ' + e(d.talentos === 1 ? tx("talento terminado") : tx("talentos terminados")) + '</p>' : "") +
      (d.etapas ? '<p class="av-bajo"><span data-contar="' + d.etapas + '">0</span> ' + e(d.etapas === 1 ? tx("etapa cerrada en tus proyectos") : tx("etapas cerradas en tus proyectos")) + '</p>' : "") +
      '<p class="av-suave">' + e(tx("Cosas que hace un año solo eran ideas. Ahora son realidad.")) + '</p>' });

  // 9. Quién eras, quién eres, con las cinco constelaciones
  {
    const rangos = rangosVigentes();
    const n0 = d.nAntes, n1 = d.nAhora;
    const R0 = rangoExpedicion(Math.max(1, n0)), R1 = rangoExpedicion(Math.max(1, n1));
    const i1 = rangos.findIndex(r => r.id === (R1 && R1.id));
    const cerradasAntes = Math.min(5, Math.floor(n0 / EXP_POR_RANGO)), cerradasHoy = Math.min(5, Math.floor(n1 / EXP_POR_RANGO));
    let cielo = "", demora = 0.5;
    rangos.forEach((r, i) => {
      const fig = expFiguraDeRango(r, i), cx = 30 + i * 60, cy = 36;
      if (i < cerradasAntes) cielo += '<g style="--c:var(' + r.color + ')">' + anivFiguraSVG(fig, fig.p.length, cx, cy, 0.46, null) + '</g>';
      else if (i < cerradasHoy) { cielo += '<g style="--c:var(' + r.color + ')">' + anivFiguraSVG(fig, fig.p.length, cx, cy, 0.46, demora) + '</g>'; demora += 0.6; }
      else if (i === i1) cielo += '<g style="--c:var(' + r.color + ')">' + anivFiguraSVG(fig, ncelHasta(fig, ncelEstrella(Math.max(1, n1))), cx, cy, 0.46, demora) + '</g>';
      else cielo += '<g style="--c:var(' + r.color + ')">' + anivFiguraSVG(fig, 0, cx, cy, 0.46, null) + '</g>';
    });
    const nuevas = cerradasHoy - cerradasAntes;
    let frase;
    if (nuevas > 0) frase = nuevas === 1 ? T`Este año cerraste una constelación y ya dibujas la de ${nombreDeRango(R1)}.`
      : T`Este año cerraste ${nuevas} constelaciones y ya dibujas la de ${nombreDeRango(R1)}.`;
    else {
      const fig = expFiguraDeRango(R1, Math.max(0, i1));
      frase = T`Tu constelación de ${nombreDeRango(R1)} ya brilla con ${ncelHasta(fig, ncelEstrella(Math.max(1, n1)))} de sus ${fig.p.length} estrellas. Las que faltan se encienden con cada nivel que subas.`;
    }
    const ins = (r, cls, contenido) => '<div class="av-rango ' + cls + '" style="color:var(' + r.color + ')"><span class="av-ins">' + anivInsignia(r, cls === "ahora" ? 48 : 30) + '</span>' +
      '<span>' + e(nombreDeRango(r)) + '</span><small>' + contenido + '</small></div>';
    L.push({ fondo: ["#221638", "#0b0712"], acento: "var(" + (R1 ? R1.color : "--mint") + ")",
      html: '<div class="av-rot">' + e(tx("Quién eras, quién eres")) + '</div>' +
        '<div class="av-cielo-rangos"><svg viewBox="0 0 300 72" width="300" height="72">' + cielo + '</svg></div>' +
        '<div class="av-rangos">' + ins(R0, "antes", e(T`Nivel ${n0}`) + " · " + e(tx("hace un año"))) +
        '<span class="av-flecha">→</span>' + ins(R1, "ahora", e(tx("Nivel")) + ' <b data-contar="' + n1 + '">' + n0 + '</b>') + '</div>' +
        '<p class="av-suave">' + e(frase) + '</p>' });
  }

  // 10. El cierre
  L.push({ fondo: ["#123d33", "#06110e"], acento: "#5fe0b0", ultima: true,
    html: '<div class="av-ico av-late">' + anivIcono("star", 52) + '</div><div class="av-rot">' + e(anivCuantos(a)) + '</div>' +
      '<h2 class="av-titulo av-cierre">' + e(poco ? T`${anivCuantos(a)} juntos. Lo mejor de este viaje todavía está por escribirse.` : T`${anivCuantos(a)} juntos. Vamos por más.`) + '</h2>' +
      '<p class="av-gracias">' + e(poco ? tx("Gracias por darnos un lugar en tu año. Aquí seguimos, con el mapa abierto y muchas ganas de ver lo que viene.")
        : a === 1 ? tx("Gracias por dejarnos acompañarte este año. Verte avanzar, día a día, es la mejor parte de hacer Norata.")
        : T`Gracias por dejarnos acompañarte estos ${a} años. Verte avanzar, día a día, es la mejor parte de hacer Norata.`) + '</p>' +
      '<div class="av-pie"><button type="button" class="btn btn-primary btn-block" onclick="cerrarAniversario()">' + e(tx("Seguir mi expedición")) + '</button>' +
      '<small>' + e(tx("Lo puedes volver a ver en Mi expedición.")) + '</small></div>' });
  return L;
}

/* ---------- La escena ---------- */
let anivEstado = null;

function abrirAniversario(a, opciones) {
  const op = opciones || {};
  if (!state.settings || !state.settings.inicio) return;
  cerrarAniversario(true);
  const L = anivLaminas(anivDatos(a));
  let estrellas = "";
  for (let i = 0; i < 50; i++) estrellas += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;top:' + (Math.random() * 100).toFixed(1) + '%;animation-delay:' + (Math.random() * 3).toFixed(1) + 's"></i>';
  const v = document.createElement("div");
  v.id = "aniv";
  v.innerHTML = '<div class="av-historia" role="dialog" aria-label="' + escapeAttr(tx("Aniversario de expedición")) + '">' +
    '<div class="av-fondo"></div><div class="av-estrellas">' + estrellas + '</div>' +
    '<div class="av-segmentos">' + L.map(() => "<span><i></i></span>").join("") + '</div>' +
    '<button type="button" class="av-x" aria-label="' + escapeAttr(tx("Cerrar")) + '">' + icon("close", 18) + '</button>' +
    '<button type="button" class="av-zona atras" aria-label="' + escapeAttr(tx("Anterior")) + '"></button>' +
    '<button type="button" class="av-zona adelante" aria-label="' + escapeAttr(tx("Siguiente")) + '"></button>' +
    '<div class="av-lamina"></div><div class="av-chispas"></div></div>';
  document.body.appendChild(v);
  v.querySelector(".av-x").addEventListener("click", () => cerrarAniversario());
  v.querySelector(".atras").addEventListener("click", () => anivIr(-1));
  v.querySelector(".adelante").addEventListener("click", () => anivIr(1));
  anivEstado = { a, L, i: 0, reloj: null, prueba: !!op.prueba };
  void v.offsetWidth;
  v.classList.add("show");
  anivPintar();
  /* Se apunta al ABRIR: si la persona cierra a la mitad, ya lo vio. Y la foto
     del nivel se queda para el año que viene. */
  if (!op.prueba && !op.revivir) {
    state.settings.aniversarios = [...new Set([...(state.settings.aniversarios || []), a])];
    state.settings.nivelesAniv = Object.assign({}, state.settings.nivelesAniv || {});
    if (!state.settings.nivelesAniv[a]) state.settings.nivelesAniv[a] = nivelExpedicion().nivel;
    save();
  }
}

function anivPintar() {
  const est = anivEstado, v = document.getElementById("aniv");
  if (!est || !v) return;
  clearTimeout(est.reloj);
  const l = est.L[est.i], ultima = est.i === est.L.length - 1;
  const h = v.querySelector(".av-historia");
  h.style.setProperty("--acento", l.acento);
  v.querySelector(".av-fondo").style.background = "radial-gradient(120% 75% at 50% 0%, " + l.fondo[0] + " 0%, " + l.fondo[1] + " 70%)";
  const lam = v.querySelector(".av-lamina");
  lam.innerHTML = l.html;
  lam.querySelectorAll("[data-contar]").forEach(el => anivContar(el, +el.dataset.contar));
  const quieto = anivQuieto();
  v.querySelectorAll(".av-segmentos span").forEach((s, k) => {
    s.className = k < est.i ? "lleno" : "";
    if (k === est.i) {
      if (!ultima && !quieto) { s.style.setProperty("--dura", ANIV_DURA + "ms"); void s.offsetWidth; s.className = "ahora"; }
      else s.className = "lleno";
    }
  });
  // Con «menos movimiento» no avanza sola: se pasa tocando.
  if (!ultima && !quieto) est.reloj = setTimeout(() => anivIr(1), ANIV_DURA);
  if (ultima && !quieto) anivChispas(v.querySelector(".av-chispas"));
}

function anivIr(d) {
  const est = anivEstado;
  if (!est) return;
  const n = est.i + d;
  if (n < 0 || n >= est.L.length) return;
  est.i = n;
  anivPintar();
}

function cerrarAniversario(sinRepintar) {
  if (anivEstado) clearTimeout(anivEstado.reloj);
  anivEstado = null;
  const v = document.getElementById("aniv");
  if (v) v.remove();
  if (!sinRepintar && document.getElementById("coleccion-cuerpo") && typeof renderColeccion === "function") renderColeccion();
}

function anivQuieto() {
  try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
}

// Contar hacia arriba, con setInterval para que no dependa de fotogramas.
function anivContar(el, hasta) {
  if (anivQuieto()) { el.textContent = anivNum(hasta); return; }
  const desde = Number(el.textContent) || 0, t0 = Date.now();
  const r = setInterval(() => {
    if (!el.isConnected) return clearInterval(r);
    const q = Math.min(1, (Date.now() - t0) / 1500), f = 1 - Math.pow(1 - q, 3);
    el.textContent = anivNum(Math.round(desde + (hasta - desde) * f));
    if (q === 1) clearInterval(r);
  }, 30);
}

function anivChispas(c) {
  if (!c) return;
  const col = ["#5fe0b0", "#f5d76e", "#ff8a70", "#8ecdf5", "#f2a0c4", "#c9a6f2"];
  for (let i = 0; i < 40; i++) {
    const s = document.createElement("i");
    s.style.cssText = "left:" + (Math.random() * 100).toFixed(1) + "%;background:" + col[i % col.length] + ";--dx:" + ((Math.random() - 0.5) * 160).toFixed(0) + "px;animation-delay:" + (Math.random() * 0.8).toFixed(2) + "s";
    c.appendChild(s);
  }
}

/* ---------- El guiño de los seis meses ---------- */
function guinoSeisMeses(prueba) {
  const d = anivDatos(1);
  const mis = (state.missions || []).reduce((t, m) => t + Object.keys(m.log || {}).filter(k => k >= state.settings.inicio && missionDone(m, k)).length, 0);
  const primera = d.primera ? d.primera.nombre : "";
  const texto = !primera ? tx("Medio año de expedición. Lo mejor del viaje todavía no se escribe.")
    : mis < ANIV_POCO ? T`Medio año desde tu primera misión, «${primera}». Lo mejor del viaje todavía no se escribe.`
    : T`Medio año desde tu primera misión, «${primera}». Hoy llevas ${anivNum(mis)} cumplidas.`;
  const g = document.createElement("div");
  g.id = "aniv-guino";
  g.innerHTML = '<span class="ag-ic">' + anivIcono("tarta", 20) + '</span><div><b>' + escapeHtml(tx("Seis meses de expedición")) + '</b><span>' + escapeHtml(texto) + '</span></div>' +
    '<button type="button" class="ag-x" aria-label="' + escapeAttr(tx("Cerrar")) + '">' + icon("close", 16) + '</button><span class="ag-resta"><i></i></span>';
  document.body.appendChild(g);
  const dura = 6000 + texto.length * 70, t0 = Date.now(), tira = g.querySelector(".ag-resta i");
  const irse = () => { clearInterval(r); g.remove(); };
  const r = setInterval(() => { const q = Math.max(0, 1 - (Date.now() - t0) / dura); tira.style.transform = "scaleX(" + q.toFixed(4) + ")"; if (!q) irse(); }, 50);
  g.querySelector(".ag-x").addEventListener("click", irse);
  if (!prueba) { state.settings.guinoSeisMeses = true; save(); }
}

/* ---------- Cuándo sale ----------
   Se llama al pintar el Resumen, que es muchas veces: casi siempre sale en la
   primera línea. Con las mismas guardas que las luciérnagas. */
let anivPedido = false;
function quizaAniversario() {
  if (anivEstado || anivPedido) return;
  if (typeof modoEjemplo !== "undefined" && modoEjemplo) return;
  if (!state.settings || !state.settings.inicio || bienvenidaPendiente()) return;
  const prueba = anivPrueba();
  const toca = prueba ? prueba : anivQueToca(todayKey());
  if (!toca) return;
  anivPedido = true;
  setTimeout(() => {
    anivPedido = false;
    if (activeMainView !== "summary" || document.hidden) return;
    if (document.documentElement.classList.contains("quieto")) return;
    if (toca.tipo === "seis") guinoSeisMeses(toca.prueba);
    else abrirAniversario(toca.a, { prueba: toca.prueba });
    if (toca.prueba) { try { sessionStorage.removeItem("norata-prueba-aniv"); } catch (e) {} }
  }, 1200);
}

/* `?aniversario=1` (o `=2`, `=6m`) enseña lo que saldría con tus datos de
   verdad, sin apuntar nada. Se lee de sessionStorage para que sobreviva al
   rebote de la portada, y se gasta al usarse. */
function anivPrueba() {
  let v = null;
  try {
    const q = new URLSearchParams(location.search).get("aniversario");
    if (q) sessionStorage.setItem("norata-prueba-aniv", q);
    v = sessionStorage.getItem("norata-prueba-aniv");
  } catch (e) {}
  if (!v) return null;
  if (v === "6m") return { tipo: "seis", prueba: true };
  const a = Math.max(1, Math.min(30, parseInt(v, 10) || 1));
  return { tipo: "anio", a, prueba: true };
}

/* ---------- En Mi expedición: volver a verlo ---------- */
function aniversariosHTML() {
  const vistos = (state.settings && state.settings.aniversarios) || [];
  if (!vistos.length) return "";
  return vistos.slice().sort((x, y) => y - x).map(a => {
    const desde = anivFecha(state.settings.inicio, a - 1, 0), hasta = anivFecha(state.settings.inicio, a, 0);
    return '<button type="button" class="aniv-fila" onclick="abrirAniversario(' + a + ', { revivir: true })">' +
      '<span class="aniv-fila-ic">' + anivIcono("tarta", 20) + '</span>' +
      '<span class="aniv-fila-tx"><b>' + escapeHtml(T`Tu ${anivOrdinal(a)} año`) + '</b><small>' + escapeHtml(formatDate(desde) + " – " + formatDate(hasta)) + '</small></span>' +
      '<span class="aniv-fila-ver">' + escapeHtml(tx("Ver")) + '</span></button>';
  }).join("");
}
