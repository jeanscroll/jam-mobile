import { Stripe, GooglePayEventsEnum } from "@capacitor-community/stripe";
import { Capacitor } from "@capacitor/core";
import { initializeStripeNative } from "./stripeNative";

// Types
export interface PaymentItem {
  label: string;
  amount: number; // En euros (ex: 10.99)
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
    await Stripe.isGooglePayAvailable();
    return true;
  } catch {
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
    // 1. Initialiser Stripe Native si pas déjà fait
    await initializeStripeNative();

    // 2. Vérifier la disponibilité
    const available = await isGooglePayAvailable();
    if (!available) {
      return { success: false, error: "Google Pay not available on this device" };
    }

    // 3. Calculer le montant total en centimes
    const totalAmount = config.items.reduce((sum, item) => sum + item.amount, 0);
    const amountInCents = Math.round(totalAmount * 100);

    // 4. Créer le PaymentIntent côté serveur
    const response = await fetch("/api/stripe/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: amountInCents,
        currency: CURRENCY.toLowerCase(),
        customerEmail: config.customerEmail,
        customerId: config.customerId,
        metadata: config.metadata,
        description: config.items.map((i) => i.label).join(", "),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || "Failed to create payment" };
    }

    const { paymentIntentClientSecret, paymentIntentId } = await response.json();

    // 5. Configurer les listeners d'événements
    const listeners = setupGooglePayListeners();

    // 6. Créer la session Google Pay
    await Stripe.createGooglePay({
      paymentIntentClientSecret,
      paymentSummaryItems: config.items.map((item) => ({
        label: item.label,
        amount: item.amount,
      })),
      merchantDisplayName: MERCHANT_DISPLAY_NAME,
      countryCode: COUNTRY_CODE,
      currency: CURRENCY,
    });

    // 7. Présenter le sheet Google Pay
    const result = await Stripe.presentGooglePay();

    // 8. Nettoyer les listeners
    listeners.forEach((listener) => listener.remove());

    // 9. Traiter le résultat
    if (result.paymentResult === GooglePayEventsEnum.Completed) {
      // Confirmer le paiement côté serveur
      await confirmPaymentOnServer(paymentIntentId);
      return { success: true, paymentIntentId };
    }

    if (result.paymentResult === GooglePayEventsEnum.Canceled) {
      return { success: false, error: "Payment canceled by user" };
    }

    return { success: false, error: "Payment failed" };
  } catch (error) {
    console.error("Google Pay error:", error);
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
 * Confirme le paiement côté serveur après succès Google Pay
 * @param paymentIntentId ID du PaymentIntent à confirmer
 */
async function confirmPaymentOnServer(paymentIntentId: string): Promise<void> {
  try {
    await fetch("/api/stripe/confirm-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentIntentId }),
    });
  } catch (error) {
    console.error("Failed to confirm payment on server:", error);
    // Le paiement a réussi côté Stripe, on log juste l'erreur
  }
}
