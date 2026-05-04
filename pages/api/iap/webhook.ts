// pages/api/iap/webhook.ts
//
// Receives RevenueCat Server-to-Server webhook events and reflects them in
// the existing Supabase tables (`stripe_info`, `stripe_history`) so the rest
// of the app can stay agnostic to where a purchase came from.
//
// RevenueCat fires events such as:
//   INITIAL_PURCHASE / RENEWAL / PRODUCT_CHANGE   → update subscription row
//   CANCELLATION / EXPIRATION / BILLING_ISSUE     → mark status='cancel'
//   NON_RENEWING_PURCHASE                          → consumable (recharge)
//
// Auth: RevenueCat lets you set a static Authorization header on the webhook.
// We expect `Authorization: Bearer ${REVENUECAT_WEBHOOK_SECRET}`.
//
// Idempotency: we dedupe on `event.id` via an `iap_event_log` table (to be
// created in Supabase). Until that table exists the dedup is a soft no-op.

import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseServer } from "../../../lib/supabaseServer";

type RcEventType =
  | "INITIAL_PURCHASE"
  | "RENEWAL"
  | "PRODUCT_CHANGE"
  | "CANCELLATION"
  | "EXPIRATION"
  | "BILLING_ISSUE"
  | "NON_RENEWING_PURCHASE"
  | "UNCANCELLATION"
  | "TRANSFER"
  | "SUBSCRIBER_ALIAS"
  | "SUBSCRIPTION_PAUSED"
  | "TEST";

interface RcEvent {
  id: string;
  type: RcEventType;
  app_user_id: string; // = Supabase user.id (set via Purchases.logIn)
  original_app_user_id?: string;
  product_id: string; // raw Apple StoreKit identifier (e.g. jam_basic_monthly)
  period_type?: "NORMAL" | "TRIAL" | "INTRO" | "PROMOTIONAL";
  purchased_at_ms?: number;
  expiration_at_ms?: number | null;
  store?: "APP_STORE" | "PLAY_STORE";
  transaction_id?: string;
  original_transaction_id?: string;
  price_in_purchased_currency?: number; // unit_amount in customer currency
  currency?: string;
  environment?: "SANDBOX" | "PRODUCTION";
  presented_offering_id?: string | null;
}

interface RcWebhookBody {
  api_version: string;
  event: RcEvent;
}

const SUBSCRIPTION_PRODUCT_NAME: Record<string, string> = {
  jam_basic_monthly: "Basic",
  jam_premium_monthly: "Premium",
};

const RECHARGE_COLUMN: Record<
  string,
  "recharge_classic" | "recharge_lastminute" | "recharge_boost"
> = {
  jam_recharge_classic: "recharge_classic",
  jam_recharge_lastminute: "recharge_lastminute",
  jam_recharge_boost: "recharge_boost",
};

function verifyAuth(req: NextApiRequest): boolean {
  const expected = process.env.REVENUECAT_WEBHOOK_SECRET;
  if (!expected) {
    // No secret configured yet → accept (dev / before RC dashboard wiring).
    return true;
  }
  const header = req.headers.authorization ?? "";
  return header === `Bearer ${expected}`;
}

async function resolveStripeProductId(
  productAppleId: string
): Promise<string | null> {
  const internalName = SUBSCRIPTION_PRODUCT_NAME[productAppleId];
  if (!internalName) return null;

  const { data } = await supabaseServer
    .from("stripe_products")
    .select("product_id, name")
    .ilike("name", internalName)
    .maybeSingle();

  return (data?.product_id as string | undefined) ?? null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!verifyAuth(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const body = req.body as RcWebhookBody | undefined;
  const event = body?.event;
  if (!event || !event.app_user_id || !event.type) {
    return res.status(400).json({ error: "Malformed event payload" });
  }

  // Dedup by event id (no-op until iap_event_log table exists).
  try {
    const dedup = await supabaseServer
      .from("iap_event_log")
      .insert({ event_id: event.id })
      .select("event_id")
      .maybeSingle();
    if (dedup.error?.code === "23505") {
      return res.status(200).json({ ok: true, deduped: true });
    }
  } catch {
    /* table may not exist yet — ignore */
  }

  try {
    const userId = event.app_user_id;
    const purchasedAt = event.purchased_at_ms
      ? new Date(event.purchased_at_ms).toISOString()
      : new Date().toISOString();
    const expiresAt = event.expiration_at_ms
      ? new Date(event.expiration_at_ms).toISOString()
      : null;

    switch (event.type) {
      case "INITIAL_PURCHASE":
      case "RENEWAL":
      case "PRODUCT_CHANGE":
      case "UNCANCELLATION": {
        const stripeProductId = await resolveStripeProductId(event.product_id);
        await supabaseServer
          .from("stripe_info")
          .upsert(
            {
              user_id: userId,
              status: "active",
              product_id: stripeProductId, // legacy column for app gating
              iap_platform: "ios",
              iap_app_user_id: event.original_app_user_id ?? userId,
              iap_product_id: event.product_id,
              iap_transaction_id:
                event.original_transaction_id ?? event.transaction_id ?? null,
              iap_expires_at: expiresAt,
              iap_period_type: event.period_type?.toLowerCase() ?? "normal",
            },
            { onConflict: "user_id" }
          );
        break;
      }

      case "CANCELLATION":
      case "EXPIRATION":
      case "BILLING_ISSUE":
      case "SUBSCRIPTION_PAUSED": {
        await supabaseServer
          .from("stripe_info")
          .update({
            status: "cancel",
            iap_expires_at: expiresAt,
          })
          .eq("user_id", userId);
        break;
      }

      case "NON_RENEWING_PURCHASE": {
        // Consumable — increment the matching counter.
        const column = RECHARGE_COLUMN[event.product_id];
        if (!column) {
          console.warn(
            `[iap-webhook] Unknown consumable product: ${event.product_id}`
          );
          break;
        }
        const { data: row } = await supabaseServer
          .from("stripe_info")
          .select(`${column}`)
          .eq("user_id", userId)
          .maybeSingle();
        const current = Number((row as any)?.[column] ?? 0);
        await supabaseServer
          .from("stripe_info")
          .upsert(
            {
              user_id: userId,
              [column]: current + 1,
              iap_platform: "ios",
            },
            { onConflict: "user_id" }
          );
        break;
      }

      default:
        // TEST / TRANSFER / SUBSCRIBER_ALIAS — no DB write needed.
        break;
    }

    // Mirror in stripe_history so the user sees the purchase in their feed.
    if (
      event.type === "INITIAL_PURCHASE" ||
      event.type === "RENEWAL" ||
      event.type === "NON_RENEWING_PURCHASE" ||
      event.type === "PRODUCT_CHANGE"
    ) {
      const amount =
        typeof event.price_in_purchased_currency === "number"
          ? event.price_in_purchased_currency
          : null;
      await supabaseServer.from("stripe_history").insert({
        purchased_at: purchasedAt,
        total_amount: amount,
        invoice_url: null,
        invoice_title: `Apple In-App Purchase · ${event.product_id}`,
        products: [{ product_id: event.product_id, quantity: 1 }],
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("[iap-webhook] handler error:", err);
    return res.status(500).json({ error: err.message ?? "Server error" });
  }
}
