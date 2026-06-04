import { createBrowserClient, type CookieOptions } from "@supabase/ssr";
import { type SupabaseClient } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";
import { parse as parseCookie, serialize as serializeCookie } from "cookie";

let nativeClient: SupabaseClient | null = null;

// Réplique EXACTE de l'heuristique de plasmic-supabase (utils/supabase/component.js) :
// teste si document.cookie « tient ». Sur iOS (scheme capacitor://) les cookies ne
// persistent pas → false → on bascule sur localStorage, exactement comme plasmic.
function cookiesAvailable(): boolean {
  try {
    document.cookie = "studioEnv=false";
    const cookies = parseCookie(document.cookie);
    if (cookies["studioEnv"]) {
      document.cookie = "studioEnv=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Adaptateur de stockage IDENTIQUE à celui de plasmic-supabase : cookies si
// disponibles, sinon localStorage (cas iOS capacitor://). En l'utilisant pour le
// client natif, la session OAuth (signInWithIdToken / exchangeCodeForSession) est
// écrite DIRECTEMENT dans le format/clé que plasmic relit → plus besoin d'un pont
// `setSession` fragile, et l'email apparaît de façon fiable dans le profil.
function plasmicStorageCookies() {
  return {
    get: (key: string) => {
      if (cookiesAvailable()) {
        return parseCookie(document.cookie)[key];
      }
      return localStorage.getItem(key) ?? undefined;
    },
    set: (key: string, value: string, options: CookieOptions) => {
      if (cookiesAvailable()) {
        document.cookie = serializeCookie(key, value, options);
      } else {
        localStorage.setItem(key, value);
      }
    },
    remove: (key: string, options: CookieOptions) => {
      document.cookie = serializeCookie(key, "", options);
      localStorage.removeItem(key);
    },
  };
}

export function createClient() {
  // Sur natif (iOS/Android), on utilise le MÊME client/stockage que plasmic-supabase
  // (createBrowserClient + adaptateur cookies→localStorage). Avantages :
  // - le code_verifier PKCE et la session vivent en localStorage (persistent quand
  //   l'app passe en arrière-plan pendant le flux OAuth navigateur, contrairement
  //   aux cookies du scheme capacitor://) ;
  // - la session est écrite dans le format/clé que plasmic relit → l'utilisateur
  //   (email) est détecté de façon fiable après la redirection, sans pont externe.
  if (Capacitor.isNativePlatform()) {
    if (!nativeClient) {
      nativeClient = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: true,
            detectSessionInUrl: false,
            flowType: "pkce",
          },
          cookies: plasmicStorageCookies(),
        }
      ) as unknown as SupabaseClient;
    }
    return nativeClient;
  }

  // On web, use SSR-compatible client with cookie storage
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
      global: {
        fetch: fetch,
      },
    }
  );
}

/**
 * Sync a session to cookie storage so that plasmic-supabase's
 * SupabaseUserGlobalContext can find the session. Désormais REDONDANT avec le
 * client natif unifié (qui écrit déjà au bon endroit) ; conservé en filet de
 * sécurité best-effort (ne bloque jamais, ne lève jamais).
 */
export async function syncSessionToCookies(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  const browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: plasmicStorageCookies(),
    }
  );

  // setSession écrit les cookies de session de façon quasi-synchrone, MAIS dans la
  // WebView iOS (scheme capacitor://) sa promesse peut ne jamais se résoudre (appel
  // réseau interne / cookies custom-scheme). Sans borne, le flux de connexion natif
  // resterait bloqué (spinner infini, pas de redirection). On borne donc l'attente :
  // les cookies sont déjà posés avant le timeout, ce qui débloque la redirection.
  // Ne JAMAIS throw : ce sync est best-effort. Toute exception ici ne doit pas faire
  // échouer la connexion (la session est déjà en localStorage).
  const SYNC_TIMEOUT_MS = 4000;
  try {
    const result = await Promise.race([
      browserClient.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => ({ kind: "done" as const, error }))
        .catch((error) => ({ kind: "error" as const, error })),
      new Promise<{ kind: "timeout" }>((resolve) =>
        setTimeout(() => resolve({ kind: "timeout" }), SYNC_TIMEOUT_MS)
      ),
    ]);

    if (result.kind === "timeout") {
      console.warn(
        "syncSessionToCookies: setSession timed out (cookies probably written, continuing)"
      );
    } else if (result.kind === "error") {
      console.warn(
        "syncSessionToCookies: setSession threw (non-fatal):",
        result.error
      );
    } else if (result.error) {
      console.warn("Failed to sync session to cookies:", result.error.message);
    }
  } catch (e) {
    console.warn("syncSessionToCookies: unexpected non-fatal error:", e);
  }
}
