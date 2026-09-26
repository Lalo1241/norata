# -*- coding: utf-8 -*-
"""Averno, el mundo gótico de píxel (0.7.136): lo que `mundos/app.py` mete en
`css/mundos.css` en lugar del bloque genérico.

Por qué no sale de `datos.py` como los otros dos mundos: Averno dejó de caber en
el vocabulario `--m-*`. Trae CUATRO paletas y no una, y un material (sillar,
hierro, tramado, escudos, el rosetón) que ningún otro mundo declara. Es el mismo
camino que ya abrió Arcade (`mundos/arcade/arcade.css`): el material se escribe
a mano en CSS y los colores se generan desde una tabla medida.

`datos.py` conserva la entrada de Averno solo para la lámina y para la muestra
del catálogo, con los tonos de Vitral.

Aquí:
  - `paletas.py`  las cuatro paletas, en sus dos caras (la fuente de verdad);
  - `material.css` el material, escrito a mano;
  - `medir.py`    las medidas de contraste; se corre al tocar un tono.
"""
import os, sys
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
from paletas import PALETAS

DE_PARTIDA = "vitral"

def _hex(c):
    c = c.lstrip("#"); return [int(c[i:i+2], 16) for i in (0, 2, 4)]

def rgba(h, a):
    return "rgba(%d,%d,%d,%s)" % tuple(_hex(h) + [a])

def mix(a, b, t):
    """`a` con una fracción `t` de sí mismo sobre `b`."""
    A, B = _hex(a), _hex(b)
    return "#" + "".join("%02x" % round(x*t + y*(1-t)) for x, y in zip(A, B))

def _svg(cuerpo, vb):
    s = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='%s' preserveAspectRatio='none' shape-rendering='crispEdges'>%s</svg>" % (vb, cuerpo)
    return 'url("data:image/svg+xml,' + s.replace("#", "%23").replace("<", "%3C").replace(">", "%3E") + '")'

# El escudo de los botones del menú en el teléfono: cabeza recta y punta
# REDONDA, el escudo español. Hubo dos antes: la ojiva, que en fila parecía un
# cementerio («no deben parecer lápidas», Eduardo), y un escudo francés de
# punta afilada que pidió «más romano, no tan de punta hacia abajo».
ESCUDO = [
    "####################", "####################", "####################", "####################",
    "####################", "####################", "####################", "####################",
    "####################", "####################", "####################", ".##################.",
    ".##################.", ".##################.", "..################..", "..################..",
    "...##############...", "....############....", "......########......", "........####........"]

def mascara(filas):
    out = ""
    for y, f in enumerate(filas):
        x = 0
        while x < len(f):
            if f[x] != "#": x += 1; continue
            w = 1
            while x + w < len(f) and f[x + w] == "#": w += 1
            out += "<rect x='%d' y='%d' width='%d' height='1'/>" % (x, y, w); x += w
    return _svg(out, "0 0 %d %d" % (len(filas[0]), len(filas)))

def vars_cara(c, dia):
    """El vocabulario de la app para una cara de una paleta. `--celeste` es el
    SEGUNDO TONO: es el sitio que la casa ya tenía para «mirar, informar», y
    Averno le da el mismo oficio (los botones de consultar, el flujo del
    mapa, los remaches)."""
    return {
      "--bg": c["bg"], "--bg2": c["bg2"], "--card": c["card"], "--card2": c["card2"], "--flotante": c["card"],
      # Los vidrios que flotan (la barra lateral de la PC, los menús). Ningún
      # mundo los declaraba y se quedaban en el azul de la casa: con Averno
      # puesto, la barra de la PC salía en `rgba(21, 27, 37, .72)`.
      "--flotante-macizo": rgba(c["card"], ".97"), "--flotante-lateral": rgba(c["bg2"], ".84" if dia else ".72"),
      "--sup-panel": c["bg2"], "--sup-tarjeta2": c["card2"], "--sup-flotante": c["card"],
      "--line": c["line"], "--carril": c["carril"], "--borde-tarjeta": "2px",
      "--text": c["text"], "--muted": c["muted"], "--faint": c["faint"],
      # El velo del acento es más ligero que en la casa (9 % y no 14 %): con el
      # rojo encima de su propio velo rojo, un botón suave se quedaba en 4,27.
      "--mint": c["acento"], "--mint-macizo": c["acentoM"], "--mint-deep": mix(c["acentoM"], "#000000", .8),
      "--mint-soft": rgba(c["acento"], ".07" if dia else ".09"), "--aro-alto": c["acento"] if dia else c["acentoM"],
      "--fire": c["aviso"], "--fire-macizo": c["avisoM"], "--fire-soft": rgba(c["aviso"], ".12" if dia else ".14"),
      "--coral": c["peligro"], "--coral-macizo": c["peligroM"], "--coral-soft": rgba(c["peligro"], ".11" if dia else ".10"),
      "--celeste": c["segundo"], "--celeste-soft": rgba(c["segundo"], ".10" if dia else ".12"), "--aro-medio": c["segundo"],
      "--sobre-macizo": c["sobre"], "--sobre-acento": c["sobre"], "--sobre-vivo": c["sobre"],
      "--fondo-raiz": c["bg"],
      "--orbe-1": "transparent", "--orbe-2": "transparent", "--orbe-3": "transparent",
      "--lienzo-apagado": mix(c["muted"], c["hondo"], .45), "--lienzo-hilo": c["line"], "--lienzo-rotulo": c["muted"],
      "--lienzo-ficha": c["card"], "--lienzo-caja": c["bg2"], "--lienzo-bloqueado": c["bg2"], "--lienzo-candado": c["line"],
      "--lienzo-flujo": c["segundo"] if dia else c["segundoM"], "--lienzo-punto": rgba(c["text"], ".12" if dia else ".10"),
      "--lienzo-suelo": c["hondo"], "--sup-hondo": c["hondo"], "--borde-panel": c["line"],
      # Las piezas propias del material:
      "--av-hierro": c["hierro"], "--av-piedra": c["piedra"],
      "--av-remache": c["hierro"] if dia else rgba(c["segundoM"], ".55"),
      # El rosetón del «+» se dibuja en CSS con estos tres (ver material.css):
      # el plomo es el suelo de noche y el hierro de día; los paños, el segundo
      # tono y el rojo hundido.
      "--av-plomo": c["hierro"] if dia else c["bg"],
      "--av-pano-1": c["segundoM"], "--av-pano-2": mix(c["acentoM"], c["bg"], .6),
      "--av-marco": mix(c["hierro"], "#000000", .8) if dia else c["hierro"],
      "--av-bruma": rgba(c["text"], ".035") if dia else rgba(c["segundoM"], ".07"),
      "--av-bruma2": rgba(c["text"], ".018") if dia else rgba(c["segundoM"], ".035"),
      "--av-letra-sombra": "transparent" if dia else mix(c["acentoM"], c["bg"], .35),
    }

