/* ============================================================
   Lo que tu teléfono puede cumplir por ti (0.7.213, Alpha)
   ============================================================

   El puente entre las misiones y Health Connect, la app de Google donde
   Android guarda pasos, sueño y entrenamientos. Lo lee el complemento
   `@capgo/capacitor-health` (se instala con `nativo/salud/instalar-salud.js`).
   En la web, o en un APK que no lo traiga, se sale en la primera línea: no
   existe `norataSalud` y el formulario dice «Solo en la app de Android».

   Las reglas, de la lámina que aprobó Eduardo:

     - **Nada sale del teléfono.** Se lee aquí, se decide aquí, y a la cuenta
       solo llega lo de siempre: qué misión se cumplió y a qué hora. Por eso
       marca SOLO el teléfono que tiene el permiso; los demás dispositivos lo
       reciben por la sincronía como cualquier otra marca.
     - **Entra por `logMission`**, la misma puerta que un toque. Sin sonido
       (`mudo`): pasó en otra pantalla.
     - **Se lee al abrir, al volver a la app y cada quince minutos** con la
       app a la vista. No hay lectura de fondo: Health Connect no deja leer
       con la app cerrada sin otro permiso que esto no necesita.
     - **Si la desmarcas, ese día no vuelve a marcarse** (`autoNo`, lo pone
       `logMission` al deshacer).
     - Lo que va midiendo («3,420 de 8,000 pasos») vive en memoria y no se
       guarda: es del teléfono, no de la cuenta. */

