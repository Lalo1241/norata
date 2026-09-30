# -*- coding: utf-8 -*-
"""El isotipo de Norata, en un solo sitio, y las dos cosas que los iconos de
los mundos necesitan saber de él: su caja y qué celdas cubre al pixelarlo.

El trazo se copia TAL CUAL de `marca/isotipo-menta.svg`. Si la marca cambia,
se cambia allí y se pega aquí: un icono con un isotipo redibujado a mano deja
de ser la marca aunque se parezca."""
import re

D = ("M224.919,110.004h-5.319c-2.476,0-4.487-2.011-4.487-4.487V25.081c0-4.947-4.027-8.973-8.973-8.973h-87.162c-4.947,0-8.973,4.027-8.973,8.973v5.319c0,2.476-2.011,4.487-4.487,4.487H31.811c-8.658,0-15.703,7.046-15.703,15.703v80.436c0,4.947,4.027,8.973,8.973,8.973h5.319c2.476,0,4.487,2.011,4.487,4.487v80.432c0,4.947,4.027,8.973,8.973,8.973h87.166c4.947,0,8.973-4.027,8.973-8.973v-5.319c0-2.476,2.011-4.487,4.487-4.487h55.755c18.556,0,33.65-15.094,33.65-33.65v-62.485c0-4.947-4.027-8.973-8.973-8.973Z"
     "M55.91,128.783h-5.319c-2.476,0-4.487-2.011-4.487-4.487v-54.927c0-2.476,2.011-4.487,4.487-4.487h61.657c4.947,0,8.973-4.027,8.973-8.973v-5.319c0-2.476,2.011-4.487,4.487-4.487h54.923c2.476,0,4.487,2.011,4.487,4.487v61.657c0,4.947,4.027,8.973,8.973,8.973h5.319c2.476,0,4.487,2.011,4.487,4.487v45.949c0,7.422-6.038,13.46-13.46,13.46h-52.679c-4.947,0-8.973,4.027-8.973,8.973v5.319c0,2.476-2.011,4.487-4.487,4.487h-54.927c-2.476,0-4.487-2.011-4.487-4.487v-61.653c0-4.947-4.027-8.973-8.973-8.973Z")


def contornos(d=D, pasos=12):
    """Aplana el trazo en polígonos. Solo entiende lo que este trazo usa
    (M, h, v, H, V, c, Z), y lo dice si encuentra otra cosa."""
    toks = re.findall(r"[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?", d)
    i, x, y, cmd, polys, cur = 0, 0.0, 0.0, None, [], []
    def num():
        nonlocal i
        i += 1
        return float(toks[i - 1])
    while i < len(toks):
        if toks[i].isalpha():
            cmd = toks[i]; i += 1
            if cmd in "Zz":
                polys.append(cur); cur = []
                continue
        if cmd == "M":
            x, y = num(), num(); cur = [(x, y)]; cmd = "L"
        elif cmd == "L":
            x, y = num(), num(); cur.append((x, y))
        elif cmd == "h": x += num(); cur.append((x, y))
        elif cmd == "H": x = num(); cur.append((x, y))
        elif cmd == "v": y += num(); cur.append((x, y))
        elif cmd == "V": y = num(); cur.append((x, y))
        elif cmd == "c":
            a, b, c, e, f, g = (num() for _ in range(6))
            p0, p1, p2, p3 = (x, y), (x + a, y + b), (x + c, y + e), (x + f, y + g)
            for k in range(1, pasos + 1):
                t = k / pasos; u = 1 - t
                cur.append((u**3*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t**3*p3[0],
                            u**3*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t**3*p3[1]))
            x, y = p3
        else:
            raise ValueError("comando de trazo que no se esperaba: %r" % cmd)
    return polys


def caja():
    pts = [p for poly in contornos() for p in poly]
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    return min(xs), min(ys), max(xs), max(ys)


def dentro(px, py, polys):
    # Par-impar: el hueco del centro es el segundo contorno y sale solo.
    n = False
    for poly in polys:
        for (x1, y1), (x2, y2) in zip(poly, poly[1:] + poly[:1]):
            if (y1 > py) != (y2 > py) and px < (x2 - x1) * (py - y1) / (y2 - y1) + x1:
                n = not n
    return n


def _cortes():
    """Las coordenadas donde el isotipo tiene una pared recta. Son las mismas
    en x y en y, y simétricas alrededor del centro. La pieza girada media
    vuelta NO es igual —dos esquinas son más redondas que sus opuestas—, pero
    sus paredes sí caen en los mismos sitios."""
    xs = set()
    for poly in contornos(pasos=1):
        for (x1, y1), (x2, y2) in zip(poly, poly[1:] + poly[:1]):
            if abs(x1 - x2) < 1e-6 and abs(y1 - y2) > 5: xs.add(round(x1, 2))
            if abs(y1 - y2) < 1e-6 and abs(x1 - x2) > 5: xs.add(round(y1, 2))
    return sorted(xs)


def celdas(n):
    """El isotipo pixelado en unas n×n celdas: (lado, [(col, fila)…]).

    No se muestrea sobre una cuadrícula uniforme, y eso es lo que lo deja
    derecho. Las paredes de la pieza no caen en múltiplos de ningún lado de
    celda, así que una cuadrícula igual para todo redondeaba unas paredes
    hacia fuera y otras hacia dentro: el brazo izquierdo salía de tres
    celdas y el derecho de dos, y la figura se veía torcida (Arcade, primera
    tanda). Aquí cada tramo entre dos paredes recibe su propio número de
    celdas —redondeado, nunca cero, y el mismo para los tramos que miden lo
    mismo—, y la pieza se deforma por tramos para caer en esa rejilla antes
    de muestrearla. Todas las paredes de 30 unidades salen del mismo grueso."""
    x0, y0, x1, y1 = caja()
    ks = _cortes()
    u = (x1 - x0) / n
    tramos = [max(1, round((b - a) / u)) for a, b in zip(ks, ks[1:])]
    # Simétrico a la fuerza: la segunda mitad copia la primera, al revés.
    m = len(tramos)
    for k in range(m // 2):
        tramos[m - 1 - k] = tramos[k]
    total = sum(tramos)
    lado = (x1 - x0) / total
    borde = [0]
    for t in tramos:
        borde.append(borde[-1] + t)

    def mapa(v):
        for k in range(len(ks) - 1):
            if v <= ks[k + 1] or k == len(ks) - 2:
                a, b = ks[k], ks[k + 1]
                return x0 + (borde[k] + (v - a) / (b - a) * tramos[k]) * lado
    polys = [[(mapa(x), mapa(y)) for x, y in p] for p in contornos(pasos=24)]
    return lado, [(c, f) for f in range(total) for c in range(total)
                  if dentro(x0 + (c + .5) * lado, y0 + (f + .5) * lado, polys)]

if __name__ == "__main__":
    print(caja())
    for n in (12, 16, 22):
        lado, cs = celdas(n)
        s, t = set(cs), round((caja()[2] - caja()[0]) / lado)
        print(n, "->", t)
        for f in range(t):
            print("".join("█" if (c, f) in s else "·" for c in range(t)))
