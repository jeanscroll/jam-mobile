import { Stripe, ApplePayEventsEnum } from "@capacitor-community/stripe";
import { Capacitor } from "@capacitor/core";
import { initializeStripeNative } from "./stripeNative";

// Types
export interface PaymentItem {
  label: string;
  amount: number; // En euros (ex: 10.99)
}

export interface ApplePayConfig {
  items: PaymentItem[];
  customerEmail?: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

export interface ApplePayResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
}

// Constantes
const MERCHANT_IDENTIFIER = "merchant.jam.mobile";
const MERCHANT_DISPLAY_NAME = "JAM Mobile";
const COUNTRY_CODE = "FR";
const CURRENCY = "EUR";

/**
 * Vérifie si Apple Pay est disponible sur l'appareil
 * @returns true si Apple Pay est disponible, false sinon
 */
export async function isApplePayAvailable(): Promise<boolean> {
  // Apple Pay uniquement sur iOS natif
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") {
    return false;
  }

  try {
    await Stripe.isApplePayAvailable();
    return true;
  } catch {
    return false;
  }
}

/**
 * Processus complet de paiement Apple Pay
 * @param config Configuration du paiement (items, email, etc.)
 * @returns Résultat du paiement avec succès/échec et paymentIntentId
 */
export async function processApplePayPayment(
  config: ApplePayConfig
): Promise<ApplePayResult> {
  try {
    // 1. Initialiser Stripe Native si pas déjà fait
    await initializeStripeNative();

    // 2. Vérifier la disponibilité
    const available = await isApplePayAvailable();
    if (!available) {
      return { success: false, error: "Apple Pay not available on this device" };
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
    const listeners = setupApplePayListeners();

    // 6. Créer la session Apple Pay
    await Stripe.createApplePay({
      paymentIntentClientSecret,
      paymentSummaryItems: config.items.map((item) => ({
        label: item.label,
        amount: item.amount,
      })),
      merchantIdentifier: MERCHANT_IDENTIFIER,
      merchantDisplayName: MERCHANT_DISPLAY_NAME,
      countryCode: COUNTRY_CODE,
      currency: CURRENCY,
    });

    // 7. Présenter le sheet Apple Pay
    const result = await Stripe.presentApplePay();

    // 8. Nettoyer les listeners
    listeners.forEach((listener) => listener.remove());

    // 9. Traiter le résultat
    if (result.paymentResult === ApplePayEventsEnum.Completed) {
      // Confirmer le paiement côté serveur
      await confirmPaymentOnServer(paymentIntentId);
      return { success: true, paymentIntentId };
    }

    if (result.paymentResult === ApplePayEventsEnum.Canceled) {
      return { success: false, error: "Payment canceled by user" };
    }

    return { success: false, error: "Payment failed" };
  } catch (error) {
    console.error("Apple Pay error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Configure les listeners d'événements Apple Pay
 * @returns Array de listeners à nettoyer après utilisation
 */
function setupApplePayListeners() {
  const listeners = [
    Stripe.addListener(ApplePayEventsEnum.Loaded, () => {
      console.log("Apple Pay sheet loaded");
    }),
    Stripe.addListener(ApplePayEventsEnum.FailedToLoad, () => {
      console.error("Apple Pay sheet failed to load");
    }),
    Stripe.addListener(ApplePayEventsEnum.Completed, () => {
      console.log("Apple Pay payment completed");
    }),
    Stripe.addListener(ApplePayEventsEnum.Canceled, () => {
      console.log("Apple Pay payment canceled");
    }),
    Stripe.addListener(ApplePayEventsEnum.Failed, () => {
      console.error("Apple Pay payment failed");
    }),
  ];

  return listeners;
}

/**
 * Confirme le paiement côté serveur après succès Apple Pay
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
