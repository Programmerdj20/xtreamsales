/**
 * Utilidades para manejo de plataformas de streaming
 */

// Plataformas predefinidas
export const DEFAULT_PLATFORMS = [
  'RABBIT TV',
  'AMERICA PLAY', 
  'NETFLIX',
  'DISNEY+',
  'PRIME VIDEO',
  'MAX',
  'VIX+',
  'APPLETV',
  'PARAMOUNT+'
];

// Clave para localStorage
const CUSTOM_PLATFORMS_KEY = 'xtreamsales_custom_platforms';

/**
 * Obtiene todas las plataformas disponibles (predefinidas + personalizadas)
 */
export const getAllPlatforms = (): string[] => {
  const customPlatforms = getCustomPlatforms();
  return [...DEFAULT_PLATFORMS, ...customPlatforms];
};

/**
 * Obtiene las plataformas personalizadas desde localStorage
 */
export const getCustomPlatforms = (): string[] => {
  try {
    const stored = localStorage.getItem(CUSTOM_PLATFORMS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error al cargar plataformas personalizadas:', error);
    return [];
  }
};

/**
 * Agrega una nueva plataforma personalizada
 */
export const addCustomPlatform = (platform: string): boolean => {
  try {
    const trimmedPlatform = platform.trim().toUpperCase();
    
    // Validar que no esté vacía
    if (!trimmedPlatform) {
      return false;
    }
    
    // Verificar que no exista ya (en predefinidas o personalizadas)
    const allPlatforms = getAllPlatforms().map(p => p.toUpperCase());
    if (allPlatforms.includes(trimmedPlatform)) {
      return false;
    }
    
    // Agregar a las personalizadas
    const customPlatforms = getCustomPlatforms();
    const updatedPlatforms = [...customPlatforms, trimmedPlatform];
    
    localStorage.setItem(CUSTOM_PLATFORMS_KEY, JSON.stringify(updatedPlatforms));
    return true;
  } catch (error) {
    console.error('Error al agregar plataforma personalizada:', error);
    return false;
  }
};

/**
 * Elimina una plataforma personalizada
 */
export const removeCustomPlatform = (platform: string): boolean => {
  try {
    const customPlatforms = getCustomPlatforms();
    const updatedPlatforms = customPlatforms.filter(
      p => p.toUpperCase() !== platform.toUpperCase()
    );
    
    localStorage.setItem(CUSTOM_PLATFORMS_KEY, JSON.stringify(updatedPlatforms));
    return true;
  } catch (error) {
    console.error('Error al eliminar plataforma personalizada:', error);
    return false;
  }
};

/**
 * Verifica si una plataforma es personalizada (no predefinida)
 */
export const isCustomPlatform = (platform: string): boolean => {
  return !DEFAULT_PLATFORMS.map(p => p.toUpperCase()).includes(platform.toUpperCase());
};