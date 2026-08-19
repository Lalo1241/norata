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
