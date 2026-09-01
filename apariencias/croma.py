# -*- coding: utf-8 -*-
"""Subir el CROMA de los suelos de noche sin mover la LUZ.

Por qué existe. Medido en OKLCh, los suelos de noche de la mitad de los
ambientes tenían MENOS color que el carbón de la casa: Musgo 0,0168 y Adobe
0,0114 contra los 0,0180 del azul de casa. Por eso «no cambiaba nada» en la
pantalla de una computadora, donde el fondo es lo que más superficie ocupa: no
es que el ambiente no llegara, es que el ambiente era más gris que lo que
sustituía.

Se sube el croma y NO la luz, y ese es todo el truco: el contraste de la app se
calcula con la luminancia, así que dejando la L quieta los treinta y dos
contrastes ya aprobados siguen valiendo. Aun así se vuelven a medir después —
la luminancia relativa de WCAG no es exactamente la L de OKLab y se mueve un
pelo al cargar color.

Tinta no se toca: es un monocromo elegido, y darle color sería convertirlo en
otro ambiente."""
import math

def _srgb(h):
    h = h.lstrip("#")
    return [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]

def _lin(u): return u / 12.92 if u <= 0.04045 else ((u + 0.055) / 1.055) ** 2.4
def _gam(u): return 12.92 * u if u <= 0.0031308 else 1.055 * (u ** (1 / 2.4)) - 0.055

def a_oklch(hexa):
    r, g, b = [_lin(x) for x in _srgb(hexa)]
    l = (0.4122214708*r + 0.5363325363*g + 0.0514459929*b) ** (1/3)
    m = (0.2119034982*r + 0.6806995451*g + 0.1073969566*b) ** (1/3)
    s = (0.0883024619*r + 0.2817188376*g + 0.6299787005*b) ** (1/3)
    L = 0.2104542553*l + 0.7936177850*m - 0.0040720468*s
    A = 1.9779984951*l - 2.4285922050*m + 0.4505937099*s
    B = 0.0259040371*l + 0.7827717662*m - 0.8086757660*s
    return L, math.hypot(A, B), math.degrees(math.atan2(B, A)) % 360

def a_hex(L, C, h):
    A = C * math.cos(math.radians(h)); B = C * math.sin(math.radians(h))
    l = (L + 0.3963377774*A + 0.2158037573*B) ** 3
    m = (L - 0.1055613458*A - 0.0638541728*B) ** 3
    s = (L - 0.0894841775*A - 1.2914855480*B) ** 3
    r = +4.0767416621*l - 3.3077115913*m + 0.2309699292*s
    g = -1.2684380046*l + 2.6097574011*m - 0.3413193965*s
    b = -0.0041960863*l - 0.7034186147*m + 1.7076147010*s
    return "#" + "".join("%02x" % max(0, min(255, round(_gam(max(0.0, min(1.0, c))) * 255)))
                         for c in (r, g, b))

def con_croma(hexa, croma):
    """El mismo color con otro croma. La luz y el matiz no se tocan."""
    L, _, h = a_oklch(hexa)
    return a_hex(L, croma, h)

# El objetivo por llave. Sale de Duna, que es el único que Eduardo dijo que sí
# se distingue: se toma su perfil de croma como el suelo de «esto se ve».
OBJETIVO = {"--bg": 0.032, "--bg2": 0.037, "--card": 0.055, "--card2": 0.056,
            "--line": 0.045, "--carril": 0.045}

def subir(noche, salta=False):
    """Devuelve el dict de noche con los suelos cargados de color."""
    if salta: return dict(noche)
    fuera = dict(noche)
    for k, obj in OBJETIVO.items():
        if k not in fuera: continue
        L, C, h = a_oklch(fuera[k])
        if C >= obj: continue          # el que ya llega no se toca
        fuera[k] = con_croma(fuera[k], obj)
    return fuera


# ---------------------------------------------------------------------------
# La HONDURA, que es lo contrario del croma de arriba y por eso va debajo.
#
# Subir el croma resolvio «no se nota el cambio» y creo el siguiente: con los
# cuatro suelos cargados del mismo tono y separados por 0,06 de luz, la
# pantalla se lee como una sola mancha. Lo dijo Eduardo con la frase exacta —
# «se ven como plastas del mismo color regados por todas partes»— y midiendolo
# se ve por que: el salto de la pagina a la tarjeta era de 0,056 (Musgo) a
# 0,068, cuando lo que hace que una tarjeta se vea APOYADA encima y no pintada
# al lado es justo ese salto.
#
# Se arregla por abajo y no por arriba: la pagina se hunde y la tarjeta se
# queda donde esta. Hundir el fondo no le quita contraste a nada —el texto va
# encima de la tarjeta, y sobre el fondo solo va texto claro, que gana— y
# ademas es lo que pidio: «necesitas usar un poco mas de oscuro».
#
# Y al fondo se le baja el croma mientras a la tarjeta no: un campo enorme muy
# tenido es lo que se lee como plasta; la tarjeta, que es la pieza pequena, es
# la que puede permitirse el color. Asi el ambiente sigue notandose —esta en la
# pieza que se mira— y deja de ser un bano del mismo tono.
HONDURA_NOCHE = {          # cuanto se mueve la luz y cuanto queda del croma
 "--bg":     (-0.042, 0.72),
 "--bg2":    (-0.030, 0.82),
 "--card":   (+0.008, 1.00),
 "--card2":  (+0.010, 1.00),
 "--line":   (+0.022, 1.00),
 "--carril": (+0.022, 1.00),
}
# De dia se mueve mucho menos: el papel no puede hundirse sin dejar de ser
# papel, y la tarjeta ya esta pegada al blanco. Basta con bajar el suelo.
HONDURA_DIA = {
 "--bg":     (-0.024, 1.00),
 "--bg2":    (-0.014, 1.00),
 "--line":   (-0.016, 1.00),
 "--carril": (-0.016, 1.00),
}

