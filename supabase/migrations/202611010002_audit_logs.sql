create or replace function public.audit_member_changes()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_name text;
  v_email text;
begin
  begin
    if v_actor is not null then
      select full_name, email into v_name, v_email
      from public.admin_roles where user_id = v_actor limit 1;
    end if;

    if tg_op = 'DELETE' then
      insert into public.audit_logs (actor_user_id, actor_name, actor_email, action, entity_type, entity_id, metadata)
      values (v_actor, v_name, v_email, 'member.deleted', 'member', old.id::text,
        jsonb_build_object(
          'name', old.first_name || ' ' || old.last_name,
          'email', old.email,
          'guest_status', old.guest_status,
          'via', case when v_actor is null then 'server' else 'browser' end));
    elsif tg_op = 'UPDATE' and new.guest_status is distinct from old.guest_status then
      insert into public.audit_logs (actor_user_id, actor_name, actor_email, action, entity_type, entity_id, metadata)
      values (v_actor, v_name, v_email, 'member.status_changed', 'member', new.id::text,
        jsonb_build_object(
          'name', new.first_name || ' ' || new.last_name,
          'email', new.email,
          'from', old.guest_status,
          'to', new.guest_status,
          'via', case when v_actor is null then 'server' else 'browser' end));
    end if;
  exception when others then
    -- A logging problem must never block a delete or an edit
    raise warning 'audit_member_changes failed: %', sqlerrm;
  end;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists members_audit on public.members;
create trigger members_audit
  after delete or update of guest_status on public.members
  for each row execute function public.audit_member_changes();