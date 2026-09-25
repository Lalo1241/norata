/* ================= Arcade, el mundo secreto (0.7.131) =================

   Un mundo que no sale en ningún menú. Letra de píxel (CelestiByte, de
   Eduardo), cajas de sprite, barras por celdas, tramado en vez de degradado y
   sonidos de 8 bits. Lo diseñó Eduardo sobre un boceto con la app de verdad
   dentro, y lo que se decidió está escrito en `apariencias/LEEME.md`, que es
   el documento que manda.

   ---- Cómo se abre ----
   Con el código Konami: ↑ ↑ ↓ ↓ ← → ← → B A.
     - En la PC, con el teclado, en cualquier momento.
     - En el teléfono no hay flechas, así que la pista la da una luciérnaga
       RARA (js/05-resumen.js): blanca azulada y cuadrada, sale una noche de
       cada quince y solo a quien ya atrapó tres normales. Deja un píxel en
       una esquina del Resumen el resto de esa noche, y el píxel abre un mando.

   **Gratis para siempre para quien lo teclee**, pague o no. Es la única
   excepción al cobro: ningún otro secreto abre nada de pago.

   ---- Lo que NO es ----
   No es un mundo en el sentido de `mundos/`: no declara colores. Es una capa
   de material que va ENCIMA del ambiente que tengas (atributo `data-material`,
   aparte de `data-apariencia`), porque Eduardo lo quiso como una versión
   alterada de la Norata original. Con un mundo puesto no puede ir: un mundo
   ya trae su propio material. Encenderlo quita el mundo y deja tu ambiente
   (`arcadeAlternar`); elegir un mundo lo apaga (`elegirApariencia`).

   ---- Las tres reglas que no se rompen ----
   - **Lo encontrado no se vuelve a cerrar.** Se guarda en la cuenta
     (`settings.secretos`) y `fusionarEstados` une las dos listas, como los
     candados rotos.
   - **Llevarlo puesto es del dispositivo; encontrarlo es de la cuenta.** La
     llave `norata-material` vive en localStorage, como la apariencia, y al
     arrancar se quita si la cuenta que entra no lo encontró.
   - **Un mundo viste; no actúa.** Hasta la 1.0, Arcade cambia cómo se ve y
     cómo suena lo que la app YA hace. Nada de pantallas ni cuentas propias.

   ---- Lo que va en otros archivos ----
   - `css/arcade.css` (se genera con `mundos/arcade.py`): el material. No va
     en ASSETS: lo baja solo quien lo lleva puesto.
   - `css/estilos.css`: la rara, el píxel, el mando y el mensaje, que existen
     ANTES de encontrarlo, y el `@font-face` de la letra.
   - Los ganchos de sonido: `logMission`, `celebrate`, `celebrarNivel`,
     `celebrateStreak` y `jCampana`. Y los rangos: `rangosDeApariencia` y
     `svgDeTrazo`. */

const ARCADE_LLAVE = "norata-material";
const ARCADE_KONAMI = ["u", "u", "d", "d", "l", "r", "l", "r", "b", "a"];

function arcadeEncontrado() {
  const s = state && state.settings && state.settings.secretos;
  return Array.isArray(s) && s.indexOf("arcade") >= 0;
}
function arcadePuesto() {
  return document.documentElement.getAttribute("data-material") === "arcade";
}
function arcadeConSonido() {
  return !(state && state.settings && state.settings.arcadeSonido === false);
}

/* ---------- Los dibujos de píxel ----------
   En rejilla de 12 y de RELLENO, no de trazo: un dibujo de línea a 1,7 de
   grosor no se puede pixelar sin que se vuelva borroso. */
