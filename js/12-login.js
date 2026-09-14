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
    /* La puerta de dos columnas, apagada salvo que se pida (0.7.115). Quien
       llega por la puerta de «soy nuevo» abre directamente en el formulario de
       crear cuenta: ese es el camino partido, y no un adorno de la pantalla.
       Sin prueba puesta, `puertaPrueba()` no devuelve nada y esto es
       exactamente lo que había. */
    mostrarPortada(puertaPrueba() === "nuevo" ? "crear" : undefined);
    puertaLadoPegar();
    puertaIdiomaPintar();
  }

  cargaCerrar();
})();

/* ---- La puerta de dos columnas, EN PRUEBA (0.7.115) ----
   El interruptor está en el script de arriba de `login/index.html`, que es
   quien lee `?puerta=` y pone las clases; aquí solo se leen. Todo lo de esta
   prueba vive en la PUERTA —este archivo y ese marcado— y nada en
   `js/10c-portada.js`, que lo comparte la app.

   Qué borrar si no se queda: la lista está al final del bloque de CSS
   `.puerta-lado`, en `css/estilos.css`. */
function puertaPrueba() {
  const c = document.documentElement.classList;
  return c.contains("puerta-nuevo") ? "nuevo" : c.contains("puerta-dos") ? "dos" : "";
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
  if (!puertaPrueba()) return;
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

/* ---- El idioma, en la puerta (EN PRUEBA, 0.7.115) ----

   Dos aros, los mismos de Ajustes y los de la pantalla de la primera vez
   (`discoIdioma`), y no un menú: son dos idiomas, y un desplegable esconde
   detrás de un toque lo único que alguien que no entiende la pantalla podría
   necesitar. Se pinta desde aquí y no en el marcado porque el aro es un SVG
   que sabe dibujar `js/00-idioma.js`.

   El nombre de cada idioma NO se traduce —«Español» se dice Español en
   inglés— así que este trozo es el mismo en las dos caras. */
function puertaIdiomaPintar() {
  const caja = document.getElementById("puerta-idioma");
  if (!caja || !puertaPrueba()) return;
  caja.innerHTML = Object.values(IDIOMAS).map(i => `
    <button type="button" class="${i.codigo === idiomaActual() ? "on" : ""}"
            aria-pressed="${i.codigo === idiomaActual()}"
            onclick="puertaIdioma('${i.codigo}')">
      ${discoIdioma(i.codigo, 18)}<span>${escapeHtml(i.nombre)}</span>
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

/* ---- El repertorio de frases del panel (EN PRUEBA, 0.7.115) ----

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
