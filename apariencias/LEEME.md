# Apariencias de Norata

**Este documento manda.** Todo lo de apariencias —recolores, mundos, la tienda,
la pantalla de Ajustes, el nivel de expedición y los rangos— se decide aquí. El
tema estuvo repartido entre dos conversaciones y seis láminas sueltas, y de esa
partición salió una contradicción real (abajo, «Lo que no cuadraba»). Si algo se
vuelve a trabajar en otro sitio, se trae aquí antes de construirlo.

## De dónde salió esto

Del 28 al 30 de agosto de 2026, en dos frentes que no se veían. Todo está ya
recuperado y escrito en el repositorio; las láminas se quedan como vista, no
como fuente.

| Lámina | Qué traía | Dónde vive ahora |
| --- | --- | --- |
| Recolores de Norata | Los ocho ambientes, con sus tonos medidos | `apariencias/datos.py`, `apariencias/ambientes.css` |
| Nivel de expedición | Los puntos, la curva y la escalera de premios | `apariencias/datos.py` |
| Rangos de expedición | Los cinco rangos y por qué no son diez | `apariencias/datos.py` |
| Camino a la beta | El orden hasta 0.8 y las cuatro tandas | Aquí abajo, «Dónde encaja» |
| Mundos de Norata | Los cinco mundos del primer borrador | Superado por `mundos/MUNDOS.md` (catorce) |
| Ambientes de Norata | El borrador del que salieron los recolores | Superado por «Recolores» |

## Las palabras, que estaban chocando

Es lo primero que hay que fijar, porque las dos conversaciones usaban **«mundo»
para cosas distintas** y eso solo termina en un bug. Queda así:

| Palabra | Qué es | Cuántos | Cómo se consigue |
| --- | --- | --- | --- |
| **Apariencia** | El paraguas. Es la palabra que ya usa la app en `js/10d-plan.js` | — | — |
| **Ambiente** | Un **recolor**: reusa el material que ya hay y le cambia la luz | 8 | Se ganan con el nivel; dos piden Pro |
| **Mundo** | Cambia el **material**: otra superficie, otro marco, otra letra, otro peso al moverse | 14 diseñados | De pago |

Un ambiente y un mundo **son excluyentes**: un mundo declara sus propios
colores, así que un ambiente por debajo no se vería. Se elige una apariencia,
no dos. El modo claro/oscuro es un eje aparte y sigue siendo de todos.

Y muere una palabra: **«grado 3» ya no se llama «mundo»**. Tinta es un ambiente
de grado 3 —invierte `--sobre-macizo`, que ningún otro toca— y sigue siendo un
recolor. Los mundos son las otras catorce cosas.

## Los ocho ambientes

Los tonos están en `apariencias/datos.py` y salen ya escritos en
`apariencias/ambientes.css`. Aquí solo el reparto.

| Ambiente | Grado | Abre en | Qué es |
| --- | --- | --- | --- |
| Noche de expedición | 0 | Desde el día uno | El de casa. No se desbloquea porque es donde empiezas |
| **Tinta** | 3 | Desde el día uno · **gratis siempre** | Tinta china sobre papel. Para quien no distingue bien los colores es la única forma de usar la app, así que cobrarla sería cobrar por entrar |
| Musgo | 1 | Nivel 3 · con **Brote** | Bosque cerrado de noche, luz entre hojas de día |
| Marea | 2 | Nivel 5 · **Pro** | Verdiazul de agua honda, con la menta vista bajo el agua |
| Adobe | 1 | Nivel 7 · con **Refugio** | Barro cocido con cal. La cálida amable |
| Escarcha | 2 | Nivel 12 · con **Cima** · **Pro** | La menta se vuelve celeste; la app acompaña en vez de festejar |
| Duna | 1 | Nivel 20 · con **Norte** | Desierto de noche: violeta y lavanda, no café |
| Reliquia | 2 | **Fundador** | El lila de Fundador extendido a toda la app |

**Grado 1** solo mueve el suelo; **grado 2** además mueve las tres variables del
acento; **grado 3** rompe una regla que ningún otro rompe.

**Contraste, cara de día, que es la que aprieta.** Umbral 4,5 para escribir y 3
para trazar. Los siete pasan y Musgo pasa mejor que el clásico.

