# -*- coding: utf-8 -*-
"""Los iconos de la app, uno por mundo. `python mundos/iconos/generar.py`
escribe `svg/<id>.svg` y la vista comparada `vista.html`; los PNG los saca
`node mundos/iconos/rasterizar.js` de esos SVG.

Tres reglas, y las tres son de marca antes que de dibujo:

1. **El isotipo no se redibuja: se viste.** Mismo trazo, misma proporción,
   mismo sitio en los diecisiete. Un mundo cambia el MATERIAL de la pieza
   (tinta, vidrio, metal, píxel) y el suelo sobre el que se apoya; la silueta
   es la de `marca/isotipo-menta.svg`. Por eso se lee a 48 px en cualquiera.
   Los tres pixelados (Arcade, Catedral, Averno) salen de muestrear ESE trazo
   en una cuadrícula, no de dibujarlo a ojo en otra.
2. **Se dibuja a sangre y el isotipo va en la zona segura.** Android recorta
   el icono con la máscara que le dé la gana —círculo, gota, cuadrado
   redondeado—, así que el cuadrado entero lleva fondo y el isotipo ocupa
   288 de 512: su esquina más lejana cae dentro del círculo del 80 % que
   `maskable` garantiza. Lo que va en las esquinas (remaches, escuadras,
   flores) es adorno que puede perderse sin que el icono deje de decir nada.
3. **El hueco del centro no lleva nada.** Es lo que hace del isotipo un
   marco, y por él solo se ve el suelo del mundo. La primera tanda puso ahí
   una flor, un astro, un cursor, una hoja y un copo, y Eduardo los quitó:
   con algo dentro, la pieza deja de leerse como la marca.

Los tonos salen de `mundos/datos.py` y de las paletas de Catedral y Averno;
donde un mundo no tenía el tono (el ocre de Talavera, el brillo del metal),
está apuntado junto a su dibujo."""
import os, math, html
import isotipo

AQUI = os.path.dirname(os.path.abspath(__file__))
L = 512
X0, Y0, X1, Y1 = isotipo.caja()
ESC = 288 / (X1 - X0)
CX, CY = (X0 + X1) / 2, (Y0 + Y1) / 2
POS = "translate(%.3f %.3f) scale(%.4f)" % (L / 2 - CX * ESC, L / 2 - CY * ESC, ESC)
# Un píxel de pantalla en unidades del isotipo, para dar trazos en px.
PX = 1 / ESC


def iso(p, **a):
    """El isotipo, en su sitio. `p` es el prefijo del mundo: al meter los
    diecisiete en una misma página los id no pueden chocar."""
    extra = " ".join('%s="%s"' % (k.rstrip("_").replace("_", "-"), v) for k, v in a.items())
    return '<use href="#%s-iso" %s/>' % (p, extra)


def pixel(n, p, **a):
    """El isotipo pixelado: el mismo trazo muestreado en n×n celdas."""
    lado, cs = isotipo.celdas(n)
    extra = " ".join('%s="%s"' % (k.rstrip("_").replace("_", "-"), v) for k, v in a.items())
    r = "".join('<rect x="%.2f" y="%.2f" width="%.2f" height="%.2f"/>' %
                (X0 + c * lado, Y0 + f * lado, lado + .02, lado + .02) for c, f in cs)
    return '<g transform="%s" %s>%s</g>' % (POS, extra, r), lado


def esquinas(dibujo, m=62):
    """Un mismo adorno clavado en las cuatro esquinas, girado hacia dentro."""
    return "".join('<g transform="translate(%d %d) rotate(%d)">%s</g>' % (x, y, r, dibujo)
                   for x, y, r in [(m, m, 0), (L - m, m, 90), (L - m, L - m, 180), (m, L - m, 270)])


def copo(x, y, r, color, w=2.2, op=1):
    brazos = "".join(
        '<g transform="rotate(%d)"><line x1="0" y1="0" x2="0" y2="%.1f"/>'
        '<line x1="0" y1="%.1f" x2="%.1f" y2="%.1f"/><line x1="0" y1="%.1f" x2="%.1f" y2="%.1f"/></g>'
        % (k * 60, -r, -r * .55, -r * .28, -r * .8, -r * .55, r * .28, -r * .8) for k in range(6))
    return ('<g transform="translate(%.1f %.1f)" stroke="%s" stroke-width="%.1f" '
            'stroke-linecap="round" opacity="%.2f">%s</g>' % (x, y, color, w, op, brazos))


# ============================ los mundos ============================
# Cada uno devuelve (defs, cuerpo). `p` es su prefijo de id.

def casa(p):
    # La de siempre (`icon.svg`), para comparar: menta maciza y tinta noche.
    return "", ('<rect width="512" height="512" fill="#5fe0b0"/>' + iso(p, fill="#131823"))


def talavera(p):
    # Loza blanca, cobalto y el ocre del esmalte de Puebla (#d99a1e: la
    # Talavera lleva amarillo, y el mundo no lo necesitaba porque no escribe
    # con él). El cobalto de la pieza lleva una veladura clara arriba, que es
    # lo que hace que se lea como vidriado y no como tinta plana.
    flor = ('<g fill="#1e3f8f">%s</g><circle r="7" fill="#d99a1e"/>' %
            "".join('<ellipse cx="0" cy="-15" rx="8" ry="14" transform="rotate(%d)"/>' % (k * 90)
                    for k in range(4)))
    greca = "".join('<rect x="%d" y="%d" width="12" height="12" fill="#1e3f8f" transform="rotate(45 %d %d)"/>'
                    % (x, 12, x + 6, 18) for x in range(26, 500, 32))
    defs = ('<linearGradient id="%s-vid" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="#fff" stop-opacity=".38"/>'
            '<stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient>' % p)
    cuerpo = ('<rect width="512" height="512" fill="#f4f1e8"/>'
              '<rect x="30" y="30" width="452" height="452" rx="14" fill="none" stroke="#1e3f8f" stroke-width="3" opacity=".55"/>'
              + greca + '<g transform="rotate(180 256 256)">' + greca + '</g>'
              + '<g transform="rotate(90 256 256)">' + greca + '</g><g transform="rotate(-90 256 256)">' + greca + '</g>'
              + esquinas(flor, 30)
              + iso(p, fill="#1e3f8f") + iso(p, fill="url(#%s-vid)" % p))
    return defs, cuerpo


