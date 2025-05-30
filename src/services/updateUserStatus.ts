// Función corregida para actualizar el estado de un usuario
// Esta función no usa supabase.auth.admin y solo actualiza las tablas profiles y resellers

import { supabase } from "../lib/supabase";

export async function updateUserStatus(
    userId: string,
    status: "active" | "inactive" | "pending"
) {
    try {
        console.log(`Actualizando estado de usuario ${userId} a ${status}`);
        
        // 1. Actualizar en profiles
        const { error: profileError } = await supabase
            .from("profiles")
            .update({ status })
            .eq("id", userId);

        if (profileError) {
            console.error("Error actualizando estado en profiles:", profileError);
            throw profileError;
        }

        console.log("Perfil actualizado correctamente");

        // 2. Verificar si el usuario es un revendedor y actualizar también en la tabla resellers
        const { data: userData, error: userDataError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", userId)
            .single();

        if (userDataError) {
            console.warn("Error obteniendo rol del usuario:", userDataError);
        }

        if (userData && userData.role === "reseller") {
            console.log("Actualizando estado en tabla resellers");
            // Actualizar en la tabla resellers
            const { error: resellerError } = await supabase
                .from("resellers")
                .update({ status })
                .eq("id", userId);

            if (resellerError) {
                console.error(
                    "Error actualizando estado en resellers:",
                    resellerError
                );
                // No lanzamos error para no interrumpir el proceso si falla solo en resellers
            } else {
                console.log("Revendedor actualizado correctamente");
            }
        }

        return { success: true };
    } catch (error: any) {
        console.error("Error actualizando estado:", error);
        throw new Error("Error al actualizar el estado del usuario");
    }
}
