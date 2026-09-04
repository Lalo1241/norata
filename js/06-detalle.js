/* Pantallas de proyecto, habilidad y árbol */
/* ================= Render: misiones ================= */

function renderMissions() {
  const el = document.getElementById("missions-content");
  const key = todayKey();

  if (state.missions.length === 0) {
    el.innerHTML = `
      <div class="empty">
        <div class="bubble">${icon("target", 34)}</div>
        <h2>${tx("Sin misiones todavía")}</h2>
        <p>${tx("Las misiones son lo que haces hoy: pequeñas, repetibles y con recompensa. Son las que mantienen viva tu racha y hacen subir tus habilidades sin que lo notes.")}</p>
        <div class="stack" style="align-items:center">
          <button class="btn btn-primary" onclick="openMissionForm()">${tx("Crear mi primera misión")}</button>
          <button class="btn btn-ghost" onclick="verElEjemplo()">${tx("Ver un ejemplo completo")}</button>
        </div>
      </div>`;
    return;
  }

  const { due, done, pct } = todayMissionStats();
  const pending = due.filter(m => !missionDone(m, key));
  const dayName = keyToDate(key).toLocaleDateString(localeActual(), { weekday: "long" });

  const card = (m) => {
    const guardada = !!m.archived;
    const c = missionCount(m, key);
    const t = missionTarget(m);
    const ok = c >= t;
    const st = missionStreak(m);
    const skill = m.skillId ? state.skills.find(s => s.id === m.skillId) : null;
    const col = m.color || "#5fe0b0";
    const cuenta = t > 1;
    /* Lo que lleva esperando desde que alguien la apartó. Va en la tarjeta y
       no escondido en su ficha porque el sentido de contarlo es justo ese:
       una misión que lleva nueve días de columna en columna se delata sola. */
    const espera = diasPospuesta(m);
    /* Ya cumplida, el sello cambia de tiempo verbal: deja de ser una cuenta
       que corre y pasa a ser lo que costó. Se enseña mientras la misión siga
       a la vista —hoy, o guardada en las terminadas—, no para siempre. */
    const costo = m.pospuestaUltima && (guardada || m.pospuestaUltima.cerradaEl === key)
      ? m.pospuestaUltima.dias : 0;

    return `
    <div class="ms-card ${ok || guardada ? "done" : ""}" data-rid="${m.id}" style="${tonos("mc", col)}">
      ${guardada ? botonMision(m, 1, 1, { reabrir: true }) : botonMision(m, c, t)}
      ${iconoMision(m)}
      <div class="ms-body" onclick="openMissionForm('${m.id}')">
        <div class="ms-name">${escapeHtml(m.name)}</div>
        <div class="ms-meta">
          ${guardada
            ? `<span>cumplida el ${formatDate(m.completedAt)}</span>`
            : `${skill ? `<span>${escapeHtml(skill.name)}</span>` : ""}
          ${m.xp ? `<span>+${m.xp} XP</span>` : ""}
          ${m.cadence === "weekly" ? `<span>${(m.days || []).map(d => DAY_NAMES[d]).join(" ")}</span>` : ""}
          ${m.cadence === "once" ? `<span>${tx("una vez")}</span>` : ""}`}
          ${espera > 0 ? `<span class="ms-espera">pospuesta ${espera} d</span>` : ""}
          ${costo > 0 ? `<span class="ms-espera">esperó ${costo} d</span>` : ""}
          ${/* Deshacer vive DENTRO de la misión, junto a sus datos. Estaba
                pegado a la llama de la racha, donde el signo "−" se leía
                como "bájame la racha" en vez de "quita una vez de hoy".
                Solo queda en las misiones con cuenta: en las de un solo
                golpe lo hace ya el propio círculo al pasar el cursor, y
                tener las dos cosas era ofrecer dos veces lo mismo. Dice
                "−1" y no "3→2" para que sea el reverso exacto del "+1" que
                aparece en el círculo. */
            (!guardada && cuenta && c > 0) ? `<button class="ms-undo" onclick="event.stopPropagation();logMission('${m.id}', -1)"
              aria-label="Quitar una vez de ${escapeAttr(m.name)}" title="${escapeAttr(tx("Quitar una vez de hoy"))}">
              ${VOLVER} −1
            </button>` : ""}
        </div>
      </div>
      <div class="ms-side">
        ${st > 0 ? `<span class="ms-streak">${icon("flame", 13)}${st}</span>` : ""}
      </div>
    </div>`;
  };

  /* ---- Reparto en columnas ----
     Cada misión cae en una sola columna, y la mayoría sin que nadie lo haya
     decidido: lo dice su cadencia. Ver tableroDeMision. */
  const cols = tablerosDeMisiones();
  const porTablero = {};
  cols.forEach(c => { porTablero[c.id] = []; });
  state.missions.forEach(m => {
    const id = tableroDeMision(m);
    (porTablero[id] || porTablero.semana).push(m);
  });

  /* Una columna vacía invita, no informa: "Nada pendiente para hoy" era una
     noticia, y lo que hace falta ahí es decir qué se puede hacer con ese
     hueco. La de cumplidas es la excepción —a esa se llega cumpliendo, no
     planeando— y por eso es la única que cuenta algo. */
  const VACIO = {
    hoy: "Arrastra aquí la misión que quieras.",
    hechas: "Aquí van apareciendo las que cumples hoy.",
    semana: "Arrastra aquí la misión que quieras.",
    terminadas: "Arrastra aquí la misión que quieras dar por terminada."
  };

  /* La lista es también la zona donde se suelta: `data-soltar` deja que una
     columna vacía reciba su primera misión, cuando no hay ninguna tarjeta
     contra la que colocarse. */
  const cuerpo = (c) => {
    const lista = ordenarMisiones(porTablero[c.id] || []);
    return `<div class="ms-list" data-tablero="${c.id}" data-soltar=".ms-card">${
      lista.length
        ? lista.map(card).join("")
        : `<p class="col-vacia">${escapeHtml(VACIO[c.id] || "Arrastra aquí la misión que quieras.")}</p>`
    }</div>`;
  };

  /* Crear desde la columna en la que estás mirando: la misión nace ya puesta
     ahí. Las dos columnas de cerrado no lo llevan —a "Cumplidas hoy" y a
     "Misiones terminadas" se llega cumpliendo, no creando—. */
  const masTablero = (c) => (c.id === "hechas" || c.id === "terminadas") ? "" :
    `<button class="badd" onclick="openMissionForm(null, '${c.id}')" aria-label="Añadir misión a ${escapeAttr(c.nombre)}">＋</button>`;

  /* Igual que en las ramas de Proyectos y de Talentos: el nombre se reescribe
     tocándolo. Renombrar deja de estar escondido en un menú, que es donde
     nadie lo busca — el lápiz al lado del título lo dice sin explicarlo. */
  const tituloTablero = (c) => `
    <h3 class="renombrable" onclick="renombrarTableroMisiones('${c.id}')"
      title="${escapeAttr(tx("Toca el nombre para renombrar este tablero"))}">${escapeHtml(c.nombre)}${icon("pen", 11)}</h3>`;

  const menuTablero = (c) => c.propio
    ? branchMenu("t:" + c.id, [
        { title: "Borrar este tablero", hint: (porTablero[c.id] || []).length ? "Sus misiones vuelven a su sitio" : "Está vacío", icon: "bote", danger: true, onclick: `borrarTableroMisiones('${c.id}')` }
      ])
    : "";

  const hero = sectionHero({
    scene: motifScene(820, 168, 55, "waves", "var(--mint)"),
    lead: `
      <div class="ring-wrap" style="width:92px;height:92px">
        ${/* Animado, no fijo: cumplir una misión mueve este anillo, y verlo
              crecer es la respuesta a lo que acabas de hacer. Estático,
              el porcentaje simplemente aparecía cambiado y el gesto se
              quedaba sin acuse de recibo. */
          animRing(92, 9, pct / 100, "var(--mint)",
            lastMisionPct === null ? 0 : lastMisionPct, "rgba(234,241,239,0.14)")}
        <div class="ring-center">
          <div class="v" style="font-size:19px"><b>${done.length}</b><span style="font-size:13px;color:var(--muted)">/${due.length}</span></div>
        </div>
      </div>
      <div>
        <div class="label">${dayName}</div>
        <div class="big" style="font-size:30px"><b>${pct}%</b><span> ${tx("del día")}</span></div>
      </div>`,
    /* Los números son de los últimos siete días y cada uno trae su flecha
       (js/10f-informes.js). Lo de hoy sigue arriba, en el anillo y en «Hoy». */
    stats: statsPanelMisiones({ due }),
    informe: "misiones",
    focus: pending[0]
      ? { k: "Lo siguiente para hoy", v: pending[0].name, color: "var(--mint)", onclick: `logMission('${pending[0].id}', 1)` }
      : (due.length
        ? { k: "Día completo", v: "Todas las misiones cumplidas", color: "var(--mint)" }
        : { k: "Sin misiones hoy", v: "Crea una o descansa", color: "var(--muted)" })
  });

  /* Dos formas para el mismo tablero. En pantalla ancha son columnas de
     verdad, con desplazamiento de lado: se ven varias a la vez y mover algo
     de una a otra es un gesto corto. En el teléfono se apilan en vertical:
     no cabe ni una columna y media, y bajar por la pantalla es más natural
     que empujarla de lado con el pulgar.

     Lo que NO cambia entre los dos es qué tableros hay. Un tablero vacío se
     queda igualmente, con su recuadro punteado, porque si desapareciera no
     habría dónde devolver lo que acabas de sacar de él. La única que va y
     viene es "Cumplidas hoy": no es un sitio donde guardar cosas, es el
     resultado del día, y vacía no dice nada. */
  const visibles = cols.filter(c => !c.soloConAlgo || (porTablero[c.id] || []).length);

  el.innerHTML = hero + (isDesktop()
    ? `
    <div class="tablero-pista full-row">
      <span class="hint-hold">${tx("Arrastra una misión de una columna a otra: a la semana queda pospuesta, a las terminadas queda cerrada. El ＋ de cada columna crea una misión ya puesta ahí.")}</span>
    </div>
    <div class="tablero-mis full-row" data-carril>
      ${visibles.map(c => `
        <section class="col-mis">
          <div class="col-head">
            ${tituloTablero(c)}
            <span class="count">${(porTablero[c.id] || []).length}</span>
            <div class="bhead-btns">${menuTablero(c)}${masTablero(c)}</div>
          </div>
          ${cuerpo(c)}
        </section>`).join("")}
    </div>`
    : `
    <div class="tablero-pista full-row"><span class="hint-hold">${pistaReordenar()} · el ＋ de cada tablero crea una misión ya puesta ahí</span></div>
    ${visibles.map((c, i) => `
      <div class="panel ${i % 2 ? "alt" : ""}">
        <div class="panel-head">
          ${tituloTablero(c)}
          <div class="bhead-btns">${menuTablero(c)}${masTablero(c)}</div>
        </div>
        ${cuerpo(c)}
      </div>`).join("")}`);

  playRings(el);
  lastMisionPct = pct / 100;
  attachMisionOrden();
  ajustarAltoTablero();
}

