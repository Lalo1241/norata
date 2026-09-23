/* Misiones, proyectos, módulos, reordenar y navegación */
/* ================= Misiones =================
   Lo que haces hoy. Cada misión tiene su cadencia, su cuenta del día
   y su propia racha; al cumplirla suelta XP en la habilidad que entrena. */

/* Las siete letras las da `letrasDeSemana()` (js/00-idioma.js) con el idioma
   puesto. Se pide al DIBUJAR y no se guarda en una constante: una constante de
   nivel superior se evalúa al cargar el archivo y se quedaría con las letras
   del idioma de arranque. */

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
    /* El nombre que el usuario le puso manda, y ese NO se traduce: es suyo.
       Solo se traduce el de fábrica, que es un rótulo de la app. */
    return Object.assign({}, t, { nombre: puestos[id] || tx(t.nombre), deFabrica: tx(t.nombre) });
  };
  const propios = (state.tableros || []).map(t => ({ id: t.id, nombre: t.nombre, propio: true }));
  return [fijo("hoy"), fijo("hechas"), fijo("semana"), ...propios, fijo("terminadas")];
}

function nombreTablero(id) {
  const t = tablerosDeMisiones().find(x => x.id === id);
  return t ? t.nombre : tx("otro tablero");
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
  const deshecho = revertida ? tx(" · se deshizo lo cumplido") : "";
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
  const nombre = await askText(tx("Nuevo tablero"), "", tx("Crear"),
    tx("Un sitio donde apartar misiones: un proyecto, un ámbito, lo que quieras."), 28);
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
          ? tx("La misión que tiene dentro no se pierde: vuelve a su sitio de siempre, según toque hoy o no.")
          : `Las ${dentro.length} misiones que tiene dentro no se pierden: vuelven a su sitio de siempre, según toquen hoy o no.`}`
      : `Se borra el tablero "${t.nombre}", que está vacío.`),
    tx("Borrar el tablero"), true);
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
  /* Dónde estaba el botón ANTES de repintar, que es donde está tu dedo. Al
     cumplir una misión la fila cambia de columna —medido: 286 px a la
     derecha—, así que celebrar en su sitio nuevo es soltar la luz lejos de
     donde estás mirando. */
  const donde = document.querySelector(`.view.active .ms-check[data-m="${m.id}"]`);
  const dondeCaja = donde ? donde.getBoundingClientRect() : null;
  /* Cada vez que se marca nace una marca con identidad propia, y al
     desmarcar se retira la última. El número sale de contarlas, no se guarda:
     un contador y una lista pueden desincronizarse, y entonces la fusión
     entre dispositivos deja de tener una verdad a la que agarrarse. */
  const marcas = Array.isArray(m.log[key]) ? m.log[key].slice() : [];
  while (marcas.length > after) marcas.pop();
  /* La marca lleva la hora pegada detrás ("...@1435"). El registro solo sabía
     el día, y la hora es lo único que no se puede reconstruir después: cuando
     los informes quieran contestar "¿a qué hora cumples?", solo podrán mirar
     lo que se guardó desde hoy. Las marcas viejas no la llevan y eso no es un
     fallo — se leen con `horaDeMarca`, que devuelve null y quien pregunta las
     deja fuera de la cuenta. */
  while (marcas.length < after) marcas.push(uid() + "@" + hhmmNow());
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
      /* `op.fuente` lo pasa quien cumple la misión por su cuenta —el Pomodoro,
         desde la 0.7.104— para que el informe le dé a él el mérito del XP. La
         misión se cumple igual y cuenta igual para la racha. */
      if (s) addXp(s, m.xp, `Misión cumplida: ${m.name}`, op.fuente || `Misión · ${m.name}`);
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
      /* Se descuenta del MISMO origen que la dio. Si la cumplió el Pomodoro y
         se desmarca desde la lista, restar de «Misión» dejaría el reparto del
         informe con XP del Pomodoro que ya no existe y un negativo en Misiones
         que nunca se ganó. */
      const dio = s && (s.log || []).find(e => e.date === key && e.xp > 0 && e.note === `Misión cumplida: ${m.name}`);
      if (s) removeXp(s, m.xp, `Misión revertida: ${m.name}`, (dio && dio.fuente) || `Misión · ${m.name}`);
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
  /* Y el nivel de cuenta, que sube de las mismas cosas. Va junto a la racha
     porque son la misma pregunta —«¿esto que acabo de hacer merece fiesta?»—
     y separarlas garantizaba que una de las dos se olvidara en el siguiente
     sitio que registre algo. */
  revisarNivelExpedicion();

  /* El destello va en CUALQUIER avance, no solo al cumplir: una misión de tres
     veces al día se toca tres veces, y las dos primeras también son algo que
     hiciste. Se busca el botón después de repintar porque el que pulsaste ya
     no existe. */
  /* Con la caja de ANTES del repintado (ver arriba). Y se busca dentro de la
     vista activa: la misma misión tiene botón en el Resumen y en Misiones, y
     un `querySelector` a secas devuelve el primero del árbol —el del Resumen—,
     que cuando estás en Misiones está escondido y mide 0×0. Así el destello
     se disparaba contra un elemento sin caja y no salía nunca, en silencio. */
  if (delta > 0) destello(dondeCaja, pinta(m.color));

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
  return `<span class="ms-ic" style="background:${velo(col, "22")};color:${tinta(col)}" aria-hidden="true">${icon(m.icon || "target", 16)}</span>`;
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

  /* `data-m` no es decorado: al marcar, la lista se vuelve a dibujar entera y
     el botón que pulsaste deja de existir. Es lo que permite encontrar el
     nuevo para ponerle el destello encima. */
  return `<button class="ms-check ${sobre ? "muda" : ""}" data-m="${escapeAttr(m.id)}"
    ${apagado ? "disabled" : `onclick="${accion}"`}
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
  flota.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;margin:0;pointer-events:none;z-index:var(--piso-arrastre)`;
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
  return isDesktop() ? tx("Arrastra para reordenar") : tx("Mantén pulsada una para reordenar");
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
  if (pr.status === "done") return { key: "done", label: tx("Terminado"), color: "var(--mint)", note: tx("Cerrado y guardado en tu historial.") };
  if (pr.status === "dropped") return { key: "dropped", label: tx("Descartado"), color: "var(--coral)", note: tx("Lo soltaste. Puedes retomarlo cuando quieras.") };
  if (pr.status === "paused") return { key: "paused", label: tx("En pausa"), color: "var(--muted)", note: tx("Congelado a propósito: no cuenta como abandonado.") };
  /* Ver esperandoTurno: los dias empiezan a contar cuando se abre el paso */
  if (esperandoTurno(pr)) {
    const faltan = requisitosVivos(pr).filter(r => r.status !== "done");
    return { key: "waiting", label: tx("Espera su turno"), color: "var(--celeste)",
      note: faltan.length === 1
        ? `Va despues de "${faltan[0].name}". ${pr.espera ? tx("No se abre hasta que termine.") : "Puedes adelantarlo si quieres."}`
        : `Va despues de ${faltan.length} encargos. ${pr.espera ? tx("No se abre hasta que terminen.") : "Puedes adelantarlo si quieres."}` };
  }
  const idle = daysIdle(pr);
  const prog = projectProgress(pr);
  if (idle >= 45 && prog < 60) {
    return { key: "stalled", label: tx("Estancado"), color: "var(--coral)",
      note: T`${idle} días sin avance y solo ${prog}% hecho. Sé honesto: ¿lo retomas esta semana o lo sueltas?` };
  }
  if (idle >= 21) {
    return { key: "cooling", label: tx("Enfriándose"), color: "var(--fire)",
      note: `${idle} días sin tocarlo. Una etapa pequeña bastaría para revivirlo.` };
  }
  if (prog >= 80) {
    return { key: "closing", label: tx("Casi listo"), color: "var(--mint)",
      note: tx("Estás a nada de cerrarlo. Termina las etapas que faltan.") };
  }
  return { key: "healthy", label: tx("Con ritmo"), color: "var(--mint)",
    note: idle === 0 ? tx("Le diste avance hoy.")
      : idle === 1 ? T`Último avance hace ${idle} día.` : T`Último avance hace ${idle} días.` };
}

/* ================= El encargo como nodo del mapa =================
   Proyectos gana una segunda vista: la misma rama, dibujada como mapa de
   nodos. El nodo es el ENCARGO —no la etapa— porque un encargo ya trae rama,
   etapas, color, icono y estado; lo unico que le faltaba era de que depende.

   Lo que NO se copia de Talentos, y es a proposito:

   · Un talento tiene tres figuras porque tiene tres tipos. Un encargo es
     siempre lo mismo, asi que hay una sola figura.
   · Un talento esta o no esta. Un encargo esta a medias casi siempre, y por
     eso el nodo lleva su cuenta de etapas.
   · Una flecha de Talentos es un candado. Aqui solo ordena, salvo que el
     encargo tenga encendido «espera a sus requisitos». */

/* Rectangulo redondeado: no se parece a ninguna de las tres figuras de
   Talentos, que es justo lo que hace que las dos pantallas no se confundan
   de un vistazo. */
const FIGURA_ENCARGO = { forma: "encargo", radio: 31, ancho: 62, alto: 42 };

/* ---- Los cuatro tipos de encargo (0.7.98) ----
   El comentario de arriba decía que un encargo es siempre lo mismo y por eso
   tenía una sola figura. Con cuatro encargos en fila resultó que eso deja el
   mapa sin nada que mirar, así que aquí está la vuelta a esa decisión.

   Las figuras NO son las de Talentos, y no por capricho: el rombo y el
   hexágono ya significan «meta» e «hito» allí, y dos mapas hechos de las
   mismas piezas dejarían de saberse cuál es cuál. Las tres primeras son la
   MISMA caja de siempre con la silueta recortada de otra forma —así el
   acomodo no se mueve ni un píxel: comparten ancho, alto y radio—, y la
   cuarta es el círculo pequeño, que sí coincide con la compra de Talentos
   porque es literalmente lo mismo: algo que se paga para poder seguir.

   `tarea` es lo que ya había, así que un tablero de antes se dibuja igual
   sin migrar nada: quien no tenga tipo es una tarea. */
const TIPOS_ENCARGO = {
  tarea: {
    nombre: "Tarea", sub: "El trabajo de siempre: se hace por etapas y no cierra nada por su cuenta.",
    icono: "figTarea", forma: "encargo", silueta: "rect", radio: 31, ancho: 62, alto: 42
  },
  entrega: {
    nombre: "Entrega", sub: "Lo que cierra una fase y sale del proyecto: entregar, publicar, inaugurar.",
    icono: "figEntrega",
    // La punta a la derecha dice por dónde sale
    forma: "encargo", silueta: "punta", radio: 31, ancho: 62, alto: 42
  },
  decision: {
    nombre: "Decisión", sub: "Hay que elegir entre caminos, y hasta que elijas lo de después no se puede empezar.",
    icono: "figDecision",
    // Las esquinas cortadas, que es la silueta de «alto, decide»
    forma: "encargo", silueta: "corte", radio: 31, ancho: 62, alto: 42
  },
  gasto: {
    nombre: "Gasto", sub: "Algo que hay que pagar para que el proyecto siga: material, un permiso, un servicio.",
    icono: "figGasto", forma: "circulo", radio: 19
  }
};

function tipoDeEncargo(pr) { return TIPOS_ENCARGO[pr && pr.tipo] ? pr.tipo : "tarea"; }
function figuraDeEncargo(pr) { return TIPOS_ENCARGO[tipoDeEncargo(pr)]; }

/* Los estados que el mapa sabe pintar. «esperando» nace con el mapa: es un
   encargo cuyos requisitos no estan listos. Si `espera` esta apagado se
   dibuja apagado pero deja pasar; si esta encendido, ademas cierra. Los dos
   comparten estado para que el mapa no explique dos apagados distintos. */
function estadoDeEncargo(pr) {
  if (pr.status === "done") return "completed";
  if (pr.status === "dropped") return "expired";
  if (pr.status === "paused") return "paused";
  if (!requisitosCumplidos(pr)) return "esperando";
  return "active";
}

/* Este encargo esta cerrado con llave? Solo si el mismo lo pidio. */
function encargoBloqueado(pr) {
  return pr.espera === true && !requisitosCumplidos(pr);
}

/* Esa etapa ya estaba marcada? Se pregunta antes de tocarla para saber si el
   gesto es avanzar (se puede bloquear) o deshacer (nunca se bloquea). */
function etapaHecha(pr, stepId) {
  const s = (pr.steps || []).find(x => x.id === stepId);
  return !!(s && s.done);
}

/* ---- Los dias sin avance de algo que espera su turno ----
   Sin esto el mapa empeoraria Proyectos en vez de mejorarlo: projectHealth
   marca "Estancado" a los 45 dias sin tocar, asi que un encargo que espera
   —correctamente— a que termine el anterior acabaria en «Decision
   pendiente» pidiendote que lo retomes o lo sueltes. Seria la app
   regañandote por hacerle caso al mapa. */
function esperandoTurno(pr) {
  return (pr.status === "active" || pr.status === "paused") && !requisitosCumplidos(pr);
}

/* La rama tal como se dibuja. El equivalente de vistaDeRama, mucho mas corto
   porque en Proyectos no hay cajas del atico que contraer. Se devuelven
   COPIAS —el dibujo no debe poder escribir en los datos— con la etiqueta
   `mod` puesta. Los requisitos de otra rama NO se quitan: el reparto en
   capas ya se queda con los de casa y el dibujo les pinta su cabo suelto. */
function vistaDeRamaProyectos(b) {
  return state.projects
    .filter(p => (p.branch || "General") === b)
    .map(p => Object.assign({}, p, { mod: "proyectos" }));
}

function encargosDeRama(b) {
  return state.projects.filter(p => (p.branch || "General") === b);
}

function projectLog(pr, event) {
  pr.history = pr.history || [];
  pr.history.unshift({ date: todayKey(), at: stamp(), event });
  pr.lastActivity = todayKey();
}

function toggleStep(prId, stepId) {
  const pr = state.projects.find(x => x.id === prId);
  if (!pr) return;
  /* La llave del mapa, aplicada donde de verdad importa: marcar una etapa es
     la unica forma de avanzar un encargo, asi que si aqui no para, el
     interruptor «espera su turno» no significaria nada. Reabrir una etapa ya
     hecha si se permite: deshacer nunca se bloquea. */
  if (!etapaHecha(pr, stepId) && encargoBloqueado(pr)) {
    const faltan = requisitosVivos(pr).filter(r => r.status !== "done");
    toast(faltan.length === 1
      ? `Espera a que termine "${faltan[0].name}"`
      : `Espera a que terminen sus ${faltan.length} requisitos`, "atencion");
    return;
  }
  const s = pr.steps.find(x => x.id === stepId);
  if (!s) return;
  s.done = !s.done;
  s.at = s.done ? stamp() : null;
  projectLog(pr, `${s.done ? "Etapa completada" : "Etapa reabierta"}: ${s.name}`);
  if (pr.status === "paused" && s.done) {
    pr.status = "active";
    projectLog(pr, tx("Retomado al avanzar una etapa"));
  }
  save();
  const prog = projectProgress(pr);
  renderProjectDetail();
  if (prog === 100 && s.done) {
    toast(tx("Todas las etapas listas — ciérralo cuando quieras"), "logro");
  } else {
    toast(`${pr.name}: ${prog}%`, "hecho");
  }
}

async function addStepTo(prId) {
  const pr = state.projects.find(x => x.id === prId);
  const input = document.getElementById("detail-new-step");
  const name = input.value.trim();
  if (!name) { toast(tx("Escribe el nombre de la etapa"), "atencion"); return; }
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
    active: [tx("¿Retomar este encargo?"), "Retomar"],
    paused: [tx("¿Poner el encargo en pausa? No contará como abandonado mientras esté pausado."), "Pausar"],
    done: [tx("¿Dar por terminado este encargo? Se guardará en tu historial y ganarás el XP."), "Terminarlo"],
    dropped: [tx("¿Descartar este encargo? Deja de pedirte atención, pero queda guardado por si lo retomas."), "Descartar"]
  };
  const [msg, ok] = labels[status];

  /* ---- Salir de «terminado» devuelve el XP ----
     Sin esto, terminar un encargo pagaba la recompensa CADA VEZ: reabrirlo y
     volver a cerrarlo la cobraba otra vez, y otra, sin límite. Un encargo de
     300 XP daba 600 con una sola vuelta y 3.000 con diez, que es el atajo más
     cómodo que tenía la app para inflar una habilidad sin hacer nada.

     Los otros dos módulos ya lo hacían bien y este se había quedado atrás:
     `revertirTalento` devuelve el XP y el dinero, y `moverMisionATablero`
     deshace lo cumplido al sacar una misión de las terminadas. La regla es la
     misma en los tres: **deshacer dice que aquello no llegó a pasar**.

     Se avisa antes de preguntar, no después: quien reabre un encargo tiene
     derecho a saber que va a perder la recompensa mientras decide. */
  const deshaceRecompensa = pr.status === "done" && status !== "done";
  const sRev = deshaceRecompensa && pr.skillId && pr.xpReward
    ? state.skills.find(x => x.id === pr.skillId) : null;
  const aviso = sRev ? `\n\nSe le devolverán los ${pr.xpReward} XP a ${sRev.name}.` : "";

  if (!await ask(msg + aviso, ok, status === "dropped")) return;

  if (sRev) removeXp(sRev, pr.xpReward, `Encargo reabierto: ${pr.name}`, `Proyecto · ${pr.name}`);
  /* Y la fecha se limpia siempre que deje de estar terminado, lleve XP o no:
     un encargo activo con fecha de término se cuela en el historial como si
     siguiera cerrado. */
  if (deshaceRecompensa) pr.completedAt = null;

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
    toast({ active: "Encargo retomado", paused: tx("Encargo en pausa"), dropped: "Encargo descartado" }[status], status === "active" ? "hecho" : "deshecho");
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
  { id: "projects", nav: "nav-projects", label: "Proyectos",   hint: "Lo que construyes, encargo a encargo" },
  /* El Pomodoro. Nació en la 0.7.101 APAGADO y detrás de `?jornada=1`, y en la
     0.7.103 pasó a ser un módulo como los otros cuatro: encendido para todos y
     con su interruptor en Ajustes. Lo pidió Eduardo porque «no siempre sale»,
     y la causa era de fondo: el interruptor vivía en `state.ui`, que la
     sincronía trae ENTERO del dispositivo más reciente, así que otro
     dispositivo sin la marca lo apagaba en silencio. Ahora solo se guarda si
     alguien lo APAGA (`modulosOff`), como los demás.
     Se ve «Pomodoro» desde la 0.7.102; el id sigue siendo `jornada` para no
     dejar huérfanos los datos. Ver js/09d-jornada.js. */
  { id: "jornada",  nav: "nav-jornada",  label: "Pomodoro",    hint: "Pre alpha: tu día en una rueda, con tramos de enfoque" }
];

/* ================= Los dos que llegan después =================
   Norata abre con CUATRO módulos delante y ninguna pista de por dónde
   empezar: el primer día había que entender a la vez qué es una misión, qué
   es una habilidad que baja si la dejas, qué es un talento que se compra con
   dinero real y qué es un encargo dentro de un proyecto. Cuatro vocabularios
   nuevos en la misma barra, y los dos últimos son los que menos se entienden
   sin haber usado los dos primeros.

   Así que los dos últimos LLEGAN, y llegan por el nivel de expedición, que ya
   es el reloj de la app: Talentos en el 3 y Proyectos en el 5. Los números no
   son redondos, son el calendario — medidos con `EXP_PUNTOS` y la curva de
   `js/02b-expedicion.js` sobre un perfil de cuatro días por semana: el 3 cae
   dentro de la primera semana y el 5 alrededor de la tercera. Bastante para
   que Misiones y Habilidades ya signifiquen algo, poco para que nadie espere
   un mes por la pantalla que más trabajo lleva.

   Misiones y Habilidades no tienen nivel a propósito: son las dos que se
   entienden sin que nadie las explique, y una app que abre con la barra entera
   cerrada no enseña, castiga.

   **Y el nivel solo puede ABRIR, nunca cerrar.** Es la misma regla del cobro
   —congelar, nunca quitar—: quien ya tiene talentos los ve, tenga el nivel que
   tenga. Sin eso, publicar esto le habría escondido el árbol a todo el que
   ya lo estaba usando, que es exactamente el fallo que nadie perdona. */
const MODULO_NIVEL = { tree: 3, projects: 5 };

/* Lo que hay dentro de un módulo, para la regla de arriba. Se mira la
   colección y no una marca guardada: un respaldo importado, el ejemplo
   completo y una cuenta que llega de otro dispositivo traen sus cosas sin
   pasar por ninguna bandera nuestra. */
function moduloConCosas(id) {
  if (id === "tree") return (state.perks || []).length > 0;
  if (id === "projects") return (state.projects || []).length > 0;
  return true;
}

/* ¿Lo abrió ya el nivel? Es la pregunta del CANDADO, y es distinta de
   `moduloOn`, que es el interruptor de Ajustes: uno lo decide la app y el otro
   la persona. Se separan porque se ven distinto — lo apagado desaparece del
   menú, lo cerrado se queda a la vista con su candado y su nivel escrito. */
function moduloAbierto(id) {
  const pide = MODULO_NIVEL[id];
  if (!pide) return true;
  if (moduloConCosas(id)) return true;
  /* Lo que se abrió a golpes (`romperCandado`, más abajo). Se mira aquí y no
     solo con la prueba encendida: romperlo es para siempre, y el día que la
     prueba se quite, quien ya lo rompió no puede volver a encontrarse el
     candado puesto. */
  if (moduloRoto(id)) return true;
  const n = typeof nivelExpedicion === "function" ? nivelExpedicion().nivel : 99;
  return n >= pide;
}

/* ---- El dibujo de un módulo, sacado de su BOTÓN ----
   Se lee del DOM y no se copia a esta tabla, y esa es toda la gracia: los cinco
   iconos de la barra viven escritos a mano dentro de `index.html`, así que una
   copia aquí serían DOS verdades sobre el mismo dibujo — y la que se queda
   atrás es la que un día enseña un árbol viejo en la celebración y el nuevo en
   el menú. Lo pidió Eduardo con esas palabras: los originales, para evitar
   inconsistencias.

   Devuelve solo lo de DENTRO del `<svg>`, porque quien llama lo mete en un svg
   propio con su tamaño: los cinco comparten `viewBox="0 0 24 24"`, así que el
   contenido se puede dibujar a cualquier medida sin tocarlo.

   Cadena vacía si no lo encuentra —y quien llama tiene que aguantarlo—: la
   celebración también existe cuando la barra todavía no se ha pintado. */
function trazoDeModulo(id) {
  const m = MODULOS.find(x => x.id === id);
  const svg = m && document.querySelector("#" + m.nav + " svg");
  return svg ? svg.innerHTML : "";
}

/* Las dos preguntas juntas, que es lo que casi todo el mundo quiere saber:
   ¿pinto esta pantalla, este widget, esta fila? */
function moduloUsable(id) {
  return moduloOn(id) && moduloAbierto(id);
}

/* Lo que se dice al tocar un candado del menú. No ofrece pagar, y eso no es un
   descuido: esta puerta se abre USANDO la app, igual que los ambientes (ver la
   nota de `estadoApariencia` en js/10i-apariencia.js). Cobrar por saltarse la
   escalera es lo único que la rompería. */
/* Lo que la bienvenida dejó apuntado para este módulo, escrito para leerlo. Es
   lo que convierte la espera en algo que se anticipa: quien contestó el
   cuestionario ya eligió sus áreas, y la rama está armada esperando al otro
   lado del candado (`settings.siembra`, js/09-inicio.js). Decirlo cuesta un
   renglón; callarlo deja el candado siendo solo una puerta.

   Devuelve cadena vacía cuando no hay nada apuntado —quien se saltó la
   bienvenida— y entonces el cuadro no promete nada, que es lo correcto. */
/* «Salud y Dinero», no «Salud, Dinero». Un `join(", ")` es lo que sale solo y
   se lee como una lista de la compra dentro de una frase que quiere sonar a
   alguien hablando. Con tres o más, la coma vuelve para las primeras y la «y»
   se queda para la última, que es como se escribe en español. */
function enLista(nombres) {
  if (nombres.length < 2) return nombres[0] || "";
  return nombres.slice(0, -1).join(", ") + tx(" y ") + nombres[nombres.length - 1];
}

function loQueEsperaDentro(id) {
  const s = state.settings && state.settings.siembra;
  if (!s) return "";
  if (id === "tree") {
    const nombres = (typeof ONBOARD_AREAS !== "undefined" ? ONBOARD_AREAS : [])
      .filter(a => (s.areas || []).indexOf(a.id) >= 0)
      .map(a => tx(a.branch));
    if (!nombres.length) return "";
    return nombres.length === 1
      ? T`Al llegar te espera la rama de ${nombres[0]}, con los talentos que elegiste al armar tu tablero.`
      : T`Al llegar te esperan tus ramas de ${enLista(nombres)}, con los talentos que elegiste al armar tu tablero.`;
  }
  if (id === "projects" && s.project) {
    return T`Al llegar te espera «${s.project}», el proyecto que apuntaste al armar tu tablero.`;
  }
  return "";
}

function avisoModuloCerrado(id) {
  const m = MODULOS.find(x => x.id === id);
  if (!m) return;
  const pide = MODULO_NIVEL[id] || 0;
  const f = faltaParaNivel(pide);
  const espera = loQueEsperaDentro(id);
  /* El título dice lo que falta Y para qué, que es lo que pidió Eduardo: «te
     faltan 3 niveles» a secas obliga a leer la frase de abajo para saber de qué
     iban esos tres. */
  const titulo = f.faltan === 1
    ? tx("Te falta 1 nivel más para desbloquearlo")
    : T`Te faltan ${f.faltan} niveles más para desbloquearlo`;

  /* El cuerpo va en HTML por el aro y por el enlace. Todo lo que viene de los
     datos —el nombre de una rama, el de un proyecto— se escapa antes de entrar;
     lo único en crudo es lo que dibujamos aquí.

     Y todo en `<span>`, ninguno `<p>` ni `<ul>`: `#modal-msg` ES un `<p>`, y un
     `<p>` dentro de otro el navegador lo saca fuera al vuelo — el cuadro se
     desarma solo y no hay nada en el CSS que lo explique. Es la misma nota que
     lleva `topeAlcanzado` en js/10d-plan.js. */
  const cuerpo =
    /* EL ARO, no la barra: «la barra de los cuadros emergentes debe permanecer
       circular, no horizontal» (Eduardo, 0.7.97.6). Con el candado dentro,
       porque aquí no hay otro candado en el cuadro y este es el que dice de qué
       va el aro. La barra se queda donde hay ancho de sobra: la tarjeta del
       tablero y la ficha de un ambiente. */
    '<span class="cerr-aro">' + aroDeNivelHTML(pide, 76) + '</span>' +
    '<span class="cerr-tx">' +
      T`El módulo de ${escapeHtml(tx(m.label))} se desbloquea en el nivel ${pide} de ` +
      /* «Tu expedición» lleva al sitio donde se ve la barra, cuánto falta y qué
         más abre el camino. Va DENTRO de la frase y no en un botón aparte —lo
         pidió Eduardo— porque un cuadro con dos botones grandes obliga a elegir
         entre dos salidas cuando solo hay una acción; y así el nombre de la
         pantalla es el propio enlace, que es como se llega a ella.

         Cierra el cuadro antes de navegar: sin `modalDone`, la ventana se
         quedaría encima de la pantalla a la que acaba de llevar. */
      '<button type="button" class="cerr-enlace" onclick="modalDone(false); abrirColeccion();">' +
        escapeHtml(tx("tu expedición")) + '</button>.' +
    '</span>' +
    (espera ? '<span class="cerr-espera">' + icon("gem", 14) + escapeHtml(espera) + '</span>' : "") +
    '<span class="cerr-tx cerr-como">' +
      escapeHtml(tx("El nivel sube solo con las actividades que realizas: cumple misiones, practica habilidades y vuelve mañana para adquirir experiencia de cada una de ellas.")) +
    '</span>';

  /* En LUCIÉRNAGA y no en menta, y sin icono arriba. Lo cambió Eduardo: el
     candado ya vive dentro del aro, así que uno segundo en la cabecera sería el
     mismo dibujo dos veces; y el tono es el de «esto tiene un coste que quizá
     no ves» —el mismo del cuadro de reportar un fallo—, no el de algo que se
     gana. Ni `danger` ni `alarm`: aquí no se rompió nada, hay algo que todavía
     no llega.

     Un solo botón, y en MENTA aunque el marco sea amarillo — lo confirmó
     Eduardo: el marco avisa, el botón solo cierra. */
  const cuadro = askBase(cuerpo, true, tx("Entendido"), false, false, null,
                 { tono: "oro", titulo: titulo, soloOk: true,
                   clase: pruebaRomper() ? "rompible" : "" });
  if (pruebaRomper()) armarGolpes(id);
  return cuadro;
}

