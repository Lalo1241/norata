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
        nunca se cambia la app debajo del dedo de nadie.
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
                      !(modal && modal.classList.contains("show")) && typeof avisar === "function";
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
          return avisar(
            tx("El cambio ya está hecho. Para que el icono de Norata en tu pantalla de inicio también cambie, la app se reinicia un momento. Todo lo tuyo se queda como está."),
            "paleta", tx("Aceptar"), tx("Falta el icono")
          ).then(() => {
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
    if (lista[0]) return act.set({ id: lista[0].id }).then(() => true);
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
  /* Al volver a la app se pregunta otra vez, pero no más de una vez cada
     diez minutos: ir y venir entre apps es constante en un teléfono. */
  const ENTRE_PREGUNTAS = 10 * 60 * 1000;
  let ultimaPregunta = 0;
  let enCurso = false;

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

  async function buscar() {
    if (enCurso || Date.now() - ultimaPregunta < ENTRE_PREGUNTAS) return;
    enCurso = true;
    ultimaPregunta = Date.now();
    try {
      /* Por el puente nativo y no con `fetch`: GitHub redirige el archivo a
         otro dominio que no deja leerlo desde una página, y el puente no
         tiene esa restricción. */
      const r = await http.get({ url: ULTIMA + "?x=" + Date.now(), responseType: "json" });
      const u = typeof r.data === "string" ? JSON.parse(r.data) : r.data;
      if (!u || !u.version || !u.url || !masNueva(u.version, VERSION)) return;

      /* Si ya se bajó en otra apertura y está esperando, no se vuelve a bajar. */
      const { bundles } = await act.list();
      let paquete = (bundles || []).find((b) => b.version === u.version && b.status !== "error");
      if (!paquete) paquete = await act.download({ url: u.url, version: u.version, checksum: u.sha256 });
      await act.next({ id: paquete.id });
    } catch (e) {
      /* Sin red, o GitHub sin contestar: se vuelve a intentar en la
         siguiente vuelta. Nada de esto se le enseña a nadie; la app sigue
         funcionando con la versión que tiene. */
      ultimaPregunta = 0;
    } finally {
      enCurso = false;
    }
  }

  /* Un momento después de abrir, para no competir con el arranque. Eran
     cuatro segundos y es mucho: quien abre, mira y cierra no llegaba a
     bajarla nunca. Si al arrancar se estrenó una, esta carga se va a tirar, así
     que no se pregunta. */
  estrenar.then((cambio) => { if (!cambio) setTimeout(buscar, 1500); });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") buscar();
  });
})();
