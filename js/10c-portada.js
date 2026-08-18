/* La portada: lo primero que se ve, antes que la app */

/* ================= Portada de entrada =================
   Hasta ahora la sincronía vivía escondida en Ajustes, y eso decía algo que
   ya no es verdad: que tener cuenta era un extra. Ahora es lo primero.

   Pero no obligatorio. Se puede entrar sin cuenta y usar la app entera
   guardando solo en este dispositivo; crear la cuenta después NO pierde nada,
   porque lo que ya hay aquí es justo lo que siembra la cuenta nueva. Esa
   salida existe porque alguien que solo quería curiosear se va si lo primero
   que ve es un registro, y el ejemplo completo de Notara es lo que convence.

   Tres estados posibles, y `sync.entrada` los distingue:
     null      todavía no ha elegido  -> se ve la portada
     "local"   eligió usarla sin cuenta
     "cuenta"  entró (y entonces syncReady() también es cierto) */

/* Mínimo de 8. No es un número mágico: por debajo de ocho, una contraseña se
   adivina a fuerza bruta en un tiempo que ya no es abstracto. No hay máximo a
   propósito — limitar por arriba solo estorba a quien usa una frase larga,
   que son justo las buenas.

   Esto es la primera barrera, no la única: el servidor tiene la suya, porque
   un límite que solo vive en el navegador se salta escribiendo dos líneas. */
const CLAVE_MIN = 8;

/* Un campo de contraseña con ojo para verla. Existe porque escribir a ciegas
   una contraseña larga en el teléfono es la razón número uno por la que la
   gente acaba eligiendo una corta. */
function campoClave(id, autocompletar, marcador) {
  return `<div class="clave-campo">
      <input type="password" id="${escapeAttr(id)}" autocomplete="${escapeAttr(autocompletar)}"
             placeholder="${escapeAttr(marcador || "••••••••")}">
      <button type="button" class="clave-ojo" aria-label="Mostrar la contraseña"
              onclick="alternarClave('${escapeAttr(id)}', this)">${ojoIcono(false)}</button>
    </div>`;
}

function ojoIcono(visible) {
  return visible
    // Ojo tachado: lo que se pulsa para volver a ocultarla
    ? `<svg viewBox="0 0 24 24"><path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/><path d="M4 20L20 4"/></svg>`
    : `<svg viewBox="0 0 24 24"><path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/></svg>`;
}

function alternarClave(id, boton) {
  const el = document.getElementById(id);
  if (!el) return;
  const verla = el.type === "password";
  el.type = verla ? "text" : "password";
  boton.innerHTML = ojoIcono(verla);
  boton.setAttribute("aria-label", verla ? "Ocultar la contraseña" : "Mostrar la contraseña");
  /* Devolver el cursor donde estaba: sin esto, mirar la contraseña a media
     escritura te manda el punto de inserción al principio. */
  const fin = el.value.length;
  el.focus();
  try { el.setSelectionRange(fin, fin); } catch (e) { /* type=email no lo admite */ }
}

function portadaHaceFalta() {
  if (modoSoloLectura) return false;          // ya hay otro aviso más urgente
  if (syncReady()) return false;
  return sync.entrada !== "local";
}

