-- Tu Espacio — Paso C: sincronización en tiempo real
-- Correr en el SQL Editor de Supabase DESPUÉS de schema.sql y schema_paso_b.sql.

-- Buscar una sala por código de acceso necesita saltarse la RLS de
-- salas_3d (que solo deja ver la sala a su propio curador), porque
-- cualquier cliente con el código correcto tiene que poder unirse.
-- En vez de abrir la tabla entera (lo que dejaría listar todos los
-- códigos existentes), usamos una función SECURITY DEFINER que sólo
-- devuelve la fila que coincide exactamente con el código pedido.
create or replace function public.buscar_sala_por_codigo(codigo text)
returns table (id uuid, curador_id uuid, codigo_acceso text, estado text)
language sql
security definer
set search_path = public
as $$
  select id, curador_id, codigo_acceso, estado
  from public.salas_3d
  where codigo_acceso = codigo
  limit 1;
$$;

grant execute on function public.buscar_sala_por_codigo(text) to authenticated;
