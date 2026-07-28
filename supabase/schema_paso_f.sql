-- Tu Espacio — Paso F: bucket de Storage para los modelos .glb del catálogo
-- de avatares. Correr en el SQL Editor de Supabase DESPUÉS de schema_paso_e.sql.

insert into storage.buckets (id, name, public)
values ('modelos-avatares', 'modelos-avatares', true)
on conflict (id) do nothing;

create policy "modelos-avatares: lectura publica"
  on storage.objects for select
  using (bucket_id = 'modelos-avatares');

-- A diferencia de fotos-perfil, este bucket no es "por usuario": es
-- contenido curado y compartido por toda la app (el catálogo de
-- avatares), así que no tiene sentido restringir el insert a una carpeta
-- con el propio auth.uid(). Por ahora, mientras el catálogo lo carga a
-- mano el propio desarrollador con una cuenta de prueba, alcanza con
-- exigir estar autenticado. Ojo: esto deja que CUALQUIER usuario logueado
-- pueda subir/pisar modelos del catálogo — conviene restringirlo a
-- super_admin (o sacarlo del todo y subir solo desde el dashboard) antes
-- de que la app tenga usuarios reales de verdad.
create policy "modelos-avatares: usuarios autenticados pueden subir"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'modelos-avatares');
