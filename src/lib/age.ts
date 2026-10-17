export const MIN_AGE = 18
export const AGE_COOKIE = 'ss-age-verified'

/** Whole years between a YYYY-MM-DD date of birth and today's local calendar date (no UTC parsing). */
export function ageFromDob(dob: string, today = new Date()): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob)
  if (!m) return NaN
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return NaN
  const ty = today.getFullYear(), tm = today.getMonth() + 1, td = today.getDate()
  let age = ty - y
  if (tm < mo || (tm === mo && td < d)) age--
  return age
}

export const isOfAge = (dob: string) => ageFromDob(dob) >= MIN_AGE
