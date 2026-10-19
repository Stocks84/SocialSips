type Issue = { path: PropertyKey[]; message: string; code?: string; minimum?: number | bigint; maximum?: number | bigint; origin?: string; type?: string }

const LABELS: Record<string, string> = {
  title: 'Name', name: 'Name', summary: 'Description', description: 'Description', rules: 'Rules', method: 'Method',
  minPlayers: 'Min players', maxPlayers: 'Max players', hangoverRating: 'Hangover rating', ingredients: 'Ingredients',
  equipment: 'Equipment', tags: 'Tags', caption: 'Caption', jokeText: 'Joke', body: 'Comment',
}

/** Plain-English message for one zod issue (custom messages win; otherwise "At least 10 characters" etc.). */
export function issueMessage(i: Issue): string {
  if (!/^(Too small|Too big|Invalid)/.test(i.message)) return i.message
  const isText = i.origin === 'string' || i.type === 'string'
  const isList = i.origin === 'array' || i.type === 'array'
  if (i.code === 'too_small' && i.minimum !== undefined && !/at least one/i.test(i.message)) {
    return isText ? `At least ${i.minimum} characters` : isList ? `Add at least ${i.minimum}` : `Must be ${i.minimum} or more`
  }
  if (i.code === 'too_big' && i.maximum !== undefined) {
    return isText ? `Max ${i.maximum} characters` : isList ? `Max ${i.maximum} items` : `Must be ${i.maximum} or less`
  }
  if (i.code === 'invalid_value' || i.code === 'invalid_enum_value') return 'Pick one of the options'
  if (i.code === 'invalid_type') return 'Required'
  return i.message
}

/** "Name: At least 3 characters" for the first zod issue. */
export const firstIssue = (issues: Issue[]) => {
  const i = issues[0]
  if (!i) return 'Check the form'
  const key = String(i.path[0] ?? '')
  return `${LABELS[key] ?? (key || 'Form')}: ${issueMessage(i)}`
}

/** { field: message } for every field with a problem (first issue per field). */
export function fieldErrors(issues: Issue[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const i of issues) {
    const key = String(i.path[0] ?? '')
    if (key && !out[key]) out[key] = issueMessage(i)
  }
  return out
}

/** The user's typed text values, so a failed submit can refill the form (files are skipped). */
export function formValues(formData: FormData): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {}
  for (const key of new Set(formData.keys())) {
    if (key.startsWith('$')) continue
    const all = formData.getAll(key).filter((v): v is string => typeof v === 'string')
    out[key] = all.length > 1 || key.startsWith('ingredient') ? all : (all[0] ?? '')
  }
  return out
}

export type EditState = {
  error?: string
  ok?: boolean
  fieldErrors?: Record<string, string>
  values?: Record<string, string | string[]>
}
