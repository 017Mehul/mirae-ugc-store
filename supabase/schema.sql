-- MIRAE production commerce schema.
-- Run this only in the dedicated MIRAE Supabase project.
create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text default '',
  price_inr integer not null check (price_inr >= 0),
  category text not null,
  images jsonb not null default '[]'::jsonb,
  available_sizes jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null,
  stock integer not null default 0 check (stock >= 0),
  unique(product_id, size)
);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  customer_email text not null,
  customer_name text not null,
  phone text not null,
  shipping_address text not null,
  city text not null,
  state text not null,
  pincode text not null,
  status text not null default 'pending',
  payment_provider text,
  payment_id text,
  inventory_reserved boolean not null default false,
  reservation_expires_at timestamptz,
  total_inr integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  size text,
  quantity integer not null check (quantity > 0),
  unit_price_inr integer not null check (unit_price_inr >= 0)
);

alter table public.orders add column if not exists inventory_reserved boolean not null default false;
alter table public.orders add column if not exists reservation_expires_at timestamptz;

alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.contact_messages enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products" on public.products for select to anon, authenticated using (active = true);

drop policy if exists "Public can read active variants" on public.product_variants;
drop policy if exists "Public can read variants" on public.product_variants;
create policy "Public can read active variants" on public.product_variants for select to anon, authenticated
using (exists (select 1 from public.products p where p.id = product_id and p.active = true));

drop policy if exists "Users can read own orders" on public.orders;
drop policy if exists "Users read own orders" on public.orders;
create policy "Users read own orders" on public.orders for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own order items" on public.order_items;
drop policy if exists "Users read own order items" on public.order_items;
create policy "Users read own order items" on public.order_items for select to authenticated
using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));

revoke all on public.products from anon, authenticated;
revoke all on public.product_variants from anon, authenticated;
revoke all on public.newsletter_subscribers from anon, authenticated;
revoke all on public.contact_messages from anon, authenticated;
revoke all on public.orders from anon, authenticated;
revoke all on public.order_items from anon, authenticated;

create index if not exists idx_orders_user_id_created_at on public.orders(user_id, created_at desc);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_order_items_product_id on public.order_items(product_id);

create or replace function public.reserve_order_inventory(p_order_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  item record;
  current_stock integer;
begin
  if exists (select 1 from public.orders where id = p_order_id and inventory_reserved = true) then
    return;
  end if;

  for item in
    select o.id from public.orders o
    where o.status = 'pending' and o.inventory_reserved = true and o.reservation_expires_at < now()
    for update
  loop
    perform public.release_order_inventory(item.id);
  end loop;

  for item in
    select oi.product_id, oi.size, oi.quantity
    from public.order_items oi
    where oi.order_id = p_order_id
    order by oi.product_id, oi.size
  loop
    select stock into current_stock
    from public.product_variants
    where product_id = item.product_id and size = item.size
    for update;
    if current_stock is null or current_stock < item.quantity then
      raise exception 'Insufficient inventory';
    end if;
    update public.product_variants
    set stock = stock - item.quantity
    where product_id = item.product_id and size = item.size;
  end loop;

  update public.orders set inventory_reserved = true where id = p_order_id;
end;
$$;

create or replace function public.release_order_inventory(p_order_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare item record;
begin
  if not exists (select 1 from public.orders where id = p_order_id and inventory_reserved = true) then
    return;
  end if;
  for item in
    select oi.product_id, oi.size, oi.quantity from public.order_items oi where oi.order_id = p_order_id
  loop
    update public.product_variants set stock = stock + item.quantity
    where product_id = item.product_id and size = item.size;
  end loop;
  update public.orders set inventory_reserved = false where id = p_order_id;
end;
$$;

revoke execute on function public.reserve_order_inventory(uuid) from public, anon, authenticated;
revoke execute on function public.release_order_inventory(uuid) from public, anon, authenticated;
grant execute on function public.reserve_order_inventory(uuid) to service_role;
grant execute on function public.release_order_inventory(uuid) to service_role;


-- Explicit deny policies document the intended zero direct-client-write model.
drop policy if exists "No direct client access" on public.contact_messages;
create policy "No direct client access" on public.contact_messages
for all to anon, authenticated using (false) with check (false);
drop policy if exists "No direct client access" on public.newsletter_subscribers;
create policy "No direct client access" on public.newsletter_subscribers
for all to anon, authenticated using (false) with check (false);

-- Force RLS as defense in depth. Server-side service-role operations remain intentional.
alter table public.products force row level security;
alter table public.product_variants force row level security;
alter table public.newsletter_subscribers force row level security;
alter table public.contact_messages force row level security;
alter table public.orders force row level security;
alter table public.order_items force row level security;

revoke all on schema public from anon, authenticated;
grant usage on schema public to anon, authenticated;


-- Server-only MFA assurance helper. The API calls this through service_role.
create or replace function public.user_mfa_required(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = pg_catalog, auth
as $$
  select exists (
    select 1 from auth.mfa_factors
    where user_id = p_user_id and status = 'verified'
  );
$$;
revoke execute on function public.user_mfa_required(uuid) from public, anon, authenticated;
grant execute on function public.user_mfa_required(uuid) to service_role;


-- Admin action audit trail. Direct client access is intentionally disabled.
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  target_type text not null,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists admin_audit_logs_created_at_idx on public.admin_audit_logs(created_at desc);
alter table public.admin_audit_logs enable row level security;
alter table public.admin_audit_logs force row level security;
revoke all on public.admin_audit_logs from anon, authenticated;
grant select, insert on public.admin_audit_logs to service_role;

create policy "No direct client access" on public.admin_audit_logs for all to anon, authenticated using (false) with check (false);
create index if not exists admin_audit_logs_actor_id_idx on public.admin_audit_logs(actor_id);
