import 'server-only'
import { ImageResponse } from 'next/og'
import { snippet } from '@/lib/share-meta'

/** 1200×630 branded share card (same dark-green bar look as the meme card). Text only; no user-supplied images. */
export function ogCard({ kicker, title, body, footer }: { kicker: string; title: string; body?: string | null; footer: string }) {
  const t = snippet(title, 110)
  const b = body ? snippet(body, 160) : null
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 64,
        background: '#0F2A22', color: '#F3EAD3', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: 40, color: '#F3EAD3', fontFamily: 'serif' }}>Social Sips</div>
          <div style={{ display: 'flex', fontSize: 28, color: '#ADA48A', textTransform: 'uppercase', letterSpacing: 4 }}>{kicker}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: t.length > 60 ? 56 : 76, fontWeight: 700, lineHeight: 1.15, color: '#F3EAD3' }}>{t}</div>
          {b && <div style={{ display: 'flex', fontSize: 32, lineHeight: 1.3, color: '#D2C8AE', marginTop: 24 }}>{b}</div>}
        </div>
        <div style={{ display: 'flex', fontSize: 28, color: '#ADA48A' }}>{footer}</div>
      </div>
    ),
    { width: 1200, height: 630, headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' } },
  )
}
