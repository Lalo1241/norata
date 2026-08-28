/* Iconos, modelo, versión del formato, guardado, fechas y el modal */
"use strict";

/* ================= En qué versión vamos =================
   Un solo número para toda la app, y el sitio donde se cambia es este.

   Contesta dos preguntas distintas con la misma cifra. La de Eduardo: "¿ya
   está arriba lo que hicimos?" —abre la app, mira la esquina de abajo y si el
   número es el que le dijeron, el despliegue llegó; si no, GitHub Pages
   todavía va en camino o el aparato sigue con la copia vieja—. Y la mía:
   nombrar cada tanda de trabajo en vez de decir "lo de ayer".

   CÓMO SE CUENTA

     0 . 6 . 2 . 1
     │   │   │   └─ un retoque suelto: un rótulo, un color, un arreglo
     │   │   └───── una tanda: varias cosas de una sentada
     │   └───────── la app hace algo que antes no hacía
     └───────────── 0 hasta la Play Store; 1 el día del lanzamiento

   Cuatro tramos y no tres. Con tres, cambiar dos palabras de un rótulo subía
   el mismo número que rehacer media pantalla, y a ese paso el número corre
   sin que lo que cuenta haya corrido igual. El cuarto existe para eso: los
   retoques se cuentan aparte y no inflan la tanda.

   NINGÚN TRAMO SE PARA EN 9. No son décimas de verdad, son casillas: después
   de 0.6.9 viene 0.6.10, y 0.6.14.23 es un número perfectamente válido. Nunca
   hay que "saltar de nivel" porque el de abajo se haya llenado —no se llena—.
   Se sube de nivel cuando lo que se hizo lo merece, y solo entonces.

     el 4º   un retoque suelto. Lo de arreglar lo que se acaba de ver.
     el 3º   una tanda: varias cosas de una sentada. Vuelve el 4º a 0.
     el 2º   la app hace algo que antes no hacía, o cambia la forma de
             usarla: un módulo nuevo, una pantalla nueva. Vuelven 3º y 4º a 0.
     el 1º   el lanzamiento en la Play Store, y lo dice Eduardo.

   La prueba para el 2º: si el salto no se cuenta en una frase, no es un 2º.

   0.8 ESTÁ APARTADO: es la beta, y a partir de ahí el salto es grande. No se
   coge por acumulación. Mientras tanto la cuenta sigue por dentro de 0.7 —
   0.7.1, 0.7.2…— aunque toque algo que en otro momento habría subido el 2º.
   Lo decide Eduardo, igual que el 1.0. El detalle, en VERSIONES.md.

   AL CAMBIARLO hay que tocar tres sitios, y son tres a propósito —cada uno
   sirve para algo distinto y descuadrarlos se nota enseguida—:
     1. este número
     2. la fecha de aquí abajo
     3. `CACHE` en sw.js, que lleva el mismo número: es lo que obliga a los
        aparatos ya instalados a soltar la copia vieja.
   Y la línea que lo cuenta, en VERSIONES.md. */
const VERSION = "0.7.20";
const VERSION_FECHA = "27 ago 2026";

/* ================= Iconografía propia =================
   Iconos de trazo (24x24) dibujados a mano; nada de emojis. */

const ICONS = {
  brush: '<path d="M9.1 11.9l8.1-8.1a2.85 2.85 0 114 4l-8.1 8.1"/><path d="M7.1 14.9c-1.7 0-3 1.4-3 3 0 1.3-2.5 1.5-2 2 1.1 1.1 2.5 2 4 2 2.2 0 4-1.8 4-4a3 3 0 00-3-3z"/>',
  pen: '<path d="M17 3a2.8 2.8 0 114 4L7.5 20.5 2 22l1.5-5.5z"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>',
  dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11"/>',
  code: '<path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  camera: '<path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>',
  mic: '<path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><path d="M12 19v4"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20 15.3 15.3 0 010-20z"/>',
  /* La S arranca arriba a la DERECHA y termina abajo a la izquierda. Al revés
     dibuja una "Ƨ" espejada, que es lo que tenía antes. */
  coin: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M14.5 9.7c0-1-1.1-1.7-2.5-1.7s-2.5.7-2.5 1.7 1 1.5 2.5 1.8 2.5.8 2.5 1.8-1.1 1.7-2.5 1.7-2.5-.7-2.5-1.7"/>',
  bulb: '<path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7c.6.5 1 1.4 1 2.3h6c0-.9.4-1.8 1-2.3A7 7 0 0012 2z"/>',
  heart: '<path d="M12 20.5s-7.4-4.8-9.4-9.2C1.4 8.4 3.3 5.5 6.4 5.5c2 0 3.3 1.1 4.1 2.5.8-1.4 2.1-2.5 4.1-2.5 3.1 0 5 2.9 3.8 5.8-2 4.4-9.4 9.2-9.4 9.2z"/>',
  flame: '<path d="M12 22c4.4 0 7-2.9 7-6.5 0-4.5-4-6.3-4.5-10C13 7 11 8.5 11 11c-1.5-.6-2-2.3-1.8-4C6.5 8.8 5 11.5 5 15.5 5 19.1 7.6 22 12 22z"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 01-10 0z"/><path d="M7 6H4a3 3 0 003 5M17 6h3a3 3 0 01-3 5"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94z"/>',
  coffee: '<path d="M18 8h1a4 4 0 010 8h-1M2 8h16v6a4 4 0 01-4 4H6a4 4 0 01-4-4z"/><path d="M6 1v3M10 1v3M14 1v3"/>',
  plant: '<path d="M12 22V8M12 8C12 5 9 3 6 3c0 3 2 5.5 6 5M12 12c0-3 3-5 6-5 0 3-2 5.5-6 5"/>',
  cap: '<path d="M22 9L12 4 2 9l10 5z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5"/>',
  chart: '<path d="M4 20v-6M10 20V6M16 20v-9M2 20h20"/>',
  map: '<path d="M1 6v16l7-3 8 3 7-3V3l-7 3-8-3z"/><path d="M8 3v16M16 6v16"/>',
  compass: '<circle cx="12" cy="12" r="10"/><path d="M16 8l-2.5 6L8 16l2.5-6z"/>',
  crown: '<path d="M3 18h18M4 18l-1-9 5 3 4-6 4 6 5-3-1 9z"/>',
  gem: '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20"/>',
  /* Los tres planes, en la misma piedra. Se leen en fila —libre, Pro,
     fundador— y por eso comparten silueta: si cada nivel fuera un dibujo
     distinto habria que aprenderse tres cosas en vez de notar que una crece.
     El libre es la piedra desnuda, el Pro le talla las caras, y el fundador
     le pone corona encima (que es lo unico que cabe arriba sin encoger la
     piedra hasta que no se lea a 16 px). */
  "plan-libre": '<path d="M7.5 3.5h9l4 5.5-8.5 11.5L3.5 9z"/>',
  "plan-pro": '<path d="M7.5 3.5h9l4 5.5-8.5 11.5L3.5 9z"/><path d="M3.5 9h17M9.8 9L12 3.5l2.2 5.5-2.2 11.5z"/>',
  "plan-fundador": '<path d="M8.5 10h7l3 4-6.5 7.5L5.5 14z"/><path d="M5.5 14h12"/><path d="M6.2 7.4l-1.2-5.2 3.9 2.6L12 1.4l3.1 3.4 3.9-2.6-1.2 5.2z"/>',
  gamepad: '<path d="M6 12h4M8 10v4M15.5 11h.01M18 13.5h.01"/><path d="M17.3 5H6.7a4.7 4.7 0 00-4.6 5.6l1 5A3 3 0 006 18c1 0 1.7-.4 2.3-1l1-1h5.4l1 1c.6.6 1.4 1 2.3 1a3 3 0 002.9-2.4l1-5A4.7 4.7 0 0017.3 5z"/>',
  star: '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 5.9-5.3-3-5.3 3 1.2-5.9L3.4 9.3l6-.7z"/>',
  bolt: '<path d="M13 2L5 14h6l-1 8 8-12h-6l1-8z"/>',
  /* Escudo: lo que no se pierde. Se usa junto a "Habilidad blindada" y está
     en el catálogo porque sirve igual para defensa, seguridad o constancia. */
  shield: '<path d="M12 2.5l8 3.2v5.8c0 4.6-3.3 8.7-8 10-4.7-1.3-8-5.4-8-10V5.7z"/>',
  /* Cara guiñando: el ojo izquierdo es punto y el derecho una curva cerrada.
     Es el icono de Carisma y de todo lo que sea trato con gente. */
  smile: '<circle cx="12" cy="12" r="9.2"/><path d="M8.2 14.8c.9 1.2 2.2 1.9 3.8 1.9s2.9-.7 3.8-1.9"/><path d="M9 9.6v.01"/><path d="M14.1 9.9c.5-.6 1.3-.6 1.8 0"/>',
  /* Caña de pescar: vara en diagonal, carrete, sedal recto desde la punta y
     anzuelo. Dos detalles se decidieron probándolo al tamaño real de la
     tarjeta y no a tamaño grande: el carrete va separado de la vara, porque
     encima se fundía con ella en un bulto, y el anzuelo abre hacia afuera,
     porque cerrándose hacia la vara el conjunto se leía como un triángulo. */
  rod: '<path d="M3 20.6L14.6 6"/><circle cx="7.2" cy="17.6" r="1.5"/><path d="M14.6 6v8.2"/><path d="M14.6 14.2a1.9 1.9 0 003.8 0v-.8"/>',
  /* Gafas de buceo, sin tubo: dos lentes, el puente y la cinta que rodea la
     cabeza. Sin snorkel se distinguen mejor de la careta de esnórquel. */
  goggles: '<circle cx="7.6" cy="13.4" r="3.9"/><circle cx="16.4" cy="13.4" r="3.9"/><path d="M11.5 13.4h1"/><path d="M4.2 11.2C3.1 8.6 6 6.6 12 6.6s8.9 2 7.8 4.6"/>',
  /* Llave: es el icono del tipo Compra, que existe para abrir el paso a lo
     que sigue. El anillo abajo a la izquierda y los dientes sobre la caña,
     perpendiculares a ella, que es lo que la distingue de una paleta. */
  key: '<circle cx="7.6" cy="15.4" r="4.6"/><path d="M10.9 12.1L20.5 2.5"/><path d="M15.2 7.8l2.3 2.3"/><path d="M17.9 5.1l2.3 2.3"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>',
  /* Una puerta abierta, vista un poco desde arriba. La primera version se leia
     como un edificio: tenia la hoja estrechandose por arriba y por abajo, y
     ese doble escorzo sobre un rectangulo alto es exactamente la silueta de
     una torre. Aqui la hoja es un PARALELOGRAMO —los dos lados verticales
     miden lo mismo y solo esta desplazado hacia abajo el lado cercano—, que
     es como se ve una puerta abierta en un picado suave y no se confunde con
     nada. El suelo, partido en dos trazos, es lo que remata la lectura: sin
     el, cualquier cosa vertical puede ser un mueble. */
  puerta: '<path d="M2.5 20.5h4.5"/><path d="M17.5 20.5h4"/><path d="M7 3h10.5v17.5"/><path d="M7 3l6.5 3.2v14.3L7 17.3z"/><path d="M11.9 12.6v2.2"/>',
  /* Una papelera. La tapa aparte del cuerpo y dos rayas dentro: sin ellas se
     confunde con un vaso a tamaño pequeño. */
  papelera: '<path d="M4 7h16"/><path d="M10 4h4"/><path d="M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13"/><path d="M10 11v6M14 11v6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  play: '<path d="M8 5.5l11 6.5-11 6.5z" stroke-linejoin="round"/>',
  alert: '<path d="M12 7v7M12 17.4v.2"/>',
  close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  settings: '<path d="M5 8h14M5 16h14"/><circle cx="9" cy="8" r="2.2"/><circle cx="15" cy="16" r="2.2"/>',
  /* Sol y luna: los dos modos de la app. Ocho rayos y no doce, porque a
     15 px los doce se empastan en una rueda gris. */
  sol: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.3M12 19.1v2.3M2.6 12h2.3M19.1 12h2.3M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6"/>',
  /* La luna va con el hueco a la DERECHA, mirando al sol de al lado: al
     revés los dos iconos se dan la espalda y la pareja se lee peor. */
  luna: '<path d="M20 14.2A8.4 8.4 0 019.8 4 8.4 8.4 0 1020 14.2z"/>'
};

