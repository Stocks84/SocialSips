'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { gameSchema, splitList, variationSchema } from '@/lib/validators/game'
import { commentSchema, ratingSchema } from '@/lib/validators/comment'

export type FormState = { error?: string }

const MAX_IMAGE_BYTES = 4 * 1024 * 1024
const IMAGE_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }

/** Signed-in Supabase client + user, or an error. All writes go through RLS as this user. */
async function requireUser() {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured.' } as const
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Please sign in first.' } as const
  return { supabase, user } as const
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'game'

export async function createGame(_prev: FormState, formData: FormData): Promise<FormState> {
  const auth = await requireUser()
  if ('error' in auth) return { error: auth.error }
  const { supabase, user } = auth

  const parsed = gameSchema.safeParse({
    title: String(formData.get('title') ?? '').trim(),
    summary: String(formData.get('summary') ?? '').trim(),
    rules: String(formData.get('rules') ?? '').trim(),
    equipment: splitList(formData.get('equipment')),
    minPlayers: formData.get('minPlayers') || 2,
    maxPlayers: formData.get('maxPlayers') || undefined,
    hangoverRating: formData.get('hangoverRating'),
    tags: splitList(formData.get('tags'), true),
  })
  if (!parsed.success) {
    const i = parsed.error.issues[0]
    return { error: i ? `${String(i.path[0] ?? 'Form')}: ${i.message}` : 'Check the form' }
  }
  const g = parsed.data

  // Optional cover image → game-covers/<user_id>/<random>.<ext> (storage RLS checks the folder)
  let coverUrl: string | null = null
  const file = formData.get('cover')
  if (file instanceof File && file.size > 0) {
    const ext = IMAGE_TYPES[file.type]
    if (!ext) return { error: 'Cover must be a JPG, PNG, WebP or GIF' }
    if (file.size > MAX_IMAGE_BYTES) return { error: 'Cover image must be under 4 MB' }
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from('game-covers').upload(path, file, { contentType: file.type })
    if (error) return { error: `Image upload failed: ${error.message}` }
    coverUrl = supabase.storage.from('game-covers').getPublicUrl(path).data.publicUrl
  }

  const { data, error } = await supabase
    .from('games')
    .insert({
      author_id: user.id,
      title: g.title,
      slug: `${slugify(g.title)}-${crypto.randomUUID().slice(0, 6)}`,
      summary: g.summary,
      rules: g.rules,
      equipment: g.equipment,
      min_players: g.minPlayers,
      max_players: g.maxPlayers ?? null,
      hangover_rating: g.hangoverRating,
      tags: g.tags,
      cover_image_url: coverUrl,
    })
    .select('id')
    .single()
  if (error) return { error: error.message }

  revalidatePath('/feed')
  redirect(`/games/${data.id}`)
}

export async function addComment(_prev: FormState, formData: FormData): Promise<FormState> {
  const auth = await requireUser()
  if ('error' in auth) return { error: auth.error }
  const gameId = String(formData.get('gameId'))
  const parsed = commentSchema.safeParse({ body: String(formData.get('body') ?? '').trim() })
  if (!parsed.success) return { error: 'Write something first (max 1000 characters)' }
  const { error } = await auth.supabase.from('comments').insert({ author_id: auth.user.id, game_id: gameId, body: parsed.data.body })
  if (error) return { error: error.message }
  revalidatePath(`/games/${gameId}`)
  return {}
}

export async function deleteComment(formData: FormData) {
  const auth = await requireUser()
  if ('error' in auth) return
  const gameId = String(formData.get('gameId'))
  // RLS only allows deleting your own; the author filter is belt and braces.
  await auth.supabase.from('comments').delete().eq('id', String(formData.get('commentId'))).eq('author_id', auth.user.id)
  revalidatePath(`/games/${gameId}`)
}

export async function rateGame(formData: FormData) {
  const auth = await requireUser()
  if ('error' in auth) return
  const gameId = String(formData.get('gameId'))
  const parsed = ratingSchema.safeParse({ score: formData.get('score') })
  if (!parsed.success) return
  await auth.supabase
    .from('ratings')
    .upsert({ user_id: auth.user.id, game_id: gameId, score: parsed.data.score }, { onConflict: 'user_id,game_id' })
  revalidatePath(`/games/${gameId}`)
}

export async function addVariation(_prev: FormState, formData: FormData): Promise<FormState> {
  const auth = await requireUser()
  if ('error' in auth) return { error: auth.error }
  const gameId = String(formData.get('gameId'))
  const parsed = variationSchema.safeParse({
    title: String(formData.get('title') ?? '').trim(),
    rules: String(formData.get('rules') ?? '').trim(),
  })
  if (!parsed.success) return { error: 'Give your variation a name (3+ chars) and rules (10+ chars)' }
  const { error } = await auth.supabase.from('game_variations').insert({ game_id: gameId, author_id: auth.user.id, ...parsed.data })
  if (error) return { error: error.message }
  revalidatePath(`/games/${gameId}`)
  return {}
}

export async function deleteVariation(formData: FormData) {
  const auth = await requireUser()
  if ('error' in auth) return
  const gameId = String(formData.get('gameId'))
  await auth.supabase.from('game_variations').delete().eq('id', String(formData.get('variationId'))).eq('author_id', auth.user.id)
  revalidatePath(`/games/${gameId}`)
}
