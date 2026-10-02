// node captura.mjs <mundo> <oscuro|claro> <salida.png> [js-extra]
import { conecta, nav, ev, foto, cierra, duerme } from "./cdp.mjs";
const [mundo, tema, salida, extra] = process.argv.slice(2);
await conecta();
await nav("http://localhost:8180/404.html", 1200);
await ev(`sessionStorage.clear(); sessionStorage.setItem("norata-rebotes","2"); localStorage.clear();
  localStorage.setItem("norata-apariencia", ${JSON.stringify(mundo)});
  ${tema === "claro" ? 'localStorage.setItem("norata-tema","claro")' : ""}; 1`);
await nav("http://localhost:8180/index.html" + (mundo && mundo !== "casa" ? "?apariencia=" + mundo : ""), 5000);
const limpia = `(() => {
  ["portada","aviso-modo","aparienciaPrueba"].forEach(id => { const e = document.getElementById(id); if (e) e.remove(); });
  document.documentElement.classList.remove("con-aviso"); document.documentElement.style.removeProperty("--alto-aviso");
  document.body.classList.remove("ejemplo-on");
  document.querySelectorAll("*").forEach(e => e.getAnimations && e.getAnimations().forEach(a => { try { a.finish(); } catch (x) {} }));
  return 1; })()`;
console.log(await ev(`(() => { const p = document.getElementById('portada'); if (p) p.remove(); try { verElEjemplo(); cerrarTutorial(); } catch (e) { return 'err ' + e.message; }
  return JSON.stringify({ap: document.documentElement.getAttribute('data-apariencia'), claro: document.documentElement.classList.contains('claro'), v: typeof VERSION !== 'undefined' && VERSION}); })()`));
await duerme(2000);
console.log(await ev(`(() => { try { cerrarTutorial(); } catch (e) { return 'err ' + e.message; } const t = document.getElementById('tuto'); return t ? t.className : 'sin tuto'; })()`));
await duerme(800);
if (extra) { console.log(await ev(extra)); await duerme(2500); }
await ev(limpia); await duerme(600); await ev(limpia); await duerme(300);
await foto(salida);
cierra();
