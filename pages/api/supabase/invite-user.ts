// pages/api/supabase/invite_user.ts
import { corsPolicy } from '../../../lib/middleware/corsPolicy';
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseServer } from '../../../lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await corsPolicy(req, res)

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Méthode non autorisée" });
    }

    const { accessToken, refreshToken, password } = req.body;

    if (!accessToken || !refreshToken || !password) {
        return res.status(400).json({ error: "Champs requis manquants" });
    }

    const { error: sessionError } = await supabaseServer.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
    });

    if (sessionError) {
        return res.status(401).json({ error: sessionError.message });
    }

    const { error: updateError } = await supabaseServer.auth.updateUser({ password });

    if (updateError) {
        return res.status(500).json({ error: updateError.message });
    }

    return res.status(200).json({ success: true });

}
