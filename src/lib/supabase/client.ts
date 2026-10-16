'use client'
import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseConfig } from './config'

/** Supabase client for Client Components. Returns null if env is not configured. */
export function createClient() {
  const cfg = getSupabaseConfig()
  if (!cfg) return null
  return createBrowserClient(cfg.url, cfg.anonKey)
}
