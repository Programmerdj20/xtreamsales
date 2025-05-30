-- Función para crear un revendedor (bypass RLS)
CREATE OR REPLACE FUNCTION create_reseller(
  user_id UUID,
  user_email TEXT,
  user_full_name TEXT,
  user_phone TEXT DEFAULT '',
  user_plan_type TEXT DEFAULT 'basic',
  user_status TEXT DEFAULT 'pending',
  user_plan_end_date TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Esto permite que la función se ejecute con los privilegios del creador
SET search_path = public
AS $$
DECLARE
  reseller_exists BOOLEAN;
  result JSONB;
BEGIN
  -- Verificar si el revendedor ya existe
  SELECT EXISTS (
    SELECT 1 FROM resellers WHERE id = user_id
  ) INTO reseller_exists;
  
  -- Si el revendedor ya existe, actualizarlo
  IF reseller_exists THEN
    UPDATE resellers
    SET 
      email = user_email,
      full_name = user_full_name,
      phone = user_phone,
      plan_type = user_plan_type,
      status = user_status,
      plan_end_date = user_plan_end_date,
      updated_at = NOW()
    WHERE id = user_id;
    
    result := jsonb_build_object(
      'success', true,
      'message', 'Revendedor actualizado correctamente',
      'id', user_id
    );
  -- Si no existe, crearlo
  ELSE
    INSERT INTO resellers (id, user_id, email, full_name, phone, plan_type, status, plan_end_date, created_at)
    VALUES (user_id, user_id, user_email, user_full_name, user_phone, user_plan_type, user_status, user_plan_end_date, NOW());
    
    result := jsonb_build_object(
      'success', true,
      'message', 'Revendedor creado correctamente',
      'id', user_id
    );
  END IF;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Error al crear/actualizar el revendedor: ' || SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;