/* ---- El tablero llega hasta abajo ----
   Medía lo que midiera la columna más alta, así que con dos misiones se
   quedaba en 230 px y dejaba media pantalla en negro: había que empujar de
   lado para ver los tableros de la derecha teniendo 400 px libres debajo.

   Se mide dónde empieza el carril y se le da todo lo que queda de ventana.
   El hueco pasa a ser de las columnas, que es donde sirve: es sitio donde
   soltar una tarjeta. */
function ajustarAltoTablero() {
  const carril = document.querySelector(".tablero-mis");
  if (!carril) return;
  if (!isDesktop()) { carril.style.height = ""; return; }
  const arriba = carril.getBoundingClientRect().top + window.scrollY;
  const alto = window.innerHeight - arriba - 26;
  carril.style.height = Math.max(320, Math.round(alto)) + "px";
}

/* ================= Render: proyectos ================= */

function renderProjects() {
  const el = document.getElementById("projects-content");
  const all = state.projects;
  const ramas = ramasDe("projects");

  /* El vacío es no tener NADA, ni siquiera un proyecto esperando: con un
     proyecto creado hay que enseñarlo, aunque todavía no lleve encargos. */
  if (all.length === 0 && ramas.length === 0) {
    /* Antes de la salida rápida, no después, por lo mismo que en Talentos:
       `renderFullscreen` vive al final de esta función, así que borrar el
       último proyecto estando a pantalla completa dejaba la capa encima
       enseñando algo que ya no existía. Se salía con Escape, pero lo que se
       veía era mentira. */
    renderFullscreen("proyectos");
    el.innerHTML = `
      <div class="empty">
        <div class="bubble">${icon("flag", 34)}</div>
        <!-- «Proyecto» y no «encargo», y lo corrigió Eduardo: esta pantalla
             describía un proyecto —algo que construyes y que avanza— y lo
             llamaba encargo, que es otra cosa. Un proyecto avanza POR
             encargos, y los encargos se dividen en etapas. La primera
             pantalla del módulo es justo donde no se puede confundir el
             nombre del módulo con el de lo que lleva dentro. -->
        <h2>${tx("Sin proyectos todavía")}</h2>
        <p>${tx("Un proyecto es algo que estás construyendo y que avanza por encargos divididos en etapas. La app mide tu ritmo y te dice cuáles proyectos siguen vivos y cuáles te conviene soltar.")}</p>
        <div class="stack" style="align-items:center">
          <!-- Aquí había un "Ver un ejemplo completo", y sembraba la app
               ENTERA: habilidades, talentos y misiones además de los
               proyectos. Quien llegaba con cosas suyas ya dentro acababa con
               todo duplicado y la app irreconocible. El ejemplo completo se
               ofrece donde tiene sentido, en la portada de una app vacía. -->
          <!-- crearRama y no openProjectForm: el botón dice «proyecto» y tiene
               que crear un proyecto. Abría el formulario de un ENCARGO, que es
               lo que va dentro, así que el primer gesto de la pantalla enseñaba
               los dos nombres cambiados. Con el proyecto ya creado, sus
               encargos se añaden con el ＋ de su tarjeta.
               SIN COMILLAS INVERSAS: este comentario vive dentro de un template
               literal, y una sola cierra la cadena y parte el archivo entero.
               Lo hizo: renderProjects dejó de existir y Proyectos no cargaba. -->
          <button class="btn btn-primary" onclick="crearRama('projects')">${tx("Crear mi primer proyecto")}</button>
        </div>
      </div>`;
    return;
  }

  const live = all.filter(p => p.status === "active" || p.status === "paused");
  const stalled = live.filter(p => projectHealth(p).key === "stalled");
  const done = all.filter(p => p.status === "done");
  const avgProg = live.length ? Math.round(live.reduce((a, p) => a + projectProgress(p), 0) / live.length) : 0;

  // Foco: lo estancado primero, si no lo que está por cerrarse
  const closing = [...live].filter(p => projectProgress(p) >= 60)
    .sort((a, b) => projectProgress(b) - projectProgress(a))[0];
  let pFocus;
  if (stalled.length) {
    pFocus = { k: `Estancado ${daysIdle(stalled[0])} días`, v: stalled[0].name, color: "var(--coral)", onclick: `openProject('${stalled[0].id}')`, pct: projectProgress(stalled[0]) };
  } else if (closing) {
    pFocus = { k: "A punto de cerrarse", v: closing.name, color: "var(--mint)", onclick: `openProject('${closing.id}')`, pct: projectProgress(closing) };
  } else if (live.length) {
    pFocus = { k: "Siguiente etapa", v: live[0].name, color: "var(--mint)", onclick: `openProject('${live[0].id}')`, pct: projectProgress(live[0]) };
  } else {
    pFocus = { k: "Nada en marcha", v: "Crea un encargo cuando quieras", color: "var(--muted)" };
  }

  let html = sectionHero({
    scene: motifScene(820, 168, 77, "peaks", "var(--mint)"),
    lead: `<div>
      <div class="label">${tx("Avance de lo que construyes")}</div>
      <div class="big"><b>${avgProg}%</b><span> ${tx("promedio")}</span></div>
    </div>`,
    /* «Etapas hechas» era un acumulado que solo sube: dejó sitio a las etapas
       y los cierres de la semana, con su flecha. */
    stats: statsPanelProyectos({ live, stalled }),
    informe: "proyectos",
    focus: pFocus
  });

  if (stalled.length) {
    html += `
    <div class="panel alt full-row" style="border-color:rgba(255,138,112,0.4)">
      <h3 style="color:var(--coral)">${tx("Decisión pendiente")}</h3>
      <p class="settings-note">${tx("Estos encargos llevan mucho sin avanzar. Retomarlos o soltarlos libera tu atención — dejarlos en el limbo es lo único que no ayuda.")}</p>
      ${stalled.map(p => `
        <button class="att-item" onclick="openProject('${p.id}')">
          <span class="dot" style="background:var(--coral-soft);color:var(--coral)">${icon(p.icon, 17)}</span>
          <span class="tx"><b>${escapeHtml(p.name)}</b><span>${daysIdle(p)} días sin avance · ${projectProgress(p)}% hecho</span></span>
          <span class="go">→</span>
        </button>`).join("")}
    </div>`;
  }

  const branches = ramas;
  /* «Tus ramas de proyectos» y no «Tus proyectos»: este rótulo encabeza la
     LISTA de contenedores, que es donde el nombre largo hace falta. Dentro de
     cada tarjeta ya se les dice proyecto a secas — ahí el contexto lo da la
     propia tarjeta. Ver `crearRama` para la jerarquía entera. */
  html += `<div class="sec-label full-row">Tus ramas de proyectos${
    branches.length > 1 ? `<span class="hint-hold">${pistaReordenarRamas()}</span>` : ""}</div>`;
  let iRama = 0;
  for (const b of branches) {
    const list = all.filter(p => (p.branch || "General") === b)
      .sort((a, c) => (a.status === "dropped" || a.status === "done" ? 1 : 0) - (c.status === "dropped" || c.status === "done" ? 1 : 0));
    const liveN = list.filter(p => p.status === "active" || p.status === "paused").length;
    /* Lista o mapa, y lo decide cada proyecto por separado (Eduardo, 27 ago
       2026): un boton cambia la vista cuando quieras y ninguno de los dos
       modos encierra al otro. Quien no lo toque no se encuentra nodos. */
    const enMapa = enMapaProyectos(b);
    /* Un numero y no el nombre de la rama: la clave acaba dentro del id de un
       filtro del SVG, y un nombre con espacios o acentos da un id invalido
       que Chrome ignora en silencio — el resplandor de los nodos desaparecia
       sin ningun error a la vista. Los 500 son para no chocar con las claves
       que reparte Talentos. */
    const claveMapa = 500 + (iRama++);
    const editandoMapa = enMapa && editandoRama(b, "proyectos");
    /* `data-cota` es la cifra de la cota de Blueprint, y lleva LO MISMO que la
       pastilla de la cuenta a propósito: la cota no añade un dato, se queda con
       el que ya había. Repetir la misma cifra dos veces en la misma tarjeta la
       abarata, así que el mundo que enciende la cota esconde la pastilla
       (`css/mundos.css`). Inerte para los demás mundos y para la casa.

       Y va aquí fuera y no dentro de la plantilla: este comentario lleva
       backticks, y un backtick dentro de un template literal lo CIERRA. Con él
       dentro, la app entera dejaba de arrancar. */
    html += `
    <div class="branch-card" data-rid="${escapeAttr(b)}" data-cota="${liveN} de ${list.length}" style="padding-bottom:14px">
      <div class="branch-head" style="margin-bottom:12px">
        <!-- Igual que en Talentos: el nombre se reescribe tocándolo -->
        <h3 class="renombrable" onclick="renombrarRamaProyectos('${enJS(b)}')" title="${escapeAttr(tx("Toca el nombre para renombrar el proyecto"))}">${escapeHtml(b)}${icon("pen", 11)}</h3>
        <span class="count">${liveN} de ${list.length}</span>
        <div class="bhead-btns">
          ${branchMenu("p:" + b, [
            { title: enMapa ? "Verlo como lista" : "Verlo como mapa",
              hint: enMapa ? "Vuelve a las tarjetas de siempre" : "Dibuja los encargos y en qué orden van",
              icon: enMapa ? "caja" : "expandir", onclick: `alternarMapaProyectos('${enJS(b)}')` },
            ...(enMapa ? [
              { title: editandoMapa ? "Salir de edición" : "Editar el mapa",
                hint: editandoMapa ? "Vuelve al modo normal" : "Conecta y corta hilos",
                icon: "lapiz", onclick: `toggleEditBranch('${enJS(b)}','proyectos')` },
              { title: "Reacomodar el mapa", hint: "Recoloca los encargos según su orden",
                icon: "expandir", onclick: `resetBranchLayout('${enJS(b)}','proyectos')` }
            ] : []),
            { title: "Borrar este proyecto", hint: list.length === 0 ? "Está vacío" : (list.length === 1 ? "Se va también su único encargo" : `Se van también sus ${list.length} encargos`), icon: "bote", danger: true, onclick: `deleteBranch('projects','${enJS(b)}')` }
          ])}
          <button class="badd" onclick="openProjectForm(null, '${enJS(b)}')" aria-label="Añadir encargo a ${escapeAttr(b)}">＋</button>
        </div>
      </div>
      ${enMapa ? mapaDeProyecto(b, editandoMapa, claveMapa) : `
      <div class="proj-list" data-branch="${escapeAttr(b)}" data-soltar=".proj-card">
        ${!list.length ? `<p class="col-vacia">${tx("Arrastra aquí el encargo que quieras, o crea uno con el ＋.")}</p>` : ""}
        ${list.map(p => {
          const prog = projectProgress(p);
          const h = projectHealth(p);
          const dim = p.status === "dropped" || p.status === "done";
          const col = p.color || "#5fe0b0";
          const doneN = (p.steps || []).filter(s => s.done).length;
          return `
          <div class="proj-card ${dim ? "dim" : ""}" data-rid="${p.id}" style="${tonos("pc", col)}">
            <div class="proj-abre" role="button" tabindex="0" onclick="openProject('${p.id}')"
                 onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openProject('${p.id}')}">
            <div class="proj-top">
              <span class="proj-ic" style="background:${velo(col, "22")};color:${tinta(col)}">${icon(p.icon, 19)}</span>
              <span class="proj-name">${escapeHtml(p.name)}</span>
              <span class="proj-state" style="background:${PROJECT_STATUS[p.status].soft};color:${PROJECT_STATUS[p.status].color}">${tx(PROJECT_STATUS[p.status].label)}</span>
            </div>
            <div class="proj-bar"><div class="bar"><div class="bar-fill" style="width:${prog}%;background:${trazo(col)}"></div></div></div>
            <div class="proj-meta">
              <span>${doneN} de ${(p.steps || []).length} etapas · <b>${prog}%</b></span>
              <span style="color:${h.color}">${tx(h.label)}</span>
            </div>
            </div>
            ${etapasEnLista(p)}
          </div>`;
        }).join("")}
      </div>`}
    </div>`;
  }
  el.innerHTML = html;
  /* Antes de los manejadores, igual que en renderTree: la capa se dibuja la
     última para que las posiciones que deja apuntadas `constellation` sean
     las del lienzo que se está viendo, no las del que quedó debajo. */
  renderFullscreen("proyectos");
  /* Las tarjetas se arrastran, y no solo dentro de su rama: soltarlas en
     otra las muda. Es la operación que antes obligaba a abrir el encargo,
     entrar a editarlo y cambiar un desplegable — tres pantallas para algo
     que la mano quiere hacer de un tirón.

     Se engancha al contenedor entero (no a cada lista) porque el arrastre
     cruza fronteras, y una sola vez: hacerReordenable ya se protege de
     repetirse en cada repintado.

     Las ramas se arrastran por su cabecera y las tarjetas por cualquier otro
     sitio. Repartir el gesto por dónde empieza evita el asa aparte: la
     cabecera ya es una franja ancha y vacía, y es justo donde la mano va a
     agarrar una columna entera. Los botones que viven ahí (el ＋ y el menú)
     quedan fuera para que sigan siendo botones. */
  /* Las pastillas y el campo quedan fuera del arrastre: agarrar una etapa
     para marcarla no puede empezar a mover la tarjeta, y en el teléfono un
     campo de texto que se arrastra no se puede escribir. */
  hacerReordenable(el, ".proj-card", reacomodarEncargos,
    (e) => !e.target.closest(".branch-head") && !e.target.closest(".proj-steps"));
  hacerReordenable(el, ".branch-card", reacomodarRamas,
    (e) => !!e.target.closest(".branch-head") && !e.target.closest("button"));
  /* Los mapas se enganchan igual que los de Talentos y en el mismo orden:
     primero el editor (que solo hay uno a la vez), luego el arrastre normal y
     el clic derecho, y al final el encuadre. Ver renderTree. */
  if (editMod === "proyectos" && editBranch && enMapaProyectos(editBranch) && !fullscreenBranch) attachEditHandlers(el);
  attachPanHandlers(el);
  attachCtxHandlers(el);
  encuadrarLienzos(el);
  /* Y si se estaba escribiendo una etapa, el campo vuelve. Va al final, con
     el DOM ya puesto. */
  if (etapaAbiertaEn) {
    const sigue = etapaAbiertaEn;
    etapaAbiertaEn = null;
    nuevaEtapaEnLista(sigue);
  }
}

