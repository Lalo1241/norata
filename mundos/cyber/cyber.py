# -*- coding: utf-8 -*-
"""Cyberpunk (0.7.148): lo que `mundos/app.py` mete en `css/mundos.css` en
lugar del bloque genérico. «Visor, no marco».

Sale del MISMO bloque genérico que Blueprint y Reliquia (`bloque()` de
`mundos/app.py`), con los tokens de la lámina (`mundos/datos.py`, id "cyber")
y dos correcciones que salieron del laboratorio:

  - **El acento es cian y no el amarillo ácido de la lámina.** En Norata el
    amarillo es «en curso» y aviso; el magenta se queda de segundo tono (el
    título desdoblado, las marcas del visor y el paquete de datos de la
    racha). El amarillo del icono vive en Voltaje, la quinta, que lo pidió
    Eduardo para que el icono tuviera su paleta.
  - **Cinco paletas y las dos caras**, como todo mundo desde 0.7.147. Aquí no
    se recolorean por anclas (`mundos/recolores/`): el mundo se escribe desde
    cero, así que cada paleta es otro juego de tokens pasado por el mismo
    `bloque()` y se guarda solo lo que cambia (`solo_cambios`).

Lo que no cabe en un token va en `extra()`: el visor (cuatro escuadras, la
regla de marcas y el chaflán, solo en `.panel` y `.sum-card`), el título
desdoblado y la racha de la placa (`js/05d-racha-mundos.js`).

Las muestras de Mi apariencia (`CYBER_PALETAS` de `js/10i-apariencia.js`) se
sacan con `python mundos/cyber/cyber.py`."""
import os, sys, json, base64, re, copy
AQUI = os.path.dirname(os.path.abspath(__file__))
MUNDOS_DIR = os.path.dirname(AQUI)
sys.path.insert(0, MUNDOS_DIR); sys.path.insert(0, os.path.join(MUNDOS_DIR, "recolores"))
import app as A, datos as D
from rc_color import hx, ah, cr, reglas, con_paleta, solo_cambios, var, to_oklch, en_gama

SEL = 'html[data-apariencia="cyber"]'
DIA = 'html.claro[data-apariencia="cyber"]'

def svg_uri(s):
    return "data:image/svg+xml;base64," + base64.b64encode(s.encode()).decode()

def esquinas(a, b):
    """Las cuatro escuadras del visor, en el acento con su marca en el segundo tono."""
    E = {
      "tl": '<path d="M2 24V2h22" stroke="%s"/><path d="M2 12V6M2 2h6" stroke="%s"/>',
      "tr": '<path d="M28 24V2H6" stroke="%s"/><path d="M28 12V6M28 2h-6" stroke="%s"/>',
      "bl": '<path d="M2 2v22h22" stroke="%s"/><path d="M2 14v6M2 24h6" stroke="%s"/>',
    }
    out = {}
    for k, d in E.items():
        out[k] = svg_uri('<svg xmlns="http://www.w3.org/2000/svg" width="30" height="26" viewBox="0 0 30 26"><g fill="none" stroke-width="2" stroke-linecap="square">' + (d % (a, b)) + '</g></svg>')
    return out

def regla_marcas(a):
    """La regla de marcas de arriba: una marca larga cada 5, como la escala de una mira."""
    p = "".join('<path d="M%d 0v%d"/>' % (x, 6 if x % 40 == 0 else 3) for x in range(0, 200, 8))
    return svg_uri('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="6" viewBox="0 0 200 6"><g stroke="%s" stroke-width="1" opacity=".55">%s</g></svg>' % (a, p))

def rgba(h, a):
    r, g, b = (round(v * 255) for v in hx(h)); return "rgba(%d,%d,%d,%s)" % (r, g, b, a)

