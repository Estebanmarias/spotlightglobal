import { test, expect, settleCookieBanner } from './fixtures'

test.skip(({ isMobile }) => isMobile, 'Each size is set below, so the desktop project covers it')

const SIZES = [
  { width: 360, height: 740 },
  { width: 390, height: 844 },
  { width: 700, height: 880 }, // unfolded foldable
  { width: 820, height: 1180 },
  { width: 1280, height: 800 },
]
const ROUTES = ['/', '/classes', '/giving', '/events', '/community', '/privacy-policy', '/terms-and-service']

for (const size of SIZES) {
  for (const path of ROUTES) {
    test(`${path} has no sideways scrolling at ${size.width}px`, async ({ page }) => {
      await page.setViewportSize(size)
      await page.goto(path)
      await settleCookieBanner(page)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow, `page is ${overflow}px wider than the screen`).toBeLessThanOrEqual(1)
    })
  }
}