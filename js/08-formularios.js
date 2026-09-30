/* Ficha de talento y los cuatro formularios */
/* ================= Render: detalle talento ================= */

/* ================= La ficha de un nodo (0.7.145) =================
   Una sola ficha para lo que antes eran talentos y encargos. Eduardo la pidió
   rehecha porque «asustaba»: cuatro cajas de datos en fila, tres botones
   grandes de colores y ninguna pista de qué hacer. El orden ahora contesta
   las preguntas en el orden en que uno se las hace:

     1. ¿Qué es y en qué va?     el encabezado, con la figura de su tipo
     2. ¿Qué hago ahora?          UNA acción principal, y solo si hay algo
     3. Sus etapas, su lista y su conexión con otros módulos
     4. ¿De qué depende y qué abre?
     5. Los datos, en renglones; el historial, plegado

   Lo delicado —pausar, soltar, cambiar de tipo, rendirse, deshacer, borrar—
   vive en el ··· de arriba, lejos del pulgar. */

/* Volver regresa a DONDE ESTABAS: al Resumen, a una habilidad, o al nodo del
   que llegaste por un enlace. Antes volvía siempre al árbol. */
let fichaVengoDe = null;
let fichaPila = [];
function openPerk(id) {
  const activa = document.querySelector(".view.active");
  const desde = activa ? activa.id.replace("view-", "") : null;
  if (desde === "perk" && currentPerkId && currentPerkId !== id) fichaPila.push(currentPerkId);
  else if (desde !== "perk" && desde !== "perk-form") { fichaVengoDe = desde; fichaPila = []; }
  currentPerkId = id;
  renderPerkDetail();
  showView("perk");
  try { window.scrollTo(0, 0); } catch (e) {}
}
function volverDeFicha(sinPila) {
  if (!sinPila && fichaPila.length) {
    currentPerkId = fichaPila.pop();
    renderPerkDetail();
    showView("perk");
    return;
  }
  fichaPila = [];
  const v = fichaVengoDe && !["perk", "perk-form", "project", "projects", "project-form"].includes(fichaVengoDe) ? fichaVengoDe : "tree";
  showView(v);
}

/* Cómo se lee el avance de cada tipo, en palabras. */
function lecturaDeAvance(p) {
  const t = tipoDe(p);
  if (t === "acumular") return T`${cantidadNodo(p, totalAcumulado(p))} de ${cantidadNodo(p, p.objetivo || 0)}`;
  if (t === "meta" && p.puente && p.puente.mision) return T`${Math.min(cuentaDelPuente(p), p.veces || 0)} de ${p.veces || 0} veces`;
  const st = p.steps || [];
  return st.length === 1 ? T`${st.filter(x => x.done).length} de 1 etapa` : T`${st.filter(x => x.done).length} de ${st.length} etapas`;
}

