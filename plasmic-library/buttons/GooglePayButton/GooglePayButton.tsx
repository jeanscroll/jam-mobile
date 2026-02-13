import React, { useState, useEffect, useCallback, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import {
  isGooglePayAvailable,
  processGooglePayPayment,
  PaymentItem,
} from "@/lib/stripe/googlePayService";
import { GooglePayButtonNative } from "@/lib/capacitor/googlePayButtonPlugin";

export interface GooglePayButtonProps {
  items: PaymentItem[];
  customerEmail?: string;
  customerId?: string;
  metadata?: Record<string, string>;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [nativeAvailable, setNativeAvailable] = useState(false);
  const [buttonCreated, setButtonCreated] = useState(false);

  const validItems = items.filter((item) => item.quantity > 0);

  // Vérifier la disponibilité native (Capacitor/Android uniquement)
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") {
      return;
    }

    isGooglePayAvailable()
      .then((available) => setNativeAvailable(available))
      .catch(() => setNativeAvailable(false));
  }, []);

  // Handler de paiement via le flow Capacitor Stripe existant
  const handlePayment = useCallback(async () => {
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
  }, [
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
  ]);

  // Créer le bouton natif et écouter les événements
  useEffect(() => {
    if (!nativeAvailable || !containerRef.current || !validItems.length) return;

    const rect = containerRef.current.getBoundingClientRect();

    let clickListener: { remove: () => void } | null = null;
    let mounted = true;

    const setup = async () => {
      try {
        await GooglePayButtonNative.create({
          top: Math.round(rect.top),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });

        if (!mounted) {
          await GooglePayButtonNative.remove();
          return;
        }

        setButtonCreated(true);

        clickListener = await GooglePayButtonNative.addListener(
          "onClick",
          () => {
            handlePayment();
          }
        );
      } catch (error) {
        console.error("[GooglePayButton] Failed to create native button:", error);
      }
    };

    setup();

    return () => {
      mounted = false;
      clickListener?.remove();
      GooglePayButtonNative.remove().catch(() => {});
      setButtonCreated(false);
    };
  }, [nativeAvailable, validItems.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Synchroniser la position du bouton natif avec le scroll/resize
  useEffect(() => {
    if (!buttonCreated || !containerRef.current) return;

    let rafId: number | null = null;

    const syncPosition = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      // Masquer si le placeholder est hors écran
      const isVisible =
        rect.top < window.innerHeight &&
        rect.bottom > 0 &&
        rect.left < window.innerWidth &&
        rect.right > 0;

      if (isVisible) {
        GooglePayButtonNative.updatePosition({
          top: Math.round(rect.top),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        }).catch(() => {});
        GooglePayButtonNative.setVisible({ visible: true }).catch(() => {});
      } else {
        GooglePayButtonNative.setVisible({ visible: false }).catch(() => {});
      }
    };

    const onScrollOrResize = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(syncPosition);
    };

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });

    // Sync initial
    syncPosition();

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [buttonCreated]);

  // Gérer disabled/isLoading en masquant le bouton natif
  useEffect(() => {
    if (!buttonCreated) return;

    GooglePayButtonNative.setVisible({
      visible: !(disabled || isLoading),
    }).catch(() => {});
  }, [buttonCreated, disabled, isLoading]);

  // Ne rien afficher si non natif Android ou pas d'items
  if (!nativeAvailable || !validItems.length) {
    return null;
  }

  // Div placeholder transparent — le bouton natif se positionne dessus
  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: "100%",
        minHeight: 48,
        opacity: disabled || isLoading ? 0.6 : 1,
        transition: "opacity 0.2s ease",
      }}
    />
  );
}

export type { PaymentItem };
