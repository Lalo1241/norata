/* Al cambiar este nombre, activate() borra las cachés viejas: es la forma
   de forzar que un dispositivo que se quedó con una versión anterior la suelte.
   También es el único modo de renovar la tipografía, que se sirve de caché
   sin preguntar (ver abajo).

   Lleva el MISMO número que `VERSION` en js/01-base.js —el que se ve debajo
   de Ajustes—, y no una cuenta aparte. Antes eran dos numeraciones sin
   relación ("v18") y no había forma de mirar la app y saber qué caché estaba
   sirviendo. Ahora, si el número de la esquina es el nuevo, la caché también.
   Un service worker no puede leer los archivos de la app, así que la copia se
   hace a mano: al subir la versión hay que cambiar los dos. */
const CACHE = "norata-0.7.87.1";

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
  /* Las muestras de los mundos SÍ viajan con la app y `css/mundos.css` no: son
     tres tonos por mundo y pesan tres kilobytes, mientras que un mundo entero
     —con su letra y sus texturas— pesa ciento ochenta. Sin ellas aquí, la reja
     del catálogo saldría gris para quien nunca se haya bajado un mundo, que es
     todo el mundo la primera vez que abre esa pantalla. */
  "./css/muestras.css",
  "./js/00-idioma.js", "./js/00b-textos-en.js",
  "./js/01-base.js", "./js/02-progreso.js", "./js/02b-expedicion.js", "./js/03-talentos.js",
  "./js/04-misiones.js", "./js/05-resumen.js", "./js/06-detalle.js",
  "./js/07-lienzo.js", "./js/08-formularios.js", "./js/09-inicio.js", "./js/09c-region.js",
  "./js/10-fusion.js", "./js/10-sincronia.js", "./js/10a-perfil.js", "./js/10b-supabase.js", "./js/10c-portada.js", "./js/10d-plan.js", "./js/10e-panel.js", "./js/10f-informes.js", "./js/10g-informe.js", "./js/10h-lecturas.js",
  "./js/10i-apariencia.js",
  "./js/10j-caminos.js",
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

/* ---- Lo que NO está en la lista de la instalación ----
   `css/mundos.css` y, el día que existan, las texturas y la letra de un mundo.
   No van en ASSETS a propósito: pesan lo que pesa un mundo y bajárselos a
   quien nunca va a encender uno es justo lo que la caché vino a evitar.

   Pero eso les quita la única red que tiene todo lo demás. La instalación pide
   cada archivo de ASSETS con `cache: "reload"` y falla entera si alguno viene
   mal; estos, en cambio, se piden sueltos cuando hacen falta, y lo que llegue
   se guarda en la caché de esta versión — y a partir de ahí ya es un acierto y
   no se vuelve a pedir NUNCA.

   Ahí estaba el fallo, y está reproducido: GitHub Pages tarda un minuto largo
   en publicar y su CDN no cambia todos los archivos a la vez, así que hay una
   ventana en la que `sw.js` ya es el nuevo y `css/mundos.css` todavía es el
   viejo. Quien abra la app en esa ventana instala el worker nuevo, pide el
   mundo, recibe el archivo VIEJO con un 200 —o sea, bueno— y se lo queda
   congelado para toda la versión. El número de Ajustes sale nuevo, porque
   `01-base.js` sí está en ASSETS; el mundo se queda como estaba, y no hay
   recarga que lo arregle. Es exactamente lo que vio Eduardo: «la versión sí
   está subida y no veo ningún cambio».

   La cura es servir la copia y PEDIR OTRA por detrás: se sigue viendo al
   instante, y si lo que llega es distinto queda guardado para la siguiente
   apertura. Es el mismo trato que ya tiene la app entera —quien abre justo
   después de publicar ve una vez la anterior—, aplicado a lo que se pide bajo
   demanda. Lo que no puede volver a pasar es «nunca». */
const EN_ASSETS = new Set(ASSETS.map((u) => new URL(u, self.location.href).href));
function esBajoDemanda(req) {
  try {
    const u = new URL(req.url);
    return !EN_ASSETS.has(u.origin + u.pathname);
  } catch (e) {
    return false;
  }
}

