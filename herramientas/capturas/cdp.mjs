// Un Chrome sin ventana manejado por su protocolo: para sacar capturas de la
// app a 1440×810 exactos, que el panel del navegador no da.
import { writeFileSync } from "node:fs";
const PUERTO = 9333;
let ws, n = 0; const espera = new Map();
export async function conecta() {
  const tabs = await (await fetch(`http://127.0.0.1:${PUERTO}/json`)).json();
  const t = tabs.find((x) => x.type === "page");
  ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && espera.has(d.id)) { espera.get(d.id)(d); espera.delete(d.id); } };
  await cmd("Page.enable"); await cmd("Runtime.enable");
  await cmd("Emulation.setDeviceMetricsOverride", { width: 1440, height: 810, deviceScaleFactor: 1, mobile: false });
}
export function cmd(method, params = {}) {
  const id = ++n; ws.send(JSON.stringify({ id, method, params }));
  return new Promise((r) => espera.set(id, r));
}
export const duerme = (ms) => new Promise((r) => setTimeout(r, ms));
export async function nav(url, ms = 2500) { await cmd("Page.navigate", { url }); await duerme(ms); }
export async function ev(expression) {
  const r = await cmd("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.result.exceptionDetails) return "ERROR: " + JSON.stringify(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text);
  return r.result.result.value;
}
export async function foto(ruta, clip) {
  const r = await cmd("Page.captureScreenshot", { format: "png", ...(clip ? { clip: { ...clip, scale: 1 } } : {}) });
  writeFileSync(ruta, Buffer.from(r.result.data, "base64"));
}
export function cierra() { ws.close(); }
