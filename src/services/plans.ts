import { supabase } from "../lib/supabase";
import { SubscriptionPlan, NewSubscriptionPlan } from "../types/database.types";

export const planService = {
  // Obtener todos los planes
  getAll: async (): Promise<SubscriptionPlan[]> => {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .order("months", { ascending: true });

    if (error) {
      console.error("Error al obtener planes:", error);
      throw error;
    }

    return data || [];
  },

  // Crear un nuevo plan personalizado
  create: async (plan: NewSubscriptionPlan): Promise<SubscriptionPlan> => {
    const { data, error } = await supabase
      .from("subscription_plans")
      .insert([{ ...plan, is_custom: true }])
      .select()
      .single();

    if (error) {
      console.error("Error al crear plan:", error);
      throw error;
    }

    return data;
  },

  // Eliminar un plan personalizado
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("subscription_plans")
      .delete()
      .eq("id", id)
      .eq("is_custom", true); // Solo permite eliminar planes personalizados

    if (error) {
      console.error("Error al eliminar plan:", error);
      throw error;
    }
  },

  // Obtener un plan por nombre
  getByName: async (name: string): Promise<SubscriptionPlan | null> => {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("name", name)
      .single();

    if (error) {
      console.error("Error al obtener plan por nombre:", error);
      return null;
    }

    return data;
  },

  // Obtener meses de un plan por nombre usando la función de Supabase
  getMonthsByName: async (name: string): Promise<number> => {
    const { data, error } = await supabase.rpc('get_plan_months', { plan_name: name });

    if (error) {
      console.error("Error al obtener meses del plan:", error);
      return 1;
    }

    return data || 1;
  },
};