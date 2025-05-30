-- Función RPC para actualizar el estado de un usuario
-- Esta función ignora las políticas RLS y actualiza el estado en las tablas profiles y resellers
CREATE OR REPLACE FUNCTION update_user_status(user_id UUID, new_status TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Esto hace que la función se ejecute con los permisos del creador, no del usuario que la llama
AS $$
DECLARE
  success BOOLEAN := FALSE;
BEGIN
  -- Actualizar en la tabla profiles
  UPDATE profiles 
  SET status = new_status 
  WHERE id = user_id;
  
  -- Verificar si el usuario es un revendedor
  IF EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND role = 'reseller') THEN
    -- Actualizar en la tabla resellers usando user_id
    UPDATE resellers 
    SET status = new_status 
    WHERE user_id = user_id;
    
    -- Actualizar en la tabla resellers usando id
    UPDATE resellers 
    SET status = new_status 
    WHERE id = user_id;
  END IF;
  
  success := TRUE;
  RETURN success;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error al actualizar estado: %', SQLERRM;
    RETURN FALSE;
END;
$$;
