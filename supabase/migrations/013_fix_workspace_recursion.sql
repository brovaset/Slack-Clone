-- Fix infinite recursion between ensure_user_profile and ensure_user_workspace.
-- Also adds update_workspace_name. If stack depth errors persist, run 014.

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

create or replace function public.update_workspace_name(
  p_workspace_id uuid,
  p_workspace_name text
)
returns public.workspaces
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  safe_name text;
  updated public.workspaces;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_workspace_member(p_workspace_id) then
    raise exception 'Not a member of this workspace';
  end if;

  if not exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = uid
      and wm.role in ('owner', 'admin')
  ) then
    raise exception 'Only workspace owners can change the name';
  end if;

  safe_name := trim(p_workspace_name);
  if safe_name = '' then
    raise exception 'Workspace name is required';
  end if;
  if length(safe_name) > 100 then
    safe_name := left(safe_name, 100);
  end if;

  update public.workspaces
  set name = safe_name
  where id = p_workspace_id
  returning * into updated;

  if updated.id is null then
    raise exception 'Workspace not found';
  end if;

  return updated;
end;
$$;

grant execute on function public.update_workspace_name(uuid, text) to authenticated;
