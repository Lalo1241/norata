/* Lo que corre al abrir /login/. El equivalente de 11-arranque.js, pero para
   la puerta — y mucho más corto, porque aquí no hay app que encender.
 *
 * POR QUÉ EXISTE ESTA PÁGINA
 *
 * Hasta 0.7.13 el formulario de entrar era una capa dentro de la app: se
 * cargaban los diecisiete archivos, se dibujaban las cinco pantallas, y encima
 * de todo eso se ponía una tapa con dos campos. Quien todavía no tenía cuenta
 * pagaba el arranque entero de una aplicación que no podía usar.
 *
 * Ahora son dos direcciones y cada una hace una cosa:
 *
 *     /login/   preguntar quién eres. Cinco archivos.
 *     /         la app. Los diecisiete, y ya con la sesión puesta.
 *
 * EL REPARTO, que es lo único que hay que entender para tocar esto: la puerta
 * termina su trabajo en cuanto hay una sesión guardada en el dispositivo. No baja
 * el progreso, no aparta datos de otra cuenta, no pinta nada de la app —todo
 * eso necesita `state` y las vistas, que aquí no existen—. Lo hace la app al
 * arrancar, avisada por una marca en `sessionStorage` (ver `adoptarSesion` en
 * `js/10c-portada.js`).
 *
 * Y AL REVÉS: la app manda aquí a quien no tenga sesión ni haya elegido usarla
 * sin cuenta (ver el final de `11-arranque.js`). Entre las dos no hay más
 * caminos que esos dos, a propósito. */

/* El idioma en la puerta. Sale del espejo de `localStorage`, que es
   exactamente para lo que existe: aquí no hay `state` —la puerta no carga el
   progreso de nadie— y aun así hay que hablarle a la gente en el idioma que
   eligió. Quien nunca ha entrado verá español, que es lo correcto: todavía no
   ha elegido, y la pantalla donde se elige está al otro lado.

   Va lo primero y fuera del `async`, antes de pintar nada, por lo mismo que
   el modo claro se aplica en el script de arriba de `index.html`: traducir
   después de pintar es lo que hace parpadear la pantalla. */
/* ---- El idioma que trae el navegador (0.7.117) ----

   Y esto NO contradice la regla de `js/01-base.js` —«el idioma no se adivina
   por el navegador»—, aunque lo parezca. Esa regla protege dos casos, y los
   dos son de alguien que YA eligió: quien tiene el teléfono en inglés y la app
   en español *porque así la quiere*, y un respaldo que se abre en otro
   dispositivo. Aquí no hay ninguno de los dos: esto solo corre cuando en este
   dispositivo **no hay ninguna elección guardada**, o sea la primerísima vez.

   Y `navigator.languages` no es la UBICACIÓN, que es lo que lo hace honesto:
   es el idioma que esa persona ya eligió para su teléfono. No es adivinar de
   dónde es —un mexicano en Texas, un gringo en la CDMX, cualquiera con una
   VPN—, es leer una respuesta que ya dio, solo que a otro.

   Dos cosas que hacen que equivocarse sea barato:
     - El sol, la luna y los dos idiomas están a la vista abajo a la izquierda,
       así que un acierto malo cuesta un toque.
     - **Adivinar no es elegir**: no se deja la marca `norata-idioma-puerta`, así
       que la app SÍ pregunta el idioma en la pantalla de bienvenida, ya con
       éste puesto. La marca solo la deja quien pulsa, que es la misma regla
       del género — el silencio no es una respuesta, y una suposición tampoco.

   Va lo primero del archivo, antes de traducir y de poner el `lang`: después
   sería pintar la puerta en español y cambiarla a la vista. */
function puertaIdiomaDelNavegador() {
  /* Si ya hay algo guardado, aquí no se toca nada: eligió alguien, y quien
     eligió manda sobre cualquier suposición. */
  try { if (localStorage.getItem(LLAVE_IDIOMA)) return ""; } catch (e) { return ""; }
  const lista = (navigator.languages && navigator.languages.length)
    ? navigator.languages : [navigator.language];
  for (let i = 0; i < lista.length; i++) {
    /* «en-US», «en-GB» y «en» son el mismo idioma para nosotros: lo que se
       mira es la primera parte, y la primera que conozcamos gana — la lista
       viene en orden de preferencia. */
    const base = String(lista[i] || "").toLowerCase().split("-")[0];
    if (IDIOMAS[base]) return base;
  }
  return "";
}

