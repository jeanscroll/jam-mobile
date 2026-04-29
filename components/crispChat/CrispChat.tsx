'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/router';

declare global {
  interface Window {
    $crisp: any[];
    CRISP_WEBSITE_ID: string;
  }
}

const DEFAULT_DISABLED_ROUTES: string[] = [];

interface CrispChatProps {
  /**
   * Routes (Next.js pathname format, e.g. "/parametres-abonnement") on which
   * the Crisp widget should be hidden. The script is still loaded once globally
   * so the widget stays available on all other routes.
   */
  disabledRoutes?: string[];
}

export default function CrispChat({
  disabledRoutes = DEFAULT_DISABLED_ROUTES,
}: CrispChatProps) {
  const router = useRouter();
  const isDisabled = disabledRoutes.includes(router.pathname);

  // Inject the Crisp script once. We skip the initial load only if the very
  // first route is disabled — otherwise we always load it so subsequent route
  // changes can show/hide via the Crisp API instead of remounting.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.$crisp) return; // already loaded
    if (isDisabled) return; // first paint is on a disabled route — skip

    window.$crisp = [];
    window.CRISP_WEBSITE_ID = '96e2b6b1-f24b-4717-bb57-03b14a0f4a29';
    window.$crisp.push(['config', 'position', 'right']);

    const script = document.createElement('script');
    script.src = 'https://client.crisp.chat/l.js';
    script.async = true;
    document.head.appendChild(script);
    // Intentionally not removed on unmount: Crisp doesn't support clean teardown.
  }, [isDisabled]);

  // Show / hide the widget on route changes via Crisp's runtime API.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.$crisp) return;
    window.$crisp.push(['do', isDisabled ? 'chat:hide' : 'chat:show']);
  }, [isDisabled]);

  return null;
}
