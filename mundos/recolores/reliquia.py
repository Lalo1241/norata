# -*- coding: utf-8 -*-
"""Las paletas de Reliquia (regla de Eduardo: cinco por mundo; Reliquia nació
con una). Mismo motor por anclas que Blueprint (anclas.py), con una cosa
más: el METAL. Reliquia es terciopelo + latón, y el latón es dorado — el
motor lo tomaría por el amarillo de aviso y lo dejaría quieto. Aquí se
separan: once dorados son metal (latón, engaste, el aro de metal) y ése SÍ
cambia con la paleta (oro, oro rosa, plata); el aviso y el peligro no.

Cada paleta cambia tres familias: el forro, el metal y el acento."""
import os, re, json, math
from rc_color import hx, ah, cr, to_oklch, en_gama, es_aviso, reglas, con_paleta, var, solo_cambios
from anclas import lab, de_lab, recolorear, hondo, con_hondo

AVISO = {"#f5d76e", "#755c05", "#f5c314", "#b89100", "#fef3cf", "#ff8a70", "#bd2200", "#ff603d"}
def es_metal(c):
    L, C, H = to_oklch(c)
    return ah(c) not in AVISO and 76 <= H <= 92 and .05 <= C <= .125

METALES = {
    "oro":  lambda L, C, H: (L, C, H),
    "rosa": lambda L, C, H: (L, C * .85, 45),      # oro rosa
    "plata": lambda L, C, H: (L + .04, .012, 255),
}

VIEJAS_N = dict(P="#090612", B2="#161124", C="#1e1930", C2="#231e36", CAR="#332b4a",
                A="#b7a2ea", AD="#9883c9", T="#efeafb", M="#a99fc4", F="#665f7d")
VIEJAS_D = dict(P="#cdc5de", B2="#e4dfef", C="#f4f1fa", C2="#fbf8ff", CAR="#a7a0b6",
                A="#5a2a94", AM="#a278e4", AD="#8459c2", T="#241c33", M="#5c5273", F="#716785")

def mapa(viejas, nuevas, metal):
    VL = [(lab(hx(viejas[k])), lab(hx(nuevas[k]))) for k in viejas if k in nuevas]
    fm = METALES[metal]
    def f(c):
        if es_metal(c): return en_gama(*fm(*to_oklch(c)))
        if es_aviso(c): return c
        x = lab(c); pesos = []
        for v, n in VL:
            d = math.dist(x, v)
            if d < 1e-4: return de_lab(n)
            pesos.append((1 / d ** 3, n))
        t = sum(w for w, _ in pesos)
        return de_lab(tuple(sum(w * n[i] for w, n in pesos) / t for i in range(3)))
    return f

def ok(L, C, H): return ah(en_gama(L, C, H))
def dia_de(n):
    _, cp, hp = to_oklch(hx(n["P"])); _, ca, ha = to_oklch(hx(n["A"]))
    d = dict(P=ok(.84, min(cp * .9, .04), hp), B2=ok(.91, min(cp * .6, .025), hp), C=ok(.96, min(cp * .3, .014), hp),
             C2=ok(.985, min(cp * .2, .01), hp), CAR=ok(.72, min(cp * .7, .035), hp), AM=n["A"],
             T=ok(.25, min(cp * .9, .05), hp), M=ok(.46, min(cp * .9, .055), hp), F=ok(.53, min(cp * .8, .048), hp))
    L = .45
    while True:
        a = ok(L, min(ca * 1.2, .17), ha)
        if cr(hx(a), hx(d["C"])) >= 4.8 or L < .2: break
        L -= .01
    d["A"] = a; d["AD"] = ok(L + .12, min(ca * 1.2, .16), ha)
    return d

