import AuthPanel from '../../AuthPanel'
export const metadata = { title: 'Sorry, adults only' }

export default function AgeGateSorryPage() {
  return (
    <AuthPanel>
      <h1 className="font-display font-normal text-h1 lg:text-h1-lg tracking-h1 text-ink mb-2">Sorry, not yet!</h1>
      <p className="text-ink-2 text-sm mb-6">
        Social Sips is for adults 18 and over, so we can&apos;t let you in. Come back when you&apos;re old enough. We&apos;ll save you a seat.
      </p>
      <a href="https://www.google.com" className="btn-primary w-full block text-center">Leave Social Sips</a>
    </AuthPanel>
  )
}
