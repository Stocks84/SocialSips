import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { PRODUCTION_SITE_URL, siteUrl } from './site-url.ts'
import { isSameOrigin } from './same-origin.ts'

describe('siteUrl', () => {
  it('falls back to production when unset or blank', () => {
    assert.equal(siteUrl(undefined), PRODUCTION_SITE_URL)
    assert.equal(siteUrl('  '), PRODUCTION_SITE_URL)
  })
  it('uses the configured origin, trimmed to scheme + host', () => {
    assert.equal(siteUrl('https://socialsips.example/some/path?x=1'), 'https://socialsips.example')
    assert.equal(siteUrl('http://localhost:3000/'), 'http://localhost:3000')
  })
  it('rejects junk and plain-http non-local hosts', () => {
    assert.equal(siteUrl('not a url'), PRODUCTION_SITE_URL)
    assert.equal(siteUrl('http://evil.example'), PRODUCTION_SITE_URL)
    assert.equal(siteUrl('javascript:alert(1)'), PRODUCTION_SITE_URL)
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
