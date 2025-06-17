-- Script para corregir las categorías de las plantillas existentes

-- Actualizar "Mensaje de Bienvenida" a categoría "credenciales"
UPDATE templates 
SET category = 'credenciales' 
WHERE name = 'Mensaje de Bienvenida';

-- Actualizar "Recordatorio de Vencimiento" a categoría "recordatorio"
UPDATE templates 
SET category = 'recordatorio' 
WHERE name = 'Recordatorio de Vencimiento';

-- Actualizar otras plantillas basándose en su contenido
UPDATE templates 
SET category = 'credenciales' 
WHERE category IS NULL 
  AND (
    content ILIKE '%credenciales%' 
    OR content ILIKE '%USUARIO%' 
    OR content ILIKE '%CONTRASEÑA%'
  );

-- Actualizar el resto de plantillas sin categoría a "recordatorio"
UPDATE templates 
SET category = 'recordatorio' 
WHERE category IS NULL;

-- Mostrar el resultado
SELECT name, category, created_at 
FROM templates 
ORDER BY created_at;
