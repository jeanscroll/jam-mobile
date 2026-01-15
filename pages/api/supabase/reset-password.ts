// pages/api/supabase/reset_password.ts
import { corsPolicy } from '../../../lib/middleware/corsPolicy';
import { adminAccess } from '../../../lib/middleware/adminAccess';
import { supabaseServer } from '../../../lib/supabaseServer';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await corsPolicy(req, res);

  return adminAccess(req, res, async () => {
    try {
      if (req.method !== 'PUT') {
        res.status(405).end('Method Not Allowed');
        return;
      }

      const { id, newPassword } = req.body;

      if (!id || !newPassword) {
        res.status(400).json({ error: 'Missing userId or newPassword' });
        return;
      }

      const { data, error } = await supabaseServer.auth.admin.updateUserById(id, {
        password: newPassword,
      });

      if (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ error: error.message });
        return;
      }

      res.status(200).json({ success: true, message: 'Password reset successful' });
    } catch (error) {
      console.error('Error in reset_password API:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
}
