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

**El logo depende de que el sitio esté publicado.** Apunta a
`mi.norata.app/marca/logotipo-correo.png` — al SUBDOMINIO de la app, no al
dominio raíz. `norata.app` y `www.norata.app` quedaron reservados para la
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

1. **Franja blanca con el logo.**
2. **La ilustración, a sangre** — pegada a los dos lados de la tarjeta.
3. **El cuerpo**: saludo por nombre, título, párrafo, botón y una nota al pie.

La franja del logo va ENCIMA de la ilustración y no debajo. Es lo que permite
que la ilustración llegue a los bordes: las esquinas redondeadas son las de
arriba, y unos clientes las redondean y otros no. Con la franja blanca en
medio, la ilustración solo tiene bordes rectos y ninguna esquina la recorta.

**Un color por motivo.** Es lo que hace que se lean como un sistema y no como
seis correos sueltos. El botón lleva el mismo color que la ilustración, para
que cada mensaje sea de una pieza — con una excepción: el de bienvenida, cuyo
dibujo es oscuro y cuyo botón sigue siendo menta, porque menta es «adelante»
en toda la app:

| Correo | Color | Qué dice |
| --- | --- | --- |
| Confirmar cuenta | menta `#5fe0b0` | empezar |
| Recuperar contraseña | luciérnaga `#f5d76e` | la luz que te devuelve al camino |
| **Avisos de seguridad** | coral `#ff8a70` | algo cambió en tu cuenta |
| Bienvenida | noche `#10151d` | ya estás dentro |

El coral no es de un correo sino de una **categoría**: lo comparten los tres que
dicen lo mismo —cambio de correo, contraseña cambiada y acceso vinculado—, y por
eso comparten también el dibujo. Tres imágenes distintas para el mismo tipo de
aviso habrían sido tres dibujos más de trabajo y un sistema más débil: así, el
coral acaba significando «mira esto» sin que haya que leer nada.

Los tres de seguridad no llevan enlace de confirmación — no hay nada que
confirmar. Su botón va a la app, y el pie no repite ninguna dirección larga.

## Las ilustraciones

**Todavía no existen.** En su sitio hay una banda del color que toca, de 130
píxeles de alto. Cada plantilla lleva, en un comentario justo encima de esa
banda, la línea exacta que hay que poner en su lugar. Sustituir la celda por
esa línea es todo el trabajo: no hay nada más que tocar.

Lo que tienen que cumplir los archivos:

- Lienzo de **520 × 260**, exportado al doble: **1040 × 520**.
- **PNG con fondo opaco.** Nada de SVG — Gmail los borra — ni transparencias.
- **Sin texto dentro.** Lo dibujado no se puede seleccionar, sale borroso al
  escalar y desaparece para quien tenga las imágenes bloqueadas.
- **Sin degradados que dependan del HTML**: si hay degradado, va dentro del PNG,
  porque Outlook ignora los del código.
- Menos de **150 KB** cada uno.
- Son **cuatro archivos para seis correos**: `correo-confirmar-v1.png`,
  `correo-recuperar-v1.png`, `correo-seguridad-v1.png` (compartido por los
  tres avisos de seguridad) y `correo-bienvenida-v1.png`, en `marca/`. **Si se retoca una, sube el número** —
  Gmail guarda las imágenes por nombre y no vuelve a pedirlas nunca.

El `alt` va vacío a propósito: el dibujo no dice nada que el texto no diga ya,
y un lector de pantalla que lo lea solo estorba.

**El de bienvenida es el único oscuro.** Los tres de trámite son claros y de un
color; ese abre con la noche de la app. Puede serlo sin peligro porque el fondo
va incrustado en el PNG — lo que no puede ser oscuro es el correo, que vive en
la bandeja de otro y ya se probó que ahí queda como un rectángulo flotando.
Su botón sigue siendo menta, que es «adelante» en toda la app.

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
  sus títulos, porque la menta y el amarillo de la app están hechos para fondo
  oscuro y sobre blanco no se leen.
- Si un icono cambia en la app, se vuelve a abrir esa página y **se sube el
  número del nombre**. Gmail guarda las imágenes por nombre y no vuelve a
  pedirlas nunca.

Los `alt` van vacíos: el icono repite la palabra que tiene al lado, y un lector
de pantalla que diga «misiones misiones» estorba.

**Los archivos tienen que estar publicados** en `mi.norata.app/marca/` para que
se vean. Mientras no se suban, el correo llega con cuatro huecos.

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
