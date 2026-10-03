#!/usr/bin/env python3
"""Las novedades, listas para el CMS de Framer (0.7.151).

El sitio (norata.framer.website) vive en Framer, y su changelog es una
colección del CMS. Framer importa colecciones desde un CSV, así que esto
convierte `novedades/novedades.json` —la misma fuente que lee la app— en
`novedades/framer.csv`. Nada se escribe dos veces: el texto, la clase, la
imagen y el gráfico salen del JSON.

    python herramientas/novedades-framer.py              # solo lo publicado
    python herramientas/novedades-framer.py --borradores # también borradores

**`novedades/framer.csv` se publica y viaja en el repositorio** (desde el 1 oct
2026): una hoja de Google lo baja cada hora de mi.norata.app y Framer
sincroniza su colección desde esa hoja. Por eso solo lleva lo publicado, y por
eso `--borradores` escribe en OTRO archivo (`framer-borradores.csv`, que no se
versiona ni se publica): con uno solo, una prueba de diseño dejaba los
borradores a un commit de salir en el sitio. Lo rehace el hook de pre-commit
cuando cambia el JSON y lo vigila `.github/workflows/novedades-framer.yml`.

Lo que hace además:

- **Dibuja los gráficos.** En la app un gráfico es HTML con los colores del
  mundo de quien mira; Framer no ejecuta eso, así que aquí se dibuja un SVG
  por entrada (`novedades/img/<versión>-grafico.svg`) con la paleta de noche
  de Norata, y el cuerpo de la tarjeta lo lleva dentro como una imagen más.
- **Arma el cuerpo con sus imágenes entre el texto** (`cuerpo`) y elige el
  banner de arriba (`banner_de`).
- **Escribe direcciones completas** (https://mi.norata.app/…): el banner lo
  baja Framer de ahí al sincronizar, y las del cuerpo las pide el navegador de
  quien mira. Por eso hay que publicar (subir a `main` y esperar el minuto de
  GitHub Pages) ANTES de sincronizar.

Sin dependencias: solo la biblioteca estándar.
"""
import csv
import hashlib
import html
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
FUENTE = RAIZ / "novedades" / "novedades.json"
SALIDA = RAIZ / "novedades" / "framer.csv"
SALIDA_BORRADORES = RAIZ / "novedades" / "framer-borradores.csv"
IMG = RAIZ / "novedades" / "img"
WEB = "https://mi.norata.app/"

CLASES = {"hito": ("Nueva etapa", "New stage"), "expansion": ("Expansión", "Expansion"), "mejora": ("Mejora", "Improvement"),
          "arreglo": ("Arreglo", "Fix")}

# La paleta de noche de Norata (css/estilos.css, :root). El SVG no puede leer
# variables de la app, así que se escriben aquí, y solo aquí.
FONDO, TARJETA, HONDO, LINEA = "#10151d", "#1d2530", "#161c26", "#2a3441"
TEXTO, APAGADO, MENTA, CARRIL = "#eaf1ef", "#8b99a5", "#5fe0b0", "#2a3441"
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

# ---- La lámina del gráfico ----
# Rehecha el 2 oct 2026, cuando Eduardo vio la primera en el sitio: «no tiene
# la identidad visual de Norata clásico», las paletas sin esquinas redondas y
# sin decir en qué nivel se gana cada una, y los números sin un texto que
# dijera qué contaban. De ahí salen cuatro cosas:
#   - **La letra es Outfit de verdad**, incrustada. Un SVG puesto como imagen
#     no puede pedir una letra de fuera, y con «Outfit» solo escrito salía la
#     del sistema de quien mira. Se lee de `css/fuente.css`, que ya la trae.
#   - **Los iconos son los de la app** (`ICONS`, `js/01-base.js`).
#   - **Cada número lleva su explicación** (`detalle`) y cada paleta dice
#     cuándo se tiene (`nota`, con `candado` si hay que ganarla).
#   - **Mide siempre 1200×675**, 16:9, que es la caja de las imágenes de la
#     tarjeta: así el gráfico la llena y no queda con franjas.
ANCHO, ALTO = 1200, 675
MARGEN, HUECO = 30, 24
AVISO = "#f5d76e"


