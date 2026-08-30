# -*- coding: utf-8 -*-
"""Escribe el paquete de contexto en el repositorio, desde los mismos datos
que el borrador. Si alguno cambia, cambian los dos."""
import datos, construir, os, shutil

M = datos.MUNDOS
RAIZ = "/home/user/norata/mundos"
os.makedirs(RAIZ + "/svg", exist_ok=True)

# --- los vectores, en fuente editable y no solo incrustados ---------------
# La lista sale de datos.py y no del directorio: al descartar un mundo, sus
# vectores se quedaban en disco y algo seguía apuntando a ellos. Se copian los
# que se usan y se borra lo que sobra.
import re
usados = set(re.findall(r'svg\(\s*"([^"]+)"', open(datos.__file__, encoding="utf-8").read()))
for f in usados:
    orig, dest = os.path.join(datos.AQUI, "svg", f), RAIZ + "/svg/" + f
    if os.path.abspath(orig) != os.path.abspath(dest):
        shutil.copy(orig, dest)
for f in os.listdir(RAIZ + "/svg"):
    if f not in usados:
        os.remove(RAIZ + "/svg/" + f)

# --- el CSS de los trece, listo para usar --------------------------------
css = ["""/* Los trece mundos de Norata, en variables.
   NADA de aquí toca una regla de la app: un mundo es un bloque de
   variables y punto. Los nombres --m-* son los del BORRADOR; al llevarlos
   a la app se traducen a los de `:root` en css/estilos.css (--sup-*,
   --r-*, --tipo-*, --marco-*), que ya existen desde 0.7.37.

   Generado desde mundos/MUNDOS.md. No editar a mano sin actualizar ese
   documento, o los dos empezarán a decir cosas distintas. */
"""]
for m in M:
    css.append(f"/* ---------- {m['nombre']} · {m['llave']} ---------- */")
    css.append(construir.bloque_css(m))
    css.append("")
open(RAIZ + "/mundos.css", "w", encoding="utf-8").write("\n".join(css))

# --- la vista, la misma página del borrador ------------------------------
open(RAIZ + "/vista.html", "w", encoding="utf-8").write(
  "<!doctype html>\n<html lang='es'>\n<head>\n<meta charset='utf-8'>\n"
  "<meta name='viewport' content='width=device-width,initial-scale=1'>\n"
  + construir.pagina() + "\n</body>\n</html>\n")

print("mundos.css", os.path.getsize(RAIZ+"/mundos.css"), "· vista.html", os.path.getsize(RAIZ+"/vista.html"),
      "· svg:", len(os.listdir(RAIZ+"/svg")))
