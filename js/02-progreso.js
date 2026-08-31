/* XP, niveles, decaimiento, racha, celebraciones y escenas */
/* ================= Celebración ================= */

let celTimer = null;
let userHasTapped = false;
document.addEventListener("pointerdown", () => { userHasTapped = true; }, { once: true, capture: true });

function celebrate(title, sub, color, iconName) {
  const el = document.getElementById("celebrate");
  el.style.setProperty("--cel", color || "#5fe0b0");
  document.getElementById("cel-icon").innerHTML = icon(iconName || "trophy", 38);
  document.getElementById("cel-title").textContent = title;
  document.getElementById("cel-sub").textContent = sub || "";
  el.classList.remove("show");
  void el.offsetWidth; // reiniciar animación
  el.classList.add("show");
  // El navegador solo permite vibrar después de una interacción real
  if (userHasTapped && navigator.vibrate) navigator.vibrate([28, 40, 70]);
  clearTimeout(celTimer);
  celTimer = setTimeout(() => el.classList.remove("show"), 2200);
}

/* ================= Subir de nivel de expedición =================
   Lo pidió Eduardo así: «te lo canta como cuando subes de nivel una habilidad,
   pero más llamativo aún, y si llega a servir para desbloquear algo,
   anunciarlo ahí mismo con una ventana que no se salte por accidente».

   Son DOS celebraciones y no una, y la diferencia es la que pidió:

   - **Un nivel a secas** es una fiesta que pasa. Se va sola a los ocho
     segundos y se puede cortar tocando. No interrumpe una tarde de trabajo por
     un número.
   - **Un nivel que ABRE algo** es una ventana de verdad: no se cierra tocando
     fuera, no se cierra sola, y lleva un botón que va a donde está lo que
     acabas de ganar. Un premio que se anuncia y desaparece antes de que lo
     leas es peor que no anunciarlo, porque deja la sensación de haberse
     perdido algo.

   El nivel NO se guarda —los puntos se cuentan, nunca se escriben—; lo que se
   guarda es hasta qué nivel se festejó ya, que es otra cosa. Es el mismo trato
   que `rachaFestejada` y por el mismo motivo: sin él la fiesta se repetiría en
   cada recarga. */
let ncelTimer = null;

function celebrarNivel(nivel, abre) {
  const el = document.getElementById("ncel");
  if (!el) return;
  abre = abre || [];
  const r = typeof rangoExpedicion === "function" ? rangoExpedicion(nivel) : null;

  document.getElementById("ncel-num").textContent = nivel;
  const ins = document.getElementById("ncel-insignia");
  /* El dibujo del rango y no un icono genérico: el nivel 4 y el 5 son el mismo
     número más uno, y lo que de verdad cambia al llegar a un rango es el
     símbolo que llevas puesto. */
  ins.innerHTML = r ? icon(r.icon, 78) : icon("compass", 78);

  const rango = document.getElementById("ncel-rango");
  const traeRango = abre.some(x => x.tipo === "rango");
  rango.innerHTML = r
    ? (traeRango ? `Ahora eres <b>${escapeHtml(r.nombre)}</b>` : `Rango ${escapeHtml(r.nombre)}`)
    : "";
  rango.classList.toggle("nuevo", traeRango);

  /* Lo que se abre, escrito. Los rangos no entran en la lista: ya los dice el
     renglón de arriba, y repetir la misma noticia dos veces en la misma
     pantalla la abarata. */
  const premios = abre.filter(x => x.tipo !== "rango");
  const caja = document.getElementById("ncel-abre");
  caja.innerHTML = premios.length
    ? `<div class="ncel-tit">Se abre</div>` + premios.map(x =>
        `<div class="ncel-uno">${icon(x.tipo === "ambiente" ? "brush" : "star", 18)}<span>${escapeHtml(x.nombre)}</span></div>`).join("")
    : "";

  /* El botón que lleva a donde está el premio. Un anuncio sin destino obliga a
     buscarlo, y buscar un regalo lo estropea. */
  const hayVentana = premios.length > 0;
  const pies = document.getElementById("ncel-pies");
  const aAmbiente = premios.some(x => x.tipo === "ambiente");
  pies.innerHTML = hayVentana
    ? `<button class="btn btn-primary btn-block" onclick="cerrarNivelCel(); ${aAmbiente ? "abrirApariencia()" : "abrirColeccion('summary')"}">${aAmbiente ? "Ver Mi apariencia" : "Ver Mi expedición"}</button>
       <button class="btn btn-ghost btn-block" onclick="cerrarNivelCel()">Ahora no</button>`
    : `<button class="btn btn-primary btn-block" onclick="cerrarNivelCel()">Seguir</button>`;

  /* La clase decide las dos diferencias de comportamiento en un solo sitio:
     con `abierta` no hay cierre por tocar fuera ni cuenta atrás. */
  el.classList.toggle("abierta", hayVentana);
  chispasDeNivel();
  el.classList.remove("show");
  void el.offsetWidth;                 // reiniciar las animaciones
  el.classList.add("show");
  if (userHasTapped && navigator.vibrate) navigator.vibrate(hayVentana ? [40, 60, 40, 60, 140] : [30, 50, 90]);

  clearTimeout(ncelTimer);
  /* La red de seguridad es solo para la fiesta que pasa. La ventana con premio
     NO se va sola: se cierra a propósito o no se cierra, que es justo lo que
     se pidió. */
  if (!hayVentana) ncelTimer = setTimeout(cerrarNivelCel, 8000);
}

function chispasDeNivel() {
  const sp = document.getElementById("ncel-chispas");
  if (!sp) return;
  let ch = "";
  for (let i = 0; i < 22; i++) {
    const ang = (i / 22) * Math.PI * 2 + Math.random() * 0.3;
    const dist = 130 + Math.random() * 210;
    ch += `<i style="--dx:${(Math.cos(ang) * dist).toFixed(0)}px;--dy:${(Math.sin(ang) * dist).toFixed(0)}px;animation-delay:${(Math.random() * 0.4).toFixed(2)}s"></i>`;
  }
  sp.innerHTML = ch;
}

function cerrarNivelCel() {
  clearTimeout(ncelTimer);
  const el = document.getElementById("ncel");
  if (el) el.classList.remove("show");
}

