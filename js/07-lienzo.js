/* El lienzo: encuadre, editor y gestos */
/* ================= De que modulo es lo que se dibuja =================
   Este archivo nacio dibujando solo talentos y ahora dibuja tambien los
   encargos de Proyectos. En vez de duplicarlo —dos mil lineas de geometria
   que habria que arreglar dos veces cada vez— se pasa por estas funciones
   todo lo que cambia de un modulo a otro.

   La regla que se siguio, y que conviene mantener: cuando el nodo NO es de
   Proyectos, cada una devuelve exactamente lo que devolvia la llamada de
   antes. Asi el dibujo de Talentos no cambia ni una letra.

   `mod` viaja en el propio nodo. No se pasa por parametro a todas partes
   porque media docena de caminos llegan aqui con un objeto suelto y sin
   contexto: un arrastre, el menu del clic derecho, deshacer. */

/* La figura y su radio. */
function figuraDe(p) { return esNodoDeProyecto(p) ? FIGURA_ENCARGO : metaDe(p); }

/* El estado con el que se pinta. Los nombres coinciden a proposito
   (completed, active, expired...) para que la tabla de colores sea una sola. */
function estadoDeNodo(n) { return esNodoDeProyecto(n) ? estadoDeEncargo(n) : perkStatus(n); }

/* La rama tal como se dibuja. */
function vistaDeRamaDe(mod, b) {
  return mod === "proyectos" ? vistaDeRamaProyectos(b) : vistaDeRama(b);
}

/* La coleccion que se guarda y se deshace. */
function listaDe(mod) {
  return mod === "proyectos" ? state.projects : state.perks;
}

/* De que modulo es un nodo cualquiera. Para las acciones que llegan con un
   id y nada mas: cortar una conexion, cambiar la regla de entrada. */
function modDe(n) { return esNodoDeProyecto(n) ? "proyectos" : "talentos"; }

/* Repintar la pantalla que toque. Media docena de acciones del lienzo
   terminaban en renderTree() a secas; hechas desde el mapa de encargos eso
   redibujaba Talentos y dejaba Proyectos con lo de antes en pantalla. */
function repintarModulo(mod) {
  if (mod === "proyectos") renderProjects(); else renderTree();
}
/* ================= El encuadre del lienzo =================
   Desde que alrededor del dibujo hay sitio libre —y desde que un nodo puede
   vivir antes del cero—, la esquina del contenedor ya no es donde está el
   trabajo. Así que cada rama tiene que decir a dónde mira:

     · la primera vez, al principio de lo dibujado
     · después, a donde la dejó el usuario

   Sin la segunda mitad, cualquier acción que repinta el árbol (y son casi
   todas: completar algo, mover un nodo, guardar) devolvería la rama al
   principio, y trabajar en la parte derecha de un mapa grande sería un
   pulso contra la app. */
const scrollRama = {};

/* ================= El zoom =================
   El dibujo se escala cambiando el TAMAÑO del SVG y dejando su `viewBox`
   quieto. Suena raro y es lo que lo hace barato: todo lo que traduce píxeles
   a coordenadas del dibujo —el arrastre, el corte, las conexiones, el
   encuadre— ya sacaba la escala de la proporción entre lo que mide el SVG en
   pantalla y lo que dice su viewBox. Al agrandar el SVG esa proporción sube
   sola y los gestos siguen cayendo donde deben, sin tocar una línea de ellos.

   La alternativa —mover el viewBox— habría dejado los trazos con el mismo
   grosor a cualquier zoom, que es justo lo que no se quiere: alejarse tiene
   que adelgazar las líneas, no dejarlas gruesas sobre un dibujo diminuto.

   El nivel se guarda por rama y por sitio (lista o pantalla completa), con la
   misma llave que el encuadre: volver a una rama tiene que devolverte donde
   la dejaste, y eso incluye cuánto habías acercado. */
const zoomRama = {};

/* De 50 a 150 y siempre de cinco en cinco. Antes iba de 25 a 200 y por
   multiplicación (×1.25), y eso hacía dos cosas mal: los saltos eran enormes
   —de 80 a 100 de un golpe— y el número que salía en el mando era cualquiera,
   así que no se podía escribir uno a mano ni volver al que tenías. */
const ZOOM_MIN = 0.5, ZOOM_MAX = 1.5, ZOOM_PASO = 0.05;

/* Todo pasa por aquí: los botones, la rueda, el pellizco y lo que se escribe.
   Si un gesto continuo —el pellizco— no se redondeara, el mando enseñaría
   87 % un instante y 88 % al siguiente, y el número dejaría de servir para
   volver a un nivel concreto. */
function pasoDeZoom(z) {
  return limitarZoom(Math.round(z / ZOOM_PASO) * ZOOM_PASO);
}

function zoomDe(wrap, b) {
  const z = zoomRama[llaveDeLienzo(wrap, b)];
  return typeof z === "number" ? z : 1;
}

function limitarZoom(z) {
  // El redondeo deja colas de coma flotante (0.7500000000000001): se cortan
  return Math.round(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z)) * 1000) / 1000;
}

/* Escribe el tamaño del SVG. El alto de la TARJETA no se toca aquí: en la
   lista lo fija `encuadrarLienzo` a partir de lo que mide el dibujo, y si
   creciera con el zoom, acercarte estiraría la página entera. Dentro de la
   tarjeta se acerca y se recorre; la tarjeta se queda quieta. */
function aplicarZoom(wrap, b) {
  const svg = wrap.querySelector("svg");
  if (!svg) return 1;
  const z = zoomDe(wrap, b === undefined ? wrap.dataset.branch : b);
  const w = +svg.getAttribute("width"), h = +svg.getAttribute("height");
  if (!w || !h) return z;
  svg.style.width = Math.round(w * z) + "px";
  svg.style.height = Math.round(h * z) + "px";
  ponerDetalle(wrap, z);
  return z;
}

/* ---- El nivel de detalle, como el LOD de un videojuego ----
   Al alejarse no se encoge todo por igual: primero se van las etapas y la
   chapa de estado, luego el nombre, y lo último que queda es la figura con su
   icono — que es lo que deja reconocer un nodo de un vistazo. Lo hace el CSS
   con una clase, así que cambiar de nivel no vuelve a dibujar nada. */
/* Los cortes van repartidos dentro del rango que existe (50–150), no en
   abstracto: con el rango viejo el nivel "lejos" empezaba por debajo del 45 %,
   que ya no se puede alcanzar. */
function ponerDetalle(wrap, z) {
  wrap.classList.toggle("z-medio", z < 0.9 && z >= 0.65);
  wrap.classList.toggle("z-lejos", z < 0.65);
}

/* Acercar o alejar dejando quieto el punto que se está señalando. Sin esto el
   zoom se va siempre al origen del dibujo y uno acaba persiguiendo el mapa. */
function zoomEn(wrap, b, nuevo, clientX, clientY) {
  const z0 = zoomDe(wrap, b);
  const z1 = pasoDeZoom(nuevo);
  if (Math.abs(z1 - z0) < 0.0005) return z0;

  const r = wrap.getBoundingClientRect();
  // Si no se señala nada, el ancla es el centro de lo que se está viendo
  const cx = clientX == null ? r.left + wrap.clientWidth / 2 : clientX;
  const cy = clientY == null ? r.top + wrap.clientHeight / 2 : clientY;
  const antes = puntoEnLienzo(wrap, cx, cy);

  zoomRama[llaveDeLienzo(wrap, b)] = z1;
  aplicarZoom(wrap, b);

  /* Y se recoloca el recorrido para que ese mismo punto del dibujo vuelva a
     caer bajo el dedo. Se hace DESPUÉS de escalar, con el tamaño ya nuevo.

     Es una ASIGNACIÓN, no una suma, y ahí estuvo el fallo: `pixelEnLienzo`
     devuelve dónde cae el punto dentro del contenido, medido desde su origen
     —no un desplazamiento—, así que sumarlo al recorrido que ya había lo
     duplicaba. Se veía como que el zoom ignoraba el cursor y el mapa se
     escapaba hacia la esquina de arriba a la izquierda. */
  if (antes) {
    const px = pixelEnLienzo(wrap, antes.x, antes.y);
    if (px) {
      wrap.scrollLeft = px.x - (cx - r.left);
      wrap.scrollTop = px.y - (cy - r.top);
    }
  }
  recordarEncuadre(wrap, b);
  pintarMandoZoom(wrap, b);
  return z1;
}

/* Todo el dibujo dentro de lo que se ve. Es el "doble toque" y el botón de
   ajustar: la salida de emergencia cuando uno se ha perdido. */
function ajustarZoom(wrap, b) {
  const svg = wrap.querySelector("svg");
  if (!svg || !svg.dataset.bw) return;
  const bw = +svg.dataset.bw, bh = +svg.dataset.bh;
  if (!bw || !bh) return;
  /* Con el lienzo sin medir todavía —una tarjeta plegada, una pestaña que aún
     no compone— la división daba cero y "ajustar" mandaba el mapa al 25 %.
     Mejor no hacer nada: un ajuste imposible no es un ajuste al mínimo. */
  if (!wrap.clientWidth || !wrap.clientHeight) return;
  const z = limitarZoom(Math.min(wrap.clientWidth / bw, wrap.clientHeight / bh) * 0.94);
  zoomRama[llaveDeLienzo(wrap, b)] = z;
  aplicarZoom(wrap, b);
  const enc = encuadreDe(wrap, null);
  if (enc) { wrap.scrollLeft = enc.left; wrap.scrollTop = enc.top; }
  recordarEncuadre(wrap, b);
  pintarMandoZoom(wrap, b);
}

/* ---- El mando: − % + ----
   Vive FUERA del lienzo aunque se vea encima. Dentro se iría con el
   recorrido: al arrastrar el mapa el mando se habría ido de la pantalla.

   El porcentaje no es un rótulo, es un botón: tocarlo ajusta todo el dibujo a
   lo que se ve. Es la salida de emergencia de quien se perdió acercándose, y
   ponerla en el sitio donde ya estás mirando el zoom ahorra un control más. */
function pintarMandoZoom(wrap, b) {
  const svg = wrap.querySelector("svg");
  const padre = wrap.parentElement;
  if (!padre) return;
  let mando = padre.querySelector(":scope > .zoom-mando");
  if (!svg) { if (mando) mando.remove(); return; }
  if (!mando) {
    mando = document.createElement("div");
    mando.className = "zoom-mando";
    /* El porcentaje es un CAMPO, no un rótulo: se escribe dentro para ir a un
       nivel concreto sin dar quince veces al botón. Lo escrito se redondea al
       múltiplo de cinco más cercano y se mete en el rango, así que no hay
       forma de dejarlo en un número que el mando no sepa repetir. */
    mando.innerHTML = `
      <button type="button" data-z="menos" aria-label="Alejar">−</button>
      <span class="pct"><input type="text" inputmode="numeric" aria-label="${escapeAttr(tx("Nivel de zoom, en porcentaje"))}"><i>%</i></span>
      <button type="button" data-z="mas" aria-label="Acercar">+</button>
      <button type="button" data-z="ajustar" class="ajustar" aria-label="${escapeAttr(tx("Ajustar todo a la pantalla"))}" title="${escapeAttr(tx("Ajustar todo a la pantalla"))}"><svg viewBox="0 0 24 24">${BM_ICONS.expandir}</svg></button>`;
    mando.addEventListener("pointerdown", (e) => e.stopPropagation());
    mando.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const rama = wrap.dataset.branch;
      if (btn.dataset.z === "ajustar") ajustarZoom(wrap, rama);
      else zoomEn(wrap, rama, zoomDe(wrap, rama) + (btn.dataset.z === "mas" ? ZOOM_PASO : -ZOOM_PASO), null, null);
    });

    const campo = mando.querySelector(".pct input");
    const aplicar = () => {
      const rama = wrap.dataset.branch;
      const n = parseFloat(String(campo.value).replace(/[^0-9.]/g, ""));
      /* Un campo vacío o con letras vuelve al nivel que había: no es un error
         que merezca un aviso, es que no se escribió nada. */
      if (isFinite(n) && n > 0) zoomEn(wrap, rama, n / 100, null, null);
      else pintarMandoZoom(wrap, rama);
    };
    campo.addEventListener("keydown", (e) => {
      const rama = wrap.dataset.branch;
      if (e.key === "Enter") { e.preventDefault(); aplicar(); campo.blur(); }
      if (e.key === "Escape") { e.preventDefault(); pintarMandoZoom(wrap, rama); campo.blur(); }
      // Las flechas mueven de cinco en cinco, igual que los botones
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        zoomEn(wrap, rama, zoomDe(wrap, rama) + (e.key === "ArrowUp" ? ZOOM_PASO : -ZOOM_PASO), null, null);
      }
    });
    campo.addEventListener("blur", aplicar);
    campo.addEventListener("focus", () => campo.select());

    padre.insertBefore(mando, wrap.nextSibling);
  }
  /* ---- Dónde se planta ----
     En la esquina del LIENZO, no en la de su contenedor. No es lo mismo: en
     la tarjeta de la lista, debajo del mapa viven el botón de pantalla
     completa y la línea de ayuda, así que un mando pegado al fondo de la
     tarjeta caía encima del texto en vez de sobre el mapa. Se mide la
     distancia entre un fondo y el otro y se descuenta. */
  colocarMando(mando, wrap);

  const z = zoomDe(wrap, b === undefined ? wrap.dataset.branch : b);
  const campo = mando.querySelector(".pct input");
  // Mientras se escribe no se le pisa lo tecleado
  if (document.activeElement !== campo) campo.value = Math.round(z * 100);
  mando.querySelector('[data-z="menos"]').disabled = z <= ZOOM_MIN + 0.001;
  mando.querySelector('[data-z="mas"]').disabled = z >= ZOOM_MAX - 0.001;
}

function colocarMando(mando, wrap) {
  const padre = mando.parentElement;
  if (!padre) return;
  const rw = wrap.getBoundingClientRect(), rp = padre.getBoundingClientRect();
  if (!rw.height || !rp.height) return;       // sin medir aún: se deja como esté

  /* Aquí vivía además una comprobación que subía el mando cuando chocaba con la
     tira de herramientas. Se fue en 0.7.53: la tira y el mando ya no comparten
     sitio —herramientas a la izquierda, zoom a la derecha, en la misma línea—,
     así que no hay nada que esquivar. Y esquivar era justo lo que se veía mal:
     el mando acababa flotando a media pantalla, que es como lo describió
     Eduardo. Un reparto fijo se entiende; uno que se mueve solo, no.

     Lo que se queda es pegarlo al borde del LIENZO y no al del contenedor: el
     lienzo puede ser más pequeño que su caja, y ahí el mando quedaba separado
     del dibujo al que pertenece. */
  mando.style.bottom = Math.max(10, Math.round(rp.bottom - rw.bottom) + 12) + "px";
  mando.style.right = Math.max(10, Math.round(rp.right - rw.right) + 12) + "px";
}

/* Al girar el teléfono o acoplar la ventana, lo que hay debajo del mapa
   cambia de alto y el mando se quedaría flotando donde ya no toca. */
window.addEventListener("resize", () => {
  document.querySelectorAll(".zoom-mando").forEach(m => {
    const w = m.parentElement && m.parentElement.querySelector(".const-wrap");
    if (w) colocarMando(m, w);
  });
});

function recordarEncuadre(wrap, b) {
  scrollRama[llaveDeLienzo(wrap, b)] = { x: wrap.scrollLeft, y: wrap.scrollTop };
}

function llaveDeLienzo(wrap, b) {
  return (wrap.closest("#fs-overlay") ? "fs:" : "lista:") + b;
}

/* ================= La rama en vertical =================
   Una rama se puede mirar de pie: el primer talento abajo y el camino
   creciendo hacia arriba. Lo pidió Eduardo, y la clave de que salga barato
   es lo que NO se hace: no se gira la cámara, se gira dónde cae cada nodo.

   Girar el SVG con CSS habría roto las cinco funciones que traducen un píxel
   de la pantalla a una coordenada del dibujo (`puntoEnLienzo`, `pixelEnLienzo`,
   `encuadreDe` y los dos `svgPt` de los manejadores): todas hacen
   `getBoundingClientRect()` más el `viewBox` en línea recta, y con el elemento
   girado esa cuenta manda la x de la pantalla a la x del dibujo, que ya no es
   la misma. Además el contenedor que se recorre no gira con su contenido, así
   que la barra de desplazamiento habría medido lo de antes.

   Girando las coordenadas el SVG sigue derecho: el zoom, el recorrido, el
   arrastre, el corte y el imán siguen valiendo sin tocarlos, y los rótulos y
   los ICONOS salen rectos solos, sin contra-girar nada.

   Lo guardado NO se toca nunca. Girar y desgirar es exacto por construcción,
   porque el giro solo existe mientras se dibuja. */

/* Es preferencia DE ESTE DISPOSITIVO, igual que el modo claro (ver `TEMA_LLAVE` en
   js/01-base.js): girar una rama es cómo la miras hoy, no algo que cambie el
   árbol. Si viajara con la cuenta, ponerla de pie en el teléfono te la
   pondría de pie en la computadora, y son dos pantallas de formas distintas.
   Por eso vive en su propia llave y no en `state`, ni entra en la sincronía
   ni en los respaldos. */
const GIRO_LLAVE = "norata-ramas-giradas";
let ramasGiradas = null;

function girosGuardados() {
  if (ramasGiradas) return ramasGiradas;
  try { ramasGiradas = JSON.parse(localStorage.getItem(GIRO_LLAVE)) || {}; }
  catch (e) { ramasGiradas = {}; }
  return ramasGiradas;
}

/* Con el módulo dentro: una rama de Proyectos puede llamarse igual que una de
   Talentos, y ponerse de pie una no puede poner de pie la otra. */
function llaveDeGiro(b, mod) { return (mod || "talentos") + ":" + b; }

function ramaGirada(b, mod) { return !!girosGuardados()[llaveDeGiro(b, mod)]; }

function girarRama(b, mod) {
  const g = girosGuardados();
  const k = llaveDeGiro(b, mod);
  if (g[k]) delete g[k]; else g[k] = 1;
  try { localStorage.setItem(GIRO_LLAVE, JSON.stringify(g)); } catch (e) { /* sin sitio: vale para esta sesión */ }
  /* El encuadre guardado deja de significar lo mismo —la rama mide otra cosa
     y lo que estaba centrado queda fuera—, así que se olvida y se vuelve a
     encuadrar sola, igual que al girar el teléfono. */
  delete scrollRama["lista:" + b];
  delete scrollRama["fs:" + b];
  repintarModulo(mod || "talentos");
  if (fullscreenBranch === b) renderFullscreen(mod || "talentos");
  toast(g[k] ? `"${b}" de pie` : `"${b}" en horizontal`, "hecho");
}

/* ---- El cuarto de vuelta ----
   ASCENDENTE: "adelante" —que guardado es +x, hacia la derecha— sale hacia
   ARRIBA, que en pantalla es −y. Eso es (x, y) → (y, −x). El otro cuarto de
   vuelta, (x, y) → (−y, x), pone la raíz arriba y la rama creciendo hacia
   abajo, y es justo el que no se quiere. */
function alDibujo(x, y, gir) { return gir ? { x: y, y: -x } : { x, y }; }
function aDatos(x, y, gir)   { return gir ? { x: -y, y: x } : { x, y }; }

/* Y el mismo giro aplicado a los ocho brazos, que sale de rotar su vector con
   la misma cuenta: e = (1,0) pasa a (0,−1), que es n. Sin esto la rama queda
   de pie pero las conexiones no: todo entraría de costado.

   Se gira el NOMBRE del rumbo y no la figura, y eso es lo que mantiene bien
   la cuenta del radio en `radioEnRumbo`: el hexágono es picudo por arriba y
   plano por los lados, y como la figura NO gira, salir por el norte tiene que
   medir lo que mide el norte de verdad. */
const GIRO_RUMBO = { e: "n", ne: "nw", se: "ne", n: "w", s: "e", w: "s", nw: "sw", sw: "se" };
function rumboGirado(r, gir) { return gir ? GIRO_RUMBO[r] : r; }

/* ---- De qué lado quedó el nombre la última vez ----
   Memoria entre dibujos, y es lo que quita el temblor. Sin ella, un talento
   arrastrado justo en el límite de caber a la derecha cambiaba de lado en
   cada fotograma: derecha, izquierda, derecha, izquierda, sin parar. Con la
   memoria, el lado que ya tenía se prueba PRIMERO, así que solo se mueve
   cuando de verdad dejó de caber — y una vez que se mueve, se queda.
   Lo pidió Eduardo viéndolo temblar. */
const ladoPrevio = {};

function chocanCajas(a, b, aire) {
  return !(a.x1 + aire < b.x0 || b.x1 + aire < a.x0 || a.y1 + aire < b.y0 || b.y1 + aire < a.y0);
}

/* ---- Lo que MIDE un nombre, medido y no estimado ----
   Hace falta para saber si cabe a un lado del nodo. Calcularlo por número de
   letras fallaba justo con los nombres que importan: "Aprender las escalas" y
   "Tocar en público" tienen casi las mismas letras y no miden ni parecido.
   Un `measureText` es síncrono y cuesta nada, y se guarda por nombre porque
   el mapa se vuelve a dibujar en cada fotograma de un arrastre. */
let _regla = null;
const _anchos = new Map();
function anchoDelRotulo(lines, fs) {
  let max = 0;
  for (const ln of lines) {
    const k = fs + "|" + ln;
    let w = _anchos.get(k);
    if (w === undefined) {
      if (!_regla) {
        try { _regla = document.createElement("canvas").getContext("2d"); } catch (e) { _regla = false; }
      }
      /* Sin canvas —un navegador que lo bloquee— se cae a la estimación por
         letras. Colocará algún nombre en el lado que no era; no rompe nada. */
      if (_regla) { _regla.font = `500 ${fs}px Outfit, sans-serif`; w = _regla.measureText(ln).width; }
      else w = ln.length * fs * 0.52;
      _anchos.set(k, w);
    }
    if (w > max) max = w;
  }
  return max;
}

/* Al cambiar el tamaño de la ventana (girar el teléfono, acoplar la app) la
   posición guardada deja de significar lo mismo: el lienzo mide otra cosa y
   lo que estaba centrado puede quedar fuera. Se olvida y cada rama vuelve a
   encuadrarse sola. */
window.addEventListener("resize", () => {
  Object.keys(scrollRama).forEach(k => delete scrollRama[k]);
});

/* De coordenada del dibujo a píxel dentro del lienzo que se recorre. */
function pixelEnLienzo(wrap, x, y) {
  const svg = wrap.querySelector("svg");
  if (!svg || !svg.viewBox || !svg.viewBox.baseVal) return null;
  const vb = svg.viewBox.baseVal;
  if (!vb.width || !vb.height) return null;
  const cs = getComputedStyle(wrap);
  const r = svg.getBoundingClientRect();
  const ex = (r.width || vb.width) / vb.width;
  const ey = (r.height || vb.height) / vb.height;
  return {
    x: parseFloat(cs.paddingLeft) + (x - vb.x) * ex,
    y: parseFloat(cs.paddingTop) + (y - vb.y) * ey
  };
}

