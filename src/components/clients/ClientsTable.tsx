import React from "react";
import { ClientData } from "../../services/clients";
import { toast } from "sonner";
import { openWhatsApp } from "../../services/reseller-actions";
import { ClientActions } from "./ClientActions";

interface ClientsTableProps {
  clients: ClientData[];
  isLoading?: boolean;
  onEdit?: (client: ClientData) => void;
  onDelete?: (id: string) => void;
  onRenew?: (client: ClientData) => void;
  onSendCredentials?: (client: ClientData) => void;
  onSendReminder?: (client: ClientData) => void;
}

export const ClientsTable: React.FC<ClientsTableProps> = ({ clients, isLoading, onEdit, onDelete, onRenew, onSendCredentials, onSendReminder }) => {
  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Cargando clientes...</p>
      </div>
    );
  }
  
  if (!clients.length) {
    return (
      <div className="text-center py-12 text-muted-foreground border border-dashed border-border/50 rounded-lg">
        <p className="text-base">No hay clientes registrados.</p>
        <p className="text-sm mt-1">Agrega un nuevo cliente para comenzar.</p>
      </div>
    );
  }
  
  // Función para enviar mensaje de WhatsApp al cliente
  const handleSendWhatsApp = (client: ClientData) => {
    try {
      const message = `Hola ${client.cliente}, te recordamos que tu servicio de ${client.plataforma} vence en ${client.dias_restantes} días (${client.fecha_fin}). ¡Contáctanos para renovar!`;
      openWhatsApp(client.whatsapp, message);
      toast.success("Abriendo WhatsApp");
    } catch (error) {
      toast.error("Error al abrir WhatsApp");
    }
  };

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

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
        return "ACTIVO";
      case "expiring":
        return "POR VENCER";
      case "expired":
        return "VENCIDO";
      default:
        return "DESCONOCIDO";
    }
  };
  
  return (
    <div className="overflow-x-auto rounded-lg border border-border/10 bg-card shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/50 border-b border-border/10">
          <tr>
            <th className="p-3 text-left font-medium">Cliente</th>
            <th className="p-3 text-left font-medium">Whatsapp</th>
            <th className="p-3 text-left font-medium">Plataforma</th>
            <th className="p-3 text-left font-medium">Disp.</th>
            <th className="p-3 text-left font-medium">Usuario</th>
            <th className="p-3 text-left font-medium">Contraseña</th>
            <th className="p-3 text-left font-medium">Fecha Fin</th>
            <th className="p-3 text-left font-medium">Días</th>
            <th className="p-3 text-left font-medium">Estado</th>
            <th className="p-3 text-left font-medium">Precio</th>
            <th className="p-3 text-center font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id} className="border-b border-border/10 hover:bg-muted/5 transition-colors">
              <td className="p-3 font-medium">{client.cliente}</td>
              <td className="p-3">{client.whatsapp}</td>
              <td className="p-3">{client.plataforma}</td>
              <td className="p-3 text-center">{client.dispositivos}</td>
              <td className="p-3">{client.usuario}</td>
              <td className="p-3">{client.contraseña}</td>
              <td className="p-3">{formatDate(client.fecha_fin)}</td>
              <td className="p-3 text-center">
                <span className={
                  client.dias_restantes > 10
                    ? "text-green-500 font-medium"
                    : client.dias_restantes > 0
                    ? "text-yellow-500 font-medium"
                    : "text-red-500 font-medium"
                }>
                  {client.dias_restantes}
                </span>
              </td>
              <td className="p-3">
                <span className={`${getStatusBadgeClass(client.status)} px-2 py-1 rounded text-xs font-medium`}>
                  {getStatusLabel(client.status)}
                </span>
              </td>
              <td className="p-3 text-right">
                ${client.precio.toFixed(2)}
              </td>
              <td className="p-2 text-right">
                <ClientActions 
                  onEdit={() => onEdit && onEdit(client)}
                  onRenew={() => onRenew && onRenew(client)}
                  onSendCredentials={() => onSendCredentials && onSendCredentials(client)}
                  onSendReminder={() => onSendReminder && onSendReminder(client)}
                  onDelete={() => {
                    if (window.confirm(`¿Estás seguro de eliminar al cliente ${client.cliente}?`)) {
                      onDelete && onDelete(client.id);
                    }
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
