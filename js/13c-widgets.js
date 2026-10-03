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
       resueltos (y para los demás widgets, la racha, el nivel, la habilidad
       por cuidar, el nodo que toca y el tramo del Pomodoro) —qué misiones tocan, cuáles van cumplidas, qué actividades
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
      /* Lo que piden los demás widgets: el acento para aros y barras, los dos
         estados con su tinta, y los velos de los botones tenues, ya mezclados
         con el fondo (un widget no sabe de transparencias). */
      acento, tonoA: mezcla(acento, fondo, 0.16),
      hechoTinta: tono("var(--estado-hecho-tinta)", menta),
      curso: tono("var(--estado-curso)", claro ? "#f5c314" : "#f5d76e"),
      cursoTinta: tono("var(--estado-curso-tinta)", claro ? "#755c05" : "#f5d76e"),
      cursoVelo: mezcla(claro ? "#f5c314" : "#f5d76e", fondo, 0.16),
      tono: mezcla(claro ? "#00cc7f" : "#5fe0b0", fondo, 0.15), tonoTinta: menta,
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
    return (j.rutinas[weekdayOfKey(dia)] || []).map((b) => ({ n: jNombreBloque(b), c: tono(jColorBloque(b), "#9aa7b8"), a: b.ini, b: b.fin, luna: b.descanso === "dormir" }));
  }
  /* ---- Lo que enseñan los demás widgets ----
     Cada uno pregunta con las funciones que la app ya usa en sus pantallas, y
     ninguna de las de aquí escribe: nada de `applyDecay`, `jDatos` ni
     `ramasDe`, que guardan o siembran al llamarlas. Si una falla, ese widget
     se queda sin dato y los demás siguen (`sinFallo`). */
  function sinFallo(f) { try { return f() || null; } catch (e) { return null; } }

  /* La racha de SEMANAS (js/05c-racha.js). `previas` son las encendidas seguidas
     antes de esta: es la misma cuenta que hace `mensajeRacha`. La semana va de
     domingo a sábado, y se mandan sus siete claves para que el widget sepa
     cuándo ha empezado otra. */
  function racha() {
    if (typeof semanasDeRacha !== "function" || typeof activityDayCounts !== "function") return null;
    const Z = semanasDeRacha(activityDayCounts(), todayKey());
    const corte = Z.lista.slice(1).findIndex((w) => !w.ok);
    const letra = (k) => {
      try {
        return new Intl.DateTimeFormat(document.documentElement.lang || "es", { weekday: "narrow", timeZone: "UTC" })
          .format(new Date(k + "T00:00:00Z")).slice(0, 1).toUpperCase();
      } catch (e) { return ""; }
    };
    return {
      claves: Z.dias.map((d) => d.k), dias: Z.dias.map((d) => (d.estado === "si" ? 1 : 0)), letras: Z.dias.map((d) => letra(d.k)).join(""),
      umbral: typeof UMBRAL_SEMANA === "number" ? UMBRAL_SEMANA : 3, previas: corte < 0 ? Z.lista.length - 1 : corte,
    };
  }
  /* El aro mide el camino ENTERO hasta el próximo módulo, no lo que llevas del
     nivel en curso: la misma cuenta de `aroDeNivelHTML` (js/02b-expedicion.js). */
  function expedicion() {
    if (typeof nivelExpedicion !== "function") return null;
    const info = nivelExpedicion();
    const sig = typeof escaleraDeExpedicion === "function" ? escaleraDeExpedicion().find((x) => x.tipo === "modulo" && x.nivel > info.nivel) : null;
    const pide = puntosHastaNivel(sig ? sig.nivel : info.nivel + 1);
    const rango = typeof rangoExpedicion === "function" && typeof nombreDeRango === "function" ? nombreDeRango(rangoExpedicion()) : "";
    return {
      nivel: info.nivel, pct: pide > 0 ? Math.round(Math.max(0, Math.min(1, info.puntos / pide)) * 100) : 100, candado: !!sig,
      linea: sig ? tx("{m} en el nivel {n}").replace("{m}", tx(sig.corto || sig.nombre)).replace("{n}", sig.nivel) : rango,
    };
  }
  /* La habilidad que lleva más días sin práctica, y la misión de hoy que la
     mantiene, si hay una. Las permanentes y las que no tienen XP no bajan. */
  function habilidad(hoy) {
    const vivas = (state.skills || []).filter((s) => !s.permanent && s.xp > 0);
    if (!vivas.length) return null;
    const s = vivas.slice().sort((a, b) => diasSinGanar(b) - diasSinGanar(a))[0];
    const d = diasSinGanar(s), gracia = daysUntilDecay(s), li = levelInfo(s.xp);
    const suyas = state.missions.filter((m) => m.skillId === s.id && tocaEl(m, hoy));
    const m = suyas.find((x) => !missionDone(x, hoy)) || suyas[0];
    return {
      n: s.name || "", sub: tx("Nivel {n}").replace("{n}", li.level), pct: li.pct, bien: d === 0, mid: m ? m.id : "",
      a1: d === 1 ? tx("1 día sin práctica") : tx("{n} días sin práctica").replace("{n}", d),
      a2: isDecaying(s) ? tx("Ya está bajando") : gracia == null ? "" : gracia === 0 ? tx("Empieza a bajar mañana")
        : gracia === 1 ? tx("Empieza a bajar en 1 día") : tx("Empieza a bajar en {n} días").replace("{n}", gracia),
    };
  }
  /* El nodo que toca: el que ya está en marcha y se tocó último, o si no, uno
     disponible. No hay «rama fijada» en la app, así que se elige por actividad. */
  function nodo() {
    if (typeof moduloAbierto === "function" && !moduloAbierto("tree")) {
      const f = typeof faltaParaNivel === "function" && typeof MODULO_NIVEL === "object" ? faltaParaNivel(MODULO_NIVEL.tree) : null;
      return { cerrado: true, r1: tx("Ramas"), r2: f ? f.abre : "" };
    }
    if (typeof moduloOn === "function" && !moduloOn("tree")) return { cerrado: true, r1: tx("Ramas"), r2: tx("Tus ramas están apagadas") };
    const peso = { active: 0, due: 0, available: 1 };
    const vivos = (state.perks || []).filter((p) => perkStatus(p) in peso)
      .sort((a, b) => peso[perkStatus(a)] - peso[perkStatus(b)] || String(b.lastActivity || "").localeCompare(String(a.lastActivity || "")));
    if (!vivos.length) return { r1: tx("Ramas"), r2: tx("Tu siguiente nodo aparecerá aquí."), tipo: "hito", t: 0 };
    const p = vivos[0], rama = p.branch || "General", suyos = state.perks.filter((x) => (x.branch || "General") === rama);
    return {
      r1: tx("{r} · siguiente nodo").replace("{r}", rama), r2: p.name || "", tipo: typeof tipoDe === "function" ? tipoDe(p) : "hito",
      h: suyos.filter((x) => perkStatus(x) === "completed").length, t: suyos.length,
    };
  }
  /* El tramo en curso, leído de `state.jornada` SIN `jDatos()`. `fin` es la hora
     a la que acaba si corre: el widget cuenta hacia ella con su cronómetro. */
  function pomo() {
    if (typeof jornadaEncendida !== "function" || !jornadaEncendida()) {
      const abierto = typeof moduloAbierto !== "function" || moduloAbierto("jornada");
      const f = !abierto && typeof faltaParaNivel === "function" && typeof MODULO_NIVEL === "object" ? faltaParaNivel(MODULO_NIVEL.jornada) : null;
      return { cerrado: f ? f.abre : tx("Pomodoro apagado") };
    }
    const j = state.jornada || {}, cfg = j.cfg || {}, run = j.run;
    const o = { dur: (Number(cfg.foco) || 25) * 60000, tramo: 1, total: Number(cfg.ciclos) || 4, corre: false, pausa: false, dormido: !!j.dormido };
    if (run && run.fase === "foco" && run.dur && !run.libre) {
      o.dur = run.dur; o.tramo = run.tramo || 1;
      if (run.lite && run.rondas) o.total = run.rondas;
      if (run.seg) { o.corre = true; o.fin = run.seg + run.dur - (run.acum || 0); }
      else { o.pausa = true; o.resto = Math.max(0, run.dur - (run.acum || 0)); }
    }
    return o;
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
      racha: sinFallo(racha), exp: sinFallo(expedicion), hab: sinFallo(() => habilidad(todayKey())), nodo: sinFallo(nodo), pomo: sinFallo(pomo),
      textos: {
        hoy: tx("Hoy"), completo: tx("Todo cumplido"), de: tx("{a} de {b}"),
        ahora: tx("Ahora"), sigue: tx("Sigue"), hasta: tx("hasta {h}"),
        vacio: tx("Hoy no tienes misiones."), apuntar: tx("Apuntar una"),
        abre: tx("Abre Norata para ver tu día."), abrir: tx("Abrir"),
        sigue_rot: tx("Lo que sigue"), quedan: tx("Quedan {n} hoy"), ultima: tx("Es la última de hoy"),
        nada: tx("Nada pendiente. Hoy ya quedó."), sin: tx("Sin misiones para hoy"),
        luc: tx("Luciérnagas"), de_n: tx("de {n}"), enc: tx("encendidas hoy"), descansan: tx("Hoy descansan"),
        racha: tx("Racha"), semana_1: tx("semana\nencendida"), semanas_n: tx("semanas\nencendidas"), semana_ok: tx("Semana encendida"),
        semana_0: tx("Tu semana empieza con el primer día"), falta_1: tx("Falta 1 día para encender esta semana"),
        faltan_n: tx("Faltan {n} días para encender esta semana"),
        exp: tx("Expedición"), nivel: tx("nivel"), cobrar: tx("+{n} por cobrar"),
        apuntar_t: tx("Apuntar"), mision: tx("Misión"), habilidad: tx("Habilidad"), reloj: tx("Reloj"),
        cuidar: tx("Por cuidar"), cuidar_vacio: tx("Tu primera habilidad aparecerá aquí cuando la practiques."),
        aldia: tx("Al día"), practicaste: tx("Hoy ya practicaste"), practica: tx("Marcar práctica"),
        pomo: tx("Pomodoro"), enfoque: tx("Enfoque"), en_pausa: tx("En pausa"), libre: tx("Tiempo libre"), listo: tx("Tramo listo"),
        iniciar: tx("Iniciar"), iniciar_l: tx("Iniciar enfoque"), pausar: tx("Pausar"), seguir: tx("Seguir"),
        dormir_rot: tx("Hora de dormir"), durmiendo: tx("Durmiendo"), levantas: tx("Te levantas a las {h}"),
        noches: tx("Buenas noches, a dormir"), noches_c: tx("A dormir"), dias_b: tx("Buenos días, ya desperté"), dias_c: tx("Ya desperté"),
        enfocar: tx("Enfocar de todos modos"), tramo: tx("Tramo {a} de {b}"), hasta_m: tx("Hasta las {h}"), sigue_b: tx("Sigue {n}, {h}"),
        ramas: tx("Ramas"),
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
  /* ---- Adónde abrir ----
     Lo que se tocó en un widget y no es una marca: abrir la app en su sitio, y
     en el Pomodoro, hacer además lo que decía el botón. El reloj no se arranca
     desde el widget con la app cerrada (ver `Pinta.pomodoro`): se arranca aquí,
     con la app ya abierta, por las mismas funciones que sus botones. */
  function ir(adonde) {
    if (typeof irAModulo !== "function") return;
    const [sitio, accion] = String(adonde).split(":");
    const a = (vista) => { if (!document.querySelector("#view-" + vista + ".active")) irAModulo(vista); };
    if (sitio === "nueva") { a("missions"); if (typeof openMissionForm === "function") openMissionForm(); return; }
    if (sitio === "habilidad") { a("home"); if (typeof openSkillForm === "function") openSkillForm(); return; }
    if (sitio === "expedicion") { if (typeof abrirColeccion === "function") abrirColeccion(); return; }
    if (sitio === "racha") { a("summary"); if (typeof abrirTuRacha === "function") abrirTuRacha(); return; }
    if (["summary", "missions", "home", "tree", "jornada"].indexOf(sitio) < 0) return;
    a(sitio);
    if (sitio !== "jornada" || !accion || typeof jornadaEncendida !== "function" || !jornadaEncendida()) return;
    const j = state.jornada || {}, run = j.run, enFoco = !!run && run.fase === "foco";
    if (accion === "iniciar" && !run && typeof jIniciar === "function") jIniciar();
    else if (accion === "pausar" && enFoco && run.seg && typeof jPausa === "function") jPausa();
    else if (accion === "seguir" && enFoco && !run.seg && typeof jPausa === "function") jPausa();
    else if (accion === "dormir" && !j.dormido && typeof jBuenasNoches === "function") jBuenasNoches();
    else if (accion === "despertar" && j.dormido && typeof jBuenosDias === "function") jBuenosDias();
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
