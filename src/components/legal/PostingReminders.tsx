import Link from 'next/link'

const TERMS = (
  <Link href="/terms" className="text-accent font-medium hover:underline">See the Terms</Link>
)

/** Short 18+ line for the create-game and create-dare screens. */
export function AgeResponsibleLine({ className = 'text-sm text-ink-2 mb-4' }: { className?: string }) {
  return (
    <p className={className} data-testid="age-responsible-line">
      18+ only. Please drink responsibly.
    </p>
  )
}

/** Soft-drink prompt plus a short Terms reminder. Light, in brand. */
export function SoftDrinkTermsNote({
  variant = 'game',
  className = 'text-sm text-ink-2',
}: {
  variant?: 'game' | 'dare' | 'drink' | 'entry' | 'comment'
  className?: string
}) {
  const copy = {
    game: <>Got a soft-drink version? Say so in the rules — nobody has to drink. Don&apos;t encourage excessive or forced drinking. {TERMS}.</>,
    dare: <>Keep the theme light: this is a meme or a drink twist, not a drinking stunt. Soft-drink entries are welcome. Don&apos;t encourage excessive or forced drinking. {TERMS}.</>,
    drink: <>A soft-drink or alcohol-free option is always welcome. Don&apos;t encourage excessive or forced drinking. {TERMS}.</>,
    entry: <>Soft-drink twists are welcome. Don&apos;t encourage excessive or forced drinking. {TERMS}.</>,
    comment: <>Keep it kind. Don&apos;t push anyone to drink.{' '}<Link href="/terms" className="text-accent hover:underline">Terms</Link></>,
  }[variant]
  return (
    <p className={className} data-testid={variant === 'comment' ? 'comment-terms-note' : 'soft-drink-terms-note'}>
      {copy}
    </p>
  )
}