/* Tocar el fondo cierra la fiesta que pasa y NO la ventana con premio. Va aquí
   y no en el marcado porque el mismo elemento hace las dos cosas. */
function tocarFondoNivel(ev) {
  const el = document.getElementById("ncel");
  if (!el || el.classList.contains("abierta")) return;
  if (ev.target === el) cerrarNivelCel();
}

/* Se llama después de cualquier registro que pueda dar puntos, y una vez al
   arrancar. Ese arranque no es un detalle: sin él, la PRIMERA llamada de una
   cuenta nueva sería justo la del primer nivel, se sembraría el marcador y la
   fiesta más importante de todas —la primera— no saldría nunca. */
function revisarNivelExpedicion() {
  if (typeof nivelExpedicion !== "function") return;
  state.ui = state.ui || {};
  const ahora = nivelExpedicion().nivel;
  const visto = state.ui.expNivelVisto;

  if (typeof visto !== "number") { state.ui.expNivelVisto = ahora; guardarLocal(state); return; }
  /* Hacia abajo también se apunta, sin fiesta: borrar una habilidad puede
     quitar puntos, y si el marcador se quedara arriba, recuperar ese nivel no
     se celebraría nunca. */
  if (ahora <= visto) {
    if (ahora < visto) { state.ui.expNivelVisto = ahora; guardarLocal(state); }
    return;
  }

  const abre = typeof desbloqueosDeExpedicion === "function"
    ? desbloqueosDeExpedicion(ahora).filter(x => x.nivel > visto)
    : [];
  state.ui.expNivelVisto = ahora;
  guardarLocal(state);
  celebrarNivel(ahora, abre);
}

/* ================= El destello =================
   La fiesta pequeña, y la que más veces se ve. Faltaba: la app tenía dos
   tamaños —la tarjeta de 2,2 s y la escena de pantalla completa de la racha—
   y los dos INTERRUMPEN. Con solo esos, o se festeja poco o se festeja
   tapando lo que estabas haciendo, así que se acababa festejando poco.

   Este dura 420 ms, sale ENCIMA de lo que tocaste y no para nada: ni tapa, ni
   se puede pulsar, ni mueve un píxel de la página. Es lo que convierte marcar
   una misión en algo que se siente, sin convertirlo en un acontecimiento.

   Va en `--piso-confeti`, que ya existía y dice exactamente esto: «la luz de
   celebrar, que no se toca». */
/* `objetivo` puede ser un elemento o una caja ya medida. Lo segundo hace falta
   cuando la lista se repinta entre el toque y la celebración: entonces el
   elemento que pulsaste ya no existe, y lo único que se conserva es dónde
   estaba. */
function destello(objetivo, color) {
  if (!objetivo) return;
  /* Quien pidió menos movimiento no recibe ninguno. Aquí no se pierde
     información: el aviso de siempre sigue saliendo igual. */
  try {
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  } catch (e) {}

  const r = typeof objetivo.getBoundingClientRect === "function"
    ? objetivo.getBoundingClientRect() : objetivo;
  if (!r || (!r.width && !r.height)) return;   // no está en pantalla: nada que celebrar

  const d = document.createElement("div");
  d.className = "destello";
  d.style.left = (r.left + r.width / 2) + "px";
  d.style.top = (r.top + r.height / 2) + "px";
  d.style.setProperty("--ds", color || "var(--mint)");

  /* Seis chispas y no dieciocho como la escena de la racha: esto tiene que
     leerse de reojo, no mirarse. Los ángulos se sortean para que dos toques
     seguidos no salgan calcados. */
  let chispas = "";
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2 + Math.random() * 0.5;
    const dist = 15 + Math.random() * 11;
    chispas += '<i style="--dx:' + (Math.cos(ang) * dist).toFixed(0) + 'px;--dy:' +
      (Math.sin(ang) * dist).toFixed(0) + 'px"></i>';
  }
  d.innerHTML = '<span class="ds-aro"></span>' + chispas;
  document.body.appendChild(d);
  /* Se quita solo. Sin esto, una tarde de misiones deja cien nodos muertos
     colgando del body. */
  setTimeout(() => d.remove(), 520);}

/* ================= Racha: celebrar los hitos =================
   El punto de una racha es dar una razón para volver mañana. Por eso los
   días redondos se celebran a lo grande y una sola vez: si la app festejara
   cada día, la fiesta dejaría de significar nada. */

function mensajeHito(n) {
  if (n >= 365) return "Un año entero sin soltarlo. Esto ya no es fuerza de voluntad, es quién eres.";
  if (n >= 200) return "Doscientos días. Muy poca gente llega hasta aquí.";
  if (n >= 100) return "Cien días seguidos. El hábito ya se sostiene solo.";
  if (n >= 50) return "Cincuenta días. Medio centenar de veces que elegiste aparecer.";
  if (n >= 30) return "Un mes completo sin fallar un solo día.";
  if (n >= 14) return "Dos semanas seguidas. Ya no es suerte.";
  if (n >= 7) return "¡Semana perfecta! Siete de siete.";
  return "Tres días seguidos: así es como empieza todo hábito.";
}

let scelTimer = null;

function celebrateStreak(n) {
  const el = document.getElementById("scel");
  if (!el) return;
  document.getElementById("scel-num").textContent = n;
  document.getElementById("scel-sub").textContent = mensajeHito(n);

  // Chispas en abanico, calculadas aquí para que salgan distintas cada vez
  const sp = document.getElementById("scel-sparks");
  let chispas = "";
  for (let i = 0; i < 18; i++) {
    const ang = (i / 18) * Math.PI * 2 + Math.random() * 0.3;
    const dist = 120 + Math.random() * 190;
    chispas += `<i style="--dx:${(Math.cos(ang) * dist).toFixed(0)}px;--dy:${(Math.sin(ang) * dist).toFixed(0)}px;animation-delay:${(Math.random() * 0.35).toFixed(2)}s;background:${Math.random() > 0.5 ? "#f5d76e" : "#ffd9a0"}"></i>`;
  }
  sp.innerHTML = chispas;

  el.classList.remove("show");
  void el.offsetWidth;                 // reiniciar las animaciones
  el.classList.add("show");
  if (userHasTapped && navigator.vibrate) navigator.vibrate([40, 60, 40, 60, 120]);
  clearTimeout(scelTimer);
  // Red de seguridad: si el botón se queda sin pulsar, no bloquea la app
  scelTimer = setTimeout(closeStreakCel, 12000);
}

