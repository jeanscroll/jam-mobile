// lib/middleware/adminAccess.ts
import { supabase } from '@/lib/supabaseClient';
import type { NextApiRequest, NextApiResponse } from 'next';

export async function adminAccess(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => Promise<void>
) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Missing token' });
    return;
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  const role = user.user_metadata?.role;
  const isAllowed = role === 'admin' ? true :
                    role === 'merchant' ? true : 
                    false;

  if (!isAllowed) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  await next();
}
