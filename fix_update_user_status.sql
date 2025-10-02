-- Eliminar la función anterior si existe
DROP FUNCTION IF EXISTS public.update_user_status(UUID, TEXT);

-- Recrear la función con logging mejorado
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
    
    -- Verificar si el usuario es un revendedor y actualizar
    IF user_role = 'reseller' THEN
        RAISE NOTICE 'Es revendedor, actualizando tabla resellers...';
        
        -- Actualizar en la tabla resellers usando user_id
        UPDATE resellers 
        SET status = new_status,
            updated_at = NOW()
        WHERE user_id = input_user_id;
        
        GET DIAGNOSTICS resellers_updated = ROW_COUNT;
        RAISE NOTICE 'Resellers actualizados por user_id: %', resellers_updated;
        
        -- Actualizar en la tabla resellers usando id también por si acaso
        UPDATE resellers 
        SET status = new_status,
            updated_at = NOW()
        WHERE id = input_user_id;
        
        GET DIAGNOSTICS resellers_updated = ROW_COUNT;
        RAISE NOTICE 'Resellers actualizados por id: %', resellers_updated;
    ELSE
        RAISE NOTICE 'No es revendedor, no se actualiza tabla resellers';
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
COMMENT ON FUNCTION public.update_user_status IS 'Actualiza el estado de un usuario en profiles y resellers (si aplica). Versión corregida con logging mejorado.';

-- Verificar que la función fue creada
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name = 'update_user_status';