def grabado(p):
    # Periódico, rayado a 52° y la segunda pasada en rojo. La plancha tiene la
    # sombra dura del mundo (7 px en una tarjeta; aquí, a escala de icono).
    defs = ('<pattern id="%s-ray" width="11" height="11" patternUnits="userSpaceOnUse" patternTransform="rotate(52)">'
            '<rect width="2.2" height="11" fill="#181410" opacity=".14"/></pattern>'
            '<filter id="%s-grano"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3"/>'
            '<feColorMatrix values="0 0 0 0 .09  0 0 0 0 .08  0 0 0 0 .06  0 0 0 .5 0"/></filter>' % (p, p))
    cuerpo = ('<rect width="512" height="512" fill="#e3ddcd"/>'
              '<rect width="512" height="512" fill="url(#%s-ray)"/>'
              '<rect width="512" height="512" filter="url(#%s-grano)" opacity=".35"/>' % (p, p)
              + '<g transform="translate(14 14)">' + iso(p, fill="#181410") + '</g>'
              + iso(p, fill="#a32615", stroke="#181410", stroke_width="%.2f" % (4 * PX)))
    return defs, cuerpo


def consola(p):
    # Fósforo sobre negro y las líneas del tubo encima de TODO, pieza incluida:
    # sin eso la pieza se ve pegada sobre la pantalla en vez de estar dentro.
    defs = ('<pattern id="%s-lin" width="8" height="8" patternUnits="userSpaceOnUse">'
            '<rect width="8" height="3" fill="#000" opacity=".42"/></pattern>'
            '<filter id="%s-fos" x="-30%%" y="-30%%" width="160%%" height="160%%"><feGaussianBlur stdDeviation="10"/></filter>'
            '<radialGradient id="%s-tubo" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/>'
            '<stop offset="1" stop-color="#000" stop-opacity=".75"/></radialGradient>' % (p, p, p))
    cuerpo = ('<rect width="512" height="512" fill="#030805"/>'
              + iso(p, fill="#3bff9e", filter="url(#%s-fos)" % p, opacity=".55")
              + iso(p, fill="#3bff9e")
              + '<rect width="512" height="512" fill="url(#%s-lin)"/>'
                '<rect width="512" height="512" fill="url(#%s-tubo)"/>' % (p, p))
    return defs, cuerpo


def neon(p):
    # Vidrio DOBLADO: la pieza no se rellena, se contornea, y el trazo de los
    # dos contornos (fuera y hueco) es el tubo. Tres pasadas: halo ancho,
    # tubo cian y el alma casi blanca.
    defs = ('<radialGradient id="%s-a" cx=".2" cy=".14" r=".7"><stop offset="0" stop-color="#ff2d96" stop-opacity=".42"/>'
            '<stop offset="1" stop-color="#ff2d96" stop-opacity="0"/></radialGradient>'
            '<radialGradient id="%s-b" cx=".84" cy=".84" r=".6"><stop offset="0" stop-color="#3cebff" stop-opacity=".3"/>'
            '<stop offset="1" stop-color="#3cebff" stop-opacity="0"/></radialGradient>'
            '<filter id="%s-halo" x="-30%%" y="-30%%" width="160%%" height="160%%"><feGaussianBlur stdDeviation="9"/></filter>'
            % (p, p, p))
    t = lambda w: "%.2f" % (w * PX)
    cuerpo = ('<rect width="512" height="512" fill="#08060f"/>'
              '<rect width="512" height="512" fill="url(#%s-a)"/><rect width="512" height="512" fill="url(#%s-b)"/>' % (p, p)
              + iso(p, fill="none", stroke="#3febff", stroke_width=t(18), filter="url(#%s-halo)" % p, opacity=".9")
              + iso(p, fill="none", stroke="#3febff", stroke_width=t(11), stroke_linejoin="round")
              + iso(p, fill="none", stroke="#eafcff", stroke_width=t(3.5), stroke_linejoin="round"))
    return defs, cuerpo


def cyber(p):
    # Amarillo ácido con la señal desdoblada (magenta y cian a los lados, como
    # el título del mundo) y una franja que se sale de sitio. Las cuatro
    # escuadras son las de la tarjeta: un visor, no un marco.
    defs = ('<clipPath id="%s-f"><rect x="0" y="292" width="512" height="30"/></clipPath>'
            '<clipPath id="%s-r"><path d="M0 0H512V292H0ZM0 322H512V512H0Z"/></clipPath>'
            '<radialGradient id="%s-c" cx=".8" cy=".15" r=".6"><stop offset="0" stop-color="#00e5ff" stop-opacity=".2"/>'
            '<stop offset="1" stop-color="#00e5ff" stop-opacity="0"/></radialGradient>'
            '<pattern id="%s-lin" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="1.5" fill="#fcee0a" opacity=".07"/></pattern>'
            % (p, p, p, p))
    esq = '<path d="M0 44V0H44" fill="none" stroke="#fcee0a" stroke-width="6"/><path d="M14 58V14" stroke="#fcee0a" stroke-width="2" opacity=".5"/>'
    regla = "".join('<rect x="%d" y="452" width="3" height="%d" fill="#fcee0a" opacity=".6"/>' % (x, 14 if i % 4 == 0 else 7)
                    for i, x in enumerate(range(176, 340, 10)))
    pieza = (iso(p, fill="#ff2e6e", transform="translate(-9 0)", opacity=".9")
             + iso(p, fill="#00e5ff", transform="translate(9 0)", opacity=".9")
             + iso(p, fill="#fcee0a"))
    cuerpo = ('<rect width="512" height="512" fill="#05070c"/>'
              '<rect width="512" height="512" fill="url(#%s-c)"/><rect width="512" height="512" fill="url(#%s-lin)"/>' % (p, p)
              + esquinas(esq, 40) + regla
              + '<g clip-path="url(#%s-r)">%s</g>' % (p, pieza)
              + '<g clip-path="url(#%s-f)"><g transform="translate(22 0)">%s</g></g>' % (p, pieza))
    return defs, cuerpo


