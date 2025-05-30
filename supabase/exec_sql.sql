-- Función para ejecutar SQL dinámicamente (solo para administradores)
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Esto permite que la función se ejecute con los privilegios del creador
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Verificar si el usuario es administrador
  IF (SELECT role FROM auth.users WHERE id = auth.uid()) != 'admin' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Solo los administradores pueden ejecutar SQL dinámico'
    );
  END IF;
  
  -- Ejecutar la consulta SQL
  EXECUTE sql_query;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'SQL ejecutado correctamente'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Error al ejecutar SQL: ' || SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;
