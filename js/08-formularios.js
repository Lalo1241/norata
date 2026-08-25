/* Ficha de talento y los cuatro formularios */
/* ================= Render: detalle talento ================= */

function openPerk(id) {
  currentPerkId = id;
  renderPerkDetail();
  showView("perk");
}

function renderPerkDetail() {
  const p = state.perks.find(x => x.id === currentPerkId);
  if (!p) { showView("tree"); return; }
  const st = perkStatus(p);
  const t = metaDe(p);
  const skill = p.skillId ? state.skills.find(s => s.id === p.skillId) : null;
  const reqs = requisitosVivos(p);

  /* El tipo se dice con su icono y su nombre, no con un glifo que haya que
     memorizar: la llave, la bandera y la diana explican solas de qué va. */
  const facts = `
    <div class="fact-grid">
      <div class="fact"><div class="k">COSTO</div><div class="v acc">${p.cost > 0 ? money(p.cost) : "—"}</div></div>
      <div class="fact"><div class="k">INVERTIDO TOTAL</div><div class="v">${money(p.investedTotal || 0)}</div></div>
      <div class="fact"><div class="k">TIPO</div><div class="v tipo-v">${icon(t.icono, 15)}${t.nombre}</div></div>
      <div class="fact"><div class="k">RECOMPENSA</div><div class="v">${skill ? "+" + p.xpReward + " XP" : "—"}</div></div>
    </div>
    <div class="xp-note" style="text-align:left;margin-top:10px">${t.sub}${
      t.llevaPlan ? ` Plan de ${planLabel(p.planDays)}.` : ""}${
      skill ? ` Beneficia a <b>${escapeHtml(skill.name)}</b>.` : ""}</div>`;

  /* ---- La regla de entrada, también desde la ficha (R13) ----
     El interruptor vive en el mapa, que es donde se ve el problema —varias
     líneas llegando y ninguna pista de si hacen falta todas—, pero quien
     llega hasta aquí no tiene por qué volver al mapa ni abrir el formulario
     entero para cambiar una regla de dos opciones.

     Solo con dos o más requisitos: con uno, "todos" y "cualquiera" describen
     exactamente la misma situación y elegir entre ellos no significa nada. */
  const modo = modoDe(p);
  const listos = reqs.filter(r => r.status === "completed").length;
  const reglaPanel = reqs.length < 2 ? "" : `
    <div class="panel alt">
      <div class="panel-head">
        <h3 style="margin:0">Regla de entrada</h3>
        <span class="hint-hold">${listos} de ${reqs.length}</span>
      </div>
      <div class="seg">
        ${[["todos", "Todos", `Hacen falta los ${reqs.length}`],
           ["cualquiera", "Cualquiera", "Basta con uno"]].map(([k, t, s]) => `
          <button type="button" class="${modo === k ? "on" : ""}" onclick="ponerModoTalento('${p.id}','${k}')">
            <span>${t}</span><i style="display:block;font-size:10px;opacity:0.75;font-style:normal">${s}</i>
          </button>`).join("")}
      </div>
      <p class="settings-note" style="margin:10px 0 0">${modo === "todos"
        ? `Este talento corona varios caminos: se abre cuando estén completos los ${reqs.length}.`
        : `Son caminos alternativos: se abre en cuanto completes cualquiera de los ${reqs.length}.`}
        En el mapa es el círculo con la letra <b>${modo === "todos" ? "Y" : "O"}</b> a su izquierda, y ahí también se cambia de un toque.</p>
    </div>`;

  /* ---- Etapas ----
     Se ven siempre que la meta las tenga, aunque el plan no haya empezado:
     saber en qué se va a meter uno antes de comprometerse es justo lo que
     ayuda a decidir si comprometerse. Solo se pueden marcar en curso. */
  const pasos = p.steps || [];
  const etapas = !t.llevaPlan || st === "completed" || st === "expired" ? "" : `
    <div class="panel alt">
      <div class="panel-head">
        <h3 style="margin:0">Etapas</h3>
        ${pasos.length ? `<span class="hint-hold">${pasos.filter(s => s.done).length} de ${pasos.length}</span>` : ""}
      </div>
      ${pasos.length ? `<div class="pk-steps">
        ${pasos.map(s => `
          <button class="pk-step ${s.done ? "ok" : ""}" ${st === "active"
            ? `onclick="togglePerkStep('${p.id}', '${s.id}')"`
            : "disabled"} style="--pc:${pinta(p.color)}">
            <span class="pk-box">${s.done ? icon("check", 12) : ""}</span>
            <span class="pk-tx">${escapeHtml(s.name)}</span>
            ${st === "active" ? `<span class="pk-del" onclick="event.stopPropagation();quitarEtapa('${p.id}','${s.id}')" title="Quitar etapa">✕</span>` : ""}
          </button>`).join("")}
      </div>`
      : `<p class="settings-note" style="margin:0 0 12px">Todavía no tiene etapas: así, la meta entera cuenta como una sola y se cierra de una vez. Añade las que quieras y el avance se contará solo.</p>`}
      <!-- Añadir etapas se hace AQUÍ, no solo en el formulario. Una meta
           creada con el atajo del mapa nace sin ninguna, y obligar a entrar
           a editar para ponerle la primera dejaba la regla de las etapas
           escondida justo donde el usuario está trabajando. -->
      <div class="step-add" style="margin-top:${pasos.length ? "12px" : "0"}">
        <input type="text" id="pk-new-step" placeholder="Nueva etapa…" maxlength="70"
          onkeydown="if(event.key==='Enter'){event.preventDefault();anadirEtapa('${p.id}');}">
        <button class="btn btn-soft btn-sm" onclick="anadirEtapa('${p.id}')">Añadir</button>
      </div>
      ${st !== "active" && pasos.length ? `<p class="settings-note" style="margin:12px 0 0">Las etapas se marcan cuando el plan esté en curso.</p>` : ""}
    </div>`;

  let planPanel = "";
  if (st === "active") {
    const total = daysBetween(p.startDate, p.endDate);
    const gone = daysBetween(p.startDate, todayKey());
    const left = total - gone;
    const prog = perkProgress(p);
    const sinEtapas = !(p.steps || []).length;
    planPanel = `
    <div class="panel alt">
      <h3>Tu avance</h3>
      <div class="bar" style="height:8px"><div class="bar-fill" style="width:${prog}%;background:${p.color || "var(--mint)"}"></div></div>
      <div class="xp-note" style="margin-top:8px">${sinEtapas
        ? `Esta meta no tiene etapas: <b>ella misma es la etapa</b>. Se cierra confirmándola abajo.`
        : `Llevas <b>${prog}%</b> — ${p.steps.filter(s => s.done).length} de ${p.steps.length} etapas.`}</div>
    </div>
    <div class="panel alt">
      <h3>Plan de tiempo</h3>
      <div class="bar" style="height:6px"><div class="bar-fill" style="width:${Math.min(100, Math.round(gone / total * 100))}%;background:var(--fire)"></div></div>
      <div class="xp-note">Del ${formatDate(p.startDate)} al ${formatDate(p.endDate)} — quedan <b>${left}</b> día${left === 1 ? "" : "s"}.</div>
      <div class="stack" style="margin-top:14px">
        <button class="btn ${prog >= 100 ? "btn-primary" : "btn-soft"} btn-block" onclick="completePerk('${p.id}')">Ya logré la meta</button>
        <button class="btn btn-danger-ghost btn-block" onclick="failPerk('${p.id}')">Rendirme y perder el talento</button>
      </div>
    </div>`;
  }
  if (st === "due") {
    planPanel = `
    <div class="panel alt">
      <h3 style="color:var(--fire)">El plan terminó — momento de la verdad</h3>
      <p class="settings-note">El plazo venció el ${formatDate(p.endDate)}. Sé honesto: ¿lograste la meta de este talento?</p>
      <div class="stack">
        <button class="btn btn-primary btn-block" onclick="completePerk('${p.id}')">Sí, lo logré — hacerlo permanente</button>
        <button class="btn btn-danger-ghost btn-block" onclick="failPerk('${p.id}')">No lo logré — lo pierdo</button>
      </div>
    </div>`;
  }

  let actionPanel = "";
  if (st === "available") {
    const importe = p.cost > 0 ? " · " + money(p.cost) : "";
    if (tipoDe(p) === "hito") {
      actionPanel = `<button class="btn btn-primary btn-block" style="margin-bottom:14px" onclick="completeHito('${p.id}')">Dar por hecho</button>`;
    } else if (tipoDe(p) === "compra") {
      /* Sin importe la compra no puede cerrarse: es lo que la hace una
         llave y no un hito. El botón lo dice en vez de fallar al pulsarlo. */
      actionPanel = p.cost > 0
        ? `<button class="btn btn-primary btn-block" style="margin-bottom:14px" onclick="investPerk('${p.id}')">Comprar y asegurar${importe}</button>`
        : `<div class="panel alt" style="border-color:var(--fire)">
             <h3 style="color:var(--fire)">Le falta el importe</h3>
             <p class="settings-note" style="margin:0 0 12px">Una compra es una llave que se paga. Ponle cuánto costó y podrás asegurarla.</p>
             <button class="btn btn-soft btn-block" onclick="openPerkForm('${p.id}')">Editar y ponerle importe</button>
           </div>`;
    } else {
      actionPanel = `<button class="btn btn-primary btn-block" style="margin-bottom:14px" onclick="investPerk('${p.id}')">Comenzar plan${importe}</button>`;
    }
  }
  if (st === "locked" && reqs.length) {
    /* Se listan TODOS los requisitos con su estado, no solo el primero, y se
       dice bajo qué regla se abre. Con varios pendientes, saber cuál falta
       —y si hace falta terminarlos todos o basta uno— es justo la
       información que convierte un muro en un siguiente paso. */
    const hechos = reqs.filter(r => r.status === "completed").length;
    actionPanel = `
    <div class="panel alt">
      <h3>Bloqueado</h3>
      <p class="settings-note">${reqs.length === 1
        ? "Se abre al completar:"
        : (modoDe(p) === "todos"
          ? `Se abre al completar <b>los ${reqs.length}</b> — llevas ${hechos}.`
          : `Se abre al completar <b>cualquiera</b> de los ${reqs.length}.`)}</p>
      <div class="req-list">
        ${reqs.map(r => `<button type="button" class="req-chip ${r.status === "completed" ? "hecho" : ""}" onclick="openPerk('${r.id}')">
          ${r.status === "completed" ? icon("check", 13) : icon(r.icon || "star", 13)}<span>${escapeHtml(r.name)}</span>
          <i>${escapeHtml(r.branch || "General")}</i>
        </button>`).join("")}
      </div>
    </div>`;
  }
  if (st === "expired") {
    actionPanel = `
    <div class="panel alt">
      <h3 style="color:var(--coral)">Talento perdido</h3>
      <p class="settings-note">El plan venció sin lograr la meta. Puedes reintentarlo: volverás a invertir y arrancará un plan nuevo.</p>
      <button class="btn btn-soft btn-block" onclick="retryPerk('${p.id}')">Reintentar${p.cost > 0 ? " · " + money(p.cost) : ""}</button>
    </div>`;
  }
  if (st === "completed") {
    actionPanel = `
    <div class="panel alt" style="border-color:var(--mint)">
      <h3 style="color:var(--mint)">Permanente desde el ${formatDate(p.completedAt)}</h3>
      <p class="settings-note">Este talento ya es parte de ti. Nadie te lo quita.</p>
      <button class="btn btn-ghost btn-block" onclick="revertirTalento('${p.id}')">Deshacer — no llegó a pasar</button>
    </div>`;
  }
  if (st === "completed") {
    actionPanel = `
    <div class="panel alt" style="border-color:var(--mint)">
      <h3 style="color:var(--mint)">Permanente desde el ${formatDate(p.completedAt)}</h3>
      <p class="settings-note" style="margin:0">Este talento ya es parte de ti. Nadie te lo quita. 🎉</p>
    </div>`;
  }

  const historyHtml = (p.history || []).length === 0
    ? `<p class="settings-note" style="margin:0">Sin movimientos todavía.</p>`
    : p.history.slice(0, 20).map(e => `
      <div class="history-item">
        <div class="note">${escapeHtml(e.event)}<span class="when">${formatWhen(e)}</span></div>
      </div>`).join("");

  document.getElementById("perk-content").innerHTML = `
    <div class="detail-hero perk-hero h-${st}">
      <div class="strip">${motifScene(560, 156, hashSeed(p.id), motifFor(p.icon), p.color || "#5fe0b0")}</div>
      <button type="button" class="skill-emoji editable" style="background:${velo(p.color, "30")};color:${tinta(p.color)}"
        onclick="openPerkForm(currentPerkId)" title="Editar talento" aria-label="Editar talento">
        ${icon(p.icon, 26)}
        <span class="edit-hint">${icon("pen", 11)}</span>
      </button>
      <span class="state-big">${STATUS_LABEL[st]}</span>
      <h2>${escapeHtml(p.name)}</h2>
      <div class="branch-lbl">Rama de talentos · ${escapeHtml(p.branch || "General")}</div>
      ${p.desc ? `<div class="desc">${escapeHtml(p.desc)}</div>` : ""}
      ${skill ? `<button class="xlink" style="--xc:${pinta(skill.color)}" onclick="openDetail('${skill.id}')">
        ${icon(skill.icon, 13)} Entrena ${escapeHtml(skill.name)} →
      </button>` : ""}
    </div>
    <div class="panel alt">${facts}</div>
    ${reglaPanel}
    ${etapas}
    ${planPanel}
    ${actionPanel}
    <div class="panel">
      <h3>Movimientos</h3>
      ${historyHtml}
    </div>`;
}

