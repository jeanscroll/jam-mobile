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

  // Le fond html/body (#010A07, cf. globals.css) ressort dans les safe-areas
  // (notch / home indicator) sur l'app native. Ce sombre convient aux pages
  // sombres (accueil) mais crée des bandes sombres disgracieuses sur les pages
  // claires (login, inscription…). On aligne donc le fond des safe-areas sur le
  // fond réel de la page courante : si un fond opaque couvrant l'écran est
  // détecté on l'applique à html/body, sinon on garde le défaut sombre.
  useEffect(() => {
    let cancelled = false;
    const opaque = (c: string) =>
      !!c && c !== "transparent" && !/rgba\(0,\s*0,\s*0,\s*0\)/.test(c);
    const sync = () => {
      if (cancelled) return;
      const wrap = document.querySelector<HTMLElement>(".plasmic_page_wrapper");
      let bg = wrap ? getComputedStyle(wrap).backgroundColor : "";
      if (wrap && !opaque(bg)) {
        const big = Array.from(wrap.querySelectorAll<HTMLElement>("*")).find(
          (el) => {
            const r = el.getBoundingClientRect();
            return (
              r.top < window.innerHeight &&
              r.width >= window.innerWidth * 0.9 &&
              r.height >= window.innerHeight * 0.5 &&
              opaque(getComputedStyle(el).backgroundColor)
            );
          }
        );
        if (big) bg = getComputedStyle(big).backgroundColor;
      }
      const val = opaque(bg) ? bg : "";
      document.documentElement.style.backgroundColor = val;
      document.body.style.backgroundColor = val;
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
