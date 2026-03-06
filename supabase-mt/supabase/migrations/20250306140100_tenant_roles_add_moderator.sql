-- Multi-tenant Supabase (MT) — add moderator to tenant role enums.
-- Purpose: Allow tenant_members and tenant_invites to use role 'moderator'
-- (between admin and member). Run only against the MT Supabase project.

-- =============================================================================
-- tenant_members: allow role 'moderator'
-- =============================================================================
alter table public.tenant_members
  drop constraint if exists tenant_members_role_check;

alter table public.tenant_members
  add constraint tenant_members_role_check
  check (role in ('owner', 'admin', 'moderator', 'member', 'viewer'));

comment on column public.tenant_members.role is
  'Tenant-scoped role: owner, admin, moderator, member, viewer.';

-- =============================================================================
-- tenant_invites: allow role 'moderator'
-- =============================================================================
alter table public.tenant_invites
  drop constraint if exists tenant_invites_role_check;

alter table public.tenant_invites
  add constraint tenant_invites_role_check
  check (role in ('admin', 'moderator', 'member', 'viewer'));

comment on column public.tenant_invites.role is
  'Role to assign on accept: admin, moderator, member, viewer (no owner via invite).';
