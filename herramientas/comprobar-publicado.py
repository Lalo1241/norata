# -*- coding: utf-8 -*-
"""Pide al sitio EN VIVO todo lo que la app necesita, y comprueba que lo
que no debe servirse no se sirve.

POR QUÉ EXISTE
--------------
Desde que `_config.yml` deja fuera los documentos y los generadores, hay
una forma nueva de romper el sitio que antes no existía: excluir de más.
Y el fallo no avisa —la compilación de Jekyll sale bien, el sitio
publica, y lo que falta es un archivo suelto—.

Aquí no hay paso de compilación propio donde meter el guardarraíl, así
que se comprueba DESPUÉS de publicar. Se ejecuta a mano, después de cada
push que toque `_config.yml` o que añada un archivo nuevo:

    python herramientas/comprobar-publicado.py

LA LISTA NO SE ESCRIBE AQUÍ
---------------------------
Sale de `ASSETS`, dentro de `sw.js`, que es el original. Copiarla aquí
sería crear un cuarto sitio que mantener, y el día que se
desincronizaran, el que mentiría sería justo el que comprueba.

Lo único escrito a mano son las direcciones que se piden EN CALIENTE y
por eso no están en `ASSETS`: el css de los mundos, los caminos, las
imágenes que enlazan los correos ya enviados y los dos textos legales.

LA TRAMPA QUE YA COSTÓ UNA TARDE
--------------------------------
GitHub Pages tarda un minuto largo en publicar. Un 404 recién subido no
significa que esté excluido de más: puede que aún no haya desplegado.
Por eso esto pide también un CONTROL —un archivo que ya funcionaba antes
del cambio—: si el control falla, lo que está roto es la prueba, y hay
que esperar y repetir.
"""

import json
import re
import sys
import os
from urllib.request import urlopen, Request
from urllib.error import HTTPError, URLError

SITIO = "https://mi.norata.app"

# Se piden en caliente y NO están en ASSETS, así que el lector de sw.js
# no las ve. Aquí sí hay que nombrarlas.
EN_CALIENTE = [
    "css/mundos.css",
    "caminos/caminos.json",
    "privacidad/index.html",
    "terminos/index.html",
    "correos/04-bienvenida.html",
    # Las enlazan los correos que ya están en bandejas ajenas. Gmail no
    # vuelve a pedir una imagen que ya guardó: si desaparecen, se quedan
    # rotos para siempre.
    "marca/logo-correo-v2.png",
    "marca/icono-misiones-v1.png",
    "marca/icono-habilidades-v2.png",
    "marca/icono-talentos-v1.png",
    "marca/icono-proyectos-v1.png",
]

# Lo que NO debe servirse. Si alguno contesta 200, la exclusión no está
# haciendo su trabajo.
NO_DEBE_ESTAR = [
    "VERSIONES.md", "VERSIONES.html",
    "CLAUDE.md", "CLAUDE.html",
    "README.md",
    "supabase/planes.sql",
    "supabase/functions/cobro/index.ts",
    "supabase/LEEME.md",
    "mundos/app.py",
    "apariencias/construir.py",
    "herramientas/LEEME.md",
    "plantillas/LEEME.md",
    "caminos/app.py",
]

# El control: existía antes del cambio y tiene que seguir existiendo. Si
# este falla, el despliegue aún no ha llegado y el resto de la prueba no
# vale nada.
CONTROL = "index.html"


def codigo(ruta):
    """Devuelve el código de respuesta, sin descargar el cuerpo entero."""
    url = SITIO + "/" + ruta.lstrip("./")
    pet = Request(url, method="HEAD", headers={"User-Agent": "norata-comprobador"})
    try:
        with urlopen(pet, timeout=20) as r:
            return r.status
    except HTTPError as e:
        return e.code
    except URLError as e:
        return "sin red (%s)" % e.reason


