// Mete el icono de cada mundo en la app de Android, de un solo golpe.
//
// Se corre DENTRO de la carpeta «Norata App Android», la que tiene la carpeta
// `android/` adentro:
//
//     node instalar-iconos.js
//
// Hace los seis pasos de `LEEME.md` sin que haya que abrir un solo archivo:
// copia los iconos, pone el complemento junto a MainActivity, lo registra,
// arregla el manifiesto y añade la dependencia que reinicia la app. Se puede
// correr dos veces sin miedo: lo que ya está hecho se lo salta.
//
// Antes de tocar nada guarda una copia de los tres archivos que edita (con
// `.antes-iconos` al final). Para dejarlo todo como estaba:
//
//     node instalar-iconos.js --deshacer
//
// Si se corre desde este repositorio usa los archivos de al lado; si se corre
// suelto, los baja de GitHub (el repositorio es público).
"use strict";
const fs = require("fs");
const path = require("path");

const RAMAS = ["main", "ccr-f8899ab5-wo22og"];
const CRUDO = (rama) => `https://raw.githubusercontent.com/Lalo1241/norata/${rama}/mundos/iconos/android/`;
const DEPENDENCIA = "com.jakewharton:process-phoenix:3.0.0";

const ok = (m) => console.log("  ✓ " + m);
const nada = (m) => console.log("  · " + m);
function alto(m) {
  console.error("\n  ✗ " + m + "\n");
  process.exit(1);
}

// ---------- Dónde está el proyecto ----------
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

function respaldar(ruta) {
  const copia = ruta + ".antes-iconos";
  if (!fs.existsSync(copia)) fs.copyFileSync(ruta, copia);
}

