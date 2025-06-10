import { supabase } from "../lib/supabase";
import { Reseller } from "../types/database.types";
import { v4 as uuidv4 } from 'uuid';

// (Eliminada interfaz ResellerWithPassword porque no se utiliza)

export const resellerService = {
    // Crear un nuevo revendedor de forma robusta usando solo funciones RPC
    async createReseller({
      email,
      full_name,
      phone,
      plan_type,
      plan_end_date
    }: {
      email: string;
      full_name: string;
      phone?: string;
      plan_type: string;
      plan_end_date: string; // ISO string
    }) {
      const userId = uuidv4();

      // 1. Crear perfil en profiles
      const { data: profileResult, error: profileError }: { data: { success: boolean; message?: string } | null; error: { message?: string } | null } = await supabase.rpc('create_user_profile', {
        user_id: userId,
        user_email: email,
        user_role: 'reseller',
        user_status: 'active',
        user_full_name: full_name
      });
      if (profileError || !(profileResult && profileResult.success)) {
        throw new Error((profileResult && profileResult.message) || (profileError && profileError.message) || 'Error creando perfil');
      }

      // 2. Crear registro en resellers
      const { data: resellerResult, error: resellerError }: { data: { success: boolean; message?: string } | null; error: { message?: string } | null } = await supabase.rpc('create_reseller', {
        user_id: userId,
        user_email: email,
        user_full_name: full_name,
        user_phone: phone || '',
        user_plan_type: plan_type,
        user_status: 'active',
        user_plan_end_date: plan_end_date
      });
      if (resellerError || !(resellerResult && resellerResult.success)) {
        throw new Error((resellerResult && resellerResult.message) || (resellerError && resellerError.message) || 'Error creando revendedor');
      }

      return {
        success: true,
        user_id: userId,
        message: 'Revendedor creado correctamente'
      };
    },
    // Obtener todos los revendedores
    async getAll(forceReload = false) {
        console.log('DEPURACIÓN - Fetching resellers... forceReload:', forceReload);
        
        try {
            // Primero, obtener todos los perfiles con rol 'reseller'
            console.log('Obteniendo perfiles con rol reseller...');
            const { data: profilesData, error: profilesError }: { data: (Reseller & { role?: string })[] | null; error: { message?: string } | null } = await supabase
                .rpc('get_all_profiles');
                
            if (profilesError || !Array.isArray(profilesData)) {
                console.error('Error al obtener perfiles con RPC:', profilesError);
                return [];
            }
            
            // Filtrar solo los perfiles con rol 'reseller'
            const resellerProfiles = profilesData.filter((p) => p && p.role === 'reseller');
            console.log(`Encontrados ${resellerProfiles.length} perfiles de revendedores`);
            
            // Obtener datos de la tabla resellers usando RPC
            console.log('Obteniendo datos de resellers...');
            const { data: resellersData, error: resellersError }: { data: Reseller[] | null; error: { message?: string } | null } = await supabase
                .rpc('get_all_resellers');
                
            // Si hay un error al obtener resellers, usar solo los perfiles
            if (resellersError || !Array.isArray(resellersData)) {
                console.error('Error al obtener resellers con RPC:', resellersError);
                console.log('Usando solo datos de perfiles para revendedores');
                
                return resellerProfiles.map((profile) => ({
                    id: profile.id,
                    user_id: profile.id,
                    created_at: profile.created_at,
                    full_name: profile.full_name || 'Sin nombre',
                    email: profile.email || 'sin-email@ejemplo.com',
                    phone: profile.phone || "",
                    plan_type: "Basic",
                    plan_end_date: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
                    status: profile.status || 'pending',
                })) as Reseller[];
            }
            
            console.log(`Encontrados ${resellersData?.length || 0} registros en tabla resellers`);
            
            // Combinar datos de perfiles y resellers
            const result = resellerProfiles.map(profile => {
                // Buscar datos correspondientes en la tabla resellers
                const resellerData = resellersData?.find(r => 
                    (r.id === profile.id || r.user_id === profile.id)
                );
                
                // Si encontramos datos en resellers, combinarlos con el perfil
                if (resellerData) {
                    return {
                        ...resellerData,
                        id: resellerData.id || profile.id,
                        user_id: resellerData.user_id || profile.id,
                        full_name: profile.full_name || resellerData.full_name || 'Sin nombre',
                        email: profile.email || resellerData.email || 'sin-email@ejemplo.com',
                        phone: resellerData.phone || profile.phone || "",
                        plan_type: resellerData.plan_type || "Basic",
                        plan_end_date: resellerData.plan_end_date || new Date(Date.now() + 30*24*60*60*1000).toISOString(),
                        status: profile.status || resellerData.status || 'pending',
                    };
                } 
                // Si no hay datos en resellers, crear un objeto con datos básicos del perfil
                else {
                    return {
                        id: profile.id,
                        user_id: profile.id,
                        created_at: profile.created_at,
                        full_name: profile.full_name || 'Sin nombre',
                        email: profile.email || 'sin-email@ejemplo.com',
                        phone: profile.phone || "",
                        plan_type: "Basic",
                        plan_end_date: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
                        status: profile.status || 'pending',
                    };
                }
            });
            
            console.log(`Devolviendo ${result.length} revendedores`);
            return result as Reseller[];
        } catch (error) {
            console.error("Error inesperado al obtener revendedores:", error);
            return [];
        }
    },

    // Obtener un revendedor por ID usando RPC que devuelve JSONB
    async getById(id: string) {
        try {
            console.log('Obteniendo revendedor por ID con RPC:', id);
            // Usar la función RPC que devuelve JSONB
            const { data: resellerData, error: rpcError } = await supabase
                .rpc('get_reseller_by_id', {
                    reseller_id: id
                });
            
            if (rpcError) {
                console.error('Error al obtener revendedor con RPC:', rpcError);
                throw rpcError;
            }
            
            if (!resellerData) {
                throw new Error('No se encontró el revendedor con el ID proporcionado');
            }
            
            // La RPC devuelve un objeto JSONB con todos los datos necesarios
            const reseller = resellerData as unknown as Reseller;
            
            console.log('Revendedor obtenido correctamente:', reseller);
            return reseller;
        } catch (error) {
            console.error('Error al obtener revendedor:', error);
            // Método de respaldo: Intentar obtener datos usando la función get_all_resellers
            try {
                console.log('Intentando obtener revendedor con método de respaldo usando get_all_resellers...');
                // Obtener todos los revendedores usando la RPC
                const { data: allResellers, error: rpcError } = await supabase
                    .rpc('get_all_resellers');
                if (rpcError) {
                    console.error('Error al obtener lista de revendedores con RPC:', rpcError);
                    throw rpcError;
                }
                // Filtrar por ID
                const reseller = allResellers?.find(r => r.id === id);
                if (!reseller) {
                    throw new Error('No se encontró el revendedor con el ID proporcionado');
                }
                console.log('Revendedor obtenido correctamente con método de respaldo:', reseller);
                return reseller as Reseller;
            } catch (fallbackError) {
                console.error('Error en método de respaldo:', fallbackError);
                // Si todo falla, devolver un objeto mínimo para que la UI no falle
                return {
                    id: id,
                    full_name: 'Revendedor',
                    email: 'email@ejemplo.com',
                    phone: '',
                    plan_type: '1 Mes',
                    plan_end_date: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    status: 'active',
                    role: 'reseller'
                } as Reseller;
            }
        }
    },
    async update(id: string, updates: Partial<Reseller>) {
        // Actualizar nombre completo si cambia
        if (updates.full_name) {
            await supabase.rpc('update_profile_name', { user_id: id, new_name: updates.full_name });
        }
        // Formatear fecha del plan
        let plan_end_date: string | null = null;
        if (updates.plan_end_date && typeof updates.plan_end_date === 'string') {
            plan_end_date = new Date(updates.plan_end_date).toISOString();
        }
        // Actualizar datos principales del reseller
        const { error: rpcError }: { error: { message?: string } | null } = await supabase.rpc('update_reseller_info', {
            reseller_id: id,
            reseller_phone: typeof updates.phone === 'string' ? updates.phone : '',
            reseller_plan_type: typeof updates.plan_type === 'string' ? updates.plan_type : '',
            reseller_plan_end_date: plan_end_date
        });
        if (rpcError) throw rpcError;
        // Actualizar email si corresponde
        if (updates.email) {
            await supabase.from('profiles').update({ email: updates.email }).eq('id', id);
        }
        // Retornar el reseller actualizado
        return await resellerService.getById(id);
    },
    async delete(id: string) {
        const { data: rpcResult, error: rpcError }: { data: { success: boolean; message?: string } | null; error: { message?: string } | null } = await supabase.rpc('delete_reseller', { reseller_id: id });
        if (rpcError) {
            if (rpcError.message && rpcError.message.includes('No se encontró el revendedor')) {
                return { success: true, message: 'Revendedor ya no existe (idempotente)', id };
            }
            throw rpcError;
        }
        if (!rpcResult || rpcResult.success === false) {
            return { success: true, message: rpcResult?.message || 'Revendedor ya no existe (idempotente)', id };
        }
        return { success: true, message: 'Revendedor eliminado correctamente', id };
    }
};

export default resellerService;
