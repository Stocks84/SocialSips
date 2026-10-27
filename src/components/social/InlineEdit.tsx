'use client'
import { useActionState, useEffect, useState } from 'react'
import FieldError from '@/components/ui/FieldError'
import type { FormState } from '@/lib/actions/social'

type Field = { name: string; label: string; value: string; max: number; rows?: number }
type Props = {
  action: (prev: FormState, fd: FormData) => Promise<FormState>
  hidden: Record<string, string>
  fields: Field[]
  children: React.ReactNode
  testId: string
}

/** Shows `children` with an Edit button; Edit swaps in a small form that saves in place. */
export default function InlineEdit({ action: serverAction, hidden, fields, children, testId }: Props) {
  const [editing, setEditing] = useState(false)
  const [state, action, pending] = useActionState<FormState, FormData>(serverAction, {})
  useEffect(() => { if (state.ok) setEditing(false) }, [state])
  const val = (f: Field) => { const v = state.values?.[f.name]; return typeof v === 'string' ? v : f.value }

  if (!editing) {
    return (
      <>
        {children}
        <button type="button" onClick={() => setEditing(true)} className="text-xs text-text-muted hover:text-accent-cyan mt-2" data-testid={`${testId}-edit`}>✏️ Edit</button>
      </>
    )
  }
  return (
    <form action={action} className="space-y-2 mt-1" data-testid={`${testId}-form`}>
      {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {fields.map((f) => (
        <div key={f.name}>
          {f.rows ? (
            <textarea name={f.name} defaultValue={val(f)} rows={f.rows} maxLength={f.max} required className="input" aria-label={f.label} />
          ) : (
            <input name={f.name} defaultValue={val(f)} maxLength={f.max} required className="input" aria-label={f.label} />
          )}
          <FieldError id={`${testId}-${f.name}`} message={state.fieldErrors?.[f.name]} />
        </div>
      ))}
      {state.error && <p className="error-msg text-sm" role="alert">{state.error}</p>}
      <div className="flex gap-2">
        <button className="btn-primary text-sm py-1.5 px-4" disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>
        <button type="button" onClick={() => setEditing(false)} className="btn-secondary text-sm py-1.5 px-4">Cancel</button>
      </div>
    </form>
  )
}

/** "· edited" marker with the edit time on hover. */
export function EditedMark({ at }: { at?: string | null }) {
  if (!at) return null
  return <span className="text-text-muted" title={`Edited ${new Date(at).toLocaleString('en-GB')}`} data-testid="edited"> · edited</span>
}
