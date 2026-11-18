'use client'

export type IngredientRow = { amount: string; item: string }

/** Dynamic ingredient list → posts ingredientAmount[] / ingredientItem[] pairs. */
export default function IngredientRows({ rows, onChange }: { rows: IngredientRow[]; onChange: (rows: IngredientRow[]) => void }) {
  const list = rows.length ? rows : [{ amount: '', item: '' }]
  const set = (i: number, patch: Partial<IngredientRow>) => onChange(list.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  return (
    <fieldset className="space-y-2">
      <legend className="label mb-2">Ingredients</legend>
      {list.map((r, i) => (
        <div key={i} className="flex gap-2">
          <input name="ingredientAmount" value={r.amount} onChange={(e) => set(i, { amount: e.target.value })} placeholder="50ml" className="input w-28" aria-label={`Amount ${i + 1}`} maxLength={40} />
          <input name="ingredientItem" value={r.item} onChange={(e) => set(i, { item: e.target.value })} placeholder="Gin" className="input flex-1" aria-label={`Ingredient ${i + 1}`} required={i === 0} maxLength={80} />
          {list.length > 1 && (
            <button type="button" className="btn-icon" aria-label="Remove ingredient" onClick={() => onChange(list.filter((_, j) => j !== i))}>✕</button>
          )}
        </div>
      ))}
      {list.length < 20 && (
        <button type="button" className="btn-ghost text-sm" onClick={() => onChange([...list, { amount: '', item: '' }])}>+ Add ingredient</button>
      )}
    </fieldset>
  )
}
