import React from "react";
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
    type ResellerData,
} from "../components/modals/ResellerModal";
import { RenewPlanModal } from "../components/modals/RenewPlanModal";
import { Button } from "../components/ui/button";
import { useState, useEffect } from "react";
import { resellerService } from "../services/resellers";
import { toast } from "sonner";
import { resellerActionsService, replaceVariables, openWhatsApp } from "../services/reseller-actions";
import { ResellerActions } from "../components/resellers/ResellerActions";
import { SelectTemplateModal } from "../components/resellers/SelectTemplateModal";
import { supabase } from "../lib/supabase";

const getSummaryData = (resellers: any[]) => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const total = resellers.length;
    const active = resellers.filter((r) => r.status === "active").length;
    const expiringSoon = resellers.filter((r) => {
        const endDate = new Date(r.plan_end_date);
        return (
            endDate > today &&
            endDate <= thirtyDaysFromNow &&
            r.status === "active"
        );
    }).length;
    const expired = resellers.filter((r) => r.status === "expired").length;
    const demo = resellers.filter((r) =>
        r.plan_type.toLowerCase().includes("demo")
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
    const [resellers, setResellers] = useState<any[]>([]);
    const [filteredResellers, setFilteredResellers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedReseller, setSelectedReseller] = useState<any | null>(null);
    const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
    const [resellerToRenew, setResellerToRenew] = useState<any | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Para selección de plantilla
    const [isSelectTemplateOpen, setIsSelectTemplateOpen] = useState(false);
    const [templateTypeToSend, setTemplateTypeToSend] = useState<null | 'credenciales' | 'recordatorio'>(null);
    const [resellerToSend, setResellerToSend] = useState<any | null>(null);

    // Función para obtener la clase CSS del badge de estado
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

    // Función para obtener la etiqueta de estado en español
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
                return status;
        }
    };

    const fetchResellers = async () => {
        try {
            setIsLoading(true);
            const data = await resellerService.getAll();
            setResellers(data);
        } catch (error) {
            console.error("Error fetching resellers:", error);
            toast.error("Error al cargar los revendedores");
        } finally {
            setIsLoading(false);
        }
    };

    // Función para filtrar revendedores según búsqueda y estado
    const filterResellers = () => {
        let filtered = [...resellers];

        // Filtrar por término de búsqueda
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (reseller) =>
                    reseller.full_name?.toLowerCase().includes(searchLower) ||
                    reseller.email?.toLowerCase().includes(searchLower) ||
                    reseller.phone?.toLowerCase().includes(searchLower) ||
                    reseller.plan_type?.toLowerCase().includes(searchLower)
            );
        }

        // Filtrar por estado
        if (statusFilter !== "all") {
            filtered = filtered.filter(
                (reseller) => reseller.status === statusFilter
            );
        }

        setFilteredResellers(filtered);
    };

    // Efecto para cargar revendedores al inicio
    useEffect(() => {
        const fetchData = async () => {
            await fetchResellers();
        };
        fetchData();
    }, []);

    // Efecto para filtrar revendedores cuando cambian los filtros o los datos
    useEffect(() => {
        filterResellers();
    }, [resellers, searchTerm, statusFilter]);

    const loadResellers = async () => {
        console.log("DEPURACIÓN - Cargando revendedores con loadResellers...");
        try {
            // Forzar una recarga completa desde la base de datos
            const data = await resellerService.getAll(true); // Pasar true para forzar recarga
            console.log("DEPURACIÓN - Revendedores cargados:", data);
            
            // Actualizar el estado con los nuevos datos
            setResellers(data);
            
            // Forzar una actualización de los revendedores filtrados
            filterResellers();
            
            return data; // Devolver los datos para uso en otras funciones
        } catch (error) {
            console.error("Error loading resellers:", error);
            toast.error("Error al cargar revendedores");
        }
    };

    const handleSaveReseller = async (data: ResellerFormData) => {
        try {
            if (selectedReseller) {
                // Modo edición
                console.log('DEPURACIÓN - Datos a actualizar:', {
                    id: selectedReseller.id,
                    fullName: data.fullName,
                    phone: data.phone,
                    plan: data.plan,
                    endDate: data.endDate
                });
                
                // Asegurarse de que el teléfono tenga el formato correcto (con prefijo +)
                let formattedPhone = data.phone || '';
                if (formattedPhone && !formattedPhone.startsWith('+')) {
                    formattedPhone = '+' + formattedPhone;
                }
                
                console.log('DEPURACIÓN - Teléfono formateado para guardar:', formattedPhone);
                console.log('DEPURACIÓN - ID del revendedor:', selectedReseller.id);
                
                // Usar el servicio de revendedores para actualizar los datos
                const updateResult = await resellerService.update(selectedReseller.id, {
                    full_name: data.fullName,
                    phone: formattedPhone,
                    plan_type: data.plan || '1 Mes',
                    plan_end_date: data.endDate || new Date().toISOString()
                });
                
                console.log('DEPURACIÓN - Resultado de actualizar revendedor:', updateResult);
                
                toast.success("Revendedor actualizado exitosamente");
                
                // Cerrar el modal
                setIsModalOpen(false);
                setSelectedReseller(null);
                
                // Forzar una recarga completa de los datos usando el servicio
                await loadResellers();
            } else {
                // Modo creación
                console.log('Creando nuevo revendedor');
                await resellerService.createReseller({
                    full_name: data.fullName,
                    email: data.email,
                    phone: data.phone,
                    plan_type: data.plan,
                    plan_end_date: data.endDate,
                });
                toast.success("Revendedor creado exitosamente");
            }
            setIsModalOpen(false);
            setSelectedReseller(null);
            loadResellers(); // Recargar la lista después de crear/editar
        } catch (error) {
            console.error("Error al procesar revendedor:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Error al procesar el revendedor"
            );
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-semibold mb-6">
                Gestión de Revendedores
            </h1>
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
            {/* Filtros y acciones */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
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
                        className="bg-background/50 border border-border/10 rounded-lg px-3 py-1.5 text-sm w-[250px]"
                    />
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-[#00A8FF] hover:bg-[#00A8FF]/90 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                    <PlusCircle className="w-4 h-4" />
                    <span>Nuevo Revendedor</span>
                </button>
            </div>
            {/* Tabla de Revendedores */}
            <div className="overflow-x-auto bg-[#191c23] rounded-xl border border-border/10">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border/10 text-left">
                        <tr>
                            <th className="p-4 font-medium">Nombre</th>
                            <th className="p-4 font-medium">Email</th>
                            <th className="p-4 font-medium">Contraseña</th>
                            <th className="p-4 font-medium">Teléfono</th>
                            <th className="p-4 font-medium">Plan</th>
                            <th className="p-4 font-medium">Fin Suscripción</th>
                            <th className="text-left p-4 text-muted-foreground font-medium">Clientes</th>
                            <th className="text-left p-4 text-muted-foreground font-medium">Estado</th>
                            <th className="text-right p-4 text-muted-foreground font-medium">Acciones</th>
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
                            filteredResellers.map((reseller: any, index) => {
                                const phoneNumber = reseller.phone || '';
                                const phoneCountry = reseller.phone_country || '';
                                return (
                                    <tr 
                                      key={reseller.id} 
                                      className={`border-b border-border/10 hover:bg-muted/10 transition-colors ${index % 2 === 0 ? 'bg-transparent' : 'bg-muted/5'}`}
                                    >
                                        <td className="p-4">{reseller.full_name}</td>
                                        <td className="p-4">{reseller.email}</td>
                                        <td className="p-4">{reseller.password ? reseller.password : '-'}</td>
                                        <td className="p-4">{phoneNumber}</td>
                                        <td className="p-4">{reseller.plan_type}</td>
                                        <td className="p-4">{reseller.plan_end_date ? new Date(reseller.plan_end_date).toLocaleDateString() : ''}</td>
                                        <td className="p-4">{reseller.clients_count ?? '-'}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(reseller.status)}`}>
                                                {getStatusLabel(reseller.status)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <ResellerActions
                                                onEdit={() => {
                                                    setSelectedReseller({
                                                        id: reseller.id,
                                                        fullName: reseller.full_name,
                                                        email: reseller.email,
                                                        phone: phoneNumber,
                                                        phoneCountry: phoneCountry,
                                                        plan: reseller.plan_type || '1 Mes',
                                                        endDate: reseller.plan_end_date,
                                                        status: reseller.status,
                                                    });
                                                    setIsModalOpen(true);
                                                }}
                                                onRenew={() => {
                                                    setResellerToRenew(reseller);
                                                    setIsRenewModalOpen(true);
                                                }}
                                                onSendCredentials={() => {
                                                    setResellerToSend(reseller);
                                                    setTemplateTypeToSend('credenciales');
                                                    setIsSelectTemplateOpen(true);
                                                }}
                                                onSendReminder={() => {
                                                    setResellerToSend(reseller);
                                                    setTemplateTypeToSend('recordatorio');
                                                    setIsSelectTemplateOpen(true);
                                                }}
                                                onDelete={async () => {
                                                    if (window.confirm("¿Estás seguro de que deseas eliminar este revendedor?")) {
                                                        try {
                                                            await resellerService.delete(reseller.id);
                                                            toast.success("Revendedor eliminado exitosamente");
                                                            fetchResellers();
                                                        } catch (error) {
                                                            toast.error("Error al eliminar el revendedor");
                                                        }
                                                    }
                                                }}
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
                    try {
                        const { data: reseller, error: resellerError } = await supabase.rpc('get_reseller_by_id', { reseller_id: resellerToSend.id });
                        if (resellerError) throw new Error('No tienes permisos para leer los datos del revendedor o hubo un error de conexión.');
                        if (!reseller) throw new Error('Revendedor no encontrado');
                        let message = '';
                        if (templateTypeToSend === 'credenciales') {
                            message = replaceVariables(template.content, {
                                cliente: reseller.full_name || '',
                                plataforma: reseller.plan_type || '',
                                usuario: reseller.email || '',
                                contraseña: reseller.password || '',
                                fecha_fin: reseller.plan_end_date ? new Date(reseller.plan_end_date).toLocaleDateString() : ''
                            });
                        } else {
                            const endDate = new Date(reseller.plan_end_date);
                            const today = new Date();
                            const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                            message = replaceVariables(template.content, {
                                cliente: reseller.full_name || '',
                                plataforma: reseller.plan_type || '',
                                dias_restantes: `${daysLeft} días`,
                                fecha_fin: endDate.toLocaleDateString()
                            });
                        }
                        if (message.includes('{')) {
                            throw new Error('Faltan datos para completar el mensaje. Revisa los datos del revendedor.');
                        }
                        openWhatsApp(reseller.phone, message);
                        toast.success("Mensaje enviado por WhatsApp");
                    } catch (error) {
                        toast.error("Error al enviar el mensaje: " + (error instanceof Error ? error.message : 'Error desconocido'));
                    } finally {
                        setIsSelectTemplateOpen(false);
                        setResellerToSend(null);
                        setTemplateTypeToSend(null);
                    }
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
                        await resellerService.update(resellerToRenew.id, { plan_type: plan });
                        await resellerActionsService.renew(
                            resellerToRenew.id,
                            plan === "1 Mes"
                                ? 1
                                : plan === "3 Meses"
                                ? 3
                                : plan === "6 Meses"
                                ? 6
                                : 12
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