| Ambiente | Tinta sobre relleno | Escribir | Trazar | Trazo vs carril |
| --- | --- | --- | --- | --- |
| Noche de expedición | 8,67 | 5,46 | 3,17 | 2,22 |
| Musgo | 8,06 | 6,30 | 3,74 | 2,67 |
| Marea | 9,81 | 5,73 | 3,53 | 2,49 |
| Duna | 7,92 | 5,87 | 3,49 | 2,24 |
| Adobe | 7,90 | 5,78 | 3,44 | 2,23 |
| Escarcha | 7,48 | 5,48 | 3,36 | 2,35 |
| Tinta | 16,89 | 16,89 | 16,89 | 2,06 |

Tinta va por libre porque su acento es la propia tinta: por eso es la que se lee
en el camión a mediodía. **Su única excepción:** de día invierte
`--sobre-macizo` a `#f7f9fc`. En los otros siete la tinta que va encima de un
relleno es oscura, porque los tres acentos vivos son claros en los dos modos;
el relleno de Tinta de día es casi negro, y la tinta de la casa encima daría
1,03 sobre 1 — invisible. Es la razón de que sea grado 3.

**Niebla no existe, y murió midiendo.** Iba a ser el gris de bruma. Antes de
pintarlo, su cara de día chocaba con cuatro de los otros. La razón es más útil
que el descarte: **gris es en lo que se convierte cualquier ambiente al bajarle
la saturación**, así que un ambiente gris no es un ambiente, es la versión
desteñida de todos los demás. Ese hueco ya lo llena Tinta, que además hace algo.

## Los catorce mundos

Viven en **`mundos/MUNDOS.md`**, con sus variables en `mundos/mundos.css`, sus
vectores en `mundos/svg/` y la vista comparada en `mundos/vista.html`. Aquí solo
lo que hace falta para el negocio: **son de pago**, pesan entre 28 y 180 KB, y
los cuatro autorizados por orden son **Averno, Blueprint, Consola y Arboleda**.

Consola es la excepción del negocio: **gratis siempre**, por lo mismo que Tinta
—no necesita ni una imagen y es la red de seguridad para quien no distingue bien
los tonos—, y porque conviene que se vea que los mundos existen antes de que
haya nada que comprar.

## El motor

No existe. Comprobado el 30 de agosto sobre `origin/main` en 0.7.39.1: no hay
cargador, ni `--m-*`, ni CSS de apariencia servido, en ninguna rama ni en ningún
commit. Lo que sí existe y se le parece son dos cosas distintas: **la capa de
material** de 0.7.37, que es el camino por donde entra un mundo, y **la llave
`apariencia`** de `js/10d-plan.js`, que es la caja registradora.

Este es el contrato, y se escribe antes de programar nada para que dos sesiones
no construyan dos motores distintos.

### Cómo se aplica

```html
<html class="claro" data-apariencia="averno">
```

Un atributo y no una clase, porque **son excluyentes** y un atributo no puede
llevar dos valores: el modelo se hace cumplir solo. El modo claro sigue siendo
`class="claro"`, que es un eje aparte y no se toca.

### Los cuatro sitios que hay que tocar

| Qué | Dónde | Nota |
| --- | --- | --- |
| Aplicar antes de pintar | el script de arriba de `index.html` | Junto al modo claro y a `sc`. Si esperara al script principal, cada carga daría un fogonazo con la apariencia vieja |
| El motor | `js/10i-apariencia.js`, **nuevo** | Alta en `index.html` **y** en `ASSETS` de `sw.js` |
| Los ocho ambientes | `css/ambientes.css`, **nuevo** | ~6 KB. Va en `ASSETS`: es chico y cualquiera puede ganarse uno |
| Cada mundo | `css/mundos/<id>.css` | **NO van en `ASSETS`.** Se piden al encenderlos y se quedan cacheados por nombre |

**Por qué los mundos no van en `ASSETS`:** esa es la lista de la instalación.
Meter ahí catorce mundos le haría bajar más de un mega a quien no va a encender
ninguno. Un mundo se baja **una vez**, el día que lo enciendes — que es lo que
0.7.38 hizo posible.

Y la regla que 0.7.38 volvió inflexible: **al tocar cualquier archivo de
`ASSETS` hay que subir `CACHE` en `sw.js`.** Si no cambia, el aparato instalado
no vuelve a pedir nada nunca.

### Lo que el motor tiene que hacer, y en este orden

