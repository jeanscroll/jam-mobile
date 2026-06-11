"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import { startWeglotDynamicTranslation } from "../../lib/weglot/dynamicTranslate";

const WEGLOT_STYLE = `
  aside.weglot_switcher,
  aside.country-selector {
    background: rgba(15, 15, 15, 0.85) !important;
    border: 1.5px solid #BBFE68 !important;
    border-radius: 20px !important;
    padding: 4px 10px !important;
    width: auto !important;
    min-width: 64px !important;
  }
  .wgcurrent {
    background: transparent !important;
    border: none !important;
  }
  .wg-default ul {
    background: rgba(15, 15, 15, 0.95) !important;
    border: 1.5px solid #BBFE68 !important;
    border-radius: 12px !important;
  }
  .wg-default .wg-li a {
    color: #fff !important;
  }
  .wg-default .wg-li:hover a {
    color: #BBFE68 !important;
  }
`;

function injectWeglotStyle() {
  // <style> injecté après le CSS Weglot CDN — gagne le cascade
  if (!document.getElementById("jam-weglot-override")) {
    const styleEl = document.createElement("style");
    styleEl.id = "jam-weglot-override";
    styleEl.textContent = WEGLOT_STYLE;
    document.head.appendChild(styleEl);
  }

  // Positionnement inline sur l'aside — nécessaire en WebView iOS où position:fixed
  // CSS seul ne suffit pas (Weglot écrase avec sa position par défaut).
  const aside = document.querySelector<HTMLElement>(
    "aside.weglot_switcher, aside.country-selector"
  );
  if (aside) {
    aside.style.setProperty("position", "fixed", "important");
    aside.style.setProperty("bottom", "30px", "important");
    aside.style.setProperty("left", "20px", "important");
    aside.style.setProperty("top", "unset", "important");
    aside.style.setProperty("right", "unset", "important");
    aside.style.setProperty("z-index", "99999", "important");
    aside.style.setProperty("width", "auto", "important");
    aside.style.setProperty("min-width", "64px", "important");
  }
}

export default function WeglotScript() {
  const router = useRouter();

  // Réappliquer la position à chaque navigation SPA — Weglot recrée son switcher
  // avec sa position par défaut (haut-droite) après un changement de route.
  useEffect(() => {
    const reapply = () => setTimeout(injectWeglotStyle, 100);
    router.events.on("routeChangeComplete", reapply);
    return () => router.events.off("routeChangeComplete", reapply);
  }, [router.events]);

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

        // switchersReady fire après que Weglot a créé le DOM du switcher ET
        // injecté son propre CSS CDN. Injecter notre <style> ici garantit qu'il
        // vient après dans le <head> et gagne le cascade.
        // @ts-expect-error Weglot est un global injecté par le script CDN (non typé)
        Weglot.on("switchersReady", injectWeglotStyle);
      }
    };
    document.head.appendChild(script);

    // Pont de traduction dynamique : force la traduction du contenu rendu côté
    // client (cards Supabase, navigations SPA) que l'observer interne de Weglot
    // ne rattrape pas. S'auto-attend que window.Weglot.translate soit dispo.
    startWeglotDynamicTranslation("fr");
  }, []);

  return null;
}
