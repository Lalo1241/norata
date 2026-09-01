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
   **Y hay DOS páginas desde 0.7.14:** `index.html` es la app (los diecisiete
   archivos) y `login/index.html` es la puerta (seis: `01-base`, `10-sincronia`,
   `10a-perfil`, `10b-supabase`, `10c-portada` y `12-login.js`, que es el que
   arranca allí). La puerta funciona porque **ninguno de esos seis ejecuta nada
   al cargarse**; si algún día uno empieza a hacerlo, la puerta arrancará media
   app sin querer. Sus rutas van con `../`, y `logotipoSrc()` lo resuelve mirando
   si existe la app.
2. **Hay que subir la versión al tocar cualquier archivo de `ASSETS`** (ver
   abajo). Desde 0.7.38 esto no es una buena práctica: es el ÚNICO mecanismo
   por el que una versión llega a un aparato. La app se sirve de su propia
   copia y no pide nada a la red; lo único que el navegador vuelve a pedir en
   cada apertura es `sw.js`, y si su `CACHE` no cambió, ese aparato **se queda
   en esa versión para siempre**. Antes, olvidarlo servía una copia vieja pero
   la red acababa trayendo lo nuevo; ahora no hay quien lo rescate.
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

**Y la trampa que sale de ahí: sin componer fotogramas, las TRANSICIONES no
avanzan nunca.** Se quedan en `playState: "running"` para siempre y
`getComputedStyle` devuelve el valor de PARTIDA, no el de destino. Da igual
cuánto se espere. Se ve como un CSS que no se aplica: al plegar la barra, el
`opacity: 0` de una regla parecía no llegar mientras el `background` de esa
MISMA declaración sí — porque el fondo no tenía transición y la opacidad sí.
Media hora buscando un problema de especificidad que no existía.

Antes de dudar del CSS, saltar las animaciones al final y volver a medir:

```js
document.querySelectorAll("*").forEach(e =>
  e.getAnimations && e.getAnimations().forEach(a => { try { a.finish(); } catch (x) {} }));
```

La pista que lo delata: `el.getAnimations()` devuelve transiciones `running`
que no terminan. Y afecta a todo lo que se anime — el ancho de la barra
plegada medía 246 px en vez de 84 por lo mismo.

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

Sobre un relleno macizo la tinta es **oscura** en los dos modos, porque los
tres tonos vivos son claros en los dos modos — y son DOS variables, no una:
`--sobre-macizo` va encima del ACENTO y `--sobre-vivo` encima de la luciérnaga,
el coral, el lila y los ocho del usuario. Se partieron en 0.7.55 porque Tinta
tiene un acento casi negro: su bloque tiene que poner clara la tinta de encima,
y con una sola variable eso dejaba claro sobre claro el amarillo y el coral,
que en Tinta siguen siendo vivos. Los correos
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

**Una apariencia no cambia solo los tonos: cambia CUATRO familias**, y las
tres últimas se descubrieron una por una porque nadie las declaraba y el fallo
se veía como «no cambió nada» o «cambió solo en medio»:

| Familia | Qué pinta | Ojo |
| --- | --- | --- |
| `--bg`, `--card`, `--text`… | los tonos | lo que ya se declaraba |
| `--fondo-pagina`, `--fondo-raiz` | el SUELO de la página | `--sup-pagina` sale de aquí, no de `--bg` |
| `--orbe-1/2/3` | las tres manchas de luz | llevan la transparencia dentro |
| `--lienzo-*` | el mapa de talentos entero | ocho, y la pantalla que más se mira |
| `--sup-hondo`, `--borde-panel` | el suelo y el marco de lo GRANDE | el lienzo, la tarjeta de una rama, las columnas del tablero |

**El fondo de un mapa es SIEMPRE un tono liso más los puntitos de
orientación.** Donde se vean nodos —el árbol de talentos, las ramas de
proyectos, el previsualizador y la pantalla completa—, nunca una textura ni un
dibujo: sobre un lienzo eso no es carácter, es suciedad, y compite con lo único
que hay que leer ahí. Un mundo cambia el TONO de ese suelo (`--lienzo-suelo`),
no le pone forro encima. **Ese suelo (`--sup-hondo`) no vale lo mismo que el
fondo de la página**: se separa de él en la dirección que deja ver el marco —de
noche un pelo más claro, de día un pelo más oscuro—, porque valiendo lo mismo
el encuadre desaparece. Y **la tarjeta de una rama es de una pieza**: la barra
de arriba y la tira de abajo llevan el mismo suelo que el centro, o se ve
parcheada. Las dos cosas las paró Eduardo en la primera mirada (0.7.55.1).

**Un tono que sale de una variable no llega solo a donde se usa.** `--sup-pagina`
vale `var(--fondo-pagina)`; cambiar `--bg` no cambia el suelo. Al inventar un
tono, buscar quién lo lee de verdad.

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

## Las apariencias

**Lo de apariencias se decide en `apariencias/LEEME.md`, y ese documento manda.**
Estuvo repartido entre dos conversaciones y seis láminas, y de esa partición
salió una contradicción que estuvo a punto de convertirse en un bug: dos
documentos daban repartos distintos de qué ambiente es gratis y cuál pide Pro.
Si algo de esto se vuelve a trabajar en otro sitio, se trae ahí antes de
construirlo.