/* ================= El mapa de un proyecto =================
   La segunda vista de un proyecto: los mismos encargos, dibujados como nodos
   y unidos por en que orden van. No sustituye a la lista — el boton del menu
   cambia de una a otra cuando quieras — y por eso quien no lo pida no se topa
   con nodos nunca.

   Lo que el mapa enseña y la lista no puede: que encargos pueden ir en
   paralelo y cuales estan esperando a otro. Si algun dia una conexion deja de
   cambiar lo que la app te sugiere como siguiente paso, este mapa se habra
   convertido en un dibujo bonito y habra que quitarlo. */

function enMapaProyectos(b) {
  return !!(state.ui && state.ui.mapaProyectos && state.ui.mapaProyectos[b]);
}

function alternarMapaProyectos(b) {
  state.ui = state.ui || {};
  state.ui.mapaProyectos = state.ui.mapaProyectos || {};
  if (!state.ui.mapaProyectos[b]) state.ui.mapaProyectos[b] = true;
  else {
    delete state.ui.mapaProyectos[b];
    // Salir de la vista no puede dejar el modo edicion encendido a ciegas
    if (editandoRama(b, "proyectos")) editBranch = null;
  }
  save();
  renderProjects();
}

function mapaDeProyecto(b, editando, clave) {
  const nodes = vistaDeRamaProyectos(b);
  if (!nodes.length) {
    return `<p class="col-vacia">${tx("Todavía no hay encargos en este proyecto. Créale el primero con el ＋.")}</p>`;
  }
  /* `data-mod` es lo que le dice al lienzo de que coleccion es este mapa. Sin
     el, un arrastre hecho aqui habria ido a buscar el nodo entre los talentos
     y no habria encontrado nada. Ver attachPanHandlers. */
  return `
    <div class="const-wrap ${editando ? "editing" : ""}" data-branch="${escapeAttr(b)}" data-mod="proyectos">${
      constellation(nodes, clave, editando, b, "proyectos")}</div>
    <button class="fs-open" onclick="openBranchFullscreen('${enJS(b)}','proyectos')">
      <svg viewBox="0 0 24 24">${BM_ICONS.expandir}</svg> Ver el proyecto completo
    </button>
    ${editando
      ? `<div class="const-hint edit">${tx("Arrastra para acomodar · tira del punto ▸ hacia otro encargo para ponerlo después · toca una línea para cortarla · el círculo")} <b>Y/O</b> ${tx("cambia si hacen falta todos sus requisitos o basta uno")}</div>`
      : `<div class="const-hint">${tx("Toca un encargo para abrirlo · arrástralo para acomodarlo · clic derecho para conectar, crear y más")}</div>`}`;
}

/* ---- Orden de las ramas de Proyectos ----
   Antes salían en el orden en que aparecía su primer encargo, así que
   moverlas de sitio obligaba a mover encargos. Ahora el orden es suyo y vive
   en la misma lista que dice qué ramas existen (ver ramasDe). */
function reacomodarRamas(nombres) {
  state.ui = state.ui || {};
  const previas = ramasDe("projects");
  state.ui.ramasProyectos = [...nombres, ...previas.filter(n => !nombres.includes(n))];
  save();
  renderProjects();
}

function pistaReordenarRamas() {
  return isDesktop() ? "Arrastra una cabecera para reordenar las ramas"
                     : "Mantén pulsada una cabecera para reordenar las ramas";
}

/* Reconstruye el orden y la rama de cada encargo a partir de lo que quedó en
   pantalla. Se lee el DOM en vez de calcularlo porque el arrastre ya movió
   las tarjetas a su sitio: lo que se ve ES el resultado. */
