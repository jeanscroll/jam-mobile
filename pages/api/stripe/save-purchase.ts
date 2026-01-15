import type { NextApiRequest, NextApiResponse } from "next";
import { corsPolicy } from "../../../lib/middleware/corsPolicy";
import { supabaseServer } from "../../../lib/supabaseServer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await corsPolicy(req, res);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { data: products, error } = await supabaseServer
  .from("stripe_products")
  .select("product_id, name");

  if (error) throw error;

  const classic = products?.find(p => p.name === "classic")?.product_id;
  const minute = products?.find(p => p.name === "minute")?.product_id;
  const boost = products?.find(p => p.name === "boost")?.product_id;
  const basic = products?.find(p => p.name === "Basic" || p.name === "basic")?.product_id;
  const premium = products?.find(p => p.name === "Premium" || p.name === "premium")?.product_id;

  try {
  const body = Array.isArray(req.body) ? req.body[0] : req.body;
  const { sessionId, customerId, customerEmail, products, receiptUrl, amount, receiptTitle, subscriptionId, priceId } = body;

    if (!sessionId || !customerId || !products || !Array.isArray(products)) {
      return res.status(400).json({ error: "Invalid data" });
    }

  const updates: Record<string, number | string | null> = {};
  // For subscription products (Basic / Premium) we set these fields on stripe_info
  let subscriptionFields: Record<string, string | null> | null = null;

    for (const product of products) {
      const { product_id, quantity } = product;
      if (!product_id || typeof quantity !== "number") continue;

      switch (product_id) {
        case classic:
          updates.recharge_classic = (Number(updates.recharge_classic) || 0) + quantity;
          break;
        case minute:
          updates.recharge_lastminute = (Number(updates.recharge_lastminute) || 0) + quantity;
          break;
        case boost:
          updates.recharge_boost = (Number(updates.recharge_boost) || 0) + quantity;
          break;
        case basic:
        case premium:
          // Basic and Premium are subscriptions, not recharges.
          // Record subscription-related fields to save on the customer row.
          subscriptionFields = {
            product_id: product_id,
            subscription_id: subscriptionId || null,
            price_id: priceId || null,
            session_id: sessionId || null,
            status: "active",
          };
          break;
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid products found" });
    }

    const { data: existingData, error: fetchError } = await supabaseServer
      .from("stripe_info")
      .select("recharge_classic, recharge_lastminute, recharge_boost, product_id, subscription_id, price_id, session_id, status")
      .eq("customer_id", customerId)
      .single();

    if (fetchError) {
      console.error("Erreur fetch données existantes :", fetchError);
      throw fetchError;
    }

    if (!existingData) {
      return res.status(404).json({ error: "Customer not found in stripe_info" });
    }

    // Ensure numeric arithmetic for recharge counters
    updates.recharge_classic = (Number(existingData.recharge_classic) || 0) + (Number(updates.recharge_classic) || 0);
    updates.recharge_lastminute = (Number(existingData.recharge_lastminute) || 0) + (Number(updates.recharge_lastminute) || 0);
    updates.recharge_boost = (Number(existingData.recharge_boost) || 0) + (Number(updates.recharge_boost) || 0);

    // If a subscription product was purchased, set subscription fields (overwrite existing)
    if (subscriptionFields) {
      updates.product_id = subscriptionFields.product_id;
      updates.subscription_id = subscriptionFields.subscription_id;
      updates.price_id = subscriptionFields.price_id;
      updates.session_id = subscriptionFields.session_id;
      updates.status = subscriptionFields.status;
    }

    const { error: updateError } = await supabaseServer
      .from("stripe_info")
      .update(updates)
      .eq("customer_id", customerId);

    if (updateError) {
      console.error("📛 Erreur de mise à jour Supabase :", updateError);
      throw updateError;
    }

    const historyRecord = {
      customer_id: customerId,
      purchased_at: new Date().toISOString(),
      total_amount: amount,
      invoice_url: receiptUrl || null,
      invoice_title: receiptTitle || null,
      products,
      customer_email: customerEmail || null,
    };

    const { error: insertError } = await supabaseServer
      .from("stripe_history")
      .insert(historyRecord);

    if (insertError) {
      console.error("📛 Erreur insertion historique Supabase :", insertError);
      throw insertError;
    }

    res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("Erreur Supabase :", err);
    res.status(500).json({ error: err?.message || "Unknown error" });
  }
}
