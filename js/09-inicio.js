/* Bienvenida, tutorial, ejemplos, zona horaria y respaldos */
/* ================= Bienvenida =================
   Seis preguntas para armar un tablero con las cosas que a esa persona le
   importan, en vez de soltarla frente a una app vacía.

   Eran TRES —áreas, exigencia y proyecto— y las tres preguntaban por lo que
   se quiere. Faltaban las que deciden qué NO ponerle, que es donde estaba el
   problema de verdad: todo el mundo salía con las mismas seis habilidades, la
   misma misión diaria y la misma rama de seis peldaños con dos plazos largos y
   una cima a 240 días, tuviera diez minutos al día o dos horas, y le costara
   arrancar o le costara cerrar. Un tablero igual para todos es un tablero
   pensado para nadie, y la mitad de lo que trae acaba siendo deuda.

   Las tres nuevas son de género (cómo hablarle), de tiempo real al día y de
   dónde se le cae lo que empieza. Lo que HACE cada una está en `ramaAMedida`,
   `habilidadesPorArea` y `cadenciaDeMision`, todas aquí abajo y todas juntas
   a propósito. */

/* Cada área trae DOS habilidades, una misión y una rama de SEIS talentos.

   Las dos habilidades, y no tres: con tres, elegir cuatro áreas dejaba doce
   habilidades puestas el primer día, y una habilidad no es un adorno --baja si
   la dejas--, así que doce son doce deudas vivas antes de empezar. Con el
   máximo en tres áreas salen seis, que es justo el tope del plan gratuito.

   Y las dos tienen que ser del MISMO OFICIO. Había dos áreas que no lo eran y
   las paró Eduardo: "Crear cosas" creaba Dibujo y Escritura --dos artes que no
   se practican igual ni se parecen-- y "Gente que quiero" creaba Oratoria y
   Carisma, que es hablar en público y no es cuidar a nadie. Elegir un área y
   encontrarse una habilidad que no tiene que ver con lo que se pidió no se lee
   como una sugerencia: se lee como que la app entendió otra cosa. La
   comprobación que lo caza de un vistazo: las dos habilidades tienen que caer
   en la misma categoría del catálogo (`SKILL_CATALOG`, js/05-resumen.js).

   Los TÍTULOS empiezan todos por un verbo en primera persona --"Ordenar mi
   dinero", y no "Dinero"--. Lo que se elige aquí no es un tema, es algo que uno
   va a hacer, y el verbo es lo que lo dice.

   Los seis talentos NO van en fila. Una fila es una lista de deberes con la
   palabra "mapa" encima, y de este módulo enseña justo lo único que no tiene de
   especial: que las cosas van en orden. La forma es un rombo --uno arriba, dos
   caminos de dos, y una cima que se abre con CUALQUIERA de los dos--, así que
   la primera rama que alguien ve ya trae dentro las tres cosas que el lienzo
   sabe hacer: encadenar, abrirse en dos y volver a juntarse. Eran cinco en
   fila hasta que lo paró Eduardo por aburrido.

   Los dos caminos no son dos mitades cualesquiera: uno es la CONSTANCIA
   --sostener algo en el tiempo-- y el otro son las MARCAS --logros que se
   cierran de un golpe--. Repartidos así, a quien se le rompa la disciplina le
   queda una ruta viva, que es justo lo que un mapa puede hacer y una lista no.

   Los peldaños que se cierran en sí mismos son HITOS y no llevan plazo; los que
   se sostienen en el tiempo son METAS, las únicas con `days`. Mezclarlos
   importa: una rama entera de metas es una agenda con fechas, y eso agobia
   igual que agobiaban las doce habilidades.

   Las llaves `k` y `req` son de aquí y no llegan a los datos: `uid()` no existe
   hasta crear el nodo, así que los requisitos se escriben con nombres cortos y
   `buildFromOnboarding` los traduce a ids de verdad. */
const ONBOARD_AREAS = [
  { id: "salud", proyectos: ["Correr mi primera carrera", "Armar mi rutina en casa"],     label: "Mover mi cuerpo",     icon: "dumbbell", color: "#ff8a70",
    skills: ["Ejercicio", "Correr"],
    mission: { name: "Moverme 20 minutos", icon: "bolt", xp: 20 },
    branch: "Salud",
    perks: [
      { k: "a", tipo: "hito", name: "Caminar 20 minutos tres días seguidos",  icon: "bolt",   days: 0,   xp: 80 },
      { k: "b", req: ["a"], tipo: "meta", name: "Moverme tres veces por semana, un mes", icon: "target", days: 45, xp: 180 },
      { k: "c", req: ["a"], tipo: "hito", name: "Aguantar 5 minutos corriendo sin parar", icon: "flame", days: 0, xp: 120 },
      { k: "d", req: ["b"], tipo: "meta", name: "Una rutina que sostengo sin pensarla",  icon: "shield", days: 180, xp: 400 },
      { k: "e", req: ["c"], tipo: "hito", name: "Correr 5 kilómetros de una tirada",     icon: "trophy", days: 0,   xp: 250 },
      { k: "f", req: ["d", "e"], modo: "cualquiera", tipo: "meta", name: "Correr 10 kilómetros seguidos", icon: "crown", days: 240, xp: 500 }
    ] },
  { id: "mente", proyectos: ["Terminar el curso que dejé a medias", "Sacar mi certificado"],     label: "Aprender algo nuevo",      icon: "book", color: "#6fc3e8",
    skills: ["Lectura", "Idiomas"],
    mission: { name: "Estudiar 15 minutos", icon: "cap", xp: 20 },
    branch: "Aprender",
    perks: [
      { k: "a", tipo: "hito", name: "Terminar el primer capítulo",            icon: "book",   days: 0,   xp: 80 },
      { k: "b", req: ["a"], tipo: "hito", name: "Estudiar diez días seguidos", icon: "flame", days: 0,   xp: 120 },
      { k: "c", req: ["a"], tipo: "hito", name: "Explicarle a alguien lo que aprendí", icon: "mic", days: 0, xp: 150 },
      { k: "d", req: ["b"], tipo: "meta", name: "Llegar a la mitad del curso", icon: "target", days: 60,  xp: 200 },
      { k: "e", req: ["c"], tipo: "hito", name: "Usar lo aprendido en algo real", icon: "bulb", days: 0,  xp: 220 },
      { k: "f", req: ["d", "e"], modo: "cualquiera", tipo: "meta", name: "Terminar el curso entero", icon: "cap", days: 180, xp: 400 }
    ] },
  /* Dibujo y Pintura, y el título dice exactamente eso. Antes era "Crear
     cosas" con Dibujo y Escritura dentro, y ni los talentos le hacían sitio a
     la escritura: "diez bocetos", "enseñárselo a alguien" y "publicar mi primer
     trabajo" son de alguien que dibuja. La rama se sigue llamando Creatividad
     porque ahí es donde caben después la escritura, la foto o la música: lo que
     se estrecha es la promesa del primer día, no el mapa. */
  { id: "creativo", proyectos: ["Montar mi portafolio", "Preparar mi primera exposición"],  label: "Dibujar y pintar",        icon: "brush", color: "#b7a2ea",
    skills: ["Dibujo", "Pintura"],
    mission: { name: "Dibujar diez minutos", icon: "pen", xp: 20 },
    branch: "Creatividad",
    perks: [
      { k: "a", tipo: "hito", name: "Diez bocetos sin borrar ninguno",        icon: "pen",    days: 0,   xp: 80 },
      { k: "b", req: ["a"], tipo: "meta", name: "Crear algo cada semana, dos meses", icon: "brush", days: 60, xp: 200 },
      { k: "c", req: ["a"], tipo: "hito", name: "Terminar algo y no dejarlo a medias", icon: "flag", days: 0, xp: 130 },
      { k: "d", req: ["b"], tipo: "hito", name: "Llenar un cuaderno entero",   icon: "book",   days: 0,   xp: 250 },
      { k: "e", req: ["c"], tipo: "hito", name: "Enseñárselo a alguien que no soy yo", icon: "smile", days: 0, xp: 200 },
      { k: "f", req: ["d", "e"], modo: "cualquiera", tipo: "meta", name: "Publicar mi primer trabajo", icon: "star", days: 120, xp: 350 }
    ] },
  { id: "dinero", proyectos: ["Salir de una deuda", "Armar mi presupuesto del año"],    label: "Ordenar mi dinero",  icon: "coin", color: "#5fe0b0",
    skills: ["Finanzas", "Organización"],
    mission: { name: "Anotar mis gastos del día", icon: "chart", xp: 15 },
    branch: "Dinero",
    perks: [
      { k: "a", tipo: "hito", name: "Saber cuánto entra y cuánto sale",       icon: "chart",  days: 0,   xp: 80 },
      { k: "b", req: ["a"], tipo: "hito", name: "Un mes entero anotando todo", icon: "book",  days: 0,   xp: 150 },
      { k: "c", req: ["a"], tipo: "hito", name: "Apartar algo el día que cobro", icon: "coin", days: 0,  xp: 120 },
      { k: "d", req: ["b"], tipo: "meta", name: "Recortar un gasto que no echo de menos", icon: "target", days: 60, xp: 180 },
      { k: "e", req: ["c"], tipo: "meta", name: "Ahorrar mi primer mes de gastos", icon: "gem", days: 180, xp: 350 },
      { k: "f", req: ["d", "e"], modo: "cualquiera", tipo: "meta", name: "Fondo de emergencia completo", icon: "shield", days: 365, xp: 500 }
    ] },
  { id: "casa", proyectos: ["Montar mi recetario", "Equipar bien mi cocina"],      label: "Cocinar en casa",      icon: "coffee", color: "#f5d76e",
    skills: ["Cocina", "Repostería"],
    mission: { name: "Cocinar en vez de pedir", icon: "coffee", xp: 20 },
    branch: "Cocina",
    perks: [
      { k: "a", tipo: "hito", name: "Tres recetas que me salen sin mirar",    icon: "coffee", days: 0,   xp: 80 },
      { k: "b", req: ["a"], tipo: "meta", name: "Una semana entera cocinando en casa", icon: "target", days: 60, xp: 200 },
      { k: "c", req: ["a"], tipo: "hito", name: "Cocinar para alguien más",   icon: "smile",  days: 0,   xp: 130 },
      { k: "d", req: ["b"], tipo: "hito", name: "Diez recetas de memoria",    icon: "book",   days: 0,   xp: 250 },
      { k: "e", req: ["c"], tipo: "hito", name: "Inventar un plato mío",      icon: "bulb",   days: 0,   xp: 220 },
      { k: "f", req: ["d", "e"], modo: "cualquiera", tipo: "meta", name: "Una cena entera hecha por mí", icon: "star", days: 120, xp: 350 }
    ] },
  { id: "calma", proyectos: ["Arreglar mis horarios de sueño", "Planear unas vacaciones de verdad"],     label: "Descansar de verdad",   icon: "heart", color: "#f0a5c0",
    skills: ["Meditación", "Yoga"],
    mission: { name: "10 minutos sin pantallas", icon: "heart", xp: 15 },
    branch: "Bienestar",
    perks: [
      { k: "a", tipo: "hito", name: "Siete días acostándome a la misma hora", icon: "heart",  days: 0,   xp: 80 },
      { k: "b", req: ["a"], tipo: "hito", name: "Una semana sin pantallas en la cama", icon: "shield", days: 0, xp: 120 },
      { k: "c", req: ["a"], tipo: "hito", name: "Un día entero sin prisa, a propósito", icon: "plant", days: 0, xp: 150 },
      { k: "d", req: ["b"], tipo: "meta", name: "Dormir bien un mes seguido",  icon: "target", days: 30,  xp: 200 },
      { k: "e", req: ["c"], tipo: "meta", name: "Parar diez minutos cada día, tres meses", icon: "smile", days: 90, xp: 300 },
      { k: "f", req: ["d", "e"], modo: "cualquiera", tipo: "meta", name: "Un descanso que ya no tengo que planear", icon: "star", days: 180, xp: 400 }
    ] },
  /* Carisma y Escucha, que es lo que se practica al estar con alguien. Antes
     eran Oratoria y Carisma: hablar delante de una sala no es cuidar a nadie, y
     era la única área cuyas dos habilidades no se parecían ni entre ellas.
     `Escucha` nació en el catálogo para esto, y a `Carisma` se le quitó la
     palabra "escucha" de su léxico para que las dos no se peleen por la misma
     misión. */
  { id: "social", proyectos: ["Organizar una reunión con los míos", "Preparar un regalo que lleve tiempo"],    label: "Cuidar a mi gente",   icon: "smile", color: "#8fd18a",
    skills: ["Carisma", "Escucha"],
    mission: { name: "Escribirle a alguien", icon: "pen", xp: 15 },
    branch: "Personas",
    perks: [
      { k: "a", tipo: "hito", name: "Escribirle a tres personas pendientes",  icon: "pen",    days: 0,   xp: 80 },
      { k: "b", req: ["a"], tipo: "hito", name: "Ver a alguien en persona, no por mensaje", icon: "smile", days: 0, xp: 120 },
      { k: "c", req: ["a"], tipo: "hito", name: "Escuchar a alguien sin mirar el teléfono", icon: "heart", days: 0, xp: 130 },
      { k: "d", req: ["b"], tipo: "hito", name: "Organizar yo el plan, sin esperar", icon: "flag", days: 0, xp: 200 },
      { k: "e", req: ["c"], tipo: "meta", name: "Ver a mis amigos una vez al mes", icon: "target", days: 90, xp: 250 },
      { k: "f", req: ["d", "e"], modo: "cualquiera", tipo: "meta", name: "Una costumbre que nos junte sin avisar", icon: "star", days: 180, xp: 350 }
    ] },
  { id: "trabajo", proyectos: ["Cambiar de trabajo", "Lanzar algo propio"],   label: "Avanzar en mi trabajo",  icon: "wrench", color: "#9aa7b8",
    skills: ["Organización", "Negociación"],
    mission: { name: "Una hora de trabajo profundo", icon: "bolt", xp: 25 },
    branch: "Trabajo",
    perks: [
      { k: "a", tipo: "hito", name: "Una hora sin interrupciones, cinco días", icon: "bolt",  days: 0,   xp: 90 },
      { k: "b", req: ["a"], tipo: "hito", name: "Terminar eso que llevo aplazando", icon: "flag", days: 0, xp: 130 },
      { k: "c", req: ["a"], tipo: "hito", name: "Dejar escrito el día siguiente, una semana", icon: "map", days: 0, xp: 120 },
      { k: "d", req: ["b"], tipo: "meta", name: "Un mes cerrando lo que empiezo", icon: "target", days: 60, xp: 200 },
      { k: "e", req: ["c"], tipo: "hito", name: "Pedir lo que me toca pedir",   icon: "crown",  days: 0,   xp: 250 },
      { k: "f", req: ["d", "e"], modo: "cualquiera", tipo: "meta", name: "Certificarme en lo mío", icon: "trophy", days: 180, xp: 400 }
    ] }
];

