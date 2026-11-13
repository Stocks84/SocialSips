import Link from 'next/link'
import TopNav from '@/components/layout/TopNav'
import BottomNav from '@/components/layout/BottomNav'
import { Suspense } from 'react'
import ActionErrorBanner from '@/components/ui/ActionErrorBanner'
import { getViewer } from '@/lib/server/viewer'

/** App shell for signed-in / age-verified areas: top nav (desktop links ≥1024), tab bar (below 1024). */
export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin } = await getViewer()
  return (
    <div className="min-h-screen" data-tabbar="">
      <TopNav isAdmin={isAdmin} />
      <main className="page-container py-8">
        <Suspense fallback={null}><ActionErrorBanner /></Suspense>
        {children}
      </main>
      {/* Below 1024 the tab bar has no Help tab and the desktop nav links are hidden, so keep one visible way to /help. */}
      <p className="page-container lg:hidden" data-testid="mobile-help-link">
        <Link href="/help" className="inline-flex min-h-11 items-center text-sm text-ink underline decoration-accent decoration-1 underline-offset-4 hover:decoration-ink">Help &amp; safety</Link>
      </p>
      <BottomNav isAdmin={isAdmin} />
    </div>
  )
}
