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
  /* Los cubiertos salen del catálogo (`ICONS`, js/01-base.js) desde la
     0.7.109, que es donde los pidió Eduardo para las habilidades: era el mismo
     dibujo escrito dos veces, y dos copias se separan al primer retoque. */
  comida:   { nombre: "Comer",    fase: "Hora de comer",  icono: ICONS.cubiertos },
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
  /* `notificar` sustituye a `avisos` (0.7.105.1): aquel nació apagado y se
     guardó apagado en todos los perfiles, así que reusarlo no habría
     encendido nada. */
  /* Se rellena lo que falta SIN cambiar el objeto (0.7.106). Antes se
     reemplazaba por una copia en cada llamada —cuatro veces por segundo—, y
     quien guardaba el de antes escribía en una copia huérfana: el reloj no
     cambiaba al mover los minutos. */
  const porDefecto = { preset: "clasico", foco: 25, desc: 5, ciclos: 4, auto: false, sonido: true, notificar: true, hfModo: "travesia" };
  for (const k in porDefecto) if (!(k in j.cfg)) j.cfg[k] = porDefecto[k];
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
/* Horas y minutos para lo que dura más que un tramo: la noche, la comida.
   Con DOS dígitos en la hora (03:17 y no 3:17), como los minutos del tramo:
   lo pidió Eduardo porque al pasar de uno a otro el reloj cambiaba de ancho. */
