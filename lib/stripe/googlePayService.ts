import { Stripe, GooglePayEventsEnum } from "@capacitor-community/stripe";
import { Capacitor } from "@capacitor/core";
import { initializeStripeNative } from "./stripeNative";

// Types
export interface PaymentItem {
  label: string;
  amount: number; // En euros (ex: 10.99)
  quantity: number; // Quantité de cet item
}

export interface GooglePayConfig {
  items: PaymentItem[];
  customerEmail?: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

export interface GooglePayResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
}

// Constantes
const MERCHANT_DISPLAY_NAME = "JAM Mobile";
const COUNTRY_CODE = "FR";
const CURRENCY = "EUR";

// Mapping des labels vers les product_ids Stripe
const PRODUCT_ID_MAP: Record<string, string> = {
  "Offre classique": "prod_SzeJ4QAAb4xq0E",
  "Offre Last Minute": "prod_SzeKEfPLmPy8kq",
  "Offre Boostées": "prod_SzeKhzG0NYTZNa",
};

// URL de base pour les appels API (configurable via env, fallback production)
const API_BASE_URL = Capacitor.isNativePlatform()
  ? (process.env.NEXT_PUBLIC_API_BASE_URL || "https://job-around-me.com")
  : "";

/**
 * Vérifie si Google Pay est disponible sur l'appareil
 * @returns true si Google Pay est disponible, false sinon
 */
export async function isGooglePayAvailable(): Promise<boolean> {
  // Google Pay uniquement sur Android natif
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") {
    return false;
  }

  try {
    // Initialiser Stripe avant de vérifier la disponibilité
    await initializeStripeNative();

    // Timeout de 5 secondes pour éviter les blocages
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 5000)
    );

    await Promise.race([
      Stripe.isGooglePayAvailable(),
      timeoutPromise
    ]);

    return true;
  } catch (error) {
    console.error("Google Pay not available:", error);
    return false;
  }
}

/**
 * Processus complet de paiement Google Pay
 * @param config Configuration du paiement (items, email, etc.)
 * @returns Résultat du paiement avec succès/échec et paymentIntentId
 */