1. **Leer la elección** de `localStorage` (llave `norata-apariencia`), y del
   perfil cuando haya sincronía, para que viaje entre aparatos.
2. **Comprobar que se puede.** Si la apariencia guardada pide Pro y el plan ya
   no lo es, no se apaga a la brava — ver «Qué pasa al dejar de pagar».
3. **Pedir el CSS si hace falta** —solo los mundos— y **esperar a que cargue
   antes de aplicar el atributo**. Al revés se ve un fotograma con el atributo
   puesto y sin estilos, que es la app en colores rotos.
4. **Apagar las transiciones un turno**, exactamente como `ponerTema`:
   `cambiando-modo`, forzar el recálculo leyendo un estilo, y devolverlas con
   `setTimeout` —nunca con `requestAnimationFrame`, que en una pestaña de fondo
   no llega nunca y deja la app sin transiciones para siempre—.
5. **Cambiar `theme-color`**, que no lo pinta el CSS y sin él la apariencia
   queda con una ceja del color viejo encima.
6. **Volver a dibujar lo que se dibuja desde JavaScript**: el árbol de talentos
   lee `var(--...)` en los atributos del SVG.

**La trampa que va a morder si no se lee esto:** una transición sobre una
propiedad cuyo valor sale de una variable se queda congelada en Chrome, con el
color clavado en el primero que vio. Ya pasó cuatro veces —los selectores, el
botón de Ajustes, el botón de confirmar un borrado que salía verde en vez de
coral, y el cambio de modo claro—. Cambiar de apariencia cambia veinte
variables de golpe, así que es el mismo caso, más grande.

### Cómo se sube

**Detrás de un parámetro en la dirección**, como pide `CLAUDE.md` para todo lo
que pueda estropearle la experiencia a alguien: `?apariencia=musgo` la enciende
en esa pestaña, guardada en `sessionStorage` y no en `localStorage`, con su
rótulo fijo de que la pestaña está en modo prueba. Se sube apagada y Eduardo la
ve antes que nadie.

Y la comprobación: **la foto de los estilos calculados** de las siete pantallas
en los dos modos, antes y después, con `herramientas/foto.js` y `diff.js`. En
0.7.37 fueron 24 326 elementos y cambiaron 10, todos a propósito. Encender el
motor con la apariencia de casa puesta **tiene que cambiar cero**.

## La sección de personalización

Va **dentro de Ajustes**, no en una pantalla nueva y no en una pestaña de la
barra. Una tienda con su propio botón en la barra de abajo es un mostrador en tu
recámara; y además la app ya tiene el sitio natural: el interruptor de sol y
luna vive ahí, y una apariencia es la misma familia de decisión.

Se llama **Apariencia**, en singular, y tiene tres partes en este orden:

1. **Sol y luna**, que ya existe y no se mueve. Es lo que todo el mundo va a
   buscar ahí, y sacarlo de su sitio para meter lo nuevo sería cobrarle a quien
   no viene a comprar.
2. **Ambientes.** Una cuadrícula de muestras: cada una es la app en pequeño
   —fondo, tarjeta y acento—, no un círculo de color, porque un ambiente cambia
   tres cosas y un círculo solo enseña una. Las que no tienes salen apagadas
   **con su nivel escrito al lado**, que es lo que las convierte en una meta en
   vez de en una lista de lo que te falta.
3. **Mundos**, debajo y separados por un título, porque son otra cosa y cuestan
   dinero. Cada uno con su nombre, su premisa de una línea y su peso.

**Lo que nunca hace esta pantalla:** decidir por ti. Si tu apariencia deja de
estar disponible, se queda puesta y la pantalla lo dice; no se cambia sola.

## La tiendita

**No es una tienda, y esa es la decisión.** Norata no vende monedas ni cajas: lo
único que se compra es Pro o Fundador, y eso ya está construido y cobrado con
Stripe. Así que «la tiendita» es el escaparate dentro de la sección de
Apariencia, y funciona así:

- Un mundo bloqueado **se ve entero**, no en gris ni tapado. Se puede tocar y
  se pone de muestra un momento, con el rótulo de qué plan lo abre. Enseñar lo
  que se vende vende; esconderlo, no.
- El botón dice **«Ver Pro»** y lleva a la pantalla de plan que ya existe. No
  hay un botón de comprar por mundo: **la app no cobra nada**, le pide a la
  función `pagar` una dirección de stripe.com y lleva allí. La tarjeta no pasa
  por Norata.