def letra():
    """El `@font-face` de Outfit, con la letra dentro."""
    m = re.search(r"url\((data:font/woff2;base64,[^)]+)\)", (RAIZ / "css" / "fuente.css").read_text(encoding="utf-8"))
    if not m:
        return ""
    return ("<style>@font-face{font-family:'Outfit';font-weight:300 800;src:url(" + m.group(1)
            + ") format('woff2')}</style>")


def iconos():
    """Los dibujos de `ICONS`, tal como los tiene la app."""
    t = (RAIZ / "js" / "01-base.js").read_text(encoding="utf-8")
    a = t.index("const ICONS = {")
    return dict(re.findall(r"^\s*(\w+): '([^']*)',?\s*$", t[a:t.index("};", a)], re.M))


def icono(nombre, x, y, lado, color, grosor=1.9):
    trazo = ICONOS.get(nombre or "", "")
    if not trazo:
        return ""
    return (f'<g transform="translate({x:.1f},{y:.1f}) scale({lado / 24:.3f})" fill="none" stroke="{color}" '
            f'stroke-width="{grosor}" stroke-linecap="round" stroke-linejoin="round">{trazo}</g>')


def texto(x, y, t, tam, color, peso=500, ancla="", extra=""):
    ancla = f' text-anchor="{ancla}"' if ancla else ""
    return (f'<text x="{x:.1f}" y="{y:.1f}" font-size="{tam}" font-weight="{peso}" fill="{color}"'
            f'{ancla}{extra}>{esc(t)}</text>')


def ancho_de(t, tam, peso=500):
    """Lo que ocupa un texto, a ojo: no hay con qué medirlo aquí. Outfit anda
    en la mitad de su tamaño por letra, y algo más en negrita."""
    return len(str(t)) * tam * (0.56 if peso >= 700 else 0.5)


def que_quepa(t, tam, peso, ancho, minimo):
    while tam > minimo and ancho_de(t, tam, peso) > ancho:
        tam -= 1
    return tam


def tono(d, i):
    try:
        n = int(d.get("tono"))
        if 1 <= n <= 8:
            return PALETA[n - 1]
    except (TypeError, ValueError):
        pass
    return PALETA[i % 8]


def cortar(frase, largo):
    palabras, renglones, actual = str(frase or "").split(), [], ""
    for p in palabras:
        if len(actual) + len(p) + 1 > largo and actual:
            renglones.append(actual)
            actual = p
        else:
            actual = (actual + " " + p).strip()
    if actual:
        renglones.append(actual)
    return renglones


def bloque_cifras(g, en, x, y, w, h):
    """Cada número, con lo que cuenta al lado y debajo qué hay detrás de él."""
    datos = g["datos"][:4]
    paso, partes = h / len(datos), []
    for i, d in enumerate(datos):
        c, cy = tono(d, i), y + paso * i + paso / 2
        partes.append(f'<rect x="{x}" y="{cy - 34:.1f}" width="68" height="68" rx="18" fill="{c}" fill-opacity=".14"/>')
        partes.append(icono(d.get("icono") or "star", x + 16, cy - 18, 36, c))
        valor, que, det = str(d["valor"]), campo(d, "texto", en) or "", campo(d, "detalle", en) or ""
        xn = x + 88
        base = cy - 2 if det else cy + 18
        # El número y lo que cuenta, en UN texto con dos tramos: así el segundo
        # empieza donde acaba el primero de verdad, y no donde se le calcula.
        tam = que_quepa(que, 30, 600, x + w - xn - ancho_de(valor, 52, 800) - 14, 22)
        partes.append(f'<text x="{xn}" y="{base:.1f}"><tspan font-size="52" font-weight="800" fill="{c}">{esc(valor)}</tspan>'
                      f'<tspan dx="14" font-size="{tam}" font-weight="600" fill="{TEXTO}">{esc(que)}</tspan></text>')
        for j, r in enumerate(cortar(det, int((x + w - xn) / 11.5))[:2]):
            partes.append(texto(xn, cy + 30 + j * 28, r, 23, APAGADO))
    return partes