const ICON_LIST = ["brush","pen","book","dumbbell","code","music","camera","mic","globe","coin","bulb","heart","flame","trophy","target","flag","wrench","coffee","plant","cap","chart","map","compass","crown","gem","gamepad","star","bolt","shield","smile","rod","goggles","key","papelera"];

const EMOJI_TO_ICON = {
  "🎨":"brush","🍳":"coffee","💪":"dumbbell","📚":"book","🎸":"music","💻":"code","🗣️":"mic","🧘":"heart",
  "✍️":"pen","📷":"camera","🎮":"gamepad","🏃":"bolt","🌱":"plant","💰":"coin","🧠":"bulb","❤️":"heart",
  "🎬":"camera","🛠️":"wrench","🌎":"globe","🎤":"mic","♟️":"crown","🏊":"target","🚴":"bolt","☕":"coffee"
};

function icon(name, size) {
  const paths = ICONS[name] || ICONS.star;
  return `<span class="ic"><svg viewBox="0 0 24 24" width="${size || 20}" height="${size || 20}">${paths}</svg></span>`;
}

/* ================= De noche o de día =================
   La app nació oscura y esa sigue siendo su cara: quien no toque nada la ve
   igual que siempre. El modo claro es para quien lo pida —una pantalla al
   lado de una ventana a mediodía es un espejo—, y por eso el valor de
   partida es "oscuro" y no lo que diga el sistema: si siguiéramos al sistema,
   media Norata cambiaría de aspecto de golpe sin que nadie lo hubiera pedido.

   Es preferencia DE ESTE APARATO, no dato del usuario: vive en su propia
   llave de localStorage y nunca en `state`. Si viajara con la cuenta, poner
   el teléfono en claro te dejaría la computadora en claro también, y el
   teléfono se usa en la calle y la computadora de noche. Por eso mismo
   tampoco entra en los respaldos ni en la sincronía.

   Lo único que hace es poner (o quitar) la clase `claro` en <html>. De ahí
   para abajo, todo el color sale de las variables de `css/estilos.css`. */
const TEMA_LLAVE = "norata-tema";

/* ---- Los colores del usuario, en la cara que toca ----
   Cada uno de los ocho de `COLORS` tiene DOS caras, declaradas en el CSS como
   `--paleta-1` … `--paleta-8`: la de noche —pastel, para brillar sobre
   carbón— y la de día, más saturada, porque sobre papel un pastel se lava y
   deja de ser un color. El color guardado en los datos no cambia nunca, que
   es suyo; lo que cambia es con cuál de las dos se pinta.

   Tres ayudantes, tres papeles, y la diferencia importa: un relleno se ve a
   cualquier tono, pero un número escrito en amarillo luciérnaga de día da 1,47 sobre
   1 y no se lee. Escribir no es lo mismo que rellenar.

     pinta(c)       rellenar: un punto, una barra, el aro de un nodo
     tinta(c)       escribir o trazar: un número, un icono, un contorno
     velo(c, "22")  el fondo tenue de una pastilla, con su transparencia

   Los tres devuelven `var(...)` o `color-mix(...)`, nunca un color ya
   resuelto: así lo recalcula el navegador al cambiar de modo, sin tener que
   volver a dibujar la pantalla. */

