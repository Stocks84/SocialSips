import { test, expect } from '@playwright/test'

/**
 * Port of ss-e2e/agegate.js — cookie + redirect behaviour, no DB seed needed.
 */
test.describe('age gate', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('deep links redirect to age gate with redirectTo', async ({ page }) => {
    for (const path of ['/feed', '/cocktails', '/games?x=1']) {
      await page.goto(path)
      await expect(page).toHaveURL(new RegExp(`/age-gate\\?redirectTo=${encodeURIComponent(path).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`))
    }
  })

  test('adult DOB unlocks destination and sets httpOnly cookie', async ({ page, context }) => {
    await page.goto('/cocktails')
    await page.locator('#dob').fill('01011990')
    await Promise.all([
      page.waitForURL(/\/cocktails/).catch(() => {}),
      page.locator('form button').click(),
    ])
    await expect(page).toHaveURL(/\/cocktails/)
    const cookies = await context.cookies()
    const c = cookies.find((x) => x.name === 'ss-age-verified')
    expect(c?.httpOnly).toBe(true)
    expect(c?.expires ?? 0).toBeGreaterThan(0)
    const jsCookies = await page.evaluate(() => document.cookie)
    expect(jsCookies).not.toContain('ss-age-verified')
    await page.goto('/feed')
    await expect(page).toHaveURL(/\/feed/)
  })

  test('static assets skip the gate', async ({ page }) => {
    for (const a of ['/icons/icon-192.png', '/manifest.json', '/favicon.ico']) {
      const res = await page.goto(a)
      expect(res?.status() ?? 0).toBeLessThan(500)
      expect(page.url()).not.toContain('age-gate')
    }
  })

  test('under-18 lands on sorry and cannot retry', async ({ page }) => {
    await page.goto('/feed')
    await page.locator('#dob').fill('05052015')
    await Promise.all([
      page.waitForURL(/sorry|age-gate/).catch(() => {}),
      page.locator('form button').click(),
    ])
    await expect(page.locator('h1')).toContainText(/Sorry/i)
    await page.goto('/age-gate')
    await expect(page).toHaveURL(/\/age-gate\/sorry/)
  })
})