function closeStreakCel() {
  clearTimeout(scelTimer);
  const el = document.getElementById("scel");
  if (el) el.classList.remove("show");
}

/* Se llama después de cualquier registro que pueda mantener viva la racha.
   Guarda hasta qué número ya se festejó para no repetir la fiesta al
   recargar, y para no celebrar hacia atrás si la racha venía de antes. */
function checkStreakMilestone() {
  const stk = streakInfo();
  if (!stk.activeToday) return;
  state.ui = state.ui || {};
  const ya = state.ui.rachaFestejada || 0;
  if (stk.cur <= ya) return;
  const merece = HITOS_RACHA.includes(stk.cur);
  state.ui.rachaFestejada = stk.cur;
  guardarLocal(state);
  if (merece) celebrateStreak(stk.cur);
}

/* ================= Escenas generadas ================= */

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* Ciclo del día: la escena cambia según la hora en que abres la app. */
function dayPhase() {
  const h = hourNow();
  if (h >= 19 || h < 6) return "night";
  if (h < 10) return "dawn";
  if (h < 17) return "day";
  return "dusk";
}

const PHASES = {
  night: {
    sky: ["#20304a", "#182335", "#121a26"], stars: 1,
    body: { x: 0.76, y: 0.30, r: 22, color: "#f2e7c4", glowRGB: "242,231,196", glowA: 0.3, craters: true },
    ridges: ["#2c3d51", "#22303f", "#182230"], pine: "#111926"
  },
  dawn: {
    sky: ["#3f4f78", "#a97e9a", "#f0b088"], stars: 0.25,
    body: { x: 0.30, y: 0.56, r: 20, color: "#ffd9a0", glowRGB: "255,200,140", glowA: 0.35 },
    ridges: ["#584a66", "#41374f", "#2a2438"], pine: "#1c1830"
  },
  day: {
    sky: ["#6ea7d4", "#a8cce8", "#cfe4f2"], stars: 0,
    body: { x: 0.78, y: 0.22, r: 24, color: "#fff3c9", glowRGB: "255,246,215", glowA: 0.55 },
    ridges: ["#4f7396", "#3d5c7e", "#2c4560"], pine: "#1f3348"
  },
  dusk: {
    sky: ["#503a63", "#a5536e", "#ef8a5b"], stars: 0.15,
    body: { x: 0.26, y: 0.60, r: 26, color: "#ffc98a", glowRGB: "255,170,110", glowA: 0.4 },
    ridges: ["#472f4e", "#35263e", "#241a2c"], pine: "#150d1a"
  }
};

/* Motivo abstracto según el icono de la habilidad: evoca el tema sin ser literal. */
const ICON_MOTIF = {
  brush: "aurora", pen: "aurora", camera: "aurora", gamepad: "aurora",
  music: "waves", mic: "waves",
  coffee: "ember", heart: "ember", flame: "ember",
  dumbbell: "peaks", bolt: "peaks", target: "peaks", trophy: "peaks", flag: "peaks", wrench: "peaks", shield: "peaks",
  book: "constellation", cap: "constellation", bulb: "constellation", code: "constellation", chart: "constellation", star: "constellation",
  coin: "fireflies", gem: "fireflies", crown: "fireflies", smile: "fireflies",
  plant: "forest", globe: "forest", map: "forest", compass: "forest",
  rod: "marea", goggles: "marea"
};
function motifFor(iconName) { return ICON_MOTIF[iconName] || "constellation"; }

/* Paisaje con ciclo del día. Exclusivo del Resumen y de "Nivel de tu personaje". */
function scene(w, h, seed, ph) {
  ph = ph || dayPhase();
  const P = PHASES[ph];
  const rnd = mulberry32(seed);
  const gid = "g" + seed + ph;
  let s = `<svg class="scene" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">`;
  s += `<defs>
    <linearGradient id="${gid}-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${P.sky[0]}"/><stop offset="0.55" stop-color="${P.sky[1]}"/><stop offset="1" stop-color="${P.sky[2]}"/>
    </linearGradient>
    <radialGradient id="${gid}-glow">
      <stop offset="0" stop-color="rgba(${P.body.glowRGB},${P.body.glowA})"/>
      <stop offset="0.3" stop-color="rgba(${P.body.glowRGB},${(P.body.glowA * 0.5).toFixed(3)})"/>
      <stop offset="0.55" stop-color="rgba(${P.body.glowRGB},${(P.body.glowA * 0.2).toFixed(3)})"/>
      <stop offset="0.8" stop-color="rgba(${P.body.glowRGB},${(P.body.glowA * 0.05).toFixed(3)})"/>
      <stop offset="1" stop-color="rgba(${P.body.glowRGB},0)"/>
    </radialGradient>
  </defs>`;
  s += `<rect width="${w}" height="${h}" fill="url(#${gid}-sky)"/>`;

  const nStars = Math.round(50 * P.stars);
  for (let i = 0; i < nStars; i++) {
    const x = rnd() * w, y = rnd() * h * 0.5, r = 0.4 + rnd() * 1.1, o = (0.25 + rnd() * 0.6) * Math.max(P.stars, 0.6);
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="#e9f2f5" opacity="${o.toFixed(2)}"/>`;
  }

  // Sol o luna, con halo de varias paradas para que el degradado no se corte
  const mx = w * P.body.x, my = h * P.body.y;
  s += `<circle cx="${mx}" cy="${my}" r="${P.body.r * 4.5}" fill="url(#${gid}-glow)"/>`;
  s += `<circle cx="${mx}" cy="${my}" r="${P.body.r}" fill="${P.body.color}"/>`;
  if (P.body.craters) {
    s += `<circle cx="${mx - 8}" cy="${my - 4}" r="4" fill="#e2d3a6"/><circle cx="${mx + 6}" cy="${my + 7}" r="2.6" fill="#e2d3a6"/>`;
  }

  // Cordilleras en capas
  const layers = [
    { b: 0.60, a: 26, c: P.ridges[0] },
    { b: 0.73, a: 20, c: P.ridges[1] },
    { b: 0.86, a: 15, c: P.ridges[2] }
  ];
  let frontPts = null;
  layers.forEach((L, li) => {
    const p1 = rnd() * 6.28, p2 = rnd() * 6.28, f1 = 1.2 + rnd() * 0.8, f2 = 2.6 + rnd() * 1.6;
    const pts = [];
    for (let i = 0; i <= 28; i++) {
      const t = i / 28;
      const y = h * L.b - L.a * (0.6 * Math.sin(t * f1 * 6.28 + p1) + 0.4 * Math.sin(t * f2 * 6.28 + p2));
      pts.push([w * t, y]);
    }
    if (li === 2) frontPts = pts;
    s += `<polygon points="${pts.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ")} ${w},${h} 0,${h}" fill="${L.c}"/>`;
  });

  for (let i = 0; i < 7; i++) {
    const [px, py] = frontPts[2 + Math.floor(rnd() * 25)];
    const phh = 12 + rnd() * 16, pw = phh * 0.55;
    s += `<polygon points="${px.toFixed(1)},${(py - phh).toFixed(1)} ${(px - pw / 2).toFixed(1)},${(py + 2).toFixed(1)} ${(px + pw / 2).toFixed(1)},${(py + 2).toFixed(1)}" fill="${P.pine}"/>`;
  }

  s += `</svg>`;
  return s;
}

