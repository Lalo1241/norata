// Mete Health Connect en la app de Android, de un solo golpe (0.7.213).
//
// Se corre DENTRO de la carpeta «Norata App Android», la que tiene la carpeta
// `android/` adentro:
//
//     node instalar-salud.js
//
// Hace los pasos de `LEEME.md` sin abrir un solo archivo:
//   1. instala el complemento `@capgo/capacitor-health` con npm;
//   2. sube el `minSdkVersion` a 26 si estaba más abajo (Health Connect no
//      existe antes de Android 8);
//   3. deja en el manifiesto SOLO los cuatro permisos de lectura que Norata
//      usa (pasos, distancia, sueño y ejercicio): el complemento trae
//      cuarenta y siete, también los de escribir, y Google pregunta por cada
//      uno que se declara;
//   4. apunta la dirección del aviso de privacidad que Health Connect enseña
//      al pedir permiso;
//   5. corre `npx cap sync android`.
//
// Se puede correr dos veces: lo que ya está hecho se lo salta. Antes de tocar
// un archivo guarda una copia (`.antes-salud`). Para dejarlo como estaba:
//
//     node instalar-salud.js --deshacer
"use strict";
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const PAQUETE = "@capgo/capacitor-health@^8.11.4";
const COPIA = ".antes-salud";
const PRIVACIDAD = "https://mi.norata.app/privacidad/index.html#salud";
/* Los que se quedan. Todo lo demás que declara el complemento se quita con
   `tools:node="remove"`, que es como el manifiesto final deja de tenerlo. */
const SE_QUEDAN = ["READ_STEPS", "READ_DISTANCE", "READ_SLEEP", "READ_EXERCISE"];
const DEL_COMPLEMENTO = [
  "STEPS", "DISTANCE", "ACTIVE_CALORIES_BURNED", "HEART_RATE", "WEIGHT", "SLEEP",
  "RESPIRATORY_RATE", "OXYGEN_SATURATION", "RESTING_HEART_RATE", "HEART_RATE_VARIABILITY",
  "VO2_MAX", "BLOOD_PRESSURE", "BLOOD_GLUCOSE", "BODY_TEMPERATURE", "HEIGHT", "FLOORS_CLIMBED",
  "BODY_FAT", "BASAL_BODY_TEMPERATURE", "BASAL_METABOLIC_RATE", "TOTAL_CALORIES_BURNED",
  "MINDFULNESS", "HYDRATION", "NUTRITION"
].flatMap((t) => ["READ_" + t, "WRITE_" + t]).filter((p) => !SE_QUEDAN.includes(p));

const ok = (m) => console.log("  ✓ " + m);
const nada = (m) => console.log("  · " + m);
function alto(m) {
  console.error("\n  ✗ " + m + "\n");
  process.exit(1);
}

function buscarRaiz() {
  for (const c of [process.cwd(), path.dirname(process.cwd())]) {
    if (fs.existsSync(path.join(c, "android", "app", "src", "main", "AndroidManifest.xml"))) return c;
  }
  alto("No encuentro el proyecto de Android. Abre la terminal DENTRO de la carpeta «Norata App Android» (la que tiene la carpeta «android») y vuelve a correrlo.");
}

// Cada archivo conserva sus saltos de línea: el proyecto está en Windows.
const salto = (txt) => (txt.includes("\r\n") ? "\r\n" : "\n");
function respaldar(ruta) {
  if (!fs.existsSync(ruta + COPIA)) fs.copyFileSync(ruta, ruta + COPIA);
}
function correr(cmd, donde) {
  console.log("  → " + cmd);
  execSync(cmd, { cwd: donde, stdio: "inherit", shell: true });
}

