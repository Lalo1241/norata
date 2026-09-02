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
import os, re, sys, base64, hashlib
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

# Las piezas que llevan aro de metal. Son las GRANDES y nada más: el panel, la
# tarjeta del Resumen y la de escena —que es la misma pieza que los cuatro
# encabezados de módulo y la de la racha—. Dentro de una lista el marco vuelve
# a ser un borde liso; el porqué está abajo, en el freno de las filas.
PIEZAS_CON_ARO = (".panel", ".sum-card", ".scene-card")

def _rgba(hexa, a):
    return "rgba(%d, %d, %d, %s)" % tuple(_hex(hexa) + [a])

def mover(hexa, dL, fc=1.0):
    """El mismo matiz con otra luz. Se apoya en `apariencias/croma.py`, que es
       donde vive el OKLCh: mover la luz sin mover el matiz es lo que deja los
       contrastes ya medidos donde estaban."""
    import sys, os as _os
    sys.path.insert(0, _os.path.join(_os.path.dirname(AQUI), "apariencias"))
    import croma
    return croma.mover(hexa, dL, fc)

def _faint(tinta2, card, dia):
    import sys, os as _os
    sys.path.insert(0, _os.path.join(_os.path.dirname(AQUI), "apariencias"))
    import croma
    return croma.a_contraste(tinta2, card, card, 4.69 if dia else 2.82)

