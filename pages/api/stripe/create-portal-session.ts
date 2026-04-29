// pages/api/stripe/create-portal-session.ts
import type { NextApiRequest, NextApiResponse } from "next";
import stripe from "../../../lib/stripeServer";
import { corsPolicy } from "../../../lib/middleware/corsPolicy";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await corsPolicy(req, res);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { customerId, returnUrl } = req.body ?? {};

  if (!customerId || typeof customerId !== "string") {
    return res.status(400).json({ error: "customerId requis" });
  }

  try {
    const fallbackOrigin = req.headers.origin || `https://${req.headers.host}`;
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url:
        typeof returnUrl === "string" && returnUrl.length > 0
          ? returnUrl
          : `${fallbackOrigin}/parametres-abonnement`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error("Erreur create-portal-session :", err);
    return res.status(500).json({ error: err.message || "Erreur serveur" });
  }
}
