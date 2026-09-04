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
  "Cambio del {0}, según {1}. Puedes escribir el tuyo.":
    "Rate from {0}, according to {1}. You can type your own.",
  "Último cambio que pude conseguir, del {0}. Puedes escribir el tuyo.":
    "The most recent rate I could get, from {0}. You can type your own.",
  /* `CAMBIO_FECHA` (js/01-base.js). Al subir los tipos de cambio hay que
     cambiar esta línea también, o la app en inglés dirá la fecha en español
     dentro de una frase inglesa —que es justo como salió la primera vez. */
  "3 de septiembre de 2026": "3 September 2026",
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
  "Certificarme en lo mío": "Get certified in my field",

  /* ================= Tanda 2 =================
     El Resumen, la puerta, el detalle, los formularios y los talentos.
     Salieron de envolver con `tx()` el texto de cinco archivos y de partir
     a mano las frases que llevaban datos dentro.

     Dos cosas que se aprendieron envolviendo, y que valen para la tanda
     siguiente:

     - **Los trozos sueltos son un riesgo, no un ahorro.** «Te quedan» + un
       número + «días de gracia» parece traducible por partes hasta que el
       inglés quiere el número en otro sitio. Lo que lleva datos dentro va
       con `` T`` `` y una sola clave con `{0}`.
     - **El singular y el plural son DOS claves.** «Te queda 1 día» y «te
       quedan 3 días» ya eran dos frases en español; fingir que son una sola
       obliga al inglés a elegir entre «day» y «days» sin saber cuál toca. */

  "Tu expedición empieza aquí": "Your journey starts here",
  "Convierte tu vida en un videojuego: misiones que haces hoy, habilidades que suben con la práctica, talentos que compras con dinero real y proyectos que avanzan por etapas.":
    "Turn your life into a video game: missions you do today, skills that rise with practice, talents you buy with real money, and projects that advance stage by stage.",
  "Armar mi tablero en 3 preguntas": "Build my board in 3 questions",
  "Ver un ejemplo completo": "See a full example",
  "Empezar de cero": "Start from scratch",
  "El plan venció — confirma si lo lograste": "The plan is up — confirm whether you made it",
  "Aún no registras práctica hoy": "You haven't logged any practice today",
  "Una sesión corta mantiene viva tu racha": "A short session keeps your streak alive",
  "de racha": "streak",
  "esta semana": "this week",
  "Misiones de hoy": "Today's missions",
  "Ver todas": "See all",
  "XP · 7 DÍAS": "XP · 7 DAYS",
  "EN CURSO": "IN PROGRESS",
  "Atención hoy": "Needs you today",
  "Todo bajo control. Nada urge hoy — sigue explorando.":
    "All under control. Nothing is urgent today — keep exploring.",
  "Listos para empezar": "Ready to start",
  "Estos talentos están desbloqueados y esperando. Empieza uno para ponerlo en progreso.":
    "These talents are unlocked and waiting. Start one to put it in progress.",
  "Listo": "Done",
  "Nivel de tu personaje": "Your character's level",
  "Sin habilidades todavía": "No skills yet",
  "Empieza por el catálogo: verlas en cero es lo que te recuerda que existen. Luego puedes crear las tuyas.":
    "Start with the catalog: seeing them at zero is what reminds you they exist. Then you can create your own.",
  "Ver el catálogo": "See the catalog",
  "Crear una a mano": "Create one by hand",
  "Los hitos": "Milestones",
  "Pasaste el último de la lista. A partir de aquí, cada día es récord.":
    "You passed the last one on the list. From here on, every day is a record.",
  "Qué la sostiene": "What holds it up",
  "＋ Del catálogo": "＋ From the catalog",
  "No sé cuál encaja con ese nombre; elígela tú si quieres.":
    "I don't know which one fits that name; pick it yourself if you want.",
  "por la rama": "via the branch",
  "ya las tienes": "you already have them",
  "Ver el informe": "See the report",
  "Más opciones de esta rama": "More options for this branch",
  "Sube:": "Raises:",
  "Crear tu cuenta": "Create your account",
  "¿Cómo te llamas?": "What's your name?",
  "¿Cómo te decimos?": "What should we call you?",
  "Tu correo": "Your email",
  "Contraseña": "Password",
  "Repítela": "Type it again",
  "Crear cuenta": "Create account",
  "Te mandaré un correo para confirmar que la dirección es tuya. Hasta que lo abras, la cuenta no se activa.":
    "I'll send you an email to confirm the address is yours. The account isn't active until you open it.",
  "¿Ya tienes una?": "Already have one?",
  "Entra aquí": "Sign in here",
  "Esta cuenta se va a borrar": "This account is set to be deleted",
  "Pediste borrar": "You asked to delete",
  ", y se hará el": ", and it will happen on",
  ". Hasta ese día puedes recuperarla con todo tu progreso intacto.":
    ". Until that day you can recover it with all your progress intact.",
  "Borrarla ahora, sin esperar": "Delete it now, without waiting",
  "Dejarlo como está y salir": "Leave it as it is and exit",
  "Gracias por el tiempo que le diste a Norata. Lo que aprendiste jugando a esto sigue siendo tuyo, esté o no la app de por medio.":
    "Thank you for the time you gave Norata. What you learned playing this is still yours, with or without the app in between.",
  "Volver a entrar": "Sign back in",
  "Revisa tu correo": "Check your email",
  "Le mandé un mensaje a": "I sent a message to",
  ". Ábrelo, pulsa el enlace, y vuelve aquí a entrar.":
    ". Open it, tap the link, and come back here to sign in.",
  "Ya lo confirmé: entrar": "I confirmed it: sign in",
  "Reenviar el correo": "Send the email again",
  "Si no aparece en unos minutos, míralo en la carpeta de no deseado.":
    "If it doesn't show up in a few minutes, check your spam folder.",
  "Escribe tu contraseña y sigues donde lo dejaste.":
    "Type your password and you're right where you left off.",
  "Tu vida como videojuego: habilidades que suben con la práctica y metas que avanzan de verdad.":
    "Your life as a video game: skills that rise with practice and goals that actually move.",
  "¿Olvidaste tu contraseña?": "Forgot your password?",
  "¿Todavía no tienes cuenta?": "Don't have an account yet?",
  "Créala aquí": "Create one here",
  "Continuar con Google": "Continue with Google",
  "Elige tu contraseña nueva. Con ella entrarás en todos tus dispositivos.":
    "Choose your new password. You'll use it to sign in on all your devices.",
  "Contraseña nueva": "New password",
  "Guardar y entrar": "Save and sign in",
  "Mostrar la contraseña": "Show the password",
  "Volver a iniciar sesión": "Back to sign in",
  "Tu nombre": "Your name",
  "Tu apodo": "Your nickname",
  "tu@correo.com": "you@email.com",
  "Sin misiones todavía": "No missions yet",
  "Las misiones son lo que haces hoy: pequeñas, repetibles y con recompensa. Son las que mantienen viva tu racha y hacen subir tus habilidades sin que lo notes.":
    "Missions are what you do today: small, repeatable and rewarding. They're what keeps your streak alive and raises your skills without you noticing.",
  "Crear mi primera misión": "Create my first mission",
  "una vez": "once",
  "del día": "of the day",
  "Arrastra una misión de una columna a otra: a la semana queda pospuesta, a las terminadas queda cerrada. El ＋ de cada columna crea una misión ya puesta ahí.":
    "Drag a mission from one column to another: to the week it's postponed, to done it's closed. Each column's ＋ creates a mission already placed there.",
  "Sin proyectos todavía": "No projects yet",
  "Un proyecto es algo que estás construyendo y que avanza por encargos divididos en etapas. La app mide tu ritmo y te dice cuáles proyectos siguen vivos y cuáles te conviene soltar.":
    "A project is something you're building that advances through assignments split into stages. The app measures your pace and tells you which projects are still alive and which are worth letting go.",
  "Crear mi primer proyecto": "Create my first project",
  "Avance de lo que construyes": "Progress on what you're building",
  "Decisión pendiente": "Decision pending",
  "Estos encargos llevan mucho sin avanzar. Retomarlos o soltarlos libera tu atención — dejarlos en el limbo es lo único que no ayuda.":
    "These assignments haven't moved in a long time. Picking them up or letting them go frees your attention — leaving them in limbo is the only thing that doesn't help.",
  "Arrastra aquí el encargo que quieras, o crea uno con el ＋.":
    "Drag any assignment here, or create one with the ＋.",
  "Todavía no hay encargos en este proyecto. Créale el primero con el ＋.":
    "There are no assignments in this project yet. Create the first one with the ＋.",
  "Arrastra para acomodar · tira del punto ▸ hacia otro encargo para ponerlo después · toca una línea para cortarla · el círculo":
    "Drag to arrange · pull the ▸ dot onto another assignment to put it after · tap a line to cut it · the circle",
  "cambia si hacen falta todos sus requisitos o basta uno":
    "switches between needing all its requirements or just one",
  "Toca un encargo para abrirlo · arrástralo para acomodarlo · clic derecho para conectar, crear y más":
    "Tap an assignment to open it · drag it to arrange it · right-click to connect, create and more",
  "Sin etapas todavía. Divide el encargo en pasos concretos para poder medir su avance.":
    "No stages yet. Break the assignment into concrete steps so its progress can be measured.",
  "Dar por terminado": "Mark as finished",
  "Pausar por ahora": "Pause for now",
  "Sin movimientos todavía.": "No activity yet.",
  "Va después de": "Comes after",
  "Basta con que termine cualquiera de ellos.": "Any one of them finishing is enough.",
  "Hacen falta todos.": "All of them are needed.",
  "Se cambia en el mapa, con el círculo <b>Y/O</b>.":
    "You change it on the map, with the <b>Y/O</b> circle.",
  "Este encargo <b>espera su turno</b>: no lo puedes avanzar hasta que termine lo de arriba.":
    "This assignment <b>waits its turn</b>: you can't move it forward until the ones above are done.",
  "Este encargo esperaba su turno, y ya le toca.":
    "This assignment was waiting its turn, and now it's up.",
  "Este encargo <b>solo va después</b>: la app deja de sugerírtelo hasta que toque, pero puedes adelantarlo cuando quieras.":
    "This assignment <b>just comes later</b>: the app stops suggesting it until its time, but you can move it up whenever you want.",
  "Dejar que lo adelante": "Let me move it up",
  "Que espere su turno": "Make it wait its turn",
  "ÚLTIMO AVANCE": "LAST PROGRESS",
  "espera su turno": "waits its turn",
  "solo va después": "just comes later",
  "Sin estrenar.": "Not started.",
  "Sin estrenar todavía: nada que perder hasta que registres tu primera práctica.":
    "Not started yet: nothing to lose until you log your first practice.",
  "En decaimiento:": "Decaying:",
  "Habilidad blindada: nunca pierde XP.": "Protected skill: it never loses XP.",
  "Te quedan": "You have",
  "Todavía no hay actividad registrada.": "No activity logged yet.",
  "Registrar práctica": "Log practice",
  "Registro cerrado por hoy: ya sumaste medio día de práctica en esta habilidad.":
    "Logging is closed for today: you've already added half a day of practice to this skill.",
  "Registrar y ganar XP": "Log it and earn XP",
  "Marca los movimientos que quieras quitar. Se devolverá su XP.":
    "Check the entries you want to remove. Their XP will be given back.",
  "Qué alimenta esta habilidad": "What feeds this skill",
  "Nada apunta aquí todavía. Cuando vincules una misión, un talento o un encargo a":
    "Nothing points here yet. When you link a mission, a talent or an assignment to",
  ", aparecerán en esta lista y su XP subirá sola.":
    ", they'll show up in this list and its XP will rise on its own.",
  "Crear una misión diaria": "Create a daily mission",
  "Crear un talento": "Create a talent",
  "Quitar una vez de hoy": "Remove one of today's",
  "Editar habilidad": "Edit skill",
  "¿Qué hiciste? Ej. Terminé módulo 2 del curso":
    "What did you do? e.g. Finished module 2 of the course",
  "Seleccionar movimientos para quitar": "Select entries to remove",
  "Tu mapa está por trazarse": "Your map is waiting to be drawn",
  "Un talento es una meta con inversión real: un curso, un equipo, una certificación. Al pagarla arranca un plan con fecha límite — si logras la meta, el talento es tuyo para siempre.":
    "A talent is a goal with real investment: a course, a piece of gear, a certification. Paying for it starts a plan with a deadline — if you reach the goal, the talent is yours forever.",
  "Crear mi primer talento": "Create my first talent",
  "Ya son tuyos": "Already yours",
  "Tus ramas de talentos": "Your talent branches",
  "Todavía no hay talentos en esta rama. Créale el primero con el ＋.":
    "There are no talents in this branch yet. Create the first one with the ＋.",
  "Arrastra para acomodar ·": "Drag to arrange ·",
  "y clic (o Shift y arrastra un recuadro) elige varios para moverlos juntos o agruparlos · tira del punto ▸ hacia otro nodo para conectarlos · toca una línea para cortarla · el círculo":
    "and click (or Shift and drag a box) picks several to move together or group · pull the ▸ dot onto another node to connect them · tap a line to cut it · the circle",
  "Toca un nodo para abrirlo · arrástralo para acomodarlo · el círculo":
    "Tap a node to open it · drag it to arrange it · the circle",
  "Toca el nombre para renombrar este tablero": "Tap the name to rename this board",
  "Toca el nombre para renombrar el proyecto": "Tap the name to rename the project",
  "Toca el nombre para renombrar la rama": "Tap the name to rename the branch",
  "Salir del modo edición": "Leave edit mode",
  "COSTO": "COST",
  "INVERTIDO TOTAL": "TOTAL INVESTED",
  "TIPO": "TYPE",
  "Regla de entrada": "Entry rule",
  "a su izquierda, y ahí también se cambia de un toque.":
    "to its left, and you can change it there with one tap too.",
  "Todavía no tiene etapas: así, la meta entera cuenta como una sola y se cierra de una vez. Añade las que quieras y el avance se contará solo.":
    "It has no stages yet: this way the whole goal counts as one and closes in a single go. Add as many as you like and progress will count itself.",
  "Las etapas se marcan cuando el plan esté en curso.":
    "Stages can be checked once the plan is running.",
  "Tu avance": "Your progress",
  "ella misma es la etapa": "it is its own stage",
  "Plan de tiempo": "Time plan",
  "Ya logré la meta": "I reached the goal",
  "Rendirme y perder el talento": "Give up and lose the talent",
  "El plan terminó — momento de la verdad": "The plan is over — moment of truth",
  "Sí, lo logré — hacerlo permanente": "Yes, I made it — make it permanent",
  "No lo logré — lo pierdo": "I didn't make it — I lose it",
  "Dar por hecho": "Mark as done",
  "Le falta el importe": "It's missing the amount",
  "Una compra es una llave que se paga. Ponle cuánto costó y podrás asegurarla.":
    "A purchase is a key you pay for. Tell me what it cost and you'll be able to secure it.",
  "Editar y ponerle importe": "Edit it and add the amount",
  "El plan venció sin lograr la meta. Puedes reintentarlo: volverás a invertir y arrancará un plan nuevo.":
    "The plan ran out without the goal being reached. You can try again: you'll invest again and a new plan will start.",
  "Este talento ya es parte de ti. Nadie te lo quita.":
    "This talent is part of you now. Nobody takes it away.",
  "Deshacer — no llegó a pasar": "Undo — it didn't actually happen",
  "Este talento ya es parte de ti. Nadie te lo quita. 🎉":
    "This talent is part of you now. Nobody takes it away. 🎉",
  "Todavía no hay otros talentos a los que encadenarlo.":
    "There are no other talents to chain it to yet.",
  "Sin etapas: la meta entera será su propia etapa.":
    "No stages: the whole goal will be its own stage.",
  "Sin etapas todavía.": "No stages yet.",
  "Editar talento": "Edit talent",
  "sin terminar": "unfinished",
  "en total": "in total",
  "Se quedó vacía.": "It ended up empty.",
  "Color del grupo": "Group color",
  "Volver a guardarla": "Put it away again",
  "Desplegarla en el mapa": "Spread it out on the map",
  "Deshacer el grupo": "Ungroup",
  "Borrar la caja y lo que lleva": "Delete the box and what's in it",
  "Cerrar": "Close",
  "Sacar del ático": "Take out of the attic",
  "Renombrar esta caja": "Rename this box",
  "Que lo decida su estado": "Let its status decide",
  "<b>En decaimiento:</b> pierdes {0} XP al día. Practica hoy para frenarlo.":
    "<b>Decaying:</b> you're losing {0} XP a day. Practice today to stop it.",
  "Te queda <b>{0}</b> día de gracia antes de empezar a perder XP.":
    "You have <b>{0}</b> grace day left before you start losing XP.",
  "Te quedan <b>{0}</b> días de gracia antes de empezar a perder XP.":
    "You have <b>{0}</b> grace days left before you start losing XP.",
  "Arrastra para acomodar · <b>Shift</b> y clic (o Shift y arrastra un recuadro) elige varios para moverlos juntos o agruparlos · tira del punto ▸ hacia otro nodo para conectarlos · toca una línea para cortarla · el círculo <b>Y/O</b> cambia si hacen falta todos los requisitos o basta uno":
    "Drag to arrange · <b>Shift</b> and click (or Shift and drag a box) picks several to move together or group · pull the ▸ dot onto another node to connect them · tap a line to cut it · the <b>Y/O</b> circle switches between needing all requirements or just one",
  "Toca un nodo para abrirlo · arrástralo para acomodarlo · el círculo <b>Y/O</b> cambia si hacen falta todos sus requisitos o basta uno":
    "Tap a node to open it · drag it to arrange it · the <b>Y/O</b> circle switches between needing all its requirements or just one",
  "Este talento corona varios caminos: se desbloquea cuando estén completos los {0}.":
    "This talent crowns several paths: it unlocks when all {0} are complete.",
  "Son caminos alternativos: se desbloquea en cuanto completes cualquiera de los {0}.":
    "These are alternative paths: it unlocks as soon as you complete any of the {0}.",
  "En el mapa es el círculo con la letra <b>{0}</b> a su izquierda, y ahí también se cambia de un toque.":
    "On the map it's the circle with the letter <b>{0}</b> to its left, and you can change it there with one tap too.",
  "Esta meta no tiene etapas: <b>ella misma es la etapa</b>. Se cierra confirmándola abajo.":
    "This goal has no stages: <b>it is its own stage</b>. You close it by confirming below.",
  "Llevas <b>{0}%</b> — {1} de {2} etapas.": "You're at <b>{0}%</b> — {1} of {2} stages.",

  /* Las tres que cazó el auditor recorriendo la app entera en inglés. */
  "＋ Crear habilidad": "＋ Create skill",
  /* El valor con el que nace el rótulo en `index.html`, antes de que
     `js/08-formularios.js` lo reescriba con la moneda de cada quien. */
  "Costo (MXN)": "Cost (MXN)",
  "Con una cuenta puedes tener plan": "With an account you can have a plan"
};
