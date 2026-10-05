# Los widgets de Norata en el APK

Un widget es una pieza de la app que vive en la pantalla de inicio del
teléfono. Son nueve, y todos salen del boceto «Widgets de Norata» que aprobó
Eduardo:

| Widget | Tamaño | Qué enseña | Qué hace al tocarlo |
| --- | --- | --- | --- |
| **Hoy** | 4×2, se estira | La actividad que toca, las misiones del día y las actividades que vienen. La lista se desliza | La fila marca la misión; el título abre Misiones |
| **Lo que sigue** | 4×1 | Una sola misión: la que toca, con el avance del día alrededor | El círculo la marca y sale la siguiente |
| **Pomodoro** | 2×2, 4×2 o 4×4 | Crece: el reloj; con la rueda chica y lo que toca; o la rueda entera del día. Dos pestañas: Rutina diaria e Hiperfoco | Inicia, pausa, sigue y para sin abrir la app (con los avisos puestos) |
| **Luciérnagas** | 2×2 | Una luciérnaga por misión de hoy; se enciende la cumplida | Abre el Resumen |
| **Racha** | 2×2 | Las semanas encendidas y los días de esta semana | Abre «Tu racha» |
| **Por cuidar** | 2×2 | La habilidad con más días sin práctica y cuándo empieza a bajar | El botón marca la misión que la mantiene |
| **Expedición** | 2×2 | El aro de nivel y el próximo módulo que se abre | Abre Mi expedición |
| **Apuntar** | 2×2 | Tres atajos: Misión, Habilidad y Reloj | Cada uno abre la app en su formulario o en el Pomodoro |
| **Siguiente nodo** | 4×1 | El nodo que toca de una rama, con su figura y el avance de la rama | Abre Ramas |

En Hoy, tocar otra vez una misión ya cumplida la deshace, igual que su botón
dentro. Una misión de varias veces suma una por toque y dice por dónde va
(«1 de 3»).

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

1. Abre la app una vez, para que mande el día a los widgets.
2. En la pantalla de inicio, mantén el dedo en un hueco, toca **Widgets**,
   busca **Norata** y arrastra el que quieras.
3. En **Hoy** o **Lo que sigue**, toca una misión: se marca. Mira que
   **Luciérnagas** encienda una más y que **Expedición** diga «+1 por cobrar».
4. Abre la app: sale «Se aplicó 1 marca del widget», la misión está cumplida
   con su XP, y al volver al inicio «por cobrar» ya no está.
5. Estira el **Pomodoro** hacia abajo y a lo ancho: pasa del reloj a la rueda
   chica y a la rueda entera. Toca **Hiperfoco**, elige la manera tocando su
   nombre y dale a iniciar: la cuenta corre y en la cortina sale su aviso, sin
   que la app se abra. Pausa, sigue y para desde ahí; al abrir la app, lo
   hecho está apuntado.
6. Cambia de mundo o de modo claro en la app y vuelve al inicio: todos tienen
   los tonos nuevos.

## Qué hay aquí

