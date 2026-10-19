'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireAdmin, UUID } from '@/lib/server/auth'
import { friendlyError } from '@/lib/server/errors'

const schema = z.object({
  startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  theme: z.string().trim().min(3, 'Theme: 3–80 characters').max(80, 'Theme: 3–80 characters'),
  kind: z.enum(['meme', 'cocktail_variation']),
  description: z.string().trim().max(500, 'Description: max 500 characters'),
})
const done = (err?: string) => { revalidatePath('/admin/challenges'); revalidatePath('/challenge', 'layout'); redirect(err ? `/admin/challenges?error=${encodeURIComponent(err)}` : '/admin/challenges?saved=1') }

/** Schedule (or replace) a future week's challenge. RLS: admins only, future weeks only. */
export async function scheduleChallenge(formData: FormData) {
  const auth = await requireAdmin()
  if ('error' in auth) return
  const p = schema.safeParse({ startsOn: formData.get('startsOn'), theme: formData.get('theme'), kind: formData.get('kind'), description: formData.get('description') ?? '' })
  if (!p.success) done(p.error.issues[0]?.message ?? 'Check the form')
  const v = p.data!
  const { data: existing } = await auth.supabase.from('challenges').select('id').eq('starts_on', v.startsOn).maybeSingle()
  const row = { theme: v.theme, kind: v.kind, description: v.description || null }
  const { error } = existing
    ? await auth.supabase.from('challenges').update(row).eq('id', existing.id)
    : await auth.supabase.from('challenges').insert({ starts_on: v.startsOn, ...row })
  if (error) done(error.code === '42501' ? 'Only future weeks can be scheduled.' : friendlyError(error, 'schedule challenge'))
  done()
}

export async function deleteChallenge(formData: FormData) {
  const auth = await requireAdmin()
  if ('error' in auth) return
  const id = String(formData.get('id') ?? '')
  if (!UUID.test(id)) done()
  const { error } = await auth.supabase.from('challenges').delete().eq('id', id)
  done(error ? friendlyError(error, 'delete challenge') : undefined)
}