function reacomodarEncargos() {
  const orden = [];
  const mudados = [];
  document.querySelectorAll("#projects-content .proj-list").forEach(lista => {
    const rama = lista.dataset.branch;
    lista.querySelectorAll(".proj-card").forEach(el => {
      const pr = state.projects.find(x => x.id === el.dataset.rid);
      if (!pr) return;
      if ((pr.branch || "General") !== rama) {
        pr.branch = rama;
        /* Queda en el historial, pero SIN tocar la fecha de actividad:
           cambiar algo de sitio no es avanzarlo, y contarlo como avance
           reiniciaría el contador de "estancado" sin haber hecho nada. */
        pr.history = pr.history || [];
        pr.history.unshift({ date: todayKey(), at: stamp(), event: `Movido a la rama ${rama}` });
        mudados.push(pr);
      }
      orden.push(pr);
    });
  });
  // Nadie se queda fuera aunque no estuviera dibujado
  state.projects.forEach(p => { if (!orden.includes(p)) orden.push(p); });
  state.projects = orden;
  save();
  renderProjects();
  if (mudados.length === 1) toast(`${mudados[0].name} ahora vive en ${mudados[0].branch}`, "hecho");
}

/* ================= Las etapas dentro de la tarjeta =================
   En escritorio salen todas, como salían. En el teléfono se recortan, que
   era la condición de Eduardo: «sin hacer el scroll demasiado largo». Cuatro
   y el resto en «+N más», que abre el encargo.

   Cuáles se enseñan cuando hay que recortar: las que FALTAN, en su orden. Una
   etapa ya hecha en un encargo a medias interesa menos que la siguiente que
   toca, y el avance ya lo cuenta la barra de arriba. Si no falta ninguna se
   enseñan las últimas hechas, que ahí el mensaje es «esto ya está».

   Un encargo terminado o descartado no lleva el ＋: sus etapas ya no son una
   decisión, y ofrecer añadir una invitaría a reabrirlo por la puerta de
   atrás. Marcarlas sigue permitido, para poder corregir. */
const ETAPAS_EN_MOVIL = 4;

function etapasEnLista(p) {
  const st = p.steps || [];
  const cerrado = p.status === "done" || p.status === "dropped";
  const pj = enJS(p.id);
  if (!st.length && cerrado) return "";

  let ver = st, resto = 0;
  if (!isDesktop() && st.length > ETAPAS_EN_MOVIL) {
    const faltan = st.filter(s => !s.done);
    const base = faltan.length ? faltan : st.slice(-ETAPAS_EN_MOVIL);
    ver = base.slice(0, ETAPAS_EN_MOVIL);
    resto = st.length - ver.length;
  }

  const chips = ver.map(s => `
    <button class="pstep ${s.done ? "ok" : ""}" aria-pressed="${s.done}"
      onclick="event.stopPropagation();toggleStep('${pj}','${enJS(s.id)}')"
      aria-label="${s.done ? "Desmarcar" : "Marcar"} la etapa ${escapeAttr(s.name)}">
      <i>${s.done ? icon("check", 11) : ""}</i>${escapeHtml(s.name)}
    </button>`).join("");

  const mas = resto
    ? `<button class="pstep more" onclick="event.stopPropagation();openProject('${pj}')"
         aria-label="Ver las otras ${resto} etapas">+${resto} más</button>`
    : "";

  const anadir = cerrado ? "" : `
    <button class="pstep add" data-add="${escapeAttr(p.id)}"
      onclick="event.stopPropagation();nuevaEtapaEnLista('${pj}')"
      aria-label="Añadir una etapa a ${escapeAttr(p.name)}">${tx("＋ etapa")}</button>`;

  return `<div class="proj-steps">${chips}${mas}${anadir}</div>`;
}

/* ---- Escribir la etapa donde estás ----
   El ＋ se convierte en un campo en su propio sitio. No abre un cuadro ni
   cambia de pantalla: el teclado sube y ya estás escribiendo.

   Al dar Enter la etapa se crea y el campo VUELVE a quedar abierto, porque
   las etapas casi nunca se añaden de una en una — se piensan en tanda. Esa
   es la razón de `etapaAbiertaEn`: renderProjects rehace la tarjeta entera y
   se llevaría el campo por delante. */
let etapaAbiertaEn = null;

function nuevaEtapaEnLista(prId) {
  const btn = document.querySelector(`.pstep.add[data-add="${cssEscape(prId)}"]`);
  if (!btn) return;
  const pr = state.projects.find(x => x.id === prId);
  if (!pr) return;
  etapaAbiertaEn = prId;
  const caja = document.createElement("span");
  caja.className = "pstep escribiendo";
  caja.innerHTML = `<i></i><input type="text" maxlength="70" placeholder="${escapeAttr(tx("Nueva etapa…"))}"
    aria-label="Nombre de la etapa nueva de ${escapeAttr(pr.name)}">`;
  btn.replaceWith(caja);
  const input = caja.querySelector("input");
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); guardarEtapaEnLista(prId, input.value); }
    if (e.key === "Escape") { e.preventDefault(); etapaAbiertaEn = null; renderProjects(); }
  });
  /* Al salir se cierra sola si está vacía. Con texto NO se descarta: perder
     lo escrito por tocar fuera sin querer es lo que hace que la gente deje de
     confiar en escribir aquí. Se guarda. */
  input.addEventListener("blur", () => {
    if (!input.isConnected) return;
    if (input.value.trim()) guardarEtapaEnLista(prId, input.value);
    else { etapaAbiertaEn = null; renderProjects(); }
  });
  input.focus();
}

function guardarEtapaEnLista(prId, valor) {
  const pr = state.projects.find(x => x.id === prId);
  const name = (valor || "").trim();
  if (!pr) return;
  if (!name) { etapaAbiertaEn = null; renderProjects(); return; }
  pr.steps = pr.steps || [];
  pr.steps.push({ id: uid(), name, done: false, at: null });
  projectLog(pr, `Etapa añadida: ${name}`);
  save();
  etapaAbiertaEn = prId;      // el campo vuelve a abrirse tras el repintado
  renderProjects();
}

function openProject(id) {
  currentProjectId = id;
  renderProjectDetail();
  showView("project");
}

