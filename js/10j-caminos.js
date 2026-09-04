/* Los caminos: diez ramas ya armadas que se pueden soltar en el tablero.

   ---- Por que los datos NO estan aqui dentro ----

   Son 132 peldanos con sus pasos, sus plazos y sus misiones: 21 KB que solo
   necesita quien abre el cajon, y solo si paga. Metidos en un archivo de
   `ASSETS` se los bajaria todo el mundo en la instalacion, incluido quien
   nunca va a abrirlos — y el arranque de la app es hoy UNA peticion y ~120 ms,
   que es lo que costo llegar ahi en la 0.7.38.

   Asi que viven en `caminos/caminos.json`, fuera de la lista, y se piden la
   primera vez que alguien abre el cajon. Es el mismo trato que tienen las
   texturas de un mundo.

   ---- Y por que la direccion lleva `?h=` ----

   Lo que no esta en `ASSETS` no lo renueva nadie: se pide suelto, lo que
   llegue se guarda en la cache de esa version, y a partir de ahi ya es un
   acierto y no se vuelve a pedir NUNCA. GitHub Pages tarda un minuto en
   publicar y su CDN no cambia todos los archivos a la vez, asi que hay una
   ventana en la que el JS ya es el nuevo y el JSON todavia es el viejo: quien
   abra ahi se queda los caminos viejos congelados para siempre.

   La huella cierra esa ventana. `sw.js` ya sabe comprobarla —calcula el
   sha-256 de lo que llego y solo lo guarda si cuadra con lo que pedia la
   direccion—, asi que aqui no hace falta nada mas que ponerla.

   **La estampa `caminos/app.py`**, que es tambien quien genera el JSON desde
   `plantillas/LEEME.md`. No se escribe a mano: si se toca un peldano se
   corrige el LEEME y se vuelve a correr el generador. */

/* La escribe el generador. Vacia quiere decir que nadie ha corrido
   `python caminos/app.py` todavia, y entonces se pide sin huella: funciona,
   pero sin la garantia de arriba. */
const CAMINOS_HUELLA = "4e8cf30fce4f";

/* Cargados una vez por sesion. Son datos que no cambian mientras la app este
   abierta, asi que no hay motivo para volver a pedirlos ni a analizarlos. */
let _caminos = null;

/* La peticion en vuelo. Sin esto, abrir el cajon dos veces seguidas antes de
   que conteste la red dispara dos descargas: la promesa se comparte y las dos
   llamadas esperan la misma. */
let _pidiendo = null;

/* Devuelve la lista, o `null` si no se pudo traer.

   No lanza NUNCA, y es a proposito: quien llama esta pintando una ventana, y
   un fallo de red no puede dejar media pantalla a medio dibujar. Un `null`
   se contesta con «esto no se pudo abrir, intenta otra vez», que es una frase
   que cabe donde iba la lista. */
function cargarCaminos() {
  if (_caminos) return Promise.resolve(_caminos);
  if (_pidiendo) return _pidiendo;

  const url = "caminos/caminos.json" + (CAMINOS_HUELLA ? "?h=" + CAMINOS_HUELLA : "");
  _pidiendo = fetch(url, { cache: "no-store", credentials: "same-origin" })
    .then(r => (r.ok ? r.json() : null))
    .then(d => {
      _caminos = d && Array.isArray(d.caminos) ? d.caminos : null;
      return _caminos;
    })
    .catch(() => null)
    .then(v => {
      /* La promesa se suelta pase lo que pase: si fallo por falta de red, el
         siguiente intento tiene que volver a pedirlo de verdad y no quedarse
         con el fallo guardado. */
      _pidiendo = null;
      return v;
    });
  return _pidiendo;
}

/* Los del modulo que toque. El cajon de Talentos y el de Proyectos son la
   misma ventana con distinto vocabulario, asi que reparte por aqui. */
function caminosDe(modulo) {
  return (_caminos || []).filter(c => c.modulo === modulo);
}

function caminoPorId(id) {
  return (_caminos || []).find(c => c.id === id) || null;
}

/* ---- Cuales ya tiene puestos ----

   Se guarda `rama -> id del camino` y no una marca dentro de los talentos,
   porque lo que se crea tiene que ser **indistinguible de lo escrito a mano**:
   un talento que llevara sello de origen ya no seria del todo tuyo, y ese fue
   el trato desde el principio.

   Vive en `state.ui` para que viaje en la sincronia, y `js/10-fusion.js` tiene
   que unirlo o al abrir en otro aparato se te olvida cual usaste. */
function caminosPuestos() {
  return (state.ui && state.ui.caminos) || {};
}

function caminoDeRama(rama) {
  return caminosPuestos()[rama] || null;
}

function caminoYaPuesto(id) {
  const m = caminosPuestos();
  return Object.keys(m).some(r => m[r] === id);
}

/* El nombre libre para la rama nueva. NUNCA se fusiona con una que ya exista:
   si «Salud» esta ocupada, la nueva es «Salud 2».

   Eduardo lo decidio asi, y de paso resuelve solo el problema de repetir un
   camino: la rama de antes se queda entera con su historial y no hay nada que
   sobrescribir. El numero es feo los diez segundos que se tarda en renombrarla,
   que ya se puede porque el camino entra tal cual y se edita sobre la marcha. */
function ramaLibre(base, kind) {
  const usadas = ramasDe(kind || "perks");
  if (!usadas.includes(base)) return base;
  let n = 2;
  while (usadas.includes(base + " " + n)) n++;
  return base + " " + n;
}
