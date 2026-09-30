# -*- coding: utf-8 -*-
"""Recolores por ANCLAS, no por giro de matiz.

Eduardo paró el giro (29 sep 2026): «suelen ser muy monocromáticos, no se
salen de una misma línea de color sin colores complementarios». Aquí cada
paleta declara sus papeles —el papel del plano, la cuadrícula, el trazo, la
tinta— y pueden ser de familias distintas y complementarias, como las paletas
de Lospec que trajo de referencia. Cada color del mundo se lleva al nuevo
interpolando en OKLab entre las anclas (Shepard): un color que ES un ancla va
exacto; uno intermedio (los grises del mapa, un velo) cae entre las nuevas
anclas igual que caía entre las viejas. Aviso y peligro no se tocan."""
import os, json, re, math
from rc_color import hx, ah, lum, cr, to_oklch, en_gama, es_aviso, reglas, con_paleta, var, solo_cambios

def lab(c):
    L, C, H = to_oklch(c)
    return (L, C * math.cos(math.radians(H)), C * math.sin(math.radians(H)))
def de_lab(v):
    L, a, b = v
    return en_gama(L, math.hypot(a, b), math.degrees(math.atan2(b, a)) % 360)

def mapa(viejas, nuevas):
    VL = [(lab(hx(k)), lab(hx(nuevas[n]))) for n, k in viejas.items() if n in nuevas]
    def f(c):
        if es_aviso(c): return c
        x = lab(c); pesos = []
        for v, n in VL:
            d = math.dist(x, v)
            if d < 1e-4: return de_lab(n)
            pesos.append((1 / d ** 3, n))
        t = sum(w for w, _ in pesos)
        return de_lab(tuple(sum(w * n[i] for w, n in pesos) / t for i in range(3)))
    return f

def recolorear(texto, f):
    texto = re.sub(r'(#|%23)([0-9a-fA-F]{6})\b', lambda m: m.group(1) + ah(f(hx(m.group(2))))[1:], texto)
    texto = re.sub(r'rgba?\((\d+),\s*(\d+),\s*(\d+)', lambda m: m.group(0).split("(")[0] + "(%d, %d, %d" % tuple(round(v * 255) for v in f(tuple(int(x) / 255 for x in m.groups()))), texto)
    texto = re.sub(r'(--escena-(?:fondo|vidrio|tinta)): (\d+), (\d+), (\d+)', lambda m: m.group(1) + ": %d, %d, %d" % tuple(round(v * 255) for v in f(tuple(int(x) / 255 for x in m.groups()[1:]))), texto)
    return texto

def ok(L, C, H): return ah(en_gama(L, C, H))
def dia_de(n):
    """La cara de día sale de la de noche: papel claro teñido del mismo papel,
    la cuadrícula y el trazo en su tono oscuro, y la tinta casi negra."""
    _, cp, hp = to_oklch(hx(n["P"])); _, cg, hg = to_oklch(hx(n["G"])); _, ca, ha = to_oklch(hx(n["A"]))
    d = dict(P=ok(.925, min(cp * .4, .028), hp), B2=ok(.95, min(cp * .3, .02), hp), C=ok(.972, min(cp * .22, .014), hp),
             C2=ok(.988, min(cp * .12, .008), hp), G=ok(.72, min(cg * .55, .06), hg), GR=ok(.52, min(cg, .12), hg),
             AM=n["A"], T=ok(.25, min(cp * .8, .06), hp), M=ok(.46, min(cp * .6, .05), hp), F=ok(.5, min(cp * .5, .045), hp))
    # El trazo de día tiene que escribirse encima de la tarjeta: 4,5
    L = .5
    while True:
        a = ok(L, min(ca * 1.1, .16), ha)
        if cr(hx(a), hx(d["C"])) >= 4.6 or L < .2: break
        L -= .01
    d["A"] = a
    return d

VIEJAS_NOCHE = dict(P="#0d2b52", B2="#0c1c30", C="#0b1219", C2="#10171e", G="#6ea2d8", GR="#7fb4e8",
                    A="#9fd0ff", AD="#80b0dd", T="#eaf4ff", M="#8fb6db", F="#495f73")
VIEJAS_DIA = dict(P="#e4eaf2", B2="#eef2f7", C="#f4f7fb", C2="#fbfeff", G="#93aac4", GR="#3b6f9e",
                  A="#0c4677", AM="#4c9ade", T="#14294a", M="#54708f", F="#567190")

def completar(n):
    n = dict(n)
    n.setdefault("GR", n["G"])
    if "AD" not in n:
        a, g = lab(hx(n["A"])), lab(hx(n["G"]))
        n["AD"] = ah(de_lab(tuple(a[i] * .7 + g[i] * .3 for i in range(3))))
    return n

PARES = [("--text", "--card", 4.5), ("--text", "--bg", 4.5), ("--muted", "--card", 4.5), ("--mint", "--card", 4.5), ("--mint", "--bg", 3.0)]
def medir(body):
    out = []
    for a, b, m in PARES:
        x, y = var(body, a), var(body, b)
        if x and y: out.append((a, b, round(cr(x, y), 2), m))
    return out

