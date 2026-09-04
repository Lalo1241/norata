/* Modelo de talentos y el ático de cajas */
/* ================= Talentos: requisitos =================
   Antes un talento tenía como mucho UN requisito, en un campo `requiresId`.
   Varios hijos podían colgar del mismo padre, así que el árbol se abría en
   abanico — pero nada podía volver a juntarse. No existía forma de decir
   "esto necesita A y B", y por eso todas las ramas se sentían iguales por
   mucho que cambiara el tipo de sus nodos: el número de caminos hasta
   cualquier talento era siempre uno.

   Ahora es una lista con un modo, y de ahí salen dos figuras que antes no
   se podían dibujar:

     todos       el nodo que corona — hacen falta TODOS sus requisitos
     cualquiera  el camino alternativo — basta con UNO de ellos

   El modo solo significa algo con dos o más requisitos; con uno, las dos
   lecturas coinciden. */

function requisitosDe(p) {
  if (Array.isArray(p.requiere)) return p.requiere;
  return p.requiresId ? [p.requiresId] : [];
}

function modoDe(p) { return p.modo === "cualquiera" ? "cualquiera" : "todos"; }

/* ---- Estas las comparten Talentos y Proyectos ----
   Desde que el lienzo dibuja las dos cosas, "de que depende esto" y "ya
   esta?" tienen que saber en que coleccion buscar y con que palabra se dice
   hecho: un talento se completa ("completed") y un encargo se termina
   ("done"). Lo decide la etiqueta `mod` del propio nodo.

   Buscar en las dos listas a la vez seria mas corto y esta descartado: una
   caja del atico tiene id igual que un talento y apareceria donde antes no
   aparecia nada. */
function esNodoDeProyecto(n) { return !!n && n.mod === "proyectos"; }

function coleccionDe(n) { return esNodoDeProyecto(n) ? state.projects : state.perks; }

/* Este requisito ya esta cumplido? La palabra cambia segun el modulo, y el
   modulo lo dice quien pregunta: un encargo solo depende de encargos. */
function nodoHecho(n, esProyecto) {
  return esProyecto ? n.status === "done" : n.status === "completed";
}

/* Los requisitos que existen de verdad. Uno borrado deja de contar en vez
   de bloquear para siempre un talento que ya no espera a nada. */
function requisitosVivos(p) {
  const lista = coleccionDe(p);
  return requisitosDe(p).map(id => lista.find(x => x.id === id)).filter(Boolean);
}

function requisitosCumplidos(p) {
  const reqs = requisitosVivos(p);
  if (!reqs.length) return true;
  const hechos = reqs.filter(r => nodoHecho(r, esNodoDeProyecto(p)));
  return modoDe(p) === "cualquiera" ? hechos.length > 0 : hechos.length === reqs.length;
}

/* ================= Talentos: estados ================= */

function perkStatus(p) {
  if (p.status === "completed") return "completed";
  if (p.status === "expired") return "expired";
  if (p.status === "active") {
    // Congelado dentro de una caja: el plazo no corre, así que no vence
    if (p.congeladoEl) return "active";
    return daysBetween(todayKey(), p.endDate) < 0 ? "due" : "active";
  }
  return requisitosCumplidos(p) ? "available" : "locked";
}

const STATUS_LABEL = {
  available: "Disponible",
  locked: "Bloqueado",
  active: "En progreso",
  due: "Plan vencido",
  completed: "Permanente",
  expired: "Perdido"
};

/* ---- Avance de una meta: se cuenta, no se estima ----
   Antes el avance era un porcentaje que el usuario empujaba a ojo con
   botones de +5, +10 y +25. No había nada detrás de esa cifra, y el talento
   —que es el compromiso más caro de la app porque lleva dinero— acababa con
   el medidor más flojo. Proyectos ya lo tenía resuelto contando etapas.

   Una meta puede no tener ninguna etapa, y entonces ella misma es su única
   etapa: 0 hasta que la confirmas, 100 al confirmarla. Así no queda ningún
   caso donde haya que inventarse una cifra. */
function perkProgress(p) {
  const st = p.steps || [];
  if (!st.length) return p.status === "completed" ? 100 : 0;
  return Math.round(st.filter(s => s.done).length / st.length * 100);
}

