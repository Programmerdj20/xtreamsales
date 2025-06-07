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

    // Obtener un revendedor por ID
    async getById(id: string) {
        const { data, error } = await supabase
            .from("resellers")
            .select("*")
            .eq("id", id)
            .single();

        if (error) throw error;
        return data as Reseller;
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

    // Actualizar un revendedor existente - Versión simplificada
    async update(id: string, updates: Partial<NewReseller>) {
        console.log('Iniciando actualización de revendedor:', { id, updates });
        
        try {
            // Preparar los datos para actualización
            const updateData: any = {};
            
            // Manejar el nombre si se proporciona
            if (updates.full_name !== undefined) {
                updateData.full_name = updates.full_name;
            }
            
            // Manejar el teléfono si se proporciona
            if (updates.phone !== undefined) {
                // Asegurar que el teléfono tenga el prefijo '+' si no lo tiene
                let phoneWithPrefix = updates.phone;
                if (phoneWithPrefix && !phoneWithPrefix.startsWith('+')) {
                    phoneWithPrefix = `+${phoneWithPrefix}`;
                }
                updateData.phone = phoneWithPrefix;
                
                // También actualizar en profiles
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({ phone: phoneWithPrefix })
                    .eq('id', id);
                
                if (profileError) {
                    console.error('Error al actualizar teléfono en profiles:', profileError);
                }
            }
            
            // Comentamos temporalmente el manejo del plan hasta que se confirme que las columnas existen
            /*
            // Manejar el plan si se proporciona
            if (updates.plan_type !== undefined) {
                // Usar un valor por defecto si es 'Basic' o está vacío
                updateData.plan_type = (updates.plan_type && updates.plan_type !== 'Basic') 
                    ? updates.plan_type 
                    : '1 Mes';
            }
            
            // Manejar la fecha de fin del plan si se proporciona
            if (updates.plan_end_date !== undefined) {
                updateData.plan_end_date = updates.plan_end_date;
            }
            */
            
            // Si hay datos para actualizar en la tabla resellers
            if (Object.keys(updateData).length > 0) {
                console.log('Actualizando datos en tabla resellers:', updateData);
                
                const { error: updateError } = await supabase
                    .from('resellers')
                    .update(updateData)
                    .eq('id', id);
                
                if (updateError) {
                    console.error('Error al actualizar revendedor:', updateError);
                    throw updateError;
                }
            }
            
            // Forzar una recarga de los datos
            console.log('Forzando recarga de datos...');
            await this.getAll(true);
            
            // Obtener los datos actualizados
            const { data: updatedReseller, error: getError } = await supabase
                .from('resellers')
                .select('*')
                .eq('id', id)
                .single();
            
            if (getError) {
                console.error('Error al obtener datos actualizados:', getError);
                throw getError;
            }
            
            console.log('Revendedor actualizado correctamente:', updatedReseller);
            return updatedReseller as Reseller;
        } catch (error) {
            console.error('Error al actualizar revendedor:', error);
            throw error;
        }
    },

    // Eliminar un revendedor
    async delete(id: string) {
        console.log('Iniciando eliminación de revendedor:', id);
        
        try {
            // 1. Primero, actualizar el estado del perfil a 'inactive'
            console.log('Actualizando estado del perfil a inactive...');
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .update({ status: 'inactive' })
                .eq('id', id)
                .select();
                
            if (profileError) {
                console.error('Error al actualizar estado del perfil:', profileError);
                throw new Error('Error al actualizar el estado del perfil: ' + profileError.message);
            }
            
            console.log('Perfil actualizado correctamente:', profileData);
            
            // 2. Eliminar el registro de la tabla resellers
            console.log('Eliminando registro de la tabla resellers...');
            const { error: resellerError } = await supabase
                .from("resellers")
                .delete()
                .eq("id", id);

            if (resellerError) {
                console.error('Error al eliminar revendedor:', resellerError);
                throw resellerError;
            }
            
            console.log('Revendedor eliminado correctamente');
            
            return { success: true, message: 'Revendedor eliminado correctamente' };
        } catch (error) {
            console.error('Error en el proceso de eliminación de revendedor:', error);
            throw error;
        }
    },

    // Buscar revendedores por nombre o email
    async search(query: string) {
        try {
            // Buscar revendedores por nombre o email
            const { data: resellers, error } = await supabase
                .from('resellers')
                .select('*')
                .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
                .order('created_at', { ascending: false });
                
            if (error) {
                console.error('Error al buscar revendedores:', error);
                throw error;
            }
            
            return resellers || [];
        } catch (error) {
            throw error;
        }
    },
};