function renderProjectDetail() {
  const pr = state.projects.find(x => x.id === currentProjectId);
  if (!pr) { showView("projects"); return; }
  const prog = projectProgress(pr);
  const h = projectHealth(pr);
  const col = pr.color || "#5fe0b0";
  const skill = pr.skillId ? state.skills.find(s => s.id === pr.skillId) : null;
  const steps = pr.steps || [];

  const stepsHtml = steps.length === 0
    ? `<p class="settings-note" style="margin:0 0 12px">${tx("Sin etapas todavía. Divide el encargo en pasos concretos para poder medir su avance.")}</p>`
    : steps.map(s => `
      <div class="step-row ${s.done ? "done" : ""}">
        <button class="step-check" onclick="toggleStep('${pr.id}','${s.id}')" aria-label="${s.done ? "Reabrir" : "Completar"} etapa" style="${tonos("pc", col)}">
          ${s.done ? `<svg viewBox="0 0 24 24"><path d="M5 12.5l5 5L19 7"/></svg>` : ""}
        </button>
        <span class="step-name" onclick="toggleStep('${pr.id}','${s.id}')">${escapeHtml(s.name)}</span>
        <button class="step-del" onclick="removeStep('${pr.id}','${s.id}')" aria-label="Eliminar etapa">✕</button>
      </div>`).join("");

  const closed = pr.status === "done" || pr.status === "dropped";
  const actions = closed
    ? `<button class="btn btn-soft btn-block" onclick="setProjectStatus('${pr.id}','active')">${tx("Retomar encargo")}</button>`
    : `
      <div class="stack">
        ${prog === 100 || pr.status === "active"
          ? `<button class="btn ${prog === 100 ? "btn-primary" : "btn-soft"} btn-block" onclick="setProjectStatus('${pr.id}','done')">${tx("Dar por terminado")}</button>` : ""}
        ${pr.status === "active"
          ? `<button class="btn btn-ghost btn-block" onclick="setProjectStatus('${pr.id}','paused')">${tx("Pausar por ahora")}</button>`
          : `<button class="btn btn-soft btn-block" onclick="setProjectStatus('${pr.id}','active')">${tx("Retomar")}</button>`}
        <button class="btn btn-danger-ghost btn-block" onclick="setProjectStatus('${pr.id}','dropped')">${tx("Descartar encargo")}</button>
      </div>`;

  const historyHtml = (pr.history || []).length === 0
    ? `<p class="settings-note" style="margin:0">${tx("Sin movimientos todavía.")}</p>`
    : pr.history.slice(0, 25).map(e => `
      <div class="history-item">
        <div class="note">${escapeHtml(e.event)}<span class="when">${formatWhen(e)}</span></div>
      </div>`).join("");

  const heroHtml = `
    <div class="detail-hero">
      <div class="strip">${motifScene(560, 156, hashSeed(pr.id), motifFor(pr.icon), trazo(col))}</div>
      <div class="skill-emoji" style="background:${velo(col, "30")};color:${tinta(col)}">${icon(pr.icon, 28)}</div>
      <h2>${escapeHtml(pr.name)}</h2>
      <span class="cat">Rama de Proyectos · ${escapeHtml(pr.branch || "General")}</span>
      ${pr.desc ? `<div class="perk-desc">${escapeHtml(pr.desc)}</div>` : ""}
      ${skill ? `<div style="margin-top:12px"><button class="xlink" style="--xc:${pinta(skill.color)}" onclick="openDetail('${skill.id}')">
        ${icon(skill.icon, 13)} Entrena ${escapeHtml(skill.name)} →
      </button></div>` : ""}
      <div class="ring-wrap" style="margin-top:16px">
        ${animRing(150, 12, prog / 100, trazo(col), 0, "var(--carril)")}
        <div class="ring-center">
          <div class="v"><b>${prog}%</b></div>
          <div class="k">${steps.filter(s => s.done).length} de ${steps.length} etapas</div>
        </div>
      </div>
    </div>`;

  /* ---- De que va despues ----
     Solo aparece cuando el encargo tiene requisitos. Sin ellos, un panel
     vacio explicando una funcion que no se esta usando seria ruido en la
     ficha de todo el mundo — y a los mapas se entra por gusto.

     El interruptor vive AQUI y no en cada flecha (Eduardo, 27 ago 2026): una
     flecha siempre dice "esto va despues de aquello", y esto dice si ademas
     hay que esperar a que termine. */
  const antes = requisitosVivos(pr);
  const faltan = antes.filter(r => r.status !== "done");
  const ordenHtml = !antes.length ? "" : `
    <div class="panel alt">
      <h3>${tx("Va después de")}</h3>
      ${antes.map(r => `
        <button class="att-item" onclick="openProject('${r.id}')">
          <span class="dot" style="background:${velo(r.color || "#5fe0b0", "22")};color:${tinta(r.color || "#5fe0b0")}">${icon(r.icon, 17)}</span>
          <span class="tx"><b>${escapeHtml(r.name)}</b><span>${
            r.status === "done" ? "Terminado" : `${projectProgress(r)}% hecho`}</span></span>
          <span class="go">→</span>
        </button>`).join("")}
      ${antes.length > 1 ? `<p class="settings-note">${
        modoDe(pr) === "cualquiera"
          ? tx("Basta con que termine cualquiera de ellos.")
          : tx("Hacen falta todos.")} ${tx("Se cambia en el mapa, con el círculo <b>Y/O</b>.")}</p>` : ""}
      <p class="settings-note">${
        pr.espera
          ? (faltan.length
              ? tx("Este encargo <b>espera su turno</b>: no lo puedes avanzar hasta que termine lo de arriba.")
              : tx("Este encargo esperaba su turno, y ya le toca."))
          : tx("Este encargo <b>solo va después</b>: la app deja de sugerírtelo hasta que toque, pero puedes adelantarlo cuando quieras.")}</p>
      <button class="btn ${pr.espera ? "btn-ghost" : "btn-linea"} btn-block" onclick="alternarEspera('${pr.id}')">${
        pr.espera ? tx("Dejar que lo adelante") : tx("Que espere su turno")}</button>
    </div>
`;

  const panelesHtml = ordenHtml + `
    <div class="panel alt" style="border-color:${h.key === "stalled" ? "rgba(255,138,112,0.45)" : "var(--borde-panel)"}">
      <h3 style="color:${h.color}">${tx(h.label)}</h3>
      <p class="settings-note" style="margin:0">${escapeHtml(h.note)}</p>
    </div>

    <div class="panel">
      <h3>${tx("Etapas")}</h3>
      ${stepsHtml}
      <div class="step-add">
        <input type="text" id="detail-new-step" placeholder="${escapeAttr(tx("Nueva etapa…"))}" maxlength="70" onkeydown="if(event.key==='Enter'){event.preventDefault();addStepTo('${pr.id}');}">
        <button class="btn btn-soft btn-sm" onclick="addStepTo('${pr.id}')">${tx("Añadir")}</button>
      </div>
    </div>

    <div class="panel alt">
      <h3>${tx("Ficha")}</h3>
      <div class="fact-grid">
        <div class="fact"><div class="k">${tx("CREADO")}</div><div class="v" style="font-size:13.5px">${formatDate(pr.createdAt)}</div></div>
        <div class="fact"><div class="k">${tx("ÚLTIMO AVANCE")}</div><div class="v" style="font-size:13.5px">${daysIdle(pr) === 0 ? "Hoy" : `Hace ${daysIdle(pr)} d`}</div></div>
        <div class="fact"><div class="k">${tx("ENTRENA")}</div><div class="v" style="font-size:13.5px">${skill ? escapeHtml(skill.name) : "—"}</div></div>
        <div class="fact"><div class="k">${tx("RECOMPENSA")}</div><div class="v" style="font-size:13.5px">${skill ? "+" + pr.xpReward + " XP" : "—"}</div></div>
      </div>
    </div>`;

  const movimientosHtml = `
    <div class="panel" style="margin-top:14px">
      <h3>${tx("Movimientos")}</h3>
      ${historyHtml}
    </div>`;

  /* En escritorio son dos columnas de verdad, cada una con su propia altura.
     Antes era una sola rejilla y las filas se compartían: los botones de
     cerrar el encargo caían en la fila que sobraba a la izquierda, y esa
     fila empezaba donde acabara la columna de la derecha. Un encargo con
     muchas etapas los empujaba media pantalla hacia abajo, lejos de la
     ficha a la que pertenecen. Repartir el contenido en dos contenedores
     los deja pegados al encargo pase lo que pase al lado.

     En móvil no hay columnas y el orden es el de siempre: primero cómo va,
     luego las etapas y la ficha, después las decisiones y al final el
     historial. Las decisiones no se adelantan: descartar algo no es lo
     primero que se ofrece al abrirlo. */
  document.getElementById("project-content").innerHTML = isDesktop()
    ? `<div class="detail-side">${heroHtml}${actions}</div>
       <div class="detail-main">${panelesHtml}${movimientosHtml}</div>`
    : heroHtml + panelesHtml + actions + movimientosHtml;
  playRings(document.getElementById("project-content"));
}

/* ================= Render: detalle habilidad ================= */

function openDetail(id) {
  if (currentSkillId !== id) lastDetailPct = 0;
  currentSkillId = id;
  /* La moderada, que es la de en medio. Estaba escrito 25 a mano, un valor
     que dejó de existir al cambiar la curva: no encendía ningún botón y
     "Registrar" acababa dando +10 por el respaldo de practicaDe(). */
  selectedQuickXp = PRACTICAS[1].xp;
  renderDetail();
  showView("detail");
}

function renderDetail() {
  const s = state.skills.find(x => x.id === currentSkillId);
  if (!s) { showView("home"); return; }
  const li = levelInfo(s.xp);
  const untilDecay = daysUntilDecay(s);

  /* El orden importa: una habilidad en cero no tiene gracia ni decaimiento
     que contar, así que ese caso se resuelve antes que ninguno. */
  let decayLine = "";
  if (s.xp <= 0) {
    const espera = diasSinGanar(s);
    decayLine = espera >= DIAS_PARA_INVITAR
      ? `<div class="xp-note">${tx("Sin estrenar.")} <span class="invita">${invitacionPara(s)}</span></div>`
      : `<div class="xp-note">${tx("Sin estrenar todavía: nada que perder hasta que registres tu primera práctica.")}</div>`;
  } else if (s.permanent) {
    const espera = diasSinGanar(s);
    decayLine = `<div class="xp-note">${tx("Habilidad blindada: nunca pierde XP.")}${
      espera >= DIAS_PARA_INVITAR ? ` <span class="invita">${invitacionPara(s)}</span>` : ""}</div>`;
  } else if (isDecaying(s)) {
    decayLine = `<div class="xp-note" style="color:var(--fire)">${
      T`<b>En decaimiento:</b> pierdes ${s.decayPerDay} XP al día. Practica hoy para frenarlo.`}</div>`;
  } else {
    decayLine = `<div class="xp-note">${untilDecay === 1
      ? T`Te queda <b>${untilDecay}</b> día de gracia antes de empezar a perder XP.`
      : T`Te quedan <b>${untilDecay}</b> días de gracia antes de empezar a perder XP.`}</div>`;
  }

  const pct = li.level >= MAX_LEVEL ? 1 : li.pct / 100;
  const ringHtml = `
    <div class="ring-wrap" id="lvl-ring">
      ${animRing(150, 12, pct, trazo(s.color), lastDetailPct, "var(--carril)")}
      <div class="ring-center">
        <div class="v"><b>Nv ${li.level}</b></div>
        <div class="k">${li.level >= MAX_LEVEL ? "Nivel máximo" : li.inLevel + " / " + li.needed + " XP"}</div>
      </div>
    </div>`;

  const historyHtml = s.log.length === 0
    ? `<p class="settings-note" style="margin:0">${tx("Todavía no hay actividad registrada.")}</p>`
    : s.log.slice(0, 30).map((e, i) => {
        /* Cada movimiento dice de dónde salió: qué tipo de práctica fue y
           cuánto duró si lo registraste a mano, o qué misión, talento o
           proyecto lo trajo si vino de otro sitio. Un "+25 XP" suelto no
           permite revisar nada. */
        const horas = e.min ? (e.min >= 60 ? `${Math.round(e.min / 60 * 10) / 10} h` : `${e.min} min`) : null;
        const sello = e.nivel ? `<span class="tag">${escapeHtml(e.nivel)}${horas ? ` · ${horas}` : ""}</span>` : "";
        const origen = e.fuente ? `<span class="tag src">${escapeHtml(e.fuente)}</span>` : "";
        const marcado = histSel.has(String(i));
        return `
      <div class="history-item ${histSelMode ? "selectable" : ""} ${marcado ? "picked" : ""}"
        ${histSelMode ? `onclick="marcarHist(${i})"` : ""}>
        ${histSelMode ? `<span class="hcheck">${marcado ? icon("check", 12) : ""}</span>` : ""}
        <div class="note">
          ${escapeHtml(e.note || "Práctica")}${sello}${origen}
          <span class="when">${formatWhen(e)}</span>
        </div>
        <div class="gain ${e.xp < 0 ? "loss" : ""}">${e.xp > 0 ? "+" : ""}${e.xp} XP</div>
      </div>`;
      }).join("") + (histSelMode ? `
      <div class="stack" style="margin-top:14px">
        <button class="btn btn-danger-ghost btn-block" onclick="borrarHistSeleccion()">Quitar lo marcado (${histSel.size})</button>
        <button class="btn btn-ghost btn-block" onclick="toggleHistSel()">${tx("Cancelar")}</button>
      </div>` : "");

  const content = document.getElementById("detail-content");
  content.innerHTML = `
    <div class="detail-hero">
      <div class="strip">${motifScene(560, 156, hashSeed(s.id), motifFor(s.icon), trazo(s.color))}</div>
      <button type="button" class="skill-emoji editable" style="background:${velo(s.color, "30")};color:${tinta(s.color)}"
        onclick="openSkillForm(currentSkillId)" title="${escapeAttr(tx("Editar habilidad"))}" aria-label="${escapeAttr(tx("Editar habilidad"))}">
        ${icon(s.icon, 28)}
        <span class="edit-hint">${icon("pen", 11)}</span>
      </button>
      <h2>${escapeHtml(s.name)}</h2>
      <span class="cat">${escapeHtml(s.category || "Sin categoría")}</span>
      ${ringHtml}
      ${decayLine}
    </div>

    <div class="panel alt">
      <h3>${tx("Registrar práctica")}</h3>
      <div class="quick-xp" id="quick-xp">
        ${PRACTICAS.map(o => `
          <button data-xp="${o.xp}" class="${o.xp === selectedQuickXp ? "selected" : ""}" onclick="selectQuickXp(${o.xp})">
            <span class="xp">+${o.xp}</span><span class="t">${o.etiqueta}</span>
          </button>`).join("")}
      </div>
      ${(() => {
        const usado = minutosHoy(s);
        const resto = TOPE_MIN_DIA - usado;
        if (resto <= 0) return `<p class="settings-note" style="margin:0 0 10px;color:var(--coral)">${tx("Registro cerrado por hoy: ya sumaste medio día de práctica en esta habilidad.")}</p>`;
        if (usado > 0) return `<p class="settings-note" style="margin:0 0 10px">Hoy llevas ${Math.round(usado / 60 * 10) / 10} h registradas · te quedan ${Math.round(resto / 60 * 10) / 10} h.</p>`;
        return "";
      })()}
      <label class="field">
        <span>${tx("Nota (opcional)")}</span>
        <input type="text" id="log-note" placeholder="${escapeAttr(tx("¿Qué hiciste? Ej. Terminé módulo 2 del curso"))}" maxlength="120">
      </label>
      <button class="btn btn-primary btn-block" onclick="logActivity()">${tx("Registrar y ganar XP")}</button>
    </div>

    ${linkedToSkill(s)}

    <div class="panel">
      <div class="panel-head">
        <h3 style="margin:0">${tx("Historial")}</h3>
        ${s.log.length ? `<button class="icon-btn sm ${histSelMode ? "on" : ""}" onclick="toggleHistSel()" aria-label="${escapeAttr(tx("Seleccionar movimientos para quitar"))}" title="Quitar movimientos">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${BM_ICONS.bote}</svg>
        </button>` : ""}
      </div>
      ${histSelMode ? `<p class="settings-note">${tx("Marca los movimientos que quieras quitar. Se devolverá su XP.")}</p>` : ""}
      ${historyHtml}
    </div>`;
  playRings(content);
  lastDetailPct = pct;
}

