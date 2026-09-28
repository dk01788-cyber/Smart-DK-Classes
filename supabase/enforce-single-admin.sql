-- Run once in Supabase SQL Editor.
-- Ensures only dk01788@gmail.com is treated as admin.

update public.profiles
set is_admin = (lower(coalesce(email, '')) = lower('dk01788@gmail.com')),
    updated_at = now();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_admin = true
      and lower(coalesce(email, '')) = lower('dk01788@gmail.com')
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

select id, full_name, email, is_admin
from public.profiles
order by is_admin desc, email;
