-- Función para obtener los meses de un plan por su nombre
CREATE OR REPLACE FUNCTION get_plan_months(plan_name TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  plan_months INTEGER;
BEGIN
  -- Obtener los meses del plan por nombre
  SELECT months INTO plan_months
  FROM subscription_plans
  WHERE name = plan_name
  LIMIT 1;

  -- Si no se encuentra el plan, retornar 1 mes por defecto
  IF plan_months IS NULL THEN
    RETURN 1;
  END IF;

  RETURN plan_months;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error al obtener meses del plan: %', SQLERRM;
    RETURN 1;
END;
$$;