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
      <BottomNav isAdmin={isAdmin} />
    </div>
  )
}