/* Busca el color por POSICIÓN en la lista, no por nombre: la posición es lo
   que ata cada tono con su pareja de día. Lo que no esté en la lista —datos
   viejos, un color escrito a mano— sale tal cual y se apaña con el hundido. */
function caraDe(col) {
  const i = COLORS.indexOf(String(col).toLowerCase());
  return i === -1 ? null : `var(--paleta-${i + 1})`;
}

function pinta(col) {
  if (!col) return "var(--mint)";
  if (String(col).indexOf("var(") === 0) return col;
  return caraDe(col) || col;
}

/* Escribir con él. `--hundir` vale 0% de noche —o sea, no mezcla nada, el
   color sale exactamente como estaba— y 50% de día, que es lo que hace falta
   para que el peor de los ocho llegue a 4,65 sobre una tarjeta. Un `var(...)`
   que llegue ya hecho se devuelve intacto: eso ya es un color de la app, y
   hundirlo otra vez lo dejaría negro. */
function tinta(col) {
  if (!col) return "var(--mint)";
  if (String(col).indexOf("var(") === 0) return col;
  return `color-mix(in srgb, ${pinta(col)}, var(--tinta-fondo) var(--hundir))`;
}

/* Trazar con él: el aro de una misión, el contorno de un nodo del árbol, el
   hilo entre dos, una raya de 2 px. Un dibujo pide 3 sobre 1 y no 4,5, así
   que puede quedarse mucho más cerca del color de verdad que un texto.

   Cada uno tiene su propia versión de línea (`--paleta-N-linea`) en vez de
   hundirse todos el mismo porcentaje, y la diferencia se ve: al coral le
   sobra con un 11% y al amarillo le hace falta un 36%, así que bajarlos a
   todos lo mismo dejaba el coral color ladrillo sin ninguna necesidad. Tres
   de los ocho no se mueven nada.

   Lo que no esté en la lista se apaña con el hundido general, que es lo único
   que se puede hacer sin conocer el color de antemano. */
function trazo(col) {
  if (!col) return "var(--mint)";
  if (String(col).indexOf("var(") === 0) return col;
  const i = COLORS.indexOf(String(col).toLowerCase());
  if (i !== -1) return `var(--paleta-${i + 1}-linea)`;
  return `color-mix(in srgb, ${col}, var(--tinta-fondo) var(--hundir-trazo))`;
}

/* Las dos caras de una cosa del usuario, listas para pegar en un `style`: la
   de rellenar y la de trazar. Van juntas porque casi siempre hacen falta las
   dos en la misma tarjeta —el icono se rellena y el aro se traza— y separarlas
   era la forma segura de que una se quedara sin actualizar. */
function tonos(nombre, col) {
  return `--${nombre}:${pinta(col)};--${nombre}-l:${trazo(col)}`;
}

/* El fondo tenue de una pastilla. Antes se armaba pegándole la transparencia
   al final del hex (`col + "22"`), y eso ataba el relleno a la cara de noche
   para siempre: a un `var(...)` no se le pueden pegar dos dígitos detrás.
   Recibe esos mismos dos dígitos para no ir traduciendo a mano en cada sitio. */
function velo(col, alfa) {
  const pct = Math.round((parseInt(alfa, 16) / 255) * 100);
  return `color-mix(in srgb, ${pinta(col)} ${pct}%, transparent)`;
}

function temaEsClaro() {
  return document.documentElement.classList.contains("claro");
}

/* El logotipo de la portada es un <img>, y a una imagen no se le puede
   cambiar el color desde el CSS: hay que cambiar de archivo. Los dos existen
   desde siempre en `marca/` y los nombres dicen de qué COLOR es el dibujo,
   no para qué fondo sirve —el claro es el que se usa sobre fondo oscuro—,
   que es justo al revés de lo que uno lee con prisa. */
function logotipoSrc() {
  const archivo = temaEsClaro() ? "logotipo-oscuro.svg" : "logotipo-claro.svg";
  /* Con `../` desde la puerta, que vive en `/login/` y no en la raíz. La ruta
     era relativa a secas y ahí resolvía a `/login/marca/…`: un 404 y el logo
     roto justo en la primera pantalla que ve alguien. No se usa una ruta
     absoluta (`/marca/…`) porque el proyecto se puede servir desde una
     subcarpeta —así se prueba en local— y ahí la absoluta se saldría del
     sitio. */
  const raiz = document.getElementById("view-summary") ? "" : "../";
  return raiz + "marca/" + archivo;
}

function ponerTema(cual) {
  const claro = cual === "claro";
  const raiz = document.documentElement;

  /* Un instante sin transiciones, y esto NO es por estética.
     En esta app una transición sobre una propiedad cuyo valor sale de una
     variable se queda congelada: Chrome no se entera del cambio y deja el
     color clavado en el primero que vio, para siempre. Cambiar de modo
     cambia TODAS las variables de golpe, así que sin esto media app se
     quedaba de noche —medido: la tarjeta de un cuadro de diálogo seguía en
     #1d2530 con el texto ya oscuro encima, ilegible—.
     Se apagan, se cambia, se fuerza el recálculo leyendo un estilo, y se
     devuelven en el siguiente cuadro. */
  raiz.classList.add("cambiando-modo");
  raiz.classList.toggle("claro", claro);
  getComputedStyle(raiz).backgroundColor;   // obliga a recalcular ya, no luego
  /* Y se devuelven en el siguiente turno. Con requestAnimationFrame no vale:
     en una pestaña que está en segundo plano el navegador no dibuja cuadros,
     así que ese aviso no llega nunca y la app se quedaba SIN transiciones
     para siempre. Un temporizador se dispara igual aunque no se pinte.
     Da igual que tarde: el color nuevo ya entró en el recálculo de arriba,
     con las transiciones apagadas, así que no queda ninguna a medias. */
  setTimeout(() => raiz.classList.remove("cambiando-modo"), 0);
  try { localStorage.setItem(TEMA_LLAVE, claro ? "claro" : "oscuro"); } catch (e) {}
  /* La franja del navegador de arriba —y en Android la barra de estado de la
     app instalada— no la pinta el CSS: sale de esta etiqueta, y sin
     cambiarla la app clara se queda con una ceja negra encima. */
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", claro ? "#f2f4f8" : "#10151d");
  pintarTema();
}

function alternarTema() {
  ponerTema(temaEsClaro() ? "oscuro" : "claro");
}

/* El interruptor de sol y luna. Sale de aquí y no del HTML porque vive en
   dos sitios a la vez —la pantalla de Ajustes del teléfono y el mini menú
   del engrane en la computadora—, y dos copias escritas a mano acabarían
   diciendo cosas distintas. Por eso también va con clases y no con ids. */
function temaSwitchHTML() {
  const claro = temaEsClaro();
  const op = (valor, nombre, ico, activo) => `
    <button type="button" class="ts-op${activo ? " on" : ""}" role="radio"
      aria-checked="${activo}" onclick="ponerTema('${valor}')">
      ${icon(ico, 15)}<span>${nombre}</span>
    </button>`;
  return `
    <div class="tema-fila">
      <span class="tema-tit">Aspecto</span>
      <div class="tema-sw" role="radiogroup" aria-label="Aspecto de la app">
        ${op("oscuro", "Oscuro", "luna", !claro)}
        ${op("claro", "Claro", "sol", claro)}
      </div>
    </div>`;
}

/* Al cambiar de modo, los interruptores que estén puestos tienen que quedar
   marcados donde toca. Se vuelven a dibujar en vez de manosear clases uno a
   uno: así solo hay una descripción de cómo se ve el control, la de arriba. */
function pintarTema() {
  document.querySelectorAll(".tema-hueco").forEach(h => { h.innerHTML = temaSwitchHTML(); });
  // Y el logotipo de la portada, que es una imagen y no se recolorea sola
  document.querySelectorAll(".portada-logo").forEach(img => { img.src = logotipoSrc(); });
}

/* ================= Modelo y persistencia ================= */

