// pages/api/stripe/manage-subscription.ts
import type { NextApiRequest, NextApiResponse } from "next";
import stripe from "../../../lib/stripeServer";
import { supabaseServer } from "../../../lib/supabaseServer";
import { corsPolicy } from "../../../lib/middleware/corsPolicy";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await corsPolicy(req, res);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { action, priceId, customerId, customerEmail, successUrl, cancelUrl } = req.body;

  if (!action) {
    return res.status(400).json({ error: "Action requise" });
  }

  try {
    switch (action) {
      case "create": {
        if (!priceId || !successUrl || !cancelUrl) {
          return res.status(400).json({ error: "Paramètres requis manquants pour 'create'" });
        }

        const sessionPayload: any = {
          mode: "subscription",
          line_items: [{ price: priceId, quantity: 1 }],
          success_url: `${req.headers.origin}/${successUrl}`,
          cancel_url: `${req.headers.origin}/${cancelUrl}`,
        };

        if (customerId) {
          sessionPayload.customer = customerId;
        } else if (customerEmail) {
          sessionPayload.customer_email = customerEmail;
        } else {
          return res.status(400).json({ error: "customerId ou customerEmail requis pour 'create'" });
        }

        const session = await stripe.checkout.sessions.create(sessionPayload);

        return res.status(200).json({ sessionId: session.id });
      }

      case "update": {
        if (!customerId || !priceId) {
          return res.status(400).json({ error: "customerId et priceId requis pour 'update'" });
        }

        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: "active",
          limit: 1,
        });

        const subscription = subscriptions.data[0];
        if (!subscription) {
          return res.status(404).json({ error: "Abonnement actif non trouvé" });
        }

        const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
          items: [{
            id: subscription.items.data[0].id,
            price: priceId,
          }],
          proration_behavior: "create_prorations",
        });

        const price = await stripe.prices.retrieve(priceId);
        const productId = typeof price.product === "string" ? price.product : price.product.id;

        // Mets à jour Supabase
        const { error } = await supabaseServer
          .from("stripe_info")
          .update({ 
            price_id: priceId,
            product_id: productId,
            status: updatedSubscription.status
          })
          .eq("customer_id", customerId);

          if (error) {
          console.error("Erreur Supabase :", error);
          return res.status(500).json({ error: "Erreur lors de la mise à jour Supabase" });
        }

        return res.status(200).json({
          success: true,
          subscriptionId: updatedSubscription.id,
          priceId: priceId,
          status: updatedSubscription.status,
        });

      }

      case "cancel": {
        if (!customerId) {
          return res.status(400).json({ error: "customerId requis pour 'cancel'" });
        }

        const subscriptions = await stripe.subscriptions.list({ customer: customerId, limit: 1 });
        const subscription = subscriptions.data[0];
        if (!subscription) {
          return res.status(404).json({ error: "Aucune souscription trouvée" });
        }

        await stripe.subscriptions.update(subscription.id, {
          cancel_at_period_end: true,
        });

        const { error } = await supabaseServer
          .from("stripe_info")
          .update({ status: "cancel" })
          .eq("customer_id", customerId);

        if (error) {
          console.error("Erreur Supabase lors du cancel:", error);
          return res.status(500).json({ error: "Erreur lors de la mise à jour Supabase" });
        }

        return res.status(200).json({
          success: true,
          subscriptionId: subscription.id,
          status: "cancel",
        });
      }

      default:
        return res.status(400).json({ error: `Action '${action}' inconnue` });
    }
  } catch (err: any) {
    console.error("Erreur Stripe:", err);
    return res.status(500).json({ error: err.message || "Erreur serveur" });
  }
}
