-- Función RPC para renovar el plan de un revendedor
-- Esta función ignora las políticas RLS y actualiza la fecha de fin del plan
DROP FUNCTION IF EXISTS renew_reseller_plan(UUID, INTEGER);

CREATE OR REPLACE FUNCTION renew_reseller_plan(
  reseller_id UUID, 
  months INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Esto hace que la función se ejecute con los permisos del creador, no del usuario que la llama
SET search_path = public
AS $$
DECLARE
  current_end_date TIMESTAMPTZ;
  new_end_date TIMESTAMPTZ;
  reseller_record RECORD;
  result JSONB;
BEGIN
  -- Verificar si existe el revendedor y obtener sus datos actuales
  SELECT * INTO reseller_record FROM resellers WHERE id = reseller_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'No se encontró el revendedor con el ID proporcionado',
      'data', NULL
    );
  END IF;
  
  -- Obtener la fecha de fin actual
  current_end_date := reseller_record.plan_end_date;
  
  -- Calcular la nueva fecha de fin
  -- Si la fecha actual ya pasó, usar la fecha actual como base
  IF current_end_date < NOW() THEN
    new_end_date := NOW() + (months || ' months')::INTERVAL;
  ELSE
    new_end_date := current_end_date + (months || ' months')::INTERVAL;
  END IF;
  
  -- Actualizar la fecha de fin del plan
  UPDATE resellers 
  SET plan_end_date = new_end_date
  WHERE id = reseller_id;
  
  -- Obtener los datos actualizados del revendedor
  SELECT * INTO reseller_record FROM resellers WHERE id = reseller_id;
  
  -- Construir el resultado
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Plan renovado correctamente',
    'data', jsonb_build_object(
      'id', reseller_record.id,
      'full_name', reseller_record.full_name,
      'email', reseller_record.email,
      'phone', reseller_record.phone,
      'plan_type', reseller_record.plan_type,
      'plan_end_date', reseller_record.plan_end_date,
      'created_at', reseller_record.created_at
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Error al renovar plan: ' || SQLERRM,
      'data', NULL
    );
END;
$$;
