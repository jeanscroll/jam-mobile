// pages/api/supabase/rpc/[fn].ts
// Proxy générique pour appeler des fonctions RPC Supabase depuis le client
// (notamment les "run code" Plasmic / la WebView Capacitor).
//
// Le nom de la fonction est passé dans l'URL : POST /api/supabase/rpc/{fn}
// Les paramètres nommés de la fonction sont passés dans le body JSON.
//
// Sécurité : on NE bypass PAS la RLS. Le token de l'utilisateur connecté est
// transmis tel quel à Supabase (header Authorization), donc auth.uid() et les
// policies RLS s'appliquent exactement comme pour un supabase.rpc() côté client.
// Si aucun token n'est fourni, on retombe sur la clé anon (accès public).
import { corsPolicy } from '../../../../lib/middleware/corsPolicy';
import type { NextApiRequest, NextApiResponse } from 'next';

// Un nom de fonction Postgres valide : lettres, chiffres, underscore.
// Empêche toute injection dans le path de l'URL REST.
const VALID_FN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await corsPolicy(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return res.status(500).json({ error: 'Configuration Supabase manquante' });
  }

  const fnParam = req.query.fn;
  const fn = Array.isArray(fnParam) ? fnParam[0] : fnParam;

  if (!fn || !VALID_FN.test(fn)) {
    return res.status(400).json({ error: 'Nom de fonction invalide' });
  }

  const args = (req.body ?? {}) as unknown;

  if (typeof args !== 'object' || args === null || Array.isArray(args)) {
    return res.status(400).json({ error: 'Le body doit être un objet de paramètres' });
  }

  // Token de l'utilisateur connecté (transmis par le client). On accepte le
  // header Authorization standard ; repli sur la clé anon si absent.
  const authHeader = req.headers.authorization;
  const userToken =
    authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : anonKey;

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify(args),
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
      return res.status(response.status).json({
        error: (data && (data.message || data.error)) || 'Erreur RPC Supabase',
        details: data,
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error(`Erreur appel RPC "${fn}" :`, err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
