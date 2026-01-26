import { useState, useEffect, useCallback } from "react";
import {
  isApplePayAvailable,
  processApplePayPayment,
  ApplePayConfig,
  ApplePayResult,
} from "@/lib/stripe/applePayService";

interface UseApplePayOptions {
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

interface UseApplePayReturn {
  /** Apple Pay est disponible sur l'appareil */
  isAvailable: boolean;
  /** Paiement en cours */
  isLoading: boolean;
  /** Vérification de disponibilité en cours */
  isChecking: boolean;
  /** Fonction pour lancer le paiement */
  pay: (config: ApplePayConfig) => Promise<ApplePayResult>;
}

/**
 * Hook React pour gérer les paiements Apple Pay
 *
 * @example
 * ```tsx
 * const { isAvailable, isLoading, pay } = useApplePay({
 *   onSuccess: (id) => console.log('Paid:', id),
 *   onError: (err) => console.error(err),
 * });
 *
 * const handlePay = () => {
 *   pay({
 *     items: [{ label: 'Product', amount: 9.99 }],
 *     customerEmail: 'user@example.com',
 *   });
 * };
 * ```
 */
export function useApplePay(options: UseApplePayOptions = {}): UseApplePayReturn {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Vérifier la disponibilité au montage
  useEffect(() => {
    const check = async () => {
      try {
        const available = await isApplePayAvailable();
        setIsAvailable(available);
      } catch {
        setIsAvailable(false);
      } finally {
        setIsChecking(false);
      }
    };

    check();
  }, []);

  // Fonction de paiement
  const pay = useCallback(
    async (config: ApplePayConfig): Promise<ApplePayResult> => {
      if (!isAvailable) {
        const error = "Apple Pay not available";
        options.onError?.(error);
        return { success: false, error };
      }

      setIsLoading(true);

      try {
        const result = await processApplePayPayment(config);

        if (result.success && result.paymentIntentId) {
          options.onSuccess?.(result.paymentIntentId);
        } else if (result.error?.includes("canceled")) {
          options.onCancel?.();
        } else if (result.error) {
          options.onError?.(result.error);
        }

        return result;
      } finally {
        setIsLoading(false);
      }
    },
    [isAvailable, options]
  );

  return {
    isAvailable,
    isLoading,
    isChecking,
    pay,
  };
}

// Export des types
export type { ApplePayConfig, ApplePayResult } from "@/lib/stripe/applePayService";
