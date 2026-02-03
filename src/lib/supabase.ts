import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key exists:', !!supabaseAnonKey)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables are not set!')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 2,
      },
    },
    db: {
      schema: 'public',
    },
  }
)

// Test function to check connectivity
export const testConnection = async () => {
  console.log('Testing Supabase connection...')
  const start = Date.now()
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey || '',
      },
    })
    console.log('Connection test result:', response.status, 'in', Date.now() - start, 'ms')
    return response.ok || response.status === 401 // 401 is expected without auth
  } catch (error) {
    console.error('Connection test failed:', error)
    return false
  }
}