/* ================= Talentos: los tres tipos =================
   Antes el tipo no era un campo: se deducía de dos banderas sueltas, `mini`
   e `instant`. Cuatro combinaciones posibles para tres tipos con nombre, y
   un interruptor de "Asegurado al pagar" que se podía marcar dentro de un
   mini-talento y que al guardar se descartaba sin decir nada.

   Ahora es un campo con tres valores, así que la cuarta combinación deja de
   ser escribible. Los tres responden a la misma pregunta —qué hace falta
   para que sea tuyo— y por eso se distinguen sin memorizarlos:

     compra  dinero              y existe para abrir el paso a lo que sigue
     hito    una acción puntual  y se cierra en sí mismo
     meta    tiempo sostenido    y avanza por etapas

   La diferencia entre compra e hito no es la etiqueta: una compra PIDE
   importe porque es una llave que se paga, y un hito NO lo admite porque
   lo que registra es que lo hiciste, no lo que gastaste.

   La figura de cada tipo vive aquí y no repartida por el dibujo: el radio
   se usa en cuatro sitios distintos (dónde nace una línea, dónde muere,
   cuánto mide el nodo y dónde cae su etiqueta) y tenerlo en un solo lugar
   es lo que impide que se desincronicen. */
const TIPOS = {
  compra: {
    nombre: "Compra",
    sub: "Una llave: la pagas y te abre el paso a lo que sigue. Equipo, licencias, cursos.",
    icono: "key",
    pideImporte: true,
    llevaPlan: false,
    /* El circulo pequeno: una compra es la pieza mas menuda del mapa, la
       llave que abre el paso y se resuelve aparte. Una llave literal seria
       mas narrativa pero rompe la retícula de nodos, que necesita figuras
       con un radio predecible en cada rumbo. */
    forma: "circulo",
    glifo: "○",
    radio: 17,
    tecla: "E"
  },
  hito: {
    nombre: "Hito",
    sub: "Una acción puntual que se cierra en sí misma: publicar un dibujo, dar una clase de prueba.",
    icono: "flag",
    pideImporte: false,
    llevaPlan: false,
    // El hexagono: un hito es un logro cerrado, con peso propio en el camino
    forma: "hexagono",
    glifo: "⬡",
    radio: 26,
    tecla: "Q"
  },
  meta: {
    nombre: "Meta",
    sub: "Algo que sostienes en el tiempo. Avanza por etapas y tiene fecha límite.",
    icono: "target",
    pideImporte: false,
    llevaPlan: true,
    forma: "rombo",
    glifo: "◇",
    radio: 23,
    tecla: "W"
  }
};

function tipoDe(p) { return TIPOS[p.tipo] ? p.tipo : "meta"; }
function metaDe(p) { return TIPOS[tipoDe(p)]; }

/* Traduce las banderas viejas y las borra. Se llama al cargar, así que un
   tablero guardado con la versión anterior se convierte solo la primera vez
   que se abre y ya nunca vuelve a pasar por aquí. */
function migrarTipoTalento(p) {
  if (!TIPOS[p.tipo]) {
    p.tipo = p.mini ? "hito" : (p.instant ? "compra" : "meta");
    /* El avance viejo era un porcentaje puesto a ojo y el nuevo se cuenta
       por etapas, así que no hay forma honesta de traducirlo. Pero tampoco
       se tira en silencio: quien tenía una meta al 45% vería el medidor
       caer a cero sin explicación. Queda escrito en su historial. */
    if (p.tipo === "meta" && p.progress > 0 && p.status === "active") {
      p.history = p.history || [];
      p.history.unshift({
        date: todayKey(), at: stamp(),
        event: `Avance anterior: ${Math.round(p.progress)}%. Ahora el avance se cuenta por etapas — añádelas para volver a medirlo.`
      });
    }
  }
  delete p.mini;
  delete p.instant;
  delete p.progress;

  /* Un requisito suelto se convierte en una lista de uno. El modo arranca
     en "todos" porque con un solo requisito las dos lecturas coinciden, y
     así lo que ya existía no cambia de comportamiento al migrar. */
  if (!Array.isArray(p.requiere)) {
    p.requiere = p.requiresId ? [p.requiresId] : [];
  }
  if (p.modo !== "cualquiera") p.modo = "todos";
  delete p.requiresId;
}

/* El proyecto pasó a llamarse Norata, pero las llaves de almacenamiento
   conservan el nombre viejo a propósito: renombrarlas dejaría huérfano el
   progreso de quien ya venía usando la app. El nombre visible y el nombre
   interno no tienen por qué coincidir. */
/* Las colecciones que forman el progreso. Se declaran aquí arriba y no junto
   a lo que las usa porque `load()` las necesita, y `load()` corre en cuanto
   este archivo se ejecuta: declararlas después las deja fuera de alcance en
   ese instante y la app no arranca.
   Añadir una colección nueva al estado obliga a sumarla aquí, o quedará
   fuera de la detección de borrados y de la fusión entre dispositivos. */
const COLECCIONES = ["skills", "missions", "perks", "projects", "cajas", "tableros"];
const DIAS_DE_TUMBA = 120;
let idsVivos = null;

const STORE_KEY = "mainquest-v1";

/* ================= Versión del formato de datos =================
   Hasta aquí `load()` normalizaba lo que llegara y listo. Eso basta mientras
   todos los dispositivos corran la misma versión de la app, que es lo que pasa
   cuando el único usuario eres tú. En cuanto haya cuentas dejará de ser
   cierto: alguien tendrá el teléfono sin actualizar y abrirá datos escritos
   por una versión más nueva. Sin un número que lo delate, la app vieja los
   leería a medias, guardaría encima y borraría lo que no entiende, callando.

   La regla va en un solo sentido: los datos VIEJOS se suben de escalón; los
   datos NUEVOS no se tocan, y mucho menos se escriben. */

const SCHEMA = 2;

/* Cada entrada sube un escalón: `MIGRACIONES[n]` convierte datos de la
   versión n a la n+1. */
const MIGRACIONES = {
  /* v1 -> v2. Las misiones guardaban un NÚMERO por día: "hoy, 3 veces". Un
     número no se puede fusionar. Si el teléfono dice 3 y la computadora dice
     2, no hay forma de saber si son los mismos tres registros vistos dos
     veces —y entonces son 3— o cinco distintos —y entonces son 5—. Con el
     dato que hay, cualquier respuesta es una adivinanza.

     Ahora cada registro es una marca con identidad propia, así que juntar
     dos dispositivos es juntar dos conjuntos: lo que está en los dos se
     cuenta una vez, lo que está en uno solo se suma, y da igual el orden en
     que se fusionen o cuántas veces se repita.

     Las marcas que nacen aquí llevan un id DERIVADO de la fecha y la
     posición, no uno al azar: los dos dispositivos migran los mismos datos
     por su cuenta y tienen que llegar al mismo id, o al sincronizarse se
     duplicaría todo el historial de misiones. */
  1(d) {
    (d.missions || []).forEach(m => {
      if (!m.log || typeof m.log !== "object") { m.log = {}; return; }
      Object.keys(m.log).forEach(k => {
        if (Array.isArray(m.log[k])) return;
        const cuantas = Math.max(0, Math.floor(Number(m.log[k]) || 0));
        if (!cuantas) { delete m.log[k]; return; }
        m.log[k] = Array.from({ length: cuantas }, (_, i) => "v1." + k + "." + i);
      });
    });
    return d;
  }
};

/* Mientras esté puesto, la app mira pero no escribe. Es la única defensa
   real contra estropear datos que no entiende. */
let modoSoloLectura = false;

