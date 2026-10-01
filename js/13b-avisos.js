/* ============================================================
   Los avisos en la app de Android (0.7.150)
   ============================================================

   El puente entre el Pomodoro (js/09d-jornada.js) y el complemento nativo
   `AvisosNorata` (su código y cómo se instala, en `nativo/avisos/`). En la web,
   o en un APK que no lo traiga, se sale en la primera línea y no existe
   `norataAvisos`: el Pomodoro sigue con los avisos de siempre.

   **Por qué hizo falta.** El Pomodoro avisaba con la API `Notification` del
   navegador, y el WebView de Android no la trae: en el APK no salía ningún
   aviso con la app de fondo. Y aunque la trajera, una página dormida no puede
   sonar a una hora fija; eso solo lo hace el sistema.

   Lo que hace este archivo, y nada más:
     - le pasa al complemento los textos en el idioma de la app, el color de
       la casa y la zona del perfil (`configurar`, al abrir);
     - convierte los iconos de la app (trazos de SVG) en la imagen que pide un
       aviso de Android, sobre su color, como la pastilla de una misión;
     - pone en fila lo que se manda, para que dos cambios seguidos no lleguen
       al revés;
     - recoge lo que se tocó en la cortina con la app cerrada y se lo da al
       Pomodoro (`jAplicarAvisos`), y abre el Pomodoro si se entró por un aviso.

   Va en `index.html` y no en la puerta: allí no hay Pomodoro. */

