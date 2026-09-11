/* ================= Jornada: el día en una rueda (EN PRUEBA, 0.7.101) ========
   Una rueda de 24 horas donde se acomoda CUÁNDO se hace cada cosa, con un
   reloj de arena en el centro que lleva los tramos de enfoque (la técnica
   pomodoro). Al acabar un tramo apunta el avance en el módulo que toque.

   Nació de dos bocetos del 10 sep 2026. El primero ponía un botón de «Enfocar»
   en cada misión y cada habilidad, y Eduardo lo paró: «vas a saturar de
   botones la interfaz». Lo que él se imaginaba era un LUGAR para planear el
   día, como las apps de bloques de tiempo, y con los controles de otra que
   había visto: una sola cosa grande, un botón de Iniciar y casi nada de texto.

   ---- Apagada para todos, y se enciende con un enlace ----
   Es un módulo de prueba: `?jornada=1` la enciende y `?jornada=0` la apaga.
   Se guarda en `state.ui.jornada` y NO en sessionStorage como las pruebas de
   mirar, porque esta se juzga USÁNDOLA varios días —ver la nota del modo
   horizontal en la memoria de la casa: un interruptor que se pierde al cerrar
   la pestaña hizo que Eduardo volviera diciendo que no le salían los botones—.
   Y así viaja a sus otros dispositivos con la sincronía.

   ---- El reloj mide con marcas de tiempo, nunca contando ----
   Se guarda cuándo empezó el tramo y cuánto llevaba, no un contador que baja.
   Así sobrevive a cerrar la app, a que el teléfono duerma la pestaña y a
   recargar: al volver, la cuenta sale igual. Por la misma razón el paso lo da
   un `setInterval` y no `requestAnimationFrame`: en una pestaña de fondo no hay
   fotogramas, y sin eso el tramo no acababa —ni sonaba el aviso— hasta volver.

   ---- La regla de todo: el reloj propone y tú confirmas ----
   Solo toca otros módulos por las puertas que ya existen: `logMission` para
   cumplir una misión (y solo si dices que la terminaste) y `addXp` para la
   práctica de una habilidad, con los mismos topes de medio día que el registro
   manual. Los talentos y los encargos no guardan tiempo en ningún campo, así
   que si entrenan una habilidad, la practica esa; si no, queda en el registro
   de la Jornada y en ningún otro sitio. */

const J_DIA = 1440, J_MS = 60000;
const J_C = 160, J_RO = 126, J_RI = 94, J_RM = 110;
const J_PRESETS = { clasico: { foco: 25, desc: 5, ciclos: 4 }, profundo: { foco: 50, desc: 10, ciclos: 2 } };
const J_LUNA = '<path d="M19.5 14.5A7.5 7.5 0 019.5 4.5a7.5 7.5 0 1010 10z"/>';
const J_ARENA = '<path d="M7 3h10M7 21h10M8 3c0 5 8 6.5 8 9s-8 4-8 9M16 3c0 5-8 6.5-8 9s8 4 8 9"/>';

function jornadaEncendida() { return !!(state.ui && state.ui.jornada === true); }

/* Los datos se siembran al PEDIRLOS, no al cargar: quien nunca encienda la
   Jornada no lleva ni una llave de más en su perfil. */
function jDatos() {
  if (!state.jornada || typeof state.jornada !== "object") state.jornada = {};
  const j = state.jornada;
  if (!Array.isArray(j.bloques)) j.bloques = [{ id: uid(), sueno: true, ini: 23 * 60, fin: 7 * 60 }];
  if (!j.cfg || typeof j.cfg !== "object") j.cfg = {};
  j.cfg = Object.assign({ preset: "clasico", foco: 25, desc: 5, ciclos: 4, auto: false, sonido: true, avisos: false }, j.cfg);
  if (!Array.isArray(j.registro)) j.registro = [];
  return j;
}

/* ---------- El tiempo ---------- */
const jDur = b => ((b.fin - b.ini + J_DIA) % J_DIA) || J_DIA;
const jDentro = (b, m) => ((m - b.ini + J_DIA) % J_DIA) < jDur(b);
const jSnap = m => ((Math.round(m / 15) * 15) % J_DIA + J_DIA) % J_DIA;
/* La hora del perfil, no la del reloj de la máquina: es la misma zona que usan
   `todayKey` y las marcas de las misiones. */
