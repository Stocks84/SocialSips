import { test, expect } from '@playwright/test'

const USER_LABELS = ['Feed', 'Games', 'Drinks', 'Add', 'Memes', 'Play', 'Dares']
const WIDTHS = [360, 375, 390] as const

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

/** True when the CSS ellipsis is in use or the glyphs overflow the box. */
async function overflowPx(locator: import('@playwright/test').Locator) {
  return locator.evaluate((el) => Math.ceil(el.scrollWidth - el.clientWidth))
}

/** The Add label must share a vertical position with the other tab labels (within 1px). */
async function assertAddLabelAligns(nav: import('@playwright/test').Locator) {
  const add = nav.getByTestId('nav-add').getByTestId('tab-label')
  const addBox = await add.boundingBox()
  expect(addBox, 'Add tab label should be visible').toBeTruthy()
  const offsets: { label: string; top: number }[] = []
  for (const label of await nav.getByTestId('tab-label').all()) {
    const box = await label.boundingBox()
    expect(box).toBeTruthy()
    const text = (await label.innerText()).trim()
    const delta = Math.abs(box!.y - addBox!.y)
    offsets.push({ label: text, top: delta })
    expect(delta, `${text} label top vs Add`).toBeLessThanOrEqual(1)
  }
  return offsets
}

test.describe('mobile tab bar labels', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  for (const width of WIDTHS) {
    test(`every non-admin tab label reads in full at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await passAgeGate(page, '/feed')
      await page.goto('/feed')
      const nav = page.locator('nav[aria-label="Tab bar"]')
      await expect(nav).toBeVisible()
      const labels = nav.getByTestId('tab-label')
      await expect(labels).toHaveText(USER_LABELS)
      await expect(nav.getByTestId('nav-admin')).toHaveCount(0)
      for (const label of await labels.all()) {
        expect(await overflowPx(label), await label.innerText()).toBeLessThanOrEqual(1)
      }
      const extra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(extra).toBeLessThanOrEqual(1)
      await assertAddLabelAligns(nav)
    })
  }
})