function renderPerkDetail() {
  const p = state.perks.find(x => x.id === currentPerkId);
  if (!p) { showView("tree"); return; }
  if (typeof revisarPuentes === "function") revisarPuentes();
  const st = perkStatus(p);
  const t = metaDe(p);
  const tipo = tipoDe(p);
  const skill = p.skillId ? state.skills.find(s => s.id === p.skillId) : null;
  const reqs = requisitosVivos(p);
  const rama = p.branch || "General";
  const esP = esNodoEnProyecto(p);
  const salud = saludDeNodo(p);
  const prog = perkProgress(p);
  const pasos = p.steps || [];
  const conMision = !!(p.puente && p.puente.mision);
  const conHab = !!(p.puente && p.puente.habilidad);
  const pj = enJS(p.id);
  const nombreDe = x => escapeHtml(x.name);

  /* ---- 2. Lo que toca ahora ---- */
  const conBarra = (tipo === "meta" && (pasos.length || conMision)) || tipo === "acumular";
  const avance = (conBarra || salud) ? `
    <div class="fa-avance">
      ${/* La salud va ENCIMA de la barra, no al lado: habla de ella (Eduardo). */
        salud ? `<span class="fa-salud ${salud.key}">${escapeHtml(salud.label)} · ${salud.idle === 1 ? tx("1 día sin moverse") : T`${salud.idle} días sin moverse`}</span>` : ""}
      ${conBarra ? `<div class="fa-carril"><i class="${st === "completed" ? "hecho" : ""}" style="width:${prog}%"></i></div>
      <div class="fa-lee"><span>${lecturaDeAvance(p)}</span><span>${prog}%</span></div>` : ""}
    </div>` : "";

  let plazo = "";
  if ((st === "active" || st === "due" || st === "paused") && p.endDate) {
    if (p.congeladoEl) plazo = `<p class="fa-nota">${tx("El plazo está congelado: este nodo está guardado en una caja del ático.")}</p>`;
    else if (st === "paused") plazo = `<p class="fa-nota">${tx("En pausa, el plazo no corre: al retomarlo se corre la fecha límite.")}</p>`;
    else {
      const left = daysBetween(todayKey(), p.endDate);
      plazo = `<p class="fa-nota">${left < 0 ? T`El plazo venció el ${formatDate(p.endDate)}.`
        : left === 1 ? T`Queda 1 día (hasta el ${formatDate(p.endDate)}).`
        : T`Quedan ${left} días (hasta el ${formatDate(p.endDate)}).`}</p>`;
    }
  }

  const prim = (txt, onclick) => `<button class="btn btn-primary btn-block" onclick="${onclick}">${txt}</button>`;
  const suave = (txt, onclick) => `<button class="btn btn-soft btn-block" onclick="${onclick}">${txt}</button>`;
  const nota = txt => `<p class="fa-nota">${txt}</p>`;
  const sigEtapa = pasos.find(x => !x.done);
  const sumar = `<div class="fa-sumar">
      <input type="number" id="fa-sumar" min="0" step="any" inputmode="decimal" placeholder="${escapeAttr(tx("¿Cuánto sumas?"))}"
        onkeydown="if(event.key==='Enter'){event.preventDefault();sumarAcumulado('${pj}');}">
      <button class="btn btn-primary" onclick="sumarAcumulado('${pj}')">${tx("Sumar")}</button>
    </div>`;
  let accion = "";
  if (st === "locked") {
    accion = nota(reqs.length > 1 && modoDe(p) === "cualquiera"
      ? tx("Se abre en cuanto termines cualquiera de estos:") : tx("Se abre cuando termines:")) +
      `<div class="req-list">${reqs.map(r => `<button type="button" class="req-chip ${r.status === "completed" ? "hecho" : ""}" onclick="openPerk('${enJS(r.id)}')">
        ${r.status === "completed" ? icon("check", 13) : icon(r.icon || "star", 13)}<span>${nombreDe(r)}</span>
        <i>${escapeHtml(r.branch || "General")}</i></button>`).join("")}</div>`;
  } else if (st === "available" || st === "active") {
    if (tipo === "compra") {
      accion = p.cost > 0
        ? prim(T`Comprar · ${money(p.cost)}`, `investPerk('${pj}')`)
        : nota(tx("Una compra es una llave que se paga: ponle cuánto cuesta y podrás asegurarla.")) + suave(tx("Ponerle importe"), `openPerkForm('${pj}')`);
    } else if (tipo === "hito") {
      accion = conHab
        ? nota(T`Se logra solo cuando <b>${escapeHtml((state.skills.find(x => x.id === p.puente.habilidad) || {}).name || "")}</b> llegue al nivel ${p.puente.nivel}. Vas en el ${nivelDeHabilidad(p.puente.habilidad)}.`) +
          `<button class="btn btn-ghost btn-block" onclick="completeHito('${pj}')">${tx("Marcarlo a mano")}</button>`
        : prim(tx("Lo logré"), `completeHito('${pj}')`);
    } else if (tipo === "acumular") {
      accion = (conMision ? nota(T`Suma ${cantidadNodo(p, p.puente.porVez || 1)} cada vez que cumples <b>${escapeHtml((state.missions.find(x => x.id === p.puente.mision) || {}).name || "")}</b>. También puedes sumar a mano.`) : "") + sumar;
    } else if (st === "available" && p.cost > 0) {
      accion = prim(T`Comenzar · ${money(p.cost)}`, `investPerk('${pj}')`) +
        (p.planDays > 0 ? nota(T`Al comenzar corre un plazo de ${planLabel(p.planDays)}.`) : "");
    } else if (conMision) {
      accion = nota(T`Avanza sola cada vez que cumples <b>${escapeHtml((state.missions.find(x => x.id === p.puente.mision) || {}).name || "")}</b>. No hay nada que marcar aquí.`);
    } else if (sigEtapa) {
      accion = prim(T`Marcar: ${escapeHtml(sigEtapa.name)}`, `togglePerkStep('${pj}','${enJS(sigEtapa.id)}');renderTree()`);
    } else {
      accion = prim(tx("Lo logré"), st === "active" ? `completePerk('${pj}')` : `lograrNodo('${pj}')`);
    }
  } else if (st === "due") {
    accion = nota(tx("El plazo terminó. Sé honesto: ¿lo lograste?")) +
      prim(tx("Sí, lo logré"), `completePerk('${pj}')`) +
      `<button class="btn btn-ghost btn-block" onclick="failPerk('${pj}')">${tx("No lo logré")}</button>`;
  } else if (st === "completed") {
    accion = nota(esP ? T`Terminado el ${formatDate(p.completedAt)}.` : T`Tuyo desde el ${formatDate(p.completedAt)}. Nadie te lo quita.`);
  } else if (st === "paused") {
    accion = nota(tx("Lo pausaste tú. No cuenta como estancado ni te lo recuerda.")) + suave(tx("Retomar"), `retomarNodo('${pj}')`);
  } else if (st === "dropped") {
    accion = nota(tx("Lo soltaste. Soltar no es fallar: sigue aquí por si un día vuelves.")) + suave(tx("Retomarlo"), `retomarNodo('${pj}')`);
  } else if (st === "expired") {
    accion = nota(tx("El plazo venció sin lograrlo. Puedes volver a intentarlo.")) + suave(p.cost > 0 ? T`Reintentar · ${money(p.cost)}` : tx("Reintentar"), `retryPerk('${pj}')`);
  }
  const cajaAhora = `<div class="panel alt ficha-ahora"><h3>${tx("Lo que toca ahora")}</h3>${avance}${plazo}${accion}</div>`;

  /* ---- 3. Etapas (una meta que no avanza por su misión) ---- */
  const conEtapas = tipo === "meta" && !conMision && st !== "completed" && st !== "dropped";
  const cajaEtapas = !conEtapas && !(tipo === "meta" && !conMision && pasos.length) ? "" : `
    <div class="panel alt">
      <div class="panel-head"><h3 style="margin:0">${tx("Etapas")}</h3>${pasos.length ? `<span class="hint-hold">${pasos.filter(x => x.done).length} de ${pasos.length}</span>` : ""}</div>
      ${pasos.length ? `<div class="fa-checks">${pasos.map(x => `
        <div class="fa-check${x.done ? " hecho" : ""}">
          <button type="button" class="fa-caja" ${st === "locked" || !conEtapas ? "disabled" : `onclick="togglePerkStep('${pj}','${enJS(x.id)}');renderTree()"`}
            aria-pressed="${x.done}" aria-label="${escapeAttr((x.done ? tx("Desmarcar ") : tx("Marcar ")) + x.name)}">${x.done ? icon("check", 12) : ""}</button>
          <span class="fa-tx">${escapeHtml(x.name)}</span>
          ${conEtapas ? `<button type="button" class="fa-quitar" onclick="quitarEtapa('${pj}','${enJS(x.id)}')" aria-label="${escapeAttr(tx("Quitar la etapa ") + x.name)}">✕</button>` : ""}
        </div>`).join("")}</div>`
      : `<p class="fa-nota">${tx("Sin etapas, se cierra de una vez. Añade las que quieras y el avance se cuenta solo.")}</p>`}
      ${conEtapas ? `<div class="step-add" style="margin-top:10px">
        <input type="text" id="pk-new-step" placeholder="${escapeAttr(tx("Nueva etapa…"))}" maxlength="70"
          onkeydown="if(event.key==='Enter'){event.preventDefault();anadirEtapa('${pj}');}">
        <button class="btn btn-soft btn-sm" onclick="anadirEtapa('${pj}')">${tx("Añadir")}</button>
      </div>` : ""}
      ${st === "locked" && pasos.length ? `<p class="fa-nota" style="margin-top:10px">${tx("Las etapas se marcan cuando se abra.")}</p>` : ""}
    </div>`;

  /* ---- 3b. La lista voluntaria ---- */
  const lista = p.lista;
  const cajaLista = lista ? `
    <div class="panel alt">
      <div class="panel-head"><h3 style="margin:0">${tx("Lista")}</h3><span class="hint-hold">${tx("no cuenta para el avance")}</span></div>
      ${lista.length ? `<div class="fa-checks">${lista.map(x => `
        <div class="fa-check${x.done ? " hecho" : ""}">
          <button type="button" class="fa-caja" onclick="marcarEnLista('${pj}','${enJS(x.id)}')" aria-pressed="${x.done}"
            aria-label="${escapeAttr((x.done ? tx("Desmarcar ") : tx("Marcar ")) + x.name)}">${x.done ? icon("check", 12) : ""}</button>
          <span class="fa-tx">${escapeHtml(x.name)}</span>
          <button type="button" class="fa-quitar" onclick="quitarDeLista('${pj}','${enJS(x.id)}')" aria-label="${escapeAttr(tx("Quitar ") + x.name)}">✕</button>
        </div>`).join("")}</div>` : ""}
      <div class="step-add" style="margin-top:10px">
        <input type="text" id="fa-lista-nueva" placeholder="${escapeAttr(tx("Algo más…"))}" maxlength="80"
          onkeydown="if(event.key==='Enter'){event.preventDefault();anadirALista('${pj}');}">
        <button class="btn btn-soft btn-sm" onclick="anadirALista('${pj}')">${tx("Añadir")}</button>
      </div>
      <button type="button" class="fa-enlace" onclick="quitarLista('${pj}')">${tx("Quitar la lista")}</button>
    </div>` : `
    <button type="button" class="fa-opcional" onclick="empezarLista('${pj}')">
      <b>＋ ${tx("Añadir una lista")}</b><span>${tx("Para apuntar lo que quieras. Es opcional y no cuenta para el avance.")}</span>
    </button>`;

  /* ---- 3c. El puente con otros módulos ---- */
  const puedePuente = tipo !== "compra" && st !== "completed";
  let cajaPuente = "";
  if (p.puente) {
    const m = conMision ? state.missions.find(x => x.id === p.puente.mision) : null;
    const h = conHab ? state.skills.find(x => x.id === p.puente.habilidad) : null;
    cajaPuente = `<div class="panel alt"><h3>${tx("Se conecta con")}</h3>
      <p class="fa-nota">${m ? (tipo === "meta" ? T`La misión <b>${escapeHtml(m.name)}</b>: cada vez que la cumples avanza uno, hasta ${p.veces} veces.` : T`La misión <b>${escapeHtml(m.name)}</b>: cada vez que la cumples suma ${cantidadNodo(p, p.puente.porVez || 1)}.`)
        : h ? T`La habilidad <b>${escapeHtml(h.name)}</b>: se logra al llegar al nivel ${p.puente.nivel}.` : tx("Lo que tenía conectado ya no existe.")}</p>
      <button type="button" class="fa-enlace" onclick="quitarPuente('${pj}')">${tx("Quitar la conexión")}</button></div>`;
  } else if (puedePuente) {
    cajaPuente = `<button type="button" class="fa-opcional" onclick="abrirConectar('${pj}')">
      <b>＋ ${tx("Conectar con Misiones o Habilidades")}</b><span>${tx("Opcional: que avance solo con lo que ya haces.")}</span>
    </button>`;
  }

  /* ---- 4. Conexiones del árbol ---- */
  const abre = state.perks.filter(y => requisitosDe(y).includes(p.id));
  const enlace = (x, quitar) => `<div class="fa-enl">
      <button type="button" class="fa-enl-b" onclick="openPerk('${enJS(x.id)}')">${typeof figuraMini === "function" ? figuraMini(x, 20) : ""}
        <span>${nombreDe(x)}</span><small>${(x.branch || "General") !== rama ? escapeHtml(x.branch || "General") + " ↗" : tx(STATUS_LABEL[perkStatus(x)])}</small></button>
      ${quitar ? `<button type="button" class="fa-quitar" onclick="quitarRequisito('${pj}','${enJS(x.id)}')" aria-label="${escapeAttr(tx("Quitar esta conexión"))}">✕</button>` : ""}
    </div>`;
  const posibles = state.perks.filter(x => x.id !== p.id && !requisitosDe(p).includes(x.id) && !isDescendant(p.id, x.id))
    .sort((a, b) => ((a.branch || "General") === rama ? 0 : 1) - ((b.branch || "General") === rama ? 0 : 1));
  const modo = modoDe(p);
  const cajaConex = `<div class="panel alt">
    <h3>${tx("Conexiones")}</h3>
    <div class="fa-grupo"><div class="fa-sub">${tx("Necesita")}${reqs.length > 1 ? `
      <span class="seg fa-modo">${[["todos", tx("Todos")], ["cualquiera", tx("Cualquiera")]].map(([k, l]) =>
        `<button type="button" class="${modo === k ? "on" : ""}" onclick="ponerModoTalento('${pj}','${k}')">${l}</button>`).join("")}</span>` : ""}</div>
      ${reqs.map(x => enlace(x, true)).join("") || `<p class="fa-nota">${tx("Nada: está abierto desde el principio.")}</p>`}
      ${posibles.length ? `<select class="fa-anadir" aria-label="${escapeAttr(tx("Añadir algo que necesita"))}" onchange="if(this.value)anadirRequisito('${pj}',this.value)">
        <option value="">＋ ${tx("Añadir lo que necesita…")}</option>
        ${posibles.map(x => `<option value="${escapeAttr(x.id)}">${escapeHtml(x.name)}${(x.branch || "General") !== rama ? " · " + escapeHtml(x.branch || "General") : ""}</option>`).join("")}
      </select>` : ""}
    </div>
    <div class="fa-grupo"><div class="fa-sub">${tx("Abre")}</div>
      ${abre.map(x => enlace(x, false)).join("") || `<p class="fa-nota">${tx("Todavía no abre nada.")}</p>`}
      <button type="button" class="btn btn-soft btn-sm" style="align-self:flex-start" onclick="openPerkForm(null, '${enJS(rama)}', '${pj}')">＋ ${tx("Lo siguiente")}</button>
    </div>
  </div>`;

  /* ---- 5. Datos y historial ---- */
  const datos = [
    [tx("Tipo"), `${tx(t.nombre)}`],
    tipo === "acumular" ? [tx("Objetivo"), cantidadNodo(p, p.objetivo || 0)] : null,
    p.cost > 0 || tipo === "compra" ? [tx("Cuesta"), p.cost > 0 ? money(p.cost) : "—"] : null,
    (p.investedTotal || 0) > 0 ? [tx("Invertido"), money(p.investedTotal)] : null,
    tipo === "meta" ? [tx("Plazo"), p.planDays > 0 ? planLabel(p.planDays) : tx("Sin plazo")] : null,
    [tx("Recompensa"), skill ? `+${p.xpReward} XP · <button type="button" class="fa-enlace" onclick="openDetail('${skill.id}')">${escapeHtml(skill.name)} →</button>` : `+${p.xpReward || 0} XP`],
    p.createdAt ? [tx("Creado"), formatDate(p.createdAt)] : null
  ].filter(Boolean);
  const cajaDatos = `<div class="panel alt"><h3>${tx("Datos")}</h3><dl class="fa-datos">${datos.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl></div>`;
  const hist = p.history || [];
  const cajaHist = `<details class="panel fa-hist"><summary>${tx("Historial")} · ${hist.length}</summary>${hist.length
    ? hist.slice(0, 30).map(e => `<div class="history-item"><div class="note">${escapeHtml(e.event)}<span class="when">${formatWhen(e)}</span></div></div>`).join("")
    : `<p class="fa-nota">${tx("Sin movimientos todavía.")}</p>`}</details>`;

  /* ---- El ··· de arriba ---- */
  const conPlan = (st === "active" || st === "due") && p.endDate && tipo === "meta";
  const menu = branchMenu("p:" + p.id, [
    { title: tx("Editar"), hint: tx("Nombre, icono, color, plazo y recompensa"), icon: "lapiz", onclick: `openPerkForm('${pj}')` },
    ...(st === "completed" ? [] : [{ title: tx("Cambiar de tipo"), hint: tx("Antes te dice qué se conserva y qué no"), icon: "reordenar", onclick: `abrirCambioTipo('${pj}')` }]),
    ...(st === "completed" || st === "dropped" ? [] : st === "paused"
      ? [{ title: tx("Retomar"), hint: tx("Vuelve a donde lo dejaste"), icon: "flecha", onclick: `retomarNodo('${pj}')` }]
      : [{ title: tx("Pausar por ahora"), hint: tx("No cuenta como estancado; el plazo se congela"), icon: "caja", onclick: `pausarNodo('${pj}')` }]),
    ...(st === "completed" ? [] : st === "dropped"
      ? [{ title: tx("Retomarlo"), hint: tx("Vuelve al camino"), icon: "flecha", onclick: `retomarNodo('${pj}')` }]
      : [{ title: tx("Soltar"), hint: tx("Se queda en tu historial, sin fallar"), icon: "flecha", onclick: `soltarNodo('${pj}')` }]),
    ...(conPlan ? [{ title: tx("Me rindo"), hint: tx("Lo pierdes; puedes reintentarlo después"), icon: "bote", danger: true, onclick: `failPerk('${pj}')` }] : []),
    ...(st === "completed" ? [{ title: tx("Deshacer: no llegó a pasar"), hint: tx("Devuelve también el XP y el dinero"), icon: "reordenar", onclick: `revertirTalento('${pj}')` }] : []),
    { title: tx("Borrar"), hint: tx("Se puede deshacer justo después"), icon: "bote", danger: true, onclick: `borrarNodo('${pj}')` }
  ]);
  const menuEl = document.getElementById("perk-menu");
  if (menuEl) menuEl.innerHTML = menu;

  document.getElementById("perk-content").innerHTML = `
    <div class="detail-hero perk-hero h-${st}">
      <div class="strip">${motifScene(560, 156, hashSeed(p.id), motifFor(p.icon), trazo(p.color))}</div>
      <button type="button" class="skill-emoji editable fig-${tipo}" style="--velo-forma:${velo(p.color, "4a")};color:${tinta(p.color)}"
        onclick="openPerkForm(currentPerkId)" title="${escapeAttr(tx("Editar"))}" aria-label="${escapeAttr(tx("Editar"))}">
        ${icon(p.icon, 26)}
        <span class="edit-hint">${icon("pen", 11)}</span>
      </button>
      <span class="state-big">${tx(STATUS_LABEL[st])}</span>
      <h2>${escapeHtml(p.name)}</h2>
      <button type="button" class="branch-lbl fa-rama" onclick="showView('tree')">${tx(t.nombre)} · ${esP ? tx("proyecto") : tx("rama")} ${escapeHtml(rama)}</button>
      ${p.desc ? `<div class="desc">${escapeHtml(p.desc)}</div>` : ""}
    </div>
    ${cajaAhora}
    ${cajaEtapas}
    ${cajaPuente}
    ${cajaLista}
    ${cajaConex}
    ${cajaDatos}
    ${cajaHist}`;
}

