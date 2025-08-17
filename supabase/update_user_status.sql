-- Función RPC para actualizar el estado de un usuario
-- Esta función ignora las políticas RLS y actualiza el estado en las tablas profiles y resellers
CREATE OR REPLACE FUNCTION update_user_status(input_user_id UUID, new_status TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Esto hace que la función se ejecute con los permisos del creador, no del usuario que la llama
AS $$
DECLARE
  success BOOLEAN := FALSE;
  profiles_updated INTEGER := 0;
  resellers_updated INTEGER := 0;
BEGIN
  -- Actualizar en la tabla profiles
  UPDATE profiles 
  SET status = new_status 
  WHERE id = input_user_id;
  
  GET DIAGNOSTICS profiles_updated = ROW_COUNT;
  RAISE NOTICE 'Profiles actualizados: %', profiles_updated;
  
  -- Verificar si el usuario es un revendedor
  IF EXISTS (SELECT 1 FROM profiles WHERE id = input_user_id AND role = 'reseller') THEN
    -- Actualizar en la tabla resellers usando user_id
    UPDATE resellers 
    SET status = new_status 
    WHERE user_id = input_user_id;
    
    GET DIAGNOSTICS resellers_updated = ROW_COUNT;
    RAISE NOTICE 'Resellers actualizados por user_id: %', resellers_updated;
    
    -- Actualizar en la tabla resellers usando id
    UPDATE resellers 
    SET status = new_status 
    WHERE id = input_user_id;
    
    GET DIAGNOSTICS resellers_updated = ROW_COUNT;
    RAISE NOTICE 'Resellers actualizados por id: %', resellers_updated;
  END IF;
  
  success := TRUE;
  RETURN success;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error al actualizar estado: %', SQLERRM;
    RETURN FALSE;
END;
$$;
