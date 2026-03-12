-- Add optional author/agent for Verse blog (MOOD MNKY, SAGE MNKY, CODE MNKY).
-- Synced from Notion Author/Agent select; used for author card and fallback cover image.

alter table public.verse_blog_posts
  add column if not exists author_agent text;

comment on column public.verse_blog_posts.author_agent is 'Agent identifier: mood_mnky, sage_mnky, code_mnky (from Notion Author/Agent select).';
