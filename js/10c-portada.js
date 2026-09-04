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
  /* Si ya estaba puesta no se duplica, pero SÍ se le hace caso al modo: la
     despedida llega con la portada ya en pantalla en algún camino, y sin esto
     se quedaba enseñando el formulario de entrar. */
  if (document.getElementById("portada")) {
    if (modo) portadaPintar(modo);
    return;
  }
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
  document.title = "Norata";
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
       <!-- El consentimiento va AQUÍ y no en Ajustes, y no es una manía legal:
            este es el instante en que se recoge el correo de alguien, que es
            justo lo que el aviso de privacidad tiene que anunciar antes de que
            ocurra. Puesto después, se estaría avisando de algo ya hecho.

            Debajo del botón y no encima: quien viene a crear una cuenta viene
            a pulsarlo, y una frase legal por delante empuja el botón hacia
            abajo sin que nadie la haya pedido. -->
       <p class="portada-legal">Al crear tu cuenta aceptas los
         <a href="${legalBase()}terminos/" target="_blank" rel="noopener">términos</a> y el
         <a href="${legalBase()}privacidad/" target="_blank" rel="noopener">aviso de privacidad</a>.</p>
       <p class="portada-pie">¿Ya tienes una? <button onclick="portadaIrA('entrar')">Entra aquí</button></p>`;

  } else if (modo === "rescate") {
    const fecha = fechaLarga(rescateCuando) || "dentro de unos días";
    dentro =
      `<div class="portada-sello aviso">
         <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.4v5.1l3.2 1.9"/></svg>
       </div>
       <h2>Esta cuenta se va a borrar</h2>
       <p class="portada-lema">Pediste borrar <b>${escapeHtml(portadaCorreo)}</b>, y se hará el <b>${escapeHtml(fecha)}</b>. Hasta ese día puedes recuperarla con todo tu progreso intacto.</p>
       <div id="portada-error" class="portada-error" hidden></div>
       <div class="stack">
         <button class="btn btn-primary btn-block" id="portada-ok" onclick="rescatarCuenta()">Recuperar mi cuenta</button>
         <button class="btn btn-danger-ghost btn-block" onclick="borrarCuentaYa()">Borrarla ahora, sin esperar</button>
       </div>
       <button class="portada-sin sutil" onclick="salirDelRescate()">Dejarlo como está y salir</button>`;

  } else if (modo === "adios") {
    /* La despedida. Sale EN LUGAR del formulario de entrar, y ese es el punto
       entero: quien acaba de pedir que se borre su cuenta no puede encontrarse
       la pantalla de iniciar sesión, que es una invitación a volver a hacer lo
       que acaba de deshacer. Antes pasaba justo eso — se borraba, aparecía el
       login y un aviso de abajo con la fecha, que dura cuatro segundos y se va.

       El plazo de 30 días es lo único que hay que retener de aquí, así que va
       en grande y no dentro de un párrafo: hasta esa fecha, entrar otra vez
       con el mismo correo recupera todo.

       Las dos salidas son a propósito distintas: entrar (que además es cómo se
       recupera la cuenta) y salir de Norata del todo. No hay una tercera; esta
       pantalla no tiene nada más que ofrecer y llenarla de botones sería no
       dejar irse. */
    const fecha = fechaLarga(rescateCuando) || "";
    dentro =
      `<div class="portada-sello">
         <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 3.5H18a2 2 0 012 2v13a2 2 0 01-2 2h-3.5"/><path d="M10 7l-5 5 5 5M5 12h9"/></svg>
       </div>
       <h2>Hasta pronto${escapeHtml(coma(portadaSaludo))}</h2>
       <p class="portada-lema">Tu cuenta quedó programada para borrarse${fecha ? " el <b>" + escapeHtml(fecha) + "</b>" : ""}. Hasta ese día puedes recuperarla entera —con tu progreso, tus rachas y tu XP— entrando otra vez con tu correo.</p>
       <p class="portada-lema">Gracias por el tiempo que le diste a Norata. Lo que aprendiste jugando a esto sigue siendo tuyo, esté o no la app de por medio.</p>
       <div class="stack">
         <button class="btn btn-soft btn-block" onclick="irALaPuerta()">Volver a entrar</button>
         <a class="btn btn-ghost btn-block" href="https://www.norata.app">Ir a norata.app</a>
       </div>`;

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
    /* Y el tercer caso, que no es «un desconocido» ni «quien vuelve»: alguien
       que YA está dentro de una cuenta y viene a añadir otra
       (`irAAgregarCuenta`). Ahí saludar por el nombre de la cuenta que ya
       está puesta sería decirle «hola de nuevo» justo a quien no quiere
       entrar como esa persona, y el correo prellenado sería el equivocado. */
    const agregando = puertaAgregando();
    const vuelve = !agregando && !!(sync.ultimoSaludo && sync.ultimoCorreo);
    dentro = agregando
      ? `<div class="portada-cab">
           <button class="portada-volver" onclick="volverDeAgregar()" aria-label="Volver a mi cuenta">←</button>
           <h2>Entrar con otra cuenta</h2>
         </div>
         <p class="portada-lema">La cuenta en la que estás ahora se queda guardada en este dispositivo: podrás volver a ella con un toque.</p>`
      : vuelve
      ? `<div class="portada-vuelve">
           ${avatarPinta(sync.ultimoUid, sync.ultimoSaludo, sync.ultimoCorreo, 56)}
           <h2>Hola de nuevo, ${escapeHtml(sync.ultimoSaludo)}</h2>
           <p class="portada-lema">Escribe tu contraseña y sigues donde lo dejaste.</p>
         </div>`
      : `<img class="portada-logo" src="${logotipoSrc()}" alt="Norata">
         <p class="portada-lema">Tu vida como videojuego: habilidades que suben con la práctica y metas que avanzan de verdad.</p>`;

    /* Las cuentas que ya entraron aquí, arriba del formulario y no debajo: si
       una de ellas es la que se busca, no hay que leer nada más. Debajo del
       formulario se leería después de haber empezado a teclear, que es
       justo cuando ya no sirve de nada. */
    const guardadas = cuentasListaHTML();
    if (guardadas) {
      dentro += `<p class="cuentas-tit">Ya entraste aquí con:</p>${guardadas}
                 <div class="portada-o"><span>${agregando ? "o entra con otra" : "o escribe tu correo"}</span></div>`;
    }

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
       ${agregando
         ? '<button class="portada-sin" onclick="volverDeAgregar()">Volver a mi cuenta</button>'
         : `<button class="portada-sin" onclick="portadaSinCuenta()">${yaEntroSinCuenta ? "Volver sin iniciar sesión" : "Probar sin cuenta"}</button>
       <p class="portada-nota">${yaEntroSinCuenta
         ? "Seguirás guardando solo en este dispositivo."
         : "Sin cuenta, tu progreso se guarda solo en este dispositivo. Puedes crear una cuenta cuando quieras y llevártelo."}</p>`}`;
  }

  cap.innerHTML = `<div class="portada-caja">${dentro}</div>`;

  // Enter en cualquier campo hace lo mismo que el botón grande de esa pantalla
  cap.querySelectorAll("input").forEach(el => {
    el.addEventListener("keydown", e => {
      if (e.key !== "Enter") return;
      if (portadaModo === "crear") portadaRegistrar(); else portadaEntrar();
    });
  });

  if (modo !== "crear" && modo !== "enviado" && modo !== "rescate" && modo !== "adios") portadaOfrecerGoogle();

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
  /* El título se repone DESPUÉS de quitarla del documento, no antes: mientras
     siga ahí, `titularPestana` la ve y contesta "Norata". */
  /* En la puerta no hay app que titular, y `titularPestana` vive en un archivo
     que allí no se carga. */
  const reponerTitulo = () => {
    if (typeof titularPestana === "function") titularPestana(activeMainView || "summary");
  };
  if (seca) { cap.remove(); reponerTitulo(); return; }
  cap.classList.add("fuera");
  setTimeout(() => { cap.remove(); reponerTitulo(); }, 260);
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
/* ¿Estamos en la puerta o ya dentro de la app?

   La puerta es una página aparte —`/login/`— y se reconoce sin banderas ni
   variables globales que haya que acordarse de poner: allí no existe la app.
   Una bandera se olvida en algún camino; esto no puede desincronizarse porque
   pregunta por lo que de verdad hay delante. */
