const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function checkTemplates() {
    try {
        console.log("🔍 Verificando estado de las plantillas...\n");

        // Verificar estructura de la tabla
        const { data: templates, error } = await supabase
            .from("templates")
            .select("*");

        if (error) {
            console.error("❌ Error al obtener plantillas:", error);
            return;
        }

        console.log("📊 Plantillas encontradas:");
        console.log("Total:", templates.length);
        console.log("\nDetalle de cada plantilla:");

        templates.forEach((template, index) => {
            console.log(`\n${index + 1}. ${template.name}`);
            console.log(`   ID: ${template.id}`);
            console.log(
                `   Categoría: ${template.category || "SIN CATEGORÍA"}`
            );
            console.log(`   Creado: ${template.created_at}`);
        });

        // Verificar distribución por categorías
        const credenciales = templates.filter(
            (t) => t.category === "credenciales"
        );
        const recordatorios = templates.filter(
            (t) => t.category === "recordatorio"
        );
        const sinCategoria = templates.filter((t) => !t.category);

        console.log("\n📈 Distribución por categorías:");
        console.log(`   Credenciales: ${credenciales.length}`);
        console.log(`   Recordatorios: ${recordatorios.length}`);
        console.log(`   Sin categoría: ${sinCategoria.length}`);
    } catch (error) {
        console.error("❌ Error general:", error);
    }
}

checkTemplates();
