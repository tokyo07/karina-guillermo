-- Álbum colaborativo de la boda (ruta /album).
-- Las fotos viven en Cloudinary; acá solo se guardan los datos de cada foto,
-- los corazones y quiénes son los novios.
--
-- Cómo correrlo: pegarlo completo en el SQL editor del proyecto Supabase de
-- la invitación (karina-guillermo-invitacion). Es idempotente: se puede volver
-- a correr sin romper nada.
--
-- Modelo de seguridad:
--   * anon NO escribe directo en ninguna tabla. Subir foto y dar corazón pasan
--     por funciones SECURITY DEFINER que validan todo y limitan abuso.
--   * anon solo puede LEER fotos ni ocultas ni por revisar (necesario para Realtime).
--
-- Todo corre en una transacción: si algo falla, no queda nada a medias.

begin;
--   * Los novios son usuarios de Supabase Auth registrados en la tabla
--     `novios`. Solo ellos ven las ocultas y pueden ocultar/mostrar.
--     Estar "autenticado" no alcanza: hay que estar en `novios`.

-- ─────────────────────────── tablas ───────────────────────────

create table if not exists public.fotos (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique,          -- id de la imagen en Cloudinary
  ancho integer not null check (ancho between 1 and 4000),
  alto integer not null check (alto between 1 and 4000),
  nombre text not null check (char_length(nombre) between 1 and 40),
  momento text not null check (momento in ('ceremonia', 'recepcion', 'fiesta', 'horaloca')),
  reto text check (reto is null or char_length(reto) <= 80),
  oculta boolean not null default false,
  creada_en timestamptz not null default now()
);
create index if not exists fotos_creada_en_idx on public.fotos (creada_en desc);

-- Filtro de calidad: el teléfono mide cada foto antes de subirla. Si parece
-- tomada sin querer (borrosa, negra, quemada, lisa o repetida), llega con
-- `revisar = true` y no se muestra a los invitados hasta que los novios o el
-- moderador la aprueben. `calidad` guarda las medidas para ajustar umbrales.
alter table public.fotos add column if not exists revisar boolean not null default false;
alter table public.fotos add column if not exists motivo text
  check (motivo is null or motivo in ('borrosa', 'oscura', 'quemada', 'lisa', 'repetida'));
alter table public.fotos add column if not exists calidad jsonb
  check (calidad is null or (jsonb_typeof(calidad) = 'object' and pg_column_size(calidad) < 2000));

-- Qué dispositivo subió cada foto. Separado de `fotos` para que el id de
-- dispositivo nunca viaje a otros invitados (ni por API ni por Realtime).
create table if not exists public.subidas (
  foto_id uuid primary key references public.fotos (id) on delete cascade,
  dispositivo uuid not null,
  creada_en timestamptz not null default now()
);
create index if not exists subidas_dispositivo_idx on public.subidas (dispositivo, creada_en desc);

-- Un corazón por foto y dispositivo: no se pierden votos concurrentes y no
-- se puede inflar el contador desde un mismo teléfono.
create table if not exists public.corazones (
  foto_id uuid not null references public.fotos (id) on delete cascade,
  dispositivo uuid not null,
  creado_en timestamptz not null default now(),
  primary key (foto_id, dispositivo)
);

create table if not exists public.novios (
  user_id uuid primary key references auth.users (id) on delete cascade
);

-- Fila única con los ajustes del álbum.
create table if not exists public.album_ajustes (
  id boolean primary key default true check (id),
  subidas_abiertas boolean not null default true,
  max_subidas_por_hora integer not null default 60
);
insert into public.album_ajustes (id) values (true) on conflict (id) do nothing;

-- Momento que se vive ahora (lo cambian los novios o el moderador desde el
-- panel). Define el ambiente de todos los teléfonos: colores, retos y la
-- etiqueta que se propone al subir.
alter table public.album_ajustes
  add column if not exists momento_actual text not null default 'ceremonia';

-- Momentos válidos (fotos y ajustes). "horaloca" se agregó después: se
-- reemplazan los checks para que una base ya creada también lo acepte.
alter table public.fotos drop constraint if exists fotos_momento_check;
alter table public.fotos add constraint fotos_momento_check
  check (momento in ('ceremonia', 'recepcion', 'fiesta', 'horaloca'));
