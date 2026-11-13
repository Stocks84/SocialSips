export default function ComingSoon({ children }: { children?: React.ReactNode }) {
  return (
    <div className="card p-6 text-center text-ink-2 text-sm">
      {children ?? 'This feature is coming in V1. The structure is ready.'}
    </div>
  )
}
