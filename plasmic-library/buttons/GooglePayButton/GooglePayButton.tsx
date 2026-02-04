import React, { useState, useEffect, useCallback } from "react";
import {
  isGooglePayAvailable,
  processGooglePayPayment,
  PaymentItem,
} from "@/lib/stripe/googlePayService";

export interface GooglePayButtonProps {
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

export default function GooglePayButton({
  items,
  customerEmail,
  customerId,
  metadata,
  onSuccess,
  onError,
  onCancel,
  className,
  disabled,
  buttonText = "Payer avec Google Pay",
}: GooglePayButtonProps) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(true);

  // Vérifier la disponibilité au montage
  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const available = await isGooglePayAvailable();
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
      const result = await processGooglePayPayment({
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

  // Ne rien afficher si en cours de vérification ou non disponible
  if (checkingAvailability || !isAvailable) {
    return null;
  }

  // Calculer le total pour l'affichage
  const total = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <button
      onClick={handlePayment}
      disabled={disabled || isLoading || !items.length}
      className={`google-pay-button ${className || ""}`}
      style={{
        backgroundColor: "#fff",
        color: "#1a1a1a",
        border: "1px solid #e0e0e0",
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
        boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
        transition: "all 0.2s ease",
      }}
    >
      {isLoading ? (
        <span>TRAITEMENT...</span>
      ) : (
        <>
          {/* Logo Google "G" minimaliste */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          <span>{buttonText}</span>
        </>
      )}
    </button>
  );
}

// Export des types pour utilisation externe
export type { PaymentItem };
