import type React from "react";
import { isValidElement, cloneElement } from "react";
import { X } from "lucide-react";

export interface ConfirmModalProps {
  title?: string;
  description?: string;

  iconSlot?: React.ReactNode;
  cancelButtonSlot?: React.ReactNode;
  confirmButtonSlot?: React.ReactNode;

  modalPosition?: "top" | "middle" | "bottom";

  onCancel: () => void;
  onConfirm: () => void;

  show: boolean;
  loading?: boolean;
}

export const ConfirmModal = ({
  title = "Voulez-vous résilier votre abonnement ?",
  description = "Votre abonnement sera actif jusqu’à la fin du mois en cours. Sans abonnement, vous ne pourrez plus utiliser la plateforme.",

  iconSlot,
  cancelButtonSlot,
  confirmButtonSlot,

  modalPosition = "middle",

  onCancel,
  onConfirm,

  show,
  loading = false,
}: ConfirmModalProps) => {
  if (!show) return null;

  // Fonction utilitaire pour injecter onClick dans un slot React valide
  const injectOnClick = (node: React.ReactNode, onClick: () => void) => {
    if (isValidElement(node)) {
      const element = node as React.ReactElement<any>;
      return cloneElement(element, {
        onClick: (e: React.MouseEvent) => {
          if (element.props.onClick) {
            element.props.onClick(e);
          }
          onClick();
        },
        disabled: loading || element.props.disabled, // on propage disabled
      });
    }
    return node;
  };

  const alignItems =
    modalPosition === "top"
      ? "flex-start"
      : modalPosition === "bottom"
      ? "flex-end"
      : "center";

  const containerStyle: React.CSSProperties = {
    alignItems,
    ...(modalPosition === "top" && { marginTop: 40 }),
    ...(modalPosition === "bottom" && { marginBottom: 40 }),
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center"
      style={{ alignItems }}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md text-center relative"
        style={containerStyle}
      >
        <button type="button" className="absolute top-4 right-4" onClick={onCancel}>
          <X />
        </button>
        {iconSlot && <div className="mb-4 flex justify-center">{iconSlot}</div>}
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <p className="text-sm text-gray-600 mb-6">{description}</p>
        <div className="flex justify-center gap-4">
          {cancelButtonSlot
            ? injectOnClick(cancelButtonSlot, onCancel)
            : (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-lg border"
                disabled={loading}
              >
                Annuler
              </button>
            )}
          {confirmButtonSlot
            ? injectOnClick(confirmButtonSlot, onConfirm)
            : (
              <button
                type="button"
                onClick={onConfirm}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                disabled={loading}
              >
                {loading ? "Chargement..." : "Confirmer"}
              </button>
            )}
        </div>
      </div>
    </div>
  );
};