const ARC_G = {
  ficha: ["....####....", "..##....##..", ".#........#.", ".#...##...#.", "#....##....#", "#....##....#", "#....##....#", "#....##....#", ".#...##...#.", ".#........#.", "..##....##..", "....####...."],
  corazon: ["............", ".###....###.", "#####..#####", "############", "############", "############", ".##########.", "..########..", "...######...", "....####....", ".....##.....", "............"],
  cruceta: ["....####....", "....#..#....", "....#..#....", "....#..#....", "####....####", "#..........#", "#..........#", "####....####", "....#..#....", "....#..#....", "....#..#....", "....####...."],
  estrella: [".....##.....", ".....##.....", "....####....", "....####....", "############", ".##########.", "..########..", "...######...", "...###.###..", "..##.....##.", ".##.......##", "............"],
  corona: ["............", "#....##....#", "##..####..##", "###.####.###", "############", "############", "############", ".##########.", ".##########.", "............", ".##########.", "............"],
  moneda: ["..####..", ".#....#.", "#..##..#", "#..##..#", "#..##..#", "#..##..#", ".#....#.", "..####.."]
};
function arcRects(filas) {
  let r = "";
  filas.forEach((fila, y) => {
    let x = 0;
    while (x < fila.length) {
      if (fila[x] !== "#") { x++; continue; }
      let w = 1;
      while (fila[x + w] === "#") w++;
      r += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="1"/>';
      x += w;
    }
  });
  return r;
}
function arcDibujo(filas, tam) {
  return '<svg width="' + tam + '" height="' + tam + '" viewBox="0 0 ' + filas[0].length + " " + filas.length +
    '" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true">' + arcRects(filas) + "</svg>";
}

/* Los cinco rangos. Los aprobó Eduardo. Ninguno inflexiona —«Ahora eres
   Leyenda» le dice lo mismo a todo el mundo— y los niveles no se tocan: son
   los de la casa. El `data-px` es lo que le dice a `svgDeTrazo` que este
   dibujo es de relleno. */
const ARCADE_RANGOS = [
  ["Aspirante", "ficha"], ["Constante", "corazon"], ["Estratega", "cruceta"],
  ["Imparable", "estrella"], ["Leyenda", "corona"]
].map(([nombre, g]) => ({ nombre, trazo: '<g data-px="1">' + arcRects(ARC_G[g]) + "</g>" }));

/* ---------- El sonido ----------
   Sintetizado en el momento, onda cuadrada y triangular: pesa cero. Ninguna
   melodía es copia de un juego. Solo suenan los premios; los botones callan.
   Y solo con Arcade puesto: el sonido es del mundo, no de la app. */
let arcCtx = null;
function arcAudio() {
  try {
    arcCtx = arcCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (arcCtx.state === "suspended") arcCtx.resume();
  } catch (e) { return null; }
  return arcCtx;
}
/* El navegador solo deja sonar después de un toque. Se despierta en cada uno,
   porque el final de un tramo del Pomodoro suena sin que nadie toque nada. */
document.addEventListener("pointerdown", () => { if (arcadePuesto() || arcCtx) arcAudio(); }, true);

function arcNota(f, t, d, o) {
  o = o || {};
  const c = arcAudio();
  if (!c) return;
  const os = c.createOscillator(), g = c.createGain(), t0 = c.currentTime + 0.01 + t, v = o.vol || 0.05;
  os.type = o.tipo || "square";
  os.frequency.setValueAtTime(f, t0);
  if (o.a) os.frequency.exponentialRampToValueAtTime(o.a, t0 + d);
  g.gain.setValueAtTime(v, t0);
  g.gain.setValueAtTime(v, t0 + d * 0.55);
  g.gain.exponentialRampToValueAtTime(0.0008, t0 + d);
  os.connect(g); g.connect(c.destination);
  os.start(t0); os.stop(t0 + d + 0.03);
}
function arcRuido(d, vol) {
  const c = arcAudio();
  if (!c) return;
  const b = c.createBuffer(1, Math.floor(c.sampleRate * d), c.sampleRate), x = b.getChannelData(0);
  for (let i = 0; i < x.length; i++) x[i] = (Math.random() * 2 - 1) * (1 - i / x.length);
  const s = c.createBufferSource(), g = c.createGain();
  s.buffer = b; g.gain.value = vol;
  s.connect(g); g.connect(c.destination); s.start();
}
const ARC_F = { C3: 130.81, F3: 174.61, G3: 196, C4: 261.63, G4: 392, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880,
  C6: 1046.5, D6: 1174.66, E6: 1318.51, G6: 1567.98, A6: 1760, B6: 1975.53, C7: 2093, E7: 2637, G7: 3136 };
