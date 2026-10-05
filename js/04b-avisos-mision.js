/* ================= Los recordatorios de una misión (0.7.213) =================
   «Recordarme», en la hoja de «¿Cada cuándo?»: una hora por cada vez que toca
   en el día. Dos caminos, y los dos los decide la página:

     - **En la app de Android** suena aunque la app esté cerrada: van en la
       agenda del complemento de avisos (`misionesAgenda`, que se suma a la del
       Pomodoro en `jSincronizarAvisos`), con su canal propio y dos botones,
       «Ya la hice» y «En 5 min». Lo que se toque ahí entra al abrir por
       `logMission`, con su día y su hora, como un toque dentro.
     - **En la web** solo puede avisar mientras Norata esté abierta: un aviso
       dentro si la estás mirando y uno del sistema si está de fondo y hay
       permiso. La hoja lo dice para no prometer lo que la web no hace.

   Las dos reglas que pidió la maqueta: nunca suena mientras duermes (se salta
   la hora que caiga dentro de tu bloque de dormir de la rueda) y, si ya la
   cumpliste, no suena (`desde`: la agenda de esa misión empieza mañana).

   Y lo que el teléfono cumple solo (`autoDeMisionHTML`) se pinta desde aquí,
   que carga antes que todo lo que dibuja una misión: el puente con Health
   Connect (js/13e-salud.js) llega al final, y una tarjeta no puede depender
   de que ya esté. */

const amPad = n => String(n).padStart(2, "0");
const amMin = s => { const [h, m] = String(s).split(":").map(Number); return (h || 0) * 60 + (m || 0); };

