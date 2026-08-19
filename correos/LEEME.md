# Correos de la cuenta

Estas son las plantillas que le llegan al usuario. **La app no las lee**: se
copian a mano en Supabase, en *Authentication → Emails*, cada una en su sitio.

| Archivo | Plantilla en Supabase | Asunto |
| --- | --- | --- |
| `01-confirmar-cuenta.html` | Confirm signup | Confirma tu correo para entrar a Norata |
| `02-recuperar-contrasena.html` | Reset password | Recupera el acceso a tu cuenta de Norata |
| `03-cambio-de-correo.html` | Change email address | Confirma tu correo nuevo en Norata |

El **asunto** también hay que cambiarlo: viene en inglés por defecto y es lo
primero que se ve en la bandeja. Sin signos de exclamación ni mayúsculas
sueltas — eso es lo que los filtros de correo leen como propaganda.

Las demás plantillas que ofrece Supabase (Magic Link, Invite user,
Reauthentication) **no se tocan**: la app no las usa.

Viven aquí y no solo en el panel para que tengan historial. Un texto que solo
existe dentro de una página web ajena no se puede comparar ni volver atrás.

## Cosas que no son obvias

**`{{ .ConfirmationURL }}` es de Supabase, no un error de escritura.** Lo
sustituye por el enlace real al enviar. Si se cambia o se borra, el correo
sale sin enlace y no sirve para nada.

**El logo depende de que el sitio esté publicado.** Apunta a
`mi.norata.app/marca/logotipo-correo.png` — al SUBDOMINIO de la app, no al
dominio raíz. `norata.app` y `www.norata.app` quedaron reservados para la
landing y hoy devuelven 404, así que apuntar ahí dejaría el logo roto y el
enlace del pie en ninguna parte.

Ahora que hay dominio propio, esa dirección ya no cambia aunque se renombre el
repositorio, que era justo lo frágil de antes.

**El logo se dibuja conservando su proporción, y hay que respetarlo.** La
primera versión le restaba el mismo margen a lo ancho y a lo alto; en una
imagen casi cuatro veces más ancha que alta esos píxeles pesan cuatro veces
más en la altura, y el logo salía achatado (proporción 5.21 en vez de 3.90).
Se ve a simple vista, pero solo si te fijas — pasó desapercibido hasta que
Eduardo lo notó en una previsualización. Si se regenera el PNG, calcular el
alto y sacar el ancho de la proporción, nunca al revés.

**El lienzo mide 560x143 y no debe cambiar.** Las plantillas declaran el logo
a 280x72, que es exactamente la mitad. Cambiar el tamaño del PNG obliga a
reeditar las tres plantillas dentro de Supabase a mano.

**El fondo del PNG del logo es el mismo de la página, no el de la tarjeta.**
Suena a detalle y no lo es: con el color de la tarjeta se ve un recuadro
flotando alrededor del logo. Si algún día se cambia el color de fondo del
correo, hay que regenerar el PNG a juego.

**Diseño oscuro, con las dos metas de `color-scheme`.** Sin ellas, Gmail y
Outlook "ayudan" invirtiendo los colores y dejan texto claro sobre fondo
claro. Con ellas, respetan el diseño.

**El botón está dos veces.** Outlook no entiende los bordes redondeados del
HTML, así que ahí se dibuja con su propio lenguaje (VML) y los demás clientes
usan el enlace normal. Ver uno solo en el código y "limpiar" el otro rompe el
botón en Outlook.

**El texto de la bandeja de entrada** es el bloque oculto del principio. Sin
él, el cliente enseña como resumen el primer texto que encuentre, que suele
ser una instrucción técnica.

**La dirección va también como texto suelto**, porque hay clientes donde no se
puede pulsar un botón y sin eso el correo queda inservible.

## Lo que falta para que esto funcione de verdad

1. **Servidor de correo propio.** El de Supabase incluido está limitado a unos
   pocos mensajes por hora y es solo para probar. Con usuarios de verdad, quien
   recupere su contraseña pasado el cupo no recibe nada, y no hay ningún aviso
   de que eso ocurrió. Se conecta en *Project Settings → Auth → SMTP*.

2. **Remitente propio.** Ya se puede: con `norata.app` en la mano, un proveedor
   de correo permite enviar desde `hola@norata.app` en vez de una dirección
   genérica. Hace falta añadir unos registros al DNS para demostrar que el
   dominio es tuyo — el propio proveedor los dicta.

## Hecho

- **Redirect URLs de Supabase**: `https://mi.norata.app` en *Authentication → URL
  Configuration*, tanto en Site URL como en la lista de redirecciones. Sin esto
  el enlace del correo lleva a un error en vez de a la app.