/* La puerta de los cinco botones del menú. Existe para que el candado HAGA algo
   al tocarlo: `showView` no puede avisar por su cuenta —la llaman el arranque,
   el gesto de atrás y una docena de botones, y un cuadro emergente al abrir la
   app sería el peor recibimiento posible—, así que quien avisa es el gesto
   explícito de ir a un módulo, que es este. */
function irAModulo(name) {
  const mod = VISTA_MODULO[name] || name;
  if (!moduloAbierto(mod)) { avisoModuloCerrado(mod); return; }
  showView(name);
}

/* ================= Romper el candado (0.7.126, EN PRUEBA) =================
   Un secreto: golpear el candado del cuadro de un módulo cerrado entre 80 y
   100 veces seguidas lo abre antes de tiempo. Cada golpe hace temblar el
   cuadro y le abre grietas; al llegar a la meta se rompe en pedazos que caen,
   y el módulo queda abierto para siempre. Lo pidió Eduardo, y lo aprobó en un
   boceto antes de llegar aquí.

   Tres reglas que no se negocian:

   - **Solo los candados de NIVEL, y solo Talentos y Proyectos.** Los golpes se
     escuchan únicamente en el cuadro de `avisoModuloCerrado`. Un candado de
     plan no se entera: romperlo sería llevarse gratis lo que se cobra.
   - **Si dejas de tocar 1,5 s, las grietas se cierran solas.** Es lo que
     impide romperlo sin querer, a plazos, a lo largo de varios días. Y
     cerradas del todo se olvidan: el siguiente intento traza otras.
   - **Es para siempre.** Se guarda en `settings.rotos`, que viaja con la
     cuenta y se UNE al sincronizar (js/10-fusion.js), y `moduloAbierto` lo
     mira siempre, con la prueba puesta o sin ella.

   Apagado para todos: se enciende con `?romper=1` y se apaga con `?romper=0`
   o cerrando la pestaña. Qué hay que borrar al quitar la prueba (pero NO lo
   roto, que se queda): ver la entrada 0.7.126 de VERSIONES.md. */
