/* Iconos, modelo, versión del formato, guardado, fechas y el modal */
"use strict";

/* ================= Iconografía propia =================
   Iconos de trazo (24x24) dibujados a mano; nada de emojis. */

const ICONS = {
  brush: '<path d="M9.1 11.9l8.1-8.1a2.85 2.85 0 114 4l-8.1 8.1"/><path d="M7.1 14.9c-1.7 0-3 1.4-3 3 0 1.3-2.5 1.5-2 2 1.1 1.1 2.5 2 4 2 2.2 0 4-1.8 4-4a3 3 0 00-3-3z"/>',
  pen: '<path d="M17 3a2.8 2.8 0 114 4L7.5 20.5 2 22l1.5-5.5z"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>',
  dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11"/>',
  code: '<path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  camera: '<path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>',
  mic: '<path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><path d="M12 19v4"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20 15.3 15.3 0 010-20z"/>',
  /* La S arranca arriba a la DERECHA y termina abajo a la izquierda. Al revés
     dibuja una "Ƨ" espejada, que es lo que tenía antes. */
  coin: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M14.5 9.7c0-1-1.1-1.7-2.5-1.7s-2.5.7-2.5 1.7 1 1.5 2.5 1.8 2.5.8 2.5 1.8-1.1 1.7-2.5 1.7-2.5-.7-2.5-1.7"/>',
  bulb: '<path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7c.6.5 1 1.4 1 2.3h6c0-.9.4-1.8 1-2.3A7 7 0 0012 2z"/>',
  heart: '<path d="M12 20.5s-7.4-4.8-9.4-9.2C1.4 8.4 3.3 5.5 6.4 5.5c2 0 3.3 1.1 4.1 2.5.8-1.4 2.1-2.5 4.1-2.5 3.1 0 5 2.9 3.8 5.8-2 4.4-9.4 9.2-9.4 9.2z"/>',
  flame: '<path d="M12 22c4.4 0 7-2.9 7-6.5 0-4.5-4-6.3-4.5-10C13 7 11 8.5 11 11c-1.5-.6-2-2.3-1.8-4C6.5 8.8 5 11.5 5 15.5 5 19.1 7.6 22 12 22z"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 01-10 0z"/><path d="M7 6H4a3 3 0 003 5M17 6h3a3 3 0 01-3 5"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94z"/>',
  coffee: '<path d="M18 8h1a4 4 0 010 8h-1M2 8h16v6a4 4 0 01-4 4H6a4 4 0 01-4-4z"/><path d="M6 1v3M10 1v3M14 1v3"/>',
  plant: '<path d="M12 22V8M12 8C12 5 9 3 6 3c0 3 2 5.5 6 5M12 12c0-3 3-5 6-5 0 3-2 5.5-6 5"/>',
  cap: '<path d="M22 9L12 4 2 9l10 5z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5"/>',
  chart: '<path d="M4 20v-6M10 20V6M16 20v-9M2 20h20"/>',
  map: '<path d="M1 6v16l7-3 8 3 7-3V3l-7 3-8-3z"/><path d="M8 3v16M16 6v16"/>',
  compass: '<circle cx="12" cy="12" r="10"/><path d="M16 8l-2.5 6L8 16l2.5-6z"/>',
  crown: '<path d="M3 18h18M4 18l-1-9 5 3 4-6 4 6 5-3-1 9z"/>',
  gem: '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20"/>',
  gamepad: '<path d="M6 12h4M8 10v4M15.5 11h.01M18 13.5h.01"/><path d="M17.3 5H6.7a4.7 4.7 0 00-4.6 5.6l1 5A3 3 0 006 18c1 0 1.7-.4 2.3-1l1-1h5.4l1 1c.6.6 1.4 1 2.3 1a3 3 0 002.9-2.4l1-5A4.7 4.7 0 0017.3 5z"/>',
  star: '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 5.9-5.3-3-5.3 3 1.2-5.9L3.4 9.3l6-.7z"/>',
  bolt: '<path d="M13 2L5 14h6l-1 8 8-12h-6l1-8z"/>',
  /* Escudo: lo que no se pierde. Se usa junto a "Habilidad blindada" y está
     en el catálogo porque sirve igual para defensa, seguridad o constancia. */
  shield: '<path d="M12 2.5l8 3.2v5.8c0 4.6-3.3 8.7-8 10-4.7-1.3-8-5.4-8-10V5.7z"/>',
  /* Cara guiñando: el ojo izquierdo es punto y el derecho una curva cerrada.
     Es el icono de Carisma y de todo lo que sea trato con gente. */
  smile: '<circle cx="12" cy="12" r="9.2"/><path d="M8.2 14.8c.9 1.2 2.2 1.9 3.8 1.9s2.9-.7 3.8-1.9"/><path d="M9 9.6v.01"/><path d="M14.1 9.9c.5-.6 1.3-.6 1.8 0"/>',
  /* Caña de pescar: vara en diagonal, carrete, sedal recto desde la punta y
     anzuelo. Dos detalles se decidieron probándolo al tamaño real de la
     tarjeta y no a tamaño grande: el carrete va separado de la vara, porque
     encima se fundía con ella en un bulto, y el anzuelo abre hacia afuera,
     porque cerrándose hacia la vara el conjunto se leía como un triángulo. */
  rod: '<path d="M3 20.6L14.6 6"/><circle cx="7.2" cy="17.6" r="1.5"/><path d="M14.6 6v8.2"/><path d="M14.6 14.2a1.9 1.9 0 003.8 0v-.8"/>',
  /* Gafas de buceo, sin tubo: dos lentes, el puente y la cinta que rodea la
     cabeza. Sin snorkel se distinguen mejor de la careta de esnórquel. */
  goggles: '<circle cx="7.6" cy="13.4" r="3.9"/><circle cx="16.4" cy="13.4" r="3.9"/><path d="M11.5 13.4h1"/><path d="M4.2 11.2C3.1 8.6 6 6.6 12 6.6s8.9 2 7.8 4.6"/>',
  /* Llave: es el icono del tipo Compra, que existe para abrir el paso a lo
     que sigue. El anillo abajo a la izquierda y los dientes sobre la caña,
     perpendiculares a ella, que es lo que la distingue de una paleta. */
  key: '<circle cx="7.6" cy="15.4" r="4.6"/><path d="M10.9 12.1L20.5 2.5"/><path d="M15.2 7.8l2.3 2.3"/><path d="M17.9 5.1l2.3 2.3"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  play: '<path d="M8 5.5l11 6.5-11 6.5z" stroke-linejoin="round"/>',
  alert: '<path d="M12 7v7M12 17.4v.2"/>',
  close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  settings: '<path d="M5 8h14M5 16h14"/><circle cx="9" cy="8" r="2.2"/><circle cx="15" cy="16" r="2.2"/>'
};

