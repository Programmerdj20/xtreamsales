-- Función para actualizar el teléfono en la tabla profiles
CREATE OR REPLACE FUNCTION update_profile_phone(
  profile_id UUID,
  new_phone TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Esto permite que la función se ejecute con los privilegios del creador
SET search_path = public
AS $$
DECLARE
  profile_exists BOOLEAN;
  result JSONB;
BEGIN
  -- Verificar si el perfil existe
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = profile_id
  ) INTO profile_exists;
  
  -- Si el perfil existe, actualizar el teléfono
  IF profile_exists THEN
    UPDATE profiles
    SET 
      phone = new_phone,
      updated_at = NOW()
    WHERE id = profile_id;
    
    result := jsonb_build_object(
      'success', true,
      'message', 'Teléfono actualizado correctamente',
      'id', profile_id
    );
  ELSE
    -- Si no existe, devolver error
    result := jsonb_build_object(
      'success', false,
      'message', 'No se encontró el perfil con el ID proporcionado',
      'id', profile_id
    );
  END IF;
  
  RETURN result;
END $$;
