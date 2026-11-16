import type { Metadata } from 'next'

/** Collapse whitespace and cut to `max` characters (with an ellipsis). */
export const snippet = (s: string | null | undefined, max: number) => {
  const t = (s ?? '').replace(/\s+/g, ' ').trim()
  return t.length > max ? `${t.slice(0, max - 1)}…` : t
}

/** What a missing or hidden item gets: nothing about the item, and no indexing. */
export const NOT_FOUND_META: Metadata = { title: 'Not found', robots: { index: false } }

export type ShareInput = {
  origin: string
  path: string
  title: string
  description: string
  /** Absolute URL of the share image. */
  image: string
  type?: 'article' | 'website'
}

/** Open Graph + Twitter card + canonical for a detail page. `origin` must be the trusted site origin, never a request Host. */
export function buildShareMetadata({ origin, path, title, description, image, type = 'article' }: ShareInput): Metadata {
  const url = `${origin}${path}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type, siteName: 'Social Sips', title, description, url, images: [{ url: image, width: 1200, height: 630, alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}