/* ================= Las tablas de la bienvenida =================
   Cada respuesta que no sea una lista suelta vive en su propia tabla, con el
   mismo trato que ya tienen `EXIGENCIAS` y `ONBOARD_AREAS`: aquí está lo que
   se enseña, y lo que la respuesta HACE está más abajo, en `ramaAMedida()`.
   Separados a propósito — la mitad de arriba se lee para escribir la pantalla
   y la de abajo para entender qué cambia, y mezclarlas obliga a leerlo todo
   para cambiar una palabra. */

/* Cómo se le habla a quien usa la app. La primera pregunta y no la última, y
   no es un capricho de orden: es lo único que cambia cómo suenan las CINCO
   siguientes, y preguntarlo al final sería hablarle a alguien durante seis
   pantallas sin saber cómo. Ver `GENEROS` en js/01-base.js. */
const OB_GENEROS = [
  { id: "f", label: "En femenino",  ej: "Exploradora", icon: "smile" },
  { id: "m", label: "En masculino", ej: "Explorador",  icon: "smile" },
  { id: "x", label: "En neutro",    ej: "Exploradore", icon: "compass" }
];

/* Cuánto tiempo real hay al día. Es la pregunta que más cambia lo que se crea
   y la que nunca se hacía: hasta 0.7.93 quien tenía diez minutos y quien tenía
   dos horas recibían exactamente el mismo tablero, con las mismas seis
   habilidades y los mismos plazos. Al que le sobraba tiempo se le quedaba
   corto y al que no le llegaba se le quedaba una lista de deudas.

   Las tres franjas están escritas en MINUTOS y no en adjetivos («poco»,
   «normal») porque un adjetivo lo contesta cada quien contra su propia idea de
   normal, y quince minutos son quince minutos. */
const OB_TIEMPOS = [
  { id: "poco",     nombre: "Diez minutos al día",  dicho: "Lo justo para no romper la racha",   icon: "bolt" },
  { id: "algo",     nombre: "Media hora",           dicho: "Algo cada día, sin que sea un turno", icon: "target" },
  { id: "bastante", nombre: "Una hora o más",       dicho: "Tengo hueco de verdad y quiero usarlo", icon: "flame" }
];

/* Con qué se ha fallado antes. Es la única pregunta de las seis que sirve para
   quitar y no para poner, y por eso hacía falta: una rama en rombo con seis
   peldaños, dos plazos largos y una cima a 240 días es un buen mapa para quien
   sostiene las cosas y una condena para quien no. La app no puede saber cuál de
   los dos eres, pero sí puede preguntarlo una vez.

   Tres y no cinco, y las tres son los tres momentos en que algo se cae:
   arrancar, mantener y cerrar. Quien no se reconozca en ninguna puede saltar la
   pregunta y se queda el reparto de siempre. */
const OB_FLAQUEZAS = [
  { id: "empezar",  nombre: "Me cuesta arrancar",     dicho: "Lo pienso mucho y no doy el primer paso", icon: "bolt" },
  { id: "sostener", nombre: "Me cuesta sostenerlo",   dicho: "Empiezo con todo y a las dos semanas lo dejo", icon: "flame" },
  { id: "terminar", nombre: "Me cuesta terminar",     dicho: "Tengo cinco cosas a medias y ninguna cerrada", icon: "flag" }
];

/* ================= Lo que cada respuesta HACE =================
   Aquí se traduce lo contestado a la rama que se va a crear. Todo pasa por una
   sola función a propósito: son cinco reglas que se pisan entre ellas —recortar
   la rama cambia quién es requisito de quién, y cambiar un tipo cambia si lleva
   plazo— y repartidas por `buildFromOnboarding` se convertían en cinco `if`
   dentro de un bucle que ya crea nodos.

   Recibe los peldaños tal como están escritos en `ONBOARD_AREAS` y devuelve
   otros nuevos: no toca la tabla. La tabla es una constante que se lee una vez
   por área y hasta tres veces por bienvenida, y modificarla en sitio dejaría la
   segunda área con lo que le hizo la primera. */
