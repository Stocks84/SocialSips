'use client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { useSupabase } from './useSupabase'

/** Current signed-in Supabase user, kept in sync with auth changes. */
export function useUser() {
  const supabase = useSupabase()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(!!supabase)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => sub.subscription.unsubscribe()
  }, [supabase])

  return { user, loading }
}
