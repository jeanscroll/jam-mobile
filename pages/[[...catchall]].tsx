import * as React from "react";
import {
  PlasmicComponent,
  type ComponentRenderData,
  PlasmicRootProvider,
} from "@plasmicapp/loader-nextjs";
import type { GetStaticPaths, GetStaticProps } from "next";

import NextError from "next/error";
import { useRouter } from "next/router";
import { PLASMIC } from "@/plasmic-init";

// Error boundary to catch Plasmic data context errors (e.g. accessing
// properties on undefined when dynamic data hasn't loaded yet)
class PlasmicErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; retries: number }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, retries: 0 };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // On logge le message ET la stack du composant fautif : indispensable pour
    // identifier QUELLE donnée dynamique plante (ex. page /annonces qui "saute").
    console.warn(
      `PLASMIC: Render error caught by boundary (retry ${this.state.retries}):`,
      error?.message,
      "\n",
      error?.stack,
      "\nComponent stack:",
      info?.componentStack
    );
  }
  componentDidUpdate(prevProps: { children: React.ReactNode }) {
    // Nouveau contenu de page → on réarme le boundary (et le compteur).
    if (this.state.hasError && prevProps.children !== this.props.children) {
      this.setState({ hasError: false, retries: 0 });
    }
  }
  render() {
    if (this.state.hasError) {
      // Les erreurs Plasmic viennent souvent d'une donnée dynamique
      // (session/Supabase, ex. stripe_info) pas encore prête → on retente.
      // MAIS si l'erreur persiste, ne JAMAIS rester sur un écran blanc sans
      // menu (l'utilisateur se retrouve "bloqué", impossible d'accéder à son
      // espace) : on affiche un repli avec une sortie vers l'accueil.
      //
      // Pendant les retries on affiche un loader STABLE (et non `null`) : sinon
      // le contenu apparaît puis disparaît à chaque tentative → effet "la page
      // saute". On laisse aussi plus de temps (8×400ms) car la requête Supabase
      // peut être lente au démarrage à froid dans la WebView Capacitor.
      if (this.state.retries < 8) {
        setTimeout(
          () =>
            this.setState((s) => ({ hasError: false, retries: s.retries + 1 })),
          400
        );
        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "100dvh",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                border: "3px solid #e0e0e0",
                borderTopColor: "#002400",
                borderRadius: "50%",
                animation: "plasmic-eb-spin 0.8s linear infinite",
              }}
            />
            <style>{"@keyframes plasmic-eb-spin{to{transform:rotate(360deg)}}"}</style>
          </div>
        );
      }
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            minHeight: "100dvh",
            padding: 24,
            textAlign: "center",
            fontFamily: "DM Sans, sans-serif",
            color: "#505050",
          }}
        >
          <p style={{ fontSize: 16, margin: 0 }}>
            Un problème est survenu lors du chargement de cette page.
          </p>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") window.location.href = "/";
            }}
            style={{
              border: "none",
              borderRadius: 8,
              padding: "12px 20px",
              fontSize: 16,
              cursor: "pointer",
              background: "#002400",
              color: "#ffffff",
            }}
          >
            {"Retour à l'accueil"}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function PlasmicLoaderPage(props: {
  plasmicData?: ComponentRenderData;
  queryCache?: Record<string, unknown>;
}) {
  const { plasmicData, queryCache } = props;
  const router = useRouter();
  if (!plasmicData || plasmicData.entryCompMetas.length === 0) {
    return <NextError statusCode={404} />;
  }
  const pageMeta = plasmicData.entryCompMetas[0];
  return (
    <PlasmicRootProvider
      loader={PLASMIC}
      prefetchedData={plasmicData}
      prefetchedQueryData={queryCache}
      pageRoute={pageMeta.path}
      pageParams={pageMeta.params}
      pageQuery={router.query}
    >
      <PlasmicErrorBoundary>
        <PlasmicComponent component={pageMeta.displayName} />
      </PlasmicErrorBoundary>
    </PlasmicRootProvider>
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
  const { catchall } = context.params ?? {};
  const plasmicPath =
    typeof catchall === "string"
      ? catchall
      : Array.isArray(catchall)
      ? `/${catchall.join("/")}`
      : "/";
  const plasmicData = await PLASMIC.maybeFetchComponentData(plasmicPath);
  if (!plasmicData) {
    // non-Plasmic catch-all
    return { props: {} };
  }
  const isCapacitorBuild = process.env.CAPACITOR_BUILD === "true";

  // Skip extractPlasmicQueryData entirely:
  // All pages depend on dynamic Supabase data (user session, job offers, etc.)
  // which is unavailable during SSR, causing errors and 10-17s wasted time.
  // Data is fetched client-side by PlasmicRootProvider automatically.
  return {
    props: { plasmicData, queryCache: {} },
    ...(!isCapacitorBuild && { revalidate: 300 }),
  };
};

// Plasmic pages overridden by a physical file in /pages must be excluded from
// the catchall's static paths, otherwise next export fails with
// "Conflicting paths returned from getStaticPaths".
const PLASMIC_OVERRIDES = new Set<string>(["/parametres-abonnement"]);

export const getStaticPaths: GetStaticPaths = async () => {
  // Pour l'export statique (Capacitor), on doit générer les pages à l'avance
  // fallback: false est requis pour next export
  const isCapacitorBuild = process.env.CAPACITOR_BUILD === "true";

  if (isCapacitorBuild) {
    // Récupérer toutes les pages Plasmic pour l'export statique
    const pageModules = await PLASMIC.fetchPages();
    return {
      paths: pageModules
        .filter((mod) => !PLASMIC_OVERRIDES.has(mod.path))
        .map((mod) => ({
          params: {
            catchall:
              mod.path === "/" ? undefined : mod.path.substring(1).split("/"),
          },
        })),
      fallback: false,
    };
  }

  // En mode normal (serveur), utiliser ISR
  return {
    paths: [],
    fallback: "blocking",
  };
};
