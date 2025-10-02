-- Ver las columnas de la tabla resellers
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'resellers'
ORDER BY ordinal_position;