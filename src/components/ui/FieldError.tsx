/** Inline, field-level validation message (pairs with aria-describedby on the input). */
export default function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return <p id={`${id}-error`} className="error-msg text-xs mt-1" role="alert" data-testid="field-error">{message}</p>
}