/* ---- Dónde deja la cámara la rama ----
   El lienzo casi siempre es más grande que lo dibujado (por el sitio libre)
   y a veces más pequeño (una rama larga). Con la regla de antes —pegar el
   dibujo a la esquina superior izquierda— una rama que cabía entera quedaba
   escorada, con todo el aire amontonado abajo y a la derecha. Ahora:

     · si cabe entero, se centra;
     · si no cabe, se enseña desde el principio, o alrededor de un punto de
       interés, pero sin pasarse de los bordes del dibujo — nunca se enseña
       hueco pudiendo enseñar mapa.

   No mueve ni un talento: es solo dónde se planta la cámara. */
function encuadreDe(wrap, foco) {
  const svg = wrap.querySelector("svg");
  if (!svg || !svg.dataset.bw) return null;
  const p0 = pixelEnLienzo(wrap, +svg.dataset.bx, +svg.dataset.by);
  if (!p0) return null;
  const r = svg.getBoundingClientRect();
  const vb = svg.viewBox.baseVal;
  const esc = (r.width && vb.width) ? r.width / vb.width : 1;
  const bw = +svg.dataset.bw * esc, bh = +svg.dataset.bh * esc;

  const eje = (ini, tam, visible, f) => {
    if (tam <= visible) return ini - (visible - tam) / 2;   // cabe: centrado
    if (f == null) return ini;                              // no cabe: por el principio
    // El recorrido válido va de "pegado al principio" a "pegado al final"
    return clamp(f - visible / 2, ini, ini + tam - visible);
  };
  return {
    left: Math.max(0, Math.round(eje(p0.x, bw, wrap.clientWidth, foco && foco.x))),
    top: Math.max(0, Math.round(eje(p0.y, bh, wrap.clientHeight, foco && foco.y)))
  };
}

function encuadrarLienzo(wrap, b) {
  const svg = wrap.querySelector("svg");
  if (!svg) return;
  /* Antes de medir nada: el encuadre se calcula sobre el tamaño ya escalado,
     así que escalar después dejaría la cámara donde no toca. */
  aplicarZoom(wrap, b);
  /* La tarjeta mide lo que mide el DIBUJO, no el lienzo con su sitio libre:
     si no, cada rama arrastraría trescientos píxeles de hueco a la vista y la
     página del árbol se haría el doble de larga. El máximo y el mínimo los
     sigue poniendo el CSS. En pantalla completa no se toca: ahí el lienzo
     ocupa lo que le deje la pantalla. */
  if (!wrap.closest("#fs-overlay") && svg.dataset.dh) {
    /* Con un SUELO en el teléfono. La regla de arriba —la tarjeta mide lo que
       mide el dibujo— es buena para no arrastrar hueco vacío, pero en una
       pantalla estrecha el dibujo es mucho más ancho que alto: cabe por los
       lados recortado y la ventana queda en 261 px, una rendija por la que no
       se entiende la forma de la rama. Y entender la forma es para lo que
       sirve una vista previa. Lo pidió Eduardo.
       En la computadora no se toca: ahí el dibujo cabe y el hueco sobraría. */
    const dh = Number(svg.dataset.dh) || 0;
    const suelo = innerWidth < 900 ? Math.min(Math.round(innerHeight * 0.46), 420) : 0;
    /* Y un TECHO cuando la rama está de pie. La regla de arriba —la tarjeta
       mide lo que mide el dibujo— es buena a lo ancho, donde una rama larga
       crece hacia un lado que no cuesta nada; de pie crece hacia abajo, y una
       rama de cinco niveles pedía más de mil píxeles de tarjeta. Con eso, dos
       ramas de pie ya no dejan ver ninguna otra en la lista. Dentro se recorre
       y el botón de pantalla completa está justo debajo. */
    const techo = ramaGirada(b === undefined ? wrap.dataset.branch : b, wrap.dataset.mod || "talentos")
      ? Math.max(suelo, Math.min(Math.round(innerHeight * 0.62), 560))
      : Infinity;
    wrap.style.height = Math.min(techo, Math.max(dh, suelo)) + "px";
  }
  const memo = scrollRama[llaveDeLienzo(wrap, b)];
  if (memo) {
    wrap.scrollLeft = memo.x;
    wrap.scrollTop = memo.y;
  } else {
    const enc = encuadreDe(wrap, null);
    if (enc) { wrap.scrollLeft = enc.left; wrap.scrollTop = enc.top; }
  }
  wrap.addEventListener("scroll", () => {
    scrollRama[llaveDeLienzo(wrap, b)] = { x: wrap.scrollLeft, y: wrap.scrollTop };
  }, { passive: true });
  pintarMandoZoom(wrap, b);
}

/* Redibuja una rama conservando lo que se está viendo. Cuando alguien lleva
   un nodo hacia atrás, el lienzo crece por la izquierda: todo el dibujo se
   corre dentro del SVG, y sin compensar el desplazamiento el mapa daría un
   salto justo mientras se arrastra, que es el peor momento posible. */
/* ================= El imán de alinear =================
   Lo pidió Eduardo: «que se puedan alinear como una regla al arrastrarlos, y
   que aparezca una ligera línea para quien quiera verse perfeccionista».

   Seis unidades del dibujo de margen. El número no es a ojo: un nodo mide 44,
   así que seis es poco más de un décimo de nodo — lo bastante para que no
   salte solo mientras recorres el lienzo, y lo bastante para que no haya que
   afinar al píxel con el dedo. Y se compara contra el CENTRO de cada nodo, que
   es lo que la gente alinea aunque las siluetas sean distintas.

   Devuelve las coordenadas donde hay que pintar la línea, o null: quien dibuja
   no vuelve a calcular nada. */
const GUIA_IMAN = 6;

/* Dónde quedó cada nodo en el último dibujo. Lo llena `constellation`. */
let posLienzo = null;

function imantarNodo(n, b, mod) {
  /* Se compara contra `posLienzo` —el mapa de posiciones del último dibujo— y
     NO contra `nodo.x`. Es la diferencia entre que funcione y que no: un nodo solo
     tiene `x` e `y` propias si alguien lo movió a mano; los demás los coloca el
     acomodo automático, y contra ellos `o.x` es `undefined`. Con `ctxPos` se
     alinea igual de bien con uno movido que con uno que nunca se tocó, que es
     justo lo que uno espera de una regla. */
  const pos = posLienzo;
  if (!pos) return { gx: null, gy: null };
  let gx = null, gy = null, mejorX = GUIA_IMAN, mejorY = GUIA_IMAN;
  for (const id in pos) {
    if (id === n.id) continue;
    const o = pos[id];
    if (!o) continue;
    const dx = Math.abs(o.x - n.x);
    if (dx <= mejorX) { mejorX = dx; gx = o.x; }
    const dy = Math.abs(o.y - n.y);
    if (dy <= mejorY) { mejorY = dy; gy = o.y; }
  }
  if (gx !== null) n.x = gx;
  if (gy !== null) n.y = gy;
  return { gx, gy };
}

/* Las líneas se dibujan DENTRO del SVG y no encima con un div, y por dos
   motivos: van en coordenadas del dibujo —así no hay que convertir nada ni
   rehacerlo al cambiar el zoom— y desaparecen solas en el siguiente repintado,
   que es exactamente lo que tiene que pasar al soltar. */
/* Quitar las reglas de alinear. Se llama al soltar y antes de volver a
   pintarlas, para que no se acumulen si un repintado no las llevó por delante. */
function borrarGuias(wrap) {
  const svg = wrap && wrap.querySelector("svg");
  if (!svg) return;
  svg.querySelectorAll(".guia-iman").forEach((g) => g.remove());
}

function pintarGuias(wrap, guias) {
  const svg = wrap.querySelector("svg");
  borrarGuias(wrap);
  if (!svg || !guias || (guias.gx === null && guias.gy === null)) return;
  const vb = svg.viewBox && svg.viewBox.baseVal;
  if (!vb) return;
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("class", "guia-iman");
  const linea = (x1, y1, x2, y2) => {
    const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
    l.setAttribute("x1", x1); l.setAttribute("y1", y1);
    l.setAttribute("x2", x2); l.setAttribute("y2", y2);
    /* El color sale del acento del tema, así que un mundo lo cambia sin tocar
       esto. CONTINUA y no punteada: en este mapa el punteado ya significa algo
       —un hilo apagado, un requisito que aún no se cumple, el contorno de una
       caja— y una regla de alinear que se dibuja igual se lee como una pieza
       más del dibujo en vez de como el instrumento que es. Lo pidió Eduardo
       viéndolas: «líneas continuas». */
    l.setAttribute("stroke", "var(--mint)");
    l.setAttribute("stroke-width", "1.2");
    l.setAttribute("opacity", "0.62");
    g.appendChild(l);
  };
  /* `gx` y `gy` vienen en coordenadas GUARDADAS —el imán compara contra
     `n.x`—, así que hay que pasarlas al dibujo. Y con la rama de pie las dos
     reglas cambian de orientación: alinear por la x guardada (misma altura del
     camino) es una línea HORIZONTAL en pantalla, no vertical. Sin esto la
     regla salía cruzada respecto a lo que estaba alineando. */
  const gir = ramaGirada(wrap.dataset.branch, wrap.dataset.mod || "talentos");
  const px = guias.gx !== null ? alDibujo(guias.gx, 0, gir) : null;
  const py = guias.gy !== null ? alDibujo(0, guias.gy, gir) : null;
  if (px) {
    if (gir) linea(vb.x, px.y, vb.x + vb.width, px.y);
    else linea(px.x, vb.y, px.x, vb.y + vb.height);
  }
  if (py) {
    if (gir) linea(py.x, vb.y, py.x, vb.y + vb.height);
    else linea(vb.x, py.y, vb.x + vb.width, py.y);
  }
  svg.appendChild(g);
}

function redibujarLienzo(wrap, html) {
  const vb = (v => v && v.viewBox && v.viewBox.baseVal)(wrap.querySelector("svg"));
  const ax = vb ? vb.x : 0, ay = vb ? vb.y : 0;
  wrap.innerHTML = html;
  /* El SVG es nuevo, así que nace a tamaño natural: hay que volver a
     escalarlo antes de compensar el desplazamiento, o el mapa daría un salto
     de vuelta al 100 % en mitad de un arrastre. */
  aplicarZoom(wrap);
  const nvb = (v => v && v.viewBox && v.viewBox.baseVal)(wrap.querySelector("svg"));
  if (nvb) {
    /* Por la escala: `ax` y `nvb.x` son coordenadas del DIBUJO y el recorrido
       va en píxeles. Al 100 % coinciden y por eso nunca se notó; al 40 % la
       compensación se pasaba de largo más del doble y el mapa pegaba un tirón
       justo mientras se arrastraba un nodo. */
    const z = zoomDe(wrap, wrap.dataset.branch);
    wrap.scrollLeft += (ax - nvb.x) * z;
    wrap.scrollTop += (ay - nvb.y) * z;
  }
}

function encuadrarLienzos(scope) {
  /* El zoom va antes del encuadre y con todos los lienzos del ámbito: es lo
     que hace que un mapa recién pintado nazca ya al nivel en que lo dejaste. */
  attachZoomHandlers(scope);
  (scope || document).querySelectorAll(".const-wrap").forEach(wrap => {
    encuadrarLienzo(wrap, wrap.dataset.branch);
  });
}

/* ================= Frente de avance =================
   Al entrar al árbol cada rama se centra en lo que está en curso o listo
   para empezar, no en los talentos viejos ya completados. */

let focusPending = false;

function frontNode(nodes) {
  const byDepth = (a, b) => (b.x || 0) - (a.x || 0);
  const due = nodes.filter(n => estadoDeNodo(n) === "due").sort(byDepth);
  if (due.length) return due[0];
  const active = nodes.filter(n => estadoDeNodo(n) === "active").sort(byDepth);
  if (active.length) return active[0];
  const avail = nodes.filter(n => estadoDeNodo(n) === "available").sort(byDepth);
  if (avail.length) return avail[0];
  return [...nodes].sort(byDepth)[0];
}

function focusBranchFront(b, silent, mod) {
  const wrap = constWrapFor(b);
  if (!wrap) return;
  const nodes = branchNodes(b, mod);
  if (!nodes.length) return;
  // Del dibujo, que es lo que hay en pantalla: con la rama de pie, la
  // coordenada guardada apunta a otro sitio
  const { dib } = branchLayout(nodes, ramaGirada(b, mod));
  const pos = dib;
  const target = frontNode(nodes);
  /* Por píxel y no por coordenada del dibujo: entre el borde del lienzo y el
     cero del dibujo hay ahora el margen libre, y a veces también el trozo que
     ocupan los nodos colocados hacia atrás. Y pasa por encuadreDe, que si la
     rama cabe entera la centra en vez de escorarla para poner ese nodo justo
     en el medio — enseñar la rama completa siempre gana. */
  const p = pixelEnLienzo(wrap, pos[target.id].x, pos[target.id].y);
  if (!p) return;
  const enc = encuadreDe(wrap, p);
  if (!enc) return;
  wrap.scrollTo({ left: enc.left, top: enc.top, behavior: silent ? "auto" : "smooth" });
  if (!silent) toast(`Centrado en: ${target.name}`, "hecho");
}

async function resetBranchLayout(b, mod) {
  if (!await ask(`Esto va a reordenar automáticamente todos los talentos de "${b}". Si habías acomodado esta rama a mano, ese orden se pierde.`, "Reacomodar")) return;
  pushUndo(tx("reacomodar la rama"), null, mod);
  /* Sobre los objetos REALES: branchNodes devuelve copias de los talentos
     (con sus requisitos ya traducidos a las cajas), y borrarles ahí las
     coordenadas no borraba nada. */
  branchNodes(b, mod).forEach(n => {
    const real = nodoPorId(n.id);
    if (real) { delete real.x; delete real.y; }
  });
  save();
  repintarModulo(mod);
  toast(mod === "proyectos" ? "Encargos reacomodados" : "Talentos reacomodados", "deshecho", { label: "Deshacer", onclick: "undoEditor()" });
}

function cssEscape(s) {
  return String(s).replace(/["\\]/g, "\\$&");
}

/* ================= Plegado y modo edición de ramas ================= */

let editBranch = null;
/* De que modulo es la rama que se esta editando. Hace falta desde que
   Proyectos tambien tiene mapa: los dos modulos pueden tener una rama con el
   MISMO nombre, y con solo el nombre guardado, entrar a editar el mapa de un
   proyecto llamado "Dibujo" ponia en edicion la rama "Dibujo" de Talentos a
   la vez. Se compara siempre el par, nunca el nombre solo. */
let editMod = "talentos";

/* Es ESTA rama de ESTE modulo la que esta en edicion? */
function editandoRama(b, mod) {
  return editBranch === b && editMod === (mod || "talentos");
}

/* ================= Rama a pantalla completa =================
   En el móvil la rama de la lista es solo una vista previa (no se recorre
   por dentro, para no robarle el gesto al scroll de la página). Aquí es
   donde se recorre y se edita de verdad, con sitio y las herramientas a
   mano. En escritorio es opcional: sirve para trabajar una rama grande sin
   el resto de la interfaz alrededor. */

let fullscreenBranch = null;
/* De qué módulo es la rama que está a pantalla completa. Por lo mismo que
   `editMod`: las dos pantallas pueden tener una rama con el mismo nombre, y
   la capa es una sola para las dos. Sin esto, abrir un proyecto a pantalla
   completa pintaba encima la rama de Talentos que se llamara igual. */
let fullscreenMod = "talentos";

/* Con el modo abierto hay DOS lienzos de la misma rama en el documento: el
   de la lista (tapado) y el de la pantalla completa. Todo lo que busque el
   lienzo tiene que quedarse con el que se está viendo. */
function constWrapFor(b) {
  return document.querySelector(`#fs-body .const-wrap[data-branch="${cssEscape(b)}"]`)
    || document.querySelector(`.const-wrap[data-branch="${cssEscape(b)}"]`);
}

function openBranchFullscreen(b, mod) {
  mod = mod || "talentos";
  /* Plegar es cosa de Talentos: en Proyectos no existe. Y no es un detalle
     cosmético — `state.ui.collapsed` va por NOMBRE, así que abrir a pantalla
     completa un proyecto llamado igual que una rama de talentos le habría
     desplegado la rama del otro módulo sin que nadie lo pidiera. */
  if (mod === "talentos" && isCollapsed(b)) {
    delete state.ui.collapsed[b];
    save();
  }
  fullscreenBranch = b;
  fullscreenMod = mod;
  document.body.classList.add("fs-on");
  repintarModulo(mod);
  requestAnimationFrame(() => focusBranchFront(b, true, mod));
}

/* No cierra el modo, solo lo esconde: el usuario sigue "dentro" de la rama
   y al volver del formulario la encuentra tal cual la dejó. */
function syncFullscreenForView(name) {
  if (!fullscreenBranch) return;
  const ov = document.getElementById("fs-overlay");
  if (!ov) return;
  /* Cada capa pertenece a su pantalla: la de un proyecto solo se enseña
     dentro de Proyectos, y la de una rama de talentos dentro del árbol. */
  const enSuPantalla = fullscreenMod === "proyectos" ? name === "projects" : name === "tree";
  ov.classList.toggle("show", enSuPantalla);
  document.body.classList.toggle("fs-on", enSuPantalla);
}

/* ---- Saltar a otra rama sin salir ----
   Se cuelga del propio nombre, que es donde uno mira cuando se pregunta "¿y
   las otras?". Reutiliza el menú del clic derecho para no inventar una
   ventana más: es la misma capa, la misma forma de cerrarse y el mismo piso. */
function abrirSaltoDeRama(e) {
  e.stopPropagation();
  const el = document.getElementById("ctx");
  if (!el || !fullscreenBranch) return;
  const esProy = fullscreenMod === "proyectos";
  const otras = ramasDe(esProy ? "projects" : "perks");
  el.innerHTML = `<div class="ctx-head">${esProy ? tx("Tus proyectos") : tx("Tus ramas")}</div>` +
    otras.map(n => {
      const cuantos = esProy ? encargosDeRama(n).length : talentosDeRama(n).length;
      const aqui = n === fullscreenBranch;
      return `<button${aqui ? ' class="aqui"' : ""} onclick="cerrarCtxMenu();saltarARama('${enJS(n)}')">
        <span class="ctx-tx"><b>${escapeHtml(n)}</b><span>${cuantos} ${
          esProy ? (cuantos === 1 ? "encargo" : "encargos") : (cuantos === 1 ? "talento" : "talentos")}</span></span>
        ${aqui ? `<span class="ctx-ic">✓</span>` : ""}
      </button>`;
    }).join("");
  const r = e.currentTarget.getBoundingClientRect();
  colocarCtxMenu(el, r.left, r.bottom + 6);
}

function saltarARama(b) {
  if (!fullscreenBranch || b === fullscreenBranch) return;
  /* Se abre como si se entrara de nuevo: eso despliega la rama si estaba
     plegada, la encuadra en su frente de avance y deja el zoom que tuviera
     guardado. Saltar tiene que sentirse igual que entrar. */
  openBranchFullscreen(b, fullscreenMod);
}

function closeBranchFullscreen() {
  if (!fullscreenBranch) return;
  const mod = fullscreenMod;
  fullscreenBranch = null;
  fullscreenMod = "talentos";
  document.body.classList.remove("fs-on");
  document.getElementById("fs-overlay").classList.remove("show");
  repintarModulo(mod);
}

/* La ventana de una caja se cierra primero: Escape cierra lo de encima, no
   todo lo que hay abierto de golpe. */
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  /* Escape va de dentro hacia fuera: primero suelta lo elegido, y solo si no
     había nada elegido cierra la pantalla completa. Si no, quien quiere
     deshacer una selección se encuentra con que se le cerró el mapa. */
  if (selNodos.size) { soltarSeleccion(); return; }
  if (fullscreenBranch && !ventanaCajaId) closeBranchFullscreen();
});

/* `mod` dice quién está llamando. Cada pantalla pinta SOLO su propia rama a
   pantalla completa: sin esto, repintar Proyectos con una rama de Talentos
   abierta le metía dentro de la capa el mapa equivocado. Sin argumento pinta
   la que haya, que es lo que hacía antes. */
