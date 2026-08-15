# Saca los trazos del logo de dentro de la app y los deja como archivos de
# marca sueltos. Se extraen y no se copian a mano a proposito: si el logo
# cambia en la app, este script vuelve a generar todo sin que nadie tenga que
# acordarse de actualizar cuatro archivos.
import io, os, re

RAIZ = r"C:\Users\jcama\Desktop\Proyecto Main Quest - Skills y perks aplicados en la vida diaria"
src = io.open(os.path.join(RAIZ, "index.html"), encoding="utf-8", newline="").read()
icono = io.open(os.path.join(RAIZ, "icon.svg"), encoding="utf-8", newline="").read()

# El isotipo suelto sale de icon.svg, que lo tiene en su propio espacio limpio
ISO = re.search(r'<path d="(M224\.919[^"]+)"', icono).group(1)

# El logotipo horizontal sale de la barra lateral: marca + palabra ya encajadas
bloque = re.search(r'<svg viewBox="27 33 200 51">(.*?)</svg>', src, re.S).group(1)
PALABRA = re.findall(r'<path d="([^"]+)"', bloque)[:-1]     # las 6 letras
MARCA = re.findall(r'<path d="([^"]+)"', bloque)[-1]        # el isotipo

MENTA = "#5fe0b0"
CLARO = "#f4f6fb"
OSCURO = "#131823"

def iso(color):
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="14 14 222 222">\n'
            '  <path d="%s" fill="%s"/>\n</svg>\n' % (ISO, color))

def horizontal(colorMarca, colorTexto):
    letras = "\n".join('    <path d="%s" fill="%s"/>' % (p, colorTexto) for p in PALABRA)
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="27 33 200 51">\n'
            '  <path d="%s" fill="%s"/>\n  <g>\n%s\n  </g>\n</svg>\n' % (MARCA, colorMarca, letras))

ARCHIVOS = {
    "isotipo-menta.svg":        iso(MENTA),
    "isotipo-claro.svg":        iso(CLARO),
    "isotipo-oscuro.svg":       iso(OSCURO),
    "logotipo-claro.svg":       horizontal(MENTA, CLARO),   # para fondos oscuros
    "logotipo-oscuro.svg":      horizontal(MENTA, OSCURO),  # para fondos claros
}

destino = os.path.join(RAIZ, "marca")
os.makedirs(destino, exist_ok=True)
for nombre, contenido in ARCHIVOS.items():
    with io.open(os.path.join(destino, nombre), "w", encoding="utf-8", newline="\n") as f:
        f.write(contenido)
    print("%-24s %5d bytes" % (nombre, len(contenido)))