alter table public.album_ajustes drop constraint if exists album_ajustes_momento_actual_check;
alter table public.album_ajustes add constraint album_ajustes_momento_actual_check
  check (momento_actual in ('ceremonia', 'recepcion', 'fiesta', 'horaloca'));

-- ─────────────────────────── permisos ───────────────────────────
-- Supabase da por defecto todos los privilegios de las tablas nuevas a anon y
-- authenticated. Se quitan y se otorga solo lo necesario.

revoke all on public.fotos, public.subidas, public.corazones, public.novios, public.album_ajustes
  from anon, authenticated;

grant select on public.fotos to anon, authenticated;
grant update (oculta, revisar) on public.fotos to authenticated;
grant select on public.novios to authenticated;

alter table public.fotos enable row level security;
alter table public.subidas enable row level security;
alter table public.corazones enable row level security;
alter table public.novios enable row level security;
alter table public.album_ajustes enable row level security;

create or replace function public.es_novio()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.novios where user_id = auth.uid());
$$;

drop policy if exists "ver fotos visibles" on public.fotos;
create policy "ver fotos visibles" on public.fotos
  for select to anon, authenticated
  using ((oculta = false and revisar = false) or (select public.es_novio()));

drop policy if exists "novios moderan" on public.fotos;
create policy "novios moderan" on public.fotos
  for update to authenticated
  using ((select public.es_novio()))
  with check ((select public.es_novio()));

drop policy if exists "cada novio se ve a sí mismo" on public.novios;
create policy "cada novio se ve a sí mismo" on public.novios
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Los ajustes no son secretos: cualquiera los lee (hace falta para que el
-- cambio de momento llegue por Realtime). Solo se cambian con fijar_momento().
grant select on public.album_ajustes to anon, authenticated;
drop policy if exists "ver ajustes" on public.album_ajustes;
create policy "ver ajustes" on public.album_ajustes
  for select to anon, authenticated
  using (true);

-- subidas y corazones no tienen políticas: con RLS activo y sin grants, solo
-- se accede a través de las funciones de abajo.

-- ─────────────────────────── funciones ───────────────────────────

