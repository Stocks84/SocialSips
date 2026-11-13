import Link from 'next/link'
import { faArrowRight } from '@fortawesome/free-solid-svg-icons'
import HangoverBoard from '@/components/ui/HangoverBoard'
import { Icon } from '@/components/ui/Icon'

/**
 * app/page.tsx — Landing page (Server Component), "Traditional bar" design.
 * Shown to all visitors before sign-in or the age gate. Left-aligned; the board title is the only centred text.
 * Sections: header · hero + hangover board · menu (games, cocktails, memes) · responsibility close.
 * The global LegalFooter (root layout) is the only footer.
 */

const menu = [
  {
    no: 'No. 1',
    title: 'Games',
    text: 'Rated by hangover severity, from sober-friendly classics to two-day recovery sessions.',
    href: '/games',
  },
  {
    no: 'No. 2',
    title: 'Cocktails',
    text: 'Community-submitted recipes. Rate them, remix them, make them your own.',
    href: '/cocktails',
  },
  {
    no: 'No. 3',
    title: 'Memes',
    text: "Because what's a party without a good laugh?",
    href: '/memes',
  },
] as const

const underline = 'underline decoration-accent decoration-1 underline-offset-4 hover:decoration-ink'

export default function LandingPage() {
  return (
    <div className="page-container w-full flex-1">
      {/* 1. Header (not sticky on landing) */}
      <nav aria-label="Main navigation">
        <div className="flex h-14 items-center justify-between lg:h-20">
          <Link href="/" className="font-display text-wordmark lg:text-wordmark-lg text-ink">Social Sips</Link>
          <div className="flex items-center gap-8">
            <Link href="/help" className="hidden min-h-11 items-center text-[15px] leading-6 font-medium text-ink-2 hover:text-ink lg:inline-flex">
              Help &amp; safety
            </Link>
            <Link href="/sign-in" className="btn-secondary btn-sm">Sign in</Link>
          </div>
        </div>
        <div className="rule-double" aria-hidden="true" />
      </nav>

      <main>
        {/* 2. Hero + board */}
        <section className="pt-12 lg:grid lg:grid-cols-12 lg:gap-8 lg:pt-20 lg:pb-24">
          <div className="lg:col-span-7 lg:pt-6">
            <h1 className="enter max-w-2xl font-display font-normal text-display tracking-h1 text-ink lg:text-display-lg lg:tracking-display">
              Drinking games, rated by the morning after.
            </h1>
            <p className="enter mt-4 max-w-xl text-body-lg text-ink-2 lg:mt-8 lg:max-w-md lg:text-body-lg-lg" style={{ '--enter-step': 1 } as React.CSSProperties}>
              Post the games your group plays, the cocktails you mix and the memes you can&apos;t stop sending.
            </p>
            <div className="enter mt-6 flex flex-col gap-1 lg:mt-8 lg:flex-row lg:items-center lg:gap-8" style={{ '--enter-step': 2 } as React.CSSProperties}>
              <Link href="/age-gate" className="btn-primary w-full lg:w-auto">Enter Social Sips</Link>
              <Link href="/feed" className={`inline-flex min-h-11 items-center self-start text-ink lg:self-auto ${underline}`}>Browse games</Link>
            </div>
            <p className="enter mt-1 text-meta text-ink-3 lg:mt-4" style={{ '--enter-step': 3 } as React.CSSProperties}>
              18+ only. Every game works with soft drinks.
            </p>
          </div>
          <div className="pt-10 sm:max-w-lg lg:col-span-5 lg:max-w-none lg:pt-0">
            <HangoverBoard size="full" reveal />
          </div>
        </section>

        {/* 3. Menu */}
        <section aria-label="What's on" className="pt-12 lg:pt-0">
          <div className="rule-double" aria-hidden="true" />
          <ul>
            {menu.map((m) => (
              <li key={m.href} className="border-b border-rule py-5 lg:grid lg:grid-cols-12 lg:items-baseline lg:gap-8 lg:py-6">
                <div className="flex items-baseline gap-4 lg:col-span-3">
                  <span className="font-caps font-bold text-caps tracking-caps text-ink-3">{m.no}</span>
                  <h2 className="font-display font-normal text-h2 text-ink lg:text-h2-lg">{m.title}</h2>
                </div>
                <p className="mt-2 max-w-xl text-base text-ink-2 lg:col-span-6 lg:mt-0 lg:text-row">{m.text}</p>
                <div className="flex items-center lg:col-span-3 lg:self-center lg:gap-3">
                  <span className="leader hidden lg:block" aria-hidden="true" />
                  <Link href={m.href} className={`link-arrow inline-flex min-h-11 items-center gap-2 text-ink ${underline}`}>
                    {m.title}
                    <span className="link-arrow-icon" aria-hidden="true"><Icon icon={faArrowRight} className="text-icon-sm" /></span>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* 4. Responsibility close: the single help link on this page */}
        <section aria-label="Drink responsibly" className="pt-10 pb-12 lg:flex lg:items-center lg:gap-6 lg:py-16">
          <p className="max-w-xl text-base text-ink-2 lg:max-w-none">
            Social Sips promotes responsible drinking. Know your limits, and never drink and drive.
          </p>
          <Link href="/help" className={`inline-flex min-h-11 items-center text-ink ${underline}`}>Help &amp; responsibility</Link>
        </section>
      </main>
    </div>
  )
}
