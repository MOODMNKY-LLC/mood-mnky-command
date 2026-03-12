-- Multi-tenant Supabase (MT) — tenant_brand_copy (per-tenant narrative and UX copy).
-- Purpose: Store per-tenant brand voice, product narratives, and microcopy; RLS by tenant.
-- Run only against the MT Supabase project.

create table if not exists public.tenant_brand_copy (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  scope text not null,
  key text not null,
  content text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (tenant_id, scope, key)
);

comment on table public.tenant_brand_copy is 'Per-tenant brand narrative and UX copy (e.g. hero_headline, fragrance_story_*).';
create index idx_tenant_brand_copy_tenant_id on public.tenant_brand_copy(tenant_id);
create index idx_tenant_brand_copy_tenant_scope on public.tenant_brand_copy(tenant_id, scope);

alter table public.tenant_brand_copy enable row level security;

create policy "tenant_brand_copy_select_member"
  on public.tenant_brand_copy for select
  to authenticated
  using (public.is_tenant_member(tenant_id, auth.uid()));

create policy "tenant_brand_copy_insert_admin"
  on public.tenant_brand_copy for insert
  to authenticated
  with check (public.is_tenant_admin(tenant_id, auth.uid()));

create policy "tenant_brand_copy_update_admin"
  on public.tenant_brand_copy for update
  to authenticated
  using (public.is_tenant_admin(tenant_id, auth.uid()))
  with check (public.is_tenant_admin(tenant_id, auth.uid()));

create policy "tenant_brand_copy_delete_admin"
  on public.tenant_brand_copy for delete
  to authenticated
  using (public.is_tenant_admin(tenant_id, auth.uid()));
