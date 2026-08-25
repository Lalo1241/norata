# Norata

La vida tratada como un videojuego. Vive en `https://mi.norata.app`, publicada
con GitHub Pages desde `main`. **Cuatro módulos:** Misiones (lo de hoy),
Habilidades (suben con la práctica y bajan si las dejas), Talentos (las cosas
grandes, en un árbol por ramas) y Proyectos (lo que avanza por etapas).

## No hay compilación

Ni `npm install`, ni empaquetador, ni paso previo: archivos sueltos que el
navegador entiende tal cual. Tres consecuencias que muerden si se olvidan:

1. **El orden de los `<script>` importa.** Están numerados (`01-base.js` →
   `11-arranque.js`) y el último es el que arranca. Al añadir un archivo hay
   que registrarlo en DOS sitios: `index.html` y la lista `ASSETS` de `sw.js`.
2. **Hay que subir la versión al tocar cualquier archivo de `ASSETS`** (ver
   abajo). Si no, los aparatos ya instalados siguen sirviendo la copia vieja.
3. **Hace falta servirla por HTTP.** `python -m http.server 8123`. Abrir
   `index.html` con doble clic no funciona.

## Versiones

El número se ve debajo de Ajustes y **las reglas están en `VERSIONES.md`** —
leerlo antes de subirlo. En corto: cuatro tramos, `0.6.2.1`; el 4º es un
retoque suelto, el 3º una tanda, el 2º algo que la app no hacía antes, y el
1º llega a `1.0` el día de la Play Store. **Ningún tramo se para en 9.**
**`0.8` está apartado para la beta** y no se coge por acumulación: hasta que
Eduardo lo diga, la cuenta sigue por dentro de `0.7` (`0.7.1`, `0.7.2`…).

Al subirlo: `VERSION` y `VERSION_FECHA` en `js/01-base.js`, `CACHE` en `sw.js`
con el mismo número, y una línea en `VERSIONES.md`.

## Cómo verificar

**El panel del navegador suele no componer imagen** en algunos entornos y las
capturas fallan. No bloquea nada: se verifica **midiendo el DOM**, que además
es mejor evidencia que mirar una imagen. En vez de juzgar si «se ve bien»,
comprobar números:

```js
document.documentElement.scrollWidth > innerWidth   // ¿desborda de lado?
getComputedStyle(el).backgroundColor                // el color, leído, no supuesto
caja.getBoundingClientRect().top - cap.getBoundingClientRect().top  // >= 0
```

Y contrastar con un control conocido: al comprobar si algo ya está publicado,
pedir también un archivo que ya funcionaba. Si el control falla, lo que está
roto es la prueba, no el archivo.

Probar **el caso vacío y el extremo**, no solo el feliz: un perfil recién
creado, un nombre de 200 letras, la pantalla a 480 px de alto. Ahí han salido
todos los fallos reales.

## Antes de tocar lo que se ve: una prueba con enlace

Cuando un cambio pueda estropearle la experiencia a alguien —y sobre todo
cuando la decisión sea de Eduardo y no mía—, **no se sube y ya: se sube
apagado, detrás de un parámetro en la dirección.** Se lo pidió él después de
probarlo así con los tonos del modo claro (0.7.3.1).

La receta, que cabe en veinte líneas:

1. Una clase en `<html>` que cambia solo variables (`html.claro.crudo`).
2. En el script de arriba de `index.html`, junto al modo claro: leer
   `?loquesea=valor`, guardarlo en **`sessionStorage`** —no en localStorage,
   para que no se quede pegado como si fuera un ajuste— y poner la clase.
   Ahí arriba y no en el script principal, o se ve el fogonazo.
3. Un rótulo fijo que recuerde que la pestaña está en modo prueba. Sin él es
   fácil olvidarlo y acabar juzgando la app de verdad por lo que se ve ahí.
4. Dos enlaces para él: uno que lo enciende y otro que lo apaga.
5. En `VERSIONES.md`, la lista exacta de qué hay que borrar después.

Nadie que no pida la prueba se la encuentra, y con la pestaña cerrada
desaparece. **Al quitarla, borrar por nombre y no por rango**: la primera vez
se cortó de "aquí" a "allá" y se llevaron por delante cuatro bloques que
estaban en medio y no tenían nada que ver —entre ellos `cambiando-modo`, que
es lo que evita que los colores se queden congelados—. Lo cazó la medición
del DOM, no la vista.

## Trampas que ya costaron horas

