"use client";

import { useEffect } from "react";

export default function WeglotScript() {
  useEffect(() => {
    // Éviter le double chargement
    if (document.querySelector('script[src*="weglot"]')) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.weglot.com/weglot.min.js";
    script.async = true;
    script.onload = () => {
      // @ts-expect-error Weglot est un global injecté par le script CDN (non typé)
      if (typeof Weglot !== "undefined") {
        // @ts-expect-error Weglot est un global injecté par le script CDN (non typé)
        Weglot.initialize({
          api_key: "wg_d329a44473da57760d76b809239d58082",
          originalLanguage: "fr",
          destinationLanguages: ["en"],
          autoSwitch: false,
          // IMPORTANT : l'app est une SPA Next.js + Plasmic rendue côté client.
          // `dynamic: true` est INDISPENSABLE : sans ça, Weglot ne traduit que le
          // DOM présent à l'init (souvent vide car Plasmic n'a pas fini de rendre)
          // et ne re-traduit jamais le contenu injecté ensuite ni les changements
          // de page (navigation client-side) → la traduction "ne fonctionne pas".
          dynamic: true,
        });

        // Forcer l'application des styles après initialisation
        setTimeout(() => {
          const applyStyles = () => {
            const selectors = [
              ".weglot_switcher",
              ".weglot-dropdown",
              '[class*="weglot"]',
              "#weglot_here",
            ];

            selectors.forEach((selector) => {
              const elements = document.querySelectorAll(selector);
              elements.forEach((element) => {
                if (element) {
                  (element as HTMLElement).style.cssText += `
                    position: fixed !important;
                    bottom: 30px !important;
                    left: 20px !important;
                    width: 70px !important;
                    z-index: 99999 !important;
                  `;
                }
              });
            });
          };

          applyStyles();
          // Réappliquer plusieurs fois pour s'assurer que ça tient
          setTimeout(applyStyles, 500);
          setTimeout(applyStyles, 1000);
          setTimeout(applyStyles, 2000);
        }, 100);
      }
    };
    document.head.appendChild(script);
  }, []);

  return null;
}
