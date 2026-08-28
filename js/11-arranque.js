/* Lo que corre al abrir. Va el último a propósito */
/* ================= Arranque ================= */

/* Que ninguna ventana deje moverse a la app de detrás. Se enciende aquí, con
   el marcado ya entero: la vigilancia se cuelga de los hijos del <body>, y
   arrancarla antes solo vigilaría a la mitad. */
vigilarCapas();

/* El número de versión, en los dos sitios donde se enseña, escrito desde la
   misma constante: dos números a mano acaban discrepando el día que uno se
   cambie y el otro no, y entonces el dato deja de servir para lo único que
   sirve —saber si lo que estás viendo ya es lo último—. */
(function pintarVersion() {
  /* El punto medio va DENTRO del trozo de la fecha, no suelto entre los dos:
     plegada la barra la fecha se esconde, y un separador aparte se quedaría
     colgando detrás del número sin nada que separar. */
  /* «Alpha» delante, y va en su propio trozo por lo mismo que la fecha: con la
     barra plegada solo caben unos pocos caracteres, y ahí la palabra que sobra
     es ésta —quien mira el renglón encogido busca el número—. Es la etiqueta
     de la etapa en la que está la app, no parte del número: cuando deje de ser
     alpha se quita de aquí y de ningún otro sitio. */
  /* Ningún trozo lleva espacios sueltos dentro, y no es descuido: el renglón
     es un `flex`, y ahí el espacio en blanco al principio o al final de un
     hijo se COLAPSA. Con `Alpha ` y ` · ` escritos a mano salía
     «Alphav0.7.24· 27 ago 2026», todo pegado. La separación la pone el `gap`
     del contenedor, que es lo único que un flex respeta. */
  const html = `<span class="sv-etapa">Alpha</span>` +
               `<span class="sv-num">V${VERSION}</span>` +
               `<span class="sv-fecha">· ${VERSION_FECHA}</span>`;
  /* «sv-txt» y no «side-version»: desde que la bolita de reportar vive
     dentro de esa caja, escribir en el contenedor la borraría. */
  ["sv-txt", "version-pie"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  });
})();

/* ---- Los iconos que se pintan al arrancar ----
   Con `if (el)` y no a pelo, y esto costó un despliegue: al añadir el botón
   del bicho, la primera carga después de subirlo reventaba con «Cannot set
   properties of null». El motivo es el service worker, y es la trampa de la
   casa: sirve el `index.html` que tenía en la caché mientras se trae el
   nuevo, así que durante UNA carga conviven el HTML viejo y el JavaScript
   nuevo. El elemento todavía no existe y el `.innerHTML` mata el arranque —
   con él, todo lo que este archivo hace más abajo: los oyentes del arrastre,
   los atajos, la sincronía.

   Los tres de siempre nunca lo notaron porque llevan meses en el HTML. El
   riesgo es exactamente el de los NUEVOS, que es cuando las dos copias
   discrepan. Por eso el bucle: el día que se añada el cuarto, ya está. */
