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

  // Filtrer les items valides (quantité > 0)
  const validItems = items.filter((item) => item.quantity > 0);

  // Handler de paiement
  const handlePayment = useCallback(async () => {
    if (isLoading || !validItems.length) return;

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
  }, [validItems, customerEmail, customerId, metadata, onSuccess, onError, onCancel, isLoading]);

  // Ne rien afficher si en cours de vérification ou non disponible
  if (checkingAvailability || !isAvailable) {
    return null;
  }

  // Calculer le total pour l'affichage
  const total = validItems.reduce((sum, item) => sum + item.amount * item.quantity, 0);

  return (
    <button
      onClick={handlePayment}
      disabled={disabled || isLoading || !validItems.length}
      className={`apple-pay-button ${className || ""}`}
      style={{
        backgroundColor: "#000",
        color: "#fff",
        border: "none",
        borderRadius: "16px",
        padding: "12px 24px",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "16px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        cursor: disabled || isLoading ? "not-allowed" : "pointer",
        opacity: disabled || isLoading ? 0.6 : 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        minHeight: "48px",
        width: "100%",
        transition: "all 0.2s ease",
      }}
    >
      {isLoading ? (
        <span>TRAITEMENT...</span>
      ) : (
        <>
          {/* Logo Apple minimaliste */}
          <svg
            width="18"
            height="22"
            viewBox="0 0 814 1000"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
          </svg>
          <span>{buttonText}</span>
        </>
      )}
    </button>
  );
}

// Export des types pour utilisation externe
export type { PaymentItem };
