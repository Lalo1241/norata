# Lo que hay que dejar puesto en Supabase

La app no puede crear esto sola. Son pasos de una sola vez, se hacen desde el
panel de Supabase y se quedan hechos para siempre.

Viven aquí y no solo dentro del panel para que tengan historial: algo que solo
existe dentro de una página web ajena no se puede comparar ni volver atrás.

## Borrar la cuenta (`borrar-cuenta.sql`)

**Sin esto, el botón «Borrar mi cuenta» de Ajustes no funciona**: avisa de que
falta activarlo en el servidor y no borra nada.

Son dos pasos, en este orden:

1. **Activar `pg_cron`.** En el menú de la izquierda, **Database → Extensions**.
   Buscar `pg_cron` y encenderla. Es lo que permite que la base de datos haga
   sola una tarea todos los días.
2. **Correr el SQL.** En **SQL Editor**, abrir una pestaña nueva con el `+`
   (no encima de las que ya hay, que son historial), pegar
   `borrar-cuenta.sql` entero y pulsar **Run**. Debe decir *Success*.

Si el paso 1 se salta, el Run falla en la última instrucción y la tarea diaria
no queda programada: las cuentas se marcarían y no se borrarían nunca.

### Cómo funciona el plazo de 30 días

Pedir el borrado **no borra**: apunta una fecha a 30 días vista y cierra la
sesión. Una tarea que corre de madrugada borra las cuentas cuya fecha ya pasó.

Si esa persona vuelve a entrar antes de la fecha, no entra a la app: entra a
una pantalla que le dice cuándo se borra, con dos salidas — recuperarla (su
progreso vuelve entero desde el servidor) o borrarla ya, sin esperar.

Mientras dure el plazo su correo sigue ocupado, así que no puede registrarse
de nuevo con él. Es el precio de poder arrepentirse.

### Por qué hace falta un rodeo

Quitar a alguien de la lista de usuarios es cosa de administrador, y la llave
de administrador **jamás** puede estar dentro de la app: cualquiera que abriera
el código del navegador la tendría, y con ella podría borrar la cuenta de otro.

Lo que hace este SQL es dejar funciones *dentro* de la base de datos que solo
saben actuar sobre quien las llama. No reciben a quién borrar, así que no hay
nada que falsificar desde fuera. La app solo puede decir «bórrame a mí».

### Cosas que no son obvias

**La comprobación vive en el momento de entrar, no en la sincronía.** Un
dispositivo que ya estaba con la sesión abierta cuando se pidió el borrado
sigue sincronizando hasta que la cuenta desaparece de verdad. Es a propósito:
meter esa comprobación en cada sincronía obligaba a que la app y la base de
datos cambiaran a la vez o todo dejaba de guardar.

**La tarea diaria se puede mirar.** En el SQL Editor:
`select * from cron.job;` para ver que está programada, y
`select * from cron.job_run_details order by start_time desc limit 10;` para
ver si corrió y qué contestó.
