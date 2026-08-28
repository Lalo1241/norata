/* Resumen, tablero, catálogo y el motor de sugerencia */
/* ================= Render: resumen ================= */

/* El saludo de la madrugada saluda a la HORA y no a la persona, y esa es toda
   la idea: «trasnochador» le pone género a quien lee —y una «a» detrás no lo
   arregla, lo alarga— además de sonar a reproche amable. La hora no tiene
   género y aquí sí hay algo bonito que decir: son las cuatro de la mañana y
   la tarjeta es un cielo estrellado. */
function greeting() {
  const h = hourNow();
  if (h < 6) return "Hola, madrugada";
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

function renderSummary() {
  const el = document.getElementById("summary-content");
  const skills = state.skills;
  const perks = state.perks;
  const projects = state.projects;
  const missions = state.missions;

  /* Con el tablero vacío no hay tablero que acomodar. El botón de ordenar
     widgets encima de la pantalla de bienvenida ofrecía un modo sin nada
     dentro, justo cuando la única pregunta que importa es por cuál de los
     tres caminos empezar. */
  const vacio = skills.length === 0 && perks.length === 0 && projects.length === 0 && missions.length === 0;
  const btnTablero = document.getElementById("dash-btn");
  if (vacio && btnTablero) btnTablero.style.display = "none";
  if (vacio) {
    dashEditing = false;
    el.className = "dash";
    el.innerHTML = `
      <div class="empty">
        <div class="bubble">${icon("compass", 34)}</div>
        <h2>Tu expedición empieza aquí</h2>
        <p>Convierte tu vida en un videojuego: misiones que haces hoy, habilidades que suben con la práctica, talentos que compras con dinero real y proyectos que avanzan por etapas.</p>
        <div class="stack" style="align-items:center">
          <button class="btn btn-primary" onclick="startOnboarding()">Armar mi tablero en 3 preguntas</button>
          <button class="btn btn-ghost" onclick="verElEjemplo()">Ver un ejemplo completo</button>
          <button class="btn btn-ghost" onclick="openSkillForm()">Empezar de cero</button>
        </div>
      </div>`;
    return;
  }

  const stk = streakInfo();
  const totalLevels = skills.reduce((a, s) => a + levelInfo(s.xp).level, 0);
  const decayingList = skills.filter(isDecaying);
  const dueList = perks.filter(p => perkStatus(p) === "due");
  const activeList = perks.filter(p => perkStatus(p) === "active");
  const invested = perks.reduce((a, p) => a + (p.investedTotal || 0), 0);
  const dateTxt = keyToDate(todayKey()).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });

  const readyList = perks.filter(p => perkStatus(p) === "available");
  const attention = [
    ...dueList.map(p => `
      <button class="att-item" onclick="openPerk('${p.id}')">
        <span class="dot" style="background:var(--fire-soft);color:var(--fire)">${icon("flag", 17)}</span>
        <span class="tx"><b>${escapeHtml(p.name)}</b><span>El plan venció — confirma si lo lograste</span></span>
        <span class="go">→</span>
      </button>`),
    ...decayingList.map(s => {
      const d = diasParaBajarNivel(s);
      return `
      <button class="att-item" onclick="openDetail('${s.id}')">
        <span class="dot" style="background:var(--coral-soft);color:var(--coral)">${icon(s.icon, 17)}</span>
        <span class="tx"><b>${escapeHtml(s.name)}</b><span>−${desgasteDiario(s)} XP al día${d ? ` · a ${d} día${d === 1 ? "" : "s"} de bajar al nivel ${levelInfo(s.xp).level - 1}` : ""}</span></span>
        <span class="go">→</span>
      </button>`;
    })
  ];
  const stalledProjects = projects.filter(p => projectHealth(p).key === "stalled");
  stalledProjects.forEach(p => attention.push(`
      <button class="att-item" onclick="openProject('${p.id}')">
        <span class="dot" style="background:var(--coral-soft);color:var(--coral)">${icon(p.icon, 17)}</span>
        <span class="tx"><b>${escapeHtml(p.name)}</b><span>Estancado ${daysIdle(p)} días — retómalo o suéltalo</span></span>
        <span class="go">→</span>
      </button>`));
  if (!stk.activeToday) {
    attention.push(`
      <button class="att-item" onclick="showView('home')">
        <span class="dot" style="background:var(--mint-soft);color:var(--mint)">${icon("flame", 17)}</span>
        <span class="tx"><b>Aún no registras práctica hoy</b><span>Una sesión corta mantiene viva tu racha</span></span>
        <span class="go">→</span>
      </button>`);
  }

  // Cada bloque del tablero es un widget que se puede mover u ocultar
  const W = {
    /* ---- La tarjeta de la racha ----

       Estaba desaprovechada y se veía: media tarjeta de cielo vacío arriba, el
       contenido apretado contra el borde de abajo y el mes en una esquina.
       Eduardo lo comparó con la pantalla de racha de Duolingo, que es la
       referencia obvia del género, y la pregunta que sacamos de ahí no fue
       «cómo copiarla» sino qué hace bien: **el mes entero es la superficie que
       hace volver, no el número.** Ver el mes llenándose es lo que engancha;
       el número solo lo resume.

       Y desde 0.7.35 la tarjeta **sabe de qué ancho es**: puede ocupar una,
       dos o tres columnas del tablero, y cada ancho tiene su acomodo en vez de
       estirar el mismo. Ancha de una, todo apilado; de dos, la identidad a la
       izquierda y el mes a la derecha; de tres, se abre una tercera columna
       con los últimos meses, que es la pregunta que sigue naturalmente a la
       racha: ¿voy mejorando mes a mes?

       El alto NO se elige: sale del ancho (ver `ALTO_RACHA`). Estirarla hacia
       abajo solo añadía cielo vacío, que es justo el problema del que venimos.

       Lo que NO se copia de Duolingo, y es a propósito: ni las cápsulas de
       colores por semana, ni los congeladores, ni las flechas para pasear por
       meses viejos, ni el susto de «te quedan 2 días para recuperar tu racha».
       Un aviso en Norata informa y da la salida; no mete prisa. */
    racha: () => {
      const cuentas = activityDayCounts();
      const hoy = todayKey();
      const anio = Number(hoy.slice(0, 4));
      const mes = Number(hoy.slice(5, 7));
      const ancho = dashSize("racha").w;

      const delMes = { periodo: "mes", desde: hoy.slice(0, 8) + "01", hasta: hoy };
      const diasMes = diasDe(delMes);
      const activosMes = diasMes.filter(k => (cuentas.get(k) || 0) > 0).length;

      const inicioSemana = addDaysKey(hoy, -weekdayOfKey(hoy));
      let activosSemana = 0;
      for (let i = 0; i < 7; i++) {
        const k = addDaysKey(inicioSemana, i);
        if (k <= hoy && (cuentas.get(k) || 0) > 0) activosSemana++;
      }
      const diasCorridos = daysBetween(inicioSemana, hoy) + 1;

      /* La frase de hoy. Es lo único de esta tarjeta que pide algo, y pide sin
         asustar: dice qué falta y con qué se resuelve, nunca cuánto vas a
         perder. */
      const hoyCuenta = (cuentas.get(hoy) || 0) > 0;
      const frase = hoyCuenta
        ? "Hoy ya cuenta."
        : (stk.cur > 0
          ? "Hoy todavía no cuenta. Cualquier registro la mantiene viva."
          : "Cualquier registro de hoy la echa a andar.");

      return `
      <div class="scene-card streak-card">
        ${scene(820, 230, 11)}
        <div class="scene-fade"></div>
        <div class="scene-body">
          <div class="label">${greeting()} · ${dateTxt}</div>
          <div class="streak-grid">
            <div class="sg-izq">
              <div class="streak-row">
                <span class="flame ic"><svg viewBox="0 0 24 24">${ICONS.flame}</svg></span>
                <span class="num">${stk.cur}</span>
                ${/* Sin «mejor: N». La gracia está en la racha que tienes
                      viva, no en una que ya se rompió: al lado del número de
                      hoy, el récord viejo solo puede hacer dos cosas, y las
                      dos sobran — recordarte que ya lo hiciste mejor, o
                      encogerse cuando el de hoy lo supera. */""}
                <span class="lbl">día${stk.cur === 1 ? "" : "s"}<br>de racha</span>
              </div>
              <p class="sg-hoy${hoyCuenta ? " si" : ""}">${escapeHtml(frase)}</p>
              <div class="sg-cifras">
                <div><b>${activosSemana}<span>/${diasCorridos}</span></b><span>esta semana</span></div>
                <div><b>${activosMes}<span>/${diasMes.length}</span></b><span>en ${MESES[mes - 1]}</span></div>
              </div>
            </div>
            <div class="sg-der">
              ${calendarioRacha(anio, mes, cuentas, hoy)}
            </div>
            ${ancho >= 3 ? `<div class="sg-extra">${mesesRecientes(cuentas, anio, mes)}</div>` : ""}
          </div>
        </div>
      </div>`;
    },

    misiones: () => {
      const { due, done, pct } = todayMissionStats();
      if (!due.length) return "";
      const key = todayKey();
      const pend = due.filter(m => !missionDone(m, key));
      return `
      <div class="panel ms-today">
        <div class="mt-head">
          <div class="ring-wrap" style="width:64px;height:64px">
            ${ring(64, 7, [{ pct: pct / 100, color: "var(--mint)" }], "var(--carril)")}
            <div class="ring-center"><div class="v" style="font-size:15px"><b>${done.length}/${due.length}</b></div></div>
          </div>
          <div class="mt-tx">
            <b>Misiones de hoy</b>
            <span>${pend.length === 0 ? "Todas cumplidas" : `${pend.length} pendiente${pend.length === 1 ? "" : "s"}`}</span>
          </div>
          <button class="btn btn-soft btn-sm" onclick="showView('missions')">Ver todas</button>
        </div>
        ${/* Lo pendiente primero y lo cumplido después, pero cumplido a la
              vista: esto es un resumen del día, y un día del que ya
              desaparece lo hecho cuenta la mitad de la historia. Además, al
              marcar una desde aquí se ve el cambio en el sitio donde se
              tocó, en vez de esfumarse la tarjeta. */""}
        ${(() => {
          const hechas = due.filter(m => missionDone(m, key));
          const lista = [...pend, ...hechas].slice(0, 5);
          const resto = due.length - lista.length;
          if (!lista.length) return "";
          return `<div class="ms-list" style="margin-top:14px">
          ${lista.map(m => {
            const c = missionCount(m, key), t = missionTarget(m);
            return `<div class="ms-card ${c >= t ? "done" : ""}" style="${tonos("mc", m.color)}">
              ${botonMision(m, c, t)}
              ${iconoMision(m)}
              <div class="ms-body"><div class="ms-name">${escapeHtml(m.name)}</div></div>
            </div>`;
          }).join("")}
          ${resto > 0 ? `<p class="settings-note" style="margin:2px 0 0">y ${resto} más en Misiones.</p>` : ""}
        </div>`;
        })()}
      </div>`;
    },

    niveles: () => {
      const totalXp = skills.reduce((a, s) => a + (s.xp || 0), 0);
      // La habilidad más cerca de subir: es lo único accionable de la tarjeta
      let cerca = null;
      skills.forEach(s => {
        const li = levelInfo(s.xp);
        if (li.level >= MAX_LEVEL) return;
        if (!cerca || li.pct > cerca.pct) {
          cerca = { s, pct: li.pct, falta: li.needed - li.inLevel, nivel: li.level + 1 };
        }
      });
      return `
      <button class="sum-card a" onclick="showView('home')" style="width:100%">
        ${icon("chart", 22)}
        <div class="n">${totalLevels}</div>
        <div class="t">niveles en ${skills.length} habilidad${skills.length === 1 ? "" : "es"}</div>
        <div class="sc-rows">
          ${/* «XP TOTAL» era un acumulado que solo sube: enseñarlo cada día en
                el Resumen no cambia nada de lo que haces. Lo sustituye lo que
                se movió esta semana, con su flecha contra la anterior — la
                misma regla y el mismo motor que los cuatro paneles grandes
                (js/10f-informes.js). El total sigue en el informe. */
             (() => {
               const a = metricasHabilidades(ventanaDe(7, 0));
               const b = metricasHabilidades(ventanaDe(7, 1));
               return `<div><b>${fmtXp(a.ganada)}</b><span>XP · 7 DÍAS</span>${
                 flechaHTML(variacion(a.ganada, b.ganada), "XP ganada frente a los 7 días anteriores")}</div>`;
             })()}
          ${decayingList.length ? `<div><b style="color:var(--fire)">${decayingList.length}</b><span>DECAYENDO</span></div>` : ""}
        </div>
        ${cerca ? `<div class="sc-near">
          <span>A ${cerca.falta} XP del nivel ${cerca.nivel}</span>
          <b>${escapeHtml(cerca.s.name)}</b>
          <i style="--p:${cerca.pct}%;${tonos("c", cerca.s.color)}"></i>
        </div>` : ""}
      </button>`;
    },

    invertido: () => {
      const enCurso = activeList.length + dueList.length;
      const permanentes = state.perks.filter(p => p.status === "completed").length;
      // El talento en curso que más cerca está de cerrarse
      let cerca = null;
      [...activeList, ...dueList].forEach(p => {
        const pct = perkProgress(p);
        if (!cerca || pct > cerca.pct) cerca = { p, pct };
      });
      return `
      <button class="sum-card b" onclick="showView('tree')" style="width:100%">
        ${icon("map", 22)}
        ${/* Encabeza lo que ya conseguiste y no lo que gastaste, igual que el
              panel de Talentos desde 0.7.30: una persona vale por lo que es,
              no por su gasto, y el dinero presidiendo decía lo contrario. El
              importe no desaparece, baja a la fila —con el código de la
              moneda más pequeño, que es la unidad y no una cifra—. */""}
        <div class="n">${permanentes}</div>
        <div class="t">${permanentes === 1 ? "talento ya es tuyo" : "talentos ya son tuyos"}</div>
        <div class="sc-rows">
          <div><b${enCurso ? ` style="color:var(--fire)"` : ""}>${enCurso}</b><span>EN CURSO</span></div>
          <div><b>${moneyHTML(invested)}</b><span>INVERTIDO</span></div>
        </div>
        ${cerca ? `<div class="sc-near">
          <span>${cerca.pct}% hecho, lo más avanzado</span>
          <b>${escapeHtml(cerca.p.name)}</b>
          <i style="--p:${cerca.pct}%;${tonos("c", cerca.p.color || "var(--fire)")}"></i>
        </div>` : ""}
      </button>`;
    },

    proyectos: () => {
      const live = projects.filter(p => p.status === "active" || p.status === "paused");
      if (!live.length) return "";
      return `
      <button class="sum-card wide" onclick="showView('projects')" style="width:100%">
        <div class="sw-head">
          ${icon("flag", 20)}
          <span>Proyectos</span>
          <span class="sw-go">→</span>
        </div>
        <div class="sw-rows">
          ${live.slice(0, 4).map(p => {
            const pg = projectProgress(p), hh = projectHealth(p);
            return `<div class="sw-row">
              <span class="sw-name">${escapeHtml(p.name)}</span>
              <span class="sw-bar"><i style="width:${pg}%;background:${trazo(p.color)}"></i></span>
              <span class="sw-pct" style="color:${hh.color}">${pg}%</span>
            </div>`;
          }).join("")}
        </div>
      </button>`;
    },

    atencion: () => `
      <div class="panel">
        <h3>Atención hoy</h3>
        ${attention.length ? attention.join("") : `<p class="settings-note" style="margin:0">Todo bajo control. Nada urge hoy — sigue explorando.</p>`}
      </div>`,

    listos: () => !readyList.length ? "" : `
      <div class="panel alt ready-panel">
        <h3>Listos para empezar</h3>
        <p class="settings-note">Estos talentos están desbloqueados y esperando. Empieza uno para ponerlo en progreso.</p>
        <div class="ready-grid">
          ${readyList.slice(0, 6).map(p => `
            <button class="ready-chip" onclick="openPerk('${p.id}')" style="${tonos("rc", p.color)}">
              <span class="rc-ic">${icon(p.icon, 17)}</span>
              <span class="rc-tx">
                <b>${escapeHtml(p.name)}</b>
                <span>${escapeHtml(p.branch || "General")}${p.cost > 0 ? " · " + money(p.cost) : ""}</span>
              </span>
            </button>`).join("")}
        </div>
        ${readyList.length > 6 ? `<p class="settings-note" style="margin:12px 0 0">y ${readyList.length - 6} más en el árbol.</p>` : ""}
      </div>`
  };

  const { order, hidden } = dashLayout();
  /* Una tarjeta que resume un módulo apagado no tiene a dónde llevar, así
     que desaparece con él. No se toca la configuración del tablero: al
     volver a encender el módulo, su tarjeta reaparece donde estaba. */
  const visibles = order.filter(id =>
    !hidden.includes(id) && (!DASH_MODULO[id] || moduloOn(DASH_MODULO[id])) && W[id] && W[id]());
  /* Dónde va cada una. En el teléfono no hay columnas que repartir: se apilan
     en el orden de lectura y la cuadrícula de una sola columna hace el resto. */
  const sitio = isDesktop() ? disposicionTablero(visibles, dashCols()) : {};
  const piezas = visibles
    .map(id => {
      const body = W[id] ? W[id]() : "";
      if (!body) return "";
      const meta = DASH_META[id];
      const sz = dashSize(id);
      const p = sitio[id];
      return `
      <div class="widget" data-w="${id}" data-ancho="${sz.w}" style="--w:${sz.w};--h:${sz.h}${
        p ? `;--c:${p.c + 1};--f:${p.f + 1}` : ""}">
        ${body}
        <div class="w-edit">
          <span class="w-grip">${icon("map", 14)} ${escapeHtml(meta.title)}</span>
          <button class="w-hide" onclick="hideWidget('${id}')" aria-label="Quitar ${escapeAttr(meta.title)}">✕</button>
        </div>
        <button class="w-resize" aria-label="Cambiar tamaño de ${escapeAttr(meta.title)}">
          <svg viewBox="0 0 24 24"><path d="M20 10v10H10M20 20l-9-9"/></svg>
        </button>
      </div>`;
    })
    .filter(Boolean);

  /* El botón de acomodar aparece cuando hay algo que acomodar. Con una sola
     tarjeta no existe un orden que elegir, así que ofrecerlo antes es enseñar
     una herramienta que no puede hacer nada — y recién estrenada la app es
     justo cuando más despista. */
  if (piezas.length < 2) dashEditing = false;
  if (btnTablero) btnTablero.style.display = piezas.length > 1 ? "" : "none";

  /* "editing" enciende las etiquetas, el asa de tamaño y el meneo de las
     tarjetas. En el teléfono no hay nada de eso: la bandeja sale igual, pero
     el tablero se queda como está. */
  el.className = dashEditing ? (isDesktop() ? "dash editing" : "dash eligiendo") : "dash";
  el.innerHTML = piezas.join("");
  /* La bandeja del Modo Editor vive fuera del tablero: dentro competía por
     una celda con las tarjetas y había que calcularle filas a mano. */
  const host = document.getElementById("dash-tray-host");
  if (host) host.innerHTML = dashEditing ? dashTray(hidden) : "";

  marcarDesbordes();
  if (dashEditing && isDesktop()) attachDashHandlers();
}