/* El mismo cambio que el interruptor del mapa, pero desde la ficha. Se
   reescribe la ficha y el mapa: la letra del círculo tiene que quedar igual
   en los dos sitios, o el usuario acabaría dudando de cuál manda. */
function ponerModoTalento(id, m) {
  const p = state.perks.find(x => x.id === id);
  if (!p || modoDe(p) === m) return;
  pushUndo("cambiar la regla de entrada");
  p.modo = m === "cualquiera" ? "cualquiera" : "todos";
  save();
  renderPerkDetail();
  renderTree();
  toast(m === "todos"
    ? `Se abrirá al completar todos sus requisitos`
    : `Se abrirá al completar cualquiera de sus requisitos`, "hecho");
}

/* ================= Formulario habilidad ================= */

let fIcon = ICON_LIST[0];
let fColor = COLORS[0];

function openSkillForm(id) {
  editingSkillId = id || null;
  const s = id ? state.skills.find(x => x.id === id) : null;

  document.getElementById("form-title").textContent = s ? "Editar habilidad" : "Nueva habilidad";
  document.getElementById("f-name").value = s ? s.name : "";
  document.getElementById("f-cat").value = s ? (s.category || "") : "";
  document.getElementById("f-perm").checked = s ? !!s.permanent : false;
  document.getElementById("f-grace").value = s ? s.graceDays : 7;
  document.getElementById("f-decay").value = s ? s.decayPerDay : 10;
  document.getElementById("f-delete").style.display = s ? "block" : "none";
  fIcon = s ? s.icon : ICON_LIST[state.skills.length % ICON_LIST.length];
  fColor = s ? s.color : COLORS[state.skills.length % COLORS.length];

  const cats = [...new Set(state.skills.map(x => x.category).filter(Boolean))];
  document.getElementById("cat-list").innerHTML = cats.map(c => `<option value="${escapeAttr(c)}">`).join("");

  renderIconGrid("f-icon", fIcon, "pickSkillIcon", fColor);
  renderColorGrid("f-color", fColor, "pickColor");
  togglePermFields();
  showView("form");
}

