-- Función RPC para actualizar información adicional del revendedor
-- Esta función ignora las políticas RLS y actualiza campos específicos en la tabla resellers
CREATE OR REPLACE FUNCTION update_reseller_info(
  reseller_id UUID, 
  reseller_phone TEXT,
  reseller_plan_type TEXT,
  reseller_plan_end_date TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Esto hace que la función se ejecute con los permisos del creador, no del usuario que la llama
AS $$
DECLARE
  success BOOLEAN := FALSE;
BEGIN
  -- Verificar si existe el revendedor
  IF EXISTS (SELECT 1 FROM resellers WHERE id = reseller_id) THEN
    -- Actualizar campos existentes
    UPDATE resellers 
    SET 
      phone = reseller_phone,
      plan_type = reseller_plan_type,
      plan_end_date = reseller_plan_end_date,
      updated_at = NOW()
    WHERE id = reseller_id;
  ELSE
    -- Insertar nuevo revendedor
    INSERT INTO resellers (
      id,
      phone,
      plan_type,
      plan_end_date,
      created_at
    ) VALUES (
      reseller_id,
      reseller_phone,
      reseller_plan_type,
      reseller_plan_end_date,
      NOW()
    );
  END IF;
  
  success := TRUE;
  RETURN success;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error al actualizar revendedor: %', SQLERRM;
    RETURN FALSE;
END;
$$;
