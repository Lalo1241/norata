/* El plan: qué pagó esta persona, y qué desbloquea */

/* ================= Lo primero, porque es lo que se malinterpreta =================
   NADA de este archivo es seguridad. Ni una línea. Todo lo que hay aquí se
   puede reescribir desde las herramientas del navegador en treinta segundos,
   y eso está bien: no es donde vive el candado.

   El candado vive en la base de datos. La tabla `suscripciones` no tiene
   ninguna regla de escritura para nadie, así que el navegador puede mentirse
   a sí mismo todo lo que quiera pero no puede cambiar lo que dice el
   servidor. Al recargar, la mentira se cae sola. Ver `supabase/planes.sql`.

   El reparto que hay que tener en la cabeza:

     el servidor    decide QUIÉN pagó, y hasta cuándo
     este archivo   decide QUÉ se le enseña a quien no pagó

   Por eso aquí no se intenta esconder nada ni ofuscar nada. La pregunta
   correcta no es «¿puede alguien saltárselo?» —puede, en su propia pantalla,
   y no le sirve de nada—, sino «¿puede alguien conseguir que el servidor le
   crea?». Y eso se contesta en el SQL, no aquí.

   ---- Y una segunda regla, que es de producto y no de código ----

   CONGELAR, NUNCA QUITAR. Al dejar de pagar, lo que pasa del límite queda
   visible y en solo lectura: se ve, se consulta, se exporta. No se crea, no
   se edita, no se mueve. El XP ganado no se toca. Y la app NUNCA elige qué se
   congela: decide la persona. Por eso todos los ayudantes de abajo preguntan
   por CREAR y ninguno pregunta por VER. Si algún día aparece un
   `puedeVer(...)` en este archivo, algo se torció. */

/* ---- Los planes ----
   Los precios viven aquí solo para pintarlos. Lo que se cobra de verdad lo
   dice Stripe, y la app nunca le manda un importe: le manda cuál de los tres
   planes quiere. Si algún día no coinciden, el que manda es Stripe y aquí
   hay un texto viejo que corregir. */
/* Tres formas de pagar, DOS niveles. Mensual y anual son el mismo Pro: lo que
   cambia es cada cuánto se cobra, no lo que se abre (ver `LIMITES`, que tiene
   dos entradas y no tres). Por eso se llaman "Pro mensual" y "Pro anual" y no
   "Mensual" y "Anual" a secas: con los nombres sueltos parecían dos productos
   distintos y había que leerse las dos tarjetas enteras para descubrir que
   traen lo mismo.

   Los niveles, para nombrarlos siempre igual en toda la app: **Gratuito, Pro y
   Fundador.** "Plan libre" y "plan completo" eran dos nombres más para lo
   mismo y no se corresponden con nada de lo que se cobra.

   El precio lleva MXN escrito. Un "$69" a secas lo lee cada quien en su
   moneda, y a quien lo lea en dólares le va a parecer que Norata cuesta mil
   trescientos pesos. */
const PLANES = {
  mensual: {
    nombre: "Pro mensual",
    precio: "$69 MXN",
    periodo: "al mes",
    pie: "Se renueva solo. Cancelas cuando quieras."
  },
  anual: {
    nombre: "Pro anual",
    precio: "$590 MXN",
    periodo: "al año",
    pie: "Dos meses de regalo frente al mensual."
  },
  fundador: {
    nombre: "Fundador",
    precio: "$890 MXN",
    periodo: "una sola vez",
    /* El destacado es este y no el anual, y el motivo cabe en una línea: los
       otros dos son suscripciones y este no. Se paga una vez, no se renueva,
       no hay nada que cancelar y no puede subir de precio. Eso es mejor oferta
       que dos meses de regalo, aunque cueste más de entrada. */
    pie: "Pago único. No se renueva ni se cancela: es tuyo y ya.",
    destacado: true,
    cupo: true
  }
};

/* ---- Los límites ----
   Un solo sitio con todos los topes, y todo lo demás preguntándole a él.
   La razón es fea y real: la primera vez que un límite se escribe suelto
   dentro de una pantalla, ya hay dos verdades, y la que se olvida de subir
   es siempre la de la pantalla que se tocó hace menos.

   `Infinity` y no un número grande: comparar con `>` funciona igual, no hay
   que acordarse de ningún caso especial, y nadie va a chocar contra él.

   Cómo se leen los nombres:
     ramas      cuántas ramas del árbol de Talentos puede tener
     talentos   cuántos talentos caben DENTRO de cada rama
     atico      cuántos años atrás puede consultar del ático
     resumen    qué resúmenes ve (el semanal es de todos, a propósito)
     apariencia si puede usar las apariencias completas */
const LIMITES = {
  libre: {
    ramas: 1,
    /* Doce, y no quince o veinte. Le advertí que doce se tocan en semanas y
       que eso convierte lo gratis en una prueba más que en una app; lo dejó
       en doce a sabiendas. Los dos límites van juntos porque limitar ramas
       sin limitar talentos invita a meter todo en una y no pagar nunca. */
    talentos: 12,
    atico: 0,          // solo el año en curso
    resumen: ["semana"],
    apariencia: false
  },
  pro: {
    ramas: Infinity,
    talentos: Infinity,
    atico: Infinity,
    resumen: ["semana", "mes", "ano"],
    apariencia: true
  }
};