export async function processGooglePayPayment(
  config: GooglePayConfig
): Promise<GooglePayResult> {
  try {
    console.log("[GooglePay] Step 1: Initializing Stripe Native...");
    await initializeStripeNative();
    console.log("[GooglePay] Step 1: Done");

    console.log("[GooglePay] Step 2: Checking availability...");
    const available = await isGooglePayAvailable();
    console.log("[GooglePay] Step 2: Available =", available);
    if (!available) {
      return { success: false, error: "Google Pay not available on this device" };
    }

    // 3. Filtrer les items avec quantité > 0 et calculer le montant total en centimes
    const validItems = config.items.filter((item) => Number(item.quantity) > 0);
    console.log("[GooglePay] Step 3: Raw items =", JSON.stringify(validItems));
    const totalAmount = validItems.reduce((sum, item) => sum + Number(item.amount) * Number(item.quantity), 0);
    const amountInCents = Math.round(totalAmount * 100);
    console.log("[GooglePay] Step 3: Items =", validItems.length, "Total =", totalAmount, "€ (", amountInCents, "cents)");

    // 4. Créer le PaymentIntent côté serveur
    const apiUrl = `${API_BASE_URL}/api/stripe/create-payment-intent`;
    console.log("[GooglePay] Step 4: Creating PaymentIntent on", apiUrl);
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: amountInCents,
        currency: CURRENCY.toLowerCase(),
        customerEmail: config.customerEmail,
        customerId: config.customerId,
        metadata: { ...config.metadata, source: "google_pay" },
        description: validItems.map((i) => `${i.label} x${i.quantity}`).join(", "),
      }),
    });
    console.log("[GooglePay] Step 4: Response status =", response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error("[GooglePay] Step 4: Error =", JSON.stringify(error));
      return { success: false, error: error.error || "Failed to create payment" };
    }

    const { paymentIntentClientSecret, paymentIntentId } = await response.json();
    console.log("[GooglePay] Step 4: PaymentIntent created =", paymentIntentId);

    // 5. Configurer les listeners d'événements
    const listeners = setupGooglePayListeners();
    console.log("[GooglePay] Step 5: Listeners setup done");

    // 6. Créer la session Google Pay
    console.log("[GooglePay] Step 6: Creating Google Pay session...");
    await Stripe.createGooglePay({
      paymentIntentClientSecret,
      paymentSummaryItems: validItems.map((item) => ({
        label: `${item.label} x${item.quantity}`,
        amount: Number(item.amount) * Number(item.quantity),
      })),
      merchantDisplayName: MERCHANT_DISPLAY_NAME,
      countryCode: COUNTRY_CODE,
      currency: CURRENCY,
    });
    console.log("[GooglePay] Step 6: Google Pay session created");

    // 7. Présenter le sheet Google Pay
    console.log("[GooglePay] Step 7: Presenting Google Pay sheet...");
    const result = await Stripe.presentGooglePay();
    console.log("[GooglePay] Step 7: Result =", JSON.stringify(result));

    // 8. Nettoyer les listeners
    listeners.forEach((listener) => listener.remove());

    // 9. Traiter le résultat
    if (result.paymentResult === GooglePayEventsEnum.Completed) {
      console.log("[GooglePay] Step 9: Payment completed, confirming...");
      await confirmAndSavePurchase(paymentIntentId, validItems, config.customerId, config.customerEmail);
      return { success: true, paymentIntentId };
    }

    if (result.paymentResult === GooglePayEventsEnum.Canceled) {
      console.log("[GooglePay] Step 9: Payment canceled");
      return { success: false, error: "Payment canceled by user" };
    }

    console.log("[GooglePay] Step 9: Payment failed with result =", result.paymentResult);
    return { success: false, error: "Payment failed" };
  } catch (error) {
    console.error("[GooglePay] EXCEPTION:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Configure les listeners d'événements Google Pay
 * @returns Array de listeners à nettoyer après utilisation
 */
function setupGooglePayListeners() {
  const listeners = [
    Stripe.addListener(GooglePayEventsEnum.Loaded, () => {
      console.log("Google Pay sheet loaded");
    }),
    Stripe.addListener(GooglePayEventsEnum.FailedToLoad, () => {
      console.error("Google Pay sheet failed to load");
    }),
    Stripe.addListener(GooglePayEventsEnum.Completed, () => {
      console.log("Google Pay payment completed");
    }),
    Stripe.addListener(GooglePayEventsEnum.Canceled, () => {
      console.log("Google Pay payment canceled");
    }),
    Stripe.addListener(GooglePayEventsEnum.Failed, () => {
      console.error("Google Pay payment failed");
    }),
  ];

  return listeners;
}

/**
 * Confirme le paiement et sauvegarde l'achat côté serveur
 * @param paymentIntentId ID du PaymentIntent à confirmer
 * @param items Items achetés avec quantités
 * @param customerId ID du client Stripe
 * @param customerEmail Email du client
 */
async function confirmAndSavePurchase(
  paymentIntentId: string,
  items: PaymentItem[],
  customerId?: string,
  customerEmail?: string
): Promise<void> {
  try {
    // 1. Confirmer le paiement et récupérer les détails
    const confirmResponse = await fetch(`${API_BASE_URL}/api/stripe/confirm-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentIntentId }),
    });

    const confirmData = await confirmResponse.json();

    // 2. Si le paiement est confirmé, sauvegarder l'achat
    if (confirmData.success && customerId) {
      // Mapper les labels vers les product_ids Stripe
      const products = items.map((item) => ({
        product_id: PRODUCT_ID_MAP[item.label] || item.label,
        quantity: item.quantity,
      }));

      await fetch(`${API_BASE_URL}/api/stripe/save-purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId,
          customerId,
          customerEmail,
          products,
          receiptUrl: confirmData.receiptUrl,
          amount: confirmData.amount,
          receiptTitle: paymentIntentId,
        }),
      });

      console.log("Purchase saved successfully for Google Pay");
    }
  } catch (error) {
    console.error("Failed to confirm/save payment on server:", error);
    // Le paiement a réussi côté Stripe, on log juste l'erreur
  }
}
