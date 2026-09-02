# Versiones de Norata

El número que se ve debajo de Ajustes es el de esta lista. Sirve para dos
cosas: saber si lo que estás viendo ya es lo último que se subió, y poder
nombrar una tanda de trabajo en vez de decir «lo de ayer».

## Cómo se cuenta

```
0 . 6 . 2 . 1
│   │   │   └─ un retoque suelto: un rótulo, un color, un arreglo
│   │   └───── una tanda: varias cosas de una sentada
│   └───────── la app hace algo que antes no hacía
└───────────── 0 hasta la Play Store; 1 el día del lanzamiento
```

| Tramo | Cuándo sube |
| --- | --- |
| **el 4º** | Un retoque suelto. Arreglar lo que se acaba de ver, cambiar un rótulo, corregir un color. |
| **el 3º** | Una tanda: varias cosas de una sentada. Al subirlo, el 4º vuelve a 0. |
| **el 2º** | La app hace algo que antes no hacía, o cambia la forma de usarla: un módulo nuevo, una pantalla nueva. Vuelven el 3º y el 4º a 0. |
| **el 1º** | El lanzamiento en la Play Store. Lo decide Eduardo, no se llega solo. |

**Ningún tramo se para en 9.** No son décimas de verdad, son casillas: después
de `0.6.9` viene `0.6.10`, y `0.6.14.23` es un número perfectamente válido.
Nunca hay que subir de nivel porque el de abajo «se haya llenado» — no se
llena. Se sube de nivel cuando lo que se hizo lo merece, y solo entonces.

La prueba para el 2º: **si el salto no se cuenta en una frase, no es un 2º.**
Diez tandas de arreglos siguen siendo arreglos.

## `0.8` está apartado: es la beta

El único número reservado de antemano. **`0.8` no se coge por acumulación** —
ni por diez tandas, ni por un módulo nuevo, ni porque `0.7` «lleve mucho»—:
es la puerta de la beta, y a partir de ahí el salto es grande.

Así que mientras tanto la cuenta sigue por dentro de `0.7`: después de `0.7`
viene `0.7.1`, y luego `0.7.2`, `0.7.3`… Un módulo nuevo o una pantalla nueva
que en otro momento habría subido el 2º sube el 3º y ya está. Lo decide
Eduardo, igual que el `1.0`.

## Al subir la versión

Cuatro sitios, y son cuatro a propósito:

1. `VERSION` en `js/01-base.js`
2. `VERSION_FECHA`, ahí mismo
3. `CACHE` en `sw.js`, con el mismo número — es lo que obliga a los aparatos
   ya instalados a soltar la copia vieja
4. Una línea en esta lista

## Las fechas van en hora de México. Siempre.

No en UTC, no en la del reloj de la máquina que tocó subirlo: **en la de quien
desarrolla, que es de aquí.** Vale para las dos fechas, la de `VERSION_FECHA` y
la de esta lista.

No es una manía: ya se coló. Una sesión que commiteaba en UTC fechó tres
entradas un día por delante —la 0.7.56.1 decía «2 sep» y se escribió a las 20:33
del 1; la 0.7.49 y la 0.7.50 decían «31 ago» y son del 30—. Con eso la lista
deja de leerse en orden: una entrada nueva puede quedar encima de otra fechada
un día **después**, y a partir de ahí nadie sabe qué se hizo cuándo.

Solo se nota entre las 00:00 y las 06:00 UTC, que en México son las seis horas
anteriores del día de antes. Justo la franja en la que se trabaja de noche.

**Cómo salir de dudas** cuando no se esté seguro de en qué huso va el reloj:

```
TZ=America/Mexico_City date "+%-d %b %Y"
```

México es **UTC-6 todo el año**: el país quitó el horario de verano en 2022, así
que no hay que acordarse de ningún cambio de estación.

## La lista

### 0.7.72.6 · 2 sep 2026

**La 0.7.71.5 se publicó a medias, y la mitad que llegó era la inerte.** Salió
al live la regla `.ms-hueca` —que no la usaba nadie, porque la clase se escribe
desde JavaScript— y la entrada de esta lista contando un arreglo que no
existía. Los dos cambios de `js/05-resumen.js` se perdieron entre sesiones antes
de commitear: el árbol de trabajo se comparte y lo que no ha pasado por
`git add` no existe para git.

Esta versión repone el arreglo entero, tal cual estaba medido:

- **La tarjeta de Misiones deja de borrarse sola cuando hoy no toca ninguna.**
  Devolvía vacío, y una tarjeta que devuelve vacío se cae del tablero. Ahora se
  queda y dice lo que pasa, con dos vacíos distintos —quien no tiene ninguna
  necesita saber qué es una misión; quien las tiene solo necesita el camino
  para adelantar algo—.
- **La columna que pierde una tarjeta se cierra.** Son TRES puertas al mismo
  agujero y ninguna se había tapado: un módulo apagado, la ✕ del Modo Editor y
  una tarjeta sin nada que decir. Que el módulo apagado se lleve su tarjeta sí
  está decidido así; lo que sobraba era el hueco. Suben solo las columnas que
  perdieron algo, no se guarda nada —el sitio sigue en `pos`, y por eso la
  tarjeta vuelve exacta al encender el módulo— y con un arrastre en curso no se
  toca.

**La lección, que es de cómo se trabaja y no de código:** al repasar el diff
final, `css/estilos.css` no aparecía en `git status`. Eso ya era la señal —un
archivo que tocaste y no sale modificado no es que el cambio fuera trivial, es
que ya no está—. Se reescribió y esa mitad sí llegó; la otra se detectó un
día después, preguntando si estaba en el live. Lo que salvó el trabajo fue la
copia en el scratchpad, que ningún `git` toca.

### 0.7.72.5 · 2 sep 2026
**Segunda tanda sobre las celebraciones, otra vez de la mano de Eduardo.**

**1. En un monitor, el texto a la izquierda y la constelación a la derecha.**
Es el orden en que se lee: primero qué pasó, luego el dibujo que lo celebra.
Va con `row-reverse` y no reordenando el marcado, porque en columna —el
teléfono— el orden correcto es el contrario, el dibujo arriba. Y con AIRE: las
dos columnas se juntaban en medio y se pegaban a los bordes, que es lo que hace
que una pantalla completa parezca un recorte. Medido en 1920×1080: 115 px a la
izquierda, 260 a la derecha, 150 arriba y abajo.

**2. La medalla no había crecido.** Un fallo tonto que él vio y yo no: la
0.7.72.3 subió la constante de escala a 0,16 y las dos llamadas que la usan
seguían pasando el `0.1` escrito a mano, así que la medalla se quedó igual de
diminuta. Arreglado y subido a 0,18, con el hueco entre medallas a 19: la
medalla pasó de ~40 px a 83-100, y con las cinco la fila ocupa 88 de las 100
unidades del cuadro —entra justa—. De paso el tope de la constelación sube a
780 px en los DOS lados: la figura se dibuja en un cuadro, así que subir solo
el ancho no la agrandaba ni un píxel.

**3. La tarjeta enseña la miniatura de VERDAD.** Había un dibujo propio —fondo,
una tarjeta y un punto— con sus propias medidas; ahora son las cuatro piezas de
`.amb-mini`, las del escaparate de «Mi apariencia», con las mismas
proporciones: suelo, tarjeta, acento e icono del ambiente. La vista de un
premio tiene que ser la que vas a reconocer cuando llegues a buscarlo. Y el
hueco que deja la miniatura cuadrada dentro de la caja apaisada se pinta con el
suelo de ese ambiente, en vez de dejarlo en el gris de la escena.

**4. El humo de la racha dejaba ver el suelo.** Termina de subir en
`translateY(-4vmin)`, y con el borde del degradado pegado a `bottom: 0` esos
4 vmin descubrían la franja de abajo: un corte horizontal a lo ancho de la
pantalla. Ahora el degradado sobresale 18 vmin por debajo y sigue tapando
durante todo el recorrido. Aprovechando, el ancho del humo y el cerco de la
brasa pasan de `vmin` a `vmax`: en un monitor apaisado 120 vmin son 120
unidades del lado CORTO y no llegaban a los bordes.

**5. El velo de la fiesta pequeña tapa de verdad.** Arrancaba en 0,55 en el
centro, así que la app se leía entera por debajo y el rótulo competía con lo
que hubiera detrás. Ahora va de 0,86 a 0,985, y el modo claro tiene su propio
par —0,92 a 0,995— porque de día lo de debajo es más luminoso y se cuela más.

**6. Cada rango con SU color.** Los cinco ya lo tenían elegido en `EXP_RANGOS`
—menta, celeste, rosa, astro y coral— y la celebración los pintaba todos de
menta: las cinco constelaciones se veían la misma. Ahora el trazo, las
estrellas, el halo, la insignia, la cifra y el nombre salen de `--rango`, que
`ncelPintarMapa` escribe en el contenedor; y **cada medalla del estante lleva
la suya propia**, porque una colección de cinco cosas del mismo color es una
sola cosa repetida. Sin transición en ninguna, que es la trampa conocida de la
casa. Los botones se quedan en menta: eso es el lenguaje de los botones y no
el color de la fiesta.

### 0.7.72.4 · 2 sep 2026

**«Aplicar» en vez de «Ponérmelo».**

Lo paró Eduardo mirando el botón de los temas. La app tutea y habla cerca, pero
un botón no es una frase: «Ponérmelo» le pone voz de primera persona a algo que
solo tiene que decir qué hace, y encima suena a ropa. «Aplicar» dice lo que hace
y se lee igual para un recolor que para un mundo.

Es el único sitio donde estaba. Los comentarios que hablan de «ponérsela» se
quedan: eso es prosa describiendo la acción, no texto de pantalla.

### 0.7.72.3 · 2 sep 2026
**Seis correcciones de Eduardo sobre las celebraciones.**

Las miró en un monitor y en el teléfono y salieron seis cosas. Van juntas
porque son la misma pantalla.

**1. El cielo, que seguía saliendo distorsionado.** Iba por el segundo intento
y el segundo fallaba distinto. El primero era un viewBox de 100×187 con
`preserveAspectRatio="none"`: en 1600×900 eso escala 16 en horizontal contra
4,8 en vertical, así que cada estrella salía como una elipse tres veces más
ancha que alta. El segundo, un cuadro de 100×100 con `slice`, arregló la forma
y rompió el tamaño: 100 unidades repartidas en 1600 px dan 16 px por unidad, y
la estrella que en un teléfono medía 2 px en un monitor medía 13. Lo que
arregla las dos cosas es no tener un cuadro fijo — el viewBox se calcula del
tamaño de la ventana, a razón de **una unidad por cada 4 px**. Medido: 513
estrellas en 1440×900 y 120 en 375×812, con el mismo diámetro medio (2,1 px) en
las dos, y la mayor desviación de la redondez en 0,0001.

**2. La constelación terminada, diminuta en un monitor.** Dos causas. La de la
maqueta: apilada en columna, el dibujo y el texto se reparten el alto, y en
cuanto el texto trae botín al dibujo le quedan las sobras — medido, 187 px de
alto en 1600×900. De lado no hay reparto: **en pantalla ancha y apaisada la
escena va en dos columnas**, la figura en una y el texto en la otra. La figura
completa pasó de 187 a 352 px de alto. La de tiempo: la figura terminada se
encogía hacia el estante 1,5 s después de dibujarse, así que la noticia del
nivel duraba un suspiro; ahora **se queda 2,6 s** y el relevo espera. Y las
medallas del estante pasaron de 0,105 a 0,16 de escala: de cuatro rayas a algo
en lo que se distingue qué figura es cada una.

**3. Las tarjetas de lo que desbloqueas, de verdad grandes.** Eran de 132 px
—lo mismo que un chip— para anunciar una recompensa. Ahora miden 260×244 y
traen las tres cosas que un juego pone en una carta de botín: marco del color
de lo que ganaste, un destello que la barre una vez, y entrada escalonada.
En vertical la carta encoge lo justo (la vista y la letra, no el ancho) y en
pantalla baja ceden todos —insignia, cifra, márgenes—, porque el dibujo es la
noticia: a 360×640 la constelación había quedado en 24 px y ahora son 114.

**4. La escena de racha vuelve a ser la que se aprobó.** El nivel 9 estrenaba
un amanecer con abetos y un degradado, y esa no es la escena de racha: la
aprobada es **la brasa**. Cambiarla por un bosque no era subirla de nivel, era
sustituirla. Ahora el nivel 9 aviva la misma: un cerco de brasa que late tres
veces, la llama más grande y el doble de pavesas (48 contra 26). El peldaño se
llama «Racha avivada».

**5. El círculo congelado.** El segundo aro de la celebración grande llevaba
`opacity: .6` puesta en el elemento para verse más apagado que el primero. Pero
esa opacidad no es de la animación: es la del aro parado, y la animación no
rellena hacia ningún lado. Resultado, un círculo de 180 px clavado en medio de
la pantalla durante los 0,56 s de espera y otra vez al terminar. Lo apagado se
dice ahora en el **borde**, y los dos aros vuelven a ser invisibles fuera de su
momento.

**6. El lenguaje.** «Se abre» no es lo que pasa cuando desbloqueas algo. El
rótulo del botín dice **«Desbloqueaste»**; la lista de la expedición, «Lo que
desbloqueas al subir», y sus chips «Desbloqueado» en vez de «Tuyo»; las cuatro
frases del árbol de talentos dicen «se desbloquea al completar». Y el botón de
la racha decía «Seguir así», que es un consejo: cuando acabas de cruzar un hito
la app dice **«¡Excelente!»**.

De paso, dos cosas que salieron al medir: `.ncel-brillo` ya existía —es el halo
de la estrella recién encendida— y el destello nuevo de las tarjetas lo estaba
pisando; se llama `.ncel-fulgor`. Y un ambiente al que le faltara un tono
dejaba la variable declarada y vacía, lo que no cae en el respaldo de `var()`:
el `color-mix` del marco se volvía inválido y la tarjeta salía con el borde
blanco. Van los tres tonos o ninguno.

### 0.7.72.2 · 2 sep 2026
**El suelo de donde salen nodos, más claro en el modo claro de la casa.**

Las ramas de talentos y las de proyectos puestas en «Verlo como mapa» son la
misma clase de pantalla —un lienzo con nodos encima— y salían con dos grises
distintos según por dónde entrabas. Ahora las dos van en `#e7e9f4`, que eligió
Eduardo.

**Se apunta a «la tarjeta que TIENE un lienzo dentro»** (`:has(.const-wrap)`) y
no a `.branch-card` a secas, y esa es toda la precisión que hacía falta: en
Proyectos el lienzo solo se dibuja en modo mapa, así que la misma regla deja la
vista de lista como estaba **sin una clase nueva y sin tocar el JavaScript**. Una
rama de talentos plegada tampoco lo pinta —dibuja `.branch-collapsed`—, y ahí
tampoco hay ningún nodo que apoyar.

**El alcance, que es lo que se pidió expresamente:** solo el modo claro y solo la
casa — el mundo que en el código se llama «Noche de expedición». Un mundo o un
ambiente ponen `data-apariencia` en `<html>` y con eso quedan fuera por
construcción, cada uno con el suelo que declaró. De noche la regla no existe.

**No se toca `--sup-hondo` global**, y por eso: ese suelo lo comparten dos cosas
que NO son mapas —las columnas del tablero de Misiones y el marco del
previsualizador de mundos—. Tocarlo ahí cambiaría tres pantallas para arreglar
dos. Va en una variable propia, `--lienzo-suelo`.

**Medido, no mirado.** Talentos y el mapa de Proyectos en claro+casa dan
`rgb(231,233,244)`; la rama de Proyectos en vista de lista se queda en
`rgb(211,213,232)`, y las columnas del tablero también. Comprobado que la regla
no alcanza ni a `.col-mis` ni a `.ms-card` —`matches()` da `false` en las dos— y
que `--sup-hondo` global sigue en `#d3d5e8`. Por apariencia: oscuro+casa
`22,28,38`; claro+tinta `215,216,221`; claro+reliquia `205,197,222`;
claro+averno `217,210,204`; oscuro+reliquia `13,9,22`. **Solo cambió
claro+casa.**

**Y una regla de la casa que ahora tiene excepción**, anotada en `CLAUDE.md`: el
suelo hondo iba «de día un pelo más oscuro» que la página. Este es más claro. No
rompe lo que esa regla pide —que se SEPAREN—, porque separa igual: **1,10 contra
el 1,07 de antes**. Y deja una escala de tres peldaños que antes no existía:
página `#dcdef0` → lienzo `#e7e9f4` → tarjeta `#f2f0f9`.

### 0.7.72.1 · 2 sep 2026

**Fundador vuelve al lila, y «Predeterminado» deja de estorbar en el teléfono.**

#### El lila no es negociable

El botón que lleva a Fundador iba en menta, y es la segunda vez que hay que
corregirlo: en esta app **todo lo de Fundador va en lila**, sin excepciones. Un
botón menta que dice «Ver Norata Fundador» lo pinta del color de Pro, que es
justo lo que la pantalla del plan existe para separar — y el mismo error que la
0.7.70 arregló en las cápsulas ya se había colado otra vez en el botón.

`.btn-fundador` se declara al lado de los otros seis y **no es un séptimo
nivel**: el nivel es el mismo que `btn-primary` —«lo que has venido a hacer»— y
lo único que cambia es de qué plan habla. La tinta es `--sobre-vivo` y no
`--sobre-macizo`, porque el lila es un tono vivo y no el acento. Medido: 5,18
sobre el lila de día y 8,17 sobre el de noche.

#### La etiqueta que le robaba el ancho a la frase

«Predeterminado» ocupaba sitio en la fila, y es la etiqueta más larga de las
cuatro — «PRO» son tres letras, ésta son catorce — y encima le toca justo a la
fila que más texto tiene. En un teléfono el resultado era «Noche de expedición»
partido en dos renglones y la premisa en una columna de media pantalla.

Ahora **flota sobre el borde de arriba, a la izquierda**, como una pestaña de la
pieza. Fuera del flujo, el nombre vuelve a caber en un renglón y la frase
recupera el ancho entero. Lleva el suelo de la tarjeta y su borde para leerse
pegada a ella; con fondo transparente se veía la línea del borde cruzándole el
texto por la mitad.

Va igual en los dos sitios donde sale: la fila de la lista y la ficha del
escaparate.

### 0.7.72 · 2 sep 2026

**Las escenas dejan de aparecer de golpe, dejan de estirarse en un monitor y
dejan de ser una pared de color. Y lo que se desbloquea se ENSEÑA.**

Cuatro cosas que se vieron al mirarlo en PC, y las cuatro estaban medidas:

**1. Entraban como un screamer.** Ahora entran en tres tiempos: lo que tenías
puesto se aleja un poco y se apaga (`.app.escena-detras`, 0,42 s), el velo se
hace encima, y solo entonces sale lo de dentro. La escena tiene ahora dos
fases —`entrando` y `show`— porque con una sola clase el número y la
constelación arrancaban a la vez que el velo. El zoom va sobre `.app`, que no
contiene las escenas —están fuera, al final del `body`—, así que no se escalan
a sí mismas.

**2. Se estiraban.** En un monitor de 1600 la franja de la constelación medía
1590 de ancho y la figura salía a **234 px: el 15% de la pantalla**, perdida
arriba. La escena vive ahora en una columna de `min(520px, 92vw)` centrada, y
la misma figura ocupa el 45% de esa columna.

**3. Eran una pared de color.** El fondo ERA el tono del ambiente y encima
llevaba un 12% de menta: con Musgo puesto, verde de borde a borde; con Adobe
—que es el que la propia escena se pone al abrirlo en el nivel 7—, naranja. En
un teléfono se pasaba; en un monitor no. Ahora se parte del negro de escena y
el ambiente entra como un rescoldo en el centro, que es lo que hacían los
borradores aprobados.

**4. «Se abre: Musgo» no decía nada.** Los premios eran renglones con un icono
y un nombre. Ahora cada uno es una **tarjeta con una vista de lo que es**, y
van en fila con arrastre horizontal — lo que hace un juego al enseñarte un
botín, y lo que permite que quepan tres sin apretar la pantalla. El carrusel se
sale del padding del núcleo a propósito: así la tarjeta de la derecha asoma
cortada y se ve que hay más.

**La vista de un ambiente sale de SUS PROPIOS tonos**, leídos de la hoja de
estilos con `ncelTonosDe()`: su suelo, una tarjeta encima y el punto de su
acento. Nadie mantiene una segunda tabla de colores — el día que alguien
retoque Musgo, la miniatura cambia con él. Las de celebración son el propio
gesto dibujado quieto.

Y los peldaños de celebración estrenan `corto`, el nombre que cabe en una
tarjeta: «Destello propio al cumplir una misión» en 132 px son cuatro líneas y
descuadraba la fila.

### 0.7.71.5 · 2 sep 2026

**El escaparate vuelve arriba, y el camino de pago pierde dos ventanas.**

#### Un escenario arriba, y todo lo de abajo se ve igual

Vuelve el preview a lo alto del panel: un escenario que enseña lo que estás
mirando —ambiente o mundo, los dos entran igual— y debajo las dos rejas. Tocar
una tarjeta MIRA; ponérsela es un botón aparte.

Es la tercera forma que ha tenido esta pantalla en dos días y la que se queda.
Hubo una galería de tarjetas con un preview vivo cada una (0.7.70) y luego una
ventana emergente por mundo (0.7.71.3), y las dos fallaban por lo mismo: le
daban a los mundos un peso que los ambientes no tienen, cuando en esta pantalla
las dos cosas son opciones de lo mismo. «Se ejecutaba mejor cuando arriba se
veían todos igual y no solo los mundos aparte» — y con un solo escenario arriba,
lo que cambia es lo que enseña el de arriba y no el tamaño de las cosas de
abajo.

Se retira la ventana emergente entera: `#mundo-modal` de `index.html`, su
`--piso-mundo`, su línea en `CAPAS_QUE_TAPAN` y las reglas `.mv-*` y
`.mundo-card`. Y con ella `abrirMundo()` y `cerrarMundo()`.

#### «Predeterminado»

Noche de expedición lleva su etiqueta. Va en el gris de la app y no en un color
de plan, porque es lo que dice: el mundo original, no algo que se abra pagando
ni subiendo de nivel.

#### La insignia se queda; el texto, no

Lo que ya tienes y **sigue siendo de plan** conserva su piedra —la gema de Pro,
la gema con corona de Fundador— pero sin una palabra al lado. Lo pidió Eduardo y
resuelve las dos mitades del problema: una cápsula que dice «PRO» sobre algo que
ya es tuyo es ruido, pero borrarla del todo hace que un tema de plan y uno
gratis se vean idénticos en cuanto pagas, y entonces lo que compraste deja de
notarse. La piedra sola dice «esto viene con tu plan» sin sonar a candado.

#### Un paywall, no tres

El botón de la ficha va **directo al panel del plan**, que es donde están los dos
precios, lo que abre cada uno y los botones de pagar.

Antes pasaba por `topeAlcanzado("apariencia")`. O sea que para comprar había que
atravesar la ficha —que ya explica por qué está cerrado—, luego un cuadro que
vuelve a explicarlo con otras palabras, y solo entonces llegabas a la tabla:
tres pantallas diciendo lo mismo antes de poder decidir. «Hay demasiadas
ventanas emergentes.»

`topeAlcanzado` sigue viva y sigue siendo la buena para los otros topes —una
rama llena, un informe—, y ahí no sobra: en esos caminos no hay ninguna ficha
que haya explicado nada antes, así que el cuadro es la primera y única
explicación. Aquí era la segunda.

**Ojo con una consecuencia honesta:** sin cuenta, ese botón lleva a «Crear mi
cuenta» y no a la tabla de precios. Es correcto —sin cuenta no hay plan, porque
es donde se guarda— pero conviene saberlo antes de mirarlo.

#### Dos fallos que salieron al medir

- **El nombre de la ficha se salía por encima de la cápsula de al lado.** A 375
  px el flex lo aplastaba a 32 px y el `overflow` estaba en `visible`, así que
  «Averno» se pintaba encima de «NUEVO». Se arregló con la cápsula corta también
  aquí —la frase entera sigue justo debajo, en el bloque del motivo— y acotando
  el nombre con puntos suspensivos, que es el freno para el día que un mundo
  tenga el nombre largo.
- **El modo claro no llegaba dentro del preview.** `sincronizarVistas` buscaba
  `iframe[data-mundo][data-puesto]`, que era el reparto de cuando había una
  galería con un iframe por mundo; con uno solo, `data-puesto` ya no lo pone
  nadie. Ningún error y ninguna pista: el preview simplemente se quedaba de
  noche mientras la app se ponía de día. Ahora va por el `id`.

### 0.7.71.4 · 2 sep 2026

**Mi expedición por fin dice qué es.** Lo cazó Eduardo: la pantalla explicaba
los rangos, los peldaños que abre el nivel y el reparto de los puntos, y en
ninguna parte decía qué es una expedición ni de dónde sale el número grande de
arriba.

Entra un panel corto justo debajo del cielo, que es donde responde a lo que
acabas de ver, y visible en vez de plegado: es lo que hace falta ANTES de leer
lo demás.

Dice dos cosas, y ninguna la decían los otros paneles:

- **que es el nivel de la CUENTA**, no el de una habilidad suelta. Ése es el
  error natural, porque el otro nivel que existe en Norata es justamente el de
  una habilidad;
- **que no hay nada que administrar**: sube solo con lo que ya haces y no tiene
  techo.

Nada de constelaciones ni de rangos: de eso ya habla el panel de abajo, y
repetirlo aquí abarataría los dos.

El último renglón manda al acordeón a propósito. «De dónde salen tus puntos»
está cerrado de inicio desde la 0.7.68 —es la letra chica y ocupaba media
pantalla—, y sin una línea que lo nombre casi nadie descubre que el reparto
exacto está ahí.

### 0.7.71.3 · 2 sep 2026

**Los mundos vuelven a ser renglones. La galería duró una versión.**

La 0.7.70 convirtió la lista de mundos en una galería: cada uno con su vista
previa viva en su tarjeta, los cuatro a la vez, al estilo de la tienda de
Discord. Eduardo la vio publicada y prefiere lo de antes — «se ejecutaba mejor
cuando arriba se veían todos igual y no solo los mundos aparte».

Y tiene razón en lo que señala: una tarjeta grande por mundo convierte esa
sección en algo con más peso que los ambientes de arriba, y en esta pantalla las
dos cosas son opciones de lo mismo. La galería vendía mejor cada mundo por
separado y peor la pantalla entera.

Así que vuelve el renglón: icono, nombre y frase. **El mundo se sigue viendo
entero, con su material, en la ventana que abre el renglón** — eso se queda, y
con ello todo lo demás de la 0.7.70: las insignias del plan en las cápsulas, los
tres colores de candado, la marca «Nuevo», `APARIENCIAS_EXHIBIDAS`, las razones
detalladas con su paywall, y los nombres del punto cero (*Norata Clásico* el
recolor, *Noche de expedición* el mundo).

Las filas bajan de 172 px a 110-126, y la cápsula sigue a la derecha con el
texto corto —«Pro», no «Con Norata Pro»—, que es lo que la 0.7.70 arregló y lo
que hace que quepa sin robarle el ancho a la premisa.

#### El andamiaje que se fue con ella

- `vigilarVistas()`, `montarLasVisibles()`, `VIGIA` y el observador de
  intersección. Existían solo para no montar quince documentos de golpe; con un
  preview cada vez no hay nada que aplazar.
- `tarjetaMundo()` y las reglas `.mun-t` / `.mun-vista` / `.mun-pie`.
- El cuerpo recortado de `escenaCuerpo()`, que era la versión de miniatura.
- `.mun-t` vuelve a ser `.mun-m` en la lista de piezas con marco de
  `mundos/app.py`.

Y dos huérfanos que quedaban de antes y que salieron al barrer: `mundoAbierto`,
que se escribía en dos sitios y no lo leía nadie, y un comentario que nombraba
`mirarApariencia`, una función que ya se había borrado.

#### `css/muestras.css` NO era andamiaje de la galería

Se queda, y con él su línea en `index.html` y en `ASSETS`. Lo pensé al revés al
empezar y la comprobación dice lo contrario: lo leen dos sitios que no tienen
nada que ver con las tarjetas —`.mun-ic`, para pintar el icono de cada mundo en
la lista con SU acento, y `.ap-ic` en la ventana—. Hasta la 0.7.70 los tres iban
en lila, que en esta app es el color de Fundador: con un solo color, catorce
mundos distintos entraban todos por la misma puerta morada. Son 3,3 KB.

#### La idea no estaba mal, el peso sí

Queda apuntado en el comentario de cabecera de la sección por si vuelve: lo que
hundió la galería fue el peso visual, no el mecanismo. Un documento por mundo
sigue siendo la única manera de que dos se vean a la vez —el CSS de un mundo
cuelga de `html[data-apariencia="…"]`—, y el montaje perezoso funcionaba.

### 0.7.71.2 · 2 sep 2026
**El botón de actualizar deja de parecer una fila del menú.**

Estaba pintado como un elemento más de la barra —transparente, plano, con el
rótulo en amarillo y nada más—, y por eso se veía simple: **los otros cinco son
sitios a los que ir, y por eso son transparentes.** Una lista de destinos no
necesita caja, y ponérsela sería subrayar cinco cosas a la vez.

Pero este no es un destino. Es algo que llegó y que está esperando a que
decidas, y una cosa que llega tiene cuerpo.

Ahora tiene tres: **fondo, marco y un disco para el icono.** Los tres salen de
la misma luciérnaga en tres fuerzas —13 %, 26 % y 20 %—, que es lo que hace que
se lea como una pieza y no como un botón al que le pegaron un color encima. El
número pasa del gris a un amarillo apagado por lo mismo: con el gris parecía una
nota que alguien dejó pegada debajo del rótulo.

**El disco no es adorno: plegada la barra es lo único que queda.** Ahí antes
había una flecha de trazo fino suelta en mitad de ochenta y cuatro píxeles, y
eso no se leía como un aviso — se leía como un icono que se cayó.

**Y sube un poco al aparecer.** Aparece de la nada en mitad de lo que estabas
haciendo; que llegue moviéndose es lo que lo convierte en algo que ocurrió, y no
en algo que llevaba ahí todo el rato y no habías visto. Dura lo que un cambio de
pantalla y respeta `prefers-reduced-motion`.

Todo sale de variables, así que no hay nada que mantener en dos sitios: el modo
claro pasa solo a la versión de escribir de la luciérnaga (#755c05 sobre el
papel crema) sin una regla más. Medido componiendo la transparencia sobre el
fondo real de la barra: **8,94 de contraste el título de noche y 5,35 de día**,
y el número 6,54 y 5,68. El umbral es 4,5.

Una línea que hacía falta repetir: `html.sc #nav-update-side { padding-left: 0 }`.
La regla que quita el relleno al plegar lleva dos clases y esta un id, así que
sin repetirla el disco de 30 px no cabía en los 47 que quedan.

### 0.7.71.1 · 2 sep 2026

**La insignia va del color de tu rango en todas partes, no solo dentro del
cielo.** Lo pidió Eduardo al ver que la ruedita del menú de la cuenta seguía en
menta mientras Mi expedición ya iba por colores. Es la misma insignia, y donde
más paga es justamente ahí: en el Resumen y en la fila de la cuenta es lo único
que se ve del recorrido.

Había un interruptor que la dejaba en menta fuera del cielo, y **su motivo ya
no existe**: entonces uno de los cinco rangos era luciérnaga, que de día tiene
que hundirse hasta el dorado apagado que Eduardo rechazó por leerse como una
alerta interna. Al sacar la luciérnaga y el lila del reparto, la objeción se
fue con ellas, así que el interruptor se quita en vez de quedarse apagado.

Medido antes de encenderlo, porque un aro de dos píxeles es un **trazo** y no
texto —umbral 3, no 4,5—: sobre la tarjeta clara los cinco van de 5,44 a 7,55 y
sobre la de noche de 6,71 a 11,68. Pasan los dos umbrales con holgura.

**Y un hueco que destapó la 0.7.71 sin dar conflicto.** Esa versión pasó a
`listo` las tres celebraciones de la escalera, y en «Lo que abre el nivel» un
peldaño sin `id` no es una apariencia: su plan no lo sabe
`aparienciaDisponible`. La de pantalla completa decía «Tuyo» a un plan libre en
cuanto pasabas el nivel 15. Ahora se le pregunta a `planPermite` con la misma
llave que usa `celebracionesAbiertas()`.

### 0.7.71 · 2 sep 2026

**Las tres celebraciones que la escalera prometía y nadie había construido.**

Estaban escritas en `EXP_ESCALERA` sin `listo`, que es la bandera que impide
anunciar lo que no existe — y por eso llevaban meses invisibles. Ya se pueden
cumplir, así que se marcan y aparecen.

| Nivel | Qué abre | Qué es |
| --- | --- | --- |
| 3 | Destello propio al cumplir una misión | El mismo gesto de siempre con una estrella de cuatro puntas naciendo dentro del aro |
| 9 | Escena nueva de racha | **El amanecer**: la luz sube una vez sobre la línea de abetos, en vez del humo y las pavesas de la brasa |
| 15 | Celebración de pantalla completa · **Pro** | La misma noticia con el peso del sello: la insignia cae, golpea y la onda se abre |

Ninguna es una pantalla nueva: son variantes de lo que ya hay, encendidas por
una clase. El marcado, el texto y los tiempos no se mueven, así que no hay tres
maquetas más que mantener.

**De dónde salen.** El amanecer y el sello son dos de los borradores que
Eduardo eligió cuando se rediseñaron las escenas y que se quedaron sin sitio:
la casa se llevó la constelación y la racha la brasa. Aquí encuentran el suyo.

**Tres reglas que las hacen seguras:**

- **Se derivan del nivel, no se guardan.** Mismo trato que los puntos y por el
  mismo motivo: son retroactivas y la sincronía no las puede perder.
- **La de pantalla completa pregunta a `LIMITES`** con una llave nueva,
  `celebracion`, y no lleva escrito el nombre de ningún plan. Al dejar de
  pagar vuelve la de siempre — **apagar no es quitar**, porque la celebración
  base sigue saliendo igual y no se pierde nada de lo hecho.
- **Sigue sin interrumpir.** La grande se va sola a los 2,2 s y no se puede
  pulsar, que es lo que permite celebrar subir una habilidad cien veces sin
  cansar.

Con esto, `escaleraDeExpedicion()` **no promete ni un peldaño sin construir**.
### 0.7.70.2 · 2 sep 2026
**El botón de actualizar dice qué versión entra, y se pone del lado correcto de
la línea.**

Dos retoques del botón que estrenó la 0.7.59.1.

**La línea vuelve a ser de Ajustes.** La tenía el botón, y estaba del revés: al
otro lado de esa raya está lo que se toca todos los días, y de este lado lo de la
app. Ahora el orden es «Actualizar → línea → Ajustes». Lo que **no** vuelve es el
anclaje al fondo: ese se queda con el botón, porque si se lo quedara Ajustes todo
el hueco elástico se metería ENTRE los dos y el botón se iría arriba a hacerle
compañía a Proyectos.

Y la línea baja dos píxeles, de −9 a −4. Estaba a −9 cuando encima solo tenía el
hueco elástico y flotaba sola; con el botón justo arriba el hueco es de 8 px, así
que −9 la metía un píxel **dentro** del botón: invisible en reposo y visible al
pasar el ratón, cortándole el fondo.

**Y dice el número.** Un botón que solo dice «Actualizar» pide un acto de fe: no
sabes si lo que entra es la tanda que estabas esperando o el arreglo de un
rótulo. Ahora lleva debajo `V0.7.70.2`, en el gris de los textos secundarios y
con la V delante, como el pie de la barra.

El número no se inventa ni se pide aparte: **lo manda el service worker en el
mismo mensaje que avisa**, y es el nombre de la caché que ya está bajada. O sea
que no es una promesa de lo que habrá, es lo que ya está ahí esperando a que
pulses. Si algún día llegara sin número, el renglón desaparece solo (`:empty`) y
el botón se queda como estaba. El toast del teléfono lo dice también: «Ya está
lista la versión 0.7.70.2».

**Una línea de CSS que hacía falta escribir:**

```css
html.sc #nav-update-side .nav-label { display: none; }
```

El rótulo de dos renglones se estiliza con un selector que lleva un id, y un id
le gana a `html.sc .nav-label` por especificidad. Sin esa línea el rótulo
sobrevivía al plegado y se salía de una barra de 84 px.

Medido con las animaciones saltadas: desplegada 209 × 64 —cuatro píxeles más alto
que antes, por el segundo renglón— con la línea de Ajustes a 767, dentro del
hueco y no dentro del botón; plegada 47 × 52, solo el icono, sin salirse.

**Y dos fechas más de la lista, corregidas.** La 0.7.65 y la 0.7.67 decían «1
sep» y se commitearon a la 01:02 y a la 01:26 del 2 en hora de México: quedaban
por debajo de la 0.7.66, que ya decía «2 sep», o sea una entrada más vieja
fechada después que una más nueva. Es el caso de trabajar pasada la medianoche, y
la regla lo resuelve igual: manda el reloj de México.

### 0.7.70.1 · 2 sep 2026

**El cielo de Mi expedición se ensancha, y las fugaces dejan de verse antes de
tiempo.** Las dos las cazó Eduardo mirando la 0.7.69.

**El fallo de las fugaces:** «muestra las estrellas caer antes de tiempo y sin
animación». **Una animación con retardo no pinta su primer fotograma mientras
espera — pinta el estilo BASE del elemento**, que era opacidad 1. Así que las
tres se quedaban quietas y visibles en su punto de partida durante los primeros
segundos: 0,4 s la primera, 5,7 la segunda y 10,2 la tercera. Se arregla con
`backwards` —que hace que el retardo use el 0% del keyframe— más `opacity: 0`
de base, que cubre el instante anterior a que la animación exista. Medido: en
el instante 0 y a mitad del retardo, las tres a opacidad 0; cruzando, 0,875.

**Y el cielo se siembra por fuera del encuadre.** Lo pidió así: «que sea más
amplio hacia los bordes y esté enmascarado dentro de su espacio, para que se
vean más estrellas que no se ven cuando uno mueve el cursor». Sembrado justo en
el encuadre, el paralaje arrastraba el borde a la vista y por ese lado no había
nada: el cielo se acababa, que es lo contrario de la profundidad que se
buscaba.

Ahora hay `EXP_MARGEN` de 44 unidades de más por los cuatro lados y el SVG pasa
a `overflow: hidden`, que es lo que lo enmascara. **De 79 estrellas a 145, con
76 de ellas fuera del cuadro esperando a que muevas el cursor.** El paralaje
del polvo sube de 9 a 16 px para que de verdad entren.

El margen tiene que ser mayor que lo que el paralaje mueve el polvo o se vería
el borde del sembrado, que es el mismo fallo con otro tamaño.

### 0.7.70 · 2 sep 2026

**Mi apariencia se vuelve una galería: cada mundo se enseña solo.**

Era una reja de muestras y una lista de renglones, y de un mundo no decían casi
nada — tres tonos y una frase describen un RECOLOR, y lo que un mundo cambia es
el material. La única prueba de verdad era ponérselo, que además recarga la app.

Ahora cada mundo es su propia vista previa **viva**, en su tarjeta, y se ven
todas a la vez: su tipografía, su textura, su marco y el nombre que ese mundo le
da a tu rango. Averno sale en gótica sobre piedra quemada y te llama *Leviatán*;
Blueprint en papel de plano y te llama *Proyectista*; Reliquia en terciopelo con
marcos de latón y te llama *Colección*. Tocar una abre su ventana, con la
premisa, los cinco nombres del camino y —si está cerrado— por qué y por dónde se
abre. La referencia es la tienda de Discord y la puso Eduardo.

#### Por qué un documento por tarjeta, y por qué no se montan todos

El CSS de un mundo cuelga de `html[data-apariencia="…"]`, así que la única
manera de que dos mundos se vean a la vez en la misma pantalla es que cada uno
tenga su propio `<html>`. No hay truco que lo evite. Lo que sí se puede es no
pagarlo hasta que haga falta: un `IntersectionObserver` los monta al entrar en
pantalla y los deja puestos. Con quince mundos, quien no baje monta tres.

Antes de esto hubo un intento de **un solo escenario compartido** arriba del
panel, que enseñaba el mundo que tocabas. Escalaba mejor y estaba mal: obliga a
elegir antes de ver, y lo que esta pantalla tiene que hacer es lo contrario.

#### Las cápsulas del candado

- **Llevan la insignia del plan**: `plan-pro` (la gema) y `plan-fundador` (la
  gema con corona), las mismas que la app ya usa en la chapa del menú, en la
  fila de Ajustes y en el cuadro del tope. Cuatro sitios, un símbolo.
- **Son tres colores y no uno.** Iban las tres en lila, que en esta app es el
  color de Fundador: «Con Norata Pro» pintado de Fundador dice que Pro y
  Fundador son lo mismo, que es justo lo que la pantalla del plan existe para
  separar. Menta lo que abre el plan, lila lo que solo abre Fundador, y
  luciérnaga lo que todavía se está ganando — que no se compra, y por eso no
  puede ir del color de lo que se paga. Medidos los tres pares en modo claro:
  5,33 · 5,35 · el lila ya estaba medido.
- **Y son pequeñas.** Iban a 10 px con peso 800 y espaciado ancho, y al lado de
  «Averno» se leían antes que el mundo. En una tienda la etiqueta del precio no
  puede gritar más que el producto. Ahora pesan 700, van a 9 px, y en la tarjeta
  el texto va corto («Pro», no «Con Norata Pro»); entero solo en la ventana.
- **`NIVEL 5` no lleva insignia de plan**, y es la misma regla de siempre: el
  nivel no se compra, y la piedra ahí diría lo contrario del texto de al lado.

#### Lo cerrado ya dice por qué

Un candado decía «Nivel 5» o «Con Norata Pro» y se acababa ahí; al tocarlo salía
un toast de cuatro segundos. Eso es contestar el instante de más intención de
compra que tiene la app con un aviso que desaparece antes de que a nadie le dé
tiempo a decidir.

Ahora la ventana dice el motivo entero, y **saca el cuadro del plan** cuando lo
que falta es pagar — `topeAlcanzado("apariencia")`, el mismo que sale al llenar
una rama, con lo que abre y el precio dentro. El orden de las dos puertas no
cambia: primero el NIVEL, que se gana, y después el PLAN, que se paga; a quien
todavía no llega al nivel no se le ofrece pagar, se le dice cuánto le falta.
Fundador no pasa por ese cuadro y va directo al panel del plan: ese cuadro vende
Pro, y Reliquia no se abre con Pro.

De paso, la frase de `topeTexto("apariencia")` dejó de hablar de «paletas de
color» y «apariencias completas», que eran dos nombres para cosas que ya se
llaman **ambiente** y **mundo** en toda la app. Era el peor sitio para llamarlas
de otro modo: es el único que se lee con la cartera en la mano.

#### «Nuevo» durante mes y medio

Cada apariencia lleva `estrena`, la fecha en que se publicó, y sale marcada
**Nuevo** durante `NOVEDAD_DIAS = 45`. Se apaga sola, así que lo viejo no
necesita que nadie vaya a limpiarlo. La fecha se escribe a mano al soltar el
tema y no sale de la versión: una apariencia puede estar en el código tandas
antes de que se exhiba, y lo que cuenta es el día que apareció en la pantalla de
alguien. Va con la hora pegada (`+"T00:00:00"`) porque una fecha sola la lee el
navegador como UTC y el estreno empezaría seis horas antes.

#### El interruptor del lanzamiento

`APARIENCIAS_EXHIBIDAS`, una sola línea en `js/10i-apariencia.js`. En `null`
—como está— se enseña todo lo que esté listo. Con una lista se enseña solo eso,
y ése es el plan de Eduardo: ir soltando los temas conforme se compruebe que
funcionan, y salir a la calle enseñando únicamente el clásico y el de Fundador.

```js
const APARIENCIAS_EXHIBIDAS = ["casa", "reliquia"];
```

Va aquí y no como un `oculta: true` repartido por las quince entradas por eso
mismo: apagar ocho cosas de una en una son ocho sitios donde olvidarse uno.
Quien ya tenga un tema puesto lo conserva aunque se deje de exhibir — congelar,
nunca quitar.

#### Los nombres del punto cero

El recolor de partida es **Norata Clásico** y el mundo de partida es **Noche de
expedición**. Son dos ejes y `casa` es el punto cero de los dos, así que lleva
un nombre en cada reja y la ventana usa el de la reja por la que entraste.

Separarlo destapó una mentira que llevaba puesta la fila de los mundos: decía
«Sin mundo: el material de siempre, con el ambiente que lleves puesto», y
elegirla te quitaba también el recolor. Claro que te lo quita — ambiente y mundo
comparten UN atributo, son excluyentes a propósito. Ahora lo dice: «Elegirlo te
quita el mundo y el recolor que lleves puestos.»

#### `css/muestras.css`, un archivo nuevo

Tres tonos por mundo —suelo, tarjeta y acento—, generados por `mundos/app.py`
desde los mismos datos que el mundo de verdad, así que no pueden discrepar. Va
suelto y **sí** en `ASSETS`, al contrario que `css/mundos.css`: son 3,3 KB
contra 180, y el catálogo tiene que verse entero sin haberse bajado ningún
mundo, que es el caso de todo el mundo la primera vez que abre esa pantalla.
Lleva los quince y no solo los tres construidos, para que el día que un mundo
pase a `listo` nadie tenga que acordarse de volver ahí.

Con eso, el icono de cada mundo va con **su** acento y no con el lila de
Fundador que llevaban los tres: con un solo color, catorce mundos distintos
entraban todos por la misma puerta morada.

#### Un fallo de caché que salió por el camino

El preview pedía `css/mundos.css` **sin la huella `?h=`** cuando lo que se
miraba no era un mundo. Eso es la copia vieja congelada para siempre de la
0.7.55.3 entrando por una puerta nueva: ese archivo no está en `ASSETS`, así que
no lo renueva la instalación; se pide suelto, lo que llegue se guarda bajo esa
dirección, y a partir de ahí ya es un acierto que no se vuelve a pedir nunca.
Ahora, sin `link` con huella no se pide nada — de un mundo no hay nada que
enseñar hasta que la haya.

Y `css/mundos.css` se pide al **abrir el catálogo** y no al encender un mundo:
quien llega a esa pantalla vino a mirarlos, y la galería no puede enseñar
ninguno sin él. Quien nunca la abre sigue sin bajárselo.

#### Cómo se comprobó, y lo que no se pudo

Comprobado midiendo el DOM: los cuatro previews con material distinto lado a
lado (tipografía, radio de esquina, color de tarjeta, acento y nombre de rango),
los dos modos con sus dos caras, el paywall desde la ventana, ponerse un tema,
la palomita de «puesta», y sin desbordes a 375 y a 320 px. Y una comprobación
que importaba: **cargar `css/mundos.css` en la app no cambia nada** cuando no
hay mundo puesto — 654 elementos, 0 diferencias de estilo calculado, medido
encendiendo y apagando el `link`.

**Lo que no se pudo comprobar aquí: el camino de bajar en la galería.** La carga
perezosa se montó con `IntersectionObserver` y la galería salía entera en
blanco. Se cambió por un oído de `scroll` y tampoco: **ese panel no despacha
eventos de scroll en absoluto** —comprobado con un oído recién puesto y un
`scrollTop += 200`: cero avisos—, porque los dos dependen de que el navegador
componga fotogramas. Es la misma familia de trampa que deja las transiciones
congeladas para siempre, la que ya está en CLAUDE.md. O sea que el cambio se
había hecho por un artefacto del entorno y no por un fallo, y se deshizo.

Se queda el observador, que es la herramienta correcta, y al lado
`montarLasVisibles()`: una medición síncrona de rectángulos, que sí funciona sin
dibujar nada y garantiza que la primera pantalla nunca salga vacía en ningún
sitio. Con tres mundos todos caben en la primera pantalla y da igual; **conviene
mirar el scroll en un teléfono de verdad cuando haya ocho.**

#### Al añadir un mundo, ahora hay una trampa más

El sellador de la huella busca por TEXTO la línea donde se asigna el `href` del
archivo de los mundos. Un comentario que cite esa marca se sella también, y se
queda con una huella vieja dentro para siempre. Pasó al escribir el comentario
de `direccionDeLosMundos()` en esta misma tanda.

### 0.7.69 · 2 sep 2026

**Las estrellas fugaces se rehacen con cabeza y cola, y la barra del nivel se
muda a la racha.**

Las dos cosas las pidió Eduardo mirando la 0.7.68.

**La fugaz ahora es luz y no una raya.** Lo corrigió con una captura delante:
«un punto destelleante y un degradado en la cola para simular la animación de
la luz, y que se atenúe todo para desaparecer en el cielo». Así que son dos
piezas:

- la **cabeza**, un disco de 1,15 con su halo — es lo que se ve, y lo que hace
  que parezca luz y no un círculo pintado;
- la **cola**, un triángulo de 19 de largo con un degradado que se apaga hacia
  atrás. Triángulo y no línea: una línea tiene grosor constante, y una estela
  que no se estrecha es un palo.

El degradado se declara una vez en `<defs>` y lo usan las tres. Va en
`userSpaceOnUse` porque en el sistema de la caja un degradado horizontal sobre
un triángulo casi plano sale impredecible; como las tres colas viven en las
mismas coordenadas locales, con una definición basta. El halo va en la cabeza
sola y no en el grupo: sobre la cola lo ensucia. Y la atenuación se lleva los
últimos catorce puntos de la vuelta, para que se apague en vez de cortarse.

**Y la barra se comparte.** «Me enamoré de tu barra de carga… se podría sacar
provecho en otras áreas, como en Racha». Ya no vive en Mi expedición: es
`.barra-viva`, con su llenado de entrada, su punta encendida y su estela, y la
usan cuatro sitios. El alto se pide con `--alto` porque ninguno lo quiere
igual: 5 px debajo del nivel, 4 en las cifras de la racha y 8 en el próximo
hito.

En la tarjeta de la racha entran tres:

| Dónde | Color | Por qué |
| --- | --- | --- |
| esta semana | luciérnaga | es el color de la llama, que ya manda en esa tarjeta |
| en \<mes\> | menta | el acento, que es el del calendario de al lado |
| próximo hito | menta | la barra grande, y donde más paga |

«4/7» dice el dato y no dice de un vistazo si vas bien: una fracción hay que
resolverla, una barra se ve. Y el próximo hito era un carril muerto debajo de
lo único de esa tarjeta que mueve a volver hoy.

**El día en curso deja de estar quieto.** También lo pidió. Es un pulso que
sale del borde de la casilla y se abre, como el eco de un radar: dice «este es»
sin robarle la atención a las casillas llenas, que son las que cuentan la
racha. Va en un `::after` y no en el `box-shadow` de la casilla porque lo que
se anima es una escala, y escalar la casilla movería su número. **Y la llama
respira** mientras la racha esté viva —tres segundos y medio, un halo que crece
poco—; con la racha rota se queda quieta, porque una llama que late encima de
un cero anima algo que no está pasando.

`.sgh-b` pierde su `overflow: hidden`: la punta encendida tiene que poder
salirse del carril, que es justo lo que la hace parecer luz.

**Comprobado midiendo el DOM:** las tres barras de la racha con su alto, su
color y sus tres animaciones (`expLlena`, `expPunta`, `expEstela`); el pulso de
hoy y el de la llama; las tres colas con su degradado y sus tres cabezas con su
halo, congeladas a media travesía para verlas. En los dos modos —la tarjeta de
la racha es una escena y se queda de noche, así que sus tonos no cambian— y sin
desbordar a 375 px.

### 0.7.68 · 2 sep 2026

**Mi expedición se rehace entera: el cielo sube a la pantalla y se mueve, los
rangos dejan de decir «Pasado», la barra del nivel se enciende y la letra chica
se pliega.**

La pantalla existía desde el nivel de expedición y no había vuelto a tocarse.
Eduardo la miró y la resumió: «cero informativo, cero interesante y bastante
olvidable».

**1. El cielo, que ya estaba dibujado y no se veía.** Las cinco constelaciones
—la bota, la huella, el farol, el mapa y la brújula— solo salían durante los dos
segundos de la celebración de subir de nivel. Ahora encabezan la pantalla, con
la misma composición de la celebración porque es lo que hace que las dos sean el
mismo sitio: la que estás cerrando en grande, y las cerradas en un estante
arriba, titilando. Las estrellas que faltan quedan como **aros vacíos que se
cuentan**, que es lo que convierte «te faltan 235 puntos» en «te falta media
figura».

Cuántas van encendidas lo decide `ncelHasta()` y no una cuenta propia: desde la
0.7.65 cada figura tiene las que pide el dibujo, y dos verdades sobre lo mismo
es justo lo que no puede haber.

Tres altos y no uno —con altar (190), vitrina (150) y vacío (118)—: con un alto
fijo, los dos extremos de la vida de una cuenta dejaban media tarjeta de negro.
Y una primera versión con las cinco en hilera y del mismo tamaño no se sostuvo:
a esa escala una constelación son cuatro rayas de medio píxel.

**2. El cielo se mueve.** Lo pidió Eduardo: «que reaccione al paso del mouse y
que se anime ligeramente, como leves estrellas fugaces». Dos cosas:

- **Paralaje de tres capas.** El polvo se mueve a favor del puntero (+4,3 px
  medidos), las medallas en contra (−2,9) y la figura viva más (−6,2). Solo
  donde hay puntero de verdad: en un teléfono `pointermove` llega con el dedo y
  dejaría el cielo torcido sin forma de enderezarlo.
- **Tres estrellas fugaces**, y la palabra que manda es *leves*: cada una cruza
  en 1,7 s y pasa otros once quieta y a opacidad cero. Pasa una cada cuatro
  segundos y medio y nunca dos a la vez. Es lo que separa esto de los rayos
  giratorios que se quitaron en la 0.7.48 —«algo que gira sin final es
  decoración de fondo, no un acontecimiento»—.

Señalar una constelación la acerca, la enciende y dice de qué rango es.

**3. La barra del nivel, con estela.** Se llena al entrar, lleva una punta
encendida en la cabeza y un brillo que la recorre cada dos segundos y medio,
todo del color del rango que llevas puesto. Se anima con `transform` y
`opacity` y nunca con un color: un color que sale de una variable se queda
congelado en Chrome, y esa trampa ya mordió cuatro veces en esta app.

**4. Un color por rango — y ni lila ni luciérnaga.** El primer reparto usaba los
cinco acentos de la casa y Eduardo lo paró en la primera mirada: el **lila** es
de Fundador y de nada más —se sacó del amarillo justo para que dijera una sola
cosa— y la **luciérnaga** es «mira esto», el color de un cobro que falló o de la
trastienda. Un rango pintado con cualquiera de los dos no es variedad de color,
es un mensaje equivocado.

En su sitio entran dos tonos propios que no dicen nada más:

| | Noche | Día (sobre la tarjeta clara) |
| --- | --- | --- |
| `--rosa` | `#f2a0c4` | `#ad2e74` · 5,44 |
| `--astro` | `#cfe2f7` | `#2f4d7a` · 7,55 |

El rosa se queda en la banda de los otros tres (menta 5,46, celeste 5,48, coral
5,48) para que los cinco se lean como una familia. **`--astro` es la excepción a
propósito**: es el último de los cinco, de noche es luz de estrella —que es lo
que tiene que ser el color del final del camino— y de día eso no existe, así que
se convierte en la tinta más honda. Va saturado porque con `--faint` al lado
(4,69 y sin saturación) un azul apagado se habría leído como «desactivado».

El reparto queda menta (160°), celeste (204°), rosa (330°), astro (sin matiz) y
coral (12°): el único par cercano sería rosa-coral, y entre los dos va el astro.

Y el candado de un peldaño sigue la misma regla: **lila solo si lo que cierra es
Fundador**; lo que cierra Pro va en celeste, que aquí no significa nada más.

**5. Los rangos ya no se apagan.** Decían «Pasado» en gris —más apagado incluso
que los que ni has alcanzado—, y un logro escrito en pasado y en gris se lee
como algo que se te fue. Ahora dice **Conseguido** con su palomita, conserva su
color, y los cinco pasan de una reja de pastillas a filas: en 84 px no cabe la
línea que explica de qué va ese tramo del camino. Las notas están escritas sin
nombrar el rango, para que un mundo pueda renombrarlos sin romperlas.

**6. Lo que abre el nivel, que nunca se enseñó.** `EXP_ESCALERA` existe desde el
primer día y esta pantalla no la pintaba, con el archivo diciendo al lado que
«un premio sorpresa no mueve a nadie y uno que se ve venir, sí». Salen los cinco
ambientes con su nivel, su propio dibujo y su estado, y por qué no lo tienes se
lo pregunta a `aparienciaDisponible()`: un solo dato por chip.

**7. De dónde salen tus puntos se pliega.** Cerrada de inicio y sin recordar
estado. Al abrirla **explica cómo se gana cada fuente** —las reglas estaban
medidas en `EXP_PUNTOS` desde siempre y nunca se le habían dicho a quien las
está viviendo— y cada una lleva su color.

**Tres arreglos que salieron por el camino:**

- **`--celeste` faltaba en la lista de la escena** (`.scene-card, .celebrate,
  .ncel, .scel`) desde que esa lista existe. No se había notado porque ninguna
  escena lo usaba; el cielo sí, y en modo claro una constelación tomaba el
  celeste de día —`#0f688f`— encima de un cielo casi negro. Medido, 1,6 sobre 1.
- **El nivel 31 en adelante.** El cielo pregunta por `desde + EXP_POR_RANGO` y
  no por `ncelIndiceRango()`, que cuenta sin techo y en el 31 devolvía la quinta
  figura recién empezada cuando ya está cerrada.
- **El paralaje no se movía aunque el oyente funcionaba.** El `0` de reserva
  estaba declarado en cada capa, y una propiedad personalizada declarada en el
  propio elemento gana a la que hereda: pisaba el valor que se escribe arriba.
  Medido: `--mx` llegaba a 0,477 y el `transform` seguía en la matriz identidad.
  El valor de reserva va en el elemento de fuera.

**La insignia toma el color del rango solo dentro del cielo.** Fuera —el
Resumen, la fila de la cuenta— sigue en menta: ahí cae sobre papel en modo claro,
donde los cinco se hunden a tinta y un aro de dos píxeles ya no dice de qué color
es. Se enciende con un segundo argumento.

**Comprobado midiendo el DOM** en quince niveles (0, 1, 5, 6, 7, 12, 13, 18, 19,
24, 25, 30, 31, 50 y 120): medallas y altar cuadran con el nivel en los quince,
los cinco rangos siempre están, las tres fugaces se siembran siempre y no
desborda de lado en ninguno. En los dos modos, con paralaje medido en las tres
capas y su vuelta al centro, y a 320×480 sin cortar un solo rótulo.
### 0.7.67 · 2 sep 2026

**Un rango se consigue al cerrar su constelación, no al estrenarla.**

Lo paró Eduardo mirando los textos: la escena decía «Ahora eres Rastreador» el
día que se enciende su PRIMERA estrella, cuando lo que hay ahí es un dibujo por
hacer. Empezar y conseguir son dos momentos y ahora se dicen distinto:

| Cuándo | Qué dice |
| --- | --- |
| El primero del tramo | Empiezas a trazar **Rastreador** |
| Los de en medio | Alcanzaste el nivel 9 de tu expedición |
| El sexto, que la cierra | Rango **Rastreador** conseguido |

Y arrastra tres cosas más, que son las que hacen que el cambio sea de verdad y
no de rótulo:

- **`EXP_ESCALERA` anuncia los rangos donde se ganan**, en 6, 12, 18, 24 y 30
  y no en 1, 7, 13, 19 y 25. Con lo de antes, la tarjeta del Resumen prometía
  «Rango Rastreador» para el nivel 7 — el nivel en que ese rango empieza a
  dibujarse. Los peldaños de celebración se corren a los huecos: 3, 9 y 15.
- **El emparejado de `escaleraDeExpedicion()` va por el nivel donde se
  consigue** (`desde + EXP_POR_RANGO - 1`) y no por `desde`, para que un mundo
  con sus propios nombres siga cuadrando.
- **La cita del rango sale al conseguirlo.** La añadió otra sesión colgada de
  «estrenar»; puesta ahí coronaba un nombre que aún no era tuyo.

### 0.7.66 · 2 sep 2026
**Averno: el banner deja de tener un hueco de 200 px, y el modo claro se limpia.**

Cinco cosas que salieron de mirarlo puesto, y la primera es un bug mío.

**El banner.** Al sustituir la ilustración de la banda por los anillos la apagué
con `opacity` en vez de `display`, razonando que «así conserva su alto y la
banda no se encoge». El razonamiento estaba al revés: ese `<svg class="scene">`
va EN FLUJO y aporta 193 px, así que apagarlo sin quitarlo dejaba una banda de
**376 px con 177 de contenido**. Doscientos píxeles de nada. Ahora mide 179 con
177 — dos de hueco. Y los anillos dejan de escalar con ella: con `contain`
crecían hasta 574x349 porque seguían a la caja.

**Y dejan de ser transparentes**, que es lo mismo por otro lado: sin
ilustración debajo, lo que se veía por el hueco era la ceniza de la página
compitiendo con las cifras. La superficie la pone el panel, y el velo —que
existía para tapar un paisaje— se apaga porque ya no hay paisaje.

**Las cifras salen de la gótica.** Grenze Gotisch tiene numerales muy
dibujados: un titular en esa cara es carácter, pero un «3» a 18 px dentro de un
banner es un acertijo. Pasan a Outfit y los títulos se quedan góticos — es lo
único del mundo que usa la letra de la casa, y a propósito: una cifra se LEE y
un título se MIRA.

**El fondo, aligerado.** «Demasiado cargado de elementos y agobia con el
tiempo», que es la frase clave: un fondo se mira mil veces, así que lo que en la
primera pasada es atmósfera en la décima es ruido. La ceniza pasa de 18 motas,
3 brasas y 2 volutas a 10, 2 y 1, con las opacidades de .495 a .34 y de .765 a .5.

**Y el modo claro deja de ser barro.** El diagnóstico no era el croma sino la
LUZ: la página de día estaba en L 0,852 contra el 0,904 de la casa, y el suelo
de los mapas —que se deriva hundiéndola— caía en 0,821. Ahí es donde un cálido
con algo de color deja de ser beige y pasa a ser barro; la casa se salva porque
su gris es AZUL, y un azul sucio no se ve sucio. La página sube a 0,900 y el
suelo pasa de `#cdc2bc` a `#d8d4d1`.

**Tres arreglos que salieron de quitar la ilustración.** La banda ya no es una
escena, así que en modo claro se quedaba como una losa negra sobre el papel:
ahora sigue al modo. Con eso la pastilla de foco se quedó con el vidrio de noche
y la tinta de día —1,30 de contraste— y los deltas verdes se quedaron claros
sobre papel; los dos se arreglan trayendo sus variables, no con reglas aparte.
Y la pastilla pierde su tinte en los dos modos: se pinta con `color-mix(--mint
14%, …)` y su rótulo es de ese mismo `--mint`, así que el tinte empujaba el
fondo justo hacia donde está la tinta.

Medido con el barrido de control sobre 427 elementos: **cero fallas de contraste
exclusivas de Averno en los dos modos**. De día Averno falla 11 y la casa 70; de
noche 24 contra 25.

### 0.7.65 · 2 sep 2026

**La constelación deja de contar niveles y pasa a dibujar el objeto del rango,
y la escena dice lo que acaba de pasar.**

Atar una estrella a un nivel parecía elegante y era una jaula: obligaba a seis
puntos por rango, y con seis puntos no se dibuja una bota —salían formas
abstractas que nadie leía como su oficio—. Ahora **cada figura tiene las
estrellas que pide el dibujo** (doce la bota, catorce la huella y el mapa) y el
progreso se reparte: `ncelHasta()` enciende el tramo que toca en cada uno de
los seis niveles del rango. Lo que se ve es que cada nivel AVANZA el dibujo,
no que cada nivel valga un punto.

**Los textos dicen lo que pasó, no un rótulo.** «Rango Andante» era una
etiqueta cierta siempre, y por eso no era noticia en ninguno de los seis
niveles. Ahora hay tres frases y cada una solo vale en su momento:

| Cuándo | Qué dice |
| --- | --- |
| Un nivel cualquiera | Alcanzaste el nivel 4 de tu expedición |
| El sexto del rango | Rango **Andante** completado |
| El primero del siguiente | Ahora eres **Rastreador** |

Y el botón pasa de «Seguir» a **«Continuar»**.

**La escena se reparte el alto en columna**, y eso no es cosmética. Con el
dibujo y el texto superpuestos, la escena con premio —que trae la lista de lo
que se abre y dos botones— subía el texto hasta dentro de la constelación:
medido, **98 px de solape**. En columna el mapa ocupa lo que sobra: 467 px sin
premio y 329 con él, sin tocarse en ninguno de los nueve niveles probados.

**Una trampa nueva para la lista, y ya costó media hora:** al medir esto, el
banco de pruebas seguía aplicando la hoja de estilos ANTERIOR aunque el
servidor mandara `Cache-Control: no-store`, aunque el `fetch` a esa misma URL
devolviera la versión nueva y aunque se cerrara la pestaña. Lo que lo delata
es leer `document.styleSheets` del iframe y comparar su regla con lo que
responde el servidor: si difieren, lo que está mal es la prueba. La salida es
inyectar las declaraciones con un `<style>` y medir eso.

### 0.7.64 · 1 sep 2026
**Averno cambia de concepto, baja el naranja y por fin trae sus anillos.**

El mundo se subió en la 0.7.59 con los rangos equivocados: eran los estados del
fuego —Ceniza, Chispa, Brasa, Llama, Hoguera— y describían una fogata, que es
el tema *visual* de Averno pero no su concepto. Eduardo lo corrigió: **el
concepto es demonología cristiana.**

La línea que separa esto de un disfraz —y es la que hay que sostener al tocar
cualquier cosa de este mundo— es **teología, no utilería**. Cada peldaño cita
un texto, y de utilería no hay nada: ni diablillos ni tridentes.

| Nivel | | De dónde sale |
| --- | --- | --- |
| 1 | **Ceniza** | «Me arrepiento en polvo y ceniza» · Job 42:6 |
| 4 | **Sello** | «Lo ató, y puso su sello sobre él» · Apocalipsis 20:2-3 |
| 10 | **Leviatán** | «No hay sobre la tierra quien se le parezca» · Job 41:33 |
| 18 | **Legión** | «Legión me llamo, porque somos muchos» · Marcos 5:9 |
| 28 | **Abadón** | el ángel del abismo, rey de las langostas del pozo · Apocalipsis 9:11 |

El orden lo puso Eduardo y es el que hace que la escalera suba de verdad: lo
que quedó, lo que tiene nombre, lo que es grande, lo que es muchos y quien
reina sobre ellos. Los dos primeros son cosas y los tres últimos son seres, así
que el salto del peldaño 2 al 3 es además el salto de ser *algo* a ser
*alguien*.

**Ninguno inflexiona**, que es la prueba que dejó escrita Blueprint: dos son
cosas y tres son nombres propios, así que «Ahora eres Leviatán» le dice lo
mismo a todo el mundo. Los títulos de la Goetia —Duque, Marqués, Conde— eran lo
primero que pedía el tema y se descartaron por eso, no por el concepto: es el
mismo fallo que costó cambiar «Arquitecto».

#### El versículo, al estrenar el rango

Un rango puede traer ahora una **`linea`**, y se lee debajo de «Ahora eres X»
**sólo el día que ese rango se estrena** — cinco veces en toda la vida de una
cuenta. En la insignia, en la reja de «Tu recorrido» y en la tarjeta del Resumen
no va: ésos se leen todos los días, y una frase que se ve cuarenta veces deja de
ser una frase.

Es un campo opcional de **cualquier** rango y no una cosa de Averno: no hay
ningún `if` con el nombre de un mundo dentro. La casa no trae ninguna, Averno
trae sus cinco versículos y el día que Reliquia quiera su cédula de museo se la
escribe. La referencia va en su propio `<cite>`, porque una cita tiene que verse
citada o parece que la escribió la app — y se separa de la frase por tamaño y
caja, no por color: con el tono tenue daba 3,64 sobre el fondo de la escena a
11 px, por debajo del 4,5 de un texto.

#### El balance: demasiado naranja

Lo paró Eduardo mirándolo puesto, y medido en OKLCh el problema era el **croma**
y no la luz:

| | Croma | |
| --- | --- | --- |
| La brasa del degradado | **0,091** | sobre el 38% de abajo de cada pantalla |
| El borde de las tarjetas | **0,059** | el doble que el de la casa, × ~40 piezas |
| La tarjeta | 0,028 | |
| El acento | 0,178 | — éste sí debe estar |

Los tres primeros no son naranja de acento: son naranja de **fondo**, y se
suman. El borde era el peor con diferencia — una línea sola no se nota,
cuarenta sí. Baja el color y no la luz, que es lo que deja los contrastes donde
estaban: la tarjeta a 0,017 —por debajo del 0,024 de la casa, o sea un negro
cálido de verdad y no un marrón—, el borde a 0,020 y la brasa a 0,048.

De paso la pila queda mejor repartida: tarjeta/página 1,24 (la casa da 1,19),
tarjeta/menú 1,11 y menú/página 1,11. Tres escalones parejos donde había dos
juntos y uno lejos. Y **las líneas del mapa**: el suelo de los mapas y de las
tarjetas de rama sale derivado de la página, así que cayó en `#120f0e` y las
líneas dan **1,46** contra el 1,48 de la casa.

#### Los anillos, que era el pendiente más viejo

La firma del mundo —los círculos del poema, que se estrechan al bajar y sólo el
de dentro sigue ardiendo— vivía en `extra=`, que lee la lámina y no la app.

Lo que costó fue decidir **dónde**, y los dos intentos fallidos valen más que el
resultado. La regla que dejó escrita Talavera dice que a plena tinta sólo hay
dos sitios: detrás de algo opaco, y en lo que aparece una sola vez.

1. **En `.scene-card`**, que sale una vez por pantalla. Pero son DOS piezas con
   la misma clase, y al mirarlo puesto salió que la del Resumen es la escena de
   la **racha**: no es interfaz, es un dibujo — un paisaje de noche con sus
   estrellas—. Motivo sobre motivo.
2. **En `.sec-hero`**, la banda de cabecera de un módulo: una por pantalla en
   cuatro de las siete, y ésa sí es superficie. Salvo que también trae su propia
   ilustración, en un `<svg class="scene">` hijo. Otra vez lo mismo.

Así que no se encima: la **sustituye**. Es además lo correcto —un mundo trae su
propia ilustración a esa banda, no la decora— y sale gratis en CSS: el svg de la
casa se apaga con `opacity` y no con `display`, para que siga ocupando su alto y
la banda no se encoja.

Contado antes de decidirlo: `.panel` sale tres veces en el Resumen y `.sum-card`
cuatro, así que las tarjetas quedaban descartadas de entrada — sería el marco de
latón de Reliquia otra vez.

#### Los glifos, en tres vueltas

Ninguno falló por estilo. **Legión** eran cinco trazos verticales sobre una
línea y se leía como una **gráfica de barras**; ahora son tres siluetas
encapuchadas iguales, la de en medio con el hueco de la cara relleno — una cara
a 20 px es una caricatura, un hueco a 20 px es una presencia. **Abadón** era un
pozo que «parecía un paliacate de boca de vaquero», y el problema venía del
concepto: un agujero no tiene silueta. Ahora es el **pentagrama invertido en su
círculo**, que eligió Eduardo. Y **Ceniza** era un montón con una voluta, o sea
un montón de cualquier cosa: ahora es un **caput mortuum**, el nombre que la
alquimia le dio al residuo que queda tras calcinar — literalmente el concepto de
ese peldaño.

El mundo estrena además marca propia: el **sol eclipsado** (`eclipse` en
`ICONS`), que es su mismo sello pasado a trazo. Iba con `flame`, la llamita
genérica que ya usan las habilidades.

#### Y una que llevaba ahí desde Blueprint

El script de arriba de `index.html` —el que precarga el CSS del mundo para que
no haya fogonazo— tenía la lista clavada en `["reliquia"]`. Con Blueprint o
Averno puestos, la app abría con los colores de la casa y saltaba al mundo un
instante después. Ahora conoce a los tres.

### 0.7.63.1 · 1 sep 2026
**El negro va JUNTO al azul, no en su lugar. Y la tarjeta de racha ya tiene
borde.**

Dos correcciones de Eduardo sobre la 0.7.61, y la primera deshace un
exceso mío. Al bajarle el azul a Blueprint puse el negro frío **en la página**
y dejé la tarjeta en azul: con eso las dos superficies quedaron en el mismo
valor —contraste 1,18— y el mundo entero se apagó. «Opacaste de más el tema»,
y «sigues trabajando demasiado cerrado a los monotonos».

Ahora al revés, que era lo que había que hacer desde el principio: **la página
vuelve a su azul de plano** —es la identidad del mundo— y el negro frío se va
a las TARJETAS. El equilibrio sale del contraste entre las dos cosas, no de
bajarle el tono a las dos: campo azul, piezas negras, líneas azules encima.
La separación sube de 1,21 (como estaba al principio) a **1,33**, y por fin hay
dos matices en pantalla en vez de uno — la página en croma 0,079 y la tarjeta
en 0,018. La retícula vuelve a su calibración original.

**Y el borde del banner estaba en el sitio equivocado.** Se puso en `.sec-hero`,
que son los cuatro encabezados de sección, y la tarjeta de racha del Resumen es
otra escena: se quedó sin marco. Sube a `.scene-card`, que es lo que las dos
comparten. Comprobado en las cuatro apariencias y las dos luces.
### 0.7.63 · 1 sep 2026

**El ambiente que abre un nivel se pone antes de anunciarlo.**

La 0.7.62 dejó apuntado que el ambiente Adobe, que abre en el nivel 7, «caía
encima» del rango Rastreador. **Ese aviso estaba equivocado y conviene
borrarlo de la cabeza de todos:** `apariencias/LEEME.md` empareja rango y
ambiente a propósito en cuatro peldaños —«Rango Brote, y con él el ambiente
Musgo»— y pide justo lo contrario de separarlos: «la celebración al
desbloquear un ambiente, **con el ambiente ya puesto**».

Eso es lo que faltaba, y es lo que se construye aquí. Al subir a un nivel que
abre un ambiente, la escena se lo pone antes de enseñarlo: un color anunciado
por su nombre no dice nada; puesto, se ve. Tres reglas que lo hacen seguro:

- **Va en `soloVista`**, la puerta que ya dejaba abierta `ponerApariencia`:
  cambia el aspecto sin escribir la elección. Mientras la escena está abierta,
  lo guardado sigue siendo lo de antes.
- **Si se cierra sin aceptar, vuelve lo que había.** Quedarse un ambiente por
  no haber pulsado nada es lo contrario de «se avisa, no se hace en silencio».
  El botón que lleva a Mi apariencia es el que lo deja puesto de verdad.
- **Un ambiente que pide Pro y no se tiene NO se pone**, aunque sí se anuncia.
  Enseñar puesto lo que no puede quedarse sería prometer y quitar en la misma
  pantalla, y la regla del cobro es la contraria: se enseña lo que hay.

Y las filas de tipo `ambiente` de `escaleraDeExpedicion()` ahora llevan su
`id`. Sin él habría que buscar el ambiente por el nombre, que es atar una
función a un rótulo.

### 0.7.62 · 1 sep 2026

**Los cinco rangos dejan de ser piezas de un grafo y pasan a ser oficios, y la
celebración de subir de nivel deja de girar.**

`EXP_RANGOS` era Nodo, Enlace, Rama, Trama y Red, y falla por tres motivos que
conviene dejar escritos para que nadie los deshaga:

1. **La app escribe «Ahora eres X»**, así que X tiene que ser algo que una
   persona pueda SER. «Ahora eres Trama» no significa nada. Ésta es la regla
   que manda al nombrar los rangos de cualquier mundo, y deja fuera igual los
   estados de Averno y las etapas de Blueprint.
2. **«Rama» ya estaba ocupada**: el lienzo de Talentos dice «Tus ramas» en
   pantalla.
3. Nombraban las piezas del dibujo, no a quien lo recorre.

Ahora son **Andante, Rastreador, Explorador, Cartógrafo y Navegante**, y van
**cada seis niveles** (1, 7, 13, 19, 25). Eso no es un número redondo, es el
ritmo: con el reparto viejo el primer rango se cerraba en semana y media y el
cuarto tardaba **11,6 meses** —medido con `EXP_PUNTOS` y la curva real, perfil
de cuatro días por semana—. Cada seis da 5 semanas, 3 meses, 4,8, 6,6 y 8,4.

Los peldaños de celebración de `EXP_ESCALERA` se mueven a 4, 10 y 16: donde
estaban caían justo encima de un cambio de rango, y dos noticias en la misma
pantalla se estorban.

**Los cinco iconos, rehechos.** Son objetos de una expedición —bota, huella,
farol, mapa y brújula— y no formas geométricas: una figura abstracta no se lee
como «Andante», se lee como una raya. Dos cosas que hay que respetar al
tocarlos:

- **Un solo dibujo a cualquier tamaño.** Hubo una versión que se simplificaba
  por debajo de 30 px y sobra: el aro de la insignia (18 px) y la lista de «Mi
  expedición» (26) se ven A LA VEZ en la misma pantalla, así que el mismo
  rango salía dibujado de dos maneras. Lo que no se lee a 18 px tampoco entra
  en el de 78 — por eso la llama del farol va siempre y la brújula perdió el
  aro interior y los cardinales.
- **Ni un relleno.** `.ic svg` impone `fill: none` y le gana a cualquier
  atributo, así que los cinco son solo trazo y no hubo que tocar el CSS.

La brújula del Navegante no choca con `compass`, que ya existe y lo lleva
«Noche de expedición»: aquélla es un aro con la aguja suelta, ésta tiene
anilla. Y el mapa no choca con `map`, que es el plegado en tres paneles.

**Y las dos escenas dejan de girar.** Los rayos de `.ncel` y `.scel` eran
`repeating-conic-gradient` en `infinite` — el recurso de la tragamonedas, y
las únicas animaciones sin final de toda la app. Lo que las sustituye:

- **Subir de nivel: la constelación del rango.** Seis estrellas, una por
  nivel, y la sexta cierra la figura justo al cambiar de rango. Las cerradas
  se quedan de medallas arriba: esa fila es la colección. Al estrenar rango,
  la figura anterior se cierra a la vista y se va al estante antes de que nazca
  la nueva, y el texto espera a que termine ese relevo (clase `estrena`).
- **Hito de racha: la brasa.** El fuego se queda, que ahí sí significa algo,
  pero el humo sube UNA vez y las chispas pasan de estallar en abanico desde
  el centro a subir como pavesas desde el borde. Dos fiestas distintas tienen
  que moverse distinto.

Con esto **no queda ninguna animación `infinite` en las celebraciones**: la
llama de la racha late cuatro veces y para, y la insignia de nivel dos.

**Lo que hay que revisar y no se toca aquí:** el catálogo `AMBIENTES` abre en
los niveles 3, 5, 7, 12 y 20, y el 7 cae ahora encima del rango Rastreador.
Ese archivo es de otra sesión.
### 0.7.61 · 1 sep 2026
**Blueprint deja de gritar azul, y su celebración deja de hablar en fuegos
artificiales.**

**El azul era demasiado, y no era cuestión de gusto.** Medido en croma, la
página de Blueprint estaba en 0,079 contra el 0,018 de la casa —más de cuatro
veces la saturación, en la superficie más grande que tiene la app—. Reliquia
anda por 0,028 y Averno por 0,009: el raro era él. La página pasa a un negro
FRÍO (0,017, como la casa) y el azul se queda donde dice algo: la retícula, el
marco, el acento y la cota. Un plano no es un campo de color, es un dibujo — y
sobre negro el dibujo se lee mejor. La tarjeta se pone ENCIMA del fondo como en
toda la app (1,18 contra el 1,19 de la casa) y la retícula se recalibra para
pesar lo mismo que antes. La cara de día no se toca: medida, es la MENOS
saturada de los cuatro mundos.

**La celebración de subir de nivel, en el idioma del mundo.** La de la casa
habla en rayos que giran 26 s, resplandor, un rebote elástico y chispas
redondas saliendo del centro. Un plano no se ilumina: se traza. Cinco tiempos,
todos con la curva mecánica del mundo y sin rebote — la retícula se plotea de
izquierda a derecha; la insignia SE DIBUJA sola trazo a trazo; el número llega
acotado entre dos cotas que entran desde los lados; las chispas se vuelven
cruces de registro que aparecen en su sitio y se quedan; y con rango nuevo, el
sello. Los cinco dibujos de rango ya eran trazo puro, así que dibujarse solos
salió gratis: un solo `stroke-dasharray: 60` para los cinco. Las cruces reusan
los mismos nodos y su `--dx/--dy`, o sea que no toca JavaScript.

Entra por `app_extra`, un campo nuevo para el CSS que un mundo aporta cuando lo
suyo no cabe en un token. La casa y los otros dos mundos siguen exactamente
igual: comprobado, con Blueprint puesto no queda ni un `ncelGiro`, y con la
casa puesta no aparece ni una regla de `plano-`.

**Y cuatro cosas más que vio Eduardo:**

- **Los banners no tenían borde.** Eran la única pieza grande de la app sin
  marco, y sobre un mundo con superficie propia se les desdibujaba el canto.
  Sale del mismo par que el resto, así que cada mundo pone el suyo.
- **Cinco radios escritos a mano no pasaban por el factor**, y por eso Proyectos
  en el Resumen seguía con la burbuja de la casa teniendo Blueprint puesto. Se
  barrieron las siete pantallas: eran seis sitios —esa tarjeta, los chips de
  «Listos para empezar», las tarjetas de proyecto, el menú de una rama y las
  casillas de color—. Ahora no queda ni uno resistiendo.
- **Un delta con triángulo no es un acento, es un signo.** Estaban pintados con
  el acento del mundo: un «▲ 33» salía AZUL en Blueprint y naranja en Averno.
  Ahora verde si sube y rojo si baja, en todos los temas, con sus dos caras
  —porque «siempre verde» es del matiz, no de la luz—. Medido en los cuatro
  mundos y las dos luces: el peor caso da 5,16 sobre un umbral de 4,5. El verde
  se eligió a 21° de matiz de la menta a propósito: pegado a ella, «subió» y
  «es un acento» se confundían. Solo el delta; los totales no se tocan.
- Y la misma flecha del panel de números, que tenía el fallo idéntico.

### 0.7.60 · 1 sep 2026
**La cota de Blueprint cruza a la app, y el disparador no es una clase: es la
cifra.**

`--m-cenefa` —la franja del borde de arriba de una pieza, que en Blueprint es
la línea de cota— se quedó fuera cuando se construyó el mundo. Ya cruza, con dos
correcciones sobre lo que parecía obvio.

**La cota no medía nada.** Era un SVG de 200 px centrado: en la ficha estrecha
de la lámina colaba, pero sobre una tarjeta ancha las puntas de flecha se
quedaban flotando en medio sin tocar los bordes —o sea un adorno con forma de
cota—. Ahora se arma por capas de `background` y se estira, con las puntas a
tamaño fijo en su propio archivo porque estiradas se deformaban. Se corrige en
`mundos/datos.py`, así que la lámina mejora igual.

**Y ponerla por clase habría sido el error de siempre.** Contado con el ejemplo
puesto: **nueve `.panel` en Ajustes** y siete piezas entre paneles y tarjetas en
el Resumen. Es exactamente lo que ya pasó con el marco de latón de Reliquia
—«se gasta el recurso muy rápido»—. Así que el disparador es el atributo
`data-cota`, que lleva dentro la cifra: **sin número no hay cota**, de modo que
nunca puede ser decorativa y ninguna pantalla se llena sola.

**Y no añade el dato: se queda con él.** La app ya escribe casi todos los
totales —«4 de 10» en cada rama— y repetirlo dentro de la cota lo abarataba.
Así que la cota se lleva esa pastilla y el mundo la esconde. Misma información,
mejor puesta: deja de ser un chip gris al lado del título y pasa a ser la línea
que mide la tarjeta.

Queda en las tarjetas de rama de Talentos y Proyectos. Medido: 3 cotas en
Talentos, 3 en Proyectos y **cero en las otras cinco pantallas**, Ajustes
incluido. La cifra va en `::after` con `content: attr(data-cota)` y no dibujada,
así que es texto de verdad, sale en Rajdhani y la lee un lector de pantalla; su
fondo opaco es lo que INTERRUMPE la línea, que es como se acota en un plano.

Verificado con las cuatro apariencias puestas: Blueprint enseña la cota,
Averno, Reliquia y la casa no la tienen y su pastilla sigue a la vista —el
atributo es inerte para ellas—.

**Y una trampa nueva para la lista:** un backtick dentro de un template literal
lo CIERRA. El comentario que explica todo esto los lleva, se puso dentro de la
plantilla de `js/06-detalle.js` y la app entera dejó de arrancar con «Unexpected
identifier 'data'». Los comentarios con backticks van fuera, como comentario de
JS.

### 0.7.59.1 · 1 sep 2026
**«Actualizar» deja de ser un aviso que pasa y se vuelve un botón que espera.**

La 0.7.58 arregló *cuándo* se entera la app de que hay versión nueva. Faltaba
*dónde* se dice: seguía siendo un toast, y un toast tiene un problema que ningún
retoque de duración arregla — **el momento en que aparece lo elige el servidor,
no tú.** O estabas mirando la pantalla justo entonces, o te lo perdiste.

Ahora es un botón en la barra lateral, encima de Ajustes, que es donde ya se
busca «lo de la app». Espera lo que haga falta y no tapa nada. En luciérnaga,
que es el amarillo de avisar: entre cinco botones grises que llevan a sitios,
este no lleva a ningún sitio — dice que hay algo que hacer. No es coral porque
no se rompe nada si lo ignoras; la versión nueva entra sola en la siguiente
apertura. Es exactamente el hueco de `btn-aviso`.

**Se lleva consigo el anclaje abajo y la línea de separación.** Las tenía
Ajustes; con el botón puesto delante pasan a ser suyas, o salían dos rayas
seguidas y Ajustes se quedaba pegado al resto del menú.

**Plegada la barra no hace falta ni una regla más:** es un `.c-nav` como los
otros cinco, así que de esconder el rótulo ya se encarga `html.sc .nav-label`.
Medido con las animaciones saltadas —en el panel de pruebas las transiciones no
avanzan nunca y la barra parecía medir 209 px—: desplegada 209 × 52 con su
rótulo, plegada 47 × 52 con solo el icono de 20, y en las dos por encima de
Ajustes y sin salirse de la barra.

**Y una línea de CSS que no es obvia:**

```css
.side-only[hidden] { display: none !important; }
```

`.side-only` declara su `display` con `!important`, y el `display: none` que el
navegador le pone a un elemento con `hidden` es una regla normal: pierde. Sin
esa línea el botón de actualizar sale siempre, desde el primer arranque, en
todas las sesiones.

**En el teléfono sigue saliendo el toast**, porque ahí no hay barra lateral y no
hay otro sitio donde ponerlo. No se decide por el ancho de la ventana sino
preguntándole al botón si de verdad se está pintando (`offsetParent`): la regla
que lo esconde vive en el CSS, y duplicar aquí ese umbral es tener dos números
que algún día dejarían de decir lo mismo. Ese toast conserva su suelo de cinco
minutos entre apariciones; el botón no lo necesita, porque se queda puesto.

### 0.7.59 · 1 sep 2026
**Dos mundos más: Blueprint y Averno.** De quince, ya se pueden encender tres.

Los dos estaban terminados y esperando número. Se suben juntos porque uno se
construyó encima del otro: los dos arreglos que costó **Blueprint** —la tabla
`FUENTES`, que da a cada mundo su tipografía, y el freno `plano_o_muere`, que
para el generador en vez de inventarle un `--card` negro a quien declara la
tarjeta sin un hex dentro— son justo lo que hizo que **Averno** saliera en una
tanda en vez de en tres.

Ninguno cambia nada para quien no entre a Ajustes → Mi apariencia y lo elija, y
los dos piden Pro. De los quince, el único que no abre Pro es Reliquia.

**Blueprint** es el papel de plano: retícula de dos pesos, cotas con puntas de
flecha y marcas de sección. De día no es la noche aclarada, es la **copia
heliográfica** —papel claro y línea azul, que es lo que un plano ha sido siempre
a la luz—. Sus cinco rangos son los oficios del taller, de Aprendiz a
Arquitecto.

**Averno** es piedra quemada con la brasa debajo: los círculos del poema, ceniza
cayendo con tres motas que aún no se han apagado, y un sol eclipsado por icono.
De día es **la ceniza a plena luz**, y el grano cambia de signo en vez de
aclararse: de noche la ceniza es lo claro sobre el carbón, de día es el hollín
sobre la ceniza apagada. Sus cinco rangos son los estados del fuego: Ceniza,
Chispa, Brasa, Llama, Hoguera.

#### Lo que enseñó Averno: la lámina no enseña los fallos de la app

`mundos/vista.html` enseña una tarjeta sola sobre un recorte de página. La app
la enseña en una lista de veinte. Tres fallos que solo se ven al medir:

| Qué | Estaba | Quedó | Por qué |
| --- | --- | --- | --- |
| La tarjeta | `#1d0f0b` | `#2e1e18` | daba **1,03** contra la parte plana de la página y se INVERTÍA cerca del borde de abajo, donde la brasa la aclara |
| El carril | `#1a0c08` | `#422c23` | **1,02** sobre la tarjeta, o sea no verlo (la casa da 1,23) |
| El peligro | `#ff3b6b` | `#ff5c80` | su chip daba **3,95** sobre su propio velo, por debajo del 4,5 que pide un texto |

Y el apagado de día bajó a `#654736` por lo mismo al revés: se medía contra la
tarjeta, cuando media docena de rótulos —los chips sin elegir, el signo de
añadir, la leyenda del mapa, la nota de Ajustes— no viven dentro de ninguna.
Sobre la página daba 4,36.

**La regla que sale de ahí, y vale para los doce que quedan: una página en
degradado se comprueba parada por parada.** El generador traduce a `--bg` solo
la parada más honda; si otra queda por encima de la tarjeta, las tarjetas se
hunden en esa franja de la pantalla y flotan en el resto.

#### El suelo de los mapas, cuando el mundo no tiene marco

`croma.lienzo` separa `--sup-hondo` de la página con un desplazamiento fijo de
luz. En los extremos eso no separa nada: sobre la página casi negra de Averno
daba **1,013** contra los 1,071 de la casa, y el encuadre del lienzo, de la
tarjeta de una rama y de las columnas del tablero desaparecía.

Se arregla en `mundos/app.py` y **no** en `croma.py`, que es la parte que hay
que entender antes de tocarlo: ese archivo lo comparten los siete ambientes, y
su tope de día está puesto para Reliquia, que a propósito deja el suelo
valiendo lo mismo que la página **porque su encuadre lo hace el latón y se ve
solo**. Así que la regla es: si el mundo no declara `--m-marco`, el suelo se
empuja hasta la separación de la casa. Movió a Blueprint un pelo (1,068 →
1,098) y no tocó a Reliquia.

#### Cómo se comprobaron

Un barrido por las **siete pantallas en los dos modos**, midiendo el contraste
de cada nodo de texto contra su fondo compuesto, **y el mismo barrido con la
apariencia de la casa puesta como control**. El veredicto no es «Averno falla N
veces» —la casa también falla, en su tramo tenue y a propósito— sino que **no
falla ni una que la casa no falle también**: 296 elementos, 15 de noche y 8 de
día, exactamente los mismos.

Medido además: la tarjeta sobre el fondo 1,29 de noche y 1,40 de día; el carril
1,23 y 1,21, que es lo que da la casa; el texto 12,28 y 14,54; y el peor de los
ocho colores del usuario encima del carril 5,32 contra los 5,16 de la casa.
Grenze Gotisch mide **−17,4%** contra Outfit —lo que decía el catálogo—, así
que su escala se queda en 1.

Dos cosas hay que saltarse o el barrido miente: **la escena** de la racha, que
se queda de noche en los dos modos y cuyo fondo no se lee con
`backgroundColor`, así que mide contra el papel del día y saca números falsos;
y que **`--bg` es un hex y no un `rgb()`**, así que un lector que solo entiende
`rgb()` saca los dígitos del hex como si fueran un número y devuelve NaN.

#### Lo que no llega todavía

Los **anillos concéntricos** de Averno —la firma del mundo— viven en `extra=`,
que solo lee la lámina: el generador no traduce ese bloque. No se resuelve
escribiendo una regla global sobre `.ficha::after`, que es exactamente lo que ya
costó tres rondas. Y el logotipo de la barra sigue en el verde de la marca con
cualquier mundo puesto.

Queda una duda anotada en el código, y es de Eduardo: **«Ceniza» va primero**, y
la ceniza es lo que queda *después* del fuego. Se lee bien como «de las
cenizas», que es una imagen que se entiende sola; se lee mal como escalera,
porque de una ceniza no sale una chispa. La palabra que encajaría en ese peldaño
es Yesca.

### 0.7.58 · 1 sep 2026
**El aviso de versión nueva deja de pedir que adivines que hay versión nueva.**

Había que recargar **dos veces**: una a mano para que apareciera el aviso, y otra
al pulsar «Actualizar». O sea que el aviso solo servía si ya habías hecho por tu
cuenta lo que el aviso te iba a pedir.

La causa es de manual y estaba a la vista: **el navegador vuelve a pedir `sw.js`
al navegar, y nada más.** Una pestaña abierta desde hace horas no navega nunca,
así que no se enteraba de nada. El mecanismo de la 0.7.38 estaba bien montado
para quien abre la app; no para quien la tiene abierta.

Ahora se pregunta desde la app con `registration.update()`, que es exactamente
lo que hace el navegador al navegar, pero sin navegar. Se pregunta:

- **cada quince minutos** mientras la pestaña esté a la vista;
- **al volver a ella** — cambiar de pestaña o de ventana no dispara lo anterior,
  y volver es justo cuando se agradece encontrarlo;
- **al recuperar la conexión**, porque sin red la pregunta no vale nada.

Y nunca con la pestaña escondida: preguntar por una versión que nadie está
mirando gasta batería y datos para nada, y al volver se pregunta igual. Hay un
suelo de un minuto entre preguntas, porque volver a la pestaña y recuperar la
conexión pueden pasar en el mismo segundo.

**El aviso también se recuerda.** Un toast dura doce segundos —eran seis— y el
service worker avisa UNA vez, al activarse. Si eso pasaba mientras estabas en
otra ventana, el aviso se lo llevaba el viento y no volvía. Ahora, mientras no
se actualice, vuelve a salir al regresar a la pestaña, como mucho una vez cada
cinco minutos. Informa cuando estás delante; no persigue.

De paso, `toast()` acepta `ms` en su acción. Es el único que lo usa hoy y no
cambia ninguna llamada de las que ya había.

**Comprobado de verdad, y no razonando sobre el código:** con la app abierta en
`0.7.57` y sin tocarla, se publicó la `0.7.58` y se simuló volver a la pestaña.
El worker nuevo se instaló solo, la caché pasó de `norata-0.7.57` a
`norata-0.7.58`, llegó el mensaje y salió el toast con su botón — **sin una sola
recarga por delante**. Y pulsar «Actualizar» ya es la única recarga que hace
falta.

### Y las fechas de esta lista van en hora de México

Se coló tres veces desde una sesión que commitea en UTC: la `0.7.56.1` decía
«2 sep» y se escribió a las 20:33 del 1, y la `0.7.49` y la `0.7.50` decían
«31 ago» siendo del 30. Con eso la lista deja de leerse en orden — una entrada
nueva puede quedar encima de otra fechada un día después.

Corregidas las tres, y la regla escrita arriba y en `CLAUDE.md` para que no
vuelva a pasar. Solo muerde entre las 00:00 y las 06:00 UTC, que es la franja en
la que se trabaja de noche.

### 0.7.57 · 1 sep 2026
**El saludo sale de la racha y se pone donde vive el día.**

Era lo único que quedaba abierto de la 0.7.56. «Buenas noches · martes, 1 de
septiembre» se escribía dentro de la tarjeta de la racha, y ahí `greeting()`
tenía **su única aparición en todo el código**: quien quitaba esa tarjeta del
tablero —cosa que el Modo Editor permite y que hacen los tres acomodos que no
la ponen delante— se quedaba sin saludo y sin fecha en el Resumen entero.

Y no era solo un accidente de colocación: **la fecha no es un dato de la racha.**
Es de hoy, y hoy es de la pantalla.

Ahora va encima del título del Resumen, en tono normal y no en las versalitas de
menta de `.kicker` —que existía sin usarse desde hace tiempo—: una fecha en
mayúsculas y con tres píxeles de entreletra deja de leerse como un saludo y pasa
a leerse como una etiqueta de sección, y aquí se busca lo contrario. Se escribe
**antes** del caso vacío a propósito: un perfil recién creado no tiene tablero
que pintar, pero sí tiene día, y esa pantalla es justo la que más agradece que
alguien la salude.

**Y en su sitio, el nombre de la tarjeta.** Sin él empezaba directamente por un
número grande y no decía de qué era. Se llama «Racha», que es como se llama en
`DASH_META` y en la bandeja del Modo Editor: una cosa, un nombre.

**El mes viaja con el título cuando hay dos bloques**, y esto salió de mirar el
resultado. Con «RACHA» puesto, el rótulo del calendario quedaba doce píxeles más
abajo, en el mismo borde izquierdo y con el mismo tamaño —10,5 px contra 10—:
dos etiquetas apiladas, no un título con su sección. Así que a partir de 430 px
el título dice «RACHA · SEPTIEMBRE 2026» y el calendario suelta el suyo. Apilada
no puede mudarse —allí el mes queda lejos del título y necesita decir de cuándo
es—, así que se escribe siempre y lo esconde el CSS. El año sigue incluido: un
calendario suelto no dice de cuándo es, y esta tarjeta va a llevar años abierta.

**Comprobado:** el alto de la tarjeta en 22 anchos entre 340 y 2200 px, por los
ocho ambientes y mundos, en los dos modos —352 medidas—: ninguna se sale, y el
margen más apretado sigue siendo el de 6 px del píxel exacto donde deja de estar
apilada. Los tres acomodos en cuatro ventanas, sin huecos y sin cifras apiladas.
El saludo sale igual con el perfil vacío, y en el teléfono el título dice
«RACHA» a secas mientras el calendario conserva su «SEPTIEMBRE 2026».

### 0.7.56.1 · 1 sep 2026
**Los encabezados de módulo y la tarjeta de la racha también llevan marco en
Reliquia.** Lo preguntó Eduardo: «siento que desentonan mucho en comparación
con todo lo demás». Y era eso exactamente — no es que les sobrara nada, es que
les faltaba lo que llevaban sus vecinas: el aro de latón se dibujaba solo en
`.panel` y `.sum-card`, así que la pieza más grande de cada pantalla era la
única sin enmarcar.

No amplía el reparto del recurso, que es lo que había que cuidar («se gasta muy
rápido», 0.7.55): los cuatro encabezados y la racha SON la misma pieza
(`.scene-card`), así que un selector cubre los cinco sitios y sigue habiendo
como mucho dos aros por pantalla. Dentro de una lista el marco sigue siendo un
borde liso.

Dos detalles que hicieron falta y no se ven:

- **El aro va con `z-index: 2`.** Una escena lleva el paisaje y su velo puestos
  encima con `position: absolute`, y un `::before` es el primer hijo: sin eso,
  el marco quedaba pintado DEBAJO del dibujo.
- **El metal de una escena es el de NOCHE en los dos modos**, como todo lo
  demás que hay dentro. Una escena es el dibujo de una noche, y un marco de día
  alrededor de un paisaje nocturno se ve como lo que sería: una pieza de otro
  sitio.

**Y de paso, el calendario de la racha dejó de salir verde.** Verificando lo
anterior aparecieron cuatro casillas con la menta de la casa en mitad de una
vitrina violeta: la escala de intensidad estaba escrita con el hex a mano en
`js/05-resumen.js`. Es el mismo fallo que ya tenía la caja de un grupo en el
mapa de talentos, en otro sitio. Ahora sale de `var(--mint)`, que dentro de una
escena es el acento de la apariencia puesta.

Foto de estilos con la apariencia de la casa: **0 diferencias sobre 26 638
elementos**. Todo el cambio vive dentro de Reliquia.
### 0.7.56 · 1 sep 2026
**El mes manda en la racha, y el tablero deja de tener agujeros.**

Expedición entró al tablero en la 0.7.44 y se dio de alta en los doce acomodos
con un guion. Eso evitó el olvido, pero ninguna de las doce decisiones se volvió
a tomar: **once de los doce quedaron con al menos una celda vacía**, y en siete
de ellos dos de las tres tarjetas de cifra acabaron pegadas.

**Cuatro cosas, y las cuatro salieron de medir.**

#### 1. La racha recibía una fila de más en todos los anchos

`ALTO_RACHA` era `7 / 5 / 6` y el contenido medía 486, 266 y 326 px, o sea que
recibía 536, 376 y 456. Como `.scene-body` centra en vertical, eso salía como
cielo vacío repartido arriba y abajo: **166 px de los 456 de una tarjeta de
1176 de ancho, el 36 %** — justo el problema del que venía la 0.7.33. Y no lo
recuperaba nadie, porque `encajarEnPantalla` se salta la racha a propósito.

Ahora es `7 / 4 / 5`, y lo que sobra pasó de 110-130 px a 7-30.

#### 2. La tarjeta de la racha: dos bloques en vez de tres

Eran tres en fila —la marca, el hito, el mes— y ese reparto tenía tres
problemas que se veían y ninguno era de color:

- **217 px de sangría a la izquierda contra 18 a la derecha.** Doce veces más
  aire de un lado que del otro; se lee como un agujero, no como margen.
- **Cada bloque empezaba a una altura distinta**: 166, 125 y 109.
- **El saludo arrancaba en el borde** y el contenido 217 px más adentro.

Ahora el mes va a la izquierda y todo lo demás baja a un solo carril a su
derecha. Medido después: márgenes de 18 y 18, saludo y mes empezando en la
misma vertical, y 25 px arriba y 25 abajo, que es el relleno de la tarjeta y no
un hueco. El carril tiene tope de 820 px y lo que sobra cae a la derecha, donde
está la luna del dibujo.

**Y el hito se ve siempre.** «Próximo hito · 7 días» vivía detrás de un
`@container` de 1150 px, o sea que la pieza que más mueve a volver no aparecía
en teléfono, ni en tableta, ni en laptop — exactamente los aparatos donde se
mira una racha. Se escribía en el HTML y se tiraba con `display: none`. Ahora lo
único que espera a que haya sitio es «qué la sostiene», que son tres filas más.

Dos números que costaron una vuelta cada uno:

- **El hito pasó a una línea.** Con la cifra en 26 px competía con el número de
  la racha —que es el número de esta tarjeta— y costaba 33 px de alto. Esos
  33 px son exactamente los que separan cinco filas de seis.
- **El segundo umbral es 900 y no 680.** A 688 px —la racha de dos columnas en
  una tableta— el carril se queda en 294, la frase y las cifras parten en varias
  líneas, y la tarjeta pedía 459 px cuando recibía 376. Se salía por abajo sin
  que nada lo dijera.

#### 3. Una forma de ventana que no tenía lista

`formaTablero` daba el segundo salto por el ALTO de la ventana (`VENTANA_BAJA`,
860), y esa cuenta dejaba fuera una forma entera: **una ventana alta de menos de
1700 px de ancho tiene DOS columnas y recibía la lista de tres.** Una MacBook
Pro de 14 pulgadas abre la app a 1512 x 950 y veía un primer botón que prometía
«tres columnas parejas, las misiones al centro» delante de dos columnas sin
centro. Medido y ya encogido: 1096 px «Columnas», y 1416 —1.72 pantallas— los
otros dos.

Ahora el salto es el número de columnas, que es lo que de verdad cambia el
reparto. `VENTANA_BAJA` desaparece; el alto lo sigue resolviendo
`encajarEnPantalla`, que mide en vez de suponer.

#### 4. Los doce acomodos, rehechos con dos reglas

1. **Ninguna columna termina antes que las otras.**
2. **Dos tarjetas de cifra no se tocan.** Expedición, Niveles e Invertido son
   la misma pieza; dos iguales apiladas no se leen como dos datos, se leen como
   una repetición. Entre dos va siempre una lista.

Se buscó el reparto por fuerza bruta sobre las 40.320 ordenaciones posibles de
cada acomodo, con el empaquetador de verdad. Once de los doce salen ya sin un
solo hueco.

**Pero las alturas escritas a mano no son la garantía, y esto es lo importante:**
cambian después de escribirlas. `encajarEnPantalla` las encoge, quien quitó una
tarjeta reparte de otra manera, y «Misiones de hoy» mide lo que midan las
misiones de esa persona. Así que hay dos piezas nuevas que lo sostienen pase lo
que pase:

- **`emparejarColumnas`** rellena los huecos DESPUÉS de colocar: busca cada
  celda vacía y estira hacia abajo la tarjeta que tiene justo encima. Como solo
  ocupa celdas que ya estaban vacías, nadie se mueve y el tablero no crece ni
  una fila.
- **`compactarEnSuColumna`** sustituye a `empaquetar` dentro de
  `encajarEnPantalla`. Antes se recolocaba todo desde cero, y eso deshacía el
  acomodo recién elegido: al encoger «Misiones de hoy», «Invertido» se colaba en
  su columna y el tablero dejaba de tener las misiones al centro, que es lo que
  promete el botón que se acaba de pulsar.

**Comprobado:** los tres acomodos en seis ventanas —2560x1400, 1920x1000,
1512x950, 1366x657, 1024x700 y 768x1024— más el teléfono a 375, más el modo
claro, más el caso vacío, más quitando una tarjeta cualquiera del tablero. En
las dieciocho combinaciones: **cero huecos, cero cifras apiladas, ninguna
tarjeta desbordada y ningún desplazamiento lateral.** «Columnas» en tres
columnas mide 856 px y cabe entero en una pantalla de 1000.

**Y con las apariencias puestas**, que es lo que obligaba a medirlo otra vez:
esta tanda se escribió sobre la 0.7.47 y se reaplicó encima de la 0.7.55.3, con
Reliquia y los siete ambientes ya dentro. Un mundo cambia la tipografía de las
cifras —Reliquia pone Syne— y el alto de esta tarjeta está medido al píxel, así
que un tipo más ancho podía sacarla de su hueco. Comprobado: **22 anchos entre
340 y 2200 px, por los ocho ambientes y mundos, en los dos modos.** Ninguno se
sale, y el margen más apretado es de 6 px. Los ambientes solo declaran color
dentro de `.scene-card`, y la tipografía del mundo sí llega pero no mueve nada
porque las casillas del mes son cuadradas por `aspect-ratio` y las cifras
llevan `line-height` escrito.

**Lo que NO se hizo, y sigue abierto:** sacar el saludo y la fecha de la tarjeta
de la racha. Hoy `greeting()` se escribe en un solo sitio de todo el código y es
ahí dentro, así que quien quite la racha del tablero se queda sin fecha en el
Resumen. Se arregla llevándolo a la cabecera del Resumen, pero es un cambio que
se ve en la primera pantalla de todo el mundo y esa decisión es de Eduardo.

### 0.7.55.5 · 1 sep 2026
El modo claro de Reliquia, que era donde se veía todo lo que faltaba. **En modo
oscuro no se movió ni un píxel** — medido: de las 107 diferencias de la foto de
estilos, las 107 son de la cara de día.

**Las ramas ya no salen casi grises.** El suelo hondo se hunde 0,026 respecto de
la página, y eso está bien mientras la página sea papel; Reliquia es una vitrina
y su página ya es oscura para ser un modo claro, así que las ramas acababan en
0,81 de luz. Ahora ese hundimiento tiene un tope —nunca por debajo de 0,845— y,
si el tope dejara el suelo más claro que la propia página, se usa la página: el
encuadre lo hace el marco, que en un mundo con latón se ve solo.

**El amarillo de la caja de un grupo era el de la CASA.** Estaba escrito dentro
de `js/07-lienzo.js` (`"#f5d76e"`, y `"#5fe0b0"` para una caja terminada), así
que sobrevivía a cualquier apariencia. Sobre el lienzo claro de Reliquia daba
**1,28** de contraste: el rótulo y el contorno no se veían. Ahora sale del
acento de la apariencia, que ahí da **3,84**. De noche los dos valen lo mismo
que valían, así que no cambia nada.

**Los hilos apagados y los candados, un escalón más abajo.** Medidos sobre el
lienzo de día daban **1,39** y **1,23**: sobre papel eso no es «apagado», es que
no está. Ahora 2,2 y 2,4. Los recolores y los mundos ya salían de esta relación
calculada; la casa era la que se había quedado con los tonos viejos.

**Y las figuras del mapa son SÓLIDAS de día.** De noche un velo del color a un
20% sobre el carbón ya se lee como una pieza encendida; de día el mismo velo
deja la figura casi del color del suelo, y con ocho colores en el mismo mapa no
se distingue cuál es cuál. Lo pidió Eduardo señalando un nodo con candado, que
ese sí se ve. Ahora el velo se apoya en una base opaca —la superficie levantada,
casi papel— y con más fuerza: la figura pasa de ser un tinte del suelo a ser una
pastilla de su color puesta encima.

Va en dos variables (`--relleno-base` y `--relleno-fuerza`) y no en un `if` de
JavaScript, y el motivo no es elegancia: el mapa se dibuja una vez y **no se
vuelve a dibujar al cambiar de modo** —`ponerTema` solo cambia variables—, así
que un color decidido en JavaScript se quedaría con la cara del modo en que se
dibujó.

### 0.7.55.4 · 1 sep 2026
**El mundo se quedaba congelado, y el número de versión decía que no.** Eduardo
lo vio tal cual: «no veo ningún cambio y la versión sí está subida». Tenía toda
la razón, y no era el CSS: era la caché.

`css/mundos.css` no va en `ASSETS` a propósito —pesa lo que pesa un mundo y
bajárselo a quien nunca va a encender uno es justo lo que la caché vino a
evitar—, pero eso le quita la única red que tiene todo lo demás: la instalación
pide cada archivo de `ASSETS` con `cache: "reload"` y falla entera si alguno
viene mal. Este se pide suelto cuando hace falta, y **lo que llegue se guarda en
la caché de esa versión y a partir de ahí ya es un acierto: no se vuelve a pedir
nunca**. Como GitHub Pages tarda un minuto largo en publicar y su CDN no cambia
todos los archivos a la vez, hay una ventana en la que `sw.js` ya es el nuevo y
el mundo todavía es el viejo. Quien abra ahí se lo queda congelado — con el
número de versión nuevo puesto, porque `js/01-base.js` sí está en `ASSETS`.

Reproducido de punta a punta con un navegador de verdad, un servidor que manda
`max-age=600` como Pages y un perfil que sobrevive a las recargas: se instala la
.2, se sirve la .3 con el mundo de la .2, y el aparato se queda en «versión .3,
mundo .2» para siempre. Exactamente lo que él veía.

**Tres piezas lo cierran, y hacen falta las tres:**

1. **Una huella en la dirección.** `css/mundos.css?h=<sha-256 del contenido>`,
   estampada por `mundos/app.py` al generar el archivo — así se actualiza sola
   y no hay un quinto sitio que acordarse de tocar al subir la versión.
2. **El worker comprueba esa huella antes de guardar.** Cambiar la dirección no
   basta: Pages sirve el archivo sin mirar lo que va tras la interrogación, así
   que durante la ventana contesta al `?h=nuevo` con el archivo viejo y con un
   200. Si no cuadra la huella, se sirve —es lo único que hay— pero no se
   guarda, y la siguiente apertura vuelve a pedirlo.
3. **`cache: "no-store"` en lo que se pide bajo demanda**, para que el navegador
   no se quede una copia propia que mande por encima de la del worker.

Y de paso, lo que no estaba: **lo que no está en `ASSETS` ahora se renueva por
detrás**. Se sigue sirviendo la copia al instante, y si lo que llega es distinto
queda guardado para la siguiente apertura. El trato pasa de «nunca» a «la
próxima vez», que es el mismo que ya tenía la app entera.

**Dos cosas que aprendí midiendo, y que están apuntadas en `CLAUDE.md`:**

- **Recargar la misma pestaña no es abrir la app.** En una recarga las hojas de
  estilo salen de la caché del navegador **sin pasar por el service worker**
  (`workerStart` en cero); en una pestaña nueva sí pasan por él
  (`deliveryType: "cache-storage"`). Media tarde midiendo con recargas decía
  que el arreglo no funcionaba, y lo que no funcionaba era la prueba.
- **Una sonda con un contador dentro del worker no cuenta nada**: el worker se
  apaga entre carga y carga y el contador vuelve a cero, así que todas las
  peticiones se escribían encima de la primera. Parecía «solo vio una».

### 0.7.55.3 · 1 sep 2026
**La sarga del terciopelo de Reliquia baja a un tercio.** Es la misma historia
que los puntitos del lienzo, en la otra textura: el tejido se dibujó cuando la
página del mundo era tres escalones más clara, y al hundir el fondo el mismo
trazo pasó de sumar 13 puntos de luz sobre el suelo a sumar 25. Una sarga que
se ve deja de ser tejido y pasa a ser rayas encima del contenido.

Medido sobre píxeles, en la variación entre vecinos —que es donde se ve una
textura fina y no en el mínimo y el máximo de una zona, porque ahí lo que se
mide es el degradado—: el percentil 95 baja de **14 a 5** de noche y de **17 a
6** de día. Las motas de polvo se quedan: son puntos sueltos, no líneas, y son
lo que dice que la pieza lleva un tiempo ahí.

La nota de por qué están tan bajas va escrita dentro del propio SVG, para que
nadie las vuelva a subir sin saber que el suelo cambió.

### 0.7.55.2 · 1 sep 2026
Cuatro retoques de tono, y uno de ellos destapó otra variable que nadie
declaraba.

**Los puntitos del lienzo, más tenues** (del 9% al 5,5% de noche, 7,5% de día).
El punto no se movió; lo que se movió fue el suelo de debajo al pasar el lienzo
al tono hondo, y con más contraste debajo la cuadrícula empezó a robar
atención. Un punto de orientación tiene que estar cuando lo buscas y no antes.

**El encuadre de una rama vuelve a verse en modo claro.** La tarjeta pedía el
mismo tono que la página y sobre papel eso es invisible: el marco desaparecía
del todo. Ahora el suelo hondo se separa del fondo en la dirección que deja ver
el marco — de noche un pelo MÁS CLARO (la página es lo más hondo que hay) y de
día un pelo MÁS OSCURO (la página es papel) —, que de paso es el «un tic más
claros, pero muy poco» que pidió Eduardo para las ramas de noche.

**Y ahí salió `--borde-panel`**, que ninguna apariencia declaraba: el marco de
un panel y de una tarjeta de rama seguía siendo el gris azulado de la casa
encima de cualquier ambiente. Ahora se deriva de la línea de cada apariencia —
apagada al 70% de noche, aclarada +0,11 de luz de día, que es la relación
medida en la casa.

**Las columnas de Misiones pasan al suelo hondo.** Son tres cajas de 345×518 y
con el tono de una tarjeta el tablero entero se leía como una plasta del mismo
color, con las misiones encima sin escalón que las levante. Es el mismo trato
que ya tenía la tarjeta de un encargo, que es justo lo que Eduardo señaló como
ejemplo. Y con la mudanza, el rótulo de una columna vacía y la cuenta de la
cabecera suben de `--faint` a `--muted`: sobre la tarjeta clara el tenue daba
4,69 y sobre el suelo nuevo cae a 3,64.

La variable dejó de llamarse `--lienzo-suelo` y pasó a `--sup-hondo`: ya no es
solo el lienzo de un mapa, es el fondo de toda superficie que se come media
pantalla.

Foto de estilos: 96 diferencias, todas de estas cuatro.

### 0.7.55.1 · 1 sep 2026
Lo que Eduardo paró en la primera mirada de 0.7.55, y una cosa que faltaba.

**El lienzo vuelve a ser un tono liso.** Se le había puesto debajo el forro de
terciopelo de Reliquia, con el argumento de que el mapa es la superficie más
grande de la app. Era un error y la regla que sale de ahí queda escrita en el
CSS y en `CLAUDE.md`: **donde se vean nodos, el fondo es un tono liso más los
puntitos de orientación, nunca un dibujo.** Una textura ahí no es carácter, es
suciedad — compite con lo único que hay que leer en esa pantalla.

**Y la tarjeta de una rama es de una pieza.** La barra de arriba y la tira de
atajos de abajo iban en el tono de la tarjeta y el centro en el del lienzo; con
dos tonos muy distintos eso se ve parcheado. Ahora las tres llevan el mismo
suelo (`--lienzo-suelo`), que es el tono hondo que ya se usaba en el centro. Es
lo que pedía de verdad «que el fondo abarque todo»: no era la página, era esta
tarjeta.

**Los talentos, ahora sí, se ven distintos.** «No les cambiaste el diseño, se
ven igual que antes», y tenía razón: lo que cambió en 0.7.55 fueron los cables y
los rótulos —el suelo del dibujo— y las figuras seguían siendo las mismas.
Ahora hay **engaste**: un aro fino por fuera de cada figura, del material del
mundo, como el metal en el que va montada una pieza de vitrina. No toca la
forma —un rombo sigue siendo un rombo, que es lo que se pidió desde el primer
día— y en la casa está apagado (`--nodo-engaste: none`), así que un talento de
siempre se dibuja exactamente igual. De paso, el contorno de un nodo con
candado deja de salir de `--pip` —que ninguna apariencia mueve, así que los
talentos cerrados seguían siendo gris azulado sobre el lienzo violeta— y pasa a
`--lienzo-candado`, derivado como las otras siete.

**Las reglas de alinear: continuas y que se van al soltar.** Iban punteadas, y
en este mapa el punteado ya significa algo —un hilo apagado, un requisito sin
cumplir, el contorno de una caja—, así que se leían como una pieza más del
dibujo. Y se quedaban puestas después de soltar, porque soltar guarda pero no
vuelve a dibujar el mapa: la última regla sobrevivía al gesto. Medido: durante
el arrastre salen dos líneas sin `stroke-dasharray`, y al soltar quedan cero.

Foto de estilos: 102 diferencias, todas de estas dos (`.branch-card` y las capas
de `.const-wrap`).

### 0.7.55 · 1 sep 2026
**El fondo ya no se queda a medias: un ambiente pinta también el suelo.** Era
el fallo de «que lo del fondo abarque todo, no solo en medio», y medido resultó
literal: `--sup-pagina` vale `var(--fondo-pagina)`, y ningún ambiente declaraba
esa variable — solo `--bg`. Así que las tarjetas, los banners y los acentos
cambiaban de color y el SUELO de la página seguía siendo el carbón azulado de
la casa. Con la columna de contenido en 560 px, en una computadora eso se veía
exactamente como lo dijo Eduardo: el ambiente en el centro y la casa a los dos
lados. Ahora cada ambiente y cada mundo declaran su `--fondo-pagina` y su
`--fondo-raiz` —la franja que asoma al rebotar el scroll—, derivados de su
propio suelo con la misma forma que el degradado de la casa.

**Los suelos se hunden y dejan de leerse como una plasta.** «Muy cargados de un
tono, a tal punto que se ven monótonos.» Medido en OKLCh, el salto de la página
a la tarjeta era de 0,056 a 0,068 en los siete ambientes; ese salto es lo que
hace que una tarjeta se vea APOYADA encima y no pintada al lado. Se arregla por
abajo —la página baja, la tarjeta se queda— y al fondo se le baja además el
croma mientras a la tarjeta no: un campo enorme muy teñido es lo que se lee
como plasta; la tarjeta, que es la pieza pequeña, es la que puede permitirse el
color. El salto queda entre 0,10 y 0,14. La casa no se toca. La receta está en
`apariencias/croma.py`, en `HONDURA_NOCHE`.

**Los resplandores verdes donde no aplica: eran treinta y seis.** Tres orbes de
fondo (`.orb-1/2/3`) con la menta, la luciérnaga y el coral de la casa escritos
dentro de la regla, y treinta y tres más repartidos por el archivo —anillos de
foco, sombras de botón, bordes encendidos— como `rgba(95, 224, 176, 0.25)`. Los
orbes salen ahora del acento de cada apariencia (en Adobe son ámbar, en Duna
violeta, en Tinta el blanco de papel de su premisa); los otros treinta y tres
pasan por `color-mix` sobre `--mint-macizo`, así que además de seguir al
ambiente, en modo claro dejan de ser la menta de NOCHE, que es lo que eran.

**Reliquia tiene cara de día, y la de noche baja tres escalones.** El modo claro
estaba roto de una forma concreta: el bloque del mundo le gana a `html.claro`
porque `css/mundos.css` se carga después, pero solo en lo que declara — así que
salía la noche del mundo con los tonos de papel de la casa metidos por los
huecos. Ahora un mundo declara sus dos caras (`dia={...}` en `mundos/datos.py`)
y el bloque de noche lleva `:not(.claro)`, igual que los ambientes desde que
Escarcha destapó lo mismo. La vitrina de día no es la noche aclarada: el latón
no se mueve —un metal es el mismo a cualquier hora— y el lila se parte en dos,
porque sobre papel el mismo tono no puede rellenar y escribir.

**El mapa de talentos, tematizado.** Las ocho `--lienzo-*` que dibujan los
cables, los rótulos y los nodos con candado tampoco las declaraba nadie: el
mapa seguía entero en el gris azulado de la casa por debajo de cualquier
ambiente. Salen del suelo de cada apariencia con los MISMOS desplazamientos que
tiene la casa, medidos en OKLCh, y con el croma recortado al del propio suelo —
un cable es una raya de 2 px y no puede llevar más color que el suelo que lo
sostiene; el primer intento pintaba los hilos de Musgo de un verde encendido.
Los redondeos del mapa, que se dibujan desde JavaScript como atributos `rx`,
pasan ahora por `--r-factor`: con Reliquia puesta la app entera se cuadraba y el
mapa seguía con las esquinas blandas de la casa. Y el forro de un mundo también
va debajo del lienzo. **La letra del mapa se queda en Outfit**, escrito en la
regla para que un mundo futuro no se lleve por delante veinte rótulos de 10 px.

**Y tres arreglos que salieron de medir, no de mirar:**

- **El recorte del hilo era del color viejo del suelo.** `--lienzo-halo` es lo
  que separa un cable del fondo, y valía `#1d2530` —la tarjeta— desde antes de
  que el lienzo pasara a ser `--bg` en 0.7.54. O sea que cada hilo iba rodeado
  de una línea de otro color. Ahora vale `var(--bg)` y vuelve a ser invisible,
  que es su trabajo.
- **La tinta sobre un relleno vivo se separa de la del acento.** Lo destapó
  Tinta de día: su acento es tinta china, casi negro, así que su bloque pone la
  tinta de encima en claro — y esa misma variable inkaba también el amarillo y
  el coral, que en Tinta siguen siendo vivos y claros. Salía claro sobre claro:
  el rótulo «Estás viendo un ejemplo» daba **1,57** y el chip de una habilidad,
  **1,00**. Llevaba así desde que existe el ambiente. Ahora hay `--sobre-vivo`.
- **El isotipo de la barra plegada.** Se quedó fuera del arreglo de 0.7.54
  porque pinta con `currentColor` desde el CSS y el de la portada lleva el
  `fill` escrito en el SVG: dos caminos al mismo dibujo, y solo se arregló uno.
- **`.scel` entra en la lista de escenas que se quedan de noche.** Es una
  pantalla entera con un degradado oscuro escrito a mano, igual que las otras
  tres, y llevaba fuera desde que existe: en modo claro sus rótulos tomaban los
  tonos de papel.

**Lo que NO se tocó, a propósito:** el peso del movimiento de Reliquia
(`--m-dur` y `--m-curva`). Eduardo lo pidió explícitamente — «ese deslizamiento
me encantó, no lo cambies ni lo apliques aún en otro lado».

**Cómo se comprobó.** Foto de estilos calculados de las siete pantallas en los
dos modos, antes y después: 25 447 elementos, 449 diferencias reales y todas a
propósito (las otras 282 eran `color-mix` escribiendo el mismo color de otra
forma). Y una medida de legibilidad sobre PÍXELES —el color más repetido dentro
de la caja de cada rótulo, que es el fondo de verdad con degradado y textura
incluidos— para las ocho apariencias en los dos modos. La primera versión de esa
medida subía por los padres buscando un `background-color` opaco y se saltaba
los degradados, así que reprobaba media tarjeta de la racha en la app **sin
tocar**: la pista fue la de siempre, el número salía imposible también en el
estado de partida.

### 0.7.54 · 31 ago 2026
**El isotipo se queda menta pase lo que pase con el tema.** Iba pintado con
`--mint-macizo`, que es el acento de la APP — y Escarcha lo pone celeste, así
que la marca acababa azul. Ahora sale de `--marca-iso`, una variable que se
declara en los dos modos y que **ningún ambiente ni mundo toca**. Es la única
cosa de la app que un tema no puede cambiar, y creo que es la correcta: un tema
puede cambiarlo todo menos quién eres.

**El rótulo de arriba vuelve a ser una pastilla.** Fue tira de lado a lado en la
0.7.50 para acabar con dos pastillas apiladas que tapaban el título; el problema
eran las dos, no la forma. Con una sola pastilla se resuelven las dos cosas:
ocupa lo que mide su texto —medido, 215 px de 412— y el hueco de abajo sigue
reservado, así que no tapa nada.

**El lienzo de talentos usa el fondo hondo también en el previsualizador.** Antes
solo lo tenía a pantalla completa y fuera dejaba ver la tarjeta de debajo, así
que el mapa cambiaba de suelo al abrirlo. Ahora sale de `--bg` en los dos
sitios, en todas las apariencias, y vale igual para las ramas de proyectos —que
usan este mismo lienzo—.

**El imán de alinear.** Al arrastrar un nodo, si queda a menos de seis unidades
de estar alineado con otro, se alinea del todo y aparece una línea punteada que
lo dice. Seis no es a ojo: un nodo mide 44, así que es poco más de un décimo —lo
bastante para no saltar solo mientras recorres el mapa y lo bastante para no
tener que afinar al píxel con el dedo—.

Lo que hizo que funcionara: se compara contra **el mapa de posiciones del último
dibujo** y no contra `nodo.x`. Un nodo solo tiene coordenadas propias si alguien
lo movió a mano; los demás los coloca el acomodo automático. Con `nodo.x` el
imán solo se pegaba a nodos ya movidos, que es casi nunca. Comprobado: a 4
unidades se imanta en los dos ejes y salen las dos líneas; a 20 no se imanta y
no sale ninguna.

**Adobe, más oscuro.** Se veía cargado por CLARO, no por saturado, así que se le
baja la luz 0,045 en OKLCh dejando el matiz y el croma donde estaban. Medido
después: texto sobre tarjeta 14,78, secundario 6,12, apagado 3,38 —que además
sube—, acento 10,58. Ninguno baja de su umbral.

**Y la hoja de los iconos, más redonda** en sus cuatro esquinas (18/9 en vez de
16/5).

### 0.7.53 · 31 ago 2026
**El marco dorado no seguía la esquina, y no era un descuido: era una regla del
navegador.** Un `border-image` IGNORA el `border-radius` — está en la
especificación y no hay forma de pedirle que lo respete—, así que un mundo con
esquinas redondeadas enseñaba una tarjeta redonda con un marco CUADRADO. «No se
percibe mucho a simple vista pero sí se nota», y era exactamente eso.

Ahora el metal se dibuja como un **aro en un `::before` con máscara**: una capa
del tamaño de la caja con el degradado pintado hasta el borde y una máscara que
le quita todo menos el anillo. `border-radius: inherit` hace que siga la esquina
de su tarjeta, sea la que sea. Medido: el aro y la tarjeta comparten los 14,86
px de radio, y en toda la app no queda **ni un solo `border-image`**.

Y de paso el grosor se homologa: Reliquia pedía 2 px porque el `border-image`
necesitaba ancho para dibujarse. Sin él, dos grosores distintos son solo dos
grosores distintos. Todo a 1 px.

**Dos esquinas más que el factor no alcanzaba** —`.panel.alt` y `.sum-card.a`,
escritas a mano— ya pasan por él.

**La gota deja de ser un cuadrado y se vuelve una hoja**, con dos esquinas
redondas y dos rectas, y **se alterna**: los elementos pares llevan la silueta
volteada (`--r-gota-alt`). Una lista de diez iconos con la misma figura repetida
se lee como una plantilla; alternando la orientación se lee como diez piezas. Va
por `nth-of-type` en el CSS y no por una clase desde JavaScript, porque quien
pinta una lista no tiene por qué saber nada de la forma de un icono.

**Y el mapa de talentos, tres cosas:**

1. **El mando del zoom desaparece del previsualizador.** Una vista previa es una
   MUESTRA —cabe medio mapa y se entra tocándola—, así que un control de zoom
   ahí ni cabe ni hace falta. A pantalla completa sigue.
2. **A pantalla completa y en el teléfono, los dos mandos se reparten**:
   herramientas a la izquierda, zoom a la derecha, en la misma línea. Antes la
   tira iba centrada abajo, chocaba con el zoom, y había una función que subía
   el zoom a media pantalla para esquivarla — que es justo lo que se veía mal
   colocado. Se borra esa función: un reparto fijo se entiende; uno que se mueve
   solo, no. Medido a 412 px: tira en x=12, zoom en x=243, sin solaparse.
3. **El previsualizador es más alto en el teléfono**, de 261 a 414 px. La regla
   de «la tarjeta mide lo que mide el dibujo» es buena para no arrastrar hueco
   vacío, pero en una pantalla estrecha el dibujo es mucho más ancho que alto:
   cabía por los lados recortado y la ventana quedaba en una rendija por la que
   no se entiende la forma de la rama. En la computadora no se toca.

### 0.7.52 · 31 ago 2026
**La primera revisión de Reliquia, y la mitad de lo que salió no era de
Reliquia: era de la app.** Eduardo miró el mundo puesto y encontró siete cosas.
Cinco eran huecos del sistema —sitios donde una esquina o un color estaban
escritos a mano y por eso un mundo no llegaba— y dos eran del mundo.

**Del sistema:**

- **La GOTA es una variable.** La silueta irregular que va detrás de un icono
  —la de una habilidad, la de la celebración, la de los colores— era el mismo
  `border-radius` de ocho valores escrito a mano en cinco sitios. Con la app
  cuadrada por Reliquia, esas cinco seguían siendo gotas. Ahora es `--r-gota`;
  va en porcentajes, así que NO pasa por el factor y un mundo que se cuadra
  tiene que decirlo — Reliquia la pone en 7 px.
- **Las esquinas del encabezado de sección pasan por el factor.** Iban escritas
  `12px 34px 34px 34px` y eran las únicas de la app que un mundo no podía
  tocar: la app entera se cuadraba y los cuatro banners seguían con la burbuja
  de la casa.
- **El icono de una misión** llevaba `9px` a pelo; ahora es `calc(9px ×
  factor)`, que pasa por el sistema sin cambiarle un píxel a la casa.
- **Las curvas del encabezado de Talentos salían del color del BORDE**, y en un
  mundo con marco dorado eso son líneas de oro brillante justo detrás del texto.
  Ahora salen del suelo, apenas por encima del lienzo: relieve, no dibujo.
  Medido, el peor rótulo de ese banner pasa a **8,79** de contraste.
- Y **una salida a «Norata clásico»** en la lista de mundos. Lo preguntó
  Eduardo y la pregunta era la buena: con un mundo puesto, había que tocar un
  RECOLOR para volver, que se lee como «elegir Musgo» y no como «quitar
  Reliquia». La puerta de vuelta va donde uno la busca — en la misma lista por
  la que entró.

**Del mundo:**

- **Las esquinas dejan de estar en punta.** «Ni muy redondas como el clásico,
  pero tampoco tan en punta», y tenía razón: 4 px es un canto, no una esquina.
  El factor sube de 0,29 a 0,57 —la tarjeta pasa de 4 a 8, el panel de 7 a 15—
  y los chips de 3 a 6.
- **El latón deja de ser el contorno de todo.** «Se gasta el recurso muy
  rápido», y el número lo confirma: contados en las siete pantallas, **53
  elementos** llevaban el marco dorado —quince etapas de proyecto, diez
  tarjetas de habilidad, ocho botones—. Ahora son **11**, y solo en las dos
  piezas que de verdad enmarcan: el panel y la tarjeta del Resumen. Todo lo
  demás vuelve a un borde liso del latón apagado. Once marcos en siete
  pantallas se leen como un marco; cincuenta y tres, no.
- **Syne se frena en 700.** Es variable de 600 a 800 y a 800 se ESTIRA —es lo
  característico de esa familia—, lo que alarga los rótulos y descuadra los
  renglones. El freno se pone en el propio `@font-face`, declarándolo de 600 a
  700: el navegador recorta al techo cualquier petición de 800 sin tener que ir
  a buscar una por una las reglas de la app que la piden.

**Y el aviso al cambiar de tema ya no dice el nombre**, solo «Cambiando tema…».
El nombre ya está en la tarjeta que acabas de tocar.

La prueba de que ninguno de los cinco arreglos del sistema le movió nada a la
casa: la foto de los estilos calculados de siete pantallas en los dos modos,
**25 645 elementos, cero cambios**.

### 0.7.51 · 31 ago 2026
**Reliquia no se ponía, y la causa era una línea.** `elegirApariencia` —la
función por la que se entra al tocar una tarjeta— seguía preguntando por
`ambientePorId`, y un mundo no está en la lista de ambientes. Así que tocar
Reliquia salía por el `return` de la línea siguiente: sin un error, sin un aviso
y sin cambiar nada. Al construir el mundo se corrigieron `aparienciaDisponible`,
`ponerApariencia` y `motivoApariencia`, y se quedó justo la puerta de entrada.

**Y elegir una apariencia recarga la app.** Lo propuso Eduardo y resuelve de raíz
una clase entera de problemas: un mundo trae su propio archivo de estilos, que
llega por la red DESPUÉS de que el atributo ya esté puesto, y el árbol de
talentos y las escenas se dibujan una vez con los colores que había al
dibujarlas. Aplicarlo en caliente deja media app con lo nuevo y media con lo
viejo. Dentro del ejemplo NO se recarga: el ejemplo vive en memoria y una
recarga lo borraría sin avisar — comprobado, ahí se aplica en caliente y el
ejemplo sigue puesto.

Y para que la recarga no enseñe un fogonazo, **la hoja del mundo se pide desde
el script de arriba de `index.html`**, a la vez que el resto, en vez de esperar
a que arranque el motor. La lista de mundos va escrita a mano ahí porque ese
script corre antes que todo; si algún día discrepa de la de verdad, lo que se ve
es el fogonazo, no un error.

**Cada apariencia lleva su icono**, que era lo otro que pidió: dentro de la
muestra y del color de su acento. Dice cuál es cuál sin leer el nombre, que es
justo lo que tres tonos de fondo no pueden decir. Brújula para la casa de noche,
pluma para Tinta, planta para Musgo, globo para Marea, sol para Adobe, luna para
Escarcha, estrella para Duna. Y la piedra para Reliquia, que no se inventó: es
el mismo dibujo con el que la app ya nombra la insignia de Fundador.

**El botón de reportar un fallo dejó de salir cinco veces.** Vive al pie del
ÍNDICE de Ajustes junto al número de versión, pero los dos cuelgan FUERA del
envoltorio de las secciones: en el teléfono, al abrir una sección el índice
desaparece y estos dos se quedaban debajo de cualquier panel. Comprobado en las
cinco secciones y en el índice, a 412 y a 1280.

### 0.7.50.1 · 31 ago 2026
**La franja del navegador, terminada.** La 0.7.50 dejó de pintarla con los dos
colores de la casa, pero preguntando Eduardo salió lo que de verdad le pasaba:
**en modo día no se leía la barra de notificaciones del teléfono.**

Tres cosas, y la del medio es la que lo explica:

- **La etiqueta se REEMPLAZA en vez de cambiarle el atributo.** Parece lo mismo
  y no lo es: Chrome en Android elige el color de los iconos del sistema —la
  hora, la señal, la batería— al leer `theme-color`, y cambiando solo su
  `content` hay versiones que repintan el fondo de la barra y **no vuelven a
  elegir el color de los iconos**. El resultado es iconos claros sobre una barra
  que acaba de ponerse clara: una barra ilegible, que es exactamente el
  síntoma. Quitar y poner el elemento la obliga a decidir otra vez.
- **El color se lee del fondo ya calculado** y no de la variable en crudo. Antes
  se leía `--bg` y se abandonaba si traía un paréntesis —o sea, ante cualquier
  degradado—, y abandonar quería decir dejar puesto el color de otra cosa.
- **Y el mundo repinta la franja cuando su archivo llega.** `css/mundos.css` se
  pide al encenderlo, y hasta que carga `--bg` sigue siendo el de la casa:
  medido, Reliquia declaraba `#10151d` teniendo `#100c1a` de fondo.

De paso, el valor que el navegador lee AL ABRIR en modo día pasa de `#f2f4f8`
—que es el fondo de los correos, no el de la app— a `#dcdef0`, que es lo que la
app pinta de verdad.

Comprobado en las doce combinaciones de modo y apariencia: la etiqueta coincide
con el fondo pintado (contraste 1,00-1,03, o sea el mismo color), sigue al
alternar de modo en los dos sentidos, y nunca queda más de una etiqueta. Los
mundos no cambian con el modo y eso es correcto: un mundo declara sus propios
colores y Reliquia es de noche.

**Lo que no se puede comprobar desde aquí:** cómo pinta Android la barra de
verdad. Lo que sí se garantiza es que el color que la app declara es el que la
app pinta, en toda combinación.

### 0.7.50 · 30 ago 2026
**Tres fallos que vio Eduardo en su teléfono, y los tres tenían un número
detrás.**

**1 · «No cambia el tema y quita el recolor».** El ambiente elegido se caía sola
en cada apertura. La causa es CUÁNDO se preguntaba: `arrancarApariencia()` corre
al arrancar, antes de que el servidor haya contestado quién eres, y en ese
instante tu nivel es 0 y tu plan es el libre — así que la puerta decía que no y
la apariencia se quitaba. Y no había segunda mirada. Medido: con
`norata-apariencia = duna` guardado, el atributo salía en `null` y **seguía en
null aunque después el nivel llegara a 50**.

Ahora el arranque solo PINTA lo guardado, y la puerta se revisa en
`refrescarApariencia()` — que llaman `revisarAdmin` cuando el servidor contesta,
y los dos sitios que mueven el plan. Sigue valiendo «congelar, nunca quitar»: si
de verdad ya no se puede, se vuelve a la casa y la elección guardada no se
borra.

Y de paso, la ceja del navegador: `ponerTema` la pintaba con los dos colores de
la CASA, así que una app morada se quedaba con una franja azul encima. Ahora lee
el fondo ya calculado, que siempre dice la verdad sea cual sea la apariencia.

**2 · El aviso de versión nueva salía en seis renglones.** `#toast` declaraba
`max-width` pero no `width`, y una caja fija que solo declara `left: 50%` se
encoge a lo que le quepa DESDE ese 50% hasta el borde derecho — media pantalla.
En una computadora sobra y no se veía; en un teléfono de 412 px el aviso medía
201 px y el texto se quedaba en una columna de 49. Con `width` en vez de
`max-width`: **de 6 renglones a 1** a 412 px, y a 2 en uno de 360.

**3 · El encabezado deja de ser dos pastillas y pasa a ser una barra.** Eran dos
—«cuenta de pruebas» y «estás viendo un ejemplo»— apiladas y flotando encima del
contenido, y entre las dos tapaban el título: medido a 412 px, la de pruebas
caía justo sobre «Resumen». Ahora es **una sola barra de ancho completo** y la
app baja lo que ella mide. Una barra de sistema se lee como parte del marco; una
pastilla flotante siempre tapa algo.

Tres detalles que salieron al medirla: el hueco se mide en JavaScript sobre la
barra ya dibujada y no se clava a un número, porque en una pantalla estrecha el
texto se parte en dos renglones; el texto se PARTE en vez de recortarse, porque
lo que se perdería con los puntos suspensivos es justo el final —qué plan estás
fingiendo—; y el relleno de arriba hay que escribirlo también en la regla de la
computadora, porque esa viene después y su `padding` corto borraba el
`padding-top` de la de antes. Sin esa línea el fallo seguía vivo en la
computadora y arreglado en el teléfono.

Comprobado en las seis combinaciones —412, 360 y 1280 px, con las dos, con una y
con ninguna—: la barra nunca toca el título, no recorta, el botón de salir mide
27 px de alto y el contraste del rótulo es 12,9.

### 0.7.49 · 30 ago 2026
**Reliquia, el primer mundo.** Un mundo no es un ambiente: un ambiente reusa el
material y le cambia la luz; un mundo cambia de qué está hecha la app. Reliquia
es una pieza en su vitrina —forro de terciopelo, marco de latón, la letra Syne y
el vidrio por encima—, y va antes que Averno y Blueprint porque lo decidió
Eduardo: es lo único que Fundador tiene además de Pro, y un pago único de $890
necesita algo que se vea.

**El traductor, que es la parte que sirve para los catorce.** Los mundos se
diseñaron en `mundos/` con su propio vocabulario (`--m-*`), nacido en la lámina
que los enseña a los catorce juntos. La app lleva desde 0.7.37 el suyo
(`--sup-*`, `--r-*`, `--tipo-*`, `--marco-*`). Con dos vocabularios sueltos,
cada mundo sería una traducción a mano y el número catorce no se parecería al
primero; ahora `mundos/app.py` traduce, y el siguiente mundo es correr un
comando.

**`css/mundos.css` no va en `ASSETS` ni en `index.html`**, y eso es la regla que
dejó escrita la caché de 0.7.38: lleva la tipografía y las texturas —51 KB— y
bajárselo a quien nunca va a encender un mundo es justo lo que se vino a evitar.
Lo pide el motor la primera vez que se enciende uno, y el service worker lo
guarda solo cuando pasa por ahí. Syne va incrustada y no traída de un servidor
de fuentes: la app se sirve de su propia copia y no pide nada a la red, y una
fuente de fuera es una petición a un tercero que sabe quién la hizo. Licencia
SIL OFL 1.1, que permite incrustarla.

Medido con el mundo puesto: la letra carga, el marco de latón se dibuja sobre
sus 2 px de borde —hacen falta las DOS variables—, las esquinas bajan a canto de
vitrina por `--r-factor`, los rangos pasan a llamarse Hallazgo, Pieza,
Colección, Sala y Legado, y el texto sobre tarjeta da 14,4 de contraste. Sin un
error y sin desbordes, a 430 y a 1280.

**Y con Reliquia entran por fin las tres líneas de la tabla de precios** que
llevaban escritas desde el 30 de agosto esperando a que el mundo existiera: la
comparativa deja de decir lo mismo para Pro y para Fundador («Todas, y
Reliquia»), la tarjeta de Fundador gana su ventaja, y la lista de lo que se
acaba de abrir lo nombra.

---

**Los ambientes se notan mucho más, que es lo que faltaba.** Lo dijo Eduardo con
dos frases exactas: «los banners se comen la presencia de los módulos y dan la
impresión de que no cambió nada» y «en PC los fondos casi no se notan de noche».
Las dos tenían un número detrás.

1. **Los suelos de noche tenían MENOS color que el carbón de la casa.** Medido
   en OKLCh: Musgo 0,0168 de croma y Adobe 0,0114 contra los 0,0180 del azul de
   casa. O sea que el ambiente sí llegaba — y lo que llegaba era más gris que lo
   que sustituía. Ahora los suelos de los cinco suben al perfil de croma de
   Duna, que es el único que Eduardo dijo que sí se distingue. **Se sube el
   croma y NO la luz**, y ese es todo el truco: el contraste se calcula con la
   luminancia, así que dejando la L quieta los treinta y dos contrastes ya
   aprobados siguen valiendo. Comprobado: el que más se movió lo hizo 0,12.
   Tinta no se toca — es un monocromo elegido, y darle color sería convertirlo
   en otro ambiente.
2. **El velo del encabezado pasa de 0,5→0,7 a 0,3→0,52.** Con el velo espeso, la
   mayor parte de lo que se ve de un banner es el velo, y el velo es casi negro
   en cualquier ambiente: el color quedaba debajo de una manta. Se puede bajar
   porque el contraste sobraba —el peor rótulo estaba en 9,5 contra un umbral de
   4,5— y lo que de verdad sostiene el texto es su sombra.
3. **Los botones del banner llevan el acento**, que es lo segundo que pidió: el
   vidrio del foco y las pastillas de la racha se mezclan con un 14% del acento
   y su borde sube a un cuarto de acento.
4. Y el tinte del paisaje sube de 0,55 a 0,85 en los ambientes de grado 1.

Los números, en dE2000 —que es lo que hay que usar en tonos oscuros—: la
pantalla entera de una computadora de noche pasa a moverse **hasta 7,4** (Musgo
y Adobe) y en un teléfono **hasta 14,0**; los cuatro encabezados, de 0,4-5,6 a
**1,2-7,6** de noche y a **2,4-15,2** de día.

**Lo que sigue sin moverse mucho, y es honesto decirlo:** Tinta (1,1 en una
computadora) y Escarcha (2,5). Tinta es un monocromo a propósito. Escarcha
comparte matiz con el azul de la casa —249° contra 259°— y su premisa es
justamente ésa: la casa con el acento celeste. Moverla más sería cambiarle el
concepto, y eso no se hace sin decirlo.

### 0.7.48 · 31 ago 2026
**Subir de nivel se celebra, y son dos celebraciones y no una.** Lo pidió
Eduardo así: que te lo cante como cuando sube una habilidad pero más llamativo,
y que si el nivel abre algo, lo anuncie ahí mismo con una ventana que no se
salte por accidente.

- **Un nivel a secas** es una fiesta que pasa: se va sola a los ocho segundos y
  se corta tocando fuera. No se interrumpe una tarde por un número.
- **Un nivel que abre algo** es una ventana de verdad: no se cierra tocando
  fuera, no se cierra sola, dice qué se abrió y lleva ahí con un botón. Un
  premio que se anuncia y desaparece antes de leerlo es peor que no anunciarlo.

El nivel no se guarda —los puntos se cuentan, nunca se escriben—; lo que se
guarda es hasta qué nivel se festejó ya, igual que `rachaFestejada`. Y el
marcador se siembra al ARRANCAR y no en el primer registro: sembrándolo ahí, la
primera llamada de una cuenta nueva sería justo la del primer nivel y la fiesta
más importante de todas no saldría nunca.

**Y un escaparate en la trastienda para verlas.** Cinco botones que disparan
cada celebración: las tres de nivel, el hito de racha y el destello chico.
Existe porque algunas pasan una vez en la vida de una cuenta —el rango Red pide
veintiocho niveles— y porque una animación no se puede MEDIR: sin componer
fotogramas se queda en el valor de partida, así que la única prueba real de una
fiesta es mirarla. Antes de dibujarla se sale de Ajustes: las celebraciones
viven en el piso de las fiestas y Ajustes en el de las ventanas, y disparada
desde dentro se dibujaba debajo del panel.

**Los ambientes ya llegan a los encabezados de los módulos.** Lo cazó Eduardo:
la app entera de otro color y sus cuatro cabeceras en el azul de la casa. Eran
tres agujeros distintos y ninguno era el mismo:

1. **Quince transparencias con el color escrito a mano** dentro de las escenas
   —el velo, las pastillas de vidrio, los rótulos a media tinta—. Ahora salen
   de tres tripletas (`--escena-fondo`, `--escena-vidrio`, `--escena-tinta`).
   Tripletas y no colores hechos porque a un `var()` no se le pega la
   transparencia detrás: la misma trampa que obligó a inventar `velo()`.
2. **El paisaje está DIBUJADO con hexes en el JavaScript.** Reescribir sus
   cuatro paletas por ambiente serían veinticuatro tonos a ojo cada uno. En vez
   de eso, una capa del color del ambiente en `mix-blend-mode: color`: se queda
   con su tono y respeta la luz de lo que hay debajo, así que el dibujo no
   cambia —la luna sigue siendo lo más claro— pero cambia de qué está hecho.
   Apagada con `display` y no con un color transparente, para que la casa quede
   exactamente igual.
3. **Las superficies faltaban en la lista de la noche.** Esa lista se escribió
   cuando `--card` era a la vez el color y lo que se pinta; desde 0.7.37 son dos
   cosas. Lo destapó el primer botón dentro de una escena: en modo claro,
   `.btn-ghost` cogía el papel de la página y la tinta clara de la noche —blanco
   sobre blanco, 1,24 de contraste—. Y hay que escribir los `--sup-*` uno por
   uno: un `var()` dentro de una variable se resuelve donde la variable se
   DECLARA, no donde se usa, así que redeclarar `--card` no arrastraba a
   `--sup-tarjeta`.

Medido con dE2000, que es lo que hay que usar en tonos oscuros: de día los
cuatro encabezados se mueven entre 1,7 y 12,2 según el ambiente; de noche, entre
0,4 y 5,6. **De noche se mueve poco y es honesto decirlo**: el velo del
encabezado deja el banner casi negro, y en casi negro no hay color que mover.
Escarcha sale en 0,0 y también es correcto —de noche no toca ningún neutro, solo
el acento—.

Y la prueba de que no se rompió nada por el camino: la foto de los estilos
calculados de siete pantallas en los dos modos, 26 524 elementos, **cero
cambios** con la apariencia de la casa puesta.

**Un arreglo pendiente, de paso.** La tabla de planes decía «Solo las paletas de
color» para Gratuito, y con el reparto nuevo dejó de ser cierto: Escarcha y
Marea son paletas y piden Pro. Ahora dice «Las paletas que vayas
desbloqueando», que además es la invitación buena.

**Lo que NO entra todavía**, y a propósito: las tres líneas de la tabla de
precios que anuncian el mundo de Fundador. Están escritas palabra por palabra en
`apariencias/LEEME.md` y entran **el día que entre Reliquia**, no antes.
Escribirlas ahora sería prometer un mundo que la app no tiene — exactamente la
deuda que costó quitar la fila de «Todas las apariencias».

**Y el número, otra vez repetido.** La otra sesión y ésta volvimos a coger el
mismo —0.7.47— el mismo día. Se corrigió mirando `main` antes de escribirlo,
que es la regla que ellos mismos apuntaron en su entrada: el número se toma en
el momento de publicar, no al empezar la tanda. Ésta sube a 0.7.48 y la suya se
queda como salió.

### 0.7.47 · 30 ago 2026
**El destello: la fiesta pequeña, que es la que más se ve.**

La app tenía dos tamaños de celebración y **los dos interrumpen**: la tarjeta de
2,2 s (`celebrate`) y la escena de pantalla completa de la racha
(`celebrateStreak`). Con solo esos, o se festeja poco o se festeja tapando lo
que estabas haciendo — así que se acababa festejando poco. Faltaba el pequeño.

Dura 420 ms, sale encima de lo que tocaste y no para nada: ni tapa, ni se puede
pulsar, ni mueve un píxel de la página. Seis chispas y un aro, con el color de
la misión. Va en `--piso-confeti`, que ya existía y dice exactamente esto: «la
luz de celebrar, que no se toca».

**Dos cosas que salieron midiendo y que no se veían de ninguna otra forma:**

1. **Buscaba el botón en todo el documento y encontraba el del Resumen**, que
   cuando estás en Misiones está escondido y mide 0×0. El destello se disparaba
   contra un elemento sin caja y no salía nunca, sin dar ningún error. Ahora se
   busca dentro de `.view.active`.
2. **La caja se toma ANTES de repintar.** Al cumplir una misión la fila cambia
   de columna —medido: 286 px a la derecha—, así que celebrar en su sitio nuevo
   es soltar la luz lejos de donde tienes el dedo y la mirada. Comprobado: cae
   a 0,0 de donde tocaste y a 286 de donde acabó la misión.

Sale en **cualquier avance** y no solo al cumplir: una misión de tres veces al
día se toca tres veces, y las dos primeras también son algo que hiciste.
Respeta `prefers-reduced-motion`, y ahí no se pierde nada porque el aviso de
siempre sigue saliendo igual.

Probado el ciclo entero: un toque deja el destello y a los 700 ms no queda
nada; cinco toques seguidos conviven los cinco y se limpian los cinco.

**Lo que todavía no tiene destello:** registrar una práctica y marcar una etapa.
Cada sitio necesita decir a qué elemento se engancha la luz, y eso va cuando se
decida si esas dos también lo llevan.
### 0.7.46 · 30 ago 2026
**La trastienda ya puede mirar lo que abre la escalera.** El plan de fundador
simulado trae ahora también el nivel: 50, que está por encima de todo lo que
hay escrito hoy y deja sitio para lo que venga. Sin esto, revisar cómo se ve un
ambiente del nivel 20 pedía ganárselo —años de uso—, y lo único que quedaba era
mirar el CSS y suponer.

Tres decisiones dentro:

- **Va enganchado al reparto de puntos y no al nivel.** Todo lo demás sale de
  ahí, así que el nivel, el rango, la insignia, la barra y los candados de los
  ambientes quedan de acuerdo entre ellos, y «Mi expedición» enseña una sola
  fuente —«Nivel de pruebas»— en vez de un total que no cuadra con sus
  renglones. Y se sigue sin guardar nada: los puntos se cuentan, nunca se
  escriben.
- **Solo con la simulación explícita**, no con el `PLAN_DE_CASA` que la cuenta
  administradora tiene puesto por serlo. Sin simular nada hay que poder ver la
  app con el nivel de verdad, que es el que ve todo el mundo.
- **La curva se suma, no se escribe.** Hoy son 37 475 puntos; un 37475 clavado
  en el código empieza a mentir el día que alguien mueva un peso.

Y de paso, un fallo que estaba ahí desde antes: `planSimular` decía en su propio
comentario que repintaba TODO y repintaba solo Ajustes — el Resumen se quedaba
con el plan anterior puesto. Ahora redibuja la vista de abajo, como ya hacía
`planRefrescar`. Importaba poco cuando solo cambiaba el plan; con el nivel
dentro, importa el doble.

**Y en la cuenta de pruebas, el rótulo del ejemplo se calla.** Existe para que
nadie confunda datos inventados con los suyos, y quien acaba de pulsar «Ver un
ejemplo» desde la trastienda no puede confundirse: ya lo sabe. Lo que sí
estorbaba era la pastilla encima de la cabecera justo mientras se juzga cómo se
ve la app. **El botón de salir no se quita**, y esa parte no es negociable: es
la única puerta del ejemplo, y apagarla dejaría a alguien encerrado mirando
datos que no son suyos.

### 0.7.45 · 30 ago 2026
Un mundo te renombra el camino. Los cinco rangos de la casa siguen siendo los de
la casa; **un mundo trae los suyos**, con sus nombres y sus dibujos.

Es la decisión que cierra un choque de dos sesiones y, de paso, la que separa
una piel de un mundo: un recolor te cambia la luz — un mundo te cambia hasta
cómo se llama lo que llevas recorrido. En Arboleda no eres Nodo: eres Semilla,
y el que llega arriba no es Red, es Norte.

**Lo que cambia es el nombre y el dibujo. Los niveles de entrada no**, y eso es
a propósito: si cada mundo moviera los peldaños, dos personas con el mismo
nivel estarían en sitios distintos de la escalera y la escalera dejaría de
significar nada. Una sola escalera, muchos vocabularios.

| | 1 | 4 | 10 | 18 | 28 |
| --- | --- | --- | --- | --- | --- |
| **La casa** | Nodo | Enlace | Rama | Trama | Red |
| **Arboleda** | Semilla | Brote | Refugio | Cima | Norte |
| **Averno** | Ceniza | Chispa | Brasa | Llama | Hoguera |
| **Blueprint** | Boceto | Trazo | Plano | Corte | Obra |
| **Consola** | Bit | Byte | Proceso | Núcleo | Sistema |
| **Reliquia** | Hallazgo | Pieza | Colección | Sala | Legado |

Arboleda estrena los cinco dibujos que se habían hecho para la app y que ahora
viven donde tienen sentido. Los otros cuatro tienen nombre y tendrán dibujo el
día que se construya cada mundo, con el resto de sus vectores.

**Un ambiente NUNCA renombra los rangos**: cambia la luz, no el vocabulario.
Eso es exactamente lo que separa un ambiente de un mundo.

### Dónde vive cada cosa

Los dibujos de los rangos **viajan con su mundo y no con la app**. Meter en
`ICONS` los cinco rangos de quince mundos serían setenta y cinco dibujos que se
baja todo el mundo para no usar ninguno. Por eso un rango de mundo trae su
trazo entero y uno de la casa nombra un icono de `ICONS`; `insigniaExpedicionHTML`
sabe dibujar los dos.

### La reconciliación de dos sesiones

Esto sale de un choque que conviene tener escrito, porque volverá a pasar.

**Había dos motores de nivel.** Mientras esta rama escribía
`js/10j-expedicion.js`, la otra sesión publicaba `js/02b-expedicion.js`: los
dos contaban lo mismo, con los mismos pesos y la misma curva, y hasta con la
misma cita de `js/10-fusion.js` para justificar que los puntos se cuentan y no
se guardan. Dos personas llegando por su cuenta a la misma conclusión es buena
señal del diseño y pésima del proceso.

Se queda `02b`, y no solo por llegar antes: **su semana es la de la app**.
`expSemanaDe` usa `weekdayOfKey` —domingo, igual que la tira de la racha—; el
otro contaba semanas desde la época, y dos formas de contar la semana en la
misma app se notan en cuanto alguien compara.

**Y no era solo duplicación: era un fallo de arranque.** Los dos declaraban
`const EXP_PUNTOS` y `const EXP_RAMPA` en el ámbito global. Dos `const` con el
mismo nombre en el mismo ámbito es un SyntaxError, así que con los dos cargados
**la app entera dejaba de arrancar**. La regla que sale de aquí: antes de crear
un archivo de motor, buscar si ya existe uno.

**También había dos tarjetas de expedición en el Resumen.** Se queda la de la
otra sesión, que es mejor —lleva la insignia dentro y va al lado de «Niveles»,
que son primos—. Lo único que se le añade es el destino: Ajustes → Apariencia,
que no existía cuando ellos la escribieron y ahora sí. La colección, que sería
el destino ideal, sigue sin existir y no se inventa.

**Un peldaño no puede tener dos verdades.** La escalera de `02b` decía «un
ambiente nuevo en el nivel 8» mientras el catálogo abría Adobe en el 7. Su
propio comentario ya lo preveía —«los ambientes de verdad los define el
catálogo cuando exista»—, así que la escalera se arma al vuelo juntando sus
rangos y celebraciones con los ambientes del catálogo. Al vuelo y no en la
constante porque `02b` carga **antes** que el catálogo.

Y con eso los ambientes dejan de estar apagados: `APARIENCIA_PUBLICA` pasa a
`true` y la pantalla de Apariencia es de todos. Las dos puertas de un ambiente,
en este orden: primero el **nivel**, que es lo que se gana, y después el
**plan**, que es lo que se paga. A quien todavía no llega al nivel no se le
ofrece pagar, se le dice cuánto le falta — cobrar por saltarse la escalera es
justo lo que rompería la escalera.

**«Apariencia» pasa a llamarse «Mi apariencia»**, que es como se llaman las
otras cuatro entradas de Ajustes: Mi perfil, Mi plan, Mis módulos, Mi
almacenamiento. Los nombres de ese índice dicen de quién es la cosa, no de qué
va el panel, y esta era la única que se había quedado fuera de la familia.

**Y las dos pantallas dejan de discutir.** «Mi expedición» cuenta el recorrido
—tu nivel, los cinco rangos, de dónde salen tus puntos—; «Mi apariencia» es
donde se elige lo que llevas puesto. Lo decidió Eduardo, y lo que sobraba era
tener dos respuestas a la misma pregunta. De ahí salen dos hilos que se atan:
la tarjeta del Resumen deja de llevar a Ajustes y lleva a «Mi expedición», que
es el destino que su propio comentario pedía cuando esa pantalla todavía no
existía —la tarjeta habla de tu nivel—; y «Mi expedición» gana el único enlace
a «Mi apariencia», para no tener que buscar dónde se recoge lo que se acaba de
ganar.

**Y el número, que llegaba repetido.** Esta entrada nació siendo 0.7.44 al
mismo tiempo que la de abajo, en dos sesiones que no se veían: dos árboles
distintos con el mismo `VERSION` y el mismo `CACHE`. Con el `sw.js` de 0.7.38
eso no es un detalle de contabilidad — el nombre de la caché es el ÚNICO
canal por el que una versión entra en un aparato, y dos versiones con el
mismo nombre significan que la segunda no llega nunca. Se corrige subiendo
esta a 0.7.45; la de abajo se queda como salió a la calle.

### 0.7.44 · 30 ago 2026
**Mi expedición**, la pantalla del recorrido. Se llega tocando la fila de la
cuenta —el menú del engrane y la ficha de «Mi perfil»—, que es donde vive la
insignia: donde está tu insignia, se toca tu insignia.

Enseña tres cosas: tu nivel con su rango y lo que falta para el siguiente, los
**cinco rangos** con el tuyo marcado y el nivel de los que vienen, y **de dónde
salen tus puntos** —de mayor a menor, que es leer tu propio recorrido—.

**Es un inventario, no una vitrina.** La diferencia importa y es lo que hace
que tenga sentido sin nadie más mirando: lo que guarda no son medallas, son
cosas que se usan. Los ambientes entrarán aquí el día que existan, y esa es la
pantalla donde se elegirá cuál llevas puesto.

**La fila de la cuenta deja de llevar a «Mi perfil»** y lleva aquí. No se
pierde nada: «Mi perfil» tiene su propio botón tres renglones más abajo, que es
justo lo que hace que este cambio salga gratis.

**Y «Mi exigencia» deja de ser sección: se muda dentro de «Mi perfil».** Tenía
sección propia desde 0.7.39.4 y sobraba — quien viene a cambiarla viene a
cambiar algo suyo, y ahí es donde están las otras cosas suyas. El índice de
Ajustes vuelve a tener cuatro entradas.

**Un fallo mío de 0.7.43, corregido antes de que se viera en la calle.** La
tarjeta del Resumen anunciaba «Destello propio al cumplir una misión» para el
nivel 3 y un ambiente para el 2, y **ninguna de las dos cosas existe todavía**.
Es exactamente la deuda que costó quitar la fila de «Todas las apariencias» de
la tabla de planes: prometer lo que la app no tiene. Ahora cada peldaño de la
escalera lleva `listo`, y solo se anuncia lo que ya se puede cumplir — hoy, los
cinco rangos. La escalera entera sigue escrita en el código porque es el plan y
ahí es donde se conserva; el día que un ambiente esté puesto se le pone una
palabra y aparece.

### 0.7.43 · 30 ago 2026
**La tarjeta de expedición en el Resumen.** Una más del tablero, con las mismas
reglas que las otras siete: se mueve, se quita y se puede volver a poner.

Lleva tres cosas y en este orden: la insignia con el número del nivel, los
puntos que faltan para el siguiente, y —lo único que la hace útil— **el próximo
desbloqueo con lo que falta escrito al lado**. Un premio sorpresa no mueve a
nadie; uno que se ve venir, sí. Los de Pro salen igual, con su etiqueta: a la
vista y deseables, nunca escondidos.

**No lleva `onclick`.** El sitio al que debe llevar es la colección, que
todavía no existe, y antes de inventarle un destino se queda sin ninguno — con
`cursor: default`, para que no finja ser un botón.

Dada de alta donde había que darla: el registro, el suelo de altura, el orden
de fábrica y **los doce acomodos** —tres por cada forma de ventana, aunque los
del teléfono solo llevan orden porque en una columna no hay anchos que repartir—.
Se hizo con un guion a propósito: a mano se olvida uno, y ese fallo no se ve
hasta que alguien aplica justo ese acomodo y su tarjeta se va al fondo.

**Y un fallo cazado midiendo, que no venía de esta tanda pero lo destapó.**
Una tarjeta sin sitio guardado —cualquiera que se añada a la app después de que
alguien haya acomodado su tablero— caía en la esquina de arriba y empujaba
todo lo demás hacia abajo, justo lo que promete no hacer el comentario de
`dashLayout`: «nadie ve su tablero cambiar al actualizar». Ahora se coloca en
la primera fila libre por debajo de lo que ya tiene sitio.

El primer intento de eso fue peor y también se midió: con un centinela de
`f: 9999`, el buscador de hueco encontraba esa fila libre y dejaba la tarjeta
**en la fila 9999 de la cuadrícula**, con 800.000 px de vacío detrás que sí se
podían recorrer. La cuenta buena es el fondo de verdad: `fila + alto` de la
tarjeta más baja. Comprobado sobre un tablero ya acomodado: la nueva cae en la
fila 17, ninguna de las otras se mueve, y el tablero mide 1.576 px.

### 0.7.42 · 30 ago 2026
**El nivel ya se ve.** La insignia del rango aparece en la fila de la cuenta
—en el menú del engrane y en la ficha de «Mi perfil»— con el aro de lo que
llevas del nivel alrededor. Es lo primero que se ve del motor de 0.7.41.

**Es su propio círculo y no cuelga del avatar**, y eso lo decidió Eduardo con
el argumento que lo cierra: el perímetro de la cara tiene que quedar libre para
lo cosmético —hoy lo ocupa el anillo lila de Fundador, mañana un marco que
alguien compre— así que el aro que informa rodea la insignia. **Cada aro
pertenece a su propio objeto** y así no vuelven a chocar. La fila queda con dos
círculos y tres renglones en medio: a la izquierda quién eres, a la derecha por
dónde vas.

Y de paso resuelve el tamaño, que fue lo que lo decidió del todo: colgando del
avatar la insignia solo puede medir 20 px, y el aro deja el dibujo en **11** —
por debajo de los 13 que es el suelo de la iconografía de la app, donde las
tres piezas de un rango empiezan a juntarse—. Como círculo propio mide 30 y el
dibujo respira a 18. Se comparó a tamaño real:
`https://claude.ai/code/artifact/011961aa-54a5-4e6c-8926-17d92d57e70d`

El avatar del menú sube de 38 a 48 para equilibrar la pareja, que es la
proporción que él eligió mirando las dos familias juntas.

Detalles que están así a propósito: **antes del nivel 1 no se dibuja nada** —un
aro vacío se lee como algo roto—, el aro engorda de 2 a 3 píxeles a partir de
40 px de diámetro porque a ese tamaño uno de 2 desaparece, y `.perfil-quien`
estrena `flex: 1` para que la insignia se vaya al otro extremo en vez de
pegarse al correo.

Medido en las dos pantallas y en los dos anchos: insignia de 30 con dibujo de
18, a 12-14 px del borde y a 11-13 del texto, sin desbordes; en un teléfono de
390 px con un correo que ocupa dos renglones sigue en su sitio.

### 0.7.41 · 30 ago 2026
**El motor del nivel de expedición**, que es el nivel de la CUENTA. Todavía no
se ve por ningún lado: es a propósito, primero lo que no se ve. Archivo nuevo,
`js/02b-expedicion.js`, dado de alta en `index.html` y en `ASSETS`.

**La decisión que lo sostiene: los puntos no se guardan, se cuentan.** No hay
ningún contador en `state` y no debe haberlo. El motivo ya estaba escrito en
`js/10-fusion.js` y vale igual aquí —«el XP no se suma a mano: se recalcula
contando los movimientos»—: un contador se rompe al fusionar dos aparatos, y
este número decide qué tienes desbloqueado. Tres cosas salen gratis: **es
retroactivo** (el día que se encienda, cada cuenta ya tiene su nivel, sacado de
meses de datos que ya existen), la sincronía no lo puede inflar ni perder, y no
hay dos verdades que puedan desalinearse.

**Los dos primeros días de cada semana valen 40 puntos; los siguientes, 5.** No
es un adorno: con un valor fijo por día, quien entra dos veces por semana
tardaba **4,4 años** en llegar al último rango y quien entra cinco tardaba 1,7.
Así son 2,3 contra 1,3. Y deja de tener sentido abrir la app diez segundos para
no perder el punto del día. La semana empieza en domingo, igual que la tira de
la racha: dos formas de contar la semana en la misma app se notan en cuanto
alguien compara.

**El nivel de una habilidad cuenta el MÁS ALTO que tuvo, no el de ahora.** El
decaimiento no quita el punto: lo aprendido pasó, y para castigar el abandono
ya está la propia habilidad, que baja. Se reconstruye del historial, que es
donde está todo.

Sin tope, con cada nivel 30 puntos más caro que el anterior y los tres primeros
en rampa (15, 35, 60) para que la primera tarde tenga premio. Todo calibrado
simulando ocho años de uso día por día con tres perfiles, no a ojo.

**Cinco rangos**, que son la cara del nivel y no una colección de trofeos:
Nodo, Enlace, Rama, Trama y Red, en `ICONS`. Ninguno lleva candado — si el
rango es la cara del nivel y el nivel sube para todos, ponerle candado sería
topar el número por la puerta de atrás. **Se topan los premios, nunca el
número.**

Probado con ocho comprobaciones de lógica sobre datos hechos a mano: cinco días
en la misma semana dan 95, el corte de semana cae en domingo, una habilidad que
subió a 900 XP y decayó a 100 sigue contando su nivel 4, y el acumulado hasta
el nivel 10 da 1 475 — el mismo número que la simulación en Python, que es lo
que confirma que el código y la calibración dicen lo mismo.

El número salta a `0.7.41` porque la rama de ambientes tiene apartada la
`0.7.40`, y dos tandas con el mismo `CACHE` dejan a medio mundo con la copia
vieja.

### 0.7.39.4 · 30 ago 2026
La exigencia deja de perderse. Es una sección de Ajustes —**Mi exigencia**— y
por primera vez se puede ver cuál tienes puesta, cambiarla y aplicarla a lo que
ya existe.

**El fallo, que lo cazó Eduardo:** la pregunta 2 del asistente sí hacía algo
—convertía tu respuesta en los `graceDays` y el `decayPerDay` de cada habilidad
que se creaba en ese momento— pero solo una vez. Después desaparecía. Toda
habilidad nueva nacía con 7 y 10 elijas lo que elijas, porque ese par estaba
escrito a mano en el formulario, y había **tres puertas** que ni siquiera
preguntaban: «Empezar de cero», «＋ Crear habilidad» y «Crear una a mano».
Encima no se veía en ningún lado: la única forma de saber qué elegiste era
abrir una habilidad y leer sus dos campos numéricos. O sea que no era una
preferencia tuya, eran datos sueltos por habilidad sin valor por defecto.

**Ahora hay un solo sitio de donde salen los números:** `EXIGENCIAS` en
`js/01-base.js`, con los tres pares que ya usaba el asistente. De ahí beben el
asistente, el formulario y el catálogo. `state.settings.exigencia` guarda la
elección y `exigenciaActual()` la lee tolerando un valor corrupto o de una
versión más nueva, igual que hace `monedaActual()` con la moneda.

**La regla que separa las dos cosas, y conviene no borrarla:** cambiar el
ajuste **no toca ni una habilidad**. Es el valor con el que NACEN las nuevas,
igual que cambiar de moneda no convierte los importes ya escritos. Tocar lo que
ya existe se pide aparte, con un botón que dice cuántas van a cambiar — porque
ahí sí se pisan los números que alguien pudo haber afinado en una habilidad
concreta. Las blindadas no se cuentan ni se tocan: no pierden XP nunca, así que
sus dos números no significan nada.

Y la fila del índice dice cuál tienes puesta —«Tranquilo · 14 días de gracia»—
por la misma razón que la del plan: la queja que trajo todo esto era que no se
veía, y entrar no puede ser la única forma de enterarse.

El número va en el cuarto tramo y no en el tercero por una razón de fuera: la
rama de ambientes ya tiene apartada la `0.7.40`, y dos tandas con el mismo
número dejan a medio mundo con la copia vieja.

### 0.7.39.3 · 30 ago 2026
Dos retoques en las dos primeras pantallas que ve alguien que llega: el cartel
vacío del Resumen deja de ofrecer tres caminos iguales, y las áreas del
asistente enseñan lo que traen dentro.

**«Empezar de cero» baja a enlace.** Eran tres botones del mismo peso en la
pantalla más vacía de la app, y el tercero es justo el que se salta lo único
que ahí enseña algo. No se quita —hay quien no quiere asistentes, y quitarlo
obligaría a pasar por un asistente que crea hasta doce habilidades a quien
venía por un hábito— pero pasa a pesar como lo que es: una salida, no una
opción a la par.

Eso obliga a recalcular el hueco que `.empty .stack` reserva en escritorio,
que no es «tres botones» sino **el cartel más alto de las cinco pantallas**:
existe para que la burbuja caiga al mismo píxel en Resumen, Misiones,
Habilidades, Talentos y Proyectos. El Resumen sigue siendo el más alto, ahora
con 46 + 48 + 20 + 20 = 134 en vez de 162, y el enlace va **dentro** del
`stack` justo para entrar en esa cuenta. Medido: la burbuja cae a 272 px en
las cinco.

El enlace va en `--muted` y no en `--faint`, que sería el tono natural de lo
secundario: sobre el fondo de la página `--faint` da 3,34 sobre 1 de noche y
3,97 de día, las dos por debajo del 4,5 que pide un texto normal. Lo que lo
baja de rango es que mide 13 px, va subrayado y está debajo de dos botones.

**Las áreas pasan a tarjetas horizontales, y con eso dejan de ser una
apuesta a ciegas.** Cada área ya sabía qué tres habilidades iba a crear —lo
dice `ONBOARD_AREAS` desde siempre— y esa lista no se veía por ningún lado:
elegir «Salud y cuerpo» y encontrarse tres líneas nuevas es una sorpresa, y
leer «Ejercicio · Correr · Yoga» antes de tocarla es una decisión. La tarjeta
ancha existe para que quepa esa línea; que además se vea mejor es la
consecuencia, no el motivo.

El icono va en una teja rellena del color del área, y encima **tinta oscura**
(`--sobre-macizo`), que es oscura en los dos modos porque los ocho tonos del
usuario son claros en los dos. Con `--oc-l` —el tono de escribir— el dibujo
se perdía dentro de su propio color. Las columnas salen de `auto-fit` con un
mínimo de 250 px: una por fila en el teléfono y dos desde 540, sin declarar el
corte a mano.

### 0.7.39.2 · 30 ago 2026
Dos retoques de la tanda anterior: los carteles de bienvenida suben un poco y
el bicho de reportar fallos deja de deslizarse al aparecer.

**Los carteles, 24 px más arriba.** Cuadraban bien y aun así se leían hundidos,
y la razón es que el hueco donde se centran arranca 111 px por debajo del
borde, bajo el título de la pantalla: centrarse ahí deja el bloque más abajo
que el centro de lo que se ve. Es justo para lo que existe el centrado
óptico. Con 48 px más de relleno al pie el contenido sube la mitad, y el
título pasa del 43 % al 40 % del alto de la ventana. En una ventana tan baja
que el cartel ya no quepa esto no lo sube: ahí el centrado no actúa y los 48
px solo son aire al final.

**Y el bicho ya no se desliza.**

Con la barra plegada, el botón entraba con un `scale(0.84)` que crecía hasta 1.
Ese gesto se copió del isotipo de arriba cuando el bicho era un icono suelto de
17 px, y ahí no se notaba. Desde que tiene aro lo que crece es un disco de 32,
y esos cinco píxeles de diámetro se leen como un desliz justo cuando el ojo
acaba de llegar ahí. Ahora el disco se queda quieto y se limita a aparecer; el
número de versión, que no lleva caja, conserva su encogido, así que las dos
piezas siguen fundiéndose una en otra.

Medido muestreando la posición cada 16 ms durante todo el paso del ratón: la
caja no se mueve ni un píxel —**un solo valor** de X, de Y y de ancho en las 64
muestras— y su centro coincide exactamente con el de la fila. Antes de esto la
sospecha era una traslación; el `transform-origin` de las dos piezas está en su
propio centro, así que trasladar no podía, y lo que se veía era el tamaño.

### 0.7.40 · 30 ago 2026
El motor de las apariencias y su pantalla, apagados. Norata ya sabe ponerse
otra piel y ya tiene dónde elegirla; nadie la ve todavía.

Es la primera pieza de lo que estaba diseñado y medido en `apariencias/` sin
una sola línea de código: siete ambientes con sus tonos, y la máquina que los
enciende. **Se sube apagado**, detrás de `?apariencia=`, como se probaron los
tonos del modo claro en 0.7.3.1.

Para verlo: `?apariencia=musgo` —o `tinta`, `adobe`, `duna`, `escarcha`,
`marea`— y `?apariencia=casa` para volver. Vive en `sessionStorage`, así que
con la pestaña cerrada desaparece y no se queda pegado como un ajuste. La
pestaña lleva un rótulo fijo recordando que está en modo prueba.

### Un atributo, y no una clase

`<html data-apariencia="musgo">`. Un ambiente y un mundo son EXCLUYENTES —un
mundo declara sus propios colores, así que un ambiente por debajo no se
vería—, y con un atributo el modelo se hace cumplir solo: no puede llevar dos
valores a la vez. El modo claro sigue siendo la clase `claro` y es un eje
aparte: cada ambiente tiene sus dos caras.

### Lo que cambió con la apariencia de casa puesta: nada

Medido, que es lo que vale. La foto de los estilos calculados de las siete
pantallas en los dos modos, antes y después: **25 846 elementos idénticos, cero
huérfanos, y exactamente dos propiedades movidas: el ancho del número de
versión en Ajustes**, que pasó de `0.7.39.1` a `0.7.40` y es más corto.

El resto de lo que el diff señalaba resultó ser contabilidad y no pintura: el
arnés numera cada elemento por su sitio entre los hermanos, así que meter un
`<script>` en el cuerpo y una `<section>` en Ajustes corre de índice a todos
los que van detrás. Comparados contra su número nuevo salen idénticos.

**Y ahí hubo una trampa que merece quedar escrita**, porque la primera versión
de esa comparación decía que 274 propiedades habían cambiado. Emparejaba así:
«usa la clave vieja, y si no existe, prueba la corrida». El problema es que la
clave vieja **sí existe** en la foto nueva — apuntando a otra sección—, así
que nunca llegaba a probar el desplazamiento y comparaba «Almacenamiento»
contra «Administración». Donde algo se corre de sitio hay que usar la clave
corrida SIEMPRE, no como respaldo.

El control también se corrió, porque una prueba que no falla nunca no prueba
nada: dos fotos del mismo código salen idénticas.

### El fallo que salió al medir el modo claro

Escarcha se quedaba **de noche en modo claro**: fondo oscuro con el texto
oscuro encima. Y no era suyo, era del selector.

`html[data-apariencia="x"]` y `html.claro` tienen la **misma especificidad**
—un tipo y un selector simple cada uno—, así que decide el orden de los
archivos, y `ambientes.css` se carga después de `estilos.css`. Los tonos de
noche del ambiente le ganaban a los de día de la casa. Solo se veía en
Escarcha porque es el único cuyo bloque de día no redeclara los neutros: de
día solo mueve el acento y hereda el resto. Los otros seis lo tapaban
escribiendo sus propios fondos.

Se arregla con `html:not(.claro)[data-apariencia="x"]` en el bloque de noche.
Así ese bloque deja de existir de día y la casa vuelve a mandar, que es lo que
el archivo prometía desde su primera línea: **un ambiente a medias cae en los
colores de la casa y no en el vacío.**

### `--tipo-titulo-escala`, que no existía

Una cara de titular puede ser un 29% más ancha que Outfit —Consola lo es—, y
en una pantalla de 320 px la cabecera solo deja 266 px para «Árbol de
talentos», que en Outfit ocupa 236,5. Sin una escala declarable, una
apariencia con letra ancha desborda el titular y no hay forma de rescatarla
sin tocar reglas de la app — que es justo lo que una apariencia no puede
hacer. La casa se queda en 1, así que hoy no mueve nada.

### La pantalla, en Ajustes

Una sección nueva, **Apariencia**, entre «Mis módulos» y «Mi almacenamiento».
Dentro de Ajustes y no en una pantalla nueva ni en una pestaña de la barra:
una tienda con su propio botón abajo es un mostrador en la recámara. Y la app
ya tenía el sitio natural — el interruptor de sol y luna vive en el índice de
Ajustes, y elegir ambiente es la misma familia de decisión.

**El sol y la luna no se movieron.** Están dos centímetros más arriba en la
misma pantalla, y sacarlos de su sitio para hacerle hueco a esto sería
cobrarle el cambio a quien no viene a comprar.

**Cada muestra es la app en pequeño** —fondo, tarjeta y acento— y no un
círculo de color: un ambiente cambia tres cosas y un círculo enseña una. Los
tonos de las muestras se generan de los mismos datos que los ambientes de
verdad, así que no pueden discrepar el día que cambie uno.

**Los que no tienes se ven enteros y apagados, con su nivel escrito al lado.**
No tapados y no en gris: enseñar lo que se puede tener es la mitad de la razón
para quererlo, y el nivel al lado es lo que convierte «no lo tienes» en «lo
tendrás». Los de Pro dicen con qué plan vienen, y tocarlos contesta en vez de
no hacer nada — un botón que no responde parece roto.

### Lo que este archivo NO hace

Ningún ambiente se puede desbloquear: el **nivel de expedición** no existe,
así que un ambiente que se desbloquea no sabe cuándo se desbloqueó. Por eso la
sección entera va detrás de `?apariencia=` y no es de todos todavía — enseñar
cinco premios que nadie puede ganarse los regala antes de que la escalera
exista. La puerta está escrita en `AMBIENTES` con el nivel de cada uno, y el
día que haya cifra se cambia `APARIENCIA_PUBLICA` a `true` y ya está.

Tampoco hay **mundos** en la pantalla, y es a propósito: todavía no existe
ninguno construido, y una lista de quince cosas que no se pueden encender es
justo lo que la Tanda 1 está para quitar.

Y los **mundos** no van en `ASSETS` y no deben ir: esa es la lista de la
instalación, y meterlos le haría bajar más de un mega a quien no va a encender
ninguno. `ambientes.css` sí va —seis kilobytes entre los siete—, porque
cualquiera puede desbloquear uno.

### 0.7.39.1 · 30 ago 2026
La fecha de debajo de Ajustes dice el día que salió.

Decía 29 de agosto, que es el día en que se empezó la tanda; salió el 30. La
fecha está ahí para contestar «¿esto que estoy viendo es lo último?», y para eso
sirve la de publicación, no la del primer archivo tocado.

**Y por eso lleva número propio en vez de ser una corrección callada.** Cambiar
un rótulo es cambiar `js/01-base.js`, que está en la lista de la instalación, y
desde 0.7.38 el único camino por el que una versión llega a un aparato es que
cambie el `CACHE` de `sw.js`. Sin subir el número, quien ya tuviera 0.7.39
instalada se quedaría con «29 ago» para siempre y quien la instalara después
vería «30 ago»: la misma versión diciendo dos cosas distintas. La entrada de
arriba también pasa a decir 30.

### 0.7.39 · 30 ago 2026
La app aprende qué forma tiene la ventana, los cinco carteles de bienvenida
dejan de bailar, el bicho de reportar fallos se ve igual con la barra plegada
que desplegada, y la tarjeta de la racha reparte su sitio donde toca.

### Los cinco carteles, a la misma altura

Al pasar de Resumen a Habilidades la burbuja daba un salto de **68 px** —de
311 a 379 en una ventana de 957— y se nota, porque el ojo no se ancla en el
centro del cartel, que sí coincidía, sino en la burbuja y el título. Dos
causas, las dos medidas:

- **Lo que cuelga debajo mueve la cabeza.** Resumen ofrece tres botones,
  Misiones y Habilidades dos, Talentos y Proyectos uno; y el párrafo tiene
  tres renglones en cuatro pantallas y dos en Habilidades. Centrando el
  bloque entero, cuanto más cuelga más arriba empieza. Ahora el cartel más
  alto marca el sitio y los otros cuatro le reservan el mismo hueco: la
  burbuja cae al mismo píxel en las cinco y lo que sobra queda al pie, sobre
  fondo vacío, donde nadie lo mide.
- **Habilidades empezaba 28 px más abajo que las demás.** Sin habilidades no
  hay nada que reordenar ni que filtrar, pero las dos filas vacías seguían
  ocupando: 10 px de margen la de herramientas y 18 de relleno la de
  categorías. Ahora desaparecen cuando están vacías, igual que ya hacía la
  línea de la pista.

El resultado es que **suben**, que es lo que pedía el encargo: el título queda
en el 43 % del alto de la ventana en vez de entre el 44 y el 53 % según la
pantalla. Medido en 1867×957, 1366×657, 1024×700, 1024×1300 y 1366×480, en los
dos modos: **salto de 0 px** en todas. En el teléfono no se toca nada —ahí el
cartel no se centra en ningún hueco, lo empuja el contenido—.

### El bicho enseña su círculo también con la barra plegada

Desplegada, «Reportar un fallo» es un círculo con borde: se ve que se puede
pulsar. Plegada, una regla le quitaba el fondo y el borde a propósito —el
argumento era que ahí la bolita ES la fila entera y un círculo dentro de otra
caja se leería como un botón dentro de otro— y el bicho quedaba flotando
sobre el fondo, con pinta de dibujo y no de botón. La misma cosa no puede
verse de dos maneras según cómo tengas la barra.

Ahora lleva su círculo en los dos estados: 32 × 32 centrados en la fila, con
el mismo fondo y el mismo aro, y el aro se enciende en luciérnaga con el
icono al pasar el ratón (plegada quien recibe el ratón es la fila, así que el
aro se quedaba gris mientras el bicho ya era amarillo). La fila plegada pasa
de 34 a 40 px de alto para que al círculo le quede aire en vez de rozar los
bordes. El gesto no cambia: el número de versión y el bicho siguen ocupando
la misma caja y fundiéndose uno en otro.

### La forma de la ventana

Hasta ahora solo había dos: teléfono por debajo de 900 px y escritorio por
encima. Entre las dos caben todas las laptops y todas las tabletas, y ahí es
donde estaban los fallos — ninguno se veía en un monitor, que es donde se
prueba siempre.

**Tres cosas se salían de la pantalla, y una se comía el calendario.**

- **El encabezado de las cuatro secciones se cortaba** entre 900 y 1300 px de
  ventana. Se puso en una fila a los 900, pero el ancho que decide no es el de
  la ventana sino el que queda después de la barra lateral: en una tableta
  apaisada de 1024 quedan 644 y la fila pide 922. No se partía en dos, se
  cortaba, y el recuadro del foco y el botón «Ver el informe» desaparecían en
  Misiones, Habilidades, Talentos y Proyectos a la vez. Ahora envuelve: cuando
  no caben los cuatro bloques, los dos últimos bajan a un segundo renglón.
- **Las tres fichas empujaban la página de lado** entre 900 y 917 px. La ficha
  mide 360 px fijos, así que a la columna de al lado le quedaban 186 para una
  rejilla de datos que no baja de 252. La ficha en dos columnas ahora empieza a
  los 1000, que es donde de verdad caben las dos.
- **La tarjeta de la racha perdía cinco días de calendario en toda tableta.**
  Su alto salía de una tabla —«una columna, cinco filas»— escrita dando por
  hecho que una columna son unos 470 px. En un iPad son 333: la tarjeta cae por
  debajo del umbral de su propio `@container`, se apila y pide 518 px. Recibía
  376. Ahora el alto se decide midiendo el ancho de verdad contra el mismo 430
  que usa el CSS.
- **El Resumen vacío se quedaba metido en una fila de 56 px** y se salía por
  abajo: ocupaba 429 y decía medir 155.

La tableta en VERTICAL, por debajo de 900 px, se queda con el diseño del
teléfono, y eso no cambia: de 768 px no se puede sacar una barra lateral de
246 sin dejar menos sitio que en un teléfono. Se probó ensancharle la columna
de 560 a 700 px y se descartó por medida: el Resumen bajaba 21 px de alto,
Habilidades y Misiones ni uno, y la racha se veía idéntica. Lo único que
crecía era el largo del renglón.

**Y el Resumen tiene acomodos para cada forma.** Los tres de siempre están
escritos con las alturas de un monitor, y en una laptop de 1366 × 657 salían
2,6 pantallas de tablero —3,3 con «Panorama»— y con tarjetas cortadas. Ahora hay tres listas: la de
siempre para ventana alta, una de **laptop** —columnas anchas y poco alto— y
una de **tableta** —columnas de menos de 430 px, donde la racha solo se ve
entera a lo ancho—. Los tres nombres se repiten a propósito: elegir «Mirador»
tiene que significar lo mismo en las tres pantallas; lo que no puede ser igual
son las alturas con las que se consigue. La forma se guarda junto al acomodo,
para que el botón encendido no señale un reparto que ya no está.

**Y «encajar en pantalla» dejó de recortar.** Su suelo era una tabla fija, y en
una ventana baja eso no encogía: destrozaba —«Misiones de hoy» se quedaba con
283 px de lista cortada a cambio de una pantalla que no se ganaba igual—. Ahora
el suelo es lo que la tarjeta MIDE que necesita, así que quita el aire que
sobra y se para donde empezaría a esconder algo. En un monitor de 1920 × 950
el acomodo «Columnas» cabe ahora entero en una pantalla —0,94— y ninguno de
los tres corta nada.

Medido en trece proporciones —900×620, 1024×700, 1180×720, 1280×620, 1366×657,
1440×790, 1512×860, 1920×950, 2560×1300, 768×1024, 820×1100, 390×844 y
360×640— por once pantallas cada una, en modo oscuro y en modo claro, y
aplicando los tres acomodos en cada una: cero desbordes de lado y cero
tarjetas cortadas. También
con el perfil vacío, con la ventana a 480 px de alto y con nombres de cien
letras.

Quedaba uno fuera, y no era de proporciones: **el rótulo de una caja del árbol
de Talentos se salía por los lados con un nombre largo**, igual en todos los
tamaños. Vive en el lienzo, y se arregla más abajo.

### La racha reparte su sitio donde toca

En una tarjeta ancha siempre sobra espacio, y lo que decide si se ve bien no es
cuánto sobra sino DÓNDE cae. Caía en el peor sitio posible. Medido en la tarjeta
de tres columnas, 1710 px de ancho:

| | antes | ahora |
| --- | --- | --- |
| margen izquierdo | 18 | 344 |
| hueco entre el número y «Próximo hito» | **460** | **72** |
| junta entre «Próximo hito» y el calendario | **28** | **191** |

Estaba justo del revés. La columna del número era flexible y medía mil píxeles
con ciento treinta y cinco de contenido flotando en medio, así que el hueco
quedaba ENTRE dos bloques —que se lee como algo roto— mientras la columna de
texto se pegaba a la rejilla del calendario. El mismo hueco en el borde se lee
como margen, que es lo que es.

Las juntas dejan de ser un `gap` igual para todas y pasan a ser columnas propias
de una rejilla, con tres reglas:

1. **Cada bloque se apoya en el siguiente.** El número ya no flota en mitad de
   su columna: se va al final de ella y toca la junta corta. Conserva su
   alineación de siempre —todo centrado entre sí—; lo único que cambia es dónde
   se apoya el grupo.
2. **La junta contra el calendario es la ancha.** Una rejilla densa y una
   columna de texto piden más aire entre sí que dos bloques de texto, o el texto
   se lee como el pie de la rejilla. Y ahí cae la luna del dibujo, que hasta
   ahora quedaba tapada por la cabecera del mes.
3. **Margen de fuera > junta ancha > junta corta.** Es el orden de cualquier
   página impresa.

Y el número crece de 34 a 46 px cuando hay sitio: un bloque pequeño rodeado de
espacio se lee como un hueco por mucho que se le deslice. Lo que no ocupa su
sitio no se arregla moviéndolo, se arregla escalándolo.

**Dos trampas por el camino, las dos medidas.** La primera: en el marcado la
tercera columna va DESPUÉS del calendario, así que el colocador automático de la
rejilla llegaba a ella con el cursor pasado el último hueco de la fila y la
mandaba a una segunda fila — 87 px desbordados por abajo. Se arregla escribiendo
la fila, no reordenando el marcado, que en los otros dos acomodos es el bueno.
La segunda: los dos huecos crecen con la tarjeta, y en un monitor de 2560 salían
596 px de sangría y 415 de junta, tres piezas que ya no se hablan. Hay tope, y
pasado el tope lo que sobra se reparte por los dos bordes.

**Y un umbral que estaba escrito dos veces.** El JavaScript decidía si había
tercera columna contando columnas del tablero y el CSS repartía el sitio
contando píxeles. No son lo mismo: una racha de DOS columnas en pantalla grande
mide 1510 px, o sea que se repartía como si hubiera tres bloques y solo había
dos. De ahí medio metro de hueco. Ahora la tercera columna se escribe siempre y
la enciende el ancho real, con un único umbral.

Medido de 300 a 2400 px de tarjeta, en los tres anchos del tablero, en teléfono,
en los dos modos y con la frase corta y la larga: sin desbordes, sin segunda
fila, y el alto sigue sin poder arrastrarse.

### Un rótulo se mide, no se cuenta

Es el que quedaba fuera en la lista de arriba. **El nombre de una caja del ático
se salía por los lados**, y la causa era contar letras en vez de medirlas: se
permitían veinte caracteres por renglón, pero veinte caracteres miden 55 px
escritos con íes y 180 con emes. «EQUIPO FOTOGRÁFICO» son dieciocho y **119 px
dentro de una caja de 104**, colgando siete por cada lado. Con el nombre por
defecto —«3º trim. 2026»— no se notaba nunca; con uno escrito a mano, sí.

Ahora el texto se mide de verdad antes de partirlo, con un lienzo de mapa de
bits aunque el dibujo sea SVG: misma familia y mismo tamaño, y a cambio no hay
que meter nada en la página ni esperar a que se recalcule el diseño. Una palabra
más ancha que el renglón se recorta letra a letra hasta que ella y sus puntos
suspensivos caben, y se queda sola en su renglón — pegarle la palabra siguiente
detrás de unos puntos suspensivos se lee como una errata, no como un recorte.

El tamaño de letra se decide al partir y no contando renglones después: un
nombre puede caber en uno solo a 10,5 y no a 12, y preguntando «¿es una línea?»
al final se le volvía a poner el grande y se salía por la misma puerta.

Probado con seis nombres —el corto, el largo, veinte emes seguidas, una palabra
impronunciable de una pieza—: los seis caben, y el más ancho ocupa 85 de los
104. Los rótulos de los talentos no se tocan: esos no viven dentro de ninguna
caja, y medidos uno a uno no se pisan entre ellos ni se salen del lienzo.

### 0.7.38 · 29 ago 2026
Abrir la app deja de esperar a la red.

Se hace ANTES de que existan las apariencias y a propósito: una apariencia con
carácter pesa entre 150 y 250 KB de tipografía y texturas, y con lo que había
eso se habría vuelto a bajar cada mañana. La apariencia bonita habría sido la
razón por la que la app tarda.

**Lo que pasaba.** `sw.js` pedía a la RED PRIMERO para todo menos la
tipografía, y con `no-store`, así que no pasaba ni por la caché del navegador.
Medido contando las peticiones en el servidor, con TLS puesto —el service
worker solo se registra en `https:`, así que sin eso no se estaba midiendo su
camino y la segunda visita salía falsamente rápida—:

| Al abrir | ¿manda el sw? | peticiones |
| --- | --- | --- |
| 1ª vez en la vida | no | 39 |
| la reabro ahora mismo | sí | 23 |
| a la mañana siguiente | sí | 24 |
| a la otra mañana | sí | 24 |

Nunca bajaba de ahí: **460 KB comprimidos, enteros, antes de que se viera
nada, todos los días.** La mitad de ese peso son los comentarios del código
(209 de 412 KB), y no se van a quitar: son lo que impide deshacer por error
algo que costó horas, y quitarlos pediría un paso de compilación que esta app
no tiene a propósito. Con esto, se pagan una vez en la vida en vez de cada día.

**Lo que hay ahora.** De la copia primero. En el mismo laboratorio, a 1,2 Mbps:

| | antes | ahora |
| --- | --- | --- |
| abrir un día cualquiera | 24 peticiones · 1 570 ms | **1 petición · 120 ms** |

Con el CPU frenado cuatro veces —un teléfono de gama media— la app queda
utilizable en **435 ms**, y de ahí solo 12-17 ms son JavaScript. La red era
todo el problema.

**Y no se pierde la red de seguridad.** El aviso de que hay versión nueva no
venía de re-descargar la app: viene de `sw.js`, que el navegador vuelve a pedir
en CADA navegación y sin pasar por su caché. Si cambió —y cambia siempre,
porque `CACHE` lleva el número de versión— se instala el nuevo, se baja todo
por detrás, se activa y se avisa a la app con un toast que ofrece recargar.
Probado de punta a punta: se publica una versión con alguien ya instalado, la
1ª apertura enseña la anterior, la 2ª ya es la nueva, y llega **un** aviso.

Lo único que se cede es esa primera apertura. Es exactamente el precio que
`CLAUDE.md` decía que se pagaba a conciencia, cobrado al revés.

**Tres cosas que se arreglaron por el camino, ninguna visible:**

- **`install` baja copias frescas** (`cache: "reload"` en cada una). Sin eso el
  `addAll` puede llenar la caché NUEVA con los bytes viejos que el navegador
  tuviera guardados, y entonces subir la versión no cambia nada de lo que se ve.
- **Cada worker sirve solo su propia caché.** `caches.match` a secas busca en
  todas las que haya, y mientras se instala una versión nueva conviven dos: el
  worker viejo podía servir un archivo del nuevo y otro del viejo en la misma
  carga. Una app a medias entre dos versiones es peor que una app vieja.
- **El aviso ya no salta en una instalación recién hecha.** Se miraba si había
  cachés, pero para cuando corre `activate` la de esta versión ya existe —la
  crea `install`—, así que a quien acababa de entrar se le decía que su app
  estaba anticuada.

**El susto de la publicación a medias no puede repetirse**, y es mejor que
antes: durante ese minuto no se pide nada a la red, y si el `addAll` de la
instalación pilla un 404, la instalación falla ENTERA y se sigue con la copia
buena. Fallar así es lo correcto.

**`defer` en los veinte `<script>`** (y en los seis de la puerta). Vale unos
68 ms en la primera carga y nada en las demás —ya estaban al final del
cuerpo—, pero no cuesta nada y deja de bloquear el análisis del HTML. Nada
depende de `readyState` ni de `DOMContentLoaded`, así que no cambia el orden de
nada. Comprobado con la foto de estilos: 25 480 elementos, idénticos.

**Lo que NO se hizo, y por qué.** Estaba previsto bajar tarde lo que no se ve
al abrir —el lienzo del árbol, los informes, el panel, los planes: unos 119 KB,
el 26% del arranque—. Medido después de lo de arriba, compilar y ejecutar TODO
el JavaScript cuesta 12-17 ms. Partir archivos que se pasan variables globales
entre ellos, con ese riesgo, para ganar milisegundos, sería mal negocio. Queda
apuntado por si algún día la primera carga vuelve a importar.

### ⚠️ Lo que esto endurece

Subir el número al tocar un archivo de `ASSETS` ya era obligatorio. **Ahora es
lo único que hace que una versión llegue.** Antes, olvidarlo servía una copia
vieja pero la red acababa trayendo los archivos nuevos. Ahora, si `CACHE` no
cambia, el aparato instalado **no vuelve a pedir nada nunca**: se queda en esa
versión para siempre. Los cuatro sitios de «Al subir la versión» dejaron de ser
una buena práctica y son el mecanismo.

### 0.7.37 · 28 ago 2026
El material de la app deja de estar escrito a mano.

Esto no se ve. Es el camino por el que van a llegar las apariencias, y se
adelanta a propósito: hacerlo con un tema encima habría sido cambiar dos cosas
a la vez y no saber cuál rompió qué.

**Lo que había.** El color estaba resuelto desde el modo claro: ninguno se
escribe suelto, todos salen de `:root`, y cambiarlos cambia la app entera. El
MATERIAL no lo estaba. En los 300 KB de `css/estilos.css` había **un solo
`url(...)`, y era la tipografía**: la app no tenía ninguna noción de
superficie. Todo era relleno plano con las esquinas redondeadas a mano —221
radios escritos uno por uno—, 142 bordes de un píxel y ni un sitio donde
agarrar nada de eso.

Con eso, una apariencia solo podía recolorear. Y un recoloreado no es una
apariencia: es la misma app pintada de otro color.

**Lo que hay ahora.** Una segunda familia de variables al lado de la de los
colores, con los valores por defecto EXACTAMENTE iguales a los que ya estaban
sueltos:

- **La forma.** Cuatro nombres para lo que era el mismo `999px`, porque son
  cuatro cosas distintas: `--r-redondo` (el aro de marcar una misión, los
  puntos), `--r-barra` (los carriles), `--r-pastilla` y `--r-boton`. Y la
  escala de las superficies, `--r-grande` a `--r-micro`. Encima, `--r-factor`:
  una apariencia forjada pone `0` y **el 79% de las esquinas de la app se
  endereza en una línea** — medido: de 114 esquinas redondas quedan 24. Los
  círculos NO pasan por el factor y siguen redondos, que era justo el motivo
  de separarlos: con un solo nombre para los cuatro, cuadrar las pastillas
  cuadraba también el círculo de marcar una misión, y eso ya no es una
  apariencia, es otra app.
- **La superficie.** `--sup-tarjeta`, `--sup-panel`, `--sup-pagina` y dos más.
  El color de un fondo y el material de ese fondo no son lo mismo y hasta hoy
  eran la misma variable: `--card` se usa también en bordes y en `color-mix`,
  donde una textura no cabe. Ahora una apariencia escribe
  `--sup-tarjeta: url(piedra.webp) center/240px, #241b14` y la textura llega a
  **100 elementos** sin tocar una regla.
- **El marco.** `--marco-tarjeta` y `--borde-tarjeta`, en las 24 reglas que son
  una tarjeta de verdad. Un borde de un píxel es lo que tiene una app de hoy;
  una pieza forjada tiene un marco con esquinas, y eso son `border-image` y un
  borde ancho debajo — las dos cosas, porque con la imagen puesta y el borde en
  un píxel no se ve nada. Con la ranura llena, **50 piezas** se enmarcan.
- **La letra.** `--tipo-titulo` y `--tipo-cifra`. Antes solo se podía cambiar
  la tipografía entera, texto corrido incluido, que es donde una display se
  vuelve ilegible. Los títulos son `h1/h2/h3`; una cifra es lo que ya llevaba
  `tabular-nums`, así que la definición no se inventó: ya estaba en el archivo.
- **El movimiento.** `--dur-corta`, `--dur-media`, `--curva` y
  `--curva-rebote`. Una app ligera sale sin inercia; una pesada frena al llegar.

**Cómo se comprobó que no se rompió nada.** Con el panel del navegador midiendo
el DOM, que es como se verifica aquí. Una foto de los estilos calculados de
**24 326 elementos** —siete pantallas, los dos modos, con el ejemplo completo
sembrado— antes y después. Dos fotos de la app sin tocar salen idénticas, y
mover una sola esquina un píxel se detecta 106 veces: la red tiene la
sensibilidad que hace falta para que un «no cambió nada» signifique algo.

Resultado: **de 24 326 elementos, cambiaron 10.** Y son a propósito.

**Los 10 que sí se movieron, que además son un fallo que llevaba ahí desde
siempre.** Dos reglas usaban `border-radius: var(--r-md)` con `--r-md` sin
declarar en ninguna parte —el hueco de una columna vacía y el contorno al
reacomodar el tablero—. Un `var(...)` sin valor ni respaldo no hereda: invalida
la declaración entera, así que esas dos esquinas llevaban en cuadrado sin que
nadie lo hubiera pedido, y nadie lo vio porque un borde punteado cuadrado no
parece un error. Al declarar la variable se enderezan.

**Lo que se queda escrito suelto, dicho para que nadie lo dé por hecho:** 63 de
los 221 radios siguen a mano. Son los sueltos de verdad —una esquina interior
de 3 px, un medio redondeo donde algo se pega a otra cosa— y las siluetas
giradas de las burbujas. Ninguno lo alcanza el factor, así que una apariencia
que los quiera tiene que ir a por ellos con sus propias reglas.

### 0.7.36.1 · 28 ago 2026
Las pantallas vacías dejan de terminar a media altura.

Las cinco —Resumen, Misiones, Habilidades, Talentos y Proyectos— ocupaban 54vh
y centraban su contenido ahí dentro, así que el bloque terminaba a media
pantalla y debajo quedaban trescientos píxeles de nada: la pantalla se leía
vacía por abajo en vez de centrada. Ahora ocupan el hueco libre de verdad
—todo el alto menos los 111 px del título y un respiro al pie— y su contenido
queda en mitad de lo que se ve. Medido a 900 y a 970 de alto: 39 píxeles de
sobra abajo en vez de 303.

De paso, la comprobación que pedía el encargo: **horizontalmente ya estaban
centradas las cinco**, con desviación cero respecto de su columna de
contenido. Lo único que estaba descuadrado era el alto.

### 0.7.36 · 28 ago 2026
La racha dice a dónde va y de qué está hecha.

**«Los últimos meses» se va, y con razón.** Eran seis renglones con los días
activos de cada mes; Eduardo los leyó y dijo que no le decían nada, y mirándolo
con esa pregunta encima la tenía: es una tabla que casi siempre son ceros o
números parecidos, no contesta nada que se pueda hacer hoy, y compararte con tu
marzo no cambia tu jueves. En su sitio van las dos cosas que sí importan de una
racha, y las dos son de ahora:

- **A dónde va.** Norata ya celebra hitos de racha —3, 7, 14, 30…— pero el
  número de la tarjeta no decía nunca cuál viene ni cuánto falta: **el premio
  existía y era invisible.** Ahora se ve el siguiente, lo recorrido desde el
  anterior y «te faltan 2 días». Sale de `HITOS_RACHA`, la misma lista que
  dispara la celebración, así que la tarjeta y el festejo no pueden decir cosas
  distintas.
- **De qué está hecha.** Casi todas las rachas largas se sostienen sobre una o
  dos cosas concretas. Ahora se nombran, con sus días: «Caminar 20 minutos ·
  18». Es lo único de esta tarjeta que sirve para decidir algo — si tu racha
  vive de una sola misión, ya sabes qué proteger. Se cuenta en **días** y no en
  veces (una misión cumplida tres veces el martes sostiene un día, no tres) y
  sobre los últimos treinta, no sobre la racha viva: con una racha de tres días
  saldrían tres empates de uno.

**El acomodo de tres columnas, reordenado:** identidad, luego lo que sostiene
la racha, y el calendario al final. El calendario es la pieza más grande y la
más densa, y en el centro partía la tarjeta en dos mitades que no se hablaban.
El orden lo pone el CSS y no el marcado, para no tener que mover la tercera
columna también en los otros dos acomodos.

**Y la identidad va centrada en su columna**, en dos y en tres. Alineada a la
izquierda se quedaba pegada a la esquina con todo el hueco a su derecha, y en
una tarjeta que es sobre todo un calendario eso se leía como un descuido.

**El fallo del tirón, arreglado de raíz.** La tarjeta tenía alto automático y
un suelo de 252 px, así que cuando se le asignaba menos hueco —mientras se
arrastra el asa de tamaño— **crecía por fuera de su hueco y se quedaba montada
encima de la de abajo**. Ahora llena su hueco exacto y lo que no cabe se
recorta, con el fundido que ya usa cualquier otra tarjeta del tablero.
Comprobado forzando un hueco de dos filas: la tarjeta se queda dentro.

### 0.7.35.1 · 28 ago 2026
El acomodo se mide en píxeles, y a esa hora te llamamos por tu nombre.

**«Una columna» no quiere decir «estrecha», y ese era el error de fondo.** El
acomodo de 0.7.35 se decidía por el número de columnas del tablero, así que la
misma etiqueta describía dos cosas muy distintas: una columna en escritorio son
unos 470 px —sitio de sobra para poner la identidad al lado del mes— y en el
teléfono son 340, donde no cabe ninguno. Resultado: una tarjeta estrecha en la
computadora se apilaba y acaparaba media pantalla de alto.

Ahora manda el ancho real de la tarjeta, con `@container`, que es exactamente
lo que hace falta aquí y no una consulta de ventana: dos tarjetas de la misma
pantalla pueden medir la mitad una que la otra.

- Por debajo de 430 px, apilada y con la casilla topada a 44 —el caso del
  teléfono—.
- A partir de 430, los dos bloques lado a lado con casillas de 30. Es lo que
  devuelve la tarjeta de una columna a **cinco filas** de alto en vez de nueve,
  que es como estaba antes de todo esto y estaba bien.
- A partir de 760, las casillas vuelven a 42.
- A partir de 1150, la tercera columna con los últimos meses.

**Y el tirón para cambiar el tamaño deja de mentir.** La racha decide su alto
por su ancho, pero el arrastre seguía dejando estirarla hacia abajo y al soltar
volvía de golpe a su sitio: el tirón funcionaba, la tarjeta no obedecía, y eso
no se lee como una regla sino como algo roto. Ahora el alto sigue al ancho
mientras se arrastra, así que lo que se ve es lo que se guarda.

**El saludo de madrugada, otra vez.** Los dos intentos fallaron por el mismo
sitio: «trasnochador» le pone género a quien lee, y «madrugada» acaba saludando
al reloj. A esa hora se usa lo único que siempre es correcto: **su nombre** —el
apodo si lo puso, y si no el primero de su nombre, que es la misma respuesta
que usan los correos y el menú de la cuenta—. Sin cuenta no hay nombre, y
entonces «buenas noches», que a las cuatro de la mañana es lo que dice
cualquiera en México.

### 0.7.35 · 28 ago 2026
La racha sabe de qué ancho es, y el alto deja de ser una decisión.

**Un acomodo por cada ancho.** La tarjeta puede ocupar una, dos o tres columnas
del tablero, y hasta ahora estiraba el mismo reparto en las tres: o el
calendario ahogado o media tarjeta de cielo vacío.

- **De una columna**, todo apilado y el calendario a lo ancho, con la casilla
  topada a 56 px —sin tope, una columna ancha lo convertía en seis filas de
  ladrillos, que es el mismo fallo que ya mordió una vez—.
- **De dos**, la identidad a la izquierda y el mes a la derecha.
- **De tres**, se abre una tercera columna con **los últimos seis meses**: un
  renglón por mes con sus días activos y su barra. Es la pregunta que sigue
  naturalmente a la racha —¿voy mejorando mes a mes?— y es lo que hace que
  agrandar la tarjeta dé algo más que aire.

El ancho llega en `data-ancho`, que escribe el propio tablero al dibujar la
pieza. Se lee del contenedor y no de la ventana a propósito: la misma pantalla
de 1700 px puede tener esta tarjeta de una columna o de tres, y una consulta de
ventana no sabe distinguirlas.

**El alto ya no se elige: sale del ancho.** Nueve filas apilada, seis en dos o
en tres columnas — medido con el peor mes posible, uno de seis semanas como
agosto de 2026. Estirarla hacia abajo solo añadía cielo vacío, que es el
problema del que venimos. Se aplica al leer y al escribir, así que un tablero
guardado con la altura vieja se corrige solo.

**Y el cuerpo va centrado en vertical.** La tarjeta mide un número entero de
filas de la rejilla, así que casi nunca cuadra al píxel con lo que lleva
dentro; pegado arriba, ese sobrante se acumulaba abajo y se leía como un
agujero. Repartido, se lee como el aire de la tarjeta: 60 px arriba y 60 abajo
en vez de 0 y 84.

- **Fuera «mejor: 5».** La gracia está en la racha que tienes viva, no en una
  que ya se rompió: al lado del número de hoy, el récord viejo solo puede hacer
  dos cosas, y las dos sobran — recordarte que ya lo hiciste mejor, o encogerse
  cuando el de hoy lo supera.
- **El calendario dice el año.** Lo preguntó Eduardo y no había ninguna razón
  para no ponerlo: sin él, un mes suelto de treinta y un días que empieza en
  jueves puede ser perfectamente el de hace tres años.
- **Y el saludo de madrugada saluda a la HORA y no a la persona.**
  «Trasnochador» le ponía género a quien lee —y una «a» detrás no lo arregla,
  lo alarga— además de sonar a reproche amable. Ahora dice **«Hola,
  madrugada»**: la hora no tiene género, y a las cuatro de la mañana, con un
  cielo estrellado de fondo, sí hay algo bonito que decir.
- Y una tarjeta guardada de tres columnas ya no llega al teléfono diciendo que
  es de tres: el ancho se topa con las columnas que hay de verdad.

### 0.7.34 · 28 ago 2026
La racha se rehace: el mes al centro, con sus fechas escritas.

La tarjeta estaba desaprovechada y se veía: media tarjeta de cielo vacío
arriba, el contenido apretado contra el borde de abajo y el mes arrinconado en
una esquina. Eduardo lo comparó con la pantalla de racha de Duolingo, que es la
referencia obvia del género, y la pregunta que salió de ahí no fue cómo
copiarla sino **qué hace bien: el mes entero es la superficie que hace volver,
no el número.** Ver el mes llenándose es lo que engancha; el número solo lo
resume.

- **El mes pasa al centro y con sus fechas escritas.** Es primo del calendario
  de los informes pero no el mismo, y la diferencia lo cambia todo: en un
  informe el calendario es un patrón que se mira de lejos y las fechas sobran;
  en la racha se mira de cerca, una casilla es un día concreto de tu semana, y
  sin el número hay que contarlas con el dedo.
- **La tarjeta se reparte en dos columnas** en cuanto hay sitio: a la izquierda
  quién eres hoy —la llama, la racha, lo que llevas de semana y de mes—, a la
  derecha el mes. Por debajo de 640 px se apilan y el calendario se lleva el
  ancho entero, que es donde peor se veía.
- **Y una frase que pide sin asustar**: «Hoy ya cuenta» cuando ya cuenta, y
  «Hoy todavía no cuenta. Cualquier registro la mantiene viva» cuando falta.
  Dice qué falta y con qué se resuelve, nunca cuánto vas a perder.

**Lo que NO se copia, y es a propósito:** ni las cápsulas de colores por
semana, ni los congeladores, ni las flechas para pasear por meses viejos, ni el
susto de «te quedan 2 días para recuperar tu racha». Un aviso en Norata informa
y da la salida; no mete prisa. Y un día sin actividad se queda en el carril, sin
cruz ni rojo: un mes marcado de fallos es un mes que no se quiere volver a
abrir.

**Se va la tira de siete días con sus palomitas.** El mes la contiene entera, y
tener las dos era decir lo mismo dos veces en la misma tarjeta —que es justo lo
que dejaba el cielo vacío arriba—. Lo que hacía falta de ella, «cómo voy esta
semana», queda dicho en una cifra y en la banda que marca la semana en curso
dentro del calendario. Sus reglas de CSS se borran también: no dibujaban nada.

**Y el fallo de fondo que lo explicaba todo.** `.scene-card` mide 252 px fijos
y pone su cuerpo en absoluto pegado abajo: nació para una escena decorativa con
un pie de dos líneas, y el cielo vacío de arriba era el dibujo. Con el mes
dentro dejó de servir —la rejilla medía 259 px en una caja de 252 y se salía
por abajo sin que nada lo dijera—. Ahora la tarjeta crece con lo que lleva
dentro, que es el mismo arreglo que ya tenía `.sec-hero`.

Medido a 1280, 375 y 320: el calendario cabe entero en los tres, casillas de
42, 40 y 32 px, y ninguna página se desborda de lado. **Quien tenga el tablero
acomodado a mano verá la tarjeta con el fundido de abajo hasta que la estire.**

### 0.7.33.2 · 28 ago 2026
La gráfica encoge y sus cifras bajan al pie.

- **Las cifras pasan de encima del dibujo a debajo.** Estuvieron arriba un rato
  y el orden se lee peor de lo que parecía sobre el papel: la caja ya tiene su
  título y su párrafo, así que tres números más antes de la gráfica eran un
  cuarto bloque de texto antes de llegar a lo que se viene a ver. Debajo
  funcionan como el pie de una foto — miras la forma, y ahí está lo que no se
  podía leer de ella. Con una raya que las separa, o se leían como parte del
  eje de abajo.
- **Y la gráfica encoge**: de 190 a 132 de alto. Había subido al añadir la
  escala y quedó demasiado aire entre la línea y el suelo — con cifras
  pequeñas era casi todo hueco. 132 la deja proporcionada sin apretar los
  números del eje.

### 0.7.33.1 · 28 ago 2026
Fundador se llama como se llama, y las dos tarjetas se alinean solas.

- **«Norata Fundador» en la tarjeta**, al lado de «Norata Pro». Un «Fundador» a
  secas se leía como otra cosa y no como el otro plan de la misma app. Fuera de
  ahí sigue siendo «Fundador», que es la regla que ya seguía `NOMBRE_PRO`.
- **El botón dice «Pasar a Plan Fundador»**, simétrico con «Pasar a Plan Pro».
  Antes decía «Pasar a ser Fundador», que es lo único de la pantalla que le
  ponía a la PERSONA una palabra con género.
- **«Piedra» pasa a «insignia»** en los tres sitios que lo decían. «Piedra» es
  como llamamos al dibujo entre nosotros; lo que reconoce quien lo ve es una
  insignia.
- **«Todo lo que Norata añada a Pro»**, sin «sin volver a pagar» detrás: la
  tarjeta ya dice dos veces que es un pago único —en la franja y en el pie—, así
  que ahí sobraba y alargaba la única viñeta que se partía en dos renglones.

**Y el nivelado se generaliza a todas las filas.** Nivelaba solo el renglón de
debajo del conmutador, y se quedó corto en cuanto los textos crecieron: con las
tarjetas estrechas «Norata Fundador» pide dos renglones donde «Norata Pro» pide
uno, y a partir de ahí el precio, el pie y todo lo demás bajan en una tarjeta y
no en la otra. Parchear cada fila cuando falla es una carrera que se pierde:
cambiar una palabra vuelve a romperlo.

`planNivelarFilas` iguala las seis filas de arriba —franja, gancho, nombre,
precio, pie y botón— después de pintar. Es lo que haría un `subgrid`, hecho a
mano porque las dos tarjetas son dos rejillas independientes. Las ventajas NO
entran: no son la misma fila, Pro tiene cuatro y Fundador tres a propósito. Y
solo actúa cuando las tarjetas están en la misma fila: apiladas, igualar
alturas no alinea nada y solo añade aire.

Medido alineado en siete anchos de tarjeta, de 182 a 332 px.

### 0.7.33 · 28 ago 2026
La flecha se pone encima, el mes entra en la racha, el informe deja de bailar,
y el panel de números empieza a decir algo.

**La gráfica de los catorce días no tenía escala.** Tres rayas sin decir qué
valían: un punto a media altura podía ser 3 personas o 300, y el único número
escrito estaba en una frase DEBAJO del dibujo — que es donde nadie busca la
escala de una gráfica. Ahora cada renglón lleva su cifra al lado (cero, la
mitad y el máximo, redondeados y sin repetidos), y el del máximo va más marcado
porque es la referencia contra la que se lee todo lo demás.

**Y encima del dibujo, las cifras que una línea no puede decir:** la media
diaria, el mejor día con su fecha, el total del periodo y **cómo va contra los
siete días anteriores**, en verde o en coral. La comparación es contra los siete
días previos y no contra la semana natural: la ventana es de catorce, así que
parte por la mitad y las dos mitades miden lo mismo — comparar «esta semana»
con «la pasada» un lunes sería comparar un día contra siete. Solo sale con las
dos mitades completas: con menos historia el porcentaje es ruido, y un número
inventado en un panel que existe para decidir es peor que un hueco.

**El cobro decía «anual» a secas.** Una palabra suelta al lado de un número no
dice si eso son personas, pesos o meses, y en la única caja de la app donde se
cuenta dinero eso no puede pasar: ahora son «Plan mensual» y «Plan anual».
Fundador se queda sin «Plan» delante a propósito — no es una suscripción, es un
pago único, y meterlo en el mismo saco lo cuenta mal. Cada barra con su color:
menta los que se renuevan y lila el fundador, el mismo lila de su anillo y su
piedra desde 0.7.15.

**Los reportes de gente salen de «Lo que se rompe» y tienen su propia caja.**
Eran dos cosas distintas en una misma lista: un volcado de JavaScript siempre
igual, y un mensaje que alguien se paró a escribir. Ahora:

- **Se agrupan por dónde dicen que pasó**, no por el texto. Lo pidió Eduardo:
  «no se pueden sumar en uno mismo si el contexto es distinto». Dos personas
  contando dos cosas distintas de la misma pantalla no son «2×» de nada — son
  dos historias, y sumarlas borra justo lo que las hace útiles. El lugar sale
  del `[Talentos]` que escribe el propio formulario; lo que no lo traiga cae en
  «Sin ubicar», que es honesto y no lo esconde.
- **Al tocar un grupo se despliega la lista** con cada mensaje entero, su día y
  su versión, sin sumar ni resumir. Se pueden abrir varios a la vez.
- **La cuenta va a la derecha del título** y dice «5 reportes», y se enciende en
  oro cuando hay algo sin ver.

Y «Lo que se rompe» pasa a llamarse **«Lo que se rompe solo»**, con su propia
cuenta de errores a la derecha: ahora que la otra caja existe, el nombre tiene
que decir cuál de las dos es.

**Una trampa que costó el panel entero:** `gruposAbiertos` ya era una función de
Talentos, y los archivos de la app comparten un único ámbito global —son
`<script>` sueltos, sin módulos—. Redeclararlo con `let` no da un aviso: parte
el archivo con «Identifier has already been declared» y se lleva por delante
todo lo que venía después. Ahora se llama `reportesAbiertos`.

**La flecha de comparación va ARRIBA de la cifra**, y lo cazó Eduardo mirando
el hero de Habilidades. Debajo, el hueco vacío que reservan las columnas sin
comparación se abría entre la cifra y su rótulo —justo donde se lee como un
agujero—. Arriba, ese mismo hueco queda contra el borde de la caja, donde pasa
por aire, y las cifras y los rótulos de las cuatro columnas se alinean solos.
Medido en los cuatro heroes: una sola altura para todas las cifras y una sola
para todos los rótulos.

**El mes entra en la tarjeta de la racha.** Enseñaba siete días y nada más, así
que el dato que le da sentido —cuántos días del mes llevas moviéndote— había
que ir a buscarlo al informe. Es el mismo calendario de «Tus días», pero
leyendo los días con actividad de verdad: práctica, misiones y talentos, que es
lo que la racha cuenta. Va más apretado y sin las iniciales de los días, que ya
están en la tira de la semana justo encima.

- La tarjeta pasa de 5 a 8 filas de alto por defecto. **Quien ya tenga su
  tablero acomodado la verá con el fundido de abajo** hasta que la estire: es
  lo que hace `marcarDesbordes` con cualquier tarjeta a la que no le cabe lo
  que lleva dentro.

**Y un fallo que solo salió al meter el calendario ahí.** `--carril` y `--line`
faltaban en la lista de variables que la escena vuelve a declarar en oscuro, y
no se había notado nunca porque nada de lo que vivía dentro las usaba: de día,
las casillas sin actividad salían gris papel (`#dadce7`) sobre el carbón de la
escena, y el recuadro de los días que aún no llegan igual. Dentro de una escena
todo tiene que ser de noche, no solo los acentos.

**El informe deja de bailar al cambiar de filtro.** Tenía un `scrollIntoView`
que arrastraba el cuerpo hasta el borde de arriba, y como los mandos están
justo ahí, la página se movía aunque ya estuvieras mirando el principio. Fuera:
ahora el contenido se despliega hacia abajo y quien mira se queda donde estaba.
Comprobado saltando entre las cinco ramas desde arriba del todo: el
desplazamiento no se mueve ni un píxel.

**El calendario del mes, más pequeño y centrado.** A 420 px las casillas salían
de casi sesenta píxeles y pesaban más que la gráfica que las acompaña; y pegado
a la izquierda dejaba media tarjeta vacía. Ahora mide 290 y va al medio.

**Y «Hiciste algo N días» pasa a «Cumpliste misiones N días».** Reducir a
«algo» lo que costó hacerse quita valor a lo que se hizo, y lo que se hizo
importa tanto como que se hiciera. Estas casillas cuentan misiones cumplidas,
así que se nombran.

### 0.7.32.1 · 28 ago 2026
El descuento del anual vuelve a verse, y Fundador deja de empezar con un vacío.

- **El renglón de debajo del conmutador habla siempre.** Estaba callado con el
  anual puesto —«ya lo dice el pie de la tarjeta»— y con eso el descuento
  desapareció justo de la pantalla que lo vende: quien llegaba con el anual ya
  elegido no veía por ningún lado que estaba ahorrando. Ahora lo dice en los
  dos estados, y **el pie del anual pasó a contar lo suyo** —cada cuánto se
  cobra y que se puede cancelar—, que es lo que le faltaba y solo tenía el
  mensual.
- **El hueco de Fundador deja de ser un hueco.** Era una copia escondida del
  conmutador, puesta solo para alinear; funcionaba y se veía vacío, que es peor
  que desalineado: en la tarjeta más cara, lo primero que encontraba el ojo era
  nada. Esa fila es donde Pro contesta «cada cuánto se cobra», y Fundador tiene
  una respuesta a esa misma pregunta que además es su mejor argumento:
  **«Un solo pago»**, con «Cuesta menos que dos años del plan anual» debajo.
  Las dos tarjetas se leen fila por fila y la comparación se hace sola.
- **Esa cuenta se calcula, no se escribe.** Sale de `PLANES` —890 contra 590—
  porque una cuenta a mano sobrevive al cambio de precio que la deja mintiendo,
  y de todas las mentiras posibles esta se lee con la cartera en la mano. Si
  algún día los números no dan, no inventa nada: se calla.

**Y una franja estrecha que se arregló midiendo:** con las tarjetas lado a lado
y unas 250 px cada una, la frase de Pro cabía en un renglón y la de Fundador
pedía dos, así que el nombre y el precio de una bajaban 17 px respecto a la
otra. `planNivelarGanchos` las iguala después de pintar, y **solo cuando están
en la misma fila**: apiladas, igualar alturas no alinea nada y añade aire donde
no hace falta. Un `min-height` fijo de dos renglones lo arreglaba igual, pero
dejaba hueco muerto en todos los demás anchos, que son casi todos.

### 0.7.32 · 28 ago 2026
El informe se dibuja, y el cuadro de reportar un fallo se viste de oro.

**El cuadro de reportar un fallo.**

- **Oro y no menta**, que es lo que pidió Eduardo: un fallo no es un logro ni
  una venta. El oro es el tono de «esto tiene un coste que quizá no ves», y
  aquí el coste es el rato que alguien acaba de perder.
- **Al oro le faltaban dos piezas** que la menta sí tenía: el borde de la
  tarjeta y el icono en su color. Las tenía solo `.alarm.oro` —el aviso de
  borrar una cuenta—, así que un cuadro oro que no fuera una alarma salía con
  el borde gris y el icono apagado, y el «oro» se quedaba en el título. Lo
  destapó justo este cuadro, que es oro y no advierte de nada.
- **El título va en blanco** aunque la tarjeta sea oro: el amarillo ya lo lleva
  el icono, y dos amarillos seguidos en la misma columna se anulan.
- **Un párrafo de entrada antes de la primera casilla.** Quien acaba de
  tropezar con un fallo está molesto, y lo primero que lee no puede ser un
  campo: dice que alguien lo lee y lo arregla, y que no hace falta saber nada
  técnico. Dos frases; la tercera ya no se lee.
- **El botón de enviar pasa a `btn-linea`** —fondo oscuro, borde menta—. El
  verde macizo es «lo que has venido a hacer», y aquí nadie ha venido a esto:
  mandar un reporte es un favor, no la acción de la pantalla. Nacen `clase` y
  `okClase` en `askBase` para poder decirlo sin manosear el modal por fuera.
- **Al enviar sale una ventana de agradecimiento**, y no un aviso de los de
  abajo: quien acaba de rellenar tres campos ha hecho un trabajo, y un mensaje
  que se desvanece en tres segundos lo trata como si hubiera pulsado un botón
  cualquiera. Va con `askBase` y no con `avisar`, que nació para advertir —con
  coral y sacudida de pantalla—: un «gracias» que tiembla es un susto.

**Y los reportes se distinguen de los errores automáticos.** En el panel iban
mezclados y solo los separaba un `· reporte` diminuto en el pie. Ahora van
**primero**, con la raya lateral en oro en vez de coral y el bicho junto al
mensaje, y el pie dice «lo escribió alguien». No es adorno: un mensaje que una
persona se paró a escribir trae el contexto de lo que estaba intentando hacer,
que es lo que un volcado de JavaScript nunca dice, y enterrarlo entre cien
errores automáticos es la forma más segura de no leerlo nunca.

**El informe se dibuja: un calendario de verdad, barras que no son ladrillos.**

**«Tus días» pasa a ser un calendario.** Era una parrilla de columnas-semana
que empezaba donde empezara el rango —53 columnas para un año, cinco para un
mes— y no se entendía qué era una casilla ni si el patrón seguía un calendario
o caía donde le tocaba. Lo dijo Eduardo mirándolo y tenía razón.

- **Un mes** se dibuja como un mes: siete columnas con las iniciales de los
  días arriba, el 1 en su día de la semana real y tantas filas como semanas
  tenga. Los de 30, los de 31 y los febreros de 29 salen solos, porque los días
  se cuentan con `Date.UTC(a, m, 0)` —el día 0 del mes siguiente— y eso ya sabe
  de bisiestos. Comprobado: 2024 y 2028 dan 29, 2100 da 28 y 2000 da 29.
- **Un año** son los doce meses en pequeño, cada uno con su nombre: cuatro
  columnas en pantalla ancha y dos en el teléfono. Ni una cinta que hay que
  empujar de lado ni un bloque medio vacío.
- **Los días que aún no llegaron** se ven como un recuadro apenas marcado: se
  nota que el mes sigue y no se cuentan como fallados.
- Y la leyenda dice **«Cada casilla es un día»**, que es lo que faltaba: el
  dibujo era bonito y no se sabía qué contaba.

**Las barras dejan de ser ladrillos.** Cada columna era un bloque del ancho
entero con un carril gris detrás, así que la gráfica se leía como una fila de
rectángulos —y los días sin nada seguían ocupando un bloque macizo de gris—.
Ahora la barra es una columna delgada (20 px) apoyada en una línea de base, sin
carril: lo que no pasó no dibuja nada, que es exactamente lo que significa.

**El aro cambia de color según lo lleno que esté**, y sus tres tonos están
medidos, no elegidos a ojo. Un aro de nueve píxeles no es texto ni es un
relleno: con `--mint` salía verde bosque de día (ese tono es el de escribir,
5,46 sobre la tarjeta) y con el macizo se perdía (1,87). Los nuevos `--aro-*`
pasan de 3 sobre 1 siendo todavía el color que dicen ser: **3,36 · 3,77 ·
3,82**. Los tramos van del mismo lado que las lecturas —bajo por debajo de 40,
alto por encima de 85— para que el color y la frase nunca se contradigan.

Y el de en medio es **celeste y no luciérnaga**: el amarillo no llega a 3 sobre
1 contra la tarjeta clara sin volverse el dorado apagado que ya se rechazó una
vez por leerse como una alerta interna.

**El botón «Ver el informe» en modo claro.** Vive dentro de la escena, que se
queda de noche en los dos modos, y `btn-linea` le daba `var(--card)` de fondo
—una variable que la escena NO vuelve a declarar—, así que de día salía una
pastilla blanca pegada sobre un fondo oscuro. Ahora toma el mismo vidrio que el
recuadro del foco, que es su vecino.

### 0.7.31.1 · 28 ago 2026
La barra deja de escalonarse al desplegarse, y la bolita se alinea.

- **El escalón al plegar y desplegar.** La bolita de reportar vivía dentro de
  la fila de la versión con `flex-wrap`, y ahí estaba el defecto: el ancho de
  la barra se anima entre 84 y 246 px, y a mitad de camino el texto y la
  bolita dejaban de caber en una línea. La bolita saltaba a un segundo
  renglón, la fila crecía de 43 a 60 px de alto, y al terminar la animación
  volvía a subir. Ese ida y vuelta era el escalón — y que se corrigiera solo
  al acabar es justo lo que lo hacía parecer un misterio.
- **Sacada del flujo con `position: absolute`, no hay nada que envolver.**
  Medido recorriendo los 82 anchos intermedios de 84 a 246 px: la fila mide
  43 px en todos ellos y la bolita no envuelve ni una vez. Y de paso se
  comprobaron los cinco hijos de la barra: ninguno cambia de alto en todo el
  recorrido.
- **Alineada con el botón de plegar la barra.** Los 4 px del anclaje salen de
  una medición y no de la vista: ese botón termina en 223 y la fila de la
  versión en 227. Antes la bolita quedaba 10 px más a la izquierda que él, y
  esos 10 px eran todo lo que rompía la columna de la derecha.
- El anclaje se suelta al plegar (`inset: 0` y `margin: 0`), o la bolita se
  quedaría pegada al borde en vez de centrarse para el cambio con el número.
  Y usa `margin-top` negativo en vez de `translateY(-50%)` porque plegada la
  bolita necesita `transform` para su escala, y las dos cosas no pueden
  compartir la misma propiedad.

### 0.7.31 · 28 ago 2026
Las tarjetas de precio dicen mejor lo que venden, y respiran.

- **El conmutador vuelve a ser una franja de un renglón.** Llevaba dos —«Anual»
  y debajo «2 meses gratis»— y medía 62 px: dentro de una tarjeta de 207 se
  comía el sitio del precio y se leía como un botón gordo antes de saber de
  qué plan estabas leyendo. Ahora mide 39, y el gancho del anual se mudó a su
  propio renglón debajo, que ocupa su sitio **aunque esté vacío**: si
  desapareciera, cambiar de pestaña subiría el precio de golpe y la tarjeta
  daría un salto en la cara de quien compara. Medido: cero píxeles de salto.
- **Cada plan lleva su piedra al lado del nombre.** Es la misma que sale en la
  cabecera, en la fila del índice, en la chapa del mini menú y encima de su
  columna en la tabla: se empieza a reconocer aquí y se reconoce después en la
  cuenta. Sale de `icon("plan-*")`, como en los otros cuatro sitios.
- **Las tres ventajas de Fundador, reescritas.** «Todo lo de Pro, sin fecha» no
  decía qué pasaba con la fecha —se leía como una carencia— y no decía lo más
  valioso del plan, que es que **lo que venga después va incluido**. Ahora:
  Pro entero y sin límites para siempre, todo lo que Norata añada a Pro sin
  volver a pagar, y el distintivo. La promesa se hace sobre **Pro** y no sobre
  «Norata entera» a propósito: es lo que el plan abre de verdad, y una promesa
  más ancha sería una que algún día habría que romper.
- **Se acabó la «piedra con corona».** Describía la pieza por dentro; lo que la
  persona ve es un anillo lila en su perfil y una piedra que no se parece a la
  de nadie más. Cambiado en los tres sitios que lo decían: la tarjeta, la tabla
  comparativa y la pantalla de compra.
- **Más aire**: 18 px de relleno en la tarjeta, 9 entre ventajas, 14 entre las
  dos tarjetas. Apretadas, las cuatro cosas que hay que leer —qué plan, cuánto
  cuesta, qué abre, dónde se pulsa— se leían como un bloque único.

**El hueco que alinea las dos tarjetas es ahora una copia escondida del
conmutador**, no una altura escrita a mano. Con el número fijo se quedaba ocho
píxeles corto, y cualquier retoque futuro al conmutador lo habría vuelto a
descuadrar sin que nada avisara. Va con `visibility: hidden` —que sigue
midiendo— y con `span` en vez de `button`, para que no se pueda enfocar.

**Una trampa nueva, y de las caras:** las comillas invertidas dentro de un
comentario de HTML que vive dentro de una plantilla de JavaScript **cortan la
plantilla**. El síntoma no es un error a la vista: desaparecen funciones
sueltas del archivo. Y en la misma tanda, un `s.index(a) : s.index(b)` mal
elegido se llevó por delante el bloque entero de los topes; se recuperó del
commit anterior. Al reemplazar por rangos, comprobar qué hay EN MEDIO.

### 0.7.30 · 28 ago 2026
Talentos deja de encabezar con el dinero, y el informe gratuito dice qué abre.

**Una persona vale por lo que es, no por lo que gastó.** El panel de Talentos
abría con «Invertido en ti» y el total gastado, en la cifra más grande de la
pantalla, y eso decía justo lo contrario de por qué existe el módulo. Ahora
encabeza lo que ya conseguiste y no se puede perder —un talento completado no
decae nunca—: «Ya son tuyos · 4 talentos». El dinero no desaparece; baja a la
fila de estadísticas, al informe y al Resumen, pero deja de presidir. La misma
corrección en la tarjeta «Invertido» del Resumen, que ahora encabeza con los
permanentes.

- **El código de la moneda se pinta más pequeño que la cifra.** «$5,000 MXN»
  con las dos partes al mismo tamaño le daba a MXN el peso de un número, y no
  lo es: es la unidad. Para eso está `moneyHTML()`, que va aparte de `money()`
  y no lo sustituye — la mitad de los sitios que piden un importe no admiten
  HTML (un `title`, un aviso, una confirmación) y ahí la etiqueta se vería
  escrita. La regla: si el importe se inserta como HTML, `moneyHTML`; si viaja
  como texto, `money`.
- **Y las cifras dejan de flotar.** Reservar dos renglones para las cifras
  largas alineó los rótulos (0.7.29) pero dejó las cortas pegadas al techo de
  su caja, con todo el aire debajo. Ahora se centran en el hueco.

**El informe del plan Gratuito, reescrito.** Tenía tres problemas y los tenía a
la vez: decía en una frase lo mismo que los tres números de debajo, no dejaba
claro que le estuvieran invitando a pagar, y los cinco filtros de módulo se
podían tocar sin que cambiara nada.

- **Fuera la frase que repetía las cifras.** Decía «cumpliste 33 misiones,
  ganaste 1310 XP y cerraste 6 cosas» con esos tres números en grande justo
  debajo. Ahora la frase dice lo único que las cifras no pueden decir solas:
  cómo se compara con el periodo anterior. El rango de fechas tampoco se
  repite, que ya está en su rótulo arriba.
- **Lo que abre Pro se cuenta, no se narra.** Cinco renglones, uno por
  pregunta que el informe contesta, en vez de un párrafo con todo dentro.
- **Los cuatro módulos se apagan** cuando no llevan a ninguna parte, igual que
  los periodos cerrados: se ven, y al tocarlos dicen por qué. Solo «Todo» queda
  encendido. Y el periodo que está puesto nunca sale apagado aunque el plan no
  lo incluya —«Semana» seleccionada y gris a la vez se contradecía—, ni abre el
  cuadro de Pro al tocar la pestaña en la que ya estás.

**Los filtros siguen la escala de botones de la app**, no una suya: el que está
puesto es un `btn-linea` —fondo oscuro y borde menta—, porque eso es lo que
hace, llevarte a mirar sin escribir nada. Menta maciza habría dicho «esta es LA
acción de la pantalla», y no lo es.

**Y la gema donde se nombra el plan.** El cuadro del tope cambia la corona por
la gema, y la lleva también su lista y el botón del informe: repetir el mismo
símbolo hace que los tres se lean como el mismo sitio al que te llevan.

**En Resumen**, la tarjeta de Niveles cambia «XP TOTAL» por «XP · 7 días» con
su flecha — un acumulado que solo sube no cambia nada de lo que haces hoy, que
es la misma regla que rige los cuatro paneles grandes. No se añadieron tarjetas
nuevas: las siete que hay ya cubren los cuatro módulos y una más habría
repetido lo que la racha o el informe dicen mejor.

### 0.7.29 · 28 ago 2026
Los informes dejan de ser una prueba y pasan a ser la app.

Eduardo la dio por buena, así que **se quita el interruptor**. Las flechas de
comparación están en los cuatro paneles y el botón «Ver el informe» está
puesto, sin condición y sin escribir nada en la dirección. Borrado por nombre y
no por rango, que es como toca:

1. `index.html` — el bloque del interruptor en el script de arriba.
2. `css/estilos.css` — el `html.informes` que envolvía la altura de los
   rótulos, que ahora vale para los cuatro heroes siempre.
3. `js/10f-informes.js` — `pruebaInformes()`.
4. Los cuatro `pruebaInformes() ? … : …` de `05-resumen.js` y `06-detalle.js`:
   se queda la rama nueva y se va la vieja con su comentario.

**El escaparate se queda, y a sabiendas.** `?informes=demo` sigue enseñando los
paneles y el informe con un mes de vida inventada. No es una función a medias:
es la única forma de mirar estas pantallas sin esperar semanas a tener
historia, y sin ella no se habría podido decidir nada de lo que se decidió —la
primera vez que se miró la reforma en una cuenta vacía, parecía que no había
cambiado nada—. Se paga que su código viaje en la app de todo el mundo, igual
que el panel de administración. Nadie que no escriba el parámetro se lo
encuentra, los números no tocan `state` ni se guardan, y mientras están puestos
el rótulo dice que no son tus datos. El rótulo cambia de texto: ahora habla de
números inventados y su botón dice «salir», que es lo que hace.

**Y un fallo que causó la moneda de 0.7.24.** Al escribirle el código a todos
los importes, `$5,340 MXN` dejó de caber en una columna de 78 px del panel de
Talentos: partía en dos renglones y arrastraba su rótulo 23 px hacia abajo,
descuadrando las otras tres columnas. Ni recortar el número ni quitarle el
código eran salida —las dos pierden el dato justo donde hay que
desambiguar—, así que se reserva la segunda línea en las cuatro columnas
cuando alguna cifra del grupo es larga, igual que se hizo con la fila de las
flechas: o la hay para todas o no la hay para ninguna. Solo paga esa altura el
panel que enseña dinero. Medido a 375 px: Talentos pasa de 332 a 355 px de
alto y los otros tres se quedan igual; a 320 px, donde las columnas van en dos
filas de dos, cada fila queda alineada consigo misma.

### 0.7.28 · 28 ago 2026
El bicho es una bolita, y el reporte pregunta tres cosas.

- **La bolita, del tamaño del botón que pliega el menú** (32 px). Antes era una
  fila entera con su rótulo, y pesaba más que Ajustes por algo que se usa una
  vez al mes. Vive con el número de versión: el texto a la izquierda y ella a
  la derecha.
- **Plegada la barra, el número se convierte en el bicho al pasar el ratón.**
  Es el mismo gesto que ya hace el isotipo de arriba para volverse el botón de
  desplegar —mismos tiempos, misma escala, comprobado declaración por
  declaración—, y se copia a propósito: dos transformaciones distintas en la
  misma barra se leerían como dos mecanismos que hay que aprender por separado.
- **El reporte es un formulario de tres campos** y el número es la decisión:
  «no extenso que si no no lo van a querer reportar». **Dónde pasó** es una
  lista que llega ya contestada con la pantalla en la que estás —nueve de cada
  diez veces se reporta donde acaba de pasar—; **qué hacías justo antes** es
  opcional y es lo que permite reproducirlo; y **qué salió mal** es el único
  obligatorio, porque quien está enfadado escribe una línea y se va, y perder
  ese reporte por exigir dos casillas más sería cambiar un dato por ninguno.
  Llega al panel como `[Talentos] lo que pasó · antes: lo que hacía`.
- **El bicho va encima del título** del cuadro, que es donde el resto de la app
  pone el icono de un modal, y de paso ata el cuadro con la bolita que se acaba
  de pulsar.
- **Y una trampa nueva en CLAUDE.md, que costó media hora:** en este entorno el
  panel no compone fotogramas, así que **las transiciones no avanzan nunca** —
  se quedan en `running` y `getComputedStyle` devuelve el valor de partida. Se
  ve exactamente como un CSS que no se aplica: el `opacity: 0` de una regla
  parecía no llegar mientras el `background` de esa MISMA declaración sí,
  porque el fondo no tenía transición y la opacidad sí. La receta para medirlo
  —saltar las animaciones al final— queda escrita junto a las demás.

### 0.7.27.2 · 28 ago 2026
Los retoques de la pantalla del plan, después de verla funcionando.

- **La franja de la rama baja de 108 a 76 px.** Ocupaba más que el argumento
  que ilustra. Los nodos no encogen: su radio se calcula en píxeles y se pasa
  a unidades del mapa, así que miden lo mismo con cualquier altura; lo único
  que cambia es cuánto mapa se ve.
- **El ancho del recuadro ya no se adivina: se mide.** Estaba adivinado —620 px
  en escritorio— y en una ventana de 1100 el hueco real eran 394: como un SVG
  nunca estira su contenido, `meet` encogía el mapa entero y los nodos salían a
  **3,4 px en vez de 10,8**. Ahora se pinta con un ancho provisional y
  `planAjustarLienzos` rehace el `viewBox` con el de verdad. De paso, la
  decisión de recortar se toma ahí, así que ya no puede encenderse el degradado
  sobre un dibujo que sí cabía.
- **Los dos botones de pagar, a la misma altura.** `margin-top: auto` los pega
  al suelo de su tarjeta, que es la fila que se compara.
- **Las dos tarjetas alinean nombre y precio.** Fundador reserva la fila del
  conmutador con un hueco, solo cuando están lado a lado.
- **Los botones dicen «Pasar a Plan Pro» y «Pasar a ser Fundador».** Con los
  lados apretados a 12 px: a 207 px de tarjeta, el segundo medía 138 px contra
  los 131 que dejaba un botón normal y se partía en dos renglones.

**Dos fallos de CSS que se venían venir y valen como regla:**

- **Una regla que apaga algo va ANTES de la consulta que lo enciende.** El
  `display: none` del hueco estaba escrito después del `@media` y, con la misma
  especificidad, gana la última: el hueco no aparecía nunca.
- **Dos columnas que se comparan se declaran `minmax(0, 1fr)`.** `1fr` es
  `minmax(auto, 1fr)`, así que manda el ancho mínimo del contenido y la tarjeta
  con la ventaja más larga se llevaba 37 px de la otra.

Y **las dos columnas empiezan a los 1100 px, no a los 900**: esta pantalla
tiene una columna de secciones a la izquierda, así que a 900 al panel le
quedaban 300 px y cada tarjeta se estrujaba a 150.

### 0.7.27.1 · 27 ago 2026
El botón de reportar se muda a la barra, y pregunta con una caja de verdad.

- **Estaba flotando en la esquina de abajo a la derecha y Eduardo no lo
  encontraba** —«sigo sin ver el botón por ninguna parte»—, dos veces. Y tenía
  razón: un botón suelto en el borde de la pantalla no se busca, se descubre
  por accidente o no se descubre. Ahora vive donde la gente ya va a buscar «lo
  de la app»: **en la barra, entre Ajustes y el número de versión**. En el
  teléfono, que no tiene barra, va al pie de Ajustes junto al número — el
  mismo sitio equivalente, igual que ya hacía la versión.
- **Y pregunta con una caja de comentario, no con un renglón.** Contar un
  fallo son dos o tres frases —qué hacías, qué esperabas, qué pasó— y en un
  campo de una línea que se desplaza de lado la gente escribe cuatro palabras
  y se rinde. Es la misma caja que la de despedirse de la cuenta, a propósito:
  en los dos sitios lo que hay es una persona escribiéndonos con sus palabras.
  Nace `askComentario`, que enseña solo el área de texto con su contador —
  `askText` ya sabía hacerlo, pero únicamente debajo de un campo de nombre, y
  aquí ese campo no existe.
- **Sin Enter para enviar**, al revés que el campo de una línea: aquí el salto
  de línea es parte de lo que se escribe, y robárselo mandaría el mensaje a la
  mitad de la primera frase. El tope sube de 280 a 500.
- El botón del teléfono se escondía en la computadora con una regla de clase,
  y perdía: `.btn` declara `display` trescientas líneas más abajo con la misma
  especificidad, así que ganaba por orden y el botón salía en los dos sitios.
  Va por el id, que gana siempre y no depende de dónde caiga el bloque el día
  que alguien reordene el archivo.

### 0.7.27 · 27 ago 2026
El informe deja de enseñar y empieza a decir.

Fase 4 y última de la reforma de los paneles: **las lecturas**. Una gráfica
enseña; una lectura dice. «El 70% de tu XP viene de misiones» es lo que
alguien repetiría en voz alta, y es lo que hace que un informe se vuelva a
abrir. Van al final de cada rama —primero se ve, después se lee lo que se ha
visto— y como mucho salen cuatro.

Se dejaron para el final del plan a propósito: se escriben mucho mejor mirando
las gráficas ya dibujadas con datos reales que imaginándolas. Viven en
`js/10h-lecturas.js`, una función por regla, y añadir una es escribir otra
función y ponerla donde toque.

**Cuatro reglas las gobiernan, y ninguna es negociable:**

1. **Ninguna aparece sin datos suficientes detrás.** Cada una lleva su propio
   mínimo escrito, y por debajo de tres días con actividad no se interpreta
   nada: sale «todavía es pronto», que además de ser verdad es una promesa.
   Una frase inventada sobre tres días de uso se lleva por delante la
   confianza en las otras veinte.
2. **No regañan.** Dicen lo que se ve y por dónde se sale. La de constancia
   baja no acusa: propone quitar misiones, que es lo que de verdad la sube. La
   del XP perdido lleva la salida pegada en la misma frase.
3. **No repiten la gráfica.** Si la barra ya dice que el martes es el día más
   flojo, la lectura tiene que añadir qué significa o qué hacer.
4. **Se ordenan por lo que importa.** En Proyectos, lo estancado va primero:
   es la única decisión que la app pide de verdad.

Veintiséis reglas repartidas entre las cinco ramas. Algunas de las que más
dicen: el día de la semana en que se te cae el ritmo (pide dos semanas de
historia, porque con una el «día flojo» es simplemente el día que estabas
ocupado), la misión que sostiene todas las demás, la franja horaria en la que
ya sabes que funcionas, la habilidad que lleva más tiempo parada con su nombre
—un número no dice a cuál ir, un nombre sí—, y el cierre del informe general,
que va en aspiracional como todos los cierres de la app.

Tres cosas que salieron de leerlas ya escritas en pantalla, y que no se habrían
visto de otra forma:

- **«son 1 día completo … puestos»**: la frase de las horas armaba el plural
  por partes y no concordaba. Ahora se arma entera. Una falta de concordancia
  en la frase que más se relee se lleva por delante todo lo demás.
- **«7 de cada 10 de las veces que tocaba»** tenía un «de» de sobra.
- **La constancia de en medio se callaba.** Solo hablaba por encima del 85% o
  por debajo del 40%, así que quien va normal —que es casi todo el mundo— no
  leía ni una frase sobre ella. Ahora la banda de en medio también dice su
  número, sin adjetivos.

Con esto el plan de la reforma queda completo: motor y flechas (0.7.20), la
pantalla y la semana (0.7.22), el mes y el año (0.7.24) y las lecturas.

### 0.7.26 · 27 ago 2026
La pantalla del plan sale de verdad.

**El número, y por qué hay dos.** Lo de esta pantalla está contado entero en
la entrada de 0.7.25, de abajo —ahí se escribió—, pero **el código no iba
dentro de ese commit**: 0.7.25 subió con el renglón de la versión y el bicho,
y `js/10d-plan.js` y su CSS se quedaron sin subir. Como los aparatos ya
instalados tienen guardado `norata-0.7.25`, volver a subir con ese número les
habría dejado la copia vieja para siempre: el `CACHE` de `sw.js` es lo único
que les dice que hay algo nuevo que pedir.

De ahí la regla, que ya estaba escrita y esta vez se notó por qué: **el número
sube cuando sube el archivo, no cuando se escribe el cambio.**

Aquí van `js/10d-plan.js` y `css/estilos.css`. Nada más.

### 0.7.25 · 27 ago 2026
La pantalla del plan deja de contestar dos preguntas a la vez, Alpha se
despega del número y el bicho parece un bicho.

**El renglón de la versión.**

- **«Alpha» salía pegado al número** —«Alphav0.7.24· 27 ago 2026»— y la causa
  no era el texto: ese renglón es un `flex`, y ahí el espacio en blanco al
  principio o al final de un hijo **se colapsa**. Los espacios estaban
  escritos; simplemente no se dibujaban. Ahora la separación la pone el `gap`
  del contenedor, que es lo único que un flex respeta, y ninguna de las tres
  piezas lleva espacios sueltos dentro. El pie del teléfono usa la misma regla,
  para que los dos sitios donde se lee la versión no puedan acabar diciéndolo
  distinto.
- **La uve va en mayúscula**: `V0.7.25`.
- **Con la barra plegada, «Alpha» se esconde con la fecha.** En 84 px no cabe
  «Alpha V0.7.25», y de las tres piezas la que contesta la pregunta que trae a
  alguien a mirar ese renglón —«¿cuál tengo puesta?»— es el número. El
  comentario ya lo decía y el CSS no lo hacía.

**El botón de reportar fallos.**

- **El bicho se leía como un asterisco**, y por eso costaba reconocerlo: seis
  patas del mismo grosor que el cuerpo y llegando casi al borde del marco. A
  18 px eso es una salpicadura, no un insecto. Redibujado con el cuerpo más
  grande, antenas en vez de un arco de cabeza y las patas más cortas — medido,
  el cuerpo pasa de ocupar poco más de la mitad del dibujo a dos tercios (64%
  del ancho). Y se pinta a 20 px en vez de 18, que dentro de un botón de 38
  tenía sitio de sobra.

**La pantalla del plan.**

**Contestaba «qué tienes» y «qué te vendemos» al mismo tiempo, y ninguna de
las dos ganaba.** Entre la lista de topes y la tabla comparativa se decía lo
MISMO dos veces con otras palabras, y el precio —lo único que hay que decidir
ahí— quedaba al final, después de dos bloques de lectura y un botón.

- **Tres tarjetas pasan a dos.** Mensual y anual no son dos planes: son el
  mismo Pro cobrado con otro ritmo, y eso ya lo decía `LIMITES`, que tiene dos
  entradas y no tres. Ahora son una tarjeta de Pro con un conmutador dentro y
  la de Fundador al lado. El conmutador arranca en **mensual**: una pantalla
  que aparece con la opción más cara ya elegida se nota, y hace desconfiar del
  resto. El incentivo del anual se dice ahí mismo, **en meses** —«2 meses
  gratis»— y no en porcentaje: el 29% hay que traducirlo antes de que
  signifique algo.
- **Las ventajas viven dentro de la tarjeta**, junto a su precio, y salen de
  `ventajasPro()`, que las calcula comparando `LIMITES.pro` con `LIMITES.libre`.
  `planIncluyeHTML` sigue viva y sigue pintándose para quien YA paga, que es
  donde contesta la pregunta correcta.
- **La tabla comparativa baja al pie.** Desplegada en medio tapaba justo las
  tarjetas de precio que la persona estaba comparando.
- **Nuevo: dónde vas contra el tope.** Sustituye a la cabecera cuando aprieta un
  límite, y dice el argumento con los datos de quien mira —«ya llenaste tu
  única rama» pesa más que «ramas ilimitadas»—. Los talentos se cuentan con el
  **mapa de tu rama de verdad**, dibujado desde `branchLayout` de
  `07-lienzo.js`; las ramas, con pastillas que llevan su nombre dentro.

Tres reglas de ese bloque que no se deshacen sin volver a discutirlas:

- **Solo sale cuando aprieta** (`PLAN_AVISA_DESDE`, hoy 3 o menos). Con 2 de 12
  el mensaje sería «te falta mucho»: verdad, pero no dice nada, y una cuenta
  recién creada estrenaría Norata mirando un contador de lo que no tiene.
  Dispara **solo el tope de talentos**: el de ramas está a cero desde el primer
  día —el plan da una— así que si contara, el bloque saldría siempre.
- **El conteo dice lo que QUEDA**, nunca lo gastado, y que llegue a cero es el
  mensaje, no un caso raro.
- **Un hueco vacío solo se dibuja si existe.** Esto empezó siendo un fallo: se
  pintaban dos cuadros de rama —uno lleno y uno por abrir— cuando el plan da
  UNA. Ese hueco prometía una rama que no está.

**Nada crece con el tope.** Ni la fila de cuadritos ni el mapa: lo que sobra se
recorta por la izquierda con `mask-image`, que es donde ya no hay nada que
decidir, y a la derecha se ve entero lo que queda. Con máscara y no con un
degradado encima, porque un degradado sólido tendría que saber de qué color es
el fondo y `--card` cambia con el modo. Y el mapa **nunca se estira**: una rama
larga metida a la fuerza en un recuadro apaisado sale deformada y deja de
parecerse a la que la persona conoce.

### 0.7.24 · 27 ago 2026
El dinero dice en qué moneda está, y el informe llega al mes y al año.

**Todo importe lleva su moneda escrita.** «$1,890 MXN» y no «$1,890». El signo
`$` lo usan media docena de países, y quien lea «$1,890» pensando en dólares
creerá que se gastó treinta mil pesos. Es la misma razón por la que los precios
del plan ya lo llevaban; ahora vale para lo que escribe el usuario también: el
costo de un talento, lo invertido, y las cifras del informe.

- La moneda vive en **un solo sitio**, `state.settings.moneda`, y arranca en
  **MXN**, que es la que tiene que estar sí o sí. Está preparada para USD y
  EUR: para añadir una se pone su línea en `MONEDAS` y no hay que tocar nada
  más — ni los dieciséis sitios que llaman a `money()`, ni el rótulo del
  formulario, que ya pregunta por el código activo y no por «MXN» a mano.
- **Lo que todavía NO existe es la pantalla para elegirla**, y es a propósito:
  Eduardo la quiere pronto, no ahora. Cuando se haga, hay una cosa que decir
  ahí y que no es obvia: **cambiar de moneda no convierte nada.** Los importes
  se guardan como se escribieron; lo único que cambia es con qué código se
  leen. Convertirlos de verdad exigiría saber a qué cambio estaba cada compra
  el día que se hizo, y eso ni se guarda ni se puede reconstruir.
- Se pensó en una versión corta de `money()` sin el código, para las listas, y
  se descartó: en cuanto hay dos formas de escribir un importe, la corta acaba
  justo en el sitio donde había que desambiguar.

**Y la fase 3 del informe: el mes y el año.** El mando de periodo ya estaba;
lo que llega ahora son las tres gráficas que en una semana no dicen nada.

- **El mapa de calor.** Una casilla por día, en columnas de semana. Contesta la
  única pregunta que no contesta ninguna otra: cuántos días de tu vida hiciste
  algo. Cinco escalones de color y no un degradado —con una rampa continua, dos
  días de esfuerzo muy distinto acaban del mismo tono—. La primera columna se
  rellena con huecos según el día de la semana en que empieza el periodo: sin
  eso, el calendario entero queda corrido y un martes aparece en la fila del
  jueves, que es el fallo clásico de esta gráfica.
- **Las curvas acumuladas** de las cinco habilidades que más se movieron. Sin
  ejes a propósito: la pregunta es la forma —si algo se despegó o se quedó
  plano—, y unos números en el borde solo invitan a leerlas como una tabla mal
  hecha. En el año se agrupan por semanas; 365 puntos no son una curva, son
  ruido.
- **El repaso de diciembre**, debajo de los tres números de la portada y solo
  en el informe del año: niveles subidos, la racha más larga *de ese año* —que
  no es la histórica: la del año pasado no cuenta en el repaso de éste— y lo
  invertido.
- Y tres cifras más que necesitan recorrido: **¿cierras lo que abres?** (días
  de media y cuántos dentro de plazo), **en qué trimestre gastaste** (solo en
  el año) y **cuánto tarda un encargo** de crearlo a cerrarlo.

Con esto ninguna rama pasa de cinco gráficas, así que el tope de seis se
mantiene con sitio de sobra. Medido a 1280 y 375 px: el calendario del año mide
557 px y se desplaza dentro de su caja de 297 sin que la página se mueva de
lado, que es la regla —la pantalla decide la forma, nunca el contenido—. Y en
modo claro la menta del mapa pasa sola a la saturada (`#00cc7f`) y el trazo de
las curvas a su versión de línea, porque ningún color va escrito suelto.

### 0.7.23 · 27 ago 2026
El mapa de un proyecto también se ve a pantalla completa.

- **La pantalla completa deja de ser solo de Talentos.** El mapa de un
  proyecto se abre igual, con «Ver el proyecto completo» debajo del lienzo o
  desde el clic derecho, y trae sus herramientas arriba: centrar en lo que
  sigue, editar el mapa y ＋ para un encargo nuevo. En el teléfono es donde de
  verdad se recorre un mapa, porque en la tarjeta de la lista no cabe.
- **Elegir varios no sale en Proyectos.** Ese botón sirve para agrupar lo
  elegido en una caja del ático, y el ático es del árbol de Talentos. Un botón
  que no hace nada es peor que un botón que no está.
- **La capa sabe de qué módulo es.** Los dos módulos pueden tener una rama con
  el mismo nombre y la capa es una sola, así que ahora se compara el par y no
  el nombre: abrir un proyecto llamado «La casa» ya no pinta encima la rama de
  talentos que se llame igual, ni le despliega la suya —que iba por nombre en
  `state.ui.collapsed`—. Por lo mismo, las teclas Q, W y E dejan de crear
  talentos cuando lo que está abierto es un proyecto.
- **Y borrar el último proyecto estando dentro ya cierra la capa.** Se colaba
  por la salida rápida del caso vacío, que va antes del repintado: la capa se
  quedaba encima enseñando algo que ya no existía. Es el mismo fallo que
  Talentos había tenido y que su código ya avisaba; aquí se repitió por copiar
  la estructura sin copiar la lección.

### 0.7.22 · 27 ago 2026
La app tiene informes: una pantalla, cinco lecturas cortas.

Fase 2 de la reforma de los paneles. Se llega con «Ver el informe», el botón
nuevo del panel de cada módulo, y se entra por la rama de la que vienes:
nunca se cae en un índice a buscar lo que ibas a ver.

- **Una pantalla, cinco informes cortos, y ninguno es el general.** Con datos
  de un año, un informe que sumara los cuatro módulos sería ilegible; y cuatro
  pantallas serían cuatro sitios donde arreglar el mismo fallo. Así que es una
  sola pantalla con informes por rama y **tope duro de seis gráficas** cada
  uno. «Todo» no suma: es la portada —una frase, tres números, en qué módulo
  pusiste la energía— y cuatro accesos. Medido a 375 px: ninguna rama pasa de
  dos pantallas de teléfono.
- **Trece gráficas, y cada una arranca de una pregunta.** Misiones: tu
  constancia, en qué día se te cae la semana, qué misiones la sostienen y a
  qué hora cumples. Habilidades: de dónde sale tu XP, si ganas o pierdes,
  dónde creciste y cuánto tiempo llevas puesto. Talentos: en qué se te va el
  dinero, cómo va lo que abriste y qué se te vence. Proyectos: cómo está lo
  que llevas, tu ritmo, y lo que cerraste frente a lo que soltaste. Las que no
  tenían una pregunta detrás no están.
- **Ninguna gráfica se dibuja vacía.** Cuando no hay datos suficientes sale una
  frase que dice que eso se llena solo. Un dibujo hueco parece una app rota y
  encima no se puede leer. Probado con un perfil recién creado: las trece salen
  con su frase y ninguna revienta.
- **Los números no se calculan aquí.** Salen todos del motor de 0.7.20, el
  mismo que alimenta las flechas del panel. Si cada pantalla hiciera sus
  cuentas, acabarían discutiendo entre ellas delante del usuario.
- **El modo claro sale gratis** porque ningún color se escribe suelto: las
  barras usan `pinta()` y los carriles `var(--carril)`, así que de día la
  menta pasa sola a la saturada (`#00cc7f`) y el carril al gris de papel.

**Y el reparto del cobro, que cambia con esto.** Lo cerró Eduardo: el panel de
cada módulo YA es el informe del día, así que un informe diario no añadiría
nada; de la semana en adelante se paga.

- `LIMITES.libre.resumen` pasa de `["semana"]` a vacío, y con él los cuatro
  textos que anunciaban el resumen semanal gratis: el cuadro del tope, la lista
  de lo que abre Pro, el «qué tienes ahora» de Ajustes y la tabla comparativa.
  En pantalla se llaman **informes** y no «resúmenes»; la llave interna sigue
  diciendo `resumen` porque renombrarla obligaría a migrar los planes ya
  guardados.
- Como esa promesa nunca llegó a existir en pantalla, nadie pierde nada.
- **Quien no paga no se topa con un muro:** ve la portada de su propia semana
  con sus números de verdad —la frase y los tres números— y debajo las
  gráficas insinuadas, sin cifras. Esos datos son suyos, y verlos una vez es lo
  que explica para qué sirve pagar. Las siluetas no llevan números a propósito:
  serían datos inventados sobre su vida.

**El demo pasa a ser un mes entero.** `?informes=demo` ya no son ocho cifras
escritas a mano: es un juego de datos completo con la misma forma que `state`
—cinco habilidades, cinco misiones con 35 días de marcas y sus horas, seis
talentos y nueve encargos—, y todo lo demás lo calculan las mismas funciones
que leen tus datos. Es lo único que garantiza que lo que se ve en la prueba sea
lo que se verá de verdad. Sin azar y con las cuentas escritas, para que la
pantalla no se mueva sola al cambiar de pestaña.

### 0.7.21.2 · 27 ago 2026
El arranque aguanta que el HTML vaya una carga por detrás.

- **La primera carga tras subir 0.7.21.1 reventaba**, y el culpable era el
  botón nuevo: `document.getElementById("bug-btn").innerHTML` con el elemento
  todavía ausente. El motivo es el service worker y es la trampa de la casa —
  sirve el `index.html` que tiene en la caché mientras se trae el nuevo, así
  que durante UNA carga conviven el HTML viejo y el JavaScript nuevo. El
  `.innerHTML` sobre `null` mataba el arranque, y con él todo lo que
  `11-arranque.js` hace más abajo: los oyentes del arrastre, los atajos, la
  sincronía. A la segunda carga se curaba solo, que es lo que lo hacía difícil
  de ver.
- Los cuatro iconos del arranque pasan a un bucle con `if (el)`. Los tres de
  siempre nunca lo notaron porque llevan meses en el HTML; el riesgo es
  exactamente el de los nuevos, que es cuando las dos copias discrepan.

### 0.7.21.1 · 27 ago 2026
Alpha en la esquina, y un bicho para avisar.

- **La versión dice «Alpha» delante.** Va en su propio trozo y no pegada al
  número: con la barra plegada solo caben unos caracteres, y ahí la palabra
  que sobra es ésta — quien mira el renglón encogido busca el número. En menta
  para que no se lea como parte de la cifra. Cuando deje de ser alpha se quita
  de un sitio y de ninguno más.
- **Botón de reportar un fallo, abajo a la derecha.** No abre un buzón nuevo:
  reusa `apuntar_tropiezo`, que es por donde ya entran los errores que la app
  caza sola, así que los reportes caen en la misma lista del panel — un buzón
  aparte habría que acordarse de mirarlo, y éste ya se mira. Se apuntan con
  `donde: "reporte"` para distinguirlos de los automáticos, y se les pega la
  pantalla desde la que se escribió (`[en: tree]`), que es el dato que más
  ahorra al buscar y el que nadie escribe por su cuenta.
- **Funciona sin sesión**, igual que los avisos automáticos: quien no puede
  entrar es justo quien más necesita poder avisar de que no puede entrar.
- **Y `sbTropiezo` ahora devuelve si llegó.** Los avisos automáticos siguen
  sin mirarlo, pero el botón sí: darle las gracias a alguien por un reporte
  que no salió del teléfono es mentirle en el único momento en que estaba
  haciendo un favor. Si falla, se dice que no se envió y que lo reintente.
- **Fuera de la barra de navegación a propósito.** No es una sección, es una
  salida de emergencia: tiene que estar en la misma esquina en todas las
  pantallas, incluida aquella en la que algo se acaba de romper. En el
  teléfono sube por encima de la barra; en la computadora la barra vive a la
  izquierda y baja del todo. Medido en las seis vistas: alcanzable en todas,
  sin chocar con la barra ni con el botón de crear, y tapado por el cuadro de
  confirmar cuando hay uno abierto.
- **«Tus ramas de proyectos»** en el rótulo que encabeza la lista de
  contenedores. Dentro de cada tarjeta se les sigue diciendo proyecto a
  secas: ahí el contexto lo da la propia tarjeta.

### 0.7.21 · 27 ago 2026
Un proyecto se puede dibujar como mapa, y sus etapas se marcan sin entrar.

- **Los proyectos ganan una segunda vista: el mapa.** Los mismos encargos,
  dibujados como nodos y unidos por en qué orden van. No sustituye a la lista:
  el menú ··· de cada proyecto cambia de una a otra cuando quieras, así que
  quien no lo pida no se encuentra nodos nunca. **El nodo es el encargo** y no
  la etapa, porque un encargo ya traía rama, etapas, color y estado — solo le
  faltaba de qué depende y dónde está puesto.
- **Dos clases de flecha, y hacían falta las dos.** Una flecha siempre dice
  *esto va después de aquello*; lo que cambia es si el encargo además espera.
  «Va después» se ve apagado y la app deja de sugerírtelo, pero lo puedes
  adelantar. «Espera su turno» no deja marcar etapas hasta que terminen sus
  requisitos, y lo dice con un candado. El interruptor vive en el ENCARGO y no
  en cada línea: tocar la línea ya sirve para cortarla, y meter otro blanco
  encima se pelea en el teléfono.
- **Un encargo que espera su turno deja de contar días de estancado.** Sin
  esto el mapa habría vuelto la app injusta: a los 45 días sin tocarlo, un
  encargo que espera —correctamente— a que termine el anterior aparecía en
  «Decisión pendiente» pidiéndote que lo retomaras o lo soltaras. Era la app
  regañándote por hacerle caso al mapa que ella misma dibuja.
- **Las etapas de la lista se ven también en el teléfono.** No es que se
  hubieran perdido: nunca estuvieron. El CSS las apagaba (`.proj-steps`) y
  solo las encendía en escritorio, así que la lista del teléfono decía «1 de 4
  etapas» y para saber cuáles había que entrar al encargo. Ahora salen en fila,
  recortadas a cuatro —las pendientes primero— y el resto en «+N más».
- **Un toque marca una etapa, y otro la desmarca**, desde la propia lista.
  Antes eran cuatro pasos: abrir el encargo, buscarla, marcarla, volver.
- **Y un ＋ etapa que se convierte en un campo ahí mismo.** Al dar Enter la
  etapa se crea y el campo vuelve a quedar listo, porque las etapas se piensan
  en tanda y no de una en una. Sin cuadro y sin cambiar de pantalla.

**Por dentro:** el lienzo no se duplicó. Todo lo que cambia de un módulo a
otro pasa por `figuraDe`, `estadoDeNodo`, `vistaDeRamaDe` y `listaDe`, con una
regla que hay que mantener — si el nodo NO es de Proyectos, cada una devuelve
lo que devolvía antes. Se comprobó midiendo la huella del SVG que dibuja
Talentos antes y después: idéntica, letra por letra, en las seis escenas de
prueba. Y la tarjeta de un encargo dejó de ser un `<button>` (no puede llevar
botones dentro) para pasar a `<div>` con una zona que abre, el mismo reparto
que ya usaban las misiones.

### 0.7.20.2 · 27 ago 2026
Los datos del hero se leen y se alinean, y la prueba se puede juzgar.

- **La fila de nombres estaba escalonada, y era culpa de la fila de flechas.**
  Las columnas sin flecha no reservaban ese renglón, así que su rótulo subía
  14 px: medido en Misiones, «HOY» a 170 y «CUMPLIDAS» a 184. Ahora, si una
  columna del grupo lleva flecha, las demás llevan el hueco vacío — la fila
  existe para las cuatro o para ninguna. Los cuatro heroes quedan con sus
  rótulos al mismo alto, comprobado a 1280, 375 y 320 px.
- **El rótulo de cada dato pasa de 10 a 11,5 px**, de `--muted` a texto normal
  a media luz, y con algo de peso. A 10 px, en mayúsculas, con el gris de lo
  apagado y encima de una ilustración, era la letra más pequeña de la app y se
  leía como decoración. La prueba de que no se leía: se cambió «Pendientes»
  por «Constancia» en los cuatro paneles y no se notó. La flecha sube igual,
  de 9,5 a 11,5, y suelta las unidades («▲ 5» en vez de «▲ 5 XP») para ganar
  ese sitio; lo que compara se sigue leyendo al dejar el dedo encima.
- **Cuatro columnas no caben en un teléfono de 320 px**, y no cabían desde
  antes: la fila pedía 31 px de más y se veía «Habilidade». Por debajo de
  360 px se reparten en dos filas de dos, y cada dato recibe 120 px en vez de
  59. Vale para los cuatro heroes, con la prueba puesta o sin ella.
- **Constancia deja de contar el día de hoy.** Una cuenta creada por la tarde
  veía «0%» antes de haber tenido ocasión de fallar a nada. La partida se
  cierra cuando el día termina, no mientras se juega; hasta que haya un día
  cerrado dice «—». Las marcas de hoy sí siguen contando arriba.

**Y la prueba gana un tercer valor: `?informes=demo`.** Con datos inventados,
porque no se podía juzgar: en una cuenta sin historia no sale ninguna flecha
—no hay periodo anterior con el que comparar, y un cero contra otro cero se
calla— así que la primera vez que se miró parecía que no había cambiado nada.

- Con datos: `https://mi.norata.app/?informes=demo`
- Con los tuyos: `https://mi.norata.app/?informes=si`
- Apagar: `https://mi.norata.app/?informes=no`

Los números falsos no tocan nada tuyo: no se guardan, no pasan por `state` y
solo existen mientras se dibuja. Están elegidos para que se vean las cuatro
caras de una comparación —sube, baja, se queda igual, y no hay con qué
comparar—, y mientras están puestos el rótulo de la pantalla dice que no son
tus datos.

**Al quitar la prueba**, además de lo que ya dice 0.7.20: en `index.html`, el
tercer valor y el `<span class="rp-demo">`; en `css/estilos.css`, las tres
reglas de `.rp-real` / `.rp-demo`; y en `js/10f-informes.js`, `pruebaDemo()`,
`DEMO`, `statsDemo()` y los cuatro `if (pruebaDemo())`. **No** se borran el
tamaño de `.sh-stats .t`, el hueco de `.sh-var` ni las dos filas de 320 px:
ésos arreglan los cuatro heroes, no la prueba.

### 0.7.20.1 · 27 ago 2026
El reparto del XP deja de contar dos veces lo que se devolvió.

- **Las dos tandas que iban en paralelo se pisaban en un sitio, y solo en uno.**
  El motor de informes reparte el XP ganado por familias —misiones, talentos,
  proyectos, práctica— sumando únicamente los movimientos POSITIVOS. Y desde
  0.7.17 hay movimientos negativos con familia: reabrir un encargo devuelve su
  recompensa, igual que deshacer un talento o descumplir una misión. Resultado:
  cerrar y reabrir el mismo encargo tres veces dejaba «300 XP de proyectos» en
  el desglose cuando lo ganado de verdad era cero. `neta` salía bien y el
  desglose mentía, que es peor que fallar en los dos.
- **La regla que lo arregla, y que es la que distingue los dos casos:** un
  negativo CON fuente es una vuelta atrás y se descuenta de su familia; un
  negativo SIN fuente es desgaste por inactividad —`applyDecay` no escribe
  fuente— y se queda solo en `perdida`, porque no viene de ninguna parte y no
  hay a quién restárselo.
- Medido con tres vueltas de cerrar y reabrir: 5 movimientos, suma real +100,
  y el informe dice ganada 300 · perdida 200 · neta 100 · proyectos 100. Antes
  decía proyectos 300.

### 0.7.20 · 27 ago 2026
Las misiones empiezan a guardar la hora, y los paneles aprenden a comparar.

- **Cada marca de misión guarda la hora en que se puso.** Hasta ahora el
  registro solo sabía el día. La hora es el único dato de la app que **no se
  puede reconstruir después** —el día se sabe siempre, la hora solo si estaba
  puesta cuando pasó—, así que se empieza a guardar ya aunque la gráfica que la
  use llegue en meses. Viaja pegada a la propia marca (`…@1435`) y no en una
  lista aparte: la sincronía une las marcas por igualdad de texto, y dos listas
  que hay que mantener a la par acaban desincronizándose. Las marcas viejas no
  la llevan y eso no es un fallo: `horaDeMarca` devuelve null y quien pregunta
  las deja fuera de la cuenta.
- **El motor de los informes** (`js/10f-informes.js`, nuevo): qué pasó en un
  periodo —semana, mes, año, o una ventana rodante de N días— y cómo se compara
  con el anterior, para los cuatro módulos. Solo calcula: no dibuja nada, no
  toca `state` y no ejecuta nada al cargarse. La pantalla de informes se apoyará
  en él, y tiene que leer exactamente los mismos números que los paneles o
  acabarán discutiendo entre ellos delante del usuario.
- **Cumplir una misión vuelve a contar para la racha.** Desde que una marca es
  una lista con identidad propia en vez de un contador, `ms.log[k] > 0`
  comparaba un array con un número y daba falso siempre. No se veía porque una
  misión enlazada a una habilidad sigue marcando el día por su movimiento de XP;
  las que no tienen habilidad llevaban tiempo sin contar para nada.

**Y una prueba con enlace, apagada por defecto.** Los cuatro paneles con
flechas de comparación: los acumulados que solo suben —«XP total», «Etapas
hechas», «Por abrir»— dejan sitio a lo que se movió en los últimos siete días,
y cada número trae su flecha contra los siete anteriores.

- Encender: `https://mi.norata.app/?informes=si`
- Apagar: `https://mi.norata.app/?informes=no`

Vive en `sessionStorage` y no en localStorage: al cerrar la pestaña desaparece,
para que no se quede pegado como si fuera un ajuste. Quien no pida la prueba ve
el panel de siempre.

**Al quitarla hay que borrar, por nombre y no por rango:**

1. `index.html` — el bloque `---- Prueba de las flechas de los paneles ----`
   del script de arriba, y el `<div class="rotulo-prueba" id="rotulo-informes">`.
2. `css/estilos.css` — el bloque `---- Rótulo de una prueba con enlace ----`,
   la variable `--piso-rotulo-prueba`, y la regla `html.informes .sh-stats .t`
   (si la prueba se queda, esa regla pierde el `html.informes` y se queda:
   es lo que mantiene alineadas las cuatro columnas cuando los rótulos ocupan
   dos renglones).
3. `js/10f-informes.js` — la función `pruebaInformes()`.
4. Los cuatro `pruebaInformes() ? … : …` de `js/05-resumen.js` (uno) y
   `js/06-detalle.js` (tres): se queda la rama que Eduardo decida, y se borra
   la otra con su comentario.

Lo que **no** se borra: el motor, la hora de las marcas, el arreglo de la racha
y `.sh-var` en el CSS.

### 0.7.19 · 27 ago 2026
Un proyecto deja de llamarse encargo, y Pro deja de llamarse solo Pro.

- **Proyecto, encargo y etapa dejan de ser la misma palabra.** La pantalla
  vacía de Proyectos describía un proyecto —«algo que estás construyendo y que
  avanza»— y lo llamaba *encargo*; el tutorial repetía la misma frase con el
  mismo cruce. La jerarquía que fijó Eduardo:

      rama de proyectos  →  encargos  →  etapas

  Con el detalle que lo hace entendible: **una rama de proyectos, una vez
  creada, se llama proyecto.** Se crean ramas y se tienen proyectos — por eso
  el cuadro dice «Nueva rama de proyectos» y el aviso de después dice
  «Proyecto "Mudanza" creado». No es una inconsistencia, es el ciclo de vida
  de la misma cosa. Los encargos son las tarjetas de dentro —«son como
  quests», palabras suyas— y las etapas, los pasos de cada quest.

  Él mismo avisó de que suena raro y de que parece faltar un eslabón. Se queda
  así a propósito: es como entiende hoy el asunto, y el vocabulario de la app
  tiene que ser el suyo y no uno más ordenado que no usa nadie.
- **El botón grande crea el contenedor, no lo de dentro.** «Crear mi primer
  proyecto» abría el formulario de un encargo, así que el primer gesto de la
  pantalla ya enseñaba los dos nombres cambiados. Ahora crea la rama de
  proyectos, y sus encargos se añaden con el ＋ de su tarjeta — la misma regla
  que ya regía en Talentos y en Misiones. El botón de la barra dice «Nueva
  rama» en los dos módulos y el nombre largo va en el cuadro, porque en el
  botón ya se sabe en qué pantalla estás.
- **«Sin tope» pasa a «Ilimitados».** Lo pidió él y tiene razón: «sin tope»
  describe la ausencia de una traba, o sea habla del límite y no de lo que
  abres, y en una lista que existe para convencer cada renglón tiene que decir
  lo que ganas. Ramas y talentos se separan además en dos renglones: iban
  juntos en uno solo —«Ramas y talentos sin tope»— y era la línea que más pesa
  contada de la forma más floja.
- **El plan de pago se llama Norata Pro donde se presenta.** «Pro» a secas es
  un adjetivo, no un nombre: no es Disney+ ni Spotify Premium, marcas que ya
  significan algo antes de leer la frase. Un botón que decía «Quiero Pro» le
  pedía a la persona que adivinara de qué producto le hablaban justo en el
  segundo en que decide si paga. El nombre completo va en el cuadro del tope,
  el botón y el rótulo; «Pro» a secas se queda dentro de la pantalla del plan,
  donde el contexto ya lo dijo.
- **La lista del tope tenía tres palomitas y ningún rótulo encima**, así que no
  decía de qué eran. Ahora lleva «LO QUE ABRE NORATA PRO», que además es donde
  el nombre aparece por primera vez.
- **Y el botón de comprar ya no se va bajo el pliegue.** Medido a 375×480: la
  tarjeta pedía 484 px y cabían 455, así que los dos botones quedaban 28 px por
  debajo del borde — se alcanzaban desplazando, en la única pantalla que existe
  para vender. Ahora van pegados abajo y el texto se desplaza por detrás.

### 0.7.18.1 · 27 ago 2026
El tope del plan deja de parecer un borrado, y el ático deja de venderse.

- **Fuera el ático de todo lo que se cobra.** Se prometía en cinco sitios —la
  tabla comparativa, «qué tienes ahora», la lista de lo que abre Pro, la
  pantalla de volver de pagar y el párrafo de Ajustes— y **la función no
  existe**: el ático no filtra por año ni tiene por dónde hacerlo. Era la
  única fila que además restringía VER en vez de CREAR, justo lo que el
  encabezado de este archivo dice que nunca debe existir («si algún día
  aparece un `puedeVer(...)`, algo se torció»). Se va también `LIMITES.atico`,
  no solo la fila: un tope que no lee nadie es la segunda verdad de la que
  avisa `LIMITES`, esperando a que alguien la cablee sin preguntar. Lo decidió
  Eduardo al verlo. Quedan cuatro promesas y dos están construidas —ramas y
  talentos—; los resúmenes del mes y del año y las apariencias siguen
  pendientes, y él está en ello.
- **El cuadro que aparece al topar con un límite era el mismo `ask()` que
  confirma un borrado**: misma caja, mismos dos botones, y una frase que
  describía el tope. Aparece en el instante de mayor intención de compra que
  tiene la app —alguien que está usando Norata y quiere seguir ahora— y lo
  contestaba con una ficha técnica. Ahora lleva **título, icono, lo que abre
  Pro y el precio**, y el título habla de lo que la persona acaba de hacer
  («Llenaste esta rama») y no de lo que no puede hacer. Los botones pasan de
  «Ver Pro» a «Quiero Pro».
- **Las cuatro ventajas salen de comparar `LIMITES.pro` con `LIMITES.libre`**,
  no escritas a mano: es el único texto de la app que se lee con la cartera en
  la mano y no puede contradecir a la tabla comparativa.
- **Tercer tono para el modal, `menta`**, junto a coral y oro. No tiembla ni
  brilla a propósito: el temblor es para lo que se rompe. El tono ya no se
  comprueba con un `=== "oro"` sino que viaja como clase, así que el siguiente
  no obliga a volver a tocar `askBase`.
- **La pastilla de la lista se hundía en el modo claro** y lo cazó la medición,
  no la vista: `--mint-soft` levanta respecto al fondo de la página pero no
  respecto a la tarjeta, que es donde se apoya. De día usa `--card2`, el único
  tono que levanta en los dos modos. El verde lo ponen las palomitas.
- El cuerpo del cuadro va todo en `<span>` aunque sea un párrafo y una lista:
  `#modal-msg` es un `<p>`, y un `<p>` o un `<ul>` dentro de otro `<p>` los
  saca fuera el navegador y desarma la caja sin dejar rastro en el CSS.

### 0.7.18 · 27 ago 2026
El panel de números, mucho más informativo. Cinco cosas nuevas y un arreglo
que cambia lo que decía una cifra.

**El arreglo: «qué versión corre la gente» estaba mintiendo.** Contaba los
pulsos de siete días agrupados por versión, y eso daba un retrato falso: una
sola persona que hubiera abierto la app en tres aparatos aparecía tres veces,
y seguía apareciendo en aparatos donde ya había cerrado la sesión — el pulso
quedó escrito ese día y no se borra. Lo cazó Eduardo mirando sus propios
números. Ahora es **una fila por persona: la última versión que vio**.

**El embudo**, de registrarse a seguir esta semana. Cada paso es un trozo del
anterior y lleva escrito cuánta gente se pierde respecto al de arriba, en vez
de dejarlo deducir: «de 41 a 33» obliga a hacer la cuenta cada vez que se mira.

**Dos donas**: desde qué aparato y si está instalada o en el navegador. Se
dibujan con `stroke-dasharray` sobre un círculo y no con arcos calculados a
mano — son cuatro números en vez de trigonometría, y no hay redondeo que deje
una rendija entre dos gajos. Con más de cuatro trozos habría que usar barras:
un pastel de ocho gajos no lo lee nadie.

**La constelación gana una segunda serie y sus referencias.** Las barras del
fondo son cuentas nuevas y los puntos personas que abrieron; las líneas
verticales caen en **lunes**, que es lo que permite comparar una semana con la
anterior — una marca cada tres días sueltos no sirve para eso. La de hoy va
entera y las demás punteadas, porque el último día casi siempre está a medias.

**Los catorce días van siempre completos**, ceros incluidos, con
`generate_series`. Antes solo llegaban los días con actividad y la gráfica
mentió sin que se notara: dos días sueltos con una semana de silencio en medio
se dibujaban pegados, como si fueran consecutivos.

**Cifras nuevas**: cuentas sin confirmar el correo, cuentas que nunca abrieron
la app, cuentas que pidieron borrarse, días de uso por persona y aperturas de
la semana. Las tres primeras salen en una tira de avisos **que solo aparece si
hay algo que mirar**: una fila de ceros permanente enseña a no mirarla, y
entonces el día que deja de ser cero tampoco se mira.

**Antes de escribir un solo color se comprobó cada variable contra
`css/estilos.css`.** Es la leccion de 0.7.6.3, donde un `var(--menta)` que aqui
se llama `--mint` pintó la gráfica entera de negro sin dar ningún error.

### 0.7.17 · 27 ago 2026
El ejemplo se mira y ya no se instala, un encargo no se cobra dos veces, y una
rama recién creada deja de perderse al sincronizar.

La segunda mitad de la revisión: Misiones, Habilidades, Proyectos, el ático,
el resumen y la sincronía. Dos fallos, los dos de los que se llevan progreso
por delante — y el ejemplo, que dejó de escribir.

- **«Ver un ejemplo completo» es ahora un previsualizador de verdad.** Antes
  escribía: metía catorce talentos, tres ramas, seis habilidades y cuatro
  misiones en la cuenta, guardaba, y **las subía al servidor**. Sin vuelta
  atrás: para deshacerlo había que ir a Ajustes y borrarlo todo, que se lleva
  por delante también lo que fuera tuyo. Y en plan Gratuito te dejaba con tres
  ramas cuando el tope es una, así que arrancabas pasado del límite el primer
  día. Ahora el estado real se aparta en memoria, el ejemplo se enseña encima
  con lienzo limpio —sin mezclarse con lo tuyo— y al salir vuelve todo como
  estaba. Lo decidió Eduardo: *«nunca altera lo que ya está en la memoria de la
  cuenta del usuario, ya que solo es un previsualizador»*.
- **El candado está en las dos puertas de salida, no en cada botón.** En
  `guardarLocal` (el disco) y en `syncTouch` y `syncRun` (el servidor). Es a
  propósito: dentro del ejemplo se puede tocar TODO —cumplir misiones, mover el
  árbol, abrir cajas—, que es justamente lo que se viene a probar, y taparlo
  acción por acción sería una lista que se queda corta en la primera pantalla
  nueva. `syncRun` importaba más de lo que parecía: por ahí pasan las siete
  puertas de la sincronía, y cerrando solo `syncTouch` bastaba con entrar al
  ejemplo y cambiar de pestaña para que se subiera.
- **Un rótulo amarillo arriba con el botón de salir**, el mismo trato que el de
  «Cuenta de pruebas» y el mismo color a propósito: es el color con el que la
  app avisa de que lo que se ve no es real, e inventarle otro haría creer que
  son avisos de distinta clase. Si están los dos puestos, el de pruebas baja
  38 px para no quedar montado. Y el botón se agrandó a 27 px de alto: es la
  única salida, y fallar el toque ahí deja a alguien mirando datos ajenos.
- **Recargar a media prueba también sale.** No hace falta nada especial: como
  nunca se escribió, lo que carga del disco es lo real.

- **Terminar un encargo pagaba el XP CADA VEZ.** Reabrirlo y volver a cerrarlo
  lo cobraba otra vez, sin límite: uno de 300 XP daba 600 con una sola vuelta
  y 3.000 con diez. Era el atajo más cómodo que tenía la app para inflar una
  habilidad sin hacer nada. Los otros dos módulos ya lo hacían bien y este se
  había quedado atrás —`revertirTalento` devuelve el XP y el dinero, y sacar
  una misión de las terminadas deshace lo cumplido—, así que ahora los tres
  siguen la misma regla: **deshacer dice que aquello no llegó a pasar.** Y se
  avisa en el propio cuadro de confirmación, antes de decidir, no después.
  De paso, la fecha de término se limpia al reabrir: un encargo activo con
  fecha de cierre se colaba en el historial como si siguiera cerrado.
- **Una rama vacía creada en un aparato desaparecía al sincronizar.** La
  fusión clona el lado que guardó después, así que `ui` entero venía del más
  nuevo y lo del otro se tiraba. Solo se notaba con las vacías —en cuanto una
  rama tiene un talento dentro, `ramasDe()` la vuelve a apuntar—, y era justo
  la recién creada: la haces en el teléfono, abres la computadora, y ya no
  está. En silencio. Ahora las dos listas de ramas se unen, como todo lo demás
  en ese archivo. El precio, aceptado a sabiendas: una rama vacía borrada
  puede reaparecer si el otro aparato aún no se había enterado. Resucitar una
  rama vacía cuesta un clic; perder una recién creada cuesta trabajo. Los
  talentos que llevaba dentro no vuelven — ésos sí tienen lápida.
- **Lo que se revisó y está bien**, para no volver a mirarlo: el XP de las
  misiones no se fuga al arrastrarlas entre columnas ni al terminarlas y
  sacarlas (probado con tres vueltas); las habilidades respetan el techo del
  nivel 10, no bajan de cero, y las permanentes no decaen; el ático conserva
  el XP al guardar y al desplegar; exportar e importar es ida y vuelta sin
  pérdida; y la fusión sigue siendo idempotente, simétrica y con las lápidas
  intactas después del cambio.

### 0.7.16 · 27 ago 2026
Los botones dejan de ser todos verdes, y Talentos vuelve a dejarse editar.

- **Nomenclatura de color, seis niveles**, y la pregunta que los separa es «¿qué
  me pasa si lo pulso sin querer?». Dos clases nuevas: **`btn-linea`** (fondo
  oscuro, borde menta) para lo que solo mira, consulta o lleva a otro sitio, y
  **`btn-aviso`** (luciérnaga) para lo que toca dinero o algo delicado pero se
  deshace. La regla al dudar entre `soft` y `linea`: **¿ese botón escribe algo?**
  Si solo enseña, es `linea`. Queda escrita en `CLAUDE.md`.
- **El reparto, botón por botón.** «Ver mi recibo» y «Comparar los planes» pasan
  a `linea` —no cambian nada—; «Editar suscripción» a `aviso`. «Exportar
  respaldo» a `linea` y **«Importar respaldo» a `aviso`**, que es el que
  reemplaza todos tus datos y estaba pintado igual que exportar. Los del panel
  de números, todos a `linea`: ahí solo se consulta.
- **«Cerrar sesión» deja de ser coral.** No destruye nada —tu progreso sigue en
  tu cuenta y vuelves entrando— y estaba pintado igual que «Borrar mi cuenta»,
  que sí es para siempre. Dos cosas muy distintas con el mismo color, una al
  lado de la otra. Ahora es `aviso`.
- **Lo que NO se tocó, a propósito:** los botones de Misiones, Talentos,
  Proyectos y los formularios. Ahí el reparto ya era correcto —primary para
  guardar, danger para borrar, ghost para cancelar— y recolorear a ciegas
  pantallas que no estoy viendo es la forma más rápida de empeorarlas.
- **El precio dejaba de estar dos veces en tres centímetros.** Salía en la
  cabecera del plan y otra vez en «Qué pagas» justo debajo. Repetido así no
  informa dos veces, ensucia una. La cabecera se queda con qué plan es y qué le
  pasa; la cifra vive en los renglones de recibo. Sigue en la cabecera en los
  dos casos que no tienen recibo debajo: el Gratuito y la cuenta de casa.
- **La tabla de planes, toda a la izquierda.** Los encabezados estaban centrados
  y los valores no, así que el rótulo no caía encima de su columna sino en medio
  de la nada. Ahora cada rótulo empieza donde empiezan sus respuestas — medido:
  cuadran al píxel.
- **Y los avisos del pie, centrados**, que es lo contrario y por el mismo
  motivo: ahí no hay columnas con las que alinearse, son dos frases sueltas
  debajo de un botón que ocupa todo el ancho.

Una revisión a fondo de Talentos que empezó por «no puedo entrar a pantalla
completa» y acabó encontrando tres fallos más, dos de ellos gordos. Todos se
cazaron **midiendo el DOM**, ninguno mirando la pantalla.

- **Editar el mapa reventaba.** El dibujado del puerto ▸ —el punto del que se
  tira para conectar dos talentos— usaba una variable que no existe en ese
  ámbito (`colT`, que vive cien líneas más abajo). Solo se ejecuta con el mapa
  EN EDICIÓN, así que al entrar a editar una rama el SVG se cortaba a medias y
  se llevaba por delante el resto de la pantalla. El parámetro se llama ahora
  `colL` y dice lo que es: un color de línea, ya pasado por `trazo()`.
- **Pantalla completa en una rama vacía no hacía nada.** Ni se abría, ni
  avisaba, ni fallaba: se encendía y se apagaba en la misma vuelta, porque el
  dibujado confundía «vacía» con «borrada». Y es justo cuando más se toca esa
  opción — acabas de crear la rama y vas a llenarla. Ahora se abre y enseña
  qué hacer, igual que en la lista; solo se cierra si la rama ya no existe.
- **Y al borrar la última rama estando dentro**, la capa se quedaba encima
  enseñando una rama fantasma: `renderFullscreen()` vivía después de la salida
  rápida de `renderTree`. Se salía con Escape, pero lo que se veía era mentira.
- **Un apóstrofo en el nombre de una rama dejaba muerta su tarjeta entera.**
  `escapeAttr` convierte la comilla en `&#39;`, el navegador la deshace ANTES
  de leer el JavaScript, y `abrirRama('Rock'n'roll')` es un error de sintaxis:
  dejaban de funcionar a la vez pantalla completa, renombrar, plegar, editar,
  borrar y crear, sin que nada avisara. Nace `enJS()` para el texto que va
  dentro de las comillas simples de un `onclick`, y `escapeAttr` se queda para
  los atributos normales. Vale también para Proyectos y para las categorías.
- **Los topes del plan Gratuito no los aplicaba nadie.** `cabeUnoMas` y
  `planMensaje` estaban escritas, documentadas y pintadas en la tabla
  comparativa desde 0.7.13, y **ninguna pantalla las llamaba**: se podía crear
  sin límite en las cuatro puertas —el teclado, el menú del clic derecho,
  duplicar y el formulario— y abrir todas las ramas que se quisiera. Ahora las
  cuatro preguntan, y `topeAlcanzado()` es el único sitio desde el que se
  avisa: dice qué hay y ofrece ir a ver Pro. Editar lo que ya existe no se
  toca nunca — congelar, nunca quitar.
- **Enfriamiento de medio segundo en Q, W y E.** `e.repeat` solo frenaba la
  tecla sostenida; repicándola —que es lo que hace cualquiera al probar el
  atajo— se sembraba la rama de decenas de talentos en dos segundos, cada uno
  con su guardado, su repintado y su paso de deshacer. Sin aviso a propósito:
  un atajo que no hizo nada por ir demasiado rápido se entiende al segundo
  intento, y un mensaje por cada tecla sería peor que el problema. La C no se
  enfría, que no crea nada.

### 0.7.15 · 27 ago 2026
La cuenta de casa es fundadora, y el lila enciende.

- **La cuenta administradora tiene Fundador puesto**, sin haber pagado. Hacía
  falta por lo práctico —no se puede revisar la app entera topando con los
  límites cada dos pantallas— y se hace en el navegador y no con una fila en
  `suscripciones`. **El motivo de no tocar la base de datos es de negocio, no
  de código:** esa fila contaría como una venta en el MRR, sumaría uno a
  «pagando ahora» y **gastaría uno de los 200 lugares de fundador**. Un plan
  regalado no es una venta y no puede parecerlo en el panel donde se mira si
  esto se sostiene.
- **`deCasa` lo distingue de un fundador de verdad**, y eso cambia lo que dice
  la pantalla: donde iría «$890 MXN, una sola vez» pone «Cuenta
  administradora», y la nota dice que no hay ningún cobro asociado. Sin eso, la
  única pantalla de la app que habla de dinero le estaría diciendo que pagó
  algo que no pagó. Tampoco se le pintan los renglones de recibo ni el botón
  del portal de Stripe: no hay recibo que ver.
- **El modo de pruebas manda sobre esto.** Si hay un plan simulado puesto, gana
  la simulación — si no, la trastienda no podría mirar nunca la app como la ve
  todo el mundo.
- **`planRefrescar()`**, porque el orden no ayudaba: `planCargar` corre antes de
  que el servidor conteste quién es administrador, así que decidía el plan sin
  saberlo. Ahora `revisarAdmin` vuelve a decidirlo cuando llega la respuesta.
- **Resplandor lila** detrás del aro del avatar y de la tarjeta del plan. Es el
  de los cuadros de borrar cuenta —mismo tamaño, misma suavidad— pero
  **quieto**: allí late porque avisa de algo que hay que decidir; aquí es una
  insignia que está siempre en pantalla, y algo que parpadea sin parar delante
  de los ojos deja de leerse como un premio y empieza a leerse como un
  problema.
- **De día no hay resplandor**, que es la regla de la casa y no un olvido: una
  copia borrosa sobre carbón es luz, sobre papel es una mancha. `--lila-halo`
  pasa a `transparent` en claro, así la regla que lo usa es una sola.

### 0.7.14.2 · 27 ago 2026
El plan, en la primera carga y no en la segunda.

- **Entrar con una cuenta de pago mostraba «Gratuito» hasta recargar a mano.**
  Misma cirugía mal rematada que el fallo anterior: el `return` que puse en
  0.7.14 para la adopción de la sesión **cortaba el arranque entero**, así que
  en esa primera carga no corrían **ni `planCargar()` ni `revisarAdmin()`** —el
  plan se quedaba en el «libre» de fábrica y la sección de administración
  tampoco aparecía—. Fuera el `return`: ahora la adopción es una rama, no una
  salida, y todo lo que va detrás corre por los dos caminos.
- **Y el plan se espera ANTES de pintar**, solo por ese camino. En el arranque
  normal se pide sin esperar porque hay una copia guardada de la vez anterior
  que sirve para dibujar ya; pero quien acaba de entrar puede estar estrenando
  dispositivo, y ahí no hay copia. La espera se mete dentro de una que ya
  estaba —la pantalla de carga la puso la puerta al mandarnos—, así que no
  añade tiempo.
- **Con tope de seis segundos**, que es lo que hace que esperar ahí sea seguro:
  `fetch` no trae ninguno y una petición que ni contesta ni falla dejaría a
  alguien mirando «Entrando…» para siempre, justo después de escribir su
  contraseña. Cumplido el plazo se entra igual y el plan se enciende al llegar.
- El desgaste (`applyDecay`) también se había quedado fuera de ese camino.

### 0.7.14.1 · 27 ago 2026
La puerta se olvidaba de guardar la sesión.

- **Entrar dejaba a todo el mundo atorado en el login**, y la causa cabe en una
  línea: `portadaEntrar` deja la credencial en `sync.cfg` **y nada más**. Quien
  la escribía en el aparato era `saveSync()`, desde el final de lo que en
  0.7.14 pasó a ser `adoptarSesion` — o sea, del otro lado del reboto. Así que
  la puerta mandaba a la app, la app no encontraba sesión guardada, rebotaba de
  vuelta a la puerta, y así para siempre. Ahora la puerta guarda **lo mínimo
  para que `syncReady()` diga que sí** (`enabled` y `entrada`) antes de mandar;
  el resto lo sigue poniendo `adoptarSesion`, y **`sync.dueño` se sigue sin
  tocar allí**, que es lo que le permite a la app darse cuenta de que se entra
  con otra cuenta.
- **Y el fallo estaba escrito en un comentario que decía lo contrario:** «la
  sesión ya está escrita en el aparato (la escribió `sbEntrar`)». No era
  verdad, no se comprobó, y era la línea que sostenía todo el reboto.
- **Cortafuegos del rebote.** Esta es la puerta de la app y no puede quedarse
  dando vueltas pase lo que pase: al tercer viaje se deja de rebotar y el
  formulario se pinta dentro de la app, como antes de 0.7.14. Se pierde la
  separación de pantallas, que es un lujo; no se pierde la forma de entrar, que
  no lo es. La cuenta se borra en cuanto se llega a algún sitio.
- Cerrar sesión sí llevaba a `/login/` — probado en el ciclo completo. Lo que
  se vio antes era la pestaña con la versión anterior todavía cargada.

### 0.7.14 · 27 ago 2026
La puerta se muda a su propia dirección.

- **El login vive en `/login/`** y ya no es una capa encima de la app. Antes se
  cargaban los diecisiete archivos y se dibujaban las cinco pantallas para
  poner encima una tapa con dos campos: quien todavía no tenía cuenta pagaba el
  arranque entero de una aplicación que no podía usar. La puerta carga **seis
  archivos**, y se pudo hacer porque ninguno de ellos ejecuta nada al cargarse
  —todos son declaraciones—, así que traerlos no enciende la app por accidente.
- **`portadaEntrada` se partió en dos, y ahí está toda la gracia.** La primera
  mitad —comprobar si la cuenta está pendiente de borrado y guardar la sesión—
  no necesita nada de la app. La segunda —`adoptarSesion`: bajar el progreso,
  apartar lo de otra cuenta con `stashConflict`, pintar— necesita `state`,
  `syncRun` y las vistas. La puerta hace la primera y manda a la raíz; la app
  hace la segunda al recibir la marca. **No se duplicó una sola línea.**
- **La marca del reboto va en `sessionStorage`, no en la dirección.** Por la
  dirección viajaría a la barra, al historial y a lo que se copie al compartir,
  y lo que hay que pasar es «acaba de entrar», que no es asunto de nadie más.
- **`sync.dueño` NO se toca en la puerta**, y esto era una trampa fina: si la
  puerta lo escribiera, la app encontraría el dueño ya puesto y no detectaría
  que se está entrando con otra cuenta — se mezclarían los datos de las dos en
  vez de apartarlos. Lo escribe `adoptarSesion`, que es quien puede hacer algo
  al respecto.
- **`irALaPuerta()`**, un solo sitio que sabe dónde está el login. Lo usan
  cerrar sesión, el botón de Ajustes sin cuenta y la despedida. Ningún botón
  conoce la dirección: el día que se mueva otra vez, se mueve ahí.
- **Los enlaces de los correos ya mandados siguen funcionando.** Apuntan a la
  raíz y van a seguir llegando durante meses: `sbVolverDeEnlace` y el atajo
  `#olvide` se quedan también en el arranque de la app, y el reboto a la puerta
  se frena cuando el que llega viene de un enlace —mandarlo a `/login/`
  perdería por el camino lo que el enlace traía.
- **Dos arreglos que solo se ven desde la puerta.** El logotipo se pedía con
  ruta relativa y desde `/login/` resolvía a `/login/marca/…`: un 404 y el logo
  roto en la primera pantalla que ve alguien. Y «Probar sin cuenta» cerraba la
  portada para destapar una app que allí no existe, dejando el fondo vacío;
  ahora viaja a la raíz.
- **Sin `manifest` en la puerta**, a propósito: el que se instala es la app. Con
  el manifest allí, quien instalara desde el login se llevaría un acceso directo
  que abre el formulario de entrar para siempre, incluso con la sesión puesta.
- Requiere `https://mi.norata.app/login/` en *Redirect URLs* de Supabase.
  Eduardo lo añadió antes de subir esto.

### 0.7.13 · 27 ago 2026
Fundador tiene color propio, y dos pantallas que faltaban.

- **Fundador pasa del amarillo al lila.** El amarillo ya significa «mira esto»
  en toda la app —un plan que se cancela, un recibo que no se pudo cobrar, la
  trastienda del negocio— y usarlo también para el plan bueno obligaba a leer
  el contexto para saber si era premio o problema. El lila no dice nada más en
  Norata, así que puede decir esto. Sale del octavo de la paleta que ya existía
  (`--paleta-4`), así que no es un color nuevo en la casa.
- **El lila se parte en dos como los demás acentos.** De día el lila vivo
  escrito sobre papel da 4,42 —por debajo del 4,5 que pide un texto—, así que
  para escribir se hunde a `#5b32c0` (6,99 sobre la tarjeta clara) y para
  rellenar se aclara a `#9b6bff`, el único que admite la tinta oscura de
  `--sobre-macizo` con holgura (5,18). Con el vivo tal cual, la tinta encima
  daba 3,67 y la pastilla no se leía.
- **La columna de Fundador deja de ir entera en color.** Si todo destaca, no
  destaca nada — y teñía de premio ocho filas que dicen exactamente lo mismo
  que la columna de al lado. El texto vuelve a ser blanco y solo se marcan las
  dos celdas donde Fundador dice algo que ningún otro plan dice.
- **«Es gratis» y «Pago único»**, en vez de «No se paga» y «Una sola vez». La
  primera dice lo que hay y la segunda lo que no pasa; y «Pago único» es como
  se nombra en el sitio, así que había tres formas de decir lo mismo.
- **Las tres piedras, encima de sus columnas.** Es el mismo dibujo que sale en
  la ficha del mini menú y en la cabecera del plan, así que la tabla se
  reconoce sin leer.
- **Dos tarjetas destacadas, diciendo cosas distintas.** «Recomendado» vuelve
  al anual —de los que se renuevan, es el que sale mejor, y esa comparación se
  puede hacer— y Fundador lleva «Tiempo limitado» en lila. No compiten: el
  primero contesta «¿cuál me conviene?» y el segundo «¿hasta cuándo puedo?».
- **«Qué se desbloquea con Pro»**, y el aviso del portal partido en dos
  párrafos: dónde vas es una cosa y dónde acaban tus datos bancarios es otra.

**Y las dos pantallas que faltaban:**

- **Volver de pagar.** Era un aviso de abajo de cuatro segundos —«Gracias. Tu
  plan se está activando»— para el único momento de la app en el que alguien
  acaba de pagar: se lo perdía quien mirara al teléfono medio segundo tarde, y
  no contestaba «¿ya está?, ¿qué tengo ahora?». Ahora es una pantalla que se
  queda hasta que se cierra, con la piedra del plan y **lo que se acaba de
  desbloquear leído de `LIMITES`**. Tiene **dos estados a propósito**: Stripe
  avisa al servidor por un lado y devuelve a la persona por otro, y a veces
  gana ella —llega antes de que el webhook escriba la fila—. Así que abre
  diciendo que confirma, y `planReintentar` la resuelve; si a los 31 segundos
  el aviso no llegó, lo dice sin alarmar, porque el cobro sí se hizo.
- **La despedida al borrar la cuenta**, en lugar del formulario de entrar.
  Ofrecerle iniciar sesión a quien acaba de pedir que le borren la cuenta es
  invitarle a deshacer lo que acaba de hacer, y la fecha del plazo —lo único
  que hay que recordar— iba en un aviso que dura cuatro segundos. Es un modo
  más de la portada (`adios`), saluda por su nombre —cogido ANTES de vaciar el
  perfil, que si no ya no está— y tiene dos salidas: volver a entrar (que es
  además cómo se recupera la cuenta dentro del plazo) y `www.norata.app`.

### 0.7.12.1 · 27 ago 2026
Un solo aviso donde había dos, y el botón que espera lo dice.

- **El pie legal va centrado.** Alineado a la izquierda se leía como un párrafo
  más de la pantalla; centrado bajo las tres tarjetas se lee como lo que es, el
  pie de esa tabla de precios.
- **Con plan vigente salían DOS avisos seguidos y ninguno servía.** El primero
  contaba lo mismo que el botón que tenía encima. El segundo era el pie legal de
  las tarjetas —IVA incluido, pagos por Stripe, cifrado— puesto en una pantalla
  **donde no se exhibe ningún precio**: informaba de las condiciones de una
  compra que no está ocurriendo. Los dos fuera.
- **En su lugar, a dónde lleva el botón.** Es lo único que hacía falta decir
  antes de pulsarlo: sales de Norata y aterrizas en un sitio con otro nombre y
  otro aspecto, y encontrar los datos de tu tarjeta en una página que no
  reconoces asusta con razón. El texto lo pidió Eduardo **formal**, que es una
  excepción deliberada al tono de la app: donde se habla de dinero, la cercanía
  suena a quitarle importancia a algo. Se sigue tuteando. La frase se arma con
  el nombre del botón, así que en Fundador dice «Ver mi recibo» y habla del
  comprobante en vez de la renovación.
- **«Cargando…» con una rueda girando**, en vez de «Abriendo…» a secas. Un botón
  apagado que solo cambia de palabra se puede leer como que se rompió, y esto
  tarda un segundo largo: hay una llamada al servidor y después un cambio de
  página entero. `botonEsperando()` guarda el **HTML** y no el texto, para no
  dejar pelado un botón que lleve algo dentro. Lo usan los dos caminos que van a
  Stripe —el portal y las tres tarjetas de Elegir—, porque son el mismo gesto y
  dos comportamientos distintos para lo mismo se acaban notando.
- La rueda hereda `currentColor`, así que sale menta sobre el botón suave y
  oscura sobre el macizo sin una sola regla de color; y con movimiento reducido
  **se esconde** en vez de quedarse quieta — un aro partido e inmóvil parece un
  icono roto, y la palabra ya dice lo que pasa.

### 0.7.12 · 27 ago 2026
El modo de pruebas se muda a la trastienda, y trae los planes puestos.

- **Ver la app como si tuvieras otro plan.** Ocho estados —Gratuito, Pro
  mensual, Pro anual, Fundador, y los tres que no se pueden provocar a
  voluntad: cancelándose, sin pagar y terminado—. No se pueden tener las tres
  membresías compradas a la vez, y sin esto la única forma de ver esas
  pantallas era esperar a que le pasaran a alguien. **No abre nada:** cambia lo
  que la app DIBUJA, no lo que el servidor cree; las ramas de más siguen sin
  poder crearse contra la base de datos. Vive en `sessionStorage` —aguanta una
  recarga, para poder navegar mirando, y muere al cerrar la pestaña— y **nunca
  toca la copia de `localStorage`**: si llegara ahí, cerrar la pestaña te
  dejaría creyéndote fundador una semana (ver `PLAN_CADUCA`).
- **`PLAN_REAL`**, que es lo que dijo el servidor sin la simulación encima. Sin
  un sitio donde siga estando la verdad no se puede volver a ella sin preguntar
  otra vez. Fuera del modo de pruebas los dos valen lo mismo siempre.
- **El modo de pruebas ahora cuelga de ser administrador**, y su interruptor se
  fue de «Mi perfil» a «Norata por dentro». El botón estaba a la vista de
  cualquiera y era un botón raro: nadie más que Eduardo tiene dos cuentas de
  Norata, así que a todo el mundo le preguntaba algo que no le pasa — y el «sí»
  de ese botón **quita la confirmación de borrar**. Ofrecerle eso a un
  desconocido es ofrecerle la forma más rápida de perderlo todo.
- **Dos cierres para que no se pueda mirar una app que miente sin avisar.**
  Apagar el modo se lleva por delante el plan simulado; y si el servidor
  contesta que esta cuenta ya no es administradora, `revisarAdmin` borra la
  simulación que hubiera guardada. El rótulo de arriba es lo ÚNICO que avisa, y
  cuelga de lo mismo: sin rótulo, no hay simulación.
- **El rótulo dice las dos cosas**: «Cuenta de pruebas · viendo como Fundador».
  Con el plan simulado, «Cuenta de pruebas» a secas se queda corto — lo que
  engaña no es la cuenta, es el plan, y hay que poder leerlo sin abrir Ajustes.
- **`administracion.sql` gana la receta de mudarse de cuenta** (apartado 5). El
  orden importa y equivocarse deja la app sin ningún administrador: el `insert`
  saca el id de `auth.users`, así que si la cuenta nueva todavía no ha entrado
  nunca a Norata añade **cero filas sin dar error**, y el `delete` que va
  después te deja fuera.

### 0.7.11 · 27 ago 2026
Los planes se llaman como se llaman, y por fin se pueden comparar.

- **Gratuito, Pro y Fundador.** Se acabaron el «plan libre» y el «plan
  completo», que eran dos nombres más para lo mismo y no se correspondían con
  nada de lo que se cobra. Mensual y anual son el MISMO Pro —lo que cambia es
  cada cuánto se cobra, no lo que se abre—, así que las tarjetas dicen «Pro
  mensual» y «Pro anual»: con los nombres sueltos parecían dos productos y
  había que leerse las dos enteras para descubrir que traen lo mismo.
- **Los precios llevan MXN escrito.** Un «$69» a secas lo lee cada quien en su
  moneda, y en dólares Norata parece costar mil trescientos pesos.
- **Pie legal en bolitas**: IVA incluido · Pagos procesados por Stripe · Datos
  cifrados de extremo a extremo. En una frase corrida se leía como relleno.
  Sale de una sola función y va en los dos lados de la sección — quien ya paga
  tiene el mismo derecho a acordarse de que el IVA está dentro.
- **«El que sale mejor» → «Recomendado», y pasa a Fundador.** Lo primero sonaba
  a rebaja de tienda; lo segundo señalaba al anual, que sale mejor solo si
  comparas mes contra mes. Fundador gana por otra razón: no es una suscripción,
  no se renueva, no hay nada que cancelar y no puede subirle el precio.
- **Fuera el contador de lugares.** El cupo no se hace público por ahora. La
  tarjeta sigue diciendo que existe, sin la cifra; `lugaresDeFundador()` se
  queda viva porque la landing la usa.
- **«Editar suscripción»** en vez de «Cambiar tarjeta o cancelar». En Fundador
  el botón sigue diciendo «Ver mi recibo», que es lo único que hay que hacer
  ahí: no es una suscripción.
- **La fila de Ajustes dice «Vigente» en vez del precio**, y la fecha solo sale
  cuando hay una fecha que mirar («Pro anual · Termina el 27 de agosto de
  2027», ahora con mayúscula). El precio ya está dentro dos veces y aquí
  competía con el único dato que esa línea tiene que dar.
- **Comparar los planes.** Un botón que despliega la tabla ahí mismo, sin
  ventana: una ventana taparía justo las tarjetas que se están comparando, y
  obligaría a inventar un piso nuevo. **La tabla sale de `LIMITES`**, que es lo
  que la app aplica de verdad — una comparativa escrita aparte es la forma más
  rápida de prometer un tope que el código no respeta. Se desplaza dentro de su
  caja y nunca empuja la página de lado.
- **El distintivo de fundador existe de verdad**, no es una promesa de la
  tabla: anillo dorado alrededor del círculo de la cuenta (`.avatar.es-fundador`)
  y la piedra con corona en vez de la tallada. El anillo se pone en
  `avatarHTML` y no en `avatarPinta`, porque la portada dibuja el círculo de
  quien entró la última vez y ahí todavía no se sabe qué plan tiene nadie.

### 0.7.10.1 · 27 ago 2026
El service worker dejaba pegada la página de error.

- **Una respuesta mala ya no se guarda en la caché.** GitHub Pages tarda un
  minuto largo en publicar, y quien recargue justo en ese hueco puede pedir un
  archivo que todavía no está: el servidor contesta 404 con una página de
  HTML, el navegador la ejecuta como si fuera JavaScript y la app arranca a
  medias — «perkStatus is not defined», que es la primera función que falta al
  pintar el Resumen. Hasta ahí es mala suerte y se arregla recargando. Lo que
  lo hacía grave es que el service worker **guardaba esa página de error igual
  que un archivo bueno**, así que recargar seguía sirviendo el error hasta la
  siguiente versión. Ahora se comprueba el estado: lo que no viene bien ni se
  guarda ni se sirve si hay una copia buena de antes.
- **El service worker deja de meterse en las peticiones de Supabase.** Se
  metía en todas y guardaba en la caché lo que contestara el servidor de
  datos, que es de otra casa: no sirve para nada sin conexión —hace falta la
  sesión— y devolver una copia vieja de una consulta es peor que devolver el
  error. Ahora solo toca lo del propio origen.
- **Sin red y sin copia, un error de verdad.** `caches.match` devuelve
  `undefined` cuando no hay nada guardado, y un `undefined` dentro de
  `respondWith` reventaba con un error de tipo que no decía nada de lo que
  había pasado.

### 0.7.10 · 27 ago 2026
Ajustes vuelve a ser una pantalla, y el plan por fin dice algo.

- **Se retira la ventana emergente de Ajustes.** La sección ya no se abre en
  una caja flotante: el mini menú del engrane lleva a la pantalla de Ajustes,
  con su índice a la izquierda, que es la forma que tenía antes. Esto arregla
  de paso el fallo que lo destapó —minimizar el navegador estando dentro de la
  ventana dejaba los ajustes a medio camino entre los dos tamaños— porque la
  mudanza que se rompía ya no existe: los bloques no viajan a ningún sitio.
  **El mini menú se queda**; lo único que cambia es dónde aterriza.
  Desaparecen `#ajustes-modal`, `#ajustes-host`, las funciones
  `abrirVentanaAjustes` / `cerrarVentanaAjustes` / `prepararVentanaAjustes`
  (ahora es una sola, `abrirAjustes`) y todo el CSS `.am-*`.
- **«Almacenamiento» pasa a «Mi almacenamiento»**, que es como se llaman las
  otras tres.
- **«Los números» pasa a «Norata por dentro»**, con la gráfica en vez del mando
  de videojuego y en luciérnaga en vez de menta. Las cuatro primeras son
  ajustes de quien usa la app; esta es la trastienda del negocio, y con el
  mismo verde y la misma forma parecía una quinta cosa tuya.
- **Los tonos de las filas de Ajustes se nombran `t-oro` y `t-coral`** (antes
  había un solo `riesgo` que ya no usaba nadie). Oro es «mira esto» y coral es
  «esto va mal»; los pintan el índice, el mini menú y la cabecera del plan
  leyendo todos de `planTono()`, para que no puedan discrepar.
- **Tres piedras, una por nivel de plan**: `plan-libre` desnuda, `plan-pro`
  tallada y `plan-fundador` con corona. Comparten silueta a propósito — se ven
  en fila y así se nota que una crece en vez de haber que aprenderse tres
  dibujos. Mensual y anual son la MISMA piedra: lo que cambia es cada cuánto se
  paga, no lo que se abre.
- **La fila «Mi plan» dice qué plan hay.** Decía «Qué tienes abierto y cómo
  cambiarlo», que se lee entera sin enterarse de nada; ahora dice «Anual · $590
  al año», «Fundador · $890, una sola vez» o «Anual · termina el 14 de marzo»,
  y se pone en luciérnaga cuando el plan está contando sus últimos días.
- **La ficha del mini menú lleva el plan debajo del correo**, con su piedra
  pequeña. Era la segunda pregunta que traía a la gente aquí y hasta ahora
  había que abrir una sección para contestarla.
- **La sección Mi plan, entera.** Cabecera con la piedra, el nombre y el
  precio —que no salía por ningún lado una vez pagado, que es justo cuando se
  busca—; los renglones de recibo (qué pagas, siguiente cobro o hasta cuándo);
  y la lista de lo que hay abierto, leída de `LIMITES` y no copiada a mano, así
  que sube sola el día que suba un tope. El plan libre se pinta igual: también
  es un plan, y antes su sección contestaba «qué te vendemos» en vez de «qué
  tienes».
- **El apodo baja de 24 a 20 caracteres** y el tope se escribe en pantalla. No
  vive solo en su campo: sale en el saludo del Resumen, en la ficha del mini
  menú y en los correos, y con 24 ya se salía por el borde de la ficha.

### 0.7.9.1 · 27 ago 2026
La puerta, las negritas y la caja de despedida en su sitio.

- **La puerta se leía como un edificio.** Tenía la hoja estrechándose por
  arriba y por abajo, y ese doble escorzo sobre un rectángulo alto es la
  silueta de una torre. Ahora la hoja es un **paralelogramo** —los dos lados
  verticales miden lo mismo— y el suelo va partido en dos trazos, que es lo
  que remata la lectura.
- **La papelera pasa a `ICON_LIST`**, así que ya se puede elegir para una
  habilidad o un talento. Va al final de la lista a propósito: la asignación
  automática es `ICON_LIST[n % largo]` y meterla en medio le cambia el icono
  por defecto a todo el mundo.
- **En negrita solo lo que cambia de una persona a otra**: su correo, el plazo
  y su fecha. El resto es igual para todos, y resaltarlo también sería no
  resaltar nada. El correo pasa por `escapeHtml` porque ahora el mensaje viaja
  como HTML.
- **La caja del motivo**: pegada a lo de arriba, con tope de 500 caracteres
  **escrito en pantalla** —un tope que solo se descubre cuando el teclado deja
  de responder es un tope roto— y con el contador cambiando de color al
  llenarse. Nuevo texto de ejemplo.
- **`limpiarLibre()`**, que es por dónde pasa lo que se escriba: fuera los
  signos de menor y mayor, fuera los caracteres de control, los enters de más
  recortados y el tope aplicado otra vez. El `maxlength` del campo es del
  navegador y se quita en dos segundos; esto es la segunda barrera, y el día
  que el motivo se mande a algún sitio hará falta **una tercera en el
  servidor**, que es la única que cuenta de verdad.

Y tres fallos de maqueta que se veían y no se sabía por qué:

- **`#modal-msg` tiene `white-space: pre-line`**, que es justo lo que quiere un
  mensaje de texto —sus saltos se ven como párrafos sin escribir HTML— pero en
  modo HTML se vuelve en contra: **los saltos y la sangría del propio archivo
  se dibujaban como huecos de verdad**, y un cuadro con tres campos acababa
  con tres líneas vacías repartidas por dentro. Acotado al modo texto.
- **El contador heredaba los estilos de la pregunta**, porque `> span` los
  cogía a los dos: le ponía su color —de ahí que no cambiara al llenarse— y
  un `display: flex` que anulaba el `text-align: right`. Cada uno con su clase.
- **El bloque del motivo usaba `block`** y los saltos de línea del HTML abrían
  una línea vacía antes de cada elemento. Con `flex`, que ignora el espacio en
  blanco suelto, los huecos son los que dice `gap` y nada más.


### 0.7.9 · 27 ago 2026
Las ventanas de borrar, con icono y con una pregunta al final.

- **Dos iconos nuevos**: `puerta` —entreabierta, con su picaporte— y
  `papelera`. Los dos con el mismo trazo de 1,8 y comprobados dentro del
  lienzo de 24, para que no desentonen con los cuarenta que ya había.
- **«Vaciar la app»** estrena papelera y el título «Vas a vaciar la app.»
- **«Borrar mi cuenta»** estrena la puerta, el título «Estás a punto de borrar
  tu cuenta.» y el texto nuevo, con los 30 días naturales y lo que se pierde
  del plan pagado.
- **Una caja para contar por qué te vas**, opcional y estirable, debajo de la
  frase de confirmación. **Todavía no se manda a ninguna parte**, y está
  escrito así en el código: `guardarMotivoDeBaja()` es el único sitio donde
  habrá que enchufar el envío, el mismo que usará el botón de reportar fallos.

Y dos fallos que salieron de comprobarlo, los dos anteriores a esta tanda:

- **Había un círculo gris vacío** encima del texto en todas las ventanas que
  no piden icono. `hidden` no escondía nada: ese atributo trae `display: none`
  de la hoja del navegador y el `display: flex` del CSS le ganaba por ser de
  autor. Lo raro es que solo se veía donde NO había icono, que es justo lo que
  lo hacía difícil de atribuir.
- **El modal se dibujaba 34 px más abajo de donde debía, siempre.** La
  transición sobre `transform` no llegaba a correr nunca y la tarjeta se
  quedaba con el desplazamiento inicial puesto — medido: quitando la
  transición a mano, `transform` pasa a `none` al instante. En una pantalla de
  480 px de alto eso recortaba los botones por debajo sin que se viera que
  faltaba algo. **Quinta vez que muerde una transición**; el remedio, el de
  siempre. No se pierde ninguna animación, porque la que había no ocurría: la
  entrada la hace el velo del fondo, que sí funciona.


### 0.7.8.2 · 27 ago 2026
El fundador tiene su propio aviso, en luciérnaga.

**Un fundador que borra su cuenta no rompe nada: pierde algo.** Y es el único
caso de toda la app donde «puedes volver a contratarlo» sería mentira — los
lugares son 200 y no se reponen. Así que tiene pantalla propia, con corona, y
le dice que si algún día quisiera volver el plan podría estar agotado. También
le recuerda que «Vaciar la app» le deja la cuenta y su lugar intactos, que casi
siempre es lo que de verdad quería.

**No es un candado**: dos botones, y el peso puesto en quedarse. El coral se
reserva para lo que sí se rompe; el oro es para lo que tiene un coste que no
se ve. Pintar esto de rojo lo convertía en una alarma que no era.

Y dos arreglos que salieron de comprobarlo:

- **El borde del modal llevaba congelado desde siempre.** `.modal-card` tenía
  `transition: 0.22s` sobre *todas* las propiedades, y ahí dentro caía
  `border-color`, cuyo valor sale de una variable — el caso exacto que Chrome
  no detecta. El borde se quedaba en `--line` para siempre, también en las
  alarmas coral; no se notó nunca porque el aro que se ve lo dibuja el
  `box-shadow` de la animación, no el borde. Ahora la transición es solo de
  `transform`. **Es la cuarta vez que muerde lo mismo.**
- **Red de seguridad en pantallas bajas.** A 375×480 el aviso del fundador
  terminaba justo en el borde inferior: cabía por un pelo, y con una letra un
  punto mayor los botones se salían sin que se viera que faltaba algo. Ahora
  la caja se desplaza por dentro y el botón siempre se alcanza.


### 0.7.8.1 · 27 ago 2026
El candado de la cuenta preguntaba lo que no era.

**Preguntaba `esPro()` y tenía que preguntar `renueva`.** Lo cazó Eduardo
mirándolo: quien ya pidió la baja conserva el plan hasta su fecha —así lo
quisimos, y por eso `vence_el` no se mueve al cancelar— pero no tiene ningún
cobro pendiente. Bloquearlo era retenerle la cuenta por algo que ya resolvió.
Al **Fundador** le pasaba lo mismo y era más absurdo: paga una sola vez, no se
renueva nunca, y aun así no podía irse jamás.

Ahora solo se para quien tenga la renovación encendida, que es el único caso
en el que borrar le costaría dinero. A quien sí puede irse pero le queda plan
pagado se le **dice** que ese tiempo se pierde, y se le deja seguir: es su
decisión, no la nuestra.

Y el aviso, reestructurado:

- **Un título**, con la misma escala que las tarjetas del tutorial. El grito
  se lo queda él, que es de una línea.
- **El cuerpo vuelve a ser cuerpo**: blanco, sin negrita y alineado a la
  izquierda. Todo el párrafo en coral y en negrita se leía como una sola voz
  gritando, y entonces no destaca nada — lo contrario de lo que busca un
  aviso.


### 0.7.8 · 27 ago 2026
La zona de peligro, con las dos salidas bien separadas y un candado nuevo.

**Con un plan vigente ya no se puede borrar la cuenta.** El motivo es de
dinero: borrarla se lleva su fila de `suscripciones` por el `on delete
cascade`, pero **no cancela nada en Stripe**, así que quien se fuera así
seguiría pagando una cuenta que ya no existe. Ahora sale un aviso que lo
explica y deja a la persona en «Mi plan» para que cancele primero.

Ese aviso estrena tres cosas del modal, que sirven para cualquier otro:

- **Un icono arriba**, que dice de qué va antes de que el ojo llegue a la
  primera línea.
- **Fijo: el clic fuera no lo cierra.** Hay mensajes que existen para leerse,
  y en esos un clic distraído a dos centímetros no puede valer como
  «entendido».
- **Un solo botón**, sin «Cancelar», porque no es una pregunta.

**Va lo primero de todo, antes del «¿seguro?»**, y lo pidió Eduardo: si de
todas formas no va a poder, hacerle recorrer dos pantallas y escribir una
frase para acabar en un no es tomarle el pelo.

**Y borrar la cuenta ya tiene su última parada**, la misma caja animada que
tenía borrar los datos. Faltaba justo donde más se necesita: vaciar la app se
deshace volviendo a capturar, borrar la cuenta arranca un plazo de 30 días.

De la caja en sí, tres arreglos que se veían:

- **Cada acción lleva su título** («Vaciar la app», «Borrar la cuenta») y una
  línea entre las dos. Son dos cosas distintas y de nombre parecido, una
  encima de otra: leídas de corrido se confundían.
- **Los párrafos ya llenan el ancho.** Se recortaban a 66ch —buena tipografía
  en general— y al lado de un botón que sí ocupa todo dejaban un escalón a la
  derecha que parecía un fallo de maqueta.
- **El texto ya no tira a amarillo.** `--peligro-nota` era un tostado
  (`#c6a89f`) que sobre el fondo coral de la caja se leía sucio; ahora es un
  neutro con el punto justo de calidez.


### 0.7.7.1 · 27 ago 2026
El ciclo del cobro, cerrado y probado de punta a punta con dinero de verdad.

**Cancelar no apagaba el plan en la base.** Se canceló desde el portal de
Stripe, el aviso llegó, la fila se actualizó… y `renueva` seguía en `true`.
Misma causa que la fecha de 0.7.7: `cancel_at_period_end` es el campo de
siempre y en las versiones nuevas de la API de Stripe ya no basta —no da
error, llega vacío—. Ahora se pregunta por cuatro caminos (`cancel_at_period_end`,
`cancel_at`, `canceled_at`, `cancellation_details.reason`) y basta con que uno
diga que sí, porque **equivocarse tiene un precio muy desigual**: decir «se
renueva» de quien ya canceló le promete algo que no va a pasar; decir «no se
renueva» de alguien activo solo enseña una fecha de más.

Queda además una línea de diagnóstico en el registro de `cobro` con esos
cuatro campos —solo los nombres y si vienen o no, nunca datos de nadie—, para
que la próxima vez que Stripe mueva uno se vea en diez segundos.

**Y una palabra:** «Se renueva solo el 27 de agosto» se leía como *solo ese
día* en vez de *sin que hagas nada*. Ahora lo dice entero.

Comprobado contra la base después de pagar de verdad: al cancelar, `renueva`
pasa a `false`, `vence_el` **no se mueve** y el plan sigue encendido hasta esa
fecha. Es la regla que sostiene todo lo demás.


### 0.7.7 · 27 ago 2026
«Mi plan», dentro de Ajustes, y el primer cobro de verdad.

- **La pantalla que faltaba.** Hasta ahora el cobro existía entero por dentro
  pero no había ni un botón: la única puerta era escribir `?comprar=anual` en
  la dirección. Ahora hay una sección en Ajustes que dice qué tienes y, si no
  tienes nada, enseña los tres planes. Seis estados, todos comprobados: sin
  cuenta, libre, activo, cancelado-pero-vigente, fundador e impago.
- **A quien canceló se le dice que sigue teniéndolo**, con la fecha. Es la
  frase que más importa de toda la pantalla y por eso está separada de las
  demás: quien cancela no pierde lo que ya pagó.
- **Un fallo del cobro, encontrado pagando de verdad.** El primer pago guardó
  `vence_el` vacío y el plan no se encendía. Stripe movió `current_period_end`
  de la suscripción a cada uno de sus renglones en las versiones nuevas de su
  API, y el campo viejo no da error: devuelve vacío. `cobro` ahora prueba las
  dos rutas. Se corrigió sin volver a cobrar, reenviando el aviso desde el
  panel de Stripe.
- **Y otro de CORS.** `pagar` y `bienvenida` no permitían la cabecera `apikey`,
  que la app sí manda, así que el navegador cortaba la llamada antes de salir
  y solo se veía un «Failed to fetch». Las dos redesplegadas.

Los límites del plan libre siguen declarados y sin aplicarse en ninguna
pantalla. Ese sigue siendo el paso siguiente.


### 0.7.6.3 · 26 ago 2026
La gráfica del panel salía en negro, y ahora es una constelación.

**Las barras se pintaban de negro** porque el SVG llevaba escrito
`fill="var(--menta)"` y en Norata esa variable se llama `--mint`. Un color que
no resuelve **no avisa de nada**: no hay error en consola, simplemente sale
negro. Por eso ningún color del panel se escribe ya en un atributo del SVG
— todos viven en clases del CSS, donde sí se pueden comprobar.

**Los números del eje salían achatados** por `preserveAspectRatio="none"`, que
estiraba el lienzo para ocupar el ancho y de paso deformaba el texto de
dentro. El comentario del código decía que las fechas se dibujaban fuera de
esa escala y era mentira: estaban dentro. Ahora el viewBox es proporcional.

**Y el dibujo cambia de barras a puntos unidos por un hilo**, que lo pidió
Eduardo y encaja con la casa: el árbol de Talentos ya es una constelación. Un
día sin nadie no deja un hueco — deja un punto apagado, porque un hueco se lee
como «falta el dato» y un punto tenue como «ese día no vino nadie».

**Al añadir color a un SVG dibujado desde JavaScript, comprobar el nombre de
la variable contra `css/estilos.css` antes de darlo por bueno.**

### 0.7.6.2 · 26 ago 2026
El panel de números ya no depende de que el cobro esté desplegado.

`metricas()` leía la tabla `suscripciones` sin comprobar que existiera. Sin
`planes.sql` corrido, la consulta moría con «no existe esa tabla», **PostgREST
traduce ese error a un 404**, y la app lo leía como «falta administracion.sql»
— que estaba puesto y correcto. Un mensaje que acusa al archivo equivocado
cuesta más que el fallo.

Ahora el bloque del cobro se calcula aparte y solo si la tabla existe, con
`to_regclass` y `EXECUTE` (una consulta escrita a pelo contra una tabla que no
existe ni siquiera se puede planificar, aunque un `if` no la deje correr). Sin
cobro desplegado, esa caja lo dice en una línea en vez de enseñar ceros.

Y el mensaje de error se quedó honesto: **un 404 de PostgREST significa tanto
«la función no existe» como «falta algo dentro de ella»**, así que ya no se
acusa a un archivo por su número.

### 0.7.6.1 · 26 ago 2026
El panel de números aparecía en el teléfono y no en la computadora.

La pantalla de Ajustes ya preguntaba por las secciones a `seccionesAjustes()`
—que añade las que solo existen para algunas cuentas— pero el **mini menú** y
la **ventana de escritorio** seguían leyendo la constante `AJUSTES_SECS`. Los
tres sitios listan lo mismo y solo uno se había actualizado.

**Al añadir una sección de Ajustes hay que tocar los tres**, y el que se olvida
siempre es el mini menú, porque en el teléfono no existe y ahí todo se ve bien.

### 0.7.6 · 25 ago 2026
El panel de números, dentro de Ajustes y solo para quien administra. Todavía
no enseña nada: falta correr `supabase/administracion.sql` y darse de alta a
mano como administrador — los dos pasos están en `supabase/LEEME.md`.

La pregunta que lo ordenó todo fue de Eduardo: si el panel vive dentro de la
app, ¿cómo se evita que lo vea cualquiera? La respuesta es que **esconder el
botón no protege nada** —cualquiera puede leer el JavaScript, sacar el nombre
de una función y llamarla desde su consola— y que lo único que protege es que
el servidor compruebe quién pregunta antes de contestar. De ahí el reparto:

- **`supabase/administracion.sql`** — la tabla `administradores`, sin ninguna
  política de RLS, igual que `ajustes_negocio`: no se lee ni se escribe desde
  fuera. Y **no es una marca en los metadatos de la cuenta a propósito**, que
  es el error clásico: en Supabase el propio usuario puede escribir sus
  metadatos, así que un `es_admin` guardado ahí se lo pone cualquiera.
- **`metricas()`** comprueba el permiso en su primera línea, antes de tocar un
  solo dato, y devuelve **totales y nunca filas de nadie**: «23 personas
  activas», jamás «la cuenta X abrió el martes». Eso es lo que permite que el
  aviso de privacidad siga siendo verdad aunque el panel exista.
- **Todo en una sola llamada** y no seis: el panel las quiere juntas y seis
  viajes desde un teléfono se notan.

Lo que se ve dentro: la gente (cuentas, activos, retención a 30 días, cuántos
volvieron, cuántos la instalaron, cuántos usan los dos aparatos), una gráfica
de los últimos catorce días, el estado del cobro con los lugares de fundador,
qué versión corre cada quien, y lo que se rompe.

- **Los tropiezos son nuevos.** La red de seguridad de `index.html` ya avisaba
  al usuario, pero lo que pasó no lo sabía nadie. Ahora lo apunta, y se agrupa
  por día + versión + sitio + mensaje: un fallo dentro de un bucle escribiría
  miles de filas iguales y se comería el plan gratis en una tarde; aquí el
  quinto mil solo suma uno al contador.
- **Se apunta desde antes de tener sesión**, que es justo lo contrario de lo
  que parece razonable: los errores que más importa cazar son los que impiden
  arrancar, y ésos nadie podría reportarlos desde dentro. Como ese script corre
  antes que toda la app, deja lo que pilla en una lista y `sbVaciarTropiezos()`
  la recoge cuando ya hay con qué mandarla.
- El mensaje se recorta a 300 caracteres por dos motivos distintos: un volcado
  completo arrastra sin querer lo que hubiera en las variables —y ahí puede ir
  el nombre de la misión de alguien—, y un índice único sobre texto sin límite
  revienta pasados unos 2.700 bytes.

El botón para dar los errores por vistos **no los borra**: un error que vuelve
después de darlo por visto es información, y borrarlo la perdería. Se apagan.

### 0.7.5 · 25 ago 2026
Los cimientos del cobro. Todavía no cobra nada: falta correr `planes.sql`,
crear los tres productos en Stripe y desplegar las dos funciones — los pasos
están en `supabase/LEEME.md`. Mientras tanto, todo el mundo sale como «libre»
y los botones de pagar avisan de que el pago aún no está disponible.

Qué queda puesto:

- **`supabase/planes.sql`** — la tabla `suscripciones`, con RLS que deja leer
  solo lo propio y **ninguna regla de escritura para nadie**. La única mano
  que escribe es la función `cobro`, con la llave de servicio, que jamás baja
  al navegador. Más `mi_plan()`, que decide si el plan sigue vigente contra el
  reloj del servidor —mover el del teléfono no revive nada— y
  `lugares_fundador()`, el contador del cupo, que sí puede preguntar
  cualquiera porque es un número.
- **`supabase/functions/pagar/`** — pide a Stripe una página de cobro y
  devuelve su dirección. También abre el portal donde se cancela. Las
  direcciones de vuelta están escritas aquí y no se aceptan del cuerpo de la
  petición: una que llegue de fuera convierte esto en un trampolín con la
  marca de Stripe detrás.
- **`supabase/functions/cobro/`** — el aviso de Stripe. Comprueba la firma
  antes que nada, y en vez de creerse el aviso vuelve a preguntarle a Stripe
  cómo está esa suscripción: así deja de importar que los avisos lleguen tarde
  o desordenados.
- **`js/10d-plan.js`** — la capa de la app: `esPro()`, `cabeUnoMas()`,
  `planPermite()`, los límites en un solo sitio y los textos de cuando alguien
  topa con uno. Empieza explicando que **nada de ese archivo es seguridad**, y
  por qué eso está bien.

Los límites del plan libre quedan declarados (una rama, doce talentos, el año
en curso del ático, el resumen de la semana), pero **todavía no están puestos
en ninguna pantalla**: los cuatro módulos siguen sin tope para todos. Ponerlos
es el paso siguiente, y va aparte a propósito — el cobro tiene que estar
probado antes de que empiece a decirle que no a nadie.

### 0.7.4.1 · 25 ago 2026
El amarillo que quedaba suelto, y la etiqueta de cuenta de pruebas.

- **La barra de «A 45 XP del nivel 2» del Resumen seguía con el tono crudo.**
  No pasaba por ninguno de los ayudantes: su color se ponía a mano en una
  variable (`--c`) que se me escapó en los repasos. Y su carril era un blanco
  al 10% —pensado para carbón—, así que sobre una tarjeta clara no era ningún
  carril. Ahora usa `--carril` y el tono de línea que eligió Eduardo.
- **Con ella, otras tres del mismo tipo**: las áreas de la bienvenida
  (`--oc`), el icono grande del tutorial (`--tc`) y la segunda barra del
  Resumen. Las cuatro se ponían a mano y ninguna cambiaba de cara.
- El borde del cuadro de descanso era un blanco translúcido: invisible sobre
  una tarjeta clara. Pasa a `--borde-suave`.
- **La etiqueta de «cuenta de pruebas» cambia de forma.** Era un recinto
  punteado alrededor de la pantalla entera con la etiqueta colgada de una
  esquina; ahora es una pastilla ámbar colgada del centro de arriba, sin
  marco. Lo eligió Eduardo viendo el rótulo de la prueba de tonos puesto así.
  El marco no decía nada que la pastilla no diga, y competía con todo lo que
  hay dentro.

### 0.7.4 · 25 ago 2026
Los ocho tonos que eligió Eduardo mirándolos, y la etiqueta que se salía.

- **Los ocho tonos de línea salen del veredicto**, no de la cuenta. Eduardo vio
  la app entera con los tonos crudos (la prueba de 0.7.3.1) y decidió uno por
  uno. Van por debajo del 3 sobre 1 que pide una línea, y es a propósito:
  entre el número y el color de la marca, eligió el color.

  | | antes | ahora | qué pidió |
  | --- | --- | --- | --- |
  | menta | `#04905e` | `#039b64` | el de antes, un pelín más claro |
  | amarillo luciérnaga | `#987c16` | `#c69f15` | a medio camino del crudo |
  | coral | `#d85337` | `#ff603d` | el crudo tal cual |
  | lila | `#7d50ea` | `#7d50ea` | el crudo tal cual |
  | celeste | `#1d87b6` | `#2099cf` | el crudo, un pelín más oscuro |
  | verde | `#32902f` | `#3eba37` | el crudo, un pelín más oscuro |
  | rosa | `#e53c79` | `#f03e7e` | el crudo tal cual |
  | acero | `#5e81b0` | `#6287b8` | el crudo tal cual |

- **El TEXTO no se tocó.** Ahí un tono flojo no es un contorno pálido: es una
  cifra que no se puede leer. Sigue hundiéndose a medio camino del carbón, y
  medido en diez pantallas ningún texto se ve peor de día que de noche.
- **La etiqueta de «cuenta de pruebas» se salía por arriba.** Colgaba del borde
  del marco y el marco iba pegado a los cuatro lados, así que quedaba diez
  píxeles por encima de la pantalla: se veía cortada por la mitad. Ahora el
  marco se mete hacia dentro contando el hueco que reserva el aparato —la
  muesca, la barra de estado— y la etiqueta cae entera dentro. Medido en
  escritorio y en teléfono.
- Y el aviso de deslizar para actualizar, por lo mismo: arrancaba en el borde
  de arriba y en un teléfono con muesca el primer tramo del tirón no se veía.
- Fuera la prueba de tonos crudos, que ya cumplió. **El patrón se queda
  escrito en `CLAUDE.md`** para la próxima: lo que pueda estropear la
  experiencia se sube apagado, detrás de un parámetro en la dirección.

### 0.7.3.1 · 25 ago 2026
Un rótulo y una prueba para mirar.

- El amarillo pasa a llamarse **amarillo luciérnaga** en todas partes. Con
  «luciérnaga» a secas había que acordarse de que era el amarillo.
- **Modo de prueba «tonos crudos»**, temporal, para que Eduardo juzgue con
  los ojos si los ocho colores aguantan sin moverse ni un punto. Se enciende
  con `?tonos=crudos` y se apaga con `?tonos=normal` o cerrando la pestaña;
  vive en `sessionStorage` para que no se quede pegado como si fuera un
  ajuste, y lleva un rótulo arriba que recuerda que la pestaña está en modo
  prueba. Solo hace algo de día: de noche los ocho ya están crudos.

  Pone a cero TODO lo que mueve un color de día —`--hundir`,
  `--hundir-trazo`, las ocho versiones de línea y los tres acentos de la
  app—. Medido con la prueba encendida: 3.739 sitios con el tono exacto y
  cero tonos derivados, y 160 sitios por debajo de 3 sobre 1. El peor es el
  amarillo luciérnaga, en 1,37.

  **Para quitarlo** cuando haya veredicto: el bloque `html.claro.crudo` y
  `.marca-prueba` en `css/estilos.css`, el trozo que lee el parámetro en
  `index.html`, y su `<div>`.

### 0.7.3 · 25 ago 2026
Repaso general del modo claro, módulo por módulo.

Salió de una pregunta de Eduardo —«¿estás usando los colores que te di?»— y
la respuesta medida era: en los rellenos sí, en las líneas no del todo.

- **La regla que faltaba: cuánta superficie ocupa.** Un cuadrado relleno se ve
  a cualquier tono; una raya de 2 px o un aro de 4, no. Así que el aro de una
  misión, el contorno de un nodo, el arco de un anillo y lo lleno de una barra
  pasan todos por `trazo()`, aunque parezcan rellenos.
- **Y `trazo()` deja de hundir un porcentaje fijo.** Cada color tiene ahora su
  propia versión de línea, la mínima que llega a 3 sobre 1. Con el 35% igual
  para todos, al coral —que necesitaba un 16%— se le aplicaba lo mismo que al
  amarillo —que necesita un 40%— y salía color ladrillo. El lila no se mueve
  nada; el rosa y el acero, un 5%.
- **Arreglado el aro de progreso, que era invisible.** Iba en el tono exacto
  sobre un carril del color de los bordes: para el amarillo eso daba 1,05
  sobre 1, o sea, no se veía cuánto llevabas. Ahora hay un `--carril` aparte
  del tono de los bordes —un borde tiene que apenas notarse y un carril tiene
  que dejar ver por dónde va lo lleno— y el arco va en la versión de línea.
- **Y el aro de una misión pendiente**, que en amarillo daba 1,37.
- Los bordes de día suben un punto. Sobre papel hay menos margen que sobre
  carbón: el borde de un campo de texto daba 1,14 contra la página —o sea, no
  había borde— y de noche ese mismo borde da 1,45.
- Las líneas del motivo ilustrado también pasan por `trazo()`: eran el tono
  exacto sobre un cielo claro.

Medido en 14 pantallas: ningún texto, borde, aro ni barra se ve peor de día
que de noche. De día quedan 30 líneas por debajo de 3 sobre 1 y de noche 48,
y son las mismas: bordes de tarjeta y cosas apagadas a propósito.

### 0.7.2 · 25 ago 2026
El modo claro deja de tener verde pasto, y el árbol deja de verse sucio.

- **El isotipo pasa a `#00cc7f` sobre fondo claro**, que es el verde de la
  marca. Cambia solo en la barra lateral, en la pantalla de carga y en el
  logotipo de la portada; de noche sigue siendo el menta de siempre.
- **Escribir con un acento deja de ser lo mismo que rellenar con él.** De
  noche el mismo tono hace las dos cosas porque es claro; de día no puede,
  así que cada acento se parte en dos mitades sacadas del mismo tono vivo:

  | | rellenar | escribir y trazar |
  | --- | --- | --- |
  | menta | `#00cc7f` | `#007046` |
  | amarillo luciérnaga | `#f5c314` | `#755c05` |
  | coral | `#ff603d` | `#bd2200` |

  El verde de antes (`#136b4e`) tenía el matiz parecido pero la saturación al
  70%, y por eso se leía como verde pasto en vez de como el verde de Norata.
  Los nuevos tienen el matiz y la saturación exactos del vivo: solo cambia la
  luz. El botón de "Nueva rama" es ahora `#00cc7f` con tinta oscura —8,67
  sobre 1— igual que de noche.
- **El árbol de talentos deja de brillar de día.** Cada nodo encendido llevaba
  una copia borrosa de sí mismo por debajo: sobre carbón eso es luz, sobre
  papel es una mancha del mismo color alrededor, y con ocho colores en el
  mismo lienzo el conjunto se ve sucio.
- **Y sus contornos recuperan el color.** Un dibujo pide 3 sobre 1 y no 4,5,
  así que ahora se hunden 35% en vez de 50% y el tono se reconoce: el coral
  pasa de un marrón `#86382a` a `#aa4430`. Las chapas de estado van en el
  tono vivo, con tinta oscura encima.
- **La franja ilustrada de una ficha cambia de luz.** Era un trozo de noche
  pegado encima de una tarjeta clara. Ahora su cielo arranca en el tono
  levantado y baja hasta el color de la tarjeta, así que es el borde de
  arriba de la ficha y no un parche; y lo que era luz —chispas, brasas,
  humo— pasa a ser tinta, porque sobre papel un punto casi blanco no existe.
- Arreglado `marca/generar-marca.py`, que llevaba roto desde el cambio de
  nombre: sacaba de la app solo el atributo `d` de cada trazo, y dos de las
  seis letras llevan un `transform` escrito antes de la `d`. Ni las
  encontraba. Volver a correrlo generaba un logotipo de cuatro letras.

### 0.7.1 · 25 ago 2026
El modo claro estrena la paleta de día que dibujó Eduardo.

- **Los ocho colores que se eligen para una misión, una habilidad o un
  talento tienen ahora dos caras**: la de noche, pastel, y la de día, más
  saturada. Antes de día se hundían todos hacia el carbón desde la versión
  pastel y el resultado era el mismo tono apagado con distinto matiz; ahora
  cada uno tiene su pareja de verdad. El color guardado en los datos no
  cambia: lo que cambia es con cuál de las dos se pinta.

  | | noche | día |
  | --- | --- | --- |
  | menta | `#5fe0b0` | `#00cc7f` |
  | amarillo luciérnaga | `#f5d76e` | `#f5c314` |
  | coral | `#ff8a70` | `#ff603d` |
  | lila | `#b7a2ea` | `#7d50ea` |
  | celeste | `#6fc3e8` | `#23ace8` |
  | verde | `#8fd18a` | `#45d13b` |
  | rosa | `#f0a5c0` | `#f03e7e` |
  | acero | `#9aa7b8` | `#6287b8` |

- Tres ayudantes deciden qué cara usa cada cosa: `pinta()` para rellenar,
  `tinta()` para escribir o trazar, y `velo()` para el fondo tenue de una
  pastilla. Hacía falta separarlos: un relleno se ve a cualquier tono, pero
  un número escrito en amarillo luciérnaga de día da 1,47 sobre 1 y no se lee. Al
  escribir, el tono se hunde a medio camino del carbón, que es lo que deja
  al peor de los ocho en 4,65 sobre una tarjeta.
- **Los tres fondos de día también son los suyos**: la página pasa a lavanda
  `#dcdef0`, la tarjeta a `#f2f0f9` y lo que flota por encima —el mini menú,
  los avisos, la barra lateral— a `#f7f8fa`.
- Con la página más oscura, los grises de antes caían de 5,18 a 4,28. Los dos
  bajan un punto para devolver el contraste que había.
- Y los tonos tenues de los acentos ahora **levantan hacia el blanco** en vez
  de hundir hacia el color: sobre una página teñida, un velo del propio tono
  la oscurece y la pastilla se lee como un hueco en vez de como algo apoyado
  encima.
- La rejilla donde se elige el color enseña la cara que vas a ver.

### 0.7 · 25 ago 2026
Norata también es de día.

- **Modo claro**, con un interruptor de sol y luna en Ajustes: en el teléfono
  arriba de la lista de secciones, y en la computadora al final del mini menú
  del engrane, que es el único sitio donde esa lista se ve. La app sigue
  naciendo oscura: el claro es una elección, no lo que diga el sistema.
- Es preferencia **de este aparato**, no de la cuenta. El teléfono se usa en
  la calle y la computadora de noche, así que no viaja con la sincronía ni
  entra en los respaldos.
- Los acentos cambian de tono, no de sitio: la menta de la noche sobre papel
  blanco da 1,7 sobre 1 y desaparece. En claro se usan los tres tonos que ya
  vivían en los correos —menta `#136b4e`, coral `#b1341d`, ámbar `#8a6209`—,
  medidos uno por uno contra el fondo donde se escriben.
- Los ocho colores que se pueden elegir para una misión o una habilidad están
  guardados en los datos y no se pueden cambiar, así que en claro se hunden
  hacia el carbón lo justo para leerse. Rellenar con ellos sigue igual.
- **La escena de la racha y la celebración se quedan de noche** en los dos
  modos: no son interfaz, son un dibujo y un fogonazo de luz.
- Ningún color se escribe ya suelto dentro de una regla: todos salen de las
  variables de `:root`, y eso incluye el árbol de talentos, que se dibuja
  desde JavaScript.
- Arreglado de paso: al cambiar de modo, media app se quedaba con el color
  viejo clavado. Era la trampa de siempre —una transición sobre un valor que
  sale de una variable no se entera del cambio—, y ahora el cambio se hace
  con las transiciones apagadas un instante.

### 0.6.3 · 22 ago 2026
Norata empieza a contar si la gente vuelve.
- Una tabla de pulsos en Supabase: **una fila por persona y día**, con el
  día, la versión, si fue teléfono o computadora y si estaba instalada.
  Cuentas, nunca contenido — ni un título de misión entra ahí.
- Nadie toca esa tabla directamente: la única puerta es una función que solo
  sabe apuntar a quien la llama, así que la fecha la pone el servidor y no
  hay historial que falsificar.
- El latido va lo último del arranque, sin esperarlo y fallando en silencio:
  si falta correr el SQL o no hay red, nadie se entera.
- Quien prueba sin cuenta sigue siendo invisible, a propósito.
- Las seis consultas de lectura quedan escritas en `supabase/medicion.sql`.

### 0.6.2.1 · 20 ago 2026
Retoques sobre la ventana de Ajustes.
- La ventana lleva **cabecera con el nombre de la sección** y la frase con la
  que la elegiste en el mini menú. Sin índice a la izquierda se abría anónima:
  el primer rótulo de dentro nombra el panel, no la sección. La cabecera es
  fija, porque un rótulo que dice dónde estás no sirve si se va con el scroll.
- Más ancha (880 px). Con 680 los campos quedaban apretados. Los párrafos se
  quedan topados a 66 caracteres: un campo agradece la anchura, un renglón de
  prosa no.
- La X pasa a la cabecera, en vez de flotar sobre la esquina del primer panel.
- La numeración gana un cuarto tramo (ver arriba): los retoques se cuentan
  aparte y dejan de inflar la tanda.

### 0.6.2 · 20 ago 2026
Corrección de la tanda anterior.
- Las esquinas casi rectas vuelven a su sitio: la barra lateral recupera sus
  pastillas de siempre y quien se endereza es la **ventana de Ajustes**.
- La ventana pierde el índice de secciones: se llega a ella eligiendo en el
  mini menú, así que repetir las tres opciones al lado preguntaba otra vez lo
  recién contestado. El índice sigue vivo en la pantalla del teléfono, y el
  sistema se queda en el código para cuando cada sección tenga más cosas
  dentro. La ventana se estrecha a la anchura que tenía su columna de
  contenido, para no dejar renglones de novecientos píxeles.
- El mini menú responde al ratón: la fila se aclara y su icono pasa a menta.

### 0.6.1 · 20 ago 2026
Tanda de ajustes de interfaz.
- El menú de la computadora, más alto y con las esquinas casi rectas.
- La zona de peligro se ve peligrosa: caja roja y botones en coral macizo.
- El mini menú de Ajustes sale arriba del botón, y el botón se queda
  encendido mientras está abierto. Renombradas las tres secciones a
  Mi perfil / Mis módulos / Almacenamiento.
- La página ya no se mueve por detrás de una ventana abierta.
- Sistema de pisos para las ventanas. Arreglado que confirmar saliera por
  debajo de quien lo pedía (Ajustes, la caja del ático, la portada) y que el
  tutorial no se viera al llamarlo desde Ajustes.
- Arreglado que el botón de confirmar un borrado saliera **verde** en vez de
  coral.

### 0.6 · hasta el 20 ago 2026
Donde estaba la app cuando empezó esta cuenta. Los cuatro módulos en pie,
cuentas con Supabase, sincronía entre dispositivos, correos, portada de
entrada y el árbol de talentos con su lienzo. El detalle de cómo se llegó
hasta aquí está en el historial de git.
