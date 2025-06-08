DROP FUNCTION IF EXISTS search_resellers(TEXT);

-- Función para buscar revendedores por nombre o email
-- Esta función busca revendedores por nombre o email ignorando las políticas RLS
-- Se ejecuta con privilegios elevados (SECURITY DEFINER) para saltarse las políticas RLS
CREATE OR REPLACE FUNCTION search_resellers(
  search_query TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  resellers_data JSONB;
BEGIN
  -- Buscar revendedores por nombre o email
  SELECT 
    jsonb_agg(
      jsonb_build_object(
        'id', r.id,
        'full_name', r.full_name,
        'email', r.email,
        'phone', r.phone,
        'plan_type', r.plan_type,
        'plan_end_date', r.plan_end_date,
        'created_at', r.created_at,
        'updated_at', r.updated_at,
        'status', p.status,
        'role', p.role
      )
    )
  INTO resellers_data
  FROM resellers r
  JOIN profiles p ON r.id = p.id
  WHERE 
    r.full_name ILIKE '%' || search_query || '%' OR 
    r.email ILIKE '%' || search_query || '%';

  -- Si no se encontraron revendedores, devolver un array vacío
  IF resellers_data IS NULL THEN
    resellers_data := '[]'::jsonb;
  END IF;

  result := jsonb_build_object(
    'success', true,
    'data', resellers_data
  );
  
  RETURN result;
END;
$$;
