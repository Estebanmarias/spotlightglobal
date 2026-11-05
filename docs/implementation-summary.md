# Implementation Summary

This document records the major administrative, backup, audit, classes, event,
chatbot, and validation work added to theSpotlightChurch. It describes the
application behavior without including secrets or secret values.

## Audit log

### Database

`supabase/migrations/202611010002_audit_logs.sql` adds the `audit_logs` table
with:

- The acting user ID, name, and email.
- An action name.
- The affected entity type and optional entity ID.
- JSON metadata for useful context.
- A creation timestamp.
- Indexes for recent entries and entity lookups.
- Row-level security enabled.
- Direct access revoked from `anon` and `authenticated`.

The table is intentionally server-only. Trusted server routes write entries
through `lib/audit-log.ts`, and the service-role client reads them.

### API and dashboard

- `app/api/admin/audit-log/route.ts` authorizes super-admin access and supports
  reading recent entries and writing new entries.
- `app/admin/(portal)/audit-log/page.tsx` displays the log to Setman/super
  admin users.
- The page includes search by actor, action, or record and an action filter.

The existing permission model is preserved: ordinary admins do not gain access
to the audit log merely because the page exists.

## Database backups

### Backup generation

`app/api/cron/database-backup/route.ts` is a protected Vercel Cron route. It:

1. Requires the `CRON_SECRET` authorization header.
2. Checks for the private `database-backups` Supabase Storage bucket.
3. Creates that bucket as private if it does not exist.
4. Reads the configured application tables through the Supabase service-role
   client.
5. Writes a timestamped JSON snapshot.
6. Uploads the snapshot to private Storage.
7. Retains the newest 30 backup files and removes older files.
8. Reports the exact table that failed if a required migration/table is absent.

The backup includes application data such as members, events, registrations,
classes, attendance, giving records, email logs, and audit logs. It does not
include Supabase Auth users or service credentials.

### Admin access

- `app/api/admin/backups/route.ts` authorizes Setman/super-admin access.
- `lib/backup-access.ts` verifies the separate 8-digit PIN using a scrypt
  hash and issues a short-lived, HTTP-only access cookie.
- `app/admin/(portal)/backups/page.tsx` provides the PIN screen, backup listing,
  signed downloads, and an overdue-backup warning.
- `docs/database-backups.md` documents setup, retention, access, and restore
  expectations.

### Schedule and environment configuration

`vercel.json` schedules the route at:

```text
0 2 * * *
```

That is 02:00 UTC / 03:00 Nigerian time. The bucket is created by the route
when the Cron request runs successfully; it does not require a separate SQL
statement.