def variables(m, t, dia):
    """Los tokens de UNA cara del mundo, traducidos. Se llama dos veces —noche
       y día— porque desde 0.7.55 un mundo declara las dos: con una sola, el
       modo claro salía a medias (el bloque del mundo gana a `html.claro` por
       orden de carga, pero solo en lo que declara, así que por los huecos se
       colaba el papel de la casa debajo de la tinta clara del mundo)."""
    pag = t["--m-pagina"]
    ps = paradas(pag)
    fondo = ps[-1] if ps else "#000000"      # la parada más honda del degradado
    tarj = t["--m-tarjeta"]
    tps = paradas(tarj)
    tarj_plana = tps[0] if tps else "#000000"
    tinta, tinta2 = t["--m-tinta"], t["--m-tinta-2"]
    oscuro = min((fondo, tinta), key=lambda c: sum(_hex(c)))

    v = [
        ("--bg", fondo),
        ("--bg2", mezcla(fondo, tarj_plana, 0.6)),
        ("--card", tarj_plana),
        # `--card2` es «levantado», y levantar es SUBIR LA LUZ, no acercarse a
        # la tinta: mezclándolo con la tinta funcionaba de noche —donde la tinta
        # es clara— y de día hacía lo contrario, dejando la pieza levantada más
        # oscura que la tarjeta sobre la que se apoya. Con la luz, las dos caras
        # salen bien de la misma línea.
        ("--card2", mover(tarj_plana, 0.022)),
        ("--flotante", tarj_plana),
        # Las superficies, que son lo que de verdad se pinta. La página lleva su
        # degradado Y su grano; la tarjeta, el color plano —un grano repetido en
        # cada tarjeta de una lista se convierte en ruido, y el forro se ve
        # entero en el fondo, que es donde un forro se ve.
        ("--sup-pagina", (t.get("--m-grano","") + ", " if t.get("--m-grano") else "") + pag),
        ("--fondo-pagina", pag),
        # La franja que asoma al rebotar el scroll en el móvil. La pinta <html>
        # y no <body>, así que sale de su propia variable: sin declararla, un
        # mundo con la vitrina puesta enseñaba el carbón azulado de la casa cada
        # vez que se llegaba al final de una lista.
        ("--fondo-raiz", fondo),
        # Las tres manchas de luz del fondo, que hasta 0.7.55 eran las de la
        # casa escritas dentro de la regla: menta, luciérnaga y coral encima de
        # cualquier mundo. En un mundo salen de SUS acentos, que es lo que
        # convierte tres manchas sueltas en la atmósfera de la vitrina.
        ("--orbe-1", _rgba(t["--m-acento"], "0.18")),
        ("--orbe-2", _rgba(t["--m-aviso"], "0.13")),
        ("--orbe-3", _rgba(t["--m-acento"], "0.10")),
        ("--sup-panel", mezcla(fondo, tarj_plana, 0.6)),
        ("--sup-tarjeta", tarj),
        ("--sup-tarjeta2", mover(tarj_plana, 0.022)),
        ("--sup-flotante", tarj_plana),
        ("--line", t["--m-borde-color"]),
        ("--carril", t["--m-carril"]),
        # Un solo grosor para toda la app. Reliquia pedía 2 px porque el
        # `border-image` necesitaba ancho para dibujarse; sin él, dos grosores
        # distintos son solo dos grosores distintos —«homologar el grosor», lo
        # dijo Eduardo viendo que esas líneas eran más gordas que las demás—.
        ("--borde-tarjeta", "1px"),
        ("--text", tinta),
        ("--muted", tinta2),
        # El tenue no sale de una fracción fija sino del CONTRASTE que tiene el
        # de la casa sobre su tarjeta: 2,82 de noche y 4,69 de día. Con la
        # fracción, la cara de día de Reliquia se quedaba en 2,57 —medido sobre
        # píxeles— porque su tarjeta está pegada al blanco y el mismo 0,42 se
        # lleva el tono mucho más lejos. Cinco rótulos de la app viven en este
        # tono; con este cambio dejan de ser adivinables.
        ("--faint", _faint(tinta2, tarj_plana, dia)),
        # El acento partido en dos, que es la regla de la casa: escribir con un
        # acento no es rellenar con él. De noche el mismo tono hace las dos
        # cosas y por eso un mundo declara uno solo; sobre papel no puede, así
        # que la cara de día trae `--m-*-tinta` para lo que se escribe. Si no
        # lo declara, se usa el mismo — que es exactamente lo que pasaba antes.
        ("--mint", t.get("--m-acento-tinta", t["--m-acento"])),
        ("--mint-macizo", t["--m-acento"]),
        # Y `--mint-deep` es el acento HUNDIDO. Mezclarlo con el fondo lo hundía
        # de noche y lo aclaraba de día, que es justo lo contrario de lo que
        # dice su nombre.
        ("--mint-deep", mover(t["--m-acento"], -0.10)),
        ("--mint-soft", t["--m-acento-velo"]),
        ("--aro-alto", t["--m-acento"]),
        ("--fire", t.get("--m-aviso-tinta", t["--m-aviso"])),
        ("--fire-macizo", t["--m-aviso"]),
        ("--fire-soft", t["--m-aviso-velo"]),
        ("--coral", t.get("--m-peligro-tinta", t["--m-peligro"])),
        ("--coral-macizo", t["--m-peligro"]),
        ("--coral-soft", t["--m-peligro-velo"]),
        # Sobre un relleno macizo la tinta es OSCURA en los dos modos, porque
        # los tres acentos son claros en los dos. Cuál de los dos tonos del
        # mundo es «lo oscuro» cambia con la cara: de noche es su fondo, de día
        # es su tinta. Se elige midiendo y no con un `if dia`, para que un mundo
        # que invierta la luz —los hay— siga cayendo del lado correcto.
        ("--sobre-macizo", oscuro),
        ("--sobre-acento", oscuro),
        # Y la tinta sobre un relleno vivo (aviso, peligro, los ocho del
        # usuario), que desde 0.7.55 es una variable aparte de la del acento.
        ("--sobre-vivo", oscuro),
        # El movimiento. `--dur-*` son tres y salen del mismo número: un mundo
        # declara UN peso, no una tabla de tiempos.
        ("--dur-corta", t.get("--m-dur", ".22s")),
        ("--dur-media", t.get("--m-dur", ".3s")),
        ("--curva", t.get("--m-curva", "ease")),
    ]
    # El marco NO se declara como `border-image`, y esto es un arreglo de
    # verdad: **un `border-image` ignora el `border-radius`**. Está en la
    # especificación y no hay forma de pedirle que lo respete, así que un mundo
    # con esquinas redondeadas y marco dibujado enseñaba una tarjeta redonda con
    # un marco CUADRADO. Se ve poco y se nota, que es como lo describió Eduardo.
    #
    # Se dibuja abajo como un aro en un `::before` con máscara, que sí hereda el
    # radio. Y aquí `--marco-tarjeta` se apaga para que nada más lo herede.
    if t.get("--m-marco"):
        v.append(("--marco-tarjeta", "none"))
        v.append(("--aro-metal", t["--m-marco"].rsplit(" ", 1)[0]))
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
    if t.get("--m-r-gota-alt"): v.append(("--r-gota-alt", t["--m-r-gota-alt"]))

    # ---- El mapa de talentos ----
    # Las ocho `--lienzo-*` dibujan los cables, los rótulos y los nodos con
    # candado, y ninguna apariencia las declaraba: el mapa se quedaba con el
    # gris azulado de la casa por debajo de cualquier mundo. Salen del suelo
    # del mundo con los mismos desplazamientos que tiene la casa, así que el
    # mapa de Reliquia es al violeta de Reliquia lo que el de la casa es a su
    # carbón. Lo pidió Eduardo: «tematizar los talentos, los nodos y los
    # cables, sin perder su forma característica» — la FORMA no se toca aquí,
    # solo el material.
    import sys, os as _os
    sys.path.insert(0, _os.path.join(_os.path.dirname(AQUI), "apariencias"))
    import croma
    v += croma.lienzo(fondo, tarj_plana, t["--m-aviso"], dia)
    # El suelo hondo ya lo pone `croma.lienzo`: SOLO el tono, nunca el forro.
    # Se probó poniéndole el terciopelo debajo y Eduardo lo paró en la primera
    # mirada — sobre un lienzo una textura no es carácter, es suciedad, y
    # compite con lo único que hay que leer ahí. La regla, en `.const-wrap`.
    if t.get("--m-engaste"):
        v.append(("--nodo-engaste", t["--m-engaste"]))
    # El marco de un panel: `--line` apagada de noche y aclarada de día. Sin
    # esto, el encuadre de una rama seguía siendo el gris azulado de la casa.
    import sys, os as _os
    sys.path.insert(0, _os.path.join(_os.path.dirname(AQUI), "apariencias"))
    import croma
    v.append(("--borde-panel", croma.borde_panel(t["--m-borde-color"], dia)))
    return v

