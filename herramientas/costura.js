/* ¿Casa un mosaico consigo mismo? Se pinta el motivo DOS veces seguidas y se
   compara la columna justo antes de la costura con la que hay un ancho más
   allá: si el dibujo es periódico las dos son idénticas. Lo mismo en vertical.
   Un cordel que sale por la derecha a una altura y entra por la izquierda a
   otra deja un escalón, y a ojo no se ve hasta que ya está publicado. */
const { chromium } = require("playwright");
const { PNG } = require("pngjs");
const fs = require("fs");
const ARCH = process.argv[2], LADO = +(process.argv[3] || 170);
(async () => {
  const nav = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium", args:["--no-sandbox"] });
  const pag = await (await nav.newContext({viewport:{width:LADO*2,height:LADO*2}})).newPage();
  const b64 = fs.readFileSync(ARCH).toString("base64");
  await pag.setContent(`<style>html,body{margin:0}body{width:${LADO*2}px;height:${LADO*2}px;
    background:#ffffff url(data:image/svg+xml;base64,${b64}) 0 0 repeat; background-size:${LADO}px ${LADO}px}</style>`);
  await pag.waitForTimeout(400);
  const img = PNG.sync.read(await pag.screenshot({ type:"png" }));
  const px = (x,y) => { const i=(y*img.width+x)*4; return [img.data[i],img.data[i+1],img.data[i+2]]; };
  const dif = (a,b) => Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])+Math.abs(a[2]-b[2]);
  let maxV=0, maxH=0;
  for (let y=0; y<LADO; y++) maxV = Math.max(maxV, dif(px(LADO-1,y), px(LADO*2-1,y)));
  for (let x=0; x<LADO; x++) maxH = Math.max(maxH, dif(px(x,LADO-1), px(x,LADO*2-1)));
  // Tinta: cuánto del mosaico está pintado y cómo se reparte por cuadrantes
  let pintados=0; const cuad=[0,0,0,0];
  for (let y=0;y<LADO;y++) for (let x=0;x<LADO;x++) {
    const p=px(x,y); if (255*3 - (p[0]+p[1]+p[2]) > 30) { pintados++; cuad[(y<LADO/2?0:2)+(x<LADO/2?0:1)]++; }
  }
  console.log(ARCH.split("/").pop());
  console.log("  costura vertical  (columna del borde vs la del siguiente mosaico):", maxV, maxV===0?"· casa":"· NO casa");
  console.log("  costura horizontal(fila    del borde vs la del siguiente mosaico):", maxH, maxH===0?"· casa":"· NO casa");
  console.log("  tinta:", (pintados/(LADO*LADO)*100).toFixed(1)+"% · por cuadrantes",
              cuad.map(c=>Math.round(c/pintados*100)+"%").join(" "));
  await nav.close();
})();