- **Una transición sobre una propiedad cuyo valor sale de una variable se
  queda congelada.** Chrome no detecta el cambio y deja el color clavado en el
  inicial para siempre. Ya mordió tres veces: los selectores, el botón de
  Ajustes que no se encendía, el botón de confirmar un borrado que salía
  **verde** en vez de coral, y el cambio de modo claro/oscuro, que dejaba
  media app con el color viejo puesto. **Se arregla quitando la transición**
  — apuntar a `background-color` en vez de `background` no sirve. Cuando hay
  que cambiar muchas variables de golpe, la clase `cambiando-modo` las apaga
  todas durante un turno (ver `ponerTema` en `js/01-base.js`).
- **`align-items: center` esconde para siempre la parte de arriba de un hijo
  más alto que el contenedor.** El desplazamiento no llega a negativos. Se
  centra con `margin: auto` sobre el hijo.
- **Comparar el archivo local con el publicado da distinto aunque sea el
  mismo:** el árbol de trabajo está en CRLF y GitHub sirve LF. Comparar sin
  los retornos: `tr -d '\r' < archivo | md5sum`.
- **GitHub Pages tarda un minuto largo en publicar.** Un archivo recién subido
  que no carga no está roto: aún no ha desplegado.
- **No verificar DNS con `nslookup`** — devuelve respuestas cacheadas. Usar
  `dns.google/resolve`.

## Las capas

**Ningún `z-index` se escribe a mano:** salen de variables `--piso-*`
declaradas juntas en `:root` de `css/estilos.css`, con la regla al lado — *lo
que abre algo va siempre por debajo de lo que abre*. Al añadir una ventana:
un `--piso-*` nuevo, y una línea en `CAPAS_QUE_TAPAN` (`js/01-base.js`), que
es lo que para la página de detrás. Nada más: no hay que acordarse de parar ni
de soltar.

## La paleta

Dos caras y los mismos tonos. La app nace de noche; el **modo claro** se
elige en Ajustes (clase `claro` en `<html>`) y usa los tonos oscuros, que son
los mismos que ya usaban los correos —viven en la bandeja de otro—.

**Escribir con un acento no es rellenar con él.** De noche el mismo tono hace
las dos cosas; de día no puede: el verde de la marca escrito sobre papel da
1,87 sobre 1. Así que cada acento se parte en dos, y las dos mitades salen del
mismo tono vivo —mismo matiz, misma saturación, distinta luz—:

| | Noche | Día: rellenar (`-macizo`) | Día: escribir y trazar |
| --- | --- | --- | --- |
| Menta | `#5fe0b0` | `#00cc7f` | `#007046` |
| Amarillo luciérnaga | `#f5d76e` | `#f5c314` | `#755c05` |
| Coral | `#ff8a70` | `#ff603d` | `#bd2200` |
| Celeste | `#8ecdf5` | — | `#0f688f` |

Sobre un relleno macizo la tinta es **oscura** (`--sobre-macizo`) en los dos
modos, porque los tres tonos vivos son claros en los dos modos. Los correos
siguen con la menta `#136b4e` que ya tenían.

**`--carril` no es `--line`.** Un borde tiene que apenas notarse; el carril de
un aro o de una barra tiene que dejar ver por dónde va lo lleno. De noche
coinciden; de día no pueden, porque encima del carril hay que distinguir ocho
colores y con el tono de los bordes el amarillo se perdía dentro (1,05).
| Fondo | `#10151d` | `#dcdef0` (los correos, `#f2f4f8`) |
| Tarjeta | `#1d2530` | `#f2f0f9` |
| Levantado | — | `#f7f8fa` |

Los tres fondos de día los eligió Eduardo. **La tarjeta siempre queda por
encima del fondo**: el degradado de la página se mueve entre `#e3e5f2` y
`#dcdef0`, los dos por debajo de `#f2f0f9`. Si algún día se aclara el
degradado por arriba, las tarjetas se hunden en la mitad de arriba de la
pantalla y flotan en la de abajo.

**Sobre blanco hay que usar la versión oscura**: la menta de la app sobre
blanco da 1,7 sobre 1. Al inventar un tono para fondo claro, calcular el
contraste antes de usarlo (umbral 4,5 para texto normal).

**Ningún color se escribe suelto dentro de una regla.** Todos salen de las
variables de `:root` en `css/estilos.css`, y el modo claro se hace cambiando
esas variables y nada más — incluido el árbol de talentos, que se dibuja
desde JavaScript y lee `var(--...)` en los atributos del SVG. Al añadir un
tono nuevo: se declara arriba, con su pareja clara en `html.claro`.

Cuatro cosas que hay que saber antes de tocarlo:

