-- Función para obtener todos los revendedores combinando datos de resellers y profiles
-- Esta función ignora las políticas RLS y devuelve datos combinados
DROP FUNCTION IF EXISTS get_all_resellers();

CREATE OR REPLACE FUNCTION get_all_resellers()
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
  phone TEXT,
  plan_type TEXT,
  plan_end_date TIMESTAMPTZ,
  full_name TEXT,
  email TEXT,
  status TEXT,
  role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER -- Esto hace que la función se ejecute con los permisos del creador, no del usuario que la llama
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.created_at,
    r.phone,
    r.plan_type,
    r.plan_end_date,
    p.full_name,
    p.email,
    p.status,
    p.role
  FROM 
    resellers r
    JOIN profiles p ON r.id = p.id
  WHERE 
    p.role = 'reseller'
  ORDER BY r.created_at DESC;
  
  -- Si no hay resultados, registrar un mensaje
  IF NOT FOUND THEN
    RAISE NOTICE 'No se encontraron revendedores';
  END IF;
END;
$$;
