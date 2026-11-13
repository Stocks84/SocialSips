/** `emoji` is kept for call-site compatibility; first-party emoji are no longer rendered. */
export default function PageHeader({ title, subtitle }: { emoji?: string; title: string; subtitle?: string }) {
  return (
    <header className="mb-8">
      <h1 className="font-display font-normal text-h2 lg:text-h2-lg text-ink">{title}</h1>
      {subtitle && <p className="text-ink-2 mt-2">{subtitle}</p>}
    </header>
  )
}