function ramaAMedida(perks, plan) {
  let pasos = perks.map(p => Object.assign({}, p));

  /* 1. CUÁNTOS peldaños. Con diez minutos al día, o con «tengo cinco cosas a
        medias», la rama nace de cuatro: se van los dos del medio y la cima pasa
        a colgar de los dos caminos cortos. Sigue siendo un rombo —lo que este
        módulo enseña es que un mapa se abre y se vuelve a juntar, no que sea
        largo—, solo que se cierra en semanas y no en meses.

        Los requisitos se reescriben a mano y no se recalculan: `f` colgaba de
        `d` y `e`, que son justo los que se van, y un requisito que apunta a un
        peldaño que no existe deja la cima con candado para siempre. Es el mismo
        fallo del que ya avisa el `filter` de `buildFromOnboarding`. */
  if (plan.tiempo === "poco" || plan.flaqueza === "terminar") {
    pasos = pasos.filter(x => x.k !== "d" && x.k !== "e");
    pasos = pasos.map(x => x.k === "f" ? Object.assign({}, x, { req: ["b", "c"] }) : x);
  }

  /* 2. Lo que se sostiene en el tiempo, para quien dice que no lo sostiene.
        Toda meta que no sea la cima pasa a hito y suelta su plazo: un hito se
        cierra en sí mismo y no lleva reloj encima. La cima se queda como está
        —una rama entera sin ninguna meta es una lista de recados— y es la única
        que puede pedir tiempo, porque es la única que se ve venir de lejos. */
  if (plan.flaqueza === "sostener") {
    pasos = pasos.map(x => (x.tipo === "meta" && x.k !== "f")
      ? Object.assign({}, x, { tipo: "hito", days: 0 }) : x);
  }

  /* 3. Y para quien no arranca, los tres primeros nunca llevan plazo. Un plazo
        en el peldaño uno no empuja: asusta, que es exactamente lo contrario de
        lo que hace falta ahí. */
  if (plan.flaqueza === "empezar") {
    pasos = pasos.map(x => (x.tipo === "meta" && ["a", "b", "c"].indexOf(x.k) >= 0)
      ? Object.assign({}, x, { tipo: "hito", days: 0 }) : x);
  }

  /* 4. Y los plazos que queden, medidos contra el tiempo que hay. Un plazo es
        una cuenta de días y quien dedica diez minutos tarda más que quien dedica
        una hora: dejarlos iguales para los dos es fechar la mitad de las metas
        para que se pasen.

        Los dos topes no son adornos, y los dos se vieron midiendo. El suelo de
        15 días existe porque por debajo de dos semanas un plazo deja de ser un
        plazo y pasa a ser una prisa. Y el techo de un AÑO porque sin él el
        1,4 sobre la meta más larga —el fondo de emergencia, que ya viene a 365—
        daba 511 días: año y medio en el primer tablero de alguien que acaba de
        entrar. Nada de lo que crea la bienvenida se fecha más allá de un año,
        pase lo que pase con el factor. */
  const factor = plan.tiempo === "poco" ? 1.4 : plan.tiempo === "bastante" ? 0.7 : 1;
  if (factor !== 1) {
    pasos = pasos.map(x => x.days > 0
      ? Object.assign({}, x, { days: Math.min(365, Math.max(15, Math.round(x.days * factor))) }) : x);
  }
  return pasos;
}

/* Cuántas habilidades trae cada área. Dos es lo de siempre y lo que explica el
   comentario de `ONBOARD_AREAS`; con diez minutos al día son dos deudas por
   área en vez de una, y con tres áreas eso son seis habilidades bajando a la
   vez para alguien que dijo que no tiene tiempo. */
function habilidadesPorArea(plan) {
  return plan.tiempo === "poco" ? 1 : 2;
}

/* La misión diaria, o casi. Con diez minutos al día pasa a tres días por
   semana —lunes, miércoles y viernes— en vez de todos: una misión diaria que no
   se cumple no es un recordatorio, es una racha rota cada dos días, y la racha
   es de lo poco que esta app no puede permitirse que mienta.

   Los días van en índices de `getUTCDay()`, donde el 0 es domingo: los mismos
   que lee `missionDueOn` y los mismos que pinta el formulario de misiones. */
function cadenciaDeMision(plan) {
  return plan.tiempo === "poco"
    ? { cadence: "weekly", days: [1, 3, 5] }
    : { cadence: "daily", days: [] };
}

/* ¿Sale la pregunta del género? En español sí y en inglés no, y no es una
   traducción que falte: en inglés el sustantivo no marca género, así que
   `gen()` devuelve siempre la palabra base y contestarla no cambiaría ni una
   letra de la app. Una pregunta que no hace nada es peor que no preguntar —
   promete algo, y además alarga a seis un cuestionario que allí son cinco.

   Es lo mismo que ya hace el panel de Ajustes, que se esconde por lo mismo. */
function preguntaGenero() {
  return typeof idiomaActual !== "function" || idiomaActual() === "es";
}

let onboardStep = 0;
let onboardPick = { genero: "", areas: [], tiempo: "", pace: "medio", flaqueza: "", project: "" };

function startOnboarding() {
  onboardStep = 0;
  onboardPick = { genero: "", areas: [], tiempo: "", pace: "medio", flaqueza: "", project: "" };
  renderOnboarding();
  showView("onboarding");
}

/* Una fila de opciones, que es la forma que tienen cuatro de las seis
   preguntas. Estaba escrita tres veces con tres nombres de clase distintos y
   las tres se veían igual; la cuarta y la quinta habrían sido la cuarta y la
   quinta copia. */
function obOpciones(lista, elegido, fn) {
  return `<div class="ob-pace">
    ${lista.map(o => `
      <button class="ob-pace-opt ${elegido === o.id ? "on" : ""}" onclick="${fn}('${o.id}')">
        <span class="op-ic" data-r="${escapeAttr(o.id)}">${icon(o.icon || o.icono, 20)}</span>
        <span class="op-tx"><b>${escapeHtml(tx(o.nombre || o.label))}</b><span>${escapeHtml(tx(o.dicho || o.ej || ""))}</span></span>
      </button>`).join("")}
  </div>`;
}

/* Las pantallas de la bienvenida, en una lista y en orden. Sale de aquí y no de
   dentro de `renderOnboarding` porque hay TRES sitios que necesitan saber
   cuántas son —el rótulo «Pregunta N de M», el botón que en la última dice
   «Armar mi tablero» y el avance automático, que tiene que parar en ella— y con
   el número escrito a mano en los tres, el que se queda atrás deja el
   cuestionario terminando antes de la última pregunta. Eran tres pantallas con
   su «Pregunta 1 de 3» escrito dentro de cada una; de ahí viene la manía.

   Y son seis o cinco según el idioma: ver `preguntaGenero`. */
function obPantallas() {
  const pantallas = [
    () => `
        <h2>${tx("¿Cómo prefieres que te hable?")}</h2>
        <p class="settings-note">${tx("El español pone género en muchas palabras y esta app te habla de tú. Dime cuál usar y lo uso en todas: los rangos, los avisos y los correos.")}</p>
        ${obOpciones(OB_GENEROS, onboardPick.genero, "pickGenero")}`,
    () => `
        <h2>${tx("¿Qué partes de tu vida quieres mejorar?")}</h2>
        <p class="settings-note">${tx("Elige de una a tres. Con eso armo tus primeras habilidades, misiones y ramas — después puedes cambiar todo.")}</p>
        <div class="ob-areas">
          ${ONBOARD_AREAS.map(a => `
            <button class="ob-area ${onboardPick.areas.includes(a.id) ? "on" : ""}" style="${tonos("oc", a.color)}" onclick="toggleArea('${a.id}')">
              <span class="oa-ic">${icon(a.icon, 22)}</span>
              <span class="oa-tx">
                <b>${tx(a.label)}</b>
                <span>${a.skills.map(n => tx(n)).join(" · ")}</span>
              </span>
              <span class="oa-check">${icon("check", 15)}</span>
            </button>`).join("")}
        </div>`,
    () => `
        <h2>${tx("¿Cuánto tiempo tienes de verdad al día?")}</h2>
        <p class="settings-note">${tx("Lo que contestes decide cuántas habilidades te pongo, si la misión es diaria o de tres días, y cuánto tiempo doy a cada meta. Sé honesto: es más fácil subir después que ir siempre debiendo.")}</p>
        ${obOpciones(OB_TIEMPOS, onboardPick.tiempo, "pickTiempo")}`,
    () => `
        <h2>${tx("¿Qué tan exigente lo quieres?")}</h2>
        <p class="settings-note">${tx("Esto define cuánto tiempo puedes dejar una habilidad sin practicar antes de que empiece a bajar.")}</p>
        ${obOpciones(Object.values(EXIGENCIAS), onboardPick.pace, "pickPace")}`,
    () => `
        <h2>${tx("¿Dónde se te suele caer?")}</h2>
        <p class="settings-note">${tx("Con esto decido qué NO ponerte: menos plazos si te cuesta arrancar, menos metas largas si te cuesta sostener, y una rama más corta si lo que te cuesta es cerrar. Si no te reconoces en ninguna, sáltala.")}</p>
        ${obOpciones(OB_FLAQUEZAS, onboardPick.flaqueza, "pickFlaqueza")}`,
    () => `
        <h2>${tx("¿Hay algo que estés construyendo ahora?")}</h2>
        <p class="settings-note">${tx("Un proyecto con etapas: mudarte, lanzar algo, terminar un trámite. Si no hay nada, puedes saltarlo.")}</p>
        <label class="field">
          <span>${tx("Nombre del proyecto (opcional)")}</span>
          <input type="text" id="ob-project" placeholder="${escapeAttr(tx("Ej. Renovar mi cuarto"))}" maxlength="60" value="${escapeAttr(onboardPick.project)}">
        </label>
        ${ideasDeProyecto().length ? `
          <p class="settings-note ob-ideas-tit">${tx("O toca una de estas")}</p>
          <div class="ob-ideas">
            ${ideasDeProyecto().map(idea => `
              <button type="button" class="ob-idea" onclick="usarIdea('${enJS(tx(idea))}')">${escapeHtml(tx(idea))}</button>`).join("")}
          </div>` : ""}`
  ];
  return preguntaGenero() ? pantallas : pantallas.slice(1);
}

/* En qué posición cae la de las áreas, que es la única obligatoria. Se cuenta y
   no se escribe: sin la pregunta del género delante, la segunda pantalla pasa a
   ser la primera, y un `1` clavado aquí habría dejado la app en inglés pidiendo
   un área en la pantalla del tiempo. */
function obPasoDeAreas() {
  return preguntaGenero() ? 1 : 0;
}

function obUltimo() {
  return obPantallas().length - 1;
}

