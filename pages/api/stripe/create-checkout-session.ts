import type { NextApiRequest, NextApiResponse } from "next";
import stripe from "../../../lib/stripeServer";
import { corsPolicy } from "../../../lib/middleware/corsPolicy";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await corsPolicy(req, res);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { items, client_reference_id, customer_email, success_url, cancel_url } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Invalid items array" });
    }

    const line_items = items
      .filter((item) => item.quantity > 0)
      .map((item) => ({
        price: item.price,
        quantity: item.quantity,
      }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      client_reference_id,
      customer_email,
      allow_promotion_codes: true,
      success_url: `${req.headers.origin}/${success_url}`,
      cancel_url: `${req.headers.origin}/${cancel_url}`,
    });

    res.status(200).json({ sessionId: session.id });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