const ARC_SONIDOS = {
  moneda: () => { arcNota(ARC_F.C6, 0, 0.07); arcNota(ARC_F.G6, 0.07, 0.26); },
  paso: () => arcNota(ARC_F.E6, 0, 0.06, { vol: 0.035 }),
  desmarcar: () => arcNota(ARC_F.G5, 0, 0.14, { a: ARC_F.G4, vol: 0.035 }),
  fiesta: () => {
    [ARC_F.C5, ARC_F.E5, ARC_F.G5, ARC_F.C6, ARC_F.E6, ARC_F.G6].forEach((n, i) => arcNota(n, i * 0.05, 0.07, { vol: 0.04 }));
    arcNota(ARC_F.C7, 0.3, 0.22, { vol: 0.04 });
  },
  racha: () => { arcNota(ARC_F.E6, 0, 0.06, { vol: 0.04 }); arcNota(ARC_F.B6, 0.07, 0.16, { vol: 0.04 }); },
  rango: () => {
    [[ARC_F.C5, 0, 0.09], [ARC_F.E5, 0.09, 0.09], [ARC_F.G5, 0.18, 0.09], [ARC_F.C6, 0.27, 0.18], [ARC_F.A5, 0.5, 0.09], [ARC_F.C6, 0.59, 0.5]]
      .forEach(([n, t, d]) => arcNota(n, t, d, { vol: 0.045 }));
    [[ARC_F.C3, 0, 0.27], [ARC_F.F3, 0.27, 0.23], [ARC_F.G3, 0.5, 0.6]].forEach(([n, t, d]) => arcNota(n, t, d, { tipo: "triangle", vol: 0.12 }));
  },
  fase: () => {
    [[ARC_F.G5, 0, 0.08], [ARC_F.C6, 0.08, 0.08], [ARC_F.E6, 0.16, 0.08], [ARC_F.G6, 0.24, 0.12], [ARC_F.E6, 0.38, 0.08], [ARC_F.C7, 0.46, 0.4]]
      .forEach(([n, t, d]) => arcNota(n, t, d, { vol: 0.045 }));
    [[ARC_F.C3, 0, 0.36], [ARC_F.G3, 0.38, 0.5]].forEach(([n, t, d]) => arcNota(n, t, d, { tipo: "triangle", vol: 0.12 }));
  },
  konami: () => {
    [ARC_F.C5, ARC_F.D5, ARC_F.E5, ARC_F.G5, ARC_F.A5, ARC_F.C6, ARC_F.D6, ARC_F.E6, ARC_F.G6, ARC_F.A6].forEach((n, i) => arcNota(n, i * 0.045, 0.06, { vol: 0.035 }));
    [ARC_F.C6, ARC_F.E6, ARC_F.G6].forEach(n => arcNota(n, 0.48, 0.55, { vol: 0.03 }));
    arcNota(ARC_F.C4, 0.48, 0.55, { tipo: "triangle", vol: 0.12 });
  },
  rara: () => [ARC_F.C7, ARC_F.E7, ARC_F.G7].forEach((n, i) => arcNota(n, i * 0.05, i === 2 ? 0.14 : 0.05, { tipo: "triangle", vol: 0.06 })),
  tic: () => arcNota(1200, 0, 0.04, { vol: 0.025 }),
  // La salida «3, 2, 1» y la cuenta del descanso, vestidas de 8 bits.
  cuenta: () => arcNota(ARC_F.A5, 0, 0.09, { vol: 0.045 }),
  ya: () => { arcNota(ARC_F.A6, 0, 0.32, { vol: 0.045 }); arcNota(ARC_F.A5 / 2, 0, 0.32, { tipo: "triangle", vol: 0.1 }); },
  error: () => { arcRuido(0.06, 0.05); arcNota(110, 0, 0.1, { vol: 0.04 }); }
};
/* Lo que pasa en la app, con Arcade puesto. */
function arcadeSonar(k) {
  if (!arcadePuesto() || !arcadeConSonido() || !ARC_SONIDOS[k]) return;
  // La puerta de todos los sonidos (js/01-base.js): una vez por sonido, no por nota.
  if (!puedeSonar(arcAudio())) return;
  ARC_SONIDOS[k]();
}
/* El camino para encontrarlo: la rara, el mando y el código suenan aunque
   Arcade todavía no exista para esta cuenta. Son el momento del hallazgo. */
