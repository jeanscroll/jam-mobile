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
    /* La liste s'ouvre au-dessus : ne pas la rogner. */
    overflow: visible !important;
  }
  .wgcurrent {
    background: transparent !important;
    border: none !important;
  }
  /* Liste des langues : ouverture vers le HAUT (switcher ancré en bas d'écran)
     et au-dessus du drapeau courant. Sans ce positionnement explicite, la liste
     se superposait au drapeau courant à l'ouverture ("2 drapeaux superposés").
     Ciblé sur le <aside> conteneur pour couvrir toutes les versions de classes
     Weglot (wg-default / weglot-default). */
  aside.weglot_switcher > ul,
  aside.country-selector > ul,
  aside.weglot-dropdown > ul {
    position: absolute !important;
    left: 0 !important;
    right: auto !important;
    top: auto !important;
    bottom: calc(100% + 8px) !important;
    margin: 0 !important;
    list-style: none !important;
    background: rgba(15, 15, 15, 0.95) !important;
    border: 1.5px solid #BBFE68 !important;
    border-radius: 12px !important;
  }
  /* Masquée tant que le switcher est fermé */
  aside.weglot_switcher.closed > ul,
  aside.country-selector.closed > ul,
  aside.weglot-dropdown.closed > ul {
    display: none !important;
  }
  .wg-li a {
    color: #fff !important;
  }
  .wg-li:hover a {
    color: #BBFE68 !important;
  }
`;

let _applyingWeglotStyle = false;
let _weglotObserver: MutationObserver | null = null;

function applyWeglotPosition(aside: HTMLElement) {
  aside.style.setProperty("position", "fixed", "important");
  aside.style.setProperty("bottom", "30px", "important");
  aside.style.setProperty("left", "20px", "important");
  aside.style.setProperty("top", "unset", "important");
  aside.style.setProperty("right", "unset", "important");
  aside.style.setProperty("z-index", "99999", "important");
  aside.style.setProperty("width", "auto", "important");
  aside.style.setProperty("min-width", "64px", "important");
}

function injectWeglotStyle() {
  // <style> injecté après le CSS Weglot CDN — gagne le cascade
  if (!document.getElementById("jam-weglot-override")) {
    const styleEl = document.createElement("style");
    styleEl.id = "jam-weglot-override";
    styleEl.textContent = WEGLOT_STYLE;
    document.head.appendChild(styleEl);
  }

  const aside = document.querySelector<HTMLElement>(
    "aside.weglot_switcher, aside.country-selector"
  );
  if (!aside) return;

  applyWeglotPosition(aside);

  // MutationObserver avec garde anti-boucle : détecte quand Weglot réécrase
  // son inline style et le remet immédiatement à la bonne valeur.
  if (!_weglotObserver) {
    _weglotObserver = new MutationObserver(() => {
      if (_applyingWeglotStyle) return;
      _applyingWeglotStyle = true;
      applyWeglotPosition(aside);
      _applyingWeglotStyle = false;
    });
    _weglotObserver.observe(aside, {
      attributes: true,
      attributeFilter: ["style"],
    });
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
          // TEST (retour EN→FR incomplet) : on s'appuie désormais sur la détection
          // de contenu dynamique configurée côté dashboard Weglot (sélecteur `body`
          // déclaré dans Settings → App Settings) pour que le moteur NATIF re-scanne
          // et traduise/restaure tout le DOM. Le pont maison `dynamicTranslate.ts`
          // faisait doublon et cassait le retour à la langue source → désactivé
          // ci-dessous. `dynamic: true` retiré pour éviter un 2e système concurrent.
          // dynamic: true,
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
    // ne rattrape pas de façon fiable. Le moteur natif seul ne traduit que le DOM
    // présent au 1er chargement (la home) ; en navigation SPA il n'y a pas de
    // rechargement de page, donc rien ne relance la traduction → le pont prend le
    // relais via un MutationObserver sur `body` + l'API Weglot.translate().
    //
    // Retour EN→FR : corrigé dans dynamicTranslate.ts — on se fie désormais à la
    // langue annoncée par l'évènement `languageChanged` (et non à getCurrentLang()
    // qui est mis à jour de façon asynchrone), et on restaure immédiatement.
    startWeglotDynamicTranslation("fr");
  }, []);

  return null;
}
