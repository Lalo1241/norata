# Correos de la cuenta

Estas son las plantillas que le llegan al usuario. **La app no las lee**: se
copian a mano en Supabase, en *Authentication → Emails*, cada una en su sitio.

| Archivo | Dónde va en Supabase |
| --- | --- |
| `01-confirmar-cuenta.html` | Confirm signup |
| `02-recuperar-contrasena.html` | Reset password |
| `03-cambio-de-correo.html` | Change email address |

Viven aquí y no solo en el panel para que tengan historial. Un texto que solo
existe dentro de una página web ajena no se puede comparar ni volver atrás.

## Cosas que no son obvias

**`{{ .ConfirmationURL }}` es de Supabase, no un error de escritura.** Lo
sustituye por el enlace real al enviar. Si se cambia o se borra, el correo
sale sin enlace y no sirve para nada.

**El logo depende de que el sitio esté publicado.** Apunta a
`lalo1241.github.io/notara/marca/logotipo-correo.png`. Si el sitio cambia de
dirección, hay que actualizarlo en las tres plantillas o los correos saldrán
con el hueco de una imagen rota.

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

1. **Redirect URLs.** En *Authentication → URL Configuration*, la dirección
   publicada tiene que estar en la lista. Si no, el enlace del correo lleva al
   usuario a un error en vez de a la app.

2. **Servidor de correo propio.** El de Supabase incluido está limitado a unos
   pocos mensajes por hora y es solo para probar. Con usuarios de verdad, quien
   recupere su contraseña pasado el cupo no recibe nada, y no hay ningún aviso
   de que eso ocurrió. Se conecta en *Project Settings → Auth → SMTP*.

3. **Remitente propio.** Mientras no haya dominio de Notara, el correo saldrá
   de una dirección genérica por mucho que el diseño sea el nuestro. Cambiar
   eso exige comprar un dominio; no hay atajo.