function renderOnboarding() {
  const el = document.getElementById("onboarding-content");
  const steps = obPantallas();
  /* El paso se ata a la lista antes de usarlo como índice. La lista mide seis
     o cinco según el idioma, así que cambiarlo a media bienvenida —o volver
     atrás desde un enlace viejo— podía dejar el índice fuera y `steps[n]()`
     revienta con la pantalla ya en blanco. Sujetarlo cuesta una línea. */
  if (onboardStep >= steps.length) onboardStep = steps.length - 1;
  if (onboardStep < 0) onboardStep = 0;

  /* Solo las áreas son obligatorias, y siguen siéndolo por lo mismo de siempre:
     sin ninguna, la bienvenida no tiene nada que crear. Las demás se pueden
     pasar de largo — la de género cae en neutro, el tiempo en media hora y la
     flaqueza en ninguna, que es el reparto que ya existía. Un cuestionario de
     seis pantallas con seis paredes no se termina. */
  const canNext = onboardStep !== obPasoDeAreas() || onboardPick.areas.length > 0;
  /* El número y la tarjeta se escriben AQUÍ y no dentro de cada paso: el
     rótulo va dentro de `.ob-q`, que es la que trae el marco y el aire, así
     que sacarlo fuera lo dejaba flotando encima de la tarjeta sin margen. */
  el.innerHTML = `
    <div class="ob-q">
      <div class="ob-num">${T`Pregunta ${onboardStep + 1} de ${steps.length}`}</div>
      ${steps[onboardStep]()}
    </div>
    <div class="ob-nav">
      ${onboardStep > 0 ? `<button class="btn btn-ghost" onclick="obBack()">${tx("Atrás")}</button>` : `<button class="btn btn-ghost" onclick="showView('summary')">${tx("Cancelar")}</button>`}
      <button class="btn btn-primary" onclick="obNext()" ${canNext ? "" : "disabled"}>
        ${onboardStep === steps.length - 1 ? tx("Armar mi tablero") : tx("Siguiente")}
      </button>
    </div>
    <div class="ob-dots">${steps.map((x, i) => `<i class="${i === onboardStep ? "on" : ""}"></i>`).join("")}</div>`;
}

/* ---- Los ejemplos de la pregunta del proyecto ----
   Salen de lo que la persona acaba de elegir en la de las áreas, no de una
   lista general: quien marcó «Cocinar en casa» y «Ordenar mi dinero» no tiene
   por qué ver «Cambiar de trabajo» entre las ideas.

   Existen porque esa pantalla es la única de las seis que pide ESCRIBIR cuando
   las otras piden elegir, y encima llega la última, cuando la persona ya se
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
  else { toast(tx("Tres es suficiente para empezar"), "atencion"); return; }
  renderOnboarding();
}

/* Las cuatro respuestas de una sola opción. Cada una avanza sola al paso
   siguiente y no se queda esperando el botón: son preguntas de una respuesta y
   tocar la respuesta ES contestarla — pedir además un «Siguiente» convierte
   seis pantallas en doce toques. La de las áreas no avanza, porque ahí se
   pueden elegir hasta tres y el toque significa otra cosa. */
function pickGenero(g) { onboardPick.genero = g; obAvanzar(); }
function pickTiempo(t) { onboardPick.tiempo = t; obAvanzar(); }
function pickPace(p) { onboardPick.pace = p; obAvanzar(); }
function pickFlaqueza(f) { onboardPick.flaqueza = f; obAvanzar(); }

/* Se repinta primero y se avanza después, con un respiro en medio: sin él, la
   opción elegida no llega a verse marcada nunca y el paso siguiente aparece de
   golpe, que se lee como si la app se hubiera adelantado. 180 ms es lo que
   tarda en verse una palomita. */
function obAvanzar() {
  renderOnboarding();
  setTimeout(() => { if (onboardStep < obUltimo()) { onboardStep++; renderOnboarding(); } }, 180);
}

/* El campo del proyecto es el único que hay que rescatar a mano antes de
   repintar, y por eso se pregunta por el paso: los demás ya viven en
   `onboardPick` desde que se tocaron. */
function obGuardarCampo() {
  const campo = document.getElementById("ob-project");
  if (campo) onboardPick.project = campo.value.trim();
}

function obBack() {
  obGuardarCampo();
  onboardStep--;
  renderOnboarding();
}

function obNext() {
  obGuardarCampo();
  if (onboardStep === obUltimo()) { buildFromOnboarding(); return; }
  onboardStep++;
  renderOnboarding();
}

function buildFromOnboarding() {
  const today = todayKey();
  /* La respuesta se GUARDA, no solo se aplica a lo que se crea ahora. Antes
     se usaba aquí y se perdía: la habilidad que crearas mañana volvía al punto
     medio sin avisar, y no había ninguna pantalla donde ver qué elegiste. */
  state.settings.exigencia = EXIGENCIAS[onboardPick.pace] ? onboardPick.pace : EXIGENCIA_POR_DEFECTO;
  /* El género se guarda aquí y no en su propio ajuste porque no es un ajuste de
     la bienvenida: es de la persona, y a partir de ahora lo lee la app entera
     (ver `generoActual` en js/01-base.js). Sin contestar se queda en neutro,
     que es lo que ya hacía la app antes de preguntarlo. */
  if (GENEROS.indexOf(onboardPick.genero) >= 0) state.settings.genero = onboardPick.genero;
  /* Y las dos nuevas. Se guardan aunque hoy solo las lea la propia bienvenida:
     el día que alguien añada un área o un camino, lo que decidió aquí tiene que
     poder consultarse — es la misma razón por la que `exigencia` dejó de
     perderse. */
  state.settings.tiempo = onboardPick.tiempo || "algo";
  state.settings.flaqueza = onboardPick.flaqueza || "";
  /* Y queda constancia de que se contestó. Es lo que apaga la recomendación
     de los cinco carteles vacíos (`bienvenidaPendiente`, js/01-base.js): sin
     esta marca, terminar la bienvenida y borrar luego las misiones volvería a
     ofrecer la bienvenida en menta, como si no hubiera pasado nada. */
  state.settings.bienvenida = todayKey();
  const ex = exigenciaActual();
  const grace = ex.grace;
  const decay = ex.decay;
  const plan = { tiempo: state.settings.tiempo, flaqueza: state.settings.flaqueza };
  const areas = ONBOARD_AREAS.filter(a => onboardPick.areas.includes(a.id));
  const cad = cadenciaDeMision(plan);
  const cuantas = habilidadesPorArea(plan);

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
       en vez de duplicarla.

       Dos, salvo que la bienvenida haya oído «tengo diez minutos al día»: ahí
       es una, y son tres en total en vez de seis. Ver `habilidadesPorArea`. */
    let skill = null;
    a.skills.slice(0, cuantas).forEach((nombre, j) => {
      /* El nombre que se GUARDA se traduce; el que se BUSCA, no. El catálogo
         (`SKILL_CATALOG`) está escrito en español y es quien decide icono y
         color, así que buscar por el nombre inglés no encontraría nada y
         "Reading" nacería con el icono genérico del área. Son dos cosas
         distintas: una clave interna y un rótulo. */
      const rotulo = tx(nombre);
      const yaEsta = state.skills.find(s => s.name.toLowerCase() === rotulo.toLowerCase());
      if (yaEsta) { if (j === 0) skill = yaEsta; return; }
      const cat = SKILL_CATALOG.find(x => x.n === nombre);
      const nueva = {
        id: uid(), name: rotulo,
        /* La categoría se traduce igual que el nombre, y por lo mismo: es un
           RÓTULO, no la clave. `cat.c` viene del catálogo, que está escrito en
           español y es quien decide icono y color; lo que se guarda dentro de
           la habilidad es lo que la persona va a leer en su lista y en el
           filtro de Habilidades. Sin el `tx()`, quien armaba su tablero en
           inglés acababa con «Listening» dentro de «Vida adulta» —y con dos
           grupos distintos si luego añadía una del catálogo, que sí traduce—.
           Es lo mismo que ya hacen el catálogo (`nuevaHabilidad`) y los
           caminos (`js/10j-caminos.js`). */
        category: cat ? tx(cat.c) : tx("General"),
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
      id: uid(), name: tx(a.mission.name), desc: "", icon: a.mission.icon, color: a.color,
      cadence: cad.cadence, days: cad.days.slice(), target: 1,
      skillId: skill.id, xp: a.mission.xp, log: {}, archived: false, completedAt: null,
      createdAt: today
    });
  });

  /* ---- Y lo que todavía no cabe en pantalla ----
     La bienvenida crea habilidades y misiones siempre, porque sus dos módulos
     están abiertos desde el primer día. Talentos y Proyectos no: llegan en el
     nivel 3 y en el 5 (ver `MODULO_NIVEL`, js/04-misiones.js), y crear ahora
     una rama de seis talentos que la persona no puede ver sería lo peor de las
     dos opciones — le sube el nivel de expedición por unos estrenos que no
     hizo, y el día que se abra el módulo se encuentra dentro cosas que no
     recuerda haber puesto.

     Así que se APUNTA lo elegido y se siembra el día que la puerta se abre, con
     su celebración delante. Eso convierte desbloquear un módulo en un regalo en
     vez de en una pantalla vacía, que es lo que decidió Eduardo.

     Se guarda el plan entero —áreas, proyecto, tiempo y flaqueza— y no solo los
     ids: quien cambie de exigencia dentro de dos semanas no tiene por qué
     encontrarse una rama distinta de la que pidió. */
  state.settings.siembra = {
    areas: areas.map(a => a.id),
    project: onboardPick.project || "",
    /* El color del proyecto se decide AQUÍ y no al sembrarlo. Talentos se abre
       antes que Proyectos, así que para cuando le toca al proyecto la lista de
       áreas ya está vacía —la vació la siembra de las ramas— y leerla entonces
       devolvía siempre el color de respaldo: todos los proyectos nacían mentas.
       Lo que se guarda es el resultado, que es lo único que no caduca. */
    color: areas.length ? areas[0].color : COLORS[0],
    tiempo: plan.tiempo,
    flaqueza: plan.flaqueza
  };
  sembrarLoApuntado();

  save();
  showView("summary");
  celebrate(tx("Tu tablero está listo"),
    areas.length === 1 ? T`${areas.length} área para empezar` : T`${areas.length} áreas para empezar`,
    "#5fe0b0", "compass");
  // Después de la celebración, no encima de ella
  quizaTutorial(2600);
}

/* ================= Sembrar lo que la bienvenida dejó apuntado =================
   Corre en dos momentos: justo al terminar la bienvenida —y ahí planta lo que
   ya esté abierto, que para una cuenta nueva no es nada— y cada vez que sube el
   nivel de expedición (`revisarNivelExpedicion`, js/02-progreso.js).

   No guarda ni consulta ningún número de nivel: le pregunta a `moduloAbierto`,
   que es quien decide. Con un nivel escrito aquí serían dos verdades, y la
   segunda es la que un día siembra una rama en un módulo que sigue cerrado.

   Devuelve si plantó algo, para que quien la llama sepa si hay que repintar. */
