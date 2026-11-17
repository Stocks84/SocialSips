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

/**
 * Admin page metadata. Non-admins get a 404 from the page, so they must not see an admin title in the tab:
 * return nothing and the site's normal title (the same one any other 404 gets) is used.
 */
export function adminMetadata(title: string, isAdmin: boolean): Metadata {
  return isAdmin ? { title, robots: { index: false } } : {}
}

/** Only these fields are ever passed in, so a private column (date_of_birth, id, avatar path) cannot reach metadata. */
export type ProfileMetaInput = { username: string; display_name: string | null; bio: string | null }

/** Tab title + description for /profile/[username]. The site template adds " | Social Sips". Unknown profile = {} (the normal 404 title). */
export function profileMetadata(profile: ProfileMetaInput | null): Metadata {
  if (!profile) return {}
  const handle = `@${profile.username}`
  const name = snippet(profile.display_name, 60) || handle
  const bio = snippet(profile.bio, 160)
  return {
    title: name,
    description: bio || `Drinking games, cocktails and memes shared by ${name} on Social Sips. 18+ only.`,
  }
}

/** A fixed title that only applies when the thing exists; a missing one gets {} (the normal 404 title). */
export const titleIfFound = (title: string, found: boolean): Metadata => (found ? { title } : {})
