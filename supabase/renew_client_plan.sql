-- Función RPC para renovar el plan de un cliente
-- Esta función suma los meses del nuevo plan a la fecha de vencimiento actual
DROP FUNCTION IF EXISTS renew_client_plan(UUID, INTEGER);
DROP FUNCTION IF EXISTS renew_client_plan(UUID, INTEGER, TEXT);

CREATE OR REPLACE FUNCTION renew_client_plan(
  client_id UUID,
  months INTEGER,
  plan_name TEXT
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
  -- Verificar si existe el cliente
  IF NOT EXISTS (SELECT 1 FROM clients WHERE id = client_id) THEN
    RETURN FALSE;
  END IF;

  -- Obtener la fecha de fin actual
  SELECT fecha_fin INTO current_end_date FROM clients WHERE id = client_id;

  -- Calcular la nueva fecha de fin
  -- Si la fecha actual ya pasó, usar la fecha actual como base
  IF current_end_date < NOW() THEN
    new_end_date := NOW() + (months || ' months')::INTERVAL;
  ELSE
    new_end_date := current_end_date + (months || ' months')::INTERVAL;
  END IF;

  -- Actualizar la fecha de fin, el status y el nombre del plan
  UPDATE clients
  SET fecha_fin = new_end_date,
      status = 'active',
      plan = plan_name
  WHERE id = client_id;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error al renovar plan de cliente: %', SQLERRM;
    RETURN FALSE;
END;
$$;
