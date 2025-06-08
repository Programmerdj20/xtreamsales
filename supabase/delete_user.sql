DROP FUNCTION IF EXISTS delete_user(UUID);

-- Función para eliminar un usuario de forma segura
-- Esta función elimina un usuario de las tablas profiles y resellers
-- Se ejecuta con privilegios elevados (SECURITY DEFINER) para saltarse las políticas RLS
CREATE OR REPLACE FUNCTION delete_user(
  user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_reseller BOOLEAN;
  result JSONB;
BEGIN
  -- Verificar si el usuario existe
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = user_id) THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Usuario no encontrado', 
      'id', user_id
    );
  END IF;

  -- Verificar si es un revendedor
  SELECT (role = 'reseller') INTO is_reseller FROM profiles WHERE id = user_id;

  -- Si es revendedor, eliminar de la tabla resellers
  IF is_reseller THEN
    DELETE FROM resellers WHERE id = user_id;
  END IF;

  -- Eliminar de la tabla profiles
  DELETE FROM profiles WHERE id = user_id;

  -- No podemos eliminar directamente de auth.users desde una función SQL
  -- El frontend debe manejar esto con una llamada separada a la API de Auth
  
  result := jsonb_build_object(
    'success', true, 
    'message', 'Usuario eliminado correctamente de las tablas de la base de datos', 
    'id', user_id,
    'was_reseller', is_reseller
  );
  
  RETURN result;
END;
$$;