(function () {
  const cap = window.Capacitor;
  if (!cap || typeof cap.isNativePlatform !== "function" || !cap.isNativePlatform()) return;
  if (typeof cap.isPluginAvailable !== "function" || !cap.isPluginAvailable("Health")) return;
  const H = cap.Plugins.Health;

  /* Qué permiso pide cada fuente. La distancia va con pasos y con ejercicio
     porque las dos tienen su regla en kilómetros. */
  const TIPOS = { pasos: ["steps", "distance"], sueno: ["sleep"], ejercicio: ["workouts", "distance"] };
  const TODOS = ["steps", "distance", "sleep", "workouts"];
  /* Los tipos de entrenamiento de Health Connect que cuentan para cada uno de
     los nuestros. «cualquiera» acepta todos. */
  const DEPORTES = {
    fuerza: ["strengthTraining", "traditionalStrengthTraining", "functionalStrengthTraining", "weightlifting", "calisthenics", "coreTraining", "crossTraining", "highIntensityIntervalTraining", "bootCamp"],
    correr: ["running", "runningTreadmill", "trackAndField"],
    nadar: ["swimming", "swimmingPool", "swimmingOpenWater", "waterFitness"],
    bici: ["cycling", "bikingStationary", "handCycling"],
    yoga: ["yoga", "pilates", "stretching", "flexibility", "mindAndBody", "taiChi", "barre"]
  };

  let disponible = null, motivo = "";
  let permisos = { pasos: false, sueno: false, ejercicio: false };
  let historial = null, pidiendoHist = false;
  const lecturas = {};

  const iso = ms => new Date(ms).toISOString();
  const repintar = () => {
    try {
      if (typeof MF !== "undefined" && MF && typeof mfPintar === "function") mfPintar(false);
      if (typeof ajusteAbierto !== "undefined" && ajusteAbierto === "telefono" && typeof renderPanelTelefono === "function") renderPanelTelefono();
    } catch (e) { /* la pantalla ya no está */ }
  };

  async function revisarDisponible() {
    try {
      const r = await H.isAvailable();
      disponible = !!(r && r.available);
      motivo = (r && r.reason) || "";
    } catch (e) { disponible = false; motivo = String(e && e.message || e); }
    return disponible;
  }

  async function revisarPermisos() {
    if (!(await revisarDisponible())) { permisos = { pasos: false, sueno: false, ejercicio: false }; repintar(); return permisos; }
    try {
      const r = await H.checkAuthorization({ read: TODOS });
      const ok = new Set((r && r.readAuthorized) || []);
      permisos = { pasos: ok.has("steps"), sueno: ok.has("sleep"), ejercicio: ok.has("workouts") };
    } catch (e) { /* se queda lo que se sabía */ }
    if (!historial && (permisos.pasos || permisos.sueno || permisos.ejercicio)) leerHistorial();
    repintar();
    return permisos;
  }

  async function pedir(f) {
    if (!(await revisarDisponible())) { repintar(); return false; }
    try { await H.requestAuthorization({ read: TIPOS[f] || [] }); } catch (e) { /* lo dice la revisión */ }
    historial = null;
    await revisarPermisos();
    revisar();
    return !!permisos[f];
  }

  /* ---- Lo que se lee ---- */
  async function pasosEntre(a, b) {
    const r = await H.queryAggregated({ dataType: "steps", startDate: iso(a), endDate: iso(b), bucket: "day", aggregation: "sum" });
    return ((r && r.samples) || []).reduce((t, x) => t + (Number(x.value) || 0), 0);
  }
  async function metrosEntre(a, b) {
    const r = await H.queryAggregated({ dataType: "distance", startDate: iso(a), endDate: iso(b), bucket: "day", aggregation: "sum" });
    return ((r && r.samples) || []).reduce((t, x) => t + (Number(x.value) || 0), 0);
  }
  /* Los minutos DORMIDO de una sesión: sin lo despierto ni lo «en cama» si el
     reloj da fases; si no las da, la sesión entera. */
  function dormidos(s) {
    if (Array.isArray(s.stages) && s.stages.length) {
      return s.stages.filter(x => x.stage !== "awake" && x.stage !== "inBed").reduce((t, x) => t + (Number(x.durationMinutes) || 0), 0);
    }
    return Number(s.value) || (Date.parse(s.endDate) - Date.parse(s.startDate)) / 60000;
  }
  async function sesionesDeSueno(a, b) {
    const r = await H.readSamples({ dataType: "sleep", startDate: iso(a), endDate: iso(b), limit: 60 });
    return ((r && r.samples) || []).filter(s => s.startDate && s.endDate);
  }
  async function entrenamientos(a, b) {
    const r = await H.queryWorkouts({ startDate: iso(a), endDate: iso(b), limit: 60 });
    return (r && r.workouts) || [];
  }
  const delTipo = (w, tipo) => !tipo || tipo === "cualquiera" || (DEPORTES[tipo] || []).includes(w.workoutType);
  /* Los minutos del día en la zona del perfil, de una fecha ISO. */
  function minutoDelDia(isoTxt) {
    const p = tzParts(new Date(isoTxt), { hour: "2-digit", minute: "2-digit", hour12: false });
    const g = k => Number((p.find(x => x.type === k) || {}).value) || 0;
    return (g("hour") % 24) * 60 + g("minute");
  }
  const nocturno = m => m < 12 * 60 ? m + 1440 : m;
  const num = n => { try { return Math.round(n).toLocaleString(localeActual()); } catch (e) { return String(Math.round(n)); } };
  const dur = min => { const h = Math.floor(min / 60), m = Math.round(min % 60); return m ? T`${h} h ${m} min` : T`${h} h`; };

  /* Lo que llevas hoy de una misión y si ya llegó. */
  async function medir(m, ini, ahora, cache) {
    const a = m.auto, c = Number(a.cifra) || 0;
    if (a.fuente === "pasos") {
      if (a.regla === "km") {
        const km = (cache.metros != null ? cache.metros : (cache.metros = await metrosEntre(ini, ahora))) / 1000;
        return { listo: km >= c, txt: T`${km.toFixed(1)} de ${c} km`, pct: c ? km / c * 100 : 0 };
      }
      const p = cache.pasos != null ? cache.pasos : (cache.pasos = await pasosEntre(ini, ahora));
      return { listo: p >= c, txt: T`${num(p)} de ${num(c)} pasos`, pct: c ? p / c * 100 : 0 };
    }
    if (a.fuente === "sueno") {
      /* Cuenta para el día que EMPIEZA: lo de anoche, que acabó hoy. */
      const ss = cache.sueno || (cache.sueno = (await sesionesDeSueno(ini - 18 * 3600000, ahora)).filter(s => Date.parse(s.endDate) >= ini));
      if (!ss.length) return { listo: false, txt: tx("sin sueño registrado anoche"), pct: null };
      if (a.regla === "antes") {
        const larga = ss.slice().sort((x, y) => dormidos(y) - dormidos(x))[0];
        const m0 = minutoDelDia(larga.startDate);
        return { listo: nocturno(m0) <= nocturno(c), txt: T`te acostaste a las ${jH12(m0)}`, pct: null };
      }
      const tot = ss.reduce((t, s) => t + dormidos(s), 0);
      return { listo: tot >= c * 60, txt: T`${dur(tot)} de ${dur(c * 60)}`, pct: c ? tot / (c * 60) * 100 : 0 };
    }
    const ws = (cache.ws || (cache.ws = await entrenamientos(ini, ahora))).filter(w => delTipo(w, a.tipo));
    if (a.regla === "km") {
      const km = ws.reduce((t, w) => t + (Number(w.totalDistance) || 0), 0) / 1000;
      return { listo: km >= c, txt: T`${km.toFixed(1)} de ${c} km`, pct: c ? km / c * 100 : 0 };
    }
    const mejor = ws.reduce((t, w) => Math.max(t, (Number(w.duration) || 0) / 60), 0);
    return mejor
      ? { listo: mejor >= c, txt: T`sesión de ${Math.round(mejor)} de ${c} min`, pct: c ? mejor / c * 100 : 0 }
      : { listo: false, txt: T`esperando una sesión de ${c} min`, pct: null };
  }

  /* La vuelta: mira cada misión de hoy que se cumple sola y la marca si llegó. */
  let corriendo = false;
  async function revisar() {
    if (corriendo || typeof state === "undefined" || !state || !Array.isArray(state.missions)) return;
    const hoy = todayKey();
    const lista = state.missions.filter(m => m.auto && !m.archived && permisos[m.auto.fuente] && missionDueToday(m));
    if (!lista.length) return;
    corriendo = true;
    const ini = inicioDelDia(hoy), ahora = Date.now(), cache = {};
    let cambio = false;
    try {
      for (const m of lista) {
        let l;
        try { l = await medir(m, ini, ahora, cache); } catch (e) { continue; }
        const antes = JSON.stringify(lecturas[m.id] || null);
        lecturas[m.id] = { txt: l.txt, pct: l.pct };
        if (JSON.stringify(lecturas[m.id]) !== antes) cambio = true;
        if (l.listo && !missionDone(m, hoy) && m.autoNo !== hoy) {
          m.autoDia = hoy;
          logMission(m.id, missionTarget(m) - missionCount(m, hoy), { mudo: true });
          cambio = false;   // `logMission` ya repintó
        }
      }
    } finally { corriendo = false; }
    if (cambio && typeof repintarTrasMision === "function") repintarTrasMision();
  }

  /* ---- Lo tuyo de las dos últimas semanas ----
     Para que la cifra que propone el formulario sea la tuya y no una de
     partida: tus pasos de promedio, lo que duermes y lo que suelen durar tus
     entrenamientos. Una vez por apertura. */
  async function leerHistorial() {
    if (pidiendoHist) return;
    pidiendoHist = true;
    const fin = inicioDelDia(todayKey()), ini = fin - 14 * 86400000, h = {};
    try {
      if (permisos.pasos) {
        const r = await H.queryAggregated({ dataType: "steps", startDate: iso(ini), endDate: iso(fin), bucket: "day", aggregation: "sum" });
        const dias = ((r && r.samples) || []).map(x => Number(x.value) || 0).filter(v => v > 300);
        if (dias.length >= 3) h.pasos = dias.reduce((t, v) => t + v, 0) / dias.length;
      }
      if (permisos.sueno) {
        const ss = await sesionesDeSueno(ini, fin);
        const noches = ss.map(dormidos).filter(v => v >= 180);
        if (noches.length >= 3) h.sueno = noches.reduce((t, v) => t + v, 0) / noches.length / 60;
      }
      if (permisos.ejercicio) {
        const ws = await entrenamientos(ini - 16 * 86400000, fin);
        const mediana = (l) => { if (l.length < 2) return null; const o = l.slice().sort((a, b) => a - b); return Math.round(o[Math.floor(o.length / 2)] / 5) * 5; };
        const mins = (t) => ws.filter(w => delTipo(w, t)).map(w => (Number(w.duration) || 0) / 60).filter(v => v >= 5);
        h.fuerza = mediana(mins("fuerza"));
        h.correr = mediana(mins("correr"));
        h.ejercicio = mediana(mins("cualquiera"));
      }
    } catch (e) { /* sin historial: cifras de partida */ }
    historial = h;
    pidiendoHist = false;
    repintar();
  }

  window.norataSalud = {
    disponible: () => disponible,
    motivo: () => motivo,
    permiso: (f) => !!permisos[f],
    permisos: () => Object.assign({}, permisos),
    historial: () => historial,
    lectura: (id) => lecturas[id] || null,
    revisarPermisos,
    pedir,
    revisar,
    abrirAjustes: () => Promise.resolve(H.openHealthConnectSettings()).catch(() => null)
  };

  /* Al abrir, al volver y cada quince minutos con la app a la vista. */
  const vuelta = () => revisarPermisos().then(revisar).catch(() => null);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) vuelta(); });
  setInterval(() => { if (!document.hidden) revisar(); }, 15 * 60 * 1000);
  setTimeout(vuelta, 2500);
})();

