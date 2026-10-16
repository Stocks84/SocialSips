import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <p className="text-6xl mb-4">🫗</p>
      <h1 className="text-3xl font-black mb-2">This glass is empty</h1>
      <Link href="/feed" className="btn-primary mt-4">Back to the feed</Link>
    </main>
  )
}
