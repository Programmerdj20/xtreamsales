import React, { useEffect, useState } from "react";
import { Users, UserCheck, Clock, Loader2 } from "lucide-react";
import { AlertsPanel } from "../../components/dashboard/AlertsPanel";
import { ActivityPanel } from "../../components/dashboard/ActivityPanel";
import { ServiceStatusPanel } from "../../components/dashboard/ServiceStatusPanel";
// import { statsService, type DashboardStats } from '../../services/stats'; // Descomentar y adaptar si se crea un servicio de stats para revendedores
import { useAuth } from "../../contexts/AuthContext"; // Para obtener el usuario y su rol

// Definir un tipo de datos para las estadísticas del revendedor (simplificado por ahora)
interface ResellerDashboardStats {
    clients: {
        active: number;
        expiringSoon: number;
        expired: number;
    };
    alerts: any[]; // Ajustar según el tipo real de alertas
    recentActivity: any[]; // Ajustar según el tipo real de actividad
    services: any[]; // Ajustar según el tipo real de servicios
    incidents: any[]; // Ajustar según el tipo real de incidentes
}

const ResellerDashboardPage: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<ResellerDashboardStats | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadStats();
        // Actualizar estadísticas cada 10 segundos (opcional, si hay datos dinámicos)
        const interval = setInterval(() => {
            console.log("Actualizando estadísticas del revendedor...");
            loadStats();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const loadStats = async () => {
        setLoading(true);
        setError(null);
        try {
            // Aquí deberías llamar a un servicio que obtenga las estadísticas para el revendedor
            // Por ahora, simulamos datos en cero
            const data: ResellerDashboardStats = {
                clients: {
                    active: 0,
                    expiringSoon: 0,
                    expired: 0,
                },
                alerts: [],
                recentActivity: [],
                services: [],
                incidents: [],
            };
            // Si tuvieras un servicio:
            // const data = await resellerStatsService.getDashboardStats(user?.id);

            setStats(data);
        } catch (err: any) {
            console.error("Error al cargar estadísticas del revendedor:", err);
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
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold mb-6">
                    Dashboard del Revendedor
                </h2>

                {/* Tarjetas de estadísticas de clientes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-[#1a1d24] p-4 rounded-xl border border-border/10 hover:border-border/20 transition-colors">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-medium">
                                Clientes Activos
                            </h3>
                            <Users className="w-5 h-5 text-green-400" />
                        </div>
                        <p className="text-3xl font-semibold text-green-400">
                            {stats?.clients.active || 0}
                        </p>
                    </div>

                    <div className="bg-[#1a1d24] p-4 rounded-xl border border-border/10 hover:border-border/20 transition-colors">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-medium">
                                Clientes por Vencer (5 días)
                            </h3>
                            <Clock className="w-5 h-5 text-yellow-400" />
                        </div>
                        <p className="text-3xl font-semibold text-yellow-400">
                            {stats?.clients.expiringSoon || 0}
                        </p>
                    </div>

                    <div className="bg-[#1a1d24] p-4 rounded-xl border border-border/10 hover:border-border/20 transition-colors">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-medium">
                                Clientes Vencidos
                            </h3>
                            <Users className="w-5 h-5 text-red-400" />
                        </div>
                        <p className="text-3xl font-semibold text-red-400">
                            {stats?.clients.expired || 0}
                        </p>
                    </div>
                </div>

                {/* Panel de Alertas */}
                <div className="mt-6">
                    <AlertsPanel
                        alerts={stats?.alerts || []}
                        isLoading={loading}
                    />
                </div>

                {/* Panel de Actividad Reciente */}
                <div className="mt-6">
                    <ActivityPanel
                        activities={stats?.recentActivity || []}
                        isLoading={loading}
                    />
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
};

export default ResellerDashboardPage;