const ROMPIBLES = ["tree", "projects"];
const ROMPER_ESPERA = 1500;   // ms sin tocar antes de que empiecen a cerrarse
const ROMPER_CIERRA = 22;     // golpes por segundo que se deshacen al cerrarse

function pruebaRomper() {
  return document.documentElement.classList.contains("romper-prueba");
}

function moduloRoto(id) {
  const r = state && state.settings && state.settings.rotos;
  return Array.isArray(r) && r.indexOf(id) >= 0;
}

let golpes = null;

/* Se llama justo después de abrir el cuadro. `askBase` rellena el cuadro sin
   esperar, así que el aro ya está en el DOM. */
function armarGolpes(id) {
  soltarGolpes();
  if (ROMPIBLES.indexOf(id) < 0) return;
  const card = document.querySelector("#modal .modal-card");
  const blanco = card && card.querySelector(".cerr-aro .aro-nivel");
  if (!blanco) return;
  golpes = {
    id, card, blanco, n: 0, ultimo: 0, grietas: null, roto: false,
    meta: 80 + Math.floor(Math.random() * 21),
    antes: Date.now(), reloj: null
  };
  /* `pointerdown` y no `click`: el golpe responde al tocar, no al soltar, y
     no hay retardo que esperar. El zoom del doble toque lo quita el CSS
     (`touch-action: manipulation`); el `dblclick` es la red para un iOS
     viejo que todavía lo intente. */
  blanco.addEventListener("pointerdown", golpeCandado);
  blanco.addEventListener("dblclick", e => e.preventDefault());
  /* Con setInterval y no con fotogramas: en una pestaña de fondo no hay
     fotogramas, y las grietas tienen que seguir cerrándose. */
  golpes.reloj = setInterval(curarGrietas, 50);
}