/* Lo que sabemos del plan ahora mismo. Arranca en libre y no en «no sé» a
   propósito: hasta que el servidor conteste, la app tiene que poder pintar
   algo, y pintar la versión gratuita y luego encender funciones es mucho
   menos violento que pintarlas y apagarlas en la cara de quien sí pagó. */
let PLAN = { plan: "libre", pro: false, estado: "ninguna", vence_el: null, renueva: false, compro: "libre" };

/* Lo MISMO, pero sin la simulación encima. Existe por el modo de pruebas: al
   ponerse a mirar la app «como fundador», `PLAN` deja de ser lo que dijo el
   servidor, y hace falta un sitio donde siga estando la verdad para poder
   volver a ella sin preguntar otra vez. Fuera del modo de pruebas los dos
   valen lo mismo siempre. */
let PLAN_REAL = null;

const PLAN_GUARDADO = "norata-plan";

/* Una semana. El plan se guarda en el aparato para que quien pagó y abre la
   app en el metro no vea de pronto la versión gratuita, pero esa copia
   caduca: sin caducidad, quien cancela hace un año y no vuelve a tener red
   sigue siendo pro para siempre. Una semana es más que cualquier viaje sin
   señal y menos que cualquier mes sin pagar. */
const PLAN_CADUCA = 7 * 24 * 60 * 60 * 1000;

function planLeerGuardado() {
  try {
    const g = JSON.parse(localStorage.getItem(PLAN_GUARDADO) || "null");
    if (!g || !g.cuando || Date.now() - g.cuando > PLAN_CADUCA) return null;
    return g.plan;
  } catch (e) {
    return null;
  }
}

function planEscribirGuardado(p) {
  try {
    localStorage.setItem(PLAN_GUARDADO, JSON.stringify({ cuando: Date.now(), plan: p }));
  } catch (e) { /* sin espacio o en modo privado: se sigue sin la copia */ }
}

/* Preguntarle al servidor. Se llama al arrancar, al entrar con una cuenta y
   al volver de pagar.

   Falla en silencio y se queda con lo que tenía. Un fallo de red no debe
   apagarle las funciones a nadie: eso es exactamente el momento en que la
   persona que paga se siente estafada, y por una razón que ni siquiera es
   suya. Ante la duda, lo último que se supo. */
async function planCargar() {
  /* La copia guardada se pone ANTES de esperar nada. Es el motivo entero de
     que exista: quien pagó y abre la app en el metro no puede ver la versión
     gratuita durante los dos segundos que tarda la pregunta. */
  const guardado = planLeerGuardado();
  if (guardado) {
    PLAN_REAL = guardado;
    PLAN = planConSimulacion(guardado);
  }

  PLAN_REAL = await planDelServidor(PLAN_REAL || PLAN);
  PLAN = planConSimulacion(PLAN_REAL);
  return PLAN;
}

/* Lo que contesta el servidor, y nada más. Devuelve `antes` —lo último que se
   supo— en todos los caminos que fallan, que es la regla de arriba: ante la
   duda, lo último que se supo. */
async function planDelServidor(antes) {
  try {
    if (typeof syncReady === "function" && !syncReady()) {
      /* Sin cuenta no hay plan que preguntar. Y sin cuenta tampoco tiene
         sentido arrastrar la copia guardada de otra sesión. */
      return { plan: "libre", pro: false, estado: "ninguna", vence_el: null, renueva: false, compro: "libre" };
    }
    const r = await sbDatos("/rpc/mi_plan", { method: "POST", body: "{}" });
    /* 404: todavía no se ha corrido `planes.sql`. Es la única respuesta rara
       que se espera y no merece un error: significa que el cobro aún no
       existe, que es la verdad hoy. */
    if (r.status === 404) return antes;
    if (!r.ok || !r.body) return antes;
    /* Se guarda lo del SERVIDOR, nunca lo simulado: si la simulación llegara
       a esta línea, cerrar la pestaña dejaría a alguien creyéndose fundador
       durante una semana entera (ver `PLAN_CADUCA`). */
    planEscribirGuardado(r.body);
    return r.body;
  } catch (e) {
    /* A propósito. Ver arriba. */
    return antes;
  }
}

/* ================= Ver la app con otro plan =================

   Para qué existe: no se pueden tener las tres membresías compradas a la vez,
   y hay estados que además no se pueden provocar a voluntad —un recibo que
   falla, una suscripción cancelada a la que le quedan días—. Sin esto, la
   única forma de ver esas pantallas es esperar a que le pasen a alguien.

   Esto NO abre nada. Lo dice el archivo entero desde su primera línea, pero
   aquí conviene repetirlo porque parece lo contrario: escribir "fundador" en
   `PLAN` cambia lo que la app DIBUJA y no lo que el servidor CREE. Las ramas
   de más siguen sin poder crearse contra la base de datos, el ático sigue sin
   contestar, y al recargar sin la marca puesta la mentira se cae sola. Quien
   quiera engañarse a sí mismo ya podía hacerlo desde la consola en diez
   segundos; esto solo lo hace cómodo para quien tiene que revisarlo.

   En `sessionStorage` y no en `localStorage`, por lo mismo que las pruebas
   con enlace: tiene que sobrevivir a una recarga —si no, no se puede navegar
   por la app mirando— y tiene que morir al cerrar la pestaña, para que no se
   quede pegado como si fuera un ajuste. */
const PLAN_SIMULADO = "norata-plan-simulado";

/* Los siete estados que importan. Los cuatro primeros son lo que se compra;
   los tres últimos son los que no se pueden provocar y son justo donde la
   pantalla del plan cambia de color y de texto. */
