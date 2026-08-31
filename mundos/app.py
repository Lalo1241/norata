# -*- coding: utf-8 -*-
"""Traduce un mundo del vocabulario del BORRADOR (`--m-*`) al de la app.

Por qué hace falta un traductor y no se escribe directo: los `--m-*` nacieron
en `mundos/vista.html`, que es una lámina para mirar catorce mundos de golpe y
tiene su propio nombre para cada cosa. La app lleva desde 0.7.37 su propia
familia (`--sup-*`, `--r-*`, `--tipo-*`, `--marco-*`) y es la que leen las
setecientas reglas de `estilos.css`. Con dos vocabularios sueltos, cada mundo
nuevo sería una traducción a mano y la número catorce no se parecería a la
primera.

Sale de aquí `css/mundos.css`, que NO va en `ASSETS` ni en `index.html`: pesa lo
que pesa un mundo —tipografía y texturas— y bajárselo a quien nunca va a
encenderlo es justo lo que la caché de 0.7.38 vino a evitar. Lo pide
`js/10i-apariencia.js` cuando se enciende un mundo, y el service worker lo
guarda solo la primera vez que pasa por ahí."""
import os, re, sys, base64
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import datos as D

def _hex(c):
    c = c.lstrip("#")
    if len(c) == 3: c = "".join(x*2 for x in c)
    return [int(c[i:i+2], 16) for i in (0, 2, 4)]

def mezcla(a, b, t):
    """`a` movido hacia `b` una fracción `t`. Para inventar el tono que un
       mundo no declara —`--card2` y `--faint`— sin sacárselo de la manga."""
    x, y = _hex(a), _hex(b)
    return "#" + "".join("%02x" % round(x[i] + (y[i]-x[i])*t) for i in range(3))

def paradas(valor):
    """Los colores de un degradado, en orden. Un mundo declara su página como
       degradado y la app necesita además el color PLANO de más abajo: `--bg`
       se usa en sitios donde una textura no cabe (bordes, `color-mix`)."""
    return re.findall(r"#[0-9a-fA-F]{3,8}", valor)

