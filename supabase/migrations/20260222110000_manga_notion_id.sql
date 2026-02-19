-- Migration: Add notion_id to manga tables for Notion sync
-- Purpose: Idempotent upsert when syncing from Notion MNKY_* databases.

alter table public.mnky_collections
  add column if not exists notion_id text unique;

alter table public.mnky_issues
  add column if not exists notion_id text unique;

alter table public.mnky_chapters
  add column if not exists notion_id text unique;

alter table public.mnky_panels
  add column if not exists notion_id text unique;

alter table public.mnky_hotspots
  add column if not exists notion_id text unique;