- **Un solo precio.** No se venden mundos sueltos. Con catorce mundos sueltos
  hay catorce productos en Stripe, catorce precios que mantener y una pregunta
  nueva cada vez que sale uno; con Pro hay una sola frase: *todas las
  apariencias*. Es además lo que la tabla de precios ya promete.
- **Los ambientes no se venden nunca**, ni siquiera los de grado 2: se ganan con
  el nivel, y dos de ellos además piden Pro. Lo que se gana no se vende y lo que
  se vende no se gana — si se cruzan, el nivel deja de valer para quien pueda
  pagar.

### Qué pasa al dejar de pagar

La regla de la casa es **congelar, nunca quitar**, y la app nunca elige qué se
congela. Aplicada aquí:

- **El mundo que tienes puesto se queda puesto.** Quitártelo sería que la app
  eligiera por ti, y encima el mismo día que dejas de pagar.
- **No puedes cambiar a otro de pago.** Los demás vuelven detrás del candado.
- **Los ambientes ganados no se tocan.** Fundador se paga una vez, así que no
  hay un día en que se deje de pagar; y los que se ganan con el uso no se
  devuelven.

## El nivel de expedición

Es la cifra de la que cuelga todo lo anterior, y **hoy no existe**: `levelInfo()`
da niveles por habilidad y nadie suma el total. Sin ella un ambiente que se gana
no sabe cuándo se ganó.

El nombre ya estaba puesto sin querer: la pantalla de bienvenida dice «Tu
expedición empieza aquí».

**Los puntos no se guardan: se cuentan.** Es la decisión que sostiene lo demás y
no es un capricho técnico — es la regla que ya rige la sincronía, escrita en
`js/10-fusion.js`: «El XP no se suma a mano: se recalcula contando los
movimientos. Así una fusión no puede inflarlo aunque se repita mil veces.» Un
contador guardado se rompe justo ahí: dos aparatos que suman 100 cada uno se
juntan y se quedan con 100.

Tres cosas salen gratis por decidirlo así: es **retroactivo** —el día que se
publique, tu cuenta ya tiene su nivel, sacado de meses de datos que ya
existen—; la sincronía **no lo puede inflar ni perder**; y **nunca se
desalinea**, porque no hay un número guardado que pueda contradecir a los datos.
El único borde es borrar historial a mano, y se tapa con un piso —el nivel más
alto que hayas tenido, guardado aparte— que es un máximo, y un máximo sí se
fusiona sin problema.

### De qué se hace un punto

Todo lo que ya celebra la app, y nada más.

| Lo que hiciste | Puntos | Detalle |
| --- | --- | --- |
| Los dos primeros días de la semana | 40 | Con que aparezcas cuenta, y da igual qué dos días sean |
| Cada día más de esa semana | 5 | El quinto día seguido no vale lo que el primero |
| Misión cumplida | 2 | Hasta cinco al día |
| Etapa hecha | 5 | De un talento o de un encargo |
| Hito conseguido | 20 | Los mini-talentos |
| Hito de racha | 25 | 3, 7, 14, 30, 50, 100… |
| Una habilidad sube de nivel | 30 | Cuenta el nivel más alto que tuvo |
| Talento logrado | 50 | Meta cumplida o compra asegurada |
| Encargo terminado | 50 | Con todas sus etapas cerradas |
| Estreno | 15 | La primera habilidad, misión, talento y encargo. Una vez cada uno |

**Por qué el día se parte en dos.** Con un valor fijo por día, quien entra dos
veces por semana tardaba 4,4 años en llegar al último rango y quien entra cinco
tardaba 1,7: el sistema medía frecuencia, no constancia. Pagando fuerte las dos
primeras veces de cada semana, esa distancia se cierra a 2,3 contra 1,3 años sin
regalarle nada a nadie — y deja de tener sentido abrir la app diez segundos para
no perder el punto del día.

**Por qué los estrenos.** Sin ellos, el primer día de alguien de uso ligero da
14 puntos y se queda en nivel 0. Con ellos cualquiera termina su primera sesión
con nivel 1. El primer premio tiene que llegar el primer día o no hay segundo.

### La curva

