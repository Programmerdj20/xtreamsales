-- Verificar usuarios en la tabla profiles
SELECT 'USUARIOS EN PROFILES:' as info;
SELECT id, email, full_name, role, status, created_at 
FROM public.profiles 
ORDER BY created_at DESC;

-- Verificar usuarios en la tabla resellers
SELECT 'USUARIOS EN RESELLERS:' as info;
SELECT id, full_name, email, status, created_at 
FROM public.resellers 
ORDER BY created_at DESC;

-- Verificar usuarios que están en profiles pero NO en resellers
SELECT 'USUARIOS EN PROFILES PERO NO EN RESELLERS:' as info;
SELECT p.id, p.email, p.full_name, p.role, p.status, p.created_at
FROM public.profiles p
LEFT JOIN public.resellers r ON p.id = r.id
WHERE p.role = 'reseller' AND r.id IS NULL
ORDER BY p.created_at DESC;