const PLANES_SIMULABLES = [
  { id: "", rotulo: "De verdad" },
  { id: "libre", rotulo: "Gratuito" },
  { id: "mensual", rotulo: "Pro mensual" },
  { id: "anual", rotulo: "Pro anual" },
  { id: "fundador", rotulo: "Fundador" },
  { id: "cancelando", rotulo: "Pro cancelándose" },
  { id: "impago", rotulo: "Pro sin pagar" },
  { id: "terminado", rotulo: "Plan terminado" }
];

function planLeerSimulado() {
  try {
    return sessionStorage.getItem(PLAN_SIMULADO) || "";
  } catch (e) {
    return "";
  }
}

function planNombreSimulado() {
  const cual = planLeerSimulado();
  const x = PLANES_SIMULABLES.find(p => p.id === cual);
  return cual && x ? x.rotulo : "";
}

/* Las fechas se calculan desde hoy y no se escriben a mano: un "vence el 3 de
   marzo de 2026" clavado en el código empieza a mentir en cuanto pasa esa
   fecha, y lo que se está revisando aquí es precisamente cómo se cuentan los
   días que quedan. */
function planConSimulacion(real) {
  const cual = planLeerSimulado();
  if (!cual) return real;
  const en = (dias) => new Date(Date.now() + dias * 864e5).toISOString();

  if (cual === "libre") {
    return { plan: "libre", pro: false, estado: "ninguna", vence_el: null, renueva: false, compro: "libre" };
  }
  if (cual === "terminado") {
    return { plan: "libre", pro: false, estado: "cancelada", vence_el: en(-9), renueva: false, compro: "anual" };
  }
  if (cual === "mensual") {
    return { plan: "mensual", pro: true, estado: "activa", vence_el: en(18), renueva: true, compro: "mensual" };
  }
  if (cual === "anual") {
    return { plan: "anual", pro: true, estado: "activa", vence_el: en(210), renueva: true, compro: "anual" };
  }
  if (cual === "cancelando") {
    return { plan: "anual", pro: true, estado: "activa", vence_el: en(43), renueva: false, compro: "anual" };
  }
  if (cual === "impago") {
    return { plan: "mensual", pro: true, estado: "impago", vence_el: en(-1), renueva: true, compro: "mensual" };
  }
  if (cual === "fundador") {
    return { plan: "fundador", pro: true, estado: "activa", vence_el: null, renueva: false, compro: "fundador" };
  }
  return real;
}

/* Cambiar de plan simulado. No vuelve a preguntar al servidor: `PLAN_REAL` ya
   tiene la respuesta y pedirla otra vez por cambiar de vista sería pagar un
   viaje por nada.

   Repinta TODO y no solo la sección del plan: lo que se viene a mirar aquí es
   cómo se comporta la app entera —el árbol con una rama, el ático cerrado,
   los resúmenes que faltan—, y dejar el Resumen dibujado con el plan anterior
   es exactamente el error que este botón trata de evitar. */
function planSimular(cual) {
  try {
    if (cual) sessionStorage.setItem(PLAN_SIMULADO, cual);
    else sessionStorage.removeItem(PLAN_SIMULADO);
  } catch (e) {
    /* En una ventana privada puede no dejar. Se sigue sin simular, que es
       molesto pero no rompe nada. */
  }
  PLAN = planConSimulacion(PLAN_REAL || PLAN);
  if (typeof pintarAvisoPruebas === "function") pintarAvisoPruebas();
  if (typeof renderAjustes === "function") renderAjustes();
  if (typeof renderPanelAdmin === "function") renderPanelAdmin();
  if (typeof renderPanelPlan === "function") renderPanelPlan();
  if (typeof toast === "function") {
    toast(cual ? "Viendo la app como " + planNombreSimulado() : "De vuelta a tu plan de verdad", "hecho");
  }
}

/* ---- Las preguntas que hace el resto de la app ---- */

function esPro() {
  return !!(PLAN && PLAN.pro);
}

function limitePlan(clave) {
  const l = LIMITES[esPro() ? "pro" : "libre"];
  return l[clave];
}

/* «¿Puedo crear uno más?» — la única forma correcta de preguntar.
   Recibe cuántos hay YA, no cuántos habrá. Es la diferencia entre un límite
   de 12 que deja crear 12 y uno que deja crear 11, y ese error de uno se
   descubre siempre por un correo de alguien enfadado. */
function cabeUnoMas(clave, cuantosHay) {
  return Number(cuantosHay) < limitePlan(clave);
}

/* Lo mismo, para lo que no se cuenta sino que se tiene o no. */
function planPermite(clave) {
  return limitePlan(clave) === true;
}

function planIncluyeResumen(cual) {
  return (limitePlan("resumen") || []).indexOf(cual) >= 0;
}

/* Lo que se le dice a alguien que topó con un límite. Vive aquí y no en cada
   pantalla porque el tono de este mensaje es delicado: no puede sonar a
   castigo ni a puerta cerrada. Nada de «no puedes»; se dice qué hay y por
   dónde se sigue. */
function planMensaje(clave) {
  if (clave === "ramas") {
    return "Tu árbol tiene una rama en el plan Gratuito. Con Pro puedes abrir las que quieras.";
  }
  if (clave === "talentos") {
    return "Caben " + LIMITES.libre.talentos + " talentos por rama en el plan Gratuito. " +
      "Con Pro no hay tope.";
  }
  if (clave === "atico") {
    return "El plan Gratuito guarda el año en curso. Con Pro puedes volver a cualquier año.";
  }
  if (clave === "resumen") {
    return "El resumen de la semana es de todos. El del mes y el del año vienen con Pro.";
  }
  if (clave === "apariencia") {
    return "Las paletas de color son de todos. Las apariencias completas vienen con Pro.";
  }
  return "Esto viene con Pro.";
}