async function investPerk(id) {
  const p = state.perks.find(x => x.id === id);
  if (!p) return;
  const t = metaDe(p);
  const st = perkStatus(p);
  if (st === "locked") { toast(tx("Primero completa el requisito"), "atencion"); return; }
  if (st === "active" || st === "completed") return;

  /* Una compra sin importe no es una compra. Es la regla que la separa de
     un hito, así que se comprueba antes de dejar seguir en vez de dejar
     pasar un talento que luego no significa lo que dice ser. */
  if (t.pideImporte && !(p.cost > 0)) {
    toast(tx("Una compra necesita su importe. Edítala y ponle cuánto costó."), "atencion");
    return;
  }

  const costTxt = p.cost > 0 ? `Costo: ${money(p.cost)}. ` : "";
  const pregunta = t.llevaPlan
    ? `¿Comenzar "${p.name}"? ${costTxt}Tendrás ${planLabel(p.planDays)} para lograrla.`
    : `¿Comprar "${p.name}"? ${costTxt}Quedará asegurada de inmediato.`;
  if (!await ask(pregunta, t.llevaPlan ? "Comenzar" : "Comprar")) return;

  p.investedTotal = (p.investedTotal || 0) + (p.cost || 0);
  p.history = p.history || [];
  if (!t.llevaPlan) {
    p.status = "completed";
    p.completedAt = todayKey();
    p.history.unshift({ date: todayKey(), at: stamp(), event: `Comprada y asegurada (${money(p.cost)})` });
    grantPerkReward(p);
    celebrate("Talento asegurado", p.name, "#5fe0b0", p.icon);
  } else {
    p.status = "active";
    p.startDate = todayKey();
    p.endDate = addDaysKey(p.startDate, p.planDays);
    p.history.unshift({ date: todayKey(), at: stamp(), event: `Inversión de ${money(p.cost)} — plan de ${planLabel(p.planDays)} iniciado` });
    toast(`Plan iniciado: ${planLabel(p.planDays)}`, "logro");
  }
  save();
  renderPerkDetail();
  renderTree();
}

async function completeHito(id) {
  const p = state.perks.find(x => x.id === id);
  if (!p || tipoDe(p) !== "hito" || p.status === "completed") return;
  if (perkStatus(p) === "locked") { toast(tx("Primero completa el requisito"), "atencion"); return; }
  if (!await ask(`¿Dar por hecho "${p.name}"?`, "Hecho")) return;
  p.history = p.history || [];
  p.status = "completed";
  p.completedAt = todayKey();
  p.history.unshift({ date: todayKey(), at: stamp(), event: "Hito conseguido" });
  grantPerkReward(p);
  save();
  celebrate("Hito conseguido", p.name, "#5fe0b0", p.icon);
  renderPerkDetail();
  renderTree();
}

async function completePerk(id) {
  const p = state.perks.find(x => x.id === id);
  if (!p || p.status !== "active") return;
  if (!await ask(`¿Confirmas que lograste la meta de "${p.name}"? Se volverá permanente.`, tx("Sí, lo logré"))) return;
  p.status = "completed";
  p.completedAt = todayKey();
  p.history.unshift({ date: todayKey(), at: stamp(), event: "Meta lograda: talento permanente" });
  grantPerkReward(p);
  save();
  celebrate("Talento desbloqueado", p.name, "#5fe0b0", p.icon);
  renderPerkDetail();
  renderTree();
}

async function failPerk(id) {
  const p = state.perks.find(x => x.id === id);
  if (!p || p.status !== "active") return;
  if (!await ask(`¿Marcar "${p.name}" como perdido? Podrás reintentarlo más adelante (volviendo a invertir).`, tx("Lo perdí"), true)) return;
  p.status = "expired";
  p.history.unshift({ date: todayKey(), at: stamp(), event: tx("Plan vencido sin lograr la meta") });
  save();
  toast(`El talento "${p.name}" se perdió. Puedes reintentarlo.`, "atencion");
  renderPerkDetail();
  renderTree();
}

/* ---- Deshacer un talento conseguido ----
   Era la única acción irreversible de la app que no avisaba de serlo: dar
   por hecho un hito con un toque y una confirmación, y para arreglar el
   error no quedaba más que borrarlo y perder su historial.

   Revertir NO es lo mismo que guardar o borrar. Guardar en el ático deja el
   XP intacto porque lo aprendido sigue siendo tuyo; revertir dice que
   aquello no llegó a pasar, así que se devuelve el XP y el dinero, igual
   que ya hace desmarcar una misión. */
async function revertirTalento(id) {
  const p = state.perks.find(x => x.id === id);
  if (!p || p.status !== "completed") return;
  const s = p.skillId ? state.skills.find(x => x.id === p.skillId) : null;
  const devuelve = [];
  if (s && p.xpReward) devuelve.push(`${p.xpReward} XP a ${s.name}`);
  if (p.cost > 0) devuelve.push(money(p.cost));
  const detalle = devuelve.length ? ` Se devolverá ${devuelve.join(" y ")}.` : "";
  if (!await ask(`¿Deshacer "${p.name}"? Volverá al estado en el que estaba.${detalle}`, "Deshacer", true)) return;

  if (s && p.xpReward) removeXp(s, p.xpReward, `Talento deshecho: ${p.name}`, `Talento · ${p.name}`);
  p.investedTotal = Math.max(0, (p.investedTotal || 0) - (p.cost || 0));
  p.completedAt = null;
  /* Una meta vuelve a su plan si aún lo tenía; lo demás vuelve a estar por
     empezar. Sin esto, deshacer una meta a medio plan la mandaría al
     principio y borraría el avance que sí era real. */
  p.status = (metaDe(p).llevaPlan && p.startDate) ? "active" : null;
  p.history.unshift({ date: todayKey(), at: stamp(), event: "Deshecho: vuelve a estar pendiente" });
  save();
  toast(`"${p.name}" vuelve a estar pendiente`, "deshecho");
  renderPerkDetail();
  renderTree();
}