# ---------- Las paletas: la de partida y cuatro ----------
PALETAS = [
  dict(id="visor", nombre="Visor", idea="Negro de pantalla, datos en cian y el fallo en magenta: la mira de siempre.",
       pagina="#05080d", tarjeta="#0b1119", tinta="#e6f6ff", tinta2="#8ea6b8", acento="#27e2ff", segundo="#ff3d8b"),
  dict(id="acido", nombre="Ácido", idea="Verde de circuito casi negro, acento lima y el segundo en violeta: la placa encendida. De «Midnight Ablaze».",
       pagina="#050a06", tarjeta="#0a130c", tinta="#f1fbe6", tinta2="#9fb391", acento="#b4f23a", segundo="#a472ff"),
  dict(id="cobalto", nombre="Cobalto", idea="Azul de medianoche, acento cobalto y el segundo en rosa: el anuncio visto desde lejos, bajo la lluvia. De «Twilight 5».",
       pagina="#050716", tarjeta="#0b0f26", tinta="#eef0ff", tinta2="#9ea5cf", acento="#7c95ff", segundo="#ff6fb3"),
  # Eduardo trajo «darkworld9» de Lospec (la vela morada): negro, tres
  # morados que suben a violeta eléctrico, lilas y el durazno de la llama.
  dict(id="ultravioleta", nombre="Ultravioleta", idea="Negro morado, acento orquídea y el segundo en el durazno de una llama: la vela en la luz negra. De «darkworld9».",
       pagina="#0a0614", tarjeta="#170a33", tinta="#f6ecff", tinta2="#b99ad9", acento="#d08bf0", segundo="#ffcf85"),
  # La quinta, la que se gana: el amarillo ácido del icono del mundo, con su
  # señal desdoblada en magenta. Lo pidió Eduardo sabiendo que el amarillo es
  # de «en curso»: aquí es luz de letrero, y el estado sigue siendo el suyo.
  dict(id="voltaje", nombre="Voltaje", idea="Negro de asfalto, acento amarillo ácido y el segundo en magenta: el icono del mundo hecho paleta.",
       pagina="#07070a", tarjeta="#121208", tinta="#f7f8e4", tinta2="#a9ab8a", acento="#fcee0a", segundo="#ff2e6e"),
]

def ok(L, C, H): return ah(en_gama(L, C, H))

def hasta(c, fondo, minimo, L0=.62):
    """El tono de `c` con la luz bajada hasta que llega a `minimo` sobre `fondo`."""
    _, C, H = to_oklch(hx(c)); L = L0
    while True:
        x = ok(L, min(C, .2), H)
        if cr(hx(x), hx(fondo)) >= minimo or L < .15: return x
        L -= .01

def dia(p):
    """La cara de día (Eduardo, 30 sep 2026: «modo día para todos»). Una
    pantalla con el brillo subido: papel frío teñido del acento, tarjeta casi
    blanca y tinta casi negra del mismo matiz. El acento se parte en dos como
    en la casa: el vivo RELLENA y su versión honda ESCRIBE (4,5 sobre la
    tarjeta). El segundo tono baja lo justo para dibujar líneas (3)."""
    _, cp, hp = to_oklch(hx(p["tarjeta"])); _, ca, ha = to_oklch(hx(p["acento"]))
    hp = hp if cp > .015 else ha
    d = dict(pagina=ok(.925, .022, ha), tarjeta=ok(.985, .008, ha), tinta=ok(.2, .03, hp))
    d["tinta2"] = hasta(p["tinta2"], d["tarjeta"], 4.8, .5)
    d["acento_tinta"] = hasta(p["acento"], d["tarjeta"], 4.6)
    d["segundo"] = hasta(p["segundo"], d["tarjeta"], 3.2, .7)
    d["borde"] = ok(.86, .03, ha)
    return d

