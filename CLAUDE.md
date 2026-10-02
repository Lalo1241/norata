# Norata

La vida tratada como un videojuego. Vive en `https://mi.norata.app`, publicada
con GitHub Pages desde `main`. **Tres módulos:** Misiones (lo de hoy),
Habilidades (suben con la práctica y bajan si las dejas) y **Ramas** (las cosas
grandes, en árboles de **nodos**). Desde la 0.7.146 Ramas junta lo que antes
eran Talentos y Proyectos: una rama es de clase **talento** o **proyecto**, y
se ve como mapa o como lista (ver «Ramas: una sola estructura»). **Ramas no
está el primer día**, y la clase proyecto tampoco: los abre el nivel de
expedición (ver «Lo que llega por el camino»).

## No hay compilación

Ni `npm install`, ni empaquetador, ni paso previo: archivos sueltos que el
navegador entiende tal cual. Tres consecuencias que muerden si se olvidan:

1. **El orden de los `<script>` importa.** Están numerados (`01-base.js` →
   `11-arranque.js`) y el último es el que arranca. Al añadir un archivo hay
   que registrarlo en DOS sitios: `index.html` y la lista `ASSETS` de `sw.js`.
   **Y hay DOS páginas desde 0.7.14:** `index.html` es la app y
   `login/index.html` es la puerta (`00-idioma`, `00b-textos-en`, `01-base`,
   `10-sincronia`, `10a-perfil`, `10b-supabase`, `10c-portada` y `12-login.js`,
   que es el que arranca allí, más `13-nativo.js`). La puerta funciona porque
   **ninguno de esos ejecuta nada al cargarse** —salvo `13-nativo.js`, que
   fuera de la app de Android se sale en su primera línea—; si algún día uno empieza a hacerlo, la puerta
   arrancará media app sin querer. Sus rutas van con `../`, y `logotipoSrc()`
   lo resuelve mirando si existe la app.

   **El número de archivos se CUENTA, no se recuerda.** Aquí ponía «los
   diecisiete» y «seis», y eran treinta y ocho desde hacía versiones: a las dos
   listas se les suman archivos y a las frases que las cuentan no. Cuesta un
   comando y no hay que fiarse de nadie:

   ```sh
   grep -c 'script defer' index.html login/index.html
   ```

   **Y la puerta tiene su propia red de seguridad desde 0.7.138**, en su
   marcado y antes de esos ocho: `window.onerror`, `unhandledrejection`, la
   cola `__tropiezos` y el plazo que destapa la pantalla de carga. No es un
   duplicado por comodidad — **el botón de reportar un fallo vive DENTRO de la
   app**, así que sin esto un error de la puerta era invisible para todos,
   justo para quien no puede entrar a avisar de que no puede entrar. La vacía
   `12-login.js` al final de su arranque, porque aquí no corre
   `11-arranque.js`.
2. **Hay que subir la versión al tocar cualquier archivo de `ASSETS`** (ver
   abajo). Desde 0.7.38 esto no es una buena práctica: es el ÚNICO mecanismo
   por el que una versión llega a un dispositivo. La app se sirve de su propia
   copia y no pide nada a la red; lo único que el navegador vuelve a pedir en
   cada apertura es `sw.js`, y si su `CACHE` no cambió, ese dispositivo **se queda
   en esa versión para siempre**. Antes, olvidarlo servía una copia vieja pero
   la red acababa trayendo lo nuevo; ahora no hay quien lo rescate.
3. **Hace falta servirla por HTTP.** `python -m http.server 8123`. Abrir
   `index.html` con doble clic no funciona.

## La app de Android (desde 0.7.140.1)

Además de la web hay una app nativa de Android hecha con **Capacitor**, en la
carpeta hermana `Norata App Android` —fuera de este repositorio, porque ella SÍ
tiene compilación—. **No carga mi.norata.app: lleva los archivos dentro**, así
que abre sin red y sin pasar por Chrome. Lo que eso cambia aquí:

- **Las versiones le llegan por otro camino.** Al subir la versión,
  `.github/workflows/paquete-app.yml` fabrica un `.zip` y un `ultima.json` en
  los releases del repositorio; `js/13-nativo.js` los mira al abrir, al volver,
  cada quince minutos y al recuperar la red, baja el nuevo por detrás y lo
  estrena en la siguiente apertura, con vuelta atrás sola si arranca roto.
  **Y lo dice (0.7.148.9)**: un aviso con botón cuando hay una lista, otro al
  abrir con una recién estrenada, y el tirón hacia abajo contesta. Antes todo
  eso era mudo y la versión «aparecía de repente». **No hay que hacer nada más que la regla de siempre**:
  subir `VERSION` y `CACHE` juntos. Si no coinciden, el trabajo se niega.
- **Nunca enlazar a una carpeta a secas** (`login/`): allí el servidor no
  sabe servir el `index.html` de una carpeta y devuelve la portada de la app,
  con lo que la página y todo lo que pida sale roto (0.7.140.2). Siempre
  `login/index.html`.
- **Allí no hay service worker** (`enAppNativa` en `11-arranque.js`): se
  pisaría con el paquete.
- **Un archivo nuevo que la app pida tiene que viajar en el paquete.** El
  trabajo comprueba que esté todo lo de `ASSETS`; lo que se pida en caliente y
  no esté ahí, hay que añadirlo a mano a su lista de `cp`.
- **El APK solo se reinstala si cambia lo nativo** (el icono, un permiso, un
  complemento nuevo). Los pasos están en `LEEME.md` de esa carpeta.
- **Los avisos del sistema son nativos (0.7.163).** El WebView no trae la API
  `Notification` del navegador, así que en el APK avisa el complemento
  `AvisosNorata` (`nativo/avisos/`, con su instalador y su `LEEME.md`): el
  reloj del Pomodoro en la cortina, el final de fase con la app cerrada y una
  alarma al empezar cada actividad. **La página decide y lo nativo pinta**:
  textos, iconos y lo que pasa después salen de `js/09d-jornada.js`; lo que se
  toca con la app cerrada se apunta con su hora y la página lo aplica al abrir
  (`jAplicarAvisos`). Un aviso nuevo se añade en la página, no en el Java.
  **Cada aviso tiene dos moldes, plegado y abierto**, con UN marco y Outfit en
  todos los mundos; del mundo solo vienen los tonos, los botones van en la
  menta de Norata (Pausa en amarillo) y con un acento rojo ningún texto es
  rojo. La referencia es la lámina «Avisos de Norata»; las reglas, en el
  `LEEME.md` de `nativo/avisos/`.
- **El icono de la pantalla de inicio sigue al mundo (0.7.145), y solo en el
  APK.** Elegir un mundo o Arcade tapa con la carga (2,5 s mínimo), recarga
  ya con el mundo puesto, avisa (`avisarRenacer`: sin saltarse, cuenta de
  10 s) y reinicia la app con su icono
  (`recargarApp` → `revisarIconoPedido` → el complemento `IconoNorata`). **No
  se reinicia antes de ese aviso**: el WebView escribe `localStorage` al disco
  segundos después, y reiniciar pronto dejaba el mundo a medias (0.7.146.1).
  El mismo instalador deja la pantalla de arranque de Android sin icono: el
  sistema ponía el de siempre en medio al abrir, y rompía la entrada. Lo
  nativo —el complemento, los dieciocho iconos y el trozo de manifiesto— lo
  genera `mundos/iconos/android.js` y se copia a mano a esa carpeta con los
  pasos de `mundos/iconos/android/LEEME.md`. Un APK sin él cambia de mundo
  como siempre y se queda con el icono de la casa.
- **La app abre en el color del tema puesto (0.7.166), no en la noche de la
  casa.** La pantalla de arranque la pinta Android antes de que corra la app,
  así que viaja un tema por cada fondo posible (`res/values/arranque.xml`) y
  el complemento elige el suyo (`IconoPlugin.fondo`, Android 13 o más); la
  página se lo manda con `mandarFondo` (`js/13-nativo.js`). **Al añadir un
  mundo, una paleta o un ambiente, sus dos fondos van en
  `mundos/iconos/arranque-colores.json`** y se corre
  `node mundos/iconos/arranque.js`: si se olvida, ese tema abre en el tono
  más parecido de los que hay, que es justo el cambio a medio camino que
  Eduardo no quiere ver.

## Lo que no se publica

**El repositorio es público, pero la web ya no sirve todo lo que hay dentro.**
Lo decide `_config.yml`, y funciona porque GitHub Pages pasa el sitio por
Jekyll antes de servirlo: lo que esté en su lista `exclude` no llega al sitio
construido. Se comprueba en un segundo — `mi.norata.app/CLAUDE.html` existía y
ese archivo no está en el repositorio; lo generaba Jekyll desde `CLAUDE.md`.

**Por qué se hizo (16 sep 2026).** Hasta entonces cualquiera abría en el
navegador, sin ninguna cuenta, `VERSIONES.md` (670 KB), `CLAUDE.md`,
`supabase/planes.sql`, la función de cobro y `mundos/app.py`. Los cinco daban
200. Eso es el libro de recetas —cada decisión y el fallo que la motivó— y vale
más que el código: el JavaScript dice QUÉ hace la app y esto dice POR QUÉ, que
es lo caro de volver a averiguar.

**El JavaScript se queda público y no hay forma de que deje de estarlo.** Lo
tiene que leer el navegador. No buscarle arreglo ni prometer lo contrario.

**Es una lista de EXCLUSIÓN y no se invierte.** Se nombra lo que no sale, nunca
lo que sí, para que un archivo nuevo se publique solo. Ya hay DOS sitios donde
registrar cada archivo (`index.html` y `ASSETS`); un tercero se olvida, y el
fallo sería un archivo que está en local y falta en producción.

**Lo que NUNCA puede entrar en esa lista**, y cada uno por su motivo:

| Qué | Por qué |
| --- | --- |
| `CNAME` | Es lo que ata el dominio a este repositorio |
| `marca/` (las imágenes) | Los correos ya enviados las enlazan, y Gmail no vuelve a pedir una imagen que ya guardó |
| `correos/04-bienvenida.html` | Lo enlazan esos mismos correos |
| `caminos/caminos.json` | Se pide en caliente, no está en `ASSETS` |
| `css/mundos.css`, `css/ambientes.css` | Son los GENERADOS. Sus fuentes (`mundos/`, `apariencias/`) sí se excluyen |
| `404.html` | Es la pantalla de error propia (0.7.122). Excluida, el 404 vuelve a ser el gris de GitHub — y el número no cambia, así que no se nota |

**Cómo se comprueba, y hay que hacerlo después de publicar.** Aquí no hay paso
de compilación propio donde meter un guardarraíl, así que se mira a posteriori:

```sh
python herramientas/comprobar-publicado.py
```

Pide al sitio en vivo todo lo que `ASSETS` lista —la lista sale de `sw.js`, no
se copia— más lo que se pide en caliente, y comprueba que los documentos den
404. Lleva un **control**: si `index.html` falla, lo roto es la prueba y no el
sitio, porque GitHub Pages tarda un minuto largo en publicar.

**Esto no subió la versión, y es correcto.** No cambió un solo archivo de
`ASSETS`: lo que llega a un dispositivo es byte por byte lo mismo. Subir el
número habría hecho que todo el mundo se volviera a bajar 460 KB para nada.

### La mudanza a Cloudflare, aparcada

Existe una rama **`cloudflare`** con la mudanza entera hecha y probada —
repositorio privado, `_headers` con las cabeceras de seguridad, `publicar.sh`,
y el DNS resuelto con un solo CNAME en GoDaddy—. Eduardo la aparcó el 16 de
septiembre de 2026: no le agrega nada a la app a corto plazo, y lo que de
verdad le preocupaba lo cierra `_config.yml` sin mudarse.

