-- Esquema para la invitación de Karina & Guillermo.
-- Ejecutar una sola vez contra tu base de datos Postgres
-- (psql "$DATABASE_URL" -f sql/schema.sql), o pegarlo en el SQL editor
-- de Supabase / Neon / Vercel Postgres.

create table if not exists rsvps (
  id bigint generated always as identity primary key,
  nombre text not null,
  asiste boolean not null,
  acompanantes integer not null default 0,
  mensaje text,
  created_at timestamptz not null default now()
);

create index if not exists rsvps_created_at_idx on rsvps (created_at desc);
