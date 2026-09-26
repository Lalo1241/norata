# Medidas de color para las paletas de Averno pixel: contraste WCAG, OKLCh y dE2000.
import math

def hx(h):
    h = h.lstrip("#"); return tuple(int(h[i:i+2], 16) / 255 for i in (0, 2, 4))

def lin(c): return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def lum(h):
    r, g, b = (lin(c) for c in hx(h)); return 0.2126*r + 0.7152*g + 0.0722*b

def cr(a, b):
    la, lb = lum(a), lum(b); return (max(la, lb) + .05) / (min(la, lb) + .05)

def mezcla(a, b, t):
    """a sobre b con opacidad t (en sRGB, como lo compone el navegador)."""
    A, B = hx(a), hx(b)
    return "#" + "".join("%02x" % round(255*(x*t + y*(1-t))) for x, y in zip(A, B))

def oklch(h):
    r, g, b = (lin(c) for c in hx(h))
    l = 0.4122214708*r + 0.5363325363*g + 0.0514459929*b
    m = 0.2119034982*r + 0.6806995451*g + 0.1073969566*b
    s = 0.0883024619*r + 0.2817188376*g + 0.6299787005*b
    l, m, s = (x ** (1/3) for x in (l, m, s))
    L = 0.2104542553*l + 0.7936177850*m - 0.0040720468*s
    A = 1.9779984951*l - 2.4285922050*m + 0.4505937099*s
    B = 0.0259040371*l + 0.7827717662*m - 0.8086757660*s
    return L, math.hypot(A, B), math.degrees(math.atan2(B, A)) % 360

def lab(h):
    r, g, b = (lin(c) for c in hx(h))
    X = (0.4124*r + 0.3576*g + 0.1805*b) / 0.95047
    Y = (0.2126*r + 0.7152*g + 0.0722*b)
    Z = (0.0193*r + 0.1192*g + 0.9505*b) / 1.08883
    f = lambda t: t ** (1/3) if t > 0.008856 else 7.787*t + 16/116
    return 116*f(Y) - 16, 500*(f(X) - f(Y)), 200*(f(Y) - f(Z))

def de(a, b):
    L1, a1, b1 = lab(a); L2, a2, b2 = lab(b)
    C1, C2 = math.hypot(a1, b1), math.hypot(a2, b2); Cm = (C1 + C2) / 2
    G = 0.5 * (1 - math.sqrt(Cm**7 / (Cm**7 + 25**7)))
    a1p, a2p = a1*(1+G), a2*(1+G)
    C1p, C2p = math.hypot(a1p, b1), math.hypot(a2p, b2)
    h1p = math.degrees(math.atan2(b1, a1p)) % 360; h2p = math.degrees(math.atan2(b2, a2p)) % 360
    dL = L2 - L1; dC = C2p - C1p
    dh = h2p - h1p
    if C1p*C2p == 0: dh = 0
    elif dh > 180: dh -= 360
    elif dh < -180: dh += 360
    dH = 2*math.sqrt(C1p*C2p)*math.sin(math.radians(dh/2))
    Lm = (L1 + L2)/2; Cmp = (C1p + C2p)/2
    if C1p*C2p == 0: hm = h1p + h2p
    elif abs(h1p - h2p) <= 180: hm = (h1p + h2p)/2
    else: hm = (h1p + h2p + 360)/2 if h1p + h2p < 360 else (h1p + h2p - 360)/2
    T = 1 - .17*math.cos(math.radians(hm-30)) + .24*math.cos(math.radians(2*hm)) + .32*math.cos(math.radians(3*hm+6)) - .2*math.cos(math.radians(4*hm-63))
    Sl = 1 + .015*(Lm-50)**2/math.sqrt(20+(Lm-50)**2); Sc = 1 + .045*Cmp; Sh = 1 + .015*Cmp*T
    Rt = -2*math.sqrt(Cmp**7/(Cmp**7+25**7))*math.sin(math.radians(60*math.exp(-((hm-275)/25)**2)))
    return math.sqrt((dL/Sl)**2 + (dC/Sc)**2 + (dH/Sh)**2 + Rt*(dC/Sc)*(dH/Sh))
