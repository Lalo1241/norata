/* ================= El sonido de Norata (0.7.136) =================
   Diseñado con Eduardo en un boceto de doce vueltas
   (https://claude.ai/artifact/FFN8qAzr28YroBbgfboPFd). Las reglas que salieron
   de ahí, y que no se tocan sin volver a hablarlo:

   - **Suena lo que lograste, no lo que tocaste.** Los botones, navegar, crear
     y borrar callan. Cuanto más raro es el momento, más largo es su sonido.
   - **Nada suena a «fallaste»**: la racha rota, la habilidad que baja y
     desmarcar callan (Arcade conserva su nota al desmarcar, que es suya).
   - **Todo pasa por `puedeSonar` (js/01-base.js)**, una vez por sonido.
   - **El techo de los agudos** (ver abajo): lo que marea con auriculares es un
     agudo SOSTENIDO, y lo que da nitidez son los armónicos cortos. Hay que
     cuidar las dos cosas; la v2 del boceto cortó las dos y todo sonó apagado.
   - **Nada de ruido** salvo la cuerda pulsada, que lo suaviza tres veces: el
     ruido crudo es lo que sonó «pixeloso» y «como un bug».
   - **Un mundo cambia el material, no el momento**: Averno lo toca en órgano,
     coro y campana; Blueprint en marimba; Reliquia en coro y celesta; Arcade
     con sus 8 bits. Lo decide la apariencia puesta y nada más: hay UN solo
     interruptor para toda la app.
   - **Los recaps del aniversario no se tocan.** Tienen sus voces aparte
     (`RECAP_VOCES`) y no heredan de los mundos: la v6 cambió los instrumentos
     de un mundo y, de rebote, arruinó su recap.
   - **Sintetizado, pesa cero**: nada de archivos de audio, nada en ASSETS.

   Encendido de entrada, a volumen moderado. El interruptor va en la cuenta
   (`settings.sonido`); el volumen, en cada dispositivo (localStorage), porque
   los auriculares del teléfono no son las bocinas de la PC.

   Todo va dentro de una función para que sus nombres cortos (G, S, nota…) no
   choquen con los del resto de la app: aquí fuera solo sale lo de `window.`. */