const ICON_LIST = ["brush","pen","book","dumbbell","code","music","camera","mic","globe","coin","bulb","heart","flame","trophy","target","flag","wrench","coffee","plant","cap","chart","map","compass","crown","gem","gamepad","star","bolt","shield","smile","rod","goggles","key"];

const EMOJI_TO_ICON = {
  "🎨":"brush","🍳":"coffee","💪":"dumbbell","📚":"book","🎸":"music","💻":"code","🗣️":"mic","🧘":"heart",
  "✍️":"pen","📷":"camera","🎮":"gamepad","🏃":"bolt","🌱":"plant","💰":"coin","🧠":"bulb","❤️":"heart",
  "🎬":"camera","🛠️":"wrench","🌎":"globe","🎤":"mic","♟️":"crown","🏊":"target","🚴":"bolt","☕":"coffee"
};

function icon(name, size) {
  const paths = ICONS[name] || ICONS.star;
  return `<span class="ic"><svg viewBox="0 0 24 24" width="${size || 20}" height="${size || 20}">${paths}</svg></span>`;
}

/* ================= Modelo y persistencia ================= */

/* ================= Talentos: los tres tipos =================
   Antes el tipo no era un campo: se deducía de dos banderas sueltas, `mini`
   e `instant`. Cuatro combinaciones posibles para tres tipos con nombre, y
   un interruptor de "Asegurado al pagar" que se podía marcar dentro de un
   mini-talento y que al guardar se descartaba sin decir nada.

   Ahora es un campo con tres valores, así que la cuarta combinación deja de
   ser escribible. Los tres responden a la misma pregunta —qué hace falta
   para que sea tuyo— y por eso se distinguen sin memorizarlos:

     compra  dinero              y existe para abrir el paso a lo que sigue
     hito    una acción puntual  y se cierra en sí mismo
     meta    tiempo sostenido    y avanza por etapas

   La diferencia entre compra e hito no es la etiqueta: una compra PIDE
   importe porque es una llave que se paga, y un hito NO lo admite porque
   lo que registra es que lo hiciste, no lo que gastaste.

   La figura de cada tipo vive aquí y no repartida por el dibujo: el radio
   se usa en cuatro sitios distintos (dónde nace una línea, dónde muere,
   cuánto mide el nodo y dónde cae su etiqueta) y tenerlo en un solo lugar
   es lo que impide que se desincronicen. */
