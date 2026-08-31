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

ESCENAS = """
/* ---------- Y dentro de las escenas ----------
   La tarjeta de la racha, los encabezados de los cuatro módulos y la
   celebración NO cambian de modo: son un dibujo de una noche, no interfaz, y
   por eso `estilos.css` les vuelve a declarar la paleta oscura entera dentro.
   Esa relectura es la que dejaba a los ambientes fuera: cambiaban :root y la
   escena seguía pintada con los hexes de la casa escritos a mano. Se veía
   clarísimo en los banners de los módulos — la app entera de otro color y sus
   cuatro cabeceras en azul.

   Aquí cada ambiente vuelve a declarar SU noche dentro de la escena. Sin
   `:not(.claro)` a propósito, y es la única regla de este archivo que no lo
   lleva: la escena se queda de noche en los dos modos, así que su bloque
   también.

   Lo que se toca y por qué: los neutros y el acento salen del propio ambiente;
   el cielo del motivo y las tres bases de la escena se DERIVAN de su fondo y
   su tinta, porque son el mismo material visto con otra transparencia y
   dejarlos fijos volvería a poner el azul de la casa por debajo del dibujo. */
"""

def _tripleta(hexa):
    h = hexa.lstrip("#")
    return ", ".join(str(int(h[i:i+2], 16)) for i in (0, 2, 4))

def _rgba(hexa, a):
    return "rgba(" + _tripleta(hexa) + ", " + a + ")"

def escena(m):
    """El bloque de un ambiente DENTRO de una escena. Solo se escribe lo que el
       ambiente mueve de verdad: lo que no declare sigue saliendo del bloque de
       la casa, que es lo que hace que un ambiente a medias no rompa nada."""
    if m["grado"] == 0: return ""
    n = m["noche"]
    pon = lambda k: n.get(k, datos.CASA_NOCHE[k])
    v = []
    # Los cuatro suelos van SIEMPRE, aunque el ambiente no los mueva: de ellos
    # cuelga toda la familia `--sup-*` —lo que de verdad se pinta— y dejarlos
    # sin declarar hacía que un botón dentro de una escena cogiera el papel del
    # modo claro con la tinta clara de la noche encima.
    for k in ("--bg", "--bg2", "--card", "--card2"):
        v.append((k, pon(k)))
    # Y la familia del material, escrita entera: un `var()` dentro de una
    # variable se resuelve donde la variable se declara, no donde se usa, asi
    # que redeclarar `--card` aqui no arrastra a `--sup-tarjeta`.
    for k, base in (("--sup-pagina", "--bg"), ("--sup-panel", "--bg2"),
                    ("--sup-tarjeta", "--card"), ("--sup-tarjeta2", "--card2")):
        v.append((k, "var(%s)" % base))
    for k in ("--line", "--carril", "--text", "--muted", "--faint"):
        if k in n: v.append((k, n[k]))
    if "--mint" in n:
        v.append(("--mint", n["--mint"]))
        v.append(("--mint-macizo", n.get("--mint-macizo", n["--mint"])))
        v.append(("--mint-soft", _rgba(n["--mint"], "0.13")))
        # La tinta sobre un acento macizo: el fondo del propio ambiente, que es
        # lo más oscuro que tiene. Con el de la casa, el acento claro de Tinta
        # se quedaba con un azul que no es suyo debajo.
        v.append(("--sobre-acento", pon("--bg")))
    # El cielo del motivo y las tres bases, derivados del suelo del ambiente.
    v.append(("--motivo-cielo-1", pon("--card")))
    v.append(("--motivo-cielo-2", pon("--bg2")))
    v.append(("--motivo-chispa", pon("--text")))
    v.append(("--motivo-humo", _rgba(pon("--text"), "0.3")))
    v.append(("--motivo-humo-tenue", _rgba(pon("--text"), "0.2")))
    v.append(("--motivo-espuma", _rgba(pon("--text"), "0.6")))
    # El lienzo y las curvas del encabezado de Talentos, que son las dos unicas
    # piezas del dibujo que no dependen del tinte.
    v.append(("--motivo-lienzo", pon("--bg2")))
    v.append(("--motivo-curva", pon("--line")))
    v.append(("--escena-fondo", _tripleta(pon("--bg"))))
    v.append(("--escena-vidrio", _tripleta(pon("--card"))))
    v.append(("--escena-tinta", _tripleta(pon("--text"))))
    # Y el tinte del dibujo. El color es el del suelo del ambiente —su tarjeta,
    # que es su tono a media luz—; la fuerza sube con el grado, porque un
    # ambiente que solo mueve el suelo tiene que teñir menos que uno que
    # cambia el carácter entero. Tinta va al 100%: es un monocromo, y dejarle
    # un paisaje a color por debajo sería justo lo que no es.
    # Subida en 0.7.49: con 0,55 el paisaje se quedaba a medio teñir y el
    # encabezado seguía leyéndose de la casa. Ahora el dibujo se va del todo al
    # tono del ambiente, que es lo que pidió Eduardo.
    fuerza = {1: "0.85", 2: "0.95", 3: "1"}[m["grado"]]
    v.append(("--escena-tinte-modo", "block"))
    v.append(("--escena-tinte", pon("--card")))
    v.append(("--escena-tinte-fuerza", fuerza))
    sel = 'html[data-apariencia="%s"] .scene-card,\nhtml[data-apariencia="%s"] .celebrate {' % (m["id"], m["id"])
    return "\n".join(["/* " + m["nombre"] + " */", sel] + ["  %s: %s;" % kv for kv in v] + ["}"]) + "\n"

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
    partes += [ESCENAS] + [escena(m) for m in datos.AMBIENTES if m["grado"] > 0]
    partes += [MUESTRAS] + [muestra(m) for m in datos.AMBIENTES]
    txt = "\n".join(partes)
    open(os.path.join(AQUI, "ambientes.css"), "w", encoding="utf-8").write(txt)
    print("ambientes.css", len(txt.encode()), "bytes ·",
          sum(1 for m in datos.AMBIENTES if m["grado"] > 0), "ambientes")