(function () {
"use strict";

let AC = null, master = null, masterReal = null;
const salas = {};
const VOL_CLAVE = "norata-volumen";
// La curva no es recta porque el oído no lo es: con una recta, de 50 a 100 casi no se nota nada.
const ganancia = v => .9 * Math.pow(Math.max(0, Math.min(100, v)) / 100, 1.5);
function volumen() {
  try { const v = localStorage.getItem(VOL_CLAVE); if (v !== null && v !== "" && !isNaN(+v)) return Math.max(0, Math.min(100, Math.round(+v))); } catch (e) { /* sin almacén */ }
  return 50;
}
function encendido() { return !(typeof state !== "undefined" && state && state.settings && state.settings.sonido === false); }

function audio() {
  if (AC) return AC;
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
  /* iPhone: «ambiente» respeta el interruptor de silencio del teléfono y no
     corta la música que ya esté sonando. Donde no existe, no pasa nada. */
  try { if (navigator.audioSession) navigator.audioSession.type = "ambient"; } catch (e) { /* no hay */ }
  /* La salida. Lo «pixeloso» de la v3 del boceto era SATURACIÓN: muchas notas
     sumadas pasaban de 1 y el navegador las recortaba. Hay margen por nota y
     un tope al final. El tope suelta despacio: con 80 ms seguía el bombo de
     45 Hz ciclo a ciclo y lo deformaba. */
  const hp = AC.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 40;
  const turbio = AC.createBiquadFilter(); turbio.type = "peaking"; turbio.frequency.value = 280; turbio.Q.value = .9; turbio.gain.value = -2.5;
  const presencia = AC.createBiquadFilter(); presencia.type = "peaking"; presencia.frequency.value = 3000; presencia.Q.value = .8; presencia.gain.value = 2.5;
  const est = AC.createBiquadFilter(); est.type = "highshelf"; est.frequency.value = 7500; est.gain.value = -4;
  const comp = AC.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 2.5; comp.attack.value = .01; comp.release.value = .2;
  const tope = AC.createDynamicsCompressor(); tope.threshold.value = -4; tope.knee.value = 0; tope.ratio.value = 20; tope.attack.value = .003; tope.release.value = .25;
  master = AC.createGain(); master.gain.value = ganancia(volumen());
  master.connect(hp).connect(turbio).connect(presencia).connect(est).connect(comp).connect(tope).connect(AC.destination);
  masterReal = master;
  return AC;
}
/* El navegador solo deja sonar después de un toque. Se despierta en cada uno
   (y no solo en el primero) porque el final de un tramo del Pomodoro suena sin
   que nadie toque nada, y para entonces el audio puede haberse dormido. */
function despertar() {
  if (!encendido()) return;
  const c = audio();
  if (c && c.state === "suspended") { try { c.resume(); } catch (e) { /* nada */ } }
}
document.addEventListener("pointerdown", despertar, true);
document.addEventListener("keydown", despertar, true);

/* ---- El techo de los agudos ----
   Lo que marea con auriculares es un tono agudo SOSTENIDO: la primera
   luciérnaga de Reliquia era un seno de 8 kHz con cola. Lo que da nitidez es
   otra cosa: armónicos altos, bajitos y que se apagan en décimas de segundo,
   como el golpe de un mazo. La versión 2 cortaba las dos cosas y todo sonó
   apagado. Así que el techo mira DOS cosas:
     - ninguna nota (la fundamental) pasa de TECHO;
     - un armónico por encima de ARM_LARGO solo entra si es bajito y corto
       (el brillo del ataque), y nada pasa de ARM_MAX.
   La salida ya no filtra: solo un estante suave arriba de 7 kHz. */
const TECHO = 1100, ARM_LARGO = 2500, ARM_MAX = 6000;
function lim(f, t) { t = t || TECHO; while (f > t) f /= 2; return f; }

/* Mientras se escribe el recap, cada nota queda apuntada. Bajar el volumen de
   su salida no bastaba: las notas mandan su eco a la sala por otro camino, y
   al «pausar» se seguían oyendo por el eco, bajito. Ahora se para cada una. */
let captura = null;
function atrapa(o, g) { if (captura) captura.push([o, g]); }

function sala(seg, caida) {
  const k = seg + "/" + caida;
  if (salas[k]) return salas[k];
  const n = Math.floor(AC.sampleRate * seg), b = AC.createBuffer(2, n, AC.sampleRate);
  /* La sala se hace con ruido, y ruido crudo deja GRANO en la cola. Se suaviza
     (media móvil de un polo) y entra en 12 ms en vez de golpe. */
  const entra = Math.floor(AC.sampleRate * .012);
  for (let ch = 0; ch < 2; ch++) {
    const x = b.getChannelData(ch); let y = 0;
    for (let i = 0; i < n; i++) { y = y * .55 + (Math.random() * 2 - 1) * .45; x[i] = y * Math.pow(1 - i / n, caida) * Math.min(1, i / entra); }
  }
  const cv = AC.createConvolver(); cv.buffer = b;
  const lp = AC.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 5000;
  const g = AC.createGain(); g.gain.value = .4;
  cv.connect(lp).connect(g).connect(masterReal);
  return (salas[k] = cv);
}

/* Cada mundo toca en su propio modo, siempre sobre do. */
const ESCALAS = {
  penta:      [0, 2, 4, 7, 9],     // la casa: pentatónica mayor
  suspendida: [0, 2, 5, 7, 10],    // Blueprint: cuartas y quintas, abierta, de estructura
  /* Averno: menor armónica, la escala del órgano de catedral (Bach, el
     réquiem). La v1-v7 usaba [0,1,5,7,8], que es la escala «In» japonesa:
     por eso nunca sonó a infierno cristiano, y encima sonaba a Oriente. */
  averno:     [0, 2, 3, 5, 7, 8, 11],
  lidia:      [0, 2, 4, 6, 9]      // Reliquia: la cuarta aumentada, lo que flota
};
function G(m, i) { const e = ESCALAS[m.escala], n = e.length, o = Math.floor(i / n), g = ((i % n) + n) % n; return m.base * Math.pow(2, (12 * o + e[g]) / 12); }
function S(m, s) { return m.base * Math.pow(2, s / 12); }

/* Una voz: sus parciales [razón, onda, volumen, caída, desafine], un filtro o
   unos formantes (las vocales de un coro), vibrato, trémolo y su sala. */
/* ---- La cuerda pulsada (Karplus-Strong) ----
   Una línea de retardo del largo de un periodo que se alimenta a sí misma
   promediando dos muestras: eso es lo que hace una cuerda al perder sus
   agudos antes que sus graves. La excitación es ruido, pero suavizado tres
   veces (una yema, no una uña), así que el ataque no raspa. Se calcula una
   vez por nota y se guarda; la afinación fina la corrige la velocidad de
   reproducción, porque el periodo tiene que ser un número entero. */
const CUERDAS = {};
function cuerdaBuffer(f, amort) {
  const sr = AC.sampleRate, P = Math.max(8, Math.round(sr / f)), k = P + "/" + amort;
  if (CUERDAS[k]) return CUERDAS[k];
  const n = Math.floor(sr * 3), b = AC.createBuffer(1, n, sr), x = b.getChannelData(0);
  for (let i = 0; i < P; i++) x[i] = Math.random() * 2 - 1;
  for (let pasada = 0; pasada < 3; pasada++) for (let i = 1; i < P; i++) x[i] = (x[i] + x[i - 1]) * .5;
  let media = 0, pico = 0;
  for (let i = 0; i < P; i++) media += x[i] / P;
  for (let i = 0; i < P; i++) { x[i] -= media; pico = Math.max(pico, Math.abs(x[i])); }
  for (let i = 0; i < P; i++) x[i] /= (pico || 1);
  x[P] = amort * x[0];
  for (let i = P + 1; i < n; i++) x[i] = amort * .5 * (x[i - P] + x[i - P - 1]);
  return (CUERDAS[k] = { b, P });
}

function nota(m, f, t, d, v, op) {
  op = op || {};
  const c = AC, t0 = c.currentTime + .02 + t, dd = d * (m.dur || 1), at = op.ataque || m.ataque;
  f = lim(f);
  const fin = c.createGain(); fin.connect(master);
  if (m.envio) { const s = c.createGain(); s.gain.value = m.envio; fin.connect(s); s.connect(sala(m.sala[0], m.sala[1])); }
  let entrada;
  if (m.formantes) {
    entrada = c.createGain();
    m.formantes.forEach(([ff, q, gv]) => {
      const b = c.createBiquadFilter(), g = c.createGain();
      b.type = "bandpass"; b.frequency.value = ff; b.Q.value = q; g.gain.value = gv;
      entrada.connect(b).connect(g).connect(fin);
    });
  } else {
    const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = m.filtro; lp.Q.value = m.q || .7;
    const bar = op.barrido || m.barrido;
    if (bar) { lp.frequency.setValueAtTime(bar[0], t0); lp.frequency.exponentialRampToValueAtTime(bar[1], t0 + bar[2]); }
    lp.connect(fin); entrada = lp;
  }
  let dest = entrada;
  if (m.cuerda) {
    const { b, P } = cuerdaBuffer(f, m.amort);
    const src = c.createBufferSource(), g = c.createGain(), pico = v * .7 * (op.vol || 1);
    src.buffer = b; src.playbackRate.value = f * (P + .5) / c.sampleRate;
    g.gain.setValueAtTime(pico, t0);
    g.gain.setValueAtTime(pico, t0 + dd * .7);
    g.gain.exponentialRampToValueAtTime(.0001, t0 + dd);
    src.connect(g).connect(dest); src.start(t0); src.stop(t0 + dd + .05); atrapa(src, g);
    return;
  }
  if (m.tremolo) {
    const tg = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    tg.gain.value = 1 - m.tremolo[1] / 2; lfo.frequency.value = m.tremolo[0]; lg.gain.value = m.tremolo[1] / 2;
    lfo.connect(lg).connect(tg.gain); lfo.start(t0); lfo.stop(t0 + dd * 2 + .2);
    tg.connect(entrada); dest = tg;
  }
  m.partes.forEach(([r, tipo, vol, dec, det]) => {
    const fr = f * r;
    if (fr > ARM_MAX || (fr > ARM_LARGO && (vol > .1 || dec > .2))) return;
    const o = c.createOscillator(), g = c.createGain(), end = t0 + Math.max(dd * dec, at + .06);
    o.type = tipo; o.frequency.value = fr; if (det) o.detune.value = det;
    if (m.vibrato) {
      const l = c.createOscillator(), lg = c.createGain();
      l.frequency.value = m.vibrato[0]; lg.gain.value = m.vibrato[1];
      l.connect(lg).connect(o.detune); l.start(t0); l.stop(end + .1);
    }
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(v * vol * .38, t0 + at);
    if (m.sostiene) g.gain.setValueAtTime(v * vol * .38, Math.max(t0 + at + .01, end - (m.suelta || .3)));
    g.gain.exponentialRampToValueAtTime(.0001, end);
    o.connect(g).connect(dest); o.start(t0); o.stop(end + .05); atrapa(o, g);
  });
}
/* Percusión afinada, sin ruido: un seno que cae. Bombo, tambor ritual o el
   golpe seco de una regla sobre la mesa, según de dónde a dónde caiga. */
function golpe(t, de, a, d, v) {
  const c = AC, t0 = c.currentTime + .02 + t, o = c.createOscillator(), g = c.createGain();
  o.type = "sine"; o.frequency.setValueAtTime(de, t0); o.frequency.exponentialRampToValueAtTime(a, t0 + d);
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v, t0 + .004); g.gain.exponentialRampToValueAtTime(.0001, t0 + d + .05);
  o.connect(g).connect(master); o.start(t0); o.stop(t0 + d + .1); atrapa(o, g);
}
const bombo = (t, v) => golpe(t, 120, 45, .2, v || .55);
const tambor = (t, v) => golpe(t, 110, 45, .4, (v || .75) * .7);
function retumbo(t, d, v) {
  const c = AC, t0 = c.currentTime + .02 + t;
  [41, 43.6, 46.2].forEach(f => {
    const o = c.createOscillator(), g = c.createGain();
    o.type = "sine"; o.frequency.value = f;
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v / 3, t0 + d * .4); g.gain.exponentialRampToValueAtTime(.0001, t0 + d);
    o.connect(g).connect(master); o.start(t0); o.stop(t0 + d + .05); atrapa(o, g);
  });
}
const madera = (t, f, v) => golpe(t, f || 620, (f || 620) * .8, .05, v || .22);

