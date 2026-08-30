/* ¿Qué hay DEBAJO de lo que hay que leer? La regla que lo pide, con las
   palabras de Eduardo: «si vas a usar bordes decorativos, no permitas que el
   fondo provoque que se vean intercalados los elementos ni que tampoco se
   pierda la legibilidad del contenido con los fondos».

   Cómo se mide sin razonar sobre el DOM: se oculta SÓLO ese elemento —con
   visibility, que no mueve nada— y se fotografía su rectángulo exacto. Si
   detrás hay una superficie lisa (una tarjeta), todos los píxeles son casi el
   mismo y el reparto es 1,0. Si detrás hay dibujo, el rectángulo trae dos
   poblaciones y el número sube. Es la diferencia entre escribir SOBRE algo y
   escribir ENTRE cosas. */
const { chromium } = require("playwright");
const { PNG } = require("pngjs");
const lum = c => { const [r,g,b]=c.map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);}); return .2126*r+.7152*g+.0722*b; };
const ratio = (a,b) => { const L1=lum(a),L2=lum(b); const [h,l]=L1>L2?[L1,L2]:[L2,L1]; return (h+.05)/(l+.05); };
const LEIBLES = [".nombre",".pie",".cifra",".c-ok",".c-av",".c-no"];
const LIMITE = 1.35;   // por encima, el elemento está escrito sobre dibujo

(async () => {
  const nav = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium", args:["--no-sandbox"] });
  const pag = await (await nav.newContext({viewport:{width:1100,height:900}})).newPage();
  await pag.goto("file://" + process.argv[2], { waitUntil:"load" });
  await pag.waitForTimeout(1000);
  await pag.evaluate(() => document.querySelectorAll(".mundo").forEach(m => m.classList.add("visto")));
  await pag.waitForTimeout(400);
  const ids = await pag.evaluate(() => [...document.querySelectorAll(".mundo")].map(m => m.id));
  const filas = [], malos = [];
  for (const dom of ids) {
    const fila = { mundo: dom.replace("m-","") };
    for (const sel of LEIBLES) {
      const loc = pag.locator(`#${dom} ${sel}`).first();
      // La página es larga: sin traerlo a la vista el recorte cae fuera del
      // fotograma y Playwright rechaza la captura.
      await loc.scrollIntoViewIfNeeded();
      await pag.waitForTimeout(60);
      const caja = await loc.boundingBox();
      if (!caja) { fila[sel.replace(/[.]/g,"")] = null; continue; }
      await pag.evaluate(([d,s]) => { document.querySelector(`#${d} ${s}`).style.visibility = "hidden"; }, [dom, sel]);
      const img = PNG.sync.read(await pag.screenshot({ type:"png", clip:{
        x:Math.round(caja.x)-2, y:Math.round(caja.y)-2,
        width:Math.max(4,Math.round(caja.width)+4), height:Math.max(4,Math.round(caja.height)+4) } }));
      await pag.evaluate(([d,s]) => { document.querySelector(`#${d} ${s}`).style.visibility = ""; }, [dom, sel]);
      const d = img.data, pts = [];
      for (let i=0;i<d.length;i+=4) if (d[i+3]>=250) pts.push([d[i],d[i+1],d[i+2]]);
      const c = new Map();
      for (const p of pts){ const k=(p[0]>>2<<12)|(p[1]>>2<<6)|(p[2]>>2); c.set(k,(c.get(k)||0)+1); }
      let n=0,mk=0; for(const [k,v] of c) if(v>n){n=v;mk=k;}
      const base=[((mk>>12)&63)*4+2,((mk>>6)&63)*4+2,(mk&63)*4+2];
      const rs = pts.map(p=>ratio(p,base)).sort((a,b)=>a-b);
      const v = +rs[Math.floor(rs.length*.95)].toFixed(2);
      fila[sel.replace(/[.]/g,"")] = v;
      if (v > LIMITE) malos.push(`${dom.replace("m-","")}: ${sel} sobre dibujo (${v})`);
    }
    filas.push(fila);
  }
  await nav.close();
  console.table(filas);
  console.log(malos.length ? "ESCRITO SOBRE DIBUJO:\n  " + malos.join("\n  ")
                           : `todo lo legible se apoya en superficie lisa (limite ${LIMITE})`);
})();
