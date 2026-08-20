/* Lo que corre al abrir. Va el último a propósito */
/* ================= Arranque ================= */

document.getElementById("settings-btn").innerHTML = icon("settings", 19);
document.getElementById("dash-btn").innerHTML = icon("gamepad", 19);
document.getElementById("perm-shield").innerHTML = icon("shield", 16);

/* Los oyentes del arrastre, una sola vez para toda la app: las listas se
   rehacen enteras a cada rato y colgarlos en cada una los duplicaría. */
window.addEventListener("pointermove", reordMover, { passive: false });
window.addEventListener("pointerup", reordSoltar);
window.addEventListener("pointercancel", reordSoltar);
document.addEventListener("click", filtrarClicTrasArrastre, true);

/* Al cambiar el ancho de la ventana cambia lo que cabe en cada tarjeta, y
   cruzando los 900px el tablero pasa de alto fijo a alto natural. Sin esto,
   el desvanecido se quedaría puesto donde ya no sobra nada —o faltaría
   donde sí—. Se espera a que el arrastre del borde pare para no medir
   cientos de veces por segundo. */
let reajusteVentana = null;
window.addEventListener("resize", () => {
  clearTimeout(reajusteVentana);
  reajusteVentana = setTimeout(() => {
    marcarDesbordes();
    revisarAnchoDePantalla();
    ajustarAltoTablero();
  }, 150);
});

/* Cruzar los 900px no es un detalle de estilo: hay pantallas que se dibujan
   distintas a cada lado de esa línea —el encargo reparte su contenido en dos
   columnas, el Resumen cambia de acomodo guardado— y el navegador no puede
   rehacer solo lo que se decidió en JavaScript. Sin esto, arrastrar el borde
   de la ventana dejaba la pantalla anterior puesta hasta el siguiente clic. */
let anchoEraDeEscritorio = isDesktop();
const REDIBUJA_AL_CRUZAR = {
  "view-summary": () => renderSummary(),
  "view-projects": () => renderProjects(),
  "view-project": () => renderProjectDetail(),
  "view-missions": () => renderMissions(),
  "view-settings": () => renderAjustes()
};

function revisarAnchoDePantalla() {
  const ahora = isDesktop();
  if (ahora === anchoEraDeEscritorio) return;
  anchoEraDeEscritorio = ahora;
  /* La ventana de Ajustes y su menú son cosa de escritorio: al encoger la
     ventana hay que devolverlos a la pantalla de siempre, o el contenido se
     quedaría dentro de una caja que ya no se dibuja. */
  if (!ahora) {
    const modal = document.getElementById("ajustes-modal");
    const abierta = modal && modal.classList.contains("show");
    cerrarMenuAjustes();
    cerrarVentanaAjustes();
    if (abierta) { showView("settings"); return; }
  }
  const activa = document.querySelector(".view.active");
  const rehacer = activa && REDIBUJA_AL_CRUZAR[activa.id];
  if (rehacer) rehacer();
}

/* Datos de una versión más nueva: la app no puede guardar nada, así que hay
   que decirlo antes de que el usuario se pase media hora capturando y
   descubra que no quedó. El aviso no se puede cerrar a propósito — el único
   final bueno es actualizar la app. */
if (modoSoloLectura) avisarDatosDelFuturo();

function avisarDatosDelFuturo() {
  const caja = document.createElement("div");
  caja.className = "futuro-aviso";
  caja.innerHTML =
    `<div class="futuro-card">
       <h3>Esta copia de Norata está desactualizada</h3>
       <p>Tu progreso lo guardó una versión más nueva de la app, así que aquí no puedo entenderlo del todo. <b>Mientras tanto no voy a guardar nada.</b></p>
       <p>Actualiza Norata en este dispositivo y vuelve a abrirla.</p>
       <div class="stack">
         <button class="btn btn-primary btn-block" onclick="location.reload(true)">Buscar la versión nueva</button>
         <button class="btn btn-soft btn-block" onclick="exportData()">Guardar un respaldo</button>
       </div>
     </div>`;
  document.body.appendChild(caja);
}

aplicarModulos();

/* El gesto de atrás del teléfono pasa por aquí. Ver atrasApp(): si la app se
   ocupa, se repone el colchón; si no, se deja ir de verdad —el gesto ya
   consumió una entrada, así que hace falta soltar otra—. */
armarColchon();
window.addEventListener("popstate", () => {
  if (atrasApp()) armarColchon();
  else setTimeout(() => { try { history.back(); } catch (e) {} }, 0);
});

showView("summary");

/* La entrada, antes que nada visible. El orden importa: primero se mira si
   volvemos de Google —que llega con la sesión colgada de la dirección y hay
   que recogerla antes de decidir si hace falta portada—, y solo después se
   pregunta si hay que enseñarla. */
