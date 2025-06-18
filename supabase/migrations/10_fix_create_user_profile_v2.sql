-- Corregir la función create_user_profile_v2 para usar las columnas correctas de la tabla resellers

CREATE OR REPLACE FUNCTION public.create_user_profile_v2(
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
    reseller_exists BOOLEAN;
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
        -- Verificar si ya existe un revendedor con este ID
        SELECT EXISTS (
            SELECT 1 FROM resellers WHERE id = user_id
        ) INTO reseller_exists;
        
        IF reseller_exists THEN
            -- Actualizar revendedor existente
            UPDATE public.resellers
            SET 
                full_name = user_full_name,
                email = user_email,
                status = user_status
            WHERE id = user_id;
        ELSE
            -- Crear nuevo revendedor usando solo las columnas que existen
            INSERT INTO public.resellers (
                id,
                full_name,
                email,
                status,
                phone,
                plan_type,
                plan_end_date,
                created_at
            ) VALUES (
                user_id,
                user_full_name,
                user_email,
                user_status,
                '',
                '1 Mes',
                CURRENT_DATE + INTERVAL '30 days',
                NOW()
            );
        END IF;
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
GRANT EXECUTE ON FUNCTION public.create_user_profile_v2 TO anon, authenticated;

-- Comentario para documentar la función
COMMENT ON FUNCTION public.create_user_profile_v2 IS 'Crea un perfil de usuario y opcionalmente una entrada de revendedor. Versión corregida que usa las columnas correctas de la tabla resellers.';
