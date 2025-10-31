import parsePhoneNumber from 'libphonenumber-js';

/**
 * Formatea un número de teléfono para WhatsApp usando el formato E.164
 *
 * WhatsApp acepta números en formato E.164 CON el símbolo '+':
 * - USA: +13056345678
 * - Colombia: +573001234567
 * - México: +525512345678
 *
 * @param phone - Número de teléfono en cualquier formato
 * @returns Número formateado para WhatsApp (E.164 con '+')
 *
 * @example
 * formatPhoneForWhatsApp('+1 305-634-5678') // '+13056345678'
 * formatPhoneForWhatsApp('+57 300 123 4567') // '+573001234567'
 * formatPhoneForWhatsApp('13056345678') // '+13056345678'
 */
export function formatPhoneForWhatsApp(phone: string): string {
  if (!phone) return '';

  try {
    // Intentar parsear el número de teléfono
    const phoneNumber = parsePhoneNumber(phone);

    if (phoneNumber && phoneNumber.isValid()) {
      // Retornar formato E.164 CON el '+': +12133734253
      return phoneNumber.number;
    }

    // Si el número no es válido pero tiene el formato correcto, intentar con diferentes países
    // Esto maneja casos donde react-phone-input-2 ya guardó el número con código de país
    if (phone.startsWith('+')) {
      // Ya tiene +, solo limpiar caracteres no numéricos excepto el +
      return '+' + phone.substring(1).replace(/\D/g, '');
    }

    // Si el número ya tiene código de país (sin +), verificar si comienza con códigos conocidos
    const cleanNumber = phone.replace(/\D/g, '');
    if (cleanNumber.startsWith('1') ||
        cleanNumber.startsWith('52') ||
        cleanNumber.startsWith('57') ||
        cleanNumber.startsWith('54') ||
        cleanNumber.startsWith('55') ||
        cleanNumber.startsWith('56') ||
        cleanNumber.startsWith('58') ||
        cleanNumber.startsWith('51') ||
        cleanNumber.startsWith('50')) {
      return '+' + cleanNumber;
    }

    // Si no tiene código de país, retornar el número limpio con +
    return '+' + cleanNumber;

  } catch (error) {
    console.error('Error parsing phone number:', error);

    // Fallback: agregar + si no lo tiene
    const cleanNumber = phone.replace(/\D/g, '');
    return phone.startsWith('+') ? '+' + cleanNumber : '+' + cleanNumber;
  }
}

/**
 * Formatea un número de teléfono para mostrar en formato internacional legible
 *
 * @param phone - Número de teléfono en cualquier formato
 * @returns Número formateado para mostrar (ej: '+1 213 373 4253')
 *
 * @example
 * formatPhoneForDisplay('+12133734253') // '+1 213 373 4253'
 * formatPhoneForDisplay('573001234567') // '+57 300 123 4567'
 */
export function formatPhoneForDisplay(phone: string): string {
  if (!phone) return '';

  try {
    const phoneNumber = parsePhoneNumber(phone);

    if (phoneNumber && phoneNumber.isValid()) {
      return phoneNumber.formatInternational();
    }

    return phone;
  } catch (error) {
    console.error('Error formatting phone for display:', error);
    return phone;
  }
}