def plano(p):
    # El negativo del plano: retícula de dos pesos, la pieza ACOTADA —línea
    # de medida arriba y a la derecha.
    # Es el único que se queda en contorno: nada está terminado.
    m = L / 2 - 144
    defs = ('<pattern id="%s-r" width="64" height="64" patternUnits="userSpaceOnUse">'
            '<path d="M16 0V64M32 0V64M48 0V64M0 16H64M0 32H64M0 48H64" stroke="#9fd0ff" stroke-width="1" opacity=".13"/>'
            '<path d="M0 0V64M0 0H64" stroke="#9fd0ff" stroke-width="2" opacity=".28"/></pattern>'
            '<marker id="%s-fl" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">'
            '<path d="M0 1L10 5L0 9Z" fill="#9fd0ff"/></marker>' % (p, p))
    a, b = m, L - m
    cotas = ('<g stroke="#9fd0ff" stroke-width="2.5" fill="none">'
             '<path d="M%.1f %.1fV%.1fM%.1f %.1fV%.1f" opacity=".6"/>' % (a, a - 14, a - 58, b, a - 14, a - 58)
             + '<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" marker-start="url(#%s-fl)" marker-end="url(#%s-fl)"/>' % (a + 2, a - 38, b - 2, a - 38, p, p)
             + '<path d="M%.1f %.1fH%.1fM%.1f %.1fH%.1f" opacity=".6"/>' % (b + 14, a, b + 58, b + 14, b, b + 58)
             + '<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" marker-start="url(#%s-fl)" marker-end="url(#%s-fl)"/></g>' % (b + 38, a + 2, b + 38, b - 2, p, p))
    cuerpo = ('<rect width="512" height="512" fill="#0d2b52"/><rect width="512" height="512" fill="url(#%s-r)"/>' % p
              + cotas
              + iso(p, fill="#9fd0ff", fill_opacity=".14", stroke="#eaf4ff", stroke_width="%.2f" % (5 * PX), stroke_linejoin="round"))
    return defs, cuerpo


def forja(p):
    # Acero pavonado con remaches, y la pieza al rojo: el degradado va del
    # amarillo de la fragua al naranja del mundo y a la brasa de abajo.
    defs = ('<linearGradient id="%s-ac" x1="0" y1="0" x2=".6" y2="1"><stop offset="0" stop-color="#2e2419"/>'
            '<stop offset=".55" stop-color="#1d1710"/><stop offset="1" stop-color="#120d08"/></linearGradient>'
            '<pattern id="%s-ce" width="512" height="5" patternUnits="userSpaceOnUse"><rect width="512" height="1" fill="#fff" opacity=".035"/></pattern>'
            '<linearGradient id="%s-rojo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe0a3"/>'
            '<stop offset=".38" stop-color="#ff9d3d"/><stop offset="1" stop-color="#c2410c"/></linearGradient>'
            '<radialGradient id="%s-rem" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#8a7556"/>'
            '<stop offset=".6" stop-color="#4a3b27"/><stop offset="1" stop-color="#241b10"/></radialGradient>'
            '<filter id="%s-cal" x="-30%%" y="-30%%" width="160%%" height="160%%"><feGaussianBlur stdDeviation="16"/></filter>'
            % (p, p, p, p, p))
    rem = '<circle r="15" fill="#0d0905" cx="2" cy="3"/><circle r="14" fill="url(#%s-rem)"/>' % p
    cuerpo = ('<rect width="512" height="512" fill="url(#%s-ac)"/><rect width="512" height="512" fill="url(#%s-ce)"/>' % (p, p)
              + '<rect x="26" y="26" width="460" height="460" fill="none" stroke="#6b5636" stroke-width="3" opacity=".6"/>'
              + esquinas(rem, 56)
              + iso(p, fill="#ff7a1a", filter="url(#%s-cal)" % p, opacity=".55")
              + '<g transform="translate(0 5)">' + iso(p, fill="#0d0905", opacity=".7") + '</g>'
              + iso(p, fill="url(#%s-rojo)" % p, stroke="#ffd08a", stroke_opacity=".5", stroke_width="%.2f" % (1.5 * PX)))
    return defs, cuerpo


def postit(p):
    # Una nota en el corcho, con su doblez y su cinta, y la pieza a pluma azul
    # con un temblor de mano (un desplazamiento pequeño, no un dibujo nuevo:
    # la silueta sigue siendo la del trazo). La nota es más chica que el
    # icono para que se vea que es una nota y no un fondo amarillo.
    defs = ('<linearGradient id="%s-n" x1="0" y1="0" x2=".2" y2="1"><stop offset="0" stop-color="#fdf5a8"/>'
            '<stop offset="1" stop-color="#f7e57c"/></linearGradient>'
            '<filter id="%s-pulso"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="4"/>'
            '<feDisplacementMap in="SourceGraphic" scale="5"/></filter>'
            '<filter id="%s-som" x="-20%%" y="-20%%" width="140%%" height="140%%"><feGaussianBlur stdDeviation="9"/></filter>'
            '<pattern id="%s-co" width="18" height="18" patternUnits="userSpaceOnUse">'
            '<circle cx="4" cy="5" r="1.6" fill="#8a6a3c" opacity=".35"/><circle cx="13" cy="13" r="1.2" fill="#5c4424" opacity=".3"/></pattern>'
            % (p, p, p, p))
    n0, n1 = 70, 442
    nota = ('<path d="M%d %dH%dV%dL%d %dH%dZ" fill="url(#%s-n)"/>' % (n0, n0, n1, n1 - 52, n1 - 52, n1, n0, p)
            + '<path d="M%d %dL%d %dQ%d %d %d %dZ" fill="#e0cc5c"/>' % (n1, n1 - 52, n1 - 52, n1, n1 - 40, n1 - 40, n1, n1 - 52))
    cuerpo = ('<rect width="512" height="512" fill="#c9a877"/><rect width="512" height="512" fill="url(#%s-co)"/>' % p
              + '<g transform="rotate(-3 256 256)">'
              + '<rect x="%d" y="%d" width="%d" height="%d" fill="#3a2a10" opacity=".45" filter="url(#%s-som)" transform="translate(6 12)"/>' % (n0, n0, n1 - n0, n1 - n0, p)
              + nota
              + '<g transform="translate(256 256) scale(.9) translate(-256 -256)" filter="url(#%s-pulso)">' % p
              + iso(p, fill="#1f5fa8") + '</g>'
              + '<rect x="196" y="50" width="120" height="38" fill="#fff" opacity=".5" transform="rotate(4 256 69)"/>'
              + '</g>')
    return defs, cuerpo


def arboleda(p):
    # Madera y hoja, con la regla del mundo: UNA capa orgánica. Los anillos
    # de la veta son lo ordenado (concéntricos) y la pieza es la hoja.
    defs = ('<radialGradient id="%s-f" cx=".5" cy="-.1" r="1.2"><stop offset="0" stop-color="#2c4a35"/>'
            '<stop offset=".35" stop-color="#16281c"/><stop offset=".7" stop-color="#0e1b13"/><stop offset="1" stop-color="#08110c"/></radialGradient>'
            '<linearGradient id="%s-h" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#c3f59f"/>'
            '<stop offset=".5" stop-color="#8fe36a"/><stop offset="1" stop-color="#4f9d38"/></linearGradient>' % (p, p))
    anillos = "".join('<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="none" stroke="#8fe36a" stroke-width="%.1f" opacity="%.3f"/>'
                      % (256 + math.sin(k) * 4, 256 + math.cos(k * 1.3) * 3, 40 + k * 26 + (k % 3) * 3,
                         38 + k * 25.5, 2 if k % 3 else 3.5, .1 - k * .005) for k in range(1, 13))
    cuerpo = ('<rect width="512" height="512" fill="url(#%s-f)"/>' % p + anillos
              + '<g transform="translate(0 6)">' + iso(p, fill="#040806", opacity=".6") + '</g>'
              + iso(p, fill="url(#%s-h)" % p))
    return defs, cuerpo


