# Los mundos de Norata

Paquete de contexto para seguir esto en la computadora. **Léelo entero antes
de tocar nada**: aquí está lo decidido, lo medido y —sobre todo— lo que
todavía NO existe en la app, para no dar por hecho lo que aún no está.

## Estado, sin adornos

| | |
| --- | --- |
| **Ya está en la app** (0.7.37) | La capa de material: `--r-*`, `--sup-*`, `--marco-*`, `--tipo-titulo`, `--tipo-cifra`, `--dur-*`. Ver la sección «El material» de `CLAUDE.md`. |
| **Ya está en la app** (0.7.38) | Servir de la copia primero, para que un mundo se baje UNA vez y no cada mañana. |
| **Diseñado y medido, sin construir** | Los catorce mundos de este documento (revisados tres veces). |
| **Propuesto, NO existe** | `--tipo-titulo-escala`, el selector de mundo en Ajustes, y la carga diferida de las tipografías y texturas de un mundo. |

## Las tres reglas

1. **Avisar sigue siendo avisar.** El amarillo y el coral pueden cambiar de
   tono —en Neón son ámbar y rosa; en Cyberpunk, magenta— pero no de
   significado. Un mundo cambia con qué se celebra, no con qué se avisa.
2. **Un círculo es redondo porque es redondo.** El aro de marcar una misión
   está en 999 px en los catorce, incluso donde todo lo demás tiene la esquina
   viva. Por eso `--r-redondo` vive separado de `--r-pastilla` y no pasa por
   `--r-factor`.
3. **El cuerpo de texto no lo toca nadie.** Un mundo solo llega a `h1/h2/h3`
   (99 sitios) y a las cifras tabulares (45 reglas). Los nombres de misión son
   `div`, no encabezados: se quedan en la letra de la casa pase lo que pase.

## Las tipografías: el banco y la regla

En una pantalla de **320 px** la cabecera deja **266 px**. El título más largo
que existe en la app es **«Árbol de talentos»**, y en Outfit ocupa **236,5 px**.
Sobran 38: **un 16% de holgura**, y eso es toda la pista.

| Cara | vs Outfit | Ancho | Escala | Mundo |
| --- | --- | --- | --- | --- |
| Big Shoulders Display | −26% | 174,2 | 1 | Ventisca |
| Grenze Gotisch | −17% | 195,3 | 1 | Averno |
| Alegreya Sans | −14% | 204,2 | 1 | Talavera |
| Rajdhani | −10% | 212,5 | 1 | Blueprint |
| Patrick Hand | −22% | 185,6 | 1 | Post-it |
| Amaranth | −4% | 226,1 | 1 | Arboleda |
| **Outfit** | **+0%** | **236,5** | 1 | Grabado · *y la app* |
| Chakra Petch | +4% | 245,4 | 1 | Cyberpunk |
| Poppins | +11% | 263,0 | 1 | *deja 3 px* |
| Sora | +13% | 268,1 | **0.99** | Obsidiana |
| Julius Sans One | +23% | 290,9 | **0.91** | Cénit |
| Cinzel | +28% | 301,8 | **0.88** | Forja |
| JetBrains Mono | +29% | 306,0 | **0.86** | Consola |
| Michroma | +38% | 326,8 | **0.81** | Bastión |
| Bungee | +39% | 328,4 | — | *descartada: ilegible* |
| Monoton | +42% | 335,5 | — | *descartada* |

