-- Create subscription_plans table
CREATE TABLE public.subscription_plans (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    months integer NOT NULL,
    price decimal(10, 2) NOT NULL DEFAULT 0,
    is_custom boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read plans
CREATE POLICY "Authenticated users can read plans" ON public.subscription_plans
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can insert custom plans
CREATE POLICY "Authenticated users can insert plans" ON public.subscription_plans
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Policy: Only admins can update plans
CREATE POLICY "Admin can update plans" ON public.subscription_plans
    FOR UPDATE
    USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'))
    WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Policy: Authenticated users can delete custom plans only
CREATE POLICY "Authenticated users can delete custom plans" ON public.subscription_plans
    FOR DELETE
    USING (
        auth.role() = 'authenticated'
        AND is_custom = true
    );

-- Insert predefined plans
INSERT INTO public.subscription_plans (name, months, price, is_custom) VALUES
    ('Demo (24 Hrs)', 0, 0, false),
    ('1 Mes', 1, 0, false),
    ('3 Meses', 3, 0, false),
    ('6 Meses', 6, 0, false),
    ('7 Meses', 7, 0, false),
    ('12 Meses', 12, 0, false),
    ('14 Meses', 14, 0, false);