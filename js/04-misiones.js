/* Misiones, proyectos, módulos, reordenar y navegación */
/* ================= Misiones =================
   Lo que haces hoy. Cada misión tiene su cadencia, su cuenta del día
   y su propia racha; al cumplirla suelta XP en la habilidad que entrena. */

const DAY_NAMES = ["D", "L", "M", "M", "J", "V", "S"];

function missionScheduledOn(m, key) {
  if (m.cadence === "once") return !m.completedAt;
  if (m.cadence === "weekly") return (m.days || []).includes(weekdayOfKey(key));
  return true;
}

function missionDueToday(m) {
  if (m.archived) return false;
  /* Traída a mano al día de hoy desde otro tablero: manda sobre la cadencia,
     pero solo por hoy. Mañana vuelve a decidir su cadencia. */
  if (m.paraHoy === todayKey()) return true;
  /* Apartada en otro tablero: está pospuesta, así que hoy no cuenta ni en la
     lista ni en el porcentaje del día. Ese es justo el precio de posponer, y
     el que hace que el número del día signifique algo. */
  if (m.tablero) return false;
  return missionScheduledOn(m, todayKey());
}

/* ================= Tableros de Misiones =================
   Misiones dejó de ser una lista larga para ser un tablero de columnas. Tres
   están siempre y no se pueden ni borrar ni renombrar, porque no son cosas
   que el usuario haya creado: son los tres estados por los que pasa una
   misión —hoy, esta semana, terminada—. El resto se los inventa él.

   La columna de una misión NO se guarda salvo que la muevas a mano: mientras
   nadie la toque, la decide su cadencia. Así una misión diaria aparece cada
   mañana en "Pendientes de hoy" sin que nadie la arrastre, que es de lo que
   va la app. `m.tablero` solo existe cuando alguien la apartó.

   "Cumplidas hoy" es la única que no recibe: se llega a ella cumpliendo la
   misión, no moviéndola… aunque soltarla ahí también la cumple, porque quien
   la arrastra hasta ahí está diciendo exactamente eso. */
const TABLEROS_FIJOS = [
  { id: "hoy",        nombre: "Pendientes de hoy" },
  { id: "hechas",     nombre: "Cumplidas hoy", soloConAlgo: true },
  { id: "semana",     nombre: "Pendientes de la semana" },
  { id: "terminadas", nombre: "Misiones terminadas" }
];

/* Los tres de siempre también se pueden llamar como uno quiera. Lo que no
   cambia es lo que significan —siguen siendo hoy, la semana y lo cerrado, y
   por eso su id no se toca—: solo cambia el rótulo. El nombre puesto a mano
   vive en la interfaz, no en el tablero, porque el tablero no existe como
   dato: existe como estado por el que pasa una misión. */
function tablerosDeMisiones() {
  const puestos = (state.ui && state.ui.nombresTablero) || {};
  const fijo = (id) => {
    const t = TABLEROS_FIJOS.find(x => x.id === id);
    return Object.assign({}, t, { nombre: puestos[id] || t.nombre, deFabrica: t.nombre });
  };
  const propios = (state.tableros || []).map(t => ({ id: t.id, nombre: t.nombre, propio: true }));
  return [fijo("hoy"), fijo("hechas"), fijo("semana"), ...propios, fijo("terminadas")];
}

function nombreTablero(id) {
  const t = tablerosDeMisiones().find(x => x.id === id);
  return t ? t.nombre : "otro tablero";
}

function tableroDeMision(m) {
  if (m.archived) return "terminadas";
  // `load()` ya devolvió al ciclo las que apuntaban a un tablero borrado
  if (m.tablero) return m.tablero;
  if (missionDueToday(m)) return missionDone(m, todayKey()) ? "hechas" : "hoy";
  return "semana";
}

/* ---- Cuánto lleva esperando ----
   Posponer no es gratis y tenía que verse. Se cuenta desde el día en que se
   apartó y sigue corriendo mientras siga fuera de hoy; al volver, los días
   se guardan sumados para que el periodo en que por fin se haga sepa lo que
   costó llegar hasta ahí. */
function diasPospuesta(m) {
  const p = m.pospuesta;
  if (!p) return 0;
  return (p.dias || 0) + (p.desde ? Math.max(0, daysBetween(p.desde, todayKey())) : 0);
}

function abrirPosposicion(m) {
  const p = m.pospuesta || (m.pospuesta = { dias: 0, veces: 0 });
  if (p.desde) return;                 // ya estaba fuera: el reloj no se reinicia
  p.desde = todayKey();
  p.veces = (p.veces || 0) + 1;
}

function cerrarPosposicion(m) {
  const p = m.pospuesta;
  if (!p || !p.desde) return;
  p.dias = (p.dias || 0) + Math.max(0, daysBetween(p.desde, todayKey()));
  delete p.desde;
  // Apartada y devuelta el mismo día: no llegó a pasar nada que contar
  if (!p.dias) delete m.pospuesta;
}

function fraseDias(n) { return n + (n === 1 ? " día" : " días"); }

/* Mueve una misión de columna y hace lo que ese movimiento significa. Devuelve
   el aviso que hay que dar, o "" cuando ya habló logMission por su cuenta. */
function moverMisionATablero(id, destino) {
  const m = state.missions.find(x => x.id === id);
  if (!m) return "";
  const key = todayKey();
  const origen = tableroDeMision(m);
  if (origen === destino) return "";

  /* Sacarla de las terminadas la devuelve a la vida ENTERA: no basta con
     quitarle el sello de guardada, hay que deshacer lo cumplido —el XP que
     dio, la racha, la marca del día—. Si no, una misión podría cobrarse dos
     veces con solo arrastrarla fuera y volver a meterla. Va callado: la
     sacudida de pantalla avisa de un tropiezo, y esto no lo es. */
  let revertida = false;
  if (origen === "terminadas") {
    m.archived = false;
    m.completedAt = null;
    const marcas = missionCount(m, key);
    if (marcas > 0) { logMission(m.id, -marcas, { silencioso: true }); revertida = true; }
  }

  if (destino === "hoy" || destino === "hechas") {
    delete m.tablero;
    m.paraHoy = key;
    cerrarPosposicion(m);
  } else if (destino === "terminadas") {
    delete m.tablero;
    delete m.paraHoy;
  } else {
    m.tablero = destino;
    delete m.paraHoy;
    abrirPosposicion(m);
  }

  const hecha = missionDone(m, key);

  /* Cumplir y descumplir se dejan en manos de logMission: es quien reparte el
     XP, mueve la racha y avisa. Repetir aquí esa cuenta sería tener dos
     versiones de la misma verdad. */
  if (destino === "hechas" && !hecha) {
    save();
    logMission(m.id, missionTarget(m) - missionCount(m, key));
    return "";
  }
  if (destino === "hoy" && hecha) {
    save();
    logMission(m.id, -missionCount(m, key));
    return "";
  }
  if (destino === "terminadas") {
    m.archived = true;
    m.completedAt = key;
    if (!hecha) {
      logMission(m.id, missionTarget(m) - missionCount(m, key));
      return "";
    }
    save();
    return `${m.name} queda terminada`;
  }

  const espera = diasPospuesta(m);
  const deshecho = revertida ? " · se deshizo lo cumplido" : "";
  save();
  if (destino === "semana" || m.tablero) {
    return espera > 0
      ? `${m.name} a ${nombreTablero(destino)} · lleva ${fraseDias(espera)} esperando`
      : `${m.name} a ${nombreTablero(destino)}${deshecho}`;
  }
  return `${m.name} vuelve a hoy${deshecho}`;
}