function renderFullscreen(mod) {
  const ov = document.getElementById("fs-overlay");
  if (!ov) return;
  if (!fullscreenBranch) { ov.classList.remove("show"); return; }
  if (mod && mod !== fullscreenMod) return;

  const b = fullscreenBranch;
  const esProy = fullscreenMod === "proyectos";
  const nodes = branchNodes(b, fullscreenMod);
  /* Vacía y desaparecida no son lo mismo, y confundirlas costó el fallo que no
     se podía diagnosticar mirando: una rama recién creada —que todavía no
     tiene ningún talento— salía por aquí, así que tocar «Ver en pantalla
     completa» no hacía absolutamente nada. Ni se abría, ni avisaba, ni
     fallaba: el modo se encendía y se apagaba en la misma vuelta. Y es justo
     cuando más se toca esa opción, porque acabas de crear la rama y vas a
     llenarla.

     Ahora solo se cierra si la rama YA NO EXISTE —se borró estando dentro—.
     Una rama vacía se abre y enseña qué hacer, igual que en la lista. */
  if (!ramasDe(esProy ? "projects" : "perks").includes(b)) {
    closeBranchFullscreen();
    return;
  }
  const ba = escapeAttr(b);
  /* `ba` para los atributos normales y `bj` para lo que va dentro de las
     comillas simples de un `onclick`. Ver `enJS`. */
  const bj = enJS(b);
  const editing = editandoRama(b, fullscreenMod);
  const doneN = esProy
    ? nodes.filter(n => n.status === "done").length
    : nodes.filter(n => n.status === "completed").length;

  /* ---- Dónde estás ----
     Antes esta barra decía solo el nombre de la rama. Quien entraba a
     pantalla completa perdía de vista en qué parte de la app estaba y no
     tenía forma de ir a otra sin salir. Ahora dice el módulo —que devuelve a
     su lista— y el nombre abre las demás para saltar sin salir. */
  const hermanas = ramasDe(esProy ? "projects" : "perks");
  document.getElementById("fs-name").innerHTML = `
    <button type="button" class="fs-mod" onclick="closeBranchFullscreen()">${
      esProy ? "Proyectos" : "Talentos"}</button>
    <span class="fs-sep">›</span>
    <button type="button" class="fs-rama${hermanas.length > 1 ? " saltable" : ""}"${
      hermanas.length > 1 ? ` onclick="abrirSaltoDeRama(event)"` : ""}>${escapeHtml(b)}${
      hermanas.length > 1 ? `<i>▾</i>` : ""}</button>`;
  document.getElementById("fs-count").textContent =
    `${doneN} de ${nodes.length} ${esProy ? "terminados" : "logrados"}`;
  /* Arriba solo queda cerrar y saber dónde estás. Las herramientas bajan a
     la tira flotante: en el teléfono el pulgar no llega a la esquina superior
     derecha, y es justo la barra que más se toca. */
  document.getElementById("fs-tools").innerHTML = "";

  /* La clave del SVG es distinta de la que usa la lista: si coincidiera,
     los dos lienzos compartirían los ids de los filtros y el brillo se
     aplicaría al equivocado. */
  /* Sin talentos no se pinta un lienzo en blanco —parecería roto— sino el
     mismo mensaje que la lista, con la salida a mano: el ＋ está arriba. */
  /* ---- La tira de herramientas ----
     Flota: abajo en el teléfono, a la izquierda en PC. Los mismos botones y
     en el mismo orden en los dos módulos; lo que no aplica se APAGA en su
     sitio en vez de quitarse, porque si los iconos se recorren la mano tiene
     que volver a aprender dónde estaba cada cosa.

     Elegir varios no aplica en Proyectos: agrupa lo elegido en una caja del
     ático, que es del árbol de Talentos. */
  const tira = `
    <div class="mapa-tira" role="toolbar" aria-label="Herramientas del mapa">
      <button type="button" class="mt-btn" ${editing ? "disabled" : ""}
        onclick="focusBranchFront('${bj}', false, '${fullscreenMod}')"
        aria-label="Centrar en lo que sigue" title="Centrar en lo que sigue"><svg viewBox="0 0 24 24">${BM_ICONS.flecha}</svg></button>
      <button type="button" class="mt-btn ${ramaGirada(b, fullscreenMod) ? "on" : ""}"
        onclick="girarRama('${bj}', '${fullscreenMod}')"
        aria-label="${ramaGirada(b, fullscreenMod) ? "Verla en horizontal" : tx("Ver la rama de pie")}"
        aria-pressed="${ramaGirada(b, fullscreenMod)}"
        title="${ramaGirada(b, fullscreenMod)
          ? tx("Volver a lo ancho, como estaba")
          : `Poner de pie: el primer ${esProy ? "encargo" : "talento"} abajo y el camino subiendo`}"><svg viewBox="0 0 24 24">${
          ramaGirada(b, fullscreenMod) ? BM_ICONS.girarVuelta : BM_ICONS.girar}</svg></button>
      <button type="button" class="mt-btn ${editing ? "on" : ""}"
        onclick="toggleEditBranch('${bj}', '${fullscreenMod}')"
        aria-label="${editing ? "Salir de edición" : tx("Editar el mapa")}" aria-pressed="${editing}"
        title="${editing ? "Salir de edición" : tx("Editar el mapa: conectar y cortar")}"><svg viewBox="0 0 24 24">${BM_ICONS.lapiz}</svg></button>
      <button type="button" class="mt-btn ${modoElegir ? "on" : ""}" ${esProy ? "disabled" : ""}
        onclick="toggleElegirVarios('${bj}')"
        aria-label="Elegir varios" aria-pressed="${!esProy && modoElegir}"
        title="${esProy ? "Elegir varios es del árbol de Talentos" : tx("Elegir varios para moverlos juntos o agruparlos")}"><svg viewBox="0 0 24 24">${BM_ICONS.caja}</svg></button>
      <button type="button" class="mt-btn crear"
        onclick="${esProy ? `openProjectForm(null, '${bj}')` : `openPerkForm(null, '${bj}')`}"
        aria-label="Añadir ${esProy ? "encargo" : "talento"} a ${ba}"
        title="Añadir ${esProy ? "un encargo" : "un talento"}">＋</button>
    </div>`;

  document.getElementById("fs-body").innerHTML = !nodes.length
    ? `<p class="col-vacia" style="margin:auto;text-align:center;max-width:34ch">Todavía no hay ${
        esProy ? tx("encargos en este proyecto") : tx("talentos en esta rama")}. Créale el primero con el ＋ de arriba.</p>`
    : `
    <div class="const-wrap ${editing ? "editing" : ""}" data-branch="${ba}"${
        esProy ? ` data-mod="proyectos"` : ""}>${constellation(nodes, 900, editing, b, fullscreenMod)}</div>
    ${tira}
    ${/* La ayuda solo mientras se edita, y no siempre. Ocupaba 54 px fijos —de
          812 que tiene un teléfono— para repetir eternamente algo que se lee
          una vez: tx("arrastra el fondo para recorrer"). Ahí es donde va ahora la
          tira, así que las herramientas no cuestan un píxel nuevo. Dentro de
          la edición sí se queda: tirar del punto ▸ y tocar una línea para
          cortarla no se adivinan solos. */
      !editing ? "" : `<div class="fs-hint">${esProy
        ? tx("Tira del punto ▸ hacia otro encargo para ponerlo después · toca una línea para cortarla · el círculo <b>Y/O</b> cambia si hacen falta todos sus requisitos o basta uno")
        : tx("Tira del punto ▸ hacia otro nodo para conectarlos · toca una línea para cortarla · <b>Shift</b> y clic elige varios · el círculo <b>Y/O</b> cambia la regla de entrada")}${
        esProy ? "" : atajosLegend()}</div>`}`;

  ov.classList.add("show");
  /* Los manejadores del lienzo solo si hay lienzo: sin él, `encuadrarLienzos`
     mide un elemento que no existe. */
  if (nodes.length) {
    if (editing) attachEditHandlers(ov);
    else attachPanHandlers(ov);
    attachCtxHandlers(ov);
    encuadrarLienzos(ov);
  }
}

/* ================= Editor del árbol: teclado, deshacer y creación rápida =================
   Todo esto es exclusivo de escritorio: son atajos de teclado y menú de
   clic derecho, cosas que en una pantalla táctil no existen. En el móvil
   nada de esto se activa y la app se comporta igual que antes. */

/* ---- Deshacer ----
   El editor es lo único de la app donde una acción destruye trabajo sin
   avisar (cortar una conexión, mover algo sin querer). Se guarda una copia
   completa de los talentos antes de cada cambio; son pocos kilobytes y
   evita el "acabo de romper media rama y no sé cómo estaba". */
/* 50 pasos. El coste por acción no cambia (la copia se hacía igual con 10);
   lo único que crece es la memoria retenida, y son unos pocos megas en el
   peor caso. Nada de esto toca el dibujado, así que no añade tirones. */
const UNDO_MAX = 50;
let undoStack = [];

/* La copia incluye las cajas desde que son nodos del mapa: mover una caja o
   sacarle un talento son acciones del editor como cualquier otra, y deshacer
   solo la mitad del estado sería peor que no poder deshacer. */
/* En Proyectos no hay cajas y la coleccion es otra, asi que la copia dice de
   que es. Sin el modulo, deshacer un movimiento hecho en el mapa de encargos
   habria restaurado los TALENTOS y borrado el trabajo del otro lado sin que
   nada avisara. */
function snapshotPerks(mod) {
  return (mod || "talentos") === "proyectos"
    ? JSON.stringify({ mod: "proyectos", projects: state.projects })
    : JSON.stringify({ perks: state.perks, cajas: state.cajas || [] });
}

function pushUndo(etiqueta, snap, mod) {
  undoStack.push({ perks: snap || snapshotPerks(mod), etiqueta });
  if (undoStack.length > UNDO_MAX) undoStack.shift();
}

function undoEditor() {
  if (!undoStack.length) { toast(tx("No hay nada que deshacer"), "atencion"); return; }
  const prev = undoStack.pop();
  const antes = JSON.parse(prev.perks);
  if (antes.mod === "proyectos") {
    state.projects = antes.projects;
    save();
    renderProjects();
    toast(`Deshecho: ${prev.etiqueta}`, "deshecho");
    return;
  }
  state.perks = antes.perks;
  state.cajas = antes.cajas || [];
  save();
  renderTree();
  toast(`Deshecho: ${prev.etiqueta}`, "deshecho");
}

/* Al salir del editor la pila se vacía: deshacer un movimiento de hace tres
   sesiones sorprendería más de lo que ayudaría. */
function clearUndo() { undoStack = []; }

/* Congela las posiciones automáticas de una rama. Hace falta antes de
   colocar algo a mano: si no, el resto de los nodos se reacomodarían
   alrededor del nuevo y el usuario vería saltar toda la rama. */
/* Escribe sobre el objeto REAL, no sobre lo que devuelve branchNodes.
   Desde que el lienzo dibuja una vista de la rama —copias de los talentos,
   con sus requisitos ya traducidos a las cajas del ático—, guardar la
   posición en el nodo dibujado la escribía en un objeto desechable. El
   efecto era el que se veía: cada talento nuevo recolocaba a los demás,
   porque los de antes seguían sin coordenadas propias y el reparto
   automático los volvía a centrar con una fila más. */
function fijarPosiciones(b, mod) {
  const nodes = branchNodes(b, mod);
  const { pos } = branchLayout(nodes);
  const lista = listaDe(mod || "talentos");
  nodes.forEach(n => {
    const real = n.esCaja
      ? (state.cajas || []).find(c => c.id === n.cajaId)
      : lista.find(p => p.id === n.id);
    if (!real || (typeof real.x === "number" && typeof real.y === "number")) return;
    real.x = pos[n.id].x;
    real.y = pos[n.id].y;
  });
}

/* Los atajos escritos, para no tener que recordarlos. Van en la línea de
   indicaciones que ya existía debajo de cada rama, que es donde el usuario
   ya mira cuando no sabe qué hacer, y no ocupan sitio propio. */
/* Cada tecla dice QUÉ crea, pegada a su nombre. Antes se agrupaban las tres
   en un "QWE crear" que obligaba a probar cuál era cuál, y el "clic derecho:
   más" no decía nada: "más" no es una acción que uno pueda imaginarse. */
/* El ratón con el botón derecho encendido. La línea de ayuda tenía todas las
   teclas en su tecla dibujada y "clic derecho" suelto en texto corrido, así
   que la única pista que no era de teclado era justo la que menos se parecía
   a un atajo. */
const RATON_DERECHO = `<svg viewBox="0 0 24 24" aria-hidden="true">
  <rect x="6.6" y="2.4" width="10.8" height="19.2" rx="5.4" fill="none" stroke="currentColor" stroke-width="1.7"/>
  <path d="M12 2.9h.9a4.5 4.5 0 0 1 4.5 4.5v3.4H12z" fill="currentColor" stroke="none"/>
  <path d="M12 3v7.8M6.6 10.8h10.8" stroke="currentColor" stroke-width="1.4" fill="none"/>
</svg>`;

function atajosLegend(compacta) {
  if (!isDesktop()) return "";
  const k = (t) => `<kbd>${t}</kbd>`;
  const raton = `<kbd class="kb-raton">${RATON_DERECHO}</kbd>`;
  /* Tecla, figura y nombre juntos. Antes la figura vivia en una fila de
     simbologia aparte y el nombre en la de atajos, asi que los tres tipos se
     listaban dos veces y ninguna de las dos filas se bastaba sola. */
  const crear = ["hito", "meta", "compra"]
    .map(t => `${k(TIPOS[t].tecla)} <b class="gl">${TIPOS[t].glifo}</b> ${tx(TIPOS[t].nombre).toLowerCase()}`)
    .join('<i class="sep">·</i>');
  const partes = compacta
    ? [crear, `${k("C")} ${tx("editar el mapa")}`, `${k("M")} ${tx("pantalla completa")}`,
       `${raton} ${tx("clic derecho: crear, editar y pantalla completa")}`]
    : [crear, `${k("C")} ${tx("salir de edición")}`, `${k("M")} ${tx("pantalla completa")}`,
       `${k("Ctrl")}${k("Z")} ${tx("deshacer")}`, `${raton} ${tx("clic derecho: crear y más acciones")}`];
  return `<span class="keys">${partes.join('<i class="sep">·</i>')}</span>`;
}

function crearTalentoRapido(branch, tipo, pos) {
  const t = TIPOS[tipo];
  if (!branch || !t) return;
  /* El tope del plan se mira aquí y no dentro del atajo de teclado: por esta
     puerta se entra también desde el menú del clic derecho, y un tope que solo
     vigila una de las dos entradas no es un tope. */
  if (!cabeUnoMas("talentos", talentosDeRama(branch).length)) { topeAlcanzado("talentos"); return; }
  pushUndo(`crear ${t.nombre.toLowerCase()}`);
  fijarPosiciones(branch);
  const n = state.perks.length;
  const nuevo = {
    id: uid(), name: t.nombre, branch, desc: "",
    tipo, cost: 0, planDays: 360, steps: [],
    skillId: null, xpReward: tipo === "hito" ? 120 : 600, requiere: [], modo: "todos",
    icon: ICON_LIST[(n * 5 + 3) % ICON_LIST.length],
    color: COLORS[(n * 3 + 2) % COLORS.length],
    status: null, startDate: null, endDate: null, completedAt: null,
    investedTotal: 0, progress: 0, createdAt: todayKey(),
    history: [{ date: todayKey(), at: stamp(), event: `Talento creado en la rama ${branch}` }]
  };
  if (pos) {
    /* `pos` es donde está el cursor, o sea una coordenada DEL DIBUJO; lo que
       se guarda tiene que ir sin girar, o al volver la rama a horizontal el
       talento aparecería a noventa grados de donde se creó. */
    const d = aDatos(pos.x, pos.y, ramaGirada(branch, "talentos"));
    nuevo.x = enLienzoX(d.x);
    nuevo.y = enLienzoY(d.y);
  }
  state.perks.push(nuevo);
  save();
  renderTree();
  toast(T`${tx(t.nombre)} creado · ábrelo para ponerle nombre`, "hecho");
}

/* Copia el PLAN, no lo logrado: el duplicado nace sin progreso, sin dinero
   invertido y sin fechas. Heredar el avance del original convertiría un
   atajo para clonar la forma de un talento en una mentira sobre lo hecho. */
function duplicarTalento(id, pos) {
  const orig = state.perks.find(p => p.id === id);
  if (!orig) return;
  const branch = orig.branch || "General";
  /* Duplicar es crear: si no se mirara aquí, el tope se saltaría con el atajo
     más cómodo que tiene la app. */
  if (!cabeUnoMas("talentos", talentosDeRama(branch).length)) { topeAlcanzado("talentos"); return; }
  pushUndo(tx("duplicar un talento"));
  fijarPosiciones(branch);

  const copia = JSON.parse(JSON.stringify(orig));
  copia.id = uid();
  copia.name = orig.name + " (copia)";
  copia.status = null;
  copia.startDate = null;
  copia.endDate = null;
  copia.completedAt = null;
  copia.investedTotal = 0;
  copia.progress = 0;
  copia.createdAt = todayKey();
  copia.history = [{ date: todayKey(), at: stamp(), event: `Duplicado de "${orig.name}"` }];

  /* Donde se hizo clic; si no, junto al original pero sin taparlo. El clic
     viene en coordenadas del dibujo y hay que desgirarlo; el "junto al
     original" ya está en las guardadas y no se toca. */
  const destino = pos
    ? aDatos(pos.x, pos.y, ramaGirada(branch, "talentos"))
    : (typeof orig.x === "number" ? { x: orig.x + 46, y: orig.y + 78 } : null);
  if (destino) {
    copia.x = enLienzoX(destino.x);
    copia.y = enLienzoY(destino.y);
  }

  state.perks.push(copia);
  save();
  renderTree();
  toast(`Duplicado: ${copia.name}`, "hecho");
}

/* ---- Crear un encargo desde el propio mapa ----
   El equivalente de crearTalentoRapido, mas corto porque un encargo no tiene
   tres tipos entre los que elegir. Nace con nombre provisional y sin etapas:
   se abre y se le pone lo suyo.

   El tope SI hay que vigilarlo, y aqui tambien: este es el camino corto —dos
   teclas sobre el mapa— y dejarlo sin mirar convertiria el limite en una
   sugerencia que se salta cualquiera que conozca el atajo. */
function crearEncargoRapido(branch, pos) {
  if (!branch) return;
  if (!cabeUnoMas("encargos", encargosDeRama(branch).length)) { topeAlcanzado("encargos"); return; }
  pushUndo(tx("crear un encargo"), null, "proyectos");
  fijarPosiciones(branch, "proyectos");
  const n = state.projects.length;
  const nuevo = {
    id: uid(), name: "Encargo", branch, desc: "",
    mod: "proyectos", status: "active", steps: [], skillId: null, xpReward: 0,
    requiere: [], modo: "todos", espera: false,
    icon: ICON_LIST[(n * 4 + 1) % ICON_LIST.length],
    color: COLORS[n % COLORS.length],
    createdAt: todayKey(), lastActivity: todayKey(), completedAt: null,
    history: [{ date: todayKey(), at: stamp(), event: `Encargo creado en el proyecto ${branch}` }]
  };
  if (pos) {
    // Igual que en Talentos: el cursor viene girado y lo guardado no lo va
    const d = aDatos(pos.x, pos.y, ramaGirada(branch, "proyectos"));
    nuevo.x = enLienzoX(d.x);
    nuevo.y = enLienzoY(d.y);
  }
  state.projects.push(nuevo);
  save();
  renderProjects();
  toast(tx("Encargo creado · ábrelo para ponerle nombre"), "hecho");
}

/* El interruptor que separa las dos clases de flecha. Vive en el ENCARGO y no
   en cada linea (Eduardo, 27 ago 2026): una flecha siempre dice "esto va
   despues de aquello", y esto dice si ademas hay que esperar. */
function alternarEspera(id) {
  const pr = state.projects.find(x => x.id === id);
  if (!pr) return;
  pushUndo(pr.espera ? tx("dejar de esperar") : tx("esperar el turno"), null, "proyectos");
  pr.espera = !pr.espera;
  /* A mano y no con projectLog: ese ayudante pone `lastActivity` en hoy, y
     cambiar como se comporta un encargo no es haberlo avanzado. Con el, dar
     al interruptor le habria borrado los dias de estancado a un encargo
     parado, que es justo el numero que la app usa para decirte la verdad. */
  pr.history = pr.history || [];
  pr.history.unshift({ date: todayKey(), at: stamp(), event: pr.espera
    ? tx("Espera a que terminen sus requisitos")
    : tx("Ya no espera: se puede avanzar antes de tiempo") });
  save();
  if (typeof currentProjectId !== "undefined" && currentProjectId === pr.id) renderProjectDetail();
  renderProjects();
  toast(pr.espera
    ? `${pr.name} no se abrirá hasta que terminen sus requisitos`
    : `${pr.name} se puede avanzar aunque lo anterior no esté`,
    "hecho", { label: "Deshacer", onclick: "undoEditor()" });
}

function ctxCrearEncargo(branch) {
  const pos = ctxPos;
  cerrarCtxMenu();
  crearEncargoRapido(branch, pos);
}

function ctxDuplicar(id) {
  const pos = ctxPos;
  cerrarCtxMenu();
  duplicarTalento(id, pos);
}

/* ---- Dónde está el ratón ----
   Se recuerda el último lienzo señalado y el punto exacto dentro de él, en
   coordenadas del dibujo. Así un atajo de teclado puede dejar el talento
   justo donde apunta el cursor, en vez de en una esquina cualquiera. */
let cursorRama = null;

function puntoEnLienzo(wrap, clientX, clientY) {
  const svg = wrap.querySelector("svg");
  if (!svg || !svg.viewBox || !svg.viewBox.baseVal) return null;
  const r = svg.getBoundingClientRect();
  const vb = svg.viewBox.baseVal;
  if (!r.width || !r.height) return null;
  /* El encuadre no siempre empieza en cero: se corre a la izquierda cuando
     hay cabos de otra rama y hacia arriba cuando un grupo desplegado
     sobresale. Sin sumar ese origen, todo lo que se creaba o arrastraba
     aparecía desplazado justo esa cantidad. */
  return {
    x: vb.x + (clientX - r.left) * (vb.width / r.width),
    y: vb.y + (clientY - r.top) * (vb.height / r.height)
  };
}

document.addEventListener("mousemove", (e) => {
  if (!e.target || !e.target.closest) return;
  const wrap = e.target.closest(".const-wrap");
  if (!wrap) return;                       // fuera de un lienzo se conserva el último
  const p = puntoEnLienzo(wrap, e.clientX, e.clientY);
  if (p) cursorRama = { branch: wrap.dataset.branch, x: p.x, y: p.y };
  marcarRamaActiva();
});

/* ---- Enseñar sobre qué rama van a caer las teclas ----
   `ramaDeAtajo` decide en silencio, y el silencio era el problema: señalabas
   una rama, no pasaba nada visible, y la siguiente tecla creaba un talento
   ahí. La pleca del canto izquierdo lo dice sin ocupar sitio (ver
   `.branch-card::after` en css/estilos.css).

   Solo en escritorio: los atajos y el clic derecho no existen en una pantalla
   táctil, y marcar la rama que toca el dedo prometería algo que no hay. Y solo
   en la lista de Talentos, que es donde esas teclas trabajan.

   Se recuerda cuál está marcada para no recorrer las tarjetas en cada píxel
   que se mueve el ratón: solo se toca el DOM cuando de verdad cambia la rama.
   El dibujado pone la clase por su cuenta, así que un repintado no la pierde
   y las dos formas coinciden. */
let ramaMarcada = null;

function marcarRamaActiva() {
  const b = (isDesktop() && !fullscreenBranch && activeMainView === "tree")
    ? ramaDeAtajo() : null;
  if (b === ramaMarcada) return;
  ramaMarcada = b;
  document.querySelectorAll(".branch-card[data-rama]").forEach(c => {
    c.classList.toggle("rama-activa", !!b && c.dataset.rama === b);
  });
}

/* La rama sobre la que actúan los atajos: la que señala el ratón, y si no,
   la que esté a pantalla completa o en edición. */
function ramaDeAtajo() {
  // A pantalla completa solo hay una rama en juego, señale donde señale
  if (fullscreenBranch) return fullscreenMod === "talentos" ? fullscreenBranch : null;
  if (cursorRama && cursorRama.branch) return cursorRama.branch;
  return editBranch;
}

function posDeAtajo(branch) {
  return (cursorRama && cursorRama.branch === branch) ? { x: cursorRama.x, y: cursorRama.y } : null;
}

/* ---- Enfriamiento de las teclas que crean ----
   `e.repeat` solo para la tecla SOSTENIDA. Repicándola —que es lo que hace
   cualquiera al probar el atajo— el navegador manda pulsaciones de verdad, y
   con Q, W y E se sembraba la rama de decenas de talentos en dos segundos.
   Cada uno arrastra un guardado, un repintado del árbol completo, una entrada
   en la pila de deshacer y un aviso; y luego hay que borrarlos de uno en uno.

   Medio segundo: por debajo de eso ya no es una decisión, es un repique. Crear
   dos talentos seguidos a propósito cuesta un parpadeo más y no se nota; el
   repique se corta entero.

   No lleva aviso. Un atajo que no hizo nada porque fue demasiado rápido se
   entiende solo al segundo intento, y llenar la pantalla de mensajes por algo
   que el usuario ni pretendía sería más molesto que el problema. Lo que sí
   hay es una pista visible: el aviso de creación no aparece. */
const ATAJO_ENFRIAMIENTO = 500;
let atajoUltimo = 0;

function atajoEnfriado() {
  const ahora = Date.now();
  if (ahora - atajoUltimo < ATAJO_ENFRIAMIENTO) return false;
  atajoUltimo = ahora;
  return true;
}

function escribiendo(el) {
  if (!el) return false;
  const t = (el.tagName || "").toUpperCase();
  return t === "INPUT" || t === "TEXTAREA" || t === "SELECT" || el.isContentEditable;
}

