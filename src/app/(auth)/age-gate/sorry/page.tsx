export const metadata = { title: 'Sorry, adults only' }

export default function AgeGateSorryPage() {
  return (
    <>
      <h1 className="text-2xl font-black mb-2">Sorry, not yet! 🧃</h1>
      <p className="text-text-secondary text-sm mb-6">
        Social Sips is for adults 18 and over, so we can&apos;t let you in. Come back when you&apos;re old enough. We&apos;ll save you a seat.
      </p>
      <a href="https://www.google.com" className="btn-primary w-full block text-center">Leave Social Sips</a>
    </>
  )
}