/* ---- Los tableros propios ---- */
async function crearTableroMisiones() {
  const nombre = await askText("Nuevo tablero", "", "Crear",
    "Un sitio donde apartar misiones: un proyecto, un ámbito, lo que quieras.", 28);
  if (!nombre) return;
  state.tableros = state.tableros || [];
  state.tableros.push({ id: uid(), nombre });
  save();
  renderMissions();
  toast(`Tablero "${nombre}" creado`, "hecho");
}

async function renombrarTableroMisiones(id) {
  const propio = (state.tableros || []).find(x => x.id === id);
  const fijo = !propio && TABLEROS_FIJOS.find(x => x.id === id);
  if (!propio && !fijo) return;
  const actual = propio ? propio.nombre : ((state.ui && state.ui.nombresTablero && state.ui.nombresTablero[id]) || fijo.nombre);

  const nombre = await askText(
    `Renombrar "${actual}"`, actual, "Renombrar",
    fijo ? `Déjalo vacío para volver a "${fijo.nombre}".` : "", 28);
  if (nombre === null || nombre === actual) return;

  if (propio) {
    if (!nombre) return;              // un tablero propio sin nombre no se puede dibujar
    propio.nombre = nombre;
  } else {
    state.ui = state.ui || {};
    state.ui.nombresTablero = state.ui.nombresTablero || {};
    if (nombre) state.ui.nombresTablero[id] = nombre;
    else delete state.ui.nombresTablero[id];
  }
  save();
  renderMissions();
  toast(`Ahora se llama "${nombre || fijo.nombre}"`, "hecho");
}

async function borrarTableroMisiones(id) {
  const t = (state.tableros || []).find(x => x.id === id);
  if (!t) return;
  const dentro = state.missions.filter(m => m.tablero === id);
  const ok = await ask(
    (dentro.length
      ? `Se borra el tablero "${t.nombre}". ${dentro.length === 1
          ? "La misión que tiene dentro no se pierde: vuelve a su sitio de siempre, según toque hoy o no."
          : `Las ${dentro.length} misiones que tiene dentro no se pierden: vuelven a su sitio de siempre, según toquen hoy o no.`}`
      : `Se borra el tablero "${t.nombre}", que está vacío.`),
    "Borrar el tablero", true);
  if (!ok) return;
  dentro.forEach(m => { delete m.tablero; cerrarPosposicion(m); });
  state.tableros = state.tableros.filter(x => x.id !== id);
  save();
  renderMissions();
  toast(`Tablero "${t.nombre}" borrado`, "hecho");
}

/* Tolera el formato viejo (un número) además del nuevo (lista de marcas):
   `load()` migra, pero esto también lo lee un estado remoto recién bajado que
   todavía no ha pasado por ahí. */
function missionCount(m, key) {
  const v = m.log && m.log[key];
  return Array.isArray(v) ? v.length : (Number(v) || 0);
}
function missionTarget(m) { return Math.max(1, m.target || 1); }
function missionDone(m, key) { return missionCount(m, key) >= missionTarget(m); }

/* Días seguidos cumpliéndola, saltando los días en que no tocaba. */
function missionStreak(m) {
  let n = 0;
  let k = todayKey();
  if (!missionDone(m, k)) k = addDaysKey(k, -1);
  let guard = 400;
  while (guard-- > 0) {
    if (m.createdAt && k < m.createdAt) break;
    if (!missionScheduledOn(m, k)) { k = addDaysKey(k, -1); continue; }
    if (!missionDone(m, k)) break;
    n++;
    k = addDaysKey(k, -1);
  }
  return n;
}

/* `opciones.silencioso` la deja hacer su trabajo —XP, racha, marcas del día—
   sin avisar ni sacudir la pantalla. Lo usa quien ya va a decir por su cuenta
   lo que pasó: sacar una misión de las terminadas deshace lo cumplido, pero
   eso no es un error que merezca una sacudida, es exactamente lo que pediste
   al arrastrarla. */
