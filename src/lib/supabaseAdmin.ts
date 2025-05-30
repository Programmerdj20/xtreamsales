import { createClient } from '@supabase/supabase-js'

// Declarar el tipo de import.meta para TypeScript
declare global {
  interface ImportMeta {
    env: {
      VITE_SUPABASE_URL: string;
      VITE_SUPABASE_SERVICE_KEY?: string;
      VITE_SUPABASE_ANON_KEY: string;
    }
  }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY

// Crear un cliente de Supabase que use la clave de servicio para ignorar las políticas RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})
