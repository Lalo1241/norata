# -*- coding: utf-8 -*-
"""Lo de color que usan los recolores de un mundo (anclas.py, reliquia.py):
WCAG, OKLCH/OKLab y el corte de las reglas de un mundo en su CSS."""
import re

def hx(h): h = h.lstrip("#"); return tuple(int(h[i:i+2], 16) / 255 for i in (0, 2, 4))
def ah(c): return "#" + "".join("%02x" % max(0, min(255, round(v * 255))) for v in c)
def lin(c): return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
def gam(c): return 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055
def lum(c): r, g, b = (lin(v) for v in c); return .2126 * r + .7152 * g + .0722 * b
def cr(a, b): la, lb = lum(a), lum(b); return (max(la, lb) + .05) / (min(la, lb) + .05)

def to_oklch(c):
    import math
    r, g, b = (lin(v) for v in c)
    l = .4122214708*r + .5363325363*g + .0514459929*b
    m = .2119034982*r + .6806995451*g + .1073969566*b
    s = .0883024619*r + .2817188376*g + .6299787005*b
    l, m, s = (v ** (1/3) if v >= 0 else -((-v) ** (1/3)) for v in (l, m, s))
    L = .2104542553*l + .7936177850*m - .0040720468*s
    A = 1.9779984951*l - 2.4285922050*m + .4505937099*s
    B = .0259040371*l + .7827717662*m - .8086757660*s
    return L, math.hypot(A, B), math.degrees(math.atan2(B, A)) % 360

def from_oklch(L, C, H):
    import math
    A, B = C * math.cos(math.radians(H)), C * math.sin(math.radians(H))
    l = (L + .3963377774*A + .2158037573*B) ** 3
    m = (L - .1055613458*A - .0638541728*B) ** 3
    s = (L - .0894841775*A - 1.2914855480*B) ** 3
    r = 4.0767416621*l - 3.3077115913*m + .2309699292*s
    g = -1.2684380046*l + 2.6097574011*m - .3413193965*s
    b = -.0041960863*l - .7034186147*m + 1.7076146010*s
    return tuple(max(0, min(1, gam(max(0, v)))) for v in (r, g, b))

def en_gama(L, C, H):
    """Baja el croma hasta que el color existe en sRGB, sin tocar luz ni matiz."""
    import math
    for _ in range(40):
        A, B = C * math.cos(math.radians(H)), C * math.sin(math.radians(H))
        l = (L + .3963377774*A + .2158037573*B) ** 3; m = (L - .1055613458*A - .0638541728*B) ** 3; s = (L - .0894841775*A - 1.2914855480*B) ** 3
        rgb = (4.0767416621*l - 3.3077115913*m + .2309699292*s, -1.2684380046*l + 2.6097574011*m - .3413193965*s, -.0041960863*l - .7034186147*m + 1.7076146010*s)
        if all(-0.001 <= v <= 1.001 for v in rgb): break
        C *= .92
    return from_oklch(L, C, H)

def es_aviso(c):
    """Amarillo (aviso) y coral (peligro): un mundo cambia con qué se celebra,
    no con qué se avisa, así que los recolores no los tocan."""
    L, C, H = to_oklch(c)
    return C > .06 and 15 <= H <= 115

def reglas(texto, mundo):
    """Las reglas de un mundo dentro del CSS que arma mundos/app.py, con el
    selector limpio de los comentarios que el patrón recoge por delante."""
    pat = r'([^{}]*\[data-apariencia="%s"\][^{}]*)\{([^{}]*)\}' % mundo
    return [(re.sub(r"/\*.*?\*/", "", m.group(1), flags=re.S).strip(), m.group(2)) for m in re.finditer(pat, texto)]

def con_paleta(sel, mundo, pid):
    return ",\n".join(s.strip().replace('[data-apariencia="%s"]' % mundo, '[data-apariencia="%s"][data-paleta="%s"]' % (mundo, pid)) for s in sel.split(","))

def var(body, n):
    m = re.search(r'%s:\s*(#[0-9a-fA-F]{6})' % re.escape(n), body)
    return hx(m.group(1)) if m else None

def solo_cambios(antes, despues):
    """De una regla recoloreada, solo las declaraciones que cambiaron. La de
    partida ya pone el resto (letra, tiempos, esquinas, texturas que no
    cambian) y la paleta hereda; copiarlo cinco veces engordaba mundos.css un
    40 %. Una declaración puede ocupar varias líneas: se agrupa hasta el `;`.
    Devuelve '' si nada cambió, y entonces la regla ni se escribe."""
    def decl(t):
        out, cur = [], []
        for l in t.split("\n"):
            if not l.strip(): continue
            cur.append(l)
            if l.rstrip().endswith(";"): out.append("\n".join(cur)); cur = []
        if cur: out.append("\n".join(cur))
        return out
    a, d = decl(antes), decl(despues)
    if len(a) != len(d): return despues
    cambios = [y for x, y in zip(a, d) if x != y]
    return ("\n" + "\n".join(cambios) + "\n") if cambios else ""
