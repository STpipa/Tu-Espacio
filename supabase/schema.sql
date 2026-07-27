-- Tu Espacio — Paso A: Autenticación y roles
-- Correr este script en el SQL Editor de Supabase (proyecto nuevo, tier free sirve).

-- 1. Rol de usuario
create type public.user_role as enum ('super_admin', 'curador', 'cliente');

-- 2. Perfiles (uno por usuario de auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role public.user_role not null default 'cliente',
  exento_pago boolean not null default false,
  avatar_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: el usuario ve su propio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: el usuario actualiza su propio perfil"
  on public.profiles for update
  using (auth.uid() = id);

-- 3. Crear el perfil automáticamente cuando alguien se registra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Salas 3D (para el panel de creación de salas del curador)
create table public.salas_3d (
  id uuid primary key default gen_random_uuid(),
  curador_id uuid not null references public.profiles (id) on delete cascade,
  codigo_acceso text not null unique,
  estado text not null default 'esperando',
  created_at timestamptz not null default now()
);

alter table public.salas_3d enable row level security;

create policy "salas_3d: el curador ve sus propias salas"
  on public.salas_3d for select
  using (auth.uid() = curador_id);

create policy "salas_3d: el curador crea sus propias salas"
  on public.salas_3d for insert
  with check (auth.uid() = curador_id);

create policy "salas_3d: el curador actualiza sus propias salas"
  on public.salas_3d for update
  using (auth.uid() = curador_id);

-- 5. Para convertir a alguien en curador o super_admin (correr manualmente):
-- update public.profiles set role = 'curador' where email = 'curador@ejemplo.com';
-- update public.profiles set role = 'super_admin', exento_pago = true where email = 'admin@ejemplo.com';
