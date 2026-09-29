// Saca los PNG de los SVG que escribe generar.py, con el Chromium de la
// máquina: es el mismo motor que pinta la app, así que los filtros y los
// degradados salen igual que en la vista.
//
//   node mundos/iconos/rasterizar.js
//
// Por cada mundo: 512 (tienda y manifest), 192 (manifest) y 180 (iOS).
// También arma `hoja.png`, todos juntos, para mirarlos de un vistazo.
const path = require("path");
const fs = require("fs");
let chromium;
try { ({ chromium } = require("playwright")); }
catch (e) { ({ chromium } = require(path.join(process.execPath, "../../lib/node_modules/playwright"))); }

const AQUI = __dirname;
const SVG = path.join(AQUI, "svg");
const PNG = path.join(AQUI, "png");
const TAMAÑOS = [512, 192, 180];

(async () => {
  fs.mkdirSync(PNG, { recursive: true });
  const nav = await chromium.launch();
  const pag = await nav.newPage();
  const ids = fs.readdirSync(SVG).filter(f => f.endsWith(".svg")).map(f => f.slice(0, -4));
  for (const id of ids) {
    const src = fs.readFileSync(path.join(SVG, id + ".svg"), "utf8");
    for (const t of TAMAÑOS) {
      await pag.setViewportSize({ width: t, height: t });
      await pag.setContent(`<style>html,body{margin:0}svg{display:block;width:${t}px;height:${t}px}</style>${src}`);
      await pag.screenshot({ path: path.join(PNG, `${id}-${t}.png`), clip: { x: 0, y: 0, width: t, height: t } });
    }
  }
  // La hoja: 6 por fila, con máscara redondeada, a 160 px.
  const celdas = ids.map(id => `<div><img src="data:image/svg+xml;base64,${Buffer.from(fs.readFileSync(path.join(SVG, id + ".svg"))).toString("base64")}"><b>${id}</b></div>`).join("");
  await pag.setViewportSize({ width: 6 * 184 + 24, height: 800 });
  await pag.setContent(`<style>body{margin:0;padding:12px;background:#0b0f15;display:grid;grid-template-columns:repeat(6,184px);font:12px system-ui;color:#9aa7b6}
    div{padding:12px;text-align:center} img{width:160px;height:160px;border-radius:36px;display:block}</style>${celdas}`);
  const alto = await pag.evaluate(() => document.body.scrollHeight);
  await pag.setViewportSize({ width: 6 * 184 + 24, height: alto });
  await pag.screenshot({ path: path.join(AQUI, "hoja.png") });
  await nav.close();
  console.log(`${ids.length} mundos × ${TAMAÑOS.length} tamaños`);
})();