/* La hora a la que empieza un día en la zona del perfil, en milisegundos. */
function inicioDelDia(key) {
  const [y, mo, d] = key.split("-").map(Number);
  const t = Date.UTC(y, mo - 1, d, 12);
  const p = tzParts(new Date(t), { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
  const g = k => Number((p.find(x => x.type === k) || {}).value) || 0;
  const local = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour") % 24, g("minute"));
  return Date.UTC(y, mo - 1, d) - (local - t);
}

/* ¿Esa hora cae dentro del bloque de dormir de la rueda de ese día? Solo se
   LEE la rueda: `jDatos()` siembra y guarda al llamarla. */
function amDurmiendo(dia, min) {
  const r = state.jornada && Array.isArray(state.jornada.rutinas) ? state.jornada.rutinas[dia] : null;
  return (r || []).some(b => {
    if (!b || b.descanso !== "dormir") return false;
    const ini = Math.round(b.ini) % 1440, fin = Math.round(b.fin) % 1440;
    return ini <= fin ? (min >= ini && min < fin) : (min >= ini || min < fin);
  });
}

/* El día del mes que toca la próxima vez: el de este mes si todavía no pasó
   ni se cumplió; si no, el del mes siguiente. */
function proximaMensual(m, hoy) {
  const este = hoy.slice(0, 8) + amPad(diaMesDe(m, hoy));
  if (este >= hoy && !cumplidaEnElMes(m, hoy, hoy)) return este;
  let [y, mo] = hoy.split("-").map(Number);
  mo++; if (mo > 12) { mo = 1; y++; }
  const pre = `${y}-${amPad(mo)}-`;
  return pre + amPad(diaMesDe(m, pre + "01"));
}

function misionesAgenda() {
  const out = [], hoy = todayKey();
  const manana = inicioDelDia(addDaysKey(hoy, 1));
  (state.missions || []).forEach(m => {
    if (m.archived || !(m.avisos || []).length) return;
    const icono = { dibujo: ICONS[m.icon] || ICONS.star, color: pinta(m.color) };
    const texto = m.ancla ? T`Después de ${m.ancla}` : tx("Es hora de tu misión");
    const hecha = missionDone(m, hoy);
    m.avisos.forEach((h, i) => {
      const min = amMin(h), hora = typeof jH12 === "function" ? jH12(min) : h;
      const cumplir = jBoton("primario", tx("Ya la hice"), "ok", "cumplir");
      const base = {
        tipo: "mision", mision: m.id, ir: "missions", min, titulo: m.name, texto, icono, visible: true,
        vista: {
          corto: { r1: m.name, r2: [jParte(hora, "marca"), jParte(" · " + tx("Misión"))], boton: cumplir },
          largo: { ceja: [tx("Misión"), "marca"], tit: m.name, sub: texto, rot: tx("A las"), num: hora,
            botones: [cumplir, jBoton("neutro", tx("En 5 min"), "", "posponer")] }
        }
      };
      if (m.cadence === "monthly") {
        const k = proximaMensual(m, hoy);
        out.push(Object.assign({ id: `m${m.id}.${k}.${i}`, dia: weekdayOfKey(k), fecha: k }, base));
        return;
      }
      const dias = m.cadence === "weekly" ? (m.days || []) : [0, 1, 2, 3, 4, 5, 6];
      dias.forEach(d => {
        if (amDurmiendo(d, min)) return;
        out.push(Object.assign({ id: `m${m.id}.${d}.${i}`, dia: d, desde: hecha ? manana : 0 }, base));
      });
    });
  });
  return out;
}

/* ¿El complemento de este APK sabe de misiones? Uno de antes pintaría el
   recordatorio como la alarma del Pomodoro y lo repetiría cada semana, así
   que hasta saberlo no se le manda nada. */
let amCapaz = null;
function amNativoListo() {
  if (amCapaz !== null) return amCapaz;
  amCapaz = false;
  try {
    const cap = window.Capacitor;
    const p = cap && cap.Plugins && cap.Plugins.AvisosNorata;
    if (p && typeof p.capacidades === "function") {
      Promise.resolve(p.capacidades()).then(r => { amCapaz = !!(r && r.misiones); }).catch(() => { amCapaz = false; });
    }
  } catch (e) { /* un APK sin el método */ }
  return amCapaz;
}

/* «Ya la hice» desde el aviso, con la app cerrada: entra como un toque, con
   el día y la hora en que se tocó. Una vez que cuenta para cumplirla. */
function cumplirDesdeAviso(ev) {
  const m = state.missions.find(x => x.id === ev.mision);
  if (!m || m.archived) return;
  const t = new Date(Math.min(Number(ev.t) || Date.now(), Date.now()));
  const dia = todayKey(t);
  if (missionDone(m, dia)) return;
  const p = tzParts(t, { hour: "2-digit", minute: "2-digit", hour12: false });
  const g = k => amPad((Number((p.find(x => x.type === k) || {}).value) || 0) % 24);
  logMission(m.id, 1, { dia, hora: g("hour") + g("minute"), mudo: true });
}

/* ---- En la web: mientras Norata esté abierta ---- */
const amSonados = new Set();
function amRevisarWeb() {
  if (window.norataAvisos || !state || !Array.isArray(state.missions)) return;
  const hoy = todayKey(), ahora = hhmmNow(), hhmm = ahora.slice(0, 2) + ":" + ahora.slice(2);
  state.missions.forEach(m => {
    if (m.archived || !(m.avisos || []).includes(hhmm)) return;
    if (!missionDueToday(m) || missionDone(m, hoy)) return;
    if (amDurmiendo(weekdayOfKey(hoy), amMin(hhmm))) return;
    const clave = m.id + "|" + hoy + "|" + hhmm;
    if (amSonados.has(clave)) return;
    amSonados.add(clave);
    const titulo = m.name, texto = m.ancla ? T`Después de ${m.ancla}` : tx("Es hora de tu misión");
    if (!document.hidden) {
      const avisa = () => toast(`${titulo} · ${texto}`, "hecho", { label: tx("Ya la hice"), onclick: `logMission('${enJS(m.id)}', 1)`, ms: 12000 });
      if (typeof enTurno === "function") enTurno(avisa); else avisa();
      return;
    }
    if ("Notification" in window && Notification.permission === "granted") {
      const op = { body: texto, tag: "mision-" + m.id, icon: "icon-192.png", badge: "icon-192.png" };
      const sw = navigator.serviceWorker;
      if (sw && sw.ready) sw.ready.then(r => r.showNotification(titulo, op)).catch(() => { try { new Notification(titulo, op); } catch (e) { /* nada */ } });
      else { try { new Notification(titulo, op); } catch (e) { /* nada */ } }
    }
  });
}
setInterval(() => { try { amRevisarWeb(); } catch (e) { /* el siguiente minuto lo intenta */ } }, 20000);

/* ---- Lo que el teléfono cumple solo, en la tarjeta ---- */
function autoDeMisionHTML(m, ok) {
  const s = window.norataSalud;
  const l = s && !ok ? s.lectura(m.id) : null;
  let h = `<span class="ms-tel">${icon("movil", 11)}${tx("del teléfono")}</span>`;
  if (l && l.txt) {
    h += `<span>${escapeHtml(l.txt)}</span>`;
    if (l.pct != null) h += `<span class="ms-tel-barra" aria-hidden="true"><i style="width:${Math.max(3, Math.min(100, Math.round(l.pct)))}%"></i></span>`;
  }
  return h;
}
