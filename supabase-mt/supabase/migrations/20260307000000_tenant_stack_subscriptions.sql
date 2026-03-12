-- Multi-tenant Supabase (MT) — tenant_stack_subscriptions (full-stack provisioning requests).
-- Purpose: Store per-tenant requests for the full MOOD MNKY DevOps/Agent stack: package (compose profile),
-- specs (CPU, RAM, disk), and Proxmox/VM metadata. Used by Ansible for create VM/LXC and deploy.
-- RLS: tenant admins can create and see their subscriptions; platform_admin sees and updates all.

create table if not exists public.tenant_stack_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  package text not null check (package in ('core', 'agent', 'agent-gpu-nvidia', 'agent-gpu-amd', 'supabase')),
  spec_cpu int not null default 2,
  spec_ram_mb int not null default 4096,
  spec_disk_gb int not null default 50,
  proxmox_node text,
  vm_id int,
  lxc_id int,
  status text not null default 'requested' check (status in ('requested', 'provisioning', 'running', 'failed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.tenant_stack_subscriptions is 'Per-tenant full-stack provisioning: package (compose profile), specs, Proxmox VM/LXC id, status. Platform admin runs Ansible with subscription id.';
comment on column public.tenant_stack_subscriptions.package is 'Compose profile: core, agent, agent-gpu-nvidia, agent-gpu-amd, supabase.';
comment on column public.tenant_stack_subscriptions.spec_cpu is 'Requested vCPU count for the VM/LXC.';
comment on column public.tenant_stack_subscriptions.spec_ram_mb is 'Requested RAM in MB.';
comment on column public.tenant_stack_subscriptions.spec_disk_gb is 'Requested disk in GB.';
comment on column public.tenant_stack_subscriptions.proxmox_node is 'Proxmox node name where the VM/LXC was created (set by Ansible).';
comment on column public.tenant_stack_subscriptions.vm_id is 'Proxmox VM id after creation (set by Ansible).';
comment on column public.tenant_stack_subscriptions.lxc_id is 'Proxmox LXC id after creation (set by Ansible).';
comment on column public.tenant_stack_subscriptions.status is 'requested | provisioning | running | failed.';

create index idx_tenant_stack_subscriptions_tenant_id on public.tenant_stack_subscriptions(tenant_id);
create index idx_tenant_stack_subscriptions_status on public.tenant_stack_subscriptions(status);

alter table public.tenant_stack_subscriptions enable row level security;

-- Tenant admins and platform_admin can select their tenant's subscriptions; platform_admin sees all.
create policy "tenant_stack_subscriptions_select_tenant_or_platform"
  on public.tenant_stack_subscriptions for select
  to authenticated
  using (
    public.is_tenant_member(tenant_id, auth.uid())
    or public.is_platform_admin(auth.uid())
  );

-- Only tenant admins can insert a subscription for their tenant.
create policy "tenant_stack_subscriptions_insert_tenant_admin"
  on public.tenant_stack_subscriptions for insert
  to authenticated
  with check (public.is_tenant_admin(tenant_id, auth.uid()));

-- Tenant admins can update their tenant's row; platform_admin can update any (e.g. status, vm_id).
create policy "tenant_stack_subscriptions_update_tenant_admin_or_platform"
  on public.tenant_stack_subscriptions for update
  to authenticated
  using (
    public.is_tenant_admin(tenant_id, auth.uid())
    or public.is_platform_admin(auth.uid())
  )
  with check (
    public.is_tenant_admin(tenant_id, auth.uid())
    or public.is_platform_admin(auth.uid())
  );

-- Tenant admins can delete their tenant's subscription; platform_admin can delete any.
create policy "tenant_stack_subscriptions_delete_tenant_admin_or_platform"
  on public.tenant_stack_subscriptions for delete
  to authenticated
  using (
    public.is_tenant_admin(tenant_id, auth.uid())
    or public.is_platform_admin(auth.uid())
  );
