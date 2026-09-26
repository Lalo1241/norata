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
  if (!act) return;

  act.notifyAppReady().catch(() => {});

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

  /* Un momento después de abrir, para no competir con el arranque. */
  setTimeout(buscar, 4000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") buscar();
  });
})();
