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
import { initializeOAuthListener, isNativePlatform } from "@/lib/auth/oauthNative";
import {
    initRevenueCat,
    loginRevenueCat,
    logoutRevenueCat,
    isIAPAvailable,
} from "@/lib/iap/revenuecat";
import { createClient } from "@/utils/supabase/components";

// Routes where Crisp is hidden (its SDK conflicts with Weglot's i18n hooks
// on some pages, throwing "Cannot read properties of undefined (reading '$i18n')").
// The widget is hidden via Crisp's runtime API rather than unmounted, so it
// stays initialised and reappears cleanly on other routes.
const CRISP_DISABLED_ROUTES = ["/parametres-abonnement"];

function MyApp({ Component, pageProps }: AppProps) {
    const router = useRouter();

    // Ajouter l'attribut data-build pour identifier l'environnement
    useEffect(() => {
        document.documentElement.setAttribute('data-build', process.env.NODE_ENV as string);
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
        if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
            posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
                api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "/ingest",
                ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.posthog.com",
                person_profiles: 'identified_only',
                capture_pageview: false,
                capture_pageleave: true,
                loaded: (posthog) => {
                    if (process.env.NODE_ENV === 'development') posthog.debug()
                },
            })
        }
    }, []);

    return (
        <PostHogProvider client={posthog}>
            <>
                <Head>
                    <link rel="manifest" href="/manifest.json" />
</Head>
                <PostHogPageView />
                <Component {...pageProps} />
                <CrispChat disabledRoutes={CRISP_DISABLED_ROUTES} />
                <WeglotScript />
            </>
        </PostHogProvider>
    );
}

function PostHogPageView() {
    const router = useRouter()
    const posthog = usePostHog()

    useEffect(() => {
        const handleRouteChange = () => {
            if (posthog) posthog.capture('$pageview')
        }
        router.events.on('routeChangeComplete', handleRouteChange)
        return () => router.events.off('routeChangeComplete', handleRouteChange)
    }, [router.events, posthog])

    useEffect(() => {
        if (posthog) posthog.capture('$pageview')
    }, [posthog])

    return null
}

export default MyApp;
