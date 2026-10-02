#!/bin/sh
# Cómo está la barrera de subidas, dicho en una frase.
#
# Existe por una condición de Eduardo (2 oct 2026): cada sesión tiene que SABER
# si lo que sube a `main` se publica solo o se queda esperando su aprobación, y
# decírselo. Con el grifo cerrado, «ya está subido» significa «está en la
# cola»; con el grifo abierto, pedirle una aprobación que no hace falta también
# es mentirle. Una frase fija en un documento no sirve, porque el grifo cambia:
# se pregunta cada vez.
#
#     sh herramientas/barrera.sh
#
# Se corre ANTES de decirle que algo está subido. No necesita ninguna llave: el
# estado del grifo es público (`barrera_estado()` en supabase/barrera.sql).

SB_URL="https://wifffghnyrqfuwqlatci.supabase.co"
SB_KEY="sb_publishable_aFW_LWvcSENT2XOQ0PVXyA_UsFvraIU"

cod=$(curl -s -o /tmp/norata-grifo.json -w '%{http_code}' --max-time 20 -X POST \
        "$SB_URL/rest/v1/rpc/barrera_estado" \
        -H "apikey: $SB_KEY" -H "Content-Type: application/json" -d '{}' 2>/dev/null) || cod=000

case "$cod" in
  200) grifo=$(sed -n 's/.*"grifo" *: *"\([a-z]*\)".*/\1/p' /tmp/norata-grifo.json) ;;
  404) grifo="sin-instalar" ;;
  *)   grifo="desconocido" ;;
esac
rm -f /tmp/norata-grifo.json

# Cuánto hay en la cola: lo que `main` tiene y `vivo` todavía no.
git fetch -q origin main vivo 2>/dev/null
if git rev-parse -q --verify origin/vivo >/dev/null 2>&1; then
  cola=$(git rev-list --count origin/vivo..origin/main 2>/dev/null)
  vivo=$(git log -1 --format='%h %s' origin/vivo 2>/dev/null)
else
  cola="?"; vivo="(la rama vivo todavía no existe)"
fi

echo "En vivo:  $vivo"
echo "En cola:  $cola cambio(s) en main que vivo no tiene"
case "$grifo" in
  abierto)
    echo "Grifo:    ABIERTO"
    echo "=> Lo que subas a main se publica solo, en uno o dos minutos. No hace falta pedirle aprobación a Eduardo."
    echo "   (Si toca un .sql de supabase/, ese tramo sí se queda detenido hasta que él lo suba desde el Puesto de mando.)" ;;
  cerrado)
    echo "Grifo:    CERRADO"
    echo "=> Lo que subas a main NO se publica: se queda en la cola hasta que Eduardo lo apruebe en el Puesto de mando → Subidas."
    echo "   Díselo así: «está en la cola, esperando tu aprobación». No digas que ya está en vivo." ;;
  sin-instalar)
    echo "Grifo:    la barrera no está instalada en Supabase (falta pegar supabase/barrera.sql)"
    echo "=> Se trabaja como siempre: lo que subas a main se publica solo." ;;
  *)
    echo "Grifo:    no pude preguntar (respuesta $cod)"
    echo "=> No des nada por publicado sin comprobarlo en https://mi.norata.app/sw.js" ;;
esac
