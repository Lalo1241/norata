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
      <div class="fact"><div class="k">${tx("COSTO")}</div><div class="v acc">${p.cost > 0 ? money(p.cost) : "—"}</div></div>
      <div class="fact"><div class="k">${tx("INVERTIDO TOTAL")}</div><div class="v">${money(p.investedTotal || 0)}</div></div>
      <div class="fact"><div class="k">${tx("TIPO")}</div><div class="v tipo-v">${icon(t.icono, 15)}${tx(t.nombre)}</div></div>
      <div class="fact"><div class="k">${tx("RECOMPENSA")}</div><div class="v">${skill ? "+" + p.xpReward + " XP" : "—"}</div></div>
    </div>
    <div class="xp-note" style="text-align:left;margin-top:10px">${tx(t.sub)}${
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
        <h3 style="margin:0">${tx("Regla de entrada")}</h3>
        <span class="hint-hold">${listos} de ${reqs.length}</span>
      </div>
      <div class="seg">
        ${[["todos", tx("Todos"), T`Hacen falta los ${reqs.length}`],
           ["cualquiera", tx("Cualquiera"), tx("Basta con uno")]].map(([k, t, s]) => `
          <button type="button" class="${modo === k ? "on" : ""}" onclick="ponerModoTalento('${p.id}','${k}')">
            <span>${t}</span><i style="display:block;font-size:10px;opacity:0.75;font-style:normal">${s}</i>
          </button>`).join("")}
      </div>
      <p class="settings-note" style="margin:10px 0 0">${modo === "todos"
        ? T`Este talento corona varios caminos: se desbloquea cuando estén completos los ${reqs.length}.`
        : T`Son caminos alternativos: se desbloquea en cuanto completes cualquiera de los ${reqs.length}.`}
        ${T`En el mapa es el círculo con la letra <b>${modo === "todos" ? "Y" : "O"}</b> a su izquierda, y ahí también se cambia de un toque.`}</p>
    </div>`;

  /* ---- Etapas ----
     Se ven siempre que la meta las tenga, aunque el plan no haya empezado:
     saber en qué se va a meter uno antes de comprometerse es justo lo que
     ayuda a decidir si comprometerse. Solo se pueden marcar en curso. */
  const pasos = p.steps || [];
  const etapas = !t.llevaPlan || st === "completed" || st === "expired" ? "" : `
    <div class="panel alt">
      <div class="panel-head">
        <h3 style="margin:0">${tx("Etapas")}</h3>
        ${pasos.length ? `<span class="hint-hold">${pasos.filter(s => s.done).length} de ${pasos.length}</span>` : ""}
      </div>
      ${pasos.length ? `<div class="pk-steps">
        ${pasos.map(s => `
          <button class="pk-step ${s.done ? "ok" : ""}" ${st === "active"
            ? `onclick="togglePerkStep('${p.id}', '${s.id}')"`
            : "disabled"} style="${tonos("pc", p.color)}">
            <span class="pk-box">${s.done ? icon("check", 12) : ""}</span>
            <span class="pk-tx">${escapeHtml(s.name)}</span>
            ${st === "active" ? `<span class="pk-del" onclick="event.stopPropagation();quitarEtapa('${p.id}','${s.id}')" title="Quitar etapa">✕</span>` : ""}
          </button>`).join("")}
      </div>`
      : `<p class="settings-note" style="margin:0 0 12px">${tx("Todavía no tiene etapas: así, la meta entera cuenta como una sola y se cierra de una vez. Añade las que quieras y el avance se contará solo.")}</p>`}
      <!-- Añadir etapas se hace AQUÍ, no solo en el formulario. Una meta
           creada con el atajo del mapa nace sin ninguna, y obligar a entrar
           a editar para ponerle la primera dejaba la regla de las etapas
           escondida justo donde el usuario está trabajando. -->
      <div class="step-add" style="margin-top:${pasos.length ? "12px" : "0"}">
        <input type="text" id="pk-new-step" placeholder="${escapeAttr(tx("Nueva etapa…"))}" maxlength="70"
          onkeydown="if(event.key==='Enter'){event.preventDefault();anadirEtapa('${p.id}');}">
        <button class="btn btn-soft btn-sm" onclick="anadirEtapa('${p.id}')">${tx("Añadir")}</button>
      </div>
      ${st !== "active" && pasos.length ? `<p class="settings-note" style="margin:12px 0 0">${tx("Las etapas se marcan cuando el plan esté en curso.")}</p>` : ""}
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
      <h3>${tx("Tu avance")}</h3>
      <div class="bar" style="height:8px"><div class="bar-fill" style="width:${prog}%;background:${p.color || "var(--mint)"}"></div></div>
      <div class="xp-note" style="margin-top:8px">${sinEtapas
        ? tx("Esta meta no tiene etapas: <b>ella misma es la etapa</b>. Se cierra confirmándola abajo.")
        : T`Llevas <b>${prog}%</b> — ${p.steps.filter(s => s.done).length} de ${p.steps.length} etapas.`}</div>
    </div>
    <div class="panel alt">
      <h3>${tx("Plan de tiempo")}</h3>
      <div class="bar" style="height:6px"><div class="bar-fill" style="width:${Math.min(100, Math.round(gone / total * 100))}%;background:var(--fire)"></div></div>
      <div class="xp-note">${left === 1
        ? T`Del ${formatDate(p.startDate)} al ${formatDate(p.endDate)} — queda <b>${left}</b> día.`
        : T`Del ${formatDate(p.startDate)} al ${formatDate(p.endDate)} — quedan <b>${left}</b> días.`}</div>
      <div class="stack" style="margin-top:14px">
        <button class="btn ${prog >= 100 ? "btn-primary" : "btn-soft"} btn-block" onclick="completePerk('${p.id}')">${tx("Ya logré la meta")}</button>
        <button class="btn btn-danger-ghost btn-block" onclick="failPerk('${p.id}')">${tx("Rendirme y perder el talento")}</button>
      </div>
    </div>`;
  }
  if (st === "due") {
    planPanel = `
    <div class="panel alt">
      <h3 style="color:var(--fire)">${tx("El plan terminó — momento de la verdad")}</h3>
      <p class="settings-note">El plazo venció el ${formatDate(p.endDate)}. Sé honesto: ¿lograste la meta de este talento?</p>
      <div class="stack">
        <button class="btn btn-primary btn-block" onclick="completePerk('${p.id}')">${tx("Sí, lo logré — hacerlo permanente")}</button>
        <button class="btn btn-danger-ghost btn-block" onclick="failPerk('${p.id}')">${tx("No lo logré — lo pierdo")}</button>
      </div>
    </div>`;
  }

  let actionPanel = "";
  if (st === "available") {
    const importe = p.cost > 0 ? " · " + money(p.cost) : "";
    if (tipoDe(p) === "hito") {
      actionPanel = `<button class="btn btn-primary btn-block" style="margin-bottom:14px" onclick="completeHito('${p.id}')">${tx("Dar por hecho")}</button>`;
    } else if (tipoDe(p) === "compra") {
      /* Sin importe la compra no puede cerrarse: es lo que la hace una
         llave y no un hito. El botón lo dice en vez de fallar al pulsarlo. */
      actionPanel = p.cost > 0
        ? `<button class="btn btn-primary btn-block" style="margin-bottom:14px" onclick="investPerk('${p.id}')">Comprar y asegurar${importe}</button>`
        : `<div class="panel alt" style="border-color:var(--fire)">
             <h3 style="color:var(--fire)">${tx("Le falta el importe")}</h3>
             <p class="settings-note" style="margin:0 0 12px">${tx("Una compra es una llave que se paga. Ponle cuánto costó y podrás asegurarla.")}</p>
             <button class="btn btn-soft btn-block" onclick="openPerkForm('${p.id}')">${tx("Editar y ponerle importe")}</button>
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
      <h3>${tx("Bloqueado")}</h3>
      <p class="settings-note">${reqs.length === 1
        ? tx("Se desbloquea al completar:")
        : (modoDe(p) === "todos"
          /* Enteras, y no pegando «cualquiera» traducido dentro de un marco
             español: así salía «Se desbloquea al completar any de los 2». */
          ? T`Se desbloquea al completar <b>los ${reqs.length}</b> — llevas ${hechos}.`
          : T`Se desbloquea al completar <b>cualquiera</b> de los ${reqs.length}.`)}</p>
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
      <h3 style="color:var(--coral)">${tx("Talento perdido")}</h3>
      <p class="settings-note">${tx("El plan venció sin lograr la meta. Puedes reintentarlo: volverás a invertir y arrancará un plan nuevo.")}</p>
      <button class="btn btn-soft btn-block" onclick="retryPerk('${p.id}')">Reintentar${p.cost > 0 ? " · " + money(p.cost) : ""}</button>
    </div>`;
  }
  if (st === "completed") {
    actionPanel = `
    <div class="panel alt" style="border-color:var(--mint)">
      <h3 style="color:var(--mint)">${T`Permanente desde el ${formatDate(p.completedAt)}`}</h3>
      <p class="settings-note">${tx("Este talento ya es parte de ti. Nadie te lo quita.")}</p>
      <button class="btn btn-ghost btn-block" onclick="revertirTalento('${p.id}')">${tx("Deshacer — no llegó a pasar")}</button>
    </div>`;
  }
  if (st === "completed") {
    actionPanel = `
    <div class="panel alt" style="border-color:var(--mint)">
      <h3 style="color:var(--mint)">${T`Permanente desde el ${formatDate(p.completedAt)}`}</h3>
      <p class="settings-note" style="margin:0">${tx("Este talento ya es parte de ti. Nadie te lo quita. 🎉")}</p>
    </div>`;
  }

  const historyHtml = (p.history || []).length === 0
    ? `<p class="settings-note" style="margin:0">${tx("Sin movimientos todavía.")}</p>`
    : p.history.slice(0, 20).map(e => `
      <div class="history-item">
        <div class="note">${escapeHtml(e.event)}<span class="when">${formatWhen(e)}</span></div>
      </div>`).join("");

  document.getElementById("perk-content").innerHTML = `
    <div class="detail-hero perk-hero h-${st}">
      <div class="strip">${motifScene(560, 156, hashSeed(p.id), motifFor(p.icon), trazo(p.color))}</div>
      <button type="button" class="skill-emoji editable" style="background:${velo(p.color, "30")};color:${tinta(p.color)}"
        onclick="openPerkForm(currentPerkId)" title="${escapeAttr(tx("Editar talento"))}" aria-label="${escapeAttr(tx("Editar talento"))}">
        ${icon(p.icon, 26)}
        <span class="edit-hint">${icon("pen", 11)}</span>
      </button>
      <span class="state-big">${tx(STATUS_LABEL[st])}</span>
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
      <h3>${tx("Movimientos")}</h3>
      ${historyHtml}
    </div>`;
}

/* El mismo cambio que el interruptor del mapa, pero desde la ficha. Se
   reescribe la ficha y el mapa: la letra del círculo tiene que quedar igual
   en los dos sitios, o el usuario acabaría dudando de cuál manda. */
function ponerModoTalento(id, m) {
  const p = state.perks.find(x => x.id === id);
  if (!p || modoDe(p) === m) return;
  pushUndo(tx("cambiar la regla de entrada"));
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

  document.getElementById("form-title").textContent = tx(s ? "Editar habilidad" : "Nueva habilidad");
  document.getElementById("f-name").value = s ? s.name : "";
  document.getElementById("f-cat").value = s ? (s.category || "") : "";
  document.getElementById("f-perm").checked = s ? !!s.permanent : false;
  /* Una habilidad nueva nace con la exigencia que la persona eligió, no con
     el 7 y el 10 que estaban escritos aquí. Ese par fijo era lo que hacía que
     la respuesta del asistente se perdiera al día siguiente. */
  const ex = exigenciaActual();
  document.getElementById("f-grace").value = s ? s.graceDays : ex.grace;
  document.getElementById("f-decay").value = s ? s.decayPerDay : ex.decay;
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
    el.style.setProperty("--sel-l", trazo(color));
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
  if (!name) { toast(tx("Ponle un nombre a la habilidad"), "atencion"); return; }
  const category = document.getElementById("f-cat").value.trim();
  const permanent = document.getElementById("f-perm").checked;
  const ex = exigenciaActual();
  const graceDays = Math.max(1, parseInt(document.getElementById("f-grace").value) || ex.grace);
  const decayPerDay = Math.max(1, parseInt(document.getElementById("f-decay").value) || ex.decay);

  if (editingSkillId) {
    const s = state.skills.find(x => x.id === editingSkillId);
    Object.assign(s, { name, category, permanent, graceDays, decayPerDay, icon: fIcon, color: fColor });
    save();
    toast("Habilidad actualizada");
    if (currentSkillId === editingSkillId) { renderDetail(); showView("detail"); }
    else showView("home");
  } else {
    /* El tope, y SOLO al crear, por lo mismo que los otros cuatro: editar lo
       que ya existe no se toca nunca —«congelar, nunca quitar»—. Va antes del
       `push` y no después, o la habilidad ya estaría dentro cuando salta el
       cuadro. */
    if (!cabeUnoMas("skills", state.skills.length)) { topeAlcanzado("skills"); return; }
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

  document.getElementById("perk-form-title").textContent = p ? tx("Editar talento") : tx("Nuevo talento");
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
    `<option value="">${tx("— Ninguna —")}</option>` +
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
    cont.innerHTML = `<p class="settings-note" style="margin:0">${tx("Todavía no hay otros talentos a los que encadenarlo.")}</p>`;
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
    ["todos", tx("Todos"), T`Hacen falta los ${pReq.length}`],
    ["cualquiera", "Cualquiera", tx("Basta con uno")]
  ].map(([k, t, s]) => `
    <button type="button" class="${pModo === k ? "on" : ""}" onclick="pickPerkModo('${k}')">
      <span>${t}</span><i style="display:block;font-size:10px;opacity:0.75;font-style:normal">${s}</i>
    </button>`).join("");

  document.getElementById("p-req-hint").textContent = !pReq.length
    ? tx("Sin requisitos: estará disponible desde el principio.")
    : (varios
      ? (pModo === "todos"
        ? T`Quedará bloqueado hasta completar los ${pReq.length}. Es el talento que corona varios caminos.`
      : T`Se desbloquea en cuanto completes cualquiera de los ${pReq.length}. Son caminos alternativos.`)
      : tx("Quedará bloqueado (y conectado en el mapa) hasta completar ese talento."));
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
      ${icon(TIPOS[k].icono, 15)}<span>${tx(TIPOS[k].nombre)}</span>
    </button>`).join("");
  document.getElementById("p-tipo-sub").textContent = tx(t.sub);

  /* Cada tipo enseña solo los campos que le significan algo. Un hito sin
     casilla de importe no es una restricción caprichosa: es la regla que lo
     separa de una compra, dicha con la propia forma del formulario. */
  document.getElementById("campo-plan").style.display = t.llevaPlan ? "block" : "none";
  document.getElementById("panel-etapas").style.display = t.llevaPlan ? "block" : "none";
  document.getElementById("campo-importe").style.display = pTipo === "hito" ? "none" : "block";
  /* La moneda sale del ajuste y no escrita a mano: el día que se pueda
     elegir USD, este rótulo tiene que cambiar con ella o estaría pidiendo
     pesos para guardar dólares. */
  const cod = monedaActual();
  document.getElementById("p-cost-lbl").textContent = t.pideImporte ? T`Cuánto costó (${cod})` : T`Costo (${cod}, opcional)`;
  document.getElementById("p-cost-hint").textContent = t.pideImporte
    ? tx("Obligatorio: una compra es una llave que se paga.")
    : tx("Si la meta te costó dinero, anótalo aquí.");
}