document.addEventListener("keydown", (e) => {
  if (!isDesktop() || escribiendo(e.target)) return;
  /* Con la tecla sostenida el sistema repite el evento decenas de veces por
     segundo: sin esto, dejar el dedo en la Q sembraba la rama de talentos.
     Un atajo de creación es una acción por pulsación, no por milisegundo. */
  if (e.repeat) return;

  /* Deshacer, repartido por pantalla: cada una tiene su propia pila y su
     propio Ctrl+Z. Compartir una sola haría que la combinación revirtiera
     algo que no está a la vista, que es la peor forma de deshacer. */
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
    if (activeMainView === "summary") {
      if (!dashUndo.length) return;
      e.preventDefault();
      deshacerTablero();
      return;
    }
    if (!undoStack.length) return;
    e.preventDefault();
    undoEditor();
    return;
  }
  if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;

  // Solo dentro del árbol (o de una rama a pantalla completa)
  /* Los atajos crean TALENTOS. Con un proyecto a pantalla completa,
     `fullscreenBranch` está puesto pero la rama es de otro módulo: sin esta
     comprobación, pulsar Q sembraba un talento dentro de un proyecto. */
  if (fullscreenBranch ? fullscreenMod !== "talentos" : activeMainView !== "tree") return;
  const rama = ramaDeAtajo();
  if (!rama) return;

  const k = e.key.toLowerCase();
  /* La C no se enfría: alternar el modo de edición no crea nada, y llevar la
     cuenta de las tres que sí crean por separado de la que no lo hace es lo
     que evita que pulsar C gaste el turno de la Q. */
  if (k === "c") { e.preventDefault(); toggleEditBranch(rama); return; }
  /* M de Mapa, como en cualquier juego. Tampoco se enfria, por lo mismo que
     la C: no crea nada. Y hace las dos cosas —abre y cierra— porque un atajo
     que solo entra deja al que lo uso buscando como salir.

     Editando no se toca: ahi la mano esta conectando y cortando, y saltar a
     otra pantalla a media faena seria perder el hilo. */
  if (k === "m") {
    e.preventDefault();
    if (editandoRama(rama, "talentos")) return;
    if (fullscreenBranch) closeBranchFullscreen();
    else openBranchFullscreen(rama, "talentos");
    return;
  }
  const tipo = k === "q" ? "hito" : k === "w" ? "meta" : k === "e" ? "compra" : null;
  if (!tipo) return;
  e.preventDefault();
  if (!atajoEnfriado()) return;
  crearTalentoRapido(rama, tipo, posDeAtajo(rama));
});

/* ---- Menú de clic derecho sobre el lienzo ---- */
let ctxPos = null;
let ctxMod = "talentos";

function abrirCtxMenu(clientX, clientY, branch, pos, nodoId, mod) {
  const el = document.getElementById("ctx");
  if (!el) return;
  closeBranchMenus();       // y al revés: el de la rama se aparta
  ctxPos = pos;
  ctxMod = mod || "talentos";
  const editando = editandoRama(branch, ctxMod);
  const item = (titulo, pista, tecla, onclick, icono) => `
    <button onclick="${onclick}">
      <span class="ctx-tx"><b>${escapeHtml(titulo)}</b><span>${escapeHtml(pista)}</span></span>
      ${tecla ? `<kbd>${tecla}</kbd>` : (icono ? `<span class="ctx-ic"><svg viewBox="0 0 24 24">${icono}</svg></span>` : "")}
    </button>`;

  /* ---- El menu del mapa de encargos ----
     Sale antes que nada porque casi ninguna accion de Talentos vale aqui: no
     hay tres tipos que crear, ni cajas del atico, ni duplicado que copie "la
     forma sin el progreso" —un encargo es su progreso—. Compartir el menu y
     esconder la mitad de sus lineas habria dejado un menu lleno de huecos. */
  if (ctxMod === "proyectos") {
    const enc = nodoId ? state.projects.find(x => x.id === nodoId) : null;
    el.innerHTML =
      (enc ? (
        `<div class="ctx-head">${escapeHtml(enc.name)}</div>` +
        item(tx("Abrir el encargo"), tx("Sus etapas, su ritmo y su historial"), "",
          `cerrarCtxMenu();openProject('${escapeAttr(enc.id)}')`, BM_ICONS.lapiz) +
        item(enc.espera ? tx("Dejar de esperar") : tx("Que espere su turno"),
          enc.espera ? tx("Podrás avanzarlo aunque lo anterior no esté") : tx("No se abrirá hasta que terminen sus requisitos"),
          "", `cerrarCtxMenu();alternarEspera('${escapeAttr(enc.id)}')`, BM_ICONS.caja) +
        `<div class="ctx-sep"></div>`
      ) : "") +
      item(tx("Nuevo encargo aquí"), tx("Se crea donde hiciste clic"), "",
        `ctxCrearEncargo('${enJS(branch)}')`, BM_ICONS.copiar) +
      `<div class="ctx-sep"></div>` +
      item(editando ? tx("Salir de edición") : tx("Editar el mapa"),
        editando ? tx("Vuelve al modo normal") : tx("Conecta y corta hilos"), "",
        `cerrarCtxMenu();toggleEditBranch('${enJS(branch)}','proyectos')`) +
      (fullscreenBranch ? "" : item("Ver en pantalla completa", tx("Recorre el proyecto con sitio de sobra"), "",
        `cerrarCtxMenu();openBranchFullscreen('${enJS(branch)}','proyectos')`, BM_ICONS.expandir)) +
      (undoStack.length ? item("Deshacer", undoStack[undoStack.length - 1].etiqueta, "Ctrl Z", `cerrarCtxMenu();undoEditor()`) : "");
    colocarCtxMenu(el, clientX, clientY);
    return;
  }

  // Si el clic cayó sobre una caja del ático, manda ella
  const caja = nodoId ? (state.cajas || []).find(c => c.id === nodoId) : null;
  if (caja) {
    const { total, hechos, pendientes } = resumenCaja(caja);
    el.innerHTML =
      `<div class="ctx-head">${escapeHtml(nombreCaja(caja))}</div>` +
      item(tx("Ver qué lleva"), pendientes ? T`${hechos} hechos y ${pendientes} sin terminar` : T`${total} talentos guardados`,
        "", `cerrarCtxMenu();verCaja('${escapeAttr(caja.id)}')`, BM_ICONS.caja) +
      item(tx("Renombrar la caja"), tx("Ponle el nombre de lo que fue esa época"), "",
        `cerrarCtxMenu();renombrarCaja('${escapeAttr(caja.id)}')`, BM_ICONS.lapiz) +
      item(tx("Desplegarla en el mapa"), tx("Todo vuelve donde estaba"), "",
        `cerrarCtxMenu();abrirCaja('${escapeAttr(caja.id)}')`, BM_ICONS.expandir) +
      `<div class="ctx-sep"></div>` +
      item(tx("Borrar la caja"), `Se van sus ${total} talento${total === 1 ? "" : "s"}`, "",
        `cerrarCtxMenu();borrarCaja('${escapeAttr(caja.id)}')`, BM_ICONS.bote);
    colocarCtxMenu(el, clientX, clientY);
    return;
  }

  // Si el clic cayó sobre un talento, sus acciones van primero
  const nodo = nodoId ? state.perks.find(p => p.id === nodoId) : null;
  const bloqueNodo = nodo ? (
    `<div class="ctx-head">${escapeHtml(nodo.name)}</div>` +
    item("Duplicar talento", tx("Copia su forma, sin el progreso"), "", `ctxDuplicar('${escapeAttr(nodo.id)}')`, BM_ICONS.copiar) +
    item("Abrir talento", tx("Ver y editar sus datos"), "", `cerrarCtxMenu();openPerk('${escapeAttr(nodo.id)}')`, BM_ICONS.lapiz) +
    `<div class="ctx-sep"></div>`
  ) : "";

  el.innerHTML =
    bloqueNodo +
    `<div class="ctx-head">${tx("Crear aquí")}</div>` +
    /* Los tres tipos con su tecla, en el mismo orden que el selector del
       formulario para que la mano aprenda una sola disposición. */
    /* La figura acompana al nombre, igual que en la linea de ayuda: es la
       misma pista en los dos sitios, asi que se aprende una sola vez. */
    item(`${TIPOS.meta.glifo} ${TIPOS.meta.nombre}`, tx("Se sostiene en el tiempo y avanza por etapas"), "W", `ctxCrear('${enJS(branch)}','meta')`) +
    item(`${TIPOS.compra.glifo} ${TIPOS.compra.nombre}`, tx("Una llave que se paga y abre el paso"), "E", `ctxCrear('${enJS(branch)}','compra')`) +
    item(`${TIPOS.hito.glifo} ${TIPOS.hito.nombre}`, tx("Una acción puntual que se cierra en sí misma"), "Q", `ctxCrear('${enJS(branch)}','hito')`) +
    `<div class="ctx-sep"></div>` +
    item(editando ? tx("Salir de edición") : tx("Editar el mapa"), editando ? tx("Vuelve al modo normal") : tx("Conecta y corta hilos"), "C", `cerrarCtxMenu();toggleEditBranch('${enJS(branch)}')`) +
    item(tx("Ver en pantalla completa"), tx("Recorre la rama con sitio de sobra"), "", `cerrarCtxMenu();openBranchFullscreen('${enJS(branch)}')`, BM_ICONS.expandir) +
    (undoStack.length ? item("Deshacer", undoStack[undoStack.length - 1].etiqueta, "Ctrl Z", `cerrarCtxMenu();undoEditor()`) : "");

  colocarCtxMenu(el, clientX, clientY);
}

/* Se coloca en el cursor, pero sin salirse de la pantalla. Vive aparte
   porque el menú de una caja del ático sale antes y también la necesita. */
function colocarCtxMenu(el, clientX, clientY) {
  el.classList.add("show");
  const r = el.getBoundingClientRect();
  el.style.left = Math.min(clientX, window.innerWidth - r.width - 10) + "px";
  el.style.top = Math.min(clientY, window.innerHeight - r.height - 10) + "px";
}

function cerrarCtxMenu() {
  const el = document.getElementById("ctx");
  if (el) el.classList.remove("show");
}

function ctxCrear(branch, tipo) {
  const pos = ctxPos;
  cerrarCtxMenu();
  crearTalentoRapido(branch, tipo, pos);
}

document.addEventListener("click", cerrarCtxMenu);
document.addEventListener("scroll", cerrarCtxMenu, true);

function isCollapsed(b) {
  return !!(state.ui && state.ui.collapsed && state.ui.collapsed[b]);
}

function toggleBranch(b) {
  state.ui = state.ui || {};
  state.ui.collapsed = state.ui.collapsed || {};
  if (state.ui.collapsed[b]) { delete state.ui.collapsed[b]; focusPending = true; }
  else { state.ui.collapsed[b] = true; if (editandoRama(b, "talentos")) editBranch = null; }
  save();
  renderTree();
}

function toggleEditBranch(b, mod) {
  mod = mod || "talentos";
  // Fuera del editor la selección no puede hacer nada, así que no sobrevive
  limpiarSeleccion();
  if (editandoRama(b, mod)) {
    editBranch = null;
    clearUndo();   // deshacer un cambio de hace tres sesiones sorprendería más de lo que ayuda
    repintarModulo(mod);
    toast(tx("Listo, modo edición cerrado"), "hecho");
    return;
  }
  editBranch = b;
  editMod = mod;
  clearUndo();
  fijarPosiciones(b, mod);
  save();
  repintarModulo(mod);
  toast(mod === "proyectos"
    ? tx("Edición: arrastra, conecta y corta")
    : (isDesktop() ? tx("Edición: Q, W y E crean · C para salir") : tx("Modo edición: arrastra y conecta")), "hecho");
}

/* ================= Constelación =================
   Mapa de nodos por rama, estilo árbol de talentos de RPG.
   La geometría comunica el tipo: rombo = meta, hexágono = hito,
   círculo pequeño = compra.
   Se conectan los talentos con "requiere completar antes". */

/* Reparte los nodos de una rama en capas.
   Con un requisito único esto era un recorrido en anchura desde las raíces:
   cada nodo tenía un padre, así que su profundidad era la del padre más
   uno y no había nada que decidir. Con varios padres deja de ser un árbol y
   la profundidad pasa a ser la del padre MÁS PROFUNDO más uno — si no, un
   nodo que corona dos caminos se dibujaría encima del más corto y su línea
   volvería hacia atrás.

   Se recorre en orden topológico (primero los que ya tienen todos sus
   padres colocados). Como isDescendant impide los bucles, ese orden existe
   siempre; aun así se sale por las bravas si quedara algo sin colocar, para
   que un dato raro nunca cuelgue el dibujo. */
/* `gir` dice si esta rama se está mirando de pie. Por omisión NO, así que
   ninguna de las llamadas de antes cambia — incluida la del previsualizador
   del plan (js/10d-plan.js), que dibuja un mapa diminuto dentro de un bloque
   ancho y ahí ponerlo de pie no tendría sentido. */
function branchLayout(nodes, gir) {
  const inBranch = new Set(nodes.map(n => n.id));
  const childrenOf = {};
  const padresDe = {};
  nodes.forEach(n => {
    // Solo cuentan los requisitos de esta misma rama: los de fuera no se
    // pueden colocar aquí, y su marca la pone el dibujo (ver R16).
    padresDe[n.id] = requisitosDe(n).filter(id => inBranch.has(id));
    padresDe[n.id].forEach(pid => {
      (childrenOf[pid] = childrenOf[pid] || []).push(n);
    });
  });

  const depth = {};
  const order = [];
  const pendientes = new Set(nodes.map(n => n.id));
  let guard = nodes.length + 5;
  while (pendientes.size && guard-- > 0) {
    let movio = false;
    for (const n of nodes) {
      if (!pendientes.has(n.id)) continue;
      const padres = padresDe[n.id];
      if (padres.some(pid => pendientes.has(pid))) continue;   // aún falta un padre
      depth[n.id] = padres.length ? Math.max(...padres.map(pid => depth[pid])) + 1 : 0;
      order.push(n);
      pendientes.delete(n.id);
      movio = true;
    }
    if (!movio) break;      // dato imposible: se colocan al principio
  }
  nodes.forEach(n => { if (!(n.id in depth)) { depth[n.id] = 0; order.push(n); } });

  const levels = [];
  order.forEach(n => { (levels[depth[n.id]] = levels[depth[n.id]] || []).push(n); });
  for (let i = 0; i < levels.length; i++) if (!levels[i]) levels[i] = [];

  // En pantalla grande los nodos se separan más: hay espacio de sobra
  const wide = isDesktop();
  const X0 = wide ? 110 : 92, XS = wide ? 215 : 168,
        YS = wide ? 152 : 126, PADY = wide ? 96 : 78;
  const maxCount = Math.max(1, ...levels.map(l => l.length));
  const autoH = PADY * 2 + (maxCount - 1) * YS;
  const pos = {};
  levels.forEach((lv, d) => {
    lv.forEach((n, i) => {
      const spread = (lv.length - 1) * YS;
      // Posición guardada por el usuario si existe; si no, la automática
      pos[n.id] = (typeof n.x === "number" && typeof n.y === "number")
        ? { x: n.x, y: n.y }
        : { x: X0 + d * XS, y: autoH / 2 - spread / 2 + i * YS };
    });
  });

  /* Y se guarda dónde quedó cada uno. Lo usa el imán de alinear, que necesita
     las posiciones REALES: un nodo solo tiene `x` e `y` propias si alguien lo
     movió a mano, y los demás los coloca el acomodo automático de aquí arriba.
     Sin esto, arrastrar un nodo solo se alineaba con otros ya movidos. */
  posLienzo = pos;

  /* ---- Y aquí entra el giro, en un solo sitio ----
     `pos` se queda SIEMPRE en coordenadas guardadas y `dib` es donde cae cada
     nodo en el dibujo. Son dos mapas y no uno a propósito: quien congela un
     sitio en los datos (`fijarPosiciones`) y quien alinea con la regla
     (`imantarNodo`, que compara contra `posLienzo` y contra `n.x`) trabajan en
     coordenadas guardadas, y darles las giradas les habría metido el giro en
     los datos. Sin girar, los dos mapas son el MISMO objeto y no cuesta nada. */
  const dib = gir ? {} : pos;
  if (gir) order.forEach(n => { dib[n.id] = alDibujo(pos[n.id].x, pos[n.id].y, true); });

  // El lienzo se ajusta a lo que ocupen los nodos (incluidos los movidos a mano)
  const xs = order.map(n => dib[n.id].x);
  const ys = order.map(n => dib[n.id].y);
  const W = Math.max(340, Math.max(...xs) + X0);
  const H = Math.max(200, Math.max(...ys) + PADY);
  /* Y también hacia atrás: desde que se puede colocar un nodo antes del cero
     —para intercalar un paso previo sin tener que empujar la rama entera—,
     el borde izquierdo y el de arriba ya no son siempre el cero. */
  const minX = xs.length ? Math.min(...xs) : 0;
  const minY = ys.length ? Math.min(...ys) : 0;
  return { pos, dib, order, childrenOf, padresDe, H, W, minX, minY };
}

/* Radio horizontal de cada figura: de ahí salen y entran las conexiones.
   El rombo mide más en diagonal que de lado, de ahí el √2. */
function nodeRadius(p) {
  if (p.esCaja) return CAJA_W / 2;
  const t = figuraDe(p);
  return t.forma === "rombo" ? Math.round(t.radio * Math.SQRT2) : t.radio;
}

const CAJA_W = 104, CAJA_H = 52;

/* ---- Las esquinas del mapa, que también son material ----
   Los redondeos del lienzo se dibujan desde JavaScript como atributos `rx` del
   SVG, así que `--r-factor` —el interruptor grueso que endereza el 79% de las
   esquinas de la app— no llegaba hasta aquí: con Reliquia puesta, la app
   entera se cuadraba y el mapa de talentos seguía con las esquinas blandas de
   la casa. Se veía como si el mapa fuera de otra app, que es justo lo que
   Eduardo señaló del borrador.

   El valor se guarda en vez de preguntarlo por nodo: `getComputedStyle` obliga
   al navegador a recalcular estilos, y un mapa grande dibuja doscientas
   figuras. Se vuelve a preguntar cuando cambia la apariencia, que es lo único
   que puede moverlo.

   Un círculo NO pasa por aquí, y es la misma regla de `--r-redondo`: un
   círculo es redondo porque es redondo. */
let esqFactor = null, esqDe = null;
function factorEsquina() {
  const ap = document.documentElement.getAttribute("data-apariencia") || "casa";
  if (esqFactor === null || esqDe !== ap) {
    const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--r-factor"));
    esqFactor = Number.isFinite(v) && v >= 0 ? v : 1;
    esqDe = ap;
  }
  return esqFactor;
}
/* Un radio del lienzo, con el factor de la apariencia aplicado. */
function rLienzo(px) { return Math.round(px * factorEsquina() * 10) / 10; }

/* ---- El engaste: el metal en el que va montada una pieza ----
   Un mapa recoloreado sigue siendo el mismo mapa, y eso es exactamente lo que
   dijo Eduardo mirando Reliquia: «los talentos no les cambiaste el diseño, se
   ven igual que antes». Tenía razón — cambiaban los cables y los rótulos, que
   es el suelo del dibujo, y las figuras seguían siendo las mismas.

   Esto es lo que cambia la FIGURA sin cambiar la forma: un aro fino por fuera,
   separado, del material del mundo. En una vitrina es el metal que sujeta la
   pieza; la pieza sigue siendo la que era. La casa lo tiene apagado (`none`),
   así que un talento de siempre se dibuja exactamente igual que antes.

   Se lee del CSS y no se escribe aquí por lo de siempre: un mundo se declara
   entero en variables y ningún archivo de JavaScript se entera de que existe. */
let engasteDe = null, engasteCache = null;
function engasteNodo() {
  const ap = document.documentElement.getAttribute("data-apariencia") || "casa";
  if (engasteCache === null || engasteDe !== ap) {
    const cs = getComputedStyle(document.documentElement);
    const col = (cs.getPropertyValue("--nodo-engaste") || "").trim();
    const sep = parseFloat(cs.getPropertyValue("--nodo-engaste-sep")) || 4.5;
    engasteCache = (!col || col === "none") ? null : { col, sep };
    engasteDe = ap;
  }
  return engasteCache;
}

function nodeShape(p, x, y, conf, fid, crecer) {
  const c = crecer || 0;
  const gw = conf.ancho || 2;
  const common = `fill="${conf.fill}" stroke="${conf.stroke}" stroke-width="${gw}"${conf.sop ? ` stroke-opacity="${conf.sop}"` : ""}${conf.glow ? ` filter="url(#${fid})"` : ""}`;
  /* La caja no es una figura más del juego: es un contenedor, y por eso es
     un rectángulo de borde punteado. Que no se parezca a ningún tipo de
     talento es justo lo que la hace legible de un vistazo. */
  if (p.esCaja) {
    return `<rect x="${x - CAJA_W / 2 - c}" y="${y - CAJA_H / 2 - c}" width="${CAJA_W + c * 2}" height="${CAJA_H + c * 2}" rx="${rLienzo(11) + c}" stroke-dasharray="6 4" ${common}/>`;
  }
  const t = figuraDe(p);
  /* El encargo: un rectangulo ancho de esquinas suaves. No se parece a
     ninguna figura de Talentos, y esa es toda su gracia — con los dos mapas
     hechos de rombos y hexagonos nadie sabria en cual esta. */
  if (t.forma === "encargo") {
    return `<rect x="${x - t.ancho / 2 - c}" y="${y - t.alto / 2 - c}" width="${t.ancho + c * 2}" height="${t.alto + c * 2}" rx="${rLienzo(13) + c}" ${common}/>`;
  }
  if (t.forma === "circulo") {
    return `<circle cx="${x}" cy="${y}" r="${t.radio + c}" ${common}/>`;
  }
  if (t.forma === "hexagono") {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 6 + i * Math.PI / 3;
      const r = t.radio + c;
      pts.push((x + r * Math.cos(a)).toFixed(1) + "," + (y + r * Math.sin(a)).toFixed(1));
    }
    return `<polygon points="${pts.join(" ")}" stroke-linejoin="round" ${common}/>`;
  }
  return `<rect x="${x - t.radio - c}" y="${y - t.radio - c}" width="${t.radio * 2 + c * 2}" height="${t.radio * 2 + c * 2}" rx="${rLienzo(9) + c}" transform="rotate(45 ${x} ${y})" ${common}/>`;
}

/* ---- Los ocho rumbos de un talento (el asterisco) ----
   Cada brazo no es solo una dirección: tiene un papel, y ese papel es lo que
   mantiene legible el árbol por más que muevas los nodos a mano.

     · adelante (E, NE, SE)  el camino sigue por ahí
     · paralelo (N, S)       una vía que avanza al lado del tronco
     · atrás    (O, NO, SO)  por ahí se recibe lo que viene de antes

   De ahí la gramática: un talento normal SIEMPRE sale por delante o en
   paralelo, y SIEMPRE recibe por detrás. Así "hacia la derecha" nunca deja
   de significar "lo que falta por hacer", aunque acomodes la rama en
   diagonal: si colocas un hijo a la izquierda, el trazo sale por arriba y
   entra por la espalda del hijo, y el rodeo se lee como lo que es —un paso
   que va contracorriente— en vez de disfrazarse de avance. */
const DIAG = Math.SQRT1_2;
const DIRS = {
  e:  [1, 0],     ne: [DIAG, -DIAG],  se: [DIAG, DIAG],
  n:  [0, -1],    s:  [0, 1],
  w:  [-1, 0],    nw: [-DIAG, -DIAG], sw: [-DIAG, DIAG]
};
/* El orden importa: ante un empate gana el primero, y preferimos el brazo
   recto antes que la diagonal. */
