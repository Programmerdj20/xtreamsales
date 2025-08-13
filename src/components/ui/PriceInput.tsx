import React, { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import { formatPrice, parsePrice, isValidPrice } from '../../lib/priceUtils';

interface PriceInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
  disabled?: boolean;
}

export const PriceInput: React.FC<PriceInputProps> = ({
  value,
  onChange,
  className = '',
  placeholder = '0.00',
  required = false,
  min = 0,
  disabled = false
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Actualizar valor mostrado cuando cambia el prop value
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value > 0 ? formatPrice(value) : '');
    }
  }, [value, isFocused]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Permitir valor vacío
    if (inputValue === '') {
      setDisplayValue('');
      onChange(0);
      return;
    }
    
    // Remover todo excepto números, puntos y comas
    let cleanValue = inputValue.replace(/[^\d.,]/g, '');
    
    // Reemplazar comas por nada para procesar
    let workingValue = cleanValue.replace(/,/g, '');
    
    // Validar formato básico
    if (workingValue === '.') {
      setDisplayValue('0.');
      return;
    }
    
    // Asegurar solo un punto decimal
    const parts = workingValue.split('.');
    if (parts.length > 2) {
      workingValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limitar a 2 decimales
    if (parts[1] && parts[1].length > 2) {
      workingValue = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    // Validar que sea un número válido
    if (workingValue && !isValidPrice(workingValue)) {
      return; // No actualizar si no es válido
    }
    
    // Formatear para mostrar (solo si no estamos en medio de escribir decimales)
    let formattedForDisplay = workingValue;
    if (workingValue && !workingValue.endsWith('.') && !workingValue.endsWith('.0')) {
      const numValue = parseFloat(workingValue);
      if (!isNaN(numValue)) {
        // Mantener formato simple mientras se escribe
        if (workingValue.includes('.')) {
          const [intPart, decPart] = workingValue.split('.');
          const formattedIntPart = parseInt(intPart).toLocaleString('en-US');
          formattedForDisplay = decPart ? `${formattedIntPart}.${decPart}` : `${formattedIntPart}.`;
        } else {
          formattedForDisplay = parseInt(workingValue).toLocaleString('en-US');
        }
      }
    }
    
    setDisplayValue(formattedForDisplay);
    
    // Convertir a número para el callback
    const numericValue = parsePrice(workingValue);
    onChange(numericValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    // Formatear valor final al perder foco
    if (value > 0) {
      setDisplayValue(formatPrice(value));
    } else if (displayValue === '' || displayValue === '0' || displayValue === '0.') {
      setDisplayValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permitir teclas de control
    const controlKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    if (controlKeys.includes(e.key)) {
      return;
    }
    
    // Permitir Ctrl+A, Ctrl+C, Ctrl+V, etc.
    if (e.ctrlKey || e.metaKey) {
      return;
    }
    
    // Permitir números
    if (/\d/.test(e.key)) {
      return;
    }
    
    // Permitir punto decimal (solo uno)
    if (e.key === '.' && !displayValue.includes('.')) {
      return;
    }
    
    // Bloquear otras teclas
    e.preventDefault();
  };

  return (
    <div className="relative">
      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`w-full bg-background/50 border border-border/10 rounded-lg pl-9 pr-3 py-1.5 text-sm hover:border-[#a855f7]/50 focus:border-[#a855f7]/50 transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${className}`}
      />
    </div>
  );
};