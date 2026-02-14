-- MOOD MNKY Lab – form_schema for native inline form rendering
-- Purpose: Store form schema (questions) in funnel_definitions so chat can render inline intake without JotForm API

alter table public.funnel_definitions
  add column if not exists form_schema jsonb default '[]';

comment on column public.funnel_definitions.form_schema is 'Array of { type, text, order, required, options?, semanticKey? } for native form rendering. Excludes hidden run_id/user_id.';