const SALIDAS = ["e", "ne", "se", "n", "s"];
const ENTRADAS = ["w", "nw", "sw"];
const TODOS_LOS_RUMBOS = ["e", "w", "n", "s", "ne", "se", "nw", "sw"];

/* El hito es pequeño: no es un paso del camino, es una condición
   que otro paso exige. Por eso se salta la gramática de arriba y usa los
   ocho brazos tanto para salir como para entrar — una llave puede colgar de
   cualquier vecino y abrirle la puerta a cualquier otro, sin que eso
   signifique que el recorrido retrocede. */
/* El hito es el nodo pequeño y suele colgar a un lado del tronco, así que
   se le permiten los ocho rumbos; los demás respetan la gramática de salir
   por delante y entrar por detrás. */
/* Con la rama de pie la gramática gira con ella: se sale por el norte y se
   entra por el sur. El orden de la lista se conserva al girarla, y eso
   importa — ante un empate gana el primero, y se prefiere el brazo recto. */
function rumbosDe(p, saliendo, gir) {
  const base = p.esCaja || figuraDe(p).forma !== "circulo"
    ? (saliendo ? SALIDAS : ENTRADAS)
    // Al nodo pequeno se le permiten los ocho rumbos porque suele colgar a un
    // lado del tronco. Es cosa de su tamano, no de que tipo sea.
    : TODOS_LOS_RUMBOS;
  return gir ? base.map(r => GIRO_RUMBO[r]) : base;
}

function elegirRumbo(candidatos, dx, dy) {
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  let mejor = candidatos[0], mejorDot = -Infinity;
  for (const k of candidatos) {
    const dot = ux * DIRS[k][0] + uy * DIRS[k][1];
    if (dot > mejorDot + 1e-9) { mejorDot = dot; mejor = k; }
  }
  return mejor;
}

/* Distancia del centro al borde según el rumbo. Hace falta porque las
   figuras no son redondas: el rombo llega mucho más lejos por sus puntas
   (los ejes) que por sus lados (las diagonales), y el hexágono al revés.
   Sin esto, un trazo diagonal nacería flotando fuera del talento o metido
   dentro de él. Fórmula estándar del radio de un polígono regular. */
function radioPoligono(R, lados, giro, th) {
  const seg = 2 * Math.PI / lados;
  let a = (th - giro) % seg;
  if (a < 0) a += seg;
  return R * Math.cos(Math.PI / lados) / Math.cos(a - Math.PI / lados);
}

function radioEnRumbo(p, rumbo) {
  const [vx, vy] = DIRS[rumbo];
  const th = Math.atan2(vy, vx);
  if (p.esCaja) {
    // Rectángulo: el radio en cada rumbo es el de su lado más cercano
    const c = Math.abs(Math.cos(th)), sn = Math.abs(Math.sin(th));
    return Math.min(c ? (CAJA_W / 2) / c : 1e9, sn ? (CAJA_H / 2) / sn : 1e9);
  }
  const t = figuraDe(p);
  if (t.forma === "circulo") return t.radio;
  if (t.forma === "encargo") {
    // Rectangulo: la misma cuenta que la caja, con la medida del encargo
    const c = Math.abs(Math.cos(th)), sn = Math.abs(Math.sin(th));
    return Math.min(c ? (t.ancho / 2) / c : 1e9, sn ? (t.alto / 2) / sn : 1e9);
  }
  if (t.forma === "hexagono") return radioPoligono(t.radio, 6, Math.PI / 6, th);
  return radioPoligono(t.radio * Math.SQRT2, 4, 0, th);
}

function anclaEn(nodo, p, rumbo) {
  const [vx, vy] = DIRS[rumbo];
  const r = radioEnRumbo(p, rumbo);
  return { x: nodo.x + vx * r, y: nodo.y + vy * r, rumbo };
}

/* Curva entre dos nodos, como en un editor de nodos: el tirante de cada
   extremo sigue el brazo por el que ese nodo sale o entra, así el trazo
   nunca cruza por encima de las figuras. */
function edgePath(a, b, pa, pb, gir) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const salida = elegirRumbo(rumbosDe(pa, true, gir), dx, dy);
  const entrada = elegirRumbo(rumbosDe(pb, false, gir), -dx, -dy);
  const p1 = anclaEn(a, pa, salida);
  const p2 = anclaEn(b, pb, entrada);
  const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  let pull = Math.max(46, Math.min(150, dist * 0.55));
  const [v1x, v1y] = DIRS[salida];
  const [v2x, v2y] = DIRS[entrada];
  // Si el punto de llegada queda "detrás" del tirante de salida (un enlace
  // que se dobla sobre sí mismo), se estira más para no pellizcar la curva.
  if ((p2.x - p1.x) * v1x + (p2.y - p1.y) * v1y < 0) pull += Math.min(110, dist * 0.4);
  const c1x = p1.x + v1x * pull, c1y = p1.y + v1y * pull;
  const c2x = p2.x + v2x * pull, c2y = p2.y + v2y * pull;
  return {
    d: `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`,
    x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, salida, entrada
  };
}

/* `mod` decide de que modulo es este mapa. Va por parametro y no se adivina
   mirando los nodos porque una rama VACIA no tiene ninguno a quien
   preguntar, y una rama de Proyectos que se llame igual que una de Talentos
   habria pintado el recinto de grupo del otro modulo. Por omision, talentos:
   asi ninguna de las llamadas de antes cambia. */
