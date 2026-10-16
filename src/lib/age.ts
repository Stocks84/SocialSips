export const MIN_AGE = 18
export const AGE_COOKIE = 'ss-age-verified'

/** Whole years between a YYYY-MM-DD date of birth and today. */
export function ageFromDob(dob: string, today = new Date()): number {
  const d = new Date(dob)
  let age = today.getFullYear() - d.getFullYear()
  const m = today.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--
  return age
}

export const isOfAge = (dob: string) => ageFromDob(dob) >= MIN_AGE