function topoScene(w, h, seed) {
  const rnd = mulberry32(seed);
  const cx = w * 0.72, cy = h * 0.42;
  let s = `<svg class="scene" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">`;
  /* El lienzo y las curvas salen de las variables de la escena y no de dos
     hexes: dentro de `.scene-card` las declara la casa, y un ambiente las
     vuelve a declarar con las suyas. Es lo único de este dibujo que no
     necesita el tinte para cambiar de color. */
  s += `<rect width="${w}" height="${h}" fill="var(--motivo-lienzo)"/>`;
  const ph1 = rnd() * 6.28, ph2 = rnd() * 6.28;
  for (let r = 24; r < w * 0.72; r += 26) {
    const pts = [];
    for (let a = 0; a <= 40; a++) {
      const ang = a / 40 * 6.2832;
      const rr = r * (1 + 0.16 * Math.sin(ang * 3 + ph1 + r * 0.02) + 0.07 * Math.sin(ang * 5 + ph2));
      pts.push((cx + rr * Math.cos(ang)).toFixed(1) + "," + (cy + rr * Math.sin(ang)).toFixed(1));
    }
    s += `<polygon points="${pts.join(" ")}" fill="none" stroke="var(--motivo-curva)" stroke-width="1.2" opacity="${Math.max(0.15, 0.9 - r / (w * 0.85)).toFixed(2)}"/>`;
  }
  s += `<circle cx="${cx}" cy="${cy}" r="12" fill="var(--motivo-halo)"/><circle cx="${cx}" cy="${cy}" r="5" fill="var(--fire)"/>`;
  s += `</svg>`;
  return s;
}

/* ================= Fondos temáticos de habilidad =================
   Composición abstracta protagonista en el color de la habilidad,
   según su icono. Sin paisaje: eso es solo del Resumen y Habilidades. */

/* El motivo de una ficha: una franja ilustrada con el color de la cosa.
   Vive en DOS sitios con fondos opuestos —dentro de una tarjeta de escena,
   que se queda de noche siempre, y encima de una ficha, que de dia es clara—
   asi que ni el cielo ni las chispas pueden ir escritos aqui: salen de
   variables y cada sitio pone las suyas (ver `--motivo-*` en estilos.css). */
