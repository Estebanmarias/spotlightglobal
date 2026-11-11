import { test, expect, settleCookieBanner } from './fixtures'
import type { Page } from '@playwright/test'

test.skip(({ isMobile }) => isMobile, 'On phones the chat button stays hidden until cookies are chosen')

const chat = (page: Page) => page.getByRole('dialog', { name: /chat with/i })

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await settleCookieBanner(page)
  await page.getByRole('button', { name: 'Open chat' }).click()
  await expect(chat(page)).toBeVisible()
})

test('a topic button gives the service times', async ({ page }) => {
  await chat(page).getByRole('button', { name: 'Service times' }).click()
  await expect(chat(page).getByText(/every Sunday, 8:30 AM/)).toBeVisible({ timeout: 10_000 })
})

test('a typed question gets an answer', async ({ page }) => {
  await chat(page).getByLabel('Type your question').fill('what time is service')
  await chat(page).getByRole('button', { name: 'Send' }).click()
  await expect(chat(page).getByText(/8:30 AM/)).toBeVisible({ timeout: 10_000 })
})

test('worrying words get the caring message and counselor buttons', async ({ page }) => {
  await chat(page).getByLabel('Type your question').fill('i want to kill myself')
  await chat(page).getByRole('button', { name: 'Send' }).click()
  await expect(chat(page).getByText(/call 112/i)).toBeVisible({ timeout: 10_000 })
  await expect(chat(page).getByRole('link', { name: /Setman/ })).toBeVisible()
})

test('Escape closes the chat', async ({ page }) => {
  await page.keyboard.press('Escape')
  await expect(chat(page)).toBeHidden()
})