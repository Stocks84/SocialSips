import { test, expect } from '@playwright/test'

/** Port of the age-gate + nav slice of ss-e2e/play.js (dice RNG bits left in ss-e2e). */
async function passAgeGate(page: import('@playwright/test').Page) {
  await page.goto('/play')
  if (page.url().includes('/age-gate')) {
    await page.locator('#dob').fill('01011990')
    await Promise.all([
      page.waitForURL(/\/play/).catch(() => {}),
      page.locator('form button[type=submit], form button').first().click(),
    ])
  }
}

test.describe('play', () => {
  test('age gate then play routes open', async ({ page }) => {
    for (const path of ['/play', '/play/dice', '/play/kings-cup']) {
      await page.goto(path)
      expect(page.url()).toContain('/age-gate?redirectTo=' + encodeURIComponent(path))
    }
    await passAgeGate(page)
    await expect(page).toHaveURL(/\/play$/)
    for (const path of ['/play', '/play/dice', '/play/kings-cup']) {
      const res = await page.goto(path)
      expect(res?.status()).toBe(200)
      expect(new URL(page.url()).pathname).toBe(path)
    }
  })

  test('feed tab bar includes Play', async ({ page }) => {
    await passAgeGate(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/feed')
    const nav = page.locator('nav[aria-label="Tab bar"]')
    await expect(nav.locator('a[href="/play"]')).toBeVisible()
    await expect(nav).toContainText('Play')
  })

  test('dice page rolls default two dice', async ({ page }) => {
    await passAgeGate(page)
    await page.goto('/play/dice')
    await page.locator('[data-testid=roll]').click()
    await expect(page.locator('[data-testid=roll]')).toBeEnabled({ timeout: 10_000 })
    const v = await page.locator('[data-testid=dice]').getAttribute('data-values')
    expect(v).toMatch(/^[1-6],[1-6]$/)
  })
})
