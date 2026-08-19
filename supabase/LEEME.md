# Lo que hay que dejar puesto en Supabase

La app no puede crear esto sola. Son pasos de una sola vez, se hacen desde el
panel de Supabase y se quedan hechos para siempre.

Viven aquí y no solo dentro del panel para que tengan historial: algo que solo
existe dentro de una página web ajena no se puede comparar ni volver atrás.

## Borrar la cuenta (`borrar-cuenta.sql`)

**Sin esto, el botón «Borrar mi cuenta» de Ajustes no funciona**: avisa de que
falta activarlo en el servidor y no borra nada.

Cómo se pone, una sola vez:

1. Entrar a [supabase.com](https://supabase.com) y abrir el proyecto de Norata.
2. En el menú de la izquierda, **SQL Editor**.
3. Pegar el contenido entero de `borrar-cuenta.sql` y pulsar **Run**.
4. Debe decir *Success*. Ya está.

### Por qué hace falta un rodeo

Quitar a alguien de la lista de usuarios es cosa de administrador, y la llave
de administrador **jamás** puede estar dentro de la app: cualquiera que abriera
el código del navegador la tendría, y con ella podría borrar la cuenta de otro.

Lo que hace este SQL es dejar una función *dentro* de la base de datos que solo
sabe hacer una cosa: borrar a quien la llama. No recibe a quién borrar, así que
no hay nada que falsificar desde fuera. La app solo puede decir «bórrame a mí».

### Qué pasa al usarlo

Se borra la fila de progreso y el usuario entero. El correo queda libre: esa
misma persona puede volver a registrarse con él como si fuera nuevo, que es
justo lo que se buscaba. La app, por su lado, vacía también lo que tuviera
guardado en ese dispositivo.