function soltarGolpes() {
  if (!golpes) return;
  clearInterval(golpes.reloj);
  golpes.blanco.removeEventListener("pointerdown", golpeCandado);
  golpes = null;
}

function golpeCandado(e) {
  const g = golpes;
  if (!g || g.roto) return;
  if (e) e.preventDefault();
  if (!g.grietas) trazarGrietas();
  g.n = Math.min(g.meta, Math.floor(g.n) + 1);
  g.ultimo = Date.now();
  const p = g.n / g.meta;
  g.blanco.classList.remove("golpe"); void g.blanco.offsetWidth; g.blanco.classList.add("golpe");
  /* Muy poco: de 1 px al principio a 2,5 px cerca del final. Es un aviso de
     que algo pasó, no un terremoto. */
  if (!menosMovimiento() && g.card.animate) {
    const amp = 1 + 1.5 * p, a = Math.random() * Math.PI * 2;
    const dx = Math.cos(a) * amp, dy = Math.sin(a) * amp;
    g.card.animate([{ transform: "translate(0,0)" }, { transform: `translate(${dx}px,${dy}px)` },
      { transform: `translate(${-dx * 0.6}px,${-dy * 0.6}px)` }, { transform: "translate(0,0)" }],
      { duration: 110, easing: "ease-out" });
  }
  if (navigator.vibrate) { try { navigator.vibrate(Math.round(6 + p * 12)); } catch (x) {} }
  dibujarGrietas();
  if (g.n >= g.meta) romperCandado();
}

function menosMovimiento() {
  try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
}

function curarGrietas() {
  const g = golpes;
  if (!g) return;
  /* El cuadro se cerró por su cuenta —Entendido, tocar fuera, el enlace a la
     expedición—: se suelta todo. Se MIRA en vez de engancharse a cada salida,
     que son varias y alguna nueva se olvidaría. */
  if (!document.getElementById("modal").classList.contains("show") ||
      !g.card.classList.contains("rompible")) { if (!g.roto) soltarGolpes(); return; }
  const ahora = Date.now(), dt = (ahora - g.antes) / 1000;
  g.antes = ahora;
  if (g.roto || g.n <= 0 || ahora - g.ultimo < ROMPER_ESPERA) return;
  g.n = Math.max(0, g.n - ROMPER_CIERRA * dt);
  dibujarGrietas();
  if (g.n === 0) {
    const capa = g.card.querySelector(".grietas");
    if (capa) capa.remove();
    g.grietas = null;
  }
}

/* ---- Las grietas ----
   Se trazan en el primer golpe, desde el borde del aro hacia fuera, al azar.
   Cada una sabe en qué punto del avance empieza a verse y en cuál termina de
   crecer, así que avanzar y retroceder es solo mover un número.

   Van dentro de la tarjeta y no del `#modal-msg`: el cuerpo se reescribe en
   cada apertura, pero la capa tiene que cubrir la tarjeta entera, título y
   botón incluidos. Se quita en `curarGrietas` y en `askBase` (js/01-base.js),
   porque el modal es UNO y se reutiliza. */
