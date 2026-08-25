# -*- coding: utf-8 -*-
# Saca los trazos del logo de dentro de la app y los deja como archivos de
# marca sueltos. Se extraen y no se copian a mano a proposito: si el logo
# cambia en la app, este script vuelve a generar todo sin que nadie tenga que
# acordarse de actualizar cinco archivos.
import io, os, re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = io.open(os.path.join(RAIZ, "index.html"), encoding="utf-8", newline="").read()
icono = io.open(os.path.join(RAIZ, "icon.svg"), encoding="utf-8", newline="").read()

# El isotipo suelto sale de icon.svg, que lo tiene en su propio espacio limpio
ISO = re.search(r'<path d="(M224\.919[^"]+)"', icono).group(1)

# El logotipo horizontal sale de la barra lateral: marca y palabra ya encajadas
bloque = re.search(r'<svg viewBox="27 33 200 51">(.*?)</svg>', src, re.S).group(1)
# Se copia la ETIQUETA ENTERA, no solo su atributo `d`. Sacar solo la `d` es
# lo que hacia antes y estaba roto desde el cambio de nombre: dos de las seis
# letras llevan un `transform` porque se intercambiaron de sitio, y ademas lo
# llevan escrito ANTES de la `d`. Asi que la expresion de antes ni siquiera
# las encontraba, y este script generaba un logotipo de cuatro letras. Se noto
# al volver a correrlo meses despues.
ETIQUETAS = re.findall(r'<path [^>]*/>', bloque)
PALABRA = ETIQUETAS[:-1]     # las 6 letras, en orden y con sus transform
MARCA = ETIQUETAS[-1]        # el isotipo, que va el ultimo

# Dos mentas, una por cada luz, igual que el resto de la paleta: la de
# noche brilla sobre carbon y sobre papel se lava; la de dia es el verde
# saturado de la marca. Se eligio asi el 25 ago 2026.
MENTA = "#5fe0b0"        # sobre fondo oscuro
MENTA_DIA = "#00cc7f"    # sobre fondo claro
CLARO = "#f4f6fb"
OSCURO = "#131823"

# La palabra paso de "Notara" a "Norata" el 18 de agosto de 2026. Son las
# MISMAS seis letras con la t y la r intercambiadas, asi que el logotipo no se
# redibujo: se cambiaron los dos trazos de sitio DENTRO de index.html, que es
# el original. Aqui no hay nada especial que hacer — este archivo solo copia lo
# que encuentra alli, y si el cambio viviera solo aqui la app seguiria
# ensenando el nombre viejo en su barra lateral.
#
# Salio barato por una casualidad que se midio ANTES de intentarlo: la t ocupa
# 13.51 y la r 13.28, una diferencia de 0.23 sobre una palabra de 130. Con
# anchuras distintas habria habido que recalcular todas las separaciones.
NL = chr(10)

PLANTILLA_ISO = (
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="14 14 222 222">' + NL +
'  <path d="%s" fill="%s"/>' + NL +
'</svg>' + NL)

PLANTILLA_HOR = (
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="27 33 200 51">' + NL +
'  %s' + NL +
'  <g>' + NL +
'%s' + NL +
'  </g>' + NL +
'</svg>' + NL)

def con_fill(etiqueta, color):
    """La misma etiqueta con el color puesto. En la app los trazos van en
    `currentColor` —para que el logotipo de la barra cambie con el modo— y
    aqui hay que fijarlos, porque un archivo suelto no hereda nada."""
    if 'fill="' in etiqueta:
        return re.sub(r'fill="[^"]*"', 'fill="%s"' % color, etiqueta)
    return etiqueta[:-2].rstrip() + ' fill="%s"/>' % color

def iso(color):
    return PLANTILLA_ISO % (ISO, color)

def horizontal(colorMarca, colorTexto):
    trozos = ['    ' + con_fill(t, colorTexto) for t in PALABRA]
    return PLANTILLA_HOR % (con_fill(MARCA, colorMarca), NL.join(trozos))

ARCHIVOS = {
    "isotipo-menta.svg":   iso(MENTA),
    "isotipo-menta-dia.svg": iso(MENTA_DIA),
    "isotipo-claro.svg":   iso(CLARO),
    "isotipo-oscuro.svg":  iso(OSCURO),
    "logotipo-claro.svg":  horizontal(MENTA, CLARO),    # para fondos oscuros
    "logotipo-oscuro.svg": horizontal(MENTA_DIA, OSCURO),   # para fondos claros
}

destino = os.path.join(RAIZ, "marca")
for nombre, contenido in ARCHIVOS.items():
    with io.open(os.path.join(destino, nombre), "w", encoding="utf-8", newline=NL) as f:
        f.write(contenido)
    print("%-24s %5d bytes" % (nombre, len(contenido)))
