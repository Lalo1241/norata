/* Resumen, tablero, catálogo y el motor de sugerencia */
/* ================= Render: resumen ================= */

/* La madrugada no tiene saludo propio en español, y los dos intentos lo
   demostraron: «trasnochador» le pone género a quien lee —y una «a» detrás no
   lo arregla, lo alarga— y «madrugada» acaba saludando al reloj, que además de
   raro no le habla a nadie.

   Así que a esa hora se usa lo único que siempre es correcto: **su nombre.**
   El apodo si lo puso, y si no el primero de su nombre —eso es `saludoActual`,
   la misma respuesta que usan los correos y el menú de la cuenta—. Sin cuenta
   no hay nombre, y entonces «buenas noches», que a las cuatro de la mañana es
   lo que dice cualquiera en México. */
function greeting() {
  const h = hourNow();
  if (h < 6) {
    const q = typeof saludoActual === "function" ? saludoActual() : "";
    return q ? "Hola, " + q : "Buenas noches";
  }
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

  /* ---- El saludo y la fecha, en la cabecera del Resumen (0.7.57) ----
     Vivían dentro de la tarjeta de la racha, y eran la ÚNICA aparición de
     `greeting()` en toda la app: quien quitaba esa tarjeta del tablero —cosa
     que el Modo Editor permite— se quedaba sin saludo y sin fecha en el
     Resumen entero. La fecha no es un dato de la racha; es de hoy.

     Se escribe ANTES del caso vacío a propósito: un perfil recién creado no
     tiene tablero que pintar, pero sí tiene día, y esa pantalla es justo la
     que más agradece que alguien la salude. */
  const dateTxt = keyToDate(todayKey()).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
  const elSaludo = document.getElementById("resumen-saludo");
  if (elSaludo) elSaludo.textContent = greeting() + " · " + dateTxt;

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
          <!-- Tres botones del mismo peso en la pantalla más vacía es una
               decisión de más, y encima la tercera se salta lo único que aquí
               enseña algo. Sigue estando —hay quien no quiere asistentes— pero
               pesa como lo que es: una salida, no una opción a la par. -->
          <button class="suelto" onclick="openSkillForm()">Empezar de cero</button>
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

       Y desde 0.7.35 la tarjeta **sabe de qué ancho es**, medido en píxeles y
       no en columnas del tablero. Los umbrales viven en el CSS —`@container`
       sobre `.streak-card`— y aquí se escribe todo siempre.

       ---- Y en 0.7.56 el mes pasó a mandar ----
       Hasta la 0.7.47 eran TRES bloques en fila —la marca, el hito, el mes—,
       y ese reparto tenía tres problemas que se veían y ninguno era de color:
       217 px de sangría a la izquierda contra 18 a la derecha, cada bloque
       empezando a una altura distinta, y 166 de los 456 px de la tarjeta
       vacíos. Encima, el tercer bloque solo aparecía pasados los 1150 px, o
       sea que el hito no existía en teléfono, tableta ni laptop.

       Ahora son DOS: el mes a la izquierda y un solo carril a su derecha con
       la marca arriba y el hito debajo. Con dos bloques no hay junta interior
       que repartir —hay un margen igual a los dos lados—, los dos arrancan en
       la misma línea, y el alto de la tarjeta es el que pide el mes. El
       precipicio de 1150 desaparece con el tercer bloque.

       El alto NO se elige: sale del ancho (ver `ALTO_RACHA`). Estirarla hacia
       abajo solo añade cielo vacío, que es justo el problema del que venimos.

       Lo que NO se copia de Duolingo, y es a propósito: ni las cápsulas de
       colores por semana, ni los congeladores, ni las flechas para pasear por
       meses viejos, ni el susto de «te quedan 2 días para recuperar tu racha».
       Un aviso en Norata informa y da la salida; no mete prisa. */
    racha: () => {
      const cuentas = activityDayCounts();
      const hoy = todayKey();
      const anio = Number(hoy.slice(0, 4));
      const mes = Number(hoy.slice(5, 7));

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
          ${/* El nombre de la tarjeta, en el sitio que dejó el saludo. Es el
                mismo que lleva en `DASH_META` y en la bandeja del Modo Editor:
                una cosa, un nombre. Sin él la tarjeta empezaba directamente por
                un número grande y no decía de qué era.

                Y el mes viaja con el título cuando hay dos bloques, porque ahí
                el calendario queda pegado justo debajo y su propio rótulo era
                un segundo letrero del mismo tamaño a doce píxeles del primero:
                dos etiquetas apiladas, no un título y una sección. Apilada no
                puede mudarse —allí el mes está lejos del título y necesita
                decir de cuándo es—, así que se escribe siempre y lo esconde el
                CSS. El año va incluido: un calendario suelto no dice de cuándo
                es, y esta tarjeta va a llevar años abierta. */""}
          <div class="label">Racha<span class="lab-mes"> · ${escapeHtml(MESES[mes - 1])} ${anio}</span></div>
          <div class="streak-grid">
            ${/* El mes va PRIMERO en la rejilla y a la izquierda desde la
                  0.7.56. Se escribe después en el marcado —para que apilada
                  quede debajo de la marca, que es como se lee en el teléfono—
                  y se coloca con `grid-column` en el CSS. */""}
            <div class="sg-izq">
              <div class="streak-row">
                ${/* La llama respira mientras la racha esté viva. Con la
                      racha rota se queda quieta: una llama que late encima de
                      un cero anima algo que no está pasando. */""}
                <span class="flame ic${stk.cur > 0 ? " viva" : ""}"><svg viewBox="0 0 24 24">${ICONS.flame}</svg></span>
                <span class="num">${stk.cur}</span>
                ${/* Sin «mejor: N». La gracia está en la racha que tienes
                      viva, no en una que ya se rompió: al lado del número de
                      hoy, el récord viejo solo puede hacer dos cosas, y las
                      dos sobran — recordarte que ya lo hiciste mejor, o
                      encogerse cuando el de hoy lo supera. */""}
                <span class="lbl">día${stk.cur === 1 ? "" : "s"}<br>de racha</span>
                ${/* Cada cifra con su barra. Es la de Mi expedición
                      —`.barra-viva`, con su punta encendida y su estela— y
                      está aquí porque le gustó a Eduardo y porque estas dos
                      cifras eran justo lo más estático de la tarjeta: dos
                      fracciones que no dicen de un vistazo si vas bien.

                      La semana va en el color de la LLAMA y el mes en el
                      acento: son las dos cosas que ya distinguen esta tarjeta,
                      y así la barra dice de cuál de las dos cifras es sin
                      leer el rótulo. Dentro de una escena los dos tonos
                      vuelven a su cara de noche solos. */""}
                <div class="sg-cifras">
                  <div>
                    <b>${activosSemana}<span>/${diasCorridos}</span></b>
                    <div class="barra-viva sg-barra"><i style="--p:${Math.round(activosSemana / Math.max(1, diasCorridos) * 100)}%;--c:var(--fire)"></i></div>
                    <span>esta semana</span>
                  </div>
                  <div>
                    <b>${activosMes}<span>/${diasMes.length}</span></b>
                    <div class="barra-viva sg-barra"><i style="--p:${Math.round(activosMes / Math.max(1, diasMes.length) * 100)}%;--c:var(--mint)"></i></div>
                    <span>en ${MESES[mes - 1]}</span>
                  </div>
                </div>
              </div>
              <p class="sg-hoy${hoyCuenta ? " si" : ""}">${escapeHtml(frase)}</p>
            </div>
            <div class="sg-der">
              ${calendarioRacha(anio, mes, cuentas, hoy)}
            </div>
            ${/* El hito y qué la sostiene. Se escriben siempre y quien decide
                  qué se ve es el ancho REAL de la tarjeta, desde el CSS.

                  Hasta la 0.7.47 este bloque entero vivía detrás de un umbral
                  de 1150 px, y eso quería decir que «te faltan 2 días para el
                  siguiente hito» —lo único de la tarjeta que mueve a volver
                  hoy— no se veía en teléfono, ni en tableta, ni en laptop.
                  Ahora el hito se ve siempre y lo único que espera a que haya
                  sitio es «qué la sostiene», que son tres filas más. */""}
            <div class="sg-extra">${loQueSostiene(stk.cur)}</div>
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

    /* La expedición: el nivel de la CUENTA, que no es el de ninguna habilidad.
       Va al lado de "Niveles" a propósito —son primos y conviene que se lean
       juntos— pero dicen cosas distintas: aquella suma lo que practicas, esta
       cuenta lo que has recorrido en la app entera.

       Lo que la hace útil no es la cifra, es la última línea: **el próximo
       desbloqueo, con lo que falta escrito**. Un premio sorpresa no mueve a
       nadie; uno que se ve venir, sí. Y los de Pro salen igual, con su
       etiqueta: a la vista y deseables, nunca escondidos.

       Y lleva a «Mi expedición», que es el destino que esta misma nota pedía
       cuando todavía no existía: la tarjeta habla de tu nivel, y la pantalla
       de tu nivel es esa. Antes iba a Ajustes → Mi apariencia por falta de
       sitio mejor, que es un buen atajo para recoger un premio y un mal
       destino para «¿por dónde voy?». */
    expedicion: () => {
      const info = nivelExpedicion();
      const r = rangoExpedicion(info.nivel);
      const prox = proximoDesbloqueo(info.nivel);
      const faltan = prox ? prox.nivel - info.nivel : 0;
      return `
      <button class="sum-card a" onclick="abrirColeccion('summary')" style="width:100%;text-align:left">
        <div class="exp-cab">
          ${insigniaExpedicionHTML(38) || `<span class="ic">${icon("compass", 22)}</span>`}
          <div class="exp-cifra">
            <div class="n">${info.nivel}</div>
            <div class="t">de expedición${r ? " · " + escapeHtml(r.nombre) : ""}</div>
          </div>
        </div>
        <div class="sc-rows">
          <div><b>${info.faltan}</b><span>PUNTOS PARA EL ${info.nivel + 1}</span></div>
        </div>
        ${prox ? `<div class="sc-near">
          <span>${faltan === 1 ? "En el siguiente nivel" : "A " + faltan + " niveles"}${prox.pro ? " · con Pro" : ""}</span>
          <b>${escapeHtml(prox.nombre)}</b>
          <i style="--p:${info.pct}%"></i>
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
      <div class="widget" data-w="${id}" style="--w:${sz.w};--h:${sz.h}${
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
  /* El nivel de la CUENTA. Una fila más alta que sus vecinas porque lleva
     tres cosas y no dos: la cifra con su insignia, los puntos que faltan y
     el próximo desbloqueo. */
  expedicion: { title: "Expedición", w: 1, h: 4 },
  invertido: { title: "Invertido", w: 1, h: 3 },
  proyectos: { title: "Proyectos", w: 1, h: 3 },
  listos:    { title: "Listos para empezar", w: 1, h: 4 }
};
const DASH_DEFAULT = ["racha", "misiones", "atencion", "expedicion", "niveles", "invertido", "proyectos", "listos"];
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
const DASH_MIN_H = { racha: 5, misiones: 3, atencion: 2, expedicion: 3, niveles: 3, invertido: 3, proyectos: 2, listos: 4 };
/* Techo generoso: son 40 filas de la cuadrícula, más de dos pantallas de
   alto. Existe solo para que un tirón desbocado del asa no deje una tarjeta
   de mil filas imposible de volver a encoger. */
const DASH_MAX_H = 40;

/* ================= Acomodos sugeridos =================
   Acomodar el tablero a mano es lento: ocho tarjetas, cada una con su sitio y
   su tamaño, y hasta que no está entero no se sabe si el reparto funciona.
   Estos tres son puntos de partida ya probados; desde cualquiera de ellos se
   sigue arrastrando a gusto.

   Se guardan como orden + tamaños y nada más. En concreto NO tocan qué
   tarjetas están puestas: si alguien quitó "Invertido" o apagó el módulo de
   Proyectos, elegir un acomodo no se lo devuelve a la cara. El acomodo dice
   cómo repartir lo que hay, no qué debe haber.

   La diferencia entre los tres es a qué se le da el sitio de honor: al reparto
   parejo, a la escena a lo ancho, o a la escena presidiendo.

   ---- Las dos reglas con las que se rehicieron los doce (0.7.56) ----

   1. **Ninguna columna termina antes que las otras.** Se buscó para cada uno
      el reparto que no deja ni una celda vacía, y once de los doce salen ya
      sin agujeros del empaquetador. Lo que quede lo tapa `emparejarColumnas`,
      que es quien lo garantiza de verdad — porque las alturas de aquí abajo
      cambian en cuanto la pantalla es otra.

   2. **Dos tarjetas de cifra no se tocan.** "Expedición", "Niveles" e
      "Invertido" son la misma pieza —`.sum-card` con icono, cifra grande,
      rótulo y barra—, y desde que Expedición entró en la 0.7.44 son TRES de
      ocho y no dos. Dos iguales pegadas no se leen como dos datos: se leen
      como una repetición. Así que entre dos de ellas va siempre una lista, y
      eso vale para arriba y abajo igual que para izquierda y derecha.

   ---- Y por qué hay tres listas de escritorio y no una ----
   Un acomodo son alturas escritas a mano, y unas alturas escritas a mano dan
   por hecha una pantalla. La lista se elige por la FORMA de la ventana (ver
   `formaTablero`), y lo que separa una forma de otra son las columnas: cuántas
   hay y cómo de anchas. En la tableta la columna baja de 430 px y la racha de
   una columna se apila, que es el salto más caro de todos.

   Los tres nombres se repiten en las tres listas a propósito: la pregunta que
   contesta un acomodo —a qué se le da el sitio de honor— es la misma en todas
   partes, y lo que cambia es cuánto sitio hay para contestarla. Elegir
   "Mirador" tiene que dar lo mismo en las tres pantallas; lo que no puede ser
   igual son las alturas con las que se consigue. */
const DASH_ACOMODOS = [
  {
    nombre: "Columnas",
    sub: "Tres columnas parejas, las misiones al centro",
    /* Once filas justas, sin una celda vacía y sin dos cifras pegadas: 856 px,
       que es lo único de los tres que cabe entero en una pantalla de 1000. */
    order: ["racha", "misiones", "atencion", "expedicion", "niveles", "listos", "proyectos", "invertido"],
    sizes: {
      /* Misiones va deliberadamente más alta de lo que su contenido pide: es
         lo que la mantiene en la columna del centro, que es lo que promete el
         rótulo. Con la altura justa se desliza a la primera columna y el
         acomodo deja de llamarse como se llama. */
      racha: { w: 1, h: 4 }, misiones: { w: 1, h: 8 }, atencion: { w: 1, h: 4 },
      expedicion: { w: 1, h: 4 }, niveles: { w: 1, h: 3 }, listos: { w: 1, h: 4 },
      proyectos: { w: 1, h: 3 }, invertido: { w: 1, h: 3 }
    }
  },
  {
    nombre: "Panorama",
    sub: "La escena a lo ancho, arriba a la derecha",
    /* El orden importa más que los tamaños: "Misiones" tiene que ir PRIMERA
       para quedarse la columna de la izquierda y empujar la racha a las dos de
       la derecha, que es lo que dice el rótulo. */
    order: ["misiones", "racha", "expedicion", "listos", "atencion", "niveles", "proyectos", "invertido"],
    sizes: {
      racha: { w: 2, h: 5 }, misiones: { w: 1, h: 6 }, expedicion: { w: 1, h: 4 },
      listos: { w: 1, h: 4 }, atencion: { w: 1, h: 3 }, niveles: { w: 1, h: 3 },
      proyectos: { w: 1, h: 3 }, invertido: { w: 1, h: 3 }
    }
  },
  {
    nombre: "Mirador",
    sub: "La escena grande, presidiendo el tablero",
    /* La racha ocupa las TRES columnas desde la 0.7.56, y ese es el cambio que
       hace verdad el rótulo. Con dos se quedaba a un lado, que es exactamente
       lo que ya hace "Panorama": los dos acomodos se veían casi iguales y solo
       se distinguían por en qué borde caía la escena.

       Se paga: catorce filas contra las once de "Columnas". Es un intercambio
       y no un descuido — se baja un poco a cambio de ver el mes a metro y
       medio de ancho. */
    order: ["racha", "misiones", "expedicion", "atencion", "proyectos", "listos", "niveles", "invertido"],
    sizes: {
      racha: { w: 3, h: 5 }, misiones: { w: 1, h: 6 }, expedicion: { w: 1, h: 4 },
      atencion: { w: 1, h: 3 }, proyectos: { w: 1, h: 3 }, listos: { w: 1, h: 5 },
      niveles: { w: 1, h: 3 }, invertido: { w: 1, h: 3 }
    }
  }
];

/* ---- Acomodos de DOS columnas anchas ----
   Sirven para la laptop de 1366 —504 px por columna, sitio de sobra, la racha
   no se apila— y desde la 0.7.56 también para cualquier ventana de dos
   columnas que antes recibía la lista de escritorio: un monitor de 1512 x 950,
   una ventana a media pantalla en un 4K. Ahí se servía un reparto escrito para
   TRES columnas y salía lo que tenía que salir — agujeros, dos tarjetas de
   cifra pegadas, y un botón que prometía "tres columnas parejas" delante de
   dos columnas sin centro. Ver `formaTablero`.

   Aquí no se persigue que todo quepa de una: no puede. Las ocho tarjetas piden
   31 filas de contenido, y en dos columnas eso son dieciséis por poco que se
   apriete. Perseguirlo es lo que hacía `encajarEnPantalla` cuando su suelo era
   una tabla: dejaba "Misiones de hoy" con 283 px de lista cortada para ganar
   una pantalla que igualmente no se ganaba.

   Lo que sí se decide es QUÉ CAE EN LA PRIMERA PANTALLA, y que ninguna tarjeta
   reciba menos de lo que necesita para leerse. */
const DASH_ACOMODOS_LAPTOP = [
  {
    nombre: "Columnas",
    sub: "Las dos columnas parejas, y el día arriba",
    order: ["misiones", "racha", "niveles", "atencion", "expedicion", "proyectos", "listos", "invertido"],
    sizes: {
      misiones: { w: 1, h: 8 }, racha: { w: 1, h: 4 }, niveles: { w: 1, h: 3 },
      atencion: { w: 1, h: 3 }, expedicion: { w: 1, h: 4 }, proyectos: { w: 1, h: 3 },
      listos: { w: 1, h: 4 }, invertido: { w: 1, h: 3 }
    }
  },
  {
    nombre: "Panorama",
    sub: "El mes a lo ancho arriba; lo demás, debajo",
    /* La racha de dos columnas cuesta tres filas de tablero más que la de una:
       ocupa cinco filas de las DOS columnas y deja el resto para las otras
       siete tarjetas. Es un intercambio, no un descuido — se paga alto para
       ver el mes grande, que es de lo que va este acomodo. */
    order: ["racha", "misiones", "atencion", "expedicion", "listos", "niveles", "proyectos", "invertido"],
    sizes: {
      racha: { w: 2, h: 5 }, misiones: { w: 1, h: 8 }, atencion: { w: 1, h: 3 },
      expedicion: { w: 1, h: 4 }, listos: { w: 1, h: 4 }, niveles: { w: 1, h: 3 },
      proyectos: { w: 1, h: 3 }, invertido: { w: 1, h: 3 }
    }
  },
  {
    nombre: "Mirador",
    sub: "Proyectos y talentos al frente; el día, después",
    /* La racha va la ÚLTIMA de la lista y por eso cae al fondo: aquí el sitio
       de honor es de lo que construyes, y el día viene detrás. */
    order: ["listos", "proyectos", "niveles", "misiones", "atencion", "invertido", "expedicion", "racha"],
    sizes: {
      listos: { w: 1, h: 4 }, proyectos: { w: 1, h: 3 }, niveles: { w: 1, h: 3 },
      misiones: { w: 1, h: 8 }, atencion: { w: 1, h: 3 }, invertido: { w: 1, h: 3 },
      expedicion: { w: 1, h: 4 }, racha: { w: 1, h: 4 }
    }
  }
];

/* ---- Acomodos de tableta (dos columnas ESTRECHAS) ----
   Lo que separa esta forma de la anterior no es el alto: es que la columna baja
   de 430 px —333 en un iPad apaisado, 411 en uno de 11 pulgadas— y ahí la racha
   de una columna se apila y pasa de cuatro filas a siete. Ese es el número que
   manda en toda esta lista, y por eso la racha va a lo ancho en los TRES: de
   dos columnas mide 688 px, se pone en dos bloques y cuesta cinco filas en vez
   de las siete que costaría apilada.

   Sirve igual para la tableta en vertical, que tiene las mismas columnas
   estrechas y muchísimo más alto: ahí lo que sobra es sitio, y un acomodo que
   no corta nada sigue siendo el acomodo correcto. */
const DASH_ACOMODOS_TABLETA = [
  {
    nombre: "Columnas",
    sub: "El día arriba, y el mes a lo ancho debajo",
    order: ["misiones", "racha", "expedicion", "listos", "atencion", "niveles", "invertido", "proyectos"],
    sizes: {
      misiones: { w: 1, h: 8 }, racha: { w: 2, h: 5 }, expedicion: { w: 1, h: 4 },
      listos: { w: 1, h: 4 }, atencion: { w: 1, h: 3 }, niveles: { w: 1, h: 3 },
      invertido: { w: 1, h: 3 }, proyectos: { w: 1, h: 3 }
    }
  },
  {
    nombre: "Panorama",
    sub: "El mes preside, y debajo lo que lo llena",
    order: ["racha", "misiones", "atencion", "expedicion", "listos", "niveles", "proyectos", "invertido"],
    sizes: {
      racha: { w: 2, h: 5 }, misiones: { w: 1, h: 8 }, atencion: { w: 1, h: 3 },
      expedicion: { w: 1, h: 4 }, listos: { w: 1, h: 4 }, niveles: { w: 1, h: 3 },
      proyectos: { w: 1, h: 3 }, invertido: { w: 1, h: 3 }
    }
  },
  {
    nombre: "Mirador",
    sub: "Proyectos y talentos al frente; el día, después",
    /* "Niveles" va segunda y no por gusto: es la única tarjeta corta que cabe
       al lado de "Listos" sin dejar hueco, y con cualquier otra ahí el tablero
       se descuadra dos filas más abajo. */
    order: ["listos", "niveles", "misiones", "racha", "proyectos", "expedicion", "atencion", "invertido"],
    sizes: {
      listos: { w: 1, h: 4 }, niveles: { w: 1, h: 3 }, misiones: { w: 1, h: 8 },
      racha: { w: 2, h: 5 }, proyectos: { w: 1, h: 3 }, expedicion: { w: 1, h: 4 },
      atencion: { w: 1, h: 3 }, invertido: { w: 1, h: 3 }
    }
  }
];

/* ---- Acomodos del teléfono ----
   En una sola columna no hay nada que repartir a lo ancho ni alturas que
   elegir: lo único que cambia el tablero es QUÉ VA PRIMERO. Por eso son otros
   tres, y no los de la computadora traducidos —allí un acomodo reparte tres
   columnas; aquí decide con qué te encuentras al abrir la app—.

   La regla de las gemelas vale aquí igual, y aquí es más fácil de ver: en una
   columna "pegadas" quiere decir simplemente "seguidas en la lista". Entre
   Expedición, Niveles e Invertido va siempre otra cosa.

   El arrastre y el resto del Modo Editor están apagados en el teléfono a
   propósito: la personalización de móvil se va a rehacer con otro gesto, y
   mientras tanto es mejor no tener a medias algo que se siente mal. */
const DASH_ACOMODOS_MOVIL = [
  {
    nombre: "El día",
    sub: "Lo de hoy primero: misiones, racha y lo que urge",
    order: ["misiones", "racha", "atencion", "expedicion", "proyectos", "niveles", "listos", "invertido"]
  },
  {
    nombre: "Constancia",
    sub: "La racha arriba, y debajo lo que la alimenta",
    order: ["racha", "misiones", "expedicion", "atencion", "niveles", "listos", "invertido", "proyectos"]
  },
  {
    nombre: "Lo que construyo",
    sub: "Proyectos y talentos al frente; el día, después",
    order: ["proyectos", "listos", "invertido", "misiones", "atencion", "expedicion", "racha", "niveles"]
  }
];

/* ---- Qué forma tiene la ventana ----
   No basta el ancho de la ventana: lo que decide el reparto son las COLUMNAS,
   cuántas hay y cómo de anchas, y eso hay que medirlo.

   Hasta la 0.7.47 el segundo salto lo daba el ALTO de la ventana —una constante
   `VENTANA_BAJA` de 860— y esa cuenta dejaba fuera una forma entera: una
   ventana alta de menos de 1700 px de ancho tiene DOS columnas y recibía la
   lista de tres. Un monitor de 1512 x 950, que es una MacBook Pro de 14
   pulgadas cualquiera, veía un primer botón que prometía "tres columnas
   parejas, las misiones al centro" delante de dos columnas y sin centro; y
   medido de verdad, "Panorama" y "Mirador" ocupaban 1.72 pantallas.

   Ahora el salto es el número de columnas, que es lo que de verdad cambia el
   reparto. El alto no elige lista y no hace falta que lo haga: de que quepa ya
   se encarga `encajarEnPantalla`, que mide en vez de suponer. */
function formaTablero() {
  if (!isDesktop()) return "telefono";
  const col = anchoDeColumna();
  /* Sin medida se responde lo de siempre. Es lo que había antes de que
     existieran las formas, así que en el peor caso no se empeora nada. */
  if (col && col < RACHA_LADO_A_LADO) return "tableta";
  return dashCols() < 3 ? "laptop" : "escritorio";
}

const ACOMODOS_POR_FORMA = {
  telefono: DASH_ACOMODOS_MOVIL,
  tableta: DASH_ACOMODOS_TABLETA,
  laptop: DASH_ACOMODOS_LAPTOP,
  escritorio: DASH_ACOMODOS
};

function acomodosDeAhora() {
  return ACOMODOS_POR_FORMA[formaTablero()] || DASH_ACOMODOS;
}

/* ---- Qué plantilla está puesta ----
   Se guarda el NOMBRE, no el número: las listas de la computadora y del
   teléfono no son la misma, y un índice apuntaría a otra cosa al cambiar de
   pantalla. Deja de estar puesta en cuanto se toca algo a mano —mover,
   redimensionar, quitar o añadir una tarjeta—, porque a partir de ahí el
   tablero ya no es el que propuso la plantilla. */
/* Y se guarda también la FORMA con la que se puso. Los tres nombres se
   repiten en las tres listas de escritorio, y las tres escriben en la misma
   ranura: sin esto, poner "Mirador" en la laptop y luego abrir la app en una
   tableta dejaba el botón encendido señalando un reparto que no es el que hay
   en pantalla. Un tablero guardado antes de que existieran las formas no
   lleva ninguna, y se le da por buena la de ahora: lo único que se juega es
   qué botón sale marcado. */
function acomodoActivo() {
  const d = (state.ui || {})[ranuraTablero()] || {};
  if (!d.acomodo) return null;
  if (d.forma && d.forma !== formaTablero()) return null;
  return d.acomodo;
}

function marcarAcomodo(nombre) {
  state.ui = state.ui || {};
  const ranura = ranuraTablero();
  const cur = state.ui[ranura] || {};
  if (nombre) { cur.acomodo = nombre; cur.forma = formaTablero(); }
  else { delete cur.acomodo; delete cur.forma; }
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
  requestAnimationFrame(() => {
    encajarEnPantalla();
    /* Y después de encoger, se tapan los huecos. Este orden importa y no es
       intercambiable: `encajarEnPantalla` cambia alturas y vuelve a
       empaquetar, así que rellenar antes de que termine deja el tablero con
       los agujeros de la vuelta anterior. */
    if (emparejarColumnas()) { save(); renderSummary(); }
  });
  toast("Acomodo " + a.nombre, "hecho", { label: "Deshacer", onclick: "deshacerTablero()" });
}

/* ---- Cuántas filas pide de verdad cada tarjeta ----
   Se MIDE, no se estima: se deja que las tarjetas crezcan a su altura natural
   durante un instante, se apunta cuánto ocupan y se devuelven a su sitio. Un
   solo repintado y nadie lo ve, porque no se sale de esta función.

   Hace falta porque el alto que pide una tarjeta depende de lo que hay
   dentro: "Misiones de hoy" con diez misiones ocupa siete filas y con tres,
   cuatro. Cualquier tabla escrita a mano acierta con unos datos y se
   equivoca con otros. */
function filasQuePide() {
  const el = document.getElementById("summary-content");
  const pide = {};
  if (!el) return pide;
  el.classList.add("midiendo");
  [...el.children].forEach(w => {
    const id = w.dataset.w;
    const cuerpo = [...w.children].find(x =>
      !x.classList.contains("w-edit") && !x.classList.contains("w-resize"));
    if (!id || !cuerpo) return;
    const px = cuerpo.getBoundingClientRect().height;
    pide[id] = Math.max(1, Math.ceil((px + ROW_GAP_V) / ROW_PITCH));
  });
  el.classList.remove("midiendo");
  return pide;
}

/* Encoge las tarjetas —nunca por debajo de lo que necesitan para leerse—
   hasta que el tablero entero quepa en lo que queda de ventana. Devuelve si
   tocó algo.

   El suelo era `DASH_MIN_H`, una tabla, y en una ventana baja eso no encogía:
   destrozaba. En una laptop de 1366 x 768 las siete tarjetas piden 28 filas y
   en dos columnas eso son catorce: no caben en las seis y media que hay, no
   van a caber, y el intento dejaba "Misiones de hoy" con 283 px de lista
   cortada a cambio de nada. Ahora el suelo es lo que la tarjeta MIDE, así que
   esto quita el aire que sobra y se para donde empezaría a esconder algo. El
   nombre sigue siendo el correcto en las pantallas donde sí cabe todo; en las
   demás, deja el tablero tan corto como puede ser sin mentir. */
function encajarEnPantalla() {
  if (!isDesktop()) return false;
  const el = document.getElementById("summary-content");
  if (!el) return false;
  let tocado = false;
  let pide = filasQuePide();

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
      /* La racha no entra: su alto no se elige, sale de su ancho (ver
         `altoDeRacha`). Escribirle uno aquí no hacía nada salvo dar el bucle
         por vivo seis vueltas seguidas. */
      if (id === "racha") return;
      const s = dashSize(id);
      const suelo = Math.max(altoMinimo(id), pide[id] || 0);
      const nuevo = Math.max(suelo, Math.floor(s.h * factor));
      if (nuevo !== s.h) { sizes[id] = { w: s.w, h: nuevo }; cambio = true; }
    });
    if (!cambio) break;                 // todas están ya en lo que piden
    state.ui[ranuraTablero()].sizes = sizes;
    /* Al cambiar los altos, lo que había debajo puede subir: se vuelve a
       colocar para que no queden agujeros. Pero SIN cambiar de columna, y eso
       es el arreglo de la 0.7.56: aquí se llamaba a `empaquetar`, que coloca
       desde cero, y eso deshacía el acomodo que se acababa de elegir. Al
       encoger "Misiones de hoy", "Invertido" se colaba en su columna y el
       tablero dejaba de tener las misiones al centro, que es exactamente lo
       que promete el rótulo del botón que se acaba de pulsar. Y de paso dos
       tarjetas de cifra que el acomodo había separado a propósito acababan
       una encima de otra. */
    const vis = dashLayout().order.filter(id => !dashLayout().hidden.includes(id) && DASH_META[id]);
    state.ui[ranuraTablero()].pos = compactarEnSuColumna(dashLayout().pos || empaquetar(vis, sizes, dashCols()), vis, dashCols());
    tocado = true;
    renderSummary();
    /* Al encoger una tarjeta cambia su ancho solo si cambió de columna, pero
       lo que sí cambia siempre es el contenido que le cabe: se vuelve a medir
       para que el suelo de la vuelta siguiente sea el de ahora. */
    pide = filasQuePide();
  }
  if (tocado) save();
  return tocado;
}

