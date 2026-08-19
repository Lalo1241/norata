/* La portada: lo primero que se ve, antes que la app */

/* ================= Portada de entrada =================
   Hasta ahora la sincronía vivía escondida en Ajustes, y eso decía algo que
   ya no es verdad: que tener cuenta era un extra. Ahora es lo primero.

   Pero no obligatorio. Se puede entrar sin cuenta y usar la app entera
   guardando solo en este dispositivo; crear la cuenta después NO pierde nada,
   porque lo que ya hay aquí es justo lo que siembra la cuenta nueva. Esa
   salida existe porque alguien que solo quería curiosear se va si lo primero
   que ve es un registro, y el ejemplo completo de Norata es lo que convence.

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

/* ================= Pantalla de carga =================
   Una sola para toda la app, y ya está en el marcado antes de que corra
   ningún script (ver `#carga` en index.html): si naciera aquí llegaría tarde,
   justo al instante que se quiere cubrir.

   Se usa en dos sitios y no más: al abrir la app y al entrar a una cuenta.
   Son las únicas esperas de Norata que dependen de la red y que terminan
   cambiando la pantalla entera; lo demás pasa en este dispositivo y se
   resuelve antes de que dé tiempo a mirar. */

/* Cada vez que se enseña o se esconde se cuenta un turno: así, si vuelve a
   hacer falta a mitad del desvanecido, el temporizador viejo ya no la apaga. */
let cargaTurno = 0;

function cargaVisible() {
  const el = document.getElementById("carga");
  return !!(el && !el.classList.contains("oculta") && !el.classList.contains("fuera"));
}

function cargaMostrar(mensaje) {
  const el = document.getElementById("carga");
  if (!el) return;
  cargaTurno++;
  const msg = document.getElementById("carga-msg");
  if (msg) msg.textContent = mensaje || "Un momento…";
  el.classList.remove("oculta", "fuera");
}

/* `seca` la quita de golpe, sin desvanecido. Es lo correcto cuando quien
   releva —la portada— ya tapa lo mismo: encadenar dos desvanecidos enseña un
   instante lo que hay debajo, que es justo el parpadeo que se quiere quitar. */
function cargaCerrar(seca) {
  const el = document.getElementById("carga");
  if (!el || el.classList.contains("oculta")) return;
  const mio = ++cargaTurno;
  if (seca) { el.classList.add("oculta"); el.classList.remove("fuera"); return; }
  el.classList.add("fuera");
  setTimeout(() => {
    if (cargaTurno !== mio) return;      // volvió a hacer falta mientras se iba
    el.classList.add("oculta");
    el.classList.remove("fuera");
  }, 300);
}

function portadaHaceFalta() {
  if (modoSoloLectura) return false;          // ya hay otro aviso más urgente
  if (syncReady()) return false;
  return sync.entrada !== "local";
}

/* En qué pantalla está la portada: "entrar", "crear" o "enviado".

   Antes las dos primeras eran una sola con dos botones debajo, y eso hacía
   algo que nadie pedía: «Crear cuenta» daba de alta ahí mismo con lo que ya
   estuviera escrito. Sin repetir la contraseña —así que una errata al
   teclearla se convertía en una cuenta a la que ya no se podía entrar— y con
   el correo del intento anterior, si venías de equivocarte al entrar. */
let portadaModo = "entrar";
// Lo escrito no se pierde al cambiar de pantalla
let portadaCorreo = "";
let portadaNombre = "";
let portadaApodo = "";

function portadaCorreoValor() {
  const el = document.getElementById("portada-correo");
  if (el) return (el.value || "").trim();
  return portadaCorreo;
}

/* Antes de repintar hay que rescatar lo escrito, porque el repintado tira los
   campos. Está en una función y no repetido en cada sitio para que no se
   quede uno fuera al añadir el siguiente. */
function portadaRecordar() {
  portadaCorreo = portadaCorreoValor();
  const n = document.getElementById("portada-nombre");
  const a = document.getElementById("portada-apodo");
  if (n) portadaNombre = n.value || "";
  if (a) portadaApodo = a.value || "";
}

function valorDe(id) {
  const el = document.getElementById(id);
  return el ? (el.value || "") : "";
}

