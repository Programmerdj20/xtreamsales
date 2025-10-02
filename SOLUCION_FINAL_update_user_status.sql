-- ============================================================
-- SOLUCIÓN FINAL DEFINITIVA
-- Actualiza estado solo en profiles y resellers usando solo ID
-- ============================================================

DROP FUNCTION IF EXISTS public.update_user_status(UUID, TEXT);

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
    profiles_updated INTEGER := 0;
    resellers_updated INTEGER := 0;
    user_role TEXT;
BEGIN
    RAISE NOTICE '=== Iniciando update_user_status ===';
    RAISE NOTICE 'User ID: %', input_user_id;
    RAISE NOTICE 'Nuevo estado: %', new_status;
    
    -- 1. Actualizar en profiles
    UPDATE profiles 
    SET status = new_status
    WHERE id = input_user_id;
    
    GET DIAGNOSTICS profiles_updated = ROW_COUNT;
    RAISE NOTICE 'Perfiles actualizados: %', profiles_updated;
    
    IF profiles_updated = 0 THEN
        RAISE NOTICE 'ERROR: Usuario no encontrado en profiles';
        RETURN FALSE;
    END IF;
    
    -- 2. Obtener rol
    SELECT role INTO user_role 
    FROM profiles 
    WHERE id = input_user_id;
    
    RAISE NOTICE 'Rol del usuario: %', user_role;
    
    -- 3. Si es revendedor, actualizar en resellers
    IF user_role = 'reseller' THEN
        RAISE NOTICE 'Actualizando en tabla resellers...';
        
        UPDATE resellers 
        SET status = new_status
        WHERE id = input_user_id;
        
        GET DIAGNOSTICS resellers_updated = ROW_COUNT;
        RAISE NOTICE 'Revendedores actualizados: %', resellers_updated;
    END IF;
    
    RAISE NOTICE '=== Actualización completada exitosamente ===';
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR EXCEPTION: % - %', SQLSTATE, SQLERRM;
        RETURN FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_status(UUID, TEXT) TO anon, authenticated;

-- Verificar creación
SELECT 'Función creada correctamente' as mensaje;