import type { NextApiRequest, NextApiResponse } from "next";
import type Stripe from "stripe";
import stripe from "../../../lib/stripeServer";
import { corsPolicy } from "../../../lib/middleware/corsPolicy";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await corsPolicy(req, res);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: "Missing sessionId" });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["invoice"],
    });

    const invoice = session.invoice as Stripe.Invoice;

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.status(200).json({
      invoice_url: invoice.invoice_pdf,
      invoice_number: invoice.number,
      total_amount: invoice.total / 100,
      currency: invoice.currency,
    });
  } catch (err: any) {
    console.error("❌ Erreur Stripe invoice :", err);
    res.status(500).json({ error: "Failed to retrieve invoice" });
  }
}
