export default function PageHeader({ emoji, title, subtitle }: { emoji: string; title: string; subtitle?: string }) {
  return (
    <header className="mb-8">
      <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
        <span aria-hidden="true">{emoji}</span> <span className="gradient-text">{title}</span>
      </h1>
      {subtitle && <p className="text-text-secondary mt-2">{subtitle}</p>}
    </header>
  )
}
