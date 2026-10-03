// Mete los widgets de Norata en la app de Android, de un solo golpe.
//
// Se corre DENTRO de la carpeta «Norata App Android», la que tiene la carpeta
// `android/` adentro:
//
//     node instalar-widgets.js
//
// Hace los pasos de `LEEME.md` sin abrir un solo archivo: pone los cuatro
// archivos del complemento junto a MainActivity, lo registra, copia los moldes
// del widget y añade al manifiesto el widget y el servicio de su lista. Se
// puede correr dos veces: lo que ya está hecho se lo salta.
//
// Antes de tocar nada guarda una copia de lo que edita (con `.antes-widgets`
// al final). Para dejarlo todo como estaba:
//
//     node instalar-widgets.js --deshacer
//
// Si se corre desde este repositorio usa los archivos de al lado; si se corre
// suelto, los baja de GitHub (el repositorio es público).
"use strict";
const fs = require("fs");
const path = require("path");

const RAMAS = ["main"];
const CRUDO = (rama) => `https://raw.githubusercontent.com/Lalo1241/norata/${rama}/nativo/widgets/`;
const JAVA = ["Widgets.java", "WidgetsPlugin.java", "HoyWidget.java", "HoyLista.java"];
/* Lo de res/ (las letras, los moldes, sus dibujos y la ficha del widget) va en
   archivos.json: es la lista que se baja de GitHub cuando esto corre suelto. */
const LISTA = "archivos.json";
const COPIA = ".antes-widgets";

const ok = (m) => console.log("  ✓ " + m);
const nada = (m) => console.log("  · " + m);
function alto(m) {
  console.error("\n  ✗ " + m + "\n");
  process.exit(1);
}

function buscarProyecto() {
  const candidatos = [process.cwd(), path.join(process.cwd(), "android"), path.dirname(process.cwd())];
  for (const c of candidatos) {
    const base = fs.existsSync(path.join(c, "app", "src", "main", "AndroidManifest.xml")) ? c
      : fs.existsSync(path.join(c, "android", "app", "src", "main", "AndroidManifest.xml")) ? path.join(c, "android") : null;
    if (base) return base;
  }
  alto("No encuentro el proyecto de Android. Abre la terminal DENTRO de la carpeta «Norata App Android» (la que tiene la carpeta «android») y vuelve a correrlo.");
}

function buscarArchivo(dir, nombres) {
  if (!fs.existsSync(dir)) return null;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      const r = buscarArchivo(p, nombres);
      if (r) return r;
    } else if (nombres.includes(f)) return p;
  }
  return null;
}

// Cada archivo conserva sus saltos de línea: el proyecto está en Windows y
// escribirle LF en medio de un archivo CRLF lo deja mezclado.
function salto(txt) { return txt.includes("\r\n") ? "\r\n" : "\n"; }

// Nada de esto toca res/ más que para AÑADIR archivos, así que las copias van
// al lado del original (Gradle solo se queja de copias DENTRO de res/; ver el
// instalador de los iconos).
function respaldar(ruta) {
  if (!fs.existsSync(ruta + COPIA)) fs.copyFileSync(ruta, ruta + COPIA);
}

async function fuente() {
  const aqui = __dirname;
  if (JAVA.every((f) => fs.existsSync(path.join(aqui, f)))) {
    return { leer: async (rel) => fs.readFileSync(path.join(aqui, rel)), donde: "los archivos de al lado",
      lista: JSON.parse(fs.readFileSync(path.join(aqui, LISTA), "utf8")) };
  }
  if (typeof fetch !== "function") alto("Tu Node es muy viejo para bajar los archivos (hace falta la versión 18 o más).");
  for (const rama of RAMAS) {
    const r = await fetch(CRUDO(rama) + LISTA).catch(() => null);
    if (!r || !r.ok) continue;
    const lista = await r.json();
    return {
      lista,
      leer: async (rel) => {
        const q = await fetch(CRUDO(rama) + rel);
        if (!q.ok) alto("No pude bajar " + rel + " de GitHub (" + q.status + "). Revisa tu conexión y vuelve a correrlo.");
        return Buffer.from(await q.arrayBuffer());
      },
      donde: "GitHub (rama " + rama + ")",
    };
  }
  alto("No pude bajar los archivos de GitHub. Revisa tu conexión y vuelve a correrlo.");
}

