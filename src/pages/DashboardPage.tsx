import React, { useEffect, useState } from 'react';
import { Users, UserCheck, Clock, Loader2 } from 'lucide-react';
import { AlertsPanel } from '../components/dashboard/AlertsPanel';
import { ActivityPanel } from '../components/dashboard/ActivityPanel';
import { ServiceStatusPanel } from '../components/dashboard/ServiceStatusPanel';
import { statsService, type DashboardStats } from '../services/stats';

function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
    
    // Actualizar estadísticas cada 10 segundos
    const interval = setInterval(() => {
      console.log('Actualizando estadísticas...');
      loadStats();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const data = await statsService.getDashboardStats();
      console.log('Estadísticas recibidas en DashboardPage:', data);
      console.log('Alertas recibidas:', data.alerts);
      setStats(data);
    } catch (err: any) {
      console.error('Error al cargar estadísticas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
        Error al cargar estadísticas: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-8">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Dashboard</h2>

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* SECCIÓN DE CLIENTES */}
          <div className="bg-[#1a1d24] p-3 sm:p-4 rounded-xl border border-border/10 hover:border-border/20 transition-colors">
            <div className="flex justify-between items-center mb-2 sm:mb-3">
              <h3 className="text-xs sm:text-sm font-medium">Clientes Activos</h3>
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-semibold text-green-400">{stats?.clients.active || 0}</p>
          </div>

          <div className="bg-[#1a1d24] p-3 sm:p-4 rounded-xl border border-border/10 hover:border-border/20 transition-colors">
            <div className="flex justify-between items-center mb-2 sm:mb-3">
              <h3 className="text-xs sm:text-sm font-medium">Clientes por Vencer (5 días)</h3>
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-semibold text-yellow-400">{stats?.clients.expiringSoon || 0}</p>
          </div>

          <div className="bg-[#1a1d24] p-3 sm:p-4 rounded-xl border border-border/10 hover:border-border/20 transition-colors">
            <div className="flex justify-between items-center mb-2 sm:mb-3">
              <h3 className="text-xs sm:text-sm font-medium">Clientes Vencidos</h3>
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-semibold text-red-400">{stats?.clients.expired || 0}</p>
          </div>

          {/* SECCIÓN DE REVENDEDORES */}
          <div className="bg-[#1a1d24] p-3 sm:p-4 rounded-xl border border-border/10 hover:border-border/20 transition-colors">
            <div className="flex justify-between items-center mb-2 sm:mb-3">
              <h3 className="text-xs sm:text-sm font-medium">Revendedores Activos</h3>
              <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-semibold text-green-400">{stats?.resellers.active || 0}</p>
          </div>

          <div className="bg-[#1a1d24] p-3 sm:p-4 rounded-xl border border-border/10 hover:border-border/20 transition-colors">
            <div className="flex justify-between items-center mb-2 sm:mb-3">
              <h3 className="text-xs sm:text-sm font-medium">Revendedores por Vencer (5 días)</h3>
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-semibold text-yellow-400">{stats?.resellers.expiringSoon || 0}</p>
          </div>

          <div className="bg-[#1a1d24] p-3 sm:p-4 rounded-xl border border-border/10 hover:border-border/20 transition-colors">
            <div className="flex justify-between items-center mb-2 sm:mb-3">
              <h3 className="text-xs sm:text-sm font-medium">Revendedores Vencidos</h3>
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-semibold text-red-400">{stats?.resellers.expired || 0}</p>
          </div>
        </div>

        {/* Panel de Alertas */}
        <div className="mt-6">
          <AlertsPanel alerts={stats?.alerts || []} isLoading={loading} />
        </div>

        {/* Últimos registros */}
        <div className="mt-4 sm:mt-6">
          <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Últimos Registros</h3>
          <div className="bg-card rounded-xl border border-border/10 shadow-sm overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/10 bg-muted/50">
                  <th className="text-left p-2 sm:p-4 text-muted-foreground font-medium text-xs sm:text-sm">Nombre</th>
                  <th className="text-left p-2 sm:p-4 text-muted-foreground font-medium text-xs sm:text-sm">Estado</th>
                  <th className="text-left p-2 sm:p-4 text-muted-foreground font-medium text-xs sm:text-sm hidden sm:table-cell">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {stats?.resellers.recentRegistrations.map((reseller) => (
                  <tr key={reseller.id} className="border-b border-border/10 last:border-0">
                    <td className="p-2 sm:p-4 text-xs sm:text-sm">{reseller.full_name}</td>
                    <td className="p-2 sm:p-4">
                      <span
                        className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${reseller.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}
                      >
                        {reseller.status === 'active' ? 'Activo' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="p-2 sm:p-4 text-muted-foreground text-xs sm:text-sm hidden sm:table-cell">
                      {new Date(reseller.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {(!stats?.resellers.recentRegistrations.length) && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-muted-foreground">
                      No hay registros recientes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel de Actividad Reciente */}
        <div className="mt-6">
          <ActivityPanel activities={stats?.recentActivity || []} isLoading={loading} />
        </div>

        {/* Panel de Estado del Servicio */}
        <div className="mt-6">
          <ServiceStatusPanel 
            services={stats?.services || []} 
            incidents={stats?.incidents || []} 
            isLoading={loading}
          />
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
