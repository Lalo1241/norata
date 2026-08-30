/* ¿Dónde está de verdad un adorno? Se fotografía la tarjeta con él y sin él
   y se restan las dos imágenes: lo que cambia ES el adorno, y su posición
   sale en píxeles. Se acabó razonarlo. */
const { chromium } = require("playwright");
const { PNG } = require("pngjs");
const BASE = "file://" + process.cwd() + "/" + (process.argv[2] || "../mundos/vista.html");

(async () => {
  const nav = await chromium.launch({ executablePath:"/opt/pw-browsers/chromium", args:["--no-sandbox"] });
  const pag = await (await nav.newContext({viewport:{width:1100,height:900}})).newPage();
  const congelar = async () => {
    await pag.goto(BASE, { waitUntil:"load" });
    await pag.waitForTimeout(600);
    // La barra de avance se anima al entrar en pantalla: entre una foto y la
    // otra se movía, y el diff la señalaba a ella en vez de al adorno.
    await pag.addStyleTag({ content: "*,*::before,*::after{ transition:none !important; animation:none !important; }" });
    await pag.evaluate(() => document.querySelectorAll(".mundo").forEach(m => m.classList.add("visto")));
    await pag.waitForTimeout(250);
  };
  await congelar();

  for (const id of ["m-averno","m-forja","m-postit"]) {
    const sel = `#${id} .ficha`;
    const con = PNG.sync.read(await pag.locator(sel).screenshot({ type:"png" }));
    await pag.addStyleTag({ content: `#${id} .ficha::after{ content:none !important; }` });
    await pag.waitForTimeout(150);
    const sin = PNG.sync.read(await pag.locator(sel).screenshot({ type:"png" }));
    const W = Math.min(con.width, sin.width), H = Math.min(con.height, sin.height);
    let minX=1e9,maxX=-1,minY=1e9,maxY=-1,n=0;
    const cols = new Array(10).fill(0);
    for (let y=0;y<H;y++) for (let x=0;x<W;x++) {
      const i=(y*con.width+x)*4, j=(y*sin.width+x)*4;
      const d = Math.abs(con.data[i]-sin.data[j])+Math.abs(con.data[i+1]-sin.data[j+1])+Math.abs(con.data[i+2]-sin.data[j+2]);
      if (d < 14) continue;
      n++; if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y;
      cols[Math.min(9, Math.floor(x/W*10))]++;
    }
    const pct = v => Math.round(v/W*100);
    console.log(`${id.replace("m-","").padEnd(9)} tarjeta ${W}x${H} · adorno ocupa x ${minX}-${maxX} (${pct(minX)}%-${pct(maxX)}%), y ${minY}-${maxY} · ${n} px`);
    console.log("          reparto por décimos de ancho: " + cols.map(c=>String(Math.round(c/n*100)).padStart(3)).join(""));
    await congelar();
  }
  await nav.close();
})();
