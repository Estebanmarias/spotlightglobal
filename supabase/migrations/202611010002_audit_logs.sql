-- Replace the members-only trigger from before
drop trigger if exists members_audit on public.members;
drop function if exists public.audit_member_changes();

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_name text;
  v_email text;
  v_row jsonb;
  v_old jsonb;
  v_new jsonb;
  v_id text;
  v_label jsonb;
  v_changed text[];
  v_tracked jsonb;
  v_meta jsonb := '{}'::jsonb;
  -- identifying fields copied into the log (private text is never in this list)
  v_labels constant text[] := array['name','title','first_name','last_name','full_name','email','role',
    'status','guest_status','event_date','session_date','amount','recurrence','ministry_id','member_id',
    'event_id','intake_id','program_id','user_id','enrollment_id','session_id'];
  -- fields where the old and new values are recorded
  v_track constant text[] := array['status','guest_status','role','permissions','is_ministry_leader',
    'payment_status','approval_status','registration_status','registration_open','registration_enabled',
    'is_featured','price','capacity','registration_capacity','event_date','recurrence','title','name',
    'amount_paid','amount_due','is_active'];
begin
  begin
    if tg_op = 'DELETE' then v_row := to_jsonb(old); else v_row := to_jsonb(new); end if;
    v_id := coalesce(v_row->>'id', v_row->>'user_id');

    if v_actor is not null then
      select full_name, email into v_name, v_email
      from public.admin_roles where user_id = v_actor limit 1;
    end if;

    select coalesce(jsonb_object_agg(k, v_row->k), '{}'::jsonb) into v_label
    from unnest(v_labels) as k
    where v_row ? k;

    if tg_op = 'UPDATE' then
      v_old := to_jsonb(old);
      v_new := to_jsonb(new);
      select coalesce(array_agg(k order by k), '{}'::text[]) into v_changed
      from jsonb_object_keys(v_new) as k
      where k <> 'updated_at' and (v_new -> k) is distinct from (v_old -> k);

      if coalesce(array_length(v_changed, 1), 0) = 0 then
        return new;
      end if;

      select coalesce(jsonb_object_agg(k, jsonb_build_object('from', v_old -> k, 'to', v_new -> k)), '{}'::jsonb)
        into v_tracked
      from unnest(v_changed) as k
      where k = any (v_track);

      v_meta := jsonb_build_object('changed', to_jsonb(v_changed), 'tracked', v_tracked);
    end if;

    v_meta := v_meta || jsonb_build_object(
      'record', v_label,
      'via', case when v_actor is null then 'server' else 'browser' end
    );

    insert into public.audit_logs (actor_user_id, actor_name, actor_email, action, entity_type, entity_id, metadata)
    values (
      v_actor, v_name, v_email,
      tg_table_name || '.' || case tg_op when 'INSERT' then 'created' when 'DELETE' then 'deleted' else 'updated' end,
      tg_table_name, v_id, v_meta
    );
  exception when others then
    -- A logging problem must never block a delete or an edit
    raise warning 'audit_row_change failed: %', sqlerrm;
  end;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function public.audit_row_change() from public, anon, authenticated;

-- i = insert, u = update, d = delete. Tables that don't exist are skipped.
do $$
declare
  t record;
begin
  for t in
    select * from (values
      ('members', 'ud'), ('admin_roles', 'iud'), ('ministries', 'iud'), ('ministry_members', 'id'),
      ('ministry_leaders', 'iud'), ('church_events', 'iud'), ('event_registrations', 'ud'),
      ('event_prayer_requests', 'ud'), ('community_photos', 'iud'), ('partner_submissions', 'ud'),
      ('testimonies', 'd'), ('class_programs', 'iud'), ('class_intakes', 'iud'), ('class_sessions', 'd'),
      ('class_enrollments', 'ud'), ('class_attendance', 'd'),
      -- likely names for tables I haven't seen; skipped if they don't exist
      ('attendance', 'iud'), ('attendance_records', 'iud'), ('sunday_attendance', 'iud'),
      ('giving', 'iud'), ('giving_records', 'iud'), ('donations', 'iud'),
      ('devotionals', 'iud'), ('blog_posts', 'iud')
    ) as v(tbl, ev)
  loop
    if to_regclass('public.' || t.tbl) is null then continue; end if;
    execute format('drop trigger if exists audit_row_change on public.%I', t.tbl);
    execute format(
      'create trigger audit_row_change after %s on public.%I for each row execute function public.audit_row_change()',
      array_to_string(array(
        select case c when 'i' then 'insert' when 'u' then 'update' else 'delete' end
        from unnest(string_to_array(t.ev, null)) as c
      ), ' or '),
      t.tbl
    );
  end loop;
end $$;