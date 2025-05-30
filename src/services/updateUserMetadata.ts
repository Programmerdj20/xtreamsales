import { supabase } from "../lib/supabase";

/**
 * Actualiza los metadatos de un usuario en Supabase Auth
 * Esta es una solución directa para asegurar que los metadatos estén sincronizados con la base de datos
 */
export async function updateUserMetadata(
  userId: string,
  metadata: {
    status?: "active" | "inactive" | "pending";
    role?: "admin" | "reseller";
    full_name?: string;
  }
) {
  try {
    console.log(`Actualizando metadatos del usuario ${userId}:`, metadata);
    
    // 1. Obtener los metadatos actuales
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError) {
      console.error("Error obteniendo usuario:", userError);
      return { success: false, error: userError };
    }
    
    if (!userData || !userData.user) {
      console.error("Usuario no encontrado");
      return { success: false, error: "Usuario no encontrado" };
    }
    
    // 2. Combinar los metadatos actuales con los nuevos
    const currentMetadata = userData.user.user_metadata || {};
    const newMetadata = { ...currentMetadata, ...metadata };
    
    console.log("Metadatos actualizados:", newMetadata);
    
    // 3. Actualizar los metadatos
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { user_metadata: newMetadata }
    );
    
    if (updateError) {
      console.error("Error actualizando metadatos:", updateError);
      return { success: false, error: updateError };
    }
    
    console.log("Metadatos actualizados correctamente");
    return { success: true };
  } catch (error) {
    console.error("Error general actualizando metadatos:", error);
    return { success: false, error };
  }
}