(function () {
  const sugerido = puertaIdiomaDelNavegador();
  if (sugerido && sugerido !== idiomaActual()) ponerIdioma(sugerido);
})();

document.documentElement.setAttribute("lang", IDIOMAS[idiomaActual()].lang);
traducirDOM();

(async () => {
  /* Si ya hay sesión, aquí no se pinta nada: se pasa de largo. Pasa más de lo
     que parece —el enlace del correo, un marcador viejo, el botón de atrás— y
     enseñarle el formulario de entrar a quien ya está dentro es pedirle la
     contraseña por gusto.

     Va lo primero de todo y ANTES de quitar la pantalla de carga, para que no
     se vea el destello de un formulario que no hacía falta.

     La excepción es venir a AÑADIR una cuenta teniendo ya otra puesta
     (`irAAgregarCuenta`, en `10c-portada.js`). Ahí la sesión existe y aun así
     hay algo que preguntar, así que el rebote se salta — y solo en ese caso,
     que es lo que la marca distingue. */
  if (syncReady() && !puertaAgregando()) { location.replace("../"); return; }

  /* El orden es el mismo que tenía el arranque de la app, y por los mismos
     motivos: primero se recoge lo que venga colgado de la dirección —Google y
     los enlaces del correo traen la sesión ahí y hay que cogerla antes de
     decidir qué pintar—, después el atajo `#olvide` de los correos de aviso,
     y solo si no fue ninguna de las dos se pinta el formulario. */
  const veniaDeEnlace = await sbVolverDeEnlace();
  const veniaAOlvidar = !veniaDeEnlace && portadaAtajoOlvide();

  /* `sbVolverDeEnlace` puede haber entrado y disparado el reboto a la raíz; en
     ese caso esta página ya se está yendo y no hay nada que dibujar. */
  if (!veniaDeEnlace && !veniaAOlvidar) {
    /* Quien llega por la puerta de «soy nuevo» abre directamente en el
       formulario de crear cuenta: ese es el camino partido de la landing, y no
       un adorno de la pantalla. */
    mostrarPortada(puertaEsNueva() ? "crear" : undefined);
    puertaLadoPegar();
    puertaIdiomaPintar();
    puertaMarcaEnlazar();
  }

  cargaCerrar();
})();

/* ---- Por qué puerta se entró (0.7.117) ----
   `/crear-cuenta/` desvía aquí con `?nuevo` puesto, y eso es lo único que
   distingue los dos caminos de la landing: con él la puerta abre en el
   formulario de crear cuenta, sin él en el de entrar. Nada más cuelga de esta
   pregunta — el panel, el idioma y el aspecto son iguales por los dos lados. */
function puertaEsNueva() {
  try { return new URLSearchParams(location.search).has("nuevo"); } catch (e) { return false; }
}

/* El panel de al lado tiene que ser HIJO de `#portada`: en el teléfono va
   debajo del formulario y se desplaza con él, y un elemento suelto en `body`
   se quedaría debajo de una capa fija sin poder alcanzarse. En pantalla ancha
   el CSS lo vuelve `position: fixed` y lo manda a la mitad derecha, que un
   fijo no lo recorta el `overflow` del padre.

   Y se vuelve a pegar solo: `portadaPintar` repinta con `innerHTML` y se
   lleva por delante cualquier hijo añadido desde fuera. Enganchar uno por uno
   los caminos que repintan —entrar, crear, enviado, olvidé, el gesto de
   atrás…— es la clase de lista a la que siempre le falta el séptimo. El
   observador no entra en bucle: al volver a pegarlo el padre ya es el que
   toca, así que la vuelta siguiente no hace nada. */
function puertaLadoPegar() {
  const cap = document.getElementById("portada");
  const lado = document.getElementById("puerta-lado");
  if (!cap || !lado) return;
  cap.appendChild(lado);
  puertaFrasesPoner();
  puertaFrase();
  new MutationObserver(() => {
    if (lado.parentNode !== cap) cap.appendChild(lado);
    puertaFrase();
  }).observe(cap, { childList: true });
}

