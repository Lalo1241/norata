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
| `android.js` | Saca lo del APK en `android/`: iconos adaptativos y trozo de manifiesto |
| `vista.plantilla.html` | De donde sale `vista.html`. Se edita la plantilla, no la vista |

```sh
python mundos/iconos/generar.py
node mundos/iconos/rasterizar.js
```

`vista.html` se abre con doble clic (y es la misma página que se publicó como
artefacto): la rejilla de los iconos, el mundo elegido con las máscaras de
Android e iOS, y la propuesta del logo del menú en cada mundo.

## El logo del menú (en la app desde la 0.7.145)

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

## El icono de la app, en la web y en el APK

**En la web, el icono se queda en menta**: lo fija el `manifest` al instalar
y `mundos/` ni siquiera se publica (`_config.yml`).

**En el APK sí cambia con el mundo (0.7.145).** `node mundos/iconos/android.js`
saca de estos SVG todo lo nativo —los iconos adaptativos, la capa monocroma,
el trozo de manifiesto— en `android/`, junto al complemento `IconoPlugin.java`
y los pasos para copiarlo (`android/LEEME.md`). Al cambiar un icono: correr
`generar.py`, `android.js`, copiar `res/` y reinstalar el APK.
