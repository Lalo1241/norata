# Correos de la cuenta

Estas son las plantillas que le llegan al usuario. Cinco de las seis **la app
no las lee**: se copian a mano en Supabase, en *Authentication → Emails*, cada
una en su sitio. La de bienvenida es la excepción y va por otro camino — ver
«Quién manda la bienvenida».

| Archivo | Plantilla en Supabase | Asunto |
| --- | --- | --- |
| `01-confirmar-cuenta.html` | Confirm signup | Confirma tu correo para entrar a Norata |
| `02-recuperar-contrasena.html` | Reset password | Recupera el acceso a tu cuenta de Norata |
| `03-cambio-de-correo.html` | Change email address | Confirma tu correo nuevo en Norata |
| `04-bienvenida.html` | **ninguna** — ver abajo | Bienvenido a Norata |
| `05-contrasena-cambiada.html` | Password changed | Tu contraseña de Norata cambió |
| `06-acceso-vinculado.html` | Sign-in method linked | Una forma nueva de entrar a Norata |

El **asunto** también hay que cambiarlo: viene en inglés por defecto y es lo
primero que se ve en la bandeja. Sin signos de exclamación ni mayúsculas
sueltas — eso es lo que los filtros de correo leen como propaganda.

Las demás plantillas que ofrece Supabase (Magic Link, Invite user,
Reauthentication) **no se tocan**: la app no las usa.

**Los dos últimos hay que encenderlos**, además de pegarlos: vienen apagados en
el panel de Supabase y tienen su propio interruptor.

Hay una página con un botón de copiar por plantilla, que saca el contenido de
estos mismos archivos:
https://claude.ai/code/artifact/78be8060-ff87-444f-81d1-7d5f538c65ea
Se regenera con `armar-pegador.py` — vive en el bloc de notas de la sesión, no
en el repositorio, porque solo sirve para esta tarea.

Viven aquí y no solo en el panel para que tengan historial. Un texto que solo
existe dentro de una página web ajena no se puede comparar ni volver atrás.

## Cosas que no son obvias

**`{{ .ConfirmationURL }}` es de Supabase, no un error de escritura.** Lo
sustituye por el enlace real al enviar. Si se cambia o se borra, el correo
sale sin enlace y no sirve para nada.

**Cada plantilla ofrece unas variables distintas**, y el panel las lista debajo
del cuerpo, en *Template variables*. Las que se usan:

| Variable | Dónde | Qué trae |
| --- | --- | --- |
| `{{ .ConfirmationURL }}` | 01, 02, 03 | el enlace |
| `{{ .Data.saludo }}` | todas | el nombre, vía datos de la cuenta |
| `{{ .Email }}` | 05, 06 | la dirección de la cuenta |
| `{{ .Provider }}` | 06 | `google`, `github`… |

**`.Provider` llega en minúsculas** — «google», no «Google»— y estas plantillas
no tienen forma de poner una mayúscula. Por eso en el `06` no va dentro de una
frase, donde se leería como una errata, sino en una ficha de datos con su
rótulo al lado, donde una minúscula es lo normal.

**Las imágenes dependen de que el sitio esté publicado.** Apuntan a
`mi.norata.app/marca/…` — al SUBDOMINIO de la app, no al dominio raíz. Desde
el 14 oct 2026 el logo va DENTRO de la cabecera de cada correo (ver «El
sistema visual»), y `logo-correo-v2.png` ya no lo usa ninguna plantilla, pero
no se borra: lo enlazan los correos ya enviados. `norata.app` y `www.norata.app` quedaron reservados para la
landing y hoy devuelven 404, así que apuntar ahí dejaría el logo roto y el
enlace del pie en ninguna parte.

Ahora que hay dominio propio, esa dirección ya no cambia aunque se renombre el
repositorio, que era justo lo frágil de antes.