function renderPerkFormSteps() {
  document.getElementById("p-steps").innerHTML = pSteps.length === 0
    ? `<p class="settings-note" style="margin:0 0 10px">${tx("Sin etapas: la meta entera será su propia etapa.")}</p>`
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
  if (!name) { toast(tx("Ponle un nombre al talento"), "atencion"); return; }
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
    toast(tx("Una compra necesita su importe: ponle cuánto costó"), "atencion");
    document.getElementById("p-cost").focus();
    return;
  }
  /* Los topes del plan, y solo al CREAR. Editar uno que ya existe no se toca
     nunca —«congelar, nunca quitar»—: quien se pasó del tope antes de que el
     plan cambiara sigue pudiendo corregirle el nombre a lo que tiene.

     Se mira antes de `aprenderAlGuardar`, que ya deja rastro en las
     habilidades: parar después habría enseñado una habilidad de un talento que
     no llegó a existir. */
  if (!editingPerkId) {
    /* La rama la escribe el usuario a mano en este formulario, así que aquí se
       puede crear una rama sin pasar por el botón de «Nueva rama». */
    if (!ramasDe("perks").includes(branch) && !cabeUnoMas("ramas", ramasDe("perks").length)) {
      topeAlcanzado("ramas");
      return;
    }
    if (!cabeUnoMas("talentos", talentosDeRama(branch).length)) {
      topeAlcanzado("talentos");
      return;
    }
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
    toast(T`${tx(TIPOS[pTipo].nombre)} "${name}" añadida al árbol`);
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

  document.getElementById("mission-form-title").textContent = m ? tx("Editar misión") : tx("Nueva misión");
  document.getElementById("ms-name").value = m ? m.name : "";
  document.getElementById("ms-desc").value = m ? (m.desc || "") : "";
  document.getElementById("ms-ancla").value = m ? (m.ancla || "") : "";
  pintarAnclas();
  document.getElementById("ms-target").value = m ? missionTarget(m) : 1;
  document.getElementById("ms-xp").value = m ? m.xp : 15;
  document.getElementById("ms-delete").style.display = m ? "block" : "none";
  msIcon = m ? m.icon : ICON_LIST[(state.missions.length * 6 + 14) % ICON_LIST.length];
  msColor = m ? m.color : COLORS[state.missions.length % COLORS.length];
  msCadence = m ? m.cadence : "daily";
  msDays = m && m.days && m.days.length ? [...m.days] : [1, 3, 5];

  document.getElementById("ms-skill").innerHTML =
    `<option value="">${tx("— Ninguna —")}</option>` +
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
  document.getElementById("ms-days").innerHTML = letrasDeSemana().map((d, i) =>
    `<button type="button" class="${msDays.includes(i) ? "on" : ""}" onclick="toggleDay(${i})">${d}</button>`
  ).join("");
}

