-- Función RPC para obtener todos los perfiles de usuarios
-- Esta función ignora las políticas RLS y devuelve todos los perfiles
CREATE OR REPLACE FUNCTION get_all_profiles()
RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER -- Esto hace que la función se ejecute con los permisos del creador, no del usuario que la llama
AS $$
BEGIN
  -- Devolver todos los perfiles ordenados por fecha de creación
  RETURN QUERY
  SELECT *
  FROM profiles
  ORDER BY created_at DESC;
END;
$$;
