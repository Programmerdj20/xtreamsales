-- Agregar campo category a la tabla templates
ALTER TABLE templates ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'credenciales';

-- Actualizar las plantillas por defecto con sus categorías apropiadas
UPDATE templates 
SET category = 'credenciales' 
WHERE name = 'Mensaje de Bienvenida';

UPDATE templates 
SET category = 'recordatorio' 
WHERE name = 'Recordatorio de Vencimiento';

-- Agregar constraint para validar los valores de category
ALTER TABLE templates 
ADD CONSTRAINT templates_category_check 
CHECK (category IN ('credenciales', 'recordatorio'));
