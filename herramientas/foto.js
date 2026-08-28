/* Foto de los estilos calculados de la app. Se corre ANTES y DESPUES del
   cambio: si el diff sale vacio, no se movio un pixel. */
const { chromium } = require("playwright");
const fs = require("fs");

const PROPS = [
  "border-top-left-radius","border-top-right-radius","border-bottom-right-radius","border-bottom-left-radius",
  "border-top-width","border-right-width","border-bottom-width","border-left-width",
  "border-top-style","border-top-color","border-right-color","border-bottom-color","border-left-color",
  "background-color","background-image","background-size","background-repeat","background-blend-mode",
  "border-image-source","border-image-slice","border-image-width","border-image-outset","border-image-repeat",
  "box-shadow","outline-width","outline-style","outline-color","outline-offset",
  "font-family","font-size","font-weight","font-style","letter-spacing","text-transform","line-height",
  "color","opacity","fill","stroke","stroke-width",
  "transition-duration","transition-timing-function","transition-property",
  "padding-top","padding-right","padding-bottom","padding-left",
  "margin-top","margin-left","width","height","display","position"
];

const RECOGE = (props) => {
  // Termina todas las animaciones: sin componer fotogramas se quedan
  // congeladas en el valor de PARTIDA y getComputedStyle miente (CLAUDE.md).
  document.querySelectorAll("*").forEach(e => {
    e.getAnimations && e.getAnimations().forEach(a => {
      try {
        /* Las que no terminan nunca (un pulso que late para siempre) se
           paran en el cuadro cero: `finish()` no vale con ellas y su valor
           sigue moviendose entre una foto y la siguiente. */
        const t = a.effect && a.effect.getTiming();
        if (t && t.iterations === Infinity) { a.currentTime = 0; a.pause(); }
        else a.finish();
      } catch (x) {}
    });
  });
  const salida = {};
  const camino = (el) => {
    const partes = [];
    let n = el;
    while (n && n !== document.documentElement) {
      const p = n.parentNode;
      if (!p) break;
      partes.unshift(n.tagName + ":" + Array.prototype.indexOf.call(p.children, n));
      n = p;
    }
    return partes.join(">");
  };
  document.querySelectorAll("*").forEach(el => {
    const cs = getComputedStyle(el);
    const v = {};
    props.forEach(p => { v[p] = cs.getPropertyValue(p); });
    const r = el.getBoundingClientRect();
    v["@rect"] = [Math.round(r.x*10)/10, Math.round(r.y*10)/10, Math.round(r.width*10)/10, Math.round(r.height*10)/10];
    v["@clase"] = el.getAttribute("class") || "";
    salida[camino(el)] = v;
  });
  // Y todas las variables declaradas en :root, tal como las ve el navegador
  const raiz = getComputedStyle(document.documentElement);
  const vars = {};
  for (let i = 0; i < raiz.length; i++) {
    const p = raiz[i];
    if (p.startsWith("--")) vars[p] = raiz.getPropertyValue(p).trim();
  }
  salida["@:root"] = vars;
  return salida;
};

(async () => {
  const destino = process.argv[2];
  const navegador = await chromium.launch({ /* en un equipo normal basta chromium.launch() */ args: ["--no-sandbox"] });
  const foto = {};

  for (const modo of ["oscuro", "claro"]) {
    const ctx = await navegador.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 });
    await ctx.addInitScript(([m]) => {
      // Entrar sin cuenta, para que la portada no tape la app.
      localStorage.setItem("mainquest-sync-v1", JSON.stringify({ tipo:"supabase", enabled:false, entrada:"local", cfg:{}, device:"prueba", rev:0, dirty:false }));
      localStorage.setItem("norata-tema", m);
    }, [modo]);
    const pag = await ctx.newPage();
    const errores = [];
    pag.on("pageerror", e => errores.push(String(e)));
    await pag.goto("http://localhost:8123/", { waitUntil: "networkidle" });
    await pag.waitForTimeout(900);
    /* El ejemplo completo: siembra habilidades, talentos, proyectos y misiones
       de verdad. Sin él las pantallas salen vacías y la foto no toca ni una
       tarjeta, que es justo lo que hay que vigilar. */
    try { await pag.evaluate(() => typeof verElEjemplo === "function" && verElEjemplo()); } catch (e) {}
    await pag.waitForTimeout(900);

    for (const vista of ["summary", "home", "missions", "catalog", "tree", "projects", "settings"]) {
      try { await pag.evaluate(v => typeof showView === "function" && showView(v), vista); } catch (e) {}
      await pag.waitForTimeout(450);
      foto[modo + "/" + vista] = await pag.evaluate(RECOGE, PROPS);
    }
    foto[modo + "/@errores"] = errores;
    await ctx.close();
  }

  await navegador.close();
  fs.writeFileSync(destino, JSON.stringify(foto, null, 1));
  const n = Object.keys(foto).filter(k => !k.includes("@errores"))
    .reduce((a, k) => a + Object.keys(foto[k]).length, 0);
  console.log("elementos medidos:", n, "->", destino);
  const errs = Object.keys(foto).filter(k => k.includes("@errores")).flatMap(k => foto[k]);
  if (errs.length) console.log("ERRORES DE PAGINA:", errs.slice(0,5));
})();
