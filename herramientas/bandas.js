/* Perfil de tinta por franjas horizontales del lienzo, con el contenido
   oculto: dice DÓNDE está el dibujo, que es lo que decide si la composición
   es «cenefa arriba, campo liso» o «estampado por todas partes». */
const { chromium } = require("playwright");
const { PNG } = require("pngjs");
(async () => {
  const nav = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium", args:["--no-sandbox"] });
  const pag = await (await nav.newContext({viewport:{width:1100,height:900}})).newPage();
  await pag.goto("file://" + process.argv[2], { waitUntil:"load" }); await pag.waitForTimeout(900);
  const dom = process.argv[3];
  const arriba = await pag.evaluate(d => {
    const l = document.querySelector(`#${d} .lienzo`);
    const f = l.querySelector(".ficha");
    const r = l.getBoundingClientRect(), fr = f.getBoundingClientRect();
    [...l.children].forEach(c => c.style.visibility = "hidden");
    return { alto: Math.round(r.height), fichaY: Math.round(fr.top - r.top) };
  }, dom);
  await pag.waitForTimeout(200);
  const img = PNG.sync.read(await pag.locator(`#${dom} .lienzo`).screenshot({ type:"png" }));
  const d = img.data, filas = [];
  for (let y=0; y<img.height; y++) {
    let s=0; for (let x=0;x<img.width;x++){ const i=(y*img.width+x)*4;
      s += 255*3-(d[i]+d[i+1]+d[i+2]); }
    filas.push(s/img.width/765);
  }
  const max = Math.max(...filas);
  console.log(`${dom}  alto ${img.height}px · la tarjeta empieza en y=${arriba.fichaY}`);
  for (let y=0; y<img.height; y+=8) {
    const v = filas[y]/max;
    console.log(String(y).padStart(4), "█".repeat(Math.round(v*46)) + (y===arriba.fichaY-arriba.fichaY%8 ? "   <- tarjeta" : ""));
  }
  await nav.close();
})();