function logMission(id, delta, opciones) {
  const op = opciones || {};
  const m = state.missions.find(x => x.id === id);
  if (!m) return;
  const key = todayKey();
  m.log = m.log || {};
  const target = missionTarget(m);
  const before = missionCount(m, key);
  const after = clamp(before + delta, 0, target);
  if (after === before) return;
  /* Cada vez que se marca nace una marca con identidad propia, y al
     desmarcar se retira la última. El número sale de contarlas, no se guarda:
     un contador y una lista pueden desincronizarse, y entonces la fusión
     entre dispositivos deja de tener una verdad a la que agarrarse. */
  const marcas = Array.isArray(m.log[key]) ? m.log[key].slice() : [];
  while (marcas.length > after) marcas.pop();
  while (marcas.length < after) marcas.push(uid());
  if (marcas.length) m.log[key] = marcas; else delete m.log[key];

  const wasDone = before >= target;
  const nowDone = after >= target;

  /* Los días que estuvo esperando se cobran aquí: al cumplirla. Es el
     "periodo donde corresponde" —el de verdad, no aquel en el que debía
     haberse hecho— y por eso la cuenta se cierra en este momento y no antes.
     Queda apuntada en la misión para poder decirlo: en el aviso de ahora y
     en su tarjeta mientras siga a la vista. */
  const esperaba = nowDone && !wasDone ? diasPospuesta(m) : 0;
  if (nowDone && !wasDone) {
    if (m.skillId && m.xp) {
      const s = state.skills.find(x => x.id === m.skillId);
      if (s) addXp(s, m.xp, `Misión cumplida: ${m.name}`, `Misión · ${m.name}`);
    }
    if (esperaba > 0) {
      m.pospuestaUltima = { dias: esperaba, veces: (m.pospuesta && m.pospuesta.veces) || 1, cerradaEl: key };
    }
    delete m.pospuesta;
    if (m.cadence === "once") { m.completedAt = key; m.archived = true; }
  }
  if (!nowDone && wasDone) {
    // Revertir un cumplido resta el mismo XP que dio, para que marcar y
    // desmarcar varias veces en el día no infle la habilidad de gratis.
    if (m.skillId && m.xp) {
      const s = state.skills.find(x => x.id === m.skillId);
      if (s) removeXp(s, m.xp, `Misión revertida: ${m.name}`, `Misión · ${m.name}`);
    }
    if (m.cadence === "once") { m.completedAt = null; m.archived = false; }
    /* Deshacer el cumplido devuelve también la espera que se había saldado:
       si no, quitar y volver a poner la palomita borraría de la memoria los
       días que costó llegar hasta ahí. */
    const u = m.pospuestaUltima;
    if (u && u.cerradaEl === key) {
      m.pospuesta = { dias: u.dias, veces: u.veces };
      delete m.pospuestaUltima;
    }
    // Deshacer algo ya logrado merece notarse: sin esto, quitar una misión
    // cumplida y quitar una a medias se sentían exactamente igual.
    if (!op.silencioso) sacudirPantalla();
  }
  save();
  repintarTrasMision();
  if (op.silencioso) return;

  if (delta > 0) checkStreakMilestone();

  if (nowDone && !wasDone) {
    const st = missionStreak(m);
    if (st > 0 && st % 7 === 0) {
      celebrate(`${st} días seguidos`, m.name, m.color || "#5fe0b0", m.icon);
    } else {
      toast(`${m.name} cumplida${m.xp ? ` · +${m.xp} XP` : ""}${st > 1 ? ` · racha ${st}` : ""}${
        esperaba > 0 ? ` · tras ${fraseDias(esperaba)} esperando` : ""}`, "logro");
    }
  } else if (delta > 0) {
    toast(`${m.name}: ${after} de ${target}`, "hecho");
  } else {
    toast(`${m.name}: ${after} de ${target}`, "deshecho", { label: "Rehacer", onclick: `logMission('${m.id}', 1)` });
  }
}

/* Cumplir una misión se puede hacer desde dos pantallas: su tablero y la
   tarjeta del Resumen. Repintar siempre Misiones dejaba el Resumen congelado
   —marcabas ahí una misión y no pasaba absolutamente nada a la vista, aunque
   por dentro ya estuviera cumplida—. Se repinta la que se está mirando. */
function repintarTrasMision() {
  if (activeMainView === "summary") renderSummary();
  else renderMissions();
}

/* ---- Sacudida ----
   Se aplica a .app y no a body porque las capas fijas (menú, modales) no
   deben moverse: lo que se sacude es el contenido, no la interfaz entera. */
function sacudirPantalla() {
  const app = document.querySelector(".app");
  if (!app) return;
  app.classList.remove("sacude");
  void app.offsetWidth;                 // reinicia la animación
  app.classList.add("sacude");
  setTimeout(() => app.classList.remove("sacude"), 480);
  if (userHasTapped && navigator.vibrate) navigator.vibrate([18, 40, 18]);
}

/* ================= El círculo de una misión =================
   Dice, sin una sola palabra, qué pasa si lo pulsas. Y sobre todo: en
   reposo NO dice nada que no sea verdad.

   Hubo una versión con la palomita puesta en tenue mientras la misión
   seguía pendiente, como pista de que ahí se marcaba. Era mala idea: una
   palomita, por pálida que esté, se lee como "ya está" — daba una victoria
   falsa al repasar la lista de un vistazo, que es justo el momento en que
   uno confía en el símbolo y no en el matiz. Un círculo pendiente se queda
   vacío. La pista solo aparece cuando el cursor está encima, que es cuando
   ya hay una intención detrás y no puede confundirse con un estado.

   Con ratón, entonces, el relevo adelanta lo que hará el clic: palomita si
   está por cumplir, flecha de retorno si ya está hecha, "+1" si lleva
   cuenta. Sin ratón el círculo se limita a mostrar el estado real.

   La diferencia entre las dos clases de misión no es un capricho. En una de
   un solo golpe, deshacer es revertirla entera y cabe en el propio círculo.
   En una de cuenta, quitar una vez no es lo mismo que revertirla, así que
   esa se queda en su etiqueta aparte y el círculo solo suma.

   Vive aquí y no dentro de renderMissions porque lo usan tres pantallas
   —la lista de hoy, el resumen y las guardadas— y separado se desincronizan. */

const PALOMITA = `<svg viewBox="0 0 24 24"><path d="M5 12.5l5 5L19 7"/></svg>`;
const VOLVER = `<svg viewBox="0 0 24 24"><path d="M9 14L4 9l5-5"/><path d="M4 9h10a5 5 0 010 10h-2"/></svg>`;

/* El icono que se elige al crear la misión. Hasta ahora se guardaba y no se
   veía en ninguna parte: se elegía a ciegas y no servía de nada.

   Va FUERA del círculo a propósito. Ese círculo es el control —la palomita,
   el +1, el deshacer— y su cara en reposo ya dice el estado: vacío si falta,
   "3/5" si lleva cuenta, palomita si está hecha. Metiendo ahí la identidad de
   la misión habría que quitar una de esas tres cosas, y son justo las que se
   leen de un vistazo. Así que el icono va al lado, con el mismo dibujo que el
   de una habilidad: cuadrado teñido de su propio color. */
function iconoMision(m) {
  const col = m.color || "#5fe0b0";
  return `<span class="ms-ic" style="background:${col}22;color:${col}" aria-hidden="true">${icon(m.icon || "target", 16)}</span>`;
}

function botonMision(m, c, t, opciones) {
  const o = opciones || {};
  const ok = c >= t;
  const cuenta = t > 1;
  let base = "", sobre = "", accion, etiqueta, apagado = false;

  if (o.reabrir) {                       // misión guardada: solo se puede reabrir
    base = PALOMITA; sobre = VOLVER;
    accion = `logMission('${m.id}', -1)`;
    etiqueta = `Reabrir ${m.name}`;
  } else if (cuenta) {
    base = ok ? PALOMITA : `<span class="ms-count">${c}<i>/${t}</i></span>`;
    if (ok) { etiqueta = `${m.name}: completada hoy`; apagado = true; }
    else {
      sobre = `<span class="ms-mas">+1</span>`;
      accion = `logMission('${m.id}', 1)`;
      etiqueta = `Sumar una vez a ${m.name}`;
    }
  } else if (ok) {
    base = PALOMITA; sobre = VOLVER;
    accion = `logMission('${m.id}', -1)`;
    etiqueta = `Deshacer ${m.name}`;
  } else {
    base = "";                           // pendiente: el círculo se queda vacío
    sobre = PALOMITA;
    accion = `logMission('${m.id}', 1)`;
    etiqueta = `Cumplir ${m.name}`;
  }

  return `<button class="ms-check ${sobre ? "muda" : ""}" ${apagado ? "disabled" : `onclick="${accion}"`}
    aria-label="${escapeAttr(etiqueta)}" title="${escapeAttr(etiqueta)}">
    <span class="ms-base">${base}</span>
    ${sobre ? `<span class="ms-sobre">${sobre}</span>` : ""}
  </button>`;
}