/* ================= Tablero personalizable =================
   El Resumen es una rejilla de widgets: se reordenan arrastrando
   (mantén pulsado para entrar en modo edición) y se pueden quitar o volver a añadir. */

const DASH_META = {
  /* Más alta desde que lleva el mes debajo de la semana (0.7.33). */
  racha:     { title: "Racha", w: 2, h: 8 },
  misiones:  { title: "Misiones de hoy", w: 1, h: 8 },
  atencion:  { title: "Atención hoy", w: 1, h: 3 },
  niveles:   { title: "Niveles", w: 1, h: 3 },
  invertido: { title: "Invertido", w: 1, h: 3 },
  proyectos: { title: "Proyectos", w: 1, h: 3 },
  listos:    { title: "Listos para empezar", w: 1, h: 4 }
};
const DASH_DEFAULT = ["racha", "misiones", "atencion", "niveles", "invertido", "proyectos", "listos"];
/* Qué módulo alimenta cada tarjeta del tablero. "racha" y "atencion" no
   aparecen porque se nutren de todo y siguen teniendo sentido con
   cualquier combinación encendida. */
const DASH_MODULO = {
  misiones: "missions", niveles: "home",
  invertido: "tree", listos: "tree", proyectos: "projects"
};
const ROW_H = 56, ROW_GAP = 22;
/* El hueco vertical es distinto del horizontal (gap: 24px 22px), y para
   colocar por filas hay que usar el de verdad: con el otro, la cuenta se va
   desviando una fila cada pocas filas. */
const ROW_GAP_V = 24;
const ROW_PITCH = ROW_H + ROW_GAP_V;
/* Suelo de encogimiento, medido tarjeta por tarjeta: por debajo de esto
   deja de comunicar. No es una cifra común porque no todas dicen lo mismo
   —"Listos para empezar" es una lista y necesita cuatro; "Proyectos" es un
   dato suelto y se apaña con dos—. El techo sigue siendo el mismo para
   todas: encoger estropea, agrandar no. */
const DASH_MIN_H = { racha: 5, misiones: 3, atencion: 2, niveles: 3, invertido: 3, proyectos: 2, listos: 4 };
/* Techo generoso: son 40 filas de la cuadrícula, más de dos pantallas de
   alto. Existe solo para que un tirón desbocado del asa no deje una tarjeta
   de mil filas imposible de volver a encoger. */
const DASH_MAX_H = 40;

/* ================= Acomodos sugeridos =================
   Acomodar el tablero a mano es lento: siete tarjetas, cada una con su sitio
   y su tamaño, y hasta que no está entero no se sabe si el reparto funciona.
   Estos tres son puntos de partida ya probados; desde cualquiera de ellos se
   sigue arrastrando a gusto.

   Se guardan como orden + tamaños y nada más. En concreto NO tocan qué
   tarjetas están puestas: si alguien quitó "Invertido" o apagó el módulo de
   Proyectos, elegir un acomodo no se lo devuelve a la cara. El acomodo dice
   cómo repartir lo que hay, no qué debe haber.

   La diferencia entre los tres es a qué se le da el sitio de honor: al
   reparto parejo, a la escena a lo ancho, o a la escena presidiendo. */
const DASH_ACOMODOS = [
  {
    nombre: "Columnas",
    sub: "Tres columnas parejas, las misiones al centro",
    order: ["atencion", "misiones", "racha", "proyectos", "niveles", "listos", "invertido"],
    sizes: {
      /* Misiones va deliberadamente más alta de lo que su contenido pide: es
         lo que mantiene ocupada la columna del centro y obliga a "Invertido"
         a caer en la tercera. Con la altura justa, el reparto automático lo
         mete debajo de Misiones y la tercera columna queda coja. */
      atencion: { w: 1, h: 3 }, misiones: { w: 1, h: 12 }, racha: { w: 1, h: 5 },
      proyectos: { w: 1, h: 3 }, niveles: { w: 1, h: 3 }, listos: { w: 1, h: 5 },
      invertido: { w: 1, h: 3 }
    }
  },
  {
    nombre: "Panorama",
    sub: "La escena a lo ancho, arriba a la derecha",
    /* El orden importa más que los tamaños: "Listos" tiene que ir DESPUÉS de
       Atención y Niveles para que caiga bajo Misiones y no se cuele en la
       columna del medio. */
    order: ["misiones", "racha", "atencion", "niveles", "listos", "proyectos", "invertido"],
    sizes: {
      misiones: { w: 1, h: 8 }, racha: { w: 2, h: 6 }, listos: { w: 1, h: 5 },
      atencion: { w: 1, h: 4 }, niveles: { w: 1, h: 4 },
      proyectos: { w: 1, h: 4 }, invertido: { w: 1, h: 4 }
    }
  },
  {
    nombre: "Mirador",
    sub: "La escena grande, presidiendo el tablero",
    order: ["racha", "misiones", "atencion", "niveles", "listos", "proyectos", "invertido"],
    sizes: {
      racha: { w: 2, h: 7 }, misiones: { w: 1, h: 8 }, atencion: { w: 1, h: 4 },
      niveles: { w: 1, h: 4 }, listos: { w: 1, h: 5 },
      proyectos: { w: 1, h: 4 }, invertido: { w: 1, h: 4 }
    }
  }
];

/* ---- Acomodos del teléfono ----
   En una sola columna no hay nada que repartir a lo ancho ni alturas que
   elegir: lo único que cambia el tablero es QUÉ VA PRIMERO. Por eso son otros
   tres, y no los de la computadora traducidos —allí un acomodo reparte tres
   columnas; aquí decide con qué te encuentras al abrir la app—.

   El arrastre y el resto del Modo Editor están apagados en el teléfono a
   propósito: la personalización de móvil se va a rehacer con otro gesto, y
   mientras tanto es mejor no tener a medias algo que se siente mal. */
const DASH_ACOMODOS_MOVIL = [
  {
    nombre: "El día",
    sub: "Lo de hoy primero: misiones, racha y lo que urge",
    order: ["misiones", "racha", "atencion", "proyectos", "niveles", "invertido", "listos"]
  },
  {
    nombre: "Constancia",
    sub: "La racha arriba, y debajo lo que la alimenta",
    order: ["racha", "misiones", "niveles", "atencion", "listos", "invertido", "proyectos"]
  },
  {
    nombre: "Lo que construyo",
    sub: "Proyectos y talentos al frente; el día, después",
    order: ["proyectos", "listos", "invertido", "misiones", "atencion", "racha", "niveles"]
  }
];

function acomodosDeAhora() {
  return isDesktop() ? DASH_ACOMODOS : DASH_ACOMODOS_MOVIL;
}

/* ---- Qué plantilla está puesta ----
   Se guarda el NOMBRE, no el número: las listas de la computadora y del
   teléfono no son la misma, y un índice apuntaría a otra cosa al cambiar de
   pantalla. Deja de estar puesta en cuanto se toca algo a mano —mover,
   redimensionar, quitar o añadir una tarjeta—, porque a partir de ahí el
   tablero ya no es el que propuso la plantilla. */
function acomodoActivo() {
  const d = (state.ui || {})[ranuraTablero()] || {};
  return d.acomodo || null;
}

function marcarAcomodo(nombre) {
  state.ui = state.ui || {};
  const ranura = ranuraTablero();
  const cur = state.ui[ranura] || {};
  if (nombre) cur.acomodo = nombre; else delete cur.acomodo;
  state.ui[ranura] = cur;
}

/* Vuelve a dibujar solo la bandeja. Arrastrar o redimensionar no repinta el
   tablero (esa es justo la razón de que se sienta fluido), pero sí apaga la
   plantilla activa: sin esto, el botón se quedaría encendido señalando un
   acomodo que ya no es el que hay. */
function refrescarBandeja() {
  const host = document.getElementById("dash-tray-host");
  if (!host || !dashEditing) return;
  host.innerHTML = dashTray(dashLayout().hidden);
}

function olvidarAcomodo() {
  if (!acomodoActivo()) return;
  marcarAcomodo(null);
  save();
}

function aplicarAcomodo(i) {
  const a = acomodosDeAhora()[i];
  if (!a) return;
  recordarTablero("acomodo " + a.nombre);

  /* En el teléfono solo cambia el orden: no hay columnas que repartir ni
     alturas que encoger, así que aquí se acaba. */
  if (!isDesktop()) {
    saveDash(a.order.slice(), null, null);
    marcarAcomodo(a.nombre);
    save();
    /* Sin aviso: el botón se queda encendido, que ya dice cuál está puesta, y
       cambiar de idea es tocar otro. Un aviso por cada toque estorbaba más de
       lo que ayudaba. */
    flipRender(document.getElementById("summary-content"), renderSummary);
    return;
  }
  /* Un acomodo sigue estando escrito como una lista ordenada, que es como se
     piensa al diseñarlo. Se empaqueta a coordenadas aquí: a partir de ese
     momento las tarjetas tienen sitio propio y dejan de fluir. */
  const sizes = JSON.parse(JSON.stringify(a.sizes));
  // `hidden` se pasa como null a propósito: saveDash conserva el que ya había
  saveDash(a.order.slice(), null, sizes);
  saveDash(null, null, null, empaquetar(a.order.filter(id => !dashLayout().hidden.includes(id)), sizes, dashCols()));
  marcarAcomodo(a.nombre);
  save();
  flipRender(document.getElementById("summary-content"), renderSummary);
  /* Un acomodo sugerido que obliga a bajar por la pantalla para verse entero
     no es un acomodo: es una lista. Las alturas de aquí arriba están escritas
     a mano y no saben en qué pantalla van a caer —ni el alto de la ventana, ni
     si el tablero tiene dos columnas o tres—, así que después de ponerlo se
     mide lo que ocupa de verdad y se encoge hasta que quepa.

     Se hace solo al elegir un acomodo. Si alguien estira una tarjeta a mano
     hasta pasarse de pantalla, eso es su decisión y no hay que corregirla. */
  requestAnimationFrame(() => encajarEnPantalla());
  toast("Acomodo " + a.nombre, "hecho", { label: "Deshacer", onclick: "deshacerTablero()" });
}

