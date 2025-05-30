-- Drop existing table if it exists
drop table if exists public.resellers;

-- Create resellers table
create table public.resellers (
    id uuid references auth.users(id) primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    full_name text not null,
    email text not null unique,
    phone text,
    plan_type text not null default '1 Mes',
    plan_end_date date not null,
    status text not null default 'active' check (status in ('active', 'inactive', 'expired'))
);