/* El ejemplo es un PREVISUALIZADOR, no una carga: mientras está puesto, la
   app se puede tocar entera pero no escribe ni sube nada, y al salir todo
   vuelve exactamente a como estaba. Ver `verElEjemplo` en 09-inicio.js.

   Vive aquí y no allí por dos motivos. El de forma: quien lo lee es
   `guardarLocal`, cuatrocientas líneas más abajo, y una bandera declarada en
   un archivo que se carga después daría un error de zona muerta el día que
   algo guarde antes de tiempo. Y el de fondo: **este es el sitio donde están
   los candados del guardado**, y tenerlos juntos es lo que hace que se vean.
   Un tercer candado escondido en otro archivo es el que un día no se mira.

   El candado está en `guardarLocal` y en `syncTouch`/`syncRun`, o sea en el
   disco y en el servidor, y no en cada botón. Es a propósito: el ejemplo deja
   cumplir misiones, mover talentos y abrir cajas —eso es lo que hay que poder
   previsualizar—, así que taparlo acción por acción sería una lista que se
   queda corta a la primera pantalla nueva. Se corta donde sale, que son dos
   puertas y están las dos aquí al lado. */
let modoEjemplo = false;

function migrar(data) {
  // Lo que no lleva número es de antes de que existiera el número: es v1
  const v = Number(data && data.schemaVersion) || 1;

  if (v > SCHEMA) {
    /* Bajar de versión sería inventarse qué tirar. Mejor no tocar nada y
       decirlo. */
    modoSoloLectura = true;
    return data;
  }

  for (let n = v; n < SCHEMA; n++) {
    const paso = MIGRACIONES[n];
    if (paso) data = paso(data) || data;
  }
  data.schemaVersion = SCHEMA;
  return data;
}

const MAX_LEVEL = 10;
const COLORS = ["#5fe0b0","#f5d76e","#ff8a70","#b7a2ea","#6fc3e8","#8fd18a","#f0a5c0","#9aa7b8"];
const FMT_MONEY = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

let state = load();
let currentSkillId = null;
let editingSkillId = null;
let currentPerkId = null;
let editingPerkId = null;
let currentProjectId = null;
let editingProjectId = null;
let activeCategory = "Todas";
let selectedQuickXp = 40;   // la práctica moderada, valor medio de PRACTICAS
let activeMainView = "summary";
let lastDetailPct = 0;
/* El anillo del día en Misiones recuerda dónde estaba para poder viajar
   hasta el valor nuevo en vez de aparecer ya puesto. Empieza en null y no en
   cero para distinguir "todavía no se ha pintado nunca" —donde sí queremos
   el barrido desde cero, que da la sensación de que el día arranca— de "es
   un repintado" —donde se parte de lo que había. */
let lastMisionPct = null;

function load() {
  let data = { skills: [], perks: [], projects: [] };
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) data = JSON.parse(raw);
  } catch (e) { /* datos corruptos: empezar de cero */ }
  /* Antes de mirar nada más: de qué versión vienen. Si son más nuevos que
     esta app, `migrar` enciende el modo solo lectura y a partir de ahí lo que
     sigue se hace en memoria sin llegar nunca al disco. */
  data = migrar(data);
  if (!Array.isArray(data.skills)) data.skills = [];
  if (!Array.isArray(data.perks)) data.perks = [];
  if (!Array.isArray(data.projects)) data.projects = [];
  if (!Array.isArray(data.missions)) data.missions = [];
  if (!Array.isArray(data.cajas)) data.cajas = [];
  /* Los tableros que el usuario se inventa en Misiones. Los tres de siempre
     —hoy, la semana, las terminadas— no viven aquí: no se pueden borrar ni
     renombrar, así que no son datos, son la pantalla. */
  if (!Array.isArray(data.tableros)) data.tableros = [];
  if (!data.borrados || typeof data.borrados !== "object") data.borrados = {};
  if (!data.settings) data.settings = {};
  if (!data.settings.timezone) {
    try { data.settings.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; }
    catch (e) { data.settings.timezone = "UTC"; }
  }
  const tablerosVivos = new Set(data.tableros.map(t => t && t.id));
  data.missions.forEach((m, i) => {
    if (!m.color) m.color = COLORS[i % COLORS.length];
    if (!m.icon) m.icon = ICON_LIST[(i * 6 + 14) % ICON_LIST.length];
    if (!m.cadence) m.cadence = "daily";
    if (!m.log) m.log = {};
    /* Una misión apartada en un tablero que ya no existe —borrado en otro
       dispositivo— se quedaría escondida para siempre: no sale en ninguna
       columna y no hay forma de llegar a ella. Vuelve al ciclo normal. */
    if (m.tablero && m.tablero !== "semana" && !tablerosVivos.has(m.tablero)) {
      delete m.tablero;
      delete m.pospuesta;
    }
  });
  data.projects.forEach((p, i) => {
    if (!p.color) p.color = COLORS[i % COLORS.length];
    if (!p.icon) p.icon = ICON_LIST[(i * 4 + 1) % ICON_LIST.length];
    if (!Array.isArray(p.steps)) p.steps = [];
    if (!p.status) p.status = "active";
  });
  data.skills.forEach((s, i) => {
    if (!s.color) s.color = COLORS[i % COLORS.length];
    if (!s.icon) s.icon = EMOJI_TO_ICON[s.emoji] || ICON_LIST[i % ICON_LIST.length];
    /* El historial se da por hecho en media app (`s.log.unshift`, `for (const
       e of s.log)`), así que una habilidad sin él tumba la pantalla entera.
       No pasa con datos nacidos aquí, pero sí con un respaldo editado a mano
       o venido de otro sitio — y de eso va a haber más, no menos. Y un XP que
       no sea número es peor que un fallo: se propaga como NaN sin avisar. */
    if (!Array.isArray(s.log)) s.log = [];
    if (typeof s.xp !== "number" || !isFinite(s.xp)) s.xp = 0;
  });
  const idsDeTalento = new Set(data.perks.map(p => p.id));
  data.cajas.forEach(c => {
    if (!Array.isArray(c.perkIds)) c.perkIds = [];
    c.perkIds = c.perkIds.filter(id => idsDeTalento.has(id));
    /* Una caja dejó de ser un archivador para ser un GRUPO, y un grupo es un
       nodo más del mapa: tiene nombre propio, sitio propio y conexiones
       propias. Lo que se guarda aquí es lo que el usuario decidió a mano; lo
       que hereda de sus miembros se recalcula en cada dibujo (R5). */
    if (!Array.isArray(c.requiere)) c.requiere = [];
    if (c.modo !== "cualquiera") c.modo = "todos";
    if (!c.pos || typeof c.pos !== "object") c.pos = {};
  });
  data.cajas = data.cajas.filter(c => c.perkIds.length);
  /* Una conexión que apunta a algo que ya no existe deja al nodo bloqueado
     sin causa visible, así que al cargar se barren las que quedaron sueltas
     —de una caja que se vació, de un talento borrado en otro dispositivo—.
     Vale tanto para los talentos como para las cajas: desde que las dos
     cosas se conectan, las dos pueden quedarse colgando. */
  const idsDeCaja = new Set(data.cajas.map(c => c.id));
  const vivo = id => idsDeTalento.has(id) || idsDeCaja.has(id);
  data.cajas.forEach(c => {
    c.requiere = c.requiere.filter(id => vivo(id) && id !== c.id);
  });
  data.perks.forEach((p, i) => {
    if (!p.icon) p.icon = ICON_LIST[(i * 5 + 3) % ICON_LIST.length];
    if (!p.color) p.color = COLORS[(i * 3 + 2) % COLORS.length];
    migrarTipoTalento(p);
    if (!Array.isArray(p.steps)) p.steps = [];
    // Después de migrar: así también se limpia el requisito único de antes
    p.requiere = p.requiere.filter(id => vivo(id) && id !== p.id);
  });
  /* El punto de partida para detectar borrados: lo que hay justo ahora. Se
     fija aquí y no en `save()` porque `load()` también corre al adoptar algo
     de la sincronía, y ahí el conjunto de ids cambia de golpe sin que nadie
     haya borrado nada. */
  idsVivos = idsDeEstado(data);
  return data;
}