/* ---------- Los materiales ----------
   Desde la v6 se acercan a instrumentos de verdad (salvo Arcade, que es de
   8 bits a propósito). Dos técnicas, las dos sin archivos:
     - cuerda pulsada (Karplus-Strong): arpa, koto, pizzicato. Una cuerda se
       calcula en el momento y se guarda por nota;
     - modos de un cuerpo que vibra: campanas, marimba y celesta, cada una con
       sus parciales medidos y con la caída de cada uno. */
const MATERIAL = {
  casa: { nombre:"Norata Clásico", base:261.63, escala:"penta",
    voz:   { partes:[[1,"sine",1,1],[2,"triangle",.14,.5],[3,"sine",.07,.2],[5,"sine",.035,.08]], ataque:.006, filtro:8000, envio:.13, sala:[1.8,3.5], dur:1.1 },
    brillo:{ partes:[[1,"sine",1,1],[2,"triangle",.16,.45],[3,"sine",.08,.15],[4,"sine",.05,.1],[6,"sine",.03,.06]], ataque:.003, filtro:9000, envio:.11, sala:[1.8,3.5], dur:1 },
    arpa:  { cuerda:true, amort:.996, filtro:5000, envio:.14, sala:[1.8,3.5], dur:1.4 },
    // La brasa: dos cuerdas tibias que se abren despacio, como leña que se aviva. Nada de chasquidos.
    brasa: { partes:[[1,"sawtooth",.45,1],[1,"sawtooth",.45,1,7],[.5,"sine",.6,1]], filtro:300, barrido:[260,2400,.9], ataque:.38, envio:.15, sala:[1.8,3.5], dur:1 },
    bajo:  { cuerda:true, amort:.99, filtro:1400, dur:1 } },

  averno: { nombre:"Averno", base:130.81, escala:"averno", tambor:true,
    /* Rehecho en la v9 para la visión de Eduardo: el infierno de Dante y de
       Diablo, o sea una CATEDRAL que se hunde, no un monstruo. Cinco
       instrumentos y todos de iglesia o de guerra:
         - órgano de tubos (registros de 16', 8', 4' y la quinta);
         - coro de hombres en vocal «o», grave y lento, como un canto llano;
         - campana de bronce que dobla, con sus parciales de verdad;
         - metales graves (trombones) que se abren al soplar;
         - tambor de guerra y un retumbo hecho con tres senos muy graves que
           baten entre sí (sin ruido: el ruido es lo que sonó a grano).
       Menor armónica, el acorde napolitano (re bemol) para el vértigo y el
       tritono solo en lo grande. Graves medidos: nada por debajo de 65 Hz
       salvo el retumbo, que va bajito. */
    /* v10: sonaba «parecido a Arcade» porque el coro, los trombones y la voz
       lejana eran ondas de sierra: zumban, y un zumbido filtrado es justo el
       timbre de 8 bits. Ahora todo se arma con senos (armónico por armónico),
       que suenan a cuerpo y no a chip, y la catedral tiene menos eco. */
    voz:     { partes:[[.5,"sine",.3,1],[1,"sine",1,1],[2,"sine",.5,1],[3,"sine",.16,1],[4,"sine",.18,1],[1,"sine",.25,1,6]], ataque:.07, sostiene:true, suelta:.35, filtro:3800, envio:.3, sala:[4,1.8], dur:1 },
    coro:    { partes:[[1,"sine",.5,1,-10],[1,"sine",.5,1,10],[2,"sine",.45,1],[3,"sine",.4,1],[4,"sine",.3,1],[5,"sine",.22,1],[6,"sine",.14,1],[8,"sine",.07,1]], formantes:[[400,4,1],[750,5,.6],[2400,7,.08]], vibrato:[4.8,14], ataque:.35, sostiene:true, suelta:.5, envio:.35, sala:[4,1.8], dur:1 },
    brillo:  { partes:[[.5,"sine",.5,1],[1,"sine",1,.8],[1.183,"sine",.55,.6],[1.506,"sine",.35,.45],[2,"sine",.45,.35],[2.514,"sine",.14,.2],[3.011,"sine",.09,.15],[4.166,"sine",.05,.08]], ataque:.002, filtro:6000, envio:.33, sala:[4,1.8], dur:2.2 },
    metal:   { partes:[[1,"sine",.7,1,-4],[1,"sine",.7,1,4],[2,"sine",.55,1],[3,"sine",.45,1],[4,"sine",.32,1],[5,"sine",.22,1],[6,"sine",.14,1]], filtro:450, barrido:[450,3000,.2], q:.8, ataque:.05, sostiene:true, suelta:.25, envio:.25, sala:[4,1.8], dur:1 },
    luz:     { partes:[[1,"sine",.45,1,-10],[1,"sine",.45,1,10],[2,"sine",.3,1],[3,"sine",.18,1]], formantes:[[330,4,1],[680,5,.35]], vibrato:[4.5,10], ataque:.5, sostiene:true, suelta:.8, envio:.45, sala:[4,1.8], dur:1 } },

  plano: { nombre:"Blueprint", base:261.63, escala:"suspendida", regla:true,
    // Pads suaves, sin trémolo (la v4 se emborronaba por él).
    voz:   { partes:[[1,"sine",1,1],[4,"sine",.08,.1]], ataque:.004, filtro:6000, envio:.05, sala:[.6,5], dur:1.1 },
    // Marimba de palo de rosa: fundamental, el parcial 3,93 que le da la madera y un 9,2 apenas al golpe.
    brillo:{ partes:[[1,"sine",1,.65],[3.93,"sine",.16,.12],[9.2,"sine",.04,.03]], ataque:.003, filtro:6500, envio:.06, sala:[.6,5], dur:.9 },
    bajo:  { cuerda:true, amort:.982, filtro:1200, dur:.8 } },

  reliquia: { nombre:"Reliquia", base:261.63, escala:"lidia",
    // Coro celestial, vocal «a», con vibrato y una sala enorme.
    voz:   { partes:[[1,"sawtooth",.34,1,-9],[1,"sawtooth",.34,1,9],[1,"sawtooth",.3,1],[2,"sine",.3,1.1]], formantes:[[700,5,1],[1150,6,.5],[2800,8,.14]], vibrato:[5,9], ataque:.15, envio:.36, sala:[4,2.8], dur:1.7 },
    // Celesta: macillos sobre láminas de metal dentro de una caja de madera. Suave, sin púa.
    brillo:{ partes:[[1,"sine",1,1],[2,"sine",.12,.35],[3,"sine",.07,.2],[4.1,"sine",.04,.08]], ataque:.005, filtro:7000, envio:.32, sala:[4,2.8], dur:1.5 },
    // Arpa de concierto, con sala grande.
    arpa:  { cuerda:true, amort:.997, filtro:4500, envio:.3, sala:[4,2.8], dur:1.8 },
    bajo:  { cuerda:true, amort:.992, filtro:1000, dur:1.2 } },

};
const V = m => m.voz, B = m => m.brillo || m.voz, A = m => m.arpa || B(m);

