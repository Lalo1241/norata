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
/* ---- Cómo se LLAMA el plan de pago ----
   «Pro» a secas no es un nombre, es un adjetivo, y en la pantalla donde
   alguien lo ve por primera vez no se sostiene solo: no es Disney+ ni Spotify
   Premium, marcas que ya significan algo antes de leer la frase. Un botón que
   dice «Quiero Pro» le pide a la persona que adivine de qué producto le están
   hablando justo en el segundo en que decide si paga. Lo cazó Eduardo leyendo
   el cuadro del tope: «Pro solo se siente como nada».

   Así que el nombre completo se usa donde se PRESENTA —el cuadro del tope, el
   botón, el rótulo de la lista— y «Pro» a secas se queda donde el contexto ya
   lo dijo: dentro de la pantalla del plan, donde las tarjetas y la tabla ya
   están hablando de esto y repetir «Norata» cuatro veces suena a folleto.

   En una constante y no escrito a mano en cada sitio, por lo de siempre: el
   día que cambie el nombre, cambia aquí. */
const NOMBRE_PRO = "Norata Pro";

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
    pie: "Dos meses de regalo frente al mensual.",
    /* El recomendado vuelve a ser este. De los que se renuevan es el que sale
       mejor, y esa es una comparación que se puede hacer: mes contra mes. */
    tag: "Recomendado",
    destacado: true
  },
  fundador: {
    nombre: "Fundador",
    precio: "$890 MXN",
    periodo: "una sola vez",
    pie: "Pago único. No se renueva ni se cancela: es tuyo y ya.",
    /* Destacado también, pero diciendo otra cosa y en otro color. «Recomendado»
       y «Tiempo limitado» no compiten: el primero responde «¿cuál me conviene?»
       y el segundo «¿hasta cuándo puedo?». Con la misma palabra y el mismo
       tono se leerían como el mismo mensaje repetido, y una de las dos
       tarjetas sobraría. */
    tag: "Tiempo limitado",
    limitado: true,
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
     resumen    qué informes ve. La llave se sigue llamando `resumen`
                porque así nació y renombrarla obligaría a migrar los planes
                ya guardados; en pantalla se llaman informes
     apariencia si puede usar las apariencias completas */
const LIMITES = {
  libre: {
    ramas: 1,
    /* Doce, y no quince o veinte. Le advertí que doce se tocan en semanas y
       que eso convierte lo gratis en una prueba más que en una app; lo dejó
       en doce a sabiendas. Los dos límites van juntos porque limitar ramas
       sin limitar talentos invita a meter todo en una y no pagar nunca. */
    talentos: 12,
    /* Vacío, y es un cambio de reparto que Eduardo cerró el 27 ago 2026: el
       panel de cada módulo ya ES el informe del día, así que un informe
       diario no añadiría nada; y de la semana en adelante se paga. Antes esta
       lista decía `["semana"]` y la tabla de precios prometía el resumen
       semanal gratis — una promesa que nunca llegó a existir en pantalla, así
       que nadie pierde nada al moverla. Quien no paga no se topa con un muro:
       ve la portada de su propia semana con sus números de verdad. */
    resumen: [],
    apariencia: false
  },
  pro: {
    ramas: Infinity,
    talentos: Infinity,
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
   de más siguen sin poder crearse contra la base de datos, y al recargar sin
   la marca puesta la mentira se cae sola. Quien
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
/* El plan de la cuenta administradora. No se compró: se tiene por ser quien
   sostiene esto, y por un motivo práctico —hay que poder mirar la app entera
   sin toparse con los topes cada dos pantallas—.

   NO se le pone una fila en `suscripciones`, que sería la otra forma de
   hacerlo, y el motivo es que ensuciaría los números del propio negocio: esa
   fila contaría como una venta en el MRR, sumaría uno a «pagando ahora» y
   **gastaría uno de los 200 lugares de fundador**. Un plan regalado no es una
   venta y no puede parecerlo en el panel donde se mira si esto se sostiene.

   `deCasa` lo distingue de un fundador de verdad, para que la pantalla del
   plan no le diga que pagó $890 cuando no los pagó. */
const PLAN_DE_CASA = {
  plan: "fundador", pro: true, estado: "activa",
  vence_el: null, renueva: false, compro: "fundador", deCasa: true
};

function planConSimulacion(real) {
  const cual = planLeerSimulado();

  /* Sin simulación puesta, la cuenta administradora ve Fundador. Va DESPUÉS de
     mirar la simulación a propósito: si está probando cómo se ve el plan
     Gratuito, lo que manda es la prueba — si no, la trastienda no podría
     mirar nunca la app como la ve todo el mundo. */
  if (!cual) {
    if (typeof esAdmin !== "undefined" && esAdmin && !real.pro) return PLAN_DE_CASA;
    return real;
  }
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

/* Volver a decidir qué plan se enseña, sin preguntarle nada al servidor. La
   llama `revisarAdmin` cuando el servidor contesta que sí: esa respuesta llega
   después de `planCargar`, así que sin esto la cuenta administradora se
   quedaba con el plan que tuviera hasta la siguiente recarga. */
function planRefrescar() {
  PLAN = planConSimulacion(PLAN_REAL || PLAN);
  if (typeof renderAjustes === "function") renderAjustes();
  if (typeof renderPanelPlan === "function") renderPanelPlan();
  if (typeof showView === "function" && typeof activeMainView !== "undefined") {
    showView(activeMainView || "summary");
  }
}

/* Cambiar de plan simulado. No vuelve a preguntar al servidor: `PLAN_REAL` ya
   tiene la respuesta y pedirla otra vez por cambiar de vista sería pagar un
   viaje por nada.

   Repinta TODO y no solo la sección del plan: lo que se viene a mirar aquí es
   cómo se comporta la app entera —el árbol con una rama, los avisos de tope—, y dejar el Resumen dibujado con el plan anterior
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
function topeTexto(clave) {
  if (clave === "ramas") {
    return {
      titulo: "Tu árbol pide otra rama",
      frase: "Llenaste la primera. Con " + NOMBRE_PRO + " abres las que quieras, y cada una lleva su propio camino."
    };
  }
  if (clave === "talentos") {
    /* El número sale de `LIMITES` y no escrito a mano. Es donde más tienta
       copiarlo —está dentro de una frase, no de una tabla— y por eso se dice:
       el día que doce sean quince, esta frase seguiría diciendo doce. */
    return {
      titulo: "Llenaste esta rama",
      frase: "Los " + LIMITES.libre.talentos + " talentos del plan Gratuito, completos. " +
        "Con " + NOMBRE_PRO + " esta rama sigue creciendo sin contar."
    };
  }
  if (clave === "resumen") {
    return {
      titulo: "Tu semana, de un vistazo",
      frase: "Tu día lo ves siempre en el panel de cada módulo. Los informes empiezan en la semana y vienen con " + NOMBRE_PRO + "."
    };
  }
  if (clave === "apariencia") {
    return {
      titulo: "Norata con otra piel",
      frase: "Las paletas de color son de todos. Las apariencias completas vienen con " + NOMBRE_PRO + "."
    };
  }
  return { titulo: "Esto viene con " + NOMBRE_PRO, frase: "Tu plan Gratuito no incluye esta parte." };
}

/* La frase suelta, sin título, para quien solo necesite el texto. Se queda
   porque el mensaje sigue siendo uno y este sigue siendo su sitio. */
function planMensaje(clave) {
  return topeTexto(clave).frase;
}

/* Lo que se abre al pagar, en cuatro renglones. No está escrito a mano: sale
   de comparar `LIMITES.pro` con `LIMITES.libre`, igual que la tabla
   comparativa. Escribirlo suelto habría creado la segunda verdad de la que
   avisa `LIMITES` allá arriba, y de todos los sitios donde puede aparecer una
   mentira este es el peor: es el único que se lee con la cartera en la mano. */
function ventajasPro() {
  const l = LIMITES.libre, p = LIMITES.pro, v = [];
  /* Ramas y talentos van en DOS renglones y no en uno. Iban juntos —"Ramas
     y talentos sin tope"— y era la línea que más pesa contada de la forma
     más floja: una sola viñeta para las dos cosas que de verdad se compran
     hoy. Separadas se leen dos, que es lo que son, y cada una dice contra
     qué número choca la persona en este momento.

     Y "ilimitadas" en vez de "sin tope", que lo pidió Eduardo: "sin tope"
     describe la ausencia de una traba —habla del límite, no de lo que
     abres— y en una lista que existe para convencer, cada renglón tiene que
     decir lo que ganas. */
  if (p.ramas > l.ramas) v.push("Ramas de talentos ilimitadas");
  if (p.talentos > l.talentos) v.push("Talentos ilimitados en cada rama");
  if (p.resumen.length > l.resumen.length) v.push("Informes de la semana, del mes y del año");
  if (p.apariencia && !l.apariencia) v.push("Todas las apariencias");
  return v;
}

/* Lo que se HACE cuando alguien topa con un límite, y el único sitio desde el
   que se hace. Existe porque durante varias versiones `cabeUnoMas` y
   `planMensaje` estaban escritas y funcionando pero NADIE las llamaba: los
   topes del plan Gratuito estaban decididos, documentados y pintados en la
   tabla comparativa, y la app dejaba crear sin mirar. Se descubrió probando,
   no leyendo, que es como se descubren siempre estas cosas.

   Devuelve una promesa que nadie tiene que esperar: quien llama ya decidió
   parar, y lo que pasa después —el aviso, e ir o no a ver Pro— no cambia lo
   que hace el que llamó.

   Es un aviso, no una regañina: dice qué hay y por dónde se sigue. Y no es
   seguridad —eso vive en `supabase/planes.sql`—; es no ofrecer una puerta que
   no está abierta.

   Lo que cambió en 0.7.18.1: este cuadro aparece en el instante de mayor
   intención de compra que va a tener Norata —alguien que está usando la app,
   tiene un plan en la cabeza y quiere seguir AHORA— y lo contestaba con una
   ficha técnica dentro del mismo `ask()` que confirma un borrado. La misma
   caja y los mismos dos botones para "¿seguro que quieres eliminar esto?" y
   para pedir dinero. Ahora trae título, lo que abre y el precio. */
function topeAlcanzado(clave) {
  const t = topeTexto(clave);
  /* Todo va en `<span>` y ninguno es `<p>` ni `<ul>`, aunque un párrafo y una
     lista sea exactamente lo que son. El motivo es del marcado, no del
     diseño: `#modal-msg` ES un `<p>` —vive en index.html—, y un `<p>` o un
     `<ul>` dentro de otro `<p>` el navegador los saca fuera al vuelo: el
     cuadro se desarma solo y no hay nada en el CSS que lo explique. El truco
     ya estaba en casa, `askText` mete su título con `<b style="display:block">`
     por lo mismo. */
  const cuerpo =
    '<span class="tope-frase">' + escapeHtml(t.frase) + '</span>' +
    /* La lista llevaba tres palomitas y ningún rótulo encima, así que no
       decía de QUÉ eran: se leían como características sueltas del cuadro y
       no como lo que abre pagar. Un renglón lo arregla, y de paso es donde
       el nombre del producto aparece por primera vez. */
    '<span class="tope-tit">Lo que abre ' + escapeHtml(NOMBRE_PRO) + '</span>' +
    '<span class="tope-lista">' +
      ventajasPro().map(function (v) {
        return '<span class="tope-item">' + icon("check", 15) +
               '<span>' + escapeHtml(v) + '</span></span>';
      }).join("") +
    '</span>' +
    /* El precio va DENTRO del cuadro y no al otro lado del botón. Un botón que
       dice "Ver Pro" sin decir cuánto cuesta se lee como "te llevo a una
       página donde por fin te digo la cifra", y esa sospecha frena más que el
       propio precio. Sale de `PLANES` por lo mismo que las ventajas salen de
       `LIMITES`. */
    '<span class="tope-precio">Desde ' + escapeHtml(PLANES.mensual.precio) +
    ' al mes. Cancelas cuando quieras.</span>';
  /* `danger` y `alarm` en false a propósito, y es la decisión de fondo de todo
     este cuadro: aquí no se rompió nada. Alguien llenó una rama, que es un
     logro. El temblor y el coral son para lo que se pierde. */
  return askBase(cuerpo, true, "Quiero " + NOMBRE_PRO, false, false, "Ahora no",
                 { icono: "crown", titulo: t.titulo, tono: "menta" }).then(ok => {
    if (ok && typeof abrirAjustes === "function") abrirAjustes("plan");
  });
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
  /* Fundador tiene color propio y ya no comparte el de los avisos. El amarillo
     significa «mira esto» en toda la app —un plan que se cancela, un recibo
     que no se pudo cobrar, la trastienda— y usarlo también para el plan bueno
     obligaba a leer el contexto para saber si era premio o problema. */
  if (planNivel() === "fundador") return "lila";
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
      compraPintar("listo");
      return;
    }
    if (intento >= 5) { compraPintar("tarda"); return; }
    setTimeout(function () { planReintentar(intento + 1); }, Math.pow(2, intento) * 1000);
  });
}

