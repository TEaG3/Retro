-- Add explicit manual ordering to products.
-- Keep the same naming convention already used by categories.sort_order.
alter table public.products
  add column if not exists sort_order integer not null default 0;

create index if not exists products_active_sort_order_idx
  on public.products (is_active, sort_order, created_at desc);
