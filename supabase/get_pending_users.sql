-- Función RPC para obtener usuarios pendientes
-- Esta función ignora las políticas RLS y devuelve todos los usuarios pendientes
CREATE OR REPLACE FUNCTION get_pending_users()
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER -- Esto hace que la función se ejecute con los permisos del creador, no del usuario que la llama
AS $$
BEGIN
  -- Devolver todos los usuarios pendientes
  RETURN QUERY
  SELECT json_build_object(
    'id', p.id,
    'email', p.email,
    'full_name', p.full_name,
    'status', p.status,
    'created_at', p.created_at
  )
  FROM profiles p
  WHERE p.status = 'pending';
END;
$$;
