export type TemplateCategory = "credenciales" | "recordatorio";

export interface Template {
    id: string;
    name: string;
    content: string;
    category: TemplateCategory;
    created_at: string;
    owner_id: string | null; // ID del usuario que creó la plantilla (null para plantillas del sistema)
}

export interface NewTemplate {
    name: string;
    content: string;
    category: TemplateCategory;
    owner_id?: string | null; // Opcional al crear, se asignará en el servicio
}

export const AVAILABLE_PLACEHOLDERS = [
    { key: "cliente", description: "Nombre del cliente" },
    { key: "plataforma", description: "Nombre de la plataforma" },
    { key: "plan_de_suscripcion", description: "Plan de suscripción (1 Mes, 3 Meses, etc.)" },
    { key: "usuario", description: "Nombre de usuario" },
    { key: "contraseña", description: "Contraseña del usuario" },
    { key: "fecha_inicio", description: "Fecha de inicio del servicio" },
    { key: "fecha_fin", description: "Fecha de fin del servicio" },
    { key: "dias_restantes", description: "Días restantes de suscripción" },
];
