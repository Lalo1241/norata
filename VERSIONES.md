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