const TIPOS = {
  compra: {
    nombre: "Compra",
    sub: "Una llave: la pagas y te abre el paso a lo que sigue. Equipo, licencias, cursos.",
    icono: "key",
    pideImporte: true,
    llevaPlan: false,
    /* El circulo pequeno: una compra es la pieza mas menuda del mapa, la
       llave que abre el paso y se resuelve aparte. Una llave literal seria
       mas narrativa pero rompe la retícula de nodos, que necesita figuras
       con un radio predecible en cada rumbo. */
    forma: "circulo",
    glifo: "○",
    radio: 17,
    tecla: "E"
  },
  hito: {
    nombre: "Hito",
    sub: "Una acción puntual que se cierra en sí misma: publicar un dibujo, dar una clase de prueba.",
    icono: "flag",
    pideImporte: false,
    llevaPlan: false,
    // El hexagono: un hito es un logro cerrado, con peso propio en el camino
    forma: "hexagono",
    glifo: "⬡",
    radio: 26,
    tecla: "Q"
  },
  meta: {
    nombre: "Meta",
    sub: "Algo que sostienes en el tiempo. Avanza por etapas y tiene fecha límite.",
    icono: "target",
    pideImporte: false,
    llevaPlan: true,
    forma: "rombo",
    glifo: "◇",
    radio: 23,
    tecla: "W"
  }
};

function tipoDe(p) { return TIPOS[p.tipo] ? p.tipo : "meta"; }
function metaDe(p) { return TIPOS[tipoDe(p)]; }

/* Traduce las banderas viejas y las borra. Se llama al cargar, así que un
   tablero guardado con la versión anterior se convierte solo la primera vez
   que se abre y ya nunca vuelve a pasar por aquí. */
function migrarTipoTalento(p) {
  if (!TIPOS[p.tipo]) {
    p.tipo = p.mini ? "hito" : (p.instant ? "compra" : "meta");
    /* El avance viejo era un porcentaje puesto a ojo y el nuevo se cuenta
       por etapas, así que no hay forma honesta de traducirlo. Pero tampoco
       se tira en silencio: quien tenía una meta al 45% vería el medidor
       caer a cero sin explicación. Queda escrito en su historial. */
    if (p.tipo === "meta" && p.progress > 0 && p.status === "active") {
      p.history = p.history || [];
      p.history.unshift({
        date: todayKey(), at: stamp(),
        event: `Avance anterior: ${Math.round(p.progress)}%. Ahora el avance se cuenta por etapas — añádelas para volver a medirlo.`
      });
    }
  }
  delete p.mini;
  delete p.instant;
  delete p.progress;

  /* Un requisito suelto se convierte en una lista de uno. El modo arranca
     en "todos" porque con un solo requisito las dos lecturas coinciden, y
     así lo que ya existía no cambia de comportamiento al migrar. */
  if (!Array.isArray(p.requiere)) {
    p.requiere = p.requiresId ? [p.requiresId] : [];
  }
  if (p.modo !== "cualquiera") p.modo = "todos";
  delete p.requiresId;
}

/* El proyecto pasó a llamarse Norata, pero las llaves de almacenamiento
   conservan el nombre viejo a propósito: renombrarlas dejaría huérfano el
   progreso de quien ya venía usando la app. El nombre visible y el nombre
   interno no tienen por qué coincidir. */