def bloque_comparar(g, en, x, y, w, h):
    """Un antes y un ahora que se lee sin adivinar: casillas apagadas por lo
    que ya había y encendidas por lo que llegó, los dos números con su nombre
    encima, y debajo QUÉ es lo que llegó."""
    datos, partes = g["datos"], []
    pie = 44
    paso = (h - pie) / len(datos)
    # Sin pastilla de «+4» al final: los dos números ya lo dicen, y quitarla
    # deja sitio al rótulo. Eduardo la vio de más (2 oct 2026).
    xa, xb = x + w - 104, x + w - 26
    partes.append(texto(xa, y - 14, "BEFORE" if en else "ANTES", 16, APAGADO, 700, "middle", ' letter-spacing="1.4"'))
    partes.append(texto(xb, y - 14, "NOW" if en else "AHORA", 16, APAGADO, 700, "middle", ' letter-spacing="1.4"'))
    for i, d in enumerate(datos):
        c, y0 = tono(d, i), y + paso * i
        a, b = int(d.get("antes", 0)), int(d.get("ahora", 0))
        partes.append(icono(d.get("icono") or "star", x, y0 + 8, 28, c, 2.1))
        rot = campo(d, "texto", en) or ""
        partes.append(texto(x + 40, y0 + 32, rot, que_quepa(rot, 28, 600, xa - 30 - x - 40, 20), TEXTO, 600))
        partes.append(texto(xa, y0 + 32, a, 28, APAGADO, 600, "middle"))
        partes.append(texto((xa + xb) / 2 - 4, y0 + 30, "→", 24, APAGADO, 500, "middle"))
        partes.append(texto(xb, y0 + 34, b, 36, c, 800, "middle"))
        n = max(a, b, 1)
        lado = min(46.0, (w - 8 * (n - 1)) / n)
        for k in range(n):
            xc = x + k * (lado + 8)
            if k < min(a, b):
                partes.append(f'<rect x="{xc:.1f}" y="{y0 + 50}" width="{lado:.1f}" height="16" rx="6" fill="{c}" fill-opacity=".3"/>')
            elif k < b:
                partes.append(f'<rect x="{xc:.1f}" y="{y0 + 50}" width="{lado:.1f}" height="16" rx="6" fill="{c}"/>')
            else:
                partes.append(f'<rect x="{xc + 1:.1f}" y="{y0 + 51}" width="{lado - 2:.1f}" height="14" rx="5" fill="none" stroke="{CARRIL}" stroke-width="2"/>')
        det = campo(d, "detalle", en) or ""
        if det:
            partes.append(texto(x, y0 + 92, det, que_quepa(det, 22, 500, w, 17), APAGADO))
    habia, nuevo = ("What was already there", "What's new") if en else ("Lo que ya había", "Lo nuevo")
    yl = y + h - 10
    partes.append(f'<rect x="{x}" y="{yl - 14}" width="30" height="14" rx="5" fill="{TEXTO}" fill-opacity=".3"/>')
    partes.append(texto(x + 40, yl, habia, 19, APAGADO))
    x2 = x + 40 + ancho_de(habia, 19) + 28
    partes.append(f'<rect x="{x2:.1f}" y="{yl - 14}" width="30" height="14" rx="5" fill="{TEXTO}"/>')
    partes.append(texto(x2 + 40, yl, nuevo, 19, APAGADO))
    return partes


def bloque_barras(g, en, x, y, w, h):
    datos = g["datos"]
    maximo = max(float(d["valor"]) for d in datos) or 1
    paso, partes = min(96.0, h / len(datos)), []
    for i, d in enumerate(datos):
        c, y0 = tono(d, i), y + paso * i
        partes.append(icono(d.get("icono") or "star", x, y0 + 6, 28, c, 2.1))
        rot = campo(d, "texto", en) or ""
        partes.append(texto(x + 40, y0 + 30, rot, que_quepa(rot, 28, 600, w - 130, 20), TEXTO, 600))
        partes.append(texto(x + w, y0 + 32, d["valor"], 34, c, 800, "end"))
        partes.append(f'<rect x="{x}" y="{y0 + 48}" width="{w}" height="16" rx="8" fill="{CARRIL}"/>')
        partes.append(f'<rect x="{x}" y="{y0 + 48}" width="{max(16, w * float(d["valor"]) / maximo):.0f}" height="16" rx="8" fill="{c}"/>')
    return partes


