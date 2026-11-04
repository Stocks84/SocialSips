import { notFound } from 'next/navigation'
import { getProfileByUsername } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'

/**
 * Checks the username exists before loading.tsx's Suspense boundary starts streaming.
 * notFound() in the page itself runs inside that boundary, after the 200 headers are sent,
 * so unknown profiles came back as "soft" 404s. Here it runs in the shell, so the status is a real 404.
 * getProfileByUsername is wrapped in React cache(), so the page reuses this lookup.
 */
export default async function ProfileLayout({ children, params }: { children: React.ReactNode; params: Promise<{ username: string }> }) {
  const { username } = await params
  let name = username
  try { name = decodeURIComponent(username) } catch { /* already decoded */ }
  if (await createClient()) {
    const profile = await getProfileByUsername(name)
    if (!profile) notFound()
  }
  return children
}
