-- Función para crear un perfil de usuario (bypass RLS)
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_role TEXT,
  user_status TEXT,
  user_full_name TEXT
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
      updated_at = NOW()
    WHERE id = user_id;
    
    result := jsonb_build_object(
      'success', true,
      'message', 'Perfil actualizado correctamente',
      'id', user_id
    );
  -- Si no existe, crearlo
  ELSE
    INSERT INTO profiles (id, email, role, status, full_name, created_at)
    VALUES (user_id, user_email, user_role, user_status, user_full_name, NOW());
    
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
