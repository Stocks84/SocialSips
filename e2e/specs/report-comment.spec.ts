import { test, expect } from '@playwright/test'

/**
 * Public /report form can be pre-filled with a comment permalink.
 * This spec does not submit: that would write a row to the live reports table.
 */
const GAME = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const COMMENT = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

test.describe('public report of a single comment', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('pre-fills the link from ?url= and keeps the guest checks', async ({ page, baseURL }) => {
    const origin = new URL(baseURL!).origin
    const url = `${origin}/games/${GAME}#comment-${COMMENT}`
    await page.goto(`/report?url=${encodeURIComponent(url)}`)
    await expect(page).toHaveURL(/\/report/)
    await expect(page.getByTestId('public-report-form')).toBeVisible()
    await expect(page.locator('#url')).toHaveValue(url)
    await expect(page.getByText(/paste its link/i)).toBeVisible()
    await expect(page.locator('#reason')).toBeVisible()
    await expect(page.locator('#note')).toBeVisible()
    await expect(page.getByRole('checkbox', { name: /good faith/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /send report/i })).toBeVisible()
  })
})