function trazarGrietas() {
  const g = golpes, card = g.card;
  const rc = card.getBoundingClientRect(), ra = g.blanco.getBoundingClientRect();
  const W = card.clientWidth, H = card.scrollHeight;
  const ox = ra.left + ra.width / 2 - rc.left - card.clientLeft;
  const oy = ra.top + ra.height / 2 - rc.top - card.clientTop + card.scrollTop;
  const radio = ra.width / 2;
  g.ox = ox; g.oy = oy;
  const R = Math.random, out = [];

  function rama(x, y, ang, s, e, prof) {
    const pts = [[x, y]];
    let len = 0, a = ang;
    const tope = prof === 0 ? 1e4 : 26 + R() * (prof === 1 ? 80 : 40);
    const hijos = [];
    for (let i = 0; i < 80; i++) {
      const paso = 7 + R() * 13;
      a += (R() - 0.5) * 0.75; a = a * 0.78 + ang * 0.22;
      x += Math.cos(a) * paso; y += Math.sin(a) * paso; len += paso;
      pts.push([+x.toFixed(1), +y.toFixed(1)]);
      if (x < -8 || y < -8 || x > W + 8 || y > H + 8 || len > tope) break;
      if (prof < 2 && i > 1 && R() < (prof === 0 ? 0.24 : 0.14)) hijos.push({ x, y, len, a });
    }
    out.push({ pts, len, s, e, w: prof === 0 ? 1.9 : prof === 1 ? 1.3 : 0.9 });
    hijos.forEach(h => {
      const nace = s + (e - s) * (h.len / len);
      const giro = (R() < 0.5 ? -1 : 1) * (0.5 + R() * 0.7);
      rama(h.x, h.y, h.a + giro, nace, Math.min(0.995, nace + 0.18 + R() * 0.2), prof + 1);
    });
  }
  // El punto de impacto: unas rayitas cortas alrededor del aro, las primeras en verse.
  for (let i = 0; i < 6; i++) {
    const a = R() * Math.PI * 2, r0 = radio - 2, r1 = r0 + 6 + R() * 8;
    out.push({ pts: [[ox + Math.cos(a) * r0, oy + Math.sin(a) * r0], [ox + Math.cos(a + 0.1) * r1, oy + Math.sin(a + 0.1) * r1]],
      len: r1 - r0, s: 0.005 + i * 0.008, e: 0.03 + i * 0.01, w: 1.1 });
  }
  const nMain = 7 + Math.floor(R() * 3), base = R() * Math.PI * 2;
  for (let i = 0; i < nMain; i++) {
    const a = base + i * (2 * Math.PI / nMain) + (R() - 0.5) * 0.5;
    const s = 0.015 + (i / nMain) * 0.42 + R() * 0.04;
    rama(ox + Math.cos(a) * radio, oy + Math.sin(a) * radio, a, s, Math.min(0.97, s + 0.5 + R() * 0.1), 0);
  }
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("class", "grietas");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.style.height = H + "px";
  svg.innerHTML = out.map(c => {
    const d = "M" + c.pts.map(p => p[0] + " " + p[1]).join("L");
    return `<path class="g-h" d="${d}" stroke-width="${c.w + 1.3}" transform="translate(.6 .8)"/>` +
           `<path class="g-f" d="${d}" stroke-width="${c.w}"/>`;
  }).join("");
  const vieja = card.querySelector(".grietas");
  if (vieja) vieja.remove();
  card.appendChild(svg);
  g.grietas = out.map((c, i) => ({ c, h: svg.children[i * 2], f: svg.children[i * 2 + 1] }));
}

function dibujarGrietas() {
  const g = golpes;
  if (!g || !g.grietas) return;
  const p = g.n / g.meta;
  g.grietas.forEach(({ c, h, f }) => {
    const t = Math.max(0, Math.min(1, (p - c.s) / (c.e - c.s)));
    const v = t * c.len, da = v.toFixed(1) + " " + (c.len + 20);
    /* Una raya de largo cero con la punta redonda se pinta como un PUNTO, y
       así se veía por dónde iba a pasar cada grieta antes de nacer. Lo cazó
       Eduardo en el boceto. Lo que no ha empezado no se dibuja. */
    const oculta = v < 0.5 ? "none" : "";
    h.style.display = oculta; f.style.display = oculta;
    h.setAttribute("stroke-dasharray", da); f.setAttribute("stroke-dasharray", da);
  });
}

/* ---- Se rompe ----
   La tarjeta se parte en trozos que salen del aro, como rayos hasta el borde.
   Cada trozo es una COPIA de la tarjeta recortada con clip-path, así que lo
   que vuela es el cuadro de verdad y no un dibujo que lo imita. */
function romperCandado() {
  const g = golpes;
  g.roto = true;
  clearInterval(g.reloj);
  const card = g.card, id = g.id;
  const rc = card.getBoundingClientRect();
  const W = rc.width, H = rc.height;
  const ox = g.ox + card.clientLeft, oy = g.oy + card.clientTop - card.scrollTop;
  if (navigator.vibrate) { try { navigator.vibrate([25, 40, 60]); } catch (x) {} }

  const n = 11, angs = [], b0 = Math.random() * Math.PI * 2;
  for (let i = 0; i < n; i++) angs.push(b0 + i * 2 * Math.PI / n + (Math.random() - 0.5) * 0.35);
  const borde = a => {
    const dx = Math.cos(a), dy = Math.sin(a);
    const tx_ = dx > 0 ? (W - ox) / dx : dx < 0 ? -ox / dx : Infinity;
    const ty = dy > 0 ? (H - oy) / dy : dy < 0 ? -oy / dy : Infinity;
    const t = Math.min(tx_, ty);
    return [ox + dx * t, oy + dy * t];
  };
  const esquinas = [[0, 0], [W, 0], [W, H], [0, H]].map(p => ({ p, a: Math.atan2(p[1] - oy, p[0] - ox) }));
  const norm = a => ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

  const capa = document.createElement("div");
  capa.className = "rotura";
  document.body.appendChild(capa);
  const trozos = [];
  for (let i = 0; i < n; i++) {
    const a1 = angs[i], a2 = angs[(i + 1) % n] + (i === n - 1 ? 2 * Math.PI : 0);
    const poly = [[ox, oy], borde(a1)];
    esquinas.map(c => ({ p: c.p, d: norm(c.a - a1) })).filter(c => c.d > 0 && c.d < a2 - a1)
      .sort((x, y) => x.d - y.d).forEach(c => poly.push(c.p));
    poly.push(borde(a2));
    const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length;
    const cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
    const trozo = document.createElement("div");
    trozo.style.cssText = `left:${rc.left}px;top:${rc.top}px;width:${W}px;height:${H}px;` +
      `clip-path:polygon(${poly.map(p => p[0].toFixed(1) + "px " + p[1].toFixed(1) + "px").join(",")});` +
      `transform-origin:${cx}px ${cy}px`;
    const copia = card.cloneNode(true);
    // Sin ids: dos `#modal-msg` en el documento confunden a quien lo busque.
    copia.querySelectorAll("[id]").forEach(x => x.removeAttribute("id"));
    copia.style.cssText = `width:${W}px;height:${H}px;max-width:none;margin:0`;
    copia.scrollTop = card.scrollTop;
    trozo.appendChild(copia);
    capa.appendChild(trozo);
    /* Sale disparado desde el aro: más rápido cuanto más cerca del golpe,
       con un salto hacia arriba, girando en los tres ejes. */
    const dir = Math.atan2(cy - oy, cx - ox);
    const cerca = 1 - Math.min(1, Math.hypot(cx - ox, cy - oy) / Math.max(W, H));
    const v = 340 + cerca * 380 + Math.random() * 260;
    trozos.push({ el: trozo, top: rc.top + cy, x: 0, y: 0, a: 0, rx: 0, ry: 0,
      vx: Math.cos(dir) * v, vy: Math.sin(dir) * v - (240 + Math.random() * 280),
      va: (Math.random() - 0.5) * 820, vrx: (Math.random() - 0.5) * 520, vry: (Math.random() - 0.5) * 520,
      dx: Math.cos(dir), dy: Math.sin(dir), alto: 26 });
  }
  // Esquirlas: trocitos del mismo material, más pequeños y más rápidos.
  for (let i = 0; i < 18; i++) {
    const e = document.createElement("div"), t = 4 + Math.random() * 7;
    e.className = "esquirla";
    e.style.cssText = `left:${rc.left + ox - t / 2}px;top:${rc.top + oy - t / 2}px;width:${t}px;height:${t}px;` +
      `clip-path:polygon(50% 0,100% ${60 + Math.random() * 40}%,0 100%)`;
    capa.appendChild(e);
    const a = Math.random() * Math.PI * 2, v = 500 + Math.random() * 600;
    trozos.push({ el: e, top: rc.top + oy, x: 0, y: 0, a: 0, rx: 0, ry: 0,
      vx: Math.cos(a) * v, vy: Math.sin(a) * v - 300, va: (Math.random() - 0.5) * 1400,
      vrx: 0, vry: 0, dx: 0, dy: 0, alto: 4 });
  }

  /* La tarjeta de verdad se esconde y el modal se cierra por debajo de los
     trozos. Se le devuelve la visibilidad cuando el velo ya se fue: el modal
     es UNO, y escondido se quedaría escondido para la siguiente pregunta. */
  card.style.visibility = "hidden";
  modalDone(false);
  setTimeout(() => { card.style.visibility = ""; const c = card.querySelector(".grietas"); if (c) c.remove(); }, 400);
  soltarGolpes();

  volarTrozos(trozos, () => {
    capa.remove();
    abrirARomper(id);
  });
}

/* Las físicas, a mano: gravedad, rebote contra el borde de abajo de la
   pantalla con rozamiento, y desvanecerse al final. `setTimeout` y no
   fotogramas, por lo mismo que las grietas. */
