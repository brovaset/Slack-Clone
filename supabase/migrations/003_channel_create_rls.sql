-- Allow RETURNING / SELECT on a channel immediately after insert, before the
-- creator is added to channel_members (002 member-only SELECT blocks that).
drop policy if exists "Users can view channels with no members yet" on public.channels;

create policy "Users can view channels with no members yet"
  on public.channels for select
  to authenticated
  using (
    not exists (
      select 1 from public.channel_members cm
      where cm.channel_id = channels.id
    )
  );
