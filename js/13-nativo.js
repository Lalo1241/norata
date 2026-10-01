/* ============================================================
   La app de Android (0.7.140.1)
   ============================================================

   Norata también se instala como app nativa de Android (Capacitor, en la
   carpeta hermana «Norata App Android», fuera de este repositorio). Allí la
   app NO carga mi.norata.app: lleva estos mismos archivos dentro, para abrir
   sin red y sin pasar por Chrome.

   Eso rompe el camino de siempre por el que llega una versión —el service
   worker—, y este archivo es el que lo sustituye allí. En la web no hace
   NADA: la primera línea se sale si no hay puente nativo.

   **Cómo llega una versión a la app:**
     1. Al publicar, `.github/workflows/paquete-app.yml` fabrica un .zip con
        estos archivos y un `ultima.json` en los releases del repositorio.
     2. Aquí, al abrir y al volver a la app, se mira ese `ultima.json`. Si es
        más nuevo que `VERSION`, se baja por detrás con su huella.
     3. `next()` lo deja listo para la PRÓXIMA apertura, igual que en la web:
        nunca se cambia la app debajo del dedo de nadie. Y desde 0.7.148.9 se
        DICE: un aviso con botón para estrenarla ya, y otro al abrir con la
        versión nueva puesta (ver «Decirlo», abajo).
     4. Si esa versión arranca rota, el complemento vuelve solo a la anterior:
        lo que la da por buena es `notifyAppReady()`, que se llama arriba del
        todo y no al final. Llamarlo tarde, detrás de la red, haría que una
        conexión lenta pareciera una versión rota.

   **Por qué se carga también en la puerta (`login/index.html`):** sin sesión,
   la app rebota a la puerta antes de terminar de arrancar, y una versión que
   no llegue a decir «estoy bien» en ~15 s se deshace sola. Es el único
   archivo de la puerta que ejecuta algo al cargarse, y a propósito: fuera de
   la app nativa no hace nada. */

