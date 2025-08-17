/**
 * Utilidad para sincronizar estados entre las tablas resellers y profiles
 * Solo para uso del panel administrador
 */

import { supabase } from "./supabase";
import { calculateResellerStatus } from "./resellerStatusUtils";

/**
 * Sincroniza el estado de un reseller entre las tablas resellers y profiles
 * @param resellerId ID del reseller
 * @param planEndDate Fecha de vencimiento del plan
 * @param currentStatus Estado actual (opcional, se calcula automáticamente si no se proporciona)
 */
export async function syncResellerStatus(
    resellerId: string, 
    planEndDate: string | Date, 
    currentStatus?: string
): Promise<void> {
    try {
        console.log("Sincronizando estado del reseller:", resellerId);
        
        // Calcular el estado real basado en la fecha de vencimiento
        const statusInfo = calculateResellerStatus(planEndDate, currentStatus);
        
        // Mapear el estado "expired" a "inactive" para las tablas de BD
        // porque las restricciones CHECK no permiten "expired"
        const finalStatus = statusInfo.status === "expired" ? "inactive" : statusInfo.status;
        
        console.log("Estado calculado:", finalStatus, "para reseller:", resellerId);
        
        // Actualizar estado en ambas tablas (resellers y profiles) usando RPC
        console.log(`Llamando update_user_status con: user_id=${resellerId}, new_status=${finalStatus}`);
        
        const { data: success, error: updateError } = await supabase
            .rpc("update_user_status", {
                input_user_id: resellerId,
                new_status: finalStatus
            });
            
        console.log("Respuesta de update_user_status:", { success, updateError });
            
        if (updateError) {
            console.error("Error RPC actualizando estado:", updateError);
            throw new Error(`Error RPC: ${updateError.message || updateError}`);
        }
        
        if (success !== true) {
            console.error("La función RPC update_user_status devolvió:", success);
            throw new Error(`La función RPC devolvió ${success} en lugar de true`);
        }
        
        console.log(`Estado sincronizado correctamente: ${finalStatus} para reseller ${resellerId}`);
        
    } catch (error) {
        console.error("Error en syncResellerStatus:", error);
        throw new Error("Error al sincronizar estado del reseller");
    }
}

/**
 * Sincroniza todos los resellers vencidos automáticamente
 * Esta función puede ejecutarse periódicamente para mantener estados actualizados
 */
export async function syncAllExpiredResellers(): Promise<number> {
    try {
        console.log("Iniciando sincronización masiva de resellers vencidos");
        
        // Obtener todos los resellers con sus fechas de vencimiento
        const { data: resellers, error } = await supabase
            .from("resellers")
            .select("id, plan_end_date, status")
            .not("plan_end_date", "is", null);
            
        if (error) {
            console.error("Error obteniendo resellers:", error);
            throw error;
        }
        
        if (!resellers || resellers.length === 0) {
            console.log("No hay resellers para sincronizar");
            return 0;
        }
        
        let syncedCount = 0;
        const now = new Date();
        
        // Verificar cada reseller y sincronizar si es necesario
        for (const reseller of resellers) {
            const endDate = new Date(reseller.plan_end_date);
            const isExpired = endDate < now;
            
            // Si está vencido pero su estado no es "expired", sincronizar
            if (isExpired && reseller.status !== "expired") {
                await syncResellerStatus(reseller.id, reseller.plan_end_date, reseller.status);
                syncedCount++;
            }
            // Si no está vencido pero su estado es "expired", reactivar (por si se renovó)
            else if (!isExpired && reseller.status === "expired") {
                await syncResellerStatus(reseller.id, reseller.plan_end_date, reseller.status);
                syncedCount++;
            }
        }
        
        console.log(`Sincronización masiva completada. ${syncedCount} resellers sincronizados`);
        return syncedCount;
        
    } catch (error) {
        console.error("Error en syncAllExpiredResellers:", error);
        throw error;
    }
}