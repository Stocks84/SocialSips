export const REACTIONS = ['😂', '🔥', '🍸', '💀', '👏'] as const
export type Reaction = (typeof REACTIONS)[number]
export const isReaction = (v: unknown): v is Reaction => typeof v === 'string' && (REACTIONS as readonly string[]).includes(v)

/** What a tap means: tapping the reaction you already have removes it, anything else sets it. */
export const reactionTarget = (shown: string | null, tapped: string): string | null => (shown === tapped ? null : tapped)

export type ReactionView = { counts: Record<string, number>; mine: string | null }
export type ReactionReply = { error?: string; counts?: Record<string, number>; mine?: string | null }

/**
 * Turn a server reply into what the UI should do. Counts only ever come from the server, so a rejected
 * reaction can never show a wrong number. Replies to older taps are ignored (`stale`).
 */
export function settleReaction(reply: ReactionReply, stale: boolean): { ignore: true } | { ignore: false; error: string | null; view: ReactionView | null } {
  if (stale) return { ignore: true }
  if (reply.error) return { ignore: false, error: reply.error, view: null }
  return { ignore: false, error: null, view: { counts: reply.counts ?? {}, mine: reply.mine ?? null } }
}
