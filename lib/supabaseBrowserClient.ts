// // lib/supabaseBrowserClient.ts
// import { createBrowserClient } from '@supabase/ssr';

// export function createClient() {
//   if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
//     throw new Error('Missing Supabase environment variables');
//   }

//   if (typeof window !== 'undefined' && isPlasmicStudio()) {
//     console.warn("⚠️ SupabaseBrowserClient: mode allégé pour Plasmic Studio");
//     // Pas d'options `auth` → évite le blocage du user
//     return createBrowserClient(
//       process.env.NEXT_PUBLIC_SUPABASE_URL,
//       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
//     );
//   }

//   // Mode normal
//   return createBrowserClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
//     {
//       auth: {
//         persistSession: true,
//         detectSessionInUrl: true,
//       },
//       global: { fetch },
//     }
//   );
// }

// function isPlasmicStudio() {
//   return typeof window !== 'undefined' &&
//     window.location.hostname.includes('plasmic.app');
// }