/* ---- Etapas de una meta ----
   Se pueden añadir y quitar desde la propia ficha, no solo desde el
   formulario: una meta creada con el atajo del mapa nace sin ninguna, y
   mandar al usuario a editar para ponerle la primera escondía la regla
   justo donde está trabajando. */
function anadirEtapa(perkId) {
  const p = state.perks.find(x => x.id === perkId);
  const input = document.getElementById("pk-new-step");
  if (!p || !input) return;
  const name = input.value.trim();
  if (!name) return;
  p.steps = p.steps || [];
  p.steps.push({ id: uid(), name, done: false, at: null });
  p.history.unshift({ date: todayKey(), at: stamp(), event: `Etapa añadida: ${name}` });
  save();
  renderPerkDetail();
  renderTree();
  const nuevo = document.getElementById("pk-new-step");
  if (nuevo) nuevo.focus();
}

async function quitarEtapa(perkId, stepId) {
  const p = state.perks.find(x => x.id === perkId);
  if (!p) return;
  const s = (p.steps || []).find(x => x.id === stepId);
  if (!s) return;
  if (!await ask(`¿Quitar la etapa "${s.name}"? El avance se recalcula con las que queden.`, "Quitar", true)) return;
  p.steps = p.steps.filter(x => x.id !== stepId);
  p.history.unshift({ date: todayKey(), at: stamp(), event: `Etapa quitada: ${s.name}` });
  save();
  renderPerkDetail();
  renderTree();
}

function togglePerkStep(perkId, stepId) {
  const p = state.perks.find(x => x.id === perkId);
  if (!p || perkStatus(p) !== "active") return;
  const s = (p.steps || []).find(x => x.id === stepId);
  if (!s) return;
  const antes = perkProgress(p);
  s.done = !s.done;
  s.at = s.done ? stamp() : null;
  p.history.unshift({
    date: todayKey(), at: stamp(),
    event: `${s.done ? "Etapa hecha" : "Etapa reabierta"}: ${s.name}`
  });
  save();
  renderPerkDetail();
  const ahora = perkProgress(p);
  if (ahora >= 100 && antes < 100) toast(tx("Todas las etapas hechas. Confirma la meta cuando quieras"), "logro");
  else toast(`${p.name}: ${ahora}%`, s.done ? "hecho" : "deshecho");
}

function retryPerk(id) {
  const p = state.perks.find(x => x.id === id);
  if (!p || p.status !== "expired") return;
  p.status = null;
  save();
  investPerk(id);
}


/* ================= El ático =================
   Un mapa que solo crece deja de servir. `branchNodes` no filtraba por
   estado, así que un talento completado seguía dibujado para siempre: con
   ocho no se nota, con tres años de uso una rama son sesenta nodos y ya no
   se puede leer.

   La salida NO es archivar al estilo de un gestor de tareas de equipo. Allí
   la tarea es desechable y lo hecho estorba; aquí lo hecho ES el producto —
   toda la app existe para que veas cuánto has avanzado— así que esconderlo
   pelearía con su única razón de ser.

   Así que el pasado se PLIEGA: se guarda en una caja, como en un ático. La
   caja sigue en el mapa, dice lo que lleva dentro, se abre cuando quieras y
   hereda los hilos que cruzaban su frontera, para que la rama nunca se corte
   por la mitad. Y nunca la cierra el sistema: la cierras tú, rama por rama.

   Una caja guarda el TRIMESTRE ENTERO, no solo lo terminado. Guardar solo lo
   hecho dejaría lo demás flotando sin contexto, que es peor que no guardar
   nada; por eso la caja también cuenta lo que lleva sin terminar. */

function trimestreDe(key) {
  const y = key.slice(0, 4);
  const q = Math.ceil(+key.slice(5, 7) / 3);
  return `${y}-T${q}`;
}

function tituloTrimestre(tid) {
  const [y, t] = tid.split("-T");
  return `${t}º trim. ${y}`;
}

/* A qué trimestre pertenece un talento: al de cuando se logró si ya está
   logrado, y si no al de cuando se creó. Así lo que sigue pendiente desde
   hace un año pertenece al trimestre en que lo pensaste, no al actual. */
function trimestreDeTalento(p) {
  return trimestreDe(p.completedAt || p.createdAt || todayKey());
}