/* ================= Guardar sin perder nada =================
   `setItem` lanza de verdad cuando el navegador se queda sin sitio, y sin
   nadie que lo atrape el cambio que el usuario acaba de hacer se pierde sin
   que la app se entere. Por eso TODO lo que escribe el estado pasa por aquí
   y nadie llama a `localStorage.setItem(STORE_KEY, …)` por su cuenta.

   Cuando no cabe, primero se hace sitio soltando las copias de conflicto más
   viejas —son un respaldo, no datos vivos— y solo si aun así no cabe se
   avisa, con la salida a mano en el propio aviso. */

const COPIA_PREFIJO = "mainquest-conflicto-";
/* Tres. Eran cinco y es más de lo que nadie mira: la lista se volvía una
   pared de botones "Restaurar" iguales, y cada copia es un estado entero
   ocupando sitio en un almacén que también tiene que guardar lo vivo. */
const MAX_COPIAS = 3;
let avisoSinEspacio = false;

function guardarLocal(data) {
  /* La guarda que de verdad protege: si los datos de este dispositivo vienen de
     una versión más nueva, no se escribe. Ni al guardar, ni al importar, ni
     al traer algo de la sincronía. */
  if (modoSoloLectura) return false;
  /* Y el ejemplo, por lo mismo: lo que se ve es de mentira y no puede
     acabar en el disco de nadie. Al salir, el estado de verdad se restaura
     desde memoria; si en vez de salir se recarga la página, tampoco pasa
     nada — nunca se escribió, así que lo que carga es lo real. */
  if (modoEjemplo) return false;
  const texto = JSON.stringify(data);
  // Un intento por copia que se pueda tirar, más el primero
  for (let intento = 0; intento <= MAX_COPIAS; intento++) {
    try {
      localStorage.setItem(STORE_KEY, texto);
      /* Se rearma tras un guardado bueno: así una racha de fallos avisa una
         vez, pero un fallo nuevo semanas después vuelve a avisar. */
      avisoSinEspacio = false;
      return true;
    } catch (e) {
      if (!tirarCopiaMasVieja()) break;
    }
  }
  if (!avisoSinEspacio) {
    avisoSinEspacio = true;
    try {
      toast("No pude guardar: este navegador se quedó sin espacio. Exporta un respaldo antes de seguir.",
        "atencion", { label: "Exportar", onclick: "exportData()" });
    } catch (e) { /* ni el aviso pudo pintarse: la red de seguridad lo recoge */ }
  }
  return false;
}

/* Las copias de conflicto llevan el lado y el instante en el propio nombre;
   leerlos es lo que permite ordenarlas, enseñarlas y decidir cuál sobra. */
function listarCopias() {
  const out = [];
  let n = 0;
  try { n = localStorage.length; } catch (e) { return out; }
  for (let i = 0; i < n; i++) {
    const k = localStorage.key(i);
    if (!k || k.indexOf(COPIA_PREFIJO) !== 0) continue;
    const resto = k.slice(COPIA_PREFIJO.length);
    const corte = resto.lastIndexOf("-");
    const ms = Number(resto.slice(corte + 1));
    let datos = null;
    try { datos = JSON.parse(localStorage.getItem(k)); } catch (e) { /* copia ilegible */ }
    out.push({
      key: k,
      lado: corte > 0 ? resto.slice(0, corte) : resto,
      ms: isFinite(ms) && ms > 0 ? ms : 0,
      datos: datos
    });
  }
  return out.sort((a, b) => b.ms - a.ms);
}

function tirarCopiaMasVieja() {
  const copias = listarCopias();
  if (!copias.length) return false;
  try { localStorage.removeItem(copias[copias.length - 1].key); return true; }
  catch (e) { return false; }
}

/* ---- Qué se borró, y cuándo ----
   Una fusión automática que solo une lo que ve resucita lo borrado: el
   teléfono todavía tiene la misión que quitaste en la computadora, y al
   juntarlos vuelve. Para distinguir "esto es nuevo allá" de "esto lo maté
   aquí" hace falta recordar las muertes.

   Se detectan solas comparando con el guardado anterior, en vez de anotarlas
   en cada sitio que borra algo. Hay diez sitios distintos que borran, y el
   siguiente que alguien añada se olvidaría de anotarlo; así no hay nada que
   recordar. */

function idsDeEstado(d) {
  const s = new Set();
  COLECCIONES.forEach(c => (d[c] || []).forEach(x => { if (x && x.id) s.add(x.id); }));
  return s;
}

function anotarBorrados() {
  const ahora = idsDeEstado(state);
  if (idsVivos) {
    state.borrados = state.borrados || {};
    const t = Date.now();
    idsVivos.forEach(id => { if (!ahora.has(id)) state.borrados[id] = t; });
    /* Si algo vuelve a existir —deshacer, importar un respaldo— deja de estar
       muerto. Sin esto, restaurar una copia traería de vuelta los datos pero
       la fusión los volvería a matar en el siguiente encuentro. */
    ahora.forEach(id => { if (state.borrados[id]) delete state.borrados[id]; });

    // Pasados cuatro meses, cualquier dispositivo vivo ya se enteró
    const limite = t - DIAS_DE_TUMBA * 86400000;
    Object.keys(state.borrados).forEach(id => {
      if (state.borrados[id] < limite) delete state.borrados[id];
    });
  }
  idsVivos = ahora;
}