/* Recién guardada una misión que se cumple sola: que mida ya, sin esperar
   al siguiente cuarto de hora. */
function revisarSaludYa() {
  if (window.norataSalud) setTimeout(() => window.norataSalud.revisar(), 300);
}

/* ---- Ajustes → Tu teléfono ----
   Qué deja leer el teléfono, y por dónde se quita. Solo existe en el APK con
   el complemento: en la web no hay nada que ajustar. */
function renderPanelTelefono() {
  const el = document.getElementById("panel-telefono");
  const s = window.norataSalud;
  if (!el || !s) return;
  const fuentes = [
    { k: "pasos", n: tx("Pasos y distancia"), ic: "pasos" },
    { k: "ejercicio", n: tx("Ejercicio"), ic: "dumbbell" },
    { k: "sueno", n: tx("Sueño"), ic: "luna" }
  ];
  const cuantas = (state.missions || []).filter(m => m.auto && !m.archived).length;
  const falta = s.disponible() === false;
  el.innerHTML = `
    <h3>Health Connect<span class="msf-alpha">Alpha</span></h3>
    <p class="settings-note">${tx("Con permiso, tu teléfono marca solo las misiones que se cumplen automáticamente. Tus datos de salud permanecen en tu teléfono: a tu cuenta solo llega qué misión se cumplió y a qué hora.")}</p>
    ${falta ? `<p class="settings-note">${tx("Para esto hace falta Health Connect, la app de Google donde tu teléfono guarda tu salud. Ábrela o instálala y vuelve aquí.")}</p>`
      : `<div class="msf-lista">${fuentes.map(f => s.permiso(f.k)
        ? `<div class="msf-opc"><span class="msf-icq2">${icon(f.ic, 17)}</span><span class="msf-opc-tx">${escapeHtml(f.n)}<small>${tx("Compartiendo con Norata")}</small></span><span class="msf-ok">${icon("check", 16)}</span></div>`
        : `<div class="msf-opc apagada"><span class="msf-icq2">${icon(f.ic, 17)}</span><span class="msf-opc-tx">${escapeHtml(f.n)}<small>${tx("Sin permiso todavía")}</small></span><button type="button" class="msf-agregar" onclick="telefonoActivar('${f.k}')">${tx("Activar")}</button></div>`).join("")}</div>`}
    <p class="settings-note" style="margin-top:12px">${cuantas
      ? (cuantas === 1 ? tx("1 misión se cumple automáticamente.") : T`${cuantas} misiones se cumplen automáticamente.`)
      : tx("Todavía ninguna misión se cumple automáticamente. Se enciende al crearla, si su nombre habla de pasos, sueño o ejercicio.")}</p>
    <button class="btn btn-linea btn-block" style="margin-top:12px" onclick="window.norataSalud && window.norataSalud.abrirAjustes()">${tx("Abrir Health Connect")}</button>`;
}
function telefonoActivar(f) {
  const s = window.norataSalud;
  if (!s) return;
  s.pedir(f).then(ok => {
    toast(ok ? tx("Listo: ya comparte con Norata") : tx("Sin permiso, por ahora. Puedes activarlo cuando quieras."), ok ? "logro" : "atencion");
    renderPanelTelefono();
  });
}
