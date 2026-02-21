-- Flowise user document stores: map profile to Flowise document store ID.
-- Purpose: Record which Flowise document store is assigned to which user for uploads and RAG.
--          App can create store via Flowise API then insert row, or admin assigns existing store.
-- Affected: new table flowise_user_document_stores.

-- ========== 1. flowise_user_document_stores ==========
create table if not exists public.flowise_user_document_stores (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  flowise_store_id text not null,
  display_name text,
  scope text not null default 'dojo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, scope)
);

comment on table public.flowise_user_document_stores is 'Flowise document store assigned per user/scope; users select/update own rows; admin insert/delete.';
comment on column public.flowise_user_document_stores.flowise_store_id is 'Flowise document store UUID from Flowise API.';
comment on column public.flowise_user_document_stores.scope is 'Scope identifier, e.g. dojo; one store per (profile_id, scope).';

create index if not exists flowise_user_document_stores_profile_id_idx
  on public.flowise_user_document_stores (profile_id);
create index if not exists flowise_user_document_stores_scope_idx
  on public.flowise_user_document_stores (scope);

-- updated_at trigger
create or replace function public.flowise_user_document_stores_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists flowise_user_document_stores_updated_at on public.flowise_user_document_stores;
create trigger flowise_user_document_stores_updated_at
  before update on public.flowise_user_document_stores
  for each row execute function public.flowise_user_document_stores_updated_at();

alter table public.flowise_user_document_stores enable row level security;

-- RLS: users select/update own rows; only admins insert/delete
drop policy if exists "flowise_user_document_stores_select_own" on public.flowise_user_document_stores;
create policy "flowise_user_document_stores_select_own"
  on public.flowise_user_document_stores for select to authenticated
  using (profile_id = auth.uid());

drop policy if exists "flowise_user_document_stores_update_own" on public.flowise_user_document_stores;
create policy "flowise_user_document_stores_update_own"
  on public.flowise_user_document_stores for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists "flowise_user_document_stores_insert_admin" on public.flowise_user_document_stores;
create policy "flowise_user_document_stores_insert_admin"
  on public.flowise_user_document_stores for insert to authenticated
  with check (public.is_admin());

drop policy if exists "flowise_user_document_stores_delete_admin" on public.flowise_user_document_stores;
create policy "flowise_user_document_stores_delete_admin"
  on public.flowise_user_document_stores for delete to authenticated
  using (public.is_admin());

grant select, update on public.flowise_user_document_stores to authenticated;
grant insert, delete on public.flowise_user_document_stores to authenticated;
