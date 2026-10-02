# Las novedades de Norata

`novedades.json` es lo que cambió en Norata **contado para quien la usa**. Lo
lee la app (la ventana que sale al estrenar una versión y Ajustes → Novedades)
y lo leerá tal cual la página de changelog del sitio el día que exista: por eso
es JSON y no un trozo de JavaScript.

**No es `VERSIONES.md`.** Aquel es el libro de recetas —cada decisión y el
fallo que la motivó—, se escribe para quien toca el código y no se publica.
Esto dice qué ganas tú, en dos o tres renglones.

## Una entrada por cada 3º tramo

```json
{
  "version": "0.7.149",
  "fecha": "2026-09-30",
  "estado": "borrador",
  "clase": "mejora",
  "titulo": "Lo que llegó, en una frase corta",
  "resumen": "Una o dos frases: qué cambia para ti.",
  "puntos": ["Dos o tres cosas concretas", "…"],
  "imagen": { "src": "novedades/img/0.7.149-algo.jpg", "alt": "Qué se ve", "en": { "alt": "…" } },
  "grafico": { "tipo": "cifras", "titulo": "…", "datos": [{ "valor": "5", "texto": "…" }] },
  "retoques": [
    { "version": "0.7.149.1", "texto": "Un renglón por cada 4º.", "en": { "texto": "…" } }
  ],
  "en": { "titulo": "…", "resumen": "…", "puntos": ["…"] }
}
```

- **Un 3º nuevo es una entrada nueva, arriba del todo.** Un 4º es una línea en
  `retoques` de la entrada de su 3º (ver la regla del 4º en `VERSIONES.md`).
- **La fecha va en ISO** (`2026-09-30`) y en hora de México, como todas.
- **`en` es opcional.** Sin ella, en inglés se lee el español: mejor eso que
  nada.
- Lo que no le importa a quien usa la app —un arreglo interno, un
  documento— no lleva entrada ni retoque.

## El alta es la novedad: una ficha por cambio

Eduardo lo cerró el 2 oct 2026, al juntar esto con la sala **Subidas** del
panel («Norata por dentro»): dar de alta un cambio allí y escribir su novedad
aquí son **la misma ficha**, no dos listas que haya que mantener parejas.

| Campo | Qué es |
| --- | --- |
| `id` | El nombre de la ficha, en minúsculas y con guiones (`vitrina-logros`). Se pone al darla de alta y **no cambia nunca**: por él la reconocen la app (lo que ya viste) y Framer (el `Slug`) |
| `estado` | `borrador` (dada de alta, espera) → `aprobado` (con tu visto bueno, espera a que suba su paquete) → `publicado` (en vivo) |
| `version`, `fecha` | Las del **paquete** en que sale. Varias fichas pueden compartirlas |
| `toca` | Opcional: las zonas de la app que mueve (`["Mundos", "La puerta"]`). Lo usa Subidas, no el changelog |

- **Una sola aprobación.** Aprobar el cambio en Subidas es aprobar su texto.
- **Las cinco primeras fichas no llevan `id`** y se reconocen por su versión
  (`v0-7-148`). No se les pone ahora: cambiarles el nombre las anunciaría otra
  vez en cada dispositivo y las duplicaría en Framer.
- **Dos fichas con la misma versión y sin `id` no pasan**: el exportador se
  niega, porque en Framer una pisaría a la otra.
- Mientras Subidas no exista, las fichas las siguen escribiendo las sesiones,
  como hasta hoy. El formato ya es el que Subidas va a leer.

## La clase: cuánto pesa (0.7.151)

Eduardo pidió distinguir qué novedad es más grande que otra. **La decide qué le
cambia a quien usa la app, no el número**: un 3º puede ser un mundo entero o
tres arreglos.