PALETAS = {
  "granate": dict(nombre="Granate", metal="rosa", idea="Terciopelo granate, oro rosa y un acento aguamarina, como una piedra de colección.",
    noche=dict(P="#0f0508", B2="#1c0a10", C="#2a1019", C2="#32141f", CAR="#4a2230", A="#7fe0c8", T="#f6eaec", M="#c3a0a8", F="#7d5f66")),
  "lapislazuli": dict(nombre="Lapislázuli", metal="oro", idea="El azul del lapislázuli con sus vetas de oro y el blanco de la perla.",
    noche=dict(P="#050a1a", B2="#0b1430", C="#121e40", C2="#17254b", CAR="#26345e", A="#e8ecf5", T="#eef1fb", M="#9fabc9", F="#5f6a88")),
  "esmeralda": dict(nombre="Esmeralda", metal="oro", idea="Estuche de terciopelo verde botella, marco de oro y rosa cuarzo.",
    noche=dict(P="#041109", B2="#0a1d12", C="#0f2a1b", C2="#133322", CAR="#214833", A="#f4a3ba", T="#eaf5ee", M="#9cb8a7", F="#5f7867")),
  # Se llamó Ébano en la propuesta; Eduardo la quiso «Obsidiana» (30 sep 2026)
  "obsidiana": dict(nombre="Obsidiana", metal="plata", idea="Obsidiana y plata, con un turquesa de piedra fina.",
    noche=dict(P="#070707", B2="#111112", C="#1a1a1c", C2="#202023", CAR="#2f2f33", A="#7fd4e6", T="#f2f2f3", M="#a8a8ad", F="#6b6b70")),
}

def completar(n):
    n = dict(n)
    if "AD" not in n:
        a = lab(hx(n["A"])); c = lab(hx(n["C"]))
        n["AD"] = ah(de_lab(tuple(a[i] * .8 + c[i] * .2 for i in range(3))))
    return n

PARES = [("--text", "--card", 4.5), ("--muted", "--card", 4.5), ("--mint", "--card", 4.5)]
def generar(texto):
    """El CSS de las cuatro paletas nuevas y las muestras de las cinco."""
    R = reglas(texto, "reliquia")
    css = ["/* Paletas de Reliquia en prueba (mundos/recolores/reliquia.py) */\n"]
    mues = {"terciopelo": dict(nombre="Terciopelo", idea="El de siempre: terciopelo lila y latón.",
                               noche=["#090612", "#1e1930", "#8a6d2f", "#b7a2ea", "#c8a24e"], dia=["#cdc5de", "#f4f1fa", "#8a6d2f", "#a278e4", "#8a6d2f"])}
    malos = []
    for pid, P in PALETAS.items():
        n = completar(P["noche"]); d = dia_de(n)
        fn, fd = mapa(VIEJAS_N, n, P["metal"]), mapa(VIEJAS_D, d, P["metal"])
        for sel, body in R:
            f = fd if sel.startswith("html.claro") else fn
            b = recolorear(body, f)
            if f is fn: b = con_hondo(b, n["P"], n["C"])
            if "--text:" in b and "--card:" in b:
                for a, bb, m in PARES:
                    x, y = var(b, a), var(b, bb)
                    if x and y and cr(x, y) < m: malos.append("%s %s %s/%s %.2f" % (pid, "día" if f is fd else "noche", a, bb, cr(x, y)))
            b = solo_cambios(body, b)
            if b: css.append(con_paleta(sel, "reliquia", pid) + " {" + b + "}\n")
        metal = ah(fn(hx("#8a6d2f"))); metal_d = ah(fd(hx("#8a6d2f")))
        # El astrolabio de la racha pinta su latón con --fire (el oro de aviso,
        # que en la casa hace de metal). Dentro de la racha, --fire pasa a ser
        # el metal de la paleta: oro rosa en Granate, plata en Ébano.
        claro = ah(fn(hx("#e0c072")))
        css.append('html[data-apariencia="reliquia"][data-paleta="%s"] :is(.rt.t-reliquia, .rb.t-reliquia) { --fire: %s; --fire-macizo: %s; }\n' % (pid, claro, claro))
        mues[pid] = dict(nombre=P["nombre"], idea=P["idea"], noche=[n["P"], n["C"], metal, n["A"], ah(fn(hx("#c8a24e")))],
                         dia=[d["P"], d["C"], metal_d, d["AM"], metal_d])
    return "".join(css), mues, malos