function enLaPuerta() {
  return !document.getElementById("view-summary");
}

/* Desde dónde se llega a las páginas legales. Es el mismo problema que resuelve
   `logotipoSrc()` y por el mismo motivo: la portada se pinta en DOS sitios —la
   puerta, que vive en `/login/`, y la app, que vive en la raíz— y una ruta
   relativa que sirve en uno se rompe en el otro.

   Relativa y no absoluta a propósito: con `/privacidad/` esto solo funcionaría
   servido desde la raíz de un dominio, y el proyecto se abre también desde una
   carpeta local en las pruebas. */
function legalBase() {
  return enLaPuerta() ? "../" : "";
}

/* Ir a entrar. Desde la app es un viaje de verdad —la puerta vive en otra
   dirección desde 0.7.14— y desde la puerta es solo repintar. Un solo sitio
   con esa decisión, para que ningún botón acabe sabiendo dónde está el login:
   el día que se mueva otra vez, se mueve aquí. */
function irALaPuerta() {
  if (enLaPuerta()) { portadaPintar("entrar"); return; }
  location.assign("login/");
}

/* Alguien acaba de entrar. Lo que pasa después depende de dónde estemos, y el
   reparto es la clave de que el login pueda vivir en su propia página:

     en la puerta   se guarda la sesión y se manda a la raíz. Nada más.
     en la app      se adopta la sesión: se baja el progreso, se aparta lo de
                    otra cuenta si la hubiera, y se pinta.

   Todo lo que necesita `state`, `syncRun` o las vistas está en la segunda
   mitad, que es justo lo que la puerta no tiene cargado. Por eso se pudo
   partir sin duplicar una sola línea. */