function jAhora() {
  const s = hhmmNow();
  return (+s.slice(0, 2)) * 60 + (+s.slice(2)) + new Date().getSeconds() / 60;
}
function jBloqueEn(m) { return jDatos().bloques.find(b => jDentro(b, m)) || null; }
function jH12(m) {
  m = ((Math.round(m) % J_DIA) + J_DIA) % J_DIA;
  const h = Math.floor(m / 60), mm = m % 60;
  return `${h % 12 || 12}:${String(mm).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}
const jRango = b => jH12(b.ini) + " – " + jH12(b.fin);
function jFmtDur(d) {
  const h = Math.floor(d / 60), m = d % 60;
  if (!h) return T`${m} min`;
  return m ? T`${h} h ${m} min` : T`${h} h`;
}
function jMmss(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
}

/* ---------- A qué apunta un bloque ---------- */
function jColeccion(t) {
  return ({ mision: state.missions, habilidad: state.skills, talento: state.perks, proyecto: state.projects })[t] || [];
}
function jRef(ref) {
  if (!ref) return null;
  const o = jColeccion(ref.t).find(x => x.id === ref.id);
  return o ? { t: ref.t, id: o.id, o, nombre: o.name || "" } : null;
}
function jTipo(t) {
  return ({ mision: tx("Misión"), habilidad: tx("Habilidad"), talento: tx("Talento"), proyecto: tx("Proyecto") })[t] || "";
}
function jIconoDe(o) { const n = o && o.icon; return ICONS[n] || ICONS[EMOJI_TO_ICON[n]] || ICONS.star; }
function jNombreBloque(b) {
  if (b.sueno) return tx("Dormir");
  const r = jRef(b.ref);
  return r ? r.nombre : tx("Bloque libre");
}
function jColorBloque(b) {
  if (b.sueno) return "var(--jor-sueno)";
  const r = jRef(b.ref);
  return r && r.o.color ? pinta(r.o.color) : "var(--jor-libre)";
}
function jIconoBloque(b) {
  if (b.sueno) return J_LUNA;
  const r = jRef(b.ref);
  return r ? jIconoDe(r.o) : J_ARENA;
}

/* Lo que se puede poner en la rueda. Las misiones son las DE HOY: una misión
   de los martes no tiene nada que hacer en el miércoles. */
function jCandidatos() {
  return [
    ["mision", tx("Misiones de hoy"), (state.missions || []).filter(m => missionDueToday(m))],
    ["habilidad", tx("Habilidades"), state.skills || []],
    ["talento", tx("Talentos en curso"), (state.perks || []).filter(p => p.status === "active")],
    ["proyecto", tx("Encargos en curso"), (state.projects || []).filter(p => p.status === "active" || p.status === "paused")]
  ].filter(g => g[2].length);
}

/* ---------- Qué se enfoca si tocas Iniciar ---------- */
let jEleccion;   // undefined: lo decide el bloque de ahora · null: sin atar · {t,id}: lo que elegiste
function jObjetivo() {
  const j = jDatos();
  if (j.run) return j.run.ref;
  if (jEleccion !== undefined) return jEleccion;
  const b = jBloqueEn(jAhora());
  return b && !b.sueno && jRef(b.ref) ? b.ref : null;
}

/* ---------- El reloj ---------- */
const jTrans = run => !run ? 0 : (run.acum || 0) + (run.seg ? Date.now() - run.seg : 0);
let jConfirmando = false;

function jIniciar() {
  jAudio();
  const j = jDatos(), c = j.cfg, libre = c.preset === "libre";
  let tramo = 1, ref = jObjetivo(), bloque = null;
  if (j.run && j.run.fase === "listo") { tramo = j.run.tramo; ref = j.run.ref; bloque = j.run.bloque; }
  else {
    const b = jBloqueEn(jAhora());
    bloque = b && !b.sueno && jEleccion === undefined ? b.id : null;
  }
  j.run = { fase: "foco", tramo, dur: libre ? null : c.foco * J_MS, acum: 0, seg: Date.now(), pausas: 0, libre, ref: ref || null, bloque };
  jConfirmando = false;
  save(); jPintarControles(); jPintarCentro(); jPintarRegla();
}
function jPausa() {
  const run = jDatos().run; if (!run || run.fase !== "foco") return;
  if (run.seg) { run.acum = jTrans(run); run.seg = null; run.pausas++; }
  else run.seg = Date.now();
  save(); jPintarControles();
}
function jSiguiente() {
  const j = jDatos(), run = j.run;
  Object.assign(run, { fase: "listo", tramo: run.tramo + 1, dur: j.cfg.foco * J_MS, acum: 0, seg: null, pausas: 0 });
  if (j.cfg.auto) jIniciar();
  else { save(); jPintarControles(); }
}
function jFinFase() {
  const j = jDatos(), run = j.run;
  if (run.fase === "foco") {
    run.min = Math.round(run.dur / J_MS);
    run.fase = "cierre"; run.seg = null;
    save();
    jAvisar(T`Tramo ${run.tramo} de ${j.cfg.ciclos} listo`, T`${run.min} min de foco. Toca descansar.`);
    if (document.querySelector("#view-jornada.active")) jAbrirHoja("cierre");
    jPintarControles();
  } else if (run.fase === "descanso") {
    jAvisar(tx("Se acabó el descanso"), T`Sigue el tramo ${run.tramo + 1}.`);
    jSiguiente();
  }
}
function jTerminarLibre() {
  const run = jDatos().run;
  run.acum = jTrans(run); run.seg = null;
  run.min = Math.max(1, Math.round(run.acum / J_MS));
  run.fase = "cierre";
  save(); jPintarControles(); jAbrirHoja("cierre");
}
function jAbandonar() {
  const j = jDatos(), run = j.run; if (!run) return;
  const r = jRef(run.ref);
  j.registro.unshift({ id: uid(), fecha: todayKey(), hora: hhmmNow(), ref: run.ref, nombre: r ? r.nombre : tx("Sin atar"),
    min: Math.floor(jTrans(run) / J_MS), pausas: run.pausas, animo: 0, res: tx("Abandonado · sin XP"), abandono: true });
  j.run = null; jEleccion = undefined;
  save(); jPintar();
}

/* ---------- Lo que pasa al guardar un tramo ---------- */
/* La tarifa del registro manual (`PRACTICAS`, js/06-detalle.js): 40 XP la hora
   y un extra pequeño por sostenerlo. Un tramo de 25 minutos da 17. */
const jXp = min => min <= 60 ? Math.round(min * 40 / 60) : Math.round(40 + (min - 60) * 45 / 60);
const jNivelPractica = min => min < 45 ? "suave" : min < 105 ? "moderada" : "intensiva";

function jEfecto(ref, min, terminada) {
  const r = jRef(ref);
  if (!r) return { t: tx("Queda en tu registro"), s: tx("Sin tocar ningún módulo.") };
  if (r.t === "mision") {
    const m = r.o, hoy = todayKey();
    if (missionDone(m, hoy)) return { t: T`${min} min de foco en «${m.name}»`, s: tx("La misión ya estaba cumplida hoy.") };
    if (terminada) {
      return {
        t: tx("Misión cumplida"),
        s: m.skillId && m.xp ? T`Y su habilidad recibe ${m.xp} XP.` : T`Con ${min} min de foco.`,
        propio: true,
        hacer: () => logMission(m.id, missionTarget(m) - missionCount(m, hoy))
      };
    }
    return { t: T`${min} min de foco apuntados`, s: tx("La misión sigue abierta.") };
  }
  const s = r.t === "habilidad" ? r.o : (r.o.skillId ? (state.skills || []).find(x => x.id === r.o.skillId) : null);
  if (!s) return { t: T`${min} min de foco apuntados`, s: tx("Queda en el registro de tu Jornada.") };
  /* Los mismos dos topes que el registro manual: medio día por habilidad y
     medio día sumando todas. Por encima el número deja de decir lo que pasó. */
  const libre = Math.min(TOPE_MIN_DIA - minutosHoy(s), TOPE_MIN_DIA - minutosHoyGlobal());
  const cuenta = Math.max(0, Math.min(min, libre));
  const xp = jXp(cuenta);
  if (!xp) return { t: T`${min} min de foco apuntados`, s: tx("Ya llegaste al tope de práctica de hoy.") };
  return {
    t: T`+${xp} XP a ${s.name}`,
    s: r.t === "habilidad" ? tx("Cuenta como práctica de hoy: no baja.") : T`Por «${r.nombre}», que la entrena.`,
    skill: s,
    hacer: () => addXp(s, xp, T`Enfoque: ${r.nombre}`, "Jornada", { min: cuenta, nivel: jNivelPractica(cuenta) })
  };
}

let jRespuesta = "no", jAnimo = 2;
function jGuardar(descansar) {
  const j = jDatos(), run = j.run;
  if (!run || run.fase !== "cierre") return;
  const ef = jEfecto(run.ref, run.min, jRespuesta === "si");
  const antes = ef.skill ? levelInfo(ef.skill.xp).level : null;
  if (ef.hacer) ef.hacer();
  const r = jRef(run.ref);
  j.registro.unshift({ id: uid(), fecha: todayKey(), hora: hhmmNow(), ref: run.ref, nombre: r ? r.nombre : tx("Sin atar"),
    min: run.min, pausas: run.pausas, animo: jAnimo, res: ef.t, bloque: run.bloque || null });
  j.registro = j.registro.slice(0, 300);
  const ultimo = !run.libre && run.tramo >= j.cfg.ciclos;
  if (run.libre || ultimo) { j.run = null; jEleccion = undefined; }
  else if (descansar) Object.assign(run, { fase: "descanso", dur: j.cfg.desc * J_MS, acum: 0, seg: Date.now() });
  else Object.assign(run, { fase: "listo", tramo: run.tramo + 1, dur: j.cfg.foco * J_MS, acum: 0, seg: null, pausas: 0 });
  save();
  cerrarHojaJornada();
  if (!ultimo && !descansar && j.run && j.cfg.auto) jIniciar();
  if (typeof checkStreakMilestone === "function") checkStreakMilestone();
  if (typeof revisarNivelExpedicion === "function") revisarNivelExpedicion();
  if (ef.skill && levelInfo(ef.skill.xp).level > antes) {
    celebrate(T`Nivel ${levelInfo(ef.skill.xp).level}`, T`${ef.skill.name} sube de nivel`, ef.skill.color, ef.skill.icon);
  } else if (!ef.propio) {
    toast(ultimo ? T`${ef.t} · terminaste los ${j.cfg.ciclos} tramos` : ef.t, "logro");
  }
  jPintar();
}

/* ---------- La rueda ---------- */
function jPt(r, m) { const a = m / J_DIA * Math.PI * 2; return [J_C + r * Math.sin(a), J_C - r * Math.cos(a)]; }
function jArco(ini, d) {
  const large = d > 720 ? 1 : 0;
  const [x1, y1] = jPt(J_RO, ini), [x2, y2] = jPt(J_RO, ini + d), [x3, y3] = jPt(J_RI, ini + d), [x4, y4] = jPt(J_RI, ini);
  return `M${x1} ${y1}A${J_RO} ${J_RO} 0 ${large} 1 ${x2} ${y2}L${x3} ${y3}A${J_RI} ${J_RI} 0 ${large} 0 ${x4} ${y4}Z`;
}
function jBaseRueda() {
  let h = `<circle class="jor-carril" cx="${J_C}" cy="${J_C}" r="${J_RM}" stroke-width="${J_RO - J_RI}"/>`;
  for (let i = 0; i < 24; i++) {
    const mayor = i % 6 === 0;
    const [x1, y1] = jPt(J_RO + 3, i * 60), [x2, y2] = jPt(J_RO + (mayor ? 10 : 6), i * 60);
    h += `<line class="jor-tick${mayor ? " mayor" : ""}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  }
  for (let i = 0; i < 24; i += 2) {
    const mayor = i % 6 === 0;
    const txt = mayor ? `${i % 12 || 12} ${i < 12 ? "AM" : "PM"}` : String(i % 12 || 12);
    const [x, y] = jPt(J_RO + 22, i * 60);
    h += `<text class="jor-num${mayor ? " mayor" : ""}" x="${x}" y="${y}">${txt}</text>`;
  }
  return h;
}

let jSelId = null;
function jPintarRueda() {
  const g = document.getElementById("jor-bloques-svg");
  if (!g) return;
  let h = "";
  for (const b of jDatos().bloques) {
    const d = jDur(b);
    h += `<path class="jor-blq${b.id === jSelId ? " sel" : ""}" data-id="${b.id}" d="${jArco(b.ini, d)}" style="fill:${jColorBloque(b)}"/>`;
    if (d >= 60) {
      const [x, y] = jPt(J_RM, b.ini + d / 2);
      h += `<svg class="jor-blq-ic${b.sueno ? " sueno" : ""}" x="${x - 8}" y="${y - 8}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${jIconoBloque(b)}</svg>`;
    }
  }
  g.innerHTML = h;
  const s = jDatos().bloques.find(b => b.id === jSelId);
  document.getElementById("jor-asas").innerHTML = s ? ["ini", "fin"].map(k => {
    const [x, y] = jPt(J_RM, s[k]);
    return `<g class="jor-asa-g" data-h="${k}"><circle cx="${x}" cy="${y}" r="18" fill="transparent"/><circle class="jor-asa" cx="${x}" cy="${y}" r="8"/></g>`;
  }).join("") : "";
}
function jPintarAguja() {
  const a = document.getElementById("jor-aguja");
  if (a) a.setAttribute("transform", `rotate(${jAhora() / J_DIA * 360} ${J_C} ${J_C})`);
}

/* ---------- Arrastrar en la rueda ---------- */
function jMinEn(svg, e) {
  const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
  const q = p.matrixTransform(svg.getScreenCTM().inverse());
  let a = Math.atan2(q.x - J_C, -(q.y - J_C)); if (a < 0) a += Math.PI * 2;
  return a / (Math.PI * 2) * J_DIA;
}
/* Los vecinos se miran UNA vez, al empezar a arrastrar: un bloque no puede
   pasar por encima de otro, así que durante el arrastre no cambian. */
function jVecinos(b) {
  const otros = jDatos().bloques.filter(o => o !== b);
  let prev = null, next = null, dp = 1e9, dn = 1e9;
  for (const o of otros) {
    const n = (o.ini - b.ini + J_DIA) % J_DIA; if (n > 0 && n < dn) { dn = n; next = o; }
    const p = (b.ini - o.ini + J_DIA) % J_DIA; if (p > 0 && p < dp) { dp = p; prev = o; }
  }
  return prev && next ? { prevFin: prev.fin, nextIni: next.ini } : null;
}
/* Si lo pedido se sale del hueco, se queda en la orilla más cercana. */
function jAcotar(off, lo, hi) {
  if (off >= lo && off <= hi) return off;
  const aHi = ((off - hi) % J_DIA + J_DIA) % J_DIA, aLo = ((lo - off) % J_DIA + J_DIA) % J_DIA;
  return aHi < aLo ? hi : lo;
}
function jMoverIni(b, m, v) {
  const base = v ? v.prevFin : b.fin;
  const hi = ((b.fin - 15) - base + 2 * J_DIA) % J_DIA;
  return (base + jAcotar((m - base + J_DIA) % J_DIA, v ? 0 : 15, hi)) % J_DIA;
}
function jMoverFin(b, m, v) {
  const maxD = v ? (((v.nextIni - b.ini + J_DIA) % J_DIA) || J_DIA) : J_DIA - 15;
  return (b.ini + jAcotar((m - b.ini + J_DIA) % J_DIA, 15, maxD)) % J_DIA;
}
function jMoverTodo(ini, d, v) {
  if (!v) return ini;
  const G = ((v.nextIni - v.prevFin + J_DIA) % J_DIA) || J_DIA;
  if (G < d) return null;
  return (v.prevFin + jAcotar((ini - v.prevFin + J_DIA) % J_DIA, 0, G - d)) % J_DIA;
}
function jEngancharRueda(svg) {
  let arr = null;
  svg.addEventListener("pointerdown", e => {
    const asa = e.target.closest("[data-h]"), p = e.target.closest(".jor-blq");
    const bloques = jDatos().bloques;
    const s = bloques.find(b => b.id === jSelId);
    if (asa && s) {
      arr = { modo: asa.dataset.h, b: s, v: jVecinos(s), x: e.clientX, y: e.clientY, movido: false };
    } else if (p) {
      const b = bloques.find(x => x.id === p.dataset.id);
      if (!b) return;
      const ya = jSelId === b.id;
      jSelId = b.id;
      arr = { modo: "todo", b, v: jVecinos(b), m0: jMinEn(svg, e), ini0: b.ini, x: e.clientX, y: e.clientY, movido: false, ya };
      jPintarRueda(); jPintarLista();
    } else {
      if (jSelId) { jSelId = null; jPintarRueda(); jPintarLista(); }
      return;
    }
    try { svg.setPointerCapture(e.pointerId); } catch (x) { /* sin captura, sigue igual */ }
    e.preventDefault();
  });
  svg.addEventListener("pointermove", e => {
    if (!arr) return;
    if (!arr.movido && Math.hypot(e.clientX - arr.x, e.clientY - arr.y) < 6) return;
    arr.movido = true;
    const { b, v } = arr, m = jSnap(jMinEn(svg, e));
    if (arr.modo === "ini") b.ini = jMoverIni(b, m, v);
    else if (arr.modo === "fin") b.fin = jMoverFin(b, m, v);
    else {
      const d = jDur(b);
      const delta = ((jMinEn(svg, e) - arr.m0 + 720) % J_DIA + J_DIA) % J_DIA - 720;
      const ini = jMoverTodo(jSnap(arr.ini0 + delta), d, v);
      if (ini != null) { b.ini = ini; b.fin = (ini + d) % J_DIA; }
    }
    jPintarRueda(); jPintarLista();
  });
  const soltar = () => {
    if (!arr) return;
    const a = arr; arr = null;
    if (a.movido) save();
    else if (a.modo === "todo" && a.ya) jAbrirBloque(a.b.id);
    jPintar();
  };
  svg.addEventListener("pointerup", soltar);
  svg.addEventListener("pointercancel", soltar);
}