| `clase` | Qué es | En la app | En la web |
| --- | --- | --- | --- |
| `expansion` | Algo que no existía: un mundo, un módulo, una forma nueva de usar Norata | Ventana, con imagen y gráfico | Destacada: tarjeta grande con su imagen |
| `mejora` | Algo que ya tenías, ahora mejor | Ventana, solo texto | Tarjeta normal |
| `arreglo` | Algo que fallaba y ya no | **Sin ventana**: el aviso chico | Renglón compacto |

Sin `clase`, una entrada cuenta como `mejora`. Un arreglo no abre ventana a
propósito: interrumpir a alguien para decirle que algo ya no falla es pedirle
que se detenga por un problema que quizá ni vio.

**Al dudar entre dos, la pregunta es «¿lo contaría alguien a otra persona?»**
Si sí, es una expansión. Si lo notaría al usarlo pero no lo contaría, es una
mejora. Si solo lo nota quien lo sufría, es un arreglo.

### El hito: la beta y la 1.0 (0.7.152)

Una cuarta clase que no es un tamaño sino un momento, y solo hay dos: la
entrada en la beta (`"version": "0.8"`, `"hito": "beta"`) y el lanzamiento en
la Play Store (`"version": "1.0"`, `"hito": "1.0"`). Eduardo pidió para ellos
«un anuncio muy especial en diseño, con animaciones, y más cosas».

- **No abre la ventana: abre una escena** (`abrirHito`, `js/10l-novedades.js`),
  rehecha en 0.7.153 con lo que Eduardo pidió al verla:
  - **Con el estilo del mundo puesto** (su acento, sus botones), pero de noche.
  - **El número grande y el texto en la letra de la app** (`--sans`), nunca en
    la del mundo: en Arcade y Averno «Beta» no se leía.
  - **La ruleta no crece con las versiones** (0.7.157.2): pasan como mucho 36
    (beta) o 44 (1.0), elegidas por `hitoMuestra` —la primera, la primera de
    cada 2º tramo, las expansiones, las de `camino` con `"relevante": true`, y
    relleno repartido—, y para en «0.8.0» o «1.0.0». Para que una versión
    vieja pase siempre, se le pone `"relevante": true` en `camino`.
  - **Gira en el centro de la pantalla** (0.7.157.1): isotipo, etiqueta y
    ruleta; con los últimos números suben a su sitio y al parar se despliega
    lo demás.
  - **El número gira como una ruleta** (0.7.153.2) por cada 3º publicado: en
    la beta, por la alpha hasta caer en «Beta»; en la 1.0, desde la primera
    versión, por la beta y sus actualizaciones, hasta la 1.0 (la pantalla entera, 9 s como mucho: 0.7.159).
    La lista es `camino` —lo de antes de las novedades, sacado de
    `VERSIONES.md` y que ya no se toca— más las entradas.
  - **`{versiones}` en un texto se rellena solo** con cuántas versiones van
    (`camino` más las entradas de 3º hasta la vigente). Un número escrito a
    mano en un borrador se queda viejo antes de publicarse.
  - **Una insignia por etapa** (0.7.156): la de la etapa en que llegaste,
    igual en los dos hitos. Hexágono con α para la alpha, rombo con β para la
    beta. Es el lenguaje de todas las insignias de la app (`insigniaSVG`,
    ver «Las insignias» en `CLAUDE.md`).
  - **Debajo, un reporte que aparece al bajar**: días, días con algo hecho,
    mejor racha, misiones, nodos, la habilidad más alta, nivel y rango, la
    primera misión y un punto por día de las últimas semanas. Sin láminas:
    las láminas son del aniversario.
- **Se celebra una vez por persona**, no por dispositivo (`settings.hitosVistos`
  viaja con la cuenta).
- **Sus borradores ya están escritos** (las entradas `0.8` y `1.0`, sin fecha).
  El día del hito se les pone la fecha, se aprueban y salen con esa versión.
  **La de la 1.0 lee la fecha de la de la beta** para saber quién llegó antes
  de ella: no se borra la de la beta.