function save() {
  anotarBorrados();
  guardarLocal(state);
  syncTouch();
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ================= El día del usuario =================
   Todo lo que mide días (racha, decaimiento, misiones) se ancla a la zona
   horaria del perfil, no a la del dispositivo: así un viaje no rompe una racha.
   Las fechas se manejan como claves "YYYY-MM-DD" con aritmética propia,
   sin pasar por husos horarios. */

function userTZ() {
  const tz = state && state.settings && state.settings.timezone;
  if (tz) return tz;
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch (e) { return "UTC"; }
}

function tzParts(date, opts) {
  try {
    return new Intl.DateTimeFormat("en-CA", Object.assign({ timeZone: userTZ() }, opts)).formatToParts(date);
  } catch (e) {
    return new Intl.DateTimeFormat("en-CA", opts).formatToParts(date);
  }
}

/* Día actual (o el de una fecha dada) en la zona del perfil. */
function todayKey(date) {
  const p = tzParts(date || new Date(), { year: "numeric", month: "2-digit", day: "2-digit" });
  const get = (t) => (p.find(x => x.type === t) || {}).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/* Hora actual (0-23) en la zona del perfil. */
function hourNow() {
  const p = tzParts(new Date(), { hour: "2-digit", hour12: false });
  const h = parseInt((p.find(x => x.type === "hour") || {}).value, 10);
  return isNaN(h) ? new Date().getHours() : h % 24;
}

/* Hora y minuto en la zona del perfil, como "HHMM".
   Es lo que se le pega a cada marca de misión al nacer. Se empieza a guardar
   ahora aunque la gráfica que la usa llegue después, y el motivo es que la
   hora es el único dato de esta app que NO se puede reconstruir más tarde:
   el día se sabe siempre, la hora solo si estaba puesta cuando pasó. Cada
   semana sin esto es una semana que nunca podrá contestar "¿a qué hora
   cumples?". */
function hhmmNow() {
  const p = tzParts(new Date(), { hour: "2-digit", minute: "2-digit", hour12: false });
  const get = (t) => (p.find(x => x.type === t) || {}).value || "";
  const h = String(get("hour")).padStart(2, "0");
  /* Intl da "24" a medianoche en algunos entornos y "24:10" no es una hora. */
  return (h === "24" ? "00" : h) + String(get("minute")).padStart(2, "0");
}

/* La hora de una marca de misión ("14:35"), o null si nació antes de que se
   guardara. Las marcas son cadenas opacas que la sincronía une por igualdad
   de texto (ver `fusionarMarcas`), así que la hora viaja DENTRO de la cadena
   y no en una lista paralela: dos listas que hay que mantener a la par acaban
   desincronizándose, y aquí la que manda es la de marcas — el número del día
   sale de contarlas. Añadir un sufijo no rompe nada de eso, porque dos marcas
   distintas siguen siendo dos cadenas distintas. */
function horaDeMarca(marca) {
  const m = /@(\d{4})$/.exec(String(marca || ""));
  if (!m) return null;
  const h = Number(m[1].slice(0, 2));
  const min = Number(m[1].slice(2));
  if (h > 23 || min > 59) return null;
  return m[1].slice(0, 2) + ":" + m[1].slice(2);
}

/* Aritmética sobre claves de día: independiente de husos horarios. */
function addDaysKey(key, n) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

function daysBetween(keyA, keyB) {
  return Math.round((Date.parse(keyB + "T00:00:00Z") - Date.parse(keyA + "T00:00:00Z")) / 86400000);
}

/* Día de la semana (0 = domingo) de una clave de día. */
function weekdayOfKey(key) {
  return new Date(key + "T00:00:00Z").getUTCDay();
}

/* Fecha legible a partir de una clave, sin corrimiento por huso. */
function keyToDate(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function money(n) { return FMT_MONEY.format(n || 0); }

/* ================= Modal de confirmación =================
   confirm() del navegador se bloquea en visores embebidos,
   así que las confirmaciones usan este modal propio. */

let modalResolve = null;

/* cancelLabel existe para los conflictos de sincronía: ahí ninguna de las dos
   salidas es "cancelar", las dos son una elección real sobre qué datos viven. */
function ask(msg, okLabel, danger, alarm, cancelLabel) {
  return askBase(msg, false, okLabel, danger, alarm, cancelLabel);
}

/* Igual que ask(), pero el cuerpo es HTML. Solo lo usa el conflicto de
   sincronía, donde comparar dos versiones en una tabla se entiende de un
   vistazo y en un párrafo corrido no. Todo lo que venga de los datos del
   usuario se escapa antes de llegar aquí. */
function askHtml(html, okLabel, cancelLabel) {
  return askBase(html, true, okLabel, false, false, cancelLabel);
}

/* Pedir un texto con el mismo modal de siempre. prompt() del navegador se
   bloquea en visores embebidos igual que confirm(), y además llega sin el
   valor de partida escrito, que es justo lo que hace falta al renombrar:
   corregir una palabra, no volver a teclearlo todo. */
/* El tope de 42 es el bueno para nombres (ramas, talentos): más largo no cabe
   en pantalla. Pero se puede subir, y hace falta: para confirmar algo
   escribiendo un correo, 42 se queda corto y el usuario se quedaría sin poder
   completar nunca la confirmación. */
/* Cuanto cabe en una caja de texto libre. Quinientos son unas cien palabras:
   de sobra para contar por que te vas, y poco para que quepa nada raro.
   El numero se enseña SIEMPRE en pantalla —ver el contador— porque un tope
   que solo se descubre cuando el teclado deja de responder es un tope roto. */
const MOTIVO_MAX = 500;

/* Texto escrito por una persona que va a salir de la app y viajar por red.
   Hace lo mismo que `limpiarNombre` y por las mismas razones, mas una:

   - Fuera los signos de menor y mayor. NO es que hoy haga falta —esto no se
     mete en ningun HTML— sino que este texto esta pensado para acabar algun
     dia en un correo o en un panel, y ahi si. Quitarlos en el origen cierra
     la pregunta para todos los sitios a los que vaya, en vez de dejarla
     abierta para que la conteste bien cada uno de ellos.
   - Fuera los caracteres de control, que no se ven y ensucian cualquier
     registro donde caigan.
   - Se recortan los saltos de linea de mas: tres seguidos son un enter
     nervioso, no una estructura.
   - Y el tope, otra vez. El `maxlength` del campo ya lo aplica al teclear y
     al pegar, pero es del navegador: quien abra las herramientas lo quita en
     dos segundos. Aqui se aplica de nuevo, y el dia que esto se mande a algun
     sitio habra que aplicarlo UNA TERCERA VEZ en el servidor — es el unico
     de los tres que cuenta de verdad. */
function limpiarLibre(v) {
  return String(v == null ? "" : v)
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/(?:\r?\n){3,}/g, "\n\n")
    .trim()
    .slice(0, MOTIVO_MAX);
}


/* El sexto argumento, `motivo`, añade debajo una caja de texto opcional. Solo
   la piden las despedidas —irse de Norata— y por eso no esta siempre: en un
   cuadro para renombrar una rama, preguntar "¿por que?" seria absurdo.

   Cuando la lleva, devuelve `{ texto, motivo }` en vez de una cadena suelta.
   Es un cambio de forma feo, pero la alternativa —devolver siempre un objeto—
   obligaba a tocar las quince llamadas que ya existen para no ganar nada. */
function askText(titulo, valor, okLabel, pista, max, motivo) {
  const p = askHtml(
    `<b style="display:block;margin-bottom:12px">${escapeHtml(titulo)}</b>
     <input id="modal-input" type="text" maxlength="${Number(max) || 42}" value="${escapeAttr(valor || "")}">
     ${pista ? `<span class="field-hint" style="display:block;text-align:left">${escapeHtml(pista)}</span>` : ""}
     ${motivo ? `<label class="modal-motivo">
       <span class="modal-motivo-t">${escapeHtml(motivo.titulo || "¿Nos cuentas por qué te vas?")} <i>Opcional</i></span>
       <textarea id="modal-motivo" rows="3" maxlength="${MOTIVO_MAX}"
         placeholder="${escapeAttr(motivo.pista || "Lo que quieras contarnos.")}"></textarea>
       <span class="modal-cuenta" id="modal-cuenta">0 / ${MOTIVO_MAX}</span>
     </label>` : ""}`,
    okLabel || "Guardar");
  /* setTimeout y no requestAnimationFrame: el cuadro tiene que quedar listo
     para escribir aunque la pestaña esté en segundo plano, y ahí los cuadros
     de animación no llegan. */
  setTimeout(() => {
    const el = document.getElementById("modal-input");
    if (!el) return;
    el.focus();
    el.select();
    // Enter confirma: en un campo de una sola línea es lo que la mano espera
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); modalDone(true); }
    });

    /* El contador. Se pinta desde el primer momento y no solo al escribir:
       saber cuanto cabe ANTES de empezar es la mitad de para lo que sirve. */
    const mot = document.getElementById("modal-motivo");
    const cuenta = document.getElementById("modal-cuenta");
    if (mot && cuenta) {
      const pintar = () => {
        cuenta.textContent = mot.value.length + " / " + MOTIVO_MAX;
        cuenta.classList.toggle("lleno", mot.value.length >= MOTIVO_MAX);
      };
      mot.addEventListener("input", pintar);
      pintar();
    }
  }, 0);
  return p.then(ok => {
    const el = document.getElementById("modal-input");
    const mot = document.getElementById("modal-motivo");
    /* Los valores se leen ANTES de que el modal se reutilice. Con `motivo` hay
       dos campos y uno se leia tarde: para cuando se preguntaba, el siguiente
       cuadro ya habia reescrito el cuerpo y volvia vacio. */
    const texto = ok ? (el ? el.value.trim() : "") : null;
    if (!motivo) return texto;
    return { texto: texto, motivo: (ok && mot) ? limpiarLibre(mot.value) : "" };
  });
}

/* El quinto argumento en adelante creció hasta ser incomodo, asi que los
   extras van en un objeto: `{ icono, fijo, soloOk }`. Los cuatro primeros se
   quedan posicionales porque hay decenas de llamadas y renombrarlas todas
   para ganar claridad en tres sitios no sale a cuenta.

     icono   nombre de ICONS, se dibuja arriba del texto
     titulo  una linea encima del cuerpo; con el, el cuerpo deja de gritar
     fijo    el clic fuera NO cierra
     soloOk  sin boton de cancelar: es un aviso, no una pregunta
     tono    "oro" para el amarillo luciernaga; por defecto, coral

   El tono no es decoracion: el coral dice "esto rompe algo" y el oro dice
   "esto tiene un coste que quiza no ves". Un fundador que borra su cuenta no
   esta rompiendo nada —esta perdiendo algo—, y pintarlo de rojo lo convertia
   en una alarma que no era. */
