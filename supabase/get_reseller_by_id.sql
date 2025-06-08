DROP FUNCTION IF EXISTS get_reseller_by_id(UUID);

-- Función para obtener un revendedor por su ID combinando datos de resellers y profiles
-- Esta función ignora las políticas RLS y devuelve los datos combinados
CREATE OR REPLACE FUNCTION get_reseller_by_id(
  reseller_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reseller_data JSONB;
BEGIN
  -- Obtener datos combinados de resellers y profiles
  SELECT 
    jsonb_build_object(
      'id', r.id,
      'created_at', r.created_at,
      'phone', r.phone,
      'plan_type', r.plan_type,
      'plan_end_date', r.plan_end_date,
      'full_name', p.full_name,
      'email', p.email,
      'status', p.status,
      'role', p.role
    ) INTO reseller_data
  FROM 
    resellers r
    JOIN profiles p ON r.id = p.id
  WHERE 
    r.id = reseller_id;
  
  IF reseller_data IS NULL THEN
    RAISE EXCEPTION 'No se encontró el revendedor con ID %', reseller_id;
  END IF;
  
  RETURN reseller_data;
END;
$$;