function mostrarPortada() {
  if (document.getElementById("portada")) return;
  /* La misma pantalla sirve para dos momentos distintos: la primera vez que
     se abre la app, y cuando alguien que ya venía usándola sin cuenta entra a
     Ajustes a crearla. En el segundo caso "probar sin cuenta" no describe
     nada —ya estaba dentro— y la salida es simplemente volver. */
  const yaEntroSinCuenta = sync.entrada === "local";
  const cap = document.createElement("div");
  cap.id = "portada";
  cap.className = "portada";
  cap.innerHTML =
    `<div class="portada-caja">
       <img class="portada-logo" src="marca/logotipo-claro.svg" alt="Notara">
       <p class="portada-lema">Tu vida como videojuego: habilidades que suben con la práctica y metas que avanzan de verdad.</p>
       <div id="portada-error" class="portada-error" hidden></div>
       <label class="field"><span>Tu correo</span>
         <input type="email" id="portada-correo" autocomplete="username" inputmode="email" spellcheck="false" placeholder="tu@correo.com"></label>
       <div class="field"><span class="lbl">Contraseña</span>
         ${campoClave("portada-clave", "current-password")}</div>
       <div class="stack">
         <button class="btn btn-primary btn-block" id="portada-entrar" onclick="portadaEntrar()">Entrar</button>
         <button class="btn btn-soft btn-block" onclick="portadaRegistrar()">Crear cuenta</button>
       </div>
       <button class="portada-sin sutil" onclick="portadaOlvide()">¿Olvidaste tu contraseña?</button>
       <div id="portada-google"></div>
       <button class="portada-sin" onclick="portadaSinCuenta()">${yaEntroSinCuenta ? "Volver sin iniciar sesión" : "Probar sin cuenta"}</button>
       <p class="portada-nota">${yaEntroSinCuenta
         ? "Seguirás guardando solo en este dispositivo."
         : "Sin cuenta, tu progreso se guarda solo en este dispositivo. Puedes crearla después sin perder nada."}</p>
     </div>`;
  document.body.appendChild(cap);

  // Enter en cualquiera de los dos campos entra, que es lo que espera todo el mundo
  ["portada-correo", "portada-clave"].forEach(id => {
    document.getElementById(id).addEventListener("keydown", e => {
      if (e.key === "Enter") portadaEntrar();
    });
  });

  portadaOfrecerGoogle();
  setTimeout(() => { const c = document.getElementById("portada-correo"); if (c) c.focus(); }, 60);
}

function cerrarPortada() {
  const cap = document.getElementById("portada");
  if (!cap) return;
  cap.classList.add("fuera");
  setTimeout(() => cap.remove(), 260);
}

/* El aviso puede traer un botón. Hace falta para el caso más frustrante de
   todos: "falta confirmar tu correo" sin nada que pulsar deja al usuario
   buscando en un buzón donde a lo mejor el mensaje nunca llegó. */
function portadaAviso(msg, accion) {
  const el = document.getElementById("portada-error");
  if (!el) return;
  el.textContent = msg || "";
  el.hidden = !msg;
  if (msg && accion) {
    const b = document.createElement("button");
    b.className = "portada-accion";
    b.textContent = accion.etiqueta;
    b.onclick = accion.fn;
    el.appendChild(b);
  }
}

function portadaOcupada(si) {
  const b = document.getElementById("portada-entrar");
  if (b) b.disabled = !!si;
  const cap = document.getElementById("portada");
  if (cap) cap.classList.toggle("ocupada", !!si);
}

/* El botón de Google solo aparece si el proveedor está activado de verdad en
   Supabase. Se pregunta en vez de darlo por hecho: un botón que lleva a una
   pantalla de error es peor que no tener botón. */
async function portadaOfrecerGoogle() {
  const hueco = document.getElementById("portada-google");
  if (!hueco) return;
  let hay = false;
  try {
    const r = await sbFetch("/auth/v1/settings", { method: "GET" });
    hay = !!(r.ok && r.body && r.body.external && r.body.external.google);
  } catch (e) { /* sin conexión: se queda sin el botón, y hay dos formas más */ }
  if (!hay || !document.getElementById("portada-google")) return;
  hueco.innerHTML =
    `<div class="portada-o"><span>o</span></div>
     <button class="btn btn-soft btn-block portada-google" onclick="sbEntrarConGoogle()">
       <svg viewBox="0 0 48 48" aria-hidden="true">
         <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.2-3.8 6.6-9.5 6.6-16.3z"/>
         <path fill="#34A853" d="M24 46c6 0 11-2 14.6-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.5 2.1-5.8 0-10.7-3.9-12.4-9.1H4.3v5.7C7.9 41.1 15.4 46 24 46z"/>
         <path fill="#FBBC05" d="M11.6 28.1c-.4-1.3-.7-2.7-.7-4.1s.2-2.8.7-4.1v-5.7H4.3C2.8 17.1 2 20.4 2 24s.8 6.9 2.3 9.8l7.3-5.7z"/>
         <path fill="#EA4335" d="M24 10.8c3.3 0 6.2 1.1 8.5 3.3l6.3-6.3C35 4.3 30 2 24 2 15.4 2 7.9 6.9 4.3 14.2l7.3 5.7c1.7-5.2 6.6-9.1 12.4-9.1z"/>
       </svg>
       <span>Continuar con Google</span>
     </button>`;
}