function sembrarLoApuntado() {
  const s = state.settings && state.settings.siembra;
  if (!s || typeof s !== "object") return false;
  /* La nota viaja en la sincronía y en los respaldos, así que puede llegar
     editada a mano o de una versión que la escribía de otra forma. Se
     endereza antes de tocarla: un `areas` que no sea una lista revienta el
     bucle, y reventar aquí es dejar a alguien sin su rama el único día en que
     se iba a crear. */
  if (!Array.isArray(s.areas)) s.areas = [];
  if (typeof s.project !== "string") s.project = "";
  const today = todayKey();
  const plan = { tiempo: s.tiempo || "algo", flaqueza: s.flaqueza || "" };
  let algo = false;

  if ((s.areas || []).length && typeof moduloAbierto === "function" && moduloAbierto("tree")) {
    ONBOARD_AREAS.filter(a => s.areas.indexOf(a.id) >= 0).forEach(a => {
      /* La habilidad a la que cuelgan los talentos es la que la bienvenida creó
         para esta área, buscada por su nombre. Puede no estar —se pudo borrar
         en las tres semanas que van de una cosa a la otra— y entonces el
         talento nace sin habilidad enlazada, que es un estado que la app ya
         admite: `skillId: null` es lo que tiene cualquier talento creado a mano
         sin elegir una. */
      const rotulo = tx(a.skills[0]);
      const skill = state.skills.find(x => x.name.toLowerCase() === rotulo.toLowerCase());
      const ids = {};
      /* En rombo, y por eso hace falta una tabla de equivalencias: los
         requisitos vienen escritos con las llaves cortas de `ONBOARD_AREAS`
         ("d" va después de "b") y el id de verdad no existe hasta crear el
         nodo. Como los padres van antes que los hijos en la lista, para cuando
         toca traducir el requisito su id ya está en `ids`.

         El `filter` no sobra aunque hoy no descarte nada: una llave mal escrita
         daría `undefined`, y un requisito indefinido deja el nodo con candado
         para siempre sin ninguna forma de abrirlo desde la app.

         `modo` viaja porque la cima se abre con CUALQUIERA de los dos caminos.
         En "todos" habría que terminar las dos rutas enteras para verla, que es
         exactamente la fila de seis que se quería evitar, solo que más larga.

         Y la variable se llama `paso` y no `t`: desde que existe el motor de
         idiomas hay una función global llamada `tx`, y una local parecida aquí
         dentro es justo el despiste que revienta una traducción en silencio. */
      ramaAMedida(a.perks, plan).forEach(paso => {
        const rama = tx(a.branch);
        const nodo = {
          id: uid(), name: tx(paso.name), branch: rama, desc: "",
          tipo: paso.tipo, cost: 0, planDays: paso.days, steps: [],
          skillId: skill ? skill.id : null, xpReward: paso.xp,
          requiere: (paso.req || []).map(k => ids[k]).filter(Boolean),
          modo: paso.modo === "cualquiera" ? "cualquiera" : "todos",
          icon: paso.icon, color: a.color,
          status: null, startDate: null, endDate: null, completedAt: null,
          investedTotal: 0, progress: 0, createdAt: today,
          history: [{ date: today, at: stamp(), event: T`Talento creado en la rama ${rama}` }]
        };
        state.perks.push(nodo);
        ids[paso.k] = nodo.id;
      });
    });
    s.areas = [];
    algo = true;
  }

  if (s.project && typeof moduloAbierto === "function" && moduloAbierto("projects")) {
    const col = s.color || COLORS[0];
    state.projects.push({
      id: uid(), name: s.project, branch: tx("Personal"),
      icon: "flag", color: col,
      desc: "", status: "active",
      steps: [
        { id: uid(), name: tx("Definir qué significa terminarlo"), done: false, at: null },
        { id: uid(), name: tx("Primer paso concreto"), done: false, at: null },
        { id: uid(), name: tx("Revisar avance"), done: false, at: null }
      ],
      skillId: state.skills.length ? state.skills[0].id : null, xpReward: 250,
      createdAt: today, lastActivity: today, completedAt: null,
      history: [{ date: today, at: stamp(), event: tx("Proyecto creado desde la bienvenida") }]
    });
    s.project = "";
    algo = true;
  }

  /* Cuando ya no queda nada por sembrar, la nota se va. Una llave vacía que
     sobrevive en los ajustes acaba viajando en cada sincronía y en cada
     respaldo diciendo que hay algo pendiente que no existe. */
  if (!(s.areas || []).length && !s.project) delete state.settings.siembra;
  return algo;
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
  /* `moduloUsable` y no `moduloOn`: el tutorial tampoco explica lo que el
     nivel todavía no abrió. Enseñar el árbol de talentos el primer día y que
     al ir a buscarlo esté cerrado es peor que no enseñarlo — y este cambio
     existe justo para que el primer día quepa en la cabeza. */
  return TUTO_PASOS.filter(p => !p.modulo || moduloUsable(p.modulo));
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
  /* Idioma y moneda van ANTES que el tutorial, y por eso se enganchan aquí y
     no en el arranque: esta función es el embudo por el que pasan los TRES
     caminos de entrada —abrir la app ya dentro, entrar desde la puerta, y
     seguir sin cuenta—, y el arranque solo cubre el primero. Enganchado allí,
     quien se creaba una cuenta —que es justo el recién llegado al que hay que
     preguntarle— no veía nunca la pantalla.

     Va delante de la guarda del tutorial a propósito: son dos cosas distintas
     y haber visto una no contesta la otra. Al cerrarse, la pantalla vuelve a
     llamar aquí y entonces sí sale el tutorial, ya en el idioma elegido. */
  if (typeof regionHaceFalta === "function" && regionHaceFalta()) {
    if (document.getElementById("portada") || document.querySelector(".futuro-aviso")) return;
    if (typeof cargaVisible === "function" && cargaVisible()) return;
    mostrarPantallaRegion();
    return;
  }
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
    <button class="tuto-x" onclick="saltarTutorial()" aria-label="${escapeAttr(tx("Saltar tutorial"))}" title="${escapeAttr(tx("Saltar tutorial"))}">✕</button>
    ${/* Las cinco filas van SIEMPRE, en el mismo orden y con la misma altura:
          marca, título, texto, resumen gris y puntos. Antes cada tarjeta
          medía lo que midiera su texto y el contenido bailaba de una a otra
          —el título subía, el gris se movía— aunque el alto total ya
          estuviera fijado. Homologar las filas, y no solo la tarjeta, es lo
          que hace que solo cambien las palabras. */""}
    <div class="tuto-marca">${p.logo
      ? `<span class="tuto-logo">${logoNorata()}</span>`
      : `<span class="tuto-ic" style="${tonos("tc", p.color)}">${icon(p.icon, 30)}</span>`}</div>
    <h2 class="tuto-titulo">${escapeHtml(tx(p.titulo))}</h2>
    <p class="tuto-tx">${tx(p.tx)}</p>
    <p class="tuto-pie">${tx(p.pie)}</p>
    <div class="tuto-dots">${pasos.map((_, i) =>
      `<i class="${i === tutoPaso ? "on" : ""}"></i>`).join("")}</div>
    <div class="modal-actions">
      ${/* "Atrás" está siempre, apagado en la primera. Quitarlo movía de sitio
            a "Siguiente" justo al pasar de la primera a la segunda, y ese es
            el botón que se pulsa cinco veces seguidas. */
        ""}<button class="btn btn-ghost" onclick="tutoAtras()" ${tutoPaso ? "" : "disabled"}>${tx("Atrás")}</button>
      <button class="btn btn-primary" onclick="tutoSiguiente()">${ultimo ? tx("Empezar") : tx("Siguiente")}</button>
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
  toast(tx("Saliste del ejemplo. Tus datos están como los dejaste."), "hecho");
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
    /* `name` y `category` llegan en español porque son las claves del
       catálogo —quien decide icono y color—; lo que se GUARDA es el rótulo. */
    id: uid(), name: tx(name), category: tx(category), icon: iconName, color, xp,
    permanent: !!permanent, graceDays: 7, decayPerDay: 10,
    createdAt: daysAgo(30), lastActivity: lastAct || (xp > 0 ? today : null), lastCheck: today,
    log: xp > 0 ? [{ date: lastAct || today, xp, note: tx("Nivel inicial estimado") }] : []
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
    history: [{ date: today, at: stamp(), event: tx("Talento creado") }]
  }, extra);

  /* ---- Rama Salud: el ejemplo grande ----
     Es la que enseña de qué va el módulo, así que lleva las tres clases de
     talento, una convergencia de las dos maneras, una meta con sus etapas a
     medias y una caja del ático ya guardada. Las otras dos ramas se quedan
     pequeñas a propósito: si todas fueran densas, no se vería que una rama
     puede ser sencilla. */
  const tenis = mkP({
    name: tx("Tenis para correr"), icon: "bolt", color: "#ff8a70",
    desc: tx("Comprarlos es el primer paso: son tuyos desde que los pagas, sin plazo que cumplir."),
    tipo: "compra", cost: 1800, xpReward: 80,
    status: "completed", completedAt: daysAgo(20), investedTotal: 1800,
    history: [
      { date: daysAgo(20), at: new Date(Date.now() - 20 * 864e5).toISOString(), event: tx("Comprada y asegurada ($1,800)") },
      { date: daysAgo(21), at: new Date(Date.now() - 21 * 864e5).toISOString(), event: tx("Talento creado en la rama Salud") }
    ]
  });
  const primeraSalida = mkP({
    name: tx("Salir a correr una vez"), icon: "flag", color: "#f5d76e", tipo: "hito",
    desc: tx("Un hito: una acción puntual que se cierra en sí misma. Se marca con un toque."),
    xpReward: 40, requiere: [tenis.id],
    status: "completed", completedAt: daysAgo(18),
    history: [{ date: daysAgo(18), at: new Date(Date.now() - 18 * 864e5).toISOString(), event: tx("Hito conseguido") }]
  });
  const habito = mkP({
    name: tx("Correr 3 veces por semana"), icon: "flame", color: "#ff8a70",
    desc: tx("Una meta: tienes 3 meses y avanza marcando sus etapas."),
    planDays: 90, xpReward: 300, requiere: [primeraSalida.id],
    status: "active", startDate: daysAgo(16),
    endDate: addDaysKey(todayKey(), 74),
    steps: [
      { id: uid(), name: tx("Primera semana completa"), done: true, at: stamp() },
      { id: uid(), name: tx("Cuatro semanas seguidas"), done: true, at: stamp() },
      { id: uid(), name: tx("Ocho semanas seguidas"), done: false, at: null },
      { id: uid(), name: tx("Las doce semanas"), done: false, at: null }
    ],
    history: [
      { date: daysAgo(4), at: new Date(Date.now() - 4 * 864e5).toISOString(), event: tx("Etapa hecha: Cuatro semanas seguidas") },
      { date: daysAgo(16), at: new Date(Date.now() - 16 * 864e5).toISOString(), event: tx("Inversión de $0 — plan de 3 meses iniciado") }
    ]
  });
  /* Un segundo camino que nace del mismo sitio: enseña que el árbol se abre
     en abanico, no solo en cadena. */
  const reloj = mkP({
    name: tx("Reloj con pulsómetro"), icon: "target", color: "#6fc3e8",
    desc: tx("Para saber si corres al ritmo que crees que corres."),
    tipo: "compra", cost: 2400, xpReward: 90, requiere: [primeraSalida.id]
  });
  const tecnica = mkP({
    name: tx("Corregir mi técnica"), icon: "bulb", color: "#b7a2ea",
    desc: tx("Tres sesiones grabándome y ajustando la zancada."),
    planDays: 60, xpReward: 200, requiere: [reloj.id],
    steps: [
      { id: uid(), name: tx("Grabarme corriendo"), done: false, at: null },
      { id: uid(), name: tx("Comparar con una referencia"), done: false, at: null },
      { id: uid(), name: tx("Tres salidas aplicando el cambio"), done: false, at: null }
    ]
  });
  /* EL NODO QUE CORONA: necesita el hábito Y la técnica. Es la figura que
     antes no se podía dibujar, y por eso el ejemplo la trae. */
  const carrera = mkP({
    name: tx("Correr mi primera carrera de 5 km"), icon: "trophy", color: "#5fe0b0",
    desc: tx("La meta grande: hace falta el hábito Y la técnica. Es un talento que corona dos caminos."),
    cost: 450, planDays: 180, xpReward: 600,
    requiere: [habito.id, tecnica.id], modo: "todos"
  });
  /* CAMINO ALTERNATIVO: vale con cualquiera de los dos. Enseña el otro modo
     sin tener que buscarlo en un menú. */
  const club = mkP({
    name: tx("Entrar a un club de corredores"), icon: "smile", color: "#f0a5c0", tipo: "hito",
    desc: tx("Basta con tener el hábito O haber corrido una carrera: cualquiera de los dos te abre la puerta."),
    xpReward: 120, requiere: [habito.id, carrera.id], modo: "cualquiera"
  });

  /* Lo del trimestre pasado, para que el ático se vea funcionando desde el
     primer momento y no haya que esperar tres meses a entenderlo. */
  const viejoTrim = trimestreDe(addDaysKey(todayKey(), -140));
  const finDeTrim = addDaysKey(todayKey(), -140);
  const revision = mkP({
    name: tx("Revisión médica"), icon: "heart", color: "#8fd18a", tipo: "hito",
    desc: tx("Antes de empezar a correr en serio, saber cómo estoy."),
    xpReward: 60, status: "completed", completedAt: finDeTrim, createdAt: finDeTrim,
    history: [{ date: finDeTrim, at: new Date(Date.now() - 140 * 864e5).toISOString(), event: tx("Hito conseguido") }]
  });
  const bici = mkP({
    name: tx("Bicicleta de segunda mano"), icon: "bolt", color: "#9aa7b8",
    desc: tx("El intento anterior. Sirvió para descubrir que lo mío es correr."),
    tipo: "compra", cost: 3200, xpReward: 70, status: "completed",
    completedAt: finDeTrim, createdAt: finDeTrim, investedTotal: 3200,
    history: [{ date: finDeTrim, at: new Date(Date.now() - 140 * 864e5).toISOString(), event: tx("Comprada y asegurada ($3,200)") }]
  });
  const natacion = mkP({
    name: tx("Natación dos veces por semana"), icon: "goggles", color: "#6fc3e8",
    desc: tx("Se quedó a medias, y por eso viaja en la caja: guardar el trimestre no juzga lo que no terminaste."),
    planDays: 90, xpReward: 250, createdAt: finDeTrim,
    status: "active", startDate: finDeTrim, endDate: addDaysKey(finDeTrim, 90),
    congeladoEl: addDaysKey(todayKey(), -120),
    steps: [
      { id: uid(), name: tx("Cuatro semanas seguidas"), done: true, at: stamp() },
      { id: uid(), name: tx("Ocho semanas seguidas"), done: false, at: null }
    ],
    history: [{ date: finDeTrim, at: new Date(Date.now() - 140 * 864e5).toISOString(), event: tx("Plan de 3 meses iniciado") }]
  });

  // Rama Casa: dos caminos independientes que nacen del mismo punto
  const recetario = mkP({
    branch: "Casa", skillId: cocina.id, name: tx("Curso de cocina básica"), icon: "cap", color: "#f5d76e",
    desc: tx("Aprender diez recetas que puedas hacer sin receta."),
    cost: 990, planDays: 120, xpReward: 250
  });
  const cenaAmigos = mkP({
    branch: "Casa", skillId: cocina.id, name: tx("Cocinar para amigos"), icon: "heart", color: "#f0a5c0", tipo: "hito",
    desc: tx("Invitar a alguien y cocinarle. Sin plazo: se logra o no se logra."),
    xpReward: 60, requiere: [recetario.id]
  });

  // Rama Dinero: un talento listo para empezar, con costo real
  const fondo = mkP({
    branch: "Dinero", skillId: finanzas.id, name: tx("Fondo de emergencia"), icon: "gem", color: "#5fe0b0",
    desc: tx("Juntar tres meses de gastos. Un año de plazo para lograrlo."),
    planDays: 365, xpReward: 500
  });
  const curso = mkP({
    branch: "Dinero", skillId: finanzas.id, name: tx("Curso de inversión"), icon: "chart", color: "#6fc3e8",
    desc: tx("Entender en qué invertir antes de invertir."),
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
  toast(tx("Así se ve Norata en uso. Nada de esto se guarda: sal cuando quieras."));
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
      id: uid(), name: tx("Caminar 20 minutos"), desc: tx("Cuenta cualquier caminata seguida de 20 min o más."),
      icon: "bolt", color: "#ff8a70", cadence: "daily", days: [], target: 1,
      skillId: skillBy("Ejercicio"), xp: 20, log: streakLog(4, 1),
      archived: false, completedAt: null, createdAt: daysAgo(30)
    },
    {
      id: uid(), name: tx("Beber agua"), desc: tx("Ocho vasos a lo largo del día."),
      icon: "heart", color: "#6fc3e8", cadence: "daily", days: [], target: 8,
      skillId: null, xp: 10, log: Object.assign(streakLog(3, 8), { [todayKey()]: 3 }),
      archived: false, completedAt: null, createdAt: daysAgo(20)
    },
    {
      id: uid(), name: tx("Practicar idioma 15 min"), desc: tx("Lecciones, video o conversación."),
      icon: "globe", color: "#5fe0b0", cadence: "weekly", days: [1, 3, 5], target: 1,
      skillId: skillBy("Idiomas"), xp: 25, log: streakLog(2, 1),
      archived: false, completedAt: null, createdAt: daysAgo(25)
    },
    {
      id: uid(), name: tx("Cocinar algo nuevo"), desc: tx("Una receta que nunca hayas hecho."),
      icon: "coffee", color: "#f5d76e", cadence: "weekly", days: [0, 6], target: 1,
      skillId: skillBy("Cocina"), xp: 30, log: {},
      archived: false, completedAt: null, createdAt: daysAgo(14)
    },
    {
      id: uid(), name: tx("Revisar mis suscripciones"), desc: tx("Cancelar lo que ya no uso."),
      icon: "coin", color: "#b7a2ea", cadence: "once", days: [], target: 1,
      skillId: skillBy("Finanzas"), xp: 40, log: {},
      archived: false, completedAt: null, createdAt: daysAgo(5)
    }
  );
  if (!silent) { save(); renderMissions(); toast(tx("Misiones de ejemplo cargadas")); }
}