/* ================= Reordenar arrastrando =================
   Un solo comportamiento para todas las listas que se acomodan a mano.

   La forma de EMPEZAR cambia según el dispositivo, porque el gesto disponible
   es distinto. Con ratón basta desplazar el puntero unos píxeles: el clic y
   el arrastre se distinguen solos, así que obligar a esperar sería una
   molestia gratuita. Con el dedo hace falta la pulsación sostenida, porque
   ahí el mismo gesto sirve también para recorrer la lista y en el primer
   píxel no hay manera de saber cuál de los dos se quiso hacer.

   Lo que sí es igual en los dos: el modo dura lo que dura el arrastre. Se
   suelta la pieza y se acabó — no hay un "Listo" que haya que ir a buscar
   para volver a la normalidad. Y mientras se mueve, la pieza va flotando
   bajo el dedo y deja su hueco marcado en la lista, que es lo que hace
   entender de un vistazo qué se está moviendo y dónde va a caer.

   Cada pieza se identifica con data-rid; el contenedor recibe el orden ya
   resuelto cuando se suelta. */

const REORD_ESPERA = 400;   // ms de pulsación sostenida, solo en táctil
const REORD_UMBRAL = 6;     // px que separan un clic de un arrastre

/* Un arrastre no debe además activar lo que hubiera bajo el dedo: sin esto,
   mover una habilidad terminaría abriendo su ficha al soltarla.

   El filtro es un oyente permanente en fase de captura que mira la hora del
   último arrastre, no uno de usar y tirar. La primera versión ponía el
   oyente al soltar y repintaba la lista en ese mismo instante, y así no
   funcionaba: al rehacer la lista la tarjeta quedaba desconectada del
   documento, y el clic que el navegador sintetiza al soltar ya no subía
   hasta aquí. Por eso el repintado ahora espera un turno (ver reordSoltar):
   mientras llega el clic, la lista tiene que seguir en pie. */
let reordFin = 0;

function filtrarClicTrasArrastre(ev) {
  if (Date.now() - reordFin < 350) { ev.stopPropagation(); ev.preventDefault(); }
}

/* Solo puede haber un arrastre a la vez, así que el estado vive aquí y los
   oyentes de ventana se instalan UNA vez al final del archivo. Colgarlos
   dentro de hacerReordenable los duplicaría en cada repintado, porque las
   listas se rehacen enteras y el contenedor de antes se tira. */
let reord = null;

/* Un mismo contenedor puede tener DOS cosas que se arrastran: en Proyectos,
   las tarjetas y las ramas que las agrupan. Se distinguen por el selector y
   por `permitido`, que reparte el gesto según dónde empezó —la cabecera de
   la rama la mueve entera; cualquier otro sitio mueve la tarjeta—. Por eso
   la marca de "ya registrado" guarda los selectores en vez de un sí o un no:
   con un sí o un no, el segundo registro se perdía en silencio. */
function hacerReordenable(cont, sel, alSoltar, permitido) {
  if (!cont) return;
  const ya = (cont.dataset.reord || "").split("|");
  if (ya.includes(sel)) return;
  cont.dataset.reord = [...ya.filter(Boolean), sel].join("|");

  cont.addEventListener("pointerdown", (e) => {
    if (e.button) return;                       // solo el botón principal
    if (permitido && !permitido(e)) return;
    const el = e.target.closest(sel);
    if (!el || !cont.contains(el)) return;
    reord = {
      cont, sel, alSoltar, pieza: el, flota: null, off: null,
      inicio: { x: e.clientX, y: e.clientY }, espera: null, activo: false
    };
    if (!isDesktop()) reord.espera = setTimeout(() => reordArrancar(e), REORD_ESPERA);
  });

  /* En táctil, frenar el desplazamiento de la página necesita un oyente de
     touchmove no pasivo: preventDefault sobre el evento de puntero no basta
     una vez que el navegador ya decidió que el gesto era un scroll. */
  cont.addEventListener("touchmove", (e) => { if (reord && reord.activo) e.preventDefault(); }, { passive: false });
}

