-- Otorgar permisos explícitos en la tabla templates al rol authenticated
GRANT ALL ON public.templates TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Asegurar que la secuencia también tenga permisos si existe
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
