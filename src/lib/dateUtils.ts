/**
 * Utilidades para manejo correcto de fechas de planes
 * Versión híbrida: síncrona para compatibilidad, asíncrona para nuevos planes
 */

import { supabase } from './supabase';

// Mapeo hardcoded para planes básicos (compatibilidad hacia atrás)
const BASIC_PLANS_MAP: Record<string, number> = {
  'Demo (24 Hrs)': 0,
  '1 Mes': 1,
  '3 Meses': 3,
  '4M': 4,
  '6 Meses': 6,
  '7 Meses': 7,
  '12 Meses': 12,
  '14 Meses': 14
};

// Función síncrona para planes básicos, asíncrona como fallback
export const getPlanMonths = async (plan: string): Promise<number> => {
  // Primero intentar con mapeo hardcoded (rápido)
  if (BASIC_PLANS_MAP.hasOwnProperty(plan)) {
    return BASIC_PLANS_MAP[plan];
  }
  
  // Si no está en el mapeo, usar RPC para planes personalizados
  try {
    const { data: months, error } = await supabase.rpc('get_plan_months', { plan_name: plan });
    if (error) {
      console.error('Error obteniendo meses del plan:', error);
      return 1; // Fallback a 1 mes
    }
    return months || 1;
  } catch (error) {
    console.error('Error en getPlanMonths:', error);
    return 1; // Fallback a 1 mes
  }
};

// Función síncrona para compatibilidad hacia atrás
export const calculatePlanEndDate = (plan: string, startDate?: Date): Date => {
  const today = startDate ? new Date(startDate) : new Date();
  const endDate = new Date(today);
  
  // Usar mapeo hardcoded para cálculo rápido
  const months = BASIC_PLANS_MAP[plan] || 1;
  
  if (months === 0) {
    // Plan Demo (24 horas)
    endDate.setDate(endDate.getDate() + 1);
  } else {
    // Planes de meses
    endDate.setMonth(endDate.getMonth() + months);
  }
  
  return endDate;
};

// Versión asíncrona para planes dinámicos
export const calculatePlanEndDateAsync = async (plan: string, startDate?: Date): Promise<Date> => {
  const today = startDate ? new Date(startDate) : new Date();
  const endDate = new Date(today);
  
  const months = await getPlanMonths(plan);
  
  if (months === 0) {
    // Plan Demo (24 horas)
    endDate.setDate(endDate.getDate() + 1);
  } else {
    // Planes de meses
    endDate.setMonth(endDate.getMonth() + months);
  }
  
  return endDate;
};

export const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Función síncrona para compatibilidad hacia atrás
export const planToMonths = (plan: string): number => {
  return BASIC_PLANS_MAP[plan] || 1;
};

// Versión asíncrona para planes dinámicos
export const planToMonthsAsync = async (plan: string): Promise<number> => {
  return await getPlanMonths(plan);
};
