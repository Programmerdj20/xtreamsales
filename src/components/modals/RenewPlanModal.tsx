import React from 'react';
import { X } from 'lucide-react';
import { PlanSelector } from '../ui/PlanSelector';

interface RenewPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (plan: string) => void;
}

export function RenewPlanModal({ isOpen, onClose, onSubmit }: RenewPlanModalProps) {
  const [selectedPlan, setSelectedPlan] = React.useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
      <div className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]">
        <div className="bg-[#1a1d24] rounded-xl border border-border/10 w-[300px] shadow-xl">
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="p-4 border-b border-border/10">
            <h2 className="text-lg font-medium">Renovar Plan</h2>
            <p className="text-sm text-muted-foreground">
              Selecciona el nuevo plan de suscripción.
            </p>
          </div>

          {/* Form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit(selectedPlan);
            }} 
            className="p-4 space-y-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Plan de Suscripción
              </label>
              <PlanSelector
                value={selectedPlan}
                onChange={setSelectedPlan}
                placeholder="Selecciona un plan"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border/10">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-border/10 hover:bg-[#a855f7]/20 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[#00A8FF] hover:bg-[#00A8FF]/90 text-white"
              >
                Renovar Plan
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
