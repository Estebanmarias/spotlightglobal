alter table public.event_registrations add column if not exists anonymised_at timestamptz;

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
  v_labels constant text[] := array['name','title','first_name','last_name','full_name','email','role',
    'status','guest_status','event_date','session_date','amount','recurrence','ministry_id','member_id',
    'event_id','intake_id','program_id','user_id','enrollment_id','session_id'];
  v_track constant text[] := array['status','guest_status','role','permissions','is_ministry_leader',
    'payment_status','approval_status','registration_status','registration_open','registration_enabled',
    'is_featured','price','capacity','registration_capacity','event_date','recurrence','title','name',
    'amount_paid','amount_due','is_active'];
begin
  -- Set by the retention job so it doesn't fill the audit log row by row
  if current_setting('app.skip_audit', true) = 'on' then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

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
    raise warning 'audit_row_change failed: %', sqlerrm;
  end;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create or replace function public.run_retention(p_apply boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  result jsonb := jsonb_build_object('mode', case when p_apply then 'applied' else 'dry_run' end);
  n bigint;
begin
  perform set_config('app.skip_audit', 'on', true);

  -- 1. Prayer requests from the public form: 90 days after handled. New ones are never deleted.
  begin
    if p_apply then
      delete from public.prayer_requests
      where status <> 'new' and coalesce(handled_at, created_at) < now() - interval '90 days';
      get diagnostics n = row_count;
    else
      select count(*) into n from public.prayer_requests
      where status <> 'new' and coalesce(handled_at, created_at) < now() - interval '90 days';
    end if;
    result := result || jsonb_build_object('prayer_requests_deleted', n);
  exception when others then
    result := result || jsonb_build_object('prayer_requests_deleted', 'error: ' || sqlerrm);
  end;

  -- 2. Event prayer requests: 90 days after the event ends
  begin
    if p_apply then
      delete from public.event_prayer_requests r
      using public.church_events e
      where e.id = r.event_id
        and coalesce(e.event_end_date, e.event_date) < current_date - interval '90 days';
      get diagnostics n = row_count;
    else
      select count(*) into n
      from public.event_prayer_requests r
      join public.church_events e on e.id = r.event_id
      where coalesce(e.event_end_date, e.event_date) < current_date - interval '90 days';
    end if;
    result := result || jsonb_build_object('event_prayer_requests_deleted', n);
  exception when others then
    result := result || jsonb_build_object('event_prayer_requests_deleted', 'error: ' || sqlerrm);
  end;

  -- 3. Event registrations: 12 months after the event ends, remove personal details, keep the counts
  begin
    if p_apply then
      update public.event_registrations r
      set full_name = 'Removed registrant',
          email = 'removed-' || r.id::text || '@removed.invalid',
          phone = '0000000000',
          location = 'Removed',
          accommodation_notes = null,
          special_request = null,
          anonymised_at = now()
      from public.church_events e
      where e.id = r.event_id
        and r.anonymised_at is null
        and coalesce(e.event_end_date, e.event_date) < current_date - interval '12 months';
      get diagnostics n = row_count;
    else
      select count(*) into n
      from public.event_registrations r
      join public.church_events e on e.id = r.event_id
      where r.anonymised_at is null
        and coalesce(e.event_end_date, e.event_date) < current_date - interval '12 months';
    end if;
    result := result || jsonb_build_object('event_registrations_anonymised', n);
  exception when others then
    result := result || jsonb_build_object('event_registrations_anonymised', 'error: ' || sqlerrm);
  end;

  -- 4. Event email log: 12 months
  begin
    if p_apply then
      delete from public.event_email_log where created_at < now() - interval '12 months';
      get diagnostics n = row_count;
    else
      select count(*) into n from public.event_email_log where created_at < now() - interval '12 months';
    end if;
    result := result || jsonb_build_object('event_email_log_deleted', n);
  exception when others then
    result := result || jsonb_build_object('event_email_log_deleted', 'error: ' || sqlerrm);
  end;

  -- 5. Class email log: 12 months
  begin
    if p_apply then
      delete from public.class_email_log where created_at < now() - interval '12 months';
      get diagnostics n = row_count;
    else
      select count(*) into n from public.class_email_log where created_at < now() - interval '12 months';
    end if;
    result := result || jsonb_build_object('class_email_log_deleted', n);
  exception when others then
    result := result || jsonb_build_object('class_email_log_deleted', 'error: ' || sqlerrm);
  end;

  -- 6. Giver confirmations: 24 months, only once handled
  begin
    if p_apply then
      delete from public.giving_confirmations
      where status <> 'new' and coalesce(handled_at, created_at) < now() - interval '24 months';
      get diagnostics n = row_count;
    else
      select count(*) into n from public.giving_confirmations
      where status <> 'new' and coalesce(handled_at, created_at) < now() - interval '24 months';
    end if;
    result := result || jsonb_build_object('giving_confirmations_deleted', n);
  exception when others then
    result := result || jsonb_build_object('giving_confirmations_deleted', 'error: ' || sqlerrm);
  end;

  -- 7. Class enrollments are kept for certificate verification. Only the phone number goes, after 24 months.
  begin
    if p_apply then
      update public.class_enrollments set phone = null
      where phone is not null and created_at < now() - interval '24 months';
      get diagnostics n = row_count;
    else
      select count(*) into n from public.class_enrollments
      where phone is not null and created_at < now() - interval '24 months';
    end if;
    result := result || jsonb_build_object('class_enrollment_phones_cleared', n);
  exception when others then
    result := result || jsonb_build_object('class_enrollment_phones_cleared', 'error: ' || sqlerrm);
  end;

  -- 8. Partner submissions: 24 months, only once handled
  begin
    if p_apply then
      delete from public.partner_submissions
      where status <> 'new' and created_at < now() - interval '24 months';
      get diagnostics n = row_count;
    else
      select count(*) into n from public.partner_submissions
      where status <> 'new' and created_at < now() - interval '24 months';
    end if;
    result := result || jsonb_build_object('partner_submissions_deleted', n);
  exception when others then
    result := result || jsonb_build_object('partner_submissions_deleted', 'error: ' || sqlerrm);
  end;

  -- 9. Audit log: 24 months
  begin
    if p_apply then
      delete from public.audit_logs where created_at < now() - interval '24 months';
      get diagnostics n = row_count;
    else
      select count(*) into n from public.audit_logs where created_at < now() - interval '24 months';
    end if;
    result := result || jsonb_build_object('audit_logs_deleted', n);
  exception when others then
    result := result || jsonb_build_object('audit_logs_deleted', 'error: ' || sqlerrm);
  end;

  return result;
end;
$$;

revoke all on function public.run_retention(boolean) from public, anon, authenticated;
grant execute on function public.run_retention(boolean) to service_role;