def bloque_colores(g, en, x, y, w, h):
    """Cada paleta en su renglón: sus muestras en una pastilla de esquinas
    redondas, su nombre, y cuándo se tiene."""
    datos = g["datos"][:6]
    paso, partes = min(104.0, h / len(datos)), []
    tira = 176 if w < 700 else 240
    for i, d in enumerate(datos):
        cy = y + paso * i + paso / 2
        colores = (d.get("colores") or [])[:5]
        recorte = f"r{int(x)}-{int(y)}-{i}"
        partes.append(f'<clipPath id="{recorte}"><rect x="{x}" y="{cy - 28:.1f}" width="{tira}" height="56" rx="16"/></clipPath>')
        partes.append(f'<g clip-path="url(#{recorte})">' + "".join(
            f'<rect x="{x + k * tira / len(colores):.1f}" y="{cy - 28:.1f}" width="{tira / len(colores) + .6:.1f}" height="56" fill="{esc(c)}"/>'
            for k, c in enumerate(colores)) + "</g>")
        partes.append(f'<rect x="{x}" y="{cy - 28:.1f}" width="{tira}" height="56" rx="16" fill="none" stroke="{LINEA}" stroke-width="2"/>')
        nota, xt = campo(d, "nota", en) or "", x + tira + 22
        partes.append(texto(xt, cy - 2 if nota else cy + 10, campo(d, "nombre", en) or "", 29, TEXTO, 700))
        if nota:
            ganar = bool(d.get("candado"))
            corre = 27 if ganar else 0
            if ganar:
                partes.append(icono("lock", xt, cy + 9, 20, AVISO, 2.3))
            partes.append(texto(xt + corre, cy + 27, nota, que_quepa(nota, 21, 500, x + w - xt - corre, 16),
                                AVISO if ganar else APAGADO))
    return partes


ICONOS = iconos()
BLOQUES = {"cifras": bloque_cifras, "comparar": bloque_comparar, "barras": bloque_barras, "colores": bloque_colores}


def slug(e):
    """Con qué casa Framer cada fila. Una ficha con `id` se llama por él desde
    que se da de alta —todavía sin número, que es del paquete—; las de antes de
    los paquetes no lo llevan y siguen llamándose por su versión."""
    return e.get("id") or "v" + e["version"].replace(".", "-")


# Framer admite 1000 filas por colección, y a ellas se llegaría en meses: la
# app lleva más de cien versiones en seis semanas. Al sitio no va todo.
TOPE_FRAMER = 1000
AVISO_FRAMER = 800


def va_al_sitio(e):
    """Solo lo destacado: lo que alguien le contaría a otra persona.

    Una expansión y una nueva etapa van siempre. Una mejora o un arreglo se
    quedan en la app (Ajustes → Novedades), salvo que la ficha lo pida con
    `"sitio": true`. Y `"sitio": false` saca del sitio una expansión que no
    lo merezca. La app no mira este campo: ahí sale todo lo publicado."""
    if e.get("sitio") is not None:
        return bool(e["sitio"])
    return e.get("clase") in ("expansion", "hito")


def lamina(bloques, en):
    """Una lámina de 1200×675 con hasta cuatro bloques."""
    # Uno ocupa la lámina entera; dos van lado a lado; tres o cuatro, en rejilla.
    columnas = 1 if len(bloques) == 1 else 2
    filas = (len(bloques) + columnas - 1) // columnas
    w = (ANCHO - 2 * MARGEN - HUECO * (columnas - 1)) / columnas
    h = (ALTO - 2 * MARGEN - HUECO * (filas - 1)) / filas
    partes = []
    for n, b in enumerate(bloques):
        x, y = MARGEN + (n % columnas) * (w + HUECO), MARGEN + (n // columnas) * (h + HUECO)
        partes.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="24" fill="{HONDO}" stroke="{LINEA}" stroke-width="1.5"/>')
        partes.append(texto(x + 28, y + 46, (campo(b, "titulo", en) or "").upper(), 20, APAGADO, 800, extra=' letter-spacing="2.4"'))
        partes += BLOQUES.get(b.get("tipo"), bloque_cifras)(b, en, x + 28, y + 80, w - 56, h - 80 - 24)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {ANCHO} {ALTO}" width="{ANCHO}" height="{ALTO}" '
            f'font-family="{LETRA}">' + letra()
            + f'<rect width="{ANCHO}" height="{ALTO}" fill="{TARJETA}"/>'
            + "".join(partes) + "</svg>\n")


