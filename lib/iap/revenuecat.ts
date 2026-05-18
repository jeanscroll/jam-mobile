// lib/iap/revenuecat.ts
//
// Thin wrapper around the RevenueCat Capacitor SDK so the rest of the app
// doesn't have to import the heavy native plugin directly. Every helper is a
// no-op on web/Android — RevenueCat is only used on iOS as the StoreKit/IAP
// gateway (see plan: ios-iap branch).

import { Capacitor } from "@capacitor/core";
import {
  Purchases,
  LOG_LEVEL,
  type PurchasesOffering,
  type PurchasesPackage,
  type MakePurchaseResult,
} from "@revenuecat/purchases-capacitor";

let initialized = false;
let lastOfferingError: string | null = null;

/**
 * Returns the last RevenueCat error encountered (if any) so the UI can show
 * a useful message instead of an indefinite "Loading…" state.
 */
export const getLastIapError = (): string | null => lastOfferingError;

/**
 * RevenueCat is currently only wired for iOS. Returning false everywhere else
 * lets the helpers be safely called from shared code without runtime errors.
 */
export const isIAPAvailable = (): boolean =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";

/**
 * Initialise the SDK once per app session. Must be called before any other
 * RevenueCat method. Subsequent calls are no-ops.
 */
export async function initRevenueCat(
  supabaseUserId: string | null
): Promise<void> {
  if (!isIAPAvailable() || initialized) return;

  const apiKey = process.env.NEXT_PUBLIC_REVENUECAT_IOS_KEY;
  if (!apiKey) {
    lastOfferingError =
      "Clé RevenueCat absente du build (NEXT_PUBLIC_REVENUECAT_IOS_KEY).";
    console.warn(`[RevenueCat] ${lastOfferingError}`);
    return;
  }

  try {
    // DEBUG temporairement pour diagnostiquer pourquoi les packs ne
    // s'affichent pas en TestFlight. Repasser en WARN une fois stable.
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    await Purchases.configure({
      apiKey,
      appUserID: supabaseUserId ?? undefined,
    });
    initialized = true;
    console.log(
      `[RevenueCat] configured (key prefix ${apiKey.slice(0, 6)}, user=${supabaseUserId ?? "anon"})`
    );
  } catch (err: any) {
    lastOfferingError = `RC configure failed: ${err?.message ?? err}`;
    console.error("[RevenueCat]", lastOfferingError);
  }
}

/**
 * Bind the current Supabase user to RevenueCat. Call this on SIGNED_IN.
 * Safe to call multiple times — RevenueCat dedupes internally.
 */
export async function loginRevenueCat(supabaseUserId: string): Promise<void> {
  if (!isIAPAvailable() || !initialized) return;
  try {
    await Purchases.logIn({ appUserID: supabaseUserId });
  } catch (err) {
    console.error("[RevenueCat] logIn failed:", err);
  }
}

/**
 * Reset RevenueCat to an anonymous user. Call this on SIGNED_OUT so the next
 * sign-in correctly attributes purchases to the new account.
 */
export async function logoutRevenueCat(): Promise<void> {
  if (!isIAPAvailable() || !initialized) return;
  try {
    await Purchases.logOut();
  } catch (err) {
    // logOut throws if the current user is already anonymous — non-fatal.
    console.warn("[RevenueCat] logOut warning:", err);
  }
}

/**
 * Returns the current "default" offering configured in the RevenueCat dashboard,
 * or null if no offering is available (iOS not configured, network down, etc.).
 */
export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!isIAPAvailable()) {
    lastOfferingError = "IAP non disponible sur cette plateforme.";
    return null;
  }
  if (!initialized) {
    lastOfferingError =
      lastOfferingError ?? "RevenueCat non initialisé (pas encore prêt ?).";
    return null;
  }
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) {
      const all = Object.keys(offerings.all ?? {});
      lastOfferingError = `Aucun offering "current" côté RevenueCat. Offerings trouvés: [${all.join(", ") || "aucun"}].`;
      console.warn("[RevenueCat]", lastOfferingError);
      return null;
    }
    if (current.availablePackages.length === 0) {
      lastOfferingError = `L'offering "${current.identifier}" n'a aucun package. Vérifier le dashboard RC.`;
      console.warn("[RevenueCat]", lastOfferingError);
      return null;
    }
    console.log(
      `[RevenueCat] offering loaded: ${current.identifier} with ${current.availablePackages.length} package(s)`,
      current.availablePackages.map((p) => p.product.identifier)
    );
    lastOfferingError = null;
    return current;
  } catch (err: any) {
    lastOfferingError = `getOfferings failed: ${err?.message ?? err}`;
    console.error("[RevenueCat]", lastOfferingError);
    return null;
  }
}

/**
 * Trigger the StoreKit purchase flow for the given package. The promise resolves
 * once the purchase is completed AND validated by RevenueCat. The returned
 * customerInfo reflects the new entitlements.
 */
export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<MakePurchaseResult> {
  if (!isIAPAvailable() || !initialized) {
    throw new Error("RevenueCat is not available on this platform");
  }
  return Purchases.purchasePackage({ aPackage: pkg });
}

/**
 * Re-syncs the user's purchases from the App Store. Required to be exposed
 * visibly in the UI per Apple guideline 3.1.1 ("Restore Purchases" button).
 */
export async function restorePurchases() {
  if (!isIAPAvailable() || !initialized) return null;
  try {
    return await Purchases.restorePurchases();
  } catch (err) {
    console.error("[RevenueCat] restorePurchases failed:", err);
    return null;
  }
}

export type { PurchasesOffering, PurchasesPackage, MakePurchaseResult };
