import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="page-container py-8 text-center text-text-muted text-xs">
      18+ only · Please drink responsibly ·{' '}
      <Link href="/help" className="text-accent-purple">Help &amp; Responsibility</Link>
    </footer>
  )
}