/* Las colecciones que forman el progreso. Se declaran aquí arriba y no junto
   a lo que las usa porque `load()` las necesita, y `load()` corre en cuanto
   este archivo se ejecuta: declararlas después las deja fuera de alcance en
   ese instante y la app no arranca.
   Añadir una colección nueva al estado obliga a sumarla aquí, o quedará
   fuera de la detección de borrados y de la fusión entre dispositivos. */
const COLECCIONES = ["skills", "missions", "perks", "projects", "cajas", "tableros"];
const DIAS_DE_TUMBA = 120;
let idsVivos = null;

const STORE_KEY = "mainquest-v1";

/* ================= Versión del formato de datos =================
   Hasta aquí `load()` normalizaba lo que llegara y listo. Eso basta mientras
   todos los dispositivos corran la misma versión de la app, que es lo que pasa
   cuando el único usuario eres tú. En cuanto haya cuentas dejará de ser
   cierto: alguien tendrá el teléfono sin actualizar y abrirá datos escritos
   por una versión más nueva. Sin un número que lo delate, la app vieja los
   leería a medias, guardaría encima y borraría lo que no entiende, callando.

   La regla va en un solo sentido: los datos VIEJOS se suben de escalón; los
   datos NUEVOS no se tocan, y mucho menos se escriben. */

const SCHEMA = 2;

/* Cada entrada sube un escalón: `MIGRACIONES[n]` convierte datos de la
   versión n a la n+1. */
const MIGRACIONES = {
  /* v1 -> v2. Las misiones guardaban un NÚMERO por día: "hoy, 3 veces". Un
     número no se puede fusionar. Si el teléfono dice 3 y la computadora dice
     2, no hay forma de saber si son los mismos tres registros vistos dos
     veces —y entonces son 3— o cinco distintos —y entonces son 5—. Con el
     dato que hay, cualquier respuesta es una adivinanza.

     Ahora cada registro es una marca con identidad propia, así que juntar
     dos dispositivos es juntar dos conjuntos: lo que está en los dos se
     cuenta una vez, lo que está en uno solo se suma, y da igual el orden en
     que se fusionen o cuántas veces se repita.

     Las marcas que nacen aquí llevan un id DERIVADO de la fecha y la
     posición, no uno al azar: los dos dispositivos migran los mismos datos
     por su cuenta y tienen que llegar al mismo id, o al sincronizarse se
     duplicaría todo el historial de misiones. */
  1(d) {
    (d.missions || []).forEach(m => {
      if (!m.log || typeof m.log !== "object") { m.log = {}; return; }
      Object.keys(m.log).forEach(k => {
        if (Array.isArray(m.log[k])) return;
        const cuantas = Math.max(0, Math.floor(Number(m.log[k]) || 0));
        if (!cuantas) { delete m.log[k]; return; }
        m.log[k] = Array.from({ length: cuantas }, (_, i) => "v1." + k + "." + i);
      });
    });
    return d;
  }
};

/* Mientras esté puesto, la app mira pero no escribe. Es la única defensa
   real contra estropear datos que no entiende. */
let modoSoloLectura = false;

function migrar(data) {
  // Lo que no lleva número es de antes de que existiera el número: es v1
  const v = Number(data && data.schemaVersion) || 1;

  if (v > SCHEMA) {
    /* Bajar de versión sería inventarse qué tirar. Mejor no tocar nada y
       decirlo. */
    modoSoloLectura = true;
    return data;
  }

  for (let n = v; n < SCHEMA; n++) {
    const paso = MIGRACIONES[n];
    if (paso) data = paso(data) || data;
  }
  data.schemaVersion = SCHEMA;
  return data;
}

const MAX_LEVEL = 10;
const COLORS = ["#5fe0b0","#f5d76e","#ff8a70","#b7a2ea","#6fc3e8","#8fd18a","#f0a5c0","#9aa7b8"];
const FMT_MONEY = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

