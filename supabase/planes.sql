-- Quién pagó: la tabla que la app puede leer y NUNCA escribir.
--
-- Se pega entera en el SQL Editor (pestaña nueva con el `+`) y Run. No hace
-- falta ninguna extensión. Ver LEEME.md de esta carpeta para el porqué de
-- cada decisión y para lo que hay que dejar puesto en Stripe.
--
-- LA IDEA QUE SOSTIENE TODO: el navegador no puede otorgarse un plan.
-- Aquí no hay ninguna regla de escritura para nadie —ni para el dueño de la
-- fila—. La única mano que escribe es la llave de servicio, que vive dentro
-- de la función `cobro` y jamás baja al navegador. Aunque alguien reescribiera
-- la app entera en su computadora, lo más que consigue es engañar a su propia
-- pantalla: la base sigue diciendo 'libre' y al recargar vuelve a serlo.
--
-- Y la vuelta de tuerca: el navegador tampoco decide si el plan sigue vigente.
-- Eso se calcula abajo, contra el reloj del servidor. Mover el reloj del
-- teléfono al año 2030 no revive una suscripción vencida, ni moverlo hacia
-- atrás alarga una.


-- ---- La tabla ----
create table if not exists public.suscripciones (
  user_id       uuid primary key references auth.users(id) on delete cascade,

  -- 'libre' | 'mensual' | 'anual' | 'fundador'
  plan          text not null default 'libre',

  -- Lo que dice Stripe, copiado tal cual y sin interpretar:
  -- 'activa' | 'prueba' | 'impago' | 'cancelada' | 'ninguna'
  estado        text not null default 'ninguna',

  -- Hasta cuándo está pagado. NULL en fundador: no vence nunca.
  vence_el      timestamptz,

  -- ¿Se va a cobrar solo el siguiente periodo? Es lo que distingue "canceló
  -- pero le quedan 20 días" de "canceló y ya se le acabó". Sin este campo la
  -- app no puede decir la frase correcta y acaba diciendo la que asusta.
  renueva       boolean not null default false,

  -- Los identificadores de Stripe. No son secretos —no sirven para cobrar—
  -- pero tampoco los ve nadie más que su dueño, por la regla de abajo.
  cliente       text,          -- cus_...
  suscripcion   text,          -- sub_...  (NULL en fundador)

  actualizado   timestamptz not null default now()
);

-- Buscar por cliente de Stripe es lo primero que hace el webhook en cada
-- aviso. Sin esto recorrería la tabla entera cada vez que alguien renueva.
create unique index if not exists suscripciones_cliente
  on public.suscripciones (cliente) where cliente is not null;

-- El borrado de la cuenta se lleva la fila por el `on delete cascade`. OJO:
-- eso borra el registro local, NO cancela el cobro en Stripe. Ver LEEME.md.


-- ---- Quién puede tocarla ----
alter table public.suscripciones enable row level security;

-- Leer, solo lo tuyo. Es la única regla que existe.
drop policy if exists "leer lo mio" on public.suscripciones;
create policy "leer lo mio" on public.suscripciones
  for select using (auth.uid() = user_id);

-- Y nada más. Sin política de insert, update ni delete, PostgreSQL las
-- rechaza todas: no es un olvido, es el candado. La llave de servicio se
-- salta RLS por diseño, así que la función `cobro` sí escribe.
revoke insert, update, delete on table public.suscripciones from anon, authenticated;


-- ---- La única puerta de lectura ----
-- La app podría hacer un select normal, pero entonces tendría que decidir
-- ella si la fecha ya pasó, y esa decisión no puede vivir en un aparato cuyo
-- reloj cambia el usuario. Aquí `now()` es el del servidor.
--
-- Devuelve SIEMPRE algo, incluso si no hay fila. Que la app tenga que
-- distinguir entre "no pagó" y "no hay fila" es una rama de más que solo
-- sirve para fallar el día que la fila tarda en crearse.
create or replace function public.mi_plan()
returns json
language plpgsql
security definer
stable
set search_path = public, auth
as $fn$
declare
  f public.suscripciones%rowtype;
  vigente boolean;
