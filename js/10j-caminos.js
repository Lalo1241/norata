/* Los caminos: diez ramas ya armadas que se pueden soltar en el tablero.

   ---- Por que los datos NO estan aqui dentro ----

   Son 132 peldanos con sus pasos, sus plazos y sus misiones: 21 KB que solo
   necesita quien abre el cajon, y solo si paga. Metidos en un archivo de
   `ASSETS` se los bajaria todo el mundo en la instalacion, incluido quien
   nunca va a abrirlos — y el arranque de la app es hoy UNA peticion y ~120 ms,
   que es lo que costo llegar ahi en la 0.7.38.

   Asi que viven en `caminos/caminos.json`, fuera de la lista, y se piden la
   primera vez que alguien abre el cajon. Es el mismo trato que tienen las
   texturas de un mundo.

   ---- Y por que la direccion lleva `?h=` ----

   Lo que no esta en `ASSETS` no lo renueva nadie: se pide suelto, lo que
   llegue se guarda en la cache de esa version, y a partir de ahi ya es un
   acierto y no se vuelve a pedir NUNCA. GitHub Pages tarda un minuto en
   publicar y su CDN no cambia todos los archivos a la vez, asi que hay una
   ventana en la que el JS ya es el nuevo y el JSON todavia es el viejo: quien
   abra ahi se queda los caminos viejos congelados para siempre.

   La huella cierra esa ventana. `sw.js` ya sabe comprobarla —calcula el
   sha-256 de lo que llego y solo lo guarda si cuadra con lo que pedia la
   direccion—, asi que aqui no hace falta nada mas que ponerla.

   **La estampa `caminos/app.py`**, que es tambien quien genera el JSON desde
   `plantillas/LEEME.md`. No se escribe a mano: si se toca un peldano se
   corrige el LEEME y se vuelve a correr el generador. */

/* La escribe el generador. Vacia quiere decir que nadie ha corrido
   `python caminos/app.py` todavia, y entonces se pide sin huella: funciona,
   pero sin la garantia de arriba. */
const CAMINOS_HUELLA = "4e8cf30fce4f";

/* Cargados una vez por sesion. Son datos que no cambian mientras la app este
   abierta, asi que no hay motivo para volver a pedirlos ni a analizarlos. */
let _caminos = null;

/* La peticion en vuelo. Sin esto, abrir el cajon dos veces seguidas antes de
   que conteste la red dispara dos descargas: la promesa se comparte y las dos
   llamadas esperan la misma. */
let _pidiendo = null;

/* Devuelve la lista, o `null` si no se pudo traer.

   No lanza NUNCA, y es a proposito: quien llama esta pintando una ventana, y
   un fallo de red no puede dejar media pantalla a medio dibujar. Un `null`
   se contesta con «esto no se pudo abrir, intenta otra vez», que es una frase
   que cabe donde iba la lista. */
function cargarCaminos() {
  if (_caminos) return Promise.resolve(_caminos);
  if (_pidiendo) return _pidiendo;

  const url = "caminos/caminos.json" + (CAMINOS_HUELLA ? "?h=" + CAMINOS_HUELLA : "");
  _pidiendo = fetch(url, { cache: "no-store", credentials: "same-origin" })
    .then(r => (r.ok ? r.json() : null))
    .then(d => {
      _caminos = d && Array.isArray(d.caminos) ? d.caminos : null;
      return _caminos;
    })
    .catch(() => null)
    .then(v => {
      /* La promesa se suelta pase lo que pase: si fallo por falta de red, el
         siguiente intento tiene que volver a pedirlo de verdad y no quedarse
         con el fallo guardado. */
      _pidiendo = null;
      return v;
    });
  return _pidiendo;
}

/* Los del modulo que toque. El cajon de Talentos y el de Proyectos son la
   misma ventana con distinto vocabulario, asi que reparte por aqui. */
function caminosDe(modulo) {
  return (_caminos || []).filter(c => c.modulo === modulo);
}

function caminoPorId(id) {
  return (_caminos || []).find(c => c.id === id) || null;
}

/* ---- Cuales ya tiene puestos ----

   Se guarda `rama -> id del camino` y no una marca dentro de los talentos,
   porque lo que se crea tiene que ser **indistinguible de lo escrito a mano**:
   un talento que llevara sello de origen ya no seria del todo tuyo, y ese fue
   el trato desde el principio.

   Vive en `state.ui` para que viaje en la sincronia, y `js/10-fusion.js` tiene
   que unirlo o al abrir en otro aparato se te olvida cual usaste. */
