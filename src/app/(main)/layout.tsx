import TopNav from '@/components/layout/TopNav'
import BottomNav from '@/components/layout/BottomNav'
import { Suspense } from 'react'
import ActionErrorBanner from '@/components/ui/ActionErrorBanner'
import SuspendedBanner from '@/components/ui/SuspendedBanner'
import { getViewer } from '@/lib/server/viewer'
import WelcomeSlot, { WelcomeFallback } from '@/components/layout/WelcomeSlot'
import { getWelcomeState } from '@/lib/server/welcome'
import { getOpenReportCount } from '@/lib/queries/admin'

/** App shell for signed-in / age-verified areas: top nav (desktop links ≥1024), tab bar (below 1024). */
export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const started = performance.now()
  // Kick welcome off now: it shares getViewer() (cached) and then loads the profile.
  // The slot awaits the same promise, so the shell need not wait for it.
  const welcomePromise = getWelcomeState()
  // Report count already no-ops for non-admins after getViewer(); it can run in parallel.
  const [{ isAdmin, suspended }, openReports] = await Promise.all([
    getViewer(),
    getOpenReportCount(),
  ])
  if (process.env.SS_SHELL_TIMING === '1') {
    console.info(`[shell] layout viewer+reports ${Math.round(performance.now() - started)}ms`)
  }
  void welcomePromise
  return (
    <div className="min-h-screen" data-tabbar="">
      <TopNav isAdmin={isAdmin} openReports={openReports} />
      <main className="page-container py-8">
        <Suspense fallback={null}><ActionErrorBanner /></Suspense>
        {suspended && <SuspendedBanner reason={suspended.reason} />}
        <Suspense fallback={<WelcomeFallback />}>
          <WelcomeSlot />
        </Suspense>
        {children}
      </main>
      <BottomNav isAdmin={isAdmin} openReports={openReports} />
    </div>
  )
}
