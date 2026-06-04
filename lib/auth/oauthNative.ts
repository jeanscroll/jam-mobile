import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { App, type URLOpenListenerEvent } from "@capacitor/app";
import {
  createClient,
  syncSessionToCookies,
} from "@/utils/supabase/components";

// NB : le plugin natif @capacitor-community/apple-sign-in est importé
// DYNAMIQUEMENT au clic, jamais en statique : son ESM n'est pas résolvable par
// Node et casserait le build Next ("Collecting page data"). Le withTimeout
// ci-dessous couvre l'import ET l'appel SDK, donc même un chunk qui ne se charge
// pas ne bloque plus le bouton.

// Constants
const OAUTH_CALLBACK_URL = "com.jam.mobile://auth/callback";
const WEB_CALLBACK_URL = "/auth/oauth-callback";

// Garde-fou : empêche un appel SDK natif de laisser le bouton en "chargement infini".
const NATIVE_SIGNIN_TIMEOUT_MS = 15_000;

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out after ${ms}ms`)),
        ms
      )
    ),
  ]);
}

// Nonce pour Sign in with Apple (sécurité anti-rejeu, exigé par Supabase).
// Flux : on envoie le nonce HASHÉ (SHA-256) à Apple → le token contient ce hash ;
// on passe le nonce BRUT à Supabase, qui le re-hashe et compare. Cf. doc Supabase.
function generateRawNonce(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

/**
 * Check if running on a native platform (iOS/Android)
 */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Get the appropriate redirect URL based on platform
 */
export function getOAuthRedirectUrl(): string {
  if (isNativePlatform()) {
    return OAUTH_CALLBACK_URL;
  }
  // For web, use the full URL with origin
  if (typeof window !== "undefined") {
    return `${window.location.origin}${WEB_CALLBACK_URL}`;
  }
  return WEB_CALLBACK_URL;
}

/**
 * Initialize the deep link listener for OAuth callbacks (Google sign-in, email
 * verification, etc.). Call this once in _app.tsx or a root component.
 */
export function initializeOAuthListener(
  onSuccess: () => void,
  onError: (error: Error) => void
): () => void {
  if (!isNativePlatform()) {
    // No-op for web
    return () => {};
  }

  let listenerHandle: { remove: () => Promise<void> } | null = null;
  let isProcessing = false;

  App.addListener("appUrlOpen", async (event: URLOpenListenerEvent) => {
    console.log("App URL opened:", event.url);

    // Check if this is our OAuth or email verification callback
    const isOAuthCallback = event.url.startsWith(
      "com.jam.mobile://auth/callback"
    );
    const isEmailCallback = event.url.startsWith(
      "com.jam.mobile://auth/email-callback"
    );
    if (!isOAuthCallback && !isEmailCallback) return;

    // Ignore duplicate callbacks (browser can fire twice)
    if (isProcessing) {
      console.log("OAuth callback already processing, ignoring duplicate");
      return;
    }

    // Ignore error callbacks if a code callback already came through
    const urlParams = new URL(event.url).searchParams;
    if (urlParams.get("error")) {
      console.warn(
        "OAuth callback error from server:",
        urlParams.get("error_description")
      );
      return;
    }

    const code = urlParams.get("code");
    if (!code) {
      // Check hash fragment (implicit flow fallback)
      const hashParams = new URLSearchParams(event.url.split("#")[1] || "");
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (!accessToken) {
        onError(
          new Error("No authorization code or tokens found in callback URL")
        );
        return;
      }

      isProcessing = true;
      try {
        Browser.close().catch(() => {});
        const supabase = createClient();
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || "",
        });
        if (error) throw error;

        // Sync session to cookies so plasmic-supabase's SupabaseUserGlobalContext can find it
        await syncSessionToCookies(accessToken, refreshToken || "");

        onSuccess();
      } catch (error) {
        console.error("OAuth callback error:", error);
        onError(error instanceof Error ? error : new Error(String(error)));
      } finally {
        isProcessing = false;
      }
      return;
    }

    // Process the code exchange
    isProcessing = true;
    // Close browser without blocking
    Browser.close().catch(() => {});

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) throw error;

      // Sync session to cookies so plasmic-supabase's SupabaseUserGlobalContext can find it
      if (data.session) {
        await syncSessionToCookies(
          data.session.access_token,
          data.session.refresh_token
        );
      }

      console.log("OAuth session established successfully");
      onSuccess();
    } catch (error) {
      console.error("OAuth callback error:", error);
      onError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      isProcessing = false;
    }
  }).then((handle) => {
    listenerHandle = handle;
  });

  // Return cleanup function
  return () => {
    if (listenerHandle) {
      listenerHandle.remove();
    }
  };
}

/**
 * Native Apple Sign In using ASAuthorizationController (no browser)
 */
async function signInWithAppleNative(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const rawNonce = generateRawNonce();
    const hashedNonce = await sha256Hex(rawNonce);

    const result = await withTimeout(
      (async () => {
        const { SignInWithApple } = await import(
          "@capacitor-community/apple-sign-in"
        );
        return SignInWithApple.authorize({
          clientId: "com.jam.mobile",
          redirectURI: OAUTH_CALLBACK_URL,
          scopes: "email name",
          state: "",
          nonce: hashedNonce,
        });
      })(),
      NATIVE_SIGNIN_TIMEOUT_MS,
      "Apple Sign In"
    );

    const identityToken = result.response.identityToken;
    if (!identityToken) {
      throw new Error("No identity token returned from Apple Sign In");
    }

    // Exchange the Apple identity token with Supabase.
    // Le nonce BRUT doit être transmis : Supabase le re-hashe et le compare au
    // claim "nonce" (hashé) du token Apple.
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: identityToken,
      nonce: rawNonce,
    });

    if (error) throw error;

    // Sync session to cookies for Plasmic — BEST-EFFORT : ne doit jamais bloquer ni
    // faire échouer la connexion (sinon retour login sur iOS).
    if (data.session) {
      try {
        await syncSessionToCookies(
          data.session.access_token,
          data.session.refresh_token
        );
      } catch (e) {
        console.warn("Apple: cookie sync non-fatal error:", e);
      }
    }

    console.log("Apple native sign-in successful");
    return { success: true };
  } catch (error) {
    console.error("Apple native sign-in error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Connexion Google via le flux OAuth navigateur (authorization code + PKCE).
 *
 * On n'utilise PAS le SDK natif GoogleSignIn : sur iOS il injecte dans l'ID token
 * un `nonce` qu'on ne peut ni lire ni contrôler, et Supabase (hébergé) rejette
 * alors l'échange `signInWithIdToken`. Doc Supabase : préférer le flux OAuth
 * (authorization code + PKCE), qui évite complètement le problème de nonce.
 *
 * On ouvre l'URL OAuth Supabase dans le navigateur in-app ; le retour
 * `com.jam.mobile://auth/callback?code=...` est capté par `initializeOAuthListener`
 * (_app.tsx) qui échange le code (PKCE), établit la session et redirige.
 * → on renvoie `pending: true` : le bouton ne doit PAS naviguer lui-même.
 */
