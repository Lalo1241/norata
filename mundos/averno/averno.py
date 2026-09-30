# -*- coding: utf-8 -*-
"""Averno, hueso y sangre (0.7.141): lo que `mundos/app.py` mete en
`css/mundos.css` en lugar del bloque genérico.

**Es el segundo Averno en píxel, y el primero ya no se llama así.** El de la
0.7.136 era una catedral gótica —vitral, rosetón, sillares— y Eduardo, al
pedirlo «más oscuro, más demoníaco», quiso quedarse con los dos: ése pasó a
llamarse Catedral (`mundos/catedral/`) y el nombre de Averno se lo quedó éste,
que es por fin un infierno. Quien llevaba el gótico puesto sigue en el gótico:
el script de arriba de `index.html` le mueve lo guardado al nombre nuevo.

La regla que ordena el mundo, y la que hay que sostener al tocar cualquier
cosa: **tres figuras y ninguna más —círculo, rombo y corte a 45°—, y todo con
bisel** (luz arriba, sombra abajo). Hueso para dibujar, sangre para lo
elegido, negro para todo lo demás. Salió de la barra del Necromancer de
Diablo 4, que fue la referencia que la ordenó: la vuelta anterior mezclaba
escuadras, chevrones, manchas de sangre y círculos, y «hay cosas que no
coinciden».

Aquí:
  - `paletas.py`   las cuatro paletas propias (Sangre, Cocito, Ponzoña y
                   Tormento), en sus dos caras;
  - `piezas.py`    las piezas de píxel, horneadas por paleta y por cara;
  - `material.css` el material, escrito a mano.

El vocabulario de la app para cada cara (`vars_cara`) se toma de Catedral y no
se copia: los dos mundos hablan el mismo idioma de variables, y lo que cambia
son las piezas.
"""
import os, importlib.util
AQUI = os.path.dirname(os.path.abspath(__file__))

def _cargar(nombre, ruta):
    """Por su ruta y con nombre propio, NO con `import paletas`: Catedral tiene
    su propio `paletas.py`, `mundos/app.py` construye los dos mundos en el
    mismo proceso, y Python guarda los módulos por nombre — el segundo
    `import paletas` devolvía las paletas del primero sin avisar."""
    spec = importlib.util.spec_from_file_location(nombre, ruta)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return m

PALETAS = _cargar("averno_paletas", os.path.join(AQUI, "paletas.py")).PALETAS
P = _cargar("averno_piezas", os.path.join(AQUI, "piezas.py"))
CT = _cargar("averno_catedral", os.path.join(os.path.dirname(AQUI), "catedral", "catedral.py"))
cr = _cargar("averno_color", os.path.join(AQUI, "color.py")).cr

DE_PARTIDA = "sangre"
mix, _hex = CT.mix, CT._hex

def hasta(a, b, fondo, meta):
    """El primer tono entre `b` y `a` que llega a `meta` sobre `fondo`. Es lo
    que decide el HUESO de cada cara: el trazo más apagado que todavía se lee
    como línea (3 sobre 1) encima de la tarjeta."""
    for i in range(101):
        c = mix(a, b, i / 100)
        if cr(c, fondo) >= meta: return c
    return a

def piezas_cara(c, dia):
    """Las piezas propias, con los tonos de una cara. De día no hay brasas ni
    luz de abajo: sobre papel un resplandor es una mancha (la regla de
    CLAUDE.md, «de día no hay resplandor»)."""
    h = hasta(c["text"], c["card"], c["card"], 3.1)
    return {
      "--av-hueso": h, "--av-brasa": "transparent" if dia else c["brasa"],
      "--av-marco-bisel": P.marco_bisel(h, "#ffffff" if dia else mix(c["text"], c["card"], .3), mix(c["line"], "#000000", .7) if dia else mix(c["bg"], "#000000", .5)),
      "--av-marco-bisel-sangre": P.marco_bisel(c["acento"] if dia else c["acentoM"], mix(c["acentoM"], "#ffffff", .5), mix(c["acento"], "#000000", .6)),
      # El mismo marco en ORO, para lo que avisa (el botón de actualizar de la
      # barra de la PC): con el marco de hueso dejaba de decir «aviso», y con su
      # borde dorado de la casa la esquina a 45° se lo comía (0.7.143.6).
      "--av-marco-bisel-oro": P.marco_bisel(c["aviso"], mix(c["avisoM"], "#ffffff", .5), mix(c["aviso"], "#000000", .6)),
      "--av-rombo": P.rombo(h, mix(h, c["card"], .45) if dia else mix(c["text"], c["card"], .2), c["card2"]),
      "--av-brasas": "none" if dia else P.brasas(c["acentoM"], c["aviso"]),
      "--av-remate": P.remate(h, c["acento"] if dia else c["acentoM"]),
      "--mint-deep": mix(c["acentoM"], "#000000", .75),
      # El adorno de los nodos del mapa (`adornoNodo`, js/07-lienzo.js): un
      # rombo de hueso en cada vértice y un filete fino por fuera, el sello del
      # fondo en pequeño. La silueta no se toca: es la regla de Reliquia.
      "--nodo-adorno": "averno", "--nodo-adorno-metal": h,
    }

