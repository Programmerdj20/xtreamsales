import React from 'react';
import { AlertTriangle, AlertCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Alert {
  id: string;
  type: 'expiring' | 'payment' | 'demo';
  title: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  timestamp: string;
  link?: string;
}

interface AlertsPanelProps {
  alerts: Alert[];
  isLoading?: boolean;
}

export function AlertsPanel({ alerts, isLoading = false }: AlertsPanelProps) {
  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-blue-400';
    }
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'expiring':
        return Clock;
      case 'payment':
        return AlertCircle;
      case 'demo':
        return AlertTriangle;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#1a1d24] p-4 rounded-xl border border-border/10">
        <h2 className="text-lg font-semibold mb-4">Alertas del Sistema</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-start space-x-4">
              <div className="h-5 w-5 rounded bg-muted-foreground/10" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted-foreground/10 rounded w-1/4" />
                <div className="h-3 bg-muted-foreground/10 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1d24] p-4 rounded-xl border border-border/10">
      <h2 className="text-lg font-semibold mb-4">Alertas del Sistema</h2>
      {alerts.length === 0 ? (
        <p className="text-muted-foreground text-sm">No hay alertas pendientes.</p>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const Icon = getAlertIcon(alert.type);
            return (
              <div
                key={alert.id}
                className="flex items-start space-x-4 p-3 rounded-lg bg-background/5 border border-border/5 hover:bg-background/10 transition-colors"
              >
                {alert.type === 'demo' && alert.title.includes('Pendiente') ? (
                  <Link to="/admin/users" className="flex items-start space-x-4 w-full">
                    <Icon className={`w-5 h-5 mt-0.5 ${getSeverityColor(alert.severity)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{alert.title}</p>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">{alert.timestamp}</p>
                      <p className="text-xs text-primary mt-1">Haz clic para gestionar usuarios</p>
                    </div>
                  </Link>
                ) : (
                  <>
                    <Icon className={`w-5 h-5 mt-0.5 ${getSeverityColor(alert.severity)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{alert.title}</p>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">{alert.timestamp}</p>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
