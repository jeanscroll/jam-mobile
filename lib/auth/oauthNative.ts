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

// ─── Instrumentation Google natif ───────────────────────────────────────────
// Logs horodatés visibles dans Safari → Develop → [device] → JSContext.
// Filtrer la console sur "[GoogleAuth]" : la dernière étape ":start" SANS son
// ":done", ou un message "step=XXX timed out", désigne EXACTEMENT où ça bloque.
const GA_TAG = "[GoogleAuth]";

// Overlay visuel À L'ÉCRAN : affiche chaque étape directement dans l'app (pas
// besoin de Safari Web Inspector). Non bloquant (pointer-events: none → ne gêne
// jamais le clic). Actif uniquement en natif. Tape sur 🐞 nettoie / masque.
function gaOverlayAppend(line: string): void {
  if (typeof document === "undefined") return;
  if (!isNativePlatform()) return;
  const ID = "ga-debug-overlay";
  let box = document.getElementById(ID);
  if (!box) {
    box = document.createElement("div");
    box.id = ID;
    box.style.cssText = [
      "position:fixed",
      "top:env(safe-area-inset-top,0px)",
      "left:0",
      "right:0",
      "max-height:45vh",
      "overflow:auto",
      "z-index:2147483647",
      "background:rgba(0,0,0,0.82)",
      "color:#0f0",
      "font:11px/1.35 ui-monospace,Menlo,monospace",
      "padding:6px 8px",
      "white-space:pre-wrap",
      "word-break:break-word",
      "pointer-events:none",
    ].join(";");
    document.body.appendChild(box);
  }
  const ts = new Date().toISOString().substring(11, 23); // HH:MM:SS.mmm
  const row = document.createElement("div");
  row.textContent = `${ts}  ${line}`;
  // Met en évidence (rouge) les erreurs / timeouts pour les repérer d'un coup d'œil.
  if (/error|timed out|fail|reject/i.test(line)) {
    row.style.color = "#ff5b5b";
    row.style.fontWeight = "bold";
  }
  box.appendChild(row);
  // Garde les ~40 dernières lignes.
  while (box.childElementCount > 40) box.removeChild(box.firstChild as Node);
  box.scrollTop = box.scrollHeight;
}

function gaLog(step: string, extra?: unknown): void {
  if (extra !== undefined) {
    console.log(`${GA_TAG} ${step}`, extra);
    let suffix = "";
    try {
      suffix =
        " " + (extra instanceof Error ? extra.message : JSON.stringify(extra));
    } catch {
      suffix = " " + String(extra);
    }
    gaOverlayAppend(`${GA_TAG} ${step}${suffix}`);
  } else {
    console.log(`${GA_TAG} ${step}`);
    gaOverlayAppend(`${GA_TAG} ${step}`);
  }
}

// Timeouts d'étape pour l'init du SDK natif (encore utilisé par signOutGoogleNative).
const GA_IMPORT_TIMEOUT_MS = 8_000;
const GA_INITIALIZE_TIMEOUT_MS = 8_000;

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
// On enveloppe le plugin dans un objet simple : voir le commentaire dans l'init.
type GoogleAuthHandle = { GoogleAuth: GoogleAuthPlugin };
let googleAuthInitPromise: Promise<GoogleAuthHandle> | null = null;

async function getGoogleAuth(): Promise<GoogleAuthHandle> {
  if (!googleAuthInitPromise) {
    const init = (async () => {
      gaLog("import:start");
      const mod = await withTimeout(
        import("@southdevs/capacitor-google-auth"),
        GA_IMPORT_TIMEOUT_MS,
        `${GA_TAG} step=IMPORT`
      );
      gaLog("import:done → initialize:start");
      // Timeout À L'INTÉRIEUR de l'init : sans ça, une init qui pend ne rejette
      // jamais, le singleton reste "empoisonné" (promesse pendante mise en cache)
      // et TOUS les clics suivants réutilisent cette promesse bloquée.
      await withTimeout(
        mod.GoogleAuth.initialize({
          scopes: ["profile", "email"],
          grantOfflineAccess: false,
        }),
        GA_INITIALIZE_TIMEOUT_MS,
        `${GA_TAG} step=INITIALIZE`
      );
      gaLog("initialize:done");
      // ⚠️ CAUSE RACINE du bouton bloqué : NE JAMAIS résoudre une promesse avec le
      // proxy Capacitor directement. Son handler `get` renvoie une fonction pour
      // TOUTE propriété (y compris `.then`), donc `await proxy` le prend pour un
      // thenable et appelle `proxy.then(resolve, reject)` → routé comme méthode
      // native "then" inexistante → resolve/reject JAMAIS appelés → hang infini.
      // On le retourne donc enveloppé dans un objet simple (`.then` === undefined).
      return { GoogleAuth: mod.GoogleAuth };
    })();
    // Si l'init échoue (y compris via timeout d'étape), on vide le cache pour
    // permettre un nouvel essai propre au clic suivant.
    init.catch((e: unknown) => {
      gaLog("init:rejected → reset singleton", e);
      googleAuthInitPromise = null;
    });
    googleAuthInitPromise = init;
  } else {
    gaLog("init:reuse cached promise");
  }
  return googleAuthInitPromise;
}

/**
 * Connexion Google via le flux OAuth navigateur (authorization code + PKCE).
 *
 * On N'UTILISE PLUS le SDK natif GoogleSignIn : sur iOS il injecte dans l'ID token
 * un `nonce` qu'on ne peut ni lire ni contrôler (aucune API), et Supabase (hébergé)
 * rejette alors l'échange `signInWithIdToken` avec
 * « Passed nonce and nonce in id_token should either both exist or not ».
 * Doc Supabase : préférer le flux OAuth (authorization code + PKCE) qui évite
 * complètement le problème de nonce des ID tokens.
 *
 * On ouvre donc l'URL OAuth Supabase dans le navigateur in-app ; le retour
 * `com.jam.mobile://auth/callback?code=...` est capté par `initializeOAuthListener`
 * (_app.tsx) qui échange le code (PKCE) et établit la session, puis redirige.
 * → on renvoie `pending: true` : le bouton ne doit PAS naviguer lui-même.
 */
async function signInWithGoogleBrowser(): Promise<{
  success: boolean;
  error?: string;
  pending?: boolean;
}> {
  gaLog(`flow:enter google-browser platform=${Capacitor.getPlatform()}`);
  try {
    const supabase = createClient();
    gaLog("oauth:start (Supabase signInWithOAuth)");
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: OAUTH_CALLBACK_URL,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      gaLog("oauth:ERROR", error.message);
      return { success: false, error: error.message };
    }
    if (!data?.url) {
      gaLog("oauth:ERROR no url returned");
      return { success: false, error: "No OAuth URL returned" };
    }

    gaLog("browser:open (la connexion Google s'ouvre, suite via deep link)");
    await Browser.open({ url: data.url });
    return { success: true, pending: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    gaLog("flow:error", message);
    console.error("Google browser sign-in error:", message);
    return { success: false, error: message };
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
    const { GoogleAuth } = await getGoogleAuth();
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
