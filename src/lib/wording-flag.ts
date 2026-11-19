/**
 * Light matcher for hazing / “drink until you pass out” wording.
 * Used to flag posts, comments and Dares for an admin to review.
 * Not a filter and not a ban: ordinary “sip”, “drink” and “soft drinks” must not match.
 */
export type WordingFlagMatch = {
  id: string
  phrase: string
}

type Pattern = { id: string; phrase: string; re: RegExp }

const PATTERNS: Pattern[] = [
  {
    id: 'pass-out',
    phrase: 'drink until you pass out',
    re: /\b(?:drink|drinking|chug|chugging|down(?:ing)?)\b[\s\S]{0,48}\b(?:until|til|till|'til)\b[\s\S]{0,24}\b(?:you\s+)?(?:pass(?:es|ed|ing)?\s+out|black(?:s|ed|ing)?\s*out|blackouts?)\b/i,
  },
  {
    id: 'pass-out-from',
    phrase: 'pass out from drinking',
    re: /\b(?:pass(?:es|ed|ing)?\s+out|black(?:s|ed|ing)?\s*out|blackouts?)\b[\s\S]{0,24}\b(?:from|after|on)\b[\s\S]{0,20}\b(?:drink|drinking|alcohol|booze)\w*\b/i,
  },
  {
    id: 'drink-until-sick',
    phrase: 'drink until you are sick',
    re: /\b(?:drink|drinking|chug|chugging)\b[\s\S]{0,48}\b(?:until|til|till|'til)\b[\s\S]{0,24}\b(?:you\s+)?(?:puke|puking|vomit|vomiting|throw(?:s|ing)?\s+up|sick)\b/i,
  },
  {
    id: 'hazing',
    phrase: 'hazing',
    re: /\bhazing\b|\bhaze\s+(?:them|him|her|someone|the\s+newbie|the\s+rookies?)\b|\bhazed\b/i,
  },
  {
    id: 'initiation',
    phrase: 'drinking initiation',
    re: /\b(?:drinking\s+)?initiations?\s+(?:ritual|ceremony|dare|challenge|shot|game)s?\b|\binitiations?\s+(?:drinking|shot)\b/i,
  },
  {
    id: 'forced-drink',
    phrase: 'forced to drink',
    re: /\bforce(?:d|s|ing)?\s+(?:them\s+|someone\s+|people\s+)?to\s+drink\b|\bforced\s+drinking\b|\bmake\s+them\s+drink(?:\s+(?:it|all|up|alcohol|beer|shots?))?\b/i,
  },
  {
    id: 'drink-til-drop',
    phrase: 'drink until you drop',
    re: /\b(?:drink|chug)\w*\b[\s\S]{0,24}\b(?:until|til|till|'til)\s+you\s+drop\b/i,
  },
  {
    id: 'punishment-chug',
    phrase: 'drink as punishment',
    re: /\b(?:chug|drink)\w*\b[\s\S]{0,16}\bas\s+punishment\b|\bpunishment\s+(?:chug|shot|drink)\b/i,
  },
]

function normalize(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Return the first matching flag in `text`, or null. */
export function wordingFlag(text: string | null | undefined): WordingFlagMatch | null {
  if (!text) return null
  const t = normalize(text)
  if (!t) return null
  for (const p of PATTERNS) {
    if (p.re.test(t)) return { id: p.id, phrase: p.phrase }
  }
  return null
}

/** Scan several fields as one block (title + body, and so on). */
export function wordingFlagTexts(parts: Array<string | null | undefined>): WordingFlagMatch | null {
  return wordingFlag(parts.filter((p): p is string => Boolean(p && p.trim())).join('\n'))
}
