-- Medición: saber si la gente vuelve, sin rastrear a nadie.
--
-- ANTES de correr esto no hace falta activar nada: a diferencia del borrado
-- de cuentas, aquí no hay tarea programada ni extensiones. Se pega entero en
-- el SQL Editor y ya. Ver LEEME.md de esta carpeta para el porqué de cada
-- cosa y para las consultas de lectura, que están al final de este archivo.
--
-- La idea que sostiene todo el diseño: NO se guarda un evento por cada cosa
-- que pasa. Un registro de eventos crece sin control, obliga a construir un
-- panel para poder leerlo y acaba abandonado. Aquí se guarda UNA FILA POR
-- PERSONA Y DÍA. Como máximo 365 al año por cuenta: mil personas durante un
-- año son unos 30 MB, y el plan gratuito da 500.
--
-- Y la regla que no se rompe: CUENTAS, NUNCA CONTENIDO. Ni un título de
-- misión, ni el nombre de una habilidad, ni una nota. Solo números y
-- banderas. Es lo que permite que el aviso de privacidad quepa en una página
-- y que se pueda decir, sin letra chica, que no se lee lo que la gente
-- escribe.


-- ---- La tabla ----
create table if not exists public.pulsos (
  user_id   uuid not null references auth.users(id) on delete cascade,
  dia       date not null,
  version   text,
  aparato   text,       -- 'movil' o 'escritorio'
  instalada boolean,    -- ¿la abrió como app instalada, o desde el navegador?
  aperturas integer not null default 1,
  primary key (user_id, dia)
);

-- Casi todas las consultas empiezan preguntando por fechas ("los últimos 30
-- días"), y sin esto la base recorrería la tabla entera cada vez.
create index if not exists pulsos_dia on public.pulsos (dia);

-- El borrado de la cuenta se lleva los pulsos por el `on delete cascade` de
-- arriba, tanto si se pide desde Ajustes como si los barre la tarea diaria.
-- No hay que acordarse de nada al borrar.


-- ---- Nadie toca esta tabla directamente ----
-- RLS encendida y SIN ninguna regla que permita nada. Es a propósito: la
-- única puerta es la función de abajo. Así la fecha la pone siempre el
-- servidor y nadie puede inventarse un historial, ni borrar el suyo para
-- salir de las cuentas, ni leer el de otro.
alter table public.pulsos enable row level security;

revoke all on table public.pulsos from anon, authenticated;


-- ---- La única puerta ----
-- Mismo patrón que `pedir_borrado()`: no recibe a quién apuntar, usa
-- auth.uid(), que lo pone el servidor y no el navegador. Aunque alguien
-- reescribiera la app entera, lo único que podría hacer es apuntarse a sí
-- mismo, hoy, y sumar una apertura.
--
-- `set search_path` no es adorno: sin él, alguien con permiso para crear
-- tablas podría colar una suya delante y hacer que esta función escriba
-- donde no debe.
create or replace function public.latir(v text, ap text, inst boolean)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  -- Sin sesión no se apunta nada, y tampoco se protesta: quien prueba la app
  -- sin cuenta tiene derecho a ser invisible. Ver LEEME.md.
  if auth.uid() is null then
    return;
  end if;

  insert into public.pulsos (user_id, dia, version, aparato, instalada)
  values (auth.uid(), current_date, v, ap, inst)
  on conflict (user_id, dia) do update
    set aperturas = pulsos.aperturas + 1,
        version   = excluded.version,
        aparato   = excluded.aparato,
        instalada = excluded.instalada;
end;
$$;


-- ---- Quién puede llamar a qué ----
revoke all on function public.latir(text, text, boolean) from public, anon;
grant execute on function public.latir(text, text, boolean) to authenticated;


-- =====================================================================
--  LAS CONSULTAS
--
--  No van como vistas a propósito: una vista sobre `auth.users` es una fuga
--  esperando a ocurrir si algún día se le da permiso al rol equivocado.
--  Estas se pegan en el SQL Editor y se guardan ahí, que es donde ya tienes
--  la llave que puede leerlas.
--
--  Con veinte o trescientas personas esto sobra. El día que estorbe, ese día
--  se construye un panel — y no antes.
-- =====================================================================


-- ---- 1. Retención a 30 días. El número que decide todo ----
-- De los que se registraron hace 30 días o más, ¿cuántos siguen apareciendo?
-- Señal buena: 20 de cada 100. Por debajo de 10, el trabajo que sigue es el
-- producto y no el cobro.
--
-- select
--   count(*)                                         as registrados,
--   count(*) filter (where p.ultimo >= u.alta + 30)  as siguen,
--   round(100.0 * count(*) filter (where p.ultimo >= u.alta + 30)
--         / nullif(count(*), 0), 1)                  as porcentaje
-- from (select id, created_at::date as alta from auth.users) u
-- left join (select user_id, max(dia) as ultimo
--              from public.pulsos group by 1) p on p.user_id = u.id
-- where u.alta <= current_date - 30;


-- ---- 2. ¿Volvieron algún otro día? ----
-- Si no vuelven después del día que se registraron, no vuelven nunca.
-- Señal buena: 40 de cada 100.
--
-- select
--   count(*)                                    as registrados,
--   count(*) filter (where p.dias_distintos > 1) as volvieron
-- from (select id, created_at::date as alta from auth.users) u
-- left join (select user_id, count(distinct dia) as dias_distintos
--              from public.pulsos group by 1) p on p.user_id = u.id
-- where u.alta <= current_date - 2;


-- ---- 3. ¿Cuántos la instalan? ----
-- Instalada se abre; en una pestaña se olvida. Señal buena: 30 de cada 100.
--
-- select
--   count(distinct user_id)                                        as personas,
--   count(distinct user_id) filter (where instalada)               as instalada
-- from public.pulsos
-- where dia >= current_date - 30;


-- ---- 4. ¿Cuántos usan dos aparatos? ----
-- Es la señal de que ya cuentan con la app de verdad. Señal buena: 25 de
-- cada 100. Ojo con lo que mide de verdad: ver LEEME.md, distingue teléfono
-- de computadora, no dos teléfonos.
--
-- select
--   count(*)                                  as personas,
--   count(*) filter (where tipos > 1)         as usan_los_dos
-- from (select user_id, count(distinct aparato) as tipos
--         from public.pulsos where dia >= current_date - 30
--        group by 1) t;


-- ---- 5. Los últimos 14 días, día por día ----
-- Para mirar de un vistazo si una tanda de invitaciones movió la aguja.
--
-- select dia, count(*) as personas, sum(aperturas) as aperturas
--   from public.pulsos
--  where dia >= current_date - 14
--  group by dia order by dia desc;


-- ---- 6. ¿Qué versión está corriendo la gente? ----
-- Sirve para cazar el fallo clásico de una app instalable: un aparato que se
-- quedó pegado a una copia vieja porque no se subió el número de CACHE. Si
-- aquí aparece una versión que ya no existe, es eso.
--
-- select version, count(distinct user_id) as personas
--   from public.pulsos
--  where dia >= current_date - 7
--  group by version order by personas desc;
