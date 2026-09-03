-- ============================================================
--  El tipo de cambio del día
--  Se pega entero en el editor SQL de Supabase. Es idempotente:
--  correrlo dos veces no rompe nada.
-- ============================================================
--
--  UNA SOLA FILA, y no un histórico. Esto no es una serie de datos: es "el
--  cambio de ahora", y a Norata solo le hace falta el de ahora — el momento
--  en que alguien aprieta «Convertir». Guardar un año de cotizaciones para
--  leer siempre la última sería construir un almacén para no usarlo.
--
--  Y no se guarda "a qué cambio convirtió cada persona": eso ya queda escrito
--  donde importa, que es en sus propios importes. La copia de seguridad que
--  la app hace antes de convertir es lo que permite deshacerlo.
--
--  QUIÉN PUEDE TOCARLA: nadie. Ni la app, ni la landing, ni una persona con
--  sesión. Es el mismo trato que `suscripciones` (ver `planes.sql`): la tabla
--  no tiene ninguna política, así que con RLS encendido no entra nadie por la
--  puerta pública. La única mano que escribe es la función `cambio`, que usa
--  la llave de servicio y se la salta por diseño.
--
--  Podría parecer excesivo para tres números públicos, y la razón por la que
--  no lo es cabe en una frase: lo que hay en esta fila multiplica el dinero
--  guardado de la gente. Quien pudiera escribir aquí un 100 donde va un 17
--  no vería nada raro en su pantalla — le cambiaría los importes a quien
--  convirtiera después.

-- ---- Paso 1: la tabla ----
create table if not exists public.tipos_de_cambio (
  -- La moneda contra la que se miden las demás. Es la clave porque algún día
  -- podría haber otra base, y porque garantiza que solo hay una fila por base.
  base        text primary key,
  -- Cuántas unidades de la base vale UNA de cada moneda: {"MXN":1,"USD":17.0}
  tasas       jsonb        not null,
  -- La que dice el proveedor. Es lo que la app le enseña a quien va a
  -- convertir, y no es lo mismo que `actualizado`: un cambio del viernes se
  -- puede haber pedido el domingo.
  fecha       date         not null,
  fuente      text         not null,
  actualizado timestamptz  not null default now()
);

-- ---- Paso 2: cerrar la puerta ----
alter table public.tipos_de_cambio enable row level security;

-- A propósito no hay ningún `create policy` debajo de esta línea. Con RLS
-- encendido y sin políticas, la tabla es invisible para todo el mundo salvo
-- para la llave de servicio. Si algún día alguien añade una política de
-- lectura "porque total, son públicos", que sepa lo que gana: nada. La app ya
-- los recibe por la función, que además los valida.

-- ---- Paso 3: la función ----
-- No hace falta sembrar ninguna fila: la primera llamada a `cambio` la crea.
-- Mientras no se despliegue la función, la app cae a la tabla de referencia
-- que lleva escrita en `js/01-base.js` y no se rompe nada.
--
--   supabase functions deploy cambio --no-verify-jwt
--
-- El `--no-verify-jwt` no es un descuido: Norata se puede usar sin cuenta, y
-- quien la usa así tiene el mismo derecho a cambiar de moneda. Lo que la
-- función devuelve son tres números públicos que no dicen nada de nadie.

-- ---- Para mirarlo ----
-- select base, tasas, fecha, fuente, actualizado from public.tipos_de_cambio;