- **Se prueban sin esperar**: con `?novedades=borrador`, en Ajustes →
  Novedades, «Probar el anuncio de la beta» y «de la 1.0». No apunta nada.
- **La etiqueta «Alpha» del número de versión cambia sola**: `0.8` y siguientes
  dicen «Beta», y en la `1.0` desaparece (`pintarVersion`, `js/11-arranque.js`).

## La imagen y el gráfico (opcionales)

Para las que lo merecen, que casi siempre son expansiones.

- **`imagen`**: una captura de la app de verdad, o una ilustración aprobada.
  Va en `novedades/img/`, se llama por su versión (`0.7.148-cyberpunk.jpg`) y
  **nunca se sobrescribe**: si cambia, cambia de nombre. Un dispositivo, el
  service worker y Framer guardan la imagen por su dirección y no la vuelven a
  pedir. JPG a 1440×810 (16:9) y por debajo de 150 KB. `alt` dice lo que se
  ve, no lo que significa.
- **`grafico`**: datos, no un dibujo, y puede ser uno o una lista. Cuatro formas
  (rehechas en 0.7.153, cuando Eduardo vio las primeras barras: «largas, sin
  diferenciar, y el antes y ahora como cuatro barras sueltas»):

  | `tipo` | Para qué | Cada dato |
  | --- | --- | --- |
  | `cifras` | dos a cuatro números que cuentan | `valor`, `texto`, `icono`, `tono` |
  | `comparar` | **un antes y un ahora**: puntitos, «1 → 5» y la diferencia | `texto`, `antes`, `ahora`, `icono`, `tono` |
  | `barras` | proporciones entre cosas, cortas | `valor`, `texto`, `icono`, `tono` |
  | `colores` | **presentar paletas o colores**: sus muestras y su nombre | `nombre`, `colores: ["#…"]` |

  `tono` es uno de los ocho colores de la app (1-8): **cada dato en uno
  distinto**, que es lo que los separa de un vistazo. `icono`, uno de los de la
  app (`js/01-base.js`, `ICONS`). **Cuando una novedad hable de colores, va un
  bloque `colores`**: decir «Ácido» sin enseñar el ácido no presenta nada. La
  app lo dibuja con los colores del mundo de quien mira; para la web lo dibuja
  `herramientas/novedades-framer.py` como SVG, que se rehace al correrlo
  —mientras la entrada sea borrador da igual; publicada, si cambia el gráfico
  cambia su nombre, como las imágenes—.
- **En la app de Android no sale la imagen** (sí el gráfico): solo puede
  enseñar lo que viaja dentro del paquete, y meter todas las imágenes lo haría
  crecer con cada expansión. Se quita sola, sin dejar hueco.

### Para la tarjeta del sitio: el banner y dónde cae cada imagen

Eduardo lo pidió el 2 oct 2026, con los parches de Steam de ejemplo: **una
expansión lleva arriba una imagen ancha, pegada a los cantos de la tarjeta, y
las demás imágenes van entre el texto, no todas al final.** Son tres campos
que solo mira el exportador; la app no los lee.

```json
"imagen":   { "src": "novedades/img/0.7.148-cyberpunk.jpg", "alt": "…", "tras": 1 },
"imagenes": [{ "src": "novedades/img/0.7.148-paletas.jpg", "alt": "…", "tras": 2 }],
"banner":   { "foco": "70% 21%" }
```

| Campo | Qué hace |
| --- | --- |
| `banner.foco` | Adónde mirar dentro de la `imagen` para el banner, que es 4:1 y una captura es 16:9. Se escribe como un `object-position` («70% 21%»: 70 % a lo ancho, 21 % a lo alto). Sin él se queda la franja del centro |
| `banner.src` | Un arte hecho para el banner, en vez de recortar la `imagen`. Con su `alt` |
| `tras` | A qué punto acompaña esa imagen: `1` es el primero. Sin `tras`, al último. `0` la pone antes de todos, sin pie |
| `imagenes` | Más imágenes de acompañamiento, cada una con su `src`, su `alt` y su `tras` |