/* ---------- Arcade: los de hoy, una octava abajo ---------- */
function arcNota(f, t, d, o) {
  o = o || {}; f = lim(f / 2, 1100);
  const c = AC, os = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter(), t0 = c.currentTime + .01 + t, v = (o.vol || .05) * 2;
  os.type = o.tipo || "square"; os.frequency.setValueAtTime(f, t0);
  if (o.a) os.frequency.exponentialRampToValueAtTime(o.a / 2, t0 + d);
  lp.type = "lowpass"; lp.frequency.value = 7000;
  g.gain.setValueAtTime(v, t0); g.gain.setValueAtTime(v, t0 + d * .55); g.gain.exponentialRampToValueAtTime(.0008, t0 + d);
  os.connect(lp).connect(g).connect(master); os.start(t0); os.stop(t0 + d + .03); atrapa(os, g);
}
const F = { C3:130.81,F3:174.61,G3:196,A3:220,C4:261.63,E4:329.63,G4:392,A4:440,C5:523.25,D5:587.33,E5:659.25,G5:783.99,A5:880,C6:1046.5,D6:1174.66,E6:1318.51,G6:1567.98,A6:1760,B6:1975.53,C7:2093 };
const ARC = {
  moneda:()=>{arcNota(F.C6,0,.07);arcNota(F.G6,.07,.26);},
  paso:()=>arcNota(F.E6,0,.06,{vol:.035}),
  desmarcar:()=>arcNota(F.G5,0,.14,{a:F.G4,vol:.035}),
  fiesta:()=>{[F.C5,F.E5,F.G5,F.C6,F.E6,F.G6].forEach((n,i)=>arcNota(n,i*.05,.07,{vol:.04}));arcNota(F.C7,.3,.22,{vol:.04});},
  racha:()=>{arcNota(F.E6,0,.06,{vol:.04});arcNota(F.B6,.07,.16,{vol:.04});},
  rango:()=>{[[F.C5,0,.09],[F.E5,.09,.09],[F.G5,.18,.09],[F.C6,.27,.18],[F.A5,.5,.09],[F.C6,.59,.5]].forEach(([n,t,d])=>arcNota(n,t,d,{vol:.045}));[[F.C3*2,0,.27],[F.F3*2,.27,.23],[F.G3*2,.5,.6]].forEach(([n,t,d])=>arcNota(n,t,d,{tipo:"triangle",vol:.12}));},
  fase:()=>{[[F.G5,0,.08],[F.C6,.08,.08],[F.E6,.16,.08],[F.G6,.24,.12],[F.E6,.38,.08],[F.C7,.46,.4]].forEach(([n,t,d])=>arcNota(n,t,d,{vol:.045}));[[F.C3*2,0,.36],[F.G3*2,.38,.5]].forEach(([n,t,d])=>arcNota(n,t,d,{tipo:"triangle",vol:.12}));},
  konami:()=>{[F.C5,F.D5,F.E5,F.G5,F.A5,F.C6,F.D6,F.E6,F.G6,F.A6].forEach((n,i)=>arcNota(n,i*.045,.06,{vol:.035}));[F.C6,F.E6,F.G6].forEach(n=>arcNota(n,.48,.55,{vol:.03}));arcNota(F.C4*2,.48,.55,{tipo:"triangle",vol:.12});},
  // La rara iba a do7-sol7 (hasta 3 kHz). Ahora sol5-do6-mi6 antes de bajar la octava.
  rara:()=>[F.G5,F.C6,F.E6].forEach((n,i)=>arcNota(n,i*.06,i===2?.18:.07,{tipo:"triangle",vol:.06})),
  tic:()=>arcNota(1200,0,.04,{vol:.025}),
  cuenta:()=>arcNota(F.A5,0,.09,{vol:.045}),
  ya:()=>{arcNota(F.A6,0,.32,{vol:.045});arcNota(F.A5,0,.32,{tipo:"triangle",vol:.1});},
  // El código mal tecleado: una nota grave y corta. El de antes llevaba ruido, y el ruido suena a grano.
  error:()=>arcNota(F.G4,0,.1,{vol:.04})
};


