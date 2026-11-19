import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { wordingFlag, wordingFlagTexts } from './wording-flag.ts'

describe('wordingFlag', () => {
  it('flags drink-until-you-pass-out wording, including spelling variants', () => {
    assert.equal(wordingFlag('Drink until you pass out.')?.id, 'pass-out')
    assert.equal(wordingFlag('chug till you pass out')?.id, 'pass-out')
    assert.equal(wordingFlag("drink 'til you black out")?.id, 'pass-out')
    assert.equal(wordingFlag('Keep going until you pass out from drinking.')?.id, 'pass-out-from')
  })

  it('flags drink-until-sick and drink-until-you-drop', () => {
    assert.equal(wordingFlag('Drink until you puke.')?.id, 'drink-until-sick')
    assert.equal(wordingFlag('Chug until you throw up.')?.id, 'drink-until-sick')
    assert.equal(wordingFlag('Drink until you drop.')?.id, 'drink-til-drop')
  })

  it('flags hazing, drinking initiations, forced drinking and punishment chugs', () => {
    assert.equal(wordingFlag('This is a hazing dare.')?.id, 'hazing')
    assert.equal(wordingFlag('Haze them at the party.')?.id, 'hazing')
    assert.equal(wordingFlag('Drinking initiation ritual for new members.')?.id, 'initiation')
    assert.equal(wordingFlag('They were forced to drink.')?.id, 'forced-drink')
    assert.equal(wordingFlag('Force them to drink.')?.id, 'forced-drink')
    assert.equal(wordingFlag('Chug as punishment if you lose.')?.id, 'punishment-chug')
  })

  it('does not flag ordinary sip, drink or soft-drink wording', () => {
    const safe = [
      'Nobody has to drink. Soft drinks are fine. See Help',
      'Each player takes a sip — a soft drink is fine — then flips their cup.',
      'Pass the cup to the next player.',
      'Pass out the cards, then take a sip.',
      "Don't drink and drive.",
      'Please drink responsibly.',
      'A hazy IPA or a soft drink, your call.',
      'Take a shot of espresso if you like.',
      'Down the table, flip the cup, first team done wins.',
      'Until you pass the next player, wait your turn.',
      'Alcohol-free versions are always fine.',
      '18+ only. Please drink responsibly.',
    ]
    for (const text of safe) {
      assert.equal(wordingFlag(text), null, `false positive: ${text}`)
    }
  })

  it('returns null for empty input', () => {
    assert.equal(wordingFlag(null), null)
    assert.equal(wordingFlag(''), null)
    assert.equal(wordingFlag('   '), null)
  })

  it('scans several fields together and ignores curly quotes', () => {
    assert.equal(
      wordingFlagTexts(['Cosmic Cups', 'A fun flip-cup relay', 'Each player takes a sip. Soft drinks are fine.']),
      null,
    )
    const hit = wordingFlagTexts(['Weekly Dare', '“Drink until you pass out.”'])
    assert.equal(hit?.id, 'pass-out')
  })
})