function constellation(nodes, key, editing, branch, mod) {
  const gir = branch ? ramaGirada(branch, mod) : false;
  const lay = branchLayout(nodes, gir);
  const { order, childrenOf, H, W, minX, minY } = lay;
  /* De aquí para abajo se dibuja SIEMPRE en coordenadas del dibujo. El alias
     es a propósito y vale por cuarenta cambios: todo lo que ya escribía
     `pos[n.id]` —los recintos, los hilos, las figuras, los rótulos, los
     puertos, la selección— pasa a estar girado sin tocar una línea, y sin
     girar `dib` y `pos` son el mismo objeto. */
  const pos = lay.dib;
  const fid = "glow" + key;
  // `editPos` guarda posiciones DEL DIBUJO: se compara contra lo que devuelve
  // `svgPoint`, que también lo es. Ver los manejadores de edición.
  if (editing) { editPos = pos; editKey = key; }
  let edges = "";
  let nds = "";
  let ports = "";
  let recintos = "";
  let alto = 0;      // cuánto sobresale un recinto por arriba del encuadre

  /* Lo que ocupa el dibujo DE VERDAD, midiendo figura por figura. Antes la
     caja se sacaba del reparto automático (ancho = último nodo + un margen
     fijo, alto = fila más baja + otro), y esas cifras no son lo que se ve: el
     nombre cuelga por debajo, la letra Y/O sobresale por la izquierda, y el
     margen de arriba y el de abajo no coincidían. La rama salía escorada
     dentro de su tarjeta aunque cupiera de sobra. */
  const caja = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  const abarcar = (x0, y0, x1, y1) => {
    if (x0 < caja.x0) caja.x0 = x0;
    if (y0 < caja.y0) caja.y0 = y0;
    if (x1 > caja.x1) caja.x1 = x1;
    if (y1 > caja.y1) caja.y1 = y1;
  };

  /* ---- El grupo desplegado ----
     Una caja abierta no desaparece: sus talentos vuelven al mapa pero siguen
     siendo un grupo, y aquí se dibuja el recinto que los rodea con su nombre
     en el borde. Sin esto, abrir una caja era perderla —no quedaba ni rastro
     de qué había ido junto ni forma de volver a cerrarla desde el mapa. */
  /* Los recintos de grupo son del atico de Talentos. En Proyectos el pasado
     se guarda con el estado del encargo, no empaquetandolo. */
  ((branch && mod !== "proyectos") ? gruposAbiertos(branch) : []).forEach(c => {
    const pts = c.perkIds.map(id => pos[id]).filter(Boolean);
    if (!pts.length) return;
    const M = 40;
    const x0 = Math.min(...pts.map(p => p.x)) - M, x1 = Math.max(...pts.map(p => p.x)) + M;
    const y0 = Math.min(...pts.map(p => p.y)) - M, y1 = Math.max(...pts.map(p => p.y)) + M;
    const { hechos, pendientes } = resumenCaja(c);
    const cc = c.color || (pendientes === 0 ? "#5fe0b0" : "#f5d76e");
    /* El crudo se guarda porque velo() y tinta() necesitan el color TAL
       COMO esta en los datos para buscarlo en la lista de ocho; lo que se
       dibuja sale siempre de uno de los dos. */
    const ccT = tinta(cc);      // la etiqueta, que es texto
    const ccZ = trazo(cc);      // el borde punteado, que es dibujo
    alto = Math.max(alto, 18 - (y0 - 11));   // la etiqueta no puede quedar cortada
    abarcar(x0, y0 - 11, x1, y1);
    recintos += `<g class="grupo">
      <rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="${rLienzo(22)}"
        fill="${velo(cc, "0a")}" stroke="${ccZ}" stroke-opacity="0.35" stroke-width="1.6" stroke-dasharray="9 7" pointer-events="none"/>
      <g class="grupo-tag" data-grupo="${c.id}">
        <rect x="${x0 + 12}" y="${y0 - 11}" width="${Math.max(96, nombreCaja(c).length * 6.6 + 30)}" height="22" rx="${rLienzo(11)}"
          fill="var(--lienzo-caja)" stroke="${ccZ}" stroke-opacity="0.5" stroke-width="1.4"/>
        <text x="${x0 + 24}" y="${y0 + 4}" font-size="10.5" font-weight="700" fill="${ccT}">${
          escapeHtml(nombreCaja(c))} · ${hechos}/${c.perkIds.length}</text>
      </g>
    </g>`;
  });

  /* Los dos círculos de un nodo (R15), y el de la izquierda además es un
     interruptor. Vive en una función porque las cajas del ático también los
     llevan desde que se pueden conectar, y antes solo los tenían los
     talentos. */
  /* `colL` llega YA pasado por `trazo()`: es color de LÍNEA, y el puerto es
     un aro de 2 px con una flecha diminuta dentro. Se recibe hecho y no se
     calcula aquí porque los dos que llaman ya lo tenían calculado, y volver a
     hundir un color hundido daría un tono distinto en cada sitio.

     El nombre importa: el parámetro se llamaba `col` y las dos líneas de
     abajo usaban `colT`, que no existe en este ámbito —vive dentro del
     dibujado de un nodo, cien líneas más abajo—. Nadie lo vio porque solo se
     ejecuta con el mapa EN EDICIÓN: al entrar a editar una rama, el dibujado
     reventaba con «colT is not defined» a medio SVG, y con él se caía el
     resto de la pantalla de Talentos. Se cazó midiendo, no mirando. */
  /* ---- Por dónde cuelgan los discos ----
     Estaban clavados a la izquierda y a la derecha, que es lo mismo que decir
     "por donde se recibe" y "por donde se avanza" mientras la rama es
     horizontal. De pie ya no lo es: se piden por RUMBO y se van solos arriba
     y abajo. Y el radio se pide en ese mismo rumbo, no el horizontal, porque
     la figura no gira: una caja mide 104 de ancho y 52 de alto siempre. */
  /* `R` es el radio horizontal que ya se venía usando y se respeta TAL CUAL
     sin girar: `nodeRadius` redondea y `radioEnRumbo` no, así que cambiar de
     uno a otro movía los discos medio píxel en el rombo y tres y medio en el
     hexágono. Eso es tocar el dibujo de todo el mundo para arreglar el de
     quien gire la rama, y lo cazó la huella del lienzo. Girada sí se pide por
     rumbo, porque el radio de arriba no es el de los lados. */
  const ladoDelPuerto = (n, x, y, base, sep, R) => {
    const r = rumboGirado(base, gir);
    const [ux, uy] = DIRS[r];
    const d = (gir ? radioEnRumbo(n, r) : R) + sep;
    return { x: x + ux * d, y: y + uy * d, ux, uy, rumbo: r };
  };

  const puertos = (n, x, y, R, colL) => {
    let out = "";
    const reqs = requisitosDe(n);
    /* Solo con DOS o más. Con uno, el hilo que llega ya lo cuenta todo y el
       círculo era una bolita repetida en cada nodo; peor aún, invitaba a
       cambiar una regla que con un requisito no cambia nada. */
    if (reqs.length > 1) {
      const modo = modoDe(n);
      const letra = modo === "cualquiera" ? "O" : "Y";
      const listo = requisitosCumplidos(n);
      const cE = tinta(listo ? (n.color || "#5fe0b0") : "var(--lienzo-apagado)");
      const cumplidos = requisitosVivos(n).filter(r => nodoHecho(r, esNodoDeProyecto(n))).length;
      const P = ladoDelPuerto(n, x, y, "w", 12, R);
      out += `<g class="port-in switch" data-modo="${n.id}">
        <title>${modo === "cualquiera"
          ? `Basta con completar CUALQUIERA de los ${reqs.length} requisitos. Toca para exigirlos todos.`
          : `Hacen falta LOS ${reqs.length} requisitos. Toca para que baste con cualquiera.`}</title>
        <circle class="halo" cx="${P.x}" cy="${P.y}" r="15" fill="transparent"/>
        <circle cx="${P.x}" cy="${P.y}" r="10" fill="var(--lienzo-ficha)" stroke="${cE}" stroke-width="2"${
          modo === "cualquiera" ? ` stroke-dasharray="3.4 2.6"` : ""}/>
        <text x="${P.x}" y="${P.y + 3.6}" text-anchor="middle" font-size="10" font-weight="800" fill="${cE}">${letra}</text>
      </g>`;
      if (!listo) {
        /* La cuenta, siempre debajo del disco. De pie el disco ya está debajo
           del nodo, así que "debajo del disco" sigue siendo hacia fuera y no
           hay que cambiar nada. */
        out += `<text x="${P.x}" y="${P.y + 23}" text-anchor="middle" font-size="8.5" fill="var(--faint)" pointer-events="none">${cumplidos}/${reqs.length}</text>`;
      }
    }

    /* ---- Requisitos de otra rama (R16) ----
       Bloqueaban sin dibujar nada: el nodo aparecía suelto y apagado sin
       causa visible, y solo su ficha contaba la verdad. Aquí no se puede
       trazar la línea entera —el otro talento está en otro lienzo—, así que
       se dibuja el cabo por donde entra y de dónde viene.

       Este SÍ se dibuja siempre, aunque sea un solo requisito y no estemos
       editando: es la única señal de una dependencia que no se ve. */
    const fuera = requisitosVivos(n).filter(r => (r.branch || "General") !== (n.branch || "General"));
    if (fuera.length) {
      const cF = tinta(fuera.every(r => nodoHecho(r, esNodoDeProyecto(n))) ? (n.color || "#5fe0b0") : "var(--lienzo-apagado)");
      /* El cabo sale por donde se recibe. El rótulo se queda DERECHO y colgado
         del extremo: es texto, y el texto no gira. Sin girar se escribe
         exactamente igual que siempre —con la `H` y todo— para que la huella
         del lienzo no se mueva. */
      if (!gir) {
        const x0 = x - R - 21, x1 = x0 - 26;
        out += `<path d="M${x1} ${y} H${x0}" stroke="${cF}" stroke-width="2" stroke-dasharray="4 4" fill="none" stroke-linecap="round"/>
        <circle cx="${x1}" cy="${y}" r="3" fill="${cF}"/>
        <text x="${x1 - 5}" y="${y + 3.4}" text-anchor="end" font-size="8.5" fill="var(--faint)">${
          escapeHtml(fuera.length === 1 ? (fuera[0].branch || "General") : fuera.length + " ramas")}</text>`;
      } else {
        const A = ladoDelPuerto(n, x, y, "w", 21, R);
        const B = ladoDelPuerto(n, x, y, "w", 47, R);
        out += `<path d="M${B.x.toFixed(1)} ${B.y.toFixed(1)} L${A.x.toFixed(1)} ${A.y.toFixed(1)}" stroke="${cF}" stroke-width="2" stroke-dasharray="4 4" fill="none" stroke-linecap="round"/>
        <circle cx="${B.x.toFixed(1)}" cy="${B.y.toFixed(1)}" r="3" fill="${cF}"/>
        <text x="${B.x.toFixed(1)}" y="${(B.y + A.uy * 11 + 3.4).toFixed(1)}" text-anchor="middle" font-size="8.5" fill="var(--faint)">${
          escapeHtml(fuera.length === 1 ? (fuera[0].branch || "General") : fuera.length + " ramas")}</text>`;
      }
    }

    if (editing) {
      /* El punto ▸ sale por donde avanza el camino, y la punta mira hacia
         allí: de pie tiene que apuntar arriba, no a la derecha. */
      if (!gir) {
        out += `<g class="port" data-from="${n.id}">
        <circle cx="${x + R + 11}" cy="${y}" r="9" fill="var(--lienzo-ficha)" stroke="${colL}" stroke-width="2"/>
        <path d="M${x + R + 8} ${y - 3.5} L${x + R + 14} ${y} L${x + R + 8} ${y + 3.5} Z" fill="${colL}"/>
      </g>`;
      } else {
        const S = ladoDelPuerto(n, x, y, "e", 11, R);
        const ang = Math.atan2(S.uy, S.ux) * 180 / Math.PI;
        out += `<g class="port" data-from="${n.id}" transform="rotate(${ang.toFixed(1)} ${S.x.toFixed(1)} ${S.y.toFixed(1)})">
        <circle cx="${S.x.toFixed(1)}" cy="${S.y.toFixed(1)}" r="9" fill="var(--lienzo-ficha)" stroke="${colL}" stroke-width="2"/>
        <path d="M${(S.x - 3).toFixed(1)} ${(S.y - 3.5).toFixed(1)} L${(S.x + 3).toFixed(1)} ${S.y.toFixed(1)} L${(S.x - 3).toFixed(1)} ${(S.y + 3.5).toFixed(1)} Z" fill="${colL}"/>
      </g>`;
      }
    }
    return out;
  };

  /* ================= Dónde cabe el nombre =================
     Horizontal el nombre va debajo y ahí el hueco es suyo: los hermanos están
     arriba y abajo, y lo que cuelga del nodo está a los lados. De pie se da la
     vuelta —los hermanos quedan hombro con hombro— y el nombre a la derecha se
     metía dentro del talento de al lado. Lo paró Eduardo viéndolo.

     El orden es derecha → izquierda → abajo. La derecha primero porque leemos
     hacia allá y el nombre pegado al costado se lee de corrido; abajo es el
     último recurso porque debajo es por donde ENTRA el camino, y ahí vive el
     círculo Y/O, que se ve siempre y no solo editando.

     Se comprueba contra los otros talentos Y contra los nombres ya colocados:
     sin lo segundo, dos hermanos mandan su nombre al mismo hueco. */
  /* Cada estorbo lleva de quién es, y eso NO es un adorno: el nombre se
     separa diez píxeles de su propio talento, así que en cuanto se pide un
     margen mayor que diez, la figura bloquea a su propio nombre y no lo deja
     ni a la derecha ni a la izquierda. Solo sobrevivía "abajo", y de ahí ya no
     salía nunca. Se veía como que el texto se quedaba pegado a un lado para
     siempre; lo cazó Eduardo alejando el talento de al lado y viendo que no
     volvía. Un talento nunca se estorba a sí mismo. */
  const estorbos = gir ? order.map(n => {
    const p = pos[n.id];
    const rw = n.esCaja ? CAJA_W / 2 : radioEnRumbo(n, "w");
    const rh = n.esCaja ? CAJA_H / 2 : radioEnRumbo(n, "n");
    return { id: n.id, x0: p.x - rw, x1: p.x + rw, y0: p.y - rh, y1: p.y + rh };
  }) : null;

  const cajaRotulo = (s, ancho, lineas, fs) => {
    const x0 = s.ancla === "start" ? s.anclaX : s.ancla === "end" ? s.anclaX - ancho : s.anclaX - ancho / 2;
    return { x0, x1: x0 + ancho, y0: s.base - fs, y1: s.base + (lineas - 1) * 12 + 3 };
  };

  const sitioDelRotulo = (n, x, y, lines, fs, esChico) => {
    /* Sin girar, exactamente lo de siempre: 32 y 44 desde el CENTRO. */
    const abajoDeSiempre = { lado: "abajo", ancla: "middle", anclaX: x, base: y + (esChico ? 32 : 44) };
    const ancho = anchoDelRotulo(lines, fs);
    if (!gir) {
      abajoDeSiempre.caja = cajaRotulo(abajoDeSiempre, ancho, lines.length, fs);
      return abajoDeSiempre;
    }

    const rE = n.esCaja ? CAJA_W / 2 : radioEnRumbo(n, "e");
    const rW = n.esCaja ? CAJA_W / 2 : radioEnRumbo(n, "w");
    const rS = n.esCaja ? CAJA_H / 2 : radioEnRumbo(n, "s");
    const medio = (lines.length - 1) * 6;

    /* Cuando acaba abajo, el hueco NO siempre mide lo mismo. El círculo Y/O
       solo existe con más de un requisito; reservarle sitio al que no lo tiene
       deja el nombre flotando lejos por nada. Y sin disco baja EXACTAMENTE lo
       que baja en horizontal —desde el centro, no desde el borde—: apartarlo
       por el borde lo mandaba al doble de distancia y se veía despegado del
       talento. Lo pidió Eduardo mirándolo. */
    const baseAbajo = requisitosDe(n).length > 1
      ? y + rS + 52
      : y + (esChico ? 32 : 44);

    const opciones = [
      { lado: "derecha",   ancla: "start",  anclaX: x + rE + 10, base: y - medio + 3.5 },
      { lado: "izquierda", ancla: "end",    anclaX: x - rW - 10, base: y - medio + 3.5 },
      { lado: "abajo",     ancla: "middle", anclaX: x,           base: baseAbajo }
    ];
    opciones.forEach(o => { o.caja = cajaRotulo(o, ancho, lines.length, fs); });

    /* ---- Y AQUÍ ESTÁ LO QUE IMPEDÍA QUE EL TALENTO BAILARA ----
       Lo que se le da al encuadre no es la caja del lado ELEGIDO, sino la de
       los tres juntos: así el sitio que ocupa este talento no depende de a qué
       lado acabó su nombre. Parece un desperdicio de dos dedos de lienzo y es
       lo que corta un bucle de verdad:

         el nombre cambia de lado → cambia la caja del dibujo → cambia el
         `viewBox` → `svgPt` traduce el mismo punto de la pantalla a OTRA
         coordenada → el talento que estás arrastrando se mueve solo → se
         vuelve a decidir el lado → y otra vez, sin parar.

       Se veía como que el talento pegaba tirones al pasar el texto de un lado
       a otro. Lo cazó Eduardo arrastrando al milímetro. Con la envoltura, el
       cambio de lado es SOLO del texto: el dibujo no se mueve ni un píxel. */
    const envoltura = opciones.reduce((a, o) => ({
      x0: Math.min(a.x0, o.caja.x0), x1: Math.max(a.x1, o.caja.x1),
      y0: Math.min(a.y0, o.caja.y0), y1: Math.max(a.y1, o.caja.y1)
    }), { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity });

    /* ---- Se prueban SIEMPRE en el orden natural, y la memoria solo pone un
            escalón ----
       La primera versión probaba primero el lado que ya tenía, y eso hacía lo
       contrario de lo que se quería: un nombre que se había ido a la izquierda
       se quedaba ahí para siempre, aunque la derecha volviera a estar libre,
       porque la izquierda seguía cabiendo. Había que arrimarle otro talento
       para que volviera. Lo cazó Eduardo.

       Ahora el orden es siempre derecha → izquierda → abajo, y la memoria solo
       decide CUÁNTO hueco hace falta: quedarse donde está pide el margen
       normal, y mudarse a otro sitio pide el margen normal más un escalón. De
       ahí sale una banda muerta —entre 7 y 17— que es lo que impide el
       temblor: se va de la derecha cuando de verdad ya no cabe, y vuelve
       cuando hay hueco de sobra, no en el mismo píxel donde se fue.

       Sin memoria todavía —la primera vez que se dibuja— no hay escalón: el
       escalón es para no cambiar de idea, y ahí no hay idea que cambiar. */
    const previo = ladoPrevio[n.id];
    const AIRE = 7, ESCALON = 10;

    for (const o of opciones) {
      const margen = (!previo || previo === o.lado) ? AIRE : AIRE + ESCALON;
      if (!estorbos.some(e => e.id !== n.id && chocanCajas(o.caja, e, margen))) {
        estorbos.push(o.caja);
        ladoPrevio[n.id] = o.lado;
        o.envoltura = envoltura;
        return o;
      }
    }
    /* Ni a los lados ni debajo. Se queda abajo igual: es el mal menor —debajo
       se pisa con un hilo, a los lados se pisa con un talento— y es el único
       sitio que no depende de que quepa nada. */
    estorbos.push(opciones[2].caja);
    ladoPrevio[n.id] = "abajo";
    opciones[2].envoltura = envoltura;
    return opciones[2];
  };

  /* ---- Lo que está elegido ----
     Un aro celeste punteado alrededor, del mismo color que la banda con la
     que se eligen: quien acaba de arrastrar el recuadro reconoce lo que
     quedó dentro sin tener que preguntárselo. Solo en edición, que es donde
     la selección significa algo. */
  if ((editing || modoElegir) && selNodos.size) {
    order.forEach(n => {
      if (!selNodos.has(n.id)) return;
      const { x, y } = pos[n.id];
      const rw = nodeRadius(n) + 13;
      const rh = (n.esCaja ? CAJA_H / 2 : nodeRadius(n)) + 13;
      nds += `<rect class="sel-marca" x="${x - rw}" y="${y - rh}" width="${rw * 2}" height="${rh * 2}"
        rx="${rLienzo(15)}" fill="none" stroke="var(--celeste)" stroke-width="2" stroke-dasharray="6 5" pointer-events="none"/>`;
    });
  }

  order.forEach(n => {
    (childrenOf[n.id] || []).forEach(c => {
      const a = pos[n.id], b = pos[c.id];
      /* Una caja no tiene estado propio: cuenta como hecha si todo lo que
         guarda está hecho, para que el hilo que llega a ella se lea igual
         que el que llegaría a los talentos que representa. */
      const cst = c.esCaja ? (c.todoHecho ? "completed" : "available") : estadoDeNodo(c);
      const done = c.esCaja ? c.todoHecho : nodoHecho(c, esNodoDeProyecto(c));
      const inProgress = !c.esCaja && (cst === "active" || cst === "due");
      const lit = done || inProgress;
      const col = trazo(done ? (c.color || "#5fe0b0") : (inProgress ? "var(--fire)" : "var(--lienzo-hilo)"));
      const P = edgePath(a, b, n, c, gir);
      const wdt = lit ? 3 : 2;
      // Sin filtro SVG: un trazo perfectamente horizontal tiene caja de altura
      // cero y el desenfoque lo hacía desaparecer. El halo se pinta a mano.
      edges += `<path d="${P.d}" fill="none" stroke="var(--lienzo-halo)" stroke-width="${wdt + 7}" stroke-linecap="round"/>`;
      if (lit) {
        edges += `<path d="${P.d}" fill="none" stroke="${col}" stroke-width="${wdt + 5}" stroke-linecap="round" opacity="0.16"/>`;
      }
      /* Tres estados y nada más: lisa cuando ya se completó (el camino quedó
         hecho, nada sugiere que falte avanzar), punteada y animada mientras
         hay algo en curso ahora mismo, punteada gris y quieta si todavía no
         toca. Antes el estado "completo" mezclaba una línea lisa de fondo
         con guiones encima; se veía a medias, ni lisa ni punteada. */
      if (done) {
        edges += `<path d="${P.d}" fill="none" stroke="${col}" stroke-width="${wdt}" stroke-linecap="round" opacity="0.95"/>`;
      } else if (inProgress) {
        edges += `<path d="${P.d}" fill="none" stroke="${col}" stroke-width="${wdt}" stroke-linecap="round" opacity="0.4"/>`;
        edges += `<path class="edge-flow" d="${P.d}" fill="none" stroke="var(--lienzo-flujo)" stroke-width="${wdt}" stroke-linecap="round" stroke-dasharray="3 21" opacity="0.95"/>`;
      } else {
        edges += `<path d="${P.d}" fill="none" stroke="${col}" stroke-width="${wdt}" stroke-linecap="round" stroke-dasharray="6 7" opacity="0.8"/>`;
      }
      // Punta de flecha en el nodo hijo
      edges += `<circle cx="${P.x2.toFixed(1)}" cy="${P.y2.toFixed(1)}" r="${lit ? 3.6 : 2.8}" fill="${col}"${lit ? ` filter="url(#${fid})"` : ""}/>`;
      if (editing) {
        edges += `<path class="edge-hit" data-cut="${c.id}|${n.id}" d="${P.d}" fill="none" stroke="transparent" stroke-width="20"/>`;
      }
    });
  });

  order.forEach(n => {
    const { x, y } = pos[n.id];

    /* ---- La caja del ático ----
       No pasa por el resto del dibujo porque no es un talento: no tiene
       estado, ni tipo, ni icono propio. Lleva su periodo y lo que guarda
       dentro, que es toda la información que hace falta para decidir si
       merece la pena abrirla. */
    if (n.esCaja) {
      /* Sin color propio, la caja toma el acento de la APARIENCIA y no el
         verde y el amarillo de la casa escritos aquí. Encima del lienzo claro
         de Reliquia, ese amarillo de la casa daba 1,28 de contraste — el
         rótulo y el contorno de la caja no se veían, que es lo que Eduardo
         señaló como «el amarillo tiene mal contraste». El del propio mundo da
         3,84, y de noche los dos valen lo mismo que valían. */
      const cc = n.colorPropio || (n.todoHecho ? "var(--mint)" : "var(--fire)");
      const ccT = tinta(cc), ccZ = trazo(cc);   // ver la nota del recinto
      /* Dos líneas como mucho: la caja tiene una altura fija y un nombre
         largo se saldría por abajo, encima del texto que dice qué guarda.

         Y se parten por ANCHO medido, no por número de letras, que es lo
         que dejaba el rótulo colgando fuera: «EQUIPO FOTOGRÁFICO» son
         dieciocho caracteres —de los veinte que se permitían— y 119 px en
         una caja de 104. Ver `partirPorAncho`.

         El tamaño se decide aquí y no contando renglones después: un
         nombre puede caber en uno solo a 10,5 y no a 12, y preguntando
         «¿es una línea?» al final se le volvía a poner el grande y se
         salía otra vez. */
      const anchoUtil = CAJA_W - 14;
      const unaLinea = anchoDeTexto(n.name, 12, 700) <= anchoUtil;
      const tamNom = unaLinea ? 12 : 10.5;
      const nom = unaLinea ? [n.name] : partirPorAncho(n.name, anchoUtil, 2, tamNom, 700);
      nds += `<g class="cnode caja" data-id="${n.id}">
        ${nodeShape(n, x, y, { stroke: ccZ, fill: relleno(cc, "14") }, fid)}
        <text x="${x}" y="${y - (nom.length > 1 ? 9 : 4)}" text-anchor="middle" font-size="${tamNom}" font-weight="700" fill="${ccT}">
          ${nom.map((ln, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : 11}">${escapeHtml(ln)}</tspan>`).join("")}
        </text>
        <text x="${x}" y="${y + (nom.length > 1 ? 14 : 12)}" text-anchor="middle" font-size="9.5" fill="var(--muted)">${escapeHtml(n.resumen)}</text>
        <text x="${x}" y="${y + CAJA_H / 2 + 15}" text-anchor="middle" font-size="9" fill="var(--faint)">${editing ? "arrastra, conecta o clic derecho" : tx("toca para ver qué lleva")}</text>
      </g>`;
      ports += puertos(n, x, y, CAJA_W / 2, ccZ);
      abarcar(x - CAJA_W / 2 - (n.requiere.length > 1 ? 24 : 0), y - CAJA_H / 2,
              x + CAJA_W / 2 + (editing ? 22 : 0), y + CAJA_H / 2 + 20);
      return;
    }

    const st = estadoDeNodo(n);
    const col = n.color || "#5fe0b0";
    /* Tres papeles para el mismo color: el contorno y el icono se TRAZAN
       —basta con 3 sobre 1, y asi el tono se sigue reconociendo—, el relleno
       lo arma velo() con la cara del modo, y la chapa de estado va en el tono
       vivo, porque lleva tinta oscura encima y tiene que resaltar. */
    const colT = trazo(col);
    const conf = {
      completed: { stroke: colT, fill: relleno(col, "33"), glow: true, badge: "var(--mint-macizo)", mark: "check" },
      active:    { stroke: colT, fill: relleno(col, "1f"), glow: true, badge: "var(--fire-macizo)", mark: "play" },
      /* Los dos avisos salen del acento de la apariencia y no del amarillo y
         el coral de la casa escritos aquí, que es lo que había: sobre el
         lienzo claro de Reliquia el `#f5d76e` de la casa daba 1,28 —o sea,
         invisible— mientras que el aviso del propio mundo da 3,84. */
      due:       { stroke: "var(--fire)", fill: relleno("var(--fire-macizo)", "33"), glow: true, badge: "var(--fire-macizo)", mark: "alert" },
      expired:   { stroke: "var(--coral)", fill: relleno("var(--coral-macizo)", "1a"), glow: false, badge: "var(--coral-macizo)", mark: "close" },
      locked:    { stroke: "var(--lienzo-candado)", fill: "var(--lienzo-bloqueado)", glow: false },
      available: { stroke: colT, fill: relleno(col, "12"), glow: false, sop: 0.55 },
      /* Los dos que solo usa Proyectos. Van en la misma tabla para que los
         estados se lean de un vistazo y nadie invente otro color sin ver los
         que ya hay. `esperando` comparte aspecto con `available` a proposito:
         los dos significan "todavia no", y el que ademas este cerrado con
         llave lo dice el candado, no un color distinto. `paused` es gris del
         todo, porque una pausa la pediste tu y no espera a nada. */
      esperando: { stroke: colT, fill: relleno(col, "10"), glow: false, sop: 0.45 },
      paused:    { stroke: "var(--lienzo-candado)", fill: "var(--lienzo-bloqueado)", glow: false }
    }[st];
    /* El candado. En Talentos lo pone el estado "locked"; en Proyectos lo
       pone el interruptor del propio encargo, porque alli un nodo apagado
       casi siempre SI deja pasar y el candado tiene que significar que este
       en concreto no. */
    const cerrado = st === "locked" || (esNodoDeProyecto(n) && encargoBloqueado(n));
    const iname = cerrado ? "lock" : (n.icon || "star");
    const esHito = figuraDe(n).forma === "circulo";   // el nodo pequeno
    const isc = esHito ? 0.62 : 0.8;
    const markR = esHito ? { dx: 13, dy: -13 } : { dx: 21, dy: -21 };
    const R = nodeRadius(n);
    /* Cuando se enseña la cuenta de etapas debajo del nombre. En Talentos,
       solo mientras la meta esta en curso. En Proyectos tambien cuando el
       encargo espera su turno: saber cuanto lleva hecho lo que viene despues
       es justo la pregunta que uno se hace mirando el mapa. */
    const verEtapas = st === "active" || (esNodoDeProyecto(n) && st === "esperando");
    const lines = wrapName(n.name);
    const sitio = sitioDelRotulo(n, x, y, lines, esHito ? 9.5 : 10.5, esHito);
    const topY = sitio.base;

    /* Sin onclick propio: abrir la ficha lo decide el gesto (ver
       attachPanHandlers). Con el puntero capturado por el lienzo, el clic
       que sintetiza el navegador llega al lienzo y no al nodo, así que un
       onclick aquí no se disparaba nunca. */
    const eng = engasteNodo();
    nds += `<g class="cnode" data-id="${n.id}">
      ${st === "available" && !editing ? `<circle class="node-pulse" cx="${x}" cy="${y}" r="${R + 4}" fill="none" stroke="${colT}" stroke-width="2.5"/>` : ""}
      ${eng ? nodeShape(n, x, y, { fill: "none", stroke: eng.col, ancho: 1, sop: cerrado ? 0.42 : 0.9 }, fid, eng.sep) : ""}
      ${nodeShape(n, x, y, conf, fid)}
      <g transform="translate(${x - 12 * isc}, ${y - 12 * isc}) scale(${isc})"
         stroke="${cerrado ? "var(--faint)" : conf.stroke}" fill="none" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICONS[iname] || ICONS.star}</g>
      ${conf.mark ? `<g class="nod-chapa"><circle cx="${x + markR.dx}" cy="${y + markR.dy}" r="9.5" fill="${conf.badge}"/>
        <g transform="translate(${x + markR.dx - 6}, ${y + markR.dy - 6}) scale(0.5)"
           stroke="var(--sobre-macizo)" fill="none" stroke-width="${conf.mark === "play" ? 2.6 : 3}" stroke-linecap="round" stroke-linejoin="round">${ICONS[conf.mark]}</g></g>` : ""}
      <text class="nod-nombre" x="${sitio.anclaX}" y="${topY}" text-anchor="${sitio.ancla}" font-size="${esHito ? 9.5 : 10.5}" fill="var(--lienzo-rotulo)" font-weight="500">
        ${lines.map((ln, i) => `<tspan x="${sitio.anclaX}" dy="${i === 0 ? 0 : 12}">${escapeHtml(ln)}</tspan>`).join("")}
      </text>
      ${/* El avance de una meta en curso, en el propio mapa. Sin esto el
            trabajo por etapas solo existía dentro de la ficha, y el mapa
            —que es donde se decide qué tocar hoy— no decía cuál va más
            adelantada. Se dice en etapas y no en porcentaje porque es lo que
            se marca: "2/4" es accionable, "50%" es un resumen. */
        (verEtapas && (n.steps || []).length)
          ? `<text class="nod-etapas" x="${sitio.anclaX}" y="${topY + (lines.length - 1) * 12 + 13}" text-anchor="${sitio.ancla}" font-size="9" fill="var(--fire)" font-weight="700">${
              T`${n.steps.filter(s2 => s2.done).length}/${n.steps.length} etapas`}</text>`
          : ""}
    </g>`;

    /* ---- Los círculos de apoyo (R15) ----
       Por donde se recibe entra lo que hace falta —y esa letra, "Y" u "O", es
       además el interruptor de la regla—, por donde se avanza sale lo que este
       talento habilita. Ver `puertos`, arriba. */
    ports += puertos(n, x, y, R, colT);

    // Lo que ocupa este talento con todo lo que le cuelga
    const hayFueraAqui = requisitosVivos(n).some(r => (r.branch || "General") !== (n.branch || "General"));
    const cuelga = (requisitosDe(n).length > 1 ? 26 : 0) + (hayFueraAqui ? 76 : 0);
    const abajo = topY + (lines.length - 1) * 12 + ((verEtapas && (n.steps || []).length) ? 18 : 6);
    if (!gir) {
      // Palabra por palabra lo de siempre: la huella del lienzo no se mueve
      abarcar(x - R - cuelga, y - R - (conf.mark ? 12 : 0), x + R + (editing ? 22 : 0), abajo);
    } else {
      /* De pie, lo que cuelga sale por ABAJO en vez de por la izquierda. Y el
         nombre entra por su ENVOLTURA —los tres sitios posibles— y no por el
         que le tocó: así el hueco de este talento no cambia cuando el texto se
         pasa de lado, que es lo que le hacía dar tirones. Ver `sitioDelRotulo`. */
      const env = sitio.envoltura || sitio.caja;
      abarcar(
        Math.min(x - R, env.x0),
        Math.min(y - R - (conf.mark ? 12 : 0) - (editing ? 22 : 0), env.y0),
        Math.max(x + R, env.x1),
        Math.max(y + R + cuelga, abajo, env.y1));
    }
  });

  const padRight = editing ? 46 : 0;
  /* Los cabos de otra rama y sus etiquetas viven a la IZQUIERDA del nodo
     más a la izquierda, así que el encuadre tiene que empezar antes del
     cero o se cortan. Solo se ensancha cuando de verdad hay alguno. */
  const hayFuera = order.some(n => requisitosVivos(n).some(r => (r.branch || "General") !== (n.branch || "General")));
  const padLeft = hayFuera ? 108 : 0;
  const padTop = Math.max(0, Math.ceil(alto));
  /* Dónde empieza lo dibujado. Mientras nadie coloque nada antes del cero
     esto vale cero y el encuadre es el de siempre; en cuanto alguien lleva un
     talento hacia atrás, el lienzo crece por ese lado en vez de dejarlo
     fuera de cuadro. `data-ox`/`data-oy` guardan a qué altura del dibujo
     empieza el contenido, que es a donde mira la rama al abrirse. */
  const inicioX = Math.min(0, minX - X0_LIBRE);
  const inicioY = Math.min(0, minY - Y0_LIBRE);
  /* Y alrededor de todo eso, sitio libre para moverse. Va en el dibujo y no
     como relleno del contenedor a propósito: una caja no puede medir menos
     que su relleno, así que por ahí cada tarjeta de rama habría crecido
     trescientos píxeles de hueco visible. Aquí el hueco solo existe para
     quien lo recorre — el alto de la tarjeta lo fija `encuadrarLienzo` con
     `data-dh`, que es lo que mide el dibujo de verdad. */
  /* La CAJA DEL DIBUJO: dónde empieza y cuánto ocupa lo que de verdad hay
     que ver, sin contar el sitio libre de alrededor. Va estampada en el SVG
     porque quien encuadra la rama (encuadrarLienzo, focusBranchFront) trabaja
     sobre el elemento ya pintado y no tiene a mano estas cuentas. */
  /* Un respiro igual por los cuatro lados. Con la caja pegada al dibujo, lo
     que sobre o falte de sitio lo reparte el encuadre a partes iguales, y la
     rama deja de salir escorada dentro de su tarjeta. */
  const AIRE = 26;
  const hayCaja = caja.x1 > caja.x0;
  const bx0 = hayCaja ? Math.round(caja.x0 - AIRE) : inicioX - padLeft;
  const by0 = hayCaja ? Math.round(caja.y0 - AIRE) : inicioY - padTop;
  const bw = hayCaja ? Math.round(caja.x1 - caja.x0 + AIRE * 2) : W + padRight - bx0;
  const bh = hayCaja ? Math.round(caja.y1 - caja.y0 + AIRE * 2) : H + 30 - by0;
  const vbX = bx0 - LIBRE_X;
  const vbY = by0 - LIBRE_Y;
  const vbW = bw + LIBRE_X * 2;
  const vbH = bh + LIBRE_Y * 2;
  return `<svg width="${vbW}" height="${vbH}" viewBox="${vbX} ${vbY} ${vbW} ${vbH}"
    data-bx="${bx0}" data-by="${by0}" data-bw="${Math.round(bw)}" data-bh="${Math.round(bh)}"
    data-dh="${Math.round(bh)}" font-family="Outfit, sans-serif">
    <defs>
      <filter id="${fid}" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="2.6" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    ${/* El recinto del grupo va debajo de todo: es el suelo sobre el que se
          apoyan sus talentos, no una figura más que compita con ellos. */
      recintos}
    <g class="edges">${edges}</g>${nds}${ports}
    <path class="link-preview" fill="none" stroke="var(--mint)" stroke-width="2.5" stroke-dasharray="6 6" style="display:none"/>
  </svg>`;
}

/* ================= Edición del mapa: arrastrar y conectar ================= */

let editPos = {};   // id → {x, y} del último dibujo en edición
let editKey = 0;    // índice de la rama en edición (para los ids del SVG)
/* El lienzo ya no empieza en la esquina: se puede llevar un talento hacia
   atrás o hacia arriba del punto de partida. Hacía falta para lo que la gente
   intenta de verdad —intercalar un paso ANTES del primero— que hasta ahora
   obligaba a empujar la rama entera a mano. Los topes siguen existiendo, solo
   que ahora también por el otro lado: un arrastre desbocado no puede mandar
   un nodo a un sitio del que no se pueda volver. */
const CANVAS_MAX_X = 2200, CANVAS_MAX_Y = 1400;
const CANVAS_MIN_X = -1800, CANVAS_MIN_Y = -1200;
// Aire entre el borde del dibujo y el primer nodo cuando la rama crece hacia atrás
const X0_LIBRE = 110, Y0_LIBRE = 90;
/* Y el sitio por el que uno puede pasearse aunque no haya nada: un mapa que
   solo se deja recorrer hacia donde ya hay nodos se siente una lista
   disfrazada. Es lo que permite mirar —y crear— por delante, por detrás y
   por arriba de lo que ya existe. */
const LIBRE_X = 340, LIBRE_Y = 300;

function enLienzoX(v) { return clamp(Math.round(v), CANVAS_MIN_X, CANVAS_MAX_X); }
function enLienzoY(v) { return clamp(Math.round(v), CANVAS_MIN_Y, CANVAS_MAX_Y); }

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function isDesktop() { return window.matchMedia("(min-width: 900px)").matches; }

/* Lo que se DIBUJA de una rama: los talentos sueltos más las cajas
   cerradas como un nodo cada una. Los de dentro de una caja no salen: los
   representa ella. Ver vistaDeRama. */
function branchNodes(b, mod) {
  return vistaDeRamaDe(mod || "talentos", b);
}

/* Y los talentos de verdad, para contar y para las listas. */
function talentosDeRama(b) {
  return state.perks.filter(p => (p.branch || "General") === b);
}

/* Evita ciclos: ¿"ancestorId" ya cuelga de "nodeId"?
   Con un requisito único bastaba con subir la cadena hasta la raíz. Ahora
   un talento puede tener varios padres, así que hay que recorrer TODOS los
   caminos hacia arriba: basta con que uno de ellos pase por nodeId para que
   la conexión cierre un bucle. Se lleva un conjunto de visitados porque en
   un grafo el mismo antepasado puede alcanzarse por dos rutas y sin él se
   recorrería dos veces el mismo subárbol. */
function isDescendant(nodeId, ancestorId) {
  const vistos = new Set();
  const cola = [ancestorId];
  let guard = 4000;
  while (cola.length && guard-- > 0) {
    const id = cola.shift();
    if (vistos.has(id)) continue;
    vistos.add(id);
    // nodoPorId y no state.perks: una caja también encadena, aunque sea de
    // forma simbólica, y un bucle que la incluya no se puede dibujar
    const cur = nodoPorId(id);
    if (!cur) continue;
    for (const r of requisitosDe(cur)) {
      if (r === nodeId) return true;
      cola.push(r);
    }
  }
  return false;
}

