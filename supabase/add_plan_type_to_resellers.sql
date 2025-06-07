-- Agregar columna plan_type a la tabla resellers si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'resellers' AND column_name = 'plan_type'
    ) THEN
        ALTER TABLE public.resellers ADD COLUMN plan_type TEXT DEFAULT '1 Mes';
    END IF;
END $$;

-- Agregar columna plan_end_date a la tabla resellers si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'resellers' AND column_name = 'plan_end_date'
    ) THEN
        ALTER TABLE public.resellers ADD COLUMN plan_end_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 month');
    END IF;
END $$;
