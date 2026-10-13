INSERT INTO public.church_events (
  title,
  description,
  event_date,
  event_end_date,
  event_time,
  flyer_url,
  location,
  is_featured,
  registration_enabled,
  registration_capacity,
  registration_deadline,
  price_type,
  price,
  currency,
  payment_instructions,
  special_session_label,
  special_session_date
)
SELECT
  'Soaring (Height & Sight) - SHIFT Conference 2026',
  'C6 - November 6-8, 2026 - 9 AM & 4 PM sessions',
  DATE '2026-11-06',
  DATE '2026-11-08',
  '9 AM & 4 PM',
  '/images/shift-conference-2026.jpg',
  'Icon Hotel Hall, opposite Mai Angwan House by Transformer, Angwan Danlami, New Nyanya, Abuja–Keffi Road',
  true,
  false,
  NULL,
  DATE '2026-11-05',
  'free',
  NULL,
  'NGN',
  NULL,
  'Friday morning Leaders / Business session',
  DATE '2026-11-06'
WHERE NOT EXISTS (
  SELECT 1
  FROM public.church_events
  WHERE lower(title) LIKE '%shift%'
     OR lower(title) LIKE '%soaring%'
);