function cajasDeRama(b) {
  return (state.cajas || []).filter(c => c.branch === b);
}

function cajaDeTalento(id) {
  return (state.cajas || []).find(c => !c.abierta && c.perkIds.includes(id));
}

/* ---- La caja como grupo ----
   El trimestre le da el nombre por defecto, pero un grupo que no se puede
   renombrar es un cajón sin etiqueta: sirve para guardar, no para volver. */
function nombreCaja(c) { return (c && c.nombre) ? c.nombre : tituloTrimestre(c.trimestre); }

function cajaPorId(id) { return (state.cajas || []).find(c => c.id === id); }

/* Un id del mapa puede ser un talento o una caja. Se dibujan, se mueven y se
   conectan igual, así que casi todo el editor solo necesita "dame el nodo". */
/* Los encargos van al final y no al principio a proposito: asi el orden de
   busqueda de Talentos no cambia ni un paso. Los ids son unicos en toda la
   app, asi que no hay empate posible. */
function nodoPorId(id) {
  return state.perks.find(p => p.id === id) || cajaPorId(id)
      || state.projects.find(p => p.id === id);
}

/* A qué ids REALES corresponde un nodo del dibujo. Una caja cerrada habla en
   nombre de sus miembros, así que la línea que llega hasta ella puede estar
   guardada en cualquiera de ellos y no en la caja. */
function idsRepresentados(id) {
  const c = cajaPorId(id);
  return (c && !c.abierta) ? [id, ...c.perkIds] : [id];
}

/* R5 con memoria. Al empaquetar se anota dónde estaba cada talento, para que
   al abrir la caja el mapa vuelva a ser EL DE ANTES y no uno reacomodado por
   el reparto automático. Guardar tiene que ser reversible hasta en el sitio
   que ocupaban las cosas. */
function guardarPosicionesEn(c) {
  c.pos = {};
  c.perkIds.forEach(pid => {
    const p = state.perks.find(x => x.id === pid);
    if (p && typeof p.x === "number" && typeof p.y === "number") c.pos[pid] = { x: p.x, y: p.y };
  });
}

function restaurarPosiciones(c) {
  Object.keys(c.pos || {}).forEach(pid => {
    const p = state.perks.find(x => x.id === pid);
    if (p) { p.x = c.pos[pid].x; p.y = c.pos[pid].y; }
  });
}

/* La caja nace donde estaba el grupo —en el centro de lo que guarda— y no
   en la esquina que le tocara por orden: si apareciera lejos, guardar un
   trimestre parecería haber movido media rama. */
function colocarCaja(c) {
  if (typeof c.x === "number" && typeof c.y === "number") return;
  const pts = Object.keys(c.pos || {}).map(k => c.pos[k]);
  if (!pts.length) return;
  c.x = enLienzoX(pts.reduce((a, p) => a + p.x, 0) / pts.length);
  c.y = enLienzoY(pts.reduce((a, p) => a + p.y, 0) / pts.length);
}

/* Los grupos abiertos de una rama: siguen existiendo aunque estén
   desplegados, y por eso el mapa los dibuja como un recinto alrededor de sus
   miembros en vez de olvidarlos hasta que se vuelvan a cerrar. */
function gruposAbiertos(b) {
  return cajasDeRama(b).filter(c => c.abierta && c.perkIds.length);
}

/* Los trimestres que se pueden cerrar en una rama: los ya terminados que
   todavía tengan algo suelto. El actual nunca — no se guarda un trimestre
   en el que aún estás. */
function trimestresGuardables(b) {
  const ahora = trimestreDe(todayKey());
  const cuenta = {};
  state.perks.forEach(p => {
    if ((p.branch || "General") !== b) return;
    if (cajaDeTalento(p.id) || (state.cajas || []).some(c => c.perkIds.includes(p.id))) return;
    const t = trimestreDeTalento(p);
    if (t >= ahora) return;
    cuenta[t] = (cuenta[t] || 0) + 1;
  });
  return Object.keys(cuenta).sort().map(t => ({ id: t, n: cuenta[t] }));
}

function talentosDelTrimestre(b, tid) {
  return state.perks.filter(p =>
    (p.branch || "General") === b &&
    trimestreDeTalento(p) === tid &&
    !(state.cajas || []).some(c => c.perkIds.includes(p.id)));
}

function resumenCaja(c) {
  const dentro = c.perkIds.map(id => state.perks.find(p => p.id === id)).filter(Boolean);
  const hechos = dentro.filter(p => p.status === "completed").length;
  return { total: dentro.length, hechos, pendientes: dentro.length - hechos, dentro };
}