/* Las dos mitades de un hilo cortado se retiran desde la tijera hacia sus
   extremos. El truco es `stroke-dashoffset`: con un guion del largo de cada
   mitad, correr el desfase hace que el trazo se salga del recorrido por el
   lado que toca, y lo que queda dentro se ve encoger justo desde el corte.
   Se usa eso en vez de animar `stroke-dasharray` porque el desfase es la
   propiedad que todos los motores animan igual desde hace años. */
function efectoCorte(branch, dAttr, cutPt, color) {
  if (!dAttr || !cutPt) return;
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  } catch (e) {}
  const wrap = constWrapFor(branch);
  const svg = wrap && wrap.querySelector("svg");
  if (!svg) return;
  const NS = "http://www.w3.org/2000/svg";

  // Se mide sobre una copia invisible: hace falta el largo real de la curva
  const medidor = document.createElementNS(NS, "path");
  medidor.setAttribute("d", dAttr);
  medidor.setAttribute("fill", "none");
  medidor.setAttribute("stroke", "none");
  svg.appendChild(medidor);
  let L = 0;
  try { L = medidor.getTotalLength(); } catch (e) { L = 0; }
  if (!L) { medidor.remove(); return; }

  // ¿A qué altura del recorrido cayó la tijera?
  let corte = L / 2, mejor = Infinity;
  for (let i = 0; i <= 80; i++) {
    const l = (i / 80) * L;
    const p = medidor.getPointAtLength(l);
    const dist = Math.hypot(p.x - cutPt.x, p.y - cutPt.y);
    if (dist < mejor) { mejor = dist; corte = l; }
  }
  const centro = medidor.getPointAtLength(corte);
  medidor.remove();

  const g = document.createElementNS(NS, "g");
  g.setAttribute("pointer-events", "none");

  const mitad = (dash, desde, hasta) => {
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", dAttr);
    p.setAttribute("fill", "none");
    p.setAttribute("stroke", color);
    p.setAttribute("stroke-width", "3");
    p.setAttribute("stroke-linecap", "round");
    p.setAttribute("stroke-dasharray", dash);
    p.style.strokeDashoffset = desde;
    g.appendChild(p);
    p.animate(
      [{ strokeDashoffset: desde, opacity: 0.95 }, { strokeDashoffset: hasta, opacity: 0 }],
      { duration: 430, easing: "cubic-bezier(.35,0,.6,1)", fill: "forwards" }
    );
  };

  mitad(`${corte} ${L}`, 0, corte);          // la de atrás se retira hacia el padre
  mitad(`${L - corte} ${L}`, -corte, -L);    // la de delante, hacia el hijo

  // Destello en el punto exacto del tijeretazo
  const chispa = document.createElementNS(NS, "circle");
  chispa.setAttribute("cx", centro.x);
  chispa.setAttribute("cy", centro.y);
  chispa.setAttribute("r", "3.5");
  chispa.setAttribute("fill", "var(--coral)");
  chispa.style.transformBox = "fill-box";
  chispa.style.transformOrigin = "center";
  g.appendChild(chispa);
  chispa.animate(
    [{ transform: "scale(0.5)", opacity: 1 }, { transform: "scale(3.6)", opacity: 0 }],
    { duration: 360, easing: "ease-out", fill: "forwards" }
  );

  svg.appendChild(g);
  setTimeout(() => g.remove(), 520);
}

/* Corta UN hilo, no todos los del hijo. Recibe "hijo|padre" porque desde
   que un talento puede tener varios requisitos, saber a quién llega la
   línea ya no dice cuál de ellas se está cortando.

   Con cajas de por medio, la línea que se ve y el dato que la sostiene ya no
   son lo mismo: un hilo dibujado hasta una caja puede estar guardado en
   cualquiera de los talentos que lleva dentro (R5). Por eso se corta contra
   TODO lo que cada extremo representa; si no, la tijera sonaba y la línea
   seguía ahí. */
function removeLink(par) {
  const [childId, parentId] = String(par).split("|");
  if (!parentId) return;
  const padres = new Set(idsRepresentados(parentId));
  const mod = modDe(nodoPorId(childId));
  const snap = snapshotPerks(mod);
  let tocado = false;
  idsRepresentados(childId).forEach(id => {
    const n = nodoPorId(id);
    if (!n) return;
    const reqs = requisitosDe(n);
    const quedan = reqs.filter(r => !padres.has(r));
    if (quedan.length !== reqs.length) { n.requiere = quedan; tocado = true; }
  });
  if (!tocado) return;
  pushUndo(tx("cortar una conexión"), snap, mod);
  save();
  repintarModulo(mod);
  toast(tx("Conexión eliminada"), "deshecho", { label: "Deshacer", onclick: "undoEditor()" });
}

/* ================= El gesto del lienzo =================
   Fuera de edición el lienzo se recorre arrastrando el fondo, y los nodos se
   acomodan arrastrándolos. Acomodar era la acción más inocente que se podía
   hacer con el mapa y exigía entrar a un modo aparte; conectar y cortar, que
   sí son destructivas, siguen ahí dentro.

   Aquí el clic ya significa algo —abrir la ficha—, así que las dos acciones
   se reparten por el gesto, no por el tiempo:

     clic seco            abre el talento (o la ventana de la caja)
     clic y arrastras     lo mueves

   Antes hacía falta MANTENER pulsado 300 ms para poder mover, y eso rompía
   las dos mitades a la vez: mover pedía esperar sin saber cuánto, y abrir
   dejaba de funcionar en cuanto la pulsación se alargaba un poco. Con el
   umbral de distancia cada gesto se declara solo por lo que hace la mano.

   Y el clic se resuelve AQUÍ, no con un onclick en el nodo: el lienzo captura
   el puntero para no perder el arrastre al salirse del dibujo, y con el
   puntero capturado el navegador entrega el clic al lienzo y no al nodo. Ese
   era el motivo de que tocar un talento no abriera nada. */

/* ---- El deslizamiento al soltar ----
   «Al soltar se desliza levemente para dar sensación de suavidad, pero poco,
   para que no se vuelva impreciso» (Eduardo, 27 ago 2026). De ahí los tres
   números: se frena rápido (0.86 por fotograma, o sea la mitad cada cinco),
   se para en cuanto baja de medio píxel, y la velocidad de salida tiene tope
   — un manotazo no puede mandar el mapa a la otra punta.

   Solo desliza el RECORRIDO del fondo. Un nodo arrastrado se queda donde lo
   soltaste: ahí el deslizamiento no sería suavidad, sería el mapa
   desobedeciendo. */
const ROCE = 0.86, PARADA = 0.5, VEL_TOPE = 2.6;

function deslizar(wrap, vx, vy) {
  if (Math.abs(vx) < PARADA && Math.abs(vy) < PARADA) return;
  let x = Math.max(-VEL_TOPE, Math.min(VEL_TOPE, vx)) * 16;
  let y = Math.max(-VEL_TOPE, Math.min(VEL_TOPE, vy)) * 16;
  const paso = () => {
    if (!wrap.isConnected) return;
    wrap.scrollLeft += x;
    wrap.scrollTop += y;
    x *= ROCE; y *= ROCE;
    if (Math.abs(x) > PARADA || Math.abs(y) > PARADA) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}

const UMBRAL_ARRASTRE = 5;    // px de pantalla que separan un clic de un arrastre
const ESPERA_TACTIL = 240;    // ms sostenidos en pantalla táctil, donde no hay ratón

function attachPanHandlers(scope) {
  (scope || document).querySelectorAll(".const-wrap:not(.editing)").forEach(wrap => {
    let from = null, gesto = null, espera = null;
    const b = wrap.dataset.branch;
    /* De que modulo es ESTE lienzo. Se lee del propio elemento y no de una
       variable global: las dos pantallas pueden tener sus mapas en el DOM a
       la vez —una escondida— y los manejadores se enganchan en las dos. Con
       una global, el ultimo mapa dibujado habria decidido a que coleccion
       escribia un arrastre hecho en el otro. */
    const mod = wrap.dataset.mod || "talentos";

    const svgPt = (e) => {
      const svg = wrap.querySelector("svg");
      const r = svg.getBoundingClientRect();
      const vb = (svg.getAttribute("viewBox") || "0 0 1 1").split(" ").map(Number);
      return {
        x: vb[0] + (e.clientX - r.left) / r.width * vb[2],
        y: vb[1] + (e.clientY - r.top) / r.height * vb[3]
      };
    };

    const cancelarEspera = () => { if (espera) { clearTimeout(espera); espera = null; } };

    // El gesto deja de ser un clic y pasa a ser un arrastre
    const arrancar = (pt) => {
      cancelarEspera();
      if (!gesto || gesto.tipo !== "nodo" || gesto.moviendo) return;
      gesto.moviendo = true;
      fijarPosiciones(b, mod);
      /* El desfase se calcula AQUÍ y no al pulsar: hasta que no se congela el
         reparto, un nodo colocado en automático no tiene coordenadas propias
         y el desfase salía cero, así que al primer movimiento la figura
         saltaba a ponerse bajo el cursor. */
      const n = nodoPorId(gesto.id);
      const p = pt || gesto.pt0;
      /* El desfase se mide en coordenadas DEL DIBUJO, que es donde está el
         dedo: `n.x` está sin girar y `p` viene girado, y restarlos a pelo
         hacía saltar el nodo al primer movimiento con la rama de pie. */
      if (n && typeof n.x === "number" && p) {
        const d = alDibujo(n.x, n.y, ramaGirada(b, mod));
        gesto.dx = d.x - p.x; gesto.dy = d.y - p.y;
      }
      pushUndo(gesto.esCaja ? tx("mover una caja") : (mod === "proyectos" ? tx("mover un encargo") : tx("mover un talento")), null, mod);
      wrap.classList.add("moviendo");
      if (userHasTapped && navigator.vibrate) navigator.vibrate(12);
    };

    wrap.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const cli = { x: e.clientX, y: e.clientY };
      const capturar = () => { try { wrap.setPointerCapture(e.pointerId); } catch (err) {} };

      // El interruptor "Y / O" manda sobre lo que haya debajo
      const sw = e.target.closest(".port-in.switch");
      if (sw) {
        gesto = { tipo: "modo", id: sw.dataset.modo, cli };
        capturar();
        e.preventDefault();
        return;
      }
      // La etiqueta de un grupo desplegado abre su ventana
      const tag = e.target.closest(".grupo-tag");
      if (tag) {
        gesto = { tipo: "grupo", id: tag.dataset.grupo, cli };
        capturar();
        e.preventDefault();
        return;
      }

      const nodo = e.target.closest(".cnode");
      if (nodo) {
        // Talento o caja: desde que la caja es un grupo, se mueve igual
        const n = nodoPorId(nodo.dataset.id);
        if (!n) return;
        const pt = svgPt(e);
        gesto = {
          tipo: "nodo", id: n.id, esCaja: !!nodo.classList.contains("caja"),
          dx: (typeof n.x === "number" ? n.x : pt.x) - pt.x,
          dy: (typeof n.y === "number" ? n.y : pt.y) - pt.y,
          pt0: pt, cli, moviendo: false, movido: false
        };
        capturar();
        /* Solo con ratón: evita que el navegador arranque una selección de
           texto sobre las etiquetas del SVG. En táctil hay que dejar pasar el
           gesto, o la página no se podría desplazar tocando un nodo. */
        if (e.pointerType === "mouse") e.preventDefault();
        else espera = setTimeout(arrancar, ESPERA_TACTIL);
        return;
      }

      if (e.pointerType !== "mouse") return;
      from = { x: e.clientX, y: e.clientY, sl: wrap.scrollLeft, st: wrap.scrollTop, movido: false };
      capturar();
      e.preventDefault();
    });

    wrap.addEventListener("pointermove", (e) => {
      if (gesto) {
        const lejos = Math.hypot(e.clientX - gesto.cli.x, e.clientY - gesto.cli.y);
        if (gesto.tipo !== "nodo") {
          // Un interruptor o una etiqueta no se arrastran: si la mano se va,
          // el gesto era otra cosa y no debe dispararse al soltar
          if (lejos > 10) gesto = null;
          return;
        }
        if (!gesto.moviendo) {
          if (e.pointerType === "mouse") {
            if (lejos > UMBRAL_ARRASTRE) arrancar(svgPt(e));
          } else if (lejos > 12) {
            /* En táctil el dedo se fue antes de la espera: era un desliz para
               recorrer la página, no un arrastre. */
            cancelarEspera();
            gesto = null;
          }
          if (!gesto || !gesto.moviendo) return;
        }
        const n = nodoPorId(gesto.id);
        if (!n) return;
        const pt = svgPt(e);
        gesto.movido = true;
        // Se arrastra en coordenadas del dibujo y se ESCRIBE desgirado
        const d = aDatos(pt.x + gesto.dx, pt.y + gesto.dy, ramaGirada(b, mod));
        n.x = enLienzoX(d.x);
        n.y = enLienzoY(d.y);
        /* Y el imán, que es lo que pidió Eduardo: si el nodo queda CERCA de
           estar alineado con otro, se alinea del todo y aparece la línea que
           lo dice. Nadie coloca dos nodos a la misma altura a ojo con el
           dedo; con seis unidades de margen sale solo. */
        const guias = imantarNodo(n, b, mod);
        redibujarLienzo(wrap, constellation(branchNodes(b, mod), 0, false, b, mod));
        pintarGuias(wrap, guias);
        e.preventDefault();
        return;
      }
      if (!from) return;
      const dx = e.clientX - from.x, dy = e.clientY - from.y;
      // La clase solo se pone al moverse de verdad: si no, un clic simple
      // cambiaría el cursor a "agarrando" por un instante sin motivo.
      if (!from.movido && Math.hypot(dx, dy) > 3) { from.movido = true; wrap.classList.add("panning"); }
      wrap.scrollLeft = from.sl - dx;
      wrap.scrollTop = from.st - dy;
      /* Cuánto se movía justo antes de soltar, para el deslizamiento. Se
         guardan los dos últimos puntos y no una media larga: lo que importa
         es el último gesto, no el recorrido entero. Un arrastre que acaba
         parado tiene que quedarse parado. */
      const ahora = performance.now();
      if (from.tPrev) {
        const dt = ahora - from.tPrev;
        if (dt > 0) { from.vx = (from.pxPrev - e.clientX) / dt; from.vy = (from.pyPrev - e.clientY) / dt; }
      }
      from.tPrev = ahora; from.pxPrev = e.clientX; from.pyPrev = e.clientY;
    });

    /* Mientras se arrastra un nodo con el dedo, la página no puede irse detrás
       del gesto. preventDefault sobre el evento de puntero no basta una vez
       que el navegador ya decidió que aquello era un desplazamiento. */
    wrap.addEventListener("touchmove", (e) => {
      if (gesto && gesto.tipo === "nodo" && gesto.moviendo) e.preventDefault();
    }, { passive: false });

    const fin = () => {
      cancelarEspera();
      const g = gesto;
      /* El deslizamiento va antes de soltar `from`, que es donde vive la
         velocidad, y solo si de verdad se estuvo recorriendo el fondo. */
      if (from && from.movido && !g) deslizar(wrap, from.vx || 0, from.vy || 0);
      gesto = null;
      from = null;
      wrap.classList.remove("panning", "moviendo");
      if (!g) return;

      if (g.tipo === "modo") { alternarModo(g.id); return; }
      if (g.tipo === "grupo") { verCaja(g.id); return; }

      if (g.moviendo) {
        /* Las reglas de alinear se van EN CUANTO se suelta. Se pintaban en
           cada movimiento y el último dibujo se quedaba puesto, porque soltar
           guarda pero no vuelve a dibujar el mapa: la regla se quedaba
           colgada hasta el siguiente repintado, y una regla que sobrevive al
           gesto ya no es una ayuda, es una raya en el mapa. */
        borrarGuias(wrap);
        if (g.movido) save();
        else undoStack.pop();       // se armó el arrastre pero no llegó a moverse
        /* Soltar no debe abrir la ficha del que acabas de agarrar: el filtro
           de clics que vive en el arranque se come el que sintetiza el
           navegador al terminar el gesto. */
        reordFin = Date.now();
        return;
      }
      /* Ni arrastre ni interruptor: fue un clic. Normalmente abre; mientras
         se está eligiendo, mete o saca de la selección — que es justo lo que
         hace falta en el teléfono, donde no hay Shift. */
      if (modoElegir) {
        alternarSeleccion(g.id, b);
        redibujarLienzo(wrap, constellation(branchNodes(b, mod), 0, false, b, mod));
        pintarBarraSeleccion(wrap);
        return;
      }
      if (g.esCaja) verCaja(g.id);
      else if (mod === "proyectos") openProject(g.id);
      else openPerk(g.id);
    };
    wrap.addEventListener("pointerup", fin);
    wrap.addEventListener("pointercancel", fin);

    if (modoElegir) pintarBarraSeleccion(wrap);
  });
}

/* El interruptor de la regla de entrada (R13). Vive en el propio mapa porque
   es donde se ve el problema: tres líneas llegando a un nodo y ninguna pista
   de si hacen falta las tres. Con dos o más requisitos, la letra del círculo
   se cambia de un toque; con uno no aparece, porque ahí "todos" y
   "cualquiera" dicen exactamente lo mismo. */
function alternarModo(id) {
  const n = nodoPorId(id);
  const dib = nodoDibujado(id);
  if (!n || !dib) return;
  /* La cuenta que vale es la del DIBUJO, no la del estado: tres requisitos
     que viven todos dentro de la misma caja llegan como una sola línea, y
     ahí la regla no tiene nada que decidir. */
  const cuenta = (dib.requiere || []).length;
  if (cuenta < 2) return;
  pushUndo(tx("cambiar la regla de entrada"), null, modDe(n));
  n.modo = modoDe(n) === "todos" ? "cualquiera" : "todos";
  save();
  repintarModulo(modDe(n));
  toast(modoDe(n) === "todos"
    ? `${dib.name}: ahora hacen falta los ${cuenta} requisitos`
    : `${dib.name}: ahora basta con cualquiera de los ${cuenta}`,
    "hecho", { label: "Deshacer", onclick: "undoEditor()" });
}

/* El nodo TAL COMO SE DIBUJA: una caja cerrada suma a sus conexiones propias
   las que heredó de lo que guarda, así que su número de requisitos no está en
   ningún sitio del estado — se calcula al dibujar. */
function nodoDeVista(b, id, mod) {
  return branchNodes(b, mod).find(n => n.id === id) || null;
}

function nodoDibujado(id) {
  const n = nodoPorId(id);
  return n ? nodoDeVista(n.branch || "General", id, modDe(n)) : null;
}

/* Clic derecho sobre cualquier lienzo: crear un talento justo ahí y llegar
   a las herramientas sin pasar por el menú de la rama. */
/* ================= Los gestos del zoom =================
   Se enganchan a TODOS los lienzos, estén en edición o no: acercar no es una
   herramienta de edición, es mirar.

     Alt + rueda    en PC, el gesto oficial. Alt y no Ctrl porque Ctrl+rueda
                    es el zoom del propio navegador y pelearía con él.
     Ctrl + rueda   también, y no es una contradicción: el pellizco de un
                    trackpad NO llega como pellizco, llega como Ctrl+rueda.
                    Atenderlo aquí hace que pellizcar en el portátil acerque
                    el mapa —lo que cualquiera esperaría— en vez de agrandar
                    la página entera.
     rueda sola     se queda como estaba: recorre el lienzo.
     dos dedos      pellizco en pantalla táctil.

   El zoom del navegador solo se anula DENTRO del mapa. Anularlo en todo el
   sitio ni se puede del todo —iOS ignora `user-scalable=no`— ni conviene:
   quien necesita agrandar la letra para leer se quedaría sin poder. */
function attachZoomHandlers(scope) {
  (scope || document).querySelectorAll(".const-wrap").forEach(wrap => {
    if (wrap.dataset.zoom) return;          // ya enganchado
    wrap.dataset.zoom = "1";
    const b = wrap.dataset.branch;

    wrap.addEventListener("wheel", (e) => {
      if (!e.altKey && !e.ctrlKey && !e.metaKey) return;   // rueda sola: recorrer
      e.preventDefault();
      /* Por pasos y no por píxeles del evento: una rueda de ratón manda
         saltos de 100 y un trackpad de 3, así que usar el número crudo hace
         que el mismo gesto acerque muchísimo en uno y nada en el otro. */
      const paso = Math.sign(e.deltaY) > 0 ? -ZOOM_PASO : ZOOM_PASO;
      zoomEn(wrap, b, zoomDe(wrap, b) + paso, e.clientX, e.clientY);
    }, { passive: false });

    /* ---- El pellizco ----
       Dos dedos: el zoom sigue a la distancia entre ellos, sin escalones, que
       es lo que pidió Eduardo — «el tacto debe seguir al dedo». El punto medio
       hace de ancla, así que el pellizco también desplaza, como en un mapa. */
    let pinza = null;
    const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const medio = (t) => ({ x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2 });

    wrap.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 2) { pinza = null; return; }
      const t = [e.touches[0], e.touches[1]];
      pinza = { d: dist(t), z: zoomDe(wrap, b) };
    }, { passive: true });

    wrap.addEventListener("touchmove", (e) => {
      if (e.touches.length !== 2 || !pinza || !pinza.d) return;
      e.preventDefault();
      const t = [e.touches[0], e.touches[1]];
      const m = medio(t);
      zoomEn(wrap, b, pinza.z * (dist(t) / pinza.d), m.x, m.y);
    }, { passive: false });

    wrap.addEventListener("touchend", () => { pinza = null; }, { passive: true });
    wrap.addEventListener("touchcancel", () => { pinza = null; }, { passive: true });
  });
}

function attachCtxHandlers(scope) {
  (scope || document).querySelectorAll(".const-wrap").forEach(wrap => {
    wrap.addEventListener("contextmenu", (e) => {
      if (!isDesktop()) return;
      e.preventDefault();
      e.stopPropagation();
      const p = puntoEnLienzo(wrap, e.clientX, e.clientY);
      const nodo = e.target.closest ? e.target.closest(".cnode") : null;
      abrirCtxMenu(e.clientX, e.clientY, wrap.dataset.branch, p, nodo && nodo.dataset.id,
                   wrap.dataset.mod || "talentos");
    });
  });
}

/* `scope` importa desde que existe el modo pantalla completa: con él abierto
   hay dos lienzos de la misma rama y sin acotar la búsqueda los gestos se
   engancharían al de la lista, que está tapado. */
/* ================= Elegir varios talentos =================
   Acomodar una rama a mano se hacía de uno en uno, y mover seis talentos era
   seis arrastres y seis oportunidades de descolocar el reparto. Con varios
   elegidos, un solo gesto los lleva a todos —y, sobre todo, se pueden meter
   de golpe en un grupo.

   Dos formas de elegir, las dos con Shift: clic a clic, o arrastrando un
   recuadro sobre el mapa. Shift y no un modo aparte porque un modo hay que
   entrar y salir de él, y esto es algo que se hace en mitad de otra cosa.

   Vive solo dentro del editor: fuera de él un clic abre la ficha, que es lo
   que la gente espera, y una selección invisible no debe cambiar eso. */
