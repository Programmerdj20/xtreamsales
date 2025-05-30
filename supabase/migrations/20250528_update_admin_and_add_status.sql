-- Actualizar el usuario administrador
UPDATE auth.users
SET email = 'andreschmde@gmail.com',
    encrypted_password = crypt('Jacg120603@', gen_salt('bf'));

-- Agregar columna de estado a la tabla profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

-- Actualizar el admin a estado activo
UPDATE public.profiles
SET status = 'active'
WHERE role = 'admin';

-- Crear política para que solo los admins puedan ver usuarios pendientes
CREATE POLICY "Admins can see all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  OR auth.uid() = id
);