async function guardarTrimestre(b, tid) {
  const dentro = talentosDelTrimestre(b, tid);
  if (!dentro.length) return;
  const hechos = dentro.filter(p => p.status === "completed").length;
  const sueltos = dentro.length - hechos;
  /* Se dice exactamente qué entra, y lo pendiente se nombra aparte: meter
     trabajo vivo en el ático tiene que ser una decisión visible y no una
     desaparición. */
  const detalle = sueltos
    ? `Entran ${hechos} hecho${hechos === 1 ? "" : "s"} y ${sueltos} sin terminar. Los plazos de lo pendiente se congelan mientras esté guardado.`
    : `Entran ${hechos} talento${hechos === 1 ? "" : "s"}, todos hechos.`;
  if (!await ask(`¿Guardar el ${tituloTrimestre(tid)} de "${b}" en el ático? ${detalle}`, "Guardar")) return;

  dentro.forEach(p => {
    // R7: lo que estaba en curso deja de correr mientras esté dentro
    if (p.status === "active" && !p.congeladoEl) p.congeladoEl = todayKey();
  });
  /* Se congela el reparto ANTES de empaquetar: si los talentos no tenían
     coordenadas propias, al abrir la caja volverían colocados por el reparto
     automático y el usuario vería su rama reordenada sola. */
  fijarPosiciones(b);
  const caja = {
    id: uid(), branch: b, trimestre: tid, guardadoEl: todayKey(),
    abierta: false, perkIds: dentro.map(p => p.id),
    requiere: [], modo: "todos", pos: {}
  };
  guardarPosicionesEn(caja);
  colocarCaja(caja);
  state.cajas = state.cajas || [];
  state.cajas.push(caja);
  save();
  renderTree();
  toast(`${tituloTrimestre(tid)} guardado · ${dentro.length} talento${dentro.length === 1 ? "" : "s"}`, "hecho",
    { label: tx("Ver qué lleva"), onclick: `verCaja('${caja.id}')` });
}

/* Abrir no es una vista de solo lectura: lo de dentro vuelve a ser
   exactamente lo que era, con su ficha, su historial y sus conexiones. La
   caja se queda marcada como abierta para poder volver a cerrarla de un
   toque, en vez de tener que rehacer el trimestre entero. */
function abrirCaja(id) {
  const c = (state.cajas || []).find(x => x.id === id);
  if (!c || c.abierta) return;
  cerrarVentanaCaja();
  c.abierta = true;
  descongelarCaja(c);
  /* Todo vuelve como estaba: cada talento a su sitio, con sus conexiones
     intactas (nunca se tocaron) y el grupo dibujado alrededor para que se
     vea de dónde salieron. Las conexiones propias de la caja se quedan
     guardadas y reaparecen si la vuelves a cerrar. */
  restaurarPosiciones(c);
  save();
  renderTree();
  toast(`${nombreCaja(c)} desplegado · el grupo sigue marcado en el mapa`, "deshecho",
    { label: "Volver a guardar", onclick: `cerrarCaja('${c.id}')` });
}

function cerrarCaja(id) {
  const c = (state.cajas || []).find(x => x.id === id);
  if (!c || !c.abierta) return;
  cerrarVentanaCaja();
  // Lo mismo que al empaquetar por primera vez: se anota dónde queda cada uno
  fijarPosiciones(c.branch);
  guardarPosicionesEn(c);
  colocarCaja(c);
  c.abierta = false;
  c.guardadoEl = todayKey();
  c.perkIds.forEach(pid => {
    const p = state.perks.find(x => x.id === pid);
    if (p && p.status === "active" && !p.congeladoEl) p.congeladoEl = todayKey();
  });
  save();
  renderTree();
  toast(`${nombreCaja(c)} guardado de nuevo`, "hecho");
}

/* Renombrar es lo que convierte "3º trim. 2026" en "El semestre del examen".
   Un grupo con nombre propio se vuelve a abrir; uno con fecha, no. */
async function renombrarCaja(id) {
  const c = cajaPorId(id);
  if (!c) return;
  const nombre = await askText(
    tx("¿Cómo quieres llamar a esta caja?"),
    nombreCaja(c),
    "Ponerle nombre",
    `Déjalo vacío para volver a "${tituloTrimestre(c.trimestre)}".`);
  if (nombre === null) return;
  if (nombre) c.nombre = nombre.slice(0, 42); else delete c.nombre;
  save();
  renderTree();
  if (ventanaCajaId === c.id) verCaja(c.id);
  toast(`Ahora se llama ${nombreCaja(c)}`, "hecho");
}

/* Sacar UN talento sin desmontar el grupo entero. Sin esto, recuperar una
   sola cosa obligaba a abrir la caja, y abrir la caja deshace el orden que
   costó tomar la decisión de guardar. */
