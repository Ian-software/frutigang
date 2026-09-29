-- FRUTIGANG / SUPABASE
-- 1) En Supabase: SQL Editor > New query > pega y ejecuta todo este archivo.
-- 2) Authentication > Providers: deja Email habilitado.
-- 3) Luego copia Project URL y anon public key en app.js.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  section text not null,
  grade text not null,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  section text not null,
  grade text not null,
  email text not null,
  phone text,
  items jsonb not null,
  total numeric(10,2) not null,
  status text not null default 'Nuevo',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.orders enable row level security;

drop policy if exists "profile own select" on public.profiles;
create policy "profile own select" on public.profiles
for select to authenticated using (auth.uid() = id);

drop policy if exists "profile own insert" on public.profiles;
create policy "profile own insert" on public.profiles
for insert to authenticated with check (auth.uid() = id);

drop policy if exists "profile own update" on public.profiles;
create policy "profile own update" on public.profiles
for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "user create order" on public.orders;
create policy "user create order" on public.orders
for insert to authenticated with check (auth.uid() = customer_id);

drop policy if exists "user own orders" on public.orders;
create policy "user own orders" on public.orders
for select to authenticated using (auth.uid() = customer_id);

-- IMPORTANTE:
-- El panel Admin de esta versión tiene la contraseña solicitada 221208 en el frontend.
-- Para producción, NO conviene publicar una contraseña administrativa dentro de GitHub.
-- Lo seguro es crear un usuario administrador de Supabase y una Edge Function/RLS
-- que permita leer todos los pedidos solamente a ese usuario.
