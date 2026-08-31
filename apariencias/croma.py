# -*- coding: utf-8 -*-
"""Subir el CROMA de los suelos de noche sin mover la LUZ.

Por qué existe. Medido en OKLCh, los suelos de noche de la mitad de los
ambientes tenían MENOS color que el carbón de la casa: Musgo 0,0168 y Adobe
0,0114 contra los 0,0180 del azul de casa. Por eso «no cambiaba nada» en la
pantalla de una computadora, donde el fondo es lo que más superficie ocupa: no
es que el ambiente no llegara, es que el ambiente era más gris que lo que
sustituía.

Se sube el croma y NO la luz, y ese es todo el truco: el contraste de la app se
calcula con la luminancia, así que dejando la L quieta los treinta y dos
contrastes ya aprobados siguen valiendo. Aun así se vuelven a medir después —
la luminancia relativa de WCAG no es exactamente la L de OKLab y se mueve un
pelo al cargar color.

Tinta no se toca: es un monocromo elegido, y darle color sería convertirlo en
otro ambiente."""
import math

def _srgb(h):
    h = h.lstrip("#")
    return [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]

def _lin(u): return u / 12.92 if u <= 0.04045 else ((u + 0.055) / 1.055) ** 2.4
def _gam(u): return 12.92 * u if u <= 0.0031308 else 1.055 * (u ** (1 / 2.4)) - 0.055

def a_oklch(hexa):
    r, g, b = [_lin(x) for x in _srgb(hexa)]
    l = (0.4122214708*r + 0.5363325363*g + 0.0514459929*b) ** (1/3)
    m = (0.2119034982*r + 0.6806995451*g + 0.1073969566*b) ** (1/3)
    s = (0.0883024619*r + 0.2817188376*g + 0.6299787005*b) ** (1/3)
    L = 0.2104542553*l + 0.7936177850*m - 0.0040720468*s
    A = 1.9779984951*l - 2.4285922050*m + 0.4505937099*s
    B = 0.0259040371*l + 0.7827717662*m - 0.8086757660*s
    return L, math.hypot(A, B), math.degrees(math.atan2(B, A)) % 360

def a_hex(L, C, h):
    A = C * math.cos(math.radians(h)); B = C * math.sin(math.radians(h))
    l = (L + 0.3963377774*A + 0.2158037573*B) ** 3
    m = (L - 0.1055613458*A - 0.0638541728*B) ** 3
    s = (L - 0.0894841775*A - 1.2914855480*B) ** 3
    r = +4.0767416621*l - 3.3077115913*m + 0.2309699292*s
    g = -1.2684380046*l + 2.6097574011*m - 0.3413193965*s
    b = -0.0041960863*l - 0.7034186147*m + 1.7076147010*s
    return "#" + "".join("%02x" % max(0, min(255, round(_gam(max(0.0, min(1.0, c))) * 255)))
                         for c in (r, g, b))

def con_croma(hexa, croma):
    """El mismo color con otro croma. La luz y el matiz no se tocan."""
    L, _, h = a_oklch(hexa)
    return a_hex(L, croma, h)

# El objetivo por llave. Sale de Duna, que es el único que Eduardo dijo que sí
# se distingue: se toma su perfil de croma como el suelo de «esto se ve».
OBJETIVO = {"--bg": 0.032, "--bg2": 0.037, "--card": 0.055, "--card2": 0.056,
            "--line": 0.045, "--carril": 0.045}

def subir(noche, salta=False):
    """Devuelve el dict de noche con los suelos cargados de color."""
    if salta: return dict(noche)
    fuera = dict(noche)
    for k, obj in OBJETIVO.items():
        if k not in fuera: continue
        L, C, h = a_oklch(fuera[k])
        if C >= obj: continue          # el que ya llega no se toca
        fuera[k] = con_croma(fuera[k], obj)
    return fuera