/* Encoge las tarjetas —nunca por debajo de su suelo— hasta que el tablero
   entero quepa en lo que queda de ventana. Devuelve si tocó algo. */
function encajarEnPantalla() {
  if (!isDesktop()) return false;
  const el = document.getElementById("summary-content");
  if (!el) return false;
  let tocado = false;

  for (let vuelta = 0; vuelta < 6; vuelta++) {
    const caja = el.getBoundingClientRect();
    /* La bandeja del editor no cuenta: desaparece al salir del modo, y lo que
       tiene que caber es el tablero que quedará después. Mientras está puesta,
       empuja el tablero hacia abajo, así que se le devuelve ese sitio a la
       cuenta —si no, se encogería más de lo necesario o se daría por vencido
       creyendo que no hay hueco. */
    const host = document.getElementById("dash-tray-host");
    const bandeja = host && host.firstElementChild
      ? host.getBoundingClientRect().height + 26 : 0;
    const disponible = window.innerHeight - (caja.top - bandeja) - 26;
    const alto = caja.height;
    if (alto <= disponible) break;

    const factor = disponible / alto;
    const { order, hidden, sizes } = dashLayout();
    let cambio = false;
    order.forEach(id => {
      if (hidden.includes(id) || !DASH_META[id]) return;
      const s = dashSize(id);
      const nuevo = Math.max(altoMinimo(id), Math.floor(s.h * factor));
      if (nuevo !== s.h) { sizes[id] = { w: s.w, h: nuevo }; cambio = true; }
    });
    if (!cambio) break;                 // todas están ya en su mínimo
    state.ui[ranuraTablero()].sizes = sizes;
    /* Al cambiar los altos, lo que había debajo puede subir: se vuelve a
       empaquetar para que el acomodo siga siendo el que se eligió y no quede
       un tablero con agujeros. */
    const vis = dashLayout().order.filter(id => !dashLayout().hidden.includes(id) && DASH_META[id]);
    state.ui[ranuraTablero()].pos = empaquetar(vis, sizes, dashCols());
    tocado = true;
    renderSummary();
  }
  if (tocado) save();
  return tocado;
}

let dashEditing = false;

/* ---- Un tablero por tamaño de pantalla ----
   El mismo reparto no puede servir en los dos sitios: en escritorio hay dos
   o tres columnas y las tarjetas tienen alto propio; en el teléfono hay una
   sola columna y el alto lo pone el contenido. Acomodar en el teléfono
   deshacía el trabajo hecho en la computadora, y al revés.

   Así que cada uno guarda el suyo y ninguno toca al otro. El del teléfono
   estrena copiando al de escritorio —se lee de ahí mientras no exista, y la
   primera vez que se acomoda algo se queda con lo que había— para que el
   día del cambio nadie se encuentre el tablero de fábrica. */
function ranuraTablero() { return isDesktop() ? "dash" : "dashMovil"; }

function dashLayout() {
  const ui = state.ui || {};
  const d = ui[ranuraTablero()] || ui.dash || {};
  const saved = Array.isArray(d.order) ? d.order.filter(id => DASH_META[id]) : [];
  const order = [...saved, ...DASH_DEFAULT.filter(id => !saved.includes(id))];
  return {
    order,
    hidden: Array.isArray(d.hidden) ? d.hidden : [],
    sizes: d.sizes || {},
    /* Dónde está cada tarjeta: `pos[id] = {c, f}`, columna y fila. Puede no
       existir —tableros de antes de que esto fuera posicional— y entonces se
       deduce empaquetando el orden, que es justo lo que hacía la cuadrícula
       por su cuenta. Así nadie ve su tablero cambiar al actualizar. */
    pos: d.pos || null
  };
}

/* Cuántas columnas tiene el tablero AHORA. La cuadrícula lo decide en CSS por
   el ancho de la ventana; aquí hay que saberlo para colocar y para arrastrar,
   y las dos cuentas tienen que dar lo mismo. */
function dashCols() {
  if (!isDesktop()) return 1;
  return window.matchMedia("(min-width: 1700px)").matches ? 3 : 2;
}

/* ---- Empaquetar en orden ----
   Coloca una lista de tarjetas buscando el primer hueco libre de arriba a
   abajo y de izquierda a derecha: exactamente lo que hacía la cuadrícula
   sola. Se usa para estrenar el modelo con lo que ya había y para aplicar un
   acomodo, que sigue estando escrito como una lista ordenada. */
function empaquetar(order, sizes, cols) {
  const usado = [];
  const pos = {};
  const libre = (c, f, w, h) => {
    for (let i = f; i < f + h; i++) {
      if (!usado[i]) continue;
      for (let j = c; j < c + w; j++) if (usado[i][j]) return false;
    }
    return true;
  };
  const marcar = (c, f, w, h) => {
    for (let i = f; i < f + h; i++) {
      usado[i] = usado[i] || [];
      for (let j = c; j < c + w; j++) usado[i][j] = true;
    }
  };
  order.forEach(id => {
    if (!DASH_META[id]) return;
    const s = dashSize(id);
    const w = Math.min(s.w, cols);
    for (let f = 0; f < 500; f++) {
      let puesto = false;
      for (let c = 0; c + w <= cols; c++) {
        if (libre(c, f, w, s.h)) { pos[id] = { c, f }; marcar(c, f, w, s.h); puesto = true; break; }
      }
      if (puesto) break;
    }
  });
  return pos;
}

/* ---- La disposición final ----
   Toma lo que el usuario decidió (columna y fila de cada tarjeta) y resuelve
   los solapes de la única forma que no sorprende: lo que estorba BAJA, y baja
   dentro de su columna. Nadie cambia de columna por culpa de otro, que es lo
   que convertía cada arrastre en una cascada.

   Se ordena por fila y luego por columna —el orden en que se lee— para que el
   resultado no dependa de en qué orden estén guardadas las tarjetas. */
function disposicionTablero(ids, cols, extra) {
  const { pos, sizes, order, hidden } = dashLayout();
  // Las escondidas no ocupan sitio en el reparto de estreno
  const base = pos || empaquetar(order.filter(id => !hidden.includes(id)), sizes, cols);
  const piezas = ids.map(id => {
    const s = dashSize(id);
    const p = (extra && extra[id]) || base[id] || { c: 0, f: 0 };
    return { id, w: Math.min(s.w, cols), h: s.h, c: clamp(p.c, 0, Math.max(0, cols - Math.min(s.w, cols))), f: Math.max(0, p.f) };
  });
  piezas.sort((a, b) => (a.f - b.f) || (a.c - b.c));

  const usado = [];
  const libre = (c, f, w, h) => {
    for (let i = f; i < f + h; i++) {
      if (!usado[i]) continue;
      for (let j = c; j < c + w; j++) if (usado[i][j]) return false;
    }
    return true;
  };
  const marcar = (c, f, w, h) => {
    for (let i = f; i < f + h; i++) {
      usado[i] = usado[i] || [];
      for (let j = c; j < c + w; j++) usado[i][j] = true;
    }
  };
  const fin = {};
  piezas.forEach(p => {
    let f = p.f;
    while (f < 600 && !libre(p.c, f, p.w, p.h)) f++;
    marcar(p.c, f, p.w, p.h);
    fin[p.id] = { c: p.c, f, w: p.w, h: p.h };
  });
  return fin;
}

function guardarPosiciones(pos) {
  state.ui = state.ui || {};
  const ranura = ranuraTablero();
  const cur = state.ui[ranura] || state.ui.dash || {};
  state.ui[ranura] = Object.assign({}, cur, { pos });
  marcarAcomodo(null);       // movido a mano: ya no es la plantilla
  save();
}

function altoMinimo(id) { return DASH_MIN_H[id] || 2; }

/* ---- El alto de la racha no se elige: sale de su ancho ----
   La tarjeta tiene un acomodo por cada ancho posible, y cada acomodo pide lo
   que pide: apilada necesita diez filas, en dos columnas ocho, en tres siete.
   Estirarla más solo añadía cielo vacío, que es el problema del que venía.

   Se aplica al leer Y al escribir: al leer, para que un tablero guardado con
   la altura vieja se corrija solo sin que nadie tenga que tocar nada. */
/* Medido con el peor mes posible —uno de seis semanas, como agosto de 2026—
   más un poco de aire: apilada pide 606 px y en dos o tres columnas 372. Una
   fila del tablero son 56 px con 24 de hueco, así que 9 filas dan 696 y 6 dan
   456. Lo que sobre lo reparte el propio cuerpo, que va centrado. */
const ALTO_RACHA = { 1: 9, 2: 6, 3: 6 };
function altoDeRacha(w) { return ALTO_RACHA[w] || ALTO_RACHA[2]; }

/* El suelo se aplica al LEER, no solo al arrastrar. Si no, un tablero
   guardado con la altura vieja se seguiría pintando por debajo del mínimo
   para siempre: el usuario nunca vuelve a tocar esa tarjeta y el valor
   antiguo se queda mandando. */
function dashSize(id) {
  const { sizes } = dashLayout();
  const s = sizes[id] || {};
  /* El ancho nunca puede pasar de las columnas que hay. Sin este tope, una
     tarjeta guardada de tres columnas en la computadora llegaba al teléfono
     diciendo que era de tres —y la racha, que ahora tiene un acomodo por
     ancho, sacaba en una pantalla de 375 px el reparto pensado para 1500—. */
  const w = Math.min(s.w || DASH_META[id].w, dashCols());
  return {
    w,
    h: id === "racha" ? altoDeRacha(w) : clamp(s.h || DASH_META[id].h, altoMinimo(id), DASH_MAX_H)
  };
}

function saveDash(order, hidden, sizes, pos) {
  state.ui = state.ui || {};
  const ranura = ranuraTablero();
  const cur = state.ui[ranura] || state.ui.dash || {};
  state.ui[ranura] = {
    order: order || cur.order,
    hidden: hidden || cur.hidden || [],
    sizes: sizes || cur.sizes || {},
    pos: pos || cur.pos || null
  };
  save();
}

/* Y también al GUARDAR. Es el único punto por el que entra un tamaño nuevo,
   así que sujetarlo aquí garantiza que en disco nunca quede nada por debajo
   del suelo, venga del arrastre o de donde venga. */
function setWidgetSize(id, w, h) {
  const { sizes } = dashLayout();
  sizes[id] = { w, h: id === "racha" ? altoDeRacha(w) : clamp(h, altoMinimo(id), DASH_MAX_H) };
  marcarAcomodo(null);
  saveDash(null, null, sizes);
}

/* ---- Deshacer del tablero ----
   Acomodar el Resumen es prueba y error: se mueve algo, se ve cómo queda y
   a veces la respuesta es "estaba mejor antes". Sin una salida atrás, esa
   última parte obliga a reconstruir a mano lo que ya estaba bien.

   Guarda una copia del reparto entero —orden, ocultas y tamaños— antes de
   cada acción. Es un puñado de bytes por paso, así que la pila puede ser
   larga sin que importe.

   La pila NO se comparte con la del editor de talentos: son dos pantallas
   distintas y Ctrl+Z tiene que deshacer lo que el usuario está mirando, no
   lo último que tocó en cualquier sitio. */
const DASH_UNDO_MAX = 40;
let dashUndo = [];

function instantaneaTablero() {
  const { order, hidden, sizes, pos } = dashLayout();
  return JSON.stringify({ order, hidden, sizes, pos, acomodo: acomodoActivo() });
}

function recordarTablero(etiqueta) {
  dashUndo.push({ snap: instantaneaTablero(), etiqueta });
  if (dashUndo.length > DASH_UNDO_MAX) dashUndo.shift();
}

/* Se llama al terminar una acción: si el tablero quedó igual que antes de
   empezarla —un arrastre que vuelve a su sitio, un tirón del asa que no
   llegó a cambiar de fila— el paso sobra. Sin esto, deshacer gastaría
   pulsaciones en revertir cosas que nunca llegaron a pasar. */
function olvidarPasoVacio() {
  if (dashUndo.length && dashUndo[dashUndo.length - 1].snap === instantaneaTablero()) dashUndo.pop();
}

function deshacerTablero() {
  if (!dashUndo.length) { toast("No hay nada que deshacer en el tablero", "atencion"); return; }
  const prev = dashUndo.pop();
  const d = JSON.parse(prev.snap);
  saveDash(d.order, d.hidden, d.sizes, d.pos);
  marcarAcomodo(d.acomodo || null);
  save();
  renderSummary();
  toast(`Deshecho: ${prev.etiqueta}`, "deshecho");
}

/* Qué pasa cuando el contenido no cabe en el alto elegido.
   Hubo una versión donde la tarjeta crecía sola hasta que cupiera todo. Era
   frustrante por una razón concreta: convertía el tamaño elegido en una
   sugerencia. Uno ajustaba la tarjeta, salía de edición y la veía volver a
   otro alto, sin manera de saber si se había guardado. El tamaño lo decide
   el usuario, punto; el suelo por tarjeta (DASH_MIN_H) ya garantiza que
   ninguna pueda quedar tan aplastada que no comunique nada.

   Lo que sobra no se corta a hachazos: se desvanece hacia abajo. Un corte
   limpio a media línea parece un error de maquetación; un degradado dice
   "esto sigue" y deja el último renglón legible a medias, que es
   exactamente la información que hace falta.

   El color y el redondeo del velo se leen de la propia tarjeta en vez de
   escribirse a mano, porque cada widget tiene los suyos —unos son .panel,
   otros .sum-card— y una constante aquí se desincronizaría del CSS a la
   primera que alguien cambiara un radio. */
function marcarDesbordes() {
  document.querySelectorAll("#summary-content .widget").forEach(el => {
    const body = el.querySelector(":scope > *:not(.w-edit):not(.w-resize)");
    // Solo en escritorio hay alto fijo; en móvil la tarjeta ocupa lo que necesita
    if (!body || !isDesktop()) { el.classList.remove("rebosa"); return; }
    const rebosa = body.scrollHeight - body.clientHeight > 4;
    el.classList.toggle("rebosa", rebosa);
    if (!rebosa) return;
    const cs = getComputedStyle(body);
    const fondo = cs.backgroundColor;
    const opaco = fondo && !/^rgba\(0, 0, 0, 0\)$|transparent/.test(fondo);
    el.style.setProperty("--fundido", opaco ? fondo : "var(--card)");
    el.style.setProperty("--rad-bl", cs.borderBottomLeftRadius);
    el.style.setProperty("--rad-br", cs.borderBottomRightRadius);
  });
}

