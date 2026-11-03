ALTER TABLE public.event_registrations
  DROP CONSTRAINT IF EXISTS event_registrations_event_id_fkey;

ALTER TABLE public.event_registrations
  ADD CONSTRAINT event_registrations_event_id_fkey
  FOREIGN KEY (event_id) REFERENCES public.church_events(id) ON DELETE CASCADE;