function motifScene(w, h, seed, motif, accent) {
  const rnd = mulberry32(seed);
  const gid = "m" + seed;
  let s = `<svg class="scene" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">`;
  s += `<defs>
    <linearGradient id="${gid}-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--motivo-cielo-1)"/><stop offset="1" stop-color="var(--motivo-cielo-2)"/>
    </linearGradient>
    <radialGradient id="${gid}-tint">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.2"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <filter id="${gid}-soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3"/></filter>
    <filter id="${gid}-glow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="2.4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`;
  s += `<rect width="${w}" height="${h}" fill="url(#${gid}-bg)"/>`;
  s += `<ellipse cx="${w * 0.5}" cy="${h * 0.42}" rx="${w * 0.55}" ry="${h * 0.75}" fill="url(#${gid}-tint)"/>`;

  // El tercio inferior se desvanece hacia la tarjeta, así que los motivos
  // concentran su peso visual en la mitad superior (V = h * 0.62).
  const V = h * 0.62;

  if (motif === "aurora") {
    s += `<path d="M-20 ${V * 0.75} C ${w * 0.25} ${V * 0.05}, ${w * 0.55} ${V * 1.15}, ${w + 20} ${V * 0.35}" stroke="${accent}" stroke-width="26" fill="none" stroke-linecap="round" opacity="0.4" filter="url(#${gid}-soft)"/>`;
    s += `<path d="M-20 ${V * 1.05} C ${w * 0.3} ${V * 0.45}, ${w * 0.62} ${V * 1.35}, ${w + 20} ${V * 0.6}" stroke="${accent}" stroke-width="14" fill="none" stroke-linecap="round" opacity="0.3" filter="url(#${gid}-soft)"/>`;
    s += `<path d="M-20 ${V * 0.62} C ${w * 0.28} ${-V * 0.05}, ${w * 0.58} ${V * 1.0}, ${w + 20} ${V * 0.22}" stroke="${accent}" stroke-width="4.5" fill="none" stroke-linecap="round" opacity="0.85" filter="url(#${gid}-glow)"/>`;
    for (let i = 0; i < 10; i++) {
      s += `<circle cx="${(rnd() * w).toFixed(1)}" cy="${(rnd() * V).toFixed(1)}" r="${(0.6 + rnd()).toFixed(2)}" fill="var(--motivo-chispa)" opacity="${(0.3 + rnd() * 0.5).toFixed(2)}"/>`;
    }
  }

  if (motif === "waves") {
    const cx = w * 0.15, cy = V * 0.55;
    for (let i = 1; i <= 7; i++) {
      s += `<circle cx="${cx}" cy="${cy}" r="${i * 25}" fill="none" stroke="${accent}" stroke-width="3" opacity="${Math.max(0.12, 0.65 - i * 0.08).toFixed(2)}"/>`;
    }
    s += `<circle cx="${cx}" cy="${cy}" r="7" fill="${accent}" filter="url(#${gid}-glow)"/>`;
    for (let i = 0; i < 5; i++) {
      const ang = (rnd() - 0.5) * 1.5, rr = 25 * (1 + Math.floor(rnd() * 6));
      s += `<circle cx="${(cx + rr * Math.cos(ang)).toFixed(1)}" cy="${(cy + rr * Math.sin(ang)).toFixed(1)}" r="3.6" fill="${accent}" filter="url(#${gid}-glow)"/>`;
    }
  }

  if (motif === "ember") {
    // Fogata: núcleo brillante a media altura, humo y chispas subiendo
    const fx = w * 0.5, fy = V * 0.92;
    s += `<ellipse cx="${fx}" cy="${fy + 6}" rx="140" ry="46" fill="${accent}" opacity="0.3" filter="url(#${gid}-soft)"/>`;
    s += `<ellipse cx="${fx}" cy="${fy}" rx="46" ry="20" fill="var(--motivo-brasa)" opacity="0.5" filter="url(#${gid}-soft)"/>`;
    s += `<circle cx="${fx}" cy="${fy - 4}" r="12" fill="var(--motivo-brasa-viva)" filter="url(#${gid}-glow)"/>`;
    s += `<path d="M${fx - 16} ${fy - 14} q 12 -20 1 -38 q -10 -18 5 -36" stroke="var(--motivo-humo)" stroke-width="5" fill="none" stroke-linecap="round" filter="url(#${gid}-soft)"/>`;
    s += `<path d="M${fx + 18} ${fy - 12} q 9 -16 0 -32 q -7 -13 4 -24" stroke="var(--motivo-humo-tenue)" stroke-width="3.6" fill="none" stroke-linecap="round" filter="url(#${gid}-soft)"/>`;
    for (let i = 0; i < 13; i++) {
      const x = fx + (rnd() - 0.5) * 230, y = fy - rnd() * V * 0.95;
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1.5 + rnd() * 2).toFixed(2)}" fill="${rnd() > 0.45 ? accent : "var(--motivo-brasa)"}" opacity="${(0.45 + rnd() * 0.5).toFixed(2)}" filter="url(#${gid}-glow)"/>`;
    }
  }

  if (motif === "peaks") {
    const pts = [];
    const n = 6;
    let hi = { x: 0, y: h };
    for (let i = 0; i <= n; i++) {
      const x = w * i / n;
      const y = i % 2 === 1 ? V * (0.22 + rnd() * 0.2) : V * (0.82 + rnd() * 0.18);
      pts.push([x, y]);
      if (y < hi.y) hi = { x, y };
    }
    const line = pts.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
    s += `<polygon points="${line} ${w},${h} 0,${h}" fill="${accent}" opacity="0.12"/>`;
    s += `<polyline points="${line}" fill="none" stroke="${accent}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" filter="url(#${gid}-glow)"/>`;
    s += `<polyline points="${pts.map(p => p[0].toFixed(1) + "," + (p[1] + 22).toFixed(1)).join(" ")}" fill="none" stroke="${accent}" stroke-width="2.2" stroke-linejoin="round" opacity="0.28"/>`;
    s += `<line x1="${hi.x}" y1="${hi.y}" x2="${hi.x}" y2="${hi.y - 20}" stroke="${accent}" stroke-width="2.8"/>`;
    s += `<polygon points="${hi.x},${hi.y - 20} ${hi.x + 17},${hi.y - 15} ${hi.x},${hi.y - 10}" fill="${accent}"/>`;
  }

  if (motif === "constellation") {
    for (let i = 0; i < 20; i++) {
      s += `<circle cx="${(rnd() * w).toFixed(1)}" cy="${(rnd() * V * 1.2).toFixed(1)}" r="${(0.5 + rnd()).toFixed(2)}" fill="var(--motivo-chispa)" opacity="${(0.25 + rnd() * 0.5).toFixed(2)}"/>`;
    }
    const pts = Array.from({ length: 7 }, (_, i) => [w * (0.08 + i * 0.14 + rnd() * 0.04), V * (0.12 + rnd() * 0.78)]);
    let path = "";
    pts.forEach(([x, y], i) => {
      path += (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1) + " ";
    });
    s += `<path d="${path}" stroke="${accent}" stroke-width="1.8" fill="none" opacity="0.6"/>`;
    pts.forEach(([x, y], i) => {
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i === 3 ? 5.5 : 3.2}" fill="${accent}" filter="url(#${gid}-glow)"/>`;
    });
  }

  if (motif === "fireflies") {
    for (let i = 0; i < 4; i++) {
      s += `<circle cx="${(rnd() * w).toFixed(1)}" cy="${(rnd() * V).toFixed(1)}" r="${(18 + rnd() * 16).toFixed(1)}" fill="${accent}" opacity="0.09" filter="url(#${gid}-soft)"/>`;
    }
    for (let i = 0; i < 13; i++) {
      const x = rnd() * w, y = rnd() * V * 1.05, r = 1.8 + rnd() * 2.8;
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * 3.4).toFixed(1)}" fill="${accent}" opacity="0.16"/>`;
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${accent}" opacity="0.95" filter="url(#${gid}-glow)"/>`;
    }
  }

  if (motif === "marea") {
    /* Agua vista desde dentro, no desde la orilla: la superficie arriba, los
       rayos entrando en diagonal y las burbujas subiendo. Es el punto en
       común entre pescar y bucear, y funciona con cualquier acento porque
       todo el motivo se tiñe del color de la habilidad. */
    const sup = V * 0.42;
    for (let i = 0; i < 4; i++) {
      const x = w * (0.06 + rnd() * 0.84), an = 14 + rnd() * 24;
      s += `<polygon points="${x.toFixed(1)},${sup.toFixed(1)} ${(x + an).toFixed(1)},${sup.toFixed(1)} ${(x + an * 2).toFixed(1)},${h} ${(x - an * 0.5).toFixed(1)},${h}" fill="${accent}" opacity="0.055"/>`;
    }
    for (let i = 0; i < 4; i++) {
      const y = sup + i * V * 0.26, amp = 8 - i * 1.5, paso = 46 + i * 9;
      let d = `M-30 ${y.toFixed(1)}`;
      for (let x = -30, k = 0; x < w + 30; x += paso, k++) {
        d += ` q ${(paso / 2).toFixed(1)} ${(k % 2 ? amp : -amp).toFixed(1)} ${paso} 0`;
      }
      s += `<path d="${d}" fill="none" stroke="${accent}" stroke-width="${(3.6 - i * 0.7).toFixed(1)}" opacity="${(0.78 - i * 0.17).toFixed(2)}" stroke-linecap="round" filter="url(#${gid}-${i === 0 ? "glow" : "soft"})"/>`;
    }
    for (let i = 0; i < 11; i++) {
      const x = rnd() * w, y = sup + rnd() * (V * 1.15 - sup), r = 1.3 + rnd() * 3;
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="none" stroke="${accent}" stroke-width="1.5" opacity="${(0.28 + rnd() * 0.45).toFixed(2)}"/>`;
    }
  }

  if (motif === "forest") {
    for (let i = 0; i < 13; i++) {
      const x = rnd() * w, hh = 22 + rnd() * 18, base = V * 0.72 + rnd() * 8;
      s += `<polygon points="${x.toFixed(1)},${(base - hh).toFixed(1)} ${(x - hh * 0.32).toFixed(1)},${base.toFixed(1)} ${(x + hh * 0.32).toFixed(1)},${base.toFixed(1)}" fill="#2c3849"/>`;
    }
    for (let i = 0; i < 10; i++) {
      const x = rnd() * w, hh = 34 + rnd() * 22, base = V * 1.02;
      s += `<polygon points="${x.toFixed(1)},${(base - hh).toFixed(1)} ${(x - hh * 0.34).toFixed(1)},${base.toFixed(1)} ${(x + hh * 0.34).toFixed(1)},${base.toFixed(1)}" fill="#1a2331"/>`;
    }
    for (let i = 0; i < 3; i++) {
      const bx = w * (0.12 + rnd() * 0.7), by = V * (0.12 + rnd() * 0.3);
      s += `<path d="M${bx.toFixed(1)} ${by.toFixed(1)} q 6 -6 12 0 q 6 -6 12 0" stroke="var(--motivo-espuma)" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    }
    for (let i = 0; i < 4; i++) {
      s += `<circle cx="${(rnd() * w).toFixed(1)}" cy="${(V * (0.45 + rnd() * 0.35)).toFixed(1)}" r="2" fill="${accent}" opacity="0.95" filter="url(#${gid}-glow)"/>`;
    }
  }

  s += `</svg>`;
  return s;
}

