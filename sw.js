/* Al cambiar este nombre, activate() borra las cachés viejas: es la forma
   de forzar que un aparato que se quedó con una versión anterior la suelte.
   También es el único modo de renovar la tipografía, que se sirve de caché
   sin preguntar (ver abajo).

   Lleva el MISMO número que `VERSION` en js/01-base.js —el que se ve debajo
   de Ajustes—, y no una cuenta aparte. Antes eran dos numeraciones sin
   relación ("v18") y no había forma de mirar la app y saber qué caché estaba
   sirviendo. Ahora, si el número de la esquina es el nuevo, la caché también.
   Un service worker no puede leer los archivos de la app, así que la copia se
   hace a mano: al subir la versión hay que cambiar los dos. */
const CACHE = "norata-0.7.51";

const ASSETS = [
  "./", "./index.html", "./manifest.webmanifest",
  /* La puerta es una página aparte desde 0.7.14. Las DOS direcciones, porque
     se llega por las dos: `./login/` la escribe la app al rebotar, y
     `./login/index.html` es lo que pide el navegador al recargar estando ahí.
     Con una sola, la otra se quedaba sin copia y sin conexión daba un error de
     red en mitad del inicio de sesión. */
  "./login/", "./login/index.html",
  "./icon.svg", "./favicon.svg", "./icon-192.png", "./icon-512.png",
  "./icon-maskable-512.png", "./apple-touch-icon.png",
  "./css/fuente.css", "./css/estilos.css", "./css/ambientes.css",
  "./js/01-base.js", "./js/02-progreso.js", "./js/02b-expedicion.js", "./js/03-talentos.js",
  "./js/04-misiones.js", "./js/05-resumen.js", "./js/06-detalle.js",
  "./js/07-lienzo.js", "./js/08-formularios.js", "./js/09-inicio.js",
  "./js/10-fusion.js", "./js/10-sincronia.js", "./js/10a-perfil.js", "./js/10b-supabase.js", "./js/10c-portada.js", "./js/10d-plan.js", "./js/10e-panel.js", "./js/10f-informes.js", "./js/10g-informe.js", "./js/10h-lecturas.js",
  "./js/10i-apariencia.js",
  "./js/11-arranque.js", "./js/12-login.js",
  /* Los dos logotipos, porque desde el modo claro la portada usa uno u otro
     según cómo esté la app. Sin el segundo aquí, quien entre de día y sin red
     se queda con el hueco de una imagen que no llegó. */
  "./marca/logotipo-claro.svg", "./marca/logotipo-oscuro.svg"
];

/* ---- De la copia primero, desde 0.7.38 ----
   Hasta 0.7.37 esto iba a la RED PRIMERO para todo menos la tipografía, y con
   `no-store` encima. Se puso así por un susto real —GitHub Pages tarda un
   minuto en publicar, alguien recargó en ese hueco, se guardó una página de
   error como si fuera un archivo y la app arrancó a medias hasta la siguiente
   versión— y estaba escrito que era «un precio que se paga a conciencia».

   Lo que no se sabía es cuánto costaba ese precio. Medido, contando las
   peticiones en el servidor y con TLS puesto (el service worker solo se
   registra en https, así que sin eso no se estaba midiendo nada):

     abrir la app un día cualquiera  ->  24 peticiones, 460 KB, SIEMPRE

   O sea que la app entera se volvía a bajar cada mañana antes de que se viera
   nada. En el mismo laboratorio, sirviendo de la copia: 1 570 ms -> 140 ms.

   Y no se pierde la red de seguridad, porque el aviso de que hay versión nueva
   no venía de re-descargar la app: viene de `sw.js`, que el navegador vuelve a
   pedir en CADA navegación y sin pasar por su caché. Si este archivo cambió
   —y cambia siempre, porque CACHE lleva el número de versión— se instala el
   nuevo, se baja todo otra vez por detrás y se avisa a la app. Lo único que se
   cede es que quien abra justo después de una publicación ve una vez la
   anterior; la nueva entra sola en la siguiente apertura.

   El susto de la publicación a medias, además, aquí no puede pasar: durante
   ese minuto no se pide nada a la red, y si el `addAll` de la instalación
   pilla un 404, la instalación falla entera y se sigue con la copia buena de
   antes. Fallar así es lo correcto. */

self.addEventListener("install", (e) => {
  /* `cache: "reload"` en cada uno, y esto no es adorno: sin ello el `addAll`
     puede llenar la caché NUEVA con los bytes viejos que el navegador tuviera
     guardados de la versión anterior, y entonces subir la versión no cambia
     nada de lo que se ve. */
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      c.addAll(ASSETS.map((u) => new Request(u, { cache: "reload" })))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  /* Todo dentro del mismo `waitUntil` y en orden: borrar lo viejo, tomar el
     mando y avisar. Antes `claim()` colgaba fuera, así que el worker podía
     darse por activado antes de haber terminado de limpiar. */
  e.waitUntil(
    caches.keys().then((keys) => {
      /* Si no hay ninguna caché ANTERIOR, esto es la primera instalación de la
         vida: no hay ninguna «versión nueva» que anunciar, hay una app que
         acaba de llegar. Se mira `viejas` y no `keys` porque para cuando corre
         `activate` la caché de ESTA versión ya existe —la crea `install`—, así
         que `keys` nunca está vacío y el aviso saltaba en una instalación
         recién hecha, diciéndole a alguien que acababa de entrar que su app ya
         estaba anticuada. */
      const viejas = keys.filter((k) => k !== CACHE);
      const primera = viejas.length === 0;
      return Promise.all(viejas.map((k) => caches.delete(k)))
        .then(() => self.clients.claim())
        .then(() => avisarDeVersionNueva(primera));
    })
  );
});

