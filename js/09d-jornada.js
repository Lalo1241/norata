/* ================= Pomodoro: el día en una rueda (0.7.101 en adelante) =====
   Una rueda de 24 horas donde se acomoda CUÁNDO se hace cada cosa, con un
   reloj de arena en el centro que lleva los tramos de enfoque (la técnica
   pomodoro). Al acabar un tramo apunta el avance en el módulo que toque.

   ---- Se ve «Pomodoro» y por dentro se llama `jornada` ----
   Nació llamándose Jornada (0.7.101) y Eduardo lo renombró en la 0.7.102, con
   un tomate de icono. Los identificadores internos NO se cambiaron a
   propósito —`state.jornada`, `#view-jornada`, `?jornada=1`—: son los que ya
   guardan los datos de quien lo está probando, y renombrarlos los dejaría
   huérfanos. Es la misma decisión que se tomó con `mainquest-v1` cuando la app
   cambió de nombre dos veces. `?pomodoro=1` vale igual que `?jornada=1`.

   Nació de dos bocetos del 10 sep 2026. El primero ponía un botón de «Enfocar»
   en cada misión y cada habilidad, y Eduardo lo paró: «vas a saturar de
   botones la interfaz». Lo que él se imaginaba era un LUGAR para planear el
   día, como las apps de bloques de tiempo, y con los controles de otra que
   había visto: una sola cosa grande, un botón de Iniciar y casi nada de texto.

   ---- Encendido para todos desde la 0.7.103 ----
   Nació apagado y detrás de `?jornada=1`, con la marca en `state.ui.jornada`.
   Eduardo pidió que saliera en el live general porque «no siempre sale», y
   la causa no era el enlace: `state.ui` viaja ENTERO desde el dispositivo que
   guardó más reciente, así que otro dispositivo sin la marca lo apagaba en
   silencio. Ahora es un módulo como los otros cuatro —se apaga en Ajustes y
   solo se guarda el APAGADO, en `modulosOff`— y la marca vieja se convierte
   una vez (`jMigrarInterruptor`). Los enlaces siguen valiendo.

   ---- Dos maneras de usarlo (0.7.104) ----
   «Mi día» es la rueda. «Solo enfocar» es un reloj de un toque: nada que
   vincular ni que configurar —25, 50 o libre, y ya—, para cuando lo único que
   hace falta es hiperfoco. Lo pidió Eduardo con esas palabras: «algo mucho más
   lite donde no andes buscando configuraciones complejas». Comparten el mismo
   reloj (`state.jornada.run`, con `lite: true`), así que la píldora y el
   informe los cuentan igual.

   ---- Dos clases de bloque: los de enfoque y los de descanso ----
   Dormir con tramos de 25 minutos no tiene sentido (lo dijo Eduardo en la
   primera prueba), y comer o ir en camino tampoco. Un bloque de descanso
   (`b.descanso`: dormir, comida o traslado) no ofrece Iniciar: el centro
   enseña cuánto le queda, y Dormir apunta a qué hora te dormiste y a qué hora
   despertaste. Media hora antes de dormir, un aviso. Comer y Traslado llegan
   sugeridos una vez y se borran como cualquier bloque.

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
   manual. Lo que da, lo da A NOMBRE DEL POMODORO (`fuente: "Pomodoro · …"`),
   que el informe cuenta aparte; la misión igual queda cumplida en Misiones.
   Los talentos y los encargos no guardan tiempo en ningún campo, así que si
   entrenan una habilidad, la practica esa; si no, queda en el registro del
   Pomodoro, que es lo que lee su informe (`metricasPomodoro`,
   js/10f-informes.js). */

const J_DIA = 1440, J_MS = 60000;
const J_C = 160, J_RO = 126, J_RI = 94, J_RM = 110;
const J_PRESETS = { clasico: { foco: 25, desc: 5, ciclos: 4 }, profundo: { foco: 50, desc: 10, ciclos: 2 } };
/* Lo que se guarda del registro. Eran 300, que a ocho tramos al día son cinco
   semanas: el informe del año se quedaba sin historia. Cada entrada pesa poco
   más de cien bytes. */
const J_REG_MAX = 2000;
const J_LUNA = '<path d="M19.5 14.5A7.5 7.5 0 019.5 4.5a7.5 7.5 0 1010 10z"/>';
const J_ARENA = '<path d="M7 3h10M7 21h10M8 3c0 5 8 6.5 8 9s-8 4-8 9M16 3c0 5-8 6.5-8 9s8 4 8 9"/>';
/* Los bloques de descanso. Los rótulos se traducen donde se DIBUJAN: una tabla
   de nivel superior se evalúa una vez al cargar y congelaría el idioma. */
const J_DESCANSOS = {
  dormir:   { nombre: "Dormir",   fase: "Hora de dormir", icono: J_LUNA },
  comida:   { nombre: "Comer",    fase: "Hora de comer",  icono: '<path d="M7 3v7a2 2 0 004 0V3M9 12v9M16.5 3C15 4 14 6.2 14 9s1 3.5 2.5 3.5V21"/>' },
  traslado: { nombre: "Traslado", fase: "En camino",      icono: '<path d="M5.5 16.5V8a3 3 0 013-3h7a3 3 0 013 3v8.5M5.5 12h13M5.5 16.5h13M7.5 16.5V19M16.5 16.5V19"/>' }
};

function jornadaEncendida() { return typeof moduloOn === "function" ? moduloOn("jornada") : true; }

/* La marca de la 0.7.101-0.7.102 pasa al sistema de todos los módulos: quien
   lo había APAGADO a propósito lo sigue teniendo apagado; a los demás no se
   les guarda nada, porque encendido es lo de partida. */
function jMigrarInterruptor() {
  if (!state.ui || state.ui.jornada === undefined) return;
  const off = new Set(state.ui.modulosOff || []);
  if (state.ui.jornada === false) off.add("jornada");
  state.ui.modulosOff = [...off];
  delete state.ui.jornada;
  save();
}

/* Los datos se siembran al PEDIRLOS, no al cargar: quien nunca abra el
   Pomodoro no lleva ni una llave de más en su perfil. */