/* ---- Cómo se ve el plan, de un vistazo ----

   Cuatro ayudantes que contestan la misma pregunta —«¿qué plan tiene esta
   persona?»— desde sitios distintos: la fila del índice de Ajustes, la ficha
   del mini menú y la cabecera del panel. Viven juntos aquí para que los tres
   sitios no puedan acabar diciendo cosas distintas el día que cambie un
   estado, que es exactamente lo que pasa cuando cada pantalla se lo pregunta
   a su manera. */

/* Tres niveles y no cinco. Mensual y anual son el MISMO plan: lo que cambia
   es cada cuánto se paga, no lo que se abre (ver `LIMITES`, que solo tiene
   dos entradas). Enseñar "Mensual" y "Anual" como si fueran escalones
   distintos haría creer que el anual trae algo más. */
function planNivel() {
  if (!PLAN.pro) return "libre";
  return PLAN.plan === "fundador" ? "fundador" : "pro";
}

/* La piedra que le toca. Los tres dibujos comparten silueta y crecen: desnuda,
   tallada y con corona (ver los `plan-*` de `ICONS`, en `js/01-base.js`). */
function planIcono() {
  return "plan-" + planNivel();
}

/* De qué color se pinta esa piedra. Menta es "todo normal" y es el caso de
   casi todo el mundo; el oro marca lo que hay que mirar aunque no esté roto
   —el fundador, y el plan que se está acabando— y el coral lo que sí va mal.

   Devuelve el nombre pelado y quien lo use le pone el prefijo `t-`: el mismo
   tono lo pintan tres CSS distintos (la fila del índice, la del mini menú y
   la chapa) y ninguno tiene por qué saber cómo se llaman las clases del
   otro. */
function planTono() {
  if (PLAN.estado === "impago") return "coral";
  if (planNivel() === "fundador") return "oro";
  if (PLAN.pro && !PLAN.renueva && PLAN.vence_el) return "oro";
  if (!PLAN.pro && PLAN.compro && PLAN.compro !== "libre") return "oro";
  return "";
}

/* El nombre corto, para un hueco de once píxeles. `planEtiqueta()` escribe la
   frase entera —"Plan Mensual, hasta el 14 de marzo"— y ahí no cabe. */
function planEtiquetaCorta() {
  if (!PLAN.pro) {
    if (PLAN.compro && PLAN.compro !== "libre") return "Tu plan terminó";
    return "Gratuito";
  }
  if (PLAN.estado === "impago") return "Revisa tu pago";
  if (PLAN.plan === "fundador") return "Fundador";
  if (!PLAN.renueva && PLAN.vence_el) return "Hasta el " + fechaCorta(PLAN.vence_el);
  /* El nivel y no la cadencia: en una pastilla de once píxeles, "Pro" dice lo
     que esta persona tiene y "Pro anual" gasta la mitad del hueco en decir
     cada cuánto le cobran, que no es lo que se viene a mirar aquí. */
  return "Pro";
}

/* La frase de debajo de "Mi plan" en el índice de Ajustes. Decía "Qué tienes
   abierto y cómo cambiarlo", que se puede leer entera sin enterarse de nada:
   es la única de las cuatro filas cuyo contenido cambia de una cuenta a otra,
   así que aquí va el dato y no la promesa de que hay un dato dentro. */
function planSub() {
  if (typeof syncReady === "function" && !syncReady()) {
    return "Con una cuenta puedes tener plan";
  }
  const p = PLANES[PLAN.plan] || {};
  if (!PLAN.pro) {
    if (PLAN.compro && PLAN.compro !== "libre") {
      return "Tu plan " + ((PLANES[PLAN.compro] || {}).nombre || PLAN.compro) + " terminó";
    }
    return "Gratuito · una rama y " + LIMITES.libre.talentos + " talentos";
  }
  if (PLAN.estado === "impago") return "No pudimos cobrar tu último recibo";
  /* «Vigente» y no el precio. El precio ya está dentro, en la cabecera y en el
     renglón de «qué pagas», y aquí compite con el único dato que esta línea
     tiene que dar: si lo que tienes sigue en pie o se está acabando. La única
     vez que sale una fecha es cuando hay una fecha que mirar. */
  if (!PLAN.renueva && PLAN.vence_el) return p.nombre + " · Termina el " + fechaCorta(PLAN.vence_el);
  return (p.nombre || PLAN.plan) + " · Vigente";
}

/* La pastilla de la ficha del mini menú: la piedra y el nombre corto. */
function planChapaHTML() {
  const tono = planTono();
  return '<span class="mm-plan' + (tono ? " t-" + tono : "") + '">' +
    icon(planIcono(), 12) + escapeHtml(planEtiquetaCorta()) + '</span>';
}

/* Cómo se llama lo que tiene, para pintarlo en Ajustes. Distingue los tres
   casos que importan y que se confunden todo el tiempo:
   pagando, canceló pero le quedan días, y se acabó. */
