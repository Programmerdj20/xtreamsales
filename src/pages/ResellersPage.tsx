import React from 'react';
import { Users, UserCheck, AlertTriangle, UserX, Gift, PlusCircle } from 'lucide-react';
import { ResellerModal, type ResellerFormData, type ResellerData } from '../components/modals/ResellerModal';
import { RenewPlanModal } from '../components/modals/RenewPlanModal';
import { Button } from "../components/ui/button";
import { useState, useEffect } from 'react';
import { resellerService } from '../services/resellers';
import { toast } from 'sonner';
import { resellerActionsService } from '../services/reseller-actions';
import { ResellerActions } from "../components/resellers/ResellerActions";

const getSummaryData = (resellers: any[]) => {
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  const total = resellers.length;
  const active = resellers.filter(r => r.status === 'active').length;
  const expiringSoon = resellers.filter(r => {
    const endDate = new Date(r.plan_end_date);
    return endDate > today && endDate <= thirtyDaysFromNow && r.status === 'active';
  }).length;
  const expired = resellers.filter(r => r.status === 'expired').length;
  const demo = resellers.filter(r => r.plan_type.toLowerCase().includes('demo')).length;

  return [
    { title: 'Total Revendedores', value: total.toString(), Icon: Users, color: 'text-blue-400' },
    { title: 'Activos', value: active.toString(), Icon: UserCheck, color: 'text-green-400' },
    { title: 'Próximos a Vencer', value: expiringSoon.toString(), Icon: AlertTriangle, color: 'text-yellow-400' },
    { title: 'Vencidos', value: expired.toString(), Icon: UserX, color: 'text-red-400' },
    { title: 'Cuentas Demo', value: demo.toString(), Icon: Gift, color: 'text-purple-400' },
  ];
};

const ResellersPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resellers, setResellers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReseller, setSelectedReseller] = useState<any | null>(null);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [resellerToRenew, setResellerToRenew] = useState<any | null>(null);

  const fetchResellers = async () => {
    try {
      setIsLoading(true);
      const data = await resellerService.getAll();
      setResellers(data);
    } catch (error) {
      console.error('Error fetching resellers:', error);
      toast.error('Error al cargar los revendedores');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchResellers();
    };
    fetchData();
  }, []);

  const loadResellers = async () => {
    console.log('Loading resellers...');
    try {
      const data = await resellerService.getAll();
      console.log('Resellers loaded:', data);
      setResellers(data);
    } catch (error) {
      console.error('Error loading resellers:', error);
      toast.error('Error al cargar revendedores');
    }
  };

  const handleSaveReseller = async (data: ResellerFormData) => {
    try {
      if (selectedReseller) {
        // Modo edición
        await resellerService.update(selectedReseller.id, {
          full_name: data.fullName,
          email: data.email,
          phone: data.phone,
          plan_type: data.plan,
          plan_end_date: data.endDate
        });
        toast.success('Revendedor actualizado exitosamente');
      } else {
        // Modo creación
        await resellerService.create({
          full_name: data.fullName,
          email: data.email,
          password: data.password,
          phone: data.phone,
          plan_type: data.plan,
          plan_end_date: data.endDate
        });
        toast.success('Revendedor creado exitosamente');
      }
      setIsModalOpen(false);
      setSelectedReseller(null);
      loadResellers(); // Recargar la lista después de crear/editar
    } catch (error) {
      console.error('Error al procesar revendedor:', error);
      toast.error(error instanceof Error ? error.message : 'Error al procesar el revendedor');
    }
  };
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Gestión de Revendedores</h1>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {getSummaryData(resellers).map((item, index) => (
          <div 
            key={index} 
            className="bg-[#1a1d24] p-4 rounded-xl border border-border/10 flex items-center justify-between"
          >
            <div>
              <h3 className="text-sm text-muted-foreground">{item.title}</h3>
              <p className={`text-2xl font-semibold mt-1 ${item.color}`}>{item.value}</p>
            </div>
            <item.Icon className={`w-5 h-5 ${item.color}`} />
          </div>
        ))}
      </div>

      {/* Lista de revendedores */}
      <div className="bg-[#1a1d24] rounded-xl border border-border/10">
        <div className="p-4 flex justify-between items-center border-b border-border/10">
          <h2 className="text-lg font-medium">Lista de Revendedores (0)</h2>
          <div className="flex items-center gap-3">
            <input 
              type="text" 
              placeholder="Buscar revendedor..." 
              className="bg-background/50 border border-border/10 rounded-lg px-3 py-1.5 text-sm w-[250px]"
            />
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-[#00A8FF] hover:bg-[#00A8FF]/90 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nuevo Revendedor</span>
            </button>
          </div>
        </div>

        {/* Tabla de Revendedores - Placeholder */}
        <table className="w-full text-sm">
          <thead className="text-left border-b border-border/10">
            <tr>
              <th className="p-4 font-medium">Nombre Completo / Empresa</th>
              <th className="p-4 font-medium">Email</th>
              <th className="p-4 font-medium">Teléfono Contacto</th>
              <th className="p-4 font-medium">Plan</th>
              <th className="p-4 font-medium">Fin Suscripción</th>
              <th className="text-left p-4 text-muted-foreground font-medium">Clientes</th>
              <th className="text-left p-4 text-muted-foreground font-medium">Estado</th>
              <th className="text-right p-4 text-muted-foreground font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            {resellers.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-4 text-center">
                  No se encontraron revendedores.
                </td>
              </tr>
            ) : (
              resellers.map((reseller) => (
                <tr key={reseller.id}>
                  <td className="p-4">{reseller.full_name}</td>
                  <td className="p-4">{reseller.email}</td>
                  <td className="p-4">{reseller.phone}</td>
                  <td className="p-4">{reseller.plan_type}</td>
                  <td className="p-4">{new Date(reseller.plan_end_date).toLocaleDateString()}</td>
                  <td className="p-4">0</td>
                  <td className="p-4">{reseller.status}</td>
                  <td className="p-4 text-right">
                    <ResellerActions 
                      onEdit={() => {
                        setSelectedReseller({
                          id: reseller.id,
                          fullName: reseller.full_name,
                          email: reseller.email,
                          phone: reseller.phone,
                          plan: reseller.plan_type,
                          endDate: reseller.plan_end_date,
                          status: reseller.status
                        });
                        setIsModalOpen(true);
                      }}
                      onRenew={() => {
                        setResellerToRenew(reseller);
                        setIsRenewModalOpen(true);
                      }}
                      onSendCredentials={async () => {
                        try {
                          await resellerActionsService.sendCredentials(reseller.id);
                          toast.success('Credenciales enviadas exitosamente');
                        } catch (error) {
                          toast.error('Error al enviar las credenciales');
                        }
                      }}
                      onSendReminder={async () => {
                        try {
                          await resellerActionsService.sendReminder(reseller.id);
                          toast.success('Recordatorio enviado exitosamente');
                        } catch (error) {
                          toast.error('Error al enviar el recordatorio');
                        }
                      }}
                      onDelete={async () => {
                        if (window.confirm('¿Estás seguro de que deseas eliminar este revendedor?')) {
                          try {
                            await resellerService.delete(reseller.id);
                            toast.success('Revendedor eliminado exitosamente');
                            fetchResellers();
                          } catch (error) {
                            toast.error('Error al eliminar el revendedor');
                          }
                        }
                      }}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Nuevo Revendedor */}
      <ResellerModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedReseller(null);
        }}
        onSubmit={handleSaveReseller}
        reseller={selectedReseller as ResellerData}
      />

      {/* Modal de Renovación de Plan */}
      <RenewPlanModal
        isOpen={isRenewModalOpen}
        onClose={() => {
          setIsRenewModalOpen(false);
          setResellerToRenew(null);
        }}
        onSubmit={async (plan) => {
          try {
            if (!resellerToRenew) return;
            
            await resellerService.update(resellerToRenew.id, {
              plan_type: plan
            });
            
            // Renovar el plan con la nueva fecha según el plan seleccionado
            await resellerActionsService.renew(resellerToRenew.id, 
              plan === '1 Mes' ? 1 : 
              plan === '3 Meses' ? 3 : 
              plan === '6 Meses' ? 6 : 
              12
            );
            
            toast.success('Plan renovado exitosamente');
            setIsRenewModalOpen(false);
            setResellerToRenew(null);
            fetchResellers();
          } catch (error) {
            console.error('Error al renovar plan:', error);
            toast.error('Error al renovar el plan');
          }
        }}
      />
    </div>
  );
};

export default ResellersPage;
