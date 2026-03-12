-- Multi-tenant Supabase (MT) — optional tenant_invites table.
-- Purpose: invite users to a tenant by email; token-based accept flow.
-- Run only against the MT Supabase project.

create table if not exists public.tenant_invites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'member', 'viewer')),
  token text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id) on delete set null,
  unique (tenant_id, email)
);

comment on table public.tenant_invites is 'Pending invites to a tenant; accept flow uses token and creates tenant_members row.';
create index if not exists idx_tenant_invites_tenant_id on public.tenant_invites(tenant_id);
create index if not exists idx_tenant_invites_token on public.tenant_invites(token);
create index if not exists idx_tenant_invites_expires_at on public.tenant_invites(expires_at);

alter table public.tenant_invites enable row level security;

create policy "tenant_invites_select_admin"
  on public.tenant_invites for select
  to authenticated
  using (public.is_tenant_admin(tenant_id, auth.uid()));

create policy "tenant_invites_insert_admin"
  on public.tenant_invites for insert
  to authenticated
  with check (public.is_tenant_admin(tenant_id, auth.uid()));

create policy "tenant_invites_delete_admin"
  on public.tenant_invites for delete
  to authenticated
  using (public.is_tenant_admin(tenant_id, auth.uid()));