// ---------- De dónde salen los archivos ----------
async function fuente() {
  const aqui = __dirname;
  if (fs.existsSync(path.join(aqui, "archivos.json")) && fs.existsSync(path.join(aqui, "res"))) {
    return {
      lista: JSON.parse(fs.readFileSync(path.join(aqui, "archivos.json"), "utf8")),
      leer: async (rel) => fs.readFileSync(path.join(aqui, rel)),
      donde: "los archivos de al lado",
    };
  }
  if (typeof fetch !== "function") alto("Tu Node es muy viejo para bajar los archivos (hace falta la versión 18 o más).");
  for (const rama of RAMAS) {
    const r = await fetch(CRUDO(rama) + "archivos.json").catch(() => null);
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
  alto("No pude bajar los iconos de GitHub. Revisa tu conexión y vuelve a correrlo.");
}

// ---------- Los pasos ----------
async function instalar() {
  const proyecto = buscarProyecto();
  const main = path.join(proyecto, "app", "src", "main");
  console.log("\nProyecto: " + proyecto);
  const src = await fuente();
  console.log("Archivos: " + src.donde + "\n");

  // 1. Los iconos.
  let nuevos = 0;
  for (const rel of src.lista) {
    const destino = path.join(main, "res", ...rel.split("/"));
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, await src.leer("res/" + rel));
    nuevos++;
  }
  ok(nuevos + " archivos de iconos copiados a res/");

  // 2. El complemento, junto a MainActivity y con SU paquete.
  const actividad = buscarArchivo(path.join(main, "java"), ["MainActivity.java", "MainActivity.kt"])
    || (fs.existsSync(path.join(main, "kotlin")) && buscarArchivo(path.join(main, "kotlin"), ["MainActivity.java", "MainActivity.kt"]));
  if (!actividad) alto("No encuentro MainActivity. Esto no parece un proyecto de Capacitor.");
  let act = fs.readFileSync(actividad, "utf8");
  const paquete = (act.match(/^\s*package\s+([\w.]+)/m) || [])[1];
  if (!paquete) alto("MainActivity no dice su paquete (la línea «package …» de arriba).");
  const plugin = (await src.leer("IconoPlugin.java")).toString("utf8")
    .replace(/^package\s+[\w.]+;/m, "package " + paquete + ";");
  fs.writeFileSync(path.join(path.dirname(actividad), "IconoPlugin.java"), plugin);
  ok("IconoPlugin.java puesto junto a MainActivity (paquete " + paquete + ")");

  // 3. Registrarlo en MainActivity.
  const kotlin = actividad.endsWith(".kt");
  const registro = kotlin ? "registerPlugin(IconoPlugin::class.java)" : "registerPlugin(IconoPlugin.class);";
  if (act.includes("registerPlugin(IconoPlugin")) {
    nada("MainActivity ya lo registraba");
  } else {
    respaldar(actividad);
    const nl = salto(act);
    const conSuper = act.match(/^([ \t]*)super\.onCreate\(/m);
    if (conSuper) {
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

  // 4. El manifiesto: sin el LAUNCHER de MainActivity, y con las entradas.
  const rutaMan = path.join(main, "AndroidManifest.xml");
  let man = fs.readFileSync(rutaMan, "utf8");
  const bloque = man.match(/<activity\b[^>]*android:name="([^"]*MainActivity)"[\s\S]*?<\/activity>/);
  if (!bloque) alto("En AndroidManifest.xml no encuentro la <activity> de MainActivity.");
  const nombreAct = bloque[1];
  const nlm = salto(man);
  // Solo el filtro que la pone en el cajón de apps: el de la vuelta de Google
  // (app.norata://login) tiene que quedarse.
  const limpio = bloque[0].replace(/[ \t]*<intent-filter\b[\s\S]*?<\/intent-filter>[ \t]*\r?\n?/g,
    (f) => (/category\.LAUNCHER/.test(f) ? "" : f));
  const cambiaLauncher = limpio !== bloque[0];
  const tieneAlias = man.includes("Icono_casa");
  if (!cambiaLauncher && tieneAlias) {
    nada("El manifiesto ya estaba listo");
  } else {
    respaldar(rutaMan);
    let alias = "";
    if (!tieneAlias) {
      alias = (await src.leer("manifiesto-iconos.xml")).toString("utf8")
        .replace(/^<!--[\s\S]*?-->\r?\n/, "")
        .replace(/android:targetActivity="[^"]*"/g, `android:targetActivity="${nombreAct}"`)
        .replace(/\r?\n/g, nlm).trimEnd();
      alias = nlm + alias;
    }
    man = man.replace(bloque[0], limpio + alias);
    fs.writeFileSync(rutaMan, man);
    if (cambiaLauncher) ok("MainActivity ya no sale sola en el cajón de apps (ahora entra por su icono)");
    if (!tieneAlias) ok("Las dieciocho entradas de icono, en el manifiesto");
  }

  // 5. La dependencia que reinicia la app.
  const rutaGradle = ["build.gradle", "build.gradle.kts"].map((f) => path.join(proyecto, "app", f)).find((f) => fs.existsSync(f));
  if (!rutaGradle) alto("No encuentro app/build.gradle.");
  let gradle = fs.readFileSync(rutaGradle, "utf8");
  if (gradle.includes("process-phoenix")) {
    nada("build.gradle ya tenía la dependencia");
  } else {
    respaldar(rutaGradle);
    const linea = rutaGradle.endsWith(".kts") ? `    implementation("${DEPENDENCIA}")` : `    implementation "${DEPENDENCIA}"`;
    if (!/^dependencies\s*\{/m.test(gradle)) alto("En app/build.gradle no encuentro el bloque «dependencies {».");
    gradle = gradle.replace(/^dependencies\s*\{[ \t]*\r?\n/m, (m) => m + linea + salto(gradle));
    fs.writeFileSync(rutaGradle, gradle);
    ok("La dependencia que reinicia la app, en build.gradle");
  }

  // 6. La pantalla de arranque de Android, sin icono (0.7.146.2).
  //    Desde Android 12, antes de que la app pinte nada, el sistema pone una
  //    pantalla con el icono de la app en medio. Eduardo: «rompe con la
  //    magia» — y además es el icono de siempre, no el del mundo. Se deja el
  //    fondo de la noche de la app (#10151d, el mismo de su carga) y el icono
  //    en transparente. Con `Theme.SplashScreen` (el de Capacitor) los
  //    nombres van sin `android:`; con un tema de Android a secas, con él.
  const rutaEstilos = path.join(main, "res", "values", "styles.xml");
  if (!fs.existsSync(rutaEstilos)) {
    nada("No encontré res/values/styles.xml: la pantalla de arranque se queda como estaba");
  } else {
    let estilos = fs.readFileSync(rutaEstilos, "utf8");
    const nle = salto(estilos);
    const tema = estilos.match(/<style\s+name="([^"]*Launch[^"]*)"([^>]*)>([\s\S]*?)<\/style>/);
    if (!tema) {
      nada("No encontré el tema de arranque («…Launch») en styles.xml: se queda como estaba");
    } else {
      const pre = /SplashScreen/.test(tema[2]) ? "" : "android:";
      const poner = { [pre + "windowSplashScreenAnimatedIcon"]: "@android:color/transparent",
                      [pre + "windowSplashScreenBackground"]: "#10151d" };
      let cuerpo = tema[3];
      const sangria = (cuerpo.match(/\n([ \t]+)<item/) || [, "        "])[1];
      let cambio = false;
      for (const [nombre, valor] of Object.entries(poner)) {
        const re = new RegExp('<item\\s+name="' + nombre.replace(":", "\\:") + '"\\s*>[^<]*</item>');
        const linea = `<item name="${nombre}">${valor}</item>`;
        if (re.test(cuerpo)) {
          if (!cuerpo.match(re)[0].includes(valor)) { cuerpo = cuerpo.replace(re, linea); cambio = true; }
        } else {
          cuerpo = cuerpo.replace(/\s*$/, nle + sangria + linea + cuerpo.match(/\s*$/)[0]);
          cambio = true;
        }
      }
      if (!cambio) {
        nada("La pantalla de arranque ya iba sin icono");
      } else {
        respaldar(rutaEstilos);
        estilos = estilos.replace(tema[0], tema[0].replace(tema[3], cuerpo));
        fs.writeFileSync(rutaEstilos, estilos);
        ok("La pantalla de arranque de Android, sin icono y con el fondo de la app");
      }
    }
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

La primera vez puede desaparecer el acceso directo de la pantalla de inicio:
se vuelve a arrastrar desde el cajón de apps.

Si algo sale mal: node instalar-iconos.js --deshacer
`);
}

function deshacer() {
  const proyecto = buscarProyecto();
  const main = path.join(proyecto, "app", "src", "main");
  let n = 0;
  (function recorrer(dir) {
    for (const f of fs.readdirSync(dir)) {
      const p = path.join(dir, f);
      if (fs.statSync(p).isDirectory()) { if (f !== "build" && f !== "node_modules") recorrer(p); }
      else if (f.endsWith(".antes-iconos")) {
        fs.copyFileSync(p, p.slice(0, -".antes-iconos".length));
        fs.unlinkSync(p);
        ok("Devuelto " + path.relative(proyecto, p.slice(0, -".antes-iconos".length)));
        n++;
      }
    }
  })(proyecto);
  const act = buscarArchivo(path.join(main, "java"), ["IconoPlugin.java"]);
  if (act) { fs.unlinkSync(act); ok("Quitado IconoPlugin.java"); n++; }
  // Los iconos de res/ se quedan: no los usa nadie si el manifiesto no los
  // nombra, y borrarlos a ciegas podría llevarse algo que no es nuestro.
  console.log(n ? "\nListo: el proyecto está como antes.\n" : "\nNo había nada que deshacer.\n");
}

(process.argv.includes("--deshacer") ? Promise.resolve(deshacer()) : instalar())
  .catch((e) => alto(e && e.message ? e.message : String(e)));
