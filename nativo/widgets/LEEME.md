# Los widgets de Norata en el APK

Un widget es una pieza de la app que vive en la pantalla de inicio del
teléfono. El primero es **Hoy**:

- **Arriba**, la actividad de la rueda del Pomodoro que toca ahora («Ahora ·
  Trabajo profundo · hasta 11:30 AM») o, si no hay ninguna en curso, la que
  sigue.
- **En la lista**, las misiones pendientes del día con su casilla, luego las
  actividades que vienen con su hora, y al final las misiones ya cumplidas,
  tachadas. Si no caben todas, abajo sale un pie —«3 más»— que pasa a las
  siguientes con un toque, y al final «Volver arriba».
- **Tocar una misión la marca**, sin abrir la app. Tocar otra vez una ya
  cumplida la deshace, igual que su botón dentro. Una misión de varias veces
  suma una por toque y dice por dónde va («1 de 3»).
- **Tocar el título** abre la app en Misiones.

## La regla que lo ordena todo: el widget apunta, la app aplica

El widget no suma XP, no mueve la racha y no sincroniza. Lo que marcas queda
apuntado con su día y su hora, y la app lo aplica al abrirse —o al momento, si
estaba viva de fondo— por la misma puerta que un toque dentro (`logMission`).
Al aplicarlo lo dice una vez: «Se aplicaron 3 marcas del widget».

Dos cosas que salen de ahí y hay que saber:

- **Una marca del widget no llega a tus otros dispositivos hasta que abras la
  app en este.** La sincronía corre en la página, no en el widget.
- **Las celebraciones esperan a que abras la app.** Si esas marcas te subieron
  de nivel, la fiesta sale al abrir, con el aviso al lado que explica de dónde
  vino.

## Lo que hay que hacer: una vez

La parte de la página (`js/13c-widgets.js`) llega sola con la actualización.
**Lo nativo no llega solo**: hay que meterlo en la carpeta «Norata App
Android» y reinstalar el APK UNA vez. Mientras no se haga, la app sigue
exactamente como estaba.

1. Baja `instalar-widgets.js` y déjalo dentro de la carpeta «Norata App
   Android» (la que tiene la carpeta `android/` adentro).
2. En una terminal en esa carpeta:

   ```sh
   node instalar-widgets.js
   ```

   Pone el complemento junto a `MainActivity`, lo registra, copia los moldes y
   añade el widget al manifiesto. Va diciendo cada cosa con una ✓.
3. Arma el APK **firmado con la llave de siempre**, como dice el `LEEME.md` de
   esa carpeta (no con el ▶ de Android Studio). En PowerShell, una línea a la
   vez:

   ```powershell
   node traer-web.mjs
   npx cap sync android
   cd android; $env:JAVA_HOME = "$PWD\..\.herramientas\jdk-21"; .\gradlew.bat assembleRelease
   ```

   Se instala encima del que ya tienes, sin desinstalar.

Se puede correr dos veces: lo que ya está hecho se lo salta. Guarda una copia
de lo que edita (`.antes-widgets`), y `node instalar-widgets.js --deshacer` lo
deja como estaba. **Si también instalaste los iconos o los avisos**, deshaz en
el orden contrario al que instalaste: cada copia devuelve `MainActivity` a como
estaba antes de ESE instalador.

## Cómo se comprueba

1. Abre la app una vez, para que mande el día al widget.
2. En la pantalla de inicio, mantén el dedo en un hueco, toca **Widgets**,
   busca **Norata** y arrastra **Hoy**.
3. Toca una misión: se tacha y baja al final. Abre la app: sale «Se aplicó 1
   marca del widget» y la misión está cumplida, con su XP.
4. Con la app cerrada desde recientes, marca otra y ábrela: lo mismo.
5. Cambia de mundo o de modo claro en la app y vuelve al inicio: el widget
   tiene los tonos nuevos.

## Qué hay aquí