function arcadeSonarSiempre(k) {
  if (!arcadeConSonido() || !ARC_SONIDOS[k]) return;
  if (!puedeSonar(arcAudio())) return;
  ARC_SONIDOS[k]();
}

/* ---------- Al cumplir una misión ----------
   La llama `logMission` con la caja del botón de ANTES de repintar, que es
   donde está el dedo: la fila cambia de columna al cumplirse. */
function arcadeMision(caja, cumplida, deshecha, avanzo) {
  if (!arcadePuesto()) return;
  if (deshecha) { arcadeSonar("desmarcar"); return; }
  if (!cumplida) { if (avanzo) arcadeSonar("paso"); return; }
  arcadeSonar("moneda");
  if (!caja) return;
  try { if (matchMedia("(prefers-reduced-motion: reduce)").matches) return; } catch (e) {}
  const x = caja.left + caja.width / 2, y = caja.top;
  const m = document.createElement("span");
  m.className = "arc-moneda";
  m.innerHTML = arcDibujo(ARC_G.moneda, 18);
  m.style.left = (x - 9) + "px"; m.style.top = (y - 4) + "px";
  const t = document.createElement("span");
  t.className = "arc-mas";
  t.textContent = "+2";
  t.style.left = (x + 12) + "px"; t.style.top = (y - 6) + "px";
  document.body.append(m, t);
  setTimeout(() => { m.remove(); t.remove(); }, 700);
}

/* ---------- El Pomodoro ----------
   Los filtros que redibujan en bloques: toman el dibujo cada N píxeles y
   rellenan el bloque. Van en el documento para que `css/arcade.css` los llame
   por su id.

   `rueda` cambia dónde empieza la rejilla, y sin eso los arcos desaparecían:
   dentro de un SVG la región del filtro se mide por defecto en la caja de
   CADA arco, así que la muestra caía fuera del dibujo. Con `userSpaceOnUse`
   se mide en el dibujo entero de la rueda (320 × 320). */
function arcFiltro(id, n, rueda) {
  const m = Math.floor(n / 2);
  const region = rueda ? 'filterUnits="userSpaceOnUse" x="0" y="0" width="320" height="320"' : 'x="0" y="0" width="100%" height="100%"';
  return '<filter id="' + id + '" ' + region + ' color-interpolation-filters="sRGB">' +
    '<feFlood x="' + m + '" y="' + m + '" width="1" height="1"/>' +
    '<feComposite width="' + n + '" height="' + n + '"/><feTile result="rejilla"/>' +
    '<feComposite in="SourceGraphic" in2="rejilla" operator="in"/>' +
    '<feMorphology operator="dilate" radius="' + m + '"/></filter>';
}
function arcPonerFiltros() {
  if (document.getElementById("arc-filtros")) return;
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.id = "arc-filtros";
  s.setAttribute("width", "0"); s.setAttribute("height", "0"); s.setAttribute("aria-hidden", "true");
  s.style.position = "absolute";
  s.innerHTML = arcFiltro("arc-px-3", 3) + arcFiltro("arc-px-4", 4) + arcFiltro("arc-px-rueda", 4, true);
  document.body.appendChild(s);
}
/* Los dos puntos de la hora, en su propia pieza para que parpadeen. El
   Pomodoro reescribe el texto cada segundo, así que se vuelven a envolver. */
