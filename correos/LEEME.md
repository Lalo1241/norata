# Correos de la cuenta

Estas son las plantillas que le llegan al usuario. **No las lee la app**: se
copian a mano en Supabase, en *Authentication → Emails*, cada una en su
plantilla correspondiente.

| Archivo | Dónde va en Supabase |
| --- | --- |
| `01-confirmar-cuenta.html` | Confirm signup |
| `02-recuperar-contrasena.html` | Reset password |
| `03-cambio-de-correo.html` | Change email address |

Viven aquí y no solo en el panel de Supabase para que se puedan revisar,
comparar y recuperar. Un texto que solo existe dentro de un panel web no
tiene historial y no se puede volver atrás.

## Cosas que no son obvias

**`{{ .ConfirmationURL }}` es de Supabase, no un error de escritura.** Lo
sustituye por el enlace real al enviar. Si se cambia o se borra, el correo
llega sin enlace.

**El logo es un enlace, no va incrustado.** Los clientes de correo bloquean
casi todo, pero una imagen alojada en el propio sitio la muestran. Apunta a
`lalo1241.github.io/notara/icon-192.png`: si el sitio cambia de dirección,
hay que actualizarlo aquí.

**Fondo claro a propósito**, aunque la app sea oscura. Muchos clientes de
correo reescriben los colores de fondo, y un diseño oscuro acaba con texto
oscuro sobre fondo oscuro en cuanto alguien lo abre en modo claro.

**La dirección va también como texto.** Hay clientes que no dejan pulsar
botones, y sin eso el correo se vuelve inservible para quien lo use.

## Antes de que esto funcione de verdad

1. **Redirect URLs.** En *Authentication → URL Configuration*, la dirección
   publicada tiene que estar en la lista. Si no, el enlace del correo devuelve
   al usuario a un error en vez de a la app.

2. **Servidor de correo propio.** El de Supabase incluido está limitado a unos
   pocos mensajes por hora y es solo para probar. Con usuarios de verdad, quien
   recupere su contraseña cuando ya se agotó el cupo simplemente no recibe
   nada, y no hay aviso de que eso pasó. Hace falta conectar un proveedor
   (Resend, Postmark, Brevo…) en *Project Settings → Auth → SMTP*.
