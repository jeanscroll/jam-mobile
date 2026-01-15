import { corsPolicy } from '../../../lib/middleware/corsPolicy';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await corsPolicy(req, res);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { lat, lon } = req.body;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude et longitude requises' });
  }

  try {
    const supabaseFunctionUrl =
      `https://${process.env.NEXT_PUBLIC_SUPABASE_ID}.supabase.co/functions/v1/get-merchants-nearby`;

    const response = await fetch(supabaseFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ lat, lon }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || 'Erreur Supabase Function' });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Erreur appel Edge Function :', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
