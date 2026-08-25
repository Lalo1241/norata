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

## La lista

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
  | luciérnaga | `#f5d76e` | `#f5c314` |
  | coral | `#ff8a70` | `#ff603d` |
  | lila | `#b7a2ea` | `#7d50ea` |
  | celeste | `#6fc3e8` | `#23ace8` |
  | verde | `#8fd18a` | `#45d13b` |
  | rosa | `#f0a5c0` | `#f03e7e` |
  | acero | `#9aa7b8` | `#6287b8` |

- Tres ayudantes deciden qué cara usa cada cosa: `pinta()` para rellenar,
  `tinta()` para escribir o trazar, y `velo()` para el fondo tenue de una
  pastilla. Hacía falta separarlos: un relleno se ve a cualquier tono, pero
  un número escrito en luciérnaga de día da 1,47 sobre 1 y no se lee. Al
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
