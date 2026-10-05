/* ================= Formulario de misión (0.7.213) =================
   Escribes el nombre y lo demás llega predicho. Es la maqueta «Nueva misión,
   lado a lado» que aprobó Eduardo pieza por pieza, y estas son las reglas que
   salieron de ahí:

     - A la vista solo hay UNA cosa por decidir: el nombre. Debajo, cuatro
       pastillas con lo predicho (icono y color, cada cuándo, la habilidad y
       el XP), y cada una abre su hoja. Antes eran diez campos a la vista.
     - Lo predicho NUNCA pisa lo que ya tocaste: cada parte tocada se queda
       (`tocado`), y la predicción sigue moviendo solo las demás.
     - «Se cumple automáticamente» solo sale si el nombre habla de algo que el
       teléfono mide, y sus opciones solo se despliegan al encenderlo. Lleva la
       etiqueta Alpha.
     - El ancla y el detalle van en «Más opciones», una cápsula con su flecha.

   Las hojas viven en `#hoja-crear` —la misma de los otros formularios, con
   su piso y su sitio en `CAPAS_QUE_TAPAN`— con la clase `msf` puesta mientras
   son nuestras. Todo el color sale de variables: así lo viste cada mundo. */

let editingMissionId = null;
let MF = null;

const MF_TODOS = [0, 1, 2, 3, 4, 5, 6];
const MF_ORDEN = [1, 2, 3, 4, 5, 6, 0];

/* Las ideas de debajo del nombre CAMBIAN (Eduardo preguntó si eran siempre
   las mismas): se prefieren las que dan trabajo a una habilidad que ya tienes
   y que ninguna misión alimenta, se quitan las que ya tienes como misión, y
   el empate se rota por día para que no salgan siempre las cuatro primeras. */
const MF_IDEAS = [
  { t: "Caminar 8,000 pasos", hab: "Ejercicio" },
  { t: "Ir al gym", hab: "Ejercicio" },
  { t: "Dormir antes de las 11", hab: "Cuidado personal" },
  { t: "Beber 8 vasos de agua", hab: "Cuidado personal" },
  { t: "Leer 20 páginas", hab: "Lectura" },
  { t: "Meditar 10 minutos", hab: "Meditación" },
  { t: "Llamar a mi mamá" },
  { t: "Salir a correr", hab: "Correr" },
  { t: "Practicar 15 min de inglés", hab: "Idiomas" },
  { t: "Escribir una página", hab: "Escritura" },
  { t: "Cocinar en casa", hab: "Cocina" },
  { t: "Ordenar mi escritorio", hab: "Organización" },
  { t: "Apartar algo para el ahorro", hab: "Finanzas" },
  { t: "Estirarme 5 minutos", hab: "Cuidado personal" },
  { t: "Tocar la guitarra", hab: "Guitarra" },
  { t: "Dibujar algo", hab: "Dibujo" }
];

/* Lo que el teléfono puede medir hoy, y lo que viene. */
const MF_FUENTES = [
  { k: "pasos", n: "Pasos y distancia", d: "Caminar, recorrer km", ic: "pasos" },
  { k: "ejercicio", n: "Ejercicio", d: "Gym, correr, nadar, bici, yoga", ic: "dumbbell" },
  { k: "sueno", n: "Sueño", d: "Horas dormidas, hora de acostarte", ic: "luna" }
];
const MF_PRONTO = [
  { n: "Agua", d: "Vasos registrados en otra app", ic: "gota" },
  { n: "Meditación", d: "Sesiones de Calm, Headspace o el reloj", ic: "heart" },
  { n: "Peso", d: "Para un nodo meta en Ramas", ic: "target" }
];
const MF_TIPOS = [
  ["cualquiera", "cualquier tipo"], ["fuerza", "fuerza"], ["correr", "correr"],
  ["nadar", "nadar"], ["bici", "bici"], ["yoga", "yoga"]
];

