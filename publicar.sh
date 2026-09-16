#!/usr/bin/env bash
#
# ============================================================
#  Lo que se publica, y lo que se queda en casa
# ============================================================
#
#  Cloudflare ejecuta esto antes de publicar, sobre una copia de usar y
#  tirar del repositorio. Aquí no se construye nada: se BORRA lo que no
#  tiene por qué estar en la web. El repositorio no se toca.
#
#  ---- Por qué existe ----
#
#  Hacer privado el repositorio no esconde casi nada por sí solo, porque
#  la web sirve todo lo que hay dentro. Medido contra el sitio en vivo el
#  15 de septiembre de 2026, con GitHub Pages y sin ninguna cuenta:
#
#      mi.norata.app/VERSIONES.md                      670 KB
#      mi.norata.app/CLAUDE.md                          39 KB
#      mi.norata.app/supabase/planes.sql                 8 KB
#      mi.norata.app/supabase/functions/cobro/index.ts  25 KB
#      mi.norata.app/mundos/app.py                      51 KB
#
#  Los cinco contestaban 200. Eso es el libro de recetas —cada decisión y
#  su porqué—, y vale más que el JavaScript, que es público por naturaleza
#  y no hay forma de que deje de serlo.
#
#  ---- Es una lista de EXCLUSIÓN, y eso es a propósito ----
#
#  Se nombra lo que NO se publica, nunca lo que sí. Al revés haría falta
#  acordarse de apuntar cada archivo nuevo aquí, y ya hay dos sitios donde
#  hay que apuntarlos (`index.html` y el `ASSETS` de `sw.js`); un tercero
#  se olvida y el fallo sería un archivo que falta en producción y está en
#  local, que es de los caros de encontrar. Así, lo nuevo se publica solo.
#
#  ---- El guardarraíl ----
#
#  Al final se comprueba que siga estando TODO lo que `sw.js` va a pedir
#  en la instalación. La lista no se copia aquí: se lee de `sw.js`, que es
#  el original. Si falta uno, esto corta la publicación con error y
#  Cloudflare deja en pie la versión anterior. Un despliegue que no sale
#  es un mal rato; uno que sale roto se queda en las cachés de todo el
#  mundo hasta la versión siguiente, porque desde la 0.7.38 la app se
#  sirve de su propia copia.

set -euo pipefail

echo "== Quitando lo que no va a la web =="

# Los documentos. Esto es lo que de verdad se está cerrando.
rm -f  CLAUDE.md README.md VERSIONES.md

# Fuentes de las que salen archivos generados que SÍ se publican:
#   apariencias/  ->  css/ambientes.css
#   mundos/       ->  css/mundos.css  (los svg y las tipografías van
#                     incrustados en base64 dentro del css; se comprobó:
#                     ningún `url()` apunta a mundos/)
#   plantillas/   ->  caminos/caminos.json
#   caminos/app.py -> caminos/caminos.json
rm -rf apariencias mundos plantillas
rm -f  caminos/app.py

# El servidor: su código vive en Supabase, no aquí. Y las herramientas de
# depurar se pegan en la consola a mano; nadie las pide por la red.
rm -rf supabase herramientas

# Los generadores de la marca. Las IMÁGENES se quedan: los correos que ya
# están en bandejas ajenas enlazan mi.norata.app/marca/*.png, y Gmail no
# vuelve a pedir una imagen que ya guardó. Si desaparecen, se quedan rotos
# los correos viejos para siempre.
rm -f  marca/generar-marca.py marca/generar-iconos-correo.html

# `correos/` se queda: los correos enlazan 04-bienvenida.html. Su LEEME no.
rm -f  correos/LEEME.md

# El CNAME es de GitHub Pages y aquí no pinta nada. Se queda en el
# repositorio a propósito, por si hay que volver: borrarlo del repositorio
# convertiría la vuelta atrás en un commit en vez de en un clic.
rm -f  CNAME

# Restos
rm -f  publicar.sh
find . -name .gitignore -delete
find . -name __pycache__ -type d -prune -exec rm -rf {} + 2>/dev/null || true

echo
echo "== Comprobando que no falte nada de lo que sw.js instala =="

faltan=0
# La lista sale de sw.js, no de aquí, para que no puedan desincronizarse.
while read -r ruta; do
  [ -z "$ruta" ] && continue
  # Una ruta acabada en "/" es una carpeta, y la sirve su index.html.
  # Generico a proposito: la 0.7.121 anadio "./crear-cuenta/" y una lista
  # escrita a mano no lo habria cubierto. Lo caza el guardarrail, pero el
  # despliegue se cae por nada.
  case "$ruta" in */) ruta="${ruta}index.html" ;; esac
  if [ ! -f "$ruta" ]; then
    echo "  FALTA (esta en ASSETS): $ruta"
    faltan=$((faltan+1))
  fi
done < <(sed -n '/ASSETS *= *\[/,/\]/p' sw.js | grep -oE '"\./[^"]*"' | tr -d '"')

# Lo que se pide en caliente y NO esta en ASSETS, asi que el bucle de
# arriba no lo mira. Aqui si hay que nombrarlos.
for ruta in css/mundos.css caminos/caminos.json correos/04-bienvenida.html \
            privacidad/index.html terminos/index.html _headers \
            marca/logo-correo-v2.png marca/icono-misiones-v1.png; do
  if [ ! -f "$ruta" ]; then
    echo "  FALTA (se pide en caliente): $ruta"
    faltan=$((faltan+1))
  fi
done

if [ "$faltan" -gt 0 ]; then
  echo
  echo "Se cancela: faltan $faltan archivos. Queda publicada la version anterior."
  exit 1
fi

echo "  Todo en su sitio. Se publican $(find . -type f -not -path './.git/*' | wc -l) archivos."