/* Red primero, y sin pasar por la caché HTTP del navegador.
   Sin el `cache: "no-store"` el fetch podía servirse de esa caché y
   devolver una versión vieja aunque hubiera conexión: la app quedaba
   congelada en una build anterior sin que nada lo delatara. La copia en
   CacheStorage sigue existiendo, pero solo como respaldo sin conexión. */

/* Solo lo nuestro. Antes este service worker se metía en TODAS las peticiones,
   incluidas las de Supabase, y guardaba en la caché lo que contestara el
   servidor de datos. Eso es de otra casa: una respuesta de la base de datos no
   es un archivo de la app, guardarla no sirve para nada sin conexión —hace
   falta la sesión— y devolver una copia vieja de una consulta es peor que
   devolver el error. Que vayan directas a la red, como cualquier otra página
   haría sin service worker de por medio. */
function esNuestro(req) {
  try {
    return new URL(req.url).origin === self.location.origin;
  } catch (e) {
    return false;
  }
}

/* Una respuesta que NO se puede guardar es cualquiera que no venga bien: un
   404, un 500, o la página de error que devuelve el servidor mientras
   despliega. Comprobarlo es lo que faltaba y lo que costó un susto.

   Esto es lo que pasaba: GitHub Pages tarda un minuto largo en publicar, y
   quien recargue justo en ese hueco puede pedir un archivo que todavía no
   está. El servidor contesta 404 con una página de HTML; el navegador la
   ejecuta como si fuera JavaScript, no define nada, y la app arranca a medias
   —«perkStatus is not defined», que es la primera función que falta al pintar
   el Resumen—. Hasta aquí es mala suerte y se arregla recargando.

   Lo que lo convertía en un problema de verdad es que esa página de error se
   GUARDABA en la caché igual que un archivo bueno, así que recargar seguía
   sirviendo el error hasta la siguiente versión. Ahora una respuesta mala ni
   se guarda ni se sirve si hay una copia buena de antes.

   Las opacas (`type === "opaque"`) se dejan pasar aparte: vienen de otro
   origen sin CORS y su `status` es siempre 0, así que preguntarles si están
   bien no tiene respuesta. Con `esNuestro` ya no deberían llegar aquí, pero la
   comprobación se queda por si algún día vuelve a colarse alguna. */
function seguardase(res) {
  return !!res && (res.ok || res.type === "opaque");
}

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  if (!esNuestro(e.request)) return;

  /* Una navegación puede traer parámetros —`?informes=demo`, las pruebas con
     enlace— y con ellos la dirección no coincide con la que se guardó. Sin
     `ignoreSearch` esas aperturas se caían a la red y eran las únicas lentas,
     que es justo lo contrario de lo que se quiere de una prueba. */
  const opciones = e.request.mode === "navigate" ? { ignoreSearch: true } : undefined;

  /* De la caché de ESTA versión y no de `caches.match` a secas, que busca en
     todas las que haya. Mientras se instala una versión nueva conviven dos
     almacenes, y el worker viejo —que es el que sigue mandando hasta que el
     nuevo active— podría servir un archivo del nuevo y otro del viejo en la
     misma carga. Una app a medias entre dos versiones es peor que una app
     vieja: la vieja al menos es coherente consigo misma. */
  e.respondWith(
    caches.open(CACHE).then((c) => c.match(e.request, opciones)).then((hit) => {
      if (hit) return hit;
      /* No estaba: se pide, y se guarda si vino bien. Cubre lo que no está en
         ASSETS —una imagen de la marca, un icono suelto— y la primerísima
         apertura, cuando la instalación todavía no ha terminado. */
      return fetch(e.request)
        .then((res) => {
          if (!seguardase(res)) return res;
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copia));
          return res;
        })
        .catch(() => caches.open(CACHE)
          .then((c) => c.match(e.request, opciones))
          .then((h) => h || Response.error()));
    })
  );
});

/* ---- Avisar de que hay versión nueva ----
   Cuando este archivo cambia, el navegador instala el service worker nuevo,
   se baja la app entera por detrás y activa. A partir de ahí la copia buena ya
   es la nueva y la siguiente apertura la sirve sola, sin que nadie haga nada.

   Este mensaje es solo la cortesía de no hacer esperar a la siguiente
   apertura: la app enseña un aviso con un botón de recargar. Si no se pulsa,
   no se pierde nada.

   `clientes.matchAll` con `includeUncontrolled` porque en la primerísima
   instalación las pestañas abiertas todavía no las manda este worker, y sin
   eso el aviso no llegaría precisamente a quien está mirando. */
function avisarDeVersionNueva(primeraInstalacion) {
  if (primeraInstalacion) return;   // nadie estaba esperando nada
  return self.clients.matchAll({ includeUncontrolled: true, type: "window" })
    .then((clientes) => {
      clientes.forEach((c) => {
        try { c.postMessage({ norata: "version-nueva", version: CACHE }); } catch (e) {}
      });
    });
}
