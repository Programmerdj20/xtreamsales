// Script para ejecutar archivos SQL en Supabase
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY son requeridas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Función para ejecutar un archivo SQL
async function executeSqlFile(filePath) {
  try {
    console.log(`Ejecutando archivo SQL: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Ejecutar SQL usando la API de Supabase
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error(`Error al ejecutar ${filePath}:`, error);
      return false;
    }
    
    console.log(`Archivo ${filePath} ejecutado correctamente:`, data);
    return true;
  } catch (err) {
    console.error(`Error al procesar ${filePath}:`, err);
    return false;
  }
}

// Función principal
async function main() {
  const sqlDir = path.join(__dirname, 'supabase');
  const files = process.argv.slice(2);
  
  if (files.length === 0) {
    console.error('Error: Debes especificar al menos un archivo SQL para ejecutar');
    console.log('Uso: node execute_sql.js archivo1.sql archivo2.sql ...');
    process.exit(1);
  }
  
  let success = true;
  
  for (const file of files) {
    const filePath = path.join(sqlDir, file);
    if (!fs.existsSync(filePath)) {
      console.error(`Error: El archivo ${filePath} no existe`);
      success = false;
      continue;
    }
    
    const result = await executeSqlFile(filePath);
    if (!result) {
      success = false;
    }
  }
  
  if (!success) {
    console.error('Hubo errores al ejecutar uno o más archivos SQL');
    process.exit(1);
  }
  
  console.log('Todos los archivos SQL se ejecutaron correctamente');
}

main().catch(err => {
  console.error('Error en la ejecución del script:', err);
  process.exit(1);
});
