-- Tu Espacio — Paso E: permisos, onboarding y preparación EAS
-- Correr en el SQL Editor de Supabase DESPUÉS de schema.sql, schema_paso_b.sql,
-- schema_paso_c.sql y schema_paso_d.sql.

-- 1. Foto de perfil
alter table public.profiles add column foto_url text;

-- El Paso D dejó profiles.avatar_config como la única columna editable
-- por el propio usuario. Ahora que hay foto de perfil, se vuelve a
-- otorgar el UPDATE incluyendo foto_url (los grants de columna son
-- acumulativos, esto no reabre role/exento_pago/email).
grant update (avatar_config, foto_url) on public.profiles to authenticated;

-- 2. Bucket de Storage para las fotos de perfil (lectura pública, cada
-- usuario solo puede escribir dentro de su propia carpeta "<user_id>/...").
insert into storage.buckets (id, name, public)
values ('fotos-perfil', 'fotos-perfil', true)
on conflict (id) do nothing;

create policy "fotos-perfil: lectura publica"
  on storage.objects for select
  using (bucket_id = 'fotos-perfil');

create policy "fotos-perfil: el usuario sube su propia foto"
  on storage.objects for insert
  with check (
    bucket_id = 'fotos-perfil'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "fotos-perfil: el usuario actualiza su propia foto"
  on storage.objects for update
  using (
    bucket_id = 'fotos-perfil'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "fotos-perfil: el usuario borra su propia foto"
  on storage.objects for delete
  using (
    bucket_id = 'fotos-perfil'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
