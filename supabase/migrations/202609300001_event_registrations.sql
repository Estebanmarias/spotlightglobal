ALTER TABLE public.church_events
  ADD COLUMN IF NOT EXISTS event_end_date date,
  ADD COLUMN IF NOT EXISTS registration_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS registration_capacity integer,
  ADD COLUMN IF NOT EXISTS registration_deadline date,
  ADD COLUMN IF NOT EXISTS price_type text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS price numeric(12, 2),
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'NGN',
  ADD COLUMN IF NOT EXISTS payment_instructions text,
  ADD COLUMN IF NOT EXISTS special_session_label text,
  ADD COLUMN IF NOT EXISTS special_session_date date;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'church_events_price_type_check') THEN
    ALTER TABLE public.church_events
      ADD CONSTRAINT church_events_price_type_check CHECK (price_type IN ('free', 'paid'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'church_events_price_nonnegative_check') THEN
    ALTER TABLE public.church_events
      ADD CONSTRAINT church_events_price_nonnegative_check CHECK (price IS NULL OR price >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'church_events_capacity_positive_check') THEN
    ALTER TABLE public.church_events
      ADD CONSTRAINT church_events_capacity_positive_check CHECK (registration_capacity IS NULL OR registration_capacity > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'church_events_end_date_check') THEN
    ALTER TABLE public.church_events
      ADD CONSTRAINT church_events_end_date_check CHECK (event_end_date IS NULL OR event_end_date >= event_date);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'church_events_registration_deadline_check') THEN
    ALTER TABLE public.church_events
      ADD CONSTRAINT church_events_registration_deadline_check CHECK (registration_deadline IS NULL OR registration_deadline <= event_date);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'church_events_special_session_date_check') THEN
    ALTER TABLE public.church_events
      ADD CONSTRAINT church_events_special_session_date_check CHECK (
        special_session_date IS NULL OR
        (special_session_date >= event_date AND special_session_date <= coalesce(event_end_date, event_date))
      );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.church_events(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  full_name text NOT NULL CHECK (char_length(trim(full_name)) BETWEEN 2 AND 120),
  email text NOT NULL CHECK (char_length(email) <= 254),
  phone text NOT NULL CHECK (char_length(trim(phone)) BETWEEN 7 AND 30),
  location text NOT NULL CHECK (char_length(trim(location)) BETWEEN 2 AND 160),
  accommodation_needed boolean NOT NULL DEFAULT false,
  accommodation_notes text,
  children_count smallint NOT NULL DEFAULT 0 CHECK (children_count BETWEEN 0 AND 20),
  attendee_count smallint NOT NULL DEFAULT 1 CHECK (attendee_count BETWEEN 1 AND 21),
  attendance_dates date[] NOT NULL,
  special_session_attending boolean NOT NULL DEFAULT false,
  special_request text,
  referral_source text NOT NULL CHECK (char_length(trim(referral_source)) BETWEEN 2 AND 80),
  privacy_accepted boolean NOT NULL DEFAULT false,
  registration_status text NOT NULL DEFAULT 'registered'
    CHECK (registration_status IN ('registered', 'cancelled')),
  payment_status text NOT NULL CHECK (payment_status IN ('free', 'pending', 'paid', 'failed', 'refunded')),
  amount_due numeric(12, 2) NOT NULL DEFAULT 0 CHECK (amount_due >= 0),
  currency text NOT NULL DEFAULT 'NGN',
  payment_reference text,
  amount_paid numeric(12, 2) CHECK (amount_paid IS NULL OR amount_paid >= 0),
  paid_at timestamptz,
  paid_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  confirmation_email_sent_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS event_registrations_active_email_unique
  ON public.event_registrations (event_id, lower(email))
  WHERE registration_status = 'registered';

CREATE INDEX IF NOT EXISTS event_registrations_event_created_idx
  ON public.event_registrations (event_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.event_prayer_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL UNIQUE REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.church_events(id) ON DELETE CASCADE,
  request text NOT NULL CHECK (char_length(trim(request)) BETWEEN 3 AND 3000),
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'prayed', 'follow_up')),
  handled_at timestamptz,
  handled_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS event_prayer_requests_event_created_idx
  ON public.event_prayer_requests (event_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.event_email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  email_type text NOT NULL CHECK (email_type IN ('confirmation', 'payment_confirmed', 'reminder_7d', 'reminder_1d')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  provider_message_id text,
  error_message text,
  UNIQUE (registration_id, email_type)
);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_email_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.event_registrations, public.event_prayer_requests, public.event_email_log FROM anon, authenticated;
GRANT SELECT ON TABLE public.event_registrations, public.event_email_log TO authenticated;
GRANT SELECT, UPDATE ON TABLE public.event_prayer_requests TO authenticated;
GRANT ALL ON TABLE public.event_registrations, public.event_prayer_requests, public.event_email_log TO service_role;

CREATE OR REPLACE FUNCTION public.is_media_ministry_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_roles ar
    WHERE ar.user_id = auth.uid()
      AND ar.status = 'approved'
      AND (
        ar.role = 'super_admin'
        OR EXISTS (
          SELECT 1
          FROM public.ministry_leaders ml
          JOIN public.ministries m ON m.id = ml.ministry_id
          WHERE ml.user_id = auth.uid()
            AND lower(m.name) LIKE '%media%'
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_event_prayer_care_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles ar
    WHERE ar.user_id = auth.uid()
      AND ar.role = 'super_admin'
      AND ar.status = 'approved'
  );
$$;

REVOKE ALL ON FUNCTION public.is_media_ministry_manager() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_media_ministry_manager() TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.is_event_prayer_care_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_event_prayer_care_admin() TO authenticated, service_role;

DROP POLICY IF EXISTS "event_registrations_media_read" ON public.event_registrations;
CREATE POLICY "event_registrations_media_read"
  ON public.event_registrations FOR SELECT TO authenticated
  USING (public.is_media_ministry_manager());

DROP POLICY IF EXISTS "event_prayer_requests_pastoral_read" ON public.event_prayer_requests;
CREATE POLICY "event_prayer_requests_pastoral_read"
  ON public.event_prayer_requests FOR SELECT TO authenticated
  USING (public.is_event_prayer_care_admin());

DROP POLICY IF EXISTS "event_prayer_requests_pastoral_update" ON public.event_prayer_requests;
CREATE POLICY "event_prayer_requests_pastoral_update"
  ON public.event_prayer_requests FOR UPDATE TO authenticated
  USING (public.is_event_prayer_care_admin())
  WITH CHECK (public.is_event_prayer_care_admin());

DROP POLICY IF EXISTS "event_email_log_media_read" ON public.event_email_log;
CREATE POLICY "event_email_log_media_read"
  ON public.event_email_log FOR SELECT TO authenticated
  USING (public.is_media_ministry_manager());

CREATE OR REPLACE FUNCTION public.register_for_church_event(
  p_event_id uuid,
  p_full_name text,
  p_email text,
  p_phone text,
  p_location text,
  p_accommodation_needed boolean,
  p_accommodation_notes text,
  p_children_count smallint,
  p_attendance_dates date[],
  p_special_session_attending boolean,
  p_special_request text,
  p_prayer_request text,
  p_referral_source text,
  p_privacy_accepted boolean
)
RETURNS TABLE(registration_id uuid, payment_status text, amount_due numeric, currency text, event_title text, payment_instructions text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_event public.church_events%ROWTYPE;
  v_end_date date;
  v_party_size smallint;
  v_amount_due numeric(12, 2);
  v_payment_status text;
  v_registration_id uuid;
BEGIN
  SELECT * INTO v_event
  FROM public.church_events
  WHERE id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found' USING ERRCODE = 'P0002';
  END IF;
  v_end_date := coalesce(v_event.event_end_date, v_event.event_date);
  IF NOT v_event.registration_enabled THEN
    RAISE EXCEPTION 'Registration is closed' USING ERRCODE = 'P0001';
  END IF;
  IF current_date > v_end_date THEN
    RAISE EXCEPTION 'Event has ended' USING ERRCODE = 'P0001';
  END IF;
  IF v_event.registration_deadline IS NOT NULL AND current_date > v_event.registration_deadline THEN
    RAISE EXCEPTION 'Registration deadline has passed' USING ERRCODE = 'P0001';
  END IF;
  IF v_event.price_type = 'paid' AND (v_event.price IS NULL OR v_event.price <= 0) THEN
    RAISE EXCEPTION 'Paid event price is not configured' USING ERRCODE = 'P0001';
  END IF;
  IF NOT p_privacy_accepted THEN
    RAISE EXCEPTION 'Privacy notice must be accepted' USING ERRCODE = '22023';
  END IF;
  IF coalesce(array_length(p_attendance_dates, 1), 0) = 0 THEN
    RAISE EXCEPTION 'Select at least one attendance day' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1 FROM unnest(p_attendance_dates) AS attendance_date
    WHERE attendance_date < v_event.event_date OR attendance_date > v_end_date
  ) THEN
    RAISE EXCEPTION 'Selected attendance day is outside the event dates' USING ERRCODE = '22023';
  END IF;
  IF p_special_session_attending AND v_event.special_session_label IS NULL THEN
    RAISE EXCEPTION 'This event has no special session' USING ERRCODE = '22023';
  END IF;
  IF p_special_session_attending
    AND v_event.special_session_date IS NOT NULL
    AND NOT (p_attendance_dates @> ARRAY[v_event.special_session_date]) THEN
    RAISE EXCEPTION 'Select the special-session day to attend that session' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.event_registrations r
    WHERE r.event_id = p_event_id
      AND lower(r.email) = lower(trim(p_email))
      AND r.registration_status = 'registered'
  ) THEN
    RAISE EXCEPTION 'This email is already registered for this event' USING ERRCODE = '23505';
  END IF;

  v_party_size := 1 + greatest(coalesce(p_children_count, 0), 0);
  IF v_event.registration_capacity IS NOT NULL THEN
    IF (
      SELECT coalesce(sum(r.attendee_count), 0)
      FROM public.event_registrations r
      WHERE r.event_id = p_event_id AND r.registration_status = 'registered'
    ) + v_party_size > v_event.registration_capacity THEN
      RAISE EXCEPTION 'Event is full' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  v_amount_due := CASE WHEN v_event.price_type = 'paid' THEN v_event.price ELSE 0 END;
  v_payment_status := CASE WHEN v_event.price_type = 'paid' THEN 'pending' ELSE 'free' END;

  INSERT INTO public.event_registrations (
    event_id, full_name, email, phone, location,
    accommodation_needed, accommodation_notes, children_count, attendee_count,
    attendance_dates, special_session_attending, special_request,
    referral_source, privacy_accepted, payment_status, amount_due, currency
  ) VALUES (
    p_event_id, trim(p_full_name), lower(trim(p_email)), trim(p_phone), trim(p_location),
    coalesce(p_accommodation_needed, false), nullif(trim(coalesce(p_accommodation_notes, '')), ''),
    coalesce(p_children_count, 0), v_party_size,
    p_attendance_dates, coalesce(p_special_session_attending, false),
    nullif(trim(coalesce(p_special_request, '')), ''), trim(p_referral_source), true,
    v_payment_status, v_amount_due, coalesce(v_event.currency, 'NGN')
  ) RETURNING id INTO v_registration_id;

  IF nullif(trim(coalesce(p_prayer_request, '')), '') IS NOT NULL THEN
    INSERT INTO public.event_prayer_requests (registration_id, event_id, request)
    VALUES (v_registration_id, p_event_id, trim(p_prayer_request));
  END IF;

  RETURN QUERY SELECT v_registration_id, v_payment_status, v_amount_due, coalesce(v_event.currency, 'NGN'), v_event.title, v_event.payment_instructions;
END;
$$;

REVOKE ALL ON FUNCTION public.register_for_church_event(uuid, text, text, text, text, boolean, text, smallint, date[], boolean, text, text, text, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_for_church_event(uuid, text, text, text, text, boolean, text, smallint, date[], boolean, text, text, text, boolean) TO service_role;