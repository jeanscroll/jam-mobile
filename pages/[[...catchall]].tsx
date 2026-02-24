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
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.warn("PLASMIC: Render error caught by boundary:", error.message);
  }
  componentDidUpdate(prevProps: { children: React.ReactNode }) {
    if (this.state.hasError && prevProps.children !== this.props.children) {
      this.setState({ hasError: false });
    }
  }
  render() {
    if (this.state.hasError) {
      // Re-render on next tick when data becomes available
      setTimeout(() => this.setState({ hasError: false }), 100);
      return null;
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
  const plasmicPath = typeof catchall === 'string' ? catchall : Array.isArray(catchall) ? `/${catchall.join('/')}` : '/';
  const plasmicData = await PLASMIC.maybeFetchComponentData(plasmicPath);
  if (!plasmicData) {
    // non-Plasmic catch-all
    return { props: {} };
  }
  const isCapacitorBuild = process.env.CAPACITOR_BUILD === 'true';

  // Skip extractPlasmicQueryData entirely:
  // All pages depend on dynamic Supabase data (user session, job offers, etc.)
  // which is unavailable during SSR, causing errors and 10-17s wasted time.
  // Data is fetched client-side by PlasmicRootProvider automatically.
  return {
    props: { plasmicData, queryCache: {} },
    ...(!isCapacitorBuild && { revalidate: 300 }),
  };
}

export const getStaticPaths: GetStaticPaths = async () => {
  // Pour l'export statique (Capacitor), on doit générer les pages à l'avance
  // fallback: false est requis pour next export
  const isCapacitorBuild = process.env.CAPACITOR_BUILD === 'true';

  if (isCapacitorBuild) {
    // Récupérer toutes les pages Plasmic pour l'export statique
    const pageModules = await PLASMIC.fetchPages();
    return {
      paths: pageModules.map((mod) => ({
        params: { catchall: mod.path === '/' ? undefined : mod.path.substring(1).split('/') },
      })),
      fallback: false,
    };
  }

  // En mode normal (serveur), utiliser ISR
  return {
    paths: [],
    fallback: "blocking",
  };
}