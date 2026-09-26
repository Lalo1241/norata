# Mide las cuatro paletas contra las reglas de la casa y dice qué falla.
# `python mundos/averno/medir.py` después de tocar cualquier tono.
from color import cr, de, mezcla, oklch
from paletas import PALETAS

def medir(p, cara):
    c = PALETAS[p][cara]; noche = cara == "noche"
    r = {}
    r["tarjeta/página"] = (cr(c["card"], c["bg"]), 1.10)
    r["texto/tarjeta"] = (cr(c["text"], c["card"]), 7)
    r["apagado/tarjeta"] = (cr(c["muted"], c["card"]), 4.5)
    r["apagado/página"] = (cr(c["muted"], c["bg"]), 4.5)
    r["tenue/tarjeta"] = (cr(c["faint"], c["card"]), 3.0)
    r["acento/tarjeta"] = (cr(c["acento"], c["card"]), 4.5)
    r["acento/página"] = (cr(c["acento"], c["bg"]), 4.5)
    r["segundo/tarjeta"] = (cr(c["segundo"], c["card"]), 4.5)
    r["aviso/tarjeta"] = (cr(c["aviso"], c["card"]), 4.5)
    r["peligro/tarjeta"] = (cr(c["peligro"], c["card"]), 4.5)
    velo = mezcla(c["peligro"], c["card"], .10)
    r["peligro/su velo"] = (cr(c["peligro"], velo), 4.5)
    r["tinta/macizo acento"] = (cr(c["sobre"], c["acentoM"]), 4.5)
    r["tinta/macizo segundo"] = (cr(c["sobre"], c["segundoM"]), 4.5)
    r["carril/tarjeta"] = (cr(c["carril"], c["card"]), 1.15)
    r["borde/tarjeta"] = (cr(c["line"], c["card"]), 1.25 if noche else 1.4)
    r["hondo/página"] = (cr(c["hondo"], c["bg"]), 1.05)
    return r

def distancias(p):
    c = PALETAS[p]["noche"]
    pares = [("acento", "peligro"), ("acento", "aviso"), ("peligro", "aviso"), ("acento", "segundo"), ("segundo", "aviso")]
    return {a + "·" + b: de(c[a + "M"], c[b + "M"]) for a, b in pares}

if __name__ == "__main__":
    for p in PALETAS:
        print("=====", p)
        for cara in ("noche", "dia"):
            fallos = [f"{k} {v:.2f}<{u}" for k, (v, u) in medir(p, cara).items() if v < u]
            print(f"  {cara}: {'OK' if not fallos else '  '.join(fallos)}")
        print("  dE:", "  ".join(f"{k} {v:.1f}" for k, v in distancias(p).items()))
        c = PALETAS[p]["noche"]
        print("  croma tarjeta noche %.3f  página %.3f" % (oklch(c["card"])[1], oklch(c["bg"])[1]),
              " L página día %.3f" % oklch(PALETAS[p]["dia"]["bg"])[0])
