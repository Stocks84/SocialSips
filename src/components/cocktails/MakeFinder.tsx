'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { matchCocktails, PANTRY, parsePantry, type CocktailMatch, type MakeableCocktail } from '@/lib/pantry'

const STORAGE_KEY = 'ss-pantry'

/** Ingredient picker + results. Ticks are saved in this browser only (localStorage). */
export default function MakeFinder({ cocktails }: { cocktails: MakeableCocktail[] }) {
  const [have, setHave] = useState<Set<string>>(new Set())
  const [alcoholFree, setAlcoholFree] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let saved: string | null = null
    try { saved = localStorage.getItem(STORAGE_KEY) } catch {}
    setHave(new Set(parsePantry(saved)))
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      if (have.size) localStorage.setItem(STORAGE_KEY, JSON.stringify([...have]))
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Private mode / storage full: the picker still works for this visit.
    }
  }, [have, loaded])

  const toggle = (key: string) => setHave((s) => {
    const n = new Set(s)
    if (n.has(key)) n.delete(key)
    else n.add(key)
    return n
  })

  const pool = useMemo(() => (alcoholFree ? cocktails.filter((c) => c.is_alcohol_free) : cocktails), [cocktails, alcoholFree])
  const { canMake, nearMiss } = useMemo(() => matchCocktails(pool, have), [pool, have])

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <section className="card p-5 space-y-5 self-start" aria-labelledby="bar-title" data-testid="pantry">
        <div className="flex items-center justify-between gap-3">
          <h2 id="bar-title" className="font-bold text-lg">Your bar <span className="text-ink-3 text-sm font-normal">({have.size})</span></h2>
          {have.size > 0 && (
            <button type="button" onClick={() => setHave(new Set())} className="text-xs text-ink-2 hover:text-ink" data-testid="pantry-clear">Clear all</button>
          )}
        </div>
        {PANTRY.map((g) => (
          <fieldset key={g.title}>
            <legend className="text-xs text-ink-3 mb-2">{g.title}</legend>
            <div className="flex flex-wrap gap-2">
              {g.items.map((i) => {
                const on = have.has(i.key)
                return (
                  <button
                    key={i.key}
                    type="button"
                    onClick={() => toggle(i.key)}
                    aria-pressed={on}
                    data-testid="pantry-item"
                    data-key={i.key}
                    className={`px-3 py-1.5 rounded-sm text-sm border transition-colors ${on ? 'border-accent bg-raised text-ink' : 'border-line text-ink-2 hover:border-accent'}`}
                  >
                    {on ? '✓ ' : ''}{i.label}
                  </button>
                )
              })}
            </div>
          </fieldset>
        ))}
        <label className="flex items-center gap-2 text-sm pt-1">
          <input type="checkbox" checked={alcoholFree} onChange={(e) => setAlcoholFree(e.target.checked)} className="accent-accent" data-testid="make-af" />
          Alcohol-free only
        </label>
        <p className="text-ink-3 text-xs">Saved on this device only. Ice and water are assumed.</p>
      </section>

      <div className="space-y-8" aria-live="polite">
        <section data-testid="can-make">
          <h2 className="text-xl font-bold mb-3">You can make <span className="text-ink-3 text-base font-normal">({canMake.length})</span></h2>
          {canMake.length ? (
            <ul className="grid gap-3 sm:grid-cols-2">{canMake.map((c) => <Result key={c.id} c={c} />)}</ul>
          ) : (
            <p className="text-ink-2 text-sm">{have.size ? 'Nothing complete yet. Check the near misses below' : 'Tick a few things from your bar to get started.'}</p>
          )}
        </section>
        <section data-testid="near-miss">
          <h2 className="text-xl font-bold mb-3">So close <span className="text-ink-3 text-base font-normal">(missing 1–2, {nearMiss.length})</span></h2>
          {nearMiss.length ? (
            <ul className="grid gap-3 sm:grid-cols-2">{nearMiss.map((c) => <Result key={c.id} c={c} />)}</ul>
          ) : (
            <p className="text-ink-2 text-sm">{have.size ? 'No near misses right now.' : 'Your near misses show up here.'}</p>
          )}
        </section>
      </div>
    </div>
  )
}

function Result({ c }: { c: CocktailMatch }) {
  return (
    <li>
      <Link href={`/cocktails/${c.id}`} className="card hover:bg-raised p-4 block h-full" data-testid="make-result">
        <h3 className="font-bold text-accent">{c.name}</h3>
        <p className="text-ink-2 text-xs mt-1 line-clamp-2">{c.description}</p>
        <div className="flex flex-wrap items-center gap-1.5 mt-3 text-xs">
          {c.is_alcohol_free && <span className="chip">Alcohol-free</span>}
          {c.missing.length === 0 ? (
            <span className="text-ink-3">All {c.needed} ingredients ✓</span>
          ) : (
            <>
              <span className="text-ink-3">Missing:</span>
              {c.missing.map((m) => <span key={m} className="chip" data-testid="missing">{m}</span>)}
            </>
          )}
        </div>
      </Link>
    </li>
  )
}
