-- SHADOW GATE — Supabase schema (Day 4: products + per-user orders; Day 5: Stripe-paid orders).
-- Run once in the Supabase SQL editor (or via the Supabase CLI / MCP), then run supabase/seed.sql.
-- Accounts live in Supabase Auth (auth.users); each order belongs to exactly one auth user.

-- ---------------------------------------------------------------------------------------------------------------
-- products — the store catalog (12 cybersecurity services). Public read, no client writes.
-- ---------------------------------------------------------------------------------------------------------------
create table if not exists public.products (
  id                     uuid primary key default gen_random_uuid(),
  slug                   text not null unique check (slug ~ '^[a-z0-9-]{2,64}$'),
  name                   text not null,                       -- English name (Arabic in content.name.ar)
  description            text not null,                       -- English summary (Arabic in content.summary.ar)
  price                  numeric(10,2) not null default 0 check (price >= 0),  -- USD; 0 for quote-based services
  image                  text not null,
  category               text not null,
  audience               text not null check (audience in ('business', 'personal')),
  icon                   text not null,
  primary_action         text not null check (primary_action in ('add', 'quote', 'book')),
  layer                  text check (layer in ('website', 'email', 'cloud', 'accounts', 'ongoing')),
  featured               boolean not null default false,
  requires_authorization boolean not null default false,      -- penetration testing needs written authorization
  sort_order             integer not null default 0,
  pricing_kind           text not null check (pricing_kind in ('quote', 'illustrative')),
  currency               text not null default 'USD',
  content                jsonb not null default '{}'::jsonb,  -- bilingual texts: name, summary, scope, deliverables…
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists products_sort_idx on public.products (sort_order, created_at);

alter table public.products enable row level security;

drop policy if exists "Products are visible to everyone" on public.products;
create policy "Products are visible to everyone"
  on public.products for select
  to anon, authenticated
  using (true);
-- No insert/update/delete policies: only the service role (seed script / dashboard) can change products.

-- ---------------------------------------------------------------------------------------------------------------
-- orders — one row per service request or paid checkout. Each user can only ever see their own rows.
-- ---------------------------------------------------------------------------------------------------------------
create table if not exists public.orders (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users (id) on delete cascade,
  items                   jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 40),
  total                   numeric(10,2) not null default 0 check (total >= 0),
  has_quote_items         boolean not null default false,
  status                  text not null default 'pending' check (status in ('pending', 'paid')),
  package_slug            text,
  request_type            text not null default 'business' check (request_type in ('business', 'personal')),
  organisation            text not null default '' check (char_length(organisation) <= 120),
  phone                   text not null default '' check (char_length(phone) <= 40),
  message                 text not null default '' check (char_length(message) <= 2000),
  authorization_confirmed boolean not null default false,
  -- Day 5: Stripe Checkout (TEST MODE). Set only on orders saved after Stripe reports the session as paid.
  payment_method          text check (payment_method in ('stripe')),
  stripe_session_id       text unique,                         -- one order per Checkout Session (idempotent)
  payment_intent_id       text,
  currency                text not null default 'usd',
  amount_paid_cents       integer check (amount_paid_cents >= 0),
  paid_at                 timestamptz,
  created_at              timestamptz not null default now()
);

create index if not exists orders_user_created_idx on public.orders (user_id, created_at desc);

alter table public.orders enable row level security;

drop policy if exists "Users can read their own orders" on public.orders;
create policy "Users can read their own orders"
  on public.orders for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own pending orders" on public.orders;
create policy "Users can create their own pending orders"
  on public.orders for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and status = 'pending'
    and payment_method is null
    and stripe_session_id is null
  );
-- No update/delete policies and nothing for anon: a visitor can never read or change anyone else's orders, and
-- "paid" orders can only be written by the server (service role) after Stripe confirms the payment.

-- ---------------------------------------------------------------------------------------------------------------
-- Explicit Data API grants. RLS decides WHICH rows a role sees; these grants decide whether the role can reach the
-- table at all (needed on projects where new public tables are not exposed automatically).
-- ---------------------------------------------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;
grant select on table public.products to anon, authenticated;
grant select, insert on table public.orders to authenticated;
grant select, insert, update, delete on table public.products to service_role;
grant select, insert, update, delete on table public.orders to service_role;

-- Keep products.updated_at current.
create or replace function public.touch_updated_at() returns trigger
  language plpgsql
  set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();
