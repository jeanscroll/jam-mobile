import * as React from "react";
import {
  PlasmicComponent,
  extractPlasmicQueryData,
  type ComponentRenderData,
  PlasmicRootProvider,
} from "@plasmicapp/loader-nextjs";
import type { GetStaticPaths, GetStaticProps } from "next";

import Error from "next/error";
import { useRouter } from "next/router";
import { PLASMIC } from "@/plasmic-init";

export default function PlasmicLoaderPage(props: {
  plasmicData?: ComponentRenderData;
  queryCache?: Record<string, unknown>;
}) {
  const { plasmicData, queryCache } = props;
  const router = useRouter();
  if (!plasmicData || plasmicData.entryCompMetas.length === 0) {
    return <Error statusCode={404} />;
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
      <PlasmicComponent component={pageMeta.displayName} />
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
  const pageMeta = plasmicData.entryCompMetas[0];
  // Cache the necessary data fetched for the page
  // Wrapped in try-catch to handle SSR errors in components
  let queryCache: Record<string, unknown> = {};
  try {
    queryCache = await extractPlasmicQueryData(
      <PlasmicRootProvider
        loader={PLASMIC}
        prefetchedData={plasmicData}
        pageRoute={pageMeta.path}
        pageParams={pageMeta.params}
      >
        <PlasmicComponent component={pageMeta.displayName} />
      </PlasmicRootProvider>
    );
  } catch (error) {
    console.warn(`PLASMIC: Failed to extract query data for ${pageMeta.displayName}:`, error);
    // Continue without query cache - data will be fetched client-side
  }
  // Pas de revalidate en mode export statique (Capacitor)
  const isCapacitorBuild = process.env.CAPACITOR_BUILD === 'true';
  if (isCapacitorBuild) {
    return { props: { plasmicData, queryCache } };
  }
  // Use revalidate for ISR in server mode
  return { props: { plasmicData, queryCache }, revalidate: 60 };
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