(async () => {
  const veniaDeGoogle = await sbVolverDeEnlace();
  /* El atajo de los correos de aviso (`#olvide`) va después de recoger la
     sesión y antes de decidir si hace falta portada: no es una sesión que
     recoger, pero sí abre la portada por su cuenta, y preguntar después
     «¿hace falta?» la abriría dos veces o ninguna. */
  const veniaAOlvidar = !veniaDeGoogle && portadaAtajoOlvide();
  if (!veniaDeGoogle && !veniaAOlvidar && portadaHaceFalta()) mostrarPortada();
  pintarAvisoPruebas();

  /* El desgaste se aplica DESPUÉS de traer lo del otro dispositivo, y esto no
     es un detalle de orden: es lo que evitaba que la app preguntara sin
     motivo.

     `applyDecay()` escribe el primer arranque de cada día —actualiza hasta
     cuándo se revisó cada habilidad— y eso marcaba el dispositivo como "tiene
     cambios sin subir" antes de haber hablado con el servidor. Abrir la app en
     la computadora al día siguiente de usarla en el móvil bastaba para que los
     dos lados pareciesen haber cambiado. Además, calculado antes de bajar,
     el desgaste se calcula sobre datos viejos: castiga por una inactividad
     que en el otro dispositivo no existió.

     Se hace en cuanto vuelve la sincronía, y si no hay conexión se aplica
     igual: más vale un desgaste calculado con lo que hay que ninguno. */
  /* La condición del enlace no es por el desgaste, sino para no pedir lo
     mismo dos veces: si venimos de un correo o de Google, la entrada ya
     sincronizó al terminar. */
  if (!veniaDeGoogle && syncReady()) await syncRun({ silent: true });
  applyDecay();
  showView(activeMainView || "summary");

  /* Y hasta aquí la pantalla de carga: ya se sabe qué hay que enseñar y está
     dibujado. Es lo último de todo a propósito — destaparla antes es
     justamente lo que hacía parpadear la app al abrirla. */
  cargaCerrar();
  quizaTutorialDeEntrada();
})();

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") syncRun({ silent: true });
});
window.addEventListener("online", () => syncRun({ silent: true }));

/* ---- Deslizar hacia abajo para actualizar ----
   El gesto que todo el mundo ya tiene en los dedos. Existe porque la
   sincronía automática cubre casi todo —al abrir, al volver a la pestaña, al
   recuperar la conexión— pero no el caso de "sé que acabo de cambiar algo en
   la computadora y lo quiero ver AQUÍ, ahora". Sin esto, la única salida era
   cerrar y abrir la app.

   Solo cuenta empezando desde arriba del todo y con un dedo: cualquier otra
   cosa es un desplazamiento normal, o un arrastre del tablero o del lienzo,
   y robarles el gesto sería peor que no tenerlo. */
(function () {
  const UMBRAL = 72;
  let inicioY = null, aviso = null;

  function pintar(dist, texto) {
    if (!aviso) {
      aviso = document.createElement("div");
      aviso.className = "tirar-aviso";
      document.body.appendChild(aviso);
    }
    aviso.textContent = texto;
    aviso.style.transform = "translate(-50%," + Math.min(dist, UMBRAL + 18) + "px)";
    aviso.classList.toggle("listo", dist >= UMBRAL);
  }

  function quitar() {
    if (!aviso) return;
    const a = aviso; aviso = null;
    a.classList.add("fuera");
    setTimeout(() => a.remove(), 240);
  }

  window.addEventListener("touchstart", (e) => {
    inicioY = null;
    if (e.touches.length !== 1) return;
    if (window.scrollY > 0) return;
    if (dashEditing) return;                       // ahí el dedo mueve tarjetas
    if (document.querySelector(".portada, .futuro-aviso")) return;
    if (cargaVisible()) return;                    // todavía está entrando
    if (document.body.classList.contains("fs-on")) return;
    inicioY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener("touchmove", (e) => {
    if (inicioY === null) return;
    const d = e.touches[0].clientY - inicioY;
    if (d <= 0) { quitar(); return; }
    pintar(d * 0.5, d * 0.5 >= UMBRAL ? "Suelta para actualizar" : "Desliza para actualizar");
  }, { passive: true });

  window.addEventListener("touchend", async () => {
    if (inicioY === null || !aviso) { inicioY = null; quitar(); return; }
    const listo = aviso.classList.contains("listo");
    inicioY = null;
    if (!listo) { quitar(); return; }
    pintar(UMBRAL, "Actualizando…");
    if (syncReady()) await syncRun({ silent: true });
    else toast("Sin cuenta: no hay nada que traer", "calma");
    quitar();
  }, { passive: true });
})();

if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
