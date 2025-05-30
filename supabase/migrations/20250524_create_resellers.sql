-- Create resellers table
create table if not exists public.resellers (
    id uuid references auth.users(id) primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    full_name text not null,
    email text not null unique,
    phone text,
    plan_type text not null default '1 Mes',
    plan_end_date date not null,
    status text not null default 'active' check (status in ('active', 'inactive', 'expired')),

    constraint resellers_email_check check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Set up Row Level Security (RLS)
alter table public.resellers enable row level security;

-- Create policies
create policy "Resellers are viewable by admin users" on public.resellers
    for select using (
        auth.uid() in (
            select id from public.profiles where role = 'admin'
        )
    );

create policy "Resellers are insertable by admin users" on public.resellers
    for insert with check (
        auth.uid() in (
            select id from public.profiles where role = 'admin'
        )
    );

create policy "Resellers are updatable by admin users" on public.resellers
    for update using (
        auth.uid() in (
            select id from public.profiles where role = 'admin'
        )
    );

create policy "Resellers are deletable by admin users" on public.resellers
    for delete using (
        auth.uid() in (
            select id from public.profiles where role = 'admin'
        )
    );

-- Create function to automatically update status based on plan_end_date
create or replace function public.check_reseller_status()
returns trigger as $$
begin
    if new.plan_end_date < current_date then
        new.status = 'expired';
    end if;
    return new;
end;
$$ language plpgsql security definer;

-- Create trigger to update status
create trigger update_reseller_status
    before insert or update on public.resellers
    for each row
    execute function public.check_reseller_status();