def cuerpo(ruta):
    """Devuelve (código, texto). Descarga el cuerpo, así que solo se usa
    donde hace falta saber QUÉ contestó y no solo con qué número."""
    url = SITIO + "/" + ruta.lstrip("./")
    pet = Request(url, headers={"User-Agent": "norata-comprobador"})
    try:
        with urlopen(pet, timeout=20) as r:
            return r.status, r.read(4096).decode("utf-8", "replace")
    except HTTPError as e:
        return e.code, e.read(4096).decode("utf-8", "replace")
    except URLError as e:
        return "sin red (%s)" % e.reason, ""


def comprobar_404():
    """La pantalla de error es NUESTRA, y sigue dando 404.

    Las dos mitades importan y por motivos distintos. El 404 tiene que
    seguir siendo un 404 —si `404.html` empezara a contestar 200 a
    cualquier dirección, un archivo que falta parecería estar— y el
    cuerpo tiene que ser el nuestro, porque el día que Jekyll dejara de
    publicar ese archivo el sitio seguiría dando 404, pero con la página
    gris de GitHub y su enlace a la documentación. O sea: el fallo que
    esto vigila no cambia el número, solo lo que se ve.

    `exclude` de `_config.yml` es lo único que puede quitarlo, y es
    justo el fichero cuyos descuidos esta herramienta existe para
    cazar."""
    ruta = "esta-direccion-no-existe-comprobador"
    c, texto = cuerpo(ruta)
    nuestra = "Norata" in texto and "githubstatus" not in texto
    print("Pantalla de error propia: %s, %s" % (
        c, "nuestra" if nuestra else "la de GitHub"))
    return c == 404 and nuestra


def lista_de_assets(raiz):
    """Lee ASSETS de sw.js. La lista vive allí, no aquí."""
    with open(os.path.join(raiz, "sw.js"), encoding="utf-8") as f:
        fuente = f.read()
    bloque = re.search(r"ASSETS\s*=\s*\[(.*?)\]", fuente, re.S)
    if not bloque:
        print("No encuentro ASSETS en sw.js. ¿Cambió de forma?")
        sys.exit(2)
    rutas = re.findall(r'"(\./[^"]*)"', bloque.group(1))
    # Una ruta acabada en "/" es una carpeta, y la sirve su index.html.
    # Genérico a propósito: la 0.7.121 añadió "./crear-cuenta/" y una
    # lista escrita a mano no lo habría cubierto.
    return [r + "index.html" if r.endswith("/") else r for r in rutas]


def main():
    raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    print("Control (%s): " % CONTROL, end="")
    c = codigo(CONTROL)
    print(c)
    if c != 200:
        print("\nEl control falla, así que lo roto es la prueba y no el sitio.")
        print("GitHub Pages tarda un minuto largo: espera y vuelve a intentarlo.")
        return 2

    faltan, sobran = [], []

    print("\nLo que la app necesita:")
    for ruta in lista_de_assets(raiz) + EN_CALIENTE:
        c = codigo(ruta)
        if c != 200:
            faltan.append((ruta, c))
            print("  FALTA  %-42s %s" % (ruta, c))
    print("  %d comprobadas, %d fallan" % (
        len(lista_de_assets(raiz)) + len(EN_CALIENTE), len(faltan)))

    print()
    error_propio = comprobar_404()

    print("\nLo que no debe servirse:")
    for ruta in NO_DEBE_ESTAR:
        c = codigo(ruta)
        if c == 200:
            sobran.append(ruta)
            print("  SE SIRVE  %s" % ruta)
    print("  %d comprobadas, %d siguen abiertas" % (len(NO_DEBE_ESTAR), len(sobran)))

    print()
    if faltan:
        print("MAL: faltan %d archivos que la app necesita." % len(faltan))
        print("Revisa la lista `exclude` de _config.yml: se excluyó de más.")
        return 1
    if sobran:
        print("A MEDIAS: la app está entera, pero %d documentos siguen "
              "abiertos." % len(sobran))
        return 1
    if not error_propio:
        print("A MEDIAS: la app está entera, pero la pantalla de error no es")
        print("la nuestra. Mira que `404.html` no esté en el `exclude`.")
        return 1
    print("Bien: está todo lo que hace falta y nada de lo que no.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
