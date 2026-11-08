alter table public.church_events
  add column if not exists thank_you_enabled boolean not null default true,
  add column if not exists thank_you_message text
    check (thank_you_message is null or char_length(thank_you_message) <= 2000);

alter table public.event_email_log drop constraint if exists event_email_log_email_type_check;
alter table public.event_email_log
  add constraint event_email_log_email_type_check
  check (email_type in ('confirmation', 'payment_confirmed', 'reminder_7d', 'reminder_1d', 'thank_you'));