import { supabase } from "../lib/supabase";
import { authService } from "./auth";
import { calculatePlanEndDate, formatDateForInput } from "../lib/dateUtils";

// Tipos para la gestión de clientes
export interface ClientData {
    id: string;
    cliente: string;
    whatsapp: string;
    plataforma: string;
    dispositivos: number;
    precio: number;
    usuario: string;
    contraseña: string;
    fecha_inicio: string;
    fecha_fin: string;
    dias_restantes: number;
    status: "active" | "expiring" | "expired";
    plan: string;
    observacion?: string;
    reseller_id?: string;
    owner_id?: string;
    created_at?: string;
}

export interface ClientFormData
    extends Omit<ClientData, "id" | "dias_restantes" | "created_at"> {
    plan: string;
}

// Calcular días restantes entre dos fechas
const calcularDiasRestantes = (fechaFin: string): number => {
    // Crear fechas sin tiempo para evitar problemas de zona horaria
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Establecer hora a medianoche
    
    const fin = new Date(fechaFin);
    fin.setHours(0, 0, 0, 0); // Establecer hora a medianoche
    
    const diferencia = fin.getTime() - hoy.getTime();
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
};

// Determinar el estado basado en los días restantes
const determinarEstado = (
    diasRestantes: number
): "active" | "expiring" | "expired" => {
    if (diasRestantes <= 0) return "expired";
    if (diasRestantes <= 5) return "expiring";
    return "active";
};

export const clientService = {
    async getAll(): Promise<ClientData[]> {
        try {
            const { data, error } = await supabase
                .from("clients")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;

            // Procesar los datos para calcular días restantes y estado
            return data.map((client) => {
                const diasRestantes = calcularDiasRestantes(client.fecha_fin);
                const status = determinarEstado(diasRestantes);


                return {
                    ...client,
                    dias_restantes: diasRestantes,
                    status,
                };
            });
        } catch (error) {
            console.error("Error al obtener clientes:", error);
            throw error;
        }
    },

    async create(data: ClientFormData): Promise<void> {
        try {
            // Obtener el usuario actual para determinar la propiedad
            const currentUser = await authService.getCurrentUser();

            // Los días restantes y el status se calculan dinámicamente en el frontend

            // Asegurarse de que el plan esté definido
            const plan = data.plan || "1 Mes";

            // Solo asignar owner_id si el usuario es un revendedor
            // Los clientes del admin mantienen owner_id como NULL
            const owner_id =
                currentUser?.role === "reseller" ? currentUser.id : null;

            const { error } = await supabase.from("clients").insert([
                {
                    ...data,
                    plan,
                    // No almacenamos dias_restantes ni status - se calculan dinámicamente
                    owner_id, // NULL para admin, ID del usuario para revendedores
                    created_at: new Date().toISOString(),
                },
            ]);

            if (error) throw error;
        } catch (error) {
            console.error("Error al crear cliente:", error);
            throw error;
        }
    },

    async update(id: string, data: Partial<ClientFormData>): Promise<void> {
        try {
            // Si se actualiza la fecha de fin, no necesitamos recalcular aquí
            // porque dias_restantes y status se calculan dinámicamente
            const updateData: Partial<ClientFormData> = { ...data };

            // Si se actualiza el plan pero no la fecha fin, actualizar la fecha fin
            if (data.plan && !data.fecha_fin) {
                const endDate = calculatePlanEndDate(data.plan);
                updateData.fecha_fin = formatDateForInput(endDate);
                // No almacenamos dias_restantes ni status - se calculan dinámicamente
            }

            const { error } = await supabase
                .from("clients")
                .update(updateData)
                .eq("id", id);

            if (error) throw error;
        } catch (error) {
            console.error("Error al actualizar cliente:", error);
            throw error;
        }
    },

    async delete(id: string): Promise<void> {
        try {
            const { error } = await supabase
                .from("clients")
                .delete()
                .eq("id", id);

            if (error) throw error;
        } catch (error) {
            console.error("Error al eliminar cliente:", error);
            throw error;
        }
    },

    async getClientsByReseller(resellerId: string): Promise<ClientData[]> {
        try {
            const { data, error } = await supabase
                .from("clients")
                .select("*")
                .eq("owner_id", resellerId)
                .order("created_at", { ascending: false });

            if (error) throw error;

            // Procesar los datos para calcular días restantes y estado
            return data.map((client) => {
                const diasRestantes = calcularDiasRestantes(client.fecha_fin);
                const status = determinarEstado(diasRestantes);

                return {
                    ...client,
                    dias_restantes: diasRestantes,
                    status,
                };
            });
        } catch (error) {
            console.error("Error al obtener clientes del revendedor:", error);
            throw error;
        }
    },

    async getClientsByOwner(ownerId: string): Promise<ClientData[]> {
        try {
            const { data, error } = await supabase
                .from("clients")
                .select("*")
                .eq("owner_id", ownerId)
                .order("created_at", { ascending: false });

            if (error) throw error;

            // Procesar los datos para calcular días restantes y estado
            return data.map((client) => {
                const diasRestantes = calcularDiasRestantes(client.fecha_fin);
                const status = determinarEstado(diasRestantes);

                return {
                    ...client,
                    dias_restantes: diasRestantes,
                    status,
                };
            });
        } catch (error) {
            console.error("Error al obtener clientes por propietario:", error);
            throw error;
        }
    },
};