def bloque(m):
    t = m["tokens"]
    pag = t["--m-pagina"]
    ps = paradas(pag)
    fondo = ps[-1] if ps else "#000000"      # la parada más honda del degradado
    tarj = t["--m-tarjeta"]
    tps = paradas(tarj)
    tarj_plana = tps[0] if tps else "#000000"
    tinta, tinta2 = t["--m-tinta"], t["--m-tinta-2"]

    v = [
        ("--bg", fondo),
        ("--bg2", mezcla(fondo, tarj_plana, 0.6)),
        ("--card", tarj_plana),
        ("--card2", mezcla(tarj_plana, tinta, 0.08)),
        ("--flotante", tarj_plana),
        # Las superficies, que son lo que de verdad se pinta. La página lleva su
        # degradado Y su grano; la tarjeta, el color plano —un grano repetido en
        # cada tarjeta de una lista se convierte en ruido, y el forro se ve
        # entero en el fondo, que es donde un forro se ve.
        ("--sup-pagina", (t.get("--m-grano","") + ", " if t.get("--m-grano") else "") + pag),
        ("--fondo-pagina", pag),
        ("--sup-panel", mezcla(fondo, tarj_plana, 0.6)),
        ("--sup-tarjeta", tarj),
        ("--sup-tarjeta2", mezcla(tarj_plana, tinta, 0.08)),
        ("--sup-flotante", tarj_plana),
        ("--line", t["--m-borde-color"]),
        ("--carril", t["--m-carril"]),
        ("--borde-tarjeta", t.get("--m-borde", "1px")),
        ("--text", tinta),
        ("--muted", tinta2),
        ("--faint", mezcla(tinta2, tarj_plana, 0.42)),
        ("--mint", t["--m-acento"]),
        ("--mint-macizo", t["--m-acento"]),
        ("--mint-deep", mezcla(t["--m-acento"], fondo, 0.32)),
        ("--mint-soft", t["--m-acento-velo"]),
        ("--aro-alto", t["--m-acento"]),
        ("--fire", t["--m-aviso"]),
        ("--fire-macizo", t["--m-aviso"]),
        ("--fire-soft", t["--m-aviso-velo"]),
        ("--coral", t["--m-peligro"]),
        ("--coral-macizo", t["--m-peligro"]),
        ("--coral-soft", t["--m-peligro-velo"]),
        # Sobre un relleno macizo la tinta es oscura en los dos modos, porque
        # los tres acentos son claros. En un mundo, «lo oscuro» es su fondo.
        ("--sobre-macizo", fondo),
        ("--sobre-acento", fondo),
        # El movimiento. `--dur-*` son tres y salen del mismo número: un mundo
        # declara UN peso, no una tabla de tiempos.
        ("--dur-corta", t.get("--m-dur", ".22s")),
        ("--dur-media", t.get("--m-dur", ".3s")),
        ("--curva", t.get("--m-curva", "ease")),
    ]
    if t.get("--m-marco"):
        v.append(("--marco-tarjeta", t["--m-marco"]))
    if t.get("--m-titulo"):
        v += [("--tipo-titulo", t["--m-titulo"]), ("--tipo-cifra", t.get("--m-cifra", t["--m-titulo"]))]

    # Las esquinas. `--r-factor` mueve el 79% de golpe; lo que el mundo declara
    # aparte —carriles redondos con tarjetas cuadradas— se vuelve a escribir
    # detrás, porque un solo número no puede decir las dos cosas.
    rt = t.get("--m-r-tarjeta", "14px")
    factor = round(float(re.sub(r"[^0-9.]", "", rt)) / 14, 4)
    v.append(("--r-factor", str(factor)))
    if t.get("--m-r-barra"):    v.append(("--r-barra", t["--m-r-barra"]))
    if t.get("--m-r-chip"):     v += [("--r-pastilla", t["--m-r-chip"]), ("--r-boton", t["--m-r-chip"])]
    # La gota —la silueta irregular detrás de un icono— va en porcentajes, así
    # que el factor no la alcanza: un mundo que se cuadra tiene que decirlo.
    if t.get("--m-r-gota"):     v.append(("--r-gota", t["--m-r-gota"]))

    sel = 'html[data-apariencia="%s"]' % m["id"]
    salida = ["/* ---------- %s · %s ---------- */" % (m["nombre"], m["llave"]),
              "/* " + m["premisa"] + " */", sel + " {"]
    salida += ["  %s: %s;" % kv for kv in v]
    salida.append("}")

    # Y la escena, con el mismo trato que un ambiente: se queda de noche en los
    # dos modos, así que su bloque va sin `:not(.claro)`.
    esc = [("--bg", fondo), ("--bg2", mezcla(fondo, tarj_plana, 0.6)),
           ("--card", tarj_plana), ("--card2", mezcla(tarj_plana, tinta, 0.08)),
           ("--sup-pagina", "var(--bg)"), ("--sup-panel", "var(--bg2)"),
           ("--sup-tarjeta", "var(--card)"), ("--sup-tarjeta2", "var(--card2)"),
           ("--line", t["--m-borde-color"]), ("--carril", t["--m-carril"]),
           ("--text", tinta), ("--muted", tinta2), ("--faint", mezcla(tinta2, tarj_plana, 0.42)),
           ("--mint", t["--m-acento"]), ("--mint-macizo", t["--m-acento"]),
           ("--mint-soft", t["--m-acento-velo"]),
           ("--motivo-cielo-1", tarj_plana), ("--motivo-cielo-2", mezcla(fondo, tarj_plana, 0.6)),
           ("--motivo-chispa", tinta),
           ("--motivo-lienzo", mezcla(fondo, tarj_plana, 0.6)),
           # Las curvas del encabezado de Talentos NO salen del color del borde:
           # en un mundo con marco dorado eso son líneas de oro brillante justo
           # detrás del texto. Salen del suelo, apenas por encima del lienzo,
           # que es lo que son: relieve, no dibujo.
           ("--motivo-curva", mezcla(mezcla(fondo, tarj_plana, 0.6), tinta, 0.16)),
           ("--escena-fondo", ", ".join(str(x) for x in _hex(fondo))),
           ("--escena-vidrio", ", ".join(str(x) for x in _hex(tarj_plana))),
           ("--escena-tinta", ", ".join(str(x) for x in _hex(tinta))),
           ("--escena-tinte-modo", "block"), ("--escena-tinte", tarj_plana),
           ("--escena-tinte-fuerza", "1")]
    # ---- El marco, con freno ----
    # Un `border-image` en `--marco-tarjeta` lo hereda TODO lo que dibuje un
    # borde de tarjeta: los paneles, las tarjetas, cada misión de una lista y
    # cada habilidad de un catálogo. Con el latón de Reliquia eso son cuarenta
    # marcos dorados en una pantalla, y Eduardo lo dijo con la frase justa: «se
    # gasta el recurso muy rápido».
    #
    # El marco se queda donde significa algo —el panel y la tarjeta, que son las
    # piezas grandes— y las FILAS de una lista vuelven a un borde liso y apagado.
    # Así el dorado sigue siendo el marco de la vitrina y no el contorno de todo
    # lo que hay dentro.
    if t.get("--m-marco"):
        liso = mezcla(t["--m-borde-color"], tarj_plana, 0.55)
        # La lista salió MEDIDA y no de memoria: se contó qué elementos llevaban
        # `border-image` en las siete pantallas con Reliquia puesta. Los que
        # se repiten son los que sobraban —quince etapas de proyecto, diez
        # tarjetas de habilidad, ocho botones— y los que se quedan son los dos
        # que de verdad enmarcan: el panel y la tarjeta del Resumen. Once
        # marcos en siete pantallas se leen como un marco; cincuenta y tres, no.
        filas = [".ms-card", ".skill-card", ".branch-card", ".pstep", ".cat-item",
                 ".aj-item", ".history-item", ".col-rango-uno", ".amb-m", ".mun-m",
                 ".glass-chip", ".sh-focus", ".btn", ".icon-btn", ".tema-fila",
                 ".seg", ".chip", ".pill"]
        salida += ["",
          "/* El marco solo en las piezas grandes: dentro de una lista vuelve a ser",
          "   un borde liso, o el latón deja de ser un marco y pasa a ser el",
          "   contorno de todo lo que hay dentro. */",
          ",\n".join("%s %s" % (sel, f) for f in filas) + " {",
          "  border-image: none;",
          "  border-width: 1px;",
          "  border-color: %s;" % liso,
          "}"]

    # ---- El techo del peso ----
    # Syne es variable de 600 a 800, y a 800 se ESTIRA: la letra se alarga y
    # descuadra los renglones. La app pide 800 en varios sitios, así que el techo
    # se pone una vez aquí en vez de ir a por cada regla. Lo cazó Eduardo.
    if t.get("--m-peso-max"):
        gordos = ["h1", "h2", "h3", "b", "strong", ".big", ".n", ".num",
                  ".sh-stats .n", ".cel-title", ".scel-num", ".ncel-num",
                  ".ms-count", ".sum-n", ".tree-stats .n"]
        salida += ["",
          "/* El techo del peso de la letra: por encima de esto Syne se estira. */",
          ",\n".join("%s %s" % (sel, g) for g in gordos) + " {",
          "  font-weight: %s;" % t["--m-peso-max"],
          "}"]

    salida += ["", "%s .scene-card,\n%s .celebrate,\n%s .ncel {" % (sel, sel, sel)]
    salida += ["  %s: %s;" % kv for kv in esc]
    salida.append("}")
    return "\n".join(salida) + "\n"
