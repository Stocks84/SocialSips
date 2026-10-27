import TopNav from '@/components/layout/TopNav'
import BottomNav from '@/components/layout/BottomNav'
import ResponsibilityFooter from '@/components/layout/ResponsibilityFooter'
import { getViewer } from '@/lib/server/viewer'

/** App shell for signed-in / age-verified areas: top nav (desktop), tab bar (mobile). */
export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin } = await getViewer()
  return (
    <div className="min-h-screen bg-hero-glow">
      <TopNav isAdmin={isAdmin} />
      <main className="page-container py-8">{children}</main>
      <ResponsibilityFooter />
      <BottomNav isAdmin={isAdmin} />
    </div>
  )
}