function sacarDeCaja(cajaId, perkId) {
  const c = cajaPorId(cajaId);
  const p = state.perks.find(x => x.id === perkId);
  if (!c || !p) return;
  pushUndo(tx("sacar un talento de la caja"));
  c.perkIds = c.perkIds.filter(id => id !== perkId);
  if (c.pos) delete c.pos[perkId];
  // Vuelve a correr su plazo: fuera de la caja el compromiso está vivo
  if (p.congeladoEl) {
    const dias = daysBetween(p.congeladoEl, todayKey());
    if (dias > 0 && p.endDate) p.endDate = addDaysKey(p.endDate, dias);
    delete p.congeladoEl;
  }
  // Se coloca al lado de la caja, no en el sitio que ocupó hace meses
  if (typeof c.x === "number") {
    p.x = enLienzoX(c.x + 150);
    p.y = enLienzoY(c.y || 100);
  }
  if (!c.perkIds.length) {
    state.cajas = state.cajas.filter(x => x.id !== c.id);
    limpiarEnlacesA(c.id);
    cerrarVentanaCaja();
  }
  save();
  renderTree();
  if (ventanaCajaId === c.id) verCaja(c.id);
  toast(`${p.name} salió de la caja`, "deshecho", { label: "Deshacer", onclick: "undoEditor()" });
}

/* ---- Agrupar a mano ----
   El ático nació guardando trimestres enteros, que es una forma de agrupar
   pero no la única: a veces lo que va junto es "los tres cursos de dibujo",
   sin importar cuándo se hicieron. Esto crea el mismo grupo con lo que el
   usuario haya elegido en el mapa.

   Nace DESPLEGADO: agrupar es dibujar un recinto alrededor de lo que ya
   está, no mandarlo al desván. Por eso tampoco congela ningún plazo —eso
   solo pasa al guardarlo de verdad, desde su propia ventana—. */
async function crearGrupoCon(ids, branch) {
  const dentro = ids.map(id => state.perks.find(p => p.id === id)).filter(Boolean);
  if (dentro.length < 2) { toast(tx("Elige al menos dos talentos"), "atencion"); return null; }
  const yaAgrupado = dentro.filter(p => (state.cajas || []).some(c => c.perkIds.includes(p.id)));
  if (yaAgrupado.length) {
    toast(`${yaAgrupado[0].name} ya está en otro grupo`, "atencion");
    return null;
  }
  const nombre = await askText(
    `Agrupar ${dentro.length} talentos`, "", "Agrupar",
    tx("El nombre del grupo. Puedes cambiarlo después."), 42);
  if (nombre === null) return null;

  fijarPosiciones(branch);
  const caja = {
    id: uid(), branch, trimestre: trimestreDe(todayKey()), guardadoEl: todayKey(),
    abierta: true, perkIds: dentro.map(p => p.id),
    requiere: [], modo: "todos", pos: {}
  };
  if (nombre) caja.nombre = nombre.slice(0, 42);
  guardarPosicionesEn(caja);
  state.cajas = state.cajas || [];
  state.cajas.push(caja);
  save();
  renderTree();
  toast(`${nombreCaja(caja)} · ${dentro.length} talentos agrupados`, "hecho",
    { label: "Deshacer", onclick: `desagrupar('${caja.id}')` });
  return caja;
}

/* Deshacer el grupo NO es borrarlo: los talentos se quedan donde están y
   solo desaparece el recinto que los rodeaba. Existe porque "Borrar la caja"
   se lleva por delante lo que hay dentro, y eso no puede ser la única salida
   de un grupo hecho por error. */
function desagrupar(id) {
  const c = cajaPorId(id);
  if (!c) return;
  cerrarVentanaCaja();
  descongelarCaja(c);
  state.cajas = state.cajas.filter(x => x.id !== id);
  limpiarEnlacesA(c.id);
  save();
  renderTree();
  toast(`${nombreCaja(c)} deshecho · sus talentos siguen ahí`, "deshecho");
}

/* El color del grupo. Vacío devuelve el automático: verde si todo está
   hecho, amarillo si algo sigue vivo. */
function pintarCaja(color) {
  const c = cajaPorId(ventanaCajaId);
  if (!c) return;
  if (color) c.color = color; else delete c.color;
  save();
  renderTree();
  verCaja(c.id);
}

/* ---- La ventana de una caja ----
   Es la mitad que le faltaba al ático: mirar dentro sin desmontar nada.
   Abrir una caja devuelve todo su contenido al mapa, y eso es una decisión;
   asomarse a ver qué guardó uno en marzo no debería serlo. */
let ventanaCajaId = null;

