import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { App, type URLOpenListenerEvent } from "@capacitor/app";
import {
  createClient,
  syncSessionToCookies,
} from "@/utils/supabase/components";

// NB : les plugins natifs (@capacitor-community/apple-sign-in,
// @southdevs/capacitor-google-auth) sont importés DYNAMIQUEMENT au clic, jamais
// en statique : leur ESM n'est pas résolvable par Node et casserait le build
// Next ("Collecting page data"). Le withTimeout ci-dessous couvre l'import ET
// l'appel SDK, donc même un chunk qui ne se charge pas ne bloque plus le bouton.

// Constants
const OAUTH_CALLBACK_URL = "com.jam.mobile://auth/callback";
const WEB_CALLBACK_URL = "/auth/oauth-callback";

// Garde-fou : empêche un appel SDK natif de laisser le bouton en "chargement infini".
// 15s : le natif ne pend plus (cf. patch @southdevs : signIn résout/rejette toujours),
// ce timeout ne couvre donc plus qu'un blocage réseau/SDK réellement anormal.
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
 * Initialize the deep link listener for OAuth callbacks (email verification, etc.)
 * Call this once in _app.tsx or a root component
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

    // Sync session to cookies for Plasmic — BEST-EFFORT (cf. Google ci-dessous) : ne
    // doit jamais bloquer ni faire échouer la connexion (sinon retour login sur iOS).
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

// Singleton d'initialisation du SDK Google natif.
// IMPORTANT : `GoogleAuth.initialize()` ne doit s'exécuter qu'UNE SEULE fois sur
// la durée de vie de l'app. Le ré-initialiser à chaque clic est une cause connue
// d'instabilité du plugin. Les client IDs proviennent de capacitor.config.ts
// (auto-chargé par le natif).
type GoogleAuthPlugin =
  typeof import("@southdevs/capacitor-google-auth")["GoogleAuth"];
let googleAuthInitPromise: Promise<GoogleAuthPlugin> | null = null;

async function getGoogleAuth(): Promise<GoogleAuthPlugin> {
  if (!googleAuthInitPromise) {
    const init = (async () => {
      const { GoogleAuth } = await import("@southdevs/capacitor-google-auth");
      await GoogleAuth.initialize({
        scopes: ["profile", "email"],
        grantOfflineAccess: false,
      });
      return GoogleAuth;
    })();
    // Si l'init échoue, on vide le cache pour permettre un nouvel essai propre.
    init.catch(() => {
      googleAuthInitPromise = null;
    });
    googleAuthInitPromise = init;
  }
  return googleAuthInitPromise;
}

/**
 * Détecte une annulation par l'utilisateur (fermeture du sélecteur de compte).
 * Ce n'est pas une vraie erreur : le bouton doit simplement se réinitialiser.
 * Android: 12501 (SIGN_IN_CANCELLED) · iOS: -5 / "canceled" · Web: "popup_closed".
 */
function isUserCancellation(code: unknown, message: string): boolean {
  const c = String(code ?? "");
  return (
    c === "12501" ||
    c === "-5" ||
    /cancel/i.test(message) ||
    /popup_closed/i.test(message) ||
    /user.?cancell?ed/i.test(message)
  );
}

/**
 * Native Google Sign In using Google SDK (no browser)
 */
async function signInWithGoogleNative(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // L'init est garantie unique (singleton). On fait un signOut() AWAITÉ juste
    // avant signIn() : indispensable côté iOS, sinon le SDK tente un
    // `restorePreviousSignIn` qui peut rester PENDANT (ni résolu ni rejeté) →
    // le bouton reste bloqué en "Chargement…". Comme tout est enveloppé dans
    // withTimeout, même un appel natif qui ne répond pas finit par rejeter.
    const googleUser = await withTimeout(
      (async () => {
        const GoogleAuth = await getGoogleAuth();
        // Nettoie l'état natif (compte mis en cache) avant de redemander :
        // évite le hang iOS + force le sélecteur de compte. Best-effort.
        await GoogleAuth.signOut().catch(() => {});
        return GoogleAuth.signIn({ scopes: ["profile", "email"] });
      })(),
      NATIVE_SIGNIN_TIMEOUT_MS,
      "Google Sign In"
    );

    const idToken = googleUser?.authentication?.idToken;
    if (!idToken) {
      throw new Error("No ID token returned from Google Sign In");
    }

    // Exchange the Google ID token with Supabase.
    // Timeout également ici : sans ça, un appel réseau Supabase qui pend
    // laisserait le bouton bloqué en "Chargement…" indéfiniment.
    const supabase = createClient();
    const { data, error } = await withTimeout(
      supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      }),
      NATIVE_SIGNIN_TIMEOUT_MS,
      "Supabase signInWithIdToken"
    );

    if (error) throw error;

    // Sync session to cookies for Plasmic — BEST-EFFORT. La session est déjà persistée
    // en localStorage par signInWithIdToken ; ce sync ne doit JAMAIS bloquer ni faire
    // échouer la connexion (sinon : success:false → pas de redirection sur iOS).
    if (data.session) {
      try {
        await syncSessionToCookies(
          data.session.access_token,
          data.session.refresh_token
        );
      } catch (e) {
        console.warn("Google: cookie sync non-fatal error:", e);
      }
    }

    console.log("Google native sign-in successful");
    return { success: true };
  } catch (error: unknown) {
    const err = error as
      | { code?: unknown; errorCode?: unknown; status?: unknown }
      | null
      | undefined;
    const code = err?.code ?? err?.errorCode ?? err?.status;
    const message = error instanceof Error ? error.message : String(error);

    // Annulation utilisateur : on ne loggue pas en erreur, on réinitialise juste le bouton.
    if (isUserCancellation(code, message)) {
      console.log("Google native sign-in cancelled by user");
      return { success: false, error: "cancelled" };
    }

    console.error("Google native sign-in error:", message, "code:", code);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Déconnexion du SDK Google natif. Best-effort, ne lève jamais.
 * À appeler au LOGOUT de l'app (event Supabase SIGNED_OUT) afin que la prochaine
 * connexion reparte d'un état natif propre : le compte Google mis en cache est
 * effacé (⇒ le sélecteur de compte réapparaît) et on évite la race stale-session
 * qui cassait par intermittence la re-connexion juste après une déconnexion.
 */
export async function signOutGoogleNative(): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    const GoogleAuth = await getGoogleAuth();
    await GoogleAuth.signOut();
    console.log("Google native sign-out successful");
  } catch (e) {
    console.warn("Google native signOut non-fatal error:", e);
  }
}

/**
 * Perform OAuth sign-in - works on both web and native
 * Native: uses native SDKs (no browser opened)
 * Web: uses standard Supabase OAuth redirect
 */
export async function signInWithOAuth(
  provider: "google" | "apple",
  webRedirectTo?: string
): Promise<{ success: boolean; error?: string }> {
  if (isNativePlatform()) {
    const platform = Capacitor.getPlatform();
    if (provider === "apple") {
      if (platform === "ios") {
        return signInWithAppleNative();
      }
      // Apple Sign-In native SDK not available on Android — fall through to web OAuth
    } else if (provider === "google") {
      return signInWithGoogleNative();
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
