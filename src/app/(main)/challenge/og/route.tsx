import { getSharedCurrentChallenge } from '@/lib/queries/share'
import { challengeShareInput } from '@/lib/challenge'
import { challengeCardText } from '@/lib/share-meta'
import { ogCard } from '@/lib/server/og-card'

/** 1200×630 share image for this week's challenge. No active challenge = a generic card (never an error). */
export async function GET() {
  const c = await getSharedCurrentChallenge()
  return ogCard(challengeCardText(c ? challengeShareInput(c) : null))
}