/* ---------- Choques ---------- */
function jChoca(ini, fin, exceptoId) {
  const t = { ini, fin };
  return jDatos().bloques.find(o => o.id !== exceptoId && (jDentro(o, ini) || jDentro(t, o.ini))) || null;
}
/* Acomodar: lo pone en el primer hueco libre desde ahora, de una hora si cabe. */
function jAcomodar(t, id) {
  const desde = Math.ceil(jAhora() / 15) * 15;
  for (const d of [60, 45, 30, 15]) {
    for (let s = 0; s < J_DIA; s += 15) {
      const ini = (desde + s) % J_DIA, fin = (ini + d) % J_DIA;
      if (!jChoca(ini, fin, null)) {
        const b = { id: uid(), ref: { t, id }, ini, fin };
        jDatos().bloques.push(b); jSelId = b.id;
        save(); jPintar();
        return;
      }
    }
  }
  toast(tx("La rueda está llena: quita o acorta un bloque"), "atencion");
}

/* ---------- La pantalla ---------- */
function renderJornada() {
  const cont = document.getElementById("jornada-content");
  if (!cont || !jornadaEncendida()) return;
  jDatos();
  cont.innerHTML = `
    <div class="jor">
      <div class="jor-reloj">
        <div class="jor-rueda">
          <svg id="jor-svg" viewBox="0 0 320 320" role="img" aria-label="${escapeAttr(tx("Tu día en una rueda de 24 horas"))}">
            <g>${jBaseRueda()}</g><g id="jor-bloques-svg"></g>
            <g id="jor-aguja" class="jor-aguja"><line x1="${J_C}" y1="${J_C - J_RI + 6}" x2="${J_C}" y2="${J_C - J_RO - 9}"/><circle cx="${J_C}" cy="${J_C - J_RO - 9}" r="3.5"/></g>
            <g id="jor-asas"></g>
          </svg>
          <div class="jor-centro">
            <svg class="jor-arena" id="jor-arena" viewBox="0 0 160 224" aria-hidden="true">
              <defs>
                <clipPath id="jor-c-arriba"><path d="M42 22 L118 22 C118 72 86 94 83.5 112 L76.5 112 C74 94 42 72 42 22 Z"/></clipPath>
                <clipPath id="jor-c-abajo"><path d="M76.5 112 L83.5 112 C86 130 118 152 118 202 L42 202 C42 152 74 130 76.5 112 Z"/></clipPath>
              </defs>
              <g id="jor-giro">
                <line class="jor-poste" x1="26" y1="20" x2="26" y2="204"/><line class="jor-poste" x1="134" y1="20" x2="134" y2="204"/>
                <path class="jor-vidrio" d="M42 22 L118 22 C118 72 86 94 83.5 112 C86 130 118 152 118 202 L42 202 C42 152 74 130 76.5 112 C74 94 42 72 42 22 Z"/>
                <g class="jor-arena-g">
                  <rect id="jor-a-arriba" clip-path="url(#jor-c-arriba)" x="40" y="22" width="80" height="90"/>
                  <rect id="jor-a-abajo" clip-path="url(#jor-c-abajo)" x="40" y="202" width="80" height="0"/>
                  <line id="jor-chorro" x1="80" y1="112" x2="80" y2="200"/>
                </g>
                <path class="jor-vidrio-borde" d="M42 22 L118 22 C118 72 86 94 83.5 112 C86 130 118 152 118 202 L42 202 C42 152 74 130 76.5 112 C74 94 42 72 42 22 Z"/>
                <rect class="jor-madera" x="18" y="6" width="124" height="14" rx="5"/><rect class="jor-madera" x="18" y="204" width="124" height="14" rx="5"/>
              </g>
            </svg>
            <div id="jor-tiempo">25:00</div>
            <div id="jor-fase"></div>
            <div id="jor-sub"></div>
          </div>
        </div>
        <div class="jor-controles" id="jor-controles"></div>
      </div>
      <div class="jor-lista">
        <h3 class="jor-rot">${tx("Hoy")}</h3>
        <div class="jor-bloques" id="jor-lista-bloques"></div>
        <h3 class="jor-rot">${tx("Por acomodar")}</h3>
        <div class="jor-acomodar" id="jor-acomodar"></div>
        <p class="jor-como">${tx("Toca un bloque para elegirlo, arrastra sus puntas para cambiar la hora y arrástralo entero para moverlo. Tócalo otra vez para editarlo.")}</p>
      </div>
    </div>`;
  jEngancharRueda(document.getElementById("jor-svg"));
  jArribaAntes = 1; jVolteando = false;
  jPintar();
  jPintarAguja();
  const run = jDatos().run;
  if (run && run.fase === "cierre") jAbrirHoja("cierre");
}
function jPintar() {
  if (!document.getElementById("jor-svg")) return;
  jPintarRueda(); jPintarLista(); jPintarControles(); jPintarCentro();
}

function jPintarLista() {
  const el = document.getElementById("jor-lista-bloques");
  if (!el) return;
  const j = jDatos(), m = jAhora(), hoy = todayKey();
  const foco = {};
  j.registro.forEach(r => { if (r.fecha === hoy && r.bloque && !r.abandono) foco[r.bloque] = (foco[r.bloque] || 0) + r.min; });
  el.innerHTML = j.bloques.slice().sort((a, b) => a.ini - b.ini).map(b => `
    <button type="button" class="jor-fila${b.id === jSelId ? " sel" : ""}" data-id="${b.id}">
      <span class="jor-tile${b.sueno ? " sueno" : ""}" style="background:${jColorBloque(b)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${jIconoBloque(b)}</svg></span>
      <span class="jor-fila-t"><b>${escapeHtml(jNombreBloque(b))}</b><span>${jRango(b)}${foco[b.id] ? " · " + escapeHtml(T`${foco[b.id]} min de foco`) : ""}</span></span>
      <span class="jor-fila-d">${jDentro(b, m) ? `<span class="jor-chip ahora">${tx("Ahora")}</span>` : ""}<span class="jor-chip">${jFmtDur(jDur(b))}</span></span>
    </button>`).join("");
  const puestas = new Set(j.bloques.filter(b => b.ref && b.ref.t === "mision").map(b => b.ref.id));
  const libres = (state.missions || []).filter(x => missionDueToday(x) && !missionDone(x, hoy) && !puestas.has(x.id));
  document.getElementById("jor-acomodar").innerHTML = libres.length
    ? libres.map(x => `<button type="button" data-acomodar="${x.id}"><span class="jor-punto" style="background:${pinta(x.color || "#9aa7b8")}"></span>${escapeHtml(x.name)}</button>`).join("")
    : `<p class="jor-vacio">${tx("Todas tus misiones de hoy ya tienen hora.")}</p>`;
}