/* ---- Ventana: conectar con Misiones o Habilidades ---- */
function abrirConectar(id) {
  const p = state.perks.find(x => x.id === id);
  if (!p) return;
  const tipo = tipoDe(p);
  const misiones = (state.missions || []).filter(m => !m.archived);
  const habs = state.skills || [];
  let cuerpo;
  if (tipo === "hito") {
    cuerpo = habs.length ? `<p class="fa-nota">${tx("Se logra solo al llegar a ese nivel. Puedes seguir marcándolo a mano.")}</p>
      <label class="field"><span>${tx("Habilidad")}</span><select id="cx-hab">${habs.map(h => `<option value="${escapeAttr(h.id)}">${escapeHtml(h.name)} · ${T`nivel ${levelInfo(h.xp || 0).level}`}</option>`).join("")}</select></label>
      <label class="field"><span>${tx("Nivel")}</span><input type="number" id="cx-nivel" min="1" max="100" value="${Math.max(2, (habs[0] ? levelInfo(habs[0].xp || 0).level : 0) + 1)}"></label>`
      : `<p class="fa-nota">${tx("Todavía no tienes habilidades a las que conectarlo.")}</p>`;
  } else {
    cuerpo = misiones.length ? `<p class="fa-nota">${tipo === "meta"
        ? ((p.steps || []).length ? tx("Cada vez que cumplas la misión avanza uno. Sus etapas pasan a su lista.") : tx("Cada vez que cumplas la misión avanza uno."))
        : tx("Cada vez que cumplas la misión suma esa cantidad. También puedes sumar a mano.")}</p>
      <label class="field"><span>${tx("Misión")}</span><select id="cx-mision">${misiones.map(m => `<option value="${escapeAttr(m.id)}">${escapeHtml(m.name)}</option>`).join("")}</select></label>
      <label class="field"><span>${tipo === "meta" ? tx("Cuántas veces") : tx("Cuánto suma cada vez")}</span><input type="number" id="cx-n" min="1" step="any" value="${tipo === "meta" ? 12 : 1}"></label>`
      : `<p class="fa-nota">${tx("Todavía no tienes misiones a las que conectarlo.")}</p>`;
  }
  const hay = tipo === "hito" ? habs.length : misiones.length;
  document.getElementById("hoja-crear-body").innerHTML = `
    <h3 class="modal-titulo" style="color:var(--text)">${tipo === "hito" ? tx("Conectar con una habilidad") : tx("Conectar con una misión")}</h3>
    <p class="fa-nota" style="margin:4px 0 14px">${escapeHtml(p.name)}</p>
    ${cuerpo}
    <div class="modal-actions" style="margin-top:14px">
      <button type="button" class="btn btn-ghost" onclick="cerrarHojaCrear()">${tx("Cancelar")}</button>
      ${hay ? `<button type="button" class="btn btn-primary" onclick="guardarPuente('${enJS(id)}')">${tx("Conectar")}</button>`
        : `<button type="button" class="btn btn-primary" onclick="cerrarHojaCrear();${tipo === "hito" ? "openSkillForm()" : "openMissionForm()"}">${tipo === "hito" ? tx("Crear una habilidad") : tx("Crear una misión")}</button>`}
    </div>`;
  document.getElementById("hoja-crear").classList.add("show");
  revisarFondoQuieto();
}
function guardarPuente(id) {
  const p = state.perks.find(x => x.id === id);
  if (!p) return;
  const tipo = tipoDe(p);
  const v = k => (document.getElementById(k) || {}).value;
  if (tipo === "hito") {
    p.puente = { habilidad: v("cx-hab"), nivel: Math.max(1, parseInt(v("cx-nivel")) || 2) };
  } else if (tipo === "meta") {
    p.puente = { mision: v("cx-mision"), desde: todayKey() };
    p.veces = Math.max(1, parseInt(v("cx-n")) || 12);
    /* Sus etapas no se tiran: pasan a la lista, que no cuenta para el avance */
    if ((p.steps || []).length) {
      p.lista = [...(p.lista || []), ...p.steps.map(x => ({ id: x.id, name: x.name, done: x.done }))];
      p.steps = [];
    }
  } else {
    p.puente = { mision: v("cx-mision"), desde: todayKey(), porVez: Math.max(0.01, parseFloat(v("cx-n")) || 1) };
  }
  p.history = p.history || [];
  p.history.unshift({ date: todayKey(), at: stamp(), event: tx("Conectado con otro módulo") });
  cerrarHojaCrear();
  save();
  revisarPuentes();
  renderPerkDetail();
  renderTree();
  toast(tx("Conectado: ahora avanza solo"), "hecho");
}
function quitarPuente(id) {
  const p = state.perks.find(x => x.id === id);
  if (!p || !p.puente) return;
  /* Lo que ya sumó por su misión se queda como suma a mano: quitar la conexión
     no puede borrar avance que sí pasó. */
  if (tipoDe(p) === "acumular") p.llevas = totalAcumulado(p);
  delete p.puente; delete p.veces;
  p.history = p.history || [];
  p.history.unshift({ date: todayKey(), at: stamp(), event: tx("Conexión quitada") });
  save(); renderPerkDetail(); renderTree();
}

