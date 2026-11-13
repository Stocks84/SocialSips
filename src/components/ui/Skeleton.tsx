/** Loading skeletons for route-level loading.tsx files (shown instantly on navigation, so a tap always gets feedback). */

const bar = 'rounded-sm bg-rule animate-pulse'

function Shell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}

/** Page title + grid of image cards (cocktails, memes, games lists). */
export function GridSkeleton({ label, count = 4, imageClass = 'h-56' }: { label: string; count?: number; imageClass?: string }) {
  return (
    <Shell label={label}>
      <div className="h-10 w-48 rounded-sm bg-raised animate-pulse mb-6" />
      <div className="grid gap-5 sm:grid-cols-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="card overflow-hidden">
            <div className={`${imageClass} bg-raised animate-pulse`} />
            <div className="p-4 space-y-2">
              <div className={`h-4 w-2/3 ${bar}`} />
              <div className={`h-3 w-1/3 ${bar}`} />
            </div>
          </div>
        ))}
      </div>
    </Shell>
  )
}

/** Page title + stacked rows (feed, notifications). */
export function ListSkeleton({ label, count = 5 }: { label: string; count?: number }) {
  return (
    <Shell label={label}>
      <div className="h-10 w-48 rounded-sm bg-raised animate-pulse mb-6" />
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="card p-4 flex gap-4">
            <div className="h-12 w-12 shrink-0 rounded-sm bg-rule animate-pulse" />
            <div className="flex-1 space-y-2 py-1">
              <div className={`h-4 w-3/4 ${bar}`} />
              <div className={`h-3 w-1/2 ${bar}`} />
            </div>
          </div>
        ))}
      </div>
    </Shell>
  )
}

/** Hero image + title + text blocks (cocktail / game detail). */
export function DetailSkeleton({ label }: { label: string }) {
  return (
    <Shell label={label}>
      <div className="h-56 sm:h-72 w-full rounded-sm bg-raised animate-pulse mb-6" />
      <div className={`h-8 w-2/3 ${bar} mb-3`} />
      <div className={`h-4 w-1/3 ${bar} mb-8`} />
      <div className="card p-5 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className={`h-3 ${i % 2 ? 'w-5/6' : 'w-full'} ${bar}`} />)}
      </div>
    </Shell>
  )
}

/** Avatar + name header + content rows (profile). */
export function ProfileSkeleton({ label }: { label: string }) {
  return (
    <Shell label={label}>
      <div className="flex items-center gap-4 mb-6">
        <div className="h-20 w-20 rounded-full bg-raised animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className={`h-6 w-40 ${bar}`} />
          <div className={`h-4 w-24 ${bar}`} />
        </div>
      </div>
      <div className={`h-4 w-48 ${bar} mb-6`} />
      <div className="grid gap-5 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-32 animate-pulse" />)}
      </div>
    </Shell>
  )
}