/* ---------- Los momentos: una melodía, cualquier material ---------- */
const dflt = {
  mision:     (m,k) => { const g = Math.min(k,7)+2; nota(B(m),G(m,g),0,.45,.5); if (k >= 7) nota(B(m),G(m,g-3),.06,.5,.2); },
  paso:       (m,k) => nota(B(m),G(m,Math.min(k,7)+2),0,.25,.24),
  cuenta:     m => nota(B(m),G(m,6),0,.18,.35),
  ya:         m => { nota(B(m),G(m,8),0,.5,.4); nota(B(m),G(m,3),0,.5,.2); },
  fase:       m => { [[4,0],[6,.18],[8,.36]].forEach(([g,t]) => nota(B(m),G(m,g),t,.95,.38)); },
  habilidad:  m => {
    if (m.regla) madera(0,520,.1);
    [[2,0,.5],[4,.08,.5],[5,.16,.5],[7,.24,1]].forEach(([g,t,d]) => nota(B(m),G(m,g),t,d,.38));
    nota(V(m),G(m,0),.24,1.2,.26);
    if (m.tambor) { tambor(0,.6); tambor(.24,.7); }
  },
  hito:       m => {
    if (m.regla) { madera(0,520,.1); madera(.1,600,.08); }
    nota(B(m),G(m,5),0,.6,.4); nota(B(m),G(m,7),.13,1.2,.44); nota(V(m),G(m,0),.13,1.4,.26);
    if (m.tambor) tambor(.13,.7);
    if (m.coro) nota(m.coro,S(m,12),.13,1.6,.22);
  },
  racha:      m => { nota(V(m),G(m,0),0,1.4,.3,{ataque:.35}); nota(V(m),G(m,2),.15,1.3,.26,{ataque:.3}); nota(B(m),G(m,7),.55,1,.3); },
  luciernaga: m => { [[7,0,1.0,.15],[8,.2,1.0,.13],[9,.42,1.6,.13]].forEach(([g,t,d,v]) => nota(B(m),G(m,g),t,d,v,{ataque:.05})); },
  expedicion: m => {
    [0,2,4].forEach(g => nota(V(m),G(m,g),0,2.6,.2,{ataque:.45}));
    if (m.regla) [0,.12,.24,.36].forEach((t,i) => madera(t,i === 3 ? 640 : 520,.09));
    // Sin cuerda pulsada aquí: arpa + escala de cinco notas subiendo sonaba a guzheng (Eduardo, v7).
    for (let i = 0; i <= 9; i++) nota(B(m),G(m,i),.45+i*.085,.55,.24);
    nota(B(m),G(m,9),1.35,1.8,.36); nota(V(m),G(m,4),1.35,1.8,.22);
    bombo(1.35,.4);
    if (m.tambor) { tambor(0,.7); tambor(.45,.6); tambor(1.35,.9); }
    if (m.coro) { nota(m.coro,S(m,0),.3,2.6,.22); nota(m.coro,S(m,6),.3,2.6,.16); nota(m.coro,S(m,12),1.35,2.2,.2); }
  },
  abre:       m => { madera(0,420,.3); madera(.07,300,.28); nota(B(m),G(m,7),.14,1.5,.4); nota(V(m),G(m,2),.14,1.6,.24); nota(B(m),G(m,9),.38,1.3,.2); if (m.tambor) tambor(.14,.7); },
  // La bienvenida: suave, corta y hacia arriba. Es lo primero que alguien oye de Norata.
  bienvenida: m => { [0,2,4].forEach((g,i) => nota(B(m),G(m,g+2),i*.12,.9,.26)); nota(B(m),G(m,9),.4,1.4,.24); nota(V(m),G(m,0),.36,1.6,.14); },
  grieta:     m => madera(0,500+Math.random()*200,.24),
  rotura:     m => {
    golpe(0,140,50,.25,.5);
    for (let i = 0; i < 8; i++) nota(B(m),G(m,5+Math.floor(Math.random()*5)),.05+i*.07+Math.random()*.03,.45,.13);
    nota(V(m),G(m,0),.15,1.6,.3); nota(V(m),G(m,4),.15,1.6,.2);
    if (m.tambor) tambor(0,.9);
  }
};
/* Lo que un mundo cambia de más, y solo en momentos contados. */
const PROPIO = {
  casa: {
    racha: m => { nota(m.brasa,G(m,0),0,1.6,.34); nota(m.brasa,G(m,2),.12,1.5,.28); nota(B(m),G(m,7),.7,1.1,.3); nota(B(m),G(m,5),.7,1.1,.18); }
  },
  averno: {
    // Diario: una campana pequeña que sube por la escala. Corta, porque se oye muchas veces.
    mision:     (m,k) => { const g = Math.min(k,7) + 7; nota(m.brillo,G(m,g),0,.5,.42); if (k >= 7) nota(m.voz,G(m,g-7),0,.6,.14); },
    paso:       (m,k) => nota(m.brillo,G(m,Math.min(k,7)+7),0,.3,.22),
    cuenta:     m => nota(m.brillo,G(m,11),0,.4,.32),
    ya:         m => { nota(m.brillo,G(m,14),0,1,.38); nota(m.voz,G(m,7),0,.6,.18); },
    // El final de fase: la campana dobla tres veces, la misma nota, como en un campanario.
    fase:       m => { [0,.55,1.1].forEach(t => nota(m.brillo,G(m,9),t,1.2,.34)); nota(m.voz,G(m,7),0,1.6,.12); },
    // Una habilidad: los trombones suben el acorde menor y el órgano lo sostiene.
    habilidad:  m => {
      [[7,0,.22],[9,.14,.22],[11,.28,.22],[14,.42,.6]].forEach(([g,t,d]) => nota(m.metal,G(m,g),t,d,.3));
      [7,9,11].forEach(g => nota(m.voz,G(m,g),.42,1,.12)); tambor(0,.55); tambor(.42,.7);
    },
    // Un hito: del napolitano (re bemol) a do menor, con la campana encima. Es la cadencia más dramática que existe.
    hito:       m => {
      [1,5,8].forEach(s => nota(m.voz,S(m,s+12),0,.5,.12)); [0,3,7].forEach(s => nota(m.voz,S(m,s+12),.5,1.3,.13));
      nota(m.coro,S(m,12),.5,1.3,.16); nota(m.brillo,G(m,14),.5,1.8,.34); tambor(.5,.7);
    },
    // La racha: el coro y el órgano crecen desde nada (como algo que sube del fondo) y rompen en la campana.
    racha:      m => {
      nota(m.coro,S(m,12),0,1.1,.2,{ataque:.9}); nota(m.coro,S(m,13),0,1.1,.12,{ataque:.9});
      nota(m.voz,S(m,0),0,1.1,.12,{ataque:.9}); retumbo(0,1.2,.16);
      nota(m.voz,S(m,12),1.05,1.2,.14); nota(m.voz,S(m,15),1.05,1.2,.12); nota(m.brillo,G(m,14),1.05,1.8,.36); tambor(1.05,.8);
    },
    // La luciérnaga: un coro lejano en «u», casi un susurro, y una campanita. Es de madrugada.
    luciernaga: m => { nota(m.luz,S(m,15),0,2.2,.12); nota(m.luz,S(m,19),.3,2,.08); nota(m.brillo,G(m,16),.5,1.6,.12); },
    // El nivel de expedición: tambores de guerra, i – napolitano – V – i en el órgano, trombones y coro, y la campana grande al final.
    expedicion: m => {
      retumbo(0,2.8,.16); tambor(0,.7); tambor(.3,.5);
      const ac = [[0,3,7],[1,5,8],[-1,2,7],[0,3,7]];
      ac.forEach((a,i) => { const t = .3 + i*.45, d = i === 3 ? 2.2 : .5;
        a.forEach(s => nota(m.voz,S(m,s+12),t,d,.11));
        nota(m.metal,S(m,a[a.length-1]+12),t,d,.22); tambor(t,.55 + i*.08); });
      nota(m.coro,S(m,12),.3,3,.18); nota(m.coro,S(m,19),.3,3,.12);
      nota(m.brillo,G(m,7),1.65,2.4,.42); nota(m.brillo,G(m,14),1.65,2.4,.24);
    },
    // Se abre un módulo: un portón pesado (golpe grave y clac) y el órgano sube un acorde mayor: lo que se abre es luz.
    abre:       m => {
      tambor(0,.8); madera(.08,260,.26); madera(.16,200,.2);
      [0,4,7,12].forEach((s,i) => nota(m.voz,S(m,s+12),.3+i*.08,1.6-i*.08,.12));
      nota(m.coro,S(m,12),.3,1.6,.16); nota(m.brillo,G(m,14),.6,1.8,.3);
    },
    grieta:     m => { madera(0,300+Math.random()*80,.26); nota(m.brillo,G(m,12+Math.floor(Math.random()*3)),0,.3,.1); },
    rotura:     m => {
      tambor(0,.9); retumbo(0,1.4,.16);
      for (let i = 0; i < 6; i++) nota(m.brillo,G(m,9+Math.floor(Math.random()*6)),.05+i*.11,1.2,.16);
      [0,3,7].forEach(s => nota(m.voz,S(m,s+12),.2,1.6,.12)); nota(m.coro,S(m,12),.2,1.6,.16);
    }
  },
  reliquia: {
    racha: m => { nota(V(m),G(m,0),0,1.6,.26); nota(V(m),G(m,2),.1,1.6,.2); nota(B(m),G(m,7),.5,1.3,.26); nota(B(m),G(m,9),.7,1.4,.2); },
    luciernaga: m => { [[6,0,1.2,.13],[7,.25,1.2,.12],[8,.5,1.8,.12]].forEach(([g,t,d,v]) => nota(B(m),G(m,g),t,d,v,{ataque:.09})); nota(V(m),G(m,5),.1,2,.08); }
  }
};
const ARC_MOM = { mision:()=>ARC.moneda(), paso:()=>ARC.paso(), cuenta:()=>ARC.cuenta(), ya:()=>ARC.ya(), fase:()=>ARC.fase(),
  habilidad:()=>ARC.fiesta(), hito:()=>ARC.fiesta(), racha:()=>ARC.racha(), luciernaga:()=>ARC.rara(), expedicion:()=>ARC.rango(),
  abre:()=>ARC.konami(), bienvenida:()=>ARC.fase(), grieta:()=>ARC.tic(), rotura:()=>{ ARC.fiesta(); golpe(0,140,50,.2,.4); } };
