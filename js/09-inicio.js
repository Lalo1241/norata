/* Bienvenida, tutorial, ejemplos, zona horaria y respaldos */
/* ================= Bienvenida =================
   Tres preguntas para armar un tablero con las cosas que a esa persona
   le importan, en vez de soltarla frente a una app vacía. */

/* Cada área trae DOS habilidades y una cadena de CINCO talentos.

   Las dos habilidades, y no tres: con tres, elegir cuatro áreas dejaba doce
   habilidades puestas el primer día, y una habilidad no es un adorno --baja si
   la dejas--, así que doce son doce deudas vivas antes de empezar. Con el
   máximo en tres áreas salen seis, que es justo el tope del plan gratuito.

   Los cinco talentos encadenados, y no uno: una rama con un solo nodo en medio
   del lienzo no se lee como un comienzo, se lee como que algo falló. Cinco no
   son cinco tareas --el lienzo dibuja el primero encendido y los otros cuatro
   con candado--, así que se leen como un camino con el primer paso iluminado.

   Los primeros peldaños son HITOS, que se cierran en sí mismos y no llevan
   plazo; los que se sostienen en el tiempo son METAS, las únicas con planDays.
   Mezclarlos importa: una rama entera de metas es una lista de deberes con
   fecha, y eso agobia igual que agobiaban las doce habilidades. */
const ONBOARD_AREAS = [
  { id: "salud", proyectos: ["Correr mi primera carrera", "Armar mi rutina en casa"],     label: "Salud y cuerpo",     icon: "dumbbell", color: "#ff8a70",
    skills: ["Ejercicio", "Correr"],
    mission: { name: "Moverme 20 minutos", icon: "bolt", xp: 20 },
    branch: "Salud",
    perks: [
      { tipo: "hito", name: "Caminar 20 minutos tres días seguidos",   icon: "bolt",   days: 0,   xp: 80 },
      { tipo: "hito", name: "Aguantar 5 minutos corriendo sin parar",  icon: "flame",  days: 0,   xp: 120 },
      { tipo: "meta", name: "Moverme tres veces por semana, un mes",   icon: "target", days: 45,  xp: 180 },
      { tipo: "hito", name: "Correr 5 kilómetros de una tirada",       icon: "trophy", days: 0,   xp: 250 },
      { tipo: "meta", name: "Una rutina que sostengo sin pensarla",    icon: "shield", days: 180, xp: 400 }
    ] },
  { id: "mente", proyectos: ["Terminar el curso que dejé a medias", "Sacar mi certificado"],     label: "Aprender algo",      icon: "book", color: "#6fc3e8",
    skills: ["Lectura", "Idiomas"],
    mission: { name: "Estudiar 15 minutos", icon: "cap", xp: 20 },
    branch: "Aprender",
    perks: [
      { tipo: "hito", name: "Terminar el primer capítulo",             icon: "book",   days: 0,   xp: 80 },
      { tipo: "hito", name: "Estudiar diez días seguidos",             icon: "flame",  days: 0,   xp: 120 },
      { tipo: "meta", name: "Llegar a la mitad del curso",             icon: "target", days: 60,  xp: 200 },
      { tipo: "hito", name: "Explicarle a alguien lo que aprendí",     icon: "mic",    days: 0,   xp: 220 },
      { tipo: "meta", name: "Terminar el curso entero",                icon: "cap",    days: 180, xp: 400 }
    ] },
  { id: "creativo", proyectos: ["Montar mi portafolio", "Publicar mi primer trabajo"],  label: "Crear cosas",        icon: "brush", color: "#b7a2ea",
    skills: ["Dibujo", "Escritura"],
    mission: { name: "Crear algo pequeño", icon: "pen", xp: 20 },
    branch: "Creatividad",
    perks: [
      { tipo: "hito", name: "Diez bocetos sin borrar ninguno",         icon: "pen",    days: 0,   xp: 80 },
      { tipo: "hito", name: "Terminar algo y no dejarlo a medias",     icon: "flag",   days: 0,   xp: 130 },
      { tipo: "meta", name: "Crear algo cada semana, dos meses",       icon: "brush",  days: 60,  xp: 200 },
      { tipo: "hito", name: "Enseñárselo a alguien que no soy yo",     icon: "smile",  days: 0,   xp: 220 },
      { tipo: "meta", name: "Publicar mi primer trabajo",              icon: "star",   days: 120, xp: 350 }
    ] },
  { id: "dinero", proyectos: ["Salir de una deuda", "Armar mi presupuesto del año"],    label: "Ordenar mi dinero",  icon: "coin", color: "#5fe0b0",
    skills: ["Finanzas", "Organización"],
    mission: { name: "Anotar mis gastos del día", icon: "chart", xp: 15 },
    branch: "Dinero",
    perks: [
      { tipo: "hito", name: "Saber cuánto entra y cuánto sale",        icon: "chart",  days: 0,   xp: 80 },
      { tipo: "hito", name: "Un mes entero anotando todo",             icon: "book",   days: 0,   xp: 150 },
      { tipo: "meta", name: "Recortar un gasto que no echo de menos",  icon: "target", days: 60,  xp: 180 },
      { tipo: "meta", name: "Ahorrar mi primer mes de gastos",         icon: "coin",   days: 180, xp: 350 },
      { tipo: "meta", name: "Fondo de emergencia completo",            icon: "gem",    days: 365, xp: 500 }
    ] },
  { id: "casa", proyectos: ["Renovar mi cuarto", "Ordenar la casa de una vez"],      label: "Casa y cocina",      icon: "coffee", color: "#f5d76e",
    skills: ["Cocina", "Repostería"],
    mission: { name: "Cocinar en casa", icon: "coffee", xp: 20 },
    branch: "Casa",
    perks: [
      { tipo: "hito", name: "Tres recetas que me salen sin mirar",     icon: "coffee", days: 0,   xp: 80 },
      { tipo: "hito", name: "Cocinar para alguien más",                icon: "smile",  days: 0,   xp: 130 },
      { tipo: "meta", name: "Una semana entera cocinando en casa",     icon: "target", days: 60,  xp: 200 },
      { tipo: "hito", name: "Inventar un plato mío",                   icon: "bulb",   days: 0,   xp: 220 },
      { tipo: "meta", name: "Diez recetas de memoria",                 icon: "book",   days: 120, xp: 300 }
    ] },
  { id: "calma", proyectos: ["Arreglar mis horarios de sueño", "Planear unas vacaciones de verdad"],     label: "Descanso y calma",   icon: "heart", color: "#f0a5c0",
    skills: ["Meditación", "Yoga"],
    mission: { name: "10 minutos sin pantallas", icon: "heart", xp: 15 },
    branch: "Bienestar",
    perks: [
      { tipo: "hito", name: "Siete días acostándome a la misma hora",  icon: "heart",  days: 0,   xp: 80 },
      { tipo: "hito", name: "Una semana sin pantallas en la cama",     icon: "shield", days: 0,   xp: 120 },
      { tipo: "meta", name: "Dormir bien un mes seguido",              icon: "target", days: 30,  xp: 200 },
      { tipo: "hito", name: "Un día entero sin prisa, a propósito",    icon: "plant",  days: 0,   xp: 180 },
      { tipo: "meta", name: "Parar diez minutos cada día, tres meses", icon: "smile",  days: 90,  xp: 300 }
    ] },
  { id: "social", proyectos: ["Organizar una reunión con los míos", "Preparar un regalo que lleve tiempo"],    label: "Gente que quiero",   icon: "mic", color: "#8fd18a",
    skills: ["Oratoria", "Carisma"],
    mission: { name: "Escribirle a alguien", icon: "mic", xp: 15 },
    branch: "Personas",
    perks: [
      { tipo: "hito", name: "Escribirle a tres personas pendientes",   icon: "mic",    days: 0,   xp: 80 },
      { tipo: "hito", name: "Ver a alguien en persona, no por mensaje", icon: "smile", days: 0,   xp: 120 },
      { tipo: "meta", name: "Ver a mis amigos una vez al mes",         icon: "heart",  days: 90,  xp: 250 },
      { tipo: "hito", name: "Organizar yo el plan, sin esperar",       icon: "flag",   days: 0,   xp: 200 },
      { tipo: "meta", name: "Una costumbre que nos junte sin avisar",  icon: "star",   days: 180, xp: 350 }
    ] },
  { id: "trabajo", proyectos: ["Cambiar de trabajo", "Lanzar algo propio"],   label: "Carrera y trabajo",  icon: "wrench", color: "#9aa7b8",
    skills: ["Organización", "Negociación"],
    mission: { name: "Una hora de trabajo profundo", icon: "bolt", xp: 25 },
    branch: "Trabajo",
    perks: [
      { tipo: "hito", name: "Una hora sin interrupciones, cinco días", icon: "bolt",   days: 0,   xp: 90 },
      { tipo: "hito", name: "Terminar eso que llevo aplazando",        icon: "flag",   days: 0,   xp: 130 },
      { tipo: "meta", name: "Un mes cerrando lo que empiezo",          icon: "target", days: 60,  xp: 200 },
      { tipo: "hito", name: "Pedir lo que me toca pedir",              icon: "crown",  days: 0,   xp: 250 },
      { tipo: "meta", name: "Certificarme en lo mío",                  icon: "trophy", days: 180, xp: 400 }
    ] }
];

let onboardStep = 0;
let onboardPick = { areas: [], pace: "medio", project: "" };

function startOnboarding() {
  onboardStep = 0;
  onboardPick = { areas: [], pace: "medio", project: "" };
  renderOnboarding();
  showView("onboarding");
}

