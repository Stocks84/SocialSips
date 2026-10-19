/** Skeleton while memes load. */
export default function MemesLoading() {
  return (
    <div aria-busy="true" aria-label="Loading memes">
      <div className="h-10 w-48 rounded-xl bg-surface animate-pulse mb-6" />
      <div className="grid gap-5 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card overflow-hidden">
            <div className="h-56 bg-surface animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-2/3 rounded bg-surface animate-pulse" />
              <div className="h-3 w-1/3 rounded bg-surface animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
