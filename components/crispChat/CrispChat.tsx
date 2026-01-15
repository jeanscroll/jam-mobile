'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    $crisp: any[];
    CRISP_WEBSITE_ID: string;
  }
}

export default function CrispChat() {
  useEffect(() => {
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = '96e2b6b1-f24b-4717-bb57-03b14a0f4a29';
    window.$crisp.push(['config', 'position', 'right']);

    const script = document.createElement('script');
    script.src = 'https://client.crisp.chat/l.js';
    script.async = true;

    document.head.appendChild(script);
  }, []);

  return null;
}