function jPintarControles() {
  const c = document.getElementById("jor-controles");
  if (!c) return;
  const j = jDatos(), run = j.run, cfg = j.cfg;
  const r = jRef(jObjetivo());
  const flecha = '<svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5"/></svg>';
  const play = '<svg class="lleno" viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg>';
  let h = "";
  if (!run || run.fase === "listo") {
    const ritmo = cfg.preset === "libre" ? tx("Libre") : `${cfg.foco}m / ${cfg.desc}m · ${cfg.ciclos}`;
    h += `<div class="jor-pildoras">
      <button type="button" class="jor-pild" data-a="enque" ${run ? "disabled" : ""}>${r && r.o.color ? `<span class="jor-punto" style="background:${pinta(r.o.color)}"></span>` : `<svg viewBox="0 0 24 24">${J_ARENA}</svg>`}<span class="t">${escapeHtml(r ? r.nombre : tx("Sin atar"))}</span>${run ? "" : flecha}</button>
      <button type="button" class="jor-pild" data-a="ritmo"><svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M9.5 2.5h5"/></svg><span class="t">${ritmo}</span>${flecha}</button>
    </div>`;
  }
  if (!run) {
    h += `<div class="jor-acc"><button type="button" class="btn btn-primary jor-grande" data-a="iniciar">${play}${tx("Iniciar")}</button>
      <button type="button" class="btn btn-ghost jor-icono" data-a="nuevo" aria-label="${escapeAttr(tx("Crear bloque"))}" title="${escapeAttr(tx("Crear bloque"))}"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button></div>`;
  } else if (run.fase === "listo") {
    h += `<div class="jor-acc"><button type="button" class="btn btn-primary jor-grande" data-a="iniciar">${play}${escapeHtml(T`Tramo ${run.tramo} de ${cfg.ciclos}`)}</button>
      <button type="button" class="btn btn-ghost jor-icono" data-a="fin" aria-label="${escapeAttr(tx("Terminar por hoy"))}" title="${escapeAttr(tx("Terminar por hoy"))}"><svg viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="2"/></svg></button></div>`;
  } else if (run.fase === "foco") {
    const pausa = `<button type="button" class="btn btn-soft jor-grande" data-a="pausa">${run.seg ? `<svg viewBox="0 0 24 24"><path d="M9 6v12M15 6v12"/></svg>${tx("Pausa")}` : play + tx("Seguir")}</button>`;
    h += run.libre
      ? `<div class="jor-acc dos">${pausa}<button type="button" class="btn btn-primary jor-grande" data-a="terminar">${tx("Terminar")}</button></div>
         <button type="button" class="btn btn-danger-ghost jor-chico" data-a="abandonar">${tx("Abandonar")}</button>`
      : `<div class="jor-acc dos">${pausa}<button type="button" class="btn btn-danger-ghost jor-grande" data-a="abandonar">${tx("Abandonar")}</button></div>`;
  } else if (run.fase === "descanso") {
    h += `<div class="jor-acc una"><button type="button" class="btn btn-ghost jor-grande" data-a="saltar">${tx("Saltar el descanso")}</button></div>`;
  } else if (run.fase === "cierre") {
    h += `<div class="jor-acc una"><button type="button" class="btn btn-primary jor-grande" data-a="cierre">${tx("Guardar el tramo")}</button></div>`;
  }
  c.innerHTML = h;
  jConfirmando = false;
  jPintarRegla();
}
/* La línea de debajo de los controles: qué va a pasar con lo que se enfoca.
   Es «el reloj propone, tú confirmas» dicho antes de empezar. */
function jPintarRegla() {
  const c = document.getElementById("jor-controles");
  if (!c) return;
  let p = c.querySelector(".jor-regla");
  if (!p) { p = document.createElement("p"); p.className = "jor-regla"; c.appendChild(p); }
  const r = jRef(jObjetivo());
  let t;
  if (!r) t = tx("Sin atar: solo queda en tu registro.");
  else if (r.t === "mision") t = tx("Al acabar el tramo te pregunta si la terminaste.");
  else if (r.t === "habilidad") t = tx("Cada tramo cuenta como práctica y le da XP.");
  else {
    const s = r.o.skillId && (state.skills || []).find(x => x.id === r.o.skillId);
    t = s ? T`Cada tramo le da XP a ${s.name}, la habilidad que entrena.` : tx("Queda en el registro de tu Jornada.");
  }
  p.textContent = t;
}

/* ---------- El reloj de arena del centro ----------
   La arena se dibuja SIEMPRE con el reloj derecho: la de arriba apoyada en el
   cuello, la de abajo en el suelo. Al voltearlo gira el dibujo entero con la
   arena dentro y, al acabar el giro, se endereza sin que se note: lleno, un
   bulbo va de punta a punta, así que «abajo lleno, girado» y «arriba lleno,
   derecho» son el mismo dibujo. En el primer boceto la arena se dibujaba de
   cabeza y en el modo Libre se quedaba pegada al techo — lo cazó Eduardo. */