- **Una expansión sin `banner` ni `imagen` sale sin banner**, y el exportador
  lo avisa al correr.
- **La `imagen` que sale de banner no se repite debajo** (Eduardo la vio dos
  veces en la misma tarjeta y lo paró). En el cuerpo solo van las de
  `imagenes`, y la `imagen` únicamente cuando el banner trae su propio
  `src`.
- **La imagen de acompañamiento de un mundo o una paleta es la misma pantalla
  partida en diagonal, de día a la izquierda y de noche a la derecha.** Se
  saca con `herramientas/capturas/` (ahí están los pasos) y se llama
  `<versión>-<qué>-dia-y-noche.jpg`.

### El gráfico, en el sitio

El SVG del sitio se rehízo el 2 oct 2026 con lo que Eduardo le vio al primero:
no tenía la identidad de Norata clásico, las paletas no tenían esquinas
redondas ni decían cuándo se gana cada una, y los números no llevaban un texto
que dijera qué contaban. Tres campos más en cada dato, que hoy solo lee el
exportador:

| Campo | En qué forma | Qué dice |
| --- | --- | --- |
| `detalle` | `cifras`, `comparar` | Qué hay detrás del número. En `cifras`, una frase («Señal, Enlace, Protocolo, Núcleo y Leyenda.»); en `comparar`, **qué es lo que llegó**, corto y en un renglón («+ Cobre, Zafiro y Oliva») |
| `nota` | `colores` | Cuándo se tiene esa paleta: «De partida», «Con el mundo», «Se gana en el nivel 18» |
| `candado` | `colores` | `true` si hay que ganarla: la nota sale en amarillo con su candado |

- **Cada cosa que el texto menciona lleva su imagen al lado**, no una sola
  para toda la ficha. Eduardo lo vio en la 0.7.147: hablaba de los ambientes
  nuevos y ninguna imagen los enseñaba. Quedó con dos filas: tras el punto de
  las paletas, su captura y su lámina; tras el de los ambientes, los cuatro
  en tiras (`herramientas/capturas/tiras.mjs`) y la lámina que dice en qué
  nivel se abre cada uno.
- **El «antes y ahora» no lleva pastilla de «+4»** ni se titula «Antes y
  ahora»: los dos números ya lo dicen y van rotulados. El título dice QUÉ
  cambió («Paletas nuevas por mundo»).
- **Un número sin `detalle` no explica nada**, que es justo lo que Eduardo
  señaló. Al escribir un gráfico nuevo, cada dato lleva el suyo.
- **La lámina mide siempre 1200×675** y lleva la letra Outfit dentro (sale de
  `css/fuente.css`) y los iconos de la app (`ICONS`). Dos bloques van lado a
  lado; más de cuatro no caben.
- **Su archivo lleva la huella de su contenido en el nombre**
  (`0.7.148-grafico-30103c2e.svg`) y el exportador borra el anterior: si el
  dibujo cambia, cambia de dirección solo, y nadie se queda viendo el viejo.
- La app sigue dibujando su gráfico con sus propias reglas
  (`novedadBloqueHTML`): estos tres campos todavía no los enseña.
- **Las imágenes van ARRIBA y su punto debajo, de pie de foto**, con aire
  entre un tramo y el siguiente (Eduardo, 2 oct 2026: con el texto encima no
  se entendía a qué imágenes correspondía). Vale para toda ficha.
- **Las imágenes que caen en el mismo sitio salen en una fila**, y los
  bloques del gráfico llevan su `tras` igual que una imagen: los que
  comparten `tras` van en la misma lámina. **Todas las de una tarjeta miden lo mismo**
  —una caja 16:9, media tarjeta en computadora y entera en teléfono— y se
  abren más grandes al tocarlas. De eso se encarga el componente del sitio,
  no hay que recortar nada.
