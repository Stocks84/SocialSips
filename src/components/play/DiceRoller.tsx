'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Die from './Die'
import { rollDie } from '@/lib/play/random'
import { compareMexican, scoreMexican, type MexicanScore } from '@/lib/play/mexican'

const ROLL_MS = 450
const SHAKE_THRESHOLD = 22 // m/s² change between motion samples that counts as a shake
const SHAKE_COOLDOWN_MS = 1200

type MotionPermission = { requestPermission?: () => Promise<'granted' | 'denied'> }

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function DiceRoller() {
  const [count, setCount] = useState(2)
  const [mexican, setMexican] = useState(false)
  const [values, setValues] = useState<number[]>([])
  const [rolling, setRolling] = useState(false)
  const [score, setScore] = useState<MexicanScore | null>(null)
  const [lastScore, setLastScore] = useState<MexicanScore | null>(null)
  const [shakeSupported, setShakeSupported] = useState(false)
  const [shakeOn, setShakeOn] = useState(false)
  const [shakeError, setShakeError] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rollingRef = useRef(false)
  const scoreRef = useRef<MexicanScore | null>(null)

  const diceCount = mexican ? 2 : count

  const roll = useCallback(() => {
    if (rollingRef.current) return
    const next = Array.from({ length: diceCount }, rollDie)
    const finish = () => {
      rollingRef.current = false
      setRolling(false)
      setValues(next)
      if (mexican) {
        const s = scoreMexican(next[0], next[1])
        setLastScore(scoreRef.current)
        scoreRef.current = s
        setScore(s)
        if (s.kind === 'mexican') navigator.vibrate?.([120, 60, 120, 60, 240])
      }
    }
    if (prefersReducedMotion()) return finish()
    rollingRef.current = true
    setRolling(true)
    timer.current = setTimeout(finish, ROLL_MS)
  }, [diceCount, mexican])

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  // Shake-to-roll: only offered on touch devices that expose DeviceMotion.
  useEffect(() => {
    setShakeSupported('DeviceMotionEvent' in window && window.matchMedia('(pointer: coarse)').matches)
  }, [])

  const rollRef = useRef(roll)
  useEffect(() => { rollRef.current = roll }, [roll])

  useEffect(() => {
    if (!shakeOn) return
    let prev: { x: number; y: number; z: number } | null = null
    let lastShake = 0
    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity
      if (!a || a.x == null || a.y == null || a.z == null) return
      const cur = { x: a.x, y: a.y, z: a.z }
      if (prev) {
        const delta = Math.abs(cur.x - prev.x) + Math.abs(cur.y - prev.y) + Math.abs(cur.z - prev.z)
        const now = Date.now()
        if (delta > SHAKE_THRESHOLD && now - lastShake > SHAKE_COOLDOWN_MS) {
          lastShake = now
          rollRef.current()
        }
      }
      prev = cur
    }
    window.addEventListener('devicemotion', onMotion)
    return () => window.removeEventListener('devicemotion', onMotion)
  }, [shakeOn])

  const toggleShake = async () => {
    setShakeError('')
    if (shakeOn) return setShakeOn(false)
    const DME = window.DeviceMotionEvent as unknown as MotionPermission
    if (typeof DME.requestPermission === 'function') {
      try {
        const res = await DME.requestPermission() // iOS: must be called from a tap
        if (res !== 'granted') return setShakeError('Motion access was declined. You can still tap to roll.')
      } catch {
        return setShakeError('Motion access isn’t available here. You can still tap to roll.')
      }
    }
    setShakeOn(true)
  }

  const changeMode = (on: boolean) => {
    setMexican(on)
    setValues([])
    setScore(null)
    setLastScore(null)
    scoreRef.current = null
  }

  const changeCount = (n: number) => {
    setCount(n)
    setValues([])
  }

  const total = values.reduce((a, b) => a + b, 0)
  const showMexican = mexican && score && values.length === 2
  const vsLast = showMexican && lastScore ? compareMexican(score, lastScore) : null

  let announcement = ''
  if (values.length && !rolling) {
    if (showMexican) {
      announcement = score.kind === 'mexican'
        ? `Mexican! You rolled 2 and 1, the best roll there is.`
        : `You rolled ${values.join(' and ')}: ${score.label}${score.kind === 'double' ? ` (${score.value})` : ''}. Rank ${score.rank} of 21.`
    } else {
      announcement = values.length === 1 ? `You rolled ${values[0]}.` : `You rolled ${values.join(', ')}. Total ${total}.`
    }
  }

  return (
    <div className="space-y-6">
      {/* Dice + roll */}
      <div className="card-glass p-6 flex flex-col items-center gap-6">
        <div className="flex flex-wrap justify-center gap-4 min-h-24" data-testid="dice" data-values={values.join(',')}>
          {(values.length ? values : Array.from({ length: diceCount }, () => 0)).map((v, i) =>
            v ? (
              <Die key={i} value={v} rolling={rolling} highlight={Boolean(showMexican && score.kind !== 'mixed')} />
            ) : (
              <div key={i} aria-hidden="true" className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-dashed border-border flex items-center justify-center text-3xl ${rolling ? 'animate-dice-shake' : ''}`}>🎲</div>
            ),
          )}
        </div>

        <div aria-live="polite" aria-atomic="true" className="text-center min-h-16" data-testid="dice-result">
          {values.length > 0 && !rolling && (
            showMexican ? (
              <div className="animate-slide-up">
                {score.kind === 'mexican' ? (
                  <p className="text-4xl sm:text-5xl font-black gradient-text-warm mexican-celebrate">🎉 Mexican! 🎉</p>
                ) : (
                  <p className="text-4xl sm:text-5xl font-black gradient-text">{score.value}</p>
                )}
                <p className="text-text-secondary text-sm mt-1">
                  {score.kind === 'mexican' ? 'The best roll there is. Beats everything.' : score.kind === 'double' ? `${score.label}. Beats every mixed roll.` : 'Mixed roll, higher die first.'}
                  {' '}<span className="badge badge-purple ml-1">Rank {score.rank} of 21</span>
                </p>
                {vsLast !== null && lastScore && (
                  <p className="text-text-muted text-xs mt-2">
                    {vsLast > 0 ? 'Beats' : vsLast < 0 ? 'Loses to' : 'Ties with'} the last roll ({lastScore.kind === 'mexican' ? 'Mexican' : lastScore.value})
                  </p>
                )}
              </div>
            ) : (
              <div className="animate-slide-up">
                <p className="text-4xl font-black gradient-text">{values.length === 1 ? values[0] : total}</p>
                {values.length > 1 && <p className="text-text-secondary text-sm">Total of {values.join(' + ')}</p>}
              </div>
            )
          )}
          <span className="sr-only">{announcement}</span>
        </div>

        <button type="button" onClick={roll} disabled={rolling} className="btn-primary w-full max-w-xs py-5 text-lg" data-testid="roll">
          {rolling ? 'Rolling…' : values.length ? '🎲 Roll again' : '🎲 Roll'}
        </button>

        {shakeSupported && (
          <div className="text-center">
            <button type="button" onClick={toggleShake} aria-pressed={shakeOn} className="btn-ghost text-sm">
              📳 {shakeOn ? 'Shake to roll: on' : 'Turn on shake to roll'}
            </button>
            {shakeError && <p className="error-msg mt-1">{shakeError}</p>}
          </div>
        )}
      </div>

      {/* Mode + dice count */}
      <div className="card p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold">Mexican mode</p>
            <p className="text-text-secondary text-xs">Two dice, read high-low. 21 is top.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={mexican}
            aria-label="Mexican mode"
            onClick={() => changeMode(!mexican)}
            className={`relative w-14 h-8 rounded-full transition-smooth border ${mexican ? 'bg-accent-purple border-accent-purple' : 'bg-surface-hover border-border'}`}
          >
            <span className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-smooth ${mexican ? 'translate-x-6' : ''}`} />
          </button>
        </div>
        <div>
          <p className="label" id="dice-count-label">Number of dice</p>
          <div className="grid grid-cols-6 gap-2" role="group" aria-labelledby="dice-count-label">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={diceCount === n}
                disabled={mexican}
                onClick={() => changeCount(n)}
                className={`py-2 rounded-xl font-bold border transition-smooth disabled:opacity-40 disabled:cursor-not-allowed ${diceCount === n ? 'bg-accent-purple/20 border-accent-purple text-text-primary' : 'border-border text-text-secondary hover:text-text-primary'}`}
              >
                {n}
              </button>
            ))}
          </div>
          {mexican && <p className="text-text-muted text-xs mt-2">Mexican always uses 2 dice.</p>}
        </div>
      </div>

      {mexican && <MexicanRules />}
    </div>
  )
}

