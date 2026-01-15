// pages/api/supabase/delete_user.ts
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

      if (req.method !== 'DELETE') {
        res.status(405).end('Method not allowed');
        return;
      }

      const { id } = req.body;

      if (!id) {
        res.status(400).json({ error: 'Missing user id' });
        return;
      }

      const { error: deleteUserError } = await supabaseServer.auth.admin.deleteUser(id);

      if (deleteUserError) {
        console.error("deleteUser error:", deleteUserError);
        res.status(500).json({ error: deleteUserError.message });
        return;
      }

      res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (err: any) {
      console.error("API handler error:", err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
}
