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
  - **Gira en el centro de la pantalla** (0.7.157.1): isotipo, etiqueta y
    ruleta; con los últimos números suben a su sitio y al parar se despliega
    lo demás.
  - **El número gira como una ruleta** (0.7.153.2) por cada 3º publicado: en
    la beta, por la alpha hasta caer en «Beta»; en la 1.0, desde la primera
    versión, por la beta y sus actualizaciones, hasta la 1.0 (nueve segundos).
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

## El changelog del sitio (Framer)

El sitio vive en Framer y su changelog es una colección del CMS. Sale del
mismo JSON:

```sh
python herramientas/novedades-framer.py              # lo publicado
python herramientas/novedades-framer.py --borradores # para probar el diseño
```

Escribe `novedades/framer.csv` (una fila por entrada, con las columnas en
español y en inglés, la clase, «Destacada» para las expansiones, el cuerpo en
HTML con los retoques, y las direcciones completas de la imagen y del gráfico)
y los SVG de los gráficos en `novedades/img/`. En Framer: la colección se
importa desde ese CSV. **Antes de importar hay que publicar** —subir a `main` y
esperar el minuto de GitHub Pages—, porque Framer baja las imágenes de
`mi.norata.app` en ese momento.

## Nada sale sin que Eduardo lo apruebe

Es suya (0.7.149). Cada entrada nace con `"estado": "borrador"`, y la app solo
enseña las `"publicado"`.

1. **La sesión que publica una versión escribe su entrada o su retoque**, en
   borrador, en el mismo commit que la línea de `VERSIONES.md`.
2. **Eduardo lo revisa en la app** con `?novedades=borrador`: en Ajustes →
   Novedades salen los borradores marcados, y un botón enseña la ventana tal
   como se verá. `?novedades=` lo apaga. Solo vale para esa pestaña.
3. **Al aprobarla** se cambia a `"publicado"` —a mano en GitHub o pidiéndoselo
   a una sesión—. Como este archivo está en `ASSETS`, el cambio llega a los
   dispositivos con la siguiente versión que se publique. Si corre prisa, se
   publica solo eso como un 4º de la versión vigente.

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
