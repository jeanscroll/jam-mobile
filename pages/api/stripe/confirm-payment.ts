import type { NextApiRequest, NextApiResponse } from "next";
import stripe from "../../../lib/stripeServer";
import { corsPolicy } from "../../../lib/middleware/corsPolicy";

interface ConfirmPaymentRequest {
  paymentIntentId: string;
}

interface ConfirmPaymentResponse {
  success: boolean;
  status: string;
  amount?: number;
  currency?: string;
  receiptUrl?: string | null;
  metadata?: Record<string, string>;
  message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ConfirmPaymentResponse | { error: string }>
) {
  const handled = await corsPolicy(req, res);
  if (handled) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { paymentIntentId }: ConfirmPaymentRequest = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: "paymentIntentId is required" });
    }

    // Récupérer le PaymentIntent pour vérifier son statut
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      // Récupérer les détails de la charge pour le reçu
      const charges = paymentIntent.latest_charge;
      let receiptUrl: string | null = null;

      if (charges && typeof charges === "string") {
        const charge = await stripe.charges.retrieve(charges);
        receiptUrl = charge.receipt_url;
      }

      return res.status(200).json({
        success: true,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        receiptUrl,
        metadata: paymentIntent.metadata as Record<string, string>,
      });
    }

    return res.status(200).json({
      success: false,
      status: paymentIntent.status,
      message: `Payment status: ${paymentIntent.status}`,
    });
  } catch (err: unknown) {
    console.error("Error confirming payment:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
