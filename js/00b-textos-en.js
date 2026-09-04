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
  "Con una cuenta puedes tener plan": "With an account you can have a plan",

  /* ================= Tanda 3 =================
     El panel de numeros, los informes, la expedicion, el lienzo, los planes,
     las apariencias y los rotulos cortos de todas las pantallas.

     Aqui la herramienta aprendio a leer el archivo como lo lee JavaScript.
     La version anterior envolvia por expresion regular, sin saber en que
     estaba, y metio 24 llamadas dentro de cadenas con COMILLAS SIMPLES —donde
     `${...}` no es un hueco sino texto, asi que la pantalla habria impreso
     `${tx("Nuevo")}` tal cual—. Media docena de archivos de Norata construyen
     su HTML concatenando comillas, y por eso el error no era raro sino el
     caso normal en esos archivos. Se reviritio la tanda entera y se rehizo.

     Dos clases de rotulo que NO caza ningun buscador y van a mano:

     - **Los de una o dos palabras sin tilde** —«INVERTIDO», «Racha», «Ficha»—,
       que se leen igual que un identificador y por eso van en una lista.
     - **Los que viven en una TABLA de datos** (`PROJECT_STATUS`, `MODULOS`,
       `TABLEROS_FIJOS`). Esos se envuelven donde se DIBUJAN y jamas en la
       tabla: una tabla de nivel superior se evalua una sola vez al cargar el
       archivo, asi que un `tx()` ahi congela el rotulo en el idioma que
       hubiera al arrancar y cambiar de idioma no lo mueve. */

  "Hola, {0}": "Hi, {0}",
  "Buenos días": "Good morning",
  "Buenas tardes": "Good afternoon",
  "Buenas noches": "Good evening",
  "Ahora no": "Not now",
  "Qué es tu expedición": "What your journey is",
  "Es el nivel de tu": "It's the level of your",
  ", no el de una habilidad suelta: un solo número para todo lo que haces en Norata — los días que apareces, las misiones que cumples, las habilidades que suben, y los talentos y proyectos que cierras.":
    ", not of any single skill: one number for everything you do in Norata — the days you show up, the missions you complete, the skills that rise, and the talents and projects you close.",
  "No hay nada que administrar: sube solo con lo que ya estás haciendo, y no tiene techo. Más abajo puedes ver el reparto exacto, renglón por renglón.":
    "There's nothing to manage: it rises on its own from what you're already doing, and it has no ceiling. Further down you can see the exact breakdown, line by line.",
  "Tus rangos": "Your ranks",
  "Cinco en toda la vida de una cuenta. Cada uno son seis niveles, y cada nivel avanza un tramo de su constelación. El rango se consigue al cerrarla, y se queda puesto.":
    "Five over the whole life of an account. Each one is six levels, and each level advances a stretch of its constellation. You earn the rank by closing it, and it stays with you.",
  "Lo que desbloqueas al subir": "What you unlock as you rise",
  "El nivel sube solo con lo que ya haces. Esto es lo que vas desbloqueando por el camino.":
    "Your level rises on its own from what you already do. This is what you unlock along the way.",
  "Ver Mi apariencia": "See My look",
  "De dónde salen tus puntos": "Where your points come from",
  "Todavía nada. Cumple una misión o registra una práctica y esto empieza a llenarse.":
    "Nothing yet. Complete a mission or log a practice and this starts filling up.",
  "Crear aquí": "Create here",
  "Toca los talentos que quieras juntar": "Tap the talents you want to group",
  "Sin cuenta": "No account",
  "Entra para sincronizar tus dispositivos": "Sign in to sync your devices",
  "No hay ninguna, y es buena señal: significa que tus dispositivos nunca han tenido que juntar cambios a la fuerza.":
    "There aren't any, and that's a good sign: it means your devices have never had to force changes together.",
  "Borrar": "Delete",
  "Tu plan": "Your plan",
  "Norata funciona entera sin cuenta, y lo que llevas hecho es tuyo. Para tener un plan hace falta una, porque es donde se guarda.":
    "Norata works completely without an account, and what you've done is yours. To have a plan you need one, because that's where it's kept.",
  "Crear mi cuenta": "Create my account",
  "Quita los topes": "Removes the limits",
  "Las ramas que quieras y sin tope de talentos dentro de cada una. Lo que ya escribiste no se toca nunca: al cambiar de plan no se borra nada.":
    "As many branches as you want, with no cap on talents inside each one. What you already wrote is never touched: changing plans deletes nothing.",
  "Pasar a Plan Pro": "Move to the Pro plan",
  "Un solo pago": "A single payment",
  "Pasar a Plan Fundador": "Move to the Founder plan",
  "Todavía no hay ni un día con actividad. Aparecerá en cuanto alguien abra la app con su cuenta.":
    "There isn't a single day with activity yet. It will show up as soon as someone opens the app with their account.",
  "personas que abrieron": "people who opened it",
  "personas al día": "people per day",
  "aperturas con cuenta": "openings with an account",
  "Todavía no hay nadie registrado, así que no hay embudo que mirar.":
    "Nobody has signed up yet, so there's no funnel to look at.",
  "sube en vez de bajar: este paso no se cuenta como un trozo del anterior":
    "it goes up instead of down: this step isn't counted as a slice of the previous one",
  "no se pierde nadie": "nobody is lost",
  "Lo que la gente reporta": "What people report",
  "Agrupados por dónde dicen que pasó, no por el texto: dos personas contando dos cosas distintas de la misma pantalla son dos historias, y sumarlas borraría lo que las hace útiles. Toca un grupo para leerlos.":
    "Grouped by where they say it happened, not by the text: two people describing two different things about the same screen are two stories, and adding them up would erase what makes them useful. Tap a group to read them.",
  "Modo de pruebas": "Test mode",
  "Solo lo ves tú, y solo mientras esta cuenta sea administradora. No cambia nada en el servidor: lo que hay aquí decide qué se DIBUJA, no lo que la base de datos cree.":
    "Only you see this, and only while this account is an administrator. It changes nothing on the server: what's here decides what gets DRAWN, not what the database believes.",
  "Esta cuenta": "This account",
  "De pruebas": "Test",
  "Ver la app como si tuviera": "See the app as if it had",
  "Ver una celebración": "See a celebration",
  "Se disparan aquí porque algunas pasan una vez en la vida de una cuenta y no hay forma de revisarlas esperándolas. No tocan tus datos ni tu nivel: solo dibujan.":
    "They're triggered here because some happen once in an account's lifetime and there's no way to review them by waiting. They don't touch your data or your level: they only draw.",
  "Los números": "The numbers",
  "Se piden al servidor cuando abres esta sección.":
    "They're requested from the server when you open this section.",
  "Cargar los números": "Load the numbers",
  "Para mirar": "To look at",
  "El embudo": "The funnel",
  "Cada paso es un trozo del anterior. El escalón donde más gente se cae es el que hay que arreglar primero — y casi nunca es el que uno cree.":
    "Each step is a slice of the previous one. The step where most people drop off is the one to fix first — and it's almost never the one you'd guess.",
  "La gente": "People",
  "Los últimos 14 días": "The last 14 days",
  "Los puntos son personas que abrieron la app; las barras del fondo, cuentas nuevas. Las líneas verticales marcan cada lunes, para comparar una semana con otra.":
    "The dots are people who opened the app; the bars behind them, new accounts. The vertical lines mark each Monday, so you can compare one week with another.",
  "Cómo la usan": "How they use it",
  "Desde qué aparato": "From which device",
  "Sale del ancho de la ventana, no de fichar el aparato: dos teléfonos distintos cuentan como uno.":
    "It comes from the window width, not from fingerprinting the device: two different phones count as one.",
  "Instalada o en el navegador": "Installed or in the browser",
  "Instalada se abre sola; en una pestaña se olvida. Señal buena: 30 de cada 100.":
    "Installed, it opens on its own; in a tab, it gets forgotten. A good sign: 30 out of every 100.",
  "Cuánto llevan con cuenta": "How long they've had an account",
  "El cobro": "Billing",
  "El cobro todavía no está puesto en el servidor, así que aquí no hay nada que contar. Cuando corras":
    "Billing isn't set up on the server yet, so there's nothing to count here. Once you run",
  "y despliegues Stripe, esta caja se llena sola — los pasos están en":
    "and deploy Stripe, this box fills itself — the steps are in",
  "Con qué versión se quedó cada quien": "Which version each person ended up on",
  "Una fila por persona:": "One row per person:",
  "la última versión que vio": "the last version they saw",
  ", no todas las que ha usado nunca. Si aquí aparece una que ya no existe, hay alguien pegado a una copia vieja — casi siempre porque no se subió el número de":
    ", not every one they've ever used. If one shows up here that no longer exists, someone is stuck on an old copy — almost always because the number wasn't bumped in",
  "en": "in",
  "Lo que se rompe solo": "What breaks on its own",
  "Ni un error en los últimos treinta días.": "Not a single error in the last thirty days.",
  "llega a la vara": "meets the bar",
  "hay que mirarlo": "worth a look",
  "se pierde gente": "people are being lost",
  "Lo demás va en tinta normal a propósito: es un dato, no un juicio. Un número sin una vara contra la que compararse no puede estar bien ni mal.":
    "Everything else is in plain ink on purpose: it's a figure, not a verdict. A number with no bar to measure against can't be good or bad.",
  "Volver a pedirlos": "Ask for them again",
  "Pidiendo los números…": "Asking for the numbers…",
  "No pude traer los números": "I couldn't fetch the numbers",
  "récord": "record",
  "Cada casilla es un día": "Each square is a day",
  "Más": "More",
  "Tu racha más larga": "Your longest streak",
  "Invertido en ti": "Invested in you",
  "Veces que marcaste": "Times you checked in",
  "Se les pasó el plazo": "They ran past the deadline",
  "Días de media": "Days on average",
  "Dentro de plazo": "Within the deadline",
  "El más rápido": "The fastest",
  "El más lento": "The slowest",
  "Etapas cerradas": "Stages closed",
  "Qué veo aquí": "What I see here",
  "Todavía es pronto para leer nada. Con unos días de uso, aquí aparece lo que se ve en tus números — el día que se te cae, de dónde sale tu XP, qué llevas parado.":
    "It's still too early to read anything. After a few days of use, this shows what your numbers say — the day you tend to drop, where your XP comes from, what you've left standing still.",
  "Tu expedición": "Your journey",
  "Leer veinte páginas": "Read twenty pages",
  "Hoy · todos los días": "Today · every day",
  "Es la que llevas puesta.": "This is the one you're wearing.",
  "El mismo Norata con otra luz. Se van desbloqueando conforme avanzas, y el modo de día y de noche sigue arriba: cada ambiente tiene sus dos caras.":
    "The same Norata in a different light. They unlock as you progress, and day and night mode stays above: every ambience has both faces.",
  "Un mundo no es otra luz: es otro material. Cambia la superficie, el marco, la letra y hasta cómo se llama tu camino. Van aparte de los ambientes porque no se combinan — llevas uno o llevas el otro.":
    "A world isn't another light: it's another material. It changes the surface, the frame, the type and even what your path is called. They're separate from ambiences because they don't combine — you wear one or the other.",
  "Esta copia de Norata está desactualizada": "This copy of Norata is out of date",
  "Tu progreso lo guardó una versión más nueva de la app, así que aquí no puedo entenderlo del todo.":
    "Your progress was saved by a newer version of the app, so I can't fully understand it here.",
  "Mientras tanto no voy a guardar nada.": "In the meantime I won't save anything.",
  "Actualiza Norata en este dispositivo y vuelve a abrirla.":
    "Update Norata on this device and open it again.",
  "Buscar la versión nueva": "Look for the new version",
  "Guardar un respaldo": "Save a backup",
  "Acomodos sugeridos": "Suggested layouts",
  "Agruparlos": "Group them",
  "Ambientes": "Ambiences",
  "Aplicar": "Apply",
  "Asegurados": "Secured",
  "Aspecto": "Look",
  "Bloqueado": "Locked",
  "CREADO": "CREATED",
  "Completados": "Completed",
  "Constancia": "Consistency",
  "Cosas cerradas": "Things closed",
  "DECAYENDO": "DECAYING",
  "Desbloqueaste": "You unlocked",
  "Descartar encargo": "Discard assignment",
  "ENTRENA": "TRAINS",
  "Encargos terminados": "Assignments finished",
  "Entrar": "Sign in",
  "Ficha": "Card",
  "Ganada": "Earned",
  "Historial": "History",
  "INVERTIDO": "INVESTED",
  "Intentar otra vez": "Try again",
  "Invertido": "Invested",
  "Menos": "Less",
  "Misiones cumplidas": "Missions completed",
  "Movimientos": "Entries",
  "Mundos": "Worlds",
  "Neta": "Net",
  "Niveles subidos": "Levels gained",
  "Normal": "Normal",
  "Nota (opcional)": "Note (optional)",
  "Opcional": "Optional",
  "Perdida": "Lost",
  "Perdiendo XP": "Losing XP",
  "RECOMPENSA": "REWARD",
  "Racha": "Streak",
  "Recuperar mi cuenta": "Recover my account",
  "Registros": "Entries",
  "Restaurar": "Restore",
  "Retomar": "Pick back up",
  "Retomar encargo": "Pick the assignment back up",
  "Salir": "Exit",
  "Seleccionar": "Select",
  "Soltados": "Let go",
  "Talento perdido": "Talent lost",
  "Tiempo practicado": "Time practiced",
  "XP ganada": "XP earned",
  "cualquiera": "any",
  "cuenta": "account",
  "cuentas nuevas": "new accounts",
  "hechos": "done",
  "niveles": "levels",
  "opcional": "optional",
  "promedio": "average",
  "— Ninguna —": "— None —",
  "▾ perdiendo XP": "▾ losing XP",
  "＋ etapa": "＋ stage",
  "Rehacer": "Redo",
  "En marcha": "Under way",
  "En pausa": "Paused",
  "Terminado": "Finished",
  "Descartado": "Discarded",
  "Espera su turno": "Waiting its turn",
  "Estancado": "Stalled",
  "Enfriándose": "Cooling off",
  "Casi listo": "Almost there",
  "Con ritmo": "Keeping pace",
  "Cerrado y guardado en tu historial.": "Closed and kept in your history.",
  "Lo soltaste. Puedes retomarlo cuando quieras.":
    "You let it go. You can pick it back up whenever you want.",
  "Congelado a propósito: no cuenta como abandonado.":
    "Frozen on purpose: it doesn't count as abandoned.",
  "Estás a nada de cerrarlo. Termina las etapas que faltan.":
    "You're a hair from closing it. Finish the remaining stages.",
  "Lo que haces hoy, con su racha": "What you do today, with its streak",
  "Lo que practicas y sube de nivel": "What you practice and level up",
  "Metas con inversión de dinero real": "Goals with real money invested",
  "Lo que construyes, encargo a encargo": "What you build, assignment by assignment",
  "Pendientes de hoy": "Due today",
  "Cumplidas hoy": "Done today",
  "Pendientes de la semana": "Due this week",
  "Misiones terminadas": "Finished missions",
  "otro tablero": "another board",
  "{0} vuelve al menú": "{0} is back in the menu",
  "Oculto · puedes traerlo de vuelta aquí": "Hidden · you can bring it back here",

  /* ================= Tanda 4: lo que lleva números dentro =================
     La tarjeta de la racha, el calendario y las fechas de los informes.

     Los MESES y las LETRAS DE LA SEMANA no están aquí, y es a propósito: los
     da `Intl` desde `nombreDeMes()` y `letrasDeSemana()` (js/00-idioma.js).
     Había cinco listas escritas a mano en cinco archivos, las cinco en
     español. Copiarlas al diccionario sería repetir a mano lo que el
     navegador ya trae —y equivocarse: en inglés los meses llevan mayúscula
     inicial y en español no.

     Y aquí salió la trampa de este motor: **una clave que sirve para dos
     frases distintas traduce mal una de las dos, siempre.** «{0} de {1}»
     valía a la vez para «3 de septiembre» y para «Septiembre de 2026», que en
     inglés son «September 3» y «September 2026» — nada que ver. Se separan
     escribiendo en el código lo que cada una es de verdad («El mes de {0} de
     {1}»), no buscando una traducción que sirva para las dos. */

  "Hoy ya cuenta.": "Today already counts.",
  "Hoy todavía no cuenta. Cualquier registro la mantiene viva.":
    "Today doesn't count yet. Any entry keeps it alive.",
  "Cualquier registro de hoy la echa a andar.": "Any entry today gets it going.",
  "día<br>de racha": "day<br>streak",
  "días<br>de racha": "day<br>streak",
  "en {0}": "in {0}",
  "{0} de {1}": "{1} {0}",
  ": {0} registro": ": {0} entry",
  ": {0} registros": ": {0} entries",
  "{0} de {1}:": "{1} {0}:",
  "{0} marca": "{0} check-in",
  "{0} marcas": "{0} check-ins",
  "nada": "nothing",
  "hoy": "today",
  "día {0} de {1}": "{1} {0}",
  "· día {0} de {1}": "· {1} {0}",
  "El mes de {0} de {1}": "{0} {1}",
  "Del {0} al {1} de {2}": "{2} {0}–{1}",
  "Del {0} de {1} al {2} de {3}": "{1} {0} – {3} {2}",
  "de los {0} días que llevas de {1}": "of the {0} days so far in {1}",

  /* ---- Los nombres de las tarjetas del tablero, y las cifras con su frase ----
     Los nombres viven en `DASH_META`, que es otra tabla: se traducen donde se
     dibujan —en la tarjeta, en los dos botones de encima, en la bandeja del
     Modo Editor y en el aviso de deshacer—, que son cinco sitios y el mismo
     nombre. */

  "niveles en {0} habilidad": "levels across {0} skill",
  "niveles en {0} habilidades": "levels across {0} skills",
  "XP ganada frente a los 7 días anteriores": "XP earned compared with the previous 7 days",
  "A {0} XP del nivel {1}": "{0} XP from level {1}",
  "PUNTOS PARA EL {0}": "POINTS TO {0}",
  "En el siguiente nivel": "At the next level",
  "A {0} niveles": "{0} levels away",
  " · con Pro": " · with Pro",
  "talento ya es tuyo": "talent is already yours",
  "talentos ya son tuyos": "talents are already yours",
  "Quitar {0}": "Remove {0}",
  "Cambiar tamaño de {0}": "Resize {0}",
  "{0} quitado del tablero": "{0} removed from the board",
  "Próximo hito · {0} días": "Next milestone · {0} days",
  "Te falta un nivel": "One level to go",
  "Te faltan {0} niveles": "{0} levels to go",
  "{0} pendiente": "{0} left",
  "{0} pendientes": "{0} left",
  "Todas cumplidas": "All done",
  "Nivel {0} · {1} · {2}% del nivel": "Level {0} · {1} · {2}% of the level",
  "Nivel {0}, rango {1}": "Level {0}, {1} rank",
  "Te falta 1 día": "1 day to go",
  "Te faltan {0} días": "{0} days to go",
  "Niveles": "Levels",
  "Expedición": "Journey",

  /* ---- La tira de cifras de arriba de cada módulo ----
     Cuatro columnas por pantalla, y es lo primero que se ve al entrar. Los
     rótulos los arman los cuatro `statsPanel*` de `js/10f-informes.js`.

     Ahí vivía la trampa más escondida de todo esto: `CONTRA` —el texto de los
     `title` de las flechas— era una CONSTANTE de nivel superior, o sea que se
     evaluaba una sola vez al cargar el archivo y se quedaba con el idioma de
     arranque para siempre. Cambiar de idioma no la movía, y no se veía: el
     texto está dentro de un `title`. Ahora es una función. */

  "frente a los {0} días anteriores": "compared with the previous {0} days",
  "Hoy": "Today",
  "Cumplidas · {0} días": "Completed · {0} days",
  "Marcas de misión {0}": "Mission check-ins {0}",
  "Cumplidas de las que tocaban, {0}": "Completed out of those due, {0}",
  "XP · {0} días": "XP · {0} days",
  "XP ganada {0}": "XP earned {0}",
  "Niveles subidos {0}": "Levels gained {0}",
  "Decayendo": "Decaying",
  "En curso": "In progress",
  "Asegurados · {0} días": "Secured · {0} days",
  "Talentos asegurados {0}": "Talents secured {0}",
  "Invertido · {0} días": "Invested · {0} days",
  "Invertido {0}": "Invested {0}",
  "Por vencer": "Running out",
  "Vivos": "Alive",
  "Estancados": "Stalled",
  "Etapas · {0} días": "Stages · {0} days",
  "Etapas cerradas {0}": "Stages closed {0}",
  "Terminados · {0} días": "Finished · {0} days",
  "Encargos terminados {0}": "Assignments finished {0}",
  "Es la racha más larga que has tenido": "It's the longest streak you've had",
  /* El foco: la única fila que dice qué tocar ahora, debajo de las cifras. */
  "Lo siguiente para hoy": "Next up today",
  "Siguiente etapa": "Next stage",
  "Listo para empezar": "Ready to start",
  "talento": "talent",
  "talentos": "talents",
  "{0} talento": "{0} talent",
  "{0} talentos": "{0} talents",
  "{0} talento al ático": "{0} talent in the attic",
  "{0} talentos al ático": "{0} talents in the attic",

  /* ================= Tanda 7: los tres bloques que se concatenan =================
     El tutorial, el formulario de reportar un fallo y el panel de sincronia
     —incluido borrar la cuenta—. Los tres construyen su HTML pegando cadenas con
     comillas simples, asi que ninguna herramienta los pudo tocar: van a mano.
     Y aqui vive la traduccion que MAS importa de todas: «BORRAR MI CUENTA», la
     frase que hay que teclear para confirmar. Estaba en una constante de nivel
     superior, o sea congelada en el idioma de arranque — y eso no es un rotulo
     feo, es que alguien con la app en ingles tendria que copiar tres palabras en
     espanol que no significan nada para el, y si las copia mal no puede borrar su
     cuenta. Ahora es una funcion, y se compara sin distinguir mayusculas.
  */

  "Saltar tutorial": "Skip the tour",
  "Empezar": "Get started",
  "Te doy la bienvenida": "Welcome",
  "Norata lleva tu vida con la mecánica de un juego de rol: lo que <b>haces</b>, lo que <b>practicas</b>, lo que <b>te propones</b> y lo que <b>construyes</b>.":
    "Norata runs your life with the mechanics of a role-playing game: what you <b>do</b>, what you <b>practice</b>, what you <b>set out to do</b> and what you <b>build</b>.",
  "Son cuatro secciones. Te cuento en un minuto qué hace cada una.":
    "There are four sections. I'll tell you what each one does in a minute.",
  "Lo que haces <b>hoy</b>. Pequeñas y repetibles: salir a caminar, leer diez páginas. Cada vez que cumples una sube una habilidad y sigue viva tu racha.":
    "What you do <b>today</b>. Small and repeatable: going for a walk, reading ten pages. Every time you complete one, a skill goes up and your streak stays alive.",
  "Si dudas por dónde empezar, empieza aquí.": "If you're not sure where to start, start here.",
  "Lo que <b>practicas</b>. No se marcan como hechas: acumulan XP y suben de nivel con las horas que les dedicas.":
    "What you <b>practice</b>. You don't check them off: they gather XP and level up with the hours you give them.",
  "Y si dejas una abandonada mucho tiempo, baja. El progreso se sostiene, no se guarda.":
    "And if you leave one alone too long, it drops. Progress is held up, not stored away.",
  "Lo que <b>te propones</b>, en un mapa. Cada nodo es una compra, un hito o una meta, y se encadenan: unos abren el paso a otros.":
    "What you <b>set out to do</b>, on a map. Each node is a purchase, a milestone or a goal, and they chain together: some open the way to others.",
  "Es el módulo para lo que cuesta dinero o meses, no para lo de esta tarde.":
    "This is the module for what costs money or months, not for this afternoon.",
  "Los <b>proyectos</b> que te haces a ti: cosas que construyes por etapas, con principio y final. La app mide tu ritmo y te dice cuáles siguen vivos.":
    "The <b>projects</b> you take on: things you build in stages, with a beginning and an end. The app measures your pace and tells you which ones are still alive.",
  "Un proyecto que lleva semanas quieto te lo dirá, sin regañarte.":
    "A project that's been still for weeks will tell you, without scolding you.",
  "Y todo se conecta": "And it all connects",
  "Una misión cumplida, un talento logrado o una etapa de proyecto terminan en el mismo sitio: <b>XP para tus habilidades</b>.":
    "A mission completed, a talent achieved or a project stage all end up in the same place: <b>XP for your skills</b>.",
  "Puedes apagar los módulos que no uses desde Ajustes, y volver a ver esto cuando quieras.":
    "You can turn off the modules you don't use from Settings, and see this again whenever you want.",
  "Al entrar o cerrar sesión": "Signing in or out",
  "Otra parte": "Somewhere else",
  "Cuéntame qué pasó y lo reviso. No necesitas saber nada técnico: con lo que recuerdes me basta para encontrarlo.":
    "Tell me what happened and I'll look into it. You don't need to know anything technical: whatever you remember is enough for me to find it.",
  "¿Dónde pasó?": "Where did it happen?",
  "¿Qué hacías justo antes? <i>Opcional</i>":
    "What were you doing just before? <i>Optional</i>",
  "Ej. Abrí un talento desde el mapa": "e.g. I opened a talent from the map",
  "¿Qué salió mal?": "What went wrong?",
  "La pantalla se quedó en blanco y no volvió.": "The screen went blank and never came back.",
  "Enviar": "Send",
  "No mandé nada: falta contar qué salió mal.":
    "I didn't send anything: you still need to say what went wrong.",
  "Ya me llegó y lo voy a revisar. Cosas como ésta son las que hacen que Norata deje de fallar donde falla.":
    "It reached me and I'll look into it. Things like this are what make Norata stop failing where it fails.",
  "De nada": "You're welcome",
  "Gracias por avisarme": "Thanks for telling me",
  "No pude enviarlo: revisa tu conexión y vuelve a intentarlo.":
    "I couldn't send it: check your connection and try again.",
  "Tu progreso vive en este navegador. También puedes guardarlo en un archivo: es tuyo y funciona sin conexión.":
    "Your progress lives in this browser. You can also save it to a file: it's yours and it works offline.",
  "Tu progreso vive en este navegador y en {0}. También puedes guardarlo en un archivo: es tuyo y funciona sin conexión.":
    "Your progress lives in this browser and in {0}. You can also save it to a file: it's yours and it works offline.",
  "Solo en este dispositivo": "Only on this device",
  "Tu progreso no sale de este navegador.": "Your progress doesn't leave this browser.",
  "Sincronizando…": "Syncing…",
  "No pude sincronizar": "I couldn't sync",
  "Cambios sin subir": "Changes not uploaded",
  "Al día con {0}": "Up to date with {0}",
  "· última vez {0}": "· last time {0}",
  "Sin nombre": "No name",
  "¿Cómo te decimos? <i>opcional</i>": "What should we call you? <i>optional</i>",
  "Es lo que usaremos al saludarte, aquí y en los correos. Hasta {0} letras.":
    "It's what we'll use to greet you, here and in emails. Up to {0} characters.",
  "Nombre de este dispositivo": "This device's name",
  "Aparece cuando dos dispositivos cambian lo mismo y hay que elegir.":
    "It shows up when two devices change the same thing and you have to choose.",
  "Sincronizar ahora": "Sync now",
  "Cerrar sesión en este dispositivo": "Sign out on this device",
  "Iniciar sesión o crear cuenta": "Sign in or create an account",
  "Mientras tanto tu progreso se guarda solo en este dispositivo. Al entrar, lo que ya tienes aquí sube a tu cuenta.":
    "In the meantime your progress is saved only on this device. When you sign in, what you already have here goes up to your account.",
  "BORRAR MI CUENTA": "DELETE MY ACCOUNT",
  "Borrar la cuenta": "Delete the account",
  "Se cierra tu sesión y este dispositivo queda vacío, pero la cuenta no se borra hasta <b>30 días después</b>. Si te arrepientes, entra otra vez con tu correo y la recuperas con todo tu progreso.":
    "You're signed out and this device is left empty, but the account isn't deleted until <b>30 days later</b>. If you change your mind, sign in again with your email and you get it back with all your progress.",
  "Borrar mi cuenta": "Delete my account",
  "tu cuenta": "your account",
  "Si borras la cuenta ahora, el cobro seguirá vivo por su cuenta y te seguiríamos cobrando algo que ya no usas. Borrar la cuenta aquí no cancela el cobro.\n\nCancela primero tu plan y vuelve: tu progreso te espera mientras tanto, y podrás borrar la cuenta aunque al plan le queden meses.":
    "If you delete the account now, the billing stays alive on its own and we'd keep charging you for something you no longer use. Deleting the account here doesn't cancel the billing.\n\nCancel your plan first and come back: your progress waits for you in the meantime, and you'll be able to delete the account even if the plan has months left.",
  "Ir a cancelar mi plan": "Go cancel my plan",
  "Tu plan se sigue cobrando": "Your plan is still being charged",
  "Tu lugar de fundador es de por vida y no se puede recuperar: al borrar la cuenta se va con ella.\n\nLos lugares de fundador son limitados y no se reponen. Si algún día quisieras volver, el plan podría estar agotado y tendrías que entrar por una suscripción normal.\n\nSi solo quieres empezar de cero, «Vaciar la app» te deja la cuenta —y tu lugar— intactos.":
    "Your founder place is for life and can't be recovered: deleting the account takes it with it.\n\nFounder places are limited and aren't replaced. If you ever wanted to come back, the plan could be sold out and you'd have to come in through a regular subscription.\n\nIf you only want to start over, «Empty the app» leaves your account —and your place— untouched.",
  "Aun así, borrar mi cuenta": "Delete my account anyway",
  "Vas a perder tu lugar de fundador": "You're going to lose your founder place",
  "Mejor no": "Better not",
  "Tu plan actual está pagado hasta el <b>{0}</b>. Se perderá el tiempo que sobre después de borrarse tu cuenta de forma definitiva.":
    "Your current plan is paid until <b>{0}</b>. Whatever time is left will be lost once your account is deleted for good.",
  "Se cerrará tu sesión y este dispositivo perderá tu progreso. La cuenta <b>{0}</b> se borrará dentro de <b>30 días naturales</b>; hasta entonces podrás recuperarla entrando nuevamente con tu correo.":
    "You'll be signed out and this device will lose your progress. The account <b>{0}</b> will be deleted in <b>30 calendar days</b>; until then you can get it back by signing in again with your email.",
  "Estás a punto de borrar tu cuenta.": "You're about to delete your account.",
  "Escribe {0} para confirmar que quieres borrarla.":
    "Type {0} to confirm you want to delete it.",
  "¿Nos cuentas por qué te vas?": "Will you tell us why you're leaving?",
  "Lo que no funcionó, lo que echaste de menos, o algo que desees compartirnos para mejorar Norata.":
    "What didn't work, what you missed, or anything you'd like to share with us to make Norata better.",
  "No coincide. No borré nada.": "That doesn't match. I didn't delete anything.",
  "Última confirmación: se borrará tu cuenta. ¿Seguro?":
    "Last confirmation: your account will be deleted. Are you sure?",
  "Sí, borrarla": "Yes, delete it",
  "Programando el borrado…": "Scheduling the deletion…",

  /* ---- El sol y la luna ----
     Viven en el indice de Ajustes y no dentro de una seccion: son un
     interruptor de dos posiciones que se resuelve de un toque.
  */

  "Oscuro": "Dark",
  "Claro": "Light",
  "Aspecto de la app": "The app's look",

  /* ================= Tanda 8: los avisos sueltos y el catalogo =================
     Los `toast()` y las confirmaciones repartidas por los módulos, y el
     catálogo de habilidades entero.

     Del catálogo se traducen las 47 habilidades Y sus seis categorías, porque
     las dos cosas se GUARDAN dentro de cada habilidad que se añade desde ahí.
     La clave interna sigue siendo el nombre español: es lo que compara
     `yaTengo()` y lo que busca el asistente de bienvenida para dar icono y
     color. Sin eso, en inglés el catálogo enseñaría «Drawing» como disponible
     teniendo ya la habilidad puesta, y añadirla la duplicaría.
  */

  "Aprendizaje": "Learning",
  "Vida adulta": "Adult life",
  "Aire libre": "Outdoors",
  "Añade las que te interese seguir, aunque sea en cero: ver una habilidad sin empezar te recuerda que existe. Las de aquí además se reconocen solas — al escribir un talento o un proyecto se proponen para recibir el XP. Si te falta alguna, créala arriba: esa lo irá aprendiendo del uso.":
    "Add the ones you care about following, even at zero: seeing a skill you haven't started reminds you it exists. The ones here are also recognised on their own — when you write a talent or a project they offer themselves to receive the XP. If one is missing, create it above: that one will learn from use.",
  "Quitar todas": "Remove all",
  "Todas": "All",
  "Natación": "Swimming",
  "Ciclismo": "Cycling",
  "Escalada": "Climbing",
  "Baile": "Dancing",
  "Primeros auxilios": "First aid",
  "Cuidado personal": "Self-care",
  "Jardinería": "Gardening",
  "Botánica": "Botany",
  "Carpintería": "Woodworking",
  "Reparaciones": "Repairs",
  "Costura": "Sewing",
  "Mecánica": "Mechanics",
  "Electrónica": "Electronics",
  "Pintura": "Painting",
  "Fotografía": "Photography",
  "Caligrafía": "Calligraphy",
  "Guitarra": "Guitar",
  "Piano": "Piano",
  "Canto": "Singing",
  "Cerámica": "Pottery",
  "Vídeo": "Video",
  "Programación": "Programming",
  "Astronomía": "Astronomy",
  "Ajedrez": "Chess",
  "Historia": "History",
  "Liderazgo": "Leadership",
  "Barismo": "Coffee making",
  "Pesca": "Fishing",
  "Senderismo": "Hiking",
  "Supervivencia": "Survival",
  "Buceo": "Diving",
  "Orientación": "Navigation",
  "No pude guardar: este navegador se quedó sin espacio. Exporta un respaldo antes de seguir.":
    "I couldn't save: this browser ran out of space. Export a backup before going on.",
  "Primero completa el requisito": "Complete the requirement first",
  "Una compra necesita su importe. Edítala y ponle cuánto costó.":
    "A purchase needs its amount. Edit it and say what it cost.",
  "Todas las etapas hechas. Confirma la meta cuando quieras":
    "All stages done. Confirm the goal whenever you want",
  "Elige al menos dos talentos": "Pick at least two talents",
  "Todas las etapas listas — ciérralo cuando quieras":
    "All stages ready — close it whenever you want",
  "Escribe el nombre de la etapa": "Type the stage's name",
  "Deja al menos un módulo encendido": "Leave at least one module on",
  "Desliza otra vez para salir": "Swipe again to exit",
  "Modo Editor cerrado · tu tablero quedó guardado": "Editor mode closed · your board is saved",
  "No hay nada que deshacer en el tablero": "There's nothing to undo on the board",
  "No hay nada marcado": "Nothing is selected",
  "No hay nada que deshacer": "There's nothing to undo",
  "Encargo creado · ábrelo para ponerle nombre":
    "Assignment created · open it to give it a name",
  "Listo, modo edición cerrado": "Done, edit mode closed",
  "Conexión eliminada": "Connection removed",
  "Un grupo no puede meterse dentro de otro": "A group can't go inside another one",
  "Esa conexión crearía un bucle": "That connection would create a loop",
  "Ya estaban conectados": "They were already connected",
  "Ponle un nombre a la habilidad": "Give the skill a name",
  "Ponle un nombre al talento": "Give the talent a name",
  "Una compra necesita su importe: ponle cuánto costó":
    "A purchase needs its amount: say what it cost",
  "Escribe qué vas a hacer": "Write what you're going to do",
  "Elige al menos un día": "Pick at least one day",
  "Misión actualizada": "Mission updated",
  "Misión eliminada": "Mission deleted",
  "Ponle un nombre al encargo": "Give the assignment a name",
  "Tres es suficiente para empezar": "Three is enough to start",
  "Saliste del ejemplo. Tus datos están como los dejaste.":
    "You left the example. Your data is just as you left it.",
  "Así se ve Norata en uso. Nada de esto se guarda: sal cuando quieras.":
    "This is Norata in use. None of it is saved: leave whenever you want.",
  "Misiones de ejemplo cargadas": "Example missions loaded",
  "Proyectos de ejemplo cargados": "Example projects loaded",
  "Ese respaldo viene de una versión más nueva de Norata. Actualiza la app aquí antes de importarlo.":
    "That backup comes from a newer version of Norata. Update the app here before importing it.",
  "El archivo no es un respaldo válido": "That file isn't a valid backup",
  "El correo no coincide. No borré nada.": "The email doesn't match. I didn't delete anything.",
  "Última confirmación: se borrará todo. ¿Seguro?":
    "Last confirmation: everything will be deleted. Are you sure?",
  "Esa copia ya no se puede leer": "That copy can't be read any more",
  "Se borrará esta copia de seguridad. No se puede deshacer.":
    "This safety copy will be deleted. It can't be undone.",
  "Listo: tu progreso ya está en {0}": "Done: your progress is now in {0}",
  "el otro dispositivo": "the other device",
  "Todo al día": "All up to date",
  "Sin conexión: se subirá cuando vuelva": "No connection: it'll upload when it's back",
  "Se borrará la credencial de este dispositivo y tu progreso dejará de subirse. Lo que ya subiste sigue en tu cuenta.":
    "This device's credential will be deleted and your progress will stop uploading. What you've already uploaded stays in your account.",
  "Trayendo tu progreso…": "Fetching your progress…",
  "Se borrará ahora mismo, sin esperar. Esto ya no se puede deshacer.":
    "It will be deleted right now, without waiting. This can't be undone.",
  "Guardando solo en este dispositivo": "Saving only on this device",
  "Errores dados por vistos": "Errors marked as seen",
  "Sin cuenta: no hay nada que traer": "No account: there's nothing to fetch",

  /* ---- Las pantallas del plan ----
     El comparador, los topes del plan Gratuito, la vuelta de Stripe y el
     distintivo de fundador.
  */

  "De vuelta a tu plan de verdad": "Back to your real plan",
  "Tu árbol pide otra rama": "Your tree is asking for another branch",
  "Otro proyecto en marcha": "Another project under way",
  "Este proyecto va lleno": "This project is full",
  "Tu lista de habilidades va llena": "Your skill list is full",
  "Llenaste esta rama": "You filled this branch",
  "Tu semana, de un vistazo": "Your week, at a glance",
  "Norata con otro material": "Norata in another material",
  "Tu plan Gratuito no incluye esta parte.": "Your Free plan doesn't include this part.",
  "Ramas de talentos ilimitadas": "Unlimited talent branches",
  "Talentos ilimitados en cada rama": "Unlimited talents in each branch",
  "Informes de la semana, del mes y del año": "Weekly, monthly and yearly reports",
  "Todas las apariencias": "Every look",
  "Tu plan terminó": "Your plan has ended",
  "Revisa tu pago": "Check your payment",
  "No pudimos cobrar tu último recibo": "We couldn't charge your last invoice",
  "Hay un problema con tu pago": "There's a problem with your payment",
  "Ese plan no existe.": "That plan doesn't exist.",
  "Entra con tu cuenta y el pago sigue donde lo dejaste.":
    "Sign in with your account and the payment picks up where you left it.",
  "El pago todavía no está disponible. Falta muy poco.":
    "Payment isn't available yet. It won't be long.",
  "Los lugares de fundador ya se agotaron.": "The founder places are sold out.",
  "No se pudo abrir el pago.": "I couldn't open the payment.",
  "No se pudo abrir tu suscripción.": "I couldn't open your subscription.",
  "Confirmando tu pago": "Confirming your payment",
  "Stripe ya cobró. Estamos esperando su aviso para encender tu plan; suele tardar un par de segundos.":
    "Stripe has charged you. We're waiting for its notice to switch your plan on; it usually takes a couple of seconds.",
  "Tu pago se registró": "Your payment went through",
  "El aviso de Stripe está tardando más de lo normal. Tu plan se encenderá solo en cuanto llegue: no hay que volver a pagar ni hacer nada. Si al recargar la app en unos minutos sigue igual, escríbenos.":
    "Stripe's notice is taking longer than usual. Your plan will switch on by itself as soon as it arrives: there's nothing to pay again and nothing to do. If it's still the same after reloading the app in a few minutes, write to us.",
  "Ya eres fundador": "You're already a founder",
  "Pago único, sin fecha y sin renovaciones. Tu lugar está guardado y la app queda abierta entera.":
    "A single payment, with no date and no renewals. Your place is saved and the whole app stays open.",
  "Tu plan está activo. Todo lo que sigue ya está encendido, y lo que tenías escrito sigue donde estaba.":
    "Your plan is active. Everything below is already on, and what you had written is right where it was.",
  "Las ramas de talentos que quieras": "As many talent branches as you want",
  "Más ramas de talentos": "More talent branches",
  "Talentos sin tope dentro de cada rama": "No cap on talents inside each branch",
  "Más talentos por rama": "More talents per branch",
  "Los resúmenes del mes y del año": "The monthly and yearly summaries",
  "Tu distintivo: Reliquia, el anillo lila y tu propia insignia":
    "Your badge: Relic, the lilac ring and your own emblem",
  "Sin costo": "Free",
  "Es tuyo para siempre y sin fecha. Norata entera funciona así; Pro solo quita los topes.":
    "It's yours forever and with no date. All of Norata works like this; Pro only removes the caps.",
  "Tienes Norata entera abierta por sostenerla, no por una compra. No hay ningún cobro asociado a esta cuenta.":
    "You have all of Norata open for supporting it, not for a purchase. There's no billing tied to this account.",
  "No pudimos cobrar tu último recibo. Revisa tu tarjeta para que no se interrumpa; hay tres días de margen desde la fecha de cobro.":
    "We couldn't charge your last invoice. Check your card so it isn't interrupted; there are three days of margin from the billing date.",
  "Lo pagaste una vez y es para siempre. No hay nada que renovar ni que cancelar.":
    "You paid once and it's forever. There's nothing to renew and nothing to cancel.",
  "Ramas de talentos": "Talent branches",
  "Talentos por rama": "Talents per branch",
  "De la semana, del mes y del año": "Weekly, monthly and yearly",
  "El panel de tu día": "Your day's panel",
  "Las paletas que vayas desbloqueando": "The palettes you unlock along the way",
  "Misiones, habilidades y proyectos": "Missions, skills and projects",
  "Sincronía entre dispositivos": "Syncing between devices",
  "Qué tienes abierto": "What you have open",
  "Qué tienes ahora": "What you have now",
  "Qué pagas": "What you pay",
  "Hasta cuándo": "Until when",
  "Para siempre": "Forever",
  "Termina el": "Ends on",
  "Editar suscripción": "Edit subscription",
  "Cuesta menos que un año del anual.": "It costs less than a year of the annual plan.",
  "dos": "two",
  "tres": "three",
  "El plan anual sale dos meses más barato.": "The annual plan comes out two months cheaper.",
  "Estás ahorrando dos meses frente al mensual.":
    "You're saving two months against the monthly plan.",
  "Pro entero y sin límites, para siempre": "All of Pro with no limits, forever",
  "Todo lo que Norata añada a Pro": "Everything Norata adds to Pro",
  "Reliquia, el mundo que solo tienen los fundadores": "Relic, the world only founders have",
  "Anillo lila en tu perfil y tu propia insignia":
    "A lilac ring on your profile and your own emblem",
  "Sin tope": "No cap",
  "La otra sigue": "The other one stays",
  "Pro abre las que quieras y deja de contar los talentos de cada una.":
    "Pro opens as many as you want and stops counting the talents in each one.",
  "contar los talentos de cada una.": "counting the talents in each one.",
  "Tu única rama": "Your only branch",
  "Ahí puedes consultar y descargar el comprobante de tu pago.":
    "There you can view and download your payment receipt.",
  "Ahí puedes actualizar tu método de pago, consultar tus recibos y cancelar la renovación cuando lo decidas.":
    "There you can update your payment method, check your invoices and cancel the renewal whenever you decide.",
  "Pagos procesados por Stripe": "Payments processed by Stripe",
  "Datos cifrados de extremo a extremo": "End-to-end encrypted data",
  "Ocultar la comparación": "Hide the comparison",
  "Comparar los planes": "Compare the plans",
  "Semana, mes y año": "Week, month and year",
  "Solo el panel del día": "Only the day's panel",
  "Todas, y Reliquia": "All of them, and Relic",
  "Tu progreso y tu XP": "Your progress and your XP",
  "Cómo se paga": "How you pay",
  "Es gratis": "It's free",
  "Pago único": "One-time payment",
  "Distintivo de fundador": "Founder badge",
  "Se renueva solo. Cancelas cuando quieras.": "It renews by itself. Cancel whenever you want.",
  "al año": "a year",
  "Se renueva cada año. Cancelas cuando quieras.":
    "It renews every year. Cancel whenever you want.",
  "una sola vez": "just once",
  "Para quienes llegaron al principio y confiaron en Norata.":
    "For the people who arrived at the beginning and trusted Norata.",
  "Pro cancelándose": "Pro, cancelling",
  "Pro sin pagar": "Pro, unpaid",
  "Las {0} ramas del plan Gratuito, llenas. Con {1} abres las que quieras, y cada una lleva su propio camino.":
    "The Free plan's {0} branches are full. With {1} you open as many as you want, and each one carries its own path.",
  "Los {0} proyectos del plan Gratuito, ocupados. Con {1} llevas a la vez los que quieras.":
    "The Free plan's {0} projects are taken. With {1} you run as many at once as you want.",
  "Los {0} encargos del plan Gratuito, puestos. Con {1} este proyecto sigue creciendo sin contar.":
    "The Free plan's {0} assignments are in place. With {1} this project keeps growing without counting.",
  "Las {0} habilidades del plan Gratuito, en marcha. Con {1} añades las que quieras, y todas siguen subiendo igual.":
    "The Free plan's {0} skills are under way. With {1} you add as many as you want, and they all keep rising the same.",
  "Los {0} talentos del plan Gratuito, completos. Con {1} esta rama sigue creciendo sin contar.":
    "The Free plan's {0} talents are complete. With {1} this branch keeps growing without counting.",
  "Tu día lo ves siempre en el panel de cada módulo. Los informes empiezan en la semana y vienen con {0}.":
    "You always see your day in each module's panel. Reports start at the week and come with {0}.",
  "Subir de nivel abre ambientes: la misma Norata con otra luz. Con {0} se abren todos, y además los mundos, que cambian el material entero — la letra, las texturas y hasta cómo se llama tu camino.":
    "Levelling up unlocks ambiences: the same Norata in another light. With {0} they all open, plus the worlds, which change the whole material — the type, the textures and even what your path is called.",
  "Esto viene con {0}": "This comes with {0}",
  "Tu plan {0} terminó": "Your {0} plan has ended",
  "Gratuito · una rama y {0} talentos": "Free · one branch and {0} talents",
  "{0} · Termina el {1}": "{0} · Ends on {1}",
  "Ya tienes {0}": "You already have {0}",
  "Tu plan {0} terminó. No se borró nada: lo que pasa del plan Gratuito sigue a la vista, en solo lectura, y vuelve a moverse en cuanto renueves.":
    "Your {0} plan has ended. Nothing was deleted: whatever goes past the Free plan is still visible, read-only, and moves again as soon as you renew.",
  "Cancelaste, y sigue funcionando hasta el {0}":
    "You cancelled, and it keeps working until {0}",
  "Se renueva por su cuenta el {0}, sin que tengas que hacer nada.":
    "It renews on its own on {0}, with nothing for you to do.",
  "Cuesta menos que {0} años del plan anual.":
    "It costs less than {0} years of the annual plan.",
  "Te quedan {0}": "{0} left",
  "Viendo la app como {0}": "Viewing the app as {0}",
  "Hasta el {0}": "Until {0}",
  "Lo que abre {0}": "What {0} opens",

  /* ---- El ejemplo completo ----
     El perfil de mentira que ensena «Ver un ejemplo completo»: un corredor con
     su rama de talentos, sus tres proyectos y sus misiones. Es contenido, no
     interfaz, y se reescribe en ingles en vez de traducirse palabra por palabra.
  */

  "Tenis para correr": "Running shoes",
  "Comprarlos es el primer paso: son tuyos desde que los pagas, sin plazo que cumplir.":
    "Buying them is the first step: they're yours from the moment you pay, with no deadline to meet.",
  "Comprada y asegurada ($1,800)": "Bought and secured ($1,800)",
  "Talento creado en la rama Salud": "Talent created in the Health branch",
  "Salir a correr una vez": "Go for one run",
  "Un hito: una acción puntual que se cierra en sí misma. Se marca con un toque.":
    "A milestone: a one-off action that closes in itself. You check it with one tap.",
  "Correr 3 veces por semana": "Run 3 times a week",
  "Una meta: tienes 3 meses y avanza marcando sus etapas.":
    "A goal: you have 3 months and it moves as you check off its stages.",
  "Las doce semanas": "The twelve weeks",
  "Inversión de $0 — plan de 3 meses iniciado": "Investment of $0 — 3-month plan started",
  "Reloj con pulsómetro": "Watch with a heart rate monitor",
  "Para saber si corres al ritmo que crees que corres.":
    "To know whether you run at the pace you think you run.",
  "Corregir mi técnica": "Fix my form",
  "Tres sesiones grabándome y ajustando la zancada.":
    "Three sessions filming myself and adjusting my stride.",
  "Comparar con una referencia": "Compare against a reference",
  "Tres salidas aplicando el cambio": "Three runs applying the change",
  "Correr mi primera carrera de 5 km": "Run my first 5 km race",
  "La meta grande: hace falta el hábito Y la técnica. Es un talento que corona dos caminos.":
    "The big goal: it takes the habit AND the form. It's a talent that crowns two paths.",
  "Entrar a un club de corredores": "Join a running club",
  "Basta con tener el hábito O haber corrido una carrera: cualquiera de los dos te abre la puerta.":
    "Having the habit OR having run a race is enough: either one opens the door.",
  "Revisión médica": "Medical check-up",
  "Antes de empezar a correr en serio, saber cómo estoy.":
    "Before starting to run seriously, know where I stand.",
  "Bicicleta de segunda mano": "Second-hand bike",
  "El intento anterior. Sirvió para descubrir que lo mío es correr.":
    "The previous attempt. It served to find out that running is my thing.",
  "Comprada y asegurada ($3,200)": "Bought and secured ($3,200)",
  "Natación dos veces por semana": "Swimming twice a week",
  "Se quedó a medias, y por eso viaja en la caja: guardar el trimestre no juzga lo que no terminaste.":
    "It was left halfway, and that's why it travels in the box: putting the quarter away doesn't judge what you didn't finish.",
  "Plan de 3 meses iniciado": "3-month plan started",
  "Curso de cocina básica": "Basic cooking course",
  "Aprender diez recetas que puedas hacer sin receta.":
    "Learn ten recipes you can make without the recipe.",
  "Cocinar para amigos": "Cook for friends",
  "Invitar a alguien y cocinarle. Sin plazo: se logra o no se logra.":
    "Invite someone and cook for them. No deadline: you do it or you don't.",
  "Fondo de emergencia": "Emergency fund",
  "Juntar tres meses de gastos. Un año de plazo para lograrlo.":
    "Put together three months of expenses. A year to get there.",
  "Curso de inversión": "Investing course",
  "Entender en qué invertir antes de invertir.":
    "Understand what to invest in before investing.",
  "Cuenta cualquier caminata seguida de 20 min o más.":
    "Any unbroken walk of 20 minutes or more counts.",
  "Ocho vasos a lo largo del día.": "Eight glasses through the day.",
  "Lecciones, video o conversación.": "Lessons, video or conversation.",
  "Una receta que nunca hayas hecho.": "A recipe you've never made.",
  "Cancelar lo que ya no uso.": "Cancel what I no longer use.",
  "Renovar la cocina": "Redo the kitchen",
  "Dejar la cocina funcional y ordenada, sin obra mayor.":
    "Leave the kitchen working and tidy, with no major building work.",
  "Medir y hacer lista de lo que falta": "Measure and list what's missing",
  "Cambiar la iluminación": "Change the lighting",
  "Encargo creado en el proyecto Casa": "Assignment created in the Home project",
  "Curso de inglés en línea": "Online Spanish course",
  "Terminar los módulos y presentar la evaluación final.":
    "Finish the modules and take the final assessment.",
  "Módulos 1 a 4": "Modules 1 to 4",
  "Módulos 5 a 8": "Modules 5 to 8",
  "Práctica de conversación": "Conversation practice",
  "Evaluación final": "Final assessment",
  "Etapa completada: Práctica de conversación": "Stage completed: Conversation practice",
  "Encargo creado en el proyecto Aprender": "Assignment created in the Learning project",
  "Tienda en línea de artesanías": "Online craft shop",
  "Vender lo que hago sin depender de redes sociales.":
    "Sell what I make without depending on social media.",
  "Definir catálogo": "Define the catalog",
  "Fotos de producto": "Product photos",
  "Montar la tienda": "Set up the shop",
  "Etapa completada: Definir catálogo": "Stage completed: Define the catalog",
  "Encargo creado en el proyecto Negocio": "Assignment created in the Business project",
  "Se van tus habilidades, misiones, talentos, proyectos y todo el progreso que llevas. Esta acción no se puede deshacer.":
    "Your skills, missions, talents, projects and all the progress you've made are gone. This action can't be undone.",
  "Vas a vaciar la app.": "You're about to empty the app.",
  "Sí, borrar": "Yes, delete",
  "Esta es tu cuenta real. Escribe {0} para confirmar que quieres borrar todo su progreso.":
    "This is your real account. Type {0} to confirm you want to delete all its progress.",

  /* ---- Los informes ----
     Los titulos, las preguntas que encabeza cada bloque y los casos vacios. Casi
     todo son PREGUNTAS -«¿Que dia se te cae la semana?»- porque un informe que
     solo ensena cifras no dice nada.
  */

  "Todavía no hay nada que dibujar aquí.": "There's nothing to draw here yet.",
  "Todavía no hay nada que repartir.": "There's nothing to break down yet.",
  "Todavía no hay días que pintar.": "There are no days to paint yet.",
  "En cuanto cumplas misiones, aquí se llena el calendario.":
    "As soon as you complete missions, the calendar fills up here.",
  "Todavía no hay suficiente historia para dibujar una curva.":
    "There isn't enough history to draw a curve yet.",
  "Todavía sin movimiento. Esto se llena solo en cuanto empieces a marcar.":
    "No movement yet. This fills itself as soon as you start checking things off.",
  "Es tu primer periodo con datos: a partir de aquí ya hay con qué comparar.":
    "It's your first period with data: from here on there's something to compare against.",
  "Igual que el periodo anterior. Sostener también es un resultado.":
    "The same as the previous period. Holding steady is a result too.",
  "Fue mejor que el periodo anterior.": "It was better than the previous period.",
  "Fue más flojo que el periodo anterior, y eso no borra lo de antes.":
    "It was weaker than the previous period, and that doesn't erase what came before.",
  "Práctica suelta": "Loose practice",
  "¿Dónde pusiste la energía?": "Where did you put your energy?",
  "Es la única pregunta que ningún módulo puede contestar solo.":
    "It's the only question no single module can answer on its own.",
  "Tu constancia": "Your consistency",
  "De todo lo que tocaba hacer, ¿cuánto hiciste?":
    "Of everything that was due, how much did you do?",
  "Todavía no ha cerrado ningún día con misiones": "No day with missions has closed yet",
  "Frente al periodo anterior": "Against the previous period",
  "Tus días": "Your days",
  "¿Qué día se te cae la semana?": "Which day does your week fall apart?",
  "Hace falta más de una semana para que esto signifique algo.":
    "It takes more than a week for this to mean anything.",
  "En cuanto cumplas misiones, aquí se verá en qué días.":
    "As soon as you complete missions, you'll see which days here.",
  "Qué sostiene tu periodo": "What holds your period up",
  "Las cinco que más veces cumpliste.": "The five you completed most often.",
  "Aquí saldrán tus misiones más cumplidas.": "Your most-completed missions will show up here.",
  "¿A qué hora cumples?": "What time do you get things done?",
  "Sirve para saber a qué hora ponerte lo que más te cuesta.":
    "It helps you know what time to schedule the thing you find hardest.",
  "La hora se empezó a guardar hace poco, y no se puede reconstruir hacia atrás. Esto se llena solo con las misiones que cumplas de ahora en adelante.":
    "The time only started being saved recently, and it can't be rebuilt backwards. This fills only with the missions you complete from now on.",
  "¿De dónde sale tu XP?": "Where does your XP come from?",
  "Si casi todo viene de un solo sitio, ya sabes qué parte de la app estás usando de verdad.":
    "If almost all of it comes from one place, you know which part of the app you're really using.",
  "¿Ganas o pierdes?": "Are you gaining or losing?",
  "Lo perdido es desgaste por dejar una habilidad sin practicar.":
    "What's lost is decay from leaving a skill unpracticed.",
  "La curva de cada una": "Each one's curve",
  "Las cinco que más se movieron, sumando desde el principio del periodo.":
    "The five that moved most, adding up from the start of the period.",
  "Con un poco más de historia aquí se verá la forma de cada habilidad.":
    "With a little more history you'll see the shape of each skill here.",
  "Dónde creciste": "Where you grew",
  "Las cinco habilidades que más se movieron.": "The five skills that moved most.",
  "Aquí saldrán las habilidades que más suban.": "The skills that rise most will show up here.",
  "Lo que llevas puesto": "What you've put in",
  "En qué se te va el dinero": "Where your money goes",
  "Lo invertido en este periodo, por rama.": "What was invested this period, by branch.",
  "En cuanto abras un talento con importe, aquí se ve en qué rama cayó.":
    "As soon as you open a talent with an amount, you'll see which branch it landed in here.",
  "Cómo va lo que abriste": "How what you opened is going",
  "En qué trimestre gastaste": "Which quarter you spent in",
  "Aquí se reparte por trimestre lo que inviertas este año.":
    "What you invest this year is broken down by quarter here.",
  "¿Cierras lo que abres?": "Do you close what you open?",
  "Cuando completes un talento con fecha, aquí verás cuánto tardaste.":
    "When you complete a talent with a deadline, you'll see how long you took here.",
  "Lo que se te vence": "What's running out",
  "Cuanto más llena la barra, menos tiempo queda.":
    "The fuller the bar, the less time is left.",
  "No tienes ningún plan con fecha corriendo.": "You have no dated plan running.",
  "Cómo está lo que llevas": "How what you're carrying is doing",
  "De un vistazo: qué sigue vivo y qué se está apagando.":
    "At a glance: what's still alive and what's going out.",
  "Cuando tengas encargos en marcha, aquí se ve su estado.":
    "When you have assignments under way, you'll see their status here.",
  "Tu ritmo": "Your pace",
  "Etapas cerradas a lo largo del periodo.": "Stages closed over the period.",
  "Aquí se verá el ritmo en cuanto cierres etapas.":
    "You'll see the pace here as soon as you close stages.",
  "Cuánto tarda un encargo": "How long an assignment takes",
  "De crearlo a cerrarlo.": "From creating it to closing it.",
  "Cuando termines un encargo, aquí verás cuánto te llevó.":
    "When you finish an assignment, you'll see how long it took here.",
  "Lo que cerraste y lo que soltaste": "What you closed and what you let go",
  "En qué día de la semana se te cae el ritmo": "Which day of the week your pace drops",
  "De dónde sale tu XP: misiones, talentos, proyectos o práctica":
    "Where your XP comes from: missions, talents, projects or practice",
  "En qué se te va el dinero y qué se te vence": "Where your money goes and what's running out",
  "Qué encargos llevan semanas quietos": "Which assignments have been still for weeks",
  "El mes y el año enteros, con el mapa de tus días":
    "The whole month and year, with the map of your days",

  /* ---- El mapa, el detalle y la puerta ----
     Las herramientas del lienzo -el menu del clic derecho, las pistas de abajo y
     los avisos de deshacer-, las columnas de Misiones y el formulario de entrada.
  */

  "reacomodar la rama": "rearrange the branch",
  "Tus proyectos": "Your projects",
  "Tus ramas": "Your branches",
  "Editar el mapa": "Edit the map",
  "Editar el mapa: conectar y cortar": "Edit the map: connect and cut",
  "Elegir varios para moverlos juntos o agruparlos": "Pick several to move together or group",
  "encargos en este proyecto": "assignments in this project",
  "talentos en esta rama": "talents in this branch",
  "arrastra el fondo para recorrer": "drag the background to pan",
  "Tira del punto ▸ hacia otro encargo para ponerlo después · toca una línea para cortarla · el círculo <b>Y/O</b> cambia si hacen falta todos sus requisitos o basta uno":
    "Pull the ▸ dot onto another assignment to put it after · tap a line to cut it · the <b>Y/O</b> circle switches between needing all its requirements or just one",
  "Tira del punto ▸ hacia otro nodo para conectarlos · toca una línea para cortarla · <b>Shift</b> y clic elige varios · el círculo <b>Y/O</b> cambia la regla de entrada":
    "Pull the ▸ dot onto another node to connect them · tap a line to cut it · <b>Shift</b> and click picks several · the <b>Y/O</b> circle changes the entry rule",
  "duplicar un talento": "duplicate a talent",
  "crear un encargo": "create an assignment",
  "dejar de esperar": "stop waiting",
  "esperar el turno": "wait its turn",
  "Espera a que terminen sus requisitos": "Waits for its requirements to finish",
  "Ya no espera: se puede avanzar antes de tiempo":
    "It no longer waits: it can move ahead early",
  "Abrir el encargo": "Open the assignment",
  "Sus etapas, su ritmo y su historial": "Its stages, its pace and its history",
  "Dejar de esperar": "Stop waiting",
  "Podrás avanzarlo aunque lo anterior no esté":
    "You'll be able to move it forward even if the earlier ones aren't done",
  "No se abrirá hasta que terminen sus requisitos":
    "It won't open until its requirements are finished",
  "Nuevo encargo aquí": "New assignment here",
  "Se crea donde hiciste clic": "It's created where you clicked",
  "Salir de edición": "Leave editing",
  "Vuelve al modo normal": "Back to normal mode",
  "Conecta y corta hilos": "Connect and cut threads",
  "Recorre el proyecto con sitio de sobra": "Move around the project with room to spare",
  "Renombrar la caja": "Rename the box",
  "Ponle el nombre de lo que fue esa época": "Name it after what that stretch was",
  "Todo vuelve donde estaba": "Everything goes back where it was",
  "Borrar la caja": "Delete the box",
  "Copia su forma, sin el progreso": "Copies its shape, without the progress",
  "Ver y editar sus datos": "See and edit its details",
  "Se sostiene en el tiempo y avanza por etapas":
    "It holds up over time and moves stage by stage",
  "Una llave que se paga y abre el paso": "A key you pay for that opens the way",
  "Una acción puntual que se cierra en sí misma": "A one-off action that closes in itself",
  "Edición: arrastra, conecta y corta": "Editing: drag, connect and cut",
  "Edición: Q, W y E crean · C para salir": "Editing: Q, W and E create · C to leave",
  "Modo edición: arrastra y conecta": "Edit mode: drag and connect",
  "toca para ver qué lleva": "tap to see what's inside",
  "cortar una conexión": "cut a connection",
  "mover una caja": "move a box",
  "mover un encargo": "move an assignment",
  "mover un talento": "move a talent",
  "cambiar la regla de entrada": "change the entry rule",
  "Listo, ya no estás eligiendo": "Done, you're no longer selecting",
  "Quitar la selección": "Clear the selection",
  "bájame la racha": "drop my streak",
  "quita una vez de hoy": "remove one of today's",
  "Arrastra aquí la misión que quieras.": "Drag any mission here.",
  "Aquí van apareciendo las que cumples hoy.": "The ones you complete today show up here.",
  "Arrastra aquí la misión que quieras dar por terminada.":
    "Drag here any mission you want to finish for good.",
  "Borrar este tablero": "Delete this board",
  "Sus misiones vuelven a su sitio": "Its missions go back where they belong",
  "Está vacío": "It's empty",
  "Día completo": "Full day",
  "Todas las misiones cumplidas": "Every mission completed",
  "Sin misiones hoy": "No missions today",
  "Crea una o descansa": "Create one or take a break",
  "Nada en marcha": "Nothing under way",
  "Crea un encargo cuando quieras": "Create an assignment whenever you want",
  "Verlo como lista": "See it as a list",
  "Verlo como mapa": "See it as a map",
  "Vuelve a las tarjetas de siempre": "Back to the usual cards",
  "Dibuja los encargos y en qué orden van": "Draws the assignments and what order they go in",
  "Arrastra una cabecera para reordenar las ramas": "Drag a header to reorder the branches",
  "Mantén pulsada una cabecera para reordenar las ramas":
    "Press and hold a header to reorder the branches",
  "misión diaria": "daily mission",
  "Sigo un rato": "I'll keep going",
  "Lo dejo por hoy": "I'm done for today",
  "Nivel retirado por registro abusivo": "Level removed for abusive logging",
  "la habilidad que tenía": "the skill it had",
  "Sin planes en curso": "No plans running",
  "Abre un talento cuando quieras": "Open a talent whenever you want",
  "Ver en pantalla completa": "See it full screen",
  "Recorre la rama con sitio de sobra": "Move around the branch with room to spare",
  "Ocultar la contraseña": "Hide the password",
  "Un momento…": "One moment…",
  "dentro de unos días": "in a few days",
  "Volver sin iniciar sesión": "Go back without signing in",
  "Probar sin cuenta": "Try it without an account",
  "Seguirás guardando solo en este dispositivo.": "You'll keep saving only on this device.",
  "Sin cuenta, tu progreso se guarda solo en este dispositivo. Puedes crear una cuenta cuando quieras y llevártelo.":
    "Without an account, your progress is saved only on this device. You can create an account whenever you want and take it with you.",
  "Si lo dejas en blanco usaremos tu nombre.": "If you leave it blank we'll use your name.",
  "Escribe tu correo y tu contraseña.": "Type your email and your password.",
  "Dime cómo te llamas: es lo que usaré para hablarte.":
    "Tell me your name: it's what I'll use to talk to you.",
  "Escribe el correo con el que quieres entrar.": "Type the email you want to sign in with.",
  "Ese correo no parece completo. Revísalo.": "That email doesn't look complete. Check it.",
  "Las dos contraseñas no coinciden. Míralas con el ojito para compararlas.":
    "The two passwords don't match. Use the little eye to compare them.",
  "Ir a iniciar sesión": "Go to sign in",
  "Escribe arriba tu correo y vuelve a pulsar: ahí te mando el enlace.":
    "Type your email above and tap again: that's where I'll send the link.",
  "Para poner una contraseña nueva, comprueba que el correo de abajo es el tuyo y pulsa «¿Olvidaste tu contraseña?».":
    "To set a new password, check that the email below is yours and tap «Forgot your password?».",
  "Escribe arriba tu correo.": "Type your email above.",
  "Las dos no coinciden. Míralas con el ojito para comprobarlo.":
    "The two don't match. Use the little eye to check.",
  "Contraseña cambiada. Cerré la sesión en los demás dispositivos":
    "Password changed. I signed you out on your other devices",
  "Ese enlace ya caducó o se usó. Pide uno nuevo con «¿Olvidaste tu contraseña?».":
    "That link has expired or been used. Ask for a new one with «Forgot your password?».",
  "no pude leer la cuenta": "I couldn't read the account",
  "El enlace era válido pero no pude terminar de entrar. Inténtalo otra vez.":
    "The link was valid but I couldn't finish signing you in. Try again.",
  "Cuenta de pruebas": "Test account",
  "Estás viendo un ejemplo": "You're looking at an example",

  /* ---- Mi expedicion, el tablero, el panel, la racha y los datos de ejemplo ----
     Los cinco rangos y sus pistas, los acomodos sugeridos del Resumen, las
     preguntas que la app le hace a una habilidad abandonada, y los nombres del
     perfil de ejemplo del panel de numeros.
  */

  "Tu cielo está por escribirse": "Your sky is waiting to be written",
  "Cielo completo · las cinco constelaciones": "Full sky · all five constellations",
  "Aquí estás": "You are here",
  "Todavía nada": "Nothing yet",
  "El principio. Se cruza en semanas y casi todo lo que haces suma.":
    "The beginning. You cross it in weeks and almost everything you do counts.",
  "Ya hay un rastro que seguir: se nota a qué le dedicas los días.":
    "There's a trail to follow now: you can tell what you give your days to.",
  "Aquí se ve lo que sostienes, no lo que empezaste.":
    "Here you see what you hold up, not what you started.",
  "El mapa ya es tuyo: habilidades, talentos y proyectos con historia detrás.":
    "The map is yours now: skills, talents and projects with history behind them.",
  "El último de los cinco. El nivel sigue subiendo después: la cuenta no se acaba.":
    "The last of the five. Your level keeps rising after it: the count doesn't end.",
  "Destello propio al cumplir una misión": "Its own flash when you complete a mission",
  "Celebración de pantalla completa": "Full-screen celebration",
  "Celebración grande": "Big celebration",
  "Rango Cartógrafo": "Cartographer rank",
  "Días con actividad": "Days with activity",
  "Niveles de habilidad": "Skill levels",
  "Hitos de racha": "Streak milestones",
  "Nivel de pruebas": "Test level",
  "Los dos primeros días de cada semana valen mucho más que los siguientes. Premia volver, no marcar.":
    "The first two days of each week are worth far more than the rest. It rewards coming back, not checking things off.",
  "Hasta cinco misiones distintas por día. Doce no valen seis veces más que dos.":
    "Up to five different missions a day. Twelve aren't worth six times as much as two.",
  "Cuenta el nivel más alto que alcanzó cada habilidad, aunque hoy haya bajado.":
    "It counts the highest level each skill reached, even if it's dropped since.",
  "Cada talento que cierras.": "Every talent you close.",
  "Cada proyecto que das por terminado.": "Every project you mark as finished.",
  "Cada etapa marcada, en talentos y en proyectos.":
    "Every stage checked off, in talents and in projects.",
  "Los hitos que cierras en el árbol de talentos.":
    "The milestones you close in the talent tree.",
  "Los días redondos de racha que ya cruzaste. No se pierden al romperse.":
    "The round streak days you've already crossed. They aren't lost when it breaks.",
  "Por estrenar cada módulo: tu primera habilidad, tu primera misión, tu primer talento, tu primer proyecto.":
    "For opening each module: your first skill, your first mission, your first talent, your first project.",
  "Un nivel fingido desde la trastienda. No es tu recorrido real.":
    "A level faked from the back office. It isn't your real journey.",
  "Hoy no te toca ninguna": "None are due today",
  "Todavía no tienes ninguna": "You don't have any yet",
  "Crear una": "Create one",
  "Un día sin misiones programadas también cuenta. Si quieres adelantar algo, tráelo a hoy desde Misiones.":
    "A day with no missions scheduled counts too. If you want to get ahead, bring something to today from Missions.",
  "Una misión es algo que haces hoy y que suma a una habilidad. La primera es la que echa a andar la racha.":
    "A mission is something you do today that adds to a skill. The first one is what gets the streak going.",
  "Arrastra las tarjetas para reacomodarlas": "Drag the cards to rearrange them",
  "Elige un acomodo para tu Resumen": "Pick a layout for your Summary",
  "Todo al máximo": "Everything maxed out",
  "No queda nivel por subir": "There's no level left to gain",
  "Sin categoría": "No category",
  "una de ellas tiene": "one of them has",
  "Nueva rama de talentos": "New talent branch",
  "Nueva rama de proyectos": "New project branch",
  "Un ámbito donde agrupar talentos: un oficio, un instrumento, un plan.":
    "A place to group talents: a craft, an instrument, a plan.",
  "Algo que estás construyendo: una mudanza, un lanzamiento, un trámite largo. Dentro van los encargos que lo hacen avanzar.":
    "Something you're building: a move, a launch, a long piece of paperwork. Inside go the assignments that move it forward.",
  "Esto no se puede deshacer.": "This can't be undone.",
  "Borrar la rama": "Delete the branch",
  "Borrar el proyecto": "Delete the project",
  "Se reescribe en todos sus talentos y en sus cajas.":
    "It's rewritten across all its talents and boxes.",
  "Se reescribe en todos sus encargos.": "It's rewritten across all its assignments.",
  "Tres columnas parejas, las misiones al centro": "Three even columns, missions in the middle",
  "La escena a lo ancho, arriba a la derecha": "The scene across the top, on the right",
  "La escena grande, presidiendo el tablero": "The big scene, presiding over the board",
  "Las dos columnas parejas, y el día arriba": "Two even columns, with the day on top",
  "El mes a lo ancho arriba; lo demás, debajo":
    "The month across the top; everything else below",
  "Proyectos y talentos al frente; el día, después":
    "Projects and talents up front; the day after",
  "El día arriba, y el mes a lo ancho debajo": "The day on top, and the month across below",
  "El mes preside, y debajo lo que lo llena": "The month presides, and below it what fills it",
  "El día": "The day",
  "Lo de hoy primero: misiones, racha y lo que urge":
    "Today first: missions, streak and what's urgent",
  "La racha arriba, y debajo lo que la alimenta": "The streak on top, and below what feeds it",
  "Lo que construyo": "What I'm building",
  "todavía sin datos": "no data yet",
  "Sin ubicar": "Unplaced",
  "Verás un marco punteado amarillo mientras la uses, y borrar todo no pedirá confirmación extra.":
    "You'll see a yellow dotted frame while you use it, and deleting everything won't ask for extra confirmation.",
  "Borrar todo te pedirá escribir tu correo. Es a propósito: obliga a mirar en qué cuenta estás.":
    "Deleting everything will ask you to type your email. That's on purpose: it forces you to look at which account you're in.",
  "Los topes, las pantallas y los avisos de cada plan, sin tener que comprarlos. Vive en la pestaña: aguanta una recarga y muere al cerrarla.":
    "Each plan's caps, screens and notices, without buying them. It lives in the tab: it survives a reload and dies when you close it.",
  "Guitarra sube de nivel": "Guitar levels up",
  "Un ambiente nuevo": "A new ambience",
  "Activos esta semana": "Active this week",
  "abrieron en 7 días": "opened it in 7 days",
  "Siguen tras 30 días": "Still here after 30 days",
  "Volvieron otro día": "Came back another day",
  "Días de uso por persona": "Days of use per person",
  "cuántos días distintos abre cada quien": "how many different days each person opens it",
  "Aperturas esta semana": "Opens this week",
  "veces que se abrió, en total": "times it was opened, in total",
  "Nadie ha abierto la app todavía.": "Nobody has opened the app yet.",
  "Todavía no hay ninguna cuenta.": "There are no accounts yet.",
  "sin contar fundador": "not counting founder",
  "de 200": "of 200",
  "Todavía no hay ninguna suscripción.": "There are no subscriptions yet.",
  "Nadie ha abierto la app en los últimos treinta días.":
    "Nobody has opened the app in the last thirty days.",
  "La que pasa: se va sola a los ocho segundos y se corta tocando fuera.":
    "The passing one: it leaves by itself after eight seconds and is cut short by tapping outside.",
  "Nivel con rango": "Level with a rank",
  "Cuando el nivel además te cambia el nombre del camino.":
    "When the level also changes what your path is called.",
  "Nivel con premio": "Level with a reward",
  "La ventana que NO se cierra tocando fuera ni sola. Lleva a lo que abriste.":
    "The window that doesn't close by tapping outside or on its own. It takes you to what you unlocked.",
  "Hito de racha": "Streak milestone",
  "La de los días seguidos, en amarillo.": "The one for days in a row, in yellow.",
  "La chica": "The small one",
  "El destello de subir una habilidad o cumplir un talento.":
    "The flash of a skill levelling up or a talent being completed.",
  "Celebración nueva": "New celebration",
  "Ver Mi expedición": "See My journey",
  "Un año entero sin soltarlo. Esto ya no es fuerza de voluntad, es quién eres.":
    "A whole year without letting go. This isn't willpower any more, it's who you are.",
  "Doscientos días. Muy poca gente llega hasta aquí.":
    "Two hundred days. Very few people get this far.",
  "Cien días seguidos. El hábito ya se sostiene solo.":
    "A hundred days in a row. The habit holds itself up now.",
  "Cincuenta días. Medio centenar de veces que elegiste aparecer.":
    "Fifty days. Fifty times you chose to show up.",
  "Un mes completo sin fallar un solo día.": "A whole month without missing a single day.",
  "Dos semanas seguidas. Ya no es suerte.": "Two weeks in a row. It isn't luck any more.",
  "¡Semana perfecta! Siete de siete.": "A perfect week. Seven out of seven.",
  "Tres días seguidos: así es como empieza todo hábito.":
    "Three days in a row: that's how every habit starts.",
  "Decaimiento por inactividad": "Decay from inactivity",
  "¿Y si hoy la estrenas? Con un rato corto ya cuenta.":
    "What if you started it today? A short while already counts.",
  "¿Sigue siendo algo que te gustaría aprender?": "Is it still something you'd like to learn?",
  "¿Por dónde sería lo más fácil de empezar?": "Where would be the easiest place to start?",
  "¿Le damos una oportunidad esta semana?": "Shall we give it a shot this week?",
  "¿Qué haría falta para dar el primer paso?": "What would it take to make the first move?",
  "¿La probamos una vez y vemos qué tal se siente?":
    "Shall we try it once and see how it feels?",
  "¿Qué te llamó la atención de esto cuando la anotaste?":
    "What caught your eye about this when you wrote it down?",
  "¿Existe una versión pequeña de esto que quepa hoy?":
    "Is there a small version of this that fits today?",
  "¿Sería más fácil con alguien más?": "Would it be easier with someone else?",
  "¿Hay algo que estés esperando para empezar?":
    "Is there something you're waiting for to start?",
  "¿Cuál sería el primer paso, aunque fuera diminuto?":
    "What would the first step be, however tiny?",
  "¿Te gustaría que esto formara parte de tu semana?":
    "Would you like this to be part of your week?",
  "¿Cuándo te quedaría mejor probarla?": "When would suit you best to try it?",
  "¿Qué se te ocurre hacer con esto en diez minutos?":
    "What could you do with this in ten minutes?",
  "¿Te sigue dando curiosidad?": "Are you still curious about it?",
  "¿Qué necesitarías tener a mano para arrancar?": "What would you need at hand to get going?",
  "¿Hay un día de la semana donde encajaría bien?":
    "Is there a day of the week where it would fit well?",
  "¿Prefieres empezarla en serio o solo asomarte?":
    "Would you rather start it properly or just peek in?",
  "¿La dejamos aquí un tiempo más o le buscamos hueco?":
    "Shall we leave it here a while longer or make room for it?",
  "¿Qué versión de esto te gustaría estar haciendo dentro de un año?":
    "What version of this would you like to be doing a year from now?",
  "Práctica libre": "Free practice",
  "Talento completado: Bici de ciudad": "Talent completed: City bike",
  "Talento · Bici de ciudad": "Talent · City bike",
  "Proyecto terminado: Regalo de mamá": "Project finished: Mum's present",
  "Proyecto · Regalo de mamá": "Project · Mum's present",
  "Talento completado: Curso de acuarela": "Talent completed: Watercolour course",
  "Talento · Curso de acuarela": "Talent · Watercolour course",
  "Proyecto terminado: Ordenar la cocina": "Project finished: Sort out the kitchen",
  "Proyecto · Ordenar la cocina": "Project · Sort out the kitchen",
  "Curso de acuarela": "Watercolour course",
  "Bici de ciudad": "City bike",
  "Sartén de hierro": "Cast iron pan",
  "Curso de finanzas": "Finance course",
  "Huerto del patio": "Backyard garden",
  "Trámite del coche": "Car paperwork",
  "Cambiar de banco": "Switch banks",
  "Ordenar la cocina": "Sort out the kitchen",
  "Regalo de mamá": "Mum's present",

  /* ---- Lo que quedaba: los mundos, las lecturas y los mensajes del servidor ----
     Los ocho ambientes y los mundos con sus premisas, las lecturas que arma la
     app sobre tus datos, y los errores que devuelve Supabase \u2014que son los que
     alguien lee justo cuando algo no le funciona.
     Las dos lineas de LEXICO son terminos de BUSQUEDA, no rotulos: sirven para
     reconocer una habilidad por lo que alguien escribe. Se traducen a los terminos
     ingleses, no palabra por palabra.
  */

  "Sí, lo logré": "Yes, I made it",
  "Lo perdí": "I lost it",
  "Plan vencido sin lograr la meta": "Plan ran out without reaching the goal",
  "Ver qué lleva": "See what's inside",
  "¿Cómo quieres llamar a esta caja?": "What do you want to call this box?",
  "sacar un talento de la caja": "take a talent out of the box",
  "El nombre del grupo. Puedes cambiarlo después.":
    "The group's name. You can change it later.",
  "Está desplegada: sus talentos viven en el mapa, dentro del recinto del grupo.":
    "It's spread out: its talents live on the map, inside the group's enclosure.",
  "En progreso": "In progress",
  "Un sitio donde apartar misiones: un proyecto, un ámbito, lo que quieras.":
    "A place to set missions aside: a project, an area, whatever you want.",
  "La misión que tiene dentro no se pierde: vuelve a su sitio de siempre, según toque hoy o no.":
    "The mission inside isn't lost: it goes back where it belongs, whether it's due today or not.",
  "Borrar el tablero": "Delete the board",
  "Arrastra para reordenar": "Drag to reorder",
  "Mantén pulsada una para reordenar": "Press and hold one to reorder",
  "No se abre hasta que termine.": "It doesn't open until that one finishes.",
  "No se abre hasta que terminen.": "It doesn't open until those finish.",
  "Le diste avance hoy.": "You moved it forward today.",
  "Retomado al avanzar una etapa": "Picked back up by moving a stage forward",
  "¿Retomar este encargo?": "Pick this assignment back up?",
  "¿Poner el encargo en pausa? No contará como abandonado mientras esté pausado.":
    "Pause the assignment? It won't count as abandoned while it's paused.",
  "¿Dar por terminado este encargo? Se guardará en tu historial y ganarás el XP.":
    "Mark this assignment as finished? It'll be kept in your history and you'll earn the XP.",
  "¿Descartar este encargo? Deja de pedirte atención, pero queda guardado por si lo retomas.":
    "Discard this assignment? It stops asking for your attention, but it's kept in case you pick it back up.",
  "Encargo en pausa": "Assignment paused",
  "También se pierden las conexiones que llegaban a esos talentos desde otras ramas.\n\n":
    "The connections reaching those talents from other branches are lost too.\n\n",
  "Basta con uno": "Any one will do",
  "Se desbloquea al completar:": "It unlocks when you complete:",
  "Sin requisitos: estará disponible desde el principio.":
    "No requirements: it'll be available from the start.",
  "Quedará bloqueado (y conectado en el mapa) hasta completar ese talento.":
    "It'll stay locked (and connected on the map) until you complete that talent.",
  "Obligatorio: una compra es una llave que se paga.":
    "Required: a purchase is a key you pay for.",
  "Si la meta te costó dinero, anótalo aquí.":
    "If the goal cost you money, write it down here.",
  "Editar misión": "Edit mission",
  "la versión del otro dispositivo": "the other device's version",
  "la versión de este dispositivo": "this device's version",
  "lo que había antes de cambiar de moneda": "what was there before the currency changed",
  "El otro dispositivo usa una versión más nueva de Norata. Actualiza esta (recarga la página) antes de sincronizar.":
    "The other device is using a newer version of Norata. Update this one (reload the page) before syncing.",
  "[motivo de baja, aun sin enviar]": "[reason for leaving, not sent yet]",
  "1 año": "1 year",
  "Correo o contraseña incorrectos. Si entraste con Google la primera vez, usa ese botón; y si todavía no tienes cuenta, créala abajo.":
    "Wrong email or password. If you signed in with Google the first time, use that button; and if you don't have an account yet, create one below.",
  "Falta confirmar tu correo. Abre el mensaje que te mandamos y pulsa el enlace; luego vuelve aquí.":
    "Your email still needs confirming. Open the message we sent and tap the link; then come back here.",
  "Ya hay una cuenta con ese correo. Entra con tu contraseña, o usa «¿Olvidaste tu contraseña?» si no la recuerdas.":
    "There's already an account with that email. Sign in with your password, or use «Forgot your password?» if you don't remember it.",
  "Demasiados intentos seguidos. Espera unos minutos y vuelve a probar.":
    "Too many tries in a row. Wait a few minutes and try again.",
  "Esa es la contraseña que ya tenías. Elige otra distinta.":
    "That's the password you already had. Pick a different one.",
  "No hay sesión iniciada. Vuelve a conectar.": "You're not signed in. Connect again.",
  "Tu sesión caducó. Entra otra vez con tu correo y contraseña.":
    "Your session expired. Sign in again with your email and password.",
  "Falta activar el borrado de cuentas en el servidor. Es un paso de una sola vez; hasta entonces no puedo tocar la cuenta desde aquí.":
    "Account deletion still needs switching on in the server. It's a one-time step; until then I can't touch the account from here.",
  "Esta cuenta no tiene permiso para ver el panel.":
    "This account isn't allowed to see the panel.",
  "No hay sesión iniciada. Entra con tu correo y contraseña.":
    "You're not signed in. Sign in with your email and password.",
  "Tu sesión ya no vale. Entra otra vez con tu correo y contraseña.":
    "Your session is no longer valid. Sign in again with your email and password.",
  "Solo tú puedes verlo, y tu contraseña no se queda guardada aquí.":
    "Only you can see it, and your password isn't kept here.",
  "Hola de nuevo": "Good to see you again",
  " No se abre con el plan mensual ni con el anual.":
    " It doesn't open with the monthly or the annual plan.",
  "Tu rango": "Your rank",
  "Suelta para actualizar": "Let go to refresh",
  "Desliza para actualizar": "Pull to refresh",
  "Hay una versión nueva de Norata": "There's a new version of Norata",
  "Niveles {0} a {1}.": "Levels {0} to {1}.",
  "Práctica de {0}": "{0} practice",
  "+{0} XP al lograrlo": "+{0} XP when you get it",
  "Hacen falta los {0}": "All {0} are needed",
  "Quedará bloqueado hasta completar los {0}. Es el talento que corona varios caminos.":
    "It'll stay locked until you complete all {0}. It's the talent that crowns several paths.",
  "Se desbloquea en cuanto completes cualquiera de los {0}. Son caminos alternativos.":
    "It unlocks as soon as you complete any of the {0}. They're alternative paths.",
  "Te llamaremos {0}": "We'll call you {0}",
  "Te llamaremos {0}.": "We'll call you {0}.",
  "Si lo dejas en blanco te llamaremos {0}.": "If you leave it blank we'll call you {0}.",
  "La contraseña necesita al menos {0} caracteres.":
    "The password needs at least {0} characters.",
  "La contraseña es muy corta. Usa al menos {0} caracteres.":
    "That password is too short. Use at least {0} characters.",
  "Esa contraseña no cumple el mínimo. Usa al menos {0} caracteres.":
    "That password doesn't meet the minimum. Use at least {0} characters.",
  "Necesita al menos {0} caracteres.": "It needs at least {0} characters.",
  "Supabase respondió: {0}": "Supabase replied: {0}",
  "el <b>{0}</b>": "on <b>{0}</b>",
  "Si hay una cuenta con {0}, te acaba de llegar un enlace para poner una contraseña nueva. Revisa también la carpeta de no deseado.":
    "If there's an account with {0}, a link to set a new password has just arrived. Check your spam folder too.",
  "Te reenvié el correo de confirmación a {0}. Míralo también en no deseado.":
    "I resent the confirmation email to {0}. Check your spam folder too.",
  "· viendo como {0}": "· viewing as {0}",
  ", hasta el {0}": ", until {0}",
  "· señal buena: {0}%": "· a good sign: {0}%",
  "· lo dijeron {0} veces": "· said {0} times",
  "Estás viendo la app como <b>{0}</b>. Se cae sola al cerrar la pestaña, y no toca lo que pagaste.":
    "You're viewing the app as <b>{0}</b>. It drops by itself when you close the tab, and it doesn't touch what you paid for.",
  "Misión cumplida: {0}": "Mission completed: {0}",
  "Misión · {0}": "Mission · {0}",
  "{0} de cada 10": "{0} out of 10",
  "Apariencia de prueba: {0}": "Test look: {0}",
  "Nivel {0}": "Level {0}",
  "{0} se abre en el nivel {1} de expedición y vas en el {2}.":
    "{0} opens at journey level {1} and you're on {2}.",
  "Al llegar arriba se enciende con {0}.": " Once you get there it switches on with {0}.",
  "{0} es lo único que {1} tiene además de Pro": "{0} is the only thing {1} has beyond Pro",
  ": un pago único de {0}, sin fecha y sin renovaciones.":
    ": a single payment of {0}, with no date and no renewals.",
  "El nivel ya lo tienes; lo que falta es el plan. Con {0} se abren todas las apariencias, las de hoy y las que vengan.":
    "You already have the level; what's missing is the plan. With {0} every look opens, today's and the ones to come.",
  "Tu rango en {0}": "Your rank in {0}",
  "Actualizar a la versión {0}": "Update to version {0}",
  "Ya está lista la versión {0}": "Version {0} is ready",
  "Una llave: la pagas y te abre el paso a lo que sigue. Equipo, licencias, cursos.":
    "A key: you pay for it and it opens the way to what's next. Gear, licences, courses.",
  "Una acción puntual que se cierra en sí misma: publicar un dibujo, dar una clase de prueba.":
    "A one-off action that closes in itself: posting a drawing, teaching a trial class.",
  "Algo que sostienes en el tiempo. Avanza por etapas y tiene fecha límite.":
    "Something you hold up over time. It moves stage by stage and has a deadline.",
  "!beber !hidratarme !dormir !cepillarme !lavarme !descansar !estirarme agua vasos dientes cepillo hilo dental piel crema protector solar higiene rutina sueño siesta uñas cabello ducha":
    "!drink !hydrate !sleep !brush !wash !rest !stretch water glasses teeth toothbrush floss skin cream sunscreen hygiene routine sleep nap nails hair shower",
  "!pescar pesca caña anzuelo carnada rio muelle": "!fish fishing rod hook bait river pier",
  "día seguido": "day in a row",
  "días seguidos": "days in a row",
  "por la mañana": "in the morning",
  "por la tarde": "in the afternoon",
  "por la noche": "at night",
  "práctica suelta": "loose practice",
  "un día completo": "a full day",
  "días completos": "full days",
  "talento se le pasó": "talent ran past its date",
  "talentos se les pasó": "talents ran past their dates",
  "talento con fecha": "dated talent",
  "talentos con fecha": "dated talents",
  "la práctica suelta": "loose practice",
  /* El «Todos» del selector de requisitos: hacen falta TODOS los talentos
     de los que cuelga. Va aparte del «Todas» del catálogo porque en español
     son dos palabras y en inglés la misma — y una clave por frase, siempre. */
  "Todos": "All",
  "Norata Clásico": "Norata Classic",
  "El carbón azulado y la menta de siempre. Es donde empiezas, y es lo que queda al quitarte un recolor.":
    "The blue-black charcoal and the usual mint. It's where you start, and what's left when you take a recolour off.",
  "Tinta china sobre papel. Sin más color que el amarillo y el coral, para que lo que avisa se vea desde la otra punta del cuarto.":
    "India ink on paper. No colour but the yellow and the coral, so that what warns you can be seen from across the room.",
  "Verde hondo de bosque cerrado de noche, y luz entre hojas de día.":
    "The deep green of thick forest at night, and light through leaves by day.",
  "Verdiazul de agua honda, con la menta de la casa vista desde el fondo.":
    "The blue-green of deep water, with the house mint seen from the bottom.",
  "Barro cocido: terracota apagada con cal encima, el color de una pared vieja.":
    "Fired clay: muted terracotta with lime over it, the colour of an old wall.",
  "La menta se vuelve celeste y la app pasa de festejar a acompañar.":
    "The mint turns sky blue and the app goes from celebrating to keeping you company.",
  "El desierto cuando se mete el sol: el cielo en violeta y la arena en lavanda.":
    "The desert as the sun goes down: the sky in violet and the sand in lavender.",
  "Piedra quemada con la brasa debajo, y los círculos del poema. Demonología de la que se lee, no de la que se disfraza.":
    "Burnt stone with the embers underneath, and the circles from the poem. The demonology you read, not the kind you dress up as.",
  "Me arrepiento en polvo y ceniza.": "I repent in dust and ashes.",
  "Lo ató, y puso su sello sobre él.": "He bound him, and set a seal upon him.",
  "No hay sobre la tierra quien se le parezca.": "Upon earth there is not his like.",
  "Legión me llamo, porque somos muchos.": "My name is Legion, for we are many.",
  "Su rey es el ángel del abismo, cuyo nombre es Abadón.":
    "Their king is the angel of the abyss, whose name is Abaddon.",
  "El papel de plano: retícula de dos pesos, cotas con puntas de flecha y marcas de sección. Todo lo tuyo, todavía en obra.":
    "Blueprint paper: a two-weight grid, dimensions with arrowheads and section marks. Everything of yours, still under construction.",
  "Una pieza en su vitrina: forro de terciopelo, marco de latón y el vidrio por encima.":
    "A piece in its display case: velvet lining, a brass frame and glass over the top.",
  "Noche de expedición": "Expedition night",
  "El mundo de partida: el material original de Norata, sin forro ni marco. Elegirlo te quita el mundo y el recolor que lleves puestos.":
    "The starting world: Norata's original material, with no lining and no frame. Choosing it takes off whatever world and recolour you're wearing.",

  /* ---- Los nombres de los ambientes y los mundos ----
     SE TRADUCEN, y es una decision que se puede deshacer en una linea: son
     palabras evocadoras y no una marca. Ademas el texto del plan ya dice «Relic,
     the world only founders have», asi que dejar «Reliquia» en la reja los
     dejaria discrepando en la misma pantalla. «Adobe» y «Blueprint» se quedan
     igual porque en ingles se dicen igual.
  */

  "Adobe": "Adobe",
  "Duna": "Dune",
  "Escarcha": "Frost",
  "Marea": "Tide",
  "Reliquia": "Relic",
  "Averno": "Inferno",
  "Blueprint": "Blueprint",
  "Bosque": "Forest",
  "Tinta": "Ink",

  /* ---- El cierre ----
     Las quince que quedaban, todas partidas en varias lineas: ninguna herramienta
     que mire UNA linea puede verlas enteras, y por eso fueron las ultimas.
  */

  " · se deshizo lo cumplido": " · what was completed was undone",
  "Las habilidades que crees a partir de ahora nacen así.":
    "The skills you create from now on are born like this.",
  " Las que ya tienes también van con esta exigencia.":
    " The ones you already have run at this setting too.",
  "Guarda tu progreso en tu cuenta para que la computadora y el teléfono vean lo mismo.":
    "Save your progress to your account so your computer and your phone see the same thing.",
  "una rama": "one branch",
  "{0} ramas": "{0} branches",
  " a la vista y en solo lectura; no se borró nada.":
    " visible and read-only; nothing was deleted.",
  "Pro la vuelve a poner en marcha y deja de contar los talentos de cada una.":
    "Pro puts it back in motion and stops counting the talents in each one.",
  "Pro las vuelve a poner en marcha y deja de contar los talentos de cada una.":
    "Pro puts them back in motion and stops counting the talents in each one.",
  "Estás en Gratuito. Pro abre las ramas que quieras y deja de contar los talentos de cada una.":
    "You're on Free. Pro opens as many branches as you want and stops counting the talents in each one.",
  "Estás en Gratuito, que incluye {0}.": "You're on Free, which includes {0}.",
  "Las otras {0} siguen": "The other {0} stay",
  "Estás en Gratuito: {0}, y ya la tienes.": "You're on Free: {0}, and you already have it.",
  "Estás en Gratuito: {0}, y ya las tienes.": "You're on Free: {0}, and you already have them.",
  "El servidor no encontró algo que la consulta necesita. Suele ser que falta correr un SQL de la carpeta supabase/ — mira su LEEME. Detalle: {0}":
    "The server couldn't find something the query needs. It usually means a SQL file from the supabase/ folder hasn't been run — see its LEEME. Detail: {0}",
  "Desde {0} al mes. Cancelas cuando quieras.": "From {0} a month. Cancel whenever you want.",
  "{0}, una sola vez": "{0}, just once",
  "Un mundo es la app hecha de otro material: su tipografía, sus texturas, su marco y sus propios nombres para cada rango del camino. Con {0} se abren los tres construidos y los que lleguen después.":
    "A world is the app made of another material: its type, its textures, its frame and its own names for each rank of the path. With {0} the three that are built open, and the ones that come later.",
  "Ver {0}": "See {0}",

  /* ---- Lo que trajo la fusion con origin/main (0.7.74 -> 0.7.83) ----
     El cajon de los caminos, el cambio de cuenta con un toque, la rama de pie y
     los enlaces legales. Nueve versiones que entraron mientras esto se traducia.
     Lo que NO esta aqui es el CONTENIDO de los diez caminos: 363 frases en
     caminos/caminos.json, que ademas lo genera caminos/app.py desde
     plantillas/LEEME.md. Traducir el JSON a mano lo borraria el generador la
     proxima vez que corra. Es una tanda aparte y hay que decidir como.
  */

  "Ver la rama de pie": "See the branch upright",
  "Volver a lo ancho, como estaba": "Back to landscape, as it was",
  "Quitar de este dispositivo": "Remove from this device",
  "términos": "terms",
  "aviso de privacidad": "privacy notice",
  "Entrar con otra cuenta": "Sign in with another account",
  "La cuenta en la que estás ahora se queda guardada en este dispositivo: podrás volver a ella con un toque.":
    "The account you're in now stays saved on this device: you'll be able to come back to it with one tap.",
  "Ya entraste aquí con:": "You've signed in here with:",
  "o entra con otra": "or sign in with another",
  "o escribe tu correo": "or type your email",
  "Esa cuenta ya no está guardada en este dispositivo.":
    "That account is no longer saved on this device.",
  "Guardando lo último…": "Saving the last of it…",
  "No cambié de cuenta, para no dejarte atrás lo que falta por subir. ":
    "I didn't switch accounts, so as not to leave behind what's still to upload. ",
  "Revisa la conexión e inténtalo otra vez.": "Check your connection and try again.",
  "La sesión guardada de ": "The saved session for ",
  "Se quita ": "Removing ",
  "Quitada de este dispositivo": "Removed from this device",
  "Me quedé aquí, para no dejarte atrás lo que falta por subir. ":
    "I stayed here, so as not to leave behind what's still to upload. ",
  "Este navegador no me deja guardar el paso intermedio. Cierra sesión y entra con la otra cuenta.":
    "This browser won't let me save the step in between. Sign out and sign in with the other account.",
  "Abriendo la entrada…": "Opening the sign-in…",
  "Sin cerrar la de ahora": "Without closing the current one",
  "Diez caminos ya armados": "Ten ready-made paths",
  "cuentas al día": "accounts per day",
  "Darlo por atendido": "Mark as handled",
  "Empiezas por": "You start with",
  "Trayendo los caminos…": "Fetching the paths…",
  "No se pudieron traer": "I couldn't fetch them",
  "Hace falta conexión para verlos la primera vez. Después ya se quedan.":
    "You need a connection to see them the first time. After that they stay.",
  "Un proyecto nuevo": "A new project",
  "Una rama nueva": "A new branch",
  "De cero": "From scratch",
  "Por lo que elegiste al empezar": "Based on what you picked at the start",
  "Los demás": "The rest",
  "Los caminos": "The paths",
  "abierto desde el día uno": "open from day one",
  "Ponerlo en mi tablero": "Put it on my board",
  "Tu camino ya está puesto": "Your path is in place",
  "El primero ya está abierto.": "The first one is already open.",

  /* ---- Las dos frases largas del cajon de caminos ----
  */

  "Algo que estás construyendo: una mudanza, un lanzamiento, un trámite largo. Un camino lo trae armado, con <b>los encargos en el orden en que se pueden hacer de verdad</b>.":
    "Something you're building: a move, a launch, a long piece of paperwork. A path brings it ready-made, with <b>the assignments in the order they can actually be done</b>.",
  "Un camino la trae armada: <b>peldaños encadenados</b>, con sus pasos, sus plazos y las misiones que la alimentan. Todos salen de métodos publicados, y lo que entre se edita como cualquier cosa tuya.":
    "A path brings it ready-made: <b>chained rungs</b>, with their steps, their deadlines and the missions that feed them. They all come from published methods, and whatever lands is edited like anything else of yours.",

  /* ---- Lo que cambio en la segunda fusion ----
     «Aqui estas» paso a «Estas aqui» en origin/main mientras esto se fusionaba.
  */

  "Estás aquí": "You are here",
  "Añadir otra cuenta": "Add another account"
};