async function portadaEntrar() {
  const correo = (document.getElementById("portada-correo").value || "").trim();
  const clave = document.getElementById("portada-clave").value || "";
  if (!correo || !clave) { portadaAviso("Escribe tu correo y tu contraseña."); return; }

  portadaAviso(""); portadaOcupada(true);
  try {
    sync.tipo = "supabase";
    sync.cfg = await ALMACENES.supabase.configurar({ correo: correo, clave: clave });
    portadaEntrada(correo);
  } catch (e) {
    const m = (e && e.message) || String(e);
    portadaAviso(m, /confirmar tu correo/i.test(m)
      ? { etiqueta: "Reenviar el correo", fn: portadaReenviarVerificacion }
      : null);
  } finally {
    portadaOcupada(false);
  }
}

async function portadaRegistrar() {
  const correo = (document.getElementById("portada-correo").value || "").trim();
  const clave = document.getElementById("portada-clave").value || "";
  if (!correo || !clave) { portadaAviso("Escribe tu correo y la contraseña que quieras usar."); return; }

  portadaAviso(""); portadaOcupada(true);
  try {
    const sesion = await sbRegistrar(correo, clave);
    if (!sesion) {
      portadaAviso("Cuenta creada. Te mandé un correo a " + correo + ": ábrelo, confirma, y vuelve a entrar aquí.");
      return;
    }
    sync.tipo = "supabase";
    sync.cfg = { correo: correo, sesion: sesion };
    portadaEntrada(correo);
  } catch (e) {
    portadaAviso((e && e.message) || String(e));
  } finally {
    portadaOcupada(false);
  }
}

/* Lo común a las tres formas de entrar. Lo que ya hubiera en este dispositivo
   cuenta como cambios por subir: así, quien probó sin cuenta y luego se
   registra, se lleva su progreso en vez de empezar de cero.

   Pero SOLO si esos datos son suyos. Un navegador compartido —o el mismo
   dueño con su cuenta de pruebas y la de verdad— deja aquí el progreso de
   quien entró antes, y sin esta comprobación se subiría a la cuenta que entre
   después: dos vidas mezcladas en una, y del lado del servidor todo correcto,
   porque cada fila sigue siendo de su dueño. El error estaría aquí.

   `sync.dueño` recuerda de quién es lo que hay guardado en este dispositivo.
   Sin dueño —quien probó sin cuenta— los datos no son de nadie todavía y se
   los queda quien entre. */
function portadaEntrada(correo) {
  const uid = ((sync.cfg || {}).sesion || {}).uid || null;

  if (sync.dueño && uid && sync.dueño !== uid) {
    // No se tira: se aparta donde se puede recuperar desde Ajustes
    stashConflict("otra-cuenta", state);
    guardarLocal({
      skills: [], perks: [], projects: [], missions: [], cajas: [],
      settings: { timezone: userTZ() }, schemaVersion: SCHEMA
    });
    state = load();
    toast("Este dispositivo tenía datos de otra cuenta. Los aparté y bajo los tuyos.", "atencion");
  }
  sync.dueño = uid;

  sync.device = sync.device || guessDeviceName();
  sync.enabled = true;
  sync.entrada = "cuenta";
  sync.marca = null;
  sync.rev = 0;
  sync.dirty = hasLocalData();
  sync.lastAt = null;
  saveSync();
  cerrarPortada();
  pintarAvisoPruebas();
  renderSync();
  toast("Hola de nuevo", "logro");
  syncRun({ silent: true });
}

function portadaSinCuenta() {
  sync.entrada = "local";
  saveSync();
  cerrarPortada();
  toast("Guardando solo en este dispositivo", "calma");
}

/* ---- Se me olvidó la contraseña ----
   El caso que decide si una cuenta es utilizable: sin esto, olvidar la
   contraseña es perder el progreso para siempre.

   El aviso es el mismo exista o no la cuenta. Decir "ese correo no está
   registrado" sería más amable y convertiría la pantalla en un buscador de
   quién tiene cuenta aquí: se prueban direcciones hasta que una responda
   distinto. */
