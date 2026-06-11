-- Profile presence fields
alter table public.profiles
  add column if not exists custom_status text not null default '',
  add column if not exists user_status text not null default 'active'
    check (user_status in ('active', 'away', 'dnd'));

-- Channel membership
create table if not exists public.channel_members (
  channel_id uuid not null references public.channels(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (channel_id, user_id)
);

-- Direct message conversations
create table if not exists public.dm_conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table if not exists public.dm_participants (
  conversation_id uuid not null references public.dm_conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (conversation_id, user_id)
);

create table if not exists public.dm_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.dm_conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.channel_members enable row level security;
alter table public.dm_conversations enable row level security;
alter table public.dm_participants enable row level security;
alter table public.dm_messages enable row level security;

-- Drop overly permissive channel/message policies
drop policy if exists "Channels are viewable by authenticated users" on public.channels;
drop policy if exists "Messages are viewable by authenticated users" on public.messages;

-- Channels: members only
create policy "Users see channels they belong to"
  on public.channels for select
  to authenticated
  using (
    exists (
      select 1 from public.channel_members cm
      where cm.channel_id = channels.id and cm.user_id = auth.uid()
    )
  );

-- Messages: channel members only
create policy "Users see messages in their channels"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.channel_members cm
      where cm.channel_id = messages.channel_id and cm.user_id = auth.uid()
    )
  );

-- Channel members policies
create policy "Users see members of their channels"
  on public.channel_members for select
  to authenticated
  using (
    exists (
      select 1 from public.channel_members cm
      where cm.channel_id = channel_members.channel_id and cm.user_id = auth.uid()
    )
  );

create policy "Channel members can invite others"
  on public.channel_members for insert
  to authenticated
  with check (
    exists (
      select 1 from public.channel_members cm
      where cm.channel_id = channel_members.channel_id and cm.user_id = auth.uid()
    )
    or auth.uid() = channel_members.user_id
  );

create policy "Members can remove from channel"
  on public.channel_members for delete
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.channel_members cm
      where cm.channel_id = channel_members.channel_id and cm.user_id = auth.uid()
    )
  );

-- DM conversation policies
create policy "Users see their DM conversations"
  on public.dm_conversations for select
  to authenticated
  using (
    exists (
      select 1 from public.dm_participants dp
      where dp.conversation_id = dm_conversations.id and dp.user_id = auth.uid()
    )
  );

create policy "Users can create DM conversations"
  on public.dm_conversations for insert
  to authenticated
  with check (true);

create policy "Users see DM participants in their conversations"
  on public.dm_participants for select
  to authenticated
  using (
    exists (
      select 1 from public.dm_participants dp
      where dp.conversation_id = dm_participants.conversation_id and dp.user_id = auth.uid()
    )
  );

create policy "Users can add DM participants"
  on public.dm_participants for insert
  to authenticated
  with check (
    auth.uid() = user_id
    or exists (
      select 1 from public.dm_participants dp
      where dp.conversation_id = dm_participants.conversation_id and dp.user_id = auth.uid()
    )
  );

create policy "Users see messages in their DMs"
  on public.dm_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.dm_participants dp
      where dp.conversation_id = dm_messages.conversation_id and dp.user_id = auth.uid()
    )
  );

create policy "Users can send DM messages"
  on public.dm_messages for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.dm_participants dp
      where dp.conversation_id = dm_messages.conversation_id and dp.user_id = auth.uid()
    )
  );

-- Auto-join default channels when a profile is created
create or replace function public.join_default_channels()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.channel_members (channel_id, user_id)
  select c.id, new.id
  from public.channels c
  where c.name in ('general', 'random')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_profile_join_channels on public.profiles;
create trigger on_profile_join_channels
  after insert on public.profiles
  for each row execute procedure public.join_default_channels();

-- Backfill existing profiles into default channels
insert into public.channel_members (channel_id, user_id)
select c.id, p.id
from public.profiles p
cross join public.channels c
where c.name in ('general', 'random')
on conflict do nothing;

-- Realtime (enable in Supabase dashboard if needed)
-- alter publication supabase_realtime add table public.messages;
-- alter publication supabase_realtime add table public.dm_messages;
-- alter publication supabase_realtime add table public.channel_members;