def tokens(p):
    m = copy.deepcopy([x for x in D.MUNDOS if x["id"] == "cyber"][0])
    t = m["tokens"]
    t.update({
      "--m-pagina": p["pagina"],
      # Líneas de barrido del monitor, muy suaves, y un halo del acento arriba.
      "--m-grano": "repeating-linear-gradient(180deg, %s 0 1px, transparent 1px 4px), radial-gradient(ellipse at 80%% 10%%, %s, transparent 55%%), radial-gradient(ellipse at 10%% 90%%, %s, transparent 50%%)"
                   % (rgba(p["acento"], ".035"), rgba(p["acento"], ".10"), rgba(p["segundo"], ".07")),
      "--m-tarjeta": p["tarjeta"],
      "--m-borde-color": A.mezcla(p["tarjeta"], p["acento"], .24),
      "--m-tinta": p["tinta"], "--m-tinta-2": p["tinta2"],
      "--m-acento": p["acento"], "--m-acento-velo": rgba(p["acento"], ".13"),
      # Aviso y peligro, los de Norata: un mundo no cambia con qué se avisa
      "--m-aviso": "#ffcf5a", "--m-aviso-velo": "rgba(255,207,90,.14)",
      "--m-peligro": "#ff7a66", "--m-peligro-velo": "rgba(255,122,102,.15)",
      "--m-carril": rgba(p["acento"], ".14"),
      # Mueve en pasos cortos, como una pantalla que refresca; no en «steps(9)»
      # para todo, que en una ventana que se abre se ve como un tirón.
      "--m-dur": ".16s", "--m-curva": "cubic-bezier(.2,.9,.1,1)",
    })
    m["tokens"] = t
    d = dia(p)
    m["dia"] = {
      "--m-pagina": d["pagina"],
      "--m-grano": "repeating-linear-gradient(180deg, %s 0 1px, transparent 1px 4px), radial-gradient(ellipse at 80%% 10%%, %s, transparent 55%%)"
                   % (rgba(d["acento_tinta"], ".04"), rgba(p["acento"], ".16")),
      "--m-tarjeta": d["tarjeta"], "--m-borde-color": d["borde"],
      "--m-tinta": d["tinta"], "--m-tinta-2": d["tinta2"],
      "--m-acento": p["acento"], "--m-acento-tinta": d["acento_tinta"], "--m-acento-velo": rgba(d["acento_tinta"], ".10"),
      # Aviso y peligro de día: los de la casa, partidos igual que el acento
      "--m-aviso": "#f5c314", "--m-aviso-tinta": "#755c05", "--m-aviso-velo": "rgba(117,92,5,.12)",
      "--m-peligro": "#ff603d", "--m-peligro-tinta": "#bd2200", "--m-peligro-velo": "rgba(189,34,0,.11)",
      "--m-carril": ok(.9, .03, to_oklch(hx(p["acento"]))[2]),
    }
    m["id"] = "cyber"
    return m