function MexicanRules() {
  return (
    <details className="card p-4 text-sm" open>
      <summary className="font-semibold cursor-pointer">How Mexican scoring works</summary>
      <ul className="mt-3 space-y-2 text-text-secondary list-disc pl-5">
        <li>Roll two dice and read the <strong className="text-text-primary">higher die first</strong>: 3 and 1 is 31, 6 and 4 is 64.</li>
        <li>Mixed rolls rank by that number, so <strong className="text-text-primary">31 is the lowest</strong> and 65 the highest.</li>
        <li><strong className="text-text-primary">Doubles beat every mixed roll</strong>: 11 &lt; 22 &lt; 33 &lt; 44 &lt; 55 &lt; 66.</li>
        <li><strong className="text-text-primary">21 is Mexican</strong>, the best roll of all.</li>
      </ul>
      <p className="mt-3 text-text-secondary">
        <strong className="text-text-primary">Common ways to play:</strong> everyone rolls once and the lowest roll drinks (a Mexican often doubles it), or
        play it as a bluffing game (Mäxchen): roll in secret, announce a score that beats the last one, true or not, and the next player either believes you or calls the bluff.
      </p>
      <p className="mt-2 text-text-muted text-xs">Lots of house variants exist (how many rolls you get, what a Mexican costs, special rolls), so agree the rules before you start.</p>
      <p className="mt-1 text-text-muted text-xs">Ranking, best first: 21 · 66 · 55 · 44 · 33 · 22 · 11 · 65 · 64 · 63 · 62 · 61 · 54 · 53 · 52 · 51 · 43 · 42 · 41 · 32 · 31</p>
    </details>
  )
}
