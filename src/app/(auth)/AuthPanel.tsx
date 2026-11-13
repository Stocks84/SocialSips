/** Sign-up, age gate and sorry: no card on mobile; a surface panel (p-8, max-w-md) at ≥1024. */
export default function AuthPanel({ children }: { children: React.ReactNode }) {
  return <div className="max-w-md lg:rounded-sm lg:border lg:border-rule lg:bg-surface lg:p-8">{children}</div>
}
