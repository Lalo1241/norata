/* El nivel de expedición: puntos, curva, rangos y la escalera de desbloqueos */
"use strict";

/* ================= Nada de esto se guarda =================
   Los puntos se CUENTAN cada vez, leyendo lo que ya está en los datos. No hay
   ningún contador en `state` y no debe haberlo.

   El motivo está escrito en `js/10-fusion.js` y vale igual aquí: «El XP no se
   suma a mano: se recalcula contando los movimientos. Así una fusión no puede
   inflarlo aunque se repita mil veces». Un contador guardado se rompe justo
   ahí — dos aparatos que suman 100 cada uno se juntan y se quedan con 100 —,
   y este número decide qué tienes desbloqueado.

   Tres cosas salen gratis por hacerlo así:
     1. Es retroactivo. El día que se encienda, cada cuenta ya tiene su nivel:
        sale de meses de datos que ya existen. Nadie empieza en cero por haber
        llegado antes.
     2. La sincronía no lo puede inflar ni perder: no hay nada que fusionar.
     3. No se puede desalinear, porque no hay dos verdades que comparar.

   El único borde conocido: borrar historial a mano baja los puntos. Se tapará
   con un piso —el nivel más alto alcanzado, guardado aparte— el día que
   alguien se queje. Un máximo SÍ se fusiona sin problema (gana el mayor de los
   dos lados), que es justo lo que un contador no puede hacer. */

/* ================= De qué se hace un punto =================
   Los pesos salen de simular ocho años de uso día por día con tres perfiles
   —ligero, normal, intenso— y no de estimarlos a ojo. Ver el bosquejo. */
const EXP_PUNTOS = {
  /* Los dos primeros días de CADA SEMANA valen mucho; los siguientes, poco.
     No es un adorno: con un valor fijo por día, quien entra dos veces por
     semana tardaba 4,4 años en llegar al último rango y quien entra cinco
     tardaba 1,7 — el sistema medía frecuencia, no constancia. Así son 2,3
     contra 1,3. Y de regalo, deja de tener sentido abrir la app diez segundos
     para no perder el punto del día. */
  diaFuerte: 40,
  diasFuertesPorSemana: 2,
  diaSuelto: 5,
  /* Con tope: doce misiones diarias no valen seis veces más que dos. */
  mision: 2,
  misionesPorDia: 5,
  etapa: 5,
  hito: 20,
  hitoRacha: 25,
  nivelHabilidad: 30,
  talento: 50,
  encargo: 50,
  /* Sin los estrenos, el primer día de alguien de uso ligero da 14 puntos y se
     queda en nivel 0. El primer premio tiene que llegar el primer día o no hay
     segundo. */
  estreno: 15
};

/* ================= La curva =================
   Sin tope, dijo Eduardo, así que la cuenta no se acaba nunca: cada nivel
   cuesta 30 puntos más que el anterior. Es una recta y no una explosión — con
   la curva de las habilidades (×1,5 por nivel) el nivel 40 pediría cuatro
   millones de puntos y dejaría de ser alcanzable.

   Los tres primeros van en rampa aparte para que la primera tarde tenga
   premio. La primera versión iba un 40% más cara y estaba mal: medida, dejaba
   al usuario de uso ligero sin llegar al último rango NUNCA (nivel 27 a los
   siete años). Una meta a la que no se llega desmotiva igual que una regalada. */
const EXP_RAMPA = [15, 35, 60];

function expCosto(nivel) {
  return nivel < EXP_RAMPA.length ? EXP_RAMPA[nivel] : 30 * nivel + 15;
}

/* ================= Los cinco rangos =================
   La cara y el nombre del nivel. No son una colección de trofeos: «Nivel 12»
   no se recuerda y «Explorador» sí, y ese trabajo no necesita a nadie más
   mirando.

   **Son OFICIOS, y esa es la regla que manda al nombrar los rangos de
   cualquier mundo.** La app escribe «Ahora eres X», así que X tiene que ser
   algo que una persona pueda SER. La tanda anterior —Nodo, Enlace, Rama,
   Trama, Red— nombraba las piezas de un grafo: «Ahora eres Trama» no
   significa nada. Y «Rama» además ya estaba ocupada, que el lienzo de
   Talentos dice «Tus ramas» en pantalla.

   **Van cada seis niveles, y eso no es un número redondo: es el ritmo.** Con
   el reparto viejo (1, 4, 10, 18, 28) el primer rango se cerraba en semana y
   media y el cuarto tardaba **11,6 meses** — medido con `EXP_PUNTOS` y la
   curva de aquí, con un perfil de cuatro días por semana. Cada seis da 5
   semanas, 3 meses, 4,8, 6,6 y 8,4: sigue creciendo, pero sin el salto.

   NINGUNO lleva candado, ni siquiera de refilón. Si el rango es la cara del
   nivel y el nivel sube para todos, ponerle candado sería topar el número por
   la puerta de atrás. Lo que pide Pro son los ambientes y las celebraciones. */
const EXP_POR_RANGO = 6;
/* **Cada rango tiene SU color.** No es adorno: la pantalla de Mi expedición
   estaba pintada entera de menta —la insignia, la barra, los cinco rótulos,
   las nueve barritas del desglose— y con un solo color no se distingue lo que
   ya conseguiste de lo que te falta ni de lo que estás mirando. Con cinco, el
   cielo se lee de un vistazo: cada constelación es de su color y sabes cuál
   llevas puesta sin leer una palabra.

   **Y no valen los cinco acentos de la casa**, que era el reparto de la
   primera versión. Dos de ellos ya significan otra cosa, y lo paró Eduardo en
   la primera mirada:

     · el LILA es de Fundador y de nada más — se sacó del amarillo justo para
       que dijera una sola cosa;
     · la LUCIÉRNAGA es «mira esto»: un cobro que falló, un plan que se
       cancela, la trastienda del negocio.

   Un rango pintado con cualquiera de los dos no es variedad de color, es un
   mensaje equivocado. En su sitio van `--rosa` y `--astro`, dos tonos propios
   que no dicen nada más (declarados en `css/estilos.css`, con su pareja de
   día medida contra la tarjeta clara).

   El reparto evita además que dos tonos vecinos caigan juntos en el estante:
   menta (160°), celeste (204°), rosa (330°), astro (sin matiz: es luz) y
   coral (12°). El único par cercano quedaría rosa-coral, y entre los dos va
   el astro.

   Van como NOMBRE de variable y no como hex, que es la regla de la casa
   (ningún color suelto dentro de una regla). Y los cinco existen en los dos
   modos: dentro del cielo —que es una escena y se queda de noche— vuelven a
   sus tonos vivos, y fuera toman su cara de día.

   Un mundo NO los mueve. `rangosVigentes()` pisa `nombre` y `trazo` con los
   suyos y el color se queda: un mundo ya cambia la superficie, el marco y la
   letra, y si además cambiara los cinco acentos habría que medir el contraste
   de cada uno contra cada mundo. Quince mundos por cinco colores son setenta
   y cinco medidas para ganar muy poco.

   `nota` explica de qué va ese tramo del camino, que es lo que la pantalla no
   decía. Está escrita sin nombrar el rango a propósito: un mundo renombra los
   cinco —en Arboleda no eres Andante, eres Semilla— y una nota que dijera «el
   andante camina» se rompería en catorce sitios. Habla del TRAMO, que es lo
   único que ningún mundo mueve. */
