-- MOOD MNKY Lab – E2E test funnel seed
-- Purpose: Active funnel with form_schema for Chat Blending Flow testing
-- Run after funnel tables and form_schema column exist. Idempotent.

insert into public.funnel_definitions (
  id,
  name,
  description,
  provider,
  provider_form_id,
  status,
  form_schema,
  question_mapping,
  sandbox,
  updated_at
) values (
  'a154a8f4-e329-4c9e-8360-64d8ce2d12c2',
  'Test Fragrance Intake',
  'E2E test funnel for Chat Blending Flow – inline intake',
  'jotform',
  null,
  'active',
  '[
    {"type": "text", "text": "What mood are you targeting?", "order": 1, "semanticKey": "target_mood", "required": true},
    {"type": "dropdown", "text": "Product type", "order": 2, "semanticKey": "product_type", "required": true, "options": ["Candle", "Soap", "Room Spray", "Perfume"]},
    {"type": "textarea", "text": "Fragrance hints or notes", "order": 3, "semanticKey": "fragrance_hints", "required": false}
  ]'::jsonb,
  '{"target_mood": "q1", "product_type": "q2", "fragrance_hints": "q3"}'::jsonb,
  true,
  now()
)
on conflict (id) do update set
  status = 'active',
  form_schema = excluded.form_schema,
  question_mapping = excluded.question_mapping,
  updated_at = now();