**No se fusiona sin volver a hablarlo**, y al retomarla hay dos cosas: su
número de versión (0.7.122) estará cogido y habrá que renumerar, y su
`publicar.sh` y este `_config.yml` hacen lo mismo por dos caminos — se queda
uno, no los dos.

## La barrera de subidas

**Subir a `main` ya no es, por sí solo, publicar** (0.7.173). `main` es la cola
y `vivo` lo publicado; lo único que mueve `vivo` es
`.github/workflows/barrera.yml`. Es regla de Eduardo y la más dura de todas:
**tiene que ser automática**, no puede depender de que una sesión se acuerde.
Por eso vive en GitHub y no aquí escrita.

**Antes de decirle a Eduardo que algo está subido, se pregunta cómo está el
grifo.** Cuesta un comando y no se da por sabido, porque cambia:

```sh
sh herramientas/barrera.sh
```

| Lo que contesta | Qué le dices |
| --- | --- |
| Grifo ABIERTO | «Subido: llega solo al vivo en uno o dos minutos». No le pidas aprobación: no hace falta |
| Grifo CERRADO | «Está en la cola, esperando tu aprobación en el Puesto de mando → Subidas». **No digas que ya está en vivo** |
| No está instalada | Se trabaja como siempre: `main` se publica solo |

Y cuatro cosas que muerden:

- **Mientras GitHub Pages siga publicando `main`, la barrera no frena nada.** El
  corte lo hace Eduardo (Settings → Pages → rama `vivo`), y el panel avisa
  arriba mientras no esté hecho. `sh herramientas/barrera.sh` habla del grifo,
  no de eso: si hay duda de qué rama se publica, se le pregunta a él.
- **Nunca se sube a `vivo` a mano.** El `pre-push` se niega. Es lo publicado.
- **Un tramo que toca `supabase/*.sql` no sube solo**, ni con el grifo abierto:
  espera a que Eduardo lo suba diciendo que ya lo pegó. Al tocar un `.sql`,
  díselo, además de apuntarlo en «Pendiente de pegar».
- **Se aprueba en orden.** `vivo` solo va hacia delante: un cambio de en medio
  no se salta, se revierte en `main`.

El grifo vive en Supabase (`supabase/barrera.sql`) y el panel lo mueve a través
de la función `barrera`. El paquete de Android sale de `vivo`: lo llama la
barrera, ya no se dispara al subir a `main`.

## Versiones

El número se ve debajo de Ajustes y **las reglas están en `VERSIONES.md`** —
leerlo antes de subirlo. En corto: cuatro tramos, `0.6.2.1`; el 4º pule lo que
trajo SU 3º y nada más, el 3º es una tanda o cualquier tema nuevo aunque sea
chico, el 2º algo que la app no hacía antes, y el 1º llega a `1.0` el día de la
Play Store. **Ningún tramo se para en 9.** **El 4º se decide por TEMA, no por
tamaño** (Eduardo, 0.7.149): de la 0.7.148.1 a la .9 eran siete temas distintos
colgados de Cyberpunk porque cada sesión leía «retoque» como «cambio chico».
**`0.8` está apartado para la beta** y no se coge por acumulación: hasta que
Eduardo lo diga, la cuenta sigue por dentro de `0.7` (`0.7.1`, `0.7.2`…).

Al subirlo: `VERSION` y `VERSION_FECHA` en `js/01-base.js`, `CACHE` en `sw.js`
con el mismo número, una línea en `VERSIONES.md` y **su novedad en
`novedades/novedades.json`, en borrador** (0.7.149).

## Las novedades

**Lo que cambió, contado para quien usa la app**, en `novedades/novedades.json`:
una entrada por 3º, con sus 4º dentro como retoques. La lee la app —una
ventana al estrenar una versión y Ajustes → Novedades (`js/10l-novedades.js`)—
y la leerá la página de changelog del sitio el día que exista.

- **Nada sale sin que Eduardo lo apruebe.** Las entradas nacen en
  `"borrador"` y la ventana que sale al abrir solo enseña `"publicado"`. Las
  reglas para escribirlas, en `novedades/LEEME.md`.
- **El panel de Ajustes sí enseña los borradores, y es provisional (0.7.155)**:
  `NOVEDADES_BORRADORES_A_LA_VISTA` está en `true` porque hoy solo usa la app
  Eduardo. **Se apaga antes de la beta.** Las herramientas de prueba (la
  ventana, los anuncios de hito) siguen con `?novedades=borrador`.
- **Se apuntan como vistas POR ENTRADA, no por versión**: una aprobada días
  después sale igual.
- **Cada entrada tiene `clase` (0.7.151): `expansion`, `mejora` o `arreglo`**,
  por lo que le cambia a quien usa la app y no por el número. Un arreglo no
  abre ventana. Las grandes pueden llevar `imagen` (en `novedades/img/`, que
  nunca se sobrescribe) y `grafico` (datos, no dibujo).
- **La beta y la 1.0 tienen su propio anuncio (0.7.152, rehecho en 0.7.153)**:
  la clase `hito` abre una escena a pantalla completa en vez de la ventana
  (`abrirHito`), una vez por persona, con el estilo del mundo puesto pero el
  número y el texto SIEMPRE en `--sans` (en Arcade y Averno «Beta» no se
  leía). El número desfila por cada 3º publicado (`camino` + las entradas).
- **Los gráficos de una novedad son datos en cuatro formas** (`cifras`,
  `comparar`, `barras`, `colores`), cada dato en uno de los ocho tonos de la
  app. Si una novedad habla de colores, lleva un bloque `colores`. Sus borradores ya están escritos; se prueban con
  `?novedades=borrador`. Y la etiqueta «Alpha» del número cambia sola a «Beta»
  en la `0.8` y se va en la `1.0`.
- **El changelog del sitio sale del mismo JSON**: el sitio es Framer, y
  `herramientas/novedades-framer.py` escribe el CSV para su CMS y dibuja los
  gráficos como SVG. Nada se escribe dos veces.
- **«Ya está lista la versión X» es una tarjeta que se queda**
  (`avisoVersionLista`), en la web del teléfono y en el APK. En la computadora
  sigue el botón de la barra lateral.

**Las fechas van en hora de México, siempre** — no en UTC ni en la del reloj de
la máquina que toque. Ya se coló tres veces desde una sesión que commiteaba en
UTC, y con eso la lista deja de leerse en orden. Solo muerde entre las 00:00 y
las 06:00 UTC. México es UTC-6 todo el año, sin horario de verano desde 2022.

**Y el comando para saber qué hora es depende de DÓNDE estés corriendo**, que
es lo que casi convierte esta regla en su propio fallo. Hay dos entornos y cada
uno rompe con el comando que al otro le funciona:

| Dónde | Qué usar | Por qué |
| --- | --- | --- |
| El Git Bash de Eduardo (Windows) | `date` a secas | Su reloj ya está en México, y este Bash **no trae la base de husos**: ignora `TZ` en silencio y contesta en UTC |
| Una sesión en la nube (Linux) | `TZ=America/Mexico_City date` | Ahí el reloj de la máquina **es UTC**, así que `date` a secas es justo lo que la regla prohíbe |

**Antes de fechar nada, se pregunta cuál de los dos es** — cuesta un comando y
no hay que acordarse de nada:

```bash
TZ=Asia/Tokyo date "+%z"     # +0900 → TZ funciona; +0000 → TZ se ignora
```

Si contesta `+0900`, la hora buena es `TZ=America/Mexico_City date "+%-d %b %Y
| %H:%M %z"`. Si contesta `+0000`, es `date "+%-d %b %Y | %H:%M %z"`. En los dos
casos se confirma igual: **el desfase tiene que decir `-0600`**, y si dice otra
cosa, la fecha que ibas a escribir está mal.

Las dos mitades de esta tabla las descubrió cada una su sesión, y por separado
cada una escribió aquí que la suya era «la buena». La primera versión decía que
`TZ` no sirve y punto; una sesión en la nube que la hubiera seguido al pie de la
letra habría fechado en UTC —o sea, el día siguiente entre las 18:00 y la
medianoche—, que es exactamente el fallo del que avisa el párrafo de arriba.

## Cómo verificar

**El panel del navegador suele no componer imagen** en algunos entornos y las
capturas fallan. No bloquea nada: se verifica **midiendo el DOM**, que además
es mejor evidencia que mirar una imagen. En vez de juzgar si «se ve bien»,
comprobar números:

```js
document.documentElement.scrollWidth > innerWidth   // ¿desborda de lado?
getComputedStyle(el).backgroundColor                // el color, leído, no supuesto
caja.getBoundingClientRect().top - cap.getBoundingClientRect().top  // >= 0
```

**Recargar la misma pestaña NO es abrir la app**, y creerlo cuesta una tarde.
Medido con `performance.getEntriesByType("resource")`: en una recarga, las
hojas de estilo salen de la caché del navegador con `workerStart` en cero —o
sea, sin pasar por el service worker—; en una pestaña nueva sí pasan por él y
salen de su almacén (`deliveryType: "cache-storage"`). Cualquier prueba sobre
la caché tiene que abrir pestaña nueva, o mide otra cosa.

**Y la trampa que sale de ahí: sin componer fotogramas, las TRANSICIONES no
avanzan nunca.** Se quedan en `playState: "running"` para siempre y
`getComputedStyle` devuelve el valor de PARTIDA, no el de destino. Da igual
cuánto se espere. Se ve como un CSS que no se aplica: al plegar la barra, el
`opacity: 0` de una regla parecía no llegar mientras el `background` de esa
MISMA declaración sí — porque el fondo no tenía transición y la opacidad sí.
Media hora buscando un problema de especificidad que no existía.

Antes de dudar del CSS, saltar las animaciones al final y volver a medir:

```js
document.querySelectorAll("*").forEach(e =>
  e.getAnimations && e.getAnimations().forEach(a => { try { a.finish(); } catch (x) {} }));
```

La pista que lo delata: `el.getAnimations()` devuelve transiciones `running`
que no terminan. Y afecta a todo lo que se anime — el ancho de la barra
plegada medía 246 px en vez de 84 por lo mismo.

**Y la hermana de esa trampa, que es al revés: medir MIENTRAS una animación
avanza.** Hay que saltarlas antes de CADA medición, no solo antes de la
última. El salto del botón de Google (0.7.123) salió primero en 7-8 px y no
había ningún salto: la medición pillaba la animación de entrada del paso a
medio vuelo, así que lo que se leía era su `translateY` y no la maqueta. Dos
vueltas buscando una maqueta que estaba bien.

Y contrastar con un control conocido: al comprobar si algo ya está publicado,
pedir también un archivo que ya funcionaba. Si el control falla, lo que está
roto es la prueba, no el archivo.

**Que la app cargue rápido no dice nada de la red: dice que tiene copia.** Es la
otra cara de «de la copia primero» (0.7.38), y hay que tenerla presente cada vez
que se mire si algo llegó al dispositivo. La app se sirve de su propio almacén y
no le pide nada a la red, así que **incomunicada abre igual de rápido y se ve
perfecta**; lo único que se congela es el número de la versión.

Costó una mañana entera (23 sep 2026). El teléfono de Eduardo llevaba días en
una versión vieja, y las tres lecturas que hicimos se contradecían entre ellas —
porque **las tres salían de una copia y ninguna tocó el servidor**:

| Dónde | Qué se vio | Qué decía en realidad |
| --- | --- | --- |
| Chrome, la app instalada | 0.7.127.2, al instante | su copia, del día anterior |
| Opera | 0.7.123.1, al instante | su copia, de cinco días antes |
| Opera «en incógnito» | otra vez una vieja | su privado no separa el almacén como el de Chrome |
| **Chrome en incógnito** | **la barra colgada para siempre** | **el único dato limpio: sin copia, hay que ir a la red, y la red no contestaba** |

Lo peor fue el segundo renglón: que otro navegador abriera al instante pareció
demostrar que el sitio estaba bien, y con eso se cerró en falso el diagnóstico.
Lo único que demostraba es que ese navegador también tenía lo suyo guardado.

**La regla que queda: la única medición que habla de la red es la que NO puede
salir de una copia.** Un navegador donde la app nunca se abrió, o un incógnito
de verdad, y con un `?x=` pegado a la dirección para que ninguna caché conteste
por ella. Cualquier otra cosa mide el almacén, no el servidor.

Y dos trampas dentro de la trampa:

- **Dentro del alcance del service worker, la dirección la atiende ÉL**, aunque
  te la inventes: si no la tiene y la red falla, contesta `Response.error()`, que
  el navegador enseña como `ERR_FAILED`. El error es verdadero —la red falló—
  pero está medido desde dentro, así que no distingue la red del worker.
- **Si el entorno no tiene salida a internet, el control conocido también falla**
  — y eso es lo que hay que leer antes de concluir nada. Aquí pedir
  `mi.norata.app/index.html` dio cero, igual que el archivo que se investigaba:
  lo roto era la prueba. Es la misma regla del párrafo de arriba, y salvó de dar
  por caído un sitio que estaba perfecto.

El final: no era el sitio, ni GitHub, ni Supabase, ni la versión recién
publicada. **Eran los datos móviles de ese teléfono, que no alcanzaban el
origen; por wifi entró sola.** De ahí salió la 0.7.128.2, que es lo que impide
que vuelva a costar una mañana: el tirón hacia abajo ya no se calla cuando no
alcanza a Norata.

Probar **el caso vacío y el extremo**, no solo el feliz: un perfil recién
creado, un nombre de 200 letras, la pantalla a 480 px de alto. Ahí han salido
todos los fallos reales.

## Antes de tocar lo que se ve: una prueba con enlace

Cuando un cambio pueda estropearle la experiencia a alguien —y sobre todo
cuando la decisión sea de Eduardo y no mía—, **no se sube y ya: se sube
apagado, detrás de un parámetro en la dirección.** Se lo pidió él después de
probarlo así con los tonos del modo claro (0.7.3.1).

La receta, que cabe en veinte líneas:

1. Una clase en `<html>` que cambia solo variables (`html.claro.crudo`).
2. En el script de arriba de `index.html`, junto al modo claro: leer
   `?loquesea=valor`, guardarlo en **`sessionStorage`** —no en localStorage,
   para que no se quede pegado como si fuera un ajuste— y poner la clase.
   Ahí arriba y no en el script principal, o se ve el fogonazo.
3. Un rótulo fijo que recuerde que la pestaña está en modo prueba. Sin él es
   fácil olvidarlo y acabar juzgando la app de verdad por lo que se ve ahí.
4. Dos enlaces para él: uno que lo enciende y otro que lo apaga.
5. En `VERSIONES.md`, la lista exacta de qué hay que borrar después.

Nadie que no pida la prueba se la encuentra, y con la pestaña cerrada
desaparece. **Al quitarla, borrar por nombre y no por rango**: la primera vez
se cortó de "aquí" a "allá" y se llevaron por delante cuatro bloques que
estaban en medio y no tenían nada que ver —entre ellos `cambiando-modo`, que
es lo que evita que los colores se queden congelados—. Lo cazó la medición
del DOM, no la vista.

## Trampas que ya costaron horas

- **Una transición sobre una propiedad cuyo valor sale de una variable se
  queda congelada.** Chrome no detecta el cambio y deja el color clavado en el
  inicial para siempre. Ya mordió tres veces: los selectores, el botón de
  Ajustes que no se encendía, el botón de confirmar un borrado que salía
  **verde** en vez de coral, y el cambio de modo claro/oscuro, que dejaba
  media app con el color viejo puesto. **Se arregla quitando la transición**
  — apuntar a `background-color` en vez de `background` no sirve. Cuando hay
  que cambiar muchas variables de golpe, la clase `cambiando-modo` las apaga
  todas durante un turno (ver `ponerTema` en `js/01-base.js`).
- **`align-items: center` esconde para siempre la parte de arriba de un hijo
  más alto que el contenedor.** El desplazamiento no llega a negativos. Se
  centra con `margin: auto` sobre el hijo.
- **Comparar el archivo local con el publicado da distinto aunque sea el
  mismo:** el árbol de trabajo está en CRLF y GitHub sirve LF. Comparar sin
  los retornos: `tr -d '\r' < archivo | md5sum`.
- **GitHub Pages tarda un minuto largo en publicar.** Un archivo recién subido
  que no carga no está roto: aún no ha desplegado.
- **No verificar DNS con `nslookup`** — devuelve respuestas cacheadas. Usar
  `dns.google/resolve`.

## Marcas de conflicto

**La 0.7.148 llegó a `main` con un conflicto sin resolver dentro de `sw.js`**
(30 sep 2026): `<<<<<<< HEAD`, las dos líneas de `CACHE` y `>>>>>>>`. Salió
de un rebase donde se hizo `git add` sin resolver nada. Un service worker con
dos `const CACHE` no arranca, así que esa versión no se habría instalado en
ningún dispositivo. La paró de rebote el trabajo del paquete de Android, con
un error que hablaba de VERSION y CACHE y no del conflicto. Se arregló en 19
segundos, pero por suerte.

Desde entonces hay tres redes, y todas usan el mismo
`.githooks/marcas-de-conflicto.sh`:

| Dónde | Qué para |
| --- | --- |
| `.githooks/pre-commit` | un commit con marcas |
| `.githooks/pre-push` | **la que importa**: `git rebase --continue` NO ejecuta pre-commit (comprobado), y fue un rebase lo que lo coló |
| `.github/workflows/conflictos.yml` | lo que llegue de una máquina sin los hooks. En una rama o un PR avisa antes de fusionar; en `main`, ya tarde, pero diciendo qué es |

**Los hooks no se activan solos al clonar**: Git no los lee del repositorio
sin que se le diga. En cada copia nueva, una sola vez —y **una sesión en la
nube, que siempre es una copia nueva, lo corre antes de su primer commit**—:

```sh
git config core.hooksPath .githooks
```

No va en `.claude/settings.json` como hook de arranque porque `.claude/` está
en `.gitignore` a propósito: es configuración local de cada máquina.

`.gitattributes` los fija en LF: en el árbol CRLF de Windows, `sh` no
entiende el retorno de carro y fallarían. Saltárselos a propósito es
`git push --no-verify`, y no debería hacer falta nunca.

## El sonido

**Un sonido solo suena si lo estás viendo pasar.** Es de Eduardo (0.7.133.1):
la app sonaba varias veces seguidas sin que él supiera por qué, porque no la
estaba mirando. El navegador congela el audio de una pestaña de fondo y lo
programado mientras tanto suena todo junto al volver.

Por eso **todo sonido pasa por `puedeSonar(ctx)`** (`js/01-base.js`), una vez
por sonido y antes de crear nada: con la app fuera de la vista no suena, con
el audio dormido tampoco (se despierta y ese se pierde), y nunca más de tres
en segundo y medio. Lo que tenga que avisar de fondo lo hace el aviso del
sistema, que trae su propio sonido y su motivo escrito.

**Desde 0.7.140 toda la app suena, y todo sale de `js/01c-sonido.js`**: un
solo motor, sintetizado (pesa cero, nada en ASSETS), con `sonar(momento)`. Las
reglas están escritas arriba de ese archivo y son de Eduardo; las que más
muerden:

- **Suena lo que lograste, no lo que tocaste.** Nada suena a «fallaste».
- **El techo de los agudos**: ninguna nota por encima de 1,1 kHz; un armónico
  agudo solo si es bajito y corto. Lo agudo sostenido marea con auriculares, y
  cortar también lo corto deja todo apagado.
- **Sin ruido y sin saturar**: los dos se oyen como «pixeloso» o «un bug».
- **Un mundo cambia el material, no el momento**, y lo decide la apariencia
  puesta. Hay UN interruptor (`settings.sonido`, en la cuenta) y el volumen va
  por dispositivo.
- **Los recaps del aniversario no se tocan**: tienen voces propias.

## Lo que entra de fuera

**Los datos llegan por tres puertas y dos no son tuyas**: un respaldo que
alguien te pasó (`importData`, `js/09-inicio.js`) y lo que baja de la
sincronía. Hasta 0.7.139 `importData` comprobaba dos cosas —que `skills`
fuera un array y que la versión no viniera del futuro— y el resto entraba tal
cual.

**Lo que eso costaba, medido:** un respaldo con
`missions[0].color = '#fff" onmouseover="…"'` entra, y al abrir Misiones ese
atributo se sale de su comilla y el código corre. Desde ahí lee la sesión
—`access_token` y `refresh_token` viven en `localStorage`— y aunque la CSP
corta `fetch`, `img` y `sendBeacon`, **no mira la navegación**, así que un
`location.href` a otro dominio se lo lleva.

**El texto que escribe una persona nunca fue el problema.** 16 campos por 3
cargas en 8 pantallas: cero. `escapeHtml`, `escapeAttr` y `enJS` están bien
puestos. Fallaban los que el código da por «de máquina» —`id`, `color`— y por
eso no escapa; un respaldo los trae igual que los otros.

Lo cierra `sanearEstado()` (`js/01-base.js`), llamado desde `load()`, que es
**la única puerta por la que los datos llegan a memoria**: el disco al abrir,
un respaldo importado y lo que baja de la sincronía pasan los tres por ahí. Un
sitio en vez de los doscientos donde se pinta.

Tres cosas que no se pueden tocar sin entender por qué están:

- **Valida por CARÁCTER, no por forma.** Pedir que un id case
  `/^[a-z0-9]{6,24}$/` es una apuesta sobre datos que no has visto —hay
  módulos que se llaman `tree`, tableros de fábrica, refs con dos puntos
  dentro— y **una validación estricta de más corrompe datos reales, que es
  peor que el agujero**. Un carácter no es una apuesta: ningún valor de
  máquina legítimo lleva `< > " '` ni una barra invertida. Quitarlos de un
  valor bueno es siempre una operación vacía, y eso se comprueba.
- **Lo libre es la EXCEPCIÓN, no al revés.** `CAMPOS_LIBRES` son los nombres
  de campo que alguien escribe; `MAPAS_LIBRES` son los dos sitios donde el
  texto libre vive como VALOR de una clave de máquina (`ui.nombresTablero`,
  `jornada.cfg.hfNombres`) y por nombre de campo no se reconocen. **Al añadir
  un campo que alguien escriba, va en una de las dos listas.** Se eligió así
  porque olvidarse deja unas comillas caídas, que se ven; con la lista
  invertida, lo que se olvida queda abierto y no se ve nunca.
- **Vive ARRIBA de `let state = load()`, y no es colocación.** Un `const` no se
  iza: declarado debajo, esa primera llamada lo encuentra en zona muerta,
  revienta, y `state` se queda sin declarar — la app no arranca y la consola
  habla de `state`, no de esto.

