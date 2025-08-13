/**
 * Utilidades para formateo de precios con separador de miles y decimales
 */

/**
 * Formatea un número como precio con separador de miles y 2 decimales
 * Ejemplo: 1234567.89 -> "1,234,567.89"
 */
export const formatPrice = (price: number | string): string => {
  // Convertir a número si es string
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  // Si no es un número válido, retornar "0.00"
  if (isNaN(numPrice)) {
    return '0.00';
  }
  
  // Formatear con separador de miles y 2 decimales
  return numPrice.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * Convierte un string formateado de precio a número
 * Ejemplo: "1,234,567.89" -> 1234567.89
 */
export const parsePrice = (formattedPrice: string): number => {
  // Remover comas y convertir a número
  const cleanPrice = formattedPrice.replace(/,/g, '');
  const numPrice = parseFloat(cleanPrice);
  
  // Si no es un número válido, retornar 0
  return isNaN(numPrice) ? 0 : numPrice;
};

/**
 * Valida si un string de precio es válido
 */
export const isValidPrice = (priceString: string): boolean => {
  // Remover comas para validación
  const cleanPrice = priceString.replace(/,/g, '');
  
  // Verificar que sea un número válido
  const num = parseFloat(cleanPrice);
  return !isNaN(num) && num >= 0;
};

/**
 * Formatea un precio mientras el usuario está escribiendo
 * Mantiene la posición del cursor y formatea en tiempo real
 */
export const formatPriceInput = (value: string, previousValue: string = ''): { 
  formattedValue: string; 
  cursorPosition: number; 
} => {
  // Remover todo excepto números y punto decimal
  let cleanValue = value.replace(/[^\d.]/g, '');
  
  // Asegurar solo un punto decimal
  const parts = cleanValue.split('.');
  if (parts.length > 2) {
    cleanValue = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Limitar a 2 decimales
  if (parts[1] && parts[1].length > 2) {
    cleanValue = parts[0] + '.' + parts[1].substring(0, 2);
  }
  
  // Si no hay valor, retornar cadena vacía
  if (cleanValue === '' || cleanValue === '.') {
    return { formattedValue: '', cursorPosition: 0 };
  }
  
  // Convertir a número para formatear
  const numValue = parseFloat(cleanValue);
  if (isNaN(numValue)) {
    return { formattedValue: '', cursorPosition: 0 };
  }
  
  // Formatear con comas
  const formatted = formatPrice(numValue);
  
  // Calcular nueva posición del cursor
  const diff = formatted.length - value.length;
  const cursorPosition = Math.max(0, value.length + diff);
  
  return { 
    formattedValue: formatted, 
    cursorPosition 
  };
};

/**
 * Hook personalizado para manejar input de precios formateados
 */
export const usePriceInput = (initialValue: number = 0) => {
  const [displayValue, setDisplayValue] = React.useState(formatPrice(initialValue));
  const [numericValue, setNumericValue] = React.useState(initialValue);
  
  const handleChange = (newValue: string) => {
    const { formattedValue } = formatPriceInput(newValue, displayValue);
    setDisplayValue(formattedValue);
    setNumericValue(parsePrice(formattedValue));
  };
  
  const setValue = (value: number) => {
    const formatted = formatPrice(value);
    setDisplayValue(formatted);
    setNumericValue(value);
  };
  
  return {
    displayValue,
    numericValue,
    handleChange,
    setValue
  };
};

// Importar React solo si se usa el hook
declare const React: any;