/* La rejilla de iconos muestra el icono elegido ya con el color elegido:
   así ves en vivo cómo va a quedar. */
function renderIconGrid(elId, selected, pickFn, color) {
  const el = document.getElementById(elId);
  if (!el) return;
  if (color) el.style.setProperty("--sel", pinta(color));
  el.innerHTML = ICON_LIST.map(n =>
    `<button type="button" class="${n === selected ? "selected" : ""}" onclick="${pickFn}('${n}')" aria-label="${n}">${icon(n, 20)}</button>`
  ).join("");
}
function pickSkillIcon(n) { fIcon = n; renderIconGrid("f-icon", n, "pickSkillIcon", fColor); }

function renderColorGrid(elId, selected, pickFn) {
  document.getElementById(elId).innerHTML = COLORS.map(c =>
    `<button type="button" class="${c === selected ? "selected" : ""}" style="background:${pinta(c)}" onclick="${pickFn}('${c}')" aria-label="${c}"></button>`
  ).join("");
}
function pickColor(c) { fColor = c; renderColorGrid("f-color", c, "pickColor"); renderIconGrid("f-icon", fIcon, "pickSkillIcon", c); }
function pickPerkColor(c) { pColor = c; renderColorGrid("p-color", c, "pickPerkColor"); renderIconGrid("p-icon", pIcon, "pickPerkIcon", c); }

