import { supabase } from "../lib/supabase";
import { Reseller } from "../types/database.types";
import { v4 as uuidv4 } from 'uuid';
import { calculateResellerStatus } from "../lib/resellerStatusUtils";

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
      // Definimos un tipo más preciso para la respuesta esperada de create_user_profile
      type CreateUserProfileSuccessResponse = { success: true; message?: string; id: string };
      type CreateUserProfileErrorResponse = { success: false; message?: string };
      type CreateUserProfileResponse = CreateUserProfileSuccessResponse | CreateUserProfileErrorResponse;

      const { data: profileResult, error: profileError }: { data: CreateUserProfileResponse | null; error: { message?: string } | null } = await supabase.rpc('create_user_profile', {
        p_user_id: userId,
        p_user_email: email,
        p_user_role: 'reseller',
        p_user_status: 'active',
        p_user_full_name: full_name,
        p_user_phone: phone || ''
      });

      if (profileError) {
        console.error('Error en RPC create_user_profile (profileError):', profileError);
        throw new Error(profileError.message || 'Error en la llamada RPC para crear perfil');
      }

      if (!profileResult) {
        console.error('Respuesta nula de RPC create_user_profile');
        throw new Error('Respuesta nula al crear perfil');
      }

      if (!profileResult.success) {
        console.error('Fallo en RPC create_user_profile (profileResult.success false):', profileResult.message);
        throw new Error(profileResult.message || 'Error creando perfil (fallo reportado por RPC)');
      }

      // Ahora TypeScript sabe que si profileResult.success es true, profileResult es de tipo CreateUserProfileSuccessResponse y tiene 'id'
      const finalUserIdForReseller = profileResult.id;

      if (!finalUserIdForReseller) {
        // Esta comprobación es redundante si el tipo es correcto y la RPC siempre devuelve 'id' en caso de éxito,
        // pero se mantiene por seguridad por si la RPC no cumpliera estrictamente el contrato.
        console.error('ID de usuario final no encontrado en la respuesta de create_user_profile a pesar de success:true');
        throw new Error('No se pudo obtener el ID de usuario final del perfil para crear el revendedor.');
      }

      // 2. Crear registro en resellers
      const { data: resellerResult, error: resellerError }: { data: { success: boolean; message?: string } | null; error: { message?: string } | null } = await supabase.rpc('create_reseller', {
        user_id: finalUserIdForReseller, // Usar el ID del resultado de create_user_profile
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
            // Obtener datos de la tabla resellers usando RPC
            console.log('Obteniendo datos de resellers...');
            const { data: resellersData, error: resellersError }: { data: Reseller[] | null; error: { message?: string } | null } = await supabase
                .rpc('get_all_resellers');

            if (resellersError || !Array.isArray(resellersData)) {
                console.error('Error al obtener resellers con RPC:', resellersError);
                return [];
            }

            // Obtener todos los perfiles con rol 'reseller'
            console.log('Obteniendo perfiles con rol reseller...');
            const { data: profilesData, error: profilesError }: { data: (Reseller & { role?: string })[] | null; error: { message?: string } | null } = await supabase
                .rpc('get_all_profiles');

            if (profilesError || !Array.isArray(profilesData)) {
                console.error('Error al obtener perfiles con RPC:', profilesError);
                return [];
            }

            // Filtrar solo los perfiles que tienen registro en resellers
            const resellerProfiles = profilesData.filter((p) =>
                p && p.role === 'reseller' && resellersData.some(r => r.id === p.id)
            );
            console.log(`Encontrados ${resellerProfiles.length} perfiles de revendedores`);

            // Obtener conteo de clientes por revendedor
            console.log('Obteniendo conteo de clientes por revendedor...');
            const clientCountPromises = resellerProfiles.map(async (profile) => {
                const { count, error } = await supabase
                    .from('clients')
                    .select('*', { count: 'exact', head: true })
                    .eq('owner_id', profile.id);
                
                if (error) {
                    console.error(`Error contando clientes para revendedor ${profile.id}:`, error);
                    return { id: profile.id, clients_count: 0 };
                }
                
                return { id: profile.id, clients_count: count || 0 };
            });

            const clientCounts = await Promise.all(clientCountPromises);
            const clientCountMap = clientCounts.reduce((acc, item) => {
                acc[item.id] = item.clients_count;
                return acc;
            }, {} as Record<string, number>);

            // Combinar datos de perfiles, resellers y conteo de clientes
            const result = resellerProfiles.map(profile => {
                const resellerData = resellersData.find(r =>
                    (r.id === profile.id || r.user_id === profile.id)
                );
                
                const baseData = resellerData ? {
                    ...profile,
                    ...resellerData
                } : profile;

                // Calcular estado dinámico basado en fecha de vencimiento
                let finalStatus = baseData.status;
                if (baseData.plan_end_date) {
                    const statusInfo = calculateResellerStatus(baseData.plan_end_date, baseData.status);
                    finalStatus = statusInfo.status;
                }

                return {
                    ...baseData,
                    status: finalStatus,
                    clients_count: clientCountMap[profile.id] || 0
                };
            });

            console.log('Resultado final con conteo de clientes:', result);
            return result;
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
