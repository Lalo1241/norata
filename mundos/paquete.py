# -*- coding: utf-8 -*-
"""Escribe el paquete de contexto en el repositorio, desde los mismos datos
que el borrador. Si alguno cambia, cambian los dos."""
import datos, construir, os, shutil

M = datos.MUNDOS
RAIZ = "/home/user/norata/mundos"
os.makedirs(RAIZ + "/svg", exist_ok=True)

# --- los vectores, en fuente editable y no solo incrustados ---------------
for f in os.listdir("svg"):
    shutil.copy("svg/" + f, RAIZ + "/svg/" + f)

# --- el CSS de los once, listo para usar ---------------------------------
css = ["""/* Los once mundos de Norata, en variables.
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
