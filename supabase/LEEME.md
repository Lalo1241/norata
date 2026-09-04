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

## Medir si la gente vuelve (`medicion.sql`)

**Sin esto, `sbLatir()` recibe un 404 y no pasa nada más**: la app no se
entera, nadie ve un error y no se apunta ni un dato. Es el único archivo de
esta carpeta que no bloquea nada — y justo por eso es fácil olvidarlo hasta
que ya se perdió el primer mes de gente.

Un solo paso: abrir el **SQL Editor**, pestaña nueva con el `+`, pegar
`medicion.sql` entero y **Run**. No hace falta ninguna extensión.

### Qué se guarda, y qué no

Una fila por persona y día. Nada más. La fila lleva el día, la versión de la
app, si fue teléfono o computadora, si estaba instalada, y cuántas veces se
abrió. **Ni un título de misión, ni el nombre de una habilidad, ni una nota.**

Esa regla —cuentas, nunca contenido— no es un escrúpulo suelto: es lo que
permite que el aviso de privacidad quepa en una página, y poder decir sin
letra chica que no se lee lo que la gente escribe. Cualquier campo nuevo que
se le añada a esta tabla tiene que pasar esa prueba antes de entrar.

### Por qué una fila al día y no un registro de eventos

Un evento por cada cosa que pasa crece sin control, obliga a construir un
panel para poder leerlo y acaba abandonado. Una fila al día son como mucho
365 al año por cuenta: mil personas durante un año caben en unos 30 MB, y el
plan gratuito da 500. Y las preguntas que hay que responder —¿vuelven?,
¿cuántos siguen al mes?— se contestan igual de bien.

### Nadie toca esa tabla, ni su dueño

Tiene RLS encendida y **ninguna regla que permita nada**. La única puerta es
`latir()`. Así la fecha la pone siempre el servidor: nadie puede inventarse un
historial, ni borrar el suyo para salirse de las cuentas, ni asomarse al de
otro. Al borrar la cuenta los pulsos se van solos, por el `on delete cascade`.

### Dónde se ven los números

**En el SQL Editor, no en un panel.** Las seis consultas están al final de
`medicion.sql`, comentadas y listas para pegar; guárdalas ahí con nombre. Con
veinte o trescientas personas eso sobra, y el día que estorbe, ese día se
construye un panel — no antes.

### Cosas que no son obvias

**Quien prueba sin cuenta es invisible, a propósito.** No tiene identidad en
la base, y medirlo obligaría a dejarle una marca al aparato. Eso ya es
rastrear a alguien que no dio permiso, así que se acepta el hueco.

**«Aparato» sale del ancho de la ventana, no del user agent.** Responde la
única pregunta que interesa —¿usa la computadora y el teléfono?— sin fichar
el aparato de nadie. Cuesta precisión: dos teléfonos distintos cuentan como
uno solo, y la consulta 4 lo sobreentiende.

**El latido va lo último del arranque y sin esperarlo.** No debe retrasar ni
un milisegundo lo que el usuario está esperando ver, y falla en el más
absoluto silencio. Si algún día un fallo de la medición interrumpe a alguien
que está usando la app, la medición habrá costado más de lo que vale.

**La consulta 6 caza el fallo clásico de una app instalable.** Si ahí aparece
una versión que ya no existe, es un aparato pegado a una copia vieja porque
no se subió el número de `CACHE` en `sw.js`.

## El panel de números (`administracion.sql`)

**Sin esto, en Ajustes no aparece la sección «Los números»** para nadie, ni
siquiera para ti. La app pregunta al servidor si eres administrador, el
servidor no sabe de qué le hablan, y la respuesta es que no.

Necesita `medicion.sql` y `planes.sql` ya corridos: lee sus tablas, no las crea.

Son **dos pasos**, y el segundo no se puede automatizar:

1. **Correr el SQL.** SQL Editor → pestaña nueva con el `+` → pegar
   `administracion.sql` entero → Run. Debe decir *Success*.
2. **Darte de alta como administrador**, cambiando el correo por el tuyo:

   ```sql
   insert into public.administradores (user_id, nota)
   select id, 'Eduardo' from auth.users where email = 'TU-CORREO@AQUI'
   on conflict (user_id) do nothing;
   ```

   Después, recarga la app con tu sesión abierta y la sección aparece.

El paso 2 va a mano **a propósito**: una función que convirtiera a alguien en
administrador sería exactamente la puerta que todo lo demás intenta cerrar.

### Dos trampas del paso 2, y las dos ya mordieron

**`select public.soy_admin();` en el SQL Editor devuelve `false` siempre.**
Ahí no hay ninguna sesión iniciada, así que `auth.uid()` es NULL y la función
no encuentra a nadie — esté el alta bien o mal. No prueba nada y parece que
todo falló. La comprobación que sí sirve:

```sql
select a.nota, u.email, a.desde
  from public.administradores a
  join auth.users u on u.id = a.user_id;
```

Una fila con tu correo significa que está hecho. Para verlo funcionando de
verdad, recarga la app: si aparece «Los números» en Ajustes, está cerrado.

**El final de `administracion.sql` lleva también la instrucción que QUITA el
permiso.** Descomentar el bloque entero y darle a Run te da de alta y te vuelve
a quitar en la misma pasada, y el resultado parece un fallo del SQL cuando en
realidad se hicieron las dos cosas seguidas. Descomenta solo el `insert`,
corre, y vuelve a comentarlo.

### Por qué el botón no es la seguridad

Que la sección no se dibuje es **limpieza, no protección**. Cualquiera puede
abrir la consola de su navegador, poner `esAdmin = true` y ver aparecer la
sección — y entonces verá una pantalla vacía, porque `metricas()` comprueba
quién pregunta antes de devolver nada. Ésa es la única frontera, y por eso
`js/10e-panel.js` empieza diciendo que él no es seguridad.

**El error clásico que este archivo evita:** marcar al administrador en los
metadatos de la cuenta. En Supabase el propio usuario puede escribir sus
metadatos desde el navegador, así que un `es_admin: true` guardado ahí se lo
pone cualquiera en diez segundos. Por eso es una tabla que él no alcanza.

### Qué se puede ver y qué no

`metricas()` devuelve **totales, nunca filas de nadie**: «23 personas activas»,
jamás «la cuenta X abrió el martes». No es prudencia de más — es lo que
permite que el aviso de privacidad siga siendo verdad aunque el panel exista,
y limita el daño el día que algo aquí se rompa.

### Los tropiezos

`apuntar_tropiezo()` es **la única función del proyecto que acepta a alguien
sin sesión**, y tiene que serlo: los errores más graves son los del arranque,
antes de que nadie haya entrado. Un fallo que solo se pudiera reportar tras
iniciar sesión sería invisible justo cuando importa.

Como es abierta, lleva dos frenos: el mensaje se recorta a 300 caracteres, y
pasadas 500 filas en un día se dejan de crear nuevas pero se siguen contando
las que ya existen — así, quien quisiera llenar la tabla no borra de paso la
información de un fallo real.

## Cobrar (`planes.sql` + las funciones `pagar` y `cobro`)

**Sin esto, el plan de todo el mundo es «libre» y los botones de pagar avisan
de que el pago todavía no está disponible.** La app no se rompe: es el estado
en el que está hoy.

El reparto, que es lo único que hay que entender para no meter la pata:

| Quién | Qué puede hacer con la tabla `suscripciones` |
| --- | --- |
| La app, la landing, cualquiera | **Leer su propia fila. Nada más.** |
| La función `cobro` | Escribir, y solo si Stripe firmó el aviso |

No hay ninguna política de escritura para nadie. Eso es lo que impide que
alguien se regale un plan reescribiendo el JavaScript en su navegador: puede
engañar a su propia pantalla, y al recargar la mentira se cae sola.

### Los pasos, en orden

1. **Correr `planes.sql`.** SQL Editor, pestaña nueva con el `+`, pegar entero
   y Run. Debe decir *Success*. Con esto ya funciona `mi_plan()` y todo el
   mundo sale como «libre».

2. **Crear los tres productos en Stripe.** Products → Add product, en pesos:

   | Producto | Cómo | Precio |
   | --- | --- | --- |
   | Norata mensual | Recurring, monthly | $69 MXN |
   | Norata anual | Recurring, yearly | $590 MXN |
   | Norata fundador | One time | $890 MXN |

   En el codigo de impuestos de los tres, **Software como servicio (SaaS):
   uso personal**. No es descarga electronica —Norata se usa en el navegador,
   y poder instalarla como acceso directo no la convierte en una descarga— ni
   uso comercial, que es lo que se le vende a una empresa. Ese codigo solo
   importa el dia que se encienda Stripe Tax, y se puede corregir despues.

   De cada uno se copia el identificador del **precio** (`price_...`), no el
   del producto. Es el error de siempre y da un error de Stripe que no
   explica nada.

3. **Guardar los secretos.** Desde la terminal, con la CLI de Supabase:

   ```
   supabase secrets set STRIPE_SECRETA=sk_live_xxxxxxxx
   supabase secrets set STRIPE_PRECIO_MENSUAL=price_xxx
   supabase secrets set STRIPE_PRECIO_ANUAL=price_xxx
   supabase secrets set STRIPE_PRECIO_FUNDADOR=price_xxx
   ```