def _bloque(sel, v):
    return sel + " {\n" + "".join("  %s: %s;\n" % kv for kv in v.items()) + "}\n"

def css():
    """Los colores de las cuatro paletas y el material, listos para mundos.css."""
    out = ["/* ================= Averno · las cuatro paletas =================\n"
           "   Sangre es la de partida y va SIN atributo; las otras tres se\n"
           "   encienden con `data-paleta` en <html>, que pone el script de arriba\n"
           "   de `index.html` antes de pintar. Generado por mundos/averno/averno.py\n"
           "   desde paletas.py y piezas.py. */\n"]
    for pid, p in PALETAS.items():
        cond = "" if pid == DE_PARTIDA else '[data-paleta="%s"]' % pid
        for cara, dia in (("noche", False), ("dia", True)):
            c = p[cara]
            v = CT.vars_cara(c, dia); v.update(piezas_cara(c, dia))
            # Lo de Catedral que aquí no se dibuja no viaja: el arco de sus
            # paneles son unos cientos de bytes por cara que nadie leería.
            v.pop("--av-arco", None)
            sel = 'html%s[data-apariencia="averno"]%s' % (".claro" if dia else ":not(.claro)", cond)
            out.append(_bloque(sel, v))
        # La escena (racha, fiestas) se queda de noche en los dos modos.
        n = p["noche"]
        # Sin las piezas grandes: una escena no lleva marcos ni iconos en rombo,
        # y cada una son kilobytes que irían por triplicado (noche, día y
        # escena). Lo que sí lee —el hueso, la brasa, el remate— va.
        esc = dict(CT.vars_cara(n, False)); esc.pop("--av-arco", None)
        pz = piezas_cara(n, False)
        esc.update({k: pz[k] for k in ("--av-hueso", "--av-brasa", "--av-remate", "--mint-deep")})
        esc.update({"--sup-pagina": "var(--bg)", "--sup-panel": "var(--bg2)", "--sup-tarjeta": "var(--card)",
                    "--sup-tarjeta2": "var(--card2)",
                    "--motivo-cielo-1": n["card"], "--motivo-cielo-2": n["bg2"], "--motivo-chispa": n["text"],
                    "--motivo-lienzo": n["bg2"], "--motivo-curva": n["line"],
                    "--escena-fondo": CT._rgb(n["bg"]), "--escena-vidrio": CT._rgb(n["card"]), "--escena-tinta": CT._rgb(n["text"]),
                    "--escena-tinte": n["card"]})
        out.append(_bloque('html[data-apariencia="averno"]%s :is(.scene-card, .celebrate, .ncel, .scel)' % cond, esc))
    # El sello del fondo es UNO para las cuatro paletas, en blanco de noche y
    # en negro de día: al 6 % la diferencia entre el blanco y el tono de texto
    # de cada paleta no se ve, y ocho copias pesaban 18 KB.
    out.append('html:not(.claro)[data-apariencia="averno"] { --av-geometria: %s; }\n' % P.geometria("#ffffff", ".06"))
    out.append('html.claro[data-apariencia="averno"] { --av-geometria: %s; }\n' % P.geometria("#000000", ".06"))
    out.append(open(os.path.join(AQUI, "material.css"), encoding="utf-8").read())
    return "\n".join(out)

def muestras_js():
    """Las muestras de Mi apariencia, para pegar en `js/10i-apariencia.js`:
    suelo, tarjeta, marco, rojo y segundo tono de cada cara. El marco es el
    HUESO y no el hierro: en Averno lo que enmarca es hueso."""
    import json
    t = {}
    for pid, p in PALETAS.items():
        t[pid] = {"nombre": p["nombre"]}
        for cara in ("noche", "dia"):
            c = p[cara]
            t[pid][cara] = [c["bg"], c["card"], hasta(c["text"], c["card"], c["card"], 3.1), c["acentoM"], c["segundoM"]]
    return json.dumps(t, ensure_ascii=False)

if __name__ == "__main__":
    print(muestras_js())
