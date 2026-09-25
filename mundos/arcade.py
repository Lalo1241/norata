# -*- coding: utf-8 -*-
"""Arcade: de `mundos/arcade/arcade.css` a `css/arcade.css`, con sus huellas.

Arcade no pasa por `mundos/app.py` porque no es un mundo: no declara colores
ni rangos en `datos.py`, es una capa de material que va encima del ambiente
(ver la cabecera de `mundos/arcade/arcade.css`). Pero se sirve igual que un
mundo —fuera de ASSETS, pedido solo por quien lo lleva puesto— y por eso
necesita lo mismo que `css/mundos.css`: una HUELLA en la dirección.

Son dos, y cada una se estampa donde se pide su archivo:

  - la de `css/arcade.css`, en el script de arriba de `index.html`;
  - la de `css/celestibyte.woff2`, en el `@font-face` de `css/estilos.css`
    (la letra se declara ahí porque la usan también la luciérnaga rara y el
    mando, que existen antes de encontrar Arcade).

Por qué hace falta la huella, que no es obvio: lo que no está en ASSETS se
pide suelto y se guarda para toda la versión. Con GitHub Pages tardando un
minuto en publicar hay una ventana en la que `sw.js` ya es el nuevo y este
archivo todavía el viejo; sin huella, quien abra ahí se queda el viejo para
siempre. Pasó con `css/mundos.css` en la 0.7.55.3.

Uso: `python mundos/arcade.py` desde la raíz del repositorio o desde aquí."""
import os, re, hashlib

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)

CABECERA = ("/* Generado por `mundos/arcade.py` desde `mundos/arcade/arcade.css`.\n"
            "   No editar a mano: se edita la fuente y se vuelve a generar. */\n\n")


def estampar(rel, marca, patron, huella):
    """Pone la huella en las líneas que PIDEN el archivo, y solo en esas: una
       sustitución sobre el archivo entero alcanzaría también los comentarios
       que lo nombran. Devuelve si cambió algo."""
    ruta = os.path.join(RAIZ, rel)
    lineas = open(ruta, encoding="utf-8").read().split("\n")
    cambio = hubo = False
    for i, l in enumerate(lineas):
        if marca in l:
            hubo = True
            nueva = re.sub(patron, lambda m: m.group(1) + "?h=" + huella, l)
            if nueva != l:
                lineas[i] = nueva
                cambio = True
    if not hubo:
        raise SystemExit("No encontré dónde se pide el archivo en " + rel + " (" + marca + ")")
    if cambio:
        open(ruta, "w", encoding="utf-8").write("\n".join(lineas))
    return cambio


def main():
    fuente = open(os.path.join(AQUI, "arcade", "arcade.css"), encoding="utf-8").read()
    txt = CABECERA + fuente
    open(os.path.join(RAIZ, "css", "arcade.css"), "w", encoding="utf-8").write(txt)
    # Sobre el texto con saltos LF, que es como lo guarda git y lo sirve
    # GitHub; el árbol de trabajo está en CRLF y daría otra huella.
    h_css = hashlib.sha256(txt.encode()).hexdigest()[:10]
    h_letra = hashlib.sha256(open(os.path.join(RAIZ, "css", "celestibyte.woff2"), "rb").read()).hexdigest()[:10]

    tocados = []
    if estampar("index.html", '.href = "css/arcade.css', r"(css/arcade\.css)(\?h=[0-9a-f]+)?", h_css):
        tocados.append("index.html")
    if estampar(os.path.join("css", "estilos.css"), 'url("celestibyte.woff2', r"(celestibyte\.woff2)(\?h=[0-9a-f]+)?", h_letra):
        tocados.append("css/estilos.css")

    print("css/arcade.css", len(txt.encode()), "bytes · huella", h_css)
    print("css/celestibyte.woff2 · huella", h_letra)
    if tocados:
        print("  sellado en:", ", ".join(tocados))


if __name__ == "__main__":
    main()
