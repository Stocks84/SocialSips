'use client'
import { useEffect, useRef, useState } from 'react'
import { shuffle } from '@/lib/play/random'
import {
  DEFAULT_RULES, FULL_DECK, HOUSE_RULES_KEY, MAX_TEXT, MAX_TITLE, RANK_NAMES, RANKS,
  parseHouseRules, type Card, type Rank, type Rules,
} from '@/lib/play/kingsCup'

const DECK_SIZE = FULL_DECK.length

const isCustom = (rules: Rules, rank: Rank) =>
  rules[rank].title !== DEFAULT_RULES[rank].title || rules[rank].text !== DEFAULT_RULES[rank].text

/** Effective rule: a blank field falls back to the default so a card never shows nothing. */
const ruleFor = (rules: Rules, rank: Rank) => ({
  title: rules[rank].title.trim() || DEFAULT_RULES[rank].title,
  text: rules[rank].text.trim() || DEFAULT_RULES[rank].text,
})

function saveRules(rules: Rules) {
  const overrides: Partial<Rules> = {}
  for (const r of RANKS) {
    const eff = ruleFor(rules, r)
    if (eff.title !== DEFAULT_RULES[r].title || eff.text !== DEFAULT_RULES[r].text) overrides[r] = eff
  }
  try {
    if (Object.keys(overrides).length) localStorage.setItem(HOUSE_RULES_KEY, JSON.stringify(overrides))
    else localStorage.removeItem(HOUSE_RULES_KEY)
  } catch {
    // Private mode / storage full: rules still work for this visit.
  }
}

