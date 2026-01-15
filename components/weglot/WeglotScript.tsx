'use client';

import { useEffect } from 'react';

export default function WeglotScript() {
  useEffect(() => {
    // Éviter le double chargement
    if (document.querySelector('script[src*="weglot"]')) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.weglot.com/weglot.min.js';
    script.async = true;
    script.onload = () => {
      // @ts-ignore
      if (typeof Weglot !== 'undefined') {
        // @ts-ignore
        Weglot.initialize({
          api_key: 'wg_7a994a95d8a52ee847d1d76f13c919c67',
          originalLanguage: 'fr',
          destinationLanguages: ['en', 'es'],
          autoSwitch: false,
          cache: false, // Désactiver le cache pour éviter les problèmes de prod
          dynamic: false, // Éviter les changements dynamiques
        });

        // Forcer l'application des styles après initialisation
        setTimeout(() => {
          const applyStyles = () => {
            const selectors = [
              '.weglot_switcher',
              '.weglot-dropdown',
              '[class*="weglot"]',
              '#weglot_here'
            ];

            selectors.forEach(selector => {
              const elements = document.querySelectorAll(selector);
              elements.forEach(element => {
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