def extra(p):
    E = esquinas(p["acento"], p["segundo"])
    a, b = p["acento"], p["segundo"]
    DD = dia(p); ED = esquinas(DD["acento_tinta"], DD["segundo"])
    return "\n".join([
      "/* El VISOR: las piezas grandes no llevan marco cerrado sino cuatro escuadras,",
      "   como una mira, y la esquina de abajo a la derecha va cortada en chaflán.",
      "   Solo en `.panel` y `.sum-card` —las dos piezas grandes—: en cada fila de",
      "   una lista sería el marco de latón de Reliquia otra vez. */",
      "%s .panel, %s .sum-card {" % (SEL, SEL),
      "  --visor-a: %s; --visor-b: %s;" % (a, b),
      "  border-color: transparent;",
      '  background-image: url("%s"), url("%s"), url("%s"), url("%s");' % (E["tl"], E["tr"], E["bl"], regla_marcas(a)),
      "  background-position: left 0 top 0, right 0 top 0, left 0 bottom 0, left 34px top 0;",
      "  background-size: 30px 26px, 30px 26px, 30px 26px, min(200px, calc(100% - 100px)) 6px;",
      "  background-repeat: no-repeat;",
      "  background-color: var(--card);",
      "  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%);",
      "}",
      "/* El filo del chaflán: la diagonal cortada, dibujada, para que se lea como",
      "   corte y no como una esquina que se comió el recorte. */",
      "%s .panel::after, %s .sum-card::after {" % (SEL, SEL),
      '  content: ""; position: absolute; right: 0; bottom: 0; left: auto; width: 20px; height: 20px;',
      "  background: linear-gradient(135deg, transparent calc(50% - 1px), var(--visor-a) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px));",
      "  pointer-events: none;",
      "}",
      "%s .panel, %s .sum-card { position: relative; }" % (SEL, SEL),
      "",
      "/* El título desdoblado: la señal mal sincronizada, un píxel y medio a cada",
      "   lado. Solo en los títulos: en el cuerpo no se lee. */",
      "%s h1, %s h2, %s .page-title {" % (SEL, SEL, SEL),
      "  text-shadow: 1.5px 0 0 %s, -1.5px 0 0 %s;" % (rgba(b, ".75"), rgba(a, ".6")),
      "}",
      "%s h3 { text-shadow: 1px 0 0 %s, -1px 0 0 %s; }" % (SEL, rgba(b, ".55"), rgba(a, ".45")),
      "",
      "/* De día el visor se dibuja con los tonos hondos: el cian vivo sobre papel",
      "   no llega a 3 y las escuadras desaparecían. */",
      "%s .panel, %s .sum-card {" % (DIA, DIA),
      "  --visor-a: %s; --visor-b: %s;" % (DD["acento_tinta"], DD["segundo"]),
      '  background-image: url("%s"), url("%s"), url("%s"), url("%s");' % (ED["tl"], ED["tr"], ED["bl"], regla_marcas(DD["acento_tinta"])),
      "}",
      "%s h1, %s h2, %s .page-title { text-shadow: 1.5px 0 0 %s, -1.5px 0 0 %s; }" % (DIA, DIA, DIA, rgba(DD["segundo"], ".55"), rgba(DD["acento_tinta"], ".45")),
      "%s h3 { text-shadow: 1px 0 0 %s, -1px 0 0 %s; }" % (DIA, rgba(DD["segundo"], ".4"), rgba(DD["acento_tinta"], ".3")),
      "",
      "/* La racha: la placa. El segundo tono es el paquete de datos que corre. */",
      "%s { --cy-b: %s; }" % (SEL, b),
      RACHA.replace("S ", SEL + " "),
    ])

RACHA = """S .cy-pista { fill: none; stroke-width: 2; stroke-linejoin: round; }
S .cy-pista.si { stroke: var(--mint); stroke-dasharray: 1; stroke-dashoffset: 0; animation: trazaDesdeCero 1s ease-out backwards; }
S .cy-pista.no { stroke: rgba(var(--escena-tinta), .26); stroke-dasharray: .012 .02; stroke-width: 1.4; }
S .cy-pista.futuro { stroke: rgba(var(--escena-tinta), .13); stroke-dasharray: .012 .02; stroke-width: 1.2; }
S .cy-paquete { fill: none; stroke: var(--cy-b); stroke-width: 3; stroke-linecap: square; stroke-dasharray: .05 .95; animation: cyPaquete 2.6s linear infinite; }
@keyframes cyPaquete { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
S .cy-pad { fill: var(--bg); stroke: rgba(var(--escena-tinta), .35); stroke-width: 1.2; }
S .cy-pad.si { fill: var(--mint); stroke: none; }
S .cy-pad.hoy { stroke: var(--cy-b); stroke-width: 1.6; }
S .cy-pata { fill: none; stroke: rgba(var(--escena-tinta), .45); stroke-width: 2; }
S .cy-chip { fill: rgb(var(--escena-vidrio)); stroke: rgba(var(--escena-tinta), .45); stroke-width: 1.6; }
S .cy-chip.vivo { stroke: var(--mint); }
S .cy-nucleo { fill: rgba(var(--escena-tinta), .07); stroke: rgba(var(--escena-tinta), .25); stroke-width: 1; }
S .cy-nucleo.vivo { fill: var(--mint); stroke: none; animation: cyEnciende .5s steps(4, end) backwards; }
@keyframes cyEnciende { 0% { fill: rgba(255,255,255,0); } 50% { fill: var(--cy-b); } }
S .cy-cuenta { fill: rgba(var(--escena-tinta), .7); font: 700 11px var(--tipo-cifra, inherit); text-anchor: middle; letter-spacing: .06em; }
S .cy-bus { fill: none; stroke: rgba(var(--escena-tinta), .12); stroke-width: 1.4; }
S .cy-bus.vivo { stroke: var(--mint); opacity: .55; }
S .cy-via { fill: var(--bg); stroke: rgba(var(--escena-tinta), .2); stroke-width: 1.2; }
S .cy-via.vivo { stroke: var(--mint); }
S .cy-linea { animation: cyAparece .3s steps(3, end) backwards; }
S .cy-linea text { text-anchor: end; fill: var(--cy-b); font: 700 11px var(--tipo-titulo, inherit); letter-spacing: .18em; }
S .cy-linea path { stroke: var(--cy-b); stroke-width: 1.4; }
@keyframes cyAparece { from { opacity: 0; } }
S .cy-ficha-pata { fill: none; stroke: rgba(var(--escena-tinta), .4); stroke-width: 1.6; }
S .t-cyber .rt-ficha { stroke-linejoin: miter; }
S .t-cyber .rt-ficha.si { fill: var(--mint); filter: none; }
S .rb.t-cyber { --rb-relleno: var(--mint-macizo); --rb-linea: var(--mint); }
S .fm-suelo-base { fill: var(--bg); }
S .fm-barrido { fill: var(--mint); opacity: .025; }
S .fm-pista { fill: none; stroke: var(--mint); stroke-width: 1.2; opacity: .09; }
S .fm-pista-via { fill: none; stroke: var(--mint); stroke-width: 1; opacity: .12; }
@media (prefers-reduced-motion: reduce) { S .cy-pista.si, S .cy-paquete, S .cy-nucleo.vivo, S .cy-linea { animation: none; } S .cy-paquete { display: none; } }"""

