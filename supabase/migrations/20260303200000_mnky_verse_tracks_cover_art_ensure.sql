-- Ensure mnky-verse-tracks allows cover art (repair migration)
-- Fixes 400 InvalidMimeType when uploading image/jpeg from ID3 metadata.
-- Idempotent: safe to run even if already correct.
update storage.buckets
set allowed_mime_types = array[
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg',
  'audio/aac', 'audio/flac', 'audio/webm', 'audio/mp4', 'audio/x-m4a',
  'video/mp4',
  'image/jpeg', 'image/png', 'image/webp'
],
updated_at = now()
where id = 'mnky-verse-tracks';