function caminosPuestos() {
  return (state.ui && state.ui.caminos) || {};
}

function caminoDeRama(rama) {
  return caminosPuestos()[rama] || null;
}

function caminoYaPuesto(id) {
  const m = caminosPuestos();
  return Object.keys(m).some(r => m[r] === id);
}

/* El nombre libre para la rama nueva. NUNCA se fusiona con una que ya exista:
   si «Salud» esta ocupada, la nueva es «Salud 2».

   Eduardo lo decidio asi, y de paso resuelve solo el problema de repetir un
   camino: la rama de antes se queda entera con su historial y no hay nada que
   sobrescribir. El numero es feo los diez segundos que se tarda en renombrarla,
   que ya se puede porque el camino entra tal cual y se edita sobre la marcha. */
function ramaLibre(base, kind) {
  const usadas = ramasDe(kind || "perks");
  if (!usadas.includes(base)) return base;
  let n = 2;
  while (usadas.includes(base + " " + n)) n++;
  return base + " " + n;
}

/* ================= El cajón =================

   Una VENTANA y no una pantalla, porque crear una rama ya es una ventana hoy:
   se abre desde el mismo botón, la página de detrás se queda quieta —la línea
   de `CAPAS_QUE_TAPAN` lo hace sola— y cerrarla te devuelve donde estabas. */

/* "perks" o "projects", que es como los llama `crearRama`. Los datos usan
   "talentos" y "proyectos", así que hay que traducir en un solo sitio. */
let cajonKind = null;

function moduloDe(kind) { return kind === "perks" ? "talentos" : "proyectos"; }

/* Cada camino toma un color de la paleta del usuario. Por índice y no al azar:
   así el mismo camino es siempre del mismo color, en este aparato y en otro. */
function colorDeCamino(c) { return COLORS[(c.n - 1) % COLORS.length]; }

/* El XP sale de una regla y no de un número escrito: 120 por hito, 300 por
   meta —que se sostienen en el tiempo—, 0 por compra. Un encargo vale 150.
   Es la misma cuenta que hace la carta y la que acaba en cada `xpReward`. */
function xpDePeldano(p) {
  if (p.tipo === "compra") return 0;
  if (p.tipo === "meta") return 300;
  if (p.tipo === "hito") return 120;
  return 150;
}

function xpDeCamino(c) {
  return c.peldanos.reduce((a, p) => a + xpDePeldano(p), 0);
}

/* El mapa de la carta: la silueta del camino, con el primero encendido y los
   demás con candado. Las tres figuras son las MISMAS del lienzo —hexágono el
   hito, rombo la meta, círculo la compra—, que es lo que hace que la carta se
   lea como la app y no como un folleto. */
function figuraCamino(tipo, x, y, r) {
  if (tipo === "compra") return `<circle cx="${x}" cy="${y}" r="${r - 1.5}"/>`;
  if (tipo === "meta") {
    return `<polygon points="${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}"/>`;
  }
  if (!tipo) return `<circle cx="${x}" cy="${y}" r="${r - 0.5}"/>`;   // un encargo
  const p = [];
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 180 * (60 * i - 30);
    p.push(`${(x + r * Math.cos(a)).toFixed(1)},${(y + r * Math.sin(a)).toFixed(1)}`);
  }
  return `<polygon points="${p.join(" ")}"/>`;
}

/* Los niveles salen de las dependencias, igual que en el lienzo: el nivel de
   un peldaño es uno más que el mayor de los que pide. Como ningún peldaño
   depende de otro posterior —lo comprueba el generador—, basta una pasada. */
function nivelesDeCamino(c) {
  const niv = {};
  c.peldanos.forEach(p => {
    niv[p.n] = p.pide.length ? 1 + Math.max.apply(null, p.pide.map(x => niv[x] || 0)) : 0;
  });
  return niv;
}