const TIPO = { mision:{}, paso:{}, cuenta:{pomodoro:true}, ya:{pomodoro:true}, fase:{pomodoro:true},
  habilidad:{grande:true}, hito:{grande:true}, racha:{grande:true}, luciernaga:{grande:true}, expedicion:{grande:true},
  abre:{grande:true}, bienvenida:{grande:true}, grieta:{grande:true}, rotura:{grande:true} };
const MOMENTOS = {};
Object.keys(TIPO).forEach(k => MOMENTOS[k] = Object.assign({}, TIPO[k], {
  casa: (m, a) => { const p = PROPIO[mundoSonido()] && PROPIO[mundoSonido()][k]; (p || dflt[k])(m, a); },
  arcade: () => ARC_MOM[k]()
}));


/* ---------- El recap: UNA sola pieza, con ritmo ----------
   Un compás por lámina. Entra por capas para que se sienta que arranca:
   acorde y arpegio desde la primera, el bajo en la tercera, el bombo en la
   cuarta, y a partir de la séptima el bombo se dobla. Al final, el acorde
   mayor con todo junto. Las progresiones son de las más comunes que existen
   (I-V-vi-IV y parecidas): no son de nadie, igual que una escala. */
const MAY = { C:[0,4,7], G:[-5,-1,2], Am:[-3,0,4], F:[-7,-3,0] };
const RECAP = {
  casa:     { bpm:112, sub:8, arp:[0,1,2,3,2,1,2,3],
              acordes:[MAY.C,MAY.G,MAY.Am,MAY.F,MAY.C,MAY.G,MAY.F,MAY.G,MAY.Am,MAY.F], fin:[0,4,7,12] },
  plano:    { bpm:108, sub:8, arp:[0,2,1,3,0,2,1,3], regla:true,
              acordes:[[0,4,7,14],[-7,-3,0,4],[-3,0,4,7],[-5,-1,2,4],[0,4,7,14],[-7,-3,0,4],[-3,0,4,7],[-5,-1,2,4],[-7,-3,0,4],[-5,-1,2,5]], fin:[0,4,7,11,14] },
  averno:   { bpm:120, sub:8, arp:[0,1,2,1,0,2,1,2], coro:true,
              acordes:[[0,3,7],[-4,0,3],[3,7,10],[-2,2,5],[0,3,7],[-4,0,3],[-7,-4,0],[-5,-1,2],[-4,0,3],[-2,2,5]], fin:[0,4,7,12] },
  reliquia: { bpm:100, sub:8, arp:[0,1,2,3,2,3,1,2],
              acordes:[[0,4,7],[2,6,9],[4,7,11],[0,4,7],[2,6,9],[-1,2,6],[-3,0,4],[2,6,9],[-5,-1,2],[2,6,9]], fin:[0,4,7,11,18] },
  arcade:   { bpm:132, sub:16, arp:[0,1,2,3],
              acordes:[MAY.C,MAY.G,MAY.Am,MAY.F,MAY.C,MAY.G,MAY.F,MAY.G,MAY.Am,MAY.F], fin:[0,4,7,12] }
};
/* Las voces del recap, congeladas como estaban en la v5, que es la que
   aprobó Eduardo («los ritmos son hermosos»). La v6 le cambió los
   instrumentos a los mundos y, de rebote, el recap: arpa y koto en el
   arpegio, y lo arruinó. El recap ya no hereda los materiales: trae los
   suyos, y no se tocan aunque los mundos cambien. */
const RECAP_VOCES = {
  casa: {
    brillo:{ partes:[[1,"sine",1,1],[2,"triangle",.16,.45],[3,"sine",.08,.15],[4,"sine",.05,.1],[6,"sine",.03,.06]], ataque:.003, filtro:9000, envio:.11, sala:[1.8,3.5], dur:1 },
    bajo:  { partes:[[1,"triangle",1,1],[1,"sine",.5,1]], filtro:900, ataque:.01, dur:1 } },
  averno: {
    voz:   { partes:[[1,"sawtooth",.45,1,-10],[1,"sawtooth",.45,1,10],[.5,"sine",.9,1.1]], filtro:1400, q:2, tremolo:[5.5,.35], ataque:.04, envio:.28, sala:[3.5,2.2], dur:1.5 },
    brillo:{ partes:[[1,"sine",1,1.2],[2.76,"sine",.24,.5],[5.4,"sine",.06,.15],[.5,"sine",.45,1]], filtro:6000, ataque:.003, envio:.26, sala:[3.5,2.2], dur:1.3 },
    coro:  { partes:[[1,"sawtooth",.4,1,-7],[1,"sawtooth",.4,1,7],[.5,"sawtooth",.35,1]], formantes:[[420,5,1],[780,6,.45],[2500,8,.12]], vibrato:[4.2,12], ataque:.25, envio:.32, sala:[3.5,2.2], dur:2 },
    bajo:  { partes:[[1,"sawtooth",.6,1],[1,"sine",.8,1]], filtro:600, q:2, ataque:.008, dur:1 } },
  plano: {
    brillo:{ partes:[[1,"sine",1,1],[4,"sine",.09,.08],[2,"sine",.06,.25]], ataque:.004, filtro:6000, envio:.05, sala:[.6,5], dur:.85 },
    bajo:  { partes:[[1,"sine",1,1],[2,"triangle",.2,.4]], filtro:800, ataque:.01, dur:1 } },
  reliquia: {
    brillo:{ partes:[[1,"sine",1,1],[2,"sine",.2,.4],[3,"sine",.06,.18],[5,"sine",.03,.08]], vibrato:[5,5], ataque:.012, filtro:8000, envio:.32, sala:[4,2.8], dur:1.4 },
    bajo:  { partes:[[1,"sine",1,1],[2,"sine",.2,.5]], filtro:700, ataque:.02, dur:1.2 } }
};
// El tambor de Averno como estaba en la v5, solo para el recap.
const tamborRecap = (t, v) => golpe(t, 90, 32, .45, v || .75);

/* ---------- Qué material suena ----------
   Lo decide la apariencia puesta. Los ambientes (Tinta, Musgo…) son recolores
   de la casa y suenan como ella; solo los mundos con material propio cambian. */
