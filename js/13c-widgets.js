/* ============================================================
   Los widgets de la pantalla de inicio, en la app de Android
   ============================================================

   El puente entre la app y el complemento nativo `WidgetsNorata` (su código y
   cómo se instala, en `nativo/widgets/`). En la web, o en un APK que no lo
   traiga, se sale en la primera línea y no existe `widgetsFoto`: la app sigue
   exactamente como estaba.

   **La regla que lo ordena todo: el widget apunta, la app aplica.** Un widget
   vive fuera de la página: no puede sumar XP, mover la racha ni sincronizar.
   Así que hace dos cosas y nada más, y las dos pasan por aquí:

     - **Enseña una foto.** La página le manda los próximos siete días ya
       resueltos —qué misiones tocan, cuáles van cumplidas, qué actividades
       trae la rueda del Pomodoro—, con los textos en el idioma de la app y
       cada color leído del CSS de verdad, en el mundo y el modo puestos. Van
       siete días y no uno porque a medianoche el widget tiene que cambiar de
       día sin que nadie abra la app.
     - **Apunta lo que tocas.** Una marca hecha en la pantalla de inicio queda
       en una cola con su día y su hora. Al abrir la app, o al momento si
       estaba viva de fondo, se aplica por `logMission`: la misma puerta que un
       toque dentro, con su XP, su racha y su sincronía. No hay un segundo
       camino para cumplir una misión.

   Hasta que la app se abra, una marca del widget no llega a tus otros
   dispositivos. Es el precio de no meter la sincronía dentro de un widget, y
   está dicho en el `LEEME.md` de `nativo/widgets/`.

   Va en `index.html` y no en la puerta: allí no hay misiones. */