/* ---- Ventana: cambiar de tipo, diciendo antes qué pasa ---- */
let cambioTipoA = null;
function efectosCambioTipo(p, a) {
  const q = [];
  const de = tipoDe(p);
  if (de === a) return q;
  const et = p.steps || [];
  if (de === "meta" && et.length) q.push(["ok", et.length === 1 ? tx("Su etapa pasa a su lista: no se pierde, pero deja de contar para el avance.") : T`Sus ${et.length} etapas pasan a su lista: no se pierden, pero dejan de contar para el avance.`]);
  if (p.puente && (a === "compra" || (p.puente.habilidad && a !== "hito") || (p.puente.mision && !["meta", "acumular"].includes(a))))
    q.push(["pierde", tx("Se quita su conexión con otro módulo.")]);
  if (de === "meta" && p.puente && p.puente.mision && a === "acumular") q.push(["pierde", tx("La cuenta de veces vuelve a empezar.")]);
  if (de === "compra" && p.cost > 0 && a !== "compra") q.push(["pierde", T`Se pierde el importe (${money(p.cost)}). Queda escrito en el historial.`]);
  if (de === "acumular" && totalAcumulado(p) > 0) q.push(["pierde", T`Se pierde lo acumulado (${lecturaDeAvance(p)}). Queda escrito en el historial.`]);
  if (p.status === "active") q.push(["pierde", tx("Lo que llevaba en curso vuelve a empezar.")]);
  if (a === "compra") q.push(["ok", tx("Después te pedirá cuánto cuesta.")]);
  if (a === "acumular") q.push(["ok", tx("Después te pedirá hasta dónde quieres llegar.")]);
  q.push(["ok", tx("Se conservan el nombre, la rama, sus conexiones, su lista y el historial.")]);
  return q;
}
function abrirCambioTipo(id, a) {
  const p = state.perks.find(x => x.id === id);
  if (!p) return;
  cambioTipoA = a || null;
  const de = tipoDe(p);
  const ef = cambioTipoA ? efectosCambioTipo(p, cambioTipoA) : [];
  const pierde = ef.some(x => x[0] === "pierde");
  document.getElementById("hoja-crear-body").innerHTML = `
    <h3 class="modal-titulo" style="color:var(--text)">${tx("Cambiar de tipo")}</h3>
    <p class="fa-nota" style="margin:4px 0 14px">${T`«${escapeHtml(p.name)}» es ${tx(TIPOS[de].nombre).toLowerCase()}. ¿Qué quieres que sea?`}</p>
    <div class="seg tipo-seg">${Object.keys(TIPOS).map(k => `<button type="button" class="${k === cambioTipoA ? "on" : ""}" ${k === de ? "disabled" : `onclick="abrirCambioTipo('${enJS(id)}','${k}')"`}>
      ${icon(TIPOS[k].icono, 15)}<span>${tx(TIPOS[k].nombre)}</span></button>`).join("")}</div>
    ${ef.length ? `<div class="fa-efectos">${ef.map(([k, t]) => `<div class="fa-ef ${k}"><span>${k === "ok" ? "✓" : "!"}</span>${escapeHtml(t)}</div>`).join("")}</div>` : ""}
    <div class="modal-actions" style="margin-top:16px">
      <button type="button" class="btn btn-ghost" onclick="cerrarHojaCrear()">${tx("Cancelar")}</button>
      <button type="button" class="btn ${pierde ? "btn-danger-ghost" : "btn-primary"}" ${cambioTipoA ? `onclick="aplicarCambioTipo('${enJS(id)}')"` : "disabled"}>${cambioTipoA
        ? (pierde ? T`Cambiar a ${tx(TIPOS[cambioTipoA].nombre).toLowerCase()} de todos modos` : T`Cambiar a ${tx(TIPOS[cambioTipoA].nombre).toLowerCase()}`)
        : tx("Elige un tipo")}</button>
    </div>`;
  document.getElementById("hoja-crear").classList.add("show");
  revisarFondoQuieto();
}
function aplicarCambioTipo(id) {
  const p = state.perks.find(x => x.id === id);
  const a = cambioTipoA;
  if (!p || !a || !TIPOS[a]) return;
  const de = tipoDe(p);
  let rastro = T`Cambió de ${tx(TIPOS[de].nombre).toLowerCase()} a ${tx(TIPOS[a].nombre).toLowerCase()}`;
  if (de === "compra" && p.cost > 0) rastro += T` (costaba ${money(p.cost)})`;
  if (de === "acumular" && totalAcumulado(p) > 0) rastro += T` (llevaba ${lecturaDeAvance(p)})`;
  if (de === "meta" && (p.steps || []).length) {
    p.lista = [...(p.lista || []), ...p.steps.map(x => ({ id: x.id, name: x.name, done: x.done }))];
  }
  p.steps = [];
  if (p.puente && (a === "compra" || (p.puente.habilidad && a !== "hito") || (p.puente.mision && !["meta", "acumular"].includes(a)))) delete p.puente;
  if (de === "meta" && a === "acumular" && p.puente) p.puente.desde = todayKey();
  delete p.veces; delete p.llevas; delete p.objetivo; delete p.unidad;
  if (de === "compra") p.cost = 0;
  if (p.status === "active") { p.status = null; p.startDate = null; p.endDate = null; }
  p.tipo = a;
  if (a === "acumular") { p.objetivo = 1000; p.unidad = "dinero"; p.llevas = 0; }
  p.history = p.history || [];
  p.history.unshift({ date: todayKey(), at: stamp(), event: rastro });
  cerrarHojaCrear();
  save();
  renderPerkDetail();
  renderTree();
  toast(T`Ahora es ${tx(TIPOS[a].nombre).toLowerCase()}`, "hecho");
  // Lo que necesita un dato para funcionar abre su formulario
  if (a === "compra" || a === "acumular") openPerkForm(id);
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
  fIcon = s ? s.icon : iconoDeEstreno(state.skills.length, 1, 0);
  fColor = s ? s.color : COLORS[state.skills.length % COLORS.length];

  const cats = [...new Set(state.skills.map(x => x.category).filter(Boolean))];
  document.getElementById("cat-list").innerHTML = cats.map(c => `<option value="${escapeAttr(c)}">`).join("");

  renderIconGrid("f-icon", fIcon, "pickSkillIcon", fColor, true);
  renderColorGrid("f-color", fColor, "pickColor");
  togglePermFields();
  showView("form");
}

