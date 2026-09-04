# -*- coding: utf-8 -*-
"""Convierte `plantillas/LEEME.md` en los datos que lee la app.

   ---- Por que hay un generador y no un JSON escrito a mano ----

   Los diez caminos son 132 peldanos con sus pasos, sus plazos y sus misiones.
   Escritos dos veces —una en el documento y otra en los datos— se
   desincronizan a la primera correccion, y la que se queda vieja es siempre la
   que nadie mira. Asi que **el LEEME manda y el JSON se genera**: si hay que
   corregir un peldano se corrige alli, se vuelve a correr esto, y ya.

   Es el mismo reparto que `mundos/app.py`: un documento que se lee y un
   archivo generado que no se toca a mano.

   ---- Y por que estampa la huella ----

   `caminos/caminos.json` NO esta en la lista `ASSETS` del service worker, y es
   a proposito: son ~50 KB que solo necesita quien abre el cajon, y solo si
   paga. Lo que no esta en esa lista no lo renueva nadie —se pide suelto, se
   guarda en la cache de esa version y a partir de ahi ya es un acierto para
   siempre—, asi que se pide con `?h=<huella>` en la direccion. La huella es el
   sha-256 del contenido, y se estampa aqui dentro de `js/10j-caminos.js` para
   que no haya un sitio mas que acordarse de tocar.

   Correr:  python caminos/app.py
"""
import hashlib
import io
import json
import os
import re
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEEME = os.path.join(RAIZ, "plantillas", "LEEME.md")
DESTINO = os.path.join(RAIZ, "caminos", "caminos.json")
CARGADOR = os.path.join(RAIZ, "js", "10j-caminos.js")

GUION = u"—"      # la raya larga
MEDIO = u"·"      # el punto volado que separa los pasos
RAYITA = u"–"


def limpio(t):
    return re.sub(r"\s+", " ", t or "").strip()


def sin_negrita(t):
    """El documento marca cosas en **negrita** para leerlo; los datos no."""
    return limpio(re.sub(r"\*\*(.+?)\*\*", r"\1", re.sub(r"\*(.+?)\*", r"\1", t or "")))


def campo(texto, nombre):
    """Saca `**Nombre:** valor` hasta el siguiente `**` o el fin de linea."""
    m = re.search(r"\*\*" + re.escape(nombre) + r":\*\*\s*(.*?)(?=\s·\s\*\*|\n\*\*|\n\n|\n>)",
                  texto, re.S)
    return sin_negrita(m.group(1)) if m else ""


# El identificador de cada camino, ESCRITO y no derivado del nombre.
# Es lo que se guarda en `state.ui.caminos` para saber cuales ya usaste, asi
# que tiene que sobrevivir a que alguien corrija un titulo: si se sacara del
# nombre, renombrar «Correr 10K sin parar» haria que la app olvidara que lo
# tienes. Estos no se cambian nunca.
IDS = {
    1: "correr-10k",   2: "idioma",      3: "instrumento", 4: "deuda",
    5: "programar",    6: "certificacion", 7: "libro",     8: "negocio",
    9: "casa",        10: "mudanza",
}


def importe(nombre):
    """«Calzado para correr ($1,200)» -> ("Calzado para correr", 1200).
       El precio vive en `cost`, que es donde el formulario de un talento lo
       espera; dejarlo dentro del nombre lo volveria texto muerto."""
    m = re.search(r"\s*\(\$([\d,]+)\)\s*$", nombre)
    if not m:
        return nombre, 0
    return nombre[:m.start()].strip(), int(m.group(1).replace(",", ""))


def lista_pide(celda):
    """«1, 2» -> [1, 2]. La raya quiere decir «abierto desde el dia uno»."""
    celda = limpio(celda)
    if not celda or celda in (GUION, RAYITA, "-"):
        return []
    return [int(x) for x in re.findall(r"\d+", celda)]


def plazo(celda):
    """«30 d» -> 30. Solo las metas llevan; los hitos van sin plazo."""
    m = re.search(r"(\d+)\s*d", limpio(celda))
    return int(m.group(1)) if m else 0


def tabla(texto):
    """Las filas de la tabla de peldanos, sin la cabecera ni el separador."""
    filas = []
    for linea in texto.split("\n"):
        linea = linea.strip()
        if not linea.startswith("|") or "---" in linea:
            continue
        celdas = [c.strip() for c in linea.strip("|").split("|")]
        if celdas and re.match(r"^\d+$", celdas[0]):
            filas.append(celdas)
    return filas


def pasos_de(texto, rotulo):
    """`- **3** · uno · dos · tres` -> {3: ["uno", "dos", "tres"]}"""
    m = re.search(r"\*\*" + rotulo + r"\*\*\n(.*?)(?=\n\*\*|\n#|\Z)", texto, re.S)
    if not m:
        return {}
    fuera = {}
    for linea in m.group(1).split("\n"):
        mm = re.match(r"^-\s*\*\*(\d+)\*\*\s*" + MEDIO + r"\s*(.+)$", linea.strip())
        if mm:
            trozos = [sin_negrita(x) for x in mm.group(2).split(MEDIO)]
            fuera[int(mm.group(1))] = [t for t in trozos if t]
    return fuera


