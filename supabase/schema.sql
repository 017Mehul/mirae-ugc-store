-- MIRAE production commerce schema.
-- Run this only in the dedicated MIRAE Supabase project.
create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  price_inr integer not null check (price_inr >= 0),
  category text not null,
  images text[] not null default '{}',
  available_sizes text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null,
  sku text unique not null,
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
  razorpay_order_id text unique,
  razorpay_payment_id text,
  status text not null default 'pending' check (status in ('pending','paid','failed','cancelled','refunded')),
  total_inr integer not null check (total_inr >= 0),
  customer_email text,
  shipping_address jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  size text,
  quantity integer not null check (quantity > 0),
  unit_price_inr integer not null check (unit_price_inr >= 0)
);

alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.contact_messages enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products" on public.products for select to anon, authenticated using (active = true);

drop policy if exists "Public can read active variants" on public.product_variants;
create policy "Public can read active variants" on public.product_variants for select to anon, authenticated
using (exists (select 1 from public.products p where p.id = product_id and p.active = true));

drop policy if exists "Users can read own orders" on public.orders;
create policy "Users can read own orders" on public.orders for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own order items" on public.order_items;
create policy "Users can read own order items" on public.order_items for select to authenticated
using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));

revoke all on public.newsletter_subscribers from anon, authenticated;
revoke all on public.contact_messages from anon, authenticated;
revoke all on public.orders from anon, authenticated;
revoke all on public.order_items from anon, authenticated;

-- Atomic inventory reservation/release for concurrent checkout safety.
create or replace function public.reserve_order_inventory(p_order_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare item record; current_stock integer;
begin
  for item in
    select o.id from public.orders o
    where o.status = 'pending' and o.inventory_reserved = true
      and o.reservation_expires_at < now()
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

  update public.orders
  set inventory_reserved = true
  where id = p_order_id;
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
    select oi.product_id, oi.size, oi.quantity
    from public.order_items oi where oi.order_id = p_order_id
  loop
    update public.product_variants
    set stock = stock + item.quantity
    where product_id = item.product_id and size = item.size;
  end loop;
  update public.orders set inventory_reserved = false where id = p_order_id;
end;
$$;

revoke all on function public.reserve_order_inventory(uuid) from public;
revoke all on function public.release_order_inventory(uuid) from public;
