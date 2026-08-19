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
PALABRA = re.findall(r'<path d="([^"]+)"', bloque)[:-1]     # las 6 letras
MARCA = re.findall(r'<path d="([^"]+)"', bloque)[-1]        # el isotipo

MENTA = "#5fe0b0"
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
'  <path d="%s" fill="%s"/>' + NL +
'  <g>' + NL +
'%s' + NL +
'  </g>' + NL +
'</svg>' + NL)

def iso(color):
    return PLANTILLA_ISO % (ISO, color)

def horizontal(colorMarca, colorTexto):
    trozos = []
    for d in PALABRA:
        trozos.append('    <path d="%s" fill="%s"/>' % (d, colorTexto))
    return PLANTILLA_HOR % (MARCA, colorMarca, NL.join(trozos))

ARCHIVOS = {
    "isotipo-menta.svg":   iso(MENTA),
    "isotipo-claro.svg":   iso(CLARO),
    "isotipo-oscuro.svg":  iso(OSCURO),
    "logotipo-claro.svg":  horizontal(MENTA, CLARO),    # para fondos oscuros
    "logotipo-oscuro.svg": horizontal(MENTA, OSCURO),   # para fondos claros
}

destino = os.path.join(RAIZ, "marca")
for nombre, contenido in ARCHIVOS.items():
    with io.open(os.path.join(destino, nombre), "w", encoding="utf-8", newline=NL) as f:
        f.write(contenido)
    print("%-24s %5d bytes" % (nombre, len(contenido)))
