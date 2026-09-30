// Los iconos de la app de Android, uno por mundo, listos para copiar a
// `android/app/src/main/res/` de la carpeta «Norata App Android».
//
//   node mundos/iconos/android.js      (después de generar.py)
//
// Por cada mundo sale:
//   - un icono ADAPTATIVO (Android 8+): el dibujo entero en la capa de
//     delante, en los 72 dp del centro de un lienzo de 108, y el color de su
//     orilla detrás. Así la máscara del lanzador —círculo, gota, cuadrado—
//     recorta justo el círculo para el que está dibujado el icono, y los 18
//     dp de cada lado que Android guarda para el efecto de paralaje enseñan
//     el mismo color y no un borde;
//   - la capa MONOCROMA (Android 13, «iconos con tema»): el isotipo liso,
//     compartido por todos, para quien tiene esos iconos encendidos;
//   - el icono de siempre, en PNG con la esquina redondeada, para los
//     teléfonos de antes de Android 8.
// Y el trozo de manifiesto con las dieciocho entradas (`activity-alias`),
// escrito aquí para que ningún nombre se teclee a mano.
const path = require("path");
const fs = require("fs");
let chromium;
try { ({ chromium } = require("playwright")); }
catch (e) { ({ chromium } = require(path.join(process.execPath, "../../lib/node_modules/playwright"))); }

const AQUI = __dirname;
const SVG = path.join(AQUI, "svg");
const RES = path.join(AQUI, "android", "res");
// dp -> px en cada densidad: el icono de siempre mide 48 dp; el lienzo
// adaptativo, 108.
const DENSIDADES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
const ISO = fs.readFileSync(path.join(AQUI, "..", "..", "marca", "isotipo-menta.svg"), "utf8")
  .match(/ d="([^"]+)"/)[1];

