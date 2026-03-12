-- Main → Community app asset slots for /main/community page (hero, Discord, Blog, Dojo card).
-- Uploads go to service-cards bucket under bundles/main.community.*; App Assets UI manages them.

insert into public.app_asset_slots (slot_key, label, category, route_hint)
values
  ('main.community.hero', 'Community hero', 'main-community', '/main/community'),
  ('main.community.discord', 'Discord section', 'main-community', '/main/community'),
  ('main.community.blog', 'Blog section', 'main-community', '/main/community'),
  ('main.community.dojo', 'Your Dojo card', 'main-community', '/main/community')
on conflict (slot_key) do nothing;