/* La rejilla de iconos muestra el icono elegido ya con el color elegido:
   así ves en vivo cómo va a quedar.

   Y llega PLEGADA a dos filas (0.7.109). Con treinta y nueve iconos abiertos
   de golpe, la rejilla mide media pantalla y empuja el color, el nombre y el
   botón de guardar fuera de la vista: el formulario se volvía un catálogo de
   dibujos con un campo de nombre arriba. Plegada se ve una muestra, y quien
   quiera otro icono lo pide.

   Lo que está abierto se recuerda por rejilla (`REJILLAS`) y no en una
   variable suelta: las cuatro —habilidad, talento, misión y proyecto— viven a
   la vez en el HTML, y elegir un color vuelve a dibujar la suya. Sin esa
   memoria, tocar un color la cerraría en la cara de quien acaba de abrirla. */
const REJILLAS = {};
/* Dos filas de las seis columnas del teléfono. En escritorio son diez por
   fila, así que se ven veinte y sobra: lo que no puede pasar es lo contrario,
   que el candidato quede cortado en el móvil, que es donde se usa. */
const ICONOS_A_LA_VISTA = 12;

/* El icono que estrena una ficha nueva sale SIEMPRE de esas dos primeras
   filas, y no del catálogo entero. Si le tocara uno del final, la rejilla se
   abriría de par en par para enseñárselo —esa es la regla de arriba— y el
   formulario de una misión nueva llegaría con media pantalla de dibujos, que
   es justo lo que se vino a quitar.

   El paso de cada lista es primo con doce para que la vuelta pase por los
   doce y no rebote entre dos: con el paso 6 que tenían las misiones, la
   primera y la tercera nacían con el mismo icono. */