function renderOnboarding() {
  const el = document.getElementById("onboarding-content");
  const steps = [
    () => `
      <div class="ob-q">
        <div class="ob-num">Pregunta 1 de 3</div>
        <h2>¿Qué partes de tu vida quieres mejorar?</h2>
        <p class="settings-note">Elige de una a tres. Con eso armo tus primeras habilidades, misiones y ramas — después puedes cambiar todo.</p>
        <div class="ob-areas">
          ${ONBOARD_AREAS.map(a => `
            <button class="ob-area ${onboardPick.areas.includes(a.id) ? "on" : ""}" style="${tonos("oc", a.color)}" onclick="toggleArea('${a.id}')">
              <span class="oa-ic">${icon(a.icon, 22)}</span>
              <span class="oa-tx">
                <b>${a.label}</b>
                <span>${a.skills.join(" · ")}</span>
              </span>
              <span class="oa-check">${icon("check", 15)}</span>
            </button>`).join("")}
        </div>
      </div>`,
    () => `
      <div class="ob-q">
        <div class="ob-num">Pregunta 2 de 3</div>
        <h2>¿Qué tan exigente lo quieres?</h2>
        <p class="settings-note">Esto define cuánto tiempo puedes dejar una habilidad sin practicar antes de que empiece a bajar.</p>
        <div class="ob-pace">
          ${Object.values(EXIGENCIAS).map(p => `
            <button class="ob-pace-opt ${onboardPick.pace === p.id ? "on" : ""}" onclick="pickPace('${p.id}')">
              <span class="op-ic" data-r="${p.id}">${icon(p.icono, 20)}</span>
              <span class="op-tx"><b>${p.nombre}</b><span>${p.dicho}</span></span>
            </button>`).join("")}
        </div>
      </div>`,
    () => `
      <div class="ob-q">
        <div class="ob-num">Pregunta 3 de 3</div>
        <h2>¿Hay algo que estés construyendo ahora?</h2>
        <p class="settings-note">Un proyecto con etapas: mudarte, lanzar algo, terminar un trámite. Si no hay nada, puedes saltarlo.</p>
        <label class="field">
          <span>Nombre del proyecto (opcional)</span>
          <input type="text" id="ob-project" placeholder="Ej. Renovar mi cuarto" maxlength="60" value="${escapeAttr(onboardPick.project)}">
        </label>
        ${ideasDeProyecto().length ? `
          <p class="settings-note ob-ideas-tit">O toca una de estas</p>
          <div class="ob-ideas">
            ${ideasDeProyecto().map(t => `
              <button type="button" class="ob-idea" onclick="usarIdea('${enJS(t)}')">${escapeHtml(t)}</button>`).join("")}
          </div>` : ""}
      </div>`
  ];

  const canNext = onboardStep !== 0 || onboardPick.areas.length > 0;
  el.innerHTML = `
    ${steps[onboardStep]()}
    <div class="ob-nav">
      ${onboardStep > 0 ? `<button class="btn btn-ghost" onclick="obBack()">Atrás</button>` : `<button class="btn btn-ghost" onclick="showView('summary')">Cancelar</button>`}
      <button class="btn btn-primary" onclick="obNext()" ${canNext ? "" : "disabled"}>
        ${onboardStep === 2 ? "Armar mi tablero" : "Siguiente"}
      </button>
    </div>
    <div class="ob-dots">${[0, 1, 2].map(i => `<i class="${i === onboardStep ? "on" : ""}"></i>`).join("")}</div>`;
}

/* ---- Los ejemplos de la pregunta 3 ----
   Salen de lo que la persona acaba de elegir en la pregunta 1, no de una lista
   general: quien marcó «Casa y cocina» y «Ordenar mi dinero» no tiene por qué
   ver «Cambiar de trabajo» entre las ideas.

   Existen porque esa pantalla era la única de las tres que pedía ESCRIBIR
   cuando las otras dos piden elegir, y encima llega cuando la persona ya se
   cansó de decidir: una caja de texto vacía al final de un formulario se salta
   sola. Quien quiera escribir lo suyo sigue teniendo el campo delante. */
function ideasDeProyecto() {
  return ONBOARD_AREAS
    .filter(a => onboardPick.areas.includes(a.id))
    .reduce((t, a) => t.concat(a.proyectos || []), []);
}

/* Se escribe en el campo Y en `onboardPick`: el valor del input se pierde en
   cuanto algo repinta la pantalla, y `obBack`/`obNext` leen el campo. */
function usarIdea(txt) {
  const campo = document.getElementById("ob-project");
  if (!campo) return;
  campo.value = txt;
  onboardPick.project = txt;
  campo.focus();
}

function toggleArea(id) {
  const i = onboardPick.areas.indexOf(id);
  if (i >= 0) onboardPick.areas.splice(i, 1);
  /* El tope sale de `LIMITES` y no de un cuatro escrito aquí: cada área
     crea UNA rama, así que si los dos números se escriben por separado, el
     día que uno cambie la bienvenida creará ramas que el plan no deja
     tener — y la persona se encontraría el tope alcanzado sin haber hecho
     nada. Se lee el de `libre` incluso para quien paga: la bienvenida es
     la primera vez para todos, y ya podrá añadir más después. */
  else if (onboardPick.areas.length < LIMITES.libre.ramas) onboardPick.areas.push(id);
  else { toast("Tres es suficiente para empezar", "atencion"); return; }
  renderOnboarding();
}

function pickPace(p) { onboardPick.pace = p; renderOnboarding(); }

function obBack() {
  if (onboardStep === 2) onboardPick.project = document.getElementById("ob-project").value.trim();
  onboardStep--;
  renderOnboarding();
}

function obNext() {
  if (onboardStep === 2) {
    onboardPick.project = document.getElementById("ob-project").value.trim();
    buildFromOnboarding();
    return;
  }
  onboardStep++;
  renderOnboarding();
}

function buildFromOnboarding() {
  const today = todayKey();
  /* La respuesta se GUARDA, no solo se aplica a lo que se crea ahora. Antes
     se usaba aquí y se perdía: la habilidad que crearas mañana volvía al punto
     medio sin avisar, y no había ninguna pantalla donde ver qué elegiste. */
  state.settings.exigencia = EXIGENCIAS[onboardPick.pace] ? onboardPick.pace : EXIGENCIA_POR_DEFECTO;
  const ex = exigenciaActual();
  const grace = ex.grace;
  const decay = ex.decay;
  const areas = ONBOARD_AREAS.filter(a => onboardPick.areas.includes(a.id));

  areas.forEach((a, i) => {
    /* Cada área trae DOS habilidades afines en vez de una. Elegir "Salud y
       cuerpo" y encontrarse una sola línea llamada "Ejercicio" dice poco;
       ver Ejercicio y Correr en cero ya dibuja un terreno. Eran tres hasta
       que se contaron: cuatro áreas dejaban doce habilidades puestas el
       primer día, y una habilidad baja si la dejas, así que eran doce deudas
       vivas antes de empezar. La primera
       es la que enlaza con la misión y el talento del área. Los nombres se
       resuelven contra el catálogo para no repetir icono y color en dos
       sitios, y si una ya existe (dos áreas pueden compartirla) se reutiliza
       en vez de duplicarla. */
    let skill = null;
    a.skills.forEach((nombre, j) => {
      const yaEsta = state.skills.find(s => s.name.toLowerCase() === nombre.toLowerCase());
      if (yaEsta) { if (j === 0) skill = yaEsta; return; }
      const cat = SKILL_CATALOG.find(x => x.n === nombre);
      const nueva = {
        id: uid(), name: nombre,
        category: cat ? cat.c : "General",
        icon: cat ? cat.i : a.icon,
        color: cat ? cat.k : a.color,
        xp: 0, permanent: false, graceDays: grace, decayPerDay: decay,
        createdAt: today, lastActivity: null, lastCheck: today, log: []
      };
      state.skills.push(nueva);
      if (j === 0) skill = nueva;
    });
    if (!skill) skill = state.skills[0];

    state.missions.push({
      id: uid(), name: a.mission.name, desc: "", icon: a.mission.icon, color: a.color,
      cadence: "daily", days: [], target: 1,
      skillId: skill.id, xp: a.mission.xp, log: {}, archived: false, completedAt: null,
      createdAt: today
    });

    /* Encadenados, y por eso se crean en orden guardando el id del previo:
       `uid()` no existe hasta crear el nodo. El primero sale sin requisitos
       —el único que el lienzo dibuja encendido— y los otros cuatro con
       candado, que es lo que los vuelve camino en vez de lista de deberes.
       Antes era UN talento suelto por área, y una rama con un solo nodo en
       medio del lienzo no se lee como un comienzo: se lee como un error. */
    let anterior = null;
    a.perks.forEach(t => {
      const nodo = {
        id: uid(), name: t.name, branch: a.branch, desc: "",
        tipo: t.tipo, cost: 0, planDays: t.days, steps: [],
        skillId: skill.id, xpReward: t.xp, requiere: anterior ? [anterior] : [], modo: "todos",
        icon: t.icon, color: a.color,
        status: null, startDate: null, endDate: null, completedAt: null,
        investedTotal: 0, progress: 0, createdAt: today,
        history: [{ date: today, at: stamp(), event: `Talento creado en la rama ${a.branch}` }]
      };
      state.perks.push(nodo);
      anterior = nodo.id;
    });
  });

  if (onboardPick.project) {
    const first = areas[0];
    state.projects.push({
      id: uid(), name: onboardPick.project, branch: "Personal",
      icon: "flag", color: first ? first.color : COLORS[0],
      desc: "", status: "active",
      steps: [
        { id: uid(), name: "Definir qué significa terminarlo", done: false, at: null },
        { id: uid(), name: "Primer paso concreto", done: false, at: null },
        { id: uid(), name: "Revisar avance", done: false, at: null }
      ],
      skillId: first ? state.skills[0].id : null, xpReward: 250,
      createdAt: today, lastActivity: today, completedAt: null,
      history: [{ date: today, at: stamp(), event: "Proyecto creado desde la bienvenida" }]
    });
  }

  save();
  showView("summary");
  celebrate("Tu tablero está listo", `${areas.length} área${areas.length === 1 ? "" : "s"} para empezar`, "#5fe0b0", "compass");
  // Después de la celebración, no encima de ella
  quizaTutorial(2600);
}

/* ================= Tutorial de bienvenida =================
   Sale UNA vez, y sale cuando el tablero ya tiene algo dentro: explicar los
   módulos con la app vacía es hablar de sitios que el usuario todavía no
   puede reconocer. Por eso lo disparan los tres caminos de entrada —el
   cuestionario, el ejemplo y la primera habilidad hecha a mano— y no el
   primer arranque a secas.

   Cada tarjeta explica UN módulo, con la misma pregunta detrás: ¿qué pongo
   aquí y qué gano? Se salta entero desde la primera, y se puede volver a ver
   desde Ajustes, que es donde uno busca las cosas que cerró sin querer. */