/* ================= Volver de pagar =================

   Hay una carrera de verdad aquí, y es la razón de que esta pantalla tenga
   dos estados en vez de uno. Stripe manda su aviso al servidor por un lado y
   devuelve a la persona a la app por otro, y a veces gana ella: llega antes de
   que el webhook haya escrito la fila. Pintar «ya está» en ese momento sería
   mentir, y pintar «no pagaste» a quien acaba de pagar es peor todavía.

   Así que se abre diciendo que se está confirmando, y `planReintentar` la
   cambia cuando sabe algo. Si a los treinta y un segundos el aviso no ha
   llegado, se dice eso mismo —sin alarmar, porque el cobro sí se hizo y lo que
   falta es que dos servidores se pongan de acuerdo. */
function compraAbrir() {
  const caja = document.getElementById("compra");
  if (!caja) return;
  caja.classList.add("show");
  compraPintar("esperando");
}

function compraCerrar() {
  const caja = document.getElementById("compra");
  if (caja) caja.classList.remove("show");
}

function compraPintar(estado) {
  const caja = document.getElementById("compra");
  if (!caja || !caja.classList.contains("show")) return;

  const dentro = caja.querySelector(".compra-caja");
  const ic = document.getElementById("compra-ic");
  const tit = document.getElementById("compra-tit");
  const sub = document.getElementById("compra-sub");
  const lista = document.getElementById("compra-lista");
  const botones = document.getElementById("compra-botones");

  const fundador = PLAN.plan === "fundador";
  dentro.classList.toggle("lila", estado === "listo" && fundador);
  dentro.classList.toggle("compra-esperando", estado !== "listo");

  if (estado === "esperando") {
    ic.innerHTML = '<span class="btn-rueda" aria-hidden="true" style="width:28px;height:28px;margin:0"></span>';
    tit.textContent = "Confirmando tu pago";
    sub.textContent = "Stripe ya cobró. Estamos esperando su aviso para encender tu plan; suele tardar un par de segundos.";
    lista.innerHTML = "";
    botones.innerHTML = "";
    return;
  }

  if (estado === "tarda") {
    ic.innerHTML = icon("bulb", 34);
    tit.textContent = "Tu pago se registró";
    sub.textContent = "El aviso de Stripe está tardando más de lo normal. Tu plan se encenderá solo en cuanto llegue: no hay que volver a pagar ni hacer nada. Si al recargar la app en unos minutos sigue igual, escríbenos.";
    lista.innerHTML = "";
    botones.innerHTML = '<button class="btn btn-soft btn-block" onclick="compraCerrar()">Entendido</button>';
    return;
  }

  /* Listo. El nombre del plan y la piedra que le toca, y debajo lo que se
     acaba de abrir — leído de `LIMITES`, como todo lo demás. */
  const p = PLANES[PLAN.plan] || {};
  ic.innerHTML = icon(planIcono(), 34);
  tit.textContent = fundador ? "Ya eres fundador" : "Ya tienes " + (p.nombre || "Pro");
  sub.textContent = fundador
    ? "Pago único, sin fecha y sin renovaciones. Tu lugar está guardado y la app queda abierta entera."
    : "Tu plan está activo. Todo lo que sigue ya está encendido, y lo que tenías escrito sigue donde estaba.";

  const l = LIMITES.pro;
  const abiertas = [
    l.ramas === Infinity ? "Las ramas de talentos que quieras" : "Más ramas de talentos",
    l.talentos === Infinity ? "Talentos sin tope dentro de cada rama" : "Más talentos por rama",
    "Los resúmenes del mes y del año",
    "Todas las apariencias"
  ];
  if (fundador) abiertas.push("Tu distintivo: el anillo lila y la piedra con corona");

  lista.className = "compra-lista";
  lista.innerHTML = abiertas.map(t =>
    `<div>${icon("check", 16)}<span>${escapeHtml(t)}</span></div>`).join("");

  botones.innerHTML =
    '<button class="btn btn-primary btn-block" onclick="compraCerrar()">Empezar</button>' +
    '<button class="btn btn-ghost btn-block" onclick="compraCerrar(); abrirAjustes(\'plan\')">Ver mi plan</button>';
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

  /* La versión libre contesta UNA pregunta, no dos.

     Aquí había cuatro bloques seguidos: la cabecera, la lista de seis
     renglones con los topes, el botón de comparar y las tarjetas de precio.
     Entre la lista y la tabla comparativa se decía lo MISMO dos veces con
     otras palabras, y el precio —lo único que hay que decidir en esta
     pantalla— quedaba al final, después de dos bloques de lectura.

     Ahora: dónde vas contra el tope, el precio, y la tabla al pie para quien
     quiera el detalle. `planIncluyeHTML` sigue viva y sigue pintándose para
     quien YA paga, que es donde contesta la pregunta correcta —qué tengo
     abierto—; aquí sus datos viven dentro de las tarjetas, dichos como lo que
     ganas y no como inventario de lo que te falta.

     El bloque de topes manda sobre la cabecera y no se suma a ella: dice el
     plan en el que estás dentro de su propio cierre, así que las dos juntas
     serían el nombre del plan escrito dos veces con dos centímetros de
     separación. Cuando no aprieta ningún tope no sale, y entonces la cabecera
     vuelve a su sitio. */
  const topes = planTopesHTML();
  caja.innerHTML =
    `<h3>Tu plan</h3>` +
    (topes || planCabeceraHTML()) +
    `<h4 class="plan-h">Quita los topes</h4>
     <p class="settings-note">Las ramas que quieras y sin tope de talentos dentro de cada una. Lo que ya escribiste no se toca nunca: al cambiar de plan no se borra nada.</p>` +
    planTarjetasHTML() +
    planLegalHTML() +
    planCompararHTML();

  /* El mapa de la rama se termina de encuadrar aquí, cuando ya está en la
     página y se le puede medir el hueco. Ver `planAjustarLienzos`. */
  planAjustarLienzos(caja);
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
    if (PLAN.deCasa) {
      /* Ni «lo pagaste» ni un precio: no lo pagó. Decírselo bien cuesta una
         línea y evita que la única pantalla que habla de dinero mienta. */
      precio = "Cuenta administradora";
      nota = "Tienes Norata entera abierta por sostenerla, no por una compra. No hay ningún cobro asociado a esta cuenta.";
    } else if (PLAN.estado === "impago") {
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

  /* El precio ya NO va en la cabecera cuando debajo hay un recibo que lo dice:
     salía «$890 MXN, una sola vez» aquí y «Qué pagas · $890 MXN, una sola vez»
     tres centímetros más abajo. Repetido así no informa dos veces, ensucia una
     — el ojo lo lee, lo reconoce y no sabe por qué está otra vez.

     La cabecera se queda con lo suyo: qué plan es y qué le pasa. La cifra vive
     en los renglones de recibo, que es donde se buscan las cifras.

     Sigue saliendo aquí en los dos casos que NO tienen recibo debajo: el plan
     Gratuito («Sin costo») y la cuenta de casa («Cuenta administradora»), que
     no son precios sino la respuesta a «¿y esto qué me cuesta?». */
  const conRecibo = PLAN.pro && !PLAN.deCasa;

  return `<div class="${clases}">
      <span class="plan-hoy-ic">${icon(planIcono(), 22)}</span>
      <span class="plan-hoy-tx">
        <span class="plan-hoy-t">${escapeHtml(titulo)}${conRecibo ? "" : `<i>${escapeHtml(precio)}</i>`}</span>
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
    ["Ramas de talentos", l.ramas === Infinity ? "Ilimitadas" : (l.ramas === 1 ? "Una" : String(l.ramas))],
    ["Talentos por rama", l.talentos === Infinity ? "Ilimitados" : String(l.talentos)],
    ["Informes", l.resumen.length ? "De la semana, del mes y del año" : "El panel de tu día"],
    ["Apariencias", l.apariencia ? "Todas" : "Las paletas de color"],
    /* Estas dos no salen de `LIMITES` porque no tienen tope en ningún plan, y
       decirlo aquí es la mitad del mensaje: lo que se cobra no es la app, son
       los topes. Sin ellas la lista del plan libre parece una lista de peros. */
    ["Misiones, habilidades y proyectos", "Ilimitados"],
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
  /* La cuenta de casa no tiene recibo que enseñar ni fecha que mirar, así que
     no se le pinta la lista: dos renglones diciendo «—» ocupan lo mismo que
     dos renglones diciendo algo. */
  const filas = PLAN.deCasa ? [] :
    [["Qué pagas", PLAN.plan === "fundador" ? p.precio + ", una sola vez" : p.precio + " " + p.periodo]];
  if (PLAN.deCasa) {
    /* nada */
  } else if (PLAN.plan === "fundador") {
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
    (PLAN.deCasa ? "" :
      `<button class="btn ${PLAN.plan === "fundador" ? "btn-linea" : "btn-aviso"} btn-block" style="margin-top:14px" onclick="irAlPortal(this)">${
        PLAN.plan === "fundador" ? "Ver mi recibo" : "Editar suscripción"
      }</button>
       ` + planPortalNotaHTML());
}

/* El rótulo de la tarjeta destacada. "El que sale mejor" sonaba a rebaja de
   tienda; y además señalaba al anual, que sale mejor solo si comparas mes
   contra mes. Fundador es el que recomendamos y el motivo es de otra clase:
   no es una suscripción.

   Aquí estaba también el contador de lugares (`#plan-cupo`), que pedía el
   número al servidor y lo pintaba. Se retira: el cupo no se hace público por
   ahora. `lugaresDeFundador()` se queda viva —la landing la usa— y la tarjeta
   sigue diciendo que el cupo existe, que es verdad, sin dar la cifra. */
/* Cada cuánto se cobra Pro. En una variable y no en tres tarjetas, porque
   mensual y anual NO son dos planes: son el mismo Pro cobrado con otro ritmo,
   y eso ya lo dice `LIMITES`, que tiene dos entradas y no tres. Puestos como
   tres tarjetas iguales, la pantalla contaba tres cosas que elegir cuando solo
   hay dos, y la tercera decisión —¿me conviene el anual?— se resolvía
   comparando dos precios que no estaban en la misma frase.

   Arranca en MENSUAL a propósito, aunque el anual salga mejor y sea el que
   recomendamos de los dos: una pantalla que aparece con la opción más cara ya
   elegida es la clase de detalle que se nota y que hace desconfiar del resto.
   El incentivo se dice en el conmutador —dos meses gratis— y quien lo quiera
   lo toca. */
let planPeriodo = "mensual";

function planCambiarPeriodo(cual) {
  if (planPeriodo === cual) return;
  planPeriodo = cual;
  renderPanelPlan();
}

/* El ahorro del anual va en MESES y no en porcentaje. Lo eligió Eduardo: el
   29% hay que traducirlo antes de que signifique algo, y «dos meses gratis»
   se entiende sin hacer ninguna cuenta. */
function planConmutadorHTML() {
  const uno = (k, texto, extra) =>
    `<button type="button" class="plan-per${planPeriodo === k ? " on" : ""}"
       onclick="planCambiarPeriodo('${k}')"${planPeriodo === k ? ` aria-current="true"` : ""}>${
      escapeHtml(texto)}${extra ? `<i>${escapeHtml(extra)}</i>` : ""}</button>`;
  return `<div class="plan-per-wrap" role="group" aria-label="Cada cuánto se cobra Pro">${
    uno("mensual", "Mensual")}${uno("anual", "Anual", "2 meses gratis")}</div>`;
}

/* Las dos tarjetas. Las ventajas van DENTRO y salen de `ventajasPro()`, que
   las calcula comparando `LIMITES.pro` con `LIMITES.libre`: son las mismas que
   ya usaba el aviso de tope, así que no pueden acabar prometiendo cosas
   distintas en dos pantallas.

   Fundador no lleva ventajas calculadas porque las suyas no son topes: es Pro
   con otra forma de pagarse, más lo que se ve. Por eso su lista es corta y
   escrita, y por eso su etiqueta dice otra cosa que la de Pro. */
function planTarjetasHTML() {
  const p = PLANES[planPeriodo], f = PLANES.fundador;
  const vent = (lista) => `<ul class="plan-vent">` +
    lista.map(t => `<li>${escapeHtml(t)}</li>`).join("") + `</ul>`;

  return `<div class="plan-cards dos">
      <div class="plan-card destacada">
        ${planConmutadorHTML()}
        <span class="plan-n">${escapeHtml(NOMBRE_PRO)}</span>
        <span class="plan-p">${escapeHtml(p.precio)} <i>${escapeHtml(p.periodo)}</i></span>
        <span class="plan-d">${escapeHtml(p.pie)}</span>
        ${vent(ventajasPro())}
        <button class="btn btn-primary btn-block"
          onclick="irAPagarDesdeAjustes('${planPeriodo}', this)">Pasar a Plan Pro</button>
      </div>
      <div class="plan-card limitada">
        <span class="plan-tag lila">${escapeHtml(f.tag)}</span>
        <!-- El hueco del conmutador. Fundador no se cobra de dos maneras, pero
             si no se le reserva la fila, su nombre y su precio quedan una
             franja mas arriba que los de Pro y las dos tarjetas dejan de
             leerse como una comparacion. Solo cuando estan lado a lado: en el
             telefono van una debajo de otra y ahi el hueco seria un vacio. -->
        <span class="plan-hueco" aria-hidden="true"></span>
        <span class="plan-n">${escapeHtml(f.nombre)}</span>
        <span class="plan-p">${escapeHtml(f.precio)} <i>${escapeHtml(f.periodo)}</i></span>
        <span class="plan-d">${escapeHtml(f.pie)}</span>
        ${vent(["Todo lo de Pro, sin fecha", "Anillo lila y piedra con corona"])}
        <button class="btn btn-primary btn-block"
          onclick="irAPagarDesdeAjustes('fundador', this)">Pasar a ser Fundador</button>
      </div>
    </div>`;
}

/* ================= Dónde vas contra el tope =================

   El argumento más fuerte para pagar no está en el folleto: está en los datos
   de quien mira. «Ya llenaste tu única rama» pesa más que «ramas ilimitadas»,
   porque lo segundo hay que imaginárselo y lo primero ya te pasó.

   Tres decisiones que no se deshacen sin volver a discutirlas:

   1. **Solo sale cuando aprieta.** Con 2 de 12 el mensaje sería «te falta
      mucho»: verdad, pero no dice nada, y ocupa el sitio del precio. Peor
      todavía, una cuenta recién creada estrenaría Norata mirando un contador
      de lo que no tiene. Sale a partir de `PLAN_AVISA_DESDE`.

   2. **El conteo dice lo que QUEDA, nunca lo gastado.** «Te quedan 3», y que
      llegue a cero es el mensaje, no un caso raro que haya que esquivar.

   3. **Un hueco vacío solo se dibuja si existe.** Esto empezó siendo un fallo:
      se pintaban dos cuadros de rama —uno lleno y uno por abrir— cuando el
      plan Gratuito da UNA. Ese hueco prometía una rama que no está. Con una
      sola rama se pinta un cuadro, lleno, con su nombre dentro, y el conteo
      dice cero. */

/* Cuántos huecos tienen que quedar para que valga la pena decirlo. */
const PLAN_AVISA_DESDE = 3;

/* Cuántos llenos se ven cuando hay muchos. El resto se los come el degradado
   de la izquierda, que es lo que dice «hay más» sin tener que dibujarlos: con
   el tope en 12 se pintaban doce cuadritos, y el día que el tope suba a 30
   serían treinta. Lo que hay que contar es siempre lo de la derecha. */
const PLAN_NODOS_VISTOS = 3;
const PLAN_NODOS_SIN_RECORTE = 6;

/* Lo que sabemos del tope ahora mismo, o `null` si no hay nada que decir.
   Devuelve la rama MÁS LLENA y no todas: enseñar seis ramas con sus seis
   cuentas convierte un argumento en una tabla, y la que aprieta es una sola. */
function planTopeDatos() {
  if (PLAN.pro) return null;
  if (typeof ramasDe !== "function" || typeof talentosDeRama !== "function") return null;

  const ramas = ramasDe("perks");
  if (!ramas.length) return null;      // sin árbol no hay tope que doler

  let rama = null, llenos = -1;
  ramas.forEach(b => {
    const n = talentosDeRama(b).length;
    if (n > llenos) { rama = b; llenos = n; }
  });

  const topeT = LIMITES.libre.talentos, topeR = LIMITES.libre.ramas;
  const quedanT = topeT === Infinity ? Infinity : Math.max(0, topeT - llenos);
  const quedanR = topeR === Infinity ? Infinity : Math.max(0, topeR - ramas.length);

  /* Dispara SOLO el tope de talentos. El de ramas está a cero desde el primer
     día —el plan da una— así que si contara, el bloque saldría siempre y
     dejaría de significar nada. Que no haya sitio para otra rama se dice
     cuando alguien intenta crearla, que es `topeAlcanzado("ramas")`. */
  if (!(quedanT <= PLAN_AVISA_DESDE)) return null;

  return { ramas, rama, llenos, quedanT, quedanR, topeT, topeR };
}

/* La fila de cuadritos. `recorta` no depende del tope sino de cuántos hay:
   con seis o menos caben todos y el degradado sobraría. */
function planNodosHTML(llenos, quedan) {
  const recorta = llenos > PLAN_NODOS_SIN_RECORTE;
  const dibuja = recorta ? PLAN_NODOS_VISTOS : llenos;
  const huecos = quedan === Infinity ? 0 : quedan;
  return `<div class="plan-fila${recorta ? " mas" : ""}" aria-hidden="true">` +
    `<i></i>`.repeat(dibuja) +
    `<i class="off"></i>`.repeat(huecos) +
    `</div>`;
}

/* Las ramas no son cuadritos anónimos: son pocas y tienen nombre, y un
   cuadrado sin nombre desperdicia el único dato que las distingue. */
function planChipsRamasHTML(ramas, quedan) {
  const recorta = ramas.length > PLAN_NODOS_VISTOS;
  const ver = recorta ? ramas.slice(-PLAN_NODOS_VISTOS) : ramas;
  const huecos = quedan === Infinity ? 0 : quedan;
  return `<div class="plan-fila${recorta ? " mas" : ""}">` +
    ver.map(b => `<b class="plan-chip">${escapeHtml(b)}</b>`).join("") +
    `<b class="plan-chip off" aria-hidden="true"></b>`.repeat(huecos) +
    `</div>`;
}

/* ---- El dibujo de la rama ----
   El mismo mapa de Talentos, en pequeño. No es una ilustración de «un árbol»:
   son TUS nodos en las posiciones en las que los dejaste, así que una rama
   ancha y una rama alta no se ven igual y la tuya se reconoce.

   Dos reglas que lo mantienen honesto:

   · **Nunca se estira.** Se elige una escala y se recorta lo que no cabe,
     porque una rama larga metida a la fuerza en un recuadro apaisado sale
     deformada y deja de parecerse a la que la persona conoce.
   · **Se recorta por la IZQUIERDA**, que es donde ya no hay nada que decidir.
     A la derecha se quedan las puntas y los sitios donde todavía puede crecer.

   Se apoya en `branchLayout` de `07-lienzo.js`, que es quien decide dónde cae
   cada nodo en el mapa de verdad. Copiar aquí ese reparto habría creado un
   dibujo que se parece al árbol hasta el día que el árbol cambie. */
/* La franja es baja a proposito. Empezo en 108 px y ocupaba mas que el
   argumento que ilustra: el mapa es la prueba de que la rama es tuya, no el
   protagonista de la pantalla. Bajarla no encoge los nodos —el radio se
   calcula en pixeles y se convierte a unidades del mapa, asi que un nodo mide
   lo mismo con cualquier altura—; lo que cambia es cuanto mapa se ve. */
const PLAN_SVG_H = 76;

/* El ancho del recuadro NO se adivina: se mide.

   Estuvo adivinado —620 px en escritorio, 264 en teléfono— y el fallo fue
   justo el que avisaba el comentario de entonces: en una ventana de 1100 px
   el hueco real era bastante más estrecho que 620, y como un SVG nunca estira
   su contenido, `meet` encogía el mapa entero para que cupiera. Los nodos
   salían a 3,4 px en vez de a 5,5 y la rama se leía como polvo.

   Así que se pinta con un ancho provisional y `planAjustarLienzos` rehace el
   `viewBox` con el ancho de verdad en cuanto el navegador lo ha colocado. La
   escala no depende del ancho —sale de la altura, que es fija— así que los
   nodos miden lo mismo siempre y lo único que cambia es cuánto mapa se ve. */
const PLAN_SVG_ANCHO_PROVISIONAL = 264;
const PLAN_SVG_ESC = 0.30;   // cuánto se encoge el mapa real
const PLAN_SVG_PAD = 34;     // aire alrededor, en unidades del mapa
const PLAN_SVG_PASO = 168;   // a qué distancia cuelgan los nodos por abrir

function planRamaSVG(b, quedan) {
  if (typeof branchNodes !== "function" || typeof branchLayout !== "function") return null;
  let nodes, lay;
  try {
    nodes = branchNodes(b) || [];
    if (!nodes.length) return null;
    lay = branchLayout(nodes);
  } catch (e) {
    /* El dibujo es un adorno del argumento, no el argumento. Si el mapa no se
       puede calcular, el bloque sigue en pie con sus cuadritos y su cuenta. */
    return null;
  }

  const pos = lay.pos;
  const puestos = nodes.filter(n => pos[n.id]);
  if (!puestos.length) return null;

  const xs = puestos.map(n => pos[n.id].x), ys = puestos.map(n => pos[n.id].y);
  let minX = Math.min(...xs), maxX = Math.max(...xs);
  let minY = Math.min(...ys), maxY = Math.max(...ys);

  /* Los que faltan cuelgan de la derecha, repartidos alrededor de la altura
     de los nodos más profundos: es hacia donde crecería la rama si hubiera
     sitio, y es lo que el degradado deja siempre a la vista. */
  const faltan = quedan === Infinity ? 0 : Math.min(quedan, 3);
  const puntas = puestos.filter(n => pos[n.id].x > maxX - 1);
  const cy = puntas.length
    ? puntas.reduce((s, n) => s + pos[n.id].y, 0) / puntas.length
    : (minY + maxY) / 2;
  const futuros = [];
  for (let i = 0; i < faltan; i++) {
    const y = cy + (i - (faltan - 1) / 2) * (PLAN_SVG_PASO * 0.62);
    futuros.push({ x: maxX + PLAN_SVG_PASO, y, de: puntas[i % Math.max(1, puntas.length)] });
  }
  if (futuros.length) {
    maxX = Math.max(maxX, ...futuros.map(f => f.x));
    minY = Math.min(minY, ...futuros.map(f => f.y));
    maxY = Math.max(maxY, ...futuros.map(f => f.y));
  }

  const ancho = (maxX - minX) + PLAN_SVG_PAD * 2;
  const alto = (maxY - minY) + PLAN_SVG_PAD * 2;
  /* De alto SIEMPRE cabe todo: cortar un nodo por arriba sin avisar es
     mentir sobre cuántos hay. De ancho es donde se recorta. */
  const esc = Math.min(PLAN_SVG_ESC, PLAN_SVG_H / alto);
  const caja = PLAN_SVG_ANCHO_PROVISIONAL;
  const VW = caja / esc, VH = PLAN_SVG_H / esc;
  const recorta = ancho > VW;
  const vbX = recorta ? (maxX + PLAN_SVG_PAD - VW) : ((minX + maxX) / 2 - VW / 2);
  const vbY = ((minY + maxY) / 2 - VH / 2);

  const R = Math.round(5.5 / esc), GR = Math.round(1.5 / esc);
  const linea = [];
  puestos.forEach(n => {
    (lay.padresDe[n.id] || []).forEach(pid => {
      if (!pos[pid]) return;
      linea.push(`M${Math.round(pos[pid].x)} ${Math.round(pos[pid].y)} L${Math.round(pos[n.id].x)} ${Math.round(pos[n.id].y)}`);
    });
  });

  /* Anclado a la DERECHA cuando se recorta: si el hueco resulta ser más ancho
     de lo previsto, lo que sobra se queda del lado del degradado —vacío y sin
     verse— y las puntas de la rama siguen pegadas al borde donde se buscan. */
  /* Las cuatro esquinas del contenido y la escala viajan con el dibujo: son
     lo que `planAjustarLienzos` necesita para rehacer el `viewBox` sin tener
     que volver a recorrer los nodos. */
  const svg = `<svg viewBox="${Math.round(vbX)} ${Math.round(vbY)} ${Math.round(VW)} ${Math.round(VH)}"
      preserveAspectRatio="${recorta ? "xMaxYMid" : "xMidYMid"} meet"
      data-esc="${esc}" data-x0="${Math.round(minX)}" data-x1="${Math.round(maxX)}"
      data-y0="${Math.round(minY)}" data-y1="${Math.round(maxY)}"
      width="100%" height="${PLAN_SVG_H}" role="img" aria-hidden="true" focusable="false">
      ${linea.length ? `<path class="plan-linea" d="${linea.join(" ")}" fill="none" stroke="var(--mint)" stroke-width="${GR}"></path>` : ""}
      ${futuros.map(f => f.de
        ? `<path d="M${Math.round(pos[f.de.id].x)} ${Math.round(pos[f.de.id].y)} L${Math.round(f.x)} ${Math.round(f.y)}" fill="none" stroke="var(--faint)" stroke-width="${GR}" stroke-dasharray="${GR * 2} ${GR * 2.6}"></path>`
        : "").join("")}
      ${puestos.map(n => `<circle cx="${Math.round(pos[n.id].x)}" cy="${Math.round(pos[n.id].y)}" r="${R}" fill="var(--mint)"></circle>`).join("")}
      ${futuros.map(f => `<circle cx="${Math.round(f.x)}" cy="${Math.round(f.y)}" r="${R}" fill="none" stroke="var(--faint)" stroke-width="${GR}" stroke-dasharray="${GR * 2} ${GR * 2}"></circle>`).join("")}
    </svg>`;

  return { svg, recorta };
}

/* Rehace el `viewBox` con el ancho que el recuadro tiene de verdad. Se llama
   justo después de pintar; leer `clientWidth` fuerza al navegador a colocar
   la página, que es exactamente lo que hace falta aquí y una sola vez.

   Si el mapa cabe entero se centra; si no, se ancla a la derecha y se enciende
   el degradado. Que la decisión de recortar se tome AQUÍ y no al pintar es lo
   que evita el otro fallo posible: un degradado encendido sobre un dibujo que
   sí cabía, tapando nodos por gusto. */
function planAjustarLienzos(caja) {
  (caja || document).querySelectorAll(".plan-lienzo svg[data-esc]").forEach(svg => {
    const wrap = svg.parentElement;
    const ancho = wrap.clientWidth;
    if (!ancho) return;                      // todavía no se ve: se deja como está
    const esc = parseFloat(svg.dataset.esc);
    const x0 = +svg.dataset.x0, x1 = +svg.dataset.x1;
    const y0 = +svg.dataset.y0, y1 = +svg.dataset.y1;
    const VW = ancho / esc, VH = PLAN_SVG_H / esc;
    const recorta = (x1 - x0) + PLAN_SVG_PAD * 2 > VW;
    const vbX = recorta ? (x1 + PLAN_SVG_PAD - VW) : ((x0 + x1) / 2 - VW / 2);
    const vbY = (y0 + y1) / 2 - VH / 2;
    svg.setAttribute("viewBox", Math.round(vbX) + " " + Math.round(vbY) + " " + Math.round(VW) + " " + Math.round(VH));
    svg.setAttribute("preserveAspectRatio", (recorta ? "xMaxYMid" : "xMidYMid") + " meet");
    wrap.classList.toggle("mas", recorta);
  });
}

/* El bloque entero, o cadena vacía si no hay nada que decir. Devuelve texto y
   no `null` porque quien lo llama lo concatena. */
function planTopesHTML() {
  const d = planTopeDatos();
  if (!d) return "";

  const cuenta = (n) => n === Infinity ? "Sin tope" : "Te quedan " + n;
  const dibujo = planRamaSVG(d.rama, d.quedanT);

  /* El cierre dice en qué plan estás, porque este bloque sustituye a la
     cabecera. Tres finales, y el tercero es el que se olvidaba:

     · con sitio libre no se menciona el tope de ramas, porque sería un aviso
       de algo que todavía no pasa;
     · justo en el tope, se dice;
     · y **por encima del tope** —alguien que tuvo Pro y lo dejó— hay que decir
       otra cosa. Aquí se leía «una rama, y ya la tienes» a quien tiene tres, y
       eso no es una frase mal escrita: es la única pantalla que habla de
       dinero diciéndole a alguien que tiene menos de lo que tiene. Lo que toca
       decir ahí es que nada se borró, que es la promesa de la app. */
  const cuantas = (n) => n === 1 ? "una rama" : n + " ramas";
  const deMas = d.topeR === Infinity ? 0 : d.ramas.length - d.topeR;
  let cierre;
  if (deMas > 0) {
    cierre = "Estás en Gratuito, que incluye " + cuantas(d.topeR) + ". " +
      (deMas === 1 ? "La otra sigue" : "Las otras " + deMas + " siguen") +
      " a la vista y en solo lectura; no se borró nada. Pro " +
      (deMas === 1 ? "la vuelve" : "las vuelve") +
      " a poner en marcha y deja de contar los talentos de cada una.";
  } else if (d.quedanR === 0) {
    cierre = "Estás en Gratuito: " + cuantas(d.topeR) +
      (d.topeR === 1 ? ", y ya la tienes. " : ", y ya las tienes. ") +
      "Pro abre las que quieras y deja de contar los talentos de cada una.";
  } else {
    cierre = "Estás en Gratuito. Pro abre las ramas que quieras y deja de " +
      "contar los talentos de cada una.";
  }

  /* Cada cosa con el dibujo que le toca, y una sola vez. Los talentos van en
     el mapa de la rama; las ramas, en pastillas con su nombre. Estuvieron los
     dos contando talentos —una fila de cuadritos encima del mapa— y era otra
     vez lo mismo dicho dos veces, que es justo lo que esta pantalla venía a
     arreglar.

     Los cuadritos se quedan de reserva: si el mapa no se puede dibujar, la
     cuenta sigue viéndose y no queda un hueco donde había un argumento. */
  return `<div class="plan-topes">
      <div class="plan-tope-rot"><span>Tu rama «${escapeHtml(d.rama)}»</span>${
        dibujo ? "" : `<em>${cuenta(d.quedanT)}</em>`}</div>
      ${dibujo
        ? `<div class="plan-lienzo${dibujo.recorta ? " mas" : ""}"><span class="plan-cuenta">${cuenta(d.quedanT)}</span>${dibujo.svg}</div>`
        : planNodosHTML(d.llenos, d.quedanT)}
      <div class="plan-tope-rot alto"><span>${d.ramas.length === 1 ? "Tu única rama" : "Tus ramas"}</span><em>${cuenta(d.quedanR)}</em></div>
      ${planChipsRamasHTML(d.ramas, d.quedanR)}
      <p class="plan-tope-cierre">${escapeHtml(cierre)}</p>
    </div>`;
}

/* ---- El aviso de quien ya paga ----
   Aquí salían DOS avisos seguidos y ninguno de los dos servía. El primero
   contaba lo mismo que el botón que tenía encima; el segundo era el pie legal
   de las tarjetas de precio —IVA incluido, pagos por Stripe, cifrado— puesto
   en una pantalla **donde no se exhibe ningún precio**, así que informaba de
   condiciones de una compra que no está ocurriendo.

   Lo que sí hace falta decir es a dónde lleva el botón antes de pulsarlo: sale
   de Norata y aterriza en un sitio con otro nombre y otro aspecto, y encontrar
   los datos de tu tarjeta en una página que no reconoces asusta con razón.

   El tono es más formal que el resto de la app, y es a propósito: Eduardo lo
   pidió así. Donde se habla de dinero, la cercanía suena a que se le está
   quitando importancia a algo. Se sigue tuteando, que eso no se negocia. */
function planPortalNotaHTML() {
  const fundador = PLAN.plan === "fundador";
  const accion = fundador ? "Ver mi recibo" : "Editar suscripción";
  const dentro = fundador
    ? "Ahí puedes consultar y descargar el comprobante de tu pago."
    : "Ahí puedes actualizar tu método de pago, consultar tus recibos y cancelar la renovación cuando lo decidas.";

  /* Dos párrafos y no uno. El primero dice a dónde vas y qué puedes hacer
     allí; el segundo es de otra clase —dónde acaban tus datos bancarios— y
     metido en el mismo bloque se leía como el final de la frase anterior, que
     es justo donde deja de leerse. */
  return `<p class="settings-note plan-pie">${escapeHtml(accion)} abre el portal de Stripe,
      la plataforma que procesa los pagos de Norata. ${escapeHtml(dentro)}</p>
    <p class="settings-note plan-pie">Tus datos bancarios se administran únicamente en Stripe
      y no se almacenan en Norata.</p>`;
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
  return `<button class="btn btn-linea btn-block plan-vs-btn" onclick="planAlternarComparacion()">${
    planComparando ? "Ocultar la comparación" : "Comparar los planes"
  }</button>` + (planComparando ? planTablaHTML() : "");
}

/* Las filas. Las cinco primeras las decide `LIMITES` y las demás son las que
   no tienen tope en ningún plan —que son la mitad del mensaje: lo que se cobra
   no es la app, son los topes—. Fundador copia la columna de Pro salvo donde
   se dice lo contrario, porque ES Pro: lo que cambia es cómo se paga. */
/* Una celda que hay que mirar. La columna de Fundador iba ENTERA en color y
   estaba mal: si todo destaca, no destaca nada, y ademas tenia de premio ocho
   filas que dicen exactamente lo mismo que la columna de al lado --"Ilimitados"
   junto a "Ilimitados"--. El texto vuelve a ser blanco y solo se marcan las dos
   celdas donde Fundador dice algo que ningun otro plan dice. */
function ojo(texto) {
  return { t: texto, ojo: true };
}

function planFilasComparadas() {
  const l = LIMITES.libre, p = LIMITES.pro;
  const ramas = (x) => x === Infinity ? "Ilimitadas" : (x === 1 ? "Una" : String(x));
  const tope = (x) => x === Infinity ? "Ilimitados" : String(x);
  const resu = (x) => x.length ? "Semana, mes y año" : "Solo el panel del día";
  const apar = (x) => x ? "Todas" : "Solo las paletas de color";

  return [
    ["Ramas de talentos", ramas(l.ramas), ramas(p.ramas), ramas(p.ramas)],
    ["Talentos por rama", tope(l.talentos), tope(p.talentos), tope(p.talentos)],
    ["Informes", resu(l.resumen), resu(p.resumen), resu(p.resumen)],
    ["Apariencias", apar(l.apariencia), apar(p.apariencia), apar(p.apariencia)],
    ["Misiones, habilidades y proyectos", "Ilimitados", "Ilimitados", "Ilimitados"],
    ["Sincronía entre dispositivos", "Incluida", "Incluida", "Incluida"],
    ["Tu progreso y tu XP", "Tuyos", "Tuyos", "Tuyos"],
    /* "Es gratis" y no "No se paga": la primera dice lo que hay, la segunda lo
       que no pasa, y en una fila que se llama "Cómo se paga" un no se lee como
       una carencia. Y "Pago único" porque es como se nombra en el sitio; "Una
       sola vez" era una tercera forma de decir lo mismo. */
    ["Cómo se paga", "Es gratis", "Suscripción", ojo("Pago único")],
    /* El distintivo de fundador existe hoy y no es una promesa: el anillo
       alrededor del círculo de la cuenta y la piedra con corona en vez de la
       tallada. El anillo es LILA desde 0.7.13 — si vuelve a cambiar de color,
       esta línea cambia con él o pasa a describir algo que no se ve. */
    ["Distintivo de fundador", "—", "—", ojo("Anillo lila y piedra con corona")]
  ];
}

/* Las tres piedras encima de sus columnas. El encabezado decia los nombres y
   ya esta; con la piedra delante, la tabla y el resto de la app hablan el
   mismo idioma -- es el mismo dibujo que sale en la ficha del mini menu y en
   la cabecera del plan, asi que se reconoce sin leer. */
const PLAN_COLUMNAS = [
  { nivel: "libre", nombre: "Gratuito", tono: "" },
  { nivel: "pro", nombre: "Pro", tono: "" },
  { nivel: "fundador", nombre: "Fundador", tono: "lila" }
];

function planTablaHTML() {
  const celda = (v) => typeof v === "string"
    ? `<td>${escapeHtml(v)}</td>`
    : `<td class="ojo">${escapeHtml(v.t)}</td>`;

  return `<div class="plan-vs" id="plan-compara">
      <table>
        <thead><tr><th></th>` +
    PLAN_COLUMNAS.map(c => `<th class="${c.tono ? "t-" + c.tono : ""}">
        <span class="vs-piedra">${icon("plan-" + c.nivel, 20)}</span>
        <span>${escapeHtml(c.nombre)}</span>
      </th>`).join("") +
    `</tr></thead>
        <tbody>` +
    planFilasComparadas().map(f =>
      `<tr><th scope="row">${escapeHtml(f[0])}</th>` +
      f.slice(1).map(celda).join("") +
      `</tr>`).join("") +
    `</tbody>
      </table>
    </div>`;
}

/* Los dos botones desactivan mientras esperan. Sin esto, el segundo entra a
   Stripe llevándose por delante al primero: la respuesta tarda un segundo
   largo y un segundo largo con un botón que no reacciona invita a insistir.

   Y no basta con desactivarlo: un botón apagado que cambia de palabra puede
   leerse como que se rompió. La rueda girando es lo que dice «esto sigue
   pasando», que es justo lo que hay que contestar mientras se pide la
   dirección al servidor y el navegador empieza a cambiar de página. */
function botonEsperando(btn, esperando) {
  if (!btn) return;
  if (esperando) {
    /* Se guarda el HTML y no el texto: estos botones pueden llevar dentro algo
       más que palabras, y restaurar solo el texto los dejaría pelados. */
    btn.dataset.antes = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-rueda" aria-hidden="true"></span>Cargando…';
    return;
  }
  if (btn.dataset.antes != null) btn.innerHTML = btn.dataset.antes;
  delete btn.dataset.antes;
  btn.disabled = false;
}

async function irAPagarDesdeAjustes(cual, btn) {
  botonEsperando(btn, true);
  try {
    await irAPagar(cual);
  } catch (e) {
    toast(e.message, "aviso");
    botonEsperando(btn, false);
  }
}

async function irAlPortal(btn) {
  botonEsperando(btn, true);
  try {
    await abrirPortalDePago();
  } catch (e) {
    toast(e.message, "aviso");
    botonEsperando(btn, false);
  }
}
