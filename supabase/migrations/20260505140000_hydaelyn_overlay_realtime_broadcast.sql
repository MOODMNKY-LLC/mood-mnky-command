-- Hydaelyn: broadcast to overlay channel when overlay_config is updated so overlay can refresh without polling.
-- Uses realtime.send (public channel overlay:{overlay_token}); overlay subscribes with anon key.
-- See .cursor/rules/use-realtime.mdc for broadcast patterns.

create or replace function public.hydaelyn_overlay_config_broadcast()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  overlay_token_val text;
begin
  select s.overlay_token
  into overlay_token_val
  from public.stream_sessions s
  where s.id = coalesce(new.stream_session_id, old.stream_session_id)
  limit 1;

  if overlay_token_val is not null then
    perform realtime.send(
      jsonb_build_object('at', now()),
      'stats_updated',
      'overlay:' || overlay_token_val,
      false
    );
  end if;

  return coalesce(new, old);
end;
$$;

comment on function public.hydaelyn_overlay_config_broadcast() is
  'On overlay_config insert/update, broadcast stats_updated to overlay:{overlay_token} for live overlay refresh.';

drop trigger if exists hydaelyn_overlay_config_realtime_trigger on public.overlay_config;
create trigger hydaelyn_overlay_config_realtime_trigger
  after insert or update on public.overlay_config
  for each row
  execute function public.hydaelyn_overlay_config_broadcast();
