-- Drop existing policies
drop policy if exists "Resellers are viewable by admin users" on public.resellers;
drop policy if exists "Resellers are insertable by admin users" on public.resellers;
drop policy if exists "Resellers are updatable by admin users" on public.resellers;
drop policy if exists "Resellers are deletable by admin users" on public.resellers;

-- Drop trigger and function
drop trigger if exists update_reseller_status on public.resellers;
drop function if exists public.check_reseller_status();

-- Drop table
drop table if exists public.resellers;
