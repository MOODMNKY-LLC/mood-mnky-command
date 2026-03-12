-- Chat attachments: bucket for Verse chat file uploads + persist attachment URLs on messages.
-- Enables durable attachment URLs so images/files remain visible after reload.

-- 1) Storage bucket for chat attachments (public read so model and UI can load images)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('chat-attachments', 'chat-attachments', true, 10485760, array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf', 'text/plain'
  ])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types,
  updated_at = now();

-- RLS for storage.objects (chat-attachments): user can upload/delete under own folder
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'public_read_chat_attachments') then
    create policy "public_read_chat_attachments" on storage.objects for select to anon, authenticated using (bucket_id = 'chat-attachments');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'auth_upload_chat_attachments') then
    create policy "auth_upload_chat_attachments" on storage.objects for insert to authenticated
      with check (bucket_id = 'chat-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'auth_delete_own_chat_attachments') then
    create policy "auth_delete_own_chat_attachments" on storage.objects for delete using (bucket_id = 'chat-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);
  end if;
end
$$;

-- 2) Persist attachment URLs with user messages (for reload / history)
alter table public.chat_messages
  add column if not exists attachments jsonb not null default '[]'::jsonb;

comment on column public.chat_messages.attachments is 'For user messages: array of { url, filename, mediaType } for durable attachment display.';
