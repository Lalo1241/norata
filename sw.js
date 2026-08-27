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
const CACHE = "norata-0.7.8.2";

const ASSETS = [
  "./", "./index.html", "./manifest.webmanifest",
  "./icon.svg", "./favicon.svg", "./icon-192.png", "./icon-512.png",
  "./icon-maskable-512.png", "./apple-touch-icon.png",
  "./css/fuente.css", "./css/estilos.css",
  "./js/01-base.js", "./js/02-progreso.js", "./js/03-talentos.js",
  "./js/04-misiones.js", "./js/05-resumen.js", "./js/06-detalle.js",
  "./js/07-lienzo.js", "./js/08-formularios.js", "./js/09-inicio.js",
  "./js/10-fusion.js", "./js/10-sincronia.js", "./js/10a-perfil.js", "./js/10b-supabase.js", "./js/10c-portada.js", "./js/10d-plan.js", "./js/10e-panel.js",
  "./js/11-arranque.js",
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
