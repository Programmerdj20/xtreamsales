export interface Reseller {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string;
  plan_type: string;
  plan_end_date: string;
  status: 'active' | 'inactive' | 'pending';
}

export type NewReseller = Omit<Reseller, 'id' | 'created_at' | 'status'> & {
  password: string;
};