/* ---- Igualar las columnas: un tablero sin agujeros (0.7.56) ----
   Un acomodo se escribe con alturas a mano y se coloca con `empaquetar`, que
   busca el primer hueco libre. Casi siempre sobra algo: una columna acaba dos
   filas más corta que las otras y queda un rectángulo vacío al pie, o en
   medio si lo que venía detrás era una tarjeta de dos columnas y tuvo que
   esperar a que las dos estuvieran libres. Con siete tarjetas se notaba poco;
   con ocho, once de los doce acomodos tenían al menos un agujero.

   **No se arregla escribiendo mejores alturas, y esa es la razón de que esto
   exista.** Las alturas cambian después de escribirlas: `encajarEnPantalla`
   las encoge para que quepan, quien haya quitado una tarjeta reparte lo que
   sobra de otra manera, y "Misiones de hoy" mide lo que midan las misiones de
   esa persona. Cualquier tabla afinada a mano deja de cuadrar al primer
   cambio, y el agujero vuelve.

   Así que el hueco se rellena DESPUÉS de colocar: se busca cada celda vacía y
   se estira hacia abajo la tarjeta que tiene justo encima. Como solo se ocupan
   celdas que ya estaban vacías, nadie se mueve de sitio y el tablero no crece
   ni una fila — lo único que cambia es que la tarjeta de abajo de la columna
   corta llega hasta el fondo.

   Dos tarjetas se quedan fuera y por motivos distintos: la racha, porque su
   alto sale de su ancho y escribirle uno aquí no haría nada (ver
   `altoDeRacha`); y cualquiera que ya esté en `DASH_MAX_H`, que es el tope de
   siempre. Si un hueco no se puede tapar se deja y se sigue con el siguiente:
   más vale un agujero que un bucle. */
