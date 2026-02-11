import React, { useState, useEffect, useCallback, useMemo } from "react";
import GPay from "@google-pay/button-react";
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
}: GooglePayButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [nativeAvailable, setNativeAvailable] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(true);

  // Vérifier la disponibilité native (Capacitor/Android) au montage
  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const available = await isGooglePayAvailable();
        setNativeAvailable(available);
      } catch {
        setNativeAvailable(false);
      } finally {
        setCheckingAvailability(false);
      }
    };

    checkAvailability();
  }, []);

  // Filtrer les items valides (quantité > 0)
  const validItems = items.filter((item) => item.quantity > 0);

  // Calculer le total pour le paymentRequest
  const total = useMemo(
    () =>
      validItems
        .reduce((sum, item) => sum + item.amount * item.quantity, 0)
        .toFixed(2),
    [validItems]
  );

  // PaymentRequest requis par le composant officiel Google Pay
  const paymentRequest = useMemo(
    () => ({
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [
        {
          type: "CARD" as const,
          parameters: {
            allowedAuthMethods: [
              "PAN_ONLY" as const,
              "CRYPTOGRAM_3DS" as const,
            ],
            allowedCardNetworks: [
              "VISA" as const,
              "MASTERCARD" as const,
              "AMEX" as const,
            ],
          },
          tokenizationSpecification: {
            type: "PAYMENT_GATEWAY" as const,
            parameters: {
              gateway: "stripe",
              "stripe:version": "2024-06-20",
              "stripe:publishableKey":
                process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
            },
          },
        },
      ],
      merchantInfo: {
        merchantId: process.env.NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID || "TEST",
        merchantName: "JAM Mobile",
      },
      transactionInfo: {
        totalPriceStatus: "FINAL" as const,
        totalPriceLabel: "Total",
        totalPrice: total,
        currencyCode: "EUR",
        countryCode: "FR",
      },
    }),
    [total]
  );

  // Handler de paiement — intercepte le clic pour utiliser le flow natif Capacitor
  const handleClick = useCallback(
    async (event: Event) => {
      // Empêcher l'ouverture du sheet Google Pay web
      event.preventDefault();

      if (isLoading || disabled || !validItems.length) return;

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
    },
    [
      validItems,
      items,
      customerEmail,
      customerId,
      metadata,
      onSuccess,
      onError,
      onCancel,
      isLoading,
      disabled,
    ]
  );

  // Ne rien afficher si en cours de vérification, non disponible en natif, ou pas d'items
  if (checkingAvailability || !nativeAvailable || !validItems.length) {
    return null;
  }

  return (
    <div
      className={className}
      style={{
        opacity: disabled || isLoading ? 0.6 : 1,
        pointerEvents: disabled || isLoading ? "none" : "auto",
        transition: "opacity 0.2s ease",
      }}
    >
      <GPay
        environment={
          process.env.NODE_ENV === "production" ? "PRODUCTION" : "TEST"
        }
        paymentRequest={paymentRequest}
        buttonColor="black"
        buttonType="pay"
        buttonSizeMode="fill"
        buttonRadius={8}
        buttonLocale="fr"
        onClick={handleClick}
        onCancel={() => onCancel?.()}
        onError={(error) => onError?.(String(error))}
        style={{ width: "100%", minHeight: 48 }}
      />
    </div>
  );
}

// Export des types pour utilisation externe
export type { PaymentItem };
