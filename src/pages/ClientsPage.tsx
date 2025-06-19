import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { RenewPlanModal } from "../components/modals/RenewPlanModal";
import { replaceVariables, openWhatsApp } from "../services/reseller-actions";
import { SelectTemplateModal } from "../components/resellers/SelectTemplateModal";
import { Template } from "../types/template.types";
import { supabase } from "../lib/supabase"; // Importar el cliente de Supabase
import { resellerService } from "../services/resellers";

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

    // Para selección de plantilla
    const [isSelectTemplateOpen, setIsSelectTemplateOpen] = useState(false);
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
    const fetchClients = async () => {
        setIsLoading(true);
        try {
            const data = await clientService.getAll();
            setClients(data);
            filterClients(data, searchTerm, statusFilter, ownerFilter);
        } catch (error) {
            console.error("Error al cargar clientes:", error);
            toast.error("Error al cargar los clientes");
        } finally {
            setIsLoading(false);
        }
    };

    // Función para filtrar clientes según búsqueda, estado y propietario
    const filterClients = (
        clientsList: ClientData[],
        search: string,
        status: string,
        owner: string
    ) => {
        const filtered = clientsList.filter((client) => {
            // Filtro por búsqueda
            const matchesSearch = search
                ? client.cliente
                      ?.toLowerCase()
                      .includes(search.toLowerCase()) ||
                  client.whatsapp
                      ?.toLowerCase()
                      .includes(search.toLowerCase()) ||
                  (client.usuario
                      ? client.usuario
                            .toLowerCase()
                            .includes(search.toLowerCase())
                      : false)
                : true;

            // Filtro por estado
            const matchesStatus = status === "all" || client.status === status;

            // Filtro por propietario
            const matchesOwner =
                owner === "all" ||
                (owner === "admin" && !client.owner_id) ||
                client.owner_id === owner;

            return matchesSearch && matchesStatus && matchesOwner;
        });

        setFilteredClients(filtered);
    };

    // Efecto para cargar datos iniciales
    useEffect(() => {
        fetchClients();
        fetchResellers();
    }, []);

    // Efecto para la suscripción a cambios en tiempo real en la tabla de clientes
    useEffect(() => {
        const channel = supabase
            .channel("custom-clients-channel") // Nombre único para el canal
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "clients" }, // Escuchar todos los eventos
                (payload) => {
                    console.log(
                        "Cambio en tiempo real recibido en la tabla clients:",
                        payload
                    );
                    toast.info("Actualizando lista de clientes...", {
                        duration: 2000,
                    });
                    fetchClients(); // Vuelve a cargar los datos
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

        // Función de limpieza para remover la suscripción
        return () => {
            supabase.removeChannel(channel);
            console.log("Desconectado de Supabase Realtime para clientes.");
        };
    }, []); // Se ejecuta una vez para suscribirse

    // Efecto para filtrar cuando cambian los criterios
    useEffect(() => {
        filterClients(clients, searchTerm, statusFilter, ownerFilter);
    }, [clients, searchTerm, statusFilter, ownerFilter]);

    // Handler para guardar cliente
    const handleSaveClient = async (data: ClientFormData) => {
        try {
            if (selectedClient) {
                // Actualizar cliente existente
                await clientService.update(selectedClient.id, data);
                toast.success("Cliente actualizado correctamente");
            } else {
                // Crear nuevo cliente
                await clientService.create(data);
                toast.success("Cliente creado correctamente");
            }
            setIsModalOpen(false);
            fetchClients();
        } catch (error) {
            console.error("Error al guardar cliente:", error);
            toast.error("Error al guardar el cliente");
        }
    };

    const handleDeleteClient = async (id: string) => {
        try {
            await clientService.delete(id);
            toast.success("Cliente eliminado correctamente");
            fetchClients();
        } catch (error) {
            console.error("Error al eliminar cliente:", error);
            toast.error("Error al eliminar el cliente");
        }
    };

    // Función para manejar la renovación del plan
    const handleRenewPlan = async (plan: string) => {
        if (!clientToRenew) return;

        try {
            // Calcular nueva fecha de fin según el plan seleccionado
            const today = new Date();
            let endDate = new Date(today);

            if (plan.includes("1 Mes")) {
                endDate.setMonth(today.getMonth() + 1);
            } else if (plan.includes("3 Meses")) {
                endDate.setMonth(today.getMonth() + 3);
            } else if (plan.includes("6 Meses")) {
                endDate.setMonth(today.getMonth() + 6);
            } else if (plan.includes("12 Meses")) {
                endDate.setFullYear(today.getFullYear() + 1);
            }

            // Actualizar el cliente con la nueva fecha de fin y plan
            await clientService.update(clientToRenew.id, {
                plan: plan, // Usamos el campo plan para almacenar el plan de suscripción
            });

            toast.success(
                `Plan renovado exitosamente hasta ${endDate.toLocaleDateString()}`
            );
            setIsRenewModalOpen(false);
            fetchClients(); // Recargar la lista de clientes
        } catch (error) {
            console.error("Error al renovar plan:", error);
            toast.error("Error al renovar el plan");
        }
    };

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

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Gestión de Clientes</h1>
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
        </div>
    );
};

export default ClientsPage;
