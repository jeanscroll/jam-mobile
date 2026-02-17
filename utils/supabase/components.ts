import { createBrowserClient } from '@supabase/ssr'
import { createClient as createJsClient, type SupabaseClient } from '@supabase/supabase-js'
import { Capacitor } from '@capacitor/core'

let nativeClient: SupabaseClient | null = null

export function createClient() {
  // On native (iOS/Android), use supabase-js directly with localStorage
  // because @supabase/ssr stores PKCE code_verifier in cookies,
  // which don't persist correctly in Capacitor WebViews
  if (Capacitor.isNativePlatform()) {
    if (!nativeClient) {
      nativeClient = createJsClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: true,
            detectSessionInUrl: false,
            flowType: 'pkce',
            storage: window.localStorage,
          },
        }
      )
    }
    return nativeClient
  }

  // On web, use SSR-compatible client with cookie storage
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
      global: {
        fetch: fetch,
      },
    }
  )
}