let arcDosReloj = null;
function arcIniciarDosPuntos() {
  if (!arcDosReloj) arcDosReloj = setInterval(arcDosPuntos, 200);
}
function arcDosPuntos() {
  const t = document.getElementById("jor-tiempo");
  if (!t || !arcadePuesto() || t.querySelector(".arc-dos")) return;
  const txt = t.textContent, i = txt.lastIndexOf(":");
  if (i < 0) return;
  const d = document.createElement("span");
  d.className = "arc-dos";
  d.textContent = ":";
  t.textContent = "";
  t.append(txt.slice(0, i), d, txt.slice(i + 1));
}

/* ---------- Ponerlo y quitarlo ----------
   Detrás de la pantalla de carga y recargando, igual que cualquier apariencia
   (`cambiarTapado`): el árbol, los rangos y la rueda se dibujan una vez con
   lo que había al dibujarlos, y en caliente quedaría media app de píxel y
   media no. Dentro del ejemplo no se recarga, porque el ejemplo vive en
   memoria y se perdería. */
function arcadeAlternar(si) {
  if (si && !arcadeEncontrado()) return;
  const guardar = () => {
    try {
      if (si) localStorage.setItem(ARCADE_LLAVE, "arcade");
      else localStorage.removeItem(ARCADE_LLAVE);
    } catch (e) {}
    /* Un mundo ya trae su material: los dos a la vez no se leen. Queda tu
       ambiente, que es sobre lo que Arcade está hecho. */
    if (si && typeof esMundo === "function" && typeof apariencia === "function" && esMundo(apariencia())) {
      try { ponerApariencia("casa"); } catch (e) {}
    }
  };
  if (typeof modoEjemplo !== "undefined" && modoEjemplo) {
    guardar();
    arcadeEnCaliente(si);
    return;
  }
  if (typeof cargaMostrar === "function") cargaMostrar(si ? tx("Cargando Arcade…") : tx("Cambiando tema…"));
  setTimeout(() => { guardar(); location.reload(); }, 220);
}
function arcadeEnCaliente(si) {
  const raiz = document.documentElement;
  const poner = () => {
    raiz.classList.add("cambiando-modo");
    if (si) raiz.setAttribute("data-material", "arcade"); else raiz.removeAttribute("data-material");
    getComputedStyle(raiz).backgroundColor;
    setTimeout(() => raiz.classList.remove("cambiando-modo"), 0);
    if (si) { arcPonerFiltros(); arcIniciarDosPuntos(); }
    if (typeof showView === "function" && typeof activeMainView !== "undefined") showView(activeMainView);
    if (typeof renderPanelApariencia === "function") renderPanelApariencia();
  };
  if (!si || document.querySelector('link[href^="css/arcade.css"]')) { poner(); return; }
  /* La dirección con su huella sale del script de arriba de `index.html`,
     que es donde la estampa `mundos/arcade.py`: una sola fuente. */
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = arcadeDireccion();
  l.onload = poner;
  l.onerror = poner;
  document.head.appendChild(l);
}
function arcadeDireccion() {
  const s = [...document.querySelectorAll("script:not([src])")].map(x => x.textContent).join("");
  const m = s.match(/css\/arcade\.css\?h=[0-9a-f]+/);
  return m ? m[0] : "css/arcade.css";
}
function arcadeAlternarSonido() {
  state.settings = state.settings || {};
  state.settings.arcadeSonido = !arcadeConSonido();
  save();
  if (typeof renderPanelApariencia === "function") renderPanelApariencia();
  if (arcadeConSonido()) arcadeSonarSiempre("moneda");
}

/* La fila de Mi apariencia. Solo existe para quien lo encontró: a los demás
   la pantalla no les dice que haya nada más. */
