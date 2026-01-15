import type { NextApiRequest, NextApiResponse } from "next";
import stripe from "../../../lib/stripeServer";
import { corsPolicy } from "../../../lib/middleware/corsPolicy";
import { supabaseServer } from "../../../lib/supabaseServer";

async function getSubscriptionData(session_id: string) {

  // Récupérer la session checkout Stripe
  const session = await stripe.checkout.sessions.retrieve(session_id);
  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;

  let userEmail = session.customer_email;

  if (!userEmail) {
    const customer = await stripe.customers.retrieve(customerId);
    if ("email" in customer && customer.email) {
      userEmail = customer.email;
    } else {
      throw new Error("Email client introuvable ou client supprimé");
    }
  }

  if (!customerId || !subscriptionId || !userEmail) {
    throw new Error("Données manquantes dans la session Stripe");
  }

  // Récupérer l'abonnement complet Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const status = subscription.status;
  const price = subscription.items.data[0].price;
  const priceId = price.id;
  const productId = typeof price.product === "string" ? price.product : price.product.id;

  // Récupérer le user_id depuis Supabase via email
  const { data: user, error: userError } = await supabaseServer
    .schema("public")
    .from("user")
    .select("id")
    .eq("email", userEmail)
    .single();

  if (userError || !user) {
    throw new Error("Utilisateur non trouvé dans Supabase");
  }

  return {
    customerId,
    subscriptionId,
    userEmail,
    priceId,
    productId,
    status,
    userId: user.id,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await corsPolicy(req, res);

  const { session_id, action, classic, lastminute, boost, customer_id } = req.query;

  if (!action || typeof action !== "string") {
    return res.status(400).json({ error: "Action manquante" });
  }

  try {
    if (action === "update") {
      if (!customer_id || typeof customer_id !== "string") {
        return res.status(400).json({ error: "Customer ID manquant" });
      }

      const recharge_boost = Number(boost) || 0;
      const recharge_classic = Number(classic) || 0;
      const recharge_lastminute = Number(lastminute) || 0;

      const { error } = await supabaseServer
        .from("stripe_info")
        .update({
          recharge_boost,
          recharge_classic,
          recharge_lastminute,
        })
        .eq("customer_id", customer_id);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: "Ligne stripe_info mise à jour",
      });
    }

    if (action === "create") {
      if (!session_id || typeof session_id !== "string") {
        return res.status(400).json({ error: "Session ID manquant" });
      }

      const data = await getSubscriptionData(session_id);

      const recharge_boost = 0;
      const recharge_classic = 0;
      const recharge_lastminute = 0;

      const { error } = await supabaseServer.from("stripe_info").upsert(
        {
          customer_id: data.customerId,
          price_id: data.priceId,
          product_id: data.productId,
          recharge_boost,
          recharge_classic,
          recharge_lastminute,
          session_id: session_id,
          status: data.status,
          subscription_id: data.subscriptionId,
          user_id: data.userId,
        },
        {
          onConflict: "customer_id",
        }
      );

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: "Ligne stripe_info créée",
      });
    }

    return res.status(400).json({ error: "Action non supportée" });
  } catch (err: any) {
    console.error("Erreur validate-subscription :", err);
    return res.status(500).json({ error: err.message });
  }
}
