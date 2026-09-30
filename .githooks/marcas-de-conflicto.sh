#!/bin/sh
# ============================================================
#  Marcas de conflicto: que no se cuele ninguna
# ============================================================
#
#  La 0.7.148 se subió a main con esto dentro de sw.js:
#
#      <<<<<<< HEAD
#      const CACHE = "norata-0.7.147.10";
#      =======
#      const CACHE = "norata-0.7.148";
#      >>>>>>> f209d1b (0.7.148: Cyberpunk…)
#
#  Salió de un rebase: el conflicto se marcó como resuelto con `git add`
#  sin haberlo resuelto. Un service worker con dos `const CACHE` no
#  arranca, así que esa versión no se habría instalado en ningún
#  dispositivo. Lo paró el trabajo del paquete y se arregló en 19
#  segundos, pero por suerte y no por diseño.
#
#  Lo usan tres sitios, y por eso vive aparte:
#    .githooks/pre-commit   al hacer commit
#    .githooks/pre-push     al subir: el que de verdad importa, porque
#                           `git rebase --continue` NO ejecuta pre-commit
#                           (comprobado), y fue un rebase lo que lo coló
#    .github/workflows/conflictos.yml  en GitHub, por si todo lo de arriba
#                           no estaba puesto en esa máquina
#
#  Uso:  marcas-de-conflicto.sh <árbol>     (un commit, o nada = el índice)
#
#  Solo las marcas de verdad: siete signos al PRINCIPIO de la línea y
#  detrás un espacio o nada. `=======` suelto también cuenta: se comprobó
#  que no hay ni una línea así en todo el repositorio. `-I` salta los
#  binarios (las tipografías, los png).

patron='^(<<<<<<<|=======|>>>>>>>|\|\|\|\|\|\|\|)( |$)'

if [ -n "$1" ]; then
  hallado=$(git grep -nIE "$patron" "$1" -- . 2>/dev/null)
else
  hallado=$(git grep -nIE --cached "$patron" -- . 2>/dev/null)
fi

[ -z "$hallado" ] && exit 0

echo "" >&2
echo "Hay marcas de conflicto sin resolver:" >&2
echo "$hallado" | sed 's/^/    /' >&2
echo "" >&2
echo "Resuelve el conflicto en esos archivos (quédate con una de las dos" >&2
echo "versiones y borra las líneas <<<<<<<, ======= y >>>>>>>) y vuelve a" >&2
echo "intentarlo." >&2
exit 1
