import { corsPolicy } from '../../../lib/middleware/corsPolicy';
import { supabase } from '../../../lib/supabaseClient';
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await corsPolicy(req, res);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      // Identifiants invalides
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Authentification réussie (sans retourner de token ici)
    return res.status(200).json({ message: "Credentials valid" });

  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