**Serif, las justas.** De catorce mundos solo dos llevan serif —Forja (Cinzel,
inscripcional, que es piedra tallada) y Averno (Grenze Gotisch, que es gótica—.
Todo lo demás va en sans. Una serif de titular a 15 px dentro de una tarjeta se
lee peor y envejece antes.

**La regla no es «una sola letra para siempre».** Es: *ninguna cara se descarta
por ancha; se le declara su escala*, y ese número se comprueba midiendo otra
vez, no calculando a ojo.

```css
--tipo-titulo: "Bungee";
--tipo-titulo-escala: 0.80;   /* comprobado: 262,7 de 266 */
```

Dos avisos que cuestan tiempo si se ignoran:

- **`--tipo-titulo-escala` todavía no existe** en `css/estilos.css`. Hay que
  añadirla al bloque de material y multiplicar por ella los `font-size` de los
  encabezados.
- **Poppins es un 11% más ancha que Outfit** y deja 3 px. Fijar la app a
  Poppins no quita el riesgo: se queda con el menor margen de las que pasan.
- **`document.fonts.ready` no carga nada.** Se resuelve antes de que nadie use
  la cara, y `document.fonts.check()` devuelve `false` para todas. Hay que
  pedir `document.fonts.load()` cara por cara. La señal de que no cargó
  ninguna: las doce miden **exactamente** lo mismo.

## Los catorce mundos

Cuatro familias. **De relato** son los que vienen de un género en vez de una
materia: inspirados, nunca calcados — nombre, marco, letra e ilustración son de
casa, y ninguno lleva marca, icono ni tipografía de nadie.

| Mundo | Qué es | Letra | Ancho | Escala | Esquinas | Peso | Horas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Talavera** | Loza vidriada | Alegreya Sans | −14% | 1 | 14 px · suaves | ~95 KB | Las dos |
| **Grabado** | El de las calaveras | Outfit | +0% | 1 | 0 px · vivas | ~35 KB | Día |
| **Consola** | Gratis, siempre | JetBrains Mono | +29% | 0.86 | 0 px · vivas | ~28 KB | Noche |
| **Neón** | Todo redondo | Baloo 2 | −2% | 1 | Redondas del todo | ~60 KB | Noche |
| **Cyberpunk** | Visor, no marco | Chakra Petch | +4% | 1 | 0 px + chaflán | ~70 KB | Noche |
| **Blueprint** | Nada está terminado | Rajdhani | −10% | 1 | 0 px · vivas | ~65 KB | Noche |
| **Forja** | El buque insignia | Cinzel | +28% | 0.88 | 0 px · vivas | ~180 KB | Noche |
| **Post-it** | Una nota en el corcho | Patrick Hand | −22% | 1 | 2 px · papel | ~45 KB | Día |
| **Arboleda** | Madera y hoja | Amaranth | −4% | 1 | 12 px · sin filo | ~70 KB | Noche |
| **Obsidiana** | El oscuro elegante | Sora | +13% | 0.99 | 0 px · vivas | ~80 KB | Noche |
| **Cénit** | Vidriera de cielo | Julius Sans One | +23% | 0.91 | 3 px · casi vivas | ~85 KB | Noche |
| **Averno** | El oscuro de verdad | Grenze Gotisch | −17% | 1 | 2 px · piedra tallada | ~95 KB | Noche |
| **Ventisca** | Frío con una hoguera | Big Shoulders Display | −26% | 1 | 3 px · chapa | ~90 KB | Noche |
| **Bastión** | Blindaje | Michroma | +9% | 0.81 | 4 px · placa | ~105 KB | Noche |

**Talavera, tercera vuelta — y la lección no es de dibujo.** Las dos primeras
fallaron por sitios distintos y la tercera contesta a las dos. El campo de
flores estaba bien dibujado; lo que estaba mal era DÓNDE iba. En un teléfono el
campo **es** la página: la columna de contenido ocupa todo el ancho y no deja
margen, así que cualquier dibujo con fuerza acaba debajo de una cifra o de un
chip. Medido, las flores daban **1,76** de dibujo justo debajo del XP y de los
tres chips, cuando ningún otro mundo pasaba de 1,35.

Un plato de Talavera está **compuesto**, no estampado: cenefa en el filo, campo
de esmalte liso, y sobre el liso es donde se escribe. Así queda:

| Franja | Qué lleva | Se escribe ahí |
| --- | --- | --- |
| 0–26 px | greca escalonada, geométrica | no |
| 26–88 px | friso de azulejos, la flor a **plena tinta** | no — va detrás de la barra opaca |
| 88–114 px | greca de cierre | no |
| el resto | esmalte liso con la misma flor de **filigrana** | sí, y se lee como sobre papel liso |

La loza además es **blanca** (`#f4f1e8`), no crema, que es lo primero que se
pidió y se había ido perdiendo. Debajo del XP y de los chips ahora hay 1,11-1,25.

**La regla general que sale de aquí**, y vale para los catorce: en un teléfono
sólo hay **dos sitios** donde un dibujo puede ir a plena tinta — detrás de algo
opaco (la barra de arriba, la de abajo, una tarjeta) y en lo que aparece una
sola vez. En todo lo demás tiene que ser filigrana. Blueprint tenía la misma
enfermedad sin que nadie la señalara —su retícula daba 1,53 debajo de lo
suelto— y se atemperó al 52%.

**Descartado: Papel picado.** Tres rondas y en cada una se veía peor. El
motivo no era el dibujo sino el encargo: el papel picado es una guirnalda que
cruza un patio de lado a lado, y aquí tenía que caber en un mosaico de 160 px
que casara consigo mismo por los cuatro costados. Lo que en un patio es una
tira larga, en un mosaico es un cordel que se repite cada palmo. Post-it cubre
el mismo hueco —papel, día, alegre— y no pelea con su propio formato.

**Vitral es ahora Cénit**, con el mismo plomo, el mismo vidrio añil y el mismo
icono; lo que cambió tres veces fue el fondo, hasta llegar a algo que se lee
sin que nadie lo explique.

Las variables de cada uno están en **`mundos/mundos.css`**, los vectores
editables en **`mundos/svg/`**, y la vista comparada en **`mundos/vista.html`**
(ábrela con doble clic, no necesita servidor).

Los nombres `--m-*` de ese CSS son los del borrador. Al llevarlos a la app se
traducen a los de `:root` en `css/estilos.css`, que ya existen:

| En el borrador | En la app |
| --- | --- |
| `--m-pagina`, `--m-grano` | `--sup-pagina` |
| `--m-tarjeta` | `--sup-tarjeta` |
| `--m-marco`, `--m-borde` | `--marco-tarjeta`, `--borde-tarjeta` |
| `--m-r-tarjeta`, `--m-r-chip`… | `--r-tarjeta`, `--r-pastilla`, `--r-factor` |
| `--m-titulo`, `--m-cifra` | `--tipo-titulo`, `--tipo-cifra` |
| `--m-dur`, `--m-curva` | `--dur-media`, `--curva` |

## Cómo se carga un mundo (y cómo NO)

**Las tipografías y texturas de un mundo no van en `ASSETS` de `sw.js`.** Esa
es la lista de la instalación: meterlas ahí le haría bajar el mundo entero a
quien nunca lo va a encender. Van aparte, se piden cuando se enciende el mundo
y se quedan cacheadas por nombre —igual que `css/fuente.css` hoy—.

Y la regla que 0.7.38 volvió inflexible: **al tocar cualquier archivo de
`ASSETS` hay que subir `CACHE` en `sw.js`.** Si no cambia, el aparato instalado
no vuelve a pedir nada nunca.

## Cómo se comprueba que un mundo está bien

En `herramientas/` está el arnés, con su `LEEME.md`. Para un mundo, siete
medidas y ninguna es «se ve bien»:

1. **Contraste sobre el píxel pintado.** Texto por encima de 4,5 sobre 1;
   trazos (aro, barra, contorno) por encima de 3. La forma correcta de medirlo
   se equivocó CUATRO veces antes de quedar bien, y las cuatro merecen
   recordarse:

   | Cómo se midió | Qué reprobaba mal |
   | --- | --- |
   | Leyendo `backgroundColor` tal cual | Blueprint: su `rgba(255,255,255,.035)` se tomaba por blanco opaco |
   | Componiendo la transparencia, pero sin saber leer degradados | Averno y Ventisca, cuyo fondo es un degradado |
   | Fotografiando el TEXTO | todos: una captura de elemento viene sobre transparente |
| Leyendo la tinta con una expresión que solo entiende `rgb()` | todos otra vez, al aparecer `color-mix()` |

   Lo que funciona: **fotografiar la superficie** (`.ficha`, `.lienzo`), que sí
   tiene fondo, y tomar de ahí el color más repetido —degradado y textura
   incluidos—; la tinta sale del CSS, compuesta si es semitransparente. Está
   implementado en el arnés.

   **Y la cuarta, que es la que más engaña: `color-mix()` no se serializa como
   `rgb()`.** Sale `color(srgb 0.39 1 0.70)`, con los canales de 0 a 1. Una
   expresión que saca los tres primeros números y los toma por 0-255 convierte
   cualquier tinta en casi negro, y el arnés devuelve 1,1 donde de verdad hay
   12,6. Un número imposible en la dirección equivocada —el arreglo empujaba la
   tinta HACIA el color legible— es lo que delató que fallaba la medida y no el
   mundo.

   **Lo que faltaba medir: los chips.** Van sobre su propio velo, no sobre la
   tarjeta, y hasta ahora el arnés ni los miraba. Al mirarlos, **nueve chips de
   cinco mundos** estaban por debajo de 4,5 sin que ninguna otra medida lo
   notara. El arreglo es de una línea y vale para todos: la tinta del chip
   se mezcla con la del mundo, `color-mix(in srgb, var(--m-acento) 70%,
   var(--m-tinta))`, en vez de ser el acento a secas.
2. **La tipografía cabe.** Con la fuente descargada e incrustada, no fiándose
   de `getComputedStyle().fontFamily`, que solo repite lo declarado y da el
   mismo ancho para todas aunque ninguna haya cargado. Ese fallo también se
   cometió.
3. **`::after` es de un solo dueño, y `left` mata a `right`.** El fallo más
   caro de todos: tres rondas. Una regla GLOBAL de `.ficha::after` para el
   fleco de Papel picado declaraba `left:0; right:0`. Los adornos de otros
   mundos declaran solo `right`, así que heredaban ese `left:0` — y un
   elemento absoluto con `left`, `right` **y** `width` a la vez está
   sobredeterminado: el navegador **descarta el `right`**. Los anillos de
   Averno y la voluta de Forja se pegaban a la izquierda por eso, no por estar
   mal medidos, y por eso dos «arreglos» seguidos no cambiaron nada.

   La regla: **nada global sobre `.ficha::after`** — cada mundo se lo lleva a
   su bloque— y todo adorno anclado a la derecha declara `left:auto`.
   `herramientas/donde.js` lo comprueba: fotografía la tarjeta con el adorno y
   sin él, resta las dos imágenes y dice en qué porcentaje del ancho está.

4. **Nada legible se escribe encima de un dibujo.** La tarjeta tiene
   superficie propia y protege lo que lleva dentro; el XP, los títulos de
   sección y los chips **no la tienen** y se apoyan directamente en la página.
   `herramientas/debajo.js` lo mide sin razonar sobre el DOM: oculta sólo ese
   elemento —con `visibility`, que no mueve nada—, fotografía su rectángulo
   exacto y mira el reparto de lo que hay detrás. Una superficie lisa da 1,0;
   un dibujo da 1,5 y más. **El límite es 1,35.** Encontró dos mundos rotos que
   ninguna otra medida veía, y uno de ellos nadie había señalado.
   `herramientas/bandas.js` completa la foto: dice a qué altura está el dibujo,
   que es lo que separa «cenefa arriba y campo liso» de «estampado por todas
   partes».
5. **Dos capas orgánicas empachan; una orgánica y una ordenada, no.** No es
   cuestión de cantidad de dibujo. Talavera con flores en el campo Y greca de
   hoja en el filo se sentía un jardín; con la misma cantidad de flor y la
   cenefa en geometría, respira. Arboleda nació con la regla puesta: el dosel
   es el único motivo curvo y la veta de la tarjeta, la barra y los anillos son
   rectos o concéntricos. **Se mide** con `herramientas/campo.js`, que da el
   contraste del fondo contra la página en el percentil 90: por debajo de ~1,6
   el fondo susurra, por encima de ~2 compite con lo que hay que leer.
6. **Un adorno tiene que caber en la tarjeta.** Costó dos rondas: un dibujo
   de 120x120 anclado abajo a la derecha, sobre una tarjeta de 88 px de alto,
   se recorta — y lo que queda a la vista es la parte de ARRIBA del dibujo,
   que en un arco cae hacia la izquierda. Parece que el adorno se cambió de
   lado y en realidad está entero, fuera de cuadro. Lo mismo con estirar un
   dibujo de 120 px a `100%` del ancho: las escuadras de una esquina salen
   como rayas largas. La regla: **caja del tamaño de la tarjeta, o cuatro
   dibujos anclados a sus cuatro esquinas, y nunca `background-size:100% 100%`
   en algo que tiene esquinas.**
7. **Los vectores.** Densidad de tinta (ni vacíos ni manchones), reparto por
   cuadrantes, y si el motivo se repite, que case consigo mismo en los bordes — un cordel que sale por la derecha a una altura y entra por la izquierda a otra deja un escalón visible en cada costura, y una hoja cortada por el borde deja un hueco. Si algo cruza la costura, se dibuja DOS veces, a los dos lados.
   Un motivo de retícula es la excepción: su costura lleva la línea gruesa a
   propósito y NO debe casar.

   **Y la forma de no equivocarse nunca con la costura:** dibujar el motivo UNA
   vez, en un `<g>`, y repetirlo con `<use>` en las nueve posiciones vecinas
   (0, ±lado en x y en y). Lo que sale por un borde entra por el otro por
   construcción, sin contar a mano qué hoja cruza qué lado — que es justo lo
   que dejó el escalón de Papel picado. `herramientas/costura.js` lo comprueba:
   pinta el mosaico dos veces y compara la columna del borde con la del
   siguiente mosaico. Cero es que casa.

Los catorce de este documento pasan las siete. La medida más apretada es la
barra de Grabado (4,3 sobre un mínimo de 3) y el chip de aviso de Post-it
(5,12 sobre 4,5); los tres mosaicos nuevos casan con 0 de diferencia, y lo más
cerca del límite de «escrito sobre dibujo» son Consola y Post-it con 1,35 y
1,31, los dos por rayado fino y no por figura.

**Un aviso sobre `campo.js`:** mide TODO el lienzo, así que un mundo compuesto
—cenefa fuerte arriba, campo liso abajo— le sale alto por la cenefa. Talavera
da 2,58 y está bien: lo que decide es `debajo.js`, que mira sólo lo que hay
bajo el texto. Las dos medidas no dicen lo mismo y no se sustituyen.

## Lo que falta decidir

- **Cuáles tres se construyen primero.** Con catorce sobre la mesa, la lista
  corta hay que rehacerla.
- **Si Bungee y Monoton se archivan del todo.** Las dos entran con escala, pero
  a tamaño de tarjeta son ilegibles. Están fuera de los mundos y solo quedan en
  la pista de pruebas, de contraejemplo.
- **Con qué letra va la app.** Hoy la pantalla va en **Outfit** (incrustada en
  `css/fuente.css`) y los seis correos van en **Poppins**, que sí se carga de
  Google. La marca está partida en dos y conviene cerrarlo antes de que haya
  mundos encima.
- **Cuáles se ganan y cuáles se compran**, y si las dos listas se cruzan.
- **Si el nivel de expedición** —la cifra que sumaría todo el progreso, que hoy
  no existe— es de dónde cuelgan los desbloqueos.

## Cómo seguir aquí

Rama: **`claude/norata-apariencias-skins-p52cpj`**. Ya está publicado en `main`
todo lo de 0.7.37 y 0.7.38; esta carpeta es lo que viene después y todavía no
toca la app.

Nada de `mundos/` se sirve ni entra en `ASSETS`: es documentación, como
`herramientas/`. La app sigue sin compilación.
