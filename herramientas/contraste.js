/* Contraste de los mundos. Cuarta versión, y las tres anteriores fallaron
   por el mismo sitio desde ángulos distintos:
     v1  tomaba un rgba(255,255,255,.035) por blanco opaco  -> reprobaba Blueprint
     v2  no sabía leer un degradado                          -> reprobaba Averno y Ventisca
     v3  fotografiaba el texto, que viene sobre transparente -> reprobaba todo
     v4  leía la tinta con una expresión que solo entiende rgb() -> ver abajo
   Lo que funciona: fotografiar la SUPERFICIE (la tarjeta, el lienzo, el chip),
   que sí tiene fondo, y sacar de ahí el color más repetido —el fondo de
   verdad, degradado y textura incluidos—. La tinta sale del CSS, compuesta si
   es semitransparente.

   Cómo se caza un fallo del arnés y no del mundo: el número sale imposible EN
   LA DIRECCIÓN CONTRARIA al cambio. Los chips bajaron a 1,1 justo después de
   empujar su tinta HACIA el color legible del mundo. Ningún arreglo hace eso;
   la medida estaba rota. */
const { chromium } = require("playwright");
const { PNG } = require("pngjs");   // npm install pngjs playwright
const ARCHIVO = process.argv[2] || "../mundos/vista.html";
const BASE = process.cwd() + "/";

const lum = c => { const [r,g,b]=c.map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);}); return .2126*r+.7152*g+.0722*b; };
const ratio = (a,b) => { const L1=lum(a),L2=lum(b); const [h,l]=L1>L2?[L1,L2]:[L2,L1]; return (h+.05)/(l+.05); };

function dominante(buf) {
  const img = PNG.sync.read(buf), d = img.data, c = new Map();
  for (let i = 0; i < d.length; i += 4) {
    if (d[i+3] < 250) continue;                    // fuera lo transparente
    const k = (d[i]>>2<<12)|(d[i+1]>>2<<6)|(d[i+2]>>2);
    c.set(k, (c.get(k)||0)+1);
  }
  let n = 0, mk = 0; for (const [k,v] of c) if (v > n) { n = v; mk = k; }
  return [((mk>>12)&63)*4+2, ((mk>>6)&63)*4+2, (mk&63)*4+2];
}

(async () => {
  const nav = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium", args:["--no-sandbox"] });
  const pag = await (await nav.newContext({viewport:{width:1100,height:900}})).newPage();
  await pag.goto("file://" + BASE + ARCHIVO, { waitUntil:"load" });
  await pag.waitForTimeout(1200);
  await pag.evaluate(() => document.querySelectorAll(".mundo").forEach(m => m.classList.add("visto")));
  await pag.waitForTimeout(400);

  const ids = await pag.evaluate(() => [...document.querySelectorAll(".mundo")].map(m => m.id));
  const filas = [];
  for (const dom of ids) {
    const fFicha  = dominante(await pag.locator(`#${dom} .ficha`).screenshot({ type:"png" }));
    const fLienzo = dominante(await pag.locator(`#${dom} .lienzo`).screenshot({ type:"png" }));
    // Los chips van sobre SU PROPIO velo, no sobre la tarjeta: medirlos contra
    // el fondo de la ficha daba un número que no era el que ve nadie. Es la
    // parte que faltaba, y es justo donde falla un mundo de papel claro.
    const fChips = {};
    for (const c of ["c-ok","c-av","c-no"])
      fChips[c] = dominante(await pag.locator(`#${dom} .${c}`).screenshot({ type:"png" }));
    const tintas = await pag.evaluate((d) => {
      // color-mix() no se serializa como rgb(): sale "color(srgb 0.39 1 0.70)",
      // con los canales de 0 a 1. Leerlos como si fueran de 0 a 255 convierte
      // cualquier tinta en casi negro, y eso fue lo que hundió los chips a 1,1.
      const rgba = s => { const n = (s.match(/[\d.]+/g)||[]).map(Number);
        const k = /^color\(/.test(s) ? 255 : 1;
        return [(n[0]||0)*k, (n[1]||0)*k, (n[2]||0)*k, n.length>3?n[3]:1]; };
      const q = s => document.querySelector(`#${d} ${s}`);
      return { nombre: rgba(getComputedStyle(q(".nombre")).color),
               pie:    rgba(getComputedStyle(q(".pie")).color),
               cifra:  rgba(getComputedStyle(q(".cifra")).color),
               aro:    rgba(getComputedStyle(q(".aro")).borderTopColor),
               barra:  rgba(getComputedStyle(q(".barra i")).backgroundColor),
               carril: rgba(getComputedStyle(q(".barra")).backgroundColor),
               chipOk: rgba(getComputedStyle(q(".c-ok")).color),
               chipAv: rgba(getComputedStyle(q(".c-av")).color),
               chipNo: rgba(getComputedStyle(q(".c-no")).color) };
    }, dom);
    const sobre = (c, f) => c[3] >= 1 ? c.slice(0,3) : [0,1,2].map(i => c[i]*c[3] + f[i]*(1-c[3]));
    const carril = sobre(tintas.carril, fFicha);
    filas.push({ mundo: dom.replace("m-",""),
      titulo:+ratio(sobre(tintas.nombre,fFicha), fFicha).toFixed(2),
      secundario:+ratio(sobre(tintas.pie,fFicha), fFicha).toFixed(2),
      cifra:+ratio(sobre(tintas.cifra,fLienzo), fLienzo).toFixed(2),
      aro:+ratio(sobre(tintas.aro,fFicha), fFicha).toFixed(2),
      barra:+ratio(sobre(tintas.barra,carril), carril).toFixed(2),
      chipOk:+ratio(sobre(tintas.chipOk,fChips["c-ok"]), fChips["c-ok"]).toFixed(2),
      chipAv:+ratio(sobre(tintas.chipAv,fChips["c-av"]), fChips["c-av"]).toFixed(2),
      chipNo:+ratio(sobre(tintas.chipNo,fChips["c-no"]), fChips["c-no"]).toFixed(2) });
  }
  await nav.close();
  console.table(filas);
  const malos = filas.flatMap(x => [
    x.titulo<4.5?`${x.mundo}: título ${x.titulo}`:null, x.secundario<4.5?`${x.mundo}: secundario ${x.secundario}`:null,
    x.cifra<4.5?`${x.mundo}: cifra ${x.cifra}`:null, x.aro<3?`${x.mundo}: aro ${x.aro}`:null,
    x.barra<3?`${x.mundo}: barra ${x.barra}`:null,
    x.chipOk<4.5?`${x.mundo}: chip hecho ${x.chipOk}`:null,
    x.chipAv<4.5?`${x.mundo}: chip aviso ${x.chipAv}`:null,
    x.chipNo<4.5?`${x.mundo}: chip peligro ${x.chipNo}`:null ].filter(Boolean));
  console.log(malos.length ? "POR DEBAJO:\n  " + malos.join("\n  ") : "todos pasan");
})();
