-- Verificar la estructura real de la tabla resellers

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'resellers'
ORDER BY ordinal_position;