const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function fixTemplates() {
    try {
        console.log("🔧 Corrigiendo categorías de plantillas...\n");

        // Primero obtener todas las plantillas
        const { data: templates, error: fetchError } = await supabase
            .from("templates")
            .select("*");

        if (fetchError) {
            console.error("❌ Error al obtener plantillas:", fetchError);
            return;
        }

        console.log(`📊 Encontradas ${templates.length} plantillas\n`);

        // Actualizar plantillas específicas por nombre
        for (const template of templates) {
            let newCategory = null;

            // Determinar categoría basada en el nombre
            if (template.name === "Mensaje de Bienvenida") {
                newCategory = "credenciales";
            } else if (template.name === "Recordatorio de Vencimiento") {
                newCategory = "recordatorio";
            } else if (template.name === "testplantilla") {
                // Esta parece ser una plantilla de prueba, la ponemos como recordatorio
                newCategory = "recordatorio";
            } else {
                // Para otras plantillas, intentar determinar por contenido
                if (
                    template.content.includes("credenciales") ||
                    template.content.includes("USUARIO") ||
                    template.content.includes("CONTRASEÑA")
                ) {
                    newCategory = "credenciales";
                } else {
                    newCategory = "recordatorio";
                }
            }

            // Actualizar solo si la categoría es diferente
            if (template.category !== newCategory) {
                console.log(
                    `🔄 Actualizando "${template.name}": ${
                        template.category || "SIN CATEGORÍA"
                    } → ${newCategory}`
                );

                const { error: updateError } = await supabase
                    .from("templates")
                    .update({ category: newCategory })
                    .eq("id", template.id);

                if (updateError) {
                    console.error(
                        `❌ Error actualizando ${template.name}:`,
                        updateError
                    );
                } else {
                    console.log(
                        `✅ ${template.name} actualizada correctamente`
                    );
                }
            } else {
                console.log(
                    `✓ ${template.name} ya tiene la categoría correcta: ${newCategory}`
                );
            }
        }

        console.log("\n🎉 Proceso de corrección completado!");

        // Verificar resultado final
        const { data: updatedTemplates, error: finalError } = await supabase
            .from("templates")
            .select("*");

        if (!finalError) {
            console.log("\n📈 Estado final:");
            const credenciales = updatedTemplates.filter(
                (t) => t.category === "credenciales"
            );
            const recordatorios = updatedTemplates.filter(
                (t) => t.category === "recordatorio"
            );

            console.log(`   Credenciales: ${credenciales.length}`);
            console.log(`   Recordatorios: ${recordatorios.length}`);

            credenciales.forEach((t) =>
                console.log(`     - ${t.name} (credenciales)`)
            );
            recordatorios.forEach((t) =>
                console.log(`     - ${t.name} (recordatorio)`)
            );
        }
    } catch (error) {
        console.error("❌ Error general:", error);
    }
}

fixTemplates();
