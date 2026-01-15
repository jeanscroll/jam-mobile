// lib/supabaseServer.ts
// ⚠️ Supabase Server Client
// Utilise la Service Role Key → accès complet (bypass RLS)
// À utiliser uniquement côté serveur / API routes
import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase environment variables');
}

export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
