/* Al cambiar este nombre, activate() borra las cachés viejas: es la forma
   de forzar que un aparato que se quedó con una versión anterior la suelte. */
const CACHE = "norata-v2";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg", "./favicon.svg"];

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
