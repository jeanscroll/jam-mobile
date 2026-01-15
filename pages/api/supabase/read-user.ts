import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { corsPolicy } from '../../../lib/middleware/corsPolicy';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await corsPolicy(req, res);

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

    const authHeader = req.headers.authorization;
    let token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    
    if (token?.startsWith('base64-')) {
      token = token.slice(7);
    }

    console.log('Authorization header after:', req.headers.authorization);
    if (!token) return res.status(401).json({ error: 'Authorization token missing' });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('Erreur d\'authentification:', authError);
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!user) {
      console.log('Aucun utilisateur trouvé avec ce token');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

    const isAdmin = user.user_metadata?.nickname === 'gagou';
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const { data, error } = await adminSupabase.auth.admin.listUsers();
    if (error) return res.status(500).json({ error: error.message });

    const users = data.users.map(u => ({
      id: u.id,
      email: u.email,
      last_sign_in_at: u.last_sign_in_at,
    }));

    return res.status(200).json(users);
  } catch (err: any) {
    console.error('API error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