const TUTO_PASOS = [
  {
    /* La portada. Antes se entraba directo a "Misiones", y una tarjeta que
       explica la primera sección de algo que todavía no sabes qué es empieza
       por el medio. El logo hace de presentación: es lo único que el usuario
       ya vio (en el menú) y no ha podido relacionar con nada. */
    logo: true, color: "#5fe0b0", titulo: "Te doy la bienvenida",
    tx: "Norata lleva tu vida con la mecánica de un juego de rol: lo que <b>haces</b>, lo que <b>practicas</b>, lo que <b>te propones</b> y lo que <b>construyes</b>.",
    pie: "Son cuatro secciones. Te cuento en un minuto qué hace cada una."
  },
  {
    modulo: "missions", icon: "flame", color: "#f5d76e", titulo: "Misiones",
    tx: "Lo que haces <b>hoy</b>. Pequeñas y repetibles: salir a caminar, leer diez páginas. Cada vez que cumples una sube una habilidad y sigue viva tu racha.",
    pie: "Si dudas por dónde empezar, empieza aquí."
  },
  {
    modulo: "home", icon: "star", color: "#5fe0b0", titulo: "Habilidades",
    tx: "Lo que <b>practicas</b>. No se marcan como hechas: acumulan XP y suben de nivel con las horas que les dedicas.",
    pie: "Y si dejas una abandonada mucho tiempo, baja. El progreso se sostiene, no se guarda."
  },
  {
    modulo: "tree", icon: "gem", color: "#b7a2ea", titulo: "Talentos",
    tx: "Lo que <b>te propones</b>, en un mapa. Cada nodo es una compra, un hito o una meta, y se encadenan: unos abren el paso a otros.",
    pie: "Es el módulo para lo que cuesta dinero o meses, no para lo de esta tarde."
  },
  {
    modulo: "projects", icon: "flag", color: "#6fc3e8", titulo: "Proyectos",
    /* La misma frase que había en la pantalla vacía de Proyectos, y con el
       mismo error: describía un proyecto y lo llamaba encargo. Aquí pesa
       incluso más, porque esta tarjeta es donde alguien aprende cómo se llama
       cada cosa — si el módulo se llama Proyectos y el tutorial dice
       «encargos», el nombre queda torcido desde el primer minuto. */
    tx: "Los <b>proyectos</b> que te haces a ti: cosas que construyes por etapas, con principio y final. La app mide tu ritmo y te dice cuáles siguen vivos.",
    pie: "Un proyecto que lleva semanas quieto te lo dirá, sin regañarte."
  },
  {
    modulo: null, icon: "compass", color: "#5fe0b0", titulo: "Y todo se conecta",
    tx: "Una misión cumplida, un talento logrado o una etapa de proyecto terminan en el mismo sitio: <b>XP para tus habilidades</b>.",
    pie: "Puedes apagar los módulos que no uses desde Ajustes, y volver a ver esto cuando quieras."
  }
];

let tutoPaso = 0;

function pasosDelTutorial() {
  // Un módulo apagado no se explica: sería enseñar una puerta que no existe
  return TUTO_PASOS.filter(p => !p.modulo || moduloOn(p.modulo));
}

function arrancarTutorial() {
  tutoPaso = 0;
  renderTutorial();
  document.getElementById("tuto").classList.add("show");
}

/* El tutorial ANTES de elegir camino, no después.

   Antes salía al terminar el cuestionario, el ejemplo o la primera habilidad,
   con el argumento de que explicar los módulos con la app vacía es hablar de
   sitios que todavía no se pueden reconocer. En la práctica pasaba lo
   contrario: la primera pantalla pedía elegir entre tres caminos sin haber
   dicho nunca de qué va la app, y esa elección es justo la que necesita
   contexto.

   Solo en la entrada de verdad: con la portada delante quedaría detrás del
   formulario de acceso, y con datos ya dentro no es una presentación sino
   una interrupción. Las tres llamadas de después se quedan como estaban:
   `tutorialVisto` hace que no se repita, y cubren el caso de llegar a esos
   caminos sin haber pasado por aquí. */
function quizaTutorialDeEntrada() {
  if (state.ui && state.ui.tutorialVisto) return;
  if (document.getElementById("portada") || document.querySelector(".futuro-aviso")) return;
  if (typeof cargaVisible === "function" && cargaVisible()) return;
  if (hasLocalData()) return;
  quizaTutorial(500);
}

/* Se llama desde los tres caminos de entrada. El retraso deja terminar lo que
   estuviera en pantalla (la celebración del cuestionario dura lo suyo) para
   que las dos cosas no se pisen. */
function quizaTutorial(retraso) {
  if (state.ui && state.ui.tutorialVisto) return;
  setTimeout(arrancarTutorial, retraso || 400);
}

/* El logo de verdad, no una copia: se toma del menú, que ya lo lleva dibujado.
   Duplicar aquí un SVG de doscientas líneas garantizaría que un día los dos
   dejen de parecerse. */
function logoNorata() {
  const el = document.querySelector(".sb-logo-full");
  return el ? el.innerHTML : "";
}

function renderTutorial() {
  const pasos = pasosDelTutorial();
  const p = pasos[tutoPaso];
  if (!p) { cerrarTutorial(); return; }
  const ultimo = tutoPaso === pasos.length - 1;
  document.getElementById("tuto-card").innerHTML = `
    <!-- Salir es una X y no un botón grande: el botón compite con "Siguiente"
         justo cuando lo que queremos es que dé un paso más. -->
    <button class="tuto-x" onclick="saltarTutorial()" aria-label="Saltar tutorial" title="Saltar tutorial">✕</button>
    ${/* Las cinco filas van SIEMPRE, en el mismo orden y con la misma altura:
          marca, título, texto, resumen gris y puntos. Antes cada tarjeta
          medía lo que midiera su texto y el contenido bailaba de una a otra
          —el título subía, el gris se movía— aunque el alto total ya
          estuviera fijado. Homologar las filas, y no solo la tarjeta, es lo
          que hace que solo cambien las palabras. */""}
    <div class="tuto-marca">${p.logo
      ? `<span class="tuto-logo">${logoNorata()}</span>`
      : `<span class="tuto-ic" style="${tonos("tc", p.color)}">${icon(p.icon, 30)}</span>`}</div>
    <h2 class="tuto-titulo">${escapeHtml(p.titulo)}</h2>
    <p class="tuto-tx">${p.tx}</p>
    <p class="tuto-pie">${p.pie}</p>
    <div class="tuto-dots">${pasos.map((_, i) =>
      `<i class="${i === tutoPaso ? "on" : ""}"></i>`).join("")}</div>
    <div class="modal-actions">
      ${/* "Atrás" está siempre, apagado en la primera. Quitarlo movía de sitio
            a "Siguiente" justo al pasar de la primera a la segunda, y ese es
            el botón que se pulsa cinco veces seguidas. */
        ""}<button class="btn btn-ghost" onclick="tutoAtras()" ${tutoPaso ? "" : "disabled"}>Atrás</button>
      <button class="btn btn-primary" onclick="tutoSiguiente()">${ultimo ? "Empezar" : "Siguiente"}</button>
    </div>`;
}

function tutoSiguiente() {
  tutoPaso++;
  if (tutoPaso >= pasosDelTutorial().length) { terminarTutorial(); return; }
  renderTutorial();
}

function tutoAtras() {
  if (tutoPaso === 0) return;
  tutoPaso--;
  renderTutorial();
}

function saltarTutorial() { terminarTutorial(); }

/* Saltarlo cuenta como haberlo visto: si volviera a salir, saltarlo dejaría
   de ser una salida y pasaría a ser un aplazamiento. */
function terminarTutorial() {
  state.ui = state.ui || {};
  state.ui.tutorialVisto = true;
  save();
  cerrarTutorial();
}

function cerrarTutorial() {
  const el = document.getElementById("tuto");
  if (el) el.classList.remove("show");
}

function verTutorialOtraVez() {
  showView("summary");
  arrancarTutorial();
}

document.addEventListener("keydown", (e) => {
  const el = document.getElementById("tuto");
  if (!el || !el.classList.contains("show")) return;
  if (e.key === "Escape") { e.preventDefault(); saltarTutorial(); }
  else if (e.key === "Enter" || e.key === "ArrowRight") { e.preventDefault(); tutoSiguiente(); }
  else if (e.key === "ArrowLeft") { e.preventDefault(); tutoAtras(); }
});

/* ================= Ejemplos ================= */

/* ---- El ejemplo se MIRA, no se carga ----
   Antes esto escribía: metía catorce talentos, tres ramas, seis habilidades y
   cuatro misiones en la cuenta de verdad, guardaba y las subía al servidor. Y
   no había vuelta atrás — para deshacerlo había que ir a Ajustes y borrarlo
   todo, que se lleva por delante también lo que fuera tuyo.

   Ahora es lo que dice el botón: un previsualizador. Se aparta el estado real
   en memoria, se enseña el ejemplo encima, y al salir vuelve todo como
   estaba. Nada toca el disco ni el servidor mientras dure (ver `modoEjemplo`
   en 01-base.js), así que dentro se puede tocar TODO sin miedo: cumplir
   misiones, mover el árbol, abrir cajas. Eso es justamente lo que se viene a
   probar, y una demo que no se deja tocar no demuestra nada.

   Se parte de un lienzo limpio en vez de añadir el ejemplo encima de lo que
   hubiera. Hoy da igual —el botón solo sale con la app vacía—, pero mezclar
   catorce talentos inventados con los tuyos haría imposible saber cuál era
   cuál, y deja el botón listo para ponerlo donde haga falta. */
let estadoAntesDelEjemplo = null;

function verElEjemplo() {
  if (modoEjemplo) return;
  estadoAntesDelEjemplo = JSON.parse(JSON.stringify(state));
  modoEjemplo = true;

  /* La zona horaria y los ajustes se quedan: son de la persona, no de los
     datos, y con otra zona el ejemplo enseñaría las rachas movidas. */
  COLECCIONES.forEach(c => { state[c] = []; });
  state.borrados = {};
  state.ui = Object.assign({}, state.ui || {}, { ramasTalentos: [], ramasProyectos: [] });

  loadExamples();
  pintarAvisoEjemplo();
}

function salirDelEjemplo() {
  if (!modoEjemplo) return;
  state = estadoAntesDelEjemplo;
  estadoAntesDelEjemplo = null;
  modoEjemplo = false;
  pintarAvisoEjemplo();

  /* Si había algo pendiente de subir de ANTES de entrar, se vuelve a poner en
     cola. No se llama a `syncTouch` —eso pisaría `dirtyAt` con la hora de
     ahora y le mentiría al desempate de la fusión sobre cuándo se tocó de
     verdad—: se rearma el temporizador y nada más. */
  try {
    if (syncReady() && sync.dirty) {
      clearTimeout(syncTimer);
      syncTimer = setTimeout(() => syncRun({ silent: true }), SYNC_DELAY);
    }
  } catch (e) { /* sin sincronía no hay nada que rearmar */ }

  showView("summary");
  toast("Saliste del ejemplo. Tus datos están como los dejaste.", "hecho");
}

