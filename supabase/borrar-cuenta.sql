-- Borrar la propia cuenta desde la app.
--
-- Se pega entero en el SQL Editor de Supabase y se pulsa Run. Una sola vez.
-- Ver LEEME.md de esta carpeta para el porqué.
--
-- `security definer` es lo que le da a esta función permiso de administrador.
-- Es seguro porque la función NO recibe a quién borrar: usa auth.uid(), que
-- es quien hizo la llamada y lo pone el servidor, no el navegador. Aunque
-- alguien reescribiera la app entera, lo único que podría pedir es borrarse
-- a sí mismo.
--
-- `set search_path` no es adorno: sin él, alguien con permiso para crear
-- tablas podría colar una suya delante y hacer que esta función escriba
-- donde no debe.

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

-- Que no la pueda llamar cualquiera: solo alguien con sesión iniciada.
revoke all on function public.borrar_mi_cuenta() from public, anon;
grant execute on function public.borrar_mi_cuenta() to authenticated;
