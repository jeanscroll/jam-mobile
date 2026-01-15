// pages/api/supabase_crud/update_table.ts
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

      if (req.method !== 'POST') {
        res.status(405).end('Method Not Allowed');
        return;
      }

      const { table, insert } = req.body;

      if (!table || !insert || typeof insert !== 'object') {
        res.status(400).json({ error: 'Missing or invalid parameters' });
        return;
      }

      const { error } = await supabaseServer
        .from(table)
        .insert(insert)

      if (error) {
        console.error(`Error updating table ${table}:`, error);
        res.status(500).json({ error: error.message });
        return;
      }

      res.status(200).json({ success: true });
    } catch (err: any) {
      console.error('insert-table error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
}