let jArribaAntes = 1, jVolteando = false;
function jVoltear() {
  const g = document.getElementById("jor-giro");
  if (!g) return;
  jVolteando = true;
  g.style.transition = ""; g.style.transform = "rotate(180deg)";
  const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
  setTimeout(() => {
    g.style.transition = "none"; g.style.transform = "rotate(0deg)";
    g.getBoundingClientRect(); g.style.transition = "";
    jVolteando = false;
  }, quieto ? 0 : 950);
}
function jEstadoCentro() {
  const j = jDatos(), run = j.run, cfg = j.cfg;
  if (!run) {
    const b = jBloqueEn(jAhora()), r = jRef(jObjetivo());
    return { arriba: 1, t: cfg.preset === "libre" ? "00:00" : jMmss(cfg.foco * J_MS), f: r ? r.nombre : tx("Sin atar"), fc: "",
      sub: b ? jRango(b) : tx("Nada a esta hora"), cae: false, prog: 0 };
  }
  const el = jTrans(run), r = jRef(run.ref), nom = r ? r.nombre : tx("Sin atar");
  if (run.fase === "foco") {
    const enPausa = !run.seg;
    if (run.libre) {
      const v = (el % (25 * J_MS)) / (25 * J_MS);
      return { arriba: 1 - v, t: jMmss(el), f: enPausa ? tx("En pausa") : tx("Enfoque libre"), fc: enPausa ? "pausa" : "foco", sub: nom, cae: !enPausa, prog: v };
    }
    const p = Math.min(1, el / run.dur);
    return { arriba: 1 - p, t: jMmss(run.dur - el), f: enPausa ? tx("En pausa") : T`Foco · ${run.tramo} de ${cfg.ciclos}`, fc: enPausa ? "pausa" : "foco", sub: nom, cae: !enPausa, prog: p };
  }
  if (run.fase === "descanso") {
    const p = Math.min(1, el / run.dur);
    return { arriba: 1 - p, t: jMmss(run.dur - el), f: tx("Descanso"), fc: "brasa", sub: T`Luego, tramo ${run.tramo + 1}`, cae: true, prog: p };
  }
  if (run.fase === "listo") return { arriba: 1, t: jMmss(cfg.foco * J_MS), f: T`Tramo ${run.tramo} de ${cfg.ciclos}`, fc: "", sub: nom, cae: false, prog: 0 };
  return { arriba: 0, t: jMmss(run.libre ? run.acum : 0), f: tx("Tramo listo"), fc: "foco", sub: nom, cae: false, prog: 1 };
}
function jPintarCentro() {
  const reloj = document.getElementById("jor-arena");
  if (!reloj) return;
  const s = jEstadoCentro();
  if (s.arriba - jArribaAntes > 0.5 && !jVolteando) jVoltear();
  jArribaAntes = s.arriba;
  const p = jVolteando ? 1 : 1 - s.arriba;
  const yA = 22 + p * 90, yB = 202 - p * 90;
  const A = document.getElementById("jor-a-arriba"), B = document.getElementById("jor-a-abajo"), ch = document.getElementById("jor-chorro");
  A.setAttribute("y", yA); A.setAttribute("height", Math.max(0, 112 - yA));
  B.setAttribute("y", yB); B.setAttribute("height", 202 - yB);
  ch.style.display = s.cae && !jVolteando && s.arriba > 0.01 ? "" : "none";
  ch.setAttribute("y2", Math.max(114, yB));
  const run = jDatos().run;
  reloj.classList.toggle("brasa", !!run && run.fase === "descanso");
  document.getElementById("jor-tiempo").textContent = s.t;
  const f = document.getElementById("jor-fase");
  f.textContent = s.f; f.className = s.fc;
  document.getElementById("jor-sub").textContent = s.sub;
}

/* ---------- La píldora: el reloj te sigue a otras pantallas ---------- */
function jPintarPildora() {
  const pil = document.getElementById("jornada-pildora");
  if (!pil) return;
  const run = jornadaEncendida() ? jDatos().run : null;
  const ver = !!run && run.fase !== "listo" && !document.querySelector("#view-jornada.active") &&
              !document.getElementById("portada");
  pil.hidden = !ver;
  if (!ver) return;
  const s = jEstadoCentro();
  pil.classList.toggle("brasa", run.fase === "descanso");
  document.getElementById("jor-pil-t").textContent = run.fase === "cierre" ? tx("Listo") : s.t;
  document.getElementById("jor-pil-s").textContent = run.fase === "cierre" ? tx("Toca para guardar el tramo") : `${s.f} · ${s.sub}`;
}

/* ---------- El paso ---------- */
let jCuartoAntes = -1;
function jPaso() {
  if (!jornadaEncendida()) { jPintarPildora(); return; }
  const run = jDatos().run;
  if (run && (run.fase === "foco" || run.fase === "descanso") && run.dur && run.seg && jTrans(run) >= run.dur) jFinFase();
  if (document.getElementById("jor-svg") && document.querySelector("#view-jornada.active")) {
    jPintarCentro(); jPintarAguja();
    /* Cada cuarto de hora puede cambiar el bloque de «ahora». */
    const cuarto = Math.floor(jAhora() / 15);
    if (cuarto !== jCuartoAntes) {
      jCuartoAntes = cuarto;
      jPintarLista();
      if (!jDatos().run || jDatos().run.fase === "listo") jPintarControles();
    }
  }
  jPintarPildora();
}

/* ---------- Avisos ----------
   El sonido y la vibración salen con la app abierta. Con la pestaña de fondo,
   el aviso del sistema, si se dio permiso. Con la app CERRADA no hay nada que
   pueda avisar desde una página web: eso pide avisos desde el servidor, y
   llegará en otra versión. */
let jCtx = null;
function jAudio() {
  try { jCtx = jCtx || new (window.AudioContext || window.webkitAudioContext)(); jCtx.resume(); } catch (e) { /* sin sonido */ }
}
function jCampana() {
  if (!jCtx || !jDatos().cfg.sonido) return;
  [[660, 0], [880, .18], [990, .36]].forEach(([f, t]) => {
    const o = jCtx.createOscillator(), g = jCtx.createGain(), t0 = jCtx.currentTime + t;
    o.type = "sine"; o.frequency.value = f;
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.18, t0 + .02); g.gain.exponentialRampToValueAtTime(.001, t0 + .9);
    o.connect(g).connect(jCtx.destination); o.start(t0); o.stop(t0 + 1);
  });
}
function jAvisar(titulo, texto) {
  jCampana();
  try { if (navigator.vibrate) navigator.vibrate([180, 90, 180]); } catch (e) { /* sin vibración */ }
  const cfg = jDatos().cfg;
  if (document.hidden && cfg.avisos && "Notification" in window && Notification.permission === "granted") {
    const op = { body: texto, tag: "jornada", icon: "icon-192.png", badge: "icon-192.png" };
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(r => r.showNotification(titulo, op)).catch(() => { try { new Notification(titulo, op); } catch (e) { /* nada */ } });
    } else { try { new Notification(titulo, op); } catch (e) { /* nada */ } }
  } else {
    toast(titulo + " · " + texto, "logro");
  }
}

/* ---------- Las hojas ---------- */
let jHoja = null, jEdit = null, jQuitando = false;
function jornadaHojaAbierta() { return !!jHoja; }
function jAbrirHoja(tipo) {
  jHoja = tipo; jQuitando = false;
  if (tipo === "cierre") { jRespuesta = "no"; jAnimo = 2; }
  jPintarHoja();
  document.getElementById("jornada-modal").classList.add("show");
}
/* `desdeFuera` es tocar el velo o el gesto de atrás: el cierre de un tramo no
   se va así, porque se perdería lo que acabas de hacer. */
function cerrarHojaJornada(desdeFuera) {
  if (!jHoja) return;
  if (desdeFuera && jHoja === "cierre") return;
  jHoja = null;
  const m = document.getElementById("jornada-modal");
  if (m) m.classList.remove("show");
}
function jAbrirBloque(id) {
  const b = jDatos().bloques.find(x => x.id === id);
  if (b) jEdit = { id: b.id, sueno: !!b.sueno, ref: b.ref || null, ini: b.ini, fin: b.fin };
  else {
    const ini = (Math.ceil(jAhora() / 15) * 15) % J_DIA;
    const g = jCandidatos()[0];
    jEdit = { id: null, ref: g ? { t: g[0], id: g[2][0].id } : null, ini, fin: (ini + 60) % J_DIA };
  }
  jAbrirHoja("bloque");
}

