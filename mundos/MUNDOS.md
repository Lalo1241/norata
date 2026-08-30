# Los mundos de Norata

Paquete de contexto para seguir esto en la computadora. **Léelo entero antes
de tocar nada**: aquí está lo decidido, lo medido y —sobre todo— lo que
todavía NO existe en la app, para no dar por hecho lo que aún no está.

## Estado, sin adornos

| | |
| --- | --- |
| **Ya está en la app** (0.7.37) | La capa de material: `--r-*`, `--sup-*`, `--marco-*`, `--tipo-titulo`, `--tipo-cifra`, `--dur-*`. Ver la sección «El material» de `CLAUDE.md`. |
| **Ya está en la app** (0.7.38) | Servir de la copia primero, para que un mundo se baje UNA vez y no cada mañana. |
| **Diseñado y medido, sin construir** | Los catorce mundos de este documento. |
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
| Alegreya | −10% | 212,8 | 1 | Talavera |
| Rajdhani | −10% | 212,5 | 1 | Blueprint |
| Baloo 2 | −2% | 232,1 | 1 | Neón |
| Marcellus | −1% | 235,0 | 1 | Vitral |
| **Outfit** | **+0%** | **236,5** | 1 | *la de casa hoy* |
| Chakra Petch | +4% | 245,4 | 1 | Cyberpunk |
| Bodoni Moda | +6% | 250,1 | 1 | Obsidiana |
| Fraunces | +8% | 255,5 | 1 | Papel picado |
| Poppins | +11% | 263,0 | 1 | *deja 3 px* |
| Bevan | +21% | 285,9 | **0.93** | Grabado |
| Cinzel | +28% | 301,8 | **0.88** | Forja |
| JetBrains Mono | +29% | 306,0 | **0.86** | Consola |
| Bungee | +39% | 328,4 | **0.80** | Rótulo |
| Michroma | +38% | 326,8 | **0.81** | Bastión |
| Grenze Gotisch | −17% | 195,3 | 1 | Averno |
| Big Shoulders Display | −26% | 174,2 | 1 | Ventisca |
| Monoton | +42% | 335,5 | 0.79 | *descartada* |

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

## Los catorce mundos

Cuatro familias. **De relato** son los que vienen de un género en vez de una
materia: inspirados, nunca calcados — nombre, marco, letra e ilustración son de
casa, y ninguno lleva marca, icono ni tipografía de nadie.

| Mundo | Qué es | Letra | Ancho | Escala | Esquinas | Peso | Horas |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Talavera** | Loza vidriada | Alegreya | −10% | 1 | 14 px · suaves | ~120 KB | Las dos |
| **Grabado** | El de las calaveras | Bevan | +21% | 0.93 | 0 px · vivas | ~75 KB | Día |
| **Rótulo** | El de la calle | Bungee | +39% | 0.80 | 16 px · redondeadas | ~90 KB | Noche |
| **Papel picado** | El de fiesta | Fraunces | +8% | 1 | 5 px · casi vivas | ~95 KB | Día |
| **Consola** | Gratis, siempre | JetBrains Mono | +29% | 0.86 | 0 px · vivas | ~28 KB | Noche |
| **Neón** | Todo redondo | Baloo 2 | −2% | 1 | Redondas del todo | ~60 KB | Noche |
| **Cyberpunk** | Visor, no marco | Chakra Petch | +4% | 1 | 0 px + chaflán | ~70 KB | Noche |
| **Blueprint** | Nada está terminado | Rajdhani | −10% | 1 | 0 px · vivas | ~65 KB | Noche |
| **Forja** | El buque insignia | Cinzel | +28% | 0.88 | 0 px · vivas | ~180 KB | Noche |
| **Obsidiana** | El oscuro elegante | Bodoni Moda | +6% | 1 | 0 px · vivas | ~85 KB | Noche |
| **Vitral** | El más caro de hacer | Marcellus | −1% | 1 | 3 px · casi vivas | ~240 KB | Noche |
| **Averno** | El oscuro de verdad | Grenze Gotisch | −17% | 1 | 2 px · piedra tallada | ~95 KB | Noche |
| **Ventisca** | Frío con una hoguera | Big Shoulders Display | −26% | 1 | 3 px · chapa | ~90 KB | Noche |
| **Bastión** | Blindaje | Michroma | +9% | 0.81 | 4 px · placa | ~105 KB | Noche |

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

En `herramientas/` está el arnés, con su `LEEME.md`. Para un mundo, tres
medidas y ninguna es «se ve bien»:

1. **Contraste sobre el píxel pintado.** Texto por encima de 4,5 sobre 1;
   trazos (aro, barra, contorno) por encima de 3. La forma correcta de medirlo
   se equivocó tres veces antes de quedar bien, y las tres merecen recordarse:

   | Cómo se midió | Qué reprobaba mal |
   | --- | --- |
   | Leyendo `backgroundColor` tal cual | Blueprint: su `rgba(255,255,255,.035)` se tomaba por blanco opaco |
   | Componiendo la transparencia, pero sin saber leer degradados | Averno y Ventisca, cuyo fondo es un degradado |
   | Fotografiando el TEXTO | todos: una captura de elemento viene sobre transparente |

   Lo que funciona: **fotografiar la superficie** (`.ficha`, `.lienzo`), que sí
   tiene fondo, y tomar de ahí el color más repetido —degradado y textura
   incluidos—; la tinta sale del CSS, compuesta si es semitransparente. Está
   implementado en el arnés.
2. **La tipografía cabe.** Con la fuente descargada e incrustada, no fiándose
   de `getComputedStyle().fontFamily`, que solo repite lo declarado y da el
   mismo ancho para todas aunque ninguna haya cargado. Ese fallo también se
   cometió.
3. **Los vectores.** Densidad de tinta (ni vacíos ni manchones), reparto por
   cuadrantes, y si el motivo se repite, que case consigo mismo en los bordes.
   Un motivo de retícula es la excepción: su costura lleva la línea gruesa a
   propósito y NO debe casar.

Los catorce de este documento pasan las tres.

## Lo que falta decidir

- **Cuáles tres se construyen primero.** Con catorce sobre la mesa, la lista
  corta hay que rehacerla.
- **Con qué letra va la app.** Hoy la pantalla va en **Outfit** (incrustada en
  `css/fuente.css`) y los seis correos van en **Poppins**, que sí se carga de
  Google. La marca está partida en dos y conviene cerrarlo antes de que haya
  mundos encima.
- **Cuáles se ganan y cuáles se compran**, y si las dos listas se cruzan.
- **Si un mundo puede ser de temporada** (lo pide Papel picado).
- **Si el nivel de expedición** —la cifra que sumaría todo el progreso, que hoy
  no existe— es de dónde cuelgan los desbloqueos.

## Cómo seguir aquí

Rama: **`claude/norata-apariencias-skins-p52cpj`**. Ya está publicado en `main`
todo lo de 0.7.37 y 0.7.38; esta carpeta es lo que viene después y todavía no
toca la app.

Nada de `mundos/` se sirve ni entra en `ASSETS`: es documentación, como
`herramientas/`. La app sigue sin compilación.
