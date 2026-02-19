import { createBrowserClient } from '@supabase/ssr'
import { createClient as createJsClient, type SupabaseClient } from '@supabase/supabase-js'
import { Capacitor } from '@capacitor/core'

let nativeClient: SupabaseClient | null = null

export function createClient() {
  // On native (iOS/Android), use supabase-js directly with localStorage.
  // Cookies don't persist in Capacitor WebViews when the app goes to background
  // (e.g. during OAuth browser flow), which breaks PKCE code_verifier storage.
  // After OAuth succeeds, the session is synced to cookies in oauthNative.ts
  // so that plasmic-supabase's SupabaseUserGlobalContext (cookie-based) can find it.
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

/**
 * Sync a session to cookie storage so that plasmic-supabase's
 * SupabaseUserGlobalContext (which uses createBrowserClient / document.cookie)
 * can find the session established by the native localStorage-based client.
 */
export async function syncSessionToCookies(accessToken: string, refreshToken: string): Promise<void> {
  const browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { error } = await browserClient.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  })
  if (error) {
    console.warn('Failed to sync session to cookies:', error.message)
  }
}