def misiones_de(texto):
    """`- Salir a correr — semanal, lunes y sábado, meta 3`"""
    m = re.search(r"\*\*Misiones\*\*\n(.*?)(?=\n\*\*|\n#|\n---|\Z)", texto, re.S)
    if not m:
        return []
    fuera = []
    for linea in m.group(1).split("\n"):
        mm = re.match(r"^-\s*(.+?)\s*" + GUION + r"\s*(.+)$", linea.strip())
        if not mm:
            continue
        nombre, cad = sin_negrita(mm.group(1)), limpio(mm.group(2)).lower()
        mis = {"nombre": nombre, "cadencia": "daily" if "diaria" in cad else "semanal"}
        dias = [i for i, d in enumerate(
            ["domingo", "lunes", "martes", u"miércoles", "jueves", "viernes", u"sábado"]) if d in cad]
        if u"de lunes a viernes" in cad:
            dias = [1, 2, 3, 4, 5]
        if mis["cadencia"] == "semanal":
            mis["dias"] = dias
            mm2 = re.search(r"meta (\d+)", cad)
            mis["meta"] = int(mm2.group(1)) if mm2 else max(1, len(dias))
        fuera.append(mis)
    return fuera


def main():
    d = io.open(LEEME, encoding="utf-8").read()
    trozos = re.split(r"(?m)^# (\d+)\. (.+)$", d)[1:]
    caminos = []
    for i in range(0, len(trozos), 3):
        num, nombre, cuerpo = int(trozos[i]), limpio(trozos[i + 1]), trozos[i + 2]
        cuerpo = cuerpo.split("\n## ")[0]           # corta antes de las secciones finales
        modulo = campo(cuerpo, u"Módulo")
        proy = modulo.lower().startswith("proyecto")

        peldanos = []
        for f in tabla(cuerpo):
            if proy:
                # | # | Encargo | Pide | Espera |
                nom, cost = importe(sin_negrita(f[1]))
                e = {"n": int(f[0]), "nombre": nom, "pide": lista_pide(f[2]),
                     "espera": limpio(f[3]).lower().startswith(u"s")}
                if cost:
                    e["cost"] = cost
                peldanos.append(e)
            else:
                # | # | Tipo | Nombre | Pide | Plazo |
                nom, cost = importe(sin_negrita(f[2]))
                p = {"n": int(f[0]), "tipo": limpio(f[1]), "nombre": nom,
                     "pide": lista_pide(f[3])}
                if cost:
                    p["cost"] = cost
                dias = plazo(f[4])
                if dias:
                    p["dias"] = dias
                peldanos.append(p)

        pasos = pasos_de(cuerpo, "Etapas" if proy else "Pasos")
        for p in peldanos:
            if p["n"] in pasos:
                p["pasos"] = pasos[p["n"]]

        caminos.append({
            "id": IDS[num],
            "n": num,
            "nombre": nombre,
            "modulo": "proyectos" if proy else "talentos",
            "rama": campo(cuerpo, "Rama"),
            "habilidades": [limpio(x) for x in campo(cuerpo, "Habilidades").split(",")],
            "horizonte": campo(cuerpo, "Horizonte"),
            "falla": campo(cuerpo, "Le falla a"),
            "pantalla": campo(cuerpo, "En pantalla").strip(u"«»"),
            "peldanos": peldanos,
            "misiones": misiones_de(cuerpo),
        })

    datos = {"version": 1, "caminos": caminos}
    txt = json.dumps(datos, ensure_ascii=False, separators=(",", ":"), sort_keys=False)
    io.open(DESTINO, "w", encoding="utf-8", newline="\n").write(txt)

    huella = hashlib.sha256(txt.encode("utf-8")).hexdigest()[:12]

    # La huella, estampada en el cargador. Si el archivo aun no existe se avisa
    # en vez de fallar: el generador puede correr antes que el cargador exista.
    if os.path.exists(CARGADOR):
        c = io.open(CARGADOR, encoding="utf-8", newline="").read()
        nueva, n = re.subn(r'(const CAMINOS_HUELLA = ")[^"]*(";)', r"\g<1>" + huella + r"\g<2>", c)
        if n != 1:
            print("AVISO: no encontre CAMINOS_HUELLA en el cargador")
        else:
            io.open(CARGADOR, "w", encoding="utf-8", newline="").write(nueva)
            print("huella estampada en js/10j-caminos.js")
    else:
        print("AVISO: todavia no existe js/10j-caminos.js")

    total = sum(len(c["peldanos"]) for c in caminos)
    print("caminos: %d  ·  peldanos: %d  ·  %.1f KB  ·  huella %s"
          % (len(caminos), total, len(txt.encode("utf-8")) / 1024.0, huella))
    for c in caminos:
        sin = [p["n"] for p in c["peldanos"] if not p["pide"]]
        print("  %-38s %-10s %2d peldanos  %d misiones  raiz %s  id %s"
              % (c["nombre"][:38], c["modulo"], len(c["peldanos"]),
                 len(c["misiones"]), sin, c["id"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