Tres palabras y ninguna es intercambiable:

| | Qué es | Cuántos |
| --- | --- | --- |
| **Apariencia** | El paraguas, y la palabra que ya usa `js/10d-plan.js` | — |
| **Ambiente** | Un recolor: el mismo material con otra luz | 8, en `apariencias/` |
| **Mundo** | Otro material: superficie, marco, letra y peso al moverse | 14, en `mundos/` |

Son **excluyentes** —un mundo declara sus propios colores— y el modo claro es
un eje aparte. Nada de esto existe todavía en la app: lo que hay es el camino
(la capa de material de 0.7.37) y la caja registradora (la llave `apariencia`).

## El material

La paleta de arriba resuelve el COLOR. Desde 0.7.37 hay una segunda familia al
lado que resuelve de qué está hecha la app, y la regla es la misma: **ningún
radio, ninguna superficie y ningún marco se escribe suelto dentro de una
regla.** Todos salen de `:root`, junto a los colores.

Existe porque sin ella una apariencia solo puede recolorear, y un recoloreado
no es una apariencia. El número que lo decidió: en los 300 KB del CSS había
**un solo `url(...)`, y era la tipografía**.

| Familia | Para qué | Ojo |
| --- | --- | --- |
| `--r-redondo`, `--r-disco` | círculos y puntos | **no** pasan por el factor |
| `--r-barra`, `--r-pastilla`, `--r-boton` | carriles, chips, botones | sí pasan |
| `--r-grande` … `--r-micro` | la escala de las superficies | 16, 14, 12, 10, 8, 6 |
| `--r-factor` | el interruptor grueso | `0` endereza el 79% de las esquinas |
| `--sup-*` | el MATERIAL de un fondo | van en `background`, admiten capas |
| `--marco-tarjeta` + `--borde-tarjeta` | el marco forjado | hacen falta las DOS |
| `--tipo-titulo`, `--tipo-cifra` | títulos y cifras aparte | el cuerpo no se toca |
| `--dur-*`, `--curva*` | el peso del movimiento | |

Cuatro cosas que hay que saber antes de tocarlo:

- **Un círculo es redondo porque es redondo.** `--r-redondo` está separado de
  `--r-pastilla` a propósito: con un solo nombre para los dos, cuadrar las
  etiquetas cuadraba también el círculo de marcar una misión. Eso ya no es una
  apariencia, es otra app.
- **`--card` es el color; `--sup-tarjeta` es lo que se pinta.** Son dos cosas y
  hasta 0.7.37 eran la misma variable. `--card` se sigue usando en bordes y en
  `color-mix`, donde una textura no cabe. La textura va SIEMPRE en la `--sup-*`.
- **Un marco necesita las dos variables.** Con `--marco-tarjeta` puesto y el
  borde en un píxel no se ve nada: `border-image` solo se dibuja sobre el ancho
  del borde.
- **63 de los 221 radios siguen sueltos** —esquinas interiores de 3 px, medios
  redondeos, las siluetas giradas de las burbujas— y el factor no los alcanza.
  Una apariencia que los quiera tiene que ir a por ellos con sus propias reglas.

**Cómo se comprueba que un cambio de estos no rompió nada:** una foto de los
estilos calculados de toda la app —siete pantallas, los dos modos, con
`verElEjemplo()` sembrado— antes y después, y se diffean. En 0.7.37 eso fueron
24 326 elementos y cambiaron 10, todos a propósito. Dos fotos de la app sin
tocar salen idénticas, así que un «no cambió nada» significa algo. Ver la
entrada de 0.7.37 en `VERSIONES.md`.

## Cómo llega la app: de la copia primero

Desde 0.7.38 abrir la app **no espera a la red**: se sirve de la copia que el
service worker guardó. Un día cualquiera son **1 petición y ~120 ms**, contra
las 24 peticiones y 460 KB que se bajaban enteros cada mañana antes.

Se hizo antes de las apariencias porque una apariencia con carácter pesa 150-250
KB de tipografía y texturas, y con lo de antes eso se habría vuelto a bajar cada
vez que se abre la app.

**Cómo llega entonces una versión nueva.** El navegador vuelve a pedir `sw.js`
en cada navegación, y sin pasar por su caché. Como `CACHE` lleva el número de
versión, ese archivo cambia siempre que hay algo nuevo: se instala el worker
nuevo, se baja todo por detrás, se activa, y avisa a la app —un toast con un
botón de recargar—. Quien abra justo después de una publicación ve **una vez**
la versión anterior; la nueva entra sola en la siguiente apertura.

Tres cosas del `sw.js` que no se pueden tocar sin entender por qué están:

- **`install` pide con `cache: "reload"`.** Sin eso el `addAll` llena la caché
  nueva con los bytes viejos que el navegador tuviera guardados, y subir la
  versión no cambia nada de lo que se ve.