**Gmail cachea las imágenes y NO vuelve a pedirlas.** No las carga del
servidor: las sirve desde su propio proxy y las guarda. Cambiar el archivo sin
cambiar el nombre deja a todo el mundo viendo la versión vieja — pasó al
cambiar el logo de oscuro a claro, y el correo llegó con un recuadro negro.
**Si cambia el logo, cambia también el nombre del archivo** (`logo-correo-v2`,
`-v3`…). No hay otra forma de forzarlo.

**El logo va DENTRO de la tarjeta, con el blanco incrustado.** Fuera, sobre el
fondo de la página, se le notaba el recuadro por mucho que el color coincidiera
en teoría. Dentro, sobre blanco y con blanco detrás, desaparece.

**El logo se dibuja conservando su proporción.** Una versión le restaba el
mismo margen a lo ancho y a lo alto; en una imagen casi cuatro veces más ancha
que alta esos píxeles pesan cuatro veces más en la altura, y salía achatado
(proporción 5.21 en vez de 3.90). Al regenerarlo: fijar el alto y sacar el
ancho de la proporción, nunca al revés.

**Poppins solo llegará a algunos clientes.** Gmail descarta las tipografías
externas casi siempre. Por eso la lista sigue con Century Gothic y Futura, las
únicas de sistema con la «a» redonda de una sola planta, y termina en las de
siempre. Se ve bien en todos; se ve *nuestro* en algunos.

**Diseño CLARO, aunque la app sea oscura.** Hubo una versión oscura y se
descartó con evidencia: Eduardo la probó en dos cuentas reales de Gmail —una
en tema claro y otra en oscuro— y en las dos quedaba un rectángulo oscuro
flotando sin sentido dentro de la bandeja. Un correo vive en la casa de otro y
tiene que respetar su decoración; la marca se sostiene con el logo y el color
del botón. Las dos metas de `color-scheme` siguen puestas para que el cliente
no "ayude" invirtiendo los colores.

**El logo del correo usa `logotipo-oscuro.svg`** (palabra oscura), no el claro
de la app, y lleva incrustado el fondo `#f4f6fb` de la página del correo.

**El botón está dos veces.** Outlook no entiende los bordes redondeados del
HTML, así que ahí se dibuja con su propio lenguaje (VML) y los demás clientes
usan el enlace normal. Ver uno solo en el código y "limpiar" el otro rompe el
botón en Outlook.

**El texto de la bandeja de entrada** es el bloque oculto del principio. Sin
él, el cliente enseña como resumen el primer texto que encuentre, que suele
ser una instrucción técnica.

**La dirección va también como texto suelto**, porque hay clientes donde no se
puede pulsar un botón y sin eso el correo queda inservible.

## El sistema visual

Los seis correos son la misma pieza con otro color. De arriba abajo:

1. **La cabecera, en UNA imagen**: la franja blanca con el logo y, debajo, el
   dibujo a sangre.
2. **El cuerpo**: saludo por nombre, título, párrafo, botón y una nota al pie.

**Por qué la cabecera es una sola imagen (14 oct 2026).** Gmail en el teléfono
(Android y iPhone) y Outlook oscurecen el HTML a su criterio aunque el correo
declare que es claro; lo que no tocan nunca es una imagen. Con el logo como
imagen suelta sobre una celda blanca, en modo oscuro la tarjeta se volvía gris
y el logo se quedaba como un recuadro blanco flotando. Dentro de la cabecera,
el blanco es parte del dibujo y sale igual en cualquier bandeja.

**Todo el texto va en el cuerpo, título incluido.** Se probó un título sobre
una banda de color, como hace Headspace, y se descartó: Gmail puede oscurecer
la banda y aclarar el título por separado, y eso ya no se controla. El cuerpo,
en cambio, Gmail lo oscurece parejo, fondo y texto a la vez.

**El dibujo acaba en una orilla recta, sin nubes.** Hubo un borde de nubes
blancas que se fundía con el cuerpo; en modo oscuro el cuerpo se oscurece y
las nubes no, y quedaba una costura blanca.