function togglePermFields() {
  const perm = document.getElementById("f-perm").checked;
  document.getElementById("decay-fields").style.display = perm ? "none" : "block";
}

function saveSkill() {
  const name = document.getElementById("f-name").value.trim();
  if (!name) { toast("Ponle un nombre a la habilidad", "atencion"); return; }
  const category = document.getElementById("f-cat").value.trim();
  const permanent = document.getElementById("f-perm").checked;
  const graceDays = Math.max(1, parseInt(document.getElementById("f-grace").value) || 7);
  const decayPerDay = Math.max(1, parseInt(document.getElementById("f-decay").value) || 10);

  if (editingSkillId) {
    const s = state.skills.find(x => x.id === editingSkillId);
    Object.assign(s, { name, category, permanent, graceDays, decayPerDay, icon: fIcon, color: fColor });
    save();
    toast("Habilidad actualizada");
    if (currentSkillId === editingSkillId) { renderDetail(); showView("detail"); }
    else showView("home");
  } else {
    state.skills.push({
      id: uid(), name, category, icon: fIcon, color: fColor,
      xp: 0, permanent, graceDays, decayPerDay,
      createdAt: todayKey(), lastActivity: null, lastCheck: todayKey(), log: []
    });
    save();
    toast(`${name} añadida a tu expedición ✨`);
    showView("home");
    /* Solo con la primera: el tutorial acompaña al estreno del tablero, y a
       la segunda habilidad ya sobra. */
    if (state.skills.length === 1) quizaTutorial(900);
  }
}

function cancelForm() {
  showView(editingSkillId && currentSkillId === editingSkillId ? "detail" : "home");
}

async function deleteSkill() {
  const s = state.skills.find(x => x.id === editingSkillId);
  if (!s) return;
  if (!await ask(`¿Eliminar "${s.name}" y todo su historial? Esta acción no se puede deshacer.`, "Eliminar", true)) return;
  state.skills = state.skills.filter(x => x.id !== editingSkillId);
  for (const p of state.perks) if (p.skillId === editingSkillId) p.skillId = null;
  currentSkillId = null;
  save();
  toast("Habilidad eliminada", "deshecho");
  showView("home");
}

/* ================= Formulario talento ================= */

let pIcon = ICON_LIST[1];
let pColor = COLORS[2];

function openPerkForm(id, presetBranch) {
  editingPerkId = id || null;
  const p = id ? state.perks.find(x => x.id === id) : null;

  document.getElementById("perk-form-title").textContent = p ? "Editar talento" : "Nuevo talento";
  document.getElementById("p-name").value = p ? p.name : "";
  document.getElementById("p-branch").value = p ? (p.branch || "") : (presetBranch || "");
  document.getElementById("p-desc").value = p ? (p.desc || "") : "";
  document.getElementById("p-cost").value = p ? p.cost : 0;
  document.getElementById("p-xp").value = p ? p.xpReward : 600;
  document.getElementById("p-delete").style.display = p ? "block" : "none";
  pIcon = p ? (p.icon || "star") : ICON_LIST[(state.perks.length * 5 + 3) % ICON_LIST.length];
  pColor = p ? (p.color || COLORS[2]) : COLORS[(state.perks.length * 3 + 2) % COLORS.length];
  pTipo = p ? tipoDe(p) : "meta";
  /* Copia, no referencia: si se edita y luego se cancela, las etapas del
     talento guardado tienen que quedar como estaban. */
  pSteps = p ? (p.steps || []).map(s => ({ ...s })) : [];

  let n = 12, u = "m";
  if (p && p.planDays) {
    if (p.planDays % 30 === 0) { n = p.planDays / 30; u = "m"; }
    else { n = p.planDays; u = "d"; }
  }
  document.getElementById("p-plan-n").value = n;
  document.getElementById("p-plan-u").value = u;

  const branches = [...new Set(state.perks.map(x => x.branch).filter(Boolean))];
  document.getElementById("branch-list").innerHTML = branches.map(b => `<option value="${escapeAttr(b)}">`).join("");

  document.getElementById("p-skill").innerHTML =
    `<option value="">— Ninguna —</option>` +
    state.skills.map(s => `<option value="${s.id}" ${p && p.skillId === s.id ? "selected" : ""}>${escapeHtml(s.name)}</option>`).join("");

  const others = state.perks.filter(x => !p || x.id !== p.id);
  pReq = p ? requisitosDe(p).slice() : [];
  pModo = p ? modoDe(p) : "todos";
  renderPerkReqs();

  renderIconGrid("p-icon", pIcon, "pickPerkIcon", pColor);
  renderColorGrid("p-color", pColor, "pickPerkColor");
  renderPerkTipo();
  renderPerkFormSteps();
  sugActual.p = null;
  refrescarSugerencias("p");
  showView("perk-form");
}

