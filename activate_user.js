// Script para activar manualmente un usuario pendiente
import { createClient } from '@supabase/supabase-js';

// Obtener variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Función para actualizar el estado de un usuario
async function updateUserStatus(userId, status) {
  try {
    console.log(`Actualizando estado de usuario ${userId} a ${status}`);
    
    // Paso 1: Actualizar en la tabla profiles
    try {
      console.log("Paso 1: Actualizando en la tabla profiles");
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ status })
        .eq("id", userId);

      if (profileError) {
        console.error("Error actualizando estado en profiles:", profileError);
      } else {
        console.log("Perfil actualizado correctamente");
      }
    } catch (profileUpdateError) {
      console.error("Excepción al actualizar perfil:", profileUpdateError);
    }
    
    // Paso 2: Actualizar usando RPC (función que ignora políticas RLS)
    try {
      console.log("Paso 2: Actualizando mediante RPC");
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('update_user_status', { 
          user_id: userId, 
          new_status: status 
        });
        
      if (rpcError) {
        console.error("Error al usar RPC para actualizar estado:", rpcError);
      } else {
        console.log("Estado actualizado correctamente mediante RPC");
      }
    } catch (rpcCallError) {
      console.error("Excepción al llamar RPC:", rpcCallError);
    }
    
    // Paso 3: Actualizar en la tabla resellers
    try {
      console.log("Paso 3: Actualizando en la tabla resellers");
      
      // Actualizar con user_id
      try {
        console.log("Actualizando con user_id");
        const { error: resellerError1 } = await supabase
          .from("resellers")
          .update({ status })
          .eq("user_id", userId);
          
        if (resellerError1) {
          console.error("Error actualizando con user_id:", resellerError1);
        } else {
          console.log("Revendedor actualizado correctamente (user_id)");
        }
      } catch (error1) {
        console.error("Excepción actualizando con user_id:", error1);
      }
      
      // Actualizar con id
      try {
        console.log("Actualizando con id");
        const { error: resellerError2 } = await supabase
          .from("resellers")
          .update({ status })
          .eq("id", userId);

        if (resellerError2) {
          console.error("Error actualizando con id:", resellerError2);
        } else {
          console.log("Revendedor actualizado correctamente (id)");
        }
      } catch (error2) {
        console.error("Excepción actualizando con id:", error2);
      }
    } catch (userDataError) {
      console.error("Error obteniendo datos del usuario:", userDataError);
    }
    
    console.log("Proceso de actualización de estado completado");
    return { success: true };
  } catch (error) {
    console.error("Error general actualizando estado:", error);
    return { success: false, error: error.message || "Error desconocido" };
  }
}

// Obtener todos los perfiles pendientes
async function activatePendingUsers() {
  try {
    // Obtener todos los perfiles
    const { data: profiles, error: profilesError } = await supabase
      .rpc('get_all_profiles');
      
    if (profilesError) {
      console.error('Error al obtener perfiles:', profilesError);
      return;
    }
    
    // Filtrar perfiles pendientes
    const pendingProfiles = profiles.filter(p => p.status === 'pending');
    console.log(`Encontrados ${pendingProfiles.length} perfiles pendientes`);
    
    // Activar cada perfil pendiente
    for (const profile of pendingProfiles) {
      console.log(`Activando usuario: ${profile.email} (${profile.id})`);
      const result = await updateUserStatus(profile.id, 'active');
      console.log('Resultado:', result);
    }
    
    console.log('Proceso completado');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Ejecutar la función
activatePendingUsers();
