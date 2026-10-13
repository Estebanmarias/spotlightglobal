# Event Registration Setup

Event content remains owned by the Spotlight Media Ministry in **Admin → Ministry Dashboard → Media → Events & Gallery**. The same `church_events` rows power the public event directory, Community carousel, homepage featured promo, and event detail/registration route.

## Supabase Setup

Apply `supabase/migrations/202609300001_event_registrations.sql` to the project's Supabase database before enabling registration. It adds registration configuration to `church_events`, creates private attendee, prayer-request, and email-log tables, enables RLS, and adds the service-role-only `register_for_church_event` transaction.

Apply `supabase/migrations/202610130001_shift_conference_event.sql` to create the real SHIFT Conference event if no SHIFT/Soaring row exists. It is featured but starts with registration disabled. The migration can be rerun and will not create a duplicate when a matching event already exists.

The public form calls `/api/conference/register`. The browser never inserts into attendee tables directly and never receives the service-role key. The SQL function locks the event while checking registration state, dates, duplicates, and capacity, then derives payment status and amount from the event row. Accompanying children count toward capacity but are not charged in this version.

Each registration has a `TS-` reference derived from its existing registration UUID. The same reference appears in the participant confirmation, Media roster, PDF, and CSV, so staff can match an attendee's reference back to their roster entry without adding another database column.

## Media Ministry Workflow

1. Add or edit an event in Events & Gallery.
2. Set the event's first and last day, location, and flyer.
3. Enable attendee registration, set a deadline, and optionally set a capacity.
4. Choose Free or Paid. For paid events, set the fee/currency and enter verified payment instructions. Those instructions are sent in the attendee's transactional confirmation email.
5. Optionally configure a special-session label and date. Only registrants selecting that event day can opt into the session.
6. Feature the upcoming event if it should appear in the homepage promo. The earliest upcoming featured event is selected.
7. Use the attendee control beside the event to review registrations. Save PDF opens a print-ready event-day check-in sheet; choose Save as PDF in the browser print dialog. CSV downloads a spreadsheet with attendee contact details. After confirming a transfer, mark a pending registration paid; the attendee then receives a receipt email.

The conference detail route `/conference` resolves the real upcoming event whose title contains `SHIFT` or `Soaring`. Other Media-managed events use `/conference?event=<event-id>`. `/events` lists upcoming and archived database events. Public pages do not synthesize demo events; an event without a database row remains unpublished.

## Brevo and Automation

Configure these server-side environment variables in the deployment environment:

- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`
- `EVENTS_NOTIFICATION_EMAIL` (optional destination for new-registration alerts)
- `CRON_SECRET` (required for the event reminder cron)
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (required in production for registration rate limiting)

Brevo sends an attendee confirmation after a successful registration, a payment receipt after a Media manager marks a transfer paid, and an optional internal alert when `EVENTS_NOTIFICATION_EMAIL` is configured. The Vercel Cron in `vercel.json` checks daily for 7-day and 1-day reminders. Reminder sends are logged with a unique registration/type key to prevent duplicates. Reminders go only to registered attendees with free or paid-confirmed status.

Attendees are not automatically added to a marketing list. These messages are transactional; add a separate, explicit marketing opt-in before using registration data for promotional campaigns.

Prayer requests are stored separately from the general attendee roster. The Media Ministry can review attendee logistics; only the approved super admin can view or update prayer requests. The admin payment-confirmation endpoint is likewise restricted to approved Media Ministry managers and the super admin.

## Before Opening Registration

- Apply the migration and verify the new tables/functions exist.
- Configure the environment variables above in production and preview deployments.
- Enter and verify payment instructions in the Media event editor before enabling paid registration.
- Submit one test free registration and one test paid registration; verify the attendee confirmation, optional admin alert, roster visibility, payment confirmation, and reminder log behavior.
- Test that a non-Media admin cannot load attendee records and that a non-super-admin cannot read prayer requests.