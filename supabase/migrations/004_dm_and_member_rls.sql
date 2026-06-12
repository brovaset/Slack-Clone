-- DM creation + inviting members hit the same RLS patterns as channel creation:
-- 1) INSERT ... RETURNING blocked before child rows exist
-- 2) Self-referential SELECT policies hide the inviter's own membership row

-- ── Channel members ──────────────────────────────────────────────────────────

drop policy if exists "Users see their own channel membership" on public.channel_members;
create policy "Users see their own channel membership"
  on public.channel_members for select
  to authenticated
  using (auth.uid() = user_id);

-- ── DM conversations ─────────────────────────────────────────────────────────

drop policy if exists "Users can view DM conversations with no participants yet" on public.dm_conversations;
create policy "Users can view DM conversations with no participants yet"
  on public.dm_conversations for select
  to authenticated
  using (
    not exists (
      select 1 from public.dm_participants dp
      where dp.conversation_id = dm_conversations.id
    )
  );

-- ── DM participants ──────────────────────────────────────────────────────────

drop policy if exists "Users see their own DM participation" on public.dm_participants;
create policy "Users see their own DM participation"
  on public.dm_participants for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can view DM participants in new conversations" on public.dm_participants;
create policy "Users can view DM participants in new conversations"
  on public.dm_participants for select
  to authenticated
  using (
    not exists (
      select 1 from public.dm_participants dp
      where dp.conversation_id = dm_participants.conversation_id
    )
  );

drop policy if exists "Users can add DM participants" on public.dm_participants;
create policy "Users can add DM participants"
  on public.dm_participants for insert
  to authenticated
  with check (
    auth.uid() = user_id
    or exists (
      select 1 from public.dm_participants dp
      where dp.conversation_id = dm_participants.conversation_id
        and dp.user_id = auth.uid()
    )
    or not exists (
      select 1 from public.dm_participants dp
      where dp.conversation_id = dm_participants.conversation_id
    )
  );
