export const REACTIONS = ['😂', '🔥', '🍸', '💀', '👏'] as const
export type Reaction = (typeof REACTIONS)[number]
export const isReaction = (v: unknown): v is Reaction => typeof v === 'string' && (REACTIONS as readonly string[]).includes(v)