function iconoDeEstreno(n, paso, salida) {
  return ICON_LIST[(n * paso + salida) % ICONOS_A_LA_VISTA];
}

function renderIconGrid(elId, selected, pickFn, color, reiniciar) {
  const el = document.getElementById(elId);
  if (!el) return;
  if (color) el.style.setProperty("--sel", pinta(color));
  el.style.setProperty("--sel-l", trazo(color));
  const previo = REJILLAS[elId];
  /* Al abrir el formulario se pliega, salvo que el icono que ya tiene esta
     habilidad viva más abajo de la segunda fila: abrirle su propia elección
     escondida es enseñarle una rejilla donde nada está marcado. */
  const abierta = (reiniciar || !previo)
    ? ICON_LIST.indexOf(selected) >= ICONOS_A_LA_VISTA
    : previo.abierta;
  REJILLAS[elId] = { selected, pickFn, color, abierta };
  el.innerHTML =
    `<div class="icon-grid${abierta ? "" : " plegada"}">` +
    ICON_LIST.map(n =>
      `<button type="button" class="${n === selected ? "selected" : ""}" onclick="${pickFn}('${n}')" aria-label="${n}">${icon(n, 20)}</button>`
    ).join("") +
    `</div>` +
    `<button type="button" class="mas-iconos" aria-expanded="${abierta}" onclick="alternarIconos('${elId}')">` +
      `${tx(abierta ? "Ver menos" : "Ver más iconos")}` +
      `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5"/></svg>` +
    `</button>`;
}
/* Sin `reiniciar`: el estado abierto/plegado se queda como estaba, que es lo
   que la rejilla acaba de guardar al dibujarse. */
