-- Multi-tenant Supabase (MT) — tenant_design_tokens (per-tenant theme/tokens).
-- Purpose: Design tokens (palette, spacing, typography) per tenant; RLS by tenant.
-- Run only against the MT Supabase project.

create table if not exists public.tenant_design_tokens (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  token_key text not null,
  value text not null,
  mode text check (mode is null or mode in ('light', 'dark')),
  palette text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index idx_tenant_design_tokens_tenant_key_mode_palette
  on public.tenant_design_tokens (tenant_id, token_key, coalesce(mode, ''), coalesce(palette, ''));

comment on table public.tenant_design_tokens is 'Per-tenant design tokens (e.g. --background, --verse-bg); optional mode and palette.';
create index idx_tenant_design_tokens_tenant_id on public.tenant_design_tokens(tenant_id);
create index idx_tenant_design_tokens_tenant_mode on public.tenant_design_tokens(tenant_id, mode);

alter table public.tenant_design_tokens enable row level security;

create policy "tenant_design_tokens_select_member"
  on public.tenant_design_tokens for select
  to authenticated
  using (public.is_tenant_member(tenant_id, auth.uid()));

create policy "tenant_design_tokens_insert_admin"
  on public.tenant_design_tokens for insert
  to authenticated
  with check (public.is_tenant_admin(tenant_id, auth.uid()));

create policy "tenant_design_tokens_update_admin"
  on public.tenant_design_tokens for update
  to authenticated
  using (public.is_tenant_admin(tenant_id, auth.uid()))
  with check (public.is_tenant_admin(tenant_id, auth.uid()));

create policy "tenant_design_tokens_delete_admin"
  on public.tenant_design_tokens for delete
  to authenticated
  using (public.is_tenant_admin(tenant_id, auth.uid()));
