import { supabase } from "../lib/supabase";
import type { Reseller, NewReseller } from "../types/database.types";

export const resellerService = {
    // Obtener todos los revendedores
    async getAll() {
        console.log('Fetching resellers...');
        
        try {
            // Enfoque combinado: obtener datos tanto de profiles como de resellers
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
            
            // Obtener datos detallados de la tabla resellers
            console.log('Obteniendo datos de la tabla resellers...');
            const { data: resellersData, error: resellersError } = await supabase
                .from('resellers')
                .select('*');
                
            if (resellersError) {
                console.error('Error al obtener datos de resellers:', resellersError);
                
                // Si no podemos obtener datos de resellers, usar solo los perfiles
                console.log('Usando solo datos de perfiles para revendedores');
                return resellerProfiles.map(profile => ({
                    id: profile.id,
                    created_at: profile.created_at,
                    full_name: profile.full_name,
                    email: profile.email,
                    phone: profile.phone || "",
                    plan_type: "Basic",
                    plan_end_date: new Date(Date.now() + 30*24*60*60*1000).toISOString(), // 30 días desde hoy
                    status: profile.status,
                })) as Reseller[];
            }
            
            console.log(`Encontrados ${resellersData?.length || 0} registros en tabla resellers`);
            
            // Combinar datos de ambas fuentes
            const result = resellerProfiles.map(profile => {
                // Buscar datos correspondientes en la tabla resellers
                const resellerData = resellersData?.find(r => 
                    r.id === profile.id || r.user_id === profile.id
                );
                
                if (resellerData) {
                    // Si encontramos datos en resellers, combinarlos con el perfil
                    return {
                        ...resellerData,
                        full_name: profile.full_name || resellerData.full_name,
                        email: profile.email,
                        status: profile.status // Usar el estado del perfil como fuente de verdad
                    };
                } else {
                    // Si no hay datos en resellers, crear un objeto con datos básicos
                    return {
                        id: profile.id,
                        user_id: profile.id,
                        created_at: profile.created_at,
                        full_name: profile.full_name,
                        email: profile.email,
                        phone: profile.phone || "",
                        plan_type: "Basic",
                        plan_end_date: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
                        status: profile.status,
                    };
                }
            });
            
            console.log(`Devolviendo ${result.length} revendedores combinados`);
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

    // Crear un nuevo revendedor
    async create(reseller: NewReseller) {
        console.log('Iniciando creación de revendedor:', reseller.email);
        
        try {
            // Verificar si el email ya existe en la tabla resellers
            const { data: existingReseller, error: checkError } = await supabase
                .from("resellers")
                .select("*", { head: true })
                .eq("email", reseller.email);

            console.log('Verificación de email existente:', { existingReseller, error: checkError });
            
            if (existingReseller) {
                throw new Error("Ya existe un revendedor con este email");
            }
            
            // 1. Crear el usuario en auth
            console.log('Creando usuario en auth...');
            const { data: authData, error: authError } = await supabase.auth.signUp(
                {
                    email: reseller.email,
                    password: reseller.password,
                    options: {
                        data: {
                            full_name: reseller.full_name,
                            role: 'reseller',
                            status: 'pending'
                        },
                    },
                }
            );

            if (authError) {
                console.error("Error al crear usuario:", authError);
                // Si el usuario ya existe, mostrar un mensaje más amigable
                if (authError.message.includes("already registered")) {
                    throw new Error(
                        "Ya existe un usuario registrado con este email"
                    );
                }
                throw authError;
            }

            if (!authData.user) {
                throw new Error("No se pudo crear el usuario");
            }
            
            console.log('Usuario creado en auth:', authData.user.id);

            // 2. Crear el perfil en la tabla profiles
            console.log('Creando perfil en tabla profiles...');
            const profileData = {
                id: authData.user.id,
                email: reseller.email,
                full_name: reseller.full_name,
                role: 'reseller',
                status: 'pending',
                created_at: new Date().toISOString()
            };
            
            const { data: profileResult, error: profileError } = await supabase
                .from('profiles')
                .insert([profileData])
                .select()
                .single();
                
            if (profileError) {
                console.error('Error al crear perfil:', profileError);
                throw new Error('Error al crear el perfil del revendedor: ' + profileError.message);
            }
            
            console.log('Perfil creado correctamente:', profileResult);

            // 3. Crear el revendedor en la tabla resellers
            console.log('Creando registro en tabla resellers...');
            const { data: resellerData, error: resellerError } = await supabase
                .from("resellers")
                .insert([
                    {
                        id: authData.user.id,
                        user_id: authData.user.id,
                        full_name: reseller.full_name,
                        email: reseller.email,
                        phone: reseller.phone,
                        plan_type: reseller.plan_type || 'Basic',
                        plan_end_date: reseller.plan_end_date || new Date(Date.now() + 30*24*60*60*1000).toISOString(),
                        status: "pending",
                    },
                ])
                .select()
                .single();

            if (resellerError) {
                console.error("Error al crear revendedor:", resellerError);
                throw resellerError;
            }
            
            console.log('Revendedor creado correctamente:', resellerData);

            return resellerData as Reseller;
        } catch (error) {
            console.error('Error en el proceso de creación de revendedor:', error);
            throw error;
        }
    },

    // Actualizar un revendedor
    async update(id: string, updates: Partial<NewReseller>) {
        const { data, error } = await supabase
            .from("resellers")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data as Reseller;
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

    // Buscar revendedores
    async search(query: string) {
        const { data, error } = await supabase
            .from("resellers")
            .select("*")
            .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data as Reseller[];
    },
};