function alternarIconos(elId) {
  const r = REJILLAS[elId];
  if (!r) return;
  r.abierta = !r.abierta;
  renderIconGrid(elId, r.selected, r.pickFn, r.color);
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

/* ================= Salir de un formulario GUARDA =================
   Lo pidió Eduardo el 8 sep 2026: «cuando te sales de estar editando algún
   elemento sin el botón guardar cambios necesito que sí los guardes, como el
   botón está hasta abajo siento que se olvida».

   El diagnóstico detrás, que es lo que hace que esto no sea un capricho: la
   flecha de arriba a la izquierda dice **«volver»**, no «cancelar». Nadie lee
   «volver» como «tira lo que escribiste». Así que la app prometía una cosa y
   hacía otra, y el precio lo pagaba siempre el mismo: quien editó, bajó, no
   vio el botón y se salió.

   ---- Las tres salidas, y por qué son tres y no una ----

     · **Sin nombre** → se sale sin guardar. No hay nada que perder: un
       formulario sin nombre no es un cambio, es un formulario en blanco.
     · **Con nombre y guarda bien** → guardado, y la propia función de guardar
       se encarga de mover de pantalla (por eso aquí no se navega después).
     · **Con nombre y NO puede guardar** —falta elegir un día en una misión
       semanal, o el plan no deja crear una más— se separa en dos:
       editando algo que YA existe se queda en el formulario, porque hay
       cambios de verdad que proteger y el aviso dice qué arreglar; creando
       algo nuevo se sale, porque no existía nada y quedarse encerrado en un
       formulario que no se puede guardar sería peor que no crearlo.

   Cómo se sabe si guardó: se mira si la pantalla del formulario sigue siendo
   la activa. Las cuatro funciones de guardar navegan al terminar bien, así que
   seguir aquí ES el fallo. Se hace así, y no devolviendo `true`, para no tener
   que tocar los cuatro `return` sueltos que ya tiene cada una — un `return`
   olvidado se vería como «a veces no guarda», que es el peor fallo posible
   justo aquí. */
function salirGuardando(vistaForm, campoNombre, guardar, editando, destino) {
  const campo = document.getElementById(campoNombre);
  if (!campo || !campo.value.trim()) { showView(destino); return; }
  guardar();
  const sigueAqui = document.getElementById(vistaForm).classList.contains("active");
  if (sigueAqui && !editando) showView(destino);
}

function cancelForm() {
  salirGuardando("view-form", "f-name", saveSkill, !!editingSkillId,
    editingSkillId && currentSkillId === editingSkillId ? "detail" : "home");
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

function openPerkForm(id, presetBranch, presetReq) {
  editingPerkId = id || null;
  const p = id ? state.perks.find(x => x.id === id) : null;

  document.getElementById("perk-form-title").textContent = p ? tx("Editar nodo") : tx("Nuevo nodo");
  document.getElementById("p-name").value = p ? p.name : "";
  document.getElementById("p-branch").value = p ? (p.branch || "") : (presetBranch || "");
  document.getElementById("p-desc").value = p ? (p.desc || "") : "";
  document.getElementById("p-cost").value = p ? p.cost : 0;
  document.getElementById("p-xp").value = p ? p.xpReward : 600;
  document.getElementById("p-delete").style.display = p ? "block" : "none";
  pIcon = p ? (p.icon || "star") : iconoDeEstreno(state.perks.length, 5, 3);
  pColor = p ? (p.color || COLORS[2]) : COLORS[(state.perks.length * 3 + 2) % COLORS.length];
  pTipo = p ? tipoDe(p) : "meta";
  /* El plazo, opcional desde la 0.7.145: una rama de proyecto nace sin plazo
     y una de talento con el año de siempre. Se elige con un toque. */
  const ramaIni = p ? (p.branch || "General") : (presetBranch || "");
  pPlazo = p ? (p.planDays || 0) : (ramaIni && esRamaDeProyecto(ramaIni) ? 0 : 360);
  pPlazoOtro = !PLAZOS.some(([d]) => d === pPlazo);
  if (pPlazoOtro) {
    const enMeses = pPlazo % 30 === 0;
    document.getElementById("p-plan-n").value = enMeses ? pPlazo / 30 : pPlazo;
    document.getElementById("p-plan-u").value = enMeses ? "m" : "d";
  }
  document.getElementById("p-objetivo").value = p && p.objetivo ? p.objetivo : 1000;
  document.getElementById("p-unidad").value = p && UNIDADES.includes(p.unidad) ? p.unidad : "dinero";
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

  /* Todas las ramas, también las vacías: antes salían de los nodos y una rama
     recién creada no aparecía como sugerencia. */
  const branches = ramasDe("perks");
  document.getElementById("branch-list").innerHTML = branches.map(b => `<option value="${escapeAttr(b)}">`).join("");

  document.getElementById("p-skill").innerHTML =
    `<option value="">${tx("— Ninguna —")}</option>` +
    state.skills.map(s => `<option value="${s.id}" ${p && p.skillId === s.id ? "selected" : ""}>${escapeHtml(s.name)}</option>`).join("");

  const others = state.perks.filter(x => !p || x.id !== p.id);
  pReq = p ? requisitosDe(p).slice() : (presetReq ? [presetReq] : []);
  pModo = p ? modoDe(p) : "todos";
  renderPerkReqs();

  renderIconGrid("p-icon", pIcon, "pickPerkIcon", pColor, true);
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
let pPlazo = 360;
let pPlazoOtro = false;
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
    cont.innerHTML = `<p class="settings-note" style="margin:0">${tx("Todavía no hay otros nodos a los que encadenarlo.")}</p>`;
  } else {
    /* Por rama y con la suya primero (0.7.147.2): era una lista plana de
       todos los nodos de todas las ramas, y el requisito casi siempre está en
       la misma. Cada grupo lleva su rótulo para no leer la rama en cada ficha. */
    const aqui = (document.getElementById("p-branch").value || "").trim() || "General";
    const orden = ramasDe("perks");
    const pos = r => r === aqui ? -1 : (orden.indexOf(r) < 0 ? 999 : orden.indexOf(r));
    const grupos = {};
    otros.forEach(x => { const r = x.branch || "General"; (grupos[r] = grupos[r] || []).push(x); });
    cont.innerHTML = Object.keys(grupos).sort((r1, r2) => pos(r1) - pos(r2)).map(r =>
      `<div class="req-grupo">${escapeHtml(r)}${r === aqui ? ` · ${tx("esta rama")}` : ""}</div>` + grupos[r].map(x => {
      const on = pReq.includes(x.id);
      /* Elegir un descendiente cerraría un bucle. Se muestra apagado y sin
         poder marcarse, en vez de dejar intentarlo y rechazarlo después. */
      const bucle = !on && editingPerkId && isDescendant(editingPerkId, x.id);
      return `<button type="button" class="req-chip ${on ? "on" : ""} ${bucle ? "no" : ""}"
        ${bucle ? "disabled title=\"Crearía un bucle\"" : `onclick="togglePerkReq('${x.id}')"`}>
        ${icon(x.icon || "star", 13)}<span>${escapeHtml(x.name)}</span>
      </button>`;
    }).join("")).join("");
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
      : tx("Quedará cerrado (y conectado en el mapa) hasta completar ese nodo."));
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
  document.getElementById("campo-importe").style.display = (pTipo === "hito" || pTipo === "acumular") ? "none" : "block";
  document.getElementById("campo-acumular").style.display = pTipo === "acumular" ? "block" : "none";
  renderPlazo();
  /* La moneda sale del ajuste y no escrita a mano: el día que se pueda
     elegir USD, este rótulo tiene que cambiar con ella o estaría pidiendo
     pesos para guardar dólares. */
  const cod = monedaActual();
  document.getElementById("p-cost-lbl").textContent = t.pideImporte ? T`Cuánto costó (${cod})` : T`Costo (${cod}, opcional)`;
  document.getElementById("p-cost-hint").textContent = t.pideImporte
    ? tx("Obligatorio: una compra es una llave que se paga.")
    : tx("Si la meta te costó dinero, anótalo aquí.");
}

/* El plazo con un toque: sin plazo, uno de los de siempre, u «otro». */
const PLAZOS = [[0, "Sin plazo"], [30, "1 mes"], [90, "3 meses"], [180, "6 meses"], [360, "1 año"]];
function renderPlazo() {
  const cont = document.getElementById("p-plazo");
  if (!cont) return;
  cont.innerHTML = PLAZOS.map(([d, l]) => `<button type="button" class="${!pPlazoOtro && d === pPlazo ? "on" : ""}" onclick="pickPlazo(${d})">${tx(l)}</button>`).join("") +
    `<button type="button" class="${pPlazoOtro ? "on" : ""}" onclick="pickPlazo('otro')">${tx("Otro")}</button>`;
  document.getElementById("p-plazo-otro").style.display = pPlazoOtro ? "flex" : "none";
  document.getElementById("p-plazo-hint").textContent = pPlazo > 0
    ? tx("Al empezar corre el plazo. Cuando termina confirmas si lo lograste.")
    : tx("Sin plazo no vence nunca: avanza a tu ritmo.");
}
function pickPlazo(d) {
  pPlazoOtro = d === "otro";
  if (pPlazoOtro) leerPlazoOtro(); else pPlazo = d;
  renderPlazo();
  if (pPlazoOtro) document.getElementById("p-plan-n").focus();
}
function leerPlazoOtro() {
  if (!pPlazoOtro) return;
  const n = Math.max(1, parseInt(document.getElementById("p-plan-n").value) || 1);
  pPlazo = document.getElementById("p-plan-u").value === "m" ? n * 30 : n;
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
  if (!name) { toast(tx("Ponle un nombre"), "atencion"); return; }
  const t = TIPOS[pTipo];
  const branch = document.getElementById("p-branch").value.trim() || "General";
  const desc = document.getElementById("p-desc").value.trim();
  /* Un hito no admite importe: no se lee el campo aunque tuviera un valor
     de antes de cambiar de tipo. */
  const cost = pTipo === "hito" ? 0 : Math.max(0, parseFloat(document.getElementById("p-cost").value) || 0);
  leerPlazoOtro();
  const planDays = t.llevaPlan ? Math.max(0, pPlazo || 0) : 0;
  const objetivo = Math.max(1, parseFloat(document.getElementById("p-objetivo").value) || 1);
  const unidad = document.getElementById("p-unidad").value;
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
    if (pTipo === "acumular") { p.objetivo = objetivo; p.unidad = unidad; if (typeof p.llevas !== "number") p.llevas = 0; }
    /* Un plazo que se quita o se cambia con el plan en marcha se reescribe
       desde el día en que empezó. */
    if (p.status === "active" && p.startDate) p.endDate = planDays > 0 ? addDaysKey(p.startDate, planDays) : null;
    save();
    toast(tx("Guardado"));
    if (currentPerkId === editingPerkId) { renderPerkDetail(); showView("perk"); }
    else showView("tree");
  } else {
    const nuevo = {
      id: uid(), name, branch, desc, tipo: pTipo, cost, planDays, steps,
      skillId, xpReward, requiere, modo, icon: pIcon, color: pColor,
      status: null, startDate: null, endDate: null, completedAt: null,
      investedTotal: 0, progress: 0, createdAt: todayKey(),
      history: [{ date: todayKey(), at: stamp(), event: T`Creado en la rama ${branch}` }]
    };
    if (pTipo === "acumular") { nuevo.objetivo = objetivo; nuevo.unidad = unidad; nuevo.llevas = 0; }
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
    toast(T`«${name}» creado en ${branch}`);
    /* Si se creó como «lo siguiente» de otro nodo, se vuelve a esa ficha */
    if (pReq.length === 1 && currentPerkId === pReq[0] && fichaVengoDe) { renderPerkDetail(); showView("perk"); }
    else showView("tree");
  }
}

