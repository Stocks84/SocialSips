import { test, expect, type Page } from '@playwright/test'

/**
 * Opening a notification marks it read, so it must be a same-origin POST; GET never changes data.
 * Guest-only (no accounts needed): passes the age gate, then probes /notifications/<id>.
 */
const ID = '00000000-0000-4000-8000-000000000000'

async function passAgeGate(page: Page) {
  await page.goto('/cocktails')
  await page.locator('#dob').fill('1990-01-01')
  await Promise.all([page.waitForURL(/\/cocktails/).catch(() => {}), page.locator('form button').click()])
  await expect(page).toHaveURL(/\/cocktails/)
}

test.describe('notification open is POST-only', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('GET does not run the mark-read handler; cross-site POST is refused', async ({ page, baseURL }) => {
    await passAgeGate(page)
    const origin = new URL(baseURL!).origin

    const get = await page.request.get(`/notifications/${ID}`, { maxRedirects: 0 })
    expect(get.status()).toBe(303)
    expect(new URL(get.headers()['location'], origin).pathname).toBe('/notifications')

    const evil = await page.request.post(`/notifications/${ID}`, { headers: { origin: 'https://evil.example' }, maxRedirects: 0 })
    expect(evil.status()).toBe(403)

    const noOrigin = await page.request.post(`/notifications/${ID}`, { headers: { 'sec-fetch-site': 'cross-site' }, maxRedirects: 0 })
    expect(noOrigin.status()).toBe(403)

    // Same-origin POST reaches the handler; a guest is sent to sign in.
    const same = await page.request.post(`/notifications/${ID}`, { headers: { origin }, maxRedirects: 0 })
    expect(same.status()).toBe(303)
    expect(same.headers()['location']).toContain('/sign-in')
  })
})
