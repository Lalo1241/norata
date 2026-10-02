// node tiras.mjs <salida.png> <x0> Nombre=captura.png Nombre=captura.png …
// Varias capturas de la MISMA pantalla en tiras diagonales (60°), cada una con
// su rótulo. `x0` es donde empieza lo que cambia (el borde del menú lateral):
// las tiras se reparten de ahí a la derecha. Las capturas se sirven desde
// /_cap/ de la app, y el rótulo va en Outfit, que sale de css/fuente.css.
import { conecta, nav, foto, cierra, duerme } from "./cdp.mjs";
const [salida, x0s, ...pares] = process.argv.slice(2);
const W = 1440, H = 810, x0 = Number(x0s), n = pares.length;
const dx = (H / 2) / Math.tan(Math.PI / 3);
const medio = (i) => i === 0 ? -9999 : i === n ? 9999 : x0 + (W - x0) * i / n;
let html = `<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="/css/fuente.css"><style>
body{margin:0;width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#10151d;font-family:Outfit,sans-serif}
img{position:absolute;inset:0;width:${W}px;height:${H}px}
b{position:absolute;bottom:26px;transform:translateX(-50%);font-weight:700;font-size:24px;color:#eaf1ef;background:rgba(16,21,29,.88);border:1.5px solid rgba(234,241,239,.28);border-radius:999px;padding:7px 20px;white-space:nowrap}
svg{position:absolute;inset:0}</style>`;
let rayas = "";
pares.forEach((p, i) => {
  const [nombre, archivo] = p.split("=");
  const a = medio(i), b = medio(i + 1);
  html += `<img src="/_cap/${archivo}" style="clip-path:polygon(${a + dx}px 0,${b + dx}px 0,${b - dx}px ${H}px,${a - dx}px ${H}px)">`;
  const y = H - 48, corre = (H / 2 - y) / Math.tan(Math.PI / 3);
  const izq = Math.max(i === 0 ? x0 - 120 : a + corre, 0), der = Math.min(b + corre, W);
  html += `<b style="left:${(izq + der) / 2}px">${nombre}</b>`;
  if (i) rayas += `<line x1="${a + dx}" y1="0" x2="${a - dx}" y2="${H}" stroke="#10151d" stroke-width="7"/><line x1="${a + dx}" y1="0" x2="${a - dx}" y2="${H}" stroke="#fff" stroke-width="3"/>`;
});
html += `<svg width="${W}" height="${H}">${rayas}</svg>`;
const { writeFileSync } = await import("node:fs");
writeFileSync(process.env.RAIZ + "/_cap/tiras.html", html);
await conecta();
await nav("http://localhost:8180/_cap/tiras.html?x=" + Date.now(), 2500);
await foto(salida, { x: 0, y: 0, width: W, height: H });
cierra();
