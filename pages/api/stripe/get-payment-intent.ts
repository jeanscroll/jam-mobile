import type { NextApiRequest, NextApiResponse } from "next";
import stripe from "../../../lib/stripeServer";
import { corsPolicy } from "../../../lib/middleware/corsPolicy";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await corsPolicy(req, res);

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sessionId = req.query.session_id as string;
  if (!sessionId) {
    return res.status(400).json({ error: "Missing session_id" });
  }

  try {
    // Récupère la session Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const paymentIntentId = session.payment_intent as string;
    if (!paymentIntentId) {
      return res.status(404).json({ error: "No payment intent found" });
    }

    // Récupère le PaymentIntent avec le champ latest_charge
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    const chargeId = paymentIntent.latest_charge as string;
    if (!chargeId) {
      return res.status(404).json({ error: "No charge found for this payment intent" });
    }

    // Récupère la charge pour obtenir le reçu
    const charge = await stripe.charges.retrieve(chargeId);

    res.status(200).json({
      receiptUrl: charge.receipt_url,
      receiptTitle: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    });
  } catch (err: any) {
    console.error("Erreur Stripe paymentIntent :", err);
    res.status(500).json({ error: err.message });
  }
}