(function () {
  const cap = window.Capacitor;
  if (!cap || typeof cap.isNativePlatform !== "function" || !cap.isNativePlatform()) return;
  /* Con `isPluginAvailable`, como los avisos: en un APK de antes el objeto
     existe igual, como una sombra que rechaza cada llamada. */
  if (typeof cap.isPluginAvailable !== "function" || !cap.isPluginAvailable("WidgetsNorata")) return;
  const wn = cap.Plugins.WidgetsNorata;
  const DIAS = 7;

  /* Ni en el ejemplo ni sin datos: el ejemplo no es tu día, y mandarlo dejaría
     en la pantalla de inicio misiones que no existen. */
  function hayDatos() {
    return typeof state === "object" && !!state && Array.isArray(state.missions) &&
      !(typeof modoEjemplo !== "undefined" && modoEjemplo);
  }
  /* La app en pie: con la pantalla de carga puesta o sin sesión no hay dónde
     aplicar nada, ni adónde ir. */
  function enPie() {
    return hayDatos() && typeof logMission === "function" && !!document.getElementById("view-summary") &&
      !document.getElementById("portada") && !(typeof cargaVisible === "function" && cargaVisible());
  }

  /* ---- Los colores, ya resueltos ----
     El widget no lee el CSS. Se le manda cada tono leído del navegador, que es
     quien sabe en qué mundo, ambiente y modo está la app. `color-mix` se lee
     como `color(srgb r g b)` y no como `rgb()`, y por eso se entienden los dos. */
  function aHex(css) {
    const s = String(css || "").trim();
    if (/^#[0-9a-f]{6}$/i.test(s)) return s.toLowerCase();
    let m = s.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    let rgb = m ? [m[1], m[2], m[3]].map(Number) : null;
    if (!rgb) {
      m = s.match(/^color\(srgb\s+([\d.e-]+)\s+([\d.e-]+)\s+([\d.e-]+)/);
      if (m) rgb = [m[1], m[2], m[3]].map((n) => Math.round(Math.max(0, Math.min(1, Number(n))) * 255));
    }
    return rgb ? "#" + rgb.map((n) => n.toString(16).padStart(2, "0")).join("") : null;
  }
  const leidos = new Map();
  function tono(css, suelo) {
    if (!css) return suelo;
    if (leidos.has(css)) return leidos.get(css);
    let hex = aHex(css);
    if (!hex) {
      const el = document.createElement("i");
      el.style.cssText = "position:absolute;width:0;height:0;visibility:hidden";
      el.style.color = css;
      document.body.appendChild(el);
      hex = aHex(getComputedStyle(el).color);
      el.remove();
    }
    leidos.set(css, hex || suelo);
    return hex || suelo;
  }
  function mezcla(a, b, t) {
    const x = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), y = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return "#" + x.map((v, i) => Math.round(v * t + y[i] * (1 - t)).toString(16).padStart(2, "0")).join("");
  }
  /* El mismo criterio de los avisos (js/13b-avisos.js): se mira el MATIZ y no
     una lista de mundos, para que valga también para uno que llegue mañana. */
  function esRojo(hex) {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    if (!d) return false;
    let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
    return (h <= 20 || h >= 340) && d / (1 - Math.abs(mx + mn - 1)) >= 0.45;
  }
  /* Las reglas son las de los avisos, que aprobó Eduardo: el filo lleva el
     acento del mundo; el icono también, salvo uno rojo, que pasa a la menta;
     el botón habla como Norata en todos los mundos; y lo cumplido es el verde
     de Norata, nunca el acento (`--estado-hecho`). */
  function colores() {
    const claro = document.documentElement.classList.contains("claro");
    const fondo = tono("var(--card)", claro ? "#f2f0f9" : "#1d2530");
    const texto = tono("var(--text)", claro ? "#16202b" : "#eaf1ef");
    const acento = tono("var(--mint)", claro ? "#007046" : "#5fe0b0");
    const menta = claro ? "#007046" : "#5fe0b0";
    return {
      fondo, texto, suave: tono("var(--muted)", claro ? "#4f5b67" : "#8b99a5"),
      borde: mezcla(acento, fondo, claro ? 0.3 : 0.35), raya: mezcla(texto, fondo, 0.09),
      carril: tono("var(--carril)", claro ? "#dadce7" : "#2a3441"),
      marca: esRojo(tono("var(--mint-macizo)", acento)) ? menta : acento,
      hecho: tono("var(--estado-hecho)", claro ? "#00cc7f" : "#5fe0b0"),
      boton: claro ? "#00cc7f" : "#5fe0b0", sobre: "#10151d",
    };
  }

  /* ---- Lo que toca un día ----
     La misma pregunta que `missionDueToday` (js/04-misiones.js), para un día
     cualquiera. Y además lo ya cumplido ese día: una misión de una sola vez se
     archiva al cumplirla, y sin esto desaparecería del widget en el momento de
     marcarla en vez de quedarse tachada. */
  function tocaEl(m, dia) {
    if (missionCount(m, dia) > 0) return true;
    if (m.archived) return false;
    if (m.paraHoy === dia) return true;
    if (m.tablero) return false;
    return missionScheduledOn(m, dia);
  }
  function misionesDe(dia) {
    const lista = state.missions.filter((m) => tocaEl(m, dia));
    return (typeof ordenarMisiones === "function" ? ordenarMisiones(lista) : lista).map((m) => {
      const s = m.skillId && Array.isArray(state.skills) ? state.skills.find((x) => x.id === m.skillId) : null;
      return { id: m.id, n: m.name || "", c: tono(trazo(m.color), "#5fe0b0"), t: missionTarget(m), k: missionCount(m, dia), de: s ? s.name || "" : "" };
    });
  }
  /* Las actividades salen de la rueda del Pomodoro, SIN sembrarla: `jDatos()`
     crea la rutina al pedirla, y pedirla desde aquí le pondría datos a quien
     nunca abrió el Pomodoro (que es justo lo que `moduloConCosas` mira). */
  function bloquesDe(dia) {
    const j = state.jornada;
    if (!j || !Array.isArray(j.rutinas) || j.rutinas.length !== 7) return [];
    if (typeof jornadaEncendida !== "function" || !jornadaEncendida() || typeof jNombreBloque !== "function") return [];
    return (j.rutinas[weekdayOfKey(dia)] || []).map((b) => ({ n: jNombreBloque(b), c: tono(jColorBloque(b), "#9aa7b8"), a: b.ini, b: b.fin }));
  }
  function fechaCorta(dia) {
    try {
      return new Intl.DateTimeFormat(document.documentElement.lang || "es", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })
        .format(new Date(dia + "T00:00:00Z")).replace(/[.,]/g, "");
    } catch (e) { return ""; }
  }
  function foto() {
    /* Se vuelven a leer en cada foto: el modo claro cambia los tonos sin recargar la app. */
    leidos.clear();
    const dias = {};
    let dia = todayKey();
    for (let i = 0; i < DIAS; i++) {
      dias[dia] = { fecha: fechaCorta(dia), misiones: misionesDe(dia), bloques: bloquesDe(dia) };
      dia = addDaysKey(dia, 1);
    }
    return {
      v: 1,
      zona: typeof userTZ === "function" ? userTZ() : "",
      colores: colores(),
      textos: {
        hoy: tx("Hoy"), completo: tx("Todo cumplido"), de: tx("{a} de {b}"),
        ahora: tx("Ahora"), sigue: tx("Sigue"), hasta: tx("hasta {h}"),
        vacio: tx("Hoy no tienes misiones."), apuntar: tx("Apuntar una"),
        abre: tx("Abre Norata para ver tu día."), abrir: tx("Abrir"),
      },
      dias,
    };
  }

  /* ---- Mandarla ----
     Con espera: `save()` se llama varias veces seguidas y basta la última. Y
     comparando con la anterior: casi todos los guardados no cambian nada de
     lo que el widget enseña. */
  let ultima = "", espera = null;
  function mandar() {
    clearTimeout(espera);
    if (!hayDatos()) return;
    let f;
    try { f = foto(); } catch (e) { return; }
    const s = JSON.stringify(f);
    if (s === ultima) return;
    ultima = s;
    Promise.resolve(wn.foto({ foto: f })).catch(() => { ultima = ""; });
  }
  window.widgetsFoto = function () {
    clearTimeout(espera);
    espera = setTimeout(mandar, 600);
  };

  /* ---- Aplicar lo que se tocó ----
     `pendientes` VACÍA la cola, así que no se pide hasta que la app está en
     pie: pedirla sobre la pantalla de carga sería perder las marcas.

     Cada una entra por `logMission`, callada y sin fiesta propia —`silencioso`
     y `mudo`—, con el día y la hora en que se tocó de verdad: una marca de
     anoche a las 23:50 es de ayer aunque la app se abra hoy. Al final se dice
     UNA vez lo que pasó, y entonces sí se pregunta por la racha y el nivel:
     si esas marcas te subieron de nivel, la celebración sale ahora, con el
     aviso al lado que explica de dónde vino. */
  function hhmmDe(t) {
    try {
      const p = new Intl.DateTimeFormat("en-CA", { timeZone: userTZ(), hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date(t));
      const v = (k) => (p.find((x) => x.type === k) || {}).value || "";
      const h = String(v("hour")).padStart(2, "0");
      return (h === "24" ? "00" : h) + String(v("minute")).padStart(2, "0");
    } catch (e) { return hhmmNow(); }
  }
  function aplicar(marcas) {
    const hoy = todayKey();
    let n = 0;
    marcas.slice().sort((a, b) => (a.t || 0) - (b.t || 0)).forEach((ev) => {
      const m = ev && state.missions.find((x) => x.id === ev.id);
      if (!m || !/^\d{4}-\d{2}-\d{2}$/.test(ev.dia || "") || ev.dia > hoy) return;
      const antes = missionCount(m, ev.dia);
      logMission(m.id, ev.d > 0 ? 1 : -1, { silencioso: true, mudo: true, dia: ev.dia, hora: hhmmDe(Math.min(Number(ev.t) || Date.now(), Date.now())) });
      if (missionCount(m, ev.dia) !== antes) n++;
    });
    if (!n) return;
    toast(n === 1 ? tx("Se aplicó 1 marca del widget") : tx("Se aplicaron {n} marcas del widget").replace("{n}", n), "hecho");
    if (typeof checkStreakMilestone === "function") checkStreakMilestone();
    if (typeof revisarNivelExpedicion === "function") revisarNivelExpedicion();
  }
  function ir(adonde) {
    if (typeof irAModulo !== "function") return;
    if (!document.querySelector("#view-missions.active")) irAModulo("missions");
    if (adonde === "nueva" && typeof openMissionForm === "function") openMissionForm();
  }
  let repasando = false;
  function repasar() {
    if (repasando) return;
    repasando = true;
    const tope = Date.now() + 20000;
    (function mirar() {
      if (!enPie()) {
        if (Date.now() < tope) setTimeout(mirar, 300); else repasando = false;
        return;
      }
      Promise.resolve(wn.pendientes()).then((r) => {
        if (r && Array.isArray(r.marcas) && r.marcas.length) aplicar(r.marcas);
        if (r && r.ir) ir(r.ir);
      }).catch(() => null).then(() => { repasando = false; mandar(); });
    })();
  }

  try { Promise.resolve(wn.addListener("marcas", () => repasar())).catch(() => {}); } catch (e) { /* sin oyente: se repasa al volver */ }
  /* Al irse al fondo se manda ya, sin esperar: es el último momento en que la
     página corre seguro. Y un rato después de abrir se manda otra vez, porque
     el CSS de un mundo se pide aparte y puede llegar después de `load`. */
  document.addEventListener("visibilitychange", () => { if (document.hidden) mandar(); else repasar(); });
  const arrancar = () => { repasar(); setTimeout(mandar, 3000); };
  if (document.readyState === "complete") arrancar();
  else window.addEventListener("load", arrancar);
})();
