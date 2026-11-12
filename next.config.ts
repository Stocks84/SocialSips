import type { NextConfig } from 'next'

// Only this project's public storage may be used by next/image.
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').hostname || 'eqzrngadyetamexuwrbl.supabase.co'
  } catch {
    return 'eqzrngadyetamexuwrbl.supabase.co'
  }
})()

// ── Security headers ──────────────────────────────────────────────────────────
// Conservative CSP: everything same-origin except this project's Supabase (storage images, API)
// and Cloudflare Turnstile (challenges.cloudflare.com).
// script-src keeps 'unsafe-inline' because Next's App Router bootstraps with inline scripts and we
// don't use per-request nonces (they'd force every page dynamic). It still blocks third-party
// script hosts, plugins, framing, <base> hijacks and cross-site form posts.
const isDev = process.env.NODE_ENV !== 'production'
const isVercelPreview = process.env.VERCEL_ENV === 'preview' // Vercel toolbar/comments on preview deploys only
const supabaseOrigin = `https://${supabaseHost}`
const vercelLive = isVercelPreview ? ['https://vercel.live'] : []
// Cloudflare Turnstile (sign-up/sign-in CAPTCHA): script + challenge iframe.
const turnstile = 'https://challenges.cloudflare.com'
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} ${turnstile} ${vercelLive.join(' ')}`,
  `style-src 'self' 'unsafe-inline' ${vercelLive.join(' ')}`,
  `img-src 'self' data: blob: ${supabaseOrigin} ${vercelLive.join(' ')}`,
  `font-src 'self' data: ${vercelLive.join(' ')}`,
  `connect-src 'self' ${supabaseOrigin} ${turnstile} wss://${supabaseHost}${isDev ? ' ws:' : ''}${isVercelPreview ? ' https://vercel.live wss://ws-us3.pusher.com' : ''}`,
  `frame-src ${turnstile} ${vercelLive.join(' ')}`,
  `worker-src 'self'`,
  `manifest-src 'self'`,
  `media-src 'self'`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
].map((d) => d.replace(/\s+/g, ' ').trim()).join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  experimental: {
    // Allow game cover uploads (max 4 MB enforced in the action) through Server Actions
    serverActions: { bodySizeLimit: '5mb' },
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }],
  },
}

export default nextConfig