- **El `foco` se comprueba mirando la tarjeta**, no a ojo sobre la captura: en
  teléfono el banner es menos ancho y enseña más alto.

## El changelog del sitio (Framer)

El sitio vive en Framer y su changelog es una colección del CMS. Sale del
mismo JSON:

```sh
python herramientas/novedades-framer.py              # lo publicado
python herramientas/novedades-framer.py --borradores # para probar el diseño
```

Escribe `novedades/framer.csv` (una fila por entrada, con las columnas en
español y en inglés, la clase, «Destacada» para las expansiones, el `Cuerpo`
en HTML —puntos, imágenes, gráfico y retoques, ya en su orden— y el `Banner`
con su `Banner foco`) y los SVG de los gráficos en `novedades/img/`. Con
`--borradores` escribe en `novedades/framer-borradores.csv`, que no se
versiona ni se publica: es para probar el diseño importándolo a mano.

**La tarjeta del sitio es UN componente de código, `TarjetaNovedad`** (vive en
Framer, en Assets → Code; su copia está en `herramientas/framer/`). Lo era
con capas de Framer y se rehízo el 2 oct 2026 porque con capas no salía lo que
Eduardo pidió: el banner pegado a los cantos, las imágenes entre el texto y
todas del mismo tamaño, el zoom al tocarlas, y «Retoques» con su rótulo y su
raya. Tres consecuencias:

- **`Cuerpo` y `Body (EN)` son Plain Text en el CMS, no Formatted Text**: el
  componente recibe el HTML tal cual y le pone los estilos de sus clases
  `nv-*`. `Banner` es Image; `Fecha`, Date.
- **Cambiar cómo se ve la tarjeta es cambiar el `.tsx` y volver a pegarlo en
  Framer**, no mover capas. Y cambiar el HTML que sale de `cuerpo()` pide
  mirar que el componente siga teniendo estilo para esas clases.
- **Los tonos y la letra están escritos dentro del componente** (los de la
  cara clara del sitio). Si el sitio cambia de aspecto, la tarjeta no lo sigue
  sola.

**La colección se llena por una cadena, y nadie copia nada a mano** (Eduardo,
1 oct 2026):

| Eslabón | Quién lo mueve | Cada cuánto |
| --- | --- | --- |
| `novedades.json` → `framer.csv` | el hook de pre-commit, al entrar el JSON | en el mismo commit |
| `framer.csv` → mi.norata.app | GitHub Pages | al subir a `main` |
| mi.norata.app → hoja de Google | el script de la hoja (`herramientas/novedades-hoja.gs`) | cada hora |
| hoja de Google → CMS de Framer | el plugin Google Sheets de Framer | **un clic en «Sync», y publicar el sitio** |

- **`framer.csv` solo lleva lo publicado**, así que aprobar una entrada sigue
  siendo lo único que la saca: en la app y en el sitio.
- **La app anuncia lo mismo** (0.7.180): la lista de Ajustes → Novedades y la
  ventana que sale al abrir siguen esta misma regla (`novedadDestacada`, que
  tiene que decir lo mismo que `va_al_sitio`), y enseñan las imágenes y los
  gráficos con su punto de pie, como la tarjeta del sitio.
- **Y solo lo destacado** (Eduardo, 2 oct 2026): Framer admite 1000 filas por
  colección y la app llevaba más de cien versiones en seis semanas. Al sitio
  van las **expansiones y las nuevas etapas**; una mejora o un arreglo se
  quedan en la app, salvo que su ficha lleve `"sitio": true`. Con
  `"sitio": false` se saca del sitio una expansión que no lo merezca. La app
  no mira ese campo: en Ajustes → Novedades sale todo lo publicado. El
  exportador avisa al pasar de 800 filas y se niega con más de 1000.
- **Si el CSV se queda viejo no falla nada**: la app enseña la novedad y el
  sitio no. Por eso lo vigila `.github/workflows/novedades-framer.yml`, que
  lo rehace y compara. Un hook no corre en un rebase ni en una máquina sin
  `core.hooksPath`.
