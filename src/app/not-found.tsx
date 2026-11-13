import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-3xl font-display font-normal mb-2">This glass is empty</h1>
      <Link href="/feed" className="btn-primary mt-4">Back to the feed</Link>
    </main>
  )
}