function mundoSonido() {
  const a = typeof apariencia === "function" ? apariencia() : "casa";
  return MATERIAL[a] ? a : "casa";
}
function conArcade() { return typeof arcadePuesto === "function" && arcadePuesto(); }

/* ---------- La puerta de todo sonido ---------- */
function puedeYa() {
  if (!encendido()) return null;
  const c = audio();
  if (!c || typeof puedeSonar !== "function" || !puedeSonar(c)) return null;
  return c;
}
function sonar(k, arg) {
  const mo = MOMENTOS[k];
  if (!mo || !puedeYa()) return false;
  try {
    if (conArcade()) { if (ARC_MOM[k]) ARC_MOM[k](arg); }
    else mo.casa(MATERIAL[mundoSonido()], arg);
  } catch (e) { return false; }
  avisoPrimerSonido();
  return true;
}
/* El camino para encontrar Arcade (la rara, el mando, el código) suena con su
   voz de 8 bits aunque Arcade todavía no esté puesto: es el momento del
   hallazgo. Pasa por el mismo interruptor que todo lo demás. */
function sonarArcade(k) {
  if (!ARC[k] || !puedeYa()) return false;
  try { ARC[k](); } catch (e) { return false; }
  avisoPrimerSonido();
  return true;
}

/* ---------- La escalera del día ----------
   Cada misión cumplida hoy suena un peldaño más arriba; al día siguiente
   vuelve abajo. Se cuenta en memoria: al recargar vuelve al primer peldaño,
   y está bien, es un adorno y no un dato. */
let escalera = { dia: "", n: 0 };
function sonidoMision(cumplida, deshecha, avanzo) {
  const hoy = typeof todayKey === "function" ? todayKey() : "";
  if (escalera.dia !== hoy) escalera = { dia: hoy, n: 0 };
  if (deshecha) {
    if (escalera.n > 0) escalera.n--;
    // La casa calla al deshacer; Arcade tiene su nota, que ya existía.
    if (conArcade()) sonarArcade("desmarcar");
    return;
  }
  if (cumplida) { sonar("mision", escalera.n); escalera.n = Math.min(escalera.n + 1, 9); return; }
  if (avanzo) sonar("paso", escalera.n);
}

/* ---------- El recap del aniversario ----------
   Una pieza con ritmo que cuenta como UN sonido. Un compás detrás de otro, por
   capas: acorde y arpegio desde el primero, el bajo en el tercero, el bombo en
   el cuarto y doble desde el séptimo. Las láminas duran lo que duran (siete
   segundos cada una), así que la pieza se sigue tocando, ya con todo, hasta
   la última lámina; ahí remata en el siguiente compás. Se escribe unos
   compases por delante, y se apaga de golpe al cerrar o al salir de la vista:
   se para cada nota, no solo el volumen, porque el eco va por otro camino. */
let rec = null;
function recapCompas() {
  const r = rec.r, m = rec.m, arc = rec.arc, i = rec.i;
  const beat = 60 / r.bpm, bar = beat * 4, t = Math.max(0, rec.t - AC.currentTime);
  const base = arc ? 261.63 : m.base, s2f = s => base * Math.pow(2, s / 12);
  const tono = (voz, s, tt, d, v) => arc ? arcNota(s2f(s) * 2, tt, d, { tipo: voz === "bajo" ? "triangle" : "square", vol: v * .12 }) : nota(voz, s2f(s), tt, d, v);
  const pad = arc ? null : (m.coro || V(m)), arpa = arc ? "arpa" : B(m), bajo = arc ? "bajo" : m.bajo;
  const pulso = (tt, v) => arc ? golpe(tt, 150, 50, .12, v * .8) : m.tambor ? tamborRecap(tt, v) : bombo(tt, v * .8);
  const antes = master; master = rec.bus; captura = rec.notas;
  try {
    if (!rec.fin) {
      const ac = r.acordes[i % r.acordes.length], fuerte = i >= 6;
      if (pad) ac.forEach(s => nota(pad, s2f(s + (m.coro ? 12 : 0)), t, bar * 1.1, fuerte ? .11 : .08, { ataque: .2 }));
      for (let j = 0; j < r.sub; j++) {
        const idx = r.arp[j % r.arp.length], s = ac[idx % ac.length] + 12 * Math.floor(idx / ac.length) + 12;
        tono(arpa, s, t + j * bar / r.sub, (bar / r.sub) * (arc ? .8 : 1.2), (j % 4 === 0 ? .2 : .14) * (fuerte ? 1.15 : 1));
      }
      if (i >= 2) { const b = ac[0] - 12; tono(bajo, b, t, beat * 1.4, .34); tono(bajo, b, t + beat * 2, beat * .9, .3); tono(bajo, b + 7, t + beat * 3.5, beat * .45, .24); }
      if (i >= 3) { pulso(t, .55); pulso(t + beat * 2, .5); }
      if (i >= 6) { pulso(t + beat, .3); pulso(t + beat * 3, .3); }
      if (r.regla && i >= 1) [1, 3].forEach(q => madera(t + q * beat, 560, .05));
      if (i >= 6) [0, 1, 2, 3].forEach(q => tono(arpa, ac[(q + i) % ac.length] + 24 - (arc ? 12 : 0), t + q * beat, beat * .9, .1));
      rec.i++; rec.t += bar;
    } else {
      r.fin.forEach(s => arc ? arcNota(s2f(s) * 2, t, 1.6, { tipo: "triangle", vol: .07 }) : nota(pad || V(m), s2f(s + (m.coro ? 12 : 0)), t, 3, .16, { ataque: .05 }));
      // En Arcade el remate va una octava abajo y corto: subía hasta el do6 en onda cuadrada.
      for (let j = 0; j < 8; j++) tono(arpa, r.fin[j % r.fin.length] + 12 * ((arc ? 0 : 1) + Math.floor(j / r.fin.length)), t + j * .07, arc ? .16 : .9, .16);
      tono(bajo, r.fin[0] - 12, t, 2.5, .38); pulso(t, .8);
      rec.rematado = true;
    }
  } finally { master = antes; captura = null; }
}
function recapAvanza() {
  if (!rec || !AC) return;
  // Tres minutos como mucho: si algo se queda abierto, la música no sigue para siempre.
  if (AC.currentTime - rec.inicio > 180) { sonidoRecapParar(); return; }
  while (rec && !rec.rematado && rec.t < AC.currentTime + 1.2) recapCompas();
  if (rec && rec.rematado && AC.currentTime > rec.t + 3.5) { const r = rec; rec = null; clearInterval(r.reloj); try { r.bus.disconnect(); } catch (e) { /* ya */ } }
}
function sonidoRecapEmpezar() {
  sonidoRecapParar();
  const c = puedeYa();
  if (!c) return;
  const arc = conArcade(), w = arc ? "arcade" : mundoSonido();
  const bus = c.createGain(); bus.gain.value = .7; bus.connect(masterReal);
  rec = { r: RECAP[w] || RECAP.casa, m: arc ? {} : Object.assign({}, MATERIAL[w], RECAP_VOCES[w] || {}), arc,
          bus, notas: [], i: 0, t: c.currentTime + .08, inicio: c.currentTime, fin: false, rematado: false, reloj: null };
  recapAvanza();
  rec.reloj = setInterval(recapAvanza, 250);
  avisoPrimerSonido();
}
function sonidoRecapFinal() { if (rec && !rec.fin) rec.fin = true; }
function sonidoRecapParar() {
  if (!rec) return;
  const r = rec; rec = null;
  clearInterval(r.reloj);
  if (!AC) return;
  const t = AC.currentTime;
  r.notas.forEach(([o, g]) => {
    try { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + .08); } catch (e) { /* nada */ }
    try { o.stop(t + .1); } catch (e) { /* ya había parado */ }
  });
  try { r.bus.gain.setTargetAtTime(0, t, .03); setTimeout(() => r.bus.disconnect(), 400); } catch (e) { /* nada */ }
}
// Fuera de la vista no suena nada, y el recap no se guarda para después.
document.addEventListener("visibilitychange", () => { if (document.visibilityState !== "visible") sonidoRecapParar(); });

