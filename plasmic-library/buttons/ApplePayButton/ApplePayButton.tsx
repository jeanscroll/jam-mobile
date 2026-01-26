import React, { useState, useEffect, useCallback } from "react";
import {
  isApplePayAvailable,
  processApplePayPayment,
  PaymentItem,
} from "@/lib/stripe/applePayService";

export interface ApplePayButtonProps {
  // Items à payer
  items: PaymentItem[];

  // Informations client
  customerEmail?: string;
  customerId?: string;

  // Metadata personnalisées
  metadata?: Record<string, string>;

  // Callbacks
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;

  // Style
  className?: string;
  disabled?: boolean;

  // Texte personnalisé
  buttonText?: string;
}

export default function ApplePayButton({
  items,
  customerEmail,
  customerId,
  metadata,
  onSuccess,
  onError,
  onCancel,
  className,
  disabled,
  buttonText = "Payer avec Apple Pay",
}: ApplePayButtonProps) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(true);

  // Vérifier la disponibilité au montage
  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const available = await isApplePayAvailable();
        setIsAvailable(available);
      } catch {
        setIsAvailable(false);
      } finally {
        setCheckingAvailability(false);
      }
    };

    checkAvailability();
  }, []);

  // Handler de paiement
  const handlePayment = useCallback(async () => {
    if (isLoading || !items.length) return;

    setIsLoading(true);

    try {
      const result = await processApplePayPayment({
        items,
        customerEmail,
        customerId,
        metadata,
      });

      if (result.success && result.paymentIntentId) {
        onSuccess?.(result.paymentIntentId);
      } else if (result.error?.includes("canceled")) {
        onCancel?.();
      } else {
        onError?.(result.error || "Payment failed");
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [items, customerEmail, customerId, metadata, onSuccess, onError, onCancel, isLoading]);

  // Ne pas afficher si pas disponible ou en cours de vérification
  if (checkingAvailability) {
    return null;
  }

  if (!isAvailable) {
    return null;
  }

  // Calculer le total pour l'affichage
  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <button
      onClick={handlePayment}
      disabled={disabled || isLoading || !items.length}
      className={`apple-pay-button ${className || ""}`}
      style={{
        backgroundColor: "#000",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        padding: "12px 24px",
        fontSize: "16px",
        fontWeight: 600,
        cursor: disabled || isLoading ? "not-allowed" : "pointer",
        opacity: disabled || isLoading ? 0.6 : 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        minHeight: "48px",
        width: "100%",
      }}
    >
      {isLoading ? (
        <span>Traitement en cours...</span>
      ) : (
        <>
          {/* Logo Apple Pay */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M7.078 23.55c-.473-.316-.893-.703-1.244-1.15-.383-.463-.738-.95-1.064-1.454-.766-1.12-1.365-2.345-1.78-3.636-.5-1.502-.743-2.94-.743-4.347 0-1.57.34-2.94 1.002-4.09.49-.9 1.22-1.653 2.1-2.182.85-.53 1.84-.82 2.84-.84.35 0 .73.05 1.13.15.29.08.64.21 1.07.37.55.21.85.34.95.37.32.12.59.17.8.17.16 0 .39-.05.645-.13.145-.05.42-.14.81-.31.386-.14.692-.26.935-.35.37-.11.728-.21 1.05-.26.39-.06.777-.08 1.148-.05.71.05 1.36.2 1.94.42 1.02.41 1.843 1.05 2.457 1.96-.26.16-.5.346-.725.55-.487.43-.9.94-1.23 1.505-.43.753-.65 1.64-.65 2.58 0 1.14.25 2.1.81 2.93.53.79 1.21 1.39 2.02 1.79-.15.44-.33.86-.54 1.26-.38.72-.79 1.41-1.22 2.06-.52.78-1.01 1.32-1.49 1.66-.54.38-1.14.59-1.79.62-.42 0-.9-.1-1.45-.29-.52-.19-1.01-.29-1.44-.29-.45 0-.93.1-1.46.29-.54.19-1 .3-1.4.3-.67 0-1.28-.24-1.81-.69zm5.65-18.9c-.74.02-1.5.28-2.19.76-.64.44-1.13 1.01-1.5 1.7-.27.49-.44 1.04-.53 1.62.05 0 .1 0 .17.01.26.01.51.06.75.13.49.14.93.37 1.32.66.52.39.95.87 1.27 1.43.1-.1.2-.19.3-.29.4-.38.73-.83.98-1.34.28-.56.46-1.14.54-1.74.01-.1.01-.2.01-.3-.42-.08-.84-.2-1.24-.36-.34-.14-.66-.32-.96-.54l.08-.04z" />
          </svg>
          <span>{buttonText}</span>
        </>
      )}
    </button>
  );
}

// Export des types pour utilisation externe
export type { PaymentItem };
