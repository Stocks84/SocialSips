export const SUITS = [
  { id: 'S', symbol: '♠', name: 'Spades', red: false },
  { id: 'H', symbol: '♥', name: 'Hearts', red: true },
  { id: 'D', symbol: '♦', name: 'Diamonds', red: true },
  { id: 'C', symbol: '♣', name: 'Clubs', red: false },
] as const

export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const
export type Rank = (typeof RANKS)[number]

export const RANK_NAMES: Record<Rank, string> = {
  A: 'Ace', 2: 'Two', 3: 'Three', 4: 'Four', 5: 'Five', 6: 'Six', 7: 'Seven',
  8: 'Eight', 9: 'Nine', 10: 'Ten', J: 'Jack', Q: 'Queen', K: 'King',
}

export type Rule = { title: string; text: string }
export type Rules = Record<Rank, Rule>

export const DEFAULT_RULES: Rules = {
  A: { title: 'Waterfall', text: 'Everyone starts drinking. The person who drew can stop whenever they like; everyone else can only stop once the person before them has stopped.' },
  2: { title: 'You', text: 'Pick someone to drink.' },
  3: { title: 'Me', text: 'You drink.' },
  4: { title: 'Floor', text: 'Everyone touches the floor. Last one down drinks.' },
  5: { title: 'Guys', text: 'All the guys drink.' },
  6: { title: 'Girls', text: 'All the girls drink.' },
  7: { title: 'Heaven', text: 'Everyone points to the sky. Last one to point drinks.' },
  8: { title: 'Mate', text: 'Pick a mate. They drink whenever you drink, until someone draws the next 8.' },
  9: { title: 'Rhyme', text: 'Say a word. Going round, everyone says a word that rhymes. First to repeat or get stuck drinks.' },
  10: { title: 'Categories', text: 'Pick a category, like beers or footballers. Going round, everyone names one. First to repeat or get stuck drinks.' },
  J: { title: 'Make a rule', text: 'Make a rule everyone must follow for the rest of the game. Anyone who breaks it drinks.' },
  Q: { title: 'Question master', text: 'You are the question master until the next Queen. Anyone who answers one of your questions drinks.' },
  K: { title: 'Kings cup', text: 'Pour some of your drink into the cup in the middle. Whoever draws the 4th King drinks the Kings Cup.' },
}

export type Card = { id: string; rank: Rank; suit: (typeof SUITS)[number] }

/** A fresh, ordered 52-card deck. */
export const FULL_DECK: readonly Card[] = SUITS.flatMap((suit) => RANKS.map((rank) => ({ id: `${rank}${suit.id}`, rank, suit })))

export const HOUSE_RULES_KEY = 'ss-kings-cup-house-rules-v1'
export const MAX_TITLE = 40
export const MAX_TEXT = 280

/** Read saved house rules (only valid overrides are kept), merged over the defaults. */
export function parseHouseRules(raw: string | null): Partial<Rules> {
  if (!raw) return {}
  try {
    const data: unknown = JSON.parse(raw)
    if (!data || typeof data !== 'object') return {}
    const out: Partial<Rules> = {}
    for (const rank of RANKS) {
      const r = (data as Record<string, unknown>)[rank]
      if (r && typeof r === 'object') {
        const { title, text } = r as Record<string, unknown>
        if (typeof title === 'string' && typeof text === 'string' && title.trim() && text.trim()) {
          out[rank] = { title: title.slice(0, MAX_TITLE), text: text.slice(0, MAX_TEXT) }
        }
      }
    }
    return out
  } catch {
    return {}
  }
}
