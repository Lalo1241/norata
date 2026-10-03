#!/usr/bin/env python3
"""Ninguna novedad puede estar publicada con un número mayor que el de la app.

El 3 de octubre de 2026, «Aprobar todas» en el Puesto de mando aprobó de un
jalón las dieciocho fichas en borrador, y entre ellas iban la de la beta (0.8)
y la del lanzamiento (1.0): los anuncios de dos etapas a las que les falta
mucho, escritos de antemano. No llegaron al vivo de milagro —la cola estaba
detenida por un SQL—. Eduardo: «imposibilita que se suban y que no se suban
jamás ni con ese botón».

La regla es mecánica y no depende de acordarse de dos números: **una ficha
cuya versión es mayor que `VERSION` (js/01-base.js) habla de algo que todavía
no existe, y no se publica.** El día que la app llegue a la 0.8, la ficha de la
0.8 deja de ser futura sola.

Lo usan tres sitios, y hacen falta los tres:

  - la barrera (`.github/workflows/barrera.yml`), que no sube nada al vivo si
    esto falla: es el que de verdad lo impide, pase lo que pase en los otros;
  - `herramientas/aprobar-novedad.py`, que se niega a aprobar una;
  - el Puesto de mando, que no las enseña entre las que se pueden aprobar.

Sin argumentos: sale con 1 y las nombra si hay alguna publicada. Con
`--lista`: imprime las futuras que haya, estén como estén, y sale con 0.
"""
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent


def numero(v):
    """«0.7.193.1» → (0, 7, 193, 1). Lo que no sea un número de versión, nada."""
    v = str(v or "").strip()
    return tuple(int(x) for x in v.split(".")) if re.fullmatch(r"\d+(\.\d+){1,3}", v) else None


def version_de_la_app():
    base = (RAIZ / "js" / "01-base.js").read_text(encoding="utf-8")
    m = re.search(r'^const VERSION = "([^"]+)";', base, re.M)
    if not m or not numero(m.group(1)):
        sys.exit("No encuentro VERSION en js/01-base.js.")
    return m.group(1)


def es_futura(ficha, app):
    """Una ficha y todos sus retoques: basta con que uno sea de después."""
    n = numero(ficha.get("version"))
    return n is not None and n > numero(app)


def futuras(doc, app):
    return [e for e in doc.get("entradas", []) if es_futura(e, app)]


def main():
    app = version_de_la_app()
    doc = json.loads((RAIZ / "novedades" / "novedades.json").read_text(encoding="utf-8"))
    todas = futuras(doc, app)
    if "--lista" in sys.argv:
        for e in todas:
            print(e.get("version"), e.get("estado"), e.get("titulo", ""))
        return
    malas = [e for e in todas if e.get("estado") == "publicado"]
    if malas:
        print("Novedades publicadas de una versión que todavía no existe (la app va en la " + app + "):", file=sys.stderr)
        for e in malas:
            print("  " + str(e.get("version")) + " · " + str(e.get("titulo", "")), file=sys.stderr)
        sys.exit(1)
    print("Ninguna novedad publicada pasa de la " + app + ".")


if __name__ == "__main__":
    main()