function planEtiqueta() {
  if (!PLAN.pro) {
    if (PLAN.compro && PLAN.compro !== "libre") return "Tu plan " + (PLANES[PLAN.compro] || {}).nombre + " terminó";
    return "Gratuito";
  }
  if (PLAN.plan === "fundador") return "Fundador";
  if (!PLAN.renueva && PLAN.vence_el) {
    return "Plan " + (PLANES[PLAN.plan] || {}).nombre + ", hasta el " + fechaCorta(PLAN.vence_el);
  }
  if (PLAN.estado === "impago") return "Hay un problema con tu pago";
  return "Plan " + ((PLANES[PLAN.plan] || {}).nombre || PLAN.plan);
}

/* El año solo aparece cuando no es este. Un plan anual termina el año que
   viene, y «hasta el 14 de marzo» a secas hace dudar de cuál marzo; ponerlo
   siempre, en cambio, llena de ruido la frase del mensual, que es la que casi
   todo el mundo va a leer. */
function fechaCorta(iso) {
  try {
    const d = new Date(iso);
    const opciones = { day: "numeric", month: "long" };
    if (d.getFullYear() !== new Date().getFullYear()) opciones.year = "numeric";
    return d.toLocaleDateString("es-MX", opciones);
  } catch (e) {
    return "";
  }
}

/* ---- Pagar ----

   La app no cobra: le pide al servidor una dirección de stripe.com y lleva
   allí a la persona. Los datos de la tarjeta no pasan por Norata ni de paso,
   así que no hay nada sensible que pueda filtrarse desde aquí — que es justo
   el motivo de hacerlo así y no con un formulario propio. */
async function irAPagar(cual) {
  if (!PLANES[cual]) throw new Error("Ese plan no existe.");

  /* Sin cuenta no hay dónde aterrizar el pago. Se manda a entrar y se apunta
     qué quería comprar, para retomarlo al volver: perder la intención entre
     el registro y el pago es donde se cae la mitad de la gente. */
  if (typeof syncReady === "function" && !syncReady()) {
    try { sessionStorage.setItem("norata-comprar", cual); } catch (e) { /* da igual */ }
    throw new Error("Entra con tu cuenta y el pago sigue donde lo dejaste.");
  }

  const t = await sbToken();
  const res = await fetch(SB_URL + "/functions/v1/pagar", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + t,
      "apikey": SB_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ plan: cual })
  });
  const b = await res.json().catch(function () { return {}; });

  if (res.status === 404 || res.status === 503) {
    throw new Error("El pago todavía no está disponible. Falta muy poco.");
  }
  if (b.agotado) throw new Error("Los lugares de fundador ya se agotaron.");
  if (!res.ok || !b.url) throw new Error(b.error || "No se pudo abrir el pago.");

  /* `replace` y no `assign`: si vuelve con el botón de atrás, que no caiga
     otra vez en la página de cobro que acaba de abandonar. */
  location.replace(b.url);
}

/* Cancelar, cambiar de tarjeta, ver los recibos. Lo sirve Stripe entero.
   Cancelar tiene que poderse SIEMPRE, incluso el día que Norata esté caída;
   por eso no se reimplementa aquí. */
async function abrirPortalDePago() {
  const t = await sbToken();
  const res = await fetch(SB_URL + "/functions/v1/pagar", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + t,
      "apikey": SB_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ que: "portal" })
  });
  const b = await res.json().catch(function () { return {}; });
  if (!res.ok || !b.url) throw new Error(b.error || "No se pudo abrir tu suscripción.");
  location.replace(b.url);
}

/* Cuántos lugares de fundador quedan. Lo pinta la landing y también la propia
   app; se pregunta sin sesión porque es un número y no revela nada de nadie.
   Devuelve `null` si no se pudo saber, y quien lo pinte tiene que estar
   preparado para eso: es mejor no decir nada que decir «quedan 0» porque
   falló la red y espantar a quien iba a comprar. */
async function lugaresDeFundador() {
  try {
    const r = await sbFetch("/rest/v1/rpc/lugares_fundador", { method: "POST", body: "{}" });
    if (!r.ok || typeof r.body !== "number") return null;
    return r.body;
  } catch (e) {
    return null;
  }
}

/* ---- La vuelta ----

   Tres direcciones se cruzan por aquí:

     ?comprar=anual   llega desde la landing: alguien eligió plan allí
     ?pago=listo      vuelve de Stripe habiendo pagado
     ?pago=cancelado  vuelve de Stripe sin pagar

   Lo de `?comprar=` es lo que resuelve el problema de que la landing y la app
   sean dos sitios distintos: la landing no necesita saber nada de sesiones ni
   de Stripe, solo mandar a la app con el plan puesto en la dirección. */
function planAtenderDireccion() {
  const p = new URLSearchParams(location.search);
  const pago = p.get("pago");
  let comprar = p.get("comprar");

  /* Lo que quedó apuntado antes de mandar a alguien a crear su cuenta. */
  if (!comprar) {
    try {
      comprar = sessionStorage.getItem("norata-comprar");
      if (comprar) sessionStorage.removeItem("norata-comprar");
    } catch (e) { /* da igual */ }
  }

  /* Se limpia la dirección en cuanto se lee. Si no, recargar vuelve a
     disparar el aviso de «listo» y quien comparta el enlace manda a otro a
     una pantalla de pago que no pidió. */
  if (pago || p.get("comprar")) {
    p.delete("pago"); p.delete("comprar");
    const resto = p.toString();
    history.replaceState(null, "", location.pathname + (resto ? "?" + resto : "") + location.hash);
  }

  if (pago === "listo") {
    /* El aviso de Stripe y la vuelta de la persona son dos carreras
       distintas, y a veces gana ella: llega antes de que el webhook haya
       escrito la fila. Por eso se pregunta varias veces y espaciado, en vez
       de una y decir «no pagaste» a alguien que acaba de pagar. */
    planReintentar(0);
    return { pago: "listo" };
  }
  if (pago === "cancelado") return { pago: "cancelado" };
  if (comprar && PLANES[comprar]) return { comprar: comprar };
  return {};
}