function verCaja(id) {
  const c = cajaPorId(id);
  const el = document.getElementById("caja-modal");
  if (!c || !el) return;
  ventanaCajaId = id;
  const { total, hechos, pendientes, dentro } = resumenCaja(c);
  const cc = pendientes === 0 ? "var(--mint)" : "var(--fire)";
  const dib = nodoDeVista(c.branch, c.id);
  const enlaces = dib ? dib.requiere.length : 0;

  const lista = dentro.map(p => {
    const st = perkStatus(p);
    return `
    <div class="caja-row ${st === "completed" ? "ok" : ""}">
      <button type="button" class="caja-ir" onclick="irATalentoDeCaja('${escapeAttr(p.id)}')">
        <span class="ci" style="color:${tinta(p.color)}">${icon(st === "completed" ? "check" : (p.icon || "star"), 15)}</span>
        <span class="ct"><b>${escapeHtml(p.name)}</b><span>${tx(metaDe(p).nombre)} · ${tx(STATUS_LABEL[st])}</span></span>
      </button>
      <button type="button" class="caja-sacar" title="${escapeAttr(tx("Sacar del ático"))}" aria-label="Sacar ${escapeAttr(p.name)} del ático"
        onclick="sacarDeCaja('${escapeAttr(c.id)}','${escapeAttr(p.id)}')">↥</button>
    </div>`;
  }).join("");

  document.getElementById("caja-body").innerHTML = `
    <div class="caja-head">
      <button type="button" class="caja-nombre" onclick="renombrarCaja('${escapeAttr(c.id)}')" title="${escapeAttr(tx("Renombrar esta caja"))}">
        <b style="color:${tinta(cc)}">${escapeHtml(nombreCaja(c))}</b>${icon("pen", 12)}
      </button>
      <span class="caja-sub">${escapeHtml(c.branch)} · ${tituloTrimestre(c.trimestre)} · guardada el ${formatDate(c.guardadoEl)}</span>
    </div>
    <div class="caja-stats">
      <div><b style="color:var(--mint)">${hechos}</b><span>${tx("hechos")}</span></div>
      <div><b style="color:${pendientes ? "var(--fire)" : "var(--muted)"}">${pendientes}</b><span>${tx("sin terminar")}</span></div>
      <div><b>${total}</b><span>${tx("en total")}</span></div>
    </div>
    <p class="settings-note" style="text-align:left;margin:0 0 12px">${
      c.abierta
        ? tx("Está desplegada: sus talentos viven en el mapa, dentro del recinto del grupo.")
        : `Está guardada: en el mapa ocupa un solo nodo${
            pendientes ? ` y los plazos de lo pendiente están congelados` : ""}${
            enlaces ? ` · ${enlaces} conexión${enlaces === 1 ? "" : "es"} entrando` : ""}.`}</p>
    <div class="caja-lista">${lista || `<p class="settings-note" style="margin:0">${tx("Se quedó vacía.")}</p>`}</div>
    <div class="caja-color">
      <span class="caja-sub">${tx("Color del grupo")}</span>
      <div class="color-grid">
        <button type="button" class="cc-auto ${!c.color ? "selected" : ""}" onclick="pintarCaja('')" title="${escapeAttr(tx("Que lo decida su estado"))}">auto</button>
        ${COLORS.map(col => `<button type="button" class="${c.color === col ? "selected" : ""}" style="background:${col}" onclick="pintarCaja('${col}')" aria-label="${col}"></button>`).join("")}
      </div>
    </div>
    <div class="stack" style="margin-top:14px">
      ${c.abierta
        ? `<button class="btn btn-primary btn-block" onclick="cerrarCaja('${escapeAttr(c.id)}')">${tx("Volver a guardarla")}</button>`
        : `<button class="btn btn-primary btn-block" onclick="abrirCaja('${escapeAttr(c.id)}')">${tx("Desplegarla en el mapa")}</button>`}
      <button class="btn btn-soft btn-block" onclick="desagrupar('${escapeAttr(c.id)}')">${tx("Deshacer el grupo")}</button>
      <button class="btn btn-danger-ghost btn-block" onclick="borrarCaja('${escapeAttr(c.id)}')">${tx("Borrar la caja y lo que lleva")}</button>
      <button class="btn btn-ghost btn-block" onclick="cerrarVentanaCaja()">${tx("Cerrar")}</button>
    </div>`;
  el.classList.add("show");
}

function cerrarVentanaCaja() {
  ventanaCajaId = null;
  const el = document.getElementById("caja-modal");
  if (el) el.classList.remove("show");
}

function irATalentoDeCaja(id) {
  cerrarVentanaCaja();
  openPerk(id);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && ventanaCajaId) cerrarVentanaCaja();
});

/* Nadie puede quedar exigiendo un nodo que ya no existe: una línea que
   apunta al vacío deja bloqueado a quien la tiene, sin causa visible. */
function limpiarEnlacesA(id) {
  state.perks.forEach(p => {
    const r = requisitosDe(p);
    if (r.includes(id)) p.requiere = r.filter(x => x !== id);
  });
  (state.cajas || []).forEach(c => {
    if ((c.requiere || []).includes(id)) c.requiere = c.requiere.filter(x => x !== id);
  });
}

