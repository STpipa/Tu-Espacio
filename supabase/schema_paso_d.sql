-- Tu Espacio — Paso D: monetización y bypass de pagos
-- Correr en el SQL Editor de Supabase DESPUÉS de schema.sql, schema_paso_b.sql
-- y schema_paso_c.sql.

-- 1. Fix de seguridad encontrado durante las pruebas del Paso C: la RLS de
-- profiles dejaba que cualquier usuario cambiara su PROPIO role o
-- exento_pago desde el cliente (la política de UPDATE solo mira
-- auth.uid() = id, no qué columnas se tocan). Como el Paso D depende de
-- que esos dos campos sean confiables, se restringe a nivel de columna:
-- los usuarios autenticados solo pueden editar avatar_config de su
-- propio perfil. Esto no afecta al Table Editor de Supabase (usa un rol
-- con más privilegios, no "authenticated").
revoke update on public.profiles from authenticated;
grant update (avatar_config) on public.profiles to authenticated;

-- 2. Registro de asistencias, para el límite de 2 sesiones gratis/mes de
-- los clientes. Un unique(cliente_id, fecha_asistencia) hace que
-- reconectarse el mismo día a la misma sala (o a otra) no gaste una
-- segunda "asistencia" — ya quedó registrado el día.
create table public.sesiones_uso (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.profiles (id) on delete cascade,
  fecha_asistencia date not null default current_date,
  unique (cliente_id, fecha_asistencia)
);

alter table public.sesiones_uso enable row level security;

create policy "sesiones_uso: el cliente ve sus propias asistencias"
  on public.sesiones_uso for select
  using (auth.uid() = cliente_id);

create policy "sesiones_uso: el cliente registra su propia asistencia"
  on public.sesiones_uso for insert
  with check (auth.uid() = cliente_id);