function arcadeApariencia() {
  if (!arcadeEncontrado()) return "";
  const on = arcadePuesto(), son = arcadeConSonido();
  const conMundo = !on && typeof esMundo === "function" && esMundo(apariencia());
  return `
    <h3 class="amb-h2">${tx("Secreto")}</h3>
    <p class="settings-note">${tx("Arcade no sale en ningún menú: está aquí porque lo encontraste. Va encima de tu ambiente: cambia la letra, las esquinas, el movimiento y los sonidos, y los colores siguen siendo los tuyos.")}${conMundo ? " " + tx("Llevas un mundo puesto: al ponerte Arcade, vuelves a tu ambiente.") : ""}</p>
    <div class="arc-ap">
      <div class="arc-ap-m">
        <span class="arc-ap-ic">${arcDibujo(ARC_G.cruceta, 24)}</span>
        <span class="arc-ap-tx"><b>Arcade</b><span>${escapeHtml(on ? tx("Lo llevas puesto") : tx("La cuadrícula manda"))}</span></span>
        <button type="button" class="btn btn-sm ${on ? "btn-ghost" : "btn-soft"}" onclick="arcadeAlternar(${!on})">${escapeHtml(on ? tx("Quitar") : tx("Ponerlo"))}</button>
      </div>
      <button type="button" class="mod-row ${son ? "on" : ""}" onclick="arcadeAlternarSonido()">
        <span class="mod-tx"><b>${tx("Sonidos de 8 bits")}</b><span>${tx("Al cumplir una misión, al subir de nivel y al terminar un tramo del Pomodoro.")}</span></span>
        <span class="mod-sw"><i></i></span>
      </button>
    </div>`;
}

/* ---------- El código ---------- */
function arcTecla(k, pos, mando) {
  if (k === ARCADE_KONAMI[pos]) {
    pos++;
    if (mando) arcadeSonarSiempre("tic");
  } else {
    pos = k === ARCADE_KONAMI[0] ? 1 : 0;
    if (mando) {
      arcadeSonarSiempre("error");
      mando.classList.remove("mal"); void mando.offsetWidth; mando.classList.add("mal");
    }
  }
  if (mando) mando.querySelectorAll(".arc-puntos i").forEach((p, i) => p.classList.toggle("on", i < pos));
  if (pos === ARCADE_KONAMI.length) { arcadeCodigo(); return 0; }
  return pos;
}

/* En la PC, el teclado vale en cualquier momento. Nunca dentro de un campo:
   ahí la B y la A son letras de alguien que escribe. */
let arcTecleado = 0;
const ARC_TECLAS = { ArrowUp: "u", ArrowDown: "d", ArrowLeft: "l", ArrowRight: "r" };
document.addEventListener("keydown", e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const t = e.target;
  if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName || ""))) return;
  const letra = (e.key || "").toLowerCase();
  const k = ARC_TECLAS[e.key] || (letra === "b" || letra === "a" ? letra : null);
  if (!k) { arcTecleado = 0; return; }
  arcTecleado = arcTecla(k, arcTecleado, null);
});

/* Al acertar, en este orden y nunca a la vez —lo pidió Eduardo para que no
   se interrumpan entre sí—: primero el mensaje; al cerrarlo, la pantalla de
   carga; y después el mundo ya puesto. */