def bloque(m):
    t = m["tokens"]
    sel = 'html[data-apariencia="%s"]' % m["id"]
    ps = paradas(t["--m-pagina"])
    fondo = ps[-1] if ps else "#000000"
    tps = paradas(t["--m-tarjeta"])
    tarj_plana = tps[0] if tps else "#000000"
    tinta, tinta2 = t["--m-tinta"], t["--m-tinta-2"]

    salida = ["/* ---------- %s · %s ---------- */" % (m["nombre"], m["llave"]),
              "/* " + m["premisa"] + " */"]

    # POR QUÉ EL BLOQUE DE NOCHE LLEVA `:not(.claro)` en cuanto el mundo tiene
    # cara de día, y no lo llevaba antes: `html[data-apariencia="x"]` y
    # `html.claro` tienen la MISMA especificidad, así que decide el orden de los
    # archivos y este se carga el último. Con una sola cara eso era justo lo que
    # se quería —el mundo manda en los dos modos—; con dos caras, el bloque de
    # noche le ganaba al de día. Es el mismo arreglo que ya llevan los ambientes
    # desde que Escarcha lo destapó.
    noche_sel = (sel.replace("html[", "html:not(.claro)[") if m.get("dia") else sel)
    salida += [noche_sel + " {"] + ["  %s: %s;" % kv for kv in variables(m, t, False)] + ["}"]
    if m.get("dia"):
        # La cara de día hereda del mundo todo lo que no vuelva a decir: las
        # esquinas, la letra y el peso al moverse no cambian con la luz.
        td = dict(t); td.update(m["dia"])
        salida += ['html.claro[data-apariencia="%s"] {' % m["id"]]
        salida += ["  %s: %s;" % kv for kv in variables(m, td, True)] + ["}"]

    # Y la escena, con el mismo trato que un ambiente: se queda de noche en los
    # dos modos, así que su bloque va sin `:not(.claro)`.
    esc = [("--bg", fondo), ("--bg2", mezcla(fondo, tarj_plana, 0.6)),
           ("--card", tarj_plana), ("--card2", mover(tarj_plana, 0.022)),
           ("--sup-pagina", "var(--bg)"), ("--sup-panel", "var(--bg2)"),
           ("--sup-tarjeta", "var(--card)"), ("--sup-tarjeta2", "var(--card2)"),
           ("--line", t["--m-borde-color"]), ("--carril", t["--m-carril"]),
           ("--text", tinta), ("--muted", tinta2), ("--faint", _faint(tinta2, tarj_plana, False)),
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
    # El metal de una escena es el de NOCHE en los dos modos, como todo lo
    # demás que hay dentro: la escena es un dibujo de una noche, y un marco de
    # día alrededor de un paisaje nocturno se ve como lo que sería, una pieza
    # de otro sitio.
    if t.get("--m-marco"):
        esc.append(("--aro-metal", t["--m-marco"].rsplit(" ", 1)[0]))
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
        # El color sale de `color-mix` y no de una mezcla calculada aquí: con el
        # hex escrito, la cara de día se quedaba con el borde apagado de la
        # noche. Así lo apaga contra la tarjeta de la cara que esté puesta.
        liso = "color-mix(in srgb, var(--line), var(--card) 55%)"
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

    # ---- El aro de metal, que SÍ se redondea ----
    # Y va en las CINCO piezas grandes, no en dos. `.scene-card` entró en
    # 0.7.55.6: los cuatro encabezados de módulo y la tarjeta de la racha son
    # la pieza más grande de cada pantalla, y eran las únicas sin marco
    # mientras el panel y la tarjeta del Resumen sí lo tenían. «Desentonan
    # mucho en comparación con todo lo demás», y es exactamente eso: no es que
    # les sobrara nada, es que les faltaba lo que llevan sus vecinas.
    #
    # No amplía el reparto: `.sec-hero` y `.streak-card` SON `.scene-card`, así
    # que un solo selector cubre los cinco sitios y sigue habiendo como mucho
    # dos aros por pantalla. La lista está aquí arriba para que se lea de un
    # vistazo cuántas piezas lo llevan; el día que sean seis, se verá.
    # La receta es la de siempre para un borde con degradado: una capa del
    # tamaño de la caja, con el degradado pintado hasta el borde, y una máscara
    # que le quita todo menos el anillo del ancho del borde. `border-radius:
    # inherit` es lo que hace que siga la esquina de su tarjeta, sea la que sea.
    if t.get("--m-marco"):
        # El degradado va en una variable propia y no escrito en la regla: la
        # cara de día puede traer el suyo —un metal se ve distinto con otra
        # luz— y así el aro es UNA regla, no una por cara.
        salida += ["",
          "/* El aro de metal. Va en un `::before` con máscara y no en un",
          "   `border-image`, porque un border-image ignora el border-radius: la",
          "   tarjeta salía redonda con el marco cuadrado. Así hereda la esquina. */",
          ",\n".join("%s %s::before" % (sel, q) for q in PIEZAS_CON_ARO) + " {",
          "  content: \"\";",
          "  position: absolute;",
          "  inset: 0;",
          "  border-radius: inherit;",
          "  padding: 1px;",
          "  background: var(--aro-metal);",
          "  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);",
          "  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);",
          "  -webkit-mask-composite: xor;",
          "  mask-composite: exclude;",
          "  pointer-events: none;",
          # Dentro de una escena hay un paisaje y un velo colocados encima con
          # `position: absolute`, y un `::before` es el primer hijo: sin esto
          # el aro quedaba pintado DEBAJO del dibujo y no se veía.
          "  z-index: 2;",
          "}",
          ",\n".join("%s %s" % (sel, q) for q in PIEZAS_CON_ARO) + " { position: relative; }"]

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

    salida += ["", ",\n".join("%s %s" % (sel, q) for q in
                               (".scene-card", ".celebrate", ".ncel", ".scel")) + " {"]
    salida += ["  %s: %s;" % kv for kv in esc]
    salida.append("}")
    return "\n".join(salida) + "\n"


CAB = """/* Los mundos de Norata, ya traducidos al vocabulario de la app.

   Un mundo NO es un ambiente. Un ambiente reusa el material y le cambia la luz;
   un mundo cambia de qué está hecha la app —la superficie, el marco, la letra y
   el peso al moverse—. Por eso un ambiente puede ser gratis y salir de uno en
   uno, y un mundo se construye entero.

   ESTE ARCHIVO NO VA EN `ASSETS` NI EN `index.html`, y eso no es un descuido:
   pesa lo que pesa un mundo, y bajárselo a quien nunca va a encender uno es
   justo lo que la caché de 0.7.38 vino a evitar. Lo pide el motor la primera vez
   que se enciende uno —y el script de arriba de `index.html` cuando ya hay uno
   guardado, para que no haya fogonazo—, y el service worker lo guarda cuando
   pasa por ahí.

   Generado por `mundos/app.py` desde `mundos/datos.py`. No editar a mano. */

/* Syne, la letra de Reliquia. Va incrustada y no traída de un servidor de
   fuentes por dos motivos: la app se sirve de su propia copia y no pide nada a
   la red, y una tipografía de fuera es una petición a un tercero que sabe quién
   la pidió. Licencia SIL Open Font 1.1 (Bonjour Monde), que permite
   incrustarla; pesa 34 KB.

   **Se declara de 600 a 700 y no de 600 a 800, que es su rango real.** Syne a
   800 se ESTIRA —es lo característico de esa familia— y a tamaños de interfaz
   eso alarga los rótulos y descuadra los renglones. La app pide 800 en varios
   sitios; declarando el techo aquí, el navegador recorta esas peticiones al
   700 sin que haya que ir a buscarlas una por una. El bloque de reglas de más
   abajo hace lo mismo por si alguna se cuela con otra familia detrás. */
@font-face {
  font-family: "Syne";
  font-style: normal;
  font-weight: 600 700;
  font-display: swap;
  src: url(data:font/woff2;base64,%s) format("woff2");
}
"""

if __name__ == "__main__":
    # Los mundos LISTOS y solo esos: `datos.MUNDOS` tiene los catorce, y trece
    # de ellos todavía son un borrador de la lámina. Meter sus variables aquí
    # sería servir trece mundos que nadie puede encender.
    fuente = base64.b64encode(open(os.path.join(AQUI, "fuentes", "syne.woff2"), "rb").read()).decode()
    partes = [CAB % fuente]
    # La lista está aquí y no en `datos.py` porque quien manda sobre qué mundo
    # existe para el usuario es `MUNDOS` en `js/10i-apariencia.js` —el `listo:
    # true` de ahí—; esto es su reflejo, y al dar de alta un mundo se tocan los
    # dos. `datos.py` tiene los catorce y trece siguen siendo lámina.
    LISTOS = ("reliquia",)
    listos = [m for m in D.MUNDOS if m["id"] in LISTOS]
    for m in listos:
        partes.append(bloque(m))
    txt = "\n".join(partes)
    raiz = os.path.dirname(AQUI)
    destino = os.path.join(raiz, "css", "mundos.css")
    open(destino, "w", encoding="utf-8").write(txt)

    # ---- Y la HUELLA, que es lo que impide que un aparato se quede con una
    # copia vieja para siempre ----
    #
    # `css/mundos.css` no va en ASSETS, así que no lo renueva la instalación:
    # se pide suelto cuando hace falta y lo que llegue se guarda en la caché de
    # esa versión — y a partir de ahí ya es un acierto y no se vuelve a pedir.
    # GitHub Pages tarda un minuto largo en publicar y su CDN no cambia todos
    # los archivos a la vez, así que hay una ventana en la que `sw.js` ya es el
    # nuevo y este archivo todavía es el viejo. Quien abra ahí se queda el
    # archivo viejo congelado con el número de versión nuevo puesto, y no hay
    # recarga que lo arregle. Está reproducido; pasó con la 0.7.55.3.
    #
    # La cura es que la DIRECCIÓN cambie cuando cambia el archivo. Con
    # `?h=<huella>` una copia vieja no puede reutilizarse ni desde la caché del
    # service worker ni desde la del navegador, porque ya no es la misma
    # dirección. Y la huella sale del contenido, así que se actualiza sola al
    # generar el archivo: no hay un quinto sitio que acordarse de tocar.
    huella = hashlib.sha256(txt.encode()).hexdigest()[:10]
    # Se sella LÍNEA A LÍNEA y solo donde se pide el archivo de verdad: con una
    # sustitución sobre el archivo entero, los comentarios que lo nombran
    # acababan diciendo `css/mundos.css?h=…`, que no es falso pero es ruido.
    # El selector que comprueba si ya está enganchada NO se sella: mira por
    # prefijo (`href^=`) justo para no depender de la huella. Sellándolo también
    # funcionaba, pero el día que un sellado alcance a un sitio y no al otro,
    # la app pediría el mundo dos veces sin que nada lo delate.
    marcas = ('.href = "css/mundos.css',)
    tocados = []
    for rel in ("index.html", os.path.join("js", "10i-apariencia.js")):
        ruta = os.path.join(raiz, rel)
        lineas = open(ruta, encoding="utf-8").read().split("\n")
        cambio = False
        for i, l in enumerate(lineas):
            if any(m in l for m in marcas):
                nueva = re.sub(r"css/mundos\.css(\?h=[0-9a-f]+)?", "css/mundos.css?h=" + huella, l)
                if nueva != l: lineas[i] = nueva; cambio = True
        if cambio:
            open(ruta, "w", encoding="utf-8").write("\n".join(lineas))
            tocados.append(rel)

    print("css/mundos.css", len(txt.encode()), "bytes · huella", huella, "·",
          ", ".join(m["nombre"] for m in listos))
    if tocados: print("  sellado en:", ", ".join(tocados))