let selNodos = new Set();
let selRama = null;
/* En el teléfono no hay Shift ni recuadro que arrastrar: el dedo ya está
   ocupado moviendo nodos y recorriendo el mapa. Así que la misma selección se
   puede encender como un modo —"elegir varios"— en el que un toque elige en
   vez de abrir. Es el mismo patrón que ya usan el historial de una habilidad
   y el borrado múltiple de Habilidades, así que no hay que aprender nada
   nuevo. En la computadora sigue estando Shift, que es más rápido. */
let modoElegir = false;

function limpiarSeleccion() {
  selNodos = new Set();
  selRama = null;
}

function toggleElegirVarios(rama) {
  modoElegir = !modoElegir;
  limpiarSeleccion();
  if (modoElegir) selRama = rama;
  renderTree();
  if (fullscreenBranch) renderFullscreen();
  toast(modoElegir
    ? tx("Toca los talentos que quieras juntar")
    : tx("Listo, ya no estás eligiendo"), modoElegir ? "calma" : "hecho");
}

function alternarSeleccion(id, rama) {
  // La selección pertenece a UNA rama: elegir en otra empieza de cero
  if (selRama !== rama) { selNodos = new Set(); selRama = rama; }
  if (selNodos.has(id)) selNodos.delete(id); else selNodos.add(id);
  if (!selNodos.size) selRama = null;
}

/* La barra de acciones se mete en la línea de pistas que ya vive bajo el
   lienzo, en vez de flotar encima del mapa: ahí no tapa nada y está en el
   sitio donde ya se mira para saber qué se puede hacer. */
function pintarBarraSeleccion(wrap) {
  const caja = wrap && wrap.parentElement;
  const pista = caja && caja.querySelector(".const-hint, .fs-hint");
  if (!pista) return;
  if (!selNodos.size && !modoElegir) {
    if (pista.dataset.pistaOriginal !== undefined) {
      pista.innerHTML = pista.dataset.pistaOriginal;
      delete pista.dataset.pistaOriginal;
      pista.classList.remove("con-seleccion");
    }
    return;
  }
  if (pista.dataset.pistaOriginal === undefined) pista.dataset.pistaOriginal = pista.innerHTML;
  pista.classList.add("con-seleccion");
  const n = selNodos.size;
  /* Con el modo encendido y nada elegido todavía, la barra dice qué hacer y
     por dónde salir: un modo sin salida a la vista es una trampa. */
  pista.innerHTML = n
    ? `<b>${n} elegido${n === 1 ? "" : "s"}</b>
       <button type="button" class="btn btn-soft btn-sm" onclick="agruparElegidos()">${tx("Agruparlos")}</button>
       <button type="button" class="btn btn-ghost btn-sm" onclick="soltarSeleccion()">${modoElegir ? "Salir" : tx("Quitar la selección")}</button>`
    : `<b>${tx("Toca los talentos que quieras juntar")}</b>
       <button type="button" class="btn btn-ghost btn-sm" onclick="soltarSeleccion()">${tx("Salir")}</button>`;
}

function repintarSeleccion() {
  const sel = modoElegir ? ".const-wrap" : ".const-wrap.editing";
  document.querySelectorAll(sel).forEach(w => {
    const b = w.dataset.branch;
    const mod = w.dataset.mod || "talentos";
    const editando = w.classList.contains("editing");
    redibujarLienzo(w, constellation(branchNodes(b, mod), editando ? editKey : 0, editando, b, mod));
    pintarBarraSeleccion(w);
  });
}

function soltarSeleccion() {
  const habiaModo = modoElegir;
  modoElegir = false;
  limpiarSeleccion();
  /* Con el modo encendido, la pista de debajo la puso la barra en TODAS las
     ramas que se estén viendo; el repintado normal solo toca las que están en
     edición, así que aquí hace falta el repintado completo. */
  if (habiaModo) { renderTree(); if (fullscreenBranch) renderFullscreen(); }
  else repintarSeleccion();
}

async function agruparElegidos() {
  const rama = selRama;
  const ids = [...selNodos];
  if (!rama) return;
  /* Las cajas no se meten dentro de otra caja: un grupo de grupos no se
     puede dibujar sin que el mapa deje de leerse. Se avisa en vez de
     ignorarlo en silencio. */
  if (ids.some(id => cajaPorId(id))) {
    toast(tx("Un grupo no puede meterse dentro de otro"), "atencion");
    return;
  }
  const caja = await crearGrupoCon(ids, rama);
  if (caja) {
    // Hecho el grupo, el modo ya cumplió: se apaga solo
    modoElegir = false;
    limpiarSeleccion();
    renderTree();
    if (fullscreenBranch) renderFullscreen();
  } else repintarSeleccion();
}

function attachEditHandlers(scope) {
  const wrap = (scope || document).querySelector(".const-wrap.editing");
  if (!wrap) return;
  const b = wrap.dataset.branch;
  // Ver la nota de attachPanHandlers: el modulo se lee del elemento
  const mod = wrap.dataset.mod || "talentos";

  let mode = null, curId = null, offset = null, raf = null, panFrom = null;
  // Recuadro de selección: esquina donde empezó y posiciones de lo que se
  // arrastra en bloque cuando hay varios elegidos
  let banda = null, grupoIni = null, ptIni = null;
  // Copia del estado al empezar un gesto, para poder deshacerlo después
  let snapAntes = null;
  // Trazo y punto de la tijera, para animar el corte una vez consumado
  let cutInfo = null;
  /* Las reglas de alinear que hay que pintar en el proximo fotograma. Vive
     aqui y no dentro del manejador de movimiento porque el redibujado va
     acelerado: cuando ya hay un fotograma pedido, los movimientos siguientes
     no piden otro, y con una variable local el fotograma habria pintado las
     reglas del movimiento que lo pidio en vez de las del ultimo. */
  let guiasPend = null;

  const svgPoint = (e) => {
    const svg = wrap.querySelector("svg");
    const r = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    // Igual que puntoEnLienzo: el origen del encuadre cuenta
    return {
      x: vb.x + (e.clientX - r.left) * (vb.width / r.width),
      y: vb.y + (e.clientY - r.top) * (vb.height / r.height)
    };
  };

  const redraw = () => {
    redibujarLienzo(wrap, constellation(branchNodes(b, mod), editKey, true, b, mod));
  };

  wrap.addEventListener("pointerdown", (e) => {
    const sw = e.target.closest(".port-in.switch");
    const port = e.target.closest(".port");
    const node = e.target.closest(".cnode");
    const cut = e.target.closest(".edge-hit");

    /* Shift sobre un nodo: entra o sale de la selección y ahí acaba el gesto.
       Nada de arrastrar: quien mantiene Shift está eligiendo, no moviendo. */
    if (node && (e.shiftKey || modoElegir)) {
      alternarSeleccion(node.dataset.id, b);
      redraw();
      pintarBarraSeleccion(wrap);
      mode = null;
      e.preventDefault();
      return;
    }

    if (sw) {
      // El interruptor de la regla también funciona dentro del editor
      mode = "modo";
      curId = sw.dataset.modo;
      panFrom = { x: e.clientX, y: e.clientY };
    } else if (cut) {
      // El corte se confirma al soltar, para no cortar al intentar desplazar
      mode = "cut";
      curId = cut.dataset.cut;
      panFrom = { x: e.clientX, y: e.clientY };
      cutInfo = { d: cut.getAttribute("d"), pt: svgPoint(e) };
    } else if (port) {
      mode = "link";
      curId = port.dataset.from;
      snapAntes = snapshotPerks(mod);
    } else if (node) {
      mode = "drag";
      curId = node.dataset.id;
      snapAntes = snapshotPerks(mod);
      const pt = svgPoint(e);
      const cur = editPos[curId] || { x: pt.x, y: pt.y };
      offset = { dx: cur.x - pt.x, dy: cur.y - pt.y };
      /* Si lo que se agarra es uno de los elegidos, se mueven todos a la vez
         y con la misma distancia: se apunta dónde estaba cada uno al empezar
         y se les suma el desplazamiento del puntero. Agarrar cualquier otro
         nodo mueve solo ese, sin deshacer la selección. */
      ptIni = pt;
      grupoIni = null;
      /* El iman compara contra `posLienzo`, que lo deja el ultimo mapa
         dibujado — y ese puede ser el de OTRA rama, porque la pagina las
         dibuja todas. Se siembra con esta antes de empezar, o el primer
         movimiento se alinearia contra los nodos del vecino. */
      branchLayout(branchNodes(b, mod), ramaGirada(b, mod));
      if (selNodos.has(curId) && selNodos.size > 1) {
        grupoIni = new Map();
        selNodos.forEach(id => {
          const q = editPos[id];
          if (q) grupoIni.set(id, { x: q.x, y: q.y });
        });
      }
      node.classList.add("dragging");
    } else if (e.shiftKey) {
      /* Shift sobre el fondo: se dibuja el recuadro. El rectángulo se mete
         dentro del propio SVG y no encima del contenedor, así queda en las
         mismas coordenadas que los nodos —al desplazar el lienzo mientras se
         arrastra, el recuadro no se despega de lo que está encerrando—. */
      mode = "banda";
      ptIni = svgPoint(e);
      const svg = wrap.querySelector("svg");
      banda = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      banda.setAttribute("class", "banda-sel");
      banda.setAttribute("x", ptIni.x);
      banda.setAttribute("y", ptIni.y);
      banda.setAttribute("width", 0);
      banda.setAttribute("height", 0);
      svg.appendChild(banda);
    } else {
      // Fondo: se desplaza el lienzo, para que nada quede fuera de alcance
      mode = "pan";
      panFrom = { x: e.clientX, scroll: wrap.scrollLeft };
      /* Tocar el fondo sin Shift es "ya no quiero nada de esto elegido": la
         selección no puede sobrevivir a un clic en el vacío, o acabaría
         agrupando cosas que uno ya no tenía en la cabeza. */
      if (selNodos.size) { limpiarSeleccion(); redraw(); pintarBarraSeleccion(wrap); }
    }
    try { wrap.setPointerCapture(e.pointerId); } catch (err) { /* puntero ya liberado */ }
    e.preventDefault();
  });

  wrap.addEventListener("pointermove", (e) => {
    if (!mode) return;
    e.preventDefault();

    if (mode === "pan") {
      wrap.scrollLeft = panFrom.scroll - (e.clientX - panFrom.x);
      return;
    }

    const pt = svgPoint(e);

    if (mode === "banda") {
      const x0 = Math.min(ptIni.x, pt.x), y0 = Math.min(ptIni.y, pt.y);
      banda.setAttribute("x", x0);
      banda.setAttribute("y", y0);
      banda.setAttribute("width", Math.abs(pt.x - ptIni.x));
      banda.setAttribute("height", Math.abs(pt.y - ptIni.y));
      return;
    }

    if (mode === "drag") {
      // nodoPorId y no state.perks: la caja del atico tambien se arrastra
      const p = nodoPorId(curId);
      if (!p) return;
      /* Todo lo de aquí va en coordenadas del dibujo —el dedo, `ptIni`, lo que
         guarda `editPos`— y lo que se escribe en el talento va sin girar. Por
         eso el ida y vuelta: se calcula girado, se desgira para guardar y se
         vuelve a girar para `editPos`, que es lo que se compara contra el
         puntero en el recuadro de selección y al soltar un enlace. */
      const gir = ramaGirada(b, mod);
      guiasPend = null;
      if (grupoIni) {
        const dx = pt.x - ptIni.x, dy = pt.y - ptIni.y;
        grupoIni.forEach((ini, id) => {
          const q = nodoPorId(id);
          if (!q) return;
          const d = aDatos(ini.x + dx, ini.y + dy, gir);
          q.x = enLienzoX(d.x);
          q.y = enLienzoY(d.y);
          editPos[id] = alDibujo(q.x, q.y, gir);
        });
      } else {
        const d = aDatos(pt.x + offset.dx, pt.y + offset.dy, gir);
        p.x = enLienzoX(d.x);
        p.y = enLienzoY(d.y);
        /* La regla de alinear, también aquí. Vivía SOLO en el arrastre normal
           desde que se hizo, y en el editor no había ni imán ni líneas — que
           es justo donde uno acomoda un mapa, porque para conectar y cortar
           hay que encender el lápiz. Lo echó en falta Eduardo.

           Va solo cuando se mueve UNO. Arrastrando varios en bloque, pegar el
           grupo entero porque uno de sus miembros quedó cerca de alinearse
           movería a los otros a sitios que nadie pidió. */
        guiasPend = imantarNodo(p, b, mod);
        editPos[curId] = alDibujo(p.x, p.y, gir);
      }
      // Al acercarse a un borde, el lienzo acompaña al dedo
      const r = wrap.getBoundingClientRect();
      if (e.clientX > r.right - 46) wrap.scrollLeft += 14;
      else if (e.clientX < r.left + 46) wrap.scrollLeft -= 14;
      /* Las líneas se pintan DESPUÉS de redibujar y en el mismo fotograma: el
         redibujado sustituye el SVG entero, así que pintarlas antes es
         tirarlas a la basura. */
      if (!raf) raf = requestAnimationFrame(() => {
        raf = null;
        redraw();
        if (guiasPend) pintarGuias(wrap, guiasPend); else borrarGuias(wrap);
      });
    }

    if (mode === "link") {
      const from = editPos[curId];
      if (!from) return;
      const fp = nodoDeVista(b, curId) || nodoPorId(curId);
      const prev = wrap.querySelector(".link-preview");
      if (prev) {
        // Mismo criterio de rumbo que edgePath(), para que la vista previa no
        // prometa un trazo que al soltar se dibuje por otro brazo.
        const rumbo = elegirRumbo(rumbosDe(fp, true, ramaGirada(b, mod)), pt.x - from.x, pt.y - from.y);
        const anchor = anclaEn(from, fp, rumbo);
        const [vx, vy] = DIRS[rumbo];
        const pull = Math.max(40, Math.hypot(pt.x - anchor.x, pt.y - anchor.y) * 0.5);
        prev.setAttribute("d", `M ${anchor.x} ${anchor.y} C ${anchor.x + vx * pull} ${anchor.y + vy * pull}, ${pt.x - vx * pull} ${pt.y - vy * pull}, ${pt.x} ${pt.y}`);
        prev.style.display = "";
      }
    }
  });

  const finish = (e) => {
    if (!mode) return;
    guiasPend = null;
    borrarGuias(wrap);
    if (mode === "pan") { mode = null; panFrom = null; return; }
    if (mode === "banda") {
      const pt = svgPoint(e);
      const x0 = Math.min(ptIni.x, pt.x), x1 = Math.max(ptIni.x, pt.x);
      const y0 = Math.min(ptIni.y, pt.y), y1 = Math.max(ptIni.y, pt.y);
      if (banda) banda.remove();
      banda = null; mode = null;
      /* Basta con que el centro del nodo caiga dentro. Exigir la figura
         entera obligaría a rodearlo con holgura, y con nodos grandes eso es
         casi imposible sin arrastrar media rama de paso. */
      if (selRama !== b) { selNodos = new Set(); selRama = b; }
      branchNodes(b, mod).forEach(n => {
        const q = editPos[n.id];
        if (q && q.x >= x0 && q.x <= x1 && q.y >= y0 && q.y <= y1) selNodos.add(n.id);
      });
      if (!selNodos.size) selRama = null;
      redraw();
      pintarBarraSeleccion(wrap);
      return;
    }
    if (mode === "modo") {
      const quieto = Math.hypot(e.clientX - panFrom.x, e.clientY - panFrom.y) < 10;
      const id = curId;
      mode = null; panFrom = null; curId = null;
      if (quieto) alternarModo(id);
      return;
    }
    if (mode === "cut") {
      const moved = Math.hypot(e.clientX - panFrom.x, e.clientY - panFrom.y);
      const info = cutInfo;
      mode = null; panFrom = null; cutInfo = null;
      if (moved < 10) {
        // El color se toma ANTES de cortar: al soltar el hijo se queda sin
        // padre y su estado (y por tanto su color) puede cambiar.
        const c = listaDe(mod).find(x => x.id === String(curId).split("|")[0]);
        let color = "var(--lienzo-hilo)";
        if (c) {
          const cst = estadoDeNodo(c);
          color = tinta(nodoHecho(c, mod === "proyectos") ? (c.color || "#5fe0b0")
            : ((cst === "active" || cst === "due") ? "var(--fire)" : "var(--lienzo-hilo)"));
        }
        removeLink(curId);
        // Después del redibujado: la línea ya no está, así que lo que se ve
        // desvanecerse son sus dos mitades y no una copia encima.
        if (info) requestAnimationFrame(() => efectoCorte(b, info.d, info.pt, color));
      }
      curId = null;
      return;
    }
    if (mode === "link") {
      /* Antes hacía falta soltar justo encima de la figura (elementFromPoint
         detecta el píxel exacto), y en un talento pequeño eso fallaba fácil.
         Ahora se busca el talento más cercano al soltar, con margen extra
         alrededor de cada uno — no hace falta acertarle al dibujo. */
      const pt = svgPoint(e);
      const HIT_PAD = 34;
      let toId = null, bestDist = Infinity;
      branchNodes(b, mod).forEach(p => {
        if (p.id === curId) return;
        const pp = editPos[p.id];
        if (!pp) return;
        const d = Math.hypot(pt.x - pp.x, pt.y - pp.y);
        const thresh = nodeRadius(p) + HIT_PAD;
        if (d <= thresh && d < bestDist) { bestDist = d; toId = p.id; }
      });
      const t = toId && toId !== curId ? nodoPorId(toId) : null;
      if (t) {
        if (isDescendant(toId, curId)) {
          toast(tx("Esa conexión crearía un bucle"), "atencion");
        } else if (requisitosDe(t).includes(curId)) {
          toast(tx("Ya estaban conectados"), "calma");
        } else {
          const esCaja = !!cajaPorId(toId) || !!cajaPorId(curId);
          pushUndo("conectar dos nodos", snapAntes, mod);
          /* Se AÑADE a la lista en vez de reemplazarla: conectar un
             segundo padre es justo lo que hace posible el nodo que corona,
             y sustituir en silencio el requisito anterior sería deshacer
             trabajo que el usuario no pidió deshacer. */
          t.requiere = [...requisitosDe(t), curId];
          save();
          const nom = nodoDeVista(b, toId, mod);
          const n = (nodoDeVista(b, toId, mod) || { requiere: t.requiere }).requiere.length;
          /* Con una caja de por medio el hilo es SIMBÓLICO: dice de dónde
             viene una cosa, pero no bloquea a nadie —lo que está guardado en
             el ático ya no está en juego—. Decirlo aquí evita esperar un
             candado que nunca va a aparecer. */
          toast(esCaja
            ? `Atado a ${nom ? nom.name : "la caja"} · es una conexión simbólica, no bloquea`
            : (n > 1
              ? `${nom ? nom.name : t.name} ahora pide ${n} requisitos (${modoDe(t) === "todos" ? "todos" : "cualquiera"})`
              : `Conectado: ${nom ? nom.name : t.name} requiere el anterior`), "hecho");
        }
      }
    }
    if (mode === "drag") {
      // Solo cuenta como acción si de verdad cambió algo: un clic sin
      // arrastre llenaría la pila de pasos vacíos que no deshacen nada.
      if (snapAntes && snapAntes !== snapshotPerks(mod)) {
        const uno = mod === "proyectos" ? "un encargo" : "un talento";
        const varios = mod === "proyectos" ? "encargos" : "talentos";
        pushUndo(grupoIni ? `mover ${grupoIni.size} ${varios}`
          : (cajaPorId(curId) ? tx("mover una caja") : `mover ${uno}`), snapAntes, mod);
      }
      save();
    }
    mode = null; curId = null; snapAntes = null; grupoIni = null;
    redraw();
  };

  wrap.addEventListener("pointerup", finish);
  wrap.addEventListener("pointercancel", finish);

  /* El árbol se redibuja entero muchas veces (al guardar, al volver de una
     ficha) y la barra vive en el HTML de la tarjeta, no en el SVG: hay que
     volver a ponerla o la selección seguiría viva sin nada que la mande. */
  if (selRama === b) pintarBarraSeleccion(wrap);
}

/* Nombre en hasta dos líneas centradas: nada de puntos suspensivos salvo
   que ni en dos líneas quepa. */
/* ---- Cuánto ocupa de verdad un texto ----
   Contar letras no sirve para saber si algo cabe: veinte caracteres miden 55
   px escritos con íes y 180 con emes. Con el nombre por defecto de una caja
   —«3º trim. 2026»— no se notaba nunca; con uno escrito a mano sí, y «EQUIPO
   FOTOGRÁFICO» medía 119 px dentro de una caja de 104, colgando siete por
   cada lado.

   Se mide con un lienzo de mapa de bits aunque el dibujo sea SVG: es la misma
   familia y el mismo tamaño, y a cambio no hay que meter nada en la página ni
   esperar a que el navegador recalcule el diseño. El contexto se guarda porque
   esto se llama una vez por renglón y por repintado. */
let _reglaTexto = null, _reglaFamilia = "";
function anchoDeTexto(txt, px, peso) {
  if (!_reglaTexto) {
    _reglaTexto = document.createElement("canvas").getContext("2d");
    /* La familia se pregunta una vez. No cambia nunca —ni con el modo
       claro— y preguntarla obliga a resolver estilos, que es justo lo que
       no se hace dentro del bucle que dibuja el mapa. */
    _reglaFamilia = getComputedStyle(document.body).fontFamily;
  }
  _reglaTexto.font = (peso || 400) + " " + px + "px " + _reglaFamilia;
  return _reglaTexto.measureText(txt).width;
}

/* Parte un nombre en renglones que QUEPAN en `maxPx`. Una palabra más ancha
   que el renglón se recorta letra a letra hasta que ella y sus puntos
   suspensivos caben, y se queda sola en su renglón: pegarle la palabra
   siguiente detrás de unos puntos suspensivos —«Electroencefalog… mío»— se
   lee como un error de escritura, no como un recorte. */
function partirPorAncho(name, maxPx, maxLines, px, peso) {
  const cabe = s => anchoDeTexto(s, px, peso) <= maxPx;
  const recortar = s => {
    let r = s;
    while (r.length > 1 && !cabe(r + "…")) r = r.slice(0, -1);
    return r + "…";
  };
  const lineas = [];
  let cur = "";
  for (const w of String(name || "").split(/\s+/).filter(Boolean)) {
    const test = cur ? cur + " " + w : w;
    if (cabe(test)) { cur = test; continue; }
    if (cur) lineas.push(cur);
    if (cabe(w)) { cur = w; } else { lineas.push(recortar(w)); cur = ""; }
  }
  if (cur) lineas.push(cur);
  if (!lineas.length) return [""];
  if (lineas.length <= maxLines) return lineas;
  const keep = lineas.slice(0, maxLines);
  keep[maxLines - 1] = recortar(keep[maxLines - 1]);
  return keep;
}

function wrapName(name) {
  const MAX = 20, MAX_LINES = 3;
  if (name.length <= MAX) return [name];
  const words = name.split(" ");
  const all = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (test.length <= MAX) { cur = test; continue; }
    if (cur) all.push(cur);
    cur = w.length > MAX ? w.slice(0, MAX - 1) + "…" : w;
  }
  if (cur) all.push(cur);
  if (all.length <= MAX_LINES) return all;
  // Solo si ni en tres líneas cabe se marca el corte
  const keep = all.slice(0, MAX_LINES);
  keep[MAX_LINES - 1] = keep[MAX_LINES - 1].slice(0, MAX - 1) + "…";
  return keep;
}

