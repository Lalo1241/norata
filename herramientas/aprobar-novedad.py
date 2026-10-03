#!/usr/bin/env python3
"""Aprueba una novedad: su estado pasa a «publicado» (0.7.183).

    python herramientas/aprobar-novedad.py <id o versión>

Lo corre `.github/workflows/novedades-aprobar.yml` cuando Eduardo pulsa
«Aprobar y publicar» en el Puesto de mando, y no hace falta nadie más: lo pidió
así, «la orden se da a partir de que doy el visto bueno en el Puesto de mando».
Se puede correr a mano igual, por ejemplo para aprobar desde una sesión.

Cambia el estado y nada más —ni la fecha ni ningún texto: lo que él aprobó es
lo que leyó—, y rehace el CSV del sitio con `novedades-framer.py`, que es lo
que en una máquina haría el hook de pre-commit.

Escribe en la primera línea de su salida el título de la ficha, que el trabajo
usa para el mensaje del commit. Sale con 2 si la ficha no existe; con 0 y sin
tocar nada si ya estaba publicada.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
FUENTE = RAIZ / "novedades" / "novedades.json"


def main():
    if len(sys.argv) != 2 or not sys.argv[1].strip():
        sys.exit("Falta la ficha: el id o la versión.")
    llave = sys.argv[1].strip()
    crudo = FUENTE.read_bytes()
    crlf = b"\r\n" in crudo
    texto = crudo.decode("utf-8").replace("\r\n", "\n")
    doc = json.loads(texto)
    # Por su `id`, o por su versión las que no lo llevan: es la misma llave
    # que usan la app (`novedadLlave`) y el panel.
    fichas = [e for e in doc.get("entradas", []) if (e.get("id") or e.get("version")) == llave]
    if not fichas:
        print(f"No hay ninguna ficha «{llave}».", file=sys.stderr)
        sys.exit(2)
    e = fichas[0]
    # Una ficha de una versión que todavía no existe no se aprueba, se pida
    # como se pida (ver herramientas/novedades-futuras.py). Sale con 3, que
    # quien llama lee como «esta se salta», no como un fallo.
    base = (RAIZ / "js" / "01-base.js").read_text(encoding="utf-8")
    app = re.search(r'^const VERSION = "([^"]+)";', base, re.M).group(1)
    num = lambda v: tuple(int(x) for x in str(v).split(".")) if re.fullmatch(r"\d+(\.\d+){1,3}", str(v or "")) else None
    if num(e.get("version")) is not None and num(e.get("version")) > num(app):
        print(f"«{llave}» es de una versión que todavía no existe (la app va en la {app}): no se aprueba.", file=sys.stderr)
        sys.exit(3)
    print(e.get("titulo", llave))
    if e.get("estado") == "publicado":
        print("Ya estaba publicada: no se toca nada.", file=sys.stderr)
        return
    e["estado"] = "publicado"
    nuevo = json.dumps(doc, indent=2, ensure_ascii=False) + "\n"
    FUENTE.write_bytes((nuevo.replace("\n", "\r\n") if crlf else nuevo).encode("utf-8"))
    subprocess.run([sys.executable, str(RAIZ / "herramientas" / "novedades-framer.py")], check=True,
                   stdout=sys.stderr)


if __name__ == "__main__":
    main()