function askBase(msg, esHtml, okLabel, danger, alarm, cancelLabel, extra) {
  const ex = extra || {};
  return new Promise(resolve => {
    modalResolve = resolve;
    const cuerpo = document.getElementById("modal-msg");
    if (esHtml) cuerpo.innerHTML = msg; else cuerpo.textContent = msg;

    /* El icono y el titulo se vacian SIEMPRE, tengan o no que dibujarse: el
       modal es UNO solo y se reutiliza, asi que lo que no se limpia aqui
       reaparece en la siguiente pregunta que no lo pidio. */
    const ic = document.getElementById("modal-ic");
    if (ic) {
      ic.innerHTML = ex.icono ? icon(ex.icono, 26) : "";
      ic.hidden = !ex.icono;
      /* El tono viaja tal cual como clase --`oro`, `menta`-- en vez de irse
         comprobando uno a uno. Con el `=== "oro"` de antes, cada tono nuevo
         obligaba a volver aqui a anadir su comparacion, y el tono lo decide
         quien abre el cuadro, no el cuadro. */
      ic.className = "modal-ic" + (danger || alarm ? " riesgo" : "") +
                     (ex.tono ? " " + ex.tono : "");
    }
    const tit = document.getElementById("modal-titulo");
    if (tit) {
      tit.textContent = ex.titulo || "";
      tit.hidden = !ex.titulo;
    }

    const ok = document.getElementById("modal-ok");
    ok.textContent = okLabel || "Confirmar";
    ok.className = "btn " + (danger ? "btn-danger-ghost" : "btn-primary");
    const cancelar = document.getElementById("modal-cancel");
    cancelar.textContent = cancelLabel || "Cancelar";
    cancelar.hidden = !!ex.soloOk;

    const card = document.querySelector("#modal .modal-card");
    card.classList.remove("alarm");
    /* Con titulo, el cuerpo deja de gritar: el color y la negrita de la alarma
       se los queda el titulo y el texto vuelve a leerse como texto. Una
       pregunta de una linea sigue yendo entera en coral, que ahi el aviso ES
       la frase. */
    card.classList.toggle("con-titulo", !!ex.titulo);
    /* Los tonos se apagan TODOS en cada apertura y no solo el que toca: el
       modal es UNO y se reutiliza, asi que el tono que no se quita reaparece
       en la siguiente pregunta que no lo pidio -- el mismo fallo del que ya
       avisan el icono y el titulo unas lineas mas arriba. */
    card.classList.toggle("oro", ex.tono === "oro");
    card.classList.toggle("menta", ex.tono === "menta");
    /* `#modal-msg` respeta los saltos de linea, y eso es justo lo que quiere
       un mensaje de TEXTO: sus `

` se ven como parrafos sin tener que
       escribir HTML. Pero en modo HTML se vuelve en contra — los saltos y la
       sangria de la propia plantilla se dibujan como huecos de verdad, y un
       cuadro con tres campos acababa con tres lineas vacias repartidas por
       dentro sin que nada en el codigo las pidiera. */
    card.classList.toggle("cuerpo-html", !!esHtml);
    if (alarm) { void card.offsetWidth; card.classList.add("alarm"); }
    const fondo = document.getElementById("modal");
    fondo.classList.toggle("fijo", !!ex.fijo);
    fondo.classList.add("show");
    if (alarm && userHasTapped && navigator.vibrate) navigator.vibrate([40, 60, 40]);
  });
}

/* Un aviso que hay que leer: un icono, un solo boton y el clic fuera no vale.
   Devuelve una promesa como los demas para poder esperarlo, aunque siempre
   conteste lo mismo — quien lo llama casi siempre se para justo despues. */
function avisar(msg, icono, okLabel, titulo) {
  return askBase(msg, false, okLabel || "Entendido", true, true, null,
                 { icono: icono || "alert", fijo: true, soloOk: true, titulo: titulo });
}

/* Como `avisar`, pero se PUEDE seguir: dos botones y el peso puesto en
   quedarse. Para lo que tiene un coste que no se ve —perder algo, no romper
   algo—, que es cuando el rojo miente y el oro dice la verdad. */
function avisarOro(msg, icono, okLabel, titulo, cancelLabel) {
  return askBase(msg, false, okLabel || "Continuar", true, true, cancelLabel || "Mejor no",
                 { icono: icono || "alert", fijo: true, titulo: titulo, tono: "oro" });
}

/* El clic en el fondo. Se sale por aqui y no desde el atributo del marcado
   para que la excepcion de los avisos fijos viva junto al resto de la logica
   del modal, y no escondida dentro de una comilla del HTML. */
function modalClicFuera(ev, fondo) {
  if (ev.target !== fondo) return;
  if (fondo.classList.contains("fijo")) return;
  modalDone(false);
}

function modalDone(v) {
  const fondo = document.getElementById("modal");
  fondo.classList.remove("show");
  /* Se quita al cerrar y no al abrir el siguiente: entre una y otra hay un
     instante con el modal escondido pero aun marcado, y basta con que algo
     lo vuelva a enseñar para que herede una regla que no pidio. */
  fondo.classList.remove("fijo");
  if (modalResolve) { modalResolve(v); modalResolve = null; }
}

/* ================= La página se queda quieta detrás de una ventana =================
   Con una ventana abierta, la rueda del ratón movía la app de detrás: se
   cerraba la ventana y ya no estabas donde la habías dejado. En el teléfono
   era peor, porque el dedo arrastra lo que pilla.

   Aquí solo está la LISTA de lo que tapa, en un sitio y no repartida por diez
   archivos. Quien abre una ventana no tiene que acordarse de parar nada, y
   quien la cierra no puede olvidarse de soltarla —que es como se acaba con la
   app congelada sin que nadie sepa por qué—.

   No es un contador de abiertas y cerradas por lo mismo: un contador se
   descuadra en cuanto alguien cierra dos veces o cierra sin haber abierto, y
   descuadrado deja la página muerta. Esto MIRA lo que hay puesto ahora mismo,
   así que siempre acierta aunque el camino haya sido raro.

   Todas viven colgadas del <body>, así que basta con enterarse de dos cosas:
   cuando una cambia de clase y cuando nace o muere una nueva. */
const CAPAS_QUE_TAPAN = [
  "#modal.show",            // confirmar
  "#tuto.show",             // el tutorial
  "#caja-modal.show",       // una caja del ático
  "#scel.show",             // celebrar una racha
  "#fs-overlay.show",       // una rama a pantalla completa
  "#portada",               // entrar a la app
  "#compra.show",           // volver de pagar
  ".futuro-aviso",          // datos de una versión más nueva
  "#carga:not(.oculta)"     // esperando
].join(",");

function revisarFondoQuieto() {
  const raiz = document.documentElement;
  raiz.classList.toggle("quieto", !!document.querySelector(CAPAS_QUE_TAPAN));
}

function vigilarCapas() {
  const porClase = new MutationObserver(revisarFondoQuieto);
  const mirar = (el) => {
    if (el && el.nodeType === 1) porClase.observe(el, { attributes: true, attributeFilter: ["class"] });
  };
  Array.prototype.forEach.call(document.body.children, mirar);
  /* Solo los hijos directos del <body>, sin bajar al árbol entero: la app
     cambia clases a cada rato —el lienzo, los botones del menú— y escuchar
     todo eso para enterarse de una ventana sería pagar mil avisos por uno
     que importa. */
  new MutationObserver(listas => {
    listas.forEach(l => Array.prototype.forEach.call(l.addedNodes, mirar));
    revisarFondoQuieto();
  }).observe(document.body, { childList: true });
  revisarFondoQuieto();
}

