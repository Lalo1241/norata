-- Borrado de cuenta con 30 días para arrepentirse.
--
-- ANTES de correr esto hay que activar la extensión pg_cron una vez, desde el
-- panel: Database → Extensions → buscar "pg_cron" → activarla. Es lo que deja
-- que la base de datos haga sola una tarea todos los días. Si no está, la
-- última instrucción de este archivo falla y no se programa nada.
--
-- Ver LEEME.md de esta carpeta para el porqué de cada cosa.
--
-- `security definer` es lo que le da a estas funciones permiso de
-- administrador. Es seguro porque ninguna recibe a quién borrar: usan
-- auth.uid(), que es quien hizo la llamada y lo pone el servidor, no el
-- navegador. Aunque alguien reescribiera la app entera, lo único que podría
-- pedir es borrarse a sí mismo.
--
-- `set search_path` no es adorno: sin él, alguien con permiso para crear
-- tablas podría colar una suya delante y hacer que estas funciones escriban
-- donde no deben.

-- La fecha en la que toca borrar. Vacía = la cuenta está bien.
alter table public.perfiles add column if not exists borrar_el timestamptz;


-- ---- 1. Pedir el borrado. Marca la fecha y la devuelve ----
create or replace function public.pedir_borrado()
returns timestamptz
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  yo uuid := auth.uid();
  cuando timestamptz;
begin
  if yo is null then
    raise exception 'Hace falta una sesion iniciada.';
  end if;

  update public.perfiles
     set borrar_el = now() + interval '30 days'
   where user_id = yo
  returning borrar_el into cuando;

  -- Quien nunca llegó a sincronizar no tiene fila, y sin fila no hay dónde
  -- apuntar la fecha. Se crea vacía solo para poder marcarla.
  if cuando is null then
    insert into public.perfiles (user_id, estado, rev, borrar_el)
    values (yo, '{}'::jsonb, 0, now() + interval '30 days')
    returning borrar_el into cuando;
  end if;

  return cuando;
end;
$$;


-- ---- 2. Arrepentirse ----
create or replace function public.cancelar_borrado()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  yo uuid := auth.uid();
begin
  if yo is null then
    raise exception 'Hace falta una sesion iniciada.';
  end if;
  update public.perfiles set borrar_el = null where user_id = yo;
end;
$$;


-- ---- 3. Borrar ya, sin esperar los 30 días ----
create or replace function public.borrar_mi_cuenta()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  yo uuid := auth.uid();
begin
  if yo is null then
    raise exception 'Hace falta una sesion iniciada.';
  end if;

  -- El progreso primero; la cuenta después.
  delete from public.perfiles where user_id = yo;
  delete from auth.users where id = yo;
end;
$$;


-- ---- 4. El barrendero: borra las que ya vencieron ----
-- No la llama nadie desde la app; la llama la propia base de datos una vez al
-- día. Por eso es la única que NO puede ejecutar un usuario con sesión.
create or replace function public.barrer_cuentas_vencidas()
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  cuantas integer;
begin
  with vencidas as (
    select user_id from public.perfiles
     where borrar_el is not null and borrar_el <= now()
  )
  delete from auth.users u using vencidas v where u.id = v.user_id;
  get diagnostics cuantas = row_count;
  return cuantas;
end;
$$;


-- ---- Quién puede llamar a qué ----
revoke all on function public.pedir_borrado() from public, anon;
revoke all on function public.cancelar_borrado() from public, anon;
revoke all on function public.borrar_mi_cuenta() from public, anon;
grant execute on function public.pedir_borrado() to authenticated;
grant execute on function public.cancelar_borrado() to authenticated;
grant execute on function public.borrar_mi_cuenta() to authenticated;

revoke all on function public.barrer_cuentas_vencidas() from public, anon, authenticated;


-- ---- La tarea diaria ----
-- A las 3:17 de la madrugada (UTC) y no a las 3:00 en punto: las horas
-- redondas son cuando todo el mundo programa sus tareas.
--
-- Se quita antes por si ya existía de una vez anterior; si no existe, el
-- error se ignora y sigue.
do $limpiar$
begin
  perform cron.unschedule('norata-barrer-cuentas');
exception when others then
  null;
end;
$limpiar$;

select cron.schedule(
  'norata-barrer-cuentas',
  '17 3 * * *',
  $tarea$select public.barrer_cuentas_vencidas();$tarea$
);
