/* ============================================================
   Los avisos en la app de Android (0.7.163)
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
      color: colorDeMarca(),
      colores: coloresDeAviso(),
      zona: typeof userTZ === "function" ? userTZ() : "",
    })).catch(() => null);
  }

  /* ---- El tono de los avisos sigue al mundo (0.7.163) ----
     Lo pidió Eduardo: los avisos «tienen que venir de la mano del diseño del
     mundo seleccionado». Es la misma regla que la marca en el menú
     (`--marca-menu`, 0.7.148.4): un MUNDO recolorea, y la casa, un ambiente y
     Arcade se quedan en la menta. Se usa la cara MACIZA del acento, la que
     rellena: Android pinta con este tono el círculo del isotipo y los
     botones, y él mismo lo ajusta para que se lea sobre su cortina clara u
     oscura. Al cambiar de mundo la app se recarga, y con eso se vuelve a
     mandar. */
  const MENTA = "#00cc7f";
  function aHex(css) {
    const m = String(css || "").match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    if (!m) return /^#[0-9a-f]{6}$/i.test(css) ? css : null;
    return "#" + [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, "0")).join("");
  }
  function colorDeMarca() {
    try {
      const cs = getComputedStyle(document.documentElement);
      if (!cs.getPropertyValue("--marca-menu").trim()) return MENTA;
      const hex = aHex(colorDe("var(--mint-macizo)"));
      return hex && !esRojo(hex) ? hex : MENTA;
    } catch (e) { return MENTA; }
  }
  /* ---- Un acento rojo no pinta botones ----
     Android usa este mismo tono para los botones del aviso, y en Catedral y
     Averno el acento es rojo: un «Iniciar» rojo se lee como peligro, que es
     justo lo que la regla de los botones de la app no permite (lo paró
     Eduardo). Con un acento rojo, los avisos se quedan en la menta. Se mira
     el MATIZ y no una lista de mundos, para que valga también para uno que
     llegue mañana. */
  function esRojo(hex) {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    if (!d) return false;
    let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
    const sat = d / (1 - Math.abs(mx + mn - 1));
    return (h <= 20 || h >= 340) && sat >= 0.45;
  }

  /* ---- Los tonos de los moldes (0.7.163) ----
     El APK no lee el CSS: se le manda cada tono ya resuelto, en el mundo y el
     modo de la app. Aquí se aplican las reglas que aprobó Eduardo sobre la
     lámina, y el APK no decide ninguna:
       - el BORDE lleva el acento del mundo, también el rojo de Catedral y Averno;
       - los RÓTULOS llevan el acento, salvo uno rojo: ahí, la menta (un texto
         rojo se lee como algo malo aunque diga «En foco»);
       - los BOTONES hablan como Norata en todos los mundos: menta, y Pausa en el
         amarillo de «en curso»;
       - los ESTADOS son los de Norata, verde y amarillo.
     Los velos van mezclados con el fondo y opacos, porque un aviso no sabe de
     transparencias sobre su propio fondo. */
  function mezcla(a, b, t) {
    const x = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), y = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return "#" + x.map((v, i) => Math.round(v * t + y[i] * (1 - t)).toString(16).padStart(2, "0")).join("");
  }
  function coloresDeAviso() {
    const claro = document.documentElement.classList.contains("claro");
    const v = (n, porDefecto) => aHex(colorDe("var(" + n + ")")) || porDefecto;
    const fondo = v("--card", claro ? "#f2f0f9" : "#1d2530");
    const acento = v("--mint", claro ? "#007046" : "#5fe0b0");
    const menta = claro ? "#007046" : "#5fe0b0", mentaMaciza = claro ? "#00cc7f" : "#5fe0b0";
    const amarillo = claro ? "#f5c314" : "#f5d76e", amarilloTinta = claro ? "#755c05" : "#f5d76e";
    const hecho = v("--estado-hecho", "#5fe0b0"), curso = v("--estado-curso", "#f5d76e");
    const rojo = esRojo(v("--mint-macizo", acento));
    const velo = mezcla(mentaMaciza, fondo, claro ? 0.16 : 0.14);
    const veloPausa = mezcla(amarillo, fondo, claro ? 0.2 : 0.15);
    return {
      borde: acento, fondo, texto: v("--text", "#eaf1ef"), suave: v("--muted", "#9aa7b3"), carril: v("--carril", "#2a3441"),
      marca: rojo ? menta : acento,
      hecho, hechoTinta: v("--estado-hecho-tinta", hecho), hechoVelo: mezcla(hecho, fondo, 0.16),
      curso, cursoTinta: v("--estado-curso-tinta", curso), cursoVelo: mezcla(curso, fondo, 0.16),
      botones: {
        primario: { borde: mentaMaciza, fondo: mentaMaciza, tinta: "#10151d" },
        suave: { borde: velo, fondo: velo, tinta: menta },
        pausa: { borde: veloPausa, fondo: veloPausa, tinta: amarilloTinta },
        linea: { borde: menta, fondo, tinta: menta },
        neutro: { borde: v("--line", "#2a3441"), fondo, tinta: v("--text", "#eaf1ef") }
      }
    };
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
    /* Un solo redondeo para todos los mundos (0.7.163, como el marco), o un
       disco para los descansos, que en la rueda también son redondos. */
    const disco = ic.forma === "disco";
    const k = fondo + "|" + (disco ? "o" : "r") + "|" + ic.dibujo;
    if (hechos.has(k)) return hechos.get(k);
    const p = new Promise((listo) => {
      const n = 144;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${n}" height="${n}" viewBox="0 0 24 24">` +
        (disco ? `<circle cx="12" cy="12" r="12" fill="${fondo}"/>` : `<rect width="24" height="24" rx="6" fill="${fondo}"/>`) +
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
    avisar: (titulo, texto, clave, vista, icono) => enFila(async () => av.avisar({ titulo, texto, clave: clave || "",
      vista: vista || null, icono: icono ? await iconoPNG(icono) : "" })),
  };

  try { Promise.resolve(av.addListener("acciones", () => repasar())).catch(() => {}); } catch (e) { /* sin oyente: se repasa al volver */ }
  /* Se vuelve a configurar al volver y un rato después de abrir: el CSS de un
     mundo se pide aparte y puede llegar después de `load`, y sin él el tono
     saldría el de la casa. */
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { configurar(); repasar(); } });
  const arrancar = () => { configurar().then(repasar); setTimeout(configurar, 3000); };
  if (document.readyState === "complete") arrancar();
  else window.addEventListener("load", arrancar);
})();