4. **Desplegar las dos funciones.** La segunda lleva `--no-verify-jwt` y no es
   opcional: Stripe no tiene sesión de Supabase y no puede mandar una. Sin esa
   bandera, **todos** los avisos rebotan con un 401 y nadie se entera hasta que
   alguien reclama que pagó y no tiene plan.

   ```
   supabase functions deploy pagar
   supabase functions deploy cobro --no-verify-jwt
   ```

5. **Dar de alta el webhook en Stripe.** Developers → Webhooks → Add endpoint,
   apuntando a `https://<proyecto>.supabase.co/functions/v1/cobro`, con estos
   seis sucesos y no más:

   ```
   checkout.session.completed
   customer.subscription.updated
   customer.subscription.deleted
   invoice.paid
   invoice.payment_failed
   charge.refunded
   ```

   **El sexto se añadió el 3 de septiembre de 2026.** Si el endpoint ya estaba
   creado desde antes, hay que **editarlo y marcarlo a mano**: sin ese aviso,
   devolverle el dinero a un Fundador le deja el plan puesto para siempre y su
   lugar ocupado en el cupo. No hay ninguna señal de que falte — se descubre el
   día que se devuelve el primero, que es justo cuando ya es tarde.

   **Y si `charge.refunded` no aparece en el selector, no es un error tuyo:**
   según la versión de API del endpoint y de si la cuenta usa el panel nuevo,
   Stripe ofrece `charge.refunded`, `refund.created` y `refund.updated`, o solo
   algunos. La función atiende **los tres**, así que marca el que te aparezca —
   o los tres, que tampoco duplica nada: lo que se escribe es un estado final,
   no un incremento.

   Dónde se marcan, que tampoco está donde uno cree: **Webhooks → el endpoint →
   los tres puntos → «Update details»**. La pestaña «Eventos» del panel es el
   REGISTRO de lo que ya llegó, no el selector; ahí no se marca nada.

6. **Guardar la firma**, que aparece al crear el endpoint del paso anterior:

   ```
   supabase secrets set STRIPE_FIRMA=whsec_xxxxxxxx
   supabase functions deploy cobro --no-verify-jwt
   ```

   Sí, se vuelve a desplegar: un secreto nuevo no llega a una función que ya
   estaba corriendo.

7. **Encender el portal de cliente.** Settings → Billing → Customer portal, y
   permitir cancelar y actualizar la tarjeta. Es lo que abre «Mi suscripción»
   en Ajustes. Sin esto, ese botón da error y la única forma de cancelar es
   escribiendo un correo.

### Probarlo antes de que haya dinero de verdad

Todo lo anterior en **modo prueba** primero (el interruptor de arriba a la
derecha en Stripe): las llaves son `sk_test_` y `whsec_` distinto, y la
tarjeta `4242 4242 4242 4242` con cualquier fecha futura paga siempre. Ahí se
comprueba el ciclo entero —pagar, ver el plan encendido, cancelar en el
portal, ver que sigue hasta la fecha— sin cobrarle a nadie.

Para provocar los casos que no salen solos, `stripe trigger invoice.payment_failed`
desde la CLI de Stripe. El fallo de tarjeta es el caso que nunca se prueba y
el que más correos genera.

### Cosas que no son obvias

**El cupo de fundador se mira antes de abrir la caja, y no se reserva.** Dos
personas pueden entrar en el mismo segundo con un lugar libre y quedarse las
dos. Es a propósito: reservar el lugar mientras alguien teclea su tarjeta
significa que quien abandone el pago se lleva un lugar al limbo. Pasarse por
uno o dos no le hace daño a nadie; negarle el plan a quien ya pagó, sí. El
registro de la función `cobro` avisa cuando el cupo se agota — es la señal
para quitarlo de la landing.

**Borrar la cuenta borra la fila, pero no cancela el cobro en Stripe.** El
`on delete cascade` se lleva el registro local y ahí se acaba lo que puede
hacer la base de datos. Hoy hay que cancelarlo a mano desde el panel de
Stripe. Es el hueco conocido más grande de todo esto y conviene cerrarlo
antes de que haya mucha gente: alguien a quien se le sigue cobrando por una
cuenta que borró es una queja cara.

**La firma se calcula sobre el texto exacto que llegó.** Pasarlo por
`JSON.parse` y volver a serializarlo cambia espacios y orden, la firma deja de
cuadrar para siempre y el rechazo no da ninguna pista. Si algún día todos los
avisos empiezan a rebotar con 400, mirar eso primero.

**No se cree lo que viene en el aviso: se le vuelve a preguntar a Stripe.**
Los avisos no llegan en orden y se reintentan durante tres días. Un «se
canceló» que llega tarde dejaría cancelada una suscripción viva. Volver a
preguntar cuesta una llamada y hace que el orden deje de importar.