/* Proyectos de ejemplo: uno con ritmo, uno casi listo y uno estancado,
   para que se vea de inmediato para qué sirve el veredicto de salud. */
function loadProjectExamples(silent) {
  const daysAgo = (n) => addDaysKey(todayKey(), -n);
  const skillBy = (name) => (state.skills.find(s => s.name === name) || {}).id || null;
  const steps = (arr) => arr.map(([name, done]) => ({ id: uid(), name, done: !!done, at: done ? stamp() : null }));

  state.projects.push(
    {
      id: uid(), name: tx("Renovar la cocina"), branch: "Casa", icon: "wrench", color: "#f5d76e",
      desc: tx("Dejar la cocina funcional y ordenada, sin obra mayor."),
      status: "active", skillId: skillBy("Reparaciones"), xpReward: 250,
      steps: steps([[tx("Medir y hacer lista de lo que falta"), true], ["Comprar organizadores", true], ["Ordenar alacena", false], [tx("Cambiar la iluminación"), false]]),
      createdAt: daysAgo(24), lastActivity: daysAgo(2), completedAt: null,
      history: [
        { date: daysAgo(2), at: new Date(Date.now() - 2 * 864e5).toISOString(), event: tx("Etapa completada: Comprar organizadores") },
        { date: daysAgo(24), at: new Date(Date.now() - 24 * 864e5).toISOString(), event: tx("Encargo creado en el proyecto Casa") }
      ]
    },
    {
      id: uid(), name: tx("Curso de inglés en línea"), branch: "Aprender", icon: "cap", color: "#6fc3e8",
      desc: tx("Terminar los módulos y presentar la evaluación final."),
      status: "active", skillId: skillBy("Idiomas"), xpReward: 400,
      steps: steps([[tx("Módulos 1 a 4"), true], [tx("Módulos 5 a 8"), true], [tx("Práctica de conversación"), true], [tx("Evaluación final"), false]]),
      createdAt: daysAgo(60), lastActivity: daysAgo(3), completedAt: null,
      history: [
        { date: daysAgo(3), at: new Date(Date.now() - 3 * 864e5).toISOString(), event: tx("Etapa completada: Práctica de conversación") },
        { date: daysAgo(60), at: new Date(Date.now() - 60 * 864e5).toISOString(), event: tx("Encargo creado en el proyecto Aprender") }
      ]
    },
    {
      id: uid(), name: tx("Tienda en línea de artesanías"), branch: "Negocio", icon: "coin", color: "#ff8a70",
      desc: tx("Vender lo que hago sin depender de redes sociales."),
      status: "active", skillId: skillBy("Finanzas"), xpReward: 600,
      steps: steps([[tx("Definir catálogo"), true], [tx("Fotos de producto"), false], [tx("Montar la tienda"), false], ["Primera venta", false]]),
      createdAt: daysAgo(120), lastActivity: daysAgo(58), completedAt: null,
      history: [
        { date: daysAgo(58), at: new Date(Date.now() - 58 * 864e5).toISOString(), event: tx("Etapa completada: Definir catálogo") },
        { date: daysAgo(120), at: new Date(Date.now() - 120 * 864e5).toISOString(), event: tx("Encargo creado en el proyecto Negocio") }
      ]
    }
  );
  if (!silent) { save(); renderProjects(); toast(tx("Proyectos de ejemplo cargados")); }
}

