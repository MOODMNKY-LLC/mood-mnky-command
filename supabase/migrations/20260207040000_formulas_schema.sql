-- Whole Elise Formulas Database
-- Tables: formula_categories, formulas, formula_phases, formula_ingredients

-- Lookup table for formula categories (skincare, haircare, diy, candle)
create table if not exists public.formula_categories (
  id text primary key,
  name text not null,
  sort_order int default 0
);

insert into public.formula_categories (id, name, sort_order) values
  ('skincare', 'Skincare', 1),
  ('haircare', 'Haircare', 2),
  ('diy', 'DIY', 3),
  ('candle', 'Candle', 4)
on conflict (id) do nothing;

-- Main formulas table
create table if not exists public.formulas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text default '',
  category_id text not null references public.formula_categories(id) on delete restrict,
  total_weight_g numeric not null default 250,
  source text not null default 'whole-elise' check (source in ('whole-elise', 'mood-mnky', 'custom')),
  external_url text,
  tags text[] default '{}',
  created_at timestamptz default now()
);

create index if not exists idx_formulas_category on public.formulas(category_id);
create unique index if not exists idx_formulas_slug on public.formulas(slug);

-- Phases within a formula (e.g. Heated Phase, Cool Down 1)
create table if not exists public.formula_phases (
  id uuid primary key default gen_random_uuid(),
  formula_id uuid not null references public.formulas(id) on delete cascade,
  sort_order int not null default 0,
  name text not null
);

create index if not exists idx_formula_phases_formula on public.formula_phases(formula_id);

-- Ingredients within a phase
create table if not exists public.formula_ingredients (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references public.formula_phases(id) on delete cascade,
  sort_order int not null default 0,
  name text not null,
  function text default 'See tutorial',
  percentage numeric not null,
  is_fragrance_oil boolean default false
);

create index if not exists idx_formula_ingredients_phase on public.formula_ingredients(phase_id);

-- RLS: readable by authenticated users; no write for regular users
alter table public.formulas enable row level security;
alter table public.formula_phases enable row level security;
alter table public.formula_ingredients enable row level security;
alter table public.formula_categories enable row level security;

create policy "formula_categories_select_all" on public.formula_categories for select using (true);
create policy "formulas_select_all" on public.formulas for select using (true);
create policy "formula_phases_select_all" on public.formula_phases for select using (true);
create policy "formula_ingredients_select_all" on public.formula_ingredients for select using (true);
