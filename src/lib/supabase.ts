import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const DEFAULT_URL = 'https://stcjwprffdsojfeogfnx.supabase.co'

let cached: SupabaseClient | null | undefined

export function supabaseUrl(): string {
  return (import.meta.env.VITE_SUPABASE_URL || DEFAULT_URL).trim()
}

export function supabaseAnonKey(): string {
  return (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && supabaseAnonKey())
}

/** Browser client for swadcost_* tables. Null when the anon key is not baked in. */
export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached
  const url = supabaseUrl()
  const key = supabaseAnonKey()
  if (!url || !key) {
    cached = null
    return cached
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cached
}

export function __resetSupabaseClientForTests(): void {
  cached = undefined
}