/* R7: el plazo se congela dentro de la caja. Al abrirla, la fecha límite se
   corre tantos días como estuvo guardada — guardar ordena el mapa, no es un
   movimiento sobre el compromiso. Si caducaran metas por guardarlas, el
   ático sería una trampa y nadie lo usaría. */
function descongelarCaja(c) {
  c.perkIds.forEach(pid => {
    const p = state.perks.find(x => x.id === pid);
    if (!p || !p.congeladoEl) return;
    const dias = daysBetween(p.congeladoEl, todayKey());
    if (dias > 0 && p.endDate) p.endDate = addDaysKey(p.endDate, dias);
    delete p.congeladoEl;
  });
}

async function borrarCaja(id) {
  const c = (state.cajas || []).find(x => x.id === id);
  if (!c) return;
  const { total, hechos } = resumenCaja(c);
  if (!await ask(
    `¿Borrar "${nombreCaja(c)}"? Se van sus ${total} talento${total === 1 ? "" : "s"} y no se puede deshacer. ` +
    `El XP que dieron los ${hechos} logrado${hechos === 1 ? "" : "s"} se queda en tus habilidades.`,
    "Borrar", true)) return;
  cerrarVentanaCaja();
  const fuera = new Set(c.perkIds);
  state.perks = state.perks.filter(p => !fuera.has(p.id));
  // Quien los pedía deja de esperarlos, en vez de quedarse bloqueado a nada
  state.perks.forEach(p => {
    const r = requisitosDe(p);
    if (r.some(id2 => fuera.has(id2))) p.requiere = r.filter(id2 => !fuera.has(id2));
  });
  state.cajas = state.cajas.filter(x => x.id !== id);
  limpiarEnlacesA(c.id);
  save();
  renderTree();
  toast(`"${nombreCaja(c)}" borrada`, "deshecho");
}

/* ---- La rama tal como se dibuja ----
   Aquí ocurre R5. Una caja cerrada se comporta como un solo nodo: los hilos
   entre dos talentos que están dentro viajan con ella, y los que cruzaban su
   frontera se reenganchan a la caja. Es una contracción del grafo, y por eso
   esta fase iba después de las conexiones: escribirla antes habría obligado
   a programar la herencia de aristas dos veces, primero para un padre único
   y luego para una lista. */
function vistaDeRama(b) {
  const todos = state.perks.filter(p => (p.branch || "General") === b);
  const cerradas = cajasDeRama(b).filter(c => !c.abierta);
  const dentroDe = new Map();
  cerradas.forEach(c => c.perkIds.forEach(id => dentroDe.set(id, c.id)));

  // A quién representa cada talento en el dibujo: a sí mismo, o a su caja
  const rep = id => dentroDe.get(id) || id;

  const nodos = [];
  cerradas.forEach(c => {
    const { total, hechos, pendientes } = resumenCaja(c);
    // Los requisitos de la caja: los de sus miembros que apuntan fuera...
    const req = new Set();
    c.perkIds.forEach(pid => {
      const p = state.perks.find(x => x.id === pid);
      if (!p) return;
      requisitosDe(p).forEach(r => { const v = rep(r); if (v !== c.id) req.add(v); });
    });
    /* ...y los suyos propios. Una caja se puede atar a mano a cualquier nodo
       aunque nada de lo que lleva dentro lo pidiera: es una conexión
       simbólica —"esto vino de aquello"— y por eso no bloquea a nadie. */
    (c.requiere || []).forEach(r => { const v = rep(r); if (v !== c.id) req.add(v); });
    nodos.push({
      id: c.id, esCaja: true, cajaId: c.id,
      name: nombreCaja(c),
      resumen: pendientes ? `${hechos} hechos · ${pendientes} sin terminar` : `${total} guardados`,
      todoHecho: pendientes === 0,
      requiere: [...req], modo: modoDe(c),
      /* El color elegido a mano manda sobre el del estado. Viaja aparte
                 (`colorPropio`) para que el dibujo sepa distinguir "lo pintó
                 alguien" de "lo pinta su estado". */
      color: c.color || "#5fe0b0", colorPropio: c.color || null, icon: "box",
      x: c.x, y: c.y
    });
  });
  todos.forEach(p => {
    if (dentroDe.has(p.id)) return;
    const req = [...new Set(requisitosDe(p).map(rep))].filter(id => id !== p.id);
    // Copia para dibujar: el original no se toca al traducir sus requisitos
    nodos.push(Object.assign(Object.create(Object.getPrototypeOf(p)), p, { requiere: req }));
  });
  return nodos;
}

function grantPerkReward(p) {
  if (!p.skillId || !p.xpReward) return;
  const s = state.skills.find(x => x.id === p.skillId);
  if (!s) return;
  addXp(s, p.xpReward, `Talento completado: ${p.name}`, `Talento · ${p.name}`);
}

