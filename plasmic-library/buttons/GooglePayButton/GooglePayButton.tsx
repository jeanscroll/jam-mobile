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
      className={`google-pay-button ${className || ""}`}
      style={{
        backgroundColor: "#fff",
        color: "#3c4043",
        border: "1px solid #dadce0",
        borderRadius: "8px",
        padding: "12px 24px",
        fontSize: "16px",
        fontWeight: 500,
        cursor: disabled || isLoading ? "not-allowed" : "pointer",
        opacity: disabled || isLoading ? 0.6 : 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        minHeight: "48px",
        width: "100%",
        boxShadow: "0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)",
      }}
    >
      {isLoading ? (
        <span>Traitement en cours...</span>
      ) : (
        <>
          {/* Logo Google Pay */}
          <svg
            width="41"
            height="17"
            viewBox="0 0 41 17"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M19.526 2.635v4.083h2.518c.6 0 1.096-.202 1.488-.605.403-.402.605-.882.605-1.437 0-.544-.202-1.018-.605-1.422-.392-.413-.888-.62-1.488-.62h-2.518zm0 5.52v4.736h-1.504V1.198h3.99c1.013 0 1.873.337 2.582 1.012.72.675 1.08 1.497 1.08 2.466 0 .991-.36 1.819-1.08 2.482-.697.665-1.559.997-2.583.997h-2.485z"
              fill="#5F6368"
            />
            <path
              d="M27.194 10.442c0 .544.2 1.012.6 1.404.412.403.903.605 1.476.605.574 0 1.064-.202 1.476-.605.4-.392.6-.86.6-1.404 0-.544-.2-1.012-.6-1.404-.412-.403-.902-.605-1.476-.605-.573 0-1.064.202-1.476.605-.4.392-.6.86-.6 1.404zm5.627-3.15h1.44v6.36h-1.44v-.756c-.584.646-1.367.97-2.35.97-.96 0-1.777-.348-2.452-1.045-.676-.695-1.013-1.553-1.013-2.574 0-1.02.337-1.878 1.013-2.574.675-.697 1.492-1.045 2.451-1.045.984 0 1.767.313 2.351.94v-.726z"
              fill="#5F6368"
            />
            <path
              d="M36.986 13.652h-1.44V7.29h1.44v.97c.465-.756 1.141-1.134 2.028-1.134.812 0 1.45.273 1.916.82.465.548.697 1.32.697 2.315v3.39h-1.44V10.5c0-.608-.14-1.073-.418-1.396-.278-.322-.669-.483-1.172-.483-.536 0-.965.183-1.288.55-.322.365-.483.88-.483 1.543v2.938h.16z"
              fill="#5F6368"
            />
            <path
              d="M4.89 8.527c0-.468-.04-.92-.114-1.356H.012v2.566h2.737a2.342 2.342 0 0 1-1.014 1.537v1.28h1.64c.96-.885 1.514-2.19 1.514-4.027z"
              fill="#4285F4"
            />
            <path
              d="M.012 14.21c1.373 0 2.524-.453 3.365-1.228l-1.64-1.28c-.456.307-1.038.49-1.725.49-1.327 0-2.45-.895-2.852-2.1H.012v1.318c.834 1.656 2.543 2.8 4.467 2.8z"
              fill="#34A853"
            />
            <path
              d="M1.16 10.092a2.903 2.903 0 0 1 0-1.86V6.914H.012a4.905 4.905 0 0 0 0 4.496l1.148-1.318z"
              fill="#FBBC04"
            />
            <path
              d="M.012 5.054c.747 0 1.417.257 1.945.762l1.458-1.458C2.524 3.554 1.373 3.1.012 3.1c-1.924 0-3.633 1.144-4.467 2.8l1.148 1.318c.403-1.206 1.526-2.1 2.852-2.1l.467-.064z"
              fill="#EA4335"
            />
          </svg>
          <span>{buttonText}</span>
        </>
      )}
    </button>
  );
}

// Export des types pour utilisation externe
export type { PaymentItem };
