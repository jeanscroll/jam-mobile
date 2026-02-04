import type { NextApiRequest, NextApiResponse } from "next";
import stripe from "../../../lib/stripeServer";
import { corsPolicy } from "../../../lib/middleware/corsPolicy";

interface PaymentIntentRequest {
  amount: number; // En centimes (ex: 1099 pour 10.99€)
  currency?: string;
  customerEmail?: string;
  customerId?: string;
  metadata?: Record<string, string>;
  description?: string;
}

interface PaymentIntentResponse {
  paymentIntentClientSecret: string;
  paymentIntentId: string;
  customerId?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PaymentIntentResponse | { error: string }>
) {
  await corsPolicy(req, res);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      amount,
      currency = "eur",
      customerEmail,
      customerId,
      metadata = {},
      description,
    }: PaymentIntentRequest = req.body;

    // Validation
    if (!amount || amount < 50) {
      return res.status(400).json({ error: "Amount must be at least 50 cents" });
    }

    // Créer ou récupérer le customer
    let customer = customerId;
    if (!customer && customerEmail) {
      const existingCustomers = await stripe.customers.list({
        email: customerEmail,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0].id;
      } else {
        const newCustomer = await stripe.customers.create({
          email: customerEmail,
        });
        customer = newCustomer.id;
      }
    }

    // Créer le PaymentIntent compatible Apple Pay / Google Pay
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer,
      description,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return res.status(200).json({
      paymentIntentClientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
      customerId: customer,
    });
  } catch (err: unknown) {
    console.error("Error creating payment intent:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
