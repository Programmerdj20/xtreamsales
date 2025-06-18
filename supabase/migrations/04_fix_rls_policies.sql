-- PASO 1: Eliminar las políticas existentes para empezar de cero
DROP POLICY IF EXISTS "Allow full access to admin users" ON public.templates;
DROP POLICY IF EXISTS "Allow authenticated users to view system templates" ON public.templates;
DROP POLICY IF EXISTS "Allow resellers to manage their own templates" ON public.templates;

-- PASO 2: Crear una política permisiva para verificar que el problema es RLS
-- ESTA POLÍTICA ES TEMPORAL Y DEBE SER REEMPLAZADA
CREATE POLICY "TEMP - Enable all access for all authenticated users"
ON public.templates
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
