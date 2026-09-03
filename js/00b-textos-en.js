/* ================= Norata en inglés =================

   La clave es la frase en español, tal cual está escrita en el código. El
   porqué está entero en `js/00-idioma.js`; lo que hay que saber para tocar
   este archivo cabe en cuatro reglas:

   1. **La clave se copia exacta, con sus tildes y sus signos.** Un espacio de
      más, una raya larga cambiada por un guion o una tilde perdida y esa
      frase vuelve a salir en español. No falla ruidosamente: falla callando.
   2. **`{0}`, `{1}`… son huecos** y vienen de una plantilla `` T`…` ``. El
      inglés los puede reordenar o dejarse uno fuera; lo que no puede es
      inventarse uno que no exista.
   3. **Lo que falta se queda en español**, y eso es correcto mientras se
      traduce por tandas. Para ver qué falta: abrir la app con `?i18n=audita`,
      recorrerla, y `faltantesI18n()` en la consola.
   4. **No es una traducción literal, es la misma voz en otro idioma.** La app
      tutea en español; en inglés eso es simplemente hablar de tú a tú, sin
      «please» de formulario y sin voz pasiva. Y la regla de los cierres se
      mantiene: nada de decir lo que NO se va a hacer.

   Lo que a propósito NO se traduce: los nombres de las monedas los pone
   `MONEDAS` (`enIngles`), los nombres de los idiomas van cada uno en el suyo,
   y «Norata» es «Norata». */

