import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { contrast } from './contrast.ts'

const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')
const token = (name: string) => {
  const m = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`))
  assert.ok(m, `token --color-${name} not found`)
  return m[1]
}

// Every surface text can sit on, including the card hover fill (raised).
const SURFACES = ['bg', 'surface', 'raised']
const TEXT = ['ink', 'ink-2', 'ink-3', 'accent', 'hangover-none', 'hangover-mild', 'hangover-heavy', 'danger', 'success']

describe('design tokens meet WCAG AA (4.5:1) for normal text', () => {
  for (const s of SURFACES) for (const t of TEXT) {
    it(`${t} on ${s}`, () => assert.ok(contrast(token(t), token(s)) >= 4.5, `${t} on ${s} = ${contrast(token(t), token(s)).toFixed(2)}`))
  }
  it('on-accent on accent, accent-hover and accent-press', () => {
    for (const a of ['accent', 'accent-hover', 'accent-press']) assert.ok(contrast(token('on-accent'), token(a)) >= 4.5, a)
  })
  it('on-danger on danger-fill and danger-fill-hover', () => {
    for (const a of ['danger-fill', 'danger-fill-hover']) assert.ok(contrast(token('on-danger'), token(a)) >= 4.5, a)
  })
})
