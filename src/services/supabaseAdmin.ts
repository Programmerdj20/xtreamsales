import { createClient } from '@supabase/supabase-js';

// Obtener las variables de entorno desde el objeto window
declare global {
  interface ImportMeta {
    env: Record<string, string>;
  }
}

// Crear un cliente de Supabase con la API key anónima
// Esto nos permitirá acceder a las tablas sin restricciones de RLS
export const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
    }
  }
);