Sin tope. Los tres primeros niveles van en rampa aparte —15, 35 y 60 puntos—
para que la primera tarde tenga premio; del cuarto en adelante, **30 × nivel +
15**. Es una recta y no una explosión: con la curva de las habilidades (×1,5 por
nivel) el nivel 40 pediría cuatro millones de puntos.

| Perfil | Día 1 | Semana | Mes | 6 meses | 1 año | 2 años | 5 años |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ligero | 2 | 3 | 6 | 13 | 18 | 25 | 41 |
| Normal | 2 | 4 | 8 | 17 | 25 | 35 | 55 |
| Intenso | 2 | 5 | 10 | 22 | 31 | 44 | 69 |

Simulado día por día sobre cinco años, con los mismos perfiles con los que se
calibró la curva de las habilidades.

### La escalera

**El reparto nuevo, con dos reglas que antes no estaban.** La primera: *cada
rango trae su ambiente*, así que la escalera son cinco capítulos y no doce
premios sueltos. La segunda: *nada dura más de seis niveles sin pasar algo*, y
**el primer premio de pagar llega en la primera semana**, no a los dos meses y
medio.

| Nivel | Qué abre | Para quién |
| --- | --- | --- |
| **día 1** | **Tinta**, y con ella el rango Semilla | todos |
| **día 1** | **Los catorce mundos** | Pro |
| 1 | Rango **Semilla**, y aparece la barra | todos |
| 2 | Destello propio al cumplir una misión | todos |
| 3 | Rango **Brote**, y con él el ambiente **Musgo** | todos |
| 5 | Ambiente **Marea** | **Pro** |
| 7 | Rango **Refugio**, y con él el ambiente **Adobe** | todos |
| 9 | Escena nueva de racha | todos |
| 12 | Rango **Cima**, y con él el ambiente **Escarcha** | rango: todos · ambiente: **Pro** |
| 14 | Escena grande de racha | todos |
| 16 | Celebración de pantalla completa | **Pro** |
| 20 | Rango **Norte**, y con él el ambiente **Duna** | todos |
| 20+ | Ahí cuelgan los mundos y los ambientes que entren después | |

**Qué cambió y por qué.** El reparto viejo tenía todo tarde y en el orden
equivocado: el usuario gratuito no tocaba nada entre el 2 y el 8, y el que
paga no recibía nada del nivel **hasta el 12 — dos meses y medio después de
haber pagado**. Ahora:

| | Cuándo llega lo suyo |
| --- | --- |
| **Gratuito** | 1, 2, 3, 7, 9, 14, 20 — siete cosas, y tres de ellas en los dos primeros días |
| **Pro** | los catorce mundos el día que paga, y además 5, 12 y 16 |

El hueco más largo es de seis niveles, y ahí es donde trabaja la tarjeta del
Resumen: **el próximo desbloqueo escrito antes de llegar**.

**El nivel 12 es a propósito el que más pesa.** Es donde el usuario normal
llega a los dos meses y medio, ya con el hábito hecho, y es donde recibe un
rango que es suyo —**Cima**, sin candado, como los otros cuatro— con un
ambiente al lado que dice «con Pro». No se le quita nada; se le enseña lo que
hay. Ese es el único momento de venta de toda la escalera, y llega cuando la
app ya se ganó el derecho a pedir algo.

### Dónde se ve

Tres sitios, y ninguno es una pantalla nueva.

- **El aro del avatar.** El círculo con tu inicial —el de la barra lateral y el
  del menú de la cuenta— se rodea de un aro que se llena. Siempre a la vista,
  sin ocupar nada, y es lo que la app ya sabe dibujar: `ring()` lleva ahí desde
  el principio.
- **Una tarjeta en el Resumen**, con el nivel, lo que falta y —esto es lo que
  importa— **el próximo desbloqueo escrito antes de llegar**. Un premio sorpresa
  no mueve a nadie; uno que se ve venir, sí.
- **La celebración al subir**, y al desbloquear un ambiente, **con el ambiente
  ya puesto**.

## Qué abre el nivel, y qué no

Eduardo preguntó si subir de nivel debería desbloquear también funcionalidad,
«así no te avientas a descubrir toda la app de buenas a primeras y te satures
de golpe». Son **dos cosas distintas** y separarlas es toda la respuesta,
porque una es un problema real y la otra es una solución cara.