function toggleDay(i) {
  msDays = msDays.includes(i) ? msDays.filter(d => d !== i) : [...msDays, i].sort();
  renderDayPick();
}

function saveMission() {
  const name = document.getElementById("ms-name").value.trim();
  if (!name) { toast(tx("Escribe qué vas a hacer")); return; }
  if (msCadence === "weekly" && msDays.length === 0) { toast(tx("Elige al menos un día")); return; }
  const desc = document.getElementById("ms-desc").value.trim();
  const ancla = document.getElementById("ms-ancla").value.trim();
  const target = Math.max(1, parseInt(document.getElementById("ms-target").value) || 1);
  const xp = Math.max(0, parseInt(document.getElementById("ms-xp").value) || 0);
  const skillId = document.getElementById("ms-skill").value || null;

  if (editingMissionId) {
    const m = state.missions.find(x => x.id === editingMissionId);
    Object.assign(m, { name, desc, target: msCadence === "once" ? 1 : target, xp, skillId, icon: msIcon, color: msColor, cadence: msCadence, days: msDays });
    /* Se borra la clave si se vacio el campo, en vez de guardar "". Una
       mision sin ancla no tiene que llevarla puesta. */
    if (ancla) m.ancla = ancla; else delete m.ancla;
    save();
    toast(tx("Misión actualizada"));
  } else {
    state.missions.push({
      id: uid(), name, desc, icon: msIcon, color: msColor,
      cadence: msCadence, days: msDays, target: msCadence === "once" ? 1 : target,
      skillId, xp, log: {}, archived: false, completedAt: null,
      createdAt: todayKey(),
      /* Solo si tiene algo: la mayoría de misiones no van a llevar ancla, y
         una clave vacía en cada una es peso muerto en cada sincronía. */
      ...(ancla ? { ancla } : {}),
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
  toast(tx("Misión eliminada"), "deshecho");
  showView("missions");
}

/* ================= Formulario de proyecto ================= */

let prIcon = ICON_LIST[16];
let prColor = COLORS[0];
let formSteps = [];
let prTipo = "tarea";

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
    `<option value="">${tx("— Ninguna —")}</option>` +
    state.skills.map(s => `<option value="${s.id}" ${pr && pr.skillId === s.id ? "selected" : ""}>${escapeHtml(s.name)}</option>`).join("");

  /* El tipo, y el panel entero, solo con la prueba de los nodos encendida:
     apagada no hay cuatro figuras, así que el tipo no significaría nada. Un
     encargo de antes es una tarea, que es exactamente lo que ya se dibujaba. */
  prTipo = tipoDeEncargo(pr);
  document.getElementById("panel-tipo-encargo").style.display = pruebaNodos() ? "block" : "none";
  renderTipoEncargo();

  renderIconGrid("pr-icon", prIcon, "pickProjectIcon", prColor);
  renderColorGrid("pr-color", prColor, "pickProjectColor");
  renderFormSteps();
  sugActual.pr = null;
  refrescarSugerencias("pr");
  showView("project-form");
}

function pickTipoEncargo(t) {
  if (!TIPOS_ENCARGO[t]) return;
  prTipo = t;
  renderTipoEncargo();
}

function renderTipoEncargo() {
  const caja = document.getElementById("pr-tipo");
  if (!caja) return;
  caja.innerHTML = Object.keys(TIPOS_ENCARGO).map(k => `
    <button type="button" class="${k === prTipo ? "on" : ""}" onclick="pickTipoEncargo('${k}')">
      ${icon(TIPOS_ENCARGO[k].icono, 15)}<span>${tx(TIPOS_ENCARGO[k].nombre)}</span>
    </button>`).join("");
  document.getElementById("pr-tipo-sub").textContent = tx(TIPOS_ENCARGO[prTipo].sub);
}

function pickProjectIcon(n) { prIcon = n; renderIconGrid("pr-icon", n, "pickProjectIcon", prColor); }
function pickProjectColor(c) { prColor = c; renderColorGrid("pr-color", c, "pickProjectColor"); renderIconGrid("pr-icon", prIcon, "pickProjectIcon", c); }

function renderFormSteps() {
  document.getElementById("pr-steps").innerHTML = formSteps.length === 0
    ? `<p class="settings-note" style="margin:0 0 10px">${tx("Sin etapas todavía.")}</p>`
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
  if (!name) { toast(tx("Ponle un nombre al encargo"), "atencion"); return; }
  const branch = document.getElementById("pr-branch").value.trim() || "General";
  const desc = document.getElementById("pr-desc").value.trim();
  const skillId = document.getElementById("pr-skill").value || null;
  const xpReward = Math.max(0, parseInt(document.getElementById("pr-xp").value) || 0);
  /* Los topes, y solo al CREAR, por lo mismo que en el formulario de
     talentos: editar lo que ya existe no se toca nunca —«congelar, nunca
     quitar»—. Y antes de `aprenderAlGuardar`, que ya deja rastro en las
     habilidades: parar después enseñaría una habilidad de un encargo que no
     llegó a existir. */
  if (!editingProjectId) {
    /* La rama se escribe a mano en este formulario, así que por aquí se puede
       crear un proyecto sin pasar por el botón de «Nuevo proyecto». */
    if (!ramasDe("projects").includes(branch) && !cabeUnoMas("ramasProyectos", ramasDe("projects").length)) {
      topeAlcanzado("ramasProyectos");
      return;
    }
    if (!cabeUnoMas("encargos", encargosDeRama(branch).length)) {
      topeAlcanzado("encargos");
      return;
    }
  }

  aprenderAlGuardar("pr", name, skillId);

  if (editingProjectId) {
    const pr = state.projects.find(x => x.id === editingProjectId);
    // Conserva el estado de las etapas que ya existían
    const prev = {};
    pr.steps.forEach(s => prev[s.id] = s);
    Object.assign(pr, {
      name, branch, desc, skillId, xpReward, icon: prIcon, color: prColor, tipo: prTipo,
      steps: formSteps.map(s => prev[s.id] ? { ...s, done: prev[s.id].done, at: prev[s.id].at } : s)
    });
    save();
    toast("Encargo actualizado");
    if (currentProjectId === editingProjectId) { renderProjectDetail(); showView("project"); }
    else showView("projects");
  } else {
    state.projects.push({
      id: uid(), name, branch, desc, icon: prIcon, color: prColor, tipo: prTipo,
      status: "active", steps: formSteps, skillId, xpReward,
      /* Los campos del mapa, tambien aqui y no solo en la migracion de la
         carga: un encargo creado por este formulario vivia sin la etiqueta
         `mod` hasta la siguiente recarga, y sin ella el lienzo lo buscaba
         entre los talentos y no lo encontraba. */
      mod: "proyectos", requiere: [], modo: "todos", espera: false,
      createdAt: todayKey(), lastActivity: todayKey(), completedAt: null,
      history: [{ date: todayKey(), at: stamp(), event: `Encargo creado en el proyecto ${branch}` }]
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


/* ---- El ancla de una misión ----

   La conducta nueva se sostiene cuando se engancha a una que ya existe, en vez
   de depender de acordarse. Eso es lo que dice el trabajo de Fogg (2019) sobre
   diseño de conducta, y es la pieza que a Norata le faltaba: una misión ya dice
   QUÉ y QUÉ DÍAS, pero el momento lo ponía la fuerza de voluntad.

   Y con el matiz honesto, que también está en la literatura: Gardner y sus
   colegas (2024) avisan de que formar el hábito por sí solo puede no bastar —el
   contexto pesa tanto como la repetición—. Por eso esto no promete nada ni se
   presenta como una función mágica: es un campo opcional que ayuda a recordar.

   Cinco anclas que le pasan a casi todo el mundo. Un campo vacío que pide una
   frase es el mismo problema que tenía la pregunta 3 de la bienvenida: pide
   ESCRIBIR donde todo lo demás pide ELEGIR. Con esto se toca una y ya está.

   Son cosas que se hacen a diario y a la misma hora, que es lo que las hace
   servir de gancho — «cuando tenga tiempo» no es un ancla. */
/* La tabla se queda en español y se traduce al PINTAR, como todas: lo que se
   guarda al tocar una es el rótulo, y ese sí va en el idioma de quien escribe.
   Ver `pintarAnclas`. */
const ANCLAS_SUGERIDAS = [
  "servirme el café", "comer", "llegar a casa",
  "lavarme los dientes", "cerrar la computadora"
];

function pintarAnclas() {
  const caja = document.getElementById("ms-ancla-sug");
  if (!caja) return;
  caja.innerHTML = ANCLAS_SUGERIDAS.map(a =>
    `<button type="button" class="ancla-chip" onclick="ponerAncla('${enJS(a)}')">${
      escapeHtml(tx(a))}</button>`).join("");
}

/* Escribe la sugerencia en el campo. En español entra tal cual; en otro idioma
   entra ya traducida, porque lo que se guarda es lo que la persona va a leer
   luego en su tarjeta y no una clave del diccionario. */
function ponerAncla(t) {
  const campo = document.getElementById("ms-ancla");
  if (!campo) return;
  campo.value = tx(t);
  campo.focus();
}
