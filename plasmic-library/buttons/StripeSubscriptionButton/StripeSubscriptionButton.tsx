import * as React from "react";
import type { HTMLElementRefOf } from "@plasmicapp/react-web";
import { useState, cloneElement, isValidElement } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { ConfirmModal } from "./ConfirmModal";

export interface StripeSubscriptionButtonProps {
  stripeAction: "create" | "update" | "cancel";
  priceId?: string;
  customerId?: string;
  customerEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onStatusChange?: (status: "success" | "error") => void;

  // Props confirmation modal
  confirmTitle?: string;
  confirmDescription?: string;
  confirmIconSlot?: React.ReactNode;
  confirmButtonSlot?: React.ReactNode;
  cancelButtonSlot?: React.ReactNode;
  modalPosition?: "top" | "middle" | "bottom";
  showConfirmationModal?: boolean;
}

function StripeSubscriptionButton_(
  props: StripeSubscriptionButtonProps,
  ref: HTMLElementRefOf<"button">
) {
  const {
    stripeAction,
    priceId,
    customerId,
    customerEmail,
    successUrl,
    cancelUrl,
    children,
    disabled = false,
    onSuccess,
    onError,
    onStatusChange,

    confirmTitle = "Voulez-vous vraiment procéder ?",
    confirmDescription = "Cette action est irréversible.",
    confirmIconSlot,
    confirmButtonSlot,
    cancelButtonSlot,
    modalPosition = "middle",
    showConfirmationModal = true,
  } = props;

  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleConfirm = async () => {
    setShowConfirmModal(false);
    setLoading(true);

    try {
      if (stripeAction === "cancel" && !customerId) {
        throw new Error("customerId requis pour annuler l'abonnement");
      }

      if (stripeAction === "cancel") {
        const res = await fetch("/api/stripe/manage-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "cancel", customerEmail, customerId }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Erreur lors de l’annulation");
        }

        onStatusChange?.("success");
        onSuccess?.();
      } else {
        const stripe = await loadStripe(
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
        );
        if (!stripe) throw new Error("Stripe.js non initialisé");

        const res = await fetch("/api/stripe/manage-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: stripeAction,
            priceId,
            customerId,
            customerEmail,
            successUrl,
            cancelUrl,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Erreur lors de la gestion de l’abonnement");
        }

        const data = await res.json();

        if (stripeAction === "create") {
          onStatusChange?.("success");
          await stripe.redirectToCheckout({ sessionId: data.sessionId });
        } else if (stripeAction === "update") {
          if (!data.success) {
            throw new Error("La mise à jour de l'abonnement a échoué");
          }
          onStatusChange?.("success");
          onSuccess?.();
        }
      }
    } catch (error: any) {
      console.error("Erreur Stripe :", error);
      alert(error.message);
      onError?.(error);
      if (stripeAction !== "create") {
        onStatusChange?.("error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (
      (stripeAction === "cancel" || stripeAction === "update") &&
      showConfirmationModal
    ) {
      setShowConfirmModal(true);
      return;
    }
    handleConfirm();
  };

  return (
    <>
      <ConfirmModal
        show={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={handleConfirm}
        title={confirmTitle}
        description={confirmDescription}
        iconSlot={confirmIconSlot}
        confirmButtonSlot={confirmButtonSlot}
        cancelButtonSlot={cancelButtonSlot}
        modalPosition={modalPosition}
        loading={loading}
      />

      {isValidElement(children)
        ? cloneElement(children as React.ReactElement<any>, {
            onClick: handleClick,
            disabled: disabled || loading,
            ref,
          })
        : (
          <button
            type="button"
            ref={ref}
            disabled={disabled || loading}
            onClick={handleClick}
          >
            {loading ? "Chargement..." : children || "Abonnement"}
          </button>
        )}
    </>
  );
}

const StripeSubscriptionButton = React.forwardRef(StripeSubscriptionButton_);
export default StripeSubscriptionButton;
