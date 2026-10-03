// node diagonal.mjs <claro.png> <oscuro.png> <salida.png> [en]
// La misma pantalla de día y de noche en una sola imagen, partida por una
// diagonal a 60°: el día a la izquierda y la noche a la derecha. Cada mitad
// lleva su cápsula abajo, en su esquina, con el sol y la luna que usa el
// selector de Aspecto de la app (`sol` y `luna` de js/01-base.js): Eduardo lo
// pidió el 2 oct 2026 para que se sepa qué lado es cuál sin adivinarlo.
// Las capturas se sirven desde /_cap/ de la app (RAIZ apunta a ella), y la
// letra es Outfit, de css/fuente.css. Sustituye a `partir.py`, que no rotulaba.
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import { conecta, nav, foto, cierra } from "./cdp.mjs";
const [claro, oscuro, salida, lengua] = process.argv.slice(2);
// Con `en`, las cápsulas en inglés: la ficha en inglés lleva su propia imagen
// (`en.src`), porque la app sí cambia de idioma.
const [RCLARO, ROSCURO] = lengua === "en" ? ["Light mode", "Dark mode"] : ["Modo claro", "Modo oscuro"];
const W = 1440, H = 810, dx = (H / 2) / Math.tan(Math.PI / 3);
const RAIZ = process.env.RAIZ || "../..";
mkdirSync(RAIZ + "/_cap", { recursive: true });
copyFileSync(claro, RAIZ + "/_cap/" + basename(claro));
copyFileSync(oscuro, RAIZ + "/_cap/" + basename(oscuro));
const SOL = '<circle cx="12" cy="12" r="4.7"/><path d="M12 1.8v2.7M12 19.5v2.7M1.8 12h2.7M19.5 12h2.7M4.8 4.8l1.9 1.9M17.3 17.3l1.9 1.9M19.2 4.8l-1.9 1.9M6.7 17.3l-1.9 1.9"/>';
const LUNA = '<path d="M20 14.2A8.4 8.4 0 019.8 4 8.4 8.4 0 1020 14.2z"/>';
const a = W / 2 + dx, b = W / 2 - dx;
const capsula = (lado, icono, texto) => `<b style="${lado}:40px"><svg viewBox="0 0 24 24">${icono}</svg>${texto}</b>`;
writeFileSync(RAIZ + "/_cap/diagonal.html", `<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="/css/fuente.css"><style>
body{margin:0;width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#10151d;font-family:Outfit,sans-serif}
img{position:absolute;inset:0;width:${W}px;height:${H}px}
b{position:absolute;bottom:52px;display:flex;align-items:center;gap:10px;font-weight:700;font-size:24px;color:#eaf1ef;background:rgba(16,21,29,.88);border:1.5px solid rgba(234,241,239,.28);border-radius:999px;padding:7px 20px 7px 16px;white-space:nowrap}
b svg{position:static;width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
svg{position:absolute;inset:0}</style>
<img src="/_cap/${basename(oscuro)}">
<img src="/_cap/${basename(claro)}" style="clip-path:polygon(0 0,${a}px 0,${b}px ${H}px,0 ${H}px)">
<svg width="${W}" height="${H}"><line x1="${a}" y1="-2" x2="${b}" y2="${H + 2}" stroke="#10151d" stroke-width="7"/><line x1="${a}" y1="-2" x2="${b}" y2="${H + 2}" stroke="#fff" stroke-width="3"/></svg>
${capsula("left", SOL, RCLARO)}${capsula("right", LUNA, ROSCURO)}`);
await conecta();
await nav("http://localhost:8180/_cap/diagonal.html?x=" + Date.now(), 2500);
await foto(salida, { x: 0, y: 0, width: W, height: H });
cierra();