/* ================= Niveles y XP =================
   XP para pasar del nivel L al L+1: 100 + L*50. Total a nivel 10: 3250. */

/* Curva exponencial (×1.62 por nivel), no lineal.
   La lineal de antes sumaba 3.250 XP hasta el nivel 10: con una sola misión
   diaria de 20 XP se llegaba al máximo en cinco meses, y una habilidad que
   se termina en un semestre no representa haber aprendido nada.

   Un primer intento con factor 1.8 se pasó al otro lado: ~40.000 XP en
   total dejaban al usuario de uso ligero a once años del máximo, y una meta
   inalcanzable desmotiva igual que una regalada. El equilibrio no está en
   hacerlo largo, está en que se note el avance todo el tiempo.

   Factor 1.5 y ~10.200 XP. Medido: uso normal 1,7 años al máximo; ligero
   2,9; el nivel 8 —que es donde vive la mayoría— cae antes del año incluso
   con poco uso. El primer nivel sigue llegando en cinco días, porque si los
   primeros días no premian nadie llega al segundo. */
function xpForLevel(level) {
  return Math.round(90 * Math.pow(1.5, level) / 5) * 5;
}

function totalXpForLevel(level) {
  let total = 0;
  for (let l = 0; l < level; l++) total += xpForLevel(l);
  return total;
}

function levelInfo(xp) {
  let level = 0;
  let remaining = xp;
  while (level < MAX_LEVEL && remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level++;
  }
  if (level >= MAX_LEVEL) {
    return { level: MAX_LEVEL, inLevel: 0, needed: 0, pct: 100 };
  }
  const needed = xpForLevel(level);
  return { level, inLevel: remaining, needed, pct: Math.round((remaining / needed) * 100) };
}

/* ================= Anillos ================= */

function ring(size, stroke, segments, trackColor) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  let offset = 0;
  let paths = `<circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="${trackColor}" stroke-width="${stroke}"/>`;
  for (const seg of segments) {
    if (seg.pct <= 0) continue;
    const len = Math.min(seg.pct, 1) * c;
    paths += `<circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="${seg.color}" stroke-width="${stroke}"
      stroke-linecap="round" stroke-dasharray="${len} ${c - len}" stroke-dashoffset="${-offset}"/>`;
    offset += len;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${paths}</svg>`;
}

/* Anillo animado del detalle: arranca en fromPct y fluye hasta pct. */
function animRing(size, stroke, pct, color, fromPct, trackColor) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  const lenF = Math.min(fromPct, 1) * c;
  const len = Math.min(pct, 1) * c;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="${trackColor}" stroke-width="${stroke}"/>
    <circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}"
      stroke-linecap="round" stroke-dasharray="${lenF.toFixed(1)} ${(c - lenF).toFixed(1)}"
      data-anim data-target="${len.toFixed(1)} ${(c - len).toFixed(1)}"
      style="transition: stroke-dasharray 0.9s cubic-bezier(0.22, 1, 0.36, 1)"/>
  </svg>`;
}

function playRings(container) {
  container.querySelectorAll("circle[data-anim]").forEach(circ => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      circ.setAttribute("stroke-dasharray", circ.dataset.target);
    }));
  });
}

/* ================= Decaimiento ================= */