function arcadeCodigo() {
  const m = document.getElementById("arc-mando");
  if (m) m.remove();
  arcadeQuitarPixel();
  const ya = arcadeEncontrado(), puesto = arcadePuesto();
  if (!ya) {
    state.settings = state.settings || {};
    state.settings.secretos = [...(state.settings.secretos || []), "arcade"];
    /* Dentro del ejemplo, lo guardado se tira al salir: se apunta también en
       la copia de lo tuyo, que es la que vuelve. */
    if (typeof modoEjemplo !== "undefined" && modoEjemplo && typeof estadoAntesDelEjemplo !== "undefined" && estadoAntesDelEjemplo) {
      estadoAntesDelEjemplo.settings = estadoAntesDelEjemplo.settings || {};
      const s = estadoAntesDelEjemplo.settings.secretos || [];
      if (s.indexOf("arcade") < 0) estadoAntesDelEjemplo.settings.secretos = [...s, "arcade"];
    }
    save();
  }
  arcadeSonarSiempre("konami");
  const texto = !ya ? tx("Encontraste un mundo que no sale en ningún menú. Ya es tuyo.")
    : puesto ? tx("Ya es tuyo, y lo llevas puesto.")
    : tx("Ya era tuyo. Se vuelve a poner.");
  const v = document.createElement("div");
  v.id = "arc-abierto";
  v.className = "modal-backdrop";
  v.innerHTML =
    '<div class="luci-card rara" role="dialog" aria-label="' + escapeAttr(tx("Mundo Arcade")) + '">' +
      '<span class="arc-titulo">' + escapeHtml(tx("MUNDO ARCADE")) + "</span>" +
      '<span class="luci-tx">' + escapeHtml(texto) + "</span>" +
      '<p class="arc-pie">' + escapeHtml(tx("Se cambia cuando quieras en Ajustes → Mi apariencia.")) + "</p>" +
      '<button type="button" class="btn btn-primary btn-block">' + escapeHtml(tx("Seguir")) + "</button>" +
    "</div>";
  document.body.appendChild(v);
  void v.offsetWidth;
  v.classList.add("show");
  /* Solo con el botón: tocar fuera se hace sin querer, y es lo único que la
     app te iba a enseñar. Escape sí, que es una decisión. */
  const seguir = () => {
    document.removeEventListener("keydown", tecla);
    v.classList.remove("show");
    setTimeout(() => { v.remove(); if (!puesto) arcadeAlternar(true); }, 250);
  };
  const tecla = e => { if (e.key === "Escape") seguir(); };
  document.addEventListener("keydown", tecla);
  v.querySelector(".btn").addEventListener("click", seguir);
}

/* ---------- La luciérnaga rara y lo que deja ---------- */
const ARCADE_PISTA = () => tx("Arriba, arriba, abajo, abajo… lo demás lo sabe quien creció con un control en las manos.");

/* ¿Le toca esta noche? Una de cada quince, y solo a quien ya atrapó tres
   normales: así le llega a quien juega con ellas y no a quien pasa de largo.
   Y nunca a quien ya lo encontró: una pista hacia algo que ya tienes es ruido. */
function arcadeTocaRara() {
  if (arcadeEncontrado()) return false;
  if ((Number(state.settings && state.settings.luciernagas) || 0) < 3) return false;
  return Math.random() < 1 / 15;
}
function arcadeRaraAtrapada() {
  arcadeSonarSiempre("rara");
  if (typeof fraseDeLuciernaga === "function") fraseDeLuciernaga(ARCADE_PISTA(), "???", true);
  state.ui = state.ui || {};
  state.ui.arcPixel = todayKey();
  state.ui.arcPixelToque = null;   // una rara nueva trae un píxel nuevo, sin reloj
  if (typeof guardarLocal === "function") guardarLocal(state);
  arcadeQuizaPixel();
}

/* Cuánto dura el píxel, que lo decidió Eduardo (0.7.131.1): sin tocarlo se
   queda en la esquina el resto de esa noche, hasta las 4:00. Al TOCARLO por
   primera vez empiezan a correr 20 minutos y al cumplirse se va, aunque ya
   hayan dado las 4:00: quien lo abrió a las 3:55 no pierde la pista cinco
   minutos después. Así no se queda ahí para siempre, y tampoco se va en la
   cara de quien lo está intentando.

   Solo se ve en el Resumen. Se mira al pintar el Resumen y cada segundo, que
   es lo que lo quita al cambiar de pantalla o al cumplirse el plazo. */