def mover(hexa, dL, factor_croma=1.0):
    """El mismo matiz con otra luz y, si se pide, con otro croma."""
    L, C, h = a_oklch(hexa)
    return a_hex(max(0.0, min(1.0, L + dL)), C * factor_croma, h)

def hondear(tabla, tramo):
    """Aplica la tabla de arriba a los tonos que el ambiente declara. Lo que no
       declara NO se inventa: cae en la casa, que es la que manda."""
    fuera = dict(tabla)
    for k, (dL, fc) in tramo.items():
        if k in fuera: fuera[k] = mover(fuera[k], dL, fc)
    return fuera

def fondo_pagina(bg):
    """El degradado de la pagina de un ambiente, con la MISMA forma que el de
       la casa: la parada de arriba es la mas honda, la de en medio la mas
       clara y la de abajo el propio suelo.

       Existe porque hasta ahora ningun ambiente lo declaraba, y ahi estaba el
       fallo que Eduardo describio como «el fondo solo en medio»: `--sup-pagina`
       vale `var(--fondo-pagina)`, un ambiente cambiaba `--bg` y no esa, y la
       pagina seguia siendo el carbon azulado de la casa. Como la columna de
       contenido mide 560 px, lo que se veia en una computadora era el ambiente
       en el centro y la casa a los dos lados."""
    return "linear-gradient(180deg, %s 0%%, %s 55%%, %s 100%%)" % (
        mover(bg, -0.022), mover(bg, +0.014), bg)

def raiz(bg):
    """La franja que asoma al rebotar el scroll: la parada mas honda."""
    return mover(bg, -0.022)

def _rgba(hexa, a):
    h = hexa.lstrip("#")
    return "rgba(%d, %d, %d, %s)" % tuple([int(h[i:i+2], 16) for i in (0, 2, 4)] + [a])

def orbes(acento, card, dia=False):
    """Las tres manchas de luz del fondo. La primera es el ACENTO del ambiente;
       si el ambiente no mueve el acento —los de grado 1 se quedan con la menta
       de la casa— se saca de su propio suelo subiendole luz y color, porque una
       mancha verde encima del barro de Adobe no es atmosfera, es un descuido.
       Las otras dos son luciernaga y coral, que ningun ambiente mueve."""
    if acento is None:
        L, C, h = a_oklch(card)
        acento = a_hex(0.74 if not dia else 0.70, max(C, 0.13), h)
    return (_rgba(acento, "0.18"),
            _rgba("#f5c314" if dia else "#f5d76e", "0.13"),
            _rgba("#ff603d" if dia else "#ff8a70", "0.12"))


