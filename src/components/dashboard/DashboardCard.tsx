import React from 'react';
import { LucideProps } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  IconComponent: React.FC<LucideProps>;
  iconColor?: string; // e.g., 'text-green-400'
  headerBgColor?: string; // e.g., 'bg-green-800'
  valueColor?: string; // e.g., 'text-foreground'
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  IconComponent,
  iconColor = 'text-muted-foreground',
  headerBgColor = 'bg-background', // Un color de fondo más oscuro para la cabecera por defecto
  valueColor = 'text-foreground',
}) => {
  return (
    <div className="rounded-md shadow overflow-hidden flex flex-col h-full border border-border">
      {/* Header de la tarjeta */}
      <div className={`p-4 flex justify-between items-center ${headerBgColor}`}>
        <h3 className="text-sm font-medium text-foreground/80 truncate" title={title}>{title}</h3>
        <IconComponent className={`h-5 w-5 flex-shrink-0 ${iconColor}`} />
      </div>
      {/* Cuerpo de la tarjeta (valor) */}
      <div className="bg-card-value-area p-4 flex-grow flex items-center justify-start"> 
        <p className={`text-2xl font-semibold ${valueColor}`}>{value}</p>
      </div>
    </div>
  );
};

export default DashboardCard;