/* El rótulo, y la única salida. Es el mismo trato que el de «Cuenta de
   pruebas»: si la app enseña algo que no es real, tiene que decirlo en
   pantalla y no en un menú. La diferencia es que éste lleva botón, porque
   aquí sí hay de dónde salir.

   **En la cuenta de pruebas el aviso se calla y deja solo la salida.** Lo pidió
   Eduardo y el motivo es bueno: el rótulo existe para que nadie confunda datos
   inventados con los suyos, y quien acaba de pulsar «Ver un ejemplo» desde la
   trastienda no puede confundirse — ya lo sabe. Lo que sí estorba es tener una
   pastilla encima de la cabecera mientras se juzga cómo se ve la app, que es
   justo para lo que se entra al ejemplo desde ahí.

   El botón NO se quita, y esa parte no es negociable: es la única forma de
   salir del ejemplo. Sin él, apagar el rótulo dejaría a alguien encerrado
   mirando datos que no son suyos. */
function pintarAvisoEjemplo() {
  /* El rótulo del ejemplo y el de la cuenta de pruebas son la misma barra desde
     0.7.50 (ver `pintarAvisos` en `js/10c-portada.js`): dos pastillas apiladas
     tapaban el título de la pantalla. Aquí solo queda la puerta de entrada, con
     su guarda por si este archivo corre antes que aquél. */
  if (typeof pintarAvisos === "function") { pintarAvisos(); return; }
  document.body.classList.toggle("ejemplo-on", modoEjemplo);
}

/* Ejemplo pensado para que cualquiera entienda el sistema de un vistazo:
   habilidades cotidianas y una rama que muestra los tres tipos de talento
   encadenados, del primer paso a la meta grande. */
function loadExamples() {
  const today = todayKey();
  const daysAgo = (n) => addDaysKey(todayKey(), -n);

  const mkS = (name, category, iconName, color, xp, permanent, lastAct) => ({
    id: uid(), name, category, icon: iconName, color, xp,
    permanent: !!permanent, graceDays: 7, decayPerDay: 10,
    createdAt: daysAgo(30), lastActivity: lastAct || (xp > 0 ? today : null), lastCheck: today,
    log: xp > 0 ? [{ date: lastAct || today, xp, note: "Nivel inicial estimado" }] : []
  });

  const ejercicio = mkS("Ejercicio", "Salud", "dumbbell", "#ff8a70", 340, false, today);
  const cocina    = mkS("Cocina", "Casa", "coffee", "#f5d76e", 180, false, today);
  const idiomas   = mkS("Idiomas", "Aprendizaje", "globe", "#6fc3e8", 520, false, daysAgo(2));
  const finanzas  = mkS("Finanzas", "Vida adulta", "coin", "#5fe0b0", 90, false, daysAgo(1));
  const creativo  = mkS("Dibujo", "Creatividad", "brush", "#b7a2ea", 60, false, daysAgo(3));
  /* Existe para que "Renovar la cocina" tenga dónde caer. Es justo el
     ejemplo con el que se explica el léxico: ahí "cocina" es el lugar y
     "renovar" la actividad, así que el XP es de Reparaciones. */
  const reparaciones = mkS("Reparaciones", "Casa", "wrench", "#9aa7b8", 120, false, daysAgo(2));
  state.skills.push(ejercicio, cocina, idiomas, finanzas, creativo, reparaciones);

  /* Cuatro más en cero, sin misión ni talento detrás. El ejemplo no es solo
     una demostración de lo que la app hace: también enseña cómo se ve una
     habilidad que aún no has empezado, que es la mitad de la idea. */
  ["Lectura", "Jardinería", "Fotografía", "Pesca"].forEach(nombre => {
    const c = SKILL_CATALOG.find(x => x.n === nombre);
    if (c) state.skills.push(mkS(c.n, c.c, c.i, c.k, 0, false, null));
  });

  const mkP = (extra) => Object.assign({
    id: uid(), branch: "Salud", desc: "", tipo: "meta", cost: 0, planDays: 90, steps: [],
    skillId: ejercicio.id, xpReward: 150, requiere: [], modo: "todos", icon: "star", color: "#5fe0b0",
    status: null, startDate: null, endDate: null, completedAt: null,
    investedTotal: 0, progress: 0, createdAt: today,
    history: [{ date: today, at: stamp(), event: "Talento creado" }]
  }, extra);

  /* ---- Rama Salud: el ejemplo grande ----
     Es la que enseña de qué va el módulo, así que lleva las tres clases de
     talento, una convergencia de las dos maneras, una meta con sus etapas a
     medias y una caja del ático ya guardada. Las otras dos ramas se quedan
     pequeñas a propósito: si todas fueran densas, no se vería que una rama
     puede ser sencilla. */
  const tenis = mkP({
    name: "Tenis para correr", icon: "bolt", color: "#ff8a70",
    desc: "Comprarlos es el primer paso: son tuyos desde que los pagas, sin plazo que cumplir.",
    tipo: "compra", cost: 1800, xpReward: 80,
    status: "completed", completedAt: daysAgo(20), investedTotal: 1800,
    history: [
      { date: daysAgo(20), at: new Date(Date.now() - 20 * 864e5).toISOString(), event: "Comprada y asegurada ($1,800)" },
      { date: daysAgo(21), at: new Date(Date.now() - 21 * 864e5).toISOString(), event: "Talento creado en la rama Salud" }
    ]
  });
  const primeraSalida = mkP({
    name: "Salir a correr una vez", icon: "flag", color: "#f5d76e", tipo: "hito",
    desc: "Un hito: una acción puntual que se cierra en sí misma. Se marca con un toque.",
    xpReward: 40, requiere: [tenis.id],
    status: "completed", completedAt: daysAgo(18),
    history: [{ date: daysAgo(18), at: new Date(Date.now() - 18 * 864e5).toISOString(), event: "Hito conseguido" }]
  });
  const habito = mkP({
    name: "Correr 3 veces por semana", icon: "flame", color: "#ff8a70",
    desc: "Una meta: tienes 3 meses y avanza marcando sus etapas.",
    planDays: 90, xpReward: 300, requiere: [primeraSalida.id],
    status: "active", startDate: daysAgo(16),
    endDate: addDaysKey(todayKey(), 74),
    steps: [
      { id: uid(), name: "Primera semana completa", done: true, at: stamp() },
      { id: uid(), name: "Cuatro semanas seguidas", done: true, at: stamp() },
      { id: uid(), name: "Ocho semanas seguidas", done: false, at: null },
      { id: uid(), name: "Las doce semanas", done: false, at: null }
    ],
    history: [
      { date: daysAgo(4), at: new Date(Date.now() - 4 * 864e5).toISOString(), event: "Etapa hecha: Cuatro semanas seguidas" },
      { date: daysAgo(16), at: new Date(Date.now() - 16 * 864e5).toISOString(), event: "Inversión de $0 — plan de 3 meses iniciado" }
    ]
  });
  /* Un segundo camino que nace del mismo sitio: enseña que el árbol se abre
     en abanico, no solo en cadena. */
  const reloj = mkP({
    name: "Reloj con pulsómetro", icon: "target", color: "#6fc3e8",
    desc: "Para saber si corres al ritmo que crees que corres.",
    tipo: "compra", cost: 2400, xpReward: 90, requiere: [primeraSalida.id]
  });
  const tecnica = mkP({
    name: "Corregir mi técnica", icon: "bulb", color: "#b7a2ea",
    desc: "Tres sesiones grabándome y ajustando la zancada.",
    planDays: 60, xpReward: 200, requiere: [reloj.id],
    steps: [
      { id: uid(), name: "Grabarme corriendo", done: false, at: null },
      { id: uid(), name: "Comparar con una referencia", done: false, at: null },
      { id: uid(), name: "Tres salidas aplicando el cambio", done: false, at: null }
    ]
  });
  /* EL NODO QUE CORONA: necesita el hábito Y la técnica. Es la figura que
     antes no se podía dibujar, y por eso el ejemplo la trae. */
  const carrera = mkP({
    name: "Correr mi primera carrera de 5 km", icon: "trophy", color: "#5fe0b0",
    desc: "La meta grande: hace falta el hábito Y la técnica. Es un talento que corona dos caminos.",
    cost: 450, planDays: 180, xpReward: 600,
    requiere: [habito.id, tecnica.id], modo: "todos"
  });
  /* CAMINO ALTERNATIVO: vale con cualquiera de los dos. Enseña el otro modo
     sin tener que buscarlo en un menú. */
  const club = mkP({
    name: "Entrar a un club de corredores", icon: "smile", color: "#f0a5c0", tipo: "hito",
    desc: "Basta con tener el hábito O haber corrido una carrera: cualquiera de los dos te abre la puerta.",
    xpReward: 120, requiere: [habito.id, carrera.id], modo: "cualquiera"
  });

  /* Lo del trimestre pasado, para que el ático se vea funcionando desde el
     primer momento y no haya que esperar tres meses a entenderlo. */
  const viejoTrim = trimestreDe(addDaysKey(todayKey(), -140));
  const finDeTrim = addDaysKey(todayKey(), -140);
  const revision = mkP({
    name: "Revisión médica", icon: "heart", color: "#8fd18a", tipo: "hito",
    desc: "Antes de empezar a correr en serio, saber cómo estoy.",
    xpReward: 60, status: "completed", completedAt: finDeTrim, createdAt: finDeTrim,
    history: [{ date: finDeTrim, at: new Date(Date.now() - 140 * 864e5).toISOString(), event: "Hito conseguido" }]
  });
  const bici = mkP({
    name: "Bicicleta de segunda mano", icon: "bolt", color: "#9aa7b8",
    desc: "El intento anterior. Sirvió para descubrir que lo mío es correr.",
    tipo: "compra", cost: 3200, xpReward: 70, status: "completed",
    completedAt: finDeTrim, createdAt: finDeTrim, investedTotal: 3200,
    history: [{ date: finDeTrim, at: new Date(Date.now() - 140 * 864e5).toISOString(), event: "Comprada y asegurada ($3,200)" }]
  });
  const natacion = mkP({
    name: "Natación dos veces por semana", icon: "goggles", color: "#6fc3e8",
    desc: "Se quedó a medias, y por eso viaja en la caja: guardar el trimestre no juzga lo que no terminaste.",
    planDays: 90, xpReward: 250, createdAt: finDeTrim,
    status: "active", startDate: finDeTrim, endDate: addDaysKey(finDeTrim, 90),
    congeladoEl: addDaysKey(todayKey(), -120),
    steps: [
      { id: uid(), name: "Cuatro semanas seguidas", done: true, at: stamp() },
      { id: uid(), name: "Ocho semanas seguidas", done: false, at: null }
    ],
    history: [{ date: finDeTrim, at: new Date(Date.now() - 140 * 864e5).toISOString(), event: "Plan de 3 meses iniciado" }]
  });

  // Rama Casa: dos caminos independientes que nacen del mismo punto
  const recetario = mkP({
    branch: "Casa", skillId: cocina.id, name: "Curso de cocina básica", icon: "cap", color: "#f5d76e",
    desc: "Aprender diez recetas que puedas hacer sin receta.",
    cost: 990, planDays: 120, xpReward: 250
  });
  const cenaAmigos = mkP({
    branch: "Casa", skillId: cocina.id, name: "Cocinar para amigos", icon: "heart", color: "#f0a5c0", tipo: "hito",
    desc: "Invitar a alguien y cocinarle. Sin plazo: se logra o no se logra.",
    xpReward: 60, requiere: [recetario.id]
  });

  // Rama Dinero: un talento listo para empezar, con costo real
  const fondo = mkP({
    branch: "Dinero", skillId: finanzas.id, name: "Fondo de emergencia", icon: "gem", color: "#5fe0b0",
    desc: "Juntar tres meses de gastos. Un año de plazo para lograrlo.",
    planDays: 365, xpReward: 500
  });
  const curso = mkP({
    branch: "Dinero", skillId: finanzas.id, name: "Curso de inversión", icon: "chart", color: "#6fc3e8",
    desc: "Entender en qué invertir antes de invertir.",
    cost: 1500, planDays: 180, xpReward: 350, requiere: [fondo.id]
  });

  state.perks.push(tenis, primeraSalida, habito, reloj, tecnica, carrera, club,
    revision, bici, natacion, recetario, cenaAmigos, fondo, curso);

  // La caja ya guardada, con lo del trimestre viejo dentro
  state.cajas = [{
    id: uid(), branch: "Salud", trimestre: viejoTrim, guardadoEl: addDaysKey(todayKey(), -120),
    abierta: false, perkIds: [revision.id, bici.id, natacion.id]
  }];

  loadProjectExamples(true);
  loadMissionExamples(true);
  /* `save()` estaba aquí y es lo que había que quitar. En modo ejemplo no
     escribiría igualmente —`guardarLocal` lo para—, pero dejarlo puesto haría
     creer que el ejemplo se guarda, que es justo la confusión que se está
     arreglando. Lo que sí hace falta es repintar: sin `save()` nadie lo hacía.

     Sigue siendo una función aparte de `verElEjemplo` porque construir el
     ejemplo y decidir dónde ponerlo son dos cosas: si algún día hay que
     enseñarlo en otro sitio, se reusa esto sin arrastrar el modo. */
  showView("summary");
  toast("Así se ve Norata en uso. Nada de esto se guarda: sal cuando quieras.");
  quizaTutorial(700);
}

