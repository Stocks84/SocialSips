export default function ComingSoon({ children }: { children?: React.ReactNode }) {
  return (
    <div className="card-glass p-6 text-center text-text-secondary text-sm">
      🚧 {children ?? 'This feature is coming in V1. The structure is ready.'}
    </div>
  )
}
