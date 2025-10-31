import { supabase } from "../lib/supabase";
import { authService } from "./auth";
import { formatDateForInput, planToMonths } from "../lib/dateUtils";
import { planService } from "./plans";

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

            // Usar el plan proporcionado sin fallback hardcodeado
            const plan = data.plan;

            let fecha_fin = data.fecha_fin;

            // SIEMPRE RECALCULAR LA FECHA BASADA EN EL PLAN
            if (plan) {
                const months = planToMonths(plan); // Usar función síncrona
                const startDate = data.fecha_inicio ? new Date(data.fecha_inicio) : new Date();
                const endDate = new Date(startDate);

                if (months === 0) {
                    endDate.setDate(endDate.getDate() + 1);
                } else {
                    endDate.setMonth(endDate.getMonth() + months);
                }

                fecha_fin = formatDateForInput(endDate);
            } else if (!fecha_fin) {
                // Solo usar fecha proporcionada si no hay plan
                const startDate = data.fecha_inicio ? new Date(data.fecha_inicio) : new Date();
                const endDate = new Date(startDate);
                endDate.setMonth(endDate.getMonth() + 1);
                fecha_fin = formatDateForInput(endDate);
            }

            // Solo asignar owner_id si el usuario es un revendedor
            const owner_id = currentUser?.role === "reseller" ? currentUser.id : null;

            const { error } = await supabase.from("clients").insert([
                {
                    ...data,
                    plan,
                    fecha_fin,
                    owner_id,
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
            // Usar RPC como resellers para evitar problemas de trigger timing
            const { error: rpcError } = await supabase.rpc('update_client_info', {
                client_id: id,
                client_cliente: data.cliente || null,
                client_whatsapp: data.whatsapp || null,
                client_plataforma: data.plataforma || null,
                client_dispositivos: data.dispositivos || null,
                client_precio: data.precio || null,
                client_usuario: data.usuario || null,
                client_contraseña: data.contraseña || null,
                client_fecha_inicio: data.fecha_inicio ? new Date(data.fecha_inicio) : null,
                client_fecha_fin: data.fecha_fin ? new Date(data.fecha_fin) : null,
                client_status: data.status || null,
                client_plan: data.plan || null,
                client_observacion: data.observacion || null
            });
            
            if (rpcError) throw rpcError;
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

    async renew(id: string, planOrMonths: string | number): Promise<void> {
        try {
            // Convertir plan a meses si es string
            const months = typeof planOrMonths === 'string' ? planToMonths(planOrMonths) : planOrMonths;
            const planName = typeof planOrMonths === 'string' ? planOrMonths : `${planOrMonths} Meses`;

            console.log('Renovando plan de cliente con RPC:', { id, plan: planName, months });

            // Usar la función RPC renew_client_plan para renovar el plan
            const { data: success, error: rpcError } = await supabase
                .rpc('renew_client_plan', {
                    client_id: id,
                    months: months,
                    plan_name: planName
                });

            if (rpcError) {
                console.error('Error al renovar plan con RPC:', rpcError);
                throw rpcError;
            }

            if (!success) {
                throw new Error('No se pudo renovar el plan del cliente');
            }

            console.log('Plan de cliente renovado correctamente');
        } catch (error) {
            console.error('Error en el proceso de renovación de plan del cliente:', error);
            throw error;
        }
    },
};