**Un color por motivo, y el color dice qué clase de correo es.** El botón lleva
el color de su dibujo, con una excepción: el de bienvenida, cuyo dibujo es
oscuro y cuyo botón sigue siendo menta, porque menta es «adelante» en toda la
app.

| Correo | Color | Qué dice | Dibujo |
| --- | --- | --- | --- |
| 01 Confirmar cuenta | menta `#5fe0b0` | confirmar | la puerta de dos hojas, abriéndose |
| 02 Recuperar contraseña | luciérnaga `#f5d76e` | recuperar | la llave |
| 03 Cambio de correo | menta `#5fe0b0` | confirmar | del sobre viejo al nuevo |
| 04 Bienvenida | noche `#10151d` | ya estás dentro | el isotipo de noche, hueco vacío y resplandor con su silueta |
| 05 Contraseña cambiada | celeste `#8ecdf5` | constancia de cuenta | el escudo con la palomita |
| 06 Acceso vinculado | celeste `#8ecdf5` | constancia de cuenta | dos eslabones recién unidos |

**El coral es solo para la alerta, y hoy ningún correo lo usa** (Eduardo,
14 oct 2026). Antes lo compartían los tres de seguridad, y se descartó porque
ninguno es negativo: el cambio de correo lo pide la persona, y una contraseña
cambiada o un acceso vinculado casi siempre los hizo ella misma (entrar con
Google con el mismo correo vincula el acceso). Se cuentan como constancia,
con su salida «si no fuiste tú». Lo único que sigue en coral oscuro es ese
enlace de «Recupera tu contraseña ahora», que sí es la alerta.

**La palomita del 05 va en el verde de «hecho» de la app**, no en celeste: en
Norata los estados no cambian con el color del contexto.

El 05 y el 06 no llevan enlace de confirmación: no hay nada que confirmar.
Su botón va a la app, y el pie no repite ninguna dirección larga.

## Las ilustraciones

Seis cabeceras, una por correo, en `marca/`:

| Correo | Archivo |
| --- | --- |
| 01 | `correo-confirmar-v1.png` |
| 02 | `correo-recuperar-v1.png` |
| 03 | `correo-cambio-de-correo-v1.png` |
| 04 | `correo-bienvenida-v1.png` |
| 05 | `correo-contrasena-cambiada-v1.png` |
| 06 | `correo-acceso-vinculado-v1.png` |

**Si se retoca una, sube el número del nombre** — Gmail guarda las imágenes
por nombre y no vuelve a pedirlas nunca. Y no se borra ninguna vieja: los
correos ya enviados las siguen enlazando.

Lo que cumplen, y lo que tiene que cumplir una nueva:

- Lienzo de **520 × 346**: 86 de franja blanca con el logo (26 arriba, logo de
  150 × 38, 22 abajo) y 260 de dibujo. Exportado al doble: **1040 × 692**.
- **PNG con fondo opaco.** Nada de SVG — Gmail los borra — ni transparencias.
- **Sin texto dentro** aparte del logo. Lo dibujado no se puede seleccionar,
  sale borroso al escalar y desaparece para quien tenga las imágenes
  bloqueadas. Por eso el `alt` es «Norata»: es lo único que la imagen dice.
- **Ilustración plana, sin caras ni contornos**: una figura grande por correo,
  recortada o centrada, con tres o cuatro tonos de una sola familia de color y
  unos aros de luz detrás. Se probaron caras y una luciérnaga como personaje, y
  Eduardo las descartó: demasiado detalle, y Norata no tiene mascota (si algún
  día la tiene, es un proyecto aparte, no una decisión de los correos).
- **El isotipo no se redibuja**: sale de `marca/isotipo-menta.svg`, en su
  menta, y su silueta no se toca.
- Menos de **150 KB** cada uno (hoy pesan entre 25 y 42).

Las fuentes de los dibujos (SVG y los scripts que los arman) se quedaron en el
bloc de la sesión del 14 oct 2026; si hace falta retocar uno, lo más rápido es
pedirlo describiéndolo con esta tabla delante.

