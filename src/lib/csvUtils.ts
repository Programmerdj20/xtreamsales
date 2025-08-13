import { ClientData, ClientFormData } from '../services/clients';

/**
 * Utilidades para exportar e importar datos de clientes en formato CSV
 */

// Campos que se exportarán/importarán en el CSV
export const CSV_HEADERS = [
  'cliente',
  'whatsapp', 
  'plataforma',
  'dispositivos',
  'precio',
  'usuario',
  'contraseña',
  'fecha_inicio',
  'fecha_fin',
  'plan',
  'observacion'
];

// Mapeo de headers a nombres en español para el CSV
export const CSV_HEADER_LABELS = {
  'cliente': 'Cliente',
  'whatsapp': 'WhatsApp',
  'plataforma': 'Plataforma', 
  'dispositivos': 'Dispositivos',
  'precio': 'Precio',
  'usuario': 'Usuario',
  'contraseña': 'Contraseña',
  'fecha_inicio': 'Fecha Inicio',
  'fecha_fin': 'Fecha Fin',
  'plan': 'Plan',
  'observacion': 'Observación'
};

/**
 * Convierte datos de clientes a formato CSV
 */
export const exportToCSV = (clients: ClientData[], filename?: string): void => {
  // Crear header en español
  const headers = CSV_HEADERS.map(key => CSV_HEADER_LABELS[key as keyof typeof CSV_HEADER_LABELS]);
  
  // Convertir datos a filas CSV
  const rows = clients.map(client => {
    return CSV_HEADERS.map(key => {
      const value = client[key as keyof ClientData];
      
      // Manejar valores especiales
      if (value === null || value === undefined) {
        return '';
      }
      
      // Escapar comillas y agregar comillas si el valor contiene comas
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    });
  });
  
  // Combinar header y filas
  const csvContent = [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');
  
  // Crear y descargar archivo
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename || `clientes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

/**
 * Parsea un archivo CSV y devuelve datos de clientes
 */
export const parseCSV = (csvText: string): Promise<ClientFormData[]> => {
  return new Promise((resolve, reject) => {
    try {
      const lines = csvText.trim().split('\n');
      
      if (lines.length < 2) {
        reject(new Error('El archivo CSV debe tener al menos una fila de datos además del header'));
        return;
      }
      
      // Parsear header (primera línea)
      const headerLine = lines[0];
      const headers = parseCSVLine(headerLine);
      
      // Mapear headers en español a claves internas
      const reverseHeaderMap: { [key: string]: string } = {};
      Object.entries(CSV_HEADER_LABELS).forEach(([key, label]) => {
        reverseHeaderMap[label.toLowerCase()] = key;
      });
      
      // También aceptar headers en inglés (claves directas)
      CSV_HEADERS.forEach(key => {
        reverseHeaderMap[key.toLowerCase()] = key;
      });
      
      const headerMapping = headers.map(header => 
        reverseHeaderMap[header.toLowerCase().trim()] || null
      );
      
      // Verificar que al menos los campos requeridos estén presentes
      const requiredFields = ['cliente', 'whatsapp', 'plataforma', 'usuario', 'contraseña'];
      const missingFields = requiredFields.filter(field => 
        !headerMapping.includes(field)
      );
      
      if (missingFields.length > 0) {
        reject(new Error(`Campos requeridos faltantes en el CSV: ${missingFields.join(', ')}`));
        return;
      }
      
      // Parsear datos (resto de líneas)
      const clients: ClientFormData[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue; // Saltar líneas vacías
        
        try {
          const values = parseCSVLine(lines[i]);
          
          if (values.length !== headers.length) {
            console.warn(`Línea ${i + 1}: Número de columnas no coincide con el header`);
            continue;
          }
          
          const client: any = {
            plan: '1 Mes', // Valor por defecto
            dispositivos: 1, // Valor por defecto
            precio: 0, // Valor por defecto
            fecha_inicio: new Date().toISOString().split('T')[0], // Hoy por defecto
            fecha_fin: '', // Se calculará automáticamente
            status: 'active' as const,
            observacion: ''
          };
          
          // Mapear valores del CSV a campos del cliente
          headerMapping.forEach((fieldKey, index) => {
            if (fieldKey && values[index] !== undefined) {
              let value = values[index].trim();
              
              // Conversiones específicas por tipo de campo
              if (fieldKey === 'dispositivos') {
                client[fieldKey] = parseInt(value) || 1;
              } else if (fieldKey === 'precio') {
                client[fieldKey] = parseFloat(value) || 0;
              } else if (fieldKey === 'fecha_inicio' || fieldKey === 'fecha_fin') {
                // Validar formato de fecha
                if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
                  client[fieldKey] = value;
                }
              } else {
                client[fieldKey] = value;
              }
            }
          });
          
          // Validar campos requeridos
          if (!client.cliente || !client.whatsapp || !client.plataforma || 
              !client.usuario || !client.contraseña) {
            console.warn(`Línea ${i + 1}: Campos requeridos faltantes, saltando...`);
            continue;
          }
          
          clients.push(client as ClientFormData);
        } catch (error) {
          console.warn(`Error parseando línea ${i + 1}:`, error);
          continue;
        }
      }
      
      if (clients.length === 0) {
        reject(new Error('No se encontraron datos válidos en el archivo CSV'));
        return;
      }
      
      resolve(clients);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Parsea una línea CSV teniendo en cuenta comillas y escapado
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Comilla escapada
        current += '"';
        i += 2;
      } else {
        // Inicio o fin de comillas
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // Separador de campo
      result.push(current);
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  // Agregar último campo
  result.push(current);
  
  return result;
}

/**
 * Valida el formato de un archivo antes de procesarlo
 */
export const validateCSVFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      reject(new Error('El archivo debe tener extensión .csv'));
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB máximo
      reject(new Error('El archivo es demasiado grande (máximo 5MB)'));
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text || text.trim().length === 0) {
        reject(new Error('El archivo está vacío'));
        return;
      }
      resolve(text);
    };
    
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };
    
    reader.readAsText(file, 'utf-8');
  });
};