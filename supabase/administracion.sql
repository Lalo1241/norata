-- Panel de administración: quién puede mirar los números, y qué números son.
--
-- La pregunta que motivó este archivo fue de Eduardo y es la correcta: si el
-- panel vive dentro de la app, ¿cómo se evita que lo vea cualquiera? La
-- respuesta corta es que **esconder el botón no protege nada**. Cualquiera
-- puede leer el JavaScript de Norata, encontrar el nombre de una función y
-- llamarla desde la consola de su navegador. Lo único que protege es que el
-- servidor compruebe quién llama ANTES de contestar, y eso es lo que hace
-- `metricas()`: su primera línea es la comprobación, no la consulta.
--
-- Vale la misma advertencia que lleva escrita `js/10d-plan.js` en su primera
-- línea: lo que decida el navegador NO es seguridad. Aquí sí lo es.
--
-- Correr entero en SQL Editor → pestaña nueva con el `+`. Debe decir Success.
-- Después hace falta UN paso más a mano: darte de alta como administrador.
-- Está al final del archivo y no se puede automatizar a propósito.
--
-- Ver LEEME.md de esta carpeta. Requiere `medicion.sql` y `planes.sql` ya
-- corridos: este archivo lee sus tablas y no las crea.


-- ============================================================
-- 1. Quién es administrador
-- ============================================================

-- Una tabla y no una marca en los metadatos de la cuenta, y esto no es un
-- capricho: en Supabase **el propio usuario puede escribir sus metadatos**
-- desde el navegador. Un `es_admin: true` guardado ahí se lo pone cualquiera
-- en diez segundos. Tiene que vivir donde el usuario no alcanza.
create table if not exists public.administradores (
  user_id uuid primary key references auth.users(id) on delete cascade,
  desde   timestamptz not null default now(),
  nota    text
);

alter table public.administradores enable row level security;

-- Ni una sola política, igual que `ajustes_negocio` en planes.sql: sin
-- política, RLS no deja pasar a nadie. Esta tabla no se lee ni se escribe
-- desde fuera — solo la miran las funciones de abajo, que corren con permiso
-- de administrador, y el SQL Editor, que ya es la puerta de servicio.
revoke all on table public.administradores from anon, authenticated;


-- ¿Quien llama es administrador? Existe separada de `metricas()` porque la
-- app necesita saberlo ANTES de pedir nada: es lo que decide si se dibuja la
-- sección de Ajustes. Devolver false a un desconocido no revela nada — no
-- dice quién sí lo es, ni cuántos hay.
create or replace function public.soy_admin()
returns boolean
language sql
security definer
stable
set search_path = public, auth
as $fn$
  select exists (
    select 1 from public.administradores where user_id = auth.uid()
  );
$fn$;

revoke all on function public.soy_admin() from public, anon;
grant execute on function public.soy_admin() to authenticated;


-- ============================================================
-- 2. Los tropiezos: qué se rompe, sin esperar a que alguien escriba
-- ============================================================

-- Una fila por (día + versión + sitio + mensaje), no una por cada vez que
-- pasa. Un error que se dispara en un bucle escribe cinco mil veces en un
-- minuto, y con una fila por evento la tabla se come el plan gratis en una
-- tarde. Aquí el quinto mil solo suma uno a `cuantos`.
--
-- Las columnas van NOT NULL con default '' y no aceptando NULL a propósito:
-- el índice único de abajo tiene que casar exactamente con el ON CONFLICT de
-- la función, y en SQL dos NULL nunca son iguales entre sí — con columnas
-- anulables el agrupado no agruparía nada y volveríamos a una fila por evento.
create table if not exists public.tropiezos (
  id      bigint generated always as identity primary key,
  dia     date    not null default current_date,
  version text    not null default '',
  aparato text    not null default '',
  donde   text    not null default '',   -- 'error' | 'promesa'
  mensaje text    not null,
  cuantos integer not null default 1,
  visto   boolean not null default false
);

create unique index if not exists tropiezos_unico
  on public.tropiezos (dia, version, donde, mensaje);

alter table public.tropiezos enable row level security;
-- Sin políticas: nadie lee esta tabla desde la app. Se escribe por la función
-- de abajo y se lee dentro de `metricas()`, que ya comprueba quién pregunta.
revoke all on table public.tropiezos from anon, authenticated;


-- Apuntar un tropiezo. La llama la red de seguridad de index.html.
--
-- Es la ÚNICA función de todo el proyecto que acepta a alguien sin sesión, y
-- tiene que ser así: los errores más graves son justo los que ocurren al
-- arrancar, antes de que nadie haya entrado. Un fallo que solo se pudiera
-- reportar tras iniciar sesión sería invisible precisamente cuando importa.
create or replace function public.apuntar_tropiezo(v text, ap text, dnd text, msg text)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  m_limpio text;
  v_limpio text := left(coalesce(v,   ''), 20);
  a_limpio text := left(coalesce(ap,  ''), 20);
  d_limpio text := left(coalesce(dnd, ''), 20);
  hoy      integer;
