import React from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { X, Calendar } from 'lucide-react';

interface ResellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ResellerFormData) => void;
  reseller?: ResellerData;
}

export interface ResellerFormData {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  phoneCountry?: string;
  plan: string;
  endDate: string;
}

export interface ResellerData extends Omit<ResellerFormData, 'password'> {
  id: string;
  status: string;
}

export function ResellerModal({ isOpen, onClose, onSubmit, reseller }: ResellerModalProps) {
  // Función para calcular la fecha fin según el plan
  const calculateEndDate = (plan: string) => {
    const today = new Date();
    switch (plan) {
      case 'Demo (24 Hrs)':
        return new Date(today.setDate(today.getDate() + 1));
      case '1 Mes':
        return new Date(today.setMonth(today.getMonth() + 1));
      case '3 Meses':
        return new Date(today.setMonth(today.getMonth() + 3));
      case '6 Meses':
        return new Date(today.setMonth(today.getMonth() + 6));
      case '12 Meses':
        return new Date(today.setMonth(today.getMonth() + 12));
      default:
        return today;
    }
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const [formData, setFormData] = React.useState<ResellerFormData>(() => ({
    fullName: reseller?.fullName || '',
    email: reseller?.email || '',
    password: '', // Vacío en modo edición
    phone: reseller?.phone || '',
    phoneCountry: reseller?.phoneCountry || 'co',
    plan: reseller?.plan || '1 Mes',
    endDate: reseller?.endDate || formatDate(calculateEndDate('1 Mes'))
  }));

  React.useEffect(() => {
    if (reseller) {
      setFormData({
        fullName: reseller.fullName,
        email: reseller.email,
        password: '', // Vacío en modo edición
        phone: reseller.phone,
        phoneCountry: reseller.phoneCountry || 'co',
        plan: reseller.plan,
        endDate: reseller.endDate
      });
    } else {
      setFormData({
        fullName: '',
        email: '',
        password: '',
        phone: '',
        phoneCountry: 'co',
        plan: '1 Mes',
        endDate: formatDate(calculateEndDate('1 Mes'))
      });
    }
  }, [reseller]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  const isEditing = !!reseller;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
      <div className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]">
        <div className="bg-[#1a1d24] rounded-xl border border-border/10 w-[400px] shadow-xl">
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <style>{`
            select option:hover {
              background-color: #a855f7 !important;
            }
          `}</style>

          <div className="p-4 border-b border-border/10">
            <h2 className="text-lg font-medium">
              {isEditing ? 'Editar Revendedor' : 'Agregar Nuevo Revendedor'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isEditing 
                ? 'Modifica la información del revendedor.' 
                : 'Completa la información del nuevo revendedor. Se creará un usuario y un perfil de revendedor.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Nombre Completo / Empresa
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full bg-background/50 border border-border/10 rounded-lg px-3 py-1.5 text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-background/50 border border-border/10 rounded-lg px-3 py-1.5 text-sm"
                required
              />
            </div>

            {!isEditing && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full bg-background/50 border border-border/10 rounded-lg px-3 py-1.5 text-sm"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" htmlFor="phone">
                Teléfono
              </label>
              <PhoneInput
                country={formData.phoneCountry}
                value={formData.phone}
                onChange={(phone, countryData: any) => {
                  setFormData(prev => ({ 
                    ...prev, 
                    phone: phone,
                    phoneCountry: countryData.countryCode || 'co'
                  }));
                }}
                inputProps={{
                  id: 'phone',
                  required: true,
                }}
                containerClass="phone-input-container"
                inputClass="w-full bg-background/50 border border-border/10 rounded-lg px-3 py-1.5 text-sm"
                buttonClass="phone-input-button"
                dropdownClass="phone-input-dropdown"
                specialLabel=""
                preferredCountries={['co', 'mx', 'pe', 'ar', 'cl', 'ec', 've']}
                enableSearch={true}
                searchPlaceholder="Buscar país..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Plan de Suscripción
              </label>
              <select
                value={formData.plan}
                onChange={(e) => {
                  const newPlan = e.target.value;
                  const newEndDate = formatDate(calculateEndDate(newPlan));
                  setFormData(prev => ({ 
                    ...prev, 
                    plan: newPlan,
                    endDate: newEndDate
                  }));
                }}
                className="w-full bg-background/50 border border-border/10 rounded-lg px-3 py-1.5 text-sm [&>option]:bg-[#0e121d]"
                required
              >
                <option>1 Mes</option>
                <option>3 Meses</option>
                <option>6 Meses</option>
                <option>12 Meses</option>
                <option>Demo (24 Hrs)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Fecha Fin Suscripción
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full bg-background/50 border border-border/10 rounded-lg px-3 py-1.5 text-sm hover:border-[#a855f7]/50 focus:border-[#a855f7]/50 transition-colors"
                  required
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#00A8FF] pointer-events-none" />
              </div>
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
                {isEditing ? 'Guardar Cambios' : 'Agregar Revendedor'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