function jOpcion(v, tile, titulo, sub, sel, act) {
  return `<button type="button" class="jor-op" data-act="${act}" data-v="${escapeAttr(v)}" aria-pressed="${sel}">${tile}<span><span class="jor-op-t">${titulo}</span>${sub ? `<small>${sub}</small>` : ""}</span><span class="jor-ok">${sel ? "✓" : ""}</span></button>`;
}
function jTileDe(o) {
  return `<span class="jor-tile chico" style="background:${o.color ? pinta(o.color) : "var(--jor-libre)"}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${jIconoDe(o)}</svg></span>`;
}
function jListaOpciones(act, actual) {
  return jCandidatos().map(([t, rot, lista]) =>
    `<h4 class="jor-grupo">${rot}</h4>` +
    lista.map(o => jOpcion(t + ":" + o.id, jTileDe(o), escapeHtml(o.name), "", !!actual && actual.t === t && actual.id === o.id, act)).join("")
  ).join("");
}

function jPintarHoja() {
  const H = document.getElementById("jornada-hoja");
  if (!H) return;
  const j = jDatos(), cfg = j.cfg;
  const sw = (k, lbl, sub) => `<div class="jor-fila-aj"><span>${lbl}${sub ? `<small>${sub}</small>` : ""}</span><button type="button" class="jor-sw" role="switch" aria-checked="${!!cfg[k]}" data-act="sw" data-v="${k}" aria-label="${escapeAttr(lbl)}"></button></div>`;
  const paso = (act, k, lbl, val) => `<div class="jor-fila-aj"><span>${lbl}</span><span class="jor-paso"><button type="button" data-act="${act}" data-k="${k}" data-d="-1" aria-label="${escapeAttr(tx("Menos"))}">−</button><output>${val}</output><button type="button" data-act="${act}" data-k="${k}" data-d="1" aria-label="${escapeAttr(tx("Más"))}">+</button></span></div>`;
  let h = "";
  if (jHoja === "ritmo") {
    const libre = cfg.preset === "libre";
    h = `<div class="jor-hoja-cab"><span class="jor-ceja">${tx("Ritmo")}</span><h3>${tx("¿Cómo quieres ir?")}</h3></div>
      <div class="jor-seg">${[["clasico", tx("Clásico")], ["profundo", tx("Profundo")], ["libre", tx("Libre")]].map(([k, n]) => `<button type="button" data-act="preset" data-v="${k}" aria-pressed="${cfg.preset === k}">${n}</button>`).join("")}</div>
      ${libre ? `<p class="jor-nota">${tx("Cuenta hacia arriba hasta que tú lo pares. El reloj se voltea solo cada 25 minutos.")}</p>` : `<div class="jor-filas">
        ${paso("paso", "foco", tx("Foco"), T`${cfg.foco} min`)}
        ${paso("paso", "desc", tx("Descanso"), T`${cfg.desc} min`)}
        ${paso("paso", "ciclos", tx("Tramos"), cfg.ciclos)}
      </div>`}
      <div class="jor-filas">
        ${sw("auto", tx("Seguir solo"), tx("El siguiente tramo arranca sin tocar nada"))}
        ${sw("sonido", tx("Sonido"))}
        ${sw("avisos", tx("Avisarme en otra pestaña"), tx("Con la app abierta en segundo plano"))}
      </div>
      <button type="button" class="btn btn-primary btn-block" data-act="cerrar">${tx("Listo")}</button>`;
  } else if (jHoja === "enque") {
    const b = jBloqueEn(jAhora()), del = b && !b.sueno ? jRef(b.ref) : null;
    const reloj = `<span class="jor-tile chico sin"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">${J_ARENA}</svg></span>`;
    h = `<div class="jor-hoja-cab"><span class="jor-ceja">${tx("Enfocar en")}</span><h3>${tx("¿En qué?")}</h3></div>
      <div class="jor-ops">
        ${jOpcion("auto", reloj, tx("Lo que toca ahora"), del ? escapeHtml(del.nombre) : tx("No hay nada a esta hora"), jEleccion === undefined, "elegir")}
        ${jListaOpciones("elegir", jEleccion || null)}
        ${jOpcion("none", reloj, tx("Sin atar"), tx("Solo queda en tu registro"), jEleccion === null, "elegir")}
      </div>`;
  } else if (jHoja === "bloque") {
    const e = jEdit, d = ((e.fin - e.ini + J_DIA) % J_DIA) || J_DIA;
    const otro = jChoca(e.ini, e.fin, e.id);
    const r = jRef(e.ref);
    const nombre = e.sueno ? tx("Dormir") : (r ? r.nombre : tx("Bloque libre"));
    h = `<div class="jor-hoja-cab"><span class="jor-ceja">${e.id ? tx("Bloque") : tx("Nuevo bloque")}</span><h3>${escapeHtml(nombre)}</h3></div>
      <div class="jor-filas">
        ${paso("b-hora", "ini", tx("Empieza"), jH12(e.ini))}
        ${paso("b-hora", "fin", tx("Acaba"), jH12(e.fin))}
      </div>
      ${otro ? `<p class="jor-nota error">${escapeHtml(T`Se encima con «${jNombreBloque(otro)}». Muévelo o acórtalo.`)}</p>` : `<p class="jor-nota">${escapeHtml(T`Dura ${jFmtDur(d)}.`)}</p>`}
      ${e.sueno ? "" : `<div class="jor-ops alto">${jListaOpciones("b-ref", e.ref)}</div>`}
      <button type="button" class="btn btn-primary btn-block" data-act="b-guardar" ${otro || (!e.sueno && !r) ? "disabled" : ""}>${tx("Guardar")}</button>
      ${e.id ? `<button type="button" class="btn btn-danger-ghost btn-block" data-act="b-quitar">${jQuitando ? tx("Toca otra vez para quitarlo") : tx("Quitar de la rueda")}</button>` : ""}`;
  } else if (jHoja === "cierre") {
    const run = j.run;
    if (!run || run.fase !== "cierre") { cerrarHojaJornada(); return; }
    const r = jRef(run.ref);
    const ef = jEfecto(run.ref, run.min, jRespuesta === "si");
    const pregunta = r && r.t === "mision" && !missionDone(r.o, todayKey());
    const ultimo = !run.libre && run.tramo >= cfg.ciclos;
    h = `<div class="jor-hoja-cab"><span class="jor-ceja">${run.libre ? tx("Enfoque libre") : escapeHtml(T`Tramo ${run.tramo} de ${cfg.ciclos}`)}</span><h3>${escapeHtml(T`${run.min} min de foco`)}</h3></div>
      <div class="jor-efecto"><svg viewBox="0 0 24 24"><path d="M5 17l5-5 3 3 6-7"/><path d="M15 8h4v4"/></svg><div>${escapeHtml(ef.t)}${ef.s ? `<small>${escapeHtml(ef.s)}</small>` : ""}</div></div>
      ${pregunta ? `<div class="jor-grupo-p"><p>${tx("¿La terminaste?")}</p><div class="jor-seg"><button type="button" data-act="sino" data-v="si" aria-pressed="${jRespuesta === "si"}">${tx("Sí")}</button><button type="button" data-act="sino" data-v="no" aria-pressed="${jRespuesta === "no"}">${tx("Todavía no")}</button></div></div>` : ""}
      <div class="jor-grupo-p"><p>${tx("¿Cómo te fue?")}</p><div class="jor-animo">${[[1, tx("Disperso")], [2, tx("Bien")], [3, tx("Muy enfocado")]].map(([v, t]) => `<button type="button" data-act="animo" data-v="${v}" aria-pressed="${jAnimo === v}"><span class="d">${[1, 2, 3].map(i => `<i class="${i <= v ? "on" : ""}"></i>`).join("")}</span>${t}</button>`).join("")}</div></div>
      <button type="button" class="btn btn-primary btn-block" data-act="guardar" data-v="1">${run.libre ? tx("Guardar") : ultimo ? tx("Guardar y terminar") : escapeHtml(T`Descansar ${cfg.desc} min`)}</button>
      ${run.libre || ultimo ? "" : `<button type="button" class="btn btn-ghost btn-block" data-act="guardar" data-v="0">${tx("Seguir sin descanso")}</button>`}`;
  }
  H.innerHTML = h;
}