function pickPerkIcon(n) { pIcon = n; renderIconGrid("p-icon", n, "pickPerkIcon", pColor); }

/* El tipo elegido en el formulario y las etapas que se están editando.
   Viven fuera del DOM porque el selector es de botones, no un <input>, y
   las etapas se añaden y quitan antes de existir el talento. */
let pTipo = "meta";
let pSteps = [];
let pReq = [];
let pModo = "todos";

/* ---- Requisitos en el formulario ----
   Se listan todos los talentos como fichas encendibles. El modo solo
   aparece con dos o más marcados, porque con uno "todos" y "cualquiera"
   dicen exactamente lo mismo y ofrecer la elección solo confundiría. */
function renderPerkReqs() {
  const cont = document.getElementById("p-requires");
  const otros = state.perks.filter(x => x.id !== editingPerkId);
  if (!otros.length) {
    cont.innerHTML = `<p class="settings-note" style="margin:0">Todavía no hay otros talentos a los que encadenarlo.</p>`;
  } else {
    cont.innerHTML = otros.map(x => {
      const on = pReq.includes(x.id);
      /* Elegir un descendiente cerraría un bucle. Se muestra apagado y sin
         poder marcarse, en vez de dejar intentarlo y rechazarlo después. */
      const bucle = !on && editingPerkId && isDescendant(editingPerkId, x.id);
      return `<button type="button" class="req-chip ${on ? "on" : ""} ${bucle ? "no" : ""}"
        ${bucle ? "disabled title=\"Crearía un bucle\"" : `onclick="togglePerkReq('${x.id}')"`}>
        ${icon(x.icon || "star", 13)}<span>${escapeHtml(x.name)}</span>
        <i>${escapeHtml(x.branch || "General")}</i>
      </button>`;
    }).join("");
  }

  const varios = pReq.length > 1;
  document.getElementById("p-modo-fila").style.display = varios ? "block" : "none";
  document.getElementById("p-modo").innerHTML = [
    ["todos", "Todos", "Hacen falta los " + pReq.length],
    ["cualquiera", "Cualquiera", "Basta con uno"]
  ].map(([k, t, s]) => `
    <button type="button" class="${pModo === k ? "on" : ""}" onclick="pickPerkModo('${k}')">
      <span>${t}</span><i style="display:block;font-size:10px;opacity:0.75;font-style:normal">${s}</i>
    </button>`).join("");

  document.getElementById("p-req-hint").textContent = !pReq.length
    ? "Sin requisitos: estará disponible desde el principio."
    : (varios
      ? (pModo === "todos"
        ? "Quedará bloqueado hasta completar los " + pReq.length + ". Es el talento que corona varios caminos."
        : "Se desbloquea en cuanto completes cualquiera de los " + pReq.length + ". Son caminos alternativos.")
      : "Quedará bloqueado (y conectado en el mapa) hasta completar ese talento.");
}

function togglePerkReq(id) {
  pReq = pReq.includes(id) ? pReq.filter(x => x !== id) : [...pReq, id];
  renderPerkReqs();
}

function pickPerkModo(m) { pModo = m; renderPerkReqs(); }

function pickPerkTipo(t) {
  if (!TIPOS[t]) return;
  pTipo = t;
  /* La recompensa por defecto acompaña al tipo, pero solo en talentos
     nuevos: al editar, cambiar de tipo no puede pisar una cifra que el
     usuario ya ajustó a mano. */
  if (!editingPerkId) document.getElementById("p-xp").value = t === "hito" ? 120 : 600;
  renderPerkTipo();
}