async function portadaOlvide() {
  const correo = (document.getElementById("portada-correo").value || "").trim();
  if (!correo) {
    portadaAviso("Escribe arriba tu correo y vuelve a pulsar: ahí te mando el enlace.");
    document.getElementById("portada-correo").focus();
    return;
  }
  portadaAviso(""); portadaOcupada(true);
  try {
    await sbRecuperar(correo);
    portadaAviso("Si hay una cuenta con " + correo + ", te acaba de llegar un enlace para poner una contraseña nueva. Revisa también la carpeta de no deseado.");
  } catch (e) {
    portadaAviso((e && e.message) || String(e));
  } finally {
    portadaOcupada(false);
  }
}

async function portadaReenviarVerificacion() {
  const correo = (document.getElementById("portada-correo").value || "").trim();
  if (!correo) { portadaAviso("Escribe arriba tu correo."); return; }
  portadaAviso(""); portadaOcupada(true);
  try {
    await sbReenviarVerificacion(correo);
    portadaAviso("Te reenvié el correo de confirmación a " + correo + ". Míralo también en no deseado.");
  } catch (e) {
    portadaAviso((e && e.message) || String(e));
  } finally {
    portadaOcupada(false);
  }
}

/* ---- Estrenar contraseña ----
   Se llega aquí desde el enlace del correo, que trae una sesión de un solo
   uso. Tener esa sesión ES la prueba de identidad: demuestra acceso al buzón.
   Por eso no se pide la contraseña vieja — quien está aquí es justo el que no
   la recuerda. */
function mostrarNuevaClave() {
  cerrarPortada();
  const previo = document.getElementById("nueva-clave");
  if (previo) previo.remove();
  const cap = document.createElement("div");
  cap.id = "nueva-clave";
  cap.className = "portada";
  cap.innerHTML =
    `<div class="portada-caja">
       <img class="portada-logo" src="marca/logotipo-claro.svg" alt="Notara">
       <p class="portada-lema">Elige tu contraseña nueva. Con ella entrarás en todos tus dispositivos.</p>
       <div id="nc-error" class="portada-error" hidden></div>
       <div class="field"><span class="lbl">Contraseña nueva</span>
         ${campoClave("nc-clave", "new-password")}
         <div class="field-hint">Mínimo ${CLAVE_MIN} caracteres. Cuanto más larga, mejor.</div></div>
       <div class="field"><span class="lbl">Repítela</span>
         ${campoClave("nc-clave2", "new-password")}</div>
       <div class="stack">
         <button class="btn btn-primary btn-block" id="nc-ok" onclick="guardarNuevaClave()">Guardar y entrar</button>
       </div>
     </div>`;
  document.body.appendChild(cap);
  document.getElementById("nc-clave2").addEventListener("keydown", e => {
    if (e.key === "Enter") guardarNuevaClave();
  });
  /* Con guarda: el foco llega 60 ms tarde y para entonces la pantalla puede
     haberse cerrado ya (contraseña pegada y guardada de un tirón). */
  setTimeout(() => { const c = document.getElementById("nc-clave"); if (c) c.focus(); }, 60);
}

async function guardarNuevaClave() {
  const a = document.getElementById("nc-clave").value || "";
  const b = document.getElementById("nc-clave2").value || "";
  const aviso = (m) => { const el = document.getElementById("nc-error"); el.textContent = m || ""; el.hidden = !m; };

  if (a.length < CLAVE_MIN) { aviso("Necesita al menos " + CLAVE_MIN + " caracteres."); return; }
  if (a !== b) { aviso("Las dos no coinciden. Míralas con el ojito para comprobarlo."); return; }

  aviso("");
  const btn = document.getElementById("nc-ok");
  btn.disabled = true;
  try {
    await sbCambiarClave(a);
    const cap = document.getElementById("nueva-clave");
    if (cap) cap.remove();
    portadaEntrada(sync.cfg.correo);
    toast("Contraseña cambiada", "logro");
  } catch (e) {
    aviso((e && e.message) || String(e));
    btn.disabled = false;
  }
}

/* ---- Google ---- */

/* Sin biblioteca de por medio: se manda al usuario a Supabase, que lo lleva a
   Google y lo devuelve aquí con la sesión colgada del final de la dirección.
   Al volver hay que limpiarla de la barra: si se queda, cualquiera que mire
   el historial se lleva un token de sesión. */
function sbEntrarConGoogle() {
  const vuelta = location.origin + location.pathname;
  location.href = SB_URL + "/auth/v1/authorize?provider=google&redirect_to=" + encodeURIComponent(vuelta);
}

