import { supabase } from "../lib/supabase";
import { Reseller, NewReseller } from "../types/database.types";

// Interfaz para el password que no está en NewReseller
interface ResellerWithPassword extends NewReseller {
    password?: string;
}

export const resellerService = {
    // Obtener todos los revendedores
    async getAll(forceReload = false) {
        console.log('DEPURACIÓN - Fetching resellers... forceReload:', forceReload);
        
        try {
            // Primero, obtener todos los perfiles con rol 'reseller'
            console.log('Obteniendo perfiles con rol reseller...');
            const { data: profilesData, error: profilesError } = await supabase
                .rpc('get_all_profiles');
                
            if (profilesError) {
                console.error('Error al obtener perfiles con RPC:', profilesError);
                return [];
            }
            
            // Filtrar solo los perfiles con rol 'reseller'
            const resellerProfiles = profilesData?.filter(p => p.role === 'reseller') || [];
            console.log(`Encontrados ${resellerProfiles.length} perfiles de revendedores`);
            
            // Obtener datos de la tabla resellers usando RPC
            console.log('Obteniendo datos de resellers...');
            const { data: resellersData, error: resellersError } = await supabase
                .rpc('get_all_resellers');
                
            // Si hay un error al obtener resellers, usar solo los perfiles
            if (resellersError) {
                console.error('Error al obtener resellers con RPC:', resellersError);
                console.log('Usando solo datos de perfiles para revendedores');
                
                return resellerProfiles.map(profile => ({
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

    // Actualizar información de un revendedor
    async update(id: string, updates: {
        phone?: string;
        plan_type?: string;
        plan_end_date?: string | Date;
        email?: string;
        full_name?: string;
    }) {
        try {
            console.log('Actualizando revendedor con ID:', id, 'con datos:', updates);
            
            // Formatear el teléfono si existe
            if (updates.phone && !updates.phone.startsWith('+')) {
                updates.phone = `+${updates.phone}`;
            }
            
            // Formatear la fecha si existe y es string
            let plan_end_date = updates.plan_end_date;
            if (typeof plan_end_date === 'string') {
                plan_end_date = new Date(plan_end_date).toISOString();
            } else if (plan_end_date instanceof Date) {
                plan_end_date = plan_end_date.toISOString();
            }
            
            // Primero, actualizar la información en la tabla resellers usando la función RPC
            const { data: success, error: rpcError } = await supabase
                .rpc('update_reseller_info', {
                    reseller_id: id,
                    reseller_phone: updates.phone || '',
                    reseller_plan_type: updates.plan_type || '',
                    reseller_plan_end_date: plan_end_date || null
                });
            
            if (rpcError) {
                console.error('Error al actualizar revendedor con RPC:', rpcError);
                throw rpcError;
            }
            
            // Si hay datos de perfil para actualizar (email, full_name)
            if (updates.email || updates.full_name) {
                console.log('Actualizando datos de perfil...');
                const profileUpdates: any = {};
                
                if (updates.email) profileUpdates.email = updates.email;
                if (updates.full_name) profileUpdates.full_name = updates.full_name;
                
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update(profileUpdates)
                    .eq('id', id);
                
                if (profileError) {
                    console.error('Error al actualizar perfil:', profileError);
                    throw profileError;
                }
            }
            
            // Obtener los datos actualizados del revendedor
            return await this.getById(id);
        } catch (error) {
            console.error('Error al actualizar revendedor:', error);
            throw error;
        }
    },

    // Crear un nuevo revendedor - Versión simplificada
    async create(reseller: ResellerWithPassword) {
        console.log('Iniciando creación de revendedor:', reseller);
        
        try {
            // Asegurar que el teléfono tenga el prefijo '+' si no lo tiene
            if (reseller.phone && !reseller.phone.startsWith('+')) {
                reseller.phone = `+${reseller.phone}`;
            }
            
            // Usar un valor por defecto para el plan si es 'Basic' o está vacío
            const planType = (reseller.plan_type && reseller.plan_type !== 'Basic') 
                ? reseller.plan_type 
                : '1 Mes';
            
            // 1. Crear usuario en auth.users
            console.log('Creando usuario en auth.users...');
            const { data: userData, error: userError } = await supabase.auth.signUp({
                email: reseller.email || '',
                password: reseller.password || 'password123', // Aseguramos que siempre haya una contraseña
                options: {
                    data: {
                        full_name: reseller.full_name || '',
                        phone: reseller.phone || '',
                        role: 'reseller'
                    }
                }
            });
            
            if (userError) {
                throw userError;
            }
            
            const userId = userData?.user?.id;
            if (!userId) {
                throw new Error('No se pudo obtener el ID del usuario creado');
            }
            
            console.log('Usuario creado correctamente con ID:', userId);
            
            // 2. Crear perfil en la tabla profiles directamente
            console.log('Creando perfil en la tabla profiles...');
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: userId,
                    email: reseller.email || '',
                    role: 'reseller',
                    status: 'active',
                    full_name: reseller.full_name || '',
                    phone: reseller.phone || ''
                });
            
            if (profileError) {
                console.error('Error al crear perfil:', profileError);
                throw profileError;
            }
            
            // 3. Insertar registro en la tabla resellers directamente
            console.log('Insertando registro en la tabla resellers...');
            const { data: resellerData, error: resellerError } = await supabase
                .from('resellers')
                .insert({
                    id: userId,
                    full_name: reseller.full_name || '',
                    email: reseller.email || '',
                    phone: reseller.phone || '',
                    status: 'active'
                })
                .select()
                .single();
                
            if (resellerError) {
                console.error('Error al insertar revendedor:', resellerError);
                throw resellerError;
            }
            
            console.log('Revendedor creado correctamente:', resellerData);
            
            // 4. Forzar una recarga de los datos
            await this.getAll(true);
            
            return resellerData as Reseller;
        } catch (error) {
            console.error('Error al crear revendedor:', error);
            throw error;
        }
    },

    // Actualizar un revendedor existente - Versión simplificada con RPC
    async update(id: string, updates: Partial<NewReseller>) {
        console.log('Iniciando actualización de revendedor:', { id, updates });
        
        try {
            // Formatear el teléfono si existe
            if (updates.phone && !updates.phone.startsWith('+')) {
                updates.phone = `+${updates.phone}`;
            }
            
            // Formatear la fecha si existe
            let plan_end_date: string | null = null;
            if (updates.plan_end_date) {
                if (typeof updates.plan_end_date === 'string') {
                    plan_end_date = new Date(updates.plan_end_date).toISOString();
                } else if (updates.plan_end_date instanceof Date) {
                    plan_end_date = updates.plan_end_date.toISOString();
                }
            }
            
            // Actualizar el nombre completo si se proporciona
            if (updates.full_name) {
                console.log('Actualizando nombre con RPC update_profile_name...');
                const { error: nameError } = await supabase
                    .rpc('update_profile_name', {
                        user_id: id,
                        new_name: updates.full_name
                    });
                
                if (nameError) {
                    console.error('Error al actualizar nombre con RPC:', nameError);
                    // No lanzamos error, continuamos con las otras actualizaciones
                } else {
                    console.log('Nombre actualizado correctamente');
                }
            }
            
            // Prepara solo los campos realmente modificados
            // Siempre envía los 4 parámetros esperados por la función SQL
            const rpcPayload = {
                reseller_id: id,
                reseller_phone: (typeof updates.phone === 'string' && updates.phone.trim() !== '') ? updates.phone : null,
                reseller_plan_type: (typeof updates.plan_type === 'string' && updates.plan_type.trim() !== '') ? updates.plan_type : null,
                reseller_plan_end_date: plan_end_date || null
            };
            console.log('Actualizando información del revendedor con RPC update_reseller_info...', rpcPayload);
            const { data: rpcResult, error: rpcError } = await supabase
                .rpc('update_reseller_info', rpcPayload);
            if (rpcError) {
                console.error('Error al actualizar información del revendedor con RPC:', rpcError);
                throw rpcError;
            }
            console.log('Información del revendedor actualizada correctamente');
            
            // Actualizar email si se proporciona (en la tabla profiles)
            if (updates.email) {
                console.log('Actualizando email en profiles...');
                const { error: emailError } = await supabase
                    .from('profiles')
                    .update({ email: updates.email })
                    .eq('id', id);
                
                if (emailError) {
                    console.error('Error al actualizar email:', emailError);
                    // No lanzamos error, continuamos
                } else {
                    console.log('Email actualizado correctamente');
                }
            }
            
            // Obtener los datos actualizados del revendedor usando RPC
            console.log('Obteniendo datos actualizados del revendedor con RPC...');
            const { data: resellerData, error: getError } = await supabase
                .rpc('get_reseller_by_id', {
                    reseller_id: id
                });
            
            if (getError) {
                console.error('Error al obtener revendedor actualizado:', getError);
                // Si falla, intentamos con el método alternativo
                return await this.getById(id);
            }
            
            if (!resellerData) {
                console.warn('No se encontraron datos del revendedor actualizado');
                // Devolver un objeto con los datos de la actualización para que la UI no falle
                return {
                    id: id,
                    full_name: updates.full_name || 'Revendedor',
                    email: updates.email || 'email@ejemplo.com',
                    phone: updates.phone || '',
                    plan_type: updates.plan_type || '1 Mes',
                    plan_end_date: updates.plan_end_date || new Date().toISOString(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    status: 'active',
                    role: 'reseller'
                } as Reseller;
            }
            
            console.log('Revendedor actualizado correctamente:', resellerData);
            return resellerData as Reseller;
        } catch (error) {
            console.error('Error al actualizar revendedor:', error);
            throw error;
        }
    },

    // Eliminar un revendedor (marcar como inactivo y eliminar registro)
    async delete(id: string) {
        console.log('Iniciando eliminación de revendedor:', id);
        
        try {
            // Usar la función RPC delete_reseller para eliminar el revendedor de forma segura
            console.log('Eliminando revendedor con RPC...');
            const { data: rpcResult, error: rpcError } = await supabase
                .rpc('delete_reseller', {
                    reseller_id: id
                });
                
            if (rpcError) {
                console.error('Error al eliminar revendedor con RPC:', rpcError);
                throw rpcError;
            }
            
            if (!rpcResult.success) {
                console.error('Error al eliminar revendedor:', rpcResult.message);
                throw new Error(rpcResult.message);
            }
            
            console.log('Revendedor eliminado correctamente:', rpcResult);
            
            return { 
                success: true, 
                message: 'Revendedor eliminado correctamente',
                id: id
            };
        } catch (error) {
            console.error('Error en el proceso de eliminación de revendedor:', error);
            throw error;
        }
    },

    // Buscar revendedores por nombre o email usando RPC
    async search(query: string) {
        try {
            console.log('Buscando revendedores con RPC...');
            const { data: rpcResult, error: rpcError } = await supabase
                .rpc('search_resellers', {
                    search_query: query
                });
                
            if (rpcError) {
                console.error('Error al buscar revendedores con RPC:', rpcError);
                throw rpcError;
            }
            
            if (!rpcResult.success) {
                console.error('Error en la búsqueda de revendedores:', rpcResult.message);
                return [];
            }
            
            console.log('Revendedores encontrados con RPC:', rpcResult.data);
            return rpcResult.data || [];
        } catch (error) {
            console.error('Error en la búsqueda de revendedores:', error);
            throw error;
        }
    },
};