**Cómo se comprueba que no rompió nada:** un estado realista —el ejemplo
sembrado, con `'`, `"`, `<`, `>` y `\` metidos en TODOS los campos libres y en
los dos mapas— entra y sale idéntico byte por byte. En 0.7.139 fueron 27 567
caracteres sin una diferencia. Un «no cambió nada» aquí significa algo.

## Ni dentro de un marco ajeno

**La app se dejaba meter en un `<iframe>` de cualquier sitio** —medido, sin
una queja—, que es clickjacking: otro la pone invisible debajo de su página y
te hace pulsar lo que él quiera.

**`frame-ancestors` no sirve aquí y hay que saberlo antes de escribirla.** Es
la directiva que existe justo para esto y es de las que **el navegador IGNORA
dentro de un `<meta>`**: solo vale como cabecera HTTP, y GitHub Pages no deja
poner cabeceras. Puesta en la CSP quedaría escrita y sin efecto, que es peor
que no tenerla. (El día que se retome la rama `cloudflare`, su `_headers` sí
puede llevarla — y entonces esto de abajo sobra.)

**Y saltar fuera del marco tampoco basta:** `top.location = self.location` lo
BLOQUEAN los navegadores desde un marco de otro origen sin un gesto de la
persona, o sea justo en el caso que importa. Se intenta igual porque cuando
funciona es la mejor salida, pero lo que protege es lo otro: **la página nace
escondida (`html { display: none }`) y un script de dos líneas la enseña solo
si no está dentro de un marco.** Eso no hay manera de bloquearlo. Está en las
dos páginas, arriba del todo, antes de las hojas de estilo.

El modo de fallo se miró antes de meterlo: si ese script no corriera, la
página quedaría en blanco. No añade riesgo nuevo —sin JavaScript esta app no
pinta nada de todos modos— y el `<noscript>` de al lado devuelve el
comportamiento de siempre a quien lo tenga apagado.

## El Puesto de mando

**La consola de administración es una capa aparte (`#dentro`), no una sección
de Ajustes** (0.7.167; se llamaba «Norata por dentro» hasta la 0.7.171). La
abre `abrirDentro()` de un toque desde la fila de Ajustes y desde el mini menú
—`mostrarAjuste` y `abrirAjustes` la desvían—, y todo lo suyo vive en
`js/10e-panel.js` y `css/dentro.css`, con el prefijo `dn-`: la app ya tiene
`.panel`, `.seg`, `.chip` y `.btn`, y los archivos comparten ámbito. Va solo en
español y sin `tx()`.

**Se ve SIEMPRE en Norata Clásico, tengas el mundo que tengas** (Eduardo,
0.7.171: «sí o sí»). Un mundo no solo cambia variables: viste `h2`, `b`,
`button` y `textarea` a secas, así que redeclarar los tonos no basta. Lo
sostienen tres cosas, y al tocar `css/dentro.css` no se rompe ninguna:

- los tonos de la casa, redeclarados en `#dentro` en sus dos caras;
- **toda regla cuelga de `#dentro`**: un identificador gana a cualquier selector
  de mundo. Una regla nueva que empiece por `.dn-` a secas pierde contra el
  mundo y nadie lo nota en la casa;
- **ninguna clase de la app** dentro de la capa: sus botones son `.dn-btn`.

Se comprueba con una foto de los estilos calculados de todas sus pantallas, con
la casa y con cada mundo y Arcade, de noche y de día: tienen que salir
idénticas. En la 0.7.171 fueron 1 261 elementos y cero diferencias.

Cinco salas —Hoy, Buzón, Subidas, Números y Laboratorio— y cuatro reglas que
puso Eduardo sobre el boceto y valen para cualquier cosa que se añada:

- **Solo se dibuja lo que el servidor da.** Sin dato real no hay sala, ni
  pestaña, ni cifra de ejemplo. Lo que falta está en `VERSIONES.md`, «Apuntado
  y sin hacer».
- **Cada explicación se dice una vez.** Una frase que se repite en cada fila
  sobra en todas: va en la cabecera.
- **Ni un hueco dentro de una tarjeta.** En una fila de dos, la gráfica o la
  lista crece hasta llenar la suya; por eso `dnDibuja` pasa dos veces.
- **El color es un juicio y sale de `--casa-*`**: oro lo que hay que mirar,
  coral lo que se pierde, menta lo que llega a la vara. Lo demás, tinta normal.

Al añadir una prueba con enlace a la app, **su fila va en `DN_PRUEBAS`**, con
cómo saber si está encendida. Y un tipo de reporte nuevo son DOS filas: una en
`REP_TIPOS` (`js/09-inicio.js`), que es el formulario, y otra en `DN_TIPOS`,
que es el buzón. El tipo viaja dentro del mensaje (`[Lugar|tipo] …`).

**El panel funciona con el SQL pegado y sin pegar.** Los estados del buzón, los
rangos de 30 y 90 días y la curva de retención dependen de columnas y campos
que solo existen cuando Eduardo pega el SQL a mano. El panel mira si la
respuesta los trae (`t.estado !== undefined`, `m.retencion`, `dias.length`) y,
si no, ofrece lo de antes. **Al añadir algo que pida SQL, se hace igual**: una
versión de la app llega sola y un `.sql` no.

**Sin sesión de administrador no hay números**, así que se prueba imitando la
respuesta de `metricas()` en la consola, en sus dos formas: `esAdmin = true`,
`metricasCache = {…}` y `abrirDentro()`.

## Los interruptores

**Todo interruptor se desliza, y lo hace el motor** (Eduardo, 0.7.154): vale
para los de hoy, los que vengan y cualquier mundo. No se escribe una animación
por pantalla: `instalarDesliza()` (`js/01-base.js`) pone un solo oyente y anima
cualquier control que se parezca a los que ya hay. Corre en las dos páginas:
lo enciende `11-arranque.js` en la app y `12-login.js` en la puerta.

**Por qué no es una transición de CSS:** casi todos se redibujan al tocarlos
(`innerHTML`), así que el elemento encendido deja de existir y no hay nada que
el navegador pueda animar. El motor apunta dónde estaba ANTES del redibujado y
anima sobre el DOM nuevo.

**Viaja UNA pastilla, y rebota sin salirse.** Es una copia vacía de la opción
encendida —así la pinta el mundo que esté puesto— que va de la vieja a la
nueva mientras los rótulos se funden encima. El canto de delante llega y se
para; el de atrás se pasa hacia dentro y vuelve: se estira al salir y se
aplasta contra la pared al llegar. Lo primero que hubo no movía nada —destapaba
la opción nueva con un recorte y retiraba una copia de la vieja— y a media
animación eso eran dos trozos encendidos con el hueco del control en medio;
en Averno y Catedral, a saltos. Eduardo lo mandó en una captura. **No volver
a las dos mitades, ni a una curva con sobrepaso**: esa saca la pastilla por el
borde del control, que es donde acaba casi siempre.

Al escribir uno nuevo, entra solo si cumple una de estas dos formas:

| Figura | El contenedor | Lo encendido |
| --- | --- | --- |
| Opciones en fila | casa con `DESLIZA_GRUPOS` (`role="radiogroup"`, `role="tablist"`, `.seg`, `.tema-sw`…) o lleva `data-desliza` | `.on`, `.active` o su `aria-checked` / `aria-selected` / `aria-pressed` |
| Perilla de encender/apagar | un `button` | la bolita casa con `.mod-sw i` o lleva `data-perilla`; si es el `::after` de un elemento, ese elemento va en `DESLIZA_PERILLA_PSEUDO` o lleva `data-perilla-after` |

Si un control nuevo no encaja, **se amplía una de las listas de arriba de
`instalarDesliza`**, no se le pone una animación suelta. Cinco cosas que
muerden:

- **Se anima en el mismo turno en que el control se redibuja**, con un
  `MutationObserver`, y no con un temporizador: entre el toque y el
  temporizador el navegador pinta un cuadro con el control ya en su estado
  final, y la pastilla volviendo a salir de la opción vieja se ve como un
  parpadeo. Por lo mismo las opciones apagadas se FUNDEN debajo de la
  pastilla: una encendida translúcida sustituye el fondo de la apagada, no se
  le pone encima, y con la apagada entera debajo el tono saltaba en el primer
  y el último cuadro.
- **Solo se desliza un grupo con UNA opción encendida.** Con varias (los
  días del Pomodoro con la rutina vinculada) no hay pastilla que viaje y el
  cambio va de golpe. Y una marca que es de la opción y no de la selección
  —el punto de «hoy»— se le quita a la pastilla en el CSS de su pantalla.
- **Sin `transition` en el CSS del control.** Se sumaría a la del motor y la
  bolita haría el viaje dos veces el día que el control deje de redibujarse.
- **El peso son dos variables que se leen del CONTROL y se heredan**:
  `--desliza-rebote` (0,65; 0 es sin rebote) y `--desliza-lento` (por cuánto
  se multiplica la duración base del mundo, que sale de `--dur-media` acotada
  entre 300 y 480 ms). **Los números los eligió Eduardo en el boceto, control
  por control, y no se cambian por gusto**: 3 las opciones en fila, 2 las
  perillas (`.mod-sw`), 4 la hoja del Pomodoro (`#jornada-hoja`). Para darle
  otro peso a una pantalla se declara en su contenedor, no en el motor.
  **Son dos mandos y no se tocan entre sí**: el rebote cambia cuánto se pasa
  la pastilla, nunca cuánto tarda en llegar. La primera versión sacaba las
  dos cosas de la amortiguación del muelle y bajar el rebote frenaba el viaje
  entero. `--curva` ya NO se usa aquí, porque a saltos no hay rebote. Con
  «menos movimiento» no se mueve nada.
- **Las copias llevan `data-desliza-copia`** y las recorta `css/estilos.css`:
  «pastilla» es el material sin rótulo y «rotulo» la letra sin material. Un
  mundo que encienda una opción con algo que esas reglas no quitan (un dibujo
  en un hijo, por ejemplo) lo verá doble medio segundo: se arregla ahí.

**Cómo se prueba, que no es mirando:** el panel no compone fotogramas, así que
las animaciones no avanzan y lo que limpia las copias es el temporizador de
respaldo, no el final de la animación. Se pausan, se les pone `currentTime` a
mano y se mide la pastilla cuadro a cuadro: nunca fuera de la caja del grupo,
y el último cuadro igual a la opción de verdad. Con `--desliza-dur: 14s`
puesto en `<html>` da tiempo a sacar una captura a medio viaje.

## Las capas

**Ningún `z-index` se escribe a mano:** salen de variables `--piso-*`
declaradas juntas en `:root` de `css/estilos.css`, con la regla al lado — *lo
que abre algo va siempre por debajo de lo que abre*. Al añadir una ventana:
un `--piso-*` nuevo, y una línea en `CAPAS_QUE_TAPAN` (`js/01-base.js`), que
es lo que para la página de detrás. Nada más: no hay que acordarse de parar ni
de soltar.

## La paleta

Dos caras y los mismos tonos. La app nace de noche; el **modo claro** se
elige en Ajustes (clase `claro` en `<html>`) y usa los tonos oscuros, que son
los mismos que ya usaban los correos —viven en la bandeja de otro—.

**Escribir con un acento no es rellenar con él.** De noche el mismo tono hace
las dos cosas; de día no puede: el verde de la marca escrito sobre papel da
1,87 sobre 1. Así que cada acento se parte en dos, y las dos mitades salen del
mismo tono vivo —mismo matiz, misma saturación, distinta luz—:

| | Noche | Día: rellenar (`-macizo`) | Día: escribir y trazar |
| --- | --- | --- | --- |
| Menta | `#5fe0b0` | `#00cc7f` | `#007046` |
| Amarillo luciérnaga | `#f5d76e` | `#f5c314` | `#755c05` |
| Coral | `#ff8a70` | `#ff603d` | `#bd2200` |
| Celeste | `#8ecdf5` | — | `#0f688f` |

Sobre un relleno macizo la tinta es **oscura** en los dos modos, porque los
tres tonos vivos son claros en los dos modos — y son DOS variables, no una:
`--sobre-macizo` va encima del ACENTO y `--sobre-vivo` encima de la luciérnaga,
el coral, el lila y los ocho del usuario. Se partieron en 0.7.55 porque Tinta
tiene un acento casi negro: su bloque tiene que poner clara la tinta de encima,
y con una sola variable eso dejaba claro sobre claro el amarillo y el coral,
que en Tinta siguen siendo vivos. Los correos
siguen con la menta `#136b4e` que ya tenían.

**`--carril` no es `--line`.** Un borde tiene que apenas notarse; el carril de
un aro o de una barra tiene que dejar ver por dónde va lo lleno. De noche
coinciden; de día no pueden, porque encima del carril hay que distinguir ocho
colores y con el tono de los bordes el amarillo se perdía dentro (1,05).
| Fondo | `#10151d` | `#dcdef0` (los correos, `#f2f4f8`) |
| Tarjeta | `#1d2530` | `#f2f0f9` |
| Levantado | — | `#f7f8fa` |

Los tres fondos de día los eligió Eduardo. **La tarjeta siempre queda por
encima del fondo**: el degradado de la página se mueve entre `#e3e5f2` y
`#dcdef0`, los dos por debajo de `#f2f0f9`. Si algún día se aclara el
degradado por arriba, las tarjetas se hunden en la mitad de arriba de la
pantalla y flotan en la de abajo.

**Sobre blanco hay que usar la versión oscura**: la menta de la app sobre
blanco da 1,7 sobre 1. Al inventar un tono para fondo claro, calcular el
contraste antes de usarlo (umbral 4,5 para texto normal).

**Ningún color se escribe suelto dentro de una regla.** Todos salen de las
variables de `:root` en `css/estilos.css`, y el modo claro se hace cambiando
esas variables y nada más — incluido el árbol de talentos, que se dibuja
desde JavaScript y lee `var(--...)` en los atributos del SVG. Al añadir un
tono nuevo: se declara arriba, con su pareja clara en `html.claro`.

**Los ESTADOS no son del mundo: son de Norata, y hablan con psicología del
color.** Es de Eduardo (0.7.143.4), y vale para todo mundo, ambiente y paleta
que exista o se invente:

| Estado | Tono | Variables |
| --- | --- | --- |
| Hecho, logrado, el check | verde Norata | `--estado-hecho`, `-tinta`, `-soft` |
| En curso, en progreso, vence pronto | amarillo | `--estado-curso`, `-tinta`, `-soft` |
| Perdido, fallado, estancado | coral | `--estado-fallo`, `-tinta`, `-soft` |

La tinta encima de un relleno de estado es `--sobre-estado`, oscura siempre.
**Nunca se pinta un estado con el acento (`--mint`)**: el acento es lo que cada
mundo cambia, y así la palomita de un talento logrado salió ROJA en Catedral y
Averno — y el rojo se lee como incompleto o fallado, justo lo contrario de lo
que decía. Ningún mundo ni ambiente redefine `--estado-*`: `mundos/app.py` y
`apariencias/css.py` se niegan a generar uno que lo intente. Al añadir un
estado nuevo, se le busca su tono por lo que significa, no por el mundo.

**Una apariencia no cambia solo los tonos: cambia CUATRO familias**, y las
tres últimas se descubrieron una por una porque nadie las declaraba y el fallo
se veía como «no cambió nada» o «cambió solo en medio»:

| Familia | Qué pinta | Ojo |
| --- | --- | --- |
| `--bg`, `--card`, `--text`… | los tonos | lo que ya se declaraba |
| `--fondo-pagina`, `--fondo-raiz` | el SUELO de la página | `--sup-pagina` sale de aquí, no de `--bg` |
| `--orbe-1/2/3` | las tres manchas de luz | llevan la transparencia dentro |
| `--lienzo-*` | el mapa de talentos entero | ocho, y la pantalla que más se mira |
| `--sup-hondo`, `--borde-panel` | el suelo y el marco de lo GRANDE | el lienzo, la tarjeta de una rama, las columnas del tablero |

**El fondo de un mapa es SIEMPRE un tono liso más los puntitos de
orientación.** Donde se vean nodos —el árbol de talentos, las ramas de
proyectos, el previsualizador y la pantalla completa—, nunca una textura ni un
dibujo: sobre un lienzo eso no es carácter, es suciedad, y compite con lo único
que hay que leer ahí. Un mundo cambia el TONO de ese suelo (`--lienzo-suelo`),
no le pone forro encima. **Ese suelo (`--sup-hondo`) no vale lo mismo que el
fondo de la página**: se separa de él en la dirección que deja ver el marco —de
noche un pelo más claro, de día un pelo más oscuro—, porque valiendo lo mismo
el encuadre desaparece. Y **la tarjeta de una rama es de una pieza**: la barra
de arriba y la tira de abajo llevan el mismo suelo que el centro, o se ve
parcheada. Las dos cosas las paró Eduardo en la primera mirada (0.7.55.1).

**Y desde 0.7.71.5 hay una excepción, que es de Eduardo: en el modo claro de la
CASA, las secciones donde salen nodos van en `--lienzo-suelo` (`#e7e9f4`), más
claras que la página y no más oscuras.** No rompe la regla de arriba —lo que
esa regla pide es que se SEPAREN, y separan igual: 1,10 contra el 1,07 que
daban antes—, solo cambia de dirección, y de paso deja una escala de tres
peldaños que antes no existía: página `#dcdef0` → lienzo `#e7e9f4` → tarjeta
`#f2f0f9`. Vale solo ahí: de noche, y en cualquier mundo o ambiente, manda
`--sup-hondo` como siempre.

**Un tono que sale de una variable no llega solo a donde se usa.** `--sup-pagina`
vale `var(--fondo-pagina)`; cambiar `--bg` no cambia el suelo. Al inventar un
tono, buscar quién lo lee de verdad.

Cuatro cosas que hay que saber antes de tocarlo:

- **Los ocho colores que elige el usuario** tienen dos caras, declaradas como
  `--paleta-1` … `--paleta-8`: la de noche (pastel) y la de día (saturada).
  El color guardado en los datos no cambia nunca; lo que cambia es con cuál
  se pinta, y eso lo deciden tres ayudantes de `js/01-base.js`:

  | | para qué | umbral | ejemplo |
  | --- | --- | --- | --- |
  | `pinta(c)` | rellenar una superficie | — | un icono cuadrado, un chip |
  | `tinta(c)` | escribir | 4,5 | un número, un rótulo |
  | `trazo(c)` | dibujar una LÍNEA | 3 | un aro, un contorno, una barra |
  | `velo(c, "22")` | el fondo tenue de una pastilla | — | `.ms-ic` |
  | `relleno(c, "22")` | el relleno de una FIGURA del mapa | — | un nodo del árbol |
  | `tonos("mc", c)` | las dos primeras de golpe | — | `style="${tonos(…)}"` |

  **La regla que decide entre `pinta` y `trazo`: cuánta superficie ocupa.** Un
  cuadrado relleno se ve a cualquier tono; una raya de 2 px o un aro de 4, no.
  Por eso el aro de una misión, el contorno de un nodo, el arco de un anillo y
  lo lleno de una barra van todos en `trazo()`, aunque parezcan rellenos.

  Y `trazo()` no hunde un porcentaje fijo: cada color tiene su propia versión
  de línea (`--paleta-N-linea`), la mínima que llega a 3 sobre 1. Con un
  porcentaje igual para todos, al coral —que necesitaba un 16%— se le aplicaba
  lo mismo que al amarillo —que necesita un 40%— y salía color ladrillo. El
  lila no se mueve nada.

  **Nunca pegar la transparencia al hex** (`col + "22"`): eso ata el relleno a
  la cara de noche, porque a un `var(...)` no se le pueden pegar dos dígitos
  detrás. Para eso está `velo()`.

- **`relleno()` no es `velo()`.** Un velo es transparente siempre; el relleno de
  una figura del mapa es un velo de noche y una pastilla OPACA de día, porque
  sobre un lienzo claro un velo del 20% deja la figura casi del color del suelo.
  Lo deciden dos variables (`--relleno-base`, `--relleno-fuerza`) y no un `if`
  en JavaScript: **el mapa no se vuelve a dibujar al cambiar de modo**, así que
  un color decidido en JS se queda con la cara del modo en que se dibujó.
- **Los tonos `*-soft` levantan hacia el blanco en el modo claro**, no hunden
  hacia el color. Sobre carbón un velo del tono aclara la zona; sobre una
  página ya teñida el mismo velo la oscurece y la pastilla se lee como un
  hueco en vez de como algo apoyado encima.
- **La escena de la racha y la celebración se quedan de noche** en los dos
  modos: no son interfaz, son un dibujo. Dentro de ellas la paleta oscura se
  vuelve a declarar entera (regla `.scene-card, .celebrate`).
- **La franja ilustrada de una ficha (`motifScene`) sí cambia de luz**, porque
  vive en los dos sitios: dentro de una escena —que se queda de noche— y
  encima de una ficha, que de día es clara. Su cielo y sus chispas salen de
  las variables `--motivo-*`.
- **De día no hay resplandor, y esto vale para TODO lo que brilla.** Sobre
  carbón un halo es luz; sobre papel es una mancha. Ya lo ha parado Eduardo dos
  veces y las dos con la misma frase —«se ve todo gris»—, porque de día el tono
  que se usa es el OSCURO del color y el halo sangra alrededor hasta enturbiar
  lo que rodea. Son tres sitios y ninguno es opcional:

  | Qué | Dónde se apaga |
  | --- | --- |
  | Los nodos del árbol y los motivos, que llevan una copia borrosa debajo | `html.claro .const-wrap [filter]` |
  | `.barra-viva` — lo lleno y su punta encendida | `html.claro .barra-viva i` |
  | El aro de nivel de un cuadro emergente | `html.claro .aro-nivel circle[data-anim]` |

  **Se apaga desde el CSS y no dejando de escribirlo en el dibujo**, por dos
  razones distintas y las dos muerden: un atributo de presentación de SVG
  pierde contra una regla, y lo que se dibuja una sola vez —un aro dentro de un
  cuadro, el mapa de talentos— no se vuelve a dibujar al cambiar de modo, así
  que un resplandor decidido en JavaScript se queda con la cara del modo en que
  se dibujó. Apagar el halo no apaga la pieza: lo lleno, la punta, el llenado y
  la estela siguen ahí, que son las cuatro cosas que la hacen parecer
  encendida.
- **El logotipo de la portada es un `<img>`** y hay que cambiar de archivo:
  `logotipoSrc()` elige entre los dos de `marca/`. Ojo con los nombres, que
  dicen de qué color es el dibujo: el *claro* va sobre fondo oscuro.

## Las apariencias

**Lo de apariencias se decide en `apariencias/LEEME.md`, y ese documento manda.**
Estuvo repartido entre dos conversaciones y seis láminas, y de esa partición
salió una contradicción que estuvo a punto de convertirse en un bug: dos
documentos daban repartos distintos de qué ambiente es gratis y cuál pide Pro.
Si algo de esto se vuelve a trabajar en otro sitio, se trae ahí antes de
construirlo.