function volarTrozos(trozos, fin) {
  const piso = window.innerHeight, GRAV = 2600, REBOTE = 0.34, ROCE = 0.72;
  const CRUJE = 0.09, APAGA = 1.05, DURA = 0.7;
  const quieto = menosMovimiento();
  let t = 0, antes = Date.now();
  const paso = () => {
    const ahora = Date.now(), dt = Math.min(0.04, (ahora - antes) / 1000);
    antes = ahora; t += dt;
    trozos.forEach(p => {
      if (quieto) { p.el.style.opacity = Math.max(0, 1 - t / 0.6); return; }
      if (t < CRUJE) {
        // El crujido: los trozos se separan un pelo antes de salir.
        const k = t / CRUJE * 3;
        p.el.style.transform = `translate(${p.dx * k}px,${p.dy * k}px)`;
        return;
      }
      p.vy += GRAV * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.a += p.va * dt; p.rx += p.vrx * dt; p.ry += p.vry * dt;
      const fondo = p.top + p.y + p.alto;
      if (fondo > piso && p.vy > 0) {
        p.y -= fondo - piso;
        p.vy = -p.vy * REBOTE; p.vx *= ROCE; p.va *= ROCE; p.vrx *= 0.5; p.vry *= 0.5;
        if (Math.abs(p.vy) < 60) p.vy = 0;
      }
      p.el.style.opacity = t < APAGA ? 1 : Math.max(0, 1 - (t - APAGA) / DURA);
      p.el.style.transform = `translate3d(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px,0) rotate(${p.a.toFixed(1)}deg)` +
        ` rotateX(${p.rx.toFixed(1)}deg) rotateY(${p.ry.toFixed(1)}deg)`;
    });
    const dura = quieto ? 0.65 : APAGA + DURA + 0.05;
    if (t < dura) setTimeout(paso, 16); else fin();
  };
  paso();
}

/* Lo que pasa cuando se rompe: lo mismo que cuando se llega al nivel, en el
   mismo orden que `revisarNivelExpedicion` (js/02-progreso.js). Apuntar,
   sembrar lo que la bienvenida dejó para este módulo, guardar, quitar el
   candado del menú, y la fiesta. */
function abrirARomper(id) {
  const m = MODULOS.find(x => x.id === id);
  const nombre = m ? tx(m.label) : id;
  /* Lo que hay dentro se escribe ANTES de sembrar: se lee de la misma nota
     (`settings.siembra`) que va a usarse para plantarlo. */
  const s = state.settings && state.settings.siembra;
  let dentro = "";
  if (s && id === "tree") {
    const ramas = (typeof ONBOARD_AREAS !== "undefined" ? ONBOARD_AREAS : [])
      .filter(a => (s.areas || []).indexOf(a.id) >= 0).map(a => tx(a.branch));
    if (ramas.length === 1) dentro = T`Tu rama de ${ramas[0]} ya está dentro.`;
    else if (ramas.length > 1) dentro = T`Tus ramas de ${enLista(ramas)} ya están dentro.`;
  } else if (s && id === "projects" && s.project) {
    dentro = T`«${s.project}» ya está dentro.`;
  }

  state.settings = state.settings || {};
  const rotos = Array.isArray(state.settings.rotos) ? state.settings.rotos : [];
  if (rotos.indexOf(id) < 0) rotos.push(id);
  state.settings.rotos = rotos;
  if (typeof sembrarLoApuntado === "function") sembrarLoApuntado();
  save();
  aplicarModulos();
  const resumen = document.getElementById("view-summary");
  if (resumen && resumen.classList.contains("active") && typeof renderSummary === "function") renderSummary();

  const trazo = trazoDeModulo(id);
  const cuerpo =
    (trazo ? '<span class="roto-medalla"><svg viewBox="0 0 24 24" aria-hidden="true">' + trazo + '</svg></span>' : "") +
    '<span class="cerr-tx">' + escapeHtml(T`${nombre} no te esperaba tan pronto.`) +
    (dentro ? " " + escapeHtml(dentro) : "") + '</span>';
  if (navigator.vibrate) { try { navigator.vibrate([40, 60, 40, 60, 140]); } catch (x) {} }
  askBase(cuerpo, true, T`Ver ${nombre}`, false, false, null,
          { tono: "menta", titulo: T`¡Módulo «${nombre}» desbloqueado!`, soloOk: true })
    .then(ir => { if (ir) irAModulo(id === "tree" ? "tree" : "projects"); });
}

/* A qué módulo pertenece cada vista, incluidas sus pantallas hijas: si
   Talentos está apagado, tampoco debe poder abrirse la ficha de un talento
   por un enlace viejo del Resumen. */
const VISTA_MODULO = {
  missions: "missions", "mission-form": "missions",
  home: "home", detail: "home", form: "home", catalog: "home",
  tree: "tree", perk: "tree", "perk-form": "tree",
  projects: "projects", project: "projects", "project-form": "projects",
  jornada: "jornada"
};

function moduloOn(id) {
  const off = (state.ui && state.ui.modulosOff) || [];
  return !off.includes(id);
}

/* El menú, con sus candados. Se llama al arrancar, al cambiar un interruptor
   y al subir de nivel.

   Un módulo APAGADO desaparece; uno CERRADO se queda y se le pone el candado
   encima. Es la diferencia entera: lo que escondes no se echa de menos, y de
   lo que no se echa de menos nadie quiere saber cuándo llega. */
function aplicarModulos() {
  MODULOS.forEach(m => {
    const el = document.getElementById(m.nav);
    if (!el) return;
    el.style.display = moduloOn(m.id) ? "" : "none";
    const cerrado = !moduloAbierto(m.id);
    el.classList.toggle("con-candado", cerrado);
    /* El candado se pinta una vez y se queda: quitarlo y volver a ponerlo en
       cada repintado le corta la transición al que acaba de abrirse. */
    let ll = el.querySelector(".nav-candado");
    if (cerrado && !ll) {
      ll = document.createElement("i");
      ll.className = "nav-candado";
      ll.setAttribute("aria-hidden", "true");
      ll.innerHTML = icon("lock", 10);
      el.appendChild(ll);
    } else if (!cerrado && ll) ll.remove();
    /* Y lo dice también quien no ve la pantalla. El rótulo del botón sigue
       siendo el nombre del módulo; el candado va detrás, como en la barra. */
    const base = tx(m.label);
    el.setAttribute("aria-label", cerrado ? T`${base} · se abre en el nivel ${MODULO_NIVEL[m.id]}` : base);
  });
  /* Con la Jornada la barra del teléfono lleva seis círculos y hay que
     apretarlos para que quepan (css/jornada.css). */
  document.documentElement.classList.toggle("con-jornada", moduloOn("jornada"));
}

function setModulo(id, on) {
  state.ui = state.ui || {};
  const off = new Set(state.ui.modulosOff || []);
  if (on) off.delete(id); else off.add(id);
  if (off.size >= MODULOS.length) { toast(tx("Deja al menos un módulo encendido"), "atencion"); return; }
  state.ui.modulosOff = [...off];
  save();
  aplicarModulos();
  renderModulos();
  if (!on && VISTA_MODULO[activeMainView] === id) showView("summary");
  else renderSummary();
  toast(on ? T`${tx(MODULOS.find(m => m.id === id).label)} vuelve al menú` : tx("Oculto · puedes traerlo de vuelta aquí"), on ? "hecho" : "deshecho");
}

function renderModulos() {
  const el = document.getElementById("modulos-list");
  if (!el) return;
  el.innerHTML = MODULOS.map(m => {
    const on = moduloOn(m.id);
    /* Un módulo que el nivel todavía no abrió no tiene interruptor, y no
       porque no se pueda: apagar lo que aún no existe no significa nada, y un
       interruptor apagado al lado de un candado son dos cosas distintas
       diciendo lo mismo. En su sitio va el nivel al que se abre, que es la
       única respuesta que hace falta ahí. */
    if (!moduloAbierto(m.id)) {
      return `
    <button class="mod-row cerrado" onclick="avisoModuloCerrado('${m.id}')">
      <span class="mod-tx"><b>${escapeHtml(tx(m.label))}</b><span>${escapeHtml(tx(m.hint))}</span></span>
      <span class="mod-llave">${icon("lock", 12)}${escapeHtml(T`Nivel ${MODULO_NIVEL[m.id]}`)}</span>
    </button>`;
    }
    return `
    <button class="mod-row ${on ? "on" : ""}" onclick="setModulo('${m.id}', ${!on})">
      <span class="mod-tx"><b>${escapeHtml(tx(m.label))}</b><span>${escapeHtml(tx(m.hint))}</span></span>
      <span class="mod-sw"><i></i></span>
    </button>`;
  }).join("");
}

/* ================= Navegación ================= */

