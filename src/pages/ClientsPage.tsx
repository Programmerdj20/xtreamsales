import React, { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { ClientsTable } from "../components/clients/ClientsTable";
import { ClientModal } from "../components/clients/ClientModal";
import { ClientData, ClientFormData, clientService } from "../services/clients";
import {
    PlusCircle,
    Users,
    UserCheck,
    AlertTriangle,
    UserX,
    Download,
    Upload,
} from "lucide-react";
import { RenewPlanModal } from "../components/modals/RenewPlanModal";
import { replaceVariables, openWhatsApp } from "../services/reseller-actions";
import { SelectTemplateModal } from "../components/resellers/SelectTemplateModal";
import { Template } from "../types/template.types";
import { supabase } from "../lib/supabase"; // Importar el cliente de Supabase
import { resellerService } from "../services/resellers";
import { ImportCSVModal } from "../components/modals/ImportCSVModal";
import { exportToCSV } from "../lib/csvUtils";

// Función para obtener datos de resumen
const getSummaryData = (clients: ClientData[]) => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const total = clients.length;
    const active = clients.filter((c) => c.status === "active").length;
    const expiringSoon = clients.filter((c) => {
        if (!c.fecha_fin) return false;
        const endDate = new Date(c.fecha_fin);
        return (
            endDate > today &&
            endDate <= thirtyDaysFromNow &&
            c.status === "expiring"
        );
    }).length;
    const expired = clients.filter((c) => c.status === "expired").length;

    return [
        {
            title: "Total Clientes",
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
    ];
};

const ClientsPage = () => {
    const [clients, setClients] = useState<ClientData[]>([]);
    const [filteredClients, setFilteredClients] = useState<ClientData[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<ClientData | null>(
        null
    );
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [ownerFilter, setOwnerFilter] = useState<string>("all");
    const [resellers, setResellers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Para renovación de plan
    const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
    const [clientToRenew, setClientToRenew] = useState<ClientData | null>(null);

    // Para importación CSV
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // Para selección de plantilla
    const [isSelectTemplateOpen, setIsSelectTemplateOpen] = useState(false);

    const summaryData = useMemo(() => getSummaryData(clients), [clients]);
    const [templateTypeToSend, setTemplateTypeToSend] = useState<
        null | "credenciales" | "recordatorio"
    >(null);
    const [clientToSend, setClientToSend] = useState<ClientData | null>(null);

    // Función para obtener la clase CSS del badge de estado
    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case "active":
                return "bg-green-500/20 text-green-500";
            case "expiring":
                return "bg-yellow-500/20 text-yellow-500";
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
            case "expiring":
                return "Por Vencer";
            case "expired":
                return "Vencido";
            default:
                return "Desconocido";
        }
    };

    // Cargar revendedores para el filtro
    const fetchResellers = async () => {
        try {
            const data = await resellerService.getAll();
            setResellers(data);
        } catch (error) {
            console.error("Error al cargar revendedores:", error);
        }
    };

    // Cargar clientes
    const fetchClients = useCallback(async () => {
        console.log('🔄 FETCHCLIENTS LLAMADO - timestamp:', new Date().toLocaleTimeString());
        setIsLoading(true);
        try {
            const data = await clientService.getAll();
            console.log('📊 DATOS OBTENIDOS:', data.length, 'clientes');
            console.log('🔍 DATOS DETALLADOS:', data.map(c => ({id: c.id, cliente: c.cliente, plan: c.plan, fecha_fin: c.fecha_fin})));
            setClients(data);
            console.log('✅ CLIENTES SETEADOS EN ESTADO');
        } catch (error) {
            console.error("Error al cargar clientes:", error);
            toast.error("Error al cargar los clientes");
        } finally {
            setIsLoading(false);
            console.log('🏁 FETCHCLIENTS TERMINADO');
        }
    }, []);

    // Función para filtrar clientes según búsqueda, estado y propietario
    const filterClients = useCallback(() => {
        const filtered = clients.filter((client) => {
            // Filtro por búsqueda
            const matchesSearch = searchTerm
                ? client.cliente
                      ?.toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                  client.whatsapp
                      ?.toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                  (client.usuario
                      ? client.usuario
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase())
                      : false)
                : true;

            // Filtro por estado
            const matchesStatus = statusFilter === "all" || client.status === statusFilter;

            // Filtro por propietario
            const matchesOwner =
                ownerFilter === "all" ||
                (ownerFilter === "admin" && !client.owner_id) ||
                client.owner_id === ownerFilter;

            return matchesSearch && matchesStatus && matchesOwner;
        });

        setFilteredClients(filtered);
    }, [clients, searchTerm, statusFilter, ownerFilter]);

    // Efecto para cargar datos iniciales
    useEffect(() => {
        fetchClients();
        fetchResellers();
    }, []);

    // Efecto para filtrar cuando cambian los criterios
    useEffect(() => {
        filterClients();
    }, [filterClients]);

    // Efecto para la suscripción a cambios en tiempo real en la tabla de clientes
    useEffect(() => {
        const channel = supabase
            .channel("custom-clients-channel")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "clients" },
                (payload) => {
                    console.log(
                        "Cambio en tiempo real recibido en la tabla clients:",
                        payload
                    );
                    toast.info("Actualizando lista de clientes...", {
                        duration: 2000,
                    });
                    fetchClients();
                }
            )
            .subscribe((status, err) => {
                if (status === "SUBSCRIBED") {
                    console.log("Conectado a Supabase Realtime para clientes!");
                }
                if (status === "CHANNEL_ERROR") {
                    console.error(
                        "Error en el canal de Supabase Realtime para clientes:",
                        err
                    );
                    toast.error(
                        "Error en la conexión de tiempo real para clientes."
                    );
                }
            });

        return () => {
            supabase.removeChannel(channel);
            console.log("Desconectado de Supabase Realtime para clientes.");
        };
    }, [fetchClients]);

    // Handler para guardar cliente
    const handleSaveClient = useCallback(async (data: ClientFormData) => {
        console.log('💾 INICIANDO GUARDADO - timestamp:', new Date().toLocaleTimeString());
        console.log('📝 DATOS A GUARDAR:', data);
        console.log('👤 CLIENTE SELECCIONADO:', selectedClient?.id, selectedClient?.cliente);
        try {
            if (selectedClient) {
                // Actualizar cliente existente
                console.log('🔄 ACTUALIZANDO CLIENTE EXISTENTE:', selectedClient.id);
                await clientService.update(selectedClient.id, data);
                console.log('✅ CLIENTE ACTUALIZADO EN BD');
                toast.success("Cliente actualizado correctamente");
            } else {
                // Crear nuevo cliente
                console.log('➕ CREANDO NUEVO CLIENTE');
                await clientService.create(data);
                console.log('✅ CLIENTE CREADO EN BD');
                toast.success("Cliente creado correctamente");
            }
            console.log('🏠 CERRANDO MODAL');
            setIsModalOpen(false);
            setSelectedClient(null);
            console.log('🔄 LLAMANDO FETCHCLIENTS DESPUÉS DE GUARDAR');
            fetchClients();
            console.log('💾 GUARDADO COMPLETADO');
        } catch (error) {
            console.error("Error al guardar cliente:", error);
            toast.error("Error al guardar el cliente");
        }
    }, [selectedClient, fetchClients]);

    const handleDeleteClient = useCallback(async (id: string) => {
        try {
            await clientService.delete(id);
            toast.success("Cliente eliminado correctamente");
            fetchClients();
        } catch (error) {
            console.error("Error al eliminar cliente:", error);
            toast.error("Error al eliminar el cliente");
        }
    }, [fetchClients]);

    // Función para manejar la renovación del plan
    const handleRenewPlan = useCallback(async (plan: string) => {
        if (!clientToRenew) return;

        try {
            // Actualizar el cliente con el nuevo plan
            // El clientService.update() calculará automáticamente la nueva fecha_fin
            await clientService.update(clientToRenew.id, {
                plan: plan, // Usamos el campo plan para almacenar el plan de suscripción
            });

            toast.success(
                `Plan renovado exitosamente a ${plan}`
            );
            setIsRenewModalOpen(false);
            setClientToRenew(null);
            fetchClients();
        } catch (error) {
            console.error("Error al renovar plan:", error);
            toast.error("Error al renovar el plan");
        }
    }, [clientToRenew, fetchClients]);

    // Función para manejar el envío de plantillas
    const handleSendTemplate = async (template: Template) => {
        if (!clientToSend || !templateTypeToSend) return;

        try {
            // Calcular días restantes
            const endDate = new Date(clientToSend.fecha_fin);
            const today = new Date();
            const daysLeft = Math.ceil(
                (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );

            // Reemplazar variables en la plantilla
            const message = replaceVariables(template.content, {
                cliente: clientToSend.cliente || "",
                plataforma: clientToSend.plataforma || "",
                plan_de_suscripcion: clientToSend.plan || "",
                fecha_fin: clientToSend.fecha_fin
                    ? new Date(clientToSend.fecha_fin).toLocaleDateString()
                    : "",
                dias_restantes: `${daysLeft} días`,
                usuario: clientToSend.usuario || "",
                contraseña: clientToSend.contraseña || "",
            });

            // Asegurarse de que el número de teléfono esté en el formato correcto
            let phone = clientToSend.whatsapp || "";

            // Verificar si el número ya tiene código de país
            if (phone.startsWith("+")) {
                // Si ya tiene el +, simplemente eliminarlo y mantener el resto
                phone = phone.substring(1).replace(/\D/g, "");
            } else {
                // Si no tiene +, eliminar caracteres no numéricos
                phone = phone.replace(/\D/g, "");

                // Verificar si el número ya comienza con un código de país
                // Los códigos comunes en Latinoamérica son 52 (México), 57 (Colombia), 54 (Argentina), etc.
                // Si no comienza con un código de país reconocible, agregar 52 (México)
                if (
                    !phone.startsWith("52") &&
                    !phone.startsWith("57") &&
                    !phone.startsWith("54") &&
                    !phone.startsWith("55") &&
                    !phone.startsWith("56") &&
                    !phone.startsWith("58") &&
                    !phone.startsWith("51") &&
                    !phone.startsWith("50") &&
                    phone.length > 0
                ) {
                    phone = "52" + phone;
                }
            }

            // Abrir WhatsApp con el mensaje
            openWhatsApp(phone, message);

            toast.success("Mensaje preparado para enviar");
            setIsSelectTemplateOpen(false);
        } catch (error) {
            console.error("Error al enviar plantilla:", error);
            toast.error("Error al preparar el mensaje");
        }
    };

    // Función para exportar clientes a CSV
    const handleExportCSV = () => {
        try {
            const dataToExport = filteredClients.length > 0 ? filteredClients : clients;
            exportToCSV(dataToExport, `clientes_${new Date().toISOString().split('T')[0]}.csv`);
            toast.success(`${dataToExport.length} clientes exportados correctamente`);
        } catch (error) {
            console.error('Error al exportar CSV:', error);
            toast.error('Error al exportar los datos');
        }
    };

    // Función para importar clientes desde CSV
    const handleImportCSV = async (clients: ClientFormData[]) => {
        try {
            let importedCount = 0;
            let errorCount = 0;

            for (const clientData of clients) {
                try {
                    await clientService.create(clientData);
                    importedCount++;
                } catch (error) {
                    console.error(`Error al importar cliente ${clientData.cliente}:`, error);
                    errorCount++;
                }
            }

            if (importedCount > 0) {
                toast.success(`${importedCount} clientes importados correctamente`);
                fetchClients(); // Recargar la lista
            }

            if (errorCount > 0) {
                toast.warning(`${errorCount} clientes no se pudieron importar`);
            }

            setIsImportModalOpen(false);
        } catch (error) {
            console.error('Error durante la importación:', error);
            toast.error('Error durante la importación');
        }
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Gestión de Clientes</h1>
                <div className="flex gap-2">
                    <button
                        onClick={handleExportCSV}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2"
                        title="Exportar clientes a CSV"
                    >
                        <Download className="w-4 h-4" />
                        <span>Exportar</span>
                    </button>
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2"
                        title="Importar clientes desde CSV"
                    >
                        <Upload className="w-4 h-4" />
                        <span>Importar</span>
                    </button>
                    <button
                        className="bg-[#00A8FF] hover:bg-[#00A8FF]/90 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2"
                        onClick={() => {
                            setSelectedClient(null);
                            setIsModalOpen(true);
                        }}
                    >
                        <PlusCircle className="w-4 h-4" />
                        <span>Nuevo Cliente</span>
                    </button>
                </div>
            </div>

            {/* Tarjetas de resumen */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {getSummaryData(clients).map((item, index) => (
                    <div
                        key={index}
                        className="bg-[#1a1d24] p-4 rounded-xl border border-border/10 flex items-center justify-between"
                    >
                        <div>
                            <h3 className="text-sm text-muted-foreground">
                                {item.title}
                            </h3>
                            <p
                                className={`text-2xl font-semibold mt-1 ${item.color}`}
                            >
                                {item.value}
                            </p>
                        </div>
                        <item.Icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                ))}
            </div>

            {/* Barra de búsqueda y filtros */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            className="w-full px-4 py-2 bg-background/50 border border-border/10 rounded-lg text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-4 py-2 bg-background/50 border border-border/10 rounded-lg text-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Todos los estados</option>
                        <option value="active">Activos</option>
                        <option value="expiring">Por vencer</option>
                        <option value="expired">Vencidos</option>
                    </select>
                    <select
                        className="px-4 py-2 bg-background/50 border border-border/10 rounded-lg text-sm"
                        value={ownerFilter}
                        onChange={(e) => setOwnerFilter(e.target.value)}
                    >
                        <option value="all">Todos los clientes</option>
                        <option value="admin">Mis clientes</option>
                        {resellers.map((reseller) => (
                            <option key={reseller.id} value={reseller.id}>
                                Clientes de {reseller.full_name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Tabla de Clientes */}
                <div className="overflow-x-auto bg-[#191c23] rounded-xl border border-border/10">
                    <ClientsTable
                        clients={filteredClients}
                        isLoading={isLoading}
                        onEdit={(client) => {
                            setSelectedClient(client);
                            setIsModalOpen(true);
                        }}
                        onDelete={handleDeleteClient}
                        onRenew={(client) => {
                            setClientToRenew(client);
                            setIsRenewModalOpen(true);
                        }}
                        onSendCredentials={(client) => {
                            setClientToSend(client);
                            setTemplateTypeToSend("credenciales");
                            setIsSelectTemplateOpen(true);
                        }}
                        onSendReminder={(client) => {
                            setClientToSend(client);
                            setTemplateTypeToSend("recordatorio");
                            setIsSelectTemplateOpen(true);
                        }}
                    />
                </div>
            </div>

            {/* Modal de Cliente */}
            <ClientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSaveClient}
                client={selectedClient}
            />

            {/* Modal de renovación de plan */}
            <RenewPlanModal
                isOpen={isRenewModalOpen}
                onClose={() => setIsRenewModalOpen(false)}
                onSubmit={handleRenewPlan}
            />

            {/* Modal de selección de plantilla */}
            <SelectTemplateModal
                isOpen={isSelectTemplateOpen}
                onClose={() => setIsSelectTemplateOpen(false)}
                onSelect={handleSendTemplate}
                type={templateTypeToSend}
            />

            {/* Modal de importación CSV */}
            <ImportCSVModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleImportCSV}
            />
        </div>
    );
};

export default ClientsPage;