-- Registra una foto ya subida a Cloudinary. `p_motivo` no nulo = foto dudosa
-- (queda por revisar). Se borra la versión anterior sin filtro de calidad.
drop function if exists public.subir_foto(text, integer, integer, text, text, text, uuid);
create or replace function public.subir_foto(
  p_public_id text,
  p_ancho integer,
  p_alto integer,
  p_nombre text,
  p_momento text,
  p_reto text,
  p_dispositivo uuid,
  p_motivo text default null,
  p_calidad jsonb default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_ajustes public.album_ajustes;
  v_recientes integer;
  v_id uuid;
begin
  select * into v_ajustes from public.album_ajustes where id;
  if not v_ajustes.subidas_abiertas then
    raise exception 'album_cerrado' using errcode = 'P0001';
  end if;

  if p_public_id is null or p_public_id !~ '^[A-Za-z0-9_/-]{1,200}$' or p_public_id like '%..%' then
    raise exception 'public_id_invalido' using errcode = '22023';
  end if;
  if p_dispositivo is null then
    raise exception 'dispositivo_requerido' using errcode = '22023';
  end if;

  select count(*) into v_recientes
  from public.subidas
  where dispositivo = p_dispositivo and creada_en > now() - interval '1 hour';
  if v_recientes >= v_ajustes.max_subidas_por_hora then
    raise exception 'limite_por_hora' using errcode = 'P0001';
  end if;

  insert into public.fotos (public_id, ancho, alto, nombre, momento, reto, revisar, motivo, calidad)
  values (p_public_id, p_ancho, p_alto, btrim(p_nombre), p_momento, nullif(btrim(p_reto), ''),
          p_motivo is not null, p_motivo, p_calidad)
  returning id into v_id;

  insert into public.subidas (foto_id, dispositivo) values (v_id, p_dispositivo);
  return v_id;
end;
$$;

-- Lista para el mural con el conteo de corazones y si este dispositivo ya
-- dio corazón. Los invitados solo reciben las visibles (ni ocultas ni por
-- revisar); los novios, todas. Cambió el tipo de retorno: se borra y se crea.
drop function if exists public.listar_fotos(uuid);
create function public.listar_fotos(p_dispositivo uuid default null)
returns table (
  id uuid,
  public_id text,
  ancho integer,
  alto integer,
  nombre text,
  momento text,
  reto text,
  oculta boolean,
  revisar boolean,
  motivo text,
  creada_en timestamptz,
  corazones bigint,
  mi_corazon boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select f.id, f.public_id, f.ancho, f.alto, f.nombre, f.momento, f.reto, f.oculta, f.revisar, f.motivo, f.creada_en,
         (select count(*) from public.corazones c where c.foto_id = f.id),
         exists (select 1 from public.corazones c
                 where c.foto_id = f.id and c.dispositivo = p_dispositivo)
  from public.fotos f
  where (f.oculta = false and f.revisar = false) or public.es_novio()
  order by f.creada_en desc;
$$;

-- Da o quita el corazón de este dispositivo. Devuelve el estado y el total.
create or replace function public.alternar_corazon(p_foto uuid, p_dispositivo uuid)
returns table (mi_corazon boolean, corazones bigint)
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if p_dispositivo is null then
    raise exception 'dispositivo_requerido' using errcode = '22023';
  end if;
  if not exists (select 1 from public.fotos f where f.id = p_foto and f.oculta = false and f.revisar = false) then
    raise exception 'foto_no_encontrada' using errcode = 'P0002';
  end if;

  delete from public.corazones c where c.foto_id = p_foto and c.dispositivo = p_dispositivo;
  if found then
    mi_corazon := false;
  else
    insert into public.corazones (foto_id, dispositivo) values (p_foto, p_dispositivo)
    on conflict do nothing;
    mi_corazon := true;
  end if;
  select count(*) into corazones from public.corazones c where c.foto_id = p_foto;
  return next;
end;
$$;

revoke all on function public.es_novio() from public;
revoke all on function public.subir_foto(text, integer, integer, text, text, text, uuid, text, jsonb) from public;
revoke all on function public.listar_fotos(uuid) from public;
revoke all on function public.alternar_corazon(uuid, uuid) from public;
grant execute on function public.es_novio() to anon, authenticated;
grant execute on function public.subir_foto(text, integer, integer, text, text, text, uuid, text, jsonb) to anon, authenticated;
grant execute on function public.listar_fotos(uuid) to anon, authenticated;
grant execute on function public.alternar_corazon(uuid, uuid) to anon, authenticated;

-- Cambia el momento de toda la boda. Solo novios (y moderadores en `novios`).
create or replace function public.fijar_momento(p_momento text)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not public.es_novio() then
    raise exception 'solo_novios' using errcode = '42501';
  end if;
  if p_momento is null or p_momento not in ('ceremonia', 'recepcion', 'fiesta', 'horaloca') then
    raise exception 'momento_invalido' using errcode = '22023';
  end if;
  update public.album_ajustes set momento_actual = p_momento where id;
  return p_momento;
end;
$$;

revoke all on function public.fijar_momento(text) from public;
grant execute on function public.fijar_momento(text) to authenticated;

-- ─────────────────────────── Realtime ───────────────────────────
-- El mural y el proyector escuchan los INSERT de `fotos` (Realtime respeta la
-- política de lectura: los invitados no reciben fotos ocultas).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'fotos'
  ) then
    alter publication supabase_realtime add table public.fotos;
  end if;
  -- Los teléfonos escuchan los UPDATE de album_ajustes para cambiar de ambiente.
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'album_ajustes'
  ) then
    alter publication supabase_realtime add table public.album_ajustes;
  end if;
end;
$$;

commit;

-- ─────────────────────────── alta de los novios ───────────────────────────
-- 1. Authentication → Users → "Add user" con el correo de los novios y una
--    contraseña (marcar "Auto Confirm User").
-- 2. Authentication → Sign In / Providers → desactivar "Allow new users to sign up".
-- 3. Correr, con el correo real:
--      insert into public.novios (user_id)
--      select id from auth.users where email = 'CORREO_DE_LOS_NOVIOS'
--      on conflict do nothing;
--    El moderador (un amigo) se da de alta igual, con su propio correo: entra
--    al mismo panel sin usar la contraseña de los novios.
--
-- Cerrar las subidas después de la boda:
--      update public.album_ajustes set subidas_abiertas = false;
