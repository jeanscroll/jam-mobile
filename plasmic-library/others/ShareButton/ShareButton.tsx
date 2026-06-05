import React, { useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";

export interface ShareButtonProps {
  /** URL à partager (lien de l'annonce). */
  url?: string;
  /** Titre du partage. */
  title?: string;
  /** Texte d'accompagnement. */
  text?: string;
  /** Titre de la feuille de partage (Android). */
  dialogTitle?: string;
  className?: string;
  /** Contenu cliquable (icône/label) — slot Plasmic. */
  children?: React.ReactNode;
  /** Message de repli copié si aucun partage natif/web n'est disponible. */
  copyFallbackMessage?: string;
  /** Callback après un partage réussi. */
  onShared?: () => void;
  /** Callback en cas d'erreur (hors annulation utilisateur). */
  onError?: (message: string) => void;
}

/**
 * Bouton de partage qui fonctionne en WebView Capacitor (iOS/Android) ET sur le
 * web. La page détail utilisait un bouton de partage sans effet : `navigator.share`
 * n'est pas exposé de façon fiable dans la WebView iOS Capacitor sans plugin natif.
 * On utilise donc @capacitor/share en natif, avec repli web puis copie du lien.
 */
const ShareButton: React.FC<ShareButtonProps> = ({
  url,
  title,
  text,
  dialogTitle,
  className,
  children,
  copyFallbackMessage = "Lien copié dans le presse-papiers",
  onShared,
  onError,
}) => {
  const [busy, setBusy] = useState(false);

  const handleShare = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const payload = {
        title: title || undefined,
        text: text || undefined,
        url: url || undefined,
        dialogTitle: dialogTitle || title || undefined,
      };

      // 1) Plateforme native (Capacitor iOS/Android) → feuille de partage native.
      if (Capacitor.isNativePlatform()) {
        await Share.share(payload);
        onShared?.();
        return;
      }

      // 2) Web Share API (navigateurs compatibles).
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function"
      ) {
        await navigator.share({
          title: payload.title,
          text: payload.text,
          url: payload.url,
        });
        onShared?.();
        return;
      }

      // 3) Repli : copie du lien dans le presse-papiers.
      const toCopy = url || text || title || "";
      if (toCopy && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(toCopy);
        if (typeof window !== "undefined") window.alert(copyFallbackMessage);
        onShared?.();
        return;
      }

      throw new Error("Aucune méthode de partage disponible");
    } catch (err) {
      // L'utilisateur a fermé la feuille de partage : ne pas remonter d'erreur.
      const message = err instanceof Error ? err.message : String(err);
      const isCancel = /cancel|abort|dismiss/i.test(message);
      if (!isCancel) {
        console.error("[ShareButton] Échec du partage:", message);
        onError?.(message);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={className}
      onClick={handleShare}
      aria-label={title ? `Partager : ${title}` : "Partager"}
      style={{
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: busy ? 0.6 : 1,
      }}
    >
      {children ?? (
        // Icône de partage par défaut si aucun contenu n'est fourni.
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      )}
    </button>
  );
};

export default ShareButton;
