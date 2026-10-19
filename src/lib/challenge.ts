export type ChallengeKind = 'meme' | 'cocktail_variation'
export type Challenge = { id: string; starts_on: string; theme: string; kind: ChallengeKind; description: string | null; is_default: boolean }
export type BoardEntry = {
  entry_id: string; user_id: string; username: string; display_name: string | null; avatar_url: string | null
  meme_id: string | null; meme_caption: string | null; meme_image_url: string | null; meme_joke: string | null
  variation_id: string | null; variation_title: string | null; variation_rules: string | null; cocktail_id: string | null; cocktail_name: string | null
  votes: number; created_at: string; my_vote: boolean; can_vote: boolean
}
export const KIND_LABEL: Record<ChallengeKind, string> = { meme: 'Meme', cocktail_variation: 'Cocktail variation' }

/** Week boundaries in Europe/Vienna: starts_on (Monday) 00:00 to the next Monday 00:00. */
function viennaMidnight(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number)
  const guess = Date.UTC(y, m - 1, d)
  // offset of Vienna at that moment (CET +1 / CEST +2)
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Vienna', hour: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(guess))
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 1)
  return new Date(guess - h * 3600_000)
}
export const challengeStart = (startsOn: string) => viennaMidnight(startsOn)
export function challengeEnd(startsOn: string) {
  const [y, m, d] = startsOn.split('-').map(Number)
  const next = new Date(Date.UTC(y, m - 1, d + 7)).toISOString().slice(0, 10)
  return viennaMidnight(next)
}
export function challengeStatus(startsOn: string, now = new Date()): 'upcoming' | 'open' | 'ended' {
  if (now < challengeStart(startsOn)) return 'upcoming'
  return now < challengeEnd(startsOn) ? 'open' : 'ended'
}
export const weekLabel = (startsOn: string) => {
  const s = challengeStart(startsOn), e = new Date(challengeEnd(startsOn).getTime() - 60_000)
  const f = (x: Date) => x.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Europe/Vienna' })
  return `${f(s)} – ${f(e)}`
}
