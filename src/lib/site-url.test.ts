import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { PRODUCTION_SITE_URL, siteUrl } from './site-url.ts'
import { isSameOrigin } from './same-origin.ts'

describe('siteUrl', () => {
  it('falls back to production when unset or blank', () => {
    assert.equal(siteUrl(undefined, undefined), PRODUCTION_SITE_URL)
    assert.equal(siteUrl('  ', undefined), PRODUCTION_SITE_URL)
  })
  it('uses the configured origin, trimmed to scheme + host', () => {
    assert.equal(siteUrl('https://socialsips.example/some/path?x=1', undefined), 'https://socialsips.example')
    assert.equal(siteUrl('http://localhost:3000/', undefined), 'http://localhost:3000')
  })
  it('rejects junk and plain-http non-local hosts', () => {
    assert.equal(siteUrl('not a url', undefined), PRODUCTION_SITE_URL)
    assert.equal(siteUrl('http://evil.example', undefined), PRODUCTION_SITE_URL)
    assert.equal(siteUrl('javascript:alert(1)', undefined), PRODUCTION_SITE_URL)
  })
  it('falls back to VERCEL_PROJECT_PRODUCTION_URL when config is unset or invalid', () => {
    assert.equal(siteUrl(undefined, 'social-sips-livid.vercel.app'), 'https://social-sips-livid.vercel.app')
    assert.equal(siteUrl('  ', 'https://prod.example/path'), 'https://prod.example')
    assert.equal(siteUrl('not a url', 'prod.example'), 'https://prod.example')
  })
  it('prefers a valid NEXT_PUBLIC_SITE_URL over the Vercel production domain', () => {
    assert.equal(siteUrl('https://custom.example', 'other.example'), 'https://custom.example')
  })
  it('rejects an unusable Vercel production domain and uses the hardcoded fallback', () => {
    assert.equal(siteUrl(undefined, 'http://evil.example'), PRODUCTION_SITE_URL)
    assert.equal(siteUrl(undefined, '  '), PRODUCTION_SITE_URL)
  })
})

const hdrs = (o: Record<string, string>) => ({ get: (k: string) => o[k.toLowerCase()] ?? null })

describe('isSameOrigin', () => {
  it('accepts a matching Origin', () => {
    assert.ok(isSameOrigin(hdrs({ host: 'localhost:3000', origin: 'http://localhost:3000' })))
    assert.ok(isSameOrigin(hdrs({ host: 'internal', 'x-forwarded-host': 'social-sips-livid.vercel.app', origin: 'https://social-sips-livid.vercel.app' })))
  })
  it('rejects a foreign, opaque, or malformed Origin', () => {
    assert.equal(isSameOrigin(hdrs({ host: 'localhost:3000', origin: 'https://evil.example' })), false)
    assert.equal(isSameOrigin(hdrs({ host: 'localhost:3000', origin: 'null' })), false)
    assert.equal(isSameOrigin(hdrs({ host: 'localhost:3000', origin: '::::' })), false)
  })
  it('without Origin, needs Sec-Fetch-Site: same-origin', () => {
    assert.ok(isSameOrigin(hdrs({ host: 'localhost:3000', 'sec-fetch-site': 'same-origin' })))
    assert.equal(isSameOrigin(hdrs({ host: 'localhost:3000', 'sec-fetch-site': 'cross-site' })), false)
    assert.equal(isSameOrigin(hdrs({ host: 'localhost:3000' })), false)
  })
})
