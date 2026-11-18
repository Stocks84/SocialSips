import { test, expect, type Page } from '@playwright/test'

/**
 * Forgot-password page. No test here reaches Supabase Auth: the "no token" check
 * fails before resetPasswordForEmail, so no reset email is sent.
 */
const TOKEN = 'input[name="cf-turnstile-response"]'

async function open(page: Page, path: '/sign-in' | '/forgot-password' | '/update-password') {
  await page.goto(path)
  if (page.url().includes('/age-gate')) {
    await page.locator('#dob').fill('1990-01-01')
    await Promise.all([page.waitForURL(new RegExp(path)).catch(() => {}), page.locator('form button').first().click()])
  }
}

async function waitForToken(page: Page) {
  await expect.poll(() => page.locator(TOKEN).inputValue().catch(() => ''), { timeout: 20_000 }).not.toBe('')
}

async function dropToken(page: Page) {
  await page.locator(TOKEN).evaluate((el) => el.remove())
}

test.describe('password reset', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('sign-in has a Forgot password? link', async ({ page }) => {
    await open(page, '/sign-in')
    await expect(page).toHaveURL(/\/sign-in/)
    await page.getByTestId('forgot-password-link').click()
    await expect(page).toHaveURL(/\/forgot-password/)
    await expect(page.getByRole('heading', { name: 'Forgot password?' })).toBeVisible()
  })

  test('forgot-password renders Turnstile, needs a token, and keeps the email', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    const cspErrors: string[] = []
    page.on('console', (m) => { if (/Content Security Policy/i.test(m.text())) cspErrors.push(m.text()) })
    await open(page, '/forgot-password')
    await expect(page).toHaveURL(/\/forgot-password/)
    await waitForToken(page)
    expect(cspErrors).toEqual([])

    await page.locator('#email').fill('zz_e2e_reset@example.invalid')
    await dropToken(page)
    await page.getByTestId('forgot-submit').click()
    await expect(page.locator('form [role=alert]')).toContainText(/security check/i)
    await expect(page.locator('#email')).toHaveValue('zz_e2e_reset@example.invalid')
    await waitForToken(page)
    const extra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(extra).toBeLessThanOrEqual(1)
  })

  test('update-password without a recovery session sends the user to request a new link', async ({ page }) => {
    await open(page, '/update-password')
    await expect(page).toHaveURL(/\/forgot-password\?error=link/)
    await expect(page.locator('form [role=alert]')).toContainText(/invalid or has expired/i)
  })
})