def _rgb(h):
    return "%d, %d, %d" % tuple(_hex(h))

def _bloque(sel, v):
    return sel + " {\n" + "".join("  %s: %s;\n" % kv for kv in v.items()) + "}\n"

def css():
    """Los colores de las cuatro paletas y el material, listos para mundos.css."""
    out = ["/* ================= Averno · las cuatro paletas =================\n"
           "   Vitral es la de partida y va SIN atributo: es lo que se ve si nadie\n"
           "   eligió nada, y lo que ve quien llevaba el Averno de antes. Las otras\n"
           "   tres se encienden con `data-paleta` en <html> (el script de arriba de\n"
           "   `index.html` lo pone antes de pintar, igual que la apariencia).\n"
           "   Generado por mundos/averno/averno.py desde paletas.py. */\n"]
    for pid, p in PALETAS.items():
        cond = "" if pid == DE_PARTIDA else '[data-paleta="%s"]' % pid
        n, d = p["noche"], p["dia"]
        out.append(_bloque('html:not(.claro)[data-apariencia="averno"]%s' % cond, vars_cara(n, False)))
        out.append(_bloque('html.claro[data-apariencia="averno"]%s' % cond, vars_cara(d, True)))
        # La escena (racha, fiestas) se queda de noche en los dos modos, como en
        # la casa: es un dibujo, no interfaz.
        esc = dict(vars_cara(n, False))
        esc.update({"--sup-pagina": "var(--bg)", "--sup-panel": "var(--bg2)", "--sup-tarjeta": "var(--card)",
                    "--sup-tarjeta2": "var(--card2)",
                    "--motivo-cielo-1": n["card"], "--motivo-cielo-2": n["bg2"], "--motivo-chispa": n["text"],
                    "--motivo-lienzo": n["bg2"], "--motivo-curva": n["line"],
                    "--escena-fondo": _rgb(n["bg"]), "--escena-vidrio": _rgb(n["card"]), "--escena-tinta": _rgb(n["text"]),
                    "--escena-tinte": n["card"]})
        out.append(_bloque('html[data-apariencia="averno"]%s :is(.scene-card, .celebrate, .ncel, .scel)' % cond, esc))
    out.append('html[data-apariencia="averno"] { --av-forma: %s; }\n' % mascara(ESCUDO))
    out.append(open(os.path.join(AQUI, "material.css"), encoding="utf-8").read())
    return "\n".join(out)

def muestras_js():
    """Las muestras de Mi apariencia, para pegar en `js/10i-apariencia.js`:
    suelo, tarjeta, marco, rojo y segundo tono de cada cara."""
    import json
    t = {}
    for pid, p in PALETAS.items():
        t[pid] = {"nombre": p["nombre"], **{cara: [p[cara][k] for k in ("bg", "card", "hierro", "acentoM", "segundoM")] for cara in ("noche", "dia")}}
    return json.dumps(t, ensure_ascii=False)

if __name__ == "__main__":
    print(muestras_js())
