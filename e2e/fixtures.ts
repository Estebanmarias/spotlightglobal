import { test as base, expect, type Page } from '@playwright/test'

// Anything that would save data or send an email is blocked
// unless a test swaps in a fake reply
const WRITE_ENDPOINTS = [
  '**/api/register',
  '**/api/classes/register',
  '**/api/conference/register',
  '**/api/contact',
  '**/api/prayer',
  '**/api/giving/confirm',
]

export const test = base.extend({
  page: async ({ page }, provide) => {
    // Skips the first-visit splash screen
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem('splash-seen', '1')
      } catch {
        /* storage unavailable */
      }
    })

    // Same result every run, and no YouTube quota used
    await page.route('**/api/youtube', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ type: 'none' }) }),
    )

    for (const pattern of WRITE_ENDPOINTS) {
      await page.route(pattern, (route) => (route.request().method() === 'POST' ? route.abort() : route.continue()))
    }

    await provide(page)
  },
})

export { expect }

export const fakeJson = (status: number, body: unknown) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify(body),
})

// Rejects analytics so test visits don't count as real ones
export async function settleCookieBanner(page: Page) {
  const button = page.getByRole('button', { name: /reject|decline|necessary|essential/i }).first()
  try {
    await button.waitFor({ state: 'visible', timeout: 2000 })
    await button.click()
  } catch {
    /* no banner */
  }
}

// Scrolls through the page so on-scroll animations have finished
export async function revealEverything(page: Page) {
  await page.evaluate(async () => {
    const step = Math.max(300, Math.floor(window.innerHeight * 0.8))
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y)
      await new Promise((resolve) => setTimeout(resolve, 150))
    }
    window.scrollTo(0, 0)
  })
  await page.waitForTimeout(900)
}