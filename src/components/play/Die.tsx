const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

/** One die face drawn with CSS pips. */
export default function Die({ value, rolling, highlight }: { value: number; rolling?: boolean; highlight?: boolean }) {
  const pips = PIPS[value] ?? []
  return (
    <div
      role="img"
      aria-label={`Die showing ${value}`}
      data-value={value}
      className={`die grid grid-cols-3 grid-rows-3 gap-1 p-2.5 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white shadow-card ${rolling ? 'animate-dice-shake' : 'animate-fade-in'} ${highlight ? 'ring-4 ring-accent-cyan' : ''}`}
    >
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className={`m-auto w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full ${pips.includes(i) ? (value === 1 ? 'bg-accent-pink' : 'bg-slate-900') : ''}`} />
      ))}
    </div>
  )
}
