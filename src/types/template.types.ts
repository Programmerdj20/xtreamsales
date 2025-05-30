export interface Template {
  id: string;
  name: string;
  content: string;
  created_at: string;
}

export interface NewTemplate {
  name: string;
  content: string;
}

export const AVAILABLE_PLACEHOLDERS = [
  { key: 'cliente', description: 'Nombre del cliente' },
  { key: 'plataforma', description: 'Nombre de la plataforma' },
  { key: 'usuario', description: 'Nombre de usuario' },
  { key: 'contraseña', description: 'Contraseña del usuario' },
  { key: 'fecha_inicio', description: 'Fecha de inicio del servicio' },
  { key: 'fecha_fin', description: 'Fecha de fin del servicio' },
  { key: 'dias_restantes', description: 'Días restantes de suscripción' }
];
