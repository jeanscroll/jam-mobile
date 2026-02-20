import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { App, type URLOpenListenerEvent } from "@capacitor/app";
import { createClient, syncSessionToCookies } from "@/utils/supabase/components";

// Constants
const OAUTH_CALLBACK_URL = "com.jam.mobile://auth/callback";
const WEB_CALLBACK_URL = "/auth/oauth-callback";

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
 * Initialize the deep link listener for OAuth callbacks
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

    // Check if this is our OAuth callback
    if (!event.url.startsWith("com.jam.mobile://auth/callback")) return;

    // Ignore duplicate callbacks (browser can fire twice)
    if (isProcessing) {
      console.log("OAuth callback already processing, ignoring duplicate");
      return;
    }

    // Ignore error callbacks if a code callback already came through
    const urlParams = new URL(event.url).searchParams;
    if (urlParams.get("error")) {
      console.warn("OAuth callback error from server:", urlParams.get("error_description"));
      return;
    }

    const code = urlParams.get("code");
    if (!code) {
      // Check hash fragment (implicit flow fallback)
      const hashParams = new URLSearchParams(event.url.split("#")[1] || "");
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (!accessToken) {
        onError(new Error("No authorization code or tokens found in callback URL"));
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
        await syncSessionToCookies(data.session.access_token, data.session.refresh_token);
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
 * Perform OAuth sign-in for native platforms
 */
async function signInWithOAuthNative(
  provider: "google" | "apple"
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    // Generate the OAuth URL with PKCE
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: OAUTH_CALLBACK_URL,
        skipBrowserRedirect: true, // Don't let Supabase redirect, we'll do it manually
        queryParams: provider === "google" ? { prompt: "select_account" } : undefined,
      },
    });

    if (error) {
      throw error;
    }

    if (!data.url) {
      throw new Error("No OAuth URL returned from Supabase");
    }

    console.log("Opening OAuth URL in browser");

    // Open the OAuth URL in the system browser
    await Browser.open({
      url: data.url,
      presentationStyle: "popover",
    });

    return { success: true };
  } catch (error) {
    console.error("OAuth native error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Perform OAuth sign-in - works on both web and native
 */
export async function signInWithOAuth(
  provider: "google" | "apple",
  webRedirectTo?: string
): Promise<{ success: boolean; error?: string }> {
  if (isNativePlatform()) {
    return signInWithOAuthNative(provider);
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
