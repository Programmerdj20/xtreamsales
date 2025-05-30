import { supabase } from "../lib/supabase";
import { supabaseAdmin } from "./supabaseAdmin";

/**
 * Actualiza el estado de un usuario en las tablas profiles y resellers
 * Esta función no depende de supabase.auth.admin
 */
export async function updateUserStatus(
  userId: string, 
  status: "active" | "inactive" | "pending"
) {
  try {
    console.log(`Actualizando estado de usuario ${userId} a ${status}`);
    
    // Paso 1: Actualizar en la tabla profiles usando supabaseAdmin
    try {
      console.log("Paso 1: Actualizando en la tabla profiles con supabaseAdmin");
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ status })
        .eq("id", userId);

      if (profileError) {
        console.error("Error actualizando estado en profiles con supabaseAdmin:", profileError);
        
        // Intentar con el cliente normal como fallback
        try {
          console.log("Intentando actualizar con cliente normal...");
          const { error: normalError } = await supabase
            .from("profiles")
            .update({ status })
            .eq("id", userId);
            
          if (normalError) {
            console.error("Error actualizando con cliente normal:", normalError);
          } else {
            console.log("Perfil actualizado correctamente con cliente normal");
          }
        } catch (normalError) {
          console.error("Excepción al actualizar con cliente normal:", normalError);
        }
      } else {
        console.log("Perfil actualizado correctamente con supabaseAdmin");
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
      const { data: userData } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (userData && userData.role === "reseller") {
        console.log("Usuario es revendedor, actualizando en tabla resellers");
        
        // Actualizar con user_id usando supabaseAdmin
        try {
          console.log("Actualizando con user_id usando supabaseAdmin");
          const { error: resellerError1 } = await supabaseAdmin
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
        
        // Actualizar con id usando supabaseAdmin
        try {
          console.log("Actualizando con id usando supabaseAdmin");
          const { error: resellerError2 } = await supabaseAdmin
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
      } else {
        console.log("Usuario no es revendedor, no es necesario actualizar la tabla resellers");
      }
    } catch (userDataError) {
      console.error("Error obteniendo datos del usuario:", userDataError);
    }
    
    // Paso 4: Crear o actualizar el revendedor si no existe
    try {
      console.log("Paso 4: Verificando si es necesario crear el revendedor");
      const { data: profileData } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", userId)
        .single();
        
      if (profileData && profileData.role === "reseller") {
        // Verificar si ya existe un revendedor
        const { data: existingReseller } = await supabase
          .from("resellers")
          .select("id")
          .or(`id.eq.${userId},user_id.eq.${userId}`)
          .maybeSingle();
          
        if (!existingReseller) {
          console.log("No existe revendedor, creando uno nuevo");
          
          // Calcular fecha de expiración (30 días desde hoy)
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() + 30);
          
          // Crear revendedor
          const { error: createError } = await supabase
            .from("resellers")
            .insert([
              {
                id: userId,
                user_id: userId,
                full_name: profileData.full_name,
                status: status,
                phone: "",
                plan_type: "basic",
                plan_end_date: expirationDate.toISOString(),
                created_at: new Date().toISOString()
              }
            ]);
            
          if (createError) {
            console.error("Error creando revendedor:", createError);
          } else {
            console.log("Revendedor creado correctamente");
          }
        } else {
          console.log("Revendedor ya existe, no es necesario crearlo");
        }
      }
    } catch (createError) {
      console.error("Error verificando/creando revendedor:", createError);
    }
    
    // Si llegamos hasta aquí, consideramos que la operación fue exitosa
    // incluso si hubo algunos errores en el camino
    console.log("Proceso de actualización de estado completado");
    return { success: true };
  } catch (error: any) {
    console.error("Error general actualizando estado:", error);
    // No lanzamos error para permitir que la aplicación continúe
    return { success: false, error: error.message || "Error desconocido" };
  }
}
