/* La portada: lo primero que se ve, antes que la app */

/* ================= Portada de entrada =================
   Hasta ahora la sincronía vivía escondida en Ajustes, y eso decía algo que
   ya no es verdad: que tener cuenta era un extra. Ahora es lo primero.

   Pero no obligatorio. Se puede entrar sin cuenta y usar la app entera
   guardando solo en este aparato; crear la cuenta después NO pierde nada,
   porque lo que ya hay aquí es justo lo que siembra la cuenta nueva. Esa
   salida existe porque alguien que solo quería curiosear se va si lo primero
   que ve es un registro, y el ejemplo completo de Notara es lo que convence.

   Tres estados posibles, y `sync.entrada` los distingue:
     null      todavía no ha elegido  -> se ve la portada
     "local"   eligió usarla sin cuenta
     "cuenta"  entró (y entonces syncReady() también es cierto) */

function portadaHaceFalta() {
  if (modoSoloLectura) return false;          // ya hay otro aviso más urgente
  if (syncReady()) return false;
  return sync.entrada !== "local";
}

function mostrarPortada() {
  if (document.getElementById("portada")) return;
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
       <label class="field"><span>Contraseña</span>
         <input type="password" id="portada-clave" autocomplete="current-password" placeholder="••••••••"></label>
       <div class="stack">
         <button class="btn btn-primary btn-block" id="portada-entrar" onclick="portadaEntrar()">Entrar</button>
         <button class="btn btn-soft btn-block" onclick="portadaRegistrar()">Crear cuenta</button>
       </div>
       <div id="portada-google"></div>
       <button class="portada-sin" onclick="portadaSinCuenta()">Probar sin cuenta</button>
       <p class="portada-nota">Sin cuenta, tu progreso se guarda solo en este aparato. Puedes crearla después sin perder nada.</p>
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

function portadaAviso(msg) {
  const el = document.getElementById("portada-error");
  if (!el) return;
  el.textContent = msg || "";
  el.hidden = !msg;
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
    portadaAviso((e && e.message) || String(e));
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

/* Lo común a las tres formas de entrar. Lo que ya hubiera en este aparato
   cuenta como cambios por subir: así, quien probó sin cuenta y luego se
   registra, se lleva su progreso en vez de empezar de cero. */
function portadaEntrada(correo) {
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
  toast("Guardando solo en este aparato", "calma");
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

async function sbVolverDeGoogle() {
  const h = location.hash || "";
  if (h.indexOf("access_token=") === -1) return false;

  const p = new URLSearchParams(h.slice(1));
  const sesion = {
    access: p.get("access_token"),
    refresh: p.get("refresh_token"),
    expira: Date.now() + ((Number(p.get("expires_in")) || 3600) - 60) * 1000,
    uid: null
  };
  // Fuera de la barra de direcciones antes de nada más
  history.replaceState(null, "", location.pathname + location.search);

  try {
    const r = await sbFetch("/auth/v1/user", { headers: { "Authorization": "Bearer " + sesion.access } });
    if (!r.ok) throw new Error("no pude leer la cuenta");
    sesion.uid = r.body.id;
    sync.tipo = "supabase";
    sync.cfg = { correo: r.body.email || "tu cuenta de Google", sesion: sesion };
    portadaEntrada(sync.cfg.correo);
    return true;
  } catch (e) {
    toast("Google te identificó, pero no pude terminar de entrar. Inténtalo otra vez.", "atencion");
    return false;
  }
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

/* La marca va por correo y no como un simple sí/no del aparato: en la misma
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