begin
  -- El mensaje se recorta a 300 caracteres por dos razones distintas y las
  -- dos importan. La primera es de privacidad: un volcado de error completo
  -- arrastra sin querer lo que había en las variables, y ahí puede ir el
  -- nombre de una misión de alguien. La segunda es mecánica: un índice único
  -- sobre texto sin límite revienta cuando el texto pasa de unos 2.700 bytes.
  m_limpio := left(coalesce(msg, ''), 300);
  if m_limpio = '' then return; end if;

  -- Tope diario. Cualquiera puede llamar a esta función sin sesión, así que
  -- cualquiera podría llenar la tabla variando el mensaje. Pasadas 500 filas
  -- en un día se dejan de crear nuevas, pero se siguen contando las que ya
  -- existen: así un ataque no borra la información de un fallo real.
  select count(*) into hoy from public.tropiezos where dia = current_date;

  if hoy >= 500 then
    update public.tropiezos
       set cuantos = cuantos + 1
     where dia = current_date and version = v_limpio
       and donde = d_limpio and mensaje = m_limpio;
    return;
  end if;

  insert into public.tropiezos (dia, version, aparato, donde, mensaje)
  values (current_date, v_limpio, a_limpio, d_limpio, m_limpio)
  on conflict (dia, version, donde, mensaje)
  do update set cuantos = public.tropiezos.cuantos + 1;
end;
$fn$;

grant execute on function public.apuntar_tropiezo(text, text, text, text)
  to anon, authenticated;


-- ============================================================
-- 3. Las métricas, en una sola llamada
-- ============================================================

-- Devuelve TOTALES, nunca filas de nadie. «23 personas activas», jamás «la
-- cuenta X abrió el martes». No es prudencia de más: es lo que permite que el
-- aviso de privacidad siga siendo verdad aunque este panel exista, y limita
-- el daño el día que algo aquí se rompa.
--
-- Todo en una llamada y no seis, porque el panel las quiere juntas y seis
-- viajes de ida y vuelta desde un teléfono se notan.
create or replace function public.metricas()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $fn$
declare
  r jsonb;
  cobro jsonb := jsonb_build_object('desplegado', false);
begin
  -- La primera línea, antes de tocar un solo dato. Todo lo que hay debajo
  -- depende de que esto pase.
  if not public.soy_admin() then
    raise exception 'Sin permiso.' using errcode = '42501';
  end if;

  -- El bloque del cobro se calcula aparte y solo si `planes.sql` está puesto.
  --
  -- Esto empezó siendo parte del jsonb de abajo y fue un error de diseño: sin
  -- `planes.sql` corrido, la consulta moría con «no existe la tabla
  -- suscripciones», PostgREST traduce ese error a un **404**, y la app lo leyó
  -- como «falta administracion.sql» — que estaba puesto. Un mensaje que acusa
  -- al archivo equivocado cuesta más que el fallo.
  --
  -- Va por EXECUTE porque una consulta escrita a pelo contra una tabla que no
  -- existe ni siquiera se puede planificar, aunque el `if` no la deje correr.
  if to_regclass('public.suscripciones') is not null then
    execute $q$
      select jsonb_build_object(
        'desplegado', true,
        'planes', coalesce((
          select jsonb_agg(x order by x.plan)
            from (select plan, estado, count(*) as personas
                    from public.suscripciones group by plan, estado) x
        ), '[]'::jsonb),
        'pagando', (select count(*) from public.suscripciones
                     where estado = 'activa'
                       and (vence_el is null or vence_el > now())),
        'mrr', coalesce((
          select round(sum(case plan
                             when 'mensual' then 69
                             when 'anual'   then 590 / 12.0
                             else 0 end))
            from public.suscripciones
           where estado = 'activa'
             and (vence_el is null or vence_el > now())
        ), 0),
        'lugares_fundador', public.lugares_fundador()
      )
    $q$ into cobro;
  end if;

  with u as (
    select id, created_at::date as alta from auth.users
  ),
  p as (
    select user_id,
           max(dia)                as ultimo,
           count(distinct dia)     as dias,
           count(distinct aparato) as aparatos,
           bool_or(instalada)      as instalo
      from public.pulsos
     group by user_id
  )
  select jsonb_build_object(
    'resumen', jsonb_build_object(
      'cuentas',       (select count(*) from u),
      'abrieron',      (select count(*) from p),
      'activos7',      (select count(distinct user_id) from public.pulsos
                         where dia >= current_date - 7),
      'activos30',     (select count(distinct user_id) from public.pulsos
                         where dia >= current_date - 30),
      'volvieron',     (select count(*) from p where dias > 1),
      'instalaron',    (select count(*) from p where instalo),
      'dos_aparatos',  (select count(*) from p where aparatos > 1),
      -- Retención a 30 días: de los que se registraron hace un mes o más,
      -- cuántos seguían apareciendo pasado ese mes. `maduros` es el divisor,
      -- y va aparte porque sin él el porcentaje no se puede calcular ni leer:
      -- «3 siguen» no significa nada si no se sabe de cuántos.
      'maduros',       (select count(*) from u where alta <= current_date - 30),
      'siguen30',      (select count(*) from u join p on p.user_id = u.id
                         where u.alta <= current_date - 30
                           and p.ultimo >= u.alta + 30)
    ),

    'dias', coalesce((
      select jsonb_agg(x order by x.dia)
        from (select dia,
                     count(*)        as personas,
                     sum(aperturas)  as aperturas
                from public.pulsos
               where dia >= current_date - 13
               group by dia) x
    ), '[]'::jsonb),

    'versiones', coalesce((
      select jsonb_agg(x order by x.personas desc)
        from (select version, count(distinct user_id) as personas
                from public.pulsos
               where dia >= current_date - 7
               group by version) x
    ), '[]'::jsonb),

    -- Ya viene calculado de arriba, y trae `desplegado: false` si el cobro
    -- todavía no existe. El MRR de ahí no cuenta a los fundadores: es pago
    -- único, y meterlo inflaría el número que sirve para saber si esto se
    -- sostiene mes a mes.
    'cobro', cobro,

    'tropiezos', coalesce((
      select jsonb_agg(x order by x.dia desc, x.cuantos desc)
        from (select dia, version, donde, mensaje, cuantos, visto
                from public.tropiezos
               where dia >= current_date - 30
               order by dia desc, cuantos desc
               limit 40) x
    ), '[]'::jsonb),

    'al_momento', now()
  ) into r;

  return r;
