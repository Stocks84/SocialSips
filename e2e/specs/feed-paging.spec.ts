import { test, expect } from '@playwright/test'

const CURSOR = /before=\d{4}-\d{2}-\d{2}T[^&]+_[0-9a-f-]{36}/i

async function passAgeGate(page: import('@playwright/test').Page) {
  await page.goto('/feed')
  if (page.url().includes('/age-gate')) {
    await page.locator('#dob').fill('1990-01-01')
    await Promise.all([
      page.waitForURL(/\/feed/).catch(() => {}),
      page.locator('form button[type=submit], form button').first().click(),
    ])
  }
}

test.describe('feed paging', () => {
  test('first page stays at 20 items and Load more uses a keyset cursor', async ({ page }) => {
    await passAgeGate(page)
    await page.goto('/feed')
    const items = page.locator('[data-testid=feed-items] > *')
    const count = await items.count()
    expect(count).toBeLessThanOrEqual(20)
    const next = page.locator('[data-testid=pager-next]')
    if (count === 20) {
      await expect(next).toBeVisible()
      await expect(next).toHaveText(/Load more/)
      const href = await next.getAttribute('href')
      expect(href).toMatch(CURSOR)
      // Do not click through: the second page needs migration 0032 on the live database.
    } else {
      await expect(next).toHaveCount(0)
    }
  })
})