Tres palabras y ninguna es intercambiable:

| | Qué es | Cuántos |
| --- | --- | --- |
| **Apariencia** | El paraguas, y la palabra que ya usa `js/10d-plan.js` | — |
| **Ambiente** | Un recolor: el mismo material con otra luz | 7, en `apariencias/` |
| **Mundo** | Otro material: superficie, marco, letra y peso al moverse | 15 diseñados, 5 construidos, en `mundos/` |

Son **excluyentes** —un mundo declara sus propios colores— y el modo claro es
un eje aparte. Nada de esto existe todavía en la app: lo que hay es el camino
(la capa de material de 0.7.37) y la caja registradora (la llave `apariencia`).

**Un mundo puede traer paletas propias (0.7.136).** Con ese mundo mirado o
puesto, en Mi apariencia ocupan el sitio de los ambientes. Van en
`data-paleta` en `<html>` (la pone el script de arriba de `index.html`) y la
primera es la de partida, sin atributo. Hoy son dos, y ninguno sale de
`datos.py`: **Catedral** (`mundos/catedral/`) y **Averno** (`mundos/averno/`).

**Cinco paletas por mundo (0.7.147), y es regla de Eduardo.** Cuatro llegan
con el mundo y la quinta se gana con el tercer rango de su camino
(`PALETA_DE_RANGO`, `js/10i-apariencia.js`). Catedral y Averno las escriben en
su `paletas.py`; **Blueprint y Reliquia las genera `mundos/recolores/`** desde
su bloque dentro de `mundos/app.py`: cada paleta declara papeles (papel,
cuadrícula, trazo, tinta; en Reliquia además el METAL) con colores
complementarios de paletas de Lospec, y se interpola en OKLab. **Nunca girar
el matiz de la de partida**: sale monocromo y Eduardo ya lo rechazó. El aviso y
el peligro no se tocan, y el generador se niega a escribir si una tinta no
llega a 4,5. Un mundo nuevo nace con sus cinco. Al tocar una paleta, las
muestras de Mi apariencia se sacan con `python mundos/<mundo>/<mundo>.py` o
`python mundos/recolores/recolores.py` y se pegan en `js/10i-apariencia.js`.
**Cyberpunk (0.7.148) es la tercera vía**: no recolorea, genera. Cada paleta
es otro juego de tokens pasado por el mismo `bloque()` de `mundos/app.py`
(`mundos/cyber/cyber.py`), con su cara de día calculada. Un mundo nuevo que
salga del bloque genérico puede nacer así, y se prueba antes en el
laboratorio de mundos.

**Y ojo con el nombre, que cambió de dueño (0.7.141).** `averno` fue el gótico
de vitrales hasta la 0.7.141; ese mundo es hoy `catedral`, y `averno` es el de
hueso y sangre. El script de arriba de `index.html` mueve lo guardado una sola
vez por dispositivo (marca `norata-mudanza-catedral`). **No se quita**: un
dispositivo que no abra la app en meses tiene que encontrarla ahí el día que
vuelva, o se despertaría en otro mundo.

**Y una cuarta cosa desde 0.7.131: Arcade**, el mundo secreto (código Konami,
gratis para siempre). No es un mundo de esos quince sino una **capa de
material** que va ENCIMA del ambiente, en su propio atributo
(`data-material`); con un mundo sí es excluyente. Todo lo decidido está en la
sección «Arcade» de `apariencias/LEEME.md`. Y la regla que dejó, hasta la 1.0:
**un mundo viste, no actúa** — lo que cambie lo que pasa es de la app entera.

**La marca en un mundo (0.7.145; el menú, desde 0.7.148.4).** La silueta del
isotipo no la cambia nadie. En el menú de la app un mundo solo la RECOLOREA
(`--marca-menu`, su acento); el material vive solo en el icono del APK. La puerta, la portada, el favicon, el icono de la web y los
correos se quedan en menta, y un ambiente no la toca nunca. El reparto y el porqué, en «La marca, dentro de un mundo» de
`apariencias/LEEME.md`.

## Ni un cuadro con otro mundo

**Regla de Eduardo, y es de las que no admiten matices (0.7.158 y 0.7.160):**
nunca puede verse, ni un instante, un color, una letra o un diseño que no sea
el del tema puesto. «Me molesta mucho verlo, se percibe mal y lo detesto… no
quiero más brechas hoy ni futuras, aun cuando las pantallas de carga tengan que
tardar más (sin exagerar)». Cualquier cambio en el arranque, las apariencias o
las cargas se MIDE contra esto antes de subir.

Lo que lo sostiene, y nada de esto se quita sin entender por qué está:

| Pieza | Dónde | Qué impide |
| --- | --- | --- |
| El candado del primer cuadro | script de arriba de `index.html` y de `login/index.html` | `body` invisible y `html` de un color liso (`norata-fondo`) hasta que cargan la hoja del mundo, la de Arcade y las letras de `--tipo-titulo`, `--tipo-cifra` y `--sans`. Tope 2,5 s; MIRA `link.sheet` además de escuchar `load` (una hoja retirada no avisa) |
| `norata-fondo` | lo apunta `pintarColorDeBarra`, y el candado lo corrige con el `--bg` real | el color liso y `theme-color` antes de que arranque el JS |
| El aspecto por dispositivo en la cuenta | `settings.aspectos`, `conciliarAspecto` (`js/10i-apariencia.js`) | abrir con la casa en un dispositivo nuevo o donde entró otra cuenta |
| `cambiarTapado` y `recargarApp` | `js/10i-apariencia.js`, `js/01-base.js` | cambiar de tema a la vista: siempre detrás de la cortina y con recarga |
| `refrescarApariencia`, tapado | `js/10i-apariencia.js` | quitar a la vista un mundo que dejó de poderse usar |

**Cada dispositivo manda sobre su tema** (también de Eduardo): la cuenta lo
lleva apuntado por dispositivo y solo decide cuando el dispositivo no sabe. No
convertirlo en un solo aspecto compartido: dos dispositivos abiertos se
pelearían el tema.

**Al añadir un mundo o un archivo de estilos que se pida en caliente:** su
hoja tiene que pasar por el candado (las variables `lm` y `la` del script de
arriba) y su huella sellarse en las DOS páginas. **Al añadir una forma nueva de
cambiar el aspecto:** pasa por `cambiarTapado` y llama a `apuntarAspecto`.

**Cómo se mide:** `window.__veloFuera` (ms hasta enseñar la página) contra el
`responseEnd` de la hoja y el estado de `document.fonts`; y una foto de los
estilos al irse la carga contra otra 2,5 s después, que tiene que dar cero
diferencias.

**Lo que sigue fuera:** la pantalla de arranque nativa del APK es un color
fijo del sistema (cambiarla pide tocar lo nativo), y la marca de la puerta se
queda en menta por la regla de marca.

## El material

La paleta de arriba resuelve el COLOR. Desde 0.7.37 hay una segunda familia al
lado que resuelve de qué está hecha la app, y la regla es la misma: **ningún
radio, ninguna superficie y ningún marco se escribe suelto dentro de una
regla.** Todos salen de `:root`, junto a los colores.

Existe porque sin ella una apariencia solo puede recolorear, y un recoloreado
no es una apariencia. El número que lo decidió: en los 300 KB del CSS había
**un solo `url(...)`, y era la tipografía**.

| Familia | Para qué | Ojo |
| --- | --- | --- |
| `--r-redondo`, `--r-disco` | círculos y puntos | **no** pasan por el factor |
| `--r-barra`, `--r-pastilla`, `--r-boton` | carriles, chips, botones | sí pasan |
| `--r-grande` … `--r-micro` | la escala de las superficies | 16, 14, 12, 10, 8, 6 |
| `--r-factor` | el interruptor grueso | `0` endereza el 79% de las esquinas |
| `--sup-*` | el MATERIAL de un fondo | van en `background`, admiten capas |
| `--marco-tarjeta` + `--borde-tarjeta` | el marco forjado | hacen falta las DOS |
| `--tipo-titulo`, `--tipo-cifra` | títulos y cifras aparte | el cuerpo no se toca |
| `--dur-*`, `--curva*` | el peso del movimiento | |

Cuatro cosas que hay que saber antes de tocarlo:

- **Un círculo es redondo porque es redondo.** `--r-redondo` está separado de
  `--r-pastilla` a propósito: con un solo nombre para los dos, cuadrar las
  etiquetas cuadraba también el círculo de marcar una misión. Eso ya no es una
  apariencia, es otra app.
- **`--card` es el color; `--sup-tarjeta` es lo que se pinta.** Son dos cosas y
  hasta 0.7.37 eran la misma variable. `--card` se sigue usando en bordes y en
  `color-mix`, donde una textura no cabe. La textura va SIEMPRE en la `--sup-*`.
- **Un marco necesita las dos variables.** Con `--marco-tarjeta` puesto y el
  borde en un píxel no se ve nada: `border-image` solo se dibuja sobre el ancho
  del borde.
- **63 de los 221 radios siguen sueltos** —esquinas interiores de 3 px, medios
  redondeos, las siluetas giradas de las burbujas— y el factor no los alcanza.
  Una apariencia que los quiera tiene que ir a por ellos con sus propias reglas.

**Cómo se comprueba que un cambio de estos no rompió nada:** una foto de los
estilos calculados de toda la app —siete pantallas, los dos modos, con
`verElEjemplo()` sembrado— antes y después, y se diffean. En 0.7.37 eso fueron
24 326 elementos y cambiaron 10, todos a propósito. Dos fotos de la app sin
tocar salen idénticas, así que un «no cambió nada» significa algo. Ver la
entrada de 0.7.37 en `VERSIONES.md`.

## Cómo llega la app: de la copia primero

Desde 0.7.38 abrir la app **no espera a la red**: se sirve de la copia que el
service worker guardó. Un día cualquiera son **1 petición y ~120 ms**, contra
las 24 peticiones y 460 KB que se bajaban enteros cada mañana antes.

Se hizo antes de las apariencias porque una apariencia con carácter pesa 150-250
KB de tipografía y texturas, y con lo de antes eso se habría vuelto a bajar cada
vez que se abre la app.

**Cómo llega entonces una versión nueva.** El navegador vuelve a pedir `sw.js`
en cada navegación, y sin pasar por su caché. Como `CACHE` lleva el número de
versión, ese archivo cambia siempre que hay algo nuevo: se instala el worker
nuevo, se baja todo por detrás, se activa, y avisa a la app —un toast con un
botón de recargar—. Quien abra justo después de una publicación ve **una vez**
la versión anterior; la nueva entra sola en la siguiente apertura.

Cuatro cosas del `sw.js` que no se pueden tocar sin entender por qué están:

- **`install` pide con `cache: "reload"`.** Sin eso se llena la caché nueva con
  los bytes viejos que el navegador tuviera guardados, y subir la versión no
  cambia nada de lo que se ve.
- **Un corte de RED se reintenta; una respuesta mala NO** (0.7.129.2). La
  instalación es todo-o-nada con los cuarenta y ocho archivos, así que una sola
  petición caída la tumbaba entera: **medido, con TRES segundos sin red la
  versión nueva no entraba**, y por eso con datos móviles no actualizaba nunca
  y con wifi sí. Ahora un fallo de red se reintenta cinco veces (hasta 11,5 s) y
  un 404 o un 5xx sigue fallando a la primera, que es lo que impide guardar una
  página de error de una publicación a medias como si fuera un archivo. Las dos
  cosas parecen «que falló la descarga» y no son lo mismo.
