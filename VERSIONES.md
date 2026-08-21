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

## Al subir la versión

Cuatro sitios, y son cuatro a propósito:

1. `VERSION` en `js/01-base.js`
2. `VERSION_FECHA`, ahí mismo
3. `CACHE` en `sw.js`, con el mismo número — es lo que obliga a los aparatos
   ya instalados a soltar la copia vieja
4. Una línea en esta lista

## La lista

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