/* Misiones de ejemplo: una diaria con racha viva, una de varias veces al día,
   una de días sueltos y una de un solo uso. */
function loadMissionExamples(silent) {
  const daysAgo = (n) => addDaysKey(todayKey(), -n);
  const skillBy = (name) => (state.skills.find(s => s.name === name) || {}).id || null;
  const streakLog = (n, val) => {
    const log = {};
    for (let i = 1; i <= n; i++) log[daysAgo(i)] = val;
    return log;
  };

  state.missions.push(
    {
      id: uid(), name: "Caminar 20 minutos", desc: "Cuenta cualquier caminata seguida de 20 min o más.",
      icon: "bolt", color: "#ff8a70", cadence: "daily", days: [], target: 1,
      skillId: skillBy("Ejercicio"), xp: 20, log: streakLog(4, 1),
      archived: false, completedAt: null, createdAt: daysAgo(30)
    },
    {
      id: uid(), name: "Beber agua", desc: "Ocho vasos a lo largo del día.",
      icon: "heart", color: "#6fc3e8", cadence: "daily", days: [], target: 8,
      skillId: null, xp: 10, log: Object.assign(streakLog(3, 8), { [todayKey()]: 3 }),
      archived: false, completedAt: null, createdAt: daysAgo(20)
    },
    {
      id: uid(), name: "Practicar idioma 15 min", desc: "Lecciones, video o conversación.",
      icon: "globe", color: "#5fe0b0", cadence: "weekly", days: [1, 3, 5], target: 1,
      skillId: skillBy("Idiomas"), xp: 25, log: streakLog(2, 1),
      archived: false, completedAt: null, createdAt: daysAgo(25)
    },
    {
      id: uid(), name: "Cocinar algo nuevo", desc: "Una receta que nunca hayas hecho.",
      icon: "coffee", color: "#f5d76e", cadence: "weekly", days: [0, 6], target: 1,
      skillId: skillBy("Cocina"), xp: 30, log: {},
      archived: false, completedAt: null, createdAt: daysAgo(14)
    },
    {
      id: uid(), name: "Revisar mis suscripciones", desc: "Cancelar lo que ya no uso.",
      icon: "coin", color: "#b7a2ea", cadence: "once", days: [], target: 1,
      skillId: skillBy("Finanzas"), xp: 40, log: {},
      archived: false, completedAt: null, createdAt: daysAgo(5)
    }
  );
  if (!silent) { save(); renderMissions(); toast("Misiones de ejemplo cargadas"); }
}

/* Proyectos de ejemplo: uno con ritmo, uno casi listo y uno estancado,
   para que se vea de inmediato para qué sirve el veredicto de salud. */
function loadProjectExamples(silent) {
  const daysAgo = (n) => addDaysKey(todayKey(), -n);
  const skillBy = (name) => (state.skills.find(s => s.name === name) || {}).id || null;
  const steps = (arr) => arr.map(([name, done]) => ({ id: uid(), name, done: !!done, at: done ? stamp() : null }));

  state.projects.push(
    {
      id: uid(), name: "Renovar la cocina", branch: "Casa", icon: "wrench", color: "#f5d76e",
      desc: "Dejar la cocina funcional y ordenada, sin obra mayor.",
      status: "active", skillId: skillBy("Reparaciones"), xpReward: 250,
      steps: steps([["Medir y hacer lista de lo que falta", true], ["Comprar organizadores", true], ["Ordenar alacena", false], ["Cambiar la iluminación", false]]),
      createdAt: daysAgo(24), lastActivity: daysAgo(2), completedAt: null,
      history: [
        { date: daysAgo(2), at: new Date(Date.now() - 2 * 864e5).toISOString(), event: "Etapa completada: Comprar organizadores" },
        { date: daysAgo(24), at: new Date(Date.now() - 24 * 864e5).toISOString(), event: "Encargo creado en el proyecto Casa" }
      ]
    },
    {
      id: uid(), name: "Curso de inglés en línea", branch: "Aprender", icon: "cap", color: "#6fc3e8",
      desc: "Terminar los módulos y presentar la evaluación final.",
      status: "active", skillId: skillBy("Idiomas"), xpReward: 400,
      steps: steps([["Módulos 1 a 4", true], ["Módulos 5 a 8", true], ["Práctica de conversación", true], ["Evaluación final", false]]),
      createdAt: daysAgo(60), lastActivity: daysAgo(3), completedAt: null,
      history: [
        { date: daysAgo(3), at: new Date(Date.now() - 3 * 864e5).toISOString(), event: "Etapa completada: Práctica de conversación" },
        { date: daysAgo(60), at: new Date(Date.now() - 60 * 864e5).toISOString(), event: "Encargo creado en el proyecto Aprender" }
      ]
    },
    {
      id: uid(), name: "Tienda en línea de artesanías", branch: "Negocio", icon: "coin", color: "#ff8a70",
      desc: "Vender lo que hago sin depender de redes sociales.",
      status: "active", skillId: skillBy("Finanzas"), xpReward: 600,
      steps: steps([["Definir catálogo", true], ["Fotos de producto", false], ["Montar la tienda", false], ["Primera venta", false]]),
      createdAt: daysAgo(120), lastActivity: daysAgo(58), completedAt: null,
      history: [
        { date: daysAgo(58), at: new Date(Date.now() - 58 * 864e5).toISOString(), event: "Etapa completada: Definir catálogo" },
        { date: daysAgo(120), at: new Date(Date.now() - 120 * 864e5).toISOString(), event: "Encargo creado en el proyecto Negocio" }
      ]
    }
  );
  if (!silent) { save(); renderProjects(); toast("Proyectos de ejemplo cargados"); }
}

/* ================= Zona horaria ================= */

const TZ_OPTIONS = [
  "America/Mexico_City", "America/Tijuana", "America/Monterrey", "America/Cancun",
  "America/Bogota", "America/Lima", "America/Santiago", "America/Argentina/Buenos_Aires",
  "America/Sao_Paulo", "America/New_York", "America/Chicago", "America/Denver",
  "America/Los_Angeles", "Europe/Madrid", "Europe/London", "UTC"
];

function detectedTZ() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch (e) { return "UTC"; }
}

/* ================= Ajustes por secciones =================
   Eran seis paneles uno detrás de otro en la misma tira: para cambiar la zona
   horaria había que pasar por delante de "borrar todos los datos". Ahora cada
   cosa vive en su sección y se llega a ella a propósito.

   La forma cambia con el tamaño porque el gesto disponible es distinto: en la
   computadora un índice a la izquierda y la sección abierta al lado —se ve
   dónde estás y qué más hay sin perder el sitio—; en el teléfono una lista
   que lleva a la sección y vuelve con la flecha, que es lo que hace cualquier
   app de ajustes en una pantalla estrecha. Los bloques son los mismos: lo que
   cambia es cómo se llega. */
/* Tres, no cinco. La zona horaria y la zona de peligro hablaban de lo mismo
   que los respaldos —con qué día se cuentan las cosas, cómo se guardan, cómo
   se borran— y tenerlas como entradas sueltas obligaba a recordar en cuál de
   las tres estaba cada cosa. Dentro de la sección van en el orden en que se
   piensan: primero qué cuenta como hoy, luego los respaldos, y borrar al
   final.

   Y los nombres dicen de quién es la cosa, no de qué va el panel. "Cuenta",
   "Secciones" y "Tus datos" describían el contenido desde fuera; "Mi perfil",
   "Mis módulos" y "Almacenamiento" se buscan solos cuando uno viene a cambiar
   algo suyo. */
const AJUSTES_SECS = [
  { id: "cuenta", nombre: "Mi perfil",         icon: "shield",  sub: "Tu sesión y la sincronía entre dispositivos" },
  { id: "plan",   nombre: "Mi plan",           icon: "gem",     sub: "Tu plan, qué incluye y hasta cuándo va" },
  { id: "menu",   nombre: "Mis módulos",       icon: "gamepad", sub: "Qué módulos aparecen en el menú" },
  { id: "aspecto", nombre: "Mi apariencia",    icon: "brush",   sub: "Con qué luz se ve Norata" },
  { id: "datos",  nombre: "Mi almacenamiento", icon: "book",    sub: "Zona horaria, respaldos, copias y borrado" }
];

