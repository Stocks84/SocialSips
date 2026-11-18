import { expect, type Page } from '@playwright/test'

/** Hidden field Turnstile writes the token into. */
export const TURNSTILE_TOKEN = 'input[name="cf-turnstile-response"]'

/**
 * Wait until the hidden Turnstile field is attached and has a token.
 *
 * Do not poll `inputValue()` and swallow errors as `''`: that hides strict-mode
 * and detached-node failures, and can burn the whole timeout while the field is
 * missing or mid-reset. `not.toHaveValue('')` waits on the real condition.
 *
 * 30s covers a slow load of Cloudflare's script plus the test-key challenge;
 * this is a condition timeout, not a sleep.
 */
export async function waitForTurnstileToken(page: Page, timeout = 30_000) {
  await expect(page.locator(TURNSTILE_TOKEN)).not.toHaveValue('', { timeout })
}

/**
 * Empty the token without tearing down the widget.
 *
 * Removing the input (the old helper) still blocks `resetPasswordForEmail`, but
 * then `turnstile.reset()` has to recreate the node before it can issue a fresh
 * token. Clearing the value is enough for the server's `if (!token)` check and
 * leaves the widget intact for the post-submit reset.
 */
export async function clearTurnstileToken(page: Page) {
  const field = page.locator(TURNSTILE_TOKEN)
  await expect(field).toBeAttached()
  await field.evaluate((el) => {
    ;(el as HTMLInputElement).value = ''
  })
}
