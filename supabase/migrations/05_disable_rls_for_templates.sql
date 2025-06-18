-- Deshabilitar la Seguridad a Nivel de Fila (RLS) en la tabla de plantillas.
-- La lógica de permisos se manejará en el código de la aplicación.
ALTER TABLE public.templates DISABLE ROW LEVEL SECURITY;

-- Eliminar las políticas anteriores si aún existen, para limpiar.
DROP POLICY IF EXISTS "Allow full access to admin users" ON public.templates;
DROP POLICY IF EXISTS "Allow authenticated users to view system templates" ON public.templates;
DROP POLICY IF EXISTS "Allow resellers to manage their own templates" ON public.templates;
DROP POLICY IF EXISTS "TEMP - Enable all access for all authenticated users" ON public.templates;