begin
  if auth.uid() is null then
    return json_build_object('plan', 'libre', 'pro', false, 'estado', 'ninguna');
  end if;

  select * into f from public.suscripciones where user_id = auth.uid();

  if not found then
    return json_build_object('plan', 'libre', 'pro', false, 'estado', 'ninguna');
  end if;

  -- Fundador no vence nunca; los demás, mientras no haya pasado la fecha.
  --
  -- Los tres días de más no son un regalo: son el hueco entre que la tarjeta
  -- falla y Stripe consigue cobrarla al segundo intento. Sin ellos, a quien
  -- se le venció la tarjeta un martes se le apagan las funciones el martes y
  -- se le vuelven a encender el jueves, y esa persona ya escribió el correo
  -- enfadada. Tres días cuestan casi nada y evitan todos esos correos.
  vigente := (f.plan = 'fundador')
             or (f.vence_el is not null and f.vence_el + interval '3 days' > now());

  return json_build_object(
    'plan',     case when vigente then f.plan else 'libre' end,
    'pro',      vigente,
    'estado',   f.estado,
    'vence_el', f.vence_el,
    'renueva',  f.renueva,
    -- El plan que compró, aunque ya no esté vigente. Es lo que permite decir
    -- "tu plan anual terminó" en vez de un genérico "no tienes plan".
    'compro',   f.plan
  );
end;
$fn$;

grant execute on function public.mi_plan() to authenticated;


-- ---- El cupo de fundador ----
-- Vive en la base y no en una constante dentro del código porque el día que
-- se quieran abrir cincuenta lugares más no debería hacer falta desplegar
-- nada: se cambia un número aquí y ya.
create table if not exists public.ajustes_negocio (
  clave text primary key,
  valor integer not null
);

insert into public.ajustes_negocio (clave, valor)
values ('cupo_fundador', 200)
on conflict (clave) do nothing;

alter table public.ajustes_negocio enable row level security;
-- Sin ninguna política: nadie la lee ni la escribe directamente desde fuera.
-- La puerta es la función de abajo.

-- Cuántos lugares quedan. Es lo ÚNICO de todo este archivo que puede
-- preguntar cualquiera sin sesión, porque lo pinta la landing y ahí todavía
-- no hay nadie identificado. No revela nada de nadie: es un número.
create or replace function public.lugares_fundador()
returns integer
language sql
security definer
stable
set search_path = public
as $fn$
  select greatest(
    0,
    (select valor from public.ajustes_negocio where clave = 'cupo_fundador')
    - (select count(*)::integer from public.suscripciones where plan = 'fundador')
  );
$fn$;

grant execute on function public.lugares_fundador() to anon, authenticated;


-- ---- Consultas para mirar el negocio ----
-- En el SQL Editor, igual que las de medicion.sql. Con veinte o trescientas
-- personas esto sobra; el día que estorbe, ese día se construye un panel.

-- 1. Cuánta gente hay en cada plan, ahora mismo
-- select plan, estado, count(*) from public.suscripciones group by 1,2 order by 1,2;

-- 2. Ingreso mensual recurrente aproximado, en pesos
--    (fundador no entra: es pago único, no recurrente)
-- select round(sum(case plan when 'mensual' then 69 when 'anual' then 590/12.0 else 0 end))
--   from public.suscripciones
--  where estado = 'activa' and (vence_el is null or vence_el > now());

-- 3. Quién canceló pero todavía no se le acaba (a estos todavía se les puede
--    preguntar por qué se van; después ya no contestan)
-- select user_id, plan, vence_el from public.suscripciones
--  where renueva = false and vence_el > now() order by vence_el;

-- 4. Lugares de fundador que quedan
-- select public.lugares_fundador();

-- 5. Pagos que fallaron y siguen fallando
-- select user_id, plan, vence_el from public.suscripciones
--  where estado = 'impago' order by vence_el;

-- 6. Cuánto tarda alguien en pagar desde que se registró
-- select date_trunc('day', s.actualizado - u.created_at) as tardanza, count(*)
--   from public.suscripciones s join auth.users u on u.id = s.user_id
--  where s.plan <> 'libre' group by 1 order by 1;