const TEXTOS_EN = {

  /* ---------- La barra, las pantallas y los botones de siempre ---------- */
  "Resumen": "Summary",
  "Habilidades": "Skills",
  "Misiones": "Missions",
  "Talentos": "Talents",
  "Proyectos": "Projects",
  "Árbol de talentos": "Talent tree",
  "Árbol": "Tree",
  "Mi expedición": "My journey",
  "Informe": "Report",
  "Ajustes": "Settings",
  "Catálogo": "Catalog",
  "Crear": "Create",
  "Editar": "Edit",
  "Volver": "Back",
  "Atrás": "Back",
  "Cancelar": "Cancel",
  "Confirmar": "Confirm",
  "Continuar": "Continue",
  "Siguiente": "Next",
  "Añadir": "Add",
  "Actualizar": "Update",
  "Bienvenido": "Welcome",
  "salir": "exit",
  "Ir a Resumen": "Go to Summary",
  "Cerrar barra lateral": "Collapse sidebar",
  "Salir de pantalla completa": "Leave full screen",
  "Acomodar tablero": "Rearrange board",
  "Reportar un fallo": "Report a bug",
  "Versión de la app": "App version",
  "Abriendo Norata…": "Opening Norata…",
  "Actualizar a la version nueva": "Update to the new version",
  "Hay una version nueva de Norata": "There's a new version of Norata",
  "Estás viendo números inventados, no son tus datos": "These are made-up numbers, not your data",
  "días de racha": "day streak",
  "de expedición": "of your journey",
  "¡Excelente!": "Nicely done",

  /* ---------- Misiones ---------- */
  "Nueva misión": "New mission",
  "¿Qué vas a hacer?": "What are you going to do?",
  "Detalle (opcional)": "Details (optional)",
  "Icono": "Icon",
  "Color": "Color",
  "¿Cada cuándo?": "How often?",
  "Todos los días": "Every day",
  "Días sueltos": "Certain days",
  "Una sola vez": "Just once",
  "Días de la semana": "Days of the week",
  "Veces al día": "Times a day",
  "Para misiones que se repiten en el día, como beber agua o hacer pausas.":
    "For missions you repeat through the day, like drinking water or taking breaks.",
  "Recompensa": "Reward",
  "Habilidad que entrena": "Skill it trains",
  "XP al cumplirla": "XP when you complete it",
  "Las misiones dan poco XP, pero todos los días. Ahí está su fuerza.":
    "Missions give little XP, but they give it every day. That's where their strength is.",
  "Guardar misión": "Save mission",
  "Eliminar misión": "Delete mission",
  "Ej. Caminar 20 minutos": "e.g. Walk for 20 minutes",
  "Algo que te ayude a recordar qué cuenta como cumplida.":
    "Something to help you remember what counts as done.",

  /* ---------- Proyectos y encargos ---------- */
  "Proyecto": "Project",
  "Encargo": "Assignment",
  "Nuevo encargo": "New assignment",
  "Nombre del encargo": "Assignment name",
  "A qué proyecto pertenece este encargo. Dentro de un proyecto, sus encargos se comparan entre sí.":
    "Which project this assignment belongs to. Inside a project, its assignments are compared with each other.",
  "¿Qué quieres lograr? (opcional)": "What do you want to achieve? (optional)",
  "Etapas": "Stages",
  "Divide el encargo en pasos concretos. El avance se mide con las etapas que marques como hechas.":
    "Break the assignment into concrete steps. Progress is measured by the stages you mark as done.",
  "Conexiones": "Connections",
  "XP al terminarlo": "XP when you finish it",
  "Guardar encargo": "Save assignment",
  "Eliminar encargo": "Delete assignment",
  "Ej. Mudanza, Lanzamiento, Portafolio…": "e.g. Moving, Launch, Portfolio…",
  "Ej. Rediseñar mi portafolio": "e.g. Redesign my portfolio",
  "En una frase: cómo se ve este encargo terminado.":
    "In one sentence: what this assignment looks like when it's done.",
  "Nueva etapa…": "New stage…",

  /* ---------- Habilidades ---------- */
  "Habilidad": "Skill",
  "Nueva habilidad": "New skill",
  "Nombre": "Name",
  "Rama": "Branch",
  "Agrupa habilidades afines, igual que las ramas de talentos y de trabajo.":
    "Groups related skills together, the same way talent and work branches do.",
  "Decaimiento": "Decay",
  "Habilidad blindada": "Protected skill",
  "Lo ganado nunca se pierde, aunque no practiques.":
    "What you've earned is never lost, even if you stop practicing.",
  "Días de gracia": "Grace days",
  "XP perdido / día": "XP lost per day",
  "Si pasas más días sin practicar que los días de gracia, la habilidad pierde XP cada día.":
    "If you go longer without practicing than your grace days, the skill loses XP every day.",
  "Guardar habilidad": "Save skill",
  "Eliminar habilidad": "Delete skill",
  "Ej. Dibujo, Cocina, Inglés…": "e.g. Drawing, Cooking, Spanish…",
  "Ej. Creatividad, Salud, Trabajo…": "e.g. Creativity, Health, Work…",

  /* ---------- Talentos ---------- */
  "Talento": "Talent",
  "Nuevo talento": "New talent",
  "Primero la rama: es el mapa donde vivirá este talento. Escribe una nueva o elige una existente.":
    "Start with the branch: it's the map this talent will live on. Type a new one or pick one you already have.",
  "Nombre del talento": "Talent name",
  "Descripción (opcional)": "Description (optional)",
  "Tipo de talento": "Talent type",
  "Plan de duración": "Time plan",
  "días": "days",
  "meses": "months",
  "Al comenzar arranca el plazo. Cuando termina confirmas si la lograste: si sí, el talento se vuelve permanente; si no, se pierde.":
    "Starting it starts the clock. When time is up you confirm whether you made it: if you did, the talent becomes permanent; if you didn't, it's lost.",
  "Divide la meta en pasos concretos y el avance sale de contarlos, sin porcentajes a ojo.":
    "Break the goal into concrete steps and progress comes from counting them, with no percentages guessed by eye.",
  "Puedes dejarla sin etapas": "You can leave it with no stages",
  ": entonces la meta entera es su propia etapa y se cierra de una vez.":
    ": then the whole goal is its own stage and closes in one go.",
  "Habilidad vinculada": "Linked skill",
  "Al completar el talento, esa habilidad recibe el XP de recompensa.":
    "When you complete the talent, that skill receives the reward XP.",
  "XP de recompensa": "Reward XP",
  "Requiere completar antes": "Requires finishing first",
  "¿Hacen falta todos?": "Are all of them needed?",
  "Guardar talento": "Save talent",
  "Eliminar talento": "Delete talent",
  "Ej. Dibujo, Música, Negocio…": "e.g. Drawing, Music, Business…",
  "Ej. Curso de ilustración digital": "e.g. Digital illustration course",
  "¿Qué desbloquea este talento? ¿Cuál es la meta concreta?":
    "What does this talent unlock? What's the concrete goal?",
  /* El rótulo del costo lo escribe `js/08-formularios.js` con la moneda de
     cada quien, así que el hueco es el código: «Cuánto costó (USD)». */
  "Cuánto costó ({0})": "What it cost ({0})",
  "Costo ({0}, opcional)": "Cost ({0}, optional)",

  /* ---------- Ajustes ---------- */
  "Mi perfil": "My profile",
  "Mi plan": "My plan",
  "Mis módulos": "My modules",
  "Mi apariencia": "My look",
  "Mi almacenamiento": "My storage",
  "Norata por dentro": "Inside Norata",
  "Tu sesión y la sincronía entre dispositivos": "Your session and syncing between devices",
  "Tu plan, qué incluye y hasta cuándo va": "Your plan, what it includes and how long it runs",
  "Qué módulos aparecen en el menú": "Which modules show up in the menu",
  "Con qué luz se ve Norata": "The light Norata is seen in",
  "Zona horaria, respaldos, copias y borrado": "Time zone, backups, copies and deletion",
  "El modo de pruebas, cuánta gente la usa y lo que se rompe":
    "Test mode, how many people use it and what breaks",

  "Sincronizar entre dispositivos": "Sync between devices",
  "Idioma": "Language",
  "En qué idioma te habla Norata. Cambiarlo no toca nada de lo que has escrito tú: tus habilidades, misiones y talentos se quedan como los nombraste.":
    "The language Norata speaks to you in. Changing it doesn't touch anything you wrote: your skills, missions and talents keep the names you gave them.",
  "Moneda": "Currency",
  "Con la que se escribe lo que te cuesta un talento y lo que llevas invertido. Al cambiarla te pregunto el tipo de cambio y convierto tus importes —guardando antes una copia—.":
    "The one used to write what a talent costs you and what you've invested so far. When you change it I'll ask you for the exchange rate and convert your amounts — saving a copy first.",
  "Qué tan exigente lo quieres": "How demanding you want it",
  "Cuánto aguanta una habilidad sin que la practiques antes de empezar a bajar, y a qué ritmo baja. Es lo que eliges al armar tu tablero, y aquí se cambia cuando quieras.":
    "How long a skill holds up without practice before it starts dropping, and how fast it drops. It's what you pick when you build your board, and you can change it here whenever you want.",
  "Secciones del menú": "Menu sections",
  "Apaga las que no uses y el menú deja de mostrarlas. No se borra nada: al volver a encenderlas, todo sigue donde estaba.":
    "Turn off the ones you don't use and the menu stops showing them. Nothing is deleted: turn them back on and everything is right where it was.",
  "Ver otra vez qué hace cada sección": "See again what each section does",
  "Zona horaria": "Time zone",
  "Las rachas, el decaimiento y las misiones se calculan con esta zona horaria, no con la del dispositivo. Así tu progreso no se descuadra si viajas o abres la app desde otra computadora.":
    "Streaks, decay and missions are calculated with this time zone, not the device's. That way your progress doesn't drift if you travel or open the app from another computer.",
  "Zona horaria actual": "Current time zone",
  "Respaldos": "Backups",
  "Exportar respaldo (JSON)": "Export backup (JSON)",
  "Importar respaldo": "Import backup",
  "Copias de seguridad automáticas": "Automatic safety copies",
  "Antes de juntar los cambios de dos dispositivos, o de cambiar de cuenta, se guarda aquí una copia de lo que había. Se conservan las tres más recientes.":
    "Before merging changes from two devices, or switching accounts, a copy of what was there is saved here. The three most recent ones are kept.",
  "Zona de peligro": "Danger zone",
  "Vaciar la app": "Empty the app",
  "Se van tus habilidades, misiones, talentos, proyectos y todo el progreso que llevas. No se puede deshacer. Con la sesión abierta, el vaciado también viaja a tus otros dispositivos;":
    "Your skills, missions, talents, projects and all the progress you've made are gone. This can't be undone. With your session open, the wipe travels to your other devices too;",
  "tu cuenta no se toca": "your account isn't touched",
  "y puedes seguir usándola.": "and you can keep using it.",
  "Borrar todos los datos": "Delete all data",

  /* ---------- Idioma y moneda ---------- */
  "Español de México": "Mexican Spanish",
  "English": "English",
  "Antes de empezar": "Before you start",
  "Dos cosas que puedes cambiar después en Ajustes, cuando quieras.":
    "Two things you can change later in Settings, whenever you want.",
  "¿En qué idioma?": "Which language?",
  "¿Con qué moneda cuentas tu dinero?": "Which currency do you count your money in?",
  "Es con la que se escribe lo que te cuesta un talento y lo que llevas invertido.":
    "It's the one used to write what a talent costs you and what you've invested so far.",
  "Listo, la app ya está en este idioma": "Done, the app is in this language now",
  "Listo, tu moneda ahora es": "Done, your currency is now",
  "Escribe un tipo de cambio mayor que cero.": "Enter an exchange rate greater than zero.",
  "importe guardado": "saved amount",
  "importes guardados": "saved amounts",
  "importe convertido": "amount converted",
  "importes convertidos": "amounts converted",
  "Pasar de {0} a {1}": "Switching from {0} to {1}",
  "Voy a reescribir {0} {1} con este tipo de cambio. Antes guardo una copia completa, y la puedes restaurar desde Mi almacenamiento.":
    "I'll rewrite {0} {1} using this exchange rate. I'll save a full copy first, and you can restore it from My storage.",
  "Cuántos {0} vale un {1}": "How many {0} one {1} is worth",
  "Es una referencia de {0}. Si sabes el tuyo, escríbelo.":
    "This is a reference rate from {0}. If you know yours, type it in.",
  "Convertir mis importes a {0}": "Convert my amounts to {0}",
  /* `CAMBIO_FECHA` (js/01-base.js). Al subir los tipos de cambio hay que
     cambiar esta línea también, o la app en inglés dirá la fecha en español
     dentro de una frase inglesa —que es justo como salió la primera vez. */
  "septiembre de 2026": "September 2026",
  "Listo: {0} {1} a {2}": "Done: {0} {1} to {2}",

  /* ---------- El asistente: las tres preguntas ---------- */
  "Pregunta 1 de 3": "Question 1 of 3",
  "Pregunta 2 de 3": "Question 2 of 3",
  "Pregunta 3 de 3": "Question 3 of 3",
  "¿Qué partes de tu vida quieres mejorar?": "Which parts of your life do you want to improve?",
  "Elige de una a tres. Con eso armo tus primeras habilidades, misiones y ramas — después puedes cambiar todo.":
    "Pick one to three. With that I'll build your first skills, missions and branches — you can change all of it afterwards.",
  "¿Qué tan exigente lo quieres?": "How demanding do you want it?",
  "Esto define cuánto tiempo puedes dejar una habilidad sin practicar antes de que empiece a bajar.":
    "This sets how long you can leave a skill without practice before it starts dropping.",
  "¿Hay algo que estés construyendo ahora?": "Is there something you're building right now?",
  "Un proyecto con etapas: mudarte, lanzar algo, terminar un trámite. Si no hay nada, puedes saltarlo.":
    "A project with stages: moving house, launching something, getting paperwork done. If there's nothing, you can skip it.",
  "Nombre del proyecto (opcional)": "Project name (optional)",
  "Ej. Renovar mi cuarto": "e.g. Redo my room",
  "O toca una de estas": "Or tap one of these",
  "Armar mi tablero": "Build my board",
  "Tu tablero está listo": "Your board is ready",
  "{0} área para empezar": "{0} area to start with",
  "{0} áreas para empezar": "{0} areas to start with",

  /* La exigencia. Los nombres son de carácter, no de intensidad: «Gentle» y
     no «Easy» — no se está eligiendo una dificultad, se está eligiendo cuánto
     margen te das. */
  "Tranquilo": "Gentle",
  "Equilibrado": "Balanced",
  "Exigente": "Demanding",
  "14 días de gracia. Para empezar sin presión.": "14 grace days. To start without pressure.",
  "7 días de gracia. El punto medio recomendado.": "7 grace days. The recommended middle ground.",
  "3 días de gracia. Si fallas, se nota rápido.": "3 grace days. If you slip, it shows fast.",

  /* ---------- Las ocho áreas del asistente ---------- */
  "Salud y cuerpo": "Health and body",
  "Aprender algo": "Learn something",
  "Crear cosas": "Make things",
  "Ordenar mi dinero": "Sort out my money",
  "Casa y cocina": "Home and cooking",
  "Descanso y calma": "Rest and calm",
  "Gente que quiero": "People I love",
  "Carrera y trabajo": "Career and work",

  /* Las ramas donde nacen los talentos de cada área */
  "Salud": "Health",
  "Aprender": "Learning",
  "Creatividad": "Creativity",
  "Dinero": "Money",
  "Casa": "Home",
  "Bienestar": "Wellbeing",
  "Personas": "People",
  "Trabajo": "Work",
  "Personal": "Personal",
  "Talento creado en la rama {0}": "Talent created in the {0} branch",

  /* Las habilidades que siembra el asistente */
  "Ejercicio": "Exercise",
  "Correr": "Running",
  "Lectura": "Reading",
  "Idiomas": "Languages",
  "Dibujo": "Drawing",
  "Escritura": "Writing",
  "Finanzas": "Finance",
  "Organización": "Organization",
  "Cocina": "Cooking",
  "Repostería": "Baking",
  "Meditación": "Meditation",
  "Yoga": "Yoga",
  "Oratoria": "Public speaking",
  "Carisma": "Charisma",
  "Negociación": "Negotiation",

  /* Las misiones de cada área */
  "Moverme 20 minutos": "Move for 20 minutes",
  "Estudiar 15 minutos": "Study for 15 minutes",
  "Crear algo pequeño": "Make something small",
  "Anotar mis gastos del día": "Write down today's spending",
  "Cocinar en casa": "Cook at home",
  "10 minutos sin pantallas": "10 minutes with no screens",
  "Escribirle a alguien": "Message someone",
  "Una hora de trabajo profundo": "One hour of deep work",

  /* Las ideas de proyecto de la pregunta 3 */
  "Correr mi primera carrera": "Run my first race",
  "Armar mi rutina en casa": "Set up my home routine",
  "Terminar el curso que dejé a medias": "Finish the course I left halfway",
  "Sacar mi certificado": "Get my certificate",
  "Montar mi portafolio": "Put together my portfolio",
  "Publicar mi primer trabajo": "Publish my first piece",
  "Salir de una deuda": "Get out of a debt",
  "Armar mi presupuesto del año": "Build my budget for the year",
  "Renovar mi cuarto": "Redo my room",
  "Ordenar la casa de una vez": "Sort out the house once and for all",
  "Arreglar mis horarios de sueño": "Fix my sleep schedule",
  "Planear unas vacaciones de verdad": "Plan a real holiday",
  "Organizar una reunión con los míos": "Get my people together",
  "Preparar un regalo que lleve tiempo": "Make a gift that takes time",
  "Cambiar de trabajo": "Change jobs",
  "Lanzar algo propio": "Launch something of my own",

  /* Las tres etapas del proyecto que crea el asistente */
  "Definir qué significa terminarlo": "Define what finishing it means",
  "Primer paso concreto": "First concrete step",
  "Revisar avance": "Review progress",
  "Proyecto creado desde la bienvenida": "Project created from the welcome",

  /* Los cuarenta talentos: cinco por área, del primer peldaño a la meta
     grande. Son copy, no etiquetas: se reescriben para que suenen como algo
     que uno se diría a sí mismo, no como la traducción de otra frase. */
  "Caminar 20 minutos tres días seguidos": "Walk 20 minutes three days in a row",
  "Aguantar 5 minutos corriendo sin parar": "Run 5 minutes without stopping",
  "Moverme tres veces por semana, un mes": "Move three times a week for a month",
  "Correr 5 kilómetros de una tirada": "Run 5 kilometres in one go",
  "Una rutina que sostengo sin pensarla": "A routine I keep without thinking about it",

  "Terminar el primer capítulo": "Finish the first chapter",
  "Estudiar diez días seguidos": "Study ten days in a row",
  "Llegar a la mitad del curso": "Reach the middle of the course",
  "Explicarle a alguien lo que aprendí": "Explain what I learned to someone",
  "Terminar el curso entero": "Finish the whole course",

  "Diez bocetos sin borrar ninguno": "Ten sketches without erasing a single one",
  "Terminar algo y no dejarlo a medias": "Finish something instead of leaving it halfway",
  "Crear algo cada semana, dos meses": "Make something every week for two months",
  "Enseñárselo a alguien que no soy yo": "Show it to someone who isn't me",

  "Saber cuánto entra y cuánto sale": "Know what comes in and what goes out",
  "Un mes entero anotando todo": "A whole month writing everything down",
  "Recortar un gasto que no echo de menos": "Cut an expense I don't miss",
  "Ahorrar mi primer mes de gastos": "Save my first month of expenses",
  "Fondo de emergencia completo": "A full emergency fund",

  "Tres recetas que me salen sin mirar": "Three recipes I can make without looking",
  "Cocinar para alguien más": "Cook for someone else",
  "Una semana entera cocinando en casa": "A whole week cooking at home",
  "Inventar un plato mío": "Invent a dish of my own",
  "Diez recetas de memoria": "Ten recipes by heart",

  "Siete días acostándome a la misma hora": "Seven days going to bed at the same time",
  "Una semana sin pantallas en la cama": "A week with no screens in bed",
  "Dormir bien un mes seguido": "Sleep well for a month straight",
  "Un día entero sin prisa, a propósito": "A whole day with no rush, on purpose",
  "Parar diez minutos cada día, tres meses": "Stop for ten minutes a day, three months",

  "Escribirle a tres personas pendientes": "Message three people I've been meaning to",
  "Ver a alguien en persona, no por mensaje": "See someone in person, not by message",
  "Ver a mis amigos una vez al mes": "See my friends once a month",
  "Organizar yo el plan, sin esperar": "Make the plan myself instead of waiting",
  "Una costumbre que nos junte sin avisar": "A habit that brings us together without planning",

  "Una hora sin interrupciones, cinco días": "One hour with no interruptions, five days",
  "Terminar eso que llevo aplazando": "Finish the thing I keep putting off",
  "Un mes cerrando lo que empiezo": "A month closing what I start",
  "Pedir lo que me toca pedir": "Ask for what I'm owed",
  "Certificarme en lo mío": "Get certified in my field"
};
