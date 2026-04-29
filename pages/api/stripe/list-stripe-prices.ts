// pages/api/stripe/list-stripe-prices.ts
//
// Returns the active Stripe price for each known product (subscriptions
// Basic/Premium and recharges Classic/Last Minute/Boost) by joining the
// product names stored in Supabase (`stripe_products`) with Stripe's API.
import type { NextApiRequest, NextApiResponse } from "next";
import stripe from "../../../lib/stripeServer";
import { supabaseServer } from "../../../lib/supabaseServer";
import { corsPolicy } from "../../../lib/middleware/corsPolicy";

type PriceInfo = {
  productId: string;
  priceId: string;
  amount: number | null;
  currency: string;
  interval: string | null;
};

const SUBSCRIPTION_NAMES = ["basic", "premium"] as const;
const RECHARGE_NAMES = ["classic", "minute", "boost"] as const;
type SubscriptionKey = (typeof SUBSCRIPTION_NAMES)[number];
type RechargeKey = (typeof RECHARGE_NAMES)[number];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await corsPolicy(req, res);

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { data: products, error } = await supabaseServer
      .from("stripe_products")
      .select("product_id, name");

    if (error) throw error;

    const findProductId = (target: string): string | undefined =>
      products?.find((p) => p.name?.toLowerCase() === target)?.product_id;

    const fetchActivePrice = async (productId?: string): Promise<PriceInfo | null> => {
      if (!productId) return null;
      try {
        const prices = await stripe.prices.list({
          product: productId,
          active: true,
          limit: 1,
        });
        const price = prices.data[0];
        if (!price) return null;
        return {
          productId,
          priceId: price.id,
          amount: price.unit_amount,
          currency: price.currency,
          interval: price.recurring?.interval ?? null,
        };
      } catch (err: any) {
        // A missing/archived product on the current Stripe account (e.g. a
        // prod_id stored in Supabase that doesn't exist in test mode) should
        // not break the whole endpoint — just skip this entry.
        console.warn(
          `list-stripe-prices: skipping product ${productId} — ${err?.message ?? "unknown error"}`
        );
        return null;
      }
    };

    const subscriptionEntries = await Promise.all(
      SUBSCRIPTION_NAMES.map(async (name) => {
        const info = await fetchActivePrice(findProductId(name));
        return [name, info] as const;
      })
    );
    const rechargeEntries = await Promise.all(
      RECHARGE_NAMES.map(async (name) => {
        const info = await fetchActivePrice(findProductId(name));
        return [name, info] as const;
      })
    );

    const subscriptions = Object.fromEntries(subscriptionEntries) as Record<
      SubscriptionKey,
      PriceInfo | null
    >;
    const recharges = Object.fromEntries(rechargeEntries) as Record<
      RechargeKey,
      PriceInfo | null
    >;

    return res.status(200).json({ subscriptions, recharges });
  } catch (err: any) {
    console.error("Erreur list-stripe-prices :", err);
    return res.status(500).json({ error: err.message || "Erreur serveur" });
  }
}