def css_de(p):
    m = tokens(p)
    return A.bloque(m) + "\n" + extra(p) + "\n"

PARES = [("--text", "--card", 4.5), ("--text", "--bg", 4.5), ("--muted", "--card", 4.5), ("--mint", "--card", 4.5), ("--mint", "--bg", 3.0)]

def generar():
    """El CSS de las cinco paletas (la de partida sin atributo) y sus muestras.
    Se niega a seguir si una tinta no llega a su mínimo."""
    base = css_de(PALETAS[0])
    salida = ["/* ================= Cyberpunk · cinco paletas =================\n"
              "   Visor es la de partida y va SIN atributo; las otras cuatro se\n"
              "   encienden con `data-paleta`. Generado por mundos/cyber/cyber.py. */", base]
    R0 = reglas(base, "cyber")
    muestras, malos = {}, []
    for p in PALETAS:
        R = reglas(css_de(p), "cyber")
        assert len(R) == len(R0), (p["id"], len(R), len(R0))
        for sel, body in R:
            if "--text:" in body and "--card:" in body:
                for a, bb, mn in PARES:
                    x, y = var(body, a), var(body, bb)
                    if x and y and cr(x, y) < mn:
                        malos.append("%s %s %s/%s %.2f" % (p["id"], sel[:20], a, bb, cr(x, y)))
        if p is not PALETAS[0]:
            for (sel, b0), (_, b1) in zip(R0, R):
                d = solo_cambios(b0, b1)
                if d: salida.append(con_paleta(sel, "cyber", p["id"]) + " {" + d + "}")
        muestras[p["id"]] = dict(nombre=p["nombre"],
                                 noche=[p["pagina"], p["tarjeta"], p["tinta2"], p["acento"], p["segundo"]],
                                 dia=[dia(p)[k] for k in ("pagina", "tarjeta", "tinta2", "acento_tinta", "segundo")])
    if malos:
        raise SystemExit("cyber: contraste por debajo del mínimo\n  " + "\n  ".join(malos))
    return "\n".join(salida) + "\n", muestras

def css():
    return generar()[0]

if __name__ == "__main__":
    print("const CYBER_PALETAS = " + json.dumps(generar()[1], ensure_ascii=False) + ";")