Required server-side variables are:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`
- `BACKUP_PIN_HASH`
- `BACKUP_ACCESS_SECRET`

Backup rate-limit protection also uses the configured Upstash variables. Secret
values must remain in Vercel/server configuration and must never be committed
or placed in a URL.

## Classes and cohorts

The classes feature uses the existing class/cohort database model while
presenting clearer “cohort” language to administrators and visitors.

### Public classes

- `app/classes/page.tsx` loads public class programs and active cohorts.
- `app/classes/ClassesClient.tsx` renders class cards, dates, prices,
  registration states, and enrollment actions.
- `components/ClassesSection.tsx` provides the reusable homepage classes
  section.
- `app/api/classes/register/route.ts` validates and creates class enrollment
  requests.
- `lib/classes.ts` centralizes class data queries, registration messaging, and
  notification/email behavior.

### Admin classes

- `app/admin/(portal)/classes/page.tsx` manages programs, cohorts, sessions,
  enrollment, attendance, and class-related actions.
- `app/api/admin/classes/route.ts` performs authorized cohort operations and
  records relevant audit activity.
- `lib/class-certificates.ts` generates class certificate data.
- `lib/class-verses.ts` supplies certificate/celebration scripture content.

Deletion is scoped to cohorts rather than deleting the parent class program.
Destructive actions use confirmation UI and preserve the existing admin
permission rules.

## Events and registrations

### Event registration schema

`supabase/migrations/202609300001_event_registrations.sql` adds event
registration fields and related tables for:

- Registration records and payment state.
- Capacity and registration deadlines.
- Accommodation requests.
- Attendance dates.
- Special-session interest.
- Referral sources.
- Prayer requests.
- Confirmation/reminder email logs.

### Event deletion

`supabase/migrations/202611030001_allow_event_deletion.sql` changes the event
registration foreign key to `ON DELETE CASCADE`. This allows an authorized
admin to remove a test or incorrect event even when it has attendee records.
Related registrations, prayer requests, and event email logs are removed with
the event.

The admin UI requires typing the exact event title before deletion. This is
intentionally destructive and should not be used for events whose attendance
history must be retained.

### Generic event pages

- `app/conference/ConferencePreview.tsx` now loads the selected event instead
  of assuming every event is SHIFT Conference.
- SHIFT/conference-only fields are shown only when the event has a special
  session or is identified as a SHIFT-style event.
- Generic events use generic notes and registration wording.
- Registration states are distinguished as open, not started, closed, or
  unavailable.
- `app/conference/page.tsx` generates event-specific browser and social
  metadata from the selected event.
- `lib/church-events.ts` provides recurrence, activity, and registration-state
  helpers.
- `components/MediaManagement.tsx` provides event creation, editing, search,
  status filtering, registration management, insights, exports, close
  registration, and typed deletion confirmation.

## Date-of-birth and safeguarding validation

`lib/age-validation.ts` is shared by public and admin member flows. It:

- Requires a minimum age of 15.
- Rejects future dates and unrealistic ages above 120.
- Provides minimum and maximum HTML date-input boundaries.
- Returns a clear safeguarding message for anyone under 15.

The validation is used by:

- `components/ConnectForm.tsx` (homepage form).
- `app/join/JoinClient.tsx` (public Join page).
- `app/admin/(portal)/add-member/page.tsx`.
- `app/admin/(portal)/members/page.tsx`.
- `app/api/register/route.ts`.
- `app/api/admin/members/route.ts`.

Server validation remains in place even if a browser bypasses the HTML limits.

## Chatbot and public search

The chatbot work added:

- `lib/chat-search.ts` for local intent matching, Nigerian phrasing,
  typo-tolerant matching, crisis handling, clarification, and fallback text.
- `lib/chat-search.test.ts` for matcher regression tests.
- `app/api/chat/search/route.ts` for controlled public searches of events,
  classes/cohorts, sermons/videos, and public giving details.
- `components/FaqChat.tsx` for typed questions, conversation memory,
  deduplicated action links, source labels, loading state, helpfulness feedback,
  and focus return.
- `lib/giving-accounts.ts` for shared public giving account data.

The search route deliberately excludes admin/member/private data.

## Other feature files added during this work

The following files were created for the broader improvements documented above:

- `lib/admin-nav.ts`
- `lib/use-admin-nav.ts`
- `components/AdminNav.tsx`
- `components/DestructiveConfirm.tsx`
- `lib/audit-log.ts`
- `lib/backup-access.ts`
- `lib/public-rate-limit.ts`
- `lib/site-config.ts`
- `lib/csv.ts`
- `lib/event-display.ts`
- `lib/analytics-metrics.ts`
- `lib/giving-accounts.ts`
- `lib/chat-search.ts`
- `lib/chat-search.test.ts`
- `lib/age-validation.ts`
- `lib/age-validation.test.ts`
- `app/api/chat/search/route.ts`
- `app/api/admin/audit-log/route.ts`
- `app/api/admin/backups/route.ts`
- `app/api/cron/database-backup/route.ts`
- `app/admin/(portal)/audit-log/page.tsx`
- `app/admin/(portal)/backups/page.tsx`
- `supabase/migrations/202609300001_event_registrations.sql`
- `supabase/migrations/202611010002_audit_logs.sql`
- `supabase/migrations/202611030001_allow_event_deletion.sql`
- `docs/database-backups.md`
- `tests/analytics-metrics.test.ts`
- `tests/church-events.test.ts`
- `vitest.config.ts`

Some of these files may have existed before the most recent batch and were
subsequently extended. The list identifies the feature files introduced during
the project work, not every original file in the repository.

## Verification

The implemented changes were validated with:

```text
npx.cmd tsc --noEmit
npm.cmd test
npm.cmd run build
git diff --check
```

The current test suite contains 34 passing tests. The production build reports
only the existing Browserslist data freshness warning.