| Archivo | Qué es |
| --- | --- |
| `instalar-widgets.js` | lo de arriba: lo hace todo, y añade solo lo que falte |
| `Widgets.java` | las piezas compartidas: la foto, la cola, el plan del día, el repintado de todos y el latido |
| `WidgetsPlugin.java` | lo que habla con la página (`WidgetsNorata`) |
| `WidgetNorata.java` | lo común a los nueve: cuándo se pintan |
| `Pinta.java` | cómo se llena cada widget que no es Hoy |
| `Dibujos.java` | lo que viaja como imagen: aros, barras, la semana, la figura de un nodo, las luciérnagas, el reloj de arena y la rueda |
| `HoyWidget.java`, `HoyLista.java` | Hoy y su lista; `HoyWidget` recibe además los toques y el latido de todos |
| `SigueWidget.java`, `PomodoroWidget.java`… | una clase por widget, de seis líneas: Android pide una por cada entrada de su selector |
| `res/layout/widget_*.xml` | los moldes; el Pomodoro tiene tres (`chico`, `ancho`, `grande`) con los mismos nombres dentro |
| `res/drawable/widget_*.xml` | el marco, las cajas, los botones y los iconos |
| `res/xml/widget_*_info.xml` | la ficha de cada widget: su tamaño y cada cuánto se repinta |
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
- **Un marco, la letra del sistema y los tonos del mundo.** Un widget de
  Android solo sabe dibujar marcos, textos e imágenes, sin texturas ni letras
  de mundo. **La letra es la del teléfono y no Outfit**, y es decisión de
  Eduardo (3 oct 2026): quien tiene otra letra puesta en su sistema vería los
  widgets de Norata desentonar con todo lo demás de su pantalla de inicio. (En
  su Honor, además, Outfit ni siquiera llegaba a pintarse.) En esto los
  widgets se apartan de los avisos, que sí van en Outfit. El filo lleva el
  acento del mundo; el icono también, salvo uno rojo, que pasa a la menta; lo
  cumplido es el verde de Norata, nunca el acento. **Cada widget lleva su
  propio icono, no el logo**: lo pidió Eduardo sobre el boceto.
- **Los colores de los moldes son los de la casa de noche**, y el código los
  cambia al pintar (`setColorFilter` tapa el color de origen). Están ahí para
  el selector de widgets, que enseña el molde antes de que nadie lo pinte.
- **Las esquinas van a 20 dp**, no a los 28 del boceto: en el teléfono de Eduardo se veían de más, y
  al lado de otros widgets desentonaban. Lo pidió al verlo puesto por primera vez (3 oct 2026).
- **Un widget nuevo son cuatro sitios**: su función en `Pinta.java`, su clase
  de seis líneas, su fila en `Widgets.TODOS` y en `WIDGETS` del instalador, y
  su molde con su ficha. Los datos que necesite los añade la página a la foto.
- **El Pomodoro tiene dos pestañas, como en la app: Rutina diaria e Hiperfoco.**
  Son dos cosas distintas y no se mezclan: con un Hiperfoco en marcha el widget
  enseña SU pestaña y no la rueda de la rutina (salía la rueda, y Eduardo lo
  vio como un fallo). Se cambia tocando la pestaña. **Deslizar de lado dentro
  de un widget no existe en Android**: ese gesto es del lanzador, que pasa de
  una pantalla de inicio a otra. En Hiperfoco, tocar el nombre de la manera
  («Travesía ›») pasa a la siguiente.
- **El Pomodoro funciona sin abrir la app, apoyado en los avisos**
  (`nativo/avisos/`). Iniciar, pausar, seguir y parar son los mismos toques
  que ya se hacían desde la cortina, y los lleva el mismo receptor, con su
  alarma del final y su cola para la página. El reloj de verdad es el de los
  avisos (`Widgets.relojAvisos`): lo escribe la página mientras vive y el
  receptor cuando no, así que el widget y la cortina dicen siempre lo mismo.
  Para ARRANCAR hace falta además el arranque que la página deja escrito
  (`jIniciosDeFuera`, js/09d-jornada.js). Va todo por nombre y no por clase:
  **en un APK sin los avisos cada botón abre la app y lo hace ella**, como
  antes. Lo que queda dentro de la app: apuntar el sueño y cerrar un tramo
  («¿cómo te fue?»).
- **Con la app cerrada, una Travesía pasa sola de la ronda a su descanso y
  del descanso a la ronda siguiente** (0.7.210.2). La página deja escrito lo
  que sigue (`cadena`, de `jCadenaLite`) y el receptor de los avisos lo va
  poniendo al sonar cada final (`siguienteDeLaCadena`); lo apunta en la cola
  (`fase`) y la página lo repite al abrir, con su hora. Con la app a la vista
  no lo hace: ahí la lleva la página. **Sin el permiso de alarmas exactas el
  paso puede llegar tarde**: en el emulador, hasta medio minuto con la
  pantalla encendida; con el teléfono dormido puede ser más.