- **Cada worker sirve de SU caché** (`caches.open(CACHE).then(c => c.match(…))`,
  no `caches.match` a secas). Mientras se instala una versión conviven dos
  almacenes, y el de a secas busca en todos: el worker viejo podía servir un
  archivo del nuevo y otro del viejo en la misma carga.
- **El aviso mira `viejas`, no `keys`.** Cuando corre `activate`, la caché de
  esta versión ya existe —la crea `install`—, así que `keys` nunca está vacío y
  el aviso saltaba en una instalación recién hecha.

- **Lo que NO está en `ASSETS` se pide con `cache: "no-store"` y con una
  HUELLA en la dirección.** Un archivo que no está en la lista de la
  instalación no lo renueva nadie: se pide suelto y lo que llegue se guarda en
  la caché de esa versión, y a partir de ahí ya es un acierto y no se vuelve a
  pedir NUNCA. GitHub Pages tarda un minuto en publicar y su CDN no cambia
  todos los archivos a la vez, así que hay una ventana en la que `sw.js` ya es
  el nuevo y `css/mundos.css` todavía es el viejo: quien abra ahí se queda el
  mundo congelado con el número de versión nuevo puesto. Pasó de verdad con la
  0.7.55.3. Tres piezas lo cierran, y hacen falta las tres:
  `?h=<huella>` en la dirección (la estampa `mundos/app.py` con el sha-256 del
  contenido, así que no hay un quinto sitio que tocar), el worker
  **comprobando** esa huella antes de guardar —el servidor contesta al `?h=`
  nuevo con el archivo viejo, y con un 200— y `no-store`, para que el
  navegador no se quede una copia propia por encima.

**Lo que esto pide de las apariencias:** las texturas y tipografías de un mundo
**no van en `ASSETS`**. Eso es la lista de la instalación, y meterlas ahí le
haría bajar el mundo entero a quien nunca lo va a encender. Van aparte, se
piden cuando se enciende el mundo, y se quedan cacheadas **por dirección, con
su huella dentro**.

**Y lo que no se hizo:** bajar tarde el lienzo del árbol, los informes y los
planes (119 KB, el 26% del arranque). Con la red ya resuelta, compilar y
ejecutar TODO el JavaScript cuesta 12-17 ms en un teléfono de gama media.
Partir archivos que se pasan globales entre ellos para ganar milisegundos es
mal negocio. Está apuntado en `VERSIONES.md` por si algún día cambia.

## Ramas: una sola estructura

**Todo nodo vive en `state.perks`, sea de la clase que sea** (formato 3,
0.7.146). Los nombres internos se quedaron —`perks`, `tree`, `projects`,
`js/03-talentos.js`— porque renombrarlos era tocar cientos de sitios para que
nada cambiara; en pantalla se dice Ramas y nodos. Cuatro cosas que muerden:

- **La clase es de la RAMA, no del nodo**: `ui.ramaClase[nombre] = "proyecto"`
  (sin entrada es talento), y la vista en `ui.ramaVista`. Por eso renombrar,
  borrar y fusionar una rama tienen que llevarse esas dos llaves con ella
  (`renombrarRama`, `deleteBranch`, `js/10-fusion.js`).
- **Lo de antes se muda al cargar** con `mudarProyectos()` (`js/01-base.js`),
  que es idempotente. La fusión muda los dos lados ANTES de juntar: un
  dispositivo que siga en v2 manda `state.projects` y hay que convertirlo.
- **El puente con Misiones y Habilidades se CUENTA, no se guarda**: sale de
  las marcas de la misión desde `puente.desde` y del nivel de la habilidad
  (`revisarPuentes`). Un contador aparte se desincroniza en la fusión.
- **El módulo viejo de Proyectos sigue en el código sin camino que llegue a
  él** (`renderProjects`, `openProjectForm`, el modo `"proyectos"` del
  lienzo). No arreglar nada ahí: se quita entero en una tanda propia.

## Lo que llega por el camino

**Ramas no está el primer día: se abre en el nivel 3, y la clase proyecto en el
5 de expedición.** La tabla es `MODULO_NIVEL` (`js/04-misiones.js`) y los números
son un calendario, no una preferencia: medidos sobre un perfil de cuatro días por
semana, el 3 cae en la primera semana y el 5 en la tercera. Misiones y
Habilidades no tienen nivel porque son las dos que se entienden sin que nadie las
explique — y una app que abre con la barra entera cerrada no enseña, castiga.

Tres reglas, y las tres se rompen solas si no están escritas:

- **El nivel solo ABRE, nunca cierra.** Un módulo que ya tiene algo dentro está
  abierto tenga el nivel que tenga (`moduloConCosas`). Es la misma regla del
  cobro —congelar, nunca quitar— y es lo que evita esconderle el árbol a quien ya
  lo usa, a quien importa un respaldo y a quien ve el ejemplo completo.
- **Son DOS preguntas distintas.** `moduloOn` es el interruptor de Ajustes —lo
  decide la persona, y lo apagado desaparece del menú— y `moduloAbierto` es el
  candado —lo decide la app, y lo cerrado se queda a la vista—. `moduloUsable`
  es las dos juntas, y es la que quieren casi todos: las pantallas, los widgets
  del tablero y los pasos del tutorial.
- **Lo que se abre no llega vacío.** La bienvenida apunta lo que iría dentro en
  `settings.siembra` y `sembrarLoApuntado()` (`js/09-inicio.js`) lo planta el día
  que la puerta se abre. Crearlo todo el primer día detrás del candado tiene las
  dos mitades malas: el nivel de expedición cuenta los estrenos —así que subes de
  nivel por algo que no hiciste— y el módulo se abre con cosas dentro que no
  recuerdas haber puesto.

**Y lo que llega tarde hay que PRESENTARLO.** El tutorial solo explica los
módulos abiertos y se marca como visto al terminar, así que sin nada más quien
lo ve el primer día no aprende nunca qué es un talento: el módulo aparece y
nadie lo presenta. Lo cierra `quizaPresentarModulo` (`js/09-inicio.js`), que
enseña la tarjeta de ese módulo **al entrar en él por primera vez** —no al
desbloquearlo, que ese momento ya lo ocupa la celebración— y lo apunta en
`state.ui.modulosPresentados`. Tres guardas que hacen falta: no dentro del
ejemplo, no encima de otra ventana, y sembrado en `migrar` para quien ya usaba
la app.

Al añadir un módulo con nivel: la fila de `MODULO_NIVEL`, un peldaño en
`EXP_ESCALERA` con `tipo: "modulo"` —el nivel NO se copia ahí: se rellena leyendo
esa misma tabla— y su tarjeta en `TUTO_PASOS`. El candado del menú, la tarjeta
apagada del tablero, la fila de Ajustes, el aviso al tocarlo, la celebración y
la presentación al entrar salen solos.

## El candado

**Lo que está cerrado tiene que VERSE cerrado.** Gris no lo dice: gris significa
«no viene al caso», que es lo que le pasa a un botón desactivado — y nadie toca
un botón desactivado para preguntarle por qué, cuando tocarlo es justo lo que
saca el cuadro que explica qué es y cuánto cuesta. La chapa es `.llave`
(`css/estilos.css`), el candado del menú es `.nav-candado`, y el icono es `lock`.

**El orden de las dos puertas no cambia: primero el NIVEL, que se gana, y después
el PLAN, que se paga.** A quien todavía no llega al nivel no se le ofrece pagar,
porque cobrar por saltarse la escalera es lo único que la rompería. De ahí que el
cuadro de un módulo cerrado no tenga botón de comprar —lleva a Mi expedición, que
es donde se ve cuánto falta— y que un peldaño de la escalera cerrado por nivel
sea un `div` mientras el cerrado por plan es un `button` que va al panel de los
precios. La nota larga está en `estadoApariencia` (`js/10i-apariencia.js`).

Y **un candado es una LÍNEA**, así que pide 3 sobre 1 y no le vale el gris de los
bordes: en `--faint` daba 2,8 y hubo que subirlo a `--muted`. Ver la tabla de
`pinta`/`trazo` más arriba.

**Lo cerrado se queda a la vista, también en el tablero.** La 0.7.93 escondía la
tarjeta de un módulo cerrado y Eduardo lo paró: *un tablero al que le faltan
tres huecos no enseña que vienen tres cosas, enseña un tablero pequeño*. Ahora
se queda apagada, con borde discontinuo y su nivel. **Apagar y cerrar no son lo
mismo tampoco aquí**: lo que la persona apagó en Ajustes sí desaparece —no hay
nada que anunciarle sobre algo que ella quitó—, y una tarjeta por MÓDULO, que
del árbol cuelgan dos y salía repetida.

**Y donde se cuentan niveles va el aro, no un número suelto** (`aroDeNivelHTML`,
`js/02b-expedicion.js`). Mide el camino entero hasta el objetivo y no lo que
llevas del nivel en curso: quien va por el 2 camino del 3 puede tener el nivel
actual al 5% y llevar media escalera. Sale del `ring()` que ya existía.

## Las insignias

**Toda insignia de un logro es UNA figura de los nodos de Ramas con UN símbolo
dentro**, y nada más (Eduardo, 0.7.156: la medalla de la 1.0 llevaba cinta,
«1.0» y una β diminuta, y pidió «solo el símbolo, con una forma de algún logro
del módulo de talentos»). Se dibuja con `insigniaSVG(tipo, simbolo)`
(`js/01-base.js`) y la figura dice qué clase de logro es, con el significado
que ya tiene en el árbol:

| Figura | Tipo de nodo | Para un logro que… |
| --- | --- | --- |
| hexágono | `hito` | pasó una vez y se cierra |
| rombo | `meta` | se sostuvo en el tiempo |
| triángulo | `acumular` | fue sumando |
| círculo | `compra` | abre algo |

El símbolo va en `--sans`, nunca en la letra del mundo. Los tonos los pone quien
la pinta (`--ins-tono`, `--ins-fondo`, `--ins-tinta`). Hoy hay dos: la alpha
(hexágono, α) y la beta (rombo, β). **Un logro nuevo no inventa otra forma de
medalla**: elige figura por lo que significa y un símbolo.

## Cómo se le habla a quien usa la app

El español pone género donde el inglés no pone nada. Se pregunta en la bienvenida
y se guarda en `settings.genero`: `"m"`, `"f"` o `"x"`.

**La regla que manda sobre todo lo demás, y es de Eduardo (0.7.111): el neutro no
se inventa con una letra, se consigue eligiendo palabras que ya no marcan.** La
forma en «-e» —Rastreadore, Exploradore— se retiró de la app entera y no vuelve.
No es una decisión nueva: es lo que Norata ya hacía sin decirlo, y lo que hacían
por su cuenta dos de los cinco rangos.

Así que **`"x"` ya no es una tercera forma, es la ausencia de las otras dos**: el
suelo de quien no ha contestado, y lo que hace es cambiar la frase.

| | Qué se escribe |
| --- | --- |
| `"m"` | «Bienvenido de vuelta» |
| `"f"` | «Bienvenida de vuelta» |
| `"x"` | «Te damos la bienvenida» ← el de quien no contestó |

- **Sin contestar es NEUTRO, no masculino.** Quien no ha dicho nada no ha dicho
  nada, y suponerle un género es lo que este ajuste existe para no hacer. Por eso
  la pregunta enseña **dos** opciones (`OB_GENEROS`) y Ajustes lleva un «Prefiero
  no decirlo» para volver: el neutro no es una casilla que se elige.
- **Se resuelve con `gen(m, f, x)` (`js/01-base.js`), y solo manda en español.**
  En inglés el sustantivo no marca género, así que `gen()` devuelve la palabra
  base — que además es la clave del diccionario, y buscar una variante dentro de
  una app en inglés la dejaría escrita en español.
