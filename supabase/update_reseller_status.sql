DROP FUNCTION IF EXISTS update_reseller_status(UUID, TEXT);

-- Función para actualizar el estado de un revendedor
-- Esta función actualiza el estado de un revendedor en la tabla profiles
-- Se ejecuta con privilegios elevados (SECURITY DEFINER) para saltarse las políticas RLS
CREATE OR REPLACE FUNCTION update_reseller_status(
  reseller_id UUID,
  new_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_exists BOOLEAN;
  result JSONB;
BEGIN
  -- Verificar si el perfil existe
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = reseller_id) INTO profile_exists;
  
  IF NOT profile_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'No se encontró el perfil con el ID proporcionado',
      'id', reseller_id
    );
  END IF;

  -- Actualizar el estado del perfil
  UPDATE profiles 
  SET 
    status = new_status,
    updated_at = NOW()
  WHERE id = reseller_id;

  result := jsonb_build_object(
    'success', true,
    'message', 'Estado del revendedor actualizado correctamente',
    'id', reseller_id,
    'new_status', new_status
  );
  
  RETURN result;
END;
$$;
