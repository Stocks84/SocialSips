import { test, expect, type Page } from '@playwright/test'
import { waitForTurnstileToken, clearTurnstileToken } from '../helpers/turnstile'

/**
 * Turnstile on sign-in / sign-up. Build the app with Cloudflare's always-pass test key:
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npm run build && npm start
 * No test here reaches Supabase Auth: the "no token" checks fail before any auth call.
 */
async function open(page: Page, path: '/sign-in' | '/sign-up') {
  await page.goto(path)
  if (page.url().includes('/age-gate')) {
    await page.locator('#dob').fill('1990-01-01')
    await Promise.all([page.waitForURL(new RegExp(path)).catch(() => {}), page.locator('form button').first().click()])
  }
  await expect(page).toHaveURL(new RegExp(path))
}

test.describe('captcha', () => {
  test.use({ storageState: { cookies: [], origins: [] } })
  // Two token waits can each take up to 30s if Cloudflare is slow.
  test.describe.configure({ timeout: 90_000 })

  test('sign-in renders Turnstile without CSP errors and needs a token', async ({ page }) => {
    const cspErrors: string[] = []
    page.on('console', (m) => { if (/Content Security Policy/i.test(m.text())) cspErrors.push(m.text()) })
    await open(page, '/sign-in')
    await waitForTurnstileToken(page)
    expect(cspErrors).toEqual([])

    await page.locator('#email').fill('zz_e2e_captcha@example.invalid')
    await page.locator('#password').fill('not-a-real-password')
    await clearTurnstileToken(page)
    await page.locator('form button[type=submit], form button').last().click()
    await expect(page.locator('form [role=alert]')).toContainText(/security check/i)
    await expect(page.locator('#email')).toHaveValue('zz_e2e_captcha@example.invalid')
    // Widget reset after the failed submit gives a fresh token
    await waitForTurnstileToken(page)
  })

  test('sign-up needs a token and keeps typed values', async ({ page }) => {
    await open(page, '/sign-up')
    await waitForTurnstileToken(page)
    await page.locator('#username').fill('zz_e2e_captcha')
    await page.locator('#email').fill('zz_e2e_captcha@example.invalid')
    await page.locator('#password').fill('correct-horse-battery-staple-e2e')
    await page.locator('#dateOfBirth').fill('1990-01-01')
    await page.locator('input[name=ageConfirmed]').check()
    await page.getByTestId('terms-checkbox').check()
    await clearTurnstileToken(page)
    await page.getByRole('button', { name: /create account/i }).click()
    await expect(page.locator('form [role=alert]')).toContainText(/security check/i)
    await expect(page.locator('#username')).toHaveValue('zz_e2e_captcha')
    await waitForTurnstileToken(page)
  })
})
