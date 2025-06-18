import { supabase } from "../lib/supabase";

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
    created_at?: string;
}

export interface ClientFormData extends Omit<ClientData, "id" | "dias_restantes" | "created_at"> {
    plan: string;
}

// Calcular días restantes entre dos fechas
const calcularDiasRestantes = (fechaFin: string): number => {
    const hoy = new Date();
    const fin = new Date(fechaFin);
    const diferencia = fin.getTime() - hoy.getTime();
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
};

// Determinar el estado basado en los días restantes
const determinarEstado = (diasRestantes: number): "active" | "expiring" | "expired" => {
    if (diasRestantes <= 0) return "expired";
    if (diasRestantes <= 7) return "expiring";
    return "active";
};

export const clientService = {
    async getAll(): Promise<ClientData[]> {
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Procesar los datos para calcular días restantes y estado
            return data.map(client => {
                const diasRestantes = calcularDiasRestantes(client.fecha_fin);
                const status = determinarEstado(diasRestantes);
                
                return {
                    ...client,
                    dias_restantes: diasRestantes,
                    status
                };
            });
        } catch (error) {
            console.error('Error al obtener clientes:', error);
            throw error;
        }
    },
    
    async create(data: ClientFormData): Promise<void> {
        try {
            // Calcular días restantes
            const diasRestantes = calcularDiasRestantes(data.fecha_fin);
            const status = determinarEstado(diasRestantes);
            
            // Asegurarse de que el plan esté definido
            const plan = data.plan || '1 Mes';
            
            const { error } = await supabase
                .from('clients')
                .insert([
                    {
                        ...data,
                        plan,
                        dias_restantes: diasRestantes,
                        status,
                        created_at: new Date().toISOString()
                    }
                ]);

            if (error) throw error;
        } catch (error) {
            console.error('Error al crear cliente:', error);
            throw error;
        }
    },
    
    async update(id: string, data: Partial<ClientFormData>): Promise<void> {
        try {
            // Si se actualiza la fecha de fin, recalcular días restantes y estado
            let updateData: any = { ...data };
            
            if (data.fecha_fin) {
                const diasRestantes = calcularDiasRestantes(data.fecha_fin);
                updateData.dias_restantes = diasRestantes;
                updateData.status = determinarEstado(diasRestantes);
            }
            
            // Si se actualiza el plan pero no la fecha fin, actualizar la fecha fin
            if (data.plan && !data.fecha_fin) {
                // Obtener la fecha actual para calcular la nueva fecha fin
                const today = new Date();
                let endDate;
                
                switch (data.plan) {
                    case 'Demo (24 Hrs)':
                        endDate = new Date(today);
                        endDate.setDate(today.getDate() + 1);
                        break;
                    case '1 Mes':
                        endDate = new Date(today);
                        endDate.setMonth(today.getMonth() + 1);
                        break;
                    case '3 Meses':
                        endDate = new Date(today);
                        endDate.setMonth(today.getMonth() + 3);
                        break;
                    case '6 Meses':
                        endDate = new Date(today);
                        endDate.setMonth(today.getMonth() + 6);
                        break;
                    case '12 Meses':
                        endDate = new Date(today);
                        endDate.setMonth(today.getMonth() + 12);
                        break;
                    default:
                        endDate = new Date(today);
                        endDate.setMonth(today.getMonth() + 1);
                }
                
                const formattedEndDate = endDate.toISOString().split('T')[0];
                const diasRestantes = calcularDiasRestantes(formattedEndDate);
                
                updateData.fecha_fin = formattedEndDate;
                updateData.dias_restantes = diasRestantes;
                updateData.status = determinarEstado(diasRestantes);
            }
            
            const { error } = await supabase
                .from('clients')
                .update(updateData)
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error al actualizar cliente:', error);
            throw error;
        }
    },
    
    async delete(id: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('clients')
                .delete()
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error al eliminar cliente:', error);
            throw error;
        }
    },
    
    async getClientsByReseller(resellerId: string): Promise<ClientData[]> {
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('reseller_id', resellerId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Procesar los datos para calcular días restantes y estado
            return data.map(client => {
                const diasRestantes = calcularDiasRestantes(client.fecha_fin);
                const status = determinarEstado(diasRestantes);
                
                return {
                    ...client,
                    dias_restantes: diasRestantes,
                    status
                };
            });
        } catch (error) {
            console.error('Error al obtener clientes del revendedor:', error);
            throw error;
        }
    }
};
