import { type ClassArray, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

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

export { cn, fileSize, getApiBaseUrl, openExternalUrl };
