-- =====================================================
-- SOLUCIÓN FINAL: Función update_user_status
-- Problema: La tabla resellers NO tiene columna user_id
-- =====================================================

-- Eliminar función anterior
DROP FUNCTION IF EXISTS public.update_user_status(UUID, TEXT);

-- Crear función corregida sin usar user_id
CREATE OR REPLACE FUNCTION public.update_user_status(
    input_user_id UUID, 
    new_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    success BOOLEAN := FALSE;
    profiles_updated INTEGER := 0;
    resellers_updated INTEGER := 0;
    user_role TEXT;
BEGIN
    -- Log de inicio
    RAISE NOTICE 'Iniciando actualización: user_id=%, new_status=%', input_user_id, new_status;
    
    -- Obtener el rol del usuario
    SELECT role INTO user_role FROM profiles WHERE id = input_user_id;
    RAISE NOTICE 'Rol del usuario: %', user_role;
    
    -- Actualizar en la tabla profiles
    UPDATE profiles 
    SET status = new_status,
        updated_at = NOW()
    WHERE id = input_user_id;
    
    GET DIAGNOSTICS profiles_updated = ROW_COUNT;
    RAISE NOTICE 'Profiles actualizados: %', profiles_updated;
    
    IF profiles_updated = 0 THEN
        RAISE NOTICE 'ERROR: Usuario no encontrado en profiles';
        RETURN FALSE;
    END IF;
    
    -- Si es revendedor, actualizar en tabla resellers
    -- NOTA: La tabla resellers solo tiene columna "id", NO tiene "user_id"
    IF user_role = 'reseller' THEN
        RAISE NOTICE 'Es revendedor, actualizando tabla resellers...';
        
        -- Actualizar en la tabla resellers usando SOLO id
        UPDATE resellers 
        SET status = new_status,
            updated_at = NOW()
        WHERE id = input_user_id;
        
        GET DIAGNOSTICS resellers_updated = ROW_COUNT;
        RAISE NOTICE 'Resellers actualizados: %', resellers_updated;
        
        IF resellers_updated = 0 THEN
            RAISE NOTICE 'ADVERTENCIA: No se encontró registro en resellers para el usuario';
            -- No retornamos FALSE aquí porque el perfil sí se actualizó
        END IF;
    ELSE
        RAISE NOTICE 'No es revendedor, solo se actualiza profiles';
    END IF;
    
    success := TRUE;
    RAISE NOTICE 'Actualización completada exitosamente';
    RETURN success;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: % - %', SQLSTATE, SQLERRM;
        RETURN FALSE;
END;
$$;

-- Dar permisos
GRANT EXECUTE ON FUNCTION public.update_user_status(UUID, TEXT) TO anon, authenticated;

-- Comentario
COMMENT ON FUNCTION public.update_user_status IS 'Actualiza el estado de un usuario en profiles y resellers (si aplica). Versión CORREGIDA que no usa user_id.';

-- Verificar que se creó correctamente
SELECT 
    routine_name,
    routine_type,
    data_type as return_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name = 'update_user_status';

-- Mensaje final
DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Función update_user_status actualizada correctamente';
    RAISE NOTICE 'Ahora solo usa la columna ID (no user_id)';
    RAISE NOTICE '=====================================================';
END $$;