- **Dónde muerde:** la `x` de `gen()` es opcional y sin ella se cae en la
  masculina. Eso está bien para una palabra que ya vale para todos; es un fallo
  callado si la frase SÍ marca y nadie escribió el rodeo. Al escribir un `gen()`
  nuevo, la tercera se piensa.
- **Ningún rango marca género.** Son Andante, Vigía, Guía, Líder y Navegante
  (Wayfarer, Scout, Guide, Leader, Navigator), y ninguno lleva `nombreF` ni
  `nombreX`. Una INSIGNIA es una sola palabra, así que ahí el rodeo de la frase
  no salva: si algún día hace falta un rango nuevo, que sea una palabra que ya
  valga para todos. Siguen pasando todos por `nombreDeRango()`, que es el único
  sitio donde se elige.
- **Los `id` de los rangos no dicen su nombre** (`rastreador`, `explorador`,
  `cartografo`) y se quedan así: no se ven en ninguna pantalla y son el nombre de
  sus variables de color en `css/estilos.css`.
- **Un mundo borra las variantes al pisar los nombres** (`rangosVigentes`). La
  línea se queda aunque la casa ya no tenga ninguna: `Object.assign` pisa
  `nombre` pero no `nombreF`, así que el día que un rango vuelva a traerlas, sin
  ella se le quedarían pegadas encima del nombre del mundo. Ya pasó una vez.

## Los botones

Seis niveles, y la pregunta que los separa es **«¿qué me pasa si lo pulso sin
querer?»**. Antes casi todos eran verdes, y un verde que lo mismo guarda que te
lleva a cambiar tu tarjeta deja de decir nada.

| Clase | Cuándo | Aspecto |
| --- | --- | --- |
| `btn-primary` | Lo que has venido a hacer. **Una por pantalla** | menta maciza |
| `btn-soft` | Una acción más, normal y sin consecuencias | menta tenue |
| `btn-linea` | Mirar, consultar, salir a otro sitio. No cambia nada tuyo | fondo oscuro, borde menta |
| `btn-aviso` | Toca dinero o algo delicado, pero se deshace | luciérnaga |
| `btn-danger-ghost` | Destruye, o no tiene vuelta | coral |
| `btn-ghost` | Neutro: cancelar, cerrar, atrás. No es acción, es salida | apagado |

**La regla al dudar entre `soft` y `linea`: ¿ese botón ESCRIBE algo?** Si solo
enseña o lleva a otro sitio, es `linea`.

Y el reparto del amarillo importa: «Cerrar sesión» dejó de ser coral porque no
destruye nada —tu progreso sigue en tu cuenta y vuelves entrando—, pero tampoco
puede ser verde porque toca la sesión. Ese hueco es exactamente `btn-aviso`.

## El cobro

**Dos niveles y tres formas de pagar.** Los niveles son **Gratuito, Pro y
Fundador**, y así se llaman en toda la app — «plan libre» y «plan completo»
eran dos nombres más para lo mismo y ya no se usan. Mensual y anual son el
MISMO Pro: lo que cambia es cada cuánto se cobra, no lo que se abre (por eso
`LIMITES` tiene dos entradas y no tres, y las tarjetas dicen «Pro mensual» y
«Pro anual»). Fundador es Pro sin fecha, pagado una vez, y es el que se
recomienda: no es una suscripción.

Precios **con MXN escrito** y con IVA dentro: $69 al mes, $590 al año y $890
una sola vez. El cupo de fundador (200, en `ajustes_negocio`) existe pero **no
se hace público**: `lugaresDeFundador()` sigue viva para la landing, y la app
ya no pinta el contador. Se cobra con **Stripe**, desde la landing y desde la
app:
ninguna de las dos cobra nada, las dos le piden a la funcion `pagar` una
direccion de stripe.com y llevan alli. La tarjeta no pasa por Norata.

**Donde vive el candado, que es lo unico que hay que tener claro:**

| Quien | Que puede hacer con `suscripciones` |
| --- | --- |
| La app, la landing, cualquiera | leer su propia fila |
| La funcion `cobro` | escribir, y solo con la firma de Stripe |

La tabla **no tiene ninguna politica de escritura para nadie**, ni para el
dueno de la fila. Por eso `js/10d-plan.js` no es seguridad y no intenta serlo:
quien reescriba el JavaScript se engana a su propia pantalla y al recargar la
mentira se cae. La pregunta no es si alguien puede saltarselo, sino si puede
conseguir que el servidor le crea — y eso se contesta en `supabase/planes.sql`.
`mi_plan()` decide la vigencia contra el reloj del servidor: mover el del
telefono no revive nada.

**Congelar, nunca quitar.** Al dejar de pagar, lo que pasa del limite queda
visible y en solo lectura; el XP no se toca; la app nunca elige que se congela.
Por eso los ayudantes preguntan por CREAR (`cabeUnoMas`, `planPermite`) y
ninguno pregunta por VER. Los limites viven todos en `LIMITES`, un solo sitio.

Los pasos de Stripe estan en `supabase/LEEME.md`. Dos que muerden: `cobro` se
despliega con `--no-verify-jwt` o todos los avisos rebotan con 401 en silencio,
y la firma se calcula sobre el texto **exacto** que llego —re-serializarlo la
rompe para siempre—.

## El tono

Decisiones ya cerradas. No volver a proponerlas.

- **Español de México, cercano, sin jerga.** La app tutea.
- **Nada de cerrar diciendo lo que NO se va a hacer.** Los cierres van en
  aspiracional: «Tienes por delante un camino largo, y se recorre en días
  pequeños.»
- **Sin signos de exclamación en los asuntos de correo** ni mayúsculas
  sueltas: es lo que los filtros leen como propaganda.
- **Nada de «NO» en mayúsculas** para asustar. Un aviso informa y da la
  salida; no grita.
- **Los comentarios del código explican POR QUÉ**, no qué hace la línea, y
  cuentan el fallo que motivó la decisión para que nadie lo deshaga sin saber.

**Y donde se le habla a quien NO conoce la app, se dice lo que Norata hace y
nadie más.** Es de Eduardo (0.7.124), y el único sitio así hoy es el panel de
la puerta en «crear cuenta». La regla para escribir una frase nueva ahí: **si
la podría firmar una app de hábitos cualquiera, no es de ese banco.** Lo que
había era un aforismo bonito y genérico ocupando lo primero que se lee.

**Un banco de frases se cuenta por IDEAS, no por frases.** El de la puerta
tenía cinco por camino y se sentía repetitivo porque cuatro de las cinco
decían lo mismo con otras palabras; subir a quince más de lo mismo no lo
habría arreglado. Al añadir una, la pregunta es a qué familia pertenece —
están escritas junto a `PUERTA_FRASES` (`js/12-login.js`).

**Y la vara para una frase de esas es de Eduardo (0.7.124): si alguien la lee
de imprevisto, tiene que darle ganas de sonreír un instante.** No es «que suene
bonito». Son cuatro cosas, y una frase que no trae ninguna se cae del banco:
una **vuelta** al final —la segunda mitad tuerce a la primera—, algo
**concreto** y a ser posible incómodamente reconocible, **complicidad y no
consejo**, y el filtro de genérico de arriba. Descartado por escrito, porque
las tres se colaron en la primera versión y suenan a relleno: el proverbio
(«lo que se mide se ve»), la coletilla que EXPLICA la frase en vez de rematarla
(«…pero aquí se ve») y cualquier cosa que suene a taller de superación.

**Y la quinta cosa, que es un NO y la puso Eduardo leyendo la tanda buena:
la coletilla que repite lo que la frase ya dijo, sobra.** «Del otro lado está
todo lo tuyo, tal como lo dejaste. Nadie lo tocó» — «tal como lo dejaste» ya
dice que nadie lo tocó, así que la segunda mitad no tuerce nada: subraya. Una
vuelta REMATA; una coletilla REPITE, y las dos se escriben igual de fácil, que
es por lo que hay que mirarlas.

**Y ojo con lo que una frase le hace a su vecina.** Al quitar esa coletilla, la
frase acabó en «tal como lo dejaste» y la de al lado terminaba en «justo donde
la dejaste»: dos de doce con el mismo remate. No lo ve nadie mirando una sola
frase, que es como se escriben — hay que releer el banco entero después de
tocar una.

**Y la sexta, que manda sobre las otras cinco: ninguna frase puede hacer
sentir mal a nadie** (Eduardo, 0.7.129.1). Una luciérnaga decía que encienden
la luz «para encontrar pareja» y la persona «para revisar el celular»: graciosa
para unos, un piquete para quien está solo, que es justo quien abre la app a
las tres de la mañana. La broma es CON quien lee, nunca sobre algo suyo —su
pareja, su cuerpo, su dinero, su soledad—. Si una frase puede doler leída en
un mal día, se cae aunque sea la más graciosa del banco.

**Al traducir una de estas, lo que hay que salvar es la vuelta, no las
palabras.** Una traducción literal que pierde el giro deja una frase correcta y
muerta. Cuando la broma no cruza, se cambia la broma. Y hay una trampa antes de
esa: una broma puede no cruzar dentro del propio español de México — «las
palomitas no se acumulan» hablaba de las marcas de verificación y Eduardo leyó
botanas. Esa se cayó del banco entera. La clave del diccionario es el texto
español ENTERO, así que cambiarle una coma a una frase deja su traducción
huérfana sin avisar.

## Correos

Son seis; cinco se pegan a mano en Supabase y el de bienvenida lo manda una
función propia. **Gmail borra los SVG** (todo icono va en PNG) y **guarda las
imágenes por nombre y no vuelve a pedirlas nunca** (al cambiar una imagen hay
que cambiarle el nombre: `-v1` → `-v2`).

## Qué NO hacer

- **No volver a discutir desde cero lo que ya está apuntado.** `VERSIONES.md`
  tiene una sección **«Apuntado y sin hacer»** justo antes de la lista: lo que
  se vio, se entendió y no se arregló todavía, con el motivo escrito. Hoy son
  tres: `/crear-cuenta/` como pantalla propia —que pide dar de alta otra
  dirección de vuelta en Supabase, y por eso no se puede cerrar desde aquí—,
  qué hacer con la confirmación del correo ahora que no hay salida sin cuenta,
  y cambiar `WEB_NORATA` cuando `www.norata.app` esté en alta.
- **No crear una plantilla, pantalla o archivo sin comprobar que existe el
  camino que lo dispara.** Ya pasó: hay una plantilla que ninguna pantalla usa.
- **No dar por hecho el comportamiento del servidor.** Si algo importa,
  hacerlo explícito aunque puede que ya lo hiciera solo.
- **Supabase es la base de datos, no el hosting.** La web sale de GitHub
  Pages. Subir código no toca los datos de nadie.
- **Y por eso los dos relojes van por separado: un `.sql` fusionado NO está
  puesto.** Una versión de la app llega sola a los dispositivos —basta con
  subir el número—; un cambio de SQL no llega nunca hasta que alguien lo pega a
  mano en el panel. Al tocar cualquier `.sql` de `supabase/`, la fila va en la
  lista **«Pendiente de pegar»** de `supabase/LEEME.md`, arriba del todo, **en
  el mismo commit** — y no en el mensaje del commit ni en `VERSIONES.md`, que
  no son lo que se abre el día que uno se sienta delante de Supabase. Al
  pegarlo se borra la fila: una lista que solo crece se deja de mirar.
  Decir «ya está subido» de un cambio de SQL es decir algo que no es.