function reordArrancar(e) {
  if (!reord) return;
  reord.espera = null;
  reord.activo = true;
  reord.cont.classList.add("reordenando");
  const r = reord.pieza.getBoundingClientRect();
  const flota = reord.pieza.cloneNode(true);
  flota.classList.add("arr-flota");
  flota.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;margin:0;pointer-events:none;z-index:400`;
  reord.off = { x: e.clientX - r.left, y: e.clientY - r.top };
  document.body.appendChild(flota);
  reord.flota = flota;
  /* El latido va SIEMPRE, haya carril o no: aunque no exista un tablero que
     empujar de lado, la página se arrastra sola al llegar al borde y eso hace
     falta en cualquier lista larga. */
  reord.carril = reord.cont.querySelector("[data-carril]");
  reord.latido = setInterval(latidoCarril, 30);
  reord.pieza.classList.add("arr-hueco");
  /* Ver `.reordenando .arr-pieza` en los estilos: mientras dure el arrastre,
     las piezas hermanas son lo único que sigue respondiendo al puntero. */
  reord.cont.querySelectorAll(reord.sel).forEach(el => el.classList.add("arr-pieza"));
  if (userHasTapped && navigator.vibrate) navigator.vibrate(12);
}

/* ---- El tablero que no cabe en la pantalla ----
   Las columnas de Misiones se salen de lo ancho, así que la de destino puede
   estar fuera de vista al empezar a arrastrar. Al acercarse a un borde, el
   carril se desplaza solo.

   Es un latido aparte y no un empujón por cada movimiento del puntero: quien
   arrastra hasta el borde se queda ahí quieto esperando a que llegue la
   columna, y sin latido no llegaría nunca. */
const CARRIL_MARGEN = 78;      // px desde el borde donde empieza a arrastrar
const CARRIL_PASO = 14;        // px por latido
const BORDE_PAGINA = 92;       // px del borde de la pantalla que arrastran la página

function empujarCarril(e) {
  if (!reord) return;
  reord.raton = { x: e.clientX, y: e.clientY };
}

function latidoCarril() {
  if (!reord || !reord.activo || !reord.raton) return;
  const { x, y } = reord.raton;
  if (reord.carril) {
    const r = reord.carril.getBoundingClientRect();
    if (x > r.right - CARRIL_MARGEN) reord.carril.scrollLeft += CARRIL_PASO;
    else if (x < r.left + CARRIL_MARGEN) reord.carril.scrollLeft -= CARRIL_PASO;
  }
  /* Una columna que se desplaza por dentro se recorre sola cuando el dedo
     llega a su borde. Desde que el tablero llega hasta abajo de la pantalla,
     una columna con muchas misiones esconde su final: sin esto, para poner
     algo al fondo habría que soltarlo, desplazar y volver a agarrarlo. */
  const bajo = document.elementFromPoint(x, y);
  const zona = bajo && bajo.closest("[data-soltar]");
  if (zona && zona.scrollHeight > zona.clientHeight + 4) {
    const rz = zona.getBoundingClientRect();
    if (y > rz.bottom - 48) { zona.scrollTop += CARRIL_PASO; return; }
    if (y < rz.top + 48) { zona.scrollTop -= CARRIL_PASO; return; }
  }

  /* Y la página entera, hacia arriba y hacia abajo. En el teléfono los
     tableros van apilados: el de destino casi nunca cabe en la misma
     pantalla que el de origen, y sin esto no habría forma de llegar hasta
     él sin soltar la tarjeta. En la computadora hace lo mismo con las ramas
     de Proyectos, que también se apilan.

     La pieza que va bajo el dedo está en posición fija, así que se queda
     quieta mientras el contenido pasa por debajo: exactamente lo que se
     espera al arrastrar algo hasta el borde. */
  if (y > innerHeight - BORDE_PAGINA) scrollBy(0, CARRIL_PASO);
  else if (y < BORDE_PAGINA) scrollBy(0, -CARRIL_PASO);
}

function reordMover(e) {
  if (!reord) return;
  const lejos = Math.hypot(e.clientX - reord.inicio.x, e.clientY - reord.inicio.y);
  if (reord.espera) {
    // Se movió antes de tiempo: era desplazar la lista, no agarrar la pieza
    if (lejos > 10) { clearTimeout(reord.espera); reord = null; }
    return;
  }
  if (!reord.activo) {
    if (lejos <= REORD_UMBRAL) return;
    reordArrancar(e);
  }
  e.preventDefault();
  const { cont, sel, pieza, flota, off } = reord;
  flota.style.left = (e.clientX - off.x) + "px";
  flota.style.top = (e.clientY - off.y) + "px";

  empujarCarril(e);

  const bajo = document.elementFromPoint(e.clientX, e.clientY);
  const sobre = bajo && bajo.closest(sel);
  if (!sobre || sobre === pieza || !cont.contains(sobre)) {
    /* No hay ninguna pieza debajo, pero puede haber una lista que acepte lo
       que se trae: una columna vacía, o el hueco que queda bajo la última
       tarjeta. Sin esto, un tablero recién creado no podría recibir jamás su
       primera misión —no hay contra qué colocarse— y arrastrar al final de
       una columna obligaba a apuntar a la mitad de abajo de la última. */
    /* La zona dice QUÉ acepta, y solo se mira si es de lo que se trae. Sin
       eso, arrastrar una rama entera de Proyectos por encima de una lista de
       encargos intentaba meter la rama dentro de sí misma y el navegador
       tumbaba la app ("el hijo nuevo contiene al padre"). La segunda guarda
       es de cinturón: nada puede caer dentro de sí mismo. */
    const zona = bajo && bajo.closest(`[data-soltar="${sel}"]`);
    if (!zona || !cont.contains(zona) || pieza.contains(zona)) return;
    const piezas = [...zona.querySelectorAll(sel)].filter(x => x !== pieza);
    const ultima = piezas[piezas.length - 1];
    if (!ultima) { if (pieza.parentNode !== zona) zona.appendChild(pieza); return; }
    if (e.clientY > ultima.getBoundingClientRect().bottom) zona.appendChild(pieza);
    return;
  }
  const items = [...cont.querySelectorAll(sel)];
  const i = items.indexOf(pieza), j = items.indexOf(sobre);
  if (i < 0 || j < 0) return;
  /* Se inserta en la lista de la pieza que está debajo, no en el contenedor:
     así el mismo gesto sirve para ordenar dentro de un grupo y para mudar la
     pieza a otro. Cuando solo hay una lista, su padre ES el contenedor y esto
     se comporta exactamente igual que antes. */
  const destino = sobre.parentNode;
  if (j < i) destino.insertBefore(pieza, sobre);
  else destino.insertBefore(pieza, sobre.nextSibling);
}

function reordSoltar() {
  if (!reord) return;
  const { cont, sel, alSoltar, pieza, flota, espera, activo, latido } = reord;
  reord = null;
  if (espera) clearTimeout(espera);
  if (latido) clearInterval(latido);
  if (!activo) return;
  if (flota) flota.remove();
  pieza.classList.remove("arr-hueco");
  cont.querySelectorAll(".arr-pieza").forEach(el => el.classList.remove("arr-pieza"));
  cont.classList.remove("reordenando");
  reordFin = Date.now();
  const ids = [...cont.querySelectorAll(sel)].map(el => el.dataset.rid);
  /* El orden ya está bien en pantalla —las piezas se movieron durante el
     arrastre—, así que repintar puede esperar un turno. Ese turno es justo
     lo que necesita el clic sintetizado al soltar para encontrar viva la
     tarjeta y poder ser filtrado. */
  setTimeout(() => alSoltar(ids), 0);
}

/* Pista de uso: el gesto no es el mismo en cada dispositivo, así que el texto
   tampoco puede serlo. */
function pistaReordenar() {
  return isDesktop() ? "Arrastra para reordenar" : "Mantén pulsada una para reordenar";
}

/* ---- Orden guardado, común a misiones y habilidades ---- */
function ordenarPor(lista, clave) {
  const orden = (state.ui && state.ui[clave]) || [];
  return [...lista].sort((a, b) => {
    const ia = orden.indexOf(a.id), ib = orden.indexOf(b.id);
    return (ia < 0 ? 1e9 : ia) - (ib < 0 ? 1e9 : ib);
  });
}

function guardarOrden(clave, ids) {
  state.ui = state.ui || {};
  const previo = state.ui[clave] || [];
  // Las que no están en pantalla ahora conservan su sitio relativo
  state.ui[clave] = [...ids, ...previo.filter(id => !ids.includes(id))];
  save();
}

function ordenarMisiones(lista) { return ordenarPor(lista, "misionOrden"); }

/* El arrastre ya no vive dentro de una sola lista: se engancha a la pantalla
   entera porque ahora cruza columnas, y cambiar de columna no es acomodar —es
   posponer, cumplir o cerrar la misión—. */
function attachMisionOrden() {
  hacerReordenable(document.getElementById("missions-content"), ".ms-card", alSoltarMisiones);
}

/* Se lee el DOM y no se calcula: el arrastre ya dejó cada tarjeta donde toca,
   así que lo que se ve ES el resultado. */
function alSoltarMisiones() {
  const orden = [];
  const cambios = [];
  document.querySelectorAll("#missions-content .ms-list[data-tablero]").forEach(lista => {
    const destino = lista.dataset.tablero;
    lista.querySelectorAll(".ms-card").forEach(el => {
      const m = state.missions.find(x => x.id === el.dataset.rid);
      if (!m) return;
      orden.push(m.id);
      if (tableroDeMision(m) !== destino) cambios.push({ id: m.id, destino });
    });
  });
  guardarOrden("misionOrden", orden);
  /* Un arrastre mueve UNA tarjeta, así que como mucho hay un cambio de
     columna. Se recorren todos por si acaso, pero solo avisa el primero:
     una pila de avisos por un solo gesto sería ruido. */
  let aviso = "";
  cambios.forEach((c, i) => {
    const msg = moverMisionATablero(c.id, c.destino);
    if (i === 0) aviso = msg;
  });
  renderMissions();
  if (aviso) toast(aviso, "hecho");
}

function todayMissionStats() {
  const key = todayKey();
  const due = state.missions.filter(missionDueToday);
  const done = due.filter(m => missionDone(m, key));
  return { due, done, pct: due.length ? Math.round(done.length / due.length * 100) : 0 };
}

/* ================= Proyectos =================
   Cada proyecto vive en una rama de trabajo y avanza por etapas.
   La app calcula su "salud" para ayudarte a decidir qué sigue vivo
   y qué conviene soltar. */

const PROJECT_STATUS = {
  active:  { label: "En marcha", color: "var(--mint)", soft: "var(--mint-soft)" },
  paused:  { label: "En pausa", color: "var(--muted)", soft: "rgba(139,153,165,0.14)" },
  done:    { label: "Terminado", color: "var(--mint)", soft: "var(--mint-soft)" },
  dropped: { label: "Descartado", color: "var(--coral)", soft: "var(--coral-soft)" }
};

function projectProgress(pr) {
  const st = pr.steps || [];
  if (!st.length) return 0;
  return Math.round(st.filter(s => s.done).length / st.length * 100);
}

function daysIdle(pr) {
  return daysBetween(pr.lastActivity || pr.createdAt, todayKey());
}

/* Veredicto honesto: avance real contra tiempo sin tocarlo. */
function projectHealth(pr) {
  if (pr.status === "done") return { key: "done", label: "Terminado", color: "var(--mint)", note: "Cerrado y guardado en tu historial." };
  if (pr.status === "dropped") return { key: "dropped", label: "Descartado", color: "var(--coral)", note: "Lo soltaste. Puedes retomarlo cuando quieras." };
  if (pr.status === "paused") return { key: "paused", label: "En pausa", color: "var(--muted)", note: "Congelado a propósito: no cuenta como abandonado." };
  const idle = daysIdle(pr);
  const prog = projectProgress(pr);
  if (idle >= 45 && prog < 60) {
    return { key: "stalled", label: "Estancado", color: "var(--coral)",
      note: `${idle} días sin avance y solo ${prog}% hecho. Sé honesto: ¿lo retomas esta semana o lo sueltas?` };
  }
  if (idle >= 21) {
    return { key: "cooling", label: "Enfriándose", color: "var(--fire)",
      note: `${idle} días sin tocarlo. Una etapa pequeña bastaría para revivirlo.` };
  }
  if (prog >= 80) {
    return { key: "closing", label: "Casi listo", color: "var(--mint)",
      note: "Estás a nada de cerrarlo. Termina las etapas que faltan." };
  }
  return { key: "healthy", label: "Con ritmo", color: "var(--mint)",
    note: idle === 0 ? "Le diste avance hoy." : `Último avance hace ${idle} día${idle === 1 ? "" : "s"}.` };
}

function projectLog(pr, event) {
  pr.history = pr.history || [];
  pr.history.unshift({ date: todayKey(), at: stamp(), event });
  pr.lastActivity = todayKey();
}

function toggleStep(prId, stepId) {
  const pr = state.projects.find(x => x.id === prId);
  if (!pr) return;
  const s = pr.steps.find(x => x.id === stepId);
  if (!s) return;
  s.done = !s.done;
  s.at = s.done ? stamp() : null;
  projectLog(pr, `${s.done ? "Etapa completada" : "Etapa reabierta"}: ${s.name}`);
  if (pr.status === "paused" && s.done) {
    pr.status = "active";
    projectLog(pr, "Retomado al avanzar una etapa");
  }
  save();
  const prog = projectProgress(pr);
  renderProjectDetail();
  if (prog === 100 && s.done) {
    toast("Todas las etapas listas — ciérralo cuando quieras", "logro");
  } else {
    toast(`${pr.name}: ${prog}%`, "hecho");
  }
}

async function addStepTo(prId) {
  const pr = state.projects.find(x => x.id === prId);
  const input = document.getElementById("detail-new-step");
  const name = input.value.trim();
  if (!name) { toast("Escribe el nombre de la etapa", "atencion"); return; }
  pr.steps.push({ id: uid(), name, done: false, at: null });
  projectLog(pr, `Etapa añadida: ${name}`);
  save();
  renderProjectDetail();
}

function removeStep(prId, stepId) {
  const pr = state.projects.find(x => x.id === prId);
  const s = pr.steps.find(x => x.id === stepId);
  if (!s) return;
  pr.steps = pr.steps.filter(x => x.id !== stepId);
  projectLog(pr, `Etapa eliminada: ${s.name}`);
  save();
  renderProjectDetail();
}

async function setProjectStatus(prId, status) {
  const pr = state.projects.find(x => x.id === prId);
  if (!pr) return;
  const labels = {
    active: ["¿Retomar este encargo?", "Retomar"],
    paused: ["¿Poner el encargo en pausa? No contará como abandonado mientras esté pausado.", "Pausar"],
    done: ["¿Dar por terminado este encargo? Se guardará en tu historial y ganarás el XP.", "Terminarlo"],
    dropped: ["¿Descartar este encargo? Deja de pedirte atención, pero queda guardado por si lo retomas.", "Descartar"]
  };
  const [msg, ok] = labels[status];
  if (!await ask(msg, ok, status === "dropped")) return;

  pr.status = status;
  projectLog(pr, { active: "Encargo retomado", paused: "Encargo pausado", done: "Encargo terminado", dropped: "Encargo descartado" }[status]);

  if (status === "done") {
    pr.completedAt = todayKey();
    if (pr.skillId && pr.xpReward) {
      const s = state.skills.find(x => x.id === pr.skillId);
      if (s) addXp(s, pr.xpReward, `Proyecto terminado: ${pr.name}`, `Proyecto · ${pr.name}`);
    }
    save();
    celebrate("Encargo terminado", pr.name, pr.color || "#5fe0b0", pr.icon);
  } else {
    save();
    toast({ active: "Encargo retomado", paused: "Encargo en pausa", dropped: "Encargo descartado" }[status], status === "active" ? "hecho" : "deshecho");
  }
  renderProjectDetail();
}

/* ================= Módulos =================
   Llamamos "módulos" a las cuatro secciones madre del menú: Misiones,
   Habilidades, Talentos y Proyectos. Se pueden apagar, porque no todo el
   mundo lleva proyectos ni quiere un árbol de talentos, y un menú con
   cosas que nunca abres es ruido.

   Resumen y Ajustes no están en la lista a propósito: el primero es la
   puerta de entrada y el segundo es el único sitio desde donde se vuelven
   a encender. Apagar ese par dejaría al usuario sin salida. */

const MODULOS = [
  { id: "missions", nav: "nav-missions", label: "Misiones",    hint: "Lo que haces hoy, con su racha" },
  { id: "home",     nav: "nav-home",     label: "Habilidades", hint: "Lo que practicas y sube de nivel" },
  { id: "tree",     nav: "nav-tree",     label: "Talentos",    hint: "Metas con inversión de dinero real" },
  { id: "projects", nav: "nav-projects", label: "Proyectos",   hint: "Lo que avanza por etapas" }
];

/* A qué módulo pertenece cada vista, incluidas sus pantallas hijas: si
   Talentos está apagado, tampoco debe poder abrirse la ficha de un talento
   por un enlace viejo del Resumen. */
const VISTA_MODULO = {
  missions: "missions", "mission-form": "missions",
  home: "home", detail: "home", form: "home", catalog: "home",
  tree: "tree", perk: "tree", "perk-form": "tree",
  projects: "projects", project: "projects", "project-form": "projects"
};

function moduloOn(id) {
  const off = (state.ui && state.ui.modulosOff) || [];
  return !off.includes(id);
}

function aplicarModulos() {
  MODULOS.forEach(m => {
    const el = document.getElementById(m.nav);
    if (el) el.style.display = moduloOn(m.id) ? "" : "none";
  });
}

function setModulo(id, on) {
  state.ui = state.ui || {};
  const off = new Set(state.ui.modulosOff || []);
  if (on) off.delete(id); else off.add(id);
  if (off.size >= MODULOS.length) { toast("Deja al menos un módulo encendido", "atencion"); return; }
  state.ui.modulosOff = [...off];
  save();
  aplicarModulos();
  renderModulos();
  if (!on && VISTA_MODULO[activeMainView] === id) showView("summary");
  else renderSummary();
  toast(on ? `${MODULOS.find(m => m.id === id).label} vuelve al menú` : "Oculto · puedes traerlo de vuelta aquí", on ? "hecho" : "deshecho");
}

function renderModulos() {
  const el = document.getElementById("modulos-list");
  if (!el) return;
  el.innerHTML = MODULOS.map(m => {
    const on = moduloOn(m.id);
    return `
    <button class="mod-row ${on ? "on" : ""}" onclick="setModulo('${m.id}', ${!on})">
      <span class="mod-tx"><b>${escapeHtml(m.label)}</b><span>${escapeHtml(m.hint)}</span></span>
      <span class="mod-sw"><i></i></span>
    </button>`;
  }).join("");
}

/* ================= Navegación ================= */

const NAV_VIEWS = { summary: "nav-summary", missions: "nav-missions", home: "nav-home", tree: "nav-tree", projects: "nav-projects", settings: "nav-settings-side" };

/* Solo importa en escritorio (móvil no tiene barra lateral que plegar),
   pero no hace daño llamarla desde donde sea: sin el div.side-brand del
   layout de escritorio, el botón que la dispara ni siquiera existe.
   Es preferencia de este dispositivo, no datos del usuario: vive en su propia
   llave de localStorage, nunca en `state` (eso es lo que viaja a GitHub). */
let sidebarCollapsed = document.documentElement.classList.contains("sc");

/* Plegado, el isotipo hace de botón de desplegar (no hay sitio para los dos),
   así que su rótulo cambia con el estado: si sigue diciendo "Ir a Resumen"
   cuando ya no lleva ahí, quien navegue por teclado o lector de pantalla se
   lleva justo la sorpresa que este cambio pretende evitar. */
function syncSidebarLabels() {
  const toggle = document.getElementById("sidebar-toggle-btn");
  const brand = document.getElementById("side-brand-btn");
  if (!toggle || !brand) return;
  const label = sidebarCollapsed ? "Abrir barra lateral" : "Cerrar barra lateral";
  toggle.setAttribute("aria-expanded", String(!sidebarCollapsed));
  toggle.setAttribute("aria-label", label);
  toggle.setAttribute("title", label);
  brand.setAttribute("aria-label", sidebarCollapsed ? "Abrir barra lateral" : "Ir a Resumen");
  if (sidebarCollapsed) brand.setAttribute("title", "Abrir barra lateral");
  else brand.removeAttribute("title");
}
syncSidebarLabels();

function toggleSidebar() {
  sidebarCollapsed = !sidebarCollapsed;
  document.documentElement.classList.toggle("sc", sidebarCollapsed);
  syncSidebarLabels();
  try { localStorage.setItem("notara-sidebar-collapsed", sidebarCollapsed ? "1" : "0"); } catch (e) {}
}

function brandClick() {
  if (sidebarCollapsed) toggleSidebar();
  else showView("summary");
}

/* ================= El gesto de atrás =================
   En el teléfono, deslizar desde el borde es "atrás". La app vivía en una
   sola entrada del historial, así que ese gesto no volvía a ninguna parte:
   se salía de Norata de golpe, y pasaba a menudo sin querer.

   La solución es un colchón: una entrada de historial de mentira que está
   siempre puesta. El gesto la consume, nosotros nos enteramos y hacemos lo
   que haría la flecha de esa pantalla, y volvemos a poner el colchón. Así el
   gesto del sistema y las flechas de la app hacen lo mismo, que es lo que
   cualquiera espera.

   Estando ya en la raíz no hay a dónde volver: ahí el primer gesto avisa y el
   segundo sí sale. Salir tiene que ser una decisión, no un resbalón. */
function armarColchon() {
  try {
    if (!history.state || !history.state.colchonNorata) {
      history.pushState({ colchonNorata: true }, "");
    }
  } catch (e) { /* sin historial disponible: el gesto se comporta como antes */ }
}

let avisoDeSalida = 0;

/* Devuelve true si se ha ocupado del gesto (y hay que reponer el colchón), o
   false si lo que toca es dejar salir de la app. El orden va de lo más
   encima a lo más al fondo: primero se cierra lo que tapa la pantalla, luego
   se navega, y la salida es siempre lo último. */
function atrasApp() {
  // 1. Capas que están por encima de todo
  const menu = document.getElementById("ajustes-menu");
  if (menu && menu.classList.contains("show")) { cerrarMenuAjustes(); return true; }

  const ventana = document.getElementById("ajustes-modal");
  if (ventana && ventana.classList.contains("show")) { cerrarVentanaAjustes(); return true; }

  const tuto = document.getElementById("tuto");
  if (tuto && tuto.classList.contains("show")) { cerrarTutorial(); return true; }

  if (typeof ventanaCajaId !== "undefined" && ventanaCajaId) { cerrarVentanaCaja(); return true; }

  const modal = document.getElementById("modal");
  if (modal && modal.classList.contains("show")) { modalDone(false); return true; }

  if (typeof fullscreenBranch !== "undefined" && fullscreenBranch) { closeBranchFullscreen(); return true; }

  // 2. Modos que cambian lo que hacen los toques
  if (typeof selNodos !== "undefined" && (selNodos.size || modoElegir)) { soltarSeleccion(); return true; }
  if (typeof editBranch !== "undefined" && editBranch) { toggleEditBranch(editBranch); return true; }
  if (typeof dashEditing !== "undefined" && dashEditing) { setDashEdit(false); return true; }

  // 3. Navegación: lo mismo que haría la flecha de esta pantalla
  const activa = document.querySelector(".view.active");
  const vista = activa ? activa.id.replace("view-", "") : "summary";

  if (vista === "settings") {
    // En el teléfono, Ajustes tiene su propio paso intermedio: la lista
    if (!isDesktop() && ajusteAbierto) { volverDeAjustes(); return true; }
    showView("summary");
    return true;
  }
  const padre = VISTA_MODULO[vista];
  if (padre && padre !== vista) { showView(padre); return true; }

  // 4. Ya en la raíz
  if (isDesktop()) return false;
  const ahora = Date.now();
  if (ahora - avisoDeSalida < 2600) return false;
  avisoDeSalida = ahora;
  toast("Desliza otra vez para salir", "calma");
  return true;
}

function showView(name) {
  // Un módulo apagado no se abre ni por un enlace que quedara apuntando ahí
  const mod = VISTA_MODULO[name];
  if (mod && !moduloOn(mod)) name = "summary";

  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById("view-" + name).classList.add("active");
  document.querySelectorAll(".thumb-cluster .c-nav").forEach(b => b.classList.remove("active"));
  const navId = NAV_VIEWS[name] ||
    (name === "detail" || name === "form" || name === "catalog" ? "nav-home" :
     (name === "perk" || name === "perk-form" ? "nav-tree" :
     (name === "project" || name === "project-form" ? "nav-projects" :
     (name === "mission-form" ? "nav-missions" : "nav-summary"))));
  if (navId) document.getElementById(navId).classList.add("active");

  if (NAV_VIEWS[name]) activeMainView = name;
  /* Las cinco pantallas de mirar aprovechan toda la ventana (ver
     .ancho-libre). Las fichas, los formularios y los ajustes se quedan en el
     ancho de lectura: ahí un renglón de 1800 px no ayuda a nadie. */
  document.documentElement.classList.toggle("ancho-libre", VISTAS_ANCHAS.has(name));
  const fab = document.getElementById("fab");
  fab.classList.toggle("hidden",
    !(name === "home" || name === "tree" || name === "projects" || name === "missions"));
  /* El botón grande crea el CONTENEDOR de cada pantalla, no lo que va dentro:
     los talentos, los proyectos y las misiones ya se crean desde el ＋ de su
     propia rama o columna, que es donde se está mirando cuando dan ganas de
     añadir algo. Aquí quedaba un atajo que siempre te preguntaba "¿y en qué
     rama?" cuando la respuesta ya estaba en la pantalla. */
  fab.querySelector(".fab-label").textContent = {
    home: "Nueva habilidad", tree: "Nueva rama",
    projects: "Nueva rama", missions: "Nuevo tablero"
  }[name] || "";

  /* La pantalla completa es una capa por encima de todo, así que taparía
     cualquier formulario que se abriera desde ella (crear talento, por
     ejemplo). Se aparta mientras dure el formulario y vuelve sola al
     regresar al árbol, en vez de obligar a salir del modo y perder el
     sitio donde estabas. */
  syncFullscreenForView(name);

  /* El modo selección no sobrevive a salir de Habilidades: volver y
     encontrarse media lista marcada de antes sería una trampa. */
  if (name !== "home" && seleccionHab) seleccionHab = null;

  /* Lo mismo con el Modo Editor del Resumen: irse a otro módulo es darlo por
     terminado. No hay nada que "confirmar" —cada movimiento ya se guardó
     según se hacía—, así que salir simplemente lo cierra y lo deja escrito. */
  if (name !== "summary" && dashEditing) {
    dashEditing = false;
    save();
    toast("Modo Editor cerrado · tu tablero quedó guardado", "hecho");
  }

  window.scrollTo(0, 0);
  /* El colchón se repone al movernos: si algo lo consumió por su cuenta (una
     vuelta de Google limpia la dirección con replaceState, por ejemplo), el
     gesto de atrás se quedaría sin red. */
  armarColchon();
  if (name === "catalog") renderCatalogo();
  if (name === "summary") renderSummary();
  if (name === "settings") {
    /* Entrar siempre empieza igual: la lista en el teléfono, la primera
       sección en la computadora. Recordar la última visitada haría que la
       pantalla apareciera distinta cada vez sin motivo visible. */
    ajusteAbierto = null;
    renderAjustes();
    renderTimezone(); renderModulos(); renderSync(); renderCopias(); renderZonaCuenta();
  }
  if (name === "missions") renderMissions();
  if (name === "home") renderHome();
  if (name === "tree") { focusPending = true; renderTree(); }
  if (name === "projects") renderProjects();
}

const VISTAS_ANCHAS = new Set(["summary", "missions", "home", "tree", "projects"]);

function fabAction() {
  if (activeMainView === "tree") crearRama("perks");
  else if (activeMainView === "projects") crearRama("projects");
  else if (activeMainView === "missions") crearTableroMisiones();
  else openSkillForm();
}