const NAV_VIEWS = { summary: "nav-summary", missions: "nav-missions", home: "nav-home", tree: "nav-tree", projects: "nav-projects", jornada: "nav-jornada", settings: "nav-settings-side" };

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
  /* Cualquier gesto que NO sea "salir" desarma el aviso. Antes el aviso se
     quedaba armado dos segundos y medio pase lo que pase: si en ese rato
     cerrabas un cuadro con otro gesto, el siguiente ya contaba como el
     segundo y la app se iba. Los dos gestos de salir tienen que ser
     seguidos y los dos en la raíz. */
  const desarmar = () => { avisoDeSalida = 0; return true; };

  // 1. Capas que están por encima de todo
  const menu = document.getElementById("ajustes-menu");
  if (menu && menu.classList.contains("show")) { cerrarMenuAjustes(); return desarmar(); }

  const tuto = document.getElementById("tuto");
  if (tuto && tuto.classList.contains("show")) { cerrarTutorial(); return desarmar(); }

  if (typeof ventanaCajaId !== "undefined" && ventanaCajaId) { cerrarVentanaCaja(); return desarmar(); }

  /* Las hojas de la Jornada. El cierre de un tramo no se va con el gesto —se
     perdería el tramo—, pero el gesto se consume igual: salir de la app con
     un tramo sin guardar sería peor. */
  if (typeof jornadaHojaAbierta === "function" && jornadaHojaAbierta()) { cerrarHojaJornada(true); return desarmar(); }

  const modal = document.getElementById("modal");
  if (modal && modal.classList.contains("show")) { modalDone(false); return desarmar(); }

  if (typeof fullscreenBranch !== "undefined" && fullscreenBranch) { closeBranchFullscreen(); return desarmar(); }

  // 2. Modos que cambian lo que hacen los toques
  if (typeof selNodos !== "undefined" && (selNodos.size || modoElegir)) { soltarSeleccion(); return desarmar(); }
  if (typeof editBranch !== "undefined" && editBranch) { toggleEditBranch(editBranch); return desarmar(); }
  if (typeof dashEditing !== "undefined" && dashEditing) { setDashEdit(false); return desarmar(); }

  // 3. Navegación: lo mismo que haría la flecha de esta pantalla
  const activa = document.querySelector(".view.active");
  const vista = activa ? activa.id.replace("view-", "") : "summary";

  if (vista === "settings") {
    // En el teléfono, Ajustes tiene su propio paso intermedio: la lista
    if (!isDesktop() && ajusteAbierto) { volverDeAjustes(); return desarmar(); }
    showView("summary");
    return desarmar();
  }
  /* ---- Los formularios salen por su propia puerta ----
     Y no por `padre`, que es lo que hacían hasta la 0.7.99. El comentario de
     arriba dice «lo mismo que haría la flecha de esta pantalla», y en los
     cuatro formularios eso era falso justo donde más caro salía: desde que
     salir guarda (ver `salirGuardando`), la flecha conserva lo escrito y el
     gesto de atrás del teléfono lo tiraba. Dos salidas de la misma pantalla
     haciendo cosas contrarias es peor que ninguna de las dos. */
  const PUERTA_FORM = {
    "form": "cancelForm", "perk-form": "cancelPerkForm",
    "project-form": "cancelProjectForm", "mission-form": "cancelMissionForm"
  };
  if (PUERTA_FORM[vista] && typeof window[PUERTA_FORM[vista]] === "function") {
    window[PUERTA_FORM[vista]]();
    return desarmar();
  }

  const padre = VISTA_MODULO[vista];
  if (padre && padre !== vista) { showView(padre); return desarmar(); }

  // 4. Ya en la raíz
  if (isDesktop()) return false;
  const ahora = Date.now();
  if (ahora - avisoDeSalida < 2600) return false;
  avisoDeSalida = ahora;
  toast(tx("Desliza otra vez para salir"), "calma");
  return true;
}

/* ================= Pantallas esqueleto, solo cuando de verdad tardan ==========
   Lo pidió Eduardo y con la condición correcta: **«no quiero pantallas de carga
   forzadas»**, pero sí un acuse en los casos extraordinarios —poca red, un
   dispositivo de gama baja— para que la espera se lea como «sí, está cargando»
   y no como «esta app no funciona».

   ---- Por qué no se pone siempre ----
   Medido en la 0.7.96, pintar una pantalla cuesta entre 4 y 22 ms, y la primera
   entrada de una sesión —la más cara— 51 ms en la peor. Un esqueleto ahí no se
   vería; para que se viera habría que retrasar el pintado a propósito, o sea
   hacer la app más lenta para poder enseñar que está cargando. Eso es
   exactamente la pantalla de carga forzada que él no quiere.

   ---- Cómo sabe si tarda, sin adivinar ----
   La app se CRONOMETRA a sí misma. Cada vez que pinta una pantalla apunta lo
   que le costó, y la próxima vez que se entre ahí decide con ese número: si la
   última vez pasó de `ESQ_UMBRAL`, esta vez enseña el esqueleto y aplaza el
   pintado un fotograma para que se vea. No hay lista de dispositivos lentos ni
   olfato: hay una medición del aparato que lo está corriendo. En un teléfono
   rápido esta rama no se ejecuta nunca.

   El umbral son 180 ms porque por debajo de eso el esqueleto sería un parpadeo,
   que se lee peor que no poner nada.

   ---- Y por qué solo estas cinco ----
   Son las pantallas a las que se llega navegando, y las únicas donde aplazar el
   pintado un fotograma no se lo pisa a nadie: cuando se aplaza, TODO lo demás
   de `showView` ya pasó —la vista activa, el botón encendido, el ancho, el ＋ y
   el rótulo de la pestaña—, así que lo único que llega tarde es el contenido,
   que es justo lo que el esqueleto está ocupando. Las fichas y los formularios
   se quedan fuera a propósito: a esos se llega desde código que a veces pinta
   antes y muestra después (`renderDetail(); showView("detail")`).

   ---- Para verlo sin tener un teléfono lento a mano ----
   `?esqueleto=1` lo fuerza siempre y `?esqueleto=0` lo apaga del todo. Sin
   parámetro manda la medición, que es como va a funcionar de verdad. */
const ESQ_UMBRAL = 180;
const ESQ_CONTENEDOR = {
  summary: "summary-content", missions: "missions-content",
  home: "skill-list", tree: "tree-content", projects: "projects-content"
};
/* Lo que costó pintar cada pantalla la última vez, EN ESTE dispositivo. Vive en
   memoria y no se guarda: un teléfono no se vuelve lento entre sesiones, y
   guardarlo obligaría a decidir cuándo caduca. */
const _esqCoste = {};

/* Se resuelve UNA vez y se recuerda, como el resto de las pruebas con enlace.
   Releyendo la dirección en cada llamada, el parámetro se volvía imborrable
   mientras siguiera escrito arriba —quitarlo de `sessionStorage` no servía de
   nada porque la siguiente llamada lo volvía a poner— y eso se comía la única
   forma de probar la decisión automática. */
let _esqForzadoLeido;

function esqForzado() {
  if (_esqForzadoLeido !== undefined) return _esqForzadoLeido;
  let v = null;
  try {
    const q = new URLSearchParams(location.search).get("esqueleto");
    if (q === "1" || q === "0") sessionStorage.setItem("norata-prueba-esqueleto", q);
    v = sessionStorage.getItem("norata-prueba-esqueleto");
  } catch (e) { /* sin sessionStorage: manda la medición */ }
  _esqForzadoLeido = v === "1" ? true : v === "0" ? false : null;
  return _esqForzadoLeido;
}

function esqHaceFalta(name) {
  if (!ESQ_CONTENEDOR[name]) return false;
  const f = esqForzado();
  if (f !== null) return f;
  return (_esqCoste[name] || 0) > ESQ_UMBRAL;
}

/* ---- La forma se MIDE, no se inventa ----
   La primera versión llevaba tres o cuatro alturas fijas de 56 a 190 px, y
   Eduardo lo cazó a la primera: «me salieron 3 rectángulos en lista muy
   pequeños en Resumen y siento que no se ve bien». Tenía razón por un factor
   de tres — las tarjetas del Resumen miden 504, 395, 130 y 203 px, no 190 —, y
   el problema de fondo era peor que las cifras: **inventar la forma la condena
   a envejecer**. El día que se añada una tarjeta o alguien acomode su tablero,
   el hueco deja de parecerse a lo que llega.

   Así que la app se mira a sí misma: después de cada pintado apunta las alturas
   reales de las tarjetas de esa pantalla, y el esqueleto las repite. Se parece
   por construcción, y sigue pareciéndose cuando la pantalla cambie. Y como el
   esqueleto solo sale cuando la pantalla YA se pintó lenta una vez, la medida
   siempre existe: la lista de abajo es solo para la primera vez de todas.

   Los bloques van como hijos DIRECTOS del contenedor, sin envoltorio. Eso es lo
   que hace que adopten la disposición que ya tenga: `#summary-content` es la
   rejilla del tablero (`.dash`), así que ahí caen como caen las tarjetas, y en
   las demás se apilan. Con un `<div>` en medio, el esqueleto del Resumen era
   una sola celda con tres rayitas dentro — que es exactamente lo que él vio. */
const ESQ_FORMA_INICIAL = {
  summary:  [500, 390, 130, 200],
  missions: [350, 40, 360, 150],
  home:     [80, 80, 80, 80, 80, 80],
  tree:     [355, 45, 570],
  projects: [335, 205, 37, 310]
};
/* Las alturas de la última vez, por pantalla y en ESTE dispositivo. */
const _esqForma = {};

/* Se llama después de cada pintado. Recorta a seis bloques y a metro y medio de
   pantalla: dibujar tres mil píxeles de hueco no ayuda a nadie, y nadie ve más
   allá de lo que cabe más un poco. */