function mostrarPortada(modo) {
  if (document.getElementById("portada")) return;
  const cap = document.createElement("div");
  cap.id = "portada";
  cap.className = "portada";
  /* Si releva a la pantalla de carga entra sin desvanecido: las dos tapan lo
     mismo con el mismo fondo, así que el cambio no se nota. Abierta desde
     Ajustes, en cambio, sí hay algo debajo y el desvanecido explica de dónde
     sale. */
  if (cargaVisible()) cap.classList.add("sin-anim");
  document.body.appendChild(cap);
  portadaPintar(modo || "entrar");
  cargaCerrar(true);
}

function portadaPintar(modo) {
  const cap = document.getElementById("portada");
  if (!cap) return;
  portadaModo = modo;
  cap.classList.remove("ocupada");

  /* La misma pantalla sirve para dos momentos distintos: la primera vez que
     se abre la app, y cuando alguien que ya venía usándola sin cuenta entra a
     Ajustes a crearla. En el segundo caso "probar sin cuenta" no describe
     nada —ya estaba dentro— y la salida es simplemente volver. */
  const yaEntroSinCuenta = sync.entrada === "local";
  const correo = escapeAttr(portadaCorreo);
  let dentro;

  if (modo === "crear") {
    /* El nombre va PRIMERO, antes que el correo. No es capricho de orden: es
       la única pregunta del formulario que no es un trámite, y abrir por ahí
       cambia lo que parece la pantalla. Además es el dato que hace falta
       antes que ningún otro, porque el correo de confirmación sale del
       servidor en el mismo momento del alta y ya lo lleva dentro.

       El apodo es opcional de verdad —se puede dejar en blanco y no pasa
       nada—, y su ayuda dice qué usaremos si se deja vacío en vez de callarlo:
       nadie escribe un apodo si no sabe qué se evita con él. */
    dentro =
      `<div class="portada-cab">
         <button class="portada-volver" onclick="portadaIrA('entrar')" aria-label="Volver a iniciar sesión">←</button>
         <h2>Crear tu cuenta</h2>
       </div>
       <div id="portada-error" class="portada-error" hidden></div>
       <label class="field"><span>¿Cómo te llamas?</span>
         <input type="text" id="portada-nombre" value="${escapeAttr(portadaNombre)}" autocomplete="name"
                maxlength="${NOMBRE_MAX}" placeholder="Tu nombre"></label>
       <label class="field"><span>¿Cómo te decimos? <i>opcional</i></span>
         <input type="text" id="portada-apodo" value="${escapeAttr(portadaApodo)}" autocomplete="nickname"
                maxlength="${APODO_MAX}" placeholder="Tu apodo">
         <div class="field-hint" id="portada-apodo-hint"></div></label>
       <label class="field"><span>Tu correo</span>
         <input type="email" id="portada-correo" value="${correo}" autocomplete="email" inputmode="email" spellcheck="false" placeholder="tu@correo.com"></label>
       <div class="field"><span class="lbl">Contraseña</span>
         ${campoClave("portada-clave", "new-password")}
         <div class="field-hint">Mínimo ${CLAVE_MIN} caracteres. Cuanto más larga, mejor.</div></div>
       <div class="field"><span class="lbl">Repítela</span>
         ${campoClave("portada-clave2", "new-password")}</div>
       <div class="stack">
         <button class="btn btn-primary btn-block" id="portada-ok" onclick="portadaRegistrar()">Crear cuenta</button>
       </div>
       <p class="portada-nota">Te mandaré un correo para confirmar que la dirección es tuya. Hasta que lo abras, la cuenta no se activa.</p>
       <p class="portada-pie">¿Ya tienes una? <button onclick="portadaIrA('entrar')">Entra aquí</button></p>`;

  } else if (modo === "enviado") {
    /* Pantalla propia y no un aviso amarillo dentro del formulario: lo único
       que queda por hacer está en otro sitio —el buzón—, y un formulario
       delante invita a seguir intentándolo aquí. */
    dentro =
      `<div class="portada-sello">
         <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.6" y="5" width="18.8" height="14" rx="2.6"/><path d="M3.4 7l7.4 5.4a2 2 0 002.4 0L20.6 7"/></svg>
       </div>
       <h2>Revisa tu correo</h2>
       <p class="portada-lema">Le mandé un mensaje a <b>${escapeHtml(portadaCorreo)}</b>. Ábrelo, pulsa el enlace, y vuelve aquí a entrar.</p>
       <div id="portada-error" class="portada-error" hidden></div>
       <div class="stack">
         <button class="btn btn-primary btn-block" onclick="portadaIrA('entrar')">Ya lo confirmé: entrar</button>
         <button class="btn btn-soft btn-block" id="portada-ok" onclick="portadaReenviarVerificacion()">Reenviar el correo</button>
       </div>
       <p class="portada-nota">Si no aparece en unos minutos, míralo en la carpeta de no deseado.</p>`;

  } else {
    /* Quien ya entró alguna vez en este dispositivo se encuentra su nombre y
       su correo puestos, y solo tiene que escribir la contraseña. Es el caso
       normal —la sesión caduca, el teléfono se reinicia— y hasta ahora la
       pantalla lo trataba igual que a un desconocido.

       Solo el saludo y el correo: la contraseña no se guarda aquí ni se
       guardará nunca. Y con salida, porque el dispositivo se presta y "no soy
       yo" tiene que estar a la vista sin tener que borrar un campo a mano. */
    const vuelve = !!(sync.ultimoSaludo && sync.ultimoCorreo);
    dentro = vuelve
      ? `<div class="portada-vuelve">
           ${avatarPinta(sync.ultimoUid, sync.ultimoSaludo, sync.ultimoCorreo, 56)}
           <h2>Hola de nuevo, ${escapeHtml(sync.ultimoSaludo)}</h2>
           <p class="portada-lema">Escribe tu contraseña y sigues donde lo dejaste.</p>
         </div>`
      : `<img class="portada-logo" src="marca/logotipo-claro.svg" alt="Norata">
         <p class="portada-lema">Tu vida como videojuego: habilidades que suben con la práctica y metas que avanzan de verdad.</p>`;
    dentro +=
      `<div id="portada-error" class="portada-error" hidden></div>
       <label class="field"><span>Tu correo</span>
         <input type="email" id="portada-correo" value="${correo || (vuelve ? escapeAttr(sync.ultimoCorreo) : "")}" autocomplete="username" inputmode="email" spellcheck="false" placeholder="tu@correo.com"></label>
       <div class="field"><span class="lbl">Contraseña</span>
         ${campoClave("portada-clave", "current-password")}</div>
       <div class="stack">
         <button class="btn btn-primary btn-block" id="portada-ok" onclick="portadaEntrar()">Entrar</button>
       </div>
       <button class="portada-sin sutil" onclick="portadaOlvide()">¿Olvidaste tu contraseña?</button>
       ${vuelve ? '<button class="portada-sin sutil" onclick="portadaNoSoyYo()">No soy ' + escapeHtml(sync.ultimoSaludo) + '</button>' : ""}
       <div id="portada-google"></div>
       <p class="portada-pie">¿Todavía no tienes cuenta? <button onclick="portadaIrA('crear')">Créala aquí</button></p>
       <button class="portada-sin" onclick="portadaSinCuenta()">${yaEntroSinCuenta ? "Volver sin iniciar sesión" : "Probar sin cuenta"}</button>
       <p class="portada-nota">${yaEntroSinCuenta
         ? "Seguirás guardando solo en este dispositivo."
         : "Sin cuenta, tu progreso se guarda solo en este dispositivo. Puedes crear una cuenta cuando quieras y llevártelo."}</p>`;
  }

  cap.innerHTML = `<div class="portada-caja">${dentro}</div>`;

  // Enter en cualquier campo hace lo mismo que el botón grande de esa pantalla
  cap.querySelectorAll("input").forEach(el => {
    el.addEventListener("keydown", e => {
      if (e.key !== "Enter") return;
      if (portadaModo === "crear") portadaRegistrar(); else portadaEntrar();
    });
  });

  if (modo !== "crear" && modo !== "enviado") portadaOfrecerGoogle();

  /* La ayuda del apodo se escribe sola mientras se teclea el nombre. Contar
     de antemano cómo te vamos a llamar es lo que convierte un campo opcional
     en una decisión: quien escribe "María José García" ve que le vamos a
     decir María y, si no le gusta, ya sabe para qué sirve la casilla de
     abajo. Un texto fijo no habría enseñado nada. */
  if (modo === "crear") {
    ["portada-nombre", "portada-apodo"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("input", portadaPistaApodo);
    });
    portadaPistaApodo();
  }

  /* El foco va al primer campo vacío: al volver de «crear cuenta» el correo
     ya está escrito y lo que falta es la contraseña. */
  setTimeout(() => {
    const campos = Array.prototype.slice.call(cap.querySelectorAll("input"));
    const el = campos.filter(c => !c.value)[0] || campos[0];
    if (el) el.focus();
  }, 60);
}

