import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ServiceWorkerRegister from '@/components/layout/ServiceWorkerRegister'
import LegalFooter from '@/components/layout/LegalFooter'

/**
 * Inter loaded via next/font — zero layout shift, self-hosted automatically.
 * We use the variable weight range (100–900) for full flexibility.
 */
const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
})

/* ─── SEO + Social Metadata ─────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: {
    default: 'Social Sips — Share Drinking Games & Cocktails',
    template: '%s | Social Sips',
  },
  description:
    'Discover and share the best drinking games and cocktail recipes with friends. ' +
    'Rated by hangover severity. Play responsibly. 18+.',
  keywords: [
    'drinking games',
    'cocktail recipes',
    'party games',
    'beer pong',
    'social drinking',
    'hangover rating',
    'drinking game community',
  ],
  authors: [{ name: 'Social Sips Team' }],
  creator: 'Social Sips',
  applicationName: 'Social Sips',

  // PWA manifest
  manifest: '/manifest.json',

  // Apple PWA meta
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Social Sips',
  },

  // Open Graph (link previews on Slack, iMessage, etc.)
  openGraph: {
    type: 'website',
    title: 'Social Sips — Share Drinking Games & Cocktails',
    description:
      'The community for drinking games, cocktail recipes, and good times. 18+ only.',
    siteName: 'Social Sips',
    // images: [{ url: '/images/og-image.png', width: 1200, height: 630 }],
  },

  // Twitter card
  twitter: {
    card: 'summary_large_image',
    title: 'Social Sips 🍻',
    description:
      'The community for drinking games, cocktail recipes, and good times.',
    // images: ['/images/og-image.png'],
  },

  // Robots
  robots: {
    index: true,
    follow: true,
  },
}

/* ─── Viewport + Theme Color ─────────────────────────────────────────────── */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // app-like feel on mobile
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0F172A' },
    { media: '(prefers-color-scheme: light)', color: '#0F172A' }, // always dark
  ],
}

/* ─── Root Layout ────────────────────────────────────────────────────────── */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`dark ${inter.variable}`} suppressHydrationWarning>
      <head>
        {/* ── PWA / iOS meta tags not yet in Next.js metadata API ── */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#0F172A" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Apple touch icons — replace with real assets later */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
      </head>
      <body className="font-sans antialiased">
        {/*
         * TODO: Wrap children in a <Providers> component once auth is set up.
         * Providers will include:
         *   - Supabase auth context
         *   - Toast/notification provider (e.g. react-hot-toast)
         *   - Any global modal providers
         *
         * Example:
         *   <Providers>
         *     {children}
         *   </Providers>
         */}
        {children}
        <LegalFooter />
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
