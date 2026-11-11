import { test, expect } from './fixtures'

const PAGES = [
  '/', '/vision', '/community', '/classes', '/events', '/giving', '/join',
  '/partner', '/contact', '/prayer', '/pastor', '/devotionals',
  '/privacy-policy', '/terms-and-service',
]

for (const path of PAGES) {
  test(`${path} loads and shows the site layout`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))

    const response = await page.goto(path)
    expect(response?.status(), 'HTTP status').toBeLessThan(400)
    await expect(page).toHaveTitle(/.+/)
    await expect(page.locator('nav').first()).toBeVisible()
    await expect(page.locator('footer')).toBeAttached()
    expect(errors, 'uncaught errors in the page').toEqual([])
  })
}

test('the home page shows the welcome hero', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Welcome Home' })).toBeVisible()
})

test('the menu reaches the giving page', async ({ page, isMobile }) => {
  await page.goto('/')
  if (isMobile) await page.getByRole('button', { name: 'Open menu' }).click()
  await page.getByRole('link', { name: 'Giving', exact: true }).first().click()
  await expect(page).toHaveURL(/\/giving/)
})