(async () => {
  const ids = fs.readdirSync(SVG).filter(f => f.endsWith(".svg") && !f.startsWith("menu-")).map(f => f.slice(0, -4)).sort();
  const nav = await chromium.launch();
  const pag = await nav.newPage();
  const colores = {};
  for (const id of ids) {
    const b64 = fs.readFileSync(path.join(SVG, id + ".svg")).toString("base64");
    // El color de detrás: el promedio de la orilla del dibujo (los 12 px de
    // fuera de 512). Es lo que se ve si el lanzador asoma más allá de la
    // máscara, y tiene que continuar el fondo sin que se note la costura.
    colores[id] = await pag.evaluate(async (src) => {
      const img = new Image(); img.src = src; await img.decode();
      const c = document.createElement("canvas"); c.width = c.height = 512;
      const g = c.getContext("2d"); g.drawImage(img, 0, 0, 512, 512);
      const d = g.getImageData(0, 0, 512, 512).data;
      let r = 0, v = 0, a = 0, n = 0;
      for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
        if (x > 12 && x < 499 && y > 12 && y < 499) continue;
        const i = (y * 512 + x) * 4; r += d[i]; v += d[i + 1]; a += d[i + 2]; n++;
      }
      const h = (q) => Math.round(q / n).toString(16).padStart(2, "0");
      return "#" + h(r) + h(v) + h(a);
    }, "data:image/svg+xml;base64," + b64);

    for (const [dens, f] of Object.entries(DENSIDADES)) {
      const dir = path.join(RES, "mipmap-" + dens);
      fs.mkdirSync(dir, { recursive: true });
      // La capa de delante: 108 dp, con el dibujo en los 72 del centro.
      const lado = Math.round(108 * f), dibujo = Math.round(72 * f), m = (lado - dibujo) / 2;
      await pag.setViewportSize({ width: lado, height: lado });
      await pag.setContent(`<style>html,body{margin:0;background:transparent}img{position:absolute;left:${m}px;top:${m}px;width:${dibujo}px;height:${dibujo}px}</style><img src="data:image/svg+xml;base64,${b64}">`);
      await pag.screenshot({ path: path.join(dir, `icono_${id}_frente.png`), omitBackground: true, clip: { x: 0, y: 0, width: lado, height: lado } });
      // El de antes de Android 8: 48 dp, el dibujo entero con la esquina de
      // un icono de app (no hay máscara que se la ponga).
      const chico = Math.round(48 * f);
      await pag.setViewportSize({ width: chico, height: chico });
      await pag.setContent(`<style>html,body{margin:0;background:transparent}img{display:block;width:${chico}px;height:${chico}px;border-radius:22%}</style><img src="data:image/svg+xml;base64,${b64}">`);
      await pag.screenshot({ path: path.join(dir, `icono_${id}.png`), omitBackground: true, clip: { x: 0, y: 0, width: chico, height: chico } });
    }

    const any = path.join(RES, "mipmap-anydpi-v26");
    fs.mkdirSync(any, { recursive: true });
    fs.writeFileSync(path.join(any, `icono_${id}.xml`),
      `<?xml version="1.0" encoding="utf-8"?>\n<!-- Generado por mundos/iconos/android.js. -->\n` +
      `<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n` +
      `    <background android:drawable="@color/icono_${id}_fondo"/>\n` +
      `    <foreground android:drawable="@mipmap/icono_${id}_frente"/>\n` +
      `    <monochrome android:drawable="@drawable/icono_monocromo"/>\n` +
      `</adaptive-icon>\n`);
  }
  await nav.close();

  // Los colores de detrás, en un solo archivo.
  fs.mkdirSync(path.join(RES, "values"), { recursive: true });
  fs.writeFileSync(path.join(RES, "values", "iconos_mundos.xml"),
    `<?xml version="1.0" encoding="utf-8"?>\n<!-- Generado por mundos/iconos/android.js: el color de la orilla de cada icono. -->\n<resources>\n` +
    ids.map(id => `    <color name="icono_${id}_fondo">${colores[id]}</color>`).join("\n") + `\n</resources>\n`);

  // La capa monocroma: el isotipo en un vector de 108 dp, en los 44 del
  // centro (la zona que Android deja para esa capa). Sale del trazo de la
  // marca, no se redibuja.
  const escala = 44 / 217.78, desp = 54 - 125 * escala;
  fs.mkdirSync(path.join(RES, "drawable"), { recursive: true });
  fs.writeFileSync(path.join(RES, "drawable", "icono_monocromo.xml"),
    `<?xml version="1.0" encoding="utf-8"?>\n<!-- Generado por mundos/iconos/android.js desde marca/isotipo-menta.svg. -->\n` +
    `<vector xmlns:android="http://schemas.android.com/apk/res/android"\n    android:width="108dp" android:height="108dp"\n    android:viewportWidth="108" android:viewportHeight="108">\n` +
    `    <group android:translateX="${desp.toFixed(3)}" android:translateY="${desp.toFixed(3)}" android:scaleX="${escala.toFixed(5)}" android:scaleY="${escala.toFixed(5)}">\n` +
    `        <path android:fillColor="#FFFFFFFF" android:fillType="evenOdd" android:pathData="${ISO}"/>\n    </group>\n</vector>\n`);

  // El trozo de manifiesto. Solo la casa nace encendida.
  const alias = ids.map(id =>
    `        <activity-alias\n            android:name=".Icono_${id}"\n            android:targetActivity=".MainActivity"\n` +
    `            android:enabled="${id === "casa"}"\n            android:exported="true"\n` +
    `            android:icon="@mipmap/icono_${id}"\n            android:roundIcon="@mipmap/icono_${id}"\n            android:label="@string/app_name">\n` +
    `            <intent-filter>\n                <action android:name="android.intent.action.MAIN" />\n                <category android:name="android.intent.category.LAUNCHER" />\n            </intent-filter>\n        </activity-alias>`).join("\n");
  fs.writeFileSync(path.join(AQUI, "android", "manifiesto-iconos.xml"),
    `<!-- Generado por mundos/iconos/android.js. Va DENTRO de <application>, DESPUÉS\n     de la <activity> de MainActivity (un alias tiene que ir detrás de la\n     actividad a la que apunta). Ver LEEME.md. -->\n` + alias + "\n");
  // La lista de lo que hay en `res/`, para que `instalar-iconos.js` sepa qué
  // bajar cuando se corre suelto, lejos de este repositorio.
  const lista = [];
  (function recorrer(dir, rel) {
    for (const f of fs.readdirSync(dir).sort()) {
      const p = path.join(dir, f), r = rel ? rel + "/" + f : f;
      if (fs.statSync(p).isDirectory()) recorrer(p, r); else lista.push(r);
    }
  })(RES, "");
  fs.writeFileSync(path.join(AQUI, "android", "archivos.json"), JSON.stringify(lista, null, 1) + "\n");
  console.log(`${ids.length} iconos para Android`);
})();
