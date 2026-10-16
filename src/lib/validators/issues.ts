/** "field: message" for the first zod issue. */
export const firstIssue = (issues: { path: PropertyKey[]; message: string }[]) => {
  const i = issues[0]
  return i ? `${String(i.path[0] ?? 'Form')}: ${i.message}` : 'Check the form'
}