- **Cada worker sirve de SU caché** (`caches.open(CACHE).then(c => c.match(…))`,
  no `caches.match` a secas). Mientras se instala una versión conviven dos
  almacenes, y el de a secas busca en todos: el worker viejo podía servir un
  archivo del nuevo y otro del viejo en la misma carga.
- **El aviso mira `viejas`, no `keys`.** Cuando corre `activate`, la caché de
  esta versión ya existe —la crea `install`—, así que `keys` nunca está vacío y
  el aviso saltaba en una instalación recién hecha.

**Lo que esto pide de las apariencias:** las texturas y tipografías de un mundo
**no van en `ASSETS`**. Eso es la lista de la instalación, y meterlas ahí le
haría bajar el mundo entero a quien nunca lo va a encender. Van aparte, se
piden cuando se enciende el mundo, y se quedan cacheadas por nombre.

**Y lo que no se hizo:** bajar tarde el lienzo del árbol, los informes y los
planes (119 KB, el 26% del arranque). Con la red ya resuelta, compilar y
ejecutar TODO el JavaScript cuesta 12-17 ms en un teléfono de gama media.
Partir archivos que se pasan globales entre ellos para ganar milisegundos es
mal negocio. Está apuntado en `VERSIONES.md` por si algún día cambia.

## Los botones

Seis niveles, y la pregunta que los separa es **«¿qué me pasa si lo pulso sin
querer?»**. Antes casi todos eran verdes, y un verde que lo mismo guarda que te
lleva a cambiar tu tarjeta deja de decir nada.

| Clase | Cuándo | Aspecto |
| --- | --- | --- |
| `btn-primary` | Lo que has venido a hacer. **Una por pantalla** | menta maciza |
| `btn-soft` | Una acción más, normal y sin consecuencias | menta tenue |
| `btn-linea` | Mirar, consultar, salir a otro sitio. No cambia nada tuyo | fondo oscuro, borde menta |
| `btn-aviso` | Toca dinero o algo delicado, pero se deshace | luciérnaga |
| `btn-danger-ghost` | Destruye, o no tiene vuelta | coral |
| `btn-ghost` | Neutro: cancelar, cerrar, atrás. No es acción, es salida | apagado |

**La regla al dudar entre `soft` y `linea`: ¿ese botón ESCRIBE algo?** Si solo
enseña o lleva a otro sitio, es `linea`.

Y el reparto del amarillo importa: «Cerrar sesión» dejó de ser coral porque no
destruye nada —tu progreso sigue en tu cuenta y vuelves entrando—, pero tampoco
puede ser verde porque toca la sesión. Ese hueco es exactamente `btn-aviso`.

## El cobro

**Dos niveles y tres formas de pagar.** Los niveles son **Gratuito, Pro y
Fundador**, y así se llaman en toda la app — «plan libre» y «plan completo»
eran dos nombres más para lo mismo y ya no se usan. Mensual y anual son el
MISMO Pro: lo que cambia es cada cuánto se cobra, no lo que se abre (por eso
`LIMITES` tiene dos entradas y no tres, y las tarjetas dicen «Pro mensual» y
«Pro anual»). Fundador es Pro sin fecha, pagado una vez, y es el que se
recomienda: no es una suscripción.

Precios **con MXN escrito** y con IVA dentro: $69 al mes, $590 al año y $890
una sola vez. El cupo de fundador (200, en `ajustes_negocio`) existe pero **no
se hace público**: `lugaresDeFundador()` sigue viva para la landing, y la app
ya no pinta el contador. Se cobra con **Stripe**, desde la landing y desde la
app:
ninguna de las dos cobra nada, las dos le piden a la funcion `pagar` una
direccion de stripe.com y llevan alli. La tarjeta no pasa por Norata.

**Donde vive el candado, que es lo unico que hay que tener claro:**

| Quien | Que puede hacer con `suscripciones` |
| --- | --- |
| La app, la landing, cualquiera | leer su propia fila |
| La funcion `cobro` | escribir, y solo con la firma de Stripe |

La tabla **no tiene ninguna politica de escritura para nadie**, ni para el
dueno de la fila. Por eso `js/10d-plan.js` no es seguridad y no intenta serlo:
quien reescriba el JavaScript se engana a su propia pantalla y al recargar la
mentira se cae. La pregunta no es si alguien puede saltarselo, sino si puede
conseguir que el servidor le crea — y eso se contesta en `supabase/planes.sql`.
`mi_plan()` decide la vigencia contra el reloj del servidor: mover el del
telefono no revive nada.

**Congelar, nunca quitar.** Al dejar de pagar, lo que pasa del limite queda
visible y en solo lectura; el XP no se toca; la app nunca elige que se congela.
Por eso los ayudantes preguntan por CREAR (`cabeUnoMas`, `planPermite`) y
ninguno pregunta por VER. Los limites viven todos en `LIMITES`, un solo sitio.

Los pasos de Stripe estan en `supabase/LEEME.md`. Dos que muerden: `cobro` se
despliega con `--no-verify-jwt` o todos los avisos rebotan con 401 en silencio,
y la firma se calcula sobre el texto **exacto** que llego —re-serializarlo la
rompe para siempre—.

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
