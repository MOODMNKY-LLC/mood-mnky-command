-- Proxmox cluster integration: config, node/guest snapshots cache, audit log.
-- Used by CODE-MNKY app cluster dashboard. Development environment only.

-- Config: key-value for primary_node, poll_interval_sec, features (jsonb).
create table public.proxmox_cluster_config (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text,
  updated_at timestamptz not null default now()
);

comment on table public.proxmox_cluster_config is 'Proxmox app config: primary_node, poll_interval_sec, features (JSON).';
create index proxmox_cluster_config_key_idx on public.proxmox_cluster_config (key);

alter table public.proxmox_cluster_config enable row level security;

create policy "proxmox_config_select_authenticated"
  on public.proxmox_cluster_config for select to authenticated using (true);
create policy "proxmox_config_insert_authenticated"
  on public.proxmox_cluster_config for insert to authenticated with check (true);
create policy "proxmox_config_update_authenticated"
  on public.proxmox_cluster_config for update to authenticated using (true) with check (true);
create policy "proxmox_config_delete_authenticated"
  on public.proxmox_cluster_config for delete to authenticated using (true);

-- Cached node status (one row per node, overwrite on poll).
create table public.proxmox_node_snapshots (
  id uuid primary key default gen_random_uuid(),
  node_id text not null,
  hostname text not null,
  status text,
  cpu numeric,
  memory_used bigint,
  memory_total bigint,
  uptime bigint,
  snapshot_at timestamptz not null default now(),
  unique (node_id)
);

comment on table public.proxmox_node_snapshots is 'Cached Proxmox node status for dashboard.';
create index proxmox_node_snapshots_node_id_idx on public.proxmox_node_snapshots (node_id);
create index proxmox_node_snapshots_snapshot_at_idx on public.proxmox_node_snapshots (snapshot_at);

alter table public.proxmox_node_snapshots enable row level security;

create policy "proxmox_node_snapshots_select_authenticated"
  on public.proxmox_node_snapshots for select to authenticated using (true);
create policy "proxmox_node_snapshots_insert_authenticated"
  on public.proxmox_node_snapshots for insert to authenticated with check (true);
create policy "proxmox_node_snapshots_update_authenticated"
  on public.proxmox_node_snapshots for update to authenticated using (true) with check (true);
create policy "proxmox_node_snapshots_delete_authenticated"
  on public.proxmox_node_snapshots for delete to authenticated using (true);

-- Cached guest list (one row per guest, overwrite on poll). Composite key node+vmid.
create table public.proxmox_guest_snapshots (
  id uuid primary key default gen_random_uuid(),
  node text not null,
  vmid integer not null,
  name text,
  type text not null check (type in ('qemu', 'lxc')),
  status text,
  cores integer,
  memory_mb integer,
  storage text,
  snapshot_at timestamptz not null default now(),
  unique (node, vmid)
);

comment on table public.proxmox_guest_snapshots is 'Cached Proxmox guest (VM/LXC) list for dashboard.';
create index proxmox_guest_snapshots_node_vmid_idx on public.proxmox_guest_snapshots (node, vmid);
create index proxmox_guest_snapshots_snapshot_at_idx on public.proxmox_guest_snapshots (snapshot_at);

alter table public.proxmox_guest_snapshots enable row level security;

create policy "proxmox_guest_snapshots_select_authenticated"
  on public.proxmox_guest_snapshots for select to authenticated using (true);
create policy "proxmox_guest_snapshots_insert_authenticated"
  on public.proxmox_guest_snapshots for insert to authenticated with check (true);
create policy "proxmox_guest_snapshots_update_authenticated"
  on public.proxmox_guest_snapshots for update to authenticated using (true) with check (true);
create policy "proxmox_guest_snapshots_delete_authenticated"
  on public.proxmox_guest_snapshots for delete to authenticated using (true);

-- Audit log: who did what (e.g. guest_start).
create table public.proxmox_audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  action text not null,
  node text,
  vmid integer,
  details jsonb,
  created_at timestamptz not null default now()
);

comment on table public.proxmox_audit_log is 'Audit log for Proxmox actions (guest start/stop, etc.).';
create index proxmox_audit_log_user_id_idx on public.proxmox_audit_log (user_id);
create index proxmox_audit_log_created_at_idx on public.proxmox_audit_log (created_at desc);

alter table public.proxmox_audit_log enable row level security;

create policy "proxmox_audit_log_select_authenticated"
  on public.proxmox_audit_log for select to authenticated using (true);
create policy "proxmox_audit_log_insert_own"
  on public.proxmox_audit_log for insert to authenticated
  with check (auth.uid() = user_id);
create policy "proxmox_audit_log_no_update"
  on public.proxmox_audit_log for update to authenticated using (false);
create policy "proxmox_audit_log_no_delete"
  on public.proxmox_audit_log for delete to authenticated using (false);
