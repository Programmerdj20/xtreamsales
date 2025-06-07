-- Asegurarse de que la tabla resellers tenga las columnas correctas
DO $$
BEGIN
    -- Añadir user_id si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'resellers' AND column_name = 'user_id') THEN
        ALTER TABLE public.resellers ADD COLUMN user_id UUID REFERENCES auth.users(id);
        
        -- Copiar los IDs existentes a user_id
        UPDATE public.resellers SET user_id = id;
        
        -- Hacer user_id NOT NULL después de copiar los datos
        ALTER TABLE public.resellers ALTER COLUMN user_id SET NOT NULL;
    END IF;
    
    -- Asegurarse de que las columnas necesarias existen
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'resellers' AND column_name = 'phone') THEN
        ALTER TABLE public.resellers ADD COLUMN phone TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'resellers' AND column_name = 'plan_type') THEN
        ALTER TABLE public.resellers ADD COLUMN plan_type TEXT NOT NULL DEFAULT '1 Mes';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'resellers' AND column_name = 'plan_end_date') THEN
        ALTER TABLE public.resellers ADD COLUMN plan_end_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days');
    END IF;
    
    -- Actualizar la función update_reseller_info para usar user_id
    CREATE OR REPLACE FUNCTION public.update_reseller_info(
        reseller_id UUID, 
        reseller_phone TEXT,
        reseller_plan_type TEXT,
        reseller_plan_end_date TIMESTAMPTZ
    )
    RETURNS BOOLEAN
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
        success BOOLEAN := FALSE;
    BEGIN
        -- Verificar si existe el revendedor por user_id
        IF EXISTS (SELECT 1 FROM resellers WHERE user_id = reseller_id) THEN
            -- Actualizar campos existentes
            UPDATE resellers 
            SET 
                phone = reseller_phone,
                plan_type = reseller_plan_type,
                plan_end_date = reseller_plan_end_date,
                updated_at = NOW()
            WHERE user_id = reseller_id;
        ELSE
            -- Insertar nuevo revendedor
            INSERT INTO resellers (
                user_id,
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
    
    -- Actualizar la función get_all_resellers para devolver los campos correctos
    CREATE OR REPLACE FUNCTION public.get_all_resellers()
    RETURNS TABLE (
        id UUID,
        user_id UUID,
        created_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ,
        phone TEXT,
        plan_type TEXT,
        plan_end_date TIMESTAMPTZ,
        status TEXT
    )
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
        RETURN QUERY
        SELECT 
            r.id,
            r.user_id,
            r.created_at,
            r.updated_at,
            r.phone,
            r.plan_type,
            r.plan_end_date,
            p.status
        FROM 
            public.resellers r
        JOIN 
            public.profiles p ON r.user_id = p.id
        WHERE 
            p.role = 'reseller'
        ORDER BY 
            r.created_at DESC;
    END;
    $$;
    
    -- Otorgar permisos necesarios
    GRANTANT EXECUTE ON FUNCTION public.update_reseller_info TO authenticated;
    GRANT EXECUTE ON FUNCTION public.get_all_resellers TO authenticated;
    
    RAISE NOTICE 'Estructura de la tabla resellers y funciones RPC actualizadas correctamente.';
    
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error al actualizar la estructura: %', SQLERRM;
END $$;