/* ================= Zona horaria ================= */

/* Uno por cada desfase que existe, y los de los países donde se habla la
   lengua de la app con todos sus husos. Eran dieciséis y no salían de América
   más Madrid y Londres: con la app en inglés desde la 0.7.84, alguien en Tokio
   o en Berlín no encontraba el suyo en la lista.

   No pasa nada por no estar: `renderTimezone` mete SIEMPRE el huso detectado
   del dispositivo, así que quien viva en un sitio que no esté aquí ya lo tiene
   elegido. Esta lista es para quien quiere CAMBIARLO a otro — alguien que
   viaja, o que trabaja con el horario de otro país.

   Van sin ordenar a propósito: el orden lo decide el desfase al pintarlas, y
   ese cambia solo con el horario de verano. Ordenarlas aquí a mano sería una
   segunda verdad que se desincroniza dos veces al año. */
const TZ_OPTIONS = [
  /* México, con sus cuatro husos */
  "America/Mexico_City", "America/Tijuana", "America/Monterrey", "America/Cancun",
  "America/Hermosillo",
  /* El resto de América */
  "America/Bogota", "America/Lima", "America/Santiago", "America/Argentina/Buenos_Aires",
  "America/Sao_Paulo", "America/Montevideo", "America/Asuncion", "America/La_Paz",
  "America/Caracas", "America/Panama", "America/Costa_Rica", "America/Guatemala",
  "America/Havana", "America/Santo_Domingo", "America/Puerto_Rico",
  "America/New_York", "America/Chicago", "America/Denver", "America/Phoenix",
  "America/Los_Angeles", "America/Anchorage", "America/Halifax", "Pacific/Honolulu",
  /* Europa y África */
  "Atlantic/Azores", "Europe/Lisbon", "Europe/London", "Europe/Madrid", "Europe/Paris",
  "Europe/Berlin", "Europe/Rome", "Europe/Athens", "Europe/Kyiv", "Europe/Moscow",
  "Africa/Casablanca", "Africa/Lagos", "Africa/Cairo", "Africa/Johannesburg",
  "Africa/Nairobi",
  /* Asia y Oceanía */
  "Asia/Jerusalem", "Asia/Riyadh", "Asia/Dubai", "Asia/Karachi", "Asia/Kolkata",
  "Asia/Dhaka", "Asia/Bangkok", "Asia/Jakarta", "Asia/Shanghai", "Asia/Hong_Kong",
  "Asia/Singapore", "Asia/Manila", "Asia/Tokyo", "Asia/Seoul",
  "Australia/Perth", "Australia/Brisbane", "Australia/Sydney", "Pacific/Auckland",
  "UTC"
];

/* ---- El desfase de un huso, CALCULADO y no escrito ----
   Un desfase no es una propiedad del huso: es una propiedad del huso EN UNA
   FECHA. Madrid es GMT+1 en enero y GMT+2 en julio, y Santiago se mueve al
   revés que Madrid porque está en el otro hemisferio. Una tabla de desfases
   escrita a mano nace correcta y miente dos veces al año, en fechas distintas
   para cada país.

   Así que se pregunta al navegador, que lleva la base de husos dentro: se le
   pide la hora de ALLÁ y se resta la de aquí. Es el mismo truco que usa todo
   el mundo porque `Intl` no expone el desfase en minutos y punto.

   Devuelve `null` si el huso no existe —un respaldo viejo, un nombre que
   cambió de país—, y quien llama lo trata como «esta opción no se pinta» en
   vez de reventar la pantalla de Ajustes entera. */
function tzDesfaseMin(tz, cuando) {
  try {
    const d = cuando || new Date();
    const p = {};
    for (const x of new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    }).formatToParts(d)) p[x.type] = x.value;
    /* La medianoche sale como «24» en algunos navegadores y como «00» en
       otros. Sin esto, el huso de quien mira justo a las 00:00 salía un día
       entero desplazado. */
    const hora = p.hour === "24" ? 0 : Number(p.hour);
    const alla = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day),
                          hora, Number(p.minute), Number(p.second));
    /* Los milisegundos se tiran de los dos lados: `formatToParts` solo llega
       al segundo, y sin recortar aquí la resta traía un resto que redondeaba
       mal los husos de media hora. */
    return Math.round((alla - Math.floor(d.getTime() / 1000) * 1000) / 60000);
  } catch (e) { return null; }
}

/* «GMT-6», «GMT+5:30», «GMT+0». Se escribe a mano en vez de pedirle a `Intl`
   su `timeZoneName: "shortOffset"` porque ese cambia de forma según el idioma
   y el navegador —«GMT-6», «GMT-06:00», «UTC-6»—, y lo que hace útil esta
   columna es que todas las filas se lean IGUAL para poder compararlas de un
   vistazo. Lo pidió Eduardo con esas palabras: «que se vea en todas las zonas
   horarias igual, ayuda mucho a apoyarse en elegir la correcta».

   Los minutos solo se escriben cuando los hay: India es GMT+5:30 y Nepal
   GMT+5:45, pero poner «:00» en las otras sesenta ensucia la columna. */