function renderPerkTipo() {
  const t = TIPOS[pTipo];
  document.getElementById("p-tipo").innerHTML = Object.keys(TIPOS).map(k => `
    <button type="button" class="${k === pTipo ? "on" : ""}" onclick="pickPerkTipo('${k}')">
      ${icon(TIPOS[k].icono, 15)}<span>${TIPOS[k].nombre}</span>
    </button>`).join("");
  document.getElementById("p-tipo-sub").textContent = t.sub;

  /* Cada tipo enseña solo los campos que le significan algo. Un hito sin
     casilla de importe no es una restricción caprichosa: es la regla que lo
     separa de una compra, dicha con la propia forma del formulario. */
  document.getElementById("campo-plan").style.display = t.llevaPlan ? "block" : "none";
  document.getElementById("panel-etapas").style.display = t.llevaPlan ? "block" : "none";
  document.getElementById("campo-importe").style.display = pTipo === "hito" ? "none" : "block";
  document.getElementById("p-cost-lbl").textContent = t.pideImporte ? "Cuánto costó (MXN)" : "Costo (MXN, opcional)";
  document.getElementById("p-cost-hint").textContent = t.pideImporte
    ? "Obligatorio: una compra es una llave que se paga."
    : "Si la meta te costó dinero, anótalo aquí.";
}

function renderPerkFormSteps() {
  document.getElementById("p-steps").innerHTML = pSteps.length === 0
    ? `<p class="settings-note" style="margin:0 0 10px">Sin etapas: la meta entera será su propia etapa.</p>`
    : pSteps.map((s, i) => `
      <div class="step-row">
        <span class="step-num">${i + 1}</span>
        <span class="step-name">${escapeHtml(s.name)}</span>
        <button class="step-del" onclick="removePerkFormStep(${i})" aria-label="Quitar">✕</button>
      </div>`).join("");
}

function addPerkFormStep() {
  const input = document.getElementById("p-new-step");
  const name = input.value.trim();
  if (!name) return;
  pSteps.push({ id: uid(), name, done: false, at: null });
  input.value = "";
  renderPerkFormSteps();
  input.focus();
}

function removePerkFormStep(i) {
  pSteps.splice(i, 1);
  renderPerkFormSteps();
}

function savePerk() {
  const name = document.getElementById("p-name").value.trim();
  if (!name) { toast("Ponle un nombre al talento", "atencion"); return; }
  const t = TIPOS[pTipo];
  const branch = document.getElementById("p-branch").value.trim() || "General";
  const desc = document.getElementById("p-desc").value.trim();
  /* Un hito no admite importe: no se lee el campo aunque tuviera un valor
     de antes de cambiar de tipo. */
  const cost = pTipo === "hito" ? 0 : Math.max(0, parseFloat(document.getElementById("p-cost").value) || 0);
  const n = Math.max(1, parseInt(document.getElementById("p-plan-n").value) || 12);
  const u = document.getElementById("p-plan-u").value;
  const planDays = u === "m" ? n * 30 : n;
  const skillId = document.getElementById("p-skill").value || null;
  const xpReward = Math.max(0, parseInt(document.getElementById("p-xp").value) || 0);
  const requiere = pReq.filter(id => state.perks.some(x => x.id === id) && id !== editingPerkId);
  const modo = pModo;
  const steps = t.llevaPlan ? pSteps : [];

  /* Se avisa al guardar y no al comprar, que es cuando el fallo estorba:
     un talento a medio definir no debería poder quedarse guardado como si
     estuviera listo. */
  if (t.pideImporte && !(cost > 0)) {
    toast("Una compra necesita su importe: ponle cuánto costó", "atencion");
    document.getElementById("p-cost").focus();
    return;
  }
  aprenderAlGuardar("p", name, skillId);

  if (editingPerkId) {
    const p = state.perks.find(x => x.id === editingPerkId);
    Object.assign(p, { name, branch, desc, tipo: pTipo, cost, planDays, steps, skillId, xpReward, requiere, modo, icon: pIcon, color: pColor });
    save();
    toast("Talento actualizado");
    if (currentPerkId === editingPerkId) { renderPerkDetail(); showView("perk"); }
    else showView("tree");
  } else {
    const nuevo = {
      id: uid(), name, branch, desc, tipo: pTipo, cost, planDays, steps,
      skillId, xpReward, requiere, modo, icon: pIcon, color: pColor,
      status: null, startDate: null, endDate: null, completedAt: null,
      investedTotal: 0, progress: 0, createdAt: todayKey(),
      history: [{ date: todayKey(), at: stamp(), event: `Talento creado en la rama ${branch}` }]
    };
    /* Se congela la rama ANTES de meter el nuevo: si no, los que todavia
       no tenian coordenadas propias se recolocarian al recalcular el
       reparto automatico con una fila mas. */
    fijarPosiciones(branch);
    const hermanos = talentosDeRama(branch).filter(n => typeof n.x === "number");
    if (hermanos.length) {
      const req = requiere.length ? state.perks.find(x => x.id === requiere[0]) : null;
      nuevo.x = req && typeof req.x === "number" ? req.x + 168 : Math.min(...hermanos.map(n => n.x));
      nuevo.y = Math.max(...hermanos.map(n => n.y)) + 126;
    }
    state.perks.push(nuevo);
    save();
    toast(`${TIPOS[pTipo].nombre} "${name}" añadida al árbol`);
    showView("tree");
  }
}

function cancelPerkForm() {
  showView(editingPerkId && currentPerkId === editingPerkId ? "perk" : "tree");
}