function jClickHoja(e) {
  const b = e.target.closest("[data-act]");
  if (!b || b.disabled) return;
  const a = b.dataset.act, v = b.dataset.v, j = jDatos(), cfg = j.cfg;
  if (a === "cerrar") { cerrarHojaJornada(); jPintar(); return; }
  if (a === "preset") {
    cfg.preset = v;
    if (J_PRESETS[v]) Object.assign(cfg, J_PRESETS[v]);
    if (j.run && j.run.fase === "listo") j.run.dur = cfg.foco * J_MS;
    save();
  }
  if (a === "paso") {
    const k = b.dataset.k, salto = { foco: 5, desc: 1, ciclos: 1 }[k], lim = { foco: [10, 90], desc: [1, 20], ciclos: [1, 8] }[k];
    cfg[k] = Math.min(lim[1], Math.max(lim[0], cfg[k] + salto * Number(b.dataset.d)));
    if (j.run && j.run.fase === "listo") j.run.dur = cfg.foco * J_MS;
    save();
  }
  if (a === "sw") {
    cfg[v] = !cfg[v];
    /* El permiso se pide al ENCENDER el interruptor, que es un gesto tuyo: pedirlo
       al abrir la pantalla es el cuadro que todo el mundo cierra sin leer. */
    if (v === "avisos" && cfg.avisos && "Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission().then(p => {
        if (p !== "granted") { cfg.avisos = false; save(); jPintarHoja(); toast(tx("Sin permiso para avisar: el navegador lo tiene bloqueado"), "atencion"); }
      });
    }
    save();
  }
  if (a === "elegir") {
    jEleccion = v === "auto" ? undefined : v === "none" ? null : { t: v.split(":")[0], id: v.split(":").slice(1).join(":") };
    cerrarHojaJornada(); jPintar(); return;
  }
  if (a === "b-ref") jEdit.ref = { t: v.split(":")[0], id: v.split(":").slice(1).join(":") };
  if (a === "b-hora") {
    const k = b.dataset.k, n = (jEdit[k] + 15 * Number(b.dataset.d) + J_DIA) % J_DIA;
    const d = k === "ini" ? (jEdit.fin - n + J_DIA) % J_DIA : (n - jEdit.ini + J_DIA) % J_DIA;
    if (d >= 15) jEdit[k] = n;
  }
  if (a === "b-guardar") {
    if (jEdit.id) {
      const x = j.bloques.find(y => y.id === jEdit.id);
      if (x) Object.assign(x, { ref: jEdit.sueno ? undefined : jEdit.ref, ini: jEdit.ini, fin: jEdit.fin });
    } else {
      const n = { id: uid(), ref: jEdit.ref, ini: jEdit.ini, fin: jEdit.fin };
      j.bloques.push(n); jSelId = n.id;
    }
    save(); cerrarHojaJornada(); jPintar(); return;
  }
  if (a === "b-quitar") {
    if (!jQuitando) { jQuitando = true; jPintarHoja(); return; }
    j.bloques = j.bloques.filter(x => x.id !== jEdit.id);
    jSelId = null; save(); cerrarHojaJornada(); jPintar(); return;
  }
  if (a === "sino") jRespuesta = v;
  if (a === "animo") jAnimo = Number(v);
  if (a === "guardar") { jGuardar(v === "1"); return; }
  jPintarHoja(); jPintarControles();
}

function jClickControles(e) {
  const btn = e.target.closest("button[data-a]");
  if (!btn || btn.disabled) return;
  const a = btn.dataset.a, j = jDatos();
  if (a === "enque") return jAbrirHoja("enque");
  if (a === "ritmo") return jAbrirHoja("ritmo");
  if (a === "nuevo") return jAbrirBloque(null);
  if (a === "iniciar") return jIniciar();
  if (!j.run) return;
  if (a === "pausa") jPausa();
  if (a === "terminar") jTerminarLibre();
  if (a === "abandonar") {
    if (!jConfirmando) { jConfirmando = true; btn.textContent = tx("Otra vez para abandonar"); btn.classList.add("seguro"); return; }
    jAbandonar();
  }
  if (a === "saltar") jSiguiente();
  if (a === "cierre") jAbrirHoja("cierre");
  if (a === "fin") { j.run = null; jEleccion = undefined; save(); jPintar(); }
}

function jClickLista(e) {
  const f = e.target.closest(".jor-fila");
  if (f) { jSelId = f.dataset.id; jPintarRueda(); jPintarLista(); jAbrirBloque(f.dataset.id); return; }
  const ac = e.target.closest("[data-acomodar]");
  if (ac) jAcomodar("mision", ac.dataset.acomodar);
}

/* ---------- El enlace que la enciende ---------- */
function jornadaDesdeEnlace() {
  let q = null;
  try { q = new URLSearchParams(location.search).get("jornada"); } catch (e) { return; }
  if (q !== "1" && q !== "0") return;
  state.ui = state.ui || {};
  state.ui.jornada = q === "1";
  save();
  /* Se quita de la dirección para que recargar no lo vuelva a aplicar encima
     de lo que hayas cambiado después en Ajustes. */
  try {
    const u = new URL(location.href);
    u.searchParams.delete("jornada");
    history.replaceState(history.state, "", u.pathname + u.search + u.hash);
  } catch (e) { /* se queda en la dirección, sin más */ }
  setTimeout(() => toast(q === "1" ? tx("Jornada encendida: ya está en tu menú") : tx("Jornada apagada"), q === "1" ? "hecho" : "deshecho"), 900);
}

/* Se llama una vez desde el arranque. Los clics van por delegación sobre
   contenedores que no se rehacen, así que no hay que volver a engancharlos. */
function iniciarRelojJornada() {
  const hoja = document.getElementById("jornada-hoja");
  if (hoja) hoja.addEventListener("click", jClickHoja);
  const cont = document.getElementById("jornada-content");
  if (cont) {
    cont.addEventListener("click", e => {
      if (e.target.closest("#jor-controles")) jClickControles(e);
      else if (e.target.closest(".jor-lista")) jClickLista(e);
    });
  }
  setInterval(jPaso, 250);
  document.addEventListener("visibilitychange", jPaso);
}
