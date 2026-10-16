import TopNav from '@/components/layout/TopNav'
import BottomNav from '@/components/layout/BottomNav'
import Footer from '@/components/layout/Footer'

/** App shell for signed-in / age-verified areas: top nav (desktop), tab bar (mobile). */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-hero-glow">
      <TopNav />
      <main className="page-container py-8">{children}</main>
      <Footer />
      <BottomNav />
    </div>
  )
}
