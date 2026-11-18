import { test, expect, type Page, type APIResponse } from '@playwright/test'

/**
 * Opening a notification marks it read, so it must be a same-origin POST; GET never changes data.
 * Guest-only (no accounts needed): passes the age gate, then probes /notifications/<id>.
 */
const ID = '00000000-0000-4000-8000-000000000000'
const AGE_COOKIE = 'ss-age-verified'

async function passAgeGate(page: Page) {
  await page.goto('/cocktails')
  await page.locator('#dob').fill('1990-01-01')
  await Promise.all([page.waitForURL(/\/cocktails/).catch(() => {}), page.locator('form button').click()])
  await expect(page).toHaveURL(/\/cocktails/)
  const age = (await page.context().cookies()).find((c) => c.name === AGE_COOKIE)
  expect(age, 'expected the httpOnly age-gate cookie after passing the gate').toBeTruthy()
}

/**
 * Playwright's APIRequestContext will not send Secure cookies over http://, even though
 * Chromium will on localhost (a secure context). `next start` sets the age cookie with
 * Secure because NODE_ENV is production. Forward the browser cookies so the probe is
 * what an age-verified guest would send. Origin and Sec-Fetch-Site must still be
 * passed in so the CSRF checks stay real.
 */
async function api(
  page: Page,
  method: 'GET' | 'POST',
  path: string,
  headers: Record<string, string> = {},
): Promise<APIResponse> {
  const cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ')
  return page.request.fetch(path, {
    method,
    headers: cookie ? { ...headers, Cookie: cookie } : headers,
    maxRedirects: 0,
  })
}

test.describe('notification open is POST-only', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('GET does not run the mark-read handler; cross-site POST is refused', async ({ page, baseURL }) => {
    await passAgeGate(page)
    const origin = new URL(baseURL!).origin

    const get = await api(page, 'GET', `/notifications/${ID}`)
    expect(get.status()).toBe(303)
    expect(new URL(get.headers()['location'], origin).pathname).toBe('/notifications')

    const evil = await api(page, 'POST', `/notifications/${ID}`, { origin: 'https://evil.example' })
    expect(evil.status()).toBe(403)

    const noOrigin = await api(page, 'POST', `/notifications/${ID}`, { 'sec-fetch-site': 'cross-site' })
    expect(noOrigin.status()).toBe(403)

    // Same-origin POST reaches the handler; a guest is sent to sign in.
    const same = await api(page, 'POST', `/notifications/${ID}`, { origin })
    expect(same.status()).toBe(303)
    expect(same.headers()['location']).toContain('/sign-in')
  })
})