/* ================= La curva de descenso =================
   Es el espejo de la de crecimiento, y hasta ahora no lo era: se perdía una
   cifra fija multiplicada a ojo por el nivel, que no respondía a ninguna
   pregunta útil.

   Regla nueva, en una frase: **abandonar una habilidad cuesta un nivel cada
   45 días, estés donde estés**. Como cada nivel cuesta 1,5 veces más que el
   anterior, el desgaste diario crece igual de rápido que el crecimiento —
   2 XP/día en el nivel 1, 51 en el nivel 9— y la proporción se mantiene.

   Esto no es solo elegancia: hace que "te quedan X días para bajar de
   nivel" sea una cifra real y no una estimación, y por eso se puede enseñar
   en pantalla sin mentirle a nadie.

   Encima siguen los dos techos: nunca más de lo ganado en cinco días
   activos, ni más de un cuarto de lo acumulado. Volver tras un verano fuera
   duele, pero no borra el año. */
const DIAS_POR_NIVEL_PERDIDO = 45;

function desgasteDiario(s) {
  const nv = levelInfo(s.xp).level;
  const banda = xpForLevel(Math.max(0, nv - 1));   // lo que costó el nivel en el que estás
  return Math.max(1, Math.round(banda / DIAS_POR_NIVEL_PERDIDO));
}

/* Días de abandono que faltan para caer un nivel completo. Cuenta desde
   hoy: si la habilidad aún está en su periodo de gracia, esos días se
   suman, porque durante la gracia no se pierde nada. */
function diasParaBajarNivel(s) {
  const nv = levelInfo(s.xp).level;
  if (nv <= 0) return null;
  const sobrante = s.xp - totalXpForLevel(nv);
  const dias = Math.ceil(sobrante / desgasteDiario(s));
  const ocioso = daysBetween(s.lastActivity || s.createdAt, todayKey());
  const gracia = Math.max(0, (s.graceDays || 7) - ocioso);
  return Math.max(1, dias) + gracia;
}

/* Cuánto puede quitar el desgaste como mucho: lo ganado en los cinco días
   con actividad más recientes. Se mide contra el ritmo real de esa persona
   y no contra una cifra inventada, así que a quien practica poco le duele
   poco y a quien practica mucho le duele en proporción. */
function techoDeDesgaste(s) {
  const porDia = new Map();
  (s.log || []).forEach(e => {
    if (e.xp > 0) porDia.set(e.date, (porDia.get(e.date) || 0) + e.xp);
  });
  const recientes = [...porDia.keys()].sort().reverse().slice(0, 5);
  const cincoDias = recientes.reduce((a, k) => a + porDia.get(k), 0) || (s.decayPerDay || 10) * 5;
  /* Segundo techo, y es el que de verdad salva: nunca más de una cuarta
     parte de lo que tienes. Sin él, una habilidad cuyo historial sea una
     sola entrada grande podía quedarse en cero de una tacada, que es
     exactamente el golpe que esto pretende evitar. */
  const cuarto = Math.ceil(s.xp * 0.25);
  return Math.max(1, Math.min(cincoDias, cuarto));
}

function applyDecay() {
  const today = todayKey();
  let changed = false;
  for (const s of state.skills) {
    if (!s.lastCheck) { s.lastCheck = today; changed = true; continue; }
    if (s.lastCheck === today) continue;

    if (!s.permanent && s.xp > 0) {
      const last = s.lastActivity || s.createdAt;
      /* El desgaste escala con el nivel. Con la curva exponencial, una cifra
         fija dejó de significar lo mismo arriba que abajo: 10 XP al día
         vacían un nivel 1 en nueve días y son ruido contra los 11.000 XP de
         un nivel 9. Escalarlo mantiene la regla honesta —lo que no se usa se
         pierde— en todo el recorrido, sin ensañarse al principio. */
      const porDia = desgasteDiario(s);
      let lost = 0;
      let cursor = s.lastCheck;
      let guard = 4000;
      while (cursor < today && guard-- > 0) {
        cursor = addDaysKey(cursor, 1);
        const idle = daysBetween(last, cursor);
        if (idle > s.graceDays) lost += porDia;
      }
      /* Techo del castigo: por muchos meses que pasen, el abandono nunca
         cuesta más de lo que ganaste en tus últimos cinco días activos.
         Volver y encontrarse el trabajo de un año evaporado no corrige un
         hábito, hace cerrar la app para siempre. */
      const techo = techoDeDesgaste(s);
      if (lost > techo) lost = techo;
      if (lost > 0) {
        const real = Math.min(lost, s.xp);
        s.xp -= real;
        s.log.unshift({ date: today, xp: -real, note: "Decaimiento por inactividad" });
        changed = true;
      }
    }
    s.lastCheck = today;
    changed = true;
  }
  if (changed) save();
}

function isDecaying(s) {
  if (s.permanent || s.xp <= 0) return false;
  const last = s.lastActivity || s.createdAt;
  return daysBetween(last, todayKey()) > s.graceDays;
}

/* Días de gracia que quedan, o null si no hay ninguno que contar.
   Una habilidad sin XP no tiene periodo de gracia porque no tiene nada que
   perder: el contador seguía corriendo igual y acababa enseñando cosas como
   "te quedan -23 días", que además de no significar nada metía prisa por
   proteger un cero. applyDecay e isDecaying ya la dejaban fuera; lo que
   faltaba era que la cuenta tampoco existiera. */
function daysUntilDecay(s) {
  if (s.permanent || s.xp <= 0) return null;
  const last = s.lastActivity || s.createdAt;
  return Math.max(0, s.graceDays - daysBetween(last, todayKey()));
}

/* Días que una habilidad lleva sin ganar nada. Para las que nunca se han
   estrenado se cuenta desde que se creó, que es cuando empezó a esperar. */
function diasSinGanar(s) {
  return daysBetween(s.lastActivity || s.createdAt, todayKey());
}

/* Preguntas para las habilidades que llevan mucho sin estrenarse.
   Son preguntas y no recordatorios a propósito: la habilidad la eligió el
   usuario, así que lo útil es devolverle la elección, no señalarle una
   deuda. Van sin cifras ni rachas por lo mismo — en cuanto se pone un
   número al abandono deja de ser una invitación y pasa a ser un reproche.
   La frase se elige por la habilidad y la semana, así que cambia con el
   tiempo pero no baila cada vez que se abre la ficha. */