**El problema es real.** Norata enseña el primer día cuatro módulos, un árbol
de talentos, rachas, informes y un panel de plan. Es mucho, y no todo sirve el
primer día: un árbol de talentos con cero habilidades no es una promesa, es una
pantalla vacía.

**Pero poner funciones detrás del nivel lo paga caro, y en dos sitios.**

1. **Una función ganada por nivel deja de poder venderse.** Y ya hay un plan
   que vive exactamente de eso: `LIMITES` cobra por CREAR —ramas, talentos,
   informes—. Si el nivel 14 regala lo que Pro vende, Pro vale menos; si el
   nivel 14 regala algo que Pro no vendía, es una función que se estaba
   escondiendo sin motivo.
2. **Choca de frente con «congelar, nunca quitar».** Un usuario al que la app
   le dice «esto lo tendrás en el nivel 14» está siendo castigado por el
   tiempo, no premiado por el uso. Es la misma frase que se rechazó al decidir
   no topar el número: *lo que haces ya no cuenta*.

**Lo que sí resuelve el problema, sin pagar nada: revelar por ESTADO, no por
nivel.** La app ya sabe cuándo un módulo tiene sentido, y lo sabe mejor que el
nivel:

| Se enseña | Cuando | Por qué el nivel no sirve |
| --- | --- | --- |
| El árbol de talentos | Hay una habilidad con historial | Con cero habilidades el árbol está vacío, tengas el nivel que tengas |
| Los informes de semana | Hay siete días de datos | Un informe de dos días no es un informe |
| La racha | Se cumple la primera misión dos días seguidos | Antes no hay racha que enseñar |
| Los encargos | Hay un talento con etapas, o se pide a mano | Es el módulo que menos gente necesita el primer día |

La diferencia es la que importa: **revelar por nivel es revelar por tiempo;
revelar por estado es revelar cuando de verdad sirve.** Y no le quita nada a
nadie — todo sigue existiendo, funcionando y accesible desde el menú; lo que
cambia es cuándo la app lo pone **delante**. Una cosa es no gritar el primer
día y otra es cerrar la puerta.

**Y hay un premio de nivel que sí es funcionalidad y no canibaliza nada:** las
**celebraciones**. No cambian lo que puedes hacer, cambian cómo te lo cuenta la
app, y por eso pueden regalarse y venderse sin tocar `LIMITES`. Ya están en la
escalera, en los niveles 2, 9, 14 y 16.

**Lo que queda abierto:** si algún día aparece una función que no se vende ni
se vendería —algo puramente expresivo, como poner un nombre a tu expedición o
elegir el icono del avatar—, esa sí puede colgar del nivel. La regla para
saberlo es una pregunta: *¿esto lo pondrías alguna vez en la tabla de precios?*
Si la respuesta es sí, no puede ser un premio de nivel.

## Cómo se canta un nivel

Hoy hay **un solo tamaño de fiesta**: `celebrate(title, sub, color, iconName)`,
siete llamadas, y el nivel de una habilidad usa exactamente la misma que un
hito. Subir de expedición tiene que ser **más** que eso, y cuando además abre
algo, tiene que decirlo ahí mismo.

**Tres intensidades, y la tercera es una ventana de verdad:**

| Cuándo | Qué | Se sale |
| --- | --- | --- |
| Sube una habilidad | Lo de hoy, sin tocar | Solo |
| **Sube la expedición** | La misma escena, más grande y más lenta, con el número al centro y el aro del avatar llenándose | Solo, a los pocos segundos |
| **Sube la expedición y abre algo** | Una ventana con lo que se abrió **ya puesto** | Con un botón, y solo con el botón |

**La ventana no se cierra por accidente, y esa es la petición.** Tres reglas:

- **No se cierra tocando fuera.** Es la forma número uno de saltarse sin querer
  lo único que la app te iba a enseñar en semanas.
- **Un solo botón**, grande y explícito, que dice qué hace: «Ver cómo queda» si
  abrió un ambiente, «Seguir» si no.
- **Escape sí cierra.** Parece contradecir lo anterior y no lo hace: tocar
  fuera es un gesto que se hace sin querer, y pulsar Escape es una decisión.
  Quitarlo dejaría a quien usa teclado atrapado en la ventana.