function portadaIrA(modo) {
  portadaRecordar();
  portadaPintar(modo);
}

function portadaPistaApodo() {
  const el = document.getElementById("portada-apodo-hint");
  if (!el) return;
  const s = saludoDe(valorDe("portada-nombre"), valorDe("portada-apodo"));
  const propio = !!limpiarNombre(valorDe("portada-apodo"), APODO_MAX);
  el.textContent = !s
    ? "Si lo dejas en blanco usaremos tu nombre."
    : propio
      ? "Te llamaremos " + s + "."
      : "Si lo dejas en blanco te llamaremos " + s + ".";
}

/* El dispositivo se presta, y quien lo recibe no tiene por qué borrar el
   correo de otro a mano para poder entrar. Se olvida lo recordado y se
   repinta desde cero: la pantalla vuelve a ser la de un desconocido. */
function portadaNoSoyYo() {
  olvidarUltimo();
  portadaCorreo = "";
  portadaPintar("entrar");
}

function cerrarPortada(seca) {
  const cap = document.getElementById("portada");
  if (!cap) return;
  if (seca) { cap.remove(); return; }
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

/* Mientras se comprueba algo contra el servidor. El botón dice qué está
   pasando en vez de quedarse mudo y apagado, y la portada NO se cierra: eso
   es lo que hacía parpadear la pantalla —se quitaba la entrada dando la
   sesión por buena, y si la contraseña no valía volvía a aparecer—. */
function portadaOcupada(si, texto) {
  const cap = document.getElementById("portada");
  if (cap) cap.classList.toggle("ocupada", !!si);
  const b = document.getElementById("portada-ok");
  if (!b) return;
  if (si) {
    b.disabled = true;
    if (texto) {
      if (!b.dataset.txt) b.dataset.txt = b.textContent;
      b.innerHTML = '<span class="giro"></span>' + escapeHtml(texto);
    }
  } else {
    b.disabled = false;
    if (b.dataset.txt) b.textContent = b.dataset.txt;
  }
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
  const correo = portadaCorreoValor();
  const clave = valorDe("portada-clave");
  if (!correo || !clave) { portadaAviso("Escribe tu correo y tu contraseña."); return; }

  portadaCorreo = correo;
  portadaAviso(""); portadaOcupada(true, "Comprobando…");
  try {
    sync.tipo = "supabase";
    sync.cfg = await ALMACENES.supabase.configurar({ correo: correo, clave: clave });
    await portadaEntrada(correo);
  } catch (e) {
    const m = (e && e.message) || String(e);
    portadaOcupada(false);
    portadaAviso(m, /confirmar tu correo/i.test(m)
      ? { etiqueta: "Reenviar el correo", fn: portadaReenviarVerificacion }
      : null);
  }
}

/* Aquí sí se comprueban el correo y las dos contraseñas antes de mandar nada:
   es la única pantalla donde una errata no se puede corregir después. */
async function portadaRegistrar() {
  const correo = portadaCorreoValor();
  const clave = valorDe("portada-clave");
  const clave2 = valorDe("portada-clave2");
  const perfil = armarPerfil(valorDe("portada-nombre"), valorDe("portada-apodo"));

  /* El nombre se pide de verdad. Podría ser opcional y rellenarse después,
     pero entonces el primer correo —el de confirmar la cuenta, el único que
     todo el mundo abre— saldría sin él, y ese es justo el momento que se
     quería arreglar. Es una casilla de texto libre: vale cualquier cosa que
     alguien reconozca como suya. */
  if (!perfil.nombre) {
    portadaAviso("Dime cómo te llamas: es lo que usaré para hablarte.");
    const n = document.getElementById("portada-nombre");
    if (n) n.focus();
    return;
  }
  if (!correo) { portadaAviso("Escribe el correo con el que quieres entrar."); return; }
  if (!/.+@.+\..+/.test(correo)) { portadaAviso("Ese correo no parece completo. Revísalo."); return; }
  if (clave.length < CLAVE_MIN) { portadaAviso("La contraseña necesita al menos " + CLAVE_MIN + " caracteres."); return; }
  if (clave !== clave2) { portadaAviso("Las dos contraseñas no coinciden. Míralas con el ojito para compararlas."); return; }

  portadaRecordar();
  portadaAviso(""); portadaOcupada(true, "Creando tu cuenta…");
  try {
    const sesion = await sbRegistrar(correo, clave, perfil);
    // Sin sesión: falta confirmar el correo antes de poder entrar
    if (!sesion) { portadaIrA("enviado"); return; }
    sync.tipo = "supabase";
    sync.cfg = { correo: correo, sesion: sesion, perfil: perfil };
    await portadaEntrada(correo, "Cuenta creada. Bienvenido" + coma(perfil.saludo));
  } catch (e) {
    portadaOcupada(false);
    /* Si la cuenta ya existía se manda a entrar en vez de dejar el aviso a
       secas: quien acaba de descubrir que ya tenía cuenta lo que quiere es
       usarla, y el correo ya está escrito. */
    portadaAviso((e && e.message) || String(e), (e && e.yaExiste)
      ? { etiqueta: "Ir a iniciar sesión", fn: () => portadaIrA("entrar") }
      : null);
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
   los queda quien entre.

   La entrada no se cierra hasta el final. Antes se quitaba nada más aceptar
   la contraseña, y lo que quedaba a la vista era la app con los datos de
   antes hasta que bajaba lo de la cuenta: la pantalla cambiaba dos veces
   seguidas y eso se lee como un fallo. */
async function portadaEntrada(correo, mensaje) {
  const uid = ((sync.cfg || {}).sesion || {}).uid || null;

  if (sync.dueño && uid && sync.dueño !== uid) {
    /* No se tira: se aparta donde se puede recuperar desde Ajustes. Y no se
       avisa —no ha pasado nada malo ni hay nada que decidir—: un mensaje
       sobre datos de otra cuenta justo al entrar solo asusta a quien acaba de
       hacer lo correcto. Las copias siguen estando en Ajustes. */
    stashConflict("otra-cuenta", state);
    guardarLocal({
      skills: [], perks: [], projects: [], missions: [], cajas: [],
      settings: { timezone: userTZ() }, schemaVersion: SCHEMA
    });
    state = load();
  }
  sync.dueño = uid;

  sync.device = sync.device || guessDeviceName();
  sync.enabled = true;
  sync.entrada = "cuenta";
  sync.marca = null;
  sync.rev = 0;
  sync.dirty = hasLocalData();
  sync.lastAt = null;
  recordarUltimo();
  saveSync();

  /* Una cuenta que existía antes de que se pidiera el nombre, o una que entró
     por Google, llega sin `saludo` guardado. Se completa aquí, en silencio y
     una sola vez, con lo que se haya podido deducir: sin esto, sus correos
     seguirían empezando sin nombre para siempre, porque el único sitio donde
     se rellenaba era el formulario de alta por el que ya no van a pasar.

     Va sin `await` a propósito. Es una mejora para el próximo correo, no algo
     que esta pantalla necesite: hacerla esperar añadiría una llamada más al
     momento de entrar, que es la espera que más se nota de toda la app. Y por
     eso mismo solo ocurre cuando de verdad falta algo — `deducido` lo dice—,
     no en cada entrada. */
  const p = perfilActual();
  if (p.deducido && p.saludo) {
    guardarPerfil(p.nombre, p.apodo).catch(() => { /* el próximo intento */ });
  }

  cargaMostrar("Trayendo tu progreso…");
  pintarAvisoPruebas();
  renderSync();

  /* Con tope de espera. `fetch` no trae ninguno, así que una petición que no
     contesta ni falla —el wifi de un aeropuerto que en realidad pide una
     contraseña— dejaría esta pantalla puesta para siempre. Cumplido el plazo
     se entra igual: la sesión ya vale, y lo que quede por traer llegará en la
     siguiente sincronía. */
  await Promise.race([
    syncRun({ silent: true }),
    new Promise(listo => setTimeout(listo, 12000))
  ]);
  showView(activeMainView || "summary");

  // La app ya está pintada con lo que toca: recién ahora se destapa
  cerrarPortada(true);
  cargaCerrar();
  toast(mensaje || ("Hola de nuevo" + coma()), "logro");
  quizaTutorialDeEntrada();
}

function portadaSinCuenta() {
  sync.entrada = "local";
  saveSync();
  cerrarPortada();
  toast("Guardando solo en este dispositivo", "calma");
  // Con retraso: la portada tarda un cuarto de segundo en irse
  setTimeout(quizaTutorialDeEntrada, 320);
}

/* ---- Se me olvidó la contraseña ----
   El caso que decide si una cuenta es utilizable: sin esto, olvidar la
   contraseña es perder el progreso para siempre.

   El aviso es el mismo exista o no la cuenta. Decir "ese correo no está
   registrado" sería más amable y convertiría la pantalla en un buscador de
   quién tiene cuenta aquí: se prueban direcciones hasta que una responda
   distinto. */
async function portadaOlvide() {
  const correo = portadaCorreoValor();
  if (!correo) {
    portadaAviso("Escribe arriba tu correo y vuelve a pulsar: ahí te mando el enlace.");
    const c = document.getElementById("portada-correo");
    if (c) c.focus();
    return;
  }
  portadaCorreo = correo;
  portadaAviso(""); portadaOcupada(true, "Mandando el enlace…");
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
  const correo = portadaCorreoValor();
  if (!correo) { portadaAviso("Escribe arriba tu correo."); return; }
  // Este botón se pulsa desde dos sitios; solo se reetiqueta cuando es suyo
  portadaAviso(""); portadaOcupada(true, portadaModo === "enviado" ? "Reenviando…" : null);
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
  cerrarPortada(cargaVisible());
  const previo = document.getElementById("nueva-clave");
  if (previo) previo.remove();
  const cap = document.createElement("div");
  cap.id = "nueva-clave";
  cap.className = "portada";
  cap.innerHTML =
    `<div class="portada-caja">
       <img class="portada-logo" src="marca/logotipo-claro.svg" alt="Norata">
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
  cargaCerrar(true);
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
  btn.innerHTML = '<span class="giro"></span>Guardando…';
  try {
    await sbCambiarClave(a);
    /* La pantalla se quita al final, cuando `portadaEntrada` ya bajó el
       progreso y tapó todo con la de carga: quitarla antes deja a la vista
       una app a medio poner. */
    await portadaEntrada(sync.cfg.correo, "Contraseña cambiada");
    const cap = document.getElementById("nueva-clave");
    if (cap) cap.remove();
  } catch (e) {
    aviso((e && e.message) || String(e));
    btn.disabled = false;
    btn.textContent = "Guardar y entrar";
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
  /* Por aquí entran los tres caminos de fuera, y dos de ellos traen el nombre
     de sitios distintos: el enlace de confirmación devuelve lo que se escribió
     al registrarse, y Google devuelve lo suyo (`full_name`). `perfilDe` los
     iguala, así que aquí no hay que distinguirlos. */
  sync.cfg = {
    correo: datos.email || "tu cuenta",
    sesion: sesion,
    perfil: perfilDe(datos.user_metadata)
  };

  /* Recuperación: la sesión sirve para UNA cosa, poner contraseña nueva. No se
     entra a la app todavía. Si alguien deja el enlace abierto y se va, lo peor
     que hay en pantalla es un formulario vacío, no su progreso. */
  if (tipo === "recovery") {
    saveSync();
    mostrarNuevaClave();
    return true;
  }

  await portadaEntrada(sync.cfg.correo);
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