const ARC_PIXEL_MIN = 20;
let arcPixelReloj = null;
function arcadePixelToca() {
  if (arcadeEncontrado() || !state.ui || state.ui.arcPixel !== todayKey()) return false;
  if (typeof activeMainView === "undefined" || activeMainView !== "summary") return false;
  const toque = Number(state.ui.arcPixelToque) || 0;
  if (toque) return Date.now() - toque < ARC_PIXEL_MIN * 60000;
  return new Date().getHours() < 4;
}
function arcadeQuizaPixel() {
  if (!arcadePixelToca()) { arcadeQuitarPixel(); return; }
  if (!document.getElementById("arc-pixel")) {
    const p = document.createElement("button");
    p.id = "arc-pixel";
    p.type = "button";
    p.setAttribute("aria-label", tx("Un píxel"));
    p.innerHTML = "<i></i>";
    p.addEventListener("click", () => {
      // El primer toque pone en marcha los 20 minutos; los siguientes, no.
      if (!state.ui.arcPixelToque) {
        state.ui.arcPixelToque = Date.now();
        if (typeof guardarLocal === "function") guardarLocal(state);
      }
      arcadeAbrirMando();
    });
    document.body.appendChild(p);
  }
  if (!arcPixelReloj) arcPixelReloj = setInterval(() => { if (!arcadePixelToca()) arcadeQuitarPixel(); }, 1000);
}
function arcadeQuitarPixel() {
  const p = document.getElementById("arc-pixel");
  if (p) p.remove();
  clearInterval(arcPixelReloj);
  arcPixelReloj = null;
}

/* El mando: en el teléfono no hay flechas, así que el código se teclea aquí. */
const ARC_FLECHAS = { u: "M12 6l7 10H5z", d: "M12 18L5 8h14z", l: "M6 12l10-7v14z", r: "M18 12L8 19V5z" };
function arcadeAbrirMando() {
  if (document.getElementById("arc-mando")) return;
  const nombre = { u: tx("Arriba"), d: tx("Abajo"), l: tx("Izquierda"), r: tx("Derecha") };
  const cruz = ["u", "l", "c", "r", "d"].map(k => k === "c" ? '<span class="c"></span>' :
    '<button type="button" class="' + k + '" data-k="' + k + '" aria-label="' + escapeAttr(nombre[k]) + '"><svg viewBox="0 0 24 24"><path d="' + ARC_FLECHAS[k] + '"/></svg></button>').join("");
  const v = document.createElement("div");
  v.id = "arc-mando";
  v.className = "modal-backdrop";
  v.innerHTML =
    '<div class="luci-card rara arc-mando" role="dialog" aria-label="' + escapeAttr(tx("Mando")) + '">' +
      '<button type="button" class="luci-x" aria-label="' + escapeAttr(tx("Cerrar")) + '">' + icon("close", 16) + "</button>" +
      '<p class="arc-pista">PLAYER 1</p>' +
      '<div class="arc-puntos">' + ARCADE_KONAMI.map(() => "<i></i>").join("") + "</div>" +
      '<div class="arc-fila"><div class="arc-cruz">' + cruz + "</div>" +
      '<div class="arc-ab"><button type="button" data-k="b">B</button><button type="button" data-k="a">A</button></div></div>' +
    "</div>";
  document.body.appendChild(v);
  void v.offsetWidth;
  v.classList.add("show");
  const mando = v.querySelector(".arc-mando");
  let pos = 0;
  const cerrar = () => { v.classList.remove("show"); setTimeout(() => v.remove(), 250); };
  v.querySelector(".luci-x").addEventListener("click", cerrar);
  v.addEventListener("click", e => { if (e.target === v) cerrar(); });
  /* `pointerdown` y no `click`: el código se teclea rápido, y un toque que
     se queda esperando a levantar el dedo se come la mitad. */
  v.querySelectorAll("[data-k]").forEach(b => b.addEventListener("pointerdown", e => {
    e.preventDefault();
    pos = arcTecla(b.dataset.k, pos, mando);
  }));
}

/* ---------- Al arrancar ---------- */
function arrancarArcade() {
  /* La llave es del dispositivo y el hallazgo de la cuenta: si entra una
     cuenta que no lo encontró, se quita sin decir nada. No hay nada que
     anunciarle sobre algo que no sabe que existe. */
  if (arcadePuesto() && !arcadeEncontrado()) {
    document.documentElement.removeAttribute("data-material");
    try { localStorage.removeItem(ARCADE_LLAVE); } catch (e) {}
    document.querySelectorAll('link[href^="css/arcade.css"]').forEach(l => l.remove());
    return;
  }
  if (!arcadePuesto()) return;
  arcPonerFiltros();
  arcIniciarDosPuntos();
}
arrancarArcade();
