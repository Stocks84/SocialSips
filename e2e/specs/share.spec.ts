import { test, expect } from '@playwright/test'

async function passAgeGate(page: import('@playwright/test').Page) {
  await page.goto('/games', { waitUntil: 'load' })
  if (page.url().includes('/age-gate')) {
    await page.locator('#dob').fill('1990-01-01')
    await Promise.all([
      page.waitForURL(/\/games/).catch(() => {}),
      page.locator('form button[type=submit], form button').first().click(),
    ])
    await page.waitForLoadState('load')
  }
}

test.describe('share button', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('copy fallback shows Link copied on a Game page', async ({ page }) => {
    // Force the copy path so this test does not depend on Web Share support.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: async (text: string) => { (window as unknown as { __copied?: string }).__copied = text } },
      })
    })
    await passAgeGate(page)
    const card = page.getByTestId('game-card').first()
    await expect(card, 'need a public game to open').toBeVisible({ timeout: 15_000 })
    const href = await card.getAttribute('href')
    expect(href).toBeTruthy()
    await page.goto(href!, { waitUntil: 'load' })
    const share = page.getByTestId('share-button')
    await expect(share).toBeVisible()
    await share.click()
    await expect(page.getByTestId('share-copied')).toHaveText('Link copied')
  })
})