async function deletePerk() {
  const p = state.perks.find(x => x.id === editingPerkId);
  if (!p) return;
  if (!await ask(`¿Eliminar el talento "${p.name}"? Esta acción no se puede deshacer.`, "Eliminar", true)) return;
  state.perks = state.perks.filter(x => x.id !== editingPerkId);
  for (const other of state.perks) {
    const r = requisitosDe(other);
    if (r.includes(editingPerkId)) other.requiere = r.filter(id => id !== editingPerkId);
  }
  currentPerkId = null;
  save();
  toast("Talento eliminado", "deshecho");
  showView("tree");
}

/* ================= Formulario de misión ================= */

let msTablero = null;
let msIcon = ICON_LIST[14];
let msColor = COLORS[0];
let msCadence = "daily";
let msDays = [1, 3, 5];
let editingMissionId = null;

/* `presetTablero` llega desde el ＋ de una columna: la misión nueva nace ya
   colocada ahí. En "Pendientes de hoy" no se guarda nada, que es su sitio
   natural; en cualquier otra, se apunta la columna. */
function openMissionForm(id, presetTablero) {
  editingMissionId = id || null;
  msTablero = (!id && presetTablero && presetTablero !== "hoy") ? presetTablero : null;
  const m = id ? state.missions.find(x => x.id === id) : null;

  document.getElementById("mission-form-title").textContent = m ? "Editar misión" : "Nueva misión";
  document.getElementById("ms-name").value = m ? m.name : "";
  document.getElementById("ms-desc").value = m ? (m.desc || "") : "";
  document.getElementById("ms-target").value = m ? missionTarget(m) : 1;
  document.getElementById("ms-xp").value = m ? m.xp : 15;
  document.getElementById("ms-delete").style.display = m ? "block" : "none";
  msIcon = m ? m.icon : ICON_LIST[(state.missions.length * 6 + 14) % ICON_LIST.length];
  msColor = m ? m.color : COLORS[state.missions.length % COLORS.length];
  msCadence = m ? m.cadence : "daily";
  msDays = m && m.days && m.days.length ? [...m.days] : [1, 3, 5];

  document.getElementById("ms-skill").innerHTML =
    `<option value="">— Ninguna —</option>` +
    state.skills.map(s => `<option value="${s.id}" ${m && m.skillId === s.id ? "selected" : ""}>${escapeHtml(s.name)}</option>`).join("");

  renderIconGrid("ms-icon", msIcon, "pickMissionIcon", msColor);
  renderColorGrid("ms-color", msColor, "pickMissionColor");
  pickCadence(msCadence);
  showView("mission-form");
}

function pickMissionIcon(n) { msIcon = n; renderIconGrid("ms-icon", n, "pickMissionIcon", msColor); }
function pickMissionColor(c) { msColor = c; renderColorGrid("ms-color", c, "pickMissionColor"); renderIconGrid("ms-icon", msIcon, "pickMissionIcon", c); }

function pickCadence(c) {
  msCadence = c;
  document.querySelectorAll("#ms-cadence button").forEach(b => b.classList.toggle("on", b.dataset.c === c));
  document.getElementById("ms-days-wrap").style.display = c === "weekly" ? "block" : "none";
  document.getElementById("ms-target-wrap").style.display = c === "once" ? "none" : "block";
  renderDayPick();
}

function renderDayPick() {
  document.getElementById("ms-days").innerHTML = DAY_NAMES.map((d, i) =>
    `<button type="button" class="${msDays.includes(i) ? "on" : ""}" onclick="toggleDay(${i})">${d}</button>`
  ).join("");
}

function toggleDay(i) {
  msDays = msDays.includes(i) ? msDays.filter(d => d !== i) : [...msDays, i].sort();
  renderDayPick();
}

function saveMission() {
  const name = document.getElementById("ms-name").value.trim();
  if (!name) { toast("Escribe qué vas a hacer"); return; }
  if (msCadence === "weekly" && msDays.length === 0) { toast("Elige al menos un día"); return; }
  const desc = document.getElementById("ms-desc").value.trim();
  const target = Math.max(1, parseInt(document.getElementById("ms-target").value) || 1);
  const xp = Math.max(0, parseInt(document.getElementById("ms-xp").value) || 0);
  const skillId = document.getElementById("ms-skill").value || null;

  if (editingMissionId) {
    const m = state.missions.find(x => x.id === editingMissionId);
    Object.assign(m, { name, desc, target: msCadence === "once" ? 1 : target, xp, skillId, icon: msIcon, color: msColor, cadence: msCadence, days: msDays });
    save();
    toast("Misión actualizada");
  } else {
    state.missions.push({
      id: uid(), name, desc, icon: msIcon, color: msColor,
      cadence: msCadence, days: msDays, target: msCadence === "once" ? 1 : target,
      skillId, xp, log: {}, archived: false, completedAt: null,
      createdAt: todayKey(),
      /* Nacida en una columna concreta: no es una posposición —nadie la ha
         aplazado— así que no arranca ningún reloj de espera. */
      ...(msTablero ? { tablero: msTablero } : {})
    });
    save();
    toast(`Misión "${name}" añadida 🎯`);
  }
  showView("missions");
}

async function deleteMission() {
  const m = state.missions.find(x => x.id === editingMissionId);
  if (!m) return;
  if (!await ask(`¿Eliminar la misión "${m.name}" y su historial de rachas?`, "Eliminar", true)) return;
  state.missions = state.missions.filter(x => x.id !== editingMissionId);
  save();
  toast("Misión eliminada", "deshecho");
  showView("missions");
}