# ---------------------------------------------------------------------------
# EL LIENZO DE LOS TALENTOS
#
# Ocho variables (`--lienzo-*`) que dibujan el mapa: el hilo entre dos
# talentos, el rótulo debajo de cada nodo, el relleno de uno con candado, la
# etiqueta de un grupo. Ninguna apariencia las declaraba, así que el mapa se
# quedaba con el gris azulado de la casa por debajo de cualquier ambiente —el
# mismo agujero que `--fondo-pagina`, pero en la pantalla que más se mira—.
# Eduardo lo pidió como «tematizar los talentos… los nodos y los cables».
#
# No se eligen a ojo: se sacan del suelo de cada apariencia con los MISMOS
# desplazamientos que tiene la casa, medidos en OKLCh. Así el mapa de Duna es
# al violeta de Duna lo que el mapa de la casa es a su carbón, y ninguna
# apariencia estrena una relación que nadie aprobó.
#
# `--lienzo-halo` no está en la tabla: vale `var(--bg)` para todos, porque es
# el recorte que separa un hilo del lienzo y el lienzo ES el fondo.
# `--lienzo-flujo` tampoco: son los guiones que corren por un hilo vivo, y esos
# salen del aviso de la apariencia, no de su suelo.
# El croma va en ABSOLUTO y no como una fracción del suelo, y el primer intento
# fue justo al revés: como los suelos de los ambientes llevan 2,3 veces el color
# del carbón de casa (la subida de croma de 0.7.49), una fracción daba hilos de
# un verde encendido en Musgo — un cable, que es una raya de 2 px, no puede
# llevar más color que el suelo que lo sostiene. Se toma el croma de la casa y
# se recorta al del propio suelo, que es lo que deja a Tinta monocroma sin tener
# que exceptuarla: (cuánto por encima del fondo, cuánto croma como mucho).
LIENZO_NOCHE = {
 "--lienzo-apagado":   (+0.2578, 0.0324),
 "--lienzo-hilo":      (+0.2107, 0.0347),
 "--lienzo-rotulo":    (+0.5698, 0.0218),
 "--lienzo-ficha":     (+0.0347, 0.0239),
 "--lienzo-caja":      (+0.0129, 0.0202),
 "--lienzo-bloqueado": (+0.0565, 0.0291),
 # El contorno de un nodo con candado. Salía de `--pip`, que es el tono de los
 # rombitos de una rama plegada y NO lo mueve ninguna apariencia: sobre el
 # lienzo violeta de Reliquia, los talentos cerrados seguían siendo gris azul
 # de la casa. Los valores son los de `--pip` medidos, así que la casa no se
 # mueve un punto.
 "--lienzo-candado":   (+0.1461, 0.0288),
}
LIENZO_DIA = {
 "--lienzo-apagado":   (-0.2128, 0.0445),
 "--lienzo-hilo":      (-0.1266, 0.0388),
 "--lienzo-rotulo":    (-0.5155, 0.0430),
 "--lienzo-ficha":     (+0.0745, 0.0029),
 "--lienzo-caja":      (+0.0745, 0.0029),
 "--lienzo-bloqueado": (+0.0312, 0.0150),
 "--lienzo-candado":   (-0.0909, 0.0300),
}

def lienzo(bg, card, aviso, dia=False):
    """Las siete que se derivan, más el punto de la cuadrícula. El matiz sale
       del fondo —es el suelo sobre el que se dibuja— y el croma es el de la
       casa recortado al del propio suelo, de manera que un ambiente cargado de
       color no pinte cables de neón y uno monocromo siga siendo monocromo."""
    Lb, Cb, hb = a_oklch(bg)
    base = max(Cb, a_oklch(card)[1])
    tabla = LIENZO_DIA if dia else LIENZO_NOCHE
    v = [(k, a_hex(max(0.0, min(1.0, Lb + dL)), min(tope, base), hb))
         for k, (dL, tope) in tabla.items()]
    # Los guiones del hilo vivo: el aviso de la apariencia llevado a casi
    # blanco de noche y hundido de día, que es lo que hace la casa.
    La, Ca, ha = a_oklch(aviso)
    v.append(("--lienzo-flujo", a_hex(0.9645 if not dia else 0.6728,
                                     0.0485 if not dia else 0.1386, ha)))
    # Y el punto de la cuadrícula: el rótulo a un 9%, que es de donde salía el
    # gris azulado que estaba escrito dentro de la regla.
    rot = dict(v)["--lienzo-rotulo"]
    v.append(("--lienzo-punto", _rgba(rot, "0.09")))
    # Y el suelo, que es el propio fondo del ambiente. Va explícito porque la
    # tarjeta de una rama lo pide para no verse parcheada, y porque un mundo
    # puede querer un suelo distinto del de su página.
    v.append(("--lienzo-suelo", bg))
    return v


def _lum(hexa):
    r, g, b = [_lin(x) for x in _srgb(hexa)]
    return 0.2126*r + 0.7152*g + 0.0722*b

def contraste(a, b):
    x, y = sorted((_lum(a), _lum(b)), reverse=True)
    return (x + 0.05) / (y + 0.05)

def _mezcla(a, b, t):
    x = [int(a.lstrip("#")[i:i+2], 16) for i in (0, 2, 4)]
    y = [int(b.lstrip("#")[i:i+2], 16) for i in (0, 2, 4)]
    return "#" + "".join("%02x" % round(x[i] + (y[i]-x[i])*t) for i in range(3))

def a_contraste(desde, hacia, fondo, objetivo):
    """`desde` acercado a `hacia` justo lo necesario para quedarse en el
       contraste pedido contra `fondo`. Es como se saca `--faint`.

       Con una fracción fija —0,42 de la tinta apagada hacia la tarjeta— salía
       bien de noche y mal de día: la tarjeta de día está pegada al blanco, así
       que la misma fracción se lleva el tono mucho más lejos. Medido, el gris
       tenue de Reliquia daba 2,57 sobre su tarjeta cuando el de la casa da
       4,69. Buscando la fracción por contraste, las dos caras salen del mismo
       sitio y cualquier mundo futuro también."""
    if contraste(desde, fondo) <= objetivo: return desde
    lo, hi = 0.0, 0.95
    for _ in range(24):
        mid = (lo + hi) / 2
        if contraste(_mezcla(desde, hacia, mid), fondo) > objetivo: lo = mid
        else: hi = mid
    return _mezcla(desde, hacia, lo)
