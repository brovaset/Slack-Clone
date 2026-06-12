-- File and image attachments on channel + DM messages (Supabase Storage).

alter table public.messages
  add column if not exists attachment_url text,
  add column if not exists attachment_name text,
  add column if not exists attachment_type text;

alter table public.dm_messages
  add column if not exists attachment_url text,
  add column if not exists attachment_name text,
  add column if not exists attachment_type text;

insert into storage.buckets (id, name, public, file_size_limit)
values ('chat-uploads', 'chat-uploads', true, 10485760)
on conflict (id) do update
set public = true, file_size_limit = 10485760;

drop policy if exists "Authenticated users can upload chat files" on storage.objects;
create policy "Authenticated users can upload chat files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'chat-uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Authenticated users can read chat files" on storage.objects;
create policy "Authenticated users can read chat files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'chat-uploads');

drop policy if exists "Authenticated users can update own chat files" on storage.objects;
create policy "Authenticated users can update own chat files"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'chat-uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop function if exists public.send_channel_message(uuid, text);

create or replace function public.send_channel_message(
  p_channel_id uuid,
  p_content text,
  p_attachment_url text default null,
  p_attachment_name text default null,
  p_attachment_type text default null
)
returns public.messages
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  new_message public.messages;
  body text := coalesce(trim(p_content), '');
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if body = '' and p_attachment_url is null then
    raise exception 'Message cannot be empty';
  end if;

  perform public.ensure_user_profile();

  if not exists (
    select 1
    from public.channel_members cm
    where cm.channel_id = p_channel_id and cm.user_id = uid
  ) then
    raise exception 'Not a member of this channel';
  end if;

  insert into public.messages (
    channel_id, user_id, content, attachment_url, attachment_name, attachment_type
  )
  values (
    p_channel_id, uid, body, p_attachment_url, p_attachment_name, p_attachment_type
  )
  returning * into new_message;

  return new_message;
end;
$$;

drop function if exists public.send_dm_message(uuid, text);

create or replace function public.send_dm_message(
  p_conversation_id uuid,
  p_content text,
  p_attachment_url text default null,
  p_attachment_name text default null,
  p_attachment_type text default null
)
returns public.dm_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  new_message public.dm_messages;
  body text := coalesce(trim(p_content), '');
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if body = '' and p_attachment_url is null then
    raise exception 'Message cannot be empty';
  end if;

  perform public.ensure_user_profile();

  if not exists (
    select 1
    from public.dm_participants dp
    where dp.conversation_id = p_conversation_id and dp.user_id = uid
  ) then
    raise exception 'Not a participant in this conversation';
  end if;

  insert into public.dm_messages (
    conversation_id, user_id, content, attachment_url, attachment_name, attachment_type
  )
  values (
    p_conversation_id, uid, body, p_attachment_url, p_attachment_name, p_attachment_type
  )
  returning * into new_message;

  return new_message;
end;
$$;

drop function if exists public.get_channel_messages(uuid[]);

create or replace function public.get_channel_messages(p_channel_ids uuid[])
returns table (
  id uuid,
  channel_id uuid,
  user_id uuid,
  content text,
  created_at timestamptz,
  display_name text,
  attachment_url text,
  attachment_name text,
  attachment_type text
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
    p.display_name,
    m.attachment_url,
    m.attachment_name,
    m.attachment_type
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

drop function if exists public.get_dm_messages(uuid[]);

create or replace function public.get_dm_messages(p_conversation_ids uuid[])
returns table (
  id uuid,
  conversation_id uuid,
  user_id uuid,
  content text,
  created_at timestamptz,
  display_name text,
  attachment_url text,
  attachment_name text,
  attachment_type text
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
    p.display_name,
    dm.attachment_url,
    dm.attachment_name,
    dm.attachment_type
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

grant execute on function public.send_channel_message(uuid, text, text, text, text) to authenticated;
grant execute on function public.send_dm_message(uuid, text, text, text, text) to authenticated;
grant execute on function public.get_channel_messages(uuid[]) to authenticated;
grant execute on function public.get_dm_messages(uuid[]) to authenticated;
