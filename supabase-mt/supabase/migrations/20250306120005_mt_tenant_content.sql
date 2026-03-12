-- Multi-tenant Supabase (MT) — tenant_content (per-tenant content and narratives).
-- Purpose: Tenant-specific content (fragrance stories, Dojo/LABZ copy, glossary); RLS by tenant.
-- Run only against the MT Supabase project.

create table if not exists public.tenant_content (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  content_type text not null,
  slug text,
  key text,
  body text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.tenant_content is 'Per-tenant content (fragrance_story, dojo_hero, labz_glossary_entry, etc.).';
create index idx_tenant_content_tenant_id on public.tenant_content(tenant_id);
create index idx_tenant_content_tenant_type on public.tenant_content(tenant_id, content_type);
create unique index idx_tenant_content_tenant_slug on public.tenant_content(tenant_id, content_type, slug) where slug is not null;
create unique index idx_tenant_content_tenant_key on public.tenant_content(tenant_id, content_type, key) where key is not null;

alter table public.tenant_content enable row level security;

create policy "tenant_content_select_member"
  on public.tenant_content for select
  to authenticated
  using (public.is_tenant_member(tenant_id, auth.uid()));

create policy "tenant_content_insert_admin"
  on public.tenant_content for insert
  to authenticated
  with check (public.is_tenant_admin(tenant_id, auth.uid()));

create policy "tenant_content_update_admin"
  on public.tenant_content for update
  to authenticated
  using (public.is_tenant_admin(tenant_id, auth.uid()))
  with check (public.is_tenant_admin(tenant_id, auth.uid()));

create policy "tenant_content_delete_admin"
  on public.tenant_content for delete
  to authenticated
  using (public.is_tenant_admin(tenant_id, auth.uid()));
