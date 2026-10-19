/** Unbiased random integer in [0, n) from crypto.getRandomValues (rejection sampling, no modulo bias). */
export function randomInt(n: number): number {
  if (!Number.isInteger(n) || n < 1 || n > 2 ** 32) throw new RangeError('n must be an integer from 1 to 2^32')
  const limit = 2 ** 32 - (2 ** 32 % n)
  const buf = new Uint32Array(1)
  for (;;) {
    crypto.getRandomValues(buf)
    if (buf[0] < limit) return buf[0] % n
  }
}

/** A fair six-sided die: 1–6. */
export const rollDie = () => randomInt(6) + 1

/** Fisher–Yates shuffle (returns a new array). */
export function shuffle<T>(items: readonly T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
