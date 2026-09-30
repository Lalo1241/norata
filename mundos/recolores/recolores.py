# -*- coding: utf-8 -*-
"""Las paletas de los mundos que nacieron con UNA (Blueprint y Reliquia).

Eduardo (30 sep 2026): cinco paletas por mundo. Catedral y Averno ya traían
las suyas en su propio generador; Blueprint y Reliquia salen del bloque
genérico de `mundos/app.py`, así que aquí se RECOLOREA ese bloque ya armado
para cada paleta nueva, en vez de escribir cinco mundos a mano.

Cómo, y por qué así (las dos vueltas están en VERSIONES.md, 0.7.147):
  - No se gira el matiz: salía monocromo y Eduardo lo paró. Cada paleta
    declara sus papeles —en Blueprint papel, cuadrícula, trazo y tinta; en
    Reliquia forro, metal y acento— con colores complementarios sacados de
    paletas de Lospec, y cada color del mundo se lleva al suyo interpolando
    en OKLab entre las anclas (anclas.py).
  - El aviso (amarillo) y el peligro (coral) no se tocan nunca.
  - Reliquia tiene además METAL: sus dorados de latón se parecen al aviso y
    el motor los dejaría quietos; reliquia.py los separa y los pasa a oro
    rosa o plata según la paleta.
  - Todo se mide al generar: si una tinta no llega a 4,5 sobre su tarjeta,
    app.py se niega a escribir el archivo.

Lo llama `mundos/app.py` con el CSS ya armado (bloque + marca del menú) y
devuelve el CSS de las paletas nuevas. Las muestras de Mi apariencia se
imprimen con `python mundos/recolores/recolores.py` para pegarlas en
`js/10i-apariencia.js` (PLANO_PALETAS y RELIQUIA_PALETAS)."""
import os, sys, json
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import anclas, reliquia  # noqa: E402

def css(texto):
    c_plano, m_plano, inf = anclas.generar(texto, "plano", anclas.PARTIDA_PLANO, anclas.PLANO)
    malos = [x for v in inf.values() for x in v if "✗" in x]
    c_rel, m_rel, malos_rel = reliquia.generar(texto)
    malos += malos_rel
    if malos:
        raise SystemExit("recolores: contraste por debajo del mínimo\n  " + "\n  ".join(malos))
    return c_plano + "\n" + c_rel, {"plano": m_plano, "reliquia": m_rel}

if __name__ == "__main__":
    raiz = os.path.dirname(os.path.dirname(AQUI))
    texto = open(os.path.join(raiz, "css", "mundos.css"), encoding="utf-8").read()
    _, mues = css(texto)
    limpio = lambda d: {k: {"nombre": v["nombre"], "noche": v["noche"], "dia": v["dia"]} for k, v in d.items()}
    print("const PLANO_PALETAS = " + json.dumps(limpio(mues["plano"]), ensure_ascii=False) + ";")
    print("const RELIQUIA_PALETAS = " + json.dumps(limpio(mues["reliquia"]), ensure_ascii=False) + ";")
