import { getWelcomeState } from '@/lib/server/welcome'
import WelcomePrompt from '@/components/layout/WelcomePrompt'

/**
 * Zero-height fallback: a card-sized skeleton would jump the page for members
 * who do not see the welcome prompt (everyone created before the cutoff, and
 * anyone who already dismissed it). The real card may still appear for a
 * first visit, as it does today after the client checks localStorage.
 */
export function WelcomeFallback() {
  return (
    <div className="h-0 overflow-hidden" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading welcome</span>
    </div>
  )
}

/** Server wrapper so the welcome query can stream in without blocking the shell. */
export default async function WelcomeSlot() {
  const welcome = await getWelcomeState()
  if (!welcome.show) return null
  return <WelcomePrompt showProfile={welcome.showProfile} />
}
