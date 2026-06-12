-- Send messages via security definer functions (INSERT ... RETURNING fails under RLS).

create or replace function public.send_channel_message(
  p_channel_id uuid,
  p_content text
)
returns public.messages
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  new_message public.messages;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  perform public.ensure_user_profile();

  if not exists (
    select 1
    from public.channel_members cm
    where cm.channel_id = p_channel_id and cm.user_id = uid
  ) then
    raise exception 'Not a member of this channel';
  end if;

  insert into public.messages (channel_id, user_id, content)
  values (p_channel_id, uid, p_content)
  returning * into new_message;

  return new_message;
end;
$$;

create or replace function public.send_dm_message(
  p_conversation_id uuid,
  p_content text
)
returns public.dm_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  new_message public.dm_messages;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  perform public.ensure_user_profile();

  if not exists (
    select 1
    from public.dm_participants dp
    where dp.conversation_id = p_conversation_id and dp.user_id = uid
  ) then
    raise exception 'Not a participant in this conversation';
  end if;

  insert into public.dm_messages (conversation_id, user_id, content)
  values (p_conversation_id, uid, p_content)
  returning * into new_message;

  return new_message;
end;
$$;

-- Reliable message reads (RLS + profile embed can fail on channel_members subquery)
create or replace function public.get_channel_messages(p_channel_ids uuid[])
returns table (
  id uuid,
  channel_id uuid,
  user_id uuid,
  content text,
  created_at timestamptz,
  display_name text
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  return query
  select
    m.id,
    m.channel_id,
    m.user_id,
    m.content,
    m.created_at,
    p.display_name
  from public.messages m
  inner join public.profiles p on p.id = m.user_id
  where m.channel_id = any (p_channel_ids)
    and exists (
      select 1
      from public.channel_members cm
      where cm.channel_id = m.channel_id and cm.user_id = uid
    )
  order by m.created_at;
end;
$$;

create or replace function public.get_dm_messages(p_conversation_ids uuid[])
returns table (
  id uuid,
  conversation_id uuid,
  user_id uuid,
  content text,
  created_at timestamptz,
  display_name text
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  return query
  select
    dm.id,
    dm.conversation_id,
    dm.user_id,
    dm.content,
    dm.created_at,
    p.display_name
  from public.dm_messages dm
  inner join public.profiles p on p.id = dm.user_id
  where dm.conversation_id = any (p_conversation_ids)
    and exists (
      select 1
      from public.dm_participants dp
      where dp.conversation_id = dm.conversation_id and dp.user_id = uid
    )
  order by dm.created_at;
end;
$$;

grant execute on function public.send_channel_message(uuid, text) to authenticated;
grant execute on function public.send_dm_message(uuid, text) to authenticated;
grant execute on function public.get_channel_messages(uuid[]) to authenticated;
grant execute on function public.get_dm_messages(uuid[]) to authenticated;
