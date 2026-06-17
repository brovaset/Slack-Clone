-- Multi-workspace support: workspaces, membership, scoped channels/DMs.

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member'
    check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

alter table public.channels
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;

alter table public.dm_conversations
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;

-- Backfill a default workspace for existing data
insert into public.workspaces (name, slug)
values ('Slack Clone', 'slack-clone')
on conflict (slug) do nothing;

update public.channels
set workspace_id = (select id from public.workspaces where slug = 'slack-clone' limit 1)
where workspace_id is null;

update public.dm_conversations
set workspace_id = (select id from public.workspaces where slug = 'slack-clone' limit 1)
where workspace_id is null;

insert into public.workspace_members (workspace_id, user_id, role)
select w.id, p.id, 'member'
from public.workspaces w
cross join public.profiles p
where w.slug = 'slack-clone'
on conflict do nothing;

alter table public.channels
  alter column workspace_id set not null;

alter table public.dm_conversations
  alter column workspace_id set not null;

alter table public.channels drop constraint if exists channels_name_key;
create unique index if not exists channels_workspace_name_idx
  on public.channels (workspace_id, name);

create or replace function public.is_workspace_member(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = auth.uid()
  );
$$;

create policy "Members can view their workspaces"
  on public.workspaces for select
  to authenticated
  using (public.is_workspace_member(id));

create policy "Members can view workspace membership"
  on public.workspace_members for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