function dashTray(hidden) {
  const avail = Object.keys(DASH_META).filter(id => hidden.includes(id));
  const escritorio = isDesktop();
  return `
  <div class="dash-tray full-row">
    <div class="tray-head">
      <div class="tray-tx">
        <h3>${escritorio ? "Modo Editor" : "Acomodos"}</h3>
        <p class="settings-note" style="margin:0">${escritorio
          ? `Arrastra para acomodar · esquina inferior derecha para cambiar el tamaño · ✕ para quitar · <kbd>Ctrl</kbd><kbd>Z</kbd> deshacer`
          : `Elige con qué quieres encontrarte al abrir la app. Acomodar tarjeta por tarjeta llegará más adelante, con un gesto pensado para el teléfono.`}</p>
      </div>
      <button class="btn btn-primary" onclick="setDashEdit(false)">Listo</button>
    </div>
    ${avail.length ? `
      <div class="tray-chips">
        ${avail.map(id => `<button class="tray-chip" onclick="showWidget('${id}')">＋ ${escapeHtml(DASH_META[id].title)}</button>`).join("")}
      </div>` : ""}
    <div class="tray-acomodos">
      <span class="lbl">Acomodos sugeridos</span>
      <div class="acomodo-fila">
        ${acomodosDeAhora().map((a, i) => `
          <button class="acomodo ${a.nombre === acomodoActivo() ? "on" : ""}" onclick="aplicarAcomodo(${i})">
            <span class="ac-n">${i + 1}</span>
            <span class="ac-tx"><b>${escapeHtml(a.nombre)}</b><span>${escapeHtml(a.sub)}</span></span>
          </button>`).join("")}
      </div>
    </div>
  </div>`;
}

function setDashEdit(on) {
  dashEditing = on;
  renderSummary();
  if (!on) return;
  toast(isDesktop()
    ? "Arrastra las tarjetas para reacomodarlas"
    : "Elige un acomodo para tu Resumen", "hecho");
}

function hideWidget(id) {
  const { order, hidden } = dashLayout();
  if (hidden.includes(id)) return;
  recordarTablero(`quitar ${DASH_META[id].title}`);
  marcarAcomodo(null);
  saveDash(order, [...hidden, id]);
  flipRender(document.getElementById("summary-content"), renderSummary);
  toast(`${DASH_META[id].title} quitado del tablero`, "deshecho");
}

function showWidget(id) {
  const { order, hidden } = dashLayout();
  recordarTablero(`añadir ${DASH_META[id].title}`);
  marcarAcomodo(null);
  saveDash(order, hidden.filter(h => h !== id));
  flipRender(document.getElementById("summary-content"), renderSummary);
}

/* Anima el reacomodo: mide antes, vuelve a dibujar y desliza desde la posición vieja. */
function flipRender(container, renderFn) {
  const before = new Map();
  [...container.children].forEach(c => {
    if (c.dataset.w) before.set(c.dataset.w, c.getBoundingClientRect());
  });
  renderFn();
  animarDesde(container, before);
}

/* Anima un reacomodo que YA está hecho en el DOM: se le pasa dónde estaba
   cada pieza antes de moverla y las desliza desde ahí. Es la segunda mitad de
   flipRender, separada para poder usarla sin volver a dibujar nada. */
function animarDesde(container, antes) {
  [...container.children].forEach(c => {
    const b = antes.get(c.dataset.w);
    if (!b) return;
    const a = c.getBoundingClientRect();
    const dx = b.left - a.left, dy = b.top - a.top;
    if (!dx && !dy) return;
    c.style.transition = "none";
    c.style.transform = `translate(${dx}px, ${dy}px)`;
    requestAnimationFrame(() => {
      c.style.transition = "transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)";
      c.style.transform = "";
    });
  });
}

