import Link from 'next/link'

/**
 * app/page.tsx — Landing Page (Server Component)
 *
 * Shown to all visitors BEFORE they sign in or pass the age gate.
 * No auth required to view this page.
 *
 * Sections:
 *  1. Minimal top nav
 *  2. Hero — big headline + CTAs
 *  3. Feature highlight cards
 *  4. Hangover rating showcase
 *  5. Responsibility footer note
 */

/* ─── Static feature data ────────────────────────────────────────────────── */
const features = [
  {
    icon: '🎮',
    title: 'Drinking Games',
    description:
      'Hundreds of games rated by hangover severity — from sober-friendly classics to legendary two-day recovery sessions.',
    accent: 'text-accent-purple',
    border: 'hover:border-accent-purple/50',
    glow: 'hover:shadow-[0_0_24px_rgba(168,85,247,0.15)]',
  },
  {
    icon: '🍹',
    title: 'Cocktail Recipes',
    description:
      'Community-submitted cocktail recipes for every taste and occasion. Rate them, remix them, make them your own.',
    accent: 'text-accent-cyan',
    border: 'hover:border-accent-cyan/50',
    glow: 'hover:shadow-[0_0_24px_rgba(103,232,249,0.15)]',
  },
  {
    icon: '😂',
    title: 'Jokes & Memes',
    description:
      'Because what\'s a party without a good laugh? Fresh content from the community, every single day.',
    accent: 'text-accent-pink',
    border: 'hover:border-accent-pink/50',
    glow: 'hover:shadow-[0_0_24px_rgba(244,114,182,0.15)]',
  },
] as const

const hangoverLevels = [
  {
    emoji: '😇',
    label: 'No Hangover',
    description: 'You\'ll be fine. Probably.',
    class: 'badge-no-hangover',
  },
  {
    emoji: '🤕',
    label: 'Mild Hangover',
    description: 'Painkillers recommended.',
    class: 'badge-mild',
  },
  {
    emoji: '💀',
    label: 'Two-Day Hangover',
    description: 'Cancel your plans. All of them.',
    class: 'badge-two-day',
  },
] as const

/* ─── Page Component ─────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background overflow-x-hidden">

      {/* ── Ambient background glow ── */}
      <div className="fixed inset-0 bg-hero-glow pointer-events-none" aria-hidden="true" />
      <div
        className="fixed top-1/4 -left-32 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ background: '#A855F7' }}
        aria-hidden="true"
      />
      <div
        className="fixed bottom-1/3 -right-32 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-10"
        style={{ background: '#67E8F9' }}
        aria-hidden="true"
      />

      <div className="relative page-container">

        {/* ══════════════════════════════════════════
            1. NAV
        ══════════════════════════════════════════ */}
        <nav className="flex items-center justify-between py-5" aria-label="Main navigation">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <span className="text-3xl" role="img" aria-label="Clinking glasses">🍻</span>
            <span className="font-black text-xl gradient-text tracking-tight">
              Social Sips
            </span>
          </div>

          {/* Nav links */}
          <div className="flex items-center gap-2">
            <Link href="/help" className="btn-ghost text-sm hidden sm:inline-flex">
              🙏 Be Safe
            </Link>
            <Link href="/sign-in" className="btn-secondary text-sm py-2 px-4">
              Sign in
            </Link>
          </div>
        </nav>

        {/* ══════════════════════════════════════════
            2. HERO
        ══════════════════════════════════════════ */}
        <section className="text-center py-20 sm:py-28 lg:py-32" aria-labelledby="hero-heading">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 badge-purple mb-8 px-4 py-2 text-sm font-medium">
            <span aria-hidden="true">✨</span>
            <span>The drinking games community you didn&apos;t know you needed</span>
          </div>

          {/* Main headline */}
          <h1
            id="hero-heading"
            className="text-5xl sm:text-7xl lg:text-8xl font-black mb-6 leading-[1.05] tracking-tight"
          >
            Games. Cocktails.
            <br />
            <span className="gradient-text">Good Times.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-text-secondary text-lg sm:text-xl max-w-lg mx-auto mb-10 leading-relaxed">
            Discover and share the world&apos;s best drinking games and cocktail recipes.
            <br className="hidden sm:block" />
            <span className="text-accent-cyan font-medium"> Rated by hangover severity.</span>
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Link
              href="/age-gate"
              className="btn-primary text-base px-8 py-4 w-full sm:w-auto"
            >
              🚀 Get Started — It&apos;s Free
            </Link>
            <Link
              href="/feed"
              className="btn-secondary text-base px-8 py-4 w-full sm:w-auto"
            >
              Browse Games First
            </Link>
          </div>

          {/* Responsibility note */}
          <p className="text-text-muted text-sm">
            18+ only &middot; Please drink responsibly 🙏
          </p>
        </section>

        {/* ══════════════════════════════════════════
            3. FEATURE CARDS
        ══════════════════════════════════════════ */}
        <section className="py-12 sm:py-16" aria-labelledby="features-heading">
          <h2 id="features-heading" className="sr-only">Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className={`card p-6 cursor-default transition-all duration-300 ${f.border} ${f.glow}`}
              >
                <span className="text-4xl" role="img" aria-label={f.title}>
                  {f.icon}
                </span>
                <h3 className={`text-lg font-bold mt-4 mb-2 ${f.accent}`}>
                  {f.title}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════
            4. HANGOVER RATING SHOWCASE
        ══════════════════════════════════════════ */}
        <section className="py-12 sm:py-16" aria-labelledby="ratings-heading">
          <div className="card p-8 sm:p-10">
            <div className="text-center mb-8">
              <h2 id="ratings-heading" className="text-2xl sm:text-3xl font-black mb-2">
                Know what you&apos;re getting into 👀
              </h2>
              <p className="text-text-secondary text-sm">
                Every game is rated by the community so you can plan accordingly.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {hangoverLevels.map((level) => (
                <div
                  key={level.label}
                  className="bg-background rounded-xl p-5 text-center border border-border"
                >
                  <span className="text-4xl block mb-3" role="img" aria-label={level.label}>
                    {level.emoji}
                  </span>
                  <span className={`badge ${level.class} mb-2`}>
                    {level.label}
                  </span>
                  <p className="text-text-secondary text-xs mt-2">{level.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            5. RESPONSIBILITY FOOTER
        ══════════════════════════════════════════ */}
        <section className="py-8 sm:py-12">
          <div className="card-glass p-5 text-center">
            <p className="text-text-muted text-sm leading-relaxed">
              Social Sips promotes responsible drinking. Always drink in moderation,
              know your limits, and never drink and drive.{' '}
              <Link href="/help" className="text-accent-purple hover:text-purple-400 font-medium transition-colors">
                Help &amp; Responsibility resources →
              </Link>
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-text-muted text-xs mt-8 pb-8">
            &copy; {new Date().getFullYear()} Social Sips &middot; For adults 18+ only
          </p>
        </section>

      </div>
    </main>
  )
}
