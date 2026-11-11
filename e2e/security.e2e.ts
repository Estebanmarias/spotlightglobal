import { test, expect } from './fixtures'

const ADMIN_API = [
  '/api/admin/attention',
  '/api/admin/prayer',
  '/api/admin/giving-confirmations',
  '/api/admin/audit-log',
  '/api/admin/backups',
]
const CRONS = ['/api/cron/event-reminders', '/api/cron/weekly-summary', '/api/cron/database-backup']

for (const path of ADMIN_API) {
  test(`${path} refuses requests without a login`, async ({ request }) => {
    const response = await request.get(path)
    expect([401, 403]).toContain(response.status())
  })
}

for (const path of CRONS) {
  test(`${path} refuses requests without the cron secret`, async ({ request }) => {
    const response = await request.get(path)
    expect(response.status()).toBe(401)
  })
}

test('the health check answers', async ({ request }) => {
  const response = await request.get('/api/health')
  expect(response.status()).toBe(200)
  expect(await response.json()).toMatchObject({ ok: true })
})

test('signed-out visitors are sent to the admin login', async ({ page }) => {
  await page.goto('/admin/dashboard')
  await expect(page).toHaveURL(/\/admin\/?(\?.*)?$/)
})

test('an unknown certificate number says so', async ({ page }) => {
  await page.goto('/verify/SC-AAAAAAAAAA')
  await expect(page.getByText(/couldn.t find this certificate/i)).toBeVisible()
})

test('the certificate download refuses a bad code', async ({ request }) => {
  const response = await request.get('/api/certificates/not-a-code')
  expect(response.status()).toBe(404)
})