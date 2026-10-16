'use client'
import { useState } from 'react'

type Row = { amount: string; item: string }

/** Dynamic ingredient list → posts ingredientAmount[] / ingredientItem[] pairs. */
export default function IngredientRows({ initial = [] }: { initial?: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initial.length ? initial : [{ amount: '', item: '' }])
  return (
    <fieldset className="space-y-2">
      <legend className="label mb-2">Ingredients</legend>
      {rows.map((r, i) => (
        <div key={i} className="flex gap-2">
          <input name="ingredientAmount" defaultValue={r.amount} placeholder="50ml" className="input w-28" aria-label={`Amount ${i + 1}`} />
          <input name="ingredientItem" defaultValue={r.item} placeholder="Gin" className="input flex-1" aria-label={`Ingredient ${i + 1}`} required={i === 0} />
          {rows.length > 1 && (
            <button type="button" className="btn-icon" aria-label="Remove ingredient" onClick={() => setRows(rows.filter((_, j) => j !== i))}>✕</button>
          )}
        </div>
      ))}
      {rows.length < 20 && (
        <button type="button" className="btn-ghost text-sm" onClick={() => setRows([...rows, { amount: '', item: '' }])}>+ Add ingredient</button>
      )}
    </fieldset>
  )
}
