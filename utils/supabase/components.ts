import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
      },
      global: {
        fetch: fetch,
      },
    }
  )

  return supabase
}