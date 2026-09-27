# -*- coding: utf-8 -*-
"""Las piezas de píxel de Averno (0.7.141): el marco con esquina a 45° y
bisel, el rombo de los iconos, el sello de geometría sagrada del fondo, las
brasas y el remate de los títulos. Todas en SVG de píxel (crispEdges),
horneadas aquí porque un `url()` no lee variables: `averno.py` las llama una
vez por paleta y por cara con los tonos de `paletas.py`.

La regla que las ordena la dio Eduardo con la barra del Necromancer de
Diablo 4 como ejemplo: **tres figuras y ninguna más —círculo, rombo y corte a
45°—, y todo con bisel** (luz arriba, sombra abajo). Las capturas de
referencia son de otros artistas y no están en el repositorio: no se copió
ningún dibujo, solo el idioma.

Todo lo que aquí dibuja lo hace en rectángulos agrupados por fila, no píxel a
píxel: el sello de sangre de una vuelta anterior pesaba 85 KB así, y ocho
copias (cuatro paletas por dos caras) no caben en un archivo que se baja al
encender un mundo."""
import random

def _url(svg):
    return 'url("data:image/svg+xml,' + svg.replace("#", "%23").replace("<", "%3C").replace(">", "%3E") + '")'

def _svg(w, h, cuerpo):
    return "<svg xmlns='http://www.w3.org/2000/svg' width='%d' height='%d' viewBox='0 0 %d %d' shape-rendering='crispEdges'>%s</svg>" % (w, h, w, h, cuerpo)

def _celdas(celdas):
    """Cuadritos agrupados en UN camino por color (y opacidad), no un `<rect>`
    cada uno: `M6 0h2v2h-2z` en vez de sesenta caracteres de rectángulo. Con
    rectángulos sueltos el marco pesaba 2,9 KB y va una vez por paleta y por
    cara; así, un tercio."""
    grupos = {}
    for x, y, w, h, col, a in celdas:
        grupos.setdefault((col, a), []).append("M%d %dh%dv%dh-%dz" % (x, y, w, h, w))
    return "".join("<path fill='%s'%s d='%s'/>" % (col, "" if a is None else " fill-opacity='%s'" % a, "".join(d))
                   for (col, a), d in grupos.items())

def marco_bisel(linea, luz, sombra):
    """Marco de 9 trozos (corte 6, rejilla 18 en celdas de 2): la esquina se
    corta a 45° en escalones de píxel, con un filete de hueso por fuera y uno
    de bisel por dentro: luz arriba y a la izquierda, sombra abajo y a la
    derecha."""
    c = []
    def r(x, y, col): c.append((x, y, 2, 2, col, None))
    for x in range(6, 12, 2):
        r(x, 0, linea); r(x, 2, luz); r(x, 16, linea); r(x, 14, sombra)
    for y in range(6, 12, 2):
        r(0, y, linea); r(2, y, luz); r(16, y, linea); r(14, y, sombra)
    # Las cuatro esquinas: diagonal de hueso y, por dentro, el bisel.
    r(4, 0, linea); r(2, 2, linea); r(0, 4, linea); r(4, 2, luz); r(2, 4, luz)          # arriba izq
    r(12, 0, linea); r(14, 2, linea); r(16, 4, linea); r(12, 2, luz); r(14, 4, sombra)  # arriba der
    r(0, 12, linea); r(2, 14, linea); r(4, 16, linea); r(2, 12, luz); r(4, 14, sombra)  # abajo izq
    r(16, 12, linea); r(14, 14, linea); r(12, 16, linea); r(14, 12, sombra); r(12, 14, sombra)  # abajo der
    return _url(_svg(18, 18, _celdas(c)))

def rombo(linea, interior, relleno):
    """La casilla de un icono, en rombo de píxel (rejilla 21): filete de hueso,
    un segundo filete tenue por dentro y el relleno. Como las cuatro casillas
    del Necromancer."""
    caminos = {}
    for y in range(21):
        x = 0
        while x < 21:
            d = abs(x - 10) + abs(y - 10)
            col = linea if d == 10 else interior if d == 7 else relleno if d < 10 else None
            w = 1
            while col and x + w < 21 and (lambda dd: (linea if dd == 10 else interior if dd == 7 else relleno if dd < 10 else None))(abs(x + w - 10) + abs(y - 10)) == col: w += 1
            if col: caminos[col] = caminos.get(col, "") + "M%d %dh%dv1h-%dz" % (x, y, w, w)
            x += w
    return _url(_svg(21, 21, "".join("<path fill='%s' d='%s'/>" % kv for kv in caminos.items())))

def geometria(color, a):
    """El fondo: un sello grande de geometría sagrada —tres círculos, un
    octograma y dos cuadrados cruzados—, muy tenue. Es el dibujo de Quironax y
    del menú de runas: el mismo idioma que el resto (círculo, rombo, 45°)."""
    import math
    c = ["<g fill='none' stroke='%s' stroke-opacity='%s' stroke-width='2'>" % (color, a)]
    for rad in (290, 250, 150): c.append("<circle cx='300' cy='300' r='%d'/>" % rad)
    pts = [(300 + 250 * math.cos(math.radians(22.5 + 45 * k)), 300 + 250 * math.sin(math.radians(22.5 + 45 * k))) for k in range(8)]
    for k in range(8):   # octograma {8/3}
        x1, y1 = pts[k]; x2, y2 = pts[(k + 3) % 8]; c.append("<line x1='%.1f' y1='%.1f' x2='%.1f' y2='%.1f'/>" % (x1, y1, x2, y2))
    c.append("<rect x='194' y='194' width='212' height='212'/><rect x='194' y='194' width='212' height='212' transform='rotate(45 300 300)'/>")
    for k in range(8):   # rombos pequeños en el círculo de fuera
        x = 300 + 290 * math.cos(math.radians(45 * k)); y = 300 + 290 * math.sin(math.radians(45 * k))
        c.append("<path d='M%.1f %.1fl8 8-8 8-8-8z' fill='%s' fill-opacity='%s'/>" % (x, y - 8, color, a))
    c.append("</g>")
    return 'url("data:image/svg+xml,' + ("<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'>" + "".join(c) + "</svg>").replace("#", "%23").replace("<", "%3C").replace(">", "%3E") + '")'

def brasas(c1, c2, semilla=5):
    """Chispas de píxel que suben del suelo: una losa de 300 × 160 que se
    repite a lo ancho, pegada abajo. Pocas y quietas. La opacidad va en tres
    escalones y no continua: así se agrupan en tres caminos por color."""
    r = random.Random(semilla); out = []
    for _ in range(26):
        x, y = r.randrange(0, 300, 2), r.randrange(0, 160, 2)
        col = c1 if r.random() < .6 else c2
        a = (".4", ".6", ".8")[min(2, int(3 * y / 160))]
        out.append((x, y, 2, 2, col, a))
    return _url(_svg(300, 160, _celdas(out)))

def remate(linea, sello):
    """El final de la doble raya de un título: el rombo de sello."""
    c = "<path d='M6 0l6 6-6 6-6-6z' fill='%s'/><path d='M6 3l3 3-3 3-3-3z' fill='%s'/>" % (linea, sello)
    return _url(_svg(12, 12, c))