/* ---- La huella, comprobada ----
   Una dirección con `?h=<huella>` promete un contenido concreto: la huella es
   los diez primeros dígitos del sha-256 del archivo, y la estampa
   `mundos/app.py` al generarlo. Aquí se comprueba antes de guardar nada.

   Hace falta porque cambiar la dirección, por sí solo, no basta: GitHub Pages
   sirve el archivo sin mirar la parte de la dirección que va tras la
   interrogación, así que durante el minuto que tarda en publicar contesta al
   `?h=nuevo` con el archivo VIEJO y con un 200 — o sea, con algo que parece
   bueno—. Guardarlo sería congelarlo otra vez, que es justo lo que se está
   arreglando.

   Comprobando la huella, ese archivo se sirve esta vez —no hay otro— pero no
   se guarda, así que la siguiente apertura vuelve a pedirlo y ya llega el
   bueno. Lo que no puede volver a pasar es «nunca». */
function cuadraLaHuella(req, res) {
  let huella;
  try { huella = new URL(req.url).searchParams.get("h"); } catch (e) { return Promise.resolve(true); }
  if (!huella || !self.crypto || !self.crypto.subtle) return Promise.resolve(true);
  return res.clone().arrayBuffer()
    .then((b) => self.crypto.subtle.digest("SHA-256", b))
    .then((d) => {
      const hex = Array.from(new Uint8Array(d)).map((x) => x.toString(16).padStart(2, "0")).join("");
      return hex.slice(0, huella.length) === huella;
    })
    .catch(() => true);   // si no se puede comprobar, se guarda: peor es no tener nada
}

function guardarSiCuadra(req, res) {
  return cuadraLaHuella(req, res).then((bien) => {
    if (!bien) return;
    return caches.open(CACHE).then((c) => c.put(req, res));
  });
}

function renovarPorDetras(req) {
  return fetch(new Request(req.url, { cache: "no-store", credentials: "same-origin" }))
    .then((res) => {
      if (!seguardase(res)) return;
      return guardarSiCuadra(req, res);
    })
    .catch(() => {});   // sin red no pasa nada: la copia sigue estando
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
      if (hit) {
        /* Lo de ASSETS lo renueva la instalación; lo de fuera, esto. */
        if (esBajoDemanda(e.request)) {
          try { e.waitUntil(renovarPorDetras(e.request)); } catch (x) { renovarPorDetras(e.request); }
        }
        return hit;
      }
      /* No estaba: se pide, y se guarda si vino bien. Cubre lo que no está en
         ASSETS —`css/mundos.css`, las texturas y la letra de un mundo, una
         imagen de la marca— y la primerísima apertura, cuando la instalación
         todavía no ha terminado.

         ---- Y SE PIDE CON `cache: "no-store"`, que NO es lo mismo que el
         `cache: "reload"` de la instalación, y la diferencia es todo. ----
         `reload` se salta la caché HTTP del navegador para LEER, pero lo que
         llega lo GUARDA ahí igual. Y eso importa muchísimo por algo que hubo
         que medir para creérselo: **el navegador solo le pasa la petición al
         service worker la PRIMERA vez.** Mientras el archivo siga fresco en su
         caché HTTP —GitHub Pages manda `max-age=600`—, las cargas siguientes
         se sirven de ahí sin preguntarle nada a este archivo. Medido con un
         contador guardado en el propio almacén de cachés: cuatro cargas
         seguidas y el worker vio la petición del mundo UNA vez.

         O sea que con `reload`, lo que se colara una vez en la caché del
         navegador mandaba durante diez minutos por encima de cualquier cosa
         que este worker decidiera. Con `no-store` el navegador no se queda
         copia, así que TODAS las cargas pasan por aquí y la única copia es la
         de este archivo, que es la que sabe comprobar la huella.

         Una navegación se pide tal cual: `mode: "navigate"` no se puede
         reconstruir en un `Request`, y además `./` y `./index.html` están en
         ASSETS, así que por aquí no pasan. */
      const peticion = e.request.mode === "navigate"
        ? e.request
        : new Request(e.request.url, { cache: "no-store", credentials: "same-origin" });
      return fetch(peticion)
        .then((res) => {
          if (!seguardase(res)) return res;
          /* Se guarda solo si cuadra la huella que pedía la dirección. Y se
             sirve igualmente: es lo único que hay, y una app con el mundo de
             ayer se ve; una app sin hoja de estilos, no. */
          guardarSiCuadra(e.request, res.clone());
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
