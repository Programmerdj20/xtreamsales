import React, { useState, useEffect } from "react";
import { ClientFormData, ClientData } from "../../services/clients";
import { X, Calendar } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { calculatePlanEndDate, formatDateForInput } from '../../lib/dateUtils';
import { PlatformSelector } from '../ui/PlatformSelector';
import { PriceInput } from '../ui/PriceInput';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ClientFormData) => void;
  client?: ClientData | null;
}

export const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, onSubmit, client }) => {
  
  // Inicializar el formulario con valores por defecto o del cliente si está en modo edición
  const [formData, setFormData] = useState<ClientFormData & {phoneCountry?: string}>(() => {
    const today = new Date();
    const todayFormatted = formatDateForInput(today);
    const defaultPlan = '1 Mes';
    const defaultEndDate = formatDateForInput(calculatePlanEndDate(defaultPlan));
    
    return client ? {
      cliente: client.cliente,
      whatsapp: client.whatsapp,
      phoneCountry: 'co',
      plataforma: client.plataforma,
      dispositivos: client.dispositivos,
      precio: client.precio,
      usuario: client.usuario,
      contraseña: client.contraseña,
      fecha_inicio: client.fecha_inicio,
      fecha_fin: client.fecha_fin,
      status: client.status,
      observacion: client.observacion || "",
      plan: client.plan || defaultPlan
    } : {
      cliente: "",
      whatsapp: "",
      phoneCountry: 'co',
      plataforma: "",
      dispositivos: 1,
      precio: 0,
      usuario: "",
      contraseña: "",
      fecha_inicio: todayFormatted,
      fecha_fin: defaultEndDate,
      status: "active",
      observacion: "",
      plan: defaultPlan
    };
  });

  // Actualizar el formulario cuando cambia el cliente seleccionado
  useEffect(() => {
    if (client) {
      const defaultPlan = client.plan || '1 Mes';
      const endDate = client.fecha_fin || formatDateForInput(calculatePlanEndDate(defaultPlan));
      
      setFormData({
        cliente: client.cliente,
        whatsapp: client.whatsapp,
        phoneCountry: 'co',
        plataforma: client.plataforma,
        dispositivos: client.dispositivos,
        precio: client.precio,
        usuario: client.usuario,
        contraseña: client.contraseña,
        fecha_inicio: client.fecha_inicio,
        fecha_fin: endDate,
        status: client.status,
        observacion: client.observacion || "",
        plan: defaultPlan
      });
    } else {
      const today = new Date();
      const todayFormatted = formatDateForInput(today);
      const defaultPlan = '1 Mes';
      const defaultEndDate = formatDateForInput(calculatePlanEndDate(defaultPlan));
      
      setFormData({
        cliente: "",
        whatsapp: "",
        phoneCountry: 'co',
        plataforma: "",
        dispositivos: 1,
        precio: 0,
        usuario: "",
        contraseña: "",
        fecha_inicio: todayFormatted,
        fecha_fin: defaultEndDate,
        status: "active",
        observacion: "",
        plan: defaultPlan
      });
    }
  }, [client]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Eliminar el campo phoneCountry antes de enviar los datos
    const { phoneCountry, ...clientData } = formData;
    onSubmit(clientData);
  };

  if (!isOpen) return null;

  const isEditing = !!client;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
      <div className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]">
        <div className="bg-[#1a1d24] rounded-xl border border-border/10 w-[500px] shadow-xl">
          <div className="flex justify-between items-center p-4 border-b border-border/10">
            <h2 className="text-lg font-semibold">
              {isEditing ? "Editar Cliente" : "Nuevo Cliente"}
            </h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre del Cliente</label>
              <input
                type="text"
                value={formData.cliente}
                onChange={(e) => setFormData({...formData, cliente: e.target.value})}
                className="w-full bg-background/50 border border-border/10 rounded-lg px-3 py-1.5 text-sm hover:border-[#a855f7]/50 focus:border-[#a855f7]/50 transition-colors"
                placeholder="Nombre completo del cliente"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">WhatsApp</label>
                <PhoneInput
                  country={formData.phoneCountry}
                  value={formData.whatsapp}
                  onChange={(phone, countryData: any) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      whatsapp: phone,
                      phoneCountry: countryData.countryCode || 'co'
                    }));
                  }}
                  inputProps={{
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
                <label className="text-sm font-medium">Plataforma</label>
                <PlatformSelector
                  value={formData.plataforma}
                  onChange={(value) => setFormData({...formData, plataforma: value})}
                  placeholder="Selecciona una plataforma"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Dispositivos</label>
                <input
                  type="number"
                  min={1}
                  value={formData.dispositivos}
                  onChange={(e) => setFormData({...formData, dispositivos: parseInt(e.target.value)})}
                  className="w-full bg-background/50 border border-border/10 rounded-lg px-3 py-1.5 text-sm"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Precio</label>
                <PriceInput
                  value={formData.precio}
                  onChange={(value) => setFormData({...formData, precio: value})}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Usuario</label>
                <input
                  type="text"
                  value={formData.usuario}
                  onChange={(e) => setFormData({...formData, usuario: e.target.value})}
                  className="w-full bg-background/50 border border-border/10 rounded-lg px-3 py-1.5 text-sm hover:border-[#a855f7]/50 focus:border-[#a855f7]/50 transition-colors"
                  placeholder="Nombre de usuario"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Contraseña</label>
                <input
                  type="text"
                  value={formData.contraseña}
                  onChange={(e) => setFormData({...formData, contraseña: e.target.value})}
                  className="w-full bg-background/50 border border-border/10 rounded-lg px-3 py-1.5 text-sm hover:border-[#a855f7]/50 focus:border-[#a855f7]/50 transition-colors"
                  placeholder="Contraseña"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Plan de Suscripción</label>
              <select
                value={formData.plan}
                onChange={(e) => {
                  const newPlan = e.target.value;
                  // Calcular la nueva fecha de fin basada en el plan seleccionado
                  const newEndDate = formatDateForInput(calculatePlanEndDate(newPlan));
                  
                  setFormData(prev => ({ 
                    ...prev, 
                    plan: newPlan,
                    fecha_fin: newEndDate // Actualizar automáticamente la fecha de fin
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha Inicio</label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})}
                    className="w-full bg-background/50 border border-border/10 rounded-lg px-3 py-1.5 text-sm hover:border-[#a855f7]/50 focus:border-[#a855f7]/50 transition-colors"
                    required
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#00A8FF] pointer-events-none" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha Fin</label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.fecha_fin}
                    onChange={(e) => setFormData({...formData, fecha_fin: e.target.value})}
                    className="w-full bg-background/50 border border-border/10 rounded-lg px-3 py-1.5 text-sm hover:border-[#a855f7]/50 focus:border-[#a855f7]/50 transition-colors"
                    required
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#00A8FF] pointer-events-none" />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Estado</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as "active" | "expiring" | "expired"})}
                  className="w-full bg-background/50 border border-border/10 rounded-lg px-3 py-1.5 text-sm [&>option]:bg-[#0e121d] hover:border-[#a855f7]/50 focus:border-[#a855f7]/50 transition-colors"
                >
                  <option value="active">Activo</option>
                  <option value="expiring">Por vencer</option>
                  <option value="expired">Vencido</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Observación</label>
                <input
                  type="text"
                  value={formData.observacion || ""}
                  onChange={(e) => setFormData({...formData, observacion: e.target.value})}
                  className="w-full bg-background/50 border border-border/10 rounded-lg px-3 py-1.5 text-sm hover:border-[#a855f7]/50 focus:border-[#a855f7]/50 transition-colors"
                  placeholder="Observación (opcional)"
                />
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
                {isEditing ? "Guardar Cambios" : "Agregar Cliente"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
