import { type ClassArray, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { supabase } from "@/lib/supabaseClient";

const cn = (...inputs: ClassArray) => twMerge(clsx(inputs));

const fileSize = (size: number) => {
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return `${((size / 1024 ** i) * 1).toFixed(2)} ${["B", "KB", "MB", "GB", "TB"][i]}`;
};

/**
 * Returns the API base URL. On native (Capacitor), API routes don't exist
 * locally so we must call the remote server.
 */
const getApiBaseUrl = () =>
  Capacitor.isNativePlatform()
    ? process.env.NEXT_PUBLIC_API_BASE_URL || "https://job-around-me.com"
    : "";

/**
 * Appelle une fonction RPC Supabase via le proxy serveur (/api/supabase/rpc).
 *
 * Pensé pour les "run code" Plasmic et la WebView Capacitor : la base URL est
 * résolue automatiquement (serveur distant sur natif) et le token de la session
 * en cours est transmis pour que la RLS s'applique côté Supabase.
 *
 * Le nom de la RPC est passé dans l'URL (/api/supabase/rpc/{fn}), les
 * paramètres dans le body.
 *
 * Exemple (run code Plasmic) :
 *   const data = await callRpc("get_offres_visibles", { limit: 20 });
 *
 * @throws si la réponse n'est pas OK (le message d'erreur Supabase est propagé).
 */
const callRpc = async <T = unknown>(
  fn: string,
  args: Record<string, unknown> = {},
): Promise<T> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await fetch(
    `${getApiBaseUrl()}/api/supabase/rpc/${encodeURIComponent(fn)}`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(args),
    },
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      (payload && (payload.error || payload.message)) ||
        `Erreur RPC "${fn}" (${response.status})`,
    );
  }

  return payload as T;
};

/**
 * Ouvre une URL externe de façon fiable.
 *
 * Sur natif (iOS/Android), utilise @capacitor/browser avec
 * `presentationStyle: "fullscreen"` — indispensable sur iPad, où le
 * SFSafariViewController par défaut peut s'ouvrir en feuille peu visible.
 * Si `Browser.open` échoue (cas connu iPad), on retombe sur `window.open`
 * au lieu d'échouer silencieusement : un tap produit toujours une action.
 *
 * Ne throw jamais.
 */
const openExternalUrl = async (url: string): Promise<void> => {
  if (!url) return;

  if (Capacitor.isNativePlatform()) {
    try {
      await Browser.open({ url, presentationStyle: "fullscreen" });
      return;
    } catch (err) {
      console.error(
        "[openExternalUrl] Browser.open a échoué, repli sur window.open :",
        err,
      );
    }
  }

  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
};

export { cn, fileSize, getApiBaseUrl, openExternalUrl, callRpc };
