DROP FUNCTION IF EXISTS delete_reseller(UUID);

-- Función para eliminar un revendedor de forma segura
-- Esta función marca como inactivo al revendedor en profiles y elimina su registro de la tabla resellers
-- Se ejecuta con privilegios elevados (SECURITY DEFINER) para saltarse las políticas RLS
CREATE OR REPLACE FUNCTION delete_reseller(
  reseller_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reseller_exists BOOLEAN;
  result JSONB;
BEGIN
  -- Verificar si el revendedor existe
  SELECT EXISTS (
    SELECT 1 
    FROM resellers r 
    JOIN profiles p ON r.id = p.id 
    WHERE r.id = reseller_id
  ) INTO reseller_exists;
  
  IF NOT reseller_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'No se encontró el revendedor con el ID proporcionado',
      'id', reseller_id
    );
  END IF;

  -- Actualizar el estado del perfil a 'inactive'
  UPDATE profiles 
  SET 
    status = 'inactive',
    updated_at = NOW()
  WHERE id = reseller_id;

  -- Eliminar el registro de la tabla resellers
  DELETE FROM resellers WHERE id = reseller_id;

  result := jsonb_build_object(
    'success', true,
    'message', 'Revendedor eliminado correctamente',
    'id', reseller_id
  );
  
  RETURN result;
END;
$$;
