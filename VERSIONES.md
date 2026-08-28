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
