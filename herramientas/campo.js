/* ¿Cuánto pesa de verdad el fondo de un mundo, ya compuesto sobre la página?
   Un mosaico puede tener 35% de tinta y aun así ser un susurro si va al 55% de
   opacidad y estirado. Lo que se mide es el CONTRASTE entre la tinta del fondo
   y la página: por encima de ~1.6 empieza a competir con lo que hay que leer. */
const { chromium } = require("playwright");
const { PNG } = require("pngjs");
const lum = c => { const [r,g,b]=c.map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);}); return .2126*r+.7152*g+.0722*b; };
const ratio = (a,b) => { const L1=lum(a),L2=lum(b); const [h,l]=L1>L2?[L1,L2]:[L2,L1]; return (h+.05)/(l+.05); };
(async () => {
  const nav = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium", args:["--no-sandbox"] });
  const pag = await (await nav.newContext({viewport:{width:1100,height:900}})).newPage();
  await pag.goto("file://" + process.argv[2], { waitUntil:"load" });
  await pag.waitForTimeout(1000);
  await pag.evaluate(() => document.querySelectorAll(".mundo").forEach(m => m.classList.add("visto")));
  await pag.waitForTimeout(400);
  const ids = await pag.evaluate(() => [...document.querySelectorAll(".mundo")].map(m => m.id));
  const filas = [];
  for (const dom of ids) {
    const img = PNG.sync.read(await pag.locator(`#${dom} .lienzo`).screenshot({ type:"png" }));
    const d = img.data, c = new Map(), pts = [];
    for (let i=0;i<d.length;i+=4){ if(d[i+3]<250) continue;
      const p=[d[i],d[i+1],d[i+2]]; pts.push(p);
      const k=(p[0]>>2<<12)|(p[1]>>2<<6)|(p[2]>>2); c.set(k,(c.get(k)||0)+1); }
    let n=0,mk=0; for(const [k,v] of c) if(v>n){n=v;mk=k;}
    const fondo=[((mk>>12)&63)*4+2,((mk>>6)&63)*4+2,(mk&63)*4+2];
    // percentil 99 del contraste contra el fondo: la tinta más marcada del campo
    const rs = pts.map(p=>ratio(p,fondo)).sort((a,b)=>a-b);
    filas.push({ mundo:dom.replace("m-",""),
      "liso%":+(n/pts.length*100).toFixed(1),
      p90:+rs[Math.floor(rs.length*.90)].toFixed(2),
      p99:+rs[Math.floor(rs.length*.99)].toFixed(2) });
  }
  console.table(filas); await nav.close();
})();
