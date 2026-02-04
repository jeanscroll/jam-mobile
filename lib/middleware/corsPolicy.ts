import type { NextApiRequest, NextApiResponse } from 'next';

const allowedOrigins = [
  `http://${process.env.LOCALHOST}:${process.env.PROJECT_PORT}`,
  'https://studio.plasmic.app',
  process.env.NEXT_PUBLIC_PROJECT_URL || '',
  process.env.NEXT_PUBLIC_STAGING_PROJECT_URL || '',
  "https://jam-staging.agence-scroll.com",
  "https://jam.agence-scroll.com",
  "https://job-around-me.com",
  "https://www.job-around-me.com",
  // Capacitor native app origins
  "https://localhost",
  "capacitor://localhost",
  "http://localhost",
].filter(Boolean);

export async function corsPolicy(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<boolean> {
  const origin = req.headers.origin;

  // Log pour debug
  console.log('CORS request from origin:', origin);

  // Vérifier si l'origine est autorisée
  const isAllowed = !origin || allowedOrigins.includes(origin);

  if (isAllowed && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Gérer le preflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true; // Indique que la requête est terminée
  }

  if (!isAllowed) {
    res.status(403).json({ error: 'Not allowed by CORS' });
    return true; // Indique que la requête est terminée
  }

  return false; // Continuer avec le handler
}