function esqRecordarForma(name) {
  const el = document.getElementById(ESQ_CONTENEDOR[name] || "");
  if (!el || !el.children.length) return;
  const alturas = [];
  let suma = 0;
  const tope = innerHeight * 1.5;
  for (const hijo of el.children) {
    const h = Math.round(hijo.getBoundingClientRect().height);
    if (h < 24) continue;                       // separadores y rótulos sueltos
    alturas.push(Math.min(h, 560));
    suma += h;
    if (alturas.length >= 6 || suma > tope) break;
  }
  if (alturas.length) _esqForma[name] = alturas;
}

function esqPintar(name) {
  const el = document.getElementById(ESQ_CONTENEDOR[name]);
  if (!el || el.dataset.esq === "1") return;
  el.dataset.esq = "1";
  const alturas = _esqForma[name] || ESQ_FORMA_INICIAL[name] || [200, 200];
  el.innerHTML = alturas
    .map(h => `<i class="esq-bloque" style="height:${h}px" aria-hidden="true"></i>`)
    .join("");
}

function esqQuitar(name) {
  const el = document.getElementById(ESQ_CONTENEDOR[name] || "");
  if (el) delete el.dataset.esq;
}

function showView(name) {
  /* Un módulo apagado —o que el nivel todavía no abrió— no se abre ni por un
     enlace que quedara apuntando ahí. Aquí se rebota en silencio a propósito:
     esta función la llaman el arranque, el gesto de atrás y una docena de
     botones, y quien toca un candado a sabiendas ya pasó por `irAModulo`, que
     es quien lo explica. */
  const mod = VISTA_MODULO[name];
  if (mod && !moduloUsable(mod)) name = "summary";

  /* Cambiar de pantalla cierra lo que hubiera puesto encima. Una ventana es
     una capa sobre UNA pantalla; en cuanto la pantalla de debajo ya no es la
     misma, la ventana está hablando de otra cosa.

     Sin esto pasaba justo eso: "Ver otra vez qué hace cada sección" llevaba al
     Resumen y arrancaba el tutorial, pero la ventana de Ajustes seguía
     encima —y el tutorial detrás—, así que el botón parecía no hacer nada. Y
     al borrar todos los datos, la app quedaba vacía debajo de una ventana que
     seguía enseñando ajustes de lo que ya no existía.

     Se arregla aquí y no en cada botón porque los botones son muchos y van a
     seguir apareciendo; pasar de pantalla, en cambio, pasa por un solo sitio.
     Todas se van solas si no había ninguna puesta. */
  if (typeof cerrarMenuAjustes === "function") cerrarMenuAjustes();
  if (typeof cerrarVentanaCaja === "function") cerrarVentanaCaja();
  if (typeof cerrarHojaJornada === "function") cerrarHojaJornada(true);

  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById("view-" + name).classList.add("active");
  document.querySelectorAll(".thumb-cluster .c-nav").forEach(b => b.classList.remove("active"));
  const navId = NAV_VIEWS[name] ||
    (name === "detail" || name === "form" || name === "catalog" ? "nav-home" :
     (name === "perk" || name === "perk-form" ? "nav-tree" :
     (name === "project" || name === "project-form" ? "nav-projects" :
     (name === "mission-form" ? "nav-missions" :
     /* El informe no es de ningún módulo: se llega a él desde los cuatro. Sin
        este caso caía en el comodín y encendía "Resumen", diciendo que estabas
        en una pantalla en la que no estabas. */
     (name === "informe" ? null : "nav-summary")))));
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
    /* «Nueva rama» en los dos, y no es un descuido. Lo que se crea aquí es una
       RAMA DE PROYECTOS; una vez creada se la llama proyecto, y de ahí en
       adelante toda la app dice «proyecto». El nombre completo va en el cuadro
       que pide el nombre —igual que Talentos, cuyo botón también dice «Nueva
       rama» y cuyo cuadro dice «Nueva rama de talentos»—, porque en el botón
       ya se sabe en qué pantalla estás. */
    home: tx("Nueva habilidad"), tree: tx("Nueva rama"),
    projects: tx("Nueva rama"), missions: tx("Nuevo tablero")
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
    toast(tx("Modo Editor cerrado · tu tablero quedó guardado"), "hecho");
  }

  /* Los candados del menú se repasan en cada viaje. Es barato —cuatro botones,
     una clase y un rótulo— y es lo único que cierra el hueco entre las dos
     formas de abrir un módulo: el nivel avisa por su cuenta (ver
     `revisarNivelExpedicion`), pero un módulo también se abre por TENER algo
     dentro, y eso pasa sin que suba ningún nivel — al ver el ejemplo completo,
     al importar un respaldo, o cuando la sincronía trae una cuenta con
     talentos. Sin esta línea el candado se quedaba puesto encima de un módulo
     ya abierto hasta la siguiente vez que se abriera la app. */
  aplicarModulos();

  window.scrollTo(0, 0);
  /* El colchón se repone al movernos: si algo lo consumió por su cuenta (una
     vuelta de Google limpia la dirección con replaceState, por ejemplo), el
     gesto de atrás se quedaría sin red. */
  armarColchon();
  /* El pintado va envuelto para dos cosas: cronometrarlo —de ahí sale la
     decisión del esqueleto la próxima vez— y poder aplazarlo un fotograma
     cuando toca enseñarlo. Ver el bloque de las pantallas esqueleto, arriba. */
  const pintar = () => {
    const t0 = performance.now();
    esqQuitar(name);
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
    if (name === "jornada" && typeof renderJornada === "function") renderJornada();
    if (ESQ_CONTENEDOR[name]) {
      _esqCoste[name] = performance.now() - t0;
      esqRecordarForma(name);
    }
  };

  if (esqHaceFalta(name)) {
    esqPintar(name);
    /* ---- Dos caminos al mismo sitio, y el segundo NO es de adorno ----
       Dos vueltas de `requestAnimationFrame` y no una: con una sola, el
       navegador puede agrupar el esqueleto y el contenido en el mismo
       fotograma y el esqueleto no llega a verse.

       Y un `setTimeout` de red, porque **`requestAnimationFrame` no siempre
       corre**: en una pestaña de fondo el navegador lo para en seco, y si el
       usuario se cambia de app justo al tocar un módulo, sin esta red la
       pantalla se quedaría con el esqueleto puesto PARA SIEMPRE. Se descubrió
       aquí mismo: el panel donde se prueba esto no compone fotogramas, así que
       el esqueleto salía y el contenido no llegaba nunca.

       `hecho` es lo que garantiza que se pinte UNA vez, gane quien gane. */
    let hecho = false;
    const unaVez = () => { if (hecho) return; hecho = true; pintar(); };
    requestAnimationFrame(() => requestAnimationFrame(unaVez));
    setTimeout(unaVez, 120);
  } else {
    pintar();
  }

  // Lo último: los rótulos de arriba ya están pintados y se pueden leer
  titularPestana(name);

  /* Y si es la primera vez que se entra a un módulo que abrió el nivel, se
     presenta. Va al final y con retraso propio (ver `quizaPresentarModulo`,
     js/09-inicio.js): la pantalla tiene que estar pintada debajo, o la tarjeta
     explica algo que todavía no se ve. */
  if (typeof quizaPresentarModulo === "function") quizaPresentarModulo(name);
}

/* El nombre de la pestaña dice en qué parte de la app estás. En el teléfono no
   se ve nunca; en la computadora, con ocho pestañas abiertas y el título
   recortado a dos palabras, es la diferencia entre encontrar Norata y abrir
   tres para dar con ella.

   El rótulo se LEE del encabezado de la propia pantalla en vez de una lista
   aparte. Así "Nueva habilidad" y "Editar habilidad" salen distintos sin
   escribir una línea, y ningún título se queda desfasado el día que alguien
   cambie el de una pantalla y no se acuerde de esta función.

   Ajustes se queda fuera a propósito, por petición de Eduardo. */
const ROTULO_PESTANA = {
  // Su encabezado es "Árbol de talentos", que recortado no dice nada
  tree: "Talentos",
  // El suyo lleva pegada la chapa de «Prueba», que en la pestaña sobra
  jornada: "Pomodoro"
};

function titularPestana(name) {
  const APP = "Norata";
  /* Con la entrada o la carga delante, lo que se ve NO es esa pantalla. La
     pestaña diría "Resumen" mientras se pide la contraseña. */
  if (document.getElementById("portada") || (typeof cargaVisible === "function" && cargaVisible())) {
    document.title = APP;
    return;
  }
  const vista = document.getElementById("view-" + name);
  const cabecera = vista && vista.querySelector(".page-head h1, .back-row h2");
  const rotulo = ROTULO_PESTANA[name] || (cabecera ? cabecera.textContent.trim() : "");
  document.title = (name === "settings" || !rotulo) ? APP : rotulo + " - " + APP;
}

const VISTAS_ANCHAS = new Set(["summary", "missions", "home", "tree", "projects", "jornada"]);

function fabAction() {
  if (activeMainView === "tree") crearRama("perks");
  else if (activeMainView === "projects") crearRama("projects");
  else if (activeMainView === "missions") crearTableroMisiones();
  else openSkillForm();
}

