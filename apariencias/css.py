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

MUESTRAS = """
/* ---------- Las muestras de la pantalla de Ajustes ----------
   Los mismos tonos de arriba, expuestos en una clase para poder pintar cada
   ambiente EN PEQUEÑO sin ponérselo a la app entera. Salen del mismo sitio
   que los de verdad, así que no pueden discrepar: el día que cambie un tono
   cambian los dos.

   Una muestra enseña TRES cosas —fondo, tarjeta y acento— y no un círculo de
   color, porque un ambiente cambia tres cosas y un círculo solo enseña una.
   Es la diferencia entre elegir un color y elegir cómo se va a ver la app. */
"""

def muestra(m):
    """El acento de un grado 1 es el de la casa: no lo mueve, así que la
       muestra tiene que decir la verdad y enseñar la menta."""
    def toma(dia):
        casa = datos.CASA_DIA if dia else datos.CASA_NOCHE
        tabla = m["dia"] if dia else m["noche"]
        pon = lambda k: tabla.get(k, casa[k])
        return (pon("--bg"), pon("--card"), pon("--mint-macizo"))
    n = toma(False); d = toma(True)
    return (f'.mues-{m["id"]} {{ --mu-bg: {n[0]}; --mu-card: {n[1]}; --mu-acento: {n[2]}; }}\n'
            f'html.claro .mues-{m["id"]} {{ --mu-bg: {d[0]}; --mu-card: {d[1]}; --mu-acento: {d[2]}; }}')

if __name__ == "__main__":
    partes = [CAB] + [bloque(m) for m in datos.AMBIENTES if m["grado"] > 0]
    partes += [MUESTRAS] + [muestra(m) for m in datos.AMBIENTES]
    txt = "\n".join(partes)
    open(os.path.join(AQUI, "ambientes.css"), "w", encoding="utf-8").write(txt)
    print("ambientes.css", len(txt.encode()), "bytes ·",
          sum(1 for m in datos.AMBIENTES if m["grado"] > 0), "ambientes")