function deshacer(raiz) {
  const archivos = [
    path.join(raiz, "android", "app", "src", "main", "AndroidManifest.xml"),
    path.join(raiz, "android", "app", "src", "main", "res", "values", "strings.xml"),
    path.join(raiz, "android", "variables.gradle"),
  ];
  for (const a of archivos) {
    if (fs.existsSync(a + COPIA)) {
      fs.copyFileSync(a + COPIA, a);
      fs.unlinkSync(a + COPIA);
      ok("Devuelto: " + path.relative(raiz, a));
    }
  }
  try { correr("npm uninstall @capgo/capacitor-health", raiz); } catch (e) { nada("npm no pudo quitar el complemento"); }
  try { correr("npx cap sync android", raiz); } catch (e) { nada("Corre «npx cap sync android» a mano"); }
  console.log("\n  Listo: todo como estaba.\n");
}

function main() {
  const raiz = buscarRaiz();
  console.log("\n  Health Connect para Norata\n  Proyecto: " + raiz + "\n");
  if (process.argv.includes("--deshacer")) return deshacer(raiz);

  // 1. El complemento
  const pj = path.join(raiz, "package.json");
  const yaEsta = fs.existsSync(pj) && /@capgo\/capacitor-health/.test(fs.readFileSync(pj, "utf8"));
  if (yaEsta) nada("El complemento ya estaba instalado");
  else { correr("npm install " + PAQUETE, raiz); ok("Complemento instalado"); }

  // 2. minSdkVersion
  const vg = path.join(raiz, "android", "variables.gradle");
  if (fs.existsSync(vg)) {
    const t = fs.readFileSync(vg, "utf8");
    const m = t.match(/minSdkVersion\s*=\s*(\d+)/);
    if (m && Number(m[1]) < 26) {
      respaldar(vg);
      fs.writeFileSync(vg, t.replace(/minSdkVersion\s*=\s*\d+/, "minSdkVersion = 26"));
      ok("minSdkVersion " + m[1] + " → 26");
    } else nada("minSdkVersion ya era " + (m ? m[1] : "?"));
  }

  // 3. El manifiesto: solo los cuatro de leer
  const mf = path.join(raiz, "android", "app", "src", "main", "AndroidManifest.xml");
  let man = fs.readFileSync(mf, "utf8");
  const n = salto(man);
  let cambio = false;
  if (!/xmlns:tools=/.test(man)) {
    man = man.replace(/<manifest\b/, '<manifest xmlns:tools="http://schemas.android.com/tools"');
    cambio = true;
  }
  const faltan = DEL_COMPLEMENTO.filter((p) => !man.includes("android.permission.health." + p + '"'));
  if (faltan.length) {
    const lineas = faltan.map((p) => `    <uses-permission android:name="android.permission.health.${p}" tools:node="remove" />`).join(n);
    man = man.replace(/(\s*)<application\b/, n + "    <!-- Health Connect (Norata 0.7.213): solo se leen pasos, distancia, sueño y ejercicio -->" + n + lineas + "$1<application");
    cambio = true;
  }
  if (cambio) { respaldar(mf); fs.writeFileSync(mf, man); ok("Manifiesto: quitados " + faltan.length + " permisos que Norata no usa"); }
  else nada("El manifiesto ya estaba");

  // 4. El aviso de privacidad
  const sx = path.join(raiz, "android", "app", "src", "main", "res", "values", "strings.xml");
  if (fs.existsSync(sx)) {
    const t = fs.readFileSync(sx, "utf8");
    if (t.includes("health_connect_privacy_policy_url")) nada("La dirección de privacidad ya estaba");
    else {
      respaldar(sx);
      fs.writeFileSync(sx, t.replace("</resources>", `    <string name="health_connect_privacy_policy_url">${PRIVACIDAD}</string>${salto(t)}</resources>`));
      ok("Dirección de privacidad apuntada");
    }
  } else nada("No encontré strings.xml: apunta a mano health_connect_privacy_policy_url");

  // 5. Capacitor
  correr("npx cap sync android", raiz);
  console.log("\n  Listo. Ahora compila e instala el APK como siempre (pasos en LEEME.md).\n");
}

main();
