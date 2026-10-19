import { LEGAL } from '@/lib/legal'

/** A value from the legal config, or a neutral "To be added" line when it's not filled in yet. */
export function L({ k, mailto = false }: { k: 'address' | 'contactEmail' | 'phone' | 'lastUpdated' | 'supabaseRegion' | 'reportRetention'; mailto?: boolean }) {
  const v = LEGAL[k]
  if (!v) return <span className="text-text-muted italic" data-testid="legal-tba">To be added</span>
  if (mailto) return <a href={`mailto:${v}`} className="text-accent-purple">{v}</a>
  return <>{v}</>
}

export function LegalPage({ title, emoji, children, updated = true }: { title: string; emoji: string; children: React.ReactNode; updated?: boolean }) {
  return (
    <article className="max-w-3xl space-y-6 legal" data-testid="legal-page">
      <header>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight"><span aria-hidden="true">{emoji}</span> <span className="gradient-text">{title}</span></h1>
        {updated && <p className="text-text-secondary text-sm mt-2">Last updated: <L k="lastUpdated" /></p>}
      </header>
      {children}
    </article>
  )
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6 space-y-3 text-sm leading-relaxed">
      <h2 className="font-bold text-lg text-text-primary">{title}</h2>
      {children}
    </section>
  )
}
