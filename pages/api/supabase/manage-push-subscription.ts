import type { NextApiRequest, NextApiResponse } from 'next';
import { corsPolicy } from '../../../lib/middleware/corsPolicy';
import { supabaseServer } from '../../../lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await corsPolicy(req, res);

  const { user_id, subscription } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: "user_id manquant" });
  }

  try {
    switch (req.method) {
      case 'POST': {
        if (!subscription) {
          return res.status(400).json({ error: "Données de subscription manquantes" });
        }

        const { data, error } = await supabaseServer
          .from('subscriptions')
          .upsert(
            {
              user_id,
              subscription,
              pushStatus: true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );

        if (error) {
          console.error("Erreur lors du upsert:", error);
          return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ success: true, data });
      }

      case 'DELETE': {
        const { error } = await supabaseServer
          .from('subscriptions')
          .update({
            subscription: null,
            pushStatus: false,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user_id);

        if (error) {
          console.error("Erreur lors de la suppression:", error);
          return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ success: true });
      }

      default:
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }
  } catch (err) {
    console.error("Erreur serveur:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