const EXP_RANGOS = [
  { id: "andante",    nombre: "Andante",    desde: 1,  icon: "rango-bota",    color: "--mint",
    nota: "El principio. Se cruza en semanas y casi todo lo que haces suma." },
  { id: "rastreador", nombre: "Rastreador", desde: 7,  icon: "rango-huella",  color: "--celeste",
    nota: "Ya hay un rastro que seguir: se nota a qué le dedicas los días." },
  { id: "explorador", nombre: "Explorador", desde: 13, icon: "rango-farol",   color: "--rosa",
    nota: "Aquí se ve lo que sostienes, no lo que empezaste." },
  { id: "cartografo", nombre: "Cartógrafo", desde: 19, icon: "rango-mapa",    color: "--astro",
    nota: "El mapa ya es tuyo: habilidades, talentos y proyectos con historia detrás." },
  { id: "navegante",  nombre: "Navegante",  desde: 25, icon: "rango-brujula", color: "--coral",
    nota: "El último de los cinco. El nivel sigue subiendo después: la cuenta no se acaba." }
];

/* ================= Las celebraciones que abre el nivel =================
   Tres peldaños de `EXP_ESCALERA` prometen celebraciones, y hasta la 0.7.71
   eran promesas: estaban escritas sin `listo` justo para no anunciar lo que no
   existe. Esto es lo que las cumple.

   **Se derivan del nivel, como todo lo demás.** No hay nada guardado, así que
   son retroactivas y la sincronía no las puede perder — el mismo trato que los
   puntos, y por el mismo motivo.

   La de pantalla completa además pide Pro, y por eso se pregunta a `LIMITES` y
   no se escribe aquí un `if` con el nombre de un plan: el día que cambie el
   reparto se cambia en un solo sitio. Al dejar de pagar vuelve la de siempre;
   apagar no es quitar, porque la celebración base sigue saliendo igual. */
function celebracionesAbiertas() {
  const n = typeof nivelExpedicion === "function" ? nivelExpedicion().nivel : 0;
  const pro = typeof planPermite === "function" ? planPermite("celebracion") : false;
  return {
    destello: n >= 3,    // el destello propio al cumplir una misión
    racha: n >= 9,       // la segunda escena de racha: el amanecer
    grande: n >= 15 && pro
  };
}

/* ================= La escalera =================
   Qué se abre y cuándo. El ritmo baja cuando baja el ritmo de subida: algo
   cada uno o dos niveles hasta el 10, y de ahí en adelante cada vez más
   espaciado. Un premio cada nivel a los tres años sería un premio que no
   significa nada.

   `pro` marca lo que pide plan de pago. Y la regla del cobro, cerrada el 30 de
   agosto: **se topan los premios, nunca el número**. El nivel sube de
   principio a fin para todo el mundo; lo que un plan libre no abre se queda a
   la vista con su nivel escrito al lado, que es lo que vende.

   Los ambientes de verdad los define el catálogo `AMBIENTES` cuando exista
   (lo construye otra sesión). Aquí solo se dice EN QUÉ NIVEL cuelga cada
   hueco, para no duplicar el trabajo ni clavar nombres que no son de aquí.

   **`listo` es lo que impide prometer lo que no existe.** La escalera entera
   está escrita aquí porque es el plan y el plan vive mejor en el código que en
   la cabeza de nadie — pero la app solo enseña las filas que ya se pueden
   cumplir. Las celebraciones nuevas no existen todavía: anunciarlas antes de
   tiempo es la misma deuda que ya costó quitar la fila de «Todas las
   apariencias» de la tabla de planes. Los ambientes sí existen ya, y por eso
   los peldaños que salen del catálogo entran marcados (ver más abajo).

   El día que un ambiente esté puesto, se le pone `listo: true` y aparece. Es
   una palabra por fila y no hay nada más que tocar. */
/* **Un rango se anuncia donde se CONSIGUE: al cerrar su constelación.**
   Estaban en 1, 7, 13, 19 y 25 —el primer nivel de cada tramo— y con eso la
   tarjeta del Resumen prometía «Rango Rastreador» para el nivel 7, cuando en
   el 7 lo que empieza es el dibujo. Lo paró Eduardo, y tiene razón: el rango
   se gana al rellenar la constelación, no al estrenarla.

   Los peldaños de celebración caen en los huecos que quedan: encima de un
   cambio de rango serían dos noticias en la misma pantalla. */
const EXP_ESCALERA = [
  { nivel: 3,  tipo: "celebracion", nombre: "Destello propio al cumplir una misión", listo: true },
  { nivel: 6,  tipo: "rango",       nombre: "Rango Andante", listo: true },
  { nivel: 9,  tipo: "celebracion", nombre: "Escena nueva de racha", listo: true },
  { nivel: 12, tipo: "rango",       nombre: "Rango Rastreador", listo: true },
  { nivel: 15, tipo: "celebracion", nombre: "Celebración de pantalla completa", pro: true, listo: true },
  { nivel: 18, tipo: "rango",       nombre: "Rango Explorador", listo: true },
  { nivel: 24, tipo: "rango",       nombre: "Rango Cartógrafo", listo: true },
  { nivel: 30, tipo: "rango",       nombre: "Rango Navegante", listo: true }
];

/* Los ambientes ya NO se escriben aquí, y esta es la línea que lo pedía arriba:
   «los ambientes de verdad los define el catálogo AMBIENTES cuando exista».
   Ya existe, en `js/10i-apariencia.js`.

   Se juntan al vuelo y no en la constante porque este archivo carga ANTES que
   el catálogo: leerlo al declarar la lista daría `undefined`. Y hacía falta —
   la lista escrita a mano decía «un ambiente nuevo en el nivel 8» mientras el
   catálogo abría Adobe en el 7. Dos verdades sobre lo mismo, que es justo lo
   que un peldaño no puede tener. */
function escaleraDeExpedicion() {
  /* Los nombres de los peldaños de RANGO se vuelven a escribir con los del
     mundo puesto, por el mismo motivo por el que se juntan aquí los ambientes:
     arriba están escritos a mano —«Rango Rama»— y con un mundo encima eso era
     una tercera verdad sobre lo mismo. Se veía en la tarjeta del Resumen, que
     con Blueprint puesto anunciaba «A 3 niveles · Rango Rama» debajo de una
     insignia que decía Dibujante.

     Se emparejan por NIVEL y no por posición: es lo único que un mundo no
     mueve, y así la fila sigue cuadrando aunque mañana se meta un peldaño
     nuevo en medio. */
  const propios = typeof rangosVigentes === "function" ? rangosVigentes() : null;
  const filas = EXP_ESCALERA.map(f => {
    if (f.tipo !== "rango" || !propios) return f;
    /* Se empareja por el nivel donde el rango se CONSIGUE —el sexto de su
       tramo— y no por `desde`, que es donde empieza a dibujarse. */
    const r = propios.filter(x => x.desde + EXP_POR_RANGO - 1 === f.nivel)[0];
    return r ? Object.assign({}, f, { nombre: "Rango " + r.nombre }) : f;
  });
  if (typeof AMBIENTES !== "undefined") {
    for (const a of AMBIENTES) {
      if (!a.abre) continue;
      /* `listo` en firme: un ambiente que sale de este catálogo EXISTE —está
         en `css/ambientes.css` y se pone desde Ajustes—. La bandera es lo que
         separa lo que ya se puede cumplir de lo que solo está planeado, y
         estos ya no están planeados. */
      /* El `id` viaja con la fila para que la celebración pueda ponerse el
         ambiente antes de anunciarlo. Buscarlo luego por el nombre sería atar
         una función a un rótulo que se traduce. */
      /* El `icon` viaja con la fila para que la lista de «Lo que abre el
         nivel» pueda pintar el dibujo del ambiente —la planta de Musgo, el
         sol de Adobe— en vez de cinco brochas iguales. El catálogo ya lo
         tenía; solo no llegaba hasta aquí. */
      filas.push({ nivel: a.abre, id: a.id, tipo: "ambiente", nombre: a.nombre, icon: a.icon, pro: !!a.pro, listo: true });
    }
  }
  return filas.sort((x, y) => x.nivel - y.nivel);
}

