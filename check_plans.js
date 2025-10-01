const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Leer variables de entorno del archivo .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  lines.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      if (value) {
        process.env[key.trim()] = value;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPlans() {
  try {
    console.log('Checking existing plans...\n');
    
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('months', { ascending: true });

    if (error) {
      console.error('Error fetching plans:', error);
      return;
    }

    if (plans && plans.length > 0) {
      console.log('Current plans in database:');
      console.log('ID\t\t\t\t\tName\t\t\tMonths\tCustom');
      console.log('─'.repeat(80));
      
      plans.forEach(plan => {
        const nameFormatted = plan.name.padEnd(20);
        console.log(`${plan.id}\t${nameFormatted}\t${plan.months}\t${plan.is_custom ? 'Yes' : 'No'}`);
      });
    } else {
      console.log('No plans found in database');
    }

    console.log('\nTesting RPC function...');
    const { data: months, error: rpcError } = await supabase.rpc('get_plan_months', { 
      plan_name: '7 Meses' 
    });

    if (rpcError) {
      console.error('Error testing RPC:', rpcError);
    } else {
      console.log('RPC test result for "7 Meses":', months);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkPlans();