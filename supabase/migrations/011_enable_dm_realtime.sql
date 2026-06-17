-- Enable Supabase Realtime for DM delivery to receivers.
-- Safe to re-run: skips tables already in the publication.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'dm_messages'
  ) then
    alter publication supabase_realtime add table public.dm_messages;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'dm_participants'
  ) then
    alter publication supabase_realtime add table public.dm_participants;
  end if;
end $$;
