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
 * termina su trabajo en cuanto hay una sesión guardada en el aparato. No baja
 * el progreso, no aparta datos de otra cuenta, no pinta nada de la app —todo
 * eso necesita `state` y las vistas, que aquí no existen—. Lo hace la app al
 * arrancar, avisada por una marca en `sessionStorage` (ver `adoptarSesion` en
 * `js/10c-portada.js`).
 *
 * Y AL REVÉS: la app manda aquí a quien no tenga sesión ni haya elegido usarla
 * sin cuenta (ver el final de `11-arranque.js`). Entre las dos no hay más
 * caminos que esos dos, a propósito. */

(async () => {
  /* Si ya hay sesión, aquí no se pinta nada: se pasa de largo. Pasa más de lo
     que parece —el enlace del correo, un marcador viejo, el botón de atrás— y
     enseñarle el formulario de entrar a quien ya está dentro es pedirle la
     contraseña por gusto.

     Va lo primero de todo y ANTES de quitar la pantalla de carga, para que no
     se vea el destello de un formulario que no hacía falta. */
  if (syncReady()) { location.replace("../"); return; }

  /* El orden es el mismo que tenía el arranque de la app, y por los mismos
     motivos: primero se recoge lo que venga colgado de la dirección —Google y
     los enlaces del correo traen la sesión ahí y hay que cogerla antes de
     decidir qué pintar—, después el atajo `#olvide` de los correos de aviso,
     y solo si no fue ninguna de las dos se pinta el formulario. */
  const veniaDeEnlace = await sbVolverDeEnlace();
  const veniaAOlvidar = !veniaDeEnlace && portadaAtajoOlvide();

  /* `sbVolverDeEnlace` puede haber entrado y disparado el reboto a la raíz; en
     ese caso esta página ya se está yendo y no hay nada que dibujar. */
  if (!veniaDeEnlace && !veniaAOlvidar) mostrarPortada();

  cargaCerrar();
})();

/* El gesto de atrás no tiene nada que deshacer aquí salvo volver del
   formulario de crear cuenta al de entrar. Sin esto, «atrás» desde «crear
   cuenta» salía del sitio entero, que no es lo que nadie espera. */
window.addEventListener("popstate", () => {
  if (portadaModo && portadaModo !== "entrar") { portadaPintar("entrar"); history.pushState(null, ""); }
});
try { history.pushState(null, ""); } catch (e) { /* da igual: solo es el colchón */ }