/* Todo lo que alimenta esta habilidad, en un solo lugar: las misiones que la
   entrenan a diario, los talentos que la desbloquean y los proyectos que la usan. */
function linkedToSkill(s) {
  const ms = state.missions.filter(m => m.skillId === s.id);
  const pk = state.perks.filter(p => p.skillId === s.id);
  const pr = state.projects.filter(p => p.skillId === s.id);
  if (!ms.length && !pk.length && !pr.length) {
    return `
    <div class="panel alt">
      <h3>${tx("Qué alimenta esta habilidad")}</h3>
      <p class="settings-note" style="margin:0 0 12px">${tx("Nada apunta aquí todavía. Cuando vincules una misión, un talento o un encargo a")} <b>${escapeHtml(s.name)}</b>${tx(", aparecerán en esta lista y su XP subirá sola.")}</p>
      <div class="stack">
        <button class="btn btn-soft btn-block" onclick="openMissionForm()">${tx("Crear una misión diaria")}</button>
        <button class="btn btn-ghost btn-block" onclick="openPerkForm()">${tx("Crear un talento")}</button>
      </div>
    </div>`;
  }

  const group = (one, many, iconName, rows) => rows.length ? `
    <div class="linked-group">
      <div class="linked-title">${icon(iconName, 15)}<span><b>${rows.length}</b> ${rows.length === 1 ? one : many}</span></div>
      ${rows.join("")}
    </div>` : "";

  const key = todayKey();
  return `
    <div class="panel alt">
      <h3>${tx("Qué alimenta esta habilidad")}</h3>
      ${group("misión diaria", "misiones diarias", "target", ms.map(m => {
        const c = missionCount(m, key), t = missionTarget(m), ok = c >= t;
        const st = missionStreak(m);
        return `<button class="linked-row" style="--lc:${pinta(m.color)}" onclick="showView('missions')">
          <span class="lr-ic">${icon(m.icon, 16)}</span>
          <span class="lr-tx"><b>${escapeHtml(m.name)}</b><span>+${m.xp} XP · ${ok ? "cumplida hoy" : `${c} de ${t} hoy`}${st > 1 ? ` · racha ${st}` : ""}</span></span>
          <span class="lr-go">→</span>
        </button>`;
      }))}
      ${group("talento", "talentos", "gem", pk.map(p => {
        const stt = perkStatus(p);
        return `<button class="linked-row" style="--lc:${pinta(p.color)}" onclick="openPerk('${p.id}')">
          <span class="lr-ic">${icon(p.icon, 16)}</span>
          <span class="lr-tx"><b>${escapeHtml(p.name)}</b><span>${STATUS_LABEL[stt]} · +${p.xpReward} XP al lograrlo</span></span>
          <span class="lr-go">→</span>
        </button>`;
      }))}
      ${group("encargo", "encargos", "flag", pr.map(p => `
        <button class="linked-row" style="--lc:${pinta(p.color)}" onclick="openProject('${p.id}')">
          <span class="lr-ic">${icon(p.icon, 16)}</span>
          <span class="lr-tx"><b>${escapeHtml(p.name)}</b><span>${projectProgress(p)}% · ${tx(PROJECT_STATUS[p.status].label)}</span></span>
          <span class="lr-go">→</span>
        </button>`))}
    </div>`;
}

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h) % 1000 + 20;
}

/* Marca el botón por su propio valor, no por una posición escrita a mano.
   La versión anterior traducía XP a índice con un mapa fijo {10:0, 25:1,
   60:2} heredado de la curva vieja; al pasar PRACTICAS a 10/40/85 los dos
   botones grandes caían fuera del mapa, el índice salía undefined y la
   línea reventaba después de haber quitado ya la marca a todos: ninguno se
   encendía. Leyendo el valor del propio botón, PRACTICAS puede cambiar las
   veces que haga falta sin que esto vuelva a desincronizarse. */
function selectQuickXp(xp) {
  selectedQuickXp = xp;
  document.querySelectorAll("#quick-xp button").forEach(b =>
    b.classList.toggle("selected", Number(b.dataset.xp) === xp));
}

/* Suma XP respetando el tope del nivel máximo. Devuelve el XP realmente añadido. */
/* Los tres botones de registro manual.
   Antes daban +10 por 15 min, +25 por una hora y +60 por dos: 40, 25 y 30
   XP por hora. Premiaban PEOR la sesión larga que la corta, justo al revés
   de lo que debe incentivar una app de hábitos. Ahora la tarifa es constante
   (40 XP/hora) con un extra pequeño por sostener el esfuerzo. */
const PRACTICAS = [
  { xp: 10, min: 15,  etiqueta: "~15 min", nivel: "suave" },
  { xp: 40, min: 60,  etiqueta: "~1 hora", nivel: "moderada" },
  { xp: 85, min: 120, etiqueta: "2 h +",   nivel: "intensiva" }
];

/* Medio día. Nadie dedica doce horas a una sola habilidad, así que por
   encima de esto lo que hay no es práctica sino registro inflado. */
const TOPE_MIN_DIA = 720;

function practicaDe(xp) { return PRACTICAS.find(p => p.xp === xp) || PRACTICAS[0]; }

/* Aviso de descanso, no de abuso: son cosas distintas y deben sonar
   distinto. Ocho horas seguidas en una sola habilidad es dedicación, no
   trampa, así que ni bloquea ni castiga — solo lo dice una vez al día y con
   el borde neutro del cuadro, no el rojo del castigo. */
const MIN_DESCANSO = 480;

function minutosHoy(s) {
  const hoy = todayKey();
  return (s.log || []).reduce((a, e) => a + ((e.date === hoy && e.min) ? e.min : 0), 0);
}

/* El tope por habilidad evita inflar una; este evita inflar el día entero
   repartiendo entre varias. Doce horas es el techo en ambos casos. */
function minutosHoyGlobal() {
  return state.skills.reduce((a, s) => a + minutosHoy(s), 0);
}

function avisoDescanso(msg) {
  const card = document.querySelector("#modal .modal-card");
  if (card) card.classList.add("suave");
  return askBase(msg, false, "Sigo un rato", false, false, "Lo dejo por hoy")
    .then(v => { if (card) card.classList.remove("suave"); return v; });
}

function addXp(s, amount, note, fuente, extra) {
  const cap = totalXpForLevel(MAX_LEVEL);
  const real = Math.max(0, Math.min(amount, cap - s.xp));
  s.xp += real;
  s.lastActivity = todayKey();
  s.log.unshift(Object.assign({ date: todayKey(), at: stamp(), xp: real, note, fuente: fuente || null }, extra || {}));
  return real;
}

/* Contraparte de addXp() para cuando se revierte algo que ya había dado XP
   (p. ej. desmarcar una misión). No toca `lastActivity`: corregir un error
   de captura no es una sesión de práctica nueva, y no debe alimentar la
   racha ni el registro de actividad del día. */