-- Slug helper
create or replace function public.make_workspace_slug(p_name text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  base text;
  candidate text;
  suffix int := 0;
begin
  base := lower(trim(p_name));
  base := regexp_replace(base, '[^a-z0-9]+', '-', 'g');
  base := regexp_replace(base, '(^-+|-+$)', '', 'g');
  if base = '' then
    base := 'workspace';
  end if;
  candidate := base;
  while exists (select 1 from public.workspaces w where w.slug = candidate) loop
    suffix := suffix + 1;
    candidate := base || '-' || suffix::text;
  end loop;
  return candidate;
end;
$$;

-- Seed default channels inside a workspace
create or replace function public.seed_workspace_channels(p_workspace_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.channels (name, description, workspace_id)
  select v.name, v.description, p_workspace_id
  from (
    values
      ('general', 'Company-wide announcements and general discussion'),
      ('random', 'Non-work banter and fun stuff')
  ) as v(name, description)
  where not exists (
    select 1
    from public.channels c
    where c.workspace_id = p_workspace_id
      and c.name = v.name
  );

  insert into public.channel_members (channel_id, user_id)
  select c.id, p_user_id
  from public.channels c
  where c.workspace_id = p_workspace_id
    and c.name in ('general', 'random')
  on conflict do nothing;
end;
$$;

create or replace function public.bootstrap_user_workspace(
  p_user_id uuid,
  p_workspace_name text
)
returns public.workspaces
language plpgsql
security definer
set search_path = public
as $$
declare
  new_workspace public.workspaces;
  safe_name text;
begin
  safe_name := trim(p_workspace_name);
  if safe_name = '' then
    safe_name := 'My Workspace';
  end if;
  if length(safe_name) > 100 then
    safe_name := left(safe_name, 100);
  end if;

  insert into public.workspaces (name, slug, created_by)
  values (safe_name, public.make_workspace_slug(safe_name), p_user_id)
  returning * into new_workspace;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace.id, p_user_id, 'owner')
  on conflict do nothing;

  perform public.seed_workspace_channels(new_workspace.id, p_user_id);

  return new_workspace;
end;
$$;

create or replace function public.get_my_workspaces()
returns setof public.workspaces
language sql
security definer
set search_path = public
stable
as $$
  select w.*
  from public.workspaces w
  inner join public.workspace_members wm on wm.workspace_id = w.id
  where wm.user_id = auth.uid()
  order by w.name;
$$;

create or replace function public.create_workspace(p_workspace_name text)
returns public.workspaces
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  new_workspace public.workspaces;
begin
  if uid is null then
    raise exception 'Not authenticated';
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

  new_workspace := public.bootstrap_user_workspace(uid, p_workspace_name);
  return new_workspace;
end;
$$;

create or replace function public.ensure_user_workspace()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  workspace_id uuid;
  workspace_name text;
begin
  if uid is null then
    return null;
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

  select wm.workspace_id
  into workspace_id
  from public.workspace_members wm
  where wm.user_id = uid
  order by wm.joined_at
  limit 1;

  if workspace_id is not null then
    return workspace_id;
  end if;

  select coalesce(
    (select raw_user_meta_data ->> 'workspace_name' from auth.users where id = uid),
    (select raw_user_meta_data ->> 'display_name' from auth.users where id = uid),
    'My Workspace'
  )
  into workspace_name;

  select id into workspace_id
  from public.bootstrap_user_workspace(uid, workspace_name);

  return workspace_id;
end;
$$;

-- Scoped channel membership for active workspace only
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
end;
$$;

create or replace function public.get_my_channels(p_workspace_id uuid)
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
    and c.workspace_id = p_workspace_id
  order by c.name;
$$;

create or replace function public.create_channel(
  p_workspace_id uuid,
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

  if not public.is_workspace_member(p_workspace_id) then
    raise exception 'Not a member of this workspace';
  end if;

  perform public.ensure_user_profile();

  insert into public.channels (name, description, workspace_id)
  values (channel_name, channel_description, p_workspace_id)
  returning * into new_channel;

  insert into public.channel_members (channel_id, user_id)
  values (new_channel.id, uid)
  on conflict do nothing;

  return new_channel;
end;
$$;

create or replace function public.list_workspace_profiles(p_workspace_id uuid)
returns table (
  id uuid,
  display_name text,
  custom_status text,
  user_status text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.display_name, p.custom_status, p.user_status, p.created_at
  from public.profiles p
  inner join public.workspace_members wm on wm.user_id = p.id
  where wm.workspace_id = p_workspace_id
    and public.is_workspace_member(p_workspace_id)
  order by p.display_name;
$$;

create or replace function public.get_my_dms(p_workspace_id uuid)
returns table (
  conversation_id uuid,
  other_user_id uuid,
  other_display_name text,
  other_user_status text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    dp_other.conversation_id,
    dp_other.user_id,
    p.display_name,
    p.user_status
  from public.dm_participants dp_me
  inner join public.dm_participants dp_other
    on dp_other.conversation_id = dp_me.conversation_id
    and dp_other.user_id <> dp_me.user_id
  inner join public.dm_conversations dc on dc.id = dp_me.conversation_id
  inner join public.profiles p on p.id = dp_other.user_id
  where dp_me.user_id = auth.uid()
    and dc.workspace_id = p_workspace_id
    and public.is_workspace_member(p_workspace_id)
  order by p.display_name;
$$;

create or replace function public.get_or_create_dm(
  p_workspace_id uuid,
  p_other_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  conv_id uuid;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_workspace_member(p_workspace_id) then
    raise exception 'Not a member of this workspace';
  end if;

  if p_other_user_id = uid then
    raise exception 'Cannot message yourself';
  end if;

  if not exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = p_other_user_id
  ) then
    raise exception 'User is not in this workspace';
  end if;

  perform public.ensure_user_profile();

  select dp1.conversation_id
  into conv_id
  from public.dm_participants dp1
  inner join public.dm_participants dp2
    on dp1.conversation_id = dp2.conversation_id
  inner join public.dm_conversations dc on dc.id = dp1.conversation_id
  where dp1.user_id = uid
    and dp2.user_id = p_other_user_id
    and dc.workspace_id = p_workspace_id
  limit 1;

  if conv_id is not null then
    return conv_id;
  end if;

  insert into public.dm_conversations (workspace_id)
  values (p_workspace_id)
  returning id into conv_id;

  insert into public.dm_participants (conversation_id, user_id)
  values (conv_id, uid);

  insert into public.dm_participants (conversation_id, user_id)
  values (conv_id, p_other_user_id);

  return conv_id;
end;
$$;

grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.get_my_workspaces() to authenticated;
grant execute on function public.create_workspace(text) to authenticated;
grant execute on function public.ensure_user_workspace() to authenticated;
grant execute on function public.bootstrap_user_workspace(uuid, text) to authenticated;

-- Replace old signatures
drop function if exists public.get_my_channels();
drop function if exists public.create_channel(text, text);
drop function if exists public.list_workspace_profiles();
drop function if exists public.get_my_dms();
drop function if exists public.get_or_create_dm(uuid);

grant execute on function public.get_my_channels(uuid) to authenticated;
grant execute on function public.create_channel(uuid, text, text) to authenticated;
grant execute on function public.list_workspace_profiles(uuid) to authenticated;
grant execute on function public.get_my_dms(uuid) to authenticated;
grant execute on function public.get_or_create_dm(uuid, uuid) to authenticated;
