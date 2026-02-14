-- Seed data for local development (optional).
-- Runs on `supabase db reset`. Adds minimal data for E2E Chat Blending Flow testing.

-- Minimal fragrance oils for blend suggestions (Leather, Vanilla, Blood Orange, Lavender)
insert into public.fragrance_oils (notion_id, name, family, candle_safe, max_usage_candle)
values
  ('e2e-leather', 'Leather', 'Leather', true, 5),
  ('e2e-vanilla', 'Vanilla', 'Gourmand', true, 10),
  ('e2e-blood-orange', 'Blood Orange', 'Citrus', true, 5),
  ('e2e-lavender', 'Lavender', 'Floral', true, 10),
  ('e2e-cedar', 'Cedar', 'Woody', true, 8),
  ('e2e-cinnamon', 'Cinnamon', 'Spicy', true, 2)
on conflict (notion_id) do nothing;