(function () {
  const cap = window.Capacitor;
  if (!cap || typeof cap.isNativePlatform !== "function" || !cap.isNativePlatform()) return;
  /* Con `isPluginAvailable` y no mirando `Plugins.AvisosNorata`: en un APK de
     antes el objeto existe igual, como una sombra que rechaza cada llamada
     (lo mismo que con `IconoNorata`, js/13-nativo.js). */
  if (typeof cap.isPluginAvailable !== "function" || !cap.isPluginAvailable("AvisosNorata")) return;
  const av = cap.Plugins.AvisosNorata;

  /* ---- Los textos que el sistema enseña sin la página ----
     Los rótulos de los botones y los nombres de los canales (lo que se ve en
     los ajustes de Android). Se mandan en cada apertura, así que cambiar de
     idioma llega a la siguiente. */
  function configurar() {
    const t = typeof tx === "function" ? tx : (s) => s;
    return Promise.resolve(av.configurar({
      textos: {
        canalReloj: t("Pomodoro en curso"),
        canalAvisos: t("Avisos del Pomodoro"),
        canalAgenda: t("Inicio de actividad"),
        pausar: t("Pausar"),
        seguir: t("Seguir"),
        iniciar: t("Iniciar"),
        posponer: t("En 5 min"),
        enPausa: t("En pausa"),
      },
      color: "#00cc7f",
      zona: typeof userTZ === "function" ? userTZ() : "",
    })).catch(() => null);
  }

  /* ---- El icono de un aviso ----
     Los iconos de la app son trazos para un `viewBox` de 24, y el color puede
     ser una variable (`var(--paleta-3)`). Se resuelve el color con el CSS de
     verdad —el de este modo y este mundo—, se dibuja el trazo en tinta oscura
     sobre un cuadro redondeado de ese color y se pasa a PNG. Se guardan los
     ya hechos: la agenda pide el mismo icono para cada día de la semana. */
  const hechos = new Map();
  function colorDe(css) {
    if (!css || css.indexOf("var(") < 0) return css || "#5fe0b0";
    const el = document.createElement("i");
    el.style.cssText = "position:absolute;width:0;height:0;visibility:hidden";
    el.style.color = css;
    document.body.appendChild(el);
    const v = getComputedStyle(el).color;
    el.remove();
    return v || "#5fe0b0";
  }
  function iconoPNG(ic) {
    if (!ic || !ic.dibujo) return Promise.resolve("");
    const fondo = colorDe(ic.color);
    const k = fondo + "|" + ic.dibujo;
    if (hechos.has(k)) return hechos.get(k);
    const p = new Promise((listo) => {
      const n = 144;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${n}" height="${n}" viewBox="0 0 24 24">` +
        `<rect width="24" height="24" rx="6" fill="${fondo}"/>` +
        `<g transform="translate(5 5) scale(0.5833)" fill="none" stroke="#10151d" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" color="#10151d">${ic.dibujo}</g></svg>`;
      const img = new Image();
      img.onload = () => {
        try {
          const cv = document.createElement("canvas");
          cv.width = cv.height = n;
          cv.getContext("2d").drawImage(img, 0, 0, n, n);
          listo(cv.toDataURL("image/png"));
        } catch (e) { listo(""); }
      };
      img.onerror = () => listo("");
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    });
    hechos.set(k, p);
    return p;
  }
  /* Cambia `icono: {dibujo, color}` por la imagen, también dentro de lo que
     el aviso guarda para después (`siguiente`, `iniciar`). */
  async function conIconos(o) {
    if (!o || typeof o !== "object") return o;
    const r = Array.isArray(o) ? [] : {};
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (k === "icono" && v && typeof v === "object") r[k] = await iconoPNG(v);
      else r[k] = v && typeof v === "object" ? await conIconos(v) : v;
    }
    return r;
  }

  /* En fila: un reloj que se pausa y se sigue en un segundo manda dos estados,
     y el segundo no puede llegar antes que el primero porque su icono ya
     estaba hecho. */
  let fila = Promise.resolve();
  const enFila = (hacer) => { fila = fila.then(hacer).catch(() => null); return fila; };

  /* ---- Lo que se tocó en la cortina ----
     El Pomodoro no cierra una fase hasta que esto se repasó una vez
     (`revisada`): una pausa de hace diez minutos cambia si el tramo ya acabó.
     Con un tope, para que un complemento que no contesta no congele el reloj. */
  let revisada = false;
  setTimeout(() => { revisada = true; }, 4000);
  let irPendiente = null;
  function repasar() {
    return Promise.resolve(av.pendientes()).then((r) => {
      revisada = true;
      if (r && Array.isArray(r.acciones) && r.acciones.length && typeof jAplicarAvisos === "function") jAplicarAvisos(r.acciones);
      if (r && r.ir) { irPendiente = r.ir; abrirPendiente(); }
    }).catch(() => { revisada = true; });
  }
  /* Entrar por un aviso lleva al Pomodoro, pero con la app ya en pie: sobre
     la pantalla de carga o sin sesión, `irAModulo` no tiene adónde ir. */
  function abrirPendiente() {
    const tope = Date.now() + 20000;
    (function mirar() {
      if (!irPendiente) return;
      const lista = typeof irAModulo === "function" && document.getElementById("view-summary") &&
        !(typeof cargaVisible === "function" && cargaVisible());
      if (lista) {
        const a = irPendiente;
        irPendiente = null;
        if (!document.querySelector("#view-" + a + ".active")) irAModulo(a);
      } else if (Date.now() < tope) setTimeout(mirar, 300);
    })();
  }

  window.norataAvisos = {
    revisada: () => revisada,
    permisos: () => Promise.resolve(av.permisos()).catch(() => ({ avisos: false, exactas: false })),
    pedir: () => Promise.resolve(av.pedirAvisos()).catch(() => ({ avisos: false, exactas: false })),
    pedirExactas: () => Promise.resolve(av.pedirExactas()).catch(() => null),
    reloj: (estado) => enFila(async () => av.reloj({ estado: estado ? await conIconos(estado) : null })),
    agenda: (entradas) => enFila(async () => av.agenda({ entradas: await conIconos(entradas || []) })),
    avisar: (titulo, texto, clave) => enFila(() => av.avisar({ titulo, texto, clave: clave || "" })),
  };

  try { Promise.resolve(av.addListener("acciones", () => repasar())).catch(() => {}); } catch (e) { /* sin oyente: se repasa al volver */ }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) repasar(); });
  const arrancar = () => { configurar().then(repasar); };
  if (document.readyState === "complete") arrancar();
  else window.addEventListener("load", arrancar);
})();
