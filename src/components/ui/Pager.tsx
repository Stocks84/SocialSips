import Link from 'next/link'

type Props = {
  label: string
  prevHref?: string | null
  nextHref?: string | null
  prevText?: string
  nextText?: string
  testId?: string
}

/** Server-rendered prev/next links (plain hrefs, so paging works without JS). Renders nothing if there is nowhere to go. */
export default function Pager({ label, prevHref, nextHref, prevText = '← Newer', nextText = 'Older →', testId }: Props) {
  if (!prevHref && !nextHref) return null
  return (
    <nav className="flex justify-between gap-3 mt-8 text-sm" aria-label={label} data-testid={testId}>
      {prevHref ? <Link href={prevHref} rel="prev" className="btn-ghost" data-testid="pager-prev">{prevText}</Link> : <span />}
      {nextHref && <Link href={nextHref} rel="next" className="btn-ghost" data-testid="pager-next">{nextText}</Link>}
    </nav>
  )
}
