import { supabase } from "../lib/supabase";
import type { Template, NewTemplate } from "../types/template.types";

const DEFAULT_TEMPLATES = [
    {
        name: "Mensaje de Bienvenida",
        content:
            "Hola {cliente}, Gracias por adquirir el servicio {plataforma}. Aquí están tus credenciales:\n\nUSUARIO: {usuario}\nCONTRASEÑA: {contraseña}\nVencimiento: {fecha_fin}.\n\nPara una mejor experiencia NO COMPARTIR TU ACCESO",
        category: "credenciales" as const,
    },
    {
        name: "Recordatorio de Vencimiento",
        content:
            "Buen día estimad@ {cliente}. Te recuerdo que tu servicio {plataforma} vence en {dias_restantes} días. Vence el {fecha_fin}. Agradecemos tu preferencia, confirma tu renovación para seguir brindándote nuestros servicios.",
        category: "recordatorio" as const,
    },
];

const handleSupabaseError = (error: any) => {
    console.error("Error de Supabase:", error);
    if (error.message?.includes("does not exist")) {
        throw new Error(
            "La tabla templates no existe en la base de datos. Por favor, crea la tabla primero."
        );
    }
    throw new Error(`Error de Supabase: ${error.message} (${error.code})`);
};

export const templateService = {
    async initializeDefaultTemplates() {
        try {
            // Verificar si ya existen plantillas del sistema (owner_id es null)
            const { data: existingTemplates, error: checkError } =
                await supabase
                    .from("templates")
                    .select("*")
                    .is("owner_id", null);

            if (checkError) {
                handleSupabaseError(checkError);
            }

            console.log("Verificación de plantillas del sistema:", {
                existingTemplates,
            });

            if (!existingTemplates || existingTemplates.length === 0) {
                // Si no hay plantillas del sistema, crear las predeterminadas
                const templatesToInsert = DEFAULT_TEMPLATES.map((t) => ({
                    ...t,
                    owner_id: null,
                }));
                const { error: insertError } = await supabase
                    .from("templates")
                    .insert(templatesToInsert);

                if (insertError) {
                    handleSupabaseError(insertError);
                }

                console.log("Plantillas predeterminadas del sistema creadas");
            }
        } catch (error: any) {
            console.error("Error al inicializar plantillas:", error);
            throw error;
        }
    },

    async getAll(userId?: string) {
        try {
            let query = supabase.from("templates").select("*");

            // Si se proporciona un userId, filtrar por plantillas del sistema (owner_id es null)
            // o plantillas que pertenecen a ese usuario.
            if (userId) {
                query = query.or(`owner_id.eq.${userId},owner_id.is.null`);
            }

            const { data, error } = await query.order("created_at", {
                ascending: false,
            });

            if (error) {
                handleSupabaseError(error);
            }

            return data as Template[];
        } catch (error: any) {
            console.error("Error al obtener plantillas:", error);
            throw error;
        }
    },

    async create(template: NewTemplate, userId: string) {
        try {
            const templateWithOwner = { ...template, owner_id: userId };
            const { data, error } = await supabase
                .from("templates")
                .insert([templateWithOwner])
                .select()
                .single();

            if (error) {
                handleSupabaseError(error);
            }

            return data as Template;
        } catch (error: any) {
            console.error("Error al crear plantilla:", error);
            throw error;
        }
    },

    async update(id: string, updates: Partial<Template>, userRole?: string) {
        try {
            // Obtener la plantilla original
            const { data: template, error: fetchError } = await supabase
                .from("templates")
                .select("*")
                .eq("id", id)
                .single();
            if (fetchError) throw fetchError;
            if (!template) throw new Error("Plantilla no encontrada");

            // Verificar si es una plantilla del sistema (owner_id es null)
            const isSystemTemplate = template.owner_id === null;

            // Solo los administradores pueden editar plantillas del sistema
            if (isSystemTemplate && userRole !== "admin") {
                throw new Error(
                    "No tienes permisos para editar plantillas del sistema. Solo puedes editar tus plantillas personales."
                );
            }

            // Protección: no permitir cambiar el nombre de plantillas prediseñadas
            if (
                (template.name === "Mensaje de Bienvenida" ||
                    template.name === "Recordatorio de Vencimiento") &&
                updates.name &&
                updates.name !== template.name
            ) {
                throw new Error(
                    "No se puede cambiar el nombre de las plantillas prediseñadas. Solo puedes editar el contenido."
                );
            }

            const safeUpdates = { ...updates };
            if (
                template.name === "Mensaje de Bienvenida" ||
                template.name === "Recordatorio de Vencimiento"
            ) {
                delete safeUpdates.name;
                if (updates.category) {
                    safeUpdates.category = updates.category;
                }
            }

            console.log("Actualizando plantilla con:", safeUpdates);

            const { data, error } = await supabase
                .from("templates")
                .update(safeUpdates)
                .eq("id", id)
                .select()
                .single();

            if (error) {
                handleSupabaseError(error);
            }

            return data as Template;
        } catch (error: any) {
            console.error("Error al actualizar plantilla:", error);
            throw error;
        }
    },

    async delete(id: string, userId: string, userRole?: string) {
        try {
            const { data: template, error: fetchError } = await supabase
                .from("templates")
                .select("*")
                .eq("id", id)
                .single();

            if (fetchError) throw fetchError;
            if (!template) throw new Error("Plantilla no encontrada");

            // Verificar si es una plantilla del sistema
            const isSystemTemplate = template.owner_id === null;

            // Solo los administradores pueden eliminar plantillas del sistema
            if (isSystemTemplate && userRole !== "admin") {
                throw new Error(
                    "No se pueden eliminar las plantillas del sistema."
                );
            }

            // Los resellers solo pueden eliminar sus propias plantillas
            if (!isSystemTemplate && template.owner_id !== userId && userRole !== "admin") {
                throw new Error(
                    "No tienes permiso para eliminar esta plantilla."
                );
            }

            const { error: deleteError } = await supabase
                .from("templates")
                .delete()
                .eq("id", id);

            if (deleteError) throw deleteError;
        } catch (error) {
            console.error("Error al eliminar la plantilla:", error);
            throw error;
        }
    },
};
