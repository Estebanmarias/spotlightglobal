import { test, expect, fakeJson, settleCookieBanner } from './fixtures'

test('the success page greets the new member and points to Membership Class', async ({ page }) => {
  await page.goto('/success?name=Grace')
  await expect(page.getByRole('heading', { name: 'Welcome to the Family, Grace!' })).toBeVisible()
  await expect(page.getByRole('link', { name: /See Membership Class/ })).toHaveAttribute('href', '/classes')
})

test('a non-member trying to register for a class is told why', async ({ page }) => {
  await page.route('**/api/classes/register', (route) =>
    route.fulfill(fakeJson(422, { code: 'not_member', error: 'Not a member' })),
  )
  await page.goto('/classes')
  await settleCookieBanner(page)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('next step')

  const open = page.getByRole('button', { name: 'Register', exact: true })
  test.skip((await open.count()) === 0, 'No cohort is open for registration right now')

  await open.first().click()
  const dialog = page.getByRole('dialog', { name: /^Register for/ })
  await expect(dialog).toBeVisible()
  await dialog.getByLabel('Full name').fill('Test Visitor')
  await dialog.getByLabel('Email', { exact: true }).fill('nobody@example.com')
  await dialog.getByLabel('Phone number').fill('+2340000000000')
  await dialog.getByLabel(/I agree that/).check()
  await dialog.getByRole('button', { name: 'Complete registration' }).click()

  await expect(dialog.getByText(/not a member yet/i)).toBeVisible()
  await expect(dialog.getByRole('link', { name: 'Join the church' })).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('a prayer request shows the thank-you message', async ({ page }) => {
  await page.route('**/api/prayer', (route) => route.fulfill(fakeJson(200, { success: true })))
  await page.goto('/prayer')
  await page.getByLabel('Your prayer request').fill('Please pray for my family this week.')
  await page.getByRole('button', { name: 'Send my request' }).click()
  await expect(page.getByRole('heading', { name: 'We have received your request' })).toBeVisible()
  await expect(page.getByText(/carry this alone/)).toHaveCount(0)
})

test('a worrying prayer request also shows the care message', async ({ page }) => {
  await page.route('**/api/prayer', (route) => route.fulfill(fakeJson(200, { success: true })))
  await page.goto('/prayer')
  await page.getByLabel('Your prayer request').fill('I feel suicidal and need help.')
  await page.getByRole('button', { name: 'Send my request' }).click()
  await expect(page.getByText(/carry this alone/)).toBeVisible()
})