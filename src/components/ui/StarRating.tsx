export default function StarRating({ score }: { score: number }) {
  return (
    <span className="text-accent" aria-label={`${score} out of 5`}>
      {'★'.repeat(score)}
      <span className="text-ink-3">{'★'.repeat(5 - score)}</span>
    </span>
  )
}
