# Los avisos de Norata en el APK

Desde la 0.7.154, en la app de Android el Pomodoro avisa con el sistema:

- **El reloj en la cortina.** Mientras corre un tramo hay un aviso fijo con la
  cuenta atrás y un botón de **Pausar** (y **Seguir** al pausar). Se pausa sin
  abrir la app. Entre dos tramos el botón es **Iniciar**.
- **El final de cada fase, con la app cerrada.** Lo dice una alarma del
  sistema a su hora: «Pomodoro · Tramo 1 de 4 listo».
- **Una alarma al empezar cada actividad de la rueda**, con **Iniciar** (el
  tramo arranca desde la cortina) y **En 5 min**. Suena por el volumen de las
  alarmas. Se apaga en el Pomodoro, en «Alarma al empezar cada actividad».
- **Media hora antes de dormir**, el aviso que ya existía, ahora también con la
  app cerrada.

Tocar cualquiera abre la app en el Pomodoro.

**Por qué hizo falta.** El Pomodoro avisaba con la API `Notification` del
navegador, y el WebView de Android no la trae: en el APK no salía ningún aviso
con la app de fondo. Y aunque la trajera, una página dormida no puede sonar a
una hora fija: eso lo hace el sistema (`AlarmManager`).

## Lo que hay que hacer: una vez

La parte de la página (`js/13b-avisos.js` y el Pomodoro) llega sola con la
actualización. **Lo nativo no llega solo**: hay que meterlo en la carpeta
«Norata App Android» y reinstalar el APK UNA vez. Mientras no se haga, la app
sigue exactamente como estaba.

1. Baja `instalar-avisos.js` y déjalo dentro de la carpeta «Norata App
   Android» (la que tiene la carpeta `android/` adentro).
2. En una terminal en esa carpeta (en Android Studio, la pestaña **Terminal**):

   ```sh
   node instalar-avisos.js
   ```

   Baja los archivos de GitHub, pone el complemento junto a `MainActivity`, lo
   registra, copia el icono de la barra de arriba y añade los permisos y el
   receptor al manifiesto. Va diciendo cada cosa con una ✓.
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
de lo que edita (`.antes-avisos`), y `node instalar-avisos.js --deshacer` lo
deja como estaba. **Si también corres `instalar-iconos.js` después**, deshacer
uno devuelve `MainActivity` a como estaba antes de ESE: deshaz en el orden
contrario al que instalaste.

## Cómo se comprueba

1. Abre el Pomodoro y toca Iniciar. Android pide permiso para avisar
   (Android 13 o más): acéptalo.
2. Baja la cortina: está el tramo con su cuenta atrás y **Pausar**. Púlsalo;
   el aviso dice «En pausa · 24:31». Abre la app: el reloj está en pausa con
   el mismo tiempo.
3. Para el final con la app cerrada, pon en Ajustes del Pomodoro un tramo de
   5 minutos, inícialo y cierra la app desde recientes. A los 5 minutos suena.
4. Para la alarma de una actividad, pon un bloque en la rueda que empiece en
   dos o tres minutos y cierra la app. Suena con **Iniciar** y **En 5 min**.

**Si la alarma llega unos minutos tarde:** desde Android 14 las alarmas
exactas nacen apagadas. Al encender «Alarma al empezar cada actividad», la app
ofrece un botón **Permitir** que lleva a ese interruptor de Android. Sin él
suenan igual, pero el sistema puede retrasarlas con el teléfono dormido.

## Qué hay aquí

| Archivo | Qué es |
| --- | --- |
| `instalar-avisos.js` | lo de arriba: lo hace todo |
| `Avisos.java` | las piezas compartidas: canales, alarmas, cómo se pinta cada aviso |
| `AvisosPlugin.java` | lo que habla con la página (`AvisosNorata`) |
| `AvisosReceptor.java` | lo que contesta a los botones, a las alarmas y al reinicio del teléfono |
| `res/drawable/aviso_norata.xml` | el isotipo en blanco para la barra de arriba |

## Lo que hay que saber antes de tocarlo

- **La página decide y esto pinta.** Los textos, los iconos (se mandan ya
  hechos, en PNG) y lo que se dice al acabar cada fase salen de
  `js/09d-jornada.js`. Así un cambio llega con la versión, sin reinstalar. Lo
  único que se hace aquí con la app cerrada (pausar, seguir, iniciar) se
  apunta en una cola con su hora, y la página lo aplica al abrir
  (`jAplicarAvisos`): el estado de verdad sigue siendo el suyo.
- **No hay servicio en primer plano.** La cuenta atrás la dibuja el sistema
  (`setUsesChronometer`), y el final lo dice una alarma. Un servicio pediría
  otro permiso, una declaración en la Play Store y batería.
- **Cada aviso se dice una vez.** El final de una fase lo pueden decir la
  alarma y la página si estaba viva de fondo. Los dos pasan por la misma clave
  (`fid|fase`, la de `jFinFase`) y el segundo se calla.
- **Los canales no cambian de sonido una vez creados.** Si algún día hay que
  cambiar el sonido o la importancia de uno, se estrena otro id
  (`norata-agenda-v2`). Cada persona puede cambiar el tono en los ajustes de
  Android, en el canal «Inicio de actividad».
- **El permiso de las alarmas exactas** (`SCHEDULE_EXACT_ALARM`) hay que
  justificarlo en la Play Store el día que se suba: es una app que suena a la
  hora que la persona puso en su rueda, que es el uso que Google admite.
- **Un APK sin esto** no trae `AvisosNorata`, y la página lo sabe con
  `isPluginAvailable`: el Pomodoro sigue con sus avisos de dentro.

Compila contra Android 16 y Capacitor 8 (`javac`, sin advertencias propias);
se probó la página con un complemento de mentira. Lo que no se ha visto
todavía es en un teléfono de verdad: eso es el paso «Cómo se comprueba».
