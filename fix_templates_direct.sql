-- EJECUTAR ESTOS COMANDOS EN EL SQL EDITOR DE SUPABASE
-- Paso 1: Verificar estructura actual de la tabla
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'templates' 
ORDER BY ordinal_position;

-- Paso 2: Agregar columna category si no existe
ALTER TABLE templates ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'credenciales';

-- Paso 3: Actualizar plantillas existentes con categorías correctas
UPDATE templates 
SET category = 'credenciales' 
WHERE name = 'Mensaje de Bienvenida';

UPDATE templates 
SET category = 'recordatorio' 
WHERE name = 'Recordatorio de Vencimiento';

-- Paso 4: Actualizar otras plantillas basándose en contenido
UPDATE templates 
SET category = 'credenciales' 
WHERE category IS NULL 
  AND (
    content ILIKE '%credenciales%' 
    OR content ILIKE '%USUARIO%' 
    OR content ILIKE '%CONTRASEÑA%'
  );

-- Paso 5: Actualizar el resto a recordatorio
UPDATE templates 
SET category = 'recordatorio' 
WHERE category IS NULL;

-- Paso 6: Agregar constraint de validación
ALTER TABLE templates 
DROP CONSTRAINT IF EXISTS templates_category_check;

ALTER TABLE templates 
ADD CONSTRAINT templates_category_check 
CHECK (category IN ('credenciales', 'recordatorio'));

-- Paso 7: Verificar resultado final
SELECT id, name, category, created_at 
FROM templates 
ORDER BY created_at;
