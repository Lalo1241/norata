// La pantalla de arranque de Android, en el color del tema puesto (0.7.166).
//
//   node mundos/iconos/arranque.js
//
// Escribe `android/res/values/arranque.xml`: un tema de arranque por cada
// color de fondo que la app puede tener, y la lista de todos. Lo instala
// `android/instalar-iconos.js` junto con los iconos, y lo usa `IconoPlugin`.
//
// POR QUÉ UN TEMA POR COLOR. La pantalla de arranque la pinta ANDROID, antes
// de que corra una sola línea de la app, así que no se le puede pasar un color
// al vuelo. Lo único que el sistema deja cambiar (desde Android 13) es CUÁL de
// los temas que ya viajan en el APK se usa la próxima vez
// (`SplashScreen.setSplashScreenTheme`), y lo recuerda él. Así que viajan
// todos, y la app elige el suyo cada vez que cambia de mundo, paleta o modo.
//
// DE DÓNDE SALEN LOS COLORES. De `arranque-colores.json`: el `--bg` de cada
// ambiente y de cada paleta de cada mundo, de noche y de día. Se sacaron
// midiéndolos en la app (el recorrido está en VERSIONES.md, 0.7.166). **Al
// añadir un mundo, una paleta o un ambiente, su fondo de noche y de día se
// suman a esa lista** y se vuelve a correr esto. Si se olvida no se rompe
// nada: el complemento elige el más parecido de los que hay, y el arranque
// sale en un tono vecino hasta que se reinstale el APK con el suyo.
const fs = require("fs");
const path = require("path");

const AQUI = __dirname;
const colores = JSON.parse(fs.readFileSync(path.join(AQUI, "arranque-colores.json"), "utf8"))
  .map((c) => String(c).trim().toLowerCase());
const malos = colores.filter((c) => !/^#[0-9a-f]{6}$/.test(c));
if (malos.length) { console.error("Colores que no son #rrggbb: " + malos.join(", ")); process.exit(1); }
const unicos = [...new Set(colores)].sort();

// Los nombres de la lista llevan una «c» delante: «050805» a secas lo puede
// leer el empaquetador como un número y guardarlo como 50805.
const xml = `<?xml version="1.0" encoding="utf-8"?>
<!-- Generado por mundos/iconos/arranque.js desde arranque-colores.json: un
     tema de arranque por cada fondo que la app puede tener. Lo elige
     IconoPlugin (setSplashScreenTheme, Android 13 o más). No editar a mano. -->
<resources>
    <string-array name="arranque_colores" translatable="false">
${unicos.map((c) => `        <item>c${c.slice(1)}</item>`).join("\n")}
    </string-array>
${unicos.map((c) => `    <style name="Arranque_${c.slice(1)}" parent="AppTheme.NoActionBarLaunch"><item name="windowSplashScreenBackground">${c}</item></style>`).join("\n")}
</resources>
`;
const destino = path.join(AQUI, "android", "res", "values", "arranque.xml");
fs.mkdirSync(path.dirname(destino), { recursive: true });
fs.writeFileSync(destino, xml);

// Y a la lista de lo que el instalador baja cuando se corre suelto.
const rutaLista = path.join(AQUI, "android", "archivos.json");
const lista = JSON.parse(fs.readFileSync(rutaLista, "utf8"));
if (!lista.includes("values/arranque.xml")) {
  lista.push("values/arranque.xml");
  lista.sort();
  fs.writeFileSync(rutaLista, JSON.stringify(lista, null, 1) + "\n");
}
console.log(unicos.length + " temas de arranque");
