/**
 * Utilidades para manejo correcto de fechas de planes
 * Calcula fechas exactas usando meses reales en lugar de días fijos
 */

export const calculatePlanEndDate = (plan: string, startDate?: Date): Date => {
  const today = startDate ? new Date(startDate) : new Date();
  
  // Crear una nueva fecha para no modificar la original
  const endDate = new Date(today);
  
  switch (plan) {
    case 'Demo (24 Hrs)':
      endDate.setDate(endDate.getDate() + 1);
      break;
    case '1 Mes':
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case '3 Meses':
      endDate.setMonth(endDate.getMonth() + 3);
      break;
    case '6 Meses':
      endDate.setMonth(endDate.getMonth() + 6);
      break;
    case '12 Meses':
      endDate.setMonth(endDate.getMonth() + 12);
      break;
    default:
      // Por defecto 1 mes
      endDate.setMonth(endDate.getMonth() + 1);
  }
  
  return endDate;
};

export const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const planToMonths = (plan: string): number => {
  switch (plan) {
    case 'Demo (24 Hrs)':
      return 0; // Caso especial para demo
    case '1 Mes':
      return 1;
    case '3 Meses':
      return 3;
    case '6 Meses':
      return 6;
    case '12 Meses':
      return 12;
    default:
      return 1;
  }
};