**Y lo que hace que la ventana valga la pena existir: el ambiente ya está
puesto detrás.** No se enseña una muestra de lo que ganaste — se aplica, y la
ventana aparece encima de la app ya recoloreada. Si lo que se abrió es un
rango, lo que hay detrás es el aro del avatar con su color nuevo. Un premio
que hay que ir a buscar a Ajustes no es un premio, es una tarea.

**Lo que hay que tocar para construirla**, y son dos líneas que ya están
escritas en `CLAUDE.md`: un `--piso-*` nuevo en `:root` de `css/estilos.css` —
ningún `z-index` se escribe a mano— y una línea en `CAPAS_QUE_TAPAN` de
`js/01-base.js`, que es lo que para la página de detrás. Con eso no hay que
acordarse de parar ni de soltar.

**Antes que nada de esto: sacar el verde de las cinco llamadas a
`celebrate()`.** El menta `#5fe0b0` está escrito a mano en `03-talentos.js`,
`04-misiones.js` y `09-inicio.js`. Mientras siga ahí, **ningún ambiente llega a
la fiesta** — y la fiesta que anuncia un ambiente saldría celebrándolo en el
color del ambiente anterior.

## Los cinco rangos

No son una colección para presumir: son **la cara y el nombre del nivel**. Como
colección no funcionarían —una vitrina con casillas en gris solo funciona cuando
alguien más la ve, y sin eso es una lista de lo que te falta—. Como nombre sí:
«Nivel 12» no se recuerda, «Refugio» sí. Es la diferencia entre un contador y un
capítulo. Por eso bajaron de diez a cinco: un rango que cambia cada dos niveles
es ruido; uno que dura medio año es algo que recuerdas haber sido.

| Nivel | Rango | Abre | Color de noche | Color de día | Cuándo |
| --- | --- | --- | --- | --- | --- |
| 1 | **Semilla** | Tinta | `#b6a370` | `#837143` | El primer día |
| 3 | **Brote** | Musgo | `#23b37e` | `#19805a` | Dos días |
| 7 | **Refugio** | Adobe | `#dc925d` | `#a15923` | Tres semanas |
| 12 | **Cima** | Escarcha · Pro | `#37a6ed` | `#1073b2` | Dos meses y medio |
| 20 | **Norte** | Duna | `#c194e4` | `#9345d1` | Ocho meses |

**Cada rango trae su ambiente y toma su color**, y el emparejamiento no es
decorativo: un refugio está hecho de barro, en una cima hay escarcha, y el
norte es la estrella que se ve en el cielo violeta de Duna. Eso convierte doce
premios sueltos en cinco capítulos, y le da al aro del avatar un color que
significa algo en vez de ser siempre menta.

**El único sitio donde el emparejamiento aprieta**, y conviene saberlo: en el
nivel 12 el ambiente pide Pro y el rango no. No es una excepción — es la regla
funcionando: **los rangos nunca llevan candado** porque son la cara del nivel,
y el nivel sube para todos. Llegas a Cima, es tuya, y al lado está Escarcha
con su etiqueta.

**Los dos tonos están calculados, no elegidos.** De noche, el más saturado que
ya está cómodo sobre la tarjeta (6 sobre 1); de día, el que apenas llega a 4,5
hundiéndose lo mínimo, que es lo que conserva el matiz. Y hacen falta los dos:
**usar el tono de noche sobre papel da 2,10-2,49**, por debajo del 3 que pide
un trazo. Medidos ya puestos en la lámina: 4,50-5,00 de día y 6,51-7,18 de
noche.

Van de la tierra al cielo, que es lo que hace que cada dibujo se le ocurra solo
al anterior. Dibujados en `viewBox="0 0 24 24"`, trazo de 1,7 y remates
redondos: el mismo formato de `ICONS` en `js/01-base.js`.

**Los cinco que se cayeron y por qué.** *Puente*: a tamaño real el arco con el
agua debajo no se lee como un puente sino como un bicho — un puente necesita ver
los dos lados que une y eso no cabe en 24 píxeles; no se arregla dibujándolo
mejor. *Colina* y *Cordillera*: eran más montañas, y con la cima ocupaban tres
peldaños seguidos con la misma mancha triangular. *Sendero* y *Constelación*:
por decisión de Eduardo, Brote y Norte ocupan su sitio.

**Ninguna pantalla de colección.** Es la parte que solo funciona con gente
mirando. Si algún día se hace, que sea porque hay a quién enseñársela.

## Lo que no cuadraba