function mapaDeCamino(c, col) {
  const niv = nivelesDeCamino(c);
  const cols = [];
  c.peldanos.forEach(p => { (cols[niv[p.n]] = cols[niv[p.n]] || []).push(p); });
  const R = 6, PX = 24, PY = 19, M = 11;
  const W = (cols.length - 1) * PX + M * 2;
  const H = (Math.max.apply(null, cols.map(x => x.length)) - 1) * PY + M * 2;
  const pos = {};
  cols.forEach((col2, l) => {
    const off = (H - (col2.length - 1) * PY) / 2;
    col2.forEach((p, k) => { pos[p.n] = { x: M + l * PX, y: off + k * PY }; });
  });

  let lineas = "", nodos = "";
  c.peldanos.forEach(p => {
    p.pide.forEach(r => {
      const a = pos[r], b = pos[p.n];
      if (!a || !b) return;
      lineas += `<line x1="${a.x + R}" y1="${a.y}" x2="${b.x - R}" y2="${b.y}"
        stroke="var(--carril)" stroke-width="1.2"/>`;
    });
    const abierto = !p.pide.length;
    const pt = pos[p.n];
    nodos += `<g fill="${abierto ? relleno(col, "33") : "none"}"
      stroke="${abierto ? trazo(col) : "var(--faint)"}"
      stroke-width="${abierto ? 1.9 : 1.3}">${figuraCamino(p.tipo, pt.x, pt.y, R)}</g>`;
  });

  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeAttr(
    T`${tx(c.nombre)}: ${c.peldanos.length} peldaños, el primero abierto y el resto con candado.`)}">
    ${lineas}${nodos}</svg>`;
}

/* El sello de «esto vino de un camino». El mismo en la carta y en la rama. */
function selloCamino() {
  return `<span class="sello-camino">${icon("map", 12)}</span>`;
}

function cartaDeCamino(c, trabada) {
  const col = colorDeCamino(c);
  const uno = c.peldanos.find(p => !p.pide.length);
  const puesto = caminoYaPuesto(c.id);
  return `<button type="button" class="cam-carta${trabada ? " trabada" : ""}" style="--c:${col}"
    onclick="${trabada ? `topeAlcanzado('${escapeAttr(trabada)}')` : `verCamino('${escapeAttr(c.id)}')`}">
    <span class="cam-mapa">${mapaDeCamino(c, col)}</span>
    <span class="cam-cuerpo">
      ${puesto ? `<span class="cam-hecho">${selloCamino()}${tx("Ya lo tienes")}</span>` : ""}
      <span class="cam-titulo">${escapeHtml(tx(c.nombre))}</span>
      <span class="cam-uno"><b>${tx("Empiezas por")}</b><br>${escapeHtml(uno ? tx(uno.nombre) : "")}</span>
      <span class="cam-pie">
        <span class="cam-xp">+${xpDeCamino(c).toLocaleString(localeActual())} XP</span>
        <span>${c.peldanos.length} ${cajonKind === "projects" ? tx("encargos") : tx("peldaños")}</span>
        <span>${escapeHtml(tx(c.horizonte))}</span>
        <span class="cam-chapa">${escapeHtml(tx(c.pantalla))}</span>
      </span>
    </span>
  </button>`;
}

/* Abre el cajón. Lo llama `crearRama`, que es el único sitio desde el que se
   entra: el instante en que alguien va a llenar una rama vacía.

   Pide los datos aquí y no al arrancar la app, que es de lo que va todo este
   archivo. Mientras llegan se pinta «trayendo…»: son 21 KB, así que en una
   conexión normal ni se ve, pero en una mala hay que decir algo. */
async function abrirCajon(kind) {
  cajonKind = kind;
  const el = document.getElementById("cajon");
  if (!el) return;
  document.getElementById("cajon-body").innerHTML =
    `<p class="settings-note" style="text-align:center;margin:22px 0">${tx("Trayendo los caminos…")}</p>`;
  el.classList.add("show");
  revisarFondoQuieto();

  const ok = await cargarCaminos();
  if (!el.classList.contains("show")) return;      // lo cerró mientras llegaba
  if (!ok) {
    document.getElementById("cajon-body").innerHTML = `
      <div class="cajon-cab"><h3>${tx("No se pudieron traer")}</h3>
      <p>${tx("Hace falta conexión para verlos la primera vez. Después ya se quedan.")}</p></div>
      <div class="cajon-pie" style="margin-top:16px">
        <button class="btn btn-ghost" onclick="cerrarCajon()">${tx("Cerrar")}</button>
        <button class="btn btn-primary" onclick="abrirCajon('${escapeAttr(kind)}')">Reintentar</button>
      </div>`;
    return;
  }
  pintarCajon();
}

function cerrarCajon() {
  const el = document.getElementById("cajon");
  if (el) el.classList.remove("show");
  cajonKind = null;
  revisarFondoQuieto();
}

/* Los sugeridos salen de las áreas que la persona eligió en la bienvenida, que
   ya están guardadas. Los demás se ven igual: un catálogo que solo enseña lo
   tuyo encierra a la gente en la respuesta que dio un martes. */
function caminosSugeridos(lista) {
  const mias = ramasDe(cajonKind || "perks");
  return lista.filter(c => mias.includes(c.rama));
}

function pintarCajon() {
  const proy = cajonKind === "projects";
  const lista = caminosDe(moduloDe(cajonKind));

  /* Dos motivos distintos para no poder soltar uno, y cada uno con su cuadro:
     no tener plan, o tener el plan y las ramas llenas. Se mira el plan primero
     porque es el que se puede resolver. */
  const claveTope = proy ? "ramasProyectos" : "ramas";
  const cabe = cabeUnoMas(claveTope, ramasDe(cajonKind).length);
  const trabada = !planPermite("caminos") ? "caminos" : (!cabe ? claveTope : null);

  const sug = caminosSugeridos(lista);
  const resto = lista.filter(c => sug.indexOf(c) === -1);
  const rango = lista.length
    ? Math.min.apply(null, lista.map(c => c.peldanos.length)) + "-" +
      Math.max.apply(null, lista.map(c => c.peldanos.length))
    : "0";

  document.getElementById("cajon-body").innerHTML = `
    <div class="cajon-cab">
      <h3>${proy ? tx("Un proyecto nuevo") : tx("Una rama nueva")}</h3>
      <p>${proy
        ? tx("Algo que estás construyendo: una mudanza, un lanzamiento, un trámite largo. Un camino lo trae armado, con <b>los encargos en el orden en que se pueden hacer de verdad</b>.")
        : tx("Un camino la trae armada: <b>peldaños encadenados</b>, con sus pasos, sus plazos y las misiones que la alimentan. Todos salen de métodos publicados, y lo que entre se edita como cualquier cosa tuya.")}</p>
      <div class="cajon-cifras">
        <span><b>${lista.length}</b> caminos</span>
        <span><b>${rango}</b> ${proy ? "encargos" : "peldaños"}</span>
        <span><b>0</b> datos tocados</span>
      </div>
    </div>
    <div class="cajon-cuerpo">
      ${cabe ? `<button type="button" class="cam-cero" onclick="cerrarCajon();crearRamaDeCero('${escapeAttr(cajonKind)}')">
        <span>${icon("pen", 17)}</span>
        <span><b>${tx("De cero")}</b>Le pones nombre y ${proy ? "lo llenas" : "la llenas"} tú</span>
      </button>` : ""}
      ${trabada ? `<p class="cam-aviso">${trabada === "caminos"
        ? `Los caminos vienen con <b>${NOMBRE_PRO}</b>. Puedes mirarlos y quedarte con el que quieras.`
        : `Tus ${LIMITES.libre[claveTope]} ${proy ? "proyectos" : "ramas"} están llenas. Puedes mirarlos y quedarte con uno para cuando abras ${proy ? "otro" : "otra"}.`}</p>` : ""}
      ${sug.length ? `<p class="cam-rot">${tx("Por lo que elegiste al empezar")}</p>
        <div class="cam-rejilla">${sug.map(c => cartaDeCamino(c, trabada)).join("")}</div>` : ""}
      ${resto.length ? `<p class="cam-rot">${sug.length ? tx("Los demás") : tx("Los caminos")}</p>
        <div class="cam-rejilla">${resto.map(c => cartaDeCamino(c, trabada)).join("")}</div>` : ""}
      <p class="settings-note" style="text-align:left;margin:4px 0 0;font-size:11px">
        Los caminos se apoyan en métodos y principios de dominio público, y las obras
        que los describen se citan en cada uno. Norata no está afiliada a sus autores
        ni cuenta con su aval.</p>
    </div>
    <div class="cajon-pie">
      <button class="btn btn-ghost" onclick="cerrarCajon()">${tx("Cancelar")}</button>
    </div>`;
}

/* ---- La vista previa ----

   Obligatoria y no un lujo: es la misma regla que va a gobernar la IA cuando
   llegue —propone, tú confirmas—. Nada entra al tablero sin haberse visto.

   La cuenta de arriba es la promesa entera en cuatro números, y el último
   —«0 datos tocados»— es el que quita el miedo: un camino solo AÑADE. */
function verCamino(id) {
  const c = caminoPorId(id);
  if (!c) return;
  const proy = c.modulo === "proyectos";
  const col = colorDeCamino(c);
  const rama = ramaLibre(c.rama, cajonKind);
  const abiertos = c.peldanos.filter(p => !p.pide.length).length;

  document.getElementById("cajon-body").innerHTML = `
    <div class="cajon-cab" style="--c:${col}">
      <h3>${escapeHtml(tx(c.nombre))}</h3>
      <p>${tx("Esto es lo que va a entrar en tu tablero. Nada se guarda hasta que lo aceptes, y una vez dentro lo cambias como cualquier cosa tuya.")}</p>
    </div>
    <div class="cajon-cuerpo" style="--c:${col}">
      <div class="cam-cuenta">
        <span><b>${c.peldanos.length}</b>${proy ? tx("encargos") : tx("peldaños")}</span>
        <span><b>${c.misiones.length}</b>${tx("misiones")}</span>
        <span><b>1</b>${proy ? tx("proyecto nuevo") : tx("rama nueva")}</span>
        <span><b>0</b>${tx("datos tocados")}</span>
      </div>
      <div class="cam-mapa" style="border:1px solid var(--line);border-radius:var(--r-media,12px);padding:12px;margin-bottom:12px">
        ${mapaDeCamino(c, col)}
      </div>
      <p class="settings-note" style="text-align:left;margin:0 0 10px">
        ${T`Entra en <b>${escapeHtml(rama)}</b>`}${rama !== tx(c.rama)
          ? T` — «${escapeHtml(tx(c.rama))}» ya está ocupada, así que la nueva va aparte y la de antes se queda entera`
          : ""}. ${abiertos === 1 ? tx("El primer peldaño está abierto") : T`${abiertos} peldaños abiertos`}${
          tx("; el resto espera su turno.")}</p>
      <div class="cam-lista">
        ${c.peldanos.slice(0, 5).map(p => `<div>
          <span class="k">${p.n}</span>
          <span><b>${escapeHtml(tx(p.nombre))}</b> · ${p.pide.length
            ? T`pide ${p.pide.join(" y ")}` + (proy && !p.espera ? tx(", pero se puede adelantar") : "")
            : tx("abierto desde el día uno")}</span></div>`).join("")}
        ${c.peldanos.length > 5 ? `<div><span class="k">…</span><span>${
          T`y ${c.peldanos.length - 5} más, hasta «${escapeHtml(tx(c.peldanos[c.peldanos.length - 1].nombre))}»`}</span></div>` : ""}
      </div>
      <p class="cam-refe">${escapeHtml(tx(c.pantalla))}. ${
        tx("Norata no está afiliada a los autores citados ni cuenta con su aval.")}</p>
    </div>
    <div class="cajon-pie">
      <button class="btn btn-ghost" onclick="pintarCajon()">${tx("Atrás")}</button>
      <button class="btn btn-primary" onclick="ponerCamino('${escapeAttr(c.id)}')">${tx("Ponerlo en mi tablero")}</button>
    </div>`;
  document.getElementById("cajon-body").scrollTop = 0;
}

/* ---- Ponerlo en el tablero ----

   Lo que se crea es **indistinguible de lo escrito a mano**: los mismos
   objetos que salen de `savePerk()` y `saveProject()`, sin ningún campo que
   diga de dónde vinieron. Ese fue el trato desde el principio, y es lo que
   hace verdad que se edite igual que todo lo demás.

   Lo único que se apunta aparte es la rama, en `state.ui.caminos`, para poder
   marcar en el cajón cuál ya tienes. */
function ponerCamino(id) {
  const c = caminoPorId(id);
  if (!c) return;
  const proy = c.modulo === "proyectos";
  const kind = proy ? "projects" : "perks";
  const col = colorDeCamino(c);
  const hoy = todayKey();
  const rama = ramaLibre(c.rama, kind);

  /* Las habilidades que alimenta, creadas si no existen — igual que hace la
     bienvenida. Sin esto los peldaños no suben nada al cumplirse, que es la
     mitad de la gracia. */
  const ex = typeof exigenciaActual === "function" ? exigenciaActual() : { grace: 7, decay: 10 };
  const skills = (c.habilidades || []).map(nombre => {
    /* El rótulo que se GUARDA va traducido; la clave que se BUSCA, no. El
       catálogo está escrito en español y es quien decide icono y color, así
       que buscar por el nombre inglés no encontraría nada. Es lo mismo que
       hace el asistente de bienvenida. */
    const rotulo = tx(nombre);
    const ya = state.skills.find(s => {
      const n = s.name.toLowerCase();
      return n === rotulo.toLowerCase() || n === nombre.toLowerCase();
    });
    if (ya) return ya;
    const cat = typeof SKILL_CATALOG !== "undefined" ? SKILL_CATALOG.find(x => x.n === nombre) : null;
    const nueva = {
      id: uid(), name: rotulo, category: cat ? tx(cat.c) : tx("General"),
      icon: cat ? cat.i : "star", color: cat ? cat.k : col,
      xp: 0, permanent: false, graceDays: ex.grace, decayPerDay: ex.decay,
      createdAt: hoy, lastActivity: null, lastCheck: hoy, log: []
    };
    state.skills.push(nueva);
    return nueva;
  });
  const skillId = skills.length ? skills[0].id : null;

  /* En orden, guardando el id de cada uno: `requiere` va por número en los
     datos y por id en el tablero, y el generador ya garantiza que nadie
     depende de un peldaño posterior, así que una pasada basta. */
  const porNumero = {};
  const iconos = { hito: "flag", meta: "target", compra: "key" };
  c.peldanos.forEach(p => {
    const pasos = (p.pasos || []).map(t => ({ id: uid(), name: tx(t), done: false, at: null }));
    const requiere = p.pide.map(n => porNumero[n]).filter(Boolean);
    const base = {
      id: uid(), name: tx(p.nombre), branch: rama, desc: "",
      icon: iconos[p.tipo] || "flag", color: col,
      skillId: skillId, requiere: requiere, modo: "todos",
      createdAt: hoy, completedAt: null,
      history: [{ date: hoy, at: stamp(), event: proy
        ? T`Encargo creado en el proyecto ${rama}` : T`Talento creado en la rama ${rama}` }]
    };
    if (proy) {
      state.projects.push(Object.assign(base, {
        mod: "proyectos", status: "active", steps: pasos,
        xpReward: xpDePeldano(p), espera: p.espera === true, lastActivity: hoy
      }));
    } else {
      state.perks.push(Object.assign(base, {
        tipo: p.tipo, cost: p.cost || 0, planDays: p.dias || 0, steps: pasos,
        xpReward: xpDePeldano(p), status: null, startDate: null, endDate: null,
        investedTotal: 0, progress: 0
      }));
    }
    porNumero[p.n] = base.id;
  });

  /* Las misiones se crean siempre y se borran como cualquier otra: un
     interruptor por misión sería complejidad en el peor momento. */
  (c.misiones || []).forEach(m => {
    state.missions.push({
      id: uid(), name: tx(m.nombre), desc: "", icon: "bolt", color: col,
      cadence: m.cadencia === "daily" ? "daily" : "weekly",
      days: m.dias || [], target: m.cadencia === "daily" ? 1 : (m.meta || 1),
      skillId: skillId, xp: 20, log: {}, archived: false, completedAt: null,
      createdAt: hoy
    });
  });

  /* La rama, apuntada para saber cuál ya tienes. Va en `state.ui` para que
     viaje en la sincronía; `js/10-fusion.js` lo une. */
  state.ui = state.ui || {};
  state.ui.caminos = state.ui.caminos || {};
  state.ui.caminos[rama] = c.id;
  const clave = proy ? "ramasProyectos" : "ramasTalentos";
  state.ui[clave] = state.ui[clave] || [];
  if (!state.ui[clave].includes(rama)) state.ui[clave].push(rama);

  save();
  cerrarCajon();
  showView(proy ? "projects" : "tree");

  /* Una celebración de las pequeñas: se va sola a los 2,2 s y no se puede
     pulsar, así que no interrumpe. Y la segunda línea no felicita — señala el
     primer peldaño, que es lo único que se puede hacer mañana. */
  const uno = c.peldanos.find(p => !p.pide.length);
  celebrate(tx("Tu camino ya está puesto"),
    `${c.peldanos.length} ${proy ? "encargos" : "peldaños"} en «${rama}». ${
      uno ? T`Empiezas por: ${tx(uno.nombre)}` : tx("El primero ya está abierto.")}`,
    col, "map");
}
