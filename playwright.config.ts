import { defineConfig, devices } from '@playwright/test'

const LOCAL_PORT = 3100
const liveUrl = process.env.E2E_BASE_URL

export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.e2e\.ts/,
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  workers: 3,
  retries: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: liveUrl ?? `http://localhost:${LOCAL_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
  // With E2E_BASE_URL set, tests run against that address and nothing is built locally
  webServer: liveUrl
    ? undefined
    : {
        command: `npm run build && npx next start -p ${LOCAL_PORT}`,
        url: `http://localhost:${LOCAL_PORT}`,
        reuseExistingServer: true,
        timeout: 600_000,
      },
})