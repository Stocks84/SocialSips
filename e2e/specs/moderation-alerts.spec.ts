import { test, expect } from '@playwright/test'

async function passAgeGate(page: import('@playwright/test').Page, dest = '/feed') {
  await page.goto(dest)
  if (page.url().includes('/age-gate')) {
    await page.locator('#dob').fill('1990-01-01')
    await Promise.all([
      page.waitForURL(new RegExp(dest.replace('/', '\\/'))).catch(() => {}),
      page.locator('form button[type=submit], form button').first().click(),
    ])
  }
}

test.describe('moderation alerts', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('signed-out visitors do not see the admin reports badge', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await passAgeGate(page, '/feed')
    await expect(page.getByTestId('nav-admin')).toHaveCount(0)
    await expect(page.getByTestId('admin-report-count')).toHaveCount(0)
    await expect(page.getByTestId('admin-tab-report-count')).toHaveCount(0)
  })
})
