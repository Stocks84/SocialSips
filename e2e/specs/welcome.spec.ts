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

test.describe('welcome prompt', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('signed-out visitors never see the first-visit welcome card', async ({ page }) => {
    await passAgeGate(page, '/feed')
    await expect(page.getByTestId('welcome-prompt')).toHaveCount(0)
    await page.goto('/games')
    await expect(page.getByTestId('welcome-prompt')).toHaveCount(0)
  })
})
