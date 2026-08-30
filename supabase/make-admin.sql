-- Run AFTER the schema. This works even if the Auth user existed before the profile trigger.
insert into public.profiles (id, full_name, phone, email, is_admin)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', 'Smart DK Admin'),
  coalesce(u.raw_user_meta_data ->> 'phone', ''),
  u.email,
  true
from auth.users u
where lower(u.email) = lower('dk01788@gmail.com')
on conflict (id) do update
set is_admin = true,
    email = excluded.email,
    updated_at = now();

select id, full_name, email, is_admin
from public.profiles
where lower(email) = lower('dk01788@gmail.com');