def obsidiana(p):
    # Vidrio volcánico tallado: la pieza lleva las facetas del mundo en corte
    # seco (el degradado de 124° con paradas duras), y un solo destello del
    # verde azulado que es su color en el catálogo.
    defs = ('<linearGradient id="%s-fac" x1="0" y1="0" x2="1" y2=".7">'
            '<stop offset=".0" stop-color="#f4f8fa"/><stop offset=".34" stop-color="#dfe6ea"/>'
            '<stop offset=".34" stop-color="#8e9aa3"/><stop offset=".62" stop-color="#a9b4bb"/>'
            '<stop offset=".62" stop-color="#c3ced5"/><stop offset="1" stop-color="#6e7a83"/></linearGradient>' % p)
    lascas = ('<path d="M0 0H300L0 230Z" fill="#12151a"/><path d="M512 512H170L512 250Z" fill="#101318"/>'
              '<path d="M512 0V210L330 0Z" fill="#0c0e12"/><path d="M0 512V300L150 512Z" fill="#0b0d10"/>'
              '<path d="M300 0L0 230M170 512L512 250M330 0L512 210M0 300L150 512" stroke="#333c44" stroke-width="1.5" opacity=".7"/>')
    cuerpo = ('<rect width="512" height="512" fill="#07080a"/>' + lascas
              + iso(p, fill="url(#%s-fac)" % p, stroke="#ffffff", stroke_opacity=".55", stroke_width="%.2f" % (1.5 * PX))
              + '<g transform="translate(372 140)" fill="#3fd0c9"><path d="M0 -22L4 -4L22 0L4 4L0 22L-4 4L-22 0L-4 -4Z"/></g>')
    return defs, cuerpo


def cenit(p):
    # Vidriera de cielo: el fondo son paños de vidrio añil con su plomo,
    # abiertos desde arriba como rayos, y la pieza es un vidrio de arena
    # emplomado.
    paños = []
    tonos = ["#191f4c", "#12163a", "#1c1f52", "#151a44", "#20245a", "#12163a", "#191f4c", "#1c1f52"]
    ang = [-90 + k * 22.5 for k in range(9)]
    for k in range(8):
        a1, a2 = math.radians(ang[k]), math.radians(ang[k + 1])
        paños.append('<path d="M256 -60L%.1f %.1fL%.1f %.1fZ" fill="%s"/>' %
                     (256 + 900 * math.sin(a1), -60 + 900 * math.cos(a1),
                      256 + 900 * math.sin(a2), -60 + 900 * math.cos(a2), tonos[k]))
    plomo = "".join('<line x1="256" y1="-60" x2="%.1f" y2="%.1f"/>' %
                    (256 + 900 * math.sin(math.radians(a)), -60 + 900 * math.cos(math.radians(a))) for a in ang)
    arcos = "".join('<circle cx="256" cy="-60" r="%d"/>' % r for r in (230, 420))
    defs = ('<linearGradient id="%s-ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf0d6"/>'
            '<stop offset="1" stop-color="#e2c690"/></linearGradient>' % p)
    cuerpo = ('<rect width="512" height="512" fill="#0c1030"/>' + "".join(paños)
              + '<g stroke="#070a20" stroke-width="7" fill="none">' + plomo + arcos + '</g>'
              + iso(p, fill="url(#%s-ar)" % p, stroke="#070a20", stroke_width="%.2f" % (8 * PX), paint_order="stroke"))
    return defs, cuerpo


def reliquia(p):
    # El de Fundador: terciopelo morado dentro de una vitrina con filete de
    # oro, y la pieza lila con su canto dorado, como algo que se guarda.
    defs = ('<radialGradient id="%s-t" cx=".5" cy="-.06" r="1.1"><stop offset="0" stop-color="#2a1f48"/>'
            '<stop offset=".44" stop-color="#130e22"/><stop offset="1" stop-color="#090612"/></radialGradient>'
            '<linearGradient id="%s-l" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#d9cbf7"/>'
            '<stop offset=".55" stop-color="#b7a2ea"/><stop offset="1" stop-color="#8c72cf"/></linearGradient>'
            '<linearGradient id="%s-oro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0d58f"/>'
            '<stop offset=".5" stop-color="#b8923f"/><stop offset="1" stop-color="#e3c374"/></linearGradient>'
            '<filter id="%s-lu" x="-30%%" y="-30%%" width="160%%" height="160%%"><feGaussianBlur stdDeviation="22"/></filter>'
            % (p, p, p, p))
    brillo = lambda x, y, r: '<path transform="translate(%d %d) scale(%.2f)" d="M0 -10L2 -2L10 0L2 2L0 10L-2 2L-10 0L-2 -2Z" fill="#f0d58f"/>' % (x, y, r)
    cuerpo = ('<rect width="512" height="512" fill="url(#%s-t)"/>' % p
              + '<rect x="34" y="34" width="444" height="444" rx="4" fill="none" stroke="url(#%s-oro)" stroke-width="5"/>' % p
              + '<rect x="50" y="50" width="412" height="412" rx="4" fill="none" stroke="#8a6d2f" stroke-width="1.5" opacity=".8"/>'
              + iso(p, fill="#b7a2ea", filter="url(#%s-lu)" % p, opacity=".35")
              + iso(p, fill="url(#%s-l)" % p, stroke="url(#%s-oro)" % p, stroke_width="%.2f" % (5 * PX), paint_order="stroke")
              + brillo(380, 118, 1.6) + brillo(132, 398, 1.1) + brillo(404, 382, .8))
    return defs, cuerpo