/* Las secciones que se dibujan HOY, que no siempre son las tres de arriba: la
   de administración solo existe para quien el servidor reconoce como tal.
   Y conviene tener claro qué protege esto: nada. Es limpieza, no seguridad —
   un usuario no debería toparse con una pantalla que no le sirve. Quien
   quiera puede poner `esAdmin` a true desde la consola y lo único que verá es
   una pantalla vacía, porque los números los da el servidor tras comprobar
   quién pregunta (ver `supabase/administracion.sql`). */
function seccionesAjustes() {
  let secs = AJUSTES_SECS.map(sec => Object.assign({}, sec));

  /* «Mi apariencia» estuvo detrás de `?apariencia=` mientras el nivel de
     expedición no existía: sin escalera, ningún ambiente se puede desbloquear
     y enseñar cinco premios que nadie puede ganarse los regala. Desde que la
     escalera existe la sección es de todos, y el interruptor se queda por si
     hay que volver a apagarla (ver `APARIENCIA_PUBLICA`). */
  if (typeof aparienciaVisibleEnAjustes === "function" && !aparienciaVisibleEnAjustes())
    secs = secs.filter(x => x.id !== "aspecto");

  /* La fila del plan no puede decir lo mismo a todo el mundo: es la única de
     las cuatro cuyo contenido cambia de una cuenta a otra, y decía "Qué
     tienes abierto y cómo cambiarlo" —una frase que se puede leer entera sin
     enterarse de nada—. Ahora dice qué plan hay y hasta cuándo, que es
     exactamente lo que trae aquí a la gente; entrar deja de ser la única
     forma de saberlo. */
  const plan = secs.find(x => x.id === "plan");
  if (plan && typeof planSub === "function") {
    plan.sub = planSub();
    plan.icon = planIcono();
    if (typeof planTono === "function") plan.tono = planTono();
  }

  /* La de administración solo existe para quien el servidor reconoce como tal.
     Y conviene tener claro qué protege esto: nada. Es limpieza, no seguridad —
     un usuario no debería toparse con una pantalla que no le sirve. Quien
     quiera puede poner `esAdmin` a true desde la consola y lo único que verá es
     una pantalla vacía, porque los números los da el servidor tras comprobar
     quién pregunta (ver `supabase/administracion.sql`).

     Va en luciérnaga y no en menta, y con un nombre que no empieza por "Mi":
     las otras cuatro son ajustes de quien usa la app, y esta es la trastienda
     del negocio. Con el mismo verde y la misma forma parecía una quinta cosa
     tuya, y se abría sin querer. El icono es la gráfica porque lo que hay
     dentro son cifras — el mando de videojuego venía copiado de la fila de
     los módulos y no decía nada de esto. */
  if (typeof esAdmin !== "undefined" && esAdmin) {
    secs.push({
      id: "admin", nombre: "Norata por dentro", icon: "chart", tono: "oro",
      sub: "El modo de pruebas, cuánta gente la usa y lo que se rompe"
    });
  }
  return secs;
}

/* Qué sección se está viendo. En el teléfono, null significa "la lista"; en la
   computadora siempre hay una abierta, porque el índice y el contenido conviven
   y una columna vacía al lado del índice no dice nada. */
let ajusteAbierto = null;

function renderAjustes() {
  const nav = document.getElementById("ajustes-nav");
  const wrap = document.getElementById("ajustes-wrap");
  if (!nav || !wrap) return;
  const escritorio = isDesktop();
  if (escritorio && !ajusteAbierto) ajusteAbierto = AJUSTES_SECS[0].id;

  /* El sol y la luna van en el índice, no dentro de una sección. Son tres
     secciones a propósito (ver la nota de arriba) y el aspecto no es una
     cuarta: es un interruptor de dos posiciones que se resuelve de un toque
     y no tiene nada más dentro. Metido en "Mis módulos" o en
     "Almacenamiento" estaría escondido detrás de una puerta que habla de
     otra cosa. */
  nav.innerHTML = `<div class="tema-hueco">${temaSwitchHTML()}</div>` +
    seccionesAjustes().map(sec => `
    <button class="aj-item ${ajusteAbierto === sec.id ? "on" : ""} ${sec.tono ? "t-" + sec.tono : ""}"
      onclick="mostrarAjuste('${sec.id}')">
      <span class="aj-ic">${icon(sec.icon, 17)}</span>
      <span class="aj-tx"><b>${escapeHtml(sec.nombre)}</b><span>${escapeHtml(sec.sub)}</span></span>
      <span class="aj-chev" aria-hidden="true">›</span>
    </button>`).join("");

  wrap.classList.toggle("en-seccion", !!ajusteAbierto);
  /* Y la vista entera, para lo que vive FUERA del envoltorio: el botón de
     reportar un fallo y el número de versión, que cuelgan al pie del índice.
     Sin esta línea salían debajo de cada sección abierta. */
  const vista = document.getElementById("view-settings");
  if (vista) vista.classList.toggle("en-seccion", !!ajusteAbierto);
  document.querySelectorAll("#ajustes-cuerpo .ajuste-bloque").forEach(b => {
    b.classList.toggle("visible", b.dataset.sec === ajusteAbierto);
  });

  /* En el teléfono el título dice dónde estás, porque el índice ya no se ve.
     En la computadora sigue diciendo "Ajustes": el índice de al lado marca la
     sección y repetirlo arriba sería decir dos veces lo mismo. */
  /* El panel de números se dibuja al abrir su sección y no al arrancar: pedir
     las métricas cuesta una llamada al servidor, y no tiene sentido pagarla
     cada vez que alguien entra a Ajustes a cambiar la zona horaria. */
  if (ajusteAbierto === "aspecto" && typeof renderPanelApariencia === "function") renderPanelApariencia();
  if (ajusteAbierto === "admin" && typeof renderPanelAdmin === "function") renderPanelAdmin();
  if (ajusteAbierto === "plan" && typeof renderPanelPlan === "function") renderPanelPlan();
  /* La exigencia se dibuja al abrir «Mi perfil», que es donde vive desde que
     dejó de ser sección propia: quien viene a cambiarla viene a cambiar algo
     suyo, y ahí es donde están las otras cosas suyas. */
  if (ajusteAbierto === "cuenta") renderPanelRitmo();

  const abierta = seccionesAjustes().find(x => x.id === ajusteAbierto);
  const titulo = document.getElementById("ajustes-titulo");
  if (titulo) titulo.textContent = (!escritorio && abierta) ? abierta.nombre : "Ajustes";
}

/* ================= Mi exigencia =================
   Tres botones y, si hace falta, uno más para aplicarlo a lo que ya existe.

   La regla que separa las dos cosas: **cambiar el ajuste no toca ni una
   habilidad**. Es el valor con el que NACEN las nuevas, igual que la moneda no
   convierte los importes que ya escribiste. Tocar lo que ya existe se pide
   aparte y se dice cuántas van a cambiar, porque ahí sí se pisan los números
   que alguien pudo haber afinado a mano en una habilidad concreta. */
function renderPanelRitmo() {
  const wrap = document.getElementById("ritmo-opciones");
  if (!wrap) return;
  const actual = exigenciaActual();

  wrap.innerHTML = `<div class="ob-pace">${Object.values(EXIGENCIAS).map(p => `
    <button class="ob-pace-opt ${actual.id === p.id ? "on" : ""}" onclick="ponerExigencia('${p.id}')">
      <span class="op-ic" data-r="${p.id}">${icon(p.icono, 20)}</span>
      <span class="op-tx"><b>${p.nombre}</b><span>${p.dicho}</span></span>
    </button>`).join("")}</div>`;

  /* Solo las que decaen: una habilidad blindada no pierde XP nunca, así que
     sus dos números no significan nada y contarla infla el botón. */
  const desalineadas = state.skills.filter(s =>
    !s.permanent && (s.graceDays !== actual.grace || s.decayPerDay !== actual.decay));
  const zona = document.getElementById("ritmo-aplicar");
  if (!zona) return;

  if (!desalineadas.length) {
    zona.innerHTML = `<p class="settings-note" style="margin-top:14px">
      Las habilidades que crees a partir de ahora nacen así.${
      state.skills.length ? " Las que ya tienes también van con esta exigencia." : ""}</p>`;
    return;
  }

  zona.innerHTML = `
    <p class="settings-note" style="margin-top:14px">Esto es con lo que nacen las habilidades nuevas.
      ${desalineadas.length} de las tuyas van con otros números, porque las creaste antes o las
      ajustaste una por una.</p>
    <button class="btn btn-aviso btn-block" onclick="aplicarExigenciaATodas()">
      Aplicarlo también a ${desalineadas.length === 1 ? "esa habilidad" : `esas ${desalineadas.length} habilidades`}
    </button>`;
}

function ponerExigencia(id) {
  if (!EXIGENCIAS[id]) return;
  state.settings.exigencia = id;
  save();
  renderPanelRitmo();
  toast(`Exigencia: ${EXIGENCIAS[id].nombre}`, "hecho");
}

function aplicarExigenciaATodas() {
  const ex = exigenciaActual();
  let n = 0;
  state.skills.forEach(s => {
    if (s.permanent) return;
    if (s.graceDays === ex.grace && s.decayPerDay === ex.decay) return;
    s.graceDays = ex.grace;
    s.decayPerDay = ex.decay;
    n++;
  });
  if (!n) return;
  save();
  renderPanelRitmo();
  renderHome();
  toast(`${n} habilidad${n === 1 ? "" : "es"} con la exigencia ${ex.nombre.toLowerCase()}`, "hecho");
}

/* ---- El engrane ----
   En el teléfono abre la pantalla de Ajustes, que es donde el pulgar puede
   recorrer una lista. En la computadora abre un menú corto pegado al botón:
   se ve todo lo que hay de un vistazo y se entra directo a lo que se busca,
   sin cambiar de pantalla ni perder lo que estabas mirando. */
function ajustesClick(ev) {
  if (!isDesktop()) { showView("settings"); return; }
  // Segundo clic en el mismo botón: se cierra. Con el botón encendido, volver
  // a pulsarlo tiene que apagarlo; si no, no hay forma de cerrarlo desde ahí.
  const m = document.getElementById("ajustes-menu");
  if (m && m.classList.contains("show")) { cerrarMenuAjustes(); return; }
  const btn = (ev && (ev.currentTarget || ev.target)) || document.getElementById("settings-btn");
  abrirMenuAjustes(btn.closest("button") || btn);
}