def dibujar(e, en=False):
    """Las láminas de una ficha: `[(tras, dirección, títulos, pie)]`.

    Un gráfico es una lista de bloques, y **los que llevan el mismo `tras` van
    en la misma lámina**, que cae tras ese punto del texto (sin `tras`, tras
    el último). Así una ficha que cuenta dos cosas —paletas y ambientes— lleva
    cada dibujo junto al punto que lo dice, en vez de uno solo con todo."""
    g = e.get("grafico")
    grupos = {}
    for b in (g if isinstance(g, list) else [g]):
        if b and b.get("datos"):
            grupos.setdefault(b.get("tras"), []).append(b)
    raiz = e.get("id") or e["version"]
    cola = "-en" if en else ""
    hechas, nombres = [], set()
    for n, (tras, bloques) in enumerate(grupos.items()):
        # Con la huella de su contenido en el nombre: el navegador de quien mira
        # guarda la imagen por su dirección, así que un gráfico que cambia con
        # el nombre de siempre seguiría saliendo viejo. Es la regla de las
        # imágenes («si cambia, cambia de nombre»), cumplida sola.
        crudo = lamina(bloques[:4], en).encode("utf-8")
        nombre = f'{raiz}-grafico{f"-{n + 1}" if n else ""}{cola}-{hashlib.sha1(crudo).hexdigest()[:8]}.svg'
        # En bytes y no en texto: en Windows `write_text` cambia el salto de
        # línea, y el archivo tiene que salir idéntico aquí y en el Linux que
        # lo vigila.
        (IMG / nombre).write_bytes(crudo)
        nombres.add(nombre)
        # El pie de la lámina: el `pie` del primer bloque que lo traiga, que
        # dice qué enseña el dibujo; sin él, sus títulos.
        titulos = ", ".join(campo(b, "titulo", en) or "" for b in bloques)
        pie = next((campo(b, "pie", en) for b in bloques if campo(b, "pie", en)), None) or titulos.replace(", ", " · ")
        hechas.append((tras, WEB + "novedades/img/" + nombre, titulos, pie))
    # Y las de antes se quitan, o `novedades/img/` se llenaría de gráficos que
    # nadie enlaza.
    suyas = re.compile(re.escape(raiz) + r"-grafico(-\d+)?" + cola + r"(-[0-9a-f]{8})?\.svg")
    for viejo in IMG.glob(raiz + "-grafico*.svg"):
        if suyas.fullmatch(viejo.name) and viejo.name not in nombres:
            viejo.unlink()
    return hechas


def figura(src, alt, clase, pie=""):
    """Una imagen con su pie debajo, centrado (Eduardo, 3 oct 2026: «coloca
    siempre uno en cada imagen que sea alusivo al contenido»). El pie dice qué
    se ve; el punto del texto, debajo del tramo, dice qué cambió.

    Los estilos del pie van EN LÍNEA además de en la tarjeta: el componente de
    Framer se pega a mano, y una tarjeta con el componente viejo enseñaría el
    pie sin centrar hasta que alguien lo vuelva a pegar."""
    img = f'<figure class="nv-fig {clase}"><img src="{esc(src)}" alt="{esc(alt or "")}" loading="lazy"></figure>'
    if not pie:
        return img
    return (f'<div class="nv-pieza" style="display:grid;gap:8px;min-width:0">{img}'
            f'<p class="nv-leyenda" style="margin:0;text-align:center;font-size:14px;line-height:1.4;opacity:.72">{esc(pie)}</p></div>')


