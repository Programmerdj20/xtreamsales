import { supabase } from "../lib/supabase";
import { updateUserStatus } from "./userStatusService";
import { supabaseAdmin } from "./supabaseAdmin";

export interface User {
    id: string;
    email: string;
    full_name: string;
    role: "admin" | "reseller";
    status: "pending" | "active" | "inactive";
}

export interface AuthResponse {
    session: any;
    user: User;
}

export const authService = {
    async register(
        email: string,
        password: string,
        fullName: string,
        phone: string = ''
    ): Promise<void> {
        try {
            console.log("Iniciando registro de usuario:", { email, fullName, phone });

            // Determinar el rol y estado iniciales
            const isAdmin = email === "andreschmde@gmail.com";
            const initialRole = isAdmin ? "admin" : "reseller";
            const initialStatus = isAdmin ? "active" : "pending";

            console.log("Rol y estado iniciales:", { initialRole, initialStatus });

            // 1. Registrar el usuario en auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        role: initialRole,
                        status: initialStatus,
                        full_name: fullName,
                        phone: phone || '',
                    },
                },
            });

            if (authError) {
                if (authError.message.includes("already registered")) {
                    throw new Error("El correo electrónico ya está registrado");
                }
                throw new Error("Error al crear el usuario: " + authError.message);
            }

            if (!authData.user) {
                throw new Error("No se pudo crear el usuario");
            }

            console.log("Usuario creado en auth:", { id: authData.user.id, email: authData.user.email });

            // 2. Usar la función RPC create_user_profile para crear el perfil
            // Esta función ignora las políticas RLS y funciona correctamente
            try {
                console.log("Usando RPC create_user_profile para crear el perfil...");
                const { data: profileResult, error: profileError } = await supabase.rpc('create_user_profile', {
                    user_id: authData.user.id,
                    user_email: email,
                    user_role: initialRole,
                    user_status: initialStatus,
                    user_full_name: fullName
                });
                
                if (profileError) {
                    console.error("Error al crear perfil con RPC:", profileError);
                    throw new Error("Error al crear el perfil del usuario: " + profileError.message);
                }
                
                console.log("Perfil creado correctamente con RPC:", profileResult);
                
                // 3. Si es revendedor, crear entrada en la tabla resellers
                if (initialRole === 'reseller') {
                    try {
                        // Calcular fecha de expiración (30 días desde hoy)
                        const expirationDate = new Date();
                        expirationDate.setDate(expirationDate.getDate() + 30);
                        
                        // Crear el revendedor usando RPC
                        console.log("Creando revendedor con RPC update_user_status...");
                        const { data: statusResult, error: statusError } = await supabase
                            .rpc('update_user_status', { 
                                user_id: authData.user.id, 
                                new_status: initialStatus 
                            });
                            
                        if (statusError) {
                            console.error("Error al crear revendedor con RPC update_user_status:", statusError);
                        } else {
                            console.log("Revendedor creado correctamente con RPC update_user_status");
                        }
                        
                        // Intentar actualizar campos adicionales del revendedor
                        console.log("Actualizando datos adicionales del revendedor...");
                        try {
                            const { error: updateError } = await supabase
                                .rpc('update_reseller_info', {
                                    reseller_id: authData.user.id,
                                    reseller_phone: phone || '',
                                    reseller_plan_type: "basic",
                                    reseller_plan_end_date: expirationDate.toISOString()
                                });
                                
                            if (updateError) {
                                console.error("Error al actualizar info adicional del revendedor:", updateError);
                            } else {
                                console.log("Datos adicionales del revendedor actualizados correctamente");
                            }
                        } catch (updateError) {
                            console.error("Excepción al actualizar datos adicionales:", updateError);
                            // Continuamos a pesar del error
                        }
                    } catch (resellerError) {
                        console.error("Error al configurar revendedor:", resellerError);
                        // Continuamos a pesar del error, ya que el perfil se creó correctamente
                    }
                }
                
                console.log('Registro completado con éxito');
            } catch (error: any) {
                console.error("Error al configurar el usuario:", error);
                throw new Error("Se creó el usuario pero hubo un error al configurar su perfil: " + error.message);
            }
        } catch (error: any) {
            console.error("Error en el registro:", error);
            throw error;
        }
    },
    
    // Actualizar el rol de un usuario
    async updateUserRole(userId: string, role: "admin" | "reseller") {
        try {
            console.log(`Actualizando rol de usuario ${userId} a ${role}`);
            
            // 1. Actualizar en profiles
            const { error: profileError } = await supabase
                .from("profiles")
                .update({ role })
                .eq("id", userId);

            if (profileError) {
                console.error("Error actualizando rol en profiles:", profileError);
                throw profileError;
            }

            console.log("Rol actualizado correctamente en profiles");

            // 2. Si el nuevo rol es 'reseller', verificar si existe en la tabla resellers
            if (role === "reseller") {
                // Verificar si ya existe un revendedor con este ID
                const { data: existingReseller, error: checkResellerError } = await supabase
                    .from('resellers')
                    .select('id')
                    .eq('id', userId)
                    .maybeSingle();
                    
                console.log('Verificación de revendedor existente:', {
                    existingReseller,
                    error: checkResellerError ? checkResellerError.message : null
                });
                
                // Si no existe, obtener datos del perfil para crear el revendedor
                if (!existingReseller) {
                    const { data: profileData } = await supabase
                        .from("profiles")
                        .select("full_name")
                        .eq("id", userId)
                        .single();

                    if (profileData) {
                        // Calcular fecha de expiración (30 días desde hoy)
                        const expirationDate = new Date();
                        expirationDate.setDate(expirationDate.getDate() + 30);
                                
                        // Crear entrada en resellers
                        const { error: resellerError } = await supabase
                            .from("resellers")
                            .insert([
                                {
                                    id: userId,
                                    user_id: userId,
                                    full_name: profileData.full_name,
                                    status: "pending", // Por defecto, pendiente
                                    phone: "",
                                    plan_type: "basic",
                                    plan_end_date: expirationDate.toISOString(),
                                    created_at: new Date().toISOString()
                                }
                            ]);
                            
                        if (resellerError) {
                            console.error("Error creando revendedor:", resellerError);
                            // No lanzamos error para no interrumpir el proceso
                        } else {
                            console.log("Revendedor creado correctamente");
                        }
                    }
                }
            }

            return { success: true };
        } catch (error: any) {
            console.error("Error actualizando rol:", error);
            throw new Error("Error al actualizar el rol del usuario");
        }
    },
    
    // Actualizar el estado de un usuario (función vacía para mantener compatibilidad)
    async updateUserStatus(userId: string, status: "active" | "inactive" | "pending") {
        console.log('Esta función ha sido reemplazada por userStatusService.ts');
        return { success: true };
    },
    
    // Iniciar sesión
    async login(email: string, password: string): Promise<AuthResponse> {
        try {
            console.log(`Intentando iniciar sesión con email: ${email}`);
            
            const { data: authData, error: authError } =
                await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

            if (authError) {
                console.error("Error de autenticación:", authError);
                throw new Error("Credenciales incorrectas");
            }

            console.log("Autenticación exitosa, obteniendo datos del perfil");
            
            // Obtener datos actualizados del perfil desde la tabla profiles
            const { data: profileData, error: profileError } = await supabase
                .from("profiles")
                .select("role, status, full_name")
                .eq("id", authData.user.id)
                .single();
                
            console.log("Datos del perfil:", profileData, "Error:", profileError);
            
            // Si hay error al obtener el perfil o no existe, usar los metadatos como respaldo
            let role, status, full_name;
            
            if (profileError || !profileData) {
                console.log("Usando metadatos como respaldo");
                role = authData.user.user_metadata?.role ||
                    (email === "andreschmde@gmail.com" ? "admin" : "reseller");
                status = authData.user.user_metadata?.status ||
                    (email === "andreschmde@gmail.com" ? "active" : "pending");
                full_name = authData.user.user_metadata?.full_name ||
                    (email === "andreschmde@gmail.com" ? "Andres" : "");
            } else {
                // Usar los datos actualizados del perfil
                console.log("Usando datos actualizados del perfil");
                role = profileData.role;
                status = profileData.status;
                full_name = profileData.full_name;
            }
            
            console.log("Estado final del usuario:", { role, status, full_name });

            // Verificar si el usuario está pendiente o inactivo
            // Forzar una verificación adicional en la tabla resellers si es un revendedor
            if (role === "reseller") {
                console.log("Usuario es revendedor, verificando estado en tabla resellers");
                try {
                    // Intentar obtener el estado desde la tabla resellers
                    const { data: resellerData, error: resellerError } = await supabase
                        .from("resellers")
                        .select("status")
                        .or(`id.eq.${authData.user.id},user_id.eq.${authData.user.id}`)
                        .maybeSingle();
                        
                    console.log("Datos del revendedor:", resellerData, "Error:", resellerError);
                    
                    // Si encontramos datos en la tabla resellers, usar ese estado
                    if (!resellerError && resellerData && resellerData.status) {
                        console.log("Usando estado de la tabla resellers:", resellerData.status);
                        status = resellerData.status;
                    }
                } catch (resellerCheckError) {
                    console.error("Error verificando estado en resellers:", resellerCheckError);
                }
            }
            
            // Realizar una verificación adicional en la tabla profiles para asegurarnos
            // de tener el estado más actualizado
            try {
                console.log("Verificación adicional del estado en profiles");
                const { data: latestProfile, error: latestProfileError } = await supabase
                    .rpc('get_user_profile', { user_id: authData.user.id });
                
                if (!latestProfileError && latestProfile && latestProfile.length > 0) {
                    console.log("Datos más recientes del perfil:", latestProfile[0]);
                    // Usar el estado más reciente del perfil como fuente de verdad final
                    status = latestProfile[0].status;
                    console.log("Estado actualizado desde get_user_profile:", status);
                }
            } catch (profileCheckError) {
                console.error("Error en verificación adicional del perfil:", profileCheckError);
            }
            
            console.log("Estado final para verificación:", status);
            
            if (status === "pending") {
                console.log("Usuario pendiente de activación");
                throw new Error(
                    "Tu cuenta está pendiente de aprobación por el administrador. Por favor, espera a que tu cuenta sea activada."
                );
            }

            if (status === "inactive") {
                console.log("Usuario inactivo");
                throw new Error(
                    "Tu cuenta ha sido desactivada. Por favor, contacta al administrador para más información."
                );
            }

            console.log("Login exitoso, devolviendo datos del usuario");
            return {
                session: authData.session,
                user: {
                    id: authData.user.id,
                    email: authData.user.email || "",
                    role,
                    status,
                    full_name,
                },
            };
        } catch (error: any) {
            console.error("Error en login:", error);
            throw error;
        }
    },

    // Obtener el usuario actual
    async getCurrentUser(): Promise<User | null> {
        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (!session?.user) return null;
            
            console.log("Obteniendo datos actualizados del usuario actual");
            
            // Obtener datos actualizados del perfil desde la tabla profiles
            const { data: profileData, error: profileError } = await supabase
                .from("profiles")
                .select("role, status, full_name")
                .eq("id", session.user.id)
                .single();
                
            console.log("Datos del perfil actual:", profileData, "Error:", profileError);
            
            // Si hay error al obtener el perfil o no existe, usar los metadatos como respaldo
            let role, status, full_name;
            
            if (profileError || !profileData) {
                console.log("Usando metadatos como respaldo para usuario actual");
                role = session.user.user_metadata?.role ||
                    (session.user.email === "andreschmde@gmail.com" ? "admin" : "reseller");
                status = session.user.user_metadata?.status ||
                    (session.user.email === "andreschmde@gmail.com" ? "active" : "pending");
                full_name = session.user.user_metadata?.full_name ||
                    (session.user.email === "andreschmde@gmail.com" ? "Andres" : "");
            } else {
                // Usar los datos actualizados del perfil
                console.log("Usando datos actualizados del perfil para usuario actual");
                role = profileData.role;
                status = profileData.status;
                full_name = profileData.full_name;
            }
            
            console.log("Estado final del usuario actual:", { role, status, full_name });

            return {
                id: session.user.id,
                email: session.user.email || "",
                role,
                status,
                full_name,
            };
        } catch (error) {
            console.error("Error obteniendo usuario actual:", error);
            return null;
        }
    },

    // Cerrar sesión
    async logout() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            window.location.href = "/";
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
            throw new Error("Error al cerrar sesión");
        }
    },
};

export default authService;
