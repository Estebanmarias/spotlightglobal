# Database backups

The Vercel cron at `/api/cron/database-backup` runs daily at 02:00 UTC. It
copies the application tables to the private Supabase Storage bucket
`database-backups` and retains the newest 30 backup files.

## Required configuration

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`
- `BACKUP_PIN_HASH`
- `BACKUP_ACCESS_SECRET`

The service-role key must only exist in server-side Vercel environment
variables. The bucket is private and is never exposed through the browser.

## Backup page protection

The Admin → Backups page requires the super-admin role and a separate 8-digit
PIN. Set `BACKUP_PIN_HASH` to a scrypt hash in the format `salt:hash` and
`BACKUP_ACCESS_SECRET` to a long random secret. Never put the plain PIN in
source control or browser code. A successful unlock creates an HTTP-only,
same-site cookie that expires after 15 minutes. Failed unlocks are rate-limited
through Upstash in production.

## Restore procedure

1. In Supabase Storage, open the private `database-backups` bucket and download
   the required JSON file.
2. Review the file and restore into a separate Supabase project first.
3. Use the `tables` object and the Supabase SQL editor or a reviewed migration
   script to restore rows in dependency order.
4. Verify authentication, member access, event registration, giving, and class
   enrollment flows before restoring production data.

This backup is an application-data safety net, not a replacement for
Supabase's native database backups or point-in-time recovery. Test a restore
quarterly in a separate project.

## Audit log

Setman can review recent privileged changes in **Admin → Audit log**. Audit
entries are stored in the `audit_logs` table and are included in the daily
application snapshot. The audit log is intentionally server-only; ordinary
authenticated clients cannot read or write it directly.

Apply `supabase/migrations/202611010002_audit_logs.sql` in the Supabase SQL
editor (or through the project migration workflow) before opening the page.
Until that migration is applied, the page reports that the table is not
installed and audit events cannot be stored.

## Recommended roadmap

1. Backups and restore testing
2. Audit logging
3. Destructive-action safeguards
4. Automated tests and improved loading/error states
5. Accessibility fixes
6. Rate limiting on contact and conference routes
7. Admin two-factor authentication
8. Sentry error monitoring