async function instalar() {
  const proyecto = buscarProyecto();
  const main = path.join(proyecto, "app", "src", "main");
  console.log("\nProyecto: " + proyecto);
  const src = await fuente();
  console.log("Archivos: " + src.donde + "\n");

  // 1. El complemento, junto a MainActivity y con SU paquete.
  const actividad = buscarArchivo(path.join(main, "java"), ["MainActivity.java", "MainActivity.kt"])
    || buscarArchivo(path.join(main, "kotlin"), ["MainActivity.java", "MainActivity.kt"]);
  if (!actividad) alto("No encuentro MainActivity. Esto no parece un proyecto de Capacitor.");
  let act = fs.readFileSync(actividad, "utf8");
  const paquete = (act.match(/^\s*package\s+([\w.]+)/m) || [])[1];
  if (!paquete) alto("MainActivity no dice su paquete (la línea «package …» de arriba).");
  for (const f of JAVA) {
    const txt = (await src.leer(f)).toString("utf8").replace(/^package\s+[\w.]+;/m, "package " + paquete + ";");
    fs.writeFileSync(path.join(path.dirname(actividad), f), txt);
  }
  ok("Los " + JAVA.length + " archivos del complemento, junto a MainActivity (paquete " + paquete + ")");

  // 2. Registrarlo en MainActivity.
  const kotlin = actividad.endsWith(".kt");
  const registro = kotlin ? "registerPlugin(WidgetsPlugin::class.java)" : "registerPlugin(WidgetsPlugin.class);";
  if (act.includes("registerPlugin(WidgetsPlugin")) {
    nada("MainActivity ya lo registraba");
  } else {
    respaldar(actividad);
    const nl = salto(act);
    if (/^([ \t]*)super\.onCreate\(/m.test(act)) {
      act = act.replace(/^([ \t]*)super\.onCreate\(/m, (m, sangria) => sangria + registro + nl + m);
    } else if (/extends\s+BridgeActivity\s*\{\s*\}/.test(act) || /:\s*BridgeActivity\(\)\s*(\{\s*\})?\s*$/m.test(act)) {
      const cuerpo = kotlin
        ? ` : BridgeActivity() {${nl}    override fun onCreate(savedInstanceState: Bundle?) {${nl}        ${registro}${nl}        super.onCreate(savedInstanceState)${nl}    }${nl}}`
        : ` extends BridgeActivity {${nl}    @Override${nl}    public void onCreate(Bundle savedInstanceState) {${nl}        ${registro}${nl}        super.onCreate(savedInstanceState);${nl}    }${nl}}`;
      act = kotlin
        ? act.replace(/\s*:\s*BridgeActivity\(\)\s*(\{\s*\})?\s*$/m, cuerpo)
        : act.replace(/\s*extends\s+BridgeActivity\s*\{\s*\}/, cuerpo);
      if (!/import\s+android\.os\.Bundle/.test(act)) {
        act = act.replace(/^(\s*package\s+[\w.]+;?)/m, "$1" + nl + nl + "import android.os.Bundle" + (kotlin ? "" : ";"));
      }
    } else {
      alto("MainActivity tiene una forma que no esperaba y no quiero adivinar. Añade a mano, en su onCreate y antes de super.onCreate, esta línea:\n\n      " + registro);
    }
    fs.writeFileSync(actividad, act);
    ok("MainActivity registra el complemento");
  }

  // 3. Lo de res/: las letras (Outfit), los moldes, sus dibujos y la ficha del widget.
  //    Todos se llaman widget_* u outfit_*: se SUMAN a lo que hay y no pisan nada.
  //    Las letras son las mismas de los avisos; si ya estaban, quedan iguales.
  for (const rel of src.lista) {
    const destino = path.join(main, "res", ...rel.split("/"));
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, await src.leer("res/" + rel));
  }
  ok(src.lista.length + " archivos en res/: las letras, los moldes, sus dibujos y la ficha del widget");

  // 4. El manifiesto: el widget y el servicio que llena su lista.
  const rutaMan = path.join(main, "AndroidManifest.xml");
  let man = fs.readFileSync(rutaMan, "utf8");
  const nlm = salto(man);
  if (man.includes("HoyWidget")) {
    nada("El manifiesto ya estaba listo");
  } else {
    respaldar(rutaMan);
    // Con el nombre COMPLETO: «.HoyWidget» se resuelve contra el namespace de
    // la app, que puede no ser el paquete del código. El widget va `exported`
    // porque quien lo repinta es el sistema; el servicio no, y solo lo puede
    // llamar el sistema (BIND_REMOTEVIEWS).
    const piezas = [
      `        <receiver android:name="${paquete}.HoyWidget" android:exported="true" android:label="Hoy">`,
      `            <intent-filter>`,
      `                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />`,
      `            </intent-filter>`,
      `            <meta-data android:name="android.appwidget.provider" android:resource="@xml/widget_hoy_info" />`,
      `        </receiver>`,
      `        <service android:name="${paquete}.HoyLista" android:exported="false"`,
      `            android:permission="android.permission.BIND_REMOTEVIEWS" />`,
    ].join(nlm);
    if (!/^([ \t]*)<\/application>/m.test(man)) alto("En AndroidManifest.xml no encuentro </application>.");
    man = man.replace(/^([ \t]*)<\/application>/m, (m) => piezas + nlm + m);
    fs.writeFileSync(rutaMan, man);
    ok("El widget Hoy y el servicio de su lista, en el manifiesto");
  }

  console.log(`
Listo. Ahora el APK, firmado con tu llave, como dice el LEEME de esta carpeta
(NO con el ▶ de Android Studio: firma con otra llave y el teléfono no deja
instalarla encima sin desinstalar). En PowerShell, una línea a la vez:

  node traer-web.mjs
  npx cap sync android
  cd android; $env:JAVA_HOME = "$PWD\\..\\.herramientas\\jdk-21"; .\\gradlew.bat assembleRelease

Queda en android\\app\\build\\outputs\\apk\\release\\app-release.apk: pásalo al
teléfono y ábrelo para actualizar.

Después, en el teléfono: mantén el dedo en un hueco de la pantalla de inicio,
toca «Widgets», busca Norata y arrastra «Hoy».

Si algo sale mal: node instalar-widgets.js --deshacer
`);
}

function deshacer() {
  const proyecto = buscarProyecto();
  const main = path.join(proyecto, "app", "src", "main");
  let n = 0;
  (function recorrer(dir) {
    for (const f of fs.readdirSync(dir)) {
      const p = path.join(dir, f);
      if (fs.statSync(p).isDirectory()) {
        if (f !== "build" && f !== "node_modules") recorrer(p);
      } else if (f.endsWith(COPIA)) {
        const original = p.slice(0, -COPIA.length);
        fs.copyFileSync(p, original);
        fs.unlinkSync(p);
        ok("Devuelto " + path.relative(proyecto, original));
        n++;
      }
    }
  })(proyecto);
  for (const f of JAVA) {
    const p = buscarArchivo(path.join(main, "java"), [f]) || buscarArchivo(path.join(main, "kotlin"), [f]);
    if (p) { fs.unlinkSync(p); ok("Quitado " + f); n++; }
  }
  const aqui = __dirname;
  const lista = fs.existsSync(path.join(aqui, LISTA)) ? JSON.parse(fs.readFileSync(path.join(aqui, LISTA), "utf8")) : [];
  // Las letras (font/outfit_*) NO se quitan: son las mismas de los avisos, y
  // llevárselas dejaría sin letra a los avisos si están instalados.
  for (const rel of lista) {
    if (rel.startsWith("font/")) continue;
    const p = path.join(main, "res", ...rel.split("/"));
    if (fs.existsSync(p)) { fs.unlinkSync(p); n++; }
  }
  // Corrido suelto no hay lista al lado: se reconocen por el nombre, que es solo nuestro.
  for (const carpeta of ["drawable", "layout", "xml"]) {
    const d = path.join(main, "res", carpeta);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d)) if (/^widget_/.test(f)) { fs.unlinkSync(path.join(d, f)); n++; }
  }
  ok("Quitados los archivos de los widgets en res/");
  console.log(n ? "\nListo: el proyecto está como antes.\n" : "\nNo había nada que deshacer.\n");
}

(process.argv.includes("--deshacer") ? Promise.resolve(deshacer()) : instalar())
  .catch((e) => alto(e && e.message ? e.message : String(e)));
