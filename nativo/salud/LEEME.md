# Health Connect en el APK (0.7.213, Alpha)

Desde la 0.7.213 una misión puede **cumplirse automáticamente**: si su nombre
habla de pasos, sueño o ejercicio, el formulario ofrece «Se cumple
automáticamente» y el teléfono la tacha solo cuando llega a la cifra. Lo lee
de **Health Connect**, la app de Google donde Android guarda la salud (la
llenan Google Fit, Samsung Health, el reloj, etc.).

| Fuente | Qué se lee | Reglas |
| --- | --- | --- |
| Pasos y distancia | `steps`, `distance` | al llegar a N pasos · al recorrer N km |
| Ejercicio | `workouts`, `distance` | una sesión de N min (de un tipo o de cualquiera) · N km |
| Sueño | `sleep` | dormir N h o más · acostarte antes de una hora |

**Nada sale del teléfono.** Se lee y se decide en el teléfono; a la cuenta
solo llega la marca de siempre (qué misión, a qué hora). Por eso solo marca el
teléfono que tiene el permiso.

La parte de la página es `js/13e-salud.js` (el puente) y `js/08b-mision.js`
(el formulario). Llega sola con la actualización. **Lo nativo no**: hay que
instalar el complemento y reinstalar el APK UNA vez.

## Lo que hay que hacer: una vez

1. Baja `instalar-salud.js` y déjalo dentro de la carpeta «Norata App
   Android» (la que tiene la carpeta `android/` adentro).
2. En una terminal en esa carpeta:

   ```sh
   node instalar-salud.js
   ```

   Instala `@capgo/capacitor-health` con npm, sube el `minSdkVersion` a 26 si
   hacía falta, deja en el manifiesto solo los cuatro permisos de LEER que se
   usan (el complemento declara 47, también los de escribir) y apunta la
   dirección del aviso de privacidad (`privacidad/index.html#salud`), que
   Health Connect enseña al pedir permiso. Termina con `npx cap sync android`.
3. **En la misma tanda, vuelve a correr `node instalar-avisos.js`**: los
   recordatorios de las misiones (0.7.213) cambiaron lo nativo de los avisos.
4. Arma el APK firmado como siempre:

   ```powershell
   node traer-web.mjs
   npx cap sync android
   cd android; $env:JAVA_HOME = "$PWD\..\.herramientas\jdk-21"; .\gradlew.bat assembleRelease
   ```

`node instalar-salud.js --deshacer` lo deja todo como estaba.

## Cómo se prueba

1. Crea una misión «Caminar 8,000 pasos». Sale «Se cumple automáticamente»
   con la etiqueta Alpha.
2. Enciéndelo → «Activarlo» → Continuar: sale la hoja de Health Connect (esa la
   pinta Android). Permite Pasos.
3. La regla queda «Al llegar a 8,000 pasos», con tu promedio de dos semanas
   debajo. Guarda.
4. En Misiones, la tarjeta dice «del teléfono» en celeste y lo que llevas
   («3,420 de 8,000 pasos») con su barra. Se vuelve a leer al abrir, al volver
   a la app y cada quince minutos.
5. Al llegar se tacha sola, sin sonido. Si la desmarcas, ese día no vuelve a
   marcarse.
6. Ajustes → Tu teléfono enseña qué está compartido y abre Health Connect para
   quitarlo.

## Lo que muerde

- **Sin Health Connect instalado** (Android 13 o menos), el permiso no se
  puede pedir: la hoja lo dice y lleva a instalarlo.
- **No hay lectura de fondo.** Se mira con la app abierta; con la app cerrada
  la misión se tacha la siguiente vez que la abras. Leer de fondo pide otro
  permiso de Health Connect que esto no necesita.
- **El sueño cuenta para el día que empieza**: lo de anoche tacha la de hoy.
