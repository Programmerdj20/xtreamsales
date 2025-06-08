-- Función RPC simple para renovar el plan de un revendedor
-- Esta función ignora las políticas RLS y actualiza la fecha de fin del plan
DROP FUNCTION IF EXISTS renew_plan(UUID, INTEGER);

CREATE OR REPLACE FUNCTION renew_plan(
  reseller_id UUID, 
  months INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Esto hace que la función se ejecute con los permisos del creador, no del usuario que la llama
SET search_path = public
AS $$
DECLARE
  current_end_date TIMESTAMPTZ;
  new_end_date TIMESTAMPTZ;
BEGIN
  -- Verificar si existe el revendedor
  IF NOT EXISTS (SELECT 1 FROM resellers WHERE id = reseller_id) THEN
    RETURN FALSE;
  END IF;
  
  -- Obtener la fecha de fin actual
  SELECT plan_end_date INTO current_end_date FROM resellers WHERE id = reseller_id;
  
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
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error al renovar plan: %', SQLERRM;
    RETURN FALSE;
END;
$$;
