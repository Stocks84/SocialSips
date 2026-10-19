'use client'
/** Catches thrown errors (e.g. the network dropping mid-save) so users get a friendly retry instead of a blank page. */
export default function MainError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card p-6 max-w-xl" role="alert">
      <h1 className="text-xl font-bold mb-2">Whoops, that spilled 🍹</h1>
      <p className="text-text-secondary text-sm mb-4">Something went wrong, possibly a dropped connection. Your last change may not have been saved.</p>
      <button className="btn-primary" onClick={reset}>Try again</button>
    </div>
  )
}
