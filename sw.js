/* Al cambiar este nombre, activate() borra las cachés viejas: es la forma
   de forzar que un aparato que se quedó con una versión anterior la suelte.
   También es el único modo de renovar la tipografía, que se sirve de caché
   sin preguntar (ver abajo). */
const CACHE = "notara-v3";

const ASSETS = [
  "./", "./index.html", "./manifest.webmanifest", "./icon.svg", "./favicon.svg",
  "./css/fuente.css", "./css/estilos.css",
  "./js/01-base.js", "./js/02-progreso.js", "./js/03-talentos.js",
  "./js/04-misiones.js", "./js/05-resumen.js", "./js/06-detalle.js",
  "./js/07-lienzo.js", "./js/08-formularios.js", "./js/09-inicio.js",
  "./js/10-sincronia.js", "./js/11-arranque.js"
];

/* La tipografía es casi todo el peso del proyecto y no cambia nunca. Es el
   único archivo que se sirve de la caché sin consultar a la red: así el
   arranque no arrastra medio megabyte cada vez. El resto sigue yendo a la
   red primero, que es lo que evita quedarse congelado en una versión vieja.
   Si algún día hay que cambiarla, se sube el número de CACHE de arriba. */
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
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  if (SIEMPRE_DE_CACHE.test(new URL(e.request.url).pathname)) {
    e.respondWith(
      caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
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
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