[["bug-ic", "bicho", 20],
 ["bug-ic-pie", "bicho", 16],
 ["settings-btn", "settings", 19],
 ["dash-btn", "gamepad", 19],
 ["perm-shield", "shield", 16]].forEach(([id, nombre, tam]) => {
  const el = document.getElementById(id);
  if (el) el.innerHTML = icon(nombre, tam);
});

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
  /* El mini menú es cosa de escritorio y se coloca con coordenadas fijas
     calculadas al abrirlo: al cruzar el ancho se queda flotando donde ya no
     hay botón del que colgar, así que se cierra. Ajustes no necesita nada
     más — es la misma pantalla en los dos tamaños y `renderAjustes` la
     recompone sola unas líneas más abajo. Aquí hubo una mudanza (la ventana
     de escritorio devolvía su contenido a la pantalla) y era justo lo que se
     rompía al minimizar el navegador; sin ventana no hay nada que mudar. */
  if (!ahora) cerrarMenuAjustes();
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
  if (!atrasApp()) { setTimeout(() => { try { history.back(); } catch (e) {} }, 0); return; }
  /* El colchón se repone cuando la pantalla ya está pintada. El navegador
     guarda una foto de la entrada al dejarla atrás, y esa foto es la que
     enseña durante el gesto: si se repone antes de pintar, la foto es de la
     pantalla vieja y por un instante se ve la de antes encima de la nueva. */
  requestAnimationFrame(() => requestAnimationFrame(armarColchon));
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
     «¿hace falta?» la abriría dos veces o ninguna.

     Los dos siguen viviendo aquí y no solo en la puerta: los enlaces de los
     correos ya mandados apuntan a la raíz, y van a seguir llegando durante
     meses. Aterrizan aquí, se recoge la sesión, y desde 0.7.14 lo que no
     traiga sesión se va a `/login/` unas líneas más abajo. */
  const veniaAOlvidar = !veniaDeGoogle && portadaAtajoOlvide();

  /* ---- La puerta está en otra dirección ----
     Quien no tenga sesión ni haya elegido usar la app sin cuenta no pinta nada
     aquí: se va a `/login/`, que es donde vive ese formulario desde 0.7.14.
     `replace` para que el botón de atrás no le devuelva a una app vacía.

     `veniaAOlvidar` frena el reboto a propósito: ese camino abre la portada en
     esta misma página con el correo puesto, y mandarlo a la puerta perdería
     por el camino lo que el enlace traía. */
  if (!veniaAOlvidar && portadaHaceFalta()) {
    /* ---- Cortafuegos del rebote ----
       Esta es la puerta de la app y no puede quedarse dando vueltas pase lo
       que pase. Si la puerta manda aquí y aquí se decide devolverla, hay un
       bucle: la persona ve el login parpadear y no entra nunca — que es
       exactamente lo que pasó en 0.7.14, cuando la puerta se olvidaba de
       guardar la sesión antes de mandar.

       Aquel fallo ya está arreglado en su sitio. Esto es la red de debajo: al
       tercer viaje se deja de rebotar y se pinta el formulario AQUÍ, en la
       app. Se pierde la separación de pantallas, que es un lujo; no se pierde
       la forma de entrar, que no lo es. */
    let vueltas = 0;
    try { vueltas = Number(sessionStorage.getItem("norata-rebotes") || 0) || 0; } catch (e) {}
    if (vueltas < 2) {
      try { sessionStorage.setItem("norata-rebotes", String(vueltas + 1)); } catch (e) {}
      location.replace("login/");
      return;
    }
    /* Se cae a la portada de aquí abajo, como se hacía antes de 0.7.14. */
  } else {
    /* Se llegó a algún sitio: la cuenta de rebotes vuelve a cero para que un
       cierre de sesión más tarde tenga sus tres viajes otra vez. */
    try { sessionStorage.removeItem("norata-rebotes"); } catch (e) {}
  }

  /* Y quien llega rebotado DESDE la puerta trae una marca: la sesión ya está
     guardada, pero este dispositivo todavía no ha hecho sitio para ella —bajar
     el progreso, apartar lo de otra cuenta si la hubiera—. Eso es
     `adoptarSesion`, la segunda mitad de lo que antes hacía `portadaEntrada`. */
  let recien = null;
  try {
    if (sessionStorage.getItem("norata-recien")) {
      recien = sessionStorage.getItem("norata-recien-aviso") || "";
      sessionStorage.removeItem("norata-recien");
      sessionStorage.removeItem("norata-recien-aviso");
    }
  } catch (e) { /* sin esto solo se pierde el saludo */ }

  /* SIN `return`, y esto costó un fallo en 0.7.14: aquí había un `return` que
     cortaba el arranque entero después de adoptar la sesión, así que en la
     primera carga tras entrar no corrían **ni el plan ni el panel de números**
     —quien pagaba veía «Gratuito» hasta que recargaba a mano—. Lo de abajo
     tiene que correr en los dos caminos; lo único que cambia es cómo se llega
     a tener la app pintada. */
  const recienEntrado = (recien !== null && syncReady());

  if (recienEntrado) {
    /* EL PLAN, ANTES DE PINTAR NADA. En el arranque normal se pide sin esperar
       —hay una copia guardada de la vez anterior y sirve para pintar ya—, pero
       quien acaba de entrar puede estar estrenando este dispositivo: ahí no hay
       copia, `PLAN` vale «libre» de fábrica, y enseñarle eso a alguien que
       acaba de entrar con una cuenta de pago es decirle que no tiene lo que
       pagó.

       Se espera de verdad, y se puede: la pantalla de carga ya está puesta
       —la puso la puerta al mandarnos— así que el viaje no añade una espera
       nueva, se mete dentro de una que ya estaba.

       CON TOPE, que es lo que hace que esperar aquí sea seguro. `fetch` no
       trae ninguno, así que una petición que ni contesta ni falla —el wifi de
       un aeropuerto que en realidad pide una contraseña— dejaría a alguien
       mirando «Entrando…» para siempre, y encima justo después de escribir su
       contraseña. Cumplido el plazo se entra igual: `planCargar` sigue su
       camino y enciende lo que toque cuando llegue. Seis segundos, la mitad
       que el tope de la sincronía, porque esto es una consulta diminuta. */
    await Promise.race([
      planCargar(),
      new Promise(listo => setTimeout(listo, 6000))
    ]);
    await adoptarSesion(recien || undefined);
  } else {
    if (!veniaDeGoogle && !veniaAOlvidar && portadaHaceFalta()) mostrarPortada();
  }
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
  /* Todo este bloque lo hace `adoptarSesion` por su cuenta cuando se llega
     desde la puerta —bajar el progreso, pintar, destapar, ofrecer el tutorial—,
     así que por ese camino se salta entero. El desgaste no: ese lo hace nadie
     más y tiene que correr en los dos. */
  if (!recienEntrado) {
    if (!veniaDeGoogle && syncReady()) await syncRun({ silent: true });
  }
  applyDecay();
  if (!recienEntrado) {
    showView(activeMainView || "summary");

    /* Y hasta aquí la pantalla de carga: ya se sabe qué hay que enseñar y está
       dibujado. Es lo último de todo a propósito — destaparla antes es
       justamente lo que hacía parpadear la app al abrirla. */
    cargaCerrar();
    quizaTutorialDeEntrada();
  }

  /* El latido va aquí, lo último de todo y sin esperarlo: es una libreta para
     saber si la gente vuelve, no una pieza de la app, y no tiene por qué
     retrasar ni un milisegundo lo que el usuario está esperando ver. Una vez
     por arranque y no en cada vuelta a la pestaña, que es lo que cuenta
     `aperturas`. Falla en silencio por diseño — ver `sbLatir()`. */
  sbLatir();

  /* Lo que se rompió antes de que la app llegara a arrancar. La red de
     seguridad de index.html lo dejó en una lista porque allí arriba todavía
     no existía nada capaz de hablar con el servidor; aquí ya sí. También sin
     esperarlo y también en silencio: un fallo al reportar un fallo no puede
     acabar molestando a quien ya tuvo el primero. */
  sbVaciarTropiezos();

  /* Y por último, si esta cuenta puede ver el panel de números. Lo contesta
     el servidor, nunca el navegador; esto solo decide si Ajustes dibuja la
     sección. Ver la advertencia al principio de `js/10e-panel.js`. */
  revisarAdmin();

  /* El plan, también al final y también sin esperarlo. Va después de pintar
     porque la app arranca en «libre» y va encendiendo lo que corresponda:
     al revés —esperar la respuesta para dibujar— quien no tenga red se queda
     mirando la pantalla de carga por culpa de una pregunta de negocio. Ver
     `js/10d-plan.js`, que empieza explicando por qué nada de esto es
     seguridad. */
  if (!recienEntrado) {
    planCargar().then(() => {
      /* Solo se repinta si resultó que sí paga: para quien no, ya está bien
         dibujado y un repintado de más hace parpadear la pantalla. */
      if (esPro()) showView(activeMainView || "summary");
    });
  }

  /* Y lo que traiga la dirección: vuelvo de pagar, o vengo de la landing con
     un plan elegido. Se atiende aquí y no en la portada porque la landing
     manda a la app entera, no a una pantalla concreta. */
  const traido = planAtenderDireccion();
  if (traido.pago === "listo") {
    /* Pantalla entera y no un aviso de abajo: es el único momento de la app en
       el que alguien acaba de pagar, y un `toast` de cuatro segundos se lo
       pierde quien mire al teléfono medio segundo tarde. La abre en estado de
       espera; `planReintentar` la resuelve. */
    compraAbrir();
  } else if (traido.pago === "cancelado") {
    /* Ni una palabra de reproche. Quien se arrepintió a mitad del pago no
       necesita que se lo recuerden; el silencio es la respuesta correcta. */
  } else if (traido.comprar) {
    irAPagar(traido.comprar).catch((e) => toast(e.message, "aviso"));
  }
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