/* La marca de la esquina lleva a la web pública. El `href` se pone aquí y no
   en el marcado porque la dirección sale de `WEB_NORATA` (`js/01-base.js`),
   que es el único sitio donde está escrita — hoy apunta a la de Framer,
   porque `www.norata.app` todavía no está en alta. Escribirla también en el
   HTML serían dos sitios que descuadrar el día que el dominio exista. */
function puertaMarcaEnlazar() {
  const a = document.getElementById("puerta-marca-enlace");
  if (!a || typeof WEB_NORATA !== "string") return;
  a.href = WEB_NORATA;
}

/* ---- El idioma, en la puerta (0.7.117) ----

   Dos aros, los mismos de Ajustes y los de la pantalla de la primera vez
   (`discoIdioma`), y no un menú: son dos idiomas, y un desplegable esconde
   detrás de un toque lo único que alguien que no entiende la pantalla podría
   necesitar. Se pinta desde aquí y no en el marcado porque el aro es un SVG
   que sabe dibujar `js/00-idioma.js`.

   El nombre de cada idioma NO se traduce —«Español» se dice Español en
   inglés— así que este trozo es el mismo en las dos caras. */
function puertaIdiomaPintar() {
  const caja = document.getElementById("puerta-idioma");
  if (!caja) return;
  /* El sol y la luna, que viven en el mismo grupo: `pintarTema` rellena todos
     los `.tema-hueco` de la página con el control de Ajustes y lo deja marcado
     donde toca. Se llama desde aquí porque en la puerta no hay nadie más que
     lo haga al arrancar — dentro de la app lo llama el arranque—, y también
     en cada cambio de idioma, que es cuando sus rótulos ocultos y sus
     `aria-label` tienen que volver a escribirse. */
  if (typeof pintarTema === "function") pintarTema();
  caja.innerHTML = Object.values(IDIOMAS).map(i => `
    <button type="button" class="${i.codigo === idiomaActual() ? "on" : ""}"
            aria-pressed="${i.codigo === idiomaActual()}"
            onclick="puertaIdioma('${i.codigo}')">
      ${discoIdioma(i.codigo, 16)}<span>${escapeHtml(i.nombre)}</span>
    </button>`).join("");
}

/* Cambiar de idioma desde la puerta.

   `ponerIdioma` ya hace todo lo que hace falta —el espejo, el `lang` del
   documento y el barrido de lo que está escrito en el marcado— y desde la
   0.7.115 sabe además NO escribir el perfil cuando quien llama es la puerta,
   que no tiene perfil de nadie que escribir.

   Lo que no puede saber es qué repintar aquí: en la app redibuja la vista, y
   en la puerta lo que hay es la portada. Va por el callback y no después, para
   que el repintado y la traducción ocurran en el mismo turno y no se vea la
   pantalla a medio idioma.

   Y deja una MARCA: sirve para que la pantalla de idioma y moneda de la app no
   vuelva a preguntar lo que ya se contestó aquí (ver `idiomaVinoDeLaPuerta` en
   `js/09c-region.js`). Es de este dispositivo, como el espejo, y por eso vive
   en `localStorage` al lado de él y no en los datos de nadie. */
function puertaIdioma(cod) {
  if (!IDIOMAS[cod]) return;
  /* La marca se deja ANTES y sin mirar si el idioma cambió, y esa es la
     diferencia entre ahorrar la pregunta a casi nadie o a casi todo el mundo:
     la puerta abre en español, así que quien habla español PULSA «Español» y no
     cambia nada — `ponerIdioma` devuelve false y se acabó—. Pulsar es elegir,
     tanto si mueve la pantalla como si no. Lo que no cuenta es no tocar nada:
     ahí no ha contestado nadie y la app vuelve a preguntar, que es la misma
     regla del género —el silencio no es una respuesta—. */
  try { localStorage.setItem("norata-idioma-puerta", "1"); } catch (e) { /* modo privado */ }
  ponerIdioma(cod, () => {
    if (document.getElementById("portada")) portadaPintar(portadaModo);
    puertaIdiomaPintar();
  });
}