/* Seis intentos: al momento, y luego 1, 2, 4, 8 y 16 segundos. Treinta y un
   segundos en total, que es de sobra para un webhook que normalmente tarda
   menos de uno. Se para en cuanto el plan ya está. */
function planReintentar(intento) {
  planCargar().then(function () {
    if (esPro()) {
      if (typeof showView === "function") showView(activeMainView || "summary");
      return;
    }
    if (intento >= 5) return;
    setTimeout(function () { planReintentar(intento + 1); }, Math.pow(2, intento) * 1000);
  });
}

/* ---- La pantalla de Ajustes ----

   Vive aquí y no en `09-inicio.js` con las demás por lo mismo que el panel de
   números vive en el suyo: todo lo que sabe de planes está en este archivo, y
   repartirlo obliga a acordarse de dos sitios cada vez que cambie un precio.

   Se dibuja con lo que ya está en memoria y NO pregunta al servidor: `PLAN` se
   cargó al arrancar. Entrar a Ajustes a cambiar la zona horaria no tiene por
   qué costar una llamada. */
function renderPanelPlan() {
  const caja = document.getElementById("panel-plan");
  if (!caja) return;

  /* Sin cuenta no hay plan que enseñar ni a quién cobrarle. Se dice y se
     ofrece la salida, en vez de pintar tres botones que van a fallar. */
  if (typeof syncReady === "function" && !syncReady()) {
    caja.innerHTML =
      `<h3>Tu plan</h3>
       <p class="settings-note">Norata funciona entera sin cuenta, y lo que llevas hecho es tuyo. Para tener un plan hace falta una, porque es donde se guarda.</p>
       <button class="btn btn-primary btn-block" onclick="abrirAjustes('cuenta')">Crear mi cuenta</button>`;
    return;
  }

  if (esPro()) {
    caja.innerHTML = `<h3>Tu plan</h3>` + planActivoHTML();
    return;
  }

  /* La versión libre también es un plan y se pinta como tal: la cabecera con
     su piedra, y debajo el detalle de lo que hay abierto ahora mismo. Antes
     aquí solo había un rótulo y un renglón, y las tres tarjetas de venta se
     llevaban la pantalla entera — así que la sección contestaba «qué te
     vendemos» y no «qué tienes», que es a lo que se entra. */
  caja.innerHTML =
    `<h3>Tu plan</h3>` +
    planCabeceraHTML() +
    planIncluyeHTML(false) +
    planCompararHTML() +
    `<h4 class="plan-h">Qué se abre con Pro</h4>
     <p class="settings-note">Las ramas que quieras, sin tope de talentos, el ático entero y los resúmenes del mes y del año. Lo que ya escribiste no se toca nunca: al cambiar de plan no se borra nada.</p>
     <div class="plan-cards">` +
    Object.keys(PLANES).map(k => planTarjetaHTML(k)).join("") +
    `</div>` +
    planLegalHTML();
}

/* ---- La cabecera: qué plan, cuánto cuesta y qué le pasa ----
   Los tres datos juntos y en ese orden. El precio no salía por ningún lado una
   vez pagado, que es justo cuando más se busca: quien entra aquí a los ocho
   meses viene casi siempre a acordarse de cuánto paga.

   El color lo decide `planTono()` y no esta función, para que la cabecera, la
   fila del índice y la chapa del mini menú no puedan discrepar. */
function planCabeceraHTML() {
  const libre = !PLAN.pro;
  const p = PLANES[PLAN.plan] || {};
  const tono = planTono();
  const clases = "plan-hoy" + (libre ? "" : " activo") + (tono ? " t-" + tono : "");

  let titulo, precio, nota;

  if (libre) {
    titulo = "Gratuito";
    precio = "Sin costo";
    if (PLAN.compro && PLAN.compro !== "libre") {
      nota = "Tu plan " + ((PLANES[PLAN.compro] || {}).nombre || PLAN.compro) +
        " terminó. No se borró nada: lo que pasa del plan Gratuito sigue a la vista, en solo lectura, y vuelve a moverse en cuanto renueves.";
    } else {
      nota = "Es tuyo para siempre y sin fecha. Norata entera funciona así; Pro solo quita los topes.";
    }
  } else {
    titulo = p.nombre || PLAN.plan;
    precio = PLAN.plan === "fundador" ? p.precio + ", una sola vez" : p.precio + " " + p.periodo;
    if (PLAN.estado === "impago") {
      nota = "No pudimos cobrar tu último recibo. Revisa tu tarjeta para que no se interrumpa; hay tres días de margen desde la fecha de cobro.";
    } else if (PLAN.plan === "fundador") {
      nota = "Lo pagaste una vez y es para siempre. No hay nada que renovar ni que cancelar.";
    } else if (!PLAN.renueva && PLAN.vence_el) {
      nota = "Cancelaste, y sigue funcionando hasta el " + fechaCorta(PLAN.vence_el) +
        ". Nada de lo tuyo se borra ese día: lo que pase de los topes se queda a la vista y en solo lectura.";
    } else if (PLAN.vence_el) {
      nota = "Se renueva por su cuenta el " + fechaCorta(PLAN.vence_el) + ", sin que tengas que hacer nada.";
    } else {
      nota = "Activo.";
    }
  }

  return `<div class="${clases}">
      <span class="plan-hoy-ic">${icon(planIcono(), 22)}</span>
      <span class="plan-hoy-tx">
        <span class="plan-hoy-t">${escapeHtml(titulo)}<i>${escapeHtml(precio)}</i></span>
        <span class="plan-hoy-s">${escapeHtml(nota)}</span>
      </span>
    </div>`;
}