const DIAS_PARA_INVITAR = 14;

const INVITACIONES = [
  "¿Y si hoy la estrenas? Con un rato corto ya cuenta.",
  "¿Sigue siendo algo que te gustaría aprender?",
  "¿Por dónde sería lo más fácil de empezar?",
  "¿Le damos una oportunidad esta semana?",
  "¿Qué haría falta para dar el primer paso?",
  "¿La probamos una vez y vemos qué tal se siente?",
  "¿Qué te llamó la atención de esto cuando la anotaste?",
  "¿Existe una versión pequeña de esto que quepa hoy?",
  "¿Sería más fácil con alguien más?",
  "¿Hay algo que estés esperando para empezar?",
  "¿Cuál sería el primer paso, aunque fuera diminuto?",
  "¿Te gustaría que esto formara parte de tu semana?",
  "¿Cuándo te quedaría mejor probarla?",
  "¿Qué se te ocurre hacer con esto en diez minutos?",
  "¿Te sigue dando curiosidad?",
  "¿Qué necesitarías tener a mano para arrancar?",
  "¿Hay un día de la semana donde encajaría bien?",
  "¿Prefieres empezarla en serio o solo asomarte?",
  "¿La dejamos aquí un tiempo más o le buscamos hueco?",
  "¿Qué versión de esto te gustaría estar haciendo dentro de un año?"
];

function invitacionPara(s) {
  const semana = Math.floor(Date.now() / (7 * 864e5));
  return INVITACIONES[(hashSeed(s.id) + semana) % INVITACIONES.length];
}

/* ================= Racha ================= */

/* Días con actividad real: práctica registrada (incluidas las de nivel máximo,
   que dan 0 XP) y movimientos en talentos. El decaimiento no cuenta. */
/* Cuántas cosas registraste cada día, no solo si registraste algo. Con el
   número se puede distinguir un día de rozar el mínimo de uno redondo, que
   es lo que hace que la tira de días sirva para leer tu ritmo. */
function activityDayCounts() {
  const m = new Map();
  const add = k => m.set(k, (m.get(k) || 0) + 1);
  for (const s of state.skills) {
    for (const e of s.log) {
      if (e.xp >= 0 && !/^Decaimiento/.test(e.note || "")) add(e.date);
    }
  }
  for (const p of state.perks) {
    for (const e of (p.history || [])) if (e.date) add(e.date);
  }
  for (const ms of state.missions) {
    /* Con `missionCount` y no comparando el valor con cero: desde que una
       marca es una lista con identidad propia en vez de un contador,
       `ms.log[k] > 0` compara un array con un número y da falso SIEMPRE. El
       efecto era invisible porque una misión enlazada a una habilidad sigue
       marcando el día por su movimiento de XP; las que no tienen habilidad
       —que son muchas— dejaron de contar para la racha sin que nadie lo
       notara. */
    for (const k of Object.keys(ms.log || {})) if (missionCount(ms, k) > 0) add(k);
  }
  return m;
}

function activityDaySet() {
  return new Set(activityDayCounts().keys());
}

/* Dos letras para martes y miércoles: con una sola, "M" y "M" seguidas no
   se distinguen y la semana deja de leerse. */
const DOW_LETRA = ["D", "L", "Ma", "Mi", "J", "V", "S"];
const HITOS_RACHA = [3, 7, 14, 30, 50, 100, 200, 365, 500, 1000];

function streakInfo() {
  const counts = activityDayCounts();
  const set = new Set(counts.keys());
  // Racha actual: días consecutivos con práctica, terminando hoy o ayer
  let cur = 0;
  let k = todayKey();
  if (!set.has(k)) k = addDaysKey(k, -1);
  let guard = 4000;
  while (set.has(k) && guard-- > 0) { cur++; k = addDaysKey(k, -1); }
  // Mejor racha histórica
  const days = [...set].sort();
  let best = 0, run = 0, prev = null;
  for (const k of days) {
    run = (prev && daysBetween(prev, k) === 1) ? run + 1 : 1;
    if (run > best) best = run;
    prev = k;
  }
  /* Últimos 14 días, hoy primero (a la izquierda): así el número de casillas
     verdes contadas desde el principio coincide con la racha actual, en vez
     de tener que contar desde el otro extremo. Un día ya pasado sin ninguna
     práctica se marca como "saltado" (se pinta en rojo) solo si cae después
     del primer registro que existe en la app entera; los días de antes de
     que el usuario empezara a usarla quedan neutros, no como huecos. */
  const first = days[0] || null;
  const last14 = [];
  const t = todayKey();
  for (let i = 0; i <= 13; i++) {
    const k2 = addDaysKey(t, -i);
    const n = counts.get(k2) || 0;
    let estado;
    if (n > 0) estado = "done";
    else if (i === 0) estado = "today";
    else if (first && k2 >= first) estado = "missed";
    else estado = "empty";
    last14.push({
      key: k2, estado, n, hoy: i === 0,
      letra: DOW_LETRA[weekdayOfKey(k2)],
      dia: Number(k2.slice(8, 10))
    });
  }

  /* La semana en curso, de domingo a sábado. Es lo que se enseña: una
     semana natural deja ver los días que TODAVÍA no llegan, y esos no
     pueden marcarse como fallados — solo el pasado se juzga. */
  const semana = [];
  const inicio = addDaysKey(t, -weekdayOfKey(t));
  for (let i = 0; i < 7; i++) {
    const k2 = addDaysKey(inicio, i);
    const n = counts.get(k2) || 0;
    const esHoy = k2 === t;
    let estado;
    if (n > 0) estado = "done";
    else if (k2 > t) estado = "futuro";        // aún no ocurre: nunca en rojo
    else if (esHoy) estado = "hoy";
    else if (first && k2 >= first) estado = "missed";
    else estado = "empty";                     // antes de que existiera nada
    semana.push({ key: k2, estado, n, hoy: esHoy, letra: DOW_LETRA[i], dia: Number(k2.slice(8, 10)) });
  }

  return { cur, best, last14, semana, activeToday: set.has(t) };
}

