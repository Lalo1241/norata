#!/usr/bin/env python3
"""Las novedades, listas para el CMS de Framer (0.7.151).

El sitio (norata.framer.website) vive en Framer, y su changelog es una
colección del CMS. Framer importa colecciones desde un CSV, así que esto
convierte `novedades/novedades.json` —la misma fuente que lee la app— en
`novedades/framer.csv`. Nada se escribe dos veces: el texto, la clase, la
imagen y el gráfico salen del JSON.

    python herramientas/novedades-framer.py              # solo lo publicado
    python herramientas/novedades-framer.py --borradores # también borradores

Lo que hace además:

- **Dibuja los gráficos.** En la app un gráfico es HTML con los colores del
  mundo de quien mira; Framer no ejecuta eso, así que aquí se dibuja un SVG
  por entrada (`novedades/img/<versión>-grafico.svg`) con la paleta de noche
  de Norata, y la columna «Gráfico» apunta a él.
- **Escribe direcciones completas** (https://mi.norata.app/…) en las columnas
  de imagen: Framer las baja de ahí al importar. Por eso hay que publicar
  (subir a `main` y esperar el minuto de GitHub Pages) ANTES de importar.

Sin dependencias: solo la biblioteca estándar.
"""
import csv
import html
import json
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
FUENTE = RAIZ / "novedades" / "novedades.json"
SALIDA = RAIZ / "novedades" / "framer.csv"
IMG = RAIZ / "novedades" / "img"
WEB = "https://mi.norata.app/"

CLASES = {"expansion": ("Expansión", "Expansion"), "mejora": ("Mejora", "Improvement"),
          "arreglo": ("Arreglo", "Fix")}

# La paleta de noche de Norata (css/estilos.css, :root). El SVG no puede leer
# variables de la app, así que se escriben aquí, y solo aquí.
FONDO, TARJETA, TEXTO, APAGADO, MENTA, CARRIL = "#10151d", "#1d2530", "#eef1f6", "#98a2b3", "#5fe0b0", "#2a3442"
LETRA = "Outfit, 'Segoe UI', system-ui, sans-serif"


def campo(obj, nombre, en=False):
    if en and isinstance(obj.get("en"), dict) and obj["en"].get(nombre):
        return obj["en"][nombre]
    return obj.get(nombre)


def esc(t):
    return html.escape(str(t), quote=True)


def svg_cifras(g, en):
    datos = g["datos"][:4]
    ancho, alto = 1200, 400
    col = ancho / len(datos)
    partes = []
    for i, d in enumerate(datos):
        x = col * i + 60
        partes.append(f'<text x="{x:.0f}" y="210" font-size="120" font-weight="800" fill="{MENTA}">{esc(d["valor"])}</text>')
        # Hasta dos renglones de rótulo, cortados por palabras.
        palabras, renglones, actual = str(campo(d, "texto", en) or "").split(), [], ""
        for p in palabras:
            if len(actual) + len(p) + 1 > 22 and actual:
                renglones.append(actual)
                actual = p
            else:
                actual = (actual + " " + p).strip()
        if actual:
            renglones.append(actual)
        for j, r in enumerate(renglones[:2]):
            partes.append(f'<text x="{x:.0f}" y="{270 + j * 40}" font-size="30" fill="{APAGADO}">{esc(r)}</text>')
    return ancho, alto, partes


def svg_barras(g, en):
    datos = g["datos"]
    ancho = 1200
    alto = 140 + 80 * len(datos)
    maximo = max(float(d["valor"]) for d in datos) or 1
    partes = []
    for i, d in enumerate(datos):
        y = 130 + i * 80
        largo = 640 * float(d["valor"]) / maximo
        partes.append(f'<text x="60" y="{y + 24}" font-size="30" fill="{APAGADO}">{esc(campo(d, "texto", en) or "")}</text>')
        partes.append(f'<rect x="420" y="{y}" width="640" height="32" rx="16" fill="{CARRIL}"/>')
        partes.append(f'<rect x="420" y="{y}" width="{largo:.0f}" height="32" rx="16" fill="{MENTA}"/>')
        partes.append(f'<text x="1090" y="{y + 26}" font-size="32" font-weight="800" fill="{TEXTO}">{esc(d["valor"])}</text>')
    return ancho, alto, partes


def dibujar(e, en=False):
    g = e.get("grafico")
    if not g or not g.get("datos"):
        return ""
    ancho, alto, partes = (svg_barras if g.get("tipo") == "barras" else svg_cifras)(g, en)
    titulo = campo(g, "titulo", en) or ""
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {ancho} {alto}" width="{ancho}" height="{alto}" '
           f'font-family="{LETRA}">'
           f'<rect width="{ancho}" height="{alto}" rx="36" fill="{FONDO}"/>'
           f'<rect x="12" y="12" width="{ancho - 24}" height="{alto - 24}" rx="28" fill="{TARJETA}"/>'
           f'<text x="60" y="84" font-size="26" font-weight="800" letter-spacing="3" fill="{APAGADO}">{esc(titulo.upper())}</text>'
           + "".join(partes) + "</svg>\n")
    nombre = f'{e["version"]}-grafico{"-en" if en else ""}.svg'
    (IMG / nombre).write_text(svg, encoding="utf-8")
    return WEB + "novedades/img/" + nombre


def contenido(e, en=False):
    """El cuerpo, en HTML: Framer lo importa como texto con formato."""
    trozos = []
    puntos = campo(e, "puntos", en) or []
    if puntos:
        trozos.append("<ul>" + "".join(f"<li>{esc(p)}</li>" for p in puntos) + "</ul>")
    ret = e.get("retoques") or []
    if ret:
        trozos.append(f'<h3>{"Touch-ups" if en else "Retoques"}</h3><ul>' +
                      "".join(f'<li><strong>{esc(r["version"])}</strong> {esc(campo(r, "texto", en) or "")}</li>' for r in ret) +
                      "</ul>")
    return "".join(trozos)


def main():
    con_borradores = "--borradores" in sys.argv
    entradas = json.loads(FUENTE.read_text(encoding="utf-8"))["entradas"]
    filas = []
    for e in entradas:
        if e.get("estado") != "publicado" and not (con_borradores and e.get("estado") == "borrador"):
            continue
        clase = e.get("clase") if e.get("clase") in CLASES else "mejora"
        img = e.get("imagen") or {}
        filas.append({
            "Slug": "v" + e["version"].replace(".", "-"),
            "Título": e["titulo"],
            "Versión": e["version"],
            "Fecha": e["fecha"],
            "Clase": CLASES[clase][0],
            "Destacada": "true" if clase == "expansion" else "false",
            "Resumen": e.get("resumen", ""),
            "Contenido": contenido(e),
            "Imagen": (WEB + img["src"]) if img.get("src") else "",
            "Imagen alt": img.get("alt", ""),
            "Gráfico": dibujar(e),
            "Estado": e.get("estado", ""),
            "Title (EN)": campo(e, "titulo", True),
            "Summary (EN)": campo(e, "resumen", True) or "",
            "Content (EN)": contenido(e, True),
            "Class (EN)": CLASES[clase][1],
            "Image alt (EN)": campo(img, "alt", True) or "",
            "Chart (EN)": dibujar(e, True),
        })
    with SALIDA.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(filas[0].keys()) if filas else ["Slug"])
        w.writeheader()
        w.writerows(filas)
    print(f"{len(filas)} novedades en {SALIDA.relative_to(RAIZ)}" + (" (con borradores)" if con_borradores else ""))


if __name__ == "__main__":
    main()
