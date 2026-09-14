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
  puertaFrase();
  new MutationObserver(() => {
    if (lado.parentNode !== cap) cap.appendChild(lado);
    puertaFrase();
  }).observe(cap, { childList: true });
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
