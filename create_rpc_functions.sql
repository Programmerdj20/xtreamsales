-- Función para crear un perfil de usuario (ignorando políticas RLS)
CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_role TEXT,
  user_status TEXT,
  user_full_name TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Esto hace que la función se ejecute con los privilegios del creador
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, status, full_name, created_at)
  VALUES (user_id, user_email, user_role, user_status, user_full_name, NOW())
  ON CONFLICT (id) 
  DO UPDATE SET 
    email = user_email,
    role = user_role,
    status = user_status,
    full_name = user_full_name,
    updated_at = NOW();
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error en create_user_profile: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Función para crear un revendedor (ignorando políticas RLS)
CREATE OR REPLACE FUNCTION public.create_reseller(
  reseller_id UUID,
  reseller_email TEXT,
  reseller_name TEXT,
  reseller_status TEXT,
  reseller_phone TEXT,
  reseller_plan_type TEXT,
  reseller_plan_end_date TIMESTAMPTZ
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Esto hace que la función se ejecute con los privilegios del creador
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.resellers (
    id, 
    email, 
    full_name, 
    status, 
    phone, 
    plan_type, 
    plan_end_date, 
    created_at
  )
  VALUES (
    reseller_id, 
    reseller_email, 
    reseller_name, 
    reseller_status, 
    reseller_phone, 
    reseller_plan_type, 
    reseller_plan_end_date, 
    NOW()
  )
  ON CONFLICT (id) 
  DO UPDATE SET 
    email = reseller_email,
    full_name = reseller_name,
    status = reseller_status,
    phone = reseller_phone,
    plan_type = reseller_plan_type,
    plan_end_date = reseller_plan_end_date,
    updated_at = NOW();
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error en create_reseller: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Comentario: Estas funciones deben ejecutarse en el SQL Editor de Supabase
-- 1. Ve a https://app.supabase.io
-- 2. Selecciona tu proyecto
-- 3. Ve a SQL Editor
-- 4. Copia y pega este código
-- 5. Ejecuta el script