/* ================= Contar =================
   Cada fuente por separado, para poder mirarlas una a una cuando un número no
   cuadre. `expDesglose()` devuelve el reparto y `puntosExpedicion()` la suma. */

/* El lunes no: la semana de Norata empieza en domingo, igual que la tira de la
   racha (ver `streakInfo`). Dos formas de contar la semana en la misma app se
   notan en cuanto alguien compara. */
function expSemanaDe(clave) {
  return addDaysKey(clave, -weekdayOfKey(clave));
}

/* Los días, con los dos primeros de cada semana pagados aparte. */
function expPuntosDias() {
  const dias = [...activityDayCounts().keys()].sort();
  const porSemana = new Map();
  let total = 0;
  for (const d of dias) {
    const s = expSemanaDe(d);
    const n = (porSemana.get(s) || 0) + 1;
    porSemana.set(s, n);
    total += n <= EXP_PUNTOS.diasFuertesPorSemana ? EXP_PUNTOS.diaFuerte : EXP_PUNTOS.diaSuelto;
  }
  return total;
}

/* Cuántas misiones distintas se marcaron cada día, con tope. Cuenta la marca y
   no el cumplimiento entero: una misión de tres veces al día ya paga por el
   día en que la tocaste, y pagar por cada marca premiaría el volumen. */
function expPuntosMisiones() {
  const porDia = new Map();
  for (const ms of state.missions) {
    for (const k of Object.keys(ms.log || {})) {
      if (missionCount(ms, k) > 0) porDia.set(k, (porDia.get(k) || 0) + 1);
    }
  }
  let total = 0;
  porDia.forEach(n => { total += Math.min(n, EXP_PUNTOS.misionesPorDia) * EXP_PUNTOS.mision; });
  return total;
}

/* El nivel MÁS ALTO que tuvo una habilidad, no el de ahora. El decaimiento no
   quita el punto: lo aprendido pasó, y el nivel de expedición cuenta lo que
   recorriste, no lo que mantienes —para castigar el abandono ya está la propia
   habilidad, que baja—.

   Se reconstruye del historial porque ahí está todo: el XP de hoy es la suma
   de los movimientos (esa es la invariante de la fusión), así que el máximo de
   la suma parcial es el máximo que se alcanzó. */
function expNivelMaximo(s) {
  const orden = [...(s.log || [])].sort((a, b) =>
    String(a.at || a.date || "").localeCompare(String(b.at || b.date || "")));
  let acc = 0, max = 0;
  for (const e of orden) {
    acc += Number(e.xp) || 0;
    if (acc > max) max = acc;
  }
  /* El XP de ahora como suelo: un historial recortado a mano no puede hacer
     que una habilidad valga menos de lo que se le ve. */
  return levelInfo(Math.max(max, Number(s.xp) || 0)).level;
}

function expDesglose() {
  /* La trastienda puede pedir un nivel alto para MIRAR lo que abre la escalera
     —los ambientes del 12 y del 20— sin tener que ganárselo, que son años. Se
     engancha aquí y no en `puntosExpedicion()` a propósito: todo lo demás sale
     de este reparto, así que el nivel, el rango, la insignia, la barra y los
     candados quedan de acuerdo entre ellos, y la pantalla del recorrido enseña
     una sola fuente en vez de un total que no cuadra con sus renglones.

     Sigue sin guardarse nada: los puntos se cuentan, nunca se escriben (la
     regla de `js/10-fusion.js`), y esto es una cuenta más. */
  if (typeof puntosDeExpedicionSimulados === "function") {
    const fingidos = puntosDeExpedicionSimulados();
    if (typeof fingidos === "number") return { pruebas: fingidos };
  }

  const perks = state.perks || [];
  const proyectos = state.projects || [];

  const etapas =
    perks.reduce((n, p) => n + (p.steps || []).filter(x => x.done).length, 0) +
    proyectos.reduce((n, p) => n + (p.steps || []).filter(x => x.done).length, 0);

  const hitos = perks.filter(p => p.status === "completed" && tipoDe(p) === "hito").length;
  const talentos = perks.filter(p => p.status === "completed" && tipoDe(p) !== "hito").length;
  const encargos = proyectos.filter(p => p.status === "done").length;

  const niveles = state.skills.reduce((n, s) => n + expNivelMaximo(s), 0);

  /* Los hitos de racha que YA se cruzaron, contra la mejor racha histórica: no
     se pierden al romperse la racha, igual que no se deshace la fiesta que ya
     se hizo. */
  const mejor = (typeof streakInfo === "function" ? streakInfo().best : 0) || 0;
  const rachas = HITOS_RACHA.filter(h => h <= mejor).length;

  const estrenos =
    (state.skills.length ? 1 : 0) + (state.missions.length ? 1 : 0) +
    (perks.length ? 1 : 0) + (proyectos.length ? 1 : 0);

  return {
    dias:      expPuntosDias(),
    misiones:  expPuntosMisiones(),
    etapas:    etapas * EXP_PUNTOS.etapa,
    hitos:     hitos * EXP_PUNTOS.hito,
    talentos:  talentos * EXP_PUNTOS.talento,
    encargos:  encargos * EXP_PUNTOS.encargo,
    niveles:   niveles * EXP_PUNTOS.nivelHabilidad,
    rachas:    rachas * EXP_PUNTOS.hitoRacha,
    estrenos:  estrenos * EXP_PUNTOS.estreno
  };
}

function puntosExpedicion() {
  const d = expDesglose();
  let t = 0;
  for (const k in d) t += d[k];
  return t;
}

/* ================= El nivel =================
   Sin tope, así que el bucle necesita un freno por si algún día un dato
   corrupto trae un número imposible: 900 niveles son ~12 millones de puntos,
   muy por encima de cualquier vida de uso. */
function nivelExpedicion(puntos) {
  let restan = typeof puntos === "number" ? puntos : puntosExpedicion();
  const total = restan;
  let nivel = 0;
  while (restan >= expCosto(nivel) && nivel < 900) {
    restan -= expCosto(nivel);
    nivel++;
  }
  const cuesta = expCosto(nivel);
  return {
    nivel, puntos: total,
    dentro: restan,
    cuesta,
    faltan: cuesta - restan,
    pct: Math.round((restan / cuesta) * 100)
  };
}

/* El rango que te toca: el último cuyo nivel de entrada ya pasaste. Antes del
   nivel 1 no hay rango, y no se inventa uno: la barra tampoco se enseña. */
/* ---- Los rangos que tocan HOY ----
   Los cinco de arriba son los de la casa y no se tocan. Pero un mundo puede
   traer los suyos, y esa es la decisión de Eduardo del 30 de agosto: un mundo
   no solo cambia de qué está hecha la app — **te renombra el camino**. En
   Arboleda no eres Nodo, eres Semilla; y el que llega arriba no es Red, es
   Norte.

   Es lo que separa una piel de un mundo, y es lo que se vende: un recolor te
   cambia la luz, un mundo te cambia hasta cómo se llama lo que llevas
   recorrido.

   Cambian el NOMBRE y el DIBUJO. **Los niveles de entrada no**, y eso es a
   propósito: si cada mundo moviera los peldaños, dos personas con el mismo
   nivel estarían en sitios distintos de la escalera y la escalera dejaría de
   significar nada. Una sola escalera, muchos vocabularios. */
function rangosVigentes() {
  if (typeof rangosDeApariencia === "function") {
    const propios = rangosDeApariencia();
    if (propios && propios.length === EXP_RANGOS.length) {
      return EXP_RANGOS.map((r, i) => Object.assign({}, r, propios[i]));
    }
  }
  return EXP_RANGOS;
}

