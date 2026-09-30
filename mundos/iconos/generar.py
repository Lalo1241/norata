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
   264 de 512: su punto más lejano cae a 167 px del centro, dentro del
   círculo del 80 % (205 px) que
   `maskable` garantiza. **Y nada importante va en las esquinas del
   cuadrado**: un icono casi siempre se ve redondo, y lo que vivía ahí (el
   filete de Reliquia, los remaches de Forja, las escuadras de Cyberpunk, el
   doblez del Post-it) se perdía entero. Los marcos son aros y los adornos
   van entre la pieza (167) y el círculo seguro (205), con `en_aro`.
3. **El hueco del centro no lleva nada.** Es lo que hace del isotipo un
   marco, y por él solo se ve el suelo del mundo. La primera tanda puso ahí
   una flor, un astro, un cursor, una hoja y un copo, y Eduardo los quitó:
   con algo dentro, la pieza deja de leerse como la marca.

Los tonos salen de `mundos/datos.py` y de las paletas de Catedral y Averno;
donde un mundo no tenía el tono (el ocre de Talavera, el brillo del metal),
está apuntado junto a su dibujo."""
import os, re, math, html
import isotipo

AQUI = os.path.dirname(os.path.abspath(__file__))
L = 512
X0, Y0, X1, Y1 = isotipo.caja()
# 264 de 512 y no 288: a 288 la pieza llegaba a 182 px del centro y no
# dejaba sitio para un marco dentro del círculo que se ve con la máscara
# redonda (el aro de Talavera y el octógono de Averno salían mordidos).
ESC = 264 / (X1 - X0)
CX, CY = (X0 + X1) / 2, (Y0 + Y1) / 2
POS = "translate(%.3f %.3f) scale(%.4f)" % (L / 2 - CX * ESC, L / 2 - CY * ESC, ESC)
# Un píxel de pantalla en unidades del isotipo, para dar trazos en px.
PX = 1 / ESC


def iso(p, **a):
    """El isotipo, en su sitio. `p` es el prefijo del mundo: al meter los
    diecisiete en una misma página los id no pueden chocar."""
    extra = " ".join('%s="%s"' % (k.rstrip("_").replace("_", "-"), v) for k, v in a.items())
    return '<use href="#%s-iso" %s/>' % (p, extra)


def _tiras(cs, lado):
    """Las celdas, juntadas en tiras por fila y un pelo solapadas. Celda por
    celda, el suavizado del borde dejaba una rejilla de rayas claras dentro
    de cada píxel grande: se veía como una malla y no como un bloque."""
    filas = {}
    for c, f in cs:
        filas.setdefault(f, []).append(c)
    sol = lado * .06
    out = []
    for f, cols in sorted(filas.items()):
        cols.sort()
        ini = prev = cols[0]
        for c in cols[1:] + [None]:
            if c is not None and c == prev + 1:
                prev = c
                continue
            out.append('<rect x="%.2f" y="%.2f" width="%.2f" height="%.2f"/>' %
                       (X0 + ini * lado, Y0 + f * lado, (prev - ini + 1) * lado + sol, lado + sol))
            if c is not None:
                ini = prev = c
    return "".join(out)


def pixel(n, p, **a):
    """El isotipo pixelado: el mismo trazo muestreado en n×n celdas."""
    lado, cs = isotipo.celdas(n)
    extra = " ".join('%s="%s"' % (k.rstrip("_").replace("_", "-"), v) for k, v in a.items())
    return '<g transform="%s" %s>%s</g>' % (POS, extra, _tiras(cs, lado)), lado


def en_aro(dibujo, r, angulos=(45, 135, 225, 315), girar=True):
    """Un adorno repetido sobre un círculo alrededor del centro. Es lo que
    sustituye a las esquinas: un icono casi siempre se ve redondo —la máscara
    de Android es un círculo y la de iOS una esquina muy abierta—, y lo que
    va en la esquina del cuadrado se pierde entero. Entre 180 y 205 queda
    fuera de la pieza y dentro de cualquier máscara."""
    return "".join('<g transform="translate(%.1f %.1f)%s">%s</g>' % (
        256 + r * math.cos(math.radians(a)), 256 + r * math.sin(math.radians(a)),
        " rotate(%d)" % (a + 135) if girar else "", dibujo) for a in angulos)


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
    # La de siempre, con los colores al revés que `icon.svg`: la pieza en la
    # menta de la marca sobre la noche de la app. Lo pidió Eduardo al ver los
    # diecisiete juntos: con el fondo menta era el único claro y macizo de la
    # fila, y así el isotipo sale igual que en el menú.
    return "", ('<rect width="512" height="512" fill="#131823"/>' + iso(p, fill="#5fe0b0"))


def talavera(p):
    # Loza blanca, cobalto y el ocre del esmalte de Puebla (#d99a1e: la
    # Talavera lleva amarillo, y el mundo no lo necesitaba porque no escribe
    # con él). El cobalto de la pieza lleva una veladura clara arriba, que es
    # lo que hace que se lea como vidriado y no como tinta plana.
    # La greca va en aro, como la cenefa del filo de un plato: en las cuatro
    # orillas del cuadrado se la comía la máscara redonda.
    greca = en_aro('<rect x="-6" y="-6" width="12" height="12" fill="#1e3f8f" transform="rotate(45)"/>',
                   196, range(0, 360, 12), girar=False)
    puntos = en_aro('<circle r="4" fill="#d99a1e"/>', 196, range(6, 360, 12), girar=False)
    defs = ('<linearGradient id="%s-vid" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="#fff" stop-opacity=".38"/>'
            '<stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient>' % p)
    cuerpo = ('<rect width="512" height="512" fill="#f4f1e8"/>'
              '<circle cx="256" cy="256" r="180" fill="none" stroke="#1e3f8f" stroke-width="2.5" opacity=".5"/>'
              + greca + puntos
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
    # Las escuadras abrazan la pieza, no el cuadrado: clavadas a la esquina
    # del icono, la máscara redonda se las llevaba enteras.
    esq = '<path d="M0 40V0H40" fill="none" stroke="#fcee0a" stroke-width="6"/>'
    regla = "".join('<rect x="%d" y="416" width="3" height="%d" fill="#fcee0a" opacity=".6"/>' % (x, 14 if i % 4 == 0 else 7)
                    for i, x in enumerate(range(196, 320, 10)))
    pieza = (iso(p, fill="#ff2e6e", transform="translate(-9 0)", opacity=".9")
             + iso(p, fill="#00e5ff", transform="translate(9 0)", opacity=".9")
             + iso(p, fill="#fcee0a"))
    cuerpo = ('<rect width="512" height="512" fill="#05070c"/>'
              '<rect width="512" height="512" fill="url(#%s-c)"/><rect width="512" height="512" fill="url(#%s-lin)"/>' % (p, p)
              + esquinas(esq, 106) + regla
              + '<g clip-path="url(#%s-r)">%s</g>' % (p, pieza)
              + '<g clip-path="url(#%s-f)"><g transform="translate(22 0)">%s</g></g>' % (p, pieza))
    return defs, cuerpo


def plano(p):
    # El negativo del plano: retícula de dos pesos y la pieza en contorno,
    # que es el único que se queda así: nada está terminado. Llevaba sus
    # líneas de medida arriba y a la derecha, y Eduardo las quitó.
    defs = ('<pattern id="%s-r" width="64" height="64" patternUnits="userSpaceOnUse">'
            '<path d="M16 0V64M32 0V64M48 0V64M0 16H64M0 32H64M0 48H64" stroke="#9fd0ff" stroke-width="1" opacity=".13"/>'
            '<path d="M0 0V64M0 0H64" stroke="#9fd0ff" stroke-width="2" opacity=".28"/></pattern>' % p)
    cuerpo = ('<rect width="512" height="512" fill="#0d2b52"/><rect width="512" height="512" fill="url(#%s-r)"/>' % p
              # El canto en blanco y a 10 px: a 5 y en celeste pálido se perdía
              # contra la retícula, sobre todo en el menú.
              + iso(p, fill="#9fd0ff", fill_opacity=".2", stroke="#ffffff", stroke_width="%.2f" % (10 * PX), stroke_linejoin="round"))
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
              + '<circle cx="256" cy="256" r="196" fill="none" stroke="#6b5636" stroke-width="3" opacity=".6"/>'
              + en_aro(rem, 196, girar=False)
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
    # La nota cabe entera en el círculo: el doblez de abajo a la derecha es
    # lo que la hace nota, y en la esquina del icono se lo comía la máscara.
    n0, n1 = 104, 408
    nota = ('<path d="M%d %dH%dV%dL%d %dH%dZ" fill="url(#%s-n)"/>' % (n0, n0, n1, n1 - 52, n1 - 52, n1, n0, p)
            + '<path d="M%d %dL%d %dQ%d %d %d %dZ" fill="#e0cc5c"/>' % (n1, n1 - 52, n1 - 52, n1, n1 - 40, n1 - 40, n1, n1 - 52))
    cuerpo = ('<rect width="512" height="512" fill="#c9a877"/><rect width="512" height="512" fill="url(#%s-co)"/>' % p
              + '<g transform="rotate(-3 256 256)">'
              + '<rect x="%d" y="%d" width="%d" height="%d" fill="#3a2a10" opacity=".45" filter="url(#%s-som)" transform="translate(6 12)"/>' % (n0, n0, n1 - n0, n1 - n0, p)
              + nota
              + '<g transform="translate(256 256) scale(.8) translate(-256 -256)" filter="url(#%s-pulso)">' % p
              + iso(p, fill="#1f5fa8") + '</g>'
              + '<rect x="204" y="86" width="104" height="34" fill="#fff" opacity=".5" transform="rotate(4 256 103)"/>'
              + '</g>')
    return defs, cuerpo


def arboleda(p):
    # Madera y hoja, con la regla del mundo: UNA capa orgánica. Los anillos
    # de la veta son lo ordenado (concéntricos) y la pieza es la hoja.
    defs = ('<radialGradient id="%s-f" cx=".5" cy="-.1" r="1.2"><stop offset="0" stop-color="#2c4a35"/>'
            '<stop offset=".35" stop-color="#16281c"/><stop offset=".7" stop-color="#0e1b13"/><stop offset="1" stop-color="#08110c"/></radialGradient>'
            '<linearGradient id="%s-h" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#c3f59f"/>'
            '<stop offset=".5" stop-color="#8fe36a"/><stop offset="1" stop-color="#4f9d38"/></linearGradient>' % (p, p))
    # Cuatro anillos y todos por FUERA de la pieza: eran doce, y los de
    # dentro se veían por el hueco, que va vacío.
    anillos = "".join('<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="none" stroke="#8fe36a" stroke-width="%.1f" opacity="%.3f"/>'
                      % (256 + math.sin(k) * 3, 256 + math.cos(k * 1.3) * 3, r, r - 2, w, o)
                      for k, (r, w, o) in enumerate([(192, 2.5, .1), (226, 3.5, .08), (262, 2.5, .07), (300, 3, .06)]))
    cuerpo = ('<rect width="512" height="512" fill="url(#%s-f)"/>' % p + anillos
              + '<g transform="translate(0 6)">' + iso(p, fill="#040806", opacity=".6") + '</g>'
              + iso(p, fill="url(#%s-h)" % p))
    return defs, cuerpo


def obsidiana(p):
    # Vidrio volcánico PULIDO: la pieza maciza en plata, con un degradado
    # suave y un reflejo arriba, sobre un suelo carbón que se abre en el
    # centro. Hubo una versión tallada —facetas en corte seco y lascas en el
    # fondo— y Eduardo la paró: a tamaño de icono las paradas duras se leían
    # como un fallo de dibujo, no como una talla. Y vidrio negro con el canto
    # de plata tampoco: se leía como un contorno, que es lo de Blueprint.
    defs = ('<radialGradient id="%s-s" cx=".5" cy=".42" r=".7"><stop offset="0" stop-color="#1f252c"/>'
            '<stop offset=".6" stop-color="#0f1216"/><stop offset="1" stop-color="#060708"/></radialGradient>'
            '<linearGradient id="%s-v" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="#3b444d"/>'
            '<stop offset=".5" stop-color="#161a1f"/><stop offset="1" stop-color="#0a0c0e"/></linearGradient>'
            '<linearGradient id="%s-c" x1="0" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="#eef3f5"/>'
            '<stop offset=".5" stop-color="#b3bec6"/><stop offset="1" stop-color="#6c7883"/></linearGradient>'
            '<linearGradient id="%s-r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".3"/>'
            '<stop offset=".42" stop-color="#fff" stop-opacity="0"/></linearGradient>' % (p, p, p, p))
    cuerpo = ('<rect width="512" height="512" fill="url(#%s-s)"/>' % p
              + '<g transform="translate(0 8)">' + iso(p, fill="#000", opacity=".55") + '</g>'
              + iso(p, fill="url(#%s-c)" % p, stroke="#ffffff", stroke_opacity=".35", stroke_width="%.2f" % (1.5 * PX))
              + iso(p, fill="url(#%s-r)" % p))
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
    # El de Fundador: terciopelo morado y la pieza lila con su canto dorado,
    # como algo que se guarda. Llevó una vitrina —primero un filete cuadrado,
    # luego un medallón— y las dos quedaban pegadas a la pieza; Eduardo la
    # quitó. Lo que queda de ella es el oro del canto.
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
              + iso(p, fill="#b7a2ea", filter="url(#%s-lu)" % p, opacity=".35")
              + iso(p, fill="url(#%s-l)" % p, stroke="url(#%s-oro)" % p, stroke_width="%.2f" % (5 * PX), paint_order="stroke")
              + brillo(392, 104, 1.5) + brillo(118, 410, 1.1))
    return defs, cuerpo


def catedral(p):
    # Gótico de píxel, con el fondo LISO: piedra oscura y la luz roja del
    # vitral cayendo desde arriba, sin dibujar el vitral. La primera versión
    # llevaba el ventanal ojival con sus paños y los sillares del muro, y
    # Eduardo la paró: ensuciaba el icono. Lo gótico lo pone la pieza en
    # píxel con su sombra, no el decorado.
    pie, lado = pixel(24, p, fill="#ff3d4f")
    som, _ = pixel(24, p, fill="#4a0a14")
    defs = ('<linearGradient id="%s-pi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#23243a"/>'
            '<stop offset="1" stop-color="#0d0e18"/></linearGradient>'
            '<radialGradient id="%s-luz" cx=".5" cy="0" r=".8"><stop offset="0" stop-color="#ff3d4f" stop-opacity=".28"/>'
            '<stop offset=".6" stop-color="#4a4d78" stop-opacity=".12"/><stop offset="1" stop-color="#4a4d78" stop-opacity="0"/></radialGradient>' % (p, p))
    cuerpo = ('<rect width="512" height="512" fill="url(#%s-pi)"/><rect width="512" height="512" fill="url(#%s-luz)"/>' % (p, p)
              + '<g transform="translate(%.2f %.2f)">%s</g>' % (lado * ESC * .5, lado * ESC * .5, som)
              + pie)
    return defs, cuerpo


def averno(p):
    # Hueso y sangre, con fondo simple: negro que se enrojece hacia abajo en
    # franjas de píxel —el cielo de un juego de 8 bits, sin degradado suave—,
    # un puñado de brasas sueltas abajo, fuera de la pieza, y la pieza en
    # sangre con el canto de hueso arriba y el oscuro abajo. Llevó una placa
    # octogonal de piedra y Eduardo la quitó: se veía fea y pesaba en las
    # esquinas.
    pie, lado = pixel(22, p, fill="#ff2d3f")
    luz, _ = pixel(22, p, fill="#efe9e3")
    som, _ = pixel(22, p, fill="#3a0209")
    d = lado * ESC * .28
    franjas = ["#060506", "#0b0607", "#120709", "#1a080c", "#24090f", "#300a13"]
    cielo = "".join('<rect x="0" y="%d" width="512" height="%d" fill="%s"/>' % (256 + k * 44, 45, c)
                    for k, c in enumerate(franjas))
    brasas = "".join('<rect x="%d" y="%d" width="10" height="10" fill="#ff8a3d" opacity="%.2f"/>' % (x, y, o)
                     for x, y, o in [(150, 430, .85), (200, 456, .5), (336, 440, .75), (296, 470, .45), (390, 412, .4)])
    cuerpo = ('<rect width="512" height="512" fill="#060506"/>' + cielo + brasas
              + '<g transform="translate(%.2f %.2f)">%s</g>' % (d, d, som)
              + '<g transform="translate(%.2f %.2f)">%s</g>' % (-d * .6, -d * .6, luz)
              + pie)
    return "", cuerpo


def ventisca(p):
    # Frío con una hoguera, y el frío es VIENTO: la nieve cruza el icono en
    # rachas inclinadas, gruesas y largas, que es lo que se sigue leyendo a
    # 40 px. La primera versión llevaba copos sueltos, y a tamaño de icono
    # eran motas que no se distinguían de ruido. Abajo, la loma de nieve y
    # la lumbre detrás, que también le calienta el canto inferior a la pieza.
    defs = ('<linearGradient id="%s-f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1a28"/>'
            '<stop offset=".62" stop-color="#1a2c3b"/><stop offset="1" stop-color="#2a2a2c"/></linearGradient>'
            '<radialGradient id="%s-lum" cx=".5" cy="1" r=".55"><stop offset="0" stop-color="#ff9a3c" stop-opacity=".75"/>'
            '<stop offset=".45" stop-color="#b8561a" stop-opacity=".3"/><stop offset="1" stop-color="#b8561a" stop-opacity="0"/></radialGradient>'
            '<linearGradient id="%s-hi" x1="0" y1="0" x2=".2" y2="1"><stop offset="0" stop-color="#f4fbff"/>'
            '<stop offset=".45" stop-color="#8fd4ff"/><stop offset="1" stop-color="#4c8fc2"/></linearGradient>'
            '<linearGradient id="%s-lu" x1="0" y1="0" x2="0" y2="1"><stop offset=".6" stop-color="#ff9a3c" stop-opacity="0"/>'
            '<stop offset="1" stop-color="#ff9a3c" stop-opacity=".6"/></linearGradient>'
            '<clipPath id="%s-fuera"><path d="M0 0H512V512H0ZM100 100V412H412V100Z" clip-rule="evenodd"/></clipPath>' % (p, p, p, p, p))
    # Siete rachas, puestas a mano en la orilla y fuera de la pieza: eran
    # veintiséis cruzando todo el icono, y por el hueco se veía nieve, que
    # tiene que ir vacío. El recorte (`-fuera`) lo garantiza aunque se muevan.
    rachas = "".join('<line x1="%d" y1="%d" x2="%.1f" y2="%.1f" stroke-width="%.1f" opacity="%.2f"/>'
                     % (x, y, x + l, y + l * .32, w, o) for x, y, l, w, o in
                     [(96, 56, 120, 6, .45), (290, 40, 90, 5, .35), (380, 74, 110, 6, .4), (40, 150, 70, 5, .3),
                      (430, 190, 60, 5, .3), (30, 330, 60, 5, .28), (420, 318, 70, 5, .3)])
    cuerpo = ('<rect width="512" height="512" fill="url(#%s-f)"/>' % p
              + '<rect width="512" height="512" fill="url(#%s-lum)"/>' % p
              + '<path d="M0 452Q128 404 256 430T512 418V512H0Z" fill="#d7e9f5" opacity=".22"/>'
              + '<g stroke="#eaf5fc" stroke-linecap="round" clip-path="url(#%s-fuera)">' % p + rachas + '</g>'
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
    cuerpo = ('<rect width="512" height="512" fill="url(#%s-pl)"/>' % p + juntas + en_aro(perno, 198, girar=False)
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
                        for x, y, s, c in [(104, 112, 8, "#f5d76e"), (400, 100, 8, "#8ecdf5"), (112, 396, 8, "#ff8a70"),
                                           (396, 404, 8, "#5fe0b0"), (160, 70, 4, "#e8eef5"), (440, 200, 4, "#e8eef5"),
                                           (430, 330, 4, "#e8eef5"), (70, 300, 4, "#e8eef5"), (300, 450, 4, "#e8eef5")])
    defs = ('<pattern id="%s-lin" width="6" height="6" patternUnits="userSpaceOnUse">'
            '<rect width="6" height="2" fill="#000" opacity=".16"/></pattern>' % p)
    cuerpo = ('<rect width="512" height="512" fill="#10151d"/>' + estrellas
              + '<g transform="translate(%.2f %.2f)">%s</g>' % (d, d, som)
              + '<g transform="translate(%.2f %.2f)">%s</g>' % (-d * .5, -d * .5, luz)
              + pie + '<rect width="512" height="512" fill="url(#%s-lin)"/>' % p)
    return defs, cuerpo



# ======================= el logo del menú =======================
# En la app desde la 0.7.145: cada mundo viste el isotipo del menú igual que
# el icono de la app. La pieza cambia de material; la silueta y la palabra
# «Norata», no. El reparto de dónde sí y dónde no, en «La marca, dentro de un
# mundo» de `apariencias/LEEME.md`. Lo que llega a la app es `marca_css()`.
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
    return '<g transform="translate(%.2f %.2f) %s" %s>%s</g>' % (dx, dy, LPOS, extra, _tiras(cs, lado))


def _grad(p, n, paradas, x2=0, y2=1):
    return ('<linearGradient id="%s-%s" x1="0" y1="0" x2="%s" y2="%s">%s</linearGradient>' %
            (p, n, x2, y2, "".join('<stop offset="%s" stop-color="%s"/>' % o for o in paradas)))


def pieza_menu(id_, p, dia=False):
    """(defs, dibujo) del isotipo del menú en el mundo `id_`. Es el mismo
    material que el icono de la app, reducido a lo que se lee a 30 px: sin
    fondo, sin adornos alrededor, y nada en el hueco. `dia` da la cara del
    modo claro, para los que de noche usan un tono que sobre papel se pierde
    (el blanco del plano, el hueso de Averno, el lila y la menta clara)."""
    u = LPX
    # Un grosor de trazo va en unidades del ISOTIPO (el trazo de 250, que se
    # escala por LESC dentro del logotipo), no del logotipo: con `u` a secas
    # salían 4,5 veces más finos de lo pedido, y el canto de Blueprint se
    # perdía en el menú. Los desplazamientos y los desenfoques sí van en `u`,
    # porque se aplican sobre el <use>, que vive en el logotipo.
    w = lambda px: "%.2f" % (px * LPX / LESC)
    if id_ == "talavera":
        return (_grad(p, "v", [("0", "#4a6cc0"), (".5", "#1e3f8f"), ("1", "#15306f")]),
                isl(p, fill="url(#%s-v)" % p))
    if id_ == "grabado":
        return "", (isl(p, fill="#181410", transform="translate(%.2f %.2f)" % (2 * u, 2 * u))
                    + isl(p, fill="#a32615", stroke="#181410", stroke_width=w(.9)))
    if id_ == "consola":
        return ('<filter id="%s-f" x="-40%%" y="-40%%" width="180%%" height="180%%"><feGaussianBlur stdDeviation="1.4"/></filter>' % p,
                isl(p, fill="#3bff9e", filter="url(#%s-f)" % p, opacity=".7") + isl(p, fill="#3bff9e"))
    if id_ == "neon":
        return ('<filter id="%s-f" x="-40%%" y="-40%%" width="180%%" height="180%%"><feGaussianBlur stdDeviation="1.3"/></filter>' % p,
                isl(p, fill="none", stroke="#3febff", stroke_width=w(3.4), filter="url(#%s-f)" % p)
                + isl(p, fill="none", stroke="#3febff", stroke_width=w(2), stroke_linejoin="round")
                + isl(p, fill="none", stroke="#eafcff", stroke_width=w(.7), stroke_linejoin="round"))
    if id_ == "cyber":
        return "", (isl(p, fill="#ff2e6e", transform="translate(%.2f 0)" % (-1.3 * u))
                    + isl(p, fill="#00e5ff", transform="translate(%.2f 0)" % (1.3 * u))
                    + isl(p, fill="#fcee0a"))
    if id_ == "plano" and dia:
        return "", isl(p, fill="#4c9ade", fill_opacity=".18", stroke="#0c4677",
                       stroke_width=w(1.8), stroke_linejoin="round")
    if id_ == "plano":
        return "", isl(p, fill="#9fd0ff", fill_opacity=".22", stroke="#ffffff",
                       stroke_width=w(1.8), stroke_linejoin="round")
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
        return (_grad(p, "c", [("0", "#eef3f5"), (".5", "#b3bec6"), ("1", "#6c7883")], .5),
                isl(p, fill="url(#%s-c)" % p))
    if id_ == "cenit":
        return (_grad(p, "a", [("0", "#fbf0d6"), ("1", "#e2c690")]),
                isl(p, fill="url(#%s-a)" % p, stroke="#070a20", stroke_width=w(1.4), paint_order="stroke"))
    if id_ == "reliquia" and dia:
        return (_grad(p, "l", [("0", "#b596ec"), (".55", "#8a5ed0"), ("1", "#5a2a94")], .4),
                isl(p, fill="url(#%s-l)" % p, stroke="#8a6d2f", stroke_width=w(1.1), paint_order="stroke"))
    if id_ == "reliquia":
        return (_grad(p, "l", [("0", "#d9cbf7"), (".55", "#b7a2ea"), ("1", "#8c72cf")], .4)
                + _grad(p, "o", [("0", "#f0d58f"), (".5", "#b8923f"), ("1", "#e3c374")], 1, 1),
                isl(p, fill="url(#%s-l)" % p, stroke="url(#%s-o)" % p, stroke_width=w(1.3), paint_order="stroke"))
    if id_ == "catedral":
        d = 48.5 / 14 * .5
        return "", lpixel(14, p, d, d, fill="#5a0d18") + lpixel(14, p, fill="#ff3d4f")
    if id_ == "averno" and dia:
        d = 48.5 / 12 * .3
        return "", lpixel(12, p, d, d, fill="#7a0f1c") + lpixel(12, p, fill="#ff2d3f")
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
    if id_ == "arcade" and dia:
        d = 48.5 / 12 * .3
        return "", lpixel(12, p, d, d, fill="#0b2e24") + lpixel(12, p, fill="#00cc7f")
    if id_ == "arcade":
        d = 48.5 / 12 * .3
        return "", (lpixel(12, p, d, d, fill="#0b2e24") + lpixel(12, p, -d * .5, -d * .5, fill="#c9fbe6")
                    + lpixel(12, p, fill="#5fe0b0"))
    return "", isl(p, fill="#5fe0b0")          # casa


def logo_menu(id_, p, tinta, solo_iso=False, dia=False):
    """El logotipo del menú vestido por el mundo. `solo_iso` da solo la pieza,
    con la caja recortada a ella más 3 unidades de aire por lado (lo que
    necesitan el resplandor y el desdoble para no cortarse)."""
    defs, pieza = pieza_menu(id_, p, dia)
    caja = "%.2f %.2f %.2f %.2f" % (_lx0 - 3, _ly0 - 3, _lx1 - _lx0 + 6, _ly1 - _ly0 + 6) if solo_iso else "24 32 205 55"
    palabra = "" if solo_iso else '<g fill="%s" style="color:%s">%s</g>' % (tinta, tinta, PALABRA)
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="%s" overflow="visible"><defs>'
            '<path id="%s-isl" d="%s" transform="%s" fill-rule="evenodd"/>%s</defs>%s%s</svg>'
            % (caja, p, isotipo.D, LPOS, defs, pieza, palabra))


def uri(svg_txt):
    """Un SVG como `url(...)` para CSS, con la misma codificación que usa
    `mundos/datos.py` para las texturas de los mundos."""
    s = re.sub(r"\s+", " ", svg_txt).strip().replace('"', "'")
    for a, b in [("%", "%25"), ("#", "%23"), ("<", "%3C"), (">", "%3E"), ("&", "%26"), ("?", "%3F")]:
        s = s.replace(a, b)
    return 'url("data:image/svg+xml,%s")' % s


def marca_css(id_, selector=None, menu=True):
    """Las variables de la marca de un mundo, para la app.

    - `--marca-menu`: el color del isotipo del MENÚ, que es el acento del
      mundo (`--mint`, así sigue también a su paleta). Desde la 0.7.148.2 el
      menú solo se recolorea: Eduardo vio la pieza con material ahí y no le
      convenció. `menu=False` lo omite (Arcade no trae colores: se queda la
      menta).
    - `--marca-pieza` y `--marca-vector`: la pieza con material del mundo. Ya
      no las lee el menú, solo el aviso de antes de reiniciar el APK
      (`avisarRenacer`), que enseña el icono que viene.

    Lo llaman `mundos/app.py` (para `css/mundos.css`) y `mundos/arcade.py`
    (para `css/arcade.css`)."""
    sel = selector or 'html[data-apariencia="%s"]' % id_
    dia = sel.replace("html[", "html.claro[", 1)
    noche_svg = logo_menu(id_, "m" + id_, "#fff", solo_iso=True)
    dia_svg = logo_menu(id_, "m" + id_ + "d", "#000", solo_iso=True, dia=True)
    txt = ("%s {\n%s  --marca-pieza: %s;\n  --marca-vector: hidden;\n}\n"
           % (sel, "  --marca-menu: var(--mint);\n" if menu else "", uri(noche_svg)))
    if dia_svg != noche_svg.replace("m%s-" % id_, "m%sd-" % id_):
        txt += "%s {\n  --marca-pieza: %s;\n}\n" % (dia, uri(dia_svg))
    return txt


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
