# -*- coding: utf-8 -*-
"""Catedral, el mundo gótico de píxel: lo que `mundos/app.py` mete en
`css/mundos.css` en lugar del bloque genérico.

**Se llamó Averno hasta la 0.7.141.** Se publicó con ese nombre en la 0.7.136,
y al rehacer Averno en hueso y sangre Eduardo pidió no perder este: se quedó
como tema aparte con el nombre que siempre le correspondió, porque es una
catedral —vitral, rosetón, sillares, la letra de los libros de coro— y no un
infierno. El nombre `averno` pasó al tema nuevo (`mundos/averno/`). Quien ya
llevaba éste puesto no pierde nada: el script de arriba de `index.html` mueve
lo guardado de un nombre al otro una sola vez.

Y al separarlo se le quitó lo que era de CASTILLO y no de iglesia (Eduardo,
0.7.141): los escudos del menú pasaron a cuadrifolios —la tracería de cuatro
lóbulos de las ventanas góticas—, los remaches de los nodos a trifolios, y
dos paletas cambiaron de nombre: Hueso a Alabastro y Hierro a Bronce. Y al
verlo puesto Eduardo cambió tres cosas más: la letra de los títulos pasó de la
gótica a Pixelify, el menú de cuadrifolios («un desastre») a losas, y el arco
apuntado de los paneles («parece una casa») a herrajes en las esquinas.

Por qué no sale de `datos.py`: trae CUATRO paletas y no una, y un material que
el vocabulario `--m-*` no alcanza a decir. Es el mismo camino que abrió Arcade:
el material se escribe a mano en CSS y los colores se generan desde una tabla
medida. `datos.py` conserva su entrada solo para la lámina y la muestra.

Aquí:
  - `paletas.py`   las cuatro paletas, en sus dos caras (la fuente de verdad);
  - `material.css` el material, escrito a mano;
  - `medir.py`     las medidas de contraste; se corre al tocar un tono.
"""
import os, importlib.util
AQUI = os.path.dirname(os.path.abspath(__file__))
# Por su ruta y con nombre propio, no con `import paletas`: Averno tiene su
# propio `paletas.py` y `mundos/app.py` construye los dos en el mismo proceso;
# Python guarda los módulos por nombre y el segundo se quedaba las del primero.
_spec = importlib.util.spec_from_file_location("catedral_paletas", os.path.join(AQUI, "paletas.py"))
_pal = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(_pal)
PALETAS = _pal.PALETAS

DE_PARTIDA = "vitral"

def _hex(c):
    c = c.lstrip("#"); return [int(c[i:i+2], 16) for i in (0, 2, 4)]

def rgba(h, a):
    return "rgba(%d,%d,%d,%s)" % tuple(_hex(h) + [a])

def mix(a, b, t):
    """`a` con una fracción `t` de sí mismo sobre `b`."""
    A, B = _hex(a), _hex(b)
    return "#" + "".join("%02x" % round(x*t + y*(1-t)) for x, y in zip(A, B))

def vars_cara(c, dia):
    """El vocabulario de la app para una cara de una paleta. `--celeste` es el
    SEGUNDO TONO: es el sitio que la casa ya tenía para «mirar, informar», y
    Catedral le da el mismo oficio (los botones de consultar, el flujo del
    mapa, los trifolios de los nodos)."""
    return {
      "--bg": c["bg"], "--bg2": c["bg2"], "--card": c["card"], "--card2": c["card2"], "--flotante": c["card"],
      # Los vidrios que flotan (la barra lateral de la PC, los menús). Ningún
      # mundo los declaraba y se quedaban en el azul de la casa: con el gótico
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
      # El adorno de los nodos del mapa (lo dibuja `adornoNodo` en
      # js/07-lienzo.js): el filete de plomo por dentro de la figura y un
      # TRIFOLIO en cada vértice, en el segundo tono hundido de noche. Hasta la
      # 0.7.141 eran remaches, y un remache es de fortaleza.
      "--nodo-adorno": "catedral",
      "--nodo-adorno-metal": c["hierro"] if dia else mix(c["segundoM"], c["bg"], .55),
      # El plomo y los paños del vidrio (el «+» fue un rosetón hecho con ellos
      # hasta la 0.7.141; hoy es una losa roja):
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
    out = ["/* ================= Catedral · las cuatro paletas =================\n"
           "   Vitral es la de partida y va SIN atributo: es lo que se ve si nadie\n"
           "   eligió nada, y lo que ve quien llevaba el gótico de antes. Las otras\n"
           "   tres se encienden con `data-paleta` en <html> (el script de arriba de\n"
           "   `index.html` lo pone antes de pintar, igual que la apariencia).\n"
           "   Generado por mundos/catedral/catedral.py desde paletas.py. */\n"]
    for pid, p in PALETAS.items():
        cond = "" if pid == DE_PARTIDA else '[data-paleta="%s"]' % pid
        n, d = p["noche"], p["dia"]
        out.append(_bloque('html:not(.claro)[data-apariencia="catedral"]%s' % cond, vars_cara(n, False)))
        out.append(_bloque('html.claro[data-apariencia="catedral"]%s' % cond, vars_cara(d, True)))
        # La escena (racha, fiestas) se queda de noche en los dos modos, como en
        # la casa: es un dibujo, no interfaz.
        esc = dict(vars_cara(n, False))
        esc.update({"--sup-pagina": "var(--bg)", "--sup-panel": "var(--bg2)", "--sup-tarjeta": "var(--card)",
                    "--sup-tarjeta2": "var(--card2)",
                    "--motivo-cielo-1": n["card"], "--motivo-cielo-2": n["bg2"], "--motivo-chispa": n["text"],
                    "--motivo-lienzo": n["bg2"], "--motivo-curva": n["line"],
                    "--escena-fondo": _rgb(n["bg"]), "--escena-vidrio": _rgb(n["card"]), "--escena-tinta": _rgb(n["text"]),
                    "--escena-tinte": n["card"]})
        out.append(_bloque('html[data-apariencia="catedral"]%s :is(.scene-card, .celebrate, .ncel, .scel)' % cond, esc))
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
