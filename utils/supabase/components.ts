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
