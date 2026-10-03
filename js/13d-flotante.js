/* ================= La burbuja de la computadora (0.7.200, en prueba) =================
   Lo pidió Eduardo: algo que te siga en la computadora como la burbuja de
   Messenger, que se sienta parte de Norata y sin la barra del navegador
   encima. En el teléfono y la tableta no: ahí avisa el sistema.

   **Es una ventana de Picture-in-Picture de documento**
   (`documentPictureInPicture`, Chrome y Edge de escritorio). Es la misma
   ventanita flotante de los videos, pero con lo que la página quiera
   dentro, y se queda encima de todo. Tres cosas que no se pueden cambiar y
   que conviene saber antes de tocarla:

   - **Lleva una tira mínima arriba**, con el sitio y la X. La pone el
     navegador y no hay forma de quitarla desde una página. Quitarla del
     todo pide una app de escritorio (Tauri), que es el camino B.
   - **Solo se abre con un clic tuyo.** Ningún sitio puede sacarla solo.
   - **Vive mientras Norata esté abierta.** Corre en esta página, así que
     al cerrar la pestaña o recargar (cambiar de tema recarga) se cierra.

   **No tiene estado propio.** Lo que se ve sale de las mismas funciones que
   pintan el Pomodoro y Misiones, y sus botones llaman a las mismas que los
   de la app (`jIniciar`, `jPausa`, `jSiguiente`, `logMission`). Así no hay
   dos versiones de lo que significa pausar, ni dos verdades que sincronizar.

   **Se repinta por PARTES y solo lo que cambió.** Se mira cada segundo,
   porque la cuenta del reloj cambia cada segundo; pero si cada vuelta
   rehiciera los botones, un clic que empieza en uno y termina en el nuevo
   se pierde. Cada parte guarda lo último que pintó y solo se toca si es
   distinto, así que los botones se quedan quietos mientras el número corre.

   Nace solo para la casa: sale en la cuenta de pruebas, y en la cuenta
   administradora con `?flotante=si` (se apaga con `?flotante=no`), con su
   rótulo. Lo que hay que borrar al encenderla para todos está en la entrada
   de 0.7.200 de VERSIONES.md. */

function fltEnPrueba() {
  try { return sessionStorage.getItem("norata-prueba-flotante") === "si"; } catch (e) { return false; }
}

/* Solo con ratón y en un navegador que la sepa abrir. `pointer: fine` y no el
   ancho de la pantalla: una tableta apaisada es ancha y no tiene dónde
   ponerla; un portátil pequeño es estrecho y sí. Y nunca en el APK, que en
   Android no la tiene y allí ya avisa la cortina. */
