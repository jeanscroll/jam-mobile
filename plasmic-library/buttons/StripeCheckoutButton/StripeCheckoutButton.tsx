import * as React from "react";
import type { HTMLElementRefOf } from "@plasmicapp/react-web";
import { useState, cloneElement, isValidElement } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { getApiBaseUrl } from "@/lib/utils";

export interface StripeItem {
  price: string;
  quantity: number;
}

export interface StripeCheckoutButtonProps {
  items: StripeItem[];
  clientReferenceId?: string;
  customerEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  /**
   * On iOS, App Store Review rejects in-app purchases of digital content via
   * non-IAP mechanisms (Stripe). Instead of opening Stripe Checkout, the
   * button opens this URL in the system browser so the user can pay on the web.
   * Defaults to the employer offer page for backwards compatibility.
   */
  iosFallbackUrl?: string;
}

function StripeCheckoutButton_(
  props: StripeCheckoutButtonProps,
  ref: HTMLElementRefOf<"button">
) {
  const {
    items,
    clientReferenceId,
    customerEmail,
    successUrl,
    cancelUrl,
    children,
    disabled = false,
    className,
    onSuccess,
    onError,
    iosFallbackUrl,
  } = props;

  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
      await Browser.open({
        url: iosFallbackUrl || "https://job-around-me.com/offre-employeur",
      });
      return;
    }

    setLoading(true);
    try {
      const filteredItems = items.filter((item) => item.quantity > 0);
      if (filteredItems.length === 0) {
        alert("Votre panier est vide.");
        return;
      }

      const res = await fetch(`${getApiBaseUrl()}/api/stripe/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: filteredItems,
          client_reference_id: clientReferenceId,
          customer_email: customerEmail,
          success_url: successUrl,
          cancel_url: cancelUrl,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erreur Stripe");
      }

      const { sessionId } = await res.json();

      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");
      if (!stripe) throw new Error("Stripe.js non initialisé");

      await stripe.redirectToCheckout({ sessionId });
      onSuccess?.();
    } catch (error: any) {
      console.error("Erreur paiement Stripe :", error);
      alert("Une erreur est survenue. Merci de réessayer.");
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  // Cas où children est un élément React valide
  if (isValidElement(children)) {
    return cloneElement(children as React.ReactElement<any>, {
      onClick: handleClick,
      disabled: disabled || loading,
      className,
      ref,
    });
  }

  // Fallback : bouton par défaut
  return (
    <button
      type="button"
      ref={ref}
      className={className}
      disabled={disabled || loading}
      onClick={handleClick}
    >
      {loading ? "Chargement..." : children || "Payer"}
    </button>
  );
}

const StripeCheckoutButton = React.forwardRef(StripeCheckoutButton_);
export default StripeCheckoutButton;