let state = load();
let currentSkillId = null;
let editingSkillId = null;
let currentPerkId = null;
let editingPerkId = null;
let currentProjectId = null;
let editingProjectId = null;
let activeCategory = "Todas";
let selectedQuickXp = 40;   // la práctica moderada, valor medio de PRACTICAS
let activeMainView = "summary";
let lastDetailPct = 0;
/* El anillo del día en Misiones recuerda dónde estaba para poder viajar
   hasta el valor nuevo en vez de aparecer ya puesto. Empieza en null y no en
   cero para distinguir "todavía no se ha pintado nunca" —donde sí queremos
   el barrido desde cero, que da la sensación de que el día arranca— de "es
   un repintado" —donde se parte de lo que había. */
let lastMisionPct = null;

function load() {
  let data = { skills: [], perks: [], projects: [] };
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) data = JSON.parse(raw);
  } catch (e) { /* datos corruptos: empezar de cero */ }
  /* Antes de mirar nada más: de qué versión vienen. Si son más nuevos que
     esta app, `migrar` enciende el modo solo lectura y a partir de ahí lo que
     sigue se hace en memoria sin llegar nunca al disco. */
  data = migrar(data);
  if (!Array.isArray(data.skills)) data.skills = [];
  if (!Array.isArray(data.perks)) data.perks = [];
  if (!Array.isArray(data.projects)) data.projects = [];
  if (!Array.isArray(data.missions)) data.missions = [];
  if (!Array.isArray(data.cajas)) data.cajas = [];
  /* Los tableros que el usuario se inventa en Misiones. Los tres de siempre
     —hoy, la semana, las terminadas— no viven aquí: no se pueden borrar ni
     renombrar, así que no son datos, son la pantalla. */
  if (!Array.isArray(data.tableros)) data.tableros = [];
  if (!data.borrados || typeof data.borrados !== "object") data.borrados = {};
  if (!data.settings) data.settings = {};
  if (!data.settings.timezone) {
    try { data.settings.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; }
    catch (e) { data.settings.timezone = "UTC"; }
  }
  const tablerosVivos = new Set(data.tableros.map(t => t && t.id));
  data.missions.forEach((m, i) => {
    if (!m.color) m.color = COLORS[i % COLORS.length];
    if (!m.icon) m.icon = ICON_LIST[(i * 6 + 14) % ICON_LIST.length];
    if (!m.cadence) m.cadence = "daily";
    if (!m.log) m.log = {};
    /* Una misión apartada en un tablero que ya no existe —borrado en otro
       dispositivo— se quedaría escondida para siempre: no sale en ninguna
       columna y no hay forma de llegar a ella. Vuelve al ciclo normal. */
    if (m.tablero && m.tablero !== "semana" && !tablerosVivos.has(m.tablero)) {
      delete m.tablero;
      delete m.pospuesta;
    }
  });
  data.projects.forEach((p, i) => {
    if (!p.color) p.color = COLORS[i % COLORS.length];
    if (!p.icon) p.icon = ICON_LIST[(i * 4 + 1) % ICON_LIST.length];
    if (!Array.isArray(p.steps)) p.steps = [];
    if (!p.status) p.status = "active";
  });
  data.skills.forEach((s, i) => {
    if (!s.color) s.color = COLORS[i % COLORS.length];
    if (!s.icon) s.icon = EMOJI_TO_ICON[s.emoji] || ICON_LIST[i % ICON_LIST.length];
    /* El historial se da por hecho en media app (`s.log.unshift`, `for (const
       e of s.log)`), así que una habilidad sin él tumba la pantalla entera.
       No pasa con datos nacidos aquí, pero sí con un respaldo editado a mano
       o venido de otro sitio — y de eso va a haber más, no menos. Y un XP que
       no sea número es peor que un fallo: se propaga como NaN sin avisar. */
    if (!Array.isArray(s.log)) s.log = [];
    if (typeof s.xp !== "number" || !isFinite(s.xp)) s.xp = 0;
  });
  const idsDeTalento = new Set(data.perks.map(p => p.id));
  data.cajas.forEach(c => {
    if (!Array.isArray(c.perkIds)) c.perkIds = [];
    c.perkIds = c.perkIds.filter(id => idsDeTalento.has(id));
    /* Una caja dejó de ser un archivador para ser un GRUPO, y un grupo es un
       nodo más del mapa: tiene nombre propio, sitio propio y conexiones
       propias. Lo que se guarda aquí es lo que el usuario decidió a mano; lo
       que hereda de sus miembros se recalcula en cada dibujo (R5). */
    if (!Array.isArray(c.requiere)) c.requiere = [];
    if (c.modo !== "cualquiera") c.modo = "todos";
    if (!c.pos || typeof c.pos !== "object") c.pos = {};
  });
  data.cajas = data.cajas.filter(c => c.perkIds.length);
  /* Una conexión que apunta a algo que ya no existe deja al nodo bloqueado
     sin causa visible, así que al cargar se barren las que quedaron sueltas
     —de una caja que se vació, de un talento borrado en otro dispositivo—.
     Vale tanto para los talentos como para las cajas: desde que las dos
     cosas se conectan, las dos pueden quedarse colgando. */
  const idsDeCaja = new Set(data.cajas.map(c => c.id));
  const vivo = id => idsDeTalento.has(id) || idsDeCaja.has(id);
  data.cajas.forEach(c => {
    c.requiere = c.requiere.filter(id => vivo(id) && id !== c.id);
  });
  data.perks.forEach((p, i) => {
    if (!p.icon) p.icon = ICON_LIST[(i * 5 + 3) % ICON_LIST.length];
    if (!p.color) p.color = COLORS[(i * 3 + 2) % COLORS.length];
    migrarTipoTalento(p);
    if (!Array.isArray(p.steps)) p.steps = [];
    // Después de migrar: así también se limpia el requisito único de antes
    p.requiere = p.requiere.filter(id => vivo(id) && id !== p.id);
  });
  /* El punto de partida para detectar borrados: lo que hay justo ahora. Se
     fija aquí y no en `save()` porque `load()` también corre al adoptar algo
     de la sincronía, y ahí el conjunto de ids cambia de golpe sin que nadie
     haya borrado nada. */
  idsVivos = idsDeEstado(data);
  return data;
}