function jHm(min) {
  min = Math.max(0, Math.round(min));
  return String(Math.floor(min / 60)).padStart(2, "0") + ":" + String(min % 60).padStart(2, "0");
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

/* ---- Qué dispositivo lleva el reloj (0.7.105.1) ----
   El reloj viaja con la sincronía, así que con el teléfono y la computadora
   abiertos los dos cerraban el mismo tramo y los dos sonaban; y si uno traía
   una copia vieja, volvía a sonar. Eduardo lo describió así: «siento que suena
   algo pero nunca me acabo enterando el motivo». Desde aquí el tramo es del
   dispositivo donde se empezó (`run.origen`): ese lo cierra y suena. Otro solo
   lo cierra —en silencio— si ya pasó minuto y medio y el primero no lo hizo,
   que es cuando está apagado o dormido. Es preferencia de este dispositivo:
   localStorage, nunca `state`. */
function jEsteDispositivo() {
  try {
    let id = localStorage.getItem("norata-pomodoro-dispositivo");
    if (!id) { id = uid(); localStorage.setItem("norata-pomodoro-dispositivo", id); }
    return id;
  } catch (e) { return "este"; }
}
const jEsMio = run => !run || !run.origen || run.origen === jEsteDispositivo();
function jPuedoCerrar(run) { return jEsMio(run) || jTrans(run) - run.dur > 90000; }
/* El permiso de los avisos del sistema se pide al tocar Iniciar: es un gesto
   tuyo y es justo cuando se entiende para qué. Sin permiso, el aviso de fuera
   de la app no puede explicar nada, y una campana sin explicación es ruido. */
function jPedirPermiso() {
  const c = jDatos().cfg;
  if (c.notificar === false || !("Notification" in window) || Notification.permission !== "default") return;
  try { Notification.requestPermission(); } catch (e) { /* sin avisos del sistema */ }
}

function jIniciar() {
  jAudio(); jPedirPermiso();
  const j = jDatos(), c = j.cfg, libre = c.preset === "libre";
  let tramo = 1, ref = jObjetivo(), bloque = null;
  if (j.run && j.run.fase === "listo" && !j.run.lite) { tramo = j.run.tramo; ref = j.run.ref; bloque = j.run.bloque; }
  else {
    const b = jBloqueEn(jAhora());
    bloque = b && !b.descanso && jEleccion === undefined ? b.id : null;
  }
  j.run = { fase: "foco", tramo, dur: libre ? null : c.foco * J_MS, acum: 0, seg: Date.now(), pausas: 0, libre, ref: ref || null, bloque,
    origen: jEsteDispositivo(), fid: uid(), reloj: jTipoReloj(libre ? 0 : c.foco) };
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
  /* Cada final de fase suena UNA vez (`clave`) y solo en el dispositivo que
     lleva el reloj (`mio`). */
  const mio = jEsMio(run), clave = (run.fid || run.seg || "") + "|" + run.fase;
  if (run.lite) {
    const k = run.modo || "travesia", h = jHfCfg().hf[k] || {};
    if (run.fase === "foco") {
      const min = Math.round(run.dur / J_MS);
      jApuntarLite(min, run.pausas, k);
      /* Una Travesía sigue sola: foco, descanso, foco… hasta sus rondas. */
      if (k === "travesia" && run.tramo < (run.rondas || 1)) {
        Object.assign(run, { fase: "descanso", dur: (h.desc || 5) * J_MS, acum: 0, seg: Date.now(), fid: uid() });
        save();
        jAvisar(T`Ronda ${run.tramo} de ${run.rondas} lista`, T`Descansa ${h.desc || 5} min.`, clave, mio);
      } else {
        Object.assign(run, { fase: "listo", min, acum: 0, seg: null });
        save();
        jAvisar(tx("Listo"), k === "travesia" && (run.rondas || 1) > 1 ? T`Terminaste tus ${run.rondas} rondas.` : T`${min} min de hiperfoco.`, clave, mio);
      }
    } else if (run.fase === "descanso") {
      if (k === "respiro") {
        jApuntarRespiro(Math.round(run.dur / J_MS));
        j.run = null;
        save();
        jAvisar(tx("Tu respiro terminó"), tx("Vuelve cuando quieras."), clave, mio);
      } else {
        Object.assign(run, { fase: "foco", tramo: run.tramo + 1, dur: (h.foco || 25) * J_MS, acum: 0, seg: Date.now(), pausas: 0, fid: uid() });
        save();
        jAvisar(tx("De vuelta al foco"), T`Ronda ${run.tramo} de ${run.rondas}.`, clave, mio);
      }
    }
    jPintar();
    return;
  }
  if (run.fase === "foco") {
    run.min = Math.round(run.dur / J_MS);
    run.fase = "cierre"; run.seg = null;
    save();
    jAvisar(T`Tramo ${run.tramo} de ${j.cfg.ciclos} listo`, T`${run.min} min de foco. Toca descansar.`, clave, mio);
    if (document.querySelector("#view-jornada.active")) jAbrirHoja("cierre");
    jPintarControles();
  } else if (run.fase === "descanso") {
    jAvisar(tx("Se acabó el descanso"), T`Sigue el tramo ${run.tramo + 1}.`, clave, mio);
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

/* ---------- Hiperfoco: tres maneras (0.7.105) ----------
   Lo pidió Eduardo al probar el modo rápido: que también tuviera intervalos,
   con tres opciones —una normal, una «hardcore» sin descanso y una «zen» sin
   trabajo—, cada una con otro nombre y un lápiz para cambiárselo.

     travesia   foco y descanso alternados, por rondas
     inmersion  solo foco, de corrido
     respiro    solo descanso: nada que hacer, solo parar

   Los nombres son los de la casa —la expedición—, pero son de quien los usa:
   `cfg.hfNombres` guarda el que haya puesto, y vacío vuelve al de siempre.
   Los rótulos se traducen donde se dibujan, igual que los descansos. */
const J_HF = {
  travesia:  { nombre: "Travesía",  verbo: "Enfocar" },
  inmersion: { nombre: "Inmersión", verbo: "Sumergirme" },
  respiro:   { nombre: "Respiro",   verbo: "Respirar" }
};
function jHfCfg() {
  const c = jDatos().cfg;
  /* En su sitio, igual que `jDatos`: reemplazar `c.hf` en cada llamada dejaba
     huérfano a quien tuviera en la mano el de antes. */
  if (!c.hf || typeof c.hf !== "object") c.hf = {};
  const porDefecto = { travesia: { foco: 25, desc: 5, rondas: 4 }, inmersion: { foco: 50 }, respiro: { desc: 10 } };
  for (const m in porDefecto) {
    if (!c.hf[m] || typeof c.hf[m] !== "object") c.hf[m] = {};
    for (const p in porDefecto[m]) if (typeof c.hf[m][p] !== "number") c.hf[m][p] = porDefecto[m][p];
  }
  if (!J_HF[c.hfModo]) c.hfModo = "travesia";
  if (!c.hfNombres || typeof c.hfNombres !== "object") c.hfNombres = {};
  return c;
}
function jHfNombre(k) {
  const c = jDatos().cfg;
  return (c.hfNombres && c.hfNombres[k]) || tx((J_HF[k] || J_HF.travesia).nombre);
}
function jHfResumen(k) {
  const h = jHfCfg().hf[k];
  if (k === "travesia") return T`${h.foco} / ${h.desc} min · ${h.rondas} rondas`;
  if (k === "inmersion") return T`${h.foco} min sin pausa`;
  return T`${h.desc} min de calma`;
}

function jIniciarLite() {
  jAudio(); jPedirPermiso();
  const c = jHfCfg(), k = c.hfModo, h = c.hf[k], j = jDatos();
  const base = { lite: true, modo: k, tramo: 1, acum: 0, seg: Date.now(), pausas: 0, ref: null, bloque: null,
    origen: jEsteDispositivo(), fid: uid(), reloj: jTipoReloj(k === "respiro" ? h.desc : h.foco) };
  j.run = k === "respiro"
    ? Object.assign(base, { fase: "descanso", dur: h.desc * J_MS })
    : Object.assign(base, { fase: "foco", dur: h.foco * J_MS, rondas: k === "travesia" ? h.rondas : 1 });
  save(); jPintar();
}
/* Lo que se hizo en Hiperfoco queda en el registro sin vincular: no da XP
   —no está atado a nada que la reciba— pero cuenta como foco en el informe,
   con el nombre del modo, que es lo que agrupa «¿En qué pusiste el foco?». */
function jApuntarLite(min, pausas, modo) {
  if (min < 1) return;
  const j = jDatos(), nombre = jHfNombre(modo || "travesia");
  j.registro.unshift({ id: uid(), fecha: todayKey(), hora: hhmmNow(), ref: null, nombre,
    min, pausas: pausas || 0, animo: 0, res: tx("Hiperfoco"), lite: true, modo: modo || "travesia" });
  j.registro = j.registro.slice(0, J_REG_MAX);
}
/* Un Respiro se apunta aparte (`tipo: "respiro"`): es descanso a propósito,
   y el informe no lo cuenta como foco. */
function jApuntarRespiro(min) {
  if (min < 1) return;
  const j = jDatos();
  j.registro.unshift({ id: uid(), fecha: todayKey(), hora: hhmmNow(), ref: null, nombre: jHfNombre("respiro"), min, tipo: "respiro" });
  j.registro = j.registro.slice(0, J_REG_MAX);
}
/* Parar guarda lo hecho y ya: aquí no hay «abandonar», porque no hay nada que
   cumplir. Diez minutos de hiperfoco son diez minutos. */
function jPararLite() {
  const j = jDatos(), run = j.run; if (!run) return;
  const min = Math.floor(jTrans(run) / J_MS);
  const respiro = run.modo === "respiro";
  if (run.fase === "foco") jApuntarLite(min, run.pausas, run.modo);
  else if (run.fase === "descanso" && respiro) jApuntarRespiro(min);
  j.run = null;
  save(); jPintar();
  if (run.fase === "foco" || respiro) {
    toast(min < 1 ? tx("Menos de un minuto: no queda apuntado")
      : respiro ? T`${min} min de respiro apuntados` : T`${min} min de hiperfoco apuntados`, min >= 1 ? "logro" : "calma");
  }
}
/* Saltar el descanso de una Travesía es pasar ya a la ronda siguiente. */
function jSaltarLite() {
  const j = jDatos(), run = j.run; if (!run) return;
  if (run.modo === "respiro") return jPararLite();
  const h = jHfCfg().hf.travesia;
  Object.assign(run, { fase: "foco", tramo: run.tramo + 1, dur: h.foco * J_MS, acum: 0, seg: Date.now(), pausas: 0, fid: uid() });
  save(); jPintar();
}

/* ---- Reiniciar la fase y saltar lo que queda (0.7.107.3) ----
   Las dos salidas que aparecen al pausar en Hiperfoco.

   **Reiniciar** pone la fase a cero y la deja CORRIENDO: quien la reinicia
   quiere volver a empezar ahora, no volver a tocar Seguir. Se lleva por delante
   los minutos que iban —y eso es lo que se está pidiendo—, así que el `fid`
   cambia: es la marca de «esta fase es otra» y sin ella la campana del final
   creería que ya sonó.

   **Saltar** no regala tiempo. Termina la fase AQUÍ, poniéndole a `dur` lo que
   de verdad se llevaba trabajado, y deja que `jFinFase` haga lo de siempre: así
   el registro apunta los minutos reales y no los que se pensaban hacer, y la
   Travesía sigue a su descanso sin saber que pasó nada raro. Un botón que
   apuntara la fase entera por saltarla sería una manera de mentirle al informe,
   que es lo único que este módulo tiene que cuidar. */
function jReiniciarFaseLite() {
  const run = jDatos().run; if (!run || !run.lite) return;
  Object.assign(run, { acum: 0, seg: Date.now(), pausas: 0, fid: uid() });
  save(); jPintar();
  toast(tx("La fase vuelve a empezar"), "hecho");
}
function jSaltarFaseLite() {
  const run = jDatos().run; if (!run || !run.lite) return;
  run.acum = jTrans(run); run.seg = null;
  run.dur = Math.max(0, run.acum);
  save();
  jFinFase();
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
    jAvisar(T`En ${Math.ceil(falta)} min toca dormir`, T`Tu bloque de dormir empieza a las ${jH12(b.ini)}.`, "sueno|" + clave);
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
  else if (descansar) Object.assign(run, { fase: "descanso", dur: j.cfg.desc * J_MS, acum: 0, seg: Date.now(), fid: uid() });
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
  const ahora = jAhora();
  for (const b of jDatos().bloques) {
    const d = jDur(b), col = jColorBloque(b);
    /* El gajo en curso BRILLA con su propio color (0.7.105), con el mismo halo
       que `.barra-viva` en lo lleno. Solo la luz: el dibujo no cambia. El color
       entra por una variable y el halo no se anima —animado, Chrome lo deja
       congelado—, y de día se apaga en el CSS, como todos los halos. */
    const enCurso = jDentro(b, ahora);
    h += `<path class="jor-blq${b.id === jSelId ? " sel" : ""}${enCurso ? " ahora" : ""}" data-id="${b.id}" d="${jArco(b.ini, d)}" style="fill:${col};--jor-brillo:${col}"/>`;
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
/* ---------- Tres relojes, según el tiempo (0.7.106) ----------
   El reloj que se ve depende del tiempo elegido ANTES de iniciar: poco tiempo,
   uno pequeño; mucho, el Monumental. Lo pidió Eduardo —«si un usuario elige
   mucho tiempo, que tenga un reloj distinto y alusivo a tener más tiempo»— y
   con dos condiciones: que sea el mismo en el foco y en el descanso, y que no
   sea el mismo dibujo encogido. Eligió de dos tandas de bocetos (el Clásico de
   antes queda retirado):

     chico    15 min o menos   tapa lisa arriba y abajo
     mediano  de 20 a 45       dos columnas y pedestal de dos escalones
     grande   50 o más         el Monumental: arco con remate, cuatro
                               columnas torneadas, pedestal y escala

   ---- Los tres son SIMÉTRICOS respecto al cuello (0.7.108.1) ----
   Y eso no es una manía de dibujante: es lo que deja que al voltear gire el
   RELOJ ENTERO y no solo el vidrio. Media vuelta a un reloj con arco arriba y
   pedestal abajo lo deja apoyado del revés, así que hasta la 0.7.108 giraba
   solo el vidrio dentro de su pie. Eduardo lo vio al mirarlo de cerca —«no me
   había percatado de ese detalle»— y pidió los tres simétricos.

   La simetría no se escribe a mano, se dibuja UNA vez: cada reloj declara la
   mitad de ARRIBA (`cabAtras`, `cabDelante`) y `esp()` la copia abajo espejada
   sobre el cuello. Así no hay ninguna resta que pueda salir mal, y mover una
   tapa mueve las dos. Lo que ya era simétrico por su cuenta —los postes, las
   panzas de las columnas, las marcas de la escala— se queda en `atras` y
   `adelante` sin copiar.

   Qué cambió de los dibujos al hacerlos simétricos: el chico lleva su tapa
   arriba y abajo (antes la de abajo era más chica), el mediano lleva el
   pedestal de dos escalones en los dos extremos, y el Monumental su arco con
   remate arriba y abajo — y pierde la peana ancha del suelo, que era justo la
   pieza que no tenía pareja. Lo que los distingue entre sí no se toca. */
const J_RELOJES = (() => {
  function vidrio(cx, hw, y0, y1, pared) {
    const mid = (y0 + y1) / 2, n = 3.5, a = y0 + pared, b = y1 - pared, nt = mid - 4, nb = mid + 4;
    return {
      mid,
      todo: `M${cx - hw} ${y0} L${cx + hw} ${y0} L${cx + hw} ${a} L${cx + n} ${nt} L${cx + n} ${nb} L${cx + hw} ${b} L${cx + hw} ${y1} L${cx - hw} ${y1} L${cx - hw} ${b} L${cx - n} ${nb} L${cx - n} ${nt} L${cx - hw} ${a} Z`,
      arriba: `M${cx - hw} ${y0} L${cx + hw} ${y0} L${cx + hw} ${a} L${cx + n} ${nt} L${cx + n} ${mid} L${cx - n} ${mid} L${cx - n} ${nt} L${cx - hw} ${a} Z`,
      abajo: `M${cx - n} ${mid} L${cx + n} ${mid} L${cx + n} ${nb} L${cx + hw} ${b} L${cx + hw} ${y1} L${cx - hw} ${y1} L${cx - hw} ${b} L${cx - n} ${nb} Z`
    };
  }
  const pz = (x, y, w, h, r) => `<rect class="jor-madera" x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>`;
  const po = (x, y0, y1, grosor) => `<line class="jor-poste${grosor ? " " + grosor : ""}" x1="${x}" y1="${y0}" x2="${x}" y2="${y1}"/>`;
  /* El espejo sobre el cuello: `y' = 2·mid − y`. Una matriz y no dos traslados
     para que el trazo no cambie de grosor por el camino. */
  const esp = (mid, c) => c ? `<g transform="matrix(1 0 0 -1 0 ${2 * mid})">${c}</g>` : "";
  const def = o => {
    const v = vidrio(o.cx, o.hw, o.y0, o.y1, o.pared);
    return { vb: o.vb, cx: o.cx, hw: o.hw, y0: o.y0, y1: o.y1, v,
      atras: (o.atras || "") + (o.cabAtras || "") + esp(v.mid, o.cabAtras),
      adelante: (o.adelante || "") + (o.cabDelante || "") + esp(v.mid, o.cabDelante) };
  };
  return {
    /* Sin el escalón de abajo (0.7.106.3): con él, el pequeño y el mediano no
       se distinguían en nada —lo vio Eduardo poniéndolos lado a lado—. Se
       queda con una tapa lisa, y el pedestal de dos escalones es del mediano. */
    chico: def({ vb: "0 0 140 156", cx: 70, hw: 30, y0: 30, y1: 142, pared: 18,
      atras: po(32, 28, 144, "delgado") + po(108, 28, 144, "delgado"),
      cabDelante: pz(26, 16, 88, 14, 4) }),
    mediano: def({ vb: "0 0 170 240", cx: 85, hw: 36, y0: 34, y1: 206, pared: 28,
      atras: po(30, 32, 208) + po(140, 32, 208),
      cabDelante: pz(12, 8, 146, 14, 4) + pz(22, 22, 126, 12, 3) }),
    grande: def({ vb: "0 0 200 300", cx: 100, hw: 38, y0: 40, y1: 260, pared: 64,
      atras: po(40, 38, 262) + po(160, 38, 262) + po(52, 38, 262, "fino") + po(148, 38, 262, "fino") +
        [92, 150, 208].map(y => `<ellipse class="jor-madera" cx="40" cy="${y}" rx="7" ry="10"/><ellipse class="jor-madera" cx="160" cy="${y}" rx="7" ry="10"/>`).join(""),
      cabAtras: `<circle class="jor-madera" cx="100" cy="7" r="5"/><path class="jor-madera" d="M40 28 Q100 -4 160 28 Z"/>`,
      adelante: [48, 64, 80, 96, 204, 220, 236, 252].map(y => `<line class="jor-marca" x1="141" y1="${y}" x2="146" y2="${y}"/>`).join(""),
      cabDelante: pz(30, 26, 140, 13, 3) })
  };
})();
/* `min` son los minutos elegidos; sin límite (Libre) cuenta como mucho tiempo. */
function jTipoReloj(min) { return !min ? "grande" : min <= 15 ? "chico" : min >= 50 ? "grande" : "mediano"; }
/* El que toca ahora: el del tramo en curso —se apunta al empezar, y así no
   cambia entre el foco y el descanso—, o el de lo que está elegido. */
function jRelojActual() {
  const j = jDatos(), run = j.run;
  if (run && run.reloj) return run.reloj;
  if ((run && run.lite) || (!run && jModo() === "lite")) {
    const c = jHfCfg(), k = run ? (run.modo || "travesia") : c.hfModo, h = c.hf[k];
    return jTipoReloj(k === "respiro" ? h.desc : h.foco);
  }
  return jTipoReloj(j.cfg.preset === "libre" ? 0 : j.cfg.foco);
}
function jRelojHTML(tipo) {
  const t = J_RELOJES[tipo] ? tipo : "mediano", R = J_RELOJES[t], v = R.v, x = R.cx - R.hw - 2, w = R.hw * 2 + 4;
  return `
    <svg class="jor-arena t-${t}" id="jor-arena" data-tipo="${t}" viewBox="${R.vb}" aria-hidden="true">
      <defs>
        <clipPath id="jor-c-arriba"><path d="${v.arriba}"/></clipPath>
        <clipPath id="jor-c-abajo"><path d="${v.abajo}"/></clipPath>
      </defs>
      <g id="jor-giro" style="transform-origin:${R.cx}px ${v.mid}px">
        ${R.atras}
        <path class="jor-vidrio" d="${v.todo}"/>
        <g class="jor-arena-g">
          <rect id="jor-a-arriba" clip-path="url(#jor-c-arriba)" x="${x}" y="${R.y0}" width="${w}" height="${v.mid - R.y0}"/>
          <rect id="jor-a-abajo" clip-path="url(#jor-c-abajo)" x="${x}" y="${R.y1}" width="${w}" height="0"/>
          <line id="jor-chorro" x1="${R.cx}" y1="${v.mid}" x2="${R.cx}" y2="${R.y1 - 2}"/>
        </g>
        <path class="jor-vidrio-borde" d="${v.todo}"/>
        ${R.adelante}
      </g>
    </svg>`;
}
/* Si cambió el tiempo elegido —otro ritmo, otra manera del Hiperfoco—, cambia
   el reloj. Se rehace entero porque cada uno es otro dibujo. */
function jAsegurarReloj() {
  const el = document.getElementById("jor-arena");
  if (!el) return;
  const t = jRelojActual();
  if (el.dataset.tipo === t) return;
  el.outerHTML = jRelojHTML(t);
  jArribaAntes = 1; jVolteando = false;
}
function renderJornada() {
  const cont = document.getElementById("jornada-content");
  if (!cont || !jornadaEncendida()) return;
  jDatos();
  const modo = jModo();
  const pestanas = `<div class="jor-modos" role="tablist" aria-label="${escapeAttr(tx("Cómo usar el Pomodoro"))}">
    ${[["dia", tx("Rutina diaria")], ["lite", tx("Hiperfoco")]].map(([k, n]) =>
      `<button type="button" role="tab" data-modo="${k}" aria-selected="${modo === k}">${n}</button>`).join("")}
  </div>`;
  /* `jor-fin` es la hora a la que acaba la fase (0.7.107.3). Nace escondido:
     solo hay hora que dar cuando algo está corriendo con final conocido. */
  const numeros = `<div id="jor-tiempo">25:00</div><div id="jor-fase"></div><div id="jor-sub"></div><div id="jor-fin" hidden></div>`;

  if (modo === "lite") {
    cont.innerHTML = pestanas + `
      <div class="jor-lite">
        <div class="jor-reloj-caja">${jRelojHTML(jRelojActual())}</div>
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
            <div class="jor-centro"><div class="jor-reloj-caja">${jRelojHTML(jRelojActual())}</div>${numeros}</div>
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

const J_LAPIZ = '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>';

/* Los controles del Hiperfoco: elegir una de las tres maneras, sus minutos y
   un botón. Nada que vincular. */
function jControlesLite(run) {
  const c = jHfCfg();
  if (!run) {
    const k = c.hfModo, h = c.hf[k];
    const paso = (clave, lbl, val) => `<div class="jor-hf-paso"><span>${lbl}</span><span class="jor-paso">
        <button type="button" data-a="hf-paso" data-k="${clave}" data-d="-1" aria-label="${escapeAttr(tx("Menos"))}">−</button><output>${val}</output>
        <button type="button" data-a="hf-paso" data-k="${clave}" data-d="1" aria-label="${escapeAttr(tx("Más"))}">+</button></span></div>`;
    const ajustes = k === "travesia"
      ? paso("foco", tx("Foco"), T`${h.foco} min`) + paso("desc", tx("Descanso"), T`${h.desc} min`) + paso("rondas", tx("Rondas"), h.rondas)
      : k === "inmersion" ? paso("foco", tx("Foco"), T`${h.foco} min`)
      : paso("desc", tx("Descanso"), T`${h.desc} min`);
    return `<div class="jor-hf-modos">${Object.keys(J_HF).map(m => `
        <div class="jor-hf">
          <button type="button" class="jor-hf-sel" data-a="hf-modo" data-v="${m}" aria-pressed="${m === k}"><b>${escapeHtml(jHfNombre(m))}</b><span>${escapeHtml(jHfResumen(m))}</span></button>
          <button type="button" class="jor-hf-lapiz" data-a="hf-nombre" data-v="${m}" aria-label="${escapeAttr(tx("Cambiar el nombre"))}" title="${escapeAttr(tx("Cambiar el nombre"))}">${J_LAPIZ}</button>
        </div>`).join("")}</div>
      <div class="jor-hf-ajustes-caja"><div class="jor-hf-ajustes">${ajustes}</div></div>
      <div class="jor-acc una"><button type="button" class="btn btn-primary jor-grande" data-a="lite-go">${J_PLAY}${tx(J_HF[k].verbo)}</button></div>`;
  }
  if (run.fase === "foco") {
    /* ---- En pausa aparecen las dos salidas de la fase (0.7.107.3) ----
       Las pidió Eduardo, y solo en pausa: corriendo son ruido —lo que hay que
       hacer es enfocar— y en pausa son justo las dos preguntas que uno se hace
       ahí parado, «esta ronda ya no me sirve» o «ya estuvo, sigue».

       Volver a Pausa las esconde, así que no hay que acordarse de nada. */
    const extra = run.seg ? "" : `<div class="jor-acc dos jor-mas">
        <button type="button" class="btn btn-aviso jor-chico" data-a="hf-reiniciar">${tx("Reiniciar fase")}</button>
        <button type="button" class="btn btn-ghost jor-chico" data-a="hf-saltar">${tx("Saltar lo que queda")}</button>
      </div>`;
    return `<div class="jor-acc dos">
        <button type="button" class="btn btn-soft jor-grande" data-a="pausa">${run.seg ? J_PAUSA + tx("Pausa") : J_PLAY + tx("Seguir")}</button>
        <button type="button" class="btn btn-ghost jor-grande" data-a="lite-parar">${J_PARAR}${tx("Parar")}</button>
      </div>` + extra;
  }
  if (run.fase === "listo") {
    return `<div class="jor-acc una"><button type="button" class="btn btn-primary jor-grande" data-a="lite-go">${J_PLAY}${tx("Otra vez")}</button></div>
      <button type="button" class="jor-enlace" data-a="fin">${tx("Terminar")}</button>`;
  }
  if (run.fase === "descanso") {
    return run.modo === "respiro"
      ? `<div class="jor-acc una"><button type="button" class="btn btn-ghost jor-grande" data-a="lite-parar">${J_PARAR}${tx("Parar")}</button></div>`
      : `<div class="jor-acc una"><button type="button" class="btn btn-ghost jor-grande" data-a="saltar">${tx("Saltar el descanso")}</button></div>
         <button type="button" class="jor-enlace" data-a="lite-parar">${tx("Parar")}</button>`;
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
   cabeza y en el modo Libre se quedaba pegada al techo — lo cazó Eduardo.

   Desde 0.7.108.1 el enderezado del final tampoco se nota en el MARCO, y es lo
   que permitió que gire el reloj entero: los tres son simétricos respecto al
   cuello, así que a media vuelta el pie se ve igual que derecho. Ver
   `J_RELOJES`, que es donde vive esa simetría. */
let jArribaAntes = 1, jVolteando = false;
function jVoltear() {
  const g = document.getElementById("jor-giro");
  if (!g) return;
  jVolteando = true;
  /* La vuelta entera vive en el CSS (`@keyframes jor-voltear`): media vuelta
     con un encogimiento a mitad de camino. Aquí solo se enciende y se espera. */
  const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
  /* Al terminar la vuelta se quita la clase Y se redibuja la arena en el MISMO
     turno, para que el navegador pinte las dos cosas juntas. Antes la arena se
     corregía en el siguiente paso del reloj —hasta 250 ms después—, y en ese
     hueco el vidrio ya estaba derecho con la arena dibujada como si siguiera
     girado: abajo en vez de arriba. Lo vio Eduardo como un parpadeo.

     Se busca el grupo otra vez porque el reloj pudo cambiar de dibujo en medio,
     y `acabar` se protege sola: la llaman el final de la animación Y un plazo
     de seguridad, y con el dibujo cambiado en medio el `animationend` no llega
     nunca — sin ese plazo la arena se quedaría congelada a media vuelta. */
  const acabar = () => {
    if (!jVolteando) return;
    jVolteando = false;
    const g2 = document.getElementById("jor-giro");
    if (g2) g2.classList.remove("girando");
    jPintarCentro();
  };
  if (quieto) { acabar(); return; }
  g.classList.add("girando");
  g.addEventListener("animationend", acabar, { once: true });
  setTimeout(acabar, 1200);
}
/* `fc` es el estado, y de él salen los colores del centro y de la píldora:
   foco en menta, descanso en luciérnaga, pausa en coral. */
function jEstadoCentro() {
  const j = jDatos(), run = j.run, cfg = j.cfg;
  if (!run) {
    if (jModo() === "lite") {
      const hc = jHfCfg(), k = hc.hfModo, h = hc.hf[k];
      return { arriba: 1, t: jMmss((k === "respiro" ? h.desc : h.foco) * J_MS), f: jHfNombre(k), fc: k === "respiro" ? "brasa" : "",
        sub: jHfResumen(k), cae: false, prog: 0 };
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
  const el = jTrans(run), r = jRef(run.ref);
  const hfNom = run.lite ? jHfNombre(run.modo || "travesia") : "";
  const nom = run.lite ? hfNom : (r ? r.nombre : tx("Sin vincular"));
  if (run.fase === "foco") {
    const enPausa = !run.seg;
    const sub = run.lite
      ? (run.libre ? tx("Sin límite") : (run.rondas || 1) > 1 ? T`Ronda ${run.tramo} de ${run.rondas}` : tx("Sin pausas"))
      : nom;
    if (run.libre) {
      const v = (el % (25 * J_MS)) / (25 * J_MS);
      return { arriba: 1 - v, t: jMmss(el), f: enPausa ? tx("En pausa") : (run.lite ? hfNom : tx("Enfoque libre")), fc: enPausa ? "pausa" : "foco", sub, cae: !enPausa, prog: v };
    }
    const p = Math.min(1, el / run.dur);
    return { arriba: 1 - p, t: jMmss(run.dur - el), f: enPausa ? tx("En pausa") : (run.lite ? hfNom : T`Foco · ${run.tramo} de ${cfg.ciclos}`), fc: enPausa ? "pausa" : "foco", sub, cae: !enPausa, prog: p, resta: run.dur - el };
  }
  if (run.fase === "descanso") {
    const p = Math.min(1, el / run.dur);
    const respiro = run.lite && run.modo === "respiro";
    return { arriba: 1 - p, t: jMmss(run.dur - el), f: respiro ? hfNom : tx("Descanso"), fc: "brasa",
      sub: respiro ? tx("Nada que hacer: solo respirar") : run.lite ? T`Luego, ronda ${run.tramo + 1} de ${run.rondas || 1}` : T`Luego, tramo ${run.tramo + 1}`, cae: true, prog: p, resta: run.dur - el };
  }
  if (run.fase === "listo" && run.lite) {
    return { arriba: 0, t: jMmss((run.min || 0) * J_MS), f: tx("Listo"), fc: "foco",
      sub: (run.rondas || 1) > 1 ? T`Terminaste tus ${run.rondas} rondas.` : T`${run.min || 0} min de hiperfoco`, cae: false, prog: 1 };
  }
  if (run.fase === "listo") return { arriba: 1, t: jMmss(cfg.foco * J_MS), f: T`Tramo ${run.tramo} de ${cfg.ciclos}`, fc: "", sub: nom, cae: false, prog: 0 };
  return { arriba: 0, t: jMmss(run.libre ? run.acum : 0), f: tx("Tramo listo"), fc: "foco", sub: nom, cae: false, prog: 1 };
}
function jPintarCentro() {
  jAsegurarReloj();
  const reloj = document.getElementById("jor-arena");
  if (!reloj) return;
  const R = J_RELOJES[reloj.dataset.tipo] || J_RELOJES.mediano, mid = R.v.mid, alto = mid - R.y0;
  const s = jEstadoCentro();
  if (s.arriba - jArribaAntes > 0.5 && !jVolteando) jVoltear();
  jArribaAntes = s.arriba;
  const p = jVolteando ? 1 : 1 - s.arriba;
  const yA = R.y0 + p * alto, yB = R.y1 - p * alto;
  const A = document.getElementById("jor-a-arriba"), B = document.getElementById("jor-a-abajo"), ch = document.getElementById("jor-chorro");
  A.setAttribute("y", yA); A.setAttribute("height", Math.max(0, mid - yA));
  B.setAttribute("y", yB); B.setAttribute("height", R.y1 - yB);
  ch.style.display = s.cae && !jVolteando && s.arriba > 0.01 ? "" : "none";
  ch.setAttribute("y2", Math.max(mid + 2, yB));
  reloj.classList.toggle("brasa", s.fc === "brasa");
  reloj.classList.toggle("pausa", s.fc === "pausa");
  document.getElementById("jor-tiempo").textContent = s.t;
  const f = document.getElementById("jor-fase");
  f.textContent = s.f; f.className = s.fc;
  document.getElementById("jor-sub").textContent = s.sub;
  jPintarFin(s);
}
/* ---- A qué hora acabas esto (0.7.107.3) ----
   La pidió Eduardo: hora de ahora + lo que le queda a la fase. Se calcula desde
   el reloj y no desde la hora a la que empezó, y esa es toda la gracia: así una
   pausa de diez minutos corre la hora diez minutos, que es lo que de verdad va
   a pasar.

   En pausa el rótulo lo dice —«si sigues»—, porque ahí el número no es una
   promesa: es lo que pasaría si le dieras a Seguir ahora mismo, y se va
   moviendo solo mientras no lo hagas.

   Va en la hora del PERFIL (`jMinDe` + `jH12`), no en la del reloj de la
   máquina: es la misma zona con la que se dibujan los bloques del día, y dos
   horas distintas en la misma pantalla no se pueden mirar juntas.

   Y los segundos se cortan hacia abajo —`jMinDe` lee hora y minuto— en vez de
   redondearse: si la fase acaba a las 10:46:44 todavía son las 10:46, y
   redondear escribiría una hora a la que la fase YA habría terminado. Ojo al
   compararlo con `jH12(jAhora())`, que sí redondea: por eso «ahora» puede ir un
   minuto por delante de la cuenta hecha a mano, y no es un error de la resta. */
function jPintarFin(s) {
  const el = document.getElementById("jor-fin");
  if (!el) return;
  const hay = s.resta > 0;
  el.hidden = !hay;
  if (!hay) { el.textContent = ""; return; }
  const hora = jH12(jMinDe(Date.now() + s.resta));
  el.textContent = s.fc === "pausa" ? T`Si sigues, acabas a las ${hora}` : T`Acabas a las ${hora}`;
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
  if (run && (run.fase === "foco" || run.fase === "descanso") && run.dur && run.seg && jTrans(run) >= run.dur && jPuedoCerrar(run)) jFinFase();
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
      jPintarRueda();   // el gajo que brilla cambia con el bloque de «ahora»
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
/* ---- Nada suena sin decir por qué (0.7.105.1) ----
   Antes la campana sonaba SIEMPRE y la explicación iba a un aviso dentro de
   la app, de dos segundos y medio: con la app de fondo sonaba algo y el porqué
   se lo llevaba una pestaña que nadie miraba. Ahora hay tres caminos y en los
   tres el sonido llega con su motivo:

     - app a la vista: campana y un aviso que dice «Pomodoro · …», con un
       botón para ir y diez segundos para leerlo;
     - app de fondo, con permiso: campana y el aviso del SISTEMA, que es lo que
       se ve fuera de la app;
     - app de fondo, sin permiso: NO suena. Se guarda, y al volver se dice
       «Mientras no estabas · …».

   `clave` hace que cada final de fase suene una sola vez aunque la sincronía
   traiga otra vez el mismo tramo, y `mio === false` es el dispositivo que no
   lleva el reloj: ese no suena nunca. */
const jSonados = new Set();
let jPendientes = [];
function jAvisar(titulo, texto, clave, mio) {
  if (mio === false) return;
  if (clave) { if (jSonados.has(clave)) return; jSonados.add(clave); }
  const t = tx("Pomodoro") + " · " + titulo;
  const vibrar = () => { try { if (navigator.vibrate) navigator.vibrate([180, 90, 180]); } catch (e) { /* sin vibración */ } };
  if (!document.hidden) {
    jCampana(); vibrar();
    toast(t + " · " + texto, "logro", { label: tx("Ver"), onclick: "irAModulo('jornada')", ms: 10000 });
    return;
  }
  const cfg = jDatos().cfg;
  if (cfg.notificar !== false && "Notification" in window && Notification.permission === "granted") {
    jCampana(); vibrar();
    const op = { body: texto, tag: "jornada", icon: "icon-192.png", badge: "icon-192.png" };
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(r => r.showNotification(t, op)).catch(() => { try { new Notification(t, op); } catch (e) { /* nada */ } });
    } else { try { new Notification(t, op); } catch (e) { /* nada */ } }
    return;
  }
  jPendientes.push(t + " · " + texto);
  jPendientes = jPendientes.slice(-3);
}
function jMostrarPendientes() {
  if (!jPendientes.length) return;
  const lista = jPendientes;
  jPendientes = [];
  lista.forEach((m, i) => setTimeout(() =>
    toast(T`Mientras no estabas · ${m}`, "logro", { label: tx("Ver"), onclick: "irAModulo('jornada')", ms: 10000 }), i * 400));
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
        ${sw("notificar", tx("Avisarme fuera de la app"), tx("Con un aviso del sistema que dice qué pasó"))}
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
    if (v === "notificar" && cfg.notificar && "Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission().then(p => {
        if (p !== "granted") { cfg.notificar = false; save(); jPintarHoja(); toast(tx("Sin permiso para avisar: el navegador lo tiene bloqueado"), "atencion"); }
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
  if (a === "hf-modo") { jHfCfg().hfModo = btn.dataset.v; save(); jPintar(); return; }
  if (a === "hf-paso") {
    const c = jHfCfg(), h = c.hf[c.hfModo], k = btn.dataset.k, d = Number(btn.dataset.d);
    /* Los minutos de descanso van de uno en uno hasta diez y luego de cinco:
       entre 3 y 4 minutos hay una diferencia; entre 43 y 44, no. */
    const salto = k === "foco" ? 5 : k === "rondas" ? 1 : (d > 0 ? (h.desc >= 10 ? 5 : 1) : (h.desc > 10 ? 5 : 1));
    const lim = { foco: [5, 180], desc: [1, 60], rondas: [1, 12] }[k];
    h[k] = Math.min(lim[1], Math.max(lim[0], h[k] + salto * d));
    save(); jPintar(); return;
  }
  if (a === "hf-nombre") {
    const m = btn.dataset.v;
    askText(tx("¿Cómo quieres llamarlo?"), jHfNombre(m), tx("Guardar"), tx("Déjalo vacío para volver al nombre de siempre."), 24).then(t => {
      if (t === null) return;
      const c = jHfCfg();
      if (t) c.hfNombres[m] = t; else delete c.hfNombres[m];
      save(); jPintar();
    });
    return;
  }
  if (a === "lite-go") return jIniciarLite();
  if (!j.run) return;
  if (a === "pausa") jPausa();
  if (a === "terminar") jTerminarLibre();
  if (a === "abandonar") jAbandonar();
  if (a === "lite-parar") jPararLite();
  if (a === "hf-reiniciar") jReiniciarFaseLite();
  if (a === "hf-saltar") jSaltarFaseLite();
  if (a === "saltar") { if (j.run.lite) jSaltarLite(); else jSiguiente(); }
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
  document.addEventListener("visibilitychange", () => { jPaso(); if (!document.hidden) jMostrarPendientes(); });
}