**El de bienvenida es el único oscuro.** Puede serlo sin peligro porque el
fondo va dentro del PNG — lo que no puede ser oscuro es el correo, que vive en
la bandeja de otro y ya se probó que ahí queda como un rectángulo flotando.

**El modo oscuro no se puede probar aquí.** Lo único que dice la verdad es un
correo real abierto en la app de Gmail del teléfono con el tema oscuro puesto.

## Quién manda la bienvenida

Los tres primeros los manda Supabase solo: son parte de la cuenta, y basta con
pegar la plantilla en su panel. **El cuarto no.** No responde a ningún trámite
de la cuenta, así que no hay ninguna plantilla suya donde ponerlo.

Y no se puede mandar desde el navegador: enviar correo pide la llave de Resend,
y cualquier llave que llegue al navegador es pública. Por eso hay una función
en el servidor — la única de todo el proyecto — en
`supabase/functions/bienvenida/`.

El reparto es este:

- **La app** avisa «acabo de entrar», con la sesión de quien entró.
- **La función** comprueba quién es, decide si toca, y manda.

La app **no** decide. Si lo hiciera, recargar la página veinte veces mandaría
veinte correos. Quien decide es la función, mirando una marca que ella misma
escribió del lado del servidor.

Para encenderlo:

```
supabase secrets set RESEND_API_KEY=re_xxxxxxxx
supabase functions deploy bienvenida
```

Mientras no se despliegue, la app llama a una dirección que no existe, se traga
el error y sigue. No se rompe nada; simplemente no llega el correo.

**`{{SALUDO}}` no es sintaxis de Supabase**, y por eso se escribe distinta de la
de los otros tres. La sustituye nuestra función. Escribirla igual habría dado a
entender que se pega en el panel de Supabase, y ahí no va.

**La función descarga la plantilla del sitio** en vez de llevarla copiada
dentro. Así hay una sola versión, y cambiar el texto no obliga a desplegar la
función otra vez.

**No lleva enlace para darse de baja** y de momento está bien: es un solo correo
que dispara el propio usuario al crear su cuenta. El día que haya un segundo
—un resumen semanal, un recordatorio— deja de serlo y hará falta.

## Los iconos de los módulos

El correo de bienvenida lleva, junto a cada módulo, **el mismo icono que la
barra de la app**: quien abre Norata después de leerlo reconoce de un vistazo
lo que ya le contaron.

Son PNG y no SVG, porque Gmail borra los SVG. Salen de
`marca/generar-iconos-correo.html`: esa página dibuja los trazos de la barra
sobre un lienzo y devuelve los archivos. Hay que abrirla **servida por HTTP**,
no con doble clic.

- **40 × 40**, para dibujarlos a 20. Los teléfonos tienen el doble de puntos y
  un icono a tamaño justo sale con los bordes sucios.
- **Fondo transparente.** Van sobre la tarjeta blanca, y un cuadro blanco
  incrustado se notaría en cuanto la tarjeta dejara de serlo.
- **Cada uno en el color de su módulo** — los mismos tonos oscuros que llevan
  sus títulos, porque los colores de la app están hechos para fondo oscuro y
  sobre blanco no se leen. Misiones y Proyectos en menta `#136b4e`, Habilidades
  en celeste `#1a6a99`, Talentos en coral `#b1341d`.
- **El dorado no se usa en el producto.** Habilidades lo llevó un día
  (`#7a5d06`) y se cambió: ese tono se lee como un aviso, y un módulo no es un
  aviso. El amarillo luciérnaga sigue vivo donde sí toca — el correo de
  recuperar, que es justo una alerta.
- **La versión va por icono, no global.** Al pasar Habilidades a celeste subió
  solo ese a `v2`; los otros tres siguen en `v1`. Subirlos todos a la vez
  tiraría a la basura el cacheado de los que no cambiaron.
