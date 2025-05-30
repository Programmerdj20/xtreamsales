import React from 'react';
import { Server, Signal, AlertTriangle } from 'lucide-react';

interface ServiceStatus {
  id: string;
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latency?: number;
  lastChecked: string;
  message?: string;
}

interface Incident {
  id: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  createdAt: string;
  updatedAt: string;
  message: string;
}

interface ServiceStatusPanelProps {
  services: ServiceStatus[];
  incidents: Incident[];
  isLoading?: boolean;
}

export function ServiceStatusPanel({ services, incidents, isLoading = false }: ServiceStatusPanelProps) {
  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'operational':
        return 'text-green-400';
      case 'degraded':
        return 'text-yellow-400';
      case 'down':
        return 'text-red-400';
    }
  };

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'operational':
        return Signal;
      case 'degraded':
        return AlertTriangle;
      case 'down':
        return Server;
    }
  };

  const getIncidentSeverityColor = (severity: Incident['severity']) => {
    switch (severity) {
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-blue-400';
    }
  };

  const getIncidentStatusBadge = (status: Incident['status']) => {
    const baseClasses = 'px-2 py-0.5 rounded-full text-xs font-medium';
    switch (status) {
      case 'investigating':
        return `${baseClasses} bg-yellow-400/10 text-yellow-400`;
      case 'identified':
        return `${baseClasses} bg-blue-400/10 text-blue-400`;
      case 'monitoring':
        return `${baseClasses} bg-purple-400/10 text-purple-400`;
      case 'resolved':
        return `${baseClasses} bg-green-400/10 text-green-400`;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#1a1d24] p-4 rounded-xl border border-border/10">
        <h2 className="text-lg font-semibold mb-4">Estado del Servicio</h2>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted-foreground/10 rounded w-1/4 mb-2" />
              <div className="h-12 bg-muted-foreground/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1d24] p-4 rounded-xl border border-border/10">
      <h2 className="text-lg font-semibold mb-4">Estado del Servicio</h2>
      
      {/* Estado de los Servidores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {services.map((service) => {
          const Icon = getStatusIcon(service.status);
          const colorClass = getStatusColor(service.status);
          return (
            <div
              key={service.id}
              className="p-4 rounded-lg bg-background/5 border border-border/5"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">{service.name}</h3>
                <Icon className={`w-5 h-5 ${colorClass}`} />
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${colorClass}`}>
                  {service.status === 'operational' ? 'Operativo' : 
                   service.status === 'degraded' ? 'Rendimiento Degradado' : 'Fuera de Servicio'}
                </span>
                {service.latency && (
                  <span className="text-xs text-muted-foreground">
                    {service.latency}ms
                  </span>
                )}
              </div>
              {service.message && (
                <p className="text-xs text-muted-foreground mt-2">{service.message}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Incidencias Activas */}
      <h3 className="text-sm font-medium mb-3">Incidencias Activas</h3>
      {incidents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay incidencias activas.</p>
      ) : (
        <div className="space-y-4">
          {incidents.map((incident) => (
            <div
              key={incident.id}
              className="p-4 rounded-lg bg-background/5 border border-border/5"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className={`text-sm font-medium ${getIncidentSeverityColor(incident.severity)}`}>
                    {incident.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">{incident.message}</p>
                </div>
                <span className={getIncidentStatusBadge(incident.status)}>
                  {incident.status === 'investigating' ? 'Investigando' :
                   incident.status === 'identified' ? 'Identificado' :
                   incident.status === 'monitoring' ? 'Monitoreando' : 'Resuelto'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Última actualización: {new Date(incident.updatedAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
