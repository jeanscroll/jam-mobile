import Head from "next/head";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import { useRouter } from "next/router";
import posthog from "posthog-js";
import { PostHogProvider, usePostHog } from "posthog-js/react";

import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import "@/styles/globals.css";
import "@/styles/fonts.css";
import CrispChat from "@/components/crispChat/CrispChat";
import WeglotScript from "@/components/weglot/WeglotScript";
import DebugOverlay from "@/components/debugOverlay/DebugOverlay";
import {
  initializeOAuthListener,
  isNativePlatform,
} from "@/lib/auth/oauthNative";
import {
  initRevenueCat,
  loginRevenueCat,
  logoutRevenueCat,
  isIAPAvailable,
} from "@/lib/iap/revenuecat";
import { createClient } from "@/utils/supabase/components";
import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";

// Routes where Crisp is hidden (its SDK conflicts with Weglot's i18n hooks
// on some pages, throwing "Cannot read properties of undefined (reading '$i18n')").
// The widget is hidden via Crisp's runtime API rather than unmounted, so it
// stays initialised and reappears cleanly on other routes.
// "/alertes" : le launcher Crisp (fixed, bottom-right) recouvre le bouton
// « Paramètres » de la page et le rend non cliquable → on masque le widget ici.
const CRISP_DISABLED_ROUTES = ["/parametres-abonnement", "/alertes"];

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Ajouter l'attribut data-build pour identifier l'environnement
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-build",
      process.env.NODE_ENV as string
    );
  }, []);

  // Pages courtes (login, choix d'inscription) : tout doit tenir sur un écran,
  // sans scroll. Le body porte des paddings safe-area (notch / home indicator)
  // qui, additionnés au wrapper de page Plasmic (min-height:100vh), créaient un
  // débordement = hauteur des safe-areas → scroll sur l'app native. On marque
  // <html> avec `fit-screen` pour appliquer le fix CSS (cf. globals.css), sur ces
  // routes courtes uniquement (les formulaires longs doivent rester scrollables).
  // Le catchall rend toutes les pages → on lit le chemin réel via asPath.
  useEffect(() => {
    const FIT_SCREEN_ROUTES = new Set(["/login", "/register"]);
    const path = (router.asPath || "").split("?")[0].split("#")[0];
    document.documentElement.classList.toggle(
      "fit-screen",
      FIT_SCREEN_ROUTES.has(path)
    );
    return () => {
      document.documentElement.classList.remove("fit-screen");
    };
  }, [router.asPath]);

  // Les safe-areas (notch / home indicator) laissent voir un fond derrière le
  // contenu. On les peint via deux bandes fixes (cf. globals.css, ::before/::after) :
  // --safe-top-bg pour le HAUT, --safe-bottom-bg pour le BAS.
  //
  // Sur l'accueil, le fond de page est une SECTION au dégradé vertical
  // (background-image: linear-gradient(#010A07 → #000000)) — son background-COLOR
  // est transparent, d'où l'échec d'un simple échantillonnage de couleur (qui
  // remontait jusqu'au wrapper Plasmic blanc → bande blanche). On extrait donc, sur
  // cette section, la 1re couleur du dégradé pour le HAUT et la dernière pour le BAS.
  // Les deux sont lues au même point (en haut), donc indépendantes du scroll. Repli :
  // 1re couleur de fond opaque rencontrée (ex. /login, fond clair uni → bandes
  // claires, ce qui est correct), puis défaut CSS.
  useEffect(() => {
    let cancelled = false;
    const root = document.documentElement;

    // Opaque sauf "transparent" ou rgba(...) d'alpha 0. NB : ne PAS confondre avec
    // rgb(0,0,0) (noir, 3 composantes, opaque) — on ne teste l'alpha que sur 4 comp.
    const opaque = (c: string) => {
      if (!c || c === "transparent") return false;
      const m = c.match(/^rgba?\(([^)]+)\)/);
      if (m) {
        const p = m[1].split(",").map((s) => s.trim());
        if (p.length === 4 && parseFloat(p[3]) === 0) return false;
      }
      return true;
    };

    // Couleur de bande au point (x,y) : 1re couleur de fond opaque rencontrée en
    // remontant les ancêtres ; à défaut, couleur d'un dégradé (1re pour le haut,
    // dernière pour le bas). Renvoie "" si rien d'exploitable.
    const bandColor = (x: number, y: number, end: "top" | "bottom") => {
      let el = document.elementFromPoint(x, y) as HTMLElement | null;
      while (el && el !== root) {
        const cs = getComputedStyle(el);
        if (opaque(cs.backgroundColor)) return cs.backgroundColor;
        const bg = cs.backgroundImage;
        if (bg && bg.indexOf("gradient") !== -1) {
          const cols = bg.match(/rgba?\([^)]*\)|#[0-9a-fA-F]{3,8}/g);
          if (cols && cols.length) {
            const c = end === "bottom" ? cols[cols.length - 1] : cols[0];
            if (opaque(c)) return c;
          }
        }
        el = el.parentElement;
      }
      return "";
    };

    const sync = () => {
      if (cancelled) return;
      const bs = getComputedStyle(document.body);
      const safeTop = parseFloat(bs.paddingTop) || 0;
      const cx = Math.round(window.innerWidth / 2);

      // Les deux bandes sont dérivées du fond du HAUT de page (point cx, safeTop+2) :
      // début du dégradé pour le haut, fin pour le bas → cohérent et insensible au scroll.
      if (safeTop > 0) {
        const top = bandColor(cx, safeTop + 2, "top");
        if (top) root.style.setProperty("--safe-top-bg", top);
        const bottom = bandColor(cx, safeTop + 2, "bottom");
        if (bottom) root.style.setProperty("--safe-bottom-bg", bottom);
      }
    };

    // Plasmic rend de façon asynchrone → on resynchronise sur quelques délais.
    const timers = [0, 60, 150, 300, 600].map((d) =>
      window.setTimeout(sync, d)
    );
    return () => {
      cancelled = true;
      timers.forEach((t) => clearTimeout(t));
    };
  }, [router.asPath]);

  // Plasmic en mode preview:true peut rejeter des promesses avec un 500 lors
  // du refetch live des données Studio. Sans handler, Next.js affiche une page
  // d'erreur blanche. On filtre silencieusement ces rejections Plasmic pour
  // éviter le crash — elles sont bénignes (le contenu déjà rendu reste affiché).
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      try {
        const raw = event.reason?.message || String(event.reason || "");
        const parsed = JSON.parse(raw);
        // Erreurs Plasmic bénignes : 500 de l'API preview, pool Supabase saturé
        // (__plasmicIgnoreError=true), etc. On les absorbe pour éviter le crash.
        if (
          parsed?.error?.message === "Internal Server Error" ||
          parsed?.error?.__plasmicIgnoreError === true ||
          parsed?.error?.message?.includes("EMAXCONN")
        ) {
          event.preventDefault();
          return;
        }
      } catch {}
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  // iOS : afficher la barre d'accessoire du clavier (bouton « Terminé »).
  // En WKWebView, Capacitor masque cette barre par défaut : l'utilisateur
  // restait alors « bloqué » dans un champ, sans moyen de fermer le clavier
  // pour atteindre le bouton « Candidater ». setAccessoryBarVisible est iOS-only
  // (no-op/erreur ailleurs) → on garde le garde-fou getPlatform() === "ios".
  useEffect(() => {
    if (Capacitor.getPlatform() !== "ios") return;
    Keyboard.setAccessoryBarVisible({ isVisible: true }).catch(() => {});
  }, []);

  // Initialize OAuth deep link listener for native platforms
  useEffect(() => {
    if (!isNativePlatform()) return;

    const cleanup = initializeOAuthListener(
      // onSuccess callback — use window.location.href instead of router.replace
      // to force a full page reload. This is needed because plasmic-supabase's
      // SupabaseUserGlobalContext only checks the session once on mount (useEffect []).
      // A client-side navigation (router.replace) wouldn't re-mount it.
      () => {
        console.log("OAuth successful, navigating to home");
        window.location.href = "/";
      },
      // onError callback
      (error) => {
        console.error("OAuth failed:", error);
        router.replace("/login?error=oauth_failed");
      }
    );

    return cleanup;
  }, [router]);

  // Initialize RevenueCat (iOS-only) and bind to the Supabase user identity.
  // - configure() runs once on first mount with the current session id (if any)
  // - logIn / logOut are mirrored on auth state changes so purchases attach
  //   to the correct backend user.
  useEffect(() => {
    if (!isIAPAvailable()) return;

    const supabase = createClient();
    let unsub: (() => void) | undefined;

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await initRevenueCat(session?.user?.id ?? null);

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, sess) => {
        if (event === "SIGNED_IN" && sess?.user) {
          await loginRevenueCat(sess.user.id);
        } else if (event === "SIGNED_OUT") {
          await logoutRevenueCat();
        }
      });
      unsub = () => subscription.unsubscribe();
    })();

    return () => {
      unsub?.();
    };
  }, []);

  // Initialize PostHog analytics
  useEffect(() => {
    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "/ingest",
        ui_host:
          process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.posthog.com",
        person_profiles: "identified_only",
        capture_pageview: false,
        capture_pageleave: true,
        loaded: (posthog) => {
          if (process.env.NODE_ENV === "development") posthog.debug();
        },
      });
    }
  }, []);

  return (
    <PostHogProvider client={posthog}>
      <>
        <Head>
          {/*
            viewport-fit=cover : active env(safe-area-inset-*) pour gérer le
            notch / Dynamic Island iOS (croix Crisp, contenus en bord d'écran).
            On NE désactive PAS le zoom (pas de maximum-scale / user-scalable=no)
            pour préserver l'accessibilité : l'auto-zoom iOS sur les champs est
            neutralisé en garantissant font-size >= 16px sur les inputs (cf. globals.css).
          */}
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, viewport-fit=cover"
          />
          <link rel="manifest" href="/manifest.json" />
        </Head>
        <PostHogPageView />
        <Component {...pageProps} />
        <CrispChat disabledRoutes={CRISP_DISABLED_ROUTES} />
        <WeglotScript />
        {process.env.NEXT_PUBLIC_DEBUG_OVERLAY === "true" && <DebugOverlay />}
      </>
    </PostHogProvider>
  );
}

function PostHogPageView() {
  const router = useRouter();
  const posthog = usePostHog();

  useEffect(() => {
    const handleRouteChange = () => {
      if (posthog) posthog.capture("$pageview");
    };
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [router.events, posthog]);

  useEffect(() => {
    if (posthog) posthog.capture("$pageview");
  }, [posthog]);

  return null;
}

export default MyApp;
