DROP FUNCTION IF EXISTS update_reseller_plan(UUID, TEXT, TIMESTAMP WITH TIME ZONE);

-- Función para actualizar el plan de un revendedor
-- Esta función actualiza el plan_type y plan_end_date en la tabla resellers
-- Se ejecuta con privilegios elevados (SECURITY DEFINER) para saltarse las políticas RLS
CREATE OR REPLACE FUNCTION update_reseller_plan(
  reseller_id UUID,
  new_plan_type TEXT,
  new_plan_end_date TIMESTAMP WITH TIME ZONE
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
  SELECT EXISTS (SELECT 1 FROM resellers WHERE id = reseller_id) INTO reseller_exists;
  
  IF NOT reseller_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'No se encontró el revendedor con el ID proporcionado',
      'id', reseller_id
    );
  END IF;

  -- Actualizar el plan del revendedor
  UPDATE resellers 
  SET 
    plan_type = COALESCE(new_plan_type, plan_type),
    plan_end_date = COALESCE(new_plan_end_date, plan_end_date),
    updated_at = NOW()
  WHERE id = reseller_id;

  result := jsonb_build_object(
    'success', true,
    'message', 'Plan del revendedor actualizado correctamente',
    'id', reseller_id,
    'plan_type', new_plan_type,
    'plan_end_date', new_plan_end_date
  );
  
  RETURN result;
END;
$$;