function emparejarColumnas() {
  const cols = dashCols();
  if (cols < 2) return false;              // en una columna no hay nada que igualar
  const d = dashLayout();
  const vis = d.order.filter(id => !d.hidden.includes(id) && DASH_META[id]);
  if (!vis.length) return false;

  /* Las alturas se escriben en el sitio de verdad ANTES de empezar: `dashSize`
     lee de ahí, y con una copia suelta las vueltas siguientes seguirían viendo
     los altos viejos. */
  state.ui = state.ui || {};
  const ranura = ranuraTablero();
  state.ui[ranura] = state.ui[ranura] || {};
  const sizes = state.ui[ranura].sizes = d.sizes || {};
  const pos = state.ui[ranura].pos = d.pos || empaquetar(vis, sizes, cols);

  const imposibles = new Set();
  let tocado = false;

  for (let vuelta = 0; vuelta < 60; vuelta++) {
    const rejilla = [];
    let fondo = 0;
    vis.forEach(id => {
      const p = pos[id];
      if (!p) return;
      const { w, h } = dashSize(id);
      for (let f = p.f; f < p.f + h; f++) {
        rejilla[f] = rejilla[f] || [];
        for (let c = p.c; c < p.c + w; c++) rejilla[f][c] = id;
      }
      fondo = Math.max(fondo, p.f + h);
    });

    let hueco = null;
    for (let f = 0; f < fondo && !hueco; f++)
      for (let c = 0; c < cols; c++)
        if (!(rejilla[f] || [])[c] && !imposibles.has(f + ":" + c)) { hueco = { f, c }; break; }
    if (!hueco) break;

    const marcarImposible = () => imposibles.add(hueco.f + ":" + hueco.c);
    const arriba = hueco.f > 0 ? (rejilla[hueco.f - 1] || [])[hueco.c] : null;
    if (!arriba || arriba === "racha") { marcarImposible(); continue; }

    const p = pos[arriba];
    const { w, h } = dashSize(arriba);
    /* Tiene que terminar justo donde empieza el hueco —si no, no es la de
       encima— y todo su ancho tiene que estar libre en esa fila: una tarjeta
       de dos columnas no puede crecer si solo una de las dos está vacía. */
    let puede = p.f + h === hueco.f && h < DASH_MAX_H;
    for (let c = p.c; puede && c < p.c + w; c++) if ((rejilla[hueco.f] || [])[c]) puede = false;
    if (!puede) { marcarImposible(); continue; }

    sizes[arriba] = { w, h: h + 1 };
    tocado = true;
  }

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
/* ---- Subir lo que quepa, cada una por su columna ----
   La hermana de `empaquetar` para cuando ya hay un reparto que respetar. Sube
   cada tarjeta hasta donde llegue sin salirse de la columna en la que estaba,
   y en el orden en que estaban de arriba abajo, así que dos tarjetas nunca se
   cruzan ni cambian de vecina. Lo que se conserva es la FORMA del acomodo; lo
   que se recupera es el hueco que dejó una tarjeta al encogerse. */
function compactarEnSuColumna(pos, vis, cols) {
  const usado = [], nueva = {};
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
  vis.filter(id => pos[id] && DASH_META[id])
     .sort((a, b) => pos[a].f - pos[b].f || pos[a].c - pos[b].c)
     .forEach(id => {
       const s = dashSize(id);
       /* El tope por si el tablero perdió una columna desde que se guardó:
          una tarjeta de la tercera no puede quedarse apuntando a una que ya
          no existe. */
       const c = Math.min(pos[id].c, Math.max(0, cols - s.w));
       for (let f = 0; f < 500; f++) {
         if (libre(c, f, s.w, s.h)) { nueva[id] = { c, f }; marcar(c, f, s.w, s.h); break; }
       }
     });
  return nueva;
}

function disposicionTablero(ids, cols, extra) {
  const { pos, sizes, order, hidden } = dashLayout();
  // Las escondidas no ocupan sitio en el reparto de estreno
  const base = pos || empaquetar(order.filter(id => !hidden.includes(id)), sizes, cols);
  /* La primera fila libre por debajo de todo lo que YA tiene sitio. Es dónde
     va a parar una tarjeta que no existía cuando esta persona acomodó su
     tablero: al fondo, sin tocar nada de lo suyo.

     Y es una fila de verdad, no un número gordo de centinela: con `f: 9999` la
     tarjeta se plantaba en la fila 9999 de la cuadrícula —el buscador de hueco
     la encontraba libre y la dejaba ahí— y el tablero se llevaba detrás
     800.000 px de vacío que sí se podían recorrer. */
  const fondo = Object.keys(base).reduce((max, id) => {
    const p = base[id], s = dashSize(id);
    return p ? Math.max(max, (p.f || 0) + (s ? s.h : 1)) : max;
  }, 0);
  const piezas = ids.map(id => {
    const s = dashSize(id);
    const p = (extra && extra[id]) || base[id] || { c: 0, f: fondo };
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
/* Cinco filas de una columna, seis de dos o de tres. Las nueve de antes eran
   demasiado —una tarjeta de una columna acaparaba media pantalla— y salían de
   dar por hecho que estrecha significaba apilada. No: una columna del tablero
   son unos 470 px, sitio de sobra para poner la identidad al lado del mes con
   las casillas más pequeñas. Quien de verdad apila es el teléfono, y ahí el
   alto lo pone el contenido y no esta tabla.

   Medido con el peor mes posible, uno de seis semanas como agosto de 2026:
   308 px de una columna y 372 de dos. Una fila del tablero son 56 px con 24
   de hueco, así que 5 filas dan 376 y 6 dan 456. Lo que sobre lo reparte el
   cuerpo, que va centrado.

   ---- Y por qué ya no basta con contar columnas ----
   «Una columna son unos 470 px» es verdad en un monitor y en una laptop, y
   deja de serlo en una tableta: a 1024 px de ventana, con la barra lateral
   puesta, cada columna mide 333. Ahí la tarjeta cae por debajo del umbral de
   430 de su propio `@container`, se apila —la identidad encima del mes— y
   pide 518 px. Recibía 376 y se comía cinco días de calendario, en silencio,
   en todos los iPad.

   Así que el alto se decide midiendo, no contando: se compara el ancho de
   verdad de la tarjeta contra el MISMO 430 que usa el CSS. Las dos cuentas
   tienen que decidir lo mismo o la tarjeta sale cortada; si algún día se
   mueve el `@container` de `.streak-card`, se mueve esta constante con él. */
const RACHA_LADO_A_LADO = 430;
/* Y el segundo umbral, el que decide si el mes va grande y si entra «qué la
   sostiene». Vive aquí y en el `@container` de `.streak-card`, y los dos
   tienen que decir lo mismo: si se mueve uno, se mueve el otro.

   Son 900 y no 680, y el número lo puso una medida: a 688 px —que es lo que
   mide la racha de dos columnas en una tableta— el carril de la derecha se
   queda en 294 px, la frase de hoy y las dos cifras parten en varias líneas, y
   la tarjeta pedía 459 px cuando recibía 376. Se salía por abajo sin que nada
   lo dijera, que es el mismo fallo que ya tuvo esta tarjeta en la 0.7.35. */
const RACHA_MES_GRANDE = 900;
/* ---- Los tres altos, MEDIDOS y no supuestos (0.7.56) ----
   Eran 7 / 5 / 6 y sobraban 110 y 130 px en escritorio: el contenido mide
   266 px de lado y 326 ancha, y recibía 376 y 456. Como `.scene-body` centra
   en vertical, ese sobrante salía como cielo vacío repartido arriba y abajo
   —83 px de cada lado en una tarjeta de 1176 x 456, el 36 % de la tarjeta—,
   que es justo el problema del que venía la 0.7.33.

   Y no lo recuperaba nadie: `encajarEnPantalla` se salta la racha a
   propósito, porque su alto no se elige. Así que la cuenta se arregla aquí o
   no se arregla.

   Las cifras: apilada el contenido pide 486 px y siete filas son 536; de
   lado pide 266 y cuatro filas son 296; ancha pide 326 y cinco son 376. */
const ALTO_RACHA = { apilada: 7, lado: 4, ancha: 5 };

/* Cuánto mide de ancho una columna del tablero AHORA MISMO, en píxeles. Se
   mide y no se calcula: el ancho disponible depende de la barra lateral, de
   si está plegada y del relleno de la página, y esa cuenta repetida aquí se
   desincronizaría del CSS a la primera.

   La medida se guarda hasta que termine la tarea en curso y se olvida sola.
   No es por velocidad: es porque dentro de un mismo dibujado todas las
   preguntas tienen que recibir el MISMO ancho. `dashSize` se llama siete
   veces por tablero —al pintar, al empaquetar, al arrastrar— y si la ventana
   cambiara en medio, la racha podría salir de cinco filas en un sitio y de
   siete en otro, con lo que el reparto no cuadraría consigo mismo. Y como se
   borra en la microtarea siguiente, nunca queda un valor viejo mandando. */
let _anchoColumna = null;
function anchoDeColumna() {
  if (_anchoColumna !== null) return _anchoColumna;
  const el = document.getElementById("summary-content");
  const total = el ? el.getBoundingClientRect().width : 0;
  // 0 = el tablero aún no está en pantalla; quien pregunte tendrá que suponer
  _anchoColumna = total ? (total - ROW_GAP * (dashCols() - 1)) / dashCols() : 0;
  Promise.resolve().then(() => { _anchoColumna = null; });
  return _anchoColumna;
}

/* Lo que mide una tarjeta de `w` columnas, huecos incluidos. */
function anchoDeTarjeta(w) {
  const col = anchoDeColumna();
  return col ? col * w + ROW_GAP * (w - 1) : 0;
}

/* Los DOS saltos se deciden en píxeles, y este es el arreglo de la 0.7.56.
   Antes el segundo preguntaba por el número de columnas —`w >= 2`— mientras
   el CSS lo decidía midiendo, y las dos cuentas no coinciden: una tarjeta de
   UNA columna en un tablero ancho puede medir 739 px, más que una de DOS en
   una tableta, que mide 688. La de 739 recibía el alto de la estrecha y salía
   cortada. Ahora las dos preguntas son la misma pregunta. */
function altoDeRacha(w) {
  const px = anchoDeTarjeta(w);
  /* Sin medida —el tablero todavía no se ha pintado— se responde lo de antes.
     No hace falta más: en cuanto la pantalla se dibuja, `dashSize` vuelve a
     preguntar y el alto se corrige solo, que es justo para lo que esto se
     calcula al LEER y no solo al escribir. */
  if (!px) return w >= 2 ? ALTO_RACHA.ancha : ALTO_RACHA.lado;
  if (px < RACHA_LADO_A_LADO) return ALTO_RACHA.apilada;
  return px < RACHA_MES_GRANDE ? ALTO_RACHA.lado : ALTO_RACHA.ancha;
}

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
      /* El alto de la racha no se arrastra: lo decide su ancho. Antes se
         dejaba estirar y al soltar volvía de golpe a su sitio — el tirón
         funcionaba, la tarjeta no obedecía, y eso no se lee como una regla
         sino como algo roto. Ahora la altura sigue al ancho mientras se
         arrastra, así que lo que se ve es lo que se guarda. */
      const h = sizeId === "racha"
        ? altoDeRacha(w)
        : clamp(sizeStart.h + dh, altoMinimo(sizeId), DASH_MAX_H);
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
/* ---- La tercera columna: lo que hace que la racha siga viva ----

   Aquí estaban «los últimos meses»: seis renglones con los días activos de
   cada uno. Eduardo lo leyó y dijo que no le decía nada, y al mirarlo con esa
   pregunta encima tenía razón — era una tabla que casi siempre son ceros o
   números parecidos, no contesta nada que se pueda hacer hoy, y compararte con
   tu marzo no cambia tu jueves.

   Lo que sí importa de una racha son dos cosas, y las dos son de AHORA:

     1. **A dónde va.** Norata ya celebra hitos de racha (3, 7, 14, 30…), pero
        el número de la tarjeta no decía nunca cuál viene ni cuánto falta: el
        premio existía y era invisible. Una meta cerca es lo que hace volver
        mañana; un mes viejo, no.
     2. **De qué está hecha.** Casi todas las rachas largas se sostienen sobre
        una o dos cosas concretas. Saber cuáles —con su nombre y sus días— es
        lo único de esta tarjeta que se puede usar para decidir algo: si tu
        racha vive de una sola misión, ya sabes qué proteger.

   Las dos se calculan sobre los últimos treinta días, no sobre la racha viva:
   con una racha de tres días, contar solo esos tres daría tres empates de uno
   y no diría nada. */

/* El hito de racha que viene, con lo que llevas recorrido desde el anterior.
   `HITOS_RACHA` es la misma lista que dispara la celebración, así que la
   tarjeta y el festejo no pueden decir cosas distintas. */
function proximoHito(cur) {
  const sig = HITOS_RACHA.find(h => h > cur);
  if (!sig) return null;
  const previos = HITOS_RACHA.filter(h => h <= cur);
  const desde = previos.length ? previos[previos.length - 1] : 0;
  return { sig, faltan: sig - cur, pct: Math.round((cur - desde) / (sig - desde) * 100) };
}

/* En cuántos DÍAS distintos de los últimos treinta apareció cada cosa. Días y
   no veces: una misión cumplida tres veces el martes sostiene un día, no
   tres — y lo que se está midiendo es qué mantiene la racha, que se cuenta en
   días. */
function sostienenLaRacha(dias) {
  const desde = addDaysKey(todayKey(), -(dias - 1));
  const filas = [];

  state.missions.forEach(m => {
    let n = 0;
    Object.keys(m.log || {}).forEach(k => { if (k >= desde && missionCount(m, k) > 0) n++; });
    if (n) filas.push({ nombre: m.name, dias: n, color: m.color });
  });

  /* La práctica registrada a mano cuenta aparte de las misiones aunque toque
     la misma habilidad: son dos gestos distintos y el que sostiene la racha
     es el que se hizo. Se deja fuera lo que no es tuyo —el desgaste, que
     resta— y lo que ya está contado como misión, talento o proyecto. */
  state.skills.forEach(sk => {
    const dias30 = new Set();
    (sk.log || []).forEach(e => {
      if (e.date >= desde && (Number(e.xp) || 0) > 0 && !e.fuente) dias30.add(e.date);
    });
    if (dias30.size) filas.push({ nombre: "Práctica de " + sk.name, dias: dias30.size, color: sk.color });
  });

  return filas.sort((a, b) => b.dias - a.dias).slice(0, 3);
}

const RACHA_VENTANA = 30;

function loQueSostiene(cur) {
  const hito = proximoHito(cur);
  const filas = sostienenLaRacha(RACHA_VENTANA);
  const max = filas.length ? filas[0].dias : 1;

  return `
    ${hito ? `
      ${/* El hito, en UNA línea desde la 0.7.56. Tenía la cifra en grande
            —26 px— y eso hacía dos cosas mal: competía con el número de la
            racha, que es el número de esta tarjeta, y costaba 33 px de alto
            en una tarjeta cuyo alto se mide en filas de la cuadrícula. Esos
            33 px son exactamente los que separan cinco filas de seis. */""}
      <div class="sg-hito">
        <div class="rc-rot">Próximo hito · ${hito.sig} días</div>
        ${/* La misma barra que el nivel y las dos cifras de arriba. Aquí es
              donde más paga: «te faltan 4 días» es lo único de esta tarjeta
              que mueve a volver hoy, y estaba dibujado como un carril
              muerto. */""}
        <div class="barra-viva sgh-b"><i style="--p:${Math.max(3, hito.pct)}%;--c:var(--mint)"></i></div>
        <div class="sgh-p">Te ${hito.faltan === 1 ? "falta 1 día" : "faltan " + hito.faltan + " días"}</div>
      </div>` : `
      <div class="sg-hito">
        <div class="rc-rot">Los hitos</div>
        <div class="sgh-p">Pasaste el último de la lista. A partir de aquí, cada día es récord.</div>
      </div>`}
    ${filas.length ? `
      <div class="sg-sostiene">
        <div class="rc-rot">Qué la sostiene</div>
        ${filas.map(f => `
          <div class="sgs">
            <span class="sgs-n">${escapeHtml(f.nombre)}</span>
            <span class="sgs-b"><i style="width:${Math.round(f.dias / max * 100)}%;background:${trazo(f.color || "#5fe0b0")}"></i></span>
            <span class="sgs-v">${f.dias}</span>
          </div>`).join("")}
        <p class="sgs-pie">Días de los últimos ${RACHA_VENTANA} en que apareció cada una.</p>
      </div>` : ""}`;
}

function calendarioRacha(anio, mes, cuentas, hoy) {
  const total = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const primero = new Date(Date.UTC(anio, mes - 1, 1)).getUTCDay();
  const mm = String(mes).padStart(2, "0");
  const inicioSemana = addDaysKey(hoy, -weekdayOfKey(hoy));
  const finSemana = addDaysKey(inicioSemana, 6);

  let max = 1;
  for (let d = 1; d <= total; d++) max = Math.max(max, cuentas.get(anio + "-" + mm + "-" + String(d).padStart(2, "0")) || 0);
  /* La escala sale del acento de la APARIENCIA y no de la menta de la casa
     escrita aquí, que es lo que había. El calendario vive dentro de la tarjeta
     de la racha, o sea dentro de una escena, y una escena vuelve a declarar su
     paleta entera: `var(--mint)` ahí dentro es el acento del ambiente o del
     mundo que esté puesto. Con el hex escrito, en Reliquia salían cuatro
     casillas VERDES en mitad de una vitrina violeta. Es el mismo fallo que ya
     tenía la caja de un grupo en el mapa de talentos, en otro sitio.

     `velo()` y `pinta()` dejan pasar un `var(...)` intacto, así que esto sigue
     dando exactamente lo mismo que antes en la casa. */
  const acento = "var(--mint)";
  const escala = ["", velo(acento, "3a"), velo(acento, "77"), velo(acento, "b4"), pinta(acento)];

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
  /* La exigencia elegida, no el par fijo de antes: las que salen del catálogo
     tienen que nacer igual que las del formulario. */
  const ex = exigenciaActual();
  return {
    id: uid(), name: nombre, category: categoria, icon: icono, color: color,
    xp: 0, log: [], permanent: false, graceDays: ex.grace, decayPerDay: ex.decay,
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

