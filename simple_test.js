console.log("Iniciando test...");

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

console.log("Variables de entorno:");
console.log(
    "URL:",
    process.env.VITE_SUPABASE_URL ? "✓ Configurada" : "❌ No configurada"
);
console.log(
    "KEY:",
    process.env.VITE_SUPABASE_ANON_KEY ? "✓ Configurada" : "❌ No configurada"
);

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

console.log("Cliente Supabase creado");

async function test() {
    try {
        console.log("Intentando conectar a Supabase...");

        const { data, error } = await supabase
            .from("templates")
            .select("id, name, category")
            .limit(5);

        if (error) {
            console.error("Error:", error);
            return;
        }

        console.log("Conexión exitosa!");
        console.log("Plantillas encontradas:", data.length);

        data.forEach((template) => {
            console.log(
                `- ${template.name}: ${template.category || "SIN CATEGORÍA"}`
            );
        });
    } catch (err) {
        console.error("Error en test:", err);
    }
}

test()
    .then(() => {
        console.log("Test completado");
        process.exit(0);
    })
    .catch((err) => {
        console.error("Error fatal:", err);
        process.exit(1);
    });