function removeXp(s, amount, note, fuente) {
  const real = Math.max(0, Math.min(amount, s.xp));
  s.xp -= real;
  s.log.unshift({ date: todayKey(), at: stamp(), xp: -real, note, fuente: fuente || null });
  return real;
}

/* ---- Registro abusivo ----
   Pasarse del medio día no es "usar mucho la app": es inflar el número que
   la app existe para medir. Se avisa, se cierra el registro por hoy, y solo
   si se repite al día siguiente hay castigo — un error de un día no debería
   costar nada. */
function diasDeAbuso() {
  state.ui = state.ui || {};
  return state.ui.abusoDias || (state.ui.abusoDias = []);
}

function penalizarPorAbuso() {
  let tocadas = 0;
  state.skills.forEach(s => {
    const nv = levelInfo(s.xp).level;
    if (nv <= 0) return;                       // nunca por debajo de cero
    const suelo = totalXpForLevel(nv - 1);
    const perdido = s.xp - suelo;
    if (perdido <= 0) return;
    s.xp = suelo;
    s.log.unshift({ date: todayKey(), at: stamp(), xp: -perdido, note: "Nivel retirado por registro abusivo", fuente: "Sistema" });
    tocadas++;
  });
  return tocadas;
}

async function marcarAbuso(s, esGlobal) {
  const hoy = todayKey();
  const dias = diasDeAbuso();
  const repetido = dias.includes(addDaysKey(hoy, -1));
  if (!dias.includes(hoy)) dias.push(hoy);
  state.ui.abusoDias = dias.slice(-6);

  if (repetido) {
    const n = penalizarPorAbuso();
    save();
    renderDetail();
    await ask(
      `Es el segundo día seguido registrando más de medio día de práctica en una sola habilidad.\n\n` +
      `El sistema de habilidades solo sirve si refleja algo real, así que se retira un nivel completo en ${n === 1 ? "la habilidad que tenía" : `las ${n} habilidades que tenían`} nivel para recuperar.\n\n` +
      `Ninguna baja de cero. Mañana puedes volver a registrar con normalidad.`,
      "Entendido", true);
    return;
  }

  save();
  renderDetail();
  await ask(
    (esGlobal
      ? `Ya registraste medio día de práctica sumando todas tus habilidades.\n\nRepartirlo entre varias no cambia que el día tiene las horas que tiene, así que el registro manual queda cerrado por hoy.`
      : `Ya registraste el equivalente a medio día de práctica en ${s.name}.\n\nPor encima de ahí el número deja de significar lo que hiciste, así que el registro manual queda cerrado por hoy en esta habilidad.`) +
    `\n\nSi mañana vuelve a pasar, se retirará un nivel completo en todas tus habilidades.`,
    "Entendido");
}

async function logActivity() {
  const s = state.skills.find(x => x.id === currentSkillId);
  if (!s) return;
  const p = practicaDe(selectedQuickXp);
  const yaHoy = minutosHoy(s);
  const yaGlobal = minutosHoyGlobal();

  if (yaHoy + p.min > TOPE_MIN_DIA) { await marcarAbuso(s); return; }
  if (yaGlobal + p.min > TOPE_MIN_DIA) { await marcarAbuso(s, true); return; }

  /* Cruzar las ocho horas en una sola habilidad: se avisa una vez al día y
     se puede seguir. Descansar también forma parte de sostener un hábito. */
  state.ui = state.ui || {};
  if (yaHoy < MIN_DESCANSO && yaHoy + p.min >= MIN_DESCANSO && state.ui.descansoAvisado !== todayKey()) {
    state.ui.descansoAvisado = todayKey();
    save();
    const sigue = await avisoDescanso(
      `Llevas ocho horas dedicadas a ${s.name} hoy.\n\n` +
      `Es un montón, y está muy bien. Solo un recordatorio: descansar no es tiempo perdido, es parte de que esto se sostenga mañana y pasado.\n\n` +
      `Si quieres seguir un rato más, adelante.`);
    if (!sigue) return;
  }

  const before = levelInfo(s.xp).level;
  const note = document.getElementById("log-note").value.trim();
  // El sello del historial ya dice el tipo y la duración: repetirlo en la
  // nota dejaba "Práctica moderada · práctica moderada · 1 h".
  const real = addXp(s, p.xp, note || "Práctica", null, { min: p.min, nivel: p.nivel });
  save();
  checkStreakMilestone();
  /* Y el nivel de cuenta, que sube de las mismas cosas. Va junto a la racha
     porque son la misma pregunta —«¿esto que acabo de hacer merece fiesta?»—
     y separarlas garantizaba que una de las dos se olvidara en el siguiente
     sitio que registre algo. */
  revisarNivelExpedicion();
  const after = levelInfo(s.xp).level;
  renderDetail();
  if (real === 0) {
    toast(`Nivel máximo: práctica registrada, decaimiento frenado`, "logro");
  } else if (after > before) {
    celebrate(`Nivel ${after}`, `${s.name} sube de nivel`, s.color, s.icon);
  } else {
    toast(`+${real} XP · práctica ${p.nivel}`, "logro");
  }
}

/* Deshacer movimientos concretos, no "los últimos cinco".
   Borrar un bloque entero se llevaba por delante ganancias legítimas que
   estaban entre medias del error; aquí se marca exactamente lo que sobra. */
let histSelMode = false;
let histSel = new Set();

function toggleHistSel() {
  histSelMode = !histSelMode;
  histSel.clear();
  renderDetail();
}

function marcarHist(i) {
  const k = String(i);
  if (histSel.has(k)) histSel.delete(k); else histSel.add(k);
  renderDetail();
}

async function borrarHistSeleccion() {
  const s = state.skills.find(x => x.id === currentSkillId);
  if (!s) return;
  const idx = [...histSel].map(Number).sort((a, b) => a - b);
  if (!idx.length) { toast("No hay nada marcado", "atencion"); return; }
  const neto = idx.reduce((a, i) => a + ((s.log[i] && s.log[i].xp) || 0), 0);
  if (!await ask(
    `Se quitarán ${idx.length} movimiento${idx.length === 1 ? "" : "s"} de ${s.name}` +
    (neto !== 0 ? `, y con ${idx.length === 1 ? "él" : "ellos"} se ${neto > 0 ? "restarán" : "devolverán"} ${Math.abs(neto)} XP.` : ".") +
    `\n\nEsto no se puede deshacer.`, "Quitar", true)) return;
  const fuera = new Set(idx);
  s.log = s.log.filter((_, i) => !fuera.has(i));
  s.xp = Math.max(0, s.xp - neto);
  histSelMode = false;
  histSel.clear();
  save();
  renderDetail();
  toast(`${idx.length} movimiento${idx.length === 1 ? "" : "s"} quitado${idx.length === 1 ? "" : "s"}`);
}

/* ================= Render: árbol ================= */

