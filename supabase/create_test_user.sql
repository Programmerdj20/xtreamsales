-- Crear un usuario de prueba para verificar las plantillas
-- Nota: Este script debe ejecutarse con privilegios de administrador

-- Insertar usuario en auth.users (esto normalmente se hace a través de Supabase Auth)
-- Para propósitos de testing, vamos a verificar las plantillas directamente

-- Verificar el estado actual de las plantillas
SELECT 'Estado actual de plantillas:' as info;
SELECT id, name, category, created_at FROM templates ORDER BY created_at;

-- Contar plantillas por categoría
SELECT 'Conteo por categorías:' as info;
SELECT 
    category,
    COUNT(*) as cantidad
FROM templates 
GROUP BY category;

-- Verificar si hay plantillas sin categoría
SELECT 'Plantillas sin categoría:' as info;
SELECT id, name, content FROM templates WHERE category IS NULL;