(function () {
  const cap = window.Capacitor;
  if (!cap || typeof cap.isNativePlatform !== "function" || !cap.isNativePlatform()) return;

  const act = cap.Plugins && cap.Plugins.CapacitorUpdater;
  const http = cap.Plugins && cap.Plugins.CapacitorHttp;
  document.documentElement.classList.add("nativa");

  /* ---- El icono de cada mundo (0.7.145) ----
     En el APK, el icono de la pantalla de inicio es el del mundo puesto. Los
     dieciocho viajan dentro del APK como entradas de la app (`activity-alias`)
     y el complemento `IconoNorata` —nativo, en la carpeta de Android; su
     código y los pasos están en `mundos/iconos/android/`— enciende la del
     mundo y apaga las demás.

     Cambia en UN solo momento, y siempre con aviso (0.7.146.1): al elegir un
     mundo, `recargarApp` apunta que hay un icono pedido y recarga; aquí, ya
     con la app entera en el mundo nuevo, sale un aviso, y al aceptarlo la app
     se reinicia con el icono. Lo pidió Eduardo así después de verlo en su
     teléfono (el porqué del orden, en `recargarApp`, js/01-base.js).

     Ya no cambia al irse la app al fondo, como hacía la 0.7.145. Eso cubría
     lo que nadie eligió —un plan que vence y devuelve la casa—, pero también
     se disparaba en la recarga misma del cambio de mundo, y un icono que
     cambia sin que nadie lo pida es justo el cambio a medias que se quería
     quitar. Ese caso raro se corrige solo en el siguiente cambio de mundo.

     Con `isPluginAvailable` y no mirando `Plugins.IconoNorata`: los APK de
     antes de esto no lo traen y el objeto existe igual, como una sombra que
     rechaza cada llamada. Sin complemento no se define `norataIcono`, y
     `recargarApp` recarga como siempre. */
  if (typeof cap.isPluginAvailable === "function" && cap.isPluginAvailable("IconoNorata")) {
    const iconoNativo = cap.Plugins.IconoNorata;
    /* Qué icono toca. Un mundo manda sobre Arcade (son excluyentes) y un
       ambiente no tiene icono propio: con un ambiente va el de la casa, como
       manda la regla de la marca. Arcade se lee de lo GUARDADO y no del
       atributo, porque al quitarlo se recarga con el atributo todavía puesto.
       En la puerta no hay apariencia, así que no se decide nada. */
    const iconoQueToca = () => {
      if (typeof apariencia !== "function") return null;
      if (typeof aparienciaDePrueba === "function" && aparienciaDePrueba()) return null;
      const a = apariencia();
      if (typeof esMundo === "function" && esMundo(a)) return a;
      try {
        if (typeof ARCADE_LLAVE !== "undefined" && localStorage.getItem(ARCADE_LLAVE) === "arcade") return "arcade";
      } catch (e) {}
      return "casa";
    };
    /* `recargarApp` solo pregunta si existe: es la señal de que este APK sabe
       cambiar el icono. */
    window.norataIcono = () => Promise.resolve(iconoQueToca());

    const olvidarPedido = () => {
      try { localStorage.removeItem(ICONO_PEDIDO_LLAVE); } catch (e) {}
    };
    /* Se espera a que la app haya terminado de arrancar: la pantalla de carga
       cerrada y ninguna otra ventana abierta. Encima de la carga el aviso no
       se vería, y encima de otra ventana la pisaría. Con un tope, para no
       quedarse preguntando para siempre si algo no cierra. */
    const cuandoEsteLista = (hacer) => {
      const tope = Date.now() + 20000;
      (function mirar() {
        const modal = document.getElementById("modal");
        const lista = typeof cargaVisible === "function" && !cargaVisible() &&
                      !(modal && modal.classList.contains("show")) && typeof avisarRenacer === "function";
        if (lista) hacer();
        else if (Date.now() < tope) setTimeout(mirar, 300);
      })();
    };
    const revisarIconoPedido = () => {
      let pedido = false;
      try { pedido = localStorage.getItem(ICONO_PEDIDO_LLAVE) === "1"; } catch (e) {}
      if (!pedido) return;
      cuandoEsteLista(() => {
        /* Se decide con la app ya asentada, no al cargar: el mundo pedido
           puede no quedarse (un plan que el servidor no confirma devuelve la
           casa), y el icono tiene que ser el del mundo que se VE. */
        const id = iconoQueToca();
        if (!id) return;
        Promise.resolve(iconoNativo.actual()).then((r) => {
          /* Ya es ese: pasa después del reinicio, o si el mundo no se quedó.
             Nada que avisar. */
          if (r && r.icono === id) { olvidarPedido(); return; }
          return avisarRenacer().then(() => {
            /* Se olvida ANTES de reiniciar: si no, la app volvería a preguntar
               al abrir. Y si el disco no alcanzó a guardarlo, al abrir ya
               coincide el icono y se olvida sin avisar (arriba). */
            olvidarPedido();
            if (typeof cargaMostrar === "function") cargaMostrar(tx("Reiniciando…"));
            return Promise.resolve(iconoNativo.poner({ icono: id, reiniciar: true })).then((p) => {
              /* Si no hubo nada que cambiar, no hay reinicio que tape la carga. */
              if (!(p && p.cambiado) && typeof cargaCerrar === "function") cargaCerrar();
            });
          });
        }).catch(() => {
          if (typeof cargaCerrar === "function") cargaCerrar();
        });
      });
    };
    if (document.readyState === "complete") revisarIconoPedido();
    else window.addEventListener("load", revisarIconoPedido);
  }

  if (!act) return;

  act.notifyAppReady().catch(() => {});

  /* ---- Estrenar lo que ya está bajado (0.7.140.4) ----
     `next()` deja una versión lista, pero el complemento solo la cambia cuando
     la app se va al FONDO. Cerrarla de golpe desde recientes no cuenta, y así
     le pasó a Eduardo: abría, cerraba, abría, y seguía en la vieja con la nueva
     bajada y esperando. Ahora, al arrancar, si hay una más nueva ya bajada se
     pone en ese momento — la carga de la app tapa la recarga. Lo que falló una
     vez (`error`) no se vuelve a probar: eso es la vuelta atrás del complemento,
     y reintentarla aquí sería un bucle. */
  const estrenar = act.list().then(({ bundles }) => {
    const lista = (bundles || [])
      .filter((b) => (b.status === "success" || b.status === "pending") && masNueva(b.version, VERSION))
      .sort((x, y) => (masNueva(x.version, y.version) ? -1 : 1));
    if (lista[0]) {
      /* Esto pasa AL ABRIR la app y recarga la página por debajo: para quien
         la abre sigue siendo su primera apertura, así que se quita la marca y
         la carga que viene es la de entrada, con su zoom (0.7.158). */
      try { sessionStorage.removeItem("norata-abierta"); } catch (e) {}
      return act.set({ id: lista[0].id }).then(() => true);
    }
    return false;
  }).catch(() => false);

  /* ---- La vuelta de Google (0.7.140.4) ----
     Google se abre en el navegador del teléfono y vuelve a
     `app.norata://login#access_token=…`; Android le da esa dirección a la app y
     aquí se pasa a la puerta, que ya sabe leer lo que cuelga de ella
     (`sbVolverDeEnlace`). Llega por dos caminos: con la app abierta
     (`appUrlOpen`) o arrancándola (`getLaunchUrl`). El segundo devuelve la MISMA
     dirección en cada carga de página, así que se apunta la que ya se atendió:
     sin eso, la puerta la volvería a recibir al cargar y entraría en bucle. */
  const appNativa = cap.Plugins.App;
  function volverDeFuera(url) {
    if (!url || url.indexOf("app.norata://login") !== 0) return;
    /* Solo la puerta. Fuera de ella la app rebota sola a la puerta si no hay
       sesión, y allí se vuelve a pedir; atenderlo en los dos sitios hacía que
       los dos viajes se pisaran. */
    if (document.getElementById("view-summary")) return;
    /* Se apunta ANTES de viajar, y por eso no hay bucle: la vuelta llega dos
       veces —`appUrlOpen` guarda el aviso y lo repite al escuchar, y
       `getLaunchUrl` lo devuelve en cada carga— y la segunda ya se encuentra
       apuntada. Mirar la dirección al llegar no servía: la puerta la limpia
       en cuanto la lee, y a veces antes de que esto corra. En el simulador
       eso fueron tres recargas en vez de una. */
    /* Una LISTA y no la última: `getLaunchUrl` sigue devolviendo la dirección
       con la que se ARRANCÓ la app aunque después hayan llegado otras, y
       guardando solo la última, esa vieja volvía a colarse. */
    try {
      const vistas = JSON.parse(sessionStorage.getItem("norata-vueltas-atendidas") || "[]");
      if (vistas.indexOf(url) >= 0) return;
      vistas.push(url);
      sessionStorage.setItem("norata-vueltas-atendidas", JSON.stringify(vistas.slice(-10)));
    } catch (e) { return; }
    /* `vuelta=` en la consulta obliga a una carga de verdad. Sin ella, estando
       ya en la puerta, cambiar solo lo de detrás de la `#` NO recarga la
       página, y la puerta —que lee la sesión al cargarse— nunca la veía. */
    const q = url.indexOf("?"), h = url.indexOf("#");
    const consulta = q >= 0 ? url.slice(q + 1, h > q ? h : undefined) : "";
    const ancla = h >= 0 ? url.slice(h) : "";
    location.replace("/login/index.html?" + (consulta ? consulta + "&" : "") + "vuelta=" + Date.now() + ancla);
  }
  /* Con `try`: esta parte llega también por actualización a los APK de antes
     de 0.7.140.4, que no traen el complemento `App`, y allí llamarlo puede
     fallar de golpe en vez de devolver una promesa rechazada. */
  if (appNativa) {
    try {
      Promise.resolve(appNativa.addListener("appUrlOpen", (e) => volverDeFuera(e && e.url))).catch(() => {});
      Promise.resolve(appNativa.getLaunchUrl()).then((r) => volverDeFuera(r && r.url)).catch(() => {});
    } catch (e) { /* APK sin el complemento: Google seguirá volviendo a la web */ }
  }

  const ULTIMA = "https://github.com/Lalo1241/norata/releases/latest/download/ultima.json";
  /* ---- Cuándo se pregunta (0.7.148.9) ----
     Eran diez minutos entre preguntas y solo al abrir o al volver: con varias
     publicaciones al día, el teléfono de Eduardo se quedaba en la 0.7.148.4
     mientras la web iba por la .8. Ahora es lo mismo que la web
     (js/11-arranque.js): al abrir, al volver (con un suelo de un minuto, que
     ir y venir entre apps es constante), cada quince minutos a la vista y al
     recuperar la red. */
  const ENTRE_PREGUNTAS = 60 * 1000;
  const CADA = 15 * 60 * 1000;
  let ultimaPregunta = 0;
  let busqueda = null;
  /* La versión bajada y esperando: `{ id, version }`, o nada. */
  let lista = null;

  /* 0.7.140.1 contra 0.7.140: por tramos y como números, no como texto —
     como texto, «0.7.99» saldría más nuevo que «0.7.140». */
  function masNueva(a, b) {
    const x = String(a).split(".").map(Number), y = String(b).split(".").map(Number);
    for (let i = 0; i < Math.max(x.length, y.length); i++) {
      const d = (x[i] || 0) - (y[i] || 0);
      if (d) return d > 0;
    }
    return false;
  }

  /* Contesta qué pasó, porque el tirón hacia abajo lo pregunta y tiene que
     poder decirlo (ver abajo): "lista", "aldia" o "error". */
  function buscar(forzar) {
    if (busqueda) return busqueda;
    if (!forzar && Date.now() - ultimaPregunta < ENTRE_PREGUNTAS) return Promise.resolve(lista ? "lista" : "aldia");
    ultimaPregunta = Date.now();
    busqueda = (async () => {
      try {
        /* Por el puente nativo y no con `fetch`: GitHub redirige el archivo a
           otro dominio que no deja leerlo desde una página, y el puente no
           tiene esa restricción. */
        const r = await http.get({ url: ULTIMA + "?x=" + Date.now(), responseType: "json" });
        const u = typeof r.data === "string" ? JSON.parse(r.data) : r.data;
        if (!u || !u.version || !u.url || !masNueva(u.version, VERSION)) return lista ? "lista" : "aldia";
        if (lista && lista.version === u.version) return "lista";

        /* Si ya se bajó en otra apertura y está esperando, no se vuelve a bajar. */
        const { bundles } = await act.list();
        let paquete = (bundles || []).find((b) => b.version === u.version && b.status !== "error");
        if (!paquete) paquete = await act.download({ url: u.url, version: u.version, checksum: u.sha256 });
        /* `next()` se queda: si nadie pulsa el aviso, entra sola al irse la app
           al fondo — y al volver, `revisarNovedades` (js/10l-novedades.js) dice que entró. */
        await act.next({ id: paquete.id });
        lista = { id: paquete.id, version: u.version };
        avisarLista();
        return "lista";
      } catch (e) {
        /* Sin red, o GitHub sin contestar: se vuelve a intentar en la
           siguiente vuelta. La app sigue funcionando con la que tiene. */
        ultimaPregunta = 0;
        return "error";
      } finally {
        busqueda = null;
      }
    })();
    return busqueda;
  }

  /* ---- Decirlo (0.7.148.9; la tarjeta, desde 0.7.149) ----
     Hasta la 0.7.148.9 todo esto pasaba en silencio: la versión se bajaba sin
     avisar, y entraba sola cuando la app se iba al fondo, así que de repente
     se estaba en otra sin saber cuándo ni por qué. Lo contó Eduardo: «tiende a
     no comunicarme ni cuando llegan ni cuando hay alguna disponible».

     Son dos avisos, los mismos que la web:
       - **Hay una lista**: la tarjeta que se queda (`avisoVersionLista`,
         js/10l-novedades.js), con un botón que la estrena en el acto. Si se
         cierra, vuelve al volver a la app.
       - **Ya entró**: lo dice `revisarNovedades` al abrir, con la ventana de
         Novedades si hay algo publicado que contar, o con un aviso chico si no.
     Solo en la app: en la puerta no hay dónde pintarlos. */
  const enLaApp = () => !!document.getElementById("view-summary");
  function avisarLista() {
    if (!lista || !enLaApp() || document.hidden) return;
    if (typeof avisoVersionLista === "function") avisoVersionLista(lista.version, "norataActualizar()");
    else if (typeof toast === "function")
      toast(T`Ya está lista la versión ${lista.version}`, "atencion", { label: tx("Actualizar"), onclick: "norataActualizar()", ms: 12000 });
  }

  /* El botón del aviso, y el tirón hacia abajo cuando hay una esperando: se
     estrena en el acto, detrás de la pantalla de carga. Sustituye a la de
     js/11-arranque.js, que en la web recarga para que entre el service worker
     nuevo y aquí no haría nada. */
  window.norataHayVersion = () => !!lista;
  window.norataActualizar = function () {
    if (!lista) return;
    if (typeof cargaMostrar === "function") cargaMostrar(tx("Actualizando…"));
    /* La carga que viene es la del estreno, con su versión (0.7.158). */
    try { sessionStorage.setItem("norata-estreno", lista.version || "1"); } catch (e) {}
    act.set({ id: lista.id }).catch(() => {
      try { sessionStorage.removeItem("norata-estreno"); } catch (e) {}
      if (typeof cargaCerrar === "function") cargaCerrar();
      if (typeof toast === "function") toast(tx("No pude estrenar la versión nueva. Se pondrá sola al cerrar la app."), "atencion");
    });
  };
  /* El tirón hacia abajo pregunta por aquí, y con tope: una red que ni
     contesta ni falla no puede dejar la cápsula colgada. */
  window.norataBuscarNativo = () => Promise.race([
    buscar(true),
    new Promise((r) => setTimeout(() => r("error"), 30000)),
  ]);

  /* Un momento después de abrir, para no competir con el arranque. Si al
     arrancar se estrenó una, esta carga se va a tirar, así que no se pregunta. */
  estrenar.then((cambio) => {
    if (cambio) return;
    setTimeout(() => buscar(), 1500);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    avisarLista();
    buscar();
  });
  window.addEventListener("online", () => buscar());
  setInterval(() => { if (!document.hidden) buscar(); }, CADA);
})();