end;
$fn$;

revoke all on function public.metricas() from public, anon;
grant execute on function public.metricas() to authenticated;


-- Marcar los tropiezos como vistos, para que la lista no crezca sin fin
-- delante de los ojos. No los borra: un error que vuelve después de darlo por
-- visto es información, y borrarlo la perdería.
create or replace function public.tropiezos_vistos()
returns void
language plpgsql
security definer
set search_path = public, auth
as $fn$
begin
  if not public.soy_admin() then
    raise exception 'Sin permiso.' using errcode = '42501';
  end if;
  update public.tropiezos set visto = true where not visto;
end;
$fn$;

revoke all on function public.tropiezos_vistos() from public, anon;
grant execute on function public.tropiezos_vistos() to authenticated;


-- ============================================================
-- 4. El paso que falta, y que se hace a mano
-- ============================================================

-- Darte de alta como administrador. Va aparte y sin automatizar a propósito:
-- una función que convirtiera a alguien en administrador sería justo la
-- puerta que todo lo de arriba intenta cerrar.
--
-- CUIDADO AL DESCOMENTAR: más abajo hay una instrucción que QUITA el permiso.
-- Descomentar todo el bloque de golpe y darle a Run te da de alta y te vuelve
-- a quitar en la misma pasada, y el resultado parece un fallo del SQL cuando
-- en realidad hiciste las dos cosas seguidas. Ya pasó. Descomenta solo el
-- INSERT, corre, y vuelve a comentarlo.
--
-- Cambia el correo por el tuyo y corre SOLO estas tres líneas:
--
--   insert into public.administradores (user_id, nota)
--   select id, 'Eduardo' from auth.users where email = 'TU-CORREO@AQUI'
--   on conflict (user_id) do nothing;


-- ---- Cómo comprobar que quedó ----
--
-- NO uses `select public.soy_admin();` aquí: en el SQL Editor no hay ninguna
-- sesión iniciada, así que `auth.uid()` es NULL y esa función devuelve
-- **false siempre**, esté el alta bien o mal. No prueba nada y asusta.
--
-- La comprobación que sí sirve, y que se puede correr sin miedo:
--
--   select a.nota, u.email, a.desde
--     from public.administradores a
--     join auth.users u on u.id = a.user_id;
--
-- Una fila con tu correo significa que está hecho. Para verlo de verdad
-- funcionando, recarga la app con tu sesión abierta: si aparece la sección
-- «Los números» en Ajustes, el circuito entero está cerrado.


-- ---- QUITARLE EL PERMISO A ALGUIEN ----
-- Esto BORRA. No se descomenta «de paso» junto con el insert de arriba: es la
-- operación contraria y va aquí abajo, separada, para que descomentar sin
-- mirar no deshaga lo que acabas de hacer.
--
--   delete from public.administradores where user_id = (
--     select id from auth.users where email = 'CORREO@AQUI');
