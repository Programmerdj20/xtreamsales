import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    Users,
    UserCheck,
    AlertTriangle,
    UserX,
    Gift,
    PlusCircle,
} from "lucide-react";
import {
    ResellerModal,
    type ResellerFormData,
    // ResellerData is used for ResellerModal prop type, keep it if ResellerModal isn't updated
    type ResellerData,
} from "../components/modals/ResellerModal";
import { RenewPlanModal } from "../components/modals/RenewPlanModal";
import { Button } from "../components/ui/button";
import resellerService from "../services/resellers"; // Changed to default import
import { toast } from "sonner";
import { resellerActionsService, replaceVariables, openWhatsApp } from "../services/reseller-actions";
import { ResellerActions } from "../components/resellers/ResellerActions";
import { SelectTemplateModal } from "../components/resellers/SelectTemplateModal";
import { supabase } from "../lib/supabase";
import { Reseller } from "../types/database.types"; // Import Reseller type

// Helper function to get the CSS class for the status badge
const getStatusBadgeClass = (status: string) => {
    switch (status) {
        case "active":
            return "bg-green-500/20 text-green-500";
        case "pending":
            return "bg-yellow-500/20 text-yellow-500";
        case "inactive":
        case "expired":
            return "bg-red-500/20 text-red-500";
        default:
            return "bg-gray-500/20 text-gray-500";
    }
};

// Helper function to get the status label in Spanish
const getStatusLabel = (status: string) => {
    switch (status) {
        case "active":
            return "Activo";
        case "pending":
            return "Pendiente";
        case "inactive":
            return "Inactivo";
        case "expired":
            return "Vencido";
        default:
            return "Desconocido";
    }
};

const getSummaryData = (resellers: Reseller[]) => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const total = resellers.length;
    const active = resellers.filter((r) => r.status === "active").length;
    const expiringSoon = resellers.filter((r) => {
        if (!r.plan_end_date) return false;
        const endDate = new Date(r.plan_end_date);
        return (
            endDate > today &&
            endDate <= thirtyDaysFromNow &&
            r.status === "active"
        );
    }).length;
    const expired = resellers.filter((r) => r.status === "expired").length;
    const demo = resellers.filter((r) =>
        r.plan_type?.toLowerCase().includes("demo")
    ).length;

    return [
        {
            title: "Total Revendedores",
            value: total.toString(),
            Icon: Users,
            color: "text-blue-400",
        },
        {
            title: "Activos",
            value: active.toString(),
            Icon: UserCheck,
            color: "text-green-400",
        },
        {
            title: "Próximos a Vencer",
            value: expiringSoon.toString(),
            Icon: AlertTriangle,
            color: "text-yellow-400",
        },
        {
            title: "Vencidos",
            value: expired.toString(),
            Icon: UserX,
            color: "text-red-400",
        },
        {
            title: "Cuentas Demo",
            value: demo.toString(),
            Icon: Gift,
            color: "text-purple-400",
        },
    ];
};

const ResellersPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [resellers, setResellers] = useState<Reseller[]>([]);
    const [filteredResellers, setFilteredResellers] = useState<Reseller[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedReseller, setSelectedReseller] = useState<Reseller | null>(null);
    const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
    const [resellerToRenew, setResellerToRenew] = useState<Reseller | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Para selección de plantilla
    const [isSelectTemplateOpen, setIsSelectTemplateOpen] = useState(false);
    const [templateTypeToSend, setTemplateTypeToSend] = useState<null | 'credenciales' | 'recordatorio'>(null);
    const [resellerToSend, setResellerToSend] = useState<Reseller | null>(null);

    const summaryData = useMemo(() => getSummaryData(resellers), [resellers]);

    const fetchResellers = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await resellerService.getAll();
            setResellers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching resellers:", error);
            toast.error("Error al cargar los revendedores");
            setResellers([]); // Ensure resellers is an array on error
        } finally {
            setIsLoading(false);
        }
    }, []);

    const filterResellers = useCallback(() => {
        let tempResellers = [...resellers];

        // Filtrar por término de búsqueda
        if (searchTerm) {
            tempResellers = tempResellers.filter(
                (r) =>
                    r.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    r.email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filtrar por estado
        if (statusFilter !== "all") {
            tempResellers = tempResellers.filter((r) => r.status === statusFilter);
        }

        setFilteredResellers(tempResellers);
    }, [resellers, searchTerm, statusFilter]);

    // Cargar datos iniciales y configurar escucha de cambios
    const fetchData = useCallback(async () => {
        await fetchResellers();
    }, [fetchResellers]);

    useEffect(() => {
        fetchData();
    }, []);

    // Efecto para filtrar revendedores cuando cambian los filtros o los datos
    useEffect(() => {
        filterResellers();
    }, [resellers, searchTerm, statusFilter]);

    // Efecto para la suscripción a cambios en tiempo real en la tabla de revendedores
    useEffect(() => {
        // La función fetchResellers debe ser estable (envuelta en useCallback)
        const channel = supabase
            .channel('custom-resellers-channel') // Nombre único para el canal
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'resellers' }, // Escuchar todos los eventos (INSERT, UPDATE, DELETE)
                (payload) => {
                    console.log('Cambio en tiempo real recibido en la tabla resellers:', payload);
                    toast.info('Actualizando lista de revendedores...', { duration: 2000 });
                    fetchResellers(); // Vuelve a cargar los datos
                }
            )
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Conectado a Supabase Realtime para revendedores!');
                }
                if (status === 'CHANNEL_ERROR') {
                    console.error('Error en el canal de Supabase Realtime para revendedores:', err);
                    toast.error('Error en la conexión de tiempo real para revendedores.');
                }
            });

        // Función de limpieza para remover la suscripción cuando el componente se desmonte
        return () => {
            supabase.removeChannel(channel);
            console.log('Desconectado de Supabase Realtime para revendedores.');
        };
    }, [fetchResellers]); // La estabilidad de fetchResellers es crucial aquí

    const handleDeleteReseller = useCallback(async (resellerId: string) => {
        try {
            await resellerService.delete(resellerId);
            toast.success("Revendedor eliminado exitosamente");
            fetchResellers(); // Recargar la lista
        } catch (error) {
            console.error("Error deleting reseller:", error);
            const errorMessage = error instanceof Error ? error.message : "Error desconocido";
            toast.error(`Error al eliminar el revendedor: ${errorMessage}`);
        }
    }, [fetchResellers]);

    const handleSendCredentials = useCallback((reseller: Reseller) => {
        setResellerToSend(reseller);
        setTemplateTypeToSend('credenciales');
        setIsSelectTemplateOpen(true);
    }, []);

    const handleSendReminder = useCallback((reseller: Reseller) => {
        setResellerToSend(reseller);
        setTemplateTypeToSend('recordatorio');
        setIsSelectTemplateOpen(true);
    }, []);

    const handleSaveReseller = useCallback(async (data: ResellerFormData) => {
        try {
            if (selectedReseller) {
                // Actualizar revendedor existente
                const updatePayload: Partial<Reseller> = {
                    full_name: data.fullName,
                    email: data.email,
                    phone: data.phone,
                    plan_type: data.plan,
                    plan_end_date: data.endDate, // Ensure this is ISO string if service expects that
                };
                await resellerService.update(selectedReseller.id, updatePayload);
                toast.success("Revendedor actualizado exitosamente");
            } else {
                // Crear nuevo revendedor
                // Note: password from ResellerFormData is not used by createReseller service method
                await resellerService.createReseller({
                    full_name: data.fullName,
                    email: data.email,
                    phone: data.phone,
                    plan_type: data.plan,
                    plan_end_date: data.endDate, // Ensure this is ISO string
                });
                toast.success("Revendedor agregado exitosamente");
            }
            setIsModalOpen(false);
            setSelectedReseller(null);
            fetchResellers(); // Recargar la lista
        } catch (error) {
            console.error("Error saving reseller:", error);
            const errorMessage = error instanceof Error ? error.message : "Error desconocido";
            toast.error(`Error al guardar el revendedor: ${errorMessage}`);
        }
    }, [selectedReseller, fetchResellers]);

    const handleEditReseller = useCallback((reseller: Reseller) => {
        setSelectedReseller(reseller);
        setIsModalOpen(true);
    }, []);

    const handleRenewReseller = useCallback((reseller: Reseller) => {
        setResellerToRenew(reseller);
        setIsRenewModalOpen(true);
    }, []);

    return (
        <div>
            <h1 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">
                Gestión de Revendedores
            </h1>
            {/* Tarjetas de resumen */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 mb-4 sm:mb-6">
                {summaryData.map((item, index) => (
                    <div
                        key={index}
                        className="bg-[#1a1d24] p-3 sm:p-4 rounded-xl border border-border/10 flex items-center justify-between"
                    >
                        <div>
                            <h3 className="text-xs sm:text-sm text-muted-foreground">{item.title}</h3>
                            <p className={`text-xl sm:text-2xl font-semibold mt-1 ${item.color}`}>{item.value}</p>
                        </div>
                        <item.Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${item.color}`} />
                    </div>
                ))}
            </div>
            {/* Filtros y acciones */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 mb-4">
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="bg-background/50 border border-border/10 rounded-lg px-3 py-1.5 text-sm"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="active">Activos</option>
                        <option value="pending">Pendientes</option>
                        <option value="inactive">Inactivos</option>
                        <option value="expired">Vencidos</option>
                    </select>
                    <input
                        type="text"
                        placeholder="Buscar revendedor..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="bg-background/50 border border-border/10 rounded-lg px-3 py-1.5 text-sm w-full sm:w-[250px]"
                    />
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-[#00A8FF] hover:bg-[#00A8FF]/90 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 justify-center"
                >
                    <PlusCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Nuevo Revendedor</span>
                    <span className="sm:hidden">Nuevo</span>
                </button>
            </div>
            {/* Tabla de Revendedores */}
            <div className="overflow-x-auto bg-[#191c23] rounded-xl border border-border/10">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border/10 text-left">
                        <tr>
                            <th className="p-2 sm:p-4 font-medium">Nombre</th>
                            <th className="p-2 sm:p-4 font-medium hidden md:table-cell">Email</th>
                            <th className="p-2 sm:p-4 font-medium hidden lg:table-cell">Teléfono</th>
                            <th className="p-2 sm:p-4 font-medium hidden lg:table-cell">Plan</th>
                            <th className="p-2 sm:p-4 font-medium hidden md:table-cell">Fin Suscripción</th>
                            <th className="text-left p-2 sm:p-4 text-muted-foreground font-medium hidden sm:table-cell">Clientes</th>
                            <th className="text-left p-2 sm:p-4 text-muted-foreground font-medium">Estado</th>
                            <th className="text-right p-2 sm:p-4 text-muted-foreground font-medium">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                        {isLoading ? (
                            <tr>
                                <td colSpan={9} className="p-4 text-center">
                                    <div className="flex justify-center items-center space-x-2">
                                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        <span>Cargando revendedores...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredResellers.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="p-4 text-center">
                                    No se encontraron revendedores.
                                </td>
                            </tr>
                        ) : (
                            filteredResellers.map((reseller: Reseller, index) => {
                                return (
                                    <tr
                                      key={reseller.id}
                                      className={`border-b border-border/10 hover:bg-muted/10 transition-colors ${index % 2 === 0 ? 'bg-transparent' : 'bg-muted/5'}`}
                                    >
                                        <td className="p-2 sm:p-4 text-xs sm:text-sm">{reseller.full_name}</td>
                                        <td className="p-2 sm:p-4 text-xs sm:text-sm hidden md:table-cell">{reseller.email}</td>
                                        <td className="p-2 sm:p-4 text-xs sm:text-sm hidden lg:table-cell">{reseller.phone}</td>
                                        <td className="p-2 sm:p-4 text-xs sm:text-sm hidden lg:table-cell">{reseller.plan_type}</td>
                                        <td className="p-2 sm:p-4 text-xs sm:text-sm hidden md:table-cell">{reseller.plan_end_date ? new Date(reseller.plan_end_date).toLocaleDateString() : ''}</td>
                                        <td className="p-2 sm:p-4 text-xs sm:text-sm hidden sm:table-cell">{reseller.clients_count ?? 0}</td>
                                        <td className="p-2 sm:p-4">
                                            <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-full whitespace-nowrap ${getStatusBadgeClass(reseller.status)}`}>
                                                {getStatusLabel(reseller.status)}
                                            </span>
                                        </td>
                                        <td className="p-1 sm:p-4 text-right">
                                            <ResellerActions
                                                onEdit={() => handleEditReseller(reseller)}
                                                onRenew={() => handleRenewReseller(reseller)}
                                                onSendCredentials={() => handleSendCredentials(reseller)}
                                                onSendReminder={() => handleSendReminder(reseller)}
                                                onDelete={() => handleDeleteReseller(reseller.id)}
                                            />
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal de selección de plantilla para envío de mensajes */}
            <SelectTemplateModal
                isOpen={isSelectTemplateOpen}
                type={templateTypeToSend as any}
                onClose={() => setIsSelectTemplateOpen(false)}
                onSelect={async (template) => {
                    if (!resellerToSend) return;
                    // Fetch up-to-date reseller data using the service layer for consistency
                    const currentResellerData: Reseller | null = await resellerService.getById(resellerToSend.id);

                    if (!currentResellerData) throw new Error('Revendedor no encontrado o error al obtener datos.');
                    
                    let message = '';
                    if (templateTypeToSend === 'credenciales') {
                        // IMPORTANT: The 'Reseller' type does not include 'password'. 
                        // If passwords are required for this template, the Reseller type and data source need to be updated.
                        // For now, 'contraseña' will be empty or rely on data not defined in the Reseller type.
                        // This might be a bug or an incomplete feature.
                        message = replaceVariables(template.content, {
                            cliente: currentResellerData.full_name || '',
                            plataforma: currentResellerData.plan_type || '',
                            usuario: currentResellerData.email || '',
                            contraseña: (currentResellerData as any).password || '', // Unsafe access, password not in Reseller type
                            fecha_fin: currentResellerData.plan_end_date ? new Date(currentResellerData.plan_end_date).toLocaleDateString() : ''
                        });
                    } else {
                        if (!currentResellerData.plan_end_date) throw new Error('Fecha de fin de plan no disponible.');
                        const endDate = new Date(currentResellerData.plan_end_date);
                        const today = new Date();
                        const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        message = replaceVariables(template.content, {
                            cliente: currentResellerData.full_name || '',
                            plataforma: currentResellerData.plan_type || '',
                            dias_restantes: `${daysLeft} días`,
                            fecha_fin: endDate.toLocaleDateString()
                        });
                    }
                    if (message.includes('{')) {
                        throw new Error('Faltan datos para completar el mensaje. Revisa los datos del revendedor.');
                    }
                    openWhatsApp(resellerToSend.phone, message);
                    toast.success("Mensaje enviado por WhatsApp");
                }}
            />
            {/* Modal de Nuevo Revendedor */}
            <ResellerModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedReseller(null);
                }}
                onSubmit={handleSaveReseller}
                reseller={selectedReseller ? {
                    id: selectedReseller.id,
                    status: selectedReseller.status,
                    fullName: selectedReseller.full_name,
                    email: selectedReseller.email,
                    phone: selectedReseller.phone,
                    // phoneCountry is not in Reseller type; ResellerModal will use its default if needed
                    plan: selectedReseller.plan_type,
                    endDate: selectedReseller.plan_end_date ? new Date(selectedReseller.plan_end_date).toISOString().split('T')[0] : '',
                } : undefined}
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
                        await resellerService.update(resellerToRenew.id, { plan_type: plan });
                        await resellerActionsService.renew(
                            resellerToRenew.id,
                            plan
                        );
                        toast.success("Plan renovado exitosamente");
                        setIsRenewModalOpen(false);
                        setResellerToRenew(null);
                        fetchResellers();
                    } catch (error) {
                        console.error("Error al renovar plan:", error);
                        toast.error("Error al renovar el plan");
                    }
                }}
            />
        </div>
    );
};

export default ResellersPage;
