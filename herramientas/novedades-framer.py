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

CLASES = {"hito": ("Hito", "Milestone"), "expansion": ("Expansión", "Expansion"), "mejora": ("Mejora", "Improvement"),
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


# Los ocho colores de la app (css/estilos.css, `--paleta-N`, cara de noche): los
# mismos tonos que la app da a cada dato del gráfico, para que la web y la app
# cuenten lo mismo con los mismos colores.
PALETA = ["#5fe0b0", "#f5d76e", "#ff8a70", "#b7a2ea", "#6fc3e8", "#8fd18a", "#f0a5c0", "#9aa7b8"]
ANCHO = 1200


def tono(d, i):
    try:
        n = int(d.get("tono"))
        if 1 <= n <= 8:
            return PALETA[n - 1]
    except (TypeError, ValueError):
        pass
    return PALETA[i % 8]


def cortar(texto, largo):
    palabras, renglones, actual = str(texto or "").split(), [], ""
    for p in palabras:
        if len(actual) + len(p) + 1 > largo and actual:
            renglones.append(actual)
            actual = p
        else:
            actual = (actual + " " + p).strip()
    if actual:
        renglones.append(actual)
    return renglones


def bloque_cifras(g, en, y0):
    datos = g["datos"][:4]
    col = (ANCHO - 120) / len(datos)
    partes = []
    for i, d in enumerate(datos):
        x, c = 60 + col * i, tono(d, i)
        partes.append(f'<rect x="{x:.0f}" y="{y0}" width="{col - 20:.0f}" height="220" rx="22" fill="{c}" fill-opacity=".1"/>')
        partes.append(f'<text x="{x + 28:.0f}" y="{y0 + 110}" font-size="84" font-weight="800" fill="{c}">{esc(d["valor"])}</text>')
        for j, r in enumerate(cortar(campo(d, "texto", en), 20)[:2]):
            partes.append(f'<text x="{x + 28:.0f}" y="{y0 + 160 + j * 34}" font-size="27" fill="{APAGADO}">{esc(r)}</text>')
    return partes, 240


def bloque_comparar(g, en, y0):
    partes = []
    for i, d in enumerate(g["datos"]):
        y, c = y0 + i * 74, tono(d, i)
        a, b = int(d.get("antes", 0)), int(d.get("ahora", 0))
        partes.append(f'<text x="60" y="{y + 30}" font-size="29" fill="{TEXTO}">{esc(campo(d, "texto", en) or "")}</text>')
        for k in range(max(a, b)):
            cx = 560 + k * 30
            if k < min(a, b):
                partes.append(f'<circle cx="{cx}" cy="{y + 20}" r="10" fill="{c}" fill-opacity=".38"/>')
            elif k < b:
                partes.append(f'<circle cx="{cx}" cy="{y + 20}" r="10" fill="{c}"/>')
            else:
                partes.append(f'<circle cx="{cx}" cy="{y + 20}" r="9" fill="none" stroke="{CARRIL}" stroke-width="3"/>')
        partes.append(f'<text x="930" y="{y + 31}" font-size="29" fill="{APAGADO}" text-decoration="line-through">{a}</text>')
        partes.append(f'<text x="975" y="{y + 31}" font-size="29" fill="{APAGADO}">→</text>')
        partes.append(f'<text x="1025" y="{y + 32}" font-size="34" font-weight="800" fill="{c}">{b}</text>')
        if b != a:
            partes.append(f'<rect x="1072" y="{y + 4}" width="72" height="34" rx="17" fill="{c}"/>')
            partes.append(f'<text x="1108" y="{y + 29}" font-size="22" font-weight="800" fill="{FONDO}" text-anchor="middle">{"+" if b > a else "−"}{abs(b - a)}</text>')
    return partes, 74 * len(g["datos"])


def bloque_barras(g, en, y0):
    datos = g["datos"]
    maximo = max(float(d["valor"]) for d in datos) or 1
    partes = []
    for i, d in enumerate(datos):
        y, c = y0 + i * 66, tono(d, i)
        partes.append(f'<text x="60" y="{y + 26}" font-size="29" fill="{APAGADO}">{esc(campo(d, "texto", en) or "")}</text>')
        partes.append(f'<rect x="560" y="{y + 6}" width="440" height="26" rx="13" fill="{CARRIL}"/>')
        partes.append(f'<rect x="560" y="{y + 6}" width="{440 * float(d["valor"]) / maximo:.0f}" height="26" rx="13" fill="{c}"/>')
        partes.append(f'<text x="1040" y="{y + 30}" font-size="32" font-weight="800" fill="{TEXTO}">{esc(d["valor"])}</text>')
    return partes, 66 * len(datos)


def bloque_colores(g, en, y0):
    datos = g["datos"][:6]
    col = (ANCHO - 120) / len(datos)
    partes = []
    for i, d in enumerate(datos):
        x = 60 + col * i
        colores = d.get("colores") or []
        w = (col - 24) / max(1, len(colores))
        for k, c in enumerate(colores):
            partes.append(f'<rect x="{x + k * w:.1f}" y="{y0}" width="{w + .5:.1f}" height="90" fill="{esc(c)}"/>')
        partes.append(f'<rect x="{x:.0f}" y="{y0}" width="{col - 24:.0f}" height="90" rx="14" fill="none" stroke="{CARRIL}" stroke-width="3"/>')
        partes.append(f'<text x="{x:.0f}" y="{y0 + 132}" font-size="28" font-weight="700" fill="{TEXTO}">{esc(campo(d, "nombre", en) or "")}</text>')
    return partes, 150


BLOQUES = {"cifras": bloque_cifras, "comparar": bloque_comparar, "barras": bloque_barras, "colores": bloque_colores}


def dibujar(e, en=False):
    g = e.get("grafico")
    bloques = [b for b in (g if isinstance(g, list) else [g]) if b and b.get("datos")]
    if not bloques:
        return ""
    partes, y = [], 40
    for b in bloques:
        titulo = campo(b, "titulo", en) or ""
        partes.append(f'<text x="60" y="{y + 44}" font-size="24" font-weight="800" letter-spacing="3" fill="{APAGADO}">{esc(titulo.upper())}</text>')
        hechas, alto = BLOQUES.get(b.get("tipo"), bloque_cifras)(b, en, y + 76)
        partes += hechas
        y += 76 + alto + 40
    alto_total = y + 20
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {ANCHO} {alto_total}" width="{ANCHO}" height="{alto_total}" '
           f'font-family="{LETRA}">'
           f'<rect width="{ANCHO}" height="{alto_total}" rx="36" fill="{FONDO}"/>'
           f'<rect x="12" y="12" width="{ANCHO - 24}" height="{alto_total - 24}" rx="28" fill="{TARJETA}"/>'
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
            "Destacada": "true" if clase in ("expansion", "hito") else "false",
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
