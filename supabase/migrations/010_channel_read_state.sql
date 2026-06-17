-- Per-user channel read state (syncs across devices).

create table if not exists public.channel_read_state (
  user_id uuid not null references public.profiles(id) on delete cascade,
  channel_id uuid not null references public.channels(id) on delete cascade,
  last_viewed_at timestamptz not null,
  last_viewed_message_id uuid references public.messages(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (user_id, channel_id)
);

create index if not exists channel_read_state_user_id_idx
  on public.channel_read_state (user_id);

alter table public.channel_read_state enable row level security;

create policy "Users read own channel read state"
  on public.channel_read_state for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.get_my_channel_reads()
returns table (
  channel_id uuid,
  last_viewed_at timestamptz,
  last_viewed_message_id uuid
)
language sql
security definer
set search_path = public
stable
as $$
  select crs.channel_id, crs.last_viewed_at, crs.last_viewed_message_id
  from public.channel_read_state crs
  where crs.user_id = auth.uid();
$$;

create or replace function public.mark_channel_read(
  p_channel_id uuid,
  p_last_viewed_at timestamptz,
  p_last_viewed_message_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.channel_members
    where channel_id = p_channel_id and user_id = uid
  ) then
    raise exception 'Not a channel member';
  end if;

  insert into public.channel_read_state (
    user_id,
    channel_id,
    last_viewed_at,
    last_viewed_message_id,
    updated_at
  )
  values (uid, p_channel_id, p_last_viewed_at, p_last_viewed_message_id, now())
  on conflict (user_id, channel_id) do update
  set
    last_viewed_at = greatest(channel_read_state.last_viewed_at, excluded.last_viewed_at),
    last_viewed_message_id = case
      when excluded.last_viewed_at >= channel_read_state.last_viewed_at
        then excluded.last_viewed_message_id
      else channel_read_state.last_viewed_message_id
    end,
    updated_at = now();
end;
$$;

grant execute on function public.get_my_channel_reads() to authenticated;
grant execute on function public.mark_channel_read(uuid, timestamptz, uuid) to authenticated;

-- Enable realtime sync (run in SQL Editor if publication already exists).
-- alter publication supabase_realtime add table public.channel_read_state;
