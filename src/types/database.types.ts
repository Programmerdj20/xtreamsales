// Tipos para la base de datos

export interface Reseller {
    id: string;
    user_id?: string;
    created_at?: string;
    full_name: string;
    email: string;
    phone: string;
    plan_type: string;
    plan_end_date: string;
    status: string;
}

export interface NewReseller {
    full_name?: string;
    email?: string;
    phone?: string;
    plan_type?: string;
    plan_end_date?: string;
    status?: string;
}

export interface ResellerWithPassword extends NewReseller {
    password: string;
}