/* ================= Formulario de proyecto ================= */

let prIcon = ICON_LIST[16];
let prColor = COLORS[0];
let formSteps = [];

function openProjectForm(id, presetBranch) {
  editingProjectId = id || null;
  const pr = id ? state.projects.find(x => x.id === id) : null;

  document.getElementById("project-form-title").textContent = pr ? "Editar encargo" : "Nuevo encargo";
  document.getElementById("pr-name").value = pr ? pr.name : "";
  document.getElementById("pr-branch").value = pr ? (pr.branch || "") : (presetBranch || "");
  document.getElementById("pr-desc").value = pr ? (pr.desc || "") : "";
  document.getElementById("pr-xp").value = pr ? pr.xpReward : 500;
  document.getElementById("pr-delete").style.display = pr ? "block" : "none";
  prIcon = pr ? pr.icon : ICON_LIST[(state.projects.length * 4 + 1) % ICON_LIST.length];
  prColor = pr ? pr.color : COLORS[state.projects.length % COLORS.length];
  formSteps = pr ? pr.steps.map(s => ({ ...s })) : [];

  const branches = [...new Set(state.projects.map(x => x.branch).filter(Boolean))];
  document.getElementById("pr-branch-list").innerHTML = branches.map(b => `<option value="${escapeAttr(b)}">`).join("");

  document.getElementById("pr-skill").innerHTML =
    `<option value="">— Ninguna —</option>` +
    state.skills.map(s => `<option value="${s.id}" ${pr && pr.skillId === s.id ? "selected" : ""}>${escapeHtml(s.name)}</option>`).join("");

  renderIconGrid("pr-icon", prIcon, "pickProjectIcon", prColor);
  renderColorGrid("pr-color", prColor, "pickProjectColor");
  renderFormSteps();
  sugActual.pr = null;
  refrescarSugerencias("pr");
  showView("project-form");
}

function pickProjectIcon(n) { prIcon = n; renderIconGrid("pr-icon", n, "pickProjectIcon", prColor); }
function pickProjectColor(c) { prColor = c; renderColorGrid("pr-color", c, "pickProjectColor"); renderIconGrid("pr-icon", prIcon, "pickProjectIcon", c); }

function renderFormSteps() {
  document.getElementById("pr-steps").innerHTML = formSteps.length === 0
    ? `<p class="settings-note" style="margin:0 0 10px">Sin etapas todavía.</p>`
    : formSteps.map((s, i) => `
      <div class="step-row">
        <span class="step-num">${i + 1}</span>
        <span class="step-name">${escapeHtml(s.name)}</span>
        <button class="step-del" onclick="removeFormStep(${i})" aria-label="Quitar">✕</button>
      </div>`).join("");
}

function addFormStep() {
  const input = document.getElementById("pr-new-step");
  const name = input.value.trim();
  if (!name) return;
  formSteps.push({ id: uid(), name, done: false, at: null });
  input.value = "";
  renderFormSteps();
  input.focus();
}

function removeFormStep(i) {
  formSteps.splice(i, 1);
  renderFormSteps();
}

function saveProject() {
  const name = document.getElementById("pr-name").value.trim();
  if (!name) { toast("Ponle un nombre al encargo", "atencion"); return; }
  const branch = document.getElementById("pr-branch").value.trim() || "General";
  const desc = document.getElementById("pr-desc").value.trim();
  const skillId = document.getElementById("pr-skill").value || null;
  const xpReward = Math.max(0, parseInt(document.getElementById("pr-xp").value) || 0);
  aprenderAlGuardar("pr", name, skillId);

  if (editingProjectId) {
    const pr = state.projects.find(x => x.id === editingProjectId);
    // Conserva el estado de las etapas que ya existían
    const prev = {};
    pr.steps.forEach(s => prev[s.id] = s);
    Object.assign(pr, {
      name, branch, desc, skillId, xpReward, icon: prIcon, color: prColor,
      steps: formSteps.map(s => prev[s.id] ? { ...s, done: prev[s.id].done, at: prev[s.id].at } : s)
    });
    save();
    toast("Encargo actualizado");
    if (currentProjectId === editingProjectId) { renderProjectDetail(); showView("project"); }
    else showView("projects");
  } else {
    state.projects.push({
      id: uid(), name, branch, desc, icon: prIcon, color: prColor,
      status: "active", steps: formSteps, skillId, xpReward,
      createdAt: todayKey(), lastActivity: todayKey(), completedAt: null,
      history: [{ date: todayKey(), at: stamp(), event: `Proyecto creado en la rama ${branch}` }]
    });
    save();
    toast(`Encargo "${name}" creado 🚩`);
    showView("projects");
  }
}

function cancelProjectForm() {
  showView(editingProjectId && currentProjectId === editingProjectId ? "project" : "projects");
}

async function deleteProject() {
  const pr = state.projects.find(x => x.id === editingProjectId);
  if (!pr) return;
  if (!await ask(`¿Eliminar el proyecto "${pr.name}" y su historial? Esta acción no se puede deshacer.`, "Eliminar", true)) return;
  state.projects = state.projects.filter(x => x.id !== editingProjectId);
  currentProjectId = null;
  save();
  toast("Proyecto eliminado", "deshecho");
  showView("projects");
}