/* ---- Qué hay abierto ----
   Los topes escritos con palabras, leídos de `LIMITES` y no copiados a mano:
   el día que suba el tope de talentos, esta lista sube sola. Copiarlos aquí
   sería crear la segunda verdad de la que avisa `LIMITES` allá arriba.

   Se pinta igual con plan y sin él, porque la pregunta es la misma. Lo único
   que cambia es de qué lado caen las respuestas. */
function planIncluyeHTML(pro) {
  const l = LIMITES[pro ? "pro" : "libre"];
  const filas = [
    ["Ramas de talentos", l.ramas === Infinity ? "Las que quieras" : (l.ramas === 1 ? "Una" : String(l.ramas))],
    ["Talentos por rama", l.talentos === Infinity ? "Sin tope" : String(l.talentos)],
    ["El ático", l.atico === Infinity ? "Todos los años" : "El año en curso"],
    ["Resúmenes", l.resumen.length > 1 ? "De la semana, del mes y del año" : "Solo el de la semana"],
    ["Apariencias", l.apariencia ? "Todas" : "Las paletas de color"],
    /* Estas dos no salen de `LIMITES` porque no tienen tope en ningún plan, y
       decirlo aquí es la mitad del mensaje: lo que se cobra no es la app, son
       los topes. Sin ellas la lista del plan libre parece una lista de peros. */
    ["Misiones, habilidades y proyectos", "Sin tope"],
    ["Sincronía entre dispositivos", "Incluida"]
  ];
  return `<h4 class="plan-h">${pro ? "Qué tienes abierto" : "Qué tienes ahora"}</h4>
    <dl class="plan-datos">` +
    filas.map(f => `<div><dt>${escapeHtml(f[0])}</dt><dd>${escapeHtml(f[1])}</dd></div>`).join("") +
    `</dl>`;
}

function planActivoHTML() {
  const p = PLANES[PLAN.plan] || {};

  /* Los dos datos que se buscan al entrar: cuánto se paga y cuándo toca. Van
     en su propia lista y no dentro del párrafo de la cabecera, porque un dato
     metido en una frase hay que leerse la frase entera para encontrarlo. */
  const filas = [["Qué pagas", PLAN.plan === "fundador" ? p.precio + ", una sola vez" : p.precio + " " + p.periodo]];
  if (PLAN.plan === "fundador") {
    filas.push(["Hasta cuándo", "Para siempre"]);
  } else if (PLAN.vence_el) {
    filas.push([PLAN.renueva ? "Siguiente cobro" : "Termina el", fechaCorta(PLAN.vence_el)]);
  }

  return planCabeceraHTML() +
    `<dl class="plan-datos">` +
    filas.map(f => `<div><dt>${escapeHtml(f[0])}</dt><dd>${escapeHtml(f[1])}</dd></div>`).join("") +
    `</dl>` +
    planIncluyeHTML(true) +
    planCompararHTML() +
    /* Fundador no tiene nada que gestionar —ni tarjeta que cambiar ni
       suscripción que cancelar—, pero sí recibos que mirar, así que el botón
       se queda para todos y solo cambia lo que promete. */
    `<button class="btn btn-soft btn-block" style="margin-top:14px" onclick="irAlPortal(this)">${
      PLAN.plan === "fundador" ? "Ver mi recibo" : "Editar suscripción"
    }</button>
     <p class="settings-note plan-pie">Lo abre Stripe, que es quien cobra: ahí se cambia la tarjeta, se ven los recibos y se cancela. Funciona aunque Norata esté caída.</p>` +
    planLegalHTML();
}

/* El rótulo de la tarjeta destacada. "El que sale mejor" sonaba a rebaja de
   tienda; y además señalaba al anual, que sale mejor solo si comparas mes
   contra mes. Fundador es el que recomendamos y el motivo es de otra clase:
   no es una suscripción.

   Aquí estaba también el contador de lugares (`#plan-cupo`), que pedía el
   número al servidor y lo pintaba. Se retira: el cupo no se hace público por
   ahora. `lugaresDeFundador()` se queda viva —la landing la usa— y la tarjeta
   sigue diciendo que el cupo existe, que es verdad, sin dar la cifra. */
function planTarjetaHTML(k) {
  const p = PLANES[k];
  return `<div class="plan-card${p.destacado ? " destacada" : ""}">
      ${p.destacado ? '<span class="plan-tag">Recomendado</span>' : ""}
      <span class="plan-n">${escapeHtml(p.nombre)}</span>
      <span class="plan-p">${escapeHtml(p.precio)} <i>${escapeHtml(p.periodo)}</i></span>
      <span class="plan-d">${escapeHtml(p.pie)}</span>
      <button class="btn ${p.destacado ? "btn-primary" : "btn-soft"} btn-block"
        onclick="irAPagarDesdeAjustes('${k}', this)">Elegir</button>
    </div>`;
}

