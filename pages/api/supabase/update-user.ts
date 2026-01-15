// pages/api/supabase_crud/update_user.ts
import { corsPolicy } from '../../../lib/middleware/corsPolicy';
import { adminAccess } from '../../../lib/middleware/adminAccess';
import { supabaseServer } from '../../../lib/supabaseServer';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await corsPolicy(req, res);

  return adminAccess(req, res, async () => {
    try {

      if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
      }

      if (req.method !== 'PUT') {
        res.status(405).end('Method Not Allowed');
        return;
      }

      const { id, updates } = req.body;
      const { email, role, client_id, first_name, last_name } = updates;

      if (!id || !email || !first_name || !last_name) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const { data: updatedUser, error: updateError } = await supabaseServer.auth.admin.updateUserById(id, {
        email,
        user_metadata: { role, client_id, first_name, last_name, email },
      });

      if (updateError) {
        console.error('updateUser error:', updateError);
        res.status(500).json({ error: updateError.message });
        return;
      }

      res.status(200).json({ success: true, updatedUser });
    } catch (err: any) {
      console.error('API handler error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
}
