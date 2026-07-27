-- Tu Espacio — Paso B: catálogo de avatares
-- Correr en el SQL Editor de Supabase DESPUÉS de supabase/schema.sql (Paso A).

create table public.catalogo_avatares (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text not null check (categoria in ('capa', 'disfraz', 'accesorio')),
  model_url text,
  es_premium boolean not null default false
);

alter table public.catalogo_avatares enable row level security;

create policy "catalogo_avatares: lectura para usuarios autenticados"
  on public.catalogo_avatares for select
  to authenticated
  using (true);

-- Semilla inicial. model_url queda en NULL: todavía no hay modelos .glb subidos
-- a Supabase Storage, así que la app dibuja formas 3D simples de relleno
-- (una cápsula + color derivado del nombre) hasta que se carguen modelos reales.
insert into public.catalogo_avatares (nombre, categoria, es_premium) values
  ('Traje Clásico', 'capa', false),
  ('Superman', 'capa', true),
  ('Ninja', 'capa', false),
  ('Monje', 'disfraz', false),
  ('Rana', 'disfraz', false),
  ('Martillo de Thor', 'accesorio', true),
  ('Alas de Ángel', 'accesorio', false),
  ('Espada Mística', 'accesorio', false);
