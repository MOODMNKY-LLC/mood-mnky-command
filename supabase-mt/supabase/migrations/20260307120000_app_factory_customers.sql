-- =============================================================================
-- App Factory: customers
-- Purpose: Business entity or partner for the app factory. Used in intake and
--   project grouping. RLS: platform_admin only (internal operators).
-- =============================================================================

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  status text not null default 'active' check (status in ('active', 'suspended', 'archived')),
  primary_contact_name text,
  primary_contact_email text,
  notes text,
  created_at timestamptz default now()
);

comment on table public.customers is 'Business entity or partner for app factory intake and project grouping.';
comment on column public.customers.status is 'Lifecycle: active, suspended, archived.';

create index idx_customers_status on public.customers(status);

alter table public.customers enable row level security;

-- Platform admin only (app factory is internal operations).
create policy "customers_select_platform_admin"
  on public.customers for select
  to authenticated
  using (public.is_platform_admin(auth.uid()));

create policy "customers_insert_platform_admin"
  on public.customers for insert
  to authenticated
  with check (public.is_platform_admin(auth.uid()));

create policy "customers_update_platform_admin"
  on public.customers for update
  to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

create policy "customers_delete_platform_admin"
  on public.customers for delete
  to authenticated
  using (public.is_platform_admin(auth.uid()));
