-- CODE MNKY config: key-value store for default model, system prompt override, tool toggles.
-- Used by LABZ chat and CODE MNKY control panel. RLS: authenticated users can read/write.

create table public.code_mnky_config (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text,
  updated_at timestamptz not null default now()
);

comment on table public.code_mnky_config is 'CODE MNKY / LABZ assistant config: default_model, system_prompt_override, tool_overrides (JSON).';
create index code_mnky_config_key_idx on public.code_mnky_config (key);

alter table public.code_mnky_config enable row level security;

create policy "code_mnky_config_authenticated_all"
  on public.code_mnky_config for all
  to authenticated
  using (true)
  with check (true);
