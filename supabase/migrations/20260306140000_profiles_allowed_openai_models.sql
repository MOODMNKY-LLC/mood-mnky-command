-- Flow-mnky: per-user OpenAI model allow list for fallback chat.
-- When set, only these model ids are allowed for this user; when null/empty, no restriction.

alter table public.profiles
  add column if not exists allowed_openai_models text[] default null;

comment on column public.profiles.allowed_openai_models is 'Allowed OpenAI model ids for this user (e.g. gpt-4o, gpt-4o-mini). Null or empty = no restriction.';
