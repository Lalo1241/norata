/* Fusionar dos versiones del estado sin preguntar */

/* ================= Fusión =================
   Antes, cuando los dos dispositivos habían cambiado, la app enseñaba las dos
   versiones y te hacía elegir una. Elegir significaba tirar la otra: un día
   de trabajo del teléfono a la basura porque la computadora también se tocó.

   Ahora se juntan. La pregunta desaparece no porque se decida en silencio,
   sino porque deja de haber algo que decidir: casi todo lo que guarda Notara
   es acumulativo —movimientos de XP, marcas de misión, historial— y dos
   listas de cosas que pasaron se suman, no compiten.

   Lo que sí compite son los campos sueltos: el nombre de una habilidad, el
   color de una misión, el plazo de una meta. Ahí gana el lado que guardó
   después. Es la única parte donde algo se pierde, y se pierde lo mínimo:
   un nombre reescrito, nunca progreso.

   Tres invariantes que hacen que esto sea seguro de repetir:

   1. Es idempotente. Fusionar dos veces lo mismo da lo mismo, porque todo se
      une por identidad y no por posición ni por conteo.
   2. Da igual el orden. A con B es B con A salvo en los campos sueltos, y
      ahí manda una fecha, no quién llamó primero.
   3. El XP no se suma a mano: se recalcula contando los movimientos. Así una
      fusión no puede inflarlo aunque se repita mil veces. */

/* Une dos listas de cosas que ya pasaron. La clave las identifica; lo que
   aparece en los dos lados se queda una sola vez. */
function unirPorClave(a, b, clave) {
  const m = new Map();
  (a || []).forEach(x => { if (x) m.set(clave(x), x); });
  (b || []).forEach(x => { if (x) m.set(clave(x), x); });
  return [...m.values()];
}

/* Un movimiento de XP se identifica por su instante. Los más viejos no lo
   llevan (nacieron antes de que existiera el campo), así que para ésos se
   compone una clave con lo que sí tienen. */
function claveMovimiento(e) {
  return e.at || ("d" + e.date + "|" + e.xp + "|" + (e.note || ""));
}

function fusionarHabilidad(a, b) {
  const log = unirPorClave(a.log, b.log, claveMovimiento)
    .sort((x, y) => String(y.at || y.date || "").localeCompare(String(x.at || x.date || "")));
  return {
    log,
    // Recalculado, nunca sumado: es lo que impide que fusionar infle el XP
    xp: log.reduce((t, e) => t + (Number(e.xp) || 0), 0),
    lastActivity: [a.lastActivity, b.lastActivity].filter(Boolean).sort().pop() || null,
    lastCheck: [a.lastCheck, b.lastCheck].filter(Boolean).sort().pop() || null
  };
}

/* Las marcas de misión son conjuntos por día: se unen y se cuentan. El tope
   es el objetivo del día — dos dispositivos pueden llegar cada uno al máximo
   y la suma no debería dar "9 de 8". */
function fusionarMarcas(a, b, tope) {
  const dias = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  const out = {};
  const lista = (o, k) => Array.isArray(o && o[k]) ? o[k] : [];
  dias.forEach(k => {
    const juntas = [...new Set([...lista(a, k), ...lista(b, k)])];
    if (juntas.length) out[k] = tope > 0 ? juntas.slice(0, tope) : juntas;
  });
  return out;
}

/* Una etapa hecha en cualquiera de los dos lados queda hecha: nadie deshace
   una etapa por accidente, y desmarcarla es raro comparado con marcarla. */
function fusionarEtapas(a, b) {
  const porId = new Map();
  (a || []).concat(b || []).forEach(s => {
    if (!s || !s.id) return;
    const prev = porId.get(s.id);
    if (!prev) { porId.set(s.id, Object.assign({}, s)); return; }
    prev.done = prev.done || s.done;
    prev.at = prev.at || s.at;
    if (s.name) prev.name = s.name;
  });
  // El orden lo pone quien tenga más etapas: es quien las editó por último
  const guia = (b || []).length >= (a || []).length ? b : a;
  const vistos = new Set();
  const out = [];
  (guia || []).forEach(s => { if (s && porId.has(s.id)) { out.push(porId.get(s.id)); vistos.add(s.id); } });
  porId.forEach((s, id) => { if (!vistos.has(id)) out.push(s); });
  return out;
}

/* `nuevo` es el lado que guardó después: manda en los campos sueltos. */
function fusionarItem(col, viejo, nuevo) {
  const r = Object.assign({}, viejo, nuevo);
  if (col === "skills") Object.assign(r, fusionarHabilidad(viejo, nuevo));
  else if (col === "missions") r.log = fusionarMarcas(viejo.log, nuevo.log, missionTarget(r));
  else if (col === "perks" || col === "projects") {
    r.history = unirPorClave(viejo.history, nuevo.history,
      e => (e.at || "") + "|" + (e.date || "") + "|" + (e.event || ""));
    r.steps = fusionarEtapas(viejo.steps, nuevo.steps);
  }
  return r;
}

/* Junta dos estados completos. `bEsMasNuevo` decide quién manda en lo que no
   se puede unir; todo lo demás se une venga de donde venga. */
function fusionarEstados(a, b, bEsMasNuevo) {
  const base = bEsMasNuevo ? b : a;
  const otro = bEsMasNuevo ? a : b;
  const out = JSON.parse(JSON.stringify(base));

  // Las muertes de los dos lados valen: basta que uno lo haya borrado
  out.borrados = Object.assign({}, otro.borrados || {}, base.borrados || {});

  COLECCIONES.forEach(col => {
    const porId = new Map();
    (otro[col] || []).forEach(x => { if (x && x.id) porId.set(x.id, x); });
    (base[col] || []).forEach(x => {
      if (!x || !x.id) return;
      const previo = porId.get(x.id);
      porId.set(x.id, previo ? fusionarItem(col, previo, x) : x);
    });
    /* Lo borrado no vuelve. Y si algo se creó DESPUÉS de haberse borrado su
       id —imposible en la práctica, los ids llevan la hora dentro— seguiría
       fuera; se prefiere eso a resucitar cosas. */
    out[col] = [...porId.values()].filter(x => !out.borrados[x.id]);
  });

  out.schemaVersion = SCHEMA;
  return out;
}
