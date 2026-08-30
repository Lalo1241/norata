# -*- coding: utf-8 -*-
"""Escribe `ambientes.css`: los siete ambientes que no son el de casa, listos
para pegar. Un ambiente es una clase en <html> que cambia variables y nada
más — todo lo que no declare lo hereda de :root, así que un ambiente a medias
cae en los colores de la casa y no en el vacío."""
import datos, os
AQUI = os.path.dirname(os.path.abspath(__file__))

CAB = """/* Los ambientes de Norata. Un ambiente NO es un mundo: reusa el material que
   ya hay y solo le cambia la luz. Por eso son los que pueden ser gratis y los
   que pueden salir de uno en uno sin volver a revisar la app entera.

   Cómo se aplica: `<html data-apariencia="musgo">`, y el modo claro sigue
   siendo la clase `claro` de siempre. Los dos ejes son independientes — un
   ambiente tiene sus dos caras, igual que la casa.

   POR QUÉ EL BLOQUE DE NOCHE LLEVA `:not(.claro)`, que parece de más y no lo
   es: `html[data-apariencia="x"]` y `html.claro` tienen la MISMA
   especificidad —un tipo y un selector simple cada uno—, así que decide el
   orden de los archivos, y este se carga después de `estilos.css`. Resultado:
   los tonos de noche del ambiente ganaban a los de día de la casa. Escarcha
   lo destapó porque es el único cuyo bloque de día no redeclara los neutros
   —solo mueve el acento—: en modo claro se quedaba con el fondo de noche y
   texto oscuro encima. Con `:not(.claro)` el bloque de noche deja de existir
   de día y la casa vuelve a mandar, que es lo que promete la línea de arriba.

   Ningún tono se eligió a ojo. La cara de día de los siete está medida y pasa
   4,5 para escribir y 3 para trazar; la tabla está en `apariencias/LEEME.md`.

   OJO al cambiar de ambiente desde JavaScript: hay que apagar las
   transiciones un turno, igual que hace `ponerTema` con `cambiando-modo`. Una
   transición sobre una propiedad cuyo valor sale de una variable se queda
   congelada en Chrome, y cambiar de ambiente cambia veinte variables de
   golpe. Está contado en CLAUDE.md y ya mordió cuatro veces.

   Generado desde `apariencias/datos.py`. No editar a mano. */
"""

def bloque(m):
    if m["grado"] == 0: return ""
    fuera = [f'/* ---------- {m["nombre"]} · grado {m["grado"]} · {m["abre"]} ---------- */']
    if m.get("nota"): fuera.append("/* " + m["nota"] + " */")
    fuera.append(f'html:not(.claro)[data-apariencia="{m["id"]}"] {{')
    for k, v in m["noche"].items(): fuera.append(f"  {k}: {v};")
    fuera.append("}")
    if m["dia"]:
        fuera.append(f'html.claro[data-apariencia="{m["id"]}"] {{')
        for k, v in m["dia"].items(): fuera.append(f"  {k}: {v};")
        fuera.append("}")
    else:
        fuera.append(f"/* De día, los neutros son los de la casa: {m['nombre']} solo mueve")
        fuera.append("   el acento, y por eso su bloque de día está vacío de neutros. */")
    return "\n".join(fuera) + "\n"

if __name__ == "__main__":
    partes = [CAB] + [bloque(m) for m in datos.AMBIENTES if m["grado"] > 0]
    txt = "\n".join(partes)
    open(os.path.join(AQUI, "ambientes.css"), "w", encoding="utf-8").write(txt)
    print("ambientes.css", len(txt.encode()), "bytes ·",
          sum(1 for m in datos.AMBIENTES if m["grado"] > 0), "ambientes")