/* ---- El pie legal ----
   Tres cosas que hay que decir donde se cobra, y que en una frase corrida se
   leen como relleno. En bolitas se leen como lo que son: tres hechos sueltos.
   Va en la sección de plan de los dos lados —quien ya paga tiene el mismo
   derecho a acordarse de que el IVA está dentro— y sale de una sola función
   para que no puedan acabar diciendo cosas distintas. */
function planLegalHTML() {
  const puntos = [
    "IVA incluido",
    "Pagos procesados por Stripe",
    "Datos cifrados de extremo a extremo"
  ];
  return `<p class="settings-note plan-legal">` +
    puntos.map(t => `<span>${escapeHtml(t)}</span>`).join("") +
    `</p>`;
}

/* ---- Comparar los planes ----

   Se despliega ahí mismo en vez de abrir una ventana. Una ventana obliga a
   inventar un piso nuevo, a acordarse de pararla y soltarla, y sobre todo a
   tapar justo las tarjetas de precio que la persona está comparando. Abierta
   aquí, la tabla y las tarjetas conviven y se puede ir y volver con la vista.

   La tabla no está escrita a mano: sale de `LIMITES`, que es lo que la app
   aplica de verdad. Una tabla comparativa escrita aparte es la forma más
   rápida de acabar prometiendo un tope que el código no respeta. */
let planComparando = false;

function planAlternarComparacion() {
  planComparando = !planComparando;
  renderPanelPlan();
  /* Se deja la tabla a la vista al abrirla: en el teléfono el botón puede
     quedar a media pantalla y lo que se despliega debajo nace fuera de ella. */
  if (planComparando) {
    const t = document.getElementById("plan-compara");
    if (t && t.scrollIntoView) t.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}

function planCompararHTML() {
  return `<button class="btn btn-soft btn-block plan-vs-btn" onclick="planAlternarComparacion()">${
    planComparando ? "Ocultar la comparación" : "Comparar los planes"
  }</button>` + (planComparando ? planTablaHTML() : "");
}

/* Las filas. Las cinco primeras las decide `LIMITES` y las demás son las que
   no tienen tope en ningún plan —que son la mitad del mensaje: lo que se cobra
   no es la app, son los topes—. Fundador copia la columna de Pro salvo donde
   se dice lo contrario, porque ES Pro: lo que cambia es cómo se paga. */
function planFilasComparadas() {
  const l = LIMITES.libre, p = LIMITES.pro;
  const ramas = (x) => x === Infinity ? "Las que quieras" : (x === 1 ? "Una" : String(x));
  const tope = (x) => x === Infinity ? "Sin tope" : String(x);
  const atico = (x) => x === Infinity ? "Todos los años" : "El año en curso";
  const resu = (x) => x.length > 1 ? "Semana, mes y año" : "Solo el de la semana";
  const apar = (x) => x ? "Todas" : "Solo las paletas de color";

  return [
    ["Ramas de talentos", ramas(l.ramas), ramas(p.ramas), ramas(p.ramas)],
    ["Talentos por rama", tope(l.talentos), tope(p.talentos), tope(p.talentos)],
    ["El ático", atico(l.atico), atico(p.atico), atico(p.atico)],
    ["Resúmenes", resu(l.resumen), resu(p.resumen), resu(p.resumen)],
    ["Apariencias", apar(l.apariencia), apar(p.apariencia), apar(p.apariencia)],
    ["Misiones, habilidades y proyectos", "Sin tope", "Sin tope", "Sin tope"],
    ["Sincronía entre dispositivos", "Incluida", "Incluida", "Incluida"],
    ["Tu progreso y tu XP", "Tuyos", "Tuyos", "Tuyos"],
    ["Cómo se paga", "No se paga", "Suscripción", "Una sola vez"],
    /* El distintivo de fundador existe hoy y no es una promesa: el anillo
       dorado alrededor del círculo de la cuenta y la piedra con corona en vez
       de la tallada. Si algún día se le añade algo más, se añade aquí. */
    ["Distintivo de fundador", "—", "—", "Anillo dorado y piedra con corona"]
  ];
}

function planTablaHTML() {
  const cols = ["Gratuito", "Pro", "Fundador"];
  return `<div class="plan-vs" id="plan-compara">
      <table>
        <thead><tr><th></th>${cols.map(c => `<th>${escapeHtml(c)}</th>`).join("")}</tr></thead>
        <tbody>` +
    planFilasComparadas().map(f =>
      `<tr><th scope="row">${escapeHtml(f[0])}</th>` +
      f.slice(1).map(v => `<td>${escapeHtml(v)}</td>`).join("") +
      `</tr>`).join("") +
    `</tbody>
      </table>
    </div>`;
}

/* Los dos botones desactivan mientras esperan. Sin esto, el segundo entra a
   Stripe llevándose por delante al primero: la respuesta tarda un segundo
   largo y un segundo largo con un botón que no reacciona invita a insistir. */
async function irAPagarDesdeAjustes(cual, btn) {
  const antes = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Abriendo…";
  try {
    await irAPagar(cual);
  } catch (e) {
    toast(e.message, "aviso");
    btn.disabled = false;
    btn.textContent = antes;
  }
}

async function irAlPortal(btn) {
  const antes = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Abriendo…";
  try {
    await abrirPortalDePago();
  } catch (e) {
    toast(e.message, "aviso");
    btn.disabled = false;
    btn.textContent = antes;
  }
}
