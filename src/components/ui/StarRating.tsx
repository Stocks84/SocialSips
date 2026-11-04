export default function StarRating({ score }: { score: number }) {
  return (
    <span className="text-accent-cyan" aria-label={`${score} out of 5`}>
      {'★'.repeat(score)}
      <span className="text-slate-500">{'★'.repeat(5 - score)}</span>
    </span>
  )
}
