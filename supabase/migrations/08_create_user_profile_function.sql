-- Eliminar la función existente primero para evitar conflictos
DROP FUNCTION IF EXISTS public.create_user_profile(UUID, TEXT, TEXT, TEXT, TEXT);

-- Crear función RPC mejorada para crear perfiles de usuario
-- Esta función reemplaza la anterior y añade funcionalidad para revendedores

CREATE OR REPLACE FUNCTION public.create_user_profile(
    user_id UUID,
    user_email TEXT,
    user_role TEXT DEFAULT 'reseller',
    user_status TEXT DEFAULT 'pending',
    user_full_name TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    profile_exists BOOLEAN;
    result JSONB;
BEGIN
    -- Verificar si el perfil ya existe
    SELECT EXISTS (
        SELECT 1 FROM profiles WHERE id = user_id
    ) INTO profile_exists;
    
    -- Si el perfil ya existe, actualizarlo
    IF profile_exists THEN
        UPDATE profiles
        SET 
            email = user_email,
            role = user_role,
            status = user_status,
            full_name = user_full_name,
            updated_at = NOW()
        WHERE id = user_id;
        
        result := jsonb_build_object(
            'success', true,
            'message', 'Perfil actualizado correctamente',
            'id', user_id
        );
    -- Si no existe, crearlo
    ELSE
        INSERT INTO profiles (id, email, role, status, full_name, created_at, updated_at)
        VALUES (user_id, user_email, user_role, user_status, user_full_name, NOW(), NOW());
        
        result := jsonb_build_object(
            'success', true,
            'message', 'Perfil creado correctamente',
            'id', user_id
        );
    END IF;

    -- Si es un revendedor, crear/actualizar entrada en la tabla resellers
    IF user_role = 'reseller' THEN
        INSERT INTO public.resellers (
            id,
            user_id,
            full_name,
            email,
            status,
            phone,
            plan_type,
            plan_end_date,
            created_at
        ) VALUES (
            user_id,
            user_id,
            user_full_name,
            user_email,
            user_status,
            '',
            'basic',
            NOW() + INTERVAL '30 days',
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            email = EXCLUDED.email,
            status = EXCLUDED.status;
    END IF;

    RETURN result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Error al crear/actualizar el perfil: ' || SQLERRM,
            'error_code', SQLSTATE
        );
END;
$$;

-- Otorgar permisos para ejecutar la función
GRANT EXECUTE ON FUNCTION public.create_user_profile TO anon, authenticated;

-- Comentario para documentar la función
COMMENT ON FUNCTION public.create_user_profile IS 'Crea un perfil de usuario y opcionalmente una entrada de revendedor. Versión mejorada con soporte para actualización.';