function rangoExpedicion(nivel) {
  const n = typeof nivel === "number" ? nivel : nivelExpedicion().nivel;
  let cual = null;
  for (const r of rangosVigentes()) if (n >= r.desde) cual = r;
  return cual;
}

/* Lo que viene, con su nivel escrito. Es la pieza que hace que la barra sirva:
   un premio sorpresa no mueve a nadie y uno que se ve venir, sí. Devuelve
   también los que piden Pro —a la vista y con candado, nunca escondidos—. */
function proximoDesbloqueo(nivel) {
  const n = typeof nivel === "number" ? nivel : nivelExpedicion().nivel;
  return escaleraDeExpedicion().find(x => x.nivel > n && x.listo) || null;
}

/* ================= La insignia, dibujada =================
   Un círculo con el rango dentro y el aro de lo que llevas del nivel
   alrededor. Es SU PROPIO círculo y no cuelga del avatar, y esa diferencia la
   puso Eduardo con el argumento bueno: el perímetro de la cara tiene que
   quedar libre para lo cosmético —hoy lo ocupa el anillo lila de Fundador,
   mañana un marco que alguien compre—, así que el aro que informa rodea la
   insignia. **Cada aro pertenece a su propio objeto** y no se pelean nunca.

   Y de paso resuelve el tamaño, que fue lo que lo decidió: colgando del avatar
   la insignia solo puede medir 20 px, y el aro deja el dibujo en 11 —por
   debajo de los 13 que es el suelo de la iconografía de la app—. Como círculo
   propio mide 30 y el dibujo respira a 18.

   Devuelve "" antes del primer nivel: sin nada que enseñar no se enseña un
   aro vacío, que se leería como algo roto. */
/* **La insignia va del color de tu RANGO, en todas partes**: el aro del
   progreso y el dibujo de dentro. Lo pidió Eduardo al ver que la ruedita del
   menú de la cuenta seguía en menta mientras Mi expedición ya iba por
   colores, y tiene razón — es la misma insignia, y donde más paga es
   justamente ahí: en el Resumen y en la fila de la cuenta es lo ÚNICO que se
   ve del recorrido, así que un color propio la convierte en algo que se
   reconoce de lejos.

   Hubo una versión con esto detrás de un interruptor, encendido solo dentro
   del cielo. El motivo era de contraste y **ya no existe**: entonces uno de
   los cinco rangos era luciérnaga, que de día tiene que hundirse hasta el
   dorado apagado que Eduardo rechazó por leerse como una alerta interna. Al
   sacar la luciérnaga y el lila del reparto —ver `EXP_RANGOS`— la objeción se
   fue con ellos.

   Medido, porque un aro de dos píxeles es un TRAZO y no texto (umbral 3, no
   4,5): sobre la tarjeta clara los cinco van de 5,44 a 7,55, y sobre la de
   noche de 6,71 a 11,68. Pasan los dos umbrales con holgura en los dos modos.

   Con `--mint` de reserva, porque un mundo puede traer sus cinco rangos y no
   está obligado a traer colores. */
function insigniaExpedicionHTML(diam) {
  const d = diam || 30;
  const info = nivelExpedicion();
  if (info.nivel < 1) return "";
  const r = rangoExpedicion(info.nivel);
  if (!r) return "";

  /* El grosor crece con el diámetro pero no linealmente: a 30 px un aro de 2
     se lee, y a 48 uno de 2 desaparece. */
  const grosor = d >= 40 ? 3 : 2;
  const dibujo = Math.round(d * 0.6);
  const col = "var(" + (r.color || "--mint") + ")";

  return '<span class="exp-insignia" style="width:' + d + 'px;height:' + d + 'px;color:' + col + '"' +
    ' title="Nivel ' + info.nivel + ' · ' + r.nombre + ' · ' + info.pct + '% del nivel"' +
    ' aria-label="Nivel ' + info.nivel + ', rango ' + r.nombre + '">' +
    ring(d, grosor, [{ pct: info.pct / 100, color: col }], "var(--carril)") +
    /* Un rango de la casa nombra un icono de ICONS; uno de mundo trae su
       trazo entero, porque sus dibujos viajan con el mundo y no con la app —
       meter en ICONS los cinco rangos de quince mundos serían setenta y cinco
       dibujos que baja todo el mundo para no usar ninguno. */
    '<span class="exp-emb">' + (r.trazo ? svgDeTrazo(r.trazo, dibujo) : icon(r.icon, dibujo)) + '</span>' +
    '</span>';
}

/* ================= La colección =================
   El inventario del recorrido, no una vitrina de trofeos. La diferencia la
   marcó Eduardo y es la que hace que tenga sentido sin más gente mirando: lo
   que guarda no son medallas, son cosas que se usan —los ambientes se ponen—,
   y la pantalla es donde eliges cuál llevas y ves cuál viene.

   Hoy enseña lo que EXISTE: tu nivel, los cinco rangos y de dónde salen tus
   puntos. Nada se anuncia en gris antes de existir: casillas vacías de lo que
   no hay son una lista de lo que te falta, y eso ya se descartó.

   Los ambientes NO se eligen aquí. Lo decidió Eduardo al cerrar el choque de
   las dos sesiones: la pantalla de elegir es «Mi apariencia», en Ajustes,
   junto a las otras cosas tuyas. Esta cuenta el recorrido; aquella lo viste.
   Lo único que las une es el botón de abajo, que es lo que evita tener que
   buscar dónde se recoge lo que acabas de ganar. */
const EXP_ETIQUETAS = {
  dias:     "Días con actividad",
  misiones: "Misiones cumplidas",
  niveles:  "Niveles de habilidad",
  talentos: "Talentos logrados",
  encargos: "Encargos terminados",
  etapas:   "Etapas hechas",
  hitos:    "Hitos conseguidos",
  rachas:   "Hitos de racha",
  estrenos: "Estrenos",
  pruebas:  "Nivel de pruebas"
};

/* Cómo se gana cada una, en una línea. Faltaba, y era lo que hacía que la
   lista pareciera un recibo: nueve renglones con nueve cifras y ninguna
   explicación de por qué «Días con actividad» vale más que todo lo demás
   junto. Las reglas ya estaban decididas y medidas arriba en `EXP_PUNTOS`;
   lo único que no existía era decírselas a quien las está viviendo. */
const EXP_PISTAS = {
  dias:     "Los dos primeros días de cada semana valen mucho más que los siguientes. Premia volver, no marcar.",
  misiones: "Hasta cinco misiones distintas por día. Doce no valen seis veces más que dos.",
  niveles:  "Cuenta el nivel más alto que alcanzó cada habilidad, aunque hoy haya bajado.",
  talentos: "Cada talento que cierras.",
  encargos: "Cada proyecto que das por terminado.",
  etapas:   "Cada etapa marcada, en talentos y en proyectos.",
  hitos:    "Los hitos que cierras en el árbol de talentos.",
  rachas:   "Los días redondos de racha que ya cruzaste. No se pierden al romperse.",
  estrenos: "Por estrenar cada módulo: tu primera habilidad, tu primera misión, tu primer talento, tu primer proyecto.",
  pruebas:  "Un nivel fingido desde la trastienda. No es tu recorrido real."
};

/* Un color por fuente, del mismo juego de cinco de los rangos —y por el mismo
   motivo por el que ahí no hay lila ni luciérnaga—. Nueve barritas del mismo
   verde no son nueve cosas, son una mancha. */
const EXP_COLOR_FUENTE = {
  dias: "--mint", misiones: "--celeste", niveles: "--astro", talentos: "--rosa",
  encargos: "--coral", etapas: "--celeste", hitos: "--rosa", rachas: "--coral",
  estrenos: "--mint", pruebas: "--astro"
};

