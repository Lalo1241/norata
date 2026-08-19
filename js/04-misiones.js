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
  return missionScheduledOn(m, todayKey());
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

function logMission(id, delta) {
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

  if (nowDone && !wasDone) {
    if (m.skillId && m.xp) {
      const s = state.skills.find(x => x.id === m.skillId);
      if (s) addXp(s, m.xp, `Misión cumplida: ${m.name}`, `Misión · ${m.name}`);
    }
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
    // Deshacer algo ya logrado merece notarse: sin esto, quitar una misión
    // cumplida y quitar una a medias se sentían exactamente igual.
    sacudirPantalla();
  }
  save();
  renderMissions();

  if (delta > 0) checkStreakMilestone();

  if (nowDone && !wasDone) {
    const st = missionStreak(m);
    if (st > 0 && st % 7 === 0) {
      celebrate(`${st} días seguidos`, m.name, m.color || "#5fe0b0", m.icon);
    } else {
      toast(`${m.name} cumplida${m.xp ? ` · +${m.xp} XP` : ""}${st > 1 ? ` · racha ${st}` : ""}`, "logro");
    }
  } else if (delta > 0) {
    toast(`${m.name}: ${after} de ${target}`, "hecho");
  } else {
    toast(`${m.name}: ${after} de ${target}`, "deshecho", { label: "Rehacer", onclick: `logMission('${m.id}', 1)` });
  }
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

function hacerReordenable(cont, sel, alSoltar, permitido) {
  if (!cont || cont.dataset.reord) return;
  cont.dataset.reord = "1";

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
  reord.pieza.classList.add("arr-hueco");
  if (userHasTapped && navigator.vibrate) navigator.vibrate(12);
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

  const bajo = document.elementFromPoint(e.clientX, e.clientY);
  const sobre = bajo && bajo.closest(sel);
  if (!sobre || sobre === pieza || !cont.contains(sobre)) return;
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
  const { cont, sel, alSoltar, pieza, flota, espera, activo } = reord;
  reord = null;
  if (espera) clearTimeout(espera);
  if (!activo) return;
  if (flota) flota.remove();
  pieza.classList.remove("arr-hueco");
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

function attachMisionOrden() {
  hacerReordenable(document.getElementById("ms-pend"), ".ms-card", (ids) => {
    guardarOrden("misionOrden", ids);
    renderMissions();
  });
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
  const fab = document.getElementById("fab");
  fab.classList.toggle("hidden",
    !(name === "home" || name === "tree" || name === "projects" || name === "missions"));
  fab.querySelector(".fab-label").textContent = {
    home: "Nueva habilidad", tree: "Nuevo talento",
    projects: "Nuevo encargo", missions: "Nueva misión"
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

  window.scrollTo(0, 0);
  if (name === "catalog") renderCatalogo();
  if (name === "summary") renderSummary();
  if (name === "settings") { renderTimezone(); renderModulos(); renderSync(); renderCopias(); renderZonaCuenta(); }
  if (name === "missions") renderMissions();
  if (name === "home") renderHome();
  if (name === "tree") { focusPending = true; renderTree(); }
  if (name === "projects") renderProjects();
}

function fabAction() {
  if (activeMainView === "tree") openPerkForm();
  else if (activeMainView === "projects") openProjectForm();
  else if (activeMainView === "missions") openMissionForm();
  else openSkillForm();
}

