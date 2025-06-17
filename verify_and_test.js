const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function verifyAndTest() {
    try {
        console.log("🔍 Verificando estado actual de las plantillas...\n");

        // 1. Verificar plantillas
        const { data: templates, error: templatesError } = await supabase
            .from("templates")
            .select("*")
            .order("created_at", { ascending: false });

        if (templatesError) {
            console.error("❌ Error al obtener plantillas:", templatesError);
            return;
        }

        console.log("📊 Plantillas encontradas:");
        console.log(`Total: ${templates.length}\n`);

        templates.forEach((template, index) => {
            console.log(`${index + 1}. ${template.name}`);
            console.log(
                `   Categoría: ${template.category || "SIN CATEGORÍA"}`
            );
            console.log(
                `   Contenido: ${template.content.substring(0, 50)}...`
            );
            console.log("");
        });

        // 2. Verificar distribución por categorías
        const credenciales = templates.filter(
            (t) => t.category === "credenciales"
        );
        const recordatorios = templates.filter(
            (t) => t.category === "recordatorio"
        );
        const sinCategoria = templates.filter((t) => !t.category);

        console.log("📈 Distribución por categorías:");
        console.log(`   ✅ Credenciales: ${credenciales.length}`);
        console.log(`   ⏰ Recordatorios: ${recordatorios.length}`);
        console.log(`   ❌ Sin categoría: ${sinCategoria.length}\n`);

        // 3. Mostrar detalles de cada categoría
        if (credenciales.length > 0) {
            console.log("🔑 Plantillas de Credenciales:");
            credenciales.forEach((t) => console.log(`   - ${t.name}`));
            console.log("");
        }

        if (recordatorios.length > 0) {
            console.log("⏰ Plantillas de Recordatorio:");
            recordatorios.forEach((t) => console.log(`   - ${t.name}`));
            console.log("");
        }

        // 4. Probar filtrado como lo haría el SelectTemplateModal
        console.log("🧪 Probando filtrado del SelectTemplateModal:");

        const credencialesFiltered = templates.filter(
            (t) => t.category === "credenciales"
        );
        const recordatoriosFiltered = templates.filter(
            (t) => t.category === "recordatorio"
        );

        console.log(
            `   Para "Enviar Credenciales": ${credencialesFiltered.length} plantillas`
        );
        credencialesFiltered.forEach((t) => console.log(`     - ${t.name}`));

        console.log(
            `   Para "Enviar Recordatorio": ${recordatoriosFiltered.length} plantillas`
        );
        recordatoriosFiltered.forEach((t) => console.log(`     - ${t.name}`));

        // 5. Verificar si hay problemas
        if (sinCategoria.length > 0) {
            console.log("\n⚠️  PROBLEMA DETECTADO:");
            console.log(
                "   Hay plantillas sin categoría. Esto causará que no aparezcan en los filtros."
            );
            console.log("   Plantillas afectadas:");
            sinCategoria.forEach((t) => console.log(`     - ${t.name}`));
        }

        if (credenciales.length === 0) {
            console.log("\n⚠️  PROBLEMA DETECTADO:");
            console.log(
                "   No hay plantillas de credenciales. El botón 'Enviar Credenciales' mostrará 'No hay plantillas disponibles'."
            );
        }

        if (recordatorios.length === 0) {
            console.log("\n⚠️  PROBLEMA DETECTADO:");
            console.log(
                "   No hay plantillas de recordatorio. El botón 'Enviar Recordatorio' mostrará 'No hay plantillas disponibles'."
            );
        }

        if (
            credenciales.length > 0 &&
            recordatorios.length > 0 &&
            sinCategoria.length === 0
        ) {
            console.log("\n🎉 ¡TODO ESTÁ CORRECTO!");
            console.log(
                "   Las plantillas tienen las categorías correctas y el filtrado debería funcionar."
            );
        }
    } catch (error) {
        console.error("❌ Error general:", error);
    }
}

verifyAndTest();