def catedral(p):
    # Gótico de píxel: un ventanal ojival de piedra con el vitral rojo e
    # índigo detrás, y la pieza pixelada en el rojo del mundo con la sombra
    # en tramado, que es como este mundo sombrea la piedra.
    pie, lado = pixel(24, p, fill="#ff3d4f")
    som, _ = pixel(24, p, fill="#5a0d18")
    defs = ('<pattern id="%s-tr" width="8" height="8" patternUnits="userSpaceOnUse">'
            '<rect width="4" height="4" fill="#000" opacity=".35"/><rect x="4" y="4" width="4" height="4" fill="#000" opacity=".35"/></pattern>'
            '<clipPath id="%s-oj"><path d="M86 512V250Q86 90 256 40Q426 90 426 250V512Z"/></clipPath>' % (p, p))
    vitral = "".join('<rect x="%d" y="%d" width="48" height="48" fill="%s"/>' %
                     (x, y, ["#2a1a4a", "#4a4d78", "#7a1426", "#1d2350", "#3a2a66"][(x // 48 * 3 + y // 48) % 5])
                     for x in range(72, 440, 48) for y in range(24, 520, 48))
    sillares = "".join('<rect x="%d" y="%d" width="%d" height="30" fill="none" stroke="#07080f" stroke-width="4"/>' %
                       (x + (16 if (y // 32) % 2 else 0), y, 64) for y in range(0, 512, 32) for x in range(-64, 512, 64))
    cuerpo = ('<rect width="512" height="512" fill="#262840"/>' + sillares
              + '<rect width="512" height="512" fill="url(#%s-tr)" opacity=".5"/>' % p
              + '<path d="M70 512V250Q70 76 256 22Q442 76 442 250V512Z" fill="#07080f"/>'
              + '<g clip-path="url(#%s-oj)">%s<g stroke="#07080f" stroke-width="6">%s</g></g>' % (p, vitral,
                  "".join('<path d="M%d 0V512"/>' % x for x in range(72, 440, 48)) + "".join('<path d="M0 %dH512"/>' % y for y in range(24, 520, 48)))
              + '<g transform="translate(%.2f %.2f)">%s</g>' % (lado * ESC * .5, lado * ESC * .5, som)
              + pie)
    return defs, cuerpo


def averno(p):
    # Hueso y sangre: la placa de corte a 45° con su bisel de hueso, la brasa
    # que sube desde abajo, y la pieza pixelada en sangre con el canto claro
    # arriba y el oscuro abajo (el bisel de sprite de la paleta Sangre).
    pie, lado = pixel(22, p, fill="#ff2d3f")
    luz, _ = pixel(22, p, fill="#efe9e3")
    som, _ = pixel(22, p, fill="#3a0209")
    d = lado * ESC * .28
    defs = ('<radialGradient id="%s-br" cx=".5" cy="1.15" r=".85"><stop offset="0" stop-color="#b3121f" stop-opacity=".85"/>'
            '<stop offset=".5" stop-color="#7a0f1c" stop-opacity=".35"/><stop offset="1" stop-color="#7a0f1c" stop-opacity="0"/></radialGradient>' % p)
    c = 60
    placa = 'M%d 26H%dL486 %dV%dL%d 486H%dL26 %dV%dZ' % (26 + c, 486 - c, 26 + c, 486 - c, 486 - c, 26 + c, 486 - c, 26 + c)
    brasas = "".join('<rect x="%d" y="%d" width="8" height="8" fill="#ff8a3d" opacity="%.2f"/>' % (x, y, o)
                     for x, y, o in [(96, 420, .8), (140, 452, .5), (400, 430, .7), (360, 462, .45), (430, 398, .35), (70, 380, .3)])
    cuerpo = ('<rect width="512" height="512" fill="#060506"/><rect width="512" height="512" fill="url(#%s-br)"/>' % p
              + '<path d="%s" fill="#100d0e" stroke="#3d3537" stroke-width="10"/>' % placa
              + '<path d="%s" fill="none" stroke="#efe9e3" stroke-width="2" opacity=".22" transform="translate(256 256) scale(.955) translate(-256 -256)"/>' % placa
              + brasas
              + '<g transform="translate(%.2f %.2f)">%s</g>' % (d, d, som)
              + '<g transform="translate(%.2f %.2f)">%s</g>' % (-d * .6, -d * .6, luz)
              + pie)
    return defs, cuerpo


def ventisca(p):
    # Frío con una hoguera: hielo arriba y la luz de la lumbre abajo, que
    # también le calienta el canto inferior a la pieza.
    defs = ('<radialGradient id="%s-f" cx=".5" cy="1.12" r="1.05"><stop offset="0" stop-color="#8a4a14"/>'
            '<stop offset=".48" stop-color="#17222c"/><stop offset="1" stop-color="#0d151d"/></radialGradient>'
            '<linearGradient id="%s-hi" x1="0" y1="0" x2=".2" y2="1"><stop offset="0" stop-color="#f4fbff"/>'
            '<stop offset=".45" stop-color="#8fd4ff"/><stop offset="1" stop-color="#4c8fc2"/></linearGradient>'
            '<linearGradient id="%s-lu" x1="0" y1="0" x2="0" y2="1"><stop offset=".6" stop-color="#ff9a3c" stop-opacity="0"/>'
            '<stop offset="1" stop-color="#ff9a3c" stop-opacity=".6"/></linearGradient>' % (p, p, p))
    copos = "".join(copo(x, y, r, "#eaf5fc", 2.4, o) for x, y, r, o in
                    [(78, 84, 22, .55), (430, 70, 16, .4), (452, 196, 11, .35), (60, 250, 12, .3), (120, 170, 8, .3), (380, 128, 9, .3)])
    cuerpo = ('<rect width="512" height="512" fill="url(#%s-f)"/>' % p + copos
              + iso(p, fill="url(#%s-hi)" % p, stroke="#f4fbff", stroke_opacity=".6", stroke_width="%.2f" % (1.5 * PX))
              + iso(p, fill="url(#%s-lu)" % p))
    return defs, cuerpo


def bastion(p):
    # Blindaje: una placa atornillada con sus juntas, y la pieza estampada en
    # relieve —luz arriba, sombra abajo— en el azul del mundo.
    defs = ('<linearGradient id="%s-pl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3540"/>'
            '<stop offset=".58" stop-color="#161d24"/><stop offset="1" stop-color="#1c252e"/></linearGradient>'
            '<linearGradient id="%s-az" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd3ff"/>'
            '<stop offset=".5" stop-color="#4db8ff"/><stop offset="1" stop-color="#1c78b8"/></linearGradient>'
            '<radialGradient id="%s-pe" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#7d8b98"/>'
            '<stop offset="1" stop-color="#2a333c"/></radialGradient>' % (p, p, p))
    perno = ('<circle r="17" fill="#0a0e12" cx="1" cy="3"/><circle r="16" fill="url(#%s-pe)"/>'
             '<path d="M-8 0H8" stroke="#141a20" stroke-width="3.5" stroke-linecap="round" transform="rotate(35)"/>' % p)
    juntas = ('<path d="M0 118H512M0 394H512" stroke="#0a0e12" stroke-width="4"/>'
              '<path d="M0 121H512M0 397H512" stroke="#3c4854" stroke-width="1.5" opacity=".8"/>')
    cuerpo = ('<rect width="512" height="512" fill="url(#%s-pl)"/>' % p + juntas + esquinas(perno, 52)
              + '<g transform="translate(0 7)">' + iso(p, fill="#06090c", opacity=".85") + '</g>'
              + '<g transform="translate(0 -3)">' + iso(p, fill="#a9dcff", opacity=".7") + '</g>'
              + iso(p, fill="url(#%s-az)" % p))
    return defs, cuerpo


def arcade(p):
    # El mundo secreto: la Norata de siempre (menta sobre la noche de la
    # casa) pasada por la cuadrícula. Arcade no trae colores, así que el icono
    # tampoco inventa uno: lleva los de la casa, con el bisel de sprite.
    pie, lado = pixel(16, p, fill="#5fe0b0")
    luz, _ = pixel(16, p, fill="#c9fbe6")
    som, _ = pixel(16, p, fill="#0b2e24")
    d = lado * ESC * .3
    estrellas = "".join('<rect x="%d" y="%d" width="%d" height="%d" fill="%s"/>' % (x, y, s, s, c)
                        for x, y, s, c in [(60, 72, 8, "#f5d76e"), (440, 96, 8, "#8ecdf5"), (96, 430, 8, "#ff8a70"),
                                           (416, 424, 8, "#5fe0b0"), (132, 128, 4, "#e8eef5"), (380, 160, 4, "#e8eef5"),
                                           (452, 300, 4, "#e8eef5"), (48, 300, 4, "#e8eef5"), (300, 470, 4, "#e8eef5")])
    defs = ('<pattern id="%s-lin" width="6" height="6" patternUnits="userSpaceOnUse">'
            '<rect width="6" height="2" fill="#000" opacity=".16"/></pattern>' % p)
    cuerpo = ('<rect width="512" height="512" fill="#10151d"/>' + estrellas
              + '<g transform="translate(%.2f %.2f)">%s</g>' % (d, d, som)
              + '<g transform="translate(%.2f %.2f)">%s</g>' % (-d * .5, -d * .5, luz)
              + pie + '<rect width="512" height="512" fill="url(#%s-lin)"/>' % p)
    return defs, cuerpo



# ======================= el logo del menú =======================
# PROPUESTA, no está en la app. Hoy el isotipo del menú va en `--marca-iso` y
# ningún mundo lo toca («un tema puede cambiarlo todo menos quién eres»,
# 0.7.54). Esto es cómo se vería si cada mundo lo vistiera igual que el icono
# de la app: la pieza cambia de material, la palabra «Norata» solo de tinta.
#
# El logotipo se lee de `index.html` (el botón `.side-brand`) y no se copia:
# así no hay dos versiones de la marca que puedan separarse.

def _logotipo():
    import re
    t = open(os.path.join(AQUI, "..", "..", "index.html"), encoding="utf-8").read()
    bloque = re.search(r'<span class="sb-logo-full"[^>]*>(.*?)</span>', t, re.S).group(1)
    g = re.search(r"<g>(.*?)</g>", bloque, re.S).group(1)
    iso_d = re.search(r'<path d="([^"]*)" fill="var\(--marca-iso\)"', bloque).group(1)
    return re.sub(r"\s+", " ", g).strip(), iso_d

PALABRA, _ISO_LOGO = _logotipo()
# Dónde cae el isotipo dentro del logotipo, para poner ahí el trazo de la
# marca (y su versión pixelada, que se muestrea sobre el trazo de 250).
_lx0, _ly0, _lx1, _ly1 = (lambda pts: (min(p[0] for p in pts), min(p[1] for p in pts),
                                       max(p[0] for p in pts), max(p[1] for p in pts)))(
    [q for poly in isotipo.contornos(_ISO_LOGO) for q in poly])
LESC = (_lx1 - _lx0) / (X1 - X0)
LPOS = "translate(%.3f %.3f) scale(%.5f)" % (_lx0 - X0 * LESC, _ly0 - Y0 * LESC, LESC)
LPX = 51 / 30          # a 30 px de alto, un píxel de pantalla en unidades del logo


def isl(p, **a):
    extra = " ".join('%s="%s"' % (k.rstrip("_").replace("_", "-"), v) for k, v in a.items())
    return '<use href="#%s-isl" %s/>' % (p, extra)


def lpixel(n, p, dx=0, dy=0, **a):
    lado, cs = isotipo.celdas(n)
    extra = " ".join('%s="%s"' % (k.rstrip("_").replace("_", "-"), v) for k, v in a.items())
    r = "".join('<rect x="%.2f" y="%.2f" width="%.2f" height="%.2f"/>' %
                (X0 + c * lado, Y0 + f * lado, lado + .05, lado + .05) for c, f in cs)
    return '<g transform="translate(%.2f %.2f) %s" %s>%s</g>' % (dx, dy, LPOS, extra, r)


def _grad(p, n, paradas, x2=0, y2=1):
    return ('<linearGradient id="%s-%s" x1="0" y1="0" x2="%s" y2="%s">%s</linearGradient>' %
            (p, n, x2, y2, "".join('<stop offset="%s" stop-color="%s"/>' % o for o in paradas)))


def pieza_menu(id_, p):
    """(defs, dibujo) del isotipo del menú en el mundo `id_`. Es el mismo
    material que el icono de la app, reducido a lo que se lee a 30 px: sin
    fondo, sin adornos alrededor, y nada en el hueco."""
    u = LPX
    if id_ == "talavera":
        return (_grad(p, "v", [("0", "#4a6cc0"), (".5", "#1e3f8f"), ("1", "#15306f")]),
                isl(p, fill="url(#%s-v)" % p))
    if id_ == "grabado":
        return "", (isl(p, fill="#181410", transform="translate(%.2f %.2f)" % (2 * u, 2 * u))
                    + isl(p, fill="#a32615", stroke="#181410", stroke_width="%.2f" % (.9 * u)))
    if id_ == "consola":
        return ('<filter id="%s-f" x="-40%%" y="-40%%" width="180%%" height="180%%"><feGaussianBlur stdDeviation="1.4"/></filter>' % p,
                isl(p, fill="#3bff9e", filter="url(#%s-f)" % p, opacity=".7") + isl(p, fill="#3bff9e"))
    if id_ == "neon":
        return ('<filter id="%s-f" x="-40%%" y="-40%%" width="180%%" height="180%%"><feGaussianBlur stdDeviation="1.3"/></filter>' % p,
                isl(p, fill="none", stroke="#3febff", stroke_width="%.2f" % (3.4 * u), filter="url(#%s-f)" % p)
                + isl(p, fill="none", stroke="#3febff", stroke_width="%.2f" % (2 * u), stroke_linejoin="round")
                + isl(p, fill="none", stroke="#eafcff", stroke_width="%.2f" % (.7 * u), stroke_linejoin="round"))
    if id_ == "cyber":
        return "", (isl(p, fill="#ff2e6e", transform="translate(%.2f 0)" % (-1.3 * u))
                    + isl(p, fill="#00e5ff", transform="translate(%.2f 0)" % (1.3 * u))
                    + isl(p, fill="#fcee0a"))
    if id_ == "plano":
        return "", isl(p, fill="#9fd0ff", fill_opacity=".16", stroke="#eaf4ff",
                       stroke_width="%.2f" % (1.2 * u), stroke_linejoin="round")
    if id_ == "forja":
        return (_grad(p, "r", [("0", "#ffe0a3"), (".4", "#ff9d3d"), ("1", "#c2410c")])
                + '<filter id="%s-f" x="-40%%" y="-40%%" width="180%%" height="180%%"><feGaussianBlur stdDeviation="2.2"/></filter>' % p,
                isl(p, fill="#ff7a1a", filter="url(#%s-f)" % p, opacity=".45") + isl(p, fill="url(#%s-r)" % p))
    if id_ == "postit":
        return ('<filter id="%s-f"><feTurbulence type="fractalNoise" baseFrequency=".18" numOctaves="2" seed="4"/>'
                '<feDisplacementMap in="SourceGraphic" scale="1.1"/></filter>' % p,
                isl(p, fill="#1f5fa8", filter="url(#%s-f)" % p))
    if id_ == "arboleda":
        return (_grad(p, "h", [("0", "#c3f59f"), (".5", "#8fe36a"), ("1", "#4f9d38")], .3),
                isl(p, fill="url(#%s-h)" % p))
    if id_ == "obsidiana":
        return (_grad(p, "o", [("0", "#f4f8fa"), (".34", "#dfe6ea"), (".34", "#8e9aa3"), (".62", "#a9b4bb"),
                               (".62", "#c3ced5"), ("1", "#6e7a83")], 1, .7),
                isl(p, fill="url(#%s-o)" % p, stroke="#fff", stroke_opacity=".5", stroke_width="%.2f" % (.5 * u)))
    if id_ == "cenit":
        return (_grad(p, "a", [("0", "#fbf0d6"), ("1", "#e2c690")]),
                isl(p, fill="url(#%s-a)" % p, stroke="#070a20", stroke_width="%.2f" % (1.4 * u), paint_order="stroke"))
    if id_ == "reliquia":
        return (_grad(p, "l", [("0", "#d9cbf7"), (".55", "#b7a2ea"), ("1", "#8c72cf")], .4)
                + _grad(p, "o", [("0", "#f0d58f"), (".5", "#b8923f"), ("1", "#e3c374")], 1, 1),
                isl(p, fill="url(#%s-l)" % p, stroke="url(#%s-o)" % p, stroke_width="%.2f" % (1.3 * u), paint_order="stroke"))
    if id_ == "catedral":
        d = 48.5 / 14 * .5
        return "", lpixel(14, p, d, d, fill="#5a0d18") + lpixel(14, p, fill="#ff3d4f")
    if id_ == "averno":
        d = 48.5 / 12 * .3
        return "", (lpixel(12, p, d, d, fill="#3a0209") + lpixel(12, p, -d * .6, -d * .6, fill="#efe9e3")
                    + lpixel(12, p, fill="#ff2d3f"))
    if id_ == "ventisca":
        return (_grad(p, "h", [("0", "#f4fbff"), (".45", "#8fd4ff"), ("1", "#4c8fc2")], .2)
                + '<linearGradient id="%s-u" x1="0" y1="0" x2="0" y2="1"><stop offset=".6" stop-color="#ff9a3c" stop-opacity="0"/>'
                  '<stop offset="1" stop-color="#ff9a3c" stop-opacity=".6"/></linearGradient>' % p,
                isl(p, fill="url(#%s-h)" % p) + isl(p, fill="url(#%s-u)" % p))
    if id_ == "bastion":
        return (_grad(p, "a", [("0", "#8fd3ff"), (".5", "#4db8ff"), ("1", "#1c78b8")]),
                isl(p, fill="#06090c", transform="translate(0 %.2f)" % (1.4 * u), opacity=".85")
                + isl(p, fill="#a9dcff", transform="translate(0 %.2f)" % (-.6 * u), opacity=".7")
                + isl(p, fill="url(#%s-a)" % p))
    if id_ == "arcade":
        d = 48.5 / 12 * .3
        return "", (lpixel(12, p, d, d, fill="#0b2e24") + lpixel(12, p, -d * .5, -d * .5, fill="#c9fbe6")
                    + lpixel(12, p, fill="#5fe0b0"))
    return "", isl(p, fill="#5fe0b0")          # casa


def logo_menu(id_, p, tinta, solo_iso=False):
    """El logotipo del menú vestido por el mundo. `solo_iso` da el de la
    barra plegada: el mismo dibujo con la caja recortada a la pieza."""
    defs, pieza = pieza_menu(id_, p)
    caja = "%.2f %.2f %.2f %.2f" % (_lx0 - 3, _ly0 - 3, _lx1 - _lx0 + 6, _ly1 - _ly0 + 6) if solo_iso else "24 32 205 55"
    palabra = "" if solo_iso else '<g fill="%s" style="color:%s">%s</g>' % (tinta, tinta, PALABRA)
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="%s" overflow="visible"><defs>'
            '<path id="%s-isl" d="%s" transform="%s" fill-rule="evenodd"/>%s</defs>%s%s</svg>'
            % (caja, p, isotipo.D, LPOS, defs, pieza, palabra))


def barra(id_):
    """Los tonos de la barra lateral de cada mundo, sacados de sus tokens."""
    import sys
    sys.path.insert(0, os.path.join(AQUI, ".."))
    import datos
    casa = dict(bg="#10151d", panel="#1d2530", text="#f7f8fa", muted="#8b97a8", acento="#5fe0b0",
                acento_t="#5fe0b0", velo="rgba(95,224,176,.12)", linea="#2a3442")
    if id_ in ("casa", "arcade"):
        return casa
    t = next(m for m in datos.MUNDOS if m["id"] == id_)["tokens"]
    return dict(bg=t["--m-pagina"], panel=t["--m-tarjeta"], text=t["--m-tinta"], muted=t["--m-tinta-2"],
                acento=t["--m-acento"], acento_t=t.get("--m-acento-tinta", t["--m-acento"]),
                velo=t["--m-acento-velo"], linea=t.get("--m-borde-color", "transparent")
                if t.get("--m-borde-color") not in (None, "transparent") else "rgba(128,128,128,.25)")

MUNDOS = [
    ("casa", "Norata", "La de siempre", casa),
    ("talavera", "Talavera", "Loza vidriada", talavera),
    ("grabado", "Grabado", "El de las calaveras", grabado),
    ("consola", "Consola", "Gratis, siempre", consola),
    ("neon", "Neón", "Todo redondo", neon),
    ("cyber", "Cyberpunk", "Visor, no marco", cyber),
    ("plano", "Blueprint", "Nada está terminado", plano),
    ("forja", "Forja", "El buque insignia", forja),
    ("postit", "Post-it", "Una nota en el corcho", postit),
    ("arboleda", "Arboleda", "Madera y hoja", arboleda),
    ("obsidiana", "Obsidiana", "El oscuro elegante", obsidiana),
    ("cenit", "Cénit", "Plomo y cielo", cenit),
    ("reliquia", "Reliquia", "El de Fundador", reliquia),
    ("catedral", "Catedral", "Vitral y rosetón", catedral),
    ("averno", "Averno", "Hueso y sangre", averno),
    ("ventisca", "Ventisca", "Frío con una hoguera", ventisca),
    ("bastion", "Bastión", "Blindaje", bastion),
    ("arcade", "Arcade", "El secreto", arcade),
]


def svg(id_, fn, prefijo=None):
    p = prefijo or id_
    defs, cuerpo = fn(p)
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">'
            '<defs><path id="%s-iso" d="%s" transform="%s" fill-rule="evenodd"/>%s</defs>%s</svg>'
            % (p, isotipo.D, POS, defs, cuerpo))


NAV_RESUMEN = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.2"/><path d="M15.5 8.5l-2.2 5-5 2.2 2.2-5z"/></svg>'
NAV_MISIONES = '<svg viewBox="0 0 24 24"><path d="M4 6.5l2 2 3.5-3.5M4 14.5l2 2 3.5-3.5M13 7h7M13 15h7"/></svg>'
NAV_HAB = '<svg viewBox="0 0 24 24"><path d="M5 19V11M12 19V5M19 19v-5"/></svg>'
PANEL = '<svg viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="15" rx="3.5"/><path d="M9.5 4.5v15"/></svg>'


def maqueta_barra(id_, p, plegada=False, corta=False):
    """La barra lateral de la app, solo lo de arriba, en los tonos del mundo."""
    b = barra(id_)
    estilo = ";".join("--b-%s:%s" % (k.replace("_", "-"), v) for k, v in b.items())
    if plegada:
        return ('<div class="barra plegada" style="%s"><div class="b-marca">%s</div>'
                '<div class="b-item on">%s</div><div class="b-item">%s</div><div class="b-item">%s</div></div>'
                % (estilo, logo_menu(id_, p, b["text"], True), NAV_RESUMEN, NAV_MISIONES, NAV_HAB))
    items = '<div class="b-item on">%sResumen</div><div class="b-item">%sMisiones</div>' % (NAV_RESUMEN, NAV_MISIONES)
    if not corta:
        items += '<div class="b-item">%sHabilidades</div>' % NAV_HAB
    return ('<div class="barra" style="%s"><div class="b-top"><div class="b-logo">%s</div>'
            '<span class="b-panel">%s</span></div>%s</div>' % (estilo, logo_menu(id_, p, b["text"]), PANEL, items))


def pagina():
    rejilla = "".join(
        '<button class="mundo" type="button" data-id="%s" aria-pressed="false">'
        '<span class="ico">%s</span><span class="nom">%s</span><span class="lla">%s</span></button>'
        % (i, svg(i, fn, i + "g"), html.escape(n), html.escape(ll)) for i, n, ll, fn in MUNDOS)
    detalles = "".join(
        '<article class="detalle" data-id="%s" hidden>'
        '<header><h3>%s</h3><p>%s</p></header>'
        '<div class="d-cuerpo">'
        '<div class="d-app"><span class="etq">Icono de la app</span>'
        '<div class="d-grande">%s</div>'
        '<div class="d-mascaras"><figure><div class="m-circ">%s</div><figcaption>Android</figcaption></figure>'
        '<figure><div class="m-ios">%s</div><figcaption>iOS · 60 px</figcaption></figure>'
        '<figure><div class="m-mini">%s</div><figcaption>32 px</figcaption></figure></div></div>'
        '<div class="d-menu"><span class="etq">El menú, con este mundo</span>'
        '<div class="d-barras">%s%s</div></div>'
        '</div></article>'
        % (i, html.escape(n), html.escape(ll), svg(i, fn, i + "d"), svg(i, fn, i + "c"), svg(i, fn, i + "s"),
           svg(i, fn, i + "t"), maqueta_barra(i, i + "e"), maqueta_barra(i, i + "p", plegada=True))
        for i, n, ll, fn in MUNDOS)
    menus = "".join(
        '<figure class="m-carta">%s<figcaption>%s</figcaption></figure>'
        % (maqueta_barra(i, i + "m", corta=True), html.escape(n)) for i, n, ll, fn in MUNDOS)
    t = open(os.path.join(AQUI, "vista.plantilla.html"), encoding="utf-8").read()
    return t.replace("<!--REJILLA-->", rejilla).replace("<!--DETALLES-->", detalles).replace("<!--MENUS-->", menus)


if __name__ == "__main__":
    os.makedirs(os.path.join(AQUI, "svg"), exist_ok=True)
    for id_, nombre, llave, fn in MUNDOS:
        with open(os.path.join(AQUI, "svg", id_ + ".svg"), "w", encoding="utf-8") as f:
            f.write(svg(id_, fn) + "\n")
        with open(os.path.join(AQUI, "svg", "menu-" + id_ + ".svg"), "w", encoding="utf-8") as f:
            f.write(logo_menu(id_, id_, barra(id_)["text"]) + "\n")
    with open(os.path.join(AQUI, "vista.html"), "w", encoding="utf-8") as f:
        f.write(pagina())
    print("%d iconos y %d logos de menú" % (len(MUNDOS), len(MUNDOS)))