def cuerpo(e, en=False):
    """El cuerpo de la tarjeta, en HTML, con sus imágenes DENTRO del texto.

    Lo pinta el componente `TarjetaNovedad` del sitio (su copia está en
    `herramientas/framer/`), que es quien trae los estilos de las clases
    `nv-*`. Va en una columna de texto plano y no de texto con formato: Framer
    no deja darle a ese texto ni el rótulo de «Retoques» ni imágenes del mismo
    tamaño que se abran al tocarlas, y Eduardo pidió las tres cosas.

    A qué punto acompaña cada imagen lo dice su `tras`: el número del punto (1
    es el primero; sin `tras`, el último; 0 es antes de todos y sin pie). Los
    bloques del gráfico llevan su `tras` igual. El `tras` da el ORDEN y dice
    qué punto deja de escribirse: **un punto con imagen no sale como texto, lo
    dice el pie de su imagen**; los puntos sin imagen van debajo, en lista.
    Todas las imágenes van en una sola rejilla, de dos en dos, y miden lo
    mismo. Por eso tienen que ser un número PAR: si no, falta una."""
    puntos = campo(e, "puntos", en) or []
    medios = {}

    def poner(donde, trozo):
        try:
            donde = int(donde)
        except (TypeError, ValueError):
            donde = len(puntos)
        medios.setdefault(max(0, min(len(puntos), donde)), []).append(trozo)

    # La `imagen` que ya sale de banner no se repite debajo: Eduardo lo paró al
    # verla dos veces en la misma tarjeta. Solo va en el cuerpo si el banner
    # trae su propio arte.
    propia = [e.get("imagen")] if (e.get("banner") or {}).get("src") else []
    for img in propia + list(e.get("imagenes") or []):
        if img and img.get("src"):
            poner(img.get("tras"), figura(WEB + campo(img, "src", en), campo(img, "alt", en), "nv-foto",
                                          campo(img, "pie", en) or ""))
    for tras, direccion, titulos, pie in dibujar(e, en):
        poner(tras, figura(direccion, ("Chart: " if en else "Gráfico: ") + titulos, "nv-grafico", pie))

    # Todas las imágenes de la ficha van en UNA rejilla, de dos en dos, y el
    # punto que acompañaban ya no se escribe: su pie lo dice. Eduardo, 3 oct
    # 2026, al ver el pie y debajo el punto con bolita: «dan información
    # repetida… el texto con bolita se tendría que ir», y «en PC tienen que
    # salir sí o sí de 2 en dos». Antes cada punto abría su propio tramo, y con
    # una sola imagen por punto salían de una en una, a todo lo ancho.
    #
    # La rejilla lleva sus columnas EN LÍNEA: el componente de Framer se pega a
    # mano, y así no depende de que alguien lo vuelva a pegar. `max(240px,
    # 34%)` son dos columnas como mucho, y una sola cuando no caben (teléfono).
    # Los puntos sin imagen que van ANTES de la primera se quedan arriba de la
    # rejilla, y los de después, debajo: así la tarjeta de Cyberpunk, que es
    # la referencia de Eduardo para el acomodo, conserva su punto encima.
    trozos = []
    todos = [t for n in sorted(medios) for t in medios[n]]
    primera = min([n for n in medios if n > 0], default=0)
    antes = [f"<li>{esc(p)}</li>" for i, p in enumerate(puntos, 1) if i not in medios and i < primera]
    if antes:
        trozos.append('<ul class="nv-puntos">' + "".join(antes) + "</ul>")
    if todos:
        if len(todos) % 2:
            print(f"  ¡OJO! {e.get('id') or e['version']}: {len(todos)} imágenes, número impar. "
                  "Van de dos en dos: falta una para que la rejilla quede pareja.", file=sys.stderr)
        trozos.append('<div class="nv-medios" style="display:grid;gap:20px 14px;margin:4px 0;'
                      'grid-template-columns:repeat(auto-fit,minmax(max(240px,34%),1fr))">' + "".join(todos) + "</div>")
    sueltos = [f"<li>{esc(p)}</li>" for i, p in enumerate(puntos, 1) if i not in medios and i >= primera]
    if sueltos:
        trozos.append('<ul class="nv-puntos">' + "".join(sueltos) + "</ul>")
    ret = e.get("retoques") or []
    if ret:
        trozos.append(f'<h5 class="nv-rotulo">{"Touch-ups" if en else "Retoques"}</h5><ul class="nv-retoques">' +
                      "".join(f'<li><strong>{esc(r["version"])}</strong> <span>{esc(campo(r, "texto", en) or "")}</span></li>' for r in ret) +
                      "</ul>")
    return "".join(trozos)


