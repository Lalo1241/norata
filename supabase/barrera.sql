-- La barrera de subidas: el grifo.
--
-- Qué es la barrera y por qué existe está contado en
-- `.github/workflows/barrera.yml`. Aquí vive UNA sola cosa: si el grifo está
-- abierto o cerrado.
--
--   abierto   lo que se sube a `main` se publica solo, como se trabajaba hasta
--             la 0.7.172.
--   cerrado   lo que se sube a `main` se queda en la cola hasta que Eduardo lo
--             aprueba desde el Puesto de mando.
--
-- Vive en Supabase y no en GitHub por una razón: lo tienen que leer TRES sitios
-- —el trabajo de GitHub al subir, el panel, y cualquier sesión que vaya a decir
-- «ya está subido» (`herramientas/barrera.sh`)—, y esto es lo único a lo que
-- los tres llegan sin una llave. Que el grifo esté abierto o cerrado no es un
-- secreto; quién puede moverlo, sí.
--
-- Correr entero en SQL Editor → pestaña nueva con el `+`. Debe decir Success.
-- Requiere `administracion.sql` ya corrido: usa `soy_admin()`.

create table if not exists public.barrera (
  -- Una sola fila, siempre: la clave es `true` y no puede ser otra cosa.
  id       boolean primary key default true check (id),
  grifo    text not null default 'abierto' check (grifo in ('abierto', 'cerrado')),
  cambiado timestamptz not null default now(),
  por      uuid
);

-- Nace ABIERTO: instalar la barrera no cambia nada hasta que alguien la cierra.
insert into public.barrera (id) values (true) on conflict (id) do nothing;

alter table public.barrera enable row level security;
-- Sin políticas: nadie toca la tabla desde la app. Se lee y se escribe por las
-- dos funciones de abajo.
revoke all on table public.barrera from anon, authenticated;


-- Cómo está el grifo. La puede llamar cualquiera, con sesión o sin ella.
create or replace function public.barrera_estado()
returns jsonb
language sql
security definer
stable
set search_path = public
as $fn$
  select jsonb_build_object('grifo', grifo, 'cambiado', cambiado)
    from public.barrera
   where id;
$fn$;

revoke all on function public.barrera_estado() from public;
grant execute on function public.barrera_estado() to anon, authenticated;


-- Abrir o cerrar. Solo quien administra.
create or replace function public.barrera_grifo(p_abierto boolean)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $fn$
declare
  quedo jsonb;
begin
  if not public.soy_admin() then
    raise exception 'Sin permiso.' using errcode = '42501';
  end if;

  update public.barrera
     set grifo = case when p_abierto then 'abierto' else 'cerrado' end,
         cambiado = now(),
         por = auth.uid()
   where id
  returning jsonb_build_object('grifo', grifo, 'cambiado', cambiado) into quedo;

  return quedo;
end;
$fn$;

revoke all on function public.barrera_grifo(boolean) from public, anon;
grant execute on function public.barrera_grifo(boolean) to authenticated;
