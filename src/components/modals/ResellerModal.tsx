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
  const [showPassword, setShowPassword] = React.useState(false);
  // Función para calcular la fecha fin según el plan
  const calculateEndDate = (plan: string) => {
    const today = new Date();
    let result;
    
    switch (plan) {
      case 'Demo (24 Hrs)':
        result = new Date(today);
        result.setDate(today.getDate() + 1);
        break;
      case '1 Mes':
        result = new Date(today);
        result.setMonth(today.getMonth() + 1);
        break;
      case '3 Meses':
        result = new Date(today);
        result.setMonth(today.getMonth() + 3);
        break;
      case '6 Meses':
        result = new Date(today);
        result.setMonth(today.getMonth() + 6);
        break;
      case '12 Meses':
        result = new Date(today);
        result.setMonth(today.getMonth() + 12);
        break;
      default:
        result = new Date(today);
        result.setMonth(today.getMonth() + 1); // Por defecto 1 mes
    }
    
    console.log(`Calculando fecha fin para plan ${plan}: ${result.toISOString()}`);
    return result;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const [formData, setFormData] = React.useState<ResellerFormData>(() => {
    // Calcular la fecha de fin para el plan por defecto (1 Mes)
    const defaultEndDate = formatDate(calculateEndDate('1 Mes'));
    console.log('Inicializando formulario con fecha de fin por defecto:', defaultEndDate);
    
    return {
      fullName: reseller?.fullName || '',
      email: reseller?.email || '',
      password: '', // Vacío en modo edición
      phone: reseller?.phone || '',
      phoneCountry: reseller?.phoneCountry || 'co',
      plan: reseller?.plan || '1 Mes',
      endDate: reseller?.endDate || defaultEndDate
    };
  });

  React.useEffect(() => {
    // Siempre calcular la fecha de fin para el plan seleccionado
    const calculateDefaultEndDate = (plan: string) => {
      return formatDate(calculateEndDate(plan || '1 Mes'));
    };
    
    if (reseller) {
      // Modo edición
      const endDate = calculateDefaultEndDate(reseller.plan);
      console.log('Fecha calculada para edición:', endDate);
      
      setFormData({
        fullName: reseller.fullName,
        email: reseller.email,
        password: '', // Vacío en modo edición
        phone: reseller.phone || '',
        phoneCountry: reseller.phoneCountry || 'co',
        plan: reseller.plan || '1 Mes',
        endDate: endDate // Usar la fecha calculada
      });
    } else {
      // Modo creación - Calcular la fecha de fin para 1 mes por defecto
      const defaultEndDate = calculateDefaultEndDate('1 Mes');
      console.log('Fecha de fin por defecto para nuevo revendedor:', defaultEndDate);
      
      setFormData({
        fullName: '',
        email: '',
        password: '',
        phone: '',
        phoneCountry: 'co',
        plan: '1 Mes',
        endDate: defaultEndDate
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
                readOnly={isEditing}
                style={isEditing ? { backgroundColor: '#222', color: '#888', cursor: 'not-allowed' } : {}}
              />
            </div>

            {!isEditing && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-background/50 border border-border/10 rounded-lg px-3 py-1.5 text-sm pr-10"
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                  >
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
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
                  // Calcular la nueva fecha de fin basada en el plan seleccionado
                  const newEndDate = formatDate(calculateEndDate(newPlan));
                  
                  setFormData(prev => ({ 
                    ...prev, 
                    plan: newPlan,
                    endDate: newEndDate // Actualizar automáticamente la fecha de fin
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