function renderTree() {
  const el = document.getElementById("tree-content");
  const perks = state.perks;
  const ramasT = ramasDe("perks");

  // Una rama recién creada, aunque esté vacía, ya es algo que enseñar
  if (perks.length === 0 && ramasT.length === 0) {
    /* Antes de la salida rápida, no después: `renderFullscreen()` vive al
       final de esta función, así que borrar la última rama estando a pantalla
       completa dejaba la capa encima mostrando una rama que ya no existía.
       Se salía con Escape, pero lo que se veía era mentira. */
    renderFullscreen("talentos");
    el.innerHTML = `
      <div class="empty">
        <div class="bubble">${icon("map", 34)}</div>
        <h2>${tx("Tu mapa está por trazarse")}</h2>
        <p>${tx("Un talento es una meta con inversión real: un curso, un equipo, una certificación. Al pagarla arranca un plan con fecha límite — si logras la meta, el talento es tuyo para siempre.")}</p>
        <!-- El botón va dentro de un "stack" aunque sea uno solo, como en las
             otras cuatro pantallas vacías. No es orden por el orden: el CSS le
             reserva a esa caja el alto del cartel más alto para que la burbuja y
             el título caigan a la misma altura en las cinco, y suelto se quedaba
             fuera de esa cuenta. -->
        <div class="stack" style="align-items:center">
          <button class="btn btn-primary" onclick="openPerkForm()">${tx("Crear mi primer talento")}</button>
        </div>
      </div>`;
    return;
  }

  const invested = perks.reduce((a, p) => a + (p.investedTotal || 0), 0);
  const completed = perks.filter(p => p.status === "completed").length;
  const inProgress = perks.filter(p => perkStatus(p) === "active");
  const dueNow = perks.filter(p => perkStatus(p) === "due");
  const readyNow = perks.filter(p => perkStatus(p) === "available");
  const activeN = inProgress.length + dueNow.length;
  const total = perks.length;

  // Lo que más urge: un plan vencido, el próximo a vencer, o algo listo para abrir
  const soonest = [...inProgress].sort((a, b) =>
    daysBetween(todayKey(), a.endDate) - daysBetween(todayKey(), b.endDate))[0];
  const avgProgress = inProgress.length
    ? Math.round(inProgress.reduce((a, p) => a + perkProgress(p), 0) / inProgress.length) : 0;

  let focus;
  if (dueNow.length) {
    focus = { k: "Plan vencido", v: dueNow[0].name, color: "var(--fire)", id: dueNow[0].id };
  } else if (soonest) {
    const left = daysBetween(todayKey(), soonest.endDate);
    focus = { k: `Vence en ${left} día${left === 1 ? "" : "s"}`, v: soonest.name, color: "var(--fire)", id: soonest.id };
  } else if (readyNow.length) {
    focus = { k: "Listo para empezar", v: readyNow[0].name, color: "var(--mint)", id: readyNow[0].id };
  } else {
    focus = { k: "Sin planes en curso", v: "Abre un talento cuando quieras", color: "var(--muted)", id: null };
  }

  const branches = ramasT;

  let html = sectionHero({
    scene: topoScene(820, 168, 31),
    /* Aquí ponía «Invertido en ti» y el total gastado, en la cifra más grande
       de la pantalla. Lo cambió Eduardo, y el motivo es de marca antes que de
       diseño: **una persona vale por lo que es, no por lo que gastó.** Que el
       dinero fuera lo primero que se ve al entrar en Talentos decía justo lo
       contrario de por qué existe el módulo.

       Lo que encabeza ahora es lo que ya conseguiste y no se puede perder: un
       talento completado no decae nunca. El dinero no desaparece —sigue en la
       fila de abajo, en el informe y en el Resumen—, pero deja de presidir. */
    lead: `<div>
      <div class="label">${tx("Ya son tuyos")}</div>
      <div class="big"><b>${completed}</b><span> ${completed === 1 ? "talento" : "talentos"}</span></div>
    </div>`,
    /* «Por abrir» era un inventario que no pide nada: dejó sitio al dinero de
       la semana y a lo que se vence, que sí. */
    stats: statsPanelTalentos({ activeN }),
    informe: "talentos",
    focus: Object.assign(focus, {
      onclick: focus.id ? `openPerk('${focus.id}')` : null,
      pct: inProgress.length ? avgProgress : undefined
    })
  }) + `<div class="sec-label">${tx("Tus ramas de talentos")}</div>`;

  branches.forEach((b, bi) => {
    // Lo que se dibuja: talentos sueltos y cajas cerradas. La cuenta de la
    // cabecera, en cambio, sigue siendo de talentos de verdad — una caja no
    // es un talento y contarla como uno mentiría sobre el tamaño de la rama.
    const nodes = branchNodes(b);
    const reales = talentosDeRama(b);
    const collapsed = isCollapsed(b);
    const editing = editandoRama(b, "talentos");
    const doneN = reales.filter(n => n.status === "completed").length;
    const ba = escapeAttr(b);
    /* Dos escapes para el mismo nombre, y no es redundancia: `ba` va en
       atributos normales y `bj` dentro de las comillas simples de un
       `onclick`. Ver `enJS` — con uno solo, una rama con apóstrofo dejaba
       muertos todos los botones de su tarjeta. */
    const bj = enJS(b);

    let body;
    if (!nodes.length) {
      /* Una rama vacía no se dibuja como un lienzo en blanco —parecería rota—
         sino como lo que es: un sitio esperando su primer talento. */
      body = `<p class="col-vacia">${tx("Todavía no hay talentos en esta rama. Créale el primero con el ＋.")}</p>`;
    } else if (collapsed) {
      body = `
      <div class="branch-collapsed">
        <span class="pips">${nodes.slice(0, 12).map(n => {
          const st = perkStatus(n);
          const c = pinta(st === "completed" ? (n.color || "#5fe0b0") : (st === "active" || st === "due" ? "var(--fire)" : "var(--pip)"));
          return `<i style="background:${c}${tipoDe(n) === "hito" ? ";border-radius:999px" : ""}"></i>`;
        }).join("")}${nodes.length > 12 ? `<span style="font-size:11px">+${nodes.length - 12}</span>` : ""}</span>
        <span>${nodes.length} talento${nodes.length === 1 ? "" : "s"}</span>
      </div>`;
    } else {
      body = `
      <div class="const-wrap ${editing ? "editing" : ""}" data-branch="${ba}">${constellation(nodes, bi, editing, b)}</div>
      <button class="fs-open" onclick="openBranchFullscreen('${bj}')">
        <svg viewBox="0 0 24 24">${BM_ICONS.expandir}</svg> Ver la rama completa
      </button>
      ${/* Una sola línea, y que diga lo que la mano puede hacer AHORA. Fuera
            de edición el gesto es el que hay que aprender; dentro, las
            herramientas. */
        editing
        ? `<div class="const-hint edit">${
            T`Arrastra para acomodar · <b>Shift</b> y clic (o Shift y arrastra un recuadro) elige varios para moverlos juntos o agruparlos · tira del punto ▸ hacia otro nodo para conectarlos · toca una línea para cortarla · el círculo <b>Y/O</b> cambia si hacen falta todos los requisitos o basta uno`
          }${atajosLegend()}</div>`
        : `<div class="const-hint">${
            T`Toca un nodo para abrirlo · arrástralo para acomodarlo · el círculo <b>Y/O</b> cambia si hacen falta todos sus requisitos o basta uno`
          }${atajosLegend(true)}</div>`}`;
    }

    /* `data-cota` es la cifra de la cota de Blueprint, y lleva LO MISMO que la
       pastilla de la cuenta a propósito: la cota no añade un dato, se queda con
       el que ya había. Repetir la misma cifra dos veces en la misma tarjeta la
       abarata, así que el mundo que enciende la cota esconde la pastilla
       (`css/mundos.css`). Inerte para los demás mundos y para la casa.

       Y va aquí fuera y no dentro de la plantilla: este comentario lleva
       backticks, y un backtick dentro de un template literal lo CIERRA. Con él
       dentro, la app entera dejaba de arrancar. */
    html += `
    <div class="branch-card" data-cota="${doneN} de ${reales.length}">
      <div class="branch-head">
        <button class="badd solid" onclick="toggleBranch('${bj}')" aria-label="${collapsed ? "Desplegar" : "Plegar"} ${ba}" style="margin-right:2px">
          <svg viewBox="0 0 24 24"><path d="${collapsed ? "M9 6l6 6-6 6" : "M6 9l6 6 6-6"}"/></svg>
        </button>
        <!-- El nombre abre el renombrado, no el plegado: plegar ya tiene su
             flecha justo al lado, y escribir encima de un título es el gesto
             que todo el mundo prueba primero. -->
        <h3 class="renombrable" onclick="renombrarRama('${bj}')" title="${escapeAttr(tx("Toca el nombre para renombrar la rama"))}">${escapeHtml(b)}${icon("pen", 11)}</h3>
        <span class="count">${doneN} de ${reales.length}</span>
        <div class="bhead-btns">
          ${editing ? `
          <button class="badd solid on" onclick="toggleEditBranch('${bj}')" aria-label="${escapeAttr(tx("Salir del modo edición"))}" title="Salir de edición${isDesktop() ? " (C)" : ""}">
            <svg viewBox="0 0 24 24"><path d="M5 12.5l5 5L19 7"/></svg>
          </button>` : ""}
          ${branchMenu("t:" + b, [
            /* Fuera del bloque de "no plegada" a propósito: entrar a pantalla
               completa despliega la rama de todos modos, y quien la tiene
               plegada es justo quien no tiene a mano el botón de debajo del
               lienzo. */
            { title: "Ver en pantalla completa", hint: "Recorre la rama con sitio de sobra", icon: "expandir", onclick: `openBranchFullscreen('${bj}')` },
            ...(collapsed ? [] : [
              /* Elegir varios sin teclado: en el teléfono es la única forma
                 de juntar talentos, y en la computadora convive con Shift. */
              { title: modoElegir ? "Salir de elegir" : "Elegir varios talentos",
                hint: modoElegir ? "Vuelve a tocar para abrir fichas" : "Tócalos y agrúpalos o muévelos juntos",
                icon: "caja", onclick: `toggleElegirVarios('${bj}')` },
              /* "Reacomodar solos" queda fuera a propósito hasta pulir cómo
                 decide el orden; la función sigue existiendo, sin puerta. */
              ...(editing ? [] : [{ title: "Centrar en lo que sigue", hint: "Te lleva al talento en curso o al siguiente por abrir", icon: "flecha", onclick: `focusBranchFront('${bj}')` }]),
              editing
                ? { title: "Terminar de editar", hint: "Vuelve al modo normal", icon: "lapiz", onclick: `toggleEditBranch('${bj}')` }
                : { title: "Editar el mapa", hint: "Mueve y conecta los talentos", icon: "lapiz", onclick: `toggleEditBranch('${bj}')` }
            ]),
            /* Una entrada por trimestre cerrable, y ninguna opción de
               cerrarlos todos de golpe: es justo el atajo que un día mueve
               algo que no querías mover (R8). */
            ...trimestresGuardables(b).map(t => ({
              title: `Guardar el ${tituloTrimestre(t.id)}`,
              hint: `${t.n} talento${t.n === 1 ? "" : "s"} al ático`,
              icon: "caja", onclick: `guardarTrimestre('${bj}','${t.id}')`
            })),
            { title: "Borrar esta rama", hint: reales.length === 0 ? "Está vacía" : (reales.length === 1 ? "Se va también su único talento" : `Se van también sus ${reales.length} talentos`), icon: "bote", danger: true, onclick: `deleteBranch('perks','${bj}')` }
          ])}
          ${/* En PC no hay botón de crear: el clic derecho y las teclas
                Q, W y E lo hacen mejor y sin ocupar la cabecera. En táctil
                no existe ninguna de las dos cosas, así que ahí se queda. */
            `<button class="badd" onclick="openPerkForm(null, '${bj}')" aria-label="Añadir talento a ${ba}">＋</button>`}
        </div>
      </div>
      ${body}
    </div>`;
  });
  el.innerHTML = html;
  /* La pantalla completa se pinta DESPUÉS de la lista, a propósito:
     constellation() deja apuntadas en variables globales las posiciones del
     último lienzo dibujado, y las que deben quedar vigentes son las del
     lienzo que el usuario está tocando. */
  renderFullscreen("talentos");
  if (editBranch && !fullscreenBranch) attachEditHandlers();
  /* En escritorio el lienzo de la lista también se arrastra con el botón
     izquierdo: la rama puede ser más ancha que la tarjeta y no hay por qué
     entrar a pantalla completa solo para recorrerla. */
  const cont = document.getElementById("tree-content");
  if (cont) { attachPanHandlers(cont); attachCtxHandlers(cont); encuadrarLienzos(cont); }
  if (focusPending) {
    focusPending = false;
    requestAnimationFrame(() => branches.forEach(b => focusBranchFront(b, true)));
  }
}

