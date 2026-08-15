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
  reajusteVentana = setTimeout(marcarDesbordes, 150);
});

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
       <h3>Esta copia de Notara está desactualizada</h3>
       <p>Tu progreso lo guardó una versión más nueva de la app, así que aquí no puedo entenderlo del todo. <b>No voy a tocar nada</b>: prefiero no guardar a estropearlo.</p>
       <p>Actualiza Notara en este aparato y vuelve a abrirla. Tus datos siguen enteros.</p>
       <div class="stack">
         <button class="btn btn-primary btn-block" onclick="location.reload(true)">Buscar la versión nueva</button>
         <button class="btn btn-soft btn-block" onclick="exportData()">Guardar un respaldo</button>
       </div>
     </div>`;
  document.body.appendChild(caja);
}

applyDecay();
aplicarModulos();
showView("summary");

/* La sincronía se dispara al abrir, al volver a la pestaña y al recuperar
   la conexión: son los tres momentos en los que el otro dispositivo pudo
   haber avanzado sin que este se enterara. */
if (syncReady()) syncRun({ silent: true });

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") syncRun({ silent: true });
});
window.addEventListener("online", () => syncRun({ silent: true }));

if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