function attachDashHandlers() {
  // El tablero solo se toca con las manos en la computadora (ver dashTray)
  if (!isDesktop()) return;
  const cont = document.getElementById("summary-content");
  if (cont.dataset.bound) return;
  cont.dataset.bound = "1";

  let holdTimer = null, dragId = null, ghost = null, startPt = null;
  let sizeId = null, sizeStart = null, cellW = 0;
  /* El orden mientras dura el arrastre. Se guarda al soltar, no en cada paso:
     antes cada cruce de tarjeta escribía en disco y volvía a dibujar el
     Resumen ENTERO —siete tarjetas rehechas desde cero, con sus anillos
     reanimados—, y eso es lo que se sentía pesado. Ahora en cada paso solo se
     mueve un nodo de sitio y se anima el deslizamiento. */
  let ordenVivo = null, ghostIni = null;
  /* La disposición que se está viendo mientras se arrastra, y la última celda
     probada: sin ella se recalcularía en cada píxel aunque la celda no haya
     cambiado, y las animaciones se cortarían unas a otras. */
  let sitioVivo = null, celdaVista = null;

  const cols = () => {
    const t = getComputedStyle(cont).gridTemplateColumns.split(" ").filter(Boolean);
    return Math.max(1, t.length);
  };

  const startDrag = (id, e) => {
    /* Un solo paso por arrastre, no uno por cada intercambio del camino:
       deshacer debe devolver la tarjeta a donde estaba antes de agarrarla,
       que es lo que el usuario recuerda. */
    recordarTablero(`mover ${DASH_META[id].title}`);
    dragId = id;
    const el = cont.querySelector(`.widget[data-w="${id}"]`);
    if (!el) return;
    const r = el.getBoundingClientRect();
    ghost = el.cloneNode(true);
    ghost.className = "widget ghost";
    ghost.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;pointer-events:none;z-index:var(--piso-arrastre);`;
    ghostIni = { x: r.left, y: r.top, dx: e.clientX - r.left, dy: e.clientY - r.top };
    document.body.appendChild(ghost);
    el.classList.add("dragging");
    if (userHasTapped && navigator.vibrate) navigator.vibrate(12);
  };

  cont.addEventListener("pointerdown", (e) => {
    /* Los oyentes se enganchan una sola vez y sobreviven a un cambio de
       tamaño de ventana: sin esto, encoger la ventana hasta el ancho de un
       teléfono dejaría vivo el arrastre que ahí está apagado. */
    if (!isDesktop()) return;
    const w = e.target.closest(".widget");
    if (!w || e.target.closest(".w-hide")) return;

    // Esquina inferior derecha: cambia el tamaño en unidades de la cuadrícula
    if (e.target.closest(".w-resize")) {
      recordarTablero(`tamaño de ${DASH_META[w.dataset.w].title}`);
      sizeId = w.dataset.w;
      const total = cont.getBoundingClientRect().width;
      const n = cols();
      cellW = (total - ROW_GAP * (n - 1)) / n;
      // Se parte del tamaño que se ve en pantalla, no del guardado
      sizeStart = {
        x: e.clientX, y: e.clientY, max: n,
        w: +w.style.getPropertyValue("--w") || dashSize(sizeId).w,
        h: +w.style.getPropertyValue("--h") || dashSize(sizeId).h
      };
      w.classList.add("sizing");
      try { cont.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
      return;
    }

    startPt = { x: e.clientX, y: e.clientY };
    if (dashEditing) {
      startDrag(w.dataset.w, e);
      try { cont.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
    } else {
      // Pulsación sostenida: entra en modo edición y arrastra de una vez
      holdTimer = setTimeout(() => {
        holdTimer = null;
        dashEditing = true;
        renderSummary();
        startDrag(w.dataset.w, e);
        try { cont.setPointerCapture(e.pointerId); } catch (err) {}
      }, 420);
    }
  });

  cont.addEventListener("pointermove", (e) => {
    if (sizeId) {
      e.preventDefault();
      const el = cont.querySelector(`.widget[data-w="${sizeId}"]`);
      if (!el) return;
      const dw = Math.round((e.clientX - sizeStart.x) / (cellW + ROW_GAP));
      const dh = Math.round((e.clientY - sizeStart.y) / ROW_H);
      const w = clamp(sizeStart.w + dw, 1, sizeStart.max);
      const h = clamp(sizeStart.h + dh, altoMinimo(sizeId), DASH_MAX_H);
      el.style.setProperty("--w", w);
      el.style.setProperty("--h", h);
      return;
    }
    if (holdTimer && startPt && Math.hypot(e.clientX - startPt.x, e.clientY - startPt.y) > 10) {
      clearTimeout(holdTimer); holdTimer = null;   // se movió: era desplazamiento, no pulsación
    }
    if (!dragId || !ghost) return;
    e.preventDefault();
    /* Con transform y no con left/top: el navegador lo resuelve sin volver a
       calcular el reparto de la página, así que la pieza va pegada al cursor
       en vez de ir un paso por detrás. */
    ghost.style.transform =
      `translate3d(${e.clientX - ghostIni.dx - ghostIni.x}px, ${e.clientY - ghostIni.dy - ghostIni.y}px, 0) scale(1.03)`;

    /* ---- En escritorio se arrastra por CELDAS ----
       La tarjeta cae en la columna y la fila donde la sueltas, y punto. Lo
       que estorbe baja dentro de su columna; nadie más se entera. Antes esto
       era una lista que la cuadrícula volvía a empaquetar en cada paso, y por
       eso al mover una se recolocaban cinco o seis a la vez: eso era el
       parpadeo. Mover dentro de una columna ya no puede sugerir otra, porque
       la columna la decide el puntero y nada más. */
    if (isDesktop()) {
      const rc = cont.getBoundingClientRect();
      const cols = dashCols();
      const anchoCol = (rc.width - ROW_GAP * (cols - 1)) / cols;
      const w = Math.min(dashSize(dragId).w, cols);
      const gx = e.clientX - ghostIni.dx;      // esquina de la pieza, no el cursor
      const gy = e.clientY - ghostIni.dy;
      const c = clamp(Math.round((gx - rc.left) / (anchoCol + ROW_GAP)), 0, Math.max(0, cols - w));
      const f = Math.max(0, Math.round((gy - rc.top) / ROW_PITCH));
      if (celdaVista && celdaVista.c === c && celdaVista.f === f) return;
      celdaVista = { c, f };

      const visibles = [...cont.querySelectorAll(".widget")].map(el => el.dataset.w);
      const mapa = disposicionTablero(visibles, cols, { [dragId]: { c, f } });
      const antes = new Map();
      cont.querySelectorAll(".widget").forEach(el => antes.set(el.dataset.w, el.getBoundingClientRect()));
      cont.querySelectorAll(".widget").forEach(el => {
        const p = mapa[el.dataset.w];
        if (!p) return;
        el.style.setProperty("--c", p.c + 1);
        el.style.setProperty("--f", p.f + 1);
      });
      animarDesde(cont, antes);
      sitioVivo = mapa;
      return;
    }

    /* En el teléfono no hay columnas: el tablero es una pila y lo que importa
       es el orden. La tarjeta de destino es la que tiene el centro más cerca,
       para que no haya que apuntarle fino. */
    let target = null, mejor = Infinity;
    [...cont.querySelectorAll(".widget")].forEach(el => {
      if (el.dataset.w === dragId) return;
      const rr = el.getBoundingClientRect();
      const d = Math.hypot(e.clientX - (rr.left + rr.width / 2), e.clientY - (rr.top + rr.height / 2));
      if (d < mejor) { mejor = d; target = el; }
    });
    if (!target) return;

    /* Dónde cae la tarjeta se decide por la posición del puntero dentro de
       la que tiene debajo, no por cuál fue la última que pisó.

       La versión anterior se acordaba de la última (lastOver) y se saltaba
       cualquier movimiento sobre ella. Eso hacía imposible arrepentirse: al
       soltar una tarjeta sobre otra quedaban intercambiadas, y volver atrás
       exigía pasar por una tercera para "olvidar" la anterior. Había que
       recolocarla a mano en vez de simplemente devolverla.

       El guardián existía por algo real: sin él, recalcular el orden sobre
       la misma tarjeta la hacía oscilar entre dos posiciones a cada píxel.
       La regla del punto medio lo arregla de raíz porque no tiene memoria —
       el resultado depende solo de dónde está el puntero ahora—, así que
       volver sobre tus pasos devuelve exactamente el orden de partida. */
    const r = target.getBoundingClientRect();
    const centro = r.top + r.height / 2;
    const despues = e.clientY > centro || (e.clientY === centro && e.clientX > r.left + r.width / 2);

    const order = ordenVivo || dashLayout().order;
    const sinLaQueMuevo = order.filter(id => id !== dragId);
    let destino = sinLaQueMuevo.indexOf(target.dataset.w);
    if (destino < 0) return;
    if (despues) destino++;
    const nuevo = [...sinLaQueMuevo.slice(0, destino), dragId, ...sinLaQueMuevo.slice(destino)];
    if (nuevo.join() === order.join()) return;      // ya estaba justo ahí

    /* Mover el nodo y animar, sin tocar el disco ni rehacer el HTML. El hueco
       translúcido de la tarjeta que se arrastra viaja con ella, que es lo que
       hace entender dónde va a caer — igual que en Misiones y en Proyectos. */
    const antes = new Map();
    [...cont.children].forEach(c => { if (c.dataset.w) antes.set(c.dataset.w, c.getBoundingClientRect()); });
    const piezas = new Map();
    [...cont.children].forEach(c => { if (c.dataset.w) piezas.set(c.dataset.w, c); });
    nuevo.forEach(id => { const el = piezas.get(id); if (el) cont.appendChild(el); });
    animarDesde(cont, antes);
    ordenVivo = nuevo;
  });

  const endDrag = () => {
    if (sizeId) {
      const el = cont.querySelector(`.widget[data-w="${sizeId}"]`);
      if (el) {
        /* El respaldo del alto es el suelo de ESA tarjeta, no un 2 fijo:
           con el fijo, un widget cuyo mínimo es 4 podía guardarse en 2 si
           la propiedad venía vacía. */
        setWidgetSize(sizeId,
          +el.style.getPropertyValue("--w") || 1,
          +el.style.getPropertyValue("--h") || altoMinimo(sizeId));
        el.classList.remove("sizing");
      }
      sizeId = null; sizeStart = null;
      olvidarPasoVacio();
      /* Una tarjeta más alta puede pisar a la de abajo: se vuelve a resolver
         con las mismas reglas que al arrastrar —lo que estorba baja— en vez
         de dejar dos tarjetas encimadas. */
      if (isDesktop()) renderSummary();
      refrescarBandeja();
      marcarDesbordes();          // al cambiar el alto cambia lo que sobra
      return;
    }
    if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
    if (ghost) { ghost.remove(); ghost = null; }
    const el = cont.querySelector(".widget.dragging");
    if (el) el.classList.remove("dragging");
    // Se escribe una sola vez, cuando se suelta
    if (sitioVivo) {
      const pos = {};
      Object.keys(sitioVivo).forEach(id => { pos[id] = { c: sitioVivo[id].c, f: sitioVivo[id].f }; });
      /* Las escondidas conservan las coordenadas que tenían: al volver a
         encenderlas deben aparecer donde estaban, no en la esquina. */
      const previas = dashLayout().pos || {};
      Object.keys(previas).forEach(id => { if (!pos[id]) pos[id] = previas[id]; });
      guardarPosiciones(pos);
      sitioVivo = null;
    }
    if (ordenVivo) { saveDash(ordenVivo, dashLayout().hidden); ordenVivo = null; }
    celdaVista = null;
    refrescarBandeja();
    if (dragId) olvidarPasoVacio();
    dragId = null; startPt = null; ghostIni = null;
  };
  cont.addEventListener("pointerup", endDrag);
  cont.addEventListener("pointercancel", endDrag);
}

/* ================= Render: habilidades ================= */

function renderHome() {
  const skills = state.skills;

  const totalLevels = skills.reduce((acc, s) => acc + levelInfo(s.xp).level, 0);
  const totalXp = skills.reduce((acc, s) => acc + s.xp, 0);
  const decaying = skills.filter(isDecaying).length;
  const permanent = skills.filter(s => s.permanent).length;

  // Lo que más urge practicar: la que ya decae, o la más cercana a subir de nivel
  const decayList = skills.filter(isDecaying);
  const closest = [...skills].filter(s => levelInfo(s.xp).level < MAX_LEVEL)
    .sort((a, b) => levelInfo(b.xp).pct - levelInfo(a.xp).pct)[0];
  let hFocus;
  if (decayList.length) {
    hFocus = { k: "Perdiendo XP", v: decayList[0].name, color: "var(--fire)", onclick: `openDetail('${decayList[0].id}')` };
  } else if (closest) {
    const li = levelInfo(closest.xp);
    hFocus = { k: `A ${li.needed - li.inLevel} XP del nivel ${li.level + 1}`, v: closest.name, color: "var(--mint)", pct: li.pct, onclick: `openDetail('${closest.id}')` };
  } else {
    hFocus = { k: "Todo al máximo", v: "No queda nivel por subir", color: "var(--mint)" };
  }

  document.getElementById("home-hero").innerHTML = skills.length === 0 ? "" : sectionHero({
    scene: scene(820, 168, 23),
    lead: `<div>
      <div class="label">Nivel de tu personaje</div>
      <div class="big"><b>${totalLevels}</b><span> niveles</span></div>
    </div>`,
    /* Los cuatro huecos los decide el motor de informes: números del periodo
       con su flecha, en vez de acumulados que solo suben. Aquí estaban «XP
       total» y «Blindadas», que no pasan la regla del panel —ninguno de los
       dos te hace tocar nada hoy—. */
    stats: statsPanelHabilidades({ decaying }),
    informe: "habilidades",
    focus: hFocus
  });

  /* Panel de lo que está decayendo. Antes solo se veía un número y el
     nombre de una: no decía cuáles, ni cuánto queda, ni qué hacer. Ahora
     lista hasta cinco con sus días reales para bajar de nivel, resume el
     resto, y termina diciendo la única cosa que lo detiene. */
  const zona = document.getElementById("decay-zone");
  if (zona) {
    if (!decayList.length) {
      zona.innerHTML = "";
    } else {
      const orden = [...decayList].sort((a, b) => (diasParaBajarNivel(a) || 999) - (diasParaBajarNivel(b) || 999));
      const visibles = orden.slice(0, 5);
      const resto = orden.length - visibles.length;
      zona.innerHTML = `
      <div class="panel decay-panel">
        <div class="panel-head">
          <h3 style="margin:0">Perdiendo XP</h3>
          <span class="dz-count">${orden.length}</span>
        </div>
        <div class="dz-list">
          ${visibles.map(s => {
            const d = diasParaBajarNivel(s);
            const nv = levelInfo(s.xp).level;
            return `
            <button class="dz-row" onclick="openDetail('${s.id}')">
              <span class="dz-ic" style="background:${velo(s.color, "22")};color:${tinta(s.color)}">${icon(s.icon, 15)}</span>
              <span class="dz-tx">
                <b>${escapeHtml(s.name)}</b>
                <span>−${desgasteDiario(s)} XP al día${d ? ` · ${d} día${d === 1 ? "" : "s"} para caer al nivel ${nv - 1}` : ""}</span>
              </span>
              <span class="go">→</span>
            </button>`;
          }).join("")}
          ${resto > 0 ? `<div class="dz-mas">y ${resto} habilidad${resto === 1 ? "" : "es"} más</div>` : ""}
        </div>
        <p class="settings-note" style="margin:12px 0 0">
          Se detiene con registrar cualquier práctica, cumplir una misión enlazada o avanzar un talento o proyecto que la entrene. Con eso vuelve a contar desde cero su periodo de gracia.
        </p>
      </div>`;
    }
  }

  const cats = ["Todas", ...new Set(skills.map(s => s.category).filter(Boolean))];
  if (!cats.includes(activeCategory)) activeCategory = "Todas";
  document.getElementById("chips").innerHTML = skills.length === 0 ? "" : cats.map(c =>
    `<button class="chip ${c === activeCategory ? "active" : ""}" onclick="setCategory('${enJS(c)}')">${escapeHtml(c)}</button>`
  ).join("");

  const list = document.getElementById("skill-list");
  const visible = activeCategory === "Todas" ? skills : skills.filter(s => s.category === activeCategory);

  renderHomeTools();

  // Con una sola habilidad no hay nada que reordenar y la pista sobra
  const pista = document.getElementById("hb-hint");
  if (pista) pista.textContent = (visible.length > 1 && !seleccionHab) ? pistaReordenar() : "";

  if (skills.length === 0) {
    list.innerHTML = `
      <div class="empty">
        <div class="bubble">${icon("star", 34)}</div>
        <h2>Sin habilidades todavía</h2>
        <p>Empieza por el catálogo: verlas en cero es lo que te recuerda que existen. Luego puedes crear las tuyas.</p>
        <div class="stack" style="align-items:center">
          <button class="btn btn-primary" onclick="openCatalogo()">Ver el catálogo</button>
          <button class="btn btn-ghost" onclick="openSkillForm()">Crear una a mano</button>
        </div>
      </div>`;
    return;
  }

  const enSeleccion = !!seleccionHab;
  /* El XP decide el orden de salida, pero lo que el usuario haya acomodado
     a mano manda por encima: si movió algo ahí quiso dejarlo. Las que nunca
     tocó siguen ordenadas por XP, porque ordenarPor conserva el orden de
     entrada de las que no figuran en la lista guardada. */
  const sorted = ordenarPor([...visible].sort((a, b) => b.xp - a.xp), "habOrden");
  list.innerHTML = sorted.map((s, i) => {
    const li = levelInfo(s.xp);
    const marcada = enSeleccion && seleccionHab.has(s.id);
    const tab = isDecaying(s)
      ? `<span class="skill-tab warn">▾ perdiendo XP</span>`
      : (s.permanent ? `<span class="skill-tab perm">${icon("shield", 10)}blindada</span>` : "");
    const pct = li.level >= MAX_LEVEL ? 1 : li.pct / 100;
    return `
    <button type="button" class="skill-card ${i % 2 === 0 ? "r-a" : "r-b"}${marcada ? " marcada" : ""}"
      data-rid="${s.id}"
      onclick="${enSeleccion ? `toggleHabSel('${s.id}')` : `openDetail('${s.id}')`}">
      ${tab}
      ${enSeleccion ? `<span class="hb-check">${marcada ? icon("check", 13) : ""}</span>` : ""}
      <div class="skill-emoji" style="background:${velo(s.color, "26")};color:${tinta(s.color)}">${icon(s.icon, 23)}</div>
      <div class="skill-info">
        <div class="skill-name">${escapeHtml(s.name)}</div>
        <div class="skill-meta">${escapeHtml(s.category || "Sin categoría")}</div>
      </div>
      ${enSeleccion ? "" : `<div class="mini-ring">
        ${ring(46, 4.5, [{ pct, color: trazo(s.color) }], "var(--carril)")}
        <span class="lv" style="color:${tinta(s.color)}">${li.level}</span>
      </div>`}
    </button>`;
  }).join("");

  /* Reordenar a mano, salvo mientras se marcan habilidades para borrar: ahí
     el mismo gesto ya significa otra cosa. */
  hacerReordenable(list, ".skill-card", (ids) => {
    guardarOrden("habOrden", ids);
    renderHome();
  }, () => !seleccionHab);
}

/* Barra de acciones sobre la lista: añadir del catálogo y quitar en bloque. */
/* ---- El calendario de la racha ----

   Es primo del de los informes pero no el mismo, y la diferencia es lo que
   cambia todo: **aquí los días llevan su número escrito.** En un informe el
   calendario es un patrón que se mira de lejos —cuántos días, dónde están los
   huecos— y las fechas sobran; en la tarjeta de la racha se mira de cerca,
   una casilla es un día concreto de tu semana, y sin el número hay que
   contarlas con el dedo para saber cuál es cuál.

   Tres estados y ninguno regaña:
     · lleno    lo hiciste, y cuánto lo dice la intensidad
     · vacío    no pasó nada; sin cruces ni rojos, que un mes marcado de
                fallos es un mes que no se quiere volver a abrir
     · futuro   el número apagado, para que se vea que el mes sigue

   Hoy lleva un aro, y la semana en curso una banda por detrás: es lo que
   contesta «¿cómo voy AHORA?» sin necesitar una tira aparte. */
/* Los últimos seis meses, uno por renglón. Es lo que aparece cuando la
   tarjeta se hace de tres columnas, y contesta la pregunta que sigue
   naturalmente a la racha: ¿voy mejorando mes a mes? Un mes con cero días no
   se esconde —esconderlo dejaría una tabla que solo enseña lo bueno— pero
   tampoco se subraya: su barra simplemente no está. */
function mesesRecientes(cuentas, anio, mes) {
  const filas = [];
  let max = 1;
  for (let i = 5; i >= 0; i--) {
    const total = anio * 12 + (mes - 1) - i;
    const a = Math.floor(total / 12), m = (total % 12) + 1;
    const dias = new Date(Date.UTC(a, m, 0)).getUTCDate();
    let n = 0;
    for (let d = 1; d <= dias; d++) {
      if ((cuentas.get(a + "-" + String(m).padStart(2, "0") + "-" + String(d).padStart(2, "0")) || 0) > 0) n++;
    }
    max = Math.max(max, n);
    filas.push({ nombre: MESES[m - 1], n, actual: i === 0 });
  }
  return `
    <div class="rc-rot">Los últimos meses</div>
    <div class="sg-meses">
      ${filas.map(f => `
        <div class="sgm${f.actual ? " actual" : ""}">
          <span class="sgm-n">${escapeHtml(f.nombre)}</span>
          <span class="sgm-b"><i style="width:${Math.round(f.n / max * 100)}%"></i></span>
          <span class="sgm-v">${f.n}</span>
        </div>`).join("")}
    </div>`;
}

function calendarioRacha(anio, mes, cuentas, hoy) {
  const total = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const primero = new Date(Date.UTC(anio, mes - 1, 1)).getUTCDay();
  const mm = String(mes).padStart(2, "0");
  const inicioSemana = addDaysKey(hoy, -weekdayOfKey(hoy));
  const finSemana = addDaysKey(inicioSemana, 6);

  let max = 1;
  for (let d = 1; d <= total; d++) max = Math.max(max, cuentas.get(anio + "-" + mm + "-" + String(d).padStart(2, "0")) || 0);
  const escala = ["", velo("#5fe0b0", "3a"), velo("#5fe0b0", "77"), velo("#5fe0b0", "b4"), pinta("#5fe0b0")];

  let celdas = "";
  for (let i = 0; i < primero; i++) celdas += `<i class="rc-hueco"></i>`;
  for (let d = 1; d <= total; d++) {
    const k = anio + "-" + mm + "-" + String(d).padStart(2, "0");
    const n = cuentas.get(k) || 0;
    const nivel = n <= 0 ? 0 : Math.min(4, Math.ceil(n / max * 4));
    const clases = ["rc-d"];
    if (k > hoy) clases.push("rc-futuro");
    if (k === hoy) clases.push("rc-hoy");
    if (k >= inicioSemana && k <= finSemana) clases.push("rc-semana");
    /* Tinta oscura solo sobre el relleno macizo: es el único nivel que se
       pinta con el color entero, y encima de él un número claro desaparece.
       Los tres velos siguen siendo fondo oscuro con transparencia. */
    if (nivel === 4) clases.push("rc-tinta");
    const titulo = d + " de " + MESES[mes - 1] + (n ? ": " + n + (n === 1 ? " registro" : " registros") : "");
    celdas += `<i class="${clases.join(" ")}"${nivel ? ` style="background:${escala[nivel]}"` : ""} title="${escapeAttr(titulo)}">${d}</i>`;
  }

  return `
    <div class="rc">
      ${/* Con el año escrito. Sin él, un calendario suelto no dice de
            cuándo es —y esta tarjeta va a llevar años abierta—: en enero, un
            mes de treinta y un días que empieza en jueves puede ser
            perfectamente el de hace tres años. Lo preguntó Eduardo y no había
            ninguna razón para no ponerlo. */""}
      <div class="rc-rot">${escapeHtml(MESES[mes - 1])} ${anio}</div>
      <div class="rc-dow" aria-hidden="true">${["D", "L", "M", "M", "J", "V", "S"].map(x => `<span>${x}</span>`).join("")}</div>
      <div class="rc-rejilla">${celdas}</div>
    </div>`;
}

function renderHomeTools() {
  const el = document.getElementById("hb-tools");
  if (!el) return;
  if (!state.skills.length) { el.innerHTML = ""; return; }
  if (seleccionHab) {
    const n = seleccionHab.size;
    el.innerHTML = `
      <button class="btn btn-ghost hb-b" onclick="toggleSeleccionHab()">Cancelar</button>
      <button class="btn btn-danger-ghost hb-b" ${n ? "" : "disabled"} onclick="borrarSeleccionHab()">
        ${n ? `Borrar ${n}` : "Marca alguna"}
      </button>`;
    return;
  }
  el.innerHTML = `
    <button class="btn btn-soft hb-b" onclick="openCatalogo()">＋ Del catálogo</button>
    <button class="btn btn-ghost hb-b" onclick="toggleSeleccionHab()">Seleccionar</button>`;
}

/* ================= Catálogo de habilidades =================
   La idea es que el tablero enseñe también lo que NO has desarrollado. Ver
   "Botánica 0" o "Pesca 0" propone algo; una lista con solo lo que ya
   practicas no propone nada. Todas nacen en cero y se pueden quitar en
   bloque, porque la lista es del usuario, no nuestra. */

const SKILL_CATALOG = [
  // Salud y cuerpo
  { n: "Ejercicio",      c: "Salud",       i: "dumbbell", k: "#ff8a70" },
  { n: "Correr",         c: "Salud",       i: "bolt",     k: "#ff8a70" },
  { n: "Natación",       c: "Salud",       i: "target",   k: "#6fc3e8" },
  { n: "Yoga",           c: "Salud",       i: "heart",    k: "#b7a2ea" },
  { n: "Meditación",     c: "Salud",       i: "heart",    k: "#b7a2ea" },
  { n: "Ciclismo",       c: "Salud",       i: "bolt",     k: "#8fd18a" },
  { n: "Escalada",       c: "Salud",       i: "flag",     k: "#f5d76e" },
  { n: "Baile",          c: "Salud",       i: "music",    k: "#f0a5c0" },
  { n: "Primeros auxilios", c: "Salud",    i: "heart",    k: "#ff8a70" },
  /* El sitio donde caben las rutinas mínimas —beber agua, lavarse los
     dientes, dormir a horas—. Sin ella, misiones así se quedaban sin
     habilidad a la que sumar o acababan colgadas de Ejercicio, que no es
     lo mismo: cuidarse no es entrenar. */
  { n: "Cuidado personal", c: "Salud",     i: "smile",    k: "#6fc3e8" },

  // Casa y oficios
  { n: "Cocina",         c: "Casa",        i: "coffee",   k: "#f5d76e" },
  { n: "Repostería",     c: "Casa",        i: "coffee",   k: "#f0a5c0" },
  { n: "Jardinería",     c: "Casa",        i: "plant",    k: "#8fd18a" },
  { n: "Botánica",       c: "Casa",        i: "plant",    k: "#5fe0b0" },
  { n: "Carpintería",    c: "Casa",        i: "wrench",   k: "#f5d76e" },
  { n: "Reparaciones",   c: "Casa",        i: "wrench",   k: "#9aa7b8" },
  { n: "Costura",        c: "Casa",        i: "pen",      k: "#b7a2ea" },
  { n: "Mecánica",       c: "Casa",        i: "wrench",   k: "#9aa7b8" },
  { n: "Electrónica",    c: "Casa",        i: "bolt",     k: "#6fc3e8" },

  // Creatividad
  { n: "Dibujo",         c: "Creatividad", i: "brush",    k: "#b7a2ea" },
  { n: "Pintura",        c: "Creatividad", i: "brush",    k: "#f0a5c0" },
  { n: "Fotografía",     c: "Creatividad", i: "camera",   k: "#6fc3e8" },
  { n: "Escritura",      c: "Creatividad", i: "pen",      k: "#f5d76e" },
  { n: "Caligrafía",     c: "Creatividad", i: "pen",      k: "#9aa7b8" },
  { n: "Guitarra",       c: "Creatividad", i: "music",    k: "#ff8a70" },
  { n: "Piano",          c: "Creatividad", i: "music",    k: "#eaf1ef" },
  { n: "Canto",          c: "Creatividad", i: "mic",      k: "#f0a5c0" },
  { n: "Cerámica",       c: "Creatividad", i: "gem",      k: "#f5d76e" },
  { n: "Vídeo",          c: "Creatividad", i: "camera",   k: "#b7a2ea" },

  // Aprendizaje
  { n: "Idiomas",        c: "Aprendizaje", i: "globe",    k: "#6fc3e8" },
  { n: "Programación",   c: "Aprendizaje", i: "code",     k: "#5fe0b0" },
  { n: "Lectura",        c: "Aprendizaje", i: "book",     k: "#f5d76e" },
  { n: "Astronomía",     c: "Aprendizaje", i: "star",     k: "#b7a2ea" },
  { n: "Ajedrez",        c: "Aprendizaje", i: "crown",    k: "#9aa7b8" },
  { n: "Historia",       c: "Aprendizaje", i: "book",     k: "#f5d76e" },
  { n: "Oratoria",       c: "Aprendizaje", i: "mic",      k: "#ff8a70" },

  // Vida adulta
  { n: "Finanzas",       c: "Vida adulta", i: "coin",     k: "#5fe0b0" },
  { n: "Carisma",        c: "Vida adulta", i: "smile",    k: "#6fc3e8" },
  { n: "Negociación",    c: "Vida adulta", i: "chart",    k: "#f5d76e" },
  { n: "Organización",   c: "Vida adulta", i: "map",      k: "#9aa7b8" },
  { n: "Liderazgo",      c: "Vida adulta", i: "crown",    k: "#b7a2ea" },
  { n: "Barismo",        c: "Vida adulta", i: "coffee",   k: "#f5d76e" },

  // Aire libre
  { n: "Pesca",          c: "Aire libre",  i: "rod",      k: "#6fc3e8" },
  { n: "Senderismo",     c: "Aire libre",  i: "compass",  k: "#8fd18a" },
  { n: "Supervivencia",  c: "Aire libre",  i: "flame",    k: "#ff8a70" },
  { n: "Buceo",          c: "Aire libre",  i: "goggles",  k: "#6fc3e8" },
  { n: "Orientación",    c: "Aire libre",  i: "compass",  k: "#f5d76e" }
];

/* ================= Adivinar qué habilidad sube =================
   El objetivo es que el usuario no tenga que elegir a mano en cada
   formulario. Probado contra los títulos reales de la app, buscar el nombre
   de la habilidad dentro del título acierta 3 de 11 —y uno de esos tres es
   un falso positivo ("Renovar la cocina" no es cocinar—, así que hace falta
   un diccionario de verdad.

   Dos pesos: los VERBOS (con "!") valen 3 y los sustantivos 1. No es un
   capricho: el verbo dice qué HACES y el sustantivo suele ser el escenario.
   En "Renovar la cocina", "cocina" es un lugar y "renovar" es la actividad;
   sin esa diferencia, la XP se iría a Cocina en vez de a Reparaciones.

   Nunca decide solo: propone, y lo que el usuario corrige se aprende. */

const LEXICO = {
  "Ejercicio":     "!entrenar !entreno !ejercitar !moverme gimnasio gym pesas rutina cardio abdominales flexiones sentadillas",
  "Correr":        "!correr !corro !trotar carrera maraton running trote kilometros km 5k 10k zapatillas",
  "Natación":      "!nadar !nado natacion alberca piscina brazadas crol",
  "Yoga":          "!estirar yoga postura asana flexibilidad esterilla",
  "Meditación":    "!meditar !respirar meditacion calma mindfulness silencio atencion plena",
  "Ciclismo":      "!pedalear !rodar bici bicicleta ciclismo ruta pedaleo",
  "Escalada":      "!escalar !trepar escalada muro boulder rocodromo",
  "Baile":         "!bailar !danzar baile danza salsa coreografia",
  "Primeros auxilios": "!auxiliar rcp botiquin emergencias primeros auxilios",
  /* Las rutinas de mantenimiento del cuerpo. Lleva "!beber" y "!dormir"
     porque son las dos que más aparecen escritas como misión, y "vasos",
     "cepillo" y "protector" porque la gente escribe el objeto y no el
     verbo: "ocho vasos", "hilo dental", "protector solar". */
  "Cuidado personal": "!beber !hidratarme !dormir !cepillarme !lavarme !descansar !estirarme agua vasos dientes cepillo hilo dental piel crema protector solar higiene rutina sueño siesta uñas cabello ducha",

  "Cocina":        "!cocinar !guisar !sofreir receta recetas sarten fogon comida platillo chef guiso",
  "Repostería":    "!hornear !amasar !repostear pastel tarta galletas pan masa reposteria horno",
  "Jardinería":    "!plantar !podar !regar !sembrar jardin maceta huerto semillas tierra planta",
  "Botánica":      "!identificar botanica especies hojas flora herbario plantas",
  "Carpintería":   "!lijar !ensamblar !tallar madera carpinteria sierra mueble tablon",
  "Reparaciones":  "!reparar !arreglar !renovar !reformar !remodelar !instalar averia taladro obra fontaneria",
  "Costura":       "!coser !bordar !remendar costura aguja hilo maquina patron tela",
  "Mecánica":      "!desarmar mecanica motor coche taller aceite bujias",
  "Electrónica":   "!soldar !cablear electronica circuito arduino soldadura placa",

  "Dibujo":        "!dibujar !bocetar !ilustrar dibujo boceto ilustracion lapiz trazo",
  "Pintura":       "!pintar !acuarela pintura oleo lienzo pincel mural",
  "Fotografía":    "!fotografiar !retratar foto fotos fotografia camara retrato revelado encuadre",
  "Escritura":     "!escribir !redactar !narrar escritura relato novela cuento articulo texto blog",
  "Caligrafía":    "!caligrafiar caligrafia letras rotulacion pluma trazos lettering",
  "Guitarra":      "!tocar guitarra acordes cuerdas guitarrista puentes",
  "Piano":         "!tocar piano teclado teclas partitura pianista",
  "Canto":         "!cantar canto voz coro afinacion karaoke",
  "Cerámica":      "!modelar !tornear ceramica barro arcilla torno esmalte",
  "Vídeo":         "!grabar !editar !montar video edicion metraje corto rodaje",

  "Idiomas":       "!hablar !traducir idioma idiomas ingles frances aleman italiano portugues japones vocabulario gramatica duolingo",
  "Programación":  "!programar !codear !desarrollar codigo software app web python javascript programacion",
  "Lectura":       "!leer lectura libro libros pagina capitulo novela ensayo",
  "Astronomía":    "!observar astronomia estrellas telescopio planetas cielo constelaciones",
  "Ajedrez":       "!jugar ajedrez apertura tactica elo partidas tablero",
  "Historia":      "!investigar historia epoca documental siglo museo",
  "Oratoria":      "!hablar !exponer !presentar oratoria discurso publico presentacion charla",

  "Finanzas":      "!ahorrar !invertir !presupuestar finanzas dinero gastos ahorro inversion presupuesto fondo deuda emergencia bolsa",
  "Carisma":       "!conversar !socializar !platicar !conocer carisma conversacion gente social amigos trato empatia escucha red contactos",
  "Negociación":   "!negociar !vender !cerrar negociacion trato cliente venta acuerdo precio",
  "Organización":  "!organizar !ordenar !planificar organizacion agenda tramite papeles orden calendario",
  "Liderazgo":     "!liderar !dirigir !coordinar !delegar liderazgo equipo junta reunion jefe mentoria feedback decision",
  "Barismo":       "!preparar cafe barismo espresso molienda cafetera latte",

  "Pesca":         "!pescar pesca caña anzuelo carnada rio muelle",
  "Senderismo":    "!caminar !senderear sendero ruta montana excursion mochila cumbre",
  "Supervivencia": "!acampar !sobrevivir campamento fogata refugio supervivencia tienda",
  "Buceo":         "!bucear buceo inmersion arrecife snorkel botella",
  "Orientación":   "!orientar brujula mapa coordenadas norte orientacion"
};

/* Palabras vacías. Además de artículos y preposiciones, aquí van las que
   aparecen en CUALQUIER meta —"curso", "taller", "proyecto", "semana"— y
   que por eso no distinguen nada: dejarlas dentro hacía que "curso" llevara
   a Programación en "Curso de cocina" y "Curso de inversión". */
const PARADAS = new Set([
  "de","del","la","el","los","las","un","una","mi","mis","para","por","con","en","y","o","a","al",
  "que","me","lo","su","sus","este","esta","primer","primera","mas","muy",
  "curso","cursos","clase","clases","taller","talleres","proyecto","meta","plan","reto",
  "semana","semanas","mes","meses","dia","dias","ano","anos","vez","veces","hora","horas",
  "linea","online","basico","basica","nuevo","nueva","propio","propia"
]);

function normalizarTexto(s) {
  return String(s || "").toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/).filter(w => w.length > 2 && !PARADAS.has(w));
}

/* Recorta terminaciones para que "corriendo", "corrí" y "correr" cuenten
   igual. Es un recorte tosco a propósito: un lematizador completo pesaría
   más que toda la app y aquí solo hace falta acercar palabras. */
function raiz(w) {
  return w.replace(/(andose|iendose|arse|erse|irse|ando|iendo|aste|aron|amos|emos|imos|aba|ado|ido|ar|er|ir|es|as|os|a|o|s)$/, "");
}

function lexAprendido() {
  return (state.ui && state.ui.lexAprendido) || {};
}

/* Devuelve las habilidades candidatas ordenadas por puntuación. Solo mira
   las que el usuario TIENE: proponer una que no existe sería inútil. */
function sugerirHabilidades(titulo, rama) {
  const palabras = normalizarTexto(titulo);
  if (!palabras.length && !rama) return [];
  const raices = palabras.map(raiz);
  const aprendido = lexAprendido();
  const puntos = new Map();
  const suma = (nombre, p) => puntos.set(nombre, (puntos.get(nombre) || 0) + p);

  /* Cada palabra del título puntúa UNA vez por habilidad, con su mejor
     coincidencia. Sumar por término inflaba el resultado: "correr" casaba a
     la vez con "!correr" y con "!corro" y valía el doble que nada.

     Y el verbo exacto (3) vale más que el encontrado por raíz (2), porque
     recortar terminaciones vuelve iguales al verbo y al sustantivo:
     "cocina" y "cocinar" comparten raíz, pero solo una de las dos dice que
     la actividad sea cocinar. Esa diferencia es la que hace que "Renovar la
     cocina" vaya a Reparaciones y no a Cocina. */
  Object.keys(LEXICO).forEach(nombre => {
    const terminos = LEXICO[nombre].split(" ").map(t => {
      const v = t[0] === "!";
      const w = v ? t.slice(1) : t;
      return { v, w, r: raiz(w) };
    });
    let total = 0;
    palabras.forEach((pal, i) => {
      const pr = raices[i];
      let mejor = 0;
      terminos.forEach(t => {
        if (pal === t.w) mejor = Math.max(mejor, t.v ? 3 : 1);
        else if (t.r.length > 3 && pr === t.r) mejor = Math.max(mejor, t.v ? 2 : 1);
      });
      total += mejor;
    });
    if (total > 0) suma(nombre, total);
  });

  // Lo aprendido de las correcciones del usuario pesa por encima del diccionario
  palabras.forEach(w => {
    const m = aprendido[w];
    if (m) Object.keys(m).forEach(nombre => suma(nombre, m[nombre]));
  });

  const lista = state.skills.map(s => ({ s, p: puntos.get(s.name) || 0 })).filter(x => x.p > 0);
  lista.sort((a, b) => b.p - a.p);

  // Red de seguridad: si el título no dice nada, la rama al menos acota
  if ((!lista.length || lista[0].p < 3) && rama) {
    state.skills.forEach(s => {
      if (s.category && normalizarTexto(s.category)[0] === normalizarTexto(rama)[0]) {
        if (!lista.some(x => x.s.id === s.id)) lista.push({ s, p: 0.5, porRama: true });
      }
    });
    lista.sort((a, b) => b.p - a.p);
  }
  return lista.slice(0, 4);
}

/* Guarda la corrección: si eliges una que no se proponía, sus palabras
   quedan asociadas; si descartas la propuesta, se penaliza. Así la app
   aprende cómo nombras TÚ las cosas. */
function aprenderDeEleccion(titulo, elegidaNombre, propuestaNombre) {
  if (!elegidaNombre || elegidaNombre === propuestaNombre) return;
  state.ui = state.ui || {};
  const mapa = state.ui.lexAprendido || (state.ui.lexAprendido = {});
  normalizarTexto(titulo).forEach(w => {
    const m = mapa[w] || (mapa[w] = {});
    m[elegidaNombre] = Math.min(6, (m[elegidaNombre] || 0) + 2);
    if (propuestaNombre) m[propuestaNombre] = Math.max(-6, (m[propuestaNombre] || 0) - 2);
  });
}

/* ---- Las sugerencias dentro del formulario ----
   Aparecen solas al escribir el título y la primera se marca sola. Marcarla
   es la diferencia entre "cero trabajo si acierto" y "un desplegable más
   que abrir"; que se vean todas y sean tocables es lo que evita que se
   equivoque en silencio. */

let sugActual = { p: null, pr: null };   // qué se propuso primero, para aprender de la corrección

function refrescarSugerencias(pref) {
  const cont = document.getElementById(pref + "-sug");
  if (!cont) return;
  const titulo = (document.getElementById(pref + "-name") || {}).value || "";
  const rama = (document.getElementById(pref + "-branch") || {}).value || "";
  const sel = document.getElementById(pref + "-skill");

  if (titulo.trim().length < 3) { cont.innerHTML = ""; sugActual[pref] = null; return; }

  const lista = sugerirHabilidades(titulo, rama);
  if (!lista.length) {
    cont.innerHTML = `<span class="sug-nada">No sé cuál encaja con ese nombre; elígela tú si quieres.</span>`;
    sugActual[pref] = null;
    return;
  }

  // Solo se marca sola si el campo sigue vacío: nunca pisa una decisión tuya
  if (sel && !sel.value) { sel.value = lista[0].s.id; sugActual[pref] = lista[0].s.name; }
  else if (!sugActual[pref]) sugActual[pref] = lista[0].s.name;

  cont.innerHTML = `<span class="sug-tit">Sube:</span>` + lista.map(x => `
    <button type="button" class="sug-chip ${sel && sel.value === x.s.id ? "on" : ""}"
      style="${tonos("sc", x.s.color)}" onclick="elegirSugerencia('${pref}','${x.s.id}')">
      ${escapeHtml(x.s.name)}${x.porRama ? ' <i>por la rama</i>' : ''}
    </button>`).join("");
}

function elegirSugerencia(pref, id) {
  const sel = document.getElementById(pref + "-skill");
  if (!sel) return;
  sel.value = sel.value === id ? "" : id;   // volver a tocarla la desmarca
  refrescarSugerencias(pref);
}

function marcarSugerenciaElegida(pref) { refrescarSugerencias(pref); }

/* Al guardar: si lo que quedó elegido no es lo que se propuso, esa
   corrección se aprende y la próxima vez se propone mejor. */
function aprenderAlGuardar(pref, titulo, skillId) {
  const elegida = state.skills.find(s => s.id === skillId);
  aprenderDeEleccion(titulo, elegida ? elegida.name : null, sugActual[pref]);
  sugActual[pref] = null;
}

let catalogoSel = new Set();
let seleccionHab = null;   // null = fuera del modo selección

function nuevaHabilidad(nombre, categoria, icono, color) {
  return {
    id: uid(), name: nombre, category: categoria, icon: icono, color: color,
    xp: 0, log: [], permanent: false, graceDays: 7, decayPerDay: 10,
    lastActivity: null, createdAt: todayKey()
  };
}

function openCatalogo() {
  catalogoSel = new Set();
  renderCatalogo();
  showView("catalog");
}

function toggleCatalogo(nombre) {
  if (catalogoSel.has(nombre)) catalogoSel.delete(nombre);
  else catalogoSel.add(nombre);
  renderCatalogo();
}

function toggleCatalogoCat(cat) {
  const dentro = SKILL_CATALOG.filter(x => x.c === cat && !yaTengo(x.n));
  const todas = dentro.every(x => catalogoSel.has(x.n));
  dentro.forEach(x => todas ? catalogoSel.delete(x.n) : catalogoSel.add(x.n));
  renderCatalogo();
}

function yaTengo(nombre) {
  return state.skills.some(s => s.name.toLowerCase() === nombre.toLowerCase());
}

function renderCatalogo() {
  const cats = [...new Set(SKILL_CATALOG.map(x => x.c))];
  const n = catalogoSel.size;
  document.getElementById("catalog-content").innerHTML = `
    <p class="settings-note" style="padding:0 4px 4px">
      Añade las que te interese seguir, aunque sea en cero: ver una habilidad
      sin empezar te recuerda que existe. Las de aquí además se reconocen
      solas — al escribir un talento o un proyecto se proponen para recibir el
      XP. Si te falta alguna, créala arriba: esa lo irá aprendiendo del uso.
    </p>
    ${cats.map(cat => {
      const dentro = SKILL_CATALOG.filter(x => x.c === cat);
      const libres = dentro.filter(x => !yaTengo(x.n));
      return `
      <div class="cat-group">
        <div class="cat-head">
          <h3>${escapeHtml(cat)}</h3>
          ${libres.length ? `<button class="cat-all" onclick="toggleCatalogoCat('${enJS(cat)}')">
            ${libres.every(x => catalogoSel.has(x.n)) ? "Quitar todas" : "Todas"}
          </button>` : `<span class="cat-done">ya las tienes</span>`}
        </div>
        <div class="cat-grid">
          ${dentro.map(x => {
            const tengo = yaTengo(x.n);
            const sel = catalogoSel.has(x.n);
            return `
            <button class="cat-chip ${tengo ? "tengo" : ""} ${sel ? "sel" : ""}"
              ${tengo ? "disabled" : `onclick="toggleCatalogo('${enJS(x.n)}')"`}>
              <span class="cc-ic" style="background:${velo(x.k, "26")};color:${tinta(x.k)}">${icon(x.i, 18)}</span>
              <span class="cc-n">${escapeHtml(x.n)}</span>
              ${tengo ? `<span class="cc-ok">${icon("check", 15)}</span>` : `<span class="cc-box">${sel ? icon("check", 13) : ""}</span>`}
            </button>`;
          }).join("")}
        </div>
      </div>`;
    }).join("")}
    <div class="cat-bar">
      <button class="btn btn-ghost" onclick="showView('home')">Cancelar</button>
      <button class="btn btn-primary" ${n ? "" : "disabled"} onclick="añadirDelCatalogo()">
        ${n ? `Añadir ${n} habilidad${n === 1 ? "" : "es"}` : "Elige alguna"}
      </button>
    </div>`;
}

function añadirDelCatalogo() {
  const elegidas = SKILL_CATALOG.filter(x => catalogoSel.has(x.n) && !yaTengo(x.n));
  if (!elegidas.length) return;
  elegidas.forEach(x => state.skills.push(nuevaHabilidad(x.n, x.c, x.i, x.k)));
  save();
  catalogoSel = new Set();
  showView("home");
  toast(`${elegidas.length} habilidad${elegidas.length === 1 ? "" : "es"} añadida${elegidas.length === 1 ? "" : "s"}`, "logro");
}

/* ---- Selección múltiple para quitar varias de golpe ---- */

function toggleSeleccionHab() {
  seleccionHab = seleccionHab ? null : new Set();
  renderHome();
}

function toggleHabSel(id) {
  if (!seleccionHab) return;
  if (seleccionHab.has(id)) seleccionHab.delete(id);
  else seleccionHab.add(id);
  renderHome();
}

async function borrarSeleccionHab() {
  if (!seleccionHab || !seleccionHab.size) return;
  const n = seleccionHab.size;
  const conXp = state.skills.filter(s => seleccionHab.has(s.id) && s.xp > 0).length;
  const ok = await ask(
    `Se van ${n} habilidad${n === 1 ? "" : "es"}` +
    (conXp ? `, y ${conXp === 1 ? "una de ellas tiene" : `${conXp} de ellas tienen`} progreso registrado que se pierde` : "") +
    ".\n\nEsto no se puede deshacer.",
    `Borrar ${n === 1 ? "la habilidad" : "las " + n}`, true);
  if (!ok) return;
  // Las misiones que apuntaban a una habilidad borrada se quedan sin dueño,
  // no se borran: la misión sigue siendo algo que el usuario hace.
  state.missions.forEach(m => { if (seleccionHab.has(m.skillId)) m.skillId = null; });
  state.perks.forEach(p => { if (seleccionHab.has(p.skillId)) p.skillId = null; });
  state.skills = state.skills.filter(s => !seleccionHab.has(s.id));
  seleccionHab = null;
  save();
  renderHome();
  toast(`${n} habilidad${n === 1 ? "" : "es"} borrada${n === 1 ? "" : "s"}`, "deshecho");
}

function fmtXp(n) {
  return n >= 10000 ? (n / 1000).toFixed(1).replace(".0", "") + "k" : String(n);
}

function setCategory(c) {
  activeCategory = c;
  renderHome();
}

/* ================= Encabezado común de sección =================
   Las cuatro secciones se leen igual: una cifra que resume el conjunto,
   indicadores comparables y el foco de lo que pide atención. */

function sectionHero({ scene, lead, stats, focus, informe }) {
  return `
    <div class="scene-card sec-hero">
      ${scene}
      <div class="scene-fade"></div>
      <div class="scene-body">
        <div class="sh-main">
          <div class="sh-lead">${lead}</div>
          <div class="sh-stats">
            ${/* `s.d` es la flecha de comparación, y llega ya como HTML porque
                  la arma `flechaHTML` en js/10f-informes.js — quien pinta no
                  decide contra qué se compara. Va entre el número y el rótulo:
                  debajo del rótulo se leía como parte del nombre del dato.

                  Y cuando UNA columna del grupo lleva flecha, las demás llevan
                  el hueco vacío. Sin eso, las columnas sin flecha subían su
                  rótulo 14 px y la fila de nombres quedaba escalonada: se veía
                  «HOY» a una altura y «CUMPLIDAS» a otra. La fila de la
                  comparación existe para las cuatro o para ninguna. */
              (() => {
                const conVar = stats.some(s => s.d);
                /* Un importe con su moneda —«$5,340 MXN»— no cabe en una
                   columna de 78 px y parte en dos renglones, y entonces esa
                   columna baja su rótulo 23 px y desalinea la fila entera.
                   Se vio al poner la moneda a todos los montos (0.7.24).

                   La salida NO es recortar el número ni quitarle el código:
                   los dos serían perder el dato justo donde hay que
                   desambiguar. Se reserva la segunda línea en las CUATRO
                   columnas, igual que con la fila de las flechas: o la hay
                   para todas o no la hay para ninguna. Solo se paga la altura
                   en el panel que enseña dinero. */
                const alto = stats.some(s => String(s.n).length >= 9);
                /* La flecha va ARRIBA de la cifra, y esto lo cazó Eduardo
                   mirando el hero de Habilidades. Debajo, el hueco vacío de
                   las columnas sin comparación se abría entre la cifra y su
                   rótulo, que es justo donde se lee como un agujero. Arriba,
                   ese mismo hueco queda contra el borde de la caja —donde
                   pasa por aire— y las cifras y los rótulos de las cuatro
                   columnas se alinean solos. */
                return stats.map(s => `<div>${
                  conVar ? (s.d || `<i class="sh-var"></i>`) : ""
                }<div class="n ${alto ? "alto " : ""}${s.tone || ""}">${s.n}</div><div class="t">${s.t}</div></div>`).join("");
              })()}
          </div>
          <${focus.onclick ? `button class="sh-focus" onclick="${focus.onclick}"` : `div class="sh-focus"`}>
            <span class="shf-k" style="color:${focus.color}">${escapeHtml(focus.k)}</span>
            <span class="shf-v">${escapeHtml(focus.v)}</span>
            ${typeof focus.pct === "number" ? `<span class="shf-bar"><i style="width:${focus.pct}%;background:${focus.color}"></i></span>` : ""}
          </${focus.onclick ? "button" : "div"}>
          ${/* La puerta al informe. En `btn-linea` y no en menta maciza porque
                no escribe nada: solo lleva a mirar (ver los seis niveles de
                botón). Es lo que permite que el panel se quede pequeño: todo
                lo que no cabe arriba vive detrás de este botón. */
             informe ? `<button class="btn btn-linea sh-informe" onclick="abrirInforme('${informe}')">Ver el informe</button>` : ""}
        </div>
      </div>
    </div>`;
}

/* ================= Menú de herramientas de una rama =================
   Solo "＋" se queda fuera, que es lo único de uso diario; lo demás vive
   aquí dentro con su nombre escrito, en vez de ser una fila de iconos
   mudos que además no cabía en el móvil. */

const BM_ICONS = {
  puntos: '<circle cx="5" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.8" fill="currentColor" stroke="none"/>',
  flecha: '<path d="M5 12h13M13 6l6 6-6 6"/>',
  lapiz: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>',
  reordenar: '<path d="M3 12a9 9 0 0115.5-6.2M21 12a9 9 0 01-15.5 6.2"/><path d="M18 3v5h-5M6 21v-5h5"/>',
  bote: '<path d="M4 7h16M10 11.5v6M14 11.5v6M6.5 7l.9 12.1a2 2 0 002 1.9h5.2a2 2 0 002-1.9L17.5 7M9.5 7V5.2a2 2 0 012-2h1a2 2 0 012 2V7"/>',
  expandir: '<path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"/>',
  copiar: '<rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M6.5 15H5.2A2.2 2.2 0 013 12.8V5.2A2.2 2.2 0 015.2 3h7.6A2.2 2.2 0 0115 5.2v1.3"/>',
  caja: '<path d="M3 8.5L12 4l9 4.5v7L12 20l-9-4.5z"/><path d="M3 8.5L12 13l9-4.5M12 13v7"/>'
};

let openBranchMenu = null;

/* `key` llega EN CRUDO, sin escapar por fuera. Es a propósito: viaja a dos
   sitios que necesitan escapes distintos —dentro de una cadena de JavaScript
   y dentro de un atributo que luego se compara con `dataset.menu`— y si el
   que llama lo escapaba, los dos acababan con textos distintos y el menú de
   una rama con apóstrofo no se abría nunca. */
function branchMenu(key, items) {
  if (!items.length) return "";
  return `
    <div class="bmenu-wrap">
      <button class="badd solid" onclick="toggleBranchMenu('${enJS(key)}', event)" aria-label="Más opciones de esta rama" aria-haspopup="true">
        <svg viewBox="0 0 24 24">${BM_ICONS.puntos}</svg>
      </button>
      <div class="bmenu" data-menu="${escapeAttr(key)}">
        ${items.map(it => `
          <button class="${it.danger ? "danger" : ""}" onclick="closeBranchMenus();${it.onclick}">
            <span class="bm-tx"><b>${escapeHtml(it.title)}</b><span>${escapeHtml(it.hint)}</span></span>
            <span class="bm-ic"><svg viewBox="0 0 24 24">${BM_ICONS[it.icon]}</svg></span>
          </button>`).join("")}
      </div>
    </div>`;
}

function syncBranchMenus() {
  document.querySelectorAll(".bmenu").forEach(m => m.classList.toggle("open", m.dataset.menu === openBranchMenu));
}

function closeBranchMenus() {
  openBranchMenu = null;
  syncBranchMenus();
}

/* stopPropagation es necesario: sin él, el mismo clic que abre el menú
   burbujea hasta el documento y lo cierra en el acto. */
function toggleBranchMenu(key, ev) {
  if (ev) ev.stopPropagation();
  cerrarCtxMenu();          // dos menús abiertos a la vez no se leen
  openBranchMenu = (openBranchMenu === key) ? null : key;
  syncBranchMenus();
}

document.addEventListener("click", () => { if (openBranchMenu) closeBranchMenus(); });

/* "sus 1 proyecto" no lo dice nadie. El singular cambia el posesivo y el
   verbo, y con cero no hay nada que anunciar: devuelve "" y quien llama
   omite la frase entera en vez de escribir "sus 0 proyectos". */
function fraseCantidad(n, singular, plural) {
  if (n === 0) return "";
  if (n === 1) return `su único ${singular}`;
  return `sus ${n} ${plural}`;
}

/* Borrar una rama entera. Es de las pocas acciones de la app que destruyen
   datos sin vuelta atrás, así que se avisa con el número exacto de lo que
   se va y con el botón en rojo. */
/* ---- Las ramas existen aunque estén vacías ----
   Una rama era solo el nombre que llevaban escrito sus talentos o sus
   encargos: al sacar el último, la rama desaparecía de la pantalla y lo que
   acababas de mover ya no tenía a dónde volver. Mover una tarjeta nunca debe
   cerrar la puerta por la que entró.

   Así que la lista de ramas se guarda aparte. Una rama vacía sigue ahí
   esperando, se puede crear antes de tener nada que meterle, y solo
   desaparece cuando se borra a mano. */
function claveRamas(kind) { return kind === "perks" ? "ramasTalentos" : "ramasProyectos"; }

function ramasDe(kind) {
  const lista = kind === "perks" ? state.perks : state.projects;
  state.ui = state.ui || {};
  const clave = claveRamas(kind);
  const guardadas = state.ui[clave] || [];
  const usadas = [...new Set(lista.map(x => x.branch || "General"))];
  const nuevas = usadas.filter(n => !guardadas.includes(n));
  /* Las ramas que llegan escritas en un dato —de antes de que existiera esta
     lista, de una importación, de otro dispositivo— se apuntan la primera vez
     que se dibujan. Solo se guarda cuando de verdad hay algo nuevo: si no,
     cada repintado escribiría en disco. */
  if (nuevas.length) {
    state.ui[clave] = [...guardadas, ...nuevas];
    save();
  }
  return (state.ui[clave] || []).slice();
}

async function crearRama(kind) {
  const esTalentos = kind === "perks";
  /* El tope de ramas es solo de Talentos: `LIMITES.ramas` habla del árbol, y
     los proyectos no tienen tope en ningún plan. Se pregunta ANTES de
     pedir el nombre, para no hacer escribir algo que se va a tirar. */
  if (esTalentos && !cabeUnoMas("ramas", ramasDe("perks").length)) {
    topeAlcanzado("ramas");
    return;
  }
  const nombre = await askText(
    esTalentos ? "Nueva rama de talentos" : "Nueva rama de proyectos", "", "Crear",
    esTalentos
      ? "Un ámbito donde agrupar talentos: un oficio, un instrumento, un plan."
      : "Algo que estás construyendo: una mudanza, un lanzamiento, un trámite largo. Dentro van los encargos que lo hacen avanzar.",
    30);
  if (!nombre) return;
  const ramas = ramasDe(kind);
  /* ---- Cómo se llama cada cosa en Proyectos ----
     La jerarquía, tal como la fijó Eduardo el 27 ago 2026:

       rama de proyectos  →  encargos  →  etapas

     Y el detalle que parece un capricho y no lo es: **la rama de proyectos,
     una vez creada, se llama PROYECTO**. Se crean ramas y se tienen
     proyectos. Por eso este cuadro dice «Nueva rama de proyectos» y el aviso
     de dos líneas más abajo dice «Proyecto X creado»: no es una
     inconsistencia, es el ciclo de vida de la misma cosa.

     Los encargos son las tarjetas de dentro —«son como quests», palabras
     suyas— y las etapas son los pasos de cada quest.

     Él mismo avisó de que suena raro y de que parece faltar un eslabón. Se
     queda así a propósito: es como entiende hoy el asunto, y el vocabulario
     de la app tiene que ser el suyo y no uno más ordenado que nadie usa. Si
     algún día aparece el eslabón que falta, este comentario es el sitio por
     donde empezar. */
  if (ramas.includes(nombre)) {
    toast(`Ya tienes ${esTalentos ? "una rama" : "un proyecto"} "${nombre}"`, "atencion");
    return;
  }
  state.ui[claveRamas(kind)] = [...ramas, nombre];
  save();
  if (esTalentos) renderTree(); else renderProjects();
  toast(`${esTalentos ? "Rama" : "Proyecto"} "${nombre}" ${esTalentos ? "creada" : "creado"}`, "hecho");
}

/* Al renombrar, la rama conserva su sitio en la lista. Si se juntó con otra,
   el hueco de la que desaparece se cierra en vez de dejar un nombre muerto. */
function renombrarEnRamas(kind, viejo, nuevo) {
  const clave = claveRamas(kind);
  const o = ramasDe(kind);
  const i = o.indexOf(viejo);
  if (i < 0) return;
  o[i] = o.includes(nuevo) ? null : nuevo;
  state.ui[clave] = o.filter(Boolean);
}

async function deleteBranch(kind, b) {
  const esTalentos = kind === "perks";
  const lista = (esTalentos ? state.perks : state.projects).filter(p => (p.branch || "General") === b);
  const singular = esTalentos ? "talento" : "encargo";
  const plural = esTalentos ? "talentos" : "encargos";
  const n = lista.length;

  const arrastra = fraseCantidad(n, singular, plural);
  /* Cada módulo llama a su contenedor por su nombre: en Talentos es una rama y
     en Proyectos es el proyecto entero. Un cuadro que dice «se borrará la
     rama» cuando lo que se borra es un proyecto con sus encargos dentro le
     pide a la persona que traduzca, y justo antes de confirmar algo que no se
     deshace. */
  const cont = esTalentos ? "la rama" : "el proyecto";
  const ok = await ask(
    (arrastra
      ? `Se borrará ${cont} "${b}" y con ${esTalentos ? "ella" : "él"} ${arrastra}.`
      : `Se borrará ${cont} "${b}", que está ${esTalentos ? "vacía" : "vacío"}.`) + "\n\n" +
    (esTalentos && n ? "También se pierden las conexiones que llegaban a esos talentos desde otras ramas.\n\n" : "") +
    "Esto no se puede deshacer.",
    esTalentos ? "Borrar la rama" : "Borrar el proyecto", true);
  if (!ok) return;

  state.ui[claveRamas(kind)] = ramasDe(kind).filter(n => n !== b);

  const ids = new Set(lista.map(p => p.id));
  if (esTalentos) {
    state.perks = state.perks.filter(p => !ids.has(p.id));
    // Nadie puede quedar exigiendo un talento que ya no existe: eso dejaría
    // nodos bloqueados para siempre, sin forma de desbloquearlos.
    state.perks.forEach(p => {
      const r = requisitosDe(p);
      if (r.some(id => ids.has(id))) p.requiere = r.filter(id => !ids.has(id));
    });
    if (editandoRama(b, "talentos")) editBranch = null;
    /* Y si se estaba viendo a pantalla completa, se sale: quedarse dentro de
       una rama borrada es lo que dejaba la capa encima con datos fantasma. */
    if (typeof fullscreenBranch !== "undefined" && fullscreenBranch === b
        && fullscreenMod === "talentos") closeBranchFullscreen();
  } else {
    state.projects = state.projects.filter(p => !ids.has(p.id));
    /* Igual que en Talentos: quedarse dentro de un proyecto borrado deja la
       capa encima enseñando algo que ya no existe. */
    if (typeof fullscreenBranch !== "undefined" && fullscreenBranch === b
        && fullscreenMod === "proyectos") closeBranchFullscreen();
    /* La misma trampa que en Talentos, y ahora tambien aqui porque un
       encargo puede depender de otro: sin limpiar, los que apuntaban a uno
       borrado se quedarian esperando un turno que no va a llegar nunca. */
    state.projects.forEach(p => {
      const r = requisitosDe(p);
      if (r.some(id => ids.has(id))) p.requiere = r.filter(id => !ids.has(id));
    });
    if (editandoRama(b, "proyectos")) editBranch = null;
    if (state.ui.mapaProyectos) delete state.ui.mapaProyectos[b];
  }
  save();
  if (esTalentos) renderTree(); else renderProjects();
  toast(`Rama "${b}" borrada`, "deshecho");
}

/* ---- Renombrar una rama de talentos ----
   La rama no es un dato aparte: es el nombre que llevan escrito sus talentos
   y sus cajas. Renombrarla es reescribirlo en todos a la vez, y por eso vive
   aquí y no en un formulario.

   Si el nombre nuevo ya existe, las dos ramas se juntan. No es un error que
   haya que impedir —juntar dos ramas que se llamaban casi igual es una razón
   perfectamente buena para renombrar— pero sí se avisa antes, porque el
   resultado no se puede adivinar desde el teclado. */
async function renombrarRama(b) {
  const nuevo = await askText(`Renombrar la rama "${b}"`, b, "Renombrar",
    "Se reescribe en todos sus talentos y en sus cajas.");
  if (nuevo === null || !nuevo || nuevo === b) return;

  const existe = state.perks.some(p => (p.branch || "General") === nuevo);
  if (existe && !await ask(
    `Ya tienes una rama llamada "${nuevo}". Los talentos de "${b}" se van a juntar con los suyos en una sola rama.`,
    "Juntarlas")) return;

  state.perks.forEach(p => { if ((p.branch || "General") === b) p.branch = nuevo; });
  (state.cajas || []).forEach(c => { if (c.branch === b) c.branch = nuevo; });
  renombrarEnRamas("perks", b, nuevo);
  // El estado de la interfaz va pegado al nombre: si no se muda, la rama
  // renombrada aparecería desplegada y la vieja seguiría "plegada" sin existir
  if (state.ui && state.ui.collapsed && state.ui.collapsed[b]) {
    delete state.ui.collapsed[b];
    state.ui.collapsed[nuevo] = true;
  }
  if (editandoRama(b, "talentos")) editBranch = nuevo;
  if (fullscreenBranch === b && fullscreenMod === "talentos") fullscreenBranch = nuevo;
  save();
  renderTree();
  toast(existe ? `Ramas juntadas en "${nuevo}"` : `Ahora se llama "${nuevo}"`, "hecho");
}

/* Lo mismo para las ramas de Proyectos. Vive aparte de la de Talentos porque
   lo que arrastra cada una es distinto —allí también hay cajas del ático y un
   modo edición abierto— y unificarlas dejaría una función con dos mitades que
   nunca se ejecutan juntas. */
async function renombrarRamaProyectos(b) {
  const nuevo = await askText(`Renombrar el proyecto "${b}"`, b, "Renombrar",
    "Se reescribe en todos sus encargos.");
  if (nuevo === null || !nuevo || nuevo === b) return;

  const existe = state.projects.some(p => (p.branch || "General") === nuevo);
  if (existe && !await ask(
    `Ya tienes un proyecto llamado "${nuevo}". Los encargos de "${b}" se van a juntar con los suyos en uno solo.`,
    "Juntarlos")) return;

  state.projects.forEach(p => { if ((p.branch || "General") === b) p.branch = nuevo; });
  renombrarEnRamas("projects", b, nuevo);
  /* Igual que "plegada" en Talentos: si la vista no se muda con el nombre, el
     proyecto renombrado vuelve a la lista y el nombre viejo se queda marcado
     como "en mapa" sin existir. */
  if (state.ui && state.ui.mapaProyectos && state.ui.mapaProyectos[b]) {
    delete state.ui.mapaProyectos[b];
    state.ui.mapaProyectos[nuevo] = true;
  }
  if (editandoRama(b, "proyectos")) editBranch = nuevo;
  if (fullscreenBranch === b && fullscreenMod === "proyectos") fullscreenBranch = nuevo;
  save();
  renderProjects();
  toast(existe ? `Proyectos juntados en "${nuevo}"` : `Ahora se llama "${nuevo}"`, "hecho");
}

/* Etiqueta de rama reutilizable: el mismo concepto en todas las secciones. */
function branchHeader(name, countLabel, buttons) {
  return `
    <div class="branch-head">
      <div class="btitle">
        <span class="branch-kicker">Rama</span>
        <h3>${escapeHtml(name)}</h3>
      </div>
      <span class="count">${countLabel}</span>
      <div class="bhead-btns">${buttons}</div>
    </div>`;
}

