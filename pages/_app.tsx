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

function MyApp({ Component, pageProps }: AppProps) {
    // Ajouter l'attribut data-build pour identifier l'environnement
    useEffect(() => {
        document.documentElement.setAttribute('data-build', process.env.NODE_ENV as string);
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
                <CrispChat />
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
