// pages/api/supabase_crud/create_user.ts
import { corsPolicy } from '../../../lib/middleware/corsPolicy';
import { adminAccess } from '../../../lib/middleware/adminAccess';
import { supabaseServer } from '../../../lib/supabaseServer';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await corsPolicy(req, res);

  return adminAccess(req, res, async () => {
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).end('Method not allowed');
      return;
    }

    const { email, role = 'user', client_id, first_name, last_name } = req.body;

    if (!email || !first_name || !last_name) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Créer l'utilisateur sans inviter
    // const { data: user, error } = await supabaseServer.auth.admin.createUser({
    //   email,
    //   user_metadata: { role, client_id, first_name, last_name },
    //   email_confirm: false,
    // });

    // if (error) {
    //   console.error("createUser error:", error);
    //   res.status(500).json({ error: error.message });
    //   return;
    // }

    // Envoyer l'invitation par email à l'utilisateur
    const { data, error: inviteError } = await supabaseServer.auth.admin.inviteUserByEmail(email, {
      data: { role, client_id, first_name, last_name },
      redirectTo: `${process.env.NEXT_PUBLIC_STAGING_PROJECT_URL}/reset-password`,
    });

    if (inviteError) {
      console.error("inviteUserByEmail error:", inviteError);
      res.status(500).json({ error: inviteError.message });
      return;
    }

    res.status(200).json({ success: true, user: data.user });
  });
}
