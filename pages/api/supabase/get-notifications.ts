// pages/api/supabase/get-notifications.ts
import { corsPolicy } from '../../../lib/middleware/corsPolicy';
import { adminAccess } from '../../../lib/middleware/adminAccess';
import { supabaseServer } from '../../../lib/supabaseServer';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await corsPolicy(req, res);

  return adminAccess(req, res, async () => {
    try {
      if (req.method === 'GET') {
        // Exemple : récupère uniquement les abonnements actifs (pushStatus = true)
        const { data, error } = await supabaseServer
          .from('subscriptions')
          .select('subscription, user_id, pushStatus, customMessage')
          .eq('pushStatus', true);

        if (error) {
          console.error('Erreur récupération subscriptions:', error);
          res.status(500).json({ error: error.message });
          return;
        }

        // Prépare le format attendu : { subscription, message }
        const notifications = data.map((item: any) => ({
          subscription: item.subscription,
          message: item.customMessage || {
            title: '📣 Le commerçant arrive demain !',
            body: 'Prépare ton panier, il sera là à 9h !',
          },
        }));

        res.status(200).json({ notifications });
        return;
      }

      res.status(405).json({ error: 'Method Not Allowed' });
    } catch (err: any) {
      console.error('get-notifications error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
}
