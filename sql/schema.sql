-- Esquema para la invitación de Karina & Guillermo.
-- Ya se aplicó a mano contra el proyecto de Supabase de esta invitación
-- (karina-guillermo-invitacion). Este archivo queda en el repo para poder
-- recrear la tabla si alguna vez armás el proyecto desde cero.
--
-- Cómo correrlo: pegalo en el SQL editor de tu proyecto Supabase, o
-- psql "$DATABASE_URL" -f sql/schema.sql si te conectás directo por Postgres.

create table if not exists rsvps (
  id bigint generated always as identity primary key,
  nombre text not null,
  asiste boolean not null,
  acompanantes integer not null default 0,
  mensaje text,
  created_at timestamptz not null default now()
);

create index if not exists rsvps_created_at_idx on rsvps (created_at desc);

-- La app llega a Postgres a través del cliente de Supabase (clave anon
-- pública), así que Row Level Security es lo que de verdad protege la tabla.
alter table rsvps enable row level security;

-- Cualquiera puede confirmar asistencia (insertar), pero nadie puede leer
-- la lista de invitados con la clave pública (anon) — ni siquiera lo que
-- acaba de insertar. Para ver las confirmaciones, usar el Table Editor de
-- Supabase o el SQL editor con tu propia cuenta (eso sí tiene permisos).
-- Nota: CREATE POLICY no soporta IF NOT EXISTS; si ya existe, borrala antes
-- (drop policy "cualquiera puede confirmar" on rsvps;) o cambiale el nombre.
create policy "cualquiera puede confirmar" on rsvps
  for insert to anon
  with check (true);