/* ---------- El aviso del primer sonido ----------
   Quien ya usaba la app no pasa por la bienvenida: la primera vez que le
   suene algo, un aviso con el botón para silenciar. Android no calla la app
   con el modo silencio (eso solo calla el timbre), así que ese primer sonido
   puede caer en una junta: el botón tiene que estar ahí mismo. */
function avisoPrimerSonido() {
  if (typeof state === "undefined" || !state || !state.settings || state.settings.sonidoAvisado) return;
  state.settings.sonidoAvisado = true;
  if (typeof save === "function") save();
  if (typeof toast === "function")
    toast(tx("Norata tiene sonido. Si ahora no es buen momento, se silencia aquí o en Ajustes."), "hecho",
      { label: tx("Silenciar"), onclick: "sonidoPoner(false)", ms: 9000 });
}

/* ---------- Los controles ----------
   El mismo par en tres sitios: la pantalla de Ajustes del teléfono, el menú
   del engrane en la PC (los dos junto a Aspecto) y la tarjeta de la
   bienvenida. Sale de aquí para que las tres copias no digan cosas distintas,
   y con clases, no con ids, porque conviven. */
function sonidoControlesHTML() {
  const on = encendido(), v = volumen();
  const op = (val, nombre, ico, activo) => `
    <button type="button" class="ts-op${activo ? " on" : ""}" data-son="${val}" role="radio"
      aria-checked="${activo}" onclick="sonidoPoner(${val === "on"})">
      ${icon(ico, 15)}<span>${nombre}</span>
    </button>`;
  return `
    <div class="tema-fila son-fila">
      <span class="tema-tit">${tx("Sonido")}</span>
      <div class="tema-sw son-sw" role="radiogroup" aria-label="${escapeAttr(tx("Sonido de Norata"))}">
        ${op("off", tx("Silencio"), "silencio", !on)}
        ${op("on", tx("Con sonido"), "sonido", on)}
      </div>
      <div class="son-vol${on ? "" : " apagada"}">
        ${icon("sonido", 16)}
        <input type="range" min="0" max="100" step="1" value="${v}" ${on ? "" : "disabled"}
          aria-label="${escapeAttr(tx("Volumen de Norata"))}"
          oninput="sonidoVolumen(this.value)" onchange="sonidoVolumen(this.value, true)">
        <output>${v}%</output>
      </div>
    </div>`;
}
function pintarSonido() {
  document.querySelectorAll(".sonido-hueco").forEach(h => { h.innerHTML = sonidoControlesHTML(); });
  const otra = document.getElementById("son-otra");
  if (otra) otra.disabled = !encendido();
}
function sonidoPoner(on) {
  if (typeof state === "undefined" || !state) return;
  state.settings = state.settings || {};
  state.settings.sonido = !!on;
  state.settings.sonidoAvisado = true;
  if (typeof save === "function") save();
  if (!on) sonidoRecapParar();
  pintarSonido();
  // Una muestra al encender: así se sabe que volvió y a qué volumen.
  if (on) { despertar(); setTimeout(() => sonar("mision", 4), 60); }
}
/* El volumen cambia mientras se arrastra, sin repintar (repintar suelta la
   barra de la mano); al soltar suena una muestra para oírlo. */
function sonidoVolumen(v, soltar) {
  v = Math.max(0, Math.min(100, Math.round(+v || 0)));
  try { localStorage.setItem(VOL_CLAVE, String(v)); } catch (e) { /* sin almacén: dura lo que la pestaña */ }
  if (masterReal) masterReal.gain.value = ganancia(v);
  document.querySelectorAll(".son-vol output").forEach(o => { o.textContent = v + "%"; });
  document.querySelectorAll(".son-vol input").forEach(i => { if (+i.value !== v) i.value = v; });
  if (soltar) sonar(document.getElementById("son-otra") ? "bienvenida" : "mision", 4);
}

/* ---------- La tarjeta de la bienvenida ----------
   Al terminar el cuestionario suena la bienvenida —el toque de «Armar mi
   tablero» es el que deja sonar al navegador— y después sale esta tarjeta: lo
   que oíste es Norata, aquí se silencia, aquí se ajusta, y se puede volver a
   oír cuantas veces se quiera hasta seguir (Eduardo). */
function sonidoTarjetaBienvenida() {
  if (typeof askBase !== "function") return Promise.resolve();
  if (state && state.settings) { state.settings.sonidoAvisado = true; if (typeof save === "function") save(); }
  const cuerpo = `
    <p class="son-intro">${tx("Suenan tus logros, nunca los botones. Ajusta el volumen y pruébalo las veces que quieras; si prefieres el silencio, se apaga aquí. Lo tienes siempre a la mano en Ajustes, junto al modo oscuro y claro.")}</p>
    <div class="sonido-hueco son-bienvenida">${sonidoControlesHTML()}</div>
    <button type="button" class="btn btn-linea son-otra" id="son-otra" onclick="sonidoProbar()" ${encendido() ? "" : "disabled"}>${icon("sonido", 15)}${tx("Escuchar otra vez")}</button>`;
  return askBase(cuerpo, true, tx("Continuar"), false, false, null,
    { icono: "sonido", fijo: true, soloOk: true, titulo: tx("Esto que oíste es Norata"), tono: "menta" });
}
function sonidoProbar() { despertar(); sonar("bienvenida"); }

window.sonar = sonar;
window.sonarArcade = sonarArcade;
window.sonidoMision = sonidoMision;
window.sonidoEncendido = encendido;
window.sonidoDespertar = despertar;
window.sonidoRecapEmpezar = sonidoRecapEmpezar;
window.sonidoRecapFinal = sonidoRecapFinal;
window.sonidoRecapParar = sonidoRecapParar;
window.sonidoControlesHTML = sonidoControlesHTML;
window.pintarSonido = pintarSonido;
window.sonidoPoner = sonidoPoner;
window.sonidoVolumen = sonidoVolumen;
window.sonidoTarjetaBienvenida = sonidoTarjetaBienvenida;
window.sonidoProbar = sonidoProbar;
})();