- Si un icono cambia en la app, se vuelve a abrir esa página y **se sube el
  número del nombre**. Gmail guarda las imágenes por nombre y no vuelve a
  pedirlas nunca.

Los `alt` van vacíos: el icono repite la palabra que tiene al lado, y un lector
de pantalla que diga «misiones misiones» estorba.

**Los archivos tienen que estar publicados** en `mi.norata.app/marca/` para que
se vean. Mientras no se suban, el correo llega con cuatro huecos.

## El enlace directo a recuperar la contraseña

`https://mi.norata.app/#olvide`

Todo correo que le diga a alguien «cambia tu contraseña» tiene que llevar ese
enlace en esas mismas palabras. Decirlo sin darlo obliga a abrir la app,
encontrar un enlace pequeño debajo del botón de entrar y acordarse de cómo se
llamaba — y quien acaba de asustarse no hace ese recorrido, cierra el correo y
lo deja para luego.

Lo llevan el `03`, el `05` y el `06`. **Es una regla, no tres casos**: cualquier
correo nuevo que mencione cambiar la contraseña lo lleva también.

Al llegar, la app abre la pantalla de entrada con la dirección ya escrita, el
aviso puesto y el botón de «¿Olvidaste tu contraseña?» resaltado en amarillo.

**No manda el correo solo al llegar, y es a propósito.** Los enlaces de un
mensaje los abren también los antivirus y las vistas previas del buzón, sin que
nadie los haya pulsado: un enlace que dispara un envío al abrirse acaba mandando
correos que nadie pidió. Queda a un toque, no a cero.

## Cambiar la contraseña echa a los demás dispositivos

Desde el 20 de agosto de 2026, al poner una contraseña nueva la app llama a
`logout?scope=others`. Sin eso, el cambio no servía para lo que la gente cree
que sirve: una sesión ya iniciada no vuelve a pedir la contraseña nunca —se
renueva sola—, así que quien hubiera entrado seguía dentro con la contraseña
vieja cambiada.

`others` y no `global`: global cerraría también la de aquí, y quien acaba de
recuperar su cuenta se encontraría de vuelta en la pantalla de entrada.

Puede que Supabase ya lo hiciera solo; no se da por hecho, porque es de esas
cosas que si cambian de comportamiento nadie se entera hasta que hace falta.

## El saludo por nombre

Las plantillas escriben el nombre así:

```
{{ if .Data.saludo }}Hola, {{ .Data.saludo }}{{ else }}Hola{{ end }}
```

`.Data` es lo que la app guardó junto a la cuenta al registrarse: `nombre`,
`apodo` y `saludo`. El tercero es el que se usa aquí, y ya viene resuelto —es
el apodo, o el nombre sin apellidos— porque esta plantilla no sabe elegir
entre dos campos ni recortar nada.

**La condición no es un adorno.** Una cuenta creada antes de que se pidiera el
nombre no trae `saludo`, y sin el `if` la plantilla no escribe un hueco: puede
escribir un aviso del propio Supabase en mitad del correo. Cualquier variable
nueva que se añada tiene que llevar la suya.

Quien entra y no tenía nombre guardado —las cuentas viejas y las de Google—
se lo completa la app sola al entrar, en silencio y una sola vez.

## Hecho

- **Servidor de correo propio (SMTP).** Resend, plan gratuito, 3.000 mensajes
  al mes. El de Supabase incluido estaba limitado a unos pocos por hora y era
  solo para probar: pasado el cupo, quien recuperase su contraseña no recibía
  nada y no había ningún aviso de que hubiera ocurrido.

- **Remitente propio**: `no-reply@norata.app`. Enviar y recibir son cosas
  distintas, así que no hizo falta contratar un buzón de entrada.

- **Redirect URLs de Supabase**: `https://mi.norata.app` en *Authentication → URL
  Configuration*, tanto en Site URL como en la lista de redirecciones. Sin esto
  el enlace del correo lleva a un error en vez de a la app.