def banner_de(e):
    """La imagen de arriba de la tarjeta, ancha como la de un parche de Steam.

    `banner` puede traer su propio `src` (un arte hecho para eso) o solo decir
    adónde mirar dentro de la `imagen` que la ficha ya tiene (`foco`, en el
    formato de `object-position`: «70% 21%»). Una captura es 16:9 y el banner
    es 4:1: sin `foco` se queda con la franja del centro, que casi nunca es
    donde está lo que se quiere enseñar."""
    b, img = e.get("banner") or {}, e.get("imagen") or {}
    src = b.get("src") or img.get("src")
    if not src:
        return {}
    de = b if b.get("src") else img
    return {"src": WEB + src, "alt": de.get("alt", ""), "alt_en": campo(de, "alt", True) or "",
            "foco": b.get("foco") or "50% 50%"}


def main():
    con_borradores = "--borradores" in sys.argv
    entradas = json.loads(FUENTE.read_text(encoding="utf-8"))["entradas"]
    filas = []
    # `aprobado` es lo que ya tiene el visto bueno y espera a que suba su
    # paquete: todavía no es público, así que va con los borradores.
    elegidas = [e for e in entradas
                if va_al_sitio(e)
                and (e.get("estado") == "publicado" or (con_borradores and e.get("estado") in ("borrador", "aprobado")))]
    if len(elegidas) > TOPE_FRAMER:
        sys.exit(f"{len(elegidas)} fichas para el sitio y Framer admite {TOPE_FRAMER}. "
                 "Hay que sacar las más viejas con `\"sitio\": false`.")
    if len(elegidas) > AVISO_FRAMER:
        print(f"Ojo: {len(elegidas)} fichas para el sitio, y Framer admite {TOPE_FRAMER}.", file=sys.stderr)
    slugs = [slug(e) for e in elegidas]
    repetidos = sorted({s for s in slugs if slugs.count(s) > 1})
    if repetidos:
        sys.exit("Dos fichas con el mismo slug, y Framer casa las filas por él: " + ", ".join(repetidos)
                 + ". Si comparten versión (un paquete), cada una lleva su `id`.")
    for n, e in enumerate(elegidas):
        clase = e.get("clase") if e.get("clase") in CLASES else "mejora"
        ban = banner_de(e)
        if clase == "expansion" and not ban:
            print(f'Ojo: la expansión {e["version"]} va al sitio sin banner (ni `banner` ni `imagen`).', file=sys.stderr)
        filas.append({
            "Slug": slug(e),
            "Título": e["titulo"],
            "Versión": e["version"],
            "Fecha": e["fecha"],
            # Varias fichas salen el mismo día, y por fecha sola Framer las
            # ordena como quiera. Cuenta desde la más vieja, así que una ficha
            # nueva no le cambia el número a ninguna.
            "Orden": len(elegidas) - n,
            "Clase": CLASES[clase][0],
            "Destacada": "true" if clase in ("expansion", "hito") else "false",
            "Resumen": e.get("resumen", ""),
            "Cuerpo": cuerpo(e),
            "Banner": ban.get("src", ""),
            "Banner alt": ban.get("alt", ""),
            "Banner foco": ban.get("foco", ""),
            "Title (EN)": campo(e, "titulo", True),
            "Summary (EN)": campo(e, "resumen", True) or "",
            "Body (EN)": cuerpo(e, True),
            "Class (EN)": CLASES[clase][1],
            "Banner alt (EN)": ban.get("alt_en", ""),
        })
    salida = SALIDA_BORRADORES if con_borradores else SALIDA
    with salida.open("w", encoding="utf-8", newline="") as f:
        # Salto de línea fijo: el módulo csv mete un retorno de carro por su
        # cuenta, y el mismo JSON daría un archivo distinto según quién lo genere.
        w = csv.DictWriter(f, fieldnames=list(filas[0].keys()) if filas else ["Slug"], lineterminator="\n")
        w.writeheader()
        w.writerows(filas)
    print(f"{len(filas)} novedades en {salida.relative_to(RAIZ)}" + (" (con borradores)" if con_borradores else ""))


if __name__ == "__main__":
    main()
