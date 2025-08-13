import React, { useState, useEffect } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { getAllPlatforms, addCustomPlatform, removeCustomPlatform, isCustomPlatform } from '../../lib/platformsUtils';
import { toast } from 'sonner';

interface PlatformSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  value,
  onChange,
  className = '',
  placeholder = 'Selecciona una plataforma'
}) => {
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newPlatformName, setNewPlatformName] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Cargar plataformas al montar el componente
  useEffect(() => {
    loadPlatforms();
  }, []);

  const loadPlatforms = () => {
    setPlatforms(getAllPlatforms());
  };

  const handleAddNewPlatform = () => {
    if (!newPlatformName.trim()) {
      toast.error('El nombre de la plataforma no puede estar vacío');
      return;
    }

    const success = addCustomPlatform(newPlatformName);
    if (success) {
      const addedPlatform = newPlatformName.trim().toUpperCase();
      toast.success(`Plataforma "${addedPlatform}" agregada correctamente`);
      
      // Recargar plataformas y seleccionar la nueva
      loadPlatforms();
      onChange(addedPlatform);
      
      // Resetear estado
      setNewPlatformName('');
      setIsAddingNew(false);
      setIsDropdownOpen(false);
    } else {
      toast.error('Esta plataforma ya existe o hay un error');
    }
  };

  const handleRemoveCustomPlatform = (platform: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (removeCustomPlatform(platform)) {
      toast.success(`Plataforma "${platform}" eliminada`);
      loadPlatforms();
      
      // Si la plataforma eliminada estaba seleccionada, limpiar selección
      if (value === platform) {
        onChange('');
      }
    } else {
      toast.error('Error al eliminar la plataforma');
    }
  };

  const handleSelectPlatform = (platform: string) => {
    onChange(platform);
    setIsDropdownOpen(false);
  };

  const cancelAddNew = () => {
    setIsAddingNew(false);
    setNewPlatformName('');
  };

  return (
    <div className="relative">
      {/* Dropdown principal */}
      <div
        className={`w-full bg-background/50 border border-border/10 rounded-lg px-3 py-1.5 text-sm hover:border-[#a855f7]/50 focus-within:border-[#a855f7]/50 transition-colors cursor-pointer ${className}`}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <div className="flex items-center justify-between">
          <span className={value ? 'text-white' : 'text-muted-foreground'}>
            {value || placeholder}
          </span>
          <div className="flex items-center">
            <svg
              className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Dropdown content */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1d24] border border-border/10 rounded-lg shadow-xl z-50 max-h-60 overflow-auto">
          {/* Opción para limpiar selección */}
          {value && (
            <div
              className="px-3 py-2 hover:bg-[#a855f7]/20 cursor-pointer text-sm text-muted-foreground border-b border-border/10"
              onClick={() => handleSelectPlatform('')}
            >
              Limpiar selección
            </div>
          )}
          
          {/* Lista de plataformas */}
          {platforms.map((platform) => (
            <div
              key={platform}
              className="px-3 py-2 hover:bg-[#a855f7]/20 cursor-pointer text-sm flex items-center justify-between group"
              onClick={() => handleSelectPlatform(platform)}
            >
              <div className="flex items-center">
                <span className={value === platform ? 'text-[#a855f7] font-medium' : ''}>
                  {platform}
                </span>
                {value === platform && (
                  <Check className="w-4 h-4 ml-2 text-[#a855f7]" />
                )}
              </div>
              
              {/* Botón eliminar para plataformas personalizadas */}
              {isCustomPlatform(platform) && (
                <button
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                  onClick={(e) => handleRemoveCustomPlatform(platform, e)}
                  title="Eliminar plataforma personalizada"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          {/* Sección para agregar nueva plataforma */}
          <div className="border-t border-border/10">
            {!isAddingNew ? (
              <div
                className="px-3 py-2 hover:bg-[#00A8FF]/20 cursor-pointer text-sm text-[#00A8FF] flex items-center"
                onClick={() => setIsAddingNew(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar categoría
              </div>
            ) : (
              <div className="p-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPlatformName}
                    onChange={(e) => setNewPlatformName(e.target.value)}
                    placeholder="Nombre de la nueva plataforma"
                    className="flex-1 bg-background/50 border border-border/10 rounded px-2 py-1 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNewPlatform();
                      } else if (e.key === 'Escape') {
                        cancelAddNew();
                      }
                    }}
                    autoFocus
                  />
                  <button
                    onClick={handleAddNewPlatform}
                    className="bg-[#00A8FF] hover:bg-[#00A8FF]/90 text-white px-2 py-1 rounded text-sm"
                    title="Agregar"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={cancelAddNew}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-sm"
                    title="Cancelar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Presiona Enter para agregar o Escape para cancelar
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay para cerrar dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsDropdownOpen(false);
            if (isAddingNew) {
              cancelAddNew();
            }
          }}
        />
      )}
    </div>
  );
};