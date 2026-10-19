/**
 * Mexican / Mäxchen scoring for two dice.
 * The higher die is read first (3 + 1 = 31). Doubles beat every mixed roll (11 < 22 < … < 66).
 * 21 is "Mexican!", the highest roll of all.
 */
export type MexicanKind = 'mexican' | 'double' | 'mixed'
export type MexicanScore = {
  /** Two-digit reading, e.g. 31, 44, 21 */
  value: number
  kind: MexicanKind
  /** 1 = best (Mexican) … 21 = worst (31) */
  rank: number
  label: string
}

const DOUBLE_NAMES = ['', '1s', '2s', '3s', '4s', '5s', '6s']

export function scoreMexican(a: number, b: number): MexicanScore {
  const hi = Math.max(a, b)
  const lo = Math.min(a, b)
  const value = hi * 10 + lo
  const kind: MexicanKind = value === 21 ? 'mexican' : hi === lo ? 'double' : 'mixed'
  const label = kind === 'mexican' ? 'Mexican!' : kind === 'double' ? `Double ${DOUBLE_NAMES[hi]}` : String(value)
  return { value, kind, rank: RANKING.indexOf(value) + 1, label }
}

/** Every possible reading, best first (21 outcomes). */
export const RANKING: readonly number[] = [
  21, 66, 55, 44, 33, 22, 11,
  65, 64, 63, 62, 61, 54, 53, 52, 51, 43, 42, 41, 32, 31,
]

/** >0 if a beats b, <0 if b beats a, 0 if equal. */
export const compareMexican = (a: MexicanScore, b: MexicanScore) => b.rank - a.rank