async function portadaEntrada(correo, mensaje) {
  /* Lo primero, antes de dar la sesión por buena: ¿esta cuenta está esperando
     a borrarse? Quien pidió borrarla y vuelve no viene a usar la app, viene a
     decidir. Entrar como si nada le escondería justo eso. Se pregunta en los
     dos sitios: mandarle a la app para que se entere allí sería enseñarle su
     progreso un segundo antes de decirle que se va a borrar. */
  const pendiente = await sbBorradoPendiente();
  if (pendiente) { mostrarRescate(pendiente); return; }

  if (enLaPuerta()) {
    /* GUARDAR LA SESIÓN, y esta es la línea que faltaba en 0.7.14.
       `portadaEntrar` deja la credencial en `sync.cfg` y nada más: quien la
       escribía en el aparato era `saveSync()` desde el final de lo que hoy es
       `adoptarSesion`, y eso ya no corre aquí. Sin esto la puerta mandaba a la
       app, la app no encontraba sesión, rebotaba de vuelta a la puerta, y así
       para siempre — el bucle que dejó a todo el mundo atorado en el login.

       Se guarda lo MÍNIMO para que `syncReady()` diga que sí. Todo lo demás
       —el dueño, la marca, la revisión, el nombre del aparato— lo pone
       `adoptarSesion` al otro lado, y `sync.dueño` en particular NO se toca
       aquí a propósito: es lo que le permite a la app darse cuenta de que se
       está entrando con otra cuenta y apartar los datos de la anterior. */
    sync.enabled = true;
    sync.entrada = "cuenta";
    saveSync();
    /* El viaje de «entrar con otra cuenta» termina aquí. Si la marca se
       quedara puesta, la próxima vez que la app mandara a la puerta —una
       sesión caducada, un cierre de sesión— la puerta creería que se viene a
       añadir otra y enseñaría la salida equivocada. */
    try { sessionStorage.removeItem("norata-agregar"); } catch (e) {}

    /* Y el aviso de que llega alguien recién entrado, para que la app haga la
       adopción. Va en `sessionStorage` y no en la dirección: por la dirección
       viajaría a la barra, al historial y a lo que se copie al compartir, y lo
       que hay que pasar es «acaba de entrar», que no es asunto de nadie más.

       `replace` y no `assign`: el botón de atrás desde la app no puede
       devolver al formulario de entrar de una sesión que ya está abierta. */
    try {
      sessionStorage.setItem("norata-recien", "1");
      if (mensaje) sessionStorage.setItem("norata-recien-aviso", mensaje);
    } catch (e) { /* sin esto solo se pierde el saludo, no la sesión */ }
    cargaMostrar(mensaje || "Entrando…");
    location.replace("../");
    return;
  }

  await adoptarSesion(mensaje);
}

/* La segunda mitad: hacer sitio en ESTE dispositivo a la sesión que ya está
   guardada. La llama `portadaEntrada` cuando se entra desde dentro de la app,
   y el arranque cuando se llega rebotado desde la puerta. */
