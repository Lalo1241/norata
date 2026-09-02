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
const EXP_RANGOS = [
  { id: "andante",    nombre: "Andante",    desde: 1,  icon: "rango-bota" },
  { id: "rastreador", nombre: "Rastreador", desde: 7,  icon: "rango-huella" },
  { id: "explorador", nombre: "Explorador", desde: 13, icon: "rango-farol" },
  { id: "cartografo", nombre: "Cartógrafo", desde: 19, icon: "rango-mapa" },
  { id: "navegante",  nombre: "Navegante",  desde: 25, icon: "rango-brujula" }
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
/* Los peldaños de celebración se mueven con los rangos: al pasar éstos a cada
   seis niveles, dejarlos en 3, 6 y 15 los ponía justo encima de un cambio de
   rango, y dos noticias en la misma pantalla se estorban. Ahora caen en los
   huecos: 4, 10 y 16. */
const EXP_ESCALERA = [
  { nivel: 1,  tipo: "rango",       nombre: "Rango Andante", listo: true },
  { nivel: 4,  tipo: "celebracion", nombre: "Destello propio al cumplir una misión" },
  { nivel: 7,  tipo: "rango",       nombre: "Rango Rastreador", listo: true },
  { nivel: 10, tipo: "celebracion", nombre: "Escena nueva de racha" },
  { nivel: 13, tipo: "rango",       nombre: "Rango Explorador", listo: true },
  { nivel: 16, tipo: "celebracion", nombre: "Celebración de pantalla completa", pro: true },
  { nivel: 19, tipo: "rango",       nombre: "Rango Cartógrafo", listo: true },
  { nivel: 25, tipo: "rango",       nombre: "Rango Navegante", listo: true }
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
    const r = propios.filter(x => x.desde === f.nivel)[0];
    return r ? Object.assign({}, f, { nombre: "Rango " + r.nombre }) : f;
  });
  if (typeof AMBIENTES !== "undefined") {
    for (const a of AMBIENTES) {
      if (!a.abre) continue;
      /* `listo` en firme: un ambiente que sale de este catálogo EXISTE —está
         en `css/ambientes.css` y se pone desde Ajustes—. La bandera es lo que
         separa lo que ya se puede cumplir de lo que solo está planeado, y
         estos ya no están planeados. */
      filas.push({ nivel: a.abre, tipo: "ambiente", nombre: a.nombre, pro: !!a.pro, listo: true });
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

  return '<span class="exp-insignia" style="width:' + d + 'px;height:' + d + 'px"' +
    ' title="Nivel ' + info.nivel + ' · ' + r.nombre + ' · ' + info.pct + '% del nivel"' +
    ' aria-label="Nivel ' + info.nivel + ', rango ' + r.nombre + '">' +
    ring(d, grosor, [{ pct: info.pct / 100, color: "var(--mint)" }], "var(--carril)") +
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

function renderColeccion() {
  const el = document.getElementById("coleccion-cuerpo");
  if (!el) return;
  const info = nivelExpedicion();
  const actual = rangoExpedicion(info.nivel);
  const d = expDesglose();

  /* De mayor a menor: lo que más te ha traído hasta aquí, primero. Las que
     están a cero no se dibujan — un cero no cuenta nada de tu recorrido. */
  const fuentes = Object.keys(d)
    .filter(k => d[k] > 0)
    .sort((a, b) => d[b] - d[a]);
  const mayor = fuentes.length ? d[fuentes[0]] : 1;

  el.innerHTML = `
    <div class="col-cab">
      ${insigniaExpedicionHTML(64)}
      <div class="col-quien">
        <div class="col-nivel">Nivel ${info.nivel}</div>
        <div class="col-rango">${actual ? escapeHtml(actual.nombre) : "Antes del primer nivel"}</div>
      </div>
    </div>
    <div class="col-barra"><i style="--p:${info.pct}%"></i></div>
    <p class="settings-note">${info.puntos} puntos de expedición.
      Te faltan <b>${info.faltan}</b> para el nivel ${info.nivel + 1}.</p>

    <div class="panel">
      <h3>Tu recorrido</h3>
      <p class="settings-note">Cinco rangos en toda la vida de una cuenta. Se celebran la primera vez que llegas y se quedan puestos.</p>
      <div class="col-rangos">
        ${/* `rangosVigentes()` y no `EXP_RANGOS` a secas, que era lo que había:
            con un mundo puesto, la insignia de arriba decía el rango del mundo
            —Arquitecto— y esta misma reja, dos dedos más abajo, seguía
            escribiendo los cinco de la casa —Nodo, Enlace, Rama, Trama, Red—.
            La pantalla se contradecía a sí misma. Los NIVELES siguen saliendo
            de `EXP_RANGOS`, que es lo que un mundo no mueve. */
          rangosVigentes().map(r => {
          const tuyo = actual && actual.id === r.id;
          const abierto = info.nivel >= r.desde;
          return `<div class="col-rango-uno ${tuyo ? "tuyo" : ""} ${abierto ? "abierto" : ""}">
            ${/* El mismo reparto que la insignia: un rango de la casa nombra un
                 icono de ICONS y uno de mundo trae su trazo entero. Sin esto,
                 la reja escribía los nombres del mundo con los DIBUJOS de la
                 casa —«Arquitecto» debajo del nudo de una red—. */
              r.trazo ? svgDeTrazo(r.trazo, 26) : icon(r.icon, 26)}
            <b>${escapeHtml(r.nombre)}</b>
            <span>${abierto ? (tuyo ? "Ahora" : "Pasado") : "Nivel " + r.desde}</span>
          </div>`;
        }).join("")}
      </div>
      ${typeof abrirApariencia === "function" ? `<button class="btn btn-linea btn-block" onclick="abrirApariencia()">Ver Mi apariencia</button>` : ""}
    </div>

    <div class="panel">
      <h3>De dónde salen tus puntos</h3>
      ${fuentes.length ? `<div class="col-fuentes">
        ${fuentes.map(k => `<div class="col-fuente">
          <span>${EXP_ETIQUETAS[k] || k}</span>
          <b>${d[k]}</b>
          <i style="--p:${Math.round((d[k] / mayor) * 100)}%"></i>
        </div>`).join("")}
      </div>` : `<p class="settings-note">Todavía nada. Cumple una misión o registra una práctica y esto empieza a llenarse.</p>`}
    </div>`;
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
