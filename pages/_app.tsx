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
import dynamic from "next/dynamic";
const DebugOverlay = dynamic(() => import("@/components/debugOverlay/DebugOverlay"), { ssr: false });
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
