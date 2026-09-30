# El icono de cada mundo en el APK

Desde la 0.7.145, en la app de Android el icono de la pantalla de inicio es
el del mundo puesto. Al elegir un mundo (o Arcade) en Mi apariencia sale la
pantalla de carga, la app vuelve ya con el mundo puesto y sale un aviso que
no se puede saltar; al pulsarlo, o a los 10 segundos, la app se reinicia con
el icono nuevo (0.7.146.2).

El instalador también deja **la pantalla de arranque de Android sin icono**
(paso 6, en `res/values/styles.xml`): desde Android 12 el sistema pone el
icono de la app en medio al abrir, antes de que la app pinte nada, y era el
de siempre aunque hubiera un mundo puesto. Queda el fondo de la noche de la
app (`#10151d`), el mismo de su pantalla de carga. Con un ambiente, o sin
nada puesto, va el de la casa.

**Solo en el APK.** En la web y en la app instalada desde el navegador no
cambia nada: allí el icono lo fija el `manifest` al instalar, y
`js/13-nativo.js` no hace nada fuera de la app nativa.

La parte de la página ya está en la app (`recargarApp` en `js/01-base.js` y
`norataIcono` en `js/13-nativo.js`) y llega sola con la actualización. **Lo
nativo no llega solo**: hay que copiarlo a la carpeta «Norata App Android» y
reinstalar el APK UNA vez. Mientras no se haga, la app cambia de mundo como
siempre y el icono se queda en el de la casa.

## La forma fácil: un comando

`instalar-iconos.js` hace los seis pasos de abajo solo, sin abrir un archivo.

1. Baja `instalar-iconos.js` y déjalo dentro de la carpeta «Norata App
   Android» (la que tiene la carpeta `android/` adentro).
2. Abre una terminal en esa carpeta (en Android Studio, la pestaña
   **Terminal** de abajo ya se abre ahí) y escribe:

   ```sh
   node instalar-iconos.js
   ```

   Baja los iconos de GitHub, pone el complemento, lo registra, arregla el
   manifiesto y añade la dependencia. Va diciendo cada cosa con una ✓.
3. Arma el APK **firmado con la llave de siempre**, como dice el `LEEME.md`
   de esa carpeta. En la Terminal de Android Studio (PowerShell), una línea a
   la vez:

   ```powershell
   node traer-web.mjs
   npx cap sync android
   cd android; $env:JAVA_HOME = "$PWD\..\.herramientas\jdk-21"; .\gradlew.bat assembleRelease
   ```

   **No con el ▶ de Android Studio**: ese firma con una llave de pruebas, y
   Android no deja instalarla encima de la que ya está sin desinstalar (y
   desinstalar se lleva la sesión y lo guardado). El APK queda en
   `android\app\build\outputs\apk\release\app-release.apk`: se pasa al
   teléfono y se abre para actualizar.

Se puede correr dos veces: lo que ya está hecho se lo salta. Antes de editar
guarda una copia de cada archivo (`.antes-iconos`), y
`node instalar-iconos.js --deshacer` deja el proyecto como estaba.

Si algún paso no le cuadra (un `MainActivity` con una forma rara), se para
y dice qué línea poner a mano; no adivina.

## Qué hay aquí

| Archivo | Adónde va |
| --- | --- |
| `instalar-iconos.js` | lo de arriba: hace todo lo de esta tabla |
| `res/` (todo) | `android/app/src/main/res/`, **sumándolo** a lo que ya hay |
| `IconoPlugin.java` | junto a `MainActivity.java` |
| `manifiesto-iconos.xml` | dentro de `AndroidManifest.xml` (paso 4) |
| `archivos.json` | la lista de `res/`, para que el instalador sepa qué bajar |

Todo lo genera `node mundos/iconos/android.js`, después de
`python mundos/iconos/generar.py`. No se edita a mano.

## Los pasos a mano (lo mismo que hace el instalador)

1. **Copia `res/`** encima de `android/app/src/main/res/`. Son carpetas
   `mipmap-*`, `drawable` y `values` con archivos nuevos (`icono_*`,
   `iconos_mundos.xml`); no reemplaza ninguno de los que ya tienes.

2. **Copia `IconoPlugin.java`** a la misma carpeta que `MainActivity.java` y
   cambia su primera línea (`package app.norata;`) por la que tenga
   `MainActivity.java` arriba.

3. **Regístralo en `MainActivity.java`**, antes de `super.onCreate`:

   ```java
   @Override
   public void onCreate(Bundle savedInstanceState) {
       registerPlugin(IconoPlugin.class);
       super.onCreate(savedInstanceState);
   }
   ```

   (Si ya tiene un `onCreate`, solo se añade la línea de `registerPlugin`
   arriba. Hace falta `import android.os.Bundle;` si no estaba.)

4. **En `android/app/src/main/AndroidManifest.xml`:**
   - Dentro de la `<activity>` de `MainActivity`, **borra el `<intent-filter>`
     que tiene `MAIN` y `LAUNCHER`**. Solo ese: el de `app.norata://login`
     (la vuelta de Google) se queda. Si no se borra, sale un icono de más en
     el cajón de apps.
   - Justo **después** del cierre `</activity>` de `MainActivity`, pega el
     contenido de `manifiesto-iconos.xml`. Tiene que ir detrás: una entrada
     apunta a una actividad que ya tiene que estar declarada.

5. **En `android/app/build.gradle`**, dentro de `dependencies { … }`:

   ```gradle
   implementation "com.jakewharton:process-phoenix:3.0.0"
   ```

   Es lo que reinicia la app (el porqué, arriba de `IconoPlugin.java`).

6. Arma el APK firmado (el paso 3 de la forma fácil) e **instálalo encima**
   del que ya tienes, sin desinstalar: así no se pierde la sesión.

## Lo que pasa la primera vez

- **El acceso directo de la pantalla de inicio puede desaparecer una vez.**
  La app pasa a abrirse por la entrada de la casa y no por `MainActivity`, y
  algunos lanzadores lo toman como otra app. Se vuelve a arrastrar desde el
  cajón y ya no se va.
- **Cómo se comprueba:** en Mi apariencia elige Blueprint. Sale «Cambiando
  tema…», la app se cierra sola y se abre con el icono azul. Vuelve a la casa
  y regresa el menta.

## Lo que hay que saber después

- **Los dieciocho iconos viajan en el APK**, aunque hoy solo cuatro mundos y
  Arcade se puedan poner. Cuando se construya otro de los quince, su icono ya
  está instalado y funciona sin reinstalar nada.
- **Un mundo que no esté en esta lista** (uno nuevo, fuera de los quince)
  pide volver a generar, copiar `res/` y el trozo de manifiesto, y reinstalar.
  Mientras tanto no se rompe nada: `IconoPlugin` no encuentra su entrada y se
  queda el icono que había.
- **Algunos lanzadores tardan unos segundos** en enseñar el icono nuevo, y
  alguno (Samsung, Xiaomi) puede quitar el acceso directo al cambiarlo. Es
  cosa del lanzador; la app sigue en el cajón con su icono nuevo.
