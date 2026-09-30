# Los iconos de los mundos

Un icono de app por mundo, y los diecisiete llevan **el mismo isotipo**: la
silueta de `marca/isotipo-menta.svg`, en el mismo sitio y a la misma escala.
Lo que cambia es el MATERIAL de la pieza (tinta, vidrio, metal, neón, píxel) y
el suelo sobre el que se apoya. Va también el de la casa (`casa`), para
compararlos.

| Archivo | Qué es |
| --- | --- |
| `isotipo.py` | El trazo de la marca, su caja y su versión pixelada (se muestrea, no se redibuja) |
| `generar.py` | Los dibujos. Escribe `svg/<id>.svg` y `vista.html` |
| `rasterizar.js` | Saca `png/<id>-512.png`, `-192` y `-180` con Chromium, y `hoja.png` |
| `vista.plantilla.html` | De donde sale `vista.html`. Se edita la plantilla, no la vista |

```sh
python mundos/iconos/generar.py
node mundos/iconos/rasterizar.js
```

`vista.html` se abre con doble clic (y es la misma página que se publicó como
artefacto): la rejilla de los iconos, el mundo elegido con las máscaras de
Android e iOS, y la propuesta del logo del menú en cada mundo.

## El logo del menú (en la app desde la 0.7.144)

`generar.py` también dibuja el logotipo de la barra lateral vestido por cada
mundo (`svg/menu-<id>.svg` para verlo, y `marca_css()` para la app): la pieza
con el mismo material que el icono, reducida a lo que se lee a 30 px, y la
palabra «Norata» sin tocar. El logotipo se lee de `index.html` y no se copia.

Llega a la app por `mundos/app.py` (los mundos de `LISTOS`) y
`mundos/arcade.py`. Al cambiar un dibujo del menú hay que volver a correr
esos dos, no solo este. El reparto de dónde sí se viste la marca y dónde no,
en «La marca, dentro de un mundo» de `apariencias/LEEME.md`.

**Una trampa que ya mordió:** en `pieza_menu` los grosores de trazo van en
unidades del isotipo (el trazo de 250), no del logotipo. Con las unidades del
logotipo salían 4,5 veces más finos, y el canto de Blueprint se perdía.

## Lo que todavía no existe

**Los iconos de la app no están en la app.** `mundos/` no se publica
(`_config.yml`) y el icono se queda en menta a propósito (ver arriba). El que
tendría sentido es el de la pantalla de inicio en Android, por
`activity-alias` y un complemento de Capacitor: es lo nativo, así que pide
reinstalar el APK. Está apuntado para cuando la app esté en la Play Store.
