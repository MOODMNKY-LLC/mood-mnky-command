-- MOOD MNKY Lab – question mapping and sandbox for funnel definitions
-- Purpose: Enable deterministic answer extraction and safe testing

-- question_mapping: maps semantic keys (product_type, fragrance_hints, etc.) to JotForm question IDs (q1, q2, ...)
alter table public.funnel_definitions
  add column if not exists question_mapping jsonb default '{}';

-- sandbox: when true, funnel accepts webhooks for testing without affecting production
alter table public.funnel_definitions
  add column if not exists sandbox boolean default false;

-- provider_form_id: allow null for funnels created from builder before first sync
alter table public.funnel_definitions
  alter column provider_form_id drop not null;

-- Drop old unique index and create partial one (only when provider_form_id is set)
drop index if exists idx_funnel_definitions_provider_form;
create unique index idx_funnel_definitions_provider_form
  on public.funnel_definitions (provider, provider_form_id)
  where provider_form_id is not null;
