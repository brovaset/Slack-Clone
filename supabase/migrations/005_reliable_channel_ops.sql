-- Reliable channel load/create via security definer functions (bypasses RLS edge cases).
-- Also backfills missing profiles and default channel memberships.

-- Ensure 002 profile columns exist (load fails if these are missing)
alter table public.profiles
  add column if not exists custom_status text not null default '',
  add column if not exists user_status text not null default 'active';

-- Backfill profiles for auth users missing a row
insert into public.profiles (id, display_name)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'display_name', split_part(u.email, '@', 1), 'User')
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- Backfill default channel membership
insert into public.channel_members (channel_id, user_id)
select c.id, p.id
from public.profiles p
cross join public.channels c
where c.name in ('general', 'random')
on conflict do nothing;

-- Create profile for the current user if the signup trigger missed them
create or replace function public.ensure_user_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    return;
  end if;

  insert into public.profiles (id, display_name)
  select
    uid,
    coalesce(
      (select raw_user_meta_data ->> 'display_name' from auth.users where id = uid),
      split_part((select email from auth.users where id = uid), '@', 1),
      'User'
    )
  on conflict (id) do nothing;

  insert into public.channel_members (channel_id, user_id)
  select c.id, uid
  from public.channels c
  where c.name in ('general', 'random')
  on conflict do nothing;
end;
$$;

-- List channels for the current user (no RLS join issues)
create or replace function public.get_my_channels()
returns setof public.channels
language sql
security definer
set search_path = public
stable
as $$
  select c.*
  from public.channels c
  inner join public.channel_members cm on cm.channel_id = c.id
  where cm.user_id = auth.uid()
  order by c.name;
$$;

-- Create channel and add creator as member in one transaction
create or replace function public.create_channel(
  channel_name text,
  channel_description text default null
)
returns public.channels
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  new_channel public.channels;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  perform public.ensure_user_profile();

  insert into public.channels (name, description)
  values (channel_name, channel_description)
  returning * into new_channel;

  insert into public.channel_members (channel_id, user_id)
  values (new_channel.id, uid)
  on conflict do nothing;

  return new_channel;
end;
$$;

-- List members of a channel (caller must be a member)
create or replace function public.get_channel_members(p_channel_id uuid)
returns table (
  user_id uuid,
  joined_at timestamptz,
  profile_id uuid,
  display_name text,
  custom_status text,
  user_status text,
  profile_created_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1
    from public.channel_members cm
    where cm.channel_id = p_channel_id and cm.user_id = auth.uid()
  ) then
    raise exception 'Not a member of this channel';
  end if;

  return query
  select
    cm.user_id,
    cm.joined_at,
    p.id,
    p.display_name,
    p.custom_status,
    p.user_status,
    p.created_at
  from public.channel_members cm
  inner join public.profiles p on p.id = cm.user_id
  where cm.channel_id = p_channel_id
  order by cm.joined_at;
end;
$$;

-- Add a user to a channel (caller must already be a member)
create or replace function public.add_channel_member(
  p_channel_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1
    from public.channel_members cm
    where cm.channel_id = p_channel_id and cm.user_id = auth.uid()
  ) then
    raise exception 'Not a member of this channel';
  end if;

  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'User not found';
  end if;

  insert into public.channel_members (channel_id, user_id)
  values (p_channel_id, p_user_id)
  on conflict do nothing;
end;
$$;

grant execute on function public.ensure_user_profile() to authenticated;
grant execute on function public.get_my_channels() to authenticated;
grant execute on function public.create_channel(text, text) to authenticated;
grant execute on function public.get_channel_members(uuid) to authenticated;
grant execute on function public.add_channel_member(uuid, uuid) to authenticated;
