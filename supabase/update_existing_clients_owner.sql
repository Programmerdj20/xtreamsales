-- Script para actualizar los clientes existentes y asignarles el propietario correcto
-- Esto es necesario para que el filtro funcione correctamente

-- Primero, obtener el ID del revendedor Andy coock
-- Asumiendo que su email es test7@gmail.com basado en la imagen

-- Actualizar los clientes que no tienen owner_id asignado
-- y que fueron creados por revendedores específicos

-- Para Andy coock (test7@gmail.com)
UPDATE public.clients 
SET owner_id = (
    SELECT id 
    FROM public.profiles 
    WHERE email = 'test7@gmail.com' 
    AND role = 'reseller'
    LIMIT 1
)
WHERE owner_id IS NULL 
AND created_at >= '2025-01-01'  -- Ajustar fecha según sea necesario
AND cliente IS NOT NULL;

-- Verificar los resultados
SELECT 
    c.id,
    c.cliente,
    c.owner_id,
    p.full_name as owner_name,
    p.email as owner_email
FROM public.clients c
LEFT JOIN public.profiles p ON c.owner_id = p.id
ORDER BY c.created_at DESC;