function tzGMT(tz, cuando) {
  const m = tzDesfaseMin(tz, cuando);
  if (m === null) return "";
  const abs = Math.abs(m);
  const h = Math.floor(abs / 60), min = abs % 60;
  return "GMT" + (m < 0 ? "-" : "+") + h + (min ? ":" + String(min).padStart(2, "0") : "");
}

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
  /* La tabla de arriba es una constante de nivel superior, así que se congela
     en el idioma del arranque: envolverla allí no serviría de nada. Se traduce
     aquí, que es donde se saca la copia y donde ya se toca cada entrada. */
  let secs = AJUSTES_SECS.map(sec => Object.assign({}, sec, {
    nombre: tx(sec.nombre), sub: tx(sec.sub)
  }));

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
      id: "admin", nombre: tx("Norata por dentro"), icon: "chart", tono: "oro",
      sub: tx("El modo de pruebas, cuánta gente la usa y lo que se rompe")
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
  nav.innerHTML = (typeof cuentasMenuHTML === "function" ? cuentasMenuHTML("aj") : "") +
    `<div class="tema-hueco">${temaSwitchHTML()}</div>` +
    seccionesAjustes().map(sec => `
    <button class="aj-item ${ajusteAbierto === sec.id ? "on" : ""} ${sec.tono ? "t-" + sec.tono : ""}"
      onclick="mostrarAjuste('${sec.id}')">
      <span class="aj-ic">${icon(sec.icon, 17)}</span>
      ${/* El `sub` de la fila del plan lo escribe `planSub()`, que ya lo
             devuelve traducido. Volver a traducir lo ya traducido no cambia
             nada en pantalla, pero deja la frase INGLESA apuntada como
             pendiente y ensucia la única lista que dice cuánto falta. */""}
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
  if (ajusteAbierto === "cuenta") {
    renderPanelRitmo();
    /* Con `typeof` porque `js/09c-region.js` carga DESPUÉS que este
       archivo, y el service worker puede servir un index.html viejo con
       un JavaScript nuevo durante una carga (ver la nota de los iconos
       en `js/11-arranque.js`). */
    if (typeof renderGenero === "function") renderGenero();
    if (typeof renderPanelIdioma === "function") renderPanelIdioma();
    if (typeof renderPanelMoneda === "function") renderPanelMoneda();
  }

  const abierta = seccionesAjustes().find(x => x.id === ajusteAbierto);
  const titulo = document.getElementById("ajustes-titulo");
  /* `abierta` sale de `seccionesAjustes()`, que ya traduce: envolverla otra
     vez buscaba el inglés en el diccionario y lo apuntaba como si faltara. */
  if (titulo) titulo.textContent = (!escritorio && abierta) ? abierta.nombre : tx("Ajustes");
}

/* ================= Cómo te hablo =================
   La misma pregunta que abre la bienvenida, otra vez aquí. Y hace falta que
   esté en los dos sitios: la bienvenida se puede saltar, se contestó una vez
   hace meses, o sencillamente alguien cambia de respuesta — y de las tres
   cosas, la que peor se lleva es no tener dónde cambiarla.

   Reutiliza `obOpciones` y `OB_GENEROS`, que es lo que hace que las dos
   pantallas no se puedan separar: el día que se añada una forma, aparece en las
   dos sin tocar nada. */
function renderGenero() {
  const wrap = document.getElementById("genero-opciones");
  if (!wrap) return;
  /* En inglés el panel entero se va, no solo se vacía: `gen()` devuelve allí
     siempre la palabra base, así que este ajuste no cambiaría ni una letra —y
     un ajuste que no hace nada es peor que no tenerlo, porque promete algo—.
     Es la misma decisión que esconde la pregunta en la bienvenida
     (`preguntaGenero`); se pregunta una vez y las dos pantallas obedecen. */
  const panel = document.getElementById("panel-genero");
  if (panel) panel.hidden = !preguntaGenero();
  if (!preguntaGenero()) return;
  wrap.innerHTML = obOpciones(OB_GENEROS, generoActual(), "ponerGenero");
}

function ponerGenero(g) {
  if (GENEROS.indexOf(g) < 0) return;
  state.settings.genero = g;
  save();
  renderGenero();
  /* Y se repinta lo que ya está escrito con la forma vieja. El Resumen lleva el
     rango en su tarjeta y el menú de la cuenta también: sin esto, cambiar la
     respuesta dejaba «Rastreador» puesto hasta la siguiente vez que algo
     repintara esa pantalla, y eso se lee como que el ajuste no hizo nada. */
  if (typeof renderSummary === "function") renderSummary();
  const uno = OB_GENEROS.filter(x => x.id === g)[0];
  toast(uno ? T`Te hablo ${tx(uno.label).toLowerCase()}` : tx("Hecho"), "hecho");
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

  /* La misma fila que la bienvenida, y del mismo sitio: era la cuarta copia del
     mismo marcado —tres en el cuestionario y esta— y la que se quedaba atrás
     cada vez que se retocaba una clase. */
  wrap.innerHTML = obOpciones(Object.values(EXIGENCIAS), actual.id, "ponerExigencia");

  /* Solo las que decaen: una habilidad blindada no pierde XP nunca, así que
     sus dos números no significan nada y contarla infla el botón. */
  const desalineadas = state.skills.filter(s =>
    !s.permanent && (s.graceDays !== actual.grace || s.decayPerDay !== actual.decay));
  const zona = document.getElementById("ritmo-aplicar");
  if (!zona) return;

  if (!desalineadas.length) {
    zona.innerHTML = `<p class="settings-note" style="margin-top:14px">${
      tx("Las habilidades que crees a partir de ahora nacen así.")}${
      state.skills.length ? tx(" Las que ya tienes también van con esta exigencia.") : ""}</p>`;
    return;
  }

  zona.innerHTML = `
    <p class="settings-note" style="margin-top:14px">${tx("Esto es con lo que nacen las habilidades nuevas.")}
      ${desalineadas.length === 1
        ? tx("Una de las tuyas va con otros números, porque la creaste antes o la ajustaste a mano.")
        : T`${desalineadas.length} de las tuyas van con otros números, porque las creaste antes o las ajustaste una por una.`}</p>
    <button class="btn btn-aviso btn-block" onclick="aplicarExigenciaATodas()">
      ${desalineadas.length === 1 ? tx("Aplicarlo también a esa habilidad")
        : T`Aplicarlo también a esas ${desalineadas.length} habilidades`}
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
         <span class="mm-tx"><b>${escapeHtml(perfilActual().saludo || tx("Sin nombre"))}</b>
         <span>${escapeHtml(cfg.correo || "")}</span>
         ${chapa}</span>
         ${insignia}
       </button>`
    : `<button class="mm-perfil" onclick="abrirAjustes('cuenta')">
         <span class="mm-ic">${icon("shield", 16)}</span>
         <span class="mm-tx"><b>${tx("Sin cuenta")}</b><span>${tx("Entra para sincronizar tus dispositivos")}</span>
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
  m.innerHTML = ficha + (typeof cuentasMenuHTML === "function" ? cuentasMenuHTML("mm") : "") + `
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
  const mods = (typeof MODULOS !== "undefined" ? MODULOS : []).map(m => [m.id, tx(m.label)]);
  return mods.concat([
    ["settings", tx("Ajustes")],
    ["entrada", tx("Al entrar o cerrar sesión")],
    ["otro", tx("Otra parte")]
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
    '<span class="rep-intro">' + tx("Cuéntame qué pasó y lo reviso. No necesitas saber nada técnico: con lo que recuerdes me basta para encontrarlo.") + '</span>' +
    '<label class="rep-campo">' +
      '<span class="rep-rot">' + tx("¿Dónde pasó?") + '</span>' +
      '<select id="rep-donde">' +
        lugares.map(([id, txt]) =>
          '<option value="' + escapeAttr(id) + '"' + (id === porDefecto ? " selected" : "") + '>' +
          escapeHtml(txt) + '</option>').join("") +
      '</select>' +
    '</label>' +
    '<label class="rep-campo">' +
      '<span class="rep-rot">' + tx("¿Qué hacías justo antes? <i>Opcional</i>") + '</span>' +
      '<input type="text" id="rep-antes" maxlength="80" placeholder="' + escapeAttr(tx("Ej. Abrí un talento desde el mapa")) + '">' +
    '</label>' +
    '<label class="rep-campo">' +
      '<span class="rep-rot">' + tx("¿Qué salió mal?") + '</span>' +
      '<textarea id="rep-que" rows="3" maxlength="' + MOTIVO_MAX + '" placeholder="' + escapeAttr(tx("La pantalla se quedó en blanco y no volvió.")) + '"></textarea>' +
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
  const p = askBase(cuerpo, true, tx("Enviar"), false, false, tx("Cancelar"),
                    { icono: "bicho", titulo: tx("¿Qué salió mal?"), tono: "oro",
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
  if (!que) { toast(tx("No mandé nada: falta contar qué salió mal."), "atencion"); return; }

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
      tx("Ya me llegó y lo voy a revisar. Cosas como ésta son las que hacen que Norata deje de fallar donde falla."),
      false, tx("De nada"), false, false, null,
      { icono: "bicho", titulo: tx("Gracias por avisarme"), tono: "oro", soloOk: true });
  } else {
    /* Ni «error» ni una disculpa larga: se dice qué pasó y qué se puede
       hacer. Lo escrito se ha perdido, y eso también se dice — dejar creer
       que quedó guardado en alguna parte es lo único imperdonable aquí. */
    toast(tx("No pude enviarlo: revisa tu conexión y vuelve a intentarlo."), "atencion");
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
  const cur = userTZ(), det = detectedTZ(), ahora = new Date();

  /* Ordenadas por desfase y no por nombre. Es lo que convierte la lista en una
     escalera: si sabes que vas dos horas por delante de México, bajas dos
     peldaños y ahí está. Por nombre habría que saberse el huso de memoria,
     que es justo lo que uno viene a buscar aquí.

     El huso detectado y el elegido entran siempre, estén o no en la lista, y
     se cuelan en su peldaño como una más. */
  const lista = [...new Set([det, cur, ...TZ_OPTIONS])]
    .map(tz => ({ tz, min: tzDesfaseMin(tz, ahora) }))
    .filter(o => o.min !== null)
    .sort((a, b) => a.min - b.min || a.tz.localeCompare(b.tz));

  sel.innerHTML = lista.map(o =>
    `<option value="${escapeAttr(o.tz)}" ${o.tz === cur ? "selected" : ""}>` +
    `${escapeHtml(tzGMT(o.tz, ahora))} · ${escapeHtml(o.tz.replace(/_/g, " "))}` +
    `${o.tz === det ? " (" + escapeHtml(tx("de este dispositivo")) + ")" : ""}</option>`
  ).join("");
  const now = new Date();
  let hora = "";
  try {
    hora = now.toLocaleTimeString(localeActual(), { timeZone: cur, hour: "2-digit", minute: "2-digit" });
  } catch (e) { hora = "—"; }
  /* El punto doble: en español de México la hora sale «02:27 a.m.» —con punto
     final— y la frase le añadía el suyo, así que se leía «a.m...». En inglés no
     pasa, porque ahí es «2:27 AM» sin punto. En vez de partir la frase en dos
     versiones por idioma, se quita el punto repetido después de componerla:
     vale para cualquier idioma que venga y no toca el diccionario. */
  const pista = T`Ahí son las ${hora}. Tu día en la app: ${formatDate(todayKey())}.`;
  document.getElementById("tz-hint").textContent = pista.replace(/\.\.+/g, ".");
}

function setTimezone(tz) {
  state.settings = state.settings || {};
  state.settings.timezone = tz;
  save();
  renderTimezone();
  toast(tx("Zona horaria actualizada"));
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
        toast(tx("Ese respaldo viene de una versión más nueva de Norata. Actualiza la app aquí antes de importarlo."), "atencion");
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
      toast(tx("El archivo no es un respaldo válido"), "atencion");
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
    tx("Se van tus habilidades, misiones, talentos, proyectos y todo el progreso que llevas. Esta acción no se puede deshacer."),
    false, "Borrar todo", true, false, null,
    { icono: "papelera", titulo: tx("Vas a vaciar la app.") })) return;

  /* En una cuenta de verdad no basta con pulsar dos veces. Quien usa una
     cuenta para experimentar y otra para su vida acaba borrando en la que no
     era, y "¿seguro?" no distingue una de otra: se pulsa igual de rápido en
     las dos. Escribir el correo obliga a mirar CUÁL está abierta. En la
     cuenta marcada como de pruebas no se pide, porque ahí borrar es la
     rutina y la fricción solo estorbaría. */
  if (syncReady() && !esCuentaDePruebas()) {
    const correo = ((sync.cfg || {}).correo || "").trim();
    const escrito = await askText(
      T`Esta es tu cuenta real. Escribe ${correo} para confirmar que quieres borrar todo su progreso.`,
      "", "Borrar todo", correo, 120);
    if (escrito === null) return;
    if (String(escrito).trim().toLowerCase() !== correo.toLowerCase()) {
      toast(tx("El correo no coincide. No borré nada."), "calma");
      return;
    }
  }

  if (!await ask(tx("Última confirmación: se borrará todo. ¿Seguro?"), tx("Sí, borrar"), true, true)) return;
  state = { skills: [], perks: [], projects: [], missions: [], settings: { timezone: userTZ() } };
  save();
  showView("summary");
  toast("Datos borrados", "deshecho");
}