/* ================= El cielo =================
   El altar del recorrido, y la pieza que faltaba. La app ya dibujaba estas
   cinco constelaciones —la bota, la huella, el farol, el mapa y la brújula—
   pero solo durante los dos segundos de la celebración de subir de nivel. Se
   veían una vez y no volvían nunca.

   Aquí se quedan. La composición es la de la celebración, y eso no es pereza:
   es lo que hace que las dos pantallas sean el mismo sitio. Allí, la figura
   que estás cerrando ocupa el centro y las ya cerradas se quedan «en pequeño
   arriba: esa fila es la colección». Aquí la colección se mira, así que esa
   fila es la razón de entrar.

   La primera versión ponía las cinco en hilera y del mismo tamaño. Medida y
   mirada, no servía: a esa escala una constelación son cuatro rayas de medio
   píxel, y cinco de ésas en fila es un cielo sucio, no un altar. Caben 320
   unidades de ancho y no más, así que o hay una grande o hay cinco pequeñas;
   y la que importa es la que estás cerrando.

   Tres estados:

     · **cerrada**   — el rango ya lo pasaste entero: la figura completa, a
                       todo color y titilando. Es un logro, y se ve como uno.
     · **viva**      — el rango que llevas puesto, en grande y con resplandor.
                       Las estrellas que faltan quedan como aros vacíos: se
                       CUENTAN, y eso es lo que convierte «te faltan 235
                       puntos» en «te falta media figura».
     · **por venir** — no se dibuja. Un hueco gris de algo que no has tocado
                       es una lista de lo que te falta, y eso ya se descartó.

   Se sabe cerrada por `desde + EXP_POR_RANGO` y no por `ncelIndiceRango()`,
   que es lo que usa la celebración: aquella cuenta niveles sin techo y en el
   31 devolvía otra vez la quinta figura recién empezada, cuando en realidad ya
   está cerrada. En una fiesta de dos segundos no se nota; en una pantalla que
   se queda, sí.

   Cuántas estrellas van encendidas lo decide `ncelHasta()` y no una cuenta de
   aquí: desde la 0.7.65 cada figura tiene las que pide el dibujo —doce la
   bota, catorce la huella— y repartir el progreso es trabajo suyo. Dos
   verdades sobre lo mismo es justo lo que no puede haber. */
/* Cuánto cielo se siembra por fuera del encuadre, por los cuatro lados. Tiene
   que ser mayor que lo que el paralaje llega a mover el polvo (16 px de 320,
   o sea 16 unidades) o se vería el borde del sembrado al mover el cursor. */
const EXP_MARGEN = 44;
const EXP_ALTO_CON_ALTAR = 190;
const EXP_ALTO_VITRINA = 150;
const EXP_ALTO_VACIO = 118;
const EXP_ALTAR = { esc: 1.2, cx: 160, cy: 110, sw: 1.3, r: 2.6 };
/* El estante mientras hay algo debajo: pequeño y arriba, como en la
   celebración. */
const EXP_ESTANTE = { esc: 0.3, y: 28, paso: 44, sw: 0.66, r: 1.15 };
/* Y la vitrina: lo mismo cuando ya no queda nada que cerrar. Entonces la
   colección ES la pantalla, así que ocupa el centro y crece. */
const EXP_VITRINA = { esc: 0.46, y: 70, paso: 60, sw: 0.9, r: 1.7 };

/* DÓNDE está la figura: en el altar o en el estante. Se pasa al estante en
   cuanto empieza la siguiente, no antes: el nivel que la cierra todavía es
   suyo y es cuando más merece estar en grande. */
function expEstadoRango(r, nivel) {
  if (nivel >= r.desde + EXP_POR_RANGO) return "cerrada";
  if (nivel >= r.desde) return "viva";
  return "porvenir";
}

/* Y si ya lo TIENES, que es otra pregunta. **Un rango se consigue al cerrar su
   constelación, no al estrenarla** —lo paró Eduardo en la 0.7.67— así que se
   gana en el sexto nivel de su tramo: 6, 12, 18, 24 y 30.

   Son dos predicados y no uno a propósito. En el nivel que lo cierra las dos
   respuestas son distintas y las dos son ciertas: la figura sigue en el altar
   porque es la que estás mirando, y el rango ya es tuyo porque acabas de
   rellenarla. Con un solo predicado, o la pantalla decía «Aquí estás» el día
   que la celebración cantaba «conseguido», o la figura se iba al estante en
   cuanto la terminas y el altar se quedaba vacío justo en su mejor momento. */
function expConseguido(r, nivel) {
  return nivel >= r.desde + EXP_POR_RANGO - 1;
}

/* El nivel en el que se consigue, que es el que hay que escribirle a un rango
   que aún no tienes. Antes decía `desde` —dónde EMPIEZA a dibujarse— y eso
   dejaba dos números para lo mismo: la escalera anunciaba «Rango Rastreador»
   en el 12 y esta lista ponía «Nivel 7» debajo del mismo nombre. */
function expNivelDeRango(r) {
  return r.desde + EXP_POR_RANGO - 1;
}

/* En cuál de los seis niveles del rango estás. */
function expEscalonDe(r, nivel) {
  return Math.max(0, Math.min(EXP_POR_RANGO, nivel - r.desde + 1));
}

/* Una figura, con `hasta` estrellas puestas. Las que faltan salen como aros
   vacíos, que es lo que deja ver cuánto le queda al dibujo. */
function expFiguraHTML(fig, hasta, cx, cy, m, huecas) {
  const X = q => (cx + (q[0] - 50) * m.esc).toFixed(1);
  const Y = q => (cy + (q[1] - 50) * m.esc).toFixed(1);
  let s = "";
  for (const [a, b] of fig.l) {
    if (Math.max(a, b) + 1 > hasta) continue;
    s += '<line class="exp-hilo" x1="' + X(fig.p[a]) + '" y1="' + Y(fig.p[a]) +
      '" x2="' + X(fig.p[b]) + '" y2="' + Y(fig.p[b]) +
      '" stroke-width="' + m.sw + '"/>';
  }
  for (let k = 0; k < fig.p.length; k++) {
    if (k >= hasta && !huecas) continue;
    const puesta = k < hasta;
    /* El retardo se sortea por estrella para que una figura no parpadee
       entera a la vez, que se leería como un fallo de dibujo y no como un
       cielo. */
    const tarde = ' style="animation-delay:' + (Math.random() * 3.6).toFixed(2) + 's"';
    s += '<circle class="exp-astro ' + (puesta ? "puesta" : "hueca") + '" cx="' + X(fig.p[k]) +
      '" cy="' + Y(fig.p[k]) + '" r="' + (puesta ? m.r : m.r * 0.78).toFixed(2) + '"' +
      (puesta ? tarde : ' stroke-width="' + (m.sw * 0.8).toFixed(2) + '"') + '/>';
  }
  /* Una zona de toque del tamaño de la figura entera. Sin ella hay que acertarle
     a una línea de un píxel para que el cielo reaccione, y entonces no
     reacciona nunca. */
  const R = 52 * m.esc;
  s += '<rect class="exp-toque" x="' + (cx - R).toFixed(1) + '" y="' + (cy - R).toFixed(1) +
    '" width="' + (R * 2).toFixed(1) + '" height="' + (R * 2).toFixed(1) + '"/>';
  return s;
}

