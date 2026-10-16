'use client'
import { useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

/** Memoised browser Supabase client (null when env isn't configured). */
export function useSupabase() {
  return useMemo(() => createClient(), [])
}
