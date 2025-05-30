import React from 'react';
import { RefreshCw, Power, ToggleLeft } from 'lucide-react';

interface Activity {
  id: string;
  type: 'renewal' | 'activation' | 'status_change';
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    resellerName?: string;
    oldStatus?: string;
    newStatus?: string;
    planType?: string;
  };
}

interface ActivityPanelProps {
  activities: Activity[];
  isLoading?: boolean;
}

export function ActivityPanel({ activities, isLoading = false }: ActivityPanelProps) {
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'renewal':
        return RefreshCw;
      case 'activation':
        return Power;
      case 'status_change':
        return ToggleLeft;
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'renewal':
        return 'text-blue-400';
      case 'activation':
        return 'text-green-400';
      case 'status_change':
        return 'text-yellow-400';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#1a1d24] p-4 rounded-xl border border-border/10">
        <h2 className="text-lg font-semibold mb-4">Actividad Reciente</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-start space-x-4">
              <div className="h-8 w-8 rounded-full bg-muted-foreground/10" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted-foreground/10 rounded w-1/3" />
                <div className="h-3 bg-muted-foreground/10 rounded w-3/4" />
                <div className="h-3 bg-muted-foreground/10 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1d24] p-4 rounded-xl border border-border/10">
      <h2 className="text-lg font-semibold mb-4">Actividad Reciente</h2>
      {activities.length === 0 ? (
        <p className="text-muted-foreground text-sm">No hay actividad reciente.</p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = getActivityIcon(activity.type);
            const colorClass = getActivityColor(activity.type);
            return (
              <div
                key={activity.id}
                className="flex items-start space-x-4 p-3 rounded-lg bg-background/5 border border-border/5"
              >
                <div className={`rounded-full p-2 ${colorClass} bg-background/10`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
