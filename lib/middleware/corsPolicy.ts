import Cors from 'nextjs-cors';
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
].filter(Boolean);

export async function corsPolicy(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {

  await Cors(req, res, {
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    optionsSuccessStatus: 200,
  });
}
