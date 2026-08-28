const fs = require("fs");
const a = JSON.parse(fs.readFileSync(process.argv[2]));
const b = JSON.parse(fs.readFileSync(process.argv[3]));
let cambios = 0, faltan = 0, sobran = 0;
const resumen = {};
const ejemplos = [];
for (const vista of Object.keys(a)) {
  if (vista.includes("@errores")) continue;
  const A = a[vista], B = b[vista] || {};
  for (const k of Object.keys(A)) {
    if (!(k in B)) { faltan++; continue; }
    for (const p of Object.keys(A[k])) {
      const va = JSON.stringify(A[k][p]), vb = JSON.stringify(B[k][p]);
      if (va !== vb) {
        cambios++;
        resumen[p] = (resumen[p] || 0) + 1;
        if (ejemplos.length < 25) ejemplos.push(`${vista} | .${(A[k]["@clase"]||"?").split(" ")[0]} | ${p}\n    antes: ${va}\n    ahora: ${vb}`);
      }
    }
  }
  for (const k of Object.keys(B)) if (!(k in A)) sobran++;
}
console.log(`elementos que ya no estan: ${faltan}   elementos nuevos: ${sobran}`);
console.log(`propiedades que cambiaron: ${cambios}`);
if (cambios) {
  console.log("\npor propiedad:");
  Object.entries(resumen).sort((x,y)=>y[1]-x[1]).forEach(([p,n]) => console.log(`  ${String(n).padStart(5)}  ${p}`));
  console.log("\nejemplos:"); ejemplos.forEach(e => console.log("  " + e));
} else if (!faltan && !sobran) {
  console.log("\nIDENTICO: no se movio un pixel.");
}
