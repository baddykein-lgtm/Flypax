-- ============================================================
-- FLYPAX — Esquema de base de datos (Supabase / PostgreSQL)
-- ============================================================
-- Cómo usarlo:
-- 1. Entra en tu proyecto de Supabase → SQL Editor
-- 2. Pega este archivo completo y ejecútalo (Run)
-- 3. Ve a Authentication y activa el proveedor que quieras
--    usar para el login de negocios (Email, Google, etc.)
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------
create type reservation_status as enum ('pendiente', 'confirmada', 'cancelada');
create type order_status       as enum ('nuevo', 'preparando', 'listo', 'entregado');
create type payment_method_t   as enum ('tarjeta', 'en_local');

-- ------------------------------------------------------------
-- BUSINESSES — un negocio suscrito
-- ------------------------------------------------------------
create table businesses (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  category_id  text not null,               -- 'restaurante' | 'peluqueria' | 'clinica' | 'taller' | 'tienda' | 'otro'
  icon         text default '🏪',
  slug         text not null unique,         -- flypax.app/<slug>
  hours        jsonb default '{}'::jsonb,    -- {"0": "9:30–20:00", "1": null, ...}  (0 = lunes)
  profile      jsonb default '{}'::jsonb,    -- respuestas del onboarding: {tables: 12, takeaway: true, ...}
  country      text default 'España',
  currency     text default 'EUR',
  created_at   timestamptz default now()
);
create index businesses_owner_idx on businesses(owner_id);
create index businesses_slug_idx  on businesses(slug);

-- ------------------------------------------------------------
-- PRODUCTS — carta / catálogo de servicios
-- ------------------------------------------------------------
create table products (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  name         text not null,
  category     text default 'General',
  price        numeric(10,2) not null default 0,
  emoji        text default '⭐',
  description  text,
  created_at   timestamptz default now()
);
create index products_business_idx on products(business_id);

-- ------------------------------------------------------------
-- RESERVATIONS — reservas o citas (campos varían según el negocio)
-- ------------------------------------------------------------
create table reservations (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  client_name   text not null,
  client_phone  text,
  date          date not null,
  time          text not null,              -- 'HH:MM'
  people        int,                        -- solo si el negocio usa "personas" (restaurante, otro)
  detail        text,                       -- texto libre para taller/peluquería/clínica (vehículo, servicio, motivo...)
  status        reservation_status not null default 'pendiente',
  created_at    timestamptz default now()
);
create index reservations_business_idx on reservations(business_id);
create index reservations_date_idx     on reservations(business_id, date);

-- ------------------------------------------------------------
-- ORDERS — pedidos en mesa (solo negocios con hasTableOrders)
-- ------------------------------------------------------------
create table orders (
  id               uuid primary key default gen_random_uuid(),
  business_id      uuid not null references businesses(id) on delete cascade,
  table_number     int not null,
  client_name      text,
  client_phone     text,
  items            jsonb not null default '[]'::jsonb,  -- [{name, qty, price}]
  total            numeric(10,2) not null default 0,
  status           order_status not null default 'nuevo',
  paid             boolean not null default false,
  payment_method   payment_method_t,
  created_at       timestamptz default now()
);
create index orders_business_idx on orders(business_id);
create index orders_status_idx   on orders(business_id, status);

-- ------------------------------------------------------------
-- INVOICES — facturas simples
-- ------------------------------------------------------------
create table invoices (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  client_name  text not null,
  items        jsonb not null default '[]'::jsonb,
  total        numeric(10,2) not null default 0,
  paid         boolean not null default false,
  date         date not null default current_date,
  created_at   timestamptz default now()
);
create index invoices_business_idx on invoices(business_id);

-- ------------------------------------------------------------
-- SUBSCRIPTIONS — estado del plan de 19,99€/mes (lo escribe el webhook de Stripe)
-- ------------------------------------------------------------
create table subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  business_id           uuid not null unique references businesses(id) on delete cascade,
  stripe_customer_id    text,
  stripe_subscription_id text,
  status                text default 'incomplete',  -- refleja el status de Stripe: active, past_due, canceled...
  current_period_end    timestamptz,
  created_at            timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Regla general: el dueño del negocio ve y edita todo lo suyo.
-- El público (clientes sin cuenta) puede LEER negocios/productos
-- y CREAR reservas/pedidos, pero no modificarlos ni leer facturas.
-- ============================================================

alter table businesses    enable row level security;
alter table products      enable row level security;
alter table reservations  enable row level security;
alter table orders        enable row level security;
alter table invoices      enable row level security;
alter table subscriptions enable row level security;

-- BUSINESSES
create policy "Owners manage their business" on businesses
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Public can view businesses" on businesses
  for select
  using (true);

-- PRODUCTS
create policy "Owners manage products" on products
  for all
  using (exists (select 1 from businesses b where b.id = products.business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from businesses b where b.id = products.business_id and b.owner_id = auth.uid()));

create policy "Public can view products" on products
  for select
  using (true);

-- RESERVATIONS
create policy "Owners manage reservations" on reservations
  for all
  using (exists (select 1 from businesses b where b.id = reservations.business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from businesses b where b.id = reservations.business_id and b.owner_id = auth.uid()));

create policy "Public can create reservations" on reservations
  for insert
  with check (true);

-- ORDERS
create policy "Owners manage orders" on orders
  for all
  using (exists (select 1 from businesses b where b.id = orders.business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from businesses b where b.id = orders.business_id and b.owner_id = auth.uid()));

create policy "Public can create orders" on orders
  for insert
  with check (true);

-- INVOICES (sin acceso público, ni siquiera lectura)
create policy "Owners manage invoices" on invoices
  for all
  using (exists (select 1 from businesses b where b.id = invoices.business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from businesses b where b.id = invoices.business_id and b.owner_id = auth.uid()));

-- SUBSCRIPTIONS (solo lectura para el dueño; las escrituras las hace el webhook de Stripe con la service_role key, que salta RLS)
create policy "Owners view their subscription" on subscriptions
  for select
  using (exists (select 1 from businesses b where b.id = subscriptions.business_id and b.owner_id = auth.uid()));
