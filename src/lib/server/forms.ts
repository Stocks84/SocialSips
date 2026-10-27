import { formValues, type EditState } from '@/lib/validators/issues'

/** Alias of EditState — kept for form components that historically imported FormState. */
export type FormState = EditState
export type { EditState }

/** Failed submit: message + per-field errors + the typed values so the form keeps them. */
export const fail = (
  formData: FormData,
  error: string,
  fields?: Record<string, string>,
): EditState => ({ error, fieldErrors: fields, values: formValues(formData) })
