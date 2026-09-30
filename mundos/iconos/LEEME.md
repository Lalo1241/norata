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

## El logo del menú (propuesta)

`generar.py` también escribe `svg/menu-<id>.svg`: el logotipo de la barra
lateral con la pieza vestida por el mundo —el mismo material que el icono,
reducido a lo que se lee a 30 px— y la palabra «Norata» solo cambiada de
tinta. El logotipo se lee de `index.html` y no se copia.

**Esto va contra una regla vigente y hay que decidirlo antes de montarlo:**
hoy el isotipo del menú va en `--marca-iso` y ningún mundo lo toca («un tema
puede cambiarlo todo menos quién eres», ver `css/estilos.css`, 0.7.54).

## Las reglas

1. **El isotipo no se redibuja: se viste.** Los tres pixelados (Arcade,
   Catedral, Averno) salen de muestrear el trazo de la marca en una cuadrícula;
   dibujados a ojo en otra, dejarían de ser la marca aunque se parecieran.
2. **A sangre, con la pieza en la zona segura.** El cuadrado entero lleva
   fondo y el isotipo ocupa 288 de 512, dentro del círculo del 80 % que
   `maskable` garantiza. Lo que va en las esquinas (remaches, escuadras,
   flores) puede perderse con la máscara sin que el icono deje de decir nada.
3. **El hueco no lleva nada.** Es lo que hace del isotipo un marco, y por él
   solo se ve el suelo del mundo. La primera tanda puso ahí una flor, un
   astro, un cursor, una hoja y un copo; Eduardo los quitó.

## Lo que todavía no existe

**Nada de esto está en la app.** `mundos/` no se publica (`_config.yml`) y
ningún archivo de aquí está en `ASSETS`, así que no subió la versión.
Para usarlos hay dos caminos, y ninguno es de solo copiar:

- **Web (PWA):** el icono de la pantalla de inicio lo fija el `manifest` al
  instalar y no se cambia desde JavaScript. Lo que sí se puede cambiar al
  vuelo es el favicon de la pestaña, y eso pide llevar los SVG fuera de
  `mundos/` a un sitio que sí se publique.
- **La app de Android:** los iconos alternativos van por `activity-alias` en
  el manifiesto de Android y un complemento de Capacitor. Es lo nativo, así
  que pide reinstalar el APK (ver `LEEME.md` de `Norata App Android`).
