-- Función RPC para obtener el perfil de un usuario específico
-- Esta función ignora las políticas RLS y devuelve el perfil completo de un usuario
CREATE OR REPLACE FUNCTION get_user_profile(user_id UUID)
RETURNS SETOF profiles
LANGUAGE plpgsql
SECURITY DEFINER -- Esto hace que la función se ejecute con los permisos del creador, no del usuario que la llama
AS $$
BEGIN
  -- Devolver el perfil del usuario especificado
  RETURN QUERY
  SELECT *
  FROM profiles
  WHERE id = user_id;
END;
$$;
