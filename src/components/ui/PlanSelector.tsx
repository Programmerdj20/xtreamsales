import React, { useState, useEffect } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { planService } from '../../services/plans';
import { SubscriptionPlan } from '../../types/database.types';
import { toast } from 'sonner';

interface PlanSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export const PlanSelector: React.FC<PlanSelectorProps> = ({
  value,
  onChange,
  className = '',
  placeholder = 'Selecciona un plan'
}) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanMonths, setNewPlanMonths] = useState<number>(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar planes al montar el componente
  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      const data = await planService.getAll();
      setPlans(data);
    } catch (error) {
      console.error('Error al cargar planes:', error);
      toast.error('Error al cargar los planes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNewPlan = async () => {
    if (!newPlanName.trim()) {
      toast.error('El nombre del plan no puede estar vacío');
      return;
    }

    if (newPlanMonths < 0) {
      toast.error('El número de meses debe ser válido');
      return;
    }

    try {
      await planService.create({
        name: newPlanName.trim(),
        months: newPlanMonths,
        price: 0,
        is_custom: true
      });

      toast.success(`Plan "${newPlanName}" agregado correctamente`);

      // Recargar planes y seleccionar el nuevo
      await loadPlans();
      onChange(newPlanName.trim());

      // Resetear estado
      setNewPlanName('');
      setNewPlanMonths(1);
      setIsAddingNew(false);
      setIsDropdownOpen(false);
    } catch (error) {
      toast.error('Error al agregar el plan');
    }
  };

  const handleRemoveCustomPlan = async (plan: SubscriptionPlan, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!plan.is_custom) {
      toast.error('No se puede eliminar un plan predefinido');
      return;
    }

    try {
      await planService.delete(plan.id);
      toast.success(`Plan "${plan.name}" eliminado`);
      await loadPlans();

      // Si el plan eliminado estaba seleccionado, limpiar selección
      if (value === plan.name) {
        onChange('');
      }
    } catch (error) {
      toast.error('Error al eliminar el plan');
    }
  };

  const handleSelectPlan = (planName: string) => {
    onChange(planName);
    setIsDropdownOpen(false);
  };

  const cancelAddNew = () => {
    setIsAddingNew(false);
    setNewPlanName('');
    setNewPlanMonths(1);
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
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1d24] border border-border/10 rounded-lg shadow-xl z-50 max-h-80 overflow-auto">
          {isLoading ? (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              Cargando planes...
            </div>
          ) : (
            <>
              {/* Opción para limpiar selección */}
              {value && (
                <div
                  className="px-3 py-2 hover:bg-[#a855f7]/20 cursor-pointer text-sm text-muted-foreground border-b border-border/10"
                  onClick={() => handleSelectPlan('')}
                >
                  Limpiar selección
                </div>
              )}

              {/* Lista de planes */}
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="px-3 py-2 hover:bg-[#a855f7]/20 cursor-pointer text-sm flex items-center justify-between group"
                  onClick={() => handleSelectPlan(plan.name)}
                >
                  <div className="flex items-center gap-2">
                    <span className={value === plan.name ? 'text-[#a855f7] font-medium' : ''}>
                      {plan.name}
                    </span>
                    {value === plan.name && (
                      <Check className="w-4 h-4 text-[#a855f7]" />
                    )}
                  </div>

                  {/* Botón eliminar para planes personalizados */}
                  {plan.is_custom && (
                    <button
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                      onClick={(e) => handleRemoveCustomPlan(plan, e)}
                      title="Eliminar plan personalizado"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              {/* Sección para agregar nuevo plan */}
              <div className="border-t border-border/10">
                {!isAddingNew ? (
                  <div
                    className="px-3 py-2 hover:bg-[#00A8FF]/20 cursor-pointer text-sm text-[#00A8FF] flex items-center"
                    onClick={() => setIsAddingNew(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar plan
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    <input
                      type="text"
                      value={newPlanName}
                      onChange={(e) => setNewPlanName(e.target.value)}
                      placeholder="Nombre del plan (ej: 24 Meses)"
                      className="w-full bg-background/50 border border-border/10 rounded px-2 py-1 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <input
                      type="number"
                      value={newPlanMonths}
                      onChange={(e) => setNewPlanMonths(parseInt(e.target.value) || 1)}
                      placeholder="Número de meses"
                      min="0"
                      className="w-full bg-background/50 border border-border/10 rounded px-2 py-1 text-sm"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddNewPlan();
                        } else if (e.key === 'Escape') {
                          cancelAddNew();
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddNewPlan}
                        className="flex-1 bg-[#00A8FF] hover:bg-[#00A8FF]/90 text-white px-2 py-1 rounded text-sm flex items-center justify-center gap-1"
                        title="Agregar"
                      >
                        <Check className="w-4 h-4" />
                        <span>Agregar</span>
                      </button>
                      <button
                        onClick={cancelAddNew}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-sm"
                        title="Cancelar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Presiona Enter para agregar o Escape para cancelar
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
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