/* ================= Guardar sin perder nada =================
   `setItem` lanza de verdad cuando el navegador se queda sin sitio, y sin
   nadie que lo atrape el cambio que el usuario acaba de hacer se pierde sin
   que la app se entere. Por eso TODO lo que escribe el estado pasa por aquí
   y nadie llama a `localStorage.setItem(STORE_KEY, …)` por su cuenta.

   Cuando no cabe, primero se hace sitio soltando las copias de conflicto más
   viejas —son un respaldo, no datos vivos— y solo si aun así no cabe se
   avisa, con la salida a mano en el propio aviso. */

const COPIA_PREFIJO = "mainquest-conflicto-";
const MAX_COPIAS = 5;
let avisoSinEspacio = false;

function guardarLocal(data) {
  /* La guarda que de verdad protege: si los datos de este dispositivo vienen de
     una versión más nueva, no se escribe. Ni al guardar, ni al importar, ni
     al traer algo de la sincronía. */
  if (modoSoloLectura) return false;
  const texto = JSON.stringify(data);
  // Un intento por copia que se pueda tirar, más el primero
  for (let intento = 0; intento <= MAX_COPIAS; intento++) {
    try {
      localStorage.setItem(STORE_KEY, texto);
      /* Se rearma tras un guardado bueno: así una racha de fallos avisa una
         vez, pero un fallo nuevo semanas después vuelve a avisar. */
      avisoSinEspacio = false;
      return true;
    } catch (e) {
      if (!tirarCopiaMasVieja()) break;
    }
  }
  if (!avisoSinEspacio) {
    avisoSinEspacio = true;
    try {
      toast("No pude guardar: este navegador se quedó sin espacio. Exporta un respaldo antes de seguir.",
        "atencion", { label: "Exportar", onclick: "exportData()" });
    } catch (e) { /* ni el aviso pudo pintarse: la red de seguridad lo recoge */ }
  }
  return false;
}

/* Las copias de conflicto llevan el lado y el instante en el propio nombre;
   leerlos es lo que permite ordenarlas, enseñarlas y decidir cuál sobra. */
