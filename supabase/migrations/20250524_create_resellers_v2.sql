-- Create resellers table
create table public.resellers (
    id uuid references auth.users(id) primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    full_name text not null,
    email text not null unique,
    phone text,
    plan_type text not null default '1 Mes',
    plan_end_date date not null,
    status text not null default 'active'
);

-- Enable RLS
alter table public.resellers enable row level security;

-- Create basic admin policy
create policy "Admin access" on public.resellers
    for all
    using (auth.uid() in (select id from public.profiles where role = 'admin'))
    with check (auth.uid() in (select id from public.profiles where role = 'admin'));