- **Los ocho colores que elige el usuario** tienen dos caras, declaradas como
  `--paleta-1` … `--paleta-8`: la de noche (pastel) y la de día (saturada).
  El color guardado en los datos no cambia nunca; lo que cambia es con cuál
  se pinta, y eso lo deciden tres ayudantes de `js/01-base.js`:

  | | para qué | umbral | ejemplo |
  | --- | --- | --- | --- |
  | `pinta(c)` | rellenar una superficie | — | un icono cuadrado, un chip |
  | `tinta(c)` | escribir | 4,5 | un número, un rótulo |
  | `trazo(c)` | dibujar una LÍNEA | 3 | un aro, un contorno, una barra |
  | `velo(c, "22")` | el fondo tenue de una pastilla | — | `.ms-ic` |
  | `tonos("mc", c)` | las dos primeras de golpe | — | `style="${tonos(…)}"` |

  **La regla que decide entre `pinta` y `trazo`: cuánta superficie ocupa.** Un
  cuadrado relleno se ve a cualquier tono; una raya de 2 px o un aro de 4, no.
  Por eso el aro de una misión, el contorno de un nodo, el arco de un anillo y
  lo lleno de una barra van todos en `trazo()`, aunque parezcan rellenos.

  Y `trazo()` no hunde un porcentaje fijo: cada color tiene su propia versión
  de línea (`--paleta-N-linea`), la mínima que llega a 3 sobre 1. Con un
  porcentaje igual para todos, al coral —que necesitaba un 16%— se le aplicaba
  lo mismo que al amarillo —que necesita un 40%— y salía color ladrillo. El
  lila no se mueve nada.

  **Nunca pegar la transparencia al hex** (`col + "22"`): eso ata el relleno a
  la cara de noche, porque a un `var(...)` no se le pueden pegar dos dígitos
  detrás. Para eso está `velo()`.

- **Los tonos `*-soft` levantan hacia el blanco en el modo claro**, no hunden
  hacia el color. Sobre carbón un velo del tono aclara la zona; sobre una
  página ya teñida el mismo velo la oscurece y la pastilla se lee como un
  hueco en vez de como algo apoyado encima.
- **La escena de la racha y la celebración se quedan de noche** en los dos
  modos: no son interfaz, son un dibujo. Dentro de ellas la paleta oscura se
  vuelve a declarar entera (regla `.scene-card, .celebrate`).
- **La franja ilustrada de una ficha (`motifScene`) sí cambia de luz**, porque
  vive en los dos sitios: dentro de una escena —que se queda de noche— y
  encima de una ficha, que de día es clara. Su cielo y sus chispas salen de
  las variables `--motivo-*`.
- **De día no hay resplandor.** Los nodos del árbol y los motivos llevan una
  copia borrosa de sí mismos por debajo; sobre carbón eso es luz, sobre papel
  es una mancha, y con ocho colores en el mismo lienzo el conjunto se ve
  sucio. Se apaga desde el CSS (`html.claro .const-wrap [filter]`) y no
  dejando de escribir el atributo: un atributo de presentación de SVG pierde
  contra una regla, así que no hay que volver a dibujar nada al cambiar.
- **El logotipo de la portada es un `<img>`** y hay que cambiar de archivo:
  `logotipoSrc()` elige entre los dos de `marca/`. Ojo con los nombres, que
  dicen de qué color es el dibujo: el *claro* va sobre fondo oscuro.

## El tono

Decisiones ya cerradas. No volver a proponerlas.

- **Español de México, cercano, sin jerga.** La app tutea.
- **Nada de cerrar diciendo lo que NO se va a hacer.** Los cierres van en
  aspiracional: «Tienes por delante un camino largo, y se recorre en días
  pequeños.»
- **Sin signos de exclamación en los asuntos de correo** ni mayúsculas
  sueltas: es lo que los filtros leen como propaganda.
- **Nada de «NO» en mayúsculas** para asustar. Un aviso informa y da la
  salida; no grita.
- **Los comentarios del código explican POR QUÉ**, no qué hace la línea, y
  cuentan el fallo que motivó la decisión para que nadie lo deshaga sin saber.

## Correos

Son seis; cinco se pegan a mano en Supabase y el de bienvenida lo manda una
función propia. **Gmail borra los SVG** (todo icono va en PNG) y **guarda las
imágenes por nombre y no vuelve a pedirlas nunca** (al cambiar una imagen hay
que cambiarle el nombre: `-v1` → `-v2`).

## Qué NO hacer

- **No crear una plantilla, pantalla o archivo sin comprobar que existe el
  camino que lo dispara.** Ya pasó: hay una plantilla que ninguna pantalla usa.
- **No dar por hecho el comportamiento del servidor.** Si algo importa,
  hacerlo explícito aunque puede que ya lo hiciera solo.
- **Supabase es la base de datos, no el hosting.** La web sale de GitHub
  Pages. Subir código no toca los datos de nadie.