/* ---- Las estrellas fugaces ----
   Lo pidió Eduardo: «que el cielo se mueva y se anime ligeramente para darle
   más vida, como leves estrellas fugaces en el fondo». La palabra que manda es
   LEVES — el archivo de la celebración ya dice por qué se quitaron los rayos
   giratorios de la 0.7.48: «algo que gira sin final es decoración de fondo, no
   un acontecimiento».

   Así que una fugaz no es una animación que corre todo el rato: cruza en 1,7 s
   y luego el elemento pasa once segundos quieto y a opacidad cero. Con tres
   sembradas y sus retardos escalonados, pasa una cada cuatro segundos y medio
   y nunca dos a la vez.

   **Son DOS piezas y no una raya**, y ésa fue la corrección de Eduardo con una
   captura delante: «un punto destelleante y un degradado en la cola para
   simular la animación de la luz, y que se atenúe todo para desaparecer».

     · la CABEZA es un disco pequeño con su halo — es lo que se ve, y lo que
       hace que parezca luz y no una línea pintada;
     · la COLA es un triángulo, ancho en la cabeza y en punta al final, con un
       degradado que se apaga hacia atrás. Un triángulo y no una línea porque
       una línea tiene grosor constante: se estrecha o no se estrecha, y una
       estela que no se estrecha es un palo.

   El degradado se declara UNA vez en `<defs>` y lo usan las tres. Va en
   `userSpaceOnUse` y no en el sistema de la caja: la cola es un triángulo de
   19 de largo y 1,7 de alto, y en `objectBoundingBox` un degradado horizontal
   sobre una caja casi plana sale impredecible. Como las tres colas viven en
   las mismas coordenadas locales —de (-19,0) a (0,0)— con una definición basta.

   El giro y el sitio van en un `transform` de ATRIBUTO en el `<g>` de fuera y
   la animación en un `<g>` de dentro. Si fueran el mismo elemento, el
   `transform` del CSS pisaría al del atributo y las tres saldrían del mismo
   sitio: una propiedad no se puede escribir dos veces. */
const EXP_COLA = 19;

function expFugacesHTML(alto) {
  let s = "";
  for (let i = 0; i < 3; i++) {
    const x = 24 + Math.random() * 250;
    const y = 8 + Math.random() * (alto * 0.45);
    const ang = 18 + Math.random() * 22;          // siempre hacia abajo y a la derecha
    const esc = 0.7 + Math.random() * 0.6;
    const espera = (i * 4.4 + Math.random() * 1.6).toFixed(1);
    s += '<g transform="translate(' + x.toFixed(1) + ',' + y.toFixed(1) +
      ') rotate(' + ang.toFixed(0) + ') scale(' + esc.toFixed(2) + ')">' +
      '<g class="exp-fugaz" style="animation-delay:' + espera + 's">' +
      '<path class="exp-cola" d="M-' + EXP_COLA + ' 0 L0 -0.9 L0 0.9 Z"/>' +
      '<circle class="exp-cabeza" cx="0" cy="0" r="1.15"/>' +
      '</g></g>';
  }
  return s;
}

/* El degradado de la cola, declarado una vez para las tres. */
function expDefsHTML() {
  return '<defs><linearGradient id="exp-cola-luz" gradientUnits="userSpaceOnUse"' +
    ' x1="-' + EXP_COLA + '" y1="0" x2="0" y2="0">' +
    '<stop offset="0" stop-color="#eaf4ff" stop-opacity="0"/>' +
    '<stop offset="0.6" stop-color="#eaf4ff" stop-opacity="0.28"/>' +
    '<stop offset="1" stop-color="#eaf4ff" stop-opacity="0.9"/>' +
    '</linearGradient></defs>';
}

function expCieloHTML(nivel) {
  const rangos = rangosVigentes();

  /* El altar: la que estás cerrando ahora, en grande. Puede no haber ninguna,
     y son los dos extremos de la vida de una cuenta: antes del nivel 1 no has
     empezado, y pasado el 30 están las cinco cerradas. En los dos casos el
     cielo se queda solo con lo que hay, sin inventarse un hueco.

     De ahí los tres altos: con un alto fijo, esos dos extremos dejaban media
     tarjeta de negro debajo del estante. */
  const viva = rangos.filter(r => expEstadoRango(r, nivel) === "viva")[0];
  const cerradas = rangos.filter(r => expEstadoRango(r, nivel) === "cerrada");
  const m = viva ? EXP_ESTANTE : EXP_VITRINA;
  const alto = viva ? EXP_ALTO_CON_ALTAR
    : cerradas.length ? EXP_ALTO_VITRINA : EXP_ALTO_VACIO;

  /* El polvo del fondo: aleatorio y distinto cada vez, igual que en la
     celebración. No es información, es profundidad — las constelaciones sí son
     siempre las mismas.

     **Se siembra MÁS ALLÁ del encuadre y se recorta.** Lo pidió Eduardo: «que
     el cielo sea más amplio hacia los bordes y esté enmascarado dentro de su
     espacio, para que se vean más estrellas que no se ven cuando uno mueve el
     cursor». Sembrado justo en el encuadre, el paralaje arrastraba el borde a
     la vista y por ese lado no había nada: el cielo se acababa, que es lo
     contrario de la profundidad que se buscaba. Con `EXP_MARGEN` de más por
     los cuatro lados hay reserva de sobra para los dieciséis píxeles que se
     mueve, y lo que sobra lo recorta el `overflow` del SVG.

     El suelo del número existe porque el cielo más corto es el de quien no ha
     empezado, y ése es justo el que no puede parecer roto: sin estrellas se
     lee como que no cargó. */
  let fondo = "";
  const anchoP = 320 + EXP_MARGEN * 2, altoP = alto + EXP_MARGEN * 2;
  const cuantas = Math.max(112, Math.round(anchoP * altoP / 780));
  for (let i = 0; i < cuantas; i++) {
    fondo += '<circle cx="' + (Math.random() * anchoP - EXP_MARGEN).toFixed(1) +
      '" cy="' + (Math.random() * altoP - EXP_MARGEN).toFixed(1) +
      '" r="' + (0.35 + Math.random() * 0.85).toFixed(2) +
      '" opacity="' + (0.12 + Math.random() * 0.3).toFixed(2) + '"/>';
  }

  /* Las que ya cerraste, centradas. Es la colección, y es lo único de esta
     pantalla que solo se consigue con años. */
  const x0 = 160 - (cerradas.length - 1) * m.paso / 2;
  let estante = "";
  cerradas.forEach((r, i) => {
    estante += '<g class="exp-const cerrada" style="--c:var(' + r.color + ')">' +
      '<title>' + escapeHtml(r.nombre) + ' · conseguido</title>' +
      expFiguraHTML(NCEL_FIGURAS[rangos.indexOf(r)], NCEL_FIGURAS[rangos.indexOf(r)].p.length,
        x0 + i * m.paso, m.y, m, false) + '</g>';
  });

  let altar = "";
  if (viva) {
    const fig = NCEL_FIGURAS[rangos.indexOf(viva)];
    const k = expEscalonDe(viva, nivel);
    altar = '<g class="exp-const viva" style="--c:var(' + viva.color + ')">' +
      '<title>' + escapeHtml(viva.nombre) + (k >= EXP_POR_RANGO ? ' · conseguido' : ' · nivel ' + k + ' de ' + EXP_POR_RANGO) + '</title>' +
      expFiguraHTML(fig, ncelHasta(fig, k), EXP_ALTAR.cx, EXP_ALTAR.cy, EXP_ALTAR, true) + '</g>';
  }

  return '<svg class="exp-sky" viewBox="0 0 320 ' + alto + '" role="img"' +
    ' aria-label="Tu cielo: ' + cerradas.length + ' de 5 constelaciones cerradas">' +
    expDefsHTML() +
    '<g class="exp-polvo">' + fondo + '</g>' +
    '<g class="exp-fugaces">' + expFugacesHTML(alto) + '</g>' +
    estante + altar + '</svg>';
}