export default function KingsCup() {
  const [deck, setDeck] = useState<Card[] | null>(null)
  const [drawn, setDrawn] = useState(0)
  const [rules, setRules] = useState<Rules>(DEFAULT_RULES)
  const [loaded, setLoaded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [finale, setFinale] = useState(false)
  const finaleBtn = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let saved: string | null = null
    try { saved = localStorage.getItem(HOUSE_RULES_KEY) } catch {}
    setRules({ ...DEFAULT_RULES, ...parseHouseRules(saved) })
    setLoaded(true)
  }, [])

  useEffect(() => { if (loaded) saveRules(rules) }, [rules, loaded])
  useEffect(() => { if (finale) finaleBtn.current?.focus() }, [finale])

  const current = deck && drawn > 0 ? deck[drawn - 1] : null
  const kings = deck ? deck.slice(0, drawn).filter((c) => c.rank === 'K').length : 0
  const left = DECK_SIZE - drawn
  const finished = drawn >= DECK_SIZE

  const draw = () => {
    if (finished) return
    const d = deck ?? shuffle(FULL_DECK)
    if (!deck) setDeck(d)
    const card = d[drawn]
    setDrawn(drawn + 1)
    if (card.rank === 'K' && kings === 3) {
      setFinale(true)
      navigator.vibrate?.([200, 100, 200, 100, 400])
    }
  }

  const newGame = () => {
    if (drawn > 0 && !finished && !window.confirm('Start a new game? The deck will be reshuffled.')) return
    setDeck(shuffle(FULL_DECK))
    setDrawn(0)
    setFinale(false)
  }

  const updateRule = (rank: Rank, field: 'title' | 'text', value: string) =>
    setRules((r) => ({ ...r, [rank]: { ...r[rank], [field]: value } }))
  const resetRule = (rank: Rank) => setRules((r) => ({ ...r, [rank]: DEFAULT_RULES[rank] }))
  const resetAll = () => {
    if (window.confirm('Reset every card to the classic rules?')) setRules(DEFAULT_RULES)
  }

  const rule = current ? ruleFor(rules, current.rank) : null
  const customCount = RANKS.filter((r) => isCustom(rules, r)).length

  return (
    <div className="space-y-6">
      {/* Counters */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-3 text-center">
          <p className="text-2xl font-black" data-testid="cards-left">{left}</p>
          <p className="text-text-secondary text-xs">cards left</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-2xl" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => <span key={i} className={i < kings ? '' : 'opacity-20 grayscale'}>👑</span>)}
          </p>
          <p className="text-text-secondary text-xs" data-testid="kings">{kings} of 4 Kings</p>
        </div>
      </div>

      {/* Card + rule */}
      <div className="card-glass p-6 flex flex-col items-center gap-5">
        <button
          type="button"
          onClick={draw}
          disabled={finished}
          data-testid="draw"
          aria-label={finished ? 'Deck finished' : current ? 'Draw the next card' : 'Draw the first card'}
          className="focus-visible:outline-4 focus-visible:outline-accent-cyan rounded-2xl"
        >
          {current ? (
            <PlayingCard key={current.id} card={current} />
          ) : (
            <div className="w-44 h-64 sm:w-52 sm:h-72 rounded-2xl border-2 border-accent-purple bg-gradient-to-br from-accent-purple/40 to-accent-pink/30 shadow-neon-purple flex flex-col items-center justify-center gap-2">
              <span className="text-5xl" aria-hidden="true">{finished ? '🎉' : '🂠'}</span>
              <span className="font-bold">{finished ? 'Deck finished' : 'Tap to draw'}</span>
            </div>
          )}
        </button>

        <div aria-live="polite" aria-atomic="true" className="text-center min-h-20 max-w-md" data-testid="rule">
          {current && rule ? (
            <div className="animate-slide-up">
              <h2 className="text-2xl font-black gradient-text">{rule.title}</h2>
              <p className="text-text-secondary mt-1">{rule.text}</p>
              {isCustom(rules, current.rank) && <span className="badge badge-cyan mt-2">House rule</span>}
              <span className="sr-only">{RANK_NAMES[current.rank]} of {current.suit.name}. {left} cards left.</span>
            </div>
          ) : (
            <p className="text-text-secondary">Put a cup in the middle and spread the cards around it, or just tap to draw.</p>
          )}
        </div>

        {finished ? (
          <div className="text-center space-y-3">
            <p className="font-bold">That’s all 52 cards 🎉</p>
            <button type="button" onClick={newGame} className="btn-primary py-4 px-8" data-testid="new-game">🔀 New game</button>
          </div>
        ) : (
          <div className="flex gap-3 w-full max-w-xs">
            <button type="button" onClick={draw} className="btn-primary flex-1 py-5 text-lg">🃏 {current ? 'Next card' : 'Draw'}</button>
            <button type="button" onClick={newGame} className="btn-secondary py-5" aria-label="New game (reshuffle)" data-testid="new-game">🔀</button>
          </div>
        )}
      </div>

      {/* House rules */}
      <section className="card p-4" aria-labelledby="house-rules-heading">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 id="house-rules-heading" className="font-semibold text-base">House rules</h2>
            <p className="text-text-secondary text-xs">{customCount ? `${customCount} card${customCount === 1 ? '' : 's'} changed. Saved on this device.` : 'Classic rules. Change any card; it saves on this device.'}</p>
          </div>
          <button type="button" onClick={() => setEditing(!editing)} aria-expanded={editing} aria-controls="house-rules-editor" className="btn-secondary text-sm" data-testid="edit-rules">
            {editing ? 'Done' : '✏️ Edit'}
          </button>
        </div>

        {editing && (
          <div id="house-rules-editor" className="mt-4 space-y-4">
            {RANKS.map((rank) => (
              <fieldset key={rank} className="border border-border rounded-xl p-3 space-y-2" data-rank={rank}>
                <legend className="px-1 text-sm font-bold">
                  {rank} <span className="text-text-secondary font-normal">({RANK_NAMES[rank]})</span>
                  {isCustom(rules, rank) && <span className="badge badge-cyan ml-2">Changed</span>}
                </legend>
                <label className="sr-only" htmlFor={`rule-title-${rank}`}>{RANK_NAMES[rank]} rule name</label>
                <input
                  id={`rule-title-${rank}`}
                  className="input"
                  value={rules[rank].title}
                  maxLength={MAX_TITLE}
                  placeholder={DEFAULT_RULES[rank].title}
                  onChange={(e) => updateRule(rank, 'title', e.target.value)}
                />
                <label className="sr-only" htmlFor={`rule-text-${rank}`}>{RANK_NAMES[rank]} rule</label>
                <textarea
                  id={`rule-text-${rank}`}
                  className="input min-h-20"
                  value={rules[rank].text}
                  maxLength={MAX_TEXT}
                  placeholder={DEFAULT_RULES[rank].text}
                  onChange={(e) => updateRule(rank, 'text', e.target.value)}
                />
                {isCustom(rules, rank) && (
                  <button type="button" onClick={() => resetRule(rank)} className="btn-ghost text-xs">↺ Back to classic</button>
                )}
              </fieldset>
            ))}
            <div className="flex justify-between items-center gap-3">
              <p className="text-text-muted text-xs">A blank field uses the classic rule.</p>
              <button type="button" onClick={resetAll} disabled={!customCount} className="btn-danger text-sm">Reset all</button>
            </div>
          </div>
        )}
      </section>

      <p className="text-text-muted text-xs text-center">Nobody has to drink to play. Soft drinks work just as well.</p>

      {finale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur p-6" role="alertdialog" aria-modal="true" aria-labelledby="finale-title" aria-describedby="finale-text">
          <div className="card-glass p-8 text-center max-w-sm kings-finale">
            <p className="text-7xl mb-3" aria-hidden="true">👑</p>
            <h2 id="finale-title" className="text-3xl font-black gradient-text-warm">The 4th King!</h2>
            <p id="finale-text" className="text-text-secondary mt-2">Whoever drew it drinks the Kings Cup. (Or a sip of something soft: nobody has to.)</p>
            <button ref={finaleBtn} type="button" onClick={() => setFinale(false)} className="btn-primary mt-6 py-4 px-8" data-testid="finale-close">Carry on</button>
          </div>
        </div>
      )}
    </div>
  )
}

function PlayingCard({ card }: { card: Card }) {
  const colour = card.suit.red ? 'text-rose-600' : 'text-slate-900'
  return (
    <div
      role="img"
      aria-label={`${RANK_NAMES[card.rank]} of ${card.suit.name}`}
      data-card={card.id}
      className={`relative w-44 h-64 sm:w-52 sm:h-72 rounded-2xl bg-white shadow-card-lg animate-card-flip ${colour}`}
    >
      <div className="absolute top-2 left-3 text-left leading-none font-black">
        <div className="text-2xl">{card.rank}</div>
        <div className="text-xl">{card.suit.symbol}</div>
      </div>
      <div className="absolute bottom-2 right-3 text-right leading-none font-black rotate-180">
        <div className="text-2xl">{card.rank}</div>
        <div className="text-xl">{card.suit.symbol}</div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-7xl sm:text-8xl">{card.rank === 'K' ? '👑' : card.suit.symbol}</span>
      </div>
    </div>
  )
}
