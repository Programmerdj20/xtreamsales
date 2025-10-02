// Script de diagnóstico para probar update_user_status
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Faltan variables de entorno");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdateStatus() {
    const TEST_USER_ID = ""; // COLOCA AQUÍ EL ID del usuario test88

    if (!TEST_USER_ID) {
        console.error(
            "❌ Debes colocar el ID del usuario test88 en la variable TEST_USER_ID"
        );
        return;
    }

    console.log("\n🔍 DIAGNÓSTICO DE update_user_status\n");
    console.log("=".repeat(50));

    // 1. Verificar que el usuario existe
    console.log("\n1️⃣  Verificando usuario en profiles...");
    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", TEST_USER_ID)
        .single();

    if (profileError) {
        console.error("❌ Error:", profileError);
        return;
    }

    console.log("✅ Usuario encontrado:");
    console.log("   - ID:", profile.id);
    console.log("   - Email:", profile.email);
    console.log("   - Nombre:", profile.full_name);
    console.log("   - Rol:", profile.role);
    console.log("   - Estado actual:", profile.status);

    // 2. Verificar en tabla resellers si es revendedor
    if (profile.role === "reseller") {
        console.log("\n2️⃣  Verificando en tabla resellers...");
        const { data: reseller, error: resellerError } = await supabase
            .from("resellers")
            .select("*")
            .or(`id.eq.${TEST_USER_ID},user_id.eq.${TEST_USER_ID}`)
            .maybeSingle();

        if (resellerError) {
            console.error("❌ Error:", resellerError);
        } else if (reseller) {
            console.log("✅ Revendedor encontrado:");
            console.log("   - ID:", reseller.id);
            console.log("   - user_id:", reseller.user_id);
            console.log("   - Estado:", reseller.status);
            console.log("   - Plan:", reseller.plan_type);
        } else {
            console.log("⚠️  No se encontró en tabla resellers");
        }
    }

    // 3. Intentar actualizar el estado
    console.log("\n3️⃣  Probando actualización de estado...");
    console.log("   Cambiando estado de", profile.status, "→ active");

    const { data: result, error: rpcError } = await supabase.rpc(
        "update_user_status",
        {
            input_user_id: TEST_USER_ID,
            new_status: "active",
        }
    );

    if (rpcError) {
        console.error("❌ Error en RPC:", rpcError);
        console.error("   Código:", rpcError.code);
        console.error("   Mensaje:", rpcError.message);
        console.error("   Detalles:", rpcError.details);
        console.error("   Hint:", rpcError.hint);
        return;
    }

    console.log("📊 Resultado de RPC:", result);

    if (result === true) {
        console.log("✅ La función retornó TRUE (éxito)");
    } else if (result === false) {
        console.log("❌ La función retornó FALSE (falló)");
        console.log("   Esto significa que entró en el bloque EXCEPTION");
        console.log(
            "   Necesitas revisar los logs de Supabase para ver el error exacto"
        );
    } else {
        console.log("⚠️  La función retornó:", result);
    }

    // 4. Verificar si el estado cambió
    console.log("\n4️⃣  Verificando si el estado cambió...");
    const { data: updatedProfile } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", TEST_USER_ID)
        .single();

    if (updatedProfile) {
        console.log("   Estado en profiles:", updatedProfile.status);
        if (updatedProfile.status === "active") {
            console.log("   ✅ El estado SÍ cambió en profiles");
        } else {
            console.log("   ❌ El estado NO cambió en profiles");
        }
    }

    if (profile.role === "reseller") {
        const { data: updatedReseller } = await supabase
            .from("resellers")
            .select("status")
            .or(`id.eq.${TEST_USER_ID},user_id.eq.${TEST_USER_ID}`)
            .maybeSingle();

        if (updatedReseller) {
            console.log("   Estado en resellers:", updatedReseller.status);
            if (updatedReseller.status === "active") {
                console.log("   ✅ El estado SÍ cambió en resellers");
            } else {
                console.log("   ❌ El estado NO cambió en resellers");
            }
        }
    }

    console.log("\n" + "=".repeat(50));
    console.log("\n✨ Diagnóstico completado\n");
}

testUpdateStatus().catch(console.error);