async function signInWithGoogleBrowser(): Promise<{
  success: boolean;
  error?: string;
  pending?: boolean;
}> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: OAUTH_CALLBACK_URL,
        skipBrowserRedirect: true,
        // `prompt: select_account` : force Google à TOUJOURS afficher le sélecteur
        // de compte. Sans ça, le navigateur in-app réutilise silencieusement la
        // session Google → impossible de changer de compte, et la reconnexion après
        // déconnexion repart sur l'ancien compte mis en cache.
        queryParams: { prompt: "select_account" },
      },
    });

    if (error) return { success: false, error: error.message };
    if (!data?.url) return { success: false, error: "No OAuth URL returned" };

    await Browser.open({ url: data.url });
    return { success: true, pending: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Google browser sign-in error:", message);
    return { success: false, error: message };
  }
}

/**
 * Perform OAuth sign-in - works on both web and native.
 * Native: Apple via ASAuthorizationController, Google via in-app browser (PKCE).
 * Web: standard Supabase OAuth redirect.
 */
export async function signInWithOAuth(
  provider: "google" | "apple",
  webRedirectTo?: string
): Promise<{ success: boolean; error?: string; pending?: boolean }> {
  if (isNativePlatform()) {
    const platform = Capacitor.getPlatform();
    if (provider === "apple") {
      if (platform === "ios") {
        return signInWithAppleNative();
      }
      // Apple Sign-In native SDK not available on Android — fall through to web OAuth
    } else if (provider === "google") {
      // Google natif = flux navigateur OAuth/PKCE (cf. signInWithGoogleBrowser).
      return signInWithGoogleBrowser();
    }
  }

  // Web flow - use standard Supabase redirect
  const supabase = createClient();
  const redirectTo = webRedirectTo || getOAuthRedirectUrl();

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
