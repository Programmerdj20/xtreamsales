/**
 * Utilidades para validar y calcular el estado de los resellers
 */

export interface ResellerStatus {
  status: "active" | "expired" | "pending";
  isExpired: boolean;
  daysRemaining: number;
}

/**
 * Calcula el estado actual de un reseller basado en su fecha de vencimiento
 */
export function calculateResellerStatus(planEndDate: string | Date, currentStatus?: string): ResellerStatus {
  const now = new Date();
  const endDate = new Date(planEndDate);
  
  // Calcular días restantes
  const timeDiff = endDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  // Determinar si está vencido
  const isExpired = daysRemaining < 0;
  
  // Calcular estado final
  let status: "active" | "expired" | "pending";
  
  if (currentStatus === "pending") {
    // Si está pendiente, mantener ese estado independientemente de la fecha
    status = "pending";
  } else if (isExpired) {
    // Si la fecha ya pasó, está vencido
    status = "expired";
  } else {
    // Si no está vencido y no está pendiente, está activo
    status = "active";
  }
  
  return {
    status,
    isExpired,
    daysRemaining
  };
}

/**
 * Valida si un reseller puede acceder al sistema
 */
export function canResellerAccess(planEndDate: string | Date, currentStatus?: string): boolean {
  const statusInfo = calculateResellerStatus(planEndDate, currentStatus);
  
  // No puede acceder si está vencido o pendiente
  return statusInfo.status === "active";
}

/**
 * Obtiene el mensaje de error apropiado para un reseller que no puede acceder
 */
export function getAccessDeniedMessage(planEndDate: string | Date, currentStatus?: string): string {
  const statusInfo = calculateResellerStatus(planEndDate, currentStatus);
  
  if (statusInfo.status === "pending") {
    return "Tu cuenta está pendiente de activación por el administrador. Por favor, espera a que tu cuenta sea activada.";
  }
  
  if (statusInfo.status === "expired") {
    const expiredDays = Math.abs(statusInfo.daysRemaining);
    return `Tu plan ha vencido hace ${expiredDays} días. Por favor, contacta al administrador para renovar tu suscripción.`;
  }
  
  return "Tu cuenta no está disponible. Por favor, contacta al administrador.";
}