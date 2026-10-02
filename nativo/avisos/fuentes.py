"""Las letras de los avisos de Android, sacadas de la Outfit de la app.

La app trae Outfit como letra variable en css/fuente.css (woff2 en base64). Un
aviso de Android no sabe leer woff2 ni elegir un peso de una letra variable
desde su molde, así que aquí se cortan los tres pesos que usan los avisos y se
guardan como .ttf en res/font/:

    outfit_medium.ttf     500   las cifras grandes
    outfit_semibold.ttf   600   los nombres
    outfit_bold.ttf       700   los rótulos y los botones

Se corre a mano solo si cambia la letra de la app:

    python nativo/avisos/fuentes.py

Pide fontTools y brotli (pip install fonttools brotli).
"""
import base64, io, os, re
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(os.path.dirname(AQUI))
css = open(os.path.join(RAIZ, "css", "fuente.css"), encoding="utf-8").read()
datos = base64.b64decode(re.search(r"base64,([^)\"']+)", css).group(1))

for nombre, peso in (("outfit_medium", 500), ("outfit_semibold", 600), ("outfit_bold", 700)):
    f = TTFont(io.BytesIO(datos))
    fija = instancer.instantiateVariableFont(f, {"wght": peso})
    fija.flavor = None  # de woff2 a ttf
    destino = os.path.join(AQUI, "res", "font", nombre + ".ttf")
    fija.save(destino)
    print(nombre, peso, os.path.getsize(destino), "bytes")
