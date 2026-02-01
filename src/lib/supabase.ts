import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Create a dummy client if not configured (demo mode will handle this)
const isConfigured = supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'your-project-url' && 
  supabaseAnonKey !== 'your-anon-key'

let supabase: SupabaseClient

if (isConfigured) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  })
} else {
  // Create a minimal dummy client for demo mode
  // The service layer will catch errors and switch to demo mode
  supabase = createClient(
    'https://placeholder.supabase.co',
    'placeholder-key',
    {
      auth: {
        persistSession: false
      }
    }
  )
  console.log('⚠️ Supabase not configured - demo mode will be used')
}

export { supabase }
export const isSupabaseConfigured = isConfigured
