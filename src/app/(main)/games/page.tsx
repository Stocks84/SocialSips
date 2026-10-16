import { redirect } from 'next/navigation'

/** /games is the PWA shortcut target; the feed is the games list. */
export default function GamesIndex() {
  redirect('/feed')
}