const mfNorm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const mfSalud = () => window.norataSalud || null;
const mfMin = s => { const [h, m] = String(s).split(":").map(Number); return (h || 0) * 60 + (m || 0); };
const mfHHMM = n => `${String(Math.floor(n / 60) % 24).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
function horaCorta(hhmm) { return typeof jH12 === "function" ? jH12(mfMin(hhmm)) : hhmm; }
function mfNum(n) { try { return Number(n).toLocaleString(localeActual()); } catch (e) { return String(n); } }

/* ---------- Abrir ---------- */
/* `presetTablero` llega desde el ＋ de una columna: la misión nueva nace ya
   colocada ahí. En "Pendientes de hoy" no se guarda nada, que es su sitio
   natural; en cualquier otra, se apunta la columna. */
function openMissionForm(id, presetTablero) {
  editingMissionId = id || null;
  const m = id ? state.missions.find(x => x.id === id) : null;
  MF = mfNuevo(m, presetTablero);
  if (typeof sugActual === "object") sugActual.ms = null;

  document.getElementById("mission-form-title").textContent = m ? tx("Editar misión") : tx("Nueva misión");
  document.getElementById("ms-name").value = MF.name;
  document.getElementById("ms-desc").value = MF.desc;
  document.getElementById("ms-ancla").value = MF.ancla;
  document.getElementById("ms-delete").style.display = m ? "block" : "none";
  document.getElementById("ms-guardar").textContent = m ? tx("Guardar misión") : tx("Crear misión");
  pintarAnclas();
  if (m) mfAplicarPred(); else MF.pred = null;
  mfPintar(true);
  showView("mission-form");
  if (window.norataSalud) window.norataSalud.revisarPermisos();
}

function mfNuevo(m, presetTablero) {
  const hoy = Number(todayKey().slice(8, 10));
  const modo = !m ? "semana" : m.cadence === "monthly" ? "mes" : m.cadence === "once" ? "una" : "semana";
  const dias = m && m.cadence === "weekly" && (m.days || []).length ? m.days.slice() : MF_TODOS.slice();
  const a = (m && m.auto) || {};
  return {
    tablero: (!m && presetTablero && presetTablero !== "hoy") ? presetTablero : null,
    name: m ? m.name : "", ancla: m ? (m.ancla || "") : "", desc: m ? (m.desc || "") : "",
    icon: m ? m.icon : iconoDeEstreno(state.missions.length, 7, 2),
    color: m ? m.color : COLORS[state.missions.length % COLORS.length],
    modo, dias, atajo: mfAtajoDe(dias), diaMes: m && m.diaMes ? m.diaMes : Math.min(hoy, 28),
    veces: m ? missionTarget(m) : 1,
    avisar: !!(m && (m.avisos || []).length), horas: m && (m.avisos || []).length ? m.avisos.slice() : ["09:00"],
    skill: m ? (m.skillId || "") : "", xp: m ? (m.xp || 0) : 15,
    auto: !!(m && m.auto), fuente: a.fuente || null, regla: a.regla || "cantidad",
    cifra: a.cifra != null ? a.cifra : null, tipo: a.tipo || null,
    mas: !!(m && (m.ancla || m.desc)),
    /* Al editar, lo guardado manda: nada de lo que ya tiene se vuelve a
       predecir. Solo «con qué se cumple», si nunca lo tuvo: así una misión
       vieja de caminar también ofrece cumplirse sola. */
    tocado: m ? { skill: true, dias: true, icono: true, cifra: !!m.auto, fuente: !!m.auto } : {},
    pred: null, hoja: null, paso: null, xpEscribe: false, activando: null
  };
}

/* ---------- Predecir desde el nombre ---------- */
function mfPredecir(nombre) {
  const t = mfNorm(nombre);
  const r = { fuente: null, tipo: null, cifra: null, regla: "cantidad", desdeNombre: false,
    icon: null, color: null, dias: MF_TODOS.slice(), veces: null };
  const num = t.match(/(\d[\d,.]*)\s*(mil\s*)?(pasos|steps|km|kilometros|min|minutos|mins|minutes|h|hrs|horas|hours|vasos|glasses)?/);
  let n = num ? parseFloat(num[1].replace(/,/g, "")) : null;
  if (n !== null && num[2]) n *= 1000;
  const u = num && num[3] ? num[3] : "";
  const h = mfHistorial();
  /* Las palabras en inglés van al lado: la app también se usa en inglés. */
  if (/(camin|pasos|andar|paseo|walk|steps)/.test(t)) {
    Object.assign(r, { fuente: "pasos", icon: "pasos", color: COLORS[4] });
    if (n && (u === "pasos" || u === "steps" || !u) && n >= 500) { r.cifra = n; r.desdeNombre = true; }
    else if (n && u === "km") { r.regla = "km"; r.cifra = n; r.desdeNombre = true; }
    else r.cifra = h.pasos ? Math.max(1000, Math.round(h.pasos * 1.1 / 500) * 500) : 8000;
  } else if (/(dorm|acostar|desvel|sueno|sleep|\bbed\b)/.test(t)) {
    Object.assign(r, { fuente: "sueno", icon: "luna", color: COLORS[3] });
    const antes = t.match(/(?:antes de (?:las |la )?|before )(\d{1,2})(:(\d{2}))?/);
    if (antes) {
      let hh = +antes[1];
      /* «Antes de las 11» es de noche: nadie se propone acostarse antes de las
         once de la mañana. De la 1 a las 4 es la madrugada. */
      if (hh >= 5 && hh < 12) hh += 12;
      r.regla = "antes"; r.cifra = (hh % 24) * 60 + (+(antes[3] || 0)); r.desdeNombre = true;
    } else if (n && /^(h|hrs|horas|hours)$/.test(u)) { r.cifra = n; r.desdeNombre = true; }
    else r.cifra = h.sueno ? Math.round(h.sueno * 2) / 2 : 7;
  } else if (/(gym|gimnasio|pesas|fuerza|entren|ejercicio|cardio|correr|trotar|nadar|natacion|alberca|bici|pedalear|yoga|moverme|workout|\btrain|\brun|jog|swim|bike|cycl)/.test(t)) {
    r.fuente = "ejercicio";
    if (/(correr|trotar|\brun|jog)/.test(t)) Object.assign(r, { tipo: "correr", icon: "pasos", color: COLORS[1] });
    else if (/(nadar|natacion|alberca|swim)/.test(t)) Object.assign(r, { tipo: "nadar", icon: "ola", color: COLORS[4] });
    else if (/(bici|pedalear|bike|cycl)/.test(t)) Object.assign(r, { tipo: "bici", icon: "bici", color: COLORS[5] });
    else if (/yoga/.test(t)) Object.assign(r, { tipo: "yoga", icon: "heart", color: COLORS[3] });
    else if (/(gym|gimnasio|pesas|fuerza|weights|strength)/.test(t)) Object.assign(r, { tipo: "fuerza", icon: "dumbbell", color: COLORS[2], dias: [1, 3, 5] });
    else Object.assign(r, { tipo: "cualquiera", icon: "dumbbell", color: COLORS[2] });
    if (n && /^(min|minutos|mins|minutes)$/.test(u)) { r.cifra = n; r.desdeNombre = true; }
    else if (n && /^(h|hrs|horas|hours)$/.test(u)) { r.cifra = n * 60; r.desdeNombre = true; }
    else if (n && /^(km|kilometros)$/.test(u)) { r.regla = "km"; r.cifra = n; r.desdeNombre = true; }
    else r.cifra = (r.tipo === "fuerza" ? h.fuerza : r.tipo === "correr" ? h.correr : h.ejercicio) || (r.tipo === "fuerza" ? 45 : 30);
  } else if (/(medit|respir|breath)/.test(t)) Object.assign(r, { icon: "heart", color: COLORS[3] });
  else if (/(leer|lectura|libro|paginas|\bread\b|book|pages)/.test(t)) Object.assign(r, { icon: "book", color: COLORS[5] });
  else if (/(agua|beber|vasos|hidrat|water|drink|glasses)/.test(t)) {
    Object.assign(r, { icon: "gota", color: COLORS[4] });
    if (n && n > 1 && n <= 20 && (u === "vasos" || u === "glasses" || !u)) r.veces = n;
  } else if (/(llamar|mama|papa|amig|abuel|\bcall\b|\bmom\b|\bdad\b|friend)/.test(t)) Object.assign(r, { icon: "tel", color: COLORS[6] });
  else if (/(cafe|desayun|coffee|breakfast)/.test(t)) Object.assign(r, { icon: "coffee", color: COLORS[1] });

  /* La habilidad sale del diccionario de siempre (`sugerirHabilidades`), que
     además aprende de cómo nombras TÚ las cosas. Si ninguna de las tuyas
     encaja, se propone una del catálogo en su hoja. */
  const sug = typeof sugerirHabilidades === "function" ? sugerirHabilidades(nombre) : [];
  r.skill = sug.length ? sug[0].s.id : "";
  r.catalogo = sug.length ? null : (mfCatalogo(nombre)[0] || null);
  return r;
}

/* Lo que el teléfono sabe de ti, para que la cifra propuesta sea la tuya.
   Sin permiso no hay historial y se proponen las cifras de partida. */
function mfHistorial() {
  const s = mfSalud();
  return (s && s.historial()) || {};
}

function mfAplicarPred() {
  const p = mfPredecir(MF.name);
  MF.pred = p;
  if (!MF.tocado.fuente) {
    /* Una cifra ajustada a mano solo vale para su regla: 8,000 pasos no son
       una hora de acostarse. Si el nombre cambia de fuente, se vuelve a
       proponer. */
    if (MF.fuente !== p.fuente || MF.regla !== p.regla || MF.tipo !== p.tipo) MF.tocado.cifra = false;
    MF.fuente = p.fuente; MF.tipo = p.tipo; MF.regla = p.regla;
    if (!MF.tocado.cifra) MF.cifra = p.cifra;
    if (!MF.fuente) MF.auto = false;
  }
  if (!MF.tocado.skill) {
    MF.skill = p.skill;
    if (typeof sugActual === "object" && !sugActual.ms && p.skill) {
      const s = state.skills.find(x => x.id === p.skill);
      if (s) sugActual.ms = s.name;
    }
  }
  if (!MF.tocado.dias) {
    MF.dias = p.dias.slice(); MF.modo = "semana"; MF.atajo = mfAtajoDe(MF.dias);
    if (p.veces) { MF.veces = p.veces; if (MF.avisar) MF.horas = mfRepartir(MF.veces); }
  }
  if (!MF.tocado.icono && p.icon) { MF.icon = p.icon; MF.color = p.color; }
}

/* ---------- Pintar ---------- */
function mfNombre(v) {
  if (!MF) return;
  const antes = MF.name.trim().length >= 3;
  MF.name = v;
  mfAplicarPred();
  mfPintar(!antes && MF.name.trim().length >= 3);
}

function mfPintar(estreno) {
  if (!MF) return;
  const largo = MF.name.trim().length >= 3 || !!editingMissionId;
  const ideas = document.getElementById("ms-ideas");
  ideas.hidden = !!MF.name || !!editingMissionId;
  if (!ideas.hidden && !ideas.childElementCount) ideas.innerHTML = mfIdeasHTML();
  document.getElementById("ms-pills").innerHTML = largo ? mfPillsHTML(estreno) : "";
  document.getElementById("ms-auto").innerHTML = largo && MF.fuente ? mfAutoHTML() : "";
  const mas = document.getElementById("ms-mas");
  mas.hidden = !largo;
  mas.classList.toggle("abierta", MF.mas);
  mas.setAttribute("aria-expanded", MF.mas ? "true" : "false");
  document.getElementById("ms-mas-caja").hidden = !(largo && MF.mas);
  document.getElementById("ms-guardar").disabled = !MF.name.trim();
  if (MF.hoja) mfPintarHoja();
}

function mfIdeasHTML() {
  const tengo = new Set(state.missions.filter(m => !m.archived).map(m => mfNorm(m.name)));
  const conMision = new Set(state.missions.filter(m => !m.archived && m.skillId).map(m => m.skillId));
  const dia = Number(todayKey().replace(/-/g, "")) || 0;
  const lista = MF_IDEAS.map((x, i) => {
    const nombre = tx(x.t);
    const clave = normalizarTexto(nombre)[0] || "";
    if ([...tengo].some(n => clave && n.indexOf(clave.slice(0, 5)) >= 0)) return null;
    const s = x.hab ? state.skills.find(k => k.name === x.hab || k.name === tx(x.hab)) : null;
    const p = s ? (conMision.has(s.id) ? 1 : 3) : 0;
    return { nombre, p, r: (i * 7 + dia) % MF_IDEAS.length };
  }).filter(Boolean);
  lista.sort((a, b) => b.p - a.p || a.r - b.r);
  return lista.slice(0, 4).map(x =>
    `<button type="button" onclick="mfIdea('${enJS(x.nombre)}')">${escapeHtml(x.nombre)}</button>`).join("");
}
function mfIdea(t) {
  const campo = document.getElementById("ms-name");
  campo.value = t;
  mfNombre(t);
  campo.focus();
}

function mfAtajoDe(dias) {
  const o = MF_TODOS.filter(d => dias.includes(d)).join();
  return o === "0,1,2,3,4,5,6" ? "todos" : o === "1,2,3,4,5" ? "semana" : o === "0,6" ? "finde" : null;
}
function mfDiaMesTxt(d) { return d === "ult" ? tx("el último día") : T`el día ${d}`; }
function mfDiasTxt() {
  if (MF.modo === "una") return tx("Una sola vez");
  if (MF.modo === "mes") return T`Cada mes, ${mfDiaMesTxt(MF.diaMes)}`;
  if (MF.dias.length === 7) return tx("Todos los días");
  const orden = MF_ORDEN.filter(d => MF.dias.includes(d));
  if (orden.join() === "1,2,3,4,5") return tx("Entre semana");
  if (orden.join() === "6,0") return tx("Fines de semana");
  const L = letrasDeSemana();
  return orden.map(d => L[d]).join(" · ");
}

/* Las horas se reparten solas entre que despiertas y te duermes —la rueda del
   Pomodoro, si la tienes; si no, de 9 de la mañana a 8 de la noche—, sin
   tocar la noche. */
function mfRepartir(n) {
  let ini = 9 * 60, fin = 20 * 60;
  const dormir = mfBloqueDormir(weekdayOfKey(todayKey()));
  if (dormir) {
    const a = (dormir.fin + 60) % 1440, b = (dormir.ini - 90 + 1440) % 1440;
    if (b - a >= 120) { ini = a; fin = b; }
  }
  if (n <= 1) return [mfHHMM(Math.max(ini, Math.min(fin, 9 * 60)))];
  const paso = (fin - ini) / (n - 1);
  return Array.from({ length: n }, (_, i) => mfHHMM(Math.round((ini + i * paso) / 15) * 15));
}
/* Solo se LEE la rueda: `jDatos()` siembra y guarda al llamarla. */
function mfBloqueDormir(dia) {
  const r = state.jornada && Array.isArray(state.jornada.rutinas) ? state.jornada.rutinas[dia] : null;
  return (r || []).find(b => b && b.descanso === "dormir") || null;
}

function mfPillsHTML(estreno) {
  const sk = MF.skill ? state.skills.find(s => s.id === MF.skill) : null;
  const chev = `<span class="msf-chev" aria-hidden="true">${icon("bajar", 14)}</span>`;
  const veces = MF.veces > 1 && MF.modo !== "una" ? ` · ${T`${MF.veces} veces`}` : "";
  const aviso = MF.avisar ? ` · ${icon("campana", 12)} ${horaCorta(MF.horas[0])}${MF.horas.length > 1 ? "…" : ""}` : "";
  const pills = [
    ["icono", `<span class="msf-icq" style="background:${velo(MF.color, "26")};color:${trazo(MF.color)}">${icon(MF.icon, 13)}</span>${tx("Icono y color")}`, false],
    ["dias", `<b>${escapeHtml(mfDiasTxt())}</b>${veces}${aviso}`, false],
    ["skill", sk ? T`Sube <b>${escapeHtml(sk.name)}</b>` : tx("Sin habilidad"), !sk],
    ["xp", `<b>${MF.xp}</b> XP`, false]
  ];
  return pills.map(([k, h, vacia]) =>
    `<button type="button" class="msf-pill${vacia ? " vacia" : ""}${estreno ? " llega" : ""}" onclick="mfAbrirHoja('${k}')">${h}${chev}</button>`).join("");
}

function mfTextoFuente() {
  return MF.fuente === "pasos" ? tx("Tu teléfono registra tus pasos")
    : MF.fuente === "sueno" ? tx("Tu teléfono registra tu sueño")
    : tx("Tu teléfono registra tus entrenamientos");
}
function mfCifraTxt() {
  if (MF.fuente === "pasos") return MF.regla === "km" ? `${mfNum(MF.cifra)} km` : mfNum(MF.cifra);
  if (MF.fuente === "sueno") return MF.regla === "antes" ? horaCorta(mfHHMM(MF.cifra)) : `${mfNum(MF.cifra)} h`;
  return MF.regla === "km" ? `${mfNum(MF.cifra)} km` : `${MF.cifra} min`;
}
function mfReglaHTML() {
  const paso = `<span class="msf-paso"><button type="button" onclick="mfPaso(-1)" aria-label="${escapeAttr(tx("Menos"))}">−</button><output>${mfCifraTxt()}</output><button type="button" onclick="mfPaso(1)" aria-label="${escapeAttr(tx("Más"))}">+</button></span>`;
  if (MF.fuente === "pasos") return MF.regla === "km" ? T`Al recorrer ${paso}` : T`Al llegar a ${paso} pasos`;
  if (MF.fuente === "sueno") return MF.regla === "antes" ? T`Acostarme antes de las ${paso}` : T`Al dormir ${paso} o más`;
  const sel = `<select class="msf-sel" onchange="mfTipo(this.value)" aria-label="${escapeAttr(tx("Tipo de ejercicio"))}">${
    MF_TIPOS.map(([k, n]) => `<option value="${k}" ${MF.tipo === k ? "selected" : ""}>${escapeHtml(tx(n))}</option>`).join("")}</select>`;
  return MF.regla === "km" ? T`Al ${sel} ${paso}` : T`Con una sesión de ${sel} de ${paso}`;
}
function mfNotaRegla() {
  const p = MF.pred || {}, h = mfHistorial();
  if (MF.tocado.cifra) return tx("Ajustado por ti.");
  if (p.desdeNombre && MF.fuente === p.fuente) return tx("Salió del nombre.");
  if (MF.fuente === "pasos") return h.pasos ? T`Tu promedio de 2 semanas: ${mfNum(Math.round(h.pasos))} pasos. Propongo un poco más.` : tx("Sin historial todavía: 8,000 de partida.");
  if (MF.fuente === "sueno") return (h.sueno ? T`Tu promedio: ${mfDuracion(h.sueno * 60)}.` + " " : "") + tx("Cuenta para el día que empieza.");
  if (MF.tipo === "fuerza" && h.fuerza) return tx("Es lo que suelen durar tus sesiones de fuerza.");
  if (MF.tipo === "correr" && h.correr) return tx("Es lo que suelen durar tus carreras.");
  if (h.ejercicio && MF.tipo === "cualquiera") return tx("Es lo que suelen durar tus entrenamientos.");
  return T`Sin historial de este tipo: ${MF.cifra} min de partida.`;
}
function mfDuracion(min) {
  const h = Math.floor(min / 60), m = Math.round(min % 60);
  return m ? T`${h} h ${m} min` : T`${h} h`;
}

function mfAutoHTML() {
  const s = mfSalud();
  const permiso = s ? s.permiso(MF.fuente) : false;
  const sw = `<span class="msf-sw${MF.auto ? " on" : ""}" aria-hidden="true"><i data-perilla></i></span>`;
  const fila = `<button type="button" class="msf-sw-fila${MF.auto ? " on" : ""}" role="switch" aria-checked="${MF.auto}" onclick="mfAuto()" ${s ? "" : "disabled"}>
      <span class="msf-sw-tx"><b>${tx("Se cumple automáticamente")}<span class="msf-alpha">Alpha</span></b><small>${s ? mfTextoFuente() : tx("Solo en la app de Android")}</small></span>
      ${sw}</button>`;
  if (!MF.auto) return `<div class="msf-bloque">${fila}</div>`;
  const quien = MF.fuente === "pasos" ? tx("tus pasos") : MF.fuente === "sueno" ? tx("tu sueño") : tx("tus entrenamientos");
  const cuerpo = !s ? `<p class="msf-nota">${tx("Se configuró en tu teléfono, y es él quien la marca.")}</p>`
    : !permiso ? `<p class="msf-nota">${T`Tu teléfono todavía no deja leer ${quien}.`} <button type="button" class="msf-link" onclick="mfActivar('${MF.fuente}')">${tx("Activarlo")}</button></p>`
    : `<div class="msf-regla">${mfReglaHTML()}</div><span class="msf-nota">${escapeHtml(mfNotaRegla())}</span>`;
  return `<div class="msf-bloque">${fila}<div class="msf-despliegue">${cuerpo}${s
    ? `<button type="button" class="msf-link" onclick="mfAbrirHoja('fuente')">${tx("Cambiar con qué se cumple")}</button>` : ""}</div></div>`;
}

/* ---------- Lo que se toca fuera de las hojas ---------- */
function mfAuto() {
  if (!MF || !mfSalud()) return;
  MF.auto = !MF.auto;
  mfPintar(false);
}
function mfMas() {
  MF.mas = !MF.mas;
  mfPintar(false);
}
function mfTipo(v) { MF.tipo = v; MF.tocado.fuente = true; mfPintar(false); }
function mfPaso(s) {
  MF.tocado.cifra = true;
  if (MF.fuente === "pasos") MF.cifra = MF.regla === "km" ? Math.max(1, MF.cifra + s) : Math.min(50000, Math.max(500, MF.cifra + s * 500));
  else if (MF.fuente === "sueno") MF.cifra = MF.regla === "antes" ? (MF.cifra + s * 15 + 1440) % 1440 : Math.max(4, Math.min(12, MF.cifra + s * 0.5));
  else if (MF.regla === "km") MF.cifra = Math.max(1, Math.min(100, MF.cifra + s));
  else MF.cifra = Math.max(5, Math.min(240, MF.cifra + s * 5));
  mfPintar(false);
}

/* ---------- Las hojas ---------- */
function mfAbrirHoja(k) {
  MF.hoja = k; MF.paso = null; MF.xpEscribe = false;
  const el = document.getElementById("hoja-crear");
  el.classList.add("msf");
  mfPintarHoja(true);
  el.classList.add("show");
  revisarFondoQuieto();
}
function mfCerrarHoja() {
  if (!MF) return;
  MF.hoja = null;
  cerrarHojaCrear();
}
/* Lo llama `cerrarHojaCrear` (js/04-misiones.js) al cerrarse la hoja por
   cualquier camino —fuera, Escape, «Listo»—, para que las pastillas digan ya
   lo que se eligió dentro. */
function mfHojaCerrada() {
  const el = document.getElementById("hoja-crear");
  if (el) el.classList.remove("msf");
  if (MF && MF.hoja) { MF.hoja = null; mfPintar(false); }
}

function mfPintarHoja(nueva) {
  const cuerpo = document.getElementById("hoja-crear-body");
  const tapa = cuerpo.closest(".modal-card") || cuerpo;
  const scroll = nueva ? 0 : tapa.scrollTop;
  cuerpo.innerHTML = `<div class="msf-hoja">${mfHojaHTML()}</div>`;
  tapa.scrollTop = scroll;
  if (MF.hoja === "icono") {
    renderIconGrid("msh-icon", MF.icon, "mfIcono", MF.color, true);
    renderColorGrid("msh-color", MF.color, "mfColor");
  }
  const xi = document.getElementById("msh-xp");
  if (xi && document.activeElement !== xi) { xi.focus(); xi.select(); }
}

function mfListo() { return `<button type="button" class="btn btn-primary btn-block msf-listo" onclick="mfCerrarHoja()">${tx("Listo")}</button>`; }

function mfHojaHTML() {
  if (MF.hoja === "icono") {
    return `<h3 class="msf-h">${tx("Icono y color")}</h3>
      <div class="icon-pick" id="msh-icon"></div>
      <div class="color-grid msf-colores" id="msh-color"></div>${mfListo()}`;
  }
  if (MF.hoja === "dias") return mfHojaDias();
  if (MF.hoja === "xp") {
    return `<h3 class="msf-h">${tx("XP al cumplirla")}</h3>
      <p class="msf-nota">${tx("Las misiones dan poco XP, pero todos los días. Ahí está su fuerza.")}</p>
      <div class="msf-xp-cifra">
        ${MF.xpEscribe
          ? `<input type="number" id="msh-xp" class="msf-xp-num" min="0" max="500" inputmode="numeric" value="${MF.xp}" aria-label="${escapeAttr(tx("XP al cumplirla"))}" onkeydown="if(event.key==='Enter')this.blur()" onblur="mfXpEscrito(this.value)">`
          : `<button type="button" class="msf-xp-num" id="msh-xp-num" onclick="mfXpEscribir()" aria-label="${escapeAttr(tx("Escribir otra cantidad"))}">${MF.xp}</button>`}
        <button type="button" class="msf-xp-lapiz" onclick="mfXpEscribir()" aria-label="${escapeAttr(tx("Escribir otra cantidad"))}">${icon("lapiz", 18)}</button>
      </div>
      <div class="msf-xp-rango">
        <input type="range" min="0" max="30" step="1" value="${Math.min(30, MF.xp)}" aria-label="XP" oninput="mfXpDesliza(this.value)">
        <div class="msf-xp-marcas" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <div class="msf-xp-limites" aria-hidden="true"><span>0</span><span>30</span></div>
      </div>${mfListo()}`;
  }
  if (MF.hoja === "skill") return mfHojaSkill();
  if (MF.hoja === "fuente") return mfHojaFuente();
  return "";
}

function mfHojaDias() {
  const seg = `<div class="seg msf-seg" role="radiogroup">
      <button type="button" class="${MF.modo === "semana" ? "on" : ""}" aria-checked="${MF.modo === "semana"}" role="radio" onclick="mfModo('semana')">${tx("Por semana")}</button>
      <button type="button" class="${MF.modo === "mes" ? "on" : ""}" aria-checked="${MF.modo === "mes"}" role="radio" onclick="mfModo('mes')">${tx("Una vez al mes")}</button>
      <button type="button" class="${MF.modo === "una" ? "on" : ""}" aria-checked="${MF.modo === "una"}" role="radio" onclick="mfModo('una')">${tx("Una sola vez")}</button>
    </div>`;
  let cuerpo = "";
  if (MF.modo === "semana") {
    const tono = MF.atajo === "semana" ? " t-semana" : MF.atajo === "finde" ? " t-finde" : "";
    const L = letrasDeSemana();
    cuerpo = `<div class="msf-atajos">
        <button type="button" class="${MF.atajo === "todos" ? "on" : ""}" onclick="mfAtajo('todos')">${tx("Todos los días")}</button>
        <button type="button" class="a-semana${MF.atajo === "semana" ? " on" : ""}" onclick="mfAtajo('semana')">${tx("Entre semana")}</button>
        <button type="button" class="a-finde${MF.atajo === "finde" ? " on" : ""}" onclick="mfAtajo('finde')">${tx("Fines de semana")}</button>
      </div>
      <span class="lbl">${tx("O toca los días que sí")}</span>
      <div class="daypick msf-dias${tono}">${MF_ORDEN.map(d =>
        `<button type="button" class="${MF.dias.includes(d) ? "on" : ""}" aria-pressed="${MF.dias.includes(d)}" onclick="mfDia(${d})">${L[d]}</button>`).join("")}</div>`;
  } else if (MF.modo === "mes") {
    cuerpo = `<span class="lbl">${tx("¿Qué día de cada mes?")}</span>
      <div class="msf-cal">${Array.from({ length: 31 }, (_, i) => i + 1).map(n =>
        `<button type="button" class="${MF.diaMes === n ? "on" : ""}" aria-pressed="${MF.diaMes === n}" onclick="mfDiaMes(${n})">${n}</button>`).join("")}
        <button type="button" class="msf-cal-ult${MF.diaMes === "ult" ? " on" : ""}" aria-pressed="${MF.diaMes === "ult"}" onclick="mfDiaMes('ult')">${tx("Último día")}</button>
      </div>
      <p class="msf-nota">${typeof MF.diaMes === "number" && MF.diaMes > 28
        ? tx("En los meses que no llegan a ese día, sale el último día del mes.")
        : tx("Sale en tu lista ese día, y se queda hasta que la cumplas o termine el mes.")}</p>`;
  } else {
    cuerpo = `<p class="msf-nota">${tx("Desaparece de tu lista cuando la cumples.")}</p>`;
  }
  const veces = MF.modo === "una" ? "" : `<div class="msf-veces"><span>${tx("Veces al día")}<small>${tx("Para beber agua, hacer pausas…")}</small></span>
      <span class="msf-paso"><button type="button" onclick="mfVeces(-1)" aria-label="${escapeAttr(tx("Menos"))}">−</button><output>${MF.veces}</output><button type="button" onclick="mfVeces(1)" aria-label="${escapeAttr(tx("Más"))}">+</button></span></div>`;
  const varias = MF.horas.length > 1;
  const nativo = !!window.norataAvisos;
  const aviso = `<div class="msf-aviso">
      <button type="button" class="msf-sw-fila${MF.avisar ? " on" : ""}" role="switch" aria-checked="${MF.avisar}" onclick="mfAvisar()">
        <span class="msf-sw-tx"><b>${tx("Recordarme")}</b><small>${MF.avisar ? (varias ? tx("Un aviso por cada vez") : tx("Un aviso a esta hora")) : tx("Un aviso a la hora que elijas")}</small></span>
        <span class="msf-sw${MF.avisar ? " on" : ""}" aria-hidden="true"><i data-perilla></i></span></button>
      ${MF.avisar ? `<div class="msf-horas">${MF.horas.map((h, i) => `<label class="msf-hora"><span>${varias ? T`${i + 1}ª vez` : tx("A las")}</span><input type="time" value="${h}" step="900" onchange="mfHora(${i}, this.value)"></label>`).join("")}</div>
        <p class="msf-nota">${varias ? tx("Repartidas entre que despiertas y te duermes, según tu rueda.") + " " : ""}${tx("Nunca suena mientras duermes, y si ya la cumpliste no suena.")}${nativo ? "" : " " + tx("En la web avisa mientras Norata esté abierta.")}</p>` : ""}
    </div>`;
  return `<h3 class="msf-h">${tx("¿Cada cuándo?")}</h3>${seg}${cuerpo}${veces}${aviso}${mfListo()}`;
}

function mfHojaSkill() {
  const p = MF.pred || {};
  const tuyas = state.skills.map(s => `<button type="button" class="msf-opc${MF.skill === s.id ? " on" : ""}" onclick="mfSkill('${enJS(s.id)}')">
      <span class="msf-pto" style="background:${pinta(s.color)}"></span><span class="msf-opc-tx">${escapeHtml(s.name)}</span>${
      p.skill === s.id ? `<i class="msf-prop">${tx("propuesta")}</i>` : ""}<span class="msf-ok">${MF.skill === s.id ? icon("check", 16) : ""}</span></button>`).join("");
  const ninguna = `<button type="button" class="msf-opc${!MF.skill ? " on" : ""}" onclick="mfSkill('')">
      <span class="msf-pto vacio"></span><span class="msf-opc-tx">${tx("Ninguna")}</span><span class="msf-ok">${!MF.skill ? icon("check", 16) : ""}</span></button>`;
  const nuevas = mfCatalogo(MF.name).slice(0, 5);
  const prop = p.catalogo && p.catalogo.n;
  return `<h3 class="msf-h">${tx("¿Qué habilidad sube?")}</h3>
    <div class="msf-lista">${tuyas}${ninguna}</div>
    ${nuevas.length ? `<span class="lbl">${tx("Habilidades nuevas que podrías sumar")}</span>
    <p class="msf-nota msf-nota-arriba">${tx("Aún no las tienes. Al agregar una, entra a tus habilidades y queda elegida para esta misión.")}</p>
    <div class="msf-lista">${nuevas.map(c => `<div class="msf-opc apagada"><span class="msf-pto" style="background:${pinta(c.k)}"></span><span class="msf-opc-tx">${escapeHtml(tx(c.n))}</span>${
      prop === c.n ? `<i class="msf-prop">${tx("propuesta")}</i>` : ""}<button type="button" class="msf-agregar" onclick="mfAgregarHab('${enJS(c.n)}')">${tx("Agregar")}</button></div>`).join("")}</div>` : ""}
    ${mfListo()}`;
}

/* Las del catálogo que todavía no tienes, primero las que casan con el nombre. */
function mfCatalogo(nombre) {
  if (typeof SKILL_CATALOG === "undefined") return [];
  const puntos = typeof puntosDelLexico === "function" && String(nombre || "").trim().length >= 3 ? puntosDelLexico(nombre) : new Map();
  const libres = SKILL_CATALOG.filter(c => !yaTengo(c.n));
  return libres.map((c, i) => ({ c, p: puntos.get(c.n) || 0, i }))
    .sort((a, b) => b.p - a.p || a.i - b.i)
    .map(x => Object.assign({ p: x.p }, x.c));
}

function mfHojaFuente() {
  const s = mfSalud();
  if (MF.paso === "explica") {
    const f = MF.activando;
    const quien = f === "pasos" ? tx("tus pasos") : f === "sueno" ? tx("tu sueño") : tx("tus entrenamientos");
    const titulo = f === "pasos" ? tx("Deja que tus pasos tachen la misión") : f === "sueno" ? tx("Deja que tu sueño tache la misión") : tx("Deja que tus entrenamientos tachen la misión");
    const falta = s && s.disponible() === false;
    return `<span class="msf-ceja">${tx("Conectar con tu teléfono")}</span>
      <h3 class="msf-h grande">${titulo}</h3>
      <p class="msf-nota msf-nota-grande">${falta
        ? tx("Para esto hace falta Health Connect, la app de Google donde tu teléfono guarda tu salud. Ábrela o instálala y vuelve aquí.")
        : T`Norata le pedirá a Android permiso para leer, solo leer, ${quien}. Nada sale de tu teléfono: a tu cuenta solo llega qué misión se cumplió y a qué hora.`}</p>
      ${falta
        ? `<button type="button" class="btn btn-primary btn-block" onclick="mfAbrirHC()">${tx("Abrir Health Connect")}</button>`
        : `<button type="button" class="btn btn-primary btn-block" onclick="mfPedirPermiso()">${tx("Continuar")}</button>`}
      <button type="button" class="btn btn-ghost btn-block" onclick="mfVolver()">${tx("Ahora no")}</button>`;
  }
  const filas = MF_FUENTES.map(f => {
    const ok = s && s.permiso(f.k);
    return ok
      ? `<button type="button" class="msf-opc${MF.fuente === f.k ? " on" : ""}" onclick="mfFuente('${f.k}')"><span class="msf-icq2">${icon(f.ic, 17)}</span><span class="msf-opc-tx">${tx(f.n)}<small>${tx(f.d)}</small></span><span class="msf-ok">${MF.fuente === f.k ? icon("check", 16) : ""}</span></button>`
      : `<div class="msf-opc apagada"><span class="msf-icq2">${icon(f.ic, 17)}</span><span class="msf-opc-tx">${tx(f.n)}<small>${tx("Sin permiso todavía")}</small></span><button type="button" class="msf-agregar" onclick="mfActivar('${f.k}')">${tx("Activar")}</button></div>`;
  }).join("");
  return `<h3 class="msf-h">${tx("¿Con qué se cumple?")}</h3>
    <div class="msf-lista">${filas}</div>
    <span class="lbl">${tx("Próximamente")}</span>
    <div class="msf-lista">${MF_PRONTO.map(f => `<div class="msf-opc pronto"><span class="msf-icq2">${icon(f.ic, 17)}</span><span class="msf-opc-tx">${tx(f.n)}<small>${tx(f.d)}</small></span><span class="msf-etq-pronto">${tx("Pronto")}</span></div>`).join("")}</div>
    <p class="msf-nota">${tx("Tus datos de salud permanecen en tu teléfono. Puedes revocar el acceso desde Ajustes.")}</p>
    ${mfListo()}`;
}

/* ---------- Lo que se toca dentro de las hojas ---------- */
function mfIcono(n) { MF.icon = n; MF.tocado.icono = true; renderIconGrid("msh-icon", n, "mfIcono", MF.color); mfPintar(false); }
function mfColor(c) { MF.color = c; MF.tocado.icono = true; mfPintar(false); }
function mfModo(m) { MF.tocado.dias = true; MF.modo = m; if (m === "una" && MF.avisar) MF.horas = MF.horas.slice(0, 1); mfPintar(false); }
function mfDiaMes(d) { MF.tocado.dias = true; MF.diaMes = d; mfPintar(false); }
function mfAtajo(a) {
  MF.tocado.dias = true; MF.atajo = a;
  MF.dias = a === "semana" ? [1, 2, 3, 4, 5] : a === "finde" ? [6, 0] : MF_TODOS.slice();
  mfPintar(false);
}
/* Los días que salieron de un atajo llevan su color (celeste entre semana,
   lila los fines); tocados a mano vuelven al verde. Así lo pidió Eduardo. */
function mfDia(d) {
  MF.tocado.dias = true;
  const nuevos = MF.dias.includes(d) ? MF.dias.filter(x => x !== d) : [...MF.dias, d];
  if (!nuevos.length) { toast(tx("Deja al menos un día"), "atencion"); return; }
  MF.dias = nuevos;
  MF.atajo = mfAtajoDe(nuevos) === "todos" ? "todos" : null;
  mfPintar(false);
}
function mfVeces(s) {
  MF.veces = Math.max(1, Math.min(20, MF.veces + s));
  if (MF.avisar) MF.horas = mfRepartir(MF.veces);
  mfPintar(false);
}
function mfAvisar() {
  MF.avisar = !MF.avisar;
  if (MF.avisar) {
    MF.horas = mfRepartir(MF.modo === "una" ? 1 : MF.veces);
    pedirPermisoDeAvisos();
  }
  mfPintar(false);
}
function mfHora(i, v) {
  if (!/^\d{2}:\d{2}$/.test(v)) return;
  MF.horas[i] = v;
  mfPintar(false);
}
function mfXpDesliza(v) {
  MF.xp = Number(v) || 0;
  const n = document.getElementById("msh-xp-num");
  if (n) n.textContent = MF.xp;
  document.getElementById("ms-pills").innerHTML = mfPillsHTML(false);
}
function mfXpEscribir() { if (!MF.xpEscribe) { MF.xpEscribe = true; mfPintarHoja(); } }
function mfXpEscrito(v) {
  /* Repintar la hoja quita el campo, y quitar un campo con el foco dispara
     su `blur` OTRA vez a media escritura del `innerHTML`: sin esta guarda,
     el navegador corta con «el nodo ya no es hijo de este». */
  if (!MF || !MF.xpEscribe) return;
  const n = parseInt(v, 10);
  MF.xp = Math.max(0, Math.min(500, isNaN(n) ? MF.xp : n));
  MF.xpEscribe = false;
  mfPintar(false);
}
function mfSkill(id) { MF.tocado.skill = true; MF.skill = id; mfPintar(false); }
/* Agregar una del catálogo la crea de verdad —con el mismo tope de plan que
   el catálogo— y la deja elegida para esta misión. */
function mfAgregarHab(n) {
  const c = SKILL_CATALOG.find(x => x.n === n);
  if (!c || yaTengo(c.n)) return;
  if (!cabeUnoMas("skills", state.skills.length)) { topeAlcanzado("skills"); return; }
  const s = nuevaHabilidad(tx(c.n), tx(c.c), c.i, c.k);
  state.skills.push(s);
  save();
  MF.skill = s.id; MF.tocado.skill = true;
  toast(T`${tx(c.n)} agregada a tus habilidades`, "logro");
  mfPintar(false);
}
function mfFuente(f) {
  MF.tocado.fuente = true; MF.tocado.cifra = false;
  MF.fuente = f; MF.regla = "cantidad"; MF.tipo = f === "ejercicio" ? "cualquiera" : null;
  const h = mfHistorial();
  MF.cifra = f === "pasos" ? (h.pasos ? Math.max(1000, Math.round(h.pasos * 1.1 / 500) * 500) : 8000)
    : f === "sueno" ? (h.sueno ? Math.round(h.sueno * 2) / 2 : 7) : (h.ejercicio || 30);
  MF.auto = true;
  mfPintar(false);
}
function mfActivar(f) {
  MF.activando = f; MF.paso = "explica";
  if (MF.hoja !== "fuente") mfAbrirHoja("fuente");
  MF.paso = "explica";
  mfPintarHoja(true);
}
function mfVolver() { MF.paso = null; mfPintarHoja(true); }
function mfAbrirHC() { const s = mfSalud(); if (s) s.abrirAjustes(); }
function mfPedirPermiso() {
  const s = mfSalud(), f = MF.activando;
  if (!s || !f) return;
  s.pedir(f).then(ok => {
    if (!MF) return;
    MF.paso = null;
    if (ok) {
      const quien = f === "pasos" ? tx("tus pasos") : f === "sueno" ? tx("tu sueño") : tx("tus entrenamientos");
      toast(T`Listo: tu teléfono ya comparte ${quien} con Norata`, "logro");
      if (!MF.fuente || MF.fuente === f) { if (!MF.fuente) mfFuente(f); }
      /* El historial llega con el permiso: si la cifra no se tocó, ahora es la tuya. */
      if (!MF.tocado.cifra) mfAplicarPred();
    } else toast(tx("Sin permiso, por ahora. Puedes activarlo cuando quieras."), "atencion");
    mfPintar(false);
  });
}

/* El permiso de avisos se pide al encender un recordatorio, que es cuando
   tiene sentido: pedirlo al abrir la app es pedirlo sin decir para qué. */
function pedirPermisoDeAvisos() {
  try {
    if (window.norataAvisos) { window.norataAvisos.pedir(); return; }
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
  } catch (e) { /* sin permiso: avisa dentro de la app */ }
}

/* ---------- Guardar ---------- */
function cancelMissionForm() {
  salirGuardando("view-mission-form", "ms-name", saveMission, !!editingMissionId, "missions");
}

function saveMission() {
  if (!MF) return;
  const name = document.getElementById("ms-name").value.trim();
  if (!name) { toast(tx("Escribe qué vas a hacer")); return; }
  if (MF.modo === "semana" && !MF.dias.length) { toast(tx("Elige al menos un día")); return; }
  const desc = document.getElementById("ms-desc").value.trim();
  const ancla = document.getElementById("ms-ancla").value.trim();
  const cadence = MF.modo === "mes" ? "monthly" : MF.modo === "una" ? "once"
    : MF.dias.length === 7 ? "daily" : "weekly";
  const days = cadence === "weekly" ? MF.dias.slice().sort((a, b) => a - b) : [];
  const target = cadence === "once" ? 1 : MF.veces;
  const skillId = MF.skill || null;
  const xp = Math.max(0, Math.min(500, MF.xp || 0));
  const avisos = MF.avisar ? [...new Set(MF.horas)].sort() : null;
  const auto = MF.auto && MF.fuente ? Object.assign({ fuente: MF.fuente, regla: MF.regla, cifra: MF.cifra },
    MF.fuente === "ejercicio" ? { tipo: MF.tipo || "cualquiera" } : {}) : null;
  if (typeof aprenderAlGuardar === "function") aprenderAlGuardar("ms", name, skillId);

  /* Las claves opcionales se BORRAN al vaciarse, en vez de guardar "" o null:
     la mayoría de misiones no llevan ninguna, y una clave vacía en cada una es
     peso muerto en cada sincronía. */
  const opcionales = (m) => {
    if (ancla) m.ancla = ancla; else delete m.ancla;
    if (cadence === "monthly") m.diaMes = MF.diaMes; else delete m.diaMes;
    if (avisos) m.avisos = avisos; else delete m.avisos;
    if (auto) m.auto = auto; else { delete m.auto; delete m.autoNo; delete m.autoDia; }
  };
  if (editingMissionId) {
    const m = state.missions.find(x => x.id === editingMissionId);
    if (!m) return;
    Object.assign(m, { name, desc, target, xp, skillId, icon: MF.icon, color: MF.color, cadence, days });
    opcionales(m);
    save();
    toast(tx("Misión actualizada"));
  } else {
    const m = {
      id: uid(), name, desc, icon: MF.icon, color: MF.color, cadence, days, target,
      skillId, xp, log: {}, archived: false, completedAt: null, createdAt: todayKey(),
      /* Nacida en una columna concreta: no es una posposición —nadie la ha
         aplazado— así que no arranca ningún reloj de espera. */
      ...(MF.tablero ? { tablero: MF.tablero } : {})
    };
    opcionales(m);
    state.missions.push(m);
    save();
    toast(`Misión "${name}" añadida 🎯`);
  }
  MF = null;
  showView("missions");
  if (typeof revisarSaludYa === "function") revisarSaludYa();
}

async function deleteMission() {
  const m = state.missions.find(x => x.id === editingMissionId);
  if (!m) return;
  if (!await ask(`¿Eliminar la misión "${m.name}" y su historial de rachas?`, "Eliminar", true)) return;
  state.missions = state.missions.filter(x => x.id !== editingMissionId);
  save();
  toast(tx("Misión eliminada"), "deshecho");
  showView("missions");
}

/* El nombre se escucha desde aquí y no con un `oninput` en el marcado: así el
   formulario entero vive en este archivo. Lo de «Más opciones» vive en sus
   campos, que no se redibujan, y se lee al guardar. */
document.addEventListener("input", e => {
  if (!MF || !e.target) return;
  if (e.target.id === "ms-name") mfNombre(e.target.value);
});