function fltDisponible() {
  return "documentPictureInPicture" in window &&
    window.matchMedia("(pointer: fine)").matches &&
    !(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
}

let fltVentana = null;
let fltPartes = {};

/* Solo para la casa mientras se prueba (Eduardo: «se debiera ver solo en la
   cuenta admin de pruebas»). Sale sola en la cuenta de pruebas; en la cuenta
   administradora de verdad, con `?flotante=si`; y para nadie más, aunque
   escriba el parámetro. Lo decide el servidor (`esAdmin`), que contesta un
   momento después de arrancar: por eso `revisarAdmin` vuelve a llamar aquí. */
function fltParaEstaCuenta() {
  if (typeof esCuentaDePruebas === "function" && esCuentaDePruebas()) return true;
  return typeof esAdmin !== "undefined" && esAdmin && fltEnPrueba();
}

function fltPintarBoton() {
  const b = document.getElementById("nav-flotante");
  if (b) b.hidden = !(fltParaEstaCuenta() && fltDisponible());
  if (b) b.classList.toggle("on", !!fltVentana);
}

/* Los estilos de la burbuja. Ningún color ni radio suelto: todo sale de las
   variables de la app, así que el mundo, la paleta y el modo claro llegan
   solos con las hojas que se copian. La letra de la cifra es la del mundo
   (`--tipo-cifra`), como en el reloj de dentro: aquí sí es la web, y la
   regla de usar solo Outfit era de los avisos de Android, que no la tienen. */
const FLT_CSS = `
  html, body.flt { height: 100%; }
  body.flt {
    margin: 0; padding: 0; min-height: 0;
    background: var(--sup-pagina); color: var(--text);
    font-family: var(--sans); overflow-y: auto; overflow-x: hidden;
  }
  .flt-caja { display: flex; flex-direction: column; gap: 10px; padding: 12px; }
  .flt-tarjeta {
    background: var(--sup-tarjeta); border: var(--borde-fino) solid var(--line);
    border-radius: var(--r-grande); padding: 12px 14px;
  }
  .flt-tarjeta[hidden] { display: none; }
  .flt-rot {
    font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
    color: var(--mint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .flt-rot .pausa { color: var(--estado-curso-tinta); }
  .flt-cifra {
    font-family: var(--tipo-cifra, var(--sans)); font-variant-numeric: tabular-nums;
    font-size: 44px; font-weight: 700; line-height: 1.05; margin: 4px 0 2px;
  }
  .flt-cifra.horas { font-size: 36px; }
  .flt-sub { font-size: 13px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .flt-barra { height: 6px; border-radius: var(--r-redondo); background: var(--carril); margin: 10px 0 12px; overflow: hidden; }
  .flt-barra i { display: block; height: 100%; width: 0; border-radius: inherit; background: var(--mint); }
  .flt-barra.pausa i { background: var(--estado-curso); }
  .flt-acc { display: flex; gap: 8px; }
  .flt-acc .btn { flex: 1; min-width: 0; padding: 9px 10px; font-size: 13px; gap: 6px; justify-content: center; }
  .flt-acc .btn svg { width: 15px; height: 15px; }
  .flt-fila { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .flt-punto { width: 10px; height: 10px; border-radius: var(--r-redondo); flex: none; }
  .flt-luego b { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0; }
  .flt-luego span { font-size: 12px; color: var(--muted); white-space: nowrap; }
  .flt-cab { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
  .flt-lista { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
  .flt-mision {
    display: flex; align-items: center; gap: 10px; width: 100%; min-width: 0;
    background: none; border: 0; border-radius: var(--r-chico); padding: 6px 4px;
    color: var(--text); font: inherit; font-size: 14px; text-align: left; cursor: pointer;
  }
  .flt-mision:hover { background: var(--mint-soft); }
  .flt-mision .t { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .flt-mision.hecha .t { color: var(--muted); text-decoration: line-through; }
  .flt-check {
    width: 20px; height: 20px; flex: none; border-radius: var(--r-redondo);
    border: 2px solid var(--muted); display: grid; place-items: center;
    font-size: 10px; font-weight: 700; color: var(--muted);
  }
  .flt-mision.hecha .flt-check { background: var(--estado-hecho); border-color: var(--estado-hecho); color: var(--sobre-estado); }
  .flt-check svg { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
  .flt-vacio { font-size: 13px; color: var(--muted); margin: 2px 0 0; }
  .flt-vacio.hecho { color: var(--estado-hecho-tinta); font-weight: 600; }
  .flt-mas { background: none; border: 0; padding: 6px 4px 0; color: var(--mint); font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; }
`;

async function abrirFlotante() {
  if (fltVentana) { try { fltVentana.focus(); } catch (e) {} return; }
  if (!fltDisponible() || !fltParaEstaCuenta()) return;
  let w;
  try { w = await documentPictureInPicture.requestWindow({ width: 300, height: 420 }); }
  catch (e) { toast(tx("Tu navegador no dejó abrir la burbuja.")); return; }
  fltVentana = w;
  fltPartes = {};
  const d = w.document;

  /* Las hojas de la app, enteras: así la burbuja va vestida del mundo puesto
     sin repetir una sola regla. Con la dirección ABSOLUTA, porque la ventana
     nueva nace en blanco y una relativa no sabría desde dónde pedirse. */
  document.querySelectorAll('link[rel="stylesheet"], style').forEach(n => {
    if (n.tagName === "LINK") {
      const l = d.createElement("link");
      l.rel = "stylesheet"; l.href = n.href;
      d.head.appendChild(l);
    } else {
      const s = d.createElement("style");
      s.textContent = n.textContent;
      d.head.appendChild(s);
    }
  });
  const st = d.createElement("style");
  st.textContent = FLT_CSS;
  d.head.appendChild(st);

  /* El aspecto vive en `<html>` —el modo claro, el mundo, la paleta, Arcade—
     y se copia tal cual, menos las clases de la carga, que no pintan aquí. */
  const h = document.documentElement;
  d.documentElement.className = [...h.classList].filter(c => !/^carga/.test(c)).join(" ");
  for (const a of h.attributes) {
    if (a.name.startsWith("data-") || a.name === "lang" || a.name === "style") d.documentElement.setAttribute(a.name, a.value);
  }
  d.title = "Norata";
  d.body.className = "flt";
  d.body.innerHTML = `<main class="flt-caja">
      <section class="flt-tarjeta" id="flt-reloj" hidden>
        <div class="flt-rot" id="flt-rot"></div>
        <div class="flt-cifra" id="flt-cifra"></div>
        <div class="flt-sub" id="flt-sub"></div>
        <div class="flt-barra" id="flt-barra"><i></i></div>
        <div class="flt-acc" id="flt-acc"></div>
      </section>
      <section class="flt-tarjeta flt-luego" id="flt-luego" hidden></section>
      <section class="flt-tarjeta" id="flt-hoy" hidden></section>
    </main>`;
  d.body.addEventListener("click", fltClic);

  fltPintar();
  /* El reloj de la burbuja corre en SU ventana y no en la de la app: con la
     pestaña de Norata escondida, Chrome frena los relojes de esa pestaña
     hasta uno por minuto, y la burbuja —que está a la vista— se quedaría
     congelada justo cuando más se mira. */
  const tic = w.setInterval(fltPintar, 1000);
  w.addEventListener("pagehide", () => {
    w.clearInterval(tic);
    fltVentana = null; fltPartes = {};
    fltPintarBoton();
  });
  fltPintarBoton();
}

/* Una parte se toca solo si cambió (ver arriba: es lo que deja quietos los
   botones). `modo` dice qué se escribe: el HTML de dentro o solo el texto. */
function fltParte(id, valor, modo) {
  if (fltPartes[id] === valor) return;
  fltPartes[id] = valor;
  const el = fltVentana.document.getElementById(id);
  if (!el) return;
  if (modo === "texto") el.textContent = valor;
  else el.innerHTML = valor;
}
function fltMostrar(id, ver) {
  const el = fltVentana.document.getElementById(id);
  if (el && el.hidden === ver) el.hidden = !ver;
}

function fltPintar() {
  if (!fltVentana) return;
  /* Con la pestaña de Norata escondida, su paso del Pomodoro va frenado y el
     final de una fase podía llegar con un minuto de retraso. Lo empuja la
     burbuja, que sí corre: `jPaso` ya está hecho para correr de más. */
  if (document.hidden && typeof jPaso === "function") { try { jPaso(); } catch (e) {} }
  try { fltPintarReloj(); } catch (e) { fltMostrar("flt-reloj", false); }
  try { fltPintarLuego(); } catch (e) { fltMostrar("flt-luego", false); }
  try { fltPintarHoy(); } catch (e) { fltMostrar("flt-hoy", false); }
}

function fltBoton(nivel, texto, accion, svg) {
  return `<button type="button" class="btn btn-${nivel}" data-flt="${accion}">${svg || ""}${escapeHtml(texto)}</button>`;
}

function fltPintarReloj() {
  const ver = typeof jornadaEncendida === "function" && jornadaEncendida();
  fltMostrar("flt-reloj", ver);
  if (!ver) return;
  const j = jDatos(), run = j.run;
  /* Mirar la burbuja no cambia el día que estás viendo en el Pomodoro, pero
     su centro sí lo lee: aquí siempre se habla de hoy. */
  const antes = jDiaSel;
  jDiaSel = null;
  let s;
  try { s = jEstadoCentro(); } finally { jDiaSel = antes; }
  const pausa = s.fc === "pausa";
  fltParte("flt-rot", `<span class="${pausa ? "pausa" : ""}">${escapeHtml(s.f)}</span>`);
  fltParte("flt-cifra", s.t, "texto");
  const cifra = fltVentana.document.getElementById("flt-cifra");
  if (cifra) cifra.classList.toggle("horas", s.t.length > 5);
  fltParte("flt-sub", s.sub || "", "texto");
  const barra = fltVentana.document.getElementById("flt-barra");
  if (barra) {
    barra.classList.toggle("pausa", pausa);
    barra.hidden = !run || run.fase === "listo";
    barra.firstChild.style.width = Math.round((s.prog || 0) * 1000) / 10 + "%";
  }

  /* Los botones siguen la regla de los avisos de Android: Pausa en amarillo,
     lo que se viene a hacer en la menta, y ninguno coral. Abandonar no está:
     una ventana pequeña encima de otra cosa es el peor sitio para un botón
     sin vuelta, y para eso está la app. */
  const abrir = fltBoton("linea", tx("Abrir"), "abrir-jornada");
  let acc = abrir;
  if (!run) {
    if (!j.dormido && !jDescansoAhora() && jModo() !== "lite") acc = fltBoton("primary", tx("Iniciar"), "iniciar", J_PLAY) + abrir;
  } else if (run.fase === "foco") {
    acc = (run.seg ? fltBoton("aviso", tx("Pausa"), "pausa", J_PAUSA) : fltBoton("primary", tx("Seguir"), "pausa", J_PLAY)) + abrir;
  } else if (run.fase === "listo" && !run.lite) {
    acc = fltBoton("primary", tx("Iniciar"), "iniciar", J_PLAY) + abrir;
  } else if (run.fase === "descanso" && !run.lite) {
    acc = fltBoton("ghost", tx("Saltar"), "saltar") + abrir;
  }
  fltParte("flt-acc", acc);
}

function fltPintarLuego() {
  const ver = typeof jornadaEncendida === "function" && jornadaEncendida();
  const b = ver ? jSiguienteBloque() : null;
  fltMostrar("flt-luego", !!b);
  if (!b) return;
  fltParte("flt-luego", `<div class="flt-fila">
      <span class="flt-punto" style="background:${jColorBloque(b)}"></span>
      <b>${escapeHtml(jNombreBloque(b))}</b>
      <span>${escapeHtml(T`Después · ${jH12(b.ini)}`)}</span>
    </div>`);
}

const FLT_MAX_MISIONES = 6;
function fltPintarHoy() {
  const ver = typeof moduloUsable === "function" && moduloUsable("missions");
  fltMostrar("flt-hoy", ver);
  if (!ver) return;
  const key = todayKey();
  const hoy = ordenarMisiones(state.missions.filter(missionDueToday));
  /* Lo que falta, arriba; lo cumplido, abajo y tachado. Es una lista para
     saber qué queda, no un registro de lo hecho. */
  const lista = hoy.filter(m => !missionDone(m, key)).concat(hoy.filter(m => missionDone(m, key)));
  const hechas = hoy.length - hoy.filter(m => !missionDone(m, key)).length;
  let h = `<div class="flt-cab"><span class="flt-rot">${escapeHtml(hoy.length ? T`Hoy · ${hechas} de ${hoy.length}` : tx("Hoy"))}</span></div>`;
  if (!hoy.length) h += `<p class="flt-vacio">${escapeHtml(tx("Nada programado para hoy."))}</p>`;
  else if (hechas === hoy.length) h += `<p class="flt-vacio hecho">${escapeHtml(tx("Todo lo de hoy, cumplido."))}</p>`;
  if (hechas < hoy.length) {
    h += `<ul class="flt-lista">${lista.slice(0, FLT_MAX_MISIONES).map(m => {
      const c = missionCount(m, key), t = missionTarget(m), ok = c >= t;
      const dentro = ok ? PALOMITA : t > 1 ? `${c}/${t}` : "";
      return `<li><button type="button" class="flt-mision${ok ? " hecha" : ""}" data-flt="mision" data-id="${escapeAttr(m.id)}">
          <span class="flt-check">${dentro}</span><span class="t">${escapeHtml(m.name)}</span></button></li>`;
    }).join("")}</ul>`;
    if (lista.length > FLT_MAX_MISIONES) {
      h += `<button type="button" class="flt-mas" data-flt="abrir-missions">${escapeHtml(T`y ${lista.length - FLT_MAX_MISIONES} más`)}</button>`;
    }
  }
  fltParte("flt-hoy", h);
}

function fltClic(e) {
  const btn = e.target.closest("[data-flt]");
  if (!btn) return;
  const a = btn.dataset.flt, j = jDatos();
  /* Iniciar va directo, sin la salida de «3, 2, 1»: esa cuenta se dibuja en la
     ventana de la app, que con la burbuja puesta casi nunca es la que miras. */
  if (a === "iniciar") jIniciar();
  else if (a === "pausa" && j.run) jPausa();
  else if (a === "saltar" && j.run) jSiguiente();
  else if (a === "mision") {
    const m = state.missions.find(x => x.id === btn.dataset.id);
    if (!m) return;
    const key = todayKey();
    /* Igual que el círculo de la app: una de un solo golpe se deshace en el
       mismo sitio; una de cuenta solo suma, porque quitar una vez no es
       revertirla. */
    if (!missionDone(m, key)) logMission(m.id, 1);
    else if (missionTarget(m) === 1) logMission(m.id, -1);
  }
  else if (a.startsWith("abrir-")) {
    irAModulo(a.slice(6));
    try { window.focus(); } catch (err) {}
  }
  fltPintar();
}

/* El botón de la barra lateral. Se mira al cargar y al volver a la pestaña:
   lo que se puede o no abrir no cambia mientras tanto. */
document.addEventListener("DOMContentLoaded", fltPintarBoton);
if (document.readyState !== "loading") fltPintarBoton();
