import { ImageResponse } from 'next/og'
import { getMeme } from '@/lib/queries/memes'
import { snippet } from '@/lib/server/share'

/** 1200×630 share image for memes without a picture: the joke on the Social Sips background. Hidden/missing → 404. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getMeme(id, null) // anonymous view: hidden memes are never previewed
  if (!data) return new Response('Not found', { status: 404 })
  const m = data.meme
  const text = snippet(m.joke_text ?? m.caption ?? 'A meme on Social Sips', 220)
  const caption = m.joke_text && m.caption ? snippet(m.caption, 80) : null
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 64,
        background: 'radial-gradient(ellipse at top, rgba(168,85,247,0.35) 0%, #0F172A 65%)', color: '#F8FAFC', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', fontSize: 40, fontWeight: 800, color: '#C4B5FD' }}>🍻 Social Sips</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {caption && <div style={{ display: 'flex', fontSize: 36, color: '#67E8F9', marginBottom: 16 }}>{caption}</div>}
          <div style={{ display: 'flex', fontSize: text.length > 120 ? 44 : 60, fontWeight: 700, lineHeight: 1.2, color: '#F9A8D4' }}>{text}</div>
        </div>
        <div style={{ display: 'flex', fontSize: 28, color: '#94A3B8' }}>😂 Jokes &amp; Memes · 18+</div>
      </div>
    ),
    { width: 1200, height: 630, headers: { 'Cache-Control': 'public, max-age=3600' } },
  )
}
