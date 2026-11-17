import type { Metadata } from 'next'
import PeopleList from '@/components/social/PeopleList'
import { getProfileByUsername } from '@/lib/queries/profile'
import { titleIfFound } from '@/lib/share-meta'

/** An unknown username is a 404, so it gets the normal 404 title rather than "Followers". */
export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params
  let name = username
  try { name = decodeURIComponent(username) } catch { /* already decoded */ }
  return titleIfFound('Followers', Boolean(await getProfileByUsername(name)))
}

export default async function Page({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return <PeopleList username={username} which="followers" />
}