function abrirMenuAjustes(btn) {
  const m = document.getElementById("ajustes-menu");
  if (!m || !btn) return;
  /* Arriba del todo, en qué cuenta estás. Es la pregunta que trae aquí a más
     gente que ninguna otra, y contestarla antes de abrir nada ahorra el viaje
     entero. Sin sesión, la misma fila invita a entrar. */
  const cfg = (typeof sync !== "undefined" && sync.cfg) || {};
  const dentro = typeof syncReady === "function" && syncReady();
  /* Y debajo del correo, el plan. Es la segunda pregunta que trae aquí a la
     gente —después de "¿en qué cuenta estoy?"— y hasta ahora había que abrir
     una sección para contestarla. La piedra de delante la contesta antes de
     leer: la desnuda es el plan libre, la tallada el Pro, la de la corona el
     fundador (ver los iconos `plan-*` en `js/01-base.js`).

     Toda la fila lleva a Mi perfil y no el plan a Mi plan: dos destinos
     dentro del mismo botón obligan a apuntar, y a este tamaño el renglón del
     plan mide once píxeles de alto. */
  const chapa = typeof planChapaHTML === "function" ? planChapaHTML() : "";
  /* La insignia del nivel, al otro extremo de la fila. Dos círculos con tres
     renglones de texto en medio: el de la izquierda dice quién eres y el de la
     derecha por dónde vas. El avatar sube de 38 a 48 para que la pareja se
     equilibre —lo eligió Eduardo comparando las dos familias a tamaño real—.

     El `typeof` es la misma guarda que usa `avatarHTML` con el plan: este
     archivo se carga antes que el resto y la fila se dibuja desde varios
     sitios. Un adorno no puede tumbar el menú de la cuenta. */
  const insignia = typeof insigniaExpedicionHTML === "function" ? insigniaExpedicionHTML(30) : "";
  /* La fila lleva a la COLECCIÓN y no a «Mi perfil», que tiene su propio
     botón tres renglones más abajo — o sea que no se pierde nada. Es el
     sitio natural: aquí es donde vive la insignia, y tocar tu insignia
     tiene que llevar a tu recorrido. */
  const ficha = dentro
    ? `<button class="mm-perfil" onclick="abrirColeccion()">
         ${avatarHTML(48)}
         <span class="mm-tx"><b>${escapeHtml(perfilActual().saludo || "Sin nombre")}</b>
         <span>${escapeHtml(cfg.correo || "")}</span>
         ${chapa}</span>
         ${insignia}
       </button>`
    : `<button class="mm-perfil" onclick="abrirAjustes('cuenta')">
         <span class="mm-ic">${icon("shield", 16)}</span>
         <span class="mm-tx"><b>Sin cuenta</b><span>Entra para sincronizar tus dispositivos</span>
         ${chapa}</span>
       </button>`;

  /* Sin el rótulo "AJUSTES" encima de la lista: el menú sale de un botón que
     ya dice Ajustes y que además queda iluminado justo debajo mientras está
     abierto. Repetirlo era decir dos veces lo mismo en cuatro centímetros. */
  /* Y abajo del todo, el sol y la luna. En la computadora este menú es el
     único sitio donde se ve el índice de Ajustes —la ventana lo esconde—,
     así que si el interruptor viviera solo allí, en el escritorio no habría
     forma de llegar a él. Va al final porque es lo que menos se cambia: lo
     que trae a alguien aquí casi siempre es su cuenta. */
  m.innerHTML = ficha + `
    ${seccionesAjustes().map(sec => `
      <button class="mm-item ${sec.tono ? "t-" + sec.tono : ""}" onclick="abrirAjustes('${sec.id}')">
        <span class="mm-ic">${icon(sec.icon, 16)}</span>
        <span class="mm-tx"><b>${escapeHtml(sec.nombre)}</b><span>${escapeHtml(sec.sub)}</span></span>
      </button>`).join("")}
    <div class="tema-hueco mm-tema">${temaSwitchHTML()}</div>`;
  m.classList.add("show");
  // Se coloca ya dibujado: antes de tener contenido no se sabe cuánto mide
  const r = btn.getBoundingClientRect();
  const caja = m.getBoundingClientRect();
  const hueco = 10;
  /* ARRIBA del botón, no al lado. Al lado quedaba en tierra de nadie: un
     panel flotando en mitad del contenido, lejos del borde, sin nada que lo
     atara a lo que lo había abierto. Ajustes vive abajo del todo de la barra,
     así que hacia arriba hay sitio de sobra y el menú crece desde su botón —
     que es el gesto que hace cualquier menú anclado a un pie.

     Alineado por la izquierda con el botón, y metido hacia dentro si no cabe:
     con la barra plegada el botón es una franja estrecha y el menú se saldría
     por la derecha. */
  let x = r.left;
  if (x + caja.width > window.innerWidth - 8) x = window.innerWidth - 8 - caja.width;
  x = Math.max(8, x);
  /* Y si el menú fuera más alto que lo que queda por encima —una ventana muy
     baja—, en vez de salirse por arriba se apoya en el techo. */
  let y = Math.max(12, r.top - caja.height - hueco);
  m.style.left = Math.round(x) + "px";
  m.style.top = Math.round(y) + "px";
  // El botón se queda encendido mientras el menú está puesto: es lo que dice
  // de dónde ha salido, y sin eso el menú parecía venir de ningún sitio.
  marcarEngraneAbierto(true);
}

/* El mismo verde de la sección activa. No es un estado nuevo que inventarse:
   mientras el menú está abierto, Ajustes ES donde estás. */
function marcarEngraneAbierto(abierto) {
  ["nav-settings-side", "settings-btn"].forEach(id => {
    const b = document.getElementById(id);
    if (b) b.classList.toggle("abierto", !!abierto);
  });
}

function cerrarMenuAjustes() {
  const m = document.getElementById("ajustes-menu");
  if (m) m.classList.remove("show");
  marcarEngraneAbierto(false);
}

/* Un clic en cualquier otro sitio lo cierra: un menú que se queda puesto
   estorba más de lo que ayuda. En captura, para enterarse antes que el clic
   que abre otra cosa. */
document.addEventListener("pointerdown", (e) => {
  const m = document.getElementById("ajustes-menu");
  if (!m || !m.classList.contains("show")) return;
  if (e.target.closest("#ajustes-menu") || e.target.closest("#settings-btn") || e.target.closest("#nav-settings-side")) return;
  cerrarMenuAjustes();
}, true);

/* ---- De vuelta a la pantalla ----
   Aquí hubo una ventana: el mini menú abría una caja flotante con la sección
   dentro. Se retiró por dos motivos, y el segundo pesa más que el primero.

   El primero es que se rompía. La ventana solo existía en la computadora, así
   que al encoger el navegador había que devolver el contenido a su sitio a
   mano, y ese trasplante —los bloques VIAJAN, no se duplican, porque los ids
   son únicos— dejaba a medias los ajustes de la caja: quien encogía la
   ventana estando dentro se encontraba Ajustes con una pinta que ya no era la
   de ninguno de los dos tamaños.

   El segundo es que la pantalla se usa mejor. Dentro de la caja no cabía el
   índice —repetir las cinco filas al lado de la que acabas de elegir era
   preguntar otra vez lo mismo—, así que para cambiar de sección había que
   cerrar, volver al engrane y elegir de nuevo. En la pantalla el índice vive
   a la izquierda y cambiar de sección es un clic.

   El mini menú se queda: sigue siendo el atajo que lleva directo a la sección
   que buscas sin pasar por la lista. Lo único que cambia es dónde aterriza. */
/* ================= Reportar un fallo =================
   El botón del bicho, abajo a la derecha.

   No abre un formulario nuevo ni una tabla nueva: reusa `apuntar_tropiezo`,
   que es por donde ya entran los errores que la app caza sola, y así los
   reportes de la gente aparecen en el mismo panel y en la misma lista. Un
   buzón aparte habría que acordarse de mirarlo; éste ya se mira.

   Se apunta con `donde: "reporte"` para poder distinguirlos de un vistazo de
   los automáticos: los de la gente valen más porque traen contexto de lo que
   estaba intentando hacer, y mezclarlos sin marca los enterraría entre cien
   volcados de JavaScript.

   Funciona SIN sesión, igual que los automáticos. Es deliberado: quien no
   puede entrar es justo quien más necesita poder avisar de que no puede
   entrar. */
/* Dónde puede haber pasado. Sale de `MODULOS` para no tener dos listas de
   pantallas que se separen el día que se añada una, más las tres que no son
   módulos: la entrada, Ajustes y un cajón para lo que no encaje.

   Se ofrece como lista y no como campo libre por lo mismo que existe el
   formulario: escribir cansa. Un toque contesta la pregunta que más ahorra al
   buscar el fallo. */
function lugaresDeFallo() {
  const mods = (typeof MODULOS !== "undefined" ? MODULOS : []).map(m => [m.id, m.label]);
  return mods.concat([
    ["settings", "Ajustes"],
    ["entrada", "Al entrar o cerrar sesión"],
    ["otro", "Otra parte"]
  ]);
}

/* ---- El formulario de reportar ----
   Tres campos y ni uno más, y el número es la decisión: «no extenso que si no
   no lo van a querer reportar», palabras de Eduardo. Los tres son los que
   convierten un aviso inservible en uno accionable:

     dónde   una lista, un toque, cero escritura
     antes   qué hacías justo antes — es lo que permite REPRODUCIRLO
     qué     lo que salió mal, con sitio para contarlo

   Solo el último es obligatorio: quien está enfadado escribe una línea y se
   va, y perder ese reporte por exigirle dos casillas más sería cambiar un
   dato por ninguno.

   El bicho va ARRIBA DEL TÍTULO y no dentro del cuerpo: es el mismo sitio
   donde el resto de la app pone el icono de un cuadro (ver `askBase`), y
   además ata visualmente el cuadro con la bolita que se acaba de pulsar. */
