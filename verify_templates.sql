-- SCRIPT DE VERIFICACIÓN - EJECUTAR DESPUÉS DE LOS CAMBIOS

-- 1. Verificar que la columna category existe
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'templates' AND column_name = 'category';

-- 2. Verificar todas las plantillas y sus categorías
SELECT 
    id,
    name,
    category,
    CASE 
        WHEN category = 'credenciales' THEN '✅ Credenciales'
        WHEN category = 'recordatorio' THEN '✅ Recordatorio'
        ELSE '❌ Sin categoría válida'
    END as estado_categoria,
    created_at
FROM templates 
ORDER BY created_at;

-- 3. Contar plantillas por categoría
SELECT 
    category,
    COUNT(*) as cantidad
FROM templates 
GROUP BY category;

-- 4. Verificar constraint
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'templates_category_check';
