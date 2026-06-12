-- Reliable DM list, member picker, and conversation creation.

create or replace function public.list_workspace_profiles()
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
  order by p.display_name;
$$;

create or replace function public.get_my_dms()
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
  inner join public.profiles p on p.id = dp_other.user_id
  where dp_me.user_id = auth.uid()
  order by p.display_name;
$$;

create or replace function public.get_or_create_dm(p_other_user_id uuid)
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

  if p_other_user_id = uid then
    raise exception 'Cannot message yourself';
  end if;

  if not exists (select 1 from public.profiles where id = p_other_user_id) then
    raise exception 'User not found';
  end if;

  perform public.ensure_user_profile();

  select dp1.conversation_id
  into conv_id
  from public.dm_participants dp1
  inner join public.dm_participants dp2
    on dp1.conversation_id = dp2.conversation_id
  where dp1.user_id = uid
    and dp2.user_id = p_other_user_id
  limit 1;

  if conv_id is not null then
    return conv_id;
  end if;

  insert into public.dm_conversations default values
  returning id into conv_id;

  insert into public.dm_participants (conversation_id, user_id)
  values (conv_id, uid);

  insert into public.dm_participants (conversation_id, user_id)
  values (conv_id, p_other_user_id);

  return conv_id;
end;
$$;

grant execute on function public.list_workspace_profiles() to authenticated;
grant execute on function public.get_my_dms() to authenticated;
grant execute on function public.get_or_create_dm(uuid) to authenticated;