/* ---- El cielo reacciona al puntero ----
   Lo pidió Eduardo. Es paralaje y no un efecto de hover: las tres capas se
   mueven distinto —el polvo poco y al favor, las constelaciones más y en
   contra— y de ahí sale la sensación de profundidad. La cuenta se hace aquí y
   el movimiento lo pinta el CSS leyendo `--mx` y `--my`.

   Dos cosas que no son adorno:

   1. **Solo donde hay puntero de verdad.** En un teléfono `pointermove` llega
      con el dedo encima y dejaría el cielo torcido en el sitio donde tocaste,
      sin forma de enderezarlo. `(hover: hover)` es la pregunta correcta.
   2. **La transición se pone solo al SALIR.** Moviendo, `pointermove` ya llega
      sesenta veces por segundo y una transición encima añade retraso; al
      salir hace falta, o el cielo pega un salto. Y va como clase y no en la
      regla de siempre por la trampa de la casa: una transición sobre un valor
      que sale de una variable se queda congelada en Chrome, así que cuanto
      menos rato esté puesta, mejor. */
function expCieloVivo() {
  const caja = document.querySelector(".exp-cielo");
  if (!caja) return;
  try {
    if (!window.matchMedia || !matchMedia("(hover: hover)").matches) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  } catch (e) { return; }

  caja.addEventListener("pointermove", ev => {
    const r = caja.getBoundingClientRect();
    if (!r.width || !r.height) return;
    caja.classList.remove("volviendo");
    caja.style.setProperty("--mx", ((ev.clientX - r.left) / r.width - 0.5).toFixed(3));
    caja.style.setProperty("--my", ((ev.clientY - r.top) / r.height - 0.5).toFixed(3));
  });
  caja.addEventListener("pointerleave", () => {
    caja.classList.add("volviendo");
    caja.style.setProperty("--mx", "0");
    caja.style.setProperty("--my", "0");
  });
}

/* Lo que dice el renglón de debajo del nivel. Tres frases y no una porque son
   tres momentos distintos, y el que faltaba era el último: quien pasa el
   nivel 30 tiene las cinco figuras cerradas y la pantalla le seguía diciendo
   que estaba «en» un rango. */
function expLecturaCielo(nivel) {
  if (nivel < 1) return "Tu cielo está por escribirse";
  const rangos = rangosVigentes();
  const viva = rangos.filter(r => expEstadoRango(r, nivel) === "viva")[0];
  if (!viva) return "Cielo completo · las cinco constelaciones";
  const k = expEscalonDe(viva, nivel);
  /* En el sexto la frase cambia porque el momento cambia: la figura quedó
     cerrada y el rango ya es tuyo. Decir «nivel 6 de 6» ahí sería contar el
     avance de algo que ya terminó. */
  if (k >= EXP_POR_RANGO) return escapeHtml(viva.nombre) + " · conseguido";
  return escapeHtml(viva.nombre) + " · nivel " + k + " de " + EXP_POR_RANGO;
}

/* ================= La colección =================
   El inventario del recorrido, no una vitrina de trofeos. La diferencia la
   marcó Eduardo y es la que hace que tenga sentido sin más gente mirando: lo
   que guarda no son medallas, son cosas que se usan —los ambientes se ponen—,
   y la pantalla es donde eliges cuál llevas y ves cuál viene.

   La versión anterior tenía casi todo lo que hay aquí menos lo que la hacía
   valer la pena, y Eduardo la resumió en una frase: «cero informativo, cero
   interesante y bastante olvidable». Los cuatro arreglos, en orden:

   1. **El cielo arriba.** Las constelaciones ya existían y solo se veían dos
      segundos al subir de nivel. Puestas aquí, la pantalla se abre con un
      dibujo que dice tu recorrido entero de un vistazo, los rangos que ya
      pasaste titilan, cruzan estrellas fugaces y el conjunto se mueve con el
      puntero.
   2. **Los rangos ya no se apagan.** Decían «Pasado» en gris —más apagado
      incluso que los que aún no alcanzas—, y un logro escrito en pasado y en
      gris se lee como algo que se te fue. Ahora cada uno lleva su color, un
      renglón que explica de qué va ese tramo, y el conseguido dice
      «Conseguido» con su palomita.
   3. **Lo que abre el nivel, que nunca se enseñó.** `EXP_ESCALERA` existe
      desde el primer día y esta pantalla no la pintaba, con el archivo
      diciendo al lado que «un premio sorpresa no mueve a nadie y uno que se ve
      venir, sí».
   4. **De dónde salen tus puntos se pliega.** Es la letra chica —a casi nadie
      le interesa el reparto exacto— y ocupaba media pantalla. Cerrada de
      inicio, y al abrirla ahora explica CÓMO se gana cada una, que es lo que
      de verdad le faltaba.

   Los ambientes NO se eligen aquí. Lo decidió Eduardo al cerrar el choque de
   las dos sesiones: la pantalla de elegir es «Mi apariencia», en Ajustes,
   junto a las otras cosas tuyas. Esta cuenta el recorrido; aquella lo viste.
   Lo único que las une es el botón, que es lo que evita tener que buscar
   dónde se recoge lo que acabas de ganar. */

/* A dónde vuelve la flecha. Se abre desde dos sitios y volver siempre al
   Resumen dejaba a quien venía de Ajustes en otra pantalla sin saber por qué. */
let coleccionVuelve = "summary";

function abrirColeccion(desde) {
  coleccionVuelve = desde || activeMainView || "summary";
  renderColeccion();
  showView("coleccion");
}

function volverDeColeccion() {
  if (coleccionVuelve === "settings") { showView("settings"); return; }
  showView(coleccionVuelve || "summary");
}

/* El acordeón. Cerrado siempre al entrar y sin recordar nada: lo que se pliega
   es la letra chica, y una pantalla que abre de forma distinta según lo que
   hiciste la última vez es una pantalla que no se reconoce.

   Se toca `hidden` y no `style.display`, y el `aria-expanded` va con él para
   que un lector de pantalla no anuncie abierto lo que está cerrado. */
function expPlegar(boton) {
  const caja = boton.nextElementSibling;
  if (!caja) return;
  const abierto = !caja.hidden;
  caja.hidden = abierto;
  boton.setAttribute("aria-expanded", String(!abierto));
  boton.classList.toggle("abierto", !abierto);
}