- **Los minutos se cuentan como en la app: seguidos, sin horas.** Dos horas
  son «120:00», no «2:00:00». El cronómetro del sistema no sabe escribirlo
  así, de modo que con una hora o más por delante se dice en minutos
  («118 min», al minuto) y por debajo de la hora corre por segundos. El sueño
  va en horas y minutos («07:05»), también como en la app.
- **El Pomodoro elige su molde por tamaño** (`Pinta.pomodoro`): a partir de
  230 dp de ancho, la rueda chica; con 300 dp de alto además, la entera. Las
  medidas son las que el lanzador le dice a Android, y cada marca las cuenta a
  su manera: si en un teléfono no cambia al estirarlo, es ahí.
- **En el Pomodoro, lo que cuenta va en tiempo real.** La cuenta del tramo y
  la de «cuánto falta para despertar» corren por segundos con el cronómetro
  del sistema, y la hora de la cabecera con su reloj (`TextClock`), en la zona
  del perfil. Lo pidió Eduardo: un Pomodoro que no se ve correr no sirve. Lo
  que es dibujo —la aguja, la arena y el aro— avanza con el latido.
- **El latido** (`Widgets.armarTic`) repinta los widgets: cada 20 segundos con
  un tramo en marcha, al cambiar el minuto con un Pomodoro puesto, y cada
  cinco minutos si no. No despierta el teléfono —con la pantalla apagada no
  corre— y Android puede retrasarlo unos segundos: por eso nada que tenga que
  ir al segundo depende de él. Sin ningún widget puesto, no se arma.
- **Dos cosas se ajustan aquí y no en la página**, porque pasan con la app
  cerrada: una misión marcada en un widget enciende el día de hoy en Racha y
  pone «Al día» en Por cuidar; y a partir del domingo, Racha empieza una
  semana nueva. Todo lo demás espera a la foto siguiente.
- **Las luciérnagas no flotan**: Android no anima dentro de una imagen. Se
  quedan de noche en los dos modos, porque son un dibujo y no interfaz.
- **La lista de Hoy se desliza**, aunque en el Honor de Eduardo (MagicOS) el
  lanzador deforma el widget mientras hay un dedo arrastrando: se probó
  cambiarla a páginas (0.7.197.1) y la prefirió así.
- **Cada widget lleva su imagen de muestra** (`res/drawable-nodpi/widget_prev_*.png`,
  la `previewImage` de su ficha). Sin ella, el selector de widgets de MagicOS
  enseña el icono de la app en vez del widget: no usa el molde (`previewLayout`)
  como hace Android de fábrica. Salen del boceto «Widgets de Norata», con los
  tonos de la casa de noche; **al cambiar el diseño de un widget hay que volver
  a sacar la suya**, o el selector enseñará el de antes.
- **Las letras van al 87 % de las del boceto.** En el teléfono se veían
  demasiado grandes junto a los nombres de las apps y a otros widgets; lo pidió
  Eduardo al verlos puestos. Las filas de Hoy bajaron de 37 a 34 dp con ellas.
- **En dp y no en sp.** El alto lo pone la cuadrícula del teléfono, y con la
  letra del sistema agrandada las filas se saldrían.
- **Marcar y desmarcar seguido se anula aquí** y no llega a la app: aplicar
  las dos daría y quitaría el XP, y dejaría dos renglones en el registro de la
  habilidad por algo que no pasó.
- **No depende de los avisos.** Un APK puede traer uno sin el otro, y no
  comparten nada.
- **Un APK sin esto** no trae `WidgetsNorata`, y la página lo sabe con
  `isPluginAvailable`: no manda nada y no cambia nada.

El APK entero se arma con Gradle sin errores (Android 16, Capacitor 8). El
Pomodoro se probó en el emulador (`norata-prueba`), puesto en la pantalla de
inicio y tocándolo: encender, pausar, seguir y parar un Hiperfoco con la app
cerrada, y que la app lo recoja al abrir. **Hoy ya se vio en
el teléfono de Eduardo; los otros ocho todavía no se han visto pintados en un
teléfono**: eso es el paso «Cómo se comprueba».