function cancelPerkForm() {
  salirGuardando("view-perk-form", "p-name", savePerk, !!editingPerkId,
    editingPerkId && currentPerkId === editingPerkId ? "perk" : "tree");
}

async function deletePerk() {
  const p = state.perks.find(x => x.id === editingPerkId);
  if (!p) return;
  if (!await ask(T`¿Borrar «${p.name}»? Lo que dependía de él se queda sin ese requisito.`, tx("Borrar"), true)) return;
  state.perks = state.perks.filter(x => x.id !== editingPerkId);
  for (const other of state.perks) {
    const r = requisitosDe(other);
    if (r.includes(editingPerkId)) other.requiere = r.filter(id => id !== editingPerkId);
  }
  currentPerkId = null;
  save();
  toast(tx("Borrado"), "deshecho");
  showView("tree");
}

/* ================= Formulario de misión ================= */

let msTablero = null;
let msIcon = ICON_LIST[2];
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
  msIcon = m ? m.icon : iconoDeEstreno(state.missions.length, 7, 2);
  msColor = m ? m.color : COLORS[state.missions.length % COLORS.length];
  msCadence = m ? m.cadence : "daily";
  msDays = m && m.days && m.days.length ? [...m.days] : [1, 3, 5];

  document.getElementById("ms-skill").innerHTML =
    `<option value="">${tx("— Ninguna —")}</option>` +
    state.skills.map(s => `<option value="${s.id}" ${m && m.skillId === s.id ? "selected" : ""}>${escapeHtml(s.name)}</option>`).join("");

  renderIconGrid("ms-icon", msIcon, "pickMissionIcon", msColor, true);
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

function cancelMissionForm() {
  salirGuardando("view-mission-form", "ms-name", saveMission, !!editingMissionId, "missions");
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

let prIcon = ICON_LIST[3];
let prColor = COLORS[0];
let formSteps = [];
let prTipo = "tarea";

/* Un encargo nuevo es un nodo de la rama (0.7.145): se abre el formulario de
   siempre con la rama puesta. */
function openProjectForm(id, presetBranch) { return openPerkForm(id, presetBranch); }
function openProjectFormViejo(id, presetBranch) {
  editingProjectId = id || null;
  const pr = id ? state.projects.find(x => x.id === id) : null;

  document.getElementById("project-form-title").textContent = pr ? "Editar encargo" : "Nuevo encargo";
  document.getElementById("pr-name").value = pr ? pr.name : "";
  document.getElementById("pr-branch").value = pr ? (pr.branch || "") : (presetBranch || "");
  document.getElementById("pr-desc").value = pr ? (pr.desc || "") : "";
  document.getElementById("pr-xp").value = pr ? pr.xpReward : 500;
  document.getElementById("pr-delete").style.display = pr ? "block" : "none";
  prIcon = pr ? pr.icon : iconoDeEstreno(state.projects.length, 5, 1);
  prColor = pr ? pr.color : COLORS[state.projects.length % COLORS.length];
  formSteps = pr ? pr.steps.map(s => ({ ...s })) : [];

  const branches = [...new Set(state.projects.map(x => x.branch).filter(Boolean))];
  document.getElementById("pr-branch-list").innerHTML = branches.map(b => `<option value="${escapeAttr(b)}">`).join("");

  document.getElementById("pr-skill").innerHTML =
    `<option value="">${tx("— Ninguna —")}</option>` +
    state.skills.map(s => `<option value="${s.id}" ${pr && pr.skillId === s.id ? "selected" : ""}>${escapeHtml(s.name)}</option>`).join("");

  /* Un encargo de antes es una tarea, que es exactamente lo que ya se
     dibujaba: por eso el panel no necesita migrar nada. */
  prTipo = tipoDeEncargo(pr);
  renderTipoEncargo();

  renderIconGrid("pr-icon", prIcon, "pickProjectIcon", prColor, true);
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
  salirGuardando("view-project-form", "pr-name", saveProject, !!editingProjectId,
    editingProjectId && currentProjectId === editingProjectId ? "project" : "projects");
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
