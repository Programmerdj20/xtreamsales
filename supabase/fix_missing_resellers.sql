-- Insertar usuarios que están en profiles pero no en resellers
INSERT INTO public.resellers (
    id,
    full_name,
    email,
    status,
    phone,
    plan_type,
    plan_end_date,
    created_at
)
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.status,
    '', -- phone vacío por defecto
    '1 Mes', -- plan por defecto
    CURRENT_DATE + INTERVAL '30 days', -- 30 días desde hoy
    p.created_at
FROM public.profiles p
LEFT JOIN public.resellers r ON p.id = r.id
WHERE p.role = 'reseller' 
  AND r.id IS NULL; -- Solo usuarios que NO están en resellers

-- También actualizar los emails que están en null en resellers
UPDATE public.resellers 
SET email = p.email
FROM public.profiles p
WHERE resellers.id = p.id 
  AND resellers.email IS NULL 
  AND p.email IS NOT NULL;

-- Mostrar el resultado final
SELECT 'USUARIOS FINALES EN RESELLERS:' as info;
SELECT id, full_name, email, status, created_at 
FROM public.resellers 
ORDER BY created_at DESC;
