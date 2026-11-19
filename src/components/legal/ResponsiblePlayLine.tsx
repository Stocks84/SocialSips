import Link from 'next/link'

/** Short reminder on every Game and Dare page. */
export default function ResponsiblePlayLine({ className = 'text-sm text-ink-2' }: { className?: string }) {
  return (
    <p className={className} data-testid="responsible-play-line">
      Nobody has to drink. Soft drinks are fine.{' '}
      <Link href="/help" className="text-accent font-medium hover:underline">See Help</Link>
    </p>
  )
}