async function adoptarSesion(mensaje) {
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
  /* Al lado de `recordarUltimo` y no dentro de él: aquel guarda a quien
     saludar y se calla si la cuenta no tiene nombre; este guarda con qué
     cuentas se puede entrar, y una cuenta sin nombre también cuenta. */
  cuentaApuntar();
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

  /* El aviso de la bienvenida, también sin `await`. La pantalla no depende de
     él y el servidor tarda lo que tarde: hacer esperar a alguien que acaba de
     confirmar su cuenta por un correo de cortesía sería justo al revés. */
  avisarBienvenida();

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

/* ---- Cambiar a una cuenta que ya entró en este dispositivo ----

   La misma función sirve en los dos lados, y esa es la idea: en la puerta hay
   una lista de con qué cuentas se puede entrar, y dentro de la app hay otra
   para cambiarse sin salir. `enLaPuerta()` decide lo único que cambia, que es
   a dónde se va después.

   No hay un camino nuevo de entrada: se deja la sesión puesta y se recarga con
   la marca `norata-recien`, que es exactamente lo que hace la puerta al entrar
   con la contraseña. Todo lo de después —apartar los datos de la otra cuenta,
   bajar los de esta, pintar— sigue siendo `adoptarSesion`, sin tocarla. */
async function entrarConCuentaGuardada(uid) {
  const c = cuentasLeer().filter(x => x.uid === uid)[0];
  /* Puede no estar: la lista se toca desde dos pantallas y desde otra pestaña
     del mismo navegador, y la que se está mirando pudo quedarse vieja. */
  if (!c) {
    toast("Esa cuenta ya no está guardada en este dispositivo.");
    if (enLaPuerta()) portadaPintar("entrar"); else renderSync();
    return;
  }
  const saludo = cuentaSaludo(c);

  /* PRIMERO SUBIR LO QUE FALTE, y esto no es una cortesía: es la condición
     para que el atajo pueda existir.

     Cambiar de cuenta aparta los datos de este dispositivo y baja los de la otra
     (`adoptarSesion`). Lo que no se hubiera subido todavía queda solo en una
     copia de conflicto, que hay que ir a rescatar a mano desde Ajustes.
     Mientras cambiar costaba una contraseña eso casi no pasaba; con un toque
     va a pasar seguido. Así que si la subida falla no se cambia: se dice y uno
     se queda donde estaba, que es lo único que no pierde nada.

     En la puerta no se intenta siquiera: allí no existe `state`, y si se llegó
     desde «Entrar con otra cuenta» la app ya subió lo suyo antes de mandar. */
  if (!enLaPuerta() && syncReady() && sync.dirty) {
    cargaMostrar("Guardando lo último…");
    await syncRun({ silent: true });
    if (sync.dirty) {
      cargaCerrar();
      toast("No cambié de cuenta, para no dejarte atrás lo que falta por subir. " +
        (syncError || "Revisa la conexión e inténtalo otra vez."));
      return;
    }
  }

  /* Y AHORA SÍ, comprobar que el permiso guardado todavía vale. Va aquí y no
     antes porque lo de arriba —subir lo pendiente— hay que hacerlo igual, y va
     antes de tocar `sync` porque si esto falla no puede quedar nada a medias.

     El token de refresco no caduca por reloj: se lo lleva por delante cambiar
     la contraseña o pedir «cerrar las otras sesiones», y eso puede haber
     pasado desde otro dispositivo. Sin preguntarlo, la app entraba igual y se
     quedaba dentro de una cuenta que no podía sincronizar nada. */
  cargaMostrar("Entrando" + coma(saludo) + "…");
  const viva = await sbRevivir(c.sesion.refresh);
  if (!viva) {
    cargaCerrar();
    /* Se quita de la lista: un atajo que ya no lleva a ninguna parte no puede
       quedarse ofreciéndose. Y el correo se deja escrito en el formulario, que
       es a lo único que se puede llegar desde aquí. */
    cuentaOlvidar(uid);
    portadaCorreo = c.correo;
    if (enLaPuerta()) { portadaPintar("entrar"); } else { renderSync(); }
    toast("La sesión guardada de " + (saludo || c.correo) + " ya no vale. Entra con su contraseña.");
    return;
  }
  c.sesion = viva.uid ? viva : Object.assign({}, viva, { uid: c.uid });

  cuentaPonerSesion(c);
  /* El permiso recién renovado, guardado. El servidor gastó el viejo al
     contestar: sin esto la lista se quedaría con uno que ya no sirve y el
     atajo fallaría la próxima vez. */
  cuentaApuntar();
  try {
    sessionStorage.setItem("norata-recien", "1");
    sessionStorage.setItem("norata-recien-aviso", "Hola de nuevo" + coma(saludo));
    sessionStorage.removeItem("norata-agregar");
  } catch (e) { /* sin esto solo se pierde el saludo, no el cambio */ }
  /* `replace` y no `assign`: el botón de atrás no puede devolver a la pantalla
     de una cuenta en la que ya no se está. */
  location.replace(enLaPuerta() ? "../" : location.pathname);
}

/* Quitar una cuenta de la lista. Es la otra mitad de guardarla, y tiene que
   estar a la vista: un dispositivo se presta, y el atajo de entrar sin contraseña
   necesita una forma evidente de deshacerse. */
async function quitarCuentaGuardada(uid) {
  const c = cuentasLeer().filter(x => x.uid === uid)[0];
  if (!c) return;
  const quien = cuentaSaludo(c) || c.correo;
  if (!await ask("Se quita " + quien + " de este dispositivo. Su progreso sigue entero en su cuenta; para volver a entrar habrá que escribir la contraseña.", "Quitar")) return;
  cuentaOlvidar(uid);
  if (enLaPuerta()) portadaPintar("entrar"); else renderSync();
  toast("Quitada de este dispositivo", "calma");
}

/* ---- Añadir una cuenta sin salirse de la que hay ----

   Es lo que hace que la lista pueda tener dos cuentas: cerrar sesión borra la
   credencial y también el atajo —lo promete su aviso—, así que por ahí la
   lista nunca pasaría de una. Este es el camino que las deja a las dos.

   La marca va en `sessionStorage` porque describe un viaje, no un ajuste: si
   se cierra la pestaña a media faena no queda nada puesto. */
function puertaAgregando() {
  try { return sessionStorage.getItem("norata-agregar") === "1"; } catch (e) { return false; }
}

async function irAAgregarCuenta() {
  /* Se sube antes de salir de la app, y por lo mismo que en el cambio: la
     puerta no tiene `state` y desde allí ya no habría forma de subir nada. */
  if (syncReady() && sync.dirty) {
    cargaMostrar("Guardando lo último…");
    await syncRun({ silent: true });
    if (sync.dirty) {
      cargaCerrar();
      toast("Me quedé aquí, para no dejarte atrás lo que falta por subir. " +
        (syncError || "Revisa la conexión e inténtalo otra vez."));
      return;
    }
  }
  let puesto = false;
  try { sessionStorage.setItem("norata-agregar", "1"); puesto = true; } catch (e) {}
  /* Sin la marca, la puerta rebotaría de vuelta aquí en cuanto viera que hay
     sesión, y el botón parecería roto. Mejor decirlo que dejarlo sin efecto. */
  if (!puesto) {
    cargaCerrar();
    toast("Este navegador no me deja guardar el paso intermedio. Cierra sesión y entra con la otra cuenta.");
    return;
  }
  cargaMostrar("Abriendo la entrada…");
  location.assign("login/");
}

/* La salida de ese modo, para quien llegó a la puerta y se arrepintió. Sin
   esto la única vuelta sería el botón de atrás del navegador, y «probar sin
   cuenta» —que es lo que hay ahí abajo— haría algo bastante peor: dejar el
   dispositivo marcado como "sin cuenta" teniendo una sesión abierta. */
function volverDeAgregar() {
  try { sessionStorage.removeItem("norata-agregar"); } catch (e) {}
  cargaMostrar("Volviendo…");
  location.replace("../");
}

/* La lista, para las dos pantallas. Devuelve cadena vacía si no hay ninguna,
   y quien la pinta decide qué hacer con eso. */
function cuentasListaHTML() {
  const otras = cuentasOtras();
  if (!otras.length) return "";
  return '<div class="cuentas-lista">' + otras.map(cuentaFilaHTML).join("") + '</div>';
}

/* Las cuentas guardadas, en forma de renglón de menú. Este es el atajo de
   verdad: la lista de Ajustes → Mi perfil está bien para administrar —quitar
   una, leer los correos enteros—, pero para CAMBIAR quedaba a cuatro toques y
   detrás de dos puertas. Lo dijo Eduardo con el menú de Google delante: la
   cuenta se cambia desde donde ya se ve quién eres, y de un toque.

   Sale en los dos sitios donde la app ya contesta «¿en qué cuenta estoy?»: el
   menú del engrane en la computadora y el índice de Ajustes en el teléfono.
   `pref` es lo único que cambia entre los dos —`mm` o `aj`— porque los dos
   renglónes tienen la misma forma: un hueco para el icono y dos líneas de
   texto. Con dos funciones, una se habría quedado atrás a la primera.

   Aquí NO va la × de quitar, a propósito: en un menú corto, un botón de borrar
   pegado a uno de entrar es un accidente esperando. Quitar sigue en Mi perfil,
   que es donde se administra. */
function cuentasMenuHTML(pref) {
  if (!syncReady()) return "";
  const fila = c => {
    const s = cuentaSaludo(c);
    return `<button class="${pref}-item ${pref}-cuenta" onclick="entrarConCuentaGuardada('${escapeAttr(c.uid)}')">
      ${avatarPinta(c.uid, s, c.correo, 30)}
      <span class="${pref}-tx"><b>${escapeHtml(s || c.correo)}</b>${s ? `<span>${escapeHtml(c.correo)}</span>` : ""}</span>
    </button>`;
  };
  /* El renglón de añadir va SIEMPRE, aunque no haya ninguna guardada: es el
     único camino por el que la lista llega a existir, y esconderlo hasta que
     haya dos es esconderlo justo de quien todavía tiene una.

     El icono es la puerta porque es literalmente a donde lleva: a `/login/`,
     que en este código se llama «la puerta» desde 0.7.14. */
  const anadir = `<button class="${pref}-item" onclick="irAAgregarCuenta()">
      <span class="${pref}-ic">${icon("puerta", 16)}</span>
      <span class="${pref}-tx"><b>Entrar con otra cuenta</b><span>Sin cerrar la de ahora</span></span>
    </button>`;
  return `<div class="menu-cuentas">${cuentasOtras().map(fila).join("")}${anadir}</div>`;
}

/* La misma lista con su rótulo, para el panel de la cuenta en Ajustes. Sin
   ninguna otra cuenta guardada no se pinta nada: un apartado que solo dice que
   está vacío es ruido para quien tiene una sola cuenta, que es casi todo el
   mundo. El botón de añadir vive abajo con los demás y ese sí está
   siempre, porque es el único camino para que esta lista llegue a existir. */
function cuentasSeccionHTML() {
  const lista = cuentasListaHTML();
  if (!lista) return "";
  return '<p class="cuentas-tit">Cambiar a otra cuenta de este dispositivo</p>' + lista;
}

/* ---- La cuenta está esperando a borrarse ----
   Dos salidas y ninguna por defecto: recuperarla o terminar ya. Se dibuja
   dentro de la portada porque es parte de entrar, no una pantalla de la app:
   detrás no hay nada suyo todavía y no debe haberlo hasta que decida. */
let rescateCuando = null;

function mostrarRescate(cuando) {
  if (!document.getElementById("portada")) mostrarPortada();
  rescateCuando = cuando;
  // Por si se llegó desde un enlace del correo y nadie escribió nada aquí
  portadaCorreo = portadaCorreo || (sync.cfg || {}).correo || "";
  portadaPintar("rescate");
}

async function rescatarCuenta() {
  portadaAviso(""); portadaOcupada(true, "Recuperándola…");
  try {
    await sbCancelarBorrado();
  } catch (e) {
    portadaOcupada(false);
    portadaAviso((e && e.message) || String(e));
    return;
  }
  rescateCuando = null;
  // Ya no hay nada pendiente, así que esta vez la entrada sigue su curso
  await portadaEntrada(portadaCorreo, "Cuenta recuperada");
}

/* Borrarla ya. No se vuelve a pedir la frase —se escribió al solicitarlo— pero
   sí una confirmación, porque esto es lo único de aquí que no tiene vuelta. */
async function borrarCuentaYa() {
  if (!await ask("Se borrará ahora mismo, sin esperar. Esto ya no se puede deshacer.", "Borrarla ahora", true)) return;
  portadaAviso(""); portadaOcupada(true, "Borrando…");
  try {
    await sbBorrarCuenta();
  } catch (e) {
    portadaOcupada(false);
    portadaAviso((e && e.message) || String(e));
    return;
  }
  sync.cfg = {}; sync.enabled = false; sync.entrada = null; sync.dueño = null;
  saveSync();
  rescateCuando = null;
  portadaPintar("entrar");
  toast("Cuenta borrada", "deshecho");
}

/* Salir de aquí sin decidir. La cuenta se queda como estaba: esperando. */
function salirDelRescate() {
  sync.cfg = {}; sync.enabled = false;
  saveSync();
  rescateCuando = null;
  portadaPintar("entrar");
}

function portadaSinCuenta() {
  sync.entrada = "local";
  saveSync();

  /* Desde la puerta esto es un viaje: detrás de esta pantalla no hay app que
     destapar —es una página aparte—, así que cerrar la portada dejaría un
     fondo vacío. La marca `entrada: "local"` ya está guardada, que es lo único
     que la app necesita para no volver a mandar aquí. */
  if (enLaPuerta()) {
    cargaMostrar("Abriendo Norata…");
    location.replace("../");
    return;
  }

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

/* ---- Llegar directo a recuperar la contraseña ----
   Los correos de aviso —«tu contraseña cambió», «se vinculó una forma nueva de
   entrar»— dicen qué hacer si no fuiste tú, y lo decían sin dar por dónde:
   había que abrir la app, encontrar un enlace pequeño debajo del botón de
   entrar y acordarse de cómo se llamaba. Alguien asustado no hace ese
   recorrido; cierra el correo y lo deja para luego.

   NO manda el correo solo al llegar, y eso es deliberado. Los enlaces de un
   mensaje los abren también los antivirus y las vistas previas del propio
   buzón, sin que nadie los haya pulsado: un enlace que dispara un envío al
   abrirse acaba mandando correos que nadie pidió. Lo que hace es dejar la
   pantalla puesta, con la dirección ya escrita, a un solo toque. */
function portadaAtajoOlvide() {
  if ((location.hash || "").toLowerCase() !== "#olvide") return false;
  // Fuera de la barra antes de nada: recargar no tiene por qué repetir esto
  history.replaceState(null, "", location.pathname + location.search);
  portadaCorreo = sync.ultimoCorreo || "";
  mostrarPortada("entrar");
  const b = document.querySelector(".portada-sin.sutil");
  if (b) b.classList.add("resaltado");
  portadaAviso("Para poner una contraseña nueva, comprueba que el correo de abajo es el tuyo y pulsa «¿Olvidaste tu contraseña?».");
  return true;
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
       <img class="portada-logo" src="${logotipoSrc()}" alt="Norata">
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

    /* Y fuera todos los demás dispositivos. Cambiar la contraseña sin esto
       deja a medias justo el caso para el que se cambia: quien entró en tu
       cuenta ya tiene una sesión, y una sesión abierta no vuelve a pedir la
       contraseña nunca — se renueva sola hasta el fin de los tiempos.

       El fallo aquí no interrumpe: la contraseña YA cambió, y devolver a la
       pantalla de entrada a quien acaba de recuperarla, por un paso que ni
       pidió ni ve, sería peor que el riesgo que evita. Lo que se pierde es
       raro y acotado: que un dispositivo ajeno siga dentro un rato más. */
    try { await sbCerrarOtrasSesiones(); } catch (e) { /* la sesión de aquí vale igual */ }

    /* La pantalla se quita al final, cuando `portadaEntrada` ya bajó el
       progreso y tapó todo con la de carga: quitarla antes deja a la vista
       una app a medio poner. */
    await portadaEntrada(sync.cfg.correo, "Contraseña cambiada. Cerré la sesión en los demás dispositivos");
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
  const p = new URLSearchParams((location.hash || "").replace(/^#/, ""));
  const consulta = new URLSearchParams(location.search || "");
  const limpiar = () => history.replaceState(null, "", location.pathname + location.search);

  /* Un fallo puede volver por dos caminos distintos y hay que mirar los dos.
     Los enlaces del correo lo traen colgado de la almohadilla; los de un
     proveedor de fuera —Google sin activar, una dirección de vuelta que no
     está en su lista— vuelven en la consulta, antes de la almohadilla.

     Mirando solo el primero, esos aterrizaban en una portada muda: ni sesión
     ni mensaje. Desde fuera se ve igual que un botón que no hace nada, que es
     la peor forma de fallar. */
  const fallo = p.get("error_description") || p.get("error") ||
                consulta.get("error_description") || consulta.get("error");
  if (fallo) {
    // Aquí sí se limpia también la consulta: el error viene dentro de ella
    history.replaceState(null, "", location.pathname);
    const d = String(fallo);
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

/* ---- Modo de pruebas ----
   Eduardo revisa la app metiéndole y sacándole cosas todo el rato (y ahí borra
   todo cada dos por tres), y aparte tiene su cuenta de verdad. El riesgo no es
   técnico sino humano: borrar en la que no era. Por eso el aviso es imposible
   de no ver y se dibuja igual que un grupo del árbol de talentos —marco
   punteado amarillo rodeando lo que abarca—, que es lenguaje que ya conoce.

   **Ahora cuelga de ser administrador**, y el interruptor vive en la sección
   «Norata por dentro». Antes el botón estaba en Mi perfil, a la vista de
   cualquiera, y era un botón raro: nadie más que él tiene dos cuentas de
   Norata, así que a todo el mundo le preguntaba algo que no le pasa. Y como el
   modo quita la confirmación de borrar, dejarlo al alcance de todos era
   ofrecer un botón cuyo único efecto para un desconocido es hacer más fácil
   perderlo todo.

   Que dependa de `esAdmin` tiene una consecuencia buena y de regalo: la cuenta
   personal, que ya no es administradora, no puede quedarse marcada aunque lo
   estuviera de antes. La marca vieja deja de aplicar sola. */

/* A quién nos estamos despidiendo. Se apunta aparte porque la despedida se
   pinta DESPUÉS de vaciar la sesión: para cuando la pantalla existe, el perfil
   ya no está, y saludar por su nombre justo al irse es lo poco que se puede
   hacer bien en ese momento. */
let portadaSaludo = "";

function correoActual() {
  return ((sync.cfg || {}).correo || "").toLowerCase();
}

function esCuentaDePruebas() {
  if (!syncReady()) return false;
  /* Lo decide el servidor, no esta línea. Y mientras la respuesta viaja,
     `esAdmin` vale false: el modo tarda un instante en encenderse al arrancar
     y eso está bien, porque el lado en el que se equivoca es el seguro —borrar
     pide el correo hasta que se sepa con certeza que no hace falta. */
  if (typeof esAdmin === "undefined" || !esAdmin) return false;
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

  /* Apagar el modo apaga también el plan simulado, y no es una cortesía: el
     rótulo de arriba es lo ÚNICO que avisa de que lo que estás viendo no es tu
     plan. Dejar la simulación puesta sin el rótulo sería quedarse mirando una
     app que miente sin nada que lo diga — que es justo lo que este modo existe
     para impedir. */
  if (!si && typeof planSimular === "function" && planLeerSimulado()) planSimular("");

  pintarAvisoPruebas();
  renderSync();
  if (typeof renderPanelAdmin === "function") renderPanelAdmin();
}

/* ---- El rótulo de arriba, que es UNO ----
   Eran dos pastillas flotando, apiladas una sobre otra, y entre las dos tapaban
   el título de la pantalla: medido a 412 px, la de «cuenta de pruebas» caía
   justo encima de «Resumen». Lo pidió Eduardo y tenía razón — dos avisos
   sueltos encima del contenido no son dos avisos, son un estorbo.

   Ahora es UNA barra de ancho completo, y el contenido de la app baja lo que
   ella mide (`--alto-aviso`). Una barra de sistema se lee como parte del marco
   y no como algo pegado encima; una pastilla flotante siempre tapa algo.

   Qué dice, en orden: la cuenta de pruebas con el plan que está fingiendo, y el
   ejemplo. En una cuenta de pruebas el ejemplo se calla y solo deja la salida —
   quien acaba de pulsar «Ver un ejemplo» desde la trastienda ya lo sabe—, pero
   el botón NO se quita nunca: es la única puerta de vuelta. */
function pintarAvisos() {
  const previo = document.getElementById("aviso-modo");
  if (previo) previo.remove();

  const pruebas = typeof esCuentaDePruebas === "function" && esCuentaDePruebas();
  const ejemplo = typeof modoEjemplo !== "undefined" && modoEjemplo;
  document.body.classList.toggle("ejemplo-on", !!ejemplo);
  document.documentElement.classList.toggle("con-aviso", !!(pruebas || ejemplo));
  if (!pruebas && !ejemplo) {
    document.documentElement.style.removeProperty("--alto-aviso");
    return;
  }

  const partes = [];
  if (pruebas) {
    const simulado = typeof planNombreSimulado === "function" ? planNombreSimulado() : "";
    partes.push("Cuenta de pruebas" + (simulado ? " · viendo como " + escapeHtml(simulado) : ""));
  }
  if (ejemplo && !pruebas) partes.push("Estás viendo un ejemplo");

  const marco = document.createElement("div");
  marco.id = "aviso-modo";
  marco.className = "aviso-modo";
  marco.innerHTML = '<span class="av-caja">' +
    '<span class="av-tx">' + partes.join(" · ") + '</span>' +
    (ejemplo ? '<button type="button" onclick="salirDelEjemplo()">Salir</button>' : "") +
    '</span>';
  document.body.appendChild(marco);

  /* El hueco que la app tiene que dejarle, MEDIDO y no clavado a un número: en
     una pantalla estrecha el texto se parte en dos renglones y la barra mide
     otra cosa. Se guarda en `<html>` para que lo lean tanto la app como la
     barra lateral de la computadora. */
  document.documentElement.style.setProperty(
    "--alto-aviso", Math.ceil(marco.getBoundingClientRect().height) + "px");
}

/* Los dos nombres de antes siguen vivos y llaman al mismo sitio: se les llama
   desde seis lugares —el arranque, el panel de administración, entrar y salir
   del ejemplo, cambiar de plan simulado— y renombrarlos en todos ellos para no
   ganar nada era pedir que se olvidara uno. */
function pintarAvisoPruebas() { pintarAvisos(); }
