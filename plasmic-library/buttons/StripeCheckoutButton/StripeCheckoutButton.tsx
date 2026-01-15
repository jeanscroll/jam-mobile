import * as React from "react";
import type { HTMLElementRefOf } from "@plasmicapp/react-web";
import { useState, cloneElement, isValidElement } from "react";
import { loadStripe } from "@stripe/stripe-js";

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
  } = props;

  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const filteredItems = items.filter((item) => item.quantity > 0);
      if (filteredItems.length === 0) {
        alert("Votre panier est vide.");
        return;
      }

      const res = await fetch("/api/stripe/create-checkout-session", {
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