/* ---- El repertorio de frases del panel (0.7.117) ----

   Una sola frase clavada se gasta: quien abre la puerta tres veces en una
   semana ya no la lee. Así que hay un puñado por cada camino y sale una al
   azar en cada apertura.

   Se escriben en ESPAÑOL y se dejan en el DOM tal cual; quien las traduce es
   el barrido de `traducirDOM()`, igual que si estuvieran en el marcado. Si se
   escribiera aquí el resultado de `tx()`, el barrido tomaría el inglés como
   original y al volver al español dejaría la frase en inglés — es la misma
   trampa que ya está apuntada en `js/00-idioma.js`.

   Las viñetas de «soy nuevo» NO rotan y se quedan en el marcado: eso no es una
   frase, es lo que hace la app. Lo que rota es la voz de arriba. */
const PUERTA_FRASES = {
  entrar: [
    "Del otro lado está lo tuyo: tus habilidades, tu progreso y lo que toca hoy.",
    "Nada de lo que construiste se fue a ningún lado. Te estaba esperando.",
    "Volver también cuenta. De hecho, es la parte difícil.",
    "Tu expedición sigue abierta, justo donde la dejaste.",
    "Los días que no abriste la app también son parte del camino."
  ],
  crear: [
    "Los días grandes no se deciden: se construyen con los pequeños.",
    "Todo lo que admiras de alguien empezó siendo un martes cualquiera.",
    "Una habilidad no sube porque lo decidas hoy. Sube porque lo repitas.",
    "Tienes por delante un camino largo, y se recorre en días pequeños.",
    "Lo que se mide se ve, y lo que se ve se sostiene."
  ]
};

/* Una al azar, pero nunca la misma dos veces seguidas en esta pestaña. Con
   cinco frases, repetir al recargar tiene una probabilidad de uno entre cinco
   — bastante para que se note justo lo que esto viene a evitar. La anterior se
   apunta en `sessionStorage`: al cerrar la pestaña se olvida, que es
   exactamente la vida que tiene que tener este dato. */
function puertaFraseAzar(lista, llave) {
  if (!lista || lista.length < 2) return (lista && lista[0]) || "";
  let antes = -1;
  try { antes = parseInt(sessionStorage.getItem(llave), 10); } catch (e) { /* modo privado */ }
  let i = Math.floor(Math.random() * lista.length);
  if (i === antes) i = (i + 1) % lista.length;
  try { sessionStorage.setItem(llave, String(i)); } catch (e) { /* modo privado */ }
  return lista[i];
}

/* Se eligen UNA vez por apertura y no en cada repintado: el panel se vuelve a
   pegar cada vez que la portada cambia de formulario, y sortear ahí haría que
   la frase bailara cada vez que alguien va y viene entre «entrar» y «crear». */
function puertaFrasesPoner() {
  const lado = document.getElementById("puerta-lado");
  if (!lado) return;
  const v = lado.querySelector(".puerta-frase-vuelve .puerta-cita");
  const n = lado.querySelector(".puerta-frase-nueva .puerta-cita");
  if (v) v.textContent = puertaFraseAzar(PUERTA_FRASES.entrar, "norata-frase-entrar");
  if (n) n.textContent = puertaFraseAzar(PUERTA_FRASES.crear, "norata-frase-crear");
  /* Y se traduce lo que se acaba de escribir. El barrido de arriba ya pasó
     —corre antes de que exista la portada— así que sin esto, una puerta abierta
     en inglés enseñaría la frase en español. */
  traducirDOM(lado);
}

/* Qué frase se enseña al lado. La decide el formulario que hay en pantalla y
   no la dirección por la que se entró: desde dentro se salta de «entrar» a
   «crear» con un enlace, y la frase de bienvenida dejaría de venir a cuento.
   El CSS hace el resto (ver `.puerta-frase` en `css/estilos.css`). */
function puertaFrase() {
  document.documentElement.classList.toggle("puerta-creando", portadaModo === "crear");
}

/* El gesto de atrás no tiene nada que deshacer aquí salvo volver del
   formulario de crear cuenta al de entrar. Sin esto, «atrás» desde «crear
   cuenta» salía del sitio entero, que no es lo que nadie espera. */
window.addEventListener("popstate", () => {
  if (portadaModo && portadaModo !== "entrar") { portadaPintar("entrar"); history.pushState(null, ""); }
});
try { history.pushState(null, ""); } catch (e) { /* da igual: solo es el colchón */ }
