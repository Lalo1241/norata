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
const CACHE = "norata-0.7.31";

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
  "./css/fuente.css", "./css/estilos.css",
  "./js/01-base.js", "./js/02-progreso.js", "./js/03-talentos.js",
  "./js/04-misiones.js", "./js/05-resumen.js", "./js/06-detalle.js",
  "./js/07-lienzo.js", "./js/08-formularios.js", "./js/09-inicio.js",
  "./js/10-fusion.js", "./js/10-sincronia.js", "./js/10a-perfil.js", "./js/10b-supabase.js", "./js/10c-portada.js", "./js/10d-plan.js", "./js/10e-panel.js", "./js/10f-informes.js", "./js/10g-informe.js", "./js/10h-lecturas.js",
  "./js/11-arranque.js", "./js/12-login.js",
  /* Los dos logotipos, porque desde el modo claro la portada usa uno u otro
     según cómo esté la app. Sin el segundo aquí, quien entre de día y sin red
     se queda con el hueco de una imagen que no llegó. */
  "./marca/logotipo-claro.svg", "./marca/logotipo-oscuro.svg"
];

/* La tipografía (43 KB) es lo único que se sirve de caché sin consultar a la
   red, y no por tamaño —el grueso del peso es el JavaScript— sino porque es
   lo único que no cambia NUNCA: cachearla no puede dejar la app desfasada.
   Todo lo demás sigue yendo a la red primero, que es lo que evita quedarse
   congelado en una build vieja, y es un precio que se paga a conciencia. Si
   algún día hay que renovar la fuente, se sube el número de CACHE. */
const SIEMPRE_DE_CACHE = /\/css\/fuente\.css$/;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
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

  if (SIEMPRE_DE_CACHE.test(new URL(e.request.url).pathname)) {
    e.respondWith(
      caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
        if (!seguardase(res)) return res;
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      }))
    );
    return;
  }

  e.respondWith(
    fetch(e.request, { cache: "no-store" })
      .then((res) => {
        /* Mala: se prefiere lo que ya había, y si no había nada se devuelve el
           error tal cual — que al menos es la verdad de lo que contestó el
           servidor y sale en la pestaña de red. */
        if (!seguardase(res)) return caches.match(e.request).then((hit) => hit || res);
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      /* Sin red. `caches.match` devuelve `undefined` cuando tampoco hay copia,
         y un `undefined` dentro de `respondWith` revienta con un error de tipo
         que no dice nada de lo que pasó. */
      .catch(() => caches.match(e.request).then((hit) => hit || Response.error()))
  );
});