def hondo(P, C, t=.45):
    """El suelo del mapa de talentos, de noche: MÁS OSCURO que la página, entre
    ella y la tarjeta. Eduardo (29 sep 2026): el azul medio de antes se veía
    «plastoso»; lo quiere hondo, y en todas las paletas."""
    a, b = lab(hx(P)), lab(hx(C))
    return ah(de_lab(tuple(a[i] * t + b[i] * (1 - t) for i in range(3))))

def con_hondo(body, P, C):
    return re.sub(r'(--sup-hondo:\s*)#[0-9a-fA-F]{6}', lambda m: m.group(1) + hondo(P, C), body)

def generar(texto, mundo, partida, PALETAS):
    R = reglas(texto, mundo)
    css = ["/* Recolores de %s por anclas (mundos/recolores/anclas.py). La de partida va sin\n   atributo; estas se encienden con data-paleta. */\n" % mundo,
           # :not(#_) solo sube la prioridad: la hoja del mundo llega después y,
           # a igual peso, ganaría la suya.
           'html:not(.claro):not(#_)[data-apariencia="%s"] { --sup-hondo: %s; }\n' %(mundo, hondo(VIEJAS_NOCHE["P"], VIEJAS_NOCHE["C"]))]
    muestras = {partida["id"]: dict(nombre=partida["nombre"], idea=partida["idea"],
                                   noche=[VIEJAS_NOCHE[k] for k in ("P", "C", "M", "A", "G")],
                                   dia=[VIEJAS_DIA[k] for k in ("P", "C", "M", "AM", "GR")])}
    informe = {}
    for pid, P in PALETAS.items():
        n = completar(P["noche"]); d = P.get("dia") or dia_de(n)
        fn, fd = mapa(VIEJAS_NOCHE, n), mapa(VIEJAS_DIA, d)
        for sel, body in R:
            f = fd if sel.startswith("html.claro") else fn
            b = recolorear(body, f)
            if f is fn: b = con_hondo(b, n["P"], n["C"])
            if "--text:" in b and "--card:" in b:
                informe.setdefault(pid, []).extend(("día " if f is fd else "noche ") + "%s/%s %.2f%s" % (a, bb, v, "" if v >= m else " ✗") for a, bb, v, m in medir(b))
            b = solo_cambios(body, b)
            if b: css.append(con_paleta(sel, mundo, pid) + " {" + b + "}\n")
        # Con la misma prioridad que la de partida, o la de partida la pisa
        css.append('html:not(.claro):not(#_)[data-apariencia="%s"][data-paleta="%s"] { --sup-hondo: %s; }\n' % (mundo, pid, hondo(n["P"], n["C"])))
        muestras[pid] = dict(nombre=P["nombre"], idea=P["idea"], noche=[n[k] for k in ("P", "C", "M", "A", "G")],
                             dia=[d[k] for k in ("P", "C", "M", "AM", "GR")])
    return "".join(css), muestras, informe

# ---------- Blueprint: seis propuestas, tres familias cada una ----------
PARTIDA_PLANO = dict(id="cianotipo", nombre="Cian", idea="El plano azul de siempre: la copia al ferroprusiato.")
PLANO = {
    # Eduardo eligió cinco (30 sep 2026): Cianotipo, Crema, Ópalo, Nocturno y
    # Abisal. Ciruela y Espuma se cayeron. Los nombres pasan a ser de
    # arquitectura; los de antes quedan en `antes` por si se prefieren.
    "archivo": dict(nombre="Archivo", antes="Crema", idea="Marino, cuadrícula verde azulado y trazo crema: un plano viejo sacado del archivo. De «Retrotronic DX».",
        noche=dict(P="#2c3350", B2="#232941", C="#191c2d", C2="#1f2336", G="#6fa39a", A="#ecd8b4", T="#f5eee2", M="#bcb6a8", F="#5f6379")),
    "prisma": dict(nombre="Prisma", antes="Ópalo", idea="Índigo, cuadrícula lavanda y trazo aguamarina: la luz partida por un prisma de vidrio. De «Iridescent Crystal».",
        noche=dict(P="#221c42", B2="#1a1534", C="#120f25", C2="#18142f", G="#a58be0", A="#86ead9", T="#f2eeff", M="#bab0dc", F="#5e5687")),
    "acero": dict(nombre="Acero", antes="Nocturno", idea="Pizarra azul, cuadrícula de acero y trazo crema limón, como la luna sobre la estructura. De «Ink».",
        noche=dict(P="#1f2433", B2="#191d2a", C="#12141e", C2="#171a26", G="#6d7694", A="#e9f0c6", T="#eef0f5", M="#a5adbf", F="#575e72")),
    "laser": dict(nombre="Láser", antes="Abisal", idea="Azul de pantalla, cuadrícula cian y trazo verde encendido: el plano cortado con láser. De «ML15» y «Aquaverse».",
        noche=dict(P="#08203a", B2="#06182c", C="#04111e", C2="#081727", G="#2a8cc4", A="#7fe69a", T="#e6fff7", M="#8fc5c2", F="#3f5d69")),
}

