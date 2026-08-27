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
const PLANES = {
  mensual: {
    nombre: "Mensual",
    precio: "$69",
    periodo: "al mes",
    pie: "Se renueva solo. Cancelas cuando quieras."
  },
  anual: {
    nombre: "Anual",
    precio: "$590",
    periodo: "al año",
    pie: "Dos meses de regalo frente al mensual.",
    destacado: true
  },
  fundador: {
    nombre: "Fundador",
    precio: "$890",
    periodo: "una sola vez",
    pie: "Para siempre, con cupo limitado.",
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
  const guardado = planLeerGuardado();
  if (guardado) PLAN = guardado;

  try {
    if (typeof syncReady === "function" && !syncReady()) {
      /* Sin cuenta no hay plan que preguntar. Y sin cuenta tampoco tiene
         sentido arrastrar la copia guardada de otra sesión. */
      PLAN = { plan: "libre", pro: false, estado: "ninguna", vence_el: null, renueva: false, compro: "libre" };
      return PLAN;
    }
    const r = await sbDatos("/rpc/mi_plan", { method: "POST", body: "{}" });
    /* 404: todavía no se ha corrido `planes.sql`. Es la única respuesta rara
       que se espera y no merece un error: significa que el cobro aún no
       existe, que es la verdad hoy. */
    if (r.status === 404) return PLAN;
    if (!r.ok || !r.body) return PLAN;
    PLAN = r.body;
    planEscribirGuardado(PLAN);
  } catch (e) {
    /* A propósito. Ver arriba. */
  }
  return PLAN;
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
    return "Tu árbol tiene una rama en el plan libre. Con el plan completo puedes abrir las que quieras.";
  }
  if (clave === "talentos") {
    return "Caben " + LIMITES.libre.talentos + " talentos por rama en el plan libre. " +
      "Con el plan completo no hay tope.";
  }
  if (clave === "atico") {
    return "El plan libre guarda el año en curso. Con el plan completo puedes volver a cualquier año.";
  }
  if (clave === "resumen") {
    return "El resumen de la semana es de todos. El del mes y el del año vienen con el plan completo.";
  }
  if (clave === "apariencia") {
    return "Las paletas de color son de todos. Las apariencias completas vienen con el plan completo.";
  }
  return "Esto viene con el plan completo.";
}

/* Cómo se llama lo que tiene, para pintarlo en Ajustes. Distingue los tres
   casos que importan y que se confunden todo el tiempo:
   pagando, canceló pero le quedan días, y se acabó. */
function planEtiqueta() {
  if (!PLAN.pro) {
    if (PLAN.compro && PLAN.compro !== "libre") return "Tu plan " + (PLANES[PLAN.compro] || {}).nombre + " terminó";
    return "Plan libre";
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
       <button class="btn btn-primary btn-block" onclick="abrirVentanaAjustes('cuenta')">Crear mi cuenta</button>`;
    return;
  }

  if (esPro()) {
    caja.innerHTML = `<h3>Tu plan</h3>` + planActivoHTML();
    return;
  }

  caja.innerHTML =
    `<h3>Tu plan</h3>
     <div class="plan-hoy">
       <span class="plan-hoy-t">${escapeHtml(planEtiqueta())}</span>
       <span class="plan-hoy-s">Una rama de talentos, ${LIMITES.libre.talentos} talentos dentro, y el resumen de cada semana.</span>
     </div>
     <p class="settings-note">Con el plan completo se abren las ramas que quieras, el ático entero y los resúmenes del mes y del año. Lo que ya escribiste no se toca nunca.</p>
     <div class="plan-cards">` +
    Object.keys(PLANES).map(k => planTarjetaHTML(k)).join("") +
    `</div>
     <p class="settings-note plan-pie">El cobro lo hace Stripe. Tu tarjeta no pasa por Norata.</p>`;

  /* Los lugares de fundador se piden después de pintar y sin esperarlos: es un
     número de adorno, y si el servidor no contesta la tarjeta se queda como
     está en vez de decir "quedan 0" y espantar a quien iba a comprar. */
  lugaresDeFundador().then(n => {
    const el = document.getElementById("plan-cupo");
    if (!el || n === null) return;
    el.textContent = n > 0 ? "Quedan " + n + " lugares" : "Ya se agotaron";
  });
}

function planActivoHTML() {
  const p = PLANES[PLAN.plan] || {};
  let nota;
  if (PLAN.plan === "fundador") {
    nota = "Es para siempre. No hay nada que renovar ni que cancelar.";
  } else if (PLAN.estado === "impago") {
    nota = "No pudimos cobrar tu último recibo. Revisa tu tarjeta para que no se interrumpa.";
  } else if (!PLAN.renueva && PLAN.vence_el) {
    nota = "Cancelaste, y sigue funcionando hasta el " + fechaCorta(PLAN.vence_el) + ". Nada de lo tuyo se borra ese día.";
  } else if (PLAN.vence_el) {
    nota = "Se renueva solo el " + fechaCorta(PLAN.vence_el) + ".";
  } else {
    nota = "Activo.";
  }

  return `<div class="plan-hoy activo">
      <span class="plan-hoy-t">${escapeHtml(p.nombre || PLAN.plan)}</span>
      <span class="plan-hoy-s">${escapeHtml(nota)}</span>
    </div>` +
    /* Fundador no tiene nada que gestionar —ni tarjeta que cambiar ni
       suscripción que cancelar—, pero sí recibos que mirar, así que el botón
       se queda para todos y solo cambia lo que promete. */
    `<button class="btn btn-soft btn-block" onclick="irAlPortal(this)">${
      PLAN.plan === "fundador" ? "Ver mi recibo" : "Cambiar tarjeta o cancelar"
    }</button>`;
}

function planTarjetaHTML(k) {
  const p = PLANES[k];
  return `<div class="plan-card${p.destacado ? " destacada" : ""}">
      ${p.destacado ? '<span class="plan-tag">El que sale mejor</span>' : ""}
      <span class="plan-n">${escapeHtml(p.nombre)}</span>
      <span class="plan-p">${escapeHtml(p.precio)} <i>${escapeHtml(p.periodo)}</i></span>
      <span class="plan-d">${escapeHtml(p.pie)}</span>
      ${p.cupo ? '<span class="plan-cupo" id="plan-cupo">&nbsp;</span>' : ""}
      <button class="btn ${p.destacado ? "btn-primary" : "btn-soft"} btn-block"
        onclick="irAPagarDesdeAjustes('${k}', this)">Elegir</button>
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