function listarCopias() {
  const out = [];
  let n = 0;
  try { n = localStorage.length; } catch (e) { return out; }
  for (let i = 0; i < n; i++) {
    const k = localStorage.key(i);
    if (!k || k.indexOf(COPIA_PREFIJO) !== 0) continue;
    const resto = k.slice(COPIA_PREFIJO.length);
    const corte = resto.lastIndexOf("-");
    const ms = Number(resto.slice(corte + 1));
    let datos = null;
    try { datos = JSON.parse(localStorage.getItem(k)); } catch (e) { /* copia ilegible */ }
    out.push({
      key: k,
      lado: corte > 0 ? resto.slice(0, corte) : resto,
      ms: isFinite(ms) && ms > 0 ? ms : 0,
      datos: datos
    });
  }
  return out.sort((a, b) => b.ms - a.ms);
}

function tirarCopiaMasVieja() {
  const copias = listarCopias();
  if (!copias.length) return false;
  try { localStorage.removeItem(copias[copias.length - 1].key); return true; }
  catch (e) { return false; }
}

/* ---- Qué se borró, y cuándo ----
   Una fusión automática que solo une lo que ve resucita lo borrado: el
   teléfono todavía tiene la misión que quitaste en la computadora, y al
   juntarlos vuelve. Para distinguir "esto es nuevo allá" de "esto lo maté
   aquí" hace falta recordar las muertes.

   Se detectan solas comparando con el guardado anterior, en vez de anotarlas
   en cada sitio que borra algo. Hay diez sitios distintos que borran, y el
   siguiente que alguien añada se olvidaría de anotarlo; así no hay nada que
   recordar. */

function idsDeEstado(d) {
  const s = new Set();
  COLECCIONES.forEach(c => (d[c] || []).forEach(x => { if (x && x.id) s.add(x.id); }));
  return s;
}

function anotarBorrados() {
  const ahora = idsDeEstado(state);
  if (idsVivos) {
    state.borrados = state.borrados || {};
    const t = Date.now();
    idsVivos.forEach(id => { if (!ahora.has(id)) state.borrados[id] = t; });
    /* Si algo vuelve a existir —deshacer, importar un respaldo— deja de estar
       muerto. Sin esto, restaurar una copia traería de vuelta los datos pero
       la fusión los volvería a matar en el siguiente encuentro. */
    ahora.forEach(id => { if (state.borrados[id]) delete state.borrados[id]; });

    // Pasados cuatro meses, cualquier dispositivo vivo ya se enteró
    const limite = t - DIAS_DE_TUMBA * 86400000;
    Object.keys(state.borrados).forEach(id => {
      if (state.borrados[id] < limite) delete state.borrados[id];
    });
  }
  idsVivos = ahora;
}

