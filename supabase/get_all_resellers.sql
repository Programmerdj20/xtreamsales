-- Función RPC para obtener todos los revendedores
-- Esta función ignora las políticas RLS y devuelve todos los revendedores
CREATE OR REPLACE FUNCTION get_all_resellers()
RETURNS SETOF resellers
LANGUAGE plpgsql
SECURITY DEFINER -- Esto hace que la función se ejecute con los permisos del creador, no del usuario que la llama
AS $$
BEGIN
  -- Devolver todos los revendedores ordenados por fecha de creación
  RETURN QUERY
  SELECT *
  FROM resellers
  ORDER BY created_at DESC;
END;
$$;
