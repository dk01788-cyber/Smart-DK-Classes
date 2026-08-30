-- Smart DK Classes V4 - Supabase schema
-- Run in Supabase SQL Editor once on a NEW project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  support_phone text,
  support_email text,
  whatsapp_number text,
  youtube_channel_id text,
  announcement text,
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null default 'Product',
  class_name text,
  subject text,
  description text,
  mrp numeric(12,2) not null default 0,
  price numeric(12,2) not null default 0 check (price >= 0),
  digital boolean not null default true,
  physical boolean not null default false,
  validity_days integer not null default 0,
  cover_url text,
  file_path text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  provider text not null default 'razorpay_qr',
  provider_qr_id text unique,
  provider_payment_id text,
  amount numeric(12,2) not null check (amount >= 0),
  status text not null default 'created' check (status in ('created','pending','paid','failed','refunded')),
  shipping_address jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  payment_id uuid references public.payments(id) on delete set null,
  amount numeric(12,2) not null default 0,
  status text not null default 'paid' check (status in ('paid','revoked','refunded')),
  shipping_address jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, product_id)
);

create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  amount numeric(12,2) not null check (amount > 0),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.vacancies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'Government Jobs',
  department text,
  total_posts text,
  qualification text,
  age_limit text,
  fee text,
  salary text,
  start_date date,
  last_date date,
  official_url text,
  notification_url text,
  apply_url text,
  description text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.affiliate_products (
  id uuid primary key default gen_random_uuid(),
  marketplace text not null default 'Amazon',
  title text not null,
  description text,
  image_url text,
  price_text text,
  affiliate_url text not null,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  youtube_video_id text,
  access text not null default 'free' check (access in ('free','paid')),
  product_id uuid references public.products(id) on delete set null,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.doubts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null,
  answer text,
  status text not null default 'open' check (status in ('open','answered','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create student profile after Supabase Auth signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Security-definer helper used by RLS policies.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.products enable row level security;
alter table public.payments enable row level security;
alter table public.purchases enable row level security;
alter table public.settlements enable row level security;
alter table public.vacancies enable row level security;
alter table public.affiliate_products enable row level security;
alter table public.videos enable row level security;
alter table public.doubts enable row level security;

-- Tight grants: policies AND grants are both required.
revoke all on public.profiles, public.site_settings, public.products, public.payments, public.purchases, public.settlements, public.vacancies, public.affiliate_products, public.videos, public.doubts from anon, authenticated;

grant select on public.site_settings, public.products, public.vacancies, public.affiliate_products, public.videos to anon, authenticated;
grant select on public.profiles, public.payments, public.purchases, public.settlements, public.doubts to authenticated;
grant update (full_name, phone, updated_at) on public.profiles to authenticated;
grant update on public.site_settings to authenticated;
grant insert, update, delete on public.products, public.vacancies, public.affiliate_products, public.videos to authenticated;
grant insert on public.settlements to authenticated;
grant insert on public.doubts to authenticated;
grant update (answer, status, updated_at) on public.doubts to authenticated;

-- Profiles
drop policy if exists "profiles own or admin select" on public.profiles;
create policy "profiles own or admin select" on public.profiles for select to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles own limited update" on public.profiles;
create policy "profiles own limited update" on public.profiles for update to authenticated
using (id = auth.uid()) with check (id = auth.uid());

-- Site settings
drop policy if exists "site settings public read" on public.site_settings;
create policy "site settings public read" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "site settings admin update" on public.site_settings;
create policy "site settings admin update" on public.site_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Products
drop policy if exists "products public published" on public.products;
create policy "products public published" on public.products for select to anon, authenticated
using (is_published = true or public.is_admin());

drop policy if exists "products admin insert" on public.products;
create policy "products admin insert" on public.products for insert to authenticated with check (public.is_admin());
drop policy if exists "products admin update" on public.products;
create policy "products admin update" on public.products for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "products admin delete" on public.products;
create policy "products admin delete" on public.products for delete to authenticated using (public.is_admin());

-- Payments & purchases are created by backend secret key only; users can read their own.
drop policy if exists "payments own or admin read" on public.payments;
create policy "payments own or admin read" on public.payments for select to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "purchases own or admin read" on public.purchases;
create policy "purchases own or admin read" on public.purchases for select to authenticated
using (user_id = auth.uid() or public.is_admin());

-- Settlements
drop policy if exists "settlements admin select" on public.settlements;
create policy "settlements admin select" on public.settlements for select to authenticated using (public.is_admin());
drop policy if exists "settlements admin insert" on public.settlements;
create policy "settlements admin insert" on public.settlements for insert to authenticated with check (public.is_admin());

-- Vacancies
drop policy if exists "vacancies public published" on public.vacancies;
create policy "vacancies public published" on public.vacancies for select to anon, authenticated
using (is_published = true or public.is_admin());
drop policy if exists "vacancies admin insert" on public.vacancies;
create policy "vacancies admin insert" on public.vacancies for insert to authenticated with check (public.is_admin());
drop policy if exists "vacancies admin update" on public.vacancies;
create policy "vacancies admin update" on public.vacancies for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "vacancies admin delete" on public.vacancies;
create policy "vacancies admin delete" on public.vacancies for delete to authenticated using (public.is_admin());

-- Affiliate products
drop policy if exists "affiliate public published" on public.affiliate_products;
create policy "affiliate public published" on public.affiliate_products for select to anon, authenticated
using (is_published = true or public.is_admin());
drop policy if exists "affiliate admin insert" on public.affiliate_products;
create policy "affiliate admin insert" on public.affiliate_products for insert to authenticated with check (public.is_admin());
drop policy if exists "affiliate admin update" on public.affiliate_products;
create policy "affiliate admin update" on public.affiliate_products for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "affiliate admin delete" on public.affiliate_products;
create policy "affiliate admin delete" on public.affiliate_products for delete to authenticated using (public.is_admin());

-- Videos: free are public; paid are visible only after purchase or to admin.
drop policy if exists "videos access policy" on public.videos;
create policy "videos access policy" on public.videos for select to anon, authenticated
using (
  is_published = true and (
    access = 'free'
    or public.is_admin()
    or (
      auth.uid() is not null and product_id is not null and exists (
        select 1 from public.purchases p
        where p.user_id = auth.uid()
          and p.product_id = videos.product_id
          and p.status = 'paid'
      )
    )
  )
);
drop policy if exists "videos admin insert" on public.videos;
create policy "videos admin insert" on public.videos for insert to authenticated with check (public.is_admin());
drop policy if exists "videos admin update" on public.videos;
create policy "videos admin update" on public.videos for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "videos admin delete" on public.videos;
create policy "videos admin delete" on public.videos for delete to authenticated using (public.is_admin());

-- Doubts
drop policy if exists "doubts own or admin select" on public.doubts;
create policy "doubts own or admin select" on public.doubts for select to authenticated
using (user_id = auth.uid() or public.is_admin());
drop policy if exists "doubts own insert" on public.doubts;
create policy "doubts own insert" on public.doubts for insert to authenticated
with check (user_id = auth.uid());
drop policy if exists "doubts admin update" on public.doubts;
create policy "doubts admin update" on public.doubts for update to authenticated
using (public.is_admin()) with check (public.is_admin());

-- Private paid-files bucket policy.
-- Create a PRIVATE bucket named `paid-files` in Storage Dashboard first.
drop policy if exists "admins manage paid files" on storage.objects;
create policy "admins manage paid files"
on storage.objects
for all
to authenticated
using (bucket_id = 'paid-files' and public.is_admin())
with check (bucket_id = 'paid-files' and public.is_admin());

drop policy if exists "buyers can read purchased files" on storage.objects;
create policy "buyers can read purchased files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'paid-files'
  and exists (
    select 1
    from public.purchases p
    where p.user_id = auth.uid()
      and p.status = 'paid'
      and p.product_id::text = (storage.foldername(name))[1]
  )
);

insert into public.site_settings (id, support_phone, support_email, whatsapp_number, youtube_channel_id, announcement)
values (1, '7376546714', 'dk01788@gmail.com', '917376546714', 'UCxaVDJ6NSpm_jQFPA_uJMjQ', 'Welcome to Smart DK Classes')
on conflict (id) do nothing;

-- Starter products: price stays 0 until you set it in Admin Panel.
insert into public.products (id,title,type,class_name,subject,description,mrp,price,digital,physical,is_published)
values
('11111111-1111-4111-8111-111111111111','Class 10 Model Paper','Model Paper','Class 10','All Subjects','UP Board model paper. Upload PDF and set price from Admin Panel.',0,0,true,false,true),
('22222222-2222-4222-8222-222222222222','Smart DK Book','Book','Class 9–10','Maths / Science','Printed / eBook product starter. Set details and price later.',0,0,true,true,true),
('33333333-3333-4333-8333-333333333333','Smart DK Paid Course','Paid Course','Class 9–10','Maths / Science','Paid course starter. Payment verification unlocks purchased access.',0,0,true,false,true)
on conflict (id) do nothing;