function save() {
  anotarBorrados();
  guardarLocal(state);
  syncTouch();
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ================= El día del usuario =================
   Todo lo que mide días (racha, decaimiento, misiones) se ancla a la zona
   horaria del perfil, no a la del dispositivo: así un viaje no rompe una racha.
   Las fechas se manejan como claves "YYYY-MM-DD" con aritmética propia,
   sin pasar por husos horarios. */

function userTZ() {
  const tz = state && state.settings && state.settings.timezone;
  if (tz) return tz;
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch (e) { return "UTC"; }
}

function tzParts(date, opts) {
  try {
    return new Intl.DateTimeFormat("en-CA", Object.assign({ timeZone: userTZ() }, opts)).formatToParts(date);
  } catch (e) {
    return new Intl.DateTimeFormat("en-CA", opts).formatToParts(date);
  }
}

/* Día actual (o el de una fecha dada) en la zona del perfil. */
function todayKey(date) {
  const p = tzParts(date || new Date(), { year: "numeric", month: "2-digit", day: "2-digit" });
  const get = (t) => (p.find(x => x.type === t) || {}).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/* Hora actual (0-23) en la zona del perfil. */
function hourNow() {
  const p = tzParts(new Date(), { hour: "2-digit", hour12: false });
  const h = parseInt((p.find(x => x.type === "hour") || {}).value, 10);
  return isNaN(h) ? new Date().getHours() : h % 24;
}

/* Aritmética sobre claves de día: independiente de husos horarios. */
function addDaysKey(key, n) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

function daysBetween(keyA, keyB) {
  return Math.round((Date.parse(keyB + "T00:00:00Z") - Date.parse(keyA + "T00:00:00Z")) / 86400000);
}

/* Día de la semana (0 = domingo) de una clave de día. */
function weekdayOfKey(key) {
  return new Date(key + "T00:00:00Z").getUTCDay();
}

/* Fecha legible a partir de una clave, sin corrimiento por huso. */
function keyToDate(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function money(n) { return FMT_MONEY.format(n || 0); }

/* ================= Modal de confirmación =================
   confirm() del navegador se bloquea en visores embebidos,
   así que las confirmaciones usan este modal propio. */

let modalResolve = null;

/* cancelLabel existe para los conflictos de sincronía: ahí ninguna de las dos
   salidas es "cancelar", las dos son una elección real sobre qué datos viven. */
function ask(msg, okLabel, danger, alarm, cancelLabel) {
  return askBase(msg, false, okLabel, danger, alarm, cancelLabel);
}

/* Igual que ask(), pero el cuerpo es HTML. Solo lo usa el conflicto de
   sincronía, donde comparar dos versiones en una tabla se entiende de un
   vistazo y en un párrafo corrido no. Todo lo que venga de los datos del
   usuario se escapa antes de llegar aquí. */
function askHtml(html, okLabel, cancelLabel) {
  return askBase(html, true, okLabel, false, false, cancelLabel);
}

/* Pedir un texto con el mismo modal de siempre. prompt() del navegador se
   bloquea en visores embebidos igual que confirm(), y además llega sin el
   valor de partida escrito, que es justo lo que hace falta al renombrar:
   corregir una palabra, no volver a teclearlo todo. */
/* El tope de 42 es el bueno para nombres (ramas, talentos): más largo no cabe
   en pantalla. Pero se puede subir, y hace falta: para confirmar algo
   escribiendo un correo, 42 se queda corto y el usuario se quedaría sin poder
   completar nunca la confirmación. */
function askText(titulo, valor, okLabel, pista, max) {
  const p = askHtml(
    `<b style="display:block;margin-bottom:12px">${escapeHtml(titulo)}</b>
     <input id="modal-input" type="text" maxlength="${Number(max) || 42}" value="${escapeAttr(valor || "")}">
     ${pista ? `<span class="field-hint" style="display:block;text-align:left">${escapeHtml(pista)}</span>` : ""}`,
    okLabel || "Guardar");
  /* setTimeout y no requestAnimationFrame: el cuadro tiene que quedar listo
     para escribir aunque la pestaña esté en segundo plano, y ahí los cuadros
     de animación no llegan. */
  setTimeout(() => {
    const el = document.getElementById("modal-input");
    if (!el) return;
    el.focus();
    el.select();
    // Enter confirma: en un campo de una sola línea es lo que la mano espera
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); modalDone(true); }
    });
  }, 0);
  return p.then(ok => {
    const el = document.getElementById("modal-input");
    return ok ? (el ? el.value.trim() : "") : null;
  });
}

function askBase(msg, esHtml, okLabel, danger, alarm, cancelLabel) {
  return new Promise(resolve => {
    modalResolve = resolve;
    const cuerpo = document.getElementById("modal-msg");
    if (esHtml) cuerpo.innerHTML = msg; else cuerpo.textContent = msg;
    const ok = document.getElementById("modal-ok");
    ok.textContent = okLabel || "Confirmar";
    ok.className = "btn " + (danger ? "btn-danger-ghost" : "btn-primary");
    document.getElementById("modal-cancel").textContent = cancelLabel || "Cancelar";
    const card = document.querySelector("#modal .modal-card");
    card.classList.remove("alarm");
    if (alarm) { void card.offsetWidth; card.classList.add("alarm"); }
    document.getElementById("modal").classList.add("show");
    if (alarm && userHasTapped && navigator.vibrate) navigator.vibrate([40, 60, 40]);
  });
}

function modalDone(v) {
  document.getElementById("modal").classList.remove("show");
  if (modalResolve) { modalResolve(v); modalResolve = null; }
}

