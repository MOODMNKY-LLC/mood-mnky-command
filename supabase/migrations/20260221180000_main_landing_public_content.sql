-- Main landing page – public content tables (readable by anon for /main)
-- Purpose: source FAQ, feature cards, and social proof from Supabase for the editorial landing.
-- RLS: allow anon and authenticated to SELECT; restrict write to service role (admin-only updates via API/dashboard).

-- ========== main_landing_faq ==========
create table if not exists public.main_landing_faq (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_main_landing_faq_sort
  on public.main_landing_faq (sort_order asc);

alter table public.main_landing_faq enable row level security;

-- Public read for landing page
create policy "main_landing_faq_select_anon"
  on public.main_landing_faq for select to anon using (true);

create policy "main_landing_faq_select_authenticated"
  on public.main_landing_faq for select to authenticated using (true);

-- Writes via service role only (no anon/authenticated insert/update/delete)

-- ========== main_landing_features ==========
-- icon_name: Lucide icon identifier (e.g. Sparkles, Palette, Gem)
create table if not exists public.main_landing_features (
  id uuid primary key default gen_random_uuid(),
  icon_name text not null,
  title text not null,
  description text not null,
  sort_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_main_landing_features_sort
  on public.main_landing_features (sort_order asc);

alter table public.main_landing_features enable row level security;

create policy "main_landing_features_select_anon"
  on public.main_landing_features for select to anon using (true);

create policy "main_landing_features_select_authenticated"
  on public.main_landing_features for select to authenticated using (true);

-- ========== main_landing_social_proof ==========
create table if not exists public.main_landing_social_proof (
  id uuid primary key default gen_random_uuid(),
  value text not null,
  label text not null,
  sort_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_main_landing_social_proof_sort
  on public.main_landing_social_proof (sort_order asc);

alter table public.main_landing_social_proof enable row level security;

create policy "main_landing_social_proof_select_anon"
  on public.main_landing_social_proof for select to anon using (true);

create policy "main_landing_social_proof_select_authenticated"
  on public.main_landing_social_proof for select to authenticated using (true);

-- ========== Seed default content (idempotent: insert only if table empty) ==========
insert into public.main_landing_faq (question, answer, sort_order)
select v.question, v.answer, v.sort_order
from (values
  ('What is MOOD MNKY?', 'MOOD MNKY is a luxury fragrance brand focused on extreme personalization. We offer bespoke scents, the Blending Lab for creating your own blend, and AI companions that guide you through discovery and customization.', 0),
  ('What is the Blending Lab?', 'The Blending Lab is our interactive space where you choose fragrance notes and ratios to create a custom scent. You can experiment with accords and receive a handcrafted bottle that''s uniquely yours.', 1),
  ('How do I customize my scent?', 'Visit the Blending Lab (or blending guide) to explore our note library, adjust ratios, and save your profile. You can also work with MOOD MNKY—our AI companion—for recommendations before you blend.', 2),
  ('Do you ship internationally?', 'We currently ship to select regions. Check the footer or contact page for the latest shipping options and delivery times. Custom blends may have slightly longer lead times.', 3),
  ('What is the VERSE?', 'The VERSE is our storefront and community space: shop ready-to-wear scents, explore the Blending Lab, and connect with MOOD MNKY and other AI companions for a full sensory journey.', 4)
) as v(question, answer, sort_order)
where not exists (select 1 from public.main_landing_faq limit 1);

insert into public.main_landing_features (icon_name, title, description, sort_order)
select v.icon_name, v.title, v.description, v.sort_order
from (values
  ('Sparkles', 'Extreme Personalization', 'Scents tailored to your mood, story, and preferences. No two blends alike.', 0),
  ('Palette', 'Sensory Journeys', 'Explore fragrance families and discover how scent shapes experience.', 1),
  ('Gem', 'Handcrafted', 'Small-batch, artisanal blends made with care and premium ingredients.', 2),
  ('Beaker', 'The Dojo', 'Learn the craft. Master notes, accords, and the art of blending.', 3),
  ('FlaskConical', 'Blending Lab', 'Create your own scent in the Lab—notes, ratios, and a bottle that''s yours.', 4),
  ('Bot', 'AI Companions', 'MOOD MNKY and friends guide you through discovery and customization.', 5)
) as v(icon_name, title, description, sort_order)
where not exists (select 1 from public.main_landing_features limit 1);

insert into public.main_landing_social_proof (value, label, sort_order)
select v.value, v.label, v.sort_order
from (values
  ('50+', 'Scents & notes', 0),
  ('Bespoke', 'Blends', 1),
  ('Handcrafted', 'In-house', 2)
) as v(value, label, sort_order)
where not exists (select 1 from public.main_landing_social_proof limit 1);