La partición del tema dejó **una contradicción de verdad**, y es exactamente el
tipo de cosa que se convierte en un bug si nadie la mira:

> **«Recolores» decía Musgo 2, Escarcha 4, Adobe 6, Duna 8, Marea 10.**
> **«Nivel de expedición» decía: ambientes de grado 1 en 2, 8 y 10; los de
> grado 2 en 12 y 22, y con Pro.**

No es un detalle de reparto: en la primera lista **Escarcha y Marea son gratis**
y en la segunda **piden Pro**. Es la diferencia entre regalar dos ambientes y
venderlos.

**Resuelta, y superada.** Eduardo pidió un reparto nuevo que contemplara
progreso temprano para los dos planes, y la tabla de la escalera es ese
reparto: se queda la regla de la segunda —**grado 2 = Pro**, que es una regla y
no una excepción por ambiente— y se corrige lo que las dos tenían mal, que era
poner todo tarde. Ahora el gratuito recibe tres cosas en los dos primeros días
y el que paga recibe algo en la primera semana.

**Y arrastra un arreglo de texto.** `js/10d-plan.js` dice hoy *«Las paletas de
color son de todos. Las apariencias completas vienen con Pro.»* Con este reparto
eso deja de ser cierto —Escarcha y Marea son paletas y piden Pro—. La frase
tiene que decir qué se abre de verdad.

## Dónde encaja, y en qué orden

Del plan a la beta, con lo de apariencias marcado:

| Tanda | Qué | Estado |
| --- | --- | --- |
| **1** · 0.7.40 | Que la app deje de prometer lo que no tiene: capar los informes de pago, y decidir la fila de «Todas las apariencias» | Sin empezar |
| **2** · 0.7.41→ | **Las apariencias.** El nivel de expedición, sacar el verde de las cinco celebraciones, las tres intensidades de fiesta, la pantalla de Apariencia | Sin empezar |
| **3** · 0.7.4x | El panel, para poder leer la beta | Sin empezar |
| **4** · 0.7.4x→0.8 | Lo legal, los correos y el ciclo de cuenta | Sin empezar |

Dentro de la Tanda 2, el orden que propongo:

1. **El motor, con Consola.** Consola no necesita ni una imagen, así que si algo
   del contrato está mal pensado sale aquí y sale barato. Y con `?apariencia=`
   puesto desde el principio.
2. **`--tipo-titulo-escala`**, que no existe y sin ella Consola desborda el
   titular a 320 px: es un +29% de ancho.
3. **Los ocho ambientes**, que ya están escritos y medidos. Es pegar
   `ambientes.css` y darlos de alta.
4. **El nivel de expedición**, que es lo que los convierte en algo que se gana.
   Hasta entonces se pueden encender pero no ganar.
5. **Averno y Blueprint**, que son los que contestan si esto se puede vender.
6. **Arboleda**, y de ahí en adelante uno por tanda.

**Sacar el verde de las celebraciones va antes que nada de lo visible.** El
menta está escrito a mano en cinco llamadas a `celebrate()`, y mientras siga ahí
ningún ambiente llega a la fiesta — y desbloquear un ambiente se celebra con el
ambiente ya puesto.

## Lo que solo puede decidir Eduardo

1. **Los nombres de los rangos.** Semilla, Brote, Refugio, Cima y Norte son de
   relleno para que la escalera se lea. Son cinco y nombrarlos bien sale barato.
2. **¿El rango se dice siempre o solo el día que cambia?** Escrito junto al
   nivel —«Nivel 12 · Refugio»— se vuelve parte de tu identidad; enseñado solo
   cuando cambia se vuelve un acontecimiento. Con cinco rangos en toda la vida
   de una cuenta, lo segundo se defiende.
3. **Si el nivel debe abrir además alguna funcionalidad**, más allá de lo que
   está escrito en «Qué abre el nivel, y qué no». Mi lectura está ahí, con su
   motivo; la decisión es tuya.

## Lo que se queda fuera a propósito

- **Una pantalla de colección de rangos.** Solo funciona con gente mirando.
- **Vender mundos sueltos.** Catorce productos en Stripe para no decir una sola
  frase.
- **Ambientes que se ganen y además se vendan.** Si se cruzan las dos listas, el
  nivel deja de valer para quien pueda pagar.
- **Un ambiente gris.** Es en lo que se convierte cualquier otro al desteñirlo.