async function reportarFallo() {
  const aqui = (typeof activeMainView !== "undefined" && activeMainView) ? activeMainView : "otro";
  const lugares = lugaresDeFallo();
  /* La pantalla en la que está ahora viene marcada de partida: nueve de cada
     diez veces el fallo se reporta donde acaba de pasar, y así el campo ya
     está contestado antes de leerlo. */
  const porDefecto = lugares.some(([id]) => id === aqui) ? aqui : "otro";

  /* El párrafo de entrada, y va antes de los tres campos por una razón que
     no es de adorno: alguien que acaba de tropezar con un fallo está molesto,
     y lo primero que lee no puede ser una casilla. Dice para qué sirve lo que
     va a escribir —que alguien lo lee y lo arregla— y que no hace falta saber
     nada técnico. Dos frases: la tercera ya no se lee. */
  const cuerpo =
    '<span class="rep-intro">Cuéntame qué pasó y lo reviso. No necesitas saber nada técnico: con lo que recuerdes me basta para encontrarlo.</span>' +
    '<label class="rep-campo">' +
      '<span class="rep-rot">¿Dónde pasó?</span>' +
      '<select id="rep-donde">' +
        lugares.map(([id, txt]) =>
          '<option value="' + escapeAttr(id) + '"' + (id === porDefecto ? " selected" : "") + '>' +
          escapeHtml(txt) + '</option>').join("") +
      '</select>' +
    '</label>' +
    '<label class="rep-campo">' +
      '<span class="rep-rot">¿Qué hacías justo antes? <i>Opcional</i></span>' +
      '<input type="text" id="rep-antes" maxlength="80" placeholder="Ej. Abrí un talento desde el mapa">' +
    '</label>' +
    '<label class="rep-campo">' +
      '<span class="rep-rot">¿Qué salió mal?</span>' +
      '<textarea id="rep-que" rows="3" maxlength="' + MOTIVO_MAX + '" placeholder="La pantalla se quedó en blanco y no volvió."></textarea>' +
      '<span class="modal-cuenta" id="modal-cuenta">0 / ' + MOTIVO_MAX + '</span>' +
    '</label>';

  /* Oro y no menta, y lo eligió Eduardo: un fallo no es un logro ni una venta.
     El oro es el tono de «esto tiene un coste que quizá no ves» (ver la nota
     de `askBase`), y aquí el coste es el rato que alguien acaba de perder.

     El título va en BLANCO aunque el cuadro sea oro: en amarillo competía con
     el icono, que es lo único que debe llamar la atención ahí arriba. Lo pone
     la clase `reporte`, junto con el resto del estilo propio del cuadro.

     Y el botón de enviar es `btn-linea` —fondo oscuro, borde menta— en vez del
     verde macizo: el macizo es «lo que has venido a hacer», y aquí nadie ha
     venido a esto. Mandar un reporte es un favor, no la acción de la
     pantalla. */
  const p = askBase(cuerpo, true, "Enviar", false, false, "Cancelar",
                    { icono: "bicho", titulo: "¿Qué salió mal?", tono: "oro",
                      clase: "reporte", okClase: "btn-linea" });

  /* `setTimeout` y no `requestAnimationFrame`, igual que en `askText`: el
     cuadro tiene que quedar listo aunque la pestaña esté en segundo plano, y
     ahí los cuadros de animación no llegan. */
  setTimeout(() => {
    const ta = document.getElementById("rep-que");
    const cuenta = document.getElementById("modal-cuenta");
    if (ta) ta.focus();
    if (ta && cuenta) {
      const pintar = () => {
        cuenta.textContent = ta.value.length + " / " + MOTIVO_MAX;
        cuenta.classList.toggle("lleno", ta.value.length >= MOTIVO_MAX);
      };
      ta.addEventListener("input", pintar);
      pintar();
    }
  }, 0);

  const ok = await p;
  /* Los tres se leen ANTES de que el modal se reutilice: el siguiente cuadro
     reescribe el cuerpo y para entonces vuelven vacíos. */
  const selDonde = document.getElementById("rep-donde");
  const elAntes = document.getElementById("rep-antes");
  const elQue = document.getElementById("rep-que");
  if (!ok) return;

  const que = elQue ? limpiarLibre(elQue.value) : "";
  if (!que) { toast("No mandé nada: falta contar qué salió mal.", "atencion"); return; }

  const idDonde = selDonde ? selDonde.value : "otro";
  const nombreDonde = (lugares.find(([id]) => id === idDonde) || [null, idDonde])[1];
  const antes = elAntes ? limpiarLibre(elAntes.value) : "";

  /* Un solo renglón por campo y con etiqueta delante: esto acaba en una lista
     del panel donde cada fila se lee de un vistazo, y un párrafo corrido
     obligaría a leerlo entero para saber dónde fue.

     El servidor recorta a 300 (ver `apuntar_tropiezo`), así que lo primero que
     se escribe es lo que más ahorra al buscar —el dónde—, y lo que se pierde
     si el mensaje es largo es la cola, no la cabecera. */
  const mensaje = "[" + nombreDonde + "] " + que + (antes ? " · antes: " + antes : "");

  const enviado = await sbTropiezo("reporte", mensaje);
  if (enviado) {
    /* Una ventana y no un aviso de los de abajo, y es lo que pidió Eduardo:
       quien acaba de escribir tres campos ha hecho un trabajo, y un mensajito
       que se desvanece en tres segundos lo trata como si hubiera pulsado un
       botón cualquiera. La ventana le da acuse de recibo de verdad y dice las
       dos cosas que quiere saber: que llegó, y que alguien lo va a leer. */
    /* Con `askBase` y no con `avisar`/`avisarOro`: los dos nacieron para
       advertir —van con `danger` y `alarm`, o sea coral y sacudida de
       pantalla— y aquí no se advierte de nada. Un «gracias» que tiembla es un
       susto. Sin cancelar, porque no hay nada que cancelar, y sin `fijo`:
       quien ya leyó las dos líneas puede cerrar tocando fuera. */
    await askBase(
      "Ya me llegó y lo voy a revisar. Cosas como ésta son las que hacen que Norata deje de fallar donde falla.",
      false, "De nada", false, false, null,
      { icono: "bicho", titulo: "Gracias por avisarme", tono: "oro", soloOk: true });
  } else {
    /* Ni «error» ni una disculpa larga: se dice qué pasó y qué se puede
       hacer. Lo escrito se ha perdido, y eso también se dice — dejar creer
       que quedó guardado en alguna parte es lo único imperdonable aquí. */
    toast("No pude enviarlo: revisa tu conexión y vuelve a intentarlo.", "atencion");
  }
}

function abrirAjustes(sec) {
  cerrarMenuAjustes();
  /* Antes de tocar `ajusteAbierto`, no después: `showView("settings")` lo pone
     a null a propósito (entrar por el menú de abajo siempre empieza igual), y
     si se eligiera primero la sección, el viaje la borraría por el camino. */
  showView("settings");
  ajusteAbierto = sec || AJUSTES_SECS[0].id;
  renderAjustes();
  window.scrollTo(0, 0);
}

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  const m = document.getElementById("ajustes-menu");
  if (m && m.classList.contains("show")) cerrarMenuAjustes();
});

function mostrarAjuste(id) {
  ajusteAbierto = id;
  renderAjustes();
  if (!isDesktop()) window.scrollTo(0, 0);
}

/* La flecha de arriba vuelve un paso, no a la portada: desde una sección del
   teléfono devuelve a la lista, y solo desde la lista sale de Ajustes. */
function volverDeAjustes() {
  if (!isDesktop() && ajusteAbierto) {
    ajusteAbierto = null;
    renderAjustes();
    window.scrollTo(0, 0);
    return;
  }
  showView("summary");
}

function renderTimezone() {
  const sel = document.getElementById("tz-select");
  if (!sel) return;
  const cur = userTZ();
  const list = [...new Set([detectedTZ(), cur, ...TZ_OPTIONS])];
  sel.innerHTML = list.map(tz =>
    `<option value="${escapeAttr(tz)}" ${tz === cur ? "selected" : ""}>${escapeHtml(tz.replace(/_/g, " "))}${tz === detectedTZ() ? " (de este equipo)" : ""}</option>`
  ).join("");
  const now = new Date();
  let hora = "";
  try {
    hora = now.toLocaleTimeString("es-MX", { timeZone: cur, hour: "2-digit", minute: "2-digit" });
  } catch (e) { hora = "—"; }
  document.getElementById("tz-hint").textContent = `Ahí son las ${hora}. Tu día en la app: ${formatDate(todayKey())}.`;
}

function setTimezone(tz) {
  state.settings = state.settings || {};
  state.settings.timezone = tz;
  save();
  renderTimezone();
  toast("Zona horaria actualizada");
}

/* ================= Datos: exportar / importar ================= */

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "norata-respaldo-" + todayKey() + ".json";
  a.click();
  URL.revokeObjectURL(a.href);
  toast("Respaldo exportado");
}

function importData(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || !Array.isArray(data.skills)) throw new Error("formato");
      if ((Number(data.schemaVersion) || 1) > SCHEMA) {
        toast("Ese respaldo viene de una versión más nueva de Norata. Actualiza la app aquí antes de importarlo.", "atencion");
        return;
      }
      if (!Array.isArray(data.perks)) data.perks = [];
      if (!await ask(`El respaldo tiene ${data.skills.length} habilidad(es), ${data.perks.length} talento(s), ${(data.projects || []).length} proyecto(s) y ${(data.missions || []).length} misión(es), y reemplazará tus datos actuales. ¿Continuar?`, "Importar")) return;
      if (!guardarLocal(data)) return;
      state = load();
      applyDecay();
      showView("summary");
      toast("Respaldo importado");
    } catch (e) {
      toast("El archivo no es un respaldo válido", "atencion");
    } finally {
      input.value = "";
    }
  };
  reader.readAsText(file);
}

async function resetAll() {
  /* Papelera y no candado: aqui no se cierra nada, se tira. El icono dice de
     que va antes de que el ojo llegue a leer "TODAS". */
  if (!await askBase(
    "Se van tus habilidades, misiones, talentos, proyectos y todo el progreso que llevas. Esta acción no se puede deshacer.",
    false, "Borrar todo", true, false, null,
    { icono: "papelera", titulo: "Vas a vaciar la app." })) return;

  /* En una cuenta de verdad no basta con pulsar dos veces. Quien usa una
     cuenta para experimentar y otra para su vida acaba borrando en la que no
     era, y "¿seguro?" no distingue una de otra: se pulsa igual de rápido en
     las dos. Escribir el correo obliga a mirar CUÁL está abierta. En la
     cuenta marcada como de pruebas no se pide, porque ahí borrar es la
     rutina y la fricción solo estorbaría. */
  if (syncReady() && !esCuentaDePruebas()) {
    const correo = ((sync.cfg || {}).correo || "").trim();
    const escrito = await askText(
      "Esta es tu cuenta real. Escribe " + correo + " para confirmar que quieres borrar todo su progreso.",
      "", "Borrar todo", correo, 120);
    if (escrito === null) return;
    if (String(escrito).trim().toLowerCase() !== correo.toLowerCase()) {
      toast("El correo no coincide. No borré nada.", "calma");
      return;
    }
  }

  if (!await ask("Última confirmación: se borrará todo. ¿Seguro?", "Sí, borrar", true, true)) return;
  state = { skills: [], perks: [], projects: [], missions: [], settings: { timezone: userTZ() } };
  save();
  showView("summary");
  toast("Datos borrados", "deshecho");
}

