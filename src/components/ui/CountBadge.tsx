/** Compact numeric badge (open reports, unread counts). Hidden when count is 0. */
export default function CountBadge({
  count,
  testId,
  className = '',
}: {
  count: number
  testId?: string
  className?: string
}) {
  if (count <= 0) return null
  return (
    <span
      className={`inline-flex h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-sm bg-accent px-1 text-center text-[10px] font-bold leading-[1.1rem] text-on-accent tabular-nums ${className}`}
      data-testid={testId}
    >
      {count >= 99 ? '99+' : count}
    </span>
  )
}
