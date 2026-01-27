import { useState, useEffect, useCallback } from "react";
import {
  isGooglePayAvailable,
  processGooglePayPayment,
  GooglePayConfig,
  GooglePayResult,
} from "@/lib/stripe/googlePayService";

interface UseGooglePayOptions {
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

interface UseGooglePayReturn {
  isAvailable: boolean;
  isLoading: boolean;
  isChecking: boolean;
  pay: (config: GooglePayConfig) => Promise<GooglePayResult>;
}

export function useGooglePay(options: UseGooglePayOptions = {}): UseGooglePayReturn {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Vérifier la disponibilité au montage
  useEffect(() => {
    const check = async () => {
      try {
        const available = await isGooglePayAvailable();
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
    async (config: GooglePayConfig): Promise<GooglePayResult> => {
      if (!isAvailable) {
        const error = "Google Pay not available";
        options.onError?.(error);
        return { success: false, error };
      }

      setIsLoading(true);

      try {
        const result = await processGooglePayPayment(config);

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
