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

test.describe('nav Add menu (mobile tab bar)', () => {
  test.use({ viewport: { width: 360, height: 800 } })

  test('Add opens a menu to add a game or a drink, Escape closes it', async ({ page }) => {
    await passAgeGate(page)
    await page.goto('/feed')
    const nav = page.locator('nav[aria-label="Tab bar"]')
    const add = nav.getByTestId('nav-add')
    await expect(add).toBeVisible()
    await expect(add).toHaveAttribute('aria-expanded', 'false')
    await add.click()
    await expect(add).toHaveAttribute('aria-expanded', 'true')
    const menu = nav.getByTestId('nav-add-menu')
    await expect(menu).toBeVisible()
    await expect(menu.getByTestId('nav-add-game')).toHaveAttribute('href', '/games/new')
    await expect(menu.getByTestId('nav-add-game')).toHaveText('Add a game')
    await expect(menu.getByTestId('nav-add-drink')).toHaveAttribute('href', '/cocktails/new')
    await expect(menu.getByTestId('nav-add-drink')).toHaveText('Add a drink')
    await expect(menu).not.toContainText(/cocktail/i)
    const extra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(extra).toBeLessThanOrEqual(1)
    await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()
    await expect(add).toHaveAttribute('aria-expanded', 'false')
    await expect(add).toBeFocused()
  })

  test('signed-out, Add a drink goes on to sign-in (age already passed)', async ({ page }) => {
    await passAgeGate(page)
    await page.goto('/feed')
    const nav = page.locator('nav[aria-label="Tab bar"]')
    await nav.getByTestId('nav-add').click()
    await nav.getByTestId('nav-add-drink').click()
    await page.waitForURL(/sign-in|cocktails\/new/)
    const url = new URL(page.url())
    if (url.pathname === '/sign-in') {
      expect(url.searchParams.get('redirectTo')).toBe('/cocktails/new')
    } else {
      expect(url.pathname).toBe('/cocktails/new')
    }
  })
})

test.describe('nav Add menu (desktop)', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('top nav Add opens the same two options', async ({ page }) => {
    await passAgeGate(page)
    await page.goto('/feed')
    const nav = page.locator('nav[aria-label="Main navigation"]')
    const add = nav.getByTestId('nav-add')
    await expect(add).toBeVisible()
    await add.click()
    const menu = nav.getByTestId('nav-add-menu')
    await expect(menu).toBeVisible()
    await expect(menu.getByTestId('nav-add-game')).toHaveText('Add a game')
    await expect(menu.getByTestId('nav-add-drink')).toHaveText('Add a drink')
    await expect(menu).not.toContainText(/cocktail/i)
  })
})