- **El último eslabón no es automático**: el plugin de Framer sincroniza al
  pulsar su botón, y un cambio del CMS no llega al sitio hasta publicar. Si
  algún día estorba, la Server API de Framer hace las dos cosas desde un
  script.
- **El script de la hoja comprueba antes de borrar**: si el CSV no contesta o
  llega a medias, la hoja se queda con lo último bueno.
- **La clase `hito` se llama «Nueva etapa» en pantalla y va en morado**, en la
  app y en el sitio (Eduardo, 1 oct 2026: «hito» no le decía de qué iba). Por
  dentro sigue siendo `hito`.
- **Framer casa las filas por `Slug`** (`v0-7-148`). No se cambia cómo se
  forma, o cada entrada se duplicaría en la colección.
- El banner lo baja Framer de `mi.norata.app` al sincronizar, y las imágenes
  del cuerpo las pide de ahí el navegador de quien mira: lo que no esté
  publicado todavía llega sin imagen.

## Nada sale sin que Eduardo lo apruebe

Es suya (0.7.149). Cada entrada nace con `"estado": "borrador"`, y la app solo
enseña las `"publicado"`.

1. **La sesión que publica una versión escribe su entrada o su retoque**, en
   borrador, en el mismo commit que la línea de `VERSIONES.md`.
2. **Eduardo lo revisa en el Puesto de mando → Subidas**, que le abre cada
   ficha entera, en español y en inglés (0.7.178). O con `?novedades=borrador`:
   en Ajustes → Novedades salen entonces las que faltan, marcadas «Por
   aprobar» —la palabra «Borrador» se leía como que el parche era de mentira
   (0.7.179)—, y un botón enseña la ventana tal
   como se verá. `?novedades=` lo apaga. Solo vale para esa pestaña.
3. **Al aprobarla** se cambia a `"publicado"` —a mano en GitHub o pidiéndoselo
   a una sesión—. Como este archivo está en `ASSETS`, el cambio llega a los
   dispositivos con la siguiente versión que se publique. Si corre prisa, se
   publica solo eso como un 4º de la versión vigente.

**Una ficha ya publicada también pasa por él cuando se le cambia un texto.**
El paso de borrador solo protege a las fichas nuevas: el 2 oct 2026 se le
añadieron a la 0.7.147 y a la 0.7.148 —publicadas las dos— los `detalle`, las
`nota`, los títulos de sus gráficos y los `alt` de sus imágenes, y salieron al
sitio y a la app sin que Eduardo los leyera, porque nada los detenía. Lo
preguntó él al verlo. Desde entonces: **todo texto nuevo o cambiado en una
ficha publicada se le enseña escrito ANTES de subirlo** —el español y el
inglés—, y se sube con su visto bueno. Vale igual para lo que se escribe
dentro de una imagen (los rótulos de una captura, los textos de una lámina).

La ventana se apunta como vista POR ENTRADA, no por número de versión: una
entrada aprobada días después de que su versión llegó sale igual la próxima vez
que se abra la app.

## Cómo se escribe

Las reglas de «El tono» de `CLAUDE.md`, y además:

- **Qué ganas tú, no cómo se hizo.** «Cambiar de mundo ya no parpadea», no
  «la hoja de los mundos se engancha antes del primer pintado».
- **Tuteo, español de México, sin exclamaciones** y sin mayúsculas para
  gritar.
- **Corto.** El título en una línea; los puntos, uno por renglón en el
  teléfono.
- **Cada punto dice algo que el resumen no dijo.** Si repite el resumen con
  otras palabras, o tranquiliza («no cambia nada de lo tuyo») en vez de
  contar, se quita (Eduardo, 0.7.153.2). Un hito se festeja: lo hicimos
  bien, y eso se celebra con quien lo usa, no se le explica.
