-- Función RPC para actualizar el nombre de un usuario en la tabla profiles
-- Esta función ignora las políticas RLS y actualiza el nombre en la tabla profiles
CREATE OR REPLACE FUNCTION update_profile_name(user_id UUID, new_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Esto hace que la función se ejecute con los permisos del creador, no del usuario que la llama
AS $$
DECLARE
  success BOOLEAN := FALSE;
BEGIN
  -- Actualizar en la tabla profiles
  UPDATE profiles 
  SET full_name = new_name 
  WHERE id = user_id;
  
  -- Actualizar en la tabla resellers si el usuario es un revendedor
  IF EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND role = 'reseller') THEN
    -- Actualizar en la tabla resellers
    UPDATE resellers 
    SET full_name = new_name 
    WHERE id = user_id;
  END IF;
  
  success := TRUE;
  RETURN success;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error al actualizar nombre: %', SQLERRM;
    RETURN FALSE;
END;
$$;
