-- Agregar columna de teléfono a la tabla profiles si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'phone'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN phone TEXT;
    END IF;
END $$;

-- Actualizar la función create_user_profile para incluir el teléfono
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_role TEXT,
  user_status TEXT,
  user_full_name TEXT,
  user_phone TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Esto permite que la función se ejecute con los privilegios del creador
SET search_path = public
AS $$
DECLARE
  profile_exists BOOLEAN;
  result JSONB;
BEGIN
  -- Verificar si el perfil ya existe
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = user_id
  ) INTO profile_exists;
  
  -- Si el perfil ya existe, actualizarlo
  IF profile_exists THEN
    UPDATE profiles
    SET 
      email = user_email,
      role = user_role,
      status = user_status,
      full_name = user_full_name,
      phone = user_phone,
      updated_at = NOW()
    WHERE id = user_id;
    
    result := jsonb_build_object(
      'success', true,
      'message', 'Perfil actualizado correctamente',
      'id', user_id
    );
  -- Si no existe, crearlo
  ELSE
    INSERT INTO profiles (id, email, role, status, full_name, phone, created_at)
    VALUES (user_id, user_email, user_role, user_status, user_full_name, user_phone, NOW());
    
    result := jsonb_build_object(
      'success', true,
      'message', 'Perfil creado correctamente',
      'id', user_id
    );
  END IF;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Error al crear/actualizar el perfil: ' || SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;

-- Crear una función para actualizar el teléfono en la tabla profiles
CREATE OR REPLACE FUNCTION update_profile_phone(
  profile_id UUID,
  new_phone TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  success BOOLEAN := FALSE;
BEGIN
  UPDATE profiles
  SET phone = new_phone, updated_at = NOW()
  WHERE id = profile_id;
  
  GET DIAGNOSTICS success = ROW_COUNT;
  
  RETURN success > 0;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error al actualizar teléfono: %', SQLERRM;
    RETURN FALSE;
END;
$$;
