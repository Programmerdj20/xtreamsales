import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndDeletePlan() {
  try {
    // Primero, ver todos los planes
    console.log('📋 Planes actuales en la base de datos:');
    const { data: allPlans, error: fetchError } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('months', { ascending: true });

    if (fetchError) {
      console.error('Error al obtener planes:', fetchError);
      return;
    }

    allPlans.forEach(plan => {
      console.log(`  - ${plan.name} (${plan.months} meses) ${plan.is_custom ? '(Personalizado)' : '(Predefinido)'}`);
    });

    // Buscar específicamente el plan "6 Meses + 1"
    const targetPlan = allPlans.find(plan => plan.name === '6 Meses + 1');
    
    if (!targetPlan) {
      console.log('\n✅ El plan "6 Meses + 1" no existe en la base de datos.');
      return;
    }

    console.log(`\n🎯 Encontrado plan a eliminar: "${targetPlan.name}" (ID: ${targetPlan.id})`);
    console.log(`   - Meses: ${targetPlan.months}`);
    console.log(`   - Personalizado: ${targetPlan.is_custom ? 'Sí' : 'No'}`);

    // Verificar si hay clientes usando este plan
    const { data: clientsWithPlan, error: clientsError } = await supabase
      .from('clients')
      .select('id, plan')
      .eq('plan', '6 Meses + 1');

    if (clientsError) {
      console.error('Error al verificar clientes:', clientsError);
      return;
    }

    if (clientsWithPlan && clientsWithPlan.length > 0) {
      console.log(`\n⚠️  ADVERTENCIA: ${clientsWithPlan.length} cliente(s) están usando este plan:`);
      clientsWithPlan.forEach(client => {
        console.log(`   - Cliente ID: ${client.id}`);
      });
      console.log('\nNo se puede eliminar el plan porque está en uso.');
      console.log('Primero cambia estos clientes a otro plan.');
      return;
    }

    // Verificar si hay resellers usando este plan
    const { data: resellersWithPlan, error: resellersError } = await supabase
      .from('resellers')
      .select('id, plan')
      .eq('plan', '6 Meses + 1');

    if (resellersError) {
      console.error('Error al verificar resellers:', resellersError);
      return;
    }

    if (resellersWithPlan && resellersWithPlan.length > 0) {
      console.log(`\n⚠️  ADVERTENCIA: ${resellersWithPlan.length} reseller(s) están usando este plan:`);
      resellersWithPlan.forEach(reseller => {
        console.log(`   - Reseller ID: ${reseller.id}`);
      });
      console.log('\nNo se puede eliminar el plan porque está en uso.');
      console.log('Primero cambia estos resellers a otro plan.');
      return;
    }

    // Si llegamos aquí, el plan no está en uso y se puede eliminar
    console.log('\n🔄 Eliminando plan "6 Meses + 1"...');
    
    const { error: deleteError } = await supabase
      .from('subscription_plans')
      .delete()
      .eq('id', targetPlan.id);

    if (deleteError) {
      console.error('Error al eliminar el plan:', deleteError);
      return;
    }

    console.log('✅ Plan "6 Meses + 1" eliminado exitosamente de la base de datos.');

  } catch (error) {
    console.error('Error general:', error);
  }
}

// Ejecutar el script
checkAndDeletePlan().then(() => {
  console.log('\n🏁 Script terminado.');
  process.exit(0);
});