| Archivo | Qué es |
| --- | --- |
| `instalar-widgets.js` | lo de arriba: lo hace todo |
| `Widgets.java` | las piezas compartidas: la foto, la cola, el plan del día y los dibujos |
| `WidgetsPlugin.java` | lo que habla con la página (`WidgetsNorata`) |
| `HoyWidget.java` | el widget Hoy: la cabecera, la tira de arriba y el toque en una fila |
| `HoyLista.java` | el servicio que llena la lista, fila por fila |
| `res/layout/widget_hoy.xml`, `widget_hoy_fila.xml` | los dos moldes: el widget y una fila |
| `res/drawable/widget_*.xml` | el marco, la tira, el botón, el punto, la raya y el icono |
| `res/xml/widget_hoy_info.xml` | la ficha del widget: su tamaño y cada cuánto se repinta |
| `res/font/outfit_*.ttf` | Outfit en tres pesos; las mismas de los avisos |
| `archivos.json` | la lista de `res/`, para que el instalador sepa qué bajar |

## Lo que hay que saber antes de tocarlo

- **La página decide y esto pinta.** Qué misiones tocan cada día, cómo se
  llaman, de qué color es cada una, los textos y el idioma salen de
  `js/13c-widgets.js`. Así un cambio llega con la versión, sin reinstalar. Un
  widget nuevo que solo enseñe datos se añade en la página y en un molde; lo
  nativo solo hace falta para lo que se toca con la app cerrada.
- **Viajan siete días, no uno.** A medianoche el widget tiene que cambiar de
  día sin que nadie abra la app, así que la foto trae hoy y los seis
  siguientes, y el widget elige el suyo con la zona del perfil. Con más de una
  semana sin abrir la app dice «Abre Norata para ver tu día».
- **Se repinta solo cada media hora**, que es el mínimo que deja Android sin
  una alarma propia. Por eso la tira de «Ahora» puede ir hasta media hora
  atrasada; cualquier toque en el widget la pone al día.
- **Un marco, Outfit y los tonos del mundo**, las mismas reglas de los avisos:
  un widget de Android solo sabe dibujar marcos, textos e imágenes, sin
  texturas ni letras de mundo. El filo lleva el acento del mundo; el icono
  también, salvo uno rojo, que pasa a la menta; lo cumplido es el verde de
  Norata, nunca el acento. **Cada widget lleva su propio icono, no el logo**:
  lo pidió Eduardo sobre el boceto.
- **Los colores de los moldes son los de la casa de noche**, y el código los
  cambia al pintar (`setColorFilter` tapa el color de origen). Están ahí para
  el selector de widgets, que enseña el molde antes de que nadie lo pinte.
- **Las esquinas van a 20 dp**, no a los 28 del boceto: en el teléfono de Eduardo se veían de más, y
  al lado de otros widgets desentonaban. Lo pidió al verlo puesto por primera vez (3 oct 2026).
- **La lista va por páginas y no se desliza** (0.7.197.1). En el teléfono de
  Eduardo el lanzador inclina y deforma el widget entero mientras hay un dedo
  arrastrando encima, que es justo el gesto de deslizar: se veía tosco, y esa
  animación es del lanzador, no se apaga desde aquí. Cuántas filas caben sale
  del alto que Android dice que mide el widget (`OPTION_APPWIDGET_MAX_HEIGHT`)
  y de las medidas del molde; **si se cambia un alto en el molde, se cambia
  también en `HoyWidget.pintar`**. Al estirar el widget caben más.
- **En dp y no en sp.** El alto lo pone la cuadrícula del teléfono, y con la
  letra del sistema agrandada las filas se saldrían.
- **Marcar y desmarcar seguido se anula aquí** y no llega a la app: aplicar
  las dos daría y quitaría el XP, y dejaría dos renglones en el registro de la
  habilidad por algo que no pasó.
- **No depende de los avisos.** Un APK puede traer uno sin el otro; solo
  comparten las letras de `res/font/`, y por eso deshacer esto no se las lleva.
- **Un APK sin esto** no trae `WidgetsNorata`, y la página lo sabe con
  `isPluginAvailable`: no manda nada y no cambia nada.

Compila contra Android 16 y Capacitor 8 (`javac`, sin errores), y la parte de
la página se probó con un complemento de mentira: las marcas entran con su día
y su hora, y la foto sale con siete días. **Lo que no se ha visto todavía es
el widget en un teléfono de verdad**: eso es el paso «Cómo se comprueba».
