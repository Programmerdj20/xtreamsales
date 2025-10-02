-- SCRIPT DE DIAGNÓSTICO
-- Ejecuta este script completo en el SQL Editor de Supabase

-- 1. Verificar que la función existe y está correcta
SELECT 
    routine_name,
    routine_type,
    specific_name,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name = 'update_user_status';

-- 2. Buscar el usuario test88
SELECT 
    'PROFILES' as tabla,
    id,
    email,
    full_name,
    role,
    status,
    created_at
FROM profiles 
WHERE email LIKE '%test88%' OR full_name LIKE '%test88%'
UNION ALL
SELECT 
    'RESELLERS' as tabla,
    id,
    email,
    full_name,
    NULL as role,
    status,
    created_at
FROM resellers 
WHERE email LIKE '%test88%' OR full_name LIKE '%test88%';

-- 3. PRUEBA MANUAL: Actualizar directamente el estado
-- (Copia el ID del usuario test88 de la consulta anterior y úsalo aquí)
-- IMPORTANTE: Reemplaza 'TU_USER_ID_AQUI' con el ID real del usuario test88

DO $$
DECLARE
    test_user_id UUID := 'TU_USER_ID_AQUI'; -- ⬅️ COLOCA AQUÍ EL ID DEL USUARIO test88
    result BOOLEAN;
BEGIN
    -- Intentar actualizar directamente en profiles
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'PRUEBA DIRECTA DE ACTUALIZACIÓN';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'User ID: %', test_user_id;
    
    -- Actualizar en profiles
    UPDATE profiles 
    SET status = 'active'
    WHERE id = test_user_id;
    
    IF FOUND THEN
        RAISE NOTICE '✅ Actualización en profiles: ÉXITO';
    ELSE
        RAISE NOTICE '❌ Actualización en profiles: FALLO - Usuario no encontrado';
    END IF;
    
    -- Actualizar en resellers
    UPDATE resellers 
    SET status = 'active'
    WHERE id = test_user_id OR user_id = test_user_id;
    
    IF FOUND THEN
        RAISE NOTICE '✅ Actualización en resellers: ÉXITO';
    ELSE
        RAISE NOTICE '⚠️  Actualización en resellers: No se encontró registro';
    END IF;
    
    RAISE NOTICE '==========================================';
    
END $$;

-- 4. Verificar el resultado
SELECT 
    'PROFILES' as tabla,
    id,
    email,
    full_name,
    role,
    status
FROM profiles 
WHERE email LIKE '%test88%' OR full_name LIKE '%test88%'
UNION ALL
SELECT 
    'RESELLERS' as tabla,
    id,
    email,
    full_name,
    NULL as role,
    status
FROM resellers 
WHERE email LIKE '%test88%' OR full_name LIKE '%test88%';

-- 5. AHORA PROBAR LA FUNCIÓN RPC
-- (Usa el mismo ID del usuario test88)

SELECT update_user_status('TU_USER_ID_AQUI'::UUID, 'active');

-- 6. Ver el resultado final
SELECT 
    'DESPUÉS DE RPC - PROFILES' as info,
    id,
    email,
    status
FROM profiles 
WHERE email LIKE '%test88%'
UNION ALL
SELECT 
    'DESPUÉS DE RPC - RESELLERS' as info,
    id,
    email,
    status
FROM resellers 
WHERE email LIKE '%test88%';