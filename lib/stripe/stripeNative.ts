import { Stripe } from "@capacitor-community/stripe";
import { Capacitor } from "@capacitor/core";

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
const MERCHANT_IDENTIFIER = "merchant.jam.mobile";

let isInitialized = false;

/**
 * Initialise le plugin Stripe Native pour Capacitor
 * À appeler une seule fois au démarrage de l'app sur plateforme native
 */
export async function initializeStripeNative(): Promise<void> {
  if (isInitialized) return;

  // Ne pas initialiser sur le web
  if (!Capacitor.isNativePlatform()) {
    console.log("Stripe Native: Web platform detected, skipping initialization");
    return;
  }

  try {
    await Stripe.initialize({
      publishableKey: PUBLISHABLE_KEY,
      stripeAccount: undefined,
      merchantIdentifier: MERCHANT_IDENTIFIER,
    });
    isInitialized = true;
    console.log("Stripe Native initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Stripe Native:", error);
    throw error;
  }
}

/**
 * Vérifie si l'app tourne sur une plateforme native (iOS/Android)
 */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Retourne la plateforme actuelle (web, ios, android)
 */
export function getPlatform(): string {
  return Capacitor.getPlatform();
}

/**
 * Vérifie si le plugin Stripe est initialisé
 */
export function isStripeInitialized(): boolean {
  return isInitialized;
}