function renderColeccion() {
  const el = document.getElementById("coleccion-cuerpo");
  if (!el) return;
  const info = nivelExpedicion();
  const nivel = info.nivel;
  const actual = rangoExpedicion(nivel);
  const d = expDesglose();

  /* De mayor a menor: lo que más te ha traído hasta aquí, primero. Las que
     están a cero no se dibujan — un cero no cuenta nada de tu recorrido. */
  const fuentes = Object.keys(d)
    .filter(k => d[k] > 0)
    .sort((a, b) => d[b] - d[a]);
  const mayor = fuentes.length ? d[fuentes[0]] : 1;

  /* El color de la barra del nivel es el del rango que llevas puesto, no la
     menta de siempre. Es lo que ata el renglón de arriba con su constelación
     de abajo sin tener que escribirlo. */
  const tono = actual ? "var(" + actual.color + ")" : "var(--mint)";

  /* Los peldaños que NO son rangos —hoy, los ambientes—. Los rangos se quedan
     fuera de esta lista a propósito: los cuenta el panel de arriba entero, con
     su nota y su color, y repetirlos aquí sería decir dos veces la misma
     noticia en la misma pantalla. Es la misma regla que ya sigue la
     celebración de subir de nivel. */
  const peldanos = escaleraDeExpedicion().filter(x => x.listo && x.tipo !== "rango");

  el.innerHTML = `
    <div class="scene-card exp-cielo">
      ${/* El cielo va ARRIBA y el rótulo DEBAJO, no encima. Se probó
           superpuesto y no se sostiene: el rótulo mide 108 px fijos de CSS y
           el cielo escala con el ancho, así que en un teléfono de 375 px la
           insignia se comía la constelación más baja y en una pantalla de 524
           quedaba media tarjeta de cielo vacío. Separados, cada uno pide lo
           suyo y el degradado de abajo cose los dos. */""}
      <div class="exp-sky-wrap">
        ${expCieloHTML(nivel)}
        <div class="exp-velo"></div>
      </div>
      <div class="exp-hero">
        <div class="exp-hero-fila">
          ${insigniaExpedicionHTML(52)}
          <div class="exp-hero-tx">
            <div class="exp-hero-nivel">Nivel ${nivel}</div>
            <div class="exp-hero-rango" style="color:${tono}">${expLecturaCielo(nivel)}</div>
          </div>
        </div>
        ${/* La misma barra que ahora usa la racha. Le gustó a Eduardo —«me
             enamoré de tu barra de carga… se podría sacar provecho en otras
             áreas»— así que vive en `.barra-viva` y no aquí: dos copias del
             mismo efecto se separan a la tercera vez que alguien toca una. */""}
        <div class="barra-viva exp-hero-barra"><i style="--p:${info.pct}%;--c:${tono}"></i></div>
        <div class="exp-hero-pie">
          <b>${info.faltan}</b> ${info.faltan === 1 ? "punto" : "puntos"} para el nivel ${nivel + 1}
          <span>${info.puntos} en total</span>
        </div>
      </div>
    </div>

    <div class="panel">
      <h3>Tus rangos</h3>
      <p class="settings-note">Cinco en toda la vida de una cuenta. Cada uno son seis niveles, y cada nivel avanza un tramo de su constelación. El rango se consigue al cerrarla, y se queda puesto.</p>
      <div class="col-rangos">
        ${/* `rangosVigentes()` y no `EXP_RANGOS` a secas: con un mundo puesto,
             la insignia de arriba decía el rango del mundo —Arquitecto— y esta
             lista, dos dedos más abajo, seguía escribiendo los cinco de la
             casa. La pantalla se contradecía a sí misma. Los NIVELES y los
             COLORES siguen saliendo de `EXP_RANGOS`, que es lo que un mundo no
             mueve. */
          rangosVigentes().map(r => {
          const estado = expEstadoRango(r, nivel);
          const tuyo = expConseguido(r, nivel);
          const hasta = expNivelDeRango(r);
          return `<div class="col-rango-uno ${estado}" style="--c:var(${r.color})">
            <span class="crx-disco">${r.trazo ? svgDeTrazo(r.trazo, 22) : icon(r.icon, 22)}</span>
            <div class="crx-tx">
              <div class="crx-cab">
                <b>${escapeHtml(r.nombre)}</b>
                <span class="crx-estado">${
                  tuyo ? icon("check", 13) + "Conseguido"
                  : estado === "viva" ? "Aquí estás"
                  : "Nivel " + hasta}</span>
              </div>
              <span class="crx-nota">${escapeHtml(r.nota || ("Niveles " + r.desde + " a " + hasta + "."))}</span>
            </div>
          </div>`;
        }).join("")}
      </div>
    </div>

    ${peldanos.length ? `<div class="panel">
      <h3>Lo que abre el nivel</h3>
      <p class="settings-note">El nivel sube solo con lo que ya haces. Esto es lo que va apareciendo por el camino.</p>
      <div class="col-peldanos">
        ${peldanos.map(x => {
          /* Por qué no lo tienes se lo pregunta a `aparienciaDisponible()`, que
             es quien lo decide de verdad, en vez de mirar la bandera `pro` a
             secas: a quien ya paga, un candado al lado de algo que sí puede
             usar le dice que no puede. Devuelve `true`, "nivel", "pro" o
             "fundador". Los peldaños sin `id` —las celebraciones, que todavía
             no existen— no son una apariencia y se resuelven por el nivel. */
          const razon = (x.id && typeof aparienciaDisponible === "function")
            ? aparienciaDisponible(x.id)
            : (nivel >= x.nivel ? true : "nivel");
          const tuyo = razon === true;
          /* Un solo dato por chip. Al que aún no llegas le importa el nivel
             —el candado ya lo verá cuando llegue—; al que ya alcanzaste y
             sigue cerrado le importa qué lo cierra. Los dos a la vez no se
             leen. */
          const porNivel = razon === "nivel";
          /* El LILA solo cuando lo que cierra es Fundador. Es la regla de la
             casa y no una preferencia: ese tono se sacó del amarillo justo
             para que dijera una sola cosa, y un candado de Pro pintado de lila
             la rompe. Lo que cierra Pro va en celeste, que aquí no significa
             nada más — y de decir que está cerrado ya se encarga el candado. */
          const col = tuyo || porNivel
            ? (x.tipo === "ambiente" ? "--celeste" : "--rosa")
            : (razon === "fundador" ? "--lila" : "--celeste");
          return `<div class="col-peldano ${tuyo ? "tuyo" : porNivel ? "" : "cerrado"}" style="--c:var(${col})">
            <span class="cpx-disco">${icon(x.icon || (x.tipo === "ambiente" ? "brush" : "star"), 17)}</span>
            <b>${escapeHtml(x.nombre)}</b>
            <span class="cpx-estado">${
              porNivel ? "Nivel " + x.nivel
              : tuyo ? icon("check", 13) + "Tuyo"
              : icon("lock", 12) + (razon === "fundador" ? "Fundador" : "Pro")}</span>
          </div>`;
        }).join("")}
      </div>
      ${typeof abrirApariencia === "function" ? `<button class="btn btn-linea btn-block" onclick="abrirApariencia()">Ver Mi apariencia</button>` : ""}
    </div>` : (typeof abrirApariencia === "function" ? `<div class="panel">
      <button class="btn btn-linea btn-block" onclick="abrirApariencia()">Ver Mi apariencia</button>
    </div>` : "")}

    <div class="panel panel-plegable">
      <button class="exp-plegable" aria-expanded="false" onclick="expPlegar(this)">
        <span>De dónde salen tus puntos</span>
        <em>${fuentes.length ? fuentes.length + (fuentes.length === 1 ? " fuente" : " fuentes") : "Todavía nada"}</em>
        ${svgDeTrazo('<path d="M6 9.5l6 6 6-6"/>', 16)}
      </button>
      <div hidden>
        ${fuentes.length ? `<div class="col-fuentes">
          ${fuentes.map(k => `<div class="col-fuente" style="--c:var(${EXP_COLOR_FUENTE[k] || "--mint"})">
            <span>${EXP_ETIQUETAS[k] || k}</span>
            <b>${d[k]}</b>
            <i style="--p:${Math.round((d[k] / mayor) * 100)}%"></i>
            <em>${EXP_PISTAS[k] || ""}</em>
          </div>`).join("")}
        </div>` : `<p class="settings-note">Todavía nada. Cumple una misión o registra una práctica y esto empieza a llenarse.</p>`}
      </div>
    </div>`;

  /* Después de pintar, no antes: el oyente cuelga de un nodo que acaba de
     nacer con el `innerHTML` de arriba. */
  expCieloVivo();
}

/* Todo lo abierto hasta ahora, para la colección. En orden de cuándo llegó. */
function desbloqueosDeExpedicion(nivel) {
  const n = typeof nivel === "number" ? nivel : nivelExpedicion().nivel;
  return escaleraDeExpedicion().filter(x => x.nivel <= n && x.listo);
}

/* El mismo envoltorio que `icon()`, para un trazo que no vive en ICONS. */
function svgDeTrazo(d, tam) {
  return '<svg width="' + tam + '" height="' + tam + '" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" ' +
    'stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
}
