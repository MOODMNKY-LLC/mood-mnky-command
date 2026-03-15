import { defineConfig, devices } from '@playwright/test'

/**
 * E2E tests for flow-mnky chat. Run with: pnpm exec playwright test
 * Requires app running: pnpm dev:flow-mnky (port 3015)
 * For chat response test: set E2E_TEST_EMAIL and E2E_TEST_PASSWORD in .env.local (or env) for login.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3015',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  timeout: 90_000,
  expect: { timeout: 10_000 },
})
