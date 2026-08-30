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
   no se recuerda y «Rama» sí, y ese trabajo no necesita a nadie más mirando.

   NINGUNO lleva candado, ni siquiera de refilón. Si el rango es la cara del
   nivel y el nivel sube para todos, ponerle candado sería topar el número por
   la puerta de atrás. Lo que pide Pro son los ambientes y las celebraciones. */
const EXP_RANGOS = [
  { id: "nodo",   nombre: "Nodo",   desde: 1,  icon: "rango-nodo" },
  { id: "enlace", nombre: "Enlace", desde: 4,  icon: "rango-enlace" },
  { id: "rama",   nombre: "Rama",   desde: 10, icon: "rango-rama" },
  { id: "trama",  nombre: "Trama",  desde: 18, icon: "rango-trama" },
  { id: "red",    nombre: "Red",    desde: 28, icon: "rango-red" }
];

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
   hueco, para no duplicar el trabajo ni clavar nombres que no son de aquí. */
const EXP_ESCALERA = [
  { nivel: 1,  tipo: "rango",       nombre: "Rango Nodo" },
  { nivel: 2,  tipo: "ambiente",    nombre: "Un ambiente nuevo" },
  { nivel: 3,  tipo: "celebracion", nombre: "Destello propio al cumplir una misión" },
  { nivel: 4,  tipo: "rango",       nombre: "Rango Enlace" },
  { nivel: 6,  tipo: "celebracion", nombre: "Escena nueva de racha" },
  { nivel: 8,  tipo: "ambiente",    nombre: "Un ambiente nuevo" },
  { nivel: 10, tipo: "rango",       nombre: "Rango Rama" },
  { nivel: 10, tipo: "ambiente",    nombre: "Un ambiente nuevo" },
  { nivel: 12, tipo: "ambiente",    nombre: "Un ambiente nuevo", pro: true },
  { nivel: 15, tipo: "celebracion", nombre: "Celebración de pantalla completa", pro: true },
  { nivel: 18, tipo: "rango",       nombre: "Rango Trama" },
  { nivel: 22, tipo: "ambiente",    nombre: "Un ambiente nuevo", pro: true },
  { nivel: 28, tipo: "rango",       nombre: "Rango Red" }
];

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
function rangoExpedicion(nivel) {
  const n = typeof nivel === "number" ? nivel : nivelExpedicion().nivel;
  let cual = null;
  for (const r of EXP_RANGOS) if (n >= r.desde) cual = r;
  return cual;
}

/* Lo que viene, con su nivel escrito. Es la pieza que hace que la barra sirva:
   un premio sorpresa no mueve a nadie y uno que se ve venir, sí. Devuelve
   también los que piden Pro —a la vista y con candado, nunca escondidos—. */
function proximoDesbloqueo(nivel) {
  const n = typeof nivel === "number" ? nivel : nivelExpedicion().nivel;
  return EXP_ESCALERA.find(x => x.nivel > n) || null;
}

/* Todo lo abierto hasta ahora, para la colección. En orden de cuándo llegó. */
function desbloqueosDeExpedicion(nivel) {
  const n = typeof nivel === "number" ? nivel : nivelExpedicion().nivel;
  return EXP_ESCALERA.filter(x => x.nivel <= n);
}