/* Todo lo que vuelve desde fuera —Google, el enlace de recuperación, el de
   confirmación de correo— aterriza aquí, colgado del final de la dirección.
   Es un solo sitio a propósito: son el mismo mecanismo con distinto motivo, y
   tenerlos separados garantizaba que uno se quedara sin el cuidado del otro.

   Lo primero es siempre borrarlo de la barra. Ese trozo lleva una sesión
   válida dentro: si se queda, viaja al historial, a lo que se comparte al
   copiar la dirección, y a cualquier cosa que la registre. */
async function sbVolverDeEnlace() {
  const h = location.hash || "";
  if (h.length < 2) return false;
  const p = new URLSearchParams(h.slice(1));
  const limpiar = () => history.replaceState(null, "", location.pathname + location.search);

  // Enlace caducado o ya usado: es lo más común después de "no me llegó"
  if (p.get("error") || p.get("error_description")) {
    limpiar();
    const d = String(p.get("error_description") || "");
    mostrarPortada();
    portadaAviso(/expired|invalid/i.test(d)
      ? "Ese enlace ya caducó o se usó. Pide uno nuevo con «¿Olvidaste tu contraseña?»."
      : d.replace(/\+/g, " "));
    return true;
  }

  if (!p.get("access_token")) return false;

  const tipo = p.get("type") || "";
  const sesion = {
    access: p.get("access_token"),
    refresh: p.get("refresh_token"),
    expira: Date.now() + ((Number(p.get("expires_in")) || 3600) - 60) * 1000,
    uid: null
  };
  limpiar();

  let datos = null;
  try {
    const r = await sbFetch("/auth/v1/user", { headers: { "Authorization": "Bearer " + sesion.access } });
    if (!r.ok) throw new Error("no pude leer la cuenta");
    datos = r.body;
  } catch (e) {
    mostrarPortada();
    portadaAviso("El enlace era válido pero no pude terminar de entrar. Inténtalo otra vez.");
    return true;
  }

  sesion.uid = datos.id;
  sync.tipo = "supabase";
  sync.cfg = { correo: datos.email || "tu cuenta", sesion: sesion };

  /* Recuperación: la sesión sirve para UNA cosa, poner contraseña nueva. No se
     entra a la app todavía. Si alguien deja el enlace abierto y se va, lo peor
     que hay en pantalla es un formulario vacío, no su progreso. */
  if (tipo === "recovery") {
    saveSync();
    mostrarNuevaClave();
    return true;
  }

  portadaEntrada(sync.cfg.correo);
  return true;
}

/* ---- Cuenta de pruebas ----
   Eduardo usa una cuenta para experimentar (y ahí borra todo cada dos por
   tres) y otra para su vida real. El riesgo no es técnico sino humano:
   borrar en la que no era. Por eso el aviso es imposible de no ver y se
   dibuja igual que un grupo del árbol de talentos —marco punteado amarillo
   rodeando lo que abarca—, que es lenguaje que ya conoce. */

function correoActual() {
  return ((sync.cfg || {}).correo || "").toLowerCase();
}

function esCuentaDePruebas() {
  if (!syncReady()) return false;
  const lista = sync.cuentasPrueba || [];
  return lista.indexOf(correoActual()) !== -1;
}

/* La marca va por correo y no como un simple sí/no del dispositivo: en la misma
   computadora se usan las dos cuentas, y un interruptor suelto se quedaría
   puesto al cambiar de una a otra, que es exactamente el accidente que esto
   trata de evitar. */
function marcarCuentaDePruebas(si) {
  const correo = correoActual();
  if (!correo) return;
  let lista = (sync.cuentasPrueba || []).filter(c => c !== correo);
  if (si) lista.push(correo);
  sync.cuentasPrueba = lista;
  saveSync();
  pintarAvisoPruebas();
  renderSync();
}

function pintarAvisoPruebas() {
  const previo = document.getElementById("aviso-pruebas");
  if (previo) previo.remove();
  if (!esCuentaDePruebas()) return;

  const marco = document.createElement("div");
  marco.id = "aviso-pruebas";
  marco.className = "aviso-pruebas";
  marco.innerHTML = '<span class="ap-tag">Cuenta de pruebas</span>';
  document.body.appendChild(marco);
}
