import { defineConfig, devices } from '@playwright/test'

/**
 * Smoke e2e for Social Sips. Ported from /workspace/ss-e2e (puppeteer scripts).
 * Start the app first: `npm run dev` (or point BASE_URL at a deployed preview).
 * Browsers: `npx playwright install chromium`
 */
export default defineConfig({
  testDir: './e2e/specs',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    ...devices['Desktop Chrome'],
  },
})
