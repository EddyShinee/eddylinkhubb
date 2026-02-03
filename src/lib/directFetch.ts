// Direct fetch helper to bypass Supabase JS client issues

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export interface FetchOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  accessToken?: string
}

export async function directFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const headers: Record<string, string> = {
      'apikey': SUPABASE_KEY,
      'Content-Type': 'application/json',
    }

    if (options.method === 'POST') {
      headers['Prefer'] = 'return=representation'
    } else if (options.method === 'PATCH' || options.method === 'DELETE') {
      headers['Prefer'] = 'return=minimal'
    }

    if (options.accessToken) {
      headers['Authorization'] = `Bearer ${options.accessToken}`
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    // For DELETE or PATCH with no content
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return { data: null, error: null }
    }

    const data = await response.json()
    return { data, error: null }
  } catch (err) {
    console.error('directFetch error:', err)
    return { data: null, error: err as Error }
  }
}