function jDatos() {
  if (!state.jornada || typeof state.jornada !== "object") state.jornada = {};
  const j = state.jornada;
  if (!Array.isArray(j.bloques)) j.bloques = [{ id: uid(), descanso: "dormir", ini: 23 * 60, fin: 7 * 60 }];
  /* La 0.7.101 marcaba el de dormir con `sueno: true`; desde la 0.7.102 los
     descansos son tres y van por nombre. */
  j.bloques.forEach(b => { if (b.sueno) { b.descanso = "dormir"; delete b.sueno; } });
  /* Comer y Traslado llegan UNA vez, sugeridos, y solo donde caben. Si alguien
     los borra no vuelven: por eso la marca, y no «si no existen». */
  if (!j.sugeridos) {
    j.sugeridos = true;
    [["comida", 14 * 60, 15 * 60], ["traslado", 8 * 60, 8 * 60 + 30]].forEach(([d, ini, fin]) => {
      if (!jChocaEn(j.bloques, ini, fin, null)) j.bloques.push({ id: uid(), descanso: d, ini, fin });
    });
  }
  if (!j.cfg || typeof j.cfg !== "object") j.cfg = {};
  j.cfg = Object.assign({ preset: "clasico", foco: 25, desc: 5, ciclos: 4, auto: false, sonido: true, avisos: false, lite: 25 }, j.cfg);
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
/* La hora de una marca de tiempo, en minutos del día del perfil. */
function jMinDe(epoch) {
  const p = tzParts(new Date(epoch), { hour: "2-digit", minute: "2-digit", hour12: false });
  const g = t => +((p.find(x => x.type === t) || {}).value || 0);
  return (g("hour") % 24) * 60 + g("minute");
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
/* Horas y minutos para lo que dura más que un tramo: la noche, la comida. */
function jHm(min) {
  min = Math.max(0, Math.round(min));
  return Math.floor(min / 60) + ":" + String(min % 60).padStart(2, "0");
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
function jIconoDe(o) { const n = o && o.icon; return ICONS[n] || ICONS[EMOJI_TO_ICON[n]] || ICONS.star; }
function jNombreBloque(b) {
  if (b.descanso) return tx((J_DESCANSOS[b.descanso] || J_DESCANSOS.dormir).nombre);
  const r = jRef(b.ref);
  return r ? r.nombre : tx("Bloque libre");
}
/* El color PROPIO del bloque manda (0.7.103.1): los tres descansos salían del
   mismo gris y en la rueda no se distinguía Comer de Dormir. Lo pidió Eduardo.
   Sin color propio, sigue siendo el de lo que enfoca, o el gris del descanso. */
function jColorBloque(b) {
  if (b.color) return pinta(b.color);
  if (b.descanso) return b.descanso === "dormir" ? "var(--jor-sueno)" : "var(--jor-descanso)";
  const r = jRef(b.ref);
  return r && r.o.color ? pinta(r.o.color) : "var(--jor-libre)";
}
function jIconoBloque(b) {
  if (b.descanso) return (J_DESCANSOS[b.descanso] || J_DESCANSOS.dormir).icono;
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

/* ---------- Mi día o Solo enfocar ----------
   Es preferencia de ESTE dispositivo y no dato del usuario: vive en su propia
   llave de localStorage y nunca en `state`, como el plegado de la barra. */
function jModo() {
  try { return localStorage.getItem("norata-pomodoro-modo") === "lite" ? "lite" : "dia"; } catch (e) { return "dia"; }
}
function jPonerModo(m) {
  try { localStorage.setItem("norata-pomodoro-modo", m); } catch (e) { /* se queda en este rato */ }
  renderJornada();
}

/* ---------- Qué se enfoca si tocas Iniciar ---------- */
let jEleccion;   // undefined: lo decide el bloque de ahora · null: sin vincular · {t,id}: lo que elegiste
/* «Enfocar de todos modos» dentro de un descanso: vale para ESE bloque y se
   olvida al salir de él, para que la noche siguiente vuelva a ser noche. */
let jForzado = null;
function jDescansoAhora() {
  const b = jBloqueEn(jAhora());
  return b && b.descanso && jForzado !== b.id ? b : null;
}
function jObjetivo() {
  const j = jDatos();
  if (j.run) return j.run.ref;
  if (jEleccion !== undefined) return jEleccion;
  const b = jBloqueEn(jAhora());
  return b && !b.descanso && jRef(b.ref) ? b.ref : null;
}

/* ---------- El reloj ---------- */
const jTrans = run => !run ? 0 : (run.acum || 0) + (run.seg ? Date.now() - run.seg : 0);

function jIniciar() {
  jAudio();
  const j = jDatos(), c = j.cfg, libre = c.preset === "libre";
  let tramo = 1, ref = jObjetivo(), bloque = null;
  if (j.run && j.run.fase === "listo" && !j.run.lite) { tramo = j.run.tramo; ref = j.run.ref; bloque = j.run.bloque; }
  else {
    const b = jBloqueEn(jAhora());
    bloque = b && !b.descanso && jEleccion === undefined ? b.id : null;
  }
  j.run = { fase: "foco", tramo, dur: libre ? null : c.foco * J_MS, acum: 0, seg: Date.now(), pausas: 0, libre, ref: ref || null, bloque };
  save(); jPintar();
}
function jPausa() {
  const run = jDatos().run; if (!run || run.fase !== "foco") return;
  if (run.seg) { run.acum = jTrans(run); run.seg = null; run.pausas++; }
  else run.seg = Date.now();
  save(); jPintarControles(); jPintarCentro(); jPintarPildora();
}
function jSiguiente() {
  const j = jDatos(), run = j.run;
  Object.assign(run, { fase: "listo", tramo: run.tramo + 1, dur: j.cfg.foco * J_MS, acum: 0, seg: null, pausas: 0 });
  if (j.cfg.auto) jIniciar();
  else { save(); jPintarControles(); }
}
function jFinFase() {
  const j = jDatos(), run = j.run;
  if (run.lite) {
    if (run.fase === "foco") {
      const min = Math.round(run.dur / J_MS);
      jApuntarLite(min, run.pausas);
      Object.assign(run, { fase: "listo", min, acum: 0, seg: null });
      save();
      jAvisar(tx("Listo"), T`${min} min de hiperfoco.`);
    } else if (run.fase === "descanso") {
      j.run = null;
      save();
      jAvisar(tx("Se acabó el descanso"), tx("Cuando quieras, otro tramo."));
    }
    jPintar();
    return;
  }
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
/* ---- Abandonar es UN toque, y se puede deshacer ----
   En la 0.7.101 pedía dos toques («Otra vez para abandonar»), y el rótulo ni
   cabía en el botón: se partía en dos líneas. Eduardo pidió quitar la segunda
   confirmación. Lo que protege del toque sin querer ya no es preguntar, es el
   «Deshacer» del aviso: devuelve el tramo tal cual, en pausa. */
let jDeshacer = null;
function jAbandonar() {
  const j = jDatos(), run = j.run; if (!run) return;
  const r = jRef(run.ref);
  const entrada = { id: uid(), fecha: todayKey(), hora: hhmmNow(), ref: run.ref, nombre: r ? r.nombre : tx("Sin vincular"),
    min: Math.floor(jTrans(run) / J_MS), pausas: run.pausas, animo: 0, res: tx("Abandonado · sin XP"), abandono: true, bloque: run.bloque || null };
  j.registro.unshift(entrada);
  jDeshacer = { run: JSON.parse(JSON.stringify(run)), id: entrada.id, en: Date.now() };
  j.run = null; jEleccion = undefined;
  save(); jPintar();
  toast(tx("Tramo abandonado"), "deshecho", { label: tx("Deshacer"), onclick: "jDeshacerAbandono()" });
}
function jDeshacerAbandono() {
  const d = jDeshacer, j = jDatos();
  if (!d || j.run) return;
  jDeshacer = null;
  j.registro = j.registro.filter(x => x.id !== d.id);
  /* Vuelve en PAUSA: el rato que pasaste decidiendo no es foco. */
  const run = d.run;
  if (run.seg) { run.acum = (run.acum || 0) + (d.en - run.seg); run.seg = null; }
  j.run = run;
  save(); jPintar();
  toast(tx("El tramo sigue, en pausa"), "hecho");
}

/* ---------- Solo enfocar ---------- */
function jIniciarLite() {
  jAudio();
  const j = jDatos(), min = Number(j.cfg.lite) || 0;
  const tramo = j.run && j.run.lite ? (j.run.tramo || 0) + 1 : 1;
  j.run = { fase: "foco", lite: true, tramo, dur: min ? min * J_MS : null, libre: !min, acum: 0, seg: Date.now(), pausas: 0, ref: null, bloque: null };
  save(); jPintar();
}
/* Lo que se hizo en modo rápido queda en el registro sin vincular: no da XP
   —no está atado a nada que la reciba— pero cuenta como foco en el informe. */
function jApuntarLite(min, pausas) {
  if (min < 1) return;
  const j = jDatos();
  j.registro.unshift({ id: uid(), fecha: todayKey(), hora: hhmmNow(), ref: null, nombre: tx("Hiperfoco"),
    min, pausas: pausas || 0, animo: 0, res: tx("Hiperfoco"), lite: true });
  j.registro = j.registro.slice(0, J_REG_MAX);
}
/* Parar guarda lo hecho y ya: aquí no hay «abandonar», porque no hay nada que
   cumplir. Diez minutos de hiperfoco son diez minutos. */
function jPararLite() {
  const j = jDatos(), run = j.run; if (!run) return;
  const min = run.fase === "foco" ? Math.floor(jTrans(run) / J_MS) : 0;
  if (run.fase === "foco") jApuntarLite(min, run.pausas);
  j.run = null;
  save(); jPintar();
  if (run.fase === "foco") toast(min >= 1 ? T`${min} min de hiperfoco apuntados` : tx("Menos de un minuto: no queda apuntado"), min >= 1 ? "logro" : "calma");
}

/* ---------- Dormir y despertar ---------- */
function jBuenasNoches() {
  const j = jDatos(), b = jBloqueEn(jAhora());
  j.dormido = { inicio: Date.now(), bloque: b && b.descanso === "dormir" ? b.id : null };
  save(); jPintar();
  toast(tx("Que descanses. Al despertar, toca «Buenos días»."), "calma");
}
function jBuenosDias() {
  const j = jDatos(), d = j.dormido;
  if (!d) return;
  const min = Math.max(1, Math.round((Date.now() - d.inicio) / J_MS));
  j.registro.unshift({ id: uid(), fecha: todayKey(), tipo: "sueno", inicio: d.inicio, fin: Date.now(), min, bloque: d.bloque });
  j.registro = j.registro.slice(0, J_REG_MAX);
  j.dormido = null;
  save(); jPintar();
  toast(T`Buenos días · dormiste ${jFmtDur(min)}`, "logro");
}
/* Media hora antes de dormir. Una vez por noche y por bloque: la marca lleva
   el día, así que mañana vuelve a avisar. */
function jAvisoSueno() {
  const j = jDatos();
  if (j.dormido) return;
  const m = jAhora(), hoy = todayKey();
  for (const b of j.bloques) {
    if (b.descanso !== "dormir") continue;
    const falta = (b.ini - m + J_DIA) % J_DIA;
    if (falta <= 0 || falta > 30) continue;
    const clave = hoy + "|" + b.id;
    if (j.avisoSueno === clave) continue;
    j.avisoSueno = clave;
    save();
    jAvisar(T`En ${Math.ceil(falta)} min toca dormir`, T`Tu bloque de dormir empieza a las ${jH12(b.ini)}.`);
  }
}

/* ---------- Lo planeado contra lo hecho (0.7.104) ----------
   La rueda es una plantilla que se repite cada día, así que «cuántos bloques
   tenía el martes» no se puede reconstruir después: si hoy la cambias, el
   martes pasado cambiaría con ella. Por eso se APUNTA, un número por día —los
   bloques de enfoque, sin los descansos— y el informe lo cruza con los bloques
   que de verdad tuvieron un tramo. Solo se guarda cuando el número cambia. */
function jApuntarPlan() {
  const j = jDatos(), hoy = todayKey();
  const n = j.bloques.filter(b => !b.descanso).length;
  if (!j.planes || typeof j.planes !== "object") j.planes = {};
  if (j.planes[hoy] === n) return;
  j.planes[hoy] = n;
  const ks = Object.keys(j.planes).sort();
  while (ks.length > 400) delete j.planes[ks.shift()];
  save();
}
function jPlanDeHoy() {
  const j = jDatos(), hoy = todayKey();
  const enfoque = j.bloques.filter(b => !b.descanso);
  const conFoco = new Set();
  j.registro.forEach(r => { if (r.fecha === hoy && r.bloque && !r.abandono && r.tipo !== "sueno") conFoco.add(r.bloque); });
  return { plan: enfoque.length, hechos: enfoque.filter(b => conFoco.has(b.id)).length };
}

/* ---------- Lo que pasa al guardar un tramo ---------- */
/* La tarifa del registro manual (`PRACTICAS`, js/06-detalle.js): 40 XP la hora
   y un extra pequeño por sostenerlo. Un tramo de 25 minutos da 17. */
const jXp = min => min <= 60 ? Math.round(min * 40 / 60) : Math.round(40 + (min - 60) * 45 / 60);
const jNivelPractica = min => min < 45 ? "suave" : min < 105 ? "moderada" : "intensiva";
/* El origen que se guarda en el historial de la habilidad. SIN traducir, a
   propósito: `familiaDeFuente` lo reconoce por cómo empieza, y en inglés
   «Pomodoro» se escribe igual. */
const jFuente = nombre => "Pomodoro · " + nombre;

function jEfecto(ref, min, terminada) {
  const r = jRef(ref);
  if (!r) return { t: tx("Queda en tu registro"), s: tx("Sin tocar ningún módulo.") };
  if (r.t === "mision") {
    const m = r.o, hoy = todayKey();
    if (missionDone(m, hoy)) return { t: T`${min} min de foco en «${m.name}»`, s: tx("La misión ya estaba cumplida hoy.") };
    if (terminada) {
      /* Se cumple en Misiones —cuenta para la racha y su informe— y su XP va
         a nombre del Pomodoro. Lo pidió Eduardo así: que se tache como
         terminada y que el mérito sea del Pomodoro. Y solo si lo confirmaste:
         que se acabe el tiempo no quiere decir que se acabara la actividad. */
      return {
        t: tx("Misión cumplida"),
        s: m.skillId && m.xp ? T`Y su habilidad recibe ${m.xp} XP, a nombre del Pomodoro.` : T`Con ${min} min de foco.`,
        propio: true, terminada: true,
        hacer: () => logMission(m.id, missionTarget(m) - missionCount(m, hoy), { fuente: jFuente(m.name) })
      };
    }
    return { t: T`${min} min de foco apuntados`, s: tx("La misión sigue abierta.") };
  }
  const s = r.t === "habilidad" ? r.o : (r.o.skillId ? (state.skills || []).find(x => x.id === r.o.skillId) : null);
  if (!s) return { t: T`${min} min de foco apuntados`, s: tx("Queda en tu registro del Pomodoro.") };
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
    hacer: () => addXp(s, xp, T`Enfoque: ${r.nombre}`, jFuente(r.nombre), { min: cuenta, nivel: jNivelPractica(cuenta) })
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
  j.registro.unshift({ id: uid(), fecha: todayKey(), hora: hhmmNow(), ref: run.ref, nombre: r ? r.nombre : tx("Sin vincular"),
    min: run.min, pausas: run.pausas, animo: jAnimo, res: ef.t, bloque: run.bloque || null, terminada: !!ef.terminada });
  j.registro = j.registro.slice(0, J_REG_MAX);
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
      h += `<svg class="jor-blq-ic${b.descanso && !b.color ? " descanso" : ""}" x="${x - 8}" y="${y - 8}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${jIconoBloque(b)}</svg>`;
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
function jChocaEn(bloques, ini, fin, exceptoId) {
  const t = { ini, fin };
  return bloques.find(o => o.id !== exceptoId && (jDentro(o, ini) || jDentro(t, o.ini))) || null;
}
function jChoca(ini, fin, exceptoId) { return jChocaEn(jDatos().bloques, ini, fin, exceptoId); }
/* Acomodar: lo pone en el primer hueco libre desde ahora, de una hora si cabe. */
function jAcomodar(t, id) {
  const desde = Math.ceil(jAhora() / 15) * 15;
  for (const d of [60, 45, 30, 15]) {
    for (let s = 0; s < J_DIA; s += 15) {
      const ini = (desde + s) % J_DIA, fin = (ini + d) % J_DIA;
      if (!jChoca(ini, fin, null)) {
        const b = { id: uid(), ref: { t, id }, ini, fin };
        jDatos().bloques.push(b); jSelId = b.id;
        save(); jApuntarPlan(); jPintar();
        return;
      }
    }
  }
  toast(tx("La rueda está llena: quita o acorta un bloque"), "atencion");
}

/* ---------- La pantalla ---------- */
function jRelojHTML() {
  return `
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
        <rect class="jor-madera" x="14" y="1" width="132" height="21" rx="7"/><rect class="jor-madera" x="14" y="202" width="132" height="21" rx="7"/>
      </g>
    </svg>`;
}
function renderJornada() {
  const cont = document.getElementById("jornada-content");
  if (!cont || !jornadaEncendida()) return;
  jDatos();
  const modo = jModo();
  const pestanas = `<div class="jor-modos" role="tablist" aria-label="${escapeAttr(tx("Cómo usar el Pomodoro"))}">
    ${[["dia", tx("Mi día")], ["lite", tx("Solo enfocar")]].map(([k, n]) =>
      `<button type="button" role="tab" data-modo="${k}" aria-selected="${modo === k}">${n}</button>`).join("")}
  </div>`;
  const numeros = `<div id="jor-tiempo">25:00</div><div id="jor-fase"></div><div id="jor-sub"></div>`;

  if (modo === "lite") {
    cont.innerHTML = pestanas + `
      <div class="jor-lite">
        ${jRelojHTML()}
        ${numeros}
        <div class="jor-controles" id="jor-controles"></div>
      </div>`;
  } else {
    cont.innerHTML = pestanas + `
      <div class="jor">
        <div class="jor-reloj">
          <div class="jor-rueda">
            <svg id="jor-svg" viewBox="0 0 320 320" role="img" aria-label="${escapeAttr(tx("Tu día en una rueda de 24 horas"))}">
              <g>${jBaseRueda()}</g><g id="jor-bloques-svg"></g>
              <g id="jor-aguja" class="jor-aguja"><line x1="${J_C}" y1="${J_C - J_RI + 6}" x2="${J_C}" y2="${J_C - J_RO - 9}"/><circle cx="${J_C}" cy="${J_C - J_RO - 9}" r="3.5"/></g>
              <g id="jor-asas"></g>
            </svg>
            <div class="jor-centro">${jRelojHTML()}${numeros}</div>
          </div>
          <div class="jor-controles" id="jor-controles"></div>
        </div>
        <div class="jor-lista">
          <h3 class="jor-rot">${tx("Hoy")}<span class="jor-rot-dato" id="jor-hoy-dato"></span></h3>
          <div class="jor-bloques" id="jor-lista-bloques"></div>
          <h3 class="jor-rot">${tx("Por acomodar")}</h3>
          <div class="jor-acomodar" id="jor-acomodar"></div>
          <p class="jor-como">${tx("Toca un bloque para elegirlo, arrastra sus puntas para cambiar la hora y arrástralo entero para moverlo. Tócalo otra vez para editarlo.")}</p>
          <button type="button" class="jor-enlace jor-al-informe" onclick="abrirInforme('pomodoro')">${tx("Ver el informe del Pomodoro")}</button>
        </div>
      </div>`;
    jEngancharRueda(document.getElementById("jor-svg"));
  }
  jArribaAntes = 1; jVolteando = false;
  jApuntarPlan();
  jPintar();
  jPintarAguja();
  const run = jDatos().run;
  if (run && run.fase === "cierre") jAbrirHoja("cierre");
}
function jPintar() {
  if (document.getElementById("jor-arena")) { jPintarRueda(); jPintarLista(); jPintarControles(); jPintarCentro(); }
  jPintarPildora();
}

function jPintarLista() {
  const el = document.getElementById("jor-lista-bloques");
  if (!el) return;
  const j = jDatos(), m = jAhora(), hoy = todayKey();
  const foco = {}, sueno = {};
  j.registro.forEach(r => {
    if (r.fecha !== hoy || !r.bloque) return;
    if (r.tipo === "sueno") { if (!sueno[r.bloque]) sueno[r.bloque] = r.min; }
    else if (!r.abandono) foco[r.bloque] = (foco[r.bloque] || 0) + r.min;
  });
  el.innerHTML = j.bloques.slice().sort((a, b) => a.ini - b.ini).map(b => {
    const extra = foco[b.id] ? " · " + T`${foco[b.id]} min de foco` : sueno[b.id] ? " · " + T`dormiste ${jFmtDur(sueno[b.id])}` : "";
    return `
    <button type="button" class="jor-fila${b.id === jSelId ? " sel" : ""}" data-id="${b.id}">
      <span class="jor-tile${b.descanso && !b.color ? " descanso" : ""}" style="background:${jColorBloque(b)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${jIconoBloque(b)}</svg></span>
      <span class="jor-fila-t"><b>${escapeHtml(jNombreBloque(b))}</b><span>${jRango(b)}${escapeHtml(extra)}</span></span>
      <span class="jor-fila-d">${jDentro(b, m) ? `<span class="jor-chip ahora">${tx("Ahora")}</span>` : ""}<span class="jor-chip">${jFmtDur(jDur(b))}</span></span>
    </button>`;
  }).join("");
  /* Lo planeado contra lo hecho, en el sitio donde se planea. */
  const dato = document.getElementById("jor-hoy-dato");
  if (dato) {
    const p = jPlanDeHoy();
    dato.textContent = p.plan ? T`${p.hechos} de ${p.plan} con foco` : "";
  }
  const puestas = new Set(j.bloques.filter(b => b.ref && b.ref.t === "mision").map(b => b.ref.id));
  const libres = (state.missions || []).filter(x => missionDueToday(x) && !missionDone(x, hoy) && !puestas.has(x.id));
  document.getElementById("jor-acomodar").innerHTML = libres.length
    ? libres.map(x => `<button type="button" data-acomodar="${x.id}"><span class="jor-punto" style="background:${pinta(x.color || "#9aa7b8")}"></span>${escapeHtml(x.name)}</button>`).join("")
    : `<p class="jor-vacio">${tx("Todas tus misiones de hoy ya tienen hora.")}</p>`;
}

const J_PLAY = '<svg class="lleno" viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg>';
const J_PAUSA = '<svg viewBox="0 0 24 24"><path d="M9 6v12M15 6v12"/></svg>';
const J_PARAR = '<svg viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="2"/></svg>';

/* Los controles de «Solo enfocar»: una duración, un botón, y nada más. */
function jControlesLite(run) {
  const cfg = jDatos().cfg;
  if (!run) {
    const ops = [[25, T`${25} min`], [50, T`${50} min`], [0, tx("Libre")]];
    return `<div class="jor-pildoras">${ops.map(([v, n]) =>
        `<button type="button" class="jor-pild" data-a="lite-dur" data-v="${v}" aria-pressed="${Number(cfg.lite) === v}"><span class="t">${n}</span></button>`).join("")}</div>
      <div class="jor-acc una"><button type="button" class="btn btn-primary jor-grande" data-a="lite-go">${J_PLAY}${tx("Enfocar")}</button></div>
      <p class="jor-regla">${tx("Sin elegir nada: solo tú y el reloj.")}</p>`;
  }
  if (run.fase === "foco") {
    return `<div class="jor-acc dos">
        <button type="button" class="btn btn-soft jor-grande" data-a="pausa">${run.seg ? J_PAUSA + tx("Pausa") : J_PLAY + tx("Seguir")}</button>
        <button type="button" class="btn btn-ghost jor-grande" data-a="lite-parar">${J_PARAR}${tx("Parar")}</button>
      </div>`;
  }
  if (run.fase === "listo") {
    return `<div class="jor-acc dos">
        <button type="button" class="btn btn-primary jor-grande" data-a="lite-go">${J_PLAY}${tx("Otro tramo")}</button>
        <button type="button" class="btn btn-soft jor-grande" data-a="lite-desc">${escapeHtml(T`Descansar ${cfg.desc} min`)}</button>
      </div>
      <button type="button" class="jor-enlace" data-a="fin">${tx("Terminar")}</button>`;
  }
  if (run.fase === "descanso") {
    return `<div class="jor-acc una"><button type="button" class="btn btn-ghost jor-grande" data-a="saltar">${tx("Saltar el descanso")}</button></div>`;
  }
  return "";
}

function jPintarControles() {
  const c = document.getElementById("jor-controles");
  if (!c) return;
  const j = jDatos(), run = j.run, cfg = j.cfg;
  /* Un tramo rápido se lleva con sus propios controles aunque se mire desde
     la rueda: pasarlo a los de la rueda lo convertiría en otro tramo. */
  if ((jModo() === "lite" && !run) || (run && run.lite)) { c.innerHTML = jControlesLite(run); return; }
  const r = jRef(jObjetivo());
  const flecha = '<svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5"/></svg>';
  const mas = `<button type="button" class="btn btn-ghost jor-icono" data-a="nuevo" aria-label="${escapeAttr(tx("Crear bloque"))}" title="${escapeAttr(tx("Crear bloque"))}"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>`;
  const desc = !run ? jDescansoAhora() : null;
  let h = "", regla = "";

  if (!run && j.dormido) {
    /* Dormido gana a todo: lo primero al abrir por la mañana es despertar. */
    h = `<div class="jor-acc una"><button type="button" class="btn btn-primary jor-grande" data-a="despertar">${tx("Buenos días")}</button></div>`;
    regla = tx("Tócalo al despertar y queda apuntado cuánto dormiste.");
  } else if (desc) {
    h = desc.descanso === "dormir"
      ? `<div class="jor-acc"><button type="button" class="btn btn-soft jor-grande" data-a="dormir"><svg viewBox="0 0 24 24">${J_LUNA}</svg>${tx("Buenas noches, a dormir")}</button>${mas}</div>`
      : `<div class="jor-acc"><span class="jor-desc-tx">${tx("Bloque de descanso: no lleva tramos.")}</span>${mas}</div>`;
    h += `<button type="button" class="jor-enlace" data-a="forzar">${tx("Enfocar de todos modos")}</button>`;
    regla = desc.descanso === "dormir" ? tx("Toca al irte a dormir y al despertar: así sabes cuánto dormiste.") : "";
  } else {
    if (!run || run.fase === "listo") {
      const ritmo = cfg.preset === "libre" ? tx("Libre") : `${cfg.foco}m / ${cfg.desc}m · ${cfg.ciclos}`;
      h += `<div class="jor-pildoras">
        <button type="button" class="jor-pild" data-a="enque" ${run ? "disabled" : ""}>${r && r.o.color ? `<span class="jor-punto" style="background:${pinta(r.o.color)}"></span>` : `<svg viewBox="0 0 24 24">${J_ARENA}</svg>`}<span class="t">${escapeHtml(r ? r.nombre : tx("Sin vincular"))}</span>${run ? "" : flecha}</button>
        <button type="button" class="jor-pild" data-a="ritmo"><svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M9.5 2.5h5"/></svg><span class="t">${ritmo}</span>${flecha}</button>
      </div>`;
    }
    if (!run) {
      h += `<div class="jor-acc"><button type="button" class="btn btn-primary jor-grande" data-a="iniciar">${J_PLAY}${tx("Iniciar")}</button>${mas}</div>`;
    } else if (run.fase === "listo") {
      h += `<div class="jor-acc"><button type="button" class="btn btn-primary jor-grande" data-a="iniciar">${J_PLAY}${escapeHtml(T`Tramo ${run.tramo} de ${cfg.ciclos}`)}</button>
        <button type="button" class="btn btn-ghost jor-icono" data-a="fin" aria-label="${escapeAttr(tx("Terminar por hoy"))}" title="${escapeAttr(tx("Terminar por hoy"))}">${J_PARAR}</button></div>`;
    } else if (run.fase === "foco") {
      const pausa = `<button type="button" class="btn btn-soft jor-grande" data-a="pausa">${run.seg ? J_PAUSA + tx("Pausa") : J_PLAY + tx("Seguir")}</button>`;
      h += run.libre
        ? `<div class="jor-acc dos">${pausa}<button type="button" class="btn btn-primary jor-grande" data-a="terminar">${tx("Terminar")}</button></div>
           <button type="button" class="jor-enlace peligro" data-a="abandonar">${tx("Abandonar")}</button>`
        : `<div class="jor-acc dos">${pausa}<button type="button" class="btn btn-danger-ghost jor-grande" data-a="abandonar">${tx("Abandonar")}</button></div>`;
    } else if (run.fase === "descanso") {
      h += `<div class="jor-acc una"><button type="button" class="btn btn-ghost jor-grande" data-a="saltar">${tx("Saltar el descanso")}</button></div>`;
    } else if (run.fase === "cierre") {
      h += `<div class="jor-acc una"><button type="button" class="btn btn-primary jor-grande" data-a="cierre">${tx("Guardar el tramo")}</button></div>`;
    }
    regla = jTextoRegla();
  }
  c.innerHTML = h + (regla ? `<p class="jor-regla">${escapeHtml(regla)}</p>` : "");
}
/* La línea de debajo de los controles: qué va a pasar con lo que se enfoca.
   Es «el reloj propone, tú confirmas» dicho antes de empezar. */
function jTextoRegla() {
  const r = jRef(jObjetivo());
  if (!r) return tx("Sin vincular: solo queda en tu registro.");
  if (r.t === "mision") return tx("Al acabar el tramo te pregunta si la terminaste.");
  if (r.t === "habilidad") return tx("Cada tramo cuenta como práctica y le da XP.");
  const s = r.o.skillId && (state.skills || []).find(x => x.id === r.o.skillId);
  return s ? T`Cada tramo le da XP a ${s.name}, la habilidad que entrena.` : tx("Queda en tu registro del Pomodoro.");
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
/* `fc` es el estado, y de él salen los colores del centro y de la píldora:
   foco en menta, descanso en luciérnaga, pausa en coral. */
function jEstadoCentro() {
  const j = jDatos(), run = j.run, cfg = j.cfg;
  if (!run) {
    if (jModo() === "lite") {
      return { arriba: 1, t: Number(cfg.lite) ? jMmss(Number(cfg.lite) * J_MS) : "00:00", f: tx("Hiperfoco"), fc: "",
        sub: tx("Un reloj y nada más"), cae: false, prog: 0 };
    }
    const m = jAhora();
    if (j.dormido) {
      const min = (Date.now() - j.dormido.inicio) / J_MS;
      const b = j.bloques.find(x => x.id === j.dormido.bloque);
      return { arriba: b ? Math.max(0, 1 - min / jDur(b)) : 0.5, t: jHm(min), f: tx("Durmiendo"), fc: "brasa",
        sub: T`Desde las ${jH12(jMinDe(j.dormido.inicio))}`, cae: true, prog: 0 };
    }
    const d = jDescansoAhora();
    if (d) {
      const pasado = (m - d.ini + J_DIA) % J_DIA, dur = jDur(d);
      return { arriba: 1 - pasado / dur, t: jHm(dur - pasado), f: tx((J_DESCANSOS[d.descanso] || J_DESCANSOS.dormir).fase), fc: "brasa",
        sub: d.descanso === "dormir" ? T`Te levantas a las ${jH12(d.fin)}` : T`Hasta las ${jH12(d.fin)}`, cae: true, prog: 0 };
    }
    const b = jBloqueEn(m), r = jRef(jObjetivo());
    return { arriba: 1, t: cfg.preset === "libre" ? "00:00" : jMmss(cfg.foco * J_MS), f: r ? r.nombre : tx("Sin vincular"), fc: "",
      sub: b ? jRango(b) : tx("Nada a esta hora"), cae: false, prog: 0 };
  }
  const el = jTrans(run), r = jRef(run.ref), nom = run.lite ? tx("Hiperfoco") : (r ? r.nombre : tx("Sin vincular"));
  if (run.fase === "foco") {
    const enPausa = !run.seg;
    const sub = run.lite ? (run.libre ? tx("Sin límite") : T`Tramo ${run.tramo}`) : nom;
    if (run.libre) {
      const v = (el % (25 * J_MS)) / (25 * J_MS);
      return { arriba: 1 - v, t: jMmss(el), f: enPausa ? tx("En pausa") : (run.lite ? tx("Hiperfoco") : tx("Enfoque libre")), fc: enPausa ? "pausa" : "foco", sub, cae: !enPausa, prog: v };
    }
    const p = Math.min(1, el / run.dur);
    return { arriba: 1 - p, t: jMmss(run.dur - el), f: enPausa ? tx("En pausa") : (run.lite ? tx("Hiperfoco") : T`Foco · ${run.tramo} de ${cfg.ciclos}`), fc: enPausa ? "pausa" : "foco", sub, cae: !enPausa, prog: p };
  }
  if (run.fase === "descanso") {
    const p = Math.min(1, el / run.dur);
    return { arriba: 1 - p, t: jMmss(run.dur - el), f: tx("Descanso"), fc: "brasa", sub: run.lite ? tx("Luego, otro tramo si quieres") : T`Luego, tramo ${run.tramo + 1}`, cae: true, prog: p };
  }
  if (run.fase === "listo" && run.lite) {
    return { arriba: 0, t: jMmss((run.min || 0) * J_MS), f: tx("Listo"), fc: "foco", sub: T`${run.min || 0} min de hiperfoco`, cae: false, prog: 1 };
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
  reloj.classList.toggle("brasa", s.fc === "brasa");
  reloj.classList.toggle("pausa", s.fc === "pausa");
  document.getElementById("jor-tiempo").textContent = s.t;
  const f = document.getElementById("jor-fase");
  f.textContent = s.f; f.className = s.fc;
  document.getElementById("jor-sub").textContent = s.sub;
}

/* ---------- La píldora: el reloj te sigue a otras pantallas ----------
   Cambia de color con el estado —menta en foco, coral en pausa, luciérnaga en
   descanso— y el estado va en negritas y de ese color, separado del nombre.
   Lo pidió Eduardo al verla en pausa con el borde verde: una píldora que no
   reacciona dice «todo sigue corriendo» cuando no es verdad. */
function jPintarPildora() {
  const pil = document.getElementById("jornada-pildora");
  if (!pil) return;
  const run = jornadaEncendida() ? jDatos().run : null;
  const ver = !!run && run.fase !== "listo" && !document.querySelector("#view-jornada.active") &&
              !document.getElementById("portada");
  pil.hidden = !ver;
  if (!ver) return;
  const s = jEstadoCentro();
  const estado = run.fase === "cierre" ? "foco" : s.fc || "foco";
  ["foco", "pausa", "brasa"].forEach(k => pil.classList.toggle(k, k === estado));
  document.getElementById("jor-pil-t").textContent = run.fase === "cierre" ? tx("Listo") : s.t;
  const rot = run.fase === "cierre" ? tx("Tramo listo") : s.f;
  const nom = run.fase === "cierre" ? tx("Toca para guardarlo") : s.sub;
  document.getElementById("jor-pil-s").innerHTML = `<b class="jor-pil-est">${escapeHtml(rot)}</b> · ${escapeHtml(nom)}`;
}

/* ---------- El paso ---------- */
let jCuartoAntes = -1;
function jPaso() {
  if (!jornadaEncendida()) { jPintarPildora(); return; }
  const run = jDatos().run;
  if (run && (run.fase === "foco" || run.fase === "descanso") && run.dur && run.seg && jTrans(run) >= run.dur) jFinFase();
  jAvisoSueno();
  /* Cada cuarto de hora puede cambiar el bloque de «ahora», y con él se olvida
     el «Enfocar de todos modos» del bloque que ya pasó. Y es cuando se apunta
     el plan del día, que así queda escrito aunque no se abra la pantalla. */
  const cuarto = Math.floor(jAhora() / 15);
  const cambio = cuarto !== jCuartoAntes;
  if (cambio) {
    jCuartoAntes = cuarto;
    const b = jBloqueEn(jAhora());
    if (jForzado && (!b || b.id !== jForzado)) jForzado = null;
    jApuntarPlan();
  }
  if (document.getElementById("jor-arena") && document.querySelector("#view-jornada.active")) {
    jPintarCentro(); jPintarAguja();
    if (cambio) {
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
  if (b) jEdit = { id: b.id, descanso: b.descanso || null, ref: b.ref || null, color: b.color || null, ini: b.ini, fin: b.fin };
  else {
    const ini = (Math.ceil(jAhora() / 15) * 15) % J_DIA;
    const g = jCandidatos()[0];
    jEdit = { id: null, descanso: g ? null : "comida", ref: g ? { t: g[0], id: g[2][0].id } : null, color: null, ini, fin: (ini + 60) % J_DIA };
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
function jOpcionesDescanso(actual) {
  return `<h4 class="jor-grupo">${tx("Descanso")}</h4>` + Object.keys(J_DESCANSOS).map(k => {
    const d = J_DESCANSOS[k];
    const tile = `<span class="jor-tile chico descanso" style="background:${k === "dormir" ? "var(--jor-sueno)" : "var(--jor-descanso)"}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d.icono}</svg></span>`;
    return jOpcion("descanso:" + k, tile, escapeHtml(tx(d.nombre)), tx("Sin tramos"), actual === k, "b-ref");
  }).join("");
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
    const b = jBloqueEn(jAhora()), del = b && !b.descanso ? jRef(b.ref) : null;
    const reloj = `<span class="jor-tile chico sin"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">${J_ARENA}</svg></span>`;
    h = `<div class="jor-hoja-cab"><span class="jor-ceja">${tx("Enfocar en")}</span><h3>${tx("¿En qué?")}</h3></div>
      <div class="jor-ops">
        ${jOpcion("auto", reloj, tx("Lo que toca ahora"), del ? escapeHtml(del.nombre) : tx("No hay nada a esta hora"), jEleccion === undefined, "elegir")}
        ${jListaOpciones("elegir", jEleccion || null)}
        ${jOpcion("none", reloj, tx("Sin vincular"), tx("Solo queda en tu registro"), jEleccion === null, "elegir")}
      </div>`;
  } else if (jHoja === "bloque") {
    const e = jEdit, d = ((e.fin - e.ini + J_DIA) % J_DIA) || J_DIA;
    const otro = jChoca(e.ini, e.fin, e.id);
    const r = jRef(e.ref);
    const nombre = e.descanso ? tx((J_DESCANSOS[e.descanso] || J_DESCANSOS.dormir).nombre) : (r ? r.nombre : tx("Bloque libre"));
    h = `<div class="jor-hoja-cab"><span class="jor-ceja">${e.id ? tx("Bloque") : tx("Nuevo bloque")}</span><h3>${escapeHtml(nombre)}</h3></div>
      <div class="jor-filas">
        ${paso("b-hora", "ini", tx("Empieza"), jH12(e.ini))}
        ${paso("b-hora", "fin", tx("Acaba"), jH12(e.fin))}
      </div>
      ${otro ? `<p class="jor-nota error">${escapeHtml(T`Se encima con «${jNombreBloque(otro)}». Muévelo o acórtalo.`)}</p>` : `<p class="jor-nota">${escapeHtml(T`Dura ${jFmtDur(d)}.`)}</p>`}
      <div class="jor-grupo-p"><p>${tx("Color")}</p><div class="jor-colores">
        <button type="button" class="jor-color auto" data-act="b-color" data-v="" aria-pressed="${!e.color}">${tx("Automático")}</button>
        ${COLORS.map(c => `<button type="button" class="jor-color" data-act="b-color" data-v="${c}" aria-pressed="${e.color === c}" style="background:${pinta(c)}" aria-label="${c}"></button>`).join("")}
      </div></div>
      <div class="jor-ops alto">${jOpcionesDescanso(e.descanso)}${jListaOpciones("b-ref", e.descanso ? null : e.ref)}</div>
      <button type="button" class="btn btn-primary btn-block" data-act="b-guardar" ${otro || (!e.descanso && !r) ? "disabled" : ""}>${tx("Guardar")}</button>
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
    if (j.run && j.run.fase === "listo" && !j.run.lite) j.run.dur = cfg.foco * J_MS;
    save();
  }
  if (a === "paso") {
    const k = b.dataset.k, salto = { foco: 5, desc: 1, ciclos: 1 }[k], lim = { foco: [10, 90], desc: [1, 20], ciclos: [1, 8] }[k];
    cfg[k] = Math.min(lim[1], Math.max(lim[0], cfg[k] + salto * Number(b.dataset.d)));
    if (j.run && j.run.fase === "listo" && !j.run.lite) j.run.dur = cfg.foco * J_MS;
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
  if (a === "b-ref") {
    const t = v.split(":")[0], id = v.split(":").slice(1).join(":");
    if (t === "descanso") { jEdit.descanso = id; jEdit.ref = null; }
    else { jEdit.descanso = null; jEdit.ref = { t, id }; }
  }
  if (a === "b-color") jEdit.color = v || null;
  if (a === "b-hora") {
    const k = b.dataset.k, n = (jEdit[k] + 15 * Number(b.dataset.d) + J_DIA) % J_DIA;
    const d = k === "ini" ? (jEdit.fin - n + J_DIA) % J_DIA : (n - jEdit.ini + J_DIA) % J_DIA;
    if (d >= 15) jEdit[k] = n;
  }
  if (a === "b-guardar") {
    const datos = jEdit.descanso ? { descanso: jEdit.descanso, ref: undefined } : { descanso: undefined, ref: jEdit.ref };
    datos.color = jEdit.color || undefined;
    if (jEdit.id) {
      const x = j.bloques.find(y => y.id === jEdit.id);
      if (x) Object.assign(x, datos, { ini: jEdit.ini, fin: jEdit.fin });
    } else {
      const n = Object.assign({ id: uid(), ini: jEdit.ini, fin: jEdit.fin }, datos);
      j.bloques.push(n); jSelId = n.id;
    }
    /* `undefined` no viaja en JSON, pero en memoria sí estorba al leer. */
    j.bloques.forEach(x => { if (x.descanso === undefined) delete x.descanso; if (x.ref === undefined) delete x.ref; if (x.color === undefined) delete x.color; });
    save(); jApuntarPlan(); cerrarHojaJornada(); jPintar(); return;
  }
  if (a === "b-quitar") {
    if (!jQuitando) { jQuitando = true; jPintarHoja(); return; }
    j.bloques = j.bloques.filter(x => x.id !== jEdit.id);
    jSelId = null; save(); jApuntarPlan(); cerrarHojaJornada(); jPintar(); return;
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
  if (a === "dormir") return jBuenasNoches();
  if (a === "despertar") return jBuenosDias();
  if (a === "forzar") { const b = jBloqueEn(jAhora()); jForzado = b ? b.id : null; jPintar(); return; }
  if (a === "lite-dur") { j.cfg.lite = Number(btn.dataset.v) || 0; save(); jPintar(); return; }
  if (a === "lite-go") return jIniciarLite();
  if (!j.run) return;
  if (a === "pausa") jPausa();
  if (a === "terminar") jTerminarLibre();
  if (a === "abandonar") jAbandonar();
  if (a === "lite-parar") jPararLite();
  if (a === "lite-desc") { Object.assign(j.run, { fase: "descanso", dur: j.cfg.desc * J_MS, acum: 0, seg: Date.now() }); save(); jPintar(); }
  if (a === "saltar") { if (j.run.lite) { j.run = null; save(); jPintar(); } else jSiguiente(); }
  if (a === "cierre") jAbrirHoja("cierre");
  if (a === "fin") { j.run = null; jEleccion = undefined; save(); jPintar(); }
}

function jClickLista(e) {
  const f = e.target.closest(".jor-fila");
  if (f) { jSelId = f.dataset.id; jPintarRueda(); jPintarLista(); jAbrirBloque(f.dataset.id); return; }
  const ac = e.target.closest("[data-acomodar]");
  if (ac) jAcomodar("mision", ac.dataset.acomodar);
}

/* ---------- El enlace que lo enciende ---------- */
function jornadaDesdeEnlace() {
  jMigrarInterruptor();
  let q = null;
  try {
    const p = new URLSearchParams(location.search);
    q = p.get("jornada") || p.get("pomodoro");
  } catch (e) { return; }
  if (q !== "1" && q !== "0") return;
  state.ui = state.ui || {};
  const off = new Set(state.ui.modulosOff || []);
  if (q === "1") off.delete("jornada"); else off.add("jornada");
  state.ui.modulosOff = [...off];
  save();
  /* Se quita de la dirección para que recargar no lo vuelva a aplicar encima
     de lo que hayas cambiado después en Ajustes. */
  try {
    const u = new URL(location.href);
    u.searchParams.delete("jornada"); u.searchParams.delete("pomodoro");
    history.replaceState(history.state, "", u.pathname + u.search + u.hash);
  } catch (e) { /* se queda en la dirección, sin más */ }
  setTimeout(() => toast(q === "1" ? tx("Pomodoro encendido: ya está en tu menú") : tx("Pomodoro apagado"), q === "1" ? "hecho" : "deshecho"), 900);
}

/* Se llama una vez desde el arranque. Los clics van por delegación sobre
   contenedores que no se rehacen, así que no hay que volver a engancharlos. */
function iniciarRelojJornada() {
  const hoja = document.getElementById("jornada-hoja");
  if (hoja) hoja.addEventListener("click", jClickHoja);
  const cont = document.getElementById("jornada-content");
  if (cont) {
    cont.addEventListener("click", e => {
      const md = e.target.closest("[data-modo]");
      if (md) { if (md.dataset.modo !== jModo()) jPonerModo(md.dataset.modo); return; }
      if (e.target.closest("#jor-controles")) jClickControles(e);
      else if (e.target.closest(".jor-lista")) jClickLista(e);
    });
  }
  setInterval(jPaso, 250);
  document.addEventListener("visibilitychange", jPaso);
}
