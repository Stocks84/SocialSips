import Link from 'next/link'

type Props = {
  /** Kept for call-site compatibility; first-party emoji are no longer rendered. */
  emoji?: string
  title: string
  children?: React.ReactNode
  /** The one thing to do next. */
  action?: { href: string; label: string }
  testId?: string
}

/** Friendly "nothing here" card with a single clear call to action. */
export default function EmptyState({ title, children, action, testId }: Props) {
  return (
    <div className="card p-8 text-center flex flex-col items-center gap-3" data-testid={testId}>
      <p className="text-lg font-semibold text-ink">{title}</p>
      {children && <p className="text-ink-2 text-sm max-w-md">{children}</p>}
      {action && <Link href={action.href} className="btn-primary text-sm mt-2" data-testid={testId ? `${testId}-cta` : undefined}>{action.label}</Link